
var numLevel;
var evalDelayControl;
var evalGameUser;
var requestCameraUpdate;

var evalLoop;
var animators;
var elements;
var gameLimits;

var progress;
var gameScreenWidth;
var gameScreenHeight;
var gameScreenRatio;

var gameMessage = {
    type: '...',
    data: null,
    meta: null
};
var usingWorker;

//preparing game thread worker
try {
    importScripts(
            '../../../../js/lib/Geometry/Geometry.js',
            '../../../../js/lib/Geometry/Entity.js',
            '../../../../js/lib/Geometry/Sphere3D.js',
            '../../../../js/lib/Geometry/Box3D.js',
            '../../../../js/lib/Fisics/Animator.js',
            '../../../../js/lib/Delayer.js',
            '../../../../js/lib/IterableList.js',
            'user.js',
            'proyectils.js',
            'obstacles.js',
            'potencers.js'
            );
    self.onmessage = onGUIMessage;
    usingWorker = true;

} catch (exception) {
    console.error(exception);
    usingWorker = false;

}

function prepareGameLevelElements() {

    progress = 0;

    //create game evaluation delay control
    evalDelayControl = new Delayer(30);
    gameLimits = new Box3D(40, 40, 200);

    //create all scene elements instaces
    animators = new Array(100);
    elements = new IterableList();
    
    for (var i = 0; i < 100; i++) {
        animators[i] = new Animator(new Box3D(0.5), gameLimits);
        elements.add(animators[i]);
    }

    //create game elements
    prepareUser();
    prepareProyectiles();
    prepareObstacles();
    preparePotencers();

}

function prepareGameLevel(level) {

    numLevel = level;

    GENERATE_NEW_OBSTACLES = true;
    GENERATE_NEW_PROYECTILES = true;

    //pause game thread execution
    sendMessageToGUI('STOP_RENDER');
    stopEvalLoop();

    if (numLevel > 0) {

    } else {

        USER_MODEL = 0;

        PROYECTIL_MODEL = 2;
        PROYECTIL_DELAY = 500;
        PROYECTIL_SPEED = 1;
        PROYECTIL_POWER = 3;
        PROYECTIL_DOUBLE = false;
        PROYECTIL_TRIPLE = true;

        OBSTACLE_DELAY = 5000;
        OBSTACLE_SPEED = 0.1;
        OBSTACLE_MAX_POWER = 10;

        sendMessageToGUI('UPDATE_CAMERA_FOCUS', [0, 0, 0]);
        sendMessageToGUI('UPDATE_CAMERA');

    }

    //prepare game interface and elements
    sendMessageToGUI('GAME_MENU');
    sendMessageToGUI('UPDATE_PROGRESS', [0]);
    prepareGameLevelElements();

    //run game thread execution
    sendMessageToGUI('STAR_RENDER');
    startEvalLoop();

}

function increaseProgress() {
    progress++;
    sendMessageToGUI('UPDATE_PROGRESS', progress);
}

function evalGameLevel() {

    if (evalDelayControl.isTime()) {

        //select evaluateds objects
        evalObstacles();
        evalProjectils();

        if (evalGameUser)
            evalUser();

        updateSceneElements();

    }

}

function startEvalLoop() {
    evalLoop || (evalLoop = setInterval(evalGameLevel, 40));
}

function stopEvalLoop() {
    evalLoop = clearInterval(evalLoop);
}

function lossGameLevel() {
    evalGameUser = false;
    deleteProyectiles();
    sendMessageToGUI('LOSS_MENU');

}

function whinGameLevel() {
    evalGameUser = false;
    deleteObestacles();
    sendMessageToGUI('WHIN_MENU');

}

function pauseGameLevel() {
    stopEvalLoop();

    sendMessageToGUI('STOP_RENDER');
    sendMessageToGUI('PAUSE_MENU');
}

function resumeGameLevel() {
    startEvalLoop();

    sendMessageToGUI('STAR_RENDER');
    sendMessageToGUI('GAME_MENU');
}

