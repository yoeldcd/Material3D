
//menu layouts
var interface;
var mainMenuLayout;
var lossMenuLayout;
var gameGUILayout;
var pauseMenuLayout;

//layouts components
var prgCOMPLETED;
var prgFPS;
var txbLEVEL;
var userControlEnable;

function initializeUserInterface() {

    //prepare GUI components
    interface = new GUIFrame(guiCanvas, gui, useMovilMode);
    interface.setSize(screenWidth, screenHeight);

}

function mainMenuGUI() {

    var btnPLAY;
    var btnHELP;

    if (!mainMenuLayout) {
        mainMenuLayout = new GUILayout();
        mainMenuLayout.backgroundColor = null;
        mainMenuLayout.borderColor = null;

        btnPLAY = new GUIButton('PLAY', 50, 60, 40, 10);
        btnPLAY.normalBackgroundColor = null;
        btnPLAY.focusedBackgroundColor = null;
        btnPLAY.normalTextColor = 'rgb(0,255,50)';
        btnPLAY.focusedTextColor = 'rgb(100,255,100)';
        btnPLAY.normalBorderColor = 'white';
        btnPLAY.focusedBorderColor = 'yellow';
        btnPLAY.textSizePorcentage = 60;
        btnPLAY.onclick = function (mouseEvent) {
            sendMessageToGame('STAR_GAME', [numLevel]);

        };

        btnHELP = new GUIButton('HELP', 50, 75, 40, 10);
        btnHELP.normalBackgroundColor = null;
        btnHELP.focusedBackgroundColor = null;
        btnHELP.normalTextColor = 'rgb(0,255,255)';
        btnHELP.focusedTextColor = 'rgb(100,255,255)';
        btnHELP.normalBorderColor = 'white';
        btnHELP.focusedBorderColor = 'yellow';
        btnHELP.textSizePorcentage = 60;
        btnHELP.onclick = function (mouseEvent) {
            sendMessageToGame('STAR_TUTORIAL');

        };

        txbLEVEL = new GUITextBox(null, 50, 20, 40, 8);
        txbLEVEL.textSizePorcentage = 50;
        txbLEVEL.textColor = 'white';
        txbLEVEL.backgroundColor = null;
        txbLEVEL.borderColor = null;

        mainMenuLayout.add(btnPLAY);
        mainMenuLayout.add(btnHELP);
        mainMenuLayout.add(txbLEVEL);

    }

    txbLEVEL.text = 'LEVEL #' + numLevel;
    interface.setLayout(mainMenuLayout);

}

function mainGameGUI() {

    var btnPAUSE;
    var panCONTROL;

    if (!gameGUILayout) {
        gameGUILayout = new GUILayout();
        gameGUILayout.backgroundColor = null;
        gameGUILayout.borderColor = null;

        btnPAUSE = new GUIRoundButton('||', 10, 15);
        btnPAUSE.setSize(50, 50);
        btnPAUSE.slices = 6;
        btnPAUSE.offsetAngle = 0.5;
        btnPAUSE.textSize = 25;
        btnPAUSE.normalTextColor = 'white';
        btnPAUSE.focusedTextColor = 'white';
        btnPAUSE.normalBackgroundColor = null;
        btnPAUSE.focusedBackgroundColor = null;
        btnPAUSE.normalBorderColor = 'white';
        btnPAUSE.focusedBorderColor = 'yellow';
        btnPAUSE.onclick = function () {
            sendMessageToGame('PAUSE_GAME');
            userControlEnable = false;

        };

        prgCOMPLETED = new GUIProgress(50, 10, 20, 3);
        prgCOMPLETED.backgroundColor = null;
        prgCOMPLETED.showText = false;

        panCONTROL = new GUIButton(' ', 50, 50, 100, 100);
        panCONTROL.paint = function () {};
        panCONTROL.onmousemove = function (mouseEvent) {
            if (userControlEnable && mouseEvent.buttons === 1) {
                sendMessageToGame('USER_CONTROL', [mouseEvent.clientX, mouseEvent.clientY]);
            
                particles.x = (mouseEvent.clientX / screenWidth) * 2 - 1;
                particles.y = (mouseEvent.clientY / screenHeight) * 2 - 1;
            }
        };
        panCONTROL.onclick = function (mouseEvent) {
            userControlEnable = !userControlEnable;
        };

        prgFPS = new GUIProgress(75, 10) || new GUITextBox('0 FPS', 75, 10);
        prgFPS.setSize(100, 25);
        prgFPS.fontSize = 21;

        gameGUILayout.add(btnPAUSE);
        gameGUILayout.add(prgCOMPLETED);
        gameGUILayout.add(panCONTROL);
        gameGUILayout.add(prgFPS);

    }

    interface.setLayout(gameGUILayout);
    interface.delay = 40;
    userControlEnable = true;

}

