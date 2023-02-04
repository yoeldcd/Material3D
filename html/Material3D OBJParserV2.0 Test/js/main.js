
var modelsRootFolder = '../../models/';
var particlesRootFolder = '../../particles/';

var selectorModel = null;
var glCanvas = null;
var guiCanvas = null;
var gl = null;
var context2D = null;

var onMovil = false;
var fpsCounter;
var camera;
var ligths;
var objects;
var model;

var sprite;
var generator;

var usedShader;
var OBJShader;
var STLShader;
var DAEShader;
var ParticlesShader;

var particlesGenerator = null;
var shaderLoader = null;
var cameraControl = null;

var numInstances = 0;
var frame = 0;

var time = 0;
var alpha = 0;
var beta = 0;
var ganma = 0;

var screenWidth = window.screen.innerWidth;
var screenHeight = window.screen.innerHeight;
var screenRatio = screenWidth / screenHeight;

function onerrorcall(err){
    alert.error(err);
}

window.onerror = onerrorcall;




function main() {

    //get DOM references
    glCanvas = document.getElementById('glCanvas');
    guiCanvas = document.getElementById('guiCanvas');
    selectorModel = document.getElementById('selectorModel');
    selectorInstances = document.getElementById('selectorInstances');

    //get canvases render contexts
    gl = glCanvas.getContext('webgl') || glCanvas.getContext('experimental-webgl');
    context2D = guiCanvas.getContext('2d', {alpha: true});

    //configure OBJ and STL model loader
    OBJModelLoader.maxSamplerSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) / 2;
    OBJModelLoader.onload = useModel;
    STLModelLoader.onload = useModel;

    OBJModelLoader.requestAsync = true;
    STLModelLoader.requestAsync = true;

    //create particles generators
    radialGenerator = new ParticlesGenerator.RadialGenerator();
    radialGenerator.minSize = 0.1;
    radialGenerator.maxSize = 0.1;

    linealGenerator = new ParticlesGenerator.LinealGenerator([0, 1, 0], [1, 0, 1]);
    linealGenerator.minSize = 0.1;
    linealGenerator.maxSize = 0.1;

    //create used shaders
    OBJShader = OBJModelLoader.getOBJRenderShader(gl);
    STLShader = STLModelLoader.getSTLRenderShader(gl);
    ParticlesShader = ParticlesGenerator.getParticlesRenderShader(gl);

    if (OBJShader && STLShader && ParticlesShader) {

        createScene();
        performGL();
        selectModel();

    } else {
        console.error('Unloaded shaders');
    }

}

function createScene() {
    //create a ligth's
    ligths = [];

    ligths[0] = new M3D.Ligth('AMBIENTAL_LIGTH', M3D.Ligth.AMBIENTAL);
    ligths[0].setColor(0.5, 0.5, 0.5);
    ligths[0].enable = true;

    ligths[1] = new M3D.Ligth('WHITE_SPOT_LIGTH', M3D.Ligth.SPOT);
    ligths[1].enable = true;
    ligths[1].setColor(1, 1, 1);
    ligths[1].setCoords(0, 2, 2);
    ligths[1].setAngle(10);

    ligths[2] = new M3D.Ligth('RED_DOT_LIGTH', M3D.Ligth.DOTTED);
    ligths[2].enable = true;
    ligths[2].setColor(0, 0, 1);
    ligths[2].setCoords(-5, 0.5, 5);

    ligths[3] = new M3D.Ligth('BLUE_DOT_LIGTH', M3D.Ligth.DOTTED);
    ligths[3].enable = true;
    ligths[3].setColor(1, 0, 0);
    ligths[3].setCoords(5, 0.5, 5);

    ligths[4] = new M3D.Ligth('YELLOW_DOT_LIGTH', M3D.Ligth.DOTTED);
    ligths[4].enable = true;
    ligths[4].setColor(1, 1, 0);
    ligths[4].setCoords(0, 0, -5);

    //create a perspective camera
    camera = new M3D.Camera();
    camera.setCoords(0, 0, 2);
    camera.projection.zfar = 100;

    //get render screen size
    updateScreenSettings();
    window.onresize = updateScreenSettings;

    //create stats event listener
    document.onvisibilitychange = function () {
        if (document.hidden) {
            pause();
        } else {
            animate();
        }
    };

    //create FPSCounter
    fpsCounter = new M3D.FPSCounter();
}

