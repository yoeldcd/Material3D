
function AttributesSet(shaderProgram) {
    this.shaderProgram = shaderProgram;
    this.attribs = new Array();
}

AttributesSet.prototype.length = 0;

AttributesSet.prototype.add = function(gl, attributeName, asignedName){
    var attribLocation = 0;
    
    if (this.shaderProgram && attributeName) {
        attribLocation = gl.getAttribLocation(this.shaderProgram, attributeName)
    
        this.attribs[this.length] = attribLocation;
        this[asignedName || attributeName] = attribLocation ;
        
        this.length ++;
    }
};

AttributesSet.prototype.enable = function (gl) {
    for(var i = 0, attrib; i < this.length; i++){
        attrib = this.attribs[i];
        
        if(attrib >= 0){
            gl.enableVertexAttribArray(attrib);
        }
    }
    
};

AttributesSet.prototype.disable = function (gl) {
    for(var i = 0, attrib; i < this.length; i++){
        attrib = this.attribs[i];
        
        if(attrib >= 0){
            gl.disableVertexAttribArray(attrib);
        }
    }
};
