precision highp float;

struct MTLMaterial {
    vec3 Kd;
    //vec3 Ks;
    //vec3 Ka;
    float Ns;
    float d;
    mat3 mapKd;
    //mat3 mapKs;
    //mat3 mapKa;
    //mat3 mapBump;
};

attribute vec3 vertexPosition;
attribute vec4 vertexNormal;
attribute vec2 vertexTexCoords;
attribute vec2 vertexMetadata;

varying vec3 coords;
varying vec3 normal;
varying vec4 difuse;
varying float specularNicest;
varying float ditther;

uniform MTLMaterial materials[64];
uniform mat4 mtransform;
uniform mat4 mview;
uniform sampler2D mapBump;

MTLMaterial material;
vec4 transformed;
vec3 texCoords;
vec3 bump;


void main(){
    
    material = materials[int(vertexMetadata.y)];
    
    //use material components or compute material sampler texture coord
    texCoords = vec3(vertexTexCoords, 1.0);
    difuse = material.mapKd[2][2] == 0.0 ? vec4(material.Kd, 0.0) : vec4((material.mapKd * texCoords), 1.0);
    
    specularNicest = material.Ns;
    ditther = material.d;

    //compute vertex position
    transformed = mtransform * vec4(vertexPosition, 1.0);
    gl_Position = mview * transformed;
    
    //compute transformed vertex normal direction
    coords = transformed.xyz;
    normal = normalize((mtransform * vec4(vertexNormal.xyz, 0.0))).xyz;
    
}
