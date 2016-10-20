// TODO removed the  updateSummarries, need to double check that everything is right.
// Might as well clean up promise code while we are at it.
const logError = require('../utils').logError;

function getRouteFunction(db) {
  const getNextImageApprovalLogId = require('../utils').getNextId.bind(null, db, "imageApprovalLogId");

  let imageColl;
  function getImageColl() {
    const prom = new Promise(function(resolve,reject) {
      db.collection('image', {}, (err, coll) => {
        if (err !== null) {
          reject(err);
        } else {
          imageColl = coll;
          resolve();
        }
      });
    })
    return prom;
  }

  function setApproval (approvalVerdict, imageId, approverFbId) {
    let articleColl;
    let imageApprovalLogColl;

    function getImageApprovalLogColl() {
      const prom = new Promise(function(resolve,reject) {
        db.collection('imageApprovalLog', (err, coll) => {
          if (err !== null) {
            reject(err);
          } else {
            imageApprovalLogColl = coll;
            resolve();
          }
        });
      })
      return prom;
    }

    const prom = new Promise(function(resolve, reject) {
      getImageColl(
      ).then(
        getImageApprovalLogColl
      ).then(
        getNextImageApprovalLogId
      ).then(
        function insertApprovalLogEntry(id) {
          return imageApprovalLogColl.insertOne(
            {
              _id: id,
              approverFbId: approverFbId,
              imageId: imageId,
              timestamp: new Date(),
              verdict: approvalVerdict
            },
            {
              w: 'majority'
            }
          )
        }
      ).then(function updateImageApproval() {
        return imageColl.updateOne(
          {
            _id: imageId
          },
          {
            $set: {reusableApproval: approvalVerdict},
          },
          {
            w: 'majority',
          }
        );
      }).then(function success() {
        resolve();
      }).catch(function(err) {
        reject(err);
      });
    });
    return prom;
  };

  const routeFunction = function (req, res, next) {
    if (req.user && req.user.userType === 'admin') {
      const IDs = req.body['image_ids'];
      const redirectUrl = '/admin/need-approval-images';//req.body['redirect_url'];
      if (IDs === undefined) {
        res.status(403).send("You must select at least one article.");
      } else {
        const approverFbId = req.user.fbId
        const approvalVerdict = req.body['approval_verdict'];
        const promises = [];
        for (let i=0; i < IDs.length; i++) {
          const imageID = parseInt(IDs[i], 10);
          promises.push(setApproval(approvalVerdict, imageID, approverFbId, res, next));
        }
        Promise.all(promises).then(
          function(result) {
            res.redirect(redirectUrl);
          },
          function(err){
            logError(err);
            next(err);
          }
        );
      }
    } else {
      res.status(403).send('You are not an admin or are not logged in.');
    }
  };

  return routeFunction;
}

module.exports = getRouteFunction;
