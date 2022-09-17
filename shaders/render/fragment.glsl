precision highp float;

const float near = 0.1;
const float far = 10.0;

varying vec3 coords;
varying vec3 normal;
varying vec2 texCoord;
varying vec2 shadowCoord;
varying float zvalue;

uniform sampler2D map_shadow;
uniform sampler2D map_Kd;
uniform sampler2D map_Ks;
uniform sampler2D map_Ka;
uniform sampler2D map_bump;

uniform vec3 ligthCoord;

vec3 computePong() {
    vec3 color = texture2D(map_Kd, texCoord).rgb;

    return color;
}

float shadowZvalue;
float shadowZ;

void main() {

    //compute depth values
    shadowZvalue = 1.0 - (zvalue * (1.0 / (near + far)));
    shadowZ = texture2D(map_shadow, shadowCoord).r;

    gl_FragColor = vec4(computePong() * (shadowZvalue >= shadowZ ? 1.0 : 0.1), 1.0);
    //gl_FragColor = vec4(computePong() * shadowZ, 1.0);

}

