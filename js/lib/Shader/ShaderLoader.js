
function ShaderLoader() {}

ShaderLoader.prototype.createShader = function (gl, vertexCode, fragmentCode) {

    var vertexShader;
    var vertexShaderInfoLog;

    var fragmentShader;
    var fragmentShaderInfoLog;

    var shaderProgram;
    var linkStatus;
    var shaderProgramInfoLog;

    //create and compile vertex shader
    vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexCode);
    gl.compileShader(vertexShader);
    vertexShaderInfoLog = gl.getShaderInfoLog(vertexShader);

    //create and compile fragment shader
    fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentCode);
    gl.compileShader(fragmentShader);
    fragmentShaderInfoLog = gl.getShaderInfoLog(fragmentShader);


    //create and link shader program
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    linkStatus = gl.getProgramParameter(shaderProgram, gl.LINK_STATUS);

    if (!linkStatus) {

        shaderProgramInfoLog = gl.getProgramInfoLog(shaderProgram);
        console.error('Error linking a Shader Program.');
        console.error('Shader Program Info Log: \n' + shaderProgramInfoLog);
        console.error('Vertex Shader Compilation Trace: \n' + vertexShaderInfoLog + '\n' + vertexCode);
        console.error('Fragment Shader Compilation Trace: \n' + fragmentShaderInfoLog + '\n' + fragmentCode);

        gl.deleteProgram(shaderProgram);
        shaderProgram = null;

    
    }


    

    return shaderProgram;
};

ShaderLoader.prototype.loadShaderFiles = function (gl, vertexURL, fragmentURL) {

    var vertexCode = null;
    var fragmentCode = null;
    var shaderProgram = null;

    var url = null;
    var http = new XMLHttpRequest();

    try {
        if (vertexURL) {
            url = vertexURL;
            http.open('GET', url, false);
            http.send(null);
            vertexCode = http.responseText;

        }

        if (fragmentURL) {
            url = fragmentURL;
            http.open('GET', url, false);
            http.send(null);
            fragmentCode = http.responseText;

        }

        if (vertexCode && fragmentCode) {
            shaderProgram = this.createShader(gl, vertexCode, fragmentCode);
        }

    } catch (e) {
        console.error('Error loading Shader file on URL ' + url);
    }
    //console.log(vertexCode);
    //console.log(fragmentCode);

    return shaderProgram;
};

ShaderLoader.prototype.loadShaderFilesColection = function (gl, urls) {

    var vertexCode = null;
    var fragmentCode = null;
    var url = null;

    var length = parseInt(urls.length / 2);
    var shadersPrograms = new Array(length);

    var http = new XMLHttpRequest();

    if (urls.length % 2 === 0) {
        for (var i = 0; i < length; i++) {

            //load vertex shader source
            url = urls[i];
            http.open('GET', url, false);

            try {
                http.send();

                if (http.responseText)
                    vertexCode = http.responseText;

                //load fargment shader source
                url = urls[i + 1];
                http.open('GET', url, false);
                http.send();

                if (http.responseText)
                    fragmentCode = http.responseText;

                //create and store shader program
                if (vertexCode && fragmentCode) {
                    shadersPrograms[i] = this.createShader(gl, vertexCode, fragmentCode);
                } else {
                    shadersPrograms[i] = null;
                }

            } catch (e) {
                console.error('Error loading Shader file on URL ' + url);
            }

            //clear shaders source
            vertexCode = null;
            fragmentCode = null;
        }
    }

    return shadersPrograms;
};
