
function CanvasUtils() {}

(function () {
    var canvas = null;
    var cssText = null;
    
    function resizeCanvas(){
       
    }

    CanvasUtils.getGL = function (id, width, height) {
        width || (width = 300);
        height || (height = 300);

        canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
    };
    
    window.addEventListener('resize', resizeCanvas);

})();