function pauseMenuGUI() {
    var layBLANK;
    var txbTITLE;
    var btnCONTINUE;
    var btnRETRY;
    var btnHOME;

    if (!pauseMenuLayout) {
        pauseMenuLayout = new GUILayout();
        pauseMenuLayout.backgroundColor = null;
        pauseMenuLayout.borderColor = null;

        layBLANK = new GUILayout(50, 50, 34, 60);
        layBLANK.setSize(300, 320);
        layBLANK.borderColor = 'black';
        layBLANK.backgroundColor = 'rgb(50 ,100 ,255)';

        txbTITLE = new GUITextBox('GAME PAUSED.  ', 50, 15, 100, 28);
        txbTITLE.textSizePorcentage = 40;
        txbTITLE.textColor = 'yellow';
        txbTITLE.backgroundColor = null;
        txbTITLE.borderColor = null;

        btnCONTINUE = new GUIButton('CONTINUE', 50, 65, 90, 15);
        btnCONTINUE.textSizePorcentage = 50;
        btnCONTINUE.normalTextColor = 'white';
        btnCONTINUE.focusedTextColor = 'white';
        btnCONTINUE.normalBackgroundColor = 'rgb(100, 100, 255)';
        btnCONTINUE.focusedBackgroundColor = 'rgb(50, 50, 255)';
        btnCONTINUE.focusedBorderColor = 'gray';
        btnCONTINUE.onclick = function () {
            sendMessageToGame('RESUME_GAME');
            userControlEnable = true;

        };

        btnRETRY = new GUIButton('RETRY', 25, 85, 40, 15);
        btnRETRY.textSizePorcentage = 50;
        btnRETRY.normalTextColor = 'white';
        btnRETRY.focusedTextColor = 'white';
        btnRETRY.normalBackgroundColor = 'rgb(0, 255, 0)';
        btnRETRY.focusedBackgroundColor = 'rgb(0, 200, 0)';
        btnRETRY.focusedBorderColor = 'gray';
        btnRETRY.onclick = function () {
            sendMessageToGame('RESET_GAME');
            userControlEnable = true;

        };

        btnHOME = new GUIButton('HOME', 75, 85, 40, 15);
        btnHOME.textSizePorcentage = 50;
        btnHOME.normalTextColor = 'white';
        btnHOME.focusedTextColor = 'white';
        btnHOME.normalBackgroundColor = 'rgb(255, 0, 0)';
        btnHOME.focusedBackgroundColor = 'rgb(200, 0, 0)';
        btnHOME.focusedBorderColor = 'gray';
        btnHOME.onclick = function () {
            sendMessageToGame('FINISH_GAME');
            userControlEnable = false;

        };

        layBLANK.add(btnCONTINUE);
        layBLANK.add(btnRETRY);
        layBLANK.add(btnHOME);
        layBLANK.add(txbTITLE);
        pauseMenuLayout.add(layBLANK);

    }

    interface.delay = 100;
    interface.setLayout(pauseMenuLayout);

}

function lossMenuGUI() {

    var layBLANK;
    var txbTITLE;
    var btnRETRY;
    var btnHOME;

    if (!lossMenuLayout) {
        lossMenuLayout = new GUILayout();
        lossMenuLayout.backgroundColor = null;
        lossMenuLayout.borderColor = null;

        layBLANK = new GUILayout(50, 50, 34, 60);
        layBLANK.setSize(300, 320);
        layBLANK.borderColor = 'black';
        layBLANK.backgroundColor = 'rgb(255 ,200 ,100)';

        txbTITLE = new GUITextBox('GAME OVER. ', 50, 15, 100, 28);
        txbTITLE.textSizePorcentage = 45;
        txbTITLE.textColor = 'red';
        txbTITLE.backgroundColor = null;
        txbTITLE.borderColor = null;

        btnRETRY = new GUIButton('RETRY', 25, 85, 40, 15);
        btnRETRY.textSizePorcentage = 50;
        btnRETRY.normalTextColor = 'white';
        btnRETRY.focusedTextColor = 'white';
        btnRETRY.normalBackgroundColor = 'rgb(0, 255, 0)';
        btnRETRY.focusedBackgroundColor = 'rgb(0, 200, 0)';
        btnRETRY.normalBorderColor = 'white';
        btnRETRY.focusedBorderColor = 'yellow';
        btnRETRY.onclick = function () {
            sendMessageToGame('RESET_GAME');
            userControlEnable = true;

        };

        btnHOME = new GUIButton('HOME', 75, 85, 40, 15);
        btnHOME.textSizePorcentage = 50;
        btnHOME.normalTextColor = 'white';
        btnHOME.focusedTextColor = 'white';
        btnHOME.normalBackgroundColor = 'rgb(255, 0, 0)';
        btnHOME.focusedBackgroundColor = 'rgb(200, 0, 0)';
        btnHOME.normalBorderColor = 'white';
        btnHOME.focusedBorderColor = 'yellow';
        btnHOME.onclick = function () {
            sendMessageToGame('FINISH_GAME');
            userControlEnable = false;

        };

        layBLANK.add(txbTITLE);
        layBLANK.add(btnRETRY);
        layBLANK.add(btnHOME);
        lossMenuLayout.add(layBLANK);

    }

    interface.delay = 100;
    interface.setLayout(lossMenuLayout);

}

function whinMenuGUI() {

}

function updateProgress(progress) {
    prgCOMPLETED.setProgress(progress);
    prgCOMPLETED.paint(interface.graphics);
}

function updateFrameRate() {
    if (fpsCounter.countFrame()) {
        prgFPS.progress = fpsCounter.fps * 100 / 60;
        prgFPS.text = fpsCounter.fps + ' FPS';
        prgFPS.paint(interface.graphics);
    }
}