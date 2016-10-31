const logError = require('../utils').logError;

function getRouteFunction(db) {

  let articleColl;
  function getArticleColl() {
    const prom = new Promise(function(resolve,reject) {
      db.collection('article', (err, coll) => {
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

  const articleCollPromise = getArticleColl();

  function setListed (listed, articleId) {
    const prom = new Promise(function(resolve, reject) {
      articleCollPromise.then(function() {
        return articleColl.updateOne(
          {
            _id: articleId
          },
          {
            $set: {listed: listed}
          }
        );
      }).then(function success() {
        resolve();
      }).catch(function(err) {
        reject(err);
      });
    });
    return prom;
  };

  const routeFunction = function (req, res, next) {
    if (req.user && req.user.userType === 'admin') {
      const IDs = req.body['article_ids'];
      const redirectUrl = req.body['redirect_url'];
      if (IDs === undefined) {
        //res.status(403).send("You must select at least one article.");
        throw "IDs undefined";
      } else {
        //const approverFbId = req.user.fbId
        let listed = req.body.listed;
        if (listed === "true") {
          listed = true;
        } else if (listed === "false") {
          listed = false;
        } else {
          throw "invalid param: listed";
        }

        const promises = [];
        for (let i=0; i < IDs.length; i++) {
          const articleID = parseInt(IDs[i], 10);
          promises.push(setListed(listed, articleID));
        }
        Promise.all(promises).then(
          function(result) {
            res.redirect(redirectUrl);
          },
          function(err){
            logError(err);
            next(err);
          }
        );
      }
    } else {
      res.status(403).send('You are not an admin or are not logged in.');
    }
  };

  return routeFunction;
}

module.exports = getRouteFunction;
