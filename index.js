const aws = require('aws-sdk');
const bodyParser = require('body-parser');
const compression = require('compression');
const express = require('express');
const FacebookStrategy = require('passport-facebook').Strategy;
const getSlug = require('speakingurl');
const MongoClient = require('mongodb').MongoClient;
const mongoConcerns = require('./utils/mongoConcerns');
const multer = require('multer');
const passport = require('passport');
const requester = require('request');
const RateLimit = require('express-rate-limit');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const timebucket = require('timebucket');
const updateViewsCollections = require('./utils/updateViewsCollections');
const url = require('url');
const util = require('util');
const validations = require('./modern-backbone-starterkit/src/isomorphic/articleValidations.js');

const app = express();
const upload = multer();

const distDir = __dirname + '/modern-backbone-starterkit/dist/'

const NODE_ENV = process.env.NODE_ENV;
if (NODE_ENV !== 'production' && NODE_ENV !== 'development') {
  throw "NODE_ENV environment variable not set.";
}

const MONGO_URI = process.env.MONGODB_URI;

const logError = function(err) {
  console.error(err.stack || err);

  // If you pass an error handling function to another function as an async callback, you may have no idea where the error
  // originated from, because the async code runs on a completely different stack frame -- the original
  // stack frame is long gone and thus won't be in the stack trace. So, what we do is we
  // use an inline/lambda function (let's call this function L) and pass that as the async callback argument.
  // From function L we will call logError and logError will call console.trace(). That way the line number
  // of this L will be captured/traced, and we can figure out where the error originated from.
  // Note: We also use this in other cases besides just when passing in a lambda/inline function as an argument/callback
  // to another function.
  console.trace("Caught from:");
}

