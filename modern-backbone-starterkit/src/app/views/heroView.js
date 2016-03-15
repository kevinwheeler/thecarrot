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
    let $nav = this.$('.rwc-nav-stub');
    $nav.replaceWith(this.options.navView.$el);
  },

  className: 'rwcHeroView',

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
    this.views.push(this.contentView);

    this.navView = options.navView;
    this.views.push(this.navView);

    _.bindAll(this, 'render');//kmw: http://arturadib.com/hello-backbonejs/docs/1.html
    this.initialRender();
  },

  template: template,

  render: function() {
    this.renderAllSubViews();
    return this;
  },

  renderAllSubViews: function() {
    _.forEach(this.views, function(view) {
      view.render();
    });
  }

});
