
function Geometry() {
    this.type = 0;

    this.x = 0;
    this.y = 0;
    this.z = 0;
}

Geometry.prototype.move = function (dx, dy, dz) {
    dx !== undefined ? (this.x += dx) : null;
    dy !== undefined ? (this.y += dy) : null;
    dz !== undefined ? (this.z += dz) : null;

};

Geometry.prototype.moveTo = function (x, y, z) {
    x !== undefined ? (this.x = x) : null;
    y !== undefined ? (this.y = y) : null;
    z !== undefined ? (this.z = z) : null;

};

Geometry.prototype.hasColition = function (geometry) {
    var colitioned;

    switch (geometry.type + this.type * 0.1) {
        case 1.1:
            colitioned = Geometry.prototype.hasBox2BoxColition(geometry, this);
            break;
            
        case 2.2:
            colitioned = Geometry.prototype.hasSphere2SphereColition(geometry, this);
            break;

        case 1.2:
            colitioned = Geometry.prototype.hasBox2SphereColition(geometry, this);
            break;

        case 2.1:
            colitioned = Geometry.prototype.hasBox2SphereColition(this, geometry);
            break;
            
        default:
            colitioned = geometry.hasColition(this);
            
    }

    return colitioned;
};

Geometry.prototype.hasBox2BoxColition = function (boxA, boxB) {
    var diference;

    var colitioned = ((diference = boxA.x - boxB.x) >= 0 ? diference : -diference) <= ((boxA.width + boxB.width) / 2);
    colitioned &= ((diference = boxA.y - boxB.y) >= 0 ? diference : -diference) <= ((boxA.height + boxB.height) / 2);
    colitioned &= ((diference = boxA.z - boxB.z) >= 0 ? diference : -diference) <= ((boxA.depth + boxB.depth) / 2);

    return colitioned;
};

Geometry.prototype.hasSphere2SphereColition = function (sphereA, sphereB) {
    var diference;
    var distance = Math.sqrt(((diference = sphereA.x - sphereB.x) * diference) + ((diference = sphereA.y - sphereB.y) * diference) + ((diference = sphereA.z - sphereB.z) * diference));

    return distance >= (this.ratio + sphereB.ratio);
};

Geometry.prototype.hasBox2SphereColition = function (box, sphere) {
    var diference;

    var colitioned = ((diference = box.x - sphere.x) >= 0 ? diference : -diference) <= ((box.width + sphere.ratio) / 2);
    colitioned &= ((diference = box.y - sphere.y) >= 0 ? diference : -diference) <= ((box.height + sphere.ratio) / 2);
    colitioned &= ((diference = box.z - sphere.z) >= 0 ? diference : -diference) <= ((box.depth + sphere.ratio) / 2);

    return colitioned;
};