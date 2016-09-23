const getNextId = require('../utils').getNextId;
const logError = require('../utils').logError;
const requester = require('request');
const wilson = require('wilson-score')

function getRouteFunction(db) {
  let articleColl;
  let votesColl;

  // Returns an error object or null. If error object isn't null, will have the property
  // clientError set to true so that we can send a 4xx response instead of a 5xx response.
  function validateParams(articleId, voteType) {
    let validationErrors = [];
    if (typeof(articleId) !== "number" || Number.isNaN(articleId) || articleId <= 0) {
      validationErrors.push("articleId invalid");
    }

    if (voteType !== 'up' && voteType !== 'down') {
      validationErrors.push("voteType invalid.");
    }

    if (validationErrors.length) {
      validationErrors = new Error(JSON.stringify(validationErrors));
      validationErrors.clientError = true;
    } else {
      validationErrors = null;
    }
    return validationErrors;
  }

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

  function getVotesColl() {
    const prom = new Promise(function(resolve,reject) {
      db.collection('votes', (err, coll) => {
        if (err !== null) {
          reject(err);
        } else {
          votesColl = coll;
          resolve();
        }
      });
    })
    return prom;
  }

  function addVote(articleId, ipAddr, voteType) {
    const prom1 = votesColl.insertOne({
      articleId: articleId,
      ipAddr: ipAddr
    });

    const incDoc = {numTotalVotes: 1};
    if (voteType === 'up') {
      incDoc.numUpvotes = 1;
    } else {
      incDoc.numDownvotes = 1;
    }
    const prom2 = articleColl.updateOne(
      {
        _id: articleId
      },
      {
        $inc: incDoc
      }
    );
    return Promise.all([prom1, prom2]);
  }

  function updateUpvoteScore(articleId) {
    articleColl.find({
      _id: articleId
    }).limit(1).next().then(function(result) {
      articleColl.updateOne({
          _id: articleId
        },
        {
          $set: {upvoteScore: wilson(result.numUpvotes, result.numTotalVotes)}
        }
      );
    })
  }

  const routeFunction = function (req, res, next) {
    const articleId = parseInt(req.body['article_id'], 10);
    const voteType = req.body['vote_type'];
    let validationErrors = validateParams(articleId, voteType);
    if (validationErrors !== null) {
      res.status(400).send("Something went wrong.");
      return;
    }

    getArticleColl().then(
      getVotesColl()
    ).then(function checkIfAlreadyVoted() {
      // there is atomicity concerns here between checking if the user has already voted
      // on this article and then adding a new vote if not. We kinda fudge our way through this by now
      // by rate limiting (by ip) requests to postVote to 1 request per x seconds, so the user cant
      // vote too many times in this small window of time between checking if a vote exists and adding a vote.
      return votesColl.find({
        articleId: articleId,
        ipAddr: req.ip
      }).limit(1).next();
    }).then(function(result) {
      if (!result) {
        return addVote(articleId, req.ip, voteType).then(updateUpvoteScore.bind(null, articleId));
      }
    }).then(function() {
      res.send("OK");
    }).catch(function(err) {
      next(err);
    });
  }

  return routeFunction;
}

module.exports = getRouteFunction;
