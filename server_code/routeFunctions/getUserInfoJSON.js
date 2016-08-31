const getNextId = require('../utils').getNextId;
const logError = require('../utils').logError;
const mongoConcerns = require('../mongoConcerns');
const updateSummaries = require('../updateSummaries');

function getRouteFunction(db) {

  const routeFunction = function (req, res, next) {
      //req.user, get parameters userId
      let userToGet = req.query.user_id;
      let userIdToGet;
      if (userToGet === 'currentUser') {
        if (req.user) {
          userIdToGet = req.user.fbId;
        } else {
          res.json({}); // wanted current user, but current user isn't logged in.
          return;
        }
      } else {
        userIdToGet = userToGet;
      }
      db.collection('user', (err, userColl) => {
        if (err !== null) {
          logError(err);
          next(err);
        } else {
          userColl.find({fbId: userIdToGet}).project({
            _id: false,
            displayName: true,
            fbId: true,
            userType: true
          }).next().then(
            function (user) {
              res.json(user);
            },
            function (err) {
              logError(err)
              next(err);
            }
          );
        }
      });
  };

  return routeFunction;
}

module.exports = getRouteFunction;
