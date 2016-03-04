/*
 The aboutView creates a heroView. The heroView needs to be filled with content.
 That's what this view/file that you are reading from right now is for. This view is
 the content that aboutView wants to put in its heroView.
 */
import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';
//import Marionette from 'backbone.marionette';

import template from './aboutHeroContentTemplate.hbs';

//export default Marionette.ItemView.extend({
export default Backbone.View.extend({

  className: 'rwc-home-view-hero-content-view', //TODO: change this to about-view instead of home view

  events: {
    'click .rwc-hero-go': 'submit'
  },

  initialize: function(options = {}) {
    this.options = options;
    this.views = [];
    //kmw: http://arturadib.com/hello-backbonejs/docs/1.html
    _.bindAll(this, 'render'); //comment came with code example: fixes loss of context for 'this' within methods

    this.render();
  },

  template: template,

  render: function() {
    this.$el.html(this.template({}));
    return this;
  }
});
