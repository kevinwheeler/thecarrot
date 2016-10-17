import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';
//import Marionette from 'backbone.marionette';

import 'jquery-ui/themes/base/core.css';
import 'jquery-ui/themes/base/theme.css';
import 'jquery-ui/themes/base/accordion.css';
import 'jquery-ui/ui/core';
import 'jquery-ui/ui/widgets/accordion';


import {categories} from 'ISOMORPHICDIR/categories';
import Spinner from 'UTILSDIR/spin';
import template from 'TEMPLATESDIR/uploadTemplate.hbs';
import {renderElementAsync} from 'UTILSDIR/recaptcha'

import 'STYLESDIR/stylus/upload.css';


//export default Marionette.ItemView.extend({
export default Backbone.View.extend({
  // The first few attributes are all standard backbone attributes that can be
  // found in the backbone documentation.
  //className: 'kmw-upload-view',

  events: {
    'kmwChange #kmw-bypass-recaptcha-secret': 'recaptchaSecretChanged',
    'change #kmw-picture-input': 'fileSelected',
    'submit form': 'onFormSubmitted',
    "change textarea.[name='g-recaptcha-response']": 'grecaptchaChanged',

    "click .kmw-breadcrumb-main": "breadcrumbMainClicked",
    "click .kmw-choose-upload": "chooseUpload",
    "click .kmw-choose-select": "chooseSelect",
  },

  initialize: function(options = {}) {
    this.navView = options.navView;
    this.$el.children().detach();
    this.$el.html(template({
      categories: categories,
      imageHref: window.kmw.imageBaseUrl + 'static/article-image.jpg',
      headlineHref: window.kmw.imageBaseUrl + 'static/article-headline.jpg',
      sublineHref: window.kmw.imageBaseUrl + 'static/article-subline.jpg',
    }));
    this.$('#accordion').accordion({
      heightStyle: "content"
    });
    this.attachSubViews();
    const recaptchaEl = this.$('.kmw-recaptcha').get(0);
    _.bindAll(this, 'onGrecaptchaSuccessful', 'onGrecaptchaRendered');
    renderElementAsync(recaptchaEl, this.onGrecaptchaSuccessful, this.onGrecaptchaRendered);
    this.bindToModel();

    this.model.set('imageSelectionMethod', 'unchosen');
    this.checkIfCookiesAreEnabled();
  },

  // http://stackoverflow.com/a/8112653
  areCookiesEnabled: function() {
    var cookieEnabled = (navigator.cookieEnabled) ? true : false;

    if (typeof navigator.cookieEnabled == "undefined" && !cookieEnabled)
    {
      document.cookie="testcookie";
      cookieEnabled = (document.cookie.indexOf("testcookie") != -1) ? true : false;
    }
    return (cookieEnabled);
  },

  // Attributes below aren't standard backbone attributes. They are custom.
  attachSubViews: function() {
    let $nav = this.$('.NAV-STUB');
    $nav.replaceWith(this.navView.$el);
  },

  bindToModel: function() {
    let self = this;

    //this.listenTo(this.model, "change:imageId ", function() {
    //  self.$("#kmw-image-id").get(0).value = this.model.get('imageId');
    //});

    this.listenTo(this.model, "change:uploading", function() {
      let uploading = self.model.get('uploading');
      if (uploading) {
        self.uploading();
      } else {
        self.doneUploading();
      }
    });
  },

  breadcrumbMainClicked: function() {
    this.displayPictureDefault();
    this.model.set('imageSelectionMethod', 'unchosen');
    this.$('#kmw-image-selection-method').val('unchosen');
  },

  checkIfCookiesAreEnabled: function() {
    if (!this.areCookiesEnabled()) {
      alert("Cookies must be enabled in order for this site to work properly.");
    }
  },

  chooseSelect: function() {
    this.displayPictureSelect();
    this.model.set('imageSelectionMethod', 'previouslyUploaded');
    this.$('#kmw-image-selection-method').val('previouslyUploaded');
  },

  chooseUpload: function() {
    this.displayPictureUpload();
    this.model.set('imageSelectionMethod', 'uploadNew');
    this.$('#kmw-image-selection-method').val('uploadNew');
  },

  displayPictureDefault: function() {
    this.$('.kmw-picture-default').removeClass('kmw-hidden');
    this.$('.kmw-picture-upload').addClass('kmw-hidden');
    this.$('.kmw-picture-select').addClass('kmw-hidden');

    this.$('.kmw-arrow').addClass('kmw-hidden');
    this.$('.kmw-breadcrumb-select').addClass('kmw-hidden');
    this.$('.kmw-breadcrumb-upload').addClass('kmw-hidden');
  },

  displayPictureSelect: function() {
    this.$('.kmw-picture-default').addClass('kmw-hidden');
    this.$('.kmw-picture-select').removeClass('kmw-hidden');

    this.$('.kmw-arrow').removeClass('kmw-hidden');
    this.$('.kmw-breadcrumb-select').removeClass('kmw-hidden');
  },

  displayPictureUpload: function() {
    this.$('.kmw-picture-default').addClass('kmw-hidden');
    this.$('.kmw-picture-upload').removeClass('kmw-hidden');

    this.$('.kmw-arrow').removeClass('kmw-hidden');
    this.$('.kmw-breadcrumb-upload').removeClass('kmw-hidden');

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
      this.$('#accordion').accordion("refresh");
    }

  },

  doneUploading: function() {
    const $doneUploading = $('<div id="kmw-done-uploading" style="display: none"></div>');
    this.$el.append($doneUploading);
    // This event is used by the createSampleData.js file in the migrations directory.
    //this.$el.trigger('doneUploading');
    const $target = this.$("#kmw-loading-wheel");
    $target.addClass("kmw-hidden");
  },

  fileSelected: function(e) {
    const files = e.target.files;
    if (files.length === 0) {
      this.model.clearFileSelection();
    } else {
      const file = files[0];
      const eightMegabytes = 8 * 1000 * 1000;
      const fileSize = file.size;
      if (fileSize >= eightMegabytes) {
        alert("File too big. Files must be smaller than 8 MB.");
      } else {
        //this.model.getSignedRequest(file);
        this.model.uploadFile(file);
      }
    }
  },

  onGrecaptchaRendered: function() {
    this.$('#accordion').accordion("refresh");
  },

  onGrecaptchaSuccessful: function() {
    this.model.set('captchaCompleted', true);
  },

  onFormSubmitted: function(e) {
    this.setModelFields();
    let validationErrors = this.model.validate();
    console.log("in on form submitted");
    if (validationErrors) {
      console.log("in if");
      this.displayValidationErrors(validationErrors);
      return false;
    }
  },

  recaptchaSecretChanged: function() {
    this.model.set('bypassRecaptcha', true);
  },

  setModelFields: function() {
    this.model.set('category', this.$("#kmw-category-select").val());
    this.model.set('headline', this.$("#kmw-headline-input").val());
    this.model.set('subline', this.$("#kmw-subline-input").val());
    if (this.model.get('imageSelectionMethod') === 'previouslyUploaded') {
      this.model.set('imageId', parseInt(this.$("#kmw-image-id").val(), 10));
    }
    let $agreeCheckbox = this.$('#kmw-agree');
    if ($agreeCheckbox[0].checked) {
      this.model.set('agreedToTerms', true);
    } else {
      this.model.set('agreedToTerms', false);
    }
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
