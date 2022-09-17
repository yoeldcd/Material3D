
var selectorModel = null;
var glCanvas = null;
var gl = null;

var camera;
var ligth;
var objects;
var model;
var material;
var materials;

var objLoader = null;
var shaderLoader = null;
var cameraControl = null;

var shader;
var attribs;
var uniforms;

var numInstances = 0;
var lastInstances = 0;
var matrix;
var frame;

var screenWidth = window.screen.innerWidth;
var screenHeight = window.screen.innerHeight;
var screenRatio = screenWidth / screenHeight;

function main() {

    //get DOM references
    glCanvas = document.getElementById('glCanvas');
    selectorModel = document.getElementById('selectorModel');
    selectorInstances = document.getElementById('selectorInstances');

    //get canvas WEBGL render context
    gl = glCanvas.getContext('webgl') || glCanvas.getContext('experimental-webgl');

    //create a perspective camera
    camera = new Camera();
    camera.distance = 10;
    camera.omega = 25;
    camera.orbite();

    //load a shader files
    shaderLoader = new ShaderLoader();
    shader = shaderLoader.loadShaderFiles(gl, 'shaders/vertex.glsl', 'shaders/fragment.glsl');

    if (shader !== null) {

        gl.useProgram(shader);

        //get attributes and enable it's
        attribs = new AttributesSet(shader);
        attribs.add(gl, 'vertexPosition', 'coords');
        attribs.add(gl, 'vertexNormal', 'normals');
        attribs.add(gl, 'vertexTexCoords', 'texels');
        attribs.add(gl, 'vertexMetadata', 'metadata');

        gl.enableVertexAttribArray(attribs.coords);
        gl.enableVertexAttribArray(attribs.normals);
        gl.enableVertexAttribArray(attribs.texels);
        gl.enableVertexAttribArray(attribs.metadata);

        //get uniforms
        uniforms = new UniformsSet(shader);
        uniforms.addStructArray(gl, 'materials', 'materials', ['Kd', 'Ns', 'd', 'mapKd'], 64);
        uniforms.add(gl, 'mtransform', 'umtransform');
        uniforms.add(gl, 'mview', 'umview');
        uniforms.add(gl, 'viewCoords', 'uviewCoords');

        //create camera event listeners
        cameraControl = camera.generateControl();
        cameraControl.createMoveEvent(glCanvas);
        cameraControl.createZoomEvent(glCanvas);

        //create camera move loock event listener
        glCanvas.addEventListener('click', function () {
            cameraControl.controlMoveEnable = !cameraControl.controlMoveEnable;
        });

        //get render screen size
        updateScreenSettings();
        window.onresize = updateScreenSettings;

        performGL();
        selectModel();

    } else {
        console.error('Unloaded shaders');
    }

}

function updateScreenSettings() {
    screenWidth = window.innerWidth;
    screenHeight = window.innerHeight;
    screenRatio = screenWidth / screenHeight;

    glCanvas.style.cssText = 'width: ' + screenWidth + 'px; height: ' + screenHeight + 'px;';

    //update control screen size
    cameraControl.screenWidth = screenWidth;
    cameraControl.screenHeight = screenHeight;
    cameraControl.alphaSpeed = screenWidth / 360 * 3;
    cameraControl.omegaSpeed = screenHeight / 180 * 3;

    //send default uniforms
    camera.projection.ratio = screenRatio;
    camera.update();
}

function animate() {
    frame = requestAnimationFrame(animate);

    if (camera.updated | !cameraControl.controlMoveEnable) {
        gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

        if (camera.updated) {
            camera.setToGPU(gl, uniforms.umview, uniforms.uviewCoords);
            camera.updated = false;
        }

        for (var i = 0; i < numInstances; i++) {
            matrix = objects[i].transformMatrix;

            //transform instance matrix
            if (i > 0) {
                mat4.rotateAroundY(matrix, 1);
            } else if (!cameraControl.controlMoveEnable) {
                mat4.rotateAxisY(matrix, 1);
            } else {
                ;
            }

            gl.uniformMatrix4fv(uniforms.umtransform, false, matrix);
            model.draw(gl);
        }
    }
}

function pause() {
    cancelAnimationFrame(frame);
}

function performGL() {
    //configure render cotext
    gl.viewport(0, 0, glCanvas.width, glCanvas.height);
    gl.clearColor(0, 0.5, 0.5, 1);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT);

}

function prepareModel() {
    model.prepare(gl, attribs, uniforms.materials);
}

function random(min, max) {
    return Math.random() * (max - min) + min;
}

function randomize(num, inice) {

    inice || (inice = 0);
    numInstances = (num !== undefined) ? num : numInstances;

    //increase array length
    if (inice < 1)
        objects = new Array(numInstances - inice);
    else
        objects.length = numInstances;

    for (var i = inice; i < numInstances; i++) {
        if (i > 0)
            objects[i] = new Instance('Entity', random(-10, 10) - model.bounds.centerX, random(-10, 10) - model.bounds.centerY, random(-10, 10) - model.bounds.centerZ);
        else
            objects[i] = new Instance('mainEntity', -model.bounds.centerX, -model.bounds.centerY, -model.bounds.centerZ);

    }

}

var name;
var scale;
var words;

function selectModel() {
    objLoader = new OBJModelLoader();
    words = selectorModel.value.split(' | ');
    name = words[0];
    scale = words[1] || 1;


    pause();

    if (name.length > 0) {

        //clear unused memory
        if (model) {
            model.destroy(gl);
        }

        model = objLoader.loadOBJFile(gl, '../../models/' + name, name, scale);

        //make random instances
        randomize(1);

        //prepare model to draw
        setTimeout(prepareModel, 10000);
        setTimeout(prepareModel, 100000);
        prepareModel();

        //reset camera
        cameraControl.controlMoveEnable = false;
        camera.alpha = 0;
        camera.omega = 0;
        camera.distance = 10;
        camera.orbite();
        
    } else {
        numInstances = parseInt(selectorInstances.value);
        numInstances <= 0 ? numInstances = 1 : numInstances;

        //make random instances
        randomize(numInstances, lastInstances);
        lastInstances = numInstances;
        
        camera.updated = true;
    }

    animate();
    selectorModel.value = '';
    selectorInstances.value = 1;
}

function changeInstanceNumber() {
    numInstances = parseInt(selectorInstances.value);
    numInstances <= 0 ? numInstances = 1 : numInstances;

    //make random instances
    randomize(numInstances, lastInstances);

    lastInstances = numInstances;
    camera.updated = true;
}