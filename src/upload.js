const readChunk = require('read-chunk');
const fileType = require('file-type');
const fs = require('fs-extra');
const sharp = require('sharp');

const ffmpeg = require('fluent-ffmpeg');
const responseObject = {
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

const resize = (width, height, sourceFile, targetFile) => {
    sharp(sourceFile)
        .rotate()
        .resize(width, height)
        .toFile(targetFile, (err, info) => {
            console.log('err', err);
        });
}

const createResolution = (__targetDirectory, __size, __sourceDirectory, __file) => {
    const targetPath = __targetDirectory + __size.key;
    fs.mkdirsSync(targetPath);
    resize(__size.width, __size.height, __sourceDirectory + __file.originalname, targetPath + '/' + __file.originalname);
}

const imageUpload = (__resolutions, __CONFIG, req) => {
    __resolutions.map((resolution) => {
        createResolution(__CONFIG.image_directory, resolution, __CONFIG.source_directory, req.file);
        responseObject.thumbnail_paths[resolution.key] = HOSTNAME + __CONFIG.image_path + resolution.key + '/' + req.file.originalname;
    });
}

const videoUpload = (__CONFIG, req, HOSTNAME) => {
    const previewPath = __CONFIG.source_directory + req.file.originalname;
    fs.mkdirsSync(__CONFIG.video_directory + req.file.originalname + '/');
    fs.copySync(previewPath, __CONFIG.video_directory + req.file.originalname + '/' + req.file.originalname);
    var proc = ffmpeg(previewPath)
        .on('filenames', function (filenames) {
            console.log('screenshots are ' + filenames.join(', '));
        })
        .on('end', function (files) {
            fs.removeSync(previewPath);
            console.log(req.file.originalname + ' - end');
        })
        .on('start', function () {
            console.log(req.file.originalname + ' start');
        })
        .on('error', function (err) {
            console.log(req.file.originalname + ' an error happened: ' + err.message);
        })
        .takeScreenshots({
            count: __CONFIG.video.preview_count,
            filename: __CONFIG.video.preview_name_prefix+ '%i.png',
            size: __CONFIG.video.preview_width + 'x' + __CONFIG.video.preview_height,
        }, __CONFIG.video_directory + req.file.originalname + '/');
    responseObject.preview_image_paths = [
        HOSTNAME + '/uploads/video/' + req.file.originalname + '/tn_1.png',
        HOSTNAME + '/uploads/video/' + req.file.originalname + '/tn_2.png'
    ]
}

module.exports = (__app, __multer, __CONFIG, __resolutions) => {
    __app.post('/send/', function (req, res, next) {
        __multer(req, res, function (err) {
            if (err) {
                console.log('multer', err);
                return res.end({status: 'error'});
            }
            const HOSTNAME = req.protocol + '://' + req.hostname + ':' + __app.get('port');
            responseObject.path = HOSTNAME + '/uploads/' + req.file.originalname;
            responseObject.name = req.file.originalname;


            const buffer = readChunk.sync(__CONFIG.source_directory + req.file.originalname, 0, 4100);
            if (fileType(buffer).mime.startsWith('image')) {
                imageUpload(__resolutions, __CONFIG, req);

            } else if (fileType(buffer).mime.startsWith('video')) {
                //
                //video
                //
                videoUpload(__CONFIG, req, HOSTNAME);
            }
            res.send(responseObject);

        })

    });
}
