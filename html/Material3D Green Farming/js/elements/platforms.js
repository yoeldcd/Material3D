var platforms = new (function(){
    var game = null;
    var controller = null;
    var self = this;

    this.mapVisible = true;

    this.enviromentBounds = null;

    var matrix = {
        rows: 0,
        cols: 0,
        rowSize: 1,
        colSize: 1,
        originX: 0,
        originY: 0
    };

    var enviroment = {
        rows: 1,
        cols: 1,
        data: [0]
    };

    var skins = {};

    function initializeObj(object) {

        object.vect = MATHGL.VECTOR.makeVector();
        object.matrixCoords = MATHGL.VECTOR.makeVector();

        object.targetY = 0;     
        object.speed = 10.0;     //speed in m/s

        object.geometry.setDimensions(2, 1, 2);
        object.scale.y = 0.5;
		
        object.enviromentGeometry = new M3D.Box(2,100,2);
        
        
    }
	
    
    var debug = 0;
    
    function updateObj(object) {
        var user = game.user.object;
        var geom = object.geometry;
        var ugeom = user.geometry;

        if(object.enviromentGeometry.hasColition(self.enviromentBounds)) {

            //
            if (object.visible && geom.hasColition(ugeom)) {

                // set user around status
                if(user.coords.y >= geom.up) {
                    if(!user.hasAround) {
                        user.hasAround = true;
                        user.coords.y = geom.up + ugeom.dimensions.height / 2;
                    }

                } else {

                    if(!user.reqDirectionChange && user.speed > 0 &&
                       (user.coords.x < object.coords.x ? user.direction.x > 0 : user.direction.x < 0) ||
                       (user.coords.z < object.coords.z ? user.direction.z > 0 : user.direction.z < 0)
                      ){
                        user.reqDirectionChange = true;
                        user.speed = 0;

                    }

                }

            }
            
            // update platform <Y> coord
        	if(object.speed !== 0){
        		object.coords.y += game.animator.delta * object.speed;
        	
            	if((object.speed > 0.0 && object.coords.y >= object.targetY) ||
            	   (object.speed < 0.0 && object.coords.y <= object.targetY)) {
        			object.speed = 0;
        			object.coords.y = object.targetY;
        		
				}       	
        	}
        
            
        } else {

            //here reconfigure enviroment
            //if(true||user.speed !== 0){

                // alocate on new matrix coords
                object.matrixCoords.x += Math.sign(user.direction.x) * matrix.cols;
                object.matrixCoords.y += Math.sign(user.direction.z) * matrix.rows;

                // alocate on new enviroment coords
                object.coords.x = object.matrixCoords.x * matrix.colSize + enviroment.originX;
                object.coords.z = object.matrixCoords.y * matrix.rowSize + enviroment.originZ;            
				
                // asign element model asset
                self.setEnviromentElementValue(object, object.matrixCoords.x, object.matrixCoords.y);
				
                object.enviromentGeometry.update(object);
        
                
            //}
            
        }
		
        
        
    }

    function resetObj(object) {

    }

    this.init = function(igame){
        game = igame;
        game.platforms = this;

        game.models.load('ColorCubes/ColorCubes.obj', 'obj', 1, 'Cube');

        // get model skins indexs
        skins.WHITE_CUBE = game.models.Cube.objects.whiteCube.id;
        skins.RED_CUBE = game.models.Cube.objects.redCube.id;
        skins.GREEN_CUBE = game.models.Cube.objects.greenCube.id;
        skins.BLUE_CUBE = game.models.Cube.objects.blueCube.id;
        skins.YELLOW_CUBE = game.models.Cube.objects.yellowCube.id;

        controller = new M3D.Controller();
        controller.initialize = initializeObj;
        controller.update = updateObj;
        controller.reset = resetObj;

    }

    this.initMatrix = function(rows, cols, rowSize, colSize){

        var leng = rows * cols;
        var name = null;

        // define enviroment matrix values
        matrix.rows = rows;
        matrix.cols = cols;
        matrix.rowSize = rowSize;
        matrix.colSize = colSize;
		
        self.matrix = matrix;
        
        // initialize enviroment bound box limitter
        self.enviromentBounds = new M3D.Box(cols * colSize, 100, rows * rowSize);

        // initialize any enviroments element
        matrix.elements = new Array(leng);
        for(var i = 0; i < rows; i++){
            for(var j = 0; j < cols; j++){

                // make a new enviroment element
                name = 'Cube_' + i + '_' + j;
                obj = new M3D.Object(name, game.models.Cube);
                obj.setController(controller);

                //store new enviroment element
                matrix.elements[i * cols + j] = obj;

                // add enviroment element to scene
                game.objects.add(obj);
            }
        }

    }

    this.setEnviromentElementValue = function(object, col, row){
        var val;
        
        if(col >= 0 && col < enviroment.cols && row >= 0 && row < enviroment.rows){
            val = enviroment.data[enviroment.cols * row + col] || 0;
            //console.log(val);

            // configure enviroment element
            if(val === 0){
            	object.model.objObjectIndex = 3;
                object.targetY = -1;
				
                object.scale.x = 1;
                object.scale.z = 1;

                object.geometry.dimensions.width = 2;
                object.geometry.dimensions.depth = 2;

                
            } else {
                object.model.objObjectIndex = val;
                object.targetY = 1;

                switch(val){
                    case 1:
                        object.scale.x = 1.5;
                        object.scale.z = 0.5;

                        object.geometry.dimensions.width = 3;
                        object.geometry.dimensions.depth = 1;

                        break;
                    case 2:
                        object.scale.x = 0.5;
                        object.scale.z = 1.5;

                        object.geometry.dimensions.width = 1;
                        object.geometry.dimensions.depth = 3;

                        break;
                    default:
                        object.scale.x = 0.5;
                        object.scale.z = 0.5;
                        
                        object.geometry.dimensions.width = 1;
                        object.geometry.dimensions.depth = 1;
                        
                        break;
                    
                        
                }

            }
            
            object.visible = true;
            object.coords.y = -2;
            object.speed = 10.0;

        } else {
        	object.model.objObjectIndex = 0;
            object.visible = true;
            object.coords.y = -2;
            object.targetY = -1;
            
            object.scale.x = 1;
            object.scale.z = 1;
            object.speed = 10;
            
        }
        
        

    };

    this.getEnviromentValue = function(col, row){
        if(col >= 0 && col < enviroment.cols && row >= 0 && row < enviroment.rows)
            return enviroment.data[enviroment.cols * row + col] || 0;
        else
            return NaN;
    }

    this.setEnviromentValue = function(col, row, value){
        if(col >= 0 && col < enviroment.cols && row >= 0 && row < enviroment.rows)
            return enviroment.data[enviroment.cols * row + col] = value || 0;
        else
            return NaN;
    }

    this.makeEnviroment = function(build, rows, cols, centerI, centerJ, steeps) {

        var obj = null;

        // get enviroment matrix dimensions
        rows || (rows = enviroment.rows || 0);
        cols || (cols = enviroment.cols || 0);

        // fix value minor dimensions
        rows < matrix.rows && (rows = matrix.rows);
        cols < matrix.cols && (cols = matrix.cols);

        // get enviroment matrix center
        (!centerI || isNaN(centerI)) && (centerI = rows / 2);
        (!centerJ || isNaN(centerJ)) && (centerJ = cols / 2);

        centerI = Math.ceil(centerI);
        centerJ = Math.ceil(centerJ);

        // compute enviroment submatrix origin
        var originI = centerI - Math.ceil(matrix.rows / 2);
        var originJ = centerJ - Math.ceil(matrix.cols / 2);

        // make enviroment partner
        if(build) {

            // define enviroment values
            enviroment.cols = cols;
            enviroment.rows = rows;
            enviroment.data = new Int32Array(rows * cols);
            enviroment.originX = - cols / 2 * matrix.colSize - matrix.colSize / 2;
            enviroment.originZ = - rows / 2 * matrix.rowSize - matrix.rowSize / 2;
			
            enviroment.data.fill(0);
            self.makePath(centerI, centerJ, steeps, 1, 4);

        }

        self.enviroment = enviroment;

        //console.log('Org I:'+originI + ' - Org J:' + originJ);
        //console.log('Cnt I:'+centerI + ' - Cnt J:' + centerJ);

        // asign initial elements partner values
        for(var i = 0; i < matrix.rows; i++) {
            for(var j = 0; j < matrix.cols; j++) {

                obj = matrix.elements[i * matrix.cols + j];

                // compute elemnt eviroment coord
                col = j + originJ;
                row = i + originI;
                //console.log('I: ' + row + ' - J:' + col);

                // asign default matrix coordinates
                obj.matrixCoords.x = col;
                obj.matrixCoords.y = row;

                // asign default enviroment coordinates
                obj.coords.x = col * matrix.colSize + enviroment.originX;
                obj.coords.y = - 1;
                obj.coords.z = row * matrix.rowSize + enviroment.originZ;
                
                // asign element model asset
                self.setEnviromentElementValue(obj, col, row);
                
                obj.enviromentGeometry.update(obj);
                
            }
        }

        // set user enviroment coords
        game.user.object.coords.x = centerJ * matrix.colSize + enviroment.originX;
        game.user.object.coords.z = centerI * matrix.rowSize + enviroment.originZ;
        self.enviromentBounds.update(game.user.object);

    }

    this.makePath = function(originI, originJ, steeps, complexityMin, complexityMax){

        steeps || (steeps = 1000);
        complexityMin || (complexityMin = 5)
        complexityMax || (complexityMax = 10);

        var t = complexityMin;

        if(complexityMax < complexityMin){
            complexityMin = complexityMax;
            complexityMax = t;

        }

        var complexityRange = complexityMax - complexityMin;

        var di = 0, trendingDi = 0;
        var dj = 0, trendingDj = 0;
        var i = 0;
        var j = 0;
        var val = 0;
        var dir = 0;

        var branchs = [
            [originI, originJ, 0, 1],
            [originI, originJ, 1, 0],
            [originI, originJ, 0, -1],
            [originI, originJ, -1, 0]
        ];
        var branch = null;
        var branchSteeps = 0;
        var nextSteeps = 0;

        var onHorizontal = true;
        var onMainBranch = true;

        console.warn('BEGIN PATH');

        while(-- steeps > 0 && branchs.length != 0){

            // define branth initial values
            branch = branchs.shift();
            //console.log('branth: '+branch);

            i = branch[0];
            j = branch[1];
            trendingDi = branch[2];
            trendingDj = branch[3];
            nextSteeps = 0;

            onHorizontal = trendingDi === 0;

            //build branth
            while(branch !== null && steeps -- > 0){

                if(nextSteeps == 0) {

                    // set path node value 
                    this.setEnviromentValue(i, j, 4);

                    // change build direction values 
                    if(onHorizontal){
                        di = 0;
                        dj = trendingDj || (Math.random() >= 0.5 ? 1 : -1);    

                    } else {
                        di = trendingDi || (Math.random() >= 0.5 ? 1 : -1);    
                        dj = 0; 

                    }

                    // change build direction
                    onHorizontal = !onHorizontal;

                    // define next path steeps
                    nextSteeps = Math.round(Math.random() * complexityRange + complexityMin);

                    // make a new branth on node
                    if(Math.random() > 0.5) {
                        val = Math.random() > 0.5 ? 1 : -1;

                        if(onHorizontal)
                            branchs.push([i, j, dir, 0]) 
                        else
                            branchs.push([i, j, 0, dir]);

                    }

                    //console.log('di: '+di + ' dj: ' + dj + ' nextSteeps: '+nextSteeps);
                    i += di;
                    j += dj;
                    //nextSteeps--;

                } else if(val === 0) {

                    this.setEnviromentValue(i, j, onHorizontal ? 1 : 2);

                    // go foward
                    i += di;
                    j += dj;
                    nextSteeps--;

                } else {

                    // auto - finish branth
                    branch = null;    

                }

                // get current enviroment matrix coord value
                val = this.getEnviromentValue(i, j);

            }

            onMainBranch = false;
        }

    };

   

    var imageCache = null;
    
    this.drawEnviromentMap = function(visible, redraw){

        var ctx = game.gui;
        var x = game.guiCanvas.width - 210;
        var y = game.guiCanvas.height - 210;

        var w = 200;
        var h = 200;

        var rowH = 200 / enviroment.rows;
        var colW = 200 / enviroment.cols;

        ctx.clearRect(x-2, y-2, 210, 210);
        
        if(visible){
            ctx.strokeStyle = game.isNigth ? 'white' : 'black';
            ctx.strokeRect(x, y, 200, 200);
			
            if(redraw || !imageCache){
            
            	ctx.fillStyle = 'blue';
            		ctx.fillText("RENDERING ... ", x + w / 2 - 30, y + h/2);
            	
            //draw
            for(var i = 0; i < enviroment.rows; i++){
                for(var j = 0; j < enviroment.cols; j++){

                    switch(enviroment.data[i * enviroment.cols + j]){
                        case 1:
                            ctx.fillStyle = game.isNigth ? 'darkred' : 'red';
                            break;
                        case 2:
                            ctx.fillStyle = game.isNigth ? 'darkgreen' : 'lime';
                            break;
                        case 3:
                            ctx.fillStyle = game.isNigth ? 'darkblue' : 'blue';
                            break;
                        case 4:
                            ctx.fillStyle = game.isNigth ? 'orange' : 'yellow';
                            break;
                        default:
                            ctx.fillStyle = game.isNigth ? 'black' : 'white';

                    }

                    ctx.fillRect(x + j * colW, y + i * rowH, colW, rowH);

                }
            }
            
            	// save data cache
            	imageCache = ctx.getImageData(x, y, w, h);
            } else {
            	
            	try {
            		// draw data cache
            		ctx.putImageData(imageCache, x, y);
            	} catch(e){
            		ctx.fillStyle = 'red';
            		ctx.fillText("ERROR: "+e.message, x + w / 2 - 20, y + h/2);
            	}
            	
            }

            //get user enviroment matrix coordinates
            var i = Math.round(enviroment.rows * (user.object.coords.z - enviroment.originZ) / (enviroment.rows * matrix.rowSize));
            var j = Math.round(enviroment.cols * (user.object.coords.x - enviroment.originX) / (enviroment.cols * matrix.colSize));

            ctx.strokeStyle = game.isNigth ? 'white' : 'black';
            ctx.strokeRect(x + j * colW - 4, y + i * rowH - 4, 10, 10);

        }

    };

    /*if(uobject.speed > 0){

                    // emulate movement stop conditions
                    MATHGL.VECTOR.diference(object.coords, uobject.coords, this.user2obj);
                    MATHGL.VECTOR.normalize(this.user2obj);
                    dot = MATHGL.VECTOR.dot(uobject.direction, this.user2obj);

                    console.log('user2objDot: ' + dot + ', angle: ' + Math.acos(dot) / Math.PI * 180 + 'deg dir_length ' + MATHGL.VECTOR.length(uobject.direction));

                    if(dot > 0.70) {
                        uobject.coords.x -= uobject.speed * uobject.direction.x * game.animator.delta;
                        uobject.coords.z -= uobject.speed * uobject.direction.z * game.animator.delta;

                        object.model.objObjectIndex = Math.round(Math.random() * 3) + 1;
                        uobject.speed = 0;

                    }

                }*/

});