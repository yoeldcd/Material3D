precision lowp float;

struct Camera {
    mat4 mview;
    vec3 coords;
};

struct Ligth {
    bool enable;
    bool directional;
    bool ambient;
    bool spot;

    vec3 coords;
    vec3 color;
    vec3 direction;

    float maxDot;
};

varying vec3 fcoords;
varying vec3 fnormal;
varying vec4 Kd;
varying float Ns;

uniform sampler2D mapKd;
uniform Camera camera;
uniform Ligth ligths[8];

Ligth ligth;

vec3 ligth2surface;
vec3 view2surface;
vec3 view2ligth;

float difuseValue;
float specularValue;

vec3 difuseColor;
vec3 specularColor;
vec3 ambientColor;

void main() {
    
    //get difuse color
    gl_FragColor = Kd.a == 0.0 ? vec4(Kd.rgb, 1.0) : texture2D(mapKd, Kd.xy);
        
    //discard alpha pixel
    if(gl_FragColor.a < 0.5)
        discard;
    
    //compute any applieds ligths values
    view2surface = camera.coords - fcoords;
        
    for(int i = 0; i < 8; i++){
        ligth = ligths[i];
        
        //jump disable ligth's
        if(!ligth.enable)
            continue;
        
        //dont compute more for ambinet ligths
        if(ligth.ambient){
            ambientColor += ligth.color;
            continue; 
        }
        
        //compute vectors
        ligth2surface = normalize(ligth.directional ? ligth.direction : (ligth.coords - fcoords));
        view2ligth = ligth2surface + view2surface;
        
        //don't apply ligth if not is on dot limit
        if(ligth.spot && dot(- ligth.direction, ligth2surface) < ligth.maxDot)
            continue;
        
        //compute ligth coeficents
        difuseValue = max(dot(fnormal, ligth2surface), 0.0);
        specularValue = pow(max(dot(fnormal, normalize(view2ligth)), 0.0), Ns) * difuseValue;
        
        //add color components
        difuseColor += ligth.color * difuseValue;
        specularColor += ligth.color * specularValue;
        
    }
    
    //compute final surface color
    gl_FragColor.rgb *= difuseColor + ambientColor;
    gl_FragColor.rgb += specularColor;
    gl_FragColor.a = 1.0;
    
}