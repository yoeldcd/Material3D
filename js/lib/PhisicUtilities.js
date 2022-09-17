
function Box(width, height, depth) {
    var self = this;

    self.rigth = 0;
    self.left = 0;
    self.top = 0;
    self.down = 0;
    self.near = 0;
    self.far = 0;

    self.x = 0;
    self.y = 0;
    self.z = 0;

    self.width = (width || 0);
    self.height = (height || width);
    self.depth = (depth || width);
    
    self.hasColition = function (box) {
        var colitioned = true;

        colitioned &= Math.abs(self.x - box.x) <= (self.width + box.width) / 2;
        colitioned &= Math.abs(self.y - box.y) <= (self.height + box.height) / 2;
        colitioned &= Math.abs(self.z - box.z) <= (self.depth + box.depth) / 2;
        
        return colitioned;
    };
    
    return self;
}

function Animator(objectBox, objectLimits) {
    var self = this;

    var animatorBox = (objectBox || new Box());
    var animatorLimits = (objectLimits || new Box());

    self.type = 0;
    self.state = -1;
    self.enable = false;
    
    self.speedx = 0;
    self.speedy = 0;
    self.speedz = 0;

    self.alpha = 0;
    self.beta = 0;
    self.omega = 0;

    self.speedalpha = 0;
    self.speedbeta = 0;
    self.speedomega = 0;

    self.rebote = false;
    
    self.box = objectBox;
    self.limits = objectLimits;
    self.scale = 1.0;
    
    self.hasColition = function (box) {
        return animatorBox.hasColition(box);
    };

    self.animate = function () {

        if (self.speedx !== 0 &&  Math.abs(animatorBox.x - animatorLimits.x) > (animatorBox.width + animatorLimits.width) / 2)
            self.rebote ? self.speedx *= -1 : self.speedx = 0;

        if (self.speedy !== 0 &&  Math.abs(animatorBox.y - animatorLimits.y) > (animatorBox.height + animatorLimits.height) / 2)
            self.rebote ? self.speedy *= -1 : self.speedy = 0;

        if (self.speedz !== 0 &&  Math.abs(animatorBox.z - animatorLimits.z) > (animatorBox.depth + animatorLimits.depth) / 2)
            self.rebote ? self.speedz *= -1 : self.speedz = 0;

        animatorBox.x += self.speedx;
        animatorBox.y += self.speedy;
        animatorBox.z += self.speedz;

        self.alpha += self.speedalpha;
        self.beta += self.speedbeta;
        self.omega += self.speedomega;

        
    };
    
    return self;
}


