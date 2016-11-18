const escapeArticle = require('../../modern-backbone-starterkit/src/isomorphic/utils').escapeArticle;
const escapeUserInfo = require('../../modern-backbone-starterkit/src/isomorphic/utils').escapeUserInfo;
const getArticle = require("../getArticle");
const userInfo = require('./getUserInfoJSON');
const logError = require('../utils').logError;
const send404 = require('../utils').send404;
const updateSummaries = require('../updateSummaries');

function getRouteFunction(db) {
   return function (req, res, next) {
    const adminPage = !!req.params.admin;
    let articleSlug = req.params.articleSlug;
    let articleId = parseInt(articleSlug, 10); // extract leading integers
     let currentUserPromise;
     let userFbId ;
     if (req.user) {
       currentUserPromise = userInfo.getUserInfoJSON(db, req.user.fbId, true);
       userFbId = req.user.fbId;
     } else {
       currentUserPromise = Promise.resolve(userInfo.notLoggedInUserInfoJSON());
     }

     getArticle(db, articleId, userFbId, req.sessionID, req.ip).then(function(article) {
       if (articleSlug !== article.articleURLSlug) {
         // Even if the articleId corresponds to a valid article,
         // send a 404 unless the rest of the slug matches as well.
         // This will avoid duplicate content SEO issues.
         send404(res);
       } else {
         return currentUserPromise.then(function(currentUser) {
           escapeArticle(article);
           escapeUserInfo(currentUser);
           const articleString = JSON.stringify(article);
           const renderDoc = {
             articleApproval: article.approval,
             articleString: articleString,
             currentUser: JSON.stringify(currentUser),
             fbAppId: process.env.FACEBOOK_APP_ID,
             imageBaseUrl: process.env.IMAGE_BASE_URL
           };

           if (article.approval === 'approved' || article.approval === 'autoApproved') {
             const description = article.subline;

             renderDoc.article = article;
             renderDoc.description = description;
             renderDoc.imageURL =  process.env.IMAGE_BASE_URL + article.imageSlug;
             renderDoc.title = article.headline;
             renderDoc.url = req.protocol + '://' + req.get('host') + req.originalUrl; //http://stackoverflow.com/a/10185427
           }

           res.render('pages/article', renderDoc);
         });
       }

     }).catch(function(err) {
       if (err === "article not found") {
         send404(res);
       } else {
         logError(err);
         next(err);
       }
     });
  };
}

module.exports = getRouteFunction;
