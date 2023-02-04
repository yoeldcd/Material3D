var user = new (function(){
    var game = null;
    var controller = null;

    function initializeObj(object) {
        object.direction = MATHGL.VECTOR.makeVector();
        object.targetVect = MATHGL.VECTOR.makeVector();

        object.speedValue = 7.0;    // mts/s
        object.speedAlpha = 180;    // deg/s
        object.deltaAlpha = 90;

        object.geometry.setDimensions(1, 1, 1);
        object.lintern = game.ligths.lintern;
        object.visible = true;
        
        resetObj(object);
    }

    function updateObj(object) {

        var dist = 0.25;

        // update direction and rotation
        if(object.alpha !== 0){

            // rotate y axis
            if(object.alpha > 0 && object.rotation.y < object.angle)
                object.rotation.y += object.alpha * game.animator.delta;
            else if(object.alpha < 0 && object.rotation.y > object.angle)
                object.rotation.y += object.alpha * game.animator.delta;
            else {
                // fix time delayed 
                object.rotation.y = object.angle;
                object.alpha = 0;   

                // reset and rotate direction vector
                object.direction.x = 0;
                object.direction.y = 0;
                object.direction.z = 1;
                MATHGL.VECTOR.rotateY(object.direction, object.angle, false);

                // fix float pint precision
                object.direction.x = object.direction.x.toFixed(8);
                object.direction.z = object.direction.z.toFixed(8);

                // notify change of direction 
                object.reqDirectionChange = false;

            }

            // reset and rotate target direction vector
            object.targetVect.x = 0;
            object.targetVect.y = 0;
            object.targetVect.z = 1;
            MATHGL.VECTOR.rotateY(object.targetVect, object.rotation.y, false);

            // update ligth direction
            object.lintern.setDirection(object.targetVect.x, - 0.25, object.targetVect.z);

        } else {

            // update [x] and [z] coords
            if(object.alpha == 0 && object.speed !== 0){
                object.coords.x += object.speed * object.direction.x * game.animator.delta;
                object.coords.z += object.speed * object.direction.z * game.animator.delta;
                
            }

        }


        // update [y] coords
        if(object.jumpTime > 0.0) {

            if(object.jumpTime >= 1.0){

                if(object.hasAround){
                    // define initial jump <Y> coord
                    object.jumpY = object.coords.y;

                    // decrease jump time
                    object.jumpTime -= game.animator.delta;

                } else {
                    // autofinish jump
                    object.jumpTime = 0.0;

                }

            } else if(object.jumpTime >= 0.5) {

                // compute in jump <Y> coord
                object.coords.y = object.jumpY + Math.sin(Math.PI * object.jumpTime) * 2.5;

                // decrease jump time
                object.jumpTime -= game.animator.delta;

            } else if (object.jumpTime < 0.5) { 

                // compute in jump <Y> coord
                object.coords.y = object.jumpY + Math.sin(Math.PI * object.jumpTime) * 2.5;

                if(!object.hasAround){
                    // decrease jump time
                    object.jumpTime -= game.animator.delta;

                } else {
                    // autofinish jump
                    object.jumpTime = 0.0;

                    // notify direction implicite change
                    object.reqDirectionChange = false;

                }

            } else {
                object.jumpTime = 0.0;

            }

        } else if(!object.hasAround && object.coords.y > - 2){
            object.coords.y -= 10 * game.animator.delta; //10.0 m/s * delta(0.0, 1.0)

        } else {
            object.hasAround = false;       

        }

        if(object.updated) {

            // update camera
            game.camera.coords.x = object.coords.x - object.targetVect.x * dist;
            game.camera.coords.y = object.coords.y + 20;//dist;
            game.camera.coords.z = object.coords.z - object.targetVect.z * dist;
            game.camera.setTargetCoords(object.coords.x, object.coords.y, object.coords.z);

            //update and ligths
            object.lintern.setCoords(object.coords.x, object.coords.y + 2, object.coords.z);
            
            // update enviroment bounds box
            game.platforms.enviromentBounds.update(object);

        }

    }

    function resetObj(object) {

        object.coords.x = 0;
        object.coords.y = 10;
        object.coords.z = 0;

        object.setScale(0.5);
        object.jumpTime = 0.0;

        object.reqDirectionChange = false;

        object.direction.x = 0;
        object.direction.y = 0;
        object.direction.z = 1;

        object.targetVect.x = 0;
        object.targetVect.y = 0;
        object.targetVect.z = 1;    

        object.lintern.setDirection(0, 0, 1);

        object.rotation.y = 0;
        object.angle = 0;

        object.speed = 0;
        object.alpha = 0;
        object.hasAround = false;
        object.hasUpdated = true;

        object.lastKey = '@';

    }

    function recomputeDirection(object){

    }

    this.init = function(igame){

        game = igame;
        game.user = this;

        // pre-load model asset from entitie
        game.models.load('Tractor OBJ/Tractor.obj', 'obj', 0.05, 'Tractor');

        // make entitie controller
        controller = new M3D.Controller();
        controller.initialize = initializeObj;
        controller.update = updateObj;
        controller.reset = resetObj;

        this.object = null;

    };

    this.makeUser = function(){
        this.object = new M3D.Object('USER', false ? game.models.Tractor : game.models.Cube);
        this.object.setController(controller);

        game.objects.add(this.object);
    }

    this.onkeypress = function(ke){
        var key = ke.key.toUpperCase();
        var object = game.user.object;

        game.isDebuging && console.log('pressed key: '+key);

        switch(key){
            case '6':
                if(object.alpha == 0){
                    object.angle -= object.deltaAlpha;
                    object.alpha = - object.speedAlpha;

                }

                break;

            case '4':
                if(object.alpha == 0){
                    object.angle += object.deltaAlpha;
                    object.alpha = object.speedAlpha;

                }

                break;

            case '2':
                object.angle += 180;
                object.alpha = object.speedAlpha;

                break;

            case 'J':
                // start a jump in <Y> coord
                if(object.jumpTime === 0.0)
                    object.jumpTime = 1.0;

                break;

            case '8':
                if(!object.reqDirectionChange && object.alpha === 0 && object.jumpTime <= 0)
                    object.speed = object.speedValue;
                break;

            case '5':
                object.speed = 0;
                break;

            case '0':
                object.coords.y = 5;
                object.speed = 0;

                break;

            case 'R':
                resetObj(object);
                game.platforms.makeEnviroment(true);

                break;

            case 'M':
                game.platforms.mapVisible = !game.platforms.mapVisible;
                game.platforms.drawEnviromentMap(game.platforms.mapVisible);
                break;

            case 'N':
                game.isNigth = !game.isNigth;
                game.platforms.drawEnviromentMap(game.platforms.mapVisible, true);

                if(game.isNigth){
                    game.renderer.setClearColor(0,0,0)  
                    game.ligths.lintern.enable = true;
                    game.ligths.ambient.enable = false;

                } else {
                    game.renderer.setClearColor(0.7, 0.7, 0.8);
                    game.ligths.lintern.enable = false;
                    game.ligths.ambient.enable = true;    

                }

                break;

            case 'P':
                game.pause();
                break;

        }


    }

    this.onclick = function(me){
        var object = game.user.object;
        
        if(me.clientY <= game.screen.height * 0.33){
        	
        	if(object.coords.y < 0){
				object.coords.y = 10;
				object.speed = 0;
				
        	} else {
        		resetObj(object);
        		game.platforms.makeEnviroment(false);
        		
        		game.user.onkeypress({key: 'N'});
        		
        	}
        	
        } else if(me.clientX >= game.screen.width * 0.75){
            
            if(object.alpha == 0){
                object.angle -= object.deltaAlpha;
                object.alpha = - object.speedAlpha;

            }

        } else if(me.clientX <= game.screen.width * 0.25){
            
            if(object.alpha == 0) {
                object.angle += object.deltaAlpha;
                object.alpha = + object.speedAlpha;

            }
            
        } else {
        	
        	if(object.speed == 0) {
            	object.speed = object.speedValue;
            	
			} else {
				object.speed = 0;
				
			}
			
        }

    };

})();