const aws = require('aws-sdk');
const getFilenameSlug = require('../slugutil').getFilenameSlug;
const logError = require('../utils').logError;
const getNextId = require('../utils').getNextId;
const getDimensions = require('image-size');

function getRouteFunction(db) {

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

  const uploadImageToS3 = function(imageSlug, file) {
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

  const addToImageColl = function(imageId, imageSlug, imageWidth, imageHeight) {
    return imageColl.insertOne({//TODO add more fields and stuffs.
      _id: imageId,
      aspectRatio: imageWidth/imageHeight,
      dateCreated: new Date(),
      featured: false,
      height: imageHeight,
      slug: imageSlug,
      width: imageWidth,
    }, {
      w: 'majority'
    });
  }

  const routeFunction = function (req, res, next) {
    const file = req.file;
    const sess = req.session;
    const dimensions = getDimensions(file.buffer);
    const imageWidth = dimensions.width;
    const imageHeight = dimensions.height;
    let imageId;
    let imageSlug;


    let validationErrors = validateParams(file.mimetype, file.size, imageWidth, imageHeight);
    if (validationErrors !== null) {
      res.status(400).send(validationErrors.message);
    } else {
      getNextId(db, "imageId"
      ).then(function(id) {
          sess.imageId = id;
          const filename = file.originalname;
          imageId = id;
          imageSlug = getFilenameSlug(imageId, filename);
        }
      ).then(function() {
          return Promise.all([uploadImageToS3(imageSlug, file), getImageColl()]);
        }
      ).then(function(){addToImageColl(imageId, imageSlug, imageWidth, imageHeight)}
      ).then(function() {
        res.status(200).send();
      }).catch(function(err) {
        logError(err);
        next(err);
      });
    }
  };

  return routeFunction;
}

module.exports = getRouteFunction;
