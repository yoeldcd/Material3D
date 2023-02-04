
var audioRootFolder = '../../audio/';
var modelsRootFolder = '../../models/Game/';
var particlesRootFolder = '../../particles/';

/////////////////////// ENVIROMENT RESOURCES
var glCanvas;
var guiCanvas;

var scene;
var camera;
var gameCamera;
var renderer;
var animator;
var soundContext;
var context2D;
var fpsCounter;
var settings;

var modelAssets;
var audioAssets;

/////////////////////// OBJECT STORAGE
var user;
var builder;
var stars;
var asteroids;
var proyectiles;
var bitcoins;

var recycledAsteroids;
var recycledProyectiles;
var recycledExploiders;
var recycledCoins;

var contMakedAsteroids;
var contMakedProyectiles;
var contMakedExploiders;
var contMakedBitcoins;

var controllerShip;
var controllerMapBuilder;
var controllerStars;
var controllerAsteroid;
var controllerProyectil;
var controllerExploider;
var controllerPowerUp;

/////////////////////// GAME VALUES
var level;
var lifes;
var time;
var progress;
var experience;
var levelFinished;

var lastTime = 0;
var deltaTime = 0;


var typeBonusModels = ['clock', 'life'];

////////////////////// GAME RESOURCES
var gameAssets;
var avatarAssets;
var sceneAssets;

var backgroundColor;
var ambientLigth;
var sumLigth;

var backgroundTrack;
var explosionSound;
var launchSound;
var bonusSound;

/////////////////////// GAME STATES
var isMobileGame = false;
var isPlaying = false;
var isGaming = false;
var isDebuging = true;

/////////////////////// CONTROL VALUES
var screenWidth = 0;
var screenHeight = 0;
var screenRatio = 0;
var spaceHeight = 0;
var spaceWidth = 0;

var isUserControlEnable = true;
var isUserMoving = false;
var userMotionEvents;
var userKeyEvents;

function main() {

    //get output canvases
    glCanvas = document.getElementById("glCanvas");
    guiCanvas = document.getElementById("guiCanvas");

    //initialize render elements
    scene = new M3D.Scene();
    camera = new M3D.Camera();
    renderer = new M3D.SceneRenderer(glCanvas);
    animator = new M3D.Animator();
    context2D = guiCanvas.getContext("2d");
    fpsCounter = new M3D.FPSCounter();
    soundContext = new M3D.SoundContext();

    //initialize user events storages
    userMotionEvents = new M3D.Stack();
    userKeyEvents = new Array(256);

    //initialize assets lists
    modelAssets = new M3D.List();
    audioAssets = new M3D.List();

    //load user settings
    loadSettings();

    //define window event's listener
    window.onresize = updateRendererOutputDimensions;
    window.onbeforeunload = saveSettings;

    //define focus events listener 
    document.onvisibilitychange = function () {
        if (document.hidden)
            pause();
        else
            play();
        
    };

    //import game resources
    loadGameAssets();

    //initialize game enviroment
    initializeGame();
    startGameLevel();

}

//////////////////////////////////////////////
//Game Data Storage Access

function saveSettings() {

    //store formated data structure
    if (window.localStorage)
        localStorage.setItem('USER_SETTINGS', JSON.stringify(settings));

}

function loadSettings() {
    var settingsJSON = null;

    if (!isDebuging && window.localStorage) {
        //load formated data structure on storage
        settingsJSON = localStorage.getItem('USER_SETTINGS', null);

        //parse to one object data structure
        if (settingsJSON)
            settings = JSON.parse(settingsJSON);

    }

    //use default sttings
    if (!settings) {
        settings = {
            SCREEN_RESOLUTION: 0.5,
            USER_REGISTRED: false,
            USER_NAME: 'USER',
            USER_EXPERIENCE: 0,
            MUSIC_ENABLE: confirm("MUSIC_ENABLE", true),
            SOUND_ENABLE: confirm("SOUND_ENABLE", true),
            USER_LIFES: 100,
            USER_LEVEL: parseInt(prompt('LEVEL', '1')),
            USER_COINS: 100,
            FIRE_DELAY: 0.05,
            FIRE_STRENGH: 100,
            FIRE_RATE: 1
        };
    }

    //get execution platform type
    isMobileGame = navigator.userAgent.lastIndexOf('Android') > 0;

}

function loadGameAssets() {
    var particleGenerator;
    var particleSystem;
    var particleSprite;

    //import game models assets
    gameAssets = importModelAsset('GameAssets.obj');
    avatarAssets = importModelAsset('AlphaSpaceShip.obj');

    //create particles systems
    particleGenerator = new ParticlesGenerator.RadialGenerator(0, 360, -90, 90, 0.1, 0.3);
    particleSystem = ParticlesGenerator.generateParticlesSystem(renderer.gl, 150, particleGenerator, null);
    particleSystem.isLoopeable = true;
    particleSystem.isResizeable = true;
    scene.addModel(particleSystem, 'EXPLOSION');

    particleGenerator = new ParticlesGenerator.RadialGenerator(-45, 45, -45, 45, 0.1, 0.5);
    particleSprite = new ParticlesGenerator.SpritesColection(renderer.gl, particlesRootFolder + 'Smook.png', 1, 1);
    particleSystem = ParticlesGenerator.generateParticlesSystem(renderer.gl, 100, particleGenerator, particleSprite);
    particleSystem.isLoopeable = true;
    particleSystem.isResizeable = true;
    scene.addModel(particleSystem, 'BACKFIRE');

    particleGenerator = new ParticlesGenerator.LinealGenerator([0, 0, 1], [1, 0, 1], 0.05, 0.3);
    particleSprite = new ParticlesGenerator.SpritesColection(renderer.gl, particlesRootFolder + 'Stars.png', 2, 2, 3);
    particleSystem = ParticlesGenerator.generateParticlesSystem(renderer.gl, 200, particleGenerator, particleSprite);
    particleSystem.isLoopeable = true;
    scene.addModel(particleSystem, 'BACKGROUND');


    //load sound efects tracks
    if (settings.SOUND_ENABLE) {
        launchSound = soundContext.generateSoundPool("LAUNCH_SOUND", audioRootFolder + "figthSound.ogg", 25);
        explosionSound = soundContext.generateSoundPool("EXPLOSION_SOUND", audioRootFolder + "explosionSound.ogg", 25);
        bonusSound = soundContext.generateSoundPool("BONUS_SOUND", audioRootFolder + "bonusSound.ogg", 25);

        soundContext.addSound(launchSound);
        soundContext.addSound(explosionSound);
        soundContext.addSound(bonusSound);

    }

}

