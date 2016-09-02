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
    this.selectableArticleGridView = options.selectableArticleGridView;
    this.$el.html(template());
    this.attachSubViews();
  },

  // Attributes below aren't standard backbone attributes. They are custom.
  attachSubViews: function() {
    const $articleGrid = this.$('.ARTICLE-GRID-STUB');
    $articleGrid.replaceWith(this.selectableArticleGridView.$el);
  }
});
