const MONGO_URI = process.env.MONGODB_URI;
const MongoClient = require('mongodb').MongoClient;
const sendgrid  = require('sendgrid')(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD);

//TODO create an index on any field that needs one. IE all the date fields.

function handleError(err) {
  if (err !== null) {
    console.error(err);
    console.trace("Caught from:");
    process.exit(1);
  }
}

function updateCollEntry(db, summaryCollName, articleId) {
  let timeBucketCollName;
  let sumFromDate;
  if (summaryCollName === 'summary_of_daily') {
    timeBucketCollName = 'time_buckets_for_daily';
    sumFromDate = new Date(Date.now() - (1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/ * 24 /*day*/));
  } else if (summaryCollName === 'summary_of_weekly') {
    timeBucketCollName = 'time_buckets_for_weekly';
    sumFromDate = new Date(Date.now() - (1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/ * 24 /*day*/ * 7 /*week*/));
  } else if (summaryCollName === 'summary_of_monthly') {
    timeBucketCollName = 'time_buckets_for_monthly';
    sumFromDate = new Date(Date.now() - (1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/ * 24 /*day*/ * 30 /*month*/));
  } else if (summaryCollName === 'summary_of_yearly') {
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
            throw err;
          }
          db.collection(summaryCollName, (err, summaryColl) => {
            if (err !== null) {
              throw err;
            } else {
              const hasViews = result.length !== 0;
              if (hasViews) {
                summaryColl.updateOne(
                  {
                   _id: articleId,
                  },
                  {
                    $set: {
                      lastUpdated: new Date(),
                      views: result[0].totalViews
                    }
                  }
                );
              } else {
                summaryColl.deleteOne(
                  {
                   _id: articleId
                  }
                );
              }
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

function processOneColl(db, collName) {
  // NOTE: if you change these values, you may also need to change the acceptable amount of time
  // that an entry can go without being updated (look in monitorSummariesHealth() )
  let howOftenToUpdate;
  if (collName === 'summary_of_daily') {
    howOftenToUpdate = 1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/; // one hour
  } else if (collName === 'summary_of_weekly') {
    howOftenToUpdate = 1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/ * 7; // seven hours
  } else if (collName === 'summary_of_monthly') {
    howOftenToUpdate = 1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/ * 24 /*day*/; // one day
  } else if (collName === 'summary_of_yearly') {
    howOftenToUpdate = 1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/ * 24 /*day*/ * 7 /*week*/; // one week
  }

  const threshold = new Date();
  //const threshold = new Date(Date.now() - howOftenToUpdate);
  //const howLongToLock = 1000 /*sec*/ * 30; // 30 seconds
  const howLongToLock = 1000 /*sec*/; // 1 seconds


  db.collection(collName, (err, summaryCol) => {
    if (err !== null) {
      throw err;
    } else {
      summaryCol.findOneAndUpdate(
        {
         'lastUpdated': {$lt: threshold},
         'lockedUntil': {$lt: new Date()} // so multiple workers will divide up work
        },
        {
          $set: {'lockedUntil': new Date(Date.now() + howLongToLock)},
        }
      ).then(function(result) {
          if (result.value !== null) {
            updateCollEntry(db, collName, result.value._id)
          }
        }, function(err){
          handleError(err);
        }
      ).then(function(r){}, function(err){handleError(err)});
    }
  });
  
  
}

function monitorSumarriesHealth(db) {
  const collectionNames = [
    'summary_of_daily',
    'summary_of_weekly',
    'summary_of_monthly',
    'summary_of_yearly',
  ]
  const acceptableAmountOfTimeSinceLastUpdate = {
    'summary_of_daily': howOftenToUpdateDaily + (1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/),
    'summary_of_weekly': howOftenToUpdateWeekly + (1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/ * 2 /*2 hours*/),
    'summary_of_monthly': howOftenToUpdateMonthly + (1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/ * 7 /*7 hours*/),
    'summary_of_yearly': howOftenToUpdateYearly + (1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/ * 24 /*1 day*/)
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
            for (let i = 0; i < collectionNames.length; i++) {
              const collectionName = collectionNames[i];
              db.collection(collectionName, (err, summaryCol) => {
                if (err !== null) {
                  throw err;
                } else {
                  const threshold = new Date(Date.now() - acceptableAmountOfTimeSinceLastUpdate[collectionNames[i]]);
                  summaryCol.find(
                    {
                     'lastUpdated': {$lt: threshold},
                    }
                  ).count().then(function(count){
                      if (count) {
                        if (NODE_ENV !== 'development') {
                          sendgrid.send({
                              to: process.env.ALERT_EMAIL_ADDRESS,
                              from: 'noreply@' + process.env.DOMAIN_NAME,
                              subject: process.env.DOMAIN_NAME + ' ALERT - most viewed sumarry out of date',
                              text: 'collectionName = ' + collectionName
                            }, function (err, json) {
                              if (err) {
                                handleError(err);
                              }
                            }
                          );
                        }
                      }
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
    processOneColl(db, 'summary_of_daily');
  }
  for (let i = 0; i < numProcessesForWeekly; i++) {
    processOneColl(db, 'summary_of_weekly');
  }
  for (let i = 0; i < numProcessesForMonthly; i++) {
    processOneColl(db, 'summary_of_monthly');
  }
  for (let i = 0; i < numProcessesForYearly; i++) {
    processOneColl(db, 'summary_of_yearly');
  }
  
  monitorSumarriesHealth(db);
  deleteOldTimeBucketEntries(db);
}



MongoClient.connect(MONGO_URI, (err, db) => {
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
