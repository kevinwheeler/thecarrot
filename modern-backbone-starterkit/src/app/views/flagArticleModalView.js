import $ from 'jquery';
import Backbone from 'backbone';

import Spinner from 'UTILSDIR/spin';
import 'STYLESDIR/stylus/flagArticleModal.css';
import template from 'TEMPLATESDIR/flagArticleModalTemplate.hbs';
import {grecaptchaLoaded, renderElementOnLoad} from 'UTILSDIR/recaptcha'

import 'remodal';
import 'remodalCSS';
import 'remodalTheme';

//export default Marionette.ItemView.extend({
export default Backbone.View.extend({
  className: 'kmw-flag-article-modal-view',

  events: {
    'click .kmw-js-flag-article-done': 'doneClicked',
    'click .kmw-js-flag-article-submit': 'submitClicked'
  },

  initialize: function(options = {}) {
    this.articleId = options.articleId;
    this.$el.attr("data-remodal-id", "kmw-flag-article-modal-view-" + this.articleId);

    this.$el.html(template({
      articleId: this.articleId
    }));

    const recaptchaEl = this.$('.kmw-recaptcha').get(0);
    if (grecaptchaLoaded) {
      window.grecaptcha.render(recaptchaEl, {
        'sitekey': '6LeFjiETAAAAAMLWg5ccuWZCgavMCitFq-C4RpYh' //TODO move this to an environment variable.
      });
    } else {
      renderElementOnLoad(recaptchaEl);
    }
    //TODO do we need to remove this to avoid memory leak?
    this.remodalInst = this.$el.remodal();
  },

  doneClicked: function() {
    this.$('.kmw-js-flag-article-done').addClass('kmw-hidden');
    this.$('.kmw-captcha-and-submit').removeClass('kmw-hidden');

    const url = '/flag-article'; // the script where you handle the form input.

    $.ajax({
      type: "POST",
      url: url,
      data: $(".kmw-js-flag-article-form").serialize(), // serializes the form's elements.
      success: function(data){}
    });
    this.$('.kmw-js-captcha-auth').val("true");
  },

  displayUploadWheel: function() {
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
    const $target = this.$(".kmw-loading-wheel");
    $target.removeClass("kmw-hidden");
    const spinner = new Spinner(opts).spin($target.get(0));

  },

  hideUploadWheel: function() {
    const $target = this.$(".kmw-loading-wheel");
    $target.addClass("kmw-hidden");
  },

  finished: function() {
    this.$('.kmw-not-finished').addClass('kmw-hidden');
    this.$('.kmw-finished').removeClass('kmw-hidden');
  },

  submitClicked: function() {
    var self = this;
    const url = '/flag-article'; // the script where you handle the form input.
    const grecaptchaVal = this.$("[name='g-recaptcha-response']").val();
    if (grecaptchaVal === '') {
      alert("please complete the captcha");
    } else {
      this.displayUploadWheel();
      $.ajax({
        type: "POST",
        url: url,
        data: $(".kmw-js-flag-article-form").serialize(), // serializes the form's elements.
      }).then(
        function(result) {
          self.hideUploadWheel();
          self.finished();
        },
        function(err) {
          self.hideUploadWheel();
          alert("Submission failed.");
        }
      );
    }
  },

  open: function() {
    this.remodalInst.open();
  }
});
