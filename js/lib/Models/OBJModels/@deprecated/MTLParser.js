
function MTLParser() {
    var self = this;

    self.debug = false;

    //source line control values
    var sourceLines = null;
    var linesCount = 0;

    //materail storage
    var materials = new Array();
    var material = null;

    //default values
    var defaultMaterial;
    var defaultTexture;

    //texture storage
    var textures = new Array();
    var root = null;


    self.parseMTLText = function (gl, textData, rootFolder) {

        sourceLines = textData.split('\n');
        linesCount = sourceLines.length;
        root = rootFolder;

        //create default material
        if (!defaultMaterial) {
            defaultTexture = self.createBlankSampler2D(gl);
            defaultMaterial = self.createDefaultMaterial(gl);

            materials[0] = defaultMaterial;
        }

        //parse all lines on the Text
        for (var i = 0; i < linesCount; i++) {
            parseLine(gl, getLineWords(sourceLines[i]));
        }

        return materials;
    };

    self.loadMTLFile = function (gl, url) {

        var root = getURLRootPath(url);
        var http = new XMLHttpRequest();

        console.log('Loading Material Library on url: ' + url);
        http.open('GET', url, false);

        try {
            http.send(null);
            self.parseMTLText(gl, http.responseText, root);
        } catch(e) {
            console.error('Error loading Material Library on url: ' + url);
        }

        return materials;
    };

    self.loadMTLFiles = function (gl, urls) {

        urls || (urls = []);

        var url;
        var root;
        var http = new XMLHttpRequest();
        
        for (var i = 0; i < urls.length; i++) {
            url = urls[i];

            if (url) {
                console.log('Loading Material Library on url: ' + url);
                http.open('GET', url, false);
                
                try {
                    http.send(null);
                    root = getURLRootPath(url);
                    self.parseMTLText(gl, http.responseText, root);
                } catch(e){
                    console.error('Error loading Material Library on url: ' + url);
                }
                
            }
        }

        return materials;
    };

    self.getMaterials = function () {
        return materials;
    };

    self.createBlankCubeMap = function (gl) {

        var blankCubeMap = gl.createTexture();
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

        return blankCubeMap;
    };

    self.createBlankSampler2D = function (gl) {

        var blanksampler = gl.createTexture();

        //set default sampler2D data (blank)
        gl.bindTexture(gl.TEXTURE_2D, blanksampler);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
        gl.bindTexture(gl.TEXTURE_2D, null);

        return blanksampler;
    };

    self.createDefaultMaterial = function () {
        var material = new MTLMaterial('default');

        //asigne material texture maps
        material.map_Kd = defaultTexture;
        material.map_Ks = null;
        material.map_Ka = null;
        material.map_bump = null;

        return material;
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
        material = new MTLMaterial(joinLineWords(lineWords, 1));

        material.map_Kd = defaultTexture;//asigne default difuse map blank
        material.map_Ks = null;
        material.map_Ka = null;
        material.map_bump = null;

        materials.push(material);
    }

    function parseMaterialDifuseComponent(lineWords) {
        material.Kd[0] = parseNumber(lineWords[1], 1.0);
        material.Kd[1] = parseNumber(lineWords[2], 1.0);
        material.Kd[2] = parseNumber(lineWords[3], 1.0);
        material.Kd[3] = parseNumber(lineWords[4], 1.0);
    }

    function parseMaterialSpecularComponent(lineWords) {
        material.Ks[0] = parseNumber(lineWords[1], 1.0);
        material.Ks[1] = parseNumber(lineWords[2], 1.0);
        material.Ks[2] = parseNumber(lineWords[3], 1.0);
        material.Ks[3] = parseNumber(lineWords[4], 1.0);
    }

    function parseMaterialAmbientComponent(lineWords) {
        material.Ka[0] = parseNumber(lineWords[1], 1.0);
        material.Ka[1] = parseNumber(lineWords[2], 1.0);
        material.Ka[2] = parseNumber(lineWords[3], 1.0);
        material.Ka[3] = parseNumber(lineWords[4], 1.0);
    }

    function parseMaterialSpecularCoeficent(lineWords) {
        material.Ns = parseNumber(lineWords[1], 100);
    }

    function parseMaterialDifuseMap(gl, lineWords) {
        material.map_Kd = createSampler(gl, joinLineWords(lineWords, 1));
    }

    function parseMaterialSpecularMap(gl, lineWords) {
        material.map_Ks = createSampler(gl, joinLineWords(lineWords, 1));
    }

    function parseMaterialAmbientMap(gl, lineWords) {
        material.map_Ka = createSampler(gl, joinLineWords(lineWords, 1));
    }

    function parseMaterialBumpMap(gl, lineWords) {
        material.map_bump = createSampler(gl, joinLineWords(lineWords, 1));
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

function MTLMaterial(name) {

    //material dentifiers
    this.name = name;
    this.index = 0;

    //color components
    this.Kd = new Float32Array([1, 1, 1, 1]);
    this.Ks = new Float32Array([1, 1, 1, 1]);
    this.Ka = new Float32Array([1, 1, 1, 1]);
    this.Ns = 100;

    //samplers maps textures
    this.map_Kd = null;
    this.map_Ks = null;
    this.map_Ka = null;
    this.map_bump = null;

    this.store = function (gl, shader, shaderMaterialArrayName, shaderMaterialArrayIndex) {

        var materialArray = shaderMaterialArrayName + '[' + shaderMaterialArrayIndex + ']';
        var uniform;

        this.index = shaderMaterialArrayIndex;

        //Set all material properties to GPU using uniforms
        (uniform = gl.getUniformLocation(shader, materialArray + '.Kd')) ? gl.uniform4fv(uniform, this.Kd) : 0;
        (uniform = gl.getUniformLocation(shader, materialArray + '.Ks')) ? gl.uniform4fv(uniform, this.Ks) : 1;
        (uniform = gl.getUniformLocation(shader, materialArray + '.Ka')) ? gl.uniform4fv(uniform, this.Ka) : 2;
        (uniform = gl.getUniformLocation(shader, materialArray + '.Ns')) ? gl.uniform1f(uniform, this.Ns) : 3;

    };

    this.enableTextures = function (gl) {

        if (this.map_Kd) {
            gl.activeTexture(gl.TEXTURE1);  //enable difuse map sampler
            gl.bindTexture(gl.TEXTURE_2D, this.map_Kd);
        }

        if (this.map_Ks) {
            gl.activeTexture(gl.TEXTURE2);  //enable specular map sampler
            gl.bindTexture(gl.TEXTURE_2D, this.map_Ks);
        }

        if (this.map_Ka) {
            gl.activeTexture(gl.TEXTURE3);  //enable ambient map sampler
            gl.bindTexture(gl.TEXTURE_2D, this.map_Ka);
        }

        if (!this.map_bump) {
            gl.activeTexture(gl.TEXTURE4);  //enable bump map sampler
            gl.bindTexture(gl.TEXTURE_2D, this.map_bump);
        }
    };

}
