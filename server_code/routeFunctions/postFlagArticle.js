const logError = require('../utils').logError;
const requester = require('request');

function getRouteFunction(db) {

  // Returns an error object or null. If error object isn't null, will have the property
  // clientError set to true so that we can send a 4xx response instead of a 5xx response.
  function validateParams(articleId, captchaAuthenticated, reason) {
    let validationErrors = [];
    if (typeof(articleId) !== "number" || Number.isNaN(articleId) || articleId <= 0) {
      validationErrors.push("articleId invalid");
    }

    if (typeof(captchaAuthenticated) !== "boolean") {
      validationErrors.push("captchaAuthenticated invalid");
    }

    if (typeof(reason) !== 'string') {
      validationErrors.push("reason invalid");
    }


    if (validationErrors.length) {
      validationErrors = new Error(JSON.stringify(validationErrors));
      validationErrors.clientError = true;
    } else {
      validationErrors = null;
    }
    return validationErrors;
  }

  function insertFlagEntry(articleId, captchaAuthenticated, reason) {
    let flagsCollName;
    if (captchaAuthenticated) {
      flagsCollName = 'authenticated_flags';
    } else {
      flagsCollName = 'unauthenticated_flags';
    }
    db.collection(flagsCollName, (err, flagsColl) => {
      if (err !== null) {
        return Promise.reject(err);
      } else {
        return flagsColl.insertOne({
          articleId: articleId,
          reason: reason
        });
      }
    });
  }

  function incrementFlagCount(articleId, captchaAuthenticated) {
    db.collection('article', (err, articleColl) => {
      if (err !== null) {
        return Promise.reject(err);
      } else {
        let incDoc;
        if (captchaAuthenticated) {
          incDoc = {authenticatedFlags : 1}
        } else {
          incDoc = {unauthenticatedFlags : 1}
        }
        return articleColl.updateOne(
          {
            _id: articleId,
          },
          {
            $inc: incDoc
          }
        );
      }
    });
  }

  function doEverything(res, articleId, captchaAuthenticated, reason) {
    const prom1 = insertFlagEntry(articleId, captchaAuthenticated, reason);
    const prom2 = incrementFlagCount(articleId, captchaAuthenticated);
    Promise.all([prom1, prom2]).then(
      function() {
        res.status(200).send('OK');
      },
      function() {
        res.status(500).send('Something went wrong.');
      }
    )

  }

  const routeFunction = function (req, res, next) {
    const articleId = parseInt(req.body['article-id'], 10);
    let captchaAuthenticated = req.body['captcha-authenticated'];
    const reason = req.body['reason-for-flagging'];

    const grecaptchaResponse = req.body['g-recaptcha-response'];

    if (captchaAuthenticated === 'true') {
      captchaAuthenticated = true;
    } else if (captchaAuthenticated === 'false') {
      captchaAuthenticated = false;
    }

    let validationErrors = validateParams(articleId, captchaAuthenticated, reason);
    if (validationErrors !== null) {
      res.status(400).send("Something went wrong.");
      return;
    }


    const recaptchaVerifyJSON = {secret: process.env.RECAPTCHA_SECRET, response: grecaptchaResponse};

    if (captchaAuthenticated) {
      requester.post(
        {url: 'https://www.google.com/recaptcha/api/siteverify', form: recaptchaVerifyJSON},
        function (err, httpResponse, body) {
          if (err) {
            logError(err);
            res.status(500).send('Something went wrong.');
          }
          else {
            var bodyJSON = JSON.parse(body);
            if (bodyJSON.success) {
              doEverything(res, articleId, captchaAuthenticated, reason);
            } else {
              // Captcha failed.
              res.status(400).send('Captcha failed.');
            }
          }
        }
      );
    } else {
      doEverything(res, articleId, captchaAuthenticated, reason);
    }
  }

  return routeFunction;
}

module.exports = getRouteFunction;
