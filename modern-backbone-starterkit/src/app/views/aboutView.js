import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';
//import Marionette from 'backbone.marionette';

import template from 'TEMPLATESDIR/aboutTemplate.hbs';

//export default Marionette.ItemView.extend({
export default Backbone.View.extend({
  initialize: function(options = {}) {
    this.navView = options.navView;
    this.$el.html(template());
    this.attachSubViews();
  },

  className: 'kmw-about-view',

  attachSubViews: function() {
    let $nav = this.$('.NAV-STUB');
    $nav.replaceWith(this.navView.$el);
  },

});
