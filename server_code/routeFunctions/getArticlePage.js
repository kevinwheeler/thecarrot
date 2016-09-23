const logError = require('../utils').logError;
const send404 = require('../utils').send404;
const updateSummaries = require('../updateSummaries');
const publicArticleFieldsProjection = require('../utils').publicArticleFieldsProjection;

function getRouteFunction(db) {
   return function (req, res, next) {
    const adminPage = !!req.params.admin;
    let articleSlug = req.params.articleSlug;
    let articleId = parseInt(articleSlug, 10); // extract leading integers
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
              if (adminPage || article.approval === 'approved') {
                //updateSummaries.incrementViews(db, articleId); // already happens in api call that gets the article data.
                let title = article.headline;
                let description;
                if (article.subline.length) {
                  description = article.subline;
                } else {
                  description = article.headline;
                }
                res.render('pages/article', {
                  article: article,
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
                  fbAppId: process.env.FACEBOOK_APP_ID,
                  imageBaseUrl: process.env.IMAGE_BASE_URL
                });
              }
            }
          }
        });
      }
    });
  };
}

module.exports = getRouteFunction;
