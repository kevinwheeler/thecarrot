const logError = require('../utils').logError;
const _ = require('lodash');

function getRouteFunction(db) {

  const MAX_ARTICLES_PER_REQUEST = 50;

  function validateParams(maxId, howMany) {
    let validationErrors = [];
    if (typeof(maxId) !== "number" || Number.isNaN(maxId) || maxId < 0) {
      validationErrors.push("maxId invalid");
    }

    if (typeof(howMany) !== "number" || Number.isNaN(howMany) || howMany < 1 || howMany > MAX_ARTICLES_PER_REQUEST) {
      validationErrors.push("howMany invalid");
    }
    if (validationErrors.length) {
      validationErrors = new Error(JSON.stringify(validationErrors));
      validationErrors.clientError = true;
    } else {
      validationErrors = null;
    }
    return validationErrors;
  }


  function getMyApprovalHistoryArticlesJSON(maxId, howMany, approverFbId) {
    let validationErrors = validateParams(maxId, howMany);

    let prom = new Promise(function(resolve, reject) {
      if (validationErrors !== null) {
        reject(validationErrors);
      } else {
        db.collection('approvalLog', (err, approvalLogColl) => {
          if (err !== null) {
            reject(err);
          } else {
            //TODO consider a compound index on approval, id.
            approvalLogColl.find({
              _id: {$lte: maxId},
              approverFbId: approverFbId,
            }).sort([['_id', -1]]).limit(howMany).project({
              _id: false,
              articleId: true,
              verdict: true,
              timestamp: true
            }).toArray(
              function (err, approvalLogEntries) {
                if (err !== null) {
                  reject(err);
                } else {
                  const IDs = approvalLogEntries.map(function (item) {
                    return item.articleId;
                  });
                  db.collection('article', (err, articleColl) => {
                    if (err !== null) {
                      reject(err);
                    } else {
                      articleColl.find({
                        _id: {$in: IDs}
                      }).toArray(
                        function (err, articles) {
                          if (err !== null) {
                            reject(err);
                          } else {
                            // articleID => article
                            const articleMap = {};
                            for (let i=0; i < articles.length; i++) {
                              const article = articles[i];
                              articleMap[article._id] = article;
                            }
                            // since articles array doesn't have duplicates, but approvalLogEntries
                            // does have duplicates, and because the order of articles array doesn't
                            // match the order of approvalLogEntries, we construct a new articles array.
                            // Also, we augment each article with a couple of extra properties.
                            const returnValue = [];
                            for (let i=0; i < approvalLogEntries.length; i++) {
                              const approvalLogEntry = approvalLogEntries[i];
                              // clone so we don't clobber in the case of duplicates
                              const article = _.cloneDeep(articleMap[approvalLogEntry.articleId]);
                              article.historicalApprovalVerdict = approvalLogEntry.verdict;
                              article.historicalApprovalTimestamp = approvalLogEntry.timestamp;
                              returnValue.push(article);
                            }
                            //articles.sort(function (a, b) {
                            //  return IDs.indexOf(a._id) - IDs.indexOf(b._id);
                            //});
                            //for (let i = 0; i < articles.length; i++) {
                            //  //augment article doc with two extra properties
                            //  const article = articles[i];
                            //  const approvalLogEntry = approvalLogEntries[i];
                            //  article.historicalApprovalVerdict = approvalLogEntry.verdict;
                            //  article.historicalApprovalTimestamp = approvalLogEntry.timestamp;
                            //}
                            resolve(returnValue);
                          }
                        }
                      );
                    }
                  });
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
    if (req.user && req.user.userType === 'admin') {
      const approverFbId = req.user.fbId
      getMyApprovalHistoryArticlesJSON(maxId, howMany, approverFbId).then(
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
