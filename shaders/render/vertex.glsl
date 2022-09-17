precision highp float;

attribute vec3 vertexPositions;
attribute vec3 vertexNormals;
attribute vec2 vertexTextureCoords;

varying vec3 coords;
varying vec3 normal;
varying vec2 texCoord;
varying vec2 shadowCoord;
varying float zvalue;

uniform mat4 mtransform;
uniform mat4 mcamera;
uniform mat4 mprojection;
uniform mat4 mcameraShadow;
uniform mat4 mprojectionShadow;


void computeShadowComponet(){
    vec4 shadowPosition = mprojectionShadow * mcameraShadow * gl_Position;
    shadowCoord.s = clamp( (shadowPosition.x + 1.0) / 2.0, 0.0, 1.0);
    shadowCoord.t = clamp( (shadowPosition.y + 1.0) / 2.0, 0.0, 1.0);
    zvalue = shadowPosition.z;
}

void main() {
    gl_Position = mtransform * vec4(vertexPositions, 1.0);
    computeShadowComponet();
    
    coords = gl_Position.xyz;
    normal = normalize(vertexNormals);
    texCoord = vertexTextureCoords;
    
    gl_Position = mprojection * mcamera * gl_Position;
}