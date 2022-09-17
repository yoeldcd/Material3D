
/*  
 * @author Yoel David Correa Duke
 * @version v1.7.0
 * 
 * This script provide functionalitys to load obj file 
 * and cast self in valid renderable vertex data to store on 
 * data buffers and set to GPU VRAM in format.
 * of float number of 32 bits:
 * 
 */

function OBJParser() {

    var self = this;

    /*Process control varys*/
    self.invertFaces = false;
    self.materials = new Array();
    self.debug = false;
    self.onprogress;

    /*Object works values*/
    //loaded and unprocesed vertex data
    var textLines;
    var textLinesCount;
    var vertexBufferDataLoaded;
    var normalBufferDataLoaded;
    var texelBufferDataLoaded;

    //line control vales
    var lineIndex;
    var lineType;
    var beforeLineType;
    var firstFaceLineIndex;

    //procesed vertex data for models
    var bufferData;
    var drawMode;
    var objectDescriptors;
    var vertexBufferData;
    var normalBufferData;
    var texelBufferData;
    var materialIndexBufferData;
    var objectIndexBufferData;

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

    //model bunds and center
    var max, may, maz;  //max values
    var mix, miy, miz;  //min values
    var ctx, cty, ctz;  //center values

    /*Start the read process of OBJ data on plain text format */
    self.loadOBJText = function (gl, textData, modelScale) {

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

        //create model buffer data set
        bufferData.objects = objectDescriptors;
        bufferData.vertexPositions = vertexBufferData;
        bufferData.vertexNormals = normalBufferData;
        bufferData.vertexTextureCoords = texelBufferData;
        bufferData.vertexMaterialIndex = materialIndexBufferData;
        bufferData.vertexObjectIndex = objectIndexBufferData;
        bufferData.elementsIndex = null;

        //create model
        model = new Model(gl);
        model.setDrawMode(drawMode);
        model.createBufers(gl, bufferData);

        //update resume data
        time = (new Date()).getTime() - time;
        time = (time > 1000) ? (time / 1000 + ' s') : (time + ' ms');
        vertexs = bufferData.vertexPositions.length / 3;

        //show resume data of process
        console.log('%cModel totaly proccessed: \n time:\t ' + time + ' \n size:\t ' + fileSize + '\n lines:\t ' + textLinesCount + '\n vertex:\t ' + vertexs + ' \n objects:\t ' + (currentObjectIndex + 1) + '\n elements:\t ' + modelGeometrysCount, 'color: rgb(100,255,100)');
        console.log('%c file erratas ' + fileErratas, 'color: rgb(255, 100, 100);');

        resetWorkValues();
        return model;
    };

    self.loadOBJFile = function (gl, url, responseCallBack, modelScale) {

        modelScale || (modelScale = 1.0);

        var http = new XMLHttpRequest();
        var model = null;
        time = new Date().getTime();

        http.onload = function () {
            time = new Date().getTime() - time;
            time = time > 1000 ? time / 1000 + ' s' : time + ' ms';
            console.log('Model on URL ' + url + ' loaded in: ' + time + ' \n Now is processing');

            model = self.loadOBJText(gl, http.responseText, modelScale);

            !responseCallBack || responseCallBack(model);
        };

        http.onerror = function (error) {
            console.error('Error loading url: ' + url);
            !responseCallBack || responseCallBack(model, error);
        };

        http.open('GET', url, true);
        http.send(null);
    };

    self.loadOBJFiles = function (gl, urls, responseCallBack, modelScale) {

        urls || (urls = []);

        var length = urls.length;
        var http = new XMLHttpRequest();
        var models = new Array(length);
        var model;
        var url;
        var index = 0;

        http.onload = function () {
            time = new Date().getTime() - time;
            time = time > 1000 ? time / 1000 + ' s' : time + ' ms';
            console.log('Model on URL ' + url + ' loaded in: ' + time + ' \n Now is processing');

            model = self.loadOBJText(gl, http.responseText, modelScale);
            models[index - 1] = model;
            nextURL();
        };

        http.onerror = function () {
            console.error('Error loading url: ' + url);
            models[index - 1] = null;
            nextURL();
        };

        function nextURL() {
            if (index < length) {

                time = new Date().getTime();
                url = urls[index];
                index++;

                if (url) {  //load data on URL
                    http.open('GET', url, true);
                    http.send(null);

                } else {    //discard empty URL
                    models[index - 1] = null;
                    nextURL();

                }

            } else {
                !responseCallBack || responseCallBack(models);
            }
        }

        nextURL();
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

        //initialize buffers to contain loaded data
        vertexBufferDataLoaded = new Array(0);
        normalBufferDataLoaded = new Array(0);
        texelBufferDataLoaded = new Array(0);

        //initilaize model data and buffers
        objectDescriptors = new Array();
        bufferData = new VertexBufferData();
        vertexBufferData = new Array(0);
        normalBufferData = new Array(0);
        texelBufferData = new Array(0);
        materialIndexBufferData = new Array(0);
        objectIndexBufferData = new Array(0);

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
            modelObject = new ModelObject(currentSideName);
            modelObject.drawArray = true;
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

function MTLParser() {
    var self = this;

    self.debug = false;

    var lines;
    var linesCount;
    var material;
    var materials;
    var textures;
    var samplerBuilder;
    var root;

    //default samplers maps
    var blanksampler;
    var blankSubSampler;
    var blankCubeMap;

    self.multiTextureMode = true;

    self.parseMTLText = function (gl, textData, rootFolder) {

        lines = textData.split('\n');
        linesCount = lines.length;
        root = rootFolder;

        //create default material
        createDefaultMaterial(gl);

        //parse all lines on the Text
        for (var i = 0; i < linesCount; i++) {
            parseLine(gl, getLineWords(lines[i]));
        }

        return materials;
    };

    self.loadMTLFile = function (gl, url, responseCallBack) {

        var http = new XMLHttpRequest();
        var materials = null;
        var root = getURLRootPath(url);

        http.onload = function () {
            materials = self.parseMTLText(gl, http.responseText, root);
            !responseCallBack || responseCallBack(materials);
        };

        http.onerror = function () {
            console.error('Error loading url: ' + url);
            !responseCallBack || responseCallBack(materials);
        };

        http.open('GET', url, true);
        http.send(null);
    };

    self.loadMTLFiles = function (gl, urls, responseCallBack) {

        urls || (urls = []);

        var http = new XMLHttpRequest();
        var root;
        var url;
        var index = 0;
        var length = urls.length;

        http.onload = function () {
            self.parseMTLText(gl, http.responseText, root);
            nextURL();
        };

        http.onerror = function () {
            console.error('Error loading url: ' + url);
            nextURL();
        };

        function nextURL() {

            if (index < length) {
                url = urls[index];
                index++;

                if (url) {  //load data on URL
                    root = getURLRootPath(url);
                    http.open('GET', url, true);
                    http.send(null);

                } else {    //discard empty URL
                    nextURL();

                }

            } else {
                !responseCallBack || responseCallBack(materials);
            }


        }

        nextURL();
    };

    self.reset = function (gl) {

        var length;

        //delete after created textures
        if (textures) {
            length = textures.length;

            //delete each textures
            for (var i = 0; i < length; i++) {
                gl.deleteTexture(textures[i]);
            }
        }

        //reinitialize
        textures = new Array();
        materials = new Array();
        samplerBuilder = samplerBuilder || new SamplerBuilder();
        samplerBuilder.createNewSamplerGroup(gl);

    };

    self.getMaterials = function () {
        return materials;
    };

    self.saveTexturesGroup = function () {
        var response = textures;
        textures = new Array();
        return response;
    };

    self.getSamplerBuilder = function () {
        return samplerBuilder;
    };

    self.getBlankCubeMap = function (gl) {

        if (!blankCubeMap) {
            //create cubetexture
            blankCubeMap = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, blankCubeMap);

            //set default cubemap data (blank)
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));

            //close cube texture
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
        }

        return blankCubeMap;
    };

    self.getBlankSamplerMap = function (gl) {
        if (!blanksampler) {

            //create blank texture
            blanksampler = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, blanksampler);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
            gl.bindTexture(gl.TEXTURE_2D, null);
            blanksampler.url = 'blank';

        }

        return blanksampler;
    };

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
                    if (a !== ' ' && a !== '') {
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

    function joinLineWords(words, startIndex) {
        var string = '' + words[startIndex];
        var length = words.length;

        for (startIndex++; startIndex < length; startIndex++) {
            string += ' ' + words[startIndex];
        }

        return string;
    }

    function parseNumber(string, defaultValue) {
        return isNaN(number = parseFloat(string)) ? defaultValue : number;
    }

    function parseLine(gl, lineWords) {
        switch (lineWords[0]) {
            case 'newmtl':
                createMaterial(lineWords);
                break;
            case 'Kd':
                parseMaterialDifuseComponent(lineWords);
                break;
            case 'Kd':
                parseMaterialAmbientComponent(lineWords);
                break;
            case 'Ks':
                parseMaterialSpecularComponent(lineWords);
                break;
            case 'Ns':
                parseMaterialSpecularCoeficent(lineWords);
                break;
            case 'map_Kd':
                parseMaterialDifuseMap(gl, lineWords);
                break;
            case 'map_Ks':
                parseMaterialSpecularMap(gl, lineWords);
                break;
            case 'map_Ka':
                parseMaterialAmbientMap(gl, lineWords);
                break;
            case 'map_bump':
                parseMaterialBumpMap(gl, lineWords);
                break;
            default: //comentary
        }
    }

    function createMaterial(lineWords) {
        material = new Material(joinLineWords(lineWords, 1));

        if (self.multiTextureMode) {
            material.map_Kd = blanksampler;          //asigne default difuse map blank
            material.map_Ks = blanksampler;          //asigne default specular map blank
            material.map_Ka = blanksampler;          //asigne default ambient map blank
            material.map_bump = blanksampler;        //asigne default bump map blank

        } else {
            material.map_Kd_metadata = blankSubSampler;     //asigne default difuse map sub-sampler metadata
            material.map_Ks_metadata = blankSubSampler;     //asigne default speculra map sub-sampler metadata
            material.map_Ka_metadata = blankSubSampler;     //asigne default ambinet map sub-sampler metadata
            material.map_bump_metadata = blankSubSampler;   //asigne default bump map sub-sampler metadata

        }


        materials.push(material);
    }

    function parseMaterialDifuseComponent(lineWords) {
        material.Kd[0] = parseNumber(lineWords[1], 1.0);
        material.Kd[1] = parseNumber(lineWords[2], 1.0);
        material.Kd[2] = parseNumber(lineWords[3], 1.0);
        material.Kd[3] = parseNumber(lineWords[4], 1.0);
        return;
    }

    function parseMaterialSpecularComponent(lineWords) {
        material.Ks[0] = parseNumber(lineWords[1], 1.0);
        material.Ks[1] = parseNumber(lineWords[2], 1.0);
        material.Ks[2] = parseNumber(lineWords[3], 1.0);
        material.Ks[3] = parseNumber(lineWords[4], 1.0);
        return;
    }

    function parseMaterialAmbientComponent(lineWords) {
        material.Ka[0] = parseNumber(lineWords[1], 1.0);
        material.Ka[1] = parseNumber(lineWords[2], 1.0);
        material.Ka[2] = parseNumber(lineWords[3], 1.0);
        material.Ka[3] = parseNumber(lineWords[4], 1.0);
        return;
    }

    function parseMaterialSpecularCoeficent(lineWords) {
        material.Ns = parseNumber(lineWords[1], 100);
    }

    function parseMaterialDifuseMap(gl, lineWords) {
        var url = joinLineWords(lineWords, 1);

        if (self.multiTextureMode) {
            material.map_Kd = createSampler(gl, url);
        } else {
            material.map_Kd_metadata = createSubSampler(gl, url);
        }

    }

    function parseMaterialSpecularMap(gl, lineWords) {
        var url = joinLineWords(lineWords, 1);
        if (self.multiTextureMode) {
            material.map_Ks = createSampler(gl, url);
        } else {
            material.map_Ks_metadata = createSubSampler(gl, url);
        }
    }

    function parseMaterialAmbientMap(gl, lineWords) {
        var url = joinLineWords(lineWords, 1);
        if (self.multiTextureMode) {
            material.map_Ka = createSampler(gl, url);
        } else {
            material.map_Ka_metadata = createSubSampler(gl, url);
        }
    }

    function parseMaterialBumpMap(gl, lineWords) {
        var url = joinLineWords(lineWords, 1);
        if (self.multiTextureMode) {
            material.map_bump = createSampler(gl, url);
        } else {
            material.map_bump_metadata = createSubSampler(gl, url);
        }
    }

    function createDefaultMaterial(gl) {
        var material = new Material('default');


        //save material and texture
        materials || self.reset(gl);

        if (self.multiTextureMode) {

            if (!blanksampler) {

                //create blank texture
                blanksampler = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, blanksampler);
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
                gl.bindTexture(gl.TEXTURE_2D, null);
                blanksampler.url = 'blank';

            }

            //asigne material texture maps
            material.map_Kd = blanksampler;
            material.map_Ks = blanksampler;
            material.map_Ka = blanksampler;
            material.map_bump = blanksampler;

        } else {

            //create subsamplers descriptors
            blankSubSampler = samplerBuilder.addSubData(gl, new Uint8Array([255, 255, 255, 255]), 1, 1);
            blankSubSampler.w = 0;
            blankSubSampler.h = 0;

            //asigne material sub sampler
            material.map_Kd_metadata = blankSubSampler;
            material.map_Ks_metadata = blankSubSampler;
            material.map_Ka_metadata = blankSubSampler;
            material.map_bump_metadata = blankSubSampler;

        }

        //store default material on index 0
        materials[0] = material;
    }

    function createSampler(gl, url) {

        var image;
        var index = 0;
        var found = false;
        var sampler = textures[0];
        var length = textures.length;

        url = root + url;

        //search for existent sampler by URL
        if (url) {

            //search on created textures
            while (!found && index < length) {
                if (textures[index].url === url)
                    found = true;
                else
                    index++;
            }

            //if url not found create a new texture
            if (!found) {

                //create base texture sampler
                sampler = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, sampler);
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
                gl.bindTexture(gl.TEXTURE_2D, null);

                //program image load event handler
                image = new Image();
                image.onload = function () {

                    console.log('loaded image on URL ' + url);

                    //charge texture data fron loaded image
                    gl.bindTexture(gl.TEXTURE_2D, sampler);

                    //define texture parameters
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

                    //store image data
                    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

                    //close texture
                    gl.bindTexture(gl.TEXTURE_2D, null);
                    sampler.initialized = true;

                };
                image.onerror = function () {
                    console.error('Error loading image on url: ' + image.src);
                };
                image.src = url;
                sampler.url = url;

                textures.push(sampler); //save texture on array
            } else {
                console.log('sampler URL ' + url + ' already created. Copying reference fron textures[' + index + ']');
                sampler = textures[index];
            } //end else FOUND

        }

        return sampler; //return texture
    }

    function createSubSampler(gl, url) {
        return samplerBuilder.addSubImage(gl, root + url);
    }

    function getURLRootPath(url) {

        var path = url.split('/');
        var root = '';
        var length = path.length - 1;

        //create root path
        for (var i = 0; i < length; i++) {
            root += path[i] + '/';
        }

        return root;
    }

    function logTrace(message, style) {
        if (self.debug)
            console.log(message, style);
    }

    return self;
}

