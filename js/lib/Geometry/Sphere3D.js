
function Sphere3D(ratio){
    
    this.type = 2;
    
    this.x = 0;
    this.y = 0;
    this.z = 0;
    
    this.ratio = ratio !== undefined ? ratio : 0;
    
}

Sphere3D.prototype.move = Geometry.prototype.move;

Sphere3D.prototype.moveTo = Geometry.prototype.moveTo;

Sphere3D.prototype.hasColition = Geometry.prototype.hasColition;