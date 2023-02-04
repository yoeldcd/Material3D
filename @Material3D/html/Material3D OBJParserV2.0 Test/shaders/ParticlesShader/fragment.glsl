precision lowp float;
precision lowp int;

struct Sprite {
    float rows;
    float columns;
    float texel_y;
    float texel_x;
};

varying vec2 ftexel;
uniform Sprite sprite;
uniform sampler2D spriteImage;

void main(){
    
    gl_FragColor = texture2D(spriteImage, ftexel);
    
    if(gl_FragColor.a < 0.5)
        discard;

}