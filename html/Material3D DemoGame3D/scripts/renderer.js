
var models;
var performances;
var camera;
var ligths;
var sprites;
var particles;
var objects;
var fpsCounter;
var frameRequest;
var clearColor;

var shaders;
var shaderLoader;

var objParser;
var mtlparser;
var objModels;
var mtlMaterials;

var screenWidth;
var screenHeight;
var screenRatio;
var renderViewportWidth;
var renderViewportHeight;

var visibleObjects;
var requiredPerformanceID;
var currentPerformanceID;
var currentPerformance;
var currentShaderID;
var currentShader;
var currentModelID;
var currentModel;

var transformMatrixUniform;
var cameraViewMatrixUniform;
var cameraProjectionMatrixUniform;

function performGL() {

    performDepthTest(true);
    performCullFace(true);
    performClearColor([0.1, 0.1, 0.5, 1]);

    //perform state functions
    gl.depthFunc(gl.LEQUAL);
    gl.blendFunc(gl.SRC_COLOR, gl.ONE_MINUS_SRC_COLOR);

    //get render viewport size
    renderViewportWidth = glCanvas.width;
    renderViewportHeight = glCanvas.height;

    //get screen size and programe event handler
    updateScreenSize();
    window.onresize = updateScreenSize;

    //clear visible render
    useRenderViewport();
    clearRender();

    //Polyfill para Window.requestAnimationFrame
    window.requestAnimationFrame = window.requestAnimationFrame
            || window.mozRequestAnimationFrame
            || window.webkitRequestAnimationFrame
            || window.msRequestAnimationFrame
            || function (drawCallBack) {
                return setTimeout(drawCallBack, 40);
            };

    //Polyfill para Window.cancelAnimationFrame
    window.cancelAnimationFrame = window.cancelAnimationFrame
            || window.mozCancelAnimationFrame
            || window.webkitCancelAnimationFrame
            || window.msCancelAnimationFrame
            || window.clearTimeout;

    fpsCounter = new FPSCounter();

}

function performClearColor(color) {
    
    color !== undefined || (color = clearColor); 
    clearColor = color;
    
    gl.clearColor(color[0] || 0, color[1] || 0, color[2] || 0, color[3] || 1);
}

function performDepthTest(enable) {
    enable ? gl.enable(gl.DEPTH_TEST) : gl.disable(gl.DEPTH_TEST);
}

function performBlend(enable) {
    enable ? gl.enable(gl.BLEND) : gl.disable(gl.BLEND);
}

function performCullFace(enable) {
    enable ? gl.enable(gl.CULL_FACE) : gl.disable(gl.CULL_FACE);
}

function useRenderViewport() {
    gl.viewport(0, 0, renderViewportWidth, renderViewportHeight);
}

function useRenderClearColor(){
    gl.clearColor(clearColor[0] || 0, clearColor[1] || 0, clearColor[2] || 0, clearColor[3] || 1);
}

function updateScreenSize() {

    screenWidth = window.innerWidth;
    screenHeight = window.innerHeight;
    screenRatio = screenWidth / screenHeight;

    glCanvas.style.cssText = ' width: ' + screenWidth + 'px; \n height: ' + screenHeight + 'px';
    guiCanvas.style.cssText = glCanvas.style.cssText;

    if (interface)
        interface.setSize(screenWidth, screenHeight);

    if (camera)
        updateCamera();

    sendMessageToGame('UPDATE_SCREEN_SIZE', [screenWidth, screenHeight, screenRatio]);

}


function createParticlesSystems() {
    particles = new ParticlesSystem();
    particles.ratio = 0.5;
    particles.setParticlesSpriteImage(gl, document.getElementById('particleSprite1'));
    particles.generateParticlesBuffer(gl, 25);

}

function createBilboardSprites() {
    sprites = new BilboardSprite();
    sprites.spriteTexture = particles.particlesTexture;
    
}

function loadShaders() {
    shaders = new Array(5);
    shaderLoader = new ShaderLoader();
    
    //create and store shaders
    shaders[0] = shaderLoader.loadShaderFiles(gl, "../../shaders/gameShader/vertex.glsl", "../../shaders/gameShader/fragment.glsl");
    shaders[1] = ParticlesSystem.prototype.createParticlesShader(gl);
    shaders[2] = BilboardSprite.prototype.createBilboardShader(gl);

    prepareShader(shaders[0]);
    prepareShader(shaders[2], false, false);
    
    //define default shader
    currentShaderID = 0;
    currentShader = shaders[0];
    gl.useProgram(currentShader);
    
    //define shader master uniforms
    transformMatrixUniform = currentShader.uniforms.umtransform;
    cameraViewMatrixUniform = currentShader.uniforms.umview;
    cameraProjectionMatrixUniform = currentShader.uniforms.umprojection;

}