function importAudioAsset(name) {
    var audioAsset = audioAssets.getByName(name);   //search audio on cache

    //import required audio source
    if (settings.MUSIC_ENABLE && !audioAsset) {
        audioAsset = soundContext.generateSoundTrack(name, audioRootFolder + name, 10, true);

        //store audio on cache
        audioAssets.add(audioAsset);
        soundContext.addSound(audioAsset);
    }

    return audioAsset;
}

function importModelAsset(name) {
    var modelAsset = modelAssets.getByName(name);   //search model on cache
    var model;
    var number;

    //load required model
    if (!modelAsset) {
        model = OBJModelLoader.loadOBJFile(renderer.gl, modelsRootFolder + name, 1.0);

        //create asset resource diccionary
        modelAsset = {};
        number = model.objects.length;
        for (var i = 0; i < number; i++) {
            //extrect asset submdels name
            modelAsset[model.objects[i].name.split('_')[0]] = i;

        }

        //define asset properties
        modelAsset.name = name;
        modelAsset.model = model;
        modelAsset.assetsNumber = number;

        //store model on cache
        scene.addModel(model, name);
        modelAssets.add(modelAsset);
    }

    return modelAsset;
}

//////////////////////////////////////////////
//Miscelaneous functions
function getMinimizedValue(value) {
    //select value reduction factor
    if (value >= 100000000) // > 100M
        return Math.floor(value /= 1000000000) + '.' + Math.floor(value * 10 % 10) + 'G';
    else if (value >= 100000) // > 100K
        return Math.floor(value /= 1000000) + '.' + Math.floor(value * 10 % 10) + 'M';
    else if (value >= 100) // > 100u
        return Math.floor(value /= 1000) + '.' + Math.floor(value * 10 % 10) + 'K';
    else
        return value;

}

function getFireAsset(strengh) {

    //select proyectil model from asset-dictionary
    if(strengh <= 100)
        return gameAssets.laserSmallGreen;
    else if(strengh <= 300)
        return gameAssets.laserSmallBlue;
    else if(strengh <= 500)
        return gameAssets.laserSmallRed;
    else if(strengh <= 1000)
        return gameAssets.laserBigYellow;
    else if(strengh <= 3000)
        return gameAssets.laserBigGreen;
    else if(strengh <= 5000)
        return gameAssets.laserBigBlue;
    else if(strengh <= 10000)
        return gameAssets.laserBigYellow;
    else if(strengh <= 20000)
        return gameAssets.laserBigRed;
    else
        return gameAssets.laserBigViolete;

}

function showValue(value, x, y, color) {

    //interpolate space coordinates to real screen coordinates
    x = (x / spaceWidth / screenRatio * 0.5 + 0.5) * 512;       //compute 1 GLpoint on X = ? px of screen width
    y = (y / spaceHeight * 0.5 + 0.5) * 512;                    //compute 1 GLpoint on Y = ? px of screen height

    context2D.font = '15px monospace';
    context2D.fillStyle = color || 'white';
    context2D.fillText(getMinimizedValue(value), x - 20, y - 22);

}

//////////////////////////////////////////////
//new asteroids addition function by type
function addAsteroid(builder, descriptorValue, x, z) {

    //separe asteroid type and geometry index using value. Exp: 11 => type: 1, index: 0
    var type = Math.floor(descriptorValue / 10);         //get computed type (decenes)
    var subtype = Math.floor(descriptorValue % 10);      //get computed subtype (units)

    var asteroid = recycledAsteroids.pop();              //try to recycle one asteroid
    var controller;

    //initialize one new asteroid if has not recycled one
    if (!asteroid) {
        asteroid = new M3D.Object();                    //make entity object
        asteroid.setController(controllerAsteroid);     //make entity controller

    }

    //set asteroid values
    asteroid.type = type * 10;                           //set asteroid type
    asteroid.setCoords(x, 0.5, z);                       //set initial coordinates
    controller = asteroid.controller;                    //get entity controller

    //set asteroid power strengh (TYPE => 0.5 y PROGRESS => 0.5) = (0.1 - 1.0) * MAX_STRENGH
    controller.strengh = Math.floor(level.asteroidStrengh * ((subtype + 1) * 0.05 + progress * 0.5));

    //configure controller values by type
    switch (type) {
        case 0:  //CASE SINGLE
            controller.update = updatedAsteroidSingle;                  //set update handler
            controller.speedZ = level.asteroidSpeed;                    //set vertical speed
            asteroid.model.objObjectIndex = builder.types[subtype];     //set renderable model

            //set asteroid vertical limit
            if (!builder.isWhaiting)
                controller.maxz = spaceHeight + 5;
            else
                controller.maxz = -builder.cycle * builder.asteroidDistance + z + 25;

            break;

        case 1:  //CASE JUMPER
            controller.update = updateAsteroidJumper;                   //set update handler

            controller.speedX = x < 0 ? -level.asteroidSpeed : level.asteroidSpeed; //set horizontal speed 
            controller.speedZ = level.asteroidSpeed;                    //set vertical speed
            asteroid.model.objObjectIndex = builder.types[subtype];     //set renderable model

            break;

        case 2:  //CASE COMPLEX
            controller.update = updateAsteroidComplex;                  //set update handler
            controller.time = 0.0;                                      //reset internal time counter
            controller.lifeTime = level.asteroidLifeTime || 10;         //set min life tiem

            controller.speedX = x < 0 ? -level.asteroidSpeed/2 : level.asteroidSpeed/2; //set horizontal speed
            controller.speedZ = level.asteroidSpeed;                    //set vertical speed
            asteroid.model.objObjectIndex = builder.types[subtype];     //set renderable model

            break;

        case 3: //CASE LAUNCHER
            controller.time = 0.0;                                      //reset internal time counter
            controller.update = updateAsteroidLauncher;                 //set update handler
            asteroid.setRotation(0, 0, 0);

            controller.speedZ = level.asteroidSpeed;                    //set vertical speed
            asteroid.model.objObjectIndex = sceneAssets.launcher1;      //set renderable model

            //set asteroid vertical limit
            if (!builder.isWhaiting)
                controller.maxz = spaceHeight + 5;
            else
                controller.maxz = -builder.cycle * builder.asteroidDistance + z + 25;

            break;
    }

    //add asteroid to scene
    asteroids.addNode(controller.asteroidListNode);
    scene.addObject(asteroid);
    asteroid.update();

}

