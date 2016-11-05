const logError = require('../utils').logError;

let userColl;
function getUserColl(db) {
  const prom = new Promise(function(resolve,reject) {
    db.collection('user', {}, (err, coll) => {
      if (err !== null) {
        reject(err);
      } else {
        userColl = coll;
        resolve();
      }
    });
  })
  return prom;
}

function validateParams(userId) {
  let validationErrors = [];

  if (typeof(userId) !== "string" || userId.length === 0) {
    validationErrors.push("userId invalid");
  }

  if (validationErrors.length) {
    validationErrors = new Error(JSON.stringify(validationErrors));
    validationErrors.clientError = true;
  } else {
    validationErrors = null;
  }
  return validationErrors;
}

const notLoggedInUserInfoJSON = function() {
  return {};
};

const getUserInfoJSON = function(db, userId, includeAccessToken) {
  const prom = new Promise(function(resolve, reject) {
    getUserColl(db).then(function() {
      let validationErrors = validateParams(userId);
      if (validationErrors !== null) {
        return Promise.reject(validationErrors);
      } else {
        const projection = {
          _id: false,
          displayName: true,
          fbId: true,
          userType: true
        };
        if (includeAccessToken) {
          projection.fbAccessToken = true;
        }
        return userColl.find({fbId: userId}).project(projection).next();
      }
    }).then(
      function (user) {
        resolve(user);
      }
    ).catch(function(err) {
      reject(err);
    });
  });
  return prom;
}

function getRouteFunction(db) {
  const routeFunction = function (req, res, next) {
      //req.user, get parameters userId
      let userToGet = req.query.user_id;
      let userIdToGet;
      let includeAccessToken = false;
      if (userToGet === 'currentUser') {
        if (req.user) {
          includeAccessToken = true;
          userIdToGet = req.user.fbId;
        } else {
          res.json(notLoggedInUserInfoJSON());
          return;
        }
      } else {
        userIdToGet = userToGet;
      }
      getUserInfoJSON(db, userIdToGet, includeAccessToken).then(function(user) {
        res.json(user);
      }).catch(function(err) {
        if (err.clientError) {
          res.status(400).send("Invalid parameters.");
        } else {
          logError(err);
          next(err);
        }
      });
  };

  return routeFunction;
}

module.exports = {
  getRouteFunction: getRouteFunction,
  getUserInfoJSON: getUserInfoJSON,
  notLoggedInUserInfoJSON: notLoggedInUserInfoJSON
};

