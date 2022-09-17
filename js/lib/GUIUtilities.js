
function GUICompositor(targetCanvas, context2D, touchMode) {

    var self = this;
    var gui = context2D;
    var target = targetCanvas;
    var enable;
    var changed;
    var controls;

    var screenw = target.width;
    var screenh = target.height;
    var pw = screenw / 100;
    var ph = screenh / 100;

    var delayControl = new Delayer(40);

    var mousex = 0;
    var mousey = 0;

    if (!touchMode) {
        target.addEventListener('mousemove', onmousemove);
        target.addEventListener('click', onmouseclick);

    } else {
        target.addEventListener('touchmove', ontouchmove);
        target.addEventListener('click', onmouseclick);

    }

    enable = true;
    changed = false;

    controls = new Array();

    function onmousemove(e) {
        var control;
        var sw;
        var sh;
        var cx, cy;
        var length;

        mousex = parseInt(e.clientX / pw);
        mousey = parseInt(e.clientY / ph);

        if (enable && delayControl.isTime()) {
            length = controls.length;

            for (var i = 0; !changed && i < length; i++) {
                control = controls[i];
                sw = parseInt(control.w / 2);
                sh = parseInt(control.h / 2);

                cx = mousex >= control.x - sw && mousex <= control.x + sw;
                cy = mousey >= control.y - sh && mousey <= control.y + sh;

                //eval mouse action
                if (cx & cy & control.clickeable) {
                    control.mouseup = true;
                    !control.onmousemove || control.onmousemove(e, control);

                } else {
                    control.mouseup = false;

                }
            }   //end for
        }

        repaintGUI();
        changed = false;
    }

    function onmouseclick(e) {
        var control;
        var sw;
        var sh;
        var cx, cy;
        var length;

        mousex = parseInt(e.clientX / pw);
        mousey = parseInt(e.clientY / ph);

        if (enable && delayControl.isTime()) {
            length = controls.length;

            for (var i = 0; !changed && i < length; i++) {

                control = controls[i];
                sw = parseInt(control.w / 2);
                sh = parseInt(control.h / 2);

                cx = mousex >= control.x - sw && mousex <= control.x + sw;
                cy = mousey >= control.y - sh && mousey <= control.y + sh;

                //eval mouse action
                if (cx & cy & control.clickeable) {
                    control.mouseup = true;
                    !control.onclick || control.onclick(e, control);

                } else {
                    control.mouseup = false;

                }
            }   //end for
        }

        repaintGUI();
        changed = false;
    }

    function ontouchmove(e) {
        e.preventDefault();
        onmousemove(e.changedTouches[0]);
    }

    function repaintGUI() {

        var control;
        var sw;
        var sh;
        var cx, cy, w, h, fontStyle, fontsizeW, fontsizeH, text, textSize, up, left, down, rigth, progressFill;
        var length;

        gui.save();

        if (self.showPointer) {
            gui.fillStyle = 'cyan';
            gui.clearRect(0, 0, screenw, screenh);
            gui.fillText(mousex + ' : ' + mousey, mousex * pw, mousey * ph);
        }

        if (enable) {
            length = controls.length;

            for (var i = 0; i < length; i++) {
                control = controls[i];

                if (control.visible) {

                    //compute control points
                    cx = control.x * pw;
                    cy = control.y * ph;
                    w = control.w * pw;
                    h = control.h * ph;
                    sw = w / 2;
                    sh = h / 2;
                    up = cy - sh;
                    left = cx - sw;
                    down = cy + sh;
                    rigth = cx + sw;
                    fontsizeH = control.fontSize * ph;
                    fontsizeW = fontsizeH / 2;
                    fontStyle = (w > h ? fontsizeH : fontsizeW) + 'px monospace';

                    //darw control area
                    gui.save();
                    gui.beginPath();
                    gui.rect(left, up, w, h);
                    gui.clip();
                    gui.font = fontStyle;
                    gui.lineWidth = 5;

                    //draw control background
                    if (control.hasBackground) {
                        gui.fillStyle = control.mouseup ? control.backgroundUp : control.background;
                        gui.fillRect(left, up, w, h);

                    } else if (control.hasProgress) {
                        gui.clearRect(left, up, w, h);

                    }

                    //draw progress filled Area
                    if (control.hasProgress) {
                        gui.fillStyle = control.progressColor;

                        if (w > h) {
                            progressFill = w * control.getProgress() / 100;
                            gui.fillRect(left, up, progressFill, h);

                        } else {
                            progressFill = h * control.getProgress() / 100;
                            gui.fillRect(left, down - progressFill, w, progressFill);

                        }
                        
                        text = parseInt(control.getProgress()) + '%';
                        gui.fillStyle = control.fontColor;
                        textSize = text.length * fontsizeW;
                        gui.fillText(text, cx - textSize / 2, cy + fontsizeW / 2);

                    } else {

                        //draw label text
                        gui.fillStyle = control.mouseup ? control.fontColorUp : control.fontColor;
                        if (control.multiline) {
                            for (var j = 0, numLines = control.label.length; j < numLines; j++) {
                                text = control.label[j];
                                textSize = text.length * fontsizeW;
                                gui.fillText(text, cx - textSize / 2, (up + ph) + ((fontsizeH + 3) * (j + 1)));

                            }   //end for

                        } else {
                            text = control.label;
                            textSize = text.length * fontsizeW;
                            gui.fillText(control.label, cx - textSize / 2, cy + fontsizeH / 2);

                        }

                    }

                    //draw control brder
                    if (control.hasBorder) {
                        gui.strokeStyle = control.mouseup ? control.borderColorUp : control.borderColor;
                        gui.strokeRect(left, up, w, h);
                    }

                    gui.restore();

                }   //end if isVisible

            }   //end for

            gui.restore();

        }

    }

    self.repaintGUIControl = function(guiControl) {
        var sw;
        var sh;
        var x, y, w, h, fontStyle, fontsizeW, fontsizeH, text, textSize, up, left, down, rigth, progressFill;

        gui.save();

        if (enable) {

            if (guiControl.visible) {

                //compute control points
                x = guiControl.x * pw;
                y = guiControl.y * ph;
                w = guiControl.w * pw;
                h = guiControl.h * ph;
                sw = w / 2;
                sh = h / 2;
                up = y - sh;
                left = x - sw;
                down = y + sh;
                rigth = x + sw;
                fontsizeH = guiControl.fontSize * ph;
                fontsizeW = fontsizeH / 2;
                fontStyle = (w > h ? fontsizeH : fontsizeW) + 'px monospace';

                //darw control area
                gui.save();
                gui.beginPath();
                gui.rect(left, up, w, h);
                gui.clip();
                gui.font = fontStyle;
                gui.lineWidth = 5;

                //draw control background
                if (guiControl.hasBackground) {
                    gui.fillStyle = guiControl.mouseup ? guiControl.backgroundUp : guiControl.background;
                    gui.fillRect(left, up, w, h);

                } else if (guiControl.hasProgress) {
                    gui.clearRect(left, up, w, h);

                }

                //draw progress filled Area
                if (guiControl.hasProgress) {
                    gui.fillStyle = guiControl.progressColor;

                    if (w > h) {
                        progressFill = w * guiControl.getProgress() / 100;
                        gui.fillRect(left, up, progressFill, h);

                    } else {
                        progressFill = h * guiControl.getProgress() / 100;
                        gui.fillRect(left, down - progressFill, w, progressFill);

                    }
                    text = parseInt(guiControl.getProgress()) + '%';
                    gui.fillStyle = guiControl.mouseup ? guiControl.fontColorUp : guiControl.fontColor;
                    textSize = text.length * fontsizeW;
                    gui.fillText(text, x - textSize / 2, y + fontsizeW / 2);

                } else {

                    //draw label text
                    gui.fillStyle = guiControl.mouseup ? guiControl.fontColorUp : guiControl.fontColor;
                    if (guiControl.multiline) {
                        for (var j = 0, numLines = guiControl.label.length; j < numLines; j++) {
                            text = guiControl.label[j];
                            textSize = text.length * fontsizeW;
                            gui.fillText(text, x - textSize / 2, (up + ph) + ((fontsizeH + 3) * (j + 1)));

                        }   //end for

                    } else {
                        text = guiControl.label;
                        textSize = text.length * fontsizeW;
                        gui.fillText(guiControl.label, x - textSize / 2, y + fontsizeH / 2);

                    }

                }

                //draw control brder
                if (guiControl.hasBorder) {
                    gui.strokeStyle = guiControl.mouseup ? guiControl.borderColorUp : guiControl.borderColor;
                    gui.strokeRect(left, up, w, h);
                }

                gui.restore();

            }   //end if control.isVisible

            gui.restore();

        }   //end if GUI enable 

    };

    self.showPointer = false;

    self.repaint = repaintGUI;

    self.setScreenSize = function (w, h) {
        screenw = w;
        screenh = h;

        target.width = w;
        target.height = h;

        pw = w / 100;
        ph = h / 100;

        repaintGUI();
    };

    self.addControl = function (control) {
        if (enable && control instanceof GUIControl) {
            controls.push(control);
            repaintGUI();
        }
    };

    self.useLayout = function (layout) {

        gui.clearRect(0, 0, screenw, screenh);
        changed = true;

        if (layout !== null) {
            enable = true;
            delayControl.reset();

            //reset all clickeds controls
            controls = layout;
            for (var i = 0; i < layout.length; i++) {
                layout[i].mouseup = false;
            }

        } else {
            controls = null;
            enable = false;
        }

        repaintGUI();
    };

    self.enable = function (isEnable) {
        enable = isEnable || false;
    };

    self.setDelay = function (delay) {
        delayControl.delay = delay || 100;
    };

    self.createGUILayout = function () {
        return new Array();
    };

    self.createGUIControl = function (type, label, x, y, z, w, h, onclick) {
        var control = new GUIControl(label, x, y, z, w, h, onclick);

        switch (type) {
            case 'TEXTBOX':
                control.multiline = true;
                break;
            case 'BUTTON':
                control.clickeable = true;
                break;
            case 'PROGRESSBAR':
                control.hasProgress = true;
                break;
            case 'PANNEL':
                control.visible = false;
                control.clickeable = true;

                break;
        }

        return control;
    };

    return self;
}

function GUIControl(label, x, y, w, h, onclick) {

    this.x = x || 0;
    this.y = y || 0;
    this.w = w || 1;
    this.h = h || 1;

    this.fontSize = 2;
    this.label = label;
    var progress = 0;

    this.fontColor = 'black';
    this.background = 'white';
    this.borderColor = 'blue';
    this.progressColor = 'lime';

    this.fontColorUp = 'black';
    this.backgroundUp = 'gray';
    this.borderColorUp = 'lime';

    this.mouseup = false;
    this.clickeable = false;
    this.hasBorder = true;
    this.hasBackground = true;
    this.hasProgress = false;
    this.visible = true;
    this.multiline = false;

    this.onclick = onclick || null;
    this.onmousemove = null;

    this.setProgress = function (newProgress, asigneColor) {
        if (newProgress >= 0 && newProgress < 101) {
            progress = newProgress;

            if (asigneColor) {
                if (newProgress >= 90) {
                    this.progressColor = 'lime';
                } else if (newProgress >= 30) {
                    this.progressColor = 'yellow';
                } else if (newProgress >= 10) {
                    this.progressColor = 'orange';
                } else {
                    this.progressColor = 'red';
                }
            }
        }
    };

    this.getProgress = function () {
        return progress;
    };
}

