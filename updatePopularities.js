const MONGO_URI = process.env.MONGODB_URI;
const MONGO_TIME_BUCKETS_URI = process.env.MONGOLAB_DUMP_URI;
const MongoClient = require('mongodb').MongoClient;

function sleepFor(sleepDuration) {
    var now = new Date().getTime();
    while(new Date().getTime() < now + sleepDuration){ /* do nothing */ } 
}


function processInitializing(db) {
  db.collection('time_buckets_processing', (err, collection) => {
    if (err !== null) {
      throw "couldn't get time_bucket_processing collection";
    } else {
      collection.updateMany(
        {
          'beginProcessingAt' : { $lte : new Date() },
          'status': 'initializing'
        },
        {
          $set: {'status':'adding'}
        }
      );
      //collection.update();
    }
  });
}

function addToViews(timeBucketEntry, timeBucketName, db) {
  const collectionNames = ['daily-views', 'weekly-views', 'monthly-views'];
  for (let i = 0; i < collectionNames.length; i++) {
    db.collection(collectionNames[i], (err, viewsColl) => {
      if (err !== null) {
        throw err;
      } else {
        viewsColl.findOneAndUpdate( //TODO change to updateOne since we aren't using result.
          {
            _id: timeBucketEntry._id,
            'contributingBuckets': { "$not": { "$all": [timeBucketName] } }
          },
          {
            $addToSet: { contributingBuckets: timeBucketName },
            $inc: {views: timeBucketEntry.views}
          },
          {
            upsert: true
          }
        );
      }
    });
  }
}

function conditionallySetStateToAdded(timeBucketEntry, timeBucketName, db, tbdb) {
  const collectionNames = ['daily-views', 'weekly-views', 'monthly-views'];
  for (let i = 0; i < collectionNames.length; i++) {
    const collectionName = collectionNames[i];
    db.collection(collectionName, (err, viewsColl) => {
      if (err !== null) {
        throw err;
      } else {
        viewsColl.count({
          _id: timeBucketEntry._id,
          'contributingBuckets': { "$all": [timeBucketName] } 
        }).then(function(count) {
          if (count === 1) {
            tbdb.collection(timeBucketName, (err, timeBucket) => {
              if (err !== null) {
                throw err;
              } else {
                // update the entry timeBucketEntry._id to status added
                tbdb.collection(timeBucketName, (err, timeBucketColl) => {
                  if (err !== null) {
                    throw err;
                  } else {
                    timeBucketColl.updateOne(
                      {
                        _id: timeBucketEntry._id,
                        // this isn't strictly necessary but may increase performance?
                        'addedTo': { "$not": { "$all": [collectionName] } } 
                      },
                      {
                        $addToSet: { addedTo: collectionName },
                      }
                    );
                  }
                });
              }
            });
          }
        });
      }
    });
  }
}

function conditionallySetStateToAdded2(timeBucketEntry, timeBucketName, db, tbdb) {
  const collectionNames = ['daily-views', 'weekly-views', 'monthly-views'];
  for (let i = 0; i < collectionNames.length; i++) {
    const collectionName = collectionNames[i];
    db.collection(collectionName, (err, viewsColl) => {
      if (err !== null) {
        throw err;
      } else {
        viewsColl.count({
          _id: timeBucketEntry._id,
          'contributingBuckets': { "$all": [timeBucketName] } 
        }).then(function(count) {
          if (count === 1) {
            tbdb.collection(timeBucketName, (err, timeBucket) => {
              if (err !== null) {
                throw err;
              } else {
                // update the entry timeBucketEntry._id to status added
                tbdb.updateOne(
                  {
                    _id: timeBucketEntry._id,
                    'addedTo': { "$not": { "$all": [collectionName] } }
                  },
                  {
                    $addToSet: { addedTo: collectionName },
                  }
                );
              }
            });
          }
        });
      }
    });
  }
}

function processAdding(db, tbdb) {
  db.collection('time_buckets_processing', (err, collection) => {
    if (err !== null) {
      throw err;
    } else {
      const cursor = collection.find({
        'status': 'adding'
      });
      cursor.forEach(function(doc) {
        const timeBucketName = doc._id + '-views';
        tbdb.collection(timeBucketName, (err, timeBucket) => {
          if (err !== null) {
            throw err;
          } else {
            const timeBucketEntriesCursor = timeBucket.find({
             // 'status': {$eq: 'notYetAdded'}
            });
            timeBucketEntriesCursor.forEach(function(timeBucketEntry) {
              addToViews(timeBucketEntry, timeBucketName, db);
            });
            const timeBucketEntriesCursor2 = timeBucket.find({
             // 'status': {$eq: 'notYetAdded'}
            });
            timeBucketEntriesCursor2.forEach(function(timeBucketEntry) {
              conditionallySetStateToAdded(timeBucketEntry, timeBucketName, db, tbdb);
            });
            const timeBucketEntriesCursor3 = timeBucket.find({
             // 'status': {$eq: 'notYetAdded'}
            });
            timeBucketEntriesCursor3.forEach(function(timeBucketEntry) {
              conditionallySetStateToAdded(timeBucketEntry, timeBucketName, db, tbdb);
            });
          }
        });
        }, function(err) {
          if (err !== null) {
            throw err;
          }
        }
      );
      //collection.update();
    }
  });
}

function processAllForever(db, tbdb) {
  processInitializing(db);
  processAdding(db, tbdb);
  //something like this?
  //setTimeout(processAllForever, 0);
}

MongoClient.connect(MONGO_URI, (err, db) => {
  if (err !== null) {
    if (db !== null) {
      db.close();
    }
    throw "couldn't connect to db";
  } else {

    MongoClient.connect(MONGO_TIME_BUCKETS_URI, (err, tbdb) => {
     if (err !== null) {
       if (tbdb !== null) {
         tbdb.close();
       }
       throw "couldn't connect to time buckets db";
     } else {
       processAllForever(db, tbdb);
     }
    });
  }

  
});

