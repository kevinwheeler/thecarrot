const aws = require('aws-sdk');
const getFilenameSlug = require('../slugutil').getFilenameSlug;
const logError = require('../utils').logError;
const getNextId = require('../utils').getNextId;

function getRouteFunction(db) {
  // Rate limit how many requests can come from one ip address.

  function fileTypeIsValid(fileType) {
    const imageMimeTypeRegex = /image\/.*/;
    return fileType.match(imageMimeTypeRegex) !== null;
  }


  const routeFunction = function (req, res, next) {
    getNextId(db, "articleId").then(function(id) {
        const filename = req.query['file-name'];
        const slug = getFilenameSlug(id, filename);
        let sess = req.session;
        sess.articleId = id;
        sess.imageSlug = slug;
        const s3 = new aws.S3();
        const fileType = req.query['file-type'];
        if (!fileTypeIsValid(fileType)) {
          next("In /sign-s3 : File type is invalid");
        }
        const S3_BUCKET = process.env.S3_BUCKET;
        const s3Params = {
          Bucket: S3_BUCKET,
          Key: slug,
          Expires: 60,
          ContentType: fileType
        };
        if (process.env.NODE_ENV === 'development') {
          s3Params.ACL = 'public-read';
        }

        s3.getSignedUrl('putObject', s3Params, (err, data) => {
          if(err){
            logError(err);
            next(err);
            return;
          }
          const returnData = {
            signedRequest: data,
            url: `https://${S3_BUCKET}.s3.amazonaws.com/${slug}`
          };
          res.write(JSON.stringify(returnData));
          res.end();
        });
      }, function(err) {
        logError(err);
        next(err);
      }
    ).then(function(){}, function(err) {
      logError(err);
      next(err);
    });
  };

  return routeFunction;
}

module.exports = getRouteFunction;
