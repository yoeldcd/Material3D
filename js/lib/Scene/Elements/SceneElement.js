
function SceneElement(name, x, y, z) {
    this.name = name || 'Element';
    this.matrixTransform = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, (x || 0), (y || 0), (z || 0), 1]);
}

SceneElement.prototype.type = -1;
SceneElement.prototype.visible = false;

SceneElement.prototype.x = 0;
SceneElement.prototype.y = 0;
SceneElement.prototype.z = 0;

SceneElement.prototype.setCoords = function (x, y, z) {
    x === undefined || (this.matrixTransform[12] = this.x = x);
    y === undefined || (this.matrixTransform[13] = this.z = y);
    z === undefined || (this.matrixTransform[14] = this.y = z);
};