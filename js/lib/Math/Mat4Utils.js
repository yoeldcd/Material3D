
/*  @author Yoel david Correa Duke
 *  @version 1.0.0
 *  @date 10/7/2020
 *  
 *  This module have a one group of methoods to manipulate 
 *  matrix of 4x4 components, to use in WebGL applications. 
 *  All matrix used is store on Float32Array data format. 
 *  Not is used a bi-dimenssional matrixs in search of fast
 *  execution times. This is optimized for game development
 *  and real time rendering.
 *  
 */

var mat4 = new (function () {

    var stack = new Array(100);
    var stackTop = null;
    var stackSize = 100;
    var stackUsed = 0;

    //initialize stack slots
    for (var i = 0; i < 100; i++) {
        stack[i] = new Float32Array();
    }

    var r00, r01, r02, r03;
    var r10, r11, r12, r13;
    var r20, r21, r22, r23;
    var r30, r31, r32, r33;
    var s, c, d;

    var inversev, fv;

    var vx, vy, vz, length;

    var vecIn = new Float32Array(3);
    var vecAt = new Float32Array(3);
    var vecUp = new Float32Array(3);
    var vecX = new Float32Array(3);
    var vecY = new Float32Array(3);
    var vecZ = new Float32Array(3);

    var sin = Math.sin;
    var cos = Math.cos;
    var tan = Math.tan;
    var sqrt = Math.sqrt;
    var PI = Math.PI;

    var identity = new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]);


    this.makeMat4 = function (numArray) {
        return new Float32Array(numArray ? numArray : identity);
    };

    this.loadIdentity = function (dst) {

        dst[0] = 1;
        dst[1] = 0;
        dst[2] = 0;
        dst[3] = 0;

        dst[4] = 0;
        dst[5] = 1;
        dst[6] = 0;
        dst[7] = 0;

        dst[8] = 0;
        dst[9] = 0;
        dst[10] = 1;
        dst[11] = 0;

        dst[12] = 0;
        dst[13] = 0;
        dst[14] = 0;
        dst[15] = 1;

        return dst;
    };

    this.transpose = function (mat, dst) {
        if (mat) {

            //make traspose
            r01 = mat[4];
            r02 = mat[8];
            r03 = mat[12];

            r10 = mat[1];
            r12 = mat[9];
            r13 = mat[13];

            r20 = mat[2];
            r21 = mat[6];
            r23 = mat[14];

            r30 = mat[3];
            r31 = mat[7];
            r32 = mat[11];

            //define destination matrix
            dst || (dst = mat);

            //save transpose
            dst[0] = mat[0];
            dst[1] = r01;
            dst[2] = r02;
            dst[3] = r03;

            dst[4] = r10;
            dst[5] = mat[5];
            dst[6] = r12;
            dst[7] = r13;

            dst[8] = r20;
            dst[9] = r21;
            dst[10] = mat[10];
            dst[11] = r23;

            dst[12] = r30;
            dst[13] = r31;
            dst[14] = r32;
            dst[15] = mat[15];
        }

        return dst;
    };

    this.det = function (mat) {

        //  0  1  2  3
        //  4  5  6  7
        //  8  9  10 11
        //  12 13 14 15

        if (mat) {
            d = mat[0] * mat[5] * mat[10] * mat[15]
                    + mat[1] * mat[6] * mat[11] * mat[12]
                    + mat[2] * mat[7] * mat[8] * mat[13]
                    + mat[3] * mat[4] * mat[9] * mat[14]
                    - mat[12] * mat[9] * mat[6] * mat[3]
                    - mat[13] * mat[10] * mat[7] * mat[0]
                    - mat[14] * mat[11] * mat[4] * mat[1]
                    - mat[15] * mat[8] * mat[5] * mat[2];
        } else {
            d = 0;
        }

        return d;
    };

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

    this.cofactor = function (mat) {

        if (mat) {

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
             * r00 r01 r02 r03  # ### ### ###  
             * r10 r11 r12 r13  # r11 r12 r13
             * r20 r21 r22 r23  # r21 r22 r13
             * r30 r31 r32 r33  # r31 r32 r33
             */

            mat[0] = detMat3(r11, r12, r13, r21, r22, r23, r31, r32, r33);
            mat[1] = -detMat3(r10, r12, r13, r20, r22, r23, r30, r32, r33);
            mat[2] = detMat3(r10, r11, r13, r20, r21, r23, r30, r31, r33);
            mat[3] = -detMat3(r10, r11, r12, r20, r21, r22, r30, r31, r32);

            mat[4] = -detMat3(r01, r02, r03, r21, r22, r23, r31, r32, r33);
            mat[5] = detMat3(r00, r02, r03, r20, r22, r23, r30, r32, r33);
            mat[6] = -detMat3(r00, r01, r03, r20, r21, r23, r30, r31, r33);
            mat[7] = detMat3(r00, r01, r02, r20, r21, r22, r30, r31, r32);

            mat[8] = detMat3(r01, r02, r03, r11, r12, r13, r31, r32, r33);
            mat[9] = -detMat3(r00, r02, r03, r10, r12, r13, r30, r32, r33);
            mat[10] = detMat3(r00, r01, r03, r10, r11, r13, r30, r31, r33);
            mat[11] = -detMat3(r00, r01, r02, r10, r11, r12, r30, r31, r32);

            mat[12] = -detMat3(r01, r02, r03, r11, r12, r13, r21, r22, r23);
            mat[13] = detMat3(r00, r02, r03, r10, r12, r13, r20, r22, r23);
            mat[14] = -detMat3(r00, r01, r03, r10, r11, r13, r20, r21, r23);
            mat[15] = detMat3(r00, r01, r02, r10, r11, r12, r20, r21, r22);

        }

        return mat;
    };

    this.adjunte = function (mat) {

        if (mat) {

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

            //store transposed cofactors
            mat[0] = detMat3(r11, r12, r13, r21, r22, r23, r31, r32, r33);
            mat[4] = -detMat3(r10, r12, r13, r20, r22, r23, r30, r32, r33);
            mat[8] = detMat3(r10, r11, r13, r20, r21, r23, r30, r31, r33);
            mat[12] = -detMat3(r10, r11, r12, r20, r21, r22, r30, r31, r32);

            mat[1] = -detMat3(r01, r02, r03, r21, r22, r23, r31, r32, r33);
            mat[5] = detMat3(r00, r02, r03, r20, r22, r23, r30, r32, r33);
            mat[9] = -detMat3(r00, r01, r03, r20, r21, r23, r30, r31, r33);
            mat[13] = detMat3(r00, r01, r02, r20, r21, r22, r30, r31, r32);

            mat[2] = detMat3(r01, r02, r03, r11, r12, r13, r31, r32, r33);
            mat[6] = -detMat3(r00, r02, r03, r10, r12, r13, r30, r32, r33);
            mat[10] = detMat3(r00, r01, r03, r10, r11, r13, r30, r31, r33);
            mat[14] = -detMat3(r00, r01, r02, r10, r11, r12, r30, r31, r32);

            mat[3] = -detMat3(r01, r02, r03, r11, r12, r13, r21, r22, r23);
            mat[7] = detMat3(r00, r02, r03, r10, r12, r13, r20, r22, r23);
            mat[11] = -detMat3(r00, r01, r03, r10, r11, r13, r20, r21, r23);
            mat[15] = detMat3(r00, r01, r02, r10, r11, r12, r20, r21, r22);

        }

        return mat;
    };

    this.inverse = function (mat) {
        if (mat) {
            d = this.det(mat);

            if (d !== 0) {

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
                mat[0] = detMat3(r11, r12, r13, r21, r22, r23, r31, r32, r33) / d;
                mat[4] = -detMat3(r10, r12, r13, r20, r22, r23, r30, r32, r33) / d;
                mat[8] = detMat3(r10, r11, r13, r20, r21, r23, r30, r31, r33) / d;
                mat[12] = -detMat3(r10, r11, r12, r20, r21, r22, r30, r31, r32) / d;

                //row 1
                mat[1] = -detMat3(r01, r02, r03, r21, r22, r23, r31, r32, r33) / d;
                mat[5] = detMat3(r00, r02, r03, r20, r22, r23, r30, r32, r33) / d;
                mat[9] = -detMat3(r00, r01, r03, r20, r21, r23, r30, r31, r33) / d;
                mat[13] = detMat3(r00, r01, r02, r20, r21, r22, r30, r31, r32) / d;

                //row 2
                mat[2] = detMat3(r01, r02, r03, r11, r12, r13, r31, r32, r33) / d;
                mat[6] = -detMat3(r00, r02, r03, r10, r12, r13, r30, r32, r33) / d;
                mat[10] = detMat3(r00, r01, r03, r10, r11, r13, r30, r31, r33) / d;
                mat[14] = -detMat3(r00, r01, r02, r10, r11, r12, r30, r31, r32) / d;

                //row 3
                mat[3] = -detMat3(r01, r02, r03, r11, r12, r13, r21, r22, r23) / d;
                mat[7] = detMat3(r00, r02, r03, r10, r12, r13, r20, r22, r23) / d;
                mat[11] = -detMat3(r00, r01, r03, r10, r11, r13, r20, r21, r23) / d;
                mat[15] = detMat3(r00, r01, r02, r10, r11, r12, r20, r21, r22) / d;

            }
        }

        return mat;
    };


    this.multiply = function (mat1, mat2, dst) {

        if (mat1 && mat2) {

            //row 1
            r00 = mat1[0] * mat2[0] + mat1[1] * mat2[4] + mat1[2] * mat2[8] + mat1[3] * mat2[12];
            r01 = mat1[0] * mat2[1] + mat1[1] * mat2[5] + mat1[2] * mat2[9] + mat1[3] * mat2[13];
            r02 = mat1[0] * mat2[2] + mat1[1] * mat2[6] + mat1[2] * mat2[10] + mat1[3] * mat2[14];
            r03 = mat1[0] * mat2[3] + mat1[1] * mat2[7] + mat1[2] * mat2[11] + mat1[3] * mat2[15];

            //row 2
            r10 = mat1[4] * mat2[0] + mat1[5] * mat2[4] + mat1[6] * mat2[8] + mat1[7] * mat2[12];
            r11 = mat1[4] * mat2[1] + mat1[5] * mat2[5] + mat1[6] * mat2[9] + mat1[7] * mat2[13];
            r12 = mat1[4] * mat2[2] + mat1[5] * mat2[6] + mat1[6] * mat2[10] + mat1[7] * mat2[14];
            r13 = mat1[4] * mat2[3] + mat1[5] * mat2[7] + mat1[6] * mat2[11] + mat1[7] * mat2[15];

            //row 3
            r20 = mat1[8] * mat2[0] + mat1[9] * mat2[4] + mat1[10] * mat2[8] + mat1[11] * mat2[12];
            r21 = mat1[8] * mat2[1] + mat1[9] * mat2[5] + mat1[10] * mat2[9] + mat1[11] * mat2[13];
            r22 = mat1[8] * mat2[2] + mat1[9] * mat2[6] + mat1[10] * mat2[10] + mat1[11] * mat2[14];
            r23 = mat1[8] * mat2[3] + mat1[9] * mat2[7] + mat1[10] * mat2[11] + mat1[11] * mat2[15];

            //row 4
            r30 = mat1[12] * mat2[0] + mat1[13] * mat2[4] + mat1[14] * mat2[8] + mat1[15] * mat2[12];
            r31 = mat1[12] * mat2[1] + mat1[13] * mat2[5] + mat1[14] * mat2[9] + mat1[15] * mat2[13];
            r32 = mat1[12] * mat2[2] + mat1[13] * mat2[6] + mat1[14] * mat2[10] + mat1[15] * mat2[14];
            r33 = mat1[12] * mat2[3] + mat1[13] * mat2[7] + mat1[14] * mat2[11] + mat1[15] * mat2[15];

            //defien destination matrix
            dst || (dst = mat1);

            //save result
            dst[0] = r00;
            dst[1] = r01;
            dst[2] = r02;
            dst[3] = r03;

            dst[4] = r10;
            dst[5] = r11;
            dst[6] = r12;
            dst[7] = r13;

            dst[8] = r20;
            dst[9] = r21;
            dst[10] = r22;
            dst[11] = r23;

            dst[12] = r30;
            dst[13] = r31;
            dst[14] = r32;
            dst[15] = r33;
        }

        return dst;
    };

    this.multiplyTranspose = function (mat1, mat2, dst) {

        if (mat1 && mat2) {
            //row 1
            r00 = mat1[0] * mat2[0] + mat1[1] * mat2[1] + mat1[2] * mat2[2] + mat1[3] * mat2[3];
            r01 = mat1[0] * mat2[4] + mat1[1] * mat2[5] + mat1[2] * mat2[6] + mat1[3] * mat2[7];
            r02 = mat1[0] * mat2[8] + mat1[1] * mat2[9] + mat1[2] * mat2[10] + mat1[3] * mat2[11];
            r03 = mat1[0] * mat2[12] + mat1[1] * mat2[13] + mat1[2] * mat2[14] + mat1[3] * mat2[15];

            //row 2
            r10 = mat1[4] * mat2[0] + mat1[5] * mat2[1] + mat1[6] * mat2[2] + mat1[7] * mat2[3];
            r11 = mat1[4] * mat2[4] + mat1[5] * mat2[5] + mat1[6] * mat2[6] + mat1[7] * mat2[7];
            r12 = mat1[4] * mat2[8] + mat1[5] * mat2[9] + mat1[6] * mat2[10] + mat1[7] * mat2[11];
            r13 = mat1[4] * mat2[12] + mat1[5] * mat2[13] + mat1[6] * mat2[14] + mat1[7] * mat2[15];

            //row 3
            r20 = mat1[8] * mat2[0] + mat1[9] * mat2[1] + mat1[10] * mat2[2] + mat1[11] * mat2[3];
            r21 = mat1[8] * mat2[4] + mat1[9] * mat2[5] + mat1[10] * mat2[6] + mat1[11] * mat2[7];
            r22 = mat1[8] * mat2[8] + mat1[9] * mat2[9] + mat1[10] * mat2[10] + mat1[11] * mat2[11];
            r23 = mat1[8] * mat2[12] + mat1[9] * mat2[13] + mat1[10] * mat2[14] + mat1[11] * mat2[15];

            //row 4
            r30 = mat1[12] * mat2[0] + mat1[13] * mat2[4] + mat1[14] * mat2[2] + mat1[15] * mat2[3];
            r31 = mat1[12] * mat2[4] + mat1[13] * mat2[5] + mat1[14] * mat2[6] + mat1[15] * mat2[7];
            r32 = mat1[12] * mat2[8] + mat1[13] * mat2[6] + mat1[14] * mat2[10] + mat1[15] * mat2[11];
            r33 = mat1[12] * mat2[12] + mat1[13] * mat2[7] + mat1[14] * mat2[14] + mat1[15] * mat2[15];

            //defien destination matrix
            dst || (dst = mat1);

            //save result
            dst[0] = r00;
            dst[1] = r01;
            dst[2] = r02;
            dst[3] = r03;

            dst[4] = r10;
            dst[5] = r11;
            dst[6] = r12;
            dst[7] = r13;

            dst[8] = r20;
            dst[9] = r21;
            dst[10] = r22;
            dst[11] = r23;

            dst[12] = r30;
            dst[13] = r31;
            dst[14] = r32;
            dst[15] = r33;
        }

        return dst;
    };

    this.multiplyScalar = function (mat, scalar, dst) {

        scalar || (scalar = 0);

        if (dst) {

            dst[0] = mat[0] * scalar;
            dst[1] = mat[1] * scalar;
            dst[2] = mat[2] * scalar;
            dst[3] = mat[3] * scalar;

            dst[4] = mat[4] * scalar;
            dst[5] = mat[5] * scalar;
            dst[6] = mat[6] * scalar;
            dst[7] = mat[7] * scalar;

            dst[8] = mat[8] * scalar;
            dst[9] = mat[9] * scalar;
            dst[10] = mat[10] * scalar;
            dst[11] = mat[11] * scalar;

            dst[12] = mat[12] * scalar;
            dst[13] = mat[13] * scalar;
            dst[14] = mat[14] * scalar;
            dst[15] = mat[15] * scalar;

        } else {
            dst = mat;

            dst[0] *= scalar;
            dst[1] *= scalar;
            dst[2] *= scalar;
            dst[3] *= scalar;

            dst[4] *= scalar;
            dst[5] *= scalar;
            dst[6] *= scalar;
            dst[7] *= scalar;

            dst[8] *= scalar;
            dst[9] *= scalar;
            dst[10] *= scalar;
            dst[11] *= scalar;

            dst[12] *= scalar;
            dst[13] *= scalar;
            dst[14] *= scalar;
            dst[15] *= scalar;

        }

        return dst;
    };

    this.translate = function (mat, tx, ty, tz) {

        if (mat) {
            tx !== undefined ? mat[12] += tx : 0;
            ty !== undefined ? mat[13] += ty : 0;
            tz !== undefined ? mat[14] += tz : 0;
        }

        return mat;
    };

    this.scale = function (mat, sx, sy, sz) {

        if (mat) {

            mat[0] *= sx;
            mat[1] *= sy;
            mat[2] *= sz;

            mat[4] *= sx;
            mat[5] *= sy;
            mat[6] *= sz;

            mat[8] *= sx;
            mat[9] *= sy;
            mat[10] *= sz;

            mat[12] *= sx;
            mat[13] *= sy;
            mat[14] *= sz;

        }

        return mat;
    };

    this.rotateX = function (mat, alpha, isRadian) {
        if (mat && alpha) {

            isRadian || (alpha = alpha / 180 * PI);
            s = sin(alpha);
            c = cos(alpha);

            /* 1 0  0 0
             * 0 c -s 0
             * 0 s  c 0
             * 0 0  0 1 */

            r01 = mat[1] * c + mat[2] * s;
            r02 = -mat[1] * s + mat[2] * c;
            r11 = mat[5] * c + mat[6] * s;
            r12 = -mat[5] * s + mat[6] * c;
            r21 = mat[9] * c + mat[10] * s;
            r22 = -mat[9] * s + mat[10] * c;
            r31 = mat[13] * c + mat[14] * s;
            r32 = -mat[13] * s + mat[14] * c;

            mat[1] = r01;
            mat[2] = r02;
            mat[5] = r11;
            mat[6] = r12;
            mat[9] = r21;
            mat[10] = r22;
            mat[13] = r31;
            mat[14] = r32;

        }

        return mat;
    };
    
    this.rotateAxisX = function (mat, alpha, isRadian) {
        if (mat && alpha) {

            isRadian || (alpha = alpha / 180 * PI);
            s = sin(alpha);
            c = cos(alpha);

            /* 1 0  0 0
             * 0 c -s 0
             * 0 s  c 0
             * 0 0  0 1 */

            r01 = mat[1] * c + mat[2] * s;
            r02 = -mat[1] * s + mat[2] * c;
            r11 = mat[5] * c + mat[6] * s;
            r12 = -mat[5] * s + mat[6] * c;
            r21 = mat[9] * c + mat[10] * s;
            r22 = -mat[9] * s + mat[10] * c;

            mat[1] = r01;
            mat[2] = r02;
            mat[5] = r11;
            mat[6] = r12;
            mat[9] = r21;
            mat[10] = r22;

        }

        return mat;
    };
    
    this.rotateAroundX = function (mat, alpha, isRadian) {
        if (mat && alpha) {

            isRadian || (alpha = alpha / 180 * PI);
            s = sin(alpha);
            c = cos(alpha);

            r31 = mat[13] * c + mat[14] * s;
            r32 = -mat[13] * s + mat[14] * c;

            mat[13] = r31;
            mat[14] = r32;

        }

        return mat;
    };

    this.rotateY = function (mat, beta, isRadian) {
        if (mat && beta) {

            isRadian || (beta = beta / 180 * PI);
            s = sin(beta);
            c = cos(beta);

            /*  c 0 s 0
             *  0 1 0 0
             * -s 0 c 0
             *  0 0 0 1 */

            r00 = mat[0] * c - mat[2] * s;
            r02 = mat[0] * s + mat[2] * c;
            r10 = mat[4] * c - mat[6] * s;
            r12 = mat[4] * s + mat[6] * c;
            r20 = mat[8] * c - mat[10] * s;
            r22 = mat[8] * s + mat[10] * c;
            r30 = mat[12] * c - mat[14] * s;
            r32 = mat[12] * s + mat[14] * c;

            mat[0] = r00;
            mat[2] = r02;
            mat[4] = r10;
            mat[6] = r12;
            mat[8] = r20;
            mat[10] = r22;
            mat[12] = r30;
            mat[14] = r32;

        }

        return mat;
    };

    this.rotateAxisY = function (mat, beta, isRadian) {
        if (mat && beta) {

            isRadian || (beta = beta / 180 * PI);
            s = sin(beta);
            c = cos(beta);

            /*  c 0 s 0
             *  0 1 0 0
             * -s 0 c 0
             *  0 0 0 1 */

            r00 = mat[0] * c - mat[2] * s;
            r02 = mat[0] * s + mat[2] * c;
            r10 = mat[4] * c - mat[6] * s;
            r12 = mat[4] * s + mat[6] * c;
            r20 = mat[8] * c - mat[10] * s;
            r22 = mat[8] * s + mat[10] * c;

            mat[0] = r00;
            mat[2] = r02;
            mat[4] = r10;
            mat[6] = r12;
            mat[8] = r20;
            mat[10] = r22;

        }

        return mat;
    };

    this.rotateAroundY = function (mat, beta, isRadian) {
        if (mat && beta) {

            isRadian || (beta = beta / 180 * PI);
            s = sin(beta);
            c = cos(beta);

            r30 = mat[12] * c - mat[14] * s;
            r32 = mat[12] * s + mat[14] * c;

            mat[12] = r30;
            mat[14] = r32;

        }

        return mat;
    };

    this.rotateZ = function (mat, omega, isRadian) {
        if (mat && omega) {

            isRadian || (omega = omega / 180 * PI);
            s = sin(omega);
            c = cos(omega);

            /* c -s 0 0
             * s  c 0 0
             * 0  0 1 0
             * 0  0 0 1 */


            //precalculated matrix product
            r00 = mat[0] * c + mat[1] * s;
            r01 = -mat[0] * s + mat[1] * c;
            r10 = mat[4] * c + mat[5] * s;
            r11 = -mat[4] * s + mat[5] * c;
            r20 = mat[8] * c + mat[9] * s;
            r21 = -mat[8] * s + mat[9] * c;
            r30 = mat[12] * c + mat[13] * s;
            r31 = -mat[12] * s + mat[13] * c;

            mat[0] = r00;
            mat[1] = r01;
            mat[4] = r10;
            mat[5] = r11;
            mat[8] = r20;
            mat[9] = r21;
            mat[12] = r30;
            mat[13] = r31;

        }

        return mat;
    };

    this.rotateAxisZ = function (mat, omega, isRadian) {
        if (mat && omega) {

            isRadian || (omega = omega / 180 * PI);
            s = sin(omega);
            c = cos(omega);

            /* c -s 0 0
             * s  c 0 0
             * 0  0 1 0
             * 0  0 0 1 */


            //precalculated matrix product
            r00 = mat[0] * c + mat[1] * s;
            r01 = -mat[0] * s + mat[1] * c;
            r10 = mat[4] * c + mat[5] * s;
            r11 = -mat[4] * s + mat[5] * c;
            r20 = mat[8] * c + mat[9] * s;
            r21 = -mat[8] * s + mat[9] * c;

            mat[1] = r00;
            mat[2] = r01;
            mat[5] = r10;
            mat[6] = r11;
            mat[9] = r20;
            mat[10] = r21;

        }

        return mat;
    };
    
    this.rotateAroundZ = function (mat, omega, isRadian) {
        if (mat && omega) {

            isRadian || (omega = omega / 180 * PI);
            s = sin(omega);
            c = cos(omega);

            r30 = mat[12] * c + mat[13] * s;
            r31 = -mat[12] * s + mat[13] * c;

            mat[12] = r30;
            mat[13] = r31;

        }

        return mat;
    };

    this.project = function (mat, fieldOfView, isRadian, ratio, znear, zfar) {

        isRadian || (fieldOfView = fieldOfView / 180 * PI);

        fv = 1.0 / tan(fieldOfView / 2);
        inversev = 1 / (znear - zfar);

        /*
         f / ratio, 0, 0, 0,
         0, f, 0, 0,
         0, 0, (near + far) * inverse, -1, 
         0, 0, (near * far * inverse * 2), 0
         ;*/

        mat[0] = fv / ratio;
        mat[1] = 0;
        mat[2] = 0;
        mat[3] = 0;

        mat[4] = 0;
        mat[5] = fv;
        mat[6] = 0;
        mat[7] = 0;

        mat[8] = 0;
        mat[9] = 0;
        mat[10] = (zfar + znear) * inversev;
        mat[11] = -1;

        mat[12] = 0;
        mat[13] = 0;
        mat[14] = (zfar * znear * inversev * 2);
        mat[15] = 0;

        return mat;
    };

    function normalizedVec3(vec, dst) {
        length = sqrt(vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2]);

        if (length !== 0) {
            dst || (dst = vec);

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

    this.loockAt = function (mat, x, y, z, atx, aty, atz, upx, upy, upz) {

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

        /*mat = [
         vecX[0], vecX[1], vecX[2], 0,
         vecY[0], vecY[1], vecY[2], 0,
         vecZ[0], vecZ[1], vecZ[2], 0,
         x, y, z, 1
         ];*/

        mat[0] = vecX[0];
        mat[1] = vecX[1];
        mat[2] = vecX[2];
        mat[3] = 0;

        mat[4] = vecY[0];
        mat[5] = vecY[1];
        mat[6] = vecY[2];
        mat[7] = 0;

        mat[8] = vecZ[0];
        mat[9] = vecZ[1];
        mat[10] = vecZ[2];
        mat[11] = 0;

        mat[12] = x;
        mat[13] = y;
        mat[14] = z;
        mat[15] = 1;

        return mat;
    };

    this.cameraMat4 = function (mat, x, y, z, atx, aty, atz, upx, upy, upz) {
        this.loockAt(mat, x, y, z, atx, aty, atz, upx, upy, upz);
        this.inverse(mat);
        return mat;
    };

    this.push = function (mat) {

        if (mat) {
            stackUsed < stackSize || (stack[stackSize] = new Float32Array(16));
            stackTop = stack[stackUsed];

            stackTop[0] = mat[0];
            stackTop[1] = mat[1];
            stackTop[2] = mat[2];
            stackTop[3] = mat[3];

            stackTop[4] = mat[4];
            stackTop[5] = mat[5];
            stackTop[6] = mat[6];
            stackTop[7] = mat[7];

            stackTop[8] = mat[8];
            stackTop[9] = mat[9];
            stackTop[10] = mat[10];
            stackTop[11] = mat[11];

            stackTop[12] = mat[12];
            stackTop[13] = mat[13];
            stackTop[14] = mat[14];
            stackTop[15] = mat[15];

            stackUsed++;
        }

        return mat;
    };

    this.pop = function (mat) {

        if (mat) {
            stackTop = stackUsed >= 0 ? stack[stackUsed] : identity;

            mat[0] = stackTop[0];
            mat[1] = stackTop[1];
            mat[2] = stackTop[2];
            mat[3] = stackTop[3];

            mat[4] = stackTop[4];
            mat[5] = stackTop[5];
            mat[6] = stackTop[6];
            mat[7] = stackTop[7];

            mat[8] = stackTop[8];
            mat[9] = stackTop[9];
            mat[10] = stackTop[10];
            mat[11] = stackTop[11];

            mat[12] = stackTop[12];
            mat[13] = stackTop[13];
            mat[14] = stackTop[14];
            mat[15] = stackTop[15];

            stackUsed--;
        }

        return mat;
    };

    this.copy = function (mat, dst, output) {

        if (mat & dst) {

            dst[0] = mat[0];
            dst[1] = mat[1];
            dst[2] = mat[2];
            dst[3] = mat[3];

            dst[4] = mat[4];
            dst[5] = mat[5];
            dst[6] = mat[6];
            dst[7] = mat[7];

            dst[8] = mat[8];
            dst[9] = mat[9];
            dst[10] = mat[10];
            dst[11] = mat[11];

            dst[12] = mat[12];
            dst[13] = mat[13];
            dst[14] = mat[14];
            dst[15] = mat[15];

        }

        return output ? mat : dst;
    };

    return this;
})();
