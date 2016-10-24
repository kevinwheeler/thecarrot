const aws = require('aws-sdk');
const getFilenameSlug = require('../slugutil').getFilenameSlug;
const logError = require('../utils').logError;
const getNextId = require('../utils').getNextId;
const isomorphicValidations = require('../../modern-backbone-starterkit/src/isomorphic/imageValidations.js');
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

  function validateParams(featureImage, userIsAdmin) {
    /*
     * TODO make isomorphic.
     * Add validations for image width/height.
     */
    let validationErrors = [];

    if (featureImage !== true && featureImage !== false) {
      validationErrors.push("featureImage invalid.");
    }

    if (userIsAdmin !== true && userIsAdmin !== false) {
      validationErrors.push("userIsAdmin invalid.");
    }

    if (featureImage === true && userIsAdmin !== true) {
      validationErrors.push("Trying to feature image, but user isn't an admin or isn't logged in.");
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

  const addToImageColl = function(imageId, imageSlug, imageWidth, imageHeight, featureImage) {
    const aspectRatio = imageWidth/imageHeight;
    const FACEBOOK_RECOMMENDED_ASPECT_RATIO = 1.91;
    const FACEBOOK_RECOMMENDED_MINIMUM_WIDTH = 1200;
    const FACEBOOK_RECOMMENDED_MINIMUM_HEIGHT = 630;
    let doc = {
      _id: imageId,
      aspectRatio: aspectRatio,
      featured: false,
      height: imageHeight,
      userAllowsReusable: false,
      reusableApproval: "pending",
      slug: imageSlug,
      width: imageWidth,
    };
    const delta = Math.abs(aspectRatio - FACEBOOK_RECOMMENDED_ASPECT_RATIO);
    if (delta < .1 && imageWidth >= FACEBOOK_RECOMMENDED_MINIMUM_WIDTH && imageHeight >= FACEBOOK_RECOMMENDED_MINIMUM_HEIGHT ) {
      doc.potentialForReusable = true;
    } else {
      doc.potentialForReusable = false;
    }

    if (featureImage) {
      doc.featured = true;
      doc.reusableApproval = "approved";
      doc.userAllowsReusable = true;
    }

    return imageColl.insertOne(
      doc,
      {
        w: 'majority'
      }
    );
  }

  const routeFunction = function (req, res, next) {
    const file = req.file;
    let featureImage;
    if (req.body.feature_image === "true") {
      featureImage = true;
    } else if (req.body.feature_image === "false") {
      featureImage = false;
    }
    const sess = req.session;
    const userIsAdmin = !!(req.user && req.user.userType === "admin");

    let dimensions;

    try {
      dimensions = getDimensions(file.buffer);
    } catch (err) {
      res.status(400).send("Unable to parse image. Likely invalid image type.");
      return;
    }
    const imageWidth = dimensions.width;
    const imageHeight = dimensions.height;
    let imageId;
    let imageSlug;


    let isomorphicValidationErrors = isomorphicValidations(imageWidth, imageHeight, file.size);
    let otherValidationErrors = validateParams(featureImage, userIsAdmin);

    const validationErrors = isomorphicValidationErrors.concat(otherValidationErrors);

    if (validationErrors.length) {
      res.status(400).send(validationErrors.join(' '));
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
      ).then(function(){addToImageColl(imageId, imageSlug, imageWidth, imageHeight, featureImage)}
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
