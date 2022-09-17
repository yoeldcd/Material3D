precision highp float;
precision lowp int;

struct Material {
    vec4 Kd;
    vec4 Ks;
    vec4 Ka;
    float Ns;
    int map_Kd;
    int map_Ks;
    int map_Ka;
    int map_bump;
    vec4 transform;
};

struct Bone {
    vec4 coords; //origial bone position
    mat4 mtransform; //transformation bone matrix ( V.xyz = (V.xyz - B.coords.xyz) * B.transform; )
};

//vertex attribs
attribute vec3 vertexPositions;
attribute vec3 vertexNormals;
attribute vec2 vertexTextureCoords;
attribute float vertexMaterialIndex;

//vertex shader uniforms
uniform Bone bones[64];
uniform Material materials[8];

//model transformation uniforms matrixs
uniform mat4 mtransform;
uniform mat4 mcamera;
uniform mat4 mprojection;
uniform bool useFastDraw;

//shader varyings 
varying vec4 Kd;
varying vec4 Ks;
varying vec4 Ka;
varying float Ns;
varying vec2 texCoord;
varying vec3 normal;
varying vec3 coords;

Bone bone;
Material material;

void main() {

    //sed ransformeds coords
    gl_Position = mtransform * vec4(vertexPositions, 1.0);

    material = materials[int(vertexMaterialIndex)];
    Kd = material.Kd;
    Ks = material.Ks;
    Ka = material.Ka;
    Ns = material.Ns;

    //transform texels coords
    texCoord.s = useFastDraw ? ((vertexTextureCoords.s * material.transform.z) + material.transform.x) : vertexTextureCoords.s;
    texCoord.t = useFastDraw ? ((vertexTextureCoords.t * material.transform.w) + material.transform.y) : vertexTextureCoords.t;
   
    normal = (mtransform * vec4(vertexNormals, 0.0)).xyz;
    coords = gl_Position.xyz;

    gl_Position = mprojection * mcamera * gl_Position;
}
