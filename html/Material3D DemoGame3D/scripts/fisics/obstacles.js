
var OBSTACLE_SPEED;
var OBSTACLE_MAX_POWER;
var OBSTACLE_DELAY;
var GENERATE_NEW_OBSTACLES;
var OBSTACLE_GROUPS = [
    [
        {x: 5, y: 0, z: -5, omegaSpeed: -2},
        {x: -2.5, y: 0, z: 0},
        {x: 0, y: 0, z: 5, omegaSpeed: 2},
        {x: 2.5, y: 0, z: 0},
        {x: -5, y: 0, z: -5, omegaSpeed: -2}
    ],
    [
        {x: 5, y: 0, z: 5, omegaSpeed: -2},
        {x: -5, y: 0, z: 5, omegaSpeed: -2},
        {x: 5, y: 0, z: -5},
        {x: -5, y: 0, z: -5}
    ],
    [
        {x: 5, y: 0, z: 5},
        {x: 5, y: 0, z: 0},
        {x: 5, y: 0, z: -5},
        {x: -5, y: 0, z: 5},
        {x: -5, y: 0, z: 0},
        {x: -5, y: 0, z: -5},
        {x: 0, y: 0, z: 0}
    ]
];

var obstacles;
var obstaclesDelayControl;

function prepareObstacles() {

    //create obstacles animators instance 
    obstacles = new IterableList();
    obstaclesDelayControl = new Delayer(OBSTACLE_DELAY);

}

function initializeObstacleGroup() {

    var cx = Math.round(Math.random() * 4 - 2) * 10;
    var cz = -30;
    var groupIndex = Math.round(Math.random() * (OBSTACLE_GROUPS.length - 1));
    var array = OBSTACLE_GROUPS[groupIndex];
    var length = array.length;

    //initialize obstacle group instances
    for (var i = 0; i < length; i++) {
        initializeObstacleInstance(cx, 0, cz, array[i]);
    }

}

function initializeObstacleInstance(cx, cy, cz, descriptor) {

    var obstacle;
    var node;
    var listSRC = elements;
    var listDST = obstacles;

    if (!listSRC.isEmpty()) {

        //get list node instance
        node = listSRC.getNode();
        obstacle = node.data;

        //initialize obstacle cinematics
        obstacle.enable = true;
        obstacle.type = isNaN(descriptor.model) ? 1 : descriptor.model;
        obstacle.state = OBSTACLE_MAX_POWER * (descriptor.power || Math.random() + 0.5);
        obstacle.reboot = descriptor.reboot || false;

        obstacle.geometry.moveTo(cx + (descriptor.x || 0), cy + (descriptor.y || 0), cz + (descriptor.z || 0));

        obstacle.geometry.width = (descriptor.w || 2);
        obstacle.geometry.height = (descriptor.h || 2);
        obstacle.geometry.depth = (descriptor.d || 2);
        obstacle.scale = descriptor.scale || 1.0;

        obstacle.speedX = (descriptor.spx || 0);
        obstacle.speedY = (descriptor.spy || 0);
        obstacle.speedZ = OBSTACLE_SPEED;

        obstacle.alpha = descriptor.alpha || 0;
        obstacle.beta = descriptor.beta || 0;
        obstacle.omega = descriptor.omega || 0;

        obstacle.speedAlpha = descriptor.alphaSpeed || 0;
        obstacle.speedBeta = descriptor.betaSpeed || 0;
        obstacle.speedOmega = descriptor.omegaSpeed || 0;

        //move node instance and jump iterator to next
        listDST.addNode(node);
        listSRC.next();
    }

}

function resetObstacle(obstacle, list) {
    obstacle.enable = false;
    list.moveNodeTo(elements);
}

function destroyObstacle(obstacle) {
    increaseProgress();
    obstacle.state = -10;
    obstacle.type = 3;
    obstacle.scale = 2;
    
}

function deleteObstacles() {
    GENERATE_NEW_OBSTACLES = false;

    if (!obstacles.isEmpty()) {
        do {
            obstacles.moveNodeTo(elements).data.enable = false;
        } while (obstacles.next());
    }
}

function evalObstacles() {

    var colitioned;
    var obstacle;
    var list = obstacles;

    if (!list.isEmpty()) {
        do {
            obstacle = list.get();

            //only eval undestroydeds obstacles
            if (obstacle.state > 0) {

                //eval user colition if not is destroyed
                if (user.enable) {
                    colitioned = obstacle.geometry.hasColition(user.geometry);
                    
                    if (colitioned)
                        user.enable = false;

                }

                //update obstacle cinematics
                if (obstacle.geometry.z >= 20)
                    resetObstacle(obstacle, list);
                else
                    obstacle.animate();

            } else if (obstacle.state < -1) {   //case destroyed
                obstacle.state++;
                obstacle.scale += 0.01;

            } else {                            //case deleted
                resetObstacle(obstacle, list);

            }

        } while (list.next());   //eval any obstacles

    }   //end if not empty

    if (GENERATE_NEW_OBSTACLES && obstaclesDelayControl.isTime()) {
        initializeObstacleGroup();      //create new obstacles instances
    }

}