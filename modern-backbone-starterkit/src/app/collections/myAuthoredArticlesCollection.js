import Backbone from 'backbone';
import ArticleModel from 'MODELSDIR/articleModel';
import serviceProvider from 'UTILSDIR/serviceProvider';

export default Backbone.Collection.extend({
  //These first few attributes are standard backbone attrbibutes that can be read about in the docs.
  initialize: function(options) {
    this.minId = Number.MAX_SAFE_INTEGER;
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

  url: '/my-authored-articles',

  // Attributes below this line are not standard Backbone attributes, they are custom.
  fetchNextArticles: function() {
    if (!this.currentlyFetching && !this.noMoreResults) {
      this.currentlyFetching = true;
      this.fetch({
        data: $.param({
          how_many: 10,
          max_id: this.minId - 1,
          skip_ahead_amount: 0
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
