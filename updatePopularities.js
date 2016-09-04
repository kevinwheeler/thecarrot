const MONGO_URI = process.env.MONGODB_URI;
const MongoClient = require('mongodb').MongoClient;
const sendgrid  = require('sendgrid')(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD);

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

function updateCollEntry(db, viewsTimeInterval, articleId) {
  let timeBucketCollName;
  let sumFromDate;
  if (viewsTimeInterval === 'daily_views') {
    timeBucketCollName = 'time_buckets_for_daily';
    sumFromDate = new Date(Date.now() - (1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/ * 24 /*day*/));
  } else if (viewsTimeInterval === 'weekly_views') {
    timeBucketCollName = 'time_buckets_for_weekly';
    sumFromDate = new Date(Date.now() - (1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/ * 24 /*day*/ * 7 /*week*/));
  } else if (viewsTimeInterval === 'monthly_views') {
    timeBucketCollName = 'time_buckets_for_monthly';
    sumFromDate = new Date(Date.now() - (1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/ * 24 /*day*/ * 30 /*month*/));
  } else if (viewsTimeInterval === 'yearly_views') {
    timeBucketCollName = 'time_buckets_for_yearly';
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
            totalViews: { $sum: '$views' } }
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
              );
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

function processOneInterval(db, viewsTimeInterval) {
  // NOTE: if you change these values, you may also need to change the acceptable amount of time
  // that an entry can go without being updated (look in monitorSummariesHealth() )
  let howOftenToUpdate;
  if (process.env.NODE_ENV === 'development') {
    howOftenToUpdate = 1000 /*sec*/ * 10; // 10 seconds
  } else {
    if (viewsTimeInterval === 'daily_views') {
      howOftenToUpdate = 1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/; // one hour
    } else if (viewsTimeInterval === 'weekly_views') {
      howOftenToUpdate = 1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/ * 7; // seven hours
    } else if (viewsTimeInterval === 'monthly_views') {
      howOftenToUpdate = 1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/ * 24 /*day*/; // one day
    } else if (viewsTimeInterval === 'yearly_views') {
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
      filter[viewsTimeInterval + '.lastUpdated'] = {$lt: threshold};
      filter[viewsTimeInterval + '.lockedUntil'] = {$lt: new Date()}; // lock so that multiple workers will divide up work
      // filter will look something like this
      //{
      //  daily_views.lastUpdated': {$lt: threshold},
      //  daily_views.lockedUntil': {$lt: new Date()}
      //}
      const setVal = {};
      setVal[viewsTimeInterval + '.lockedUntil'] = new Date(Date.now() + howLongToLock);

      articleColl.findOneAndUpdate(
        filter,
        {
          $set: setVal
        }
      ).then(function(result) {
          if (result.value !== null) {
            updateCollEntry(db, viewsTimeInterval, result.value._id)
          }
        }, function(err){
          handleError(err);
        }
      ).then(function(r){}, function(err){handleError(err)});
    }
  });
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
            db.collection('article', (err, articleCol) => {
              if (err !== null) {
                throw err;
              } else {
                articleCol.find(
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
        }, function(err){
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
  ]
  const whenToDelete = {
    'time_buckets_for_daily': new Date(Date.now() - (1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/ * 40)),
    'time_buckets_for_weekly': new Date(Date.now() - (1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/ * 24 /*day*/ * 10)),
    'time_buckets_for_monthly': new Date(Date.now() - (1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/ * 24 /*day*/ * 40)),
    'time_buckets_for_yearly': new Date(Date.now() - (1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/ * 24 /*day*/ * 400))
  }

  for (let i = 0; i < tbCollectionNames.length; i++) {
    const collectionName = tbCollectionNames[i]
    db.collection(collectionName, (err, tbColl) => {
      if (err !== null) {
        throw err;
      } else {
        tbColl.deleteMany({
          timeBucket: {$lt: whenToDelete[collectionName]}
        }).then(function(r){}, function(err){
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


  for (let i = 0; i < numProcessesForDaily; i++) {
    processOneInterval(db, 'daily_views');
  }
  for (let i = 0; i < numProcessesForWeekly; i++) {
    processOneInterval(db, 'weekly_views');
  }
  for (let i = 0; i < numProcessesForMonthly; i++) {
    processOneInterval(db, 'monthly_views');
  }
  for (let i = 0; i < numProcessesForYearly; i++) {
    processOneInterval(db, 'yearly_views');
  }
  
  monitorHealth(db);
  deleteOldTimeBucketEntries(db);
}



MongoClient.connect(MONGO_URI,
  {
    wtimeout: 1000*15
  },
  (err, db) => {
    if (err !== null) {
      handleError(err);
    } else {
      setInterval(function(){
          for (let i = 0; i < 10; i++) {
            processAll(db);
          }
        }, 1000
      );
    }
});
