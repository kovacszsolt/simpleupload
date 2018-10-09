const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const path = require('path');
const fs = require('fs-extra');



const list = require('./src/list.js');
const upload = require('./src/upload.js');



// resolution size
resolutions = [
    {key: 'S', width: 256, height: 144},
    {key: 'M', width: 640, height: 360},
    {key: 'L', width: 960, height: 540},
    {key: 'XL', width: 1280, height: 720}
];

if (!fs.existsSync('./config.json')) {
    console.log('No config file.');
    console.log('create config.json file');
    process.exit(1);
}
const CONFIG = require('./config.json');
fs.mkdirsSync(CONFIG.source_directory);
fs.mkdirsSync(CONFIG.image_directory);
fs.mkdirsSync(CONFIG.video_directory);

let hostName = '';

// upload file definition start
var multer = require('multer');
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, CONFIG.source_directory)
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
})
const multerUpload = multer({storage: storage}).single('file');
// upload file definition end

const app = express();

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

app.set('port', CONFIG.port);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


app.get('/', function (req, res) {
    res.send({status: 'hello world'});
});


list(app, CONFIG);

upload(app, multerUpload, CONFIG, resolutions);


app.use(express.static('./_public'));

app.listen(app.get('port'), function () {
    console.log('running on port', app.get('port'))
})
