
function OBJModel() {}

OBJModel.prototype.objects = null;
OBJModel.prototype.vertexBuffer = null;
OBJModel.prototype.normalBuffer = null;
OBJModel.prototype.texelBuffer = null;
OBJModel.prototype.materialBuffer = null;
OBJModel.prototype.objectBuffer = null;
OBJModel.prototype.usedMaterial = null;

OBJModel.prototype.destroy = function (gl) {

    this.objects = null;
    !this.vertexBuffer || gl.deleteBuffer(this.vertexBuffer);
    !this.normalBuffer || gl.deleteBuffer(this.vertexBuffer);
    !this.texelBuffer || gl.deleteBuffer(this.vertexBuffer);
    !this.materialBuffer || gl.deleteBuffer(this.vertexBuffer);
    !this.objectBuffer || gl.deleteBuffer(this.vertexBuffer);

};

OBJModel.prototype.prepare = function (gl, attribs) {
    var attribIndex;

    this.usedMaterial = null;
    
    //link to VBO each enable vertex attrib 
    if ((attribIndex = attribs.vertexPositions) > -1) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(attribIndex, 3, gl.FLOAT, false, 0, 0);
    }

    if ((attribIndex = attribs.vertexNormals) > -1) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.vertexAttribPointer(attribIndex, 3, gl.FLOAT, false, 0, 0);
    }

    if ((attribIndex = attribs.vertexTextureCoords) > -1) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texelBuffer);
        gl.vertexAttribPointer(attribIndex, 2, gl.FLOAT, false, 0, 0);
    }

    if ((attribIndex = attribs.vertexMaterialIndex) > -1) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.materialBuffer);
        gl.vertexAttribPointer(attribIndex, 1, gl.FLOAT, false, 0, 0);
    }

    if ((attribIndex = attribs.vertexObjectIndex) > -1) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.objectBuffer);
        gl.vertexAttribPointer(attribIndex, 1, gl.FLOAT, false, 0, 0);

    }
};

OBJModel.prototype.draw = function (gl, optDrawMode) {
    var object;
    var material;
    var length = this.objects ? this.objects.length : 0;

    //console.log('Normal rendering ' + length + ' objects');
    for (var i = 0; i < length; i++) {
        object = this.objects[i];
        material = object.material;
        
        //get material and enable texture samplers
        if(material !== this.usedMaterial){
            this.usedMaterial = material;
            material.enableTextures(gl);
            
        }
        
        gl.drawArrays(optDrawMode || object.drawMode, object.initialVertex, object.countedVertexs);
    }
    
    gl.flush();
};

OBJModel.prototype.drawSubModel = function (gl, index, optDrawMode) {
    var object;
    var material;
    var length = this.objects ? this.objects.length : 0;

    if (index >= 0 && index < length) {
        object = this.objects[index];
        material = object.material;
        
        //get material and enable texture samplers
        if(material !== this.usedMaterial){
            this.usedMaterial = material;
            material.enableTextures(gl);
            
        }
        
        gl.drawArrays(optDrawMode || object.drawMode, object.initialVertex, object.countedVertexs);
    }
};
