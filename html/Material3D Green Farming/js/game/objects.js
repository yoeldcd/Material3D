
var objects = new (function () {
    var game = null;
    var objects = null;
    
    this.init = function(igame){
        game = igame;
        game.objects = this;
        
        // initialize a objects reference storage
        this.objects = {};
    }
    
    this.add = function(obj){
        // add object to scene and create an reference with key NAME
        if(!this.objects[obj.name]){
            game.scene.addObject(obj);
            this.objects[obj.name] = obj;
            
        }
        
        return obj;
    }
    
    this.remove = function(obj){
        // remove object of scene and delete an reference with key NAME
        game.scene.removeObject(obj);
        delete this.objects[obj.name];
        
    }
    
    this.removeAll = function(){
        var iterator = game.scene.objects.iterate();
        var object;
        
        // clear scene and reset objects reference storage
        scene.removeAllObjects();    
        this.objects = {};
        
    }
    
}) ();