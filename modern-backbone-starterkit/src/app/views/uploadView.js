import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';
//import Marionette from 'backbone.marionette';

import $script from 'scriptjs';
import Spinner from 'UTILSDIR/spin';
import template from 'TEMPLATESDIR/uploadTemplate.hbs';

import 'STYLESDIR/stylus/upload.css';

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
    'change #kmw-picture-input': 'fileSelected',
    'submit #kmw-article-upload-form': 'onFormSubmitted'
  },

  initialize: function(options = {}) {
    // http://arturadib.com/hello-backbonejs/docs/1.html
    let self = this;
    _.bindAll(this, 'render');
    this.views = [];

    this.$el.html(template());
    window.kmwrecaptcha = this.$('.kmw-recaptcha').get(0);
    let recaptchaURL = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoaded&render=explicit';
    // run recaptcha script
    $script(recaptchaURL);
    this.bindToModel();
    this.render();
  },

  render: function () {
    _.forEach(this.views, function(view) {
      view.render();
    });
    return this;
  },

  // Attributes below aren't standard backbone attributes. They are custom.
  bindToModel: function() {
    let self = this;

    this.listenTo(this.model, "change:imageId ", function() {
      self.$("#kmw-image-id").get(0).value = this.model.get('imageId');
    });

    this.listenTo(this.model, "change:uploading", function() {
      let uploading = self.model.get('uploading');
      if (uploading) {
        self.uploading();
      } else {
        self.doneUploading();
      }
    });
  },

  displayValidationErrors: function(validationErrors) {
    let $validationErrorsContainer = this.$("#kmw-validation-errors");
    $validationErrorsContainer.empty();

    for (let i = 0; i < validationErrors.length; ++i) {
      let validationError = validationErrors[i];
      let errorMessage =
      `<div class="alert alert-danger" role="alert">
        <span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>
        <span class="sr-only">Error:</span>
        ${validationError}
      </div>`;
      $validationErrorsContainer.append(errorMessage);
    }

    console.dir(validationErrors);
  },

  doneUploading: function() {
    const $target = this.$("#kmw-loading-wheel");
    $target.addClass("kmw-hidden");
  },

  fileSelected: function() {
    console.log("FILE SELECTED");
    const files = document.getElementById('kmw-picture-input').files;
    const file = files[0];
    if (file == null) {
      return alert('No file selected.');
    }
    this.model.getSignedRequest(file);
  },

  onFormSubmitted: function(e) {
    this.setModelFields();
    let validationErrors = this.model.validate();
    if (validationErrors) {
      e.preventDefault();
      this.displayValidationErrors(validationErrors);
    }
  },

  setModelFields: function() {
    this.model.set('headline', this.$("#kmw-headline-input").val());
    this.model.set('subline', this.$("#kmw-subline-input").val());
  },

  uploading: function() {
    const opts = {
      lines: 12             // The number of lines to draw
      , length: 7             // The length of each line
      , width: 5              // The line thickness
      , radius: 10            // The radius of the inner circle
      , scale: 1.0            // Scales overall size of the spinner
      , corners: 1            // Roundness (0..1)
      , color: '#000'         // #rgb or #rrggbb
      , opacity: 1/4          // Opacity of the lines
      , rotate: 0             // Rotation offset
      , direction: 1          // 1: clockwise, -1: counterclockwise
      , speed: 1              // Rounds per second
      , trail: 100            // Afterglow percentage
      , fps: 20               // Frames per second when using setTimeout()
      , zIndex: 2e9           // Use a high z-index by default
      , className: 'spinner'  // CSS class to assign to the element
      , top: '50%'            // center vertically
      , left: '50%'           // center horizontally
      , shadow: false         // Whether to render a shadow
      , hwaccel: false        // Whether to use hardware acceleration (might be buggy)
      , position: 'absolute'  // Element positioning
    }
    const $target = this.$("#kmw-loading-wheel");
    $target.removeClass("kmw-hidden");
    const spinner = new Spinner(opts).spin($target.get(0));
  }
});
