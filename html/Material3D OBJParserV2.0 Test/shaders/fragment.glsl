precision lowp float;
const vec3 ligthCoords = vec3(0.0, 10.0, 10.0);

varying vec3 coords;
varying vec3 normal;
varying vec4 difuse;
varying float specularNicest;
varying float ditther;

uniform sampler2D mapKd;
uniform vec3 viewCoords;

vec3 ligth2surface;
vec3 view2surface;
vec3 view2ligth;

float ligthValue;

void main() {
    
    gl_FragColor = difuse.a == 0.0 ? vec4(difuse.rgb, 1.0) : texture2D(mapKd, difuse.xy);
    ligth2surface = ligthCoords - coords;
    view2surface = viewCoords - coords;
    
    if(gl_FragColor.a == 0.0)
        discard;
    
    //compute difuse value
    ligthValue = max(dot(normal, normalize(ligth2surface)), 0.0);
    gl_FragColor.rgb *= ligthValue * 0.5 + 0.5;
    
    //compute specular value
    view2ligth = normalize(ligth2surface + view2surface);
    ligthValue = pow(max(dot(normal, view2ligth), 0.0), specularNicest) * ligthValue;
    gl_FragColor.r += ligthValue;
    gl_FragColor.g += ligthValue;
    gl_FragColor.b += ligthValue;
    
    gl_FragColor.a = 1.0;
}