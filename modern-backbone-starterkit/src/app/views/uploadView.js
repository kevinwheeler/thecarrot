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
  className: 'kmw-upload-view',

  events: {
    'change #kmw-picture-input': 'fileSelected',
    'submit #kmw-article-upload-form': 'onFormSubmitted'
  },

  initialize: function(options = {}) {
    this.navView = options.navView;
    this.$el.html(template());
    this.attachSubViews();
    window.kmwrecaptcha = this.$('.kmw-recaptcha').get(0);
    let recaptchaURL = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoaded&render=explicit';
    // run recaptcha script
    $script(recaptchaURL);
    this.bindToModel();
  },

  // Attributes below aren't standard backbone attributes. They are custom.
  attachSubViews: function() {
    let $nav = this.$('.NAV-STUB');
    $nav.replaceWith(this.navView.$el);
  },

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
    // This event is used by the createSampleData.js file in the migrations directory.
    this.$el.trigger('doneUploading');
    const $target = this.$("#kmw-loading-wheel");
    $target.addClass("kmw-hidden");
  },

  fileSelected: function(e) {
    const files = e.target.files;
    const file = files[0];
    const fileSize = file.size;
    const fiftyMegabytes = 50 * 1000 * 1000;
    console.log(fiftyMegabytes);
    if (file == null) {
      return alert('No file selected.');
    } else if (fileSize > fiftyMegabytes) { // NOTE: if you change this value,
      // you will also need to change it server-side.
      alert("File too big. Files must be smaller than 50 MB.");
    } else {
      this.model.getSignedRequest(file);
    }
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
