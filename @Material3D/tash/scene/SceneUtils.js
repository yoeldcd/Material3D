
window.RenderizableModel || (window.RenderizableModel = function () {});
window.RenderizableModel.Instance || (window.RenderizableModel.Instance = function () {});

var M3D = {};

(function () {

    var vecIn = new Float32Array(3);
    var vecAt = new Float32Array(3);
    var vecUp = new Float32Array(3);
    var vecX = new Float32Array(3);
    var vecY = new Float32Array(3);
    var vecZ = new Float32Array(3);

    var identityMatrix = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

    function normalizedVec3(vec, dst) {
        dst || (dst = vec);

        var length = Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2]);

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

        length = Math.sqrt(dst[0] * dst[0] + dst[1] * dst[1] + dst[2] * dst[2]);
        if (length !== 0) {
            dst[0] /= length;
            dst[1] /= length;
            dst[2] /= length;

        }

        return dst;
    }

    function invertMat4(matrix, dstMatrix, returnTranspose) {
        dstMatrix || (dstMatrix = matrix);

        var det;
        var a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p;

        //load matrix components
        a = matrix[0];
        b = matrix[1];
        c = matrix[2];
        d = matrix[3];
        e = matrix[4];
        f = matrix[5];
        g = matrix[6];
        h = matrix[7];
        i = matrix[8];
        j = matrix[9];
        k = matrix[10];
        l = matrix[11];
        m = matrix[12];
        n = matrix[13];
        o = matrix[14];
        p = matrix[15];

        //compute determinant
        det = a * f * k * p + b * g * l * m + c * h * i * n + d * e * j * o; //positive diagonals
        det -= m * j * g * d + n * k * h * a + o * l * e * b + p * i * f * c; //negative diagonals

        if (det !== 0) {

            //store multiplyScalar(transpose(cofactor(mat)), 1/det)

            if (returnTranspose) {

                //row 0 (DISCARTED ROW a b c d )
                dstMatrix[0] = (f * k * p + g * l * n + h * j * o - n * k * h - o * l * f - p * j * g) / det;
                dstMatrix[1] = (e * k * p + g * l * m + h * i * o - m * k * h - o * l * e - p * i * g) / -det;
                dstMatrix[2] = (e * j * p + f * l * m + h * i * n - m * j * h - n * l * e - p * i * f) / det;
                dstMatrix[3] = (e * j * o + f * k * m + g * i * n - m * j * g - n * k * e - o * i * f) / -det;

                //row 1 (DISCARTED ROW e f g h )
                dstMatrix[4] = (b * k * p + c * l * n + d * j * o - n * k * d - o * l * b - p * j * c) / -det;
                dstMatrix[5] = (a * k * p + c * l * m + d * i * o - m * k * d - o * l * a - p * i * c) / det;
                dstMatrix[6] = (a * j * p + b * l * m + d * i * n - m * j * d - n * l * a - p * i * b) / -det;
                dstMatrix[7] = (a * j * o + b * k * m + c * i * n - m * j * c - n * k * a - o * i * b) / det;

                //row 2 (DISCARTED ROW i j k l )
                dstMatrix[8] = (b * g * p + c * h * n + d * f * o - n * g * d - o * h * b - p * f * c) / det;
                dstMatrix[9] = (a * g * p + c * h * m + d * e * o - m * g * d - o * h * a - p * e * c) / -det;
                dstMatrix[10] = (a * f * p + b * h * m + d * e * n - m * f * d - n * h * a - p * e * b) / det;
                dstMatrix[11] = (a * f * o + b * g * m + c * e * n - m * f * c - n * g * a - o * e * b) / -det;

                //row 3 (DISCARTED ROW m n o p )
                dstMatrix[12] = (b * g * l + c * h * j + d * f * k - j * g * d - k * h * b - l * f * c) / -det;
                dstMatrix[13] = (a * g * l + c * h * i + d * e * k - i * g * d - k * h * a - l * e * c) / det;
                dstMatrix[14] = (a * f * l + b * h * i + d * e * j - i * f * d - j * h * a - l * e * b) / -det;
                dstMatrix[15] = (a * f * k + b * g * i + c * e * j - i * f * c - j * g * a - k * e * b) / det;

            } else {
                //column 0 (DISCARTED ROW a b c d )
                dstMatrix[0] = (f * k * p + g * l * n + h * j * o - n * k * h - o * l * f - p * j * g) / det;
                dstMatrix[4] = (e * k * p + g * l * m + h * i * o - m * k * h - o * l * e - p * i * g) / -det;
                dstMatrix[8] = (e * j * p + f * l * m + h * i * n - m * j * h - n * l * e - p * i * f) / det;
                dstMatrix[12] = (e * j * o + f * k * m + g * i * n - m * j * g - n * k * e - o * i * f) / -det;

                //column 1 (DISCARTED ROW e f g h )
                dstMatrix[1] = (b * k * p + c * l * n + d * j * o - n * k * d - o * l * b - p * j * c) / -det;
                dstMatrix[5] = (a * k * p + c * l * m + d * i * o - m * k * d - o * l * a - p * i * c) / det;
                dstMatrix[9] = (a * j * p + b * l * m + d * i * n - m * j * d - n * l * a - p * i * b) / -det;
                dstMatrix[13] = (a * j * o + b * k * m + c * i * n - m * j * c - n * k * a - o * i * b) / det;

                //column 2 (DISCARTED ROW i j k l )
                dstMatrix[2] = (b * g * p + c * h * n + d * f * o - n * g * d - o * h * b - p * f * c) / det;
                dstMatrix[6] = (a * g * p + c * h * m + d * e * o - m * g * d - o * h * a - p * e * c) / -det;
                dstMatrix[10] = (a * f * p + b * h * m + d * e * n - m * f * d - n * h * a - p * e * b) / det;
                dstMatrix[14] = (a * f * o + b * g * m + c * e * n - m * f * c - n * g * a - o * e * b) / -det;

                //column 3 (DISCARTED ROW m n o p )
                dstMatrix[3] = (b * g * l + c * h * j + d * f * k - j * g * d - k * h * b - l * f * c) / -det;
                dstMatrix[7] = (a * g * l + c * h * i + d * e * k - i * g * d - k * h * a - l * e * c) / det;
                dstMatrix[11] = (a * f * l + b * h * i + d * e * j - i * f * d - j * h * a - l * e * b) / -det;
                dstMatrix[15] = (a * f * k + b * g * i + c * e * j - i * f * c - j * g * a - k * e * b) / det;
            }
        }

        return matrix;
    }

    function loockAtMat4(matrix, x, y, z, atx, aty, atz, upx, upy, upz) {

        vecIn[0] = x - atx;
        vecIn[1] = y - aty;
        vecIn[2] = z - atz;

        vecAt[0] = atx;
        vecAt[1] = aty;
        vecAt[2] = atz;

        vecUp[0] = upx;
        vecUp[1] = upy;
        vecUp[2] = upz;

        //compute vectors
        normalizedVec3(vecIn, vecZ);
        crossNormalizedVec3(vecUp, vecZ, vecX);
        crossNormalizedVec3(vecZ, vecX, vecY);

        matrix[0] = vecX[0];
        matrix[1] = vecX[1];
        matrix[2] = vecX[2];
        matrix[3] = 0;

        matrix[4] = vecY[0];
        matrix[5] = vecY[1];
        matrix[6] = vecY[2];
        matrix[7] = 0;

        matrix[8] = vecZ[0];
        matrix[9] = vecZ[1];
        matrix[10] = vecZ[2];
        matrix[11] = 0;

        matrix[12] = x;
        matrix[13] = y;
        matrix[14] = z;
        matrix[15] = 1;

        return matrix;
    }

    function perspectiveMat4(matrix, fieldOfView, ratio, znear, zfar) {

        fieldOfView = fieldOfView / 180 * Math.PI;
        fv = 1.0 / Math.tan(fieldOfView / 2);
        inversev = 1 / (znear - zfar);

        matrix[0] = fv / ratio;
        matrix[1] = 0;
        matrix[2] = 0;
        matrix[3] = 0;

        matrix[4] = 0;
        matrix[5] = fv;
        matrix[6] = 0;
        matrix[7] = 0;

        matrix[8] = 0;
        matrix[9] = 0;
        matrix[10] = (zfar + znear) * inversev;
        matrix[11] = -1;

        matrix[12] = 0;
        matrix[13] = 0;
        matrix[14] = (zfar * znear * inversev * 2);
        matrix[15] = 0;

        return matrix;
    }

    function ortographicMat4(matrix, ratio, rigth, left, up, down, znear, zfar) {

        matrix[0] = 1 / (rigth - left) / ratio;
        matrix[1] = 0;
        matrix[2] = 0;
        matrix[3] = 0;

        matrix[4] = 0;
        matrix[5] = 1 / (up - down);
        matrix[6] = 0;
        matrix[7] = 0;

        matrix[8] = 0;
        matrix[9] = 0;
        matrix[10] = 1 / (znear - zfar);
        matrix[11] = 0;

        matrix[12] = 0;
        matrix[13] = 0;
        matrix[14] = 0;
        matrix[15] = 1;

        return matrix;
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

        return dst;
    }

    function translateMat4(matrix, Tx, Ty, Tz) {

        //Translate in X axis
        ///////////////////////////////////////////////////
        if (Tx)
            matrix[12] += Tx * matrix[0] + Ty * matrix[4] + Tz * matrix[8];

        //Translate in Y axis
        ///////////////////////////////////////////////////
        if (Ty)
            matrix[13] += Tx * matrix[1] + Ty * matrix[5] + Tz * matrix[9];

        //Translate in Z axis
        ///////////////////////////////////////////////////
        if (Tz)
            matrix[14] += Tx * matrix[2] + Ty * matrix[6] + Tz * matrix[10];

        return matrix;
    }

    function rotateMat4(matrix, Rx, Ry, Rz) {
        var x, y, z, s, c;

        //Rotate around X
        ///////////////////////////////////////////////////
        if (Rx) {
            Rx *= Math.PI / 180;
            s = Math.sin(Rx);
            c = Math.cos(Rx);

            //multiply this by MATRIX (PREORDIN: MatRotX * Mat)
            y = matrix[4];
            z = matrix[8];
            matrix[4] = y * c + z * s;
            matrix[8] = -y * s + z * c;

            y = matrix[5];
            z = matrix[9];
            matrix[5] = y * c + z * s;
            matrix[9] = -y * s + z * c;

            y = matrix[6];
            z = matrix[10];
            matrix[6] = y * c + z * s;
            matrix[10] = -y * s + z * c;
        }

        //Rotate around Y
        ///////////////////////////////////////////////////
        if (Ry) {
            Ry *= Math.PI / 180;
            s = Math.sin(Ry);
            c = Math.cos(Ry);

            //multyply this by MATRIX (PREORDIN: MatRotY * Mat)
            x = matrix[0];
            z = matrix[8];
            matrix[0] = x * c - z * s;
            matrix[8] = x * s + z * c;

            x = matrix[1];
            z = matrix[9];
            matrix[1] = x * c - z * s;
            matrix[9] = x * s + z * c;

            x = matrix[2];
            z = matrix[10];
            matrix[2] = x * c - z * s;
            matrix[10] = x * s + z * c;

        }

        //Rotate around Z
        ///////////////////////////////////////////////////
        if (Rz) {
            Rz *= Math.PI / 180;
            s = Math.sin(Rz);
            c = Math.cos(Rz);

            //multyply this by MATRIX (PREORDIN: MatRotZ * Mat)
            x = matrix[0];
            y = matrix[4];
            matrix[0] = x * c + y * s;
            matrix[4] = -x * s + y * c;

            x = matrix[1];
            y = matrix[5];
            matrix[1] = x * c + y * s;
            matrix[5] = -x * s + y * c;

            x = matrix[2];
            y = matrix[6];
            matrix[2] = x * c + y * s;
            matrix[6] = -x * s + y * c;

        }

        return matrix;
    }

    function scaleMat4(matrix, Sx, Sy, Sz) {

        //Scale in X axis
        ///////////////////////////////////////////////////
        if (Sx && Sx !== 1) {
            matrix[0] *= Sx;
            matrix[1] *= Sx;
            matrix[2] *= Sx;
            matrix[3] *= Sx;
        }

        //Scale in Y axis
        ///////////////////////////////////////////////////
        if (Sy && Sy !== 1) {
            matrix[4] *= Sy;
            matrix[5] *= Sy;
            matrix[6] *= Sy;
            matrix[7] *= Sy;
        }

        //Scale in Z axis
        ///////////////////////////////////////////////////
        if (Sz && Sz !== 1) {
            matrix[8] *= Sz;
            matrix[9] *= Sz;
            matrix[10] *= Sz;
            matrix[11] *= Sz;
        }

        return matrix;
    }

    function identityMat4(matrix) {

        matrix[0] = 1;
        matrix[1] = 0;
        matrix[2] = 0;
        matrix[3] = 0;

        matrix[4] = 0;
        matrix[5] = 1;
        matrix[6] = 0;
        matrix[7] = 0;

        matrix[8] = 0;
        matrix[9] = 0;
        matrix[10] = 1;
        matrix[11] = 0;

        matrix[12] = 0;
        matrix[13] = 0;
        matrix[14] = 0;
        matrix[15] = 1;

        return matrix;
    }

    function copyMat4(matrixSrc, matrixDst) {

        matrixDst[0] = matrixSrc[0];
        matrixDst[1] = matrixSrc[1];
        matrixDst[2] = matrixSrc[2];
        matrixDst[3] = matrixSrc[3];

        matrixDst[4] = matrixSrc[4];
        matrixDst[5] = matrixSrc[5];
        matrixDst[6] = matrixSrc[6];
        matrixDst[7] = matrixSrc[7];

        matrixDst[8] = matrixSrc[8];
        matrixDst[9] = matrixSrc[9];
        matrixDst[10] = matrixSrc[10];
        matrixDst[11] = matrixSrc[11];

        matrixDst[12] = matrixSrc[12];
        matrixDst[13] = matrixSrc[13];
        matrixDst[14] = matrixSrc[14];
        matrixDst[15] = matrixSrc[15];

        return matrixDst;
    }

    function defineUpdateablePropertyVector(object, property1, property2, property3, value1, value2, value3) {
        var vector = new Float32Array([value1, value2, value3]);

        property1 && Object.defineProperty(vector, property1, {
            configurable: false,
            get: function () {
                return this[0];
            },
            set: function (value) {
                this[0] = value;
                object.updated = true;
            }
        });

        property2 && Object.defineProperty(vector, property2, {
            configurable: false,
            get: function () {
                return this[1];
            },
            set: function (value) {
                this[1] = value;
                object.updated = true;
            }
        });

        property3 && Object.defineProperty(vector, property3, {
            configurable: false,
            get: function () {
                return this[2];
            },
            set: function (value) {
                this[2] = value;
                object.updated = true;
            }
        });

        vector.set = function (newValue1, newValue2, newValue3) {
            this[0] = newValue1;
            this[1] = newValue2;
            this[2] = newValue3;

            object.updated = true;
        };

        vector.get = function () {
            return new Float32Array(this);
        };

        return vector;
    }

    function defineUpdateableProperty(object, property, valueP) {

        Object.defineProperty(object, property, {
            configurable: false,
            get: function () {
                return valueP;
            },
            set: function (value) {
                valueP = value;
                object.updated = true;
            }
        });

    }

    //Scene class constructor and properties
    M3D.Scene = function () {

        //define scene elements lists
        /////////////////////////////////
        var ligths = new M3D.List();
        var models = new M3D.List();
        var objects = new M3D.List();

        //Ligths list controls
        this.addLigth = function (ligth, name) {
            name && (ligth.name = name);
            return ligths.add(ligth);
        };

        this.getLigth = function (name) {
            return ligths.getByName(name);
        };

        this.removeLigth = function (name) {
            return ligths.removeByName(name);
        };

        //Models list controls
        this.addModel = function (model, name) {
            name && (model.name = name);
            return models.add(model);
        };

        this.getModel = function (name) {
            return models.getByName(name);
        };

        this.removeModel = function (name) {
            return models.removeByName(name);
        };

        //Objects list controls
        this.addObject = function (object, name) {
            name && (object.name = name);
            return objects.add(object);
        };

        this.getObject = function (name) {
            return objects.getByName(name);
        };

        this.removeObject = function (name) {
            return objects.removeByName(name);
        };

        //renderer resource getter
        this.getRenderData = function (renderer, storage) {
            if (renderer instanceof M3D.Renderer) {
                storage.ligths = ligths;
                storage.models = models;
                storage.objects = objects;
            }
        };

    };

    //Camera class constructor and properties
    ////////////////////////////////////////////////////////////////////////////
    M3D.Camera = function (name, projection) {

        //camera resources
        this.name = name;
        this.ratio = NaN;
        this.projection = projection || new M3D.Camera.PerspectiveProjection();

        //camera parameters
        this.coords = defineUpdateablePropertyVector(this, 'x', 'y', 'z', 0, 0, 10);
        this.target = defineUpdateablePropertyVector(this, 'x', 'y', 'z', 0, 0, 0);
        this.upvect = defineUpdateablePropertyVector(this, 'x', 'y', 'z', 0, 1, 0);

        //camera model view matrix
        this.viewMatrix = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
        this.update();
        this.updated = false;

    };

    M3D.Camera.prototype.setCoords = function (x, y, z) {
        this.coords[0] = x;
        this.coords[1] = y;
        this.coords[2] = z;
        this.updated = true;
    };

    M3D.Camera.prototype.setTargetCoords = function (x, y, z) {
        this.target[0] = x;
        this.target[1] = y;
        this.target[2] = z;
        this.updated = true;
    };

    M3D.Camera.prototype.setProjection = function (projection) {

        if (projection instanceof M3D.Camera.PerspectiveProjection || projection instanceof M3D.Camera.OrtographicProjection) {
            this.projection = projection;

            if (!isNaN(this.ratio)) {
                this.projection.ratio = this.ratio;
            }
        }

        return projection;
    };

    M3D.Camera.prototype.computeOutputRatio = function (width, height) {

        if (width && height) {
            this.ratio = width / height;

            if (this.projection)
                this.projection.ratio = this.ratio;

        }
    };

    M3D.Camera.prototype.update = function () {
        loockAtMat4(this.viewMatrix, this.coords.x, this.coords.y, this.coords.z, this.target.x, this.target.y, this.target.z, this.upvect.x, this.upvect.y, this.upvect.z);
        invertMat4(this.viewMatrix);

        this.updated = false;
    };

    M3D.Camera.prototype.sendToGPU = function (gl, cameraStruct) {

        //update camera if need
        if (this.updated)
            this.update();

        //update projection if need
        if (this.projection.updated)
            this.projection.update();

        //send camera data to GPU
        gl.uniformMatrix4fv(cameraStruct.mview, false, this.viewMatrix);
        gl.uniformMatrix4fv(cameraStruct.mproject, false, this.projection.projectionMatrix);
        gl.uniform3fv(cameraStruct.coords, this.coords);

    };

    //Camera : Perspective Projection class constructor and properties
    ////////////////////////////////////////////////////////////////////////////
    M3D.Camera.PerspectiveProjection = function (fieldOfView, ratio, znear, zfar) {

        //define projection properties
        defineUpdateableProperty(this, 'ratio', ratio || 1);
        defineUpdateableProperty(this, 'fieldOfView', fieldOfView || 45);
        defineUpdateableProperty(this, 'znear', znear || 0.01);
        defineUpdateableProperty(this, 'zfar', zfar || 100);

        this.projectionMatrix = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
        this.updated = true;

    };

    M3D.Camera.PerspectiveProjection.prototype.setRatio = function (ratio) {
        isNaN(ratio) || (this.ratio = ratio);
    };

    M3D.Camera.PerspectiveProjection.prototype.setFrustrum = function (fieldOfView, znear, zfar) {

        isNaN(fieldOfView) || (this.fieldOfView = fieldOfView);
        isNaN(znear) || (this.znear = znear);
        isNaN(zfar) || (this.zfar = zfar);

    };

    M3D.Camera.PerspectiveProjection.prototype.update = function () {
        perspectiveMat4(this.projectionMatrix, this.fieldOfView, this.ratio, this.znear, this.zfar);
        this.updated = false;
    };

    //Camera : Ortographic Projection class constructor and properties
    ////////////////////////////////////////////////////////////////////////////
    M3D.Camera.OrtographicProjection = function (ratio, rigth, left, up, down, znear, zfar) {

        //define projection properties
        defineUpdateableProperty(this, 'ratio', ratio || 1);
        defineUpdateableProperty(this, 'rigth', rigth || 1);
        defineUpdateableProperty(this, 'left', left || -1);
        defineUpdateableProperty(this, 'up', up || 1);
        defineUpdateableProperty(this, 'down', down || -1);
        defineUpdateableProperty(this, 'znear', znear || 1);
        defineUpdateableProperty(this, 'zfar', zfar || -1);

        this.projectionMatrix = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
        this.updated = true;

    };

    M3D.Camera.OrtographicProjection.prototype.setRatio = function (ratio) {
        isNaN(ratio) || (this.ratio = ratio);
    };

    M3D.Camera.OrtographicProjection.prototype.setFrustrum = function (rigth, left, up, down, znear, zfar) {
        isNaN(rigth) || (this.rigth = rigth);
        isNaN(left) || (this.left = left);
        isNaN(up) || (this.up = up);
        isNaN(down) || (this.down = down);
        isNaN(znear) || (this.znear = znear);
        isNaN(zfar) || (this.zfar = zfar);

    };

    M3D.Camera.OrtographicProjection.prototype.setCubicFrustrum = function (width, height, depth) {
        isNaN(width) && (width = 2);
        isNaN(height) && (height = width);
        isNaN(depth) && (height = depth);

        width /= 2;
        this.rigth = width;
        this.left = -width;

        height /= 2;
        this.up = height;
        this.down = -height;

        depth /= 2;
        this.znear = -depth;
        this.zfar = depth;

    };

    M3D.Camera.OrtographicProjection.prototype.update = function () {
        ortographicMat4(this.projectionMatrix, this.ratio, this.rigth, this.left, this.up, this.down, this.znear, this.zfar);
        this.updated = false;
    };

    //Ligth class constructor and properties
    ////////////////////////////////////////////////////////////////////////////
    M3D.Ligth = function (name, type) {

        //define ligth properties
        this.name = name;
        this.type = type || M3D.Ligth.AMBIENTAL;

        //define ligth state
        this.enable = false;
        this.updated = false;

        //define ligth parameters
        this.coords = defineUpdateablePropertyVector(this, 'x', 'y', 'z', 1, 1, 1);
        this.target = defineUpdateablePropertyVector(this, 'x', 'y', 'z', 0, 0, 0);
        this.color = defineUpdateablePropertyVector(this, 'r', 'g', 'b', 1, 1, 1);
        this.direction = defineUpdateablePropertyVector(this, 'x', 'y', 'z', 1, 1, 1);

        defineUpdateableProperty(this, 'dotAngle', -1);

        this.maxDot = -1;
        this.update();
        this.updated = true;

    };

    M3D.Ligth.AMBIENTAL = 62676001;

    M3D.Ligth.DIRECTIONAL = 62676002;

    M3D.Ligth.DOTTED = 62676003;

    M3D.Ligth.SPOT = 62676004;

    M3D.Ligth.prototype.setCoords = function (x, y, z) {
        this.coords[0] = x;
        this.coords[1] = y;
        this.coords[2] = z;
        this.updated = true;
    };

    M3D.Ligth.prototype.setTargetCoords = function (x, y, z) {
        this.target[0] = x;
        this.target[1] = y;
        this.target[2] = z;
        this.updated = true;
    };

    M3D.Ligth.prototype.setColor = function (red, green, blue) {
        this.color[0] = red || 0;
        this.color[1] = green || 0;
        this.color[2] = blue || 0;
        this.updated = true;
    };

    M3D.Ligth.prototype.setSpotAngle = function (angle) {
        this.spotAngle = angle;
        this.updated = true;
    };

    M3D.Ligth.prototype.update = function () {

        //compute delta direction
        var dx = this.target.x - this.coords.x;
        var dy = this.target.y - this.coords.y;
        var dz = this.target.z - this.coords.z;

        var length = Math.sqrt(dx * dx + dy * dy + dz * dz);

        //normalize direction value
        if (length !== 0) {
            dx /= length;
            dy /= length;
            dz /= length;
        }

        //store direction value
        this.direction[0] = dx;
        this.direction[1] = dy;
        this.direction[2] = dz;

        //compute spot ligth angle cosine
        this.maxDot = Math.cos(this.spotAngle / 180 * Math.PI);

        this.updated = false;
    };

    M3D.Ligth.prototype.sendToGPU = function (gl, ligthStruct) {
        if (this.updated) {
            this.update();
        }

        //send ligth properties
        gl.uniform1i(ligthStruct.enable, this.enable ? 1 : 0);
        switch (this.type) {
            case M3D.Ligth.AMBIENTAL:
                gl.uniform1i(ligthStruct.ambient, 1);
                gl.uniform1i(ligthStruct.directional, 0);
                gl.uniform1i(ligthStruct.spot, 0);
                break;

            case M3D.Ligth.DIRECTIONAL:
                gl.uniform1i(ligthStruct.ambient, 0);
                gl.uniform1i(ligthStruct.directional, 1);
                gl.uniform1i(ligthStruct.spot, 0);
                break;

            case M3D.Ligth.SPOT:
                gl.uniform1i(ligthStruct.ambient, 0);
                gl.uniform1i(ligthStruct.directional, 0);
                gl.uniform1i(ligthStruct.spot, 1);
                break;

        }

        //set ligth 
        gl.uniform3fv(ligthStruct.coords, this.coords);
        gl.uniform3fv(ligthStruct.color, this.color);
        gl.uniform3fv(ligthStruct.direction, this.direction);

        gl.uniform1f(ligthStruct.maxDot, this.maxDot);
    };

    //Scene Object class constructor and properties
    ////////////////////////////////////////////////////////////////////////////
    M3D.Object = function (name, instance) {

        //define object parameters
        this.name = name;
        this.type = 0;

        //define object states
        this.visible = false;
        this.updated = false;

        //define functional elements
        this.instance = null;
        this.controller = null;
        this.geometry = new M3D.Box();

        //define entity parameters
        this.coords = defineUpdateablePropertyVector(this, 'x', 'y', 'z', 0, 0, 0);
        this.rotation = defineUpdateablePropertyVector(this, 'x', 'y', 'z', 0, 0, 0);
        this.scale = defineUpdateablePropertyVector(this, 'x', 'y', 'z', 1, 1, 1);

        //define hierarchical structure elements
        this.parent = null;
        this.childrens = new M3D.List();
        this.hasChildrens = false;

        //define entity transform matrix's
        this.localMatrix = new Float32Array(identityMatrix);
        this.finalMatrix = new Float32Array(identityMatrix);
        this.normalMatrix = new Float32Array(identityMatrix);

        //define empty slot from instance matrix's
        this.tashTransfromMatrix = null;
        this.tashNormalMatrix = null;

        this.iterationID = 0;
        this.stack = new M3D.Stack();

        //set final model instance
        if (instance) {
            this.setInstance(instance);
        }

    };

    M3D.Object.prototype.setCoords = function (x, y, z) {
        this.coords[0] = x;
        this.coords[1] = y;
        this.coords[2] = z;
        this.updated = true;
    };

    M3D.Object.prototype.setRotation = function (Rx, Ry, Rz) {
        this.rotation[0] = Rx;
        this.rotation[1] = Ry;
        this.rotation[2] = Rz;
        this.updated = true;
    };

    M3D.Object.prototype.setScale = function (Sx, Sy, Sz) {
        Sx || (Sx = 1);

        this.scale[0] = Sx;
        this.scale[1] = Sy || Sx;
        this.scale[2] = Sz || Sx;
        this.updated = true;
    };

    M3D.Object.prototype.setInstance = function (instance) {
        if (instance instanceof RenderizableModel.Instance) {

            if (this.instance) {
                //restore instance matrix recycled
                this.instance.transformMatrix = this.tashTransformMatrix;
                this.instance.normalMatrix = this.tashNormalMatrix;
            }

            //recycle new instance matrix's
            this.tashTransformMatrix = instance.transformMatrix;
            this.tashNormalMatrix = instance.normalMatrix;

            //define object matrix's as instance matrix's
            instance.transformMatrix = this.finalMatrix;
            instance.normalMatrix = this.normalMatrix;

            //redefine object model instance
            this.instance = instance;

        }

        return instance;
    };

    M3D.Object.prototype.removeInstance = function () {
        var instance = null;

        if (this.instance) {
            //restore recycled instance matrix's
            instance = this.instance;
            instance.transformMatrix = this.tashTransformMatrix;
            instance.normalMatrix = this.tashNormalMatrix;

            //delete object properties values
            this.instance = null;
            this.tashTransformMatrix = null;
            this.tashNormalMatrix = null;

        }

        return instance;
    };

    M3D.Object.prototype.setGeometry = function (geometry) {

        if (geometry instanceof M3D.Object.Geometry) {
            this.geometry = geometry;
            geometry.object = this;
            geometry.updated = true;
        }

        return geometry;
    };

    M3D.Object.prototype.removeGeometry = function (geometry) {
        var geometry = this.geometry;

        if (this.geometry) {
            geometry.object = null;
            this.geometry = null;
        }

        return geometry;
    };

    M3D.Object.prototype.addChildren = function (childrenObject) {
        if (childrenObject) {
            childrenObject.parent = this;
            this.childrens.add(childrenObject);
            this.hasChildrens = true;

        }

        return childrenObject;
    };

    M3D.Object.prototype.deleteChildren = function (deletedObjectName) {
        var response = this.childrens.removeByName(deletedObjectName);

        if (response) {
            response.parent = null;
            this.hasChildrens = this.childrens.size > 0;

        }

        return response;
    };

    M3D.Object.prototype.clearChildrens = function () {
        var node = this.childrens.head;

        while (node) {
            node.removeFromList();
            node.data.parent = null;
            node = node.next;

        }

        this.hasChildrens = false;
    };

    M3D.Object.prototype.reset = function () {

        //reset coords to origin
        this.coords[0] = 0;
        this.coords[1] = 0;
        this.coords[2] = 0;

        //reset rotation to 0 degress
        this.rotation[0] = 0;
        this.rotation[1] = 0;
        this.rotation[2] = 0;

        //reset scale to one
        this.scale[0] = 1;
        this.scale[1] = 1;
        this.scale[2] = 1;

        this.updated = true;
    };

    M3D.Object.prototype.update = function (executeDrawCalls) {

        var stack = this.stack;
        var isRoot = true;
        var end = false;

        var object = null;
        var parent = null;
        var node = null;

        var instance;
        var geometry;
        var coords;
        var rotation;
        var scale;

        var iterationID = this.iterationID + 1;

        var parentTransformMatrix;
        var localTransformMatrix;
        var finalTransformMatrix;
        var normalTransformMatrix;

        //trave all herarchy tree levels
        do {

            if (node || isRoot) {

                //select source object
                if (!isRoot) {
                    //get object from node and jump to next node
                    object = node.data;
                    node = node.next;

                } else {
                    //use default object and close root state
                    object = this;
                    isRoot = false;

                }

                //update object
                //////////////////////////////////////////////
                if (iterationID !== object.iterationID) {
                    object.iterationID = iterationID;

                    //get object transform matrix's
                    localTransformMatrix = object.localMatrix;
                    finalTransformMatrix = object.finalMatrix;
                    normalTransformMatrix = object.normalMatrix;

                    //get object properties
                    instance = object.instance;
                    geometry = object.geometry;
                    coords = object.coords;
                    rotation = object.rotation;
                    scale = object.scale;

                    if (object.updated) {

                        //re-compute object local transform matrix
                        identityMat4(localTransformMatrix);
                        translateMat4(localTransformMatrix, coords[0], coords[1], coords[2]);
                        rotateMat4(localTransformMatrix, rotation[0], rotation[1], rotation[2]);
                        scaleMat4(localTransformMatrix, scale[0], scale[1], scale[2]);

                        if (!parent) {
                            //use computed local transform matrix as final
                            copyMat4(localTransformMatrix, finalTransformMatrix);
                            invertMat4(finalTransformMatrix, normalTransformMatrix, true);

                            if (geometry)
                                //send to geometry update state
                                geometry.updated = true;
                        }

                        //restore to not updated state
                        object.updated = false;
                    }

                    if (parent) {
                        //use computed global transform matrix as final
                        multiplyMat4(localTransformMatrix, parentTransformMatrix, finalTransformMatrix);
                        invertMat4(finalTransformMatrix, normalTransformMatrix, true);

                        if (geometry)
                            //send to geometry update state
                            geometry.updated = true;

                    }

                    if (executeDrawCalls && object.visible && instance) {
                        //call to draw model instance
                        instance.endDrawCalls();
                    }

                }
                //////////////////////////////////////////////

                //eval if object has childrens herarchy
                if (object.hasChildrens) {

                    //save parent and next children node
                    stack.push(parent);
                    stack.push(node);

                    //redefine parent object and get first children node
                    parent = object;
                    node = parent.childrens.head;

                    //get parent local transform matrix
                    parentTransformMatrix = parent.finalMatrix;

                }

            } else {

                //restore last children node and it parent
                node = stack.pop();
                parent = stack.pop();

            }

            //if not exist hererchy parent finish state machine
            end = !parent;

        } while (!end);

    };

    M3D.Object.prototype.draw = function () {

        var iterationID = this.iterationID + 1;

        var stack = this.stack;
        var isRoot = true;
        var end = false;

        var object = null;
        var parent = null;
        var node = null;

        var instance;

        //trave all herarchy tree levels
        do {

            if (node || isRoot) {

                //eval if exist source node
                if (!isRoot) {
                    //get object from node and jump to next node
                    object = node.data;
                    node = node.next;

                } else {
                    //use default object and close root state
                    object = this;
                    isRoot = false;

                }

                //get object instance
                instance = object.instance;

                //draw object instance
                //////////////////////////////////////////////
                if (instance && object.visible && iterationID !== object.iterationID) {
                    object.iterationID = iterationID;
                    instance.sendDrawCall();

                }
                //////////////////////////////////////////////

                //eval if object has childrens herarchy
                if (object.hasChildrens) {

                    //save parent and next children node
                    stack.push(parent);
                    stack.push(node);

                    //redefine parent object and get first children node
                    parent = object;
                    node = parent.childrens.head;

                }

            } else {

                //restore last children node and it parent
                node = stack.pop();
                parent = stack.pop();

            }

            //if not exsit hererchy parent finish state machine
            end = !parent;

        } while (!end);

    };

    //Object Geometry class constructor and properties
    ////////////////////////////////////////////////////////////////////////////
    M3D.Geometry = function () {};

    //Object Box class constructor and properties
    ////////////////////////////////////////////////////////////////////////////
    M3D.Box = function (width, height, depth) {

        width || (width = 1);
        height || (height = 1);
        depth || (depth = 1);

        this.object = null;
        this.updated = false;

        //define box specified's parameters
        this.dimensions = defineUpdateablePropertyVector(this, 'width', 'height', 'depth', width, height, depth);

        //define box bounds values
        this.rigth = 0;
        this.left = 0;
        this.up = 0;
        this.down = 0;
        this.near = 0;
        this.far = 0;

    };

    M3D.Box.prototype = Object.create(M3D.Geometry.prototype);

    M3D.Box.prototype.setDimensions = function (width, height, depth) {
        this.dimensions[0] = width;
        this.dimensions[1] = height;
        this.dimensions[2] = depth;
        this.updated = true;
    };

    M3D.Box.prototype.update = function () {
        var transform;
        var dimensions;
        var semivalue;

        if (this.object) {
            transform = this.object.finalMatrix;
            dimensions = this.dimensions;

            //compute x axis edges
            semivalue = dimensions[0] / 2;
            this.rigth = transform[12] + semivalue;
            this.left = transform[12] - semivalue;

            //compute y axis edges
            semivalue = dimensions[1] / 2;
            this.up = transform[13] + semivalue;
            this.down = transform[13] - semivalue;

            //compute z axis edges
            semivalue = dimensions[2] / 2;
            this.znear = transform[14] + semivalue;
            this.zfar = transform[14] - semivalue;

        }

        this.updated = false;
    };

    M3D.Box.prototype.hasColition = function (box) {
        var boxCoords = box.coords;
        var thisCoords = this.coords;

        //update boxes
        if (this.updated)
            this.update();

        if (box.updated)
            box.update();

        //compute diferentials
        this.diferencialX = boxCoords.x > thisCoords.x ? box.left - this.rigth : this.left - box.rigth;
        this.diferencialY = boxCoords.y > thisCoords.z ? box.down - this.up : this.down - box.up;
        this.diferencialZ = boxCoords.z > thisCoords.z ? box.zfar - this.znear : this.zfar - box.znear;

        return diferencialX < 0 && diferencialY < 0 && diferencialZ < 0;
    };

    //List class constructor and properties
    ////////////////////////////////////////////////////////////////////////////
    M3D.List = function () {

        this.size = 0;
        this.head = null;
        this.last = null;

    };

    M3D.List.prototype.add = function (data) {
        var last = this.last;
        var node = new M3D.List.Node(data, this);

        //redefine list head
        if (this.head) {
            last.next = node;
            node.before = last;
        } else {
            this.head = node;
        }

        this.last = node;
        this.size++;

        return data;
    };

    M3D.List.prototype.remove = function (data) {

        var found = false;
        var response = null;

        var head = this.head;
        var last = this.last;

        var node = head;
        var before;
        var next;

        //search node
        while (!found && node) {
            if (node.data === data)
                found = true;
            else
                node = node.next;
        }

        //change list structure
        if (found) {

            response = node.data;
            before = node.before;
            next = node.next;

            //redefine node precedence
            if (node === head) {
                this.head = next;

                if (next)
                    next.before = null;

            } else {
                before.next = next;

                if (next)
                    next.before = before;
            }

            //redefine last node on list
            if (node === last) {
                this.last = before;
            }

            this.size--;
        }

        return response;
    };

    M3D.List.prototype.clear = function () {
        this.size = 0;
        this.head = null;

    };

    M3D.List.prototype.get = function (data) {

        var response = null;
        var node = this.head;

        //searh node
        while (!response && node) {
            if (node.data === data)
                response = node.data;
            else
                node = node.next;
        }

        return response;
    };

    M3D.List.prototype.removeByName = function (name) {

        var found = false;
        var response = null;

        var head = this.head;
        var last = this.last;

        var node = head;
        var before;
        var next;

        //search node
        while (!found && node) {
            if (node.data.name === name)
                found = true;
            else
                node = node.next;
        }

        //change list structure
        if (found) {

            response = node.data;
            before = node.before;
            next = node.next;

            //redefine node precedence
            if (node === head) {
                this.head = next;

                if (next)
                    next.before = null;

            } else {
                before.next = next;

                if (next)
                    next.before = before;
            }

            //redefine last node on list
            if (node === last) {
                this.last = before;
            }

            this.size--;
        }

        return response;
    };

    M3D.List.prototype.getByName = function (name) {

        var response = null;
        var node = this.head;

        //search node data with defined name
        while (!response && node) {
            if (node.data.name === name)
                response = node.data;
            else
                node = node.next;
        }

        return response;
    };

    M3D.List.prototype.isEmpty = function () {
        return this.size === 0;
    };

    M3D.List.Node = function (data, list) {
        this.parentList = list;
        this.data = data;
        this.before = null;
        this.next = null;
    };

    M3D.List.Node.prototype.removeFromList = function () {

        var list = this.parentList;
        var head = list.head;
        var last = list.last;
        var tash = list.tash;

        var before = this.before;
        var next = this.next;

        //change list structure
        if (this === head) {
            list.head = next;

            if (next)
                next.before = null;

        } else {
            before.next = next;

            if (next)
                next.before = before;
        }

        if (this === last) {
            //redefine last node of list
            list.last = before;
        }

        //save node object
        tash.data[tash.size++] = this;
        list.size--;

        return this;
    };

    //Stack class constructor and properties
    ////////////////////////////////////////////////////////////////////////////
    M3D.Stack = function () {
        this.data = new Array(10);
        this.size = 0;
    };

    M3D.Stack.prototype.push = function (data) {
        return this.data[this.size++] = data;
    };

    M3D.Stack.prototype.pop = function () {
        return this.size > 0 ? this.data[--this.size] : null;
    };

    M3D.Stack.prototype.isEmpty = function () {
        return this.size === 0;
    };

    //Renderer class constructor and properties
    ////////////////////////////////////////////////////////////////////////////
    M3D.Renderer = function (canvas) {

        //use or create one HTMLCanvas to draw on it
        ////////////////////////////////////////////////
        this.canvas = canvas || document.createElement('canvas');

        //create one WebGL context to renderize
        ////////////////////////////////////////////////
        this.gl = this.canvas.getContext('webgl2') ||
                this.canvas.getContext('webgl') ||
                this.canvas.getContext('experimental_webgl');

        //Polifills from request and cancel animation frame
        ////////////////////////////////////////////////////////////////
        window.requestAnimationFrame = window.requestAnimationFrame ||
                window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                window.msRequestAnimationFrame ||
                window.opRequestAnimationFrame ||
                function (callback) {
                    return window.setTimeout(callback, 40);
                };

        window.cancelAnimationFrame = window.cancelAnimationFrame ||
                window.webkitCancelAnimationFrame ||
                window.mozCancelAnimationFrame ||
                window.msCancelAnimationFrame ||
                window.opCancelAnimationFrame ||
                window.clearTimeout;
        ////////////////////////////////////////////////////////////////

        //create render data storage object
        ////////////////////////////////////////////////////////////////
        this.renderData = {
            ligths: null,
            models: null,
            objects: null
        };

        this.clearColor = {
            red: 0,
            green: 0,
            blue: 0,
            alpha: 1.0
        };

        var shaders = new M3D.List();

        //Shaders list controls
        this.addShader = function (shader, name) {
            var response = shader;

            if (shader && shader.isRenderShader) {
                name && (shader.name = name);
                shaders.add(shader);
            } else {
                console.error("Not added provided shader because is not valid render shader");
            }

            return response;
        };

        this.getShader = function (name) {
            return shaders.getByName(name);
        };

        this.removeShader = function (name) {
            return shaders.removeByName(name);
        };

        this.destroyShader = function (name) {
            var shader = shaders.removeByName(name);

            if (shader) {
                //detroy gl shder
                shader.destroy(this.gl);
            }

        };

    };

    M3D.Renderer.prototype.setOutputResolution = function (width, height) {
        width && (this.canvas.width = width);
        height && (this.canvas.height = height);
    };

    M3D.Renderer.prototype.setClearColor = function (red, green, blue, alpha) {
        red >= 0 && (this.clearColor.red = red);
        green >= 0 && (this.clearColor.green = green);
        blue >= 0 && (this.clearColor.blue = blue);
        alpha >= 0 && (this.clearColor.alpha = alpha);
    };

    M3D.Renderer.prototype.drawScene = function (scene, camera, options) {

        var gl = this.gl;
        var canvas = this.canvas;
        var renderData = this.renderData;
        var clearColor = this.clearColor;

        var usedShader;
        var newShader;

        var objects;
        var models;
        var ligths;

        var objectNode;
        var modelNode;
        var ligthNode;

        var ligthIndex;

        //define render options
        var depthTestEnable = true;
        var cullFaceEnable = true;
        var framebuffer;
        var shader;
        var executeDrawCalls = true;
        var preserveDrawCalls = false;

        if (options) {
            depthTestEnable = options.depthTestEnable;
            cullFaceEnable = options.cullFaceEnable;

            framebuffer = options.framebuffer;
            shader = options.shader;
            executeDrawCalls = options.executeDrawCalls;
            preserveDrawCalls = options.preserveDrawCalls;

        }

        //Renderize Scene
        ///////////////////////////////////////////////////////////////
        if (gl && scene instanceof M3D.Scene && camera instanceof M3D.Camera) {

            //get scene render data
            scene.getRenderData(this, renderData);

            //get list of storage object
            objects = renderData.objects;
            models = renderData.models;
            ligths = renderData.ligths;

            //get first lists nodes
            objectNode = objects.head;
            modelNode = models.head;
            ligthNode = ligths.head;

            if (framebuffer) {
                //enable custom framebuffer
                gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

                //get and configure output framebuffer size to renderize
                gl.viewport(0, 0, framebuffer.width, framebuffer.height);

            } else {
                //get and configure output framebuffer size to renderize
                gl.viewport(0, 0, canvas.width, canvas.height);

            }

            //configure and clear screen clear color
            gl.clearColor(clearColor.red, clearColor.green, clearColor.blue, clearColor.alpha);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            //configure used depth test
            if (depthTestEnable)
                gl.enable(gl.DEPTH_TEST);
            else
                gl.disable(gl.DEPTH_TEST);

            //configure used depth test
            if (cullFaceEnable)
                gl.enable(gl.CULL_FACE);
            else
                gl.disable(gl.CULL_FACE);

            //Execute all model instance's draw calls
            ////////////////////////////////////////////////
            if (executeDrawCalls) {
                while (objectNode) {
                    objectNode.data.draw();
                    objectNode = objectNode.next;
                }
            }
            ////////////////////////////////////////////////

            //Renderize each used model
            ////////////////////////////////////////////////
            while (modelNode) {
                model = modelNode.data;

                //draw only called model's
                /////////////////////////////////////
                if (model.drawCallsNumber > 0) {
                    //use asociated model shader
                    newShader = shader || model.shader;

                    //Prepare shader to use
                    ///////////////////////////
                    if (newShader !== usedShader && newShader.isRenderShader) {

                        //disable before used shader attribs
                        if (usedShader) {
                            usedShader.disableVertexAttribs(gl);
                        }

                        //define new used shader
                        usedShader = newShader;
                        usedShaderUniforms = usedShader.uniforms;

                        //enable new used shader
                        gl.useProgram(usedShader);

                        //send camera structure uniforms
                        camera.sendToGPU(gl, usedShaderUniforms.camera);

                        //send ligths structures uniforms
                        /////////////////////////////////
                        ligthIndex = 0;
                        while (ligthNode) {
                            ligthNode.data.sendToGPU(gl, usedShaderUniforms.ligths[ligthIndex]);

                            ligthNode = ligthNode.next;
                            ligthIndex++;
                        }
                        /////////////////////////////////

                    }
                    ///////////////////////////

                    //Prepare model to use shader
                    model.prepare(gl, usedShader);

                    //Draw model request's
                    model.executeDrawCalls(gl, preserveDrawCalls);
                }
                /////////////////////////////////////

                modelNode = modelNode.next;
            }
            ////////////////////////////////////////////////

            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }
        ///////////////////////////////////////////////////////////////


    };

    //Render Shader Factory class constructor and properties
    ////////////////////////////////////////////////////////////////////////////
    M3D.RenderShaderFactory = function () {};

    M3D.RenderShaderFactory.createRenderShader = function (renderer, vertexCode, fragmentCode) {
        var gl;
        var vertexShader, vertexShaderInfoLog;
        var fragmentShader, fragmentShaderInfoLog;
        var shaderProgram, shaderProgramInfoLog;
        var isLinked, hasError;
        var response = null;

        //Create shaders
        ///////////////////////////////////////////////////////
        if (renderer instanceof M3D.Renderer && vertexCode && fragmentCode) {

            //create and compile vertex shader
            vertexShader = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(vertexShader, vertexCode);
            gl.compileShader(vertexShader);

            //create and compile fragment shader
            fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(fragmentShader, vertexCode);
            gl.compileShader(fragmentShader);

            //get compilation info
            vertexShaderInfoLog = gl.getShaderInfoLog(vertexShader);
            fragmentShaderInfoLog = gl.getShaderInfoLog(fragmentShader);

            //Create Shader Program
            ///////////////////////////////////////////////////////
            if (vertexShaderInfoLog || fragmentShaderInfoLog) {
                console.log('ERROR Compiling Shaders.\nDETAILS:');

                //Show compilation details
                if (vertexShaderInfoLog)
                    console.error('VERTEX SHADER INFO:\n' + vertexShaderInfoLog);
                if (fragmentShaderInfoLog)
                    console.error('FRAGMENT SHADER INFO:\n' + fragmentShaderInfoLog);

                hasError = true;

            } else {

                //create program and set shaders
                shaderProgram = gl.createProgram();
                gl.attachShader(vertexShader);
                gl.attachShader(fragmentShader);
                gl.linkProgram(shaderProgram);

                isLinked = gl.getProgramParameter(shaderProgram, gl.LINK_STATUS);

                if (isLinked) {

                    //define shader source code
                    vertexShader.source = vertexCode;
                    fragmentShader.source = fragmentCode;

                    //define shader program properties
                    shaderProgram.isRenderShader = true;
                    shaderProgram.vertexShader = vertexShader;
                    shaderProgram.fragmentShader = fragmentShader;
                    shaderProgram.attribs = {};
                    shaderProgram.uniforms = {};

                    //define shader program methoods
                    shaderProgram.disableVertexAttribs = M3D.RenderShaderFactory.RenderShader.disableVertexAttribs;
                    shaderProgram.destroy = M3D.RenderShaderFactory.RenderShader.destroy;

                } else {

                    //get program status info
                    shaderProgramInfoLog = gl.getProgramInfoLog(shaderProgram);
                    console.error('ERROR Linking Program.\nDETAILS: ' + shaderProgramInfoLog);

                    //destroy unused program
                    gl.deleteProgram(shaderProgram);

                    hasError = true;
                }

            }
            ///////////////////////////////////////////////////////

            if (hasError) {
                //destroy unused shaders
                gl.deleteShader(vertexShader);
                gl.deleteShader(fragmentShader);
            } else {
                response = shaderProgram;
            }
        }
        ///////////////////////////////////////////////////////

        return response;
    };

    M3D.RenderShaderFactory.parseShaderTokens = function (sourceCode, tokens) {

        var length = sourceCode.length;
        var words = [];
        var word = '', type;

        var before, beforeIsLetter;
        var char, ascii, charIsLetter, charIsNumber;
        var pushed, added, beforeIsNumber;

        //get ASCII char codes to compare
        var ASCII_a = 'a'.charCodeAt(0);
        var ASCII_z = 'z'.charCodeAt(0);
        var ASCII_A = 'A'.charCodeAt(0);
        var ASCII_Z = 'Z'.charCodeAt(0);
        var ASCII_0 = '0'.charCodeAt(0);
        var ASCII_9 = '9'.charCodeAt(0);

        var WORD = 0;
        var NUMBER = 1;
        var OPERATOR = 2;

        //load each string characters
        for (var i = 0; i < length; i++) {
            char = sourceCode[i];

            if (char === ' ') {
                charIsLetter = false;

                pushed = true;
                added = false;

            } else {

                //get ASCII code of character and compare witch criteria
                ascii = char.charCodeAt(0);
                charIsLetter = ascii >= ASCII_A && ascii <= ASCII_Z;
                charIsLetter |= ascii >= ASCII_a && ascii <= ASCII_z;
                charIsNumber = ascii >= ASCII_0 && ascii <= ASCII_9;

                if (before === ' ') {
                    ;

                } else if (charIsLetter) {
                    if (!beforeIsLetter && !beforeIsNumber)
                        pushed = true;

                } else if (charIsNumber) {
                    if (!beforeIsLetter && !beforeIsNumber)
                        pushed = true;

                } else if (char === '.') {
                    if (beforeIsLetter) {
                        pushed = true;

                    } else if (beforeIsNumber) {
                        if (type === NUMBER) {
                            charIsNumber = true;

                        } else {
                            pushed = true;

                        }

                    } else {
                        ;
                    }

                } else {
                    if (beforeIsLetter || beforeIsNumber)
                        pushed = true;

                }

                added = true;
            }

            if (pushed) {
                pushed = false;

                if (word.length > 0) {

                    //push word properties
                    words.push(word);
                    words.push(type);

                    //clear word
                    word = '';
                }

            }

            if (added) {
                added = false;

                //add char to work
                word += char;

                //define word type based on first character
                if (word.length === 1) {
                    if (charIsLetter)
                        type = WORD;
                    else if (charIsNumber)
                        type = NUMBER;
                    else
                        type = OPERATOR;
                }

            }

            //update before character properties
            before = char;
            beforeIsLetter = charIsLetter;
            beforeIsNumber = charIsNumber;

        }

        //save last word
        if (word.length > 0) {
            words.push(word);
            words.push(type);
        }

        tokens.words = words;

        return tokens;
    };

    M3D.RenderShaderFactory.destroyRenderShader = function (renderer, renderShader) {
        return renderShader.destroy(renderer.gl);
    };

    //Render Shader Factory : Render Shader class constructor and properties
    ////////////////////////////////////////////////////////////////////////////
    M3D.RenderShaderFactory.RenderShader = function () {};

    M3D.RenderShaderFactory.RenderShader.disableVertexAttribs = function (gl) {

        for (var attribIndex in this.attribs) {
            gl.disableVertexAttribArray(attribIndex);
        }

    };

    M3D.RenderShaderFactory.RenderShader.destroy = function (gl) {

        this.isRenderShader = false;

        //detach GL program shaders and destroy
        gl.detachShader(this, this.vertexShader);
        gl.detachShader(this, this.fragmentShader);
        this.vertexShader = gl.deleteShader(this.vertexShader);
        this.fragmentShader = gl.deleteShader(this.fragmentShader);

        //destoy GL program
        gl.deleteProgram(this);

        return null;
    };

})();

