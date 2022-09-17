
function GUIRoundButton(label, x, y, w, h) {
    !label || (this.text = label);

    this.setPosition(x, y);
    this.setSizePorcentage(w, h);

    //set default button style color
    this.textColor = this.normalTextColor;
    this.backgroundColor = this.normalBackgroundColor;
    this.borderColor = this.normalBorderColor;

}

for (var property in GUIButton.prototype) {
    GUIRoundButton.prototype[property] || (GUIRoundButton.prototype[property] = GUIButton.prototype[property]);
}

GUIRoundButton.prototype.slices = 8;

GUIRoundButton.prototype.offsetAngle = 0;

GUIRoundButton.prototype.paint = function (graphics, control) {
    var textUp, textLeft, textLength, background, color;
    var r, ratio, sin, cos, angle, increment, x, y;
    
    control || (control = this);

    increment = Math.PI * 2 / control.slices;
    ratio = control.width / control.height;
    r = control.width / 2 / ratio;

    graphics.save();
    graphics.beginPath();

    //cliping component space
    angle = Math.PI * (control.offsetAngle || 0);
    for (var i = 0; i < control.slices; i++) {
        sin = Math.sin(angle);
        cos = Math.cos(angle);
        x = r * cos + control.centerX;
        y = r * sin + control.centerY;

        if (i === 0)
            graphics.moveTo(x, y);
        else
            graphics.lineTo(x, y);

        angle += increment;
    }
    
    graphics.clip();

    //draw background
    background = control.focused ? control.focusedBackgroundColor : control.normalBackgroundColor;
    if (background instanceof HTMLImageElement) {
        graphics.drawImage(background, 0, 0, background.width, background.height, 0, 0, control.width.control.height);
    } else if (background) {
        graphics.fillStyle = background;
        graphics.fillRect(control.left, control.up, control.width, control.height);
    } else {
        ;
    }

    //draw border
    color = control.focused ? control.focusedBorderColor : control.normalBorderColor;
    if (color) {
        graphics.lineWidth = control.borderSize;
        graphics.strokeStyle = color;
        graphics.beginPath();

        angle = Math.PI * (control.offsetAngle || 0);
        for (var i = 0; i < control.slices; i++) {
            sin = Math.sin(angle);
            cos = Math.cos(angle);
            x = r * cos + control.centerX;
            y = r * sin + control.centerY;

            if (i === 0)
                graphics.moveTo(x, y);
            else
                graphics.lineTo(x, y);

            angle += increment;
        }

        graphics.closePath();
        graphics.stroke();

    }
    
    //compute text coords
    textLength = control.text.length;
    textLeft = control.centerX - (textLength / 4 * control.textSize);
    textUp = control.centerY + control.textSize / 2;

    //draw button text label
    graphics.font = control.textSize + 'px monospace';
    color = control.focused ? control.focusedTextColor : control.normalTextColor;
    graphics.fillStyle = color;
    graphics.fillText(control.text, textLeft, textUp);


    graphics.restore();
};

