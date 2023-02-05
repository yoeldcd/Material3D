
function Instance(name, x, y, z) {
    this.name = name;
    this.type = -1;
    this.transformMatrix = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x || 0, y || 0, z || 0, 1]);
}

function Camera() {
    this.viewMatrix = new Float32Array(16);
    this.projection = this.generateProjection(Camera.PERSPECTIVE_PROJECTION);
}

function Ligth() {

    this.red = 1;
    this.green = 1;
    this.blue = 1;

    this.x = 100;
    this.y = 100;
    this.z = 100;

    this.targetX = 0;
    this.targetY = 0;
    this.targetZ = 0;

    this.direction = new Float32Array(3);
    this.maxDot = 1;

}

(function () {
    var cameraMatrix = new Float32Array(16);
    var projectionMatrix = new Float32Array(16);
    var transformMatrix = new Float32Array(16);

    var vector = new Float32Array(4);
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

    function detMat3(r00, r01, r02, r10, r11, r12, r20, r21, r22) {

        /*
         * r00 r01 r02
         * r10 r11 r12
         * r20 r21 r22
         */

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

    function projectMat4(fieldOfView, isRadian, ratio, znear, zfar) {
        isRadian || (fieldOfView = fieldOfView / 180 * PI);

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
        projectionMatrix[14] = 0;
        projectionMatrix[15] = 1;

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

    function computeOrbitalLocation(object, dist, alpha, omega, isRadian) {

        if (!isRadian) {
            alpha *= (PI / 180);
            omega *= (PI / 180);
        }

        //rotate around X
        s = sin(omega);
        c = cos(omega);
        v1 = dist * s;
        v2 = dist * c;
        
        //rotate around Y
        s = sin(alpha);
        c = cos(alpha);
        v0 = -v2 * s;
        v2 = v2 * c;

        //translate to target coordinates
        object.x = v0;
        object.y = v1;
        object.z = v2;

    }
    
    
    function CameraControl(camera, screenWidth, screenHeight) {

        var beforeX = 0;
        var beforeY = 0;
        var beforeV = 0;

        var dx = 0;
        var dy = 0;
        var dv = 0;

        var dist;
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
                        dx = (dx > 0) ? this.alphaSpeed : -this.alphaSpeed;

                        //transform deg2rad if need
                        if (camera.useRadians) {
                            dx *= (PI / 180);
                        }

                        alpha += dx;

                        //validate camera alpha
                        if (alpha > this.maxAlpha || alpha < this.minAlpha)
                            alpha -= dx;
                    }

                    if (dy !== 0) {
                        dy = (dy > 0) ? this.omegaSpeed : -this.omegaSpeed;

                        //transform deg2rad if need
                        if (camera.useRadians) {
                            dy *= (PI / 180);
                        }

                        omega += dy;

                        //validate camera omega
                        if (omega > this.maxOmega || omega < this.minOmega)
                            omega -= dy;

                    }

                    //save updated values
                    camera.alpha = alpha;
                    camera.omega = omega;

                    camera.orbite();
                }
            }

            beforeX = clientX;
            beforeY = clientY;
        };

        this.onWheel = function (value) {

            if (beforeV) {

                dv = (value - beforeV);

                if (dv) {
                    dv = dv < 0 ? this.zoomSpeed : - this.zoomSpeed;
                    dist = camera.distance + dv;

                    if (dist <= this.maxDistance && dist >= this.minDistance) {
                        camera.distance = dist;
                        camera.orbite();
                    }
                }
            }

            beforeV = value;
        };

    }

    CameraControl.prototype.createMoveEvent = function (target, eventHandler, isTouchEvent) {
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
    
    CameraControl.prototype.createZoomEvent = function (target, eventHandler, isTouchEvent) {
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


    function PerspectiveProjection() {

        this.fieldOfView = 45;
        this.ratio = 1;
        this.znear = 1.0;
        this.zfar = 100.0;

    }

    PerspectiveProjection.prototype.project = function (useRadians) {
        projectMat4(this.fieldOfView, useRadians, this.ratio, this.znear, this.zfar);
    };


    function OrtographicProjection() {

        this.ratio = 1;
        this.rigth = 1;
        this.left = -1;
        this.up = 1;
        this.down = -1;
        this.znear = 1;
        this.zfar = -1;

    }

    OrtographicProjection.prototype.project = function () {
        ortographicMat4(this.ratio, this.rigth, this.left, this.up, this.down, this.znear, this.zfar);
    };


    Instance.prototype.setTransform = function (mat) {
        if (mat) {
            transformMatrix = this.transformMatrix;

            transformMatrix[0] = mat[0];
            transformMatrix[1] = mat[1];
            transformMatrix[2] = mat[2];
            transformMatrix[3] = mat[3];

            transformMatrix[4] = mat[4];
            transformMatrix[5] = mat[5];
            transformMatrix[6] = mat[6];
            transformMatrix[7] = mat[7];

            transformMatrix[8] = mat[8];
            transformMatrix[9] = mat[9];
            transformMatrix[10] = mat[10];
            transformMatrix[11] = mat[11];

            transformMatrix[12] = mat[12];
            transformMatrix[13] = mat[13];
            transformMatrix[14] = mat[14];
            transformMatrix[15] = mat[15];

        }

        return mat;
    };

    Instance.prototype.getTransform = function (mat) {
        if (mat) {
            transformMatrix = this.transformMatrix;

            mat[0] = transformMatrix[0];
            mat[1] = transformMatrix[1];
            mat[2] = transformMatrix[2];
            mat[3] = transformMatrix[3];

            mat[4] = transformMatrix[4];
            mat[5] = transformMatrix[5];
            mat[6] = transformMatrix[6];
            mat[7] = transformMatrix[7];

            mat[8] = transformMatrix[8];
            mat[9] = transformMatrix[9];
            mat[10] = transformMatrix[10];
            mat[11] = transformMatrix[11];

            mat[12] = transformMatrix[12];
            mat[13] = transformMatrix[13];
            mat[14] = transformMatrix[14];
            mat[15] = transformMatrix[15];

        }

        return mat;
    };

    Instance.prototype.setPosition = function (x, y, z) {
        this.transformMatrix[12] = x || 0;
        this.transformMatrix[13] = y || 0;
        this.transformMatrix[14] = z || 0;
    };

    Instance.prototype.getPosition = function (vec) {
        !vec || (vec = vector);

        vec[0] = this.transformMatrix[12];
        vec[1] = this.transformMatrix[13];
        vec[2] = this.transformMatrix[14];
        vector[3] = 1;

        return vec;
    };


    Camera.PERSPECTIVE_PROJECTION = 0x626701;

    Camera.ORTOGRAPHIC_PROJECTION = 0x626702;

    Camera.prototype.x = 0;

    Camera.prototype.y = 0;

    Camera.prototype.z = 1;

    Camera.prototype.atx = 0;

    Camera.prototype.aty = 0;

    Camera.prototype.atz = 0;

    Camera.prototype.upx = 0;

    Camera.prototype.upy = 1;

    Camera.prototype.upz = 0;

    Camera.prototype.useRadians = false;

    Camera.prototype.updated = false;

    Camera.prototype.distance = 0;

    Camera.prototype.alpha = 0;

    Camera.prototype.omega = 0;


    Camera.prototype.generateProjection = function (type) {
        return type === Camera.PERSPECTIVE_PROJECTION ? new PerspectiveProjection() : new OrtographicProjection();
    };

    Camera.prototype.generateControl = function (screenWidth, screenHeight) {
        return new CameraControl(this, screenWidth, screenHeight);
    };

    Camera.prototype.orbite = function (dist, alpha, omega, isRadian) {

        isRadian = isRadian || this.useRadians;
        dist !== undefined || (dist = this.distance || 1);
        alpha !== undefined || (alpha = this.alpha || 0);
        omega !== undefined || (omega = this.omega || 0);

        computeOrbitalLocation(this, dist, alpha, omega, isRadian);
        this.x += (this.atx || 0);
        this.y += (this.aty || 0);
        this.z += (this.atz || 0);
        
        this.update();
    };

    Camera.prototype.update = function () {
        this.updated = true;

        loockAtMat4(this.x, this.y, this.z, this.atx, this.aty, this.atz, this.upx, this.upy, this.upz);
        this.projection.project(this.useRadians);

        multiplyMat4(cameraMatrix, projectionMatrix, this.viewMatrix);
    };

    Camera.prototype.setToGPU = function (gl, viewMatrixUniform, viewCoordsUniform) {
        gl.uniformMatrix4fv(viewMatrixUniform, false, this.viewMatrix);
        gl.uniform3f(viewCoordsUniform, this.x, this.y, this.z);

    };

    Ligth.prototype.computeDirection = function () {
        this.direction[0] = this.targetX - this.x;
        this.direction[1] = this.targetY - this.y;
        this.direction[2] = this.targetZ - this.z;

        normalizedVec3(this.direction);
    };

    Ligth.prototype.orbite = function (dist, alpha, omega, isRadian) {
        computeOrbitalLocation(this, dist || 1, alpha || 0, omega || 0, isRadian);

        this.x += targetX;
        this.y += targetX;
        this.z += targetX;
        
        this.computeDirection();
    };

    Ligth.prototype.setToGPU = function (gl, ligthColorUniform, ligthCoordsUniform, ligthDirectionUniform, ligthMaxDotUniform) {

        gl.uniform3f(ligthColorUniform, this.red, this.green, this.blue);
        gl.uniform3f(ligthDirectionUniform, this.direction);
        gl.uniform3f(ligthCoordsUniform, this.x, this.y, this.z);
        gl.uniform1f(ligthMaxDotUniform, this.maxDot);

    };

})();