MTLParser.prototype.instance = new MTLParser(); //singleton

function SamplerBuilder() {
    var self = this;

    var samplers;
    var subsamplers;
    var sampler;
    var rectangles;

    var width;
    var height;

    var x;
    var y;
    var may;
    var index;

    samplers = new Array();

    self.getTexture = function () {
        return sampler;
    };

    self.createNewSamplerGroup = function (gl, texWidth, texHeight) {

        //reset subsampler section
        index = 0;
        x = 0;
        y = 0;
        may = 0;

        //define texture size
        width = texWidth || 4096;
        height = texHeight || 4096;

        //create subsampler cache
        subsamplers = new Array();

        //create rectangular areas
        rectangles = new Array();
        rectangles[0] = new Rect(0, 0, width, height);

        //store sampler reference to destroy later
        !sampler || samplers.push(sampler);

        //create and initialize a one blank texture
        sampler = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, sampler);

        //define texture parameters
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

        //add base texture data
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.bindTexture(gl.TEXTURE_2D, null);

    };

    self.destroy = function (gl) {
        for (var sampler in samplers) {
            !sampler || gl.deleteTexture(sampler);
        }
    };

    /*self.addSubImage = function (gl, url) {
     
     var response = null;
     var image = null;
     var computedX;
     var computedY;
     
     var found = false;
     var index = 0;
     var length = subsamplers.length;
     
     while (!found && index < length) {
     if (subsamplers[index].url === url)
     found = true;
     else
     index++;
     }   //end search
     
     if (!found) {
     response = new SubSampler();
     response.url = url;                 //source image URL
     subsamplers.push(response);         //store subsampler        
     
     image = new Image();
     image.onload = function () {
     
     var create = false;
     
     //texture width control
     computedX = x + image.width;
     if (computedX > width) {
     x = 0;
     y = may;
     computedX = x + image.width;
     
     if (computedX > width) {
     create = false;
     } else {
     create = true;
     }
     
     } else {
     create = true;
     }
     
     //texture height control
     computedY = y + image.height;
     if (create && computedY < height) {
     if (computedY > may)
     may = computedY;
     else
     ;
     } else {
     create = false;
     }
     
     //console.log('Create SUBSAMPLER on ' + computedX + ':' + computedY);
     
     //create a subsampler if exist a nessessary space
     if (create) {
     console.log('%cCan be store texture image on URL ' + url, 'color: lime; ');
     
     //define subsampler descriptor parameters
     response.s = x / width;              //position S on texels
     response.t = y / height;              //position T on texels
     response.w = image.width / width;    //width on texels
     response.h = image.height / height;   //height on texels
     
     //add sub-sampler data
     gl.bindTexture(gl.TEXTURE_2D, sampler);
     gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
     gl.texSubImage2D(gl.TEXTURE_2D, 0, x, y, gl.RGBA, gl.UNSIGNED_BYTE, image);
     gl.bindTexture(gl.TEXTURE_2D, null);
     
     //update X location
     x = computedX;
     
     } else {
     
     console.error('Dont have required space on sampler to store texture image on URL ' + url);
     response.url = url;                 //source image URL
     }
     
     };
     image.onerror = function () {
     console.error('Error loading texture on URL ' + url);
     };
     image.src = url;
     
     } else {
     console.log('The URL ' + url + 'has been found');
     response = subsamplers[index];
     }
     
     return response;
     };*/

    self.addSubImage = function (gl, url) {

        var response = null;
        var image = null;

        var index = 0;
        var length = subsamplers.length;
        var found = false;

        //search already loaded image URL
        while (!found && index < length) {
            if (subsamplers[index].url === url)
                found = true;
            else
                index++;
        }   //end search

        if (!found) {
            response = new SubSampler();
            response.url = url;                 //source image URL
            subsamplers.push(response);         //store subsampler        

            image = new Image();
            image.onload = function () {

                //get one rectangle fron image
                var rect = getRectangle(image.width, image.height);
                console.log('%cThe URL ' + url + ' has been loaded', ' color: rgb(200, 200, 120);');

                //create a subsampler on rectangular area
                if (rect) {

                    //define subsampler descriptor parameters
                    response.s = rect.x / width;                //position S on texels
                    response.t = rect.y / height;               //position T on texels
                    response.w = rect.w / width;                //width on texels
                    response.h = rect.h / height;               //height on texels
                    response.initialized = true;

                    //add sub-sampler image data
                    gl.bindTexture(gl.TEXTURE_2D, sampler);
                    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
                    gl.texSubImage2D(gl.TEXTURE_2D, 0, rect.x, rect.y, gl.RGBA, gl.UNSIGNED_BYTE, image);
                    gl.bindTexture(gl.TEXTURE_2D, null);

                } else {
                    response.url = url;                 //source image URL

                }

            };
            image.onerror = function () {
                console.warn('Error loading texture on URL ' + url);
            };
            image.src = url;

        } else {
            console.log('The URL ' + url + ' has been found');
            response = subsamplers[index];
        }

        return response;
    };

    /*self.addSubData = function (gl, data, subDataWidth, subDataHeight) {
     
     var response = null;
     var create = false;
     var computedX = 0;
     var computedY = 0;
     
     response = new SubSampler();
     
     //texture width control
     computedX = x + subDataWidth;
     if (computedX > width) {
     x = 0;
     y = may;
     computedX = x + subDataWidth;
     
     if (computedX > width) {
     create = false;
     } else {
     create = true;
     }
     
     } else {
     create = true;
     }
     
     //texture height control
     computedY = y + subDataHeight;
     if (create && computedY < height) {
     if (computedY > may)
     may = computedY;
     else
     ;
     } else {
     create = false;
     }
     
     //console.log('Create SUBSAMPLER on ' + computedX + ':' + computedY);
     
     //create a subsampler if exist a nessessary space
     if (create) {
     console.log('%cCan be store texture image data.', 'color: lime; ');
     
     //define subsampler descriptor parameters
     response.s = x / width;              //position S on texels
     response.t = y / height;              //position T on texels
     response.w = subDataWidth / width;    //width on texels
     response.h = subDataHeight / height;   //height on texels
     
     //add sub-sampler data
     gl.bindTexture(gl.TEXTURE_2D, sampler);
     gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
     gl.texSubImage2D(gl.TEXTURE_2D, 0, x, y, subDataWidth, subDataHeight, gl.RGBA, gl.UNSIGNED_BYTE, data);
     gl.bindTexture(gl.TEXTURE_2D, null);
     
     //update X location
     x = computedX;
     
     } else {
     console.error('Dont have required space on sampler to store texture image data ');
     
     }
     
     return response;
     };*/

    self.addSubData = function (gl, data, subDataWidth, subDataHeight) {
        var response;
        var rect;

        //get one rectangle fron image
        rect = getRectangle(subDataWidth, subDataHeight);
        response = new SubSampler();
        response.url = 'rgba(' + data[0] + ', ' + data[1] + ', ' + data[2] + ', ' + data[3] + ')';

        //create a subsampler on rectangular area
        if (rect) {

            //define subsampler descriptor parameters
            response.s = rect.x / width;                //position S on texels
            response.t = rect.y / height;               //position T on texels
            response.w = rect.w / width;                //width on texels
            response.h = rect.h / height;               //height on texels
            response.initialized = true;

            //add sub-sampler data
            gl.bindTexture(gl.TEXTURE_2D, sampler);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
            gl.texSubImage2D(gl.TEXTURE_2D, 0, rect.x, rect.y, rect.w, rect.h, gl.RGBA, gl.UNSIGNED_BYTE, data);
            gl.bindTexture(gl.TEXTURE_2D, null);

        }

        return response;
    };

    self.getRectangles = function () {
        return rectangles;
    };

    function getRectangle(w, h) {

        var response;
        var length = rectangles.length;
        var index = 0;

        var rect;
        var rect1;
        var restw;
        var resth;

        //search a one rectangle with required space
        while (index < length) {
            rect1 = rectangles[index];

            //if this rectangle have required space
            if (rect1.w >= w && rect1.h >= h) {

                if (!rect)                          //define first rectangle witch minor space
                    rect = rect1;
                else if (rect.space > rect1.space)  //define new rectangle witch minor space
                    rect = rect1;
                else
                    ;
            }

            index++;
        }

        if (rect) {

            //return required space
            response = new Rect(rect.x, rect.y, w, h);
            console.log('%cHave required space ' + response.toString(), ' color: rgb(100, 255, 100); ');

            //compute residual space
            restw = rect.w - w;
            resth = rect.h - h;

            if (restw > resth) {
                //create new sub-rectangle (HEIGHT) if exist rest of rect height
                if (resth > 0)
                    rectangles[length] = new Rect(rect.x, rect.y + h, w, resth);
                else
                    ;

                //update rectangle dimensions
                rect.x = rect.x + w;
                rect.w = restw;

            } else {
                //create new sub-rectangle (HEIGHT) if exist rest of rect height
                if (resth > 0)
                    rectangles[length] = new Rect(rect.x, rect.y + h, rect.w, resth);
                else
                    ;

                //update rectangle dimensions
                rect.x = rect.x + w;
                rect.w = restw;
                rect.h = h;
            }


        } else {
            response = null;
            console.log('%cDont have required space ' + new Rect(0, 0, w, h).toString(), ' color: rgb(255, 100, 120); ');

        }

        return response;
    }

    function Rect(x, y, w, h) {

        this.x = x || 0;
        this.y = y || 0;
        this.w = w || 0;
        this.h = h || 0;
        this.space = w * h;

        this.toString = function () {
            return 'Rect { x: ' + this.x + '; y: ' + this.y + '; width: ' + this.w + '; height: ' + this.h + '; }'
        };

        return this;
    }

    return self;
}