function addBitcoin(x, z) {
    var bitcoin = recycledCoins.pop();  //reuse one recycle coin

    if (!bitcoin) {
        //initialize one new coin
        bitcoin = new M3D.Object();                     //make entity object
        bitcoin.setController(controllerBitcoin);       //make entity controller

        //configure entity values
        bitcoin.controller.speedZ = level.asteroidSpeed;//set vertical speed

    }

    //set bit-coin values
    bitcoin.setCoords(x, 0, z);                     //set initial coordinates
    bitcoin.rotation.y = 0;                         //set Y axis angle

    //add bit-coin to scene
    bitcoins.addNode(bitcoin.controller.coinListNode);
    scene.addObject(bitcoin);
    bitcoin.update();

}

function addPowerUp(type, x, z) {

    var powerType = typeBonusModels[type];                    //get type name

    var powerUp = new M3D.Object();                           //make entity object
    powerUp.setController(controllerPowerUp);                 //make entity controller

    //configure entity controller
    powerUp.controller.powerType = type;
    powerUp.controller.speedX = level.asteroidSpeed * 0.5;    //def horizontal speed
    powerUp.controller.speedZ = level.asteroidSpeed * 0.6;    //def vertical speed

    //set object values
    powerUp.model.objObjectIndex = gameAssets[powerType];     //def renderable submodel
    powerUp.setCoords(x, 0, z);                               //set initial coordinates

    //add powerUp to scene
    console.log('ADDED POWER_UPP ' + powerType);
    scene.addObject(powerUp);
    powerUp.update();

}

function addExploider(coords) {
    var exploider = recycledExploiders.pop();   //reuse one recycled exploider

    if (!exploider) {
        //initialize one new exploider
        exploider = new M3D.Object();                   //make entity obejct
        exploider.setController(controllerExploider);   //make entity controller

    }

    //set exploider values
    exploider.setCoords(coords.x, coords.y, coords.z);  //set initial coordinates

    //start explosion sound efect
    if (settings.SOUND_ENABLE)
        soundContext.playSound(explosionSound);

    //add exploider to scene
    scene.addObject(exploider);
    exploider.update();

}

//recycle functions
function recycleAsteroid(asteroid) {
    scene.removeObject(asteroid);                                //remove from scene
    asteroids.removeNode(asteroid.controller.asteroidListNode);  //remove from list
    recycledAsteroids.push(asteroid);                            //recycle it

}

function recycleProyectil(proyectil) {
    scene.removeObject(proyectil);                                   //remove from scene
    proyectiles.removeNode(proyectil.controller.proyectilListNode);  //remove from list
    recycledProyectiles.push(proyectil);                             //recycle it

    //console.log('%cRECYCLED ' + proyectil.name + ' [' + proyectiles.size + '] ', 'color: rgb(255,100,200);');
}

function recycleBitcoin(bitcoin) {
    scene.removeObject(bitcoin);                            //remove from scene
    bitcoins.removeNode(bitcoin.controller.coinListNode);      //remove from list
    recycledCoins.push(bitcoin);                            //recycle it

}

function recycleExploider(exploider) {
    scene.removeObject(exploider);                            //remove from scene
    recycledExploiders.push(exploider);                            //recycle it

}

function destroyUser() {
    var iterator, obj;
    addExploider(user.coords);      //add explosion
    user.controller.reset();        //reset user states
    lifes--;                        //decrease lifes number
    lifes *= -1;                    //enable blink mechanism (NEGATIVE LIFES)

    user.coords.y = 0.5;

    //recycle all asteroids
    iterator = asteroids.iterate();
    while ((obj = iterator.next())) {
        recycleAsteroid(obj);

    }

    //recycle all bitcoins
    iterator = bitcoins.iterate();
    while ((obj = iterator.next())) {
        recycleBitcoin(obj);

    }

    //recycle all proyectiles
    iterator = proyectiles.iterate();
    while ((obj = iterator.next())) {
        recycleProyectil(obj);

    }

    console.groupEnd('Destroy');
}

//typed asteroid update handlers
function updatedAsteroidSingle(object) {

    if (object.coords.z >= spaceHeight + 5) {
        recycleAsteroid(object);
    } else if (lifes > 0) {

        //update entity values
        if (object.coords.z < this.maxz)
            object.coords.z += this.speedZ * deltaTime;

        object.rotation.y += this.speedBeta * deltaTime;
        object.rotation.z += this.speedGanma * deltaTime;

        if (user.geometry.hasColition(object.geometry))
            destroyUser(object);

        showValue(this.strengh, object.coords.x, object.coords.z - 0.5, 'cyan');
    }
}

function updateAsteroidJumper(object) {

    if (object.coords.z >= spaceHeight + 5)
        recycleAsteroid(object);             //recycle disabled asteroid
    else {

        //update entity values
        object.coords.x += this.speedX * deltaTime;
        object.coords.z += this.speedZ * deltaTime;
        object.rotation.y += this.speedBeta * deltaTime;
        object.rotation.z += this.speedGanma * deltaTime;

        //eval if need jump horizontaly 
        if (Math.abs(object.coords.x) >= spaceWidth / 2)
            this.speedX = object.coords.x > 0 ? -level.asteroidSpeed : level.asteroidSpeed;

        if (lifes > 0) {

            if (user.geometry.hasColition(object.geometry))
                destroyUser(object);

            showValue(this.strengh, object.coords.x, object.coords.z - 0.5, 'cyan');
        }
    }

}

function updateAsteroidComplex(object) {

    if (Math.abs(object.coords.z) >= spaceHeight + 5)
        if (this.time <= this.lifeTime)     //jump vertically
            this.speedZ = object.coords.z > 0 ? -level.asteroidSpeed : level.asteroidSpeed;
        else                                //recycle disabled asteroid
            recycleAsteroid(object);
    else {
        if (Math.abs(object.coords.x) >= spaceWidth / 2)  //jump horizontally 
            this.speedX = object.coords.x > 0 ? -level.asteroidSpeed : level.asteroidSpeed;

        if (lifes > 0) {
            if (user.geometry.hasColition(object.geometry))
                destroyUser(object);

            showValue(this.strengh, object.coords.x, object.coords.z - 0.5, 'cyan');
        }

        //update entity values
        object.coords.z += this.speedZ * deltaTime;
        object.coords.x += this.speedX * deltaTime;
        object.rotation.y += this.speedBeta * deltaTime;
        object.rotation.z += this.speedGanma * deltaTime;

        this.time += deltaTime;

    }

}

