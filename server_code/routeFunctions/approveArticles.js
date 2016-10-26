const articleRoute = require('../../modern-backbone-starterkit/src/isomorphic/routes').articleRoute;
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

  function setApproval (approvalVerdict, articleId, approverFbId) {


    let article;
    function getArticle() {
      return getArticleColl().then(function getArticle() {
        return articleColl.find({
          _id: articleId
        }).limit(1).next();
      }).then(function(result) {
        if (result === null) {
          return Promise.reject();
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