SamplerBuilder.prototype.instance = new SamplerBuilder();

function SubSampler() {
    var self = this;

    self.initialized = false;
    self.url = 0;
    self.s = 0;
    self.t = 0;
    self.w = 0;
    self.h = 0;

    return self;
}

function Material(name) {

    var self = this;

    //material dentifiers
    self.name = name;
    self.index = 0;

    //color components
    self.Kd = new Float32Array([1, 1, 1, 1]);
    self.Ks = new Float32Array([1, 1, 1, 1]);
    self.Ka = new Float32Array([1, 1, 1, 1]);
    self.Ns = 100;

    //samplers maps textures
    self.map_Kd = null;
    self.map_Ks = null;
    self.map_Ka = null;
    self.map_bump = null;

    //other asociable material metadata
    self.map_Ks_metadata = null;
    self.map_Kd_metadata = null;
    self.map_Ka_metadata = null;
    self.map_bump_metadata = null;

    self.sendToShader = function (gl, shader, shaderMaterialArrayName, shaderMaterialArrayIndex) {

        var materialArray = shaderMaterialArrayName + '[' + shaderMaterialArrayIndex + ']';
        var uniform;

        self.index = shaderMaterialArrayIndex;

        //Set all material properties to GPU using uniforms
        (uniform = gl.getUniformLocation(shader, materialArray + '.Kd')) ? gl.uniform4fv(uniform, self.Kd) : 0;
        (uniform = gl.getUniformLocation(shader, materialArray + '.Ks')) ? gl.uniform4fv(uniform, self.Ks) : 1;
        (uniform = gl.getUniformLocation(shader, materialArray + '.Ka')) ? gl.uniform4fv(uniform, self.Ka) : 2;
        (uniform = gl.getUniformLocation(shader, materialArray + '.Ns')) ? gl.uniform1f(uniform, self.Ns) : 3;

    };

    self.enableTextures = function (gl) {

        if (self !== Material.prototype.usedMaterialTextures) {
            Material.prototype.usedMaterialTextures = self;
            
            gl.activeTexture(gl.TEXTURE1);  //enable difuse map sampler
            !self.map_Kd || gl.bindTexture(gl.TEXTURE_2D, self.map_Kd);

            gl.activeTexture(gl.TEXTURE2);  //enable specular map sampler
            !self.map_Ks || gl.bindTexture(gl.TEXTURE_2D, self.map_Ks);

            gl.activeTexture(gl.TEXTURE3);  //enable ambient map sampler
            !self.map_Ka || gl.bindTexture(gl.TEXTURE_2D, self.map_Ka);

            gl.activeTexture(gl.TEXTURE4);  //enable bump map sampler
            !self.map_bump || gl.bindTexture(gl.TEXTURE_2D, self.map_bump);

            gl.activeTexture(gl.TEXTURE0);
        }
    };

}

