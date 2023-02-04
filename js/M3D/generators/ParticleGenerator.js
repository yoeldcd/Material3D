
if(!window.M3D){
    window.M3D = {};
    window.M3D.Model = new Function();
    window.M3D.Model.Instance = new Function();
    window.M3D.Model.Material = new Function();
    
};

function ParticlesGenerator() {}

(function () {

    let ParticlesSystemGeneratedSystemID = 62673000;
    let ParticlesSystemGeneratedInstanceID = 62673000;
    
    const identityMatrix = new Uint8Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    const defaultSpriteImageData = new Uint8Array([
        255, 200, 0, 255,
        0, 0, 0, 0,
        255, 200, 0, 255,
        0, 0, 0, 0,
        255, 100, 0, 255,
        0, 0, 0, 0,
        255, 200, 0, 255,
        0, 0, 0, 0,
        255, 200, 0, 255
    ]);

    function computeDirection(dst, alpha, omega) {
        alpha *= (Math.PI / 180);
        omega *= (Math.PI / 180);
        
        let s, c, length;
        
        //initial direction { 0, 0, 1 }
        let vx, vy, vz;

        //rotate around X in CCW
        // vy' = vz * s + vy * c; --> vy' = vz * s
        // vz' = vz * c - vy * s; --> vz' = vz * c
        s = Math.sin(omega);
        c = Math.cos(omega);
        vy = s;
        vz = c;

        //rotate around Y in CCW
        // vx' = vz * s + vx * c; --> vx' = vz * s;
        // vz' = vz * c - vx * s; --> vz' = vz * c;
        s = Math.sin(alpha);
        c = Math.cos(alpha);
        vx = vz * s;
        vz *= c;

        //normalize direction vector
        length = Math.sqrt(vx * vx + vy * vy + vz * vz);
        if (length !== 0) {
            vx /= length;
            vy /= length;
            vz /= length;
        }

        //save direction
        dst[0] = vx;
        dst[1] = vy;
        dst[2] = vz;

        return dst;
    }

    //Particles System Generator
    ////////////////////////////////////////////////////////////////////////////
    ParticlesGenerator.preserveBufferData = false;

    ParticlesGenerator.generateParticlesSystem = function (gl, numParticles, generator, sprite) {
        
        numParticles || (numParticles = 100);
        generator || (generator = new ParticlesGenerator.RadialGenerator());
        sprite || (sprite = new ParticlesGenerator.SpritesColection(gl));

        let targetGLBuffer;
        let vertexGLBuffer;
        let indexGLBuffer;
        
        let vertexBufferArrayBuffer = new ArrayBuffer(64 * numParticles);
        let vertexBufferDataView = new DataView(vertexBufferArrayBuffer);
        let vertexBufferDataViewOffset = 0;
        
        //define vertex buffer attribs
        let vertexGLBufferAttribs = {
            origin: {type: gl.BYTE, size: 4, offset: 0, normalized: false},
            direction: {type: gl.BYTE, size: 4, offset: 4, normalized: true},
            coords: {type: gl.BYTE, size: 4, offset: 8, normalized: false},
            metadata: {type: gl.BYTE, size: 4, offset: 12, normalized: false}
        };

        let indexBufferArray = new Uint16Array(6 * numParticles);
        let indexBufferArrayOffset = 0;
        let vertexsNumber = 0;

        let particle = new ParticlesGenerator.Particle();
        let particlesSystem = new ParticlesGenerator.ParticlesSystem();

        let spritesNumber = sprite.spritesNumber;
        let spritesOffset = sprite.spritesOffset;


        /*@NOTE: Store each particle data on buffer,
         * using triangles to make bilboards quads
         * and provide particle unit metadata. 
         * 
         * FOR_EACH: particel_vertex                
         *      byte[4] (4 bytes) origin            { originX, originY, originZ, 0 }
         *      byte[4] (4 bytes) direction         { directionX, directionY, directionZ, 0}
         *      byte[4] (4 bytes) quad_vertex_coord { coordsX, coordsY, 0, 0 }
         *      byte[4] (4 bytes) metadata          { delay, spriteNumber, size }
         * LOOP.
         * 
         */
        for (let i = 0; i < numParticles; i++) {

            //generate particle configuration
            generator.generateParticle(particle);

            //select sub-sprite number
            particle.sprite = parseInt(Math.random() * (spritesNumber - spritesOffset) + spritesOffset);

            //add particle poligon vertex's
            this.storeParticleVertex(particle, vertexBufferDataView, vertexBufferDataViewOffset, -1, 1);
            this.storeParticleVertex(particle, vertexBufferDataView, vertexBufferDataViewOffset + 16, 1, 1);
            this.storeParticleVertex(particle, vertexBufferDataView, vertexBufferDataViewOffset + 32, 1, -1);
            this.storeParticleVertex(particle, vertexBufferDataView, vertexBufferDataViewOffset + 48, -1, -1);

            //add particle poligon index's
            indexBufferArray[indexBufferArrayOffset + 0] = vertexsNumber + 2;
            indexBufferArray[indexBufferArrayOffset + 1] = vertexsNumber + 1;
            indexBufferArray[indexBufferArrayOffset + 2] = vertexsNumber;
            indexBufferArray[indexBufferArrayOffset + 3] = vertexsNumber + 3;
            indexBufferArray[indexBufferArrayOffset + 4] = vertexsNumber + 2;
            indexBufferArray[indexBufferArrayOffset + 5] = vertexsNumber;

            vertexsNumber += 4;
            vertexBufferDataViewOffset += 64;
            indexBufferArrayOffset += 6;
        }

        //store vertex buffer data on GL_BUFFER
        targetGLBuffer = gl.ARRAY_BUFFER;
        vertexGLBuffer = gl.createBuffer();
        gl.bindBuffer(targetGLBuffer, vertexGLBuffer);
        gl.bufferData(targetGLBuffer, vertexBufferArrayBuffer, gl.STATIC_DRAW);
        gl.bindBuffer(targetGLBuffer, null);

        //store index buffer data on GL_BUFFER
        targetGLBuffer = gl.ELEMENT_ARRAY_BUFFER;
        indexGLBuffer = gl.createBuffer();
        gl.bindBuffer(targetGLBuffer, indexGLBuffer);
        gl.bufferData(targetGLBuffer, indexBufferArray, gl.STATIC_DRAW);
        gl.bindBuffer(targetGLBuffer, null);

        //define buffer's properties
        vertexGLBuffer.byteLength = 64 * numParticles;
        vertexGLBuffer.vertexsNumber = 4 * numParticles;
        vertexGLBuffer.vertexStride = 16;
        vertexGLBuffer.vertexAttribs = vertexGLBufferAttribs;
        vertexGLBuffer.bufferData = this.preserveBufferData ? vertexBufferArrayBuffer : null;

        indexGLBuffer.byteLength = 2 * numParticles * 6;
        indexGLBuffer.indexsNumber = 6 * numParticles;
        indexGLBuffer.indexStride = 2;
        indexGLBuffer.indexUnpackFormat = gl.UNSIGNED_SHORT;
        indexGLBuffer.bufferData = this.preserveBufferData ? indexBufferArray : null;
        
        //save buffers
        particlesSystem.vertexBuffer = vertexGLBuffer;
        particlesSystem.indexBuffer = indexGLBuffer;
        particlesSystem.sprite = sprite;
        particlesSystem.shader = ParticlesGenerator.getParticlesRenderShader(gl);
        
        particlesSystem.maxParticles = numParticles;
        
        return particlesSystem;
    };

    ParticlesGenerator.storeParticleVertex = function (particle, vertexDataView, vertexOffset, vx, vy) {
        
        /*@NOTE: When send numbers on format integer of 8 or 16 bites
         * received on float a signed int value ranges betwen 
         * (- 2^7 to 2^7) and (- 2^15 to 2^15). From that you need
         * multiply float value by one absolute integer and later
         * normalize it.
         * 
         * delay -> value ( 0% - 100% )
         * size  -> value ( 0% - 100% )
         * 
         */

        //store particle origin 
        vertexDataView.setInt8(vertexOffset + 0, particle.origin[0]);
        vertexDataView.setInt8(vertexOffset + 1, particle.origin[1]);
        vertexDataView.setInt8(vertexOffset + 2, particle.origin[2]);
        vertexDataView.setInt8(vertexOffset + 3, 0);

        //store particle direction
        vertexDataView.setInt8(vertexOffset + 4, particle.direction[0] * 0x7F);
        vertexDataView.setInt8(vertexOffset + 5, particle.direction[1] * 0x7F);
        vertexDataView.setInt8(vertexOffset + 6, particle.direction[2] * 0x7F);
        vertexDataView.setInt8(vertexOffset + 7, 0);

        //store particle vertex coords
        vertexDataView.setInt8(vertexOffset + 8, vx);
        vertexDataView.setInt8(vertexOffset + 9, vy);
        vertexDataView.setInt8(vertexOffset + 10, 0);
        vertexDataView.setInt8(vertexOffset + 11, 0);

        //store particle metadata
        vertexDataView.setInt8(vertexOffset + 12, particle.delay);
        vertexDataView.setInt8(vertexOffset + 13, particle.sprite);
        vertexDataView.setInt8(vertexOffset + 14, particle.size);
        vertexDataView.setInt8(vertexOffset + 15, 0);

    };

    ParticlesGenerator.getParticlesRenderShader = function (gl) {
        let vertexShader;
        let vertexShaderSource;
        let vertexShaderInfo;

        let fragmentShader;
        let fragmentShaderSource;
        let fragmentShaderInfo;

        let shaderProgram;
        let shaderProgramInfo;
        let isLinkedProgram;

        let shaderAttribs;
        let shaderUniforms;

        if (!ParticlesGenerator.RENDER_SHADER) {

            //DEFINIENDO SHADER SOURCE CODE GLSL
            {
                vertexShaderSource = "precision lowp float;\n" +
                        "precision lowp int;\n" +
                        "\n" +
                        "const vec3 vecZ = vec3(0.0, 0.0, 1.0);\n" +
                        "\n" +
                        "struct Camera {\n" +
                        "    highp mat4 mview;\n" +
                        "    highp mat4 mlook;\n"+
                        "    highp mat4 mproject;\n" +
                        "    vec3 coords;\n" +
                        "};\n" +
                        "\n" +
                        "struct Sprite {\n" +
                        "    float rows;\n" +
                        "    float columns;\n" +
                        "    float texel_y;\n" +
                        "    float texel_x;\n" +
                        "};\n" +
                        "\n" +
                        "attribute vec3 particleOrigin;\n" +
                        "attribute vec3 particleDirection;\n" +
                        "attribute vec2 vertexCoords;\n" +
                        "attribute vec3 particleMetadata;\n" +
                        "\n" +
                        "varying vec2 ftexel;\n" +
                        "varying float umbral;\n" +
                        "\n" +
                        "uniform Camera camera;\n" +
                        "uniform Sprite sprite;\n" +
                        "uniform mat4 mtransform;\n" +
                        "\n" +
                        "uniform float time;\n" +
                        "uniform float ratio;\n" +
                        "\n" +
                        "uniform bool resize;\n" +
                        "uniform bool loop;\n" +
                        "uniform float iteration;\n" +
                        "\n" +
                        "\n" +
                        "vec3 camera_rigth;\n" +
                        "vec3 camera_up;\n" +
                        "\n" +
                        "float value;\n" +
                        "float delay;\n" +
                        "float size;\n" +
                        "float spriteID;\n" +
                        "\n" +
                        "float z;\n" +
                        "float row;\n" +
                        "float col;\n" +
                        "\n" +
                        "void main(){\n" +
                        "    \n" +
                        "    //compute delayed value\n" +
                        "    value = time;\n" +
                        "    if(loop)\n" +
                        "        value += particleMetadata.x * 0.01;\n" +
                        "    \n" +
                        "    //normalize time value 0.0 --> 1.0\n" +
                        "    if(value > 1.0)\n" +
                        "        value -= 1.0;\n" +
                        "    \n" +
                        "    //jump particles sub-enables\n" +
                        "    if(value < 0.0)\n" +
                        "        return;\n" +
                        "    \n" +
                        "    //define particle sprite ID\n" +
                        "    spriteID = particleMetadata.y;\n" +
                        "    \n" +
                        "    //define particle size\n" +
                        "    size = particleMetadata.z * 0.01;\n" +
                        "    if(resize)\n" +
                        "        size *= value;\n" +
                        "    \n" +
                        "    //compute particle poligon center\n" +
                        "    gl_Position.xyz = particleOrigin / 100.0;\n" +
                        "    gl_Position.xyz += (value * ratio * particleDirection);\n" +
                        "    gl_Position.w = 1.0;\n" +
                        "    //compute vertex position relative to view \n" +
                        "    gl_Position = mtransform * gl_Position;\n" +
                        "    gl_Position += camera.mlook * vec4(vertexCoords.x * size, vertexCoords.y * size, 0.0, 0.0); \n"+
                        "    \n" +
                        "    //compute vertex position viewed\n" +
                        "    gl_Position = camera.mproject * camera.mview * gl_Position;\n" +
                        "    \n" +
                        "    //normlaize texel Coord\n" +
                        "    ftexel.s = vertexCoords.x * 0.5 + 0.5;\n" +
                        "    ftexel.t = vertexCoords.y * 0.5 + 0.5;\n" +
                        "    \n" +
                        "    //cast to integer index\n" +
                        "    spriteID = float(int(spriteID));\n" +
                        "    \n" +
                        "    //get row and column\n" +
                        "    row = float(int(spriteID / sprite.columns));\n" +
                        "    col = spriteID - sprite.columns * row;\n" +
                        "    \n" +
                        "    //invert row value\n" +
                        "    row = sprite.rows - row - 1.0;\n" +
                        "    \n" +
                        "    //compute final texel Coords\n" +
                        "    ftexel.s = ftexel.s * sprite.texel_x + col * sprite.texel_x;\n" +
                        "    ftexel.t = ftexel.t * sprite.texel_y + row * sprite.texel_y;\n" +
                        "    \n" +
                        "}\n";

                fragmentShaderSource = "precision lowp float;\n" +
                        "precision lowp int;\n" +
                        "\n" +
                        "struct Sprite {\n" +
                        "    float rows;\n" +
                        "    float columns;\n" +
                        "    float texel_y;\n" +
                        "    float texel_x;\n" +
                        "};\n" +
                        "\n" +
                        "varying vec2 ftexel;\n" +
                        "uniform Sprite sprite;\n" +
                        "uniform sampler2D spriteImage;\n" +
                        "\n" +
                        "void main(){\n" +
                        "   \n" +
                        "   gl_FragColor = texture2D(spriteImage, ftexel);\n" +
                        "   \n" +
                        "   if(gl_FragColor.a < 0.5)\n" +
                        "        discard;\n" +
                        "   \n" +
                        "}\n";
            }

            //generate and compile vertex shader
            vertexShader = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(vertexShader, vertexShaderSource);
            gl.compileShader(vertexShader);
            vertexShaderInfo = gl.getShaderInfoLog(vertexShader);

            //generate and compile fragment shader
            fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(fragmentShader, fragmentShaderSource);
            gl.compileShader(fragmentShader);
            fragmentShaderInfo = gl.getShaderInfoLog(fragmentShader);

            //attach shaders if is compiled
            if (!vertexShaderInfo && !fragmentShaderInfo) {

                //create shader program
                shaderProgram = gl.createProgram();
                gl.attachShader(shaderProgram, vertexShader);
                gl.attachShader(shaderProgram, fragmentShader);
                gl.linkProgram(shaderProgram);

                isLinkedProgram = gl.getProgramParameter(shaderProgram, gl.LINK_STATUS);
                shaderProgramInfo = gl.getProgramInfoLog(shaderProgram);

                //get program attribs and uniforms references
                if (isLinkedProgram) {
                    shaderAttribs = new Object();
                    shaderUniforms = new Object();

                    //enable shader to use
                    gl.useProgram(shaderProgram);

                    //get shader attribs indexs
                    shaderAttribs.origin = gl.getAttribLocation(shaderProgram, 'particleOrigin');
                    shaderAttribs.direction = gl.getAttribLocation(shaderProgram, 'particleDirection');
                    shaderAttribs.coords = gl.getAttribLocation(shaderProgram, 'vertexCoords');
                    shaderAttribs.metadata = gl.getAttribLocation(shaderProgram, 'particleMetadata');

                    //get shader uniforms reference
                    shaderUniforms.mtransform = gl.getUniformLocation(shaderProgram, 'mtransform');
                    shaderUniforms.spriteImage = gl.getUniformLocation(shaderProgram, 'spriteImage'),
                    shaderUniforms.time = gl.getUniformLocation(shaderProgram, 'time');
                    shaderUniforms.ratio = gl.getUniformLocation(shaderProgram, 'ratio');
                    shaderUniforms.loop = gl.getUniformLocation(shaderProgram, 'loop');
                    shaderUniforms.resize = gl.getUniformLocation(shaderProgram, 'resize');

                    //get shader sprite uniforms struct reference
                    shaderUniforms.sprite = {
                        rows: gl.getUniformLocation(shaderProgram, 'sprite.rows'),
                        columns: gl.getUniformLocation(shaderProgram, 'sprite.columns'),
                        texel_x: gl.getUniformLocation(shaderProgram, 'sprite.texel_x'),
                        texel_y: gl.getUniformLocation(shaderProgram, 'sprite.texel_y')
                    };

                    //get shader camera uniforms struct reference
                    shaderUniforms.camera = {
                        mview: gl.getUniformLocation(shaderProgram, 'camera.mview'),
                        mlook: gl.getUniformLocation(shaderProgram, 'camera.mlook'),
                        mproject: gl.getUniformLocation(shaderProgram, 'camera.mproject'),
                        coords: gl.getUniformLocation(shaderProgram, 'camera.coords')
                    };

                    //define shader methods
                    shaderProgram.disableVertexAttribs = function () {
                        gl.disableVertexAttribArray(this.attribs.coords);
                        gl.disableVertexAttribArray(this.attribs.normals);
                        gl.disableVertexAttribArray(this.attribs.texels);
                        gl.disableVertexAttribArray(this.attribs.metadata);
                    };
                    shaderProgram.destroy = function () {
                        gl.detachShader(this, this.vertexShader);
                        gl.detachShader(this, this.fragmentShader);
                        gl.deleteProgram(this);

                        this.vertexShader = gl.deleteShader(this.vertexShader);
                        this.fragmentShader = gl.deleteShader(this.fragmentShader);

                        return null;
                    };

                    //define shader properties
                    shaderProgram.isRenderShader = true;
                    shaderProgram.vertexShader = vertexShader;
                    shaderProgram.fragmentShader = fragmentShader;
                    shaderProgram.attribs = shaderAttribs;
                    shaderProgram.uniforms = shaderUniforms;
                    shaderProgram.id = 62670000;

                    //save render shader
                    ParticlesGenerator.RENDER_SHADER = shaderProgram;

                } else {
                    console.error('Can\'t link program because: \n' + shaderProgramInfo);
                }

            } else {
                vertexShaderInfo && console.warn('Can\'t compile vertex shader because: \n' + vertexShaderInfo);
                fragmentShader && console.warn('Can\'t compile fragment shader because: \n' + fragmentShaderInfo);

                isLinkedProgram = false;

            }

            //destroy unvalid's resources
            if (!isLinkedProgram) {
                gl.deleteShader(vertexShader);
                gl.deleteShader(fragmentShader);
                gl.deleteProgram(shaderProgram);
            }

        }

        return ParticlesGenerator.RENDER_SHADER;
    };

    //Particle
    ////////////////////////////////////////////////////////////////////////////
    ParticlesGenerator.Particle = function () {
        this.origin = new Float32Array(3);
        this.direction = new Float32Array(3);
        this.sprite = 0;
        this.delay = 0;
        this.size = 1;
    };

    //Type System Generator (Radial)
    ////////////////////////////////////////////////////////////////////////////
    ParticlesGenerator.RadialGenerator = function (minAlpha, maxAlpha, minOmega, maxOmega, minSize, maxSize) {
        
        this.minAlpha = minAlpha || 0;
        this.maxAlpha = maxAlpha || 360;
        this.minOmega = minOmega || - 90;
        this.maxOmega = maxOmega || 90;
        
        this.minSize = minSize || 0.1;
        this.maxSize = maxSize || 0.1;
    };

    ParticlesGenerator.RadialGenerator.prototype.generateParticle = function (particle) {
        let alpha = Math.random() * (this.maxAlpha - this.minAlpha) + this.minAlpha;
        let omega = Math.random() * (this.maxOmega - this.minOmega) + this.minOmega;

        computeDirection(particle.direction, alpha, omega);
        
        particle.delay = 100 * Math.random();
        particle.size = 100 * (Math.random() * (this.maxSize - this.minSize) + this.minSize);

    };
    
    //Type System Generator (Lineal)
    ////////////////////////////////////////////////////////////////////////////
    ParticlesGenerator.LinealGenerator = function (direction, bounds, minSize, maxSize) {
        direction || (direction = [0,1,0]);
        
        this.directionX = direction[0] || 0;
        this.directionY = direction[1] || 0;
        this.directionZ = direction[2] || 0;
        
        this.boundX = 50 * (bounds[0] || 0);
        this.boundY = 50 * (bounds[1] || 0);
        this.boundZ = 50 * (bounds[2] || 0);
        
        this.minSize = minSize || 0.1;
        this.maxSize = maxSize || 0.1;
        
    };
    
    ParticlesGenerator.LinealGenerator.prototype.generateParticle = function (particle) {
        
        //compute particle origin
        particle.origin[0] = (Math.random() * 2 - 1) * this.boundX;
        particle.origin[1] = (Math.random() * 2 - 1) * this.boundY;
        particle.origin[2] = (Math.random() * 2 - 1) * this.boundZ;
        
        //define particle direction
        particle.direction[0] = this.directionX;
        particle.direction[1] = this.directionY;
        particle.direction[2] = this.directionZ;
        
        //define particle properties
        particle.delay = 100 * Math.random();
        particle.size = 100 * (Math.random() * (this.maxSize - this.minSize) + this.minSize);
        
    };
    
    //Particle System Sprite
    ////////////////////////////////////////////////////////////////////////////
    ParticlesGenerator.SpritesColection = function (gl, src, rows, columns, number, offset) {

        this.rows = rows || 1;
        this.columns = columns || 1;

        this.spritesNumber = number || (this.rows * this.columns);
        this.spritesOffset = offset || 0;

        this.texture = gl.createTexture();

        //create default sprite texture
        ////////////////////////////////////////////////////////////////////////////
        let imageData = new Uint8Array(defaultSpriteImageData);

        //store texture default data
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 3, 3, 0, gl.RGBA, gl.UNSIGNED_BYTE, defaultSpriteImageData);

        //set texture parameters
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.bindTexture(gl.TEXTURE_2D, null);
        ////////////////////////////////////////////////////////////////////////////

        this.texture.image = imageData;

        if (src)
            this.setSpriteImage(gl, src);

    };

    ParticlesGenerator.SpritesColection.prototype.setSpriteImage = function (gl, src) {
        let image = null;
        let self = this;

        if (src) {
            if (src instanceof window.HTMLImageElement) {
                image = src;

                //use provided HTMLImage
                ////////////////////////////////////////////
                if (image.complete) {
                    this.storeSpriteTexture(gl, image);
                } else {
                    image.onload = function () {
                        self.storeSpriteTexture(gl, image);
                        console.log('Loaded image sprite on URL ' + image.src);
                    };

                    image.onerror = function () {
                        console.error('Can\'t be load image sprite on URL ' + image.src);
                    };
                }

            } else if (typeof (src) === 'string') {

                //Load image using src URL
                ////////////////////////////////////////////
                image = document.createElement('img');

                image.onload = function () {
                    self.storeSpriteTexture(gl, image);
                    console.log('Loaded image sprite on URL ' + image.src);
                };

                image.onerror = function () {
                    console.error('Don\'t Loaded image sprite on URL ' + image.src);
                };

                image.src = src;

            } else {
                console.error('Whrong source image suplied ' + src);
                console.log(typeof (src));
                
            }
        }

    };

    ParticlesGenerator.SpritesColection.prototype.storeSpriteTexture = function (gl, image) {
        
        if (image) {
            gl.bindTexture(gl.TEXTURE_2D, this.texture);

            //store texture data
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

            gl.bindTexture(gl.TEXTURE_2D, null);

            this.texture.image = image;
        }
        
    };

    //Renderizable Particles System
    ////////////////////////////////////////////////////////////////////////////
    ParticlesGenerator.ParticlesSystem = function (sprite) {
        this.id = ParticlesSystemGeneratedSystemID++;

        this.vertexBuffer = null;
        this.indexBuffer = null;

        this.sprite = sprite;
        this.shader = null;

        this.maxParticles = 0;
        this.maxDistance = 1;
        this.isResizeable = false;
        this.isLoopeable = false;
        
        this.prepared = false;

        this.drawCalls = new Array(100);
        this.drawCallsNumber = 0;

    };

    ParticlesGenerator.ParticlesSystem.prototype = Object.create(M3D.Model.prototype);

    ParticlesGenerator.ParticlesSystem.prototype.makeInstance = function () {
        return new ParticlesGenerator.ParticlesSystem.Instance(this);
    };

    ParticlesGenerator.ParticlesSystem.prototype.prepare = function (gl, shader) {

        if (!shader)
            return;

        //vertex values
        let vertexBuffer = this.vertexBuffer;
        let indexBuffer = this.indexBuffer;

        //shader elements vars
        let shaderAttribs = shader.attribs;
        let shaderUniforms = shader.uniforms;
        let vertexAttribs = vertexBuffer.vertexAttribs;

        //attrib asignation vars
        let vertexStride = vertexBuffer.vertexStride;
        let vertexAttrib = null;
        let shaderAttrib = null;

        let sprite = this.sprite;

        //LINK BUFFER TO ATTRIBs LOCATIONs
        ///////////////////////////////////////////////////////////////
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

        //particle vertex origin
        shaderAttrib = shaderAttribs.origin;
        vertexAttrib = vertexAttribs.origin;

        if (shaderAttrib !== -1) {
            if (vertexAttrib) {
                gl.enableVertexAttribArray(shaderAttrib);
                gl.vertexAttribPointer(shaderAttrib, vertexAttrib.size, vertexAttrib.type, vertexAttrib.normalized, vertexStride, vertexAttrib.offset);

            } else {
                gl.disableVertexAttribArray(shaderAttrib);
                gl.vertexAttrib4f(shaderAttrib, 0, 0, 0, 1);

            }
        }
        ///////////////////////////////

        //particle vertex direction
        shaderAttrib = shaderAttribs.direction;
        vertexAttrib = vertexAttribs.direction;

        if (shaderAttrib !== -1) {
            if (vertexAttrib) {
                gl.enableVertexAttribArray(shaderAttrib);
                gl.vertexAttribPointer(shaderAttrib, vertexAttrib.size, vertexAttrib.type, vertexAttrib.normalized, vertexStride, vertexAttrib.offset);

            } else {
                gl.disableVertexAttribArray(shaderAttrib);
                gl.vertexAttrib4f(shaderAttrib, 0, 1, 0, 1);

            }
        }
        ///////////////////////////////

        //particle vertex bilboard coords
        shaderAttrib = shaderAttribs.coords;
        vertexAttrib = vertexAttribs.coords;

        if (shaderAttrib !== -1) {
            if (vertexAttrib) {
                gl.enableVertexAttribArray(shaderAttrib);
                gl.vertexAttribPointer(shaderAttrib, vertexAttrib.size, vertexAttrib.type, vertexAttrib.normalized, vertexStride, vertexAttrib.offset);

            } else {
                gl.disableVertexAttribArray(shaderAttrib);
                gl.vertexAttrib4f(shaderAttrib, 0, 0, 0, 1);

            }
        }
        ///////////////////////////////

        //particle vertex metadata
        shaderAttrib = shaderAttribs.metadata;
        vertexAttrib = vertexAttribs.metadata;

        if (shaderAttrib !== -1) {
            if (vertexAttrib) {
                gl.enableVertexAttribArray(shaderAttrib);
                gl.vertexAttribPointer(shaderAttrib, vertexAttrib.size, vertexAttrib.type, vertexAttrib.normalized, vertexStride, vertexAttrib.offset);

            } else {
                gl.disableVertexAttribArray(shaderAttrib);
                gl.vertexAttrib4f(shaderAttrib, 0, 0, 0, 1);

            }
        }
        ///////////////////////////////

        //close vertex buffers
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

        if (shaderUniforms && shaderUniforms.sprite) {

            //send sprite sampler unit to shader
            gl.uniform1i(shaderUniforms.spriteImage, 0);

            //send sprite structure to shader
            /////////////////////////////////////////////////////////////
            gl.uniform1f(shaderUniforms.sprite.rows, sprite.rows);
            gl.uniform1f(shaderUniforms.sprite.columns, sprite.columns);
            gl.uniform1f(shaderUniforms.sprite.texel_x, 1 / sprite.rows);
            gl.uniform1f(shaderUniforms.sprite.texel_y, 1 / sprite.columns);

            //send particles systems uniforms
            /////////////////////////////////////////////////////////////
            gl.uniform1f(shaderUniforms.ratio, this.maxDistance);
            gl.uniform1i(shaderUniforms.resize, this.isResizeable ? 1 : 0);
            gl.uniform1i(shaderUniforms.loop, this.isLoopeable ? 1 : 0);

            //bind texture sprite
            /////////////////////////////////////////////////////////////
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, sprite.texture);

        }

        this.prepared = true;
    };

    ParticlesGenerator.ParticlesSystem.prototype.unprepare = function (gl, shader) {
        if (!shader)
            return;

        shader.disableVertexAttribs(gl);
        this.prepared = false;
    };

    ParticlesGenerator.ParticlesSystem.prototype.addDrawCall = function (drawCallInstance) {
        if (drawCallInstance instanceof ParticlesGenerator.ParticlesSystem.Instance) {
            this.drawCalls[this.drawCallsNumber] = drawCallInstance;
            this.drawCallsNumber++;
        }

        return drawCallInstance;
    };

    ParticlesGenerator.ParticlesSystem.prototype.executeDrawCalls = function (gl, preserveDrawCalls) {

        //model resources
        let shaderUniforms = this.shader.uniforms;

        //model draw vars
        let particlesIndexs = this.maxParticles * 6;
        let indexsNumber = this.indexBuffer.indexsNumber;
        let indexUnpackFormat = this.indexBuffer.indexUnpackFormat;
        
        //get an valid index number
        if(particlesIndexs <= indexsNumber){
            indexsNumber = particlesIndexs;
        }
        
        //draw calls vars
        let drawCalls = this.drawCalls;
        let drawCallsNumber = this.drawCallsNumber;
        let instance;
        
        //draw prepared model
        if (this.prepared) {
            //draw each instance call's
            //////////////////////////////////////////////////////////
            for (let i = 0; i < drawCallsNumber; i++) {
                instance = drawCalls[i];
                
                //send instance state uniforms to shader
                gl.uniformMatrix4fv(shaderUniforms.mtransform, false, instance.transformMatrix);
                gl.uniform1f(shaderUniforms.time, instance.time);
                
                //use indexed draw method
                gl.drawElements(gl.TRIANGLES, indexsNumber, indexUnpackFormat, 0);

            }
            //////////////////////////////////////////////////////////
            
            if (!preserveDrawCalls)
                //reset draw call's number
                this.drawCallsNumber = 0;
        }
        
    };

    ParticlesGenerator.ParticlesSystem.prototype.destroy = function (gl) {
        this.vertexBuffer = gl.deleteBuffer(this.vertexBuffer);
        this.indexBuffer = gl.deleteBuffer(this.indexBuffer);
    };

    //Particles System Instance
    ////////////////////////////////////////////////////////////////////////////
    ParticlesGenerator.ParticlesSystem.Instance = function (model) {

        this.id = ParticlesSystemGeneratedInstanceID++;
        
        this.model = model;

        this.transformMatrix = new Float32Array(identityMatrix);

        //create dinamical coordinates getter
        this.coords = {self: this};
        Object.defineProperty(this.coords, 'x', {
            get: function () {
                return this.self.transformMatrix[12];
            },
            set: function (x) {
                this.self.transformMatrix[12] = x;
            }});
        Object.defineProperty(this.coords, 'y', {
            get: function () {
                return this.self.transformMatrix[13];
            },
            set: function (y) {
                this.self.transformMatrix[13] = y;
            }});
        Object.defineProperty(this.coords, 'z', {
            get: function () {
                return this.self.transformMatrix[14];
            },
            set: function (z) {
                this.self.transformMatrix[14] = z;
            }});

        //particle system states
        this.time = 0;
        this.speed = 1;
        
    };

    ParticlesGenerator.ParticlesSystem.Instance.prototype = Object.create(M3D.Model.Instance.prototype);

    ParticlesGenerator.ParticlesSystem.Instance.prototype.setCoords = function (x, y, z) {
        this.transformMatrix[12] = x;
        this.transformMatrix[13] = y;
        this.transformMatrix[14] = z;
    };

    ParticlesGenerator.ParticlesSystem.Instance.prototype.updateParticles = function (delta) {
        delta || (delta = 1);
        
        //update system time
        if (this.time < 0.0)
            this.time = 1.0;
        else if (this.time > 1.0)
            this.time = 0.0;
        else
            this.time += this.speed * delta;
        
    };
    
    ParticlesGenerator.ParticlesSystem.Instance.prototype.sendDrawCall = function () {
        this.model.addDrawCall(this);
    
    };

    ParticlesGenerator.ParticlesSystem.Instance.prototype.draw = function (gl) {
        let uniforms = this.model.shader.uniforms;
        
        //update progress
        if (this.time < 0.0)
            this.time = 1.0;
        else if (this.time > 1.0)
            this.time = 0.0;
        else
            this.time += this.speed;
        
        gl.uniformMatrix4fv(uniforms.mtransform, false, this.transformMatrix);
        gl.uniform1f(uniforms.time, this.time);

        this.model.draw(gl);
    };

})();
