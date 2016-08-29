const getNextId = require('../utils').getNextId;
const logError = require('../utils').logError;
const mongoConcerns = require('../mongoConcerns');
const updateSummaries = require('../updateSummaries');

function getRouteFunction(db) {
  function setApproval (approvalVerdict, articleId, approverFbId) {
    // Since we have the approval attribute in both the summary collections and the article collection
    // and we can't update these all atomically, we first set the approval attribute in the article collection
    // to 'inTransaction', then we set the approval attribute to the correct value in all of the summary collections,
    // then finally, we set the approval attribute to the correct value in the article collection. If the process
    // fails in the middle somewhere, the approval attribute in the article collection should still be in the state
    // 'inTransaction', and we will tell the admin/initiator that he should retry the operation.
    const prom = new Promise(function(resolve, reject) {

      const rejectOnError = function(err) {
        reject(err);
      }

      db.collection('article', (err, articleColl) => {
        if (err !== null) {
          reject(err);
        } else {
          articleColl.updateOne(
            {
              _id: articleId
            },
            {
              $set: {approval: 'inTransaction'}
            },
            {
              wtimeout: mongoConcerns.WTIMEOUT,
              w: 'majority'
            }
          ).then(function (result) {
              updateSummaries.setApprovalStatus(db, articleId, approvalVerdict).then(
                function (result) {
                  db.collection('approvalLog', (err, approvalLogColl) => {
                    if (err !== null) {
                      reject(err);
                    } else {
                      getNextId(db, "approvalLogId").then(
                        function(id){
                          //TODO compound index on approverFbId, _id
                          approvalLogColl.insertOne(
                            {
                              _id: id,
                              approverFbId: approverFbId,
                              articleId: articleId,
                              timestamp: new Date(),
                              verdict: approvalVerdict
                            },
                            {
                              w: 'majority',
                              wtimeout: mongoConcerns.WTIMEOUT
                            }
                          ).then(
                            function(result) {
                              articleColl.updateOne(
                                {
                                  _id: articleId
                                },
                                {
                                  $set: {approval: approvalVerdict},
                                },
                                {
                                  w: 'majority',
                                  wtimeout: mongoConcerns.WTIMEOUT
                                }
                              ).then(function (result) {
                                  resolve(result);
                                }, rejectOnError
                              )
                            }, rejectOnError
                          ).then(function(){}, rejectOnError);

                        }, rejectOnError
                      );
                    }
                  });
                },rejectOnError
              ).then(function(){}, rejectOnError);
            }, rejectOnError
          ).then(function(){}, rejectOnError);
        }
      });
    });
    return prom;
  };

  const routeFunction = function (req, res, next) {
    if (req.user && req.user.userType === 'admin') {
      const IDs = req.body['article_ids'];
      const approverFbId = req.user.fbId
      //const articleURLSlug = req.body['article_url_slug'];
      const approvalVerdict = req.body['approval_verdict'];
      const promises = [];
      for (let i=0; i < IDs.length; i++) {
        const articleID = parseInt(IDs[i], 10);
        promises.push(setApproval(approvalVerdict, articleID, approverFbId, res, next));
      }
      Promise.all(promises).then(
        function(result) {
          res.redirect('/admin');
        },
        function(err){
          logError(err);
          next(err);
        }
      );
    } else {
      res.status(403).send('You are not an admin or are not logged in.');
    }
  };

  return routeFunction;
}

module.exports = getRouteFunction;
