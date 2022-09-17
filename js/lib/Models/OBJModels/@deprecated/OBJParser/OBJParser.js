
function OBJParser() {}

OBJParser.prototype.imageCache = new Array();

OBJParser.prototype.debug = false;

OBJParser.prototype.loadOBJFile = function (gl, rootPath, fileName) {
    var XHR = new XMLHttpRequest();
    var model = null;
    var url = rootPath + '/' + fileName;
    var source = null;

    try {
        XHR.open('GET', url, false);      //shysncronized request
        XHR.send(null);
        source = XHR.responseText;

        this.log('LOG: Loaded OBJ Model on URL ' + url);
    } catch (e) {
        console.error('ERROR: Loading OBJ Model on URL ' + url);
    }

    if (source)
        model = this.parseOBJText(gl, rootPath, source);

    return model;
};

OBJParser.prototype.parseOBJText = function (gl, rootPath, source) {

    var lines = source.split('\n');
    var linesNumber = lines.length;
    var workGroup = this.createNewWorkGroup(gl, rootPath, lines);
    var lineWords = null;

    //parse each lines of source
    for (var i = 0; i < linesNumber; i++) {
        lineWords = this.getLineWords(lines[i]);
        workGroup.currentLine = i;

        if (lineWords.length > 1) {
            this.parseOBJLine(workGroup, lineWords);
        }

    }   //end for

    //delete source text
    workGroup.lines = lines = null;

    //store model data
    this.saveCurrentOBJElement(workGroup);
    this.createRenderLists(workGroup);
    this.storeBufferData(workGroup);

    return this.saveOBJModel(workGroup);
};

OBJParser.prototype.createNewWorkGroup = function (gl, rootPath, lines) {

    rootPath || (rootPath = '');
    lines || (lines = []);

    var workGroup = new Object();

    //XHR services
    workGroup.XHR = new XMLHttpRequest();

    //WebGL context & self reference
    workGroup.gl = gl;
    workGroup.self = this;

    //file info
    workGroup.lines = lines;
    workGroup.rootPath = rootPath;

    //loaded vertex data
    workGroup.loadedVertexCoords = new Array();
    workGroup.loadedVertexNormals = new Array();
    workGroup.loadedVertexTexCoords = new Array();

    //stored buffer data
    workGroup.vertexBuffer = new Array();
    workGroup.indexBuffer = new Array();
    
    //stored elements
    workGroup.materials = new Array();
    workGroup.elements = new Array();
    workGroup.objects = new Array();
    workGroup.renderLists = new Array();

    //worked resource stats
    workGroup.numLines = lines.length;
    workGroup.numMaterials = 0;
    workGroup.numVertexs = 0;
    workGroup.numIndexs = 0;
    workGroup.numElements = 0;
    workGroup.numObjects = 0;

    //current work elements
    workGroup.currentLineNumber = 0;
    workGroup.currentMaterial = null;
    workGroup.currentElement = null;
    workGroup.currentObjects = null;
    
    //create initial material
    this.createNewMTLMaterial(workGroup, 'default');
    workGroup.currentMaterial = workGroup.materials[0];

    //create initial object
    this.createNewOBJObject(workGroup, null);

    return workGroup;
};

