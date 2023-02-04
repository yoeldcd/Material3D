
function ShaderLoader() {

}

function AttributesSet(shaderProgram) {
    this.constructor(shaderProgram);
}

function UniformsSet(shaderProgram) {
    this.constructor(shaderProgram);
}

(function () {

    /**/
    ShaderLoader.prototype.createShader = function (gl, vertexCode, fragmentCode) {

        var vshader, fshader, program;
        var vsinfo, fsinfo, pinfo;
        var plinked;

        //create and compile vertex shader
        vshader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vshader, vertexCode);
        gl.compileShader(vshader);
        vsinfo = gl.getShaderInfoLog(vshader);

        //create and compile fragment shader
        fshader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fshader, fragmentCode);
        gl.compileShader(fshader);
        fsinfo = gl.getShaderInfoLog(fshader);

        //attach shaders if is compiled
        if (vsinfo || fsinfo) {
            console.warn('vertex shader info log: \n' + vsinfo);
            console.warn('fragment shader info log: \n' + fsinfo);

        } else {

            program = gl.createProgram();
            gl.attachShader(program, vshader);
            gl.attachShader(program, fshader);
            gl.linkProgram(program);
            plinked = gl.getProgramParameter(program, gl.LINK_STATUS);
            pinfo = gl.getProgramInfoLog(program);

            //destroy uncomplete program's
            if (!plinked) {
                console.error('(UNLINKED PROGRAM) program info log: \n' + pinfo);
                program = null;
                
            } else {
                program.attribs = new AttributesSet(program);
                program.uniforms = new UniformsSet(program);
                
            }

        }

        return program;
    };

    ShaderLoader.prototype.loadShaderFiles = function (gl, vertexURL, fragmentURL) {

        var vertexCode = null;
        var fragmentCode = null;
        var shaderProgram = null;

        var url = null;
        var http = new XMLHttpRequest();
        
        try {

            if (vertexURL) {
                url = vertexURL;
                http.open('GET', url, false);
                http.send(null);

                if (http.status === 200)
                    vertexCode = http.responseText;
                else
                    console.warn('Error loading URL ' + url + '  RESPONSE CODE: ' + http.status);
            }

            if (fragmentURL) {
                url = fragmentURL;
                http.open('GET', url, false);
                http.send(null);

                if (http.status === 200)
                    fragmentCode = http.responseText;
                else
                    console.warn('Error loading URL ' + url + ' RESPONSE CODE: ' + http.status);
            }

            if (vertexCode && fragmentCode) {
                shaderProgram = this.createShader(gl, vertexCode, fragmentCode);
            }

        } catch (e) {
            console.error('HTTP REQUEST ERROR AT URL: ' + url);
        }

        return shaderProgram;
    };

    /**/
    AttributesSet.prototype.constructor = function (shaderProgram) {
        this.shaderProgram = shaderProgram;
        this.attribs = new Array();
        this.length = 0;
    };

    AttributesSet.prototype.add = function (gl, attributeName, asignedName) {
        var attribLocation = 0;

        if (this.shaderProgram && attributeName) {
            attribLocation = gl.getAttribLocation(this.shaderProgram, attributeName);
            attribLocation < 0 ? attribLocation = null : null;

            this.attribs[this.length] = attribLocation;
            this[asignedName || attributeName] = attribLocation;

            this.length++;
        }
    };

    AttributesSet.prototype.enable = function (gl) {
        for (var i = 0, attrib; i < this.length; i++) {
            attrib = this.attribs[i];

            if (attrib >= 0) {
                gl.enableVertexAttribArray(attrib);
            }
        }

    };

    AttributesSet.prototype.disable = function (gl) {
        for (var i = 0, attrib; i < this.length; i++) {
            attrib = this.attribs[i];

            if (attrib >= 0) {
                gl.disableVertexAttribArray(attrib);
            }
        }
    };

    /**/
    UniformsSet.prototype.constructor = function (shaderProgram) {
        this.shaderProgram = shaderProgram;
    };

    UniformsSet.prototype.add = function (gl, uniformName, asignedName) {
        var uniformLocation = 0;

        if (this.shaderProgram && uniformName) {
            uniformLocation = gl.getUniformLocation(this.shaderProgram, uniformName);

            this[asignedName || uniformName] = uniformLocation;

        }
    };

    UniformsSet.prototype.addStruct = function (gl, uniformName, asignedName, structProperties) {
        asignedName || (asignedName = uniformName);
        structProperties || (structProperties = []);

        var length = structProperties.length;
        var structure = this[asignedName] || {};
        var property = null;

        if (this.shaderProgram && uniformName) {
            for (var i = 0; i < length; i++) {
                property = structProperties[i];
                structure[property] = gl.getUniformLocation(this.shaderProgram, uniformName + '.' + property);
            }

            this[asignedName] = structure;
        }

    };

    UniformsSet.prototype.addArray = function (gl, uniformName, asignedName, arrayLength) {
        asignedName || (asignedName = uniformName);
        arrayLength || (arrayLength = 0);

        var array = this[asignedName] || new Array(0);

        if (this.shaderProgram && uniformName) {
            for (var i = 0; i < arrayLength; i++) {
                array.push(gl.getUniformLocation(this.shaderProgram, uniformName + '[' + i + ']'));
            }

            this[asignedName] = array;
        }

    };

    UniformsSet.prototype.addStructArray = function (gl, uniformName, asignedName, structProperties, arrayLength) {
        asignedName || (asignedName = uniformName);
        structProperties || (structProperties = []);
        arrayLength || (arrayLength = 0);

        var structure = null;
        var property = null;
        var length = structProperties.length;
        var array = this[asignedName] || new Array(0);

        if (this.shaderProgram && uniformName) {
            for (var i = 0; i < arrayLength; i++) {
                structure = {};

                for (var j = 0; j < length; j++) {
                    property = structProperties[j];
                    structure[property] = gl.getUniformLocation(this.shaderProgram, uniformName + '[' + i + '].' + property);
                }

                array.push(structure);
            }

            this[asignedName] = array;
        }

    };

})();