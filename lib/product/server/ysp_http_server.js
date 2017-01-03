'use babel';

var zipRootPath = __dirname;
var httpServerRuning = false;

export default class YSPHttpServer {

    httpServer: null;
    port: null;
    complate: null;
    testServerUrlCallback: null;

    constructor(serializedState) {
        createZipFolder();
        console.info('ysp http server zip root : ' + zipRootPath);
    }

    run(callback) {
        complate = callback;
        if (httpServerRuning) {
            console.info('ysp http server is running');
            return;
        }

        var http = require('http');
        var server = http.createServer();
        server.listen(0);
        server.on('listening', function() {
            var p = server.address().port;
            server.close();
            startServer(p);
        })
    }

    stop() {
        this.httpServer.close();
        console.info('ysp http server closed');
        httpServerRuning = false;
    }

    isRunning() {
        return httpServerRuning;
    }

    generateZip(callback) {
        createZip(callback);
    }

    getServerPort() {
        return getPort();
    }

    getTestUrl(callback) {
              testServerUrlCallback = callback;
    }
}

function getPort() {
    if (httpServerRuning) {
        return this.httpServer.address().port;
    }
    return 0;
}

function startServer(port) {
    var url = require('url');
    var http = require('http');
    var fs = require('fs');
    var path = require('path');

    this.httpServer = http.createServer(function(req, res) {
        var action = url.parse(req.url).pathname
        if (action == '/beat') {
            res.end("success");
        } else if (action == '/closeServer') {
            res.end("server closed");
            httpServer.close();
            console.info('ysp server closed');
            httpServerRuning = false;
        } else if (action == '/log') {
            var type = url.parse(req.url, true).query.t;
            var log = decodeURI(url.parse(req.url, true).query.l);
            require('./../ysp_log.js').ysp_log(type, log);
            res.end("log end");
        } else if (action == '/yspZip.zip') {
            createZip(function() {

                var projectPath = require('./../common.js').rootPath();
                var tmp = projectPath.split(path.sep);
                var projectName = tmp[tmp.length - 1];

                //readfile to response
                var filePath = path.normalize(zipRootPath + '/' + projectName + '.zip');
                try {
                    var zipBinary = fs.readFileSync(filePath, "binary");
                    res.writeHead(200, {
                        'Content-Type': 'application/zip'
                    });
                    res.write(zipBinary, "binary");
                    res.end('zip success');
                } catch (e) {
                    res.writeHead(500, {
                        'Content-Type': 'text/plain'
                    });
                    res.end('zip not found');
                } finally {

                }

            });
        }
    });
    this.httpServer.listen(port, () => {
        httpServerRuning = true;
        console.info('ysp http server success , port:' + getPort());
        if (window.testServerUrlCallback!=null) {
        testServerUrlCallback('http://' + require('./../common').getLocalIp() + ':' + getPort() + '/beat');
        }
        if (window.complate!=null) {
        complate(getPort());
        }
    });
}

function createZipFolder() {
    var fs = require('fs');
    var path = require('path');

    zipRootPath = path.normalize(require('./../common').rootPath() + '/build');
    try {
        fs.accessSync(zipRootPath, fs.F_OK);
    } catch (e) {
        fs.mkdirSync(zipRootPath, 0777);
    }

    zipRootPath = path.normalize(require('./../common').rootPath() + '/build/ios');
    try {
        fs.accessSync(zipRootPath, fs.F_OK);
    } catch (e) {
        fs.mkdirSync(zipRootPath, 0777);
    }
}

function createZip(callback) {
    var JSZip = require("jszip");
    var fs = require('fs');
    var path = require('path');
    var zip = new JSZip();

    createZipFolder();

    var projectPath = require('./../common.js').rootPath();
    var tmp = projectPath.split(path.sep);
    var projectName = tmp[tmp.length - 1];

    addFile2Zip(zip, projectPath)

    var zipSavePath = path.normalize(zipRootPath + '/' + projectName + '.zip');
    zip.generateNodeStream({
            type: 'nodebuffer',
            streamFiles: true
        })
        .pipe(fs.createWriteStream(zipSavePath))
        .on('finish', function() {
            console.info("generate zip : " + zipSavePath);
            callback();
        });
}

function addFile2Zip(zip, root) {
    var fs = require('fs');
    var path = require('path');

    var files = fs.readdirSync(root);
    files.forEach(function(file) {
        var filePath = path.normalize(root + '/' + file);
        if (fs.statSync(filePath).isFile()) {
            if (path.extname(filePath) != '.zip') {
                zip.file(file, fs.readFileSync(filePath));
            }
        }
        if (fs.statSync(filePath).isDirectory()) {
            if (file != "build") {
                addFile2Zip(zip.folder(file), filePath);
            }
        }
    });
}