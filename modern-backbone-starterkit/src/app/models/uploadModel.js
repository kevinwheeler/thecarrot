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
    agreedToTerms: false,
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

  clearFileSelection: function() {
    this.set('uploaded', false);
    this.set('uploading', false);
    this.set('fileCounter', this.get('fileCounter') + 1);
  },

  uploadFile: function(file) {
    this.set('fileCounter', this.get('fileCounter') + 1);
    const fileCounter = this.get('fileCounter');
    this.set('uploaded', false);
    this.set('uploading', true);

    var formData = new FormData();
    formData.append('image', file);

    const self = this;
    $.ajax({
      url : '/image',
      type : 'POST',
      data : formData,
      processData: false,  // tell jQuery not to process the data
      contentType: false,  // tell jQuery not to set contentType
      success : function(data) {
        // Logic for handling the case where a user uploaded a file and then reselected a file,
        // Makes sure we in the success function for the most recent file.
        if (fileCounter === self.get('fileCounter')) {
          self.set('uploading', false);
          self.set('uploaded', true);
        } else {
        }
      },
      error : function() {
        alert("An error has occured. Please re-select your image.");
      }
    });
  },

  validate: function() {
    let validationErrors = articleValidations.validateEverything(this.get('headline'), this.get('subline'), this.get('category')) || [];

    if (this.get('imageSelectionMethod') === 'unchosen') {
      validationErrors.push("Please upload an image or choose from one of our images.");
    } else if (this.get('imageSelectionMethod') === 'uploadNew') {
      if (this.get('uploading')) {
        validationErrors.push("Image not finished uploading.");
      } else if (!this.get('uploaded')) {
        validationErrors.push("No Image uploaded.");
      }
    } else if (this.get('imageSelectionMethod') === 'previouslyUploaded') {
      let imageId = this.get('imageId');
      if (typeof(imageId) !== "number" || Number.isNaN(imageId)) {
        validationErrors.push("Please select an image.");
      }
    } else {
      alert("An error has occurred. Please refresh the page.")
    }

    if (this.get('agreedToTerms') !== true) {
      validationErrors.push("Must agree to terms.");
    }

    if (!this.get('bypassRecaptcha') && !this.get('captchaCompleted')) {
      validationErrors.push("Captcha not completed");
    }

    if (validationErrors.length) {
      return validationErrors;
    }
  }
});
