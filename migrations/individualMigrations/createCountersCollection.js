const MongoClient = require('mongodb').MongoClient;
const mongoConcerns = require('../../utils/mongoConcerns.js');

const MONGO_URI = process.env.MONGODB_URI;

MongoClient.connect(MONGO_URI, (err, db) => {
  if (err !== null) {
    throw "Couldn't connect to Mongo";
  } else {
    console.log("in else");
    console.log("wc = " + mongoConcerns.WRITE_CONCERN);
    console.log("jc = " + mongoConcerns.JOURNAL_CONCERN);
    db.close();
    //db.collection('counters', (err, collection) => {
    //  if (err !== null) {
    //    throw "Couldn't retrieve counters collection.";
    //  } else {
    //    const doc = {
    //      _id: 'articleId',
    //      seq: 500
    //    }
    //    collection.insert(doc, {
    //      w: WRITE_CONCERN,
    //      j: JOURNAL_CONCERN
    //    });
    //  }   
    //}); 
  }   
}); 
