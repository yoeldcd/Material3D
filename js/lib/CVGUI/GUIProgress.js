
function GUIProgress(x, y, w, h) {
    this.setPosition(x, y);
    this.setSizePorcentage(w, h);
}

for (var property in GUITextBox.prototype) {
    GUIProgress.prototype[property] || (GUIProgress.prototype[property] = GUITextBox.prototype[property]);
}

GUIProgress.prototype.showText = true;

GUIProgress.prototype.progress = 0;

GUIProgress.prototype.text = '0%';

GUIProgress.prototype.progressColor = 'lime';

GUIProgress.prototype.setProgress = function (progress, control) {
    control || (control = this);

    progress >= 0 && progress <= 100 ? control.progress = progress : null;
    this.text = progress + '%';
    
};

GUIProgress.prototype.paint = function (graphics, control) {
    var text, textUp, textLeft, textLength, porcentage, background;

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

    //draw progress bar
    porcentage = control.width / 100;
    graphics.fillStyle = control.progressColor;
    graphics.fillRect(control.left, control.up, porcentage * control.progress, control.height);
    
    //draw border
    if (control.borderColor) {
        graphics.lineWidth = control.borderSize;
        graphics.strokeStyle = control.borderColor;
        graphics.strokeRect(control.left, control.up, control.width, control.height);
    }

    //compute text coords
    if (control.showText) {
        textLength = control.text.length;
        textLeft = control.centerX - (textLength / 4 * control.textSize);
        textUp = control.centerY + control.textSize / 2;

        //draw text line
        graphics.font = control.textSize + 'px monospace';
        graphics.fillStyle = control.textColor;
        graphics.fillText(control.text, textLeft, textUp);
    }
    
    graphics.restore();
};