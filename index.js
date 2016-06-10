const aws = require('aws-sdk');
const express = require('express');
const app = express();

const bodyParser = require('body-parser');

const multer = require('multer');
const upload = multer();

const requester = require('request');

const distDir = __dirname + '/modern-backbone-starterkit/dist/'

//var env = process.env.NODE_ENV || 'production';

// from http://stackoverflow.com/questions/7185074/heroku-nodejs-http-to-https-ssl-forced-redirect
//var forceSsl = function (req, res, next) {
//   if (req.headers['x-forwarded-proto'] !== 'https') {
//     return res.redirect(301, ['https://', req.get('Host'), req.url].join(''));
//   }
//   return next();
//};
//
//if (env === 'production') {
//    app.use(forceSsl);
//}

app.set('port', (process.env.PORT || 5000));

var sendIndex = function(request, response) {
 response.sendFile(distDir + 'index.html');
}

//IMPORTANT: Routes are duplicated in various places in client side code.
// Namely the router, the nav view, and the nav view's template.
app.get('/', sendIndex);
app.get('/politics', sendIndex);
app.get('/sports', sendIndex);
app.get('/spirituality', sendIndex);
app.get('/business', sendIndex);
app.get('/other', sendIndex);

//API ROUTES
app.post('/article', upload.single('picture'), bodyParser.json(), function(request, response) {
  console.log("IN ARTICLE ROUTE");

  var RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET;

  var postJSON = {secret: RECAPTCHA_SECRET, response: request.body['g-recaptcha-response']};

  console.log("POST JSON = " + JSON.stringify(postJSON));
  requester.post({url:'https://www.google.com/recaptcha/api/siteverify', form: postJSON }, function(err, httpResponse, body) {
    if (err) {
      response.status(500).send('Something went wrong! Please try again.');
    }
    else {
      var bodyJSON = JSON.parse(body);
      if (bodyJSON.success) {
        console.log("Captcha successful");
        response.redirect('/');
      }
      else {
        console.log("Captcha failed. Please fill out the captcha.");
        response.redirect('/');
      }
    }
  });
});

function validateFilename(filename) {
  const hexDigitRegex = '[a-f0-9]';
  const fourHexDigits = `${hexDigitRegex}{4}`;
  const eightHexDigits = `${hexDigitRegex}{8}`;
  const twelveHexDigits = `${hexDigitRegex}{12}`;
  const uuidRegex = '^' + eightHexDigits + '-' + fourHexDigits + '-' + 
    fourHexDigits + '-' + fourHexDigits + '-' + twelveHexDigits + '$';
  // uuidRegex should match strings of this form: 110ec58a-a0f2-4ac4-8393-c866d813b8d1

  const filenameIsValid =  filename.match(uuidRegex) !== null;
  if (!filenameIsValid) {
    throw "Invalid filename.";
  }
}

function validateFileType(fileType) {
  //TODO use mmmagic to detect filetype maybe.
  return;
}

app.get('/sign-s3', (req, res) => {
  const s3 = new aws.S3();
  const fileName = req.query['file-name'];
  validateFilename();
  const fileType = req.query['file-type'];
  validateFileType(fileType);
  const s3Params = {
    Bucket: process.env.S3_BUCKET,
    Key: fileName,
    Expires: 60,
    ContentType: fileType,
    ACL: 'public-read'
  };

  s3.getSignedUrl('putObject', s3Params, (err, data) => {
    if(err){
      console.log(err);
      return res.end();
    }
    const returnData = {
      signedRequest: data,
      url: `https://${S3_BUCKET}.s3.amazonaws.com/${fileName}`
    };
    res.write(JSON.stringify(returnData));
    res.end();
  });
});

//DEVELOPMENT ROUTES
app.get('/upload', sendIndex);

app.use(express.static(distDir));

app.use(function(req, res, next) {
	  res.status(404).send('Error 404. Page not found.');
});

// views is directory for all template files
//app.set('views', __dirname + '/views');
//app.set('view engine', 'ejs');

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
