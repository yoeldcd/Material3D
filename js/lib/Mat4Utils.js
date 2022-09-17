
/*
 *	This script contain a optimized functions to work with
 *	matrixs of 4 x 4 dimensions, useds in graphics generation
 *	using Web GL on HTML5. All functions work witch Arrays in
 *	Float32Array() format of JavaScript, and require 9 or 16 
 *	components in case of mat3 and mat4 sucesivously.
 */

var mat4 = new Object();

mat4.old = new Object();	//This Object contain initials unoptimized functions by work of matrix of 4x4

/* Used instead varys on matrix operations         
 defined to optimize a time of functions calls.  */
var r00, r01, r02, r03;
var r10, r11, r12, r13;
var r20, r21, r22, r23;
var r30, r31, r32, r33;
var s;
var c;

/**/
mat4.debug = false;

/**/
mat4.matrixStack = new Array(20);

/**/
mat4.matrixStackedCount = 0;

/**/
mat4.createMat4 = function () {
    return new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]);
};

//utilizable matrix for operations
mat4.utilMatrix0 = mat4.createMat4();
mat4.utilMatrix1 = mat4.createMat4();
mat4.utilMatrix2 = mat4.createMat4();
mat4.utilMatrix3 = mat4.createMat4();
mat4.utilMatrix4 = mat4.createMat4();
mat4.utilMatrix5 = mat4.createMat4();
mat4.utilMatrix6 = mat4.createMat4();
mat4.utilMatrix7 = mat4.createMat4();
mat4.utilMatrix8 = mat4.createMat4();
mat4.utilMatrix9 = mat4.createMat4();
mat4.matrixIdentity = new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
]);

/**/
mat4.clone = function (mat) {
    return new Float32Array(mat);
};

/**/
mat4.createMat4ByMat3 = function (matrix) {
    return new Float32Array([
        matrix[0], matrix[1], matrix[2], 0,
        matrix[3], matrix[4], matrix[5], 0,
        matrix[6], matrix[7], matrix[8], 0,
        0, 0, 0, 1
    ]);
};

/**/
mat4.copyMat4 = function (mat, mat_src) {
    mat[0] = mat_src[0];
    mat[1] = mat_src[1];
    mat[2] = mat_src[2];
    mat[3] = mat_src[3];
    mat[4] = mat_src[4];
    mat[5] = mat_src[5];
    mat[6] = mat_src[6];
    mat[7] = mat_src[7];
    mat[8] = mat_src[8];
    mat[9] = mat_src[9];
    mat[10] = mat_src[10];
    mat[11] = mat_src[11];
    mat[12] = mat_src[12];
    mat[13] = mat_src[13];
    mat[14] = mat_src[14];
    mat[15] = mat_src[15];
};

/**/
mat4.loadIdentity = function (mat) {
    mat[0] = 1;
    mat[1] = 0;
    mat[2] = 0;
    mat[3] = 0;
    mat[4] = 0;
    mat[5] = 1;
    mat[6] = 0;
    mat[7] = 0;
    mat[8] = 0;
    mat[9] = 0;
    mat[10] = 1;
    mat[11] = 0;
    mat[12] = 0;
    mat[13] = 0;
    mat[14] = 0;
    mat[15] = 1;
};

/**/
mat4.isIdentity = function (mat) {
    var response = true;

    response && (response &= mat[0] === 1);
    response && (response &= mat[1] === 0);
    response && (response &= mat[2] === 0);
    response && (response &= mat[3] === 0);

    response && (response &= mat[4] === 0);
    response && (response &= mat[5] === 1);
    response && (response &= mat[6] === 0);
    response && (response &= mat[7] === 0);

    response && (response &= mat[8] === 0);
    response && (response &= mat[9] === 0);
    response && (response &= mat[10] === 1);
    response && (response &= mat[11] === 0);

    response && (response &= mat[12] === 0);
    response && (response &= mat[13] === 0);
    response && (response &= mat[14] === 0);
    response && (response &= mat[15] === 1);


    return response;
};

