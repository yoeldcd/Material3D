
function GUIButton(label, x, y, w, h) {
    !label || (this.text = label);

    this.setPosition(x, y);
    this.setSizePorcentage(w, h);

    //set default button style color
    this.textColor = this.normalTextColor;
    this.backgroundColor = this.normalBackgroundColor;
    this.borderColor = this.normalBorderColor;

}

for (var property in GUIComponentMouseListener.prototype) {
    GUIButton.prototype[property] || (GUIButton.prototype[property] = GUIComponentMouseListener.prototype[property]);
}

for (var property in GUITextBox.prototype) {
    GUIButton.prototype[property] || (GUIButton.prototype[property] = GUITextBox.prototype[property]);
}

GUIButton.prototype.normalTextColor = 'black';

GUIButton.prototype.focusedTextColor = 'black';

GUIButton.prototype.normalBackgroundColor = 'white';

GUIButton.prototype.focusedBackgroundColor = 'gray';

GUIButton.prototype.normalBorderColor = 'blue';

GUIButton.prototype.focusedBorderColor = 'rgb(0 , 0, 100)';

GUIButton.prototype.paint = function (graphics, control) {
    var textUp, textLeft, textLength, background, color;

    control || (control = this);

    //bounding GUIControl
    graphics.save();
    graphics.beginPath();
    graphics.rect(control.left, control.up, control.width, control.height);
    graphics.clip();

    //draw background
    background = control.focused ? control.focusedBackgroundColor : control.normalBackgroundColor;
    if (background instanceof HTMLImageElement) {
        graphics.drawImage(background, 0, 0, background.width, background.height, 0, 0, control.width.control.height);
    } else if(background){
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
        graphics.strokeRect(control.left, control.up, control.width, control.height);
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