const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

// check upload directory
var fs = require('fs');
if (!fs.existsSync('./uploads')){
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
        cb(null, Date.now() + ' - ' + file.originalname)
    }
})
var upload = multer({storage: storage}).single('alma');
const app = express();

/**
 * PORT NUMBER: 3000
 */
app.set('port', 3000);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


app.get('/', function (req, res) {
    res.send({data: 'hello world'});
});

app.post('/send/', function (req, res, next) {
    upload(req, res, function (err) {
        if (err) {
            console.log(err);
            return res.end("Error");
        }
        res.send('file ok');
    })
});
app.use(express.static('./_public'));

app.listen( app.get('port'), function () {
    console.log('running on port',  app.get('port'))
})