function updateAsteroidLauncher(object) {

    if (object.coords.z >= screenHeight + 5)
        //store disable asteroid
        recycleAsteroid(object);

    else {

        //update entity values
        if (object.coords.z < this.maxz)
            object.coords.z += this.speedZ * deltaTime;

        if (lifes > 0) {
            if (user.geometry.hasColition(object.geometry))
                destroyUser(object);

            showValue(this.strengh, object.coords.x, object.coords.z - 1.0, 'cyan');
        }

        if (this.time < this.fireDelay) {
            this.time += deltaTime;     //increase internal time counter

        } else {
            this.time = 0;              //reset internal time counter

            //launch one new proyectile
            launchProyectil(this.fireSpeed + this.speedZ, this.fireDirection, this.strengh, updateEnemieProyectile, this.fireAsset, object.coords.x, object.coords.z);

        }
    }



}

//typed proyectil update handlers
function updateUserProyectile(object) {
    var iterator;
    var geometry;
    var asteroid;

    var z = object.coords.z += this.speedZ * deltaTime;      //update coordinates

    if (z < spaceHeight) {

        //search proyectil TO astroid's colition
        geometry = object.geometry;
        iterator = asteroids.iterate();

        while ((asteroid = iterator.next())) {

            //check and/or emulate colition 
            if (geometry.hasColition(asteroid.geometry)) {

                if (asteroid.controller.strengh <= this.strengh) {

                    //store destroyed asteroid
                    recycleAsteroid(asteroid);

                    //add destruction efects
                    addExploider(asteroid.coords);
                    addBitcoin(asteroid.coords.x, asteroid.coords.z);

                    //increase experience value
                    experience += asteroid.controller.strengh;

                    //reduce proyectile strengh
                    this.strengh -= asteroid.controller.strengh;

                    //recycle if has not strengh
                    this.strengh > 0 || recycleProyectil(object);

                } else {
                    //reduce asteroid strengh
                    asteroid.controller.strengh -= this.strengh;

                    //recycle colitioned proyectile
                    recycleProyectil(object);

                    //increase experience value
                    experience += this.strengh * 0.1;
                }


            }

        }
        //////////////////////////////////////////

    } else {

        //remove disabled proyectile
        recycleProyectil(object);

    }


}

function updateEnemieProyectile(object) {

    var z = object.coords.z += this.speedZ * deltaTime;      //update coordinates

    if (z < spaceHeight) {
        if (user.geometry.hasColition(object.geometry)) {

            destroyUser();              //execute user actions
            addExploider(user.coords);  //add colition efects 

        }
    } else {
        //recycle disabled proyectile
        recycleProyectil(object);

    }
}

//miscelaneous functions
function selectSeed(builder) {
    var length = builder.seedsIndexs.length;
    var index;
    var seed;

    if (length > 0) {
        //when level has seed's
        index = Math.floor(Math.random() * (length - 1));          //compute a random avaliable seed index
        seed = builder.seeds[builder.seedsIndexs[index]];          //select one avaliable seed of index
        builder.seed = seed;                                       //set selected seed to build
        builder.buildingCycles = seed.length / 7;                  //set cycles requireds to build selected seed
        builder.isWhaiting = true;//seed[0] < 0;                          //set whait state    

    } else {
        //when level has no seed's
        builder.seed = null;                                       //set null seed to build randomizing

        //set random cycles requireds to build selected seed
        builder.buildingCycles = Math.floor((Math.random() * 0.4 + 0.1) * builder.gamingCycles);
        builder.isWhaiting = Math.random() <= 0.1;                  //set wait state

    }

    //select new assets models indexs to build
    for (var i = 0, n = builder.assetsIndexs.length - 1; i < 10; i++) {
        builder.types[i] = builder.assetsIndexs[Math.round(Math.random() * n)];
    }
    //*****************************


}

function buildMap(builder) {
    var size, offset, value;

    var seed = builder.seed;                    //get current builded seed
    var cycle = builder.cycle;                  //get current builder cycle -m -> n

    if (seed !== null) {
        size = seed.length / 7;                 //compute number of rows of builded seed
        offset = 7 * (size - cycle - 1);        //compute reversed offset 7*row row = (nr - i - 1) 

        //add elements based on builder partner
        for (var i = 0, x = -20, z; i < 7; i++) {
            value = seed[offset + i];                   //get seed value on row and column index
            x += 5;                                     //displace 5 units horizontally
            z = !(x % 2) ? -25 : -28;                   //apply or not vertical displacement

            if (value > 0)
                addAsteroid(builder, value, x, z);      //add one obligatory typed asteroid to scene
            else if (value < 0 && Math.random() < 0.5)
                addAsteroid(builder, -value, x, z);     //add one optional typed asteroid to scene
            else if (Math.random() > 0.9)
                addBitcoin(x, z);                       //add one optional bitcoin to scene

        }
        ///////////////////////////

    } else {

        //add elements randomising it's
        for (var i = 0, x = -20, z; i < 7; i++) {
            x += 5;                         //displace 5 units horizontally
            z = !(x % 2) ? -25 : -28;       //apply or not vertical dispalcement
            value = Math.random();          //randomize one value to use

            if (value <= 0.8) {
                value = Math.floor((value + 0.2) * level.number);
                addAsteroid(builder, value, x, z);    //add one typed asteroid to scene
            } else if (value > 0.9)
                addBitcoin(x, z);                     //add one optional bitcioin to scene

        }
        ///////////////////////////

    }

    //adding one powerUps to scene
    if (time >= builder.nextPowerUp) {
        addPowerUp(Math.round(Math.random() * 1), 0, -spaceHeight * 2);

        //def time to launch next powerup
        builder.nextPowerUp = time + Math.random() * 50 + 50;

    }

}

function resumeAsteroids() {
    var iterator = asteroids.iterate();
    var asteroid = null;

    //set final vertical limit
    while ((asteroid = iterator.next())) {
        asteroid.controller.maxz = screenHeight + 5;
    }

}



