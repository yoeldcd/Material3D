
struct Camera {
    mediump vec3 coords;
    mediump mat4 mview;
    mediump mat4 mproject;
};

attribute vec3 vertexCoords;

uniform Camera camera;
uniform mat4 mtransform;

void main(){
    gl_Position = camera.mproject * camera.mview * mtransform * vec4(vertexCoords, 1.0);
}