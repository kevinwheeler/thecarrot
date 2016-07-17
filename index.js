const aws = require('aws-sdk');
const bodyParser = require('body-parser');
const compression = require('compression');
const express = require('express');
const getSlug = require('speakingurl');
const MongoClient = require('mongodb').MongoClient;
const mongoConcerns = require('./utils/mongoConcerns');
const multer = require('multer');
const requester = require('request');
const RateLimit = require('express-rate-limit');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const url = require('url');
const util = require('util');
const validations = require('./modern-backbone-starterkit/isomorphic/articleValidations.js');

const app = express();
const upload = multer();

const distDir = __dirname + '/modern-backbone-starterkit/dist/'

const NODE_ENV = process.env.NODE_ENV;
if (NODE_ENV !== 'production' && NODE_ENV !== 'development') {
  throw "NODE_ENV environment variable not set.";
}
const MONGO_URI = process.env.MONGODB_URI;

MongoClient.connect(MONGO_URI, (err, db) => {
 if (err !== null) {
   db.close();
   throw "couldn't connect to db";
 } else {
   
    //from http://stackoverflow.com/questions/7185074/heroku-nodejs-http-to-https-ssl-forced-redirect
    var forceSsl = function (req, res, next) {
       if (req.headers['x-forwarded-proto'] !== 'https') {
         return res.redirect(301, ['https://', req.get('Host'), req.url].join(''));
       }
       return next();
    };
    
    if (NODE_ENV === 'production') {
        app.use(forceSsl);
    }
    
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
    
    app.get('/article/:articleSlug', function(request, response, next) {
      let articleSlug = request.params.articleSlug;
      let articleId = parseInt(articleSlug, 10); // extract leading integers
      db.collection('article', (err, collection) => {
        if (err !== null) {
          next(err);
        } else {
          collection.findOne({'_id': articleId}, function(err, article) {
            if (err !== null) {
              next(err);
            } else {
              if (article === null) {
                send404(response);
              } else if (articleSlug !== article.articleURLSlug) {
                // Even if the articleId corresponds to a valid article,
                // send a 404 unless the rest of the slug matches as well.
                // This will avoid duplicate content SEO issues.
                send404(response);
              } else {
                console.log("article = ");
                console.dir(article);
                response.render('pages/article', {
                  article: article 
                });
              }
            }
          });
        }
      });
    });
    
    function getAllArticlesJSON() {
      let prom = new Promise(function(resolve, reject) {
        db.collection('article', (err, collection) => {
          if (err !== null) {
            reject("couldn't get article collection");
          } else {
            collection.find({}, function(err, articles) {
              let articlesJSON = articles.toArray();
              resolve(articlesJSON);
            });
          }
        });
      });
      return prom;
    }
    
    //DEVELOPMENT ONLY ROUTE
    app.get('/all-articles', (req, res, next) => {
      getAllArticlesJSON().then(
        function(articlesJSON){
          res.send(articlesJSON);
        }, 
        function(){
          throw "error in /all-articles";
        }
      );
    });
    
    function getNextId() {
      var nextIdPromise = new Promise(function(resolve, reject) {
        db.collection('counters').findAndModify(
          {_id: 'articleId'},
          [],
          {$inc: {seq:1}},
          {},
          function(err, result) {
            if (err !== null) {
              reject(err);
            } else {
              resolve(result.value.seq);
            }
          }
        );
      });
      return nextIdPromise;
    }
    
    // cb will be passed the id as a parameter.
    function getNextSequence(name, cb) {
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
    
    let getExtension = function(filename) {
      // http://stackoverflow.com/questions/190852/how-can-i-get-file-extensions-with-javascript
      return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
    }
    
    let filenameWithoutExtension = function(filename) {
      let extension = getExtension(filename);
      if (extension !== "") {
        return filename.slice(0, -(extension.length + 1));
      } else {
        return filename
      }
    }
    
    let getFilenameSlug = function(id, filename) {
      const filenameMinusExtension = filenameWithoutExtension(filename);
      const extension = getExtension(filename);
      let slug = getSlug(filenameMinusExtension, {
        truncate: 100 // Truncate to a max length of 100 characters while only breaking on word boundaries.
      }); 
      if (extension !== "") {
        slug += '.';
      }
      slug += extension;
       
      if (slug !== '') {
        slug = id + '-' + slug;
      } else {
        slug = id;
      }
      return slug;
    }
    
    let getURLSlug = function(id, headline) {
      let slug = getSlug(headline, {
        truncate: 100 // Truncate to a max length of 100 characters while only breaking on word boundaries.
      });
      if (slug !== "") {
        slug = id + '-' + slug;
      } else { // This else statement should never get reached honestly.
        slug = id;
      }
      return slug;
    }
    
    //API ROUTES
    app.post('/articleId', function(request, response, next) {
      let f = function(id) {
        response.json({id: id});
      }
      getNextSequence('articleId', f);
    });
    
    app.post('/article', bodyParser.urlencoded(), function(request, response, next) {
      const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET;
    
      const sess = request.session;
      const articleId = sess.articleId;
      const imageSlug = sess.imageSlug;
      const headline = request.body.headline;
      const subline = request.body.subline;
      const articleBody = request.body.articleBody;
      validationErrors = validations.validateEverything(headline, subline);
      if (validationErrors) {
        next(validationErrors[0]);
      }
    
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
              // id is the id to use for the new record we are inserting
              db.collection('article', (err, collection) => {
                if (err !== null) {
                  next(err);
                } else {
                  let imageURL;
                  if (NODE_ENV === 'production') {
                    imageURL = `https://createaheadlineimages.s3.amazonaws.com/${imageSlug}`;
                  } else {
                    imageURL = `https://kevinwheeler-thecarrotimageslocal.s3.amazonaws.com/${imageSlug}`;
                  }
                  const articleURLSlug = getURLSlug(articleId, headline);
                  const doc = {
                    _id: articleId,
                    articleBody: articleBody,
                    articleURLSlug: articleURLSlug,
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
                        next(error);
                      } else {
                        response.redirect('/article/' + articleURLSlug);
                      }
                    }); 
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
    let s3Limiter = new RateLimit({
      delayAfter: 3, // begin slowing down responses after the third request 
      delayMs: 1000, // slow down subsequent responses by 1 second per request 
      max: 30, // limit each IP to 30 requests per windowMs 
      windowMs: 60*1000 // 1 minute
    });
    
    
    app.get('/sign-s3', s3Limiter, (req, res, next) => {
      getNextId().then(function(id) {
        const filename = req.query['file-name'];
        const slug = getFilenameSlug(id, filename);
        let sess = req.session;
        sess.articleId = id;
        sess.imageSlug = slug;
        id += ""; //convert from int to string
        const s3 = new aws.S3();
        const fileType = req.query['file-type'];
        if (!fileTypeIsValid(fileType)) {
          next("In /sign-s3 : File type is invalid"); 
        }
        const S3_BUCKET = process.env.S3_BUCKET;
        const s3Params = {
          Bucket: S3_BUCKET,
          Key: slug,
          Expires: 60,
          ContentType: fileType
        };
        if (NODE_ENV === 'development') {
          s3Params.ACL = 'public-read';
        }
    
        s3.getSignedUrl('putObject', s3Params, (err, data) => {
          if(err){
            next(err);
            return;
          }
          const returnData = {
            signedRequest: data,
            url: `https://${S3_BUCKET}.s3.amazonaws.com/${slug}`
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
 
  }
});
