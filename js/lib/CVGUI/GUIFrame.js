
function GUIFrame(canvas, graphics, movilMode) {

    var self = this;

    self.canvas = canvas;
    self.graphics = graphics;
    self.width = canvas.width;
    self.height = canvas.height;

    //create descktop mouse listeners
    if (!movilMode)
        canvas.addEventListener('mousemove', function (mouseEvent) {

            if (self.layout && self.hasDelay()) {
                GUIComponentMouseListener.prototype.onmousemove(mouseEvent, self.layout);
                self.paint();
            }

        }, false);
    else
        canvas.addEventListener('touchmove', function (touchEvent) {
            var mouseEvent;
                    
            touchEvent.preventDefault();
            mouseEvent = touchEvent.changedTouches[0];
            mouseEvent.buttons = 1;
            
            if (self.layout && self.hasDelay()) {
                GUIComponentMouseListener.prototype.onmousemove(mouseEvent, self.layout);
                self.paint();
            }
        });

    canvas.addEventListener('click', function (mouseEvent) {

        if (self.layout) {
            GUIComponentMouseListener.prototype.onclick(mouseEvent, self.layout);
            self.paint();
            //console.log('clicking');

        }

    }, false);

}

GUIFrame.prototype.width = 0;

GUIFrame.prototype.height = 0;

GUIFrame.prototype.time = 0;

GUIFrame.prototype.delay = 100;

GUIFrame.prototype.layout = null;

GUIFrame.prototype.hasDelay = function () {
    var time = new Date().getTime();
    var response = time - this.time >= this.delay;
    !response || (this.time = time);
    return response;
};

GUIFrame.prototype.setLayout = function (guiLayout) {

    if(this.layout)
        GUIComponentMouseListener.prototype.onunfocused(this.layout);
    
    this.layout = guiLayout;
    this.update();
    this.paint();

};

GUIFrame.prototype.setSize = function (width, height) {
    !width || (this.width = width);
    !height || (this.height = height);

    //set canvas size
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.update();
    this.paint();
};

GUIFrame.prototype.update = function () {
    if (this.layout) {
        this.layout.setPosition(this.width / 2, this.height / 2);
        this.layout.setSize(this.width, this.height);
        GUIComponent.prototype.update(this.layout);
    }
};

GUIFrame.prototype.clear = function () {
    this.graphics.clearRect(0, 0, this.width, this.height);
};

GUIFrame.prototype.paint = function () {
    this.clear();
    !this.layout || this.layout.paint(this.graphics);
};