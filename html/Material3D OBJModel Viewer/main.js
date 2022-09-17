
var canvas;
var gl;
var shaderLoader;
var objParser;
var mtlParser;

var renderShader;
var selectedModel;
var renderedModel;
var renderedSubModel = 0;
var renderedObjectCenter;
var vertexAttribs;
var materials;
var textureBuilder;

var fieldOfView = 45;
var screenRatio = 800 / 500;
var useDeviceOrientation;
var useFastDraw;

//shader uniforms locations
var shaderModeUniformLocation;
var enviromentMapUniformLocation;
var matIndexUniformLocation;
var mTransformUniformLocation;
var mCameraUniformLocation;
var mProjectionUniformLocation;
var mapKdUniformLocation;
var mapKsUniformLocation;
var mapKaUniformLocation;
var mapBumpUniformLocation;

//uniforms matrixs
var mtransform;
var mprojection;
var mcamera;

//useds URLs
var vsURL = '../../shaders/shader1/vertex.glsl';
var fsURL = '../../shaders/shader1/fragment.glsl';

//loaded URLs
var objURL;
var mtlURL;
var scale;

function shaderCallBack(shaderProgram) {

    if (shaderProgram) {

        //prepare shader to use it
        renderShader = shaderProgram;
        gl.useProgram(shaderProgram);

        //create UI event listeners (OF SELECTED MODE)
        useDeviceOrientation = confirm('Use giroscopic control (Only on PHONES)');
        if (useDeviceOrientation) {
            window.addEventListener('deviceorientation', onchangedeviceorientation);
        } else {
            document.addEventListener('keypress', onkeyboard);
            canvas.addEventListener('click', onmouseclick);
            canvas.addEventListener('dblclick', onmousedoubleclick);
            canvas.addEventListener('mousemove', onmousemove);
            canvas.addEventListener('wheel', onmousewheel);
            canvas.addEventListener('touchmove', ontouchmove);
        }

        //define render mode
        useFastDraw = confirm('Use fast draw mode') || false;

        //get shader attribs locations
        vertexAttribs = new VertexAttribsSet();
        vertexAttribs.vertexPositions = gl.getAttribLocation(shaderProgram, 'vertexPositions');
        vertexAttribs.vertexNormals = gl.getAttribLocation(shaderProgram, 'vertexNormals');
        vertexAttribs.vertexTextureCoords = gl.getAttribLocation(shaderProgram, 'vertexTextureCoords');
        vertexAttribs.vertexMaterialIndex = gl.getAttribLocation(shaderProgram, 'vertexMaterialIndex');
        vertexAttribs.vertexObjectIndex = gl.getAttribLocation(shaderProgram, 'vertexObjectIndex');
        vertexAttribs.enableAttribs(gl);

        //get shader uniforms locations
        matIndexUniformLocation = gl.getUniformLocation(renderShader, 'materialIndex');
        mTransformUniformLocation = gl.getUniformLocation(renderShader, 'mtransform');
        mProjectionUniformLocation = gl.getUniformLocation(renderShader, 'mprojection');
        mCameraUniformLocation = gl.getUniformLocation(renderShader, 'mcamera');
        mapKdUniformLocation = gl.getUniformLocation(renderShader, 'map_Kd');
        mapKsUniformLocation = gl.getUniformLocation(renderShader, 'map_Ks');
        mapKaUniformLocation = gl.getUniformLocation(renderShader, 'map_Ka');
        mapBumpUniformLocation = gl.getUniformLocation(renderShader, 'map_bump');
        drawModeUniformLocation = gl.getUniformLocation(renderShader, 'useFastDraw');

        //select model data URL and load
        selectURLs();
        mtlParser = new MTLParser();
        mtlParser.multiTextureMode = !useFastDraw;
        mtlParser.loadMTLFile(gl, mtlURL, mtlCallback); //end material callback

    }
}

