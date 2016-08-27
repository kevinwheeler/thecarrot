/*
 * Related files: migrations/2createSummaryIndexes.js, updatePopularities.js
 *
 */
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

/*
 *  If this article isn't already in the summary collection, insert it.
 */
function insertIntoSummary(db, articleId, approval, summaryName) {
  const collectionName = 'summary_of_' + summaryName;
  db.collection(collectionName, (err, summaryCol) => {
    if (err !== null) {
      handleError(err);
    } else {
      summaryCol.insertOne(
        {
          _id: articleId,
          approval: approval,
          lastUpdated: new Date(),
          lockedUntil: new Date(),
          views: 1
        }
      ).then(function(result){}, function(err) {
        if (err.code === duplicateKeyErrorCode) {
          return;
        }
        handleError(err);
      });
    }
  });
}

function incrementAlltimeVews(db, articleId, approval) {
  db.collection('summary_of_all_time', (err, summaryCol) => {
    if (err !== null) {
      handleError(err);
    } else {

      function incrementView() {
        summaryCol.updateOne(
          {
            _id: articleId,
          },
          {
            $inc: {views: 1},
          }
        ).then(function (result) {
        }, function (err) {
          handleError(err);
        });
      }

      summaryCol.insertOne(
        {
          _id: articleId,
          approval: approval,
          views: 0
        }
      ).then(function(result) {
          incrementView();
        }, function(err) {
          if (err.code === duplicateKeyErrorCode) {
            incrementView();
          } else {
            handleError(err);
          }
        }
      ).then(function(){}, function(err){handleError(err)});

    }
  });
}

function getApprovalStatus(db, articleId) {
  const prom = new Promise(function(resolve, reject) {
    db.collection('article', (err, collection) => {
      if (err !== null) {
        reject(err);
      } else {
        collection.find({
          _id: articleId
        }).next().then(
          function(article) {
            resolve(article.approval);
          },
          function(err) {
            reject(err);
          }
        );
      }
    });
  });
  return prom;
}

// Returns a promise that resolves if the approval status was set in all of the summary collections.
// Rejects if the approval status failed to set in any summary collection. (If it rejects, it can leave
// the approval status set in some summary collection and unset in others), in which case you should retry.
function setApprovalStatus(db, articleId, approval) {
  const collectionNames = [
    'summary_of_daily',
    'summary_of_weekly',
    'summary_of_monthly',
    'summary_of_yearly',
    'summary_of_all_time',
  ];

  const promises = [];
  for(let i=0; i < collectionNames.length; i++) {
    const prom = new Promise(function(resolve, reject) {
      db.collection(collectionNames[i], (err, summaryColl) => {
        if (err !== null) {
          reject(err);
        } else {
          console.log("about to set approval");
          console.log("article id = ");
          console.log(typeof(articleId));
          console.log("approval = ");
          console.log(approval);
          summaryColl.updateOne(
            {
              _id: articleId,
            },
            {
              $set: {approval: approval}
            }
          ).then(function(result) {
            resolve(result);
            }, function(err) {
              reject(err);
            }
          );
        }
      });
    });
    promises.push(prom);
  }
  return Promise.all(promises);
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
  getApprovalStatus(db, articleId).then(
    function(approval) {
      insertIntoSummary(db, articleId, approval, 'daily');
      insertIntoSummary(db, articleId, approval, 'weekly');
      insertIntoSummary(db, articleId, approval, 'monthly');
      insertIntoSummary(db, articleId, approval, 'yearly');
      incrementAlltimeVews(db, articleId, approval);
    },
    function(err) {
      handleError(err);
    }
  ).then(function(){}, function(err){handleError(err)});
}

module.exports = {
  incrementViews: incrementViews,
  setApprovalStatus: setApprovalStatus
};
