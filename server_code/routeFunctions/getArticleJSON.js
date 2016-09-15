const _ = require('lodash');
const logError = require('../utils').logError;
const send404 = require('../utils').send404;
const privateArticleFields = require('../utils').privateArticleFields;
const updateSummaries = require('../updateSummaries');
function getRouteFunction(db) {




  function validateParams(articleId, incrementViews) {
    let validationErrors = [];

    if (typeof(articleId) !== "number" || Number.isNaN(articleId) || articleId <= 0) {
      validationErrors.push("articleId invalid");
    }

    if (typeof(incrementViews) !== "boolean") {
      validationErrors.push("incrementViews invalid");
    }

    if (validationErrors.length) {
      validationErrors = new Error(JSON.stringify(validationErrors));
      //validationErrors.clientError = true;
    } else {
      validationErrors = null;
    }
    return validationErrors;
  }



   const routeFunction = function (req, res, next) {
     //const adminPage = !!req.params.admin;
     //let articleSlug = req.params.articleSlug;
     let articleId = parseInt(req.query.articleId, 10);
     let incrementViews = req.query.incrementViews;
     if (incrementViews === 'true'){
       incrementViews = true;
     } else if (incrementViews === 'false') {
       incrementViews = false;
     }
     const validationErrors = validateParams(articleId, incrementViews);
     if (validationErrors !== null) {
       res.status(400).send("Something went wrong.");
     } else {
       db.collection('article', (err, articleColl) => {
         if (err !== null) {
           logError(err);
           next(err);
         } else {
           articleColl.find({'_id': articleId}).next( function(err, article) {
             if (err !== null) {
               logError(err);
               next(err);
             } else {
               if (article === null) {
                 send404(res);
               } else {
                 if ((req.user && req.user.fbId === article.authorId || req.sessionID === article.sidOfAuthor)) {
                   article.viewerIsAuthor = true;
                 } else {
                   article.viewerIsAuthor = false;
                 }
                 if (incrementViews) {
                   updateSummaries.incrementCounts(db, 'views', articleId);
                 }
                 // return article except with private fields omitted.
                 const args = [article].concat(privateArticleFields);
                 res.json(_.omit.apply(null, args));
               }
             }
           });
         }
       });
     }
   };

  return routeFunction;
}

module.exports = getRouteFunction;
