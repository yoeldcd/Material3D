
/*  @author Yoel david Correa Duke
 *  @version 1.0.0
 *  @date 23/8/2020
 *  
 *  @description
 *  OBJModel loader is an utility to import models
 *  on Wavefront format to use in WebGL. This tool 
 *  provide one group of configurations to adapt witch
 *  others tool's. This is more optimized using best 
 *  develop practices.
 *  
 */

if (!window.M3D) {
    window.M3D = {};
    window.M3D.Model = new Function();
    window.M3D.Model.Instance = new Function();
    window.M3D.Model.Material = new Function();

}

var OBJModelLoader = {};

(function () {
    var identityMatrix = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

    var OBJGeneratedModelID = 62671000;
    var OBJGeneratedInstanceID = 62671000;

    function Rectangle(x, y, w, h) {
        this.x = x || 0;
        this.y = y || 0;
        this.width = w || 0;
        this.height = h || 0;
    }

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

    //Model Loader
    ////////////////////////////////////////////////////////////////////////////

    /**Class instance constants**/
    /** @description Describe when use ELEMENT_ARRAY_BUFFER to represent poligons */
    OBJModelLoader.INDEXED_POLIGONAL_FACES = 62671;

    /** @description Describe when use VERTEX_ARRAY_BUFFER to represent poligons */
    OBJModelLoader.NOT_INDEXED_POLIGONAL_FACES = 62672;

    /** @description Describe when use loaded normal vectors { if dont exist normal vector it is computed } */
    OBJModelLoader.USE_LOADED_NORMAL = 62673;

    /** @description Describe when use only computed normal vector */
    OBJModelLoader.USE_COMPUTED_NORMAL = 62674;

    /** @description Default render shader program use to draw model { use is optinal } */
    OBJModelLoader.RENDER_SHADER = null;

    /**Class instance properties**/
    /** @description Define methood to get geometry normal vectors */
    OBJModelLoader.vertexNormalMode = OBJModelLoader.USE_LOADED_NORMAL;

    /** @description Define if store poligons usin elements index or vetex array */
    OBJModelLoader.poligonUmpackMode = OBJModelLoader.INDEXED_POLIGONAL_FACES;

    /** @description Define if separe sub geometrys of model { cases: o, g } */
    OBJModelLoader.importAsOBJObjectsGroups = true;

    /** @description Default used difuse R G B normaized color { default: white } */
    OBJModelLoader.defaultColor = {
        red: 1, green: 1, blue: 1
    };

    /** @description Define max width and height of generated super sampler texture  */
    OBJModelLoader.maxSamplerSize = 4096;

    /** @description Define if has used mipmaping to store super samler texture */
    OBJModelLoader.useSamplerMipmap = true;

    /** @description Define if has stored geometry normal vectors on model data */
    OBJModelLoader.storeVertexNormal = true;

    /** @description Define if has stored geometry texel coordinates on model data */
    OBJModelLoader.storeVertexTexCoords = true;

    /** @description Define if has stored geometry vertex meta-info on model data */
    OBJModelLoader.storeVertexMetadata = true;

    /** @description Define if has stored geometry vertex colors on model data */
    OBJModelLoader.storeVertexColor = false;

    /** @description Define if has imported or generated difuse map sampler texture */
    OBJModelLoader.storeDifuseMap = true;

    /** @description Define if has imported or generated specular map sampler texture */
    OBJModelLoader.storeSpecularMap = false;

    /** @description Define if has imported or generated ambient map sampler texture */
    OBJModelLoader.storeAmbientMap = false;

    /** @description Define if has imported or generated normal bump map sampler texture */
    OBJModelLoader.storeBumpMap = false;

    /** @description Define if has imported or generated specularity map sampler texture */
    OBJModelLoader.storeNsMap = false;

    /** @description Define if has imported or generated ambient radiosity map sampler texture */
    OBJModelLoader.storeNaMap = false;

    /** @description Define if take Y or Z by Up model axis { Blender default up axis is Z } */
    OBJModelLoader.invertZtoYAxis = false;

    /** @description Define if has retained array buffer data on model { Require more memory } */
    OBJModelLoader.preserveBufferData = false;

    /** @description Define if load sychronize or unsyncronized model resoures from network */
    OBJModelLoader.requestAsync = false;

    /** @description Define used USER_NAME of network request's */
    OBJModelLoader.requestUser = null;

    /** @description Define used PASSWORD of network request's */
    OBJModelLoader.requestPassword = null;

    /**
     * @description
     * This callback has called when resources of model has sussesfully loaded
     * 
     * @param: M3D.Model model
     * @param: Object responseID
     */
    OBJModelLoader.onload = null;

    /**
     * @description
     * This callback has called when resources of model has not sussesfully loaded
     * 
     * @param: Object responseID
     * @param: String url
     */
    OBJModelLoader.onerror = null;

    /** @description define if has or not showed process steep's stadistics*/
    OBJModelLoader.showStats = true;

    /**
     * @description
     * Load a OBJ file from received url and make one renderable OBJModel.
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
     * @returns {null | OBJModelLoader.Model @extends M3D.Model}
     */
    OBJModelLoader.loadOBJFile = function (gl, url, scale, responseID) {

        var async = this.requestAsync;
        var user = this.requestUser;
        var password = this.requestPassword;

        var responseCallback = this.onload;
        var errorCallback = this.onerror || this.onload;

        var self = this;
        var timerID = 'Loading model on url ' + url + ' ';

        //get file request settings
        var fileInfo = this.parseFileInfo(url);
        fileInfo.async = async;
        fileInfo.user = user;
        fileInfo.password = password;

        //make HXR object
        var XHR = new XMLHttpRequest();
        var response = null;

        XHR.onload = function () {
            console.timeEnd(timerID);

            // make workGroup and parse file model data
            var workGroup = self.createNewWorkGroup(gl, fileInfo, this.responseText, scale);
            OBJModelLoader.parseOBJText(gl, null, 1.0, workGroup);
            OBJModelLoader.buildOBJModel(workGroup);

            // get responsed model and asign source file information
            response = workGroup.model;
            response.srcFile = fileInfo;

            responseCallback && responseCallback(response, responseID);
        };

        XHR.onerror = function () {
            console.timeEnd(timerID);
            console.error('ERROR: Loading OBJ Data');

            response = null;
            errorCallback && errorCallback(responseID, url);
        };

        //initialize time counter
        console.time(timerID);

        //perform request
        XHR.open('GET', url, async, user, password);

        //send request
        XHR.send(null);

        return response;
    };

    /**
     * @description
     * Load a group of obj file's on received url's and join on one renderable OBJModel
     * 
     * @param {WebGLRenderingContext} gl
     * @param {String} urls
     * @param {Number} scale @default 1.0
     * @param {Object} responseID
     * @returns {null | OBJModelLoader.OBJModel}
     */
    OBJModelLoader.loadOBJFilesGroup = function (gl, urls, scale, responseID) {

        var url = null;
        var index = 1;
        var length = urls.length;

        var timerID = null;

        var XHR;
        var fileInfo;
        var fileText;

        var workGroup = OBJModelLoader.createNewWorkGroup(gl, {}, "", scale);
        var responseCallback = OBJModelLoader.onload;
        var model = null;

        if (!OBJModelLoader.requestAsync) {

            XHR = new XMLHttpRequest();

            //create and configure workGroup
            workGroup = OBJModelLoader.createNewWorkGroup(gl, {}, "", scale);

            // change to required states
            workGroup.loadOBJObjects = false;
            workGroup.requestAsync = false;

            for (index = 0; index < length; index++) {
                url = urls[index];

                timerID = 'Loading model on url ' + url + ' ';
                console.time(timerID);

                //open sysncronous conection
                XHR.open('GET', url, true, OBJModelLoader.requestUser, OBJModelLoader.requestPassword);
                XHR.send(null);

                if (XHR.status === XHRStatus.SUSSCESS) {
                    console.timeEnd(timerID);

                    fileInfo = OBJModelLoader.parseFileInfo(url);
                    fileText = XHR.responseText;

                    //add geometry data to model
                    OBJModelLoader.resetWorkGroup(workGroup, fileInfo, fileText);
                    OBJModelLoader.parseOBJText(null, null, scale, workGroup);

                    //store file OBJObject
                    if (workGroup.currentObject)
                        OBJModelLoader.saveOBJObject(workGroup, workGroup.currentObject);

                } else {
                    console.timeEnd(timerID);
                    console.error('ERROR loading OBJ File: ' + url);
                }

            }

            //store model
            OBJModelLoader.buildOBJModel(workGroup);

            // get response model and asign source file information
            model = workGroup.model;
            model.srcFile = urls;

        }

        //execute load event handler
        responseCallback && responseCallback(model, responseID);

        return model;
    };

    /**
     * @description
     * Parse received text to renderale OBJModel and store model data on workGroup
     * 
     * @param {WebGLRenderingContext} gl
     * @param {String} sourceOBJText
     * @param {Number} scale @default 1.0
     * @param {Object} workGroup
     * @returns {Object | OBJModelLoader.OBJModel}
     */
    OBJModelLoader.parseOBJText = function (gl, sourceOBJText, scale, workGroup) {

        if (!workGroup)
            workGroup = this.createNewWorkGroup(gl, {/* NOT FIle Info */}, sourceOBJText, scale);

        var lines = workGroup.textLines;
        var linesNumber = lines.length;
        var lineWords = null;

        //initialize parsing time counter
        console.time('Parsing Time');

        //parse each lines of source text
        for (var i = 0; i < linesNumber; i++) {
            lineWords = this.getLineWords(lines[i]);

            //discart empty or unvalids lines lines
            if (lineWords.length > 1)
                this.parseOBJLine(workGroup, lineWords);

        }

        console.timeEnd('Parsing Time');

        return workGroup.model;
    };

    /**
     * @description
     * Make a new work group to store parsed model data and resources
     * 
     * @param {WebGLRenderingContext} gl
     * @param {Object} fileInfo
     * @param {String} sourceText
     * @param {Number} scale
     * @returns { Object }
     */
    OBJModelLoader.createNewWorkGroup = function (gl, fileInfo, sourceText, scale) {

        var workGroup = new Object();

        //self references
        workGroup.gl = gl;
        workGroup.self = this;
        workGroup.scale = scale || 1;

        //source properties from (file or default)
        workGroup.rootPath = fileInfo.root || '';
        workGroup.fileName = fileInfo.name || 'unamed';
        workGroup.requestAsync = fileInfo.async || OBJModelLoader.requestAsync;
        workGroup.requestUser = fileInfo.user || OBJModelLoader.requestUser;
        workGroup.requestPassword = fileInfo.password || OBJModelLoader.requestPassword;

        //source data properties from (file or default)
        workGroup.textLines = sourceText.split('\n');
        workGroup.lastCommand = '';

        //select required geometry data
        workGroup.storeVertexNormal = OBJModelLoader.storeVertexNormal;
        workGroup.storeVertexTexCoords = OBJModelLoader.storeVertexTexCoords;
        workGroup.storeVertexColor = OBJModelLoader.storeVertexColor;
        workGroup.storeVertexMetadata = OBJModelLoader.storeVertexMetadata;
        workGroup.preserveBufferData = OBJModelLoader.preserveBufferData;

        //select geometry data load mode
        workGroup.useIndexedFaces = OBJModelLoader.poligonUmpackMode === OBJModelLoader.INDEXED_POLIGONAL_FACES;
        workGroup.useComputedNormals = OBJModelLoader.vertexNormalMode === OBJModelLoader.USE_COMPUTED_NORMAL;
        workGroup.loadOBJObjects = OBJModelLoader.importAsOBJObjectsGroups;
        workGroup.invertZtoYAxis = OBJModelLoader.invertZtoYAxis;

        //create loaded geometry data storage array's
        workGroup.loadedVertexCoords = new Array();
        workGroup.numLoadedVertexCoords = 0;

        workGroup.loadedVertexNormals = new Array();
        workGroup.numLoadedVertexNormals = 0;

        workGroup.loadedVertexTexCoords = new Array();
        workGroup.numLoadedVertexTexCoords = 0;

        //create output buffer data array
        workGroup.vertexBuffer = new Array();
        workGroup.numVertexs = 0;

        workGroup.indexBuffer = new Array();
        workGroup.numIndexs = 0;

        //create required's samplers textures
        if (OBJModelLoader.storeDifuseMap)
            workGroup.difuseSampler = OBJModelLoader.SamplerBuilder.createNewSampler(gl, this.maxSamplerSize, this.useSamplerMipmap);

        if (OBJModelLoader.storeSpecularMap)
            workGroup.specularSampler = OBJModelLoader.SamplerBuilder.createNewSampler(gl, this.maxSamplerSize, this.useSamplerMipmap);

        if (OBJModelLoader.storeAmbientMap)
            workGroup.ambientSampler = OBJModelLoader.SamplerBuilder.createNewSampler(gl, this.maxSamplerSize, this.useSamplerMipmap);

        if (OBJModelLoader.storeBumpMap)
            workGroup.bumpSampler = OBJModelLoader.SamplerBuilder.createNewSampler(gl, this.maxSamplerSize, this.useSamplerMipmap);

        if (OBJModelLoader.storeNsMap)
            workGroup.nsSampler = OBJModelLoader.SamplerBuilder.createNewSampler(gl, this.maxSamplerSize, this.useSamplerMipmap);

        if (OBJModelLoader.storeNaMap)
            workGroup.naSampler = OBJModelLoader.SamplerBuilder.createNewSampler(gl, this.maxSamplerSize, this.useSamplerMipmap);

        //define used resources from model
        workGroup.importedMTLLibraries = new Array(0);
        workGroup.materials = new Array(0);
        workGroup.objects = new Array(0);

        //define current working elements
        workGroup.currentMaterial = null;
        workGroup.currentObject = null;

        //import MTL library of equal model name on root
        if (fileInfo.name)
            this.importNewMTLLibrary(workGroup, fileInfo.name + '.mtl');

        //create objects cache for more performance
        workGroup.faceNormalVector = new Float32Array(3);
        workGroup.vertexsStructuresStorage = new Array(16);
        workGroup.indexedStructuresStorage = new Array(16);

        //initialize usables objects cache
        for (var i = 0; i < 16; i++) {
            workGroup.vertexsStructuresStorage[i] = {
                vertexCoords: new Float32Array(3),
                vertexNormal: new Float32Array(3),
                vertexTexCoords: new Float32Array(3)
            };
            workGroup.indexedStructuresStorage[i] = {
                vertexIndex: 0,
                texelIndex: 0,
                normalIndex: 0
            };

        }

        return workGroup;
    };

    /**
     * @description
     * Reset work group to default states to store more that one model parsed data
     * 
     * @param {Object} workGroup
     * @param {Object} fileInfo
     * @param {String} sourceText
     * @returns {Object | params.workGroup}
     */
    OBJModelLoader.resetWorkGroup = function (workGroup, fileInfo, sourceText) {

        //define new source file properties
        workGroup.fileURL = fileInfo.url || '';
        workGroup.rootPath = fileInfo.root || '';
        workGroup.fileName = fileInfo.name || 'unamed';

        //define new source file data
        workGroup.textLines = sourceText.split('\n');
        workGroup.lastCommand = '';

        //reset loaded geometry data storage array's
        workGroup.loadedVertexCoords = new Array();
        workGroup.numLoadedVertexCoords = 0;

        workGroup.loadedVertexNormals = new Array();
        workGroup.numLoadedVertexNormals = 0;

        workGroup.loadedVertexTexCoords = new Array();
        workGroup.numLoadedVertexTexCoords = 0;

        //import MTL library of equal model name on root
        if (fileInfo.name)
            this.importNewMTLLibrary(workGroup, fileInfo.name + '.mtl');

        //reset working elements
        workGroup.currentMaterial = null;
        workGroup.currentObject = null;

        return workGroup;
    };

    /**
     * @description
     * Return any words of received String separateds by space
     * discardting tabs \t or carry jumps \r
     * 
     * @param {String} srcLine
     * @returns {Array}
     */
    OBJModelLoader.getLineWords = function (srcLine) {
        var length = srcLine.length;
        var words = new Array();

        var character = '';
        var word = '';

        //parse each character of source string
        for (var i = 0; i < length; i++) {
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
    OBJModelLoader.joinLineWords = function (words, beginIndex, endIndex) {
        beginIndex !== undefined || (beginIndex = 0);
        endIndex !== undefined || (endIndex = words.length);

        var joinedLine = '';
        var lastWordIndex = endIndex - 1;

        //join any words starting be word on begin index
        for (var i = beginIndex; i < endIndex; i++) {
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
    OBJModelLoader.computeFaceNormal = function (p1, p2, p3, outputVector) {
        var length;

        //compute three face points diferenece
        var v0x = p1[0] - p2[0];
        var v0y = p1[1] - p2[1];
        var v0z = p1[2] - p2[2];

        var v1x = p3[0] - p2[0];
        var v1y = p3[1] - p2[1];
        var v1z = p3[2] - p2[2];

        //compute vectors values cross product
        var nx = v0y * v1z - v0z * v1y;
        var ny = v0z * v1x - v0x * v1z;
        var nz = v0x * v1y - v0y * v1x;

        //normalize vector values if is posible
        length = Math.sqrt(nx * nx + ny * ny + nz * nz);
        if (length !== 0) {
            nx /= length;
            ny /= length;
            nz /= length;
        }

        //invert vector values and store
        outputVector[0] = -nx;
        outputVector[1] = -ny;
        outputVector[2] = -nz;

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
    OBJModelLoader.parseFileInfo = function (url) {

        /*  Get path components separateds by '/' backSlash
         *  Exp: models/model_1/model_1.obj 
         *  --> [models, model_1, model_1.obj]
         */
        var words = url.split('/');
        var fileInfo;
        var root;
        var name;
        var extension;

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
     * Return integre value of received String or use default 
     * 
     * @param {String} value
     * @param {Number} defaultValue
     * @returns {Number}
     */
    OBJModelLoader.parseInt = function (value, defaultValue) {
        var number;
        return value !== undefined && !isNaN(number = parseInt(value)) ? number : defaultValue;
    };

    /**
     * @description
     * Return float value of received String or use default 
     * 
     * @param {String} value
     * @param {Number} defaultValue
     * @returns {Number}
     */
    OBJModelLoader.parseFloat = function (value, defaultValue) {
        var number;
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
    OBJModelLoader.parseByteScale = function (byteLength) {
        var integer;
        var decimal;
        var byteScale;

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
     * @description:
     * Get integer index's of specifics geometry vertex
     * estruct contained on one word of face declaration 
     * line. { f }
     * 
     * @example
     * vc1/[vn1]/[vt1]
     * 
     * {
     *  vertexIndex: vc 
     *  normalIndex  vn @optional
     *  texelIndex   vt @optional
     * }
     * 
     * @param {String} word
     * @param {Object} struct
     * @returns {Object | params.struct}
     */
    OBJModelLoader.parseIndexedStructure = function (word, struct) {

        var structFields = word.split('/');

        //parse one indexed struct (v, v/n/t , v//t , v/n)
        struct.vertexIndex = this.parseInt(structFields[0], NaN);
        struct.texelIndex = this.parseInt(structFields[1], NaN);
        struct.normalIndex = this.parseInt(structFields[2], NaN);

        return struct;
    };

    /**
     * @description
     * Execute line operation or command based on initial character
     * 
     * #  --> discarted commentary
     * o  --> begin new object
     * g  --> begin new sub geometry
     * 
     * v  --> store vertex coordinate data
     * vt --> store vertex tex coord data
     * vn --> store vertex normal vector data
     * f  --> store geometry poligonal face
     * 
     * mtllib --> require import new MLT material library
     * usemtl --> change current sub geometry MTL material
     * 
     * @param {Object} workGroup
     * @param {Array} words
     * @returns {undefined}
     */
    OBJModelLoader.parseOBJLine = function (workGroup, words) {
        var command = words[0];

        switch (command) {
            case 'v':
                this.storeLoadedVertexCoords(workGroup, words);

                break;

            case 'vn':
                this.storeLoadedVertexNormals(workGroup, words);

                break;

            case 'vt':
                this.storeLoadedVertexTexCoords(workGroup, words);

                break;

            case 'f':
                if (workGroup.lastCommand !== 'f') {

                    //update vertex stats to add faces
                    workGroup.numLoadedVertexCoords = workGroup.loadedVertexCoords.length / 3;
                    workGroup.numLoadedVertexNormals = workGroup.loadedVertexNormals.length / 3;
                    workGroup.numLoadedVertexTexCoords = workGroup.loadedVertexTexCoords.length / 2;

                    if (!workGroup.currentObject)
                        //create one default object
                        this.createNewOBJObject(workGroup, workGroup.fileName);

                    if (!workGroup.currentMaterial)
                        //use one default predefined material
                        this.useMTLMaterial(workGroup, 'default');

                }

                this.addFaceData(workGroup, words);
                break;

            case 'o': //object
            case 'g': //geometry
                if (workGroup.loadOBJObjects)
                    this.createNewOBJObject(workGroup, this.joinLineWords(words, 1));
                break;

            case 'mtllib':
                this.importNewMTLLibrary(workGroup, this.joinLineWords(words, 1));
                break;

            case 'usemtl':
                this.useMTLMaterial(workGroup, this.joinLineWords(words, 1));
                break;
                /*Default case commentary # is discarted*/
        }

        workGroup.lastCommand = command;
    };

    /**
     * @description
     * Save last sub geometry and begin new object 
     * state on workGroup. The new sub geometry
     * take a received String as name.
     * 
     * Initial state taked values: 
     * @property {Number} id            An unique id Number to identified object on MODEL
     * @property {String} name          Geometry declared name
     * @property {Number} initialIndex  Geometry first ELEMENT_ARRAY_BUFFER index
     * @property {Number} initialVertex Geometry first VERTEXS_ARRAY_BUFFER index
     * 
     * @param {Object} workGroup
     * @param {String} objectName
     * @returns {OBJModelLoader.OBJModel.OBJObject}
     */
    OBJModelLoader.createNewOBJObject = function (workGroup, objectName) {

        var object = workGroup.currentObject;

        if (object)
            //save last created object
            this.saveOBJObject(workGroup, object);

        //create the new object with initial state value
        object = new OBJModelLoader.OBJModel.OBJObject();
        object.id = workGroup.objects.length;
        object.name = objectName || 'object_' + object.id;
        object.initialIndex = workGroup.numIndexs;
        object.initialVertex = workGroup.numVertexs;

        //store new object on list
        workGroup.currentObject = object;

        return object;
    };

    /**
     * @description
     * Set end values of current sub geometry and store on workGroup
     * model metadata.
     * 
     * Final state taked values
     * @property {Number}  vertexsNumbers Number of elemnts added to VERTEXS_ARRAY_BUFFER after begin it state  
     * @property {Number}  indexsNumbers  Number of elemnts added to ELEMENTS_ARRAY_BUFFER after begin it state
     * @property {Boolean} indexedDraw    Define if use or not INDEXED_POLIGONAL_DRAW_METHOD to render sub model
     * @property {Object}  material       Define sub geometry material used
     * 
     * @param {Object} workGroup
     * @param {OBJModelLoader.OBJModel.OBJObject} object
     * @returns {OBJModelLoader.OBJModel.OBJObject}
     */
    OBJModelLoader.saveOBJObject = function (workGroup, object) {

        //define object end state values
        object.vertexsNumber = workGroup.numVertexs - object.initialVertex;
        object.indexsNumber = workGroup.numIndexs - object.initialIndex;
        object.indexedDraw = workGroup.numVertexs !== object.indexsNumber;
        object.material = workGroup.currentMaterial;

        //compute object geometry bounds center
        object.bounds.computeCenter();

        if (object.vertexsNumber > 0){
            //store a non empty OBJ object on objects {DICTIONARY}
            workGroup.objects[object.id] = object;
            workGroup.objects[object.name] = object;

        }

        return object;
    };

    /**
     * @description:
     * Add to loadedVertexCoords buffer, parsed & scaled vertex coordinates
     * values contained on one vertex declaration line { v }.
     * 
     * If inevertZtoYAxis is true invert Z and Y values of store vector
     * values.
     * 
     * @param {Object} workGroup
     * @param {Array} words
     * @returns {undefined}
     */
    OBJModelLoader.storeLoadedVertexCoords = function (workGroup, words) {
        var length = workGroup.loadedVertexCoords.length;
        var vx = this.parseFloat(words[1], 0.0) * workGroup.scale;
        var vy = this.parseFloat(words[2], 0.0) * workGroup.scale;
        var vz = this.parseFloat(words[3], 0.0) * workGroup.scale;
        var t;

        if (workGroup.invertZtoYAxis) {
            //compute inverted axis values
            t = vy;
            vy = vz;
            vz = -t;
        }

        //store vertex coords on dedicated storage array
        workGroup.loadedVertexCoords[length] = vx;
        workGroup.loadedVertexCoords[length + 1] = vy;
        workGroup.loadedVertexCoords[length + 2] = vz;
    };

    /**
     * @description:
     * Add to loadedVertexNormals buffer, parsed vertex normal direction
     * values contained on one vertex normal declaration line { vn }
     * 
     * If inevertZtoYAxis is true invert Z and Y values of store vector
     * values.
     * 
     * @param {Object} workGroup
     * @param {Array} words
     * @returns {undefined}
     */
    OBJModelLoader.storeLoadedVertexNormals = function (workGroup, words) {
        var length = workGroup.loadedVertexNormals.length;
        var nx = this.parseFloat(words[1], 0.0);
        var ny = this.parseFloat(words[2], 0.0);
        var nz = this.parseFloat(words[3], 0.0);
        var t;

        if (workGroup.invertZtoYAxis) {
            //compute inverted axis values
            t = ny;
            ny = nz;
            nz = -t;
        }

        //store vertex normal on dedicated storage array
        workGroup.loadedVertexNormals[length] = nx;
        workGroup.loadedVertexNormals[length + 1] = ny;
        workGroup.loadedVertexNormals[length + 2] = nz;
    };

    /**
     * @description:
     * Add to loadedVertexTexCoords buffer, parsed vertex texel coordinate
     * values contained on one vertex texel declaration line { vt }
     * 
     * @param {Object} workGroup
     * @param {Array} words
     * @returns {undefined}
     */
    OBJModelLoader.storeLoadedVertexTexCoords = function (workGroup, words) {
        var length = workGroup.loadedVertexTexCoords.length;
        var ts = this.parseFloat(words[1], 0.0);
        var tt = this.parseFloat(words[2], 0.0);

        //store vertex textel coords on dedicated storage array
        workGroup.loadedVertexTexCoords[length] = ts;
        workGroup.loadedVertexTexCoords[length + 1] = tt;
    };

    /**
     * @description
     * Get coordinates vector values of specified geometry vertex,
     * using specified element vertexIndex on loadedVertexCoords
     * Buffer.
     * Getted values are stored on outputVector array received.
     * 
     * Used stride of buffer is 3 elements.
     * 
     * Index can to be negative or positive number, when is zero
     * take default coordinates values of vector { 0, 0, 0 }.
     * 
     * CASE {POSITIVE} X index0 = index * 3;
     *                 Y index1 = index0 + 1;
     *                 Z index2 = index0 + 2;
     *                 
     * CASE {NEGATIVE} X index0 = (numBufferElements - abs(index)) * 3;
     *                 X index0 = (numBufferElements + index) * 3
     *                 Y index1 = index0 + 1;
     *                 Z index2 = index0 + 2;
     *                 
     * CASE {ZERO}     NON USED A INDEX
     * 
     * @param {Object} workGroup
     * @param {Number} index
     * @param {Array [3]} outputVector
     * @returns {Array | params.outputVector}
     */
    OBJModelLoader.getLoadedVertexCoords = function (workGroup, index, outputVector) {
        var vx, vy, vz;

        if (index > 0) {
            //use direct indexs methood
            index = (index - 1) * 3;

            vx = workGroup.loadedVertexCoords[index];
            vy = workGroup.loadedVertexCoords[index + 1];
            vz = workGroup.loadedVertexCoords[index + 2];

        } else if (index < 0) {
            //use indirect index methood
            //vertexsNumber - vetexIndexOffset
            index = (workGroup.numLoadedVertexCoords + index) * 3;

            vx = workGroup.loadedVertexCoords[index];
            vy = workGroup.loadedVertexCoords[index + 1];
            vz = workGroup.loadedVertexCoords[index + 2];

        } else {
            //use default values
            vx = 0;
            vy = 0;
            vz = 0;

        }

        workGroup.currentObject.bounds.update(vx, vy, vz);

        outputVector[0] = vx;
        outputVector[1] = vy;
        outputVector[2] = vz;

        return outputVector;
    };

    /**
     * @description
     * Get normal vector values of specified geometry vertex,
     * using specified element vertexIndex on loadedVertexNormals
     * Buffer.
     * Getted values are stored on outputVector array received.
     * 
     * Used stride of buffer is 3 elements.
     * 
     * Index can to be negative or positive number, when is zero
     * take values of vector received on normalVector.
     * 
     * CASE {POSITIVE} X index0 = index * 3;
     *                 Y index1 = index0 + 1;
     *                 Z index2 = index0 + 2;
     *                 
     * CASE {NEGATIVE} X index0 = (numBufferElements - abs(index)) * 3;
     *                 X index0 = (numBufferElements + index) * 3
     *                 Y index1 = index0 + 1;
     *                 Z index2 = index0 + 2;
     *                 
     * CASE {ZERO}     NON USED A INDEX
     * 
     * @param {Object} workGroup
     * @param {Number} index
     * @param {Array [3]} outputVector
     * @param {Array [3]} faceNormal 
     * @returns {Array | params.outputVector}
     */
    OBJModelLoader.getLoadedVertexNormal = function (workGroup, index, outputVector, faceNormal) {
        var nx, ny, nz;

        if (index > 0) {
            //use direct indexs methood
            index = (index - 1) * 3;

            nx = workGroup.loadedVertexNormals[index];
            ny = workGroup.loadedVertexNormals[index + 1];
            nz = workGroup.loadedVertexNormals[index + 2];

        } else if (index < 0) {
            //use indirect indexs methood
            //vertexsNumber - vetexIndexOffset
            index = (workGroup.numLoadedVertexNormals + index) * 3;

            nx = workGroup.loadedVertexNormals[index];
            ny = workGroup.loadedVertexNormals[index + 1];
            nz = workGroup.loadedVertexNormals[index + 2];

        } else {
            //use default values
            nx = faceNormal[0];
            ny = faceNormal[1];
            nz = faceNormal[2];

        }

        //store axis values
        outputVector[0] = nx;
        outputVector[1] = ny;
        outputVector[2] = nz;

        return outputVector;
    };

    /**
     * @description
     * Get texel coordinates vector values of specified geometry vertex,
     * using specified element vertexIndex on loadedVertexTextCoords
     * Buffer.
     * Getted values are stored on outputVector array received.
     * 
     * Used stride of buffer is 2 elements.
     * 
     * Index can to be negative or positive number, when is zero
     * take default coordinates values of vector { 0.5, 0.5}.
     * 
     * CASE {POSITIVE} S index0 = index * 2;
     *                 T index1 = index0 + 1;
     *                 
     * CASE {NEGATIVE} S index0 = (numBufferElements - abs(index)) * 2;
     *                 S index0 = (numBufferElements + index) * 2
     *                 T index1 = index0 + 1;
     *                 
     * CASE {ZERO}     NON USED A INDEX
     * 
     * @param {Object} workGroup
     * @param {Number} index
     * @param {Array [2]} outputVector
     * @returns {Array | params.outputVector}
     */
    OBJModelLoader.getLoadedVertexTexCoords = function (workGroup, index, outputVector) {
        var ts, tt;

        if (index > 0) {
            //use direct indexs methood
            index = (index - 1) * 2;

            ts = workGroup.loadedVertexTexCoords[index];
            tt = workGroup.loadedVertexTexCoords[index + 1];

        } else if (index < 0) {
            //use indirect indexs methood
            //vertexsNumber - vetexIndexOffset
            index = (workGroup.numLoadedVertexTexCoords + index) * 2;

            ts = workGroup.loadedVertexTexCoords[index];
            tt = workGroup.loadedVertexTexCoords[index + 1];

        } else {
            //use default values
            ts = 0.5;
            tt = 0.5;

        }

        outputVector[0] = ts;
        outputVector[1] = tt;

        return outputVector;
    };

    /**
     * @description
     * Take a face decalaration line {f} data and add poligonal face
     * model on geometry using declared poligon vertexs indexation 
     * method { INDEXED or NON_INDEXED POLIGONAL_FACE } to store it.
     * 
     * Here is computed faceNormal vector to use if has not exist vertex
     * normal element index on parsed face indexedStructures of line, or 
     * has configure to use computed values as default.
     * 
     * Any vertex vector's data are getted from buffers using inedexs of
     * indexedStructures getted's by face declaration line begin on second
     * word.
     * 
     * @param {Object} workGroup
     * @param {Array} words
     * @returns {undefined}
     */
    OBJModelLoader.addFaceData = function (workGroup, words) {
        var numPoints = words.length - 1;

        //get cache objects from workGroup
        var faceNormal = workGroup.faceNormalVector;
        var vertexStructures = workGroup.vertexsStructuresStorage;
        var indexedStructures = workGroup.indexedStructuresStorage;
        var vertexStructure;
        var indexedStructure;

        //parse each indexed structues of loaded face line
        for (var i = 0; i < numPoints; i++) {

            //get structs and objects from cache or instantiate a new on it
            indexedStructure = indexedStructures[i] || (indexedStructures[i] = {
                vertexIndex: 0,
                texelIndex: 0,
                normalIndex: 0
            });

            vertexStructure = vertexStructures[i] || (vertexStructures[i] = {
                vertexCoords: new Float32Array(3),
                vertexNormal: new Float32Array(3),
                vertexTexCoords: new Float32Array(3)
            });

            //get index data from line and tore on indexed structure
            this.parseIndexedStructure(words[i + 1], indexedStructure);

            //load stored vertex coords & vertex texCoord
            //and save onn vertex structure
            this.getLoadedVertexCoords(workGroup, indexedStructure.vertexIndex, vertexStructure.vertexCoords);
            this.getLoadedVertexTexCoords(workGroup, indexedStructure.texelIndex, vertexStructure.vertexTexCoords);

        }

        //compute face normal using three face vertexs
        this.computeFaceNormal(vertexStructures[0].vertexCoords, vertexStructures[1].vertexCoords, vertexStructures[2].vertexCoords, faceNormal);

        //apply vertex normal using selected method 
        if (!workGroup.useComputedNormals) {

            //use loaded values from vertex normal
            for (var i = 0; i < numPoints; i++) {
                this.getLoadedVertexNormal(workGroup, indexedStructures[i].normalIndex, vertexStructures[i].vertexNormal, faceNormal);
            }

        } else {

            //use computed values from vertex normal
            for (var i = 0; i < numPoints; i++) {
                vertexStructure = vertexStructures[i];
                vertexStructure.vertexNormal[0] = faceNormal[0];
                vertexStructure.vertexNormal[1] = faceNormal[1];
                vertexStructure.vertexNormal[2] = faceNormal[2];
            }

        }

        //store vertex data using poligon package methood
        if (workGroup.useIndexedFaces)
            this.addIndexedPoligonalFace(workGroup, numPoints, vertexStructures);
        else
            this.addNotIndexedPoligonalFace(workGroup, numPoints, vertexStructures);

    };

    /**
     *  @description:
     * Store geometry poligonal face data on buffers using 
     * INDEXED_POLIGONAL_FACE method. Index of vertex data
     * are received on one Array containing indexedStructures
     * of any vertex point of poligon.
     * 
     * This method write required vertexs data on geometry 
     * buffers acceding index by index to any points. And store
     * any poligon elements index requireds to represent it on
     * indexBufferArray.
     * 
     * indexBufferData:  Is write begin on position indexBufferData.length - 1
     * vertexBufferData: Is write begin on position vertexBufferData.length - 1
     *                   from any asociated buffer's data array's.
     * 
     * In case of poligonal faces of only three points, store
     * received index data from on a SINGLE_TRIANGLE in ordin
     * {0 1 2}.
     * 
     * IF added face have more of three points,  
     * cast to N triangles, the number of TIANGLES
     * is computed using next expresion:
     * 
     *      numTriangles = numPoints - 2
     * 
     * A number of indexs is a triple of this number
     * because one SINGLE TRIANGLE has three points.
     *      
     *      numIndexs = 3 * numTriangles
     *      
     * Generated triangles are makeds using next ordin:
     * 
     * i = 1;
     * 
     * while(i < numPoints - 1){
     *   triangle{0, i, i + 1}
     *   i++;
     * }
     * 
     * Exp: Quad [0 1 2 3] => TRIANGLE {0 1 2} + TRIANGLE {0 2 3}
     * 
     * Is stored on:
     * 
     * indexBuffer  [ i0 i1 i2 i0 i2 i3 ]   <- any i is a only one integer number 
     *                                         to reference one elementn on evertex
     *                                         buffers
     *                                         
     * vertexBuffer [v0 v1 v2 v3 ] * 3      <- any v is a group of 3 componets { x y z}
     * normalBuffer [n0 n1 n2 n3 ] * 3      <- any n is a group of 3 componets { nx ny nz}
     * texelBuffer  [t0 t1 t2 t3 ] * 2      <- any t is a group of 2 componets { s t }
     * size = 12 + 12 + 8 + 6 = 38
     * 
     * @Note To refer the real position of vertex on buffer 
     * and not the local poligon position, to index are added
     * current number of vertex on buffer, before to store. That
     * only affect poligon indexs storeds and has no effect on 
     * vertexs structure's data.
     * 
     * Exp: IF buffer has 24 vertexs and face indexs are { 0 1 2 3 }
     *      Real positions of vertexs used to represent poligonal face
     *      begin on 24 and continue by 25, 26 finishing on 27.    
     *      
     *      store on indexBuffer [ 24 25 26 24 25 27 ]
     *      
     * Any poligon/s triangles are stored on CCW direction
     * respect to Z coordinates axis.
     * 
     * @param {Object} workGroup
     * @param {Number} numPoints
     * @param {Array} vertexStructures
     * @returns {undefined}
     */
    OBJModelLoader.addIndexedPoligonalFace = function (workGroup, numPoints, vertexStructures) {

        var numVertexs = workGroup.numVertexs;
        var indexBufferArray = workGroup.indexBuffer;
        var indexsNumber = indexBufferArray.length;

        //store face vertexs on output buffer
        for (var i = 0; i < numPoints; i++) {
            this.storeVertexData(workGroup, vertexStructures[i]);
        }

        //update vertexs number on buffer
        workGroup.numVertexs += numPoints;

        //store computed face index on buffer (cast N side's poligon in triangles)
        for (var i = 1, arrayOffset = indexsNumber; i < numPoints - 1; i++) {
            indexBufferArray[arrayOffset] = numVertexs;
            indexBufferArray[arrayOffset + 1] = numVertexs + i;
            indexBufferArray[arrayOffset + 2] = numVertexs + i + 1;
            arrayOffset += 3;

        }

        //update indexs number on buffer
        workGroup.numIndexs += 3 * (numPoints - 2);


    };

    /* @description:
     * Store geometry poligonal face data on buffers using 
     * NON_INDEXED_POLIGONAL_FACE method. Index of vertex data
     * are received on one Array containing indexedStructures
     * of any vertex point of poligon.
     * 
     * This method write directly, vertex data on geometry 
     * buffers acceding index by index to any points and
     * stroing any poligon points vertex to represent it. 
     * When this method is used, indexBufferArray has discarted.
     * 
     * In case of poligonal faces of only three points, store
     * per vertex values using received index data from on a 
     * SINGLE_TRIANGLE in ordin. {0 1 2}.
     * 
     * IF added face have more of three points,  
     * cast to N triangles, the number of TRIANGLES
     * is computed using next expresion:
     * 
     *      numTriangles = numPoints - 2
     * 
     * A number of vertexs is a triple of this number
     * because one SINGLE TRIANGLE has three points.
     *      
     *      numVertexs = 3 * numTriangles
     *      
     * Generated triangles are makeds using next ordin:
     * 
     * i = 1;
     * 
     * while(i < numPoints - 1){
     *   triangle{0, i, i + 1}
     *   i++;
     * }
     * 
     * Exp: Quad [0 1 2 3] => TRIANGLE {v0 v1 v2} + TRIANGLE {v0 v2 v3}
     * 
     * Is stored on:
     * 
     * vertexBuffer [v0 v1 v2 v0 v2 v3 ] * 3    <- any v is a group of 3 componets { x y z}
     * normalBuffer [n0 n1 n2 n0 n2 n3 ] * 3    <- any n is a group of 3 componets { nx ny nz}
     * texelBuffer  [t0 t1 t2 t0 t2 t3 ] * 2    <- any t is a group of 2 componets { s t }
     * size = 18 + 18 + 12 = 48
     * 
     * Any poligon/s triangles are stored on CCW direction
     * respect to Z coordinates axis.
     * 
     * @param {Object} workGroup
     * @param {Number} numPoints
     * @param {Array} vertexStructures
     * @returns {undefined}
     */
    OBJModelLoader.addNotIndexedPoligonalFace = function (workGroup, numPoints, vertexStructures) {

        //store face vertexs on buffer (cast N side's poligon to triangles)
        for (var i = 1; i < numPoints - 1; i++) {
            this.storeVertexData(workGroup, vertexStructures[0]);
            this.storeVertexData(workGroup, vertexStructures[i]);
            this.storeVertexData(workGroup, vertexStructures[i + 1]);
        }

        //update vertexs number on buffer
        workGroup.numVertexs += 3 * (numPoints - 2);
    };

    /**
     * @description
     * Store vertex vectors data from received vertexStructure
     * on model geometry vertexBufferArray using next optional
     * insersion ordin, begin on index vertexBufferArray.length
     * 
     * 1 - 3 vertex coordinates components on {Array [3]} vertexStructure.vertexCoords
     * 2 - 3 vertex normal vector components on {Array [3]} vertexStructure.vertexNormal
     * 3 - 2 vertex texel coordinates components on {Array [2]} vertexStructure.vertexTexCoords
     * 4 - 2 vertex metadata values {Number} workGroup.currentObject.id 
     *                         AND  {Number} workGroup.currentMaterial.id
     * 
     * @param {type} workGroup
     * @param {type} vertexStructure
     * @returns {undefined}
     */
    OBJModelLoader.storeVertexData = function (workGroup, vertexStructure) {

        var vertexBufferArray = workGroup.vertexBuffer;
        var vertexBufferArrayLength = vertexBufferArray.length;

        //store geometry coordinates
        vertexBufferArray[vertexBufferArrayLength] = vertexStructure.vertexCoords[0];
        vertexBufferArray[vertexBufferArrayLength + 1] = vertexStructure.vertexCoords[1];
        vertexBufferArray[vertexBufferArrayLength + 2] = vertexStructure.vertexCoords[2];

        //store geometry normals
        if (workGroup.storeVertexNormal) {
            vertexBufferArray[vertexBufferArrayLength + 3] = vertexStructure.vertexNormal[0];
            vertexBufferArray[vertexBufferArrayLength + 4] = vertexStructure.vertexNormal[1];
            vertexBufferArray[vertexBufferArrayLength + 5] = vertexStructure.vertexNormal[2];
        }

        //store geometry texel coordinates
        if (workGroup.storeVertexTexCoords) {
            vertexBufferArray[vertexBufferArrayLength + 6] = vertexStructure.vertexTexCoords[0];
            vertexBufferArray[vertexBufferArrayLength + 7] = vertexStructure.vertexTexCoords[1];
        }

        //store geometry metadata
        if (workGroup.storeVertexMetadata | workGroup.storeVertexColor) {
            workGroup.vertexBuffer[vertexBufferArrayLength + 8] = workGroup.currentObject.id;
            workGroup.vertexBuffer[vertexBufferArrayLength + 9] = workGroup.currentMaterial.id;
        }

        //  [ ... | vx | vy | vz | nx | ny | nz | tx | ts | object_index | material_index | ... ]

    };

    /**MTL Parser Functions**/
    ////////////////////////////////////////////////////////////////////////////
    /** 
     * @description
     * Add one new element to imported MTL libraries URL list.
     * 
     * @param {Object} workGroup
     * @param {String} fileName
     * @returns {undefined}
     */
    OBJModelLoader.importNewMTLLibrary = function (workGroup, fileName) {

        var importedMTLLibraries = workGroup.importedMTLLibraries;
        var importedLibrariesNumber = importedMTLLibraries.length;
        var importedLibraryPath = workGroup.rootPath + '/' + fileName;

        var found = false;
        var i = 0;

        var importedLibraryPathInsencitive = importedLibraryPath.toLowerCase();

        //search for already imported MTL file (Case insencitive)
        while (!found && i < importedLibrariesNumber) {
            found = importedMTLLibraries[i].toLowerCase() === importedLibraryPathInsencitive;
            i++;
        }

        if (!found)
            //add URL Path of MTL librarie on importation list 
            importedMTLLibraries.push(importedLibraryPath);

    };

    /**
     * @description
     * Import any requireds MTL libraries using it URL 
     * on imported libraries list. Importation can be
     * execute synchronized or unsychronized. Task of
     * import and parse MTL File data is of functions 
     * set on MTL Parser module of OBJModelLoader.
     * 
     * @param {type} workGroup
     * @returns {undefined}
     */
    OBJModelLoader.loadImportedMTLLibraries = function (workGroup) {
        var importedLibraries = workGroup.importedMTLLibraries;
        var importedLibrariesNumber = importedLibraries.length;

        //load each MTL library
        for (var i = 0; i < importedLibrariesNumber; i++) {
            this.loadMTLFile(workGroup, importedLibraries[i]);
        }

    };

    /**
     * @description
     * Load MTL library data from defined resource file
     * on received URL. Request can be synchronized or 
     * unsynchronized at main thread.
     * 
     * IF MTL file on resource URL are not accesible,
     * the process throw an exception, and show one
     * error message on console describing situation. 
     * 
     * @param {Object} workGroup
     * @param {String} url
     * @returns {undefined}
     */
    OBJModelLoader.loadMTLFile = function (workGroup, url) {

        var self = this;
        var timerID = 'Loading MTL File on URL ' + url + ' ';

        var XHR = new XMLHttpRequest();
        var async = workGroup.requestAsync;

        XHR.onload = function () {
            console.timeEnd(timerID);
            self.parseMTLText(workGroup, this.responseText);

        };

        XHR.onerror = function () {
            var errorCode = this.status;
            console.timeEnd(timerID);
            console.error('ERROR: Loading MTL File: ' + url + '\nERROR CODE: ' + errorCode);

        };

        //initialize time counter
        console.time(timerID);

        //perform request
        XHR.open('GET', url, async, workGroup.requestUser, workGroup.requestPassword);

        //send request
        XHR.send(null);

    };

    /**
     * @description
     * Parse source text of one imported MTL library file
     * and generate describeds Materias. Here are imported
     * Image resources.
     * 
     * @param {type} workGroup
     * @param {type} sourceMTLText
     * @returns {undefined}
     */
    OBJModelLoader.parseMTLText = function (workGroup, sourceMTLText) {

        var MTLTextLines = sourceMTLText.split('\n');
        var MTLTextLinesNumber = MTLTextLines.length;
        var MTLTextLineWords;

        var newMTLMaterial;
        var currentMTLMaterial;

        //parse each lines on source
        for (var i = 0; i < MTLTextLinesNumber; i++) {
            MTLTextLineWords = this.getLineWords(MTLTextLines[i]);

            if (MTLTextLineWords.length > 1) {
                newMTLMaterial = this.parseMTLLine(workGroup, currentMTLMaterial, MTLTextLineWords);

                //redefined current material on edition
                if (newMTLMaterial) {
                    currentMTLMaterial = newMTLMaterial;
                }
            }

        }   //end for

    };

    /**
     * @description
     * Execute command or store value described on one line
     * of imported MTL library file.
     * 
     * newmtl --> Search one material on materials
     *            list using name on second word of
     *            imported text line.
     *            
     *            If material has not found one new material
     *            with default difuseColor, and described name
     *            is maked.
     *            
     * Kd --> store vector values with material { R G B } components of described difuse color
     * Ks --> store vector values with material { R G B } components of described specular color
     * Ka --> store vector values with material { R G B } components of described ambiental reflective color
     * 
     * Ns --> store specular reflectance value
     * Na --> store ambiental reflectance value 
     * d  --> store opacity or ditter transparence value
     * 
     * mapKd --> add image on defined URL to difuse superSamplerTexture
     * mapKs --> add image on defined URL to specular superSamplerTexture
     * mapKa --> add image on defined URL to ambient reflective superSamplerTexture
     * mapNs --> add image on defined URL to specular reflectance superSamplerTexture
     * mapNa --> add image on defined URL to ambient reflectance superSamplerTexture
     * mapBump --> add image on defined URL to normal displacement superSamplerTexture
     * 
     * Returned value is received or new generated material depending
     * if is executed one material generation operation { newmtl }
     * 
     * @param {Object} workGroup
     * @param {OBJModelLoader.Material} material
     * @param {Array} words
     * @returns {OBJModelLoader.Material}
     */
    OBJModelLoader.parseMTLLine = function (workGroup, material, words) {
        var newMaterial = null;
        var imageURL = null;
        var materialName;

        switch (words[0]) {
            case 'newmtl':
                materialName = this.joinLineWords(words, 1);
                newMaterial = this.searchMTLMaterial(workGroup, materialName) || this.createNewMTLMaterial(workGroup, materialName);

                break;

            case 'Kd':
                material.difuseColor.red = this.parseFloat(words[1], 1.0);
                material.difuseColor.green = this.parseFloat(words[2], 1.0);
                material.difuseColor.blue = this.parseFloat(words[3], 1.0);

                break;

            case 'Ks':
                material.specularColor.red = this.parseFloat(words[1], 1.0);
                material.specularColor.green = this.parseFloat(words[2], 1.0);
                material.specularColor.blue = this.parseFloat(words[3], 1.0);

                break;

            case 'Ka':
                material.ambientColor.red = this.parseFloat(words[1], 1.0);
                material.ambientColor.green = this.parseFloat(words[2], 1.0);
                material.ambientColor.blue = this.parseFloat(words[3], 1.0);

                break;

            case 'Ns':
                material.specularity = this.parseFloat(words[1], 100.0);

                break;

            case 'Na':
                material.ambientality = this.parseFloat(words[1], 100.0);

                break;

            case 'd':
                material.ditter = this.parseFloat(words[1], 0.0);

                break;

            case 'map_Kd':
                if (workGroup.difuseSampler) {
                    imageURL = workGroup.rootPath + '/' + this.joinLineWords(words, 1);
                    material.difuseMap = OBJModelLoader.SamplerBuilder.addSamplerImageByURL(workGroup.difuseSampler, imageURL).subSampler;

                }
                break;

            case 'map_Ks':
                if (workGroup.specularSampler) {
                    imageURL = workGroup.rootPath + '/' + this.joinLineWords(words, 1);
                    material.specularMap = OBJModelLoader.SamplerBuilder.addSamplerImageByURL(workGroup.specularSampler, imageURL).subSampler;

                }
                break;

            case 'map_Ka':
                if (workGroup.ambientSampler) {
                    imageURL = workGroup.rootPath + '/' + this.joinLineWords(words, 1);
                    material.ambientMap = OBJModelLoader.SamplerBuilder.addSamplerImageByURL(workGroup.ambientSampler, imageURL).subSampler;

                }
                break;

            case 'map_bump':
            case 'bump':
                if (workGroup.bumpSampler) {
                    imageURL = workGroup.rootPath + '/' + this.joinLineWords(words, 1);
                    material.bumpMap = OBJModelLoader.SamplerBuilder.addSamplerImageByURL(workGroup.bumpSampler, imageURL).subSampler;

                }
                break;

            case 'map_Ns':
                if (workGroup.nsSampler) {
                    imageURL = workGroup.rootPath + '/' + this.joinLineWords(words, 1);
                    material.specularityMap = OBJModelLoader.SamplerBuilder.addSamplerImageByURL(workGroup.nsSampler, imageURL).subSampler;

                }
                break;

            case 'map_Na':
                if (workGroup.naSampler) {
                    imageURL = workGroup.rootPath + '/' + this.joinLineWords(words, 1);
                    material.ambientalityMap = OBJModelLoader.SamplerBuilder.addSamplerImageByURL(workGroup.naSampler, imageURL).subSampler;
                }
                break;
        }

        return newMaterial;
    };

    /**
     * @description
     * Make new matrial and named using received String,
     * and assign one unique ID number. 
     * 
     * @param {Object} workGroup
     * @param {String} materialName
     * @returns {OBJModelLoader.Material}
     */
    OBJModelLoader.createNewMTLMaterial = function (workGroup, materialName) {

        var materialsList = workGroup.materials;
        var materialIndex = materialsList.length;
        var material;

        //create one new material
        material = new OBJModelLoader.Material(materialName || 'Material_' + materialIndex, this.defaultColor);
        material.id = materialIndex;

        //add to materials list array
        materialsList[materialIndex] = material;

        return material;
    };

    /**
     * @description
     * Search one material on materials list using 
     * received String name of required material.
     * If material has found returned value is the
     * material else response null.
     * 
     * @param {Object} workGroup
     * @param {String} materialName
     * @returns {null | OBJModelLoader.Material}
     */
    OBJModelLoader.searchMTLMaterial = function (workGroup, materialName) {

        var found = false;
        var index = 0;
        var length = workGroup.materials.length;

        //search named material
        while (!found && index < length) {

            if (workGroup.materials[index].name === materialName)
                found = true;

            index++;
        }

        return found ? workGroup.materials[index - 1] : null;
    };

    /**
     * @description
     * Select named material of materials list
     * and asign to current model sub geometry.
     * 
     * If material has not found is asigned one
     * new material maked with default difuseColor,
     * and received name.
     * 
     * @param {Object} workGroup
     * @param {String} materialName
     * @returns {undefined}
     */
    OBJModelLoader.useMTLMaterial = function (workGroup, materialName) {
        var material = workGroup.currentMaterial;

        if (!material || material.name !== materialName) {

            //search if exist named material
            material = this.searchMTLMaterial(workGroup, materialName);

            if (material === null)
                //create an new material if not found
                material = this.createNewMTLMaterial(workGroup, materialName);

            //define new used material
            workGroup.currentMaterial = material;

        }

    };

    /**OBJModel Build functions**/
    ////////////////////////////////////////////////////////////////////////////
    /**
     * @description 
     * Store buffers data on final output buffers to use
     * on WebGL to renderize model. In this steep are 
     * generated a one vertexBuffer, and optionally
     * one indexBuffer if is used INDEXED_POLIGONAL_FACES 
     * methood.
     * 
     * @param {Object} workGroup
     * @returns {undefined}
     */
    OBJModelLoader.storeBufferData = function (workGroup) {

        //save vertex buffer
        this.storeVertexBufferData(workGroup);

        if (workGroup.useIndexedFaces)
            //save index buffer (if is used indexed draw)
            this.storeIndexBufferData(workGroup);
        else
            //else clear buffer memory
            workGroup.indexBuffer = null;

    };

    /**
     * @description
     * 
     * Store vertexDataArray information on one
     * output WebGLBuffer of type ARRAY_BUFFER
     * to use on model renderization. Vertex data 
     * are stored on buffer using next insertion
     * ordin:
     *                  
     * Vertex array  per vertex stride on {e Number of elements} are computed:
     *      coords 3e  +  normals 3e + texels 2e + color OR metainf + 2e
     *      
     * Vertex buffer per vertex stride on {b Number of bytes} are computed:
     *      coords 12b +  normals 4b + texels 4b + color 4b + metainf 4b 
     * 
     * FOR_EACH: vertex
     *      required float32[3]  (12 bytes) vertex_coordinates    { coordX, coordY, coordZ }
     *      optional byte[4]     (4 bytes)  vertex_normal         { normalX, normalY, normalZ, 0 }
     *      optional uint16[2]   (4 bytes)  vertex_texel_coord    { texelS, texelT }
     *      optional byte[4]     (4 bytes)  vertex_color          { colorR, colorG, colorB, 0 }
     *      optional uint16[2]   (4 bytes)  vertex_metadata       { obj_index, material_index }
     * LOOP.
     * 
     * When send numbers on format integer of 8 or 16 bites
     * received on float a signed int value ranges betwen 
     * (- 2^7 to 2^7) and (- 2^15 to 2^15). From that you need
     * multiply float value by max absolute integer and later
     * normalize it.
     * 
     *
     * 
     * @param {Object} workGroup
     * @returns {undefined}
     */
    OBJModelLoader.storeVertexBufferData = function (workGroup) {

        var gl = workGroup.gl;
        var targetGLBuffer;
        var vertexGLBuffer;
        var vertexGLBufferAttribs = {};

        var vertexBufferArray = workGroup.vertexBuffer;
        var vertexBufferArrayOffset = 0;
        var vertexBufferArrayStride = 3;

        var vertexBufferArrayBuffer;
        var vertexBufferDataView;
        var vertexBufferDataViewOffset = 0;
        var vertexBufferDataViewStride = 0;

        var vertexsNumber = workGroup.numVertexs;
        var difuseColor;

        //delete residual and unnessessary memory
        workGroup.loadedVertexCoords = null;
        workGroup.loadedVertexNormals = null;
        workGroup.loadedVertexTexCoords = null;

        //compute (buffer and array) data alignement stride per vertex
        //and define attributes properties of stored buffer vertex 
        vertexGLBufferAttribs.coords = {offset: vertexBufferDataViewStride, type: gl.FLOAT, size: 3, normalized: false};
        vertexBufferDataViewStride += 12;

        if (workGroup.storeVertexNormal) {
            vertexGLBufferAttribs.normals = {offset: vertexBufferDataViewStride, type: gl.BYTE, size: 4, normalized: true};
            vertexBufferDataViewStride += 4;
            vertexBufferArrayStride += 3;
        }

        if (workGroup.storeVertexTexCoords) {
            vertexGLBufferAttribs.texels = {offset: vertexBufferDataViewStride, type: gl.UNSIGNED_SHORT, size: 2, normalized: true};
            vertexBufferDataViewStride += 4;
            vertexBufferArrayStride += 2;
        }

        if (workGroup.storeVertexMetadata | workGroup.storeVertexColor) {
            vertexBufferArrayStride += 2;

            if (workGroup.storeVertexColor) {
                vertexGLBufferAttribs.colors = {offset: vertexBufferDataViewStride, type: gl.UNSIGNED_BYTE, size: 4, normalized: true};
                vertexBufferDataViewStride += 4;
            }

            if (workGroup.storeVertexMetadata) {
                vertexGLBufferAttribs.metadata = {offset: vertexBufferDataViewStride, type: gl.UNSIGNED_SHORT, size: 2, normalized: false};
                vertexBufferDataViewStride += 4;
            }

        }

        //create an buffer Array to store vertex data
        vertexBufferArrayBuffer = new ArrayBuffer(vertexsNumber * vertexBufferDataViewStride);
        vertexBufferDataView = new DataView(vertexBufferArrayBuffer);

        //store buffer data
        for (var i = 0; i < vertexsNumber; i++) {
            vertexBufferDataViewOffset = vertexBufferDataViewStride * i;
            vertexBufferArrayOffset = vertexBufferArrayStride * i;

            //store vertex coords in first 3 groups of 4 bytes (12 bytes)
            vertexBufferDataView.setFloat32(vertexBufferDataViewOffset, vertexBufferArray[vertexBufferArrayOffset], true);
            vertexBufferDataView.setFloat32(vertexBufferDataViewOffset + 4, vertexBufferArray[vertexBufferArrayOffset + 1], true);
            vertexBufferDataView.setFloat32(vertexBufferDataViewOffset + 8, vertexBufferArray[vertexBufferArrayOffset + 2], true);
            vertexBufferDataViewOffset += 12;
            vertexBufferArrayOffset += 3;

            //store vertex normal in the next 4 bytes
            if (workGroup.storeVertexNormal) {
                vertexBufferDataView.setInt8(vertexBufferDataViewOffset, vertexBufferArray[vertexBufferArrayOffset] * 0x7F);
                vertexBufferDataView.setInt8(vertexBufferDataViewOffset + 1, vertexBufferArray[vertexBufferArrayOffset + 1] * 0x7F);
                vertexBufferDataView.setInt8(vertexBufferDataViewOffset + 2, vertexBufferArray[vertexBufferArrayOffset + 2] * 0x7F);
                vertexBufferDataView.setInt8(vertexBufferDataViewOffset + 3, 0);
                vertexBufferDataViewOffset += 4;
                vertexBufferArrayOffset += 3;

            }

            //store vertex texCoord in the next 2 groups of 2 bytes (4 bytes)
            if (workGroup.storeVertexTexCoords) {
                vertexBufferDataView.setUint16(vertexBufferDataViewOffset, vertexBufferArray[vertexBufferArrayOffset] * 0xFFFF, true);
                vertexBufferDataView.setUint16(vertexBufferDataViewOffset + 2, vertexBufferArray[vertexBufferArrayOffset + 1] * 0xFFFF, true);
                vertexBufferDataViewOffset += 4;
                vertexBufferArrayOffset += 2;

            }

            //store vertex color and/or metadata
            if (workGroup.storeVertexColor | workGroup.storeVertexMetadata) {

                //store color in next 4 bytes
                if (workGroup.storeVertexColor) {
                    difuseColor = workGroup.materials[vertexBufferArray[vertexBufferArrayOffset + 1]].Kd;

                    vertexBufferDataView.setUint8(vertexBufferDataViewOffset, difuseColor[0] * 0x7F);
                    vertexBufferDataView.setUint8(vertexBufferDataViewOffset + 1, difuseColor[1] * 0x7F);
                    vertexBufferDataView.setUint8(vertexBufferDataViewOffset + 2, difuseColor[2] * 0x7F);
                    vertexBufferDataView.setUint8(vertexBufferDataViewOffset + 3, 1.0 * 0x7F, true);
                    vertexBufferDataViewOffset += 4;

                }

                //store metadata in next 4 bytes
                if (workGroup.storeVertexMetadata) {
                    vertexBufferDataView.setUint16(vertexBufferDataViewOffset, vertexBufferArray[vertexBufferArrayOffset], true);
                    vertexBufferDataView.setUint16(vertexBufferDataViewOffset + 2, vertexBufferArray[vertexBufferArrayOffset + 1], true);
                    vertexBufferDataViewOffset += 4;

                }

                vertexBufferArrayOffset += 2;
            }

        }

        //save procesed data and clear unused memory
        workGroup.vertexBuffer = vertexBufferArrayBuffer;

        //create one GL_BUFFER to store geometry vertex data
        vertexGLBuffer = gl.createBuffer();
        targetGLBuffer = gl.ARRAY_BUFFER;

        //store vertex data on GL_BUFFER
        gl.bindBuffer(targetGLBuffer, vertexGLBuffer);
        gl.bufferData(targetGLBuffer, workGroup.vertexBuffer, gl.STATIC_DRAW);
        gl.bindBuffer(targetGLBuffer, null);

        //define buffer properties
        vertexGLBuffer.byteLength = vertexBufferArrayBuffer.byteLength;
        vertexGLBuffer.vertexsNumber = vertexsNumber;
        vertexGLBuffer.vertexStride = vertexBufferDataViewStride;
        vertexGLBuffer.vertexAttribs = vertexGLBufferAttribs;
        vertexGLBuffer.bufferData = workGroup.preserveBufferData ? workGroup.vertexBuffer : null;

        workGroup.vertexBuffer = vertexGLBuffer;
    };

    /**
     * @description
     * Strore index buffer data geometry on one model
     * output WebGLBuffer of type ELEMENT_ARRAY_BUFFER
     * to use on model renderization process.
     * 
     * Output data has formated to one 
     * Uint16Array or Uint32Array depending
     * if WebGL extension OES_element_index_uint
     * is avaliable.
     * 
     * @param {Object} workGroup
     * @returns {undefined}
     */
    OBJModelLoader.storeIndexBufferData = function (workGroup) {

        var gl = workGroup.gl;

        var numVertexs = workGroup.numVertexs;
        var indexsNumber = workGroup.numIndexs;

        var isInteger32Avaliable = gl.getExtension('OES_element_index_uint');

        var targetGLBuffer;
        var indexGLBuffer;
        var indexGLBufferStride = 0;
        var indexGLBufferUnpackFormat = 0;

        //unpack index buffer if need
        if (indexsNumber !== numVertexs) {

            //select index buffer unpack format
            if (isInteger32Avaliable && numVertexs > 65534) {

                //store index buffer data on format unsigned integer as 32 bits
                workGroup.indexBuffer = new Uint32Array(workGroup.indexBuffer);

                //define index data unpack mode and buffer stride
                indexGLBufferUnpackFormat = gl.UNSIGNED_INT;
                indexGLBufferStride = 4;

            } else {

                //store index buffer data on format unsigned integer as 16 bits
                workGroup.indexBuffer = new Uint16Array(workGroup.indexBuffer);

                //define index data unpack mode and buffer stride
                indexGLBufferUnpackFormat = gl.UNSIGNED_SHORT;
                indexGLBufferStride = 2;

            }

            //create one GL_BUFFER to store geometry poligon's index data
            indexGLBuffer = gl.createBuffer();
            targetGLBuffer = gl.ELEMENT_ARRAY_BUFFER;

            //store index data on GL_BUFFER
            gl.bindBuffer(targetGLBuffer, indexGLBuffer);
            gl.bufferData(targetGLBuffer, workGroup.indexBuffer, gl.STATIC_DRAW);
            gl.bindBuffer(targetGLBuffer, null);

            //define index buffer properties
            indexGLBuffer.byteLength = indexsNumber * indexGLBufferStride;
            indexGLBuffer.indexsNumber = indexsNumber;
            indexGLBuffer.indexStride = indexGLBufferStride;
            indexGLBuffer.indexUnpackFormat = indexGLBufferUnpackFormat;
            indexGLBuffer.bufferData = workGroup.preserveBufferData ? workGroup.indexBuffer : null;

        }

        workGroup.indexBuffer = indexGLBuffer;
    };

    /**
     * @description
     * Set command to build any superSamplers textures
     * requireds from model. This start internal mechamism
     * to load image resources and store on renderable
     * WebGLTexture.
     * 
     * @param {Object} workGroup
     * @returns {undefined}
     */
    OBJModelLoader.buildSamplersTextures = function (workGroup) {

        //build sampler's textures requireds
        OBJModelLoader.SamplerBuilder.buildSamplerTexture(workGroup.difuseSampler);
        OBJModelLoader.SamplerBuilder.buildSamplerTexture(workGroup.specularSampler);
        OBJModelLoader.SamplerBuilder.buildSamplerTexture(workGroup.ambientSampler);
        OBJModelLoader.SamplerBuilder.buildSamplerTexture(workGroup.bumpSampler);
        OBJModelLoader.SamplerBuilder.buildSamplerTexture(workGroup.nsSampler);
        OBJModelLoader.SamplerBuilder.buildSamplerTexture(workGroup.naSampler);

    };

    /**
     * @description
     * Make one renderable OBJModel using data of workGroup.
     * process steeps are executed on next ordin:
     * 
     * 1 - Store buffers data.
     * 2 - Load Imported's MTL Libraries files.
     * 3 - Build sampler textures.
     * 4 - Define mododel properties.
     *
     * @property {String} name              Model geometry name
     * 
     * @property {Number} drawMode          Used WebGL draw method to render geometries 
     *
     * @property {WebGLBuffer} vertexBuffer Output buffer with geometry vertex data
     * @property {WebGLBuffer} indexBuffer  Output buffer with geometry vertex index's
     *
     * @property {Array} objects            Array with model sub-geometries metainfo required to sub-draw
     * @property {Array} materials          Array with model materials information requireds to renderize
     * @property {WebGLProgram} shader      Shader program required to renderize model
     * @property {Object} samplers          A group samplers textures requireds to renderize model
     * @property {BoundBox} bounds          Model axis bounds
     * 
     * @param {Object} workGroup
     * @returns {OBJModelLoader.OBJModel}
     */
    OBJModelLoader.buildOBJModel = function (workGroup) {
        var model = new OBJModelLoader.OBJModel();
        var bounds = new BoundBox;

        if (workGroup.currentObject)
            //save a last created OBJObject if has created
            this.saveOBJObject(workGroup, workGroup.currentObject);

        //unpack model geometry data to WebGL data format
        this.storeBufferData(workGroup);            //create requireds GLBuffer data
        this.loadImportedMTLLibraries(workGroup);   //parse requireds material libraries
        this.buildSamplersTextures(workGroup);      //create requireds sampler textures

        if (this.showStats)
            //log stats on console
            this.logStats(workGroup);

        // store model values
        model.name = workGroup.fileName;

        // store model information
        model.drawMode = workGroup.gl.TRIANGLES;

        // store model buffer with renderable data
        model.vertexBuffer = workGroup.vertexBuffer;
        model.indexBuffer = workGroup.indexBuffer;

        // store model resources
        model.objects = workGroup.objects;
        model.materials = workGroup.materials;
        model.bounds = bounds;
        model.shader = OBJModelLoader.getOBJRenderShader(workGroup.gl);

        // store model textures samplers
        model.samplers = {};
        model.samplers.difuseSampler = workGroup.difuseSampler ? workGroup.difuseSampler.sampler : null;
        model.samplers.specularSampler = workGroup.specularSampler ? workGroup.specularSampler.sampler : null;
        model.samplers.ambientSampler = workGroup.ambientSampler ? workGroup.ambientSampler.sampler : null;
        model.samplers.bumpSampler = workGroup.bumpSampler ? workGroup.bumpSampler.sampler : null;
        model.samplers.nsSampler = workGroup.nsSampler ? workGroup.nsSampler.sampler : null;
        model.samplers.naSampler = workGroup.naSampler ? workGroup.naSampler.sampler : null;

        //compute total model geometry bounds using subgeometries bounds
        for (var i = 0, l = model.objects.length; i < l; i++) {
            bounds.updateByBoundBox(model.objects[i].bounds);
        }
        bounds.computeCenter();

        //store builded model
        workGroup.model = model;

        return model;
    };

    //Resources functions
    OBJModelLoader.logStats = function (workGroup) {

        var numVertexs = workGroup.vertexBuffer.vertexsNumber;
        var vertexStride = workGroup.vertexBuffer.vertexStride;
        var vertexBufferSize = numVertexs * vertexStride;

        var numIndexs = 0;
        var indexStride = 0;
        var indexBufferSize = 0;

        var numTriangles = 0;
        var stats = 'OBJ Model Loaded Stats \n\t{\n';

        stats += '\t\t file: ' + workGroup.rootPath + '/' + workGroup.fileName + '.obj,\n';
        stats += '\t\t vertexs: ' + numVertexs + ',\n';

        if (workGroup.indexBuffer) {

            numIndexs = workGroup.indexBuffer.indexsNumber;
            indexStride = workGroup.indexBuffer.indexStride;
            indexBufferSize = numIndexs * indexStride;
            numTriangles = numIndexs / 3;

            stats += '\t\t indexs: ' + numIndexs + ',\n';
            stats += '\t\t triangles: ' + numTriangles + ',\n';
            stats += '\t\t vertex_buffer_size: ' + this.parseByteScale(vertexBufferSize) + ' ,\n';
            stats += '\t\t index_buffer_size: ' + this.parseByteScale(indexBufferSize) + ' , \n';
            stats += '\t\t total_buffer_size: ' + this.parseByteScale(vertexBufferSize + indexBufferSize) + ' / ' + this.parseByteScale(numTriangles * 3 * vertexStride) + ' (if not use indexs) \n';

        } else {
            numTriangles = numVertexs / 3;

            stats += '\t\t indexs: 0,\n';
            stats += '\t\t triangles: ' + numTriangles + ',\n';
            stats += '\t\t vertex_buffer_size: ' + this.parseByteScale(vertexBufferSize) + ' ,\n';
            stats += '\t\t index_buffer_size: 0 B \n';
        }

        stats += '\t\t materials: ' + workGroup.materials.length + '\n';
        stats += '\t\t objects: ' + workGroup.objects.length + '\n';

        stats += '\t}';

        console.log(stats);
    };

    /**
     * @description
     * Make and return one usable WebGLProgram to
     * renderize a OBJModel. This shader has generic
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
    OBJModelLoader.getOBJRenderShader = function (gl) {

        var vertexShader;
        var vertexShaderSource;
        var vertexShaderInfo;

        var fragmentShader;
        var fragmentShaderSource;
        var fragmentShaderInfo;

        var shaderProgram;
        var shaderProgramInfo;
        var isLinkedProgram;

        var shaderAttribs;
        var shaderUniforms;

        //create default render shader if not exist
        if (!OBJModelLoader.RENDER_SHADER) {

            vertexShaderSource = "" +
                "const int NUM_MATERIALS = 64; \n" +
                "\n" +
                "struct Camera {    \n" +
                "   highp mat4 mview;    \n" +
                "   highp mat4 mproject;    \n" +
                "   mediump vec3 coords;   \n" +
                "}; \n" +
                "\n" +
                "struct MTLMaterial {   \n" +
                "   vec4 difuseColor;    \n" +
                "   vec4 difuseMap; \n" +
                "   float specularity;   \n" +
                "}; \n" +
                "\n" +
                "attribute vec3 vertexCoords;   \n" +
                "attribute vec4 vertexNormal;   \n" +
                "attribute vec2 vertexTexCoords;\n" +
                "attribute vec4 vertexColor;    \n" +
                "attribute vec2 vertexMetadata; \n" +
                "\n" +
                "varying vec3 fcoords;  \n" +
                "varying vec3 fnormal;  \n" +
                "varying vec4 difuseColor;   \n" +
                "varying float specularity;  \n" +
                "\n" +
                "uniform mat4 mtransform;   \n" +
                "uniform mat4 mnormal;   \n" +
                "uniform Camera camera; \n" +
                "uniform MTLMaterial materials[NUM_MATERIALS];  \n" +
                "\n" +
                "MTLMaterial material;  \n" +
                "\n" +
                "vec4 transformed;  \n" +
                "int index; \n" +
                "\n" +
                "void main(){   \n" +
                "\n" +
                "    index = int(vertexMetadata.y); \n" +
                "    material = materials[index < NUM_MATERIALS ? index : 0]; \n" +
                "\n" +
                "    //use material components or compute material sampler texture coord\n" +
                "    difuseColor = material.difuseMap.w == 0.0 \n" +
                "       ? material.difuseColor \n" +
                "       : vec4(vertexTexCoords.x * material.difuseMap.z + material.difuseMap.x, vertexTexCoords.y * material.difuseMap.w + material.difuseMap.y, 0.0, 1.0);  \n" +
                "    specularity = material.specularity;  \n" +
                "\n" +
                "    //compute vertex position  \n" +
                "    transformed = mtransform * vec4(vertexCoords, 1.0);    \n" +
                "    gl_Position = camera.mproject * camera.mview * transformed;  \n" +
                "\n" +
                "    //compute transformed vertex normal direction  \n" +
                "    fcoords = transformed.xyz; \n" +
                "    fnormal = normalize((mnormal * vec4(vertexNormal.xyz, 0.0)).xyz);   \n" +
                "\n" +
                "}";

            fragmentShaderSource = "" +
                "precision lowp float;\n" +
                "const int NUM_LIGTHS = 8; \n" +
                "\n" +
                "struct Camera {  \n" +
                "    highp mat4 mview;  \n" +
                "    highp mat4 mproject;  \n" +
                "    mediump vec3 coords;  \n" +
                "};  \n" +
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
                "varying vec4 difuseColor;  \n" +
                "varying float specularity;  \n" +
                "\n" +
                "uniform sampler2D difuseMap;  \n" +
                "uniform Camera camera;  \n" +
                "uniform Ligth ligths[NUM_LIGTHS];  \n" +
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
                "vec3 normalizedNormal; \n" +
                "vec3 ligthDifuseColor;  \n" +
                "vec3 ligthSpecularColor;  \n" +
                "vec3 ligthAmbientColor;  \n" +
                "\n" +
                "void main() {  \n" +
                "\n" +
                "    //get difuse color  \n" +
                "    gl_FragColor = difuseColor.a == 0.0 ? vec4(difuseColor.rgb, 1.0) : texture2D(difuseMap, difuseColor.xy);  \n" +
                "\n" +
                "    //discard alpha pixel  \n" +
                "    if(gl_FragColor.a < 0.5)  \n" +
                "        discard;  \n" +
                "\n" +
                "    //compute any applieds ligths values  \n" +
                "    view2surface = normalize(camera.coords - fcoords);  \n" +
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
                "            ligthAmbientColor += ligth.color;  \n" +
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
                "        view2ligth = normalize(ligth2surface + view2surface);  \n" +
                "        specularValue = pow(max(dot(fnormal, view2ligth), 0.1), specularity) * difuseValue;  \n" +
                "\n" +
                "        //add color components  \n" +
                "        ligthDifuseColor += ligth.color * difuseValue;  \n" +
                "        ligthSpecularColor += ligth.color * specularValue;  \n" +
                "\n" +
                "    }  \n" +
                "\n" +
                "    //compute final surface color  \n" +
                "    gl_FragColor.rgb *= ligthDifuseColor + ligthAmbientColor;  \n" +
                "    gl_FragColor.rgb += ligthSpecularColor;  \n" +
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
                    shaderAttribs.texels = gl.getAttribLocation(shaderProgram, 'vertexTexCoords');
                    shaderAttribs.metadata = gl.getAttribLocation(shaderProgram, 'vertexMetadata');

                    //get shader uniforms reference
                    shaderUniforms.mtransform = gl.getUniformLocation(shaderProgram, 'mtransform');
                    shaderUniforms.mnormal = gl.getUniformLocation(shaderProgram, 'mnormal');

                    //get shader camera uniforms struct reference
                    shaderUniforms.camera = {
                        mview: gl.getUniformLocation(shaderProgram, 'camera.mview'),
                        mproject: gl.getUniformLocation(shaderProgram, 'camera.mproject'),
                        coords: gl.getUniformLocation(shaderProgram, 'camera.coords')
                    };

                    //get shader sampler uniforms references
                    shaderUniforms.difuseMap = gl.getUniformLocation(shaderProgram, 'difuseMap');

                    //get shader material uniforms struct reference
                    shaderUniforms.materials = new Array(64);
                    for (var i = 0, structure; i < 64; i++) {
                        structure = 'materials[' + i + ']';
                        shaderUniforms.materials[i] = {
                            difuseColor: gl.getUniformLocation(shaderProgram, structure + '.difuseColor'),
                            difuseMap: gl.getUniformLocation(shaderProgram, structure + '.difuseMap'),
                            specularity: gl.getUniformLocation(shaderProgram, structure + '.specularity')
                        };
                    }

                    //get shader ligths uniforms structs reference
                    shaderUniforms.ligths = new Array(8);
                    for (var i = 0, structure; i < 8; i++) {
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
                    OBJModelLoader.RENDER_SHADER = shaderProgram;

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

        return OBJModelLoader.RENDER_SHADER;
    };

    /** Texture Sampler Builder **/
    ////////////////////////////////////////////////////////////////////////////
    OBJModelLoader.SamplerBuilder = function () {};

    /** @description Defined if is showed process stats **/
    OBJModelLoader.SamplerBuilder.debug = false;

    /** @description Defined if is showed process errors **/
    OBJModelLoader.SamplerBuilder.errors = false;

    /** @description Defined if is images are alocated optimizing used area or dimension **/
    OBJModelLoader.SamplerBuilder.priorizeArea = true;

    /**
     * @description
     * Make a new super sampler to store data required to build
     * one WebGLTexture and return it. Maked sampler contain
     * a list of rectangles from sampler sub-images distribution.
     * First rectangle has a max sampler size received.
     * 
     * @property {OBJModelLoader.SamplerBuilder.this} self  Maker sampler builder of new sampler.
     * @property {WebGLRenderingContext} gl                 Render context used to work with texture data
     * @property {Boolean} build                            Flag to define if is need to build a sampler output texture 
     * @property {Number} uploadImages                      Number of sub-images requireds to build sampler texture
     * @property {Number} maxSize                           Max sampler texture width and height size
     * @property {Boolean} useMipmap                        Flag to define if is store sampler texture as mipmap 
     * @property {WebGLtexture} sampler                     Output texture used to store sampler image's data
     * @property {Array} rectangles                         Array with rectangles used on image distribution
     * @property {Array} images                             Array with required's HTMLImages
     * 
     * @param {WebGLRenderingContext} gl
     * @param {Number} maxSize
     * @param {Boolean} useMipmap
     * @returns {Object}
     */
    OBJModelLoader.SamplerBuilder.createNewSampler = function (gl, maxSize, useMipmap) {
        maxSize || (maxSize = 4096);

        var workSampler = new Object();

        //define sampler properties
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

    /**
     * @description
     * Add one new image to requireds images array
     * using provided URL String only if has not
     * found on it. When has not on the list is maked
     * and returned one new image else response is a 
     * founded image.
     * 
     * Image received one OBJModelLoader.Material.Sampler
     * to represent real distribution of its data on 
     * generated sampler texture.
     * 
     * Here is increased a number of uploads images.
     * 
     * if current image path has not found on images
     * of array.
     * 
     * @param {Object} workSampler
     * @param {String} samplerImagePath
     * @returns {HTMLImage}
     */
    OBJModelLoader.SamplerBuilder.addSamplerImageByURL = function (workSampler, samplerImagePath) {
        var length = workSampler.images.length;
        var self = workSampler.self;

        var i = 0;
        var found = false;
        var image = null;

        //search if image has not on cache
        while (!found && i < length) {
            if (workSampler.images[i].url === samplerImagePath) {
                found = true;
                image = workSampler.images[i];
            }
            i++;
        }

        //if dont exist craete and process new image
        if (!found) {

            image = new Image() || document.createElement('img');
            image.subSampler = new OBJModelLoader.Material.Sampler();

            image.onerror = function () {
                console.error('Can not loaded image on URL: ' + image.src);

                //update image state
                workSampler.uploadImages--;
                image.loaded = false;

                //try to execute sampler build if any images has been loadeds
                if (workSampler.build && workSampler.uploadImages === 0)
                    self.storeSamplerTextures(workSampler);

            };

            image.onload = function () {
                console.log('Loaded image on URL: ' + image.src);

                //update image state
                workSampler.uploadImages--;
                image.loaded = true;

                //try to execute sampler build if any images has been loadeds
                if (workSampler.build && workSampler.uploadImages === 0)
                    self.storeSamplerTextures(workSampler);
            };

            //increase a required images number
            workSampler.uploadImages++;

            //add image to cache for future use
            workSampler.images.push(image);

            //set image source to reflect and load it
            image.url = samplerImagePath;
            image.src = samplerImagePath;

        }

        return image;
    };

    /**
     * @description
     * Send to sampler message to build texture using requireds
     * images. This process can be occur asynchronously if any
     * required data has not load at call time. 
     * 
     * @param {Objcte} workSampler
     * @returns {undefined}
     */
    OBJModelLoader.SamplerBuilder.buildSamplerTexture = function (workSampler) {

        if (workSampler) {

            //set buildeable state
            workSampler.build = true;

            //try to build sampler texture if is not empty and every images has been loadeds
            if (workSampler.uploadImages === 0 && workSampler.images.length > 0)
                this.storeSamplerTextures(workSampler);

        }

    };

    /**
     * @description
     * Get optime rectangle alocation on list of avaliables
     * rectangles, using specific's selection rules. First
     * rectangle founded wih required space is used by default
     * if onother is found on process.
     * 
     * To select optime alocation is used a minor avaliable
     * space or minor coordinate {X, Y} specifying priority ordin 
     * using propertie SamplerBuilder.priorizeArea.
     *  
     * SamplerBuilder.priorizeArea = true;  // MINOR SPACE       => MINOR COORDINATES
     * SamplerBuilder.priorizeArea = false; // MINOR COORDINATES => MINOR SPACE
     * 
     * When final optime rectangle is getted, is separed
     * in zero, one or two rectangles if later of reduce
     * required space exist residual space, on width and/or
     * height dimension. To best distribution of new rectangles
     * is apply VERTICAL or HORIZINTAL distribution on dependence
     * of residual width and height values. Next, any methoods are
     * explained's.
     * 
     * *************************************************************************
     * 
     *    |  RW  |  rW  |
     * ---|------|------|---     VERTICAL DISTRIBUTON: 
     *  H |      |      |        R) Take REQUIRED WIDTH  and REQUIRED HEIGHT
     *  E |   R  |   B  | RH     A) Take AVALIABLE WIDTH and RESIDUAL HEIGHT
     *  I |      |      |        B) Take RESIDUAL WIDTH  and IMAGE WIDTH    
     *  G |------|------|---
     *  H |             |
     *  T |      A      | rh
     *    |             | 
     * ---|-------------|---
     *    |    WIDTH    |
     * 
     * *************************************************************************
     * 
     *    |  RW  |  rW  |
     * ---|------|------|---    HORIZONTAL DISTRIBUTION:
     *    |      |      | H     R) Take REQUIRED WIDTH and REQUIRED HEIGHT
     * RH |   R  |      | E     A) Take IMAGE WIDTH    and RESIDUAL HEIGHT
     *    |      |      | I     B) Take RESIDUAL WIDTH and AVALIABLE HEIGHT
     * ---|------|   B  | G
     *    |      |      | H
     * rH |   A  |      | T
     *    |      |      |
     * ---|------|------|---
     *    |    WIDTH    |
     *    
     ***************************************************************************
     *    
     * @param {Array} rectangles
     * @param {Rectangle} rectangleR
     * @returns {Rectangle}
     */
    OBJModelLoader.SamplerBuilder.getRectangle = function (rectangles, rectangleR) {

        var length = rectangles.length;

        var rectangleA = null;  //rectangle with avaliable space
        var rectangleB = null;  //rectangle with residual space
        var rectangleT = null;  //array iterator rectangle 

        var restW = 0, restH = 0;

        var rectangleArea = 0;
        var rectangleRigth = 0;
        var rectangleUp = 0;

        var minorArea = 0;
        var minorRigth = 0;
        var minorUp = 0;

        var hasMinorRigth = false;
        var hasMinorUp = false;

        var isReducedVerticaly = false;
        var indexRectangleA = -1;

        //Search one rectangle with avaliable space
        /////////////////////////////////////////////////////
        for (var i = 0; i < length; i++) {
            rectangleT = rectangles[i];

            //compute unused space betwen two rectangles 
            restW = rectangleT.width - rectangleR.width;
            restH = rectangleT.height - rectangleR.height;

            //compute comparables values
            rectangleArea = rectangleT.width * rectangleT.height;
            rectangleRigth = rectangleT.x + rectangleR.width;
            rectangleUp = rectangleT.y + rectangleR.height;

            //select rectangle if have required space 
            //and is using a minor space but not zero space
            ////////////////////////////////////////////////////
            if (rectangleArea > 0 && restW >= 0 && restH >= 0) {

                //Select if rectangle is candidate
                ////////////////////////////////////////////////////
                if (rectangleA === null) {
                    //if is first candidate directly is asigned

                    //update minor bounds values
                    minorRigth = rectangleRigth;
                    minorUp = rectangleUp;
                    minorArea = rectangleArea;

                    //define used rectangle to store
                    rectangleA = rectangleT;
                    indexRectangleA = i;

                } else {
                    //else select new candidate using one critery (area or coordinates)

                    if (this.priorizeArea) {

                        //use rectangle if is a minor avaliable space or exactly
                        if (restW + restH === 0) {
                            rectangleA = rectangleT;
                            indexRectangleA = i;
                            minorArea = -1;

                        } else {

                            //compare and update minor area value
                            if (rectangleArea < minorArea) {
                                minorArea = rectangleArea;
                                rectangleA = rectangleT;
                                indexRectangleA = i;

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
                            indexRectangleA = i;

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
                                indexRectangleA = i;

                            }

                        } else {
                            ;
                        }

                    } //end else compare bounds
                    ////////////////////////////////////////////////////

                }
            }   //end if avaliable space
            ////////////////////////////////////////////////////

        }   //end for
        /////////////////////////////////////////////////////

        /* 
         * If exist one rectangle with required space
         * Is reduced requierds space from it and 
         * maked other rectangle with residual space
         * if exist.
         */

        //Reducing phather rectangle to space update distriution
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
                isReducedVerticaly = restW <= restH;

                //create one HORIZONTAL RECTANGLE to store on distribution list
                rectangleA = new Rectangle();
                rectangleA.x = rectangleT.x;
                rectangleA.y = rectangleT.y + rectangleR.height;
                rectangleA.width = isReducedVerticaly ? rectangleT.width : rectangleR.width;
                rectangleA.height = restH;

                //store HORIZONTAL RECTANGLE (OVERRIDING FATHER RECTANGLE INDEX)
                rectangles[indexRectangleA] = rectangleA;

                //create one VERTICAL RECTANGLE to store on distribution list
                if (restH > 0) {
                    rectangleB = new Rectangle();
                    rectangleB.x = rectangleT.x + rectangleR.width;
                    rectangleB.y = rectangleT.y;
                    rectangleB.width = restW;
                    rectangleB.height = isReducedVerticaly ? rectangleR.height : rectangleT.height;

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

    /**
     * @description
     * Get a nex number, power of two, after
     * received value.
     * 
     * 0 1 2 4 8 16 32 64 128 256 512 1024 2048 4096 8192
     * 
     * By Exaples: 17 -> 32 | 5 -> 8 | 132 -> 256
     * 
     * @param {Number} number
     * @returns {Number}
     */
    OBJModelLoader.SamplerBuilder.getNexPow2 = function (number) {
        var value = 1;

        //duplicate a value to get one pow of 2 major at number
        while (value < number) {
            value *= 2;
        }

        return value;
    };

    /**
     * @description
     * Store any imges of smapler on one output WebGLTexture
     * using space distribution generated with alocation selection
     * algorithm. 
     * 
     * From each image is searched an optime rectangle
     * alocation from it dimensions, to insert on texture.
     * Received alocation is pased to image sampler with
     * defined sub-scale.
     * 
     * Here is optimized required texture dimensions using
     * a nex power of two, of minime dimensions requireds.
     * 
     * For more render performance is enable MipMap filter
     * and generate compressed texture to use it.
     * 
     * @param {Object} workSampler
     * @returns {undefined}
     */
    OBJModelLoader.SamplerBuilder.storeSamplerTextures = function (workSampler) {

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

        //sort images array by areas (selection sort)
        /////////////////////////////////////////////////////
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

                //update max dimensions of sampler texture
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
        /////////////////////////////////////////////////////

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

        //enable texture
        gl.bindTexture(gl.TEXTURE_2D, workSampler.sampler);

        //define sampler size and clear
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, samplerWidth, samplerHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

        //put images on texture
        /////////////////////////////////////////////////////
        for (var i = 0; i < numImages; i++) {
            image = images[i];
            rectangleImage = image.rectangleImage;

            if (image.loaded && rectangleImage) {

                //store sub image data on super sampler if has avaliable space
                gl.texSubImage2D(gl.TEXTURE_2D, 0, rectangleImage.x, rectangleImage.y, gl.RGBA, gl.UNSIGNED_BYTE, image);

                //compute subSampler transformation
                image.subSampler[0] = rectangleImage.x / workSampler.width;         //texel s position
                image.subSampler[1] = rectangleImage.y / workSampler.height;        //texel t position
                image.subSampler[2] = rectangleImage.width / workSampler.width;     //pixel scaled value width
                image.subSampler[3] = rectangleImage.height / workSampler.height;   //pixel scaled value height

                !this.debug || console.log('\tLoaded and Stored image data from URL: ' + image.src + ' , x:' + rectangleImage.x + ', y: ' + rectangleImage.y + ', width: ' + rectangleImage.width + ' , height: ' + rectangleImage.height + ' }');

            } else if (image.loaded) {
                !this.errors || console.error('\tNot required space fron image on URL: ' + image.src + ' , width: ' + image.width + ' , height: ' + image.height);
                !this.errors || console.log(image);

            } else {
                !this.errors || console.error('\tNot loaded image on URL: ' + image.src);

            }
        }   //end for
        /////////////////////////////////////////////////////

        //set texture storage parameters
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        //select and apply mignification filter
        /////////////////////////////////////////////////////
        if (workSampler.useMipmap) {
            //asigne mignification filter and generate compressed MIPMAP Texture
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
            gl.generateMipmap(gl.TEXTURE_2D);

        } else {
            //asigne mignification filter
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        }
        /////////////////////////////////////////////////////

        //close texture
        gl.bindTexture(gl.TEXTURE_2D, null);
    };

    //Renderizable OBJ Model Material
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
    OBJModelLoader.Material = function (name, difuseColor) {
        this.name = name;

        this.difuseColor = new OBJModelLoader.Material.Color(difuseColor);
        this.specularColor = new OBJModelLoader.Material.Color();
        this.ambientColor = new OBJModelLoader.Material.Color();

        this.difuseMap = new OBJModelLoader.Material.Sampler();
        this.specularMap = new OBJModelLoader.Material.Sampler();
        this.ambientMap = new OBJModelLoader.Material.Sampler();
        this.bumpMap = new OBJModelLoader.Material.Sampler();
        this.specularityMap = new OBJModelLoader.Material.Sampler();
        this.ambientalityMap = new OBJModelLoader.Material.Sampler();

        this.specularity = 100;
        this.ambientality = 100;
        this.ditter = 100;
    };

    OBJModelLoader.Material.prototype = Object.create(M3D.Model.Material.prototype);

    /** 
     * @description
     * Send to WebGL render shader uniforms, all property 
     * values of one Material.
     * 
     * @param {WebGLRenderingContext} gl
     * @param {Object} uniformStruct  
     * @returns {undefined}
     */
    OBJModelLoader.Material.prototype.sendToGPU = function (gl, uniformStruct) {

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
    OBJModelLoader.Material.Color = function (clonedColor) {
        var color = new Float32Array(4);

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

        //define color components values
        if (clonedColor) {
            color[0] = clonedColor.red;
            color[1] = clonedColor.green;
            color[2] = clonedColor.blue;
            color[3] = clonedColor[4] || 0;

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
    OBJModelLoader.Material.Color.prototype.set = function (red, green, blue) {
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
    OBJModelLoader.Material.Sampler = function (clonedSampler) {
        var sampler = new Float32Array(4);

        if (clonedSampler) {
            sampler[0] = clonedSampler[0];
            sampler[1] = clonedSampler[1];
            sampler[2] = clonedSampler[2];
            sampler[3] = clonedSampler[3];

            console.log('CLONED ' + sampler);
        }

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

        return sampler;
    };

    //Renderizable Model
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
     * // geometry data buffers
     * @property {WebGLBuffer} vertexBuffer Output buffer with geometry vertex data
     * @property {WebGLBuffer} indexBuffer  Output buffer with geometry vertex index's
     * 
     * // resources
     * @property {Array} objects            Array with model sub-geometries metainfo required to sub-draw
     * @property {Array} materials          Array with model materials information requireds to renderize
     * @property {WebGLProgram} shader      Shader program required to renderize model
     * @property {Object} samplers          A group samplers textures requireds to renderize model
     * @property {BoundBox} bounds          Model axis bounds
     * 
     * // instance draw values
     * @property {Array} drawCalls          Array with any model instances requesting renderize
     * @property {Number} drawCallsNumber   Number of instaces on model instances array
     * 
     * @returns {OBJModelLoader.OBJModel}
     */
    OBJModelLoader.OBJModel = function () {
        this.id = OBJGeneratedModelID++;
        this.name = null;
        this.srcFile = null;

        this.drawMode = null;
        this.prepared = false;

        this.vertexBuffer = null;
        this.indexBuffer = null;

        this.objects = null;
        this.materials = null;
        this.samplers = null;
        this.bounds = null;
        this.shader = null;

        this.drawCalls = new Array(100);
        this.drawCallsNumber = 0;

    };

    OBJModelLoader.OBJModel.prototype = Object.create(M3D.Model.prototype);

    /**
     * @description
     * Make one new model isntance to renderize model.
     * 
     * @returns {OBJModelLoader.OBJModel.Instance}
     */
    OBJModelLoader.OBJModel.prototype.makeInstance = function () {
        return new OBJModelLoader.OBJModel.Instance(this);
    };

    /**
     * @description
     * Get model sub-geometry named with received String.
     * 
     * @param {String} name
     * @returns {OBJModelLoader.OBJModel.OBJObject}
     */
    OBJModelLoader.OBJModel.prototype.getOBJObject = function (name) {
        var found = false;
        var index = 0;
        var length = this.objects.length;

        while (!found && index < length) {
            found = this.objects[index].name === name;

            index++;
        }

        return found ? this.objects[index - 1] : null;
    };

    /**
     * @description
     * Get model material named with received String.
     * 
     * @param {String} name
     * @returns {OBJModelLoader.Material}
     */
    OBJModelLoader.OBJModel.prototype.getMTLMaterial = function (name) {
        var found = false;
        var index = 0;
        var length = this.materials.length;

        while (!found && index < length) {
            found = this.materials[index].name === name;

            index++;
        }

        return found ? this.materials[index - 1] : null;
    };

    /**
     * @description
     * Prepare one model to use one render WebGLProgram.
     * 
     * Here is binded vertexBuffers to vertexAttribs,
     * textures are enables be link to asociated sampler2D 
     * uniforms and values of materials has passed to one
     * uniform array with secified structs.
     * 
     * @param {WebGLRenderingContext} gl
     * @param {WebGLShader} shader
     * @returns {undefined}
     */
    OBJModelLoader.OBJModel.prototype.prepare = function (gl, shader) {

        if (!shader)
            return;

        //buffer values
        var vertexBuffer = this.vertexBuffer;
        var vertexAttribs = vertexBuffer.vertexAttribs;
        var indexBuffer = this.indexBuffer;

        //shader elements vars
        var shaderAttribs = shader.attribs;
        var shaderUniforms = shader.uniforms;

        //attrib asignation vars
        var vertexStride = vertexBuffer.vertexStride;
        var vertexAttrib;
        var shaderAttrib;

        //material definition vars
        var samplers = this.samplers;
        var materials = this.materials;
        var materialStructure;
        var color;

        //LINK BUFFER TO ATTRIBs LOCATIONs
        /////////////////////////////////////////////////////////
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

        //vertex coords attrib
        shaderAttrib = shaderAttribs.coords;
        vertexAttrib = vertexAttribs.coords;

        if (shaderAttrib >= 0) {
            if (vertexAttrib) {
                gl.enableVertexAttribArray(shaderAttrib);
                gl.vertexAttribPointer(shaderAttrib, vertexAttrib.size, vertexAttrib.type, vertexAttrib.normalized, vertexStride, vertexAttrib.offset);

            } else {
                gl.disableVertexAttribArray(shaderAttrib);
                gl.vertexAttrib3f(shaderAttrib, 0, 0, 0);

            }
        }
        /////////////////////////

        //vertex normal attrib
        shaderAttrib = shaderAttribs.normals;
        vertexAttrib = vertexAttribs.normals;

        if (shaderAttrib >= 0) {
            if (vertexAttrib) {
                gl.enableVertexAttribArray(shaderAttrib);
                gl.vertexAttribPointer(shaderAttrib, vertexAttrib.size, vertexAttrib.type, vertexAttrib.normalized, vertexStride, vertexAttrib.offset);

            } else {
                gl.disableVertexAttribArray(shaderAttrib);
                gl.vertexAttrib3f(shaderAttrib, 0, 0, 0);

            }
        }
        /////////////////////////

        //vertex texCoords attrib
        shaderAttrib = shaderAttribs.texels;
        vertexAttrib = vertexAttribs.texels;

        if (shaderAttrib >= 0) {
            if (vertexAttrib) {
                gl.enableVertexAttribArray(shaderAttrib);
                gl.vertexAttribPointer(shaderAttrib, vertexAttrib.size, vertexAttrib.type, vertexAttrib.normalized, vertexStride, vertexAttrib.offset);

            } else {
                gl.disableVertexAttribArray(shaderAttrib);
                gl.vertexAttrib2f(shaderAttrib, 0.5, 0.5);

            }
        }
        /////////////////////////

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
        /////////////////////////

        //vertex metadata attrib
        shaderAttrib = shaderAttribs.metadata;
        vertexAttrib = vertexAttribs.metadata;

        if (shaderAttrib >= 0) {
            if (vertexAttrib) {
                gl.enableVertexAttribArray(shaderAttrib);
                gl.vertexAttribPointer(shaderAttrib, vertexAttrib.size, vertexAttrib.type, vertexAttrib.normalized, vertexStride, vertexAttrib.offset);

            } else {
                gl.disableVertexAttribArray(shaderAttrib);
                gl.vertexAttrib2f(shaderAttrib, 0, 1);

            }
        }
        /////////////////////////

        //close vertex buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

        // bind materials and enable material textures
        if (shaderUniforms.materials) {

            //send materials structures data to shader
            //////////////////////////////////////////////////////////
            for (var i = 0, length = materials.length; i < length; i++) {
                materialStructure = shaderUniforms.materials[i];
                materialStructure && materials[i].sendToGPU(gl, materialStructure);
            }

            //bind and enable requireds textures
            //////////////////////////////////////////////////////////
            var textureUnit = 0;

            //bind difuse texture map
            if (samplers.difuseSampler && samplers.difuseSampler.initialized) {
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, samplers.difuseSampler);

                gl.uniform1i(shaderUniforms.mapKd, 0);
                textureUnit++;
            }

            //bind specular texture map
            if (samplers.specularSampler && samplers.specularSampler.initialized) {
                gl.activeTexture(gl.TEXTURE0 + textureUnit);
                gl.bindTexture(gl.TEXTURE_2D, samplers.specularSampler);

                gl.uniform1i(shaderUniforms.mapKs, textureUnit);
                textureUnit++;
            }

            //bind ambient texture map
            if (samplers.ambientSampler && samplers.ambientSampler.initialized) {
                gl.activeTexture(gl.TEXTURE0 + textureUnit);
                gl.bindTexture(gl.TEXTURE_2D, samplers.ambientSampler);

                gl.uniform1i(shaderUniforms.mapKa, textureUnit);
                textureUnit++;
            }

            //bind normal bump texture map
            if (samplers.bumpSampler && samplers.bumpSampler.initialized) {
                gl.activeTexture(gl.TEXTURE0 + textureUnit);
                gl.bindTexture(gl.TEXTURE_2D, samplers.bumpSampler);

                gl.uniform1i(shaderUniforms.mapBump, textureUnit);
                textureUnit++;
            }

            //bind specular nicest texture map
            if (samplers.nsSampler && samplers.nsSampler.initialized) {
                gl.activeTexture(gl.TEXTURE0 + textureUnit);
                gl.bindTexture(gl.TEXTURE_2D, samplers.nsSampler);

                gl.uniform1i(shaderUniforms.mapNs, textureUnit);
                textureUnit++;
            }

            //bind ambient nicest texture map
            if (samplers.naSampler && samplers.naSampler.initialized) {
                gl.activeTexture(gl.TEXTURE0 + textureUnit);
                gl.bindTexture(gl.TEXTURE_2D, samplers.naSampler);

                gl.uniform1i(shaderUniforms.mapNa, textureUnit);
                textureUnit++;
            }

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
    OBJModelLoader.OBJModel.prototype.unprepare = function (gl, shader) {
        var textureUnit = 0;
        var samplers;

        //Disable used Sampler Maps Textures
        if (shader) {
            shader.disableVertexAttribs(gl);

            /** @deprecated Posible kill code efect*/
            ////////////////////////////////////////////
            if (shader.uniforms.materials) {
                samplers = this.samplers;

                //disable difuse texture map
                if (samplers.difuseSampler) {
                    gl.activeTexture(gl.TEXTURE0);
                    gl.bindTexture(gl.TEXTURE_2D, null);
                }

                //disable specular texture map
                if (samplers.specularSampler) {
                    gl.activeTexture(gl.TEXTURE0 + textureUnit);
                    gl.bindTexture(gl.TEXTURE_2D, null);
                }

                //disable ambient texture map
                if (samplers.ambientSampler) {
                    gl.activeTexture(gl.TEXTURE0 + textureUnit);
                    gl.bindTexture(gl.TEXTURE_2D, null);
                }

                //disable normal bump texture map
                if (samplers.bumpSampler) {
                    gl.activeTexture(gl.TEXTURE0 + textureUnit);
                    gl.bindTexture(gl.TEXTURE_2D, null);
                }

                //disable specular nicest texture map
                if (samplers.nsSampler) {
                    gl.activeTexture(gl.TEXTURE0 + textureUnit);
                    gl.bindTexture(gl.TEXTURE_2D, null);
                }

                //disable ambient nicest texture map
                if (samplers.naSampler) {
                    gl.activeTexture(gl.TEXTURE0 + textureUnit);
                    gl.bindTexture(gl.TEXTURE_2D, null);
                }

            }
            ////////////////////////////////////////////

            this.prepared = false;
        }

    };

    /**
     * @description
     * Add and return a new instance request on model drawCalls stack.
     * 
     * @param {OBJModelLoader.OBJModel.Instance} drawCallInstance
     * @returns {OBJModelLoader.OBJModel.Instance}
     */
    OBJModelLoader.OBJModel.prototype.addDrawCall = function (drawCallInstance) {
        if (drawCallInstance instanceof OBJModelLoader.OBJModel.Instance) {
            this.drawCalls[this.drawCallsNumber++] = drawCallInstance;
        }

        return drawCallInstance;
    };

    /**
     * @description
     * Execute all requireds drawCalls with specific
     * instance state uniforms matrixs.
     * 
     * If propertie objIndex are defined on instance
     * is renderized only specific model sub-geometry. 
     * 
     * If preserveDrawCalls received a True value,
     * when finish instance rendering, stack has not
     * cleaned else stack size is reset to zero.
     * 
     * @param {WebGLRenderingContext} gl
     * @param {Boolean} preserveDrawCalls
     * @returns {undefined}
     */
    OBJModelLoader.OBJModel.prototype.executeDrawCalls = function (gl, preserveDrawCalls) {

        //model buffers
        var vertexBuffer = this.vertexBuffer;
        var indexBuffer = this.indexBuffer;

        //model resources
        var shaderUniforms = this.shader.uniforms;

        //model draw vars
        var vertexsNumber = vertexBuffer.vertexsNumber;
        var indexsNumber;
        var indexUnpackFormat;
        var indexStride;

        //sub model vars
        var objects = this.objects;
        var objectsNumber = objects.length;
        var objectIndex = -1;
        var objObject = null;

        //draw calls vars
        var drawCalls = this.drawCalls;
        var drawCallsNumber = this.drawCallsNumber;
        var instance = null;

        //draw prepared model 
        if (this.prepared) {

            if (indexBuffer) {
                //use indexed draw mode
                indexsNumber = indexBuffer.indexsNumber;
                indexStride = indexBuffer.indexStride;
                indexUnpackFormat = indexBuffer.indexUnpackFormat;

                //draw each instance call's
                //////////////////////////////////////////////////////////
                for (var i = 0; i < drawCallsNumber; i++) {
                    instance = drawCalls[i];
                    objectIndex = instance ? instance.objObjectIndex : objectsNumber;

                    //select geometry or subgeometry draw
                    //////////////////////////////////////////////////////
                    if (objectIndex < 0) {
                        //send instance state uniforms to shader
                        gl.uniformMatrix4fv(shaderUniforms.mtransform, false, instance.transformMatrix);
                        gl.uniformMatrix4fv(shaderUniforms.mnormal, false, instance.normalMatrix);

                        //draw all model geometry
                        gl.drawElements(instance.drawMode, indexsNumber, indexUnpackFormat, 0);

                    } else if (objectIndex < objectsNumber) {
                        objObject = objects[objectIndex];

                        //send instance state uniforms to shader
                        gl.uniformMatrix4fv(shaderUniforms.mtransform, false, instance.transformMatrix);
                        gl.uniformMatrix4fv(shaderUniforms.mnormal, false, instance.normalMatrix);

                        //draw part of model geometry
                        if (objObject.indexedDraw)
                            gl.drawElements(instance.drawMode, objObject.indexsNumber, indexUnpackFormat, objObject.initialIndex * indexStride);
                        else
                            gl.drawArrays(instance.drawMode, objObject.initialVertex, objObject.vertexsNumber);

                    }
                    //////////////////////////////////////////////////////

                }
                //////////////////////////////////////////////////////////

            } else {
                //use not-indexed draw mode

                //draw each instance call's
                //////////////////////////////////////////////////////////
                for (var i = 0; i < drawCallsNumber; i++) {
                    instance = drawCalls[i];
                    objectIndex = instance ? instance.objObjectIndex : objectsNumber;

                    //select geometry or subgeometry draw
                    //////////////////////////////////////////////////////
                    if (objectIndex < 0) {
                        //send instance state uniforms to shader
                        gl.uniformMatrix4fv(shaderUniforms.mtransform, false, instance.transformMatrix);
                        gl.uniformMatrix4fv(shaderUniforms.mnormal, false, instance.normalMatrix);

                        //draw all model geometry
                        gl.drawArrays(instance.drawMode, 0, vertexsNumber);

                    } else if (objectIndex < objectsNumber) {
                        objObject = objects[objectIndex];

                        //send instance state uniforms to shader
                        gl.uniformMatrix4fv(shaderUniforms.mtransform, false, instance.transformMatrix);
                        gl.uniformMatrix4fv(shaderUniforms.mnormal, false, instance.normalMatrix);

                        //draw part of model geometry
                        gl.drawArrays(instance.drawMode, objObject.initialVertex, objObject.vertexsNumber);

                    }
                    //////////////////////////////////////////////////////

                }
                //////////////////////////////////////////////////////////

            }

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
    OBJModelLoader.OBJModel.prototype.draw = function (gl, drawMode) {
        var vertexBuffer = this.vertexBuffer;
        var indexBuffer = this.indexBuffer;

        if (this.indexBuffer)
            gl.drawElements(drawMode || gl.TRIANGLES, indexBuffer.indexsNumber, indexBuffer.indexUnpackFormat, 0);
        else
            gl.drawArrays(drawMode || gl.TRIANGLES, 0, vertexBuffer.vertexsNumber);

    };

    /**
     * @description
     * Draw one model sub-geometry on specified index of
     * objects list using one specific geoemtry draw mode.
     * Be default is used (WebGLRenderingContext.GL_TRIANGLES)
     * 
     * @param {WebGLRenderingContext} gl
     * @param {Number} index
     * @param {Number} drawMode
     * @returns {undefined}
     */
    OBJModelLoader.OBJModel.prototype.drawOBJObject = function (gl, index, drawMode) {
        var objects = this.objects;
        var objObject = null;

        if (index > 0 && index < objects.length) {
            objObject = objects[index];

            if (this.indexBuffer)
                gl.drawElements(drawMode || gl.TRIANGLES, objObject.indexsNumber, this.indexBuffer.indexUnpackFormat, objObject.initialIndex * this.indexBuffer.indexStride);
            else
                gl.drawArrays(drawMode || gl.TRIANGLES, objObject.initialVertex, objObject.vertexsNumber);
        }

    };

    /**
     * @description
     * Delete any model resources to freeze
     * used VRAM space.
     * 
     * @param {WebGLRenderingContext} gl
     * @returns {undefined}
     */
    OBJModelLoader.OBJModel.prototype.destroy = function (gl) {

        //delete any GL_BUFFERs
        this.vertexBuffer = gl.deleteBuffer(this.vertexBuffer);
        this.indexBuffer = gl.deleteBuffer(this.indexBuffer);

        //delete any GL_TEXTURES
        this.samplers.difuseSampler = gl.deleteTexture(this.samplers.difuseSampler);
        this.samplers.specularSampler = gl.deleteTexture(this.samplers.specularSampler);
        this.samplers.ambientSampler = gl.deleteTexture(this.samplers.ambientSampler);
        this.samplers.bumpSampler = gl.deleteTexture(this.samplers.bumpSampler);
        this.samplers.nsSampler = gl.deleteTexture(this.samplers.nsSampler);
        this.samplers.naSampler = gl.deleteTexture(this.samplers.naSampler);

    };

    //Renderizable Model Submodel
    ////////////////////////////////////////////////////////////////////////////
    /**
     * @constructor
     * @description
     * Make one new OBJObject named with received String and
     * asigne an unique id value.
     * 
     * @property {Number}  id              One unique object identifier value
     * @property {String}  name            Geometry declared name
     * 
     * @property {Object}  material        Define sub geometry material used
     * @property {Boolean} indexedDraw     Define if use or not INDEXED_POLIGONAL_DRAW_METHOOD to render sub model
     * 
     * @property {Number}  initialIndex    Geometry first ELEMENT_ARRAY_BUFFER index
     * @property {Number}  initialVertex   Geometry first VERTEXS_ARRAY_BUFFER index
     * @property {Number}  vertexsNumbers  Number of elemnts added to VERTEXS_ARRAY_BUFFER after begin it state  
     * @property {Number}  indexsNumbers   Number of elemnts added to ELEMENTS_ARRAY_BUFFER after begin it state
     * 
     * @property {BoundBox} bounds         Sub-geometry axis bounds
     *      
     * @param {String} name
     * @param {Number} id
     * @returns {undefined}
     */
    OBJModelLoader.OBJModel.OBJObject = function (name, id) {
        this.id = id;
        this.name = name;

        this.material = null;
        this.indexedDraw = false;

        this.initialVertex = 0;
        this.initialIndex = 0;
        this.vertexsNumber = 0;
        this.indexsNumber = 0;

        this.bounds = new BoundBox();
    };

    //Renderizable Model Instance
    ////////////////////////////////////////////////////////////////////////////
    /**
     * @description
     * Make one new model instance conatining required state
     * values to renderize one object on the 3D scene.
     * 
     * @property {Number} id                            One unique instance identifier value 
     * @property {OBJModel} model                       Rendered model used
     * @property {Float32Array[16]} transformMatrix     Instane geometry transform matrix data
     * @property {Float32Array[16]} normalMatrix        Instane normal transform matrix data  
     * @property {Number} drawMode                      WebGL Poligon, Point or Line draw mode used 
     * @property {Number} objObjcetIndex                Index of rendered model sub-geometry
     * @property {Object} coords                        Cartesians {x,y,z} coordinates of rendered model instance  
     * 
     * @param {OBJModel} model
     * @returns {OBJModelLoader.OBJModel.Instance}
     */
    OBJModelLoader.OBJModel.Instance = function (model) {
        this.id = OBJGeneratedInstanceID++;

        this.model = model;
        this.transformMatrix = new Float32Array(identityMatrix);
        this.normalMatrix = new Float32Array(identityMatrix);

        this.drawMode = model.drawMode;
        this.objObjectIndex = -1;

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

    };

    OBJModelLoader.OBJModel.Instance.prototype = Object.create(M3D.Model.Instance.prototype);

    /**
     * @description
     * Set {x, y, z} cartesina coordinates of
     * one object to locate it on a 3D space.
     * Received values are directly stored on
     * instance trasformation matrix in row 4.
     * 
     * @param {Number} x
     * @param {Number} y
     * @param {Number} z
     * @returns {undefined}
     */
    OBJModelLoader.OBJModel.Instance.prototype.setCoords = function (x, y, z) {
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
    OBJModelLoader.OBJModel.Instance.prototype.draw = function (gl) {
        var model = this.model;

        //send matrix's to shader
        gl.uniformMatrix4fv(model.shader.uniforms.mtransform, false, this.transformMatrix);
        gl.uniformMatrix4fv(model.shader.uniforms.mnormal, false, this.normalMatrix);

        //draw instance (model or submodel)
        if (this.subModelIndex < 0)
            model.draw(gl, this.drawMode);
        else
            model.drawSubmodel(gl, this.subModelIndex, this.drawMode);

    };

    /**
     * @description
     * Add to model one new required draw call
     * instance.
     * 
     * @returns {undefined}
     */
    OBJModelLoader.OBJModel.Instance.prototype.sendDrawCall = function () {
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
     * Compute new bound box edges taking max and min
     * values of other received in any axis.
     * 
     * @param {BoundBox} bound
     * @returns {undefined}
     */
    BoundBox.prototype.updateByBoundBox = function (bound) {
        bound.rigth > this.rigth && (this.rigth = bound.rigth);
        bound.left < this.left && (this.left = bound.left);
        bound.up > this.up && (this.up = bound.up);
        bound.down < this.down && (this.down = bound.down);
        bound.near > this.near && (this.near = bound.near);
        bound.far < this.far && (this.far = bound.far);
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

    //XHR Status class properties
    ////////////////////////////////////////////////////////////////////////////
    /**
     * @descriptio
     * This class only contain numerical constants
     * to representa XMLHttpRequest response codes.
     */
    function XHRStatus() {}

    /**
     * @description
     * Return HTTP status code description for
     * received status code number.
     * 
     * @param {Number} statusCode
     * @returns {String}
     */
    XHRStatus.getDescription = function(statusCode){
        switch(statusCode){
            case 200:
                return "SUSSCESS";
            case 201:
                return "CREATED";    
            case 202:
                return "ACEPTED";    
            case 301:
                return "PERMANENTLY MOVED";    
            case 400:
                return "BAD REQUEST";    
            case 401:
                return "UNAUTHORIZED";    
            case 402:
                return "PAIMENT REQUIRED";    
            case 403:
                return "FORVIDDEN";    
            case 404:
                return "FILE NOT FOUND";    
            case 405:
                return "METHOOD NOT ALLOWED";    
            case 500:
                return "INTERNAL SERVER ERROR";    
            case 501:
                return "NOT INPLEMENTED";    
            default:
                return "UNKNOW";
        }
    };

    XHRStatus.SUSSCESS = 200;
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