Material.prototype.usedMaterialTextures = null;

function Model(gl) {
    var self = this;

    //model render control values
    var drawMode = gl.TRIANGLES;
    var drawArray = false;
    var vertexCount = 0;
    var elementsCount = 0;
    var objectsCount = 0;

    //model buffers
    var objects = [];
    var vertexPositions = null;
    var vertexNormals = null;
    var vertexTextureCoords = null;
    var vertexMaterialIndex = null;
    var vertexObjectIndex = null;
    var elementsIndex = null;

    //model event handlers
    self.onprepared = null;

    self.onbuffered = null;

    self.ondeletebuffers = null;

    self.destroy = function (gl) {

        //delete model buffers instances
        !vertexPositions || gl.deleteBuffer(vertexPositions);
        !vertexNormals || gl.deleteBuffer(vertexNormals);
        !vertexTextureCoords || gl.deleteBuffer(vertexTextureCoords);
        !vertexMaterialIndex || gl.deleteBuffer(vertexMaterialIndex);
        !vertexObjectIndex || gl.deleteBuffer(vertexObjectIndex);
        !elementsIndex || gl.deleteBuffer(elementsIndex);

        !self.ondeletebuffers || self.ondeletebuffers(gl, self);

    };

    self.createBufers = function (gl, bufferData) {

        //store buffer data
        if (bufferData instanceof VertexBufferData) {
            
            if (bufferData.vertexPositions) {
                vertexCount = bufferData.vertexPositions.length / 3;
                vertexPositions = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositions);
                gl.bufferData(gl.ARRAY_BUFFER, bufferData.vertexPositions, gl.STATIC_DRAW);
            }

            if (bufferData.vertexNormals) {
                vertexNormals = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormals);
                gl.bufferData(gl.ARRAY_BUFFER, bufferData.vertexNormals, gl.STATIC_DRAW);
            }

            if (bufferData.vertexTextureCoords) {
                vertexTextureCoords = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, vertexTextureCoords);
                gl.bufferData(gl.ARRAY_BUFFER, bufferData.vertexTextureCoords, gl.STATIC_DRAW);
            }

            if (bufferData.vertexMaterialIndex) {
                vertexMaterialIndex = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, vertexMaterialIndex);
                gl.bufferData(gl.ARRAY_BUFFER, bufferData.vertexMaterialIndex, gl.STATIC_DRAW);
            }

            if (bufferData.vertexObjectIndex) {
                vertexObjectIndex = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, vertexObjectIndex);
                gl.bufferData(gl.ARRAY_BUFFER, bufferData.vertexObjectIndex, gl.STATIC_DRAW);
            }


            if (bufferData.elementsIndex) {
                elementsIndex = gl.createBuffer();
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementsIndex);
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, bufferData.elementsIndex, gl.STATIC_DRAW);

                drawArray = false;
                elementsCount = bufferData.elementsIndex.length;

            } else {
                drawArray = true;
            }

            //close buffers
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
            
            //copy modelObjects
            if(bufferData.objects){
                objects = bufferData.objects;
                objectsCount = objects.length;
            }
            
        }   //end if valid buffer data

        !self.onbuffered || self.onbuffered(gl, self);

    };

    self.prepare = function (gl, vertexAttribs) {
        var attribute;
        var notEnable;

        if (vertexAttribs instanceof VertexAttribsSet && vertexAttribs.isInitialized()) {

            //link to VBO each enable vertex attrib 
            notEnable = (attribute = vertexAttribs.vertexPositions) < 0;
            notEnable || gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositions);
            notEnable || gl.vertexAttribPointer(attribute, 3, gl.FLOAT, false, 0, 0);

            notEnable = (attribute = vertexAttribs.vertexNormals) < 0;
            notEnable || gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormals);
            notEnable || gl.vertexAttribPointer(attribute, 3, gl.FLOAT, false, 0, 0);

            notEnable = (attribute = vertexAttribs.vertexTextureCoords) < 0;
            notEnable || gl.bindBuffer(gl.ARRAY_BUFFER, vertexTextureCoords);
            notEnable || gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);

            notEnable = (attribute = vertexAttribs.vertexMaterialIndex) < 0;
            notEnable || gl.bindBuffer(gl.ARRAY_BUFFER, vertexMaterialIndex);
            notEnable || gl.vertexAttribPointer(attribute, 1, gl.FLOAT, false, 0, 0);

            notEnable = (attribute = vertexAttribs.vertexObjectIndex) < 0;
            notEnable || gl.bindBuffer(gl.ARRAY_BUFFER, vertexObjectIndex);
            notEnable || gl.vertexAttribPointer(attribute, 1, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            drawArray || gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementsIndex);

        }   //end if valid vertex attribs

        !self.onprepared || self.onprepared(gl, self, vertexAttribs);

    };

    self.getObjects = function () {
        return objects;
    };

    self.getVertexCount = function () {
        return vertexCount;
    };

    self.getElementsCount = function () {
        return elementsCount;
    };

    self.isDrawingArray = function () {
        return drawArray;
    };

    self.getDrawMode = function () {
        return drawMode;
    };

    self.setDrawMode = function (newDrawMode) {
        return !newDrawMode || (drawMode = newDrawMode);
    };

    self.draw = function (gl) {
        var object;

        //console.log('Normal rendering ' + length + ' objects');
        for (var i = 0; i < objectsCount; i++) {
            object = objects[i];

            //get material and enable texture samplers
            material = object.material;
            material.enableTextures(gl);

            drawArray || object.drawArray    //select draw mode
                    ? gl.drawArrays(object.drawMode, object.initialVertex, object.countedVertexs)
                    : gl.drawElements(object.drawMode, object.countedIndexs, gl.UNSIGNED_SHORT, object.initialIndex * 2);

        }   //end for objects render

    };

    self.drawBuffer = function (gl, optDrawMode) {
        if (drawArray) {
            gl.drawArrays(optDrawMode || drawMode, 0, vertexCount);
        } else {
            gl.drawElements(optDrawMode || drawMode, elementsCount, gl.UNSIGNED_SHORT, 0);
        }
    };

    self.drawModelObject = function (gl, index, optDrawMode) {
        var object = objects[(index >= 0 && index < objectsCount) ? index : 0];

        object.drawArray    //select draw mode
                ? gl.drawArrays(optDrawMode || object.drawMode, object.initialVertex, object.countedVertexs)
                : gl.drawElements(optDrawMode || object.drawMode, object.countedIndexs, gl.UNSIGNED_SHORT, object.initialIndex * 2);

    };

}

