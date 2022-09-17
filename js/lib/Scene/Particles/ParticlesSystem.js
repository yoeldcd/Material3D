
function ParticlesSystem() {}

ParticlesSystem.prototype.alphaMax = 360;
ParticlesSystem.prototype.alphaMin = 0;
ParticlesSystem.prototype.betaMax = 360;
ParticlesSystem.prototype.betaMin = 0;

ParticlesSystem.prototype.density = 32;
ParticlesSystem.prototype.progress = 0;
ParticlesSystem.prototype.particlesSize = 30.0;
ParticlesSystem.prototype.hasSizeIncrement = false;
ParticlesSystem.prototype.ratio = 1;

ParticlesSystem.prototype.particlesBuffer = null;
ParticlesSystem.prototype.shaderProgram = null;
ParticlesSystem.prototype.spriteTexture = null;
ParticlesSystem.prototype.framebuffer = null;
ParticlesSystem.prototype.framebufferSize = 256;
ParticlesSystem.prototype.particlesTexture = null;

ParticlesSystem.prototype.particleOriginAttrib = -1;
ParticlesSystem.prototype.particleDirectionAttrib = -1;
ParticlesSystem.prototype.particleDelayAttrib = -1;

ParticlesSystem.prototype.particlesProgressUniform = null;
ParticlesSystem.prototype.particlesRatioUniform = null;

ParticlesSystem.prototype.createParticlesShader = function (gl) {
    var vertexCode = '' +
            'precision mediump float;\n' +
            '\n' +
            'attribute vec2 origin;\n' +
            'attribute vec2 direction;\n' +
            'attribute float delay;\n' +
            '\n' +
            'uniform float progress;\n' +
            'uniform float ratio;\n' +
            'uniform float size;\n' +
            'uniform bool hasIncrement;\n' +
            '\n' +
            'float value;\n' +
            'vec2 location;\n' +
            '\n' +
            'void main(){\n' +
            '   \n' +
            '   value = max(progress + delay, 0.0); \n' +
            '   value = value > 1.0 ? value - 1.0 : value;\n' +
            '   \n' +
            '   location = origin + (direction * value * ratio); \n' +
            '   gl_Position = vec4(location, 0.0, 1.0);\n' +
            '   gl_PointSize = hasIncrement ? value * size : size;\n' +
            '}\n' +
            '\n';

    var fragmentCode =
            'precision mediump float;\n' +
            '\n' +
            'uniform sampler2D sprite;\n' +
            '\n' +
            'void main(){\n' +
            '   gl_FragColor = texture2D(sprite, gl_PointCoord.xy);\n' +
            '   \n' +
            '   if(gl_FragColor.a == 0.0)\n' +
            '       discard;\n' +
            '}\n' +
            '\n';

    var vertexShader = null;
    var fragmentShader = null;
    var shaderProgram = null;
    var framebuffer = null;
    var frameTexture = null;

    if (ParticlesSystem.prototype.shaderProgram === null) {

        vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexCode);
        gl.compileShader(vertexShader);

        fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentCode);
        gl.compileShader(fragmentShader);

        shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        if (gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {

            gl.useProgram(shaderProgram);

            //get shader attribs
            ParticlesSystem.prototype.particleOriginAttrib = gl.getAttribLocation(shaderProgram, 'origin');
            ParticlesSystem.prototype.particleDirectionAttrib = gl.getAttribLocation(shaderProgram, 'direction');
            ParticlesSystem.prototype.particleDelayAttrib = gl.getAttribLocation(shaderProgram, 'delay');

            //get shader uniforms
            ParticlesSystem.prototype.particlesSizeUniform = gl.getUniformLocation(shaderProgram, 'size');
            ParticlesSystem.prototype.particlesHasSizeIncrementUniform = gl.getUniformLocation(shaderProgram, 'hasIncrement');
            ParticlesSystem.prototype.particlesRatioUniform = gl.getUniformLocation(shaderProgram, 'ratio');
            ParticlesSystem.prototype.particlesProgressUniform = gl.getUniformLocation(shaderProgram, 'progress');

            gl.useProgram(null);

        } else {

            console.error('Error linking Particles Shader Program.'
                    + '\n Shader Program Info Log: \n' + gl.getProgramInfoLog(shaderProgram)
                    + '\n Vertex Shader Info Log: \n' + gl.getShaderInfoLog(vertexShader)
                    + '\n Frgamnet Shader Info Log: \n' + gl.getShaderInfoLog(fragmentShader));

            gl.deleteProgram(shaderProgram);
            shaderProgram = null;
        }

        ParticlesSystem.prototype.shaderProgram = shaderProgram;

    } else {
        shaderProgram = ParticlesSystem.prototype.shaderProgram;
    }

    if (ParticlesSystem.prototype.framebuffer === null) {
        framebuffer = gl.createFramebuffer();
        frameTexture = gl.createTexture();

        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.bindTexture(gl.TEXTURE_2D, frameTexture);

        //configure framebuffer
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, frameTexture, 0);

        //configure frametexture
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        //set image base data 
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.framebufferSize, this.framebufferSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);

        ParticlesSystem.prototype.framebuffer = framebuffer;
        ParticlesSystem.prototype.particlesTexture = frameTexture;

    }

    return shaderProgram;
};

