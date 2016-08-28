const compression = require('compression');
const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

function exportVal(app) {
  const NODE_ENV = process.env.NODE_ENV;
  if (NODE_ENV !== 'production' && NODE_ENV !== 'development') {
    throw "NODE_ENV environment variable not set.";
  }

  // from http://stackoverflow.com/questions/7185074/heroku-nodejs-http-to-https-ssl-forced-redirect
  var forceSsl = function (req, res, next) {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, ['https://', req.get('Host'), req.url].join(''));
    }
    return next();
  };

  if (NODE_ENV === 'production') {
    app.use(forceSsl);
  }

  app.enable('trust proxy'); // Needed for rate limiter.
  app.use(compression());
  app.use(session({
    secret: process.env.SESSION_SECRET,
    store: new MongoStore({
      url: process.env.MONGODB_URI
    }),
  }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.set('port', (process.env.PORT || 5000));


}

module.exports = exportVal;
