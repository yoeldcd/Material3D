
/*  
 * @author Yoel David Correa Duke
 * @version v1.7.0
 */

function SceneObject(x, y, z) {

    var self = this;
    var coords = [0, 0, 0];

    self.visible = false;
    self.type = 0;

    var transformMatrix = new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        x || 0, y || 0, z || 0, 1
    ]);

    self.transformMatrix = transformMatrix;

    self.getMatrix = function () {
        return transformMatrix;
    };

    self.getCoords = function () {
        coords[0] = transformMatrix[12];
        coords[1] = transformMatrix[13];
        coords[2] = transformMatrix[14];

        return coords;
    };

    self.setCoords = function (x, y, z) {
        transformMatrix[12] = x || 0;
        transformMatrix[13] = y || 0;
        transformMatrix[14] = z || 0;
    };

    return self;
}

function SceneCamera() {
    var self = this;

    var projectionMatrix = new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]);

    var viewMatrix = new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]);

    var vec = new Float32Array(3);

    self.viewMatrix = viewMatrix;
    self.projectionMatrix = projectionMatrix;

    self.x = 0;
    self.y = 0;
    self.z = 5;

    self.atx = 0;
    self.aty = 0;
    self.atz = 0;

    self.upx = 0;
    self.upy = 1;
    self.upz = 0;

    self.fieldOfView = 45;
    self.screenRatio = 1;
    self.near = 0.1;
    self.far = 10.0;

    self.distance = 1;
    self.alpha = 0;
    self.omega = 0;

    self.computeLocation = function () {
        self.distance || (self.computeCamera2TargetDistance());
        
        vec[0] = 0;
        vec[1] = 0;
        vec[2] = self.distance;
        
        //rotate camera around target point
        vec3.rotateX(vec, self.omega, false);
        vec3.rotateY(vec, self.alpha, false);

        self.x = vec[0];
        self.y = vec[1];
        self.z = vec[2];

    };

    self.computeCamera2TargetDistance = function () {
        return self.distance = Math.sqrt(Math.pow(self.x - self.atx, 2) + Math.pow(self.y - self.aty, 2) + Math.pow(self.z - self.atz, 2));
    };

    self.computeFOV = function (plane) {
        self.distance || (self.computeCamera2TargetDistance());
        self.screenRatio || (self.screenRatio = 1.0);
        
        return self.fieldOfView = Math.atan(plane / self.distance / self.screenRatio) * 90;
    };
    
    self.computeScreenRatio = function (screenWidth, screenHeight) {
        self.screenRatio = screenWidth / screenHeight;
    };
    
    self.update = function () {

        //compute camera matrix
        mat4.project(projectionMatrix, self.fieldOfView, false, self.screenRatio, self.near, self.far);
        mat4.cameraMat4(viewMatrix, self.x, self.y, self.z, self.atx, self.aty, self.atz, self.upx, self.upy, self.upz);

    };
    
    return self;
}

function SceneLigth() {
    var self = this;

    self.x = 0;
    self.y = 0;
    self.z = 0;

    self.atx = 0;
    self.aty = 0;
    self.atz = 0;

    self.red = 1;
    self.green = 1;
    self.blue = 1;

    self.maxDot = 1;

    self.computeDirection = function () {

    };

    return self;
}