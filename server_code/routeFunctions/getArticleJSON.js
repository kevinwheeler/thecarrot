const _ = require('lodash');
const logError = require('../utils').logError;
const send404 = require('../utils').send404;
const joinArticleWithImage = require('../utils').joinArticleWithImage;
const privateArticleFields = require('../utils').privateArticleFields;
const updateSummaries = require('../updateSummaries');
function getRouteFunction(db) {
  let articleColl;
  function getArticleColl() {
    const prom = new Promise(function(resolve,reject) {
      db.collection('article', {}, (err, coll) => {
        if (err !== null) {
          reject(err);
        } else {
          articleColl = coll;
          resolve();
        }
      });
    })
    return prom;
  }

  // If one person views the same article 1000 times, we don't want to increment the number of views that this article
  // has each time. So this function determines whether or not we actually want to increment the number of views.
  // For now, we just check if the user's IP address and we will only let him increment the view count once
  // every 24 hours.
  function getShouldIncrementViews(articleId, ipAddress) {
    const prom = new Promise(function(resolve, reject) {
      db.collection('views', (err, viewsColl) => {
        if (err !== null) {
          reject(err);
        } else {
          const threshold = new Date(Date.now() - 1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/ * 24 /*day*/);
          viewsColl.find({
            articleId: articleId,
            ipAddress: ipAddress,
            timestamp: {$gt: threshold}
          }).limit(1).next().then(function(result) {
            if (result) {
              resolve(false);
            } else {
              resolve(true);
            }
          }).catch(function(err) {
            reject(err);
          });
        }
      });
    });
    return prom;
  }

  /*
   *  Log that the article was viewed by this ip address so that we don't
   *  count any more views from this ip address for a while.
   */
  function updateShouldIncrementViews(articleId, ipAddress) {
    db.collection('views', (err, viewsColl) => {
      if (err !== null) {
        reject(err);
      } else {
        viewsColl.insertOne({
          articleId: articleId,
          ipAddress: ipAddress,
          timestamp: new Date()
        }).catch(function(err) {
          logError(err);
        });
      }
    });
  }

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
     if (incrementViews === 'true') {
       incrementViews = true;
     } else if (incrementViews === 'false') {
       incrementViews = false;
     }
     const validationErrors = validateParams(articleId, incrementViews);
     if (validationErrors !== null) {
       res.status(400).send("Invalid parameters.");
     } else {
       getArticleColl(
       ).then(function getArticle() {
         return articleColl.find({'_id': articleId}).next();
       }).then(function(article) {
         if (article === null) {
           send404(res);
         } else {
           if ((req.user && req.user.fbId === article.authorId || req.sessionID === article.sidOfAuthor)) {
             article.viewerIsAuthor = true;
           } else {
             article.viewerIsAuthor = false;
           }
           if (incrementViews) {
             getShouldIncrementViews(articleId, req.ip).then(function(shouldIncrement) {
               if (shouldIncrement) {
                 updateSummaries.incrementCounts(db, 'views', articleId);
                 updateShouldIncrementViews(articleId, req.ip);
               }
             }).catch(function(err) {
               logError(err);
             });
           }

           joinArticleWithImage(db, article).then(function() {
             const args = [article].concat(privateArticleFields);
             res.json(_.omit.apply(null, args));
           }).catch(function(err) {
             next(err);
           });
           // return article except with private fields omitted.
         }
       }).catch(function(err) {
         logError(err);
         next(err);
       });
     }
   };

  return routeFunction;
}

module.exports = getRouteFunction;