OBJParser.prototype.getLineWords = function (line) {
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

OBJParser.prototype.joinLineWords = function (words, inice, end) {
    inice !== undefined || (inice = 0);
    end !== undefined || (end = words.length);

    var line = '';

    for (var i = inice; i < end; i++) {
        line += words[i] + ' ';
    }

    return line;
};

OBJParser.prototype.parseIndexedStructure = function (word) {

    var struct = new Object();
    var components = word.split('/');

    //parse struct component (v v/n/t , v//t , v/n)
    struct.vertex = this.parseInt(components[0], NaN) - 1;
    struct.texel = this.parseInt(components[1], NaN) - 1;
    struct.normal = this.parseInt(components[2], NaN) - 1;

    return struct;
};

OBJParser.prototype.parseInt = function (value, defaultValue) {
    var number;
    return value !== undefined && !isNaN(number = parseInt(value)) ? number : defaultValue;
};

OBJParser.prototype.parseFloat = function (value, defaultValue) {
    var number;
    return value !== undefined && !isNaN(number = parseFloat(value)) ? number : defaultValue;
};

OBJParser.prototype.parseOBJLine = function (workGroup, words) {

    switch (words[0]) {
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
            this.storeLoadedVertexCoords(workGroup, words);
            break;

        case 'vn':
            this.storeLoadedVertexNormals(workGroup, words);
            break;

        case 'vt':
            this.storeLoadedVertexTexCoords(workGroup, words);
            break;

        case 'f':
            this.addFace(workGroup, words);
            break;
    }

};

OBJParser.prototype.createNewOBJObject = function (workGroup, name) {

    var object;
    var numObjects = workGroup.numObjects;

    //create new object
    object = new Object();
    object.name = name ? name : 'newObject_' + numObjects;
    object.elements = new Array();

    //store a new object
    workGroup.currentObject = object;
    workGroup.objects.push(object);
    workGroup.numObjects ++;

    this.log('\tCreated new OBJObject name: ' + object.name);

    //create an new element instance
    this.createNewOBJElement(workGroup, object.name, true);    //forze element creation

};

OBJParser.prototype.saveCurrentOBJElement = function (workGroup) {

    var element = workGroup.currentElement;
    var saved = false;

    //store last element final vertex Index
    if (workGroup.numElements > 0) {
        element.lastIndex = workGroup.numIndexs - 1;
        element.numIndexs = element.lastIndex - element.initialIndex + 1;
        saved = element.numIndexs > 0;

    }

    this.log('\t\tSaving current Element. saved = ' + saved);
    return saved;
};

OBJParser.prototype.createNewOBJElement = function (workGroup, name, forceNew) {

    var element;
    var saved;

    var numIndexs = workGroup.numIndexs;
    var numElements = workGroup.numElements;

    //store current element
    saved = this.saveCurrentOBJElement(workGroup);

    //create one new element and store
    if (saved | forceNew) {
        element = new Object();

        //define elements instance properties
        element.id = numElements;
        element.name = name ? name : 'newElement_' + numElements;
        element.material = workGroup.currentMaterial;
        element.initialIndex = numIndexs;
        element.lastIndex = -1;
        element.numIndexs = 0;

        //store new element and asigned to object
        workGroup.currentObject.elements.push(element);
        workGroup.elements.push(element);
        workGroup.numElements++;

        //define worked element
        workGroup.currentElement = element;

        this.log('\t\t\tCreated new OBJElement. name: ' + element.name + '\n\n');

    } else {
        workGroup.currentElement.material = workGroup.currentMaterial;
        this.log('\t\t\tChanged current OBJElement material.\n\n');

    }

};

OBJParser.prototype.storeLoadedVertexCoords = function (workGroup, words) {
    workGroup.loadedVertexCoords.push(this.parseFloat(words[1], 0.0));
    workGroup.loadedVertexCoords.push(this.parseFloat(words[2], 0.0));
    workGroup.loadedVertexCoords.push(this.parseFloat(words[3], 0.0));

};

OBJParser.prototype.storeLoadedVertexNormals = function (workGroup, words) {
    workGroup.loadedVertexNormals.push(this.parseFloat(words[1], 0.0));
    workGroup.loadedVertexNormals.push(this.parseFloat(words[2], 0.0));
    workGroup.loadedVertexNormals.push(this.parseFloat(words[3], 0.0));

};

OBJParser.prototype.storeLoadedVertexTexCoords = function (workGroup, words) {
    workGroup.loadedVertexTexCoords.push(this.parseFloat(words[1], 0.0));
    workGroup.loadedVertexTexCoords.push(this.parseFloat(words[2], 0.0));

};

OBJParser.prototype.storeVertexCoords = function (workGroup, struct) {
    var index = struct.vertex;
    var x = 0;
    var y = 0;
    var z = 0;

    if (!isNaN(index) && index >= 0) {
        index = index * 3;
        x = workGroup.loadedVertexCoords[index];
        y = workGroup.loadedVertexCoords[index + 1];
        z = workGroup.loadedVertexCoords[index + 2];
    }

    workGroup.vertexBuffer.push(x);
    workGroup.vertexBuffer.push(y);
    workGroup.vertexBuffer.push(z);

};

OBJParser.prototype.storeVertexNormal = function (workGroup, struct, faceNormal) {

    var index = struct.normal;
    var nx = faceNormal[0];
    var ny = faceNormal[1];
    var nz = faceNormal[2];
    
    if (!isNaN(index) && index >= 0) {
        index = index * 3;
        nx = workGroup.loadedVertexNormals[index];
        ny = workGroup.loadedVertexNormals[index + 1];
        nz = workGroup.loadedVertexNormals[index + 2];

    }

    workGroup.vertexBuffer.push(nx);
    workGroup.vertexBuffer.push(ny);
    workGroup.vertexBuffer.push(nz);

};

OBJParser.prototype.storeVertexTexCoords = function (workGroup, struct) {
    var index = struct.texel;
    var ts = 0.0;
    var tt = 0.0;

    if (!isNaN(index) && index >= 0) {
        index = index * 2;
        ts = workGroup.loadedVertexTexCoords[index];
        tt = workGroup.loadedVertexTexCoords[index + 1];

    }

    workGroup.vertexBuffer.push(ts);
    workGroup.vertexBuffer.push(tt);

};

OBJParser.prototype.storeBufferData = function (workGroup) {

    var gl = workGroup.gl;
    var targetBuffer;
    var vertexBuffer;
    var indexBuffer;

    var numVertexs = workGroup.numVertexs;
    var numIndexs = workGroup.numIndexs;

    var vertexData = new ArrayBuffer(numVertexs * 20);
    var vertexDataView = new DataView(vertexData);

    var arrayIndex = 0;
    var viewIndex = 0;

    this.log('LOG: Storing model GL_BUFFER vertex: ' + numVertexs + ' index: ' + numIndexs);

    //delete residual and unnessessary memory
    workGroup.loadedVertexCoords = null;
    workGroup.loadedVertexNormals = null;
    workGroup.loadedVertexTexCoords = null;
    
    //store buffer data
    for (var i = 0; i < numVertexs; i++) {
        viewIndex = 20 * i;
        arrayIndex = 8 * i;

        // [v v v v | v v v v | v v v v | n | n | n | 0 | t t | t t ]

        vertexDataView.setFloat32(viewIndex, workGroup.vertexBuffer[arrayIndex], true);
        vertexDataView.setFloat32(viewIndex + 4, workGroup.vertexBuffer[arrayIndex + 1], true);
        vertexDataView.setFloat32(viewIndex + 8, workGroup.vertexBuffer[arrayIndex + 2], true);

        vertexDataView.setUint8(viewIndex + 12, workGroup.vertexBuffer[arrayIndex + 3] * 0x7F);
        vertexDataView.setUint8(viewIndex + 13, workGroup.vertexBuffer[arrayIndex + 4] * 0x7F);
        vertexDataView.setUint8(viewIndex + 14, workGroup.vertexBuffer[arrayIndex + 5] * 0x7F);
        vertexDataView.setUint8(viewIndex + 15, 0);

        vertexDataView.setUint16(viewIndex + 16, workGroup.vertexBuffer[arrayIndex + 6] * 0xFFFF, true);
        vertexDataView.setUint16(viewIndex + 18, workGroup.vertexBuffer[arrayIndex + 7] * 0xFFFF, true);

    }

    //save procesed data and clear unused memory
    workGroup.vertexBuffer = vertexData;

    //store vertex data on one GL_BUFFER
    vertexBuffer = gl.createBuffer();
    targetBuffer = gl.ARRAY_BUFFER;
    gl.bindBuffer(targetBuffer, vertexBuffer);
    gl.bufferData(targetBuffer, workGroup.vertexBuffer, gl.STATIC_DRAW);
    gl.bindBuffer(targetBuffer, null);

    //store index data on one GL_BUFFER
    indexBuffer = gl.createBuffer();
    targetBuffer = gl.ELEMENT_ARRAY_BUFFER;
    gl.bindBuffer(targetBuffer, indexBuffer);
    gl.bufferData(targetBuffer, workGroup.indexBuffer, gl.STATIC_DRAW);
    gl.bindBuffer(targetBuffer, null);

    //save buffers
    workGroup.vertexBuffer = vertexBuffer;
    workGroup.indexBuffer = indexBuffer;

};

OBJParser.prototype.createRenderLists = function (workGroup) {

    var elements = workGroup.elements;
    var length = elements.length;

    //elements sort values 
    var maxID;
    var maxIDindex;
    var tempValue;

    //index storage values
    var indexBuffer;
    var initialIndex;
    var lastIndex;
    var numIndexs;
    var element;

    //render lists values
    var renderLists;
    var currentRenderList;
    var currentRenderListIndex;
    var currentRenderListMaterialID;

    //selection sort from elements
    for (var i = 0; i < length; i++) {
        maxID = 0;
        maxIDindex = elements[0].material.id;

        for (var j = 0; j < length - i; j++) {
            tempValue = elements[j].material.id;
            if (tempValue > maxID) {
                maxID = tempValue;
                maxIDindex = j;

            }
        }

        //interchange last index
        tempValue = elements[length - i - 1];
        elements[length - i - 1] = elements[maxIDindex];
        elements[maxIDindex] = tempValue;

    }

    //store index buffer data of shorted elements and create render lists
    currentRenderList = null;
    currentRenderListIndex = 0;
    currentRenderListMaterialID = -1;
    renderLists = new Array(workGroup.numMaterials);

    //new store data stats
    numIndexs = 0;
    indexBuffer = new Uint16Array(workGroup.numIndexs);

    //store elements index for each (shorted) elements
    for (var i = 0; i < length; i++) {

        element = elements[i];
        initialIndex = element.initialIndex;
        lastIndex = element.lastIndex;

        element.initialIndex = numIndexs;

        //create new render list when change material ID
        if (element.material.id !== currentRenderListMaterialID) {
            currentRenderListMaterialID = element.material.id;

            //save current RenderObjectList
            if (currentRenderListIndex > 0) {
                currentRenderList = renderLists[currentRenderListIndex - 1];
                currentRenderList.lastIndex = numIndexs - 1;
                currentRenderList.numIndexs = currentRenderList.lastIndex - currentRenderList.initialIndex + 1;
            }

            //create and store new RenderListObject
            currentRenderList = new Object();
            currentRenderList.material = workGroup.materials[currentRenderListMaterialID];
            currentRenderList.initialIndex = numIndexs;
            renderLists[currentRenderListIndex] = currentRenderList;

            currentRenderListIndex++;
        }


        //store element index data (shorted)
        for (var j = initialIndex; j <= lastIndex; j++) {
            indexBuffer[numIndexs] = workGroup.indexBuffer[j];
            numIndexs++;
        }

        //update new last index
        element.lastIndex = numIndexs - 1;

    }   //end for

    //save last RenderListObject
    if (currentRenderListIndex > 0) {
        currentRenderList = renderLists[currentRenderListIndex - 1];
        currentRenderList.lastIndex = numIndexs - 1;
        currentRenderList.numIndexs = currentRenderList.lastIndex - currentRenderList.initialIndex + 1;
    }

    //store on workGroup
    workGroup.indexBuffer = indexBuffer;
    workGroup.renderLists = renderLists;

};

OBJParser.prototype.computeFaceNormal = function (workGroup, v1, v2, v3) {

    var p1 = [workGroup.loadedVertexCoords[v1.vertex * 3], workGroup.loadedVertexCoords[v1.vertex * 3 + 1], workGroup.loadedVertexCoords[v1.vertex * 3 + 2]];
    var p2 = [workGroup.loadedVertexCoords[v2.vertex * 3], workGroup.loadedVertexCoords[v2.vertex * 3 + 1], workGroup.loadedVertexCoords[v2.vertex * 3 + 2]];
    var p3 = [workGroup.loadedVertexCoords[v3.vertex * 3], workGroup.loadedVertexCoords[v3.vertex * 3 + 1], workGroup.loadedVertexCoords[v3.vertex * 3 + 2]];

    //creo los arrays que contienen los datos de vectores usados para calcular la normal
    var v0 = [p1[0] - p2[0], p1[1] - p2[1], p1[2] - p2[2]];
    var v1 = [p3[0] - p2[0], p3[1] - p2[1], p3[2] - p2[2]];

    //cross product
    var normal = [0.0, 0.0, 0.0];
    normal[0] = v0[1] * v1[2] - v0[2] * v1[1];
    normal[1] = v0[2] * v1[0] - v0[0] * v1[2];
    normal[2] = v0[0] * v1[1] - v0[1] * v1[0];

    //length of vector
    var norma = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1] + normal[2] * normal[2]);

    //normalize vector if is posible
    if (norma !== 0) {
        normal[0] /= norma;
        normal[1] /= norma;
        normal[2] /= norma;
    }

    //invert a vector components values
    normal[0] *= -1;
    normal[1] *= -1;
    normal[2] *= -1;

    return normal;
};

