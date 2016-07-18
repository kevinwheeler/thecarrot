const MongoClient = require('mongodb').MongoClient;
const mongoConcerns = require('../../utils/mongoConcerns.js');

const MONGO_URI = process.env.MONGODB_URI;

MongoClient.connect(MONGO_URI, (err, db) => {
  if (err !== null) {
    throw "Couldn't connect to Mongo";
  } else {
    db.collection('counters', (err, collection) => {
      if (err !== null) {
        db.close();
        throw err;
      } else {
        const doc = {
          _id: 'articleId',
          seq: 500
        }
        collection.insert(doc, {
          w: mongoConcerns.WRITE_CONCERN,
          j: mongoConcerns.JOURNAL_CONCERN
        });
      }   
    }); 
    db.close();
  }   
}); 
