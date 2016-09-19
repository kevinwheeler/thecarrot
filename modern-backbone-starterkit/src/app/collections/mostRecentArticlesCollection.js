import Backbone from 'backbone';
import ArticleModel from 'MODELSDIR/articleModel';

export default Backbone.Collection.extend({
  //These first few attributes are standard backbone attrbibutes that can be read about in the docs.
  initialize: function(models, options) {
    this.category= options.category;
    this.skipAheadAmount = options.skipAheadAmount;
    this.staffPicksOnly = options.staffPicksOnly;

    this.minId = Number.MAX_SAFE_INTEGER;
    this.currentlyFetching = false;
    this.noMoreResults = false;
  },

  model: ArticleModel,

  parse: function(response, options) {
    this.currentlyFetching = false;
    this.trigger('doneFetching');
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
      this.trigger('fetching');
      this.currentlyFetching = true;
      this.fetch({
        data: $.param({
          category: this.category,
          how_many: 10,
          max_id: this.minId - 1,
          skip_ahead_amount: this.skipAheadAmount,
          staff_picks_only: this.staffPicksOnly
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
