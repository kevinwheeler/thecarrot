const MongoClient = require('mongodb').MongoClient;

function handleError(err) {
  console.error(err);
  console.trace("Caught from:");
  process.exit(1);
};

const MONGO_URI = 'mongodb://development:localdev2@ds011495.mlab.com:11495/heroku_z84wknmq'

const MONGO_OPTIONS = {
  j: true,
  w: 'majority',
  wtimeout: 15000,
};


let authFlagsColl;
function getAuthenticatedFlagsColl() {
  const prom = new Promise(function(resolve,reject) {
    db.collection('authenticated_flags', {}, (err, coll) => {
      if (err !== null) {
        reject(err);
      } else {
        authFlagsColl = coll;
        resolve();
      }
    });
  })
  return prom;
}

let dailyTimeBucketsColl;
function getDailyTimeBucketsColl() {
  const prom = new Promise(function(resolve,reject) {
    db.collection('time_buckets_for_daily_views', {}, (err, coll) => {
      if (err !== null) {
        reject(err);
      } else {
        dailyTimeBucketsColl = coll;
        resolve();
      }
    });
  })
  return prom;
}

let weeklyTimeBucketsColl;
function getWeeklyTimeBucketsColl() {
  const prom = new Promise(function(resolve,reject) {
    db.collection('time_buckets_for_daily_views', {}, (err, coll) => {
      if (err !== null) {
        reject(err);
      } else {
        weeklyTimeBucketsColl = coll;
        resolve();
      }
    });
  })
  return prom;
}

let monthlyTimeBucketsColl;
function getMonthlyTimeBucketsColl() {
  const prom = new Promise(function(resolve,reject) {
    db.collection('time_buckets_for_daily_views', {}, (err, coll) => {
      if (err !== null) {
        reject(err);
      } else {
        monthlyTimeBucketsColl = coll;
        resolve();
      }
    });
  })
  return prom;
}

let yearlyTimeBucketsColl;
function getYearlyTimeBucketsColl() {
  const prom = new Promise(function(resolve,reject) {
    db.collection('time_buckets_for_daily_views', (err, coll) => {
      if (err !== null) {
        reject(err);
      } else {
        yearlyTimeBucketsColl = coll;
        resolve();
      }
    });
  })
  return prom;
}

function getTimeBucketsCollections() {
  return Promise.all([
    getDailyTimeBucketsColl(),
    getWeeklyTimeBucketsColl(),
    getMonthlyTimeBucketsColl(),
    getYearlyTimeBucketsColl(),
  ]);
}

let approvalLogColl;
function getApprovalLogColl() {
  const prom = new Promise(function(resolve,reject) {
    db.collection('approvalLog', {}, (err, coll) => {
      if (err !== null) {
        reject(err);
      } else {
        approvalLogColl = coll;
        resolve();
      }
    });
  })
  return prom;
}

let articleColl;
function getArticleColl() {
  const prom = new Promise(function(resolve,reject) {
    db.collection('article', {}, (err, coll) => {
      if (err !== null) {
        reject(err);
      } else {
        articleColl = coll;
        resolve();
      }
    });
  });
  return prom;
}

let db;
function getDb() {
  const prom = new Promise(function(resolve,reject) {
    MongoClient.connect(MONGO_URI, (err, database) => {
      if (err !== null) {
        reject(err);
      } else {
        db = database;
        resolve();
      }
    });
  })
  return prom;
}

let userColl;
function getUserColl() {
  const prom = new Promise(function(resolve,reject) {
    db.collection('user', {}, (err, coll) => {
      if (err !== null) {
        reject(err);
      } else {
        userColl = coll;
        resolve();
      }
    });
  })
  return prom;
}

let viewsColl;
function getViewsColl() {
  const prom = new Promise(function(resolve,reject) {
    db.collection('views', {}, (err, coll) => {
      if (err !== null) {
        reject(err);
      } else {
        viewsColl = coll;
        resolve();
      }
    });
  })
  return prom;
}

