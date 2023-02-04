precision mediump float;

void main(){
    gl_FragColor.r = cos(gl_FragCoord.x);
    gl_FragColor.a = 1.0;
}