/*
 * Sets up indexes and stuff to facilitate the implementation of a 
 * 'most viewed' list of articles for the last day/week/month/year/alltime
 */

const MongoClient = require('mongodb').MongoClient;

const MONGO_URI = 'mongodb://development:localdev2@ds011495.mlab.com:11495/heroku_z84wknmq'


function createIndexesForTimeBucketCollections(db) {
  const collectionNames = [
    'time_buckets_for_daily', 
    'time_buckets_for_weekly', 
    'time_buckets_for_monthly', 
    'time_buckets_for_yearly' 
  ];
  for (let i = 0; i < collectionNames.length; i++) {
    db.collection(collectionNames[i], (err, collection) => {
      if (err !== null) {
        throw err;
      } else {
        console.log("creating index for " + collectionNames[i]);
        collection.createIndex(
          {articleId: 1, timeBucket: 1},
          {
            j: true,
            w: 'majority',
            wtimeout: 15000,
          }
        ).then(function(result){
          console.log("index created");
          }, function(err) {
            if (err !== null) {
              console.error(err);
              console.trace("Caught from:");
              process.exit(1);
            }  
        });
      }   
    }); 
  }
}

function createIndexesForSummaryCollections(db) {
  const collectionNames = [
    'summary_of_daily', 
    'summary_of_weekly', 
    'summary_of_monthly', 
    'summary_of_yearly', 
  ];
  for (let i = 0; i < collectionNames.length; i++) {
    db.collection(collectionNames[i], (err, collection) => {
      if (err !== null) {
        throw err;
      } else {
        console.log("creating indexes for " + collectionNames[i]);
        collection.createIndex(
          {lastUpdated: 1, lockedUntil: 1},
          {
            j: true,
            w: 'majority',
            wtimeout: 15000,
          }
        ).then(function(result){
          console.log("index created");
          }, function(err) {
            if (err !== null) {
              console.error(err);
              console.trace("Caught from:");
              process.exit(1);
            }  
        });

        collection.createIndex(
          {views: 1},
          {
            j: true,
            w: 'majority',
            wtimeout: 15000,
          }
        ).then(function(result){
          console.log("index created");
          }, function(err) {
            if (err !== null) {
              console.error(err);
              console.trace("Caught from:");
              process.exit(1);
            }  
        });
      }   
    }); 
  }
}

function createIndexesForAllTimeViews(db) {
  db.collection('summary_of_all_time', (err, collection) => {
    if (err !== null) {
      throw err;
    } else {
      collection.createIndex(
        {views: 1},
        {
          j: true,
          w: 'majority',
          wtimeout: 15000,
        }
      ).then(function(result){
        console.log("index created");
        }, function(err) {
          if (err !== null) {
            console.error(err);
            console.trace("Caught from:");
            process.exit(1);
          }  
      });
    }   
  }); 
}

function setupLastMonitoredTimestamps(db) {
  db.collection('random_stuff', (err, collection) => {
    if (err !== null) {
      throw err;
    } else {

      collection.insertOne(
        {
          _id: 'summary_last_monitored_time',
          dailyLastMonitoredTime: new Date(),
          weeklyLastMonitoredTime: new Date(),
          monthlyLastMonitoredTime: new Date(),
          yearlyLastMonitoredTime: new Date()
        }
      ).then(function(result){}, function(err) {
          //const duplicateKeyErrorCode = 11000;
          //if (err.code === duplicateKeyErrorCode) {
          //  return;
          //}
          console.error(err);
          console.trace("Caught from:");
          throw err;
      });


    }   
  }); 
}

MongoClient.connect(MONGO_URI, (err, db) => {
  if (err !== null) {
    throw err;
  } else {
    createIndexesForTimeBucketCollections(db);
    createIndexesForSummaryCollections(db);
    createIndexesForAllTimeViews(db);
  }   
}); 
