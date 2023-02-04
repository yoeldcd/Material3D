
M3D.SoundContext.prototype.enable = function () {

    if (!this.isEnable) {
        this.isEnable = true;
        this.audioContext.resume();

    }

};

M3D.SoundContext.prototype.disable = function () {
    if (this.isEnable && this.connectedsNodes === 0) {
        this.isEnable = false;
        this.audioContext.suspend();

    }

    return !this.enable;
};

M3D.SoundContext.prototype.playSoundTrack = function (source) {
    var soundTrack;

    //use or get sound track from list
    if (source instanceof M3D.SoundTrack)
        soundTrack = source;
    else
        soundTrack = this.soundTracks.getByName(source);

    if (soundTrack)
        soundTrack.play();

};

M3D.SoundContext.prototype.pauseSoundTrack = function (source) {
    var soundTrack;

    //use or get sound track from list
    if (source instanceof M3D.SoundTrack)
        soundTrack = source;
    else
        soundTrack = this.soundTracks.getByName(source);

    if (soundTrack)
        soundTrack.pause();

};

M3D.SoundContext.prototype.playTrack = function (track) {
    var promise;

    try {

        //create one input audio node
        if (!track.audioNode)
            track.audioNode = this.audioContext.createMediaElementSource(track.media);

        //connect input node to output channel
        track.audioNode.connect(this.audioFilter);
        this.connectedsNodes++;

        //try to play media 
        promise = track.media.play();
        track.playing = true;
        this.enable();

        if (promise)
            promise.catch(function (e) {
                console.error(e);
                track.media.onended();

            });


    } catch (e) {
        console.error(e);

    }

};

M3D.SoundContext.prototype.pauseTrack = function (track) {

    try {

        //disconect input node to output channel
        track.audioNode.disconnect(this.audioFilter);
        track.media.pause();
        track.playing = false;

        //disable audio renderer
        this.connectedsNodes--;
        this.disable();

    } catch (e) {
        console.error(e);

    }

    return false;
};

//Track class constructor and properties
////////////////////////////////////////////////////////////////////////////
M3D.AudioTrack = function (source) {

    this.self = null;
    this.media = new Audio();
    this.soundContext = null;
    this.audioNode = null;
    this.playing = false;

    this.media.track = this;
    this.media.onended = M3D.AudioTrack.onended;
    this.setSource(source);

};

M3D.AudioTrack.prototype.setSoundContext = function (soundContext) {

    //first pause audio
    if (this.playing)
        this.pause();

    this.soundContext = soundContext;
    this.audioNode = null;
    this.connected = false;

};

M3D.AudioTrack.prototype.setSource = function (source) {

    //first pause audio
    if (this.playing)
        this.pause();

    //define media element source
    if (source) {
        if (source instanceof window.HTMLMediaElement)   //use source object
            this.media.src = source.src;
        if (source instanceof window.MediaSource)        //use source media stream
            this.media.src = URL.createObjectURL(source);
        if (source instanceof window.Blob)               //use source media stream blob
            this.media.src = URL.createObjectURL(source);
        else if (typeof source === 'string')             //use source URL
            this.media.src = source;
        else {                                           //
            console.error('Invalid audio source ' + source);

        }
    }

};

M3D.AudioTrack.prototype.play = function () {

    if (this.soundContext) {
        this.soundContext.playTrack(this);

    } else {
        this.media.play();
        this.playing = true;

    }

};

M3D.AudioTrack.prototype.pause = function () {
    if (this.soundContext && this.soundContext.audioNode) {
        this.soundContext.pauseTrack(this);

    } else {
        this.media.pause();
        this.playing = false;

    }
};

M3D.AudioTrack.onended = function () {
    var track = this.track;

    //pause track and freeze output channel
    if (track.playing) {
        if (track.soundContext)
            track.soundContext.pauseTrack(track);
        else
            track.playing = false;
    }

};

//SoundTrack class constructor and methoods
////////////////////////////////////////////////////////////////////////////
M3D.SoundTrack = function (name, source, hasLoop, volume) {
    isNaN(volume) && (volume = 100);

    defineUneditableProperty(this, 'id', elementID++);

    this.name = name;
    this.loop = hasLoop;
    this.volume = volume;

    defineUneditableProperty(this, 'audioTrack', new M3D.AudioTrack(source));

};

M3D.SoundTrack.prototype.setSoundContext = function (soundContext) {
    this.audioTrack.setSoundContext(soundContext);

};

