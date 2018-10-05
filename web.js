const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const path = require('path');
const sharp = require('sharp');
const readChunk = require('read-chunk');
const fileType = require('file-type');
var ffmpeg = require('fluent-ffmpeg');
const ROOT = './_public/uploads/';
let hostName = '';

// check upload directory
var fs = require('fs');
if (!fs.existsSync('_public/uploads/')) {
    fs.mkdirSync(previewPath);
}
if (!fs.existsSync('_public/uploads/video/')) {
    fs.mkdirSync('_public/uploads/video/');
}

/**
 * Image Resizer
 * @param width
 * @param height
 * @param sourceFile
 * @param targetFile
 */
function resize(width, height, sourceFile, targetFile) {
    sharp(sourceFile)
        .rotate()
        .resize(width, height)
        .toFile(targetFile, (err, info) => {
            console.log('err', err);
        });
}

/**
 * create images
 * @param size
 * @param file
 */
function createResolution(size, file) {
    const targetPath = ROOT + size.key;
    const originalPath = ROOT + file.originalname;
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
    "ref_id": "",
    "path": "",
    "thumbnail_paths": {},
    "preview_image_paths": {},
    "name": "",
    "type": "IMAGE",
    "order": "1",
    "is_default": false
}
/*
responseList = {
    "content": [],
    "last": true,
    "total_pages": 1,
    "total_elements": 1,
    "first": true,
    "number_of_elements": 1,
    "size": 20,
    "number": 0

}
*/
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
        cb(null, ROOT)
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
})
var upload = multer({storage: storage}).single('file');
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

app.get('/list/', function (req, res) {
    const pageSize = req.query.size;
    const currentPage = parseInt(req.query.page);

    const files = [];
    HOSTNAME = req.protocol + '://' + req.hostname + ':' + app.get('port');
    fs.readdirSync(ROOT).forEach(file => {
        if (!fs.statSync(ROOT + file).isDirectory()) {
            files.push(file);
        }
    });
    const pageCount = Math.ceil(files.length / pageSize);
    console.log('pageCount',pageCount);
    const indexStart = currentPage * (pageSize);
    const indexEnd = (currentPage + 1) * (pageSize);
    const imageList = files.slice(indexStart, indexEnd);
    console.log(indexStart, indexEnd);
    responseList = {
        "content": [],
        "last": (currentPage+1 === pageCount),
        "total_pages": pageCount,
        "total_elements": files.length,
        "first": (currentPage === 0),
        "number_of_elements": imageList.length,
        "size": imageList.length,
        "number": 0

    }
    let index = 0;
    imageList.map((file) => {
        index++;
        const buffer = readChunk.sync(ROOT + file, 0, 4100);
        if (fileType(buffer).mime.startsWith('image')) {
            const currentImage = {
                "id": 1,
                "ref_id": "",
                "path": "",
                "thumbnail_paths": {},
                "preview_image_paths": {},
                "name": "",
                "type": "IMAGE",
                "order": "1",
                "is_default": false
            };
            currentImage.id = index;
            currentImage.name = file;
            currentImage.path = HOSTNAME + '/uploads/' + file;
            const thumbnail_paths = {};
            resolutions.map((mapResponse) => {
                thumbnail_paths[mapResponse.key] = HOSTNAME + '/uploads/' + mapResponse.key + '/' + file;

            });
            currentImage.thumbnail_paths = thumbnail_paths;
            responseList.content.push(currentImage);
        } else if (fileType(buffer).mime.startsWith('video')) {
            const currentImage = {
                "id": 1,
                "ref_id": "",
                "path": "",
                "thumbnail_paths": {},
                "preview_image_paths": {},
                "name": "",
                "type": "IMAGE",
                "order": "1",
                "is_default": false
            };
            currentImage.id = index;
            currentImage.type = 'VIDEO';
            currentImage.name = file;
            currentImage.path = HOSTNAME + '/uploads/' + file;
            currentImage.preview_image_paths = [HOSTNAME + '/uploads/video/' + file + '/tn_1.png'];
            responseList.content.push(currentImage);
        }
    })
   console.log(responseList);
    res.send(responseList);
});

app.post('/send/', function (req, res, next) {
    upload(req, res, function (err) {
        if (err) {
            console.log(err);
            return res.end({status: 'error'});
        }
        HOSTNAME = req.protocol + '://' + req.hostname + ':' + app.get('port');
        responseObject.path = HOSTNAME + '/uploads/' + req.file.originalname;
        responseObject.name = req.file.originalname;


        const buffer = readChunk.sync(ROOT + req.file.originalname, 0, 4100);
        if (fileType(buffer).mime.startsWith('image')) {
            //
            //image
            //
            resolutions.map((resolution) => {
                createResolution(resolution, req.file);
                responseObject.thumbnail_paths[resolution.key] = HOSTNAME + '/uploads/' + resolution.key + '/' + req.file.originalname;
            });
        } else if (fileType(buffer).mime.startsWith('video')) {
            //
            //video
            //
            const previewPath = ROOT + req.file.originalname;
            if (!fs.existsSync(previewPath)) {
                fs.mkdirSync(previewPath);
            }

            var proc = ffmpeg(ROOT + req.file.originalname)
                .on('filenames', function (filenames) {
                    console.log('screenshots are ' + filenames.join(', '));
                })
                .on('end', function (files) {
                    console.log(req.file.originalname + ' - end');
                })
                .on('start', function () {
                    console.log(req.file.originalname + ' start');
                })
                .on('error', function (err) {
                    console.log(req.file.originalname + ' an error happened: ' + err.message);
                })
                .takeScreenshots({
                    count: 2,
                    size: '178x100',
                }, ROOT + 'video/' + req.file.originalname + '/');
            responseObject.preview_image_paths = [
                HOSTNAME + '/uploads/video/' + req.file.originalname + '/tn_1.png',
                HOSTNAME + '/uploads/video/' + req.file.originalname + '/tn_2.png'
            ]
        }
        res.send(responseObject);

    })

});
app.use(express.static('./_public'));

app.listen(app.get('port'), function () {
    console.log('running on port', app.get('port'))
})
