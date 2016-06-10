import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';
//import Marionette from 'backbone.marionette';

import template from 'TEMPLATESDIR/homeTemplate.hbs';

//export default Marionette.ItemView.extend({
export default Backbone.View.extend({
  className: 'rwc-home-view',

  initialize: function(options = {}) {
    this.views = [];

    this.views.push(options.navView);
    this.navView = options.navView;

   // kmw: http://arturadib.com/hello-backbonejs/docs/1.html
   _.bindAll(this, 'render'); //comment came with code example: fixes loss of context for 'this' within methods
    this.$el.html(template());
    this.attachSubViews();
    this.render();
  },

  render: function() {
    _.forEach(this.views, function(view) {
      view.render();
    });
    return this;
  },

  attachSubViews: function() {
    let $nav = this.$('.NAV-STUB');
    $nav.replaceWith(this.navView.$el);
  },

});
