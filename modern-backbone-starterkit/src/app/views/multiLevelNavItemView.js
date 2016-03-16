import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';
//import Marionette from 'backbone.marionette';

import template from './multiLevelNavItemTemplate.hbs';

//export default Marionette.ItemView.extend({
export default Backbone.View.extend({
  attachSubViews: function() {
    let $navItemsStub = this.$('.rwc-nav-items-stub');
    let navItemJQueryElements = [];
    _.forEach(this.options.navItems, function(navItem) {
      navItemJQueryElements.push(navItem.$el);
    });
    $navItemsStub.replaceWith(navItemJQueryElements);
  },

  className: 'rwc-multi-level-nav-item',

  initialRender: function() {
    this.$el.html(this.template({
      href: this.options.href,
      urlText: this.options.urlText
    }));

    this.renderAllSubViews();
    this.attachSubViews();
  },

  initialize: function(options = {}) {
    this.options = options;
    this.views = [];
    var self = this;

    _.forEach(this.options.navItems, function(navItem) {
      self.views.push(navItem);
    })

    this.initialRender();
    _.bindAll(this, 'render');//kmw: http://arturadib.com/hello-backbonejs/docs/1.html
  },

  renderAllSubViews: function(){
    _.forEach(this.options.views, function(view) {
      view.render();
    });
  },

  tagName: 'li',

  template: template,

  render: function() {
    return this;
  }
});
