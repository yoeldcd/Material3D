
function OBJParser() {

    var self = this;

    /*Process control varys*/
    self.invertFaces = false;
    self.materials = new Array();
    self.debug = false;
    self.onprogress;

    /*Object works values*/
    //line control vales
    var lineIndex;
    var lineType;
    var beforeLineType;
    var firstFaceLineIndex;

    //loaded and unprocesed vertex data
    var textLines;
    var textLinesCount;
    var vertexBufferDataLoaded;
    var normalBufferDataLoaded;
    var texelBufferDataLoaded;

    //procesed vertex data for models
    var vertexBufferData;
    var normalBufferData;
    var texelBufferData;
    var materialIndexBufferData;
    var objectIndexBufferData;

    //geometry values
    var drawMode;
    var objectDescriptors;

    //file stats values
    var fileSize;
    var fileErratas;
    var erratas;
    var time;
    var vertexs;
    var modelGeometrysCount;
    var porcentage;
    var lastPorcentage;

    //current worked object parameters
    var currentObjectName;
    var currentObjectIndex;
    var currentObjectMaterialName;
    var currentObjectMaterialIndex;
    var currentGeometryName;
    var currentSideName;
    var isFirstObject;
    var isNewGeometryCreated;

    //stored vertex stats
    var initialModelVertexIndex;
    var currentModelVertexIndex;

    //model work data
    var scale = 1.0;
    var faceNormal;
    var lineVector;
    var vx, vy, vz;
    var nx, ny, nz;
    var ts, tt;
    var v1, v2, v3;

    //model bounds and center
    var max, may, maz;  //max values
    var mix, miy, miz;  //min values
    var ctx, cty, ctz;  //center values

    /*Start the read process of OBJ data on plain text format */
    self.parseOBJText = function (gl, textData, modelScale) {

        modelScale || (modelScale = 1.0);

        var model;
        time = new Date().getTime();

        //reset all and define work parameters
        resetWorkValues();
        scale = modelScale;
        drawMode = gl.TRIANGLES;

        //compute aproximated source size on bytes
        fileSize = computeFileSize(textData);

        //process data
        parseOBJTextData(textData);

        //cast array data
        vertexBufferData = new Float32Array(vertexBufferData);
        normalBufferData = new Float32Array(normalBufferData);
        texelBufferData = new Float32Array(texelBufferData);
        materialIndexBufferData = new Float32Array(materialIndexBufferData);
        objectIndexBufferData = new Float32Array(objectIndexBufferData);

        //create buffers
        model = new OBJModel();
        model.objects = objectDescriptors;
        model.vertexBuffer = gl.createBuffer();
        model.normalBuffer = gl.createBuffer();
        model.texelBuffer = gl.createBuffer();
        model.materialBuffer = gl.createBuffer();
        model.objectBuffer = gl.createBuffer();

        //store buffer data
        gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertexBufferData, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, normalBufferData, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, model.texelBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, texelBufferData, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, model.materialBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, materialIndexBufferData, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, model.objectBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, objectIndexBufferData, gl.STATIC_DRAW);

        //update resume data
        time = (new Date()).getTime() - time;
        time = (time > 1000) ? (time / 1000 + ' s') : (time + ' ms');
        vertexs = vertexBufferData.length / 3;

        //show resume data of process
        console.log('%cModel totaly proccessed: \n time:\t ' + time + ' \n size:\t ' + fileSize + '\n lines:\t ' + textLinesCount + '\n vertex:\t ' + vertexs + ' \n objects:\t ' + (currentObjectIndex + 1) + '\n elements:\t ' + modelGeometrysCount, 'color: rgb(100,255,100)');
        console.log('%c file erratas ' + fileErratas, 'color: rgb(255, 100, 100);');

        resetWorkValues();
        return model;
    };

    self.loadOBJFile = function (gl, url, modelScale) {

        var http = new XMLHttpRequest();
        var model = null;

        console.log('Loading Model on URL: ' + url);
        http.open('GET', url, false);

        try {
            http.send();
            model = self.parseOBJText(gl, http.responseText, modelScale);
        } catch (e) {
            console.error('Error Model on URL: ' + url);
        }

        return model;
    };

    self.loadOBJFiles = function (gl, urls, modelScale) {

        urls || (urls = []);

        var url;
        var models = new Array();
        var http = new XMLHttpRequest();

        for (var i = 0; i < urls.length; i++) {
            url = urls[i];

            if (url) {
                console.log('Loading Model on URL: ' + url);
                http.open('GET', url, false);

                try {
                    http.send(null);
                    models[models.length] = self.parseOBJText(gl, http.responseText, modelScale);
                } catch (e) {
                    console.error('Error loading Model on url: ' + url);
                    models[models.length] = null;
                }

            } else {
                models[models.length] = null;

            }

        }

        return models;
    };

    /* Compute aproximate file size of text source*/
    function computeFileSize(textData) {
        var fileSize = textData.length;

        if (fileSize >= 1000000) {
            fileSize = (fileSize / (1024 * 1024) + '').substring(0, 6) + ' Mb';
        } else if (fileSize >= 1000) {
            fileSize = (fileSize / 1024 + '').substring(0, 6) + ' Kb';
        } else {
            fileSize = fileSize + ' bytes';
        }

        return fileSize;
    }

    /*Read and parse all lines of textData to convert on renderizable model*/
    function parseOBJTextData(textData) {

        //separe lines on text of file
        textLines = textData.split('\n');
        textLinesCount = textLines.length;

        for (lineIndex = 0; lineIndex < textLinesCount; lineIndex++) {    //load each lines and proccess his
            parseLine(getLineWords(textLines[lineIndex]));
            updateProgress();
        }

        //create a last submodel metadata
        saveModelObject();
        textLines = null;

        return;
    }

    /*Read a words of each file lines and call specified operation*/
    function parseLine(words) {

        //get line command type
        updateLineType(words);

        switch (lineType) {
            case 'o':  //objects
            case 'g':  //geometry groups 
                createObject(words, lineType);          //create one new object

                break;
            case 'v':
                parseVertexPosition(words);

                break; //vertex                         (v x y z)
            case 'vn':
                parseVertexNormal(words);

                break; //vertex normal                  (vn nx ny nz)
            case 'vt':
                parseVertexTexCoord(words);

                break; //vertex texel                   (vt u v t)
            case 'f':
                addFace(words);

                break; //face                           (f V/N/T ... V/N/T)
            case 'usemtl':
                useMaterial(words);

                break; //object material definition     (usemtl material.mtl)
            default:
                lineType = null;
                //deprecate every other                     (# commentary text over the line)
        }

        return;
    }

    /*Control last face dscription begin line*/
    function updateLineType(words) {

        //save after line type
        !lineType || (beforeLineType = lineType);
        lineType = words[0];

        if (beforeLineType ? (lineType === 'f' && beforeLineType !== 'f') : false) {
            firstFaceLineIndex = lineIndex;
            //console.log('first face ' + firstFaceLineIndex);

        }
    }

    /*Compute file lines porcentage procesed*/
    function updateProgress() {

        if (self.onprogress) {
            porcentage = parseInt(lineIndex * 100 / textLinesCount);

            //update new porcentage
            if (porcentage > lastPorcentage) {
                lastPorcentage = porcentage;
                self.onprogress(porcentage);

            }
        }

    }

    /* Reset all work values */
    function resetWorkValues() {

        //reset line control values
        lineType = null;
        firstFaceLineIndex = 0;

        //reset erratas counteds
        fileErratas = 0;
        erratas = new Float32Array(10);

        //reset file progres porcentage
        lastPorcentage = 0;

        //initialize geometry buffers to contain loaded data
        vertexBufferDataLoaded = new Array();
        normalBufferDataLoaded = new Array();
        texelBufferDataLoaded = new Array();

        //initilaize model data and geometry buffers
        vertexBufferData = new Array();
        normalBufferData = new Array();
        texelBufferData = new Array();
        materialIndexBufferData = new Array();
        objectIndexBufferData = new Array();
        objectDescriptors = new Array();

        //initialize worked object information
        modelGeometrysCount = 0;
        currentObjectMaterialName = 'default';
        currentObjectMaterialIndex = 0;
        currentObjectIndex = 0;
        currentGeometryName = '';
        currentObjectName = '';
        currentSideName = '';
        isNewGeometryCreated = false;
        isFirstObject = true;

        //initialize containers of model information
        initialModelVertexIndex = 0;
        currentModelVertexIndex = 0;

        //reset model geometry limits values
        resetLimitsValues();
    }

    /* Stract all words fron line*/
    function getLineWords(line) {

        var words = new Array();
        var wordindex = 0;
        var word = '';
        var a = '';

        //for each character of line separe words and deprecate (tabulathors, carry returns and double space)
        for (var i = 0; i < line.length; i++) {
            switch (line[i]) {
                case '\r':   //deprecated carry return 
                case '\t':   //deprecated tabulator
                case ' ':
                    if (a !== ' ') {
                        words[wordindex] = word;    //add word
                        word = '';                  //reset word
                        wordindex++;                //increase position of word pointer
                    } else {
                        ; //deprecated double space f__I/T/N => f_I/T/N
                    }
                    break;
                default:
                    word += line[i];
            }//end switch

            a = line[i]; //update after character
        }//end for

        //save a last word
        if (word !== '')
            words[wordindex] = word;
        else
            ;
        //end else

        //console.log(words);
        return words;
    }

    /*Join a words on string array on final string*/
    function joinLineWords(words, startIndex) {
        var string = '' + words[startIndex];
        var length = words.length;

        for (startIndex++; startIndex < length; startIndex++) {
            string += ' ' + words[startIndex];
        }

        return string;
    }

    /* Stract numeric vector fron line */
    function parseLineVector(vectorLineIndex, expectedVectorSize) {
        var words;
        var wordsCount;
        var vector = [0, 0, 0];

        //validate and stract text line data
        if (vectorLineIndex >= 0 && vectorLineIndex < textLinesCount) {
            words = getLineWords(textLines[vectorLineIndex]);
            wordsCount = words.length;

            //store vector data
            vector[0] = wordsCount > 1 ? parseFloat(words[1]) : 0.0;
            vector[1] = wordsCount > 2 ? parseFloat(words[2]) : 0.0;
            vector[2] = wordsCount > 3 ? parseFloat(words[3]) : 0.0;

            //log erratas
            if (wordsCount - 1 < expectedVectorSize)
                logErrata(1, 'Espected vector size ' + expectedVectorSize + ' but only habe ' + (wordsCount - 1) + ' line ' + vectorLineIndex + ' : "' + textLines[vectorLineIndex] + '" over to ' + firstFaceLineIndex);


        } else {
            logErrata(2, 'Invalid line index at ' + vectorLineIndex + '/' + textLinesCount);
        }

        return vector;
    }

    /*Extrad vertex components data of line and add to vertexBuffer*/
    function parseVertexPosition(words) {
        vertexBufferDataLoaded.push(parseFloat(words[1]) * scale);
        vertexBufferDataLoaded.push(parseFloat(words[2]) * scale);
        vertexBufferDataLoaded.push(parseFloat(words[3]) * scale);

        return;
    }

    /*Extrad vertex normal components data of line and add to normalBuffer*/
    function parseVertexNormal(words) {
        normalBufferDataLoaded.push(parseFloat(words[1]));
        normalBufferDataLoaded.push(parseFloat(words[2]));
        normalBufferDataLoaded.push(parseFloat(words[3]));

        return;
    }

    /*Extrad vertex uv texture components data of line and add to texelBuffer*/
    function parseVertexTexCoord(words) {
        texelBufferDataLoaded.push(parseFloat(words[1]));
        texelBufferDataLoaded.push(parseFloat(words[2]));

        return;
    }

    /*Read a word and stract face structure components on self*/
    function parseIndexedStructure(word) {

        var struct = [NaN, NaN, NaN];  //structure I/T/N
        var structindex = 0;
        var data = '';

        /*Trace each characters and strcact numeric value of face component*/
        for (var i = 0; i < word.length; i++) {
            if (word[i] !== '/') {
                data += word[i];
            } else {
                struct[structindex] = (data.length > 0) ? parseInt(data) : NaN;
                structindex++;
                data = '';
            }
        }

        //save a last component
        struct[structindex] = (data.length > 0) ? parseInt(data) : NaN;

        return struct;
    }

    /*Save a current submodel buffered data and reset buffers to create a new submodel*/
    function createObject(words, type) {

        var name = joinLineWords(words, 1);

        //save a current model object values
        if (modelGeometrysCount > 0)
            saveModelObject();
        else
            ;

        //define a parameters of new object
        switch (type) {
            case 'o':
                isNewGeometryCreated = true;

                currentObjectName = name;
                currentGeometryName = '';
                currentSideName = '';

                //discount first created object
                if (isFirstObject)
                    isFirstObject = false;
                else
                    currentObjectIndex++;

                break;

            case 'g':
                isNewGeometryCreated = true;

                currentGeometryName = name;
                currentSideName = '';

                //discount first created object
                if (isFirstObject)
                    isFirstObject = false;
                else
                    currentObjectIndex++;

                break;

            case 's':
                isNewGeometryCreated = false;
                currentSideName = currentObjectName + '_side:_' + name;

                break;
        }

        currentSideName = currentObjectName + '_geom_' + currentGeometryName + '_side_' + currentSideName;
        logTrace('New model { ' + type + ': ' + currentSideName + ' } at index [' + modelGeometrysCount + ']', 'color: rgb(100, 255, 100)');
        modelGeometrysCount++;

    }

    /*Create a subobject instance metadata and storeon submodels metadata array*/
    function saveModelObject() {

        //create a submodel descriptor and store
        var modelObject;
        var countedVertexs = (currentModelVertexIndex - initialModelVertexIndex);

        //evit insert empty objects
        if (countedVertexs > 0) {

            //create object descriptor
            modelObject = new OBJObject(currentSideName);
            modelObject.drawMode = drawMode;
            modelObject.material = self.materials[currentObjectMaterialIndex];
            modelObject.initialVertex = initialModelVertexIndex;
            modelObject.countedVertexs = countedVertexs;

            //compute object center
            computeCenter();
            modelObject.center[0] = ctx;
            modelObject.center[1] = cty;
            modelObject.center[2] = ctz;

            //define object limits
            modelObject.limits.rigth = max;
            modelObject.limits.left = mix;
            modelObject.limits.up = may;
            modelObject.limits.down = miy;
            modelObject.limits.zmax = maz;
            modelObject.limits.zmin = miz;

            //reset objects work limits
            resetLimitsValues();

            //store object descriptor on object list
            objectDescriptors.push(modelObject);

            //update initial value
            initialModelVertexIndex = currentModelVertexIndex;
        }

        return;
    }

    /* Use coordinates of three face vertex to compute face normal direction*/
    function computeFaceNormal(p1, p2, p3) {

        //calculo la normal de la cara basada en las coordenadas de 3 puntos de esta
        var pt1 = [vertexBufferDataLoaded[p1 * 3], vertexBufferDataLoaded[p1 * 3 + 1], vertexBufferDataLoaded[p1 * 3 + 2]];
        var pt2 = [vertexBufferDataLoaded[p2 * 3], vertexBufferDataLoaded[p2 * 3 + 1], vertexBufferDataLoaded[p2 * 3 + 2]];
        var pt3 = [vertexBufferDataLoaded[p3 * 3], vertexBufferDataLoaded[p3 * 3 + 1], vertexBufferDataLoaded[p3 * 3 + 2]];

        /*ALGORITMO EXTERNO*/
        //creo los arrays que contienen los datos de vectores usados para calcular la normal
        var v0 = [pt1[0] - pt2[0], pt1[1] - pt2[1], pt1[2] - pt2[2]];
        var v1 = [pt3[0] - pt2[0], pt3[1] - pt2[1], pt3[2] - pt2[2]];

        //cross product
        var c = [0.0, 0.0, 0.0];
        c[0] = v0[1] * v1[2] - v0[2] * v1[1];
        c[1] = v0[2] * v1[0] - v0[0] * v1[2];
        c[2] = v0[0] * v1[1] - v0[1] * v1[0];

        //length of vector
        var norma = Math.sqrt(c[0] * c[0] + c[1] * c[1] + c[2] * c[2]);

        //normalize vector if is posible
        if (norma !== 0) {
            c[0] /= norma;
            c[1] /= norma;
            c[2] /= norma;
        }

        //invert a vector components values
        c[0] *= -1;
        c[1] *= -1;
        c[2] *= -1;

        return c;
    }

    /*Compute texel coordinate*/
    function computeTexelValue(vt) {
        var abs = vt >= 0 ? vt : -vt;

        if (abs <= 1 && vt < 0)
            vt = 1.0 - vt;

        return vt;
    }

    /*Using a face structure line define a sub triangles on the model face*/
    function addFace(words) {

        faceNormal = null;

        //declare structures for three vertex of triangles face
        v1 = parseIndexedStructure(words[1]);
        v2 = parseIndexedStructure(words[2]);
        v3 = parseIndexedStructure(words[3]);

        //calcule face normal if not is defined in the face structure NaN value I/T/N
        if (isNaN(v1[2]))
            faceNormal = computeFaceNormal(v1[0] - 1, v2[0] - 1, v3[0] - 1); //compute face normal
        else
            faceNormal = [0, 0, 0];
        //end else

        if (words.length > 4) {   //if face vertex is of more of 3 vertex cast face using triangles

            for (var i = 2; i < (words.length - 1); i++) {
                v2 = parseIndexedStructure(words[i]);
                v3 = parseIndexedStructure(words[i + 1]);
                addTriangle(v1, v2, v3, faceNormal);
            }

        } else {                //else only add one triangle
            addTriangle(v1, v2, v3, faceNormal);
        }

        return;
    }

    /*Add a subtriangle of model face using a vertex face structure*/
    function addTriangle(v1, v2, v3, normal) {      //add triangle face based on index of structure

        if (self.invertFaces)
            invertFace(v1, v3);
        else
            ;
        //end

        //add vertex data , three vertex because is an triangle
        addFaceVertex(v1[0]);
        addFaceVertex(v2[0]);
        addFaceVertex(v3[0]);

        addFaceTexels(v1[1]);
        addFaceTexels(v2[1]);
        addFaceTexels(v3[1]);

        addFaceNormal(v1[2], normal[0], normal[1], normal[2]);
        addFaceNormal(v2[2], normal[0], normal[1], normal[2]);
        addFaceNormal(v3[2], normal[0], normal[1], normal[2]);

        //add face materials index
        materialIndexBufferData.push(currentObjectMaterialIndex);
        materialIndexBufferData.push(currentObjectMaterialIndex);
        materialIndexBufferData.push(currentObjectMaterialIndex);

        //add face object index
        objectIndexBufferData.push(currentObjectIndex);
        objectIndexBufferData.push(currentObjectIndex);
        objectIndexBufferData.push(currentObjectIndex);

        //add a number of face vertex = 3 because is added a triangle
        currentModelVertexIndex += 3;

    }

    /*Invert face orientation modifying a vertex ordin CW --> CCW*/
    function invertFace(vA, vB) {

        //This function corrige the direction of vertex of face
        //interchanging a ordin of face vertexs index
        //EXAMPLE 1/2/3 -> 3/2/1 the second vertex dont is modified

        var t = vA[0];
        vA[0] = vB[0];
        vB[0] = t;

        t = vA[1];
        vA[1] = vB[1];
        vB[1] = t;

        t = vA[2];
        vA[2] = vB[2];
        vB[2] = t;

        return;
    }

    /*Using a face component value load refered index of vertex on vertexBuffer and save on model vertexBuffer */
    function addFaceVertex(index) {

        if (isNaN(index)) {
            vx = 0.0;
            vy = 0.0;
            vz = 0.0;

        } else if (index > 0) {
            index -= 1;
            vx = vertexBufferDataLoaded[index * 3];
            vy = vertexBufferDataLoaded[index * 3 + 1];
            vz = vertexBufferDataLoaded[index * 3 + 2];

        } else {
            lineVector = parseLineVector(firstFaceLineIndex + (index * 3), 3);
            vx = lineVector[0] * scale;
            vy = lineVector[1] * scale;
            vz = lineVector[2] * scale;

        }

        //update geometry limits
        updateLimits(vx, vy, vz);

        //store model buffer data
        vertexBufferData.push(vx);
        vertexBufferData.push(vy);
        vertexBufferData.push(vz);

        return;
    }

    /*Using a face component value load refered index of normal on texelBuffer and save on model normalBuffer */
    function addFaceNormal(index, fnx, fny, fnz) {

        if (isNaN(index)) {
            nx = fnx;
            ny = fny;
            nz = fnz;

        } else if (index > 0) {
            index -= 1;
            nx = normalBufferDataLoaded[index * 3];
            ny = normalBufferDataLoaded[index * 3 + 1];
            nz = normalBufferDataLoaded[index * 3 + 2];

        } else {
            lineVector = parseLineVector(firstFaceLineIndex + (index * 3) + 1, 3);

            nx = lineVector[0];
            ny = lineVector[1];
            nz = lineVector[2];

        }

        //store model buffer data
        normalBufferData.push(nx);
        normalBufferData.push(ny);
        normalBufferData.push(nz);

        return;
    }

    /*Using a face component value load refered index of texel on texelBuffer and save on model texelBuffer */
    function addFaceTexels(index) {

        if (isNaN(index)) {
            ts = 0.5;
            tt = 0.5;

        } else if (index > 0) {
            index -= 1;
            ts = texelBufferDataLoaded[index * 2];
            tt = texelBufferDataLoaded[index * 2 + 1];

        } else {
            lineVector = parseLineVector(firstFaceLineIndex + (index * 3) + 2, 2);
            ts = lineVector[0];
            tt = lineVector[1];

        }

        //store model buffer data
        texelBufferData.push(computeTexelValue(ts));
        texelBufferData.push(computeTexelValue(tt));

        return;
    }

    /* Search one material on materials array to apply on object*/
    function searchMaterialByName(materialArray, materialName) {

        var response = -1;
        var index = 0;
        var length = materialArray.length;

        //search on materials array
        while (response === -1 && index < length) {
            if (materialArray[index].name === materialName)
                response = index;
            else
                index++;
        }

        if (response === -1)
            logErrata(3, 'Cant found the material: ' + materialName);
        else
            logTrace(': Material ' + materialName + ' has been found. ', 'color: lime; ');

        return response;
    }

    /* Apply material on current object*/
    function useMaterial(words) {

        var materialName = joinLineWords(words, 1);
        var materialIndex;

        //eval if is used one diferent material
        if (materialName !== currentObjectMaterialName) {
            materialIndex = searchMaterialByName(self.materials, materialName);

            //create a new side gemetry to receive material
            if (!isNewGeometryCreated)
                createObject(words, 's');
            else
                isNewGeometryCreated = false;

            //define current material index
            if (materialIndex !== -1) {
                currentObjectMaterialIndex = materialIndex;
                currentObjectMaterialName = materialName;
            } else {
                currentObjectMaterialIndex = 0;
                currentObjectMaterialName = 'default';
            }
        }

        return;
    }

    /* Compare vertex position values and define max and min values */
    function updateLimits(vx, vy, vz) {

        !(vx > max) || (max = vx);
        !(vx < mix) || (mix = vx);
        !(vy > may) || (may = vy);
        !(vy < miy) || (miy = vy);
        !(vz > maz) || (maz = vz);
        !(vz < miz) || (miz = vz);

        return;
    }

    /*reset any limits values*/
    function resetLimitsValues() {
        mix = 99999999999;
        max = -99999999999;
        miy = 99999999999;
        may = -99999999999;
        miz = 99999999999;
        maz = -99999999999;
    }

    /* Using limits compute a medium value C = (X1+X2)/2 */
    function computeCenter() {
        ctx = (mix + max) / 2;
        cty = (miy + may) / 2;
        ctz = (miz + maz) / 2;

        return;
    }

    /* Log defined Errata */
    function logErrata(errataType, message) {

        if (self.debug && erratas[errataType] <= 0)
            console.error(lineIndex + ' : ' + message);

        erratas[errataType]++;
        fileErratas++;
    }

    /* Log process trace */
    function logTrace(message, style) {
        if (self.debug)
            console.log('%c' + lineIndex + ' : ' + message, style);
    }

    return this;
}

OBJParser.prototype.instance = new OBJParser(); //singleton

function OBJObject(name) {

    this.name = name;
    this.material = null;
    this.center = [0, 0, 0];
    this.limits = {
        up: 0,
        down: 0,
        left: 0,
        rigth: 0,
        zmax: 0,
        zmin: 0
    };
    this.drawMode = 0;
    this.initialVertex = 0;
    this.countedVertexs = 0;

    return this;
}
