
function DirectionalLigth(){}

DirectionalLigth.prototype.enable = false;

DirectionalLigth.prototype.directionX = 0;
DirectionalLigth.prototype.directionY = 0;
DirectionalLigth.prototype.directionZ = 1;

DirectionalLigth.prototype.red = 1.0;
DirectionalLigth.prototype.green = 1.0;
DirectionalLigth.prototype.blue = 1.0;

DirectionalLigth.prototype.computeDirection = function(x, y, z, targetX, targetY, targetZ){
    var length;
    
    this.directionX = (targetX - x);
    this.directionY = (targetY - y);
    this.directionZ = (targetZ - z);
    
    length = Math.sqrt(this.dircetionX * this.dircetionX + this.dircetionY * this.dircetionY + this.dircetionZ * this.dircetionZ) || 1;
    
    this.directionX /= length;
    this.directionY /= length;
    this.directionZ /= length;
    
};
