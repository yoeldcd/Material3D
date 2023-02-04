const int MAX_MATERIALS = gl_MaxVertexUniformVectors / 3 - 10;

attribute vec3 vertexCoords;
attribute vec4 vertexNormal;
attribute vec2 vertexTexCoords;
attribute vec4 vertexColor;
attribute vec2 vertexMetadata;

varying vec3 fcoords;
varying vec3 fnormal;
varying vec4 Kd;
varying float Ns;

struct MTLMaterial {
    vec3 Kd;
    vec4 mapKd;
    float Ns;
};

struct Camera {
    lowp mat4 mview;
    lowp vec3 coords;
};

uniform mat4 mtransform;
uniform Camera camera;
uniform MTLMaterial materials[MAX_MATERIALS];

int materialIndex;
MTLMaterial material;

void main(){
    
    //compute vertex position
    gl_Position = mtransform * vec4(vertexCoords, 1.0);
    
    //compute transformed vertex normal direction
    fcoords = gl_Position.xyz;
    fnormal = normalize((mtransform * vec4(vertexNormal.xyz, 0.0))).xyz;
    
    //get index of used material
    materialIndex = int(vertexMetadata.y);
    material = materials[materialIndex < MAX_MATERIALS ? materialIndex : 0];
    
    //use material RGB components or compute material sampler ST coord
    if(material.mapKd.w == 0.0) 
        Kd.rgb = material.Kd;
    else
        Kd.stq = vec3(vertexTexCoords.x * material.mapKd.z + material.mapKd.x, vertexTexCoords.y * material.mapKd.w + material.mapKd.y, 1.0);
    
    //define material specular value
    Ns = material.Ns;
    
    //compute projected vertex position
    gl_Position = camera.mview * gl_Position;
    
}