function launchProyectil(speed, direction, strengh, upadateCallback, modelAssetIndex, x, z) {
    var proyectil = recycledProyectiles.pop();
    var controller;

    if (!proyectil) {
        //initialize one new proyectile
        proyectil = new M3D.Object();                   //make entity object
        proyectil.setController(controllerProyectil);   //make entity controller

    }

    //set controller values
    controller = proyectil.controller;
    controller.strengh = strengh;               //set power strengh
    controller.update = upadateCallback;        //set update event handler
    controller.speedX = speed * direction.x;    //set x axis speed
    controller.speedZ = speed * direction.z;    //set z axis speed

    //set proyectil values
    proyectil.setCoords(x, 0, z);                     //set initial coordinates
    proyectil.model.objObjectIndex = modelAssetIndex; //set renderable model

    //add proyectl to scene
    proyectiles.addNode(controller.proyectilListNode);
    scene.addObject(proyectil);
    proyectil.update();

    //console.log('%cLAUNCHED ' + proyectil.name + ' has (' + proyectiles.size + ')', 'color: lime;');

}

//////////////////////////////////////////////
//Game Runner
function createControllers() {
    

    controllerAsteroid = new M3D.Controller();
    controllerAsteroid.initialize = function (object) {

        this.time = 0;                                  //def internal time counter
        this.delay = 0;                                 //def asteroid fire delay on ms
        this.lifeTime = 0;                              //def asteroid life time on seconds
        this.strengh = 0;                               //def asteroid power strengh
        this.fireAsset = level.fireAsset;               //def fire asset submodel index
        this.fireDelay = level.fireDelay;               //def fire interval time
        this.fireSpeed = 30 * (1 - this.fireDelay);     //set fire linear speed (30 ms * interval) => interval = 1seg - delay
        this.fireDirection = new M3D.Vector(0, 0, 1);   //def fire direction vector

        this.speedX = 0;                                //def horizontal speed m/s
        this.speedZ = 0;                                //def vertical speed m/s
        this.maxz = 0;                                  //def vertical limits

        this.speedBeta = 90;                            //def Y axis angular speed deg/s
        this.speedGanma = 90;                           //def Z axis angular speed deg/s
        this.asteroidListNode = new M3D.Node(object);   //def dinamic node list

        //define asteroid object data
        object.name = 'ASTEROID_' + contMakedAsteroids;
        object.type = 1;
        object.setModel(sceneAssets.model);
        object.setScale(1.5);
        object.setVisible(true);
        object.geometry.setDimensions(3, 3, 3);

        contMakedAsteroids++;
    };

    controllerProyectil = new M3D.Controller();
    controllerProyectil.initialize = function (object) {

        this.time = 0;
        this.strengh = 0;
        this.speedX = 0;
        this.speedZ = 0;
        this.proyectilListNode = new M3D.Node(object);

        //define proyectil object values 
        object.name = 'PROYECTIL_' + contMakedProyectiles++;
        object.type = 2;
        object.setModel(gameAssets.model);
        object.setScale(0.8);
        object.setVisible(true);
        object.geometry.setDimensions(0.5, 0.5, 0.5);

    };

    controllerExploider = new M3D.Controller();
    controllerExploider.initialize = function (object) {

        //define exploider object values
        object.name = 'EXPLOIDER_' + contMakedExploiders++;
        object.type = 3;
        object.setModel(scene.getModel('EXPLOSION'));
        object.setScale(3);
        object.setVisible(true);
        object.model.speed = 0.01;

    };
    controllerExploider.update = function (object) {

        //update particles system
        object.model.updateParticles(deltaTime * 100);

        //remove disabled exploider
        if (object.model.time >= 1.0)
            recycleExploider(object);

    };

    controllerBitcoin = new M3D.Controller();
    controllerBitcoin.initialize = function (object) {
        this.speedZ = 0;
        this.speedBeta = 90;
        this.coinListNode = new M3D.Node(object);

        //define bitcoin object values
        object.name = 'COIN_' + contMakedBitcoins++;
        object.setModel(gameAssets.model);
        object.setScale(1.3);
        object.model.objObjectIndex = gameAssets.bitcoin;
        object.setVisible(true);
        object.rotation.x = -89.75;
        object.geometry.setDimensions(2, 2, 2);

    };
    controllerBitcoin.update = function (object) {

        var z = object.coords.z += this.speedZ * deltaTime;     //update coordinaes
        object.rotation.y = builder.controller.coinsRotation;   //update Y axis angle

        //recycle disabled bitcoin
        if (z > spaceHeight) {
            recycleBitcoin(object);
        } else {
            if (user.geometry.hasColition(object.geometry)) {
                recycleBitcoin(object); //recycle obtained bitcoin
                settings.SOUND_ENABLE && soundContext.playSound(bonusSound); //play bonus sound effect
                settings.USER_COINS++;  //increase user coins number
            }
        }

    };

    controllerPowerUp = new M3D.Controller();
    controllerPowerUp.initialize = function (object) {

        this.speedX = 0;        //def horizontal speed
        this.speedZ = 0;        //def vertical speed
        this.speedBeta = 45;    //def Y axis angular speed
        this.powerType = 0;     //def power type
        this.enable = false;    //def has not enable
        this.time = 30;         //def max efect duration time

        //define bonus object values
        object.name = 'BONUS';
        object.setModel(gameAssets.model);
        object.setScale(1.3);
        object.setVisible(true);
        object.rotation.x = -89.75;
        object.geometry.setDimensions(2, 2, 2);

    };
    controllerPowerUp.update = function (object) {

        var z = object.coords.z += this.speedZ * deltaTime;     //update coordinaes
        var x = object.coords.x += this.speedX * deltaTime;     //update coordinaes
        object.rotation.y += this.speedBeta * deltaTime;        //update Y axis angle

        if (z > spaceHeight) {
            //remove disabled bonus
            scene.removeObject(object);

        } else {
            if (Math.abs(x) >= spaceWidth / 2)                  //jump horizontally 
                this.speedX = x > 0 ? -level.asteroidSpeed : level.asteroidSpeed;

            if (user.geometry.hasColition(object.geometry)) {
                scene.removeObject(object);     //remove obtained power up
                settings.SOUND_ENABLE && soundContext.playSound(bonusSound); //play bonus sound effect

                switch (this.powerType) {
                    case 0:
                        //console.log('FIRE DELAY INCREASED');
                        user.controller.fireDelay *= 0.5;
                        break;
                    case 1:
                        //console.log('LIFES INCREASED');
                        user.controller.fireStrengh += 300 * (level.number || 1);
                        user.controller.fireAsset = getFireAsset(user.controller.fireStrengh);//set fire asset submodel index
        				alert(user.controller.fireStrengh);
                        break;
                }

            }

        }

    };

    controllerMapBuilder = new M3D.Controller();
    controllerMapBuilder.initialize = function () {
        this.time = 0;                  //def internal time controller
        this.cycles = 0;                //def internal cycles counter
        this.cycle = 0;                 //def internal cycle value

        this.cycleDelay = 0;            //def cycle delay
        this.buildingCycles = 0;        //def requireds building cycles
        this.gamingCycles = 0;          //def requireds gaming cycles
        this.isWhaiting = false;        //def requireds whait

        this.seedsIndexs = null;        //def avaliables seeds index to build
        this.seeds = null;              //def avaliables seeds to build
        this.seed = null;               //def current builded seed
        this.types = new Array(10);     //def avaliables model types by build

        this.coinsRotation = 0;         //def static values by coins of rotation
        this.asteroidDistance = 6;      //def min distance between asteroids
        this.nextPowerUp = 0;           //def power up time controller

    };
    controllerMapBuilder.reset = function () {
        this.time = 0;                                      //reset internal time counter
        this.cycles = 0;                                    //reset internal cycle counter
        this.cycle = 0;                                     //reset to default cycle
        this.coinsRotation = 0;                             //reset static coins rotation

        this.nextPowerUp = Math.floor(Math.random() * 5);  //set next power up time to launch
        this.seedsIndexs = level.seedsIndexs;               //set ARRAY with avaliables seeds index to build
        this.seeds = seeds;                                 //set ARRAY with avaliables seeds to build

        this.cycleDelay = 6 / level.asteroidSpeed;          //compute delay (minime distance betwen asteroids is 6 mts)
        this.gamingCycles = level.gamingCycles;             //set gaming cycles to wait

        //get scene assets index of build-in's geometrys (TEMPORALLY)
        this.assetsIndexs = [];
        for (var propertieName in sceneAssets) {
            if (propertieName.lastIndexOf('asteroid') > -1) {
                this.assetsIndexs[this.assetsIndexs.length] = sceneAssets[propertieName];
            }
        }
        //***********************************************************

    };
    controllerMapBuilder.update = function () {

        //execute a new cycle
        if (this.time >= this.cycleDelay) {
            this.time = 0.0;                    //reset internal time counter

            //execute selection fase
            if (this.cycle === 0) {

                if (this.isWhaiting) {
                    this.isWhaiting = false;            //finish whait status
                    resumeAsteroids();                  //continue asteroid vertical dezplacement
                    this.cycle = -this.buildingCycles;  //set required time to evit ofuscation
                    
                } else {
                    selectSeed(this);                   //select and prepare a new map seed
                    this.cycles++;                      //increase acumulated cycles number

                }
                
            }
            
            //execute build or whait fase
            if (this.cycle >= 0 && !levelFinished) {
                
                if (this.cycle < this.buildingCycles) {
                    //add objects to fill game-scene
                    buildMap(this);

                } else {

                    //set sleep cycles number (user resolution time)
                    if (this.isWhaiting)
                        this.cycle = -this.gamingCycles;
                    else
                        this.cycle = -this.gamingCycles + this.buildingCycles;

                }
            }

            this.cycle++;                       //increase build cycles counter
        }

        this.time += deltaTime;                 //increase internal time counter
        this.coinsRotation += 90 * deltaTime;   //increase all coins Y axis angle
    };

    controllerShip = new M3D.Controller();
    controllerShip.initialize = function (object) {

        this.time = 0;              //def time counter
        this.fireDelay = 0;         //def fire delay time
        this.fireSpeed = 0;         //def fire general speed
        this.fireStrengh = 0;       //def fire power strengh
        this.fireLifeTime = 0;      //def fire life
        this.fireRate = 0;          //def fire rate per second
        this.fireAsset = 0;         //def fire asset submodel index
        this.fireDirection = null;  //def fire diretion vector

        this.ganma = 0;             //def Z axis angle
        this.ganmaSpeed = 5;        //def Z axis angular speed

        this.backfire = object.addChildren(new M3D.Object('SHIP_BACKFIRE'));
        this.backfire.setModel(scene.getModel('BACKFIRE'));

        this.backfire.coords.z = 1.2;
        this.backfire.setScale(2);
        this.backfire.setVisible(true);

        //define ship object values
        object.type = 0;                            //set object type-ID
        object.setModel(avatarAssets.model);        //set renderable model
        object.setScale(2);                         //set general scale
        object.setVisible(true);                    //set has visible
        object.geometry.setDimensions(2.7, 2.5, 2); //set geometry dimensions

    };
    controllerShip.reset = function (object) {
        this.time = 0;                                  //reset internal time counter
        this.ganma = 0;                                 //reset Z axis angle

        this.fireRate = settings.FIRE_RATE;             //set number of fires
        this.fireDelay = settings.FIRE_DELAY;           //set delay on 0.x seconds
        this.fireSpeed = 30 * (1 - this.fireDelay);     //set fire linear speed (30 ms * interval) => interval = 1seg - delay
        this.fireStrengh = settings.FIRE_STRENGH;       //set fire power strengh
        this.fireAsset = getFireAsset(this.fireStrengh);//set fire asset submodel index
        this.fireDirection = new M3D.Vector(0, 0, -1);  //set fire direction vector

        if (object) {
            object.setCoords(0, 0.5, 15);         //set original coordinates
            object.setScale(2);                   //set general scale
        }

    };
    controllerShip.update = function (object) {

        var x = object.coords.x;
        var z = object.coords.z;
        var sx = 2 * spaceWidth * screenRatio / screenWidth;    //get 1 GLpoints on X is ? px of screen width
        var sy = 2 * spaceHeight / screenHeight;                //get 1 GLpoints on Y is ? px of screen height
        var array, size;

        this.ganma += this.ganmaSpeed * deltaTime;              //update Z axis angle
        object.rotation.z = 15 * Math.sin(this.ganma);          //set Z axis angle

        //update avatar coordinates
        if (userMotionEvents.size > 1) {

            size = userMotionEvents.size - 1;        //get event stack size
            array = userMotionEvents.dataArray;      //get event stack internal array

            for (var i = 0; i < size; i++) {
                x += sx * (array[i + 1].clientX - array[i].clientX);   //compute and add, last to next events delta X
                z += sy * (array[i + 1].clientY - array[i].clientY);   //compute and add, last to next events delta Y

            }

            //set new coordinates

            //validate new coordinates
            if (Math.abs(x) < 17 && Math.abs(z) < 20) {
                //set new coordinates
                object.coords[0] = x;
                object.coords[2] = z;

            } else {
                //reset to values on before iteration
                x = object.coords.x;
                z = object.coords.z;

            }

            //reset events list
            userMotionEvents.clear();            //clear event stack
            userMotionEvents.push(array[size]);  //push last event

        }

        if (lifes > 0) {
            
            //launch user proyectiles
            if (this.time < this.fireDelay) {
                this.time += deltaTime; //increase internal time counter

            } else {
                this.time = 0;          //reset internal time counter
                
                if(!levelFinished){

                    //select where are proyectils to launch
                    switch (this.fireRate) {
                        case 1:
                            launchProyectil(this.fireSpeed, this.fireDirection, this.fireStrengh, updateUserProyectile, this.fireAsset, x, z - 0.7);      //launch central cannon

                            break;
                        case 3:
                            launchProyectil(this.fireSpeed, this.fireDirection, this.fireStrengh, updateUserProyectile, this.fireAsset, x, z - 0.7);      //launch central cannon

                        case 2:
                            launchProyectil(this.fireSpeed, this.fireDirection, this.fireStrengh, updateUserProyectile, this.fireAsset, x - 0.5, z - 0.5);//launch left cannon
                            launchProyectil(this.fireSpeed, this.fireDirection, this.fireStrengh, updateUserProyectile, this.fireAsset, x + 0.5, z - 0.5);//launch right cannon

                            break;
                    }

                    //play missile launch sound
                    settings.SOUND_ENABLE && soundContext.playSound(launchSound);
                }

            }

            //update backfire
            this.backfire.model.updateParticles(deltaTime);

        } else if (lifes < 0) {

            //blink with 1s of intervals 
            //visibility = cos(alpha) { alpha = time * 180deg * loops_number }
            object.visible = Math.cos(this.time * Math.PI * 8) > 0;

            if (this.time <= 1)
                this.time += deltaTime;     //increase internal time counter
            else {
                this.time = 0;              //reset internal time counter
                lifes = Math.abs(lifes);    //disable blink mechanism
            }

        } else {
            scene.removeObject(object);

            //call loss event callback
            pause();
            alert('YOU LOSS...');
            play();

        }
        
        object.updated = true;
        
    };

    controllerStars = new M3D.Controller();
    controllerStars.initialize = function (object) {
        object.setModel(scene.getModel('BACKGROUND'));
        object.setCoords(0, -5, -30);
        object.setScale(80, 0, 50);
        object.setVisible(true);
    };
    controllerStars.update = function (object) {
        object.model.updateParticles(deltaTime * 0.05);

    };

}

