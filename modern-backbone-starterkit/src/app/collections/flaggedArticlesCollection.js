import Backbone from 'backbone';
import ArticleModel from 'MODELSDIR/articleModel';

export default Backbone.Collection.extend({
  //These first few attributes are standard backbone attrbibutes that can be read about in the docs.
  initialize: function(models, options) {
    //this.skipAheadAmount = options.skipAheadAmount;

    this.articleIDs = [];
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
      this.articleIDs.push(articleId);
    }
    return response;
  },

  url: '/flagged-articles',

  // Attributes below this line are not standard Backbone attributes, they are custom.
  fetchNextArticles: function() {
    if (!this.currentlyFetching && !this.noMoreResults) {
      this.currentlyFetching = true;
      this.fetch({
        contentType: "application/json",
        data: JSON.stringify({
          dont_include: this.articleIDs,
          how_many: 10,
          skip_ahead_amount: 0,
        }),
        remove: false,
        type: 'POST'
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
