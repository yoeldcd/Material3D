
var vec3 = new (function () {

    var v0, v1, v2, v3;
    var l;
    var s, c;
    var value;

    var sin = Math.sin;
    var sqrt = Math.sqrt;
    var PI = Math.PI;

    this.makeVec3 = function (numArray) {
        v0 = new Float32Array(4);
        v0[3] = 1.0;

        if (numArray) {
            v0[0] = numArray[0];
            v0[1] = numArray[1];
            v0[2] = numArray[2];

        }

        return v0;
    };

    this.length = function (vec) {
        return vec ? sqrt(vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2]) : 0;
    };

    this.normalize = function (vec, dst) {
        dst || (dst = vec);

        if (vec) {
            l = sqrt(vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2]);
            if (l !== 0) {
                dst[0] = vec[0] / l;
                dst[1] = vec[1] / l;
                dst[2] = vec[2] / l;

            }

        }

        return dst;
    };

    this.add = function (vec1, vec2, dst) {
        dst || (dst = vec1);

        if (vec1 && vec2) {
            dst[0] = vec1[0] + vec2[0];
            dst[1] = vec1[1] + vec2[1];
            dst[2] = vec1[2] + vec2[2];

        }

        return dst;
    };

    this.sub = function (vec1, vec2, dst) {
        dst || (dst = vec1);

        if (vec1 && vec2) {
            dst[0] = vec1[0] - vec2[0];
            dst[1] = vec1[1] - vec2[1];
            dst[2] = vec1[2] - vec2[2];

        }

        return dst;
    };

    this.dot = function (vec1, vec2) {

        if (vec1 && vec2) {
            value = vec1[0] * vec2[0] - vec1[1] * vec2[1] - vec1[2] * vec2[2];
        } else {
            value = 0;
        }

        return value;
    };

    this.cross = function (vec1, vec2, dst) {
        dst || (dst = vec1);

        if (vec1 && vec2) {
            v0 = vec1[1] * vec2[2] - vec1[2] * vec2[1];
            v1 = vec1[2] * vec2[0] - vec1[0] * vec2[2];
            v2 = vec1[0] * vec2[1] - vec1[1] * vec2[0];

            dst[0] = v0;
            dst[1] = v1;
            dst[2] = v2;

        }

        return dst;
    };

    this.multiply = function (vec1, vec2, dst) {
        dst || (dst = vec1);

        if (vec1 && vec2) {
            dst[0] = vec1[0] * vec2[0];
            dst[1] = vec1[1] * vec2[1];
            dst[2] = vec1[2] * vec2[2];
        }

        return dst;
    };

    this.multiplyScalar = function (vec1, scalar, dst) {
        dst || (dst = vec1);

        if (vec1 && scalar) {
            dst[0] = vec1[0] * scalar;
            dst[1] = vec1[1] * scalar;
            dst[2] = vec1[2] * scalar;
        }

        return dst;
    };

    this.rotateX = function (vec, alpha, isRadian, dst) {
        dst || (dst = vec);

        if (vec) {

            v0 = vec[0];
            v1 = vec[1];
            v2 = vec[2];

            isRadian || (alpha = alpha / 180 * PI);
            s = sin(alpha);
            c = 1 - (s * s);

            dst[0] = vec[0];
            dst[1] = c * v1 - s * v2;
            dst[2] = s * v1 + c * v2;

        }

        return dst;
    };

    this.rotateY = function (vec, beta, isRadian, dst) {
        dst || (dst = vec);

        if (vec) {

            v0 = vec[0];
            v2 = vec[2];

            isRadian || (beta = beta / 180 * PI);
            s = sin(beta);
            c = 1 - (s * s);

            dst[0] = s * v2 + c * v0;
            dst[1] = vec[1];
            dst[2] = c * v2 - s * v0;

        }

        return dst;
    };

    this.rotateZ = function (vec, omega, isRadian, dst) {
        dst || (dst = vec);

        if (vec) {

            v0 = vec[0];
            v1 = vec[1];
            v2 = vec[2];

            isRadian || (omega = omega / 180 * PI);
            s = sin(omega);
            c = 1 - (s * s);

            dst[0] = c * v0 - s * v1;
            dst[1] = s * v0 + c * v1;
            dst[2] = vec[2];
        }

        return dst;
    };

    this.distance = function (vec1, vec2) {
        if (vec1 && vec2) {
            v0 = vec1[0] - vec2[0];
            v1 = vec1[1] - vec2[1];
            v2 = vec1[2] - vec2[2];

            value = sqrt(v0 * v0 + v1 * v1 + v2 * v2);

        } else if (vec1) {
            v0 = vec1[0];
            v1 = vec1[1];
            v2 = vec1[2];

            value = sqrt(v0 * v0 + v1 * v1 + v2 * v2);

        } else {
            value = 0;

        }

        return value;
    };

    this.transform = function (vec, mat4, rowVec, dst) {
        dst || (dst = vec);

        if (vec && mat4) {
            v0 = vec[0];
            v1 = vec[1];
            v2 = vec[2];
            v3 = vec[3];

            if (rowVec) {
                //multiply vec4 by mat4
                dst[0] = v0 * mat4[0] + v1 * mat4[4] + v2 * mat4[8] + v3 * mat4[12];
                dst[1] = v0 * mat4[1] + v1 * mat4[5] + v2 * mat4[9] + v3 * mat4[13];
                dst[2] = v0 * mat4[2] + v1 * mat4[6] + v2 * mat4[10] + v3 * mat4[14];
                dst[3] = v0 * mat4[3] + v1 * mat4[7] + v2 * mat4[11] + v3 * mat4[15];
                
            } else {
                //multiply mat4 by vec4
                dst[0] = v0 * mat4[0] + v1 * mat4[1] + v2 * mat4[2] + v3 * mat4[3];
                dst[1] = v0 * mat4[4] + v1 * mat4[5] + v2 * mat4[6] + v3 * mat4[7];
                dst[2] = v0 * mat4[8] + v1 * mat4[9] + v2 * mat4[10] + v3 * mat4[11];
                dst[3] = v0 * mat4[12] + v1 * mat4[13] + v2 * mat4[14] + v3 * mat4[15];
            
            }
        }
        
        return dst;
    };

});
