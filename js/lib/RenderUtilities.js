
function FrameBuffer(gl, width, height) {

    //default framebuffer value
    width || (width = 1024);
    height || (height = width);

    var self = this;
    var framebuffer;
    var renderbuffer;
    var frametexture;
    var clearColor = [0, 0, 0, 1];

    //create framebuffer and attachment texture
    framebuffer = gl.createFramebuffer();
    renderbuffer = gl.createRenderbuffer();
    frametexture = gl.createTexture();

    //bind texture and frame buffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.bindTexture(gl.TEXTURE_2D, frametexture);
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);

    //configure renderbuffer to get Z value
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);

    //configure texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    //set image base data 
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    //configure framebuffer
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, frametexture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

    //close texture and framebuffer
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);


    self.enable = function (gl) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.viewport(0, 0, width, height);
        gl.clearColor(clearColor[0], clearColor[1], clearColor[2], 0.0);
    };

    self.disable = function (gl) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };

    self.getFrameTexture = function () {
        return frametexture;
    };

    self.getFramebuffer = function () {
        return framebuffer;
    };

    self.getRenderbuffer = function () {
        return renderbuffer;
    };

    self.bindFrameTexture = function (gl, texture, type, target) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.bindTexture(type, texture);

        //set image base data 
        gl.texImage2D(target, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        //configure framebuffer
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, target, texture, 0);

        gl.bindTexture(type, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return texture;
    };

    self.clearColor = function (r, g, b, a) {
        clearColor[0] = r || 0;
        clearColor[1] = g || 0;
        clearColor[2] = b || 0;
        clearColor[3] = a || 1;
    };

    self.getViewport = function () {
        return [width, height];
    };

    return self;
}

function FPSCounter() {

    var self = this;
    var lastTime = -1;
    var currentTime = -1;
    var frameStartTime = 0;

    self.frameInterval = 0;
    self.maxfps = 0;
    self.minfps = 60;
    self.fps = 0;
    self.count = 0;

    /*Count one new frame and update FPS stats*/
    self.countFrame = function () {

        currentTime = new Date().getTime();

        //compute frame interval
        self.frameInterval = currentTime - frameStartTime;
        frameStartTime = currentTime;

        if (lastTime < 0) {
            lastTime = currentTime;                   //initialize first frame time
        } else {
            if ((currentTime - lastTime) >= 1000) {   //eval if interval of time is 1000 ms = 1 s
                lastTime = currentTime;               //update new frame time
                self.fps = self.count;                //update FPS value
                self.count = 0;                       //reset per-frame counter

                //registre max FPS rate
                if (self.fps > self.maxfps)
                    self.maxfps = self.fps;
                else
                    ;

                //register min FPS rate
                if (self.fps < self.minfps)
                    self.minfps = self.fps;
                else
                    ;

            } else {
                self.count++;                                      //increase per-frame counter
            } //end else
        }//end else
    };

    /*Reset a work values and FPS stats*/
    self.reset = function () {
        self.fps = 0;
        self.count = 0;

        self.maxfps = 0;
        self.minfps = 60;

        currentTime = -1;
        lastTime = -1;

    };

    return self;
}