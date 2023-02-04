
var audioRootPath = '../../audio/';

var canvasGL;
var canvas2D;

var renderer;
var context2D;
var fpsCounter;

var scene;
var camera;
var space;
var soundContext;

var ambientLigth;
var sumLigth;
var objects;

var shadowShader;
var renderShader;
var cubeModel;

var frameID;

var cubesNumber = 0;
var visiblesNumber = 0;
var colitionsNumber = 0;
var sky;

function main() {

    //get output canvases
    canvasGL = document.getElementById('glCanvas');
    canvas2D = document.getElementById('guiCanvas');

    //create renderer and 2DContext
    renderer = new M3D.SceneRenderer(canvasGL);
    context2D = canvas2D.getContext('2d', {alpha: true});
    fpsCounter = new M3D.FPSCounter();
    soundContext = new M3D.SoundContext();
    soundContext.addSoundTrack(new M3D.SoundPool('EXPLOSION', audioRootPath+'explosionSound.ogg', 30));
    /////////////////////////

    //create scene and camera
    scene = new M3D.Scene();
    space = new M3D.Space3D(50, -50, 50, -50, 50, -50, 10, 10, 10);
    camera = new M3D.Camera();
    camera.setCoords(0, 0, 10);
    /////////////////////////
    
    //Create screen resize listener
    window.onresize = function () {
        camera.computeOutputScreenRatio(window.innerWidth, window.innerHeight);
        renderer.setOutputResolution();
    };
    window.onresize();
    /////////////////////////

    //create stats event listener
    document.onvisibilitychange = function () {
        if (document.hidden) {
            pause();
        } else {
            animate();
        }
    };
    ////////////////////////////

    //Create and enable ligths
    ambientLigth = new M3D.Ligth('AMBIENT', M3D.Ligth.AMBIENT);
    ambientLigth.setColor(0.5, 0.5, 0.5);
    ambientLigth.enable = true;

    sumLigth = new M3D.Ligth('SUM', M3D.Ligth.DOTTED);
    sumLigth.setCoords(100, 100, 100);
    sumLigth.enable = true;

    scene.addLigth(ambientLigth);
    scene.addLigth(sumLigth);
    ///////////////////////////

    //create and store models
    cubeModel = OBJModelLoader.loadOBJFile(renderer.gl, 'models/ColorCubes/ColorCubes.obj');
    scene.addModel(cubeModel);
    ///////////////////////////
    
    //create and store objects
    objects = new Array();

    var number = parseInt(prompt("NUMBER: ", 100) || 100);

    number < 0 || number >= 1500 && (number = 1500);
    for (var i = 0; i < number; i++) {
        createCube(Math.random() * 100 - 50, Math.random() * 100 - 50, Math.random() * 100 - 50, Math.round(Math.random() * 3) + 1);
    }
    ///////////////////////////

    animate();
}

function createCube(x, y, z, objObjectIndex) {
    var index = objects.length;
    var object = new M3D.Object('Object-' + index, cubeModel);
    object.setCoords(x, y, z);
    object.visible = true;
    object.update();

    object.model.objObjectIndex = objObjectIndex;
    object.geometry.setDimensions(2, 2, 2);

    //set random direction
    object.randomX = Math.random() >= 0.5 ? 1 : -1;
    object.randomY = Math.random() >= 0.5 ? 1 : -1;
    object.randomZ = Math.random() >= 0.5 ? 1 : -1;

    scene.addObject(object);
    objects[index] = object;
    cubesNumber++;

    return object;
}

var time = 1;
var speedX = 0.1;
var speedY = 0.1;
var speedZ = 0.1;

function draw() {
    var length = objects.length;
    renderer.drawScene(scene, camera);

    if (fpsCounter.countFrame()) {
        fpsCounter.showFPSGraph(context2D, 20, 260);
        time = 0;
    } else {
        time++;
    }

    !(time % 3) && fpsCounter.showFPSIntervalsGraph(context2D, 20, 360);

    visiblesNumber = 0;
    colitionsNumber = 0;
    for (var i = 0, object; i < length - 1; i++) {
        object = objects[i];

        space.getNearObjects(object, function (other) {

            if (object.geometry.hasColition(other.geometry)) {
                if (object.randomX !== other.randomX ||
                        object.randomY !== other.randomY ||
                        object.randomZ !== other.randomZ) {

                    if (i !== 0)
                        object.model.objObjectIndex = other.model.objObjectIndex;

                    object.randomX !== other.randomX && (object.randomX *= -1) && (other.randomX *= -1);
                    object.randomY !== other.randomY && (object.randomY *= -1) && (other.randomY *= -1);
                    object.randomZ !== other.randomZ && (object.randomZ *= -1) && (other.randomZ *= -1);
                    
                    //play efect
                    if(object.visible)
                        soundContext.playSoundTrack('EXPLOSION');
                    
                    colitionsNumber++;
                    return false;

                }

            }

            return true;
        }, 1);

        //update coords
        object.coords.x += object.randomX * speedX;
        object.coords.y += object.randomY * speedY;
        object.coords.z += object.randomZ * speedZ;

        object.rotation.x += object.randomX;
        object.rotation.y += object.randomY;
        object.rotation.z += object.randomZ;

        //evalute object on space bounds
        (object.coords.x <= -30 || object.coords.x >= 30) && (object.randomX *= -1);
        (object.coords.y <= -30 || object.coords.y >= 30) && (object.randomY *= -1);
        (object.coords.z <= -30 || object.coords.z >= 30) && (object.randomZ *= -1);

        object.visible = camera.isObjectVisibile(object);
        if (object.visible)
            visiblesNumber++;

        object.model.sendDrawCall();
        object.update();
    }

    //update entyties boundarys
    window.frameTest && console.time('UPDATING SPACE');
    space.addObjects(scene.objects, true);
    window.frameTest && console.timeEnd('UPDATING SPACE') || (window.frameTest = false);

    if (!(time % 10)) {
        context2D.save();

        //draw visible cubes number

        context2D.fillStyle = 'black';
        context2D.fillRect(240, 35, 100, 15);
        context2D.fillStyle = 'white';
        context2D.fillText(visiblesNumber + ' / ' + cubesNumber + ' CUBES', 250, 50);

        //draw colitions number
        context2D.fillStyle = 'black';
        context2D.fillRect(240, 50, 100, 15);
        context2D.fillStyle = 'white';
        context2D.fillText(colitionsNumber + ' COLITIONS', 250, 60);

        //draw border
        context2D.lineWidth = 4;
        context2D.strokeStyle = 'white';
        context2D.strokeRect(240, 35, 100, 30);

        context2D.restore();
    }

    //MATHGL.VECTOR.rotateY(camera.direction, 0.1, false);

}

function animate() {
    renderer.startAnimation(draw);
}

function pause() {
    //frameID = window.cancelAnimationFrame(frameID);
    renderer.stopAnimation();
    fpsCounter.reset();
}


