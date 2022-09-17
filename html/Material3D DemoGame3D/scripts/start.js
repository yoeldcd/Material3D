
var gameWorker;
var usingWorker;
var numLevel;

function initializeGameTasks(){
    
    //initialice game worker thread
    if (useGameThread) {
        try {
            gameWorker = new Worker('scripts/fisics/game.js');
            gameWorker.onmessage = onGameMessage;

            usingWorker = true;
        } catch (exception) {
            usingWorker = false;

        }
    }
    
    getGameLevel();
    sendMessageToGame('UPDATE_SCREEN_SIZE', [screenWidth, screenHeight, screenRatio]);
}

function getGameLevel(){
    numLevel = 0;
}

//GUI - GAME  COMUNICATIONs
function onGameMessage(gameMessage) {

    //console.log('MainThread.gameMessage.data');
    //console.log(gameMessage.data);

    //get worker shared message packed data
    if (usingWorker)
        gameMessage = gameMessage.data;

    //select message action command
    switch (gameMessage.type.toUpperCase()) {

        case 'MAIN_MENU':
            mainMenuGUI();
            break;

        case 'GAME_MENU':
            mainGameGUI();
            break;

        case 'PAUSE_MENU':
            pauseMenuGUI();
            break;

        case 'LOSS_MENU':
            lossMenuGUI();
            break;

        case 'WHIN_MENU':
            whinMenuGUI();
            break;

        case 'UPDATE_SCENE':
            updateSceneObjects(gameMessage.data, gameMessage.meta);
            break;

        case 'STOP_RENDER':
            stopRenderLoop();
            break;

        case 'STAR_RENDER':
            starRenderLoop();
            break;

        case 'CLEAR_RENDER':
            clearRender();
            break;

        case 'DEFINE_CLEAR_COLOR':
            performClearColor(gameMessage.data);
            break;

        case 'DRAW_RENDER':
            drawRenderFrame();
            break;

        case 'UPDATE_CAMERA_LOCATION':
            updateCameraLocation(gameMessage.data);
            break;

        case 'UPDATE_CAMERA_FOCUS':
            updateCameraFocus(gameMessage.data);
            break;

        case 'UPDATE_CAMERA_SETTINGS':
            updateCameraSettings(gameMessage.data);
            break;

        case 'UPDATE_CAMERA_PERFORM':
            updateCameraPerform(gameMessage.data);
            break;

        case 'UPDATE_CAMERA':
            updateCamera();
            break;

        case 'UPDATE_PROGRESS':
            updateProgress(gameMessage.data);
            break;

    }

}

var guiMessage = {
    type: '...',
    data: null,
    meta: null
};
function sendMessageToGame(messageType, messageData, messageMeta) {

    guiMessage.type = messageType;
    guiMessage.data = messageData;
    guiMessage.meta = messageMeta;

    //post message to worker
    if (usingWorker)
        gameWorker.postMessage(guiMessage);
    else
        onGUIMessage(guiMessage);
    
}