M3D.SoundTrack.prototype.play = function (reset) {
    var audioTrack = this.audioTrack;

    if (!audioTrack.playing) {

        audioTrack.media.volume = this.volume / 100;
        audioTrack.media.loop = this.loop;

        //play or resumne source audio track
        audioTrack.play(true);

    }

    //reset media track to (0:00)
    if (reset)
        this.media.currentTime = 0.0;

};

M3D.SoundTrack.prototype.pause = function () {

    //pause source audio track
    if (this.audioTrack.playing)
        this.audioTrack.pause();

};

//SoundContext SoundPool class constructor and methoods
////////////////////////////////////////////////////////////////////////////
M3D.SoundPool = function (name, source, number, volume) {
    isNaN(number) && (number = 5);
    isNaN(volume) && (volume = 100);

    var container, audioTrack, listNode;

    defineUneditableProperty(this, 'id', elementID++);
    defineUneditableProperty(this, 'audioTracks', new Array(number));
    defineUneditableProperty(this, 'audioTracksAvaliables', new M3D.Stack(number));
    defineUneditableProperty(this, 'audioTracksPlaying', new M3D.List());
    defineUneditableProperty(this, 'audioTracksNumber', number);

    this.name = name;
    this.volume = volume;

    //initialize all audio tracks instances
    for (var i = 0; i < number; i++) {
        container = {};
        listNode = new M3Dp.Node(container);

        //create one playeable audio track
        audioTrack = new M3D.AudioTrack();
        audioTrack.container = container;
        audioTrack.media.onended = M3Dp.SoundPool.onended;

        container.soundPool = this;
        container.audioTrack = audioTrack;
        container.listNode = listNode;

        this.audioTracksAvaliables.push(listNode);
        this.audioTracks[i] = audioTrack;
    }

    //set audio media source
    if (source)
        this.setAudioTracksSource(source);

};

M3D.SoundPool.prototype = Object.create(M3D.SoundTrack.prototype);

M3D.SoundPool.prototype.setSoundContext = function (soundContext) {
    var number = this.audioTracksNumber;

    for (var i = 0; i < number; i++) {
        this.audioTracks[i].setSoundContext(soundContext);
    }

};

M3D.SoundPool.prototype.setAudioTracksSource = function (source) {
    //load audio source stream
    var xhr;
    var mediaSourceURL = '';

    //select source audio URL
    if (source instanceof window.HTMLMediaElement)
        mediaSourceURL = source.src;
    else if (typeof source === 'string')
        mediaSourceURL = source;
    else
        ;

    //request audio stream data
    if (mediaSourceURL) {
        xhr = new XMLHttpRequest();
        xhr.open('GET', mediaSourceURL, true);

        xhr.self = this;
        xhr.responseType = 'blob';
        xhr.onload = function () {
            console.log('Loaded source audio stream at URL: ' + mediaSourceURL);
            M3Dp.SoundPool.setAudioTracksSource.call(xhr.self, xhr.response);

        };
        xhr.onerror = function () {
            console.error('Don\'t loaded source audio stream at URL: ' + mediaSourceURL);
            M3Dp.SoundPool.setAudioTracksSource.call(xhr.self, mediaSourceURL);

        };

        xhr.send(null);

    } else {
        M3Dp.SoundPool.setAudioTracksSource.call(this, source);

    }

};

M3D.SoundPool.prototype.play = function () {
    var listNode = this.audioTracksAvaliables.pop();

    if (listNode) {
        //play source audio element
        listNode.data.audioTrack.media.volume = this.volume / 100.0;
        listNode.data.audioTrack.play();

        //add to played track's stack
        this.audioTracksPlaying.addNode(listNode);
    }

};

M3D.SoundPool.prototype.pause = function () {
    var listNode = this.audioTracksPlaying.head;

    while (listNode) {

        //pause and store audio track in node
        listNode.data.audioTrack.pause();
        this.audioTracksAvaliables.push(listNode);

        listNode = listNode.next;
    }

};

M3Dp.SoundPool = {};

M3Dp.SoundPool.setAudioTracksSource = function (source) {
    var number = this.audioTracksNumber;

    for (var i = 0; i < number; i++)
        this.audioTracks[i].setSource(source);

};

M3Dp.SoundPool.onended = function () {

    var container = this.track.container;
    M3D.AudioTrack.onended.call(this);

    //store audio track instance
    container.soundPool.audioTracksPlaying.removeNode(container.listNode);
    container.soundPool.audioTracksAvaliables.push(container.listNode);

};

    