function initializeGame() {

    //define space size values
    spaceWidth = 30;
    spaceHeight = 20;
    

    //initialize typed objects controllers
    createControllers();

    //initialize game user avatar entity
    user = new M3D.Object('USER');
    user.setController(controllerShip);

    //initialize game scene builder entity
    builder = new M3D.Object('BUILDER');
    builder.setController(controllerMapBuilder);

    stars = new M3D.Object('STARS');
    stars.setController(controllerStars);

    //initialize typed objects storages
    asteroids = new M3D.List();
    proyectiles = new M3D.List();
    bitcoins = new M3D.List();

    recycledAsteroids = new M3D.Stack();
    recycledProyectiles = new M3D.Stack();
    recycledExploiders = new M3D.Stack();
    recycledCoins = new M3D.Stack();

    //initialize and configure scene ligth's
    ambientLigth = new M3D.Ligth('LIGTH_1', M3D.Ligth.AMBIENTAL);
    ambientLigth.setColor(0.5, 0.5, 0.5);   //opaque white
    ambientLigth.setEnable(true);           //enable ligth
    scene.addLigth(ambientLigth);           //store on list of ligths on scene

    sunLigth = new M3D.Ligth('LIGTH_2', M3D.Ligth.DOTTED);
    sunLigth.setCoords(0, 100, 100);        //positionated on back-top
    sunLigth.setEnable(true);               //enable ligth
    scene.addLigth(sunLigth);               //store on list of ligths on scene

    //initialize and configure game view camera
    gameCamera = new M3D.Camera();
    gameCamera.setProjection(new M3D.Camera.OrtographicProjection());
    gameCamera.projection.setCubicFrustrum(spaceWidth, spaceHeight, 30);
    gameCamera.setTargetCoords(0, 0, 0);    //loock at center
    gameCamera.setCoords(0, 2, 0.1);        //positionated up to word

    //define user motion events listeners
    createMotionEventsListeners();

}

