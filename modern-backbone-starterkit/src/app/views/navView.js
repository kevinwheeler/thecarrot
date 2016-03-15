import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';
//import Marionette from 'backbone.marionette';

import template from './navTemplate.hbs';

//export default Marionette.ItemView.extend({
export default Backbone.View.extend({
  className: 'rwc-nav',

  initialRender: function() {
    this.$el.html(this.template({}));
    //this.renderAllSubViews();
    //this.attachSubViews();
  },

  initialize: function(options = {}) {
    this.options = options;
    this.views = [];

    this.initialRender();
    _.bindAll(this, 'render');//kmw: http://arturadib.com/hello-backbonejs/docs/1.html
  },

  tagName: 'nav',

  template: template,

  render: function() {
    return this;
  }
});