//Space3D class constructor and properties
////////////////////////////////////////////////////////////////////////////
M3D.Space3D = function (rigth, left, up, down, znear, zfar, rows, columns, stacks) {

    //define space bounds
    this.rigth = !isNaN(rigth) ? rigth : 10.0;
    this.left = !isNaN(left) ? left : -10.0;
    this.up = !isNaN(up) ? up : 10.0;
    this.down = !isNaN(down) ? down : -10.0;
    this.znear = !isNaN(znear) ? znear : 10.0;
    this.zfar = !isNaN(zfar) ? zfar : -10.0;

    //compute space dimensions
    this.width = this.rigth - this.left;
    this.height = this.up - this.down;
    this.depth = this.znear - this.zfar;

    //define space cells distribution
    this.columns = (columns >= 0) ? columns : parseInt(this.width);
    this.rows = (rows >= 0) ? rows : parseInt(this.height);
    this.stacks = (stacks >= 0) ? stacks : parseInt(this.depth);
    this.stackSize = this.columns * this.rows;

    //create space storage slots
    this.space = new Array(this.columns * this.rows * this.stacks);

    //create recycle storage
    this.recycle = new Array(0);
    this.recycle.size = 0;

};

M3D.Space3D.prototype.addObjects = function (objects, clear) {

    var objectNode;
    var objectMatrix;

    var columns, rows, stacks, stackSize;
    var rigth, left, up, down, znear, zfar;
    var width, height, depth;

    var space;
    var column;
    var row;
    var stack;
    var index;
    var cellNode;

    var recycle = this.recycle;
    var recycleLength = recycle.length;
    var recycleIndex;

    objectNode = objects.head;

    //get space bounds
    rigth = this.rigth;
    left = this.left;
    up = this.up;
    down = this.down;
    znear = this.znear;
    zfar = this.zfar;

    //get space dimensions
    width = this.width;
    height = this.height;
    depth = this.depth;

    //get space storage distribution values
    space = this.space;
    columns = this.columns;
    rows = this.rows;
    stacks = this.stacks;
    stackSize = this.stackSize;

    recycle = this.recycle;
    recycleLength = recycle.length;

    if (clear) {
        for (var i = 0, length = space.length; i < length; i++) {
            //clear array slot
            space[i] = null;
        }

        recycleIndex = 0;

    } else {
        recycleIndex = recycle.size;

    }

    //add all scene objects
    while (objectNode) {
        objectMatrix = objectNode.data.finalMatrix;

        //get cell coordinate
        column = (objectMatrix[12] - left) / width;
        row = (objectMatrix[13] - down) / height;
        stack = (objectMatrix[14] - zfar) / depth;

        if (column >= 0 && column <= 1.0 && row >= 0 && row <= 1.0 && stack >= 0 && stack <= 1.0) {

            //compute cell coords on distribution
            column = Math.round(column * columns);
            row = Math.round(row * rows);
            stack = Math.round(stack * stacks);

            //compute cell index on Space distribution
            index = column + row * columns + stack * stackSize;
            cellNode = space[index];

            //store object on new or recycle cellNode
            if (recycleIndex < recycleLength) {
                cellNode = recycle[recycleIndex].set(objectNode.data, null, cellNode);
                recycleIndex++;

            } else {
                cellNode = new M3Dp.Node(objectNode.data, null, cellNode);
                recycle[recycleLength++] = cellNode;
                recycleIndex++;

            }

            //set node to storage slot
            space[index] = cellNode;

        }
        ///////////////////////////////////////

        //jump to next object of list
        objectNode = objectNode.next;
    }
    /////////////////////////////////

    //update recycle size
    recycle.size = recycleIndex;

};

