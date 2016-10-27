const aws = require('aws-sdk');
const bodyParser = require('body-parser');
const categories = require('./modern-backbone-starterkit/src/isomorphic/categories').categories;
const escapeUserInfo = require('./modern-backbone-starterkit/src/isomorphic/utils').escapeUserInfo;
const express = require('express');
const articleRoute = require('./modern-backbone-starterkit/src/isomorphic/routes').articleRoute;
const logError = require('./server_code/utils').logError;
const MongoClient = require('mongodb').MongoClient;
const multer = require('multer');
const passport = require('passport');
const RateLimit = require('express-rate-limit');
const send404 = require('./server_code/utils').send404;
const session = require('express-session');
const setupAuthentication = require('./server_code/authentication');
const setupInitialConfiguration = require('./server_code/configuration');
const timebucket = require('timebucket');
const updateSummaries = require('./server_code/updateSummaries');
const userInfo = require('./server_code/routeFunctions/getUserInfoJSON');
const url = require('url');
const wtimeout = require('./server_code/utils').wtimeout;

const app = express();
const upload = multer();

const distDir = __dirname + '/modern-backbone-starterkit/dist/';

const MONGO_URI = process.env.MONGODB_URI;

MongoClient.connect(MONGO_URI,
  {
    db: {
      wtimeout: wtimeout
    }
  },
  (err, db) => {
    if (err !== null) {
      logError(err);
      throw err;
    } else {

      setupInitialConfiguration(app);
      setupAuthentication(app, db);

      const sendIndex = function(req, res) {
        let currentUserPromise;
        if (req.user) {
          currentUserPromise = userInfo.getUserInfoJSON(db, req.user.fbId);
        } else {
          currentUserPromise = Promise.resolve(userInfo.notLoggedInUserInfoJSON());
        }

        currentUserPromise.then(function(currentUser) {
          escapeUserInfo(currentUser);
          res.render('pages/index', {
            currentUser: JSON.stringify(currentUser),
            fbAppId: process.env.FACEBOOK_APP_ID,
            imageBaseUrl: process.env.IMAGE_BASE_URL
          });
        }).catch(function(err) {
          next(err);
        });
      }



      app.get('/terms-and-conditions', function(req, res) {
        res.render('pages/termsAndConditions', {});
      });
      app.get('/privacy-policy', function(req, res) {
        res.render('pages/privacyPolicy', {});
      });
      app.get('/dmca-instructions', function(req, res) {
        res.render('pages/dmcaInstructions', {});
      });

      // IMPORTANT: Routes are duplicated in client side code.
      // Namely the router and the nav template.
      app.get('/', sendIndex);
      app.get('/about', sendIndex);
      app.get('/admin/flagged-articles', sendIndex);
      app.get('/admin/my-approval-history', sendIndex);
      app.get('/admin/need-approval-articles', sendIndex);
      app.get('/admin/need-approval-images', sendIndex);
      app.get('/admin/upload', sendIndex);
      app.get('/flags/:articleId', sendIndex);
      app.get('/user/:userid', sendIndex);
      app.get('/upload', sendIndex);

      for (let i=0; i < categories.length; i++) {
        app.get('/' + categories[i].urlSlug, sendIndex);
      }

      app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
      });

      const approveArticles = require('./server_code/routeFunctions/approveArticles')(db);
      const approveImages = require('./server_code/routeFunctions/approveImages')(db);
      const bestArticlesJSON = require('./server_code/routeFunctions/bestArticlesJSON')(db);
      const getArticleJSON = require('./server_code/routeFunctions/getArticleJSON')(db);
      const getArticlePage = require('./server_code/routeFunctions/getArticlePage')(db);
      const getFeaturedImagesJSON = require('./server_code/routeFunctions/getFeaturedImagesJSON')(db);
      const getMostRecentArticlesJSON = require('./server_code/routeFunctions/getMostRecentArticlesJSON')(db);
      const getMyApprovalHistoryJSON = require('./server_code/routeFunctions/getMyApprovalHistoryJSON')(db);
      const getMyAuthoredArticles = require('./server_code/routeFunctions/getMyAuthoredArticles')(db);
      const getNeedApprovalArticlesJSON = require('./server_code/routeFunctions/getNeedApprovalArticlesJSON')(db);
      const getNeedApprovalImagesJSON = require('./server_code/routeFunctions/getNeedApprovalImagesJSON')(db);
      const getTextSearchImages = require('./server_code/routeFunctions/getTextSearchImages')(db);
      //const getUserInfo = require('./server_code/routeFunctions/getUserInfoJSON')(db);
      const mostViewedArticlesJSON = require('./server_code/routeFunctions/mostViewedArticlesJSON')(db);
      const postApprovalNotification = require('./server_code/routeFunctions/postApprovalNotification')(db);
      const postArticle = require('./server_code/routeFunctions/postArticle')(db);
      const getArticleFlags = require('./server_code/routeFunctions/getArticleFlags')(db);
      const postFlagArticle = require('./server_code/routeFunctions/postFlagArticle')(db);
      const postFlaggedArticles = require('./server_code/routeFunctions/postFlaggedArticles')(db);
      const postImage = require('./server_code/routeFunctions/postImage')(db);
      const postVote = require('./server_code/routeFunctions/postVote')(db);


      app.post('/approve-articles', bodyParser.urlencoded({extended: true}), approveArticles);
      app.post('/approve-images', bodyParser.urlencoded({extended: true}), approveImages);
      app.post('/best-articles', bodyParser.json(), bestArticlesJSON);
      app.get('/article-flags', bodyParser.json(), getArticleFlags);
      app.get('/api/article', getArticleJSON);
      app.get(articleRoute.nodeRouteString, getArticlePage);
      app.get('/featured-images', getFeaturedImagesJSON);
      app.get('/most-recent-articles', getMostRecentArticlesJSON);
      app.get('/api/my-approval-history', getMyApprovalHistoryJSON);
      app.get('/my-authored-articles', getMyAuthoredArticles);
      app.get('/text-search-images', getTextSearchImages);
      app.get('/articles-that-need-approval', getNeedApprovalArticlesJSON);
      app.get('/images-that-need-approval', getNeedApprovalImagesJSON);
      //app.get('/userinfo', getUserInfo);
      // most-viewed-articles uses post instead of get to get over query string length limitations
      app.post('/most-viewed-articles', bodyParser.json(), mostViewedArticlesJSON);
      app.post('/article-approval-notification', bodyParser.urlencoded({extended: false}), postApprovalNotification);
      app.post('/article', bodyParser.urlencoded({extended: false}), postArticle);
      app.post('/flag-article', bodyParser.urlencoded({extended: true}), postFlagArticle);
      app.post('/flagged-articles', bodyParser.json(), postFlaggedArticles);
      const imageLimiter = new RateLimit({
        windowMs: 1000*60, // 1 minute
        max: 5, // limit each IP to 5 requests per windowMs
      });
      //app.post('/image', imageLimiter, upload.single('image'), postImage);
      const voteLimiter = new RateLimit({
        delayAfter: 1, // begin slowing down responses after the first request
        delayMs: 5000, // slow down subsequent responses by 5 second per request
      });
      app.post('/vote', voteLimiter, bodyParser.urlencoded({extended: false}), postVote);

      app.use(express.static(distDir));
      app.use(express.static('public'));

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
  }
);
