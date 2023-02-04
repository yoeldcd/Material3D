
'use strict';

/*  @author Yoel david Correa Duke
 *  @version 1.0.0
 *  @date 23/8/2020
 *  
 *  This module have a one group of methoods to manipulate 
 *  matrix and vector's to use in WebGL applications.
 *  
 *  All matrix and vectors are stored on Float32Array data format. 
 *  Not is used a bi-dimenssional matrixs to get a most and fast
 *  execution times. This is optimized for game development
 *  and real time rendering.
 *  
 *  @MATH: Math of Vector and matrix product:
 *      
 *      vec = {x,y,z,w}
 *      
 *      <b>multipling matrix by column vector</b>
 *      vec = matrix * vec;
 *      
 *      x' = m00 * x + m01 * y + m02 * z + m03 * w
 *      y' = m10 * x + m11 * y + m12 * z + m13 * w
 *      z' = m20 * x + m21 * y + m22 * z + m23 * w
 *      w' = m30 * x + m31 * y + m32 * z + m33 * w
 *      
 *      <b>multipling row vector by matrix</b>
 *      vec = vec * matrix;
 *      
 *      x' = m00 * x + m10 * y + m20 * z + m30 * w
 *      y' = m01 * x + m11 * y + m21 * z + m31 * w
 *      z' = m02 * x + m12 * y + m22 * z + m32 * w
 *      w' = m03 * x + m13 * y + m23 * z + m33 * w
 *      
 *  @NOTE:
 *  
 *      WebGL use mayor-column ordin , when you send an matrix
 *      is received the transpose. Rows are receiveds as columns.
 *      
 */