OBJParser.prototype.addFace = function (workGroup, words) {

    var numVertexs = workGroup.numVertexs;
    var numPoints = words.length - 1;
    var structs = new Array(numPoints);

    //parse face indexed structues
    for (var i = 0; i < numPoints; i++) {
        structs[i] = this.parseIndexedStructure(words[i + 1]);
    }

    //compute default face normal
    var faceNormal = this.computeFaceNormal(workGroup, structs[0], structs[1], structs[2]);

    //store face vertexs on buffer
    for (var i = 0; i < numPoints; i++) {
        this.storeVertexCoords(workGroup, structs[i]);
        this.storeVertexNormal(workGroup, structs[i], faceNormal);
        this.storeVertexTexCoords(workGroup, structs[i]);
    }
    
    //update a number of stored vertexs on buffer
    workGroup.numVertexs += numPoints;

    //store face index on buffer (N side's poligon 2 triangles)
    for (var i = 1; i < numPoints - 1; i++) {

        workGroup.indexBuffer.push(numVertexs);
        workGroup.indexBuffer.push(numVertexs + i);
        workGroup.indexBuffer.push(numVertexs + i + 1);
        workGroup.numIndexs += 3;

    }

};

OBJParser.prototype.saveOBJModel = function (workGroup) {
    var model = new OBJModel();

    //store renderable model
    model.vertexBuffer = workGroup.vertexBuffer;
    model.indexBuffer = workGroup.indexBuffer;
    model.renderLists = workGroup.renderLists;
    model.objects = workGroup.objects;
    model.materials = workGroup.materials;

    return model;
};

