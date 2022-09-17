precision highp float;
precision lowp int;

struct Ligth {
    vec3 coords;
    vec3 color;
    vec3 normal;
    int type;
    float ratio;
    float field;
};

//fragment shader uniforms
uniform Ligth ligths[8];
uniform sampler2D map_Kd;
uniform sampler2D map_Ka;
uniform sampler2D map_Ks;
uniform sampler2D map_bump;

//shader varyings
varying vec4 Kd;
varying vec4 Ks;
varying vec4 Ka;
varying float Ns;
varying vec2 texCoord;
varying vec3 normal;
varying vec3 coords;

void main() {
    vec3 inverseLigthDirection = vec3(1.0, 0.0, 1.0);
    vec3 textData = texture2D(map_Kd, texCoord).rgb;
    float noDot = clamp(dot(normalize(normal), normalize(inverseLigthDirection)),0.0, 1.0) + 0.5;
    
    gl_FragColor.rgb = textData * Kd.rgb * noDot;;
    gl_FragColor.a = 1.0;
}


