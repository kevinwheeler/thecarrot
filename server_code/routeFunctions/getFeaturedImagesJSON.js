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

  const routeFunction = function (req, res, next) {
    getImageColl(
    ).then(function() {
      return imageColl.find({
        featured: true
      }).limit(1000).toArray();
    }).then(function(images) {
      res.json(images);
    }).catch(function(err) {
      logError(err);
      next(err);
    });
  };

  return routeFunction;
}

module.exports = getRouteFunction;