ParticlesSystem.prototype.setParticlesSpriteImage = function (gl, image) {
    var texture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, texture);

    //store particle sprite texture
    if (image) {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    } else {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(255, 255, 255, 255));

    }

    gl.bindTexture(gl.TEXTURE_2D, null);

    this.spriteTexture = texture;
};

ParticlesSystem.prototype.generateParticlesBuffer = function (gl, density) {

    density !== undefined || (density = this.density);

    this.density = density;

    var buffer;
    var length = this.density * 5;
    var bufferData = new Float32Array(length);
    var angle;

    for (var i = 0; i < length; i++) {

        angle = Math.random() * 2 * Math.PI;

        //define origin
        bufferData[i++] = 0;
        bufferData[i++] = 0;

        //define direction
        bufferData[i++] = Math.cos(angle);
        bufferData[i++] = Math.sin(angle);

        //define delay
        bufferData[i] = Math.random() * 2 - 1;

    }

    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, bufferData, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    this.particlesBuffer = buffer;
};

ParticlesSystem.prototype.destroy = function (gl) {
    gl.deleteBuffer(this.particlesBuffer);
    gl.deleteTexture(this.spriteTexture);
};

ParticlesSystem.prototype.update = function (gl) {
    gl.useProgram(this.shaderProgram);

    //update progress
    (this.progress += 0.01) <= 1 || (this.progress = 0.0);

    //enable attributes on shader
    gl.enableVertexAttribArray(ParticlesSystem.prototype.particleOriginAttrib);
    gl.enableVertexAttribArray(ParticlesSystem.prototype.particleDirectionAttrib);
    gl.enableVertexAttribArray(ParticlesSystem.prototype.particleDelayAttrib);

    //binding buffer to attrib
    gl.bindBuffer(gl.ARRAY_BUFFER, this.particlesBuffer);

    gl.vertexAttribPointer(ParticlesSystem.prototype.particleOriginAttrib, 2, gl.FLOAT, false, 20, 0);
    gl.vertexAttribPointer(ParticlesSystem.prototype.particleDirectionAttrib, 2, gl.FLOAT, true, 20, 8);
    gl.vertexAttribPointer(ParticlesSystem.prototype.particleDelayAttrib, 1, gl.FLOAT, false, 20, 16);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    //set particles coordinates
    gl.uniform1f(ParticlesSystem.prototype.particlesProgressUniform, this.progress);
    gl.uniform1f(ParticlesSystem.prototype.particlesRatioUniform, this.ratio);
    gl.uniform1f(ParticlesSystem.prototype.particlesSizeUniform, this.particlesSize);
    gl.uniform1i(ParticlesSystem.prototype.particlesHasSizeIncrementUniform, this.hasSizeIncrement);

    //enable sprite sampler
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.spriteTexture);

    //prepare framebuffer to draw updated system
    gl.bindFramebuffer(gl.FRAMEBUFFER, ParticlesSystem.prototype.framebuffer);
    gl.viewport(0, 0, this.framebufferSize, this.framebufferSize);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    //update particle sistem sprite texture
    gl.drawArrays(gl.POINTS, 0, this.density);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

};