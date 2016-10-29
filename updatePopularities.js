const MONGO_URI = process.env.MONGODB_URI;
const MongoClient = require('mongodb').MongoClient;
const sendgrid  = require('sendgrid')(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD);
const wtimeout = require('./server_code/utils').wtimeout;

// TODO indexes
// TODO move most of the code out of this file into one combined/encapsulated file with the rest of the
// related logic that is currently found in updateSummaries.js

function handleError(err) {
  if (err !== null) {
    console.error(err);
    console.trace("Caught from:");
    process.exit(1);
  }
}

function updateViews(db, viewsTimeInterval, articleId) {
  let timeBucketCollName;
  let sumFromDate;
  if (viewsTimeInterval === 'daily_views') {
    timeBucketCollName = 'time_buckets_for_daily_views';
    sumFromDate = new Date(Date.now() - (1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/ * 24 /*day*/));
  } else if (viewsTimeInterval === 'weekly_views') {
    timeBucketCollName = 'time_buckets_for_weekly_views';
    sumFromDate = new Date(Date.now() - (1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/ * 24 /*day*/ * 7 /*week*/));
  } else if (viewsTimeInterval === 'monthly_views') {
    timeBucketCollName = 'time_buckets_for_monthly_views';
    sumFromDate = new Date(Date.now() - (1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/ * 24 /*day*/ * 30 /*month*/));
  } else if (viewsTimeInterval === 'yearly_views') {
    timeBucketCollName = 'time_buckets_for_yearly_views';
    sumFromDate = new Date(Date.now() - (1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/ * 24 /*day*/ * 365 /*year*/));
  }

  db.collection(timeBucketCollName, (err, tbColl) => {
    if (err !== null) {
      throw err;
    } else {
      tbColl.aggregate([
          { $match: {
              articleId: articleId,
              timeBucket: {$gt: sumFromDate} 
            }
          },
          { $group: {
            _id: null,
            totalViews: { $sum: '$count' } }
          }
        ],
        function(err, result) {
          if (err !== null) {
            handleError(err);
          }
          db.collection('article', (err, articleColl) => {
            if (err !== null) {
              handleError(err);
            } else {
              const hasViews = result.length !== 0;
              let views;
              if (hasViews) {
                views = result[0].totalViews;
              } else {
                views = 0;
              }
              const setVal = {};
              setVal[viewsTimeInterval + '.lastUpdated'] = new Date();
              setVal[viewsTimeInterval + '.views'] = views;

              articleColl.updateOne(
                {
                 _id: articleId,
                },
                {
                  $set: setVal
                }
              ).catch(function(err) {
                handleError(err);
              });
            }
          });
        }
      );
    }
  });
}

const howOftenToUpdateDaily = 1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/; // one hour
const howOftenToUpdateWeekly = 1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/ * 7; // seven hours
const howOftenToUpdateMonthly = 1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/ * 24 /*day*/; // one day
const howOftenToUpdateYearly = 1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/ * 24 /*day*/ * 7 /*week*/; // one week

/*
 * Finds an article whose viewsTimeInterval (of the form 'daily_views', 'weekly_views', ...) hasn't been updated
 * in a while. Then it locks this article for a period of time by setting a timestamp so that any other processes
 * won't process this same article.
 *
 * Resolves with article id if there is an article that is ready to be updated, else resolves with null.
 */
function processOneInterval(db, timeInterval, attributeName) {
  const prom = new Promise(function(resolve, reject) {
    // NOTE: if you change these values, you may also need to change the acceptable amount of time
    // that an entry can go without being updated (look in monitorSummariesHealth() )
    let howOftenToUpdate;
    if (process.env.NODE_ENV === 'development') {
      howOftenToUpdate = 1000 /*sec*/ * 10; // 10 seconds
    } else {
      if (timeInterval === 'daily') {
        howOftenToUpdate = 1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/; // one hour
      } else if (timeInterval === 'weekly') {
        howOftenToUpdate = 1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/ * 7; // seven hours
      } else if (timeInterval === 'monthly') {
        howOftenToUpdate = 1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/ * 24 /*day*/; // one day
      } else if (timeInterval === 'yearly') {
        howOftenToUpdate = 1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/ * 24 /*day*/ * 7 /*week*/; // one week
      }
    }

    const threshold = new Date(Date.now() - howOftenToUpdate);
    const howLongToLock = 1000 /*sec*/ * 30; // 30 seconds

    db.collection('article', (err, articleColl) => {
      if (err !== null) {
        handleError(err);

      } else {
        const filter = {};
        filter[attributeName + '.lastUpdated'] = {$lt: threshold};
        filter[attributeName + '.lockedUntil'] = {$lt: new Date()}; // lock so that multiple workers can divide up work
        // filter will look something like this
        //{
        //  daily_views.lastUpdated': {$lt: threshold},
        //  daily_views.lockedUntil': {$lt: new Date()}
        //}
        const setVal = {};
        setVal[attributeName + '.lockedUntil'] = new Date(Date.now() + howLongToLock);

        articleColl.findOneAndUpdate(
          filter,
          {
            $set: setVal
          }
        ).then(function(result) {
            if (result.value !== null) {

              resolve(result.value._id);
            } else {
              resolve(null);
            }
          }
        ).catch(function(err){handleError(err)});
      }
    });
  });
  return prom;
}

/*
 TODO when we insert an article, do we need to initialize these values?
 */

