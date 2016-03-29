import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';
//import Marionette from 'backbone.marionette';

import template from './navTemplate.hbs';

//export default Marionette.ItemView.extend({
export default Backbone.View.extend({
  className: 'rwc-nav navbar',

  collapse: function() {
    this.$('#rwc-nav-collapse').collapse('hide');
  },

  initialRender: function() {
    this.$el.html(this.template());
    let $navItemsStub = this.$('.nav-items-stub');
    let navItemElements = [];
    _.forEach(this.options.navItems, function(nItem){
      navItemElements.push(nItem.$el);
    });
    $navItemsStub.replaceWith(navItemElements);
    //this.renderAllSubViews();
    //this.attachSubViews();
  },

  initialize: function(options = {}) {
    this.options = options;
    this.views = [];
    _.bindAll(this, 'collapse', 'render');//kmw: http://arturadib.com/hello-backbonejs/docs/1.html
    //TODO add nav item views to views array

    console.log("options = ");
    console.dir(options);
    this.listenTo(options.routerEvents, 'routed', this.collapse);

    this.initialRender();
    _.bindAll(this, 'collapse', 'render');//kmw: http://arturadib.com/hello-backbonejs/docs/1.html
  },

  tagName: 'nav',

  template: template,

  render: function() {
    //TODO render sub views
    return this;
  }
});