function ModelObject(name) {
    var self = this;

    self.name = name;
    self.material = null;
    self.center = [0, 0, 0];
    self.limits = {
        up: 0, 
        down: 0, 
        left: 0, 
        rigth: 0, 
        zmax: 0, 
        zmin: 0
    };
    self.drawArray = false;
    self.drawMode = 0;
    self.initialVertex = 0;
    self.countedVertexs = 0;
    self.initialIndex = 0;
    self.countedIndexs = 0;

    return this;
}

function VertexBufferData() {
    var self = this;

    self.objects = null;
    self.vertexPositions = null;
    self.vertexNormals = null;
    self.vertexTextureCoords = null;
    self.vertexMaterialIndex = null;
    self.vertexObjectIndex = null;
    self.elementsIndex = null;

}

function VertexAttribsSet() {
    var self = this;
    var initialized = false;

    self.vertexPositions = -1;
    self.vertexNormals = -1;
    self.vertexTextureCoords = -1;
    self.vertexMaterialIndex = -1;
    self.vertexObjectIndex = -1;

    self.enableAttribs = function (gl) {
        self.vertexPositions < 0 || gl.enableVertexAttribArray(self.vertexPositions);
        self.vertexNormals < 0 || gl.enableVertexAttribArray(self.vertexNormals);
        self.vertexTextureCoords < 0 || gl.enableVertexAttribArray(self.vertexTextureCoords);
        self.vertexMaterialIndex < 0 || gl.enableVertexAttribArray(self.vertexMaterialIndex);
        self.vertexObjectIndex < 0 || gl.enableVertexAttribArray(self.vertexObjectIndex);

        initialized = true;
    };

    self.disableAttribs = function (gl) {
        self.vertexPositions < 0 || gl.disableVertexAttribArray(self.vertexPositions);
        self.vertexNormals < 0 || gl.disableVertexAttribArray(self.vertexNormals);
        self.vertexTextureCoords < 0 || gl.disableVertexAttribArray(self.vertexTextureCoords);
        self.vertexMaterialIndex < 0 || gl.disableVertexAttribArray(self.vertexMaterialIndex);
        self.vertexObjectIndex < 0 || gl.disableVertexAttribArray(self.vertexObjectIndex);

    };

    self.isInitialized = function () {
        return initialized;
    };

    return this;
}

function UniformsColection(shader) {
    var self = this;
    var shaderProgram = shader;
    var uniformsCount = 0;

    self.addUniformByName = function (gl, uniformName, asignedName) {
        if (shaderProgram) {
            self[asignedName || 'uniform' + uniformsCount ] = gl.getUniformLocation(shaderProgram, uniformName);
            uniformsCount++;

        }
    };

    self.setShader = function (shader) {
        shaderProgram = shader;
    };

    self.getShader = function () {
        return shaderProgram;
    };

    return self;
}