function monitorHealth(db) {
  if (process.env.NODE_ENV === 'development') {
    return;
  }

  const acceptableAmountOfTimeSinceLastUpdate = {
    'daily': howOftenToUpdateDaily + (1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/),
    'weekly': howOftenToUpdateWeekly + (1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/ * 2 /*2 hours*/),
    'monthly': howOftenToUpdateMonthly + (1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/ * 7 /*7 hours*/),
    'yearly': howOftenToUpdateYearly + (1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/ * 24 /*1 day*/)
  }

  db.collection('random_stuff', (err, randColl) => {
    if (err !== null) {
      throw err;
    } else {
      randColl.findOne(
        {
          _id: 'summariesLastMonitored',
        },
        {

        }
      ).then(function(result) {
          const howOftenToMonitor = 1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/ * 7; /*7 hours*/
          if (result == null || result.lastMonitoredAt < new Date(Date.now() - howOftenToMonitor)) {
            db.collection('article', (err, articleColl) => {
              if (err !== null) {
                throw err;
              } else {
                articleColl.find(
                  {
                    $or: [
                      {'daily_views.lastUpdated':{$lt: acceptableAmountOfTimeSinceLastUpdate.daily}},
                      {'weekly_views.lastUpdated':{$lt: acceptableAmountOfTimeSinceLastUpdate.weekly}},
                      {'monthly_views.lastUpdated':{$lt: acceptableAmountOfTimeSinceLastUpdate.monthly}},
                      {'yearly_views.lastUpdated':{$lt: acceptableAmountOfTimeSinceLastUpdate.yearly}},
                    ]
                  }
                ).count().then(function(count) {
                    const prom = new Promise(function(resolve, reject) {
                      if (count) {
                        sendgrid.send({
                            to: process.env.ALERT_EMAIL_ADDRESS,
                            from: 'noreply@' + process.env.DOMAIN_NAME,
                            subject: process.env.DOMAIN_NAME + ' ALERT - most viewed summary out of date',
                            text: 'Health check failed.'
                          }, function (err, json) {
                            if (err) {
                              reject(err);
                            } else {
                              resolve("Health check failed. Alerted via email.");
                            }
                          }
                        );
                      } else {
                        resolve("Everything looks good.")
                      }
                    });
                    return prom;
                  }, function(err) {
                    handleError(err);
                  }
                ).then(function() {
                    randColl.updateOne(
                      {
                        _id: 'summariesLastMonitored',
                      },
                      {
                        $set: {'lastMonitoredAt': new Date()}
                      },
                      {
                        upsert: true
                      }
                    )
                  }, function(err) {
                    handleError(err);
                  }
                ).then(function(r){}, function(err){handleError(err)});
              }
            });
          }
        }, function(err) {
          handleError(err);
        }
      );
    }
  });
}

function deleteOldTimeBucketEntries(db) {
  const tbCollectionNames = [
    'time_buckets_for_daily',
    'time_buckets_for_weekly',
    'time_buckets_for_monthly',
    'time_buckets_for_yearly'
  ];
  const whenToDelete = {
    'time_buckets_for_daily': new Date(Date.now() - (1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/ * 40)),
    'time_buckets_for_weekly': new Date(Date.now() - (1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/ * 24 /*day*/ * 10)),
    'time_buckets_for_monthly': new Date(Date.now() - (1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/ * 24 /*day*/ * 40)),
    'time_buckets_for_yearly': new Date(Date.now() - (1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/ * 24 /*day*/ * 400))
  };

  for (let i = 0; i < tbCollectionNames.length; i++) {
    const collectionName = tbCollectionNames[i]
    db.collection(collectionName, (err, tbColl) => {
      if (err !== null) {
        throw err;
      } else {
        tbColl.deleteMany({
          timeBucket: {$lt: whenToDelete[collectionName]}
        }).then(function(r){}, function(err) {
          handleError(err);
        });
      }
    });
  }
}

function processAll(db) {
  // play with these ratios if one summary needs more processing than another.
  const numProcessesForDaily = 1;
  const numProcessesForWeekly = 1;
  const numProcessesForMonthly = 1;
  const numProcessesForYearly = 1;

  monitorHealth(db); //TODO monitor health should happen outside of this function so that it runs for sure.

  for (let i = 0; i < numProcessesForDaily; i++) {
    processOneInterval(db, 'daily', 'daily_views').then(function(articleId) {
      if (articleId !== null) {
        updateViews(db, 'daily_views', articleId);
      }
    }).catch(function(err) {
      handleError(err);
    });
  }
  for (let i = 0; i < numProcessesForWeekly; i++) {
    processOneInterval(db, 'weekly', 'weekly_views').then(function(articleId) {
      if (articleId !== null) {
        updateViews(db, 'weekly_views', articleId);
      }
    }).catch(function(err) {
      handleError(err);
    });
  }
  for (let i = 0; i < numProcessesForMonthly; i++) {
    processOneInterval(db, 'monthly', 'monthly_views').then(function(articleId) {
      if (articleId !== null) {
        updateViews(db, 'monthly_views', articleId);
      }
    }).catch(function(err) {
      handleError(err);
    });
  }
  for (let i = 0; i < numProcessesForYearly; i++) {
    processOneInterval(db, 'yearly', 'yearly_views').then(function(articleId) {
      if (articleId !== null) {
        updateViews(db, 'yearly_views', articleId);
      }
    }).catch(function(err) {
      handleError(err);
    });
  }
  
  //deleteOldTimeBucketEntries(db);
}



MongoClient.connect(MONGO_URI,
  {
    db: {
      wtimeout: wtimeout
    }
  },
  (err, db) => {
    if (err !== null) {
      handleError(err);
    } else {
      setInterval(function() {
          for (let i = 0; i < 10; i++) {
            processAll(db);
          }
        }, 10000
      );
    }
});
