
function BilboardSprite() {}

BilboardSprite.prototype.ratio = 1.0;

BilboardSprite.prototype.vertexCoordsBuffer = null;
BilboardSprite.prototype.elemmentIndexBuffer = null;
BilboardSprite.prototype.spriteTexture = null;
BilboardSprite.prototype.shaderProgram = null;

BilboardSprite.prototype.bilboardVertexCoordsAttrib = -1;

BilboardSprite.prototype.bilboardTransformMatrixUniform = null;
BilboardSprite.prototype.bilboardCameraViewMatrixUniform = null;
BilboardSprite.prototype.bilboardCameraProjectionMatrixUniform = null;
BilboardSprite.prototype.bilboardRatioUniform = null;

BilboardSprite.prototype.createBilboardShader = function (gl) {

    var vertexCode = '' +
            'precision mediump float;   \n' +
            '\n' +
            'attribute vec2 coords;     \n' +
            '\n' +
            'uniform mat4 mtransform;   \n' +
            'uniform mat4 mview;        \n' +
            'uniform mat4 mprojection;  \n' +
            'uniform float ratio;       \n' +
            '\n' +
            'varying vec2 ftexel;       \n' +
            '\n' +
            'void main(){               \n' +
            '   \n' +
            '   gl_Position = mprojection * mview * mtransform * vec4(coords, 0.0, 1.0); \n' +
            '   ftexel.x = (coords.x + 1.0) / 2.0; \n' +
            '   ftexel.y = (coords.y + 1.0) / 2.0; \n' +
            '}\n' +
            '\n';

    var fragmentCode =
            'precision mediump float;\n' +
            '\n' +
            'uniform sampler2D sprite;\n' +
            'varying vec2 ftexel;\n' +
            '\n' +
            'void main(){\n' +
            '   gl_FragColor = texture2D(sprite, ftexel);\n' +
            '   \n' +
            '   if(gl_FragColor.a == 0.0)\n' +
            '       discard;\n' +
            '}\n' +
            '\n';

    var vertexShader = null;
    var fragmentShader = null;
    var shaderProgram = null;

    var vertexBufferData;
    var indexBufferData;
    var vertexBuffer;
    var indexBuffer;

    if (BilboardSprite.prototype.shaderProgram === null) {

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
            BilboardSprite.prototype.bilboardVertexCoordsAttrib = gl.getAttribLocation(shaderProgram, 'coords');

            //enable attributes on shader
            gl.enableVertexAttribArray(BilboardSprite.prototype.bilboardVertexCoordsAttrib);

            //get shader uniforms
            BilboardSprite.prototype.bilboardTransformMatrixUniform = gl.getUniformLocation(shaderProgram, 'mtransform');
            BilboardSprite.prototype.bilboardCameraViewMatrixUniform = gl.getUniformLocation(shaderProgram, 'mview');
            BilboardSprite.prototype.bilboardCameraProjectionMatrixUniform = gl.getUniformLocation(shaderProgram, 'mprojection');
            BilboardSprite.prototype.bilboardRatioUniform = gl.getUniformLocation(shaderProgram, 'ratio');

            gl.useProgram(null);

        } else {

            console.error('Error linking Sprite Shader Program.'
                    + '\n Shader Program Info Log: \n' + gl.getProgramInfoLog(shaderProgram)
                    + '\n Vertex Shader Info Log: \n' + gl.getShaderInfoLog(vertexShader)
                    + '\n Frgamnet Shader Info Log: \n' + gl.getShaderInfoLog(fragmentShader));

            gl.deleteProgram(shaderProgram);
            shaderProgram = null;
        }

        //build sprite buffer
        vertexBufferData = new Float32Array([
            -1.0, 1.0,
            1.0, 1.0,
            1.0, -1.0,
            -1.0, -1.0
        ]);
        indexBufferData = new Uint16Array([2, 1, 0, 2, 0, 3]);

        //store and enable buffer
        vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertexBufferData, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexBufferData, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        //save references
        BilboardSprite.prototype.vertexCoordsBuffer = vertexBuffer;
        BilboardSprite.prototype.elementIndexBuffer = indexBuffer;
        BilboardSprite.prototype.shaderProgram = shaderProgram;

    } else {
        shaderProgram = BilboardSprite.prototype.shaderProgram;

    }

    return shaderProgram;
};

BilboardSprite.prototype.setSpriteImage = function (gl, image) {
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

BilboardSprite.prototype.destroy = function (gl) {
    !BilboardSprite.prototype.vertexCoordsBuffer || (BilboardSprite.prototype.vertexCoordsBuffer = gl.deleteBuffer(BilboardSprite.prototype.vertexCoordsBuffer));
    !BilboardSprite.prototype.elementIndexBuffer || (BilboardSprite.prototype.elementIndexBuffer = gl.deleteBuffer(BilboardSprite.prototype.elementIndexBuffer));
    !this.spriteTexture || (this.spriteTexture = gl.deleteTexture(this.spriteTexture));
};

BilboardSprite.prototype.prepare = function (gl) {
    gl.useProgram(BilboardSprite.prototype.shaderProgram);
    gl.uniform1f(BilboardSprite.prototype.bilboardRatioUniform, this.ratio);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.spriteTexture);

    //enable buffers attribs
    gl.bindBuffer(gl.ARRAY_BUFFER, BilboardSprite.prototype.vertexCoordsBuffer);
    gl.vertexAttribPointer(BilboardSprite.prototype.bilboardVertexCoordsAttrib, 2, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, BilboardSprite.prototype.elementIndexBuffer);

};

BilboardSprite.prototype.draw = function (gl) {
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
};