function finishGameLevel() {

    stopEvalLoop();

    //delete all objects types instances on scene
    deleteProyectiles();
    deleteObstacles();
    deleteUser();

    updateSceneElements();
    sendMessageToGUI('STOP_RENDER');
    sendMessageToGUI('CLEAR_RENDER');
    sendMessageToGUI('MAIN_MENU');

}

function resetGameLevel() {
    prepareGameLevel(numLevel);
}

function updateSceneElements() {
    
    var count = 0;
    var animator;
    var sortMaxAnimatorIndex;
    var sortMaxAnimatorTypeValue;
    var elements = new Float32Array(800);
    
    //sort animators by type to minimize model initializations fragmentation
    for (var i = 0; i < 100; i++) {
        sortMaxAnimatorIndex = 0;
        sortMaxAnimatorTypeValue = animators[0].type;

        //select new max value and index
        for (var j = 1; j < (100 - i); j++) {
            animator = animators[j];

            if (animator.type > sortMaxAnimatorTypeValue) {
                sortMaxAnimatorTypeValue = animator.type;
                sortMaxAnimatorIndex = j;
            }
        }

        //interchange animators on max and last index
        animator = animators[99 - i];
        animators[99 - i] = animators[sortMaxAnimatorIndex];
        animators[sortMaxAnimatorIndex] = animator;
    }

    for (var i = 0; i < 100; i++) {     //update scene instances of each visible objects
        animator = animators[i];

        if (animator.enable) {

            //store instances properties only if is enable (visible)
            elements[count * 8] = animator.geometry.x;       //element position X
            elements[count * 8 + 1] = animator.geometry.y;   //element position Y
            elements[count * 8 + 2] = animator.geometry.z;   //element position Z
            elements[count * 8 + 3] = animator.alpha;   //element angle X
            elements[count * 8 + 4] = animator.beta;    //element angle Y
            elements[count * 8 + 5] = animator.omega;   //element angle Z
            elements[count * 8 + 6] = animator.scale;   //element scale
            elements[count * 8 + 7] = animator.type;    //element type id
            count++;

        } //end if isEnable

    }   //end for

    sendMessageToGUI('UPDATE_SCENE', elements, count);

    if (requestCameraUpdate) {

        //update camera location and focus
        sendMessageToGUI('UPDATE_CAMERA_FOCUS', [user.geometry.x, 0, user.geometry.z]);
        sendMessageToGUI('UPDATE_CAMERA');

        requestCameraUpdate = false;
    }

}

//GAME - GUI COMUNICATIONs
function onGUIMessage(guiMessage) {

    //console.log('GameThread.guiMessage.data');
    //console.log(guiMessage.data);

    if (usingWorker)
        guiMessage = guiMessage.data;

    switch (guiMessage.type.toUpperCase()) {
        case 'STAR_GAME':
            prepareGameLevel(guiMessage.data[0] || 0);
            break;

        case 'PAUSE_GAME':
            pauseGameLevel();
            break;

        case 'RESUME_GAME':
            resumeGameLevel();
            break;

        case 'RESET_GAME':
            resetGameLevel();
            break;

        case 'FINISH_GAME':
            finishGameLevel();
            break;

        case 'USER_CONTROL':
            controleUser(guiMessage.data);
            break;

        case 'UPDATE_SCREEN_SIZE':
            gameScreenWidth = guiMessage.data[0];
            gameScreenHeight = guiMessage.data[1];
            gameScreenRatio = guiMessage.data[2];
            break;

        case 'TEST':

            break;
    }
}

function sendMessageToGUI(messageType, messageData, messageMeta) {

    gameMessage.type = messageType;
    gameMessage.data = messageData;
    gameMessage.meta = messageMeta;

    if (usingWorker)
        !self || self.postMessage(gameMessage);
    else
        !onGameMessage || onGameMessage(gameMessage);
}