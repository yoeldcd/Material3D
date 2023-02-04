
precision mediump float;

struct Camera {
    mat4 mview;
    vec3 coords;
};

struct Ligth {
    bool enable;
    vec3 coords;
    vec3 color;
};

varying vec3 fcoords;
varying vec3 fnormal;
varying vec4 Kd;
varying vec3 Ks;
varying float Ns;

uniform sampler2D mapKd;
uniform vec3 viewCoords;
uniform Camera camera;
uniform Ligth ligths[8];
uniform vec3 ambientLigth;

vec3 ligth2surface;
vec3 view2surface;
vec3 view2ligth;

float ligthValue;
float specularValue;

void computePong(Ligth ligth){
    
    //compute ligth vectors
    ligth2surface = ligth.coords - fcoords;
    view2surface = camera.coords - fcoords;
    
    //compute difuse value
    ligthValue = max(dot(fnormal, normalize(ligth2surface)), 0.0);
    
    //compute specular value
    view2ligth = normalize(ligth2surface + view2surface);
    specularValue = pow(max(dot(fnormal, view2ligth), 0.0), Ns);
    ligthValue > 0.0 ? 1.0 : specularValue *= 0.0;
    
    //apply difuse ,ambient and specular color
    gl_FragColor.rgb *= ligth.color * ligthValue + ambientLigth;
    gl_FragColor.rgb += Ks * specularValue;
    
}

void main() {
    
    //get difuse color
    gl_FragColor = Kd.a == 0.0 ? vec4(Kd.rgb, 1.0) : texture2D(mapKd, Kd.xy);
    
    //eval alpha blending
    if(gl_FragColor.a == 0.0)
        discard;
    
    //apply ligth's efects
    for(int i = 0; i < 8; i++){
        if(ligths[i].enable){
            computePong(ligths[0]);
        }
    }
    
    gl_FragColor.a = 1.0;
}