const _ = require('lodash');
const logError = require('../utils').logError;
const send404 = require('../utils').send404;
const privateArticleFields = require('../utils').privateArticleFields;

function getRouteFunction(db) {
   return function (req, res, next) {
     //const adminPage = !!req.params.admin;
     //let articleSlug = req.params.articleSlug;
     let articleId = parseInt(req.params.articleId, 10);
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
               // return article except with private fields omitted.
               const args = [article].concat(privateArticleFields);
               res.json(_.omit.apply(null, args));
             }
           }
         });
       }
     });
   };
}

module.exports = getRouteFunction;
