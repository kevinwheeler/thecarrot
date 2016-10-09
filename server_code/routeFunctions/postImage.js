const aws = require('aws-sdk');
const getFilenameSlug = require('../slugutil').getFilenameSlug;
const logError = require('../utils').logError;
const getNextId = require('../utils').getNextId;
const getDimensions = require('image-size');

function getRouteFunction(db) {
  let request;
  let response;
  let next2;
  let imageId;
  let imageSlug;
  let imageWidth;
  let imageHeight;

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

    if (typeof(width) !== "number") {
      validationErrors.push("Image width must be a number.");
    }

    if (width < 200) {
      validationErrors.push("Image width must be at least 200 pixel.");
    }

    if (typeof(height) !== "number") {
      validationErrors.push("Image height must be a number.");
    }

    if (height < 200) {
      validationErrors.push("Image height must be at least 200 pixel.");
    }

    if (validationErrors.length) {
      validationErrors = new Error(JSON.stringify(validationErrors));
      validationErrors.clientError = true;
    } else {
      validationErrors = null;
    }
    return validationErrors;
  }

  const uploadImageToS3 = function(id) {
    imageId = id;
    const file = request.file;
    const filename = file.originalname;
    imageSlug = getFilenameSlug(id, filename);
    let sess = request.session;
    //sess.articleId = id;
    sess.imageId = id;

    const s3 = new aws.S3();
    const S3_BUCKET = process.env.S3_BUCKET;
    const s3Params = {
      Body: file.buffer,
      Bucket: S3_BUCKET,
      ContentType: file.mimetype,
      Key: imageSlug,
    };
    if (process.env.NODE_ENV === 'development') {
      s3Params.ACL = 'public-read';
    }

    return s3.putObject(s3Params).promise();
  }

  const addToImageColl = function() {
    return imageColl.insertOne({//TODO add more fields and stuffs.
      _id: imageId,
      aspectRatio: width/height,
      featured: false,
      height: imageHeight,
      slug: imageSlug,
      width: imageWidth,
    }, {
      w: 'majority'
    });
  }

  const routeFunction = function (req, res, next) {
    request = req;
    response = res;
    next2 = next;
    const file = req.file;
    const dimensions = getDimensions(file.buffer);
    imageWidth = dimensions.width;
    imageHeight = dimensions.height;

    let validationErrors = validateParams(file.mimetype, file.size, imageWidth, imageHeight);
    if (validationErrors !== null) {
      res.status(400).send(validationErrors.message);
    } else {
      getNextId(db, "imageId"
      ).then(uploadImageToS3
      ).then(getImageColl
      ).then(addToImageColl
      ).then(function() {
        res.status(200).send();
      }).catch(function(err) {
        next(err);
      });
    }
  };

  return routeFunction;
}

module.exports = getRouteFunction;
