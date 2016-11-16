const FacebookStrategy = require('passport-facebook').Strategy;
const logError = require('./utils').logError;
const passport = require('passport');

function exportVal(app, db) {

  passport.use(new FacebookStrategy({
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      //callbackURL: process.env.DOMAIN + "/auth/facebook/callback"
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
                logError(err);
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

  // Next four routes use the technique found here:
  // http://stackoverflow.com/questions/15513427/can-the-callback-for-facebook-pasport-be-dynamically-constructed
  app.get('/login', function(request, response, next) {
    passport.authenticate('facebook', {
      callbackURL: process.env.DOMAIN + "/auth/facebook/callback",
      scope: ['pages_show_list']
    })(request, response, next);
  });

  app.get('/auth/facebook/callback', function(request, response, next) {
    passport.authenticate(
      'facebook',
      {
        callbackURL: process.env.DOMAIN + "/auth/facebook/callback",
        successRedirect:"/",
        failureRedirect:"/auth-failure" //TODO
      }
    ) (request,response,next);
  });


  app.get('/upload-login', function(request, response, next) {
    passport.authenticate('facebook', {
      callbackURL: process.env.DOMAIN + "/auth/facebook/upload-callback",
      scope: ['pages_show_list']
    })(request, response, next);
  });

  app.get('/auth/facebook/upload-callback', function(request, response, next) {
    passport.authenticate(
      'facebook',
      {
        callbackURL: process.env.DOMAIN + "/auth/facebook/upload-callback",
        successRedirect:"/after-upload-auth",
        failureRedirect:"/auth-failure" //TODO
      }
    ) (request,response,next);
  });
}

module.exports = exportVal;