function startGameLevel() {
    var gameLevel;

    //reset game states
    isGaming = true;
    levelFinished = false;

    //pause
    pause();

    //clear all storages
    asteroids.clear();
    proyectiles.clear();
    bitcoins.clear();

    recycledAsteroids.clear();
    recycledProyectiles.clear();
    recycledExploiders.clear();
    recycledCoins.clear();

    //reset typed objects counters
    contMakedAsteroids = 0;
    contMakedProyectiles = 0;
    contMakedExploiders = 0;
    contMakedBitcoins = 0;

    //reset game values
    lifes = settings.USER_LIFES;
    experience = 0;
    time = 0;
    progress = 0;

    //load level values
    gameLevel = levels[settings.USER_LEVEL - 1] || {};
    level = {

        number: settings.USER_LEVEL,
        name: gameLevel.name,

        backgroundColor: gameLevel.backgroundColor || [0.0, 0.05, 0.1],
        backgroundTrack: /*gameLevel.backgroundTrack || */mediaAssets[parseInt(Math.random()*(mediaAssets.length-1))],
        sceneAssets: gameLevel.sceneAssets || componentsAssets[0],

        seedsIndexs: gameLevel.seedsIndexs || [],
        asteroidSpeed: gameLevel.asteroidSpeed || 10,
        asteroidStrengh: gameLevel.asteroidStrengh || settings.USER_LEVEL * 500,

        requiredEXP: !gameLevel.requiredTime ? gameLevel.requiredEXP || Math.floor(settings.USER_LEVEL * 500 * (Math.random() * settings.USER_LEVEL + 1)) : 0,
        requiredTime: gameLevel.requiredTime || 0,
        gamingCycles: gameLevel.gamingCycles || 5,

        fireDelay: gameLevel.fireDelay || 0.5,
        fireAsset: gameLevel.proyectilAsset || gameAssets.laserSmallRed

    };

    //configure background color
    backgroundColor = level.backgroundColor;
    renderer.setClearColor(backgroundColor[0], backgroundColor[1], backgroundColor[2]);

    //import level resources from assets
    backgroundTrack = importAudioAsset(level.backgroundTrack);
    sceneAssets = importModelAsset(level.sceneAssets);

    //clear scene
    scene.removeAllObjects();           //remove any object entities
    builder.controller.reset();         //reset builder controller states 
    user.controller.reset();            //reset user controller values

    //insert main entities
    scene.addObject(user);
    scene.addObject(user.controller.backfire);
    scene.addObject(builder);
    scene.addObject(stars);

    camera = gameCamera;                //change to gameCamera
    updateRendererOutputDimensions();   //update screen size
    renderer.clearScreen();             //clear screen

    //SHOW START MESSAGE
    context2D.save();
    context2D.font = '25px monospace';
    context2D.fillStyle = 'white';
    context2D.fillText('TOUCH TO PLAY', 256 - Math.floor(7.5 * 7.5), 256 + 13);
    context2D.restore();

    guiCanvas.onclick = function () {
        guiCanvas.onclick = null;
        context2D.clearRect(0, 0, 512, 512);

        isUserControlEnable = false;
        play();

    };

}