function updateScreenSettings() {
    screenWidth = window.innerWidth;
    screenHeight = window.innerHeight;
    screenRatio = screenWidth / screenHeight;

    //resize canvas'es
    glCanvas.style.cssText = 'width: ' + screenWidth + 'px; height: ' + screenHeight + 'px;';
    guiCanvas.style.cssText = 'width: ' + screenWidth + 'px; height: ' + screenHeight + 'px;';

    //send default uniforms
    camera.projection.ratio = screenRatio;

}

var frameTest = false;
function animate() {

    var ntime = new Date().getTime();
    var deltaTime = 0;
    var object;
    
    //compute delay delta time porcentage
    if (time !== 0)
        deltaTime = (ntime - time) / 1000;
    
    time = ntime;

    frameTest && console.group('FRAME_TEST');
    frameTest && console.time('CPU_FRAME_TIME');
    {
        //UPDATE AND SHOW FRAME RATE
        frameTest && console.time('UPDATING_FPSs');
        {
            if (fpsCounter.countFrame()) {
                fpsCounter.showFPSRatesGraph(context2D, 20, 260);
            }

            fpsCounter.showFPSIntervalsGraph(context2D, 20, 360);

        }
        frameTest && console.timeEnd('UPDATING_FPSs');

        //PREPARE MODEL TO RENDERIZE
        frameTest && console.time('PREPARING_MODEl');
        {
            model.prepare(gl, usedShader);
        }
        frameTest && console.timeEnd('PREPARING_MODEl');

        //UPDATE CAMERA
        frameTest && console.time('UPDATING_CAMERA');
        {
            camera.sendToGPU(gl, usedShader.uniforms.camera);
        }
        frameTest && console.timeEnd('UPDATING_CAMERA');

        //UPDATE LIGTHS
        frameTest && console.time('UPDATING_LIGTHs');
        {
            ligths[0].sendToGPU(gl, usedShader.uniforms.ligths ? usedShader.uniforms.ligths[0] : {});
            ligths[1].sendToGPU(gl, usedShader.uniforms.ligths ? usedShader.uniforms.ligths[1] : {});
            ligths[2].sendToGPU(gl, usedShader.uniforms.ligths ? usedShader.uniforms.ligths[2] : {});
            ligths[3].sendToGPU(gl, usedShader.uniforms.ligths ? usedShader.uniforms.ligths[3] : {});
            ligths[4].sendToGPU(gl, usedShader.uniforms.ligths ? usedShader.uniforms.ligths[4] : {});
        }
        frameTest && console.timeEnd('UPDATING_LIGTHs');

        //EXECUTE MODEL DRAW CALLs
        frameTest && console.time('RENDERING_SCENE_OBJECTs');
        {
            //CLEAR SCREEN
            gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

            model.executeDrawCalls(gl);
        }
        frameTest && console.timeEnd('RENDERING_SCENE_OBJECTs');

        //UPDATE OBJECTS
        frameTest && console.time('UPDATING_SCENE_OBJECTs');
        {
            for (var i = 0; i < numInstances; i++) {
                object = objects[i];

                if (i === 0) {
                    object.rotation.x += alpha * deltaTime;
                    object.rotation.y += beta * deltaTime;
                    object.rotation.z += ganma * deltaTime;
                }

                //update in case of Particles System
                if (object.model instanceof ParticlesGenerator.ParticlesSystem.Instance) {
                    object.model.updateParticles(deltaTime);
                }

                object.draw();
            }

            //update objects herarchy on scene
            objects[0].updated = true;
            objects[0].update();
        }
        frameTest && console.timeEnd('UPDATING_SCENE_OBJECTs');
        
    }

    frameTest && console.timeEnd('CPU_FRAME_TIME');
    frameTest && (console.groupEnd('FRAME_TEST'), frameTest = false);

    //send frame request callback
    frame = requestAnimationFrame(animate);

}

function pause() {
    frame = cancelAnimationFrame(frame);
    fpsCounter.reset();
}

