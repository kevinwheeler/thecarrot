const MONGO_URI = process.env.MONGODB_URI;
const MONGO_TIME_BUCKETS_URI = process.env.MONGOLAB_DUMP_URI;
const MongoClient = require('mongodb').MongoClient;

//TODO create an index on any field that needs one. IE all the date fields.

function sleepFor(sleepDuration) {
    var now = new Date().getTime();
    while(new Date().getTime() < now + sleepDuration){ /* do nothing */ } 
}

function handleError(err) {
  if (err !== null) {
    console.error(err);
    console.trace("Caught from:");
    process.exit(1);
  }
}


function processInitializing(db) {
  db.collection('time_buckets_processing', (err, collection) => {
    if (err !== null) {
      handleError(err);
    } else {
      collection.updateMany({
          'beginProcessingAt' : { $lte : new Date() },
          'status': 'initializing'
        }, {
          $set: {'status':'adding'}
        }
      ).then(function(result){}, function(err){handleError(err);});
    }
  });
}

function processAdded(db) {
  db.collection('time_buckets_processing', (err, collection) => {
    if (err !== null) {
      handleError(err);
    } else {
      collection.updateMany({
          'removeFromDailyAt' : {$lte: new Date()},
          'status': 'added'
        }, {
          $set: {'status':'subtracting'}
        }
      ).then(function(result){}, function(err){handleError(err);});
    }
  });
}

const collectionNames = ['daily-views', 'weekly-views', 'monthly-views'];

function addToViews(timeBucketEntry, timeBucketName, db) {
  for (let i = 0; i < collectionNames.length; i++) {
    db.collection(collectionNames[i], (err, viewsColl) => {
      if (err !== null) {
        handleError(err);
      } else {
        viewsColl.updateOne(
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
        ).then(function(result){}, function(err){
          const duplicateKeyError = 11000;
          //mongodb bug: https://jira.mongodb.org/browse/SERVER-14322
          if (err.code !== duplicateKeyError) {
          handleError(err);
          }
        });
      }
    });
  }
}

function subtractFromViews(timeIntervalCollectionName, timeBucketEntry, timeBucketName, db) {
  db.collection(timeIntervalCollectionName, (err, viewsColl) => {
    if (err !== null) {
      handleError(err);
    } else {
      viewsColl.updateOne(
        {
          _id: timeBucketEntry._id,
          'noLongerContributingBuckets': {"$not": {"$all": [timeBucketName]}}
        },
        {
          $addToSet: { noLongerContributingBuckets: timeBucketName },
          $inc: {views: -timeBucketEntry.views}
        }
      ).then(function(result){}, function(err){handleError(err);});
    }
  });
}


function updateAddedToListOfTimeBucketEntry(timeBucketEntry, timeBucketName, db, tbdb) {
  for (let i = 0; i < collectionNames.length; i++) {
    const collectionName = collectionNames[i];
    db.collection(collectionName, (err, viewsColl) => {
      if (err !== null) {
        handleError(err);
      } else {
        viewsColl.count({
          _id: timeBucketEntry._id,
          'contributingBuckets': { "$all": [timeBucketName] } 
        }).then(function(count) {
            if (count === 1) {
              // update the entry timeBucketEntry._id to status added
              tbdb.collection(timeBucketName, (err, timeBucket) => {
                if (err !== null) {
                  handleError(err);
                } else {
                  timeBucket.updateOne(
                    {
                      _id: timeBucketEntry._id,
                      // this isn't strictly necessary but may increase performance?
                      'addedTo': { "$not": { "$all": [collectionName] } } 
                    },
                    {
                      $addToSet: { addedTo: collectionName },
                      $set: {'status': 'adding'}
                    }
                  ).then(function(result){}, function(err){handleError(err);});
                }
              });
            }
          }, function(err){handleError(err);}
        );
      }
    });
  }
}

function updateSubtractedFromListOfTimeBucketEntry(timeBucketEntry, timeBucketName, db, tbdb) {
  for (let i = 0; i < collectionNames.length; i++) {
    const collectionName = collectionNames[i];
    db.collection(collectionName, (err, viewsColl) => {
      if (err !== null) {
        handleError(err);
      } else {
        viewsColl.count({
          _id: timeBucketEntry._id,
          'noLongerContributingBuckets': { "$all": [timeBucketName] } 
        }).then(function(count) {
            // if this time bucket entry has already been subtracted from viewsColl
            if (count === 1) {
              // update the timeBucketEntry's subtractedFrom list 
              // and set status of timeBucketEntry to 'subtracting'
              tbdb.collection(timeBucketName, (err, timeBucket) => {
                if (err !== null) {
                  handleError(err);
                } else {
                  timeBucket.updateOne(
                    {
                      _id: timeBucketEntry._id,
                      // this isn't strictly necessary but may increase performance?
                      'subtractedFrom': { "$not": { "$all": [collectionName] } } 
                    },
                    {
                      $addToSet: { subtractedFrom: collectionName },
                      $set: {'status': 'subtracting'}
                    }
                  ).then(function(result){}, function(err){handleError(err);});
                }
              });
            }
          }, function(err){handleError(err);}
        );
      }
    });
  }
}

