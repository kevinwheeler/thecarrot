const logError = require('../utils').logError;
const joinArticleArrayWithImages = require('../utils').joinArticleArrayWithImages;

function getRouteFunction(db) {

  const MAX_ARTICLES_PER_REQUEST = 50;


  // Returns an error object or null. If error object isn't null, will have the property
  // clientError set to true so that we can send a 4xx response instead of a 5xx response.
  function validateParams(minId, howMany) {
    let validationErrors = [];
    if (typeof(minId) !== "number" || Number.isNaN(minId) || minId < 0) {
      validationErrors.push("minId invalid");
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

  function getNeedApprovalArticlesJSON(minId, howMany) {
    let validationErrors = validateParams(minId, howMany);

    let prom = new Promise(function(resolve, reject) {
      if (validationErrors !== null) {
        reject(validationErrors);
      } else {
        let articlesClosure;
        db.collection('article', (err, articleColl) => {
          if (err !== null) {
            reject(err);
          } else {
            //TODO consider a compound index on approval, id.
            articleColl.find({
              _id: {$gte: minId},
              approval: {$in: ['pending', 'autoApproved']},
            }).sort([['_id', 1]]).limit(howMany).toArray().then(
              function (articles) {
                articlesClosure = articles;
                return joinArticleArrayWithImages(db, articles);
              }
            ).then(function() {
              resolve(articlesClosure);
            }).catch(function(err) {
              reject(err);
            });
          }
        });
      }
    });
    return prom;
  }

  const routeFunction = function (req, res, next) {
    if (req.user && req.user.userType === 'admin') {
      const minId = parseInt(req.query.min_id, 10);
      const howMany = parseInt(req.query.how_many, 10);
      getNeedApprovalArticlesJSON(minId, howMany).then(
        function (articlesJSON) {
          res.send(articlesJSON);
        },
        function (err) {
          if (err.clientError === true) {
            res.status(400).send("Something went wrong.");
          } else {
            logError(err);
            next(err);
          }
        }
      );
    } else {
        res.status(403).send("You are either not logged on or not an admin.");
    }
  };

  return routeFunction;
}

module.exports = getRouteFunction;
