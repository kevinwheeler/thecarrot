import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';
//import Marionette from 'backbone.marionette';

import template from 'TEMPLATESDIR/uploadTemplate.hbs';
import $script from 'scriptjs';
import uuid from 'node-uuid';

window.onRecaptchaLoaded = function() {
  window.grecaptcha.render(window.kmwrecaptcha, {
    'sitekey': '6LeFjiETAAAAAMLWg5ccuWZCgavMCitFq-C4RpYh'
  });
};

//export default Marionette.ItemView.extend({
export default Backbone.View.extend({
  // The first few attributes are all standard backbone attributes that can be
  // found in the backbone documentation.
  className: 'rwc-home-view',

  events: {
    'change #kmw-picture-input': 'fileSelected'
  },

  initialize: function(options = {}) {
    // http://arturadib.com/hello-backbonejs/docs/1.html
    _.bindAll(this, 'render');
    this.views = [];

    this.$el.html(template());
    window.kmwrecaptcha = this.$('.kmw-recaptcha').get(0);
    let recaptchaURL = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoaded&render=explicit';
    $script(recaptchaURL);


    this.render();
  },

  render: function() {
    _.forEach(this.views, function(view) {
      view.render();
    });
    return this;
  },

  // Attributes below aren't standard backbone attributes. They are custom.
  fileSelected: function() {
    console.log("FILE SELECTED");
    const files = document.getElementById('kmw-picture-input').files;
    const file = files[0];
    if(file == null) {
      return alert('No file selected.');
    }
    this.getSignedRequest(file);
  },

  getSignedRequest: function(file) {
    const xhr = new XMLHttpRequest();
    const filenameUUID = uuid.v4();
    xhr.open('GET', `/sign-s3?file-name=${filenameUUID}&file-type=${file.type}`);
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          this.uploadFile(file, response.signedRequest, response.url);
        } else {
          //alert('Could not get signed URL.');
          alert('An error has occurred. Please refresh.');
        }
      }
    };
    xhr.send();
  },

  uploadFile: function(file, signedRequest, url) {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', signedRequest);
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          //document.getElementById('preview').src = url;
          document.getElementById('s3-uploaded-url').value = url;
          // look into having a loading bar as it uploads.
          // enable submit button now.
        } else {
          //alert('Could not upload file.');
          alert('An error has occurred. Please refresh.');
        }
      }
    };
    xhr.send(file);
  }
});