var MATHGL = new (function () {

    this.MATRIX = {};
    this.VECTOR = {};
    
    var stack = new Array(100);
    var stackSize = 100;
    var stackUsed = 0;

    //initialize stack slots
    for (var i = 0; i < 100; i++) {
        stack[i] = new Float32Array(16);
    }
    
    var identityMatrix = new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]);
    
    
    this.MATRIX.makeMat4 = function (numArray) {
        var matrix = new Float32Array(numArray ? numArray : identityMatrix);
        
        Object.defineProperty(matrix, 'isMatrix', {
            configurable: false,
            writeable: false,
            value: true
        });
        
        return matrix;
    };
    
    this.MATRIX.utilMatrix0 = this.MATRIX.makeMat4();
    this.MATRIX.utilMatrix1 = this.MATRIX.makeMat4();
    this.MATRIX.utilMatrix2 = this.MATRIX.makeMat4();
    this.MATRIX.utilMatrix3 = this.MATRIX.makeMat4();
    this.MATRIX.utilMatrix4 = this.MATRIX.makeMat4();
    this.MATRIX.utilMatrix5 = this.MATRIX.makeMat4();
    this.MATRIX.utilMatrix6 = this.MATRIX.makeMat4();
    this.MATRIX.utilMatrix7 = this.MATRIX.makeMat4();
    
    this.VECTOR.makeVector = function (x, y, z, w) {
        var vec = new Object();
        
        vec.x = x || 0;
        vec.y = y || 0;
        vec.z = z || 0;
        vec.w = w || 1;
        
        Object.defineProperty(vec, 'isVector', {
            configurable: false,
            writeable: false,
            value: true
        });
        
        Object.defineProperty(vec, 'set', {
            configurable: false,
            writeable: false,
            value: set
        });
        
        return vec;
    };
    
    function set(x, y, z, w){
        this.x = x  || 0;
        this.y = y || 0;
        this.z = z || 0;
        this.w = w || 1;
        
    }
    
    this.VECTOR.utilVector0 = this.VECTOR.makeVector();
    this.VECTOR.utilVector1 = this.VECTOR.makeVector();
    this.VECTOR.utilVector2 = this.VECTOR.makeVector();
    this.VECTOR.utilVector3 = this.VECTOR.makeVector();
    this.VECTOR.utilVector4 = this.VECTOR.makeVector();
    this.VECTOR.utilVector5 = this.VECTOR.makeVector();
    this.VECTOR.utilVector6 = this.VECTOR.makeVector();
    this.VECTOR.utilVector7 = this.VECTOR.makeVector();
    
    /* @MATH:
     * set identity matrix componets values to matrix
     *
     * 1 0 0 0
     * 0 1 0 0
     * 0 0 1 0
     * 0 0 0 1
     * 
     **/

    this.MATRIX.loadIdentity = function (mat) {

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
        return mat;
    };

    /**/

    this.MATRIX.add = function (mat1, mat2, dst) {
        dst || (dst = mat1);
        dst[0] = mat1[0] + mat2[0];
        dst[1] = mat1[1] + mat2[1];
        dst[2] = mat1[2] + mat2[2];
        dst[3] = mat1[3] + mat2[3];
        dst[4] = mat1[4] + mat2[4];
        dst[5] = mat1[5] + mat2[5];
        dst[6] = mat1[6] + mat2[6];
        dst[7] = mat1[7] + mat2[7];
        dst[8] = mat1[8] + mat2[8];
        dst[9] = mat1[9] + mat2[9];
        dst[10] = mat1[10] + mat2[10];
        dst[11] = mat1[11] + mat2[11];
        dst[12] = mat1[12] + mat2[12];
        dst[13] = mat1[13] + mat2[13];
        dst[14] = mat1[14] + mat2[14];
        dst[15] = mat1[15] + mat2[15];
        return dst;
    };

    /**/

    this.MATRIX.sub = function (mat1, mat2, dst) {
        dst || (dst = mat1);
        dst[0] = mat1[0] - mat2[0];
        dst[1] = mat1[1] - mat2[1];
        dst[2] = mat1[2] - mat2[2];
        dst[3] = mat1[3] - mat2[3];
        dst[4] = mat1[4] - mat2[4];
        dst[5] = mat1[5] - mat2[5];
        dst[6] = mat1[6] - mat2[6];
        dst[7] = mat1[7] - mat2[7];
        dst[8] = mat1[8] - mat2[8];
        dst[9] = mat1[9] - mat2[9];
        dst[10] = mat1[10] - mat2[10];
        dst[11] = mat1[11] - mat2[11];
        dst[12] = mat1[12] - mat2[12];
        dst[13] = mat1[13] - mat2[13];
        dst[14] = mat1[14] - mat2[14];
        dst[15] = mat1[15] - mat2[15];
        return dst;
    };

    /* @MATH:
     * Change rows by columns values:
     * 
     * 0   1  2   3  --> 0 4 8  12
     * 4   5  6   7  --> 1 5 9  13
     * 8   9  10 11  --> 2 6 10 14
     * 12 13  14 15  --> 3 7 11 15
     * 
     * 4/1 8/2 12/3 9/6 13/7 14/11
     * 
     */

    this.MATRIX.transpose = function (mat, dst) {
        var t;
        dst || (dst = mat);
        
        //make traspose 
        t = mat[1];
        dst[1] = mat[4];
        dst[4] = t;
        
        t = mat[2];
        dst[2] = mat[8];
        dst[8] = t;
        
        t = mat[3];
        dst[3] = mat[12];
        dst[12] = t;
        
        t = mat[6];
        dst[6] = mat[9];
        dst[9] = t;
        
        t = mat[7];
        dst[7] = mat[13];
        dst[13] = t;
        
        t = mat[11];
        dst[11] = mat[14];
        dst[14] = t;
        
        //main diagonal
        dst[0] = mat[0];
        dst[5] = mat[5];
        dst[10] = mat[10];
        dst[15] = mat[15];
        
        return dst;
    };

    /* @MATH:
     * Compute value of matrix determnant
     * apply GAUS METHOOD
     * 
     * det = positive - negative
     * 
     */

    this.MATRIX.det = function (mat) {
        return mat[0] * mat[5] * mat[10] * mat[15]
                + mat[1] * mat[6] * mat[11] * mat[12]
                + mat[2] * mat[7] * mat[8] * mat[13]
                + mat[3] * mat[4] * mat[9] * mat[14]
                - mat[12] * mat[9] * mat[6] * mat[3]
                - mat[13] * mat[10] * mat[7] * mat[0]
                - mat[14] * mat[11] * mat[4] * mat[1]
                - mat[15] * mat[8] * mat[5] * mat[2];
    };

    /* @MATH:
     * Compute cofactor matrix components:
     * 
     * mat[i][j] = -1 ^ (i+j) * det(minor(mat, i, j))
     * 
     */

    this.MATRIX.cofactor = function (mat, dst) {
        var a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p;
        dst || (dst = mat);
        
        //load matrix components
        a = mat[0];
        b = mat[1];
        c = mat[2];
        d = mat[3];
        e = mat[4];
        f = mat[5];
        g = mat[6];
        h = mat[7];
        i = mat[8];
        j = mat[9];
        k = mat[10];
        l = mat[11];
        m = mat[12];
        n = mat[13];
        o = mat[14];
        p = mat[15];
        
        //compute minor and multiply cofactor
        
        //row 0 (DISCARTED ROW a b c d )
        dst[0] = (f * k * p + g * l * n + h * j * o - n * k * h - o * l * f - p * j * g);
        dst[1] = -(e * k * p + g * l * m + h * i * o - m * k * h - o * l * e - p * i * g);
        dst[2] = (e * j * p + f * l * m + h * i * n - m * j * h - n * l * e - p * i * f);
        dst[3] = -(e * j * o + f * k * m + g * i * n - m * j * g - n * k * e - o * i * f);
        
        //row 1 (DISCARTED ROW e f g h )
        dst[4] = -(b * k * p + c * l * n + d * j * o - n * k * d - o * l * b - p * j * c);
        dst[5] = (a * k * p + c * l * m + d * i * o - m * k * d - o * l * a - p * i * c);
        dst[6] = -(a * j * p + b * l * m + d * i * n - m * j * d - n * l * a - p * i * b);
        dst[7] = (a * j * o + b * k * m + c * i * n - m * j * c - n * k * a - o * i * b);
        
        //row 2 (DISCARTED ROW i j k l )
        dst[8] = (b * g * p + c * h * n + d * f * o - n * g * d - o * h * b - p * f * c);
        dst[9] = -(a * g * p + c * h * m + d * e * o - m * g * d - o * h * a - p * e * c);
        dst[10] = (a * f * p + b * h * m + d * e * n - m * f * d - n * h * a - p * e * b);
        dst[11] = -(a * f * o + b * g * m + c * e * n - m * f * c - n * g * a - o * e * b);
        
        //row 3 (DISCARTED ROW m n o p )
        dst[12] = -(b * g * l + c * h * j + d * f * k - j * g * d - k * h * b - l * f * c);
        dst[13] = (a * g * l + c * h * i + d * e * k - i * g * d - k * h * a - l * e * c);
        dst[14] = -(a * f * l + b * h * i + d * e * j - i * f * d - j * h * a - l * e * b);
        dst[15] = (a * f * k + b * g * i + c * e * j - i * f * c - j * g * a - k * e * b);
        
        return mat;
    };

    /* @MATH:
     * Compute adjunte matrix components:
     * is transpose of cofactor matrix.
     * 
     * mat[j][i] = -1 ^ (i+j) * det(minor(mat, i, j))
     * 
     */

    this.MATRIX.adjunte = function (mat, dst) {
        var a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p;
        dst || (dst = mat);
        
        //load matrix components
        a = mat[0];
        b = mat[1];
        c = mat[2];
        d = mat[3];
        e = mat[4];
        f = mat[5];
        g = mat[6];
        h = mat[7];
        i = mat[8];
        j = mat[9];
        k = mat[10];
        l = mat[11];
        m = mat[12];
        n = mat[13];
        o = mat[14];
        p = mat[15];
        
        //store transposed cofactors
        
        //column 0 (DISCARTED ROW a b c d )
        dst[0] = (f * k * p + g * l * n + h * j * o - n * k * h - o * l * f - p * j * g);
        dst[4] = -(e * k * p + g * l * m + h * i * o - m * k * h - o * l * e - p * i * g);
        dst[8] = (e * j * p + f * l * m + h * i * n - m * j * h - n * l * e - p * i * f);
        dst[12] = -(e * j * o + f * k * m + g * i * n - m * j * g - n * k * e - o * i * f);
        
        //column 1 (DISCARTED ROW e f g h )
        dst[1] = -(b * k * p + c * l * n + d * j * o - n * k * d - o * l * b - p * j * c);
        dst[5] = (a * k * p + c * l * m + d * i * o - m * k * d - o * l * a - p * i * c);
        dst[9] = -(a * j * p + b * l * m + d * i * n - m * j * d - n * l * a - p * i * b);
        dst[13] = (a * j * o + b * k * m + c * i * n - m * j * c - n * k * a - o * i * b);
        
        //column 2 (DISCARTED ROW i j k l )
        dst[2] = (b * g * p + c * h * n + d * f * o - n * g * d - o * h * b - p * f * c);
        dst[6] = -(a * g * p + c * h * m + d * e * o - m * g * d - o * h * a - p * e * c);
        dst[10] = (a * f * p + b * h * m + d * e * n - m * f * d - n * h * a - p * e * b);
        dst[14] = -(a * f * o + b * g * m + c * e * n - m * f * c - n * g * a - o * e * b);
        
        //column 3 (DISCARTED ROW m n o p )
        dst[3] = -(b * g * l + c * h * j + d * f * k - j * g * d - k * h * b - l * f * c);
        dst[7] = (a * g * l + c * h * i + d * e * k - i * g * d - k * h * a - l * e * c);
        dst[11] = -(a * f * l + b * h * i + d * e * j - i * f * d - j * h * a - l * e * b);
        dst[15] = (a * f * k + b * g * i + c * e * j - i * f * c - j * g * a - k * e * b);
        
        return mat;
    };

    /* @MATH:
     * Compute inverse matrix components:
     * is transpose of cofactor matrix (adjunte)
     * divided by determinant.
     * 
     * mat[j][i] = -1 ^ (i+j) * det(minor(mat, i, j)) / det(mat);
     * 
     */

    this.MATRIX.invert = function (mat, dst) {
        var det;
        var a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p;
        dst || (dst = mat);
        
        //load matrix components
        a = mat[0];
        b = mat[1];
        c = mat[2];
        d = mat[3];
        e = mat[4];
        f = mat[5];
        g = mat[6];
        h = mat[7];
        i = mat[8];
        j = mat[9];
        k = mat[10];
        l = mat[11];
        m = mat[12];
        n = mat[13];
        o = mat[14];
        p = mat[15];
        
        //compute determinant
        det = a * f * k * p + b * g * l * m + c * h * i * n + d * e * j * o; //positive diagonals
        det -= m * j * g * d + n * k * h * a + o * l * e * b + p * i * f * c; //negative diagonals
        
        if (det !== 0) {

            //store multiplyScalar(transpose(cofactor(mat)), 1/det)
            
            //column 0 (DISCARTED ROW a b c d )
            dst[0] = (f * k * p + g * l * n + h * j * o - n * k * h - o * l * f - p * j * g) / det;
            dst[4] = (e * k * p + g * l * m + h * i * o - m * k * h - o * l * e - p * i * g) / -det;
            dst[8] = (e * j * p + f * l * m + h * i * n - m * j * h - n * l * e - p * i * f) / det;
            dst[12] = (e * j * o + f * k * m + g * i * n - m * j * g - n * k * e - o * i * f) / -det;
            
            //column 1 (DISCARTED ROW e f g h )
            dst[1] = (b * k * p + c * l * n + d * j * o - n * k * d - o * l * b - p * j * c) / -det;
            dst[5] = (a * k * p + c * l * m + d * i * o - m * k * d - o * l * a - p * i * c) / det;
            dst[9] = (a * j * p + b * l * m + d * i * n - m * j * d - n * l * a - p * i * b) / -det;
            dst[13] = (a * j * o + b * k * m + c * i * n - m * j * c - n * k * a - o * i * b) / det;
            
            //column 2 (DISCARTED ROW i j k l )
            dst[2] = (b * g * p + c * h * n + d * f * o - n * g * d - o * h * b - p * f * c) / det;
            dst[6] = (a * g * p + c * h * m + d * e * o - m * g * d - o * h * a - p * e * c) / -det;
            dst[10] = (a * f * p + b * h * m + d * e * n - m * f * d - n * h * a - p * e * b) / det;
            dst[14] = (a * f * o + b * g * m + c * e * n - m * f * c - n * g * a - o * e * b) / -det;
            
            //column 3 (DISCARTED ROW m n o p )
            dst[3] = (b * g * l + c * h * j + d * f * k - j * g * d - k * h * b - l * f * c) / -det;
            dst[7] = (a * g * l + c * h * i + d * e * k - i * g * d - k * h * a - l * e * c) / det;
            dst[11] = (a * f * l + b * h * i + d * e * j - i * f * d - j * h * a - l * e * b) / -det;
            dst[15] = (a * f * k + b * g * i + c * e * j - i * f * c - j * g * a - k * e * b) / det;
        }

        return mat;
    };
    
    /*@MATH: 
     * Multyply rows of matrix_1 by columns of matrix_2
     * using dot product.
     * 
     * dst[i][j] = dot(mat1.rows[i], mat2.columns[j]);
     * 
     */

    this.MATRIX.multiply = function (mat1, mat2, dst) {
        var x, y, z, w;
        var a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p;
        dst || (dst = mat1);
        
        //load matrix 2 compoents
        a = mat2[0];
        b = mat2[1];
        c = mat2[2];
        d = mat2[3];
        e = mat2[4];
        f = mat2[5];
        g = mat2[6];
        h = mat2[7];
        i = mat2[8];
        j = mat2[9];
        k = mat2[10];
        l = mat2[11];
        m = mat2[12];
        n = mat2[13];
        o = mat2[14];
        p = mat2[15];
        
        //row 0
        x = mat1[0];
        y = mat1[1];
        z = mat1[2];
        w = mat1[3];
        dst[0] = x * a + y * e + z * i + w * m;
        dst[1] = x * b + y * f + z * j + w * n;
        dst[2] = x * c + y * g + z * k + w * o;
        dst[3] = x * d + y * h + z * l + w * p;
        
        //row 1
        x = mat1[4];
        y = mat1[5];
        z = mat1[6];
        w = mat1[7];
        dst[4] = x * a + y * e + z * i + w * m;
        dst[5] = x * b + y * f + z * j + w * n;
        dst[6] = x * c + y * g + z * k + w * o;
        dst[7] = x * d + y * h + z * l + w * p;
        
        //row 2
        x = mat1[8];
        y = mat1[9];
        z = mat1[10];
        w = mat1[11];
        dst[8] = x * a + y * e + z * i + w * m;
        dst[9] = x * b + y * f + z * j + w * n;
        dst[10] = x * c + y * g + z * k + w * o;
        dst[11] = x * d + y * h + z * l + w * p;
        
        //row 3
        x = mat1[8];
        y = mat1[9];
        z = mat1[10];
        w = mat1[11];
        dst[12] = x * a + y * e + z * i + w * m;
        dst[13] = x * b + y * f + z * j + w * n;
        dst[14] = x * c + y * g + z * k + w * o;
        dst[15] = x * d + y * h + z * l + w * p;
        return dst;
    };

    /*@MATH: 
     * Multyply rows of matrix_1 by rows of matrix_2
     * using dot product. (COLUMN by ROW values is used)
     * 
     * dst[i][j] = dot(mat1.rows[i], mat2.rows[j]);
     * 
     */

    this.MATRIX.multiplyTranspose = function (mat1, mat2, dst) {
        var x, y, z, w;
        var a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p;
        dst || (dst = mat1);
        
        //load matrix 2 components
        a = mat2[0];
        b = mat2[1];
        c = mat2[2];
        d = mat2[3];
        e = mat2[4];
        f = mat2[5];
        g = mat2[6];
        h = mat2[7];
        i = mat2[8];
        j = mat2[9];
        k = mat2[10];
        l = mat2[11];
        m = mat2[12];
        n = mat2[13];
        o = mat2[14];
        p = mat2[15];
        
        //row 0
        x = mat1[0];
        y = mat1[1];
        z = mat1[2];
        w = mat1[3];
        dst[0] = x * a + y * b + z * c + w * d;
        dst[1] = x * e + y * f + z * g + w * h;
        dst[2] = x * i + y * j + z * k + w * l;
        dst[3] = x * m + y * n + z * o + w * p;
        
        //row 1
        x = mat1[4];
        y = mat1[5];
        z = mat1[6];
        w = mat1[7];
        dst[0] = x * a + y * b + z * c + w * d;
        dst[1] = x * e + y * f + z * g + w * h;
        dst[2] = x * i + y * j + z * k + w * l;
        dst[3] = x * m + y * n + z * o + w * p;
        
        //row 2
        x = mat1[8];
        y = mat1[9];
        z = mat1[10];
        w = mat1[11];
        dst[4] = x * a + y * b + z * c + w * d;
        dst[5] = x * e + y * f + z * g + w * h;
        dst[6] = x * i + y * j + z * k + w * l;
        dst[7] = x * m + y * n + z * o + w * p;
        
        //row 3 
        x = mat1[8];
        y = mat1[9];
        z = mat1[10];
        w = mat1[11];
        dst[8] = x * a + y * b + z * c + w * d;
        dst[9] = x * e + y * f + z * g + w * h;
        dst[10] = x * i + y * j + z * k + w * l;
        dst[11] = x * m + y * n + z * o + w * p;
        
        return dst;
    };

    /*@MATH:
     * Multiply any components by scalar value.
     * 
     * mat[i][j] = mat[i][j] * scalar
     */

    this.MATRIX.multiplyScalar = function (mat, scalar, dst) {

        scalar || (scalar = 1);
        dst || (dst = mat);
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
        return dst;
    };
    
    /*@MATH:
     * TRANSLATE IN XYZ axis
     * 
     * v.x' = v.x + Tx * v.w
     * v.y' = v.y + Ty * v.w
     * v.z' = v.z + Tz * v.w
     * 
     *  1   0   0  0
     *  0   1   0  0
     *  0   0   1  0
     * Tx  Ty  Tz  1
     * 
     */

    this.MATRIX.translate = function (mat, Tx, Ty, Tz) {
        
        var a, b, c, d;
        
        //translated X
        a = mat[0];
        b = mat[4];
        c = mat[8];
        d = mat[12];
        Tx ? mat[12] = Tx * a + Ty * b + Tz * c + d : 0.0;
        
        //translated X
        a = mat[1];
        b = mat[5];
        c = mat[9];
        d = mat[13];
        Ty ? mat[13] = Tx * a + Ty * b + Tz * c + d : 0.0;
        
        //translated X
        a = mat[2];
        b = mat[6];
        c = mat[10];
        d = mat[14];
        Tz ? mat[14] = Tx * a + Ty * b + Tz * c + d : 0.0;
        
        return mat;
    };

    /*@MATH:
     *  SCALE XYZ axis
     *  
     *  v.x' = v.x * Sx
     *  v.y' = v.y * Sy
     *  v.z' = v.z * Sz
     *  
     *  Sx 0   0  0
     *  0  Sy  0  0
     *  0  0  Sz  0
     *  0  0   0  1
     *  
     */

    this.MATRIX.scale = function (mat, Sx, Sy, Sz) {

        //row 0
        mat[0] *= Sx;
        mat[1] *= Sx;
        mat[2] *= Sx;
        mat[3] *= Sx;
        
        //row 1
        mat[4] *= Sy;
        mat[5] *= Sy;
        mat[6] *= Sy;
        mat[7] *= Sy;
        
        //row 2
        mat[8] *= Sz;
        mat[9] *= Sz;
        mat[10] *= Sz;
        mat[11] *= Sz;
        
        //row 3 (NOT MODIFIED BECAUSE MULTIPLY BY UNARY VEC { 0, 0, 0, 1})
        
        return mat;
    };

    /* @MATH:
     * LOOK X axis rotate YZ in CCW
     * 
     * v.y' = v.y * c - v.z * s
     * v.z' = v.y * s + v.z * c
     * 
     * 1   0  0  0   
     * 0   c  s  0   
     * 0 - s  c  0
     * 0   0  0  1   
     * 
     * */

    this.MATRIX.rotateX = function (mat, alpha, isRadian) {
        var y, z;
        var s, c;
        
        if (alpha) {
            isRadian || (alpha *= Math.PI / 180);
            s = Math.sin(alpha);
            c = Math.cos(alpha);

            //multiply this by MATRIX (PREORDIN: MatRotX * Mat)
            y = mat[4];
            z = mat[8];
            mat[4] =   y * c + z * s;
            mat[8] = - y * s + z * c;
            
            y = mat[5];
            z = mat[9];
            mat[5] =   y * c + z * s;
            mat[9] = - y * s + z * c;
            
            y = mat[6];
            z = mat[10];
            mat[6] =   y * c + z * s;
            mat[10] = - y * s + z * c;
            
            y = mat[7];
            z = mat[11];
            mat[7] =   y * c + z * s;
            mat[11] = - y * s + z * c;
        
        }

        return mat;
    };

    /*  @MATH:
     *  LOOCK Y axis rotate XZ in CCW
     * 
     *  v.x' =  v.z * s + v.x * c; 
     *  v.z' =  v.z * c - v.x * s;
     *  
     *  c  0 -s  0
     *  0  1  0  0
     *  s  0  c  0
     *  0  0  0  1
     *  */

    this.MATRIX.rotateY = function (mat, beta, isRadian) {
        var x, z;
        var s, c;
        
        if (mat && beta) {

            isRadian || (beta *= Math.PI / 180);
            s = Math.sin(beta);
            c = Math.cos(beta);

            //multyply this by MATRIX (PREORDIN: MatRotY * Mat)
            x = mat[0];
            z = mat[8];
            mat[0] = x * c - z * s;
            mat[8] = x * s + z * c;

            x = mat[1];
            z = mat[9];
            mat[1] = x * c - z * s;
            mat[9] = x * s + z * c;

            x = mat[2];
            z = mat[10];
            mat[2] = x * c - z * s;
            mat[10] = x * s + z * c;

            x = mat[3];
            z = mat[11];
            mat[3] = x * c - z * s;
            mat[11] = x * s + z * c;
        }

        return mat;
    };

    /* @MATH:
     * LOOCK Z axis rotate XY in CCW
     * 
     * v.x' = v.x * c - v.y * s
     * v.y' = v.x * s + v.y * c
     * 
     *  c  s  0  0 
     * -s  c  0  0
     *  0  0  1  0
     *  0  0  0  1
     * */

    this.MATRIX.rotateZ = function (mat, omega, isRadian) {
        var x, y;
        var s, c;

        if (mat && omega) {
            isRadian || (omega *= Math.PI / 180);
            s = Math.sin(omega);
            c = Math.cos(omega);

            //precalculated matrix product (PREORDIN: MatRotZ * Mat)
            
            x = mat[0];
            y = mat[4];
            mat[0] =   x * c + y * s;
            mat[4] = - x * s + y * c;

            x = mat[1];
            y = mat[5];
            mat[1] =   x * c + y * s;
            mat[5] = - x * s + y * c;

            x = mat[2];
            y = mat[6];
            mat[2] =   x * c + y * s;
            mat[6] = - x * s + y * c;

            x = mat[3];
            y = mat[7];
            mat[3] =   x * c + y * s;
            mat[7] = - x * s + y * c;
            
        }

        return mat;
    };

    /*@MATH:
     * ROTATE AXIS TO LOOK ON TARGET XYZ DIRECTION
     * 
     * v.x' = v.x * vx0 + v.y * vx1 + v.z * vx2 + v.w * Tx
     * v.z' = v.x * vy0 + v.y * vy1 + v.z * vy2 + v.w * Ty
     * v.z' = v.x * vz0 + v.y * vz1 + v.z * vz2 + v.w * Tz
     * v.w' = v.w;
     * 
     * vx0 vx1 vx2  0
     * vy0 vy1 vy2  0
     * vz0 vz1 vz2  0
     * Tx  Ty   Tz  1
     * 
     */
    
    this.MATRIX.loockAt = function (mat, x, y, z, atx, aty, atz, upx, upy, upz) {

        var vxX, vxY, vxZ;
        var vyX, vyY, vyZ;
        var vzX, vzY, vzZ;
        
        var a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p;
        
        //load matrix components
        a = mat[0];
        b = mat[1];
        c = mat[2];
        d = mat[3];
        e = mat[4];
        f = mat[5];
        g = mat[6];
        h = mat[7];
        i = mat[8];
        j = mat[9];
        k = mat[10];
        l = mat[11];
        m = mat[12];
        n = mat[13];
        o = mat[14];
        p = mat[15];
        
        //compute vecor Z = normalized(in - at)
        vzX = x - atx;
        vzY = y - aty;
        vzZ = z - atz;
        
        //normalize vector Z
        length = Math.sqrt(vzX * vzX + vzY * vzY + vzZ * vzZ);
        
        if(length !== 0){
            vzX /= length;
            vzY /= length;
            vzZ /= length;
        }
        
        //compute and normalize vector X = cros(up, vz)
        vxX = upy * vzZ - upz * vzY;
        vxY = upz * vzX - upx * vzZ;
        vxZ = upx * vzY - upy * vzX;
        
        length = Math.sqrt(vxX * vxX + vxY * vxY + vxZ * vxZ);
        
        if(length !== 0){
            vxX /= length;
            vxY /= length;
            vxZ /= length;
        }
        
        //compute and normalize vector Y = cros(vz, vx)
        vyX = vzY * vxZ - vzZ * vxY;
        vyY = vzZ * vxX - vzX * vxZ;
        vyZ = vzX * vxY - vzY * vxX;
        length = Math.sqrt(vyX * vyX + vyY * vyY + vyZ * vyZ);
        
        if(length !== 0){
            vyX /= length;
            vyY /= length;
            vyZ /= length;
        }
        
        //row 0
        mat[0] = vxX * a + vxY * e + vxZ * i;
        mat[1] = vxX * b + vxY * f + vxZ * j;
        mat[2] = vxX * c + vxY * g + vxZ * k;
        mat[3] = vxX * d + vxY * h + vxZ * l;
        
        //row 1
        mat[4] = vyX * a + vyY * e + vyZ * i;
        mat[5] = vyX * b + vyY * f + vyZ * j;
        mat[6] = vyX * c + vyY * g + vyZ * k;
        mat[7] = vyX * d + vyY * h + vyZ * l;
        
        //row 2
        mat[8]  = vzX * a + vzY * e + vzZ * i;
        mat[9]  = vzX * b + vzY * f + vzZ * j;
        mat[10] = vzX * c + vzY * g + vzZ * k;
        mat[11] = vzX * d + vzY * h + vzZ * l;
        
        //row 3 (w = 1)
        mat[12] = x * a + y * e + z * i + m;
        mat[13] = x * b + y * f + z * j + n;
        mat[14] = x * c + y * g + z * k + o;
        mat[15] = x * d + y * h + z * l + p;
        
        return mat;
    };

    /*@MATH:
     * Multiply by projection matrix:
     * 
     * f is a fieldOfView in X and Y axis (NOT NEESTED AS RADIAN)
     * 
     * v.x' = v.x * f / ratio;
     * v.y' = v.y * f
     * v.z' = v.z * (near + far) * inverse - 1
     * v.w' = v.z * (near * far * inverse * 2)
     *
     * //MATRIX
     * 
     * f / ratio, 0,                          0,                           0,
     * 0,         f,                          0,                           0,
     * 0,         0,     (near + far) * inverse,  (near * far * inverse * 2),
     * 0,         0,                         -1,                           0
     * 
     */

    this.MATRIX.project = function (mat, fieldOfView, isRadian, ratio, znear, zfar) {
        isRadian || (fieldOfView = fieldOfView / 180 * Math.PI);
        
        var fv = 1.0 / Math.tan(fieldOfView / 2);
        var inversev = 1 / (znear - zfar);
        var x, y, z, w;
        var i, j, k, l;
        
        //row 0
        x = fv / ratio;
        mat[0] *= x;
        mat[1] *= x;
        mat[2] *= x;
        mat[3] *= x;
        
        //row 1
        y = fv;
        mat[4] *= y;
        mat[5] *= y;
        mat[6] *= y;
        mat[7] *= y;
        
        //row 2
        i = mat[8];
        j = mat[9];
        k = mat[10];
        l = mat[11];
        
        z = (zfar + znear) * inversev;
        w = (zfar * znear * inversev * 2);
        
        mat[8] = z * i + w * mat[12];
        mat[9] = z * j + w * mat[13];
        mat[10] = z * k + w * mat[14];
        mat[11] = z * l + w * mat[15];
        
        //row 3
        z = -1;
        mat[12] = z * i;
        mat[13] = z * j;
        mat[14] = z * k;
        mat[15] = z * l;
        
        return mat;
    };

    /* 
     * Save a matrix componenst values in one temporal matrix
     * on stack top position. 
     */

    this.MATRIX.push = function (mat) {
        var stackTop;
        var size = stackSize;
        var used = stackUsed;
        
        if (mat) {
            used < size || (stack[size] = new Float32Array(16));
            stackTop = stack[used];
            
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

    /* 
     * Store in one matrix the values of matrix coponents on top
     * position of stack if not is empty, else use identity matrix.
     */

    this.MATRIX.pop = function (mat) {
        var stackTop;
        var used = this.stackUsed;
        
        if (mat) {
            stackTop = used >= 0 ? stack[used] : identityMatrix;
            
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
    
    /* 
     * Copy components values of one marix on other
     */

    this.MATRIX.copy = function (mat, dst) {

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

        return mat;
    };
    
    /* @MATH: Compute vector length value 
     * length = sqrt(dot(v, v));
     * */

    this.VECTOR.length = function (vec) {
        return Math.sqrt(vec.x * vec.x + vec.y * vec.y + vec.z * vec.z);
    };

    /* @MATH: Compute components dot product
     * of two vectors.
     * 
     * dot = (v1.x * v2.x) + (v1.y * v2.y) + (v1.z * v2.z) + (v1.w * v2.w)
     */

    this.VECTOR.dot = function (vec1, vec2) {
        return vec1.x * vec2.x + vec1.y * vec2.y + vec1.z * vec2.z;
    };
    
    this.VECTOR.invDot = function (vec1, vec2) {
        return vec1.x * vec2.x - vec1.y * vec2.y - vec1.z * vec2.z;
    };
    
    /* @MATH: Compute components cross product
     * of two vectors.
     * 
     * v1 = a b c | i = b * z - y * c |
     * v2 = x y z | j = c * x - z * a |
     * vR = i j k | k = a * y - x * b |
     * 
     * {i, j, k, w}
     * 
     */

    this.VECTOR.cross = function (vec1, vec2, dst) {
        var vx = vec1.x;
        var vy = vec1.y;
        var vz = vec1.z;
        
        dst || (dst = vec1);
        
        vec1.x = vy * vec2.z - vz * vec2.y;
        vec1.y = vz * vec2.x - vx * vec2.z;
        vec1.z = vx * vec2.y - vy * vec2.z;
        
        return dst;
    };

    /* @MATH: Normalize length of vector to 1 dividing
     * this for your length.
     */

    this.VECTOR.normalize = function (vec, dst) {
        dst || (dst = vec);
        
        var length = Math.sqrt(vec.x * vec.x + vec.y * vec.y + vec.z * vec.z) || 1;
        
        dst.x = vec.x / length;
        dst.y = vec.y / length;
        dst.z = vec.z / length;
        dst.w = length;
        
        return dst;
    };
    
    /*Compute two vectors components diference*/

    this.VECTOR.diference = function (vec1, vec2, dst) {
        dst || (dst = vec1);
        
        dst.x = vec1.x - vec2.x;
        dst.y = vec1.y - vec2.y;
        dst.z = vec1.z - vec2.z;
        
        return dst;
    };

    /*Compute two vectors components addition*/

    this.VECTOR.add = function (vec1, vec2, dst) {
        dst || (dst = vec1);
        
        dst.x = vec1.x + vec2.x;
        dst.y = vec1.y + vec2.y;
        dst.z = vec1.z + vec2.z;
        
        return dst;
    };

    /*Compute two vectors components product (NON DOT, NON CROSS)*/

    this.VECTOR.multiply = function (vec1, vec2, dst) {
        dst || (dst = vec1);
        
        dst.x = vec1.x * vec2.x;
        dst.y = vec1.y * vec2.y;
        dst.z = vec1.z * vec2.z;
        
        return dst;
    };
    
    /*Multply any vector components by one number*/
    
    this.VECTOR.multiplyScalar = function(vec, scalar, dst){
        dst || (dst = vec);
        scalar || (scalar = 1);
        
        dst.x = vec.x * scalar;
        dst.y = vec.y * scalar;
        dst.z = vec.z * scalar;
        
        return dst;
    };
    
    /*Compute components divition */

    this.VECTOR.divide = function (vec1, vec2, dst) {
        dst || (dst = vec1);
        
        dst.x = vec1.x / vec2.x;
        dst.y = vec1.y / vec2.y;
        dst.z = vec1.z / vec2.z;
        
        return dst;
    };

    /*@MATH: Compute vector coords rotated around X axis
     * in alpha angle value.
     * 
     * x' = x
     * y' = y * c - z * s
     * z' = y * s + z * c
     * 
     */

    this.VECTOR.rotateX = function (vec, alpha, isRadian) {
        var s, c;
        var y;
        
        if (alpha) {
            isRadian || (alpha *= Math.PI / 180);
            y = vec.y;
            
            s = Math.sin(alpha);
            c = Math.cos(alpha);
            
            vec.y = y * c - vec.z * s;
            vec.z = y * s + vec.z * c;
        }

        return vec;
    };

    /*@MATH: Compute vector coords rotated around Y axis
     * in beta angle value. in CCW
     * 
     * x' = x * c - z * s
     * y' = y
     * z' = x * s + z * c
     * 
     */

    this.VECTOR.rotateY = function (vec, beta, isRadian) {
        var s, c;
        var x;
        
        if (beta) {
            isRadian || (beta *= Math.PI / 180);
            
            x = vec.x;
            s = Math.sin(beta);
            c = Math.cos(beta);
            
            vec.x = vec.z * s + x * c;
            vec.z = vec.z * c - x * s;
        }

        return vec;
    };

    /*@MATH: Compute vector coords rotated around Z axis
     * in ganma angle value. in CCW
     * 
     * x' = x * c - y * s
     * y' = x * s + y * c
     * z' = z
     * 
     */

    this.VECTOR.rotateZ = function (vec, ganma, isRadian) {
        var s, c;
        var x;
        
        if (ganma) {
            isRadian || (ganma *= Math.PI / 180);
            
            x = vec.x;
            s = Math.sin(ganma);
            c = Math.cos(ganma);
            
            vec.x = x * c - vec.y * s;
            vec.y = x * s + vec.y * c;
        }

        return vec;
    };

    /* @MATH: Math of Vector and matrix multiplication:
     *      
     *      vec = {x,y,z,w}
     *      
     *      <b> Multipling matrix by column vector. </b>
     *      vec = matrix * vec;
     *      
     *      x' = m00 * x + m01 * y + m02 * z + m03 * w
     *      y' = m10 * x + m11 * y + m12 * z + m13 * w
     *      z' = m20 * x + m21 * y + m22 * z + m23 * w
     *      w' = m30 * x + m31 * y + m32 * z + m33 * w
     *      
     *      <b> Multipling row vector by matrix. </b>
     *      vec = vec * matrix;
     *      
     *      x' = m00 * x + m10 * y + m20 * z + m30 * w
     *      y' = m01 * x + m11 * y + m21 * z + m31 * w
     *      z' = m02 * x + m12 * y + m22 * z + m32 * w
     *      w' = m03 * x + m13 * y + m23 * z + m33 * w
     */

    this.VECTOR.multiplyMatrix = function (op1, op2, dst) {
        var x, y, z, w;
        
        if (op1 && op2) {
            if (op1.isMatrix && op2.isVector) {
                dst || (dst = op2);
                
                //load vector components
                x = op2.x;
                y = op2.y;
                z = op2.z;
                w = op2.w;

                //multiply matrix by column vector
                dst.x = op1[0] * x + op1[1] * y + op1[2] * z + op1[3] * w;
                dst.y = op1[4] * x + op1[5] * y + op1[6] * z + op1[7] * w;
                dst.z = op1[8] * x + op1[9] * y + op1[10] * z + op1[11] * w;
                dst.w = op1[12] * x + op1[13] * y + op1[14] * z + op1[15] * w;

            } else {
                dst || (dst = op1);
                
                //load vector components
                x = op1.x;
                y = op1.y;
                z = op1.z;
                w = op1.w;

                //multiply row vector by matrix
                dst.x = x * op2[0] + y * op2[4] + z * op2[8] + w * op2[12];
                dst.y = x * op2[1] + y * op2[5] + z * op2[9] + w * op2[13];
                dst.z = x * op2[2] + y * op2[6] + z * op2[10] + w * op2[14];
                dst.w = x * op2[3] + y * op2[7] + z * op2[11] + w * op2[15];
                
            }
        }

        return dst;
    };
    
    /*
        @description: Cast one vector object storage to
        one numeric float32Array number buffer be send
        to GPU or for more computation performace.
    
    */
    
    this.VECTOR.toFloat32Array = function (vec){
        var f32array = Float32Array();
        
        f32array [0] = vec.x;
        f32array [1] = vec.y;
        f32array [2] = vec.z;
        f32array [3] = vec.w;
        
        return f32array;
    }
})();