function updateStateOfAppropriateTimeBucketEntriesToAdded(db, tbdb) {
  db.collection('time_buckets_processing', (err, tbpCollection) => {
    if (err !== null) {
      handleError(err);
    } else {
      const cursor = tbpCollection.find({
        'status': 'adding'
      });
      cursor.forEach(function(tbpEntry) {
          tbdb.collection(tbpEntry._id, (err, timeBucket) => {
            if (err !== null) {
              handleError(err);
            } else {
              timeBucket.updateMany({
                  'addedTo': { "$all": collectionNames } ,
                  'status': 'adding'
                }, {
                  $set: {'status':'added'}
                }
              ).then(function(result){}, function(err){handleError(err);});
            }
          });
        }, function(err) {
          if (err !== null) {
            handleError(err);
          }
        }
      );
    }
  });
}

function updateStateOfAppropriateTimeBucketEntriesToSubtracted(db, tbdb) {
  db.collection('time_buckets_processing', (err, tbpCollection) => {
    if (err !== null) {
      handleError(err);
    } else {
      const cursor = tbpCollection.find({
        'status': 'subtracting'
      });
      cursor.forEach(function(tbpEntry) {
          tbdb.collection(tbpEntry._id, (err, timeBucket) => {
            if (err !== null) {
              handleError(err);
            } else {
              timeBucket.updateMany({
                  'subtractedFrom': { "$all": collectionNames } ,
                  'status': 'subtracting'
                }, {
                  $set: {'status':'subtracted'}
                }
              ).then(function(result){}, function(err){handleError(err);});
            }
          });
        }, function(err) {
          if (err !== null) {
            handleError(err);
          }
        }
      );
    }
  });
}

function updateStateOfAppropriateTimeBucketProcessingEntriesToAdded(db, tbdb) {
  db.collection('time_buckets_processing', (err, tbpCollection) => {
    if (err !== null) {
      handleError(err);
    } else {
      const cursor = tbpCollection.find({
        'status': 'adding'
      });
      cursor.forEach(function(tbpEntry) {
          tbdb.collection(tbpEntry._id, (err, timeBucket) => {//TODO Do this outside of loop for efficiency. Alos look for other places to do this.
            if (err !== null) {
              handleError(err);
            } else {
               timeBucket.count({
                 'status': {'$ne': 'added' }
               }).then(function(count) {
                   if (count === 0) {
                      tbpCollection.updateOne({
                          _id: tbpEntry._id,
                          'status': 'adding'
                        }, {
                          $set: {'status': 'added'}
                        }
                      ).then(function(result){}, function(err){handleError(err);});
                   } 
                 }, function(err){handleError(err);}
               );
            }
          });
        }, function(err) {
          if (err !== null) {
            handleError(err);
          }
        }
      );
    }
  });
}

function updateStateOfAppropriateTimeBucketProcessingEntriesToSubtracted(db, tbdb) {
  db.collection('time_buckets_processing', (err, tbpCollection) => {
    if (err !== null) {
      handleError(err);
    } else {
      const cursor = tbpCollection.find({
        'status': 'subtracting'
      });
      cursor.forEach(function(tbpEntry) {
          tbdb.collection(tbpEntry._id, (err, timeBucket) => {//TODO Do this outside of loop for efficiency. Alos look for other places to do this.
            if (err !== null) {
              handleError(err);
            } else {
               timeBucket.count({
                 'status': {'$ne': 'subtracted' }
               }).then(function(count) {
                   if (count === 0) {
                      tbpCollection.updateOne({
                          _id: tbpEntry._id,
                          'status': 'subtracting'
                        }, {
                          $set: {'status': 'subtracted'}
                        }
                      ).then(function(result){}, function(err){handleError(err);});
                   } 
                 }, function(err){handleError(err);}
               );
            }
          });
        }, function(err) {
          if (err !== null) {
            handleError(err);
          }
        }
      );
    }
  });
}

