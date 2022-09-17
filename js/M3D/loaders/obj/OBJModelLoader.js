
function OBJModelLoader() {}

OBJModelLoader.INDEXED_VERTEX_MODE = 0x62671;

OBJModelLoader.ARRAY_VERTEX_MODE = 0x62672;

OBJModelLoader.STORE_LOADED_VERTEX_DATA = 0x62673;

OBJModelLoader.INLINE_LOADED_VERTEX_DATA = 0x62674;

OBJModelLoader.LOAD_VERTEX_NORMAL = 0x62676;

OBJModelLoader.COMPUTE_VERTEX_NORMAL = 0x62677;

(function () {
    var vertexs = new Array(16);
    var structs = new Array(16);

    //initialize work storages
    for (var i = 0; i < 16; i++) {

        vertexs[i] = {
            vertexCoords: new Float32Array(4),
            vertexNormal: new Float32Array(4),
            vertexTexCoords: new Float32Array(4)
        };

        structs[i] = {
            vertex: 0,
            texel: 0,
            normal: 0
        };

    }

    OBJModelLoader.prototype.debug = false;

    OBJModelLoader.prototype.vertexLoadedMode = OBJModelLoader.STORE_LOADED_VERTEX_DATA;

    OBJModelLoader.prototype.vertexNormalMode = OBJModelLoader.LOAD_VERTEX_NORMAL;

    OBJModelLoader.prototype.vertexUnpackMode = OBJModelLoader.INDEXED_VERTEX_MODE;

    OBJModelLoader.prototype.storeDifuseMap = true;

    OBJModelLoader.prototype.storeSpecularMap = false;

    OBJModelLoader.prototype.storeAmbientMap = false;

    OBJModelLoader.prototype.storeBumpMap = false;

    OBJModelLoader.prototype.storeNsMap = false;

    OBJModelLoader.prototype.storeNaMap = false;

    OBJModelLoader.prototype.defaultColorRed = 1;

    OBJModelLoader.prototype.defaultColorGreen = 1;

    OBJModelLoader.prototype.defaultColorBlue = 1;

    OBJModelLoader.prototype.maxSamplerSize = 4096;

    OBJModelLoader.prototype.useSamplerMipmap = true;

    OBJModelLoader.prototype.loadOBJFile = function (gl, rootPath, fileName, scale, async) {
        var XHR = new XMLHttpRequest();
        var model = null;
        var url = rootPath + '/' + fileName + '.obj';
        var source = null;

        console.time('loading');

        try {
            XHR.open('GET', url, false);      //shysncronized request
            XHR.send(null);
            source = XHR.responseText;

            this.log('LOG: Loaded OBJ Model on URL ' + url);
        } catch (e) {
            console.error('ERROR: Loading OBJ Model on URL ' + url);
        }

        console.timeEnd('loading');

        if (source)
            model = this.parseOBJText(gl, rootPath, fileName, source, scale);


        return model;
    };

    OBJModelLoader.prototype.parseOBJText = function (gl, rootPath, fileName, source, scale) {

        var lines = source.split('\n');
        var linesNumber = lines.length;
        var lineNumber = 0;
        var workGroup = this.createNewWorkGroup(gl, rootPath, fileName, lines, scale);
        var lineWords = null;

        console.time('parsing');

        //parsing each lines of source text
        try {
            for (lineNumber = 0; lineNumber < linesNumber; lineNumber++) {
                lineWords = this.getLineWords(lines[lineNumber]);
                workGroup.currentLineNumber = lineNumber;

                if (lineWords.length > 1) {
                    this.parseOBJLine(workGroup, lineWords);
                }

            }
        } catch (e) {
            console.error(e + "\n" + lineNumber + ' : ' + lineWords);
        }

        //save a last created OBJObject
        this.saveOBJObject(workGroup);

        //delete source text
        lines = null;
        workGroup.lines = null;

        //unpack model data to use in WebGL draw call
        this.storeBufferData(workGroup);
        this.storeMTLMaterials(workGroup);
        this.saveOBJModel(workGroup);

        console.timeEnd('parsing');

        return workGroup.model;
    };

    OBJModelLoader.prototype.createNewWorkGroup = function (gl, rootPath, fileName, lines, scale) {

        rootPath || (rootPath = '');
        lines || (lines = []);

        var workGroup = new Object();

        //self references
        workGroup.gl = gl;
        workGroup.self = this;
        workGroup.XHR = new XMLHttpRequest();
        workGroup.rootPath = rootPath;
        workGroup.fileName = fileName;
        workGroup.vector = [0, 0, 0, 0];
        workGroup.scale = scale || 1;

        //source info
        workGroup.lines = lines;
        workGroup.numLines = lines.length;
        workGroup.currentLineNumber = 0;
        workGroup.faceGroupInitialLine = 0;
        workGroup.currentLineCommand = '';

        //loaded vertex data
        workGroup.storeLoadedVertexData = this.vertexLoadedMode !== OBJModelLoader.INLINE_LOADED_VERTEX_DATA;
        workGroup.loadedVertexCoords = new Array();
        workGroup.loadedVertexNormals = new Array();
        workGroup.loadedVertexTexCoords = new Array();

        //restet vertex loaded mode
        this.vertexLoadedMode = OBJModelLoader.DINAMIC_LOADED_VERTEX_DATA;

        //stored buffer data array
        workGroup.vertexBuffer = new Array();
        workGroup.indexBuffer = new Array();

        //performing render mode
        workGroup.useIndexedVertexs = this.vertexUnpackMode === OBJModelLoader.INDEXED_VERTEX_MODE;
        workGroup.indexUnpackFormat = gl.UNSIGNED_SHORT;
        workGroup.indexedDraw = workGroup.useIndexedVertexs;
        workGroup.loadVertexNormal = OBJModelLoader.vertexNormalMode === OBJModelLoader.LOAD_VERTEX_NORMAL;

        //data stats
        workGroup.numVertexs = 0;
        workGroup.numIndexs = 0;

        //used resources
        workGroup.loadedMaterialLibraries = new Array();
        workGroup.materials = new Array();
        workGroup.objects = new Array();
        workGroup.bounds = new BoundBox();

        //control of loadeds samplers textures
        workGroup.storeDifuseMap = this.storeDifuseMap;
        workGroup.storeSpecularMap = this.storeSpecularMap;
        workGroup.storeAmbientMap = this.storeAmbientMap;
        workGroup.storeBumpMap = this.storeBumpMap;
        workGroup.storeNsMap = this.storeNsMap;
        workGroup.storeNaMap = this.storeNaMap;

        //samplers textures lists
        workGroup.samplerBuilder = new SamplerBuilder();
        workGroup.difuseSampler = workGroup.samplerBuilder.createNewSampler(gl, this.maxSamplerSize, this.useSamplerMipmap);
        workGroup.specularSampler = workGroup.samplerBuilder.createNewSampler(gl, this.maxSamplerSize, this.useSamplerMipmap);
        workGroup.ambientSampler = workGroup.samplerBuilder.createNewSampler(gl, this.maxSamplerSize, this.useSamplerMipmap);
        workGroup.bumpSampler = workGroup.samplerBuilder.createNewSampler(gl, this.maxSamplerSize, this.useSamplerMipmap);
        workGroup.nsSampler = workGroup.samplerBuilder.createNewSampler(gl, this.maxSamplerSize, this.useSamplerMipmap);
        workGroup.naSampler = workGroup.samplerBuilder.createNewSampler(gl, this.maxSamplerSize, this.useSamplerMipmap);

        //create default material
        this.createNewMTLMaterial(workGroup, 'default');
        workGroup.currentMaterial = workGroup.materials[0];

        //try to load MTL library of equal name to OBJ File
        if (fileName)
            this.loadMTLFile(workGroup, fileName + '.mtl');

        return workGroup;
    };

    OBJModelLoader.prototype.getLineWords = function (line) {
        var length = line.length;
        var words = new Array();
        var word = '';
        var character = '';

        for (var i = 0; i < length; i++) {
            switch (character = line[i]) {
                case ' ':
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

        if (word.length > 0) {
            words[words.length] = word;
        }

        return words;
    };

    OBJModelLoader.prototype.joinLineWords = function (words, inice, end) {
        inice !== undefined || (inice = 0);
        end !== undefined || (end = words.length);

        var line = '';

        for (var i = inice; i < end; i++) {
            line += (i < end - 1) ? words[i] + ' ' : words[i];
        }

        return line;
    };

    var components;
    OBJModelLoader.prototype.parseIndexedStructure = function (word, struct) {
        components = word.split('/');

        //parse struct component (v v/n/t , v//t , v/n)
        struct.vertex = this.parseInt(components[0], NaN);
        struct.texel = this.parseInt(components[1], NaN);
        struct.normal = this.parseInt(components[2], NaN);

        return struct;
    };

    OBJModelLoader.prototype.parseInt = function (value, defaultValue) {
        var number;
        return value !== undefined && !isNaN(number = parseInt(value)) ? number : defaultValue;
    };

    OBJModelLoader.prototype.parseFloat = function (value, defaultValue) {
        var number;
        return value !== undefined && !isNaN(number = parseFloat(value)) ? number : defaultValue;
    };

    OBJModelLoader.prototype.parseOBJLine = function (workGroup, words) {

        var command = words[0];

        switch (command) {
            case 'mtllib':
                this.loadMTLFile(workGroup, this.joinLineWords(words, 1));
                break;

            case 'usemtl':
                this.useMTLMaterial(workGroup, this.joinLineWords(words, 1));
                break;

            case 'o':
            case 'g':
                this.createNewOBJObject(workGroup, this.joinLineWords(words, 1));
                break;

            case 'v':
                if (workGroup.storeLoadedVertexData)
                    this.storeLoadedVertexCoords(workGroup, words);

                break;

            case 'vn':
                if (workGroup.storeLoadedVertexData)
                    this.storeLoadedVertexNormals(workGroup, words);

                break;

            case 'vt':
                if (workGroup.storeLoadedVertexData)
                    this.storeLoadedVertexTexCoords(workGroup, words);

                break;

            case 'f':

                //annote face group initial line
                if (command !== workGroup.currentLineCommand) {
                    workGroup.faceGroupInitialLine = workGroup.currentLineNumber;
                }

                this.addFaceData(workGroup, words);

                break;
        }

        workGroup.currentLineCommand = command;
    };

    var lineWords;
    OBJModelLoader.prototype.parseLineVector = function (workGroup, lineNumber, outputVector) {

        lineWords = this.getLineWords(workGroup.lines[lineNumber] || '');

        outputVector[0] = this.parseFloat(lineWords[1], 0);
        outputVector[1] = this.parseFloat(lineWords[2], 0);
        outputVector[2] = this.parseFloat(lineWords[3], 0);

        return outputVector;
    };

    OBJModelLoader.prototype.createNewOBJObject = function (workGroup, name) {

        var object;
        var numObjects = workGroup.objects.length;

        this.saveOBJObject(workGroup);

        //create new object
        object = new Object();
        object.id = numObjects;
        object.name = name ? name : 'newObject_' + numObjects;

        object.initialIndex = workGroup.numIndexs;
        object.initialVertex = workGroup.numVertexs;
        object.bounds = new BoundBox();

        //store object
        workGroup.currentObject = object;
        workGroup.objects[numObjects] = object;

        this.log('\tCreated new OBJObject name: ' + object.name);

    };

    OBJModelLoader.prototype.saveOBJObject = function (workGroup) {
        var numObjects = workGroup.objects.length;

        //save OBJ object params
        if (numObjects > 0) {
            workGroup.currentObject.lastIndex = workGroup.numIndexs - 1;
            workGroup.currentObject.numIndexs = workGroup.numIndexs - workGroup.currentObject.initialIndex;

            workGroup.currentObject.lastVertex = workGroup.numVertexs - 1;
            workGroup.currentObject.numVertexs = workGroup.numVertexs - workGroup.currentObject.initialVertex;

            workGroup.currentObject.indexedDraw = workGroup.numVertexs !== workGroup.currentObject.numIndexs;

            this.computeOBJObjectCenter(workGroup);
            this.updateOBJModelBounds(workGroup);
        }

    };

    OBJModelLoader.prototype.storeLoadedVertexCoords = function (workGroup, words) {
        workGroup.loadedVertexCoords.push(this.parseFloat(words[1], 0.0));
        workGroup.loadedVertexCoords.push(this.parseFloat(words[2], 0.0));
        workGroup.loadedVertexCoords.push(this.parseFloat(words[3], 0.0));

    };

    OBJModelLoader.prototype.storeLoadedVertexNormals = function (workGroup, words) {
        workGroup.loadedVertexNormals.push(this.parseFloat(words[1], 0.0));
        workGroup.loadedVertexNormals.push(this.parseFloat(words[2], 0.0));
        workGroup.loadedVertexNormals.push(this.parseFloat(words[3], 0.0));

    };

    OBJModelLoader.prototype.storeLoadedVertexTexCoords = function (workGroup, words) {
        workGroup.loadedVertexTexCoords.push(this.parseFloat(words[1], 0.0));
        workGroup.loadedVertexTexCoords.push(this.parseFloat(words[2], 0.0));

    };

    OBJModelLoader.prototype.getLoadedVertexCoords = function (workGroup, index, outputVector) {

        if (index > 0) {
            index = (index - 1) * 3;
            outputVector[0] = workGroup.loadedVertexCoords[index] * workGroup.scale;
            outputVector[1] = workGroup.loadedVertexCoords[index + 1] * workGroup.scale;
            outputVector[2] = workGroup.loadedVertexCoords[index + 2] * workGroup.scale;

        } else if (index < 0) {
            this.parseLineVector(workGroup, workGroup.faceGroupInitialLine + (index * 3), outputVector);

            outputVector[0] *= workGroup.scale;
            outputVector[1] *= workGroup.scale;
            outputVector[2] *= workGroup.scale;

        } else {
            outputVector[0] = 0;
            outputVector[1] = 0;
            outputVector[2] = 0;

        }

        this.updateOBJObjectBounds(workGroup, outputVector[0], outputVector[1], outputVector[2]);
        return outputVector;
    };

    OBJModelLoader.prototype.getLoadedVertexNormal = function (workGroup, index, outputVector, faceNormal) {

        if (index > 0) {
            index = (index - 1) * 3;
            outputVector[0] = workGroup.loadedVertexNormals[index];
            outputVector[1] = workGroup.loadedVertexNormals[index + 1];
            outputVector[2] = workGroup.loadedVertexNormals[index + 2];

        } else if (index < 0) {
            this.parseLineVector(workGroup, workGroup.faceGroupInitialLine + (index * 3 + 1), outputVector);

        } else {
            outputVector[0] = faceNormal[0];
            outputVector[1] = faceNormal[1];
            outputVector[2] = faceNormal[2];

        }

        return outputVector;
    };

    OBJModelLoader.prototype.getLoadedVertexTexCoords = function (workGroup, index, outputVector) {

        if (index > 0) {
            index = (index - 1) * 2;
            outputVector[0] = workGroup.loadedVertexTexCoords[index];
            outputVector[1] = workGroup.loadedVertexTexCoords[index + 1];

        } else if (index < 0) {
            this.parseLineVector(workGroup, workGroup.faceGroupInitialLine + (index * 3 + 2), outputVector);

        } else {
            outputVector[0] = 0.5;
            outputVector[1] = 0.5;

        }

        return outputVector;
    };

    OBJModelLoader.prototype.storeVertexData = function (workGroup, vertexData) {

        //store data on vertex array
        workGroup.vertexBuffer.push(vertexData.vertexCoords[0]);
        workGroup.vertexBuffer.push(vertexData.vertexCoords[1]);
        workGroup.vertexBuffer.push(vertexData.vertexCoords[2]);

        workGroup.vertexBuffer.push(vertexData.vertexNormal[0]);
        workGroup.vertexBuffer.push(vertexData.vertexNormal[1]);
        workGroup.vertexBuffer.push(vertexData.vertexNormal[2]);

        workGroup.vertexBuffer.push(vertexData.vertexTexCoords[0]);
        workGroup.vertexBuffer.push(vertexData.vertexTexCoords[1]);

        workGroup.vertexBuffer.push(workGroup.currentObject.id);
        workGroup.vertexBuffer.push(workGroup.currentMaterial.id);

    };

    OBJModelLoader.prototype.storeBufferData = function (workGroup) {
        this.storeVertexBufferData(workGroup);

        //save index buffer if is apply indexedMode
        if (workGroup.useIndexedVertexs)
            this.storeIndexBufferData(workGroup);
        else
            workGroup.indexBuffer = null;

    };

    OBJModelLoader.prototype.storeVertexBufferData = function (workGroup) {

        var gl = workGroup.gl;
        var targetBuffer;
        var vertexBuffer;

        var numVertexs = workGroup.numVertexs;

        var vertexData = new ArrayBuffer(numVertexs * 24);
        var vertexDataView = new DataView(vertexData);

        var arrayIndex = 0;
        var viewIndex = 0;

        this.log('LOG: Storing model vertex data on GL_BUFFER => length: ' + numVertexs + ' byte_length: ' + (numVertexs * 24));

        //delete residual and unnessessary memory
        workGroup.loadedVertexCoords = null;
        workGroup.loadedVertexNormals = null;
        workGroup.loadedVertexTexCoords = null;

        //store buffer data
        for (var i = 0; i < numVertexs; i++) {
            viewIndex = 24 * i;
            arrayIndex = 10 * i;

            // [v v v v | v v v v | v v v v | n | n | n | 0 | t t | t t | m | 0 ]

            vertexDataView.setFloat32(viewIndex, workGroup.vertexBuffer[arrayIndex], true);
            vertexDataView.setFloat32(viewIndex + 4, workGroup.vertexBuffer[arrayIndex + 1], true);
            vertexDataView.setFloat32(viewIndex + 8, workGroup.vertexBuffer[arrayIndex + 2], true);

            vertexDataView.setUint8(viewIndex + 12, workGroup.vertexBuffer[arrayIndex + 3] * 0x7F);
            vertexDataView.setUint8(viewIndex + 13, workGroup.vertexBuffer[arrayIndex + 4] * 0x7F);
            vertexDataView.setUint8(viewIndex + 14, workGroup.vertexBuffer[arrayIndex + 5] * 0x7F);
            vertexDataView.setUint8(viewIndex + 15, 0);

            vertexDataView.setUint16(viewIndex + 16, workGroup.vertexBuffer[arrayIndex + 6] * 0xFFFF, true);
            vertexDataView.setUint16(viewIndex + 18, workGroup.vertexBuffer[arrayIndex + 7] * 0xFFFF, true);

            vertexDataView.setUint16(viewIndex + 20, workGroup.vertexBuffer[arrayIndex + 8], true);
            vertexDataView.setUint16(viewIndex + 22, workGroup.vertexBuffer[arrayIndex + 9], true);
        }

        //save procesed data and clear unused memory
        workGroup.vertexBuffer = vertexData;

        //store vertex data on one GL_BUFFER
        vertexBuffer = gl.createBuffer();
        targetBuffer = gl.ARRAY_BUFFER;
        gl.bindBuffer(targetBuffer, vertexBuffer);
        gl.bufferData(targetBuffer, workGroup.vertexBuffer, gl.STATIC_DRAW);
        gl.bindBuffer(targetBuffer, null);

        //save buffers
        workGroup.vertexBuffer = vertexBuffer;

    };

    OBJModelLoader.prototype.storeIndexBufferData = function (workGroup) {

        var gl = workGroup.gl;

        var numVertexs = workGroup.numVertexs;
        var numIndexs = workGroup.numIndexs;

        var indexBuffer = null;
        var targetBuffer = 0;
        var integerIndexAvaliable = gl.getExtension('OES_element_index_uint');

        //select index buffer unpack format
        if (numIndexs === numVertexs) {
            workGroup.indexedDraw = false;  //disable indexed draw because a index is linked witch only to one vertex (use drawArray in this case for performance)

        } else if (numVertexs > 65534 && integerIndexAvaliable) {

            workGroup.indexBuffer = new Uint32Array(workGroup.indexBuffer);
            workGroup.indexUnpackFormat = gl.UNSIGNED_INT;
            this.log('LOG: Storing model index data on GL_BUFFER => length: ' + numIndexs + ' (unpacked at Uint32)  byte_length: ' + (numIndexs * 4));

            //store index data on one GL_BUFFER
            indexBuffer = gl.createBuffer();
            targetBuffer = gl.ELEMENT_ARRAY_BUFFER;
            gl.bindBuffer(targetBuffer, indexBuffer);
            gl.bufferData(targetBuffer, workGroup.indexBuffer, gl.STATIC_DRAW);
            gl.bindBuffer(targetBuffer, null);

        } else {
            workGroup.indexBuffer = new Uint16Array(workGroup.indexBuffer);
            this.log('LOG: Storing model index data on GL_BUFFER => length: ' + numIndexs + ' (unpacked at Uint16)  byte_length: ' + (numIndexs * 2));

            //store index data on one GL_BUFFER
            indexBuffer = gl.createBuffer();
            targetBuffer = gl.ELEMENT_ARRAY_BUFFER;
            gl.bindBuffer(targetBuffer, indexBuffer);
            gl.bufferData(targetBuffer, workGroup.indexBuffer, gl.STATIC_DRAW);
            gl.bindBuffer(targetBuffer, null);

        }

        workGroup.indexBuffer = indexBuffer;

    };

    OBJModelLoader.prototype.updateOBJObjectBounds = function (workGroup, vx, vy, vz) {
        var bounds = workGroup.currentObject.bounds;

        vx < bounds.rigth || (bounds.rigth = vx);
        vx > bounds.left || (bounds.left = vx);
        vy < bounds.up || (bounds.up = vy);
        vy > bounds.down || (bounds.down = vy);
        vz < bounds.near || (bounds.near = vz);
        vz > bounds.far || (bounds.far = vz);

    };

    OBJModelLoader.prototype.updateOBJModelBounds = function (workGroup, vx, vy, vz) {
        var objectBounds = workGroup.currentObject.bounds;
        var modelBounds = workGroup.bounds;

        objectBounds.rigth < modelBounds.rigth || (modelBounds.rigth = objectBounds.rigth);
        objectBounds.left > modelBounds.left || (modelBounds.left = objectBounds.left);
        objectBounds.up < modelBounds.up || (modelBounds.up = objectBounds.up);
        objectBounds.down > modelBounds.down || (modelBounds.down = objectBounds.down);
        objectBounds.near < modelBounds.near || (modelBounds.near = objectBounds.near);
        objectBounds.far > modelBounds.far || (modelBounds.far = objectBounds.far);

    };

    OBJModelLoader.prototype.computeOBJObjectCenter = function (workGroup) {
        var bounds = workGroup.currentObject.bounds;

        bounds.centerX = (bounds.rigth + bounds.left) / 2;
        bounds.centerY = (bounds.up + bounds.down) / 2;
        bounds.centerZ = (bounds.near + bounds.far) / 2;

    };

    OBJModelLoader.prototype.computeOBJModelCenter = function (workGroup) {
        var bounds = workGroup.bounds;

        bounds.centerX = (bounds.rigth + bounds.left) / 2;
        bounds.centerY = (bounds.up + bounds.down) / 2;
        bounds.centerZ = (bounds.near + bounds.far) / 2;

    };

    var length;
    var v0 = new Float32Array(3);
    var v1 = new Float32Array(3);
    OBJModelLoader.prototype.computeFaceNormal = function (p1, p2, p3, faceNormal) {

        //compute three face pints diferenece
        v0[0] = p1[0] - p2[0];
        v0[1] = p1[1] - p2[1];
        v0[2] = p1[2] - p2[2];

        v1[0] = p3[0] - p2[0];
        v1[1] = p3[1] - p2[1];
        v1[2] = p3[2] - p2[2];

        //cross product
        faceNormal[0] = v0[1] * v1[2] - v0[2] * v1[1];
        faceNormal[1] = v0[2] * v1[0] - v0[0] * v1[2];
        faceNormal[2] = v0[0] * v1[1] - v0[1] * v1[0];

        //length of vector
        length = Math.sqrt(faceNormal[0] * faceNormal[0] + faceNormal[1] * faceNormal[1] + faceNormal[2] * faceNormal[2]);

        //normalize vector if is posible
        if (length !== 0) {
            faceNormal[0] /= length;
            faceNormal[1] /= length;
            faceNormal[2] /= length;
        }

        //invert a vector components values
        faceNormal[0] *= -1;
        faceNormal[1] *= -1;
        faceNormal[2] *= -1;

        return faceNormal;
    };

    var numPoints;
    var faceNormal = new Float32Array(4);
    var struct;
    var vertex;
    OBJModelLoader.prototype.addFaceData = function (workGroup, words) {
        numPoints = words.length - 1;

        //parse face indexed structues
        for (var i = 0; i < numPoints; i++) {

            //get structs or instantiate a new
            struct = structs[i] || (structs[i] = {
                vertex: 0,
                texel: 0,
                normal: 0
            });
            vertex = vertexs[i] || (vertexs[i] = {
                vertexCoords: new Float32Array(4),
                vertexNormal: new Float32Array(4),
                vertexTexCoords: new Float32Array(4)
            });

            this.parseIndexedStructure(words[i + 1], struct);

            //store vertex coords and texCoord
            this.getLoadedVertexCoords(workGroup, struct.vertex, vertex.vertexCoords);
            this.getLoadedVertexTexCoords(workGroup, struct.texel, vertex.vertexTexCoords);

        }

        //compute default face normal
        this.computeFaceNormal(vertexs[0].vertexCoords, vertexs[1].vertexCoords, vertexs[2].vertexCoords, faceNormal);

        //store vertexs normals or use computeds
        for (var i = 0; i < numPoints; i++) {
            vertex = vertexs[i];

            if (workGroup.loadedVertexNormals)
                this.getLoadedVertexNormal(workGroup, structs[i].normal, vertex.vertexNormal, faceNormal);
            else {
                vertex.vertexNormal[0] = faceNormal[0];
                vertex.vertexNormal[1] = faceNormal[1];
                vertex.vertexNormal[2] = faceNormal[2];
            }

        }

        //use vertex data unpack methood
        if (workGroup.useIndexedVertexs)
            this.addIndexedFace(workGroup, numPoints, vertexs);
        else
            this.addArrayFace(workGroup, numPoints, vertexs);

    };

    var numVertexs;
    OBJModelLoader.prototype.addIndexedFace = function (workGroup, numPoints, vertexs) {
        numVertexs = workGroup.numVertexs;

        //store face vertexs on buffer
        for (var i = 0; i < numPoints; i++) {
            this.storeVertexData(workGroup, vertexs[i]);
        }

        //update a number of stored vertexs on buffer
        workGroup.numVertexs += numPoints;

        //store face index on buffer (cast N side's poligon 2 triangles)
        for (var i = 1; i < numPoints - 1; i++) {

            workGroup.indexBuffer.push(numVertexs);
            workGroup.indexBuffer.push(numVertexs + i);
            workGroup.indexBuffer.push(numVertexs + i + 1);
            workGroup.numIndexs += 3;

        }

    };

    OBJModelLoader.prototype.addArrayFace = function (workGroup, numPoints, vertexs) {

        //store face vertexs on buffer (cast N side's poligon to triangles)
        for (var i = 1; i < numPoints - 1; i++) {

            this.storeVertexData(workGroup, vertexs[0]);
            this.storeVertexData(workGroup, vertexs[i]);
            this.storeVertexData(workGroup, vertexs[i + 1]);
            workGroup.numVertexs += 3;

        }

    };

    OBJModelLoader.prototype.saveOBJModel = function (workGroup) {
        var model = new OBJModel();

        //store renderable model buffer data
        model.vertexBuffer = workGroup.vertexBuffer;
        model.indexBuffer = workGroup.indexBuffer;

        model.indexUnpackFormat = workGroup.indexUnpackFormat;
        model.indexedDraw = workGroup.indexedDraw;

        model.numVertexs = workGroup.numVertexs;
        model.numIndexs = workGroup.numIndexs;

        model.fileName = workGroup.fileName;
        model.objects = workGroup.objects;
        model.materials = workGroup.materials;

        //compute model center
        this.computeOBJModelCenter(workGroup);
        model.bounds = workGroup.bounds;

        //store textures samplers on model
        model.difuseSampler = workGroup.storeDifuseMap ? workGroup.difuseSampler.sampler : null;
        model.specularSampler = workGroup.storeSpecularMap ? workGroup.specularSampler.sampler : null;
        model.ambientSampler = workGroup.storeAmbientMap ? workGroup.ambientSampler.sampler : null;
        model.bumpSampler = workGroup.storeBumpMap ? workGroup.bumpSampler.sampler : null;
        model.nsSampler = workGroup.storeNsMap ? workGroup.nsSampler.sampler : null;
        model.naSampler = workGroup.storeNaMap ? workGroup.naSampler.sampler : null;

        workGroup.model = model;
    };

    //MTL Parser Functions
    OBJModelLoader.prototype.loadMTLFile = function (workGroup, fileName) {
        var url = workGroup.rootPath + '/' + fileName;
        var source = null;
        var found = false;
        var length = workGroup.loadedMaterialLibraries.length;

        //search for already loaded material lib files
        for (var i = 0; !found && i < length; i++) {
            found = workGroup.loadedMaterialLibraries[i] === url;
        }

        if (!found) {
            try {
                workGroup.XHR.open('GET', url, false);  //shysncronized request
                workGroup.XHR.send(null);
                source = workGroup.XHR.responseText;

                this.log('LOG: Loaded Material Library on URL ' + url);
            } catch (e) {
                console.error('ERROR: line: ' + workGroup.currentLineNumber + ' Loading Material Library on URL ' + url);
            }

            workGroup.loadedMaterialLibraries[length] = url;
        } else {
            this.log('LOG: Already loaded MTL Library in URL: ' + url);

        }

        if (source)
            this.parseMTLText(workGroup, source);

    };

    OBJModelLoader.prototype.parseMTLText = function (workGroup, source) {

        var lines = source.split('\n');
        var linesNumber = lines.length;
        var lineWords = null;
        var newMaterial = null;
        var currentMaterial = null;

        //parse each lines on source
        for (var i = 0; i < linesNumber; i++) {
            lineWords = this.getLineWords(lines[i]);

            if (lineWords.length > 1) {
                newMaterial = this.parseMTLLine(workGroup, currentMaterial, lineWords);

                if (newMaterial) {
                    currentMaterial = newMaterial;
                }
            }

        }   //end for

    };

    OBJModelLoader.prototype.parseMTLLine = function (workGroup, material, words) {
        var newMaterial = null;
        var imageURL = null;

        switch (words[0]) {
            case 'newmtl':
                newMaterial = this.createNewMTLMaterial(workGroup, this.joinLineWords(words, 1));

                break;

            case 'Kd':
                material.Kd[0] = this.parseFloat(words[1], 1.0);
                material.Kd[1] = this.parseFloat(words[2], 1.0);
                material.Kd[2] = this.parseFloat(words[3], 1.0);

                break;

            case 'Ks':
                material.Ks[0] = this.parseFloat(words[1], 1.0);
                material.Ks[1] = this.parseFloat(words[2], 1.0);
                material.Ks[2] = this.parseFloat(words[3], 1.0);

                break;

            case 'Ka':
                material.Ka[0] = this.parseFloat(words[1], 1.0);
                material.Ka[1] = this.parseFloat(words[2], 1.0);
                material.Ka[2] = this.parseFloat(words[3], 1.0);

                break;

            case 'Ns':
                material.Ns = this.parseFloat(words[1], 100.0);

                break;

            case 'Na':
                material.Na = this.parseFloat(words[1], 100.0);

                break;

            case 'd':
                material.d = this.parseFloat(words[1], 0.0);

                break;

            case 'map_Kd':
                if (workGroup.storeDifuseMap) {
                    imageURL = workGroup.rootPath + '/' + this.joinLineWords(words, 1);
                    material.mapKd = workGroup.samplerBuilder.addSamplerImage(workGroup.difuseSampler, imageURL).samplerMatrix;

                }
                break;

            case 'map_Ks':
                if (workGroup.storeSpecularMap) {
                    imageURL = workGroup.rootPath + '/' + this.joinLineWords(words, 1);
                    material.mapKs = workGroup.samplerBuilder.addSamplerImage(workGroup.specularSampler, imageURL).samplerMatrix;

                }
                break;

            case 'map_Ka':
                if (workGroup.storeAmbientMap) {
                    imageURL = workGroup.rootPath + '/' + this.joinLineWords(words, 1);
                    material.mapKa = workGroup.samplerBuilder.addSamplerImage(workGroup.ambientSampler, imageURL).samplerMatrix;

                }
                break;

            case 'map_bump':
                if (workGroup.storeBumpMap) {
                    imageURL = workGroup.rootPath + '/' + this.joinLineWords(words, 1);
                    material.mapBump = workGroup.samplerBuilder.addSamplerImage(workGroup.bumpSampler, imageURL).samplerMatrix;

                }
                break;

            case 'map_Ns':
                if (workGroup.storeNsMap) {
                    imageURL = workGroup.rootPath + '/' + this.joinLineWords(words, 1);
                    material.mapNs = workGroup.samplerBuilder.addSamplerImage(workGroup.nsSampler, imageURL).samplerMatrix;

                }
                break;

            case 'map_Na':
                if (workGroup.storeNaMap) {
                    imageURL = workGroup.rootPath + '/' + this.joinLineWords(words, 1);
                    material.mapNa = workGroup.samplerBuilder.addSamplerImage(workGroup.naSampler, imageURL).samplerMatrix;
                }

                break;
        }

        return newMaterial;
    };

    OBJModelLoader.prototype.createNewMTLMaterial = function (workGroup, materialName) {
        var material = new Object();
        var numMaterials = workGroup.materials.length;

        material.id = numMaterials;
        material.name = (materialName ? materialName : 'Material_' + numMaterials);

        material.Kd = [this.defaultColorRed || 0, this.defaultColorGreen || 0, this.defaultColorBlue || 0];
        material.mapKd = null;

        material.Ks = [1.0, 1.0, 1.0];
        material.mapKs = null;

        material.Ka = [1.0, 1.0, 1.0];
        material.mapKa = null;

        material.Ns = 100.0;
        material.mapNs = null;

        material.Na = 100.0;
        material.mapNa = null;

        material.d = 0;
        material.mapBump = null;

        //store a new material
        workGroup.materials[numMaterials] = material;

        this.log('\tCreated new MTLMaterial ' + material.name);

        return material;
    };

    OBJModelLoader.prototype.searchMTLMaterial = function (workGroup, materialName) {

        var length = workGroup.materials.length;
        var material = null;
        var index;

        //search material by name
        for (index = 1; index < length && material === null; index++) {
            if (workGroup.materials[index].name === materialName) {
                material = workGroup.materials[index];
            }
        }

        this.log('\tSearching material of name: ' + materialName + ' , found: ' + (material ? 'true index: ' + (index - 1) : 'false'));

        return material;
    };

    OBJModelLoader.prototype.useMTLMaterial = function (workGroup, materialName) {
        var material = null;

        if (workGroup.currentMaterial.name !== materialName) {

            //define new used material
            material = this.searchMTLMaterial(workGroup, materialName);

            //use founded material or default
            if (material === null)
                workGroup.currentMaterial = workGroup.materials[0];
            else
                workGroup.currentMaterial = material;

            this.log('\tUsing new material ' + workGroup.currentMaterial.name);

        }

    };

    OBJModelLoader.prototype.storeMTLMaterials = function (workGroup) {

        //build sampler's textures
        workGroup.samplerBuilder.buildSampler(workGroup.difuseSampler);
        workGroup.samplerBuilder.buildSampler(workGroup.specularSampler);
        workGroup.samplerBuilder.buildSampler(workGroup.ambientSampler);
        workGroup.samplerBuilder.buildSampler(workGroup.bumpSampler);
        workGroup.samplerBuilder.buildSampler(workGroup.nsSampler);
        workGroup.samplerBuilder.buildSampler(workGroup.naSampler);

    };

    OBJModelLoader.prototype.log = function (logMessage) {
        !this.debug || console.log(logMessage);
    };


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

    function OBJModel() {}

    OBJModel.emptyMat3 = new Float32Array(9);

    OBJModel.prototype.prepare = function (gl, attribs, materialStructures) {
        var attribute;
        var structure;
        var material;
        var length;

        //LINK BUFFER TO ATTRIBs LOCATIONs
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

        attribute = attribs.coords;
        if (attribute !== -1) {
            gl.vertexAttribPointer(attribute, 3, gl.FLOAT, false, 24, 0);
        }

        attribute = attribs.normals;
        if (attribute !== -1) {
            gl.vertexAttribPointer(attribute, 4, gl.BYTE, true, 24, 12);
        }

        attribute = attribs.texels;
        if (attribute !== -1) {
            gl.vertexAttribPointer(attribute, 2, gl.UNSIGNED_SHORT, true, 24, 16);
        }

        attribute = attribs.metadata;
        if (attribute !== -1) {
            gl.vertexAttribPointer(attribute, 2, gl.UNSIGNED_SHORT, false, 24, 20);
        }

        //close buffers
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

        //set materials to GPU
        length = this.materials.length;
        for (var i = 0; i < length; i++) {
            material = this.materials[i];
            structure = materialStructures[i];

            if (structure) {
                //set material RGB components
                gl.uniform3fv(structure.Kd, material.Kd);
                gl.uniform3fv(structure.Ks, material.Ks);
                gl.uniform3fv(structure.Ka, material.Ka);

                //set material coeficents
                gl.uniform1f(structure.Ns, material.Ns);
                gl.uniform1f(structure.Na, material.Na);
                gl.uniform1f(structure.d, material.d);

                //set sampler matrixs
                gl.uniformMatrix3fv(structure.mapKd, false, material.mapKd || OBJModel.emptyMat3);
                gl.uniformMatrix3fv(structure.mapKs, false, material.mapKs || OBJModel.emptyMat3);
                gl.uniformMatrix3fv(structure.mapKa, false, material.mapKa || OBJModel.emptyMat3);
                gl.uniformMatrix3fv(structure.mapBump, false, material.mapBump || OBJModel.emptyMat3);
                gl.uniformMatrix3fv(structure.mapNs, false, material.mapNs || OBJModel.emptyMat3);
                gl.uniformMatrix3fv(structure.mapNa, false, material.mapNa || OBJModel.emptyMat3);

            }
        }

        //bind requireds and existent textures
        if (this.difuseSampler && this.difuseSampler.initialized) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.difuseSampler);
        }

        if (this.specularSampler && this.specularSampler.initialized) {
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, this.specularSampler);
        }

        if (this.ambientSampler && this.ambientSampler.initialized) {
            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_2D, this.ambientSampler);
        }

        if (this.bumpSampler && this.bumpSampler.initialized) {
            gl.activeTexture(gl.TEXTURE3);
            gl.bindTexture(gl.TEXTURE_2D, this.bumpSampler);
        }

        if (this.nsSampler && this.nsSampler.initialized) {
            gl.activeTexture(gl.TEXTURE4);
            gl.bindTexture(gl.TEXTURE_2D, this.nsSampler);
        }

        if (this.naSampler && this.naSampler.initialized) {
            gl.activeTexture(gl.TEXTURE5);
            gl.bindTexture(gl.TEXTURE_2D, this.naSampler);
        }

    };

    OBJModel.prototype.destroy = function (gl) {
        //delete any GL_BUFFERs
        this.vertexBuffer = gl.deleteBuffer(this.vertexBuffer);
        this.indexBuffer = gl.deleteBuffer(this.indexBuffer);

        //delete any GL_TEXTURES
        this.difuseSampler = gl.deleteTexture(this.difuseSampler);
        this.specularSampler = gl.deleteTexture(this.specularSampler);
        this.ambientSampler = gl.deleteTexture(this.ambientSampler);
        this.bumpSampler = gl.deleteTexture(this.bumpSampler);
        this.nsSampler = gl.deleteTexture(this.nsSampler);
        this.naSampler = gl.deleteTexture(this.naSampler);

    };

    OBJModel.prototype.draw = function (gl, drawMode) {
        drawMode || (drawMode = gl.TRIANGLES);

        if (this.indexedDraw)
            gl.drawElements(drawMode, this.numIndexs, this.indexUnpackFormat, 0);
        else
            gl.drawArrays(drawMode, 0, this.numVertexs);

    };

    OBJModel.prototype.drawObject = function (gl, index) {
        drawMode || (drawMode = gl.TRIANGLES);

        var object = null;

        if (index >= 0 && index < this.objects.length) {
            object = this.objects[index];

            if (object.indexedDraw)
                gl.drawElements(drawMode, object.numIndexs, this.indexUnpackFormat, object.initialIndex);
            else
                gl.drawArrays(drawMode, object.initialVertex, object.numVertexs);
        }
    };


    function Rectangle(x, y, width, height) {
        this.x = x || 0;
        this.y = y || 0;
        this.width = width || 0;
        this.height = height || 0;
    }

    function SamplerBuilder() {}

    SamplerBuilder.prototype.debug = false;

    SamplerBuilder.prototype.errors = true;

    SamplerBuilder.prototype.priorizeArea = true;

    SamplerBuilder.prototype.createNewSampler = function (gl, maxSize, useMipmap) {

        maxSize || (maxSize = 4096);

        var workSampler = new Object();

        workSampler.self = this;
        workSampler.gl = gl;
        workSampler.build = false;
        workSampler.uploadImages = 0;
        workSampler.maxSize = maxSize;
        workSampler.useMipmap = useMipmap;

        //sampler GL_TEXTURE
        workSampler.sampler = gl.createTexture();
        workSampler.sampler.initialized = false;

        //sampler resources
        workSampler.rectangles = new Array(1);
        workSampler.images = new Array();

        return workSampler;
    };

    SamplerBuilder.prototype.addSamplerImage = function (workSampler, samplerImagePath) {
        var length = workSampler.images.length;
        var self = workSampler.self;
        var image = null;

        //search if exist this image on sampler
        for (var i = 0; image === null && i < length; i++) {
            if (workSampler.images[i].url === samplerImagePath) {
                image = workSampler.images[i];
            }
        }

        //if dont exist craete and process new image
        if (image === null) {
            workSampler.uploadImages++;
            image = new Image() || document.createElement('img');

            image.onerror = function () {
                !this.errors || console.error('Don\'t loaded image on URL: ' + image.src);

                //update image state
                workSampler.uploadImages--;
                image.loaded = false;

                //try to execute sampler build if any images has been loadeds
                if (workSampler.build && workSampler.uploadImages === 0)
                    self.storeSamplerTextures(workSampler);

            };

            image.onload = function () {
                !this.debug || console.log('Loaded image on URL: ' + image.src);

                //update image state
                workSampler.uploadImages--;
                image.loaded = true;

                //try to execute sampler build if any images has been loadeds
                if (workSampler.build && workSampler.uploadImages === 0)
                    self.storeSamplerTextures(workSampler);
            };

            //define image work values
            image.samplerMatrix = new Float32Array(9);
            image.url = samplerImagePath;
            image.src = samplerImagePath;

            workSampler.images[length] = image;
        }

        return image;
    };

    SamplerBuilder.prototype.buildSampler = function (workSampler) {

        workSampler.build = true;

        if (workSampler.uploadImages === 0 && workSampler.images.length > 0)
            this.storeSamplerTextures(workSampler);

    };

    SamplerBuilder.prototype.getRectangle = function (rectangles, rectangleR) {

        var length = rectangles.length;

        var rectangleA = null;
        var rectangleB = null;
        var rectangleT = null;

        var restW = 0, restH = 0;

        var rectangleArea = 0;
        var rectangleRigth = 0;
        var rectangleUp = 0;

        var minorArea = 0;
        var minorRigth = 0;
        var minorUp = 0;

        var hasMinorRigth = false;
        var hasMinorUp = false;

        var reducedVerticaly = false;
        var indexA = -1;

        //search a minor rectangle witch avaliable space
        for (var i = 0; i < length; i++) {
            rectangleT = rectangles[i];

            //compute unused space betwen two rectangles 
            restW = rectangleT.width - rectangleR.width;
            restH = rectangleT.height - rectangleR.height;

            //compute comparables values
            rectangleArea = rectangleT.width * rectangleT.height;
            rectangleRigth = rectangleT.x + rectangleR.width;
            rectangleUp = rectangleT.y + rectangleR.height;

            //select rectangle if have required space and is ocuping a minor space but not zero space
            if (rectangleArea > 0 && restW >= 0 && restH >= 0) {

                //if is first candidate directly is asigned
                if (rectangleA === null) {

                    //update minor bounds values
                    minorRigth = rectangleRigth;
                    minorUp = rectangleUp;
                    minorArea = rectangleArea;

                    //define used rectangle to store
                    rectangleA = rectangleT;
                    indexA = i;

                } else if (this.priorizeArea) {

                    //use rectangle if is a minor avaliable space or exactly
                    if (restW + restH === 0) {
                        rectangleA = rectangleT;
                        indexA = i;
                        minorArea = -1;

                    } else {

                        //compare and update minor area value
                        if (rectangleArea < minorArea) {
                            minorArea = rectangleArea;
                            rectangleA = rectangleT;
                            indexA = i;

                        }
                    }

                } else {

                    //compare and update minor values
                    hasMinorRigth = rectangleRigth < minorRigth;
                    hasMinorUp = rectangleUp < minorUp;

                    //use rectangle if is a minor bounds coords
                    if (hasMinorRigth && hasMinorUp) {

                        //update minor bounds values
                        minorRigth = rectangleRigth;
                        minorUp = rectangleUp;

                        //define used rectangle to store
                        rectangleA = rectangleT;
                        indexA = i;

                    } else if (hasMinorUp || hasMinorRigth) {

                        //compare and update minor arae value (secandary critery)
                        if (rectangleArea < minorArea) {

                            //update minor area value
                            minorArea = rectangleArea;

                            //update minor bounds values
                            if (hasMinorRigth)
                                minorRigth = rectangleRigth;
                            else
                                minorUp = rectangleUp;

                            rectangleA = rectangleT;
                            indexA = i;

                        }

                    } else {
                        ;
                    }

                } //end else compare bounds

            }   //end if avaliable space

        }   //end for

        if (rectangleA) {

            //compute unused space betwen two rectangles 
            restW = rectangleA.width - rectangleR.width;
            restH = rectangleA.height - rectangleR.height;

            //send coordinates to use rectangle A space
            rectangleR.x = rectangleA.x;
            rectangleR.y = rectangleA.y;

            //update reduced size of rectangleA
            if (restW + restH === 0) {

                rectangleA.width = 0;
                rectangleA.height = 0;

            } else {

                //save rectangle state
                rectangleT = rectangleA;
                reducedVerticaly = restW <= restH;

                //create a HORIZONTAL RECTANGLE
                rectangleA = new Rectangle();
                rectangleA.x = rectangleT.x;
                rectangleA.y = rectangleT.y + rectangleR.height;
                rectangleA.width = reducedVerticaly ? rectangleT.width : rectangleR.width;
                rectangleA.height = restH;

                //store HORIZONTAL RECTANGLE (OVERRIDING FATHER INDEX)
                rectangles[indexA] = rectangleA;

                //create a VERTICAL RECTANGLE
                if (restH > 0) {
                    rectangleB = new Rectangle();
                    rectangleB.x = rectangleT.x + rectangleR.width;
                    rectangleB.y = rectangleT.y;
                    rectangleB.width = restW;
                    rectangleB.height = reducedVerticaly ? rectangleR.height : rectangleT.height;

                    //store a VERTICAL RECTANGLE (PUSH NEW RECTANGLE)
                    rectangles[length] = rectangleB;
                }

            }   //end if exist residual size

        } else {
            //define response rectangle as null because do not exist required space
            rectangleR = null;

        }

        return rectangleR;
    };

    SamplerBuilder.prototype.getNexPow2 = function (number) {
        var value = 1;

        while (value < number) {
            value *= 2;
        }

        return value;
    };

    SamplerBuilder.prototype.storeSamplerTextures = function (workSampler) {

        var gl = workSampler.gl;

        var images = workSampler.images;
        var numImages = workSampler.images.length;
        var image = null;

        var area = 0;
        var maxArea = 0;
        var maxIndex = 0;

        var rectangleImage = null;
        var rectangleRigth = 0;
        var rectangleUp = 0;

        var samplerWidth = 0;
        var samplerHeight = 0;

        //build sampler rectangle
        workSampler.length = 0;
        workSampler.rectangles[0] = new Rectangle(0, 0, workSampler.maxSize, workSampler.maxSize);

        //sort images array by areas
        for (var i = 0; i < numImages; i++) {
            image = images[i];
            maxArea = image.width * image.height;
            maxIndex = i;

            for (var j = i + 1; j < numImages; j++) {
                image = images[j];
                area = image.width * image.height;

                //compare area
                if (area > maxArea) {
                    maxIndex = j;
                    maxArea = area;

                }

            }

            //interchange positions and (define area value)
            image = images[maxIndex];
            image.area = image.width * image.height;
            images[maxIndex] = images[i];
            images[i] = image;

            //get a image rectangle to store on smapler
            rectangleImage = new Rectangle(0, 0, image.width, image.height);
            if (image.loaded === true) {
                rectangleImage = this.getRectangle(workSampler.rectangles, rectangleImage);

                if (rectangleImage !== null) {
                    rectangleRigth = rectangleImage.x + rectangleImage.width;
                    rectangleUp = rectangleImage.y + rectangleImage.height;

                    //update sampler teture width
                    if (rectangleRigth > samplerWidth)
                        samplerWidth = rectangleRigth;

                    //update sampler texture height
                    if (rectangleUp > samplerHeight)
                        samplerHeight = rectangleUp;

                }

                image.rectangleImage = rectangleImage;
            }

        }

        //ajust texture size to use mipmap
        if (workSampler.useMipmap) {
            samplerWidth = this.getNexPow2(samplerWidth);
            samplerHeight = this.getNexPow2(samplerHeight);
        }

        //define sampler dimensions
        workSampler.width = samplerWidth;
        workSampler.height = samplerHeight;
        workSampler.sampler.width = samplerWidth;
        workSampler.sampler.height = samplerHeight;
        workSampler.sampler.initialized = true;

        //enable texture and framebuffer
        gl.bindTexture(gl.TEXTURE_2D, workSampler.sampler);

        //define sampler size
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, samplerWidth, samplerHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

        //store images on texture
        for (var i = 0; i < numImages; i++) {
            image = images[i];
            rectangleImage = image.rectangleImage;

            if (image.loaded && rectangleImage) {

                //store image data on sampler if exist space
                gl.texSubImage2D(gl.TEXTURE_2D, 0, rectangleImage.x, rectangleImage.y, gl.RGBA, gl.UNSIGNED_BYTE, image);

                //compute sampler matrix
                image.samplerMatrix[0] = rectangleImage.width / workSampler.width;
                image.samplerMatrix[4] = rectangleImage.height / workSampler.height;
                image.samplerMatrix[6] = rectangleImage.x / workSampler.width;
                image.samplerMatrix[7] = rectangleImage.y / workSampler.height;
                image.samplerMatrix[8] = 1.0;

                !this.debug || console.log('\tLoaded and Stored image data from URL: ' + image.src + ' , x:' + rectangleImage.x + ', y: ' + rectangleImage.y + ', width: ' + rectangleImage.width + ' , height: ' + rectangleImage.height + ' }');

            } else if (image.loaded) {
                !this.errors || console.error('\tNot required space fron image on URL: ' + image.src + ' , width: ' + image.width + ' , height: ' + image.height);
                console.log(image);

            } else {
                !this.errors || console.error('\tNot loaded image on URL: ' + image.src);

            }
        }   //end for

        //set texture parameters
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        //select mignification filter
        if (workSampler.useMipmap) {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
            gl.generateMipmap(gl.TEXTURE_2D);

        } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        }


        gl.bindTexture(gl.TEXTURE_2D, null);
    };

    function XHRStatus() {}

    XHRStatus.OK = 200;
    XHRStatus.CREATED = 201;
    XHRStatus.ACEPTED = 202;
    XHRStatus.MOVED_PERMANENTLY = 301;
    XHRStatus.BAD_REQUEST = 400;
    XHRStatus.UNAUTHORIZED = 401;
    XHRStatus.PAIMENT_REQUIRED = 402;
    XHRStatus.FORVIDDEN = 403;
    XHRStatus.NOT_FOUND = 404;
    XHRStatus.METHOOD_NOT_ALLOWED = 405;
    XHRStatus.INTERNAL_SERVER_ERROR = 500;
    XHRStatus.NOT_INPLEMENTED = 501;

})();



