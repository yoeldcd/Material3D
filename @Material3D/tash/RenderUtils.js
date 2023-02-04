
function FPSCounter(){
    this.constructor();
};

var renderUtils = new (function () {

    var framebuffer;
    var renderbuffer;
    var clearColor;
    var texture;

    var currentTime;
    var lastFrameTime;
    var fps;
    var value;

    this.makeFramebuffer = function (gl, width, height) {

        //create framebuffer and attachment texture
        framebuffer = gl.createFramebuffer();
        renderbuffer = gl.createRenderbuffer();
        texture = gl.createTexture();
        clearColor = {r: 0, g: 0, b: 0, a: 0};

        //bind texture and frame buffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);

        //configure renderbuffer to store depth value
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);

        //set feedback texture
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        //configure framebuffer
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, frametexture, 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

        //close texture and framebuffer
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        //store framebuffer elements
        framebuffer.width = width;
        framebuffer.height = height;
        framebuffer.renderbuffer = renderbuffer;
        framebuffer.texture = texture;
        framebuffer.clearColor = clearColor;

        return framebuffer;
    };

    this.activateFramebuffer = function (gl, framebuffer) {
        clearColor = framebuffer.clearColor;
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

        gl.viewport(0, 0, framebuffer.width, framebuffer.height);
        gl.clearColor(clearColor.r, clearColor.g, clearColor.b, clearColor.a);
    };

    this.disactivateFramebuffer = function (gl) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };

    this.bindFramebufferTexture = function (gl, framebuffer, type, target, texture, type) {

        type || (type = gl.TEXTURE_2D);
        target || (target = gl.TEXTURE_2D);

        if (framebuffer && texture) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
            gl.bindTexture(type, texture);

            //set image base data 
            gl.texImage2D(target, 0, gl.RGBA, framebuffer.width, framebuffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

            //configure framebuffer
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, target, texture, 0);
            
            gl.bindTexture(type, null);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

            framebuffer.texture = texture;
        }

        return framebuffer;
    };

    this.configureAnimationFrame = function () {

        function virtualRequestAnimationFrame(callback) {
            return setTimeout(callback, 40);
        }

        function virtualCancelAnimationFrame(frame) {
            return clearTimeout(frame);
        }

        window.requestAnimationFrame = (window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || virtualRequestAnimationFrame);
        window.requestAnimationFrame = (window.cancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame || window.msCancelAnimationFrame || virtualCancelAnimationFrame);

    };

    function showFPSGraph(ctx, logArray, x, y, backgroundColor, barColor) {

        ctx.beginPath();
        ctx.rect(x, y, 80, 90);
        ctx.clip();

        ctx.fillStyle = backgroundColor;
        ctx.fillRect(x, y, 80, 90);

        x += 10;
        y += 75;

        ctx.strokeStyle = 'white';
        ctx.strokeRect(x, y - 60, 60, 60);

        //show graph bars
        ctx.fillStyle = 'white';
        for (var i = 0; i < 60; i++) {
            value = logArray[i];

            if (value < 0) {
                value = -value;

                //draw loged value
                ctx.fillStyle = 'red';
                if (value >= 60)
                    ctx.fillRect(x + i, y - 60, 1, 60);
                else
                    ctx.fillRect(x + i, y - value, 1, value);

                ctx.fillStyle = 'white';

            } else {

                //draw loged value
                if (value >= 60)
                    ctx.fillRect(x + i, y - 60, 1, 60);
                else
                    ctx.fillRect(x + i, y - value, 1, value);

            }


        }


    }

    FPSCounter.prototype.constructor = function() {

        this.lastTime = -1;
        this.frameStartTime = 0;

        this.fps = 0;
        this.count = 0;

        this.maxFps = 0;
        this.minFps = 60;

        this.frameRateLog = new Array(60);
        this.frameTimeLog = new Array(60);

        this.frameRateLogSize = 0;
        this.frameTimeLogSize = 0;

        return this;
    }

    /*Count one new frame and update FPS stats*/
    var response = false;
    FPSCounter.prototype.countFrame = function () {
        currentTime = new Date().getTime();
        lastFrameTime = this.lastTime;

        if (lastFrameTime < 0) {
            this.lastTime = currentTime;            //initialize first frame time
            
            response = false;
            
        } else {

            //compute per-frame interval
            this.frameInterval = currentTime - this.frameStartTime;

            if (currentTime - lastFrameTime >= 1000) {   //eval if interval of time is 1000 ms = 1 s
                this.lastTime = currentTime;        //update new frame time
                fps = this.count;                   //update FPS value

                //registre max and min FPS rate
                fps <= this.maxFps || (this.maxFps = fps);
                fps >= this.minFps || (this.minFps = fps);

                //log frame-rates
                if (this.frameRateLogSize >= 60) {
                    for (var i = 0; i < 59; i++) {
                        this.frameRateLog[i] = this.frameRateLog[i + 1];
                    }

                    this.frameRateLog[59] = this.frameRateLogSize % 60 ? fps : -fps;
                } else {
                    this.frameRateLog[this.frameRateLogSize] = fps;
                }
                this.frameRateLogSize++;

                this.frameStartTime = currentTime;
                this.fps = fps;
                this.count = 0;
            
                response = true;
                
            } else {
                response = false;
                
            }  

            //log frame-times
            if (this.frameTimeLogSize >= 60) {
                for (var i = 0; i < 59; i++) {
                    this.frameTimeLog[i] = this.frameTimeLog[i + 1];
                }

                this.frameTimeLog[59] = response ? - this.frameInterval : this.frameInterval;
            } else {
                this.frameTimeLog[this.frameTimeLogSize] = response ? - this.frameInterval : this.frameInterval;
            }

            this.frameTimeLogSize++;
            this.frameStartTime = currentTime;
            this.count++;                                      //increase per-frame counter
            
        }//end else

        return response;
    };

    /*Reset a work values and FPS stats*/
    FPSCounter.prototype.reset = function () {
        this.fps = 0;
        this.count = 0;

        this.lastTime = -1;
        this.frameStartTime = 0;

        this.maxFps = 0;
        this.minFps = 60;

        this.frameRateLog.length = 0;
        this.frameTimeLog.length = 0;

        this.frameRateLogSize = 0;
        this.frameTimeLogSize = 0;

    };

    FPSCounter.prototype.showFPSRateGraph = function (ctx, x, y, backgroundColor, barColor, fontColor) {
        x || (x = 0);
        y || (y = 0);
        backgroundColor || (backgroundColor = 'blue');
        barColor || (barColor = 'white');
        fontColor || (fontColor = 'yellow');

        ctx.save();
        showFrameGraph(ctx, this.frameRateLog, x, y, backgroundColor, barColor);
        ctx.fillStyle = fontColor;
        ctx.fillText('(' + this.minFps + ' - ' + this.maxFps + ')', x + 10, y + 10);
        ctx.fillText(this.fps + ' FPS', x + 10, y + 85);
        ctx.restore();
    };

    FPSCounter.prototype.showFPSTimeGraph = function (ctx, x, y, backgroundColor, barColor, fontColor) {
        x || (x = 0);
        y || (y = 0);
        backgroundColor || (backgroundColor = 'green');
        barColor || (barColor = 'white');
        fontColor || (fontColor = 'yellow');

        ctx.save();
        showFrameGraph(ctx, this.frameTimeLog, x, y, backgroundColor, barColor);
        ctx.fillStyle = fontColor;
        ctx.fillText(this.frameInterval + ' MS', x + 10, y + 85);
        ctx.restore();
    };

})();