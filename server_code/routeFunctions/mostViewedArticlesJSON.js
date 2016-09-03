const logError = require('../utils').logError;
const getMostViewedArticlesJSON = require('../updateSummaries').getMostViewedArticlesJSON;

function getRouteFunction(db) {
  const routeFunction = function (req, res, next) {
    const dontInclude = req.body.dont_include;
    const howMany = req.body.how_many;
    const timeInterval = req.body.time_interval;
    const skipAheadAmount = parseInt(req.body.skip_ahead_amount, 10);
    getMostViewedArticlesJSON(db, dontInclude, howMany, timeInterval, skipAheadAmount).then(
      function(articlesJSON) {
        res.send(articlesJSON);
      },
      function(err) {
        if (err.clientError === true){
          res.status(400).send("Something went wrong.");;
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
