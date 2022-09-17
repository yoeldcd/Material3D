
function GUILayout(x, y, width, height) {
    this.setPosition(x, y);
    this.setSizePorcentage(width, height);
    this.childrens = new Array();
}

for (var property in GUIComponent.prototype) {
    GUILayout.prototype[property] || (GUILayout.prototype[property] = GUIComponent.prototype[property]);
}

for (var property in GUIComponentMouseListener.prototype) {
    GUILayout.prototype[property] || (GUILayout.prototype[property] = GUIComponentMouseListener.prototype[property]);
}

GUILayout.prototype.update = function (control) {

    control || (control = this);

    var childrens = control.childrens;
    var childrensCount = childrens.length;
    
    //update all childrens
    for (var i = 0; i < childrensCount; i++) {
        GUIComponent.prototype.update(childrens[i]);
    }   //end for childrens

};

GUILayout.prototype.onmousemove = function (mouseEvent, control) {
    control || (control = this);

    var children;
    var childrens = control.childrens;
    var childrensCount = childrens.length;

    for (var i = 0; i < childrensCount; i++) {
        children = childrens[i];
        !children.isMouseListener || GUIComponentMouseListener.prototype.onmousemove(mouseEvent, children);
    }   //end for childrens

};

GUILayout.prototype.onclick = function (mouseEvent, control) {
    control || (control = this);

    var children;
    var childrens = control.childrens;
    var childrensCount = childrens.length;
    
    //call all click event for components
    for (var i = 0; i < childrensCount; i++) {
        children = childrens[i];
        !children.isMouseListener || GUIComponentMouseListener.prototype.onclick(mouseEvent, children);
    }   //end for childrens

};

GUILayout.prototype.onunfocused = function (mouseEvent, control) {
    control || (control = this);

    var children;
    var childrens = control.childrens;
    var childrensCount = childrens.length;
    
    //unfocused all components
    for (var i = 0; i < childrensCount; i++) {
        children = childrens[i];
        !children.isMouseListener || GUIComponentMouseListener.prototype.onunfocused(mouseEvent, children);
    }   //end for childrens
    
};

GUILayout.prototype.add = function (guiControl) {
    if (guiControl.isGUIControl) {

        guiControl.parent = this;
        guiControl.update();
        this.childrens.push(guiControl);

    } else
        console.error('Unrenderable GUI control');
};

GUILayout.prototype.paint = function (graphics, control) {

    var childrens, childrensCount;

    control || (control = this);

    //bounding GUIControl
    graphics.save();
    graphics.beginPath();
    graphics.rect(control.left, control.up, control.width, control.height);
    graphics.clip();

    //draw background
    if (control.backgroundColor) {
        graphics.fillStyle = control.backgroundColor;
        graphics.fillRect(control.left, control.up, control.width, control.height);
    } else {
        graphics.clearRect(control.left, control.up, control.width, control.height);
    }

    //draw border
    if (control.borderColor) {
        graphics.lineWidth = control.borderSize;
        graphics.strokeStyle = control.borderColor;
        graphics.strokeRect(control.left, control.up, control.width, control.height);
    }

    //draw childrens
    childrens = control.childrens;
    childrensCount = childrens.length;
    for (var i = 0; i < childrensCount; i++) {
        childrens[i].paint(graphics);
    }

    graphics.restore();
};