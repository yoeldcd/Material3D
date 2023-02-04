
var modelRoot = "models/";

var canvasGL, canvas2D;
var renderer, context2D;
var outputCamera, frameCamera;
var scene;
var shader;
var fpsCounter;
var outputFramebuffer;

var framebufferRenderOptions = {};
var outputRenderOptions = {};

var object1, object2, object3, object4, object5;
var objectL2, objectL3, objectL4, objectL5;
var ligthAmb, ligth1, ligth2, ligth3, ligth4, ligth5;
var requestsNumber;

function main() {

    //get output canvases
    canvasGL = document.getElementById('glCanvas');
    canvas2D = document.getElementById('guiCanvas');

    //create renderer and 2DContext
    renderer = new M3D.SceneRenderer(canvasGL);
    context2D = canvas2D.getContext('2d', { alpha: true });
    //////////////////////

    outputFramebuffer = new M3D.OutputFramebuffer(renderer, 100, 100);
    framebufferRenderOptions.outputFramebuffer = outputFramebuffer;
    framebufferRenderOptions.depthTestEnable = true;
    framebufferRenderOptions.cullFaceEnable = true;
    framebufferRenderOptions.blendEnable = false;
    framebufferRenderOptions.executeDrawCalls = true;

    outputRenderOptions.cullFaceEnable = false;

    shader = OBJModelLoader.getOBJRenderShader(renderer.gl);
    renderer.storeRenderShader(shader, 'OBJRenderShader');

    scene = new M3D.Scene();
    fpsCounter = new M3D.FPSCounter();

    outputCamera = new M3D.Camera("Camera");
    outputCamera.ratio = canvasGL.width / canvasGL.height;

    frameCamera = new M3D.Camera("FrameCamera");

    //create screen size change listener
    window.onresize = function () {
        outputCamera.computeOutputScreenRatio(window.innerWidth, window.innerHeight);
        renderer.setOutputResolution();
    };
    window.onresize();

    //create stats event listener
    document.onvisibilitychange = function () {
        if (document.hidden) {
            pause();
        } else {
            drawScene();
        }
    };

    loadSceneModels(scene);
    createSceneElements();

}

function loadSceneModels(scene) {
    OBJModelLoader.requestAsync = false;
    scene.addModel(OBJModelLoader.loadOBJFile(renderer.gl, modelRoot + "Cube/Cube.obj", 1.0), "cube");
    scene.addModel(OBJModelLoader.loadOBJFile(renderer.gl, modelRoot + "Cylinder/Cylinder.obj", 1.0), "cylinder");
    scene.addModel(OBJModelLoader.loadOBJFile(renderer.gl, modelRoot + "IconoSphere/IconoSphere.obj", 1.0), "iconosphere");
    scene.addModel(OBJModelLoader.loadOBJFile(renderer.gl, modelRoot + "Sphere/Sphere.obj", 1.0), "sphere");
    scene.addModel(OBJModelLoader.loadOBJFile(renderer.gl, modelRoot + "Torus/Torus.obj", 1.0), "torus");
    scene.addModel(OBJModelLoader.loadOBJFile(renderer.gl, modelRoot + "ColorCubes/ColorCubes.obj", 1.0), "colorcubes");
    //scene.addModel(OBJModelLoader.loadOBJFile(renderer.gl, modelRoot + "Ship1/Ship1.obj", 1.0), "ship1");

}

