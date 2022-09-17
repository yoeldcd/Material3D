
function Entity3D(name) {

    this.type = 3;
    this.name = name;
    this.geometrys = new Array();

    this.x = 0;
    this.y = 0;
    this.z = 0;

}

Entity3D.prototype.addGeometry = function (geometry) {
    geometry.move(this.x, this.y, this.z);
    this.geometrys[this.geometrys.length] = geometry;
};

Entity3D.prototype.move = function (dx, dy, dz) {

    var geometrys = this.geometrys;
    var length = geometrys.length;

    dx !== undefined || (dx = 0);
    dy !== undefined || (dy = 0);
    dz !== undefined || (dz = 0);

    if (dx + dy + dz !== 0) {
        
        //move entity center
        this.x += dx;
        this.y += dy;
        this.z += dz;

        //move entity geometrys
        for (var i = 0; i < length; i++) {
            geometrys[i].move(dx, dy, dz);
        }
        
    }
};

Entity3D.prototype.moveTo = function (x, y, z) {
    
    var length = this.geometrys.length;
    var geometrys = this.geometrys;
    
    x !== undefined || (x = 0);
    y !== undefined || (y = 0);
    z !== undefined || (z = 0);

    if (x + y + z !== 0) {

        //move entity geometrys
        for (var i = 0; i < length; i++) {
            geometrys[i].move(x - this.x, y - this.y, z - this.z);
        }

        //locate entity center
        this.x = x;
        this.y = y;
        this.z = z;

    }


};

Entity3D.prototype.hasColition = function (geometry) {
    
    var geometrys = this.geometrys;
    var length = geometrys.length;
    var geometrys2, length2;
    var colitioned = false;
    
    if (geometry instanceof Entity3D) {
        geometrys2 = geometry.geometrys;
        length2 = geometrys2.length;

        //eval Entity 2 Entity
        for (var i = 0; !colitioned && i < length; i++) {
            for (var j = 0; !colitioned && j < length2; j++) {
                colitioned = geometrys[i].hasColition(geometrys2[j]);
            }
        }
        
        
    } else {
        
        
        //eval Entity 2 Geometrys
        for (var i = 0; !colitioned && i < length; i++) {
            colitioned = geometrys[i].hasColition(geometry);
        }

    }

    return colitioned;
};