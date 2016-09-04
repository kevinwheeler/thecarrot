const logError = require('../utils').logError;
const publicArticleFieldsProjection = require('../utils').publicArticleFieldsProjection;

function getRouteFunction(db) {

  const MAX_ARTICLES_PER_REQUEST = 50;
  const MAX_SKIP_AHEAD_AMOUNT = 1000;

  // Returns an error object or null. If error object isn't null, will have the property
  // clientError set to true so that we can send a 4xx response instead of a 5xx response.
  function validateMostRecentArticlesParams(maxId, howMany, skipAheadAmount, category, staffPicksOnly) {
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

    if (category !== "politics" && category !== "spirituality" && category !== "all") {
      validationErrors.push("category invalid");
    }

    if (typeof(staffPicksOnly) !== "boolean") {
      validationErrors.push("staffPicksOnly invalid");
    }

    if (staffPicksOnly && category !== "all") {
      // we might change this later, but for now we aren't implementing the ability to request staff picks from a
      // particular category.
      validationErrors.push("Invalid combo of staff_picks_only and category");
    }


    if (validationErrors.length) {
      validationErrors = new Error(JSON.stringify(validationErrors));
      validationErrors.clientError = true;
    } else {
      validationErrors = null;
    }
    return validationErrors;
  }


  function getMostRecentArticlesJSON(maxId, howMany, skipAheadAmount, category, staffPicksOnly) {
    let validationErrors = validateMostRecentArticlesParams(maxId, howMany, skipAheadAmount, category, staffPicksOnly);

    let prom = new Promise(function(resolve, reject) {
      if (validationErrors !== null) {
        reject(validationErrors);
      } else {
        db.collection('article', (err, collection) => {
          if (err !== null) {
            reject(err);
          } else {
            //TODO consider a compound index on approval, id.
            const filter = {
              _id: {$lte: maxId},
              approval: 'approved'
            };
            if (category !== 'all') {
              filter.category = category;
            }
            if (staffPicksOnly === true) {
              filter.staffPick = true;
            }

            collection.find(filter).project(publicArticleFieldsProjection).sort([['_id', -1]]).skip(skipAheadAmount).limit(howMany).toArray(
              function (err, articles) {
                if (err !== null) {
                  reject(err);
                } else {
                  resolve(articles);
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
    const category = req.query.category;
    let staffPicksOnly = req.query.staff_picks_only;
    if (staffPicksOnly === 'false') {
      staffPicksOnly = false;
    } else if (staffPicksOnly === 'true') {
      staffPicksOnly = true;
    }

    getMostRecentArticlesJSON(maxId, howMany, skipAheadAmount, category, staffPicksOnly).then(
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
