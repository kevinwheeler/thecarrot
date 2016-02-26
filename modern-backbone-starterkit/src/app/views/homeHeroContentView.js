/*
 The homeView creates a heroView. The heroView needs to be filled with content.
 That's what this view is. This view is the content that homeView wants to put in
 its heroView.
 */
import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';
//import Marionette from 'backbone.marionette';

import template from './homeHeroContentTemplate.hbs';

//export default Marionette.ItemView.extend({
export default Backbone.View.extend({

  events: {
    'click .rwc-hero-go': 'submit'
  },

  initialize: function(options = {}) {
    this.options = options;
    this.views = [];
    this.textGeneratorModelInst = options.textGeneratorModelInst;
    //kmw: http://arturadib.com/hello-backbonejs/docs/1.html
    _.bindAll(this, 'render'); //comment came with code example: fixes loss of context for 'this' within methods

    this.render();
  },

  template: template,

  render: function() {
    this.$el.html(this.template({}));
    return this;
  },

  submit: function() {
    let $numWordsOrLetters = $('.rwcNumWordsOrLetters').val();
    let $WordsOrLetters    = $('.rwcWordsOrLetters').val();
    let $rwcFromText = $('.rwcFromText').val();
    this.textGeneratorModelInst.set({
      "numWordsOrLetters":  $numWordsOrLetters,
      "wordsOrLetters":  $rwcFromText,
      "fromText":  $rwcFromText
    });
    if (!this.textGeneratorModelInst.isValid()) {
      this.displayError(this.textGeneratorModelInst.validationError);
    }
  },

  displayError: function(error) {
    let $errorMessageContainer = this.$el.find('.rwc-js-error-message');
    $errorMessageContainer.html(error);
    $errorMessageContainer.removeClass('rwc-error-message-is-hidden');
    $errorMessageContainer.addClass('rwc-error-message-is-visible');
  }
});