function mtlCallback(response) {

    materials = response;
    
    objParser = new OBJParser();
    objParser.debug = true;
    objParser.materials = response;
    objParser.loadOBJFile(gl, objURL, objCallback, scale);  //end model callback

}

function objCallback(response) {

    if (response) {

        //initialize render model
        renderedModel = response;
        renderedModel.prepare(gl, vertexAttribs);
        renderedObjectCenter = renderedModel.getObjects()[0].center;

        //store materials
        storeMaterials();
        setInterval(storeMaterials, 10000);
        draw();

    } else {
        alert('Model on URL' + objURL + ' has not loaded. ');

    }


}

function storeMaterials() {

    //send to GPU all materials
    for (var i = 0, metadata, uniform; i < materials.length; i++) {
        materials[i].sendToShader(gl, renderShader, 'materials', i);

        //send material metadata to GPU
        metadata = materials[i].map_Kd_metadata;
        if (metadata instanceof SubSampler) {
            uniform = gl.getUniformLocation(renderShader, 'materials[' + i + '].transform');
            !uniform || gl.uniform4f(uniform, metadata.s, metadata.t, metadata.w, metadata.h);
        }

    }

}

function main() {
    canvas = document.getElementById('gl');
    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (gl) {

        console.log('%cWeb GL obtained', 'color: lime');

        //configure Rnder Context
        gl.viewport(0, 0, 800, 500);
        gl.clearColor(0.0, 0.3, 0.5, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);

        //create shader matrixs
        mtransform = mat4.createMat4();
        mcamera = mat4.createMat4();
        mprojection = mat4.createMat4();

        //configure shader matrixs
        mat4.cameraMat4(mcamera, 0, 0, 5, 0, 0, 0, 0, 1, 0);
        mat4.project(mprojection, fieldOfView, false, screenRatio, 0.1, 100.0);

        //load shaders
        shaderLoader = new ShaderLoader();
        shaderLoader.loadShadersFiles(gl, vsURL, fsURL, shaderCallBack);

    } else {
        alert('cant we Web GL obtained');
    }

}

var frame;
function draw() {

    //clear screen
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //send matrixs to shader
    gl.uniformMatrix4fv(mTransformUniformLocation, false, mtransform);
    gl.uniformMatrix4fv(mCameraUniformLocation, false, mcamera);
    gl.uniformMatrix4fv(mProjectionUniformLocation, false, mprojection);
    gl.uniform1i(mapKdUniformLocation, 1);
    gl.uniform1i(mapKsUniformLocation, 2);
    gl.uniform1i(mapKaUniformLocation, 3);
    gl.uniform1i(mapBumpUniformLocation, 4);
    gl.uniform1i(drawModeUniformLocation, useFastDraw ? 1 : 0);

    //renderize model
    if (useFastDraw) {
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, mtlParser.getSamplerBuilder().getTexture());
        renderedModel.drawBuffer(gl);
        //renderedModel.drawModelObject(gl, renderedSubModel, false);

    } else {
        renderedModel.draw(gl);

    }

    frame = requestAnimationFrame(draw);
}

function zoomMax() {

    //select incremet scale
    if (fieldOfView > 20)
        fieldOfView -= 5;
    else if (fieldOfView > 2)
        fieldOfView--;
    else if (fieldOfView > 0.2)
        fieldOfView -= 0.01;
    else if (fieldOfView > 0.02)
        fieldOfView -= 0.001;
    else
        ;

    mat4.loadIdentity(mprojection);
    mat4.project(mprojection, fieldOfView, false, screenRatio, 0.1, 100.0);

}

function zoomMin() {

    //select decrement scale
    if (fieldOfView < 0.1)
        fieldOfView += 0.001;
    else if (fieldOfView < 1)
        fieldOfView += 0.01;
    else if (fieldOfView < 20)
        fieldOfView++;
    else if (fieldOfView < 180)
        fieldOfView += 5;
    else
        ;

    mat4.loadIdentity(mprojection);
    mat4.project(mprojection, fieldOfView, false, screenRatio, screenRatio, 100.0);

}

