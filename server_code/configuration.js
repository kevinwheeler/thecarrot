const _ = require('lodash');
const compression = require('compression');
const helmet = require('helmet');
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

  const sessionOptions = {
    domain: process.env.DOMAIN_NAME,
    httpOnly: true,
    name: 'kmwSid',
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET,
    store: new MongoStore({
      url: process.env.MONGODB_URI
    }),
  };

  const extraOptionsForProduction = {
    cookie : {
      secure : true,
      maxAge: 2592000000 // 1 month
    }
  };

  if (NODE_ENV === 'production') {
    _.merge(sessionOptions, extraOptionsForProduction);
  }

  app.enable('trust proxy'); // Needed for rate limiter. Although technically we should probably only trust the 1st few proxies.
  app.use(compression());
  app.use(helmet({
    noCache: false
  }));
  app.use(session(sessionOptions));
  app.use(passport.initialize());
  app.use(passport.session());
  app.set('port', (process.env.PORT || 5000));


}

module.exports = exportVal;
