
function Delayer(delay) {

    var time;
    var lastTime = -1;
    this.delay = delay || 1000;

    this.isTime = function () {
        var isTime = true;
        time = new Date().getTime();

        if (lastTime > 0)
            if (time - lastTime >= this.delay)
                lastTime = time;
            else
                isTime = false;
        else
            lastTime = time;

        return isTime;
    };

    this.jump = function(){
        lastTime = new Date().getTime();
    };
    
    this.reset = function () {
        lastTime = -1;
    };
    
}