var x = null;
var y = null;
var x1 = null;
var y1 = null;
var add = 180 / 50;
var tadd = 0.1;
function onmousemove(me) {

    //cast mouse canvas position to GL coords
    x1 = parseInt((me.clientX / me.target.width) * 100 - 50);
    y1 = parseInt((me.clientY / me.target.height) * 100 - 50);

    tadd = fieldOfView / 100;

    if (x !== null && y !== null) {

        if (me.buttons === 1) {

            //console.log(x1+' : '+y1)

            if (x1 < x) {
                mat4.rotateY(mtransform, add, false);
            } else if (x1 > x) {
                mat4.rotateY(mtransform, -add, false);
            }

            if (y1 < y) {
                mat4.rotateX(mtransform, add, false);
            } else if (y1 > y) {
                mat4.rotateX(mtransform, -add, false);
            }

        } else if (me.ctrlKey || me.buttons === 2) {

            if (x1 < x) {
                mat4.translate(mtransform, -tadd, 0, 0);
            } else if (x1 > x) {
                mat4.translate(mtransform, tadd, 0, 0);
            }

            if (y1 < y) {
                mat4.translate(mtransform, 0, tadd, 0);
            } else if (y1 > y) {
                mat4.translate(mtransform, 0, -tadd, 0);
            }

        } else if (me.altKey || me.buttons === (1 | 2)) {
            if (y1 < y) {
                mat4.translate(mtransform, 0, 0, -tadd);
            } else if (y1 > y) {
                mat4.translate(mtransform, 0, 0, tadd);
            }

        } else {
            ;
        }
    }

    x = x1;
    y = y1;

}

function onmouseclick(me) {
    loocked = !loocked;
}

function onmousedoubleclick(me) {

    //reset vertex shader matrixs
    mat4.loadIdentity(mtransform);
    mat4.loadIdentity(mprojection);

    fieldOfView = 45;
    mat4.project(mprojection, fieldOfView, false, screenRatio, 0.1, 100.0);

}

var touchDistance;
var touchDistance1;
var touch0;
var touch1;
var loocked = false;
function ontouchmove(te) {

    te.preventDefault(true);
    touch0 = te.changedTouches[0];
    touch1 = te.changedTouches[1];

    if (!touch1) {
        if (!loocked) {
            touch0.buttons = 1;
            onmousemove(touch0);
        } else {
            touch0.buttons = 2;
            onmousemove(touch0);
        }
    } else {

        touchDistance1 = Math.sqrt(Math.pow(touch1.clientX - touch0.clientX, 2) + Math.pow(touch1.clientY - touch0.clientY, 2));

        if (touchDistance) {
            if (touchDistance1 > touchDistance) {   //pick in zoom more
                zoomMax();
            } else if (touchDistance1 < touchDistance) { //pick out zoom minus
                zoomMin();
            }
        }

        touchDistance = touchDistance1;
    }

}

var delta;
function onmousewheel(we) {
    delta1 = we.deltaY;

    if (delta1 > 0)
        zoomMax();
    else if (delta1 < 0)
        zoomMin();
    else
        ;

}

function onkeyboard(ke) {

    //console.log(e.key);

    switch (ke.key) {
        case '4':
            mat4.rotateY(mtransform, 1, false);

            break;
        case '6':
            mat4.rotateY(mtransform, -1, false);

            break;
        case '8':
            mat4.rotateX(mtransform, 1, false);

            break;
        case '2':
            mat4.rotateX(mtransform, -1, false);

            break;

        case '+':
            zoomMax();
            break;

        case '-':
            zoomMin();
            break;

        case '5':
            //reset vertex shader matrixs
            mat4.loadIdentity(mtransform);
            mat4.loadIdentity(mprojection);

            fieldOfView = 45;
            mat4.project(mprojection, fieldOfView, false, screenRatio, 0.1, 100.0);

            break;
    }

}

