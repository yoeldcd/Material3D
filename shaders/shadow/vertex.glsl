
precision highp float;

attribute vec3 vertexPositions;

varying float fragz;

uniform mat4 mtransform;
uniform mat4 mcamera;
uniform mat4 mprojection;

void main() {
    gl_Position = mprojection * mcamera * mtransform * vec4(vertexPositions, 1.0);
    fragz = gl_Position.z;
}