function processAdding(db, tbdb) {
  db.collection('time_buckets_processing', (err, collection) => {
    if (err !== null) {
      handleError(err);
    } else {
      const cursor = collection.find({
        'status': 'adding'
      });
      cursor.forEach(function(timeBucketsProcessingEntry) {
          const timeBucketName = timeBucketsProcessingEntry._id;
          tbdb.collection(timeBucketName, (err, timeBucket) => {
            if (err !== null) {
              handleError(err);
            } else {
              const timeBucketEntriesCursor = timeBucket.find({
                $or: [{'status': {$eq: 'notYetAdded'}}, {'status': {$eq: 'adding'}}]
              });
              timeBucketEntriesCursor.forEach(function(timeBucketEntry) {
                  addToViews(timeBucketEntry, timeBucketName, db);
                }, function(err){handleError(err);}
              );

              const timeBucketEntriesCursor2 = timeBucket.find({
                $or: [{'status': {$eq: 'notYetAdded'}}, {'status': {$eq: 'adding'}}]
              });
              timeBucketEntriesCursor2.forEach(function(timeBucketEntry) {
                  updateAddedToListOfTimeBucketEntry(timeBucketEntry, timeBucketName, db, tbdb);
                }, function(err){handleError(err);}
              );
            }
          });
        }, function(err) {
          if (err !== null) {
            handleError(err);
          }
        }
      );
      updateStateOfAppropriateTimeBucketEntriesToAdded(db, tbdb);
      updateStateOfAppropriateTimeBucketProcessingEntriesToAdded(db, tbdb);
    }
  });
}

function processSubtracting(db, tbdb) {
  db.collection('time_buckets_processing', (err, collection) => {
    if (err !== null) {
      handleError(err);
    } else {
      const cursor = collection.find({
        'status': 'subtracting'
      });
      cursor.forEach(function(timeBucketsProcessingEntry) {
          const timeBucketName = timeBucketsProcessingEntry._id;
          const removeFromDailyAt = timeBucketsProcessingEntry.removeFromDailyAt;
          const removeFromWeeklyAt = timeBucketsProcessingEntry.removeFromWeeklyAt;
          const removeFromMonthlyAt = timeBucketsProcessingEntry.removeFromMonthlyAt;
          tbdb.collection(timeBucketName, (err, timeBucket) => {
            if (err !== null) {
              handleError(err);
            } else {
              if (Date.now() >= removeFromDailyAt) {
                const timeBucketEntriesCursor = timeBucket.find({
                  $or: [{'status': {$eq: 'added'}}, {'status': {$eq: 'subtracting'}}]
                });
                timeBucketEntriesCursor.forEach(function(timeBucketEntry) {
                    subtractFromViews('daily-views', timeBucketEntry, timeBucketName, db);
                  }, function(err) {//TODO add error handling to other forEach's
                    if (err !== null) {
                      handleError(err);
                    }
                  }
                );
              }

              if (Date.now() >= removeFromWeeklyAt) {
                const timeBucketEntriesCursor = timeBucket.find({
                  $or: [{'status': {$eq: 'added'}}, {'status': {$eq: 'subtracting'}}]
                });
                timeBucketEntriesCursor.forEach(function(timeBucketEntry) {
                    subtractFromViews('weekly-views', timeBucketEntry, timeBucketName, db);
                  }, function(err) {//TODO add error handling to other forEach's
                    if (err !== null) {
                      handleError(err);
                    }
                  }
                );
              }

              if (Date.now() >= removeFromMonthlyAt) {
                const timeBucketEntriesCursor = timeBucket.find({
                  $or: [{'status': {$eq: 'added'}}, {'status': {$eq: 'subtracting'}}]
                });
                timeBucketEntriesCursor.forEach(function(timeBucketEntry) {
                    subtractFromViews('monthly-views', timeBucketEntry, timeBucketName, db);
                  }, function(err) {//TODO add error handling to other forEach's
                    if (err !== null) {
                      handleError(err);
                    }
                  }
                );
              }

              const timeBucketEntriesCursor4 = timeBucket.find({
                $or: [{'status': {$eq: 'added'}}, {'status': {$eq: 'subtracting'}}]
              });
              timeBucketEntriesCursor4.forEach(function(timeBucketEntry) {
                updateSubtractedFromListOfTimeBucketEntry(timeBucketEntry, timeBucketName, db, tbdb);
              });
            }
          });
        }, function(err) {
          if (err !== null) {
            handleError(err);
          }
        }
      );
      updateStateOfAppropriateTimeBucketEntriesToSubtracted(db, tbdb);
      updateStateOfAppropriateTimeBucketProcessingEntriesToSubtracted(db, tbdb);
    }
  });
}

function processAllForever(db, tbdb) {
  processInitializing(db);
  processAdding(db, tbdb);
  processAdded(db, tbdb);
  processSubtracting(db, tbdb);
  //something like this?
  setTimeout(processAllForever.bind(null, db, tbdb), 100);
}

MongoClient.connect(MONGO_URI, (err, db) => {
  if (err !== null) {
    handleError(err);
  } else {

    MongoClient.connect(MONGO_TIME_BUCKETS_URI, (err, tbdb) => {
     if (err !== null) {
      handleError(err);
     } else {
       processAllForever(db, tbdb);
     }
    });
  }

  
});

