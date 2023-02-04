
function Scene(params) {
    this.constructor(params);
}

function Camera() {
    this.constructor();
}

function Ligth(type) {
    this.constructor(type);
}

(function () {
    var cameraMatrix = new Float32Array(16);
    var projectionMatrix = new Float32Array(16);

    var r00, r01, r02, r03;
    var r10, r11, r12, r13;
    var r20, r21, r22, r23;
    var r30, r31, r32, r33;
    var det, inversev, fv;
    var PI = Math.PI;

    var vecIn = new Float32Array(3);
    var vecAt = new Float32Array(3);
    var vecUp = new Float32Array(3);
    var vecX = new Float32Array(3);
    var vecY = new Float32Array(3);
    var vecZ = new Float32Array(3);

    var s, c;
    var sin = Math.sin;
    var cos = Math.cos;
    var tan = Math.tan;
    var sqrt = Math.sqrt;

    var gl = null;
    var object = null;
    var model = null;
    var shader = null;
    var uniforms = null;
    var camera = null;

    var numObjects = 0;
    var numLigths = 0;
    var currentShaderID = -1;
    var currentModelID = -1;

    function detMat3(r00, r01, r02, r10, r11, r12, r20, r21, r22) {

        return    r00 * r11 * r22
                + r01 * r12 * r20
                + r02 * r10 * r21

                - r20 * r11 * r02
                - r21 * r12 * r00
                - r22 * r10 * r01;

    }

    function detMat4(mat) {

        return mat[0] * mat[5] * mat[10] * mat[15]
                + mat[1] * mat[6] * mat[11] * mat[12]
                + mat[2] * mat[7] * mat[8] * mat[13]
                + mat[3] * mat[4] * mat[9] * mat[14]
                - mat[12] * mat[9] * mat[6] * mat[3]
                - mat[13] * mat[10] * mat[7] * mat[0]
                - mat[14] * mat[11] * mat[4] * mat[1]
                - mat[15] * mat[8] * mat[5] * mat[2];

    }

    function normalizedVec3(vec, dst) {
        dst || (dst = vec);

        length = sqrt(vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2]);

        if (length !== 0) {

            dst[0] = vec[0] / length;
            dst[1] = vec[1] / length;
            dst[2] = vec[2] / length;
        }

        return dst;
    }

    function crossNormalizedVec3(vec1, vec2, dst) {

        //cross product
        dst[0] = vec1[1] * vec2[2] - vec1[2] * vec2[1];
        dst[1] = vec1[2] * vec2[0] - vec1[0] * vec2[2];
        dst[2] = vec1[0] * vec2[1] - vec1[1] * vec2[0];

        length = sqrt(dst[0] * dst[0] + dst[1] * dst[1] + dst[2] * dst[2]);
        if (length !== 0) {
            dst[0] /= length;
            dst[1] /= length;
            dst[2] /= length;

        }

        return dst;
    }

    function invertMat4(mat) {

        det = detMat4(mat);

        if (det !== 0) {

            //load matrix components
            r00 = mat[0];
            r01 = mat[1];
            r02 = mat[2];
            r03 = mat[3];

            r10 = mat[4];
            r11 = mat[5];
            r12 = mat[6];
            r13 = mat[7];

            r20 = mat[8];
            r21 = mat[9];
            r22 = mat[10];
            r23 = mat[11];

            r30 = mat[12];
            r31 = mat[13];
            r32 = mat[14];
            r33 = mat[15];

            /*
             * r00 r01 r02 r03
             * r10 r11 r12 r13
             * r20 r21 r22 r23
             * r30 r31 r32 r33 
             */

            //store transposed cofactors = adjunte
            //row 0
            mat[0] = detMat3(r11, r12, r13, r21, r22, r23, r31, r32, r33) / det;
            mat[4] = -detMat3(r10, r12, r13, r20, r22, r23, r30, r32, r33) / det;
            mat[8] = detMat3(r10, r11, r13, r20, r21, r23, r30, r31, r33) / det;
            mat[12] = -detMat3(r10, r11, r12, r20, r21, r22, r30, r31, r32) / det;

            //row 1
            mat[1] = -detMat3(r01, r02, r03, r21, r22, r23, r31, r32, r33) / det;
            mat[5] = detMat3(r00, r02, r03, r20, r22, r23, r30, r32, r33) / det;
            mat[9] = -detMat3(r00, r01, r03, r20, r21, r23, r30, r31, r33) / det;
            mat[13] = detMat3(r00, r01, r02, r20, r21, r22, r30, r31, r32) / det;

            //row 2
            mat[2] = detMat3(r01, r02, r03, r11, r12, r13, r31, r32, r33) / det;
            mat[6] = -detMat3(r00, r02, r03, r10, r12, r13, r30, r32, r33) / det;
            mat[10] = detMat3(r00, r01, r03, r10, r11, r13, r30, r31, r33) / det;
            mat[14] = -detMat3(r00, r01, r02, r10, r11, r12, r30, r31, r32) / det;

            //row 3
            mat[3] = -detMat3(r01, r02, r03, r11, r12, r13, r21, r22, r23) / det;
            mat[7] = detMat3(r00, r02, r03, r10, r12, r13, r20, r22, r23) / det;
            mat[11] = -detMat3(r00, r01, r03, r10, r11, r13, r20, r21, r23) / det;
            mat[15] = detMat3(r00, r01, r02, r10, r11, r12, r20, r21, r22) / det;

        }

    }

    function loockAtMat4(x, y, z, atx, aty, atz, upx, upy, upz) {
        vecIn[0] = x - atx;
        vecIn[1] = y - aty;
        vecIn[2] = z - atz;

        vecAt[0] = atx;
        vecAt[1] = aty;
        vecAt[2] = atz;

        vecUp[0] = upx;
        vecUp[1] = upy;
        vecUp[2] = upz;

        normalizedVec3(vecIn, vecZ);
        crossNormalizedVec3(vecUp, vecZ, vecX);
        crossNormalizedVec3(vecZ, vecX, vecY);

        cameraMatrix[0] = vecX[0];
        cameraMatrix[1] = vecX[1];
        cameraMatrix[2] = vecX[2];
        cameraMatrix[3] = 0;

        cameraMatrix[4] = vecY[0];
        cameraMatrix[5] = vecY[1];
        cameraMatrix[6] = vecY[2];
        cameraMatrix[7] = 0;

        cameraMatrix[8] = vecZ[0];
        cameraMatrix[9] = vecZ[1];
        cameraMatrix[10] = vecZ[2];
        cameraMatrix[11] = 0;

        cameraMatrix[12] = x;
        cameraMatrix[13] = y;
        cameraMatrix[14] = z;
        cameraMatrix[15] = 1;

        invertMat4(cameraMatrix);
    }

    function projectMat4(fieldOfView, ratio, znear, zfar) {
        
        fieldOfView = fieldOfView / 180 * PI;
        fv = 1.0 / tan(fieldOfView / 2);
        inversev = 1 / (znear - zfar);

        projectionMatrix[0] = fv / ratio;
        projectionMatrix[1] = 0;
        projectionMatrix[2] = 0;
        projectionMatrix[3] = 0;

        projectionMatrix[4] = 0;
        projectionMatrix[5] = fv;
        projectionMatrix[6] = 0;
        projectionMatrix[7] = 0;

        projectionMatrix[8] = 0;
        projectionMatrix[9] = 0;
        projectionMatrix[10] = (zfar + znear) * inversev;
        projectionMatrix[11] = -1;

        projectionMatrix[12] = 0;
        projectionMatrix[13] = 0;
        projectionMatrix[14] = (zfar * znear * inversev * 2);
        projectionMatrix[15] = 0;

    }

    function ortographicMat4(ratio, rigth, left, up, down, znear, zfar) {

        projectionMatrix[0] = (rigth - left) / ratio;
        projectionMatrix[1] = 0;
        projectionMatrix[2] = 0;
        projectionMatrix[3] = 0;

        projectionMatrix[4] = 0;
        projectionMatrix[5] = (up - down);
        projectionMatrix[6] = 0;
        projectionMatrix[7] = 0;

        projectionMatrix[8] = 0;
        projectionMatrix[9] = 0;
        projectionMatrix[10] = (znear - zfar) / 2;
        projectionMatrix[11] = 0;

        projectionMatrix[12] = 0;
        projectionMatrix[13] = 0;
        projectionMatrix[14] = (znear * zfar * 2) / (znear - zfar);
        projectionMatrix[15] = 0;

    }

    function multiplyMat4(mat1, mat2, dst) {

        //row 1
        dst[0] = mat1[0] * mat2[0] + mat1[1] * mat2[4] + mat1[2] * mat2[8] + mat1[3] * mat2[12];
        dst[1] = mat1[0] * mat2[1] + mat1[1] * mat2[5] + mat1[2] * mat2[9] + mat1[3] * mat2[13];
        dst[2] = mat1[0] * mat2[2] + mat1[1] * mat2[6] + mat1[2] * mat2[10] + mat1[3] * mat2[14];
        dst[3] = mat1[0] * mat2[3] + mat1[1] * mat2[7] + mat1[2] * mat2[11] + mat1[3] * mat2[15];

        //row 2
        dst[4] = mat1[4] * mat2[0] + mat1[5] * mat2[4] + mat1[6] * mat2[8] + mat1[7] * mat2[12];
        dst[5] = mat1[4] * mat2[1] + mat1[5] * mat2[5] + mat1[6] * mat2[9] + mat1[7] * mat2[13];
        dst[6] = mat1[4] * mat2[2] + mat1[5] * mat2[6] + mat1[6] * mat2[10] + mat1[7] * mat2[14];
        dst[7] = mat1[4] * mat2[3] + mat1[5] * mat2[7] + mat1[6] * mat2[11] + mat1[7] * mat2[15];

        //row 3
        dst[8] = mat1[8] * mat2[0] + mat1[9] * mat2[4] + mat1[10] * mat2[8] + mat1[11] * mat2[12];
        dst[9] = mat1[8] * mat2[1] + mat1[9] * mat2[5] + mat1[10] * mat2[9] + mat1[11] * mat2[13];
        dst[10] = mat1[8] * mat2[2] + mat1[9] * mat2[6] + mat1[10] * mat2[10] + mat1[11] * mat2[14];
        dst[11] = mat1[8] * mat2[3] + mat1[9] * mat2[7] + mat1[10] * mat2[11] + mat1[11] * mat2[15];

        //row 4
        dst[12] = mat1[12] * mat2[0] + mat1[13] * mat2[4] + mat1[14] * mat2[8] + mat1[15] * mat2[12];
        dst[13] = mat1[12] * mat2[1] + mat1[13] * mat2[5] + mat1[14] * mat2[9] + mat1[15] * mat2[13];
        dst[14] = mat1[12] * mat2[2] + mat1[13] * mat2[6] + mat1[14] * mat2[10] + mat1[15] * mat2[14];
        dst[15] = mat1[12] * mat2[3] + mat1[13] * mat2[7] + mat1[14] * mat2[11] + mat1[15] * mat2[15];

    }

    function computeOrbitalLocation(object, distance, alpha, omega) {

        alpha *= (PI / 180);
        omega *= (PI / 180);
        
        //rotate around X
        s = sin(omega);
        c = cos(omega);
        v1 = s;
        v2 = c;

        //rotate around Y
        s = sin(alpha);
        c = cos(alpha);
        v0 = -v2 * s;
        v2 = v2 * c;

        //translate to target coordinates
        object.x = v0 * distance;
        object.y = v1 * distance;
        object.z = v2 * distance;

    }

    /**/
    function PerspectiveProjection() {
        this.constructor();
    }

    function OrtographicProjection() {
        this.constructor();
    }

    function MouseCameraControl(camera, screenWidth, screenHeight) {
        this.constructor(camera, screenWidth, screenHeight);
    }

    /**/
    MouseCameraControl.prototype.constructor = function (camera, screenWidth, screenHeight) {

        var beforeX = 0;
        var beforeY = 0;
        var beforeV = 0;

        var dx = 0;
        var dy = 0;
        var dv = 0;

        var distance;
        var fieldOfView;
        var alpha;
        var omega;

        this.screenWidth = screenWidth || 0;
        this.screenHeight = screenHeight || 0;

        this.alphaSpeed = 2;
        this.omegaSpeed = 2;
        this.zoomSpeed = 1;

        this.maxAlpha = 99999999999;
        this.maxOmega = 89;
        this.maxDistance = 100;

        this.minAlpha = -99999999999;
        this.minOmega = -89;
        this.minDistance = 1;

        this.controlMoveEnable = true;
        this.controlWheelEnable = true;

        this.onMove = function (clientX, clientY) {
            clientX = parseInt(clientX / this.screenWidth * 360);
            clientY = parseInt(clientY / this.screenHeight * 180);

            if (beforeX && beforeY) {
                dx = (clientX - beforeX);
                dy = (clientY - beforeY);

                if (dx || dy) {

                    //load current values
                    alpha = camera.alpha;
                    omega = camera.omega;

                    if (dx !== 0) {
                        dx = (dx > 0) ? this.alphaSpeed : - this.alphaSpeed;
                        alpha += dx;

                        //validate camera alpha
                        if (alpha > this.maxAlpha || alpha < this.minAlpha)
                            alpha -= dx;
                    }

                    if (dy !== 0) {
                        dy = (dy > 0) ? this.omegaSpeed : -this.omegaSpeed;
                        omega += dy;

                        //validate camera omega
                        if (omega > this.maxOmega || omega < this.minOmega)
                            omega -= dy;

                    }

                    //save updated values
                    camera.alpha = alpha;
                    camera.omega = omega;

                    camera.updatedOrbite = true;
                }
            }

            beforeX = clientX;
            beforeY = clientY;
        };

        this.onWheel = function (value) {

            if (beforeV) {
                dv = (value - beforeV);

                if (dv > 0) {
                    distance = camera.distance - this.zoomSpeed;
                    fieldOfView = camera.projection.fieldOfView - 1;

                    //
                    if (distance > this.minDistance)
                        camera.distance = distance;
                    else if (fieldOfView > 0)
                        camera.projection.fieldOfView = fieldOfView;
                    else
                        ;

                    camera.updatedOrbite = true;
                } else if (dv < 0) {
                    distance = camera.distance + this.zoomSpeed;
                    fieldOfView = camera.projection.fieldOfView + 1;

                    //
                    if (fieldOfView < 45)
                        camera.projection.fieldOfView = fieldOfView;
                    else if (distance < this.maxDistance)
                        camera.distance = distance;
                    else
                        ;

                    camera.updatedOrbite = true;
                } else {
                    ;
                }   //

            }   //

            beforeV = value;
        };

        this.setCamera = function (newCamera) {
            !newCamera || (camera = newCamera);
        };

    };

    MouseCameraControl.prototype.createMoveEvent = function (target, eventHandler, isTouchEvent) {
        var clientX;
        var clientY;
        var listener;
        var pass;
        var self = this;

        if (isTouchEvent) {
            listener = function (touchEvent) {
                touchEvent.preventDefault();
                touches = touchEvent.changedTouches;

                if (self.controlMoveEnable && touches.length === 1) {
                    pass = eventHandler ? eventHandler(touchEvent, true) : true;

                    if (pass) {
                        clientX = touches[0].clientX;
                        clientY = touches[0].clientY;

                        self.onMove(clientX, clientY);
                    }
                }

            };

            target.addEventListener('touchmove', listener);
        } else {
            listener = function (mouseEvent) {
                if (self.controlMoveEnable) {
                    pass = eventHandler ? eventHandler(mouseEvent, false) : true;

                    if (pass) {
                        clientX = mouseEvent.clientX;
                        clientY = mouseEvent.clientY;

                        self.onMove(clientX, clientY);
                    }
                }
            };

            target.addEventListener('mousemove', listener);
        }

        return listener;
    };

    MouseCameraControl.prototype.createZoomEvent = function (target, eventHandler, isTouchEvent) {
        var self = this;
        var listener;
        var delta = 0;
        var touches;
        var dx, dy;
        var pass;

        if (isTouchEvent) {
            listener = function (touchEvent) {
                touchEvent.preventDefault();
                touches = touchEvent.changedTouches;

                if (self.controlWheelEnable && touches.length > 1) {
                    pass = eventHandler ? eventHandler(touchEvent, true) : true;

                    if (pass) {
                        dx = touches[0].clientX - touches[1].clientX;
                        dy = touches[0].clientY - touches[1].clientY;
                        delta = Math.sqrt(dx * dx + dy * dy);

                        self.onWheel(delta);
                    }
                }

            };

            target.addEventListener('touchmove', listener);
        } else {
            listener = function (wheelEvent) {
                if (self.controlWheelEnable) {
                    pass = eventHandler ? eventHandler(wheelEvent, false) : true;
                    if (pass) {
                        delta += wheelEvent.deltaY;
                        self.onWheel(delta);
                    }
                }
            };

            target.addEventListener('mousewheel', listener);
        }

        return listener;
    };

    /**/
    PerspectiveProjection.prototype.constructor = function () {
        this.fieldOfView = 45;
        this.ratio = 1;
        this.znear = 1.0;
        this.zfar = 100.0;

    };

    PerspectiveProjection.prototype.project = function () {
        projectMat4(this.fieldOfView, this.ratio, this.znear, this.zfar);
    };

    /**/
    OrtographicProjection.prototype.constructor = function () {
        this.ratio = 1;
        this.rigth = 1;
        this.left = -1;
        this.up = 1;
        this.down = -1;
        this.znear = 1;
        this.zfar = -1;

    };

    OrtographicProjection.prototype.project = function () {
        ortographicMat4(this.ratio, this.rigth, this.left, this.up, this.down, this.znear, this.zfar);
    };

    /**/
    Camera.PERSPECTIVE_PROJECTION = 0x626701;

    Camera.ORTOGRAPHIC_PROJECTION = 0x626702;

    Camera.prototype.constructor = function () {

        this.updatedOrbite = false;
        this.updatedPerspective = true;

        this.x = 0;
        this.y = 0;
        this.z = 1;

        this.targteX = 0;
        this.targetY = 0;
        this.targetZ = 0;

        this.upx = 0;
        this.upy = 1;
        this.upz = 0;

        this.distance = 0;
        this.alpha = 0;
        this.omega = 0;
        
        this.viewMatrix = new Float32Array(16);
        this.projection = this.generateProjection(Camera.PERSPECTIVE_PROJECTION);

    };

    Camera.prototype.generateProjection = function (type) {
        return type === Camera.PERSPECTIVE_PROJECTION ? new PerspectiveProjection() : new OrtographicProjection();
    };

    Camera.prototype.generateMouseCameraControl = function (screenWidth, screenHeight) {
        return new MouseCameraControl(this, screenWidth, screenHeight);
    };

    Camera.prototype.setProjection = function (projection) {
        return this.projection = projection;
    };

    Camera.prototype.setCoords = function (x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;

        this.updatedPerspective = true;
    };

    Camera.prototype.setTargetCoords = function (x, y, z) {
        this.targteX = x;
        this.targetY = y;
        this.targetZ = z;

        this.updatedPerspective = true;
    };

    Camera.prototype.orbiteAroundTarget = function (distance, alpha, omega) {

        //update orbital values
        distance === undefined || (this.distance = distance);
        alpha === undefined || (this.alpha = alpha);
        omega === undefined || (this.omega = omega);
        
        //compute orbital position
        computeOrbitalLocation(this, this.distance, this.alpha, this.omega);
        
        //fix center to target position
        this.x += this.targteX;
        this.y += this.targetY;
        this.z += this.targetZ;

        this.update();
    };

    Camera.prototype.update = function () {

        this.updatedPerspective = false;
        this.updatedOrbite = false;
        
        loockAtMat4(this.x, this.y, this.z, this.targteX, this.targetY, this.targetZ, this.upx, this.upy, this.upz);
        this.projection.project();

        multiplyMat4(cameraMatrix, projectionMatrix, this.viewMatrix);
    };
    
    Camera.prototype.setToGPU = function (gl, cameraStruct) {
        cameraStruct || (cameraStruct = {});
        
        gl.uniformMatrix4fv(cameraStruct.mview, false, this.viewMatrix);
        gl.uniform3f(cameraStruct.coords, this.x, this.y, this.z);
    };

    /**/
    Ligth.AMBIENT_LIGTH = 0x62676001;
    
    Ligth.DIRECTIONAL_LIGTH = 0x62676002;
    
    Ligth.DOT_LIGTH = 0x62676003;
    
    Ligth.SPOT_LIGTH = 0x62676004;
    
    Ligth.prototype.constructor = function (type) {
        type || (type = Ligth.DOT_LIGTH);
        
        this.enable = true;
        this.directional = (type === Ligth.DIRECTIONAL_LIGTH);
        this.ambient = (type === Ligth.AMBIENT_LIGTH);
        this.spot = (type === Ligth.SPOT_LIGTH);
        
        this.x = 100;
        this.y = 100;
        this.z = 100;

        this.targetX = 0;
        this.targetY = 0;
        this.targetZ = 0;
        
        this.alpha = 0;
        this.omega = 0;
        this.distance = 10;
        this.useRadians = false;
        
        this.color = {r: 1, g: 1, b: 1};

        this.direction = new Float32Array([1, 1, 1]);

        this.maxDot = cos(0.25 * PI);
    };

    Ligth.prototype.computeDirection = function () {
        this.direction[0] = this.targetX - this.x;
        this.direction[1] = this.targetY - this.y;
        this.direction[2] = this.targetZ - this.z;

        normalizedVec3(this.direction);
    };

    Ligth.prototype.setTargetCoords = function (x, y, z) {
        this.targetX = x;
        this.targetY = y;
        this.targetZ = z;

        this.computeDirection();
    };

    Ligth.prototype.setCoords = function (x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;

        this.computeDirection();
    };

    Ligth.prototype.setColor = function (r, g, b) {
        this.color.r = r || 0;
        this.color.g = g || 0;
        this.color.b = b || 0;

    };
    
    Ligth.prototype.setSpotLimit = function(angle){
        angle === undefined || (this.maxDot = this.useRadians ? cos(angle) : cos(angle / 180 * PI));
    };
    
    Ligth.prototype.orbiteAroundTarget = function (distance, alpha, omega, useRadians) {
        
        //update orbital values
        distance === undefined || (this.distance = distance);
        alpha === undefined || (this.alpha = alpha);
        omega === undefined || (this.omega = omega);
        useRadians === undefined || (this.useRadians = useRadians);
        
        //compute orbital position
        computeOrbitalLocation(this, this.distance, this.alpha, this.omega, this.useRadian);
        
        //locate orbit center to target coord
        this.x += this.targetX;
        this.y += this.targetY;
        this.z += this.targetZ;
        
        this.computeDirection();
    };

    Ligth.prototype.setToGPU = function (gl, ligthStruct) {
        ligthStruct || (ligthStruct = {});
        
        gl.uniform1i(ligthStruct.enable, this.enable ? 1 : 0);
        gl.uniform1i(ligthStruct.ambient, this.ambient ? 1 : 0);
        gl.uniform1i(ligthStruct.directional, this.directional ? 1 : 0);
        gl.uniform1i(ligthStruct.spot, this.spot ? 1 : 0);

        gl.uniform3f(ligthStruct.coords, this.x, this.y, this.z);
        gl.uniform3f(ligthStruct.color, this.color.r, this.color.g, this.color.b);
        gl.uniform3fv(ligthStruct.direction, this.direction);
        
        gl.uniform1f(ligthStruct.maxDot, this.maxDot);
    };

    /**/
    Scene.prototype.constructor = function (params) {
        params = params || {};

        var glCanvas = document.createElement('canvas');
        var guiCanvas = document.createElement('canvas');
        var glCanvasCSSRules = 'position: absolute; left: 0; top: 0; z-index: 0';
        var guiCanvasCSSRules = 'position: absolute; left: 0; top: 0; z-index: 0';

        this.renderWidth = 480;
        this.renderHeight = 360;

        glCanvas.width = 480;
        glCanvas.height = 360;

        guiCanvas.width = 480;
        guiCanvas.height = 360;

        //create resize event listener
        function resize() {
            var sizeCSSRules = 'width: ' + window.innerWidth + 'px; height: ' + window.innerHeight + 'px;';

            glCanvas.style.cssText = glCanvasCSSRules + sizeCSSRules;
            guiCanvas.style.cssText = guiCanvasCSSRules + sizeCSSRules;

        }
        window.onresize = resize;
        resize();

        //get and perform draw context's
        this.gl = glCanvas.getContext('webgl') || glCanvas.getContext('experimental-webgl');
        this.gui = guiCanvas.getContext('2d');

        //configure GL
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.CULL_FACE);

        this.gl.clearColor(0, 0, 0, 1);
        this.gl.viewport(0, 0, 480, 360);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        //stats loger
        this.fps = null;

        //scene elements
        this.ligths = new Array();
        this.ambientLigth = {r: 0.5, g: 0.5, b: 0.5};
        this.camera = new Camera();
        this.objects = new Array();

        this.getGLCanvas = function () {
            return glCanvas;
        };

        this.getGUICanvas = function () {
            return guiCanvas;
        };

    };

    Scene.prototype.draw = function () {

        gl = this.gl;
        camera = this.camera;

        //compute updated camera matrix
        if (camera.updatedOrbite)
            camera.orbiteAroundTarget();
        else if (camera.updatedPerspective)
            camera.update();
        else
            ;

        //clear screen
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        //draw scene objects 
        numObjects = this.objects.length;
        for (var i = 0; i < numObjects; i++) {
            object = this.objects[i];

            //draw visible object
            if (object.visible) {

                //prepare new model to use
                if (object.model.id !== currentModelID) {
                    model.shader.attribs.disbale(gl); //disable before model and 
                    model = object.model;

                    //prepare shader to use
                    if (model.shader.id !== currentShaderID) {
                        shader = model.shader;
                        uniforms = shader.uniforms;

                        //enable shader and attribs
                        gl.useProgram(shader);
                        shader.attribs.enable(gl);

                        //configure scene camera
                        camera.setToGPU(gl, uniforms.camera);

                        //comfigure ambient ligth color
                        gl.uniform3f(uniforms.ambientLigth, this.ambientLigth.r, this.ambientLigth.g, this.ambientLigth.b);

                        //configure scene ligth's
                        numLigths = uniforms.ligths.length;
                        for (var i = 0; i < numLigths; i++) {
                            this.ligths[i].setToGPU(gl, uniforms.ligths[i]);
                        }

                        currentShaderID = shader.id;
                    }   //end enable shader

                    model.prepare(gl);
                    currentModelID = model.id;
                }   //end enable model

                model.draw(gl, object);
            }   //end draw visible object

        }   //end for draw objects

        //log and show rendering stats
        if (this.fps) {
            if (this.fps.countFrame()) {
                this.fps.showFPSRateGraph(this.gui, 10, 260);
            }

            this.fps.showFPSRateGraph(this.gui, 10, 380);
        }

        //disable models
        currentModelID = -1;
        currentShaderID = -1;

    };

})();