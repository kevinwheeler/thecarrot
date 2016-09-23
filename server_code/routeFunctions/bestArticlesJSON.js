const categories = require('../../modern-backbone-starterkit/src/isomorphic/categories').categories;
const logError = require('../utils').logError;
const publicArticleFieldsProjection = require('../utils').publicArticleFieldsProjection;

function getRouteFunction(db) {

  function validateParams(dontInclude, howMany, timeInterval, skipAheadAmount, category, staffPicksOnly) {
    const MAX_ARTICLES_PER_REQUEST = 50;
    const MAX_SKIP_AHEAD_AMOUNT = 1000;

    let validationErrors = [];

    if (typeof(dontInclude) !== "object") {
      validationErrors.push("dontInclude invalid");
    }

    if (typeof(howMany) !== "number" || howMany < 1 || howMany > MAX_ARTICLES_PER_REQUEST) {
      validationErrors.push("howMany invalid");
    }

    if (timeInterval !== 'daily' && timeInterval !== 'weekly' && timeInterval !== 'monthly'
      && timeInterval !== 'yearly' && timeInterval !== 'all_time') {
      validationErrors.push("invalid time interval");
    }

    if (typeof(skipAheadAmount) !== "number" || Number.isNaN(skipAheadAmount) || skipAheadAmount < 0 || skipAheadAmount > MAX_SKIP_AHEAD_AMOUNT) {
      validationErrors.push("skipAheadAmount invalid");
    }

    let categoryFound = false;
    for (let i=0; i < categories.length; i++) {
      if (category === categories[i].otherSlug) {
        categoryFound = true;
        break;
      }
    }
    if (category === "all") {
      categoryFound = true;
    }
    if (!categoryFound) {
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

// Returns an error object or null. If a parameter didn't pass validation, the error object
// will have the property clientError set to true so that the caller can send an http 4xx response instead of a 5xx response.
  function getBestArticlesJSON(db, dontInclude, howMany, timeInterval, skipAheadAmount, category, staffPicksOnly) {
    const prom = new Promise(function(resolve, reject) {
      const validationErrors = validateParams(dontInclude, howMany, timeInterval, skipAheadAmount, category, staffPicksOnly);
      if (validationErrors !== null) {
        reject(validationErrors)
      } else {
        db.collection('article', (err, articleColl) => {
          if (err !== null) {
            reject(err);
          } else {

            const filter = {
              _id: {
                $nin: dontInclude
              },
              approval: 'approved'
            };
            if (category !== 'all') {
              filter.category = category;
            }
            if (staffPicksOnly === true) {
              filter.staffPick = true;
            }

            if (timeInterval === 'daily') {
              filter.firstApprovedAt = {$gt: new Date(Date.now() - 1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/ * 24 /*day*/)}
            } else if (timeInterval === 'weekly') {
              filter.firstApprovedAt = {$gt: new Date(Date.now() - 1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/ * 24 /*day*/ * 7 /*week*/)}
            } else if (timeInterval === 'monthly') {
              filter.firstApprovedAt = {$gt: new Date(Date.now() - 1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/ * 24 /*day*/ * 30)}
            } else if (timeInterval === 'yearly') {
              filter.firstApprovedAt = {$gt: new Date(Date.now() - 1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/ * 24 /*day*/ * 365)}
            }

            articleColl.find(filter).project(publicArticleFieldsProjection).sort([['upvoteScore', -1]]).skip(skipAheadAmount).limit(howMany).toArray(
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
    const dontInclude = req.body.dont_include;
    const howMany = req.body.how_many;
    const timeInterval = req.body.time_interval;
    const skipAheadAmount = parseInt(req.body.skip_ahead_amount, 10);
    const category = req.body.category;
    let staffPicksOnly = req.body.staff_picks_only;
    //if (staffPicksOnly === 'false') {
    //  staffPicksOnly = false;
    //} else if (staffPicksOnly === 'true') {
    //  staffPicksOnly = true;
    //}

    getBestArticlesJSON(db, dontInclude, howMany, timeInterval, skipAheadAmount, category, staffPicksOnly).then(
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
    ).catch(function(err) {
      logError(err);
      next(err);
    });
  };

  return routeFunction;
}

module.exports = getRouteFunction;
