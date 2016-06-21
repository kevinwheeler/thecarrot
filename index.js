const aws = require('aws-sdk');
const bodyParser = require('body-parser');
const compression = require('compression');
const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const multer = require('multer');
const requester = require('request');
const RateLimit = require('express-rate-limit');
const url = require('url');
const util = require('util');

const app = express();
const upload = multer();

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

app.enable('trust proxy'); // Needed for rate limiter.
app.use(compression());
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
  // TODO use mmmagic to detect filetype maybe.
  // wait, mmmagic only makes sense if we have the file in our hands.
  return;
}

function validateHeadline(headline) {
  if (typeof(headline) !== "string") {
    throw "headline isn't string"; 
  }
  if (headline.length > 400) {
    throw "headline too long";
  }
}

function validateSubline(subline) {
  if (typeof(subline) !== "string") {
    throw "subline isn't string"; 
  }
  if (subline.length > 400) {
    throw "subline too long";
  }
}

app.get('/article/:articleId', function(request, response) {
  const MONGO_URI = process.env.MONGODB_URI;
  console.log("article id = " + request.params.articleId);

  MongoClient.connect(MONGO_URI, (err, db) => {
    if (err !== null) {
      throw "GET /article couldn't connect to mongo.";
    }
    db.collection('article', (err, collection) => {
      if (err !== null) {
        util.error(err);
        throw "Error getting article collection";
      }
      collection.findOne({'_id': request.params.articleId}, function(err, item) {
        if (err !== null) {
          console.log("error = " + err);
        } else {
        response.render('article', {
          article: item
        });
        db.close();
        }
      });
    });
  });

});

//API ROUTES
app.post('/article', upload.single('picture'), bodyParser.json(), function(request, response) {
  const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET;
  const MONGO_URI = process.env.MONGODB_URI;

  const imageId = request.body['kmw-image-id'];
  validateFilename(imageId); // right now the image's filename and the id are the same value.
  const headline = request.body.headline;
  validateHeadline(headline);
  const subline = request.body.subline;
  validateSubline(subline);

  const recaptchaVerifyJSON = {secret: RECAPTCHA_SECRET, response: request.body['g-recaptcha-response']};
  requester.post({url:'https://www.google.com/recaptcha/api/siteverify', form: recaptchaVerifyJSON},
    function(err, httpResponse, body) {
      if (err) {
        response.status(500).send('Something went wrong! Please try again.');
      }
      else {
        var bodyJSON = JSON.parse(body);
        if (bodyJSON.success) {
          // Captcha successful.
          MongoClient.connect(MONGO_URI, (err, db) => {
            if (err !== null) {
              throw "POST /article couldn't connect to mongo.";
            }
            db.collection('article', (err, collection) => {
              if (err !== null) {
                util.error(err);
                throw "Error getting article collection";
              }
              const doc = {
                _id: imageId,
                headline: headline,
                subline: subline
              }
              collection.insert(doc); 
            });
            db.close();
          });
          response.redirect('/');
        }
        else {
          // Captcha failed.
          response.redirect('/'); //TODO
        }
      }
    }
  );
});


// Rate limit how many requests can come from one ip address.
var s3Limiter = new RateLimit({
  delayAfter: 3, // begin slowing down responses after the third request 
  delayMs: 1000, // slow down subsequent responses by 1 second per request 
  max: 30, // limit each IP to 30 requests per windowMs 
  windowMs: 60*1000 // 1 minute
});

app.get('/sign-s3', s3Limiter, (req, res) => {
  const s3 = new aws.S3();
  const fileName = req.query['file-name'];
  validateFilename(fileName);
  const fileType = req.query['file-type'];
  validateFileType(fileType);
  const S3_BUCKET = process.env.S3_BUCKET;
  const s3Params = {
    Bucket: S3_BUCKET,
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
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
