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

import validateImage from 'ISOMORPHICDIR/imageValidations';

import 'STYLESDIR/stylus/upload.css';


//export default Marionette.ItemView.extend({
export default Backbone.View.extend({
  // The first few attributes are all standard backbone attributes that can be
  // found in the backbone documentation.
  //className: 'kmw-upload-view',

  events: {
    'kmwChange #kmw-bypass-recaptcha-secret': 'recaptchaSecretChanged',
    'submit form': 'onFormSubmitted',
    "change textarea.[name='g-recaptcha-response']": 'grecaptchaChanged',
    "change #kmw-image-id": 'imageIdChanged',

    "click .kmw-breadcrumb-main": "breadcrumbMainClicked",
    "click .kmw-choose-upload": "chooseUpload",
    "click .kmw-choose-select": "chooseSelect",

    "click .kmw-picture-next": "openHeadlineTab",
    "click #kmw-headline-next": "openSublineTab",
    "click #kmw-subline-next": "openCreditTab",
    "click #kmw-credit-next": "openTermsTab",

    "change #kmw-picture-input": "pictureInputChanged",

    "click .kmw-image-search-go": "imageSearch",
  },

  initialize: function(options = {}) {
    _.bindAll(this, ['headlineChanged', 'sublineChanged', 'onGrecaptchaSuccessful', 'onGrecaptchaRendered']);
    this.navView = options.navView;
    this.pictureSelectView = options.pictureSelectView;
    this.postAnonymouslyView = options.postAnonymouslyView;
    this.isAdminRoute = options.isAdminRoute;
    this.$el.children().detach();
    this.$el.html(template({
      categories: categories,
      headlineSrc: window.kmw.imageBaseUrl + 'static/article-headline.jpg',
      imageSrc: window.kmw.imageBaseUrl + 'static/article-image.jpg',
      isAdminRoute: this.isAdminRoute,
      sublineSrc: window.kmw.imageBaseUrl + 'static/article-subline.jpg',
    }));
    this.setupDragEvents();
    $("#kmw-headline-input").on("change keyup paste", this.headlineChanged);
    $("#kmw-subline-input").on("change keyup paste", this.sublineChanged);

    this.attachSubViews();

    this.$('#accordion').accordion({
      heightStyle: "content"
    });

    const recaptchaEl = this.$('.kmw-recaptcha').get(0);
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

    let $pictureSelect = this.$('.PICTURE-SELECT-STUB');
    $pictureSelect.replaceWith(this.pictureSelectView.$el);

    let $postAnonymously = this.$('.POST-ANONYMOUSLY-STUB');
    $postAnonymously.replaceWith(this.postAnonymouslyView.$el);
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
    const $uploading = this.$(".kmw-image-uploading");
    $uploading.addClass("kmw-hidden");
    const $target = this.$("#kmw-loading-wheel");
    $target.addClass("kmw-hidden");
  },

  headlineChanged() {
    const $headline = this.$("#kmw-headline-input");
    $headline.val($headline.val().replace(/\n/g, '')); // Remove any newlines.
    const headlineLength = $headline.val().length;
    const $numLettersWrapper = this.$(".headline-num-letters-wrapper");
    $numLettersWrapper.find(".headline-num-letters").html(headlineLength);
    if (headlineLength < 100) {
      $numLettersWrapper.removeClass("kmw-medium-length");
      $numLettersWrapper.removeClass("kmw-long-length");
    } else if (headlineLength < 150) {
      $numLettersWrapper.addClass("kmw-medium-length");
      $numLettersWrapper.removeClass("kmw-long-length");
    } else {
      $numLettersWrapper.removeClass("kmw-medium-length");
      $numLettersWrapper.addClass("kmw-long-length");
    }

  },

  imageIdChanged: function() {
    this.model.set('imageId', parseInt(this.$("#kmw-image-id").val(), 10));
  },

  imageSearch: function(e) {
    const searchTerms = $("#kmw-image-search-terms").val().replace(/\s+/g, "+");
    const googleURL = `https://www.google.com/search?q=${searchTerms}&tbm=isch&tbs=isz:ex,iszw:1200,iszh:630`;
    var win = window.open(googleURL, '_blank');
    win.focus();
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
    if (validationErrors) {
      this.displayValidationErrors(validationErrors);
      return false;
    }
  },

  openCreditTab: function() {
    this.$("#kmw-post-anonymously-tab").click();
  },

  openHeadlineTab: function() {
    this.$("#kmw-headline-tab").click();
  },

  openSublineTab: function() {
    this.$("#kmw-subline-tab").click();
  },

  openTermsTab: function() {
    this.$("#kmw-terms-tab").click();
  },

  recaptchaSecretChanged: function() {
    this.model.set('bypassRecaptcha', true);
  },

  setModelFields: function() {
    this.model.set('category', this.$("#kmw-category-select").val());
    this.model.set('headline', this.$("#kmw-headline-input").val());
    this.model.set('subline', this.$("#kmw-subline-input").val());
    //if (this.model.get('imageSelectionMethod') === 'previouslyUploaded') {
    //  this.model.set('imageId', parseInt(this.$("#kmw-image-id").val(), 10));
    //}
    let $agreeCheckbox = this.$('#kmw-agree');
    if ($agreeCheckbox[0].checked) {
      this.model.set('agreedToTerms', true);
    } else {
      this.model.set('agreedToTerms', false);
    }
  },

  setupDragEvents: function() {
      const self = this;
      const $imageDragArea = this.$(".image-drag-area");
      $imageDragArea.on('drag dragstart dragend dragover dragenter dragleave drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
      })
      .on('dragover dragenter', function() {
        $imageDragArea.addClass('is-dragover');
      })
      .on('dragleave dragend drop', function() {
        $imageDragArea.removeClass('is-dragover');
      })
      .on('drop', function(e) {
        const file = e.originalEvent.dataTransfer.files[0];
        self.imageSelected(file);
      });
  },

  sublineChanged() {
    const $subline = $("#kmw-subline-input");
    $subline.val($subline.val().replace(/\n/g, '')); // Remove any newlines.
    const sublineLength = $subline.val().length;
    const $numLettersWrapper = this.$(".subline-num-letters-wrapper");
    $numLettersWrapper.find(".subline-num-letters").html(sublineLength);
    if (sublineLength < 100) {
      $numLettersWrapper.removeClass("kmw-medium-length");
      $numLettersWrapper.removeClass("kmw-long-length");
    } else if (sublineLength < 150) {
      $numLettersWrapper.addClass("kmw-medium-length");
      $numLettersWrapper.removeClass("kmw-long-length");
    } else {
      $numLettersWrapper.removeClass("kmw-medium-length");
      $numLettersWrapper.addClass("kmw-long-length");
    }
  },

  // Display an image preview for the image they just selected.
  pictureInputChanged: function(e) {
    const input = e.target;
    if (input.files && input.files[0]) {
      this.imageSelected(input.files[0]);
    }
  },

  imageSelected: function(file) {
    const filename = file.name;
    // http://stackoverflow.com/a/12900504
    const extension = filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
    // A subset of the types supported by the image-size library used server-side.
    if (extension.match(/bmp/i)  ||
        extension.match(/gif/i)  ||
        extension.match(/jpg/i)  ||
        extension.match(/jpeg/i) ||
        extension.match(/png/i)  ||
        extension.match(/svg/i)
    ) {
      const self = this;
      var reader = new FileReader();

      reader.onload = function (e) {
        var img = new Image;
        img.onload = function() {
          const validationErrors = validateImage(img.width, img.height, file.size);
          if (validationErrors.length) {
            alert(validationErrors.join('\n'));
          } else {
            const featureImage = self.isAdminRoute;
            self.model.uploadFile(file, featureImage);

            const $imagePreview = $('#kmw-image-preview');
            $imagePreview.attr('src', e.target.result);
            $imagePreview.removeClass("no-image-selected");
            $('.image-preview-outer-container').removeClass("no-image-selected");
            $('.image-preview-inner-container').removeClass("no-image-selected");
            $('.drag-image-text').addClass("image-selected");
          }
        };
        img.src = reader.result;

      };

      reader.readAsDataURL(file);

    } else {
      alert("Supported image types: bmp, gif, jpg/jpeg, png, svg.");
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
    const $uploading = this.$(".kmw-image-uploading");
    $uploading.removeClass("kmw-hidden");
    const $target = this.$("#kmw-loading-wheel");
    $target.removeClass("kmw-hidden");
    const spinner = new Spinner(opts).spin($target.get(0));
  }
});
