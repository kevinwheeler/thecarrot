const aws = require('aws-sdk');
const bodyParser = require('body-parser');
const express = require('express');
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
const url = require('url');
const util = require('util');

const app = express();
const upload = multer();

const distDir = __dirname + '/modern-backbone-starterkit/dist/';

const MONGO_URI = process.env.MONGODB_URI;

MongoClient.connect(MONGO_URI,
  {
    wtimeout: 1000*15
  },
  (err, db) => {
  if (err !== null) {
    logError(err);
    throw err;
  } else {

    setupInitialConfiguration(app);

    const sendIndex = function(req, res) {
      res.render('pages/index', {
        fbAppId: process.env.FACEBOOK_APP_ID
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

    const approveArticles = require('./server_code/routeFunctions/approveArticles')(db);
    const getArticleJSON = require('./server_code/routeFunctions/getArticleJSON')(db);
    const getArticlePage = require('./server_code/routeFunctions/getArticlePage')(db);
    const getMostRecentArticlesJSON = require('./server_code/routeFunctions/getMostRecentArticlesJSON')(db);
    const getMyApprovalHistoryJSON = require('./server_code/routeFunctions/getMyApprovalHistoryJSON')(db);
    const getMyAuthoredArticles = require('./server_code/routeFunctions/getMyAuthoredArticles')(db);
    const getNeedApprovalArticlesJSON = require('./server_code/routeFunctions/getNeedApprovalArticlesJSON')(db);
    const getUserInfo = require('./server_code/routeFunctions/getUserInfoJSON')(db);
    const mostViewedArticlesJSON = require('./server_code/routeFunctions/mostViewedArticlesJSON')(db);
    const postArticle = require('./server_code/routeFunctions/postArticle')(db);
    const signS3 = require('./server_code/routeFunctions/signS3')(db);

    app.post('/approve-articles', bodyParser.urlencoded({extended: true}), approveArticles);
    app.get('/api/article/:articleId', getArticleJSON);
    app.get('/:admin((admin/)?)article/:articleSlug', getArticlePage);
    app.get('/most-recent-articles', getMostRecentArticlesJSON);
    app.get('/api/my-approval-history', getMyApprovalHistoryJSON);
    app.get('/my-authored-articles', getMyAuthoredArticles);
    app.get('/articles-that-need-approval', getNeedApprovalArticlesJSON);
    app.get('/userinfo', getUserInfo);
    // most-viewed-articles uses post instead of get to get over query string length limitations
    app.post('/most-viewed-articles', bodyParser.json(), mostViewedArticlesJSON);
    app.post('/article', bodyParser.urlencoded(), postArticle);
    let s3Limiter = new RateLimit({
      delayAfter: 3, // begin slowing down responses after the third request
      delayMs: 1000, // slow down subsequent responses by 1 second per request
      max: 50, // limit each IP to 30 requests per windowMs
      windowMs: 60*1000 // 1 minute
    });
    app.get('/sign-s3', s3Limiter, signS3);


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
