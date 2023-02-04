
function main() {
    
    // initialize any modules
    game.init(document.getElementById('wglCanvas'), document.getElementById('guiCanvas'));
    models.init(game, '../../models/');
    objects.init(game);
    events.init(game);
    
    user.init(game);
    platforms.init(game);
    
    // initialize scene elements
    game.makeScene();
    
    // initialize user events listeners
    game.events.makeEvents();
    
    // start game loop
    game.play();
    
}

//window.addEventListener('load', main, false);
