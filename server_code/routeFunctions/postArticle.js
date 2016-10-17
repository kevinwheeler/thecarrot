const _ = require('lodash');
const getNextId = require('../utils').getNextId;
const getURLSlug = require('../slugutil').getURLSlug;
const logError = require('../utils').logError;
const requester = require('request');
const sendgrid  = require('sendgrid')(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD);
const updateSummaries = require('../updateSummaries');
const validations = require('../../modern-backbone-starterkit/src/isomorphic/articleValidations.js');
const articleRoute = require('../../modern-backbone-starterkit/src/isomorphic/routes.js').articleRoute;

function getRouteFunction(db) {

  const notifyAdminViaEmail = function(articleURLSlug) {
    // TODO enable this for production
    //sendgrid.send({
    //    to: "kevinwheeler2@yahoo.com",
    //    from: 'noreply@' + process.env.PRODUCTION_DOMAIN_NAME,
    //    subject: process.env.DOMAIN_NAME + ' article in need of approval',
    //    html: `article needs approval. <a href="${process.env.DOMAIN}/admin/article/${articleURLSlug}">view here.</a>` //TODO change prefix from article to headline.
    //  }, function (err, json) {
    //    if (err) {
    //      logError(err);
    //    }
    //  }
    //);
  }

  let imageColl;
  function getImageColl() {
    const prom = new Promise(function(resolve, reject) {
      db.collection('image', {}, (err, coll) => {
        if (err !== null) {
          reject(err);
        } else {
          imageColl = coll;
          resolve();
        }
      });
    })
    return prom;
  }

  let articleColl;
  function getArticleColl() {
    const prom = new Promise(function(resolve,reject) {
      db.collection('article', {}, (err, coll) => {
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

  const additionalValidations = function(agreedToTerms, imageSelectionMethod, imageId) {
    let validationErrors = [];
    if (agreedToTerms === undefined) {
      validationErrors.push("Must agree to terms.");
    }

    if (imageSelectionMethod !== 'uploadNew' && imageSelectionMethod !== 'previouslyUploaded') {
      validationErrors.push("imageSelectionMethod invalid.");
    }

    if (typeof(imageId) !== "number") {
      validationErrors.push("Image id is not a number");
      return Promise.resolve(validationErrors);
    } else {
      return getImageColl().then(function() {
        return imageColl.find({
          _id: imageId
        }).limit(1).next().then(function(image) {
          if (image === null) {
            validationErrors.push("Image not found in image collection.");
          }
        });
      }).then(function() {
        return Promise.resolve(validationErrors);
      });
    }
  };


  const routeFunction = function (req, res, next) {

    const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET;

    const sess = req.session;
    // TODO does this assume people only upload one picture, etc?
    // probably not, we probably re-set this session variable every time they upload a picture / hit signS3 route
    //const articleId = sess.articleId;
    const headline = req.body.headline;
    const subline = req.body.subline;
    const category = req.body.category;
    const agreedToTerms = req.body.agreed_to_terms;
    const imageSelectionMethod = req.body.image_selection_method;
    let imageId;
    if (imageSelectionMethod === 'uploadNew') {
      imageId = sess.imageId;
    } else {
      imageId = parseInt(req.body.image_id, 10);
    }

    //set model fields include re-usable image checkbox
    //
    //if selectionmethod = uploadnew, make sure re-usable is true or false

    // do we want to make sure the image exists in either case whether they are uploading a new image or selecting an image.
    // if they are uploading a new image we don't get the image id as a paremter, we get it from the session, so there is
    // the possiblity that the image id should always be correct, depending on how we set it up.

    const validationErrors = validations.validateEverything(headline, subline, category);
    additionalValidations(agreedToTerms, imageSelectionMethod, imageId).then(function(additionalValidationErrors) {
      if (validationErrors) {
        additionalValidationErrors.concat(validationErrors);
      }

      if (additionalValidationErrors.length) {
        res.status(400).send("Invalid parameters.");
        //next(validationErrors.join(", "));
      } else {

        const insertArticleAndRedirect = function() {
          getArticleColl(
          ).then(getNextId.bind(null, db, "articleId")
          ).then(function(articleId) {
            const articleURLSlug = getURLSlug(articleId, headline);
            const doc = {
              _id: articleId,
              approval: 'pending',
              articleURLSlug: articleURLSlug,
              category: category,
              dateCreated: new Date(),
              flaginess: 0,
              headline: headline,
              imageId: imageId,
              numAuthenticatedFlags: 0,
              numUnauthenticatedFlags: 0,
              numDownvotes: 0,
              numUpvotes: 0,
              numTotalVotes: 0,
              sidOfAuthor: req.sessionID,
              staffPick: false,
              subline: subline,
              upvoteScore: 0
            };
            const initialSummaryAttributes = updateSummaries.getInitialSummaryAttributes();
            _.merge(doc, initialSummaryAttributes);

            if (req.user) { // TODO make sure not posting anonymously
              doc.authorId = req.user.fbId;
            }
            articleColl.insert(doc, {
                w: "majority",
              },
              (err, result) => {
                if (err !== null) {
                  logError(err);
                  next(err);
                } else {
                  notifyAdminViaEmail(articleURLSlug);
                  res.redirect('/' + articleRoute.routePrefix + '/' + articleURLSlug);
                }
              });
          }).catch(function(err) {
            logError(err);
            next(err);
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
      }
    }).catch(function(err) {
      logError(err);
      next(err);
    });
  };

  return routeFunction;
}

module.exports = getRouteFunction;
