
// this module has control of game execution workflow
var game = new (function(){
    var game = this;

    // define game components
    this.models = null;
    this.scene = null;
    this.legths = null;
    this.camera = null;
    this.renderer = null;
    this.aniatror = null;
    this.fps = null;

    this.objects = null;
    this.events = null;
    this.screen = null;
    this.user = null;

    this.glCanvas = null;
    this.guiCanvas = null;
    this.gl = null;
    this.gui = null;

    // define debug state
    this.isDebuging = true;
    
    this.isNigth = false;
    
    this.init = function (glCanvas, guiCanvas){

        // initialize game scene and components storage
        this.scene = new M3D.Scene();
        this.objects = {}; 
        this.ligths = {};

        // initialize game camera
        this.camera = new M3D.Camera();
        this.camera.setCoords(0, 0, 0);
        this.camera.projection = new M3D.Camera.PerspectiveProjection(45, 1, 0.1, 100);

        // make animation stat's tools
        this.animator = new M3D.Animator();
        this.fps = new M3D.FPSCounter();

        this.glCanvas = glCanvas;
        this.guiCanvas = guiCanvas;

        // make game renderer, configure and clear screen
        this.renderer = new M3D.SceneRenderer(this.glCanvas);
        this.renderer.setClearColor(0.7, 0.7, 0.8);
        this.renderer.clearScreen();

        // get render contexts
        this.gl = this.renderer.gl;
        this.gui = this.guiCanvas.getContext('2d');

        this.screen = {
            width: glCanvas.width,
            height: glCanvas.height,
            ratio: glCanvas.width / glCanvas.height
        };

        return this;
    };

    this.makeScene = function(){
        
        // make a global ambiental ligth source
        this.ligths.ambient = new M3D.Ligth('AMBIENT', M3D.Ligth.AMBIENTAL);
        this.ligths.ambient.setColor(0.5, 0.5, 0.5);
        this.ligths.ambient.setEnable(true);
        
        // make a sum point ligth source
        this.ligths.sum = new M3D.Ligth('MAIN', M3D.Ligth.DOTTED);
        this.ligths.sum.setColor(0.5, 0.5, 0.5);
        this.ligths.sum.setCoords(0, 100, 0);
        this.ligths.sum.setEnable(true);
        
        // make user spot lintern ligths
        this.ligths.lintern = new M3D.Ligth('LINTERN', M3D.Ligth.SPOT);
        this.ligths.lintern.setColor(0.5, 0.5, 0.5);
        this.ligths.lintern.setAngle(15);
        
        // add any scene ligths sources
        this.scene.addLigth(this.ligths.ambient);
        this.scene.addLigth(this.ligths.sum);
        this.scene.addLigth(this.ligths.lintern);
        
        var density = parseInt(prompt('density: ', 100)||0);
        
        // add any scene objects
        this.user.makeUser();
        this.platforms.initMatrix(20, 20, 2, 2);
        this.platforms.makeEnviroment(true, density, density, NaN, NaN, density * 20);
        
        this.flash = false;
        
    }

    // reset game state
    this.reset = function(){

    };

    // begin or continue game state
    this.play = function(){
        this.fps.reset();
        this.animator.startAnimation(this.render);
    };

    // stop current game state
    this.pause = function(){
        this.fps.reset();
        this.animator.stopAnimation();
    };

    this.render = function(){

        // show frame rate
        if(game.isDebuging && game.fps.countFrame()){
            game.fps.showFPSRatesGraph(game.gui, 50, 300);
            
            if(game.platforms.mapVisible)
                game.platforms.drawEnviromentMap(true);
                
        } else {
            game.renderer.clearScreen();

        }

        // clean and draw
        game.renderer.clearScreen();
        game.renderer.drawScene(game.scene, game.camera);
        
        // update
        game.scene.updateObjects();
        
    };

})();

