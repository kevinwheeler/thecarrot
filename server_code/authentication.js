const FacebookStrategy = require('passport-facebook').Strategy;
const logError = require('./utils').logError;
const passport = require('passport');

function exportVal(app, db) {

  passport.use(new FacebookStrategy({
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: process.env.DOMAIN + "/auth/facebook/callback"
    },
    function (accessToken, refreshToken, profile, done) {
      db.collection('user', (err, userColl) => {
        if (err !== null) {
          logError(err);
          done(err);
        } else {
          userColl.findOneAndUpdate( // find if exists, create if doesn't
            //TODO create index on fbId
            {fbId: profile.id},
            {
              $set: {
                displayName: profile.displayName,
                fbAccessToken: accessToken,
                fbId: profile.id
              },
              $setOnInsert: {
                userType: 'user'
              }
            },
            {
              upsert: true,
              returnOriginal: false
            },
            function (err, user) {
              if (err !== null) {
                done(err);
              } else {
                done(null, user.value);
              }
            }
          );
        }
      });
    }
  ));

  passport.serializeUser(function (user, done) {
    done(null, user.fbId);
  });

  passport.deserializeUser(function (userId, done) {
    db.collection('user', (err, userColl) => {
      if (err !== null) {
        logError(err);
        done(err);
      } else {
        userColl.find({fbId: userId}).next().then(
          function (user) {
            done(null, user);
          },
          function (err) {
            done(err);
          }
        );
      }
    });
  });

// we will call this to start the GitHub Login process
  app.get('/auth/facebook', passport.authenticate('facebook'));
  app.get('/login', passport.authenticate('facebook'));

  app.get('/auth/facebook/callback', passport.authenticate('facebook', {failureRedirect: '/auth-failure'}), //TODO
    function (req, res) {
      res.redirect('/');
    }
  );
}

module.exports = exportVal;
