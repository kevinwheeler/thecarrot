const logError = require('../utils').logError;
const publicArticleFieldsProjection = require('../utils').publicArticleFieldsProjection;
const categories = require('../../modern-backbone-starterkit/src/isomorphic/categories').categories;

function getRouteFunction(db) {

  const MAX_ARTICLES_PER_REQUEST = 50;
  const MAX_SKIP_AHEAD_AMOUNT = 1000;

  // Returns an error object or null. If error object isn't null, will have the property
  // clientError set to true so that we can send a 4xx response instead of a 5xx response.
  function validateParams(maxId, howMany, skipAheadAmount, articleId) {
    let validationErrors = [];
    if (typeof(maxId) !== "number" || Number.isNaN(maxId) || maxId < 0) {
      validationErrors.push("maxId invalid");
    }

    if (typeof(howMany) !== "number" || Number.isNaN(howMany) || howMany < 1 || howMany > MAX_ARTICLES_PER_REQUEST) {
      validationErrors.push("howMany invalid");
    }

    if (typeof(skipAheadAmount) !== "number" || Number.isNaN(skipAheadAmount) || skipAheadAmount < 0 || skipAheadAmount > MAX_SKIP_AHEAD_AMOUNT) {
      validationErrors.push("skipAheadAmount invalid");
    }

    if (typeof(articleId) !== "number" || Number.isNaN(articleId) || articleId < 0) {
      validationErrors.push("articleId invalid");
    }

    if (validationErrors.length) {
      validationErrors = new Error(JSON.stringify(validationErrors));
      validationErrors.clientError = true;
    } else {
      validationErrors = null;
    }
    return validationErrors;
  }


  function getArticleFlagsJSON(maxId, howMany, skipAheadAmount, articleId) {
    let validationErrors = validateParams(maxId, howMany, skipAheadAmount, articleId);

    let prom = new Promise(function(resolve, reject) {
      if (validationErrors !== null) {
        reject(validationErrors);
      } else {
        db.collection('authenticated_flags', (err, flagsColl) => {
          if (err !== null) {
            reject(err);
          } else {
            //TODO create indexes
            flagsColl.find({
              _id: {$lte: maxId},
              articleId: articleId
            }).sort([['_id', -1]]).skip(skipAheadAmount).limit(howMany).toArray(
              function (err, flags) {
                if (err !== null) {
                  reject(err);
                } else {
                  resolve(flags);
                }
              }
            );
          }
        });
      }
    });
    return prom;
  }


  const routeFunction = function (req, res, next) {
    const maxId = parseInt(req.query.max_id, 10);
    const howMany = parseInt(req.query.how_many, 10);
    const skipAheadAmount = parseInt(req.query.skip_ahead_amount, 10);
    const articleId = parseInt(req.query.article_id, 10);
    //res.send(["yo", "whats", "up"]);

    getArticleFlagsJSON(maxId, howMany, skipAheadAmount, articleId).then(
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
  };

  return routeFunction;
}

module.exports = getRouteFunction;
