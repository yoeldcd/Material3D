precision lowp float;
precision lowp int;

const vec3 vecZ = vec3(0.0, 0.0, 1.0);

struct Camera {
    mat4 mview;
    mat4 mproject;
    vec3 coords;
};

struct Sprite {
    float rows;
    float columns;
    float texel_y;
    float texel_x;
};

attribute vec3 particleOrigin;
attribute vec3 particleDirection;
attribute vec2 vertexCoords;
attribute vec3 particleMetadata;

varying vec2 ftexel;
varying float umbral;

uniform Camera camera;
uniform Sprite sprite;
uniform mat4 mtransform;

uniform float time;
uniform float ratio;

uniform bool resize;
uniform bool loop;
uniform float iteration;

vec4 center;
vec4 position;

vec3 camera_rigth;
vec3 camera_up;

float value;
float delay;
float size;
float spriteID;

float z;
float row;
float col;

void main(){
    
    //compute delayed value
    value = time;
    if(loop)
        value += particleMetadata.x * 0.01;
    
    //normalize time value 0.0 --> 1.0
    if(value > 1.0)
        value -= 1.0;
    
    //jump particles sub-enables
    if(value < 0.0)
        return;
    
    //define particle sprite ID
    spriteID = particleMetadata.y;
    
    //define particle size
    size = particleMetadata.z * 0.01;
    if(resize)
        size *= value;
    
    //compute particle poligon center
    center.xyz = particleOrigin / 100.0;
    center.xyz += (value * ratio * particleDirection);
    center.w = 1.0;
    
    //compute particle center position
    gl_Position = mtransform * center;
    
    //get matrix vectors to transform x and y components
    camera_rigth = vec3(camera.mview[0].x, camera.mview[1].x , camera.mview[2].x);
    camera_up = vec3(camera.mview[0].y, camera.mview[1].y , camera.mview[2].y);
    
    //compute particle vertex position
    gl_Position.xyz += vertexCoords.x * size * camera_rigth;
    gl_Position.xyz += vertexCoords.y * size * camera_up;
    
    //compute final vertex position
    gl_Position = camera.mproject * camera.mview * gl_Position;
    
    //normlaize texel Coord
    ftexel.s = vertexCoords.x * 0.5 + 0.5;
    ftexel.t = vertexCoords.y * 0.5 + 0.5;
    
    //cast to integer index
    spriteID = float(int(spriteID));
    
    //get row and column
    row = float(int(spriteID / sprite.columns));
    col = spriteID - sprite.columns * row;
    
    //invert row value
    row = sprite.rows - row - 1.0;
    
    //compute final texel Coords
    ftexel.s = ftexel.s * sprite.texel_x + col * sprite.texel_x;
    ftexel.t = ftexel.t * sprite.texel_y + row * sprite.texel_y;
    
}