MongoClient.connect(MONGO_URI, (err, db) => {
  if (err !== null) {
    logError(err);
    throw err;
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
    app.use(passport.initialize());
    app.use(passport.session());
    app.set('port', (process.env.PORT || 5000));
    
    const sendIndex = function(req, res) {
      res.render('pages/index', {
        //isLoggedIn: !!req.user,
        //user: JSON.stringify(req.user)
      });
    }
    
    const send404 = function(res) {
      res.status(404).send('Error 404. Page not found.');
    }


    // IMPORTANT: Routes are duplicated in client side code.
    // Namely the router and the nav template.
    app.get('/', sendIndex);
    app.get('/user/:userid', sendIndex);
    app.get('/business', sendIndex);
    app.get('/education', sendIndex);
    //app.get('/login', sendIndex);
    app.get('/other', sendIndex);
    app.get('/politics', sendIndex);
    app.get('/sports', sendIndex);
    app.get('/spirituality', sendIndex);
    app.get('/technology', sendIndex);

    app.get('/logout', function(req, res) {
      req.logout();
      res.redirect('/');
    });




    passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: 'http://' + process.env.DOMAIN_NAME + "/auth/facebook/callback"
      },
      function(accessToken, refreshToken, profile, done) {
        db.collection('user', (err, userColl) => {
          if (err !== null) {
            logError(err);
            done(err);
          } else {
            userColl.findOneAndUpdate( // find if exists, create if doesn't
              //TODO create index on fbId
              {fbId: profile.id},
              {
                displayName: profile.displayName,
                fbAccessToken: accessToken,
                fbId: profile.id,
                userType: 'user'
              },
              {
                upsert: true,
                returnOriginal: false
              },
              function(err, user) {
                if (err !== null) {
                  done(err);
                } else {
                  done(null, user.value);
                }
              }
            );
          }
        });
      }
    ));

    passport.serializeUser(function(user, done) {
      done(null, user.fbId);
    });
    
    passport.deserializeUser(function(userId, done) {
      db.collection('user', (err, userColl) => {
        if (err !== null) {
          logError(err);
          done(err);
        } else {
          userColl.find({fbId: userId}).next().then(
            function(user) {
              done(null, user);
            },
            function(err) {
              done(err);
            }
          );
        }
      });
    });

    // we will call this to start the GitHub Login process
    app.get('/auth/facebook', passport.authenticate('facebook'));
    
    // GitHub will call this URL
    app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/why' }),//TODO /why
      function(req, res) {
        res.redirect('/');
      }
    );
    
    function fileTypeIsValid(fileType) {
      const imageMimeTypeRegex = /image\/.*/;
      return fileType.match(imageMimeTypeRegex) !== null;
    }

    app.get('/:admin((admin/)?)article/:articleSlug', function(req, res, next) {
      const adminPage = !!req.params.admin;
      let articleSlug = req.params.articleSlug;
      let articleId = parseInt(articleSlug, 10); // extract leading integers
      db.collection('article', (err, collection) => {
        if (err !== null) {
          logError(err);
          next(err);
        } else {
          collection.find({'_id': articleId}).next( function(err, article) {
            if (err !== null) {
              logError(err);
              next(err);
            } else {
              if (article === null) {
                send404(res);
              } else if (articleSlug !== article.articleURLSlug) {
                // Even if the articleId corresponds to a valid article,
                // send a 404 unless the rest of the slug matches as well.
                // This will avoid duplicate content SEO issues.
                send404(res);
              } else {
                if (adminPage || article.visibility === 'visible') {
                  updateViewsCollections(db, articleId);
                  let title = article.headline;
                  let description;
                  if (article.subline.length) {
                    description = article.subline;
                  } else {
                    description = article.headline;
                  }
                  res.render('pages/article', {
                    article: article,
                    description: description,
                    fbAppId: process.env.FACEBOOK_APP_ID,
                    title: title,
                    url: req.protocol + '://' + req.get('host') + req.originalUrl, //http://stackoverflow.com/a/10185427
                    articleVisibility: article.visibility,
                  });
                } else {
                  res.render('pages/article', {
                    articleVisibility: article.visibility,
                  });
                }
              }
            }
          });
        }
      });
    });

    app.get('/api/article/:articleId', function(req, res, next) {
      //const adminPage = !!req.params.admin;
      //let articleSlug = req.params.articleSlug;
      console.log("in get route");
      let articleId = parseInt(req.params.articleId, 10);
      db.collection('article', (err, collection) => {
        if (err !== null) {
          logError(err);
          next(err);
        } else {
          collection.find({'_id': articleId}).next( function(err, article) {
            if (err !== null) {
              logError(err);
              next(err);
            } else {
              if (article === null) {
                console.log("sending 404");
                send404(res);
              } else {
                // TODO restrict article visibility
                //if (adminPage || article.visibility === 'visible') {
                // TODO don't sent unfiltered article
                  res.json(article)
                //  res.json({
                //    article: article,
                    //description: description,
                    //fbAppId: process.env.FACEBOOK_APP_ID,
                    //title: title,
                    //url: req.protocol + '://' + req.get('host') + req.originalUrl, //http://stackoverflow.com/a/10185427
                    //articleVisibility: article.visibility,
                  //});
                //} else {
                //  res.json({
                //    articleVisibility: article.visibility,
                //  });
                //}
              }
            }
          });
        }
      });
    });

    const MAX_ARTICLES_PER_REQUEST = 50;

    // Returns an error object or null. If error object isn't null, will have the property
    // clientError set to true so that we can send a 4xx response instead of a 5xx response.
    function validateMostRecentArticlesParams(maxId, howMany) {
      let validationErrors = [];
      if (typeof(maxId) !== "number" || Number.isNaN(maxId) || maxId < 0) {
        validationErrors.push("maxId invalid");
      }

      if (typeof(howMany) !== "number" || Number.isNaN(howMany) || howMany < 1 || howMany > MAX_ARTICLES_PER_REQUEST) {
        validationErrors.push("howMany invalid");
      }
      if (validationErrors.length) {
        validationErrors = new Error(JSON.stringify(validationErrors));
        validationErrors.clientError = true;
      } else {
        validationErrors = null;
      }
      return validationErrors;
    }

    function getMostRecentArticlesJSON(maxId, howMany) {
      let validationErrors = validateMostRecentArticlesParams(maxId, howMany);

      let prom = new Promise(function(resolve, reject) {
        if (validationErrors !== null) {
          reject(validationErrors);
        } else {
          db.collection('article', (err, collection) => {
            if (err !== null) {
              reject(err);
            } else {
              collection.find({
                _id: {$lte: maxId}
              }).sort([['_id', -1]]).limit(howMany).toArray(
                function (err, articles) {
                  if (err !== null) {
                    reject(err);
                  } else {
                    resolve(articles);
                  }
                }
              );
            }
          });
        }
      });
      return prom;
    }

    app.get('/most-recent-articles', (req, res, next) => {
      const maxId = parseInt(req.query.max_id, 10);
      const howMany = parseInt(req.query.how_many, 10);
      getMostRecentArticlesJSON(maxId, howMany).then(
        function(articlesJSON) {
          res.send(articlesJSON);
        }, 
        function(err) {
          if (err.clientError === true) {
            res.status(400).send("Something went wrong.");
          } else {
            logError(err);
            next(err);
          }
        }
      );
    });

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
                _id: {$nin: dontInclude}
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
    
    function getNextId() {
      var nextIdPromise = new Promise(function(resolve, reject) {
        db.collection('counters').findOneAndUpdate(
          {_id: 'articleId'},
          {$inc: {seq:1}},
          {upsert: true},
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

    app.post('/article', bodyParser.urlencoded(), function(req, res, next) {
      const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET;
    
      const sess = req.session;
      const articleId = sess.articleId;
      const imageSlug = sess.imageSlug;
      const headline = req.body.headline;
      const subline = req.body.subline;
      validationErrors = validations.validateEverything(headline, subline);
      if (validationErrors) {
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
              articleURLSlug: articleURLSlug,
              dateCreated: new Date(),
              headline: headline,
              imageURL: imageURL,
              sessionIdOfAuthor: req.sessionID,
              subline: subline,
              visibility: 'unapproved'
            }
            collection.insert(doc, {
                w: "majority",
                wtimeout: mongoConcerns.WTIMEOUT
              }, 
              (error, result) => {
                if (error !== null) {
                  next(error);
                } else {
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
    
    //DEVELOPMENT ROUTES
    app.get('/upload', sendIndex);
    
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
