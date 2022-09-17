

function UniformsSet(shaderProgram) {
    this.shaderProgram = shaderProgram;
    this.uniforms = new Array();
}

UniformsSet.prototype.length = 0;

UniformsSet.prototype.add = function (gl, uniformName, asignedName) {
    var uniformLocation = 0;

    if (this.shaderProgram && uniformName) {
        uniformLocation = gl.getUniformLocation(this.shaderProgram, uniformName);

        this.uniforms[this.length++] = uniformLocation;
        this[asignedName || uniformName] = uniformLocation;

    }
};

UniformsSet.prototype.addStruct = function (gl, uniformName, asignedName, structProperties) {
    asignedName || (asignedName = uniformName);
    structProperties || (structProperties = []);

    var length = structProperties.length;
    var structure = {};
    var property = null;

    if (this.shaderProgram && uniformName) {
        for (var i = 0; i < length; i++) {
            property = structProperties[i];
            structure[property] = gl.getUniformLocation(this.shaderProgram, uniformName + '.' + property);
        }
        
        this.uniforms[this.length++] = structure;
        this[asignedName] = structure;
        
    }

};

UniformsSet.prototype.addArray = function (gl, uniformName, asignedName, arrayLength) {
    asignedName || (asignedName = uniformName);
    arrayLength || (arrayLength = 0);

    var array = new Array(arrayLength);

    if (this.shaderProgram && uniformName) {
        for (var i = 0; i < arrayLength; i++) {
            array[i] =gl.getUniformLocation(this.shaderProgram, uniformName+'[' + i + ']');
        }
        
        this.uniforms[this.length++] = array;
        this[asignedName] = array;
    }

};

UniformsSet.prototype.addStructArray = function (gl, uniformName, asignedName, structProperties, arrayLength) {
    asignedName || (asignedName = uniformName);
    structProperties || (structProperties = []);
    arrayLength || (arrayLength = 0);

    var structure = null;
    var property = null;
    var array = new Array(arrayLength);
    var length = structProperties.length;
    
    if (this.shaderProgram && uniformName) {
        for (var i = 0; i < arrayLength; i++) {
            structure = {};
            
            for (var j = 0; j < length; j++) {
                property = structProperties[j];
                structure[property] = gl.getUniformLocation(this.shaderProgram, uniformName+'[' + i + '].' + property);
            }
            
            array[i] = structure;
        }
        
        this.uniforms[this.length++] = array;
        this[asignedName] = array;
    }

};