/**/
mat4.multiplyByScalar = function (mat, scalar) {
    mat[0] *= scalar;
    mat[1] *= scalar;
    mat[2] *= scalar;
    mat[3] *= scalar;
    mat[4] *= scalar;
    mat[5] *= scalar;
    mat[6] *= scalar;
    mat[7] *= scalar;
    mat[8] *= scalar;
    mat[9] *= scalar;
    mat[10] *= scalar;
    mat[11] *= scalar;
    mat[12] *= scalar;
    mat[13] *= scalar;
    mat[14] *= scalar;
    mat[15] *= scalar;
};

/**/
mat4.multiply = function (dst, mat1, mat2) {

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

};

/**/
mat4.multiplyByMat4 = function (mat1, mat2) {

    /*
     0,   1,  2,  3,
     4,   5,  6,  7,
     8,   9,  10, 11,
     12,  13, 14, 15    
     >>>>>>>>>>>>>>>
     0,   1,  2,  3,
     4,   5,  6,  7,
     8,   9,  10, 11,
     12,  13, 14, 15    
     */

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

    //saving a matrix
    mat1[0] = r00;
    mat1[1] = r01;
    mat1[2] = r02;
    mat1[3] = r03;
    mat1[4] = r10;
    mat1[5] = r11;
    mat1[6] = r12;
    mat1[7] = r13;
    mat1[8] = r20;
    mat1[9] = r21;
    mat1[10] = r22;
    mat1[11] = r23;
    mat1[12] = r30;
    mat1[13] = r31;
    mat1[14] = r32;
    mat1[15] = r33;
};

/**/
mat4.preMultiplyByVec4 = function (vec, mat) {

    /*
     
     >>>>>>>>>>>>>>>
     0 		0,   1,  2,  3,
     1 		4,   5,  6,  7,
     2 	 x	8,   9,  10, 11,
     3  	12,  13, 14, 15    
     */

    //row 1
    r00 = vec[0] * mat[0] + vec[1] * mat[4] + vec[2] * mat[8] + vec[3] * mat[12];
    r01 = vec[0] * mat[1] + vec[1] * mat[5] + vec[2] * mat[9] + vec[3] * mat[13];
    r02 = vec[0] * mat[2] + vec[1] * mat[6] + vec[2] * mat[10] + vec[3] * mat[14];
    r03 = vec[0] * mat[3] + vec[1] * mat[7] + vec[2] * mat[11] + vec[3] * mat[15];

    vec[0] = r00;
    vec[1] = r01;
    vec[2] = r02;
    vec[3] = r03;

};

/**/
mat4.postMultiplyByVec4 = function (vec, mat) {

    /*
     >>>>>>>>>>>>>>>
     0,   1,  2,  3,	  0
     4,   5,  6,  7,	  1
     8,   9,  10, 11,  x  2
     12,  13, 14, 15      3
     */

    //row 1
    r00 = vec[0] * mat[0] + vec[1] * mat[1] + vec[2] * mat[2] + vec[3] * mat[3];
    r01 = vec[0] * mat[4] + vec[1] * mat[5] + vec[2] * mat[6] + vec[3] * mat[7];
    r02 = vec[0] * mat[8] + vec[1] * mat[9] + vec[2] * mat[10] + vec[3] * mat[11];
    r03 = vec[0] * mat[12] + vec[1] * mat[13] + vec[2] * mat[14] + vec[3] * mat[15];

    vec[0] = r00;
    vec[1] = r01;
    vec[2] = r02;
    vec[3] = r03;

};

/**/
mat4.old.translate = function (matrix, Tx, Ty, Tz) {
    mat4.multiplyByMat4(matrix, [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        Tx, Ty, Tz, 1
    ]);
};

/**/
mat4.translate = function (matrix, Tx, Ty, Tz) {
    matrix[12] += Tx;
    matrix[13] += Ty;
    matrix[14] += Tz;
};

/**/
mat4.moveTo = function (matrix, Px, Py, Pz) {
    matrix[12] = Px;
    matrix[13] = Py;
    matrix[14] = Pz;
};

/**/
mat4.old.scale = function (matrix, Sx, Sy, Sz) {
    mat4.multiplyByMat4(matrix, [
        Sx, 0, 0, 0,
        0, Sy, 0, 0,
        0, 0, Sz, 0,
        0, 0, 0, 1
    ]);
};

