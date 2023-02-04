
window.RenderizableModel || (window.RenderizableModel = function () {});
window.RenderizableModel.Instance || (window.RenderizableModel.Instance = function () {});

function TextPlaneGenerator(){}

(function () {
    var identityMatrix = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    
    //Text Plane Generator
    ////////////////////////////////////////////////////////////////////////////
    TextPlaneGenerator.preserveBufferData = false;

    TextPlaneGenerator.buildTextPlane = function (gl, cols, rows) {
        cols = parseInt(cols || 10);
        rows = parseInt(rows || 10);

        var textPlane = new TextPlaneGenerator.TextPlane(cols, rows);

        var numPoligons = rows * cols;
        var centerX = parseInt(cols / 2);
        var centerY = parseInt(rows / 2);

        var vertexBuffer;
        var vertexBufferAttribs;
        var indexBuffer;

        var vertexDataBuffer = new ArrayBuffer(numPoligons * 48);
        var vertexView = new DataView(vertexDataBuffer);
        var vertexsNumber = 0;
        var vertexViewOffset = 0;
        var vertexViewStride = 48;

        var indexDataBuffer = new Uint16Array(numPoligons * 6);
        var indexDataBufferOffset = 0;
        var indexDataBufferStride = 6;

        var pointIndex;

        //store poligons on buffer
        for (var y = rows; y > 0; y--) {
            for (var x = 0; x < cols; x++) {

                pointIndex = x * y;

                //add poligon vertexs
                //////////////////////////////////////////////////////

                //add fir'st poligon vertex (X,Y-1)
                vertexView.setInt16(vertexViewOffset + 0, x - centerX, true);
                vertexView.setInt16(vertexViewOffset + 2, y - centerY - 1, true);
                vertexView.setInt16(vertexViewOffset + 4, 0, true);
                vertexView.setInt16(vertexViewOffset + 6, 0, true);
                vertexView.setUint32(vertexViewOffset + 8, pointIndex, true);

                //add seco'nd poligon vertex (X+1,Y-1)
                vertexView.setInt16(vertexViewOffset + 12, x - centerX + 1, true);
                vertexView.setInt16(vertexViewOffset + 14, y - centerY - 1, true);
                vertexView.setInt16(vertexViewOffset + 16, 1, true);
                vertexView.setInt16(vertexViewOffset + 18, 0, true);
                vertexView.setUint32(vertexViewOffset + 20, pointIndex, true);

                //add three'rd poligon vertex (x+1, Y)
                vertexView.setInt16(vertexViewOffset + 24, x - centerX + 1, true);
                vertexView.setInt16(vertexViewOffset + 26, y - centerY, true);
                vertexView.setInt16(vertexViewOffset + 28, 1, true);
                vertexView.setInt16(vertexViewOffset + 30, 1, true);
                vertexView.setUint32(vertexViewOffset + 32, pointIndex, true);

                //add for'th poligon vertex (x, Y)
                vertexView.setInt16(vertexViewOffset + 36, x - centerX, true);
                vertexView.setInt16(vertexViewOffset + 38, y - centerY, true);
                vertexView.setInt16(vertexViewOffset + 40, 0, true);
                vertexView.setInt16(vertexViewOffset + 42, 1, true);
                vertexView.setUint32(vertexViewOffset + 44, pointIndex, true);
                //////////////////////////////////////////////////////

                //add poligon indexs
                //////////////////////////////////////////////////////

                indexDataBuffer[indexDataBufferOffset + 0] = vertexsNumber + 0;
                indexDataBuffer[indexDataBufferOffset + 1] = vertexsNumber + 1;
                indexDataBuffer[indexDataBufferOffset + 2] = vertexsNumber + 2;

                indexDataBuffer[indexDataBufferOffset + 3] = vertexsNumber + 2;
                indexDataBuffer[indexDataBufferOffset + 4] = vertexsNumber + 3;
                indexDataBuffer[indexDataBufferOffset + 5] = vertexsNumber + 0;
                //////////////////////////////////////////////////////

                //update buffers offset
                vertexsNumber += 4;
                vertexViewOffset += vertexViewStride;
                indexDataBufferOffset += indexDataBufferStride;
            }
        }

        //create and store vertex buffer
        vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertexDataBuffer, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        //create and store index buffer
        indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexDataBuffer, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        //define vertex attribs
        vertexBufferAttribs = {};
        vertexBufferAttribs.coords = {type: gl.SHORT, size: 2, offset: 0, normalized: false};
        vertexBufferAttribs.texels = {type: gl.SHORT, size: 2, offset: 4, normalized: false};
        vertexBufferAttribs.index = {type: gl.UNSIGNED_INT, size: 1, offset: 8, normalized: false};

        //define vertex buffer properties
        vertexBuffer.byteLength = numPoligons * vertexViewStride;
        vertexBuffer.vertexsNumber = numPoligons * 4;
        vertexBuffer.vertexStride = vertexViewStride / 4;
        vertexBuffer.vertexAttribs = vertexBufferAttribs;
        vertexBuffer.bufferData = this.preserveBufferData ? vertexDataBuffer : null;

        //define index buffer properties
        indexBuffer.byteLength = numPoligons * indexDataBufferStride * 2;
        indexBuffer.indexsNumber = numPoligons * 6;
        indexBuffer.indexStride = 2;
        indexBuffer.indexUnpackFormat = gl.UNSIGNED_SHORT;
        indexBuffer.bufferData = this.preserveBufferData ? vertexDataBuffer : null;

        textPlane.vertexBuffer = vertexBuffer;
        textPlane.indexBuffer = indexBuffer;

        this.logStats(textPlane);

        return textPlane;
    };

    TextPlaneGenerator.parseByteScale = function (value) {
        var integer;
        var decimal;
        var symbol;

        value || (value = 0);

        if (value >= 1048576) {
            value = value / 1048576;
            symbol = ' MB';

        } else if (value > 1024) {
            value = value / 1024;
            symbol = ' KB';

        } else {
            symbol = ' B';
        }

        integer = parseInt(value);
        decimal = parseFloat(((value - integer) + '').slice(0, 4));

        return integer + decimal + symbol;
    };

    TextPlaneGenerator.getRenderShader = function (gl) {

    };

    TextPlaneGenerator.logStats = function (textPlane) {
        var stats = 'TEXT PLANE BUILDED\n{\n';

        stats += '\t rows: ' + textPlane.rows + '\n';
        stats += '\t cols: ' + textPlane.cols + '\n';
        stats += '\t vertexs: ' + textPlane.vertexBuffer.vertexsNumber + '\n';
        stats += '\t indexs: ' + textPlane.indexBuffer.indexsNumber + '\n';
        stats += '\t triangles: ' + textPlane.vertexBuffer.vertexsNumber / 4 * 2 + '\n';
        stats += '\t vertex_buffer_size: ' + this.parseByteScale(textPlane.vertexBuffer.byteLength) + '\n';
        stats += '\t index_buffer_size: ' + this.parseByteScale(textPlane.indexBuffer.byteLength) + '\n';
        stats += '\t total_buffer_size: ' + this.parseByteScale(textPlane.vertexBuffer.byteLength + textPlane.indexBuffer.byteLength) + '/' + this.parseByteScale(textPlane.indexBuffer.indexsNumber * textPlane.vertexBuffer.vertexStride) + '\n';

        stats += '}';

        console.log(stats);
    };

    //Renderizable Text Plane
    ////////////////////////////////////////////////////////////////////////////
    TextPlaneGenerator.TextPlane = function (cols, rows) {

        this.vertexBuffer = null;
        this.indexBuffer = null;

        this.shader = null;

        this.cols = cols;
        this.rows = rows;
        this.prepared = false;

        this.drawCalls = new Array();
        this.drawCallsNumber = 0;
    }

    TextPlaneGenerator.TextPlane.prototype = Object.create(RenderizableModel.prototype);

    TextPlaneGenerator.TextPlane.prototype.makeInstance = function () {
        return new TextPlaneGenerator.TextPlane.Instance(this);
    };

    TextPlaneGenerator.TextPlane.prototype.prepare = function (gl, shader) {

        if (!shader)
            return;

        //buffers values
        var vertexBuffer = this.vertexBuffer;
        var vertexAttribs = vertexBuffer.vertexAttribs;

        //shader values
        var shaderAttribs = shader.attribs;

        //attribs asignation
        var vertexStride = vertexBuffer.vertexStride;
        var vertexAttrib = null;
        var shaderAttrib = null;

        //LINK BUFFER TO ATTRIBs LOCATIONs
        /////////////////////////////////////////////////////////
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

        //vertex coord´s attrib
        vertexAttrib = vertexAttribs.coords;
        shaderAttrib = shaderAttribs.coords;

        if (shaderAttribs >= 0) {
            if (vertexAttrib) {
                gl.enableVertexAttribArray(shaderAttrib);
                gl.vertexAttribPointer(shaderAttrib, vertexAttrib.size, vertexAttrib.type, vertexAttrib.normalized, vertexStride, vertexAttrib.offset);

            } else {
                gl.disableVertexAttribArray(shaderAttrib);
                gl.vertexAttrib2f(shaderAttrib, 0, 0);

            }
        }
        /////////////////////////

        //vertex normal attrib
        vertexAttrib = vertexAttribs.normals;

        if (shaderAttribs >= 0) {
            gl.disableVertexAttribArray(shaderAttrib);
            gl.vertexAttrib3f(shaderAttrib, 0, 0, 1);
        }
        /////////////////////////

        //vertex texCoord´s attrib
        vertexAttrib = vertexAttribs.texels;
        shaderAttrib = shaderAttribs.texels;

        if (shaderAttribs >= 0) {
            if (vertexAttrib) {
                gl.enableVertexAttribArray(shaderAttrib);
                gl.vertexAttribPointer(shaderAttrib, vertexAttrib.size, vertexAttrib.type, vertexAttrib.normalized, vertexStride, vertexAttrib.offset);

            } else {
                gl.disableVertexAttribArray(shaderAttrib);
                gl.vertexAttrib2f(shaderAttrib, 0, 0);

            }
        }
        /////////////////////////

        //vertex pointIndex attrib
        vertexAttrib = vertexAttribs.index;
        shaderAttrib = shaderAttribs.index;

        if (shaderAttribs >= 0) {
            if (vertexAttrib) {
                gl.enableVertexAttribArray(shaderAttrib);
                gl.vertexAttribPointer(shaderAttrib, vertexAttrib.size, vertexAttrib.type, vertexAttrib.normalized, vertexStride, vertexAttrib.offset);

            } else {
                gl.disableVertexAttribArray(shaderAttrib);
                gl.vertexAttrib2f(shaderAttrib, 0);

            }
        }
        /////////////////////////


        //Close buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

        this.prepared = true;

    };

    TextPlaneGenerator.TextPlane.prototype.unprepared = function (gl, shader) {
        if (!shader)
            return;

        shader.attribs.disable(gl);
        this.prepared = false;
    };

    TextPlaneGenerator.TextPlane.prototype.addDrawCall = function (drawCallInstance) {
        if (drawCallInstance instanceof TextPlaneGenerator.Instance) {
            this.drawCalls[this.drawCallsNumber] = drawCallInstance;
            this.drawCallsNumber++;
        }

        return drawCallInstance;
    };

    TextPlaneGenerator.TextPlane.prototype.executeDrawCalls = function (gl) {

        //model buffers
        var indexBuffer = this.indexBuffer;

        //model resources
        var shaderUniforms = this.shader.uniforms;

        //model draw vars
        var indexsNumber;
        var indexUnpackFormat;

        //draw calls vars
        var drawCalls = this.drawCalls;
        var drawCallsNumber = this.drawCallsNumber;

        //prepare unrepared model 
        if (!this.prepared) {
            this.prepare(gl);
        }

        //draw each instance call's
        //////////////////////////////////////////////////////////
        if (indexBuffer) {
            indexsNumber = indexBuffer.indexsNumber;
            indexUnpackFormat = indexBuffer.indexUnpackFormat;

            for (var i = 0; i < drawCallsNumber; i++) {
                drawCalls[i].drawCallInstance.sendStateUniforms(gl, shaderUniforms);

                gl.drawElements(gl.TRIANGLES, indexsNumber, indexUnpackFormat, 0);

                this.drawCallsNumber--;
            }
        }
        //////////////////////////////////////////////////////////


        this.unprepare(gl);
    };

    TextPlaneGenerator.TextPlane.prototype.draw = function (gl, drawMode) {
        if (this.indexBuffer)
            gl.drawElements(drawMode || gl.TRIANGLES, this.indexBuffer.indexsNumber, this.indexBuffer.indexUnpackFormat, 0);

    };

    //Text Plane Instance
    ////////////////////////////////////////////////////////////////////////////
    TextPlaneGenerator.TextPlane.Instance = function (model) {

        this.model = model;
        this.font = null;
        this.size = model.coords * model.rows;

        this.coords = {x: 0, y: 0, z: 0};

        this.matrix = new Float32Array(identityMatrix);
        this.string = new Array(size);
        this.text = '';

        //initialize character's containers
        for (var i = 0; i < size; i++) {
            this.string[i] = {
                s: 0, t: 0, iw: 0, ih: 0, //subsampler
                r: 0, g: 0, b: 0          //font color
            };
        }
        ///////////////////////////////////

    };

    TextPlaneGenerator.TextPlane.Instance.prototype = Object.create(RenderizableModel.Instance.prototype);
    
})();



