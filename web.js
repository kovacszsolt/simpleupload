const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const path = require('path');
const sharp = require('sharp');

let hostName = '';

// check upload directory
var fs = require('fs');
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}

/**
 * Image Resizer
 * @param width
 * @param height
 * @param sourceFile
 * @param targetFile
 */
function resize(width, height, sourceFile, targetFile) {
    console.log(sourceFile);
    sharp(sourceFile)
        .rotate()
        .resize(width, height)
        .toFile(targetFile, (err, info) => {
            console.log('err', err);
            console.log('info', info);
        });
}

/**
 * create images
 * @param size
 * @param file
 */
function createResolution(size, file) {
    const targetPath = '_public/uploads/' + size.key;
    const originalPath = '_public/uploads/' + file.originalname;
    if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath);
    }
    resize(size.width, size.height, originalPath, targetPath + '/' + file.originalname);
}

/**
 * main response object
 * @type {{id: number, ref_id: string, path: string, thumbnail_paths: {}, preview_image_paths: {}, name: string, type: string, order: string, is_default: boolean}}
 */
responseObject = {
    "id": 1,
    "ref_id": "5ba008dc3cf0c12b75581277",
    "path": "",
    "thumbnail_paths": {
    },
    "preview_image_paths": {},
    "name": "",
    "type": "IMAGE",
    "order": "1",
    "is_default": false
}

/**
 * resolution size
 * @type {*[]}
 */
resolutions = [
    {key: 'S', width: 256, height: 144},
    {key: 'M', width: 640, height: 360},
    {key: 'L', width: 960, height: 540},
    {key: 'XL', width: 1280, height: 720}
];


// upload file with multer
var multer = require('multer');
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './_public/uploads')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
})
var upload = multer({storage: storage}).single('files');
const app = express();

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

/**
 * PORT NUMBER: 3000
 */
app.set('port', 3000);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


app.get('/', function (req, res) {
    res.send({status: 'hello world'});
});

app.post('/send/', function (req, res, next) {
    upload(req, res, function (err) {
        if (err) {
            console.log(err);
            return res.end({status: 'error'});
        }
        hostName = req.protocol + '://' + req.hostname + ':' + app.get('port');
        responseObject.path = hostName + '/uploads/' + req.file.originalname;
        responseObject.name = req.file.originalname;
        resolutions.map((resolution) => {
            createResolution(resolution, req.file);
            responseObject.thumbnail_paths[resolution.key] = hostName + '/uploads/' + resolution.key + '/' + req.file.originalname;
        });
        res.send(responseObject);
    })
});
app.use(express.static('./_public'));

app.listen(app.get('port'), function () {
    console.log('running on port', app.get('port'))
})
