// consider this an abstract class. AKA don't initialize instances of this class.
// initialize instances of the subclasses instead.
import Backbone from 'backbone';

import uuid from 'node-uuid';
import articleValidations from 'ISOMORPHICDIR/articleValidations.js';

// TODO what if someone selects a file and then selects another one quickly such that
// the order the are sent to the server gets messed up?
export default Backbone.Model.extend({
  // The first few attributes are standard backbone attributes. You can read about them in the docs.
  defaults: {
    captchaCompleted: false,
    fileCounter: 0,
    headline: null,
    imageId: null,
    uploading: false,
    uploaded: false,
    subline: null
  },

  initialize: function() {
  },

  // Attributes below aren't standard backbone attributes. They are custom.
  getSignedRequest: function(file) {
    const xhr = new XMLHttpRequest();
    //const filenameId = this.fileCounter;
    this.set('fileCounter', this.get('fileCounter') + 1);
    const fileCounter = this.get('fileCounter');
    //this.set('imageId', filenameId);
    this.set('uploaded', false);
    this.set('uploading', true);

    const self = this;
    xhr.open('GET', `/sign-s3?file-name=${file.name}&file-type=${file.type}`);
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          this.uploadFile(file, response.signedRequest, response.url, fileCounter);
        } else {
          alert('An error was encountered. Please refresh.');
        }
      }
    };
    xhr.send();
  },

  uploadFile: function(file, signedRequest, url, fileCounter) {
    const xhr = new XMLHttpRequest();
    const self = this;
    xhr.open('PUT', signedRequest);
    //this.loading();
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          console.log("self filecounter = " + self.get('fileCounter'));
          console.log("filecounter = " + fileCounter);
          // protect against someone uploading a file and then uploading another one before the first finishes.
          if (self.get('fileCounter') === fileCounter) {
            this.set('uploading', false);
            this.set('uploaded', true);
          }
        } else {
          alert('An error has occurred. Please refresh.');
        }
      }
    };
    xhr.send(file);
  },

  validate: function() {
    let validationErrors = articleValidations.validateEverything(this.get('headline'), this.get('subline'), this.get('category')) || [];
    if (this.get('uploading')) {
      validationErrors.push("Image not finished uploading.");
    } else if (!this.get('uploaded')) {
      validationErrors.push("No Image uploaded.");
    }

    if (!this.get('captchaCompleted')) {
      validationErrors.push("Captcha not completed");
    }

    if (validationErrors.length) {
      return validationErrors;
    }
  }
});
