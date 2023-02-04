
// this module has control of any user action events resonses
var events = new (function(){
    var game = null;
    
    this.init = function(igame){
        game = igame;
        game.events = this;
        
    }
    
    function onvisibilitychange (e){
        if (e.target.hidden)
            game.pause();
        else
            game.play();
        
    };
    
    function onresize (){
        
        // get screen dimensions & ratio
        game.screen.width = window.innerWidth;
        game.screen.height = window.innerHeight;
        game.screen.ratio = game.screen.width / game.screen.height;
        
        // update camera projection aspect
        game.camera.projection.ratio = game.screen.ratio;
        
        game.isDebuging && console.log(game.screen.width + 'x'+ game.screen.height);
        
    };
    
    // set any events user listeners handlers
    this.makeEvents = function(){
        
        // make event handler's
        document.addEventListener('visibilitychange', onvisibilitychange);
        window.addEventListener('resize', onresize);
        window.addEventListener('keypress', game.user.onkeypress);
        window.addEventListener('click', game.user.onclick);
        
        // capture initial screen size
        onresize();
    };
    
})();

