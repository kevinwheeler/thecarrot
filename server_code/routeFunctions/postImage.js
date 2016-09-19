const aws = require('aws-sdk');
const getFilenameSlug = require('../slugutil').getFilenameSlug;
const logError = require('../utils').logError;
const getNextId = require('../utils').getNextId;
const getDimensions = require('image-size');

function getRouteFunction(db) {
  // Rate limit how many requests can come from one ip address.

  function fileTypeIsValid(fileType) {
    const imageMimeTypeRegex = /image\/.*/;
    return fileType.match(imageMimeTypeRegex) !== null;
  }

  function validateParams(mimetype, size, width, height) {
    /*
     * TODO make isomorphic.
     * Add validations for image width/height.
     */
    let validationErrors = [];

    if (!fileTypeIsValid(mimetype)) {
      validationErrors.push("File is not an image.");
    }

    const eightMegabytes = 8 * 1000 * 1000;
    if (size >= eightMegabytes) {
      validationErrors.push("Image must smaller than eight megabytes.");
    }

    if (validationErrors.length) {
      validationErrors = new Error(JSON.stringify(validationErrors));
      validationErrors.clientError = true;
    } else {
      validationErrors = null;
    }
    return validationErrors;
  }

  const routeFunction = function (req, res, next) {
    const file = req.file;
    const dimensions = getDimensions(file.buffer);

    let validationErrors = validateParams(file.mimetype, file.size, dimensions.width, dimensions.height);
    if (validationErrors !== null) {
      res.status(400).send(validationErrors.message);
    } else {

      getNextId(db, "articleId").then(function(id) {
          const filename = file.originalname;
          const slug = getFilenameSlug(id, filename);
          let sess = req.session;
          sess.articleId = id;
          sess.imageSlug = slug;
          sess.imageWidth = dimensions.width;
          sess.imageHeight = dimensions.height;

          const s3 = new aws.S3();
          const S3_BUCKET = process.env.S3_BUCKET;
          const s3Params = {
            Body: file.buffer,
            Bucket: S3_BUCKET,
            ContentType: file.mimetype,
            Key: slug,
          };
          if (process.env.NODE_ENV === 'development') {
            s3Params.ACL = 'public-read';
          }

          s3.putObject(s3Params).promise().then(function(result) {
            res.status(200).send();
          }).catch(function(err) {
            next(err);
          });
      }).catch(function(err) {
        next(err);
      });
    }
  };

  return routeFunction;
}

module.exports = getRouteFunction;
