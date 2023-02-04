
precision mediump float;

struct MTLMaterial {
    vec3 Kd;
    vec3 Ks;
    float Ns;
    vec4 mapKd;
};

struct Camera {
    mat4 mview;
    vec3 coords;
};

const int NUM_MATERIALS = gl_MaxVertexUniformVectors/4 - 10;

attribute vec3 vertexCoords;
attribute vec4 vertexNormal;
attribute vec2 vertexTexCoords;
attribute vec2 vertexMetadata;

varying vec3 fcoords;
varying vec3 fnormal;
varying vec4 Kd;
varying vec3 Ks;
varying float Ns;

uniform mat4 mtransform;
uniform Camera camera;
uniform MTLMaterial materials[NUM_MATERIALS];

MTLMaterial material;
vec4 transformed;
int materialID;

void main(){
    
    //selecting material
    materialID = int(vertexMetadata.y);
    materialID > NUM_MATERIALS ? materialID = 0 : 1;
    material = materials[materialID];
    
    //use material components or compute material sampler texture coord
    Kd = material.mapKd.w == 0.0 ? vec4(material.Kd, 0.0) : vec4(vertexTexCoords.x * material.mapKd.z + material.mapKd.x, vertexTexCoords.y * material.mapKd.w + material.mapKd.y, 0.0, 1.0);
    Ks = material.Ks;
    Ns = material.Ns;
    
    //compute vertex position
    transformed = mtransform * vec4(vertexCoords, 1.0);
    gl_Position = camera.mview * transformed;
    
    //compute transformed vertex normal direction
    fcoords = transformed.xyz;
    fnormal = normalize((mtransform * vec4(vertexNormal.xyz, 0.0))).xyz;
    
}
