import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';
//import Marionette from 'backbone.marionette';

import template from 'TEMPLATESDIR/uploadTemplate.hbs';
import $script from 'scriptjs';
import uuid from 'node-uuid';
import Spinner from '../utils/spin';

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

  initialize: function (options = {}) {
    // http://arturadib.com/hello-backbonejs/docs/1.html
    _.bindAll(this, 'render');
    this.views = [];

    this.$el.html(template());
    window.kmwrecaptcha = this.$('.kmw-recaptcha').get(0);
    let recaptchaURL = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoaded&render=explicit';
    $script(recaptchaURL);

    this.render();
  },

  render: function () {
    _.forEach(this.views, function (view) {
      view.render();
    });
    return this;
  },

  // Attributes below aren't standard backbone attributes. They are custom.
  fileSelected: function () {
    console.log("FILE SELECTED");
    const files = document.getElementById('kmw-picture-input').files;
    const file = files[0];
    if (file == null) {
      return alert('No file selected.');
    }
    this.getSignedRequest(file);
  },

  getSignedRequest: function (file) {
    const xhr = new XMLHttpRequest();
    const filenameUUID = uuid.v4();
    document.getElementById('kmw-image-id').value = filenameUUID;
    xhr.open('GET', `/sign-s3?file-name=${filenameUUID}&file-type=${file.type}`);
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          this.uploadFile(file, response.signedRequest, response.url);
        } else {
          //alert('Could not get signed URL.');
          alert('An error was encountered. Please refresh.');
        }
      }
    };
    xhr.send();
  },

  loading: function(){

  },

  doneUploading: function() {
    const $target = this.$("#kmw-loading-wheel");
    $target.addClass("kmw-hidden");
  },

//  loading: function(){
//    const opts = {
//      lines: 12             // The number of lines to draw
//      , length: 7             // The length of each line
//      , width: 5              // The line thickness
//      , radius: 10            // The radius of the inner circle
//      , scale: 1.0            // Scales overall size of the spinner
//      , corners: 1            // Roundness (0..1)
//      , color: '#000'         // #rgb or #rrggbb
//      , opacity: 1/4          // Opacity of the lines
//      , rotate: 0             // Rotation offset
//      , direction: 1          // 1: clockwise, -1: counterclockwise
//      , speed: 1              // Rounds per second
//      , trail: 100            // Afterglow percentage
//      , fps: 20               // Frames per second when using setTimeout()
//      , zIndex: 2e9           // Use a high z-index by default
//      , className: 'spinner'  // CSS class to assign to the element
//      , top: '50%'            // center vertically
//      , left: '50%'           // center horizontally
//      , shadow: false         // Whether to render a shadow
//      , hwaccel: false        // Whether to use hardware acceleration (might be buggy)
//      , position: 'absolute'  // Element positioning
//    }
//    const $target = this.$("#kmw-loading-wheel");
//    $target.removeClass("kmw-hidden");
//    const spinner = new Spinner(opts).spin(target.get(0));
//  },
//
//  doneUploading: function() {
//    const $target = this.$("#kmw-loading-wheel");
//    $target.addClass("kmw-hidden");
//  },

  uploadFile: function(file, signedRequest, url) {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', signedRequest);
    this.loading();
    const self = this;
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          self.doneLoading();
          //document.getElementById('preview').src = url;
          console.log("in callback, url = " + url);
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