function performGL() {

    //configure render cotext
    gl.viewport(0, 0, glCanvas.width, glCanvas.height);
    gl.clearColor(0, 0.5, 0.5, 1);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    //TRANSPARENCE
    //gl.enable(gl.BLEND);
    //gl.blendFunc(gl.SRC_COLOR, gl.ONE_MINUS_SRC_COLOR);

    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT);

}

var newShader;
function selectModel() {

    var words = selectorModel.value.split(' | ');
    var type, fileName, scale, sprites, columns, rows, invertZtoYAxis, useComputedNormal;
    var model = null;

    var cx = glCanvas.width / 2;
    var cy = glCanvas.height / 2;

    if (words.length > 1) {

        type = words[0];
        fileName = words[1];

        //show message
        context2D.fillStyle = 'yellow';
        context2D.fillRect(cx - 100, cy - 20, 200, 40);
        context2D.fillStyle = 'blue';
        context2D.fillText('LOADING ' + type + ' MODEL: ' + fileName, cx - 90, cy - 5);

        console.log('/**************************************************/');

        //clear unused memory
        switch (type) {

            case 'DAE':
                {
                    scale = 1;

                    //load model from file
                    newShader = OBJShader;
                    DAEModelLoader.loadDAEFile(gl, modelsRootFolder + fileName + '/' + fileName + '.dae', scale, function () {})
                }
                break;

            case 'OBJ':
                {
                    //get model properties
                    scale = 1;//parseFloat(words[2] || 1);
                    invertZtoYAxis = words[3] === 'invertedYZ';
                    useComputedNormal = words[4] === 'computeNormal';

                    //load model from file
                    newShader = OBJShader;
                    OBJModelLoader.invertZtoYAxis = invertZtoYAxis;
                    OBJModelLoader.vertexNormalMode = useComputedNormal ? OBJModelLoader.USE_COMPUTED_NORMAL : OBJModelLoader.USE_LOADED_NORMAL;
                    OBJModelLoader.loadOBJFile(gl, modelsRootFolder + fileName + '/' + fileName + '.obj', scale);

                    beta = 45;
                    camera.setCoords(0, 0, 2);
                }
                break;

            case 'ASCII_STL':
                {
                    //get model properties
                    scale = 1;//parseFloat(words[2] || 1);
                    invertZtoYAxis = words[3] === 'invertedYZ';
                    useComputedNormal = words[4] === 'computeNormal';

                    //load model from file
                    newShader = STLShader;
                    STLModelLoader.invertZtoYAxis = invertZtoYAxis;
                    STLModelLoader.vertexNormalMode = useComputedNormal ? STLModelLoader.USE_COMPUTED_NORMAL : STLModelLoader.USE_LOADED_NORMAL;
                    STLModelLoader.loadASCIISTLFile(gl, modelsRootFolder + fileName + '/' + fileName + '-ASCII.stl', scale, useModel);

                    beta = 45;
                    camera.setCoords(0, 0, 2);

                }
                break;

            case 'BINARY_STL':
                {
                    //get model properties
                    scale = 1;//parseFloat(words[2] || 1);
                    invertZtoYAxis = words[3] && words[3] === 'invertedYZ';

                    //load model from file
                    newShader = STLShader;
                    STLModelLoader.invertZtoYAxis = invertZtoYAxis;
                    STLModelLoader.loadBinarySTLFile(gl, modelsRootFolder + fileName + '/' + fileName + '-BINARY.stl', scale, useModel);

                    beta = 45;
                    camera.setCoords(0, 0, 2);
                }
                break;

            case 'RADIAL_PARTICLES':
                {
                    //get model properties
                    rows = parseInt(words[2] || 1);
                    columns = parseInt(words[3] || 1);
                    sprites = parseInt(words[4] || rows * columns);

                    //create particle system
                    newShader = ParticlesShader;
                    sprite = new ParticlesGenerator.SpritesColection(gl, particlesRootFolder + fileName + '.png', rows, columns, sprites);
                    model = ParticlesGenerator.generateParticlesSystem(gl, 300, radialGenerator, sprite);

                    //specify particle system properties
                    model.isLoopeable = words[5] === 'LOOP';
                    model.isResizeable = words[6] === 'RESIZE';
                    model.maxDistance = 0.5;

                    camera.setCoords(0, 0, 2);

                    beta = 0;
                    useModel(model);
                }
                break;

            case 'LINEAL_PARTICLES':
                {
                    //get model properties
                    rows = parseInt(words[2] || 1);
                    columns = parseInt(words[3] || 1);
                    sprites = parseInt(words[4] || rows * columns);

                    //create particle system
                    newShader = ParticlesShader;
                    sprite = new ParticlesGenerator.SpritesColection(gl, particlesRootFolder + fileName + '.png', rows, columns, sprites);
                    model = ParticlesGenerator.generateParticlesSystem(gl, 300, linealGenerator, sprite);

                    //specify particle system properties
                    model.isLoopeable = words[5] === 'LOOP';
                    model.isResizeable = words[6] === 'RESIZE';
                    model.maxDistance = 0.5;

                    camera.setCoords(0, 0, 2);

                    beta = 0;
                    useModel(model);
                }
                break;

        }

    }

    selectorModel.value = '';
    selectorInstances.value = 1;
}