function createSceneElements() {

    var cube = scene.getModel('cube');
    var colorcubes = scene.getModel('colorcubes');
    var iconosphere = scene.getModel('iconosphere');
    var cylinder = scene.getModel('cylinder');
    var sphere = scene.getModel('sphere');
    var torus = scene.getModel('torus');
    //var ship1 = scene.getModel('ship1');

    //
    outputCamera.setCoords(0, 0, 10);
    outputCamera.setTargetCoords(0, 0, 0);

    frameCamera.setCoords(0, 0, 10);
    frameCamera.setTargetCoords(0, 0, 0);


    //make scene objects and declare its properties
    //////////////////////////////////
    object1 = new M3D.Object("ICONOSPHERE", iconosphere);
    object1.model.model.materials[0].difuseColor = new Float32Array([0.9, 0, 0.8]);
    object1.setCoords(0, 2, 0);
    object1.visible = true;

    object2 = new M3D.Object("SPHERE", sphere);
    object2.model.model.materials[0].difuseColor = new Float32Array([0.1, 0.8, 0.2]);
    object2.setCoords(-2, 0, 0);
    object2.visible = true;

    object3 = new M3D.Object("TORUS", torus);
    object3.model.model.materials[0].difuseColor = new Float32Array([0.9, 0.2, 0.2]);
    object3.setCoords(2, 0, 0);
    object3.visible = true;

    object4 = new M3D.Object("CYLINDER", cylinder);
    object4.model.model.materials[0].difuseColor = new Float32Array([0, 0.5, 0.8]);
    object4.setScale(0.5);
    object4.setCoords(0, -2, 0);
    object4.visible = true;

    cube.samplers.difuseSampler = outputFramebuffer.frame;
    cube.materials[0].difuseMap = new Float32Array([0, 0, 1, 1]);
    object5 = new M3D.Object("CUBE", cube);
    object5.visible = true;
    //////////////////////////////////

    //Make asosiated ligth objects
    //////////////////////////////////
    objectL2 = new M3D.Object("LIGTH_2", colorcubes);
    objectL2.model.objObjectIndex = 1;
    objectL2.setScale(-0.1);
    objectL2.visible = true;

    objectL3 = new M3D.Object("LIGTH_3", colorcubes);
    objectL3.model.objObjectIndex = 2;
    objectL3.setScale(-0.1);
    objectL3.visible = true;

    objectL4 = new M3D.Object("LIGTH_3", colorcubes);
    objectL4.model.objObjectIndex = 3;
    objectL4.setScale(-0.1);
    objectL4.visible = true;

    objectL5 = new M3D.Object("LIGTH_4", colorcubes);
    objectL5.model.objObjectIndex = 0;
    objectL5.setScale(-0.1);
    objectL5.visible = true;
    //////////////////////////////////

    //make scene ligths and enable its
    //////////////////////////////////
    ligth1 = new M3D.Ligth("AMBIENT", M3D.Ligth.AMBIENTAL);
    ligth1.setColor(0.5, 0.5, 0.5);
    ligth1.enable = true;

    ligth2 = new M3D.Ligth("SPOT1", M3D.Ligth.SPOT);
    ligth2.setColor(1, 0, 0);
    ligth2.setCoords(0, 0, 5);
    ligth2.setAngle(10);
    ligth2.enable = true;

    ligth3 = new M3D.Ligth("SPOT2", M3D.Ligth.SPOT);
    ligth3.setColor(0, 1, 0);
    ligth3.setCoords(0, 5, 0);
    ligth3.setAngle(10);
    ligth3.enable = true;

    ligth4 = new M3D.Ligth("SPOT3", M3D.Ligth.SPOT);
    ligth4.setColor(0, 0, 1);
    ligth4.setCoords(5, 0, 0);
    ligth4.setAngle(10);
    ligth4.enable = true;

    ligth5 = new M3D.Ligth("SPOT4", M3D.Ligth.SPOT);
    ligth5.setColor(1, 1, 1);
    ligth5.setCoords(7, 0, 0);
    ligth5.setAngle(25);
    ligth5.enable = true;
    //////////////////////////////////

    //add objects to scene
    scene.addObject(object1);
    scene.addObject(object2);
    scene.addObject(object3);
    scene.addObject(object4);
    scene.addObject(object5);
    scene.addObject(objectL2);
    scene.addObject(objectL3);
    scene.addObject(objectL4);
    scene.addObject(objectL5);

    //add ligths
    scene.addLigth(ligth1);
    scene.addLigth(ligth2);
    scene.addLigth(ligth3);
    scene.addLigth(ligth4);
    scene.addLigth(ligth5);

    //draw scene
    drawScene();
}

var time = 0;
var frame;
var oscilator = false;
function drawScene() {

    var cos = Math.cos(time);
    var vect;
    time += 0.01;
    oscilator = !oscilator;

    //call next frame request
    frame = window.requestAnimationFrame(drawScene);

    if (fpsCounter.countFrame()) {
        fpsCounter.showFPSRatesGraph(context2D, 20, 260);
    }

    fpsCounter.showFPSIntervalsGraph(context2D, 20, 360);

    //RENDERIZE SCENE

    object5.visible = false;
    renderer.setClearColor(0, 0, 0, 0);
    renderer.drawScene(scene, frameCamera, framebufferRenderOptions);

    object5.visible = true;
    renderer.setClearColor(0, 0, 0, 1);
    renderer.drawScene(scene, outputCamera, outputRenderOptions);

    /////////////////////////////////////

    //UPDATE OBJECTS
    object1.rotation.x++;
    object1.update();

    object2.rotation.y++;
    object2.update();

    object3.rotation.z++;
    object3.update();

    object4.coords.y = Math.abs(cos) * 0.2 - 2;
    object4.update();

    object5.update();
    /////////////////////////////////////

    //UPDATE LIGTH OBJECTS
    vect = ligth2.coords;
    MATHGL.VECTOR.rotateY(vect, 2, false);
    objectL2.coords.set(vect[0], vect[1], vect[2]);
    objectL2.update();

    vect = ligth3.coords;
    MATHGL.VECTOR.rotateX(vect, 2, false);
    objectL3.coords.set(vect[0], vect[1], vect[2]);
    objectL3.update();

    vect = ligth4.coords;
    MATHGL.VECTOR.rotateZ(vect, 2, false);
    objectL4.coords.set(vect[0], vect[1], vect[2]);
    objectL4.update();

    vect = ligth5.coords;
    MATHGL.VECTOR.rotateY(vect, -1, false);
    objectL5.coords.set(vect[0], vect[1], vect[2]);
    objectL5.update();
    /////////////////////////////////////

    vect = frameCamera.coords;
    MATHGL.VECTOR.rotateY(vect, 1, false);
    MATHGL.VECTOR.rotateX(vect, -1, false);
    frameCamera.update();


}

function pause() {
    frame = cancelAnimationFrame(frame);
    fpsCounter.reset();
}
