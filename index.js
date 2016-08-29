const aws = require('aws-sdk');
const bodyParser = require('body-parser');
const express = require('express');
const getSlug = require('speakingurl');
const logError = require('./server_code/utils').logError;
const MongoClient = require('mongodb').MongoClient;
const mongoConcerns = require('./server_code/mongoConcerns');
const multer = require('multer');
const passport = require('passport');
const requester = require('request');
const RateLimit = require('express-rate-limit');
const send404 = require('./server_code/utils').send404;
const session = require('express-session');
const setupAuthentication = require('./server_code/authentication');
const setupInitialConfiguration = require('./server_code/configuration');
const timebucket = require('timebucket');
const updateSummaries = require('./server_code/updateSummaries');
const url = require('url');
const util = require('util');
const validations = require('./modern-backbone-starterkit/src/isomorphic/articleValidations.js');

const app = express();
const upload = multer();

const distDir = __dirname + '/modern-backbone-starterkit/dist/';

const NODE_ENV = process.env.NODE_ENV;
const MONGO_URI = process.env.MONGODB_URI;

MongoClient.connect(MONGO_URI, (err, db) => {
  if (err !== null) {
    logError(err);
    throw err;
  } else {
    const approveArticles = require('./server_code/routeFunctions/approveArticles')(db);
    const getArticleJSON = require('./server_code/routeFunctions/getArticleJSON')(db);
    const getArticlePage = require('./server_code/routeFunctions/getArticlePage')(db);
    const getMostRecentArticlesJSON = require('./server_code/routeFunctions/getMostRecentArticlesJSON')(db);
    const getMyApprovalHistoryJSON = require('./server_code/routeFunctions/getMyApprovalHistoryJSON')(db);
    const getNeedApprovalArticlesJSON = require('./server_code/routeFunctions/getNeedApprovalArticlesJSON')(db);
    const mostViewedArticlesJSON = require('./server_code/routeFunctions/mostViewedArticlesJSON')(db);

    setupInitialConfiguration(app);

    const sendIndex = function(req, res) {
      res.render('pages/index', {
        fbAppId: process.env.FACEBOOK_APP_ID
        //isLoggedIn: !!req.user,
        //user: JSON.stringify(req.user)
      });
    }

    setupAuthentication(app, db);


    // IMPORTANT: Routes are duplicated in client side code.
    // Namely the router and the nav template.
    app.get('/', sendIndex);
    app.get('/admin', sendIndex);
    app.get('/admin/yo', sendIndex);
    app.get('/admin/my-approval-history', sendIndex);
    app.get('/user/:userid', sendIndex);
    app.get('/business', sendIndex);
    app.get('/education', sendIndex);
    app.get('/other', sendIndex);
    app.get('/politics', sendIndex);
    app.get('/sports', sendIndex);
    app.get('/spirituality', sendIndex);
    app.get('/technology', sendIndex);
    app.get('/upload', sendIndex);

    app.get('/logout', function(req, res) {
      req.logout();
      res.redirect('/');
    });

    app.get('/:admin((admin/)?)article/:articleSlug', getArticlePage);
    app.get('/api/article/:articleId', getArticleJSON);
    app.get('/most-recent-articles', getMostRecentArticlesJSON);
    app.get('/api/my-approval-history', getMyApprovalHistoryJSON);
    app.get('/articles-that-need-approval', getNeedApprovalArticlesJSON);
    // Uses post instead of get to get over query string length limitations
    app.post('/most-viewed-articles', bodyParser.json(), mostViewedArticlesJSON);
    app.post('/approve-articles', bodyParser.urlencoded({extended: true}), approveArticles);

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
    app.get('/userinfo', function(req, res, next) {
      //req.user, get parameters userId
      let userToGet = req.query.user_id;
      let userIdToGet;
      if (userToGet === 'currentUser') {
        if (req.user) {
          userIdToGet = req.user.fbId;
        } else {
          res.json({}); // wanted current user, but current user isn't logged in.
          return;
        }
      } else {
        userIdToGet = userToGet;
      }
      db.collection('user', (err, userColl) => {
        if (err !== null) {
          logError(err);
          next(err);
        } else {
          userColl.find({fbId: userIdToGet}).project({
            _id: false,
            displayName: true,
            fbId: true
          }).next().then(
            function (user) {
              res.json(user);
            },
            function (err) {
              logError(err)
              next(err);
            }
          );
        }
      });
    });


    app.post('/article', bodyParser.urlencoded(), function(req, res, next) {
      const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET;
    
      const sess = req.session;
      const articleId = sess.articleId;
      const imageSlug = sess.imageSlug;
      const headline = req.body.headline;
      const subline = req.body.subline;
      const validationErrors = validations.validateEverything(headline, subline);
      if (validationErrors) { //TODO this could be better, instead of just returning the first error.
        next(validationErrors[0]);
      }

      const insertArticleAndRedirect = function() {
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
              approval: 'pending',
              articleURLSlug: articleURLSlug,
              dateCreated: new Date(),
              headline: headline,
              imageURL: imageURL,
              sidOfAuthor: req.sessionID,
              subline: subline
            }
            if (req.user) { // TODO make sure not posting anonymously
              doc.authorId = req.user.fbId;
            }
            collection.insert(doc, {
                w: "majority",
                wtimeout: mongoConcerns.WTIMEOUT
              }, 
              (error, result) => {
                if (error !== null) {
                  next(error);
                } else {
                  // Pretend the article has been viewed once, so that it will be inserted into the most popular
                  // by day/week/month/year lists. Since views don't get counted until the article has been approved,
                  // the redirect won't add a view, so we add one manually here.
                  updateSummaries.incrementViews(db, articleId);
                  res.redirect('/article/' + articleURLSlug);
                }
              }); 
          }
        });
      }

      if (req.body['kmw-bypass-recaptcha-secret'] === process.env.BYPASS_RECAPTCHA_SECRET) {
        insertArticleAndRedirect();
      } else {
        const recaptchaVerifyJSON = {secret: RECAPTCHA_SECRET, response: req.body['g-recaptcha-response']};
     
        //id = the id to use for the new record we are inserting.
        requester.post({url:'https://www.google.com/recaptcha/api/siteverify', form: recaptchaVerifyJSON},
          function(err, httpResponse, body) {
            if (err) {
              logError(err);
              res.status(500).send('Something went wrong! Please try again.');
            }
            else {
              var bodyJSON = JSON.parse(body);
              if (bodyJSON.success) {
                // Captcha successful.
                insertArticleAndRedirect();
              }
              else {
                // Captcha failed.
                res.redirect('/upload?captcha=fail'); //TODO
              }
            }
          });
      }
    });
    
    
    // Rate limit how many requests can come from one ip address.
    let s3Limiter = new RateLimit({
      delayAfter: 3, // begin slowing down responses after the third request
      delayMs: 1000, // slow down subsequent responses by 1 second per request
      max: 50, // limit each IP to 30 requests per windowMs
      windowMs: 60*1000 // 1 minute
    });

    function fileTypeIsValid(fileType) {
      const imageMimeTypeRegex = /image\/.*/;
      return fileType.match(imageMimeTypeRegex) !== null;
    }


    //TODO import getNextId
    app.get('/sign-s3', s3Limiter, (req, res, next) => {
      getNextId(db, "articleId").then(function(id) {
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
              logError(err);
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
        }, function(err) {
          logError(err);
          next(err);
        }
      );
    });
    

    app.use(express.static(distDir));
    
    app.use(function(req, res, next) {
      send404(res);
    });

    // views is directory for all template files
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    
    app.listen(app.get('port'), function() {
      console.log('Node app is running on port', app.get('port'));
    });
  }
});
