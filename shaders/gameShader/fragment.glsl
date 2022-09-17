precision highp float;

const int MAX_LIGTHS = 8;

struct Ligth {
    vec3 color;
    vec3 coords;
    vec3 invDirection;
    float maxDot;
};

//fragment shader varyings
varying vec3 coords;
varying vec3 normal;
varying vec2 texCoord;
varying vec4 Kd;
varying vec4 Ks;
varying vec4 Ka;
varying float Ns;

//fragment shader uniforms
uniform Ligth ligths[MAX_LIGTHS];
uniform sampler2D map_Kd;
uniform sampler2D map_Ks;
uniform sampler2D map_Ka;
uniform sampler2D map_bump;

vec3 computePong(Ligth ligth){
    vec3 color = (Kd * texture2D(map_Kd, texCoord)).rgb;
    
    return color;
}

void main() {
    for(int i = 0; i < 1; i++){
        gl_FragColor.rgb += computePong(ligths[i]);
    }
    
    gl_FragColor.a = 1.0;
}