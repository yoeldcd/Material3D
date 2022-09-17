
function OrbitalCamera(alpha, omega) {
    alpha === undefined || (this.alpha = alpha);
    omega === undefined || (this.omega = omega);

    //generate work matrixs
    this.matrixView = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    this.matrixProjection = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    this.matrixCamera = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

}

OrbitalCamera.prototype.distance = 10;
OrbitalCamera.prototype.alpha = 0;
OrbitalCamera.prototype.omega = 0;

OrbitalCamera.prototype.znear = 0.1;
OrbitalCamera.prototype.zfar = 100;
OrbitalCamera.prototype.fieldOfView = 45;
OrbitalCamera.prototype.ratio = 1;

OrbitalCamera.prototype.targetX = 0;
OrbitalCamera.prototype.targetY = 0;
OrbitalCamera.prototype.targetZ = 0;

OrbitalCamera.prototype.computeRatio = function (width, height) {
    width === undefined || (width = 1);
    height === undefined || (height = 1);

    return this.ratio = width / height;
};

OrbitalCamera.prototype.computeFOV = function (plane) {
    return plane !== undefined ? this.fieldOfView = Math.atan(plane / this.distance / this.ratio) * 90 : this.fieldOfView;
};

OrbitalCamera.prototype.setTarget = function (targetX, targetY, targetZ) {
    targetX === undefined || (this.targetX = targetX);
    targetY === undefined || (this.targetY = targetY);
    targetZ === undefined || (this.targetZ = targetZ);
};

OrbitalCamera.prototype.setPerspective = function (fieldOfView, ratio, znear, zfar) {
    fieldOfView === undefined || (this.fieldOfView = fieldOfView);
    ratio === undefined || (this.ratio = ratio);
    znear === undefined || (this.znear = znear);
    zfar === undefined || (this.zfar = zfar);
};

OrbitalCamera.prototype.update = function () {
    var vec = [0, 0, this.distance];

    vec3.rotateX(vec, this.alpha !== 90 ? this.alpha : 89.99, false);
    vec3.rotateY(vec, this.omega, false);

    mat4.project(this.matrixProjection, this.fieldOfView, false, this.ratio, this.znear, this.zfar);
    mat4.cameraMat4(this.matrixView, vec[0] + this.targetX, vec[1] + this.targetY, vec[2] + this.targetZ, this.targetX, this.targetY, this.targetZ, 0, 1, 0);
    
};

