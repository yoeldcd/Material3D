
function FocusLigth(){}

FocusLigth.prototype.enable = false;

FocusLigth.prototype.x = 0;
FocusLigth.prototype.y = 0;
FocusLigth.prototype.z = 0;

FocusLigth.prototype.targetX = 0;
FocusLigth.prototype.targetY = 0;
FocusLigth.prototype.targetZ = - 100;

FocusLigth.prototype.directionX = 0;
FocusLigth.prototype.directionY = 0;
FocusLigth.prototype.directionZ = 1;

FocusLigth.prototype.field = 0;

FocusLigth.prototype.red = 1.0;
FocusLigth.prototype.green = 1.0;
FocusLigth.prototype.blue = 1.0;

FocusLigth.prototype.computeDirection = function(){
    var length;
    
    this.directionX = (this.targetX - this.x);
    this.directionY = (this.targetY - this.y);
    this.directionZ = (this.targetZ - this.z);
    
    length = Math.sqrt(this.dircetionX * this.dircetionX + this.dircetionY * this.dircetionY + this.dircetionZ * this.dircetionZ) || 1;
    
    this.directionX /= length;
    this.directionY /= length;
    this.directionZ /= length;
    
};
