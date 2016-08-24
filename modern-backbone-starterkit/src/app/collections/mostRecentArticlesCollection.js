import Backbone from 'backbone';
import ArticleModel from 'MODELSDIR/articleModel';

export default Backbone.Collection.extend({
  //These first few attributes are standard backbone attrbibutes that can be read about in the docs.
  initialize: function(options) {
    this.minId = Number.MAX_SAFE_INTEGER;
  },

  model: ArticleModel,

  parse: function(response, options) {
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
    this.fetch({
      data: $.param({
        how_many: 10,
        max_id: this.minId - 1
      }),
      remove: false
    });
  }
});
