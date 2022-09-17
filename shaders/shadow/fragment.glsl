precision highp float;

const float near = 0.1;
const float far = 10.0;

varying float fragz;

void main(){
    gl_FragColor.r = 1.0 - (fragz * (1.0 / (near + far)));
    gl_FragColor.a = 1.0;
}