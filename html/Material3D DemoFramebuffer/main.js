
//DOM
var canvas;
var gl;
var shadowBuffer;

//shader program elements
var shaderLoader;

var renderVertexShaderURL = '../../shaders/render/vertex.glsl';
var renderFragmentShaderURL = '../../shaders/render/fragment.glsl';
var renderShaderID = 1;
var renderShader;

var shadowVertexShaderURL = '../../shaders/shadow/vertex.glsl';
var shadowFragmentShaderURL = '../../shaders/shadow/fragment.glsl';
var shadowShaderID = 2;
var shadowShader;

//render uniforms locations
var mtransformUniformLocation;
var mcameraUniformLocation;
var mprojectionUniformLocation;
var mcameraShadowUniformLocation;
var mprojectionShadowUniformLocation;
var ligthCoordinatesUniformLocation;
var mapKdUniformLocation;
var mapKsUniformLocation;
var mapKaUniformLocation;
var mapBumpUniformLocation;

//shadow uniforms locations
var mtransformUniformLocationShadow;
var mcameraUniformLocationShadow;
var mprojectionUniformLocationShadow;

//vertex attribs
var renderAttribs;
var shadowAttribs;

//shader matrixs
var mtransform = mat4.createMat4();
var pmtransform = mat4.createMat4();
var mcamera = mat4.createMat4();
var mprojection = mat4.createMat4();
var mcameraShadow = mat4.createMat4();
var mprojectionShadow = mat4.createMat4();

//model geometry
var models;
var objLoader;
var materials;
var mtlLoader;

//importeds URLs
var objURLs = [
    '../../models/plane/plane.obj',
    '../../models/cube/cube.obj'
];

var mtlURLs = [
    '../../models/plane/plane.mtl',
    '../../models/cube/cube.mtl'
];

function main() {

    canvas = document.getElementById('gl');
    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    if (gl) {
        console.log('%cObtained WEBGL Context', 'color: lime; background: black');

        //initialize matrixs
        mat4.scale(pmtransform, 2.0, 2.0, 2.0);
        mat4.project(mprojection, 45, false, 800 / 500, 0.1, 10.0);
        mat4.cameraMat4(mcamera, 2, 2, 5, 0, 0, 0, 0, 1, 0);
        mat4.project(mprojectionShadow, 45, false, 1.0, 0.1, 10.0);
        mat4.cameraMat4(mcameraShadow, 0, 3, 5, 0, 0, 0, 0, 1, 0);
        
        shaderLoader = new ShaderLoader();
        shaderLoader.loadShadersFiles(gl, renderVertexShaderURL, renderFragmentShaderURL, shaderCallBack, renderShaderID);
        shaderLoader.loadShadersFiles(gl, shadowVertexShaderURL, shadowFragmentShaderURL, shaderCallBack, shadowShaderID);

    } else {
        alert('Cant be obtain WebGL Context');
    }

}

var loadedShaders = 0;
var error = false;
function shaderCallBack(shader, id) {
    loadedShaders++;

    //store shader by id
    if (shader) {
        switch (id) {
            case renderShaderID:
                renderShader = shader;
                break;
            case shadowShaderID:
                shadowShader = shader;
                break;
        }

    } else {
        error = true;
    }

    //start geometry load
    if (loadedShaders === 2) {
        if (!error)
            prepareGeometry();
        else
            console.error('Error loading shaders');

    }

}

function prepareGeometry() {

    console.log('Shaders has been loaded. \n Preparing models.');

    //initialize models data loaders
    objLoader = new OBJParser();
    mtlLoader = new MTLParser();

    //get and enable render shader attribs
    renderAttribs = new VertexAttribsSet();
    renderAttribs.vertexPositions = gl.getAttribLocation(renderShader, 'vertexPositions');
    renderAttribs.vertexNormals = gl.getAttribLocation(renderShader, 'vertexNormals');
    renderAttribs.vertexTextureCoords = gl.getAttribLocation(renderShader, 'vertexTextureCoords');

    //get and enable shadow shader attribs
    shadowAttribs = new VertexAttribsSet();
    shadowAttribs.vertexPositions = gl.getAttribLocation(shadowShader, 'vertexPositions');
    
    initializeShadersElements();
    
    //create hide framebuffer
    shadowBuffer = new FrameBuffer(gl);

    //load required model materials
    mtlLoader.loadMTLFiles(gl, mtlURLs, function (materialsArray) {
        materials = materialsArray;

        //load required model geometrys
        objLoader.materials = materials;
        objLoader.loadOBJFiles(gl, objURLs, function (modelsArray, error) {
            models = modelsArray;

            draw();
        }, 0.5);

    });

}

