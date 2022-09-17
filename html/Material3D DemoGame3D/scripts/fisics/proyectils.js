
var PROYECTIL_MODEL;
var PROYECTIL_SPEED;
var PROYECTIL_POWER;
var PROYECTIL_DELAY;
var PROYECTIL_DOUBLE;
var PROYECTIL_TRIPLE;
var GENERATE_NEW_PROYECTILES;

var projectiles;
var proyectilesDelayControl;

function prepareProyectiles() {
    //create proyectils animators instance
    proyectiles = new IterableList();
    proyectilesDelayControl = new Delayer(PROYECTIL_DELAY);

}

function initializeProyectilsGroup() {

    if (PROYECTIL_TRIPLE) {
        initializeProyectilInstance(1, 0, 0.5);
        initializeProyectilInstance(0, 0, -0.5);
        initializeProyectilInstance(-1, 0, 0.5);

    } else if (PROYECTIL_DOUBLE) {
        initializeProyectilInstance(1, 0, 0.5);
        initializeProyectilInstance(-1, 0, 0.5);

    } else {
        initializeProyectilInstance(0, 0, 0);

    }

}

function initializeProyectilInstance(px, py, pz) {
    var proyectil;
    var node;
    var listSRC = elements;
    var listDST = proyectiles;

    if (!listSRC.isEmpty()) {

        //get list node instance
        node = listSRC.getNode();
        proyectil = node.data;

        //initialize proyectil cinematics
        proyectil.enable = true;
        proyectil.type = PROYECTIL_MODEL;
        proyectil.state = PROYECTIL_POWER;

        proyectil.geometry.moveTo(px + user.geometry.x, py + user.geometry.y, pz + user.geometry.z);
        proyectil.geometry.width = 1;
        proyectil.geometry.height = 1;
        proyectil.geometry.depth = 2;
        
        proyectil.scale = 0.2;

        proyectil.alpha = 0;
        proyectil.beta = 90;
        proyectil.omega = 0;

        proyectil.speedX = 0.0;
        proyectil.speedY = 0.0;
        proyectil.speedZ = -PROYECTIL_SPEED;

        proyectil.speedAlpha = 0;
        proyectil.speedBeta = 0;
        proyectil.speedOmega = 5;

        //move node instance and jump iterator to next
        listDST.addNode(node);
        listSRC.next();
    }
}

function resetProyectil(proyectil, list) {
    proyectil.enable = false;
    list.moveNodeTo(elements);    //move node instance inter lists
}

function deleteProyectiles() {
    GENERATE_NEW_PROYECTILES = false;

    if (!proyectiles.isEmpty()) {
        do {
            proyectiles.moveNodeTo(elements).data.enable = false;
        } while (proyectiles.next());
    }
}

function evalProjectils() {

    var proyectil;
    var colitioned;
    var list = proyectiles;

    //eval proyectil live cicle
    if (!list.isEmpty()) {
        do {
            proyectil = list.get();
            colitioned = evalProyectil2ObstaclesColition(proyectil);

            if (colitioned) {
                //reset colitioned proyectil
                resetProyectil(proyectil, list);

            } else {
                //reset or animate proyectil
                if (proyectil.geometry.z <= (user.geometry.z - 50))
                    resetProyectil(proyectil, list);
                else
                    proyectil.animate();

            }
        } while (list.next());  //eval any proyectiles on list

    }   //end if not empty

    //enabling new proyectiles
    if (GENERATE_NEW_PROYECTILES && proyectilesDelayControl.isTime()) {
        initializeProyectilsGroup();
    }

}

function evalProyectil2ObstaclesColition(proyectil) {
    var obstacle;
    var colitioned;
    var hasColition;
    var list = obstacles;

    colitioned = false;
    if (!list.isEmpty()) {
        do {
            obstacle = list.get();
            if (obstacle.state > 0) {
                hasColition = obstacle.geometry.hasColition(proyectil.geometry);

                if (hasColition) {
                    obstacle.state -= proyectil.state; //decrease obstacle strengh

                    //destroy anulated obstacle instance on scene 
                    if (obstacle.state <= 0)
                        destroyObstacle(obstacle);

                }   //end if has colition

                colitioned |= hasColition;
            }   //end if obstacle enable

        } while (list.next());  //end do-while eval proyectil to obstacle on the list

    }   //end if not empty

    return colitioned;
}
