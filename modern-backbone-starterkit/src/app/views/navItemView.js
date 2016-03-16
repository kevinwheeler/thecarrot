import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';
//import Marionette from 'backbone.marionette';

import template from './navItemTemplate.hbs';

//export default Marionette.ItemView.extend({
export default Backbone.View.extend({
  className: 'rwc-nav-item',

  initialRender: function() {
    this.$el.html(this.template({
      href: this.options.href,
      urlText: this.options.urlText
    }));
    //this.renderAllSubViews();
    //this.attachSubViews();
  },

  initialize: function(options = {}) {
    this.options = options;
    this.views = [];

    this.initialRender();
    _.bindAll(this, 'render');//kmw: http://arturadib.com/hello-backbonejs/docs/1.html
  },

  tagName: 'li',

  template: template,

  render: function() {
    return this;
  }
});
