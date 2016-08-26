import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';
//import Marionette from 'backbone.marionette';

import template from 'TEMPLATESDIR/adminTemplate.hbs';
import MostRecentArticlesCollection from 'COLLECTIONSDIR/mostRecentArticlesCollection';

//export default Marionette.ItemView.extend({
export default Backbone.View.extend({
  // The first few attributes are all standard backbone attributes that can be
  // found in the backbone documentation.
  className: 'kmw-admin-view',

  events: {
  },

  initialize: function(options = {}) {
    // http://arturadib.com/hello-backbonejs/docs/1.html
    _.bindAll(this, 'render');
    this.views = [];
    this.mostRecentArticlesCollection = new MostRecentArticlesCollection();
    this.mostRecentArticlesCollection.fetchNextArticles();
    this.articleGridView = options.articleGridView;
    this.articleGridView.setArticleCollection(this.mostRecentArticlesCollection);
    //this.userModel = options.userModel;
    //this.listenTo(this.userModel, 'change', this.render);
    this.render();
  },

  render: function () {
    this.$el.html(template({
      //displayName: this.userModel.get('displayName'),
    }));
    this.attachSubViews();
    //_.forEach(this.views, function(view) {
    //  view.render();
    //});
    return this;
  },
  // Attributes below aren't standard backbone attributes. They are custom.
  attachSubViews: function() {
    const $articleGrid = this.$('.ARTICLE-GRID-STUB');
    $articleGrid.replaceWith(this.articleGridView.$el);
  },
});
