
var frustrum = new (function () {
    var PI = Math.PI;
    var visible = false;
    var FOV = 0;
    var xView = 0;
    var yView = 0;
    var zView = 0;

    this.makeFrustrum = function (fieldOfView, isRadian, ratio, near, far) {
        return {
            fieldOfView: isRadian ? fieldOfView : fieldOfView / 180 * PI,
            ratio: ratio,
            near: near,
            far: far
        };
    };
    
    this.isVisible = function (frustrum, point, cameraPosition) {
        visible = false;

        if (frustrum && point && cameraPosition){
            FOV = frustrum.fieldOfView / 2;
            
            zView = point[2] - cameraPosition[2];
            if (zView <= frustrum.near && zView >= frustrum.far) {
                xView = (point[0] - cameraPosition[0]) * FOV / frustrum.ratio / zView;
                yView = (point[1] - cameraPosition[1]) * FOV / zView;

                if (xView >= -1 && xView <= 1)
                    if (yView >= -1 && yView <= 1)
                        visible = true;

            }
        }
        
        return visible;
    };
    
});


