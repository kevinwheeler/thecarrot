import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';
//import Marionette from 'backbone.marionette';

import template from 'TEMPLATESDIR/articleGridTemplate.hbs';

//export default Marionette.ItemView.extend({
export default Backbone.View.extend({
  className: 'kmw-article-grid-view',

  events: {
  },

  initialize: function(options = {}) {
    // kmw: http://arturadib.com/hello-backbonejs/docs/1.html
    _.bindAll(this, 'render'); //comment came with code example: fixes loss of context for 'this' within methods

    //this.articleCollection = options.articleCollection;

    //this.listenTo(this.articleCollection, 'change add', this.render);

    //this.render();
  },

  render: _.throttle(function() {
      this.$el.html(template({
        articles: this.articleCollection.toJSON(),
        fetchingMoreResults: this.articleCollection.getCurrentlyFetching(),
        noMoreResults: this.articleCollection.getNoMoreResults()
      }));

      return this;
    }, 16
  ),

  fetchMoreResults: function() {
    this.articleCollection.fetchNextArticles();
  },

  setArticleCollection: function(articleCollection) {
    if (this.articleCollection !== undefined) {
      this.stopListening(this.articleCollection);
    }
    this.articleCollection = articleCollection;
    this.listenTo(this.articleCollection, 'change add', this.render);
    this.listenTo(this.articleCollection, 'noMoreResults', this.render);
    this.render();
  }
});
