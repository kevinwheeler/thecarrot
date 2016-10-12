const joinArticleArrayWithImages = require('../utils').joinArticleArrayWithImages;
const logError = require('../utils').logError;

function getRouteFunction(db) {

  const MAX_ARTICLES_PER_REQUEST = 50;
  const MAX_SKIP_AHEAD_AMOUNT = 1000;

  function validateParams(dontInclude, howMany, skipAheadAmount) {
    let validationErrors = [];

    if (typeof(dontInclude) !== "object") {
      validationErrors.push("dontInclude invalid");
    }

    if (typeof(howMany) !== "number" || Number.isNaN(howMany) || howMany < 1 || howMany > MAX_ARTICLES_PER_REQUEST) {
      validationErrors.push("howMany invalid");
    }

    if (typeof(skipAheadAmount) !== "number" || Number.isNaN(skipAheadAmount) || skipAheadAmount < 0 || skipAheadAmount > MAX_SKIP_AHEAD_AMOUNT) {
      validationErrors.push("skipAheadAmount invalid");
    }

    if (validationErrors.length) {
      validationErrors = new Error(JSON.stringify(validationErrors));
      validationErrors.clientError = true;
    } else {
      validationErrors = null;
    }
    return validationErrors;
  }

  let articleColl;

  function getArticleColl() {
    const prom = new Promise(function(resolve, reject) {
      db.collection('article', (err, coll) => {
        if (err !== null) {
          reject(err);
        } else {
          articleColl = coll;
          resolve();
        }
      })
    })
    return prom;
  }


  function getFlaggedArticlesJSON(dontInclude, howMany, skipAheadAmount) {
    const prom = new Promise(function(resolve, reject) {
      let validationErrors = validateParams(dontInclude, howMany, skipAheadAmount);
      if (validationErrors !== null) {
        reject(validationErrors);
      } else {
        let articlesClosure;
        getArticleColl().then(function getArticlesJSON() {
          return articleColl.find({
            _id: {
              $nin: dontInclude
            },
            flaginess: {$ne: 0}
          }).sort([['flaginess', -1]]).skip(skipAheadAmount).limit(howMany).toArray();
        }).then(function(articles) {
          articlesClosure = articles;
          return joinArticleArrayWithImages(db, articles);
        }).then(function() {
          resolve(articlesClosure);
        }).catch(function(err) {
          reject(err);
        })
      }
    });

    return prom;
  }


  const routeFunction = function (req, res, next) {
    const skipAheadAmount = parseInt(req.body.skip_ahead_amount, 10);
    const dontInclude = req.body.dont_include;
    const howMany = parseInt(req.body.how_many, 10);
    if (req.user && req.user.userType === 'admin') {
      getFlaggedArticlesJSON(dontInclude, howMany, skipAheadAmount).then(
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
