
var USER_MODEL;
var USER_SPEEED;

var user;
var mouseX = 0;
var mouseY = 0;
var newMouseX = 0;
var newMouseY = 0;

var boundex = new Array(4);

function prepareUser() {
    var subGeometry;

    user = elements.getNode().data;
    elements.next();

    user.type = USER_MODEL;
    user.enable = true;
    user.rebote = false;
    user.scale = 1;

    user.geometry = new Entity3D();
    
    subGeometry = new Box3D(5, 5, 20);
    subGeometry.moveTo(0, 0, 0);
    user.geometry.addGeometry(subGeometry);
    boundex[0] = elements.getNode().data, elements.next();
    boundex[0].enable = !true;
    boundex[0].type = -1;
    boundex[0].scale = 1;
    boundex[0].geometry = subGeometry;

    subGeometry = new Box3D(0);
    subGeometry.moveTo(-2, 0, 11);
    user.geometry.addGeometry(subGeometry);
    boundex[1] = elements.getNode().data, elements.next();
    boundex[1].enable = true;
    boundex[1].type = 3;
    boundex[1].scale = 4;
    boundex[1].geometry = subGeometry;

    subGeometry = new Box3D(0);
    subGeometry.moveTo(2, 0, 11);
    user.geometry.addGeometry(subGeometry);
    boundex[2] = elements.getNode().data, elements.next();
    boundex[2].enable = true;
    boundex[2].type = 3;
    boundex[2].scale = 4;
    boundex[2].geometry = subGeometry;

    
    evalGameUser = true;

}

function controleUser(mouseData) {
    var x, z;
    newMouseX = mouseData[0];//parseInt(mouseData[0] * 100/ gameScreenWidth);
    newMouseY = mouseData[1];//parseInt(mouseData[1] * 100/ gameScreenHeight);

    //get user entity box location
    x = user.geometry.x;
    z = user.geometry.z;

    //compute user entity box location X
    if (mouseX < newMouseX && x < 30)
        x += 2;
    else if (mouseX > newMouseX && x > -30)
        x -= 2;
    else
        ;

    //compute user entity box location Z
    if (mouseY < newMouseY && z < 20)
        z += 2;
    else if (mouseY > newMouseY && z > -20)
        z -= 2;
    else
        ;

    //update mouse coordinates
    mouseX = newMouseX;
    mouseY = newMouseY;

    //update user entity box location
    user.geometry.moveTo(x, user.geometry.y, z);

    //request camera update service
    requestCameraUpdate = true;

}

function deleteUser() {
    user.enable = false;
}

function evalUser() {
    if (user.enable) {
        user.animate();

    } else {
        lossGameLevel();
    }
}