function useModel(newModel) {

    if (newModel !== null) {

        //pause animation render-loop
        pause();

        //destroy last model resources
        if (model) {
            model.unprepare(gl, model.shader);
            model.destroy(gl);
        }

        //redefine used shader
        model = newModel;
        usedShader = newShader;
        model.shader = usedShader;

        //enable used shader
        gl.useProgram(usedShader);

        //make instance (zero to reset)
        randomize(0);

        //rese FrameCounter
        fpsCounter.reset();

        //restore rotation
        alpha = 0;
        ganma = 0;

        //reset camera coords
        document.getElementById('cameraX').value = 0;
        document.getElementById('cameraY').value = 0;
        document.getElementById('cameraZ').value = camera.coords.z / 10 * 100;

        //reset camera filed of view
        document.getElementById('cameraFOV').value = 450;
        camera.projection.fieldOfView = 45;
        camera.setTargetCoords(0, 0, 0);

        //clear message
        context2D.clearRect(glCanvas.width / 2 - 100, glCanvas.height / 2 - 20, 200, 40);

        //delete delta time delay
        time = new Date().getTime();

        //initialize or continue animation render-loop
        animate();

    }
}

function changeInstanceNumber() {
    var newNumInstances = parseInt(selectorInstances.value);

    //make random instances
    pause();
    randomize(newNumInstances, numInstances);
    animate();

}

function random(min, max) {
    return Math.random() * (max - min) + min;
}

var root = null;
function randomize(number) {

    var scale = 1;
    var Sx, Sy, Sz;
    var Px, Py, Pz;

    var object = null;
    var star;

    //compute optime model scale
    /////////////////////////////////////////////////
    if (model.bounds) {
        Sx = 1 / (model.bounds.rigth - model.bounds.left);
        Sy = 1 / (model.bounds.up - model.bounds.down);
        Sz = 1 / (model.bounds.near - model.bounds.far);

        //select minor scale
        if (Sx < Sy && Sx < Sz)
            scale = Sx;
        else if (Sy < Sz)
            scale = Sy;
        else
            scale = Sz;

        //compute centred origin coord
        Px = -model.bounds.centerX * scale;
        Py = -model.bounds.centerY * scale;
        Pz = -model.bounds.centerZ * scale;

    } else {

        Px = 0;
        Py = 0;
        Pz = 0;

    }

    //initialize new instance's on array
    /////////////////////////////////////////////////
    if (!objects) {
        objects = new Array(number);
        star = 0;
    } else {
        star = numInstances;
    }

    if (number === 0) {
        number = 1;
        star = 0;
    }

    if (number > star) {
        //add instances on array
        for (var i = star; i < number; i++) {
            object = new M3D.Object(i, model);

            if (i > 0) {
                objects[i - 1].addChildren(object);
                object.setCoords(random(-5, 5), random(-5, 5), random(-5, 5));
                object.setScale(1);

            } else {
                object.setCoords(Px, Py, Pz);
                object.setScale(scale);
                root = object;
            }

            object.visible = true;
            objects[i] = object;
        }
    } else {

        //delete current instance childrens
        if (number > 0) {
            objects[number - 1].clearChildrens();
        }

    }

    numInstances = number;
}

