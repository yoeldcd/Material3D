
function PerspectiveCamera(x, y, z) {

    x === undefined || (this.x = x);
    y === undefined || (this.y = y);
    z === undefined || (this.z = z);

    //generate work matrixs
    this.matrixView = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    this.matrixProjection = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

}

PerspectiveCamera.prototype.znear = 0.1;
PerspectiveCamera.prototype.zfar = 100;
PerspectiveCamera.prototype.fieldOfView = 45;
PerspectiveCamera.prototype.ratio = 1;

PerspectiveCamera.prototype.x = 0;
PerspectiveCamera.prototype.y = 0;
PerspectiveCamera.prototype.z = 1;

PerspectiveCamera.prototype.upx = 0;
PerspectiveCamera.prototype.upy = 1;
PerspectiveCamera.prototype.upz = 0;

PerspectiveCamera.prototype.targetX = 0;
PerspectiveCamera.prototype.targetY = 0;
PerspectiveCamera.prototype.targetZ = 0;

PerspectiveCamera.prototype.computeRatio = function (width, height) {
    width !== undefined || (width = 1);
    height !== undefined || (height = 1);

    return this.ratio = width / height;
};

PerspectiveCamera.prototype.computeFOV = function (plane) {
    var distance = Math.rqrt(Math.pow(this.x - this.targetX, 2) + Math.pow(this.y - this.targetY, 2) + Math.pow(this.z - this.targetZ, 2));

    return this.fieldOfView = Math.atan(plane / distance / this.ratio) * 90;
};

PerspectiveCamera.prototype.setTarget = function (targetX, targetY, targetZ) {
    targetX === undefined || (this.targetX = targetX);
    targetY === undefined || (this.targetY = targetY);
    targetZ === undefined || (this.targetZ = targetZ);
};

PerspectiveCamera.prototype.setPerspective = function (fieldOfView, ratio, znear, zfar) {
    fieldOfView === undefined || (this.fieldOfView = fieldOfView);
    ratio === undefined || (this.ratio = ratio);
    znear === undefined || (this.znear = znear);
    zfar === undefined || (this.zfar = zfar);

};

PerspectiveCamera.prototype.update = function () {
    mat4.project(this.matrixProjection, this.fieldOfView, false, this.ratio, this.znear, this.zfar);
    mat4.cameraMat4(this.matrixView, this.x, this.y, this.z, this.targetX, this.targetY, this.targetZ, this.upx, this.upy, this.upz);
};