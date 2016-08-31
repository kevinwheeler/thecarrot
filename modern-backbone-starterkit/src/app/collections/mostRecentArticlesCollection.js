import Backbone from 'backbone';
import ArticleModel from 'MODELSDIR/articleModel';

export default Backbone.Collection.extend({
  //These first few attributes are standard backbone attrbibutes that can be read about in the docs.
  initialize: function(options) {
    this.minId = Number.MAX_SAFE_INTEGER;
    this.skipAheadAmount = options.skipAheadAmount;
    this.currentlyFetching = false;
    this.noMoreResults = false;
  },

  model: ArticleModel,

  parse: function(response, options) {
    this.currentlyFetching = false;
    if (!response.length) {
      this.noMoreResults = true;
      this.trigger('noMoreResults');
    }
    for (let i = 0; i < response.length; i++) {
      let articleJSON = response[i];
      const articleId = parseInt(articleJSON._id, 10);
      if (articleId < this.minId) {
        this.minId = articleId;
      }
    }
    return response;
  },

  url: '/most-recent-articles',

  // Attributes below this line are not standard Backbone attributes, they are custom.
  fetchNextArticles: function() {
    if (!this.currentlyFetching && !this.noMoreResults) {
      this.currentlyFetching = true;
      this.fetch({
        data: $.param({
          how_many: 10,
          max_id: this.minId - 1,
          skip_ahead_amount: this.skipAheadAmount,
        }),
        remove: false
      });
    }
  },

  getCurrentlyFetching: function() {
    return this.currentlyFetching;
  },

  getNoMoreResults: function() {
    return this.noMoreResults;
  },
});
