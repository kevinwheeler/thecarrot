const escapeArticle = require('../../modern-backbone-starterkit/src/isomorphic/utils').escapeArticle;
const escapeUserInfo = require('../../modern-backbone-starterkit/src/isomorphic/utils').escapeUserInfo;
const joinArticleWithImage = require('../utils').joinArticleWithImage;
const userInfo = require('./getUserInfoJSON');
const logError = require('../utils').logError;
const publicArticleFieldsProjection = require('../utils').publicArticleFieldsProjection;
const send404 = require('../utils').send404;
const updateSummaries = require('../updateSummaries');

function getRouteFunction(db) {
   return function (req, res, next) {
    const adminPage = !!req.params.admin;
    let articleSlug = req.params.articleSlug;
    let articleId = parseInt(articleSlug, 10); // extract leading integers
     let currentUserPromise;
     if (req.user) {
       currentUserPromise = userInfo.getUserInfoJSON(db, req.user.fbId);
     } else {
       currentUserPromise = Promise.resolve(userInfo.notLoggedInUserInfoJSON());
     }

    db.collection('article', (err, collection) => {
      if (err !== null) {
        logError(err);
        next(err);
      } else {
        collection.find({'_id': articleId}).project(publicArticleFieldsProjection).next(function (err, article) {
          if (err !== null) {
            logError(err);
            next(err);
          } else {
            if (article === null) {
              send404(res);
            } else if (articleSlug !== article.articleURLSlug) {
              // Even if the articleId corresponds to a valid article,
              // send a 404 unless the rest of the slug matches as well.
              // This will avoid duplicate content SEO issues.
              send404(res);
            } else {
                joinArticleWithImage(db, article).then(function() {
                  return currentUserPromise;
                }).then(function(currentUser) {
                  escapeArticle(article);
                  escapeUserInfo(currentUser);
                  const articleString = JSON.stringify(article);
                  if (adminPage || article.approval === 'approved') {
                    let title = article.headline;
                    let description;
                    if (article.subline.length) {
                      description = article.subline;
                    } else {
                      description = article.headline;
                    }

                    res.render('pages/article', {
                      article: article,
                      articleString: articleString,
                      currentUser: JSON.stringify(currentUser),
                      description: description,
                      fbAppId: process.env.FACEBOOK_APP_ID,
                      imageBaseUrl: process.env.IMAGE_BASE_URL,
                      imageURL: process.env.IMAGE_BASE_URL + article.imageSlug,
                      title: title,
                      url: req.protocol + '://' + req.get('host') + req.originalUrl, //http://stackoverflow.com/a/10185427
                     articleApproval: article.approval
                   });
                  } else {
                    res.render('pages/article', {
                      articleApproval: article.approval,
                      articleString: articleString,
                      currentUser: JSON.stringify(currentUser),
                      fbAppId: process.env.FACEBOOK_APP_ID,
                      imageBaseUrl: process.env.IMAGE_BASE_URL
                    });
                 }
                }).catch(function(err) {
                  next(err);
                });
            }
          }
        });
      }
    });
  };
}

module.exports = getRouteFunction;
