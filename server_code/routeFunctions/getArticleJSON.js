const _ = require('lodash');
const getArticle = require("../getArticle");
const joinArticleWithImage = require('../utils').joinArticleWithImage;
const logError = require('../utils').logError;
const send404 = require('../utils').send404;
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

  function validateParams(articleId) {
    let validationErrors = [];

    if (typeof(articleId) !== "number" || Number.isNaN(articleId) || articleId <= 0) {
      validationErrors.push("articleId invalid");
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
     const validationErrors = validateParams(articleId);
     if (validationErrors !== null) {
       res.status(400).send("Invalid parameters.");
     } else {
       let userFbId ;
       if (req.user) {
         userFbId = req.user.fbId;
       }

       getArticle(db, articleId, userFbId, req.sessionID, req.ip).then(function(article) {
         res.json(article);
       }).catch(function(err) {
         if (err === "article not found") {
           send404(res);
         } else {
           logError(err);
           next(err);
         }
       });
     }
   };

  return routeFunction;
}

module.exports = getRouteFunction;