function initializeShadersElements(){
    
    //get render shader uniforms locations
    gl.useProgram(shadowShader);
    mtransformUniformLocationShadow = gl.getUniformLocation(shadowShader, 'mtransform');
    mcameraUniformLocationShadow = gl.getUniformLocation(shadowShader, 'mcamera');
    mprojectionUniformLocationShadow = gl.getUniformLocation(shadowShader, 'mprojection');
    
    //define render shader uniforms values
    gl.uniformMatrix4fv(mtransformUniformLocationShadow, false, mtransform);
    gl.uniformMatrix4fv(mcameraUniformLocationShadow, false, mcameraShadow);
    gl.uniformMatrix4fv(mprojectionUniformLocationShadow, false, mprojectionShadow);
    
    
    //get render shader uniforms locations
    gl.useProgram(renderShader);
    
    mtransformUniformLocation = gl.getUniformLocation(renderShader, 'mtransform');
    mcameraUniformLocation = gl.getUniformLocation(renderShader, 'mcamera');
    mprojectionUniformLocation = gl.getUniformLocation(renderShader, 'mprojection');
    
    mcameraShadowUniformLocation = gl.getUniformLocation(renderShader, 'mcameraShadow');
    mprojectionShadowUniformLocation = gl.getUniformLocation(renderShader, 'mprojectionShadow');
    
    ligthCoordinatesUniformLocation = gl.getUniformLocation(renderShader, 'ligthCoords');
    
    mapKdUniformLocation = gl.getUniformLocation(renderShader, 'map_Kd');
    mapKsUniformLocation = gl.getUniformLocation(renderShader, 'map_Ks');
    mapKaUniformLocation = gl.getUniformLocation(renderShader, 'map_Ka');
    mapBumpUniformLocation = gl.getUniformLocation(renderShader, 'map_bump');
    
    //define render shader uniforms value
    gl.uniformMatrix4fv(mtransformUniformLocation, false, mtransform);
    gl.uniformMatrix4fv(mcameraUniformLocation, false, mcamera);
    gl.uniformMatrix4fv(mprojectionUniformLocation, false, mprojection);
    
    gl.uniformMatrix4fv(mcameraShadowUniformLocation, false, mcameraShadow);
    gl.uniformMatrix4fv(mprojectionShadowUniformLocation, false, mprojectionShadow);
    
    gl.uniform3f(ligthCoordinatesUniformLocation, 0, 0, -100);

    gl.uniform1i(mapKdUniformLocation, 1);
    gl.uniform1i(mapKsUniformLocation, 2);
    gl.uniform1i(mapKaUniformLocation, 3);
    gl.uniform1i(mapBumpUniformLocation, 4);
    
    

}

var y = 5;
function drawShadow() {
    
    gl.useProgram(shadowShader);
    
    mat4.cameraMat4(mcameraShadow, 0, y, 5, 0, 0, 0, 0, 1, 0);
    gl.uniformMatrix4fv(mcameraUniformLocationShadow, false, mcameraShadow);
    y -= 0.01;
    
    shadowBuffer.enable(gl);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    drawScene(models[0], shadowAttribs, mtransformUniformLocationShadow);

    shadowBuffer.disable(gl);
    
}

function drawRender() {
    var model;
    
    gl.viewport(0, 0, 800, 500);
    gl.clearColor(0.2, 0.2, 0.2, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(renderShader);
    gl.uniformMatrix4fv(mcameraShadowUniformLocation, false, mcameraShadow);
    
    
    //active shadow and difuse map textures
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, shadowBuffer.getFrameTexture());
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, mtlLoader.getBlankSamplerMap());
    
    drawScene(models[0], renderAttribs, mtransformUniformLocation);
    
}

function drawScene(model, attribsSet, mtransformUniformLocation){
    
    attribsSet.enableAttribs(gl);
    model.prepare(gl, attribsSet);
    
    mat4.moveTo(pmtransform, 0, 0, 0);
    gl.uniformMatrix4fv(mtransformUniformLocation, false, pmtransform);
    model.drawBuffer(gl);
    
    //model = models[1];
    //model.prepare(gl, renderAttribs);
    
    mat4.moveTo(pmtransform, 0, 0, 2);
    gl.uniformMatrix4fv(mtransformUniformLocation, false, pmtransform);
    model.drawBuffer(gl);
    
}

var frame;
function draw() {
    
    drawShadow();
    drawRender();
    
    mat4.rotateY(mtransform, 1, false);
    frame = requestAnimationFrame(draw);
}