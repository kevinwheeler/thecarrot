import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';
//import Marionette from 'backbone.marionette';

import template from 'TEMPLATESDIR/adminTemplate.hbs';

//export default Marionette.ItemView.extend({
export default Backbone.View.extend({
  // The first few attributes are all standard backbone attributes that can be
  // found in the backbone documentation.
  className: 'kmw-admin-view',

  events: {
  },

  initialize: function(options = {}) {
    this.articleGridView = options.articleGridView;
    this.navView = options.navView;
    this.$el.html(template());
    this.attachSubViews();
  },

  // Attributes below aren't standard backbone attributes. They are custom.
  attachSubViews: function() {
    const $nav = this.$('.NAV-STUB');
    $nav.replaceWith(this.navView.$el);

    const $articleGrid = this.$('.ARTICLE-GRID-STUB');
    $articleGrid.replaceWith(this.articleGridView.$el);
  }
});
