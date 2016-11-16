const articleRoute = require('../../modern-backbone-starterkit/src/isomorphic/routes').articleRoute;
const categories = require('../../modern-backbone-starterkit/src/isomorphic/categories').categories;
const logError = require('../utils').logError;
const sendgrid  = require('sendgrid')(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD);

function getRouteFunction(db) {
  const getNextApprovalLogId = require('../utils').getNextId.bind(null, db, "approvalLogId");

  let approvalLogColl;
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

  let notificationsColl;
  function getApprovalNotificationSubscribersColl() {
    const prom = new Promise(function(resolve,reject) {
      db.collection('approval_notification_subscribers', (err, coll) => {
        if (err !== null) {
          reject(err);
        } else {
          notificationsColl = coll;
          resolve();
        }
      });
    })
    return prom;
  }

  const articleCollPromise = getArticleColl();
  const approvalCollPromise = getApprovalLogColl();
  const notificationsCollPromise = getApprovalNotificationSubscribersColl();

  function updateArticle (articleId, approvalVerdict, listed, category, approverFbId) {

    let article;
    function getArticle() {
      return getArticleColl().then(function getArticle() {
        return articleColl.find({
          _id: articleId
        }).limit(1).next();
      }).then(function(result) {
        if (result === null) {
          return Promise.reject("Article not found.");
        } else {
          article = result;
          return Promise.resolve();
        }
      });
    }


    const prom = new Promise(function(resolve, reject) {
      Promise.all([articleCollPromise, approvalCollPromise, notificationsCollPromise]).then(
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
      }).then(getArticle
      ).then(function getNotificationSubscribers() {
        return notificationsColl.find({
          _id: articleId
        }).limit(1).next()
      }).then(function(doc) {
        if (doc !== null && article.approval ==="pending") { // Only email the first time an article is approved.
          let fromAddress;
          if (process.env.NODE_ENV === "development") {
            fromAddress = "noreply@example.com"
          } else {
            fromAddress = 'noreply@' + process.env.DOMAIN_NAME;
          }

          const promises = [];

          for (let i=0; i < doc.emailAddresses.length; i++) {
            const prom = new Promise(function(resolve, reject) {
              sendgrid.send({
                to: doc.emailAddresses[i],
                from: fromAddress,
                subject: process.env.DOMAIN_NAME + ': Your headline has been reviewed.',
                text: `Your headline at ${process.env.DOMAIN}/${articleRoute.routePrefix}/${article.articleURLSlug} has been reviewed. Result: ${approvalVerdict}`,
              }, function (err, json) {
                if (err) {
                  reject(err)
                } else {
                  resolve();
                }
              });
            });
            promises.push(prom);
          }
          return Promise.all(promises);
        }
      }).then(function updateArticleFields() {
        return articleColl.updateOne(
          {
            _id: articleId
          },
          {
            $set: {
              approval: approvalVerdict,
              category: category,
              listed: listed
            },
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

  function validateParams(articleID, approvalVerdict, listed, category) {
    let validationErrors = [];

    if (typeof(articleID) !== "number" || isNaN(articleID) || articleID <= 0 ) {
      validationErrors.push("article_id invalid.");
    }

    if (approvalVerdict !== "approved" && approvalVerdict !== "denied") {
      validationErrors.push("approval_verdict invalid.");
    }

    if (listed !== true && listed !== false) {
      validationErrors.push("listed invalid.");
    }

    if (typeof(category) === "string") {
      let categoryFound = false;
      for (let i=0; i < categories.length; i++) {
        if (category === categories[i].otherSlug) {
          categoryFound = true;
          break;
        }
      }

      if (!categoryFound) {
        validationErrors.push("category not found.");
      }
    } else {
      validationErrors.push("category invalid.");
    }

    if (validationErrors.length) {
      validationErrors = new Error(JSON.stringify(validationErrors));
    } else {
      validationErrors = null;
    }
    return validationErrors;
  }

  const routeFunction = function (req, res, next) {
    if (req.user && req.user.userType === 'admin') {
      const articleID = parseInt(req.body['article_id'], 10);
      const approverFbId = req.user.fbId
      const approvalVerdict = req.body['approval_verdict'];
      const category = req.body['category'];
      let listed = req.body['listed'];
      if (listed === "true") {
        listed = true;
      } else if (listed === "false") {
        listed = false;
      }

      const validationErrors = validateParams(articleID, approvalVerdict, listed, category);
      if (validationErrors !== null) {
        res.status(400).send("Invalid parameters.");
      } else {

      }
        updateArticle(articleID, approvalVerdict, listed, category, approverFbId, res, next).then(
        function(result) {
          res.send();
        },
        function(err) {
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
