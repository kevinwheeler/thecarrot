import $ from 'jquery';
import Backbone from 'backbone';

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

  finished: function() {
    this.$('.kmw-not-finished').addClass('kmw-hidden');
    this.$('.kmw-finished').removeClass('kmw-hidden');
  },

  submitClicked: function() {
    const url = '/flag-article'; // the script where you handle the form input.

    $.ajax({
      type: "POST",
      url: url,
      data: $(".kmw-js-flag-article-form").serialize(), // serializes the form's elements.
      success: function(data){}
    });
    this.finished();
  },

  open: function() {
    this.remodalInst.open();
  }
});
