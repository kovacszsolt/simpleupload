const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

// check upload directory
var fs = require('fs');
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}


// upload file with multer
var multer = require('multer');
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads')
    },
    filename: function (req, file, cb) {
        console.log(file);
        cb(null, 'a.tmp')
    }
})
var upload = multer({storage: storage}).single('alma');
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
        res.send({
            filename: 'hello.jpg',
            thumbnailurl: 'https://picsum.photos/200/300/?id=1',
        imageurl: 'https://picsum.photos/636/954/?id=1'
    });
    })
});
app.use(express.static('./_public'));

app.listen(app.get('port'), function () {
    console.log('running on port', app.get('port'))
})
