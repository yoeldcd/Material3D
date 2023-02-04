
if(!window.M3D){
    window.M3D = {};
    window.M3D.Model = new Function();
    window.M3D.Model.Instance = new Function();
    window.M3D.Model.Material = new Function();
    
}

let STLModelLoader = {};

(function () {
    let identityMatrix = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    
    let STLGeneratedModelID = 62672000;
    let STLGeneratedInstanceID = 62672000;

    function BoundBox() {
        this.rigth = -999999999;
        this.left = 999999999;
        this.up = -999999999;
        this.down = 999999999;
        this.near = -999999999;
        this.far = 999999999;

        this.centerX = 0;
        this.centerY = 0;
        this.centerZ = 0;
    }

    //STL Model Loader
    ////////////////////////////////////////////////////////////////////////////
    STLModelLoader.GENERATED_MODEL_ID = 62672000;
    
    /** @description Describe when use loaded normal vectors { if dont exist normal vector it is computed } */
    STLModelLoader.USE_LOADED_NORMAL = 62673;

    /** @description Describe when use only computed normal vector */
    STLModelLoader.USE_COMPUTED_NORMAL = 62674;
    
    /** @description Default render shader program use to draw model { use is optinal } */
    STLModelLoader.RENDER_SHADER = null;

    STLModelLoader.loadVertexColor = true;

    /** @description Define methood to get geometry normal vectors */
    STLModelLoader.vertexNormalMode = STLModelLoader.USE_LOADED_NORMAL;
    
    /** @description Define if take Y or Z by Up model axis { Blender default up axis is Z } */
    STLModelLoader.invertZtoYAxis = true;

    /** @description Define if has retained array buffer data on model { Require more memory } */
    STLModelLoader.preserveBufferData = false;
    
    /** @description Define if load sychronize or unsyncronized model resoures from network */
    STLModelLoader.requestAsync = false;

    /** @description Define used USER_NAME of network request's */
    STLModelLoader.requestUser = null;

    /** @description Define used PASSWORD of network request's */
    STLModelLoader.requestPassword = null;

    /**
     * @description
     * This callback has called when resources of model has sussesfully loaded
     * 
     * @param: M3D.Model model
     * @param: Object responseID
     */
    STLModelLoader.onload = null;

    /**
     * @description
     * This callback has called when resources of model has not sussesfully loaded
     * 
     * @param: Object responseID
     * @param: String url
     * 
     */
    STLModelLoader.onerror = null;

    /** @description Default used difuse R G B normaized color { default: white } */
    STLModelLoader.defaultColor = {
        red: 1.0,
        green: 1.0,
        blue: 1.0
    };

    //STL ASCII Parser
    /**
     * @description
     * Load an ASCII STL file from received url and make one renderable
     * STLModel.
     * 
     * Resource request can be execute synchronized or unsynchronized 
     * based on boolean value of requestAsync propertie.
     * 
     * When resources is unaccesible onerror callback is called
     * else is parse model data and sended response model using
     * onload callback function.
     *
     * Any callbacks are called undependently to request async or async
     * resolution mode.
     * 
     * @param {WebGLRenderingContext} gl
     * @param {String} url
     * @param {Number} scale @default 1.0
     * @param {Object} responseID
     * @returns {STLModelLoader.loadASCIISTLFile.response}
     */
    STLModelLoader.loadASCIISTLFile = function (gl, url, scale, responseID) {
        
        let async = this.requestAsync;
        let user = this.requestUser;
        let password = this.requestPassword;

        let self = this;
        let timerID = 'Loading Model on URL ' + url;
        
        let responseCallback = this.onload;
        let errorCallback = this.onerror || this.onload;

        let XHR = new XMLHttpRequest();
        let response;

        XHR.onload = function () {
            
            if (this.status != 200)
                return this.onerror()
            
            let fileInfo = self.parseFileInfo(url);
            
            console.timeEnd(timerID);
            
            // get parse model and asign source file information
            response = self.parseSTLText(gl, this.responseText, scale);
            response.srcFile = fileInfo;
            
            responseCallback && responseCallback(response, responseID);
        
        };

        XHR.onerror = function () {
            console.timeEnd(timerID);
            console.error('ERROR: Loading Data');

            response = null;
            errorCallback && errorCallback(responseID, url);

        };

        //perform request
        XHR.open('GET', url, async, user, password);

        //initialize time counter
        console.time(timerID);

        //send request
        XHR.send(null);

        return response;
    };
    
    /**
     * @description
     * Parse a model data using received from source text String,
     * using all lines on next secuence. For any model face
     * are store it surface normal diretion and poligon
     * points coords. 
     * 
     * solid MODEL_NAME                 <= begin model poligonal faces declaration 
     *      
     *      facet normal NX NY NZ          <= begin a new face and declare his normal vector
     *          outer loop                    <= begin face points declaration
     *              vertex X Y Z                 <= first vertex coords
     *              vertex X Y Z                 <= second vertex coords
     *              vertex X Y Z                 <= theerd vertex coords
     *          endloop                       <= finish face points declaration
     *      facetend                       <= finish face
     *      
     *      ... other facets ...
     *      
     * endsolid [OPTIONAL_MODEL_NAME]   <= finish model declaration
     * 
     * @param {WebGLRenderingContext} gl
     * @param {String} sourceText
     * @param {Number} scale
     * @returns {STLModelLoader.STLModel}
     */
    STLModelLoader.parseSTLText = function (gl, sourceText, scale) {
        scale || (scale = 1);

        let timerID = 'Parsing Time ';
        console.time(timerID);

        let lines = sourceText.split('\n');
        let numLines = lines.length;
        let words = null;

        let workGroup = this.createNewWorkGroup(gl);
        let vertexs = workGroup.faceVertexs;

        let vertex;
        let normal = workGroup.faceNormal;

        //file parser states
        let solidOpened = false;
        let facetOpened = false;
        let outerLoopOpened = false;
        let poligonVertexsNumber = 0;

        let t;
        let nx, ny, nz;
        let vx, vy, vz;
        let bounds = workGroup.bounds;

        //Parse each file lines
        ///////////////////////////////////////////////
        for (let i = 0; i < numLines; i++) {
            words = this.getLineWords(lines[i]);

            switch (words[0]) {
                case 'vertex':
                    if (outerLoopOpened) {
                        vertex = vertexs[poligonVertexsNumber] || (vertexs[poligonVertexsNumber] = new Float32Array(3));

                        //load vertex coordinates
                        vx = parseFloat(words[1], 0) * scale;
                        vy = parseFloat(words[2], 0) * scale;
                        vz = parseFloat(words[3], 0) * scale;

                        if (workGroup.invertZtoYAxis) {
                            t = vy;
                            vy = vz;
                            vz = -t;
                        }

                        vertex[0] = vx;
                        vertex[1] = vy;
                        vertex[2] = vz;

                        bounds.update(vx, vy, vz);

                        poligonVertexsNumber++;
                    } else {
                        console.error('line: ' + i + ' Cant add vertex if not openend outer loop');
                    }
                    break;
                    ///////////////////////////////////////////////

                case 'outer':
                    if (words[1] === 'loop' && facetOpened) {
                        outerLoopOpened = true;
                        poligonVertexsNumber = 0;
                    } else {
                        console.error('line: ' + i + ' Cant add outer loop if not openend facet');
                    }
                    break;
                    ///////////////////////////////////////////////

                case 'endloop':
                    if (outerLoopOpened) {
                        outerLoopOpened = false;

                        if (workGroup.useComputedNormal || nx + ny + nz === 0) {
                            this.computeFaceNormal(vertexs[0], vertexs[1], vertexs[2], normal);

                            nx = normal[0];
                            ny = normal[1];
                            nz = normal[2];
                        }

                        if (workGroup.invertZtoYAxis) {
                            t = ny;
                            ny = nz;
                            nz = -t;
                        }

                        normal[0] = nx;
                        normal[1] = ny;
                        normal[2] = nz;

                        //store first or unique triangle
                        this.storeFaceTriangle(workGroup, normal, vertexs[0], vertexs[1], vertexs[2]);

                        //cast poligon of N side's in triangles
                        ////////////////////////////////////////
                        if (poligonVertexsNumber > 3) {
                            poligonVertexsNumber -= 2;

                            for (let i = 2; i < poligonVertexsNumber; i++) {
                                this.storeFaceTriangle(workGroup, normal, vertexs[0], vertexs[i], vertexs[i + 1]);
                            }
                        }
                        ////////////////////////////////////////

                    } else {
                        console.error('line: ' + i + ' Cant close outer loop if  before is not openend one');
                    }
                    break;
                    ///////////////////////////////////////////////

                case 'facet':
                    if (solidOpened) {
                        facetOpened = true;

                        //load face normal
                        if (words[1] === 'normal') {
                            nx = this.parseFloat(words[2], 0);
                            ny = this.parseFloat(words[3], 0);
                            nz = this.parseFloat(words[4], 0);
                        } else {
                            nx = 0;
                            ny = 0;
                            nz = 0;
                        }

                    } else {
                        console.error('line: ' + i + ' Cant add facet loop if not openend solid');
                    }
                    break;
                    ///////////////////////////////////////////////

                case 'endfacet':
                    if (facetOpened) {
                        facetOpened = false;
                    } else {
                        console.error('line: ' + i + ' Cant close facet if  before is not openend one');
                    }

                    break;
                    ///////////////////////////////////////////////

                case 'solid':
                    solidOpened = true;
                    workGroup.name = this.joinLineWords(words, 1);
                    break;
                    ///////////////////////////////////////////////

                case 'endsolid':
                    if (solidOpened) {
                        solidOpened = false;
                    } else {
                        console.error('line: ' + i + ' Cant close solid if  before is not openend one');
                    }
                    break;
                    ///////////////////////////////////////////////
            }
        }
        ///////////////////////////////////////////////

        //create STL model
        ///////////////////////////////////////////////
        this.storeVertexBuffer(workGroup);
        this.buildSTLModel(workGroup);
        this.showStats(workGroup);

        console.timeEnd(timerID);
        ///////////////////////////////////////////////

        return workGroup.model;
    };

    //STL Binary Parser
    /**
     * @description
     * Load an Bynary STL file from received url and make one renderable
     * STLModel using received byte stream.
     * 
     * Resource request can be execute synchronized or unsynchronized 
     * based on boolean value of requestAsync propertie.
     * 
     * When resources is unaccesible onerror callback is called
     * else is parse model data and sended response model using
     * onload callback function.
     *
     * Any callbacks are called undependently to request async or async
     * resolution mode.
     * 
     * For olds browser retrocompatibility are implemented one 
     * auxiliar steep to format the received text of file to 
     * one required data byte stream.
     * 
     * @param {WebGLRenderingContext} gl
     * @param {String} url
     * @param {Number} scale @default 1.0
     * @param {Object} responseID
     * @returns {STLModelLoader.loadASCIISTLFile.response}
     */
    STLModelLoader.loadBinarySTLFile = function (gl, url, scale, responseID) {

        let async = this.requestAsync;
        let user = this.requestUser;
        let password = this.requestPassword;

        let self = this;
        let timerID = 'Loading Model on URL ' + url;

        let responseCallback = this.onload;
        let errorCallback = this.onerror || this.onload;
        
        let XHR = new XMLHttpRequest();
        let response;

        XHR.onload = function () {
            
            // check XHR status
            if (this.status != 200)
                return this.onerror()
            
            let arrayBuffer;
            let fileInfo = self.parseFileInfo(url);
            
            console.timeEnd(timerID);
            
            if (async) {
                //get response binary data array
                arrayBuffer = this.response;
            
            } else {
                
                //get response text data and transform on bynary array buffer
                arrayBuffer = self.parseTextToStreamArray(this.responseText);
            }
            
            // get parse model and asign source file information
            response = self.parseSTLBytes(gl, arrayBuffer, scale);
            response.srcFile = fileInfo;
            
            responseCallback && responseCallback(response, responseID);

        };

        XHR.onerror = function () {
            console.timeEnd(timerID);
            console.error('ERROR: Loading Model Data');
            
            response = null;
            errorCallback && errorCallback(responseID, url);
            
        };

        //perform request
        XHR.open('GET', url, async, user, password);
        
        if (async)
            //define response as bynary
            XHR.responseType = 'arraybuffer';
        else
            //overryde response MIME-TYPE to ASCII Text
            XHR.overrideMimeType('text\/plain; charset=x-user-defined');
        
        //initialize time counter
        console.time(timerID);
        
        //send request
        XHR.send(null);
        
        return response;
    };
    
    /**/
    STLModelLoader.parseSTLBytes = function (gl, sourceBuffer, scale) {
        scale || (scale = 1);

        let timerID = 'Parsing Time ';
        console.time(timerID);

        let workGroup = this.createNewWorkGroup(gl, scale);
        let numTriangles = 0;

        let targetGLBuffer;
        let vertexGLBuffer;
        let vertexGLBufferAttribs = {};

        let sourceBufferDataView = new DataView(sourceBuffer);
        let sourceBufferDataViewLength = sourceBufferDataView.byteLength;
        let sourceBufferDataViewOffset = 0;
        let sourceBufferDataViewStride = 50;

        let vertexBufferArray;
        let vertexBufferDataView;
        let vertexBufferDataViewOffset = 0;
        let vertexBufferDataViewStride = 48;

        let endianess = true;

        let vertex1 = workGroup.faceVertexs[0];
        let vertex2 = workGroup.faceVertexs[1];
        let vertex3 = workGroup.faceVertexs[2];
        let faceNormal = workGroup.faceNormal;

        let t;
        let vx, vy, vz;
        let nx, ny, nz;
        let bounds = workGroup.bounds;

        //validate file size (STL bynary head length is 80 bytes)
        if (sourceBufferDataViewLength > 80) {

            //get number of triangles in bytes 80 - 84.
            numTriangles = sourceBufferDataView.getUint32(80, endianess);
            workGroup.numFacetTriangles = numTriangles;

            //create output buffer
            vertexBufferArray = new ArrayBuffer(numTriangles * vertexBufferDataViewStride);
            vertexBufferDataView = new DataView(vertexBufferArray);

            //load each triangles
            /////////////////////////////////////////////
            /* @NOTE:  When load binary data from STL file use next order.
             * 
             *  Uint8[80] <--- FILE HEAD :: REQUIRED & DEPRECATED
             *  Uint32    triangles number
             *  
             *  //facets me be start on byte 84
             *  
             *  for each triangle (Face) //for each facet begin on next byte
             *      Float32[3] ( 0 - 12) facet normal
             *      Float32[3] (12 - 24) vertex 1
             *      Float32[3] (24 - 36) vertex 2
             *      Float32[3] (36 - 48) vertex 3
             *      Uint16     (48 - 50) facet attribute
             *  end                      //finalize on next 50 bytes
             *  
             * */

            sourceBufferDataViewOffset = 84;
            for (let i = 0; i < numTriangles; i++) {

                //load file data from buffer
                //////////////////////////////////////////
                nx = sourceBufferDataView.getFloat32(sourceBufferDataViewOffset + 0, endianess);
                ny = sourceBufferDataView.getFloat32(sourceBufferDataViewOffset + 4, endianess);
                nz = sourceBufferDataView.getFloat32(sourceBufferDataViewOffset + 8, endianess);

                vertex1[0] = sourceBufferDataView.getFloat32(sourceBufferDataViewOffset + 12, endianess) * scale;
                vertex1[1] = sourceBufferDataView.getFloat32(sourceBufferDataViewOffset + 16, endianess) * scale;
                vertex1[2] = sourceBufferDataView.getFloat32(sourceBufferDataViewOffset + 20, endianess) * scale;

                vertex2[0] = sourceBufferDataView.getFloat32(sourceBufferDataViewOffset + 24, endianess) * scale;
                vertex2[1] = sourceBufferDataView.getFloat32(sourceBufferDataViewOffset + 28, endianess) * scale;
                vertex2[2] = sourceBufferDataView.getFloat32(sourceBufferDataViewOffset + 32, endianess) * scale;

                vertex3[0] = sourceBufferDataView.getFloat32(sourceBufferDataViewOffset + 36, endianess) * scale;
                vertex3[1] = sourceBufferDataView.getFloat32(sourceBufferDataViewOffset + 40, endianess) * scale;
                vertex3[2] = sourceBufferDataView.getFloat32(sourceBufferDataViewOffset + 44, endianess) * scale;

                //jump facet attribute Uint16 (2 bytes attribute - color)in (offset + 48 --> 50)

                sourceBufferDataViewOffset += sourceBufferDataViewStride;     //update input buffer pointer

                //////////////////////////////////////////

                //compute face normal if not is received
                //////////////////////////////////////////
                if (workGroup.useComputedNormal || nx + ny + nz === 0) {
                    this.computeFaceNormal(vertex1, vertex2, vertex3, faceNormal);

                    nx = faceNormal[0];
                    ny = faceNormal[1];
                    nz = faceNormal[2];
                }

                //invert axis coordiantes
                if (workGroup.invertZtoYAxis) {
                    t = ny;
                    ny = nz;
                    nz = -t;
                }

                nx *= 0x7F;
                ny *= 0x7F;
                nz *= 0x7F;
                //////////////////////////////////////////

                //Store vertexs data on buffer
                //////////////////////////////////////////

                //store first vertex on buffer
                vx = vertex1[0];
                vy = vertex1[1];
                vz = vertex1[2];

                if (workGroup.invertZtoYAxis) {
                    t = vy;
                    vy = vz;
                    vz = -t;
                }

                bounds.update(vx, vy, vz);

                vertexBufferDataView.setFloat32(vertexBufferDataViewOffset + 0, vx, endianess);
                vertexBufferDataView.setFloat32(vertexBufferDataViewOffset + 4, vy, endianess);
                vertexBufferDataView.setFloat32(vertexBufferDataViewOffset + 8, vz, endianess);

                vertexBufferDataView.setInt8(vertexBufferDataViewOffset + 12, nx);
                vertexBufferDataView.setInt8(vertexBufferDataViewOffset + 13, ny);
                vertexBufferDataView.setInt8(vertexBufferDataViewOffset + 14, nz);
                vertexBufferDataView.setInt8(vertexBufferDataViewOffset + 15, 0);

                //store second vertex on buffer

                vx = vertex2[0];
                vy = vertex2[1];
                vz = vertex2[2];

                if (workGroup.invertZtoYAxis) {
                    t = vy;
                    vy = vz;
                    vz = -t;
                }

                bounds.update(vx, vy, vz);

                vertexBufferDataView.setFloat32(vertexBufferDataViewOffset + 16, vx, endianess);
                vertexBufferDataView.setFloat32(vertexBufferDataViewOffset + 20, vy, endianess);
                vertexBufferDataView.setFloat32(vertexBufferDataViewOffset + 24, vz, endianess);

                vertexBufferDataView.setInt8(vertexBufferDataViewOffset + 28, nx);
                vertexBufferDataView.setInt8(vertexBufferDataViewOffset + 29, ny);
                vertexBufferDataView.setInt8(vertexBufferDataViewOffset + 30, nz);
                vertexBufferDataView.setInt8(vertexBufferDataViewOffset + 31, 0);

                //store threerd vertex on buffer
                vx = vertex3[0];
                vy = vertex3[1];
                vz = vertex3[2];

                if (workGroup.invertZtoYAxis) {
                    t = vy;
                    vy = vz;
                    vz = -t;
                }

                bounds.update(vx, vy, vz);

                vertexBufferDataView.setFloat32(vertexBufferDataViewOffset + 32, vx, endianess);
                vertexBufferDataView.setFloat32(vertexBufferDataViewOffset + 36, vy, endianess);
                vertexBufferDataView.setFloat32(vertexBufferDataViewOffset + 40, vz, endianess);

                vertexBufferDataView.setInt8(vertexBufferDataViewOffset + 44, nx);
                vertexBufferDataView.setInt8(vertexBufferDataViewOffset + 45, ny);
                vertexBufferDataView.setInt8(vertexBufferDataViewOffset + 46, nz);
                vertexBufferDataView.setInt8(vertexBufferDataViewOffset + 47, 0);

                vertexBufferDataViewOffset += vertexBufferDataViewStride;   //update output buffer pointer

                //////////////////////////////////////////
            }   //end for store facet

            //create GL_BUFFER to store vertex data
            vertexGLBuffer = gl.createBuffer();
            targetGLBuffer = gl.ARRAY_BUFFER;

            //store vertex data on GL_BUFFER
            gl.bindBuffer(targetGLBuffer, vertexGLBuffer);
            gl.bufferData(targetGLBuffer, vertexBufferArray, gl.STATIC_DRAW);
            gl.bindBuffer(targetGLBuffer, null);

            //define vertex buffer attribs
            vertexGLBufferAttribs.coords = {offset: 0, size: 3, type: gl.FLOAT, normalized: false};
            vertexGLBufferAttribs.normals = {offset: 12, size: 4, type: gl.BYTE, normalized: true};

            //define buffer properties
            vertexGLBuffer.byteLength = numTriangles * vertexBufferDataViewStride;
            vertexGLBuffer.vertexStride = vertexBufferDataViewStride / 3;
            vertexGLBuffer.vertexsNumber = numTriangles * 3;
            vertexGLBuffer.vertexAttribs = vertexGLBufferAttribs;
            vertexGLBuffer.bufferData = workGroup.preserveBufferData ? vertexBufferArray : null;

            //store buffer
            workGroup.vertexBuffer = vertexGLBuffer;

            this.buildSTLModel(workGroup);
            this.showStats(workGroup);
            /////////////////////////////////////////////

        } else {
            console.error('Source file invalid because size is minor that 80 bytes');
        }

        console.timeEnd(timerID);

        return workGroup.model;
    };

    //resources functions
    /**
     * @description
     * Return any words of received String separateds by space
     * discardting tabs \t or carry jumps \r
     * 
     * @param {String} srcLine
     * @returns {Array}
     */
    STLModelLoader.getLineWords = function (srcLine) {
        let length = srcLine.length;
        let words = new Array();

        let character = '';
        let word = '';

        //parse each character of source string
        for (let i = 0; i < length; i++) {
            switch (character = srcLine[i]) {
                case ' ':

                    //add later not empty word
                    if (word.length > 0) {
                        words[words.length] = word;
                        word = '';
                    }

                    break;
                case '\t':
                    break;
                case '\r':
                    break;
                default:
                    word += character;
            }
        }   //end for

        //add final not empty word
        if (word.length > 0) {
            words[words.length] = word;
        }

        return words;
    };

    /**
     * @description 
     * Join any words of passed String Array begin and ending on received indexs
     * 
     * @param {Array} words
     * @param {Number} beginIndex @default 0
     * @param {Number} endIndex @default words.length - 1
     * @returns {String}
     */
    STLModelLoader.joinLineWords = function (words, beginIndex, endIndex) {
        beginIndex !== undefined || (beginIndex = 0);
        endIndex !== undefined || (endIndex = words.length);

        let joinedLine = '';
        let lastWordIndex = endIndex - 1;

        //join any words starting be word on begin index
        for (let i = beginIndex; i < endIndex; i++) {
            joinedLine += (i < lastWordIndex) ? words[i] + ' ' : words[i];
        }

        return joinedLine;
    };
    
    /**
     * @description
     * Compute poligonal face normal vector based on cross normalized product
     * of received [ X, Y, Z ] points coords on Array's p1, p2 and p3.
     * 
     * vec3 normal = - normalized( cross( p1 - p2 , p3 - p2 ));
     * 
     * @param {Array [3]} p1
     * @param {Array [3]} p2
     * @param {Array [3]} p3
     * @param {Array [3]} outputVector
     * @returns {Array [3] | params.outputVector}
     */
    STLModelLoader.computeFaceNormal = function (p1, p2, p3, outputVector) {
        let length;

        //compute three face points diferenece
        let v0x = p1[0] - p2[0];
        let v0y = p1[1] - p2[1];
        let v0z = p1[2] - p2[2];

        let v1x = p3[0] - p2[0];
        let v1y = p3[1] - p2[1];
        let v1z = p3[2] - p2[2];

        //compute vectors values cross product
        let nx = v0y * v1z - v0z * v1y;
        let ny = v0z * v1x - v0x * v1z;
        let nz = v0x * v1y - v0y * v1x;

        //compute length of vector to normalize it
        length = Math.sqrt(nx * nx + ny * ny + nz * nz);

        //normalize vector values if is posible
        if (length !== 0) {
            nx /= length;
            ny /= length;
            nz /= length;
        }

        //invert a vector values and store
        outputVector[0] = -1 * nx;
        outputVector[1] = -1 * ny;
        outputVector[2] = -1 * nz;

        return outputVector;
    };
    
    /**
     * @description
     * Get path, file name and another information from received
     * URL String.
     * 
     * @example http://mi.site.com/models/model1/model1.obj
     *  {
     *      url = http://mi.site.com/models/model1/model1.obj
     *      root = http://mi.site.com/models/model1/
     *      name = model1
     *      async = true    //by default lather is reconfigured
     *      user = null     //by default lather is reconfigured
     *      password = null //by default lather is reconfigured
     *  }
     *  
     * @param {String} url
     * @returns {Object}
     */
    STLModelLoader.parseFileInfo = function (url) {
        
        /*  Get path components separateds by '/' backSlash
         *  Exp: models/model_1/model_1.obj 
         *  --> [models, model_1, model_1.obj]
         */
        let words = url.split('/');
        let fileInfo;
        let root;
        let name;
        let extension;
        
        // get file path excluding fileName and join be backslash another words
        root = words.slice(0, words.length - 1).join('/');
        
        // get file words including NAME.EXTENSION
        words = words[words.length - 1].split('.');
        
        // get fileName joining any words before last
        name = words.slice(0, words.length - 1).join('');
        
        // get last word with file extension
        extension = words[words.length - 1];
        
        //store file info
        fileInfo = {
            url: url,
            root: root,
            name: name,
            extension: extension,
            async: true,
            user: null,
            password: null
        };
        
        return fileInfo;
    };

    /**
     * @description
     * Return float value of received String or use default 
     * 
     * @param {String} value
     * @param {Number} defaultValue
     * @returns {Number}
     */
    STLModelLoader.parseFloat = function (value, defaultValue) {
        let number;
        return value !== undefined && !isNaN(number = parseFloat(value)) ? number : defaultValue;
    };
    
    /**
     * @description
     * Format received byte length on understandeable scale
     * using powers of 1024 and B, KB or MB nomenclatures.
     * 
     * @param {Nuber} byteLength
     * @returns {String}
     */
    STLModelLoader.parseByteScale = function (byteLength) {
        let integer;
        let decimal;
        let byteScale;

        byteLength || (byteLength = 0);

        //select scale to reduce byteLength in range 0 -> 999
        if (byteLength >= 1048576) {
            byteLength = byteLength / 1048576;
            byteScale = ' MB';

        } else if (byteLength > 1024) {
            byteLength = byteLength / 1024;
            byteScale = ' KB';

        } else {
            byteScale = ' B';
        }

        //get integer and decimal number pats
        integer = parseInt(byteLength);
        decimal = parseFloat(((byteLength - integer) + '').slice(0, 4));

        return integer + decimal + byteScale;
    };
    
    /**
     * Utility function used to: Cast the received standar String
     * to an data byte stream and store on one ArrayBuffer of.
     * 
     * String to ByteNumber procediment using one
     * FULL FILLED FACTOR FOR BASE 64 TO 8 BITE REDUCTION.
     *      
     *      byte = char & 0xFF
     *      
     *      Only last 8 bites of this 64s are enable.
     *      
     *      0000 0000 0000 0000 0000 0000 0000 0000
     *      0000 0000 0000 0000 0000 0000 1111 1111
     *      
     *      String           => A B C D
     *      Character        => A           
     *      
     *      (ASCII: 'A' = 48d = 0x30h) but is on standarized
     *      to base 64 String and require cast to binary
     *      number.
     *      
     *      0000 0000 0000 0000 0000 0000 0000 0000
     *      0000 0000 0000 0000 0000 0000 0011 0000
     *      
     *      For that is need execute one logic operation AND.
     *      to get number bites.
     *      
     *      CharecterByte    => A & 0xFF
     *                          
     *      
     * @param {String} sourceText
     * @returns {ArrayBuffer}
     */
    STLModelLoader.parseTextToStreamArray = function (sourceText) {
        let length = sourceText.length;
        
        let arrayBuffer = new ArrayBuffer(length);
        let arrayBufferView = new DataView(arrayBuffer);

        //get any bytes
        for (let i = 0, l = length; i < l; i++) {
            arrayBufferView.setUint8(i, sourceText.charCodeAt(i) & 0xff);
        }

        return arrayBuffer;
    };

    /**
     * @description
     * Make a new work group to store parsed model data and resources
     * 
     * @param {WebGLRenderingContext} gl
     * @param {Number} scale
     * @returns { Object }
     */
    STLModelLoader.createNewWorkGroup = function (gl, scale) {
        let workGroup = {};
        let faceVertexs;

        //define worked values
        workGroup.gl = gl;
        workGroup.scale = scale;
        workGroup.model = null;
        workGroup.bounds = new BoundBox();
        workGroup.name = 'STLModel_' + (STLGeneratedModelID - 62672000);

        //define output configurations
        workGroup.preserveBufferData = this.preserveBufferData;
        workGroup.invertZtoYAxis = this.invertZtoYAxis;

        //perform data load mode
        workGroup.useComputedNormal = this.vertexNormalMode === this.USE_COMPUTED_NORMAL;

        //create vertex buffer array
        workGroup.vertexBuffer = new Array(0);
        workGroup.numFacetTriangles = 0;

        //create work objects cache
        workGroup.faceNormal = new Float32Array(3);
        workGroup.faceVertexNumber = 0;

        //create vertex storage from performance
        faceVertexs = new Array(3);
        faceVertexs[0] = new Float32Array(3);
        faceVertexs[1] = new Float32Array(3);
        faceVertexs[2] = new Float32Array(3);
        workGroup.faceVertexs = faceVertexs;

        return workGroup;
    };
    
    /**
     * @description
     * Store a triangle face data received on array
     * buffer using a next distribution ordin containing
     * points coords and face normal:
     * 
     * FOR EACH FACE:
     *      FACE_NORMAL      [nx, ny, nz]
     *      POINT_1_COORDS   [x, y, z]
     *      POINT_2_COORDS   [x, y, z]
     *      POINT_3_COORDS   [x, y, z]
     *     
     * Triangle number are increase after to add face
     * data.
     *     
     * @param {Object} workGroup
     * @param {Float32Array[3]} faceNormal
     * @param {Float32Array[3]} vertex1
     * @param {Float32Array[3]} vertex2
     * @param {Float32Array[3]} vertex3
     * @returns {undefined}
     */
    STLModelLoader.storeFaceTriangle = function (workGroup, faceNormal, vertex1, vertex2, vertex3) {

        let buffer = workGroup.vertexBuffer;
        let length = buffer.length;

        //store vertex normal
        buffer[length] = faceNormal[0];
        buffer[length + 1] = faceNormal[1];
        buffer[length + 2] = faceNormal[2];

        //store vertex coord's
        buffer[length + 3] = vertex1[0];
        buffer[length + 4] = vertex1[1];
        buffer[length + 5] = vertex1[2];

        buffer[length + 6] = vertex2[0];
        buffer[length + 7] = vertex2[1];
        buffer[length + 8] = vertex2[2];

        buffer[length + 9] = vertex3[0];
        buffer[length + 10] = vertex3[1];
        buffer[length + 11] = vertex3[2];

        //update number of faces
        workGroup.numFacetTriangles++;

    };

    /**
     * @description
     * Store vertexDataArray information on one
     * output WebGLBuffer of type ARRAY_BUFFER
     * to use on model renderization. Vertex data 
     * are stored on buffer using next insertion
     * ordin:
     *                  
     * Vertex array  per face stride on {e Number of elements} are computed:
     *      face_normals 3e + vertex_1_coords 3e + vertex_2_coords 3e + vertex_3_coords 3e = 12e
     *      
     * Vertex buffer per vertex stride on {b Number of bytes} are computed:
     *      (coords 12b +  normals 4b) = 16b
     * Per face stride (pt Number of poligon points)
     *      16b * 3pt = 48b
     * 
     * FOR_EACH: FACE TRIANGLE
     *      //vertex 1
     *      required float32[3]  (12 bytes) vertex_coordinates    { coordX, coordY, coordZ }
     *      optional byte[4]     (4 bytes)  vertex_normal         { normalX, normalY, normalZ, 0 }
     *      
     *      //vertex 2
     *      required float32[3]  (12 bytes) vertex_coordinates    { coordX, coordY, coordZ }
     *      optional byte[4]     (4 bytes)  vertex_normal         { normalX, normalY, normalZ, 0 }
     *      
     *      vertex 3
     *      required float32[3]  (12 bytes) vertex_coordinates    { coordX, coordY, coordZ }
     *      optional byte[4]     (4 bytes)  vertex_normal         { normalX, normalY, normalZ, 0 }
     * LOOP.
     * 
     * When send numbers on format integer of 8 or 16 bites
     * received on float a signed int value ranges betwen 
     * (- 2^7 to 2^7) and (- 2^15 to 2^15). From that you need
     * multiply float value by max absolute integer and later
     * normalize it.
     * 
     * @param {Object} workGroup
     * @returns {undefined}
     */
    STLModelLoader.storeVertexBuffer = function (workGroup) {

        let gl = workGroup.gl;
        let numTriangles = workGroup.numFacetTriangles;
        let numVertexs = numTriangles * 3;

        let targetGLBuffer;
        let vertexGLBuffer;
        let vertexGLBufferAttribs = {};

        let vertexBufferArray = workGroup.vertexBuffer;
        let vertexBufferArrayOffset = 0;
        let vertexBufferArrayStride = 12;

        let vertexBufferArrayBuffer = null;
        let vertexBufferDataView = null;
        let vertexBufferDataViewOffset = 0;
        let vertexBufferDataViewStride = 48;

        let nx, ny, nz;

        //create output buffer
        vertexBufferArrayBuffer = new ArrayBuffer(numTriangles * vertexBufferDataViewStride);
        vertexBufferDataView = new DataView(vertexBufferArrayBuffer);

        //store data on buffer
        ///////////////////////////////////////
        for (let i = 0; i < numTriangles; i++) {

            //get face normal
            nx = vertexBufferArray[vertexBufferArrayOffset + 0] * 0x7F;
            ny = vertexBufferArray[vertexBufferArrayOffset + 1] * 0x7F;
            nz = vertexBufferArray[vertexBufferArrayOffset + 2] * 0x7F;

            //store first vertex on buffer
            vertexBufferDataView.setFloat32(vertexBufferDataViewOffset + 0, vertexBufferArray[vertexBufferArrayOffset + 3], true);
            vertexBufferDataView.setFloat32(vertexBufferDataViewOffset + 4, vertexBufferArray[vertexBufferArrayOffset + 4], true);
            vertexBufferDataView.setFloat32(vertexBufferDataViewOffset + 8, vertexBufferArray[vertexBufferArrayOffset + 5], true);

            vertexBufferDataView.setInt8(vertexBufferDataViewOffset + 12, nx);
            vertexBufferDataView.setInt8(vertexBufferDataViewOffset + 13, ny);
            vertexBufferDataView.setInt8(vertexBufferDataViewOffset + 14, nz);
            vertexBufferDataView.setInt8(vertexBufferDataViewOffset + 15, 0);
            /////////////////////////////////////////////

            //store second vertex on buffer
            vertexBufferDataView.setFloat32(vertexBufferDataViewOffset + 16, vertexBufferArray[vertexBufferArrayOffset + 6], true);
            vertexBufferDataView.setFloat32(vertexBufferDataViewOffset + 20, vertexBufferArray[vertexBufferArrayOffset + 7], true);
            vertexBufferDataView.setFloat32(vertexBufferDataViewOffset + 24, vertexBufferArray[vertexBufferArrayOffset + 8], true);

            vertexBufferDataView.setInt8(vertexBufferDataViewOffset + 28, nx);
            vertexBufferDataView.setInt8(vertexBufferDataViewOffset + 29, ny);
            vertexBufferDataView.setInt8(vertexBufferDataViewOffset + 30, nz);
            vertexBufferDataView.setInt8(vertexBufferDataViewOffset + 31, 0);
            /////////////////////////////////////////////

            //store theer'd vertex on buffer
            vertexBufferDataView.setFloat32(vertexBufferDataViewOffset + 32, vertexBufferArray[vertexBufferArrayOffset + 9], true);
            vertexBufferDataView.setFloat32(vertexBufferDataViewOffset + 36, vertexBufferArray[vertexBufferArrayOffset + 10], true);
            vertexBufferDataView.setFloat32(vertexBufferDataViewOffset + 40, vertexBufferArray[vertexBufferArrayOffset + 11], true);

            vertexBufferDataView.setInt8(vertexBufferDataViewOffset + 44, nx);
            vertexBufferDataView.setInt8(vertexBufferDataViewOffset + 45, ny);
            vertexBufferDataView.setInt8(vertexBufferDataViewOffset + 46, nz);
            vertexBufferDataView.setInt8(vertexBufferDataViewOffset + 47, 0);
            /////////////////////////////////////////////

            //update buffer's pointer's
            vertexBufferArrayOffset += vertexBufferArrayStride;
            vertexBufferDataViewOffset += vertexBufferDataViewStride;
        }
        ///////////////////////////////////////

        //create GL_BUFFER to store geometry vertex data
        vertexGLBuffer = gl.createBuffer();
        targetGLBuffer = gl.ARRAY_BUFFER;

        //store vertex data on GL_BUFFER
        gl.bindBuffer(targetGLBuffer, vertexGLBuffer);
        gl.bufferData(targetGLBuffer, vertexBufferArrayBuffer, gl.STATIC_DRAW);
        gl.bindBuffer(targetGLBuffer, null);

        //define vertex buffer attribs
        vertexGLBufferAttribs.coords = {offset: 0, size: 3, type: gl.FLOAT, normalized: false};
        vertexGLBufferAttribs.normals = {offset: 12, size: 4, type: gl.BYTE, normalized: true};

        //define buffer properties
        vertexGLBuffer.byteLength = numTriangles * vertexBufferDataViewStride;
        vertexGLBuffer.vertexsNumber = numVertexs;
        vertexGLBuffer.vertexStride = vertexBufferDataViewStride / 3;
        vertexGLBuffer.vertexAttribs = vertexGLBufferAttribs;
        vertexGLBuffer.bufferData = workGroup.preserveBufferData ? vertexBufferArrayBuffer : null;

        workGroup.vertexBuffer = vertexGLBuffer;
    };
    
    /**
     * @description
     * Make one renderable STLModel using data of workGroup.
     * process steeps are executed on next ordin:
     * 
     * 1 - Store buffers data.
     * 2 - Define mododel properties.
     * 
     * @property {String} name              Model geometry name
     * @property {Number} drawMode          Used WebGL draw method to render geometries 
     * @property {WebGLBuffer} vertexBuffer Output buffer with geometry vertex data
     * 
     * @property {Array} materials          Array with model materials information requireds to renderize
     * @property {BoundBox} bounds          Model axis bounds
     * @property {WebGLProgram} shader      Shader program required to renderize model
     * 
     * @param {Object} workGroup
     * @returns {STLModelLoader.STLModel}
     */
    STLModelLoader.buildSTLModel = function (workGroup) {
        let model = new STLModelLoader.STLModel();
        
        // store model values
        model.name = workGroup.name;
        model.drawMode = workGroup.gl.TRIANGLES;
        
        // store model buffers with renderable data
        model.vertexBuffer = workGroup.vertexBuffer;
        
        // store model resources
        model.materials = [new STLModelLoader.Material('default', this.defaultColor)];
        model.bounds = workGroup.bounds;
        model.shader = this.getSTLRenderShader(workGroup.gl);
        
        // compute model geometry center coordinates
        workGroup.bounds.computeCenter();

        workGroup.model = model;
        return model;
    };

    STLModelLoader.showStats = function (workGroup) {

        let numVertexs = workGroup.vertexBuffer.vertexsNumber;
        let stats = 'STL Model Loaded Stats: \n\t{\n';

        stats += '\t\t name: ' + workGroup.name + '\n';
        stats += '\t\t vertexs: ' + numVertexs + '\n';
        stats += '\t\t triangles: ' + workGroup.numFacetTriangles + '\n';
        stats += '\t\t vertexs_buffer_size: ' + this.parseByteScale(numVertexs * 16) + '\n';
        stats += '\t\t materials: 1\n';
        stats += '\t}';

        console.log(stats);
    };
    
    /**
     * @description
     * Make and return one usable WebGLProgram to
     * renderize a STLModel. This shader has generic
     * and can be sutituit be another to optimize draw
     * calls. For more information read IMPORTANT info.
     * 
     * @important
     * The next shader is maked fron general prupouse
     * and provide standart requirements to renderize an OBJ
     * models using my data format to work in WebGL.
     * 
     * The model of shadowing applied to model is 
     * [per pixel Pong shadowing methood].
     * 
     * You can make customized shaders to get more speed
     * on especifieds works or scenes. You need use defined
     * comunication shader structures to work with other
     * implemented components class's Camera & Ligths.
     * 
     * Be default when first model is parsed, if has not
     * generated RENDER_SHADER is maked this shader and 
     * to asign to it. For more optimization call this
     * static methood when init your project or before
     * first model parse call.
     * 
     * @param {WebGLRenderingContext} gl
     * @returns {WebGLProgram}
     */
    STLModelLoader.getSTLRenderShader = function (gl) {

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

        //create render shader
        if (!STLModelLoader.RENDER_SHADER) {

            vertexShaderSource = "" +
                    "\n" +
                    "struct Camera {    \n" +
                    "   highp mat4 mview;    \n" +
                    "   highp mat4 mproject;    \n" +
                    "   mediump vec3 coords;   \n" +
                    "}; \n" +
                    "\n" +
                    "attribute vec3 vertexCoords;   \n" +
                    "attribute vec4 vertexNormal;   \n" +
                    "\n" +
                    "varying vec3 fcoords;  \n" +
                    "varying vec3 fnormal;  \n" +
                    "\n" +
                    "uniform mat4 mtransform;   \n" +
                    "uniform Camera camera; \n" +
                    "\n" +
                    "vec4 transformed;  \n" +
                    "\n" +
                    "void main(){   \n" +
                    "\n" +
                    "    //compute vertex position  \n" +
                    "    transformed = mtransform * vec4(vertexCoords, 1.0);    \n" +
                    "    gl_Position = camera.mproject * camera.mview * transformed;  \n" +
                    "\n" +
                    "    //compute transformed vertex normal direction  \n" +
                    "    fcoords = transformed.xyz; \n" +
                    "    fnormal = normalize((mtransform * vec4(vertexNormal.xyz, 0.0)).xyz);   \n" +
                    "\n" +
                    "}";

            fragmentShaderSource = "" +
                    "precision lowp float;\n" +
                    "const int NUM_LIGTHS = 8;\n" +
                    "\n" +
                    "struct Camera {  \n" +
                    "    highp mat4 mview;  \n" +
                    "    highp mat4 mproject;  \n" +
                    "    mediump vec3 coords;  \n" +
                    "};  \n" +
                    "\n" +
                    "struct Material {   \n" +
                    "   vec4 difuseColor;    \n" +
                    "   float specularity;   \n" +
                    "}; \n" +
                    "\n" +
                    "struct Ligth {  \n" +
                    "    bool enable;  \n" +
                    "    bool directional;  \n" +
                    "    bool ambient;  \n" +
                    "    bool spot;  \n" +
                    "    vec3 coords;  \n" +
                    "    vec3 color;  \n" +
                    "    vec3 direction;  \n" +
                    "    float maxDot;  \n" +
                    "};  \n" +
                    "\n" +
                    "varying vec3 fcoords;  \n" +
                    "varying vec3 fnormal;  \n" +
                    "\n" +
                    "uniform Material material;  \n" +
                    "uniform Camera camera;  \n" +
                    "uniform Ligth ligths[8];  \n" +
                    "\n" +
                    "Ligth ligth;  \n" +
                    "\n" +
                    "vec3 ligth2surface;  \n" +
                    "vec3 view2surface;  \n" +
                    "vec3 view2ligth;  \n" +
                    "\n" +
                    "float difuseValue;  \n" +
                    "float specularValue;  \n" +
                    "\n" +
                    "vec3 difuseColor;  \n" +
                    "vec3 specularColor;  \n" +
                    "vec3 ambientColor;  \n" +
                    "\n" +
                    "void main() {  \n" +
                    "\n" +
                    "    //compute any applieds ligths values  \n" +
                    "    view2surface = camera.coords - fcoords;  \n" +
                    "\n" +
                    "    for(int i = 0; i < NUM_LIGTHS; i++){  \n" +
                    "        ligth = ligths[i];  \n" +
                    "\n" +
                    "        //jump disable ligth's  \n" +
                    "        if(!ligth.enable)  \n" +
                    "            continue;  \n" +
                    "\n" +
                    "        //dont compute more for ambinet ligths  \n" +
                    "        if(ligth.ambient){  \n" +
                    "            ambientColor += ligth.color;  \n" +
                    "            continue;   \n" +
                    "        }  \n" +
                    "\n" +
                    "        //compute vectors  \n" +
                    "        ligth2surface = ligth.directional ? normalize(ligth.direction) : normalize(ligth.coords - fcoords);  \n" +
                    "\n" +
                    "        //don't apply ligth if not is on dot limit  \n" +
                    "        if(ligth.spot && dot(ligth.direction, ligth2surface) < ligth.maxDot)  \n" +
                    "            continue;  \n" +
                    "\n" +
                    "        //compute ligth coeficents  \n" +
                    "        difuseValue = max(dot(fnormal, ligth2surface), 0.0);  \n" +
                    "        view2ligth = ligth2surface + view2surface;  \n" +
                    "        specularValue = pow(max(dot(fnormal, normalize(view2ligth)), 0.1), material.specularity) * difuseValue;  \n" +
                    "\n" +
                    "        //add color components  \n" +
                    "        difuseColor += ligth.color * difuseValue;  \n" +
                    "        specularColor += ligth.color * specularValue;  \n" +
                    "\n" +
                    "    }  \n" +
                    "\n" +
                    "    //compute final surface color  \n" +
                    "    gl_FragColor.rgb = material.difuseColor.rgb;   \n" +
                    "    gl_FragColor.rgb *= difuseColor + ambientColor;  \n" +
                    "    gl_FragColor.rgb += specularColor;  \n" +
                    "    gl_FragColor.a = 1.0;  \n" +
                    "\n" +
                    "}";

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
                    shaderAttribs.coords = gl.getAttribLocation(shaderProgram, 'vertexCoords');
                    shaderAttribs.normals = gl.getAttribLocation(shaderProgram, 'vertexNormal');

                    //get shader uniforms reference
                    shaderUniforms.mtransform = gl.getUniformLocation(shaderProgram, 'mtransform');

                    //get shader camera uniforms struct reference
                    shaderUniforms.camera = {
                        mview: gl.getUniformLocation(shaderProgram, 'camera.mview'),
                        mproject: gl.getUniformLocation(shaderProgram, 'camera.mproject'),
                        coords: gl.getUniformLocation(shaderProgram, 'camera.coords')
                    };

                    //get shader material uniforms struct reference
                    shaderUniforms.materials = new Array(1);
                    shaderUniforms.materials[0] = {
                        difuseColor: gl.getUniformLocation(shaderProgram, 'material.difuseColor'),
                        specularity: gl.getUniformLocation(shaderProgram, 'material.specularity')
                    };

                    //get shader ligths uniforms structs reference
                    shaderUniforms.ligths = new Array(8);
                    for (let i = 0, structure; i < 8; i++) {
                        structure = 'ligths[' + i + ']';
                        shaderUniforms.ligths[i] = {
                            enable: gl.getUniformLocation(shaderProgram, structure + '.enable'),
                            ambient: gl.getUniformLocation(shaderProgram, structure + '.ambient'),
                            directional: gl.getUniformLocation(shaderProgram, structure + '.directional'),
                            spot: gl.getUniformLocation(shaderProgram, structure + '.spot'),
                            color: gl.getUniformLocation(shaderProgram, structure + '.color'),
                            coords: gl.getUniformLocation(shaderProgram, structure + '.coords'),
                            direction: gl.getUniformLocation(shaderProgram, structure + '.direction'),
                            maxDot: gl.getUniformLocation(shaderProgram, structure + '.maxDot')
                        };

                    }

                    //define shader methods
                    shaderProgram.disableVertexAttribs = function () {
                        gl.disableVertexAttribArray(this.attribs.coords);
                        gl.disableVertexAttribArray(this.attribs.normals);
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
                    shaderProgram.id = 62671000;

                    //save render shader
                    STLModelLoader.RENDER_SHADER = shaderProgram;

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

        return STLModelLoader.RENDER_SHADER;
    };

    //Renderizable STL Model Material
    ////////////////////////////////////////////////////////////////////////////
    /**
     * @descrition
     * Make a one new Material to store a geometry
     * surface color and other properties. The default
     * difuse color is a received Color.
     * 
     * Material properties:
     * @property {String} name                      Material identifier name
     * @property {Material.Color} difuseColor       Material surface solid difuse color
     * @property {Material.Color} specularColor     Material surface reflective specular color
     * @property {Material.Color} ambientColor      Material surface reflective ambiental color
     * @property {Material.Sampler} difuseMap       Material surface solid difuse sub-sampler  
     * @property {Material.Sampler} specularMap     Material surface reflective specular sub-sampler
     * @property {Material.Sampler} ambientMap      Material surface reflective ambiental sub-sampler
     * @property {Material.Sampler} bumpMap         Material surface normal displacement sub-sampler
     * @property {Material.Sampler} specularityMap  Material surface per-pixel specular reflectance sub-sampler
     * @property {Material.Sampler} ambientalityMap Material surface per-pixel ambiental reflectance sub-sampler
     * @property {Number} specularity               Material surface specular reflectance
     * @property {Number} ambientality              Material surface ambiental reflectance
     * @property {Number} ditter                    Material transparence dittering
     * 
     * @param {String} name
     * @param {Object} difuseColor
     * @returns {OBJModelLoader.Material}
     */
    STLModelLoader.Material = function (name, difuseColor) {
        this.name = name;

        this.difuseColor = new STLModelLoader.Material.Color(difuseColor);
        this.specularColor = new STLModelLoader.Material.Color();
        this.ambientColor = new STLModelLoader.Material.Color();

        this.difuseMap = new STLModelLoader.Material.Sampler();
        this.specularMap = new STLModelLoader.Material.Sampler();
        this.ambientMap = new STLModelLoader.Material.Sampler();
        this.bumpMap = new STLModelLoader.Material.Sampler();
        this.specularityMap = new STLModelLoader.Material.Sampler();
        this.ambientalityMap = new STLModelLoader.Material.Sampler();

        this.specularity = 100;
        this.ambientality = 100;
        this.ditter = 100;
    };

    STLModelLoader.Material.prototype = Object.create(M3D.Model.Material.prototype);

    /** 
     * @description
     * Send to WebGL render shader uniforms, all property 
     * values of one Material.
     * 
     * @param {WebGLRenderingContext} gl
     * @param {Object} uniformStruct  
     * @returns {undefined}
     */
    STLModelLoader.Material.prototype.sendToGPU = function (gl, uniformStruct) {

        uniformStruct.difuseColor && gl.uniform4fv(uniformStruct.difuseColor, this.difuseColor);
        uniformStruct.specularColor && gl.uniform4fv(uniformStruct.specularColor, this.specularColor);
        uniformStruct.ambientColor && gl.uniform4fv(uniformStruct.ambientColor, this.ambientColor);

        uniformStruct.difuseMap && gl.uniform4fv(uniformStruct.difuseMap, this.difuseMap);
        uniformStruct.specularMap && gl.uniform4fv(uniformStruct.specularMap, this.specularMap);
        uniformStruct.ambientMap && gl.uniform4fv(uniformStruct.ambientMap, this.ambientMap);
        uniformStruct.bumpMap && gl.uniform4fv(uniformStruct.bumpMap, this.bumpMap);
        uniformStruct.specularityMap && gl.uniform4fv(uniformStruct.specularityMap, this.specularityMap);
        uniformStruct.ambientalityMap && gl.uniform4fv(uniformStruct.ambientalityMap, this.ambientalityMap);

        uniformStruct.specularity && gl.uniform1f(uniformStruct.specularity, this.specularity);
        uniformStruct.ambientality && gl.uniform1f(uniformStruct.ambientality, this.ambientality);
        uniformStruct.ditter && gl.uniform1f(uniformStruct.ditter, this.ditter);

    };

    /**
     * @description
     * Make or clone an Array of length 4 containing
     * any {r, g, b, a} components of received color
     * or by default WHITE.
     * 
     * DATA STRUCTURE { red, green, blue, alpha } 
     * 
     * @param {Float32Array[3]} clonedColor
     * @returns {Float32Array[3]}
     */
    STLModelLoader.Material.Color = function (clonedColor) {
        let color = new Float32Array(4);

        Object.defineProperty(color, 'red', {
            configurable: false,
            get: function () {
                return this[0];
            }, set: function (value) {
                this[0] = value;
            }});
        Object.defineProperty(color, 'green', {
            configurable: false,
            get: function () {
                return this[1];
            }, set: function (value) {
                this[1] = value;
            }});
        Object.defineProperty(color, 'blue', {
            configurable: false,
            get: function () {
                return this[2];
            }, set: function (value) {
                this[2] = value;
            }});
        color.set = STLModelLoader.Material.Color.prototype.set;

        //define color components values
        if (clonedColor) {
            color[0] = clonedColor.red;
            color[1] = clonedColor.green;
            color[2] = clonedColor.blue;
            color[3] = clonedColor[3] || 0.0;

        } else {
            color[0] = 1;
            color[1] = 1;
            color[2] = 1;
            color[3] = 0;
            
        }

        return color;
    };

    /**
     * @description
     * Set directly any color components values.
     * 
     * @param {Number} red
     * @param {Number} green
     * @param {Number} blue
     * @returns {undefined}
     */
    STLModelLoader.Material.Color.prototype.set = function (red, green, blue) {
        this[0] = red;
        this[1] = green;
        this[2] = blue;
    };

    /**
     * @description
     * Make or clone a super-sampler map sub-sampler
     * descriptor from an specific {s, t} origin coordinates
     * and one fragment space of texture. Any values are stored
     * on one Float32Array of length 4. 
     * 
     * DATA DISTRIBUTION { originS, originT, frgamnet_sizeS, frgamnet_sizeT }
     * 
     * @param {Float32Array[4]} clonedSampler
     * @returns {Float32Array[4]}
     */
    STLModelLoader.Material.Sampler = function (clonedSampler) {
        let sampler = clonedSampler || new Float32Array(4);

        Object.defineProperty(sampler, 's', {
            configurable: false,
            get: function () {
                return this[0];
            }, set: function (value) {
                this[0] = value;
            }});
        Object.defineProperty(sampler, 't', {
            configurable: false,
            get: function () {
                return this[1];
            }, set: function (value) {
                this[1] = value;
            }});
        Object.defineProperty(sampler, 'w', {
            configurable: false,
            get: function () {
                return this[2];
            }, set: function (value) {
                this[2] = value;
            }});
        Object.defineProperty(sampler, 'h', {
            configurable: false,
            get: function () {
                return this[3];
            }, set: function (value) {
                this[3] = value;
            }});

        sampler.s = 0;
        sampler.t = 0;
        sampler.w = 0;
        sampler.h = 0;

        return sampler;
    };

    //Renderizable STL Model
    ////////////////////////////////////////////////////////////////////////////
    
    /**
     * @constructor
     * @description
     * Make one new renderable model.
     * 
     * // values
     * @property {Number} id                Unique model identifier  
     * @property {String} name              Model name
     * @property {String} srcFile           Model source File information
     * 
     * // states
     * @property {Number} drawMode          Used WebGL draw method to render geometries 
     * @property {Boolean} prepared         Flag to define if model is prepared to renderize  
     *                                      That is true after to prepare() methood call or
     *                                      false if is called unprepare() methood.
     * 
     * // geometry data buffers
     * @property {WebGLBuffer} vertexBuffer Output buffer with geometry vertex data
     * 
     * // resources
     * @property {Array} materials          Array with model materials information requireds to renderize
     * @property {WebGLProgram} shader      Shader program required to renderize model
     * @property {BoundBox} bounds          Model axis bounds
     * 
     * // instance draw values
     * @property {Array} drawCalls          Array with any model instances requesting renderize
     * @property {Number} drawCallsNumber   Number of instaces on model instances array
     * 
     * @returns {OBJModelLoader.OBJModel}
     */
    STLModelLoader.STLModel = function () {
        this.id = STLGeneratedModelID++;
        this.name = null;
        this.srcFile = null;
        
        this.drawMode = null;        
        this.prepared = false;

        this.vertexBuffer = null;
        
        this.materials = null;
        this.shader = null;
        this.bounds = null;
        
        this.drawCalls = new Array(100);
        this.drawCallsNumber = 0;
    };

    STLModelLoader.STLModel.prototype = Object.create(M3D.Model.prototype);

    /**
     * @description
     * Make one new model isntance to renderize model.
     * 
     * @returns {STLModelLoader.STLModel.Instance}
     */
    STLModelLoader.STLModel.prototype.makeInstance = function () {
        return new STLModelLoader.STLModel.Instance(this);
    };

    /**
     * @description
     * Prepare one model to use one render WebGLProgram.
     * 
     * Here is binded vertexBuffers to vertexAttribs,
     * and values of surface material has passed to one
     * uniform array with secified structure.
     * 
     * @param {WebGLRenderingContext} gl
     * @param {WebGLShader} shader
     * @returns {undefined}
     */
    STLModelLoader.STLModel.prototype.prepare = function (gl, shader) {

        if (!shader)
            return;

        //buffer values
        let vertexBuffer = this.vertexBuffer;
        let vertexAttribs = this.vertexBuffer.vertexAttribs;

        //shader elements vars
        let shaderAttribs = shader.attribs;
        let shaderUniforms = shader.uniforms;

        //attribs asignation vars
        let vertexStride = this.vertexBuffer.vertexStride;
        let vertexAttrib = null;
        let shaderAttrib = null;

        let color;

        //LINK BUFFER TO ATTRIBs LOCATIONs
        /////////////////////////////////////////////////////////
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

        //vertex coords attrib
        shaderAttrib = shaderAttribs.coords;
        vertexAttrib = vertexAttribs.coords;

        if (shaderAttrib >= 0) {
            if (vertexAttrib) {
                gl.enableVertexAttribArray(shaderAttrib);
                gl.vertexAttribPointer(shaderAttrib, vertexAttrib.size, vertexAttrib.type, vertexAttrib.nomalized, vertexStride, vertexAttrib.offset);
            } else {
                gl.disableVertexAttribArray(shaderAttrib);
                gl.vertexAttrib3f(shaderAttrib, 0, 0, 0);

            }
        }
        ////////////////////////////////

        //vertex normals attrib
        shaderAttrib = shaderAttribs.normals;
        vertexAttrib = vertexAttribs.normals;

        if (shaderAttrib >= 0) {
            if (vertexAttrib) {
                gl.enableVertexAttribArray(shaderAttrib);
                gl.vertexAttribPointer(shaderAttrib, vertexAttrib.size, vertexAttrib.type, vertexAttrib.nomalized, vertexStride, vertexAttrib.offset);

            } else {
                gl.disableVertexAttribArray(shaderAttrib);
                gl.vertexAttrib3f(shaderAttrib, 0, 0, 0);

            }
        }
        ////////////////////////////////

        //vertex colors attrib
        shaderAttrib = shaderAttribs.colors;
        vertexAttrib = vertexAttribs.colors;

        if (shaderAttrib >= 0) {
            if (vertexAttrib) {
                gl.enableVertexAttribArray(shaderAttrib);
                gl.vertexAttribPointer(shaderAttrib, vertexAttrib.size, vertexAttrib.type, vertexAttrib.nomalized, vertexStride, vertexAttrib.offset);

            } else {
                color = this.materials[0].difuseColor;
                gl.disableVertexAttribArray(shaderAttrib);
                gl.vertexAttrib3f(shaderAttrib, color.red, color.green, color.blue);
            }
        }
        ////////////////////////////////

        //close buffer's
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        //send material structure data to shader
        /////////////////////////////////////////////////////////
        if (shaderUniforms.materials) {
            this.materials[0].sendToGPU(gl, shaderUniforms.materials[0]);
        }

        this.prepared = true;
    };

    /**
     * @description
     * Unbind any resources asociateds to model
     * and disconect from received WebGLProgram.
     * 
     * @param {type} gl
     * @param {type} shader
     * @returns {undefined}
     */
    STLModelLoader.STLModel.prototype.unprepare = function (gl, shader) {

        if (shader) {
            shader.disableVertexAttribs(gl);
            this.prepared = false;
        }

    };

    /**
     * @description
     * Add and return a new instance request on model drawCalls stack.
     * 
     * @param {STLModelLoader.STLModel.Instance} drawCallInstance
     * @returns {STLModelLoader.STLModel.Instance}
     */
    STLModelLoader.STLModel.prototype.addDrawCall = function (drawCallInstance) {
        if (drawCallInstance instanceof STLModelLoader.STLModel.Instance) {
            this.drawCalls[this.drawCallsNumber] = drawCallInstance;
            this.drawCallsNumber++;
        }

        return drawCallInstance;
    };

    /**
     * @description
     * Execute all requireds drawCalls with specific
     * instance state uniforms matrixs.
     * 
     * If preserveDrawCalls has receive True,
     * when finish instance rendering, stack has not
     * cleaned else stack size is reset to zero.
     * 
     * @param {WebGLRenderingContext} gl
     * @param {Boolean} preserveDrawCalls
     * @returns {undefined}
     */
    STLModelLoader.STLModel.prototype.executeDrawCalls = function (gl, preserveDrawCalls) {

        //model resources
        let shaderUniforms = this.shader.uniforms;

        //model draw vars
        let vertexsNumber = this.vertexBuffer.vertexsNumber;

        //draw calls vars
        let drawCalls = this.drawCalls;
        let drawCallsNumber = this.drawCallsNumber;
        let instance = null;

        //draw prepared model
        if (this.prepared) {

            //draw each instance call's
            //////////////////////////////////////////////////////////
            for (let i = 0; i < drawCallsNumber; i++) {
                instance = drawCalls[i];
                
                //send instance state uniforms to shader
                gl.uniformMatrix4fv(shaderUniforms.mtransform, false, instance.transformMatrix);
                gl.uniformMatrix4fv(shaderUniforms.mnormal, false, instance.normalMatrix);
                
                //use not-indexed draw mode
                gl.drawArrays(instance.drawMode, 0, vertexsNumber);
                
            }
            //////////////////////////////////////////////////////////

            if (!preserveDrawCalls)
                //reset draw calls number
                this.drawCallsNumber = 0;
        }

    };

    /**
     * @description
     * Draw all model geometry using one specific
     * geoemtry draw mode. Be default is used 
     * (WebGLRenderingContext.GL_TRIANGLES)
     * 
     * @param {WebGLRenderingContext} gl
     * @param {Number} drawMode
     * @returns {undefined}
     */
    STLModelLoader.STLModel.prototype.draw = function (gl, drawMode) {
        gl.drawArrays(drawMode || gl.TRIANGLES, 0, this.vertexBuffer.vertexsNumber);
    };

    /**
     * @description
     * Delete any model resources to freeze
     * used VRAM space.
     * 
     * @param {WebGLRenderingContext} gl
     * @returns {undefined}
     */
    STLModelLoader.STLModel.prototype.destroy = function (gl) {
        gl.deleteBuffer(this.vertexBuffer);
    };

    //Renderizable STL Model Instance
    ////////////////////////////////////////////////////////////////////////////
    /**
     * @description
     * Make one new model instance conatining required state
     * values to renderize one object on the 3D scene.
     * 
     * @property {Number} id                            One unique instance identifier value 
     * @property {STLModel} model                       Rendered model used
     * @property {Float32Array[16]} transformMatrix     Instane geometry transform matrix data
     * @property {Float32Array[16]} normalMatrix        Instane normal transform matrix data  
     * @property {Number} drawMode                      WebGL Poligon, Point or Line draw mode used 
     * @property {Object} coords                        Cartesians {x,y,z} coordinates of rendered model instance  
     * 
     * @param {STLModel} model
     * @returns {STLModelLoader.STLModel.Instance}
     */
    STLModelLoader.STLModel.Instance = function (model) {

        this.id = STLGeneratedInstanceID++;

        //instance resources
        this.model = model;
        this.transformMatrix = new Float32Array(identityMatrix);
        this.normalMatrix = new Float32Array(identityMatrix);

        this.drawMode = model.drawMode;

        //create dinamical coordinates getter
        this.coords = {self: this};
        Object.defineProperty(this.coords, 'x', {
            get: function () {
                return this.self.transformMatrix[12];
            },
            set: function (x) {
                this.self.transformMatrix[12] = x;
            }});
        Object.defineProperty(this.transformMatrix, 'y', {
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

    };

    STLModelLoader.STLModel.Instance.prototype = Object.create(M3D.Model.Instance.prototype);
    
    /**
     * @description
     * Set {x, y, z} cartesina coordinates of
     * one object tu locate it on a 3D space.
     * Received values are directly stored on
     * instance trasformation matrix in row 4.
     * 
     * @param {Number} x
     * @param {Number} y
     * @param {Number} z
     * @returns {undefined}
     */
    STLModelLoader.STLModel.Instance.prototype.setCoords = function (x, y, z) {
        this.transformMatrix[12] = x;
        this.transformMatrix[13] = y;
        this.transformMatrix[14] = z;
    };

    /**
     * @description
     * Change a shaer WebGLUniforms states to represent
     * one object and draw it or one sub-geometry.
     * 
     * @param {WebGLRenderingContext} gl
     * @returns {undefined}
     */
    STLModelLoader.STLModel.Instance.draw = function (gl) {
        gl.uniformMatrix4fv(this.model.shader.uniforms.mtransform, false, this.transformMatrix);
        gl.uniformMatrix4fv(this.model.shader.uniforms.mnormal, false, this.normalMatrix);

        this.model.draw(gl, this.drawMode);
    };

    /**
     * @description
     * Add to model one new required draw call
     * instance.
     * 
     * @returns {undefined}
     */
    STLModelLoader.STLModel.Instance.prototype.sendDrawCall = function () {
        this.model.addDrawCall(this);
    };
    
    //Bound Box class properties
    ////////////////////////////////////////////////////////////////////////////
    /**
     * @description
     * Compute new bound box edges taking max and min
     * values of received {x, y, z} axis components 
     * value.
     * 
     * @param {Number} vx
     * @param {Number} vy
     * @param {Number} vz
     * @returns {undefined}
     */
    BoundBox.prototype.update = function (vx, vy, vz) {
        vx > this.rigth && (this.rigth = vx);
        vx < this.left && (this.left = vx);
        vy > this.up && (this.up = vy);
        vy < this.down && (this.down = vy);
        vz > this.near && (this.near = vz);
        vz < this.far && (this.far = vz);
    };

    /**
     * @description
     * Compute bonud box center coordinates
     * geting middle value betwen edges on 
     * any axis.
     * 
     * middle = ( maxV + minV ) / 2 
     * 
     * @returns {undefined}
     */
    BoundBox.prototype.computeCenter = function () {
        this.centerX = (this.rigth + this.left) / 2;
        this.centerY = (this.up + this.down) / 2;
        this.centerZ = (this.near + this.far) / 2;
    };
    
})();