/**/
mat4.scale = function (matrix, Sx, Sy, Sz) {

    matrix[0] *= Sx;
    matrix[1] *= Sy;
    matrix[2] *= Sz;

    matrix[4] *= Sx;
    matrix[5] *= Sy;
    matrix[6] *= Sz;

    matrix[8] *= Sx;
    matrix[9] *= Sy;
    matrix[10] *= Sz;

};

/**/
mat4.degresToRadian = function (angle) {
    return angle / 180 * Math.PI;
};

/**/
mat4.getRotationXMatrix = function (angle, isRadian) {
    if (!isRadian)
        angle = mat4.degresToRadian(angle);
    else
        ;
    //end else

    s = Math.sin(angle);
    c = Math.cos(angle);

    return [
        1, 0, 0, 0,
        0, c, -s, 0,
        0, s, c, 0,
        0, 0, 0, 1
    ];
};

/**/
mat4.old.rotateX = function (matrix, angle, isRadian) {
    if (!isRadian)
        angle = mat4.degresToRadian(angle);
    else
        ;
    //end else

    s = Math.sin(angle);
    c = Math.cos(angle);

    mat4.multiplyByMat4(matrix, [
        1, 0, 0, 0,
        0, c, -s, 0,
        0, s, c, 0,
        0, 0, 0, 1
    ]);
};

/**/
mat4.rotateX = function (matrix, angle, isRadian) {
    if (!isRadian)
        angle = mat4.degresToRadian(angle);
    else
        ;
    //end else
    s = Math.sin(angle);
    c = Math.cos(angle);

    //precalculated matrix product
    r01 = matrix[1] * c + matrix[2] * s;
    r02 = -matrix[1] * s + matrix[2] * c;
    r11 = matrix[5] * c + matrix[6] * s;
    r12 = -matrix[5] * s + matrix[6] * c;
    r21 = matrix[9] * c + matrix[10] * s;
    r22 = -matrix[9] * s + matrix[10] * c;

    //only is modified this components on matrix
    matrix[1] = r01;
    matrix[2] = r02;
    matrix[5] = r11;
    matrix[6] = r12;
    matrix[9] = r21;
    matrix[10] = r22;

    return matrix;
};

/**/
mat4.getRotationYMatrix = function (angle, isRadian) {
    if (!isRadian)
        angle = mat4.degresToRadian(angle);
    else
        ;
    //end else

    s = Math.sin(angle);
    c = Math.cos(angle);

    return [
        c, 0, s, 0,
        0, 1, 0, 0,
        -s, 0, c, 0,
        0, 0, 0, 1
    ];
};

/**/
mat4.old.rotateY = function (matrix, angle, isRadian) {
    if (!isRadian)
        angle = mat4.degresToRadian(angle);
    else
        ;
    //end else

    s = Math.sin(angle);
    c = Math.cos(angle);

    mat4.multiplyByMat4(matrix, [
        c, 0, s, 0,
        0, 1, 0, 0,
        -s, 0, c, 0,
        0, 0, 0, 1
    ]);
};

/**/
mat4.rotateY = function (matrix, angle, isRadian) {
    if (!isRadian)
        angle = mat4.degresToRadian(angle);
    else
        ;
    //end else

    s = Math.sin(angle);
    c = Math.cos(angle);

    //precalculated matrix product
    r00 = matrix[0] * c - matrix[2] * s;
    r02 = matrix[0] * s + matrix[2] * c;
    r10 = matrix[4] * c - matrix[6] * s;
    r12 = matrix[4] * s + matrix[6] * c;
    r20 = matrix[8] * c - matrix[10] * s;
    r22 = matrix[8] * s + matrix[10] * c;

    //only is modified this components on matrix
    matrix[0] = r00;
    matrix[2] = r02;
    matrix[4] = r10;
    matrix[6] = r12;
    matrix[8] = r20;
    matrix[10] = r22;

    return matrix;
};

/**/
mat4.getRotationZMatrix = function (angle, isRadian) {
    if (!isRadian)
        angle = mat4.degresToRadian(angle);
    else
        ;
    //end else

    s = Math.sin(angle);
    c = Math.cos(angle);

    return [
        c, -s, 0, 0,
        s, c, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ];
};

