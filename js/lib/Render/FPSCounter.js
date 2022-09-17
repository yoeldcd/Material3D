
function FPSCounter() {

    this.currentTime = 0;
    this.lastTime = -1;
    this.frameStartTime = 0;

    this.frameInterval = 0;
    this.maxfps = 0;
    this.minfps = 60;
    this.fps = 0;
    this.count = 0;

    return this;
}

FPSCounter.prototype.countFrame = function () {
    
    var updated = false;
    
    this.currentTime = new Date().getTime();

    //compute frame interval
    this.frameInterval = this.currentTime - this.frameStartTime;
    this.frameStartTime = this.currentTime;

    if (this.lastTime < 0) {
        this.lastTime = this.currentTime;                   //initialize first frame time
    } else {
        if ((this.currentTime - this.lastTime) >= 1000) {   //eval if interval of time is 1000 ms = 1 s
            this.lastTime = this.currentTime;               //update new frame time
            this.fps = this.count;                          //update FPS value
            this.count = 0;                                 //reset per-frame counter
            
            updated = true;
            
            //registre max FPS rate
            if (this.fps > this.maxfps)
                this.maxfps = this.fps;
            else
                ;

            //register min FPS rate
            if (this.fps < this.minfps)
                this.minfps = this.fps;
            else
                ;

        } else {
            this.count++;                                      //increase per-frame counter
        } //end else
    }//end else
    
    return updated;
};

FPSCounter.prototype.reset = function () {
    this.lastTime = -1;

    this.fps = 0;
    this.count = 0;

    this.maxfps = 0;
    this.minfps = 60;
    
};


