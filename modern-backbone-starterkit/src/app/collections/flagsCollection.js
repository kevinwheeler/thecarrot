import Backbone from 'backbone';
import ArticleModel from 'MODELSDIR/articleModel';

export default Backbone.Collection.extend({
  //These first few attributes are standard backbone attributes that can be read about in the docs.
  initialize: function(models, options) {
    //this.skipAheadAmount = options.skipAheadAmount;

    this.articleId = options.articleId;
    this.currentlyFetching = false;
    this.minId = Number.MAX_SAFE_INTEGER;
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
      let flagJSON = response[i];
      const flagId = parseInt(flagJSON._id, 10);
      if (flagId < this.minId) {
        this.minId = flagId;
      }
    }
    return response;
  },

  url: '/article-flags',

  // Attributes below this line are not standard Backbone attributes, they are custom.
  fetchNextFlags: function() {
    if (!this.currentlyFetching && !this.noMoreResults) {
      this.currentlyFetching = true;
      this.fetch({
        //contentType: "application/json",
        data: $.param({
          article_id: this.articleId,
          how_many: 10,
          max_id: this.minId - 1,
          skip_ahead_amount: 0,
        }),
        remove: false,
        type: 'GET'
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