/**/
mat4.old.rotateZ = function (matrix, angle, isRadian) {
    if (!isRadian)
        angle = mat4.degresToRadian(angle);
    else
        ;
    //end else

    s = Math.sin(angle);
    c = Math.cos(angle);

    mat4.multiplyByMat4(matrix, [
        c, -s, 0, 0,
        s, c, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]);
};

/**/
mat4.rotateZ = function (matrix, angle, isRadian) {
    if (!isRadian)
        angle = mat4.degresToRadian(angle);
    else
        ;
    //end else

    s = Math.sin(angle);
    c = Math.cos(angle);

    //precalculated matrix product
    r00 = matrix[0] * c + matrix[1] * s;
    r01 = -matrix[0] * s + matrix[1] * c;
    r10 = matrix[4] * c + matrix[5] * s;
    r11 = -matrix[4] * s + matrix[5] * c;
    r20 = matrix[8] * c + matrix[9] * s;
    r21 = -matrix[8] * s + matrix[9] * c;

    //only is modified this components on matrix
    matrix[0] = r00;
    matrix[1] = r01;
    matrix[4] = r10;
    matrix[5] = r11;
    matrix[8] = r20;
    matrix[9] = r21;

    return matrix;
};

/**/
mat4.old.push = function (mat) {
    mat4.matrixStack[mat4.matrixStackedCount] = new Float32Array(mat);
    mat4.matrixStackedCount++;
};

/**/
mat4.push = function (matrix) {
    mat4.matrixStack.push(matrix);
};


/**/
mat4.old.pop = function (mat) {
    var response;

    if (mat4.matrixStackedCount > 0) {
        response = mat4.matrixStack[mat4.matrixStackedCount - 1];
        mat4.matrixStack[mat4.matrixStackedCount - 1] = null;
        mat4.matrixStackedCount--;
    } else {
        response = mat;
    }

    return response;
};

/**/
mat4.pop = function (matrix) {
    return m = mat4.matrixStack.pop() || (matrix);
};


mat4.ortho = function (mat, left, rigth, up, down, near, far) {

    mat[0] = 1 / (rigth - left);
    mat[1] = 0;
    mat[2] = 0;
    mat[3] = 0;

    mat[4] = 0;
    mat[5] = 1 / (up - down);
    mat[6] = 0;
    mat[7] = 0;

    mat[8] = 0;
    mat[9] = 0;
    mat[10] = 1 / (far - near);
    mat[11] = 0;

    mat[12] = 0;
    mat[13] = 0;
    mat[14] = 0;
    mat[15] = 1.0;
};

/**/
mat4.project = function (mat, fovX, isRadian, ratio, near, far) {

    if (!isRadian)
        fovX = mat4.degresToRadian(fovX);

    var f = 1.0 / Math.tan(fovX / 2);
    var inverse = 1 / (near - far);

    /*mat4.multiplyByMat4(mat, [
     f / ratio, 0, 0, 0,
     0, f, 0, 0,
     0, 0, (near + far) * inverse, -1, 
     0, 0, (near * far * inverse * 2), 0
     ]);*/

    mat[0] = f / ratio;
    mat[1] = 0;
    mat[2] = 0;
    mat[3] = 0;

    mat[4] = 0;
    mat[5] = f;
    mat[6] = 0;
    mat[7] = 0;

    mat[8] = 0;
    mat[9] = 0;
    mat[10] = (near + far) * inverse;
    mat[11] = -1;

    mat[12] = 0;
    mat[13] = 0;
    mat[14] = (near * far * inverse * 2);
    mat[15] = 0;


};

/**/
mat4.projectXY = function (mat, fovX, fovY, isRadian, ratio, near, far) {

    if (!isRadian) {
        fovX = mat4.degresToRadian(fovX);
        fovY = mat4.degresToRadian(fovY);

    }

    var fx = 1.0 / Math.tan(fovX / 2);
    var fy = 1.0 / Math.tan(fovY / 2);
    var inverse = 1 / (near - far);

    mat[0] = fx / ratio;
    mat[1] = 0;
    mat[2] = 0;
    mat[3] = 0;

    mat[4] = 0;
    mat[5] = fy;
    mat[6] = 0;
    mat[7] = 0;

    mat[8] = 0;
    mat[9] = 0;
    mat[10] = (near + far) * inverse;
    mat[11] = -1;

    mat[12] = 0;
    mat[13] = 0;
    mat[14] = (near * far * inverse * 2);
    mat[15] = 0;


};

