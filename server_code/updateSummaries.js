/*
 * Related files: migrations/2createSummaryIndexes.js, updatePopularities.js
 *
 */
const publicArticleFieldsProjection = require('./utils').publicArticleFieldsProjection;
const timebucket = require('timebucket');

const duplicateKeyErrorCode = 11000;

function handleError(err) {
  if (err !== null) {
    console.error(err.stack || err);
    console.trace("Caught from:");
    // If error occurs and the fact that an article was viewed doesn't get accounted for, it's really not the
    // end of the world. Just proceed as normal and don't crash.
  }
}

function updateTimeBuckets(db, articleId, summaryName) {
  let timeIntervalSize;
  if (summaryName === 'daily') {
    timeIntervalSize = '10m';
  } else if (summaryName === 'weekly') {
    timeIntervalSize = 'h';
  } else if (summaryName === 'monthly') {
    timeIntervalSize = '5h';
  } else if (summaryName === 'yearly') {
    timeIntervalSize = '2d';
  }

  const collectionName = 'time_buckets_for_' + summaryName;
  
  db.collection(collectionName, (err, tbCol) => {
    if (err !== null) {
      handleError(err);
    } else {
      const curDate = new Date();
      const tBucket = timebucket(curDate).resize(timeIntervalSize).toDate();
      tbCol.updateOne(
        {
          articleId: articleId,
          timeBucket: tBucket
        },
        {
          $inc: {views: 1}
        },
        {
          upsert: true
        }
      ).then(function(){}, function(err) {
        if (err.code !== duplicateKeyErrorCode) { //https://jira.mongodb.org/browse/SERVER-14322
          handleError(err);
        }
      });
    }
  });
}

function incrementAlltimeViews(db, articleId) {
  db.collection('article', (err, articleColl) => {
    if (err !== null) {
      handleError(err);
    } else {
      articleColl.updateOne(
        {
          _id: articleId,
        },
        {
          $inc: {all_time_views: 1},
        }
      ).then(function (result) {}, function (err) {
        handleError(err);
      });
    }
  });
}

function getInitialSummaryAttributes() {
  const retVal = {};
  const intervals = ['daily', 'weekly', 'monthly', 'yearly'];

  for (let i=0; i < intervals.length; i++) {
    const keyName = intervals[i] + '_views';
    retVal[keyName] = {
      lastUpdated: new Date(),
      lockedUntil: new Date(),
      views: 1
    }
  }

  retVal.all_time_views = 1;
  return retVal
}


function validateMostViewedArticlesParams(dontInclude, howMany, timeInterval, skipAheadAmount, category, staffPicksOnly) {
  const MAX_ARTICLES_PER_REQUEST = 50;
  const MAX_SKIP_AHEAD_AMOUNT = 1000;

  let validationErrors = [];

  if (typeof(dontInclude) !== "object") {
    validationErrors.push("dontInclude invalid");
  }

  if (typeof(howMany) !== "number" || howMany < 1 || howMany > MAX_ARTICLES_PER_REQUEST) {
    validationErrors.push("howMany invalid");
  }

  if (timeInterval !== 'daily' && timeInterval !== 'weekly' && timeInterval !== 'monthly'
    && timeInterval !== 'yearly' && timeInterval !== 'all_time') {
    validationErrors.push("invalid time interval");
  }

  if (typeof(skipAheadAmount) !== "number" || Number.isNaN(skipAheadAmount) || skipAheadAmount < 0 || skipAheadAmount > MAX_SKIP_AHEAD_AMOUNT) {
    validationErrors.push("skipAheadAmount invalid");
  }

  if (category !== "politics" && category !== "spirituality" && category !== "all") {
    validationErrors.push("category invalid");
  }

  if (typeof(staffPicksOnly) !== "boolean") {
    validationErrors.push("staffPicksOnly invalid");
  }

  if (staffPicksOnly && category !== "all") {
    // we might change this later, but for now we aren't implementing the ability to request staff picks from a
    // particular category.
    validationErrors.push("Invalid combo of staff_picks_only and category");
  }

  if (validationErrors.length) {
    validationErrors = new Error(JSON.stringify(validationErrors));
    validationErrors.clientError = true;
  } else {
    validationErrors = null;
  }

  return validationErrors;
}

// Returns an error object or null. If a parameter didn't pass validation, the error object
// will have the property clientError set to true so that the caller can send an http 4xx response instead of a 5xx response.
function getMostViewedArticlesJSON(db, dontInclude, howMany, timeInterval, skipAheadAmount, category, staffPicksOnly) {
  let validationErrors = validateMostViewedArticlesParams(dontInclude, howMany, timeInterval, skipAheadAmount, category, staffPicksOnly);
  let prom = new Promise(function(resolve, reject) {
    if (validationErrors !== null) {
      reject(validationErrors)
    } else {
      db.collection('article', (err, articleColl) => {
        if (err !== null) {
          reject(err);
        } else {
          let views = timeInterval + '_views';
          if (timeInterval !== 'all_time') {
            views += '.views';
          }
          const filter = {
            _id: {
              $nin: dontInclude
            },
            approval: 'approved'
          };
          if (category !== 'all') {
            filter.category = category;
          }
          if (staffPicksOnly === true) {
            filter.staffPick = true;
          }
          articleColl.find(filter).project(publicArticleFieldsProjection).sort([[views, -1]]).skip(skipAheadAmount).limit(howMany).toArray(
            function (err, articles) {
              if (err !== null) {
                reject(err);
              } else {
                resolve(articles);
              }
            }
          );
        }
      });
    }
  });
  return prom;
}

// Basically, when an article is viewed, this method will be called so that
// We can do whatever logic we need to do so that we can have a list of 
// most viewed articles by day/week/month/year
// This just increments views and whatnot, the process of actually adding up all the
// time buckets to know how many views an article got over the last day/week/month/year happens
// in updatePopularities.js.
function incrementViews(db, articleId) {
  updateTimeBuckets(db, articleId, 'daily');
  updateTimeBuckets(db, articleId, 'weekly');
  updateTimeBuckets(db, articleId, 'monthly');
  updateTimeBuckets(db, articleId, 'yearly');
  incrementAlltimeViews(db, articleId);
}

module.exports = {
  incrementViews: incrementViews,
  getInitialSummaryAttributes: getInitialSummaryAttributes,
  getMostViewedArticlesJSON: getMostViewedArticlesJSON,
};
