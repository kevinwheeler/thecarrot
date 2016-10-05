import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';
//import Marionette from 'backbone.marionette';

import template from 'TEMPLATESDIR/homeTemplate.hbs';
import 'STYLESDIR/stylus/home.css';

//export default Marionette.ItemView.extend({
export default Backbone.View.extend({
  className: 'kmw-home-view',

  initialize: function(options = {}) {
    this.navView = options.navView;
    //this.mostRecentPopularToggleView = options.mostRecentPopularToggleView;
    this.articleGridView = options.articleGridView;
  },

  render: function() {
    this.$el.children().detach();
    this.$el.html(template());
    this.attachSubViews();
  },

  beforeRoute: function() {
    this.mostRecentPopularToggleView.beforeRoute();
  },

  attachSubViews: function() {
    const $nav = this.$('.NAV-STUB');
    $nav.replaceWith(this.navView.$el);

    const $articleGrid = this.$('.ARTICLE-GRID-STUB');
    $articleGrid.replaceWith(this.articleGridView.$el);
  },
});
