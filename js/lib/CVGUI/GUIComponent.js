
//Base GUI component
function GUIComponent(x, y, width, height) {
    this.setPosition(x, y);
    this.setSizePorcentage(width, height);
}

GUIComponent.prototype.isGUIControl = true;

GUIComponent.prototype.parent = null;

GUIComponent.prototype.left = 0;

GUIComponent.prototype.rigth = 0;

GUIComponent.prototype.up = 0;

GUIComponent.prototype.down = 0;

GUIComponent.prototype.porcentageWidth = 0;

GUIComponent.prototype.porcentageHeight = 0;

GUIComponent.prototype.width = 0;

GUIComponent.prototype.height = 0;

GUIComponent.prototype.centerX = 0;

GUIComponent.prototype.centerY = 0;

GUIComponent.prototype.x = 0;

GUIComponent.prototype.y = 0;

GUIComponent.prototype.backgroundColor = 'white';

GUIComponent.prototype.borderColor = 'blue';

GUIComponent.prototype.borderSize = 3;

GUIComponent.prototype.setPosition = function (x, y, control) {
    control || (control = this);

    !x || (control.x = x);
    !y || (control.y = y);

};

GUIComponent.prototype.setSize = function (width, height, control) {
    control || (control = this);

    !width || (control.width = width, control.porcentageWidth = 0);
    !height || (control.height = height, control.porcentageHeight = 0);

};

GUIComponent.prototype.setSizePorcentage = function (porcentageWidth, porcentageHeight, control) {
    control || (control = this);

    !porcentageWidth || (control.porcentageWidth = porcentageWidth);
    !porcentageHeight || (control.porcentageHeight = porcentageHeight);

};

GUIComponent.prototype.update = function (control) {
    var porcentageW;
    var porcentageH;

    control || (control = this);

    if (control.parent) {

        //compute porcentage
        porcentageW = control.parent.width / 100;
        porcentageH = control.parent.height / 100;

        //update values of renderable area
        if (control.porcentageWidth)
            control.width = porcentageW * control.porcentageWidth;

        if (control.porcentageHeight)
            control.height = porcentageH * control.porcentageHeight;

        control.centerX = control.parent.left + (control.x * porcentageW);
        control.centerY = control.parent.up + (control.y * porcentageH);


    } else {

        //update values of renderable area
        if (control.porcentageWidth)
            control.width = control.porcentageWidth;

        if (control.porcentageHeight)
            control.height = control.porcentageHeight;

        control.centerX = control.x;
        control.centerY = control.y;

    }

    //compute reference points of control
    control.left = control.centerX - (control.width / 2);
    control.rigth = control.left + control.width;
    control.up = control.centerY - (control.height / 2);
    control.down = control.up + control.height;

    //call update callback
    if (control.update !== GUIComponent.prototype.update) {
        control.update();
    }

    //console.error('{\n Text: ' + (control.text ? control.text : ' LAYOUT') + ' >> ;\n Left: ' + control.left + ';\n Up: ' + control.up + ';\n Rigth : ' + control.rigth + ';\n Down: ' + control.down + ';\n centerX: ' + control.centerX + ';\n centerY: ' + control.centerY + ';\n width: ' + control.width + ';\n height: ' + control.height + ' \n}');

};

GUIComponent.prototype.paint = function (graphics, control) {
    var background;
    control || (control = this);

    //bounding GUIControl
    graphics.save();
    graphics.beginPath();
    graphics.rect(control.left, control.up, control.width, control.height);
    graphics.clip();

    //draw background
    background = control.backgroundColor;
    if (background instanceof HTMLImageElement) {
        graphics.drawImage(background, 0, 0, background.width, background.height, 0, 0, control.width.control.height);
    } else if (background) {
        graphics.fillStyle = background;
        graphics.fillRect(control.left, control.up, control.width, control.height);
    } else {
        ;
    }

    //draw border
    if (control.borderColor) {
        graphics.lineWidth = control.borderSize;
        graphics.strokeStyle = control.borderColor;
        graphics.strokeRect(control.left, control.up, control.width, control.height);
    }

    graphics.restore();
};

//Mouse EventListener
function GUIComponentMouseListener() {}

GUIComponentMouseListener.prototype.isMouseListener = true;

GUIComponentMouseListener.prototype.focused = false;

GUIComponentMouseListener.prototype.onmousemove = function (mouseEvent, control) {
    var mouseX = mouseEvent.clientX;
    var mouseY = mouseEvent.clientY;
    var focused = false;

    control || (control = this);

    //eval mouse pointer focus
    if (control.left <= mouseX && control.rigth >= mouseX) {
        if (control.up <= mouseY && control.down >= mouseY) {
            focused = true;

            //call mousemove callback
            if (control.onmousemove !== GUIComponentMouseListener.prototype.onmousemove) {
                control.onmousemove(mouseEvent);
            }

            //call focus up callback
            if (!control.focused) {
                GUIComponentMouseListener.prototype.onfocused(mouseEvent, control);
            }

        }
    }

    //call focus over callback
    if (!focused && control.focused) {
        GUIComponentMouseListener.prototype.onunfocused(mouseEvent, control);
    }

    return focused;
};

GUIComponentMouseListener.prototype.onclick = function (mouseEvent, control) {
    var mouseX = mouseEvent.clientX;
    var mouseY = mouseEvent.clientY;
    var clicked = false;

    control || (control = this);

    //eval mouse pointer focus
    if (control.left <= mouseX && control.rigth >= mouseX) {
        if (control.up <= mouseY && control.down >= mouseY) {
            clicked = true;

            //call click callback
            if (control.onclick !== GUIComponentMouseListener.prototype.onclick) {
                control.onclick(mouseEvent);
            }

            //call focus up callback
            if (!control.focused) {
                !control.isMouseListener || GUIComponentMouseListener.prototype.onfocused(mouseEvent, control);
            }

        }
    }

    return clicked;
};

GUIComponentMouseListener.prototype.onfocused = function (mouseEvent, control) {
    control || (control = this);
    control.focused = true;

    //console.log('focused');
    //console.log(control);

    //call onfocus callback
    if (control.onfocused !== GUIComponentMouseListener.prototype.onfocused)
        control.onfocused(mouseEvent);
};

GUIComponentMouseListener.prototype.onunfocused = function (mouseEvent, control) {
    control || (control = this);
    control.focused = false;

    //console.log('unfocused');
    //console.log(control);

    //call onunfocus callback
    if (control.onunfocused !== GUIComponentMouseListener.prototype.onunfocused)
        control.onunfocused(mouseEvent);
};