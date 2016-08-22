/*
 * Related files: migrations/2createSummaryIndexes.js, updatePopularities.js
 *
 */
const timebucket = require('timebucket');

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
        const duplicateKeyErrorCode = 11000;
        if (err.code !== duplicateKeyErrorCode) { //https://jira.mongodb.org/browse/SERVER-14322
          handleError(err);
        }
      });
    }
  });
}

/*
 *  If this article isn't already in the summary collection, insert it.
 */
function insertIntoSummary(db, articleId, summaryName) {
  const collectionName = 'summary_of_' + summaryName;
  db.collection(collectionName, (err, summaryCol) => {
    if (err !== null) {
      handleError(err);
    } else {
      summaryCol.insertOne(
        {
          _id: articleId,
          lastUpdated: new Date(),
          lockedUntil: new Date(),
          views: 1
        }
      ).then(function(result){}, function(err) {
        const duplicateKeyErrorCode = 11000;
        if (err.code === duplicateKeyErrorCode) {
          return;
        }
        handleError(err);
      });
    }
  });
}

function incrementAlltimeVews(db, articleId) {
  db.collection('summary_of_all_time', (err, summaryCol) => {
    if (err !== null) {
      handleError(err);
    } else {
      summaryCol.updateOne(
        {
          _id: articleId,
        },
        {
          $inc: {views: 1}
        },
        {
          upsert: true
        }
      ).then(function(result){}, function(err) {
        const duplicateKeyErrorCode = 11000;
        if (err.code === duplicateKeyErrorCode) { //https://jira.mongodb.org/browse/SERVER-14322
          return;
        }
        handleError(err);
      });
    }
  });
}

// Basically, when an article is viewed, this method will be called so that
// We can do whatever logic we need to do so that we can have a list of 
// most viewed articles by day/week/month/year
function updateViewsCollections(db, articleId) {
  updateTimeBuckets(db, articleId, 'daily');
  updateTimeBuckets(db, articleId, 'weekly');
  updateTimeBuckets(db, articleId, 'monthly');
  updateTimeBuckets(db, articleId, 'yearly');
  insertIntoSummary(db, articleId, 'daily');
  insertIntoSummary(db, articleId, 'weekly');
  insertIntoSummary(db, articleId, 'monthly');
  insertIntoSummary(db, articleId, 'yearly');
  incrementAlltimeVews(db, articleId);
}

module.exports = updateViewsCollections;
