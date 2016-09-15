const getNextId = require('../utils').getNextId;
const logError = require('../utils').logError;
const requester = require('request');
const wilson = require('wilson-score')

function getRouteFunction(db) {
  let articleColl;

  // Returns an error object or null. If error object isn't null, will have the property
  // clientError set to true so that we can send a 4xx response instead of a 5xx response.
  function validateParams(articleId) {
    let validationErrors = [];

    if (typeof(articleId) !== "number" || Number.isNaN(articleId) || articleId <= 0) {
      validationErrors.push("articleId invalid");
    }

    if (validationErrors.length) {
      validationErrors = new Error(JSON.stringify(validationErrors));
      validationErrors.clientError = true;
    } else {
      validationErrors = null;
    }
    return validationErrors;
  }

  const routeFunction = function (req, res, next) {
    const articleId = parseInt(req.body['article-id'], 10);

    let validationErrors = validateParams(articleId);
    if (validationErrors !== null) {
      res.status(400).send("Something went wrong.");
      return;
    } else {
      res.status(200).send("kmw OK");
    }
  }

  return routeFunction;
}

module.exports = getRouteFunction;
