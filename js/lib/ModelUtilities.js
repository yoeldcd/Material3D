function Bone(x, y, z, father) {
    var self = this;

    self.name;
    self.father = father;
    self.coords;
    self.vector;
    self.mtransform = mat4.createMat4();
    var share = mat4.createMat4();

    //define bone coordinates
    coords = new Float32Array([x || 0.0, y || 0.0, z || 0.0]);

    //get direction vector of bone
    if (father) {
        vector = new Float32Array([
            self.coords[0] - father.coords[0], //X axis dircetion vector
            self.coords[1] - father.coords[1], //Y axis dircetion vector
            self.coords[2] - father.coords[2], //Z axis dircetion vector
        ]);
    } else {
        vector = new Float32Array(self.coords); //coords is a direction
    }

    //move transformation matrix to original bone position
    mat4.translate(self.mtransform, self.coords[0], self.coords[1], self.coords[2]);

    self.compute = function () {
        mat4.copyMat4(share, self.mtransform);
        !self.father || mat4.multiply(share, mat4.transposeMat4(share), self.father.mtransform);
    };

    self.sendToGPU = function (gl, boneUniformsSet) {
        !boneUniformsSet.coords || gl.uniform4fv(!boneUniformsSet.coords, self.coords);
    };

    self.update = function (gl, boneUniformsSet) {
        !boneUniformsSet.mtransform || gl.uniform4fv(!boneUniformsSet.mtransform, false, self.share);
    };

    return self;
}

function BoneUniformsSet(gl, shader, boneArrayUniformName, boneArrayIndex) {
    var self = this;
    self.coords = gl.getUniformLocation(shader, boneArrayUniformName + '[' + boneArrayIndex + '].coords');
    self.mtransform = gl.getUniformLocation(shader, boneArrayUniformName + '[' + boneArrayIndex + '].transform');
}

