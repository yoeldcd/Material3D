precision highp float;

struct Material {
    vec4 Kd;
    vec4 Ks;
    vec4 Ka;
    float Ns;
};

attribute vec3 vertexPositions;
attribute vec3 vertexNormals;
attribute vec2 vertexTextureCoords;
attribute float vertexMaterialIndex;

//fragment shader varyings
varying vec3 coords;
varying vec3 normal;
varying vec2 texCoord;
varying vec4 Kd;
varying vec4 Ks;
varying vec4 Ka;
varying float Ns;

//vertex shader uniforms
uniform mat4 mtransform;
uniform mat4 mprojection;
uniform mat4 mview;
uniform Material materials[64];

Material material;

void main() {
    gl_Position = mtransform * vec4(vertexPositions, 1.0);
    
    coords = gl_Position.xyz;
    normal = normalize((mtransform * vec4(vertexNormals, 0.0)).xyz);
    texCoord = vertexTextureCoords;
    
    //define materials componets
    material = materials[int(vertexMaterialIndex)];
    Kd = material.Kd;
    Ks = material.Ks;
    Ka = material.Ka;
    Ns = material.Ns;
    
    gl_Position = mprojection * mview * gl_Position;
}

