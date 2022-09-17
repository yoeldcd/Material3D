
var glCanvas;
var guiCanvas;

var gl;
var gui;

var useMovilMode = confirm('Use movil control mode?');
var useGameThread = confirm('Use game thread?');

function main() {

    //get HTML Canvas Elements of DOM
    glCanvas = document.getElementById('webgl');
    guiCanvas = document.getElementById('gui');

    //get graphics contexts of Canvases
    gl = glCanvas.getContext('webgl') || glCanvas.getContext('experimental-webgl');
    gui = guiCanvas.getContext('2d');

    if (gl) {
        
        //prepare resources
        performGL();
        
        //prepare user interface
        initializeUserInterface();
        initializeGameTasks();
        
        //prepare all functional components
        loadShaders();
        loadMTLMaterials();
        loadOBJModels();
        createParticlesSystems();
        createBilboardSprites();
        createPerfrmanceProfiles();
        createSceneComponents();
        
        //show main menu interface
        mainMenuGUI();

    } else {
        alert('Your browser cant be supported WebGL or Canvas API.\n Update your browser.');

    }

}