function finishGameLevel() {
    pause();

    console.log('YOU WING');
    settings.USER_LEVEL++;
    startGameLevel();

}

function resumeAsteroidsAsBitcoin() {
    var iterator = asteroids.iterate();
    var asteroid = null;

    //set final vertical limit
    while ((asteroid = iterator.next())) {
        //store destroyed asteroid
        recycleAsteroid(asteroid);

        //add destruction efects
        addExploider(asteroid.coords);
        addBitcoin(asteroid.coords.x, asteroid.coords.z);
    }

}

function emulateLevel() {

    //compute delta time proporsion
    var ntime = new Date().getTime();
    deltaTime = lastTime > 0 ? (ntime - lastTime) / 1000 : 0.0;
    lastTime = ntime;

    //increase game time counter
    time += deltaTime;

    //reduce resolution time when is not user controling
    if (!isUserMoving)
        deltaTime *= 0.1;

    //update physics entities on scene
    scene.updateObjects();

    //update progress
    if (level.requiredEXP > 0)
        progress = experience / level.requiredEXP;  //update progress exp
    else if (level.requiredTime > 0)
        progress = time / level.requiredTime;       //update progress time
    else
        ;

    //normalize progress
    if (progress >= 1.0){
        if(!levelFinished){
            levelFinished = true;
            resumeAsteroidsAsBitcoin();
            
        } else if (bitcoins.size == 0) {
             finishGameLevel();
        } 
       
    }
        

}

//////////////////////////////////////////////
//User Events Callbacks
function createMotionEventsListeners() {

    if (isMobileGame) {

        guiCanvas.addEventListener('touchstart', function (e) {
            isUserMoving = true;
            userMotionEvents.push(e.changedTouches[0]);
        });
        guiCanvas.addEventListener('touchmove', function (e) {
            userMotionEvents.push(e.changedTouches[0]);
        });
        guiCanvas.addEventListener('touchend', function () {
            isUserMoving = false;
            userMotionEvents.clear();
        });

    } else {
        guiCanvas.addEventListener('click', function () {
            isUserControlEnable = !isUserControlEnable;
            isUserControlEnable || userMotionEvents.clear();
            isUserMoving = isUserControlEnable;
        });
        guiCanvas.addEventListener('mouseover', function () {
            isUserMoving = isUserControlEnable;
        });
        guiCanvas.addEventListener('mousemove', function (e) {
            isUserControlEnable && userMotionEvents.push(e);
        });
        guiCanvas.addEventListener('mouseout', function () {
            isUserMoving = false;
            userMotionEvents.clear();
        });

    }

}

function updateRendererOutputDimensions() {

    //get new screen dimensions
    screenWidth = window.innerWidth;
    screenHeight = window.innerHeight;
    screenRatio = screenWidth / screenHeight;

    //set new camera projection ratio
    if (camera)
        camera.projection.ratio = screenRatio;

    //set new render output resoulution
    renderer.setOutputResolution(screenWidth * settings.SCREEN_RESOLUTION, screenHeight * settings.SCREEN_RESOLUTION);

}

//////////////////////////////////////////////
//Render control
function play() {
    //reset miscelaneous values and stats
    lastTime = 0;
    fpsCounter.reset();

    animator.startAnimation(renderLoop);    //start or resume game render loop

    if (settings.MUSIC_ENABLE)
        playLevelBackgroundAudio();         //start or resume game background playback

}

function pause() {
    animator.stopAnimation();   //pause game render loop

    if (settings.MUSIC_ENABLE | settings.SOUND_ENABLE)
        pauseAudio();           //pause all playeds sounds

}

function renderLoop() {

    //clear screen and renderize scene
    context2D.clearRect(0, 0, 512, 512);
    renderer.clearScreen();
    renderer.drawScene(scene, camera);

    //here renderize main GUI layout
    //showLimits();
    showProgress();

    //emulate game level states
    emulateLevel();

    if (isDebuging)
        showStats();    //show rendering stats graphics

}

function showLimits() {

    var semi = Math.floor(guiCanvas.width / 2); //compute middle size of screen
    var width = semi / screenRatio / 1.74;  //interpolate space middle dimensions to screen values

    var left = semi - width;
    var rigth = semi + width;

    context2D.fillStyle = 'yellow';
    context2D.fillRect(left, 0, 2, guiCanvas.height);
    context2D.fillRect(rigth, 0, 2, guiCanvas.height);

}

function showProgress() {
    var w = guiCanvas.width;

    context2D.fillStyle = 'yellow';
    context2D.strokeStyle = 'white';
    context2D.strokeRect(w / 2 - 100, 10, 200, 20);
    context2D.fillRect(w / 2 - 99, 11, 198 * progress, 18);

}

function showStats() {
    fpsCounter.countFrame();
    fpsCounter.showFPSRatesGraph(context2D, 10, 312);
    fpsCounter.showFPSIntervalsGraph(context2D, 10, 420);

}

//////////////////////////////////////////////
//Audio control
function playLevelBackgroundAudio() {
    soundContext.playSound(backgroundTrack);

}

function pauseAudio() {
    //stop all sound playing traks
    soundContext.pauseSound(backgroundTrack);
    soundContext.pauseSound(launchSound);
    soundContext.pauseSound(explosionSound);

}
