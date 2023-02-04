
window.RenderizableModel || (window.RenderizableModel = function () {});
window.RenderizableModel.Instance || (window.RenderizableModel.Instance = function () {});
window.RenderizableModel.Material || (window.RenderizableModel.Material = function () {});

function DAEModelLoader(){}

var xmlTest;

(function(){
    
    DAEModelLoader.loadDAEFile = function(gl, url, scale, responseCallBack){
        
        var self = this;
        var XHR = new XMLHttpRequest();
        var fileInfo;
        
        XHR.open('GET', url, true);
        XHR.responseType = "document";
        XHR.onload = function(){
            console.timeEnd('loading');
            console.log('LOG: Loaded (Asyncronized) DAE Model on URL ' + url);

            fileInfo = self.parseFileInfo(url);
            responseCallBack && responseCallBack(self.parseDAEDocument(gl, fileInfo, this.response, scale));
        };
        
        XHR.onerror = function(){
            console.timeEnd('loading');
            console.error('ERROR: Loading DAE Model on URL ' + url);

            responseCallBack && responseCallBack(null);
        };
        
        console.time('loading');
        XHR.send(null);
        
    };
    
    DAEModelLoader.parseDAEDocument = function(gl, fileInfo, sourceDAEDocumentXML, scale){
        xmlTest = sourceDAEDocumentXML;
        console.log(sourceDAEDocumentXML);
    };
    
    DAEModelLoader.createNewWorkGroup = function(gl, fileInfo, sourceDAEDocumentXML, scale) {
        var workGroup = {};
        
        //define model param's
        workGroup.gl = gl;
        workGroup.scale = scale;
        
        //define model source data
        workGroup.sourceXML = sourceDAEDocumentXML;
        
        //define model file information
        workGroup.fileRoot = fileInfo.root;
        workGroup.fileName = fileInfo.name;
        
        //define used model libraries
        workGroup.textures = null;
        workGroup.materials = null;
        workGroup.geometrys = null;
        
        return workGroup;
    };
    
    DAEModelLoader.parseFileInfo = function (srcFilePath) {

        /*  Get path components separateds by '/' backSlash
         *  Exp: models/model_1/model_1.obj 
         *  --> [models, model_1, model_1.obj]
         */
        var filePathWords = srcFilePath.split('/');
        var fileInfo;
        var fileRoot;
        var fileName;

        //get file path excluding fileName and join be backslash
        fileRoot = filePathWords.slice(0, filePathWords.length - 1).join('/');

        //get file name excluding it extension
        fileName = filePathWords[filePathWords.length - 1];
        fileName = fileName.split('.');
        fileName = fileName.slice(0, fileName.length - 1).join('');

        //store file info
        fileInfo = {
            url: srcFilePath,
            root: fileRoot,
            name: fileName
        };

        return fileInfo;
    };
    
    DAEModelLoader.parseFloat32Array = function(sourceArrayText){
        return new Float32Array(sourceArrayText.split(' '));
    };
    
    DAEModelLoader.parseLibrariesGeometries = function(workGroup, libraryXMLNode){
        
        var geometriesNodesList = libraryXMLNode.getElementsByTagName('geometry');
        var geometriesNodesNumber = geometriesNodesList.length;
        var geometries = new Array(geometriesNodesNumber);
        
        //parse each geometries of the library
        for(var i = 0; i < geometriesNodesNumber; i++){
            geometries[i] = this.parseGeometryNode(workGroup, geometriesNodesList[i]);
        }
        
    };
    
    DAEModelLoader.parseGeometryNode = function(geometryXMLNode){
        var geometry = {};
        var meshesNodesList = geometryXMLNode.getElementsByTagName('mesh');
        var meshesNodesNumber = meshesNodesList.length;
        var meshes = new Array(meshesNodesNumber);
        
        //parse each geometry mesh
        for(var i = 0; i < meshesNodesNumber; i++){
            meshes[i] = this.parseSourceNode(workGroup, meshesNodesList[i]);
        }
        
        //define geometry properties
        geometry.meshes = meshes;
        geometry.vertices = this.parseVerticesNode();
        
        return geometry;
    };
    
    DAEModelLoader.parseMeshNode = function(meshXMLNode){
        var mesh = {};
        var sourcesNodesList = meshXMLNode.getElementsByTagName('source');
        var sourcesNodesNumber = sourcesNodesList.length;
        var sources = new Array(sourcesNodesNumber);
        var polylist = {};
        
        //pase each geometry source
        for(var i = 0; i < sourcesNodesNumber; i++){
            sources[i] = this.parseSourceNode(workGroup, sourcesNodesList[i]);
        }
        
        mesh.sources = sources;
        mesh.polylist = polylist;
        
        return mesh;
    };
    
    
})();