function prepareShader(shaderProgram, searchAttribs, searchSamplers) {
    
    searchAttribs !== undefined || (searchAttribs = true);
    searchSamplers !== undefined || (searchSamplers = true);
    
    var attribs;
    var uniforms;

    if (shaderProgram) {

        gl.useProgram(shaderProgram);

        attribs = new AttributesSet();
        if (searchAttribs) {
            
            //search vertex attribs uniforms
            attribs.vertexPositions = gl.getAttribLocation(shaderProgram, 'vertexPositions');
            attribs.vertexNormals = gl.getAttribLocation(shaderProgram, 'vertexNormals');
            attribs.vertexTextureCoords = gl.getAttribLocation(shaderProgram, 'vertexTextureCoords');
            attribs.vertexMaterialIndex = gl.getAttribLocation(shaderProgram, 'vertexMaterialIndex');
            attribs.enable(gl);
            
        }

        uniforms = new UniformsSet(shaderProgram);
        uniforms.add(gl, 'mtransform', 'umtransform');
        uniforms.add(gl, 'mview', 'umview');
        uniforms.add(gl, 'mprojection', 'umprojection');

        if (searchSamplers) {
            
            //search samplers uniforms
            uniforms.add(gl, 'map_Kd', 'umap_Kd');
            uniforms.add(gl, 'map_Ks', 'umap_Ks');
            uniforms.add(gl, 'map_Ka', 'umap_Ka');
            uniforms.add(gl, 'map_bump', 'umap_bump');

            //define samplers units
            gl.uniform1i(uniforms.umap_Kd, 1);
            gl.uniform1i(uniforms.umap_Ks, 2);
            gl.uniform1i(uniforms.umap_Ka, 3);
            gl.uniform1i(uniforms.umap_bump, 4);

        }

        shaderProgram.attribs = attribs;
        shaderProgram.uniforms = uniforms;

    } else {
        alert("Empty shader received.");

    }

}

function loadMTLMaterials() {
    var mtlURLs = [
        '../../models/F-15C_Eagle/F-15C_Eagle.mtl',
        '../../models/cube/cube.mtl',
        '../../models/missile/missile.mtl'
    ];

    mtlparser = new MTLParser();
    mtlMaterials = mtlparser.loadMTLFiles(gl, mtlURLs);

    storeMTLMaterials(currentShader);
}

function storeMTLMaterials(shader) {
    var length = mtlMaterials.length;
    var arrayName;
    var uniform;
    var material;

    for (var i = 0; i < length; i++) {
        arrayName = 'materials[' + i + ']';
        material = mtlMaterials[i];

        uniform = gl.getUniformLocation(shader, arrayName + '.Kd');
        !uniform || gl.uniform4fv(uniform, material.Kd);
        uniform = gl.getUniformLocation(shader, arrayName + '.Ks');
        !uniform || gl.uniform4fv(uniform, material.Ks);
        uniform = gl.getUniformLocation(shader, arrayName + '.Ka');
        !uniform || gl.uniform4fv(uniform, material.Ka);
        uniform = gl.getUniformLocation(shader, arrayName + '.Ns');
        !uniform || gl.uniform1f(uniform, material.Ns);

    }
}


function loadOBJModels() {

    var objURLs = [
        '../../models/F-15C_Eagle/F-15C_Eagle.obj',
        '../../models/cube/cube.obj',
        '../../models/missile/missile.obj'
    ];

    objParser = new OBJParser();
    objParser.materials = mtlMaterials;
    objModels = objParser.loadOBJFiles(gl, objURLs, 1.0);
}

function createSceneComponents() {
    var object;

    camera = new OrbitalCamera();
    camera.distance = 50;
    camera.alpha = -45;

    ligths = new Array(8);
    ligths[0] = new FocusLigth();
    ligths[1] = new FocusLigth();
    ligths[2] = new FocusLigth();
    ligths[3] = new FocusLigth();
    ligths[4] = new FocusLigth();
    ligths[5] = new FocusLigth();
    ligths[6] = new FocusLigth();
    ligths[7] = new FocusLigth();

    objects = new Array(100);
    for (var i = 0; i < 100; i++) {
        object = new SceneElement();
        objects[i] = object;
    }

}

function storeLigths(shader) {

    var arrayName;
    var uniform;
    var ligth;

    for (var i = 0; i < 8; i++) {
        arrayName = 'ligths[' + i + ']';
        ligth = ligths[i];

        uniform = gl.getUniformLocation(shader, arrayName + '.color');
        !uniform || gl.uniform3f(uniform, ligth.x, ligth.y, ligth.z);
        uniform = gl.getUniformLocation(shader, arrayName + '.coords');
        !uniform || gl.uniform3f(uniform, ligth.red, ligth.green, ligth.blue);
        uniform = gl.getUniformLocation(shader, arrayName + '.invDirection');
        !uniform || gl.uniform3f(uniform, -ligth.dircetionX, -ligth.dircetionY, -ligth.dircetionZ);
        uniform = gl.getUniformLocation(shader, arrayName + '.maxDot');
        !uniform || gl.uniform1f(uniform, Math.cos(ligth.field));

    }
}


