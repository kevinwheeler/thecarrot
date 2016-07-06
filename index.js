const aws = require('aws-sdk');
const validations = require('./modern-backbone-starterkit/isomorphic/articleValidations.js');
const bodyParser = require('body-parser');
const compression = require('compression');
const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const multer = require('multer');
const requester = require('request');
const RateLimit = require('express-rate-limit');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const url = require('url');
const util = require('util');
const mongoConcerns = require('./utils/mongoConcerns');

const app = express();
const upload = multer();

const distDir = __dirname + '/modern-backbone-starterkit/dist/'

const env = process.env.NODE_ENV;
if (env !== 'production' && env !== 'development') {
  throw "NODE_ENV environment variable not set.";
}
const MONGO_URI = process.env.MONGODB_URI;

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
app.use(session({
  secret: process.env.SESSION_SECRET,
  store: new MongoStore({
    url: MONGO_URI
  }),
}));
app.set('port', (process.env.PORT || 5000));

const sendIndex = function(request, response) {
  response.sendFile(distDir + 'index.html');
}

const send404 = function(response) {
  response.status(404).send('Error 404. Page not found.');
}

// IMPORTANT: Routes are duplicated in client side code.
// Namely the router and the nav template.
app.get('/', sendIndex);
app.get('/business', sendIndex);
app.get('/education', sendIndex);
app.get('/other', sendIndex);
app.get('/politics', sendIndex);
app.get('/sports', sendIndex);
app.get('/spirituality', sendIndex);
app.get('/technology', sendIndex);

function filenameIsValid(filename) {
  const hexDigitRegex = '[a-f0-9]';
  const fourHexDigits = `${hexDigitRegex}{4}`;
  const eightHexDigits = `${hexDigitRegex}{8}`;
  const twelveHexDigits = `${hexDigitRegex}{12}`;
  const uuidRegex = '^' + eightHexDigits + '-' + fourHexDigits + '-' + 
    fourHexDigits + '-' + fourHexDigits + '-' + twelveHexDigits + '$';
  // uuidRegex should match strings of this form: 110ec58a-a0f2-4ac4-8393-c866d813b8d1

  return filename.match(uuidRegex) !== null;
}

function fileTypeIsValid(fileType) {
  const imageMimeTypeRegex = /image\/.*/;
  return fileType.match(imageMimeTypeRegex) !== null;
}

app.get('/article/:articleId', function(request, response, next) {

  MongoClient.connect(MONGO_URI, (err, db) => {
    if (err !== null) {
      db.close();
      next(err);
    } else {
      db.collection('article', (err, collection) => {
        if (err !== null) {
          db.close();
          next(err);
        } else {
          collection.findOne({'_id': parseInt(request.params.articleId)}, function(err, item) {
            if (err !== null) {
              db.close();
              next(err);
            } else {
              if (item === null) {
                send404(response);
              } else {
                response.render('article', {
                  article: item
                });
              }
              db.close();
            }
          });
        }
      });
    }
  });

});

function getNextId() {
  console.log("in getNextId");
  var nextIdPromise = new Promise(function(resolve, reject) {
    MongoClient.connect(MONGO_URI, (err, db) => {
      if (err !== null) {
        db.close(); 
        reject(err);
      } else {
        db.collection('counters').findAndModify(
          {_id: 'articleId'},
          [],
          {$inc: {seq:1}},
          {},
          function(err, result) {
            console.log("in findandmodify");
            if (err !== null) {
              reject(err);
            } else {
              resolve(result.value.seq);
            }
          }
        );
      }
    });
  });
  return nextIdPromise;
}

// cb will be passed the id as a parameter.
function getNextSequence(db, name, cb) {
   db.collection('counters').findAndModify(
     {_id: name},
     [],
     {$inc: {seq:1}},
     {},
     function(err, result) {
       if (err !== null) {
         throw err;
       } else {
         cb(result.value.seq);
       }
     }
   );
}

//API ROUTES
app.post('/articleId', function(request, response, next) {
  MongoClient.connect(MONGO_URI, (err, db) => {
    if (err !== null) {
      db.close(); 
      next(err);
    } else {
      let f = function(id) {
        response.json({id: id});
      }
      getNextSequence(db, 'articleId', f);
    }
  });
});

