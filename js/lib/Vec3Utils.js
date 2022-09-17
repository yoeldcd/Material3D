

/*
 *	This script contain a optimized functions to work with
 *	vectors of length value 3, useds in graphics generation
 *	using Web GL on HTML5. All functions work witch Arrays in
 *	Float32Array() format of JavaScript.
 */

var vec3 = new Object();

//temporal vector data
var v0 = 0;
var v1 = 0;
var v2 = 0;
var s = 0;
var c = 0;

/**/
vec3.createVec3 = function () {
    return new Float32Array((arguments.length === 3) ? [arguments[0], arguments[1], arguments[2]] : [0, 0, 0]);
};

//Utilizables vectors to work operations.
vec3.utilVector0 = vec3.createVec3();
vec3.utilVector1 = vec3.createVec3();
vec3.utilVector2 = vec3.createVec3();
vec3.utilVector3 = vec3.createVec3();
vec3.utilVector4 = vec3.createVec3();
vec3.utilVector5 = vec3.createVec3();
vec3.utilVector6 = vec3.createVec3();
vec3.utilVector7 = vec3.createVec3();
vec3.utilVector8 = vec3.createVec3();
vec3.utilVector9 = vec3.createVec3();

/**/
vec3.norma = function (vec) {
    return Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2]);
};

/**/
vec3.length = vec3.norma;

/**/
vec3.normalize = function (vec) {
    var norma = Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2]);
    var vecr;

    if (norma > 0.0000001) {
        vecr = [vec[0] / norma, vec[1] / norma, vec[2] / norma];
    } else {
        vecr = [0, 0, 0];
    }
    
    return vecr;
};

/**/
vec3.faceNormal = function (x1, y1, z1, x2, y2, z2, x3, y3, z3) {

    var vec1 = vec3.fromPoints(x1, y1, z1, x2, y2, z2);
    var vec2 = vec3.fromPoints(x3, y3, z3, x2, y2, z2);
    var normal = vec3.cross(vec1, vec2);

    normal = vec3.normalize(normal);
    normal = vec3.inverse(normal);

    return normal;
};

/**/
vec3.multiplyByScalar = function (vec, scalar) {
    return [vec[0] * scalar, vec[1] * scalar, vec[2] * scalar];
};

/**/
vec3.dot = function (vec1, vec2) {
    return vec1[0] * vec2[0] + vec1[1] * vec2[1] + vec1[2] * vec2[2];
};

/**/
vec3.cross = function (vec1, vec2) {
    var vecr = [0, 0, 0];
    /* vectorial product:
     *   i   j   k
     *  1x0 1x1 1x2
     *  2x0 2x1 2x2
     */
    vecr[0] = vec1[1] * vec2[2] - vec1[2] * vec2[1];
    vecr[1] = vec1[2] * vec2[0] - vec1[0] * vec2[2];
    vecr[2] = vec1[0] * vec2[1] - vec1[1] * vec2[0];

    return vecr;
};

/**/
vec3.scalar = function (vec1, vec2) {
    return [vec1[0] * vec2[0], vec1[1] * vec2[1], vec1[2] * vec2[2]];
};

/**/
vec3.distance = function (vec1, vec2) {
    return Math.sqrt(Math.pow(vec2[0] - vec1[0]) + Math.pow(vec2[1] - vec1[1]) + Math.pow(vec2[2] - vec1[2]));
};

/**/
vec3.inverse = function (vec) {
    return [vec[0] * -1, vec[1] * -1, vec[2] * -1];
};

/**/
vec3.fromPoints = function (x1, y1, z1, x2, y2, z2) {
    return [x1 - x2, y1 - y2, z1 - z2];
};

/**/
vec3.substract = function (vec1, vec2) {
    return [vec1[0] - vec2[0], vec1[1] - vec2[1], vec1[2] - vec2[2]];
};

/**/
vec3.angle = function (vec1, vec2) {
    return Math.acos(vec3.dot(vec1, vec2));
};

/**/
vec3.degresToRadian = function (angle) {
    return angle / 180 * Math.PI;
};


/**/
vec3.rotateX = function (vec, angle, isRadian) {

    if (!isRadian)
        angle = vec3.degresToRadian(angle);
    else
        ;

    s = Math.sin(angle);
    c = Math.cos(angle);

    v1 = vec[1];
    v2 = vec[2];

    vec[1] = c * v1 - s * v2;
    vec[2] = s * v1 + c * v2;
};

/**/
vec3.rotateY = function (vec, angle, isRadian) {

    if (!isRadian)
        angle = vec3.degresToRadian(angle);
    else
        ;

    s = Math.sin(angle);
    c = Math.cos(angle);

    v0 = vec[0];
    v2 = vec[2];

    vec[0] = s * v2 + c * v0;
    vec[2] = c * v2 - s * v0;
};

/**/
vec3.rotateZ = function (vec, angle, isRadian) {

    if (!isRadian)
        angle = vec3.degresToRadian(angle);
    else
        ;

    s = Math.sin(angle);
    c = Math.cos(angle);

    v0 = vec[0];
    v1 = vec[1];

    vec[0] = c * v0 - s * v1;
    vec[1] = s * v0 + c * v1;
};
