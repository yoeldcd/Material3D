
function Animator(geometry, limitBox) {

    this.type = 0;
    this.state = -1;
    this.enable = false;
    
    this.geometry = geometry;
    this.limitBox = limitBox;
    
    this.rebote = false;
    
    this.speedX = 0;
    this.speedY = 0;
    this.speedZ = 0;

    this.alpha = 0;
    this.beta = 0;
    this.omega = 0;

    this.speedAlpha = 0;
    this.speedBeta = 0;
    this.speedOmega = 0;

    this.scale = 1.0;

    return this;
}

Animator.prototype.hasColition = function (geometry) {
    return this.geometry.hasColition(geometry);
};

Animator.prototype.computeSpeed = function(){
    var axisStatus = [0, 0, 0];
    this.geometry.hasColition(this.limitBox);
    
    if(axisStatus){
        !axisStatus[0] || (this.speedX = this.rebote ? - this.speedX : 0);
        !axisStatus[1] || (this.speedY = this.rebote ? - this.speedY : 0);
        !axisStatus[2] || (this.speedZ = this.rebote ? - this.speedZ : 0);
        
    }
    
};

Animator.prototype.animate = function () {

    if(this.geometry){
        
        if(this.limitBox)
            this.computeSpeed();
        
        this.geometry.move(this.speedX, this.speedY, this.speedZ);
        
        this.alpha += this.speedAlpha;
        this.beta += this.speedBeta;
        this.omega += this.speedOmega;

    }
};
