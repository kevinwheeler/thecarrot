// consider this an abstract class. AKA don't initialize instances of this class.
// initialize instances of the subclasses instead.
import Backbone from 'backbone';

import uuid from 'node-uuid';
import articleValidations from 'ISOMORPHICDIR/articleValidations.js';

export default Backbone.Model.extend({
  defaults: {
    headline: null,
    imageId: null,
    uploading: false,
    uploaded: false,
    subline: null
  },

  getSignedRequest: function(file) {
    const xhr = new XMLHttpRequest();
    const filenameUUID = uuid.v4();
    this.set('imageId', filenameUUID);
    this.set('uploaded', false);
    this.set('uploading', true);

    xhr.open('GET', `/sign-s3?file-name=${filenameUUID}&file-type=${file.type}`);
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          this.uploadFile(file, response.signedRequest, response.url, filenameUUID);
        } else {
          alert('An error was encountered. Please refresh.');
        }
      }
    };
    xhr.send();
  },

  uploadFile: function(file, signedRequest, url, filenameUUID) {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', signedRequest);
    //this.loading(); //
    const self = this;
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          // protect against someone uploading a file and then uploading another one before the first finishes.
          console.log("in callback, url = " + url);
          if (this.get('imageId') === filenameUUID) {
            this.set('uploading', false);
            this.set('uploaded', true);
            //self.doneUploading(); TODO
            //document.getElementById('preview').src = url;
            console.log("in callback if");

            //document.getElementById('s3-uploaded-url').value = url;

            // look into having a loading bar as it uploads.
            // enable submit button now.
          }
        } else {
          //alert('Could not upload file.');
          alert('An error has occurred. Please refresh.');
        }
      }
    };
    xhr.send(file);
  },

  validate: function() {
    let validationErrors = articleValidations.validateEverything(this.get('headline'), this.get('subline')) || [];
    if (this.get('uploading')) {
      validationErrors.push("Image not finished uploading.");
    } else if (!this.get('uploaded')) {
      validationErrors.push("No Image uploaded.");
    }
    if (validationErrors.length) {
      return validationErrors;
    }
  }
});
