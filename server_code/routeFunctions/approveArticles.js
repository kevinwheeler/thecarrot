// TODO removed the  updateSummarries, need to double check that everything is right.
// Might as well clean up promise code while we are at it.
const logError = require('../utils').logError;

function getRouteFunction(db) {
  const getNextApprovalLogId = require('../utils').getNextId.bind(null, db, "approvalLogId");
  function setApproval (approvalVerdict, articleId, approverFbId) {
    let articleColl;
    let approvalLogColl;

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

    function getApprovalLogColl() {
      const prom = new Promise(function(resolve,reject) {
        db.collection('approvalLog', (err, coll) => {
          if (err !== null) {
            reject(err);
          } else {
            approvalLogColl = coll;
            resolve();
          }
        });
      })
      return prom;
    }

    const prom = new Promise(function(resolve, reject) {
      getArticleColl(
      ).then(
        getApprovalLogColl
      ).then(
        getNextApprovalLogId
      ).then(
        function insertApprovalLogEntry(id) {
          //TODO compound index on approverFbId, _id
          return approvalLogColl.insertOne(
            {
              _id: id,
              approverFbId: approverFbId,
              articleId: articleId,
              timestamp: new Date(),
              verdict: approvalVerdict
            },
            {
              w: 'majority'
            }
          )
        }
      ).then(function updateFirstApprovedAt() {
        if (approvalVerdict === 'approved') {
          return articleColl.updateOne(
            {
              _id: articleId,
              firstApprovedAt: {$exists: false}
            },
            {
              $set: {firstApprovedAt: new Date()},
            },
            {
              w: 'majority',
            }
          );
        } else {
          return Promise.resolve();
        }
      }).then(function emailApprovalStatus() { //TODO

      }).then(function updateArticleApproval() {
        return articleColl.updateOne(
          {
            _id: articleId
          },
          {
            $set: {approval: approvalVerdict},
          },
          {
            w: 'majority',
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
        res.status(403).send("You must select at least one article.");
      } else {
        const approverFbId = req.user.fbId
        const approvalVerdict = req.body['approval_verdict'];
        const promises = [];
        for (let i=0; i < IDs.length; i++) {
          const articleID = parseInt(IDs[i], 10);
          promises.push(setApproval(approvalVerdict, articleID, approverFbId, res, next));
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