/***************************************************************************/
getDb().then(function(){Promise.all([
  getApprovalLogColl(),
  getArticleColl(),
  getAuthenticatedFlagsColl(),
  getUserColl(),
  getViewsColl(),
  getTimeBucketsCollections(),
])}).then(function() {
  console.log("creating indexes for bestArticlesJSON");
  articleColl.createIndex(
    {category: 1, firstApprovedAt: 1, upvoteScore: 1},
    MONGO_OPTIONS
  ).then(function(result) {
    console.log("index created for bestArticleJSON");
  }).catch(function(err) {
    handleError(err);
  });

  articleColl.createIndex(
    {firstApprovedAt: 1, upvoteScore: 1},
    MONGO_OPTIONS
  ).then(function(result) {
    console.log("index created for bestArticleJSON");
  }).catch(function(err) {
    handleError(err);
  });
  /***************************************************************************/
  console.log("creating index for getArticleFlags");//TODO
  authFlagsColl.createIndex(
    {articleId: 1, _id: -1},
    MONGO_OPTIONS
  ).then(function(result) {
    console.log("index created for getArticleFlags");
  }).catch(function(err) {
    handleError(err);
  });
  /***************************************************************************/
  console.log("creating index for getArticleJSON");
  viewsColl.createIndex(
    {articleId: 1, ipAddress: 1},
    MONGO_OPTIONS
  ).then(function(result) {
    console.log("index created for " + 'getArticleJSON');
  }).catch(function(err) {
    handleError(err);
  });
  /***************************************************************************/
  console.log("creating index for getMostRecentArticlesJSON");
  articleColl.createIndex(
    {category: 1, _id: 1},
    MONGO_OPTIONS
  ).then(function(result) {
    console.log("index created for getMostRecentArticlesJSON");
  }).catch(function(err) {
    handleError(err);
  });
  /***************************************************************************/
  console.log("creating index for getMyApprovalHistoryJSON");
  approvalLogColl.createIndex(
    {approverFbId: 1, _id: 1},
    MONGO_OPTIONS
  ).then(function(result) {
    console.log("index created for getMyApprovalHistoryJSON");
  }).catch(function(err) {
    handleError(err);
  });
  /***************************************************************************/
  console.log("creating index for getNeedApprovalArticlesJSON");
  articleColl.createIndex(
    {approval: 1, _id: 1},
    MONGO_OPTIONS
  ).then(function(result) {
    console.log("index created for getNeedApprovalArticlesJSON");
  }).catch(function(err) {
    handleError(err);
  });
  /***************************************************************************/
  console.log("creating index for getUserInfoJSON");
  userColl.createIndex(
    {fbId: 1},
    MONGO_OPTIONS
  ).then(function(result) {
    console.log("index created for getUserInfoJSON");
  }).catch(function(err) {
    handleError(err);
  });
  /***************************************************************************/

  console.log("creating indexes for getMostViewedArticlesJSON");
  // Note: updateSummaries is counting on these indexes being created here rather than duplicating them.
  const indexDocs1 = [
    {'category': 1, 'daily_views.views': 1 },
    {'category': 1, 'weekly_views.views': 1 },
    {'category': 1, 'monthly_views.views': 1 },
    {'category': 1, 'yearly_views.views': 1 },
    {'category': 1, 'all_time_views': 1 },
    {'daily_views.views': 1 },
    {'weekly_views.views': 1 },
    {'monthly_views.views': 1 },
    {'yearly_views.views': 1 },
    {'all_time_views': 1 },
  ];
  for (let i=0; i < indexDocs1.length; i++) {
    articleColl.createIndex(
      indexDocs1[i],
      MONGO_OPTIONS
    ).then(function(result) {
      console.log("index created for getMostViewedArticlesJSON");
    }).catch(function(err) {
      handleError(err);
    });
  }
  /***************************************************************************/
  console.log("creating index for postFlaggedArticles");
  articleColl.createIndex(
    {flaginess: 1},
    MONGO_OPTIONS
  ).then(function(result) {
    console.log("index created for postFlaggedArticles");
  }).catch(function(err) {
    handleError(err);
  });
  /***************************************************************************/
  console.log("creating indexes for updateSummaries");
  const timeBucketsCollections = [
    dailyTimeBucketsColl,
    weeklyTimeBucketsColl,
    monthlyTimeBucketsColl,
    yearlyTimeBucketsColl
  ];

  //Note, updatePopularities is counting on these indexes being created here rather than duplicating them.
  for (let i=0; i < timeBucketsCollections.length; i++) {
    const tbColl = timeBucketsCollections[i];
    tbColl.createIndex(
      {articleId: 1, timeBucket: 1},
      MONGO_OPTIONS
    ).then(function(result) {
      console.log("time bucket index created");
    }).catch(function(err) {
      handleError(err);
    });
  }

  // These are already created for getMostViewedArticlesJSON
  //{'category': 1, 'daily_views.views': 1 },
  //{'category': 1, 'weekly_views.views': 1 },
  //{'category': 1, 'monthly_views.views': 1 },
  //{'category': 1, 'yearly_views.views': 1 },
  //{'category': 1, 'all_time_views': 1 },
  //{'daily_views.views': 1 },
  //{'weekly_views.views': 1 },
  //{'monthly_views.views': 1 },
  //{'yearly_views.views': 1 },
  //{'all_time_views': 1 },
  /***************************************************************************/
    console.log("creating indexes for updatePopularities");
    // Indexes on {articleId: 1, timeBucket: 1}, for each time bucket collection already done in
    // updateSummaries

    const indexDocs2 = [
      {'daily_views.lastUpdated': 1, 'daily_views.lockedUntil': 1 },
      {'weekly_views.lastUpdated': 1, 'weekly_views.lockedUntil': 1 },
      {'monthly_views.lastUpdated': 1, 'monthly_views.lockedUntil': 1 },
      {'yearly_views.lastUpdated': 1, 'yearly_views.lockedUntil': 1 },
    ];
    for (let i=0; i < indexDocs2.length; i++) {
      articleColl.createIndex(
        indexDocs2[i],
        MONGO_OPTIONS
      ).then(function (result) {
        console.log("index created for updatePopularities");
      }).catch(function (err) {
        handleError(err);
      });
    }
      /***************************************************************************/
}).catch(function(err) {
  handleError(err);
});

