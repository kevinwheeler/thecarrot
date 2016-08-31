const getURLSlug = require('../slugutil').getURLSlug;
const logError = require('../utils').logError;
const mongoConcerns = require('../mongoConcerns');
const requester = require('request');
const sendgrid  = require('sendgrid')(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD);
const updateSummaries = require('../updateSummaries');
const validations = require('../../modern-backbone-starterkit/src/isomorphic/articleValidations.js');

function getRouteFunction(db) {

  const notifyAdminViaEmail = function(articleURLSlug) {
    // TODO enable this for production
    //sendgrid.send({
    //    to: "kevinwheeler2@yahoo.com",
    //    from: 'noreply@' + process.env.PRODUCTION_DOMAIN_NAME,
    //    subject: process.env.DOMAIN_NAME + ' article in need of approval',
    //    html: `article needs approval. <a href="${process.env.DOMAIN}/admin/article/${articleURLSlug}">view here.</a>`
    //  }, function (err, json) {
    //    if (err) {
    //      logError(err);
    //    }
    //  }
    //);
  }


  const routeFunction = function (req, res, next) {

    const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET;

    const sess = req.session;
    // TODO does this assume people only upload one picture, etc?
    // probably not, we probably re-set this session variable every time they upload a picture / hit signS3 route
    const articleId = sess.articleId;
    const imageSlug = sess.imageSlug;
    const headline = req.body.headline;
    const subline = req.body.subline;
    const validationErrors = validations.validateEverything(headline, subline);
    if (validationErrors) { //TODO this could be better, instead of just returning the first error.
      next(validationErrors[0]);
    }

    const insertArticleAndRedirect = function() {
      // id is the id to use for the new record we are inserting
      db.collection('article', (err, collection) => {
        if (err !== null) {
          next(err);
        } else {
          let imageURL;
          if (process.env.NODE_ENV === 'production') {
            imageURL = `https://createaheadlineimages.s3.amazonaws.com/${imageSlug}`;
          } else {
            imageURL = `https://kevinwheeler-thecarrotimageslocal.s3.amazonaws.com/${imageSlug}`;
          }
          const articleURLSlug = getURLSlug(articleId, headline);
          const doc = {
            _id: articleId,
            approval: 'pending',
            articleURLSlug: articleURLSlug,
            dateCreated: new Date(),
            headline: headline,
            imageURL: imageURL,
            sidOfAuthor: req.sessionID,
            subline: subline
          };
          if (req.user) { // TODO make sure not posting anonymously
            doc.authorId = req.user.fbId;
          }
          collection.insert(doc, {
              w: "majority",
              wtimeout: mongoConcerns.WTIMEOUT
            },
            (error, result) => {
              if (error !== null) {
                next(error);
              } else {
                // Pretend the article has been viewed once, so that it will be inserted into the most popular
                // by day/week/month/year lists. Since views don't get counted until the article has been approved,
                // the redirect won't add a view, so we add one manually here.
                updateSummaries.incrementViews(db, articleId);
                notifyAdminViaEmail(articleURLSlug);
                res.redirect('/article/' + articleURLSlug);
              }
            });
        }
      });
    }

    if (req.body['kmw-bypass-recaptcha-secret'] === process.env.BYPASS_RECAPTCHA_SECRET) {
      insertArticleAndRedirect();
    } else {
      const recaptchaVerifyJSON = {secret: RECAPTCHA_SECRET, response: req.body['g-recaptcha-response']};

      //id = the id to use for the new record we are inserting.
      requester.post({url:'https://www.google.com/recaptcha/api/siteverify', form: recaptchaVerifyJSON},
        function(err, httpResponse, body) {
          if (err) {
            logError(err);
            res.status(500).send('Something went wrong! Please try again.');
          }
          else {
            var bodyJSON = JSON.parse(body);
            if (bodyJSON.success) {
              // Captcha successful.
              insertArticleAndRedirect();
            }
            else {
              // Captcha failed.
              res.redirect('/upload?captcha=fail'); //TODO
            }
          }
        });
    }
  };

  return routeFunction;
}

module.exports = getRouteFunction;