M3D.Space3D.prototype.clear = function () {
    var space = this.space;

    //clear all array slot
    for (var i = 0, length = space.length; i < length; i++) {
        space[i] = null;
    }

    //update recycle size
    this.recycle.size = 0;

};

M3D.Space3D.prototype.getNearObjects = function (object, objectCallback, distance) {
    distance >= 0 || (distance = 1);

    if (!objectCallback)
        return null;

    var objectMatrix = object.finalMatrix;
    var end = false;

    var nodeObject;
    var otherObject;

    var rigth, left, up, down, znear, zfar;

    //compute distribution proporsion
    var column = Math.round((objectMatrix[12] - this.left) / this.width * this.columns);
    var row = Math.round((objectMatrix[13] - this.down) / this.height * this.rows);
    var stack = Math.round((objectMatrix[14] - this.zfar) / this.depth * this.stacks);

    //define space bounds to search colitions
    var rigth = column + distance;
    var left = column - distance;
    var up = row + distance;
    var down = row - distance;
    var znear = stack + distance;
    var zfar = stack - distance;

    //corrige search bounds limits
    rigth > this.columns && (rigth = this.columns);
    left < 0 && (left = 0);
    up > this.rows && (up = this.rows);
    down < 0 && (down = 0);
    znear > this.stacks && (znear = this.stacks);
    zfar < 0 && (zfar = 0);

    //execute colition tests on boundary space
    var c = left, r, s;
    while (!end && c <= rigth) {
        c++;

        ///////////////////////////////////////////
        r = down;
        while (!end && r <= up) {
            r++;

            ///////////////////////////////////////////
            s = zfar;
            while (!end && s <= znear) {
                s++;

                //get list fron index
                nodeObject = this.space[c + r * this.columns + s * this.stackSize];

                //execute colition test with objects on slot cell
                while (!end && nodeObject) {
                    otherObject = nodeObject.data;

                    //execute colition test
                    if (otherObject !== object)
                        end = !objectCallback(otherObject);

                    nodeObject = nodeObject.next;
                }

            }
            ///////////////////////////////////////////
        }
        ///////////////////////////////////////////
    }
    ///////////////////////////////////////////

};

    