function onchangedeviceorientation(orientation) {

    mat4.loadIdentity(mtransform);
    mat4.rotateX(mtransform, orientation.beta - 90, false);
    mat4.rotateY(mtransform, -orientation.gamma, false);

}

function selectURLs() {

    var message = 'Whrite Model Index. 0 - 7';

    selectedModel = parseInt(prompt(message, '0'));

    switch (selectedModel) {
        case 0:
            objURL = 'models/cube/cube.obj';
            mtlURL = 'models/cube/cube.mtl';
            scale = 0.5;

            break;

        case 1:
            objURL = 'models/umbreon/UmbreonHighPoly.obj';
            mtlURL = 'models/umbreon/UmbreonHighPoly.mtl';
            scale = 0.3;

            break;

        case 2:
            objURL = 'models/Airplane_v1_L1.123/11803_Airplane_v1_l1.obj';
            mtlURL = 'models/Airplane_v1_L1.123/11803_Airplane_v1_l1.mtl';
            mat4.rotateX(mtransform, 90, false);
            scale = 0.0005;

            break;

        case 3:
            objURL = 'models/airplane_v2_L2.123/11805_airplane_v2_L2.obj';
            mtlURL = 'models/airplane_v2_L2.123/11805_airplane_v2_L2.mtl';
            mat4.rotateX(mtransform, 90, false);
            scale = 0.001;

            break;

        case 4:
            objURL = 'models/missile/missile.obj';
            mtlURL = 'models/missile/missile.mtl';
            scale = 0.2;

            break;

        case 5:
            objURL = 'models/Lucien_Lilippe_Virginia_Locomotive/OBJ/loco_finale.obj';
            mtlURL = 'models/Lucien_Lilippe_Virginia_Locomotive/OBJ/loco_finale.mtl';
            scale = 0.1;

            break;

        case 6:
            objURL = 'models/New_York_City_Brownstone_Building_v1_L2.67178d22-059b-42f9-ab9d-0eb93d279e84/13940_New_York_City_Brownstone_Building_v1_l2.obj';
            mtlURL = 'models/New_York_City_Brownstone_Building_v1_L2.67178d22-059b-42f9-ab9d-0eb93d279e84/13940_New_York_City_Brownstone_Building_v1_l2.mtl';
            scale = 0.001;

            break;

        case 7:
            objURL = 'models/Amaryllis%20City/Amaryllis%20City.obj';
            mtlURL = 'models/Amaryllis%20City/Amaryllis%20City.mtl';
            scale = 0.00005;

            break;

        case 8:
            objURL = 'models/earth/earth.obj';
            mtlURL = 'models/earth/earth.mtl';
            scale = 0.001;

            break;

        case 9:
            objURL = 'models/CV-EssexClass/essex_scb-125_generic.obj';
            mtlURL = 'models/CV-EssexClass/essex_scb-125_generic.mtl';
            scale = 1;

            break;

        case 10:
            objURL = 'models/F-15C_Eagle/F-15C_Eagle.obj';
            mtlURL = 'models/F-15C_Eagle/F-15C_Eagle.mtl';
            //mat4.rotateX(mtransform, 90, false);
            scale = 0.1;

            break;

        case 11:
            objURL = 'models/T-90/T-90.obj';
            mtlURL = 'models/T-90/T-90.mtl';
            //mat4.rotateX(mtransform, 90, false);
            scale = 0.1;

            break;

        default:
            objURL = 'models/plane/plane.obj';
            mtlURL = 'models/plane/plane.mtl';
            scale = 0.5;

    }

    
    //objURL = 'models/plane/plane.obj';
    //mat4.loadIdentity(mtransform);
    //scale = 0.5;
    
    objURL = '../../' + objURL;
    mtlURL = '../../' + mtlURL;


}
