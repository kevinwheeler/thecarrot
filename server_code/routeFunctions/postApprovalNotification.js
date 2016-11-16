/*
 *  When a user submits an article we give them the option to leave their email address so that they can get a
 *  notification when the article gets approved/not approved. This file adds the email address to the list of
 *  email addresses to notify when the article gets approved/not approved.
 */


const logError = require('../utils').logError;
const isEmail = require('validator/lib/isEmail');

function getRouteFunction(db) {

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
    });
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
    });
    return prom;
  }

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


    return getArticleColl().then(function() {
      return articleColl.find({
        _id: articleId
      }).limit(1).next().then(function(article) {
        if (article === null) {
          validationErrors.push("Article Not Found.");
        }

        if (validationErrors.length) {
          const errorObject = new Error(JSON.stringify(validationErrors));
          errorObject.clientError = true;
          return Promise.reject(errorObject);
        } else {
          return null;
        }
      });
    });

    return validationErrors;
  }


  function setupNotifications(articleId, emailAddress) {

    return validateParams(articleId, emailAddress
    ).then(getApprovalNotificationSubscribersColl
    ).then(function insertNotificationEntry() {
      return notificationsColl.updateOne(
        {
          _id: articleId,
          emailAddresses: {$nin: [emailAddress]},
          $where: "this.emailAddresses.length < 10"
        },
        {
          $push: {emailAddresses: emailAddress},
        },
        {
          upsert: true,
        }
      )
    }).catch(function(err) {
      const duplicateKeyErrorCode = 11000;
      if (err.code === duplicateKeyErrorCode) {
        //Tried to upsert the same document. The user probably entered the same email twice,
        //or there are already 10 email addresses on file to be notified. Swallow this error.
        return null;
      } else {
        return Promise.reject(err);
      }
    }).then(getArticleColl
    ).then(function() {
      return articleColl.find({
        _id: articleId
      }).limit(1).next().then(function(article) {
        if (article && article.approval !== 'pending') {
          const errorObject = new Error("Article isn't pending approval.");
          errorObject.notPendingApproval = true;
          return Promise.reject(errorObject);
        } else {
          return Promise.resolve();
        }
      });
    });
  };

  const routeFunction = function (req, res, next) {
    const articleId = parseInt(req.body['article_id'], 10);
    const emailAddress  = req.body['email_address'];

    setupNotifications(articleId, emailAddress).then(function() {
      res.send();
    }).catch(function(err) {
       if (err.notPendingApproval) {
        res.status(418).send();
      }  else if (err.clientError) {
        res.status(400).send();
      } else {
        logError(err);
        next(err);
      }
    });
  };

  return routeFunction;
}

module.exports = getRouteFunction;