// TODO remove upload.single('picture')
app.post('/article', bodyParser.urlencoded(), function(request, response, next) {
  const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET;

  const sess = request.session;
  //const imageId = request.body['kmw-image-id'];
  const imageId = sess.articleAndImageId;
  console.log("image id = " + imageId);
  //if (!filenameIsValid(imageId)) { // right now the image's filename and the id are the same value.
  //  next("invalid filename for image");
  //}
  const headline = request.body.headline;
  const subline = request.body.subline;
  validationErrors = validations.validateEverything(headline, subline);
  if (validationErrors)
    next(validationErrors[0]);

  const recaptchaVerifyJSON = {secret: RECAPTCHA_SECRET, response: request.body['g-recaptcha-response']};
 
  //id = the id to use for the new record we are inserting.
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
              db.close(); 
              next(err);
            } else {
              // id is the id to use for the new record we are inserting
              const insertNewArticle = function(id) {
                db.collection('article', (err, collection) => {
                  if (err !== null) {
                    db.close();
                    next(err);
                  } else {
                    let imageURL;
                    if (env === 'production') {
                      imageURL = `https://kevinwheeler-thecarrotimages.s3.amazonaws.com/${imageId}`;
                    } else {
                      imageURL = `https://kevinwheeler-thecarrotimageslocal.s3.amazonaws.com/${imageId}`;
                    }
                    const doc = {
                      _id: id,
                      dateCreated: new Date(),
                      headline: headline,
                      imageURL: imageURL,
                      subline: subline
                    }
                    collection.insert(doc, {
                        w: "majority",
                        wtimeout: mongoConcerns.WTIMEOUT
                      }, 
                      (error, result) => {
                        if (error !== null) {
                          db.close();
                          next(error);
                        } else {
                          db.close();
                          response.redirect('/article/' + id);
                        }
                      }); 
                  }
                });
              }
              try {
                getNextSequence(db, 'articleId', insertNewArticle);
              } catch (e) {
                next(e);
                return;
              }
            }
          });
        }
        else {
          // Captcha failed.
          response.redirect('/upload?captcha=fail'); //TODO
        }
      }
    });
});


// Rate limit how many requests can come from one ip address.
var s3Limiter = new RateLimit({
  delayAfter: 3, // begin slowing down responses after the third request 
  delayMs: 1000, // slow down subsequent responses by 1 second per request 
  max: 30, // limit each IP to 30 requests per windowMs 
  windowMs: 60*1000 // 1 minute
});

app.get('/sign-s3', s3Limiter, (req, res, next) => {
  const name = req.query['file-name'];
  console.log("name = " + name);
  getNextId().then(function(fileName) {
    let sess = req.session;
    sess.articleAndImageId = fileName;
    console.log("in then");
    fileName = fileName + ""; //convert from int to string
    const e3 = new aws.S3();
    //const fileName = req.query['file-name'];
    //if (!filenameIsValid(fileName)) {
    //  next("In /sign-s3 : Invalid image filename");
    //}
    const fileType = req.query['file-type'];
    if (!fileTypeIsValid(fileType)) {
      next("In /sign-s3 : File type is invalid"); 
    }
    const S3_BUCKET = process.env.S3_BUCKET;
    const s3Params = {
      Bucket: S3_BUCKET,
      Key: fileName,
      Expires: 60,
      ContentType: fileType,
      ACL: 'public-read'
    };

    s3.getSignedUrl('putObject', s3Params, (err, data) => {
    console.log("in then callback");
      if(err){
        next(err);
        return;
      }
      const returnData = {
        signedRequest: data,
        url: `https://${S3_BUCKET}.s3.amazonaws.com/${fileName}`
      };
      res.write(JSON.stringify(returnData));
      res.end();
    });
  });
});

//DEVELOPMENT ROUTES
app.get('/upload', sendIndex);

app.use(express.static(distDir));

app.use(function(req, res, next) {
  send404(res);
});

//const errorHandler = function(err, req, res, next) {
//  util.error(err);
//  res.status(500).send('Something went wrong. Please try again.');
//}

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