/**/
mat4.lookAt = function (mat, x, y, z, atx, aty, atz, upx, upy, upz) {
    var vecIn, vecAt, vecUp, vecX, vecY, vecZ;

    vecIn = [x, y, z];
    vecAt = [atx, aty, atz];
    vecUp = [upx, upy, upz];

    vecZ = vec3.normalize(vec3.substract(vecIn, vecAt));
    vecX = vec3.normalize(vec3.cross(vecUp, vecZ));
    vecY = vec3.normalize(vec3.cross(vecZ, vecX));

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

/**/
mat4.cameraMat4 = function (mat, x, y, z, atx, aty, atz, upx, upy, upz) {
    //completed camera make process
    mat4.lookAt(mat, x, y, z, atx, aty, atz, upx, upy, upz);
    mat4.inverse(mat);
};

/**/
mat4.det = function (mat) {

    /*
     *  Sarrus determinant method
     *  0  1  2  3
     *  4  5  6  7
     *  8  9  10 11
     *  12 13 14 15
     */

    return (mat[0] * mat[5] * mat[10] * mat[15] - mat[3] * mat[6] * mat[9] * mat[12])
            + (mat[1] * mat[6] * mat[11] * mat[12] - mat[2] * mat[5] * mat[8] * mat[15])
            + (mat[4] * mat[9] * mat[14] * mat[3] - mat[7] * mat[10] * mat[13] * mat[0])
            + (mat[2] * mat[7] * mat[8] * mat[13] - mat[1] * mat[4] * mat[11] * mat[14])
            ;
};

/**/
mat4.cofactor = function (mat) {

    //row 1
    r00 = mat4.mat3.det(mat[5], mat[6], mat[7], mat[9], mat[10], mat[11], mat[13], mat[14], mat[15]);
    r01 = -mat4.mat3.det(mat[4], mat[6], mat[7], mat[8], mat[10], mat[11], mat[12], mat[14], mat[15]);
    r02 = mat4.mat3.det(mat[4], mat[5], mat[7], mat[8], mat[9], mat[11], mat[12], mat[13], mat[15]);
    r03 = -mat4.mat3.det(mat[4], mat[5], mat[6], mat[8], mat[9], mat[10], mat[12], mat[13], mat[14]);

    //row 2
    r10 = -mat4.mat3.det(mat[1], mat[2], mat[3], mat[9], mat[10], mat[11], mat[13], mat[14], mat[15]);
    r11 = mat4.mat3.det(mat[0], mat[2], mat[3], mat[8], mat[10], mat[11], mat[12], mat[14], mat[15]);
    r12 = -mat4.mat3.det(mat[0], mat[1], mat[3], mat[8], mat[9], mat[11], mat[12], mat[13], mat[15]);
    r13 = mat4.mat3.det(mat[0], mat[1], mat[2], mat[8], mat[9], mat[10], mat[12], mat[13], mat[14]);

    //row 3
    r20 = mat4.mat3.det(mat[1], mat[2], mat[3], mat[5], mat[6], mat[7], mat[13], mat[14], mat[15]);
    r21 = -mat4.mat3.det(mat[0], mat[2], mat[3], mat[4], mat[6], mat[7], mat[12], mat[14], mat[15]);
    r22 = mat4.mat3.det(mat[0], mat[1], mat[3], mat[4], mat[5], mat[7], mat[12], mat[13], mat[15]);
    r23 = -mat4.mat3.det(mat[0], mat[1], mat[2], mat[4], mat[5], mat[6], mat[12], mat[13], mat[14]);

    //row 4
    r30 = -mat4.mat3.det(mat[1], mat[2], mat[3], mat[5], mat[6], mat[7], mat[9], mat[10], mat[11]);
    r31 = mat4.mat3.det(mat[0], mat[2], mat[3], mat[4], mat[6], mat[7], mat[8], mat[10], mat[11]);
    r32 = -mat4.mat3.det(mat[0], mat[1], mat[3], mat[4], mat[5], mat[7], mat[8], mat[9], mat[11]);
    r33 = mat4.mat3.det(mat[0], mat[1], mat[2], mat[4], mat[5], mat[6], mat[8], mat[9], mat[10]);

    mat[0] = r00;
    mat[1] = r01;
    mat[2] = r02;
    mat[3] = r03;

    mat[4] = r10;
    mat[5] = r11;
    mat[6] = r12;
    mat[7] = r13;

    mat[8] = r20;
    mat[9] = r21;
    mat[10] = r22;
    mat[11] = r23;

    mat[12] = r30;
    mat[13] = r31;
    mat[14] = r32;
    mat[15] = r33;

};

/**/
mat4.old.transpose = function (mat) {

    /*
     *  0  1  2  3
     *  4  5  6  7
     *  8  9  10 11
     *  12 13 14 15
     *  
     *  0 4 8 12
     *  1 5 9 13
     *  2 6 10 14
     *  3 7 11 15
     */

    return [
        mat[0], mat[4], mat[8], mat[12],
        mat[1], mat[5], mat[9], mat[13],
        mat[2], mat[6], mat[10], mat[14],
        mat[3], mat[7], mat[11], mat[15]
    ];
};

mat4.transpose = function (mat) {
    var t = 0;

    //0 => 0

    t = mat[1];
    mat[1] = mat[4];
    mat[4] = t;

    t = mat[2];
    mat[2] = mat[8];
    mat[8] = t;

    t = mat[3];
    mat[3] = mat[12];
    mat[12] = t;

    // 5 => 5

    t = mat[6];
    mat[6] = mat[9];
    mat[9] = t;

    t = mat[7];
    mat[7] = mat[13];
    mat[13] = t;

    // 10 => 10

    t = mat[11];
    mat[11] = mat[14];
    mat[14] = t;

    // 15 => 15

};

mat4.transposeMat4 = function (mat) {
    return new Float32Array([
        mat[0], mat[4], mat[8], mat[12],
        mat[1], mat[5], mat[9], mat[13],
        mat[2], mat[6], mat[10], mat[14],
        mat[3], mat[7], mat[11], mat[15]
    ]);
};

/**/
mat4.inverse = function (mat) {

    var det = mat4.det(mat);

    if (det !== 0) {
        mat4.cofactor(mat);                    //find cofactor matrix
        mat4.transpose(mat);                   //adjunta matrix is transpose of cofactor
        mat4.multiplyByScalar(mat, 1 / det);   //inverse is adjunt multiply by 1/determinant
    } else {
        ;
    }

    return mat;
};

/*The next functions provide a support for operations witch matrix
 of 3x3 components used in operations of mat 4x4, by example a inverse
 calculation of minors cofactors using mat4.mat3.det(...) , .*/

mat4.mat3 = new Object();

/**/
mat4.old.mat3 = new Object();	//contain unoptimized functions to work by matrix of 3x3

/**/
mat4.mat3.createMat3 = function () {
    return new Float32Array([
        1, 0, 0,
        0, 1, 0,
        0, 0, 1
    ]);
};

/**/
mat4.mat3.createMat3ByMat4 = function (matrix) {
    return new Float32Array([
        matrix[0], matrix[1], matrix[2],
        matrix[4], matrix[5], matrix[6],
        matrix[8], matrix[9], matrix[10],
        matrix[12], matrix[13], matrix[14]
    ]);
};

/**/
mat4.mat3.det = function (e0, e1, e2, e3, e4, e5, e6, e7, e8) {
    /*
     *       0 1 2
     *  det  3 4 5  =  scalar
     *       6 7 8
     */
    return (e0 * e4 * e8 - e2 * e4 * e6) + (e3 * e7 * e2 - e5 * e7 * e0) + (e1 * e5 * e6 - e1 * e3 * e8);
};

/**/
mat4.mat3.loadIdentity = function (matrix) {
    matrix[0] = 1;
    matrix[1] = 0;
    matrix[2] = 0;
    matrix[3] = 0;
    matrix[4] = 1;
    matrix[5] = 0;
    matrix[6] = 0;
    matrix[7] = 0;
    matrix[8] = 1;
};




