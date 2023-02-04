
// this module has a control of geometrical model files importation
var models = new (function () {
    var game = null;

    this.cache = {};    // make cache dictionary
    this.rootPath = ''; // path of root model folder
    
    // model upload error event handler
    function onerror (responseID, url){
        console.error("Can't be load a file on URL: " + url);
        
    };
    
    // initialize model loader's
    this.init = function (igame, rootPath) {
        game = igame;
        game.models = this;
        
        this.gl = game.renderer.gl;
        this.rootPath = rootPath || '';
        
        // get model loaders reference's
        this.objLoader = window.OBJModelLoader;
        this.stlLoader = window.STLModelLoader;
        
        // generate render shader's
        this.objLoader.getOBJRenderShader(this.gl);
        this.stlLoader.getSTLRenderShader(this.gl);
        
        // set error callback's
        this.objLoader.onerror = onerror;
        this.stlLoader.onerror = onerror;
        
    };
    
    // request and load an typed model file from host or server
    this.load = function (url, type, optScale, optName) {
        var model;

        if (this.cache[url]) {
            // use model from cache
            model = this.cache[url];
            
        } else {
            // load typed model from source file
            switch (type.toLowerCase()) {
                case 'obj':        //load a wavefont OBJ model
                    model = this.objLoader.loadOBJFile(this.gl, this.rootPath + '/' + url, optScale || 1.0, 0);
                    break;
                case 'ascii-stl':  //load a stereoscopic STL model
                    model = this.stlLoader.loadASCIISTLFile(this.gl, this.rootPath + '/' + url, optScale || 1.0, 0);
                    break;
                case 'bin-stl':    //load a stereoscopic STL model from bynary buffer
                    model = this.stlLoader.loadBinarySTLFile(this.gl, this.rootPath + '/' + url, optScale || 1.0, 0);
                    break;
                default:
                    console.warn('UNRECOGNIZED IMPORTATION FORMAT ' + type);
            }
            
            if (model && !this.cache[url]) {
                // memoryze  model reference on cache using (url and name)
                this.cache[url] = model;        
                this[optName ? model.name = optName : model.name] = model;
                
                // add model to scene
                game.scene.addModel(model, optName);
                
            }

        }
        
        return type;
    };
    
    // get model from cache usisng it name
    this.get = function(name){
        return this[name];
    };
    
    return this;
    
})();


