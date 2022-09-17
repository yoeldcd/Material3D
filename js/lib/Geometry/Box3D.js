
function Box3D(width, height, depth) {
    
    this.type = 1;
    
    this.x = 0;
    this.y = 0;
    this.z = 0;
    
    this.width = width !== undefined ? width : 0;
    this.height = height !== undefined ? height : width;
    this.depth = depth !== undefined ? depth : width;

    return this;
}

Box3D.prototype.move = Geometry.prototype.move;

Box3D.prototype.moveTo = Geometry.prototype.moveTo;

Box3D.prototype.hasColition = Geometry.prototype.hasColition;