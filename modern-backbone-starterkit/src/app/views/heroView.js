import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';
//import Marionette from 'backbone.marionette';

import template from './heroTemplate.hbs';

//export default Marionette.ItemView.extend({
export default Backbone.View.extend({
  attachSubViews: function() {
    let $contentContainer = this.$('.rwc-hero-content');
    $contentContainer.append(this.contentView.$el);
  },

  //events: {
  //  'click .rwc-hero-go': 'submit'
  //},

  initialRender: function() {
    this.$el.html(this.template({}));
    this.renderAllSubViews();
    this.attachSubViews();
  },

  initialize: function(options = {}) {
    this.options = options;
    this.views = [];

    this.contentView = options.contentView;
    this.views.append(this.contentView);

    _.bindAll(this, 'render');//kmw: http://arturadib.com/hello-backbonejs/docs/1.html
    this.initialRender();
  },

  template: template,

  render: function() {
    this.renderAllSubViews();
    return this;
  },

  renderAllSubViews: function() {
    _.forEach(this.views, function(view){
      view.render();
    });
  }//,
  //submit: function() {
  //  let $numWordsOrLetters = $('.rwcNumWordsOrLetters').val();
  //  let $WordsOrLetters    = $('.rwcWordsOrLetters').val();
  //  let $rwcFromText = $('.rwcFromText').val();
  //  this.textGeneratorModel.set({
  //    "numWordsOrLetters":  $numWordsOrLetters,
  //    "wordsOrLetters":  $rwcFromText,
  //    "fromText":  $rwcFromText
  //  });
  //  if (!this.textGeneratorModel.isValid()) {
  //    this.displayError(this.textGeneratorModel.validationError);
  //  }
  //},
  //displayError: function(error){
  //  let $errorMessageContainer = this.$el.find('.rwc-js-error-message');
  //  $errorMessageContainer.html(error);
  //  $errorMessageContainer.removeClass('rwc-error-message-is-hidden');
  //  $errorMessageContainer.addClass('rwc-error-message-is-visible');
  //}
});
