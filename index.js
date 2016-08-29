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

const distDir = __dirname + '/modern-backbone-starterkit/dist/'

const NODE_ENV = process.env.NODE_ENV;
const MONGO_URI = process.env.MONGODB_URI;

MongoClient.connect(MONGO_URI, (err, db) => {
  if (err !== null) {
    logError(err);
    throw err;
  } else {
    const getArticlePage = require('./server_code/routeFunctions/getArticlePage')(db);
    const getArticleJSON = require('./server_code/routeFunctions/getArticleJSON')(db);
    const getMostRecentArticlesJSON = require('./server_code/routeFunctions/getMostRecentArticlesJSON')(db);
    const getMyApprovalHistoryJSON = require('./server_code/routeFunctions/getMyApprovalHistoryJSON')(db);
    const getNeedApprovalArticlesJSON = require('./server_code/routeFunctions/getNeedApprovalArticlesJSON')(db);

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

    const MAX_ARTICLES_PER_REQUEST = 50;



    // Returns an error object or null. If error object isn't null, will have the property
    // clientError set to true so that we can send a 4xx response instead of a 5xx response.
    function validateMostViewedArticlesParams(dontInclude, howMany, timeInterval) {
      let validationErrors = [];

      if (timeInterval !== 'daily' && timeInterval !== 'weekly' && timeInterval !== 'monthly'
        && timeInterval !== 'yearly' && timeInterval !== 'all_time') {
         validationErrors.push("invalid time interval");
      } else if (typeof(howMany) !== "number" || howMany < 1 || howMany > MAX_ARTICLES_PER_REQUEST) {
        validationErrors.push("howMany invalid");
      } else if (typeof(dontInclude) !== "object") {
        validationErrors.push("dontInclude invalid");
      }

      if (validationErrors.length) {
        validationErrors = new Error(JSON.stringify(validationErrors));
        validationErrors.clientError = true;
      } else {
        validationErrors = null;
      }

      return validationErrors;
    }

    //TODO move any logic that deals with the summary collections out of this file.
    function getMostViewedArticlesJSON(dontInclude, howMany, timeInterval) {
      let validationErrors = validateMostViewedArticlesParams(dontInclude, howMany, timeInterval);

      let prom = new Promise(function(resolve, reject) {
        if (validationErrors !== null) {
          reject(validationErrors)
        } else {
          db.collection('summary_of_' + timeInterval, (err, summaryColl) => {
            if (err !== null) {
              reject(err);
            } else {
              summaryColl.find({
                _id: {
                  $nin: dontInclude
                },
                approval: 'approved'
              }).sort([['views', -1]]).limit(howMany).project("_id").toArray(
                function (err, articleIDs) {
                  if (err !== null) {
                    reject(err);
                  } else {
                    db.collection('article', (err, articleColl) => {
                      if (err !== null) {
                        reject(err);
                      } else {
                        const IDs = articleIDs.map(function (item) {
                          return item._id;
                        });
                        articleColl.find({
                          _id: {$in: IDs}
                        }).toArray(
                          function (err, articles) {
                            if (err !== null) {
                              reject(err);
                            } else {
                              articles.sort(function (a, b) {
                                return IDs.indexOf(a._id) - IDs.indexOf(b._id);
                              });
                              resolve(articles);
                            }
                          }
                        );
                      }
                    });
                  }
                }
              );
            }
          });
        }
      });
      return prom;
    }

    // Uses post instead of get to get over query string length limitations
    app.post('/most-viewed-articles', bodyParser.json(), (req, res, next) => {
      const dontInclude = req.body.dont_include;
      const howMany = req.body.how_many;
      const timeInterval = req.body.time_interval;
      getMostViewedArticlesJSON(dontInclude, howMany, timeInterval).then(
        function(articlesJSON) {
          res.send(articlesJSON);
        },
        function(err) {
          if (err.clientError === true){
            res.status(400).send("Something went wrong.");;
          } else {
            logError(err);
            next(err);
          }
        }
      );
    });

    function getAllArticlesJSON() {
      if (NODE_ENV !== 'development') {
        throw "NODE_ENV !== 'development'";
      }
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
        function(articlesJSON) {
          res.send(articlesJSON);
        },
        function() {
          throw "error in /all-articles";
        }
      );
    });

    function getNextId(counterName) {
      var nextIdPromise = new Promise(function(resolve, reject) {
        db.collection('counters').findOneAndUpdate(
          {_id: counterName},
          {$inc: {seq:1}},
          {
            upsert: true,
            returnOriginal: false
          },
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

    function setApproval (approvalVerdict, articleId, approverFbId) {
      // Since we have the approval attribute in both the summary collections and the article collection
      // and we can't update these all atomically, we first set the approval attribute in the article collection
      // to 'inTransaction', then we set the approval attribute to the correct value in all of the summary collections,
      // then finally, we set the approval attribute to the correct value in the article collection. If the process
      // fails in the middle somewhere, the approval attribute in the article collection should still be in the state
      // 'inTransaction', and we will tell the admin/initiator that he should retry the operation.
      const rejectOnError = function(err) {
        reject(err);
      }
      const prom = new Promise(function(resolve, reject) {
        db.collection('article', (err, articleColl) => {
          if (err !== null) {
            reject(err);
          } else {
            articleColl.updateOne(
              {
                _id: articleId
              },
              {
                $set: {approval: 'inTransaction'}
              },
              {
                wtimeout: mongoConcerns.WTIMEOUT,
                w: 'majority'
              }
            ).then(function (result) {
                updateSummaries.setApprovalStatus(db, articleId, approvalVerdict).then(
                  function (result) {
                    db.collection('approvalLog', (err, approvalLogColl) => {
                      if (err !== null) {
                        reject(err);
                      } else {
                        getNextId("approvalLogId").then(
                          function(id){
                            //TODO compound index on approverFbId, _id
                            approvalLogColl.insertOne(
                              {
                                _id: id,
                                approverFbId: approverFbId,
                                articleId: articleId,
                                timestamp: new Date(),
                                verdict: approvalVerdict
                              },
                              {
                                w: 'majority',
                                wtimeout: mongoConcerns.WTIMEOUT
                              }
                            ).then(
                              function(result) {
                                articleColl.updateOne(
                                  {
                                    _id: articleId
                                  },
                                  {
                                    $set: {approval: approvalVerdict},
                                  },
                                  {
                                    w: 'majority',
                                    wtimeout: mongoConcerns.WTIMEOUT
                                  }
                                ).then(function (result) {
                                    resolve(result);
                                  }, rejectOnError
                                )
                              }, rejectOnError
                            ).then(function(){}, rejectOnError);

                          },
                          function(err){

                          }
                        );
                      }
                    });
                  },rejectOnError
                ).then(function(){}, rejectOnError);
              }, rejectOnError
            ).then(function(){}, rejectOnError);
          }
        });
      });
      return prom;
    };

    app.post('/approve-articles', bodyParser.urlencoded({extended: true}), function(req, res, next) {
      if (req.user && req.user.userType === 'admin') {
        const IDs = req.body['article_ids'];
        const approverFbId = req.user.fbId
        //const articleURLSlug = req.body['article_url_slug'];
        const approvalVerdict = req.body['approval_verdict'];
        const promises = [];
        for (let i=0; i < IDs.length; i++) {
          const articleID = parseInt(IDs[i], 10);
          promises.push(setApproval(approvalVerdict, articleID, approverFbId, res, next));
        }
        Promise.all(promises).then(
          function(result){
            res.redirect('/admin');
          },
          function(err){
            logError(err);
            next(err);
          }
        );
      } else {
        res.status(403).send('You are not an admin or are not logged in.');
      }
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

    app.get('/sign-s3', s3Limiter, (req, res, next) => {
      getNextId("articleId").then(function(id) {
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
