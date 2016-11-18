const _ = require('lodash');
const joinArticleWithImage = require('./utils').joinArticleWithImage;
const logError = require('./utils').logError;
const publicArticleFields = require('./utils').publicArticleFields;
const updateSummaries = require('./updateSummaries');

let articleColl;
function getArticleColl(db) {
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

// If one person views the same article 1000 times, we don't want to increment the number of views that this article
// has each time. So this function determines whether or not we actually want to increment the number of views.
// For now, we just check if the user's IP address and we will only let him increment the view count once
// every 24 hours.
function getShouldIncrementViews(db, articleId, ipAddress) {
  const prom = new Promise(function(resolve, reject) {
    db.collection('views', (err, viewsColl) => {
      if (err !== null) {
        reject(err);
      } else {
        const threshold = new Date(Date.now() - 1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/ * 24 /*day*/);
        viewsColl.find({
          articleId: articleId,
          ipAddress: ipAddress,
          timestamp: {$gt: threshold}
        }).limit(1).next().then(function(result) {
          if (result) {
            resolve(false);
          } else {
            resolve(true);
          }
        }).catch(function(err) {
          reject(err);
        });
      }
    });
  });
  return prom;
}

/*
 *  Log that the article was viewed by this ip address so that we don't
 *  count any more views from this ip address for a while.
 */
function updateShouldIncrementViews(db, articleId, ipAddress) {
  db.collection('views', (err, viewsColl) => {
    if (err !== null) {
      logError(err);
    } else {
      viewsColl.insertOne({
        articleId: articleId,
        ipAddress: ipAddress,
        timestamp: new Date()
      }).catch(function(err) {
        logError(err);
      });
    }
  });
}

function getArticle(db, articleId, userFbId, userSid, userIp) {
  const prom = new Promise(function(resolve,reject) {

    getArticleColl(db
    ).then(function getArticle() {
      return articleColl.find({'_id': articleId}).next();
    }).then(function(article) {
      if (article === null) {
        reject("article not found");
      } else {
        // Fire this off on the side.
        getShouldIncrementViews(db, articleId, userIp).then(function(shouldIncrement) {
          if (shouldIncrement) {
            updateSummaries.incrementCounts(db, 'views', articleId);
            updateShouldIncrementViews(db, articleId, userIp);
          }
        }).catch(function(err) {
          logError(err);
        });

        if ((userFbId === article.authorId || userSid === article.sidOfAuthor)) {
          article.viewerIsAuthor = true;
        } else {
          article.viewerIsAuthor = false;
        }

        joinArticleWithImage(db, article).then(function() {
          // return article except with private fields omitted.
          const args = [article].concat(publicArticleFields);
          resolve(_.pick.apply(null, args));
        }).catch(function(err) {
          reject(err);
        });
      }
    }).catch(function(err) {
      reject(err);
    });
  });
  return prom;
}

module.exports = getArticle;

