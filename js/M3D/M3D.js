
if (!window.M3D) {
    window.M3D = {};
    window.M3D.Model = new Function();
    window.M3D.Model.Instance = new Function();
    window.M3D.Model.Material = new Function();
}

(function () {
    let elementID = 0;
    let M3Dp = {};  //private context object
    let M3D = window.M3D;

    let vecIn = new Float32Array(3);
    let vecAt = new Float32Array(3);
    let vecUp = new Float32Array(3);
    let vecX = new Float32Array(3);
    let vecY = new Float32Array(3);
    let vecZ = new Float32Array(3);

    let identityMatrix = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

    //MISCELANIOUNS MATH UTILS FUNCTIONS
    function normalizedVec3(vec, dst) {
        dst || (dst = vec);

        let length = Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2]);

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

        let length = Math.sqrt(dst[0] * dst[0] + dst[1] * dst[1] + dst[2] * dst[2]);
        if (length !== 0) {
            dst[0] /= length;
            dst[1] /= length;
            dst[2] /= length;

        }

        return dst;
    }

    function orbiteVec3(vec, alpha, omega) {

        let s, c, t;

        // rotate around Y
        s = Math.sin(omega);
        c = Math.cos(omega);
        
        t = vec.y
        vec.y = t * c - vec.z * s;
        vec.z = t * s + vec.z * c;

        // rotate around X
        t = vec.x;
        s = Math.sin(alpha);
        c = Math.cos(alpha);
        
        vec.x = vec.z * s + t * c;
        vec.z = vec.z * c - t * s;

        return vec;
    }

    function invertMat4(matrix, dstMatrix, returnInverseTranspose) {
        dstMatrix || (dstMatrix = matrix);

        let det;
        let a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p;

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

            if (returnInverseTranspose) {

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
        let fv = 1.0 / Math.tan(fieldOfView / 2);
        let inversev = 1 / (znear - zfar);

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
        let x, y, z, s, c;

        //Rotate around X axis
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

        //Rotate around Y axis
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

        //Rotate around Z axis
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

        //set identity matrix values
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

    //MISCELANIOUS DATA FUNCTIONS
    function createUpdateablePropertyVector(object, property1, property2, property3, value1, value2, value3) {
        let vector = new Float32Array([value1 || 0, value2 || 0, value3 || 0]);
        vector.self = object;

        property1 ? Object.defineProperty(vector, property1, {
            configurable: false,
            get: function () {
                return this[0];
            },
            set: function (newValue) {
                if (newValue !== this[0]) {
                    this[0] = newValue;
                    this.self.updated = true;
                }
            }
        }) : Object.defineProperty(vector, 'x', {
            configurable: false,
            value: 0
        });

        property2 ? Object.defineProperty(vector, property2, {
            configurable: false,
            get: function () {
                return this[1];
            },
            set: function (newValue) {
                if (newValue !== this[1]) {
                    this[1] = newValue;
                    this.self.updated = true;
                }
            }
        }) : Object.defineProperty(vector, 'y', {
            configurable: false,
            value: 0
        });

        property3 ? Object.defineProperty(vector, property3, {
            configurable: false,
            get: function () {
                return this[2];
            },
            set: function (newValue) {
                if (newValue !== this[2]) {
                    this[2] = newValue;
                    this.self.updated = true;
                }
            }
        }) : Object.defineProperty(vector, 'z', {
            configurable: false,
            value: 0
        });

        // define homogeneous w coord
        Object.defineProperty(vector, 'w', {
            configurable: false,
            value: 1
        });

        Object.defineProperty(vector, 'isVector', {
            configurable: false,
            writeable: false,
            value: true
        });

        vector.set = function (newValue1, newValue2, newValue3) {
            this[0] = newValue1;
            this[1] = newValue2;
            this[2] = newValue3;

            this.self.updated = true;
        };

        vector.getFloat32Array = function () {
            return new Float32Array(this);
        };

        return vector;
    }

    function createPropertyVector(property1, property2, property3, value1, value2, value3) {
        let vector = new Float32Array([value1 || 0, value2 || 0, value3 || 0]);

        property1 ? Object.defineProperty(vector, property1, {
            configurable: false
            , get: function () {
                return this[0];
            }, set: function (v) {
                this[0] = v;
            }
        }) : Object.defineProperty(vector, 'x', {
            configurable: false,
            value: 0
        });

        property2 ? Object.defineProperty(vector, property2, {
            configurable: false
            , get: function () {
                return this[1];
            }, set: function (v) {
                this[1] = v;
            }
        }) : Object.defineProperty(vector, 'y', {
            configurable: false,
            value: 0
        });

        property3 ? Object.defineProperty(vector, property3, {
            configurable: false
            , get: function () {
                return this[2];
            }, set: function (v) {
                this[2] = v;
            }
        }) : Object.defineProperty(vector, 'z', {
            configurable: false,
            value: 0
        });

        // define homogeneous w coord
        Object.defineProperty(vector, 'w', {
            configurable: false,
            value: 1
        });

        Object.defineProperty(vector, 'isVector', {
            configurable: false,
            writeable: false,
            value: true
        });


        vector.set = function (newValue1, newValue2, newValue3) {
            this[0] = newValue1;
            this[1] = newValue2;
            this[2] = newValue3;

            this.self.updated = true;
        };

        vector.getFloat32Array = function () {
            return new Float32Array(this);
        };

        return vector;
    }

    function defineUpdateableProperty(object, propertyName, value) {

        Object.defineProperty(object, propertyName, {
            configurable: false,
            get: function () {
                return value;
            },
            set: function (newValue) {
                if (newValue !== value) {
                    value = newValue;
                    this.updated = true;

                }
            }
        });

    }

    function defineUneditableProperty(object, propertyName, value) {

        Object.defineProperty(object, propertyName, {
            whritable: false,
            value: value
        });

    }

    //Vector
    ////////////////////////////////////////////////////////////////////////////
    M3D.Vector = function (x, y, z, w) {
        this.x = x || 0;
        this.y = y || 0;
        this.z = z || 0;
        this.w = w || 1;

    };

    //Node class constructor and methoods
    ////////////////////////////////////////////////////////////////////////////
    M3D.Node = function (data, before, next) {
        this.list = null;
        this.data = data;
        this.before = before;
        this.next = next;
    };

    M3D.Node.prototype.set = function (data, before, next) {
        this.data = data;
        this.before = before;
        this.next = next;

        return this;
    };

    //List class constructor and properties
    ////////////////////////////////////////////////////////////////////////////
    M3D.List = function () {
        this.size = 0;
        this.head = null;
        this.last = null;

    };

    M3D.List.prototype.add = function (data) {
        let node;

        if (this.size === 0) {
            //define list head
            this.head = node = new M3D.Node(data, null, null);

        } else {
            //define next list node
            this.last.next = node = new M3D.Node(data, this.last, null);

        }

        node.list = this;   //redefine node list
        this.last = node;   //redefine last node
        this.size++;        //update list size

        return data;
    };

    M3D.List.prototype.get = function (data) {

        let response = null;
        let node = this.head;

        //searh node
        while (!response && node) {
            if (node.data === data)
                response = node.data;
            else
                node = node.next;
        }

        return response;
    };

    M3D.List.prototype.iterate = function () {
        return new M3Dp.ListIterator(this);
    };

    M3D.List.prototype.remove = function (data) {

        let found = false;
        let response = null;

        let head = this.head;
        let node = head;

        //search node
        while (!found && node) {
            if (node.data === data)
                found = true;
            else
                node = node.next;
        }

        //remove founded data node from list
        if (found)
            response = this.removeNode(node).data;

        return response;
    };

    M3D.List.prototype.getByName = function (name) {

        let response = null;
        let node = this.head;

        //search node data with defined name
        while (!response && node) {
            if (node.data.name === name)
                response = node.data;
            else
                node = node.next;
        }

        return response;
    };

    M3D.List.prototype.removeByName = function (name) {

        let found = false;
        let response = null;

        let head = this.head;
        let node = head;

        //search node
        while (!found && node) {
            if (node.data.name === name)
                found = true;
            else
                node = node.next;
        }

        //change list structure
        if (found)
            response = this.removeNode(node).data;

        return response;
    };

    M3D.List.prototype.addNode = function (node) {

        if (!node || node.list)
            return node;

        //define node links
        node.list = this;               //redefine node list
        if (this.head) {
            node.before = this.last;    //last node is before 
            this.last.next = node;      //node is after last

        } else {
            node.before = null;         //dont exist nothing before
            this.head = node;           //the new node is a list head

        }
        node.next = null;               //dont exist nothing after

        this.last = node;               //change last node of list
        this.size++;                    //update list size

        return node;
    };

    M3D.List.prototype.removeNode = function (node) {

        if (!node || node.list !== this)
            return node;

        let before = node.before;
        let next = node.next;

        if (this.head) {

            //change linked nodes references
            before && (before.next = next);                //next of before is next node on list
            next && (next.before = before);                //before of next is before node on list

            //change list structure
            (node === this.head) && (this.head = next);    //change list head node
            (node === this.last) && (this.last = before);  //change list last node

            if (this.size === 0 && this.head) {
                console.error(before, ' => ', node, ' => ', next);
                console.error(node === this.head ? 'node are head' : 'node are not head');
                throw new Error('STRUCTURE ERROR');
            }

            //remove node links
            node.list = null;       //def has not linked to one list
            node.before = null;     //def has not node before
            node.next = null;       //def has not node after

            //update list size
            this.size--;

        }

        return node;
    };

    M3D.List.prototype.clear = function () {
        this.head = null;
        this.last = null;
        this.size = 0;
    };

    M3D.List.prototype.isEmpty = function () {
        return !!this.head;
    };

    //ListIterator class constructor and properties
    ////////////////////////////////////////////////////////////////////////////
    M3Dp.ListIterator = function (list) {
        this.iterator = list.head;
    };

    M3Dp.ListIterator.prototype.next = function () {
        let node = this.iterator;

        if (node) {
            this.iterator = node.next;
            return node.data;

        }

        return null;
    };

    M3Dp.ListIterator.prototype.nextNode = function () {
        let node = this.iterator;

        if (node)
            this.iterator = node.next;

        return node;
    };

    //Stack class constructor and properties
    ////////////////////////////////////////////////////////////////////////////
    M3D.Stack = function () {
        this.dataArray = new Array(10);
        this.size = 0;
    };

    M3D.Stack.prototype.push = function (data) {
        return this.dataArray[this.size++] = data;
    };

    M3D.Stack.prototype.pop = function () {
        return this.size > 0 ? this.dataArray[--this.size] : null;
    };

    M3D.Stack.prototype.clear = function () {
        this.size = 0;
    };

    M3D.Stack.prototype.isEmpty = function () {
        return this.size === 0;
    };

    //Scene class constructor and properties
    M3D.Scene = function () {

        //define scene elements lists
        /////////////////////////////////
        defineUneditableProperty(this, 'ligths', new M3D.List());
        defineUneditableProperty(this, 'models', new M3D.List());
        defineUneditableProperty(this, 'objects', new M3D.List());
        defineUneditableProperty(this, 'sceneNodeName', 'scene' + elementID++);

        this.updatedNode = null;
    };

    M3D.Scene.prototype.addLigth = function (ligth, name) {

        if (ligth instanceof M3D.Ligth) {
            name && (ligth.name = name);

            //create and or agregate model scene Node
            ligth.sceneNode || (ligth.sceneNode = new M3D.Node(ligth));
            this.ligths.addNode(ligth.sceneNode).data = ligth;

        }

        return ligth;
    };

    M3D.Scene.prototype.addModel = function (model, name) {

        if (model instanceof M3D.Model) {
            name && (model.name = name);

            //create and or agregate model scene Node
            model.sceneNode || (model.sceneNode = new M3D.Node(model));
            this.models.addNode(model.sceneNode);

        }

        return model;
    };

    M3D.Scene.prototype.addObject = function (object, name) {

        if (object instanceof M3D.Object) {
            name && (object.name = name);

            //create and or agregate scene Node
            object.sceneNode || (object.sceneNode = new M3D.Node(object));
            this.objects.addNode(object.sceneNode);

        }

        return object;
    };

    M3D.Scene.prototype.getLigth = function (name) {
        return this.ligths.getByName(name);
    };

    M3D.Scene.prototype.getModel = function (name) {
        return this.models.getByName(name);
    };

    M3D.Scene.prototype.getObject = function (name) {
        return this.objects.getByName(name);
    };

    M3D.Scene.prototype.removeLigth = function (src) {

        if (typeof src === 'string')
            src = this.ligths.removeByName(src);
        else if (src instanceof M3D.Ligth)
            this.ligths.removeNode(src.sceneNode);

        return src;
    };

    M3D.Scene.prototype.removeModel = function (src) {

        if (typeof src === 'string')
            src = this.models.removeByName(src);
        else if (src instanceof M3D.Model)
            this.models.removeNode(src.sceneNode);

        return src;
    };

    M3D.Scene.prototype.removeObject = function (src) {
        let node;

        if (typeof src === 'string')
            src = this.objects.removeByName(src);
        else if (src instanceof M3D.Object)
            this.objects.removeNode(src.sceneNode);

        //change update node of waited object
        if (src && src.sceneNode === this.updatedNode)
            this.updatedNode = src.sceneNode.next;

        return src;
    };

    M3D.Scene.prototype.removeAllObjects = function () {
        let node, next;

        //remove any objects of list
        node = this.objects.head;
        while (node) {
            next = node.next;       //save refernce to next node

            node.list = null;       //delete refernce to container list
            node.before = null;     //delete refernce to before node
            node.next = null;       //delete refernce to next node

            node = next;            //jump to next object node
        }

        this.updatedNode = null;    //remove node waiting for update
        this.objects.clear();       //clear fasted object list

    };

    M3D.Scene.prototype.updateObjects = function () {
        let object;
        let node = this.objects.head;

        //update any objects of scene
        while (node) {
            object = node.data;


            node = node.next;           //jump to next node of list
            this.updatedNode = node;    //save nex node to wait from update

            //update enable object without parents
            /* 
             * Here can be change the structure of objects list
             * for that, it is nescesary save his state.
            */
            if (object.enable && !object.parent)
                object.update();

            node = this.updatedNode;    //restore next node to update
        }

    };

    //Model superclass
    M3D.Model = new Function();

    M3D.Model.Instance = new Function();

    M3D.Model.Material = new Function();

    //Camera class constructor and properties
    ////////////////////////////////////////////////////////////////////////////
    M3D.Camera = function (name, projection, x, y, z) {

        //camera resources
        defineUneditableProperty(this, 'id', elementID++);
        this.name = name;
        this.projection = projection || new M3D.Camera.PerspectiveProjection();

        this.updated = true;

        //camera parameters
        this.coords = createUpdateablePropertyVector(this, 'x', 'y', 'z', x || 0, y || 0, z || 0);
        this.target = createUpdateablePropertyVector(this, 'x', 'y', 'z', 0, 0, 0);
        this.upvect = createUpdateablePropertyVector(this, 'x', 'y', 'z', 0, 1, 0);

        //camera2target direction controls
        this.direction = createUpdateablePropertyVector(this, 'x', 'y', 'z', 0, 0, -1);
        this.targetObj = null;
        this.hasTarget = false;

        //camera model view matrix
        this.viewMatrix = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
        this.lookMatrix = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

    };

    M3D.Camera.prototype.setCoords = function (x, y, z) {
        this.coords[0] = x;
        this.coords[1] = y;
        this.coords[2] = z;

        this.updated = true;
    };

    M3D.Camera.prototype.setDirection = function (x, y, z) {

        let length = Math.sqrt(x * x + y * y + z * z);

        if (length !== 0) {
            //normalize direction
            this.direction[0] = x / length;
            this.direction[1] = y / length;
            this.direction[2] = z / length;

        } else {
            //use default direction
            this.direction[0] = 0;
            this.direction[1] = 0;
            this.direction[2] = 1;

        }

        this.updated = true;
    };

    M3D.Camera.prototype.setDirection2Object = function (obj) {
        let x, y, z, length;

        if (obj instanceof M3D.Object) {
            x = this.coords.x - obj.coords.x;
            y = this.coords.y - obj.coords.y;
            z = this.coords.z - obj.coords.z;

            length = Math.sqrt(x * x + y * y + z * z);

            if (length !== 0) {
                //normalize direction
                this.direction[0] = x / length;
                this.direction[1] = y / length;
                this.direction[2] = z / length;

            } else {
                //use default direction
                this.direction[0] = 0;
                this.direction[1] = 0;
                this.direction[2] = 1;

            }

            this.updated = true;
        }

    }

    M3D.Camera.prototype.setTargetCoords = function (x, y, z) {
        this.target[0] = x;
        this.target[1] = y;
        this.target[2] = z;

        this.hasTarget = true;
        this.updated = true;
    };

    M3D.Camera.prototype.removeTarget = function () {
        this.hasTarget = false;
        this.updated = true;
    };

    M3D.Camera.prototype.setProjection = function (projection) {

        if (projection instanceof M3Dp.CameraProjection) {
            //define new projection ratio
            projection.ratio = this.projection.ratio;

            //define new camera projection
            this.projection = projection;

        } else {
            throw new Error('Not valid projection provided to Camera ' + this.name);
        }

    };

    M3D.Camera.prototype.computeOutputScreenRatio = function (width, height) {

        if (width && height)
            this.projection.ratio = width / height;

        return this.projection.ratio;
    };

    M3D.Camera.prototype.isObjectVisibile = function (object) {

        let visible = false;

        //compute object2camera difernece vector
        let vx = object.coords[0] - this.coords[0];
        let vy = object.coords[1] - this.coords[1];
        let vz = object.coords[2] - this.coords[2];
        let length = Math.sqrt(vx * vx + vy * vy + vz * vz);

        if (length > 0 && length <= this.projection.maxDistance)
            //compute dot product of normalize object2camera vector & target2camera vector
            //and compare with frustrum FiledOfView angle cosinus
            visible = (this.projection.fieldOfViewDot || 0) <= (vx / length * this.direction[0] + vy / length * this.direction[1] + vz / length * this.direction[2]);

        return visible;
    };

    M3D.Camera.prototype.update = function () {

        let coords = this.coords;
        let target = this.target;
        let direction = this.direction;

        if (this.hasTarget) {

            //compute target2camera direction vector
            let vx = target[0] - coords[0];
            let vy = target[1] - coords[1];
            let vz = target[2] - coords[2];
            let length = Math.sqrt(vx * vx + vy * vy + vz * vz);

            if (length !== 0) {
                //normalize vector
                direction[0] = vx / length;
                direction[1] = vy / length;
                direction[2] = vz / length;

            } else {

                //use default vector toZ
                direction[0] = 0;
                direction[1] = 0;
                direction[2] = 1;

            }
            //////////////////////////////

        } else {

            target[0] = coords[0] + direction[0];
            target[1] = coords[1] + direction[1];
            target[2] = coords[2] + direction[2];

        }

        loockAtMat4(this.lookMatrix, coords[0], coords[1], coords[2], target[0], target[1], target[2], this.upvect[0], this.upvect[1], this.upvect[2]);
        copyMat4(this.lookMatrix, this.viewMatrix);
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
        gl.uniformMatrix4fv(cameraStruct.mlook, false, this.lookMatrix);
        gl.uniformMatrix4fv(cameraStruct.mproject, false, this.projection.projectionMatrix);
        gl.uniform3fv(cameraStruct.coords, this.coords);

    };

    //Camera : Perspective Projection class constructor and properties
    ////////////////////////////////////////////////////////////////////////////
    M3Dp.CameraProjection = function () { };

    M3D.Camera.PerspectiveProjection = function (fieldOfView, ratio, znear, zfar) {

        //define projection properties
        defineUpdateableProperty(this, 'ratio', ratio || 1);
        defineUpdateableProperty(this, 'fieldOfView', fieldOfView || 45);
        defineUpdateableProperty(this, 'znear', znear || 0.01);
        defineUpdateableProperty(this, 'zfar', zfar || 100);

        this.projectionMatrix = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
        this.fieldOfViewDot = 0.7071;
        this.maxDistance = 99.99;
        this.updated = true;

    };

    M3D.Camera.PerspectiveProjection.prototype = Object.create(M3Dp.CameraProjection.prototype);

    M3D.Camera.PerspectiveProjection.prototype.setRatio = function (ratio) {
        isNaN(ratio) || (this.ratio = ratio);
    };

    M3D.Camera.PerspectiveProjection.prototype.setFrustrum = function (fieldOfView, znear, zfar) {

        isNaN(fieldOfView) || (this.fieldOfView = fieldOfView);
        isNaN(znear) || (this.znear = znear);
        isNaN(zfar) || (this.zfar = zfar);

    };

    M3D.Camera.PerspectiveProjection.prototype.update = function () {

        //compute perspective bounds
        this.fieldOfViewDot = Math.cos(this.fieldOfView * Math.PI / 180);
        this.maxDistance = (this.zfar - this.znear) / this.fieldOfViewDot;

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
        this.maxDistance = 2;
        this.updated = true;

    };

    M3D.Camera.OrtographicProjection.prototype = Object.create(M3Dp.CameraProjection.prototype);

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
        isNaN(width) && (width = 1);
        isNaN(height) && (height = width);
        isNaN(depth) && (depth = width);

        this.rigth = width / 2;
        this.left = -width / 2;
        this.up = height / 2;
        this.down = -height / 2;
        this.znear = -depth / 2;
        this.zfar = depth / 2;

    };

    M3D.Camera.OrtographicProjection.prototype.update = function () {

        //recompute max distance
        this.maxDistance = this.far - this.near;

        ortographicMat4(this.projectionMatrix, this.ratio, this.rigth, this.left, this.up, this.down, this.znear, this.zfar);

        this.updated = false;
    };

    //Camera: Orbital location controller
    M3D.Camera.OrbitalMouseController = function (camera, screenWidth, screenHeight) {

        let self = this;

        this.beforeX = 0;
        this.beforeY = 0;
        this.beforeV = 0;

        this.dist = 10;
        this.alpha = 0;
        this.omega = 0;
        this.useRadians = true;

        defineUneditableProperty(this, 'center', new M3D.Vector(0, 0, 0, 0));

        this.camera = camera;
        this.screenWidth = screenWidth || 0;
        this.screenHeight = screenHeight || 0;

        this.alphaSpeed = 1;
        this.omegaSpeed = 1;
        this.zoomSpeed = 1;

        this.maxAlpha = 1.0;
        this.maxOmega = 0.5;
        this.maxDistance = 100;

        this.minAlpha = -1.0;
        this.minOmega = -0.5;
        this.minDistance = 1;
        
        this.onorbit = function (pointerX, pointerY) {

            let dx, dy;

            pointerX = parseInt(pointerX / this.screenWidth * 360);
            pointerY = parseInt(pointerY / this.screenHeight * 180);
            
            if (this.beforeX && this.beforeY) {
                dx = (pointerX - this.beforeX);
                dy = (pointerY - this.beforeY);
                
                if (dx || dy) {

                    if (dx !== 0) {
                        dx = (dx > 0) ? this.alphaSpeed : -this.alphaSpeed;

                        //transform deg2rad if need
                        if (this.useRadians) {
                            dx *= (Math.PI / 180);
                        }

                        this.alpha += dx;

                        //validate camera alpha
                        if (this.alpha > this.maxAlpha || this.alpha < this.minAlpha)
                            this.alpha -= dx;
                    }

                    if (dy !== 0) {
                        dy = (dy > 0) ? this.omegaSpeed : -this.omegaSpeed;

                        //transform deg2rad if need
                        if (this.useRadians) {
                            dy *= (Math.PI / 180);
                        }

                        this.omega += dy;

                        //validate camera omega
                        if (this.omega > this.maxOmega || this.omega < this.minOmega)
                            this.omega -= dy;

                    }

                    M3Dp.updateCameraLocation(this)

                }
            }

            this.beforeX = pointerX;
            this.beforeY = pointerY;
        };

        this.onzoom = function (value) {

            let dv, dist
            
            if (this.beforeV) {
                console.log(value)
                
                //dv = (value - this.beforeV);
                dv = value /100;
                
                if (dv) {
                    
                    dv = dv < 0 ? this.zoomSpeed : - this.zoomSpeed;
                    dist = this.dist + dv;
                    
                    // check distance valid range
                    if (dist <= this.maxDistance && dist >= this.minDistance) {
                        this.dist = dist;
                        M3Dp.updateCameraLocation(this);
                    
                    }

                }
                
                
            }

            this.beforeV = value;
        
        };

        this.onmove = function (me) {

            // modify camera orbital  location
            self.onorbit(me.clientX, me.clientY);

            if (self.onupdate)
                self.onupdate(mouseEvent, false);

        };
        
        this.ontouch = function (te) {
            te.preventDefault();

            let touches = te.changedTouches;
            let dx, dy, dist

            if (touches.length === 1) {

                // modify camera orbital location
                self.onorbit(touches[0].clientX, touches[0].clientY);

            } else {

                // compute touch points distance
                dx = touches[0].clientX - touches[1].clientX;
                dy = touches[0].clientY - touches[1].clientY;
                dist = Math.sqrt(dx * dx + dy * dy);

                // modify camera orbital location
                self.onzoom(dist);

            }

            // call update hendle
            if (self.onupdate)
                self.onupdate(touchEvent, true);

        };

        this.onwheel = function (we) {
            // modify camera orbital distance
            self.onzoom(we.deltaY);

            // call update hendle
            if (self.onupdate)
                self.onupdate(touchEvent, true);

        };

    }



    M3Dp.updateCameraLocation = function (controller) {

        let loc = new M3D.Vector(0, 0, controller.dist);

        // compute relative orbital location
        orbiteVec3(loc, controller.alpha, controller.omega)

        // move orbital position relative to center
        loc.x += controller.center.x;
        loc.y += controller.center.y;
        loc.z += controller.center.z;

        // update camera parameters
        controller.camera.setCoords(loc.x, loc.y, loc.z)
        controller.camera.setTargetCoords(controller.center.x, controller.center.y, controller.center.z)
        
    }

    M3D.Camera.OrbitalMouseController.prototype.configureTouchEvents = function (target, enable) {

        if (enable) {
            // configure screen size
            this.screenWidth = this.screenWidth || target.width || 0;
            this.screenHeight = this.screenHeight || target.height || 0;

            target.addEventListener('touchmove', this.ontouch);

        } else {
            target.removeEventListener('touchmove', this.ontouch);
        }

    }

    M3D.Camera.OrbitalMouseController.prototype.configureMouseEvents = function (target, enable) {


        if (enable) {
            // configure screen size
            this.screenWidth = this.screenWidth || target.width || 0;
            this.screenHeight = this.screenHeight || target.height || 0;

            target.addEventListener('mousemove', this.onmove);
            target.addEventListener('mousewheel', this.onwheel);

        } else {
            target.removeEventListener('mousemove', this.onmove);
            target.removeEventListener('mousewheel', this.onwheel);

        }

    }

    //Ligth class constructor and properties
    ////////////////////////////////////////////////////////////////////////////
    M3D.Ligth = function (name, type, x, y, z, r, g, b) {

        //define ligth properties
        this.name = name;
        defineUneditableProperty(this, 'id', elementID++);
        defineUpdateableProperty(this, 'type', type || M3D.Ligth.DOTTED);

        //define ligth state
        this.enable = false;
        this.updated = true;

        //define ligth parameters
        this.coords = createUpdateablePropertyVector(this, 'x', 'y', 'z', x || 0, y || 0, z || 0);
        this.target = createUpdateablePropertyVector(this, 'x', 'y', 'z', 0, 0, 0);
        this.color = createUpdateablePropertyVector(this, 'r', 'g', 'b', r || 1, g || 1, b || 1);
        this.direction = createUpdateablePropertyVector(this, 'x', 'y', 'z', 1, 1, 1);
        this.invDirection = new Float32Array(3);
        this.maxDot = -1;

        this.hasTarget = false;

        defineUpdateableProperty(this, 'spotAngle', 360);
        defineUpdateableProperty(this, 'ratio', 100);

    };

    //define type ligth constants
    defineUneditableProperty(M3D.Ligth, 'AMBIENTAL', 6267001);
    defineUneditableProperty(M3D.Ligth, 'DIRECTIONAL', 667002);
    defineUneditableProperty(M3D.Ligth, 'DOTTED', 6267003);
    defineUneditableProperty(M3D.Ligth, 'SPOT', 6267004);

    M3D.Ligth.prototype.setType = function (type) {
        this.type = type;
    };

    M3D.Ligth.prototype.setCoords = function (x, y, z) {
        this.coords[0] = x;
        this.coords[1] = y;
        this.coords[2] = z;
        this.updated = true;
    };

    M3D.Ligth.prototype.setDirection = function (x, y, z) {

        let length = Math.sqrt(x * x + y * y + z * z);

        if (length !== 0) {
            //normalize direction
            this.direction[0] = x / length;
            this.direction[1] = y / length;
            this.direction[2] = z / length;

        } else {
            //use default direction
            this.direction[0] = 0;
            this.direction[1] = 0;
            this.direction[2] = 1;

        }

        this.updated = true;
    };

    M3D.Ligth.prototype.setDirection2Object = function (obj) {
        let x, y, z, length;

        if (obj instanceof M3D.Object) {
            x = this.coords.x - obj.coords.x;
            y = this.coords.y - obj.coords.y;
            z = this.coords.z - obj.coords.z;

            length = Math.sqrt(x * x + y * y + z * z);

            if (length !== 0) {
                //normalize direction
                this.direction[0] = x / length;
                this.direction[1] = y / length;
                this.direction[2] = z / length;

            } else {
                //use default direction
                this.direction[0] = 0;
                this.direction[1] = 0;
                this.direction[2] = 1;

            }

            this.updated = true;
        }

    }

    M3D.Ligth.prototype.setTargetCoords = function (x, y, z) {
        this.target[0] = x;
        this.target[1] = y;
        this.target[2] = z;

        this.hasTarget = true;
        this.updated = true;
    };

    M3D.Ligth.prototype.removeTarget = function () {
        this.hasTarget = false;
        this.updated = true;
    };

    M3D.Ligth.prototype.setColor = function (red, green, blue) {
        this.color[0] = red || 0;
        this.color[1] = green || 0;
        this.color[2] = blue || 0;
        this.updated = true;
    };

    M3D.Ligth.prototype.setAngle = function (angle) {
        this.spotAngle = angle;
    };

    M3D.Ligth.prototype.setEnable = function (enable) {
        this.enable = enable;
    };

    M3D.Ligth.prototype.update = function () {
        let dx, dy, dz, length;

        if (this.hasTarget) {
            //compute target2ligth direction
            dx = this.coords.x - this.target.x;
            dy = this.coords.y - this.target.y;
            dz = this.coords.z - this.target.z;
            length = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (length !== 0) {
                //normalize direction
                this.direction[0] = dx / length;
                this.direction[1] = dy / length;
                this.direction[2] = dz / length;

            } else {
                //use default direction
                this.direction[0] = 0;
                this.direction[1] = 0;
                this.direction[2] = 1;

            }

        }

        // compute inevrse ligth direction
        this.invDirection[0] = -this.direction[0];
        this.invDirection[1] = -this.direction[1];
        this.invDirection[2] = -this.direction[2];

        // compute spot ligth angle cosinus
        this.maxDot = Math.cos(this.spotAngle / 180 * Math.PI);

        this.updated = false;
    };

    M3D.Ligth.prototype.sendToGPU = function (gl, ligthStruct) {
        if (this.updated)
            this.update();

        //send ligth state
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
                gl.uniform3fv(ligthStruct.direction, this.invDirection);

                break;

            case M3D.Ligth.SPOT:
                gl.uniform1i(ligthStruct.ambient, 0);
                gl.uniform1i(ligthStruct.directional, 0);
                gl.uniform1i(ligthStruct.spot, 1);

                gl.uniform3fv(ligthStruct.direction, this.invDirection);
                gl.uniform1f(ligthStruct.maxDot, this.maxDot);
                gl.uniform1f(ligthStruct.ratio, this.ratio);

                break;
            default:

                gl.uniform1i(ligthStruct.ambient, 0);
                gl.uniform1i(ligthStruct.directional, 0);
                gl.uniform1f(ligthStruct.ratio, this.ratio);
                gl.uniform1i(ligthStruct.spot, 1);

                gl.uniform3fv(ligthStruct.direction, this.invDirection);
                gl.uniform1i(ligthStruct.spot, 0);
                //gl.uniform1f(ligthStruct.maxDot, -1);

                break;

        }

        //set ligth properties
        gl.uniform3fv(ligthStruct.coords, this.coords);
        gl.uniform3fv(ligthStruct.color, this.color);

    };

    //Scene Object class constructor and properties
    ////////////////////////////////////////////////////////////////////////////
    M3D.Object = function (name, model, x, y, z) {

        //define object parameters
        defineUneditableProperty(this, 'id', elementID++);
        this.name = name;
        this.type = 0;

        //define object states
        this.enable = true;
        this.visible = false;
        this.updated = false;

        //define functional elements
        this.geometry = new M3D.Box();
        this.model = null;
        this.controller = null;

        //define entity parameters
        this.coords = createUpdateablePropertyVector(this, 'x', 'y', 'z', x || 0, y || 0, z || 0);
        this.rotation = createUpdateablePropertyVector(this, 'x', 'y', 'z', 0, 0, 0);
        this.scale = createUpdateablePropertyVector(this, 'x', 'y', 'z', 1, 1, 1);

        //define hierarchical structure elements
        this.stack = null;
        this.parent = null;
        this.childrens = null;
        this.hasChildrens = false;

        //define entity transform matrix's
        this.localMatrix = new Float32Array(identityMatrix);
        this.finalMatrix = new Float32Array(identityMatrix);
        this.normalMatrix = new Float32Array(identityMatrix);

        //set final model instance
        if (model) {
            this.setModel(model);
        }

    };

    M3Dp.Object = {};

    M3D.Object.prototype.setCoords = function (Px, Py, Pz) {
        this.coords[0] = Px;
        this.coords[1] = Py;
        this.coords[2] = Pz;
        this.updated = true;
    };

    M3D.Object.prototype.setRotation = function (Rx, Ry, Rz) {
        this.rotation[0] = Rx;
        this.rotation[1] = Ry;
        this.rotation[2] = Rz;
        this.updated = true;
    };

    M3D.Object.prototype.setScale = function (Sx, Sy, Sz) {
        isNaN(Sx) && (Sx = 1);

        this.scale[0] = Sx;
        this.scale[1] = Sy || Sx;
        this.scale[2] = Sz || Sx;
        this.updated = true;
    };

    M3D.Object.prototype.setModel = function (model) {
        let modelInstance = null;

        if (model instanceof M3D.Model) {

            //get model instance form renderable model
            modelInstance = model.makeInstance();

            //define object matrix's as instance matrix's
            modelInstance.transformMatrix = this.finalMatrix;
            modelInstance.normalMatrix = this.normalMatrix;

            //redefine object model instance
            this.model = modelInstance;

        }

        return this;
    };

    M3D.Object.prototype.setGeometry = function (geometry) {
        if (geometry instanceof M3D.Geometry) {
            this.geometry = geometry;
            this.updated = true;

        }
    };

    M3D.Object.prototype.setController = function (controller) {
        if (controller instanceof M3D.Controller) {
            // define object controller
            this.controller = new M3D.Controller(controller);
            this.controller.initialize(this);

        }

    };

    M3D.Object.prototype.setVisible = function (visible) {
        this.visible = visible;
    };

    M3D.Object.prototype.setEnable = function (enable) {
        this.enable = enable;
    };

    M3D.Object.prototype.addChildren = function (childrenObject) {

        if (childrenObject) {

            if (!this.childrens)
                this.childrens = new M3D.List();

            //define parent of object added
            this.childrens.add(childrenObject).parent = this;

            if (this.childrens.size === 1) {
                this.hasChildrens = true;
                this.herarchyChanged = true;

                //redefine update callback
                this.update = M3Dp.Object.updateHerarchy;

                if (!this.stack)
                    this.stack = new M3D.Stack();
            }

        }

        return childrenObject;
    };

    M3D.Object.prototype.deleteChildren = function (deletedObjectName) {
        let childrenObject;

        if (this.childrens) {
            childrenObject = this.childrens && this.childrens.removeByName(deletedObjectName);

            if (childrenObject) {
                childrenObject.parent = null;

                if (this.childrens.size === 0) {
                    this.hasChildrens = false;

                    //redefine update callback
                    this.update = M3Dp.Object.updateObject;

                }

            }
        }

        return childrenObject;
    };

    M3D.Object.prototype.clearChildrens = function () {
        let children = null;
        let node;

        if (this.hasChildrens) {
            node = this.childrens.head;

            while (node) {
                //undefine parent of object data on node
                children = node.data;
                node = node.next;

                //delete children to parent reference
                children.parent = null;
            }

            this.childrens.head = null;

        }

        //redefine update callback
        this.update = M3Dp.Object.updateHerarchy;
    };

    M3D.Object.prototype.getChildrens = function (depth) {

        let output = new M3D.Stack();
        let isRoot = true;
        let level = 0;

        let parent;
        let object;
        let node;
        let stack;

        if (this.hasChildrens) {
            stack = this.stack;

            //trave all herarchy tree levels
            do {

                if (node || isRoot) {

                    //select source object
                    if (node) {
                        //get object from node and jump to next node
                        object = node.data;
                        node = node.next;

                        //add object to output stack
                        output.push(object);

                    } else {
                        //use default object and close root state
                        object = this;
                        isRoot = false;

                    }

                    //eval if object has childrens herarchy
                    if (object.hasChildrens && level < 1) {

                        //save parent and next children node
                        stack.push(parent);
                        stack.push(node);

                        //redefine parent object and get first children node
                        parent = object;
                        node = parent.childrens.head;

                        //increase herarchy level
                        depth && level++;
                    }

                } else {

                    //restore last children node and it parent
                    node = stack.pop();
                    parent = stack.pop();

                }

                //if not exist hererchy parent finish state machine

            } while (parent);

        }

        return output.dataArray;
    };

    M3D.Object.prototype.reset = function () {

        // use controller reset event handler
        if (this.controller)
            return this.controller.reset(this);

        //reset local coords to origin
        this.coords[0] = 0;
        this.coords[1] = 0;
        this.coords[2] = 0;

        //reset local rotation to 0 degress
        this.rotation[0] = 0;
        this.rotation[1] = 0;
        this.rotation[2] = 0;

        //reset local scale to one
        this.scale[0] = 1;
        this.scale[1] = 1;
        this.scale[2] = 1;

        this.updated = true;
    };

    M3D.Object.prototype.draw = function () {

        this.visible && this.model.sendDrawCall();

    };

    M3Dp.Object.updateHerarchy = function () {

        let stack = this.stack;
        let isRoot = true;

        let object = null;
        let parent = null;
        let node = null;

        let updated;
        let controller;
        let geometry;
        let coords;
        let rotation;
        let scale;

        let parentTransformMatrix;
        let localTransformMatrix;
        let finalTransformMatrix;
        let normalTransformMatrix;

        //trave all herarchy tree levels
        do {

            if (node || isRoot) {

                //select source object
                if (node) {
                    //get object from node and jump to next node
                    object = node.data;
                    node = node.next;

                } else {
                    //use default object and close root state
                    object = this;
                    isRoot = false;

                }

                //Update object
                ////////////////////////////////////////////////////////////////


                //get object transform matrix's
                localTransformMatrix = object.localMatrix;
                finalTransformMatrix = object.finalMatrix;
                normalTransformMatrix = object.normalMatrix;

                //get object properties
                geometry = object.geometry;
                controller = object.controller;
                coords = object.coords;
                rotation = object.rotation;
                scale = object.scale;

                //emulate entity controller
                if (controller) {
                    if (controller.initialized)
                        controller.update(object);
                    else
                        controller.initialized = true;
                }

                //get update state <~~~~ FIX IT
                updated = object.updated;

                if (updated) {

                    //re-compute object local transform matrix
                    identityMat4(localTransformMatrix);
                    translateMat4(localTransformMatrix, coords[0], coords[1], coords[2]);
                    rotateMat4(localTransformMatrix, rotation[0], rotation[1], rotation[2]);
                    scaleMat4(localTransformMatrix, scale[0], scale[1], scale[2]);

                    if (!parent) {
                        //use computed local transform matrix as final
                        copyMat4(localTransformMatrix, finalTransformMatrix);
                        invertMat4(finalTransformMatrix, normalTransformMatrix, true);

                    }

                }

                if (parent) {

                    //use computed global transform matrix as final
                    multiplyMat4(localTransformMatrix, parentTransformMatrix, finalTransformMatrix);
                    invertMat4(finalTransformMatrix, normalTransformMatrix, true);

                    updated = true;
                }

                //update geometry
                if (updated)
                    geometry.update(object);

                ////////////////////////////////////////////////////////////////

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

                object.updated = false;

            } else {

                //restore last children node and it parent
                node = stack.pop();
                parent = stack.pop();

            }

            //if not exist hererchy parent finish state machine

        } while (parent);

    };

    M3Dp.Object.updateObject = function () {

        let finalTransformMatrix = this.finalMatrix;

        //emulate entity controller
        if (this.controller) {
            if (this.controller.initialized)
                this.controller.update(this);
            else
                this.controller.initialized = true;
        }

        // update object values
        if (this.updated) {
            this.updated = false;

            identityMat4(finalTransformMatrix);

            //re-compte local transform matrix
            translateMat4(finalTransformMatrix, this.coords[0], this.coords[1], this.coords[2]);
            rotateMat4(finalTransformMatrix, this.rotation[0], this.rotation[1], this.rotation[2]);
            scaleMat4(finalTransformMatrix, this.scale[0], this.scale[1], this.scale[2]);

            invertMat4(finalTransformMatrix, this.normalMatrix, true);

            //update geoemtry
            this.geometry.update(this);

        }

    };

    M3D.Object.prototype.update = M3Dp.Object.updateObject;

    //Object controller class constructor
    ////////////////////////////////////////////////////////////////////////////
    M3D.Controller = function (controller) {

        if (controller) {
            // asign cloned controller event hadlers
            this.initialize = controller.initialize;
            this.update = controller.update;
            this.reset = controller.reset;

        } else {
            // use default events handlers
            this.initialize = M3D.Controller.prototype.initialize;
            this.update = M3D.Controller.prototype.update;
            this.reset = M3D.Controller.prototype.reset;

        }

        this.initialized = false;
    };

    M3D.Controller.prototype.initialize = function () { };

    M3D.Controller.prototype.reset = function () { };

    M3D.Controller.prototype.update = function () { };

    //Geometry class constructor
    ////////////////////////////////////////////////////////////////////////////
    M3D.Geometry = function () { };

    M3D.Geometry.hasBox2BoxColition = function (box1, box2) {
        return box1.left <= box2.rigth && box1.rigth >= box2.left
            && box1.down <= box2.up && box1.up >= box2.down
            && box1.zfar <= box2.znear && box1.znear >= box2.zfar;

    }

    M3D.Geometry.hasSphere2SphereColition = function (sphere1, sphere) {

        //compute axis distance
        let d = other.center[0] - this.center[0];
        let length = d * d;

        d = other.center[1] - this.center[1];
        length += d * d;

        d = other.center[2] - this.center[2];
        length += d * d;

        //compare distance betwen geometries
        return Math.sqrt(length) <= this.ratio + other.ratio;

    };

    M3D.Geometry.hasBox2SphereColition = function (box, sphere) {

        let dx = other.center[0] - this.center[0];
        let dy = other.center[1] - this.center[1];
        let dz = other.center[2] - this.center[2];

        //get maxime distance betwen tow geometries (dr)
        //and dimension (dv) of this on selected axis
        dr = dx;
        dv = box.dimensions.width;

        if (dr < dy) {
            dr = dy;
            dv = box.dimensions.height;
        }

        if (dr < dz) {
            dr = dz;
            dv = box.dimensions.depth;
        }

        hasColition = dr <= sphere.ratio + dv / 2;
    };

    //BoundBox class constructor and properties
    ////////////////////////////////////////////////////////////////////////////
    M3D.Box = function (width, height, depth) {

        width || (width = 1);
        height || (height = 1);
        depth || (depth = 1);

        //define bounds center and size
        this.center = createPropertyVector('x', 'y', 'z', 0, 0, 0);
        defineUneditableProperty(this, 'dimensions', {
            width: width,
            height: height,
            depth: depth
        });

        //define bounds limits
        this.rigth = width / 2;
        this.left = - width / 2;
        this.up = height / 2;
        this.down = - height / 2;
        this.znear = depth / 2;
        this.zfar = - depth / 2;

    };

    M3D.Box.prototype = Object.create(M3D.Geometry.prototype);

    M3D.Box.prototype.setDimensions = function (width, height, depth) {
        this.dimensions.width = width;
        this.dimensions.height = height;
        this.dimensions.depth = depth;

    };

    M3D.Box.prototype.hasColition = function (other) {

        if (other instanceof M3D.Box)
            return M3D.Geometry.hasBox2BoxColition(this, other);
        else if (other instanceof M3D.Sphere)
            return M3D.Geometry.hasBox2SphereColition(this, other);
        else
            return false;

    };

    M3D.Box.prototype.update = function (object) {

        //get bounds center

        //compute X axis edges
        let coord = this.center[0] = object.coords[0];
        let semivalue = this.dimensions.width / 2;
        this.rigth = coord + semivalue;
        this.left = coord - semivalue;

        //compute Y axis edges
        coord = this.center[1] = object.coords[1];
        semivalue = this.dimensions.height / 2;
        this.up = coord + semivalue;
        this.down = coord - semivalue;

        //compute Z axis edges
        coord = this.center[2] = object.coords[2];
        semivalue = this.dimensions.depth / 2;
        this.znear = coord + semivalue;
        this.zfar = coord - semivalue;

    };

    //Sphere class constructor and properties
    ////////////////////////////////////////////////////////////////////////////
    M3D.Sphere = function (ratio) {

        this.center = createPropertyVector('x', 'y', 'z', 0, 0, 0);
        this.ratio = ratio;

    };

    M3D.Sphere.prototype = Object.create(M3D.Geometry.prototype);

    M3D.Sphere.prototype.hasColition = function (other) {
        if (other instanceof M3D.Box)
            return M3Dp.Geometry.hasBox2SphereColition(other, this);
        else if (other instanceof M3D.Sphere)
            return M3Dp.Geometry.hasSphere2SphereColition(this, other);
        else
            return false;

    };

    M3D.Sphere.prototype.update = function (object) {
        this.center[0] = object.finalMatrix[12];
        this.center[1] = object.finalMatrix[13];
        this.center[2] = object.finalMatrix[14];

    };

    //Render Shader Factory class constructor and properties
    ////////////////////////////////////////////////////////////////////////////
    M3D.RenderShaderFactory = function () { };

    M3D.RenderShaderFactory.requestAsync = false;

    M3D.RenderShaderFactory.requestUser = null;

    M3D.RenderShaderFactory.requestPassword = null;

    M3D.RenderShaderFactory.oncreate = null;

    M3D.RenderShaderFactory.loadRenderShader = function (renderer, vertexShaderURL, fragmentShaderURL, requestID) {

        let async = this.requestAsync;
        let user = this.requestUser;
        let password = this.requestPassword;

        let vertexSource;
        let fragmentSource;
        let renderShader;

        let onloadfragment = function () {
            console.timeEnd(timerID);
            fragmentSource = this.responseText;
            renderShader = self.createRenderShader(renderer, vertexSource, fragmentSource);

            if (self.onload) {
                self.onload(renderShader, requestID);

            }
        };

        let onloadvertex = function () {
            vertexSource = this.responseText;

            this.open('GET', fragmentShaderURL, async, user, password);
            this.onload = onloadfragment;
            this.send(null);

        };

        let XHR = new XMLHttpRequest();
        let self = this;
        let timerID = 'LOADING SHADER';

        console.time(timerID);
        console.log("Started request");

        XHR.onload = onloadvertex;

        XHR.onerror = function () {
            console.timeEnd(timerID);
            console.error("ERROR: Loading shader file as URL " + this.responseURL);

            if (self.onload) {
                self.onload(null, requestID);
            }

            renderShader = null;
        };

        XHR.open('GET', vertexShaderURL, async, user, password);

        XHR.send(null);

        console.log(renderShader);
        return renderShader;
    };

    M3D.RenderShaderFactory.createRenderShader = function (renderer, vertexCode, fragmentCode) {
        let gl = renderer.gl;
        let vertexShader, vertexShaderInfoLog;
        let fragmentShader, fragmentShaderInfoLog;
        let shaderProgram, shaderProgramInfoLog;
        let isLinked, hasError;
        let response = null;

        //Create shaders
        ///////////////////////////////////////////////////////
        if (renderer instanceof M3D.SceneRenderer && vertexCode && fragmentCode) {

            //create and compile vertex shader
            vertexShader = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(vertexShader, vertexCode);
            gl.compileShader(vertexShader);

            //create and compile fragment shader
            fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(fragmentShader, fragmentCode);
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
                gl.attachShader(shaderProgram, vertexShader);
                gl.attachShader(shaderProgram, fragmentShader);
                gl.linkProgram(shaderProgram);

                isLinked = gl.getProgramParameter(shaderProgram, gl.LINK_STATUS);

                if (isLinked) {

                    //define shader source code
                    defineUneditableProperty(vertexShader, 'source', vertexCode);
                    defineUneditableProperty(fragmentShader, 'source', fragmentCode);

                    //define shader program properties
                    defineUneditableProperty(shaderProgram, 'id', elementID++);
                    defineUneditableProperty(shaderProgram, 'isRenderShader', true);
                    defineUneditableProperty(shaderProgram, 'gl', gl);
                    defineUneditableProperty(shaderProgram, 'vertexShader', vertexShader);
                    defineUneditableProperty(shaderProgram, 'fragmentShader', fragmentShader);
                    defineUneditableProperty(shaderProgram, 'attribs', {});
                    defineUneditableProperty(shaderProgram, 'uniforms', {});

                    //define shader program methoods
                    defineUneditableProperty(shaderProgram, 'addAttrib', M3Dp.RenderShader.addAttrib);
                    defineUneditableProperty(shaderProgram, 'addUniform', M3Dp.RenderShader.addUniform);
                    defineUneditableProperty(shaderProgram, 'addUniformArray', M3Dp.RenderShader.addUniformArray);
                    defineUneditableProperty(shaderProgram, 'addUniformStruct', M3Dp.RenderShader.addUniformStruct);
                    defineUneditableProperty(shaderProgram, 'addUniformStructArray', M3Dp.RenderShader.addUniformStructArray);
                    defineUneditableProperty(shaderProgram, 'disableVertexAttribs', M3Dp.RenderShader.disableVertexAttribs);
                    defineUneditableProperty(shaderProgram, 'destroy', M3Dp.RenderShader.destroy);

                    response = shaderProgram;
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

    M3D.RenderShaderFactory.destroyRenderShader = function (renderShader) {
        return renderShader.destroy();
    };

    //Render Shader class constructor and properties
    ////////////////////////////////////////////////////////////////////////////
    M3Dp.RenderShader = function () { };

    M3Dp.RenderShader.addAttrib = function (name, attribName) {
        this.attribs[name] = this.gl.getAttribLocation(this, attribName);
    };

    M3Dp.RenderShader.addUniform = function (name, uniformName) {
        this.uniforms[name] = this.gl.getUniformLocation(this, uniformName);
    };

    M3Dp.RenderShader.addUniformArray = function (name, uniformName, length) {
        let gl = this.gl;
        let array = this.uniforms[name] = new Array(length);

        //add uniformst to array
        for (let i = 0; i < length; i++) {
            array[i] = gl.getUniformLocation(this, uniformName + '[' + i + ']');
        }

    };

    M3Dp.RenderShader.addUniformStruct = function (name, uniformName, fields) {
        let gl = this.gl;
        let struct = this.uniforms[name] = new Object();
        let length = fields.length;

        //add fields to struct
        for (let i = 0; i < length; i++) {
            struct[fields[i]] = gl.getUniformLocation(this, uniformName + '.' + fields[i]);
        }

    };

    M3Dp.RenderShader.addUniformStructArray = function (name, uniformName, fields, length) {
        let gl = this.gl;
        let array = this.uniforms[name] = new Array();
        let struct;
        let size = fields.length;

        //add structs to array
        for (let i = 0; i < length; i++) {
            array[i] = struct = new Object();

            //add fields to struct
            for (let j = 0; j < size; j++) {
                struct[fields[j]] = gl.getUniformLocation(this, uniformName + '[' + i + '].' + fields[j]);
            }
        }

    };

    M3Dp.RenderShader.disableVertexAttribs = function () {

        for (let attribIndex in this.attribs) {
            this.gl.disableVertexAttribArray(attribIndex);
        }

    };

    M3Dp.RenderShader.destroy = function () {
        let gl = this.gl;

        //detach GL program shaders
        gl.detachShader(this, this.vertexShader);
        gl.detachShader(this, this.fragmentShader);

        //destroy GL program shaders
        gl.deleteShader(this.vertexShader);
        gl.deleteShader(this.fragmentShader);

        //destoy GL program
        gl.deleteProgram(this);

        return null;
    };

    //OutputFrameBuffer class contructor and properties
    ////////////////////////////////////////////////////////////////////////////
    M3D.OutputFramebuffer = function (renderer, width, height) {
        let gl;

        if (renderer instanceof M3D.SceneRenderer) {
            gl = renderer.gl;

            width > 0 || (width = 256);
            height > 0 || (height = 256);

            defineUneditableProperty(this, 'id', elementID++);
            defineUneditableProperty(this, 'gl', gl);

            this.width = width;
            this.height = height;

            this.framebuffer = gl.createFramebuffer();
            this.renderbuffer = gl.createRenderbuffer();

            //create output texture
            this.frame = gl.createTexture();
            this.frame.initialized = true;
            this.frame.width = this.width;
            this.frame.height = this.height;

            //open GL resources to configure
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
            gl.bindRenderbuffer(gl.RENDERBUFFER, this.renderbuffer);
            gl.bindTexture(gl.TEXTURE_2D, this.frame);

            //define texture parameters
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

            //configure texture to catch COLOR
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

            //configure renderbuffer to cath DEPTH
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.frame, 0);
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.renderbuffer);

            //clear render buffer
            gl.clearColor(1, 0, 0, 1);
            gl.viewport(0, 0, this.width, this.height);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            //close GL resources
            gl.bindTexture(gl.TEXTURE_2D, null);
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        } else {
            throw new Error('Not provided valid SceneRenderer to make OutputFrameBuffer.');
        }

    };

    M3D.OutputFramebuffer.prototype.setSize = function (width, height) {
        let gl = this.gl;

        if (width > 0 && height > 0) {
            this.width = width;
            this.height = height;

            //open GL resources to configure
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
            gl.bindRenderbuffer(gl.RENDERBUFFER, this.renderbuffer);
            gl.bindTexture(gl.TEXTURE_2D, this.frame);

            //define texture parameters
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

            //configure texture to catch COLOR
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

            //configure renderbuffer to cath DEPTH
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.frame, 0);
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.renderbuffer);

            //close GL resources
            gl.bindTexture(gl.TEXTURE_2D, null);
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }

    };

    //FPS Counter class constructor and properties
    ////////////////////////////////////////////////////////////////////////////
    M3D.FPSCounter = function () {

        this.lastSecondTime = -1;
        this.lastFrameTime = 0;

        this.fps = 0;
        this.frameInterval = 0;
        this.count = 0;

        this.maxFps = 0;
        this.minFps = 60;
        this.maxInterval = 0;
        this.minIntrval = 60;

        this.frameNumberLog = new Array(60);
        this.frameIntervalsLog = new Array(60);

        this.frameNumberLogSize = 0;
        this.frameIntervalsLogSize = 0;

    };

    M3D.FPSCounter.prototype.countFrame = function () {
        let currentTime = new Date().getTime();

        let lastSecondTime = this.lastSecondTime;
        let lastFrameTime = this.lastFrameTime;

        let secondInterval;
        let frameInterval;
        let hasFrame = false;

        if (lastSecondTime <= 0) {
            //initialize first frame time
            this.lastSecondTime = currentTime;
            this.lastFrameTime = currentTime;

        } else {

            //compute per-frame interval
            secondInterval = currentTime - lastSecondTime;
            frameInterval = currentTime - lastFrameTime;

            //registre stats after one interval of 1000 ms = 1 s
            if (secondInterval >= 1000) {
                fps = this.count;

                //re-define max and min FPS times
                fps <= this.maxFps || (this.maxFps = fps);
                fps >= this.minFps || (this.minFps = fps);

                if (this.frameNumberLogSize >= 60) {
                    //move back before registred FPS Stats
                    for (let i = 0; i < 59; i++) {
                        this.frameNumberLog[i] = this.frameNumberLog[i + 1];
                    }

                    if (this.frameNumberLogSize % 60)
                        this.frameNumberLog[59] = fps;
                    else
                        //mark end minute second
                        this.frameNumberLog[59] = -fps;

                } else {
                    //registre a new FPS stat
                    this.frameNumberLog[this.frameNumberLogSize] = fps;
                }
                this.frameNumberLogSize++;

                //updated seconds values
                this.lastSecondTime = currentTime;
                this.fps = fps;

                //reset per-second frame counter
                this.count = -1;

                hasFrame = true;
            }

            frameInterval <= this.maxInterval || (this.maxInterval = frameInterval);
            frameInterval >= this.minInterval || (this.minInterval = frameInterval);
            this.frameInterval = frameInterval;

            //mark end frame of second
            if (hasFrame) {
                frameInterval *= -1;
            }

            if (this.frameIntervalsLogSize >= 60) {
                //move back before registred intervals
                for (let i = 0; i < 59; i++) {
                    this.frameIntervalsLog[i] = this.frameIntervalsLog[i + 1];
                }

                this.frameIntervalsLog[59] = frameInterval;
            } else {
                //registre new frame interval
                this.frameIntervalsLog[this.frameIntervalsLogSize] = frameInterval;
                this.frameIntervalsLogSize++;

            }

            //update frame stats
            this.lastFrameTime = currentTime;


            //increase per second frame counter
            this.count++;

        }//end else

        return hasFrame;
    };

    M3D.FPSCounter.prototype.reset = function () {
        this.lastSecondTime = 0;
        this.lastFrameTime = 0;

        this.fps = 0;
        this.count = 0;

        this.maxFps = 0;
        this.minFps = 60;
        this.maxInterval = 0;
        this.minIntrval = 60;

        this.frameNumberLogSize = 0;
        this.frameIntervalsLogSize = 0;

    };

    M3D.FPSCounter.prototype.showFPSRatesGraph = function (context2d, x, y) {
        x || (x = 0);
        y || (y = 0);

        let array = this.frameNumberLog;
        let length = this.frameNumberLogSize;

        context2d.save();

        context2d.beginPath();
        context2d.rect(x, y, 80, 90);
        context2d.clip();

        context2d.fillStyle = 'blue';
        context2d.fillRect(x, y, 80, 90);

        //draw numerical stats
        context2d.font = '10px monospace';
        context2d.fillStyle = 'yellow';
        context2d.fillText('(' + this.minFps + ' - ' + this.maxFps + ')', x + 10, y + 10);
        context2d.fillText(this.fps + ' FPS', x + 10, y + 85);

        //Draw graph bars
        ////////////////////////////////////////
        x += 10;
        y += 75;

        //show graph bars
        context2d.strokeStyle = 'white';
        context2d.strokeRect(x, y - 60, 60, 60);

        context2d.fillStyle = 'white';
        for (let i = 0, value; i < length; i++) {
            value = array[i];

            if (value < 0) {
                value = -value;

                //draw loged value
                context2d.fillStyle = 'red';
                if (value >= 60)
                    context2d.fillRect(x + i, y - 60, 1, 60);
                else
                    context2d.fillRect(x + i, y - value, 1, value);

                context2d.fillStyle = 'white';

            } else {

                //draw value
                if (value >= 60)
                    context2d.fillRect(x + i, y - 60, 1, 60);
                else
                    context2d.fillRect(x + i, y - value, 1, value);

            }
        }
        ////////////////////////////////////////

        context2d.restore();

    };

    M3D.FPSCounter.prototype.showFPSIntervalsGraph = function (context2d, x, y) {
        x || (x = 0);
        y || (y = 0);

        let array = this.frameIntervalsLog;
        let length = this.frameIntervalsLogSize;

        context2d.save();

        context2d.beginPath();
        context2d.rect(x, y, 80, 90);
        context2d.clip();

        context2d.fillStyle = 'green';
        context2d.fillRect(x, y, 80, 90);

        //draw numericals stats
        context2d.font = '10px monospace';
        context2d.fillStyle = 'yellow';
        context2d.fillText('(' + this.maxInterval + ' - ' + this.minInterval + ')', x + 10, y + 10);
        context2d.fillText(this.frameInterval + ' ms', x + 10, y + 85);

        //Draw graph bars
        ////////////////////////////////////////

        x += 10;
        y += 75;

        //show graph bars
        context2d.strokeStyle = 'white';
        context2d.strokeRect(x, y - 60, 60, 60);

        context2d.fillStyle = 'white';
        for (let i = 0, value; i < length; i++) {
            value = array[i];

            if (value < 0) {
                value = -value;

                //draw loged value
                context2d.fillStyle = 'red';
                if (value >= 60)
                    context2d.fillRect(x + i, y - 60, 1, 60);
                else
                    context2d.fillRect(x + i, y - value, 1, value);

                context2d.fillStyle = 'white';

            } else {

                //draw value
                if (value >= 60)
                    context2d.fillRect(x + i, y - 60, 1, 60);
                else
                    context2d.fillRect(x + i, y - value, 1, value);

            }
        }
        ////////////////////////////////////////

        context2d.restore();

    };

    //Renderer class constructor and properties
    ////////////////////////////////////////////////////////////////////////////
    M3D.SceneRenderer = function (canvas) {

        //use or create one HTMLCanvas to draw on it
        ////////////////////////////////////////////////

        if (!canvas)
            canvas = document.createElement('canvas');

        //create one WebGL context to renderize
        ////////////////////////////////////////////////
        let gl = canvas.getContext('webgl2') ||
            canvas.getContext('webgl') ||
            canvas.getContext('experimental-webgl');

        if (gl) {
            console.log('RENDRERER INITIALIZED: ');

            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.clearColor(0, 0, 0, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);

        } else {
            throw new Error('Failed obtaining WebGLRenderingContext');

        }

        //define scene-renderer properties
        defineUneditableProperty(this, 'canvas', canvas);
        defineUneditableProperty(this, 'gl', gl);
        defineUneditableProperty(this, 'shaders', new M3D.List());
        defineUneditableProperty(this, 'clearColor', {
            red: 0,
            green: 0,
            blue: 0,
            alpha: 1
        });

    };

    M3D.SceneRenderer.prototype.storeRenderShader = function (shader, name) {

        if (shader && shader.isRenderShader) {
            name && (shader.name = name);
            this.shaders.add(shader);

        } else {
            throw new Error("Not added provided shader because is not valid render shader");

        }

        return shader;
    };

    M3D.SceneRenderer.prototype.getRenderShader = function (name) {
        return this.shaders.getByName(name);
    };

    M3D.SceneRenderer.prototype.removeRenderShader = function (name) {
        return this.shaders.removeByName(name);
    };

    M3D.SceneRenderer.prototype.destroyRenderShader = function (name) {
        let shader = this.shaders.removeByName(name);

        if (shader) {
            //detroy gl shder
            shader.destroy(this.gl);
        }

        return shader;
    };

    M3D.SceneRenderer.prototype.setOutputResolution = function (width, height) {
        width >= 0 && (this.canvas.width = width);
        height >= 0 && (this.canvas.height = height);

        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

    };

    M3D.SceneRenderer.prototype.setClearColor = function (red, green, blue, alpha) {
        let color = this.clearColor;
        red >= 0 && (color.red = red);
        green >= 0 && (color.green = green);
        blue >= 0 && (color.blue = blue);
        alpha >= 0 && (color.alpha = alpha);

        this.gl.clearColor(color.red, color.green, color.blue, color.alpha);
    };

    M3D.SceneRenderer.prototype.clearScreen = function () {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    };

    M3D.SceneRenderer.prototype.drawScene = function (scene, camera, renderOptions) {

        let gl = this.gl;
        let canvas = this.canvas;
        let clearColor = this.clearColor;

        let usedModel;
        let usedShader;
        let usedShaderUniforms;
        let newShader;

        let objects;
        let models;
        let ligths;

        let objectNode;
        let modelNode;
        let ligthNode;

        let ligthIndex;

        //render options
        let shader = null;
        let outputFramebuffer = null;
        let executeDrawCalls = true;
        let preserveDrawCalls = false;
        let depthTestEnable = true;
        let cullFaceEnable = true;
        let blendEnable = false;

        //get output configuration
        if (renderOptions) {
            if (renderOptions.depthTestEnable !== undefined)
                depthTestEnable = renderOptions.depthTestEnable;

            if (renderOptions.cullFaceEnable !== undefined)
                cullFaceEnable = renderOptions.cullFaceEnable;

            if (renderOptions.belndEnable !== undefined)
                blendEnable = renderOptions.belndEnable;

            if (renderOptions.executeDrawCalls !== undefined)
                executeDrawCalls = renderOptions.executeDrawCalls;

            if (renderOptions.preserveDrawCalls !== undefined)
                preserveDrawCalls = renderOptions.preserveDrawCalls;

            if (renderOptions.outputFramebuffer instanceof M3D.OutputFramebuffer)
                outputFramebuffer = renderOptions.outputFramebuffer;

            if (renderOptions.shader !== undefined)
                shader = renderOptions.shader;

        }

        //Renderize Scene
        ///////////////////////////////////////////////////////////////
        if (gl && scene instanceof M3D.Scene && camera instanceof M3D.Camera) {

            //get list of storage object
            objects = scene.objects;
            models = scene.models;
            ligths = scene.ligths;

            //get first lists nodes
            objectNode = objects.head;
            modelNode = models.head;
            ligthNode = ligths.head;

            if (outputFramebuffer) {
                //enable customized framebuffer
                gl.bindFramebuffer(gl.FRAMEBUFFER, outputFramebuffer.framebuffer);

                //get and configure output framebuffer size to renderize
                gl.viewport(0, 0, outputFramebuffer.width, outputFramebuffer.height);
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

            //configure used blending
            if (blendEnable)
                gl.enable(gl.BLEND);
            else
                gl.disable(gl.BLEND);

            //update output camera
            if (camera.updated)
                camera.update();

            if (camera.projection.updated)
                camera.projection.update();
            ///////////////////////////////

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
                usedModel = modelNode.data;

                //draw only called model's
                /////////////////////////////////////
                if (usedModel.drawCallsNumber > 0) {
                    //use default or asociated model shader
                    newShader = shader || usedModel.shader;

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
                        if (usedShaderUniforms.camera) {
                            camera.sendToGPU(gl, usedShaderUniforms.camera);
                        }

                        //send ligths structures uniforms
                        /////////////////////////////////
                        if (usedShaderUniforms.ligths) {
                            ligthIndex = 0;
                            while (ligthNode) {
                                ligthNode.data.sendToGPU(gl, usedShaderUniforms.ligths[ligthIndex]);

                                ligthNode = ligthNode.next;
                                ligthIndex++;
                            }
                        }
                        /////////////////////////////////

                    }
                    ///////////////////////////

                    //Prepare model to use shader
                    usedModel.prepare(gl, usedShader);

                    //Draw model request's
                    usedModel.executeDrawCalls(gl, preserveDrawCalls);

                    //Disable model
                    usedModel.unprepare(gl, usedShader);
                }
                /////////////////////////////////////

                modelNode = modelNode.next;
            }
            ////////////////////////////////////////////////

            if (outputFramebuffer) {
                //disable customized framebuffer and enable default
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);

                //reconfigure to default output size
                gl.viewport(0, 0, canvas.width, canvas.height);
            }

        }
        ///////////////////////////////////////////////////////////////

    };

    //Animator class constructor and properties
    ////////////////////////////////////////////////////////////////////////////
    M3D.Animator = function () {
        let animator = this;

        this.time = 0;
        this.delta = 0;
        this.callback = null;
        this.requestID = 0;

        this.drawFrame = function () {
            let ntime;

            if (animator.callback) {

                // get current frame miliseconds time
                ntime = new Date().getTime();

                if (animator.time === 0)
                    //use initial 0 frame time
                    animator.delta = 0;
                else
                    // compute delta time
                    animator.delta = (ntime - animator.time) / 1000;

                // update new frame last time
                animator.time = ntime;

                //request a new frame
                animator.requestID = window.requestAnimationFrame(animator.drawFrame);

                //execute draw handler
                animator.callback();

            }
        };

    };

    M3D.Animator.prototype.startAnimation = function (requestCallback) {

        this.requestID = window.cancelAnimationFrame(this.requestID);
        this.callback = requestCallback;
        this.requestID = window.requestAnimationFrame(this.drawFrame);

        this.time = 0;

    };

    M3D.Animator.prototype.stopAnimation = function () {

        this.requestID = window.cancelAnimationFrame(this.requestID);
        this.time = 0;

    };

    //SoundContext class constructor and methoods
    ////////////////////////////////////////////////////////////////////////////
    M3Dp.SoundContext = {};

    M3D.SoundContext = function () {

        this.isEnable = false;
        this.audioContext = null;
        defineUneditableProperty(this, 'isWebkitContext', !!window.webkitAudioContext);
        defineUneditableProperty(this, 'soundTracks', new M3D.List());

        try {
            //create one audioContext 
            this.audioContext = new AudioContext();
            this.audioDestination = this.audioContext.destination;

            //disable audio renderer
            this.audioContext.suspend();

        } catch (error) {
            console.error('Error generating audioContex \n' + error);

        }

    };

    M3D.SoundContext.prototype.addSound = function (soundTrack) {
        if (soundTrack instanceof M3Dp.SoundTrack)
            this.soundTracks.add(soundTrack);   //add sound track to list

        return soundTrack;
    };

    M3D.SoundContext.prototype.getSound = function (name) {
        return this.soundTracks.getByName(name);
    };

    M3D.SoundContext.prototype.removeSound = function (src) {
        let soundTrack;

        //remove source sound track
        if (src instanceof M3D.SoundTrack)
            soundTrack = this.soundTracks.remove(src);
        else if (typeof src === 'string')
            soundTrack = this.soundTracks.removeByName(src);
        else
            soundTrack = null;

        return soundTrack;
    };

    M3D.SoundContext.prototype.playSound = function (src, reset) {
        let soundTrack;

        //get source sound track
        if (src instanceof M3Dp.SoundTrack)
            soundTrack = src;
        else if (typeof src === 'string')
            soundTrack = this.soundTracks.getByName(src);
        else
            soundTrack = null;

        if (soundTrack) {
            soundTrack.play(reset);  //start, restart or continue sound track resolution

            if (this.audioContext.state === 'suspended')
                this.audioContext.resume(); //resume audio context

        }
    };

    M3D.SoundContext.prototype.pauseSound = function (src) {
        let soundTrack;

        //get source sound track
        if (src instanceof M3Dp.SoundTrack)
            soundTrack = src;
        else if (typeof src === 'string')
            soundTrack = this.soundTracks.getByName(src);
        else
            soundTrack = null;

        if (soundTrack)
            soundTrack.pause(); //pause sound track resolution

    };

    M3D.SoundContext.prototype.generateSoundTrack = function (name, url, volume, hasLoop) {

        let context = this.audioContext;
        let gainNode = context.createGain();
        let soundTrack = new M3Dp.SoundTrack(name);

        //define sound track properties
        soundTrack.src = url;
        soundTrack.audioContext = context;
        soundTrack.gainNode = gainNode;
        soundTrack.setVolume(volume);
        soundTrack.hasLoop = !!hasLoop;

        //load and decode data
        M3Dp.getSoundBufferData(context, soundTrack);

        return soundTrack;
    };

    M3D.SoundContext.prototype.generateSoundPool = function (name, url, volume) {

        let context = this.audioContext;
        let gainNode = context.createGain();
        let soundPool = new M3Dp.SoundPool(name);

        //define sound pool properties
        soundPool.src = url;
        soundPool.audioContext = context;
        soundPool.gainNode = gainNode;
        soundPool.setVolume(volume);

        //load and decode data
        M3Dp.getSoundBufferData(context, soundPool);

        return soundPool;
    };

    M3Dp.getSoundBufferData = function (context, soundTrack) {

        //load source data stream
        let xhr = new XMLHttpRequest();
        xhr.open('GET', soundTrack.src, true);
        xhr.onload = function () {
            let stream = this.response;

            //decode data of stream to formated Float32Array
            context.decodeAudioData(stream, function (decodedDataBuffer) {
                console.log('Decoded media source data at URL: ' + soundTrack.src);

                //store source buffer and connect
                soundTrack.sourceBuffer = decodedDataBuffer;
                soundTrack.gainNode.connect(context.destination);

                //start audio if need
                if (soundTrack.playing)
                    soundTrack.play();

            }, function (err) {
                console.log('Error decoding source audio at URL: ' + soundTrack.src + '\n' + err);

            });

        };
        xhr.onerror = function (err) {
            console.error('Error loading media source data at URL: ' + soundTrack.src + '\n' + err);

        };
        xhr.responseType = 'arraybuffer';
        xhr.send(null);

    };

    //SounTrack constructor and properties
    ////////////////////////////////////////////////////////////////////////////
    M3Dp.SoundTrack = function (name) {

        this.name = name;
        this.src = null;

        this.audioContext = null;
        this.sourceBuffer = null;
        this.gainNode = null;

        this.time = 0;
        this.offset = 0;

        this.playing = false;
        this.hasLoop = false;

    };

    M3Dp.SoundTrack.prototype.setVolume = function (volume) {
        let gain = this.gainNode.gain;

        gain.value = volume / 100;

    };

    M3Dp.SoundTrack.prototype.play = function (reset) {
        let self = this;

        //set play state
        this.playing = true;

        if (!this.mediaNode && !!this.sourceBuffer) {
            this.time = this.audioContext.currentTime;

            //create a new source audio buffer node
            this.mediaNode = this.audioContext.createBufferSource();

            //configure source audio buffer node
            this.mediaNode.buffer = this.sourceBuffer;
            this.mediaNode.onended = function (event) {
                let mediaNode = event.target;

                //disconnect source audio buffer node
                mediaNode.disconnect();

                //reset track state when current buffer finish
                if (self.mediaNode === mediaNode) {
                    self.mediaNode = null;
                    self.offset = 0;

                    if (self.hasLoop)
                        //replay audio stream on loop
                        self.play();
                    else
                        //reset state if finish audio stream
                        self.playing = false;

                }

            };

            //reset source audio buffer offset played
            reset && (this.offset = 0);

            //connect and play a source audio buffer node
            this.mediaNode.connect(this.gainNode);
            this.mediaNode.start(this.time, this.offset);

        }

    };

    M3Dp.SoundTrack.prototype.pause = function () {
        let time = this.audioContext.currentTime;

        //disable play state
        this.playing = false;

        if (this.mediaNode) {

            //save state values
            this.offset += time - this.time;
            this.time = time;

            //stop source audio buffer node
            this.mediaNode.stop();
            this.mediaNode = null;

        }
    };

    //SoundPool class constructor and properties
    ////////////////////////////////////////////////////////////////////////////
    M3Dp.SoundPool = function (name) {

        this.name = name;
        this.src = null;

        this.audioContext = null;
        this.sourceBuffer = null;
        this.gainNode = null;

        this.instances = new M3D.List();

    };

    M3Dp.SoundPool.prototype = Object.create(M3Dp.SoundTrack.prototype);

    M3Dp.SoundPool.prototype.setVolume = function (volume) {
        let gain = this.gainNode.gain;

        gain.value = volume / 100;

    };

    M3Dp.SoundPool.prototype.play = function () {
        let mediaInstanceNode;
        let instances = this.instances;

        if (this.sourceBuffer) {

            //create one new source audio buffer node
            mediaInstanceNode = this.audioContext.createBufferSource();

            //configure source audio buffer node
            mediaInstanceNode.buffer = this.sourceBuffer;
            mediaInstanceNode.listNode = new M3D.Node(mediaInstanceNode);
            mediaInstanceNode.onended = function (event) {
                let mediaNode = event.target;
                mediaNode.disconnect();                     //discnnect buffer node from audio context
                instances.removeNode(mediaNode.listNode);   //remove buffer node from instances list

            };

            //connect and play source audio buffer node
            mediaInstanceNode.connect(this.gainNode);
            mediaInstanceNode.start(0);
            instances.addNode(mediaInstanceNode.listNode);

        }

    };

    M3Dp.SoundPool.prototype.pause = function () {
        let listNode = this.instances.head;

        //stop all source audio instances
        while (listNode) {
            listNode.data.stop();
            listNode = listNode.next;

        }

    };

    //Window functionalities Polyfills
    ////////////////////////////////////////////////////////////////
    window.AudioContext = window.AudioContext || window.webkitAudioContext;

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

})();
