
function GUITextBox(label, x, y, w, h) {
    this.setPosition(x, y);
    this.setSizePorcentage(w, h);
     !label || (this.text = label);
}

for (var property in GUIComponent.prototype) {
    GUITextBox.prototype[property] || (GUITextBox.prototype[property] = GUIComponent.prototype[property]);
}

GUITextBox.prototype.text = 'text';

GUITextBox.prototype.textSize = 18;

GUITextBox.prototype.textSizePorcentage = 0;

GUITextBox.prototype.textColor = 'black';

GUITextBox.prototype.backgroundColor = 'white';

GUITextBox.prototype.update = function(control){
    control || (control = this);
    
    if(control.textSizePorcentage)
        control.textSize = control.height * control.textSizePorcentage / 100;
};

GUITextBox.prototype.paint = function (graphics, control) {
    var background;
    var textUp, textLeft, textLength;

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

    //compute text coords
    textLength = control.text.length;
    textLeft = control.centerX - (textLength / 4 * control.textSize);
    textUp = control.centerY + control.textSize / 2;

    //draw text line
    graphics.font = control.textSize + 'px monospace';
    graphics.fillStyle = control.textColor;
    graphics.fillText(control.text, textLeft, textUp);

    graphics.restore();
};