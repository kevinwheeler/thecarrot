/*
 *  When a user submits an article we give them the option to leave their email address so that they can get a
 *  notification when the article gets approved/not approved. This file adds the email address to the list of
 *  email addresses to notify when the article gets approved/not approved.
 */

const logError = require('../utils').logError;
const isEmail = require('validator/lib/isEmail');

function validateParams(articleId, emailAddress) {

  let validationErrors = [];

  if (typeof(articleId) === "number") {
    if (isNaN(articleId) || articleId <= 0) {
      validationErrors.push("article_id invalid");
    }
  } else {
    validationErrors.push("article_id invalid");
  }

  if (typeof(emailAddress) === "string") {
    if (!isEmail(emailAddress)) {
      validationErrors.push("String doesn't represent a valid email address");
    }
  } else {
    validationErrors.push("email_address invalid.");
  }

  if (validationErrors.length) {
    validationErrors = new Error(JSON.stringify(validationErrors));
    validationErrors.clientError = true;
  } else {
    validationErrors = null;
  }

  return validationErrors;
}

function getRouteFunction(db) {


  function setupNotifications(articleId, emailAddress) {

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

    return getApprovalNotificationSubscribersColl(
    ).then(function insertNotificationEntry() {
        return notificationsColl.updateOne(
          {
            _id: articleId,
            emailAddresses: {$nin: [emailAddress]},
          },
          {
            $push: {emailAddresses: emailAddress},
          },
          {
            upsert: true,
            w: 'majority'
          }
        )
      }
    );

    return prom;
  };

  const routeFunction = function (req, res, next) {
    const articleId = parseInt(req.body['article_id'], 10);
    const emailAddress  = req.body['email_address'];

    const validationErrors = validateParams(articleId, emailAddress);
    if (validationErrors !== null) {
      res.status(400).send("invalid parameters");
    } else {
      setupNotifications(articleId, emailAddress).then(function() {
        res.status(200).send("OK");
      }).catch(function(err) {
        const duplicateKeyErrorCode = 11000;
        if (err.code === duplicateKeyErrorCode) { //https://jira.mongodb.org/browse/SERVER-14322
          res.status(200).send("OK");
        } else {
          logError(err);
          next(err);
        }
      });
    }

  };

  return routeFunction;
}

module.exports = getRouteFunction;
