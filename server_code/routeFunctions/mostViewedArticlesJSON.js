const getMostViewedArticlesJSON = require('../updateSummaries').getMostViewedArticlesJSON;
const logError = require('../utils').logError;

function getRouteFunction(db) {
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

    getMostViewedArticlesJSON(db, dontInclude, howMany, timeInterval, skipAheadAmount, category, staffPicksOnly).then(
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
    ).then(function(){}, function(err){
      logError(err); next(err);
    });
  };

  return routeFunction;
}

module.exports = getRouteFunction;
