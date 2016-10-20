const logError = require('../utils').logError;

function getRouteFunction(db) {

  let imageColl;
  function getImageColl() {
    const prom = new Promise(function(resolve,reject) {
      db.collection('image', {}, (err, coll) => {
        if (err !== null) {
          reject(err);
        } else {
          imageColl = coll;
          resolve();
        }
      });
    })
    return prom;
  }

  function validateParams(search_query) {
    let validationErrors = [];

    if (typeof(search_query) !== "string" || !search_query.length) {
      validationErrors.push("search_query invalid.");
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
    const search_query = req.query.search_query;

    const validationErrors = validateParams(search_query);
    if (validationErrors !== null) {
      res.status(400).send("Invalid parameters.");
    } else {
      getImageColl(
      ).then(function() {
        return imageColl.find({
          $text: {
            $search: search_query
          },
          reusableApproval: {$eq: "approved"}
        }).limit(1000).toArray();
      }).then(function(images) {
        res.json(images);
      }).catch(function(err) {
        logError(err);
        next(err);
      });
    }
  };

  return routeFunction;
}

module.exports = getRouteFunction;
