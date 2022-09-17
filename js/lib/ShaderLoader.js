
function ShaderLoader() {

    var self = this;

    self.createShader = function (gl, vertexCode, fragmentCode, shaderID) {
        
        var vertexShader;
        var vertexShaderInfoLog;

        var fragmentShader;
        var fragmentShaderInfoLog;

        var shaderProgram;
        var linkStatus;
        var shaderProgramInfoLog;
        

        shaderProgram = null;
        shaderID || (shaderID = 0);

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

        if (!(vertexShaderInfoLog || fragmentShaderInfoLog)) {

            //create and link shader program
            shaderProgram = gl.createProgram();
            gl.attachShader(shaderProgram, vertexShader);
            gl.attachShader(shaderProgram, fragmentShader);
            gl.linkProgram(shaderProgram);

            linkStatus = gl.getProgramParameter(shaderProgram, gl.LINK_STATUS);

            if (!linkStatus) {

                shaderProgramInfoLog = gl.getProgramInfoLog(shaderProgram);
                console.error('Error linking a Shader Program. ID: ' + shaderID);
                console.error('Shader Program Info Log: \n' + shaderProgramInfoLog);
                gl.deleteProgram(shaderProgram);
                shaderProgram = null;

            }

        } else {

            console.error('An Error Ocurred On Shaders Compilation. ID: ' + shaderID + '\n');
            console.error('Vertex Shader Compilation Trace: \n' + vertexShaderInfoLog);
            console.error('Fragment Shader Compilation Trace: \n' + fragmentShaderInfoLog);

        }

        return shaderProgram;
    };

    self.loadShadersFiles = function (gl, vertexURL, fragmentURL, responseCallBack, shaderID) {
        
        var url;
        var http;
        var vertexCode;
        var fragmentCode;
        
        //create request
        http = new XMLHttpRequest();
        http.id = shaderID || 0.0;
        http.onerror = onHTTPError;
        
        url = vertexURL;
        http.onload = createVertexShader;
        http.open('GET', vertexURL, true);
        http.send(null);

        function onHTTPError() {
            console.error('An error ocurred when load URL: ' + url);
            !responseCallBack || responseCallBack(null , shaderID);
        }
        
        function createVertexShader() {
            vertexCode = http.responseText;

            url = fragmentURL;
            http.onload = createFragmentShader;
            http.open('GET', fragmentURL, true);
            http.send(null);
        }

        function createFragmentShader() {
            fragmentCode = http.responseText;
            createShaderProgram();
        }

        function createShaderProgram() {
            var shader = self.createShader(gl, vertexCode, fragmentCode, shaderID);
            !responseCallBack || responseCallBack(shader , shaderID);
        }

    };
    
    return self;
}