function updateSceneObjects(sceneElements, sceneElementsNumber) {
    var sceneObject;
    var matrix;
    var value;
    var i;

    visibleObjects = 0;

    for (i = 0; i < sceneElementsNumber; i++) {
        sceneObject = objects[i];
        sceneObject.visible = true;

        //compute object instance transform matrix
        matrix = sceneObject.matrixTransform;
        mat4.loadIdentity(matrix);
        mat4.moveTo(matrix, sceneElements[i * 8], sceneElements[i * 8 + 1], sceneElements[i * 8 + 2]);
        (value = sceneElements[i * 8 + 3]) === 0 || mat4.rotateX(matrix, value, false);
        (value = sceneElements[i * 8 + 4]) === 0 || mat4.rotateY(matrix, value, false);
        (value = sceneElements[i * 8 + 5]) === 0 || mat4.rotateZ(matrix, value, false);
        value = (sceneElements[i * 8 + 6] || 1);
        mat4.scale(matrix, value, value, value);
        sceneObject.type = sceneElements[i * 8 + 7];

        visibleObjects++;

    }   //end for update sceneObjects

    for (i; i < 100; i++) {
        objects[i].visible = false;
    }   //end for update hide objects

}

var profile = false;
function drawSceneObjects() {
    
    //restore components
    currentPerformanceID = -1;
    currentModelID = -1;
    currentShaderID = -1;
    
    //update particles
    particles.update(gl);
    useRenderClearColor();
    useRenderViewport();
    
    for (var i = 0; i < visibleObjects; i++) {    //draw each visibles objects instances
        requiredPerformanceID = objects[i].type;

        //prepare new perfrmance
        if (currentPerformanceID !== requiredPerformanceID) {
            currentPerformanceID = requiredPerformanceID;
            currentPerformance = performances[currentPerformanceID];

            if(!profile)
                console.log(currentPerformance);
            
            //prepare new shader to draw
            if (currentShaderID !== currentPerformance.requiredShaderID) {
                currentShaderID = currentPerformance.requiredShaderID;
                currentShader = shaders[currentShaderID];
                gl.useProgram(currentShader);

                //define shader master uniforms
                transformMatrixUniform = currentShader.uniforms.umtransform;
                cameraViewMatrixUniform = currentShader.uniforms.umview;
                cameraProjectionMatrixUniform = currentShader.uniforms.umprojection;

                //store camera matrix on shader
                storeCameraMatrixs();

            }

            //prepare new model to draw
            if (currentModelID !== currentPerformance.requiredModelID) {
                currentModelID = currentPerformance.requiredModelID;
                currentModel = models[currentModelID];

                currentModel.prepare(gl, currentShader.attribs);

            }

        }

        //send object instance transform matrix and draw it.
        gl.uniformMatrix4fv(transformMatrixUniform, false, objects[i].matrixTransform);
        currentModel.draw(gl);

    }   //end for draw objects
    
    profile = true;
}

function starRenderLoop() {
    if (frameRequest)
        window.cancelAnimationFrame(frameRequest);

    fpsCounter.reset();
    frameRequest = window.requestAnimationFrame(renderLoop);
}

function stopRenderLoop() {
    if (frameRequest)
        frameRequest = window.cancelAnimationFrame(frameRequest);
}

function drawRenderFrame() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    drawSceneObjects();
}

function clearRender() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function renderLoop() {
    frameRequest = window.requestAnimationFrame(renderLoop);
    updateFrameRate();

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    drawSceneObjects();
}


function updateCameraLocation(cameraLocation) {
    camera.x = cameraLocation[0];
    camera.y = cameraLocation[1];
    camera.z = cameraLocation[2];

}

function updateCameraFocus(cameraFocusedLocation) {
    camera.targetX = cameraFocusedLocation[0];
    camera.targetY = cameraFocusedLocation[1];
    camera.targetZ = cameraFocusedLocation[2];

}

function updateCameraSetting(cameraSettings) {
    camera.distance = cameraSettings[0];
    camera.alpha = cameraSettings[1];
    camera.omega = cameraSettings[2];
}

function updateCameraPerform(cameraPerform) {
    !cameraPerform[0] || (camera.zfar = cameraPerform[0]);
    !cameraPerform[1] || (camera.znear = cameraPerform[1]);
}

function updateCamera() {

    //compute computables camera values
    camera.ratio = screenRatio;
    camera.update();

    storeCameraMatrixs();

}

function storeCameraMatrixs() {

    //store camera matrix
    gl.uniformMatrix4fv(cameraViewMatrixUniform, false, camera.matrixView);
    gl.uniformMatrix4fv(cameraProjectionMatrixUniform, false, camera.matrixProjection);

}


function GLPerformance(name, modelID, shaderID) {

    this.name = name;
    this.requiredModelID = modelID;
    this.requiredShaderID = shaderID;

}

function createPerfrmanceProfiles() {
    
    models = new Array(64);
    models[0] = objModels[0];
    models[1] = objModels[1];
    models[2] = objModels[2];
    models[3] = sprites;
    
    performances = new Array(64);
    performances[0] = new GLPerformance('F-15', 0, 0);
    performances[1] = new GLPerformance('Cube', 1, 0);
    performances[2] = new GLPerformance('Missile', 2, 0);
    performances[3] = new GLPerformance('Explosion', 3, 2);

}