//MTL Functions
OBJParser.prototype.loadMTLFile = function (workGroup, fileName) {
    var url = workGroup.rootPath + '/' + fileName;
    var source = null;

    try {
        workGroup.XHR.open('GET', url, false);  //shysncronized request
        workGroup.XHR.send(null);
        source = workGroup.XHR.responseText;

        this.log('LOG: Loaded Material Libreary on URL ' + url);
    } catch (e) {
        console.error('ERROR: Loading Material Library on URL ' + url);
    }

    if (source)
        this.parseMTLText(workGroup, source);

};

OBJParser.prototype.parseMTLText = function (workGroup, source) {

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

OBJParser.prototype.parseMTLLine = function (workGroup, material, words) {
    var newMaterial = null;

    switch (words[0]) {
        case 'newmtl':
            newMaterial = this.createNewMTLMaterial(workGroup, this.joinLineWords(words, 1));

            break;

        case 'Kd':
            material.Kd[0] = this.parseFloat(words[1], 1.0);
            material.Kd[1] = this.parseFloat(words[3], 1.0);
            material.Kd[2] = this.parseFloat(words[4], 1.0);
            material.Kd[3] = this.parseFloat(words[5], 1.0);

            break;

        case 'Ks':
            material.Ks[0] = this.parseFloat(words[1], 1.0);
            material.Ks[1] = this.parseFloat(words[3], 1.0);
            material.Ks[2] = this.parseFloat(words[4], 1.0);
            material.Ks[3] = this.parseFloat(words[5], 1.0);

            break;

        case 'Ka':
            material.Ka[0] = this.parseFloat(words[1], 1.0);
            material.Ka[1] = this.parseFloat(words[3], 1.0);
            material.Ka[2] = this.parseFloat(words[4], 1.0);
            material.Ka[3] = this.parseFloat(words[5], 1.0);

            break;

        case 'Ns':
            material.Ns = this.parseFloat(words[1], 100.0);
            break;

        case 'map_Kd':
            material.map_Kd = this.createNewMTLSampler(workGroup, this.joinLineWords(words, 1));

            break;

        case 'map_Ks':
            material.map_Ks = this.createNewMTLSampler(workGroup, this.joinLineWords(words, 1));

            break;

        case 'map_Ka':
            material.map_Ka = this.createNewMTLSampler(workGroup, this.joinLineWords(words, 1));

            break;

    }

    return newMaterial;
};

OBJParser.prototype.createNewMTLMaterial = function (workGroup, materialName) {
    var material = new Object();

    material.id = workGroup.numMaterials;
    material.name = (materialName ? materialName : 'Material_' + material.id);

    material.Kd = [1.0, 1.0, 1.0, 1.0];
    material.map_Kd = null;

    material.Ks = [1.0, 1.0, 1.0, 1.0];
    material.map_Ks = null;

    material.Ka = [1.0, 1.0, 1.0, 1.0];
    material.map_Ka = null;

    material.Ns = 100.0;

    //store a new material
    workGroup.materials.push(material);
    workGroup.numMaterials++;

    this.log('\tCreated new MTLMaterial ' + material.name);

    return material;
};

OBJParser.prototype.searchImageOnCache = function (imageURL) {
    var length = this.imageCache.length;
    var sampler = null;

    //search on image cache
    for (var i = 0; i < length && sampler === null; i++) {
        sampler = this.imageCache[i];
        sampler.imageURL === imageURL || (sampler = null);
    }

    return sampler;
};

OBJParser.prototype.isPowerOf2 = function (number) {
    return Number.isInteger(Math.log(number) / Math.log(2));
};

OBJParser.prototype.createNewMTLSampler = function (workGroup, imagePath) {

    var gl;
    var image;
    var self = this;
    var imageURL = workGroup.rootPath + '/' + imagePath;
    var sampler;

    var genMipmap;
    var target;

    //search if is loaded image on URL
    sampler = this.searchImageOnCache(imageURL);

    if (sampler === null) {
        gl = workGroup.gl;
        target = gl.TEXTURE_2D;

        //create stored sampler
        sampler = gl.createTexture();
        sampler.imageURL = null;

        //store default image data
        gl.bindTexture(target, sampler);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(target, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
        gl.bindTexture(target, null);

        //create HTMLImage to load Source data on URL
        image = new Image();
        image.onload = function () {

            genMipmap = self.isPowerOf2(image.width) & self.isPowerOf2(image.height);

            gl.bindTexture(gl.TEXTURE_2D, sampler);

            //define texture parameters
            gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, genMipmap ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
            gl.texParameteri(target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

            //store image data
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

            //generate mip map if is posible
            if (genMipmap)
                gl.generateMipmap(target);

            gl.bindTexture(gl.TEXTURE_2D, null);

            //update sampler image metadata
            sampler.imageWidth = image.width;
            sampler.imageHeight = image.height;
            sampler.hasmapmap = genMipmap;

        };
        image.onerror = function () {
            console.error('ERROR: Loading image on URL ' + imageURL);
        };
        image.src = imageURL;

        //save image cache
        sampler.imageURL = imageURL;
        self.imageCache.push(sampler);

        this.log('\t\tCreating new Material Texture Sampler fron Image on URL ' + imageURL);

    } else {
        this.log('\t\tRefernecing Material Texture Sampler fron Image on URL ' + imageURL);

    }


    return sampler;
};

OBJParser.prototype.searchMTLMaterial = function (workGroup, materialName) {
    var numMaterials = workGroup.numMaterials;
    var material = null;
    var index;

    //search material by name
    for (index = 1; index < numMaterials && material === null; index++) {
        material = workGroup.materials[index];
        material.name === materialName || (material = null);
    }

    this.log('\tSearching material of name: ' + materialName + ' , found: ' + (material ? 'true index: ' + (index - 1) : 'false'));

    return material;
};

OBJParser.prototype.useMTLMaterial = function (workGroup, materialName) {
    var founded = null;

    if (workGroup.currentMaterial.name !== materialName) {

        //search a new material and associate to current element
        founded = this.searchMTLMaterial(workGroup, materialName);

        this.log('\tUsing new material ' + (founded ? materialName : 'default'));

        workGroup.currentMaterial = founded ? founded : workGroup.materials[0];
        this.createNewOBJElement(workGroup, workGroup.currentObject.name + '_material_' + materialName);

    }
};

OBJParser.prototype.log = function (logMessage) {
    !this.debug || console.log(logMessage);
};


function OBJModel() {}

OBJModel.prototype.prepare = function (gl, attribs) {
    var attribute;

    //LINK BUFFER TO ATTRIBs LOCATIONs
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

    attribute = attribs.coords;
    if (attribute !== -1) {
        gl.vertexAttribPointer(attribute, 3, gl.FLOAT, false, 20, 0);
    }

    attribute = attribs.normals;
    if (attribute !== -1) {
        gl.vertexAttribPointer(attribute, 4, gl.BYTE, true, 20, 12);
    }

    attribute = attribs.texels;
    if (attribute !== -1) {
        gl.vertexAttribPointer(attribute, 2, gl.UNSIGNED_SHORT, true, 20, 16);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

};

OBJModel.prototype.destroy = function (gl) {
    this.vertexBuffer = gl.deleteBuffer(this.vertexBuffer);
    this.indexBuffer = gl.deleteBuffer(this.indexBuffer);
};

OBJModel.prototype.draw = function (gl, uniforms) {

    var numrenderLists = this.renderLists.length;
    var renderList;
    var renderListMaterial;

    for (var i = 0; i < numrenderLists; i++) {
        renderList = this.renderLists[i];

        if (renderList.numIndexs > 0) {
            renderListMaterial = renderList.material;

            //send render material to GPU
            gl.uniform4fv(uniforms.umaterialKd, renderListMaterial.Kd);
            gl.uniform4fv(uniforms.umaterialKs, renderListMaterial.Ks);
            gl.uniform4fv(uniforms.umaterialKa, renderListMaterial.Ka);
            gl.uniform1f(uniforms.umaterialNs, renderListMaterial.Ns);

            //enabling textures maps
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, renderListMaterial.map_Kd);

            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_2D, renderListMaterial.map_Ks);

            gl.activeTexture(gl.TEXTURE3);
            gl.bindTexture(gl.TEXTURE_2D, renderListMaterial.map_Ka);

            gl.activeTexture(gl.TEXTURE4);
            gl.bindTexture(gl.TEXTURE_2D, renderListMaterial.map_bump);

            //draw render
            gl.drawElements(gl.TRIANGLES, renderList.numIndexs, gl.UNSIGNED_SHORT, renderList.initialIndex * 2);
        }

    }

};