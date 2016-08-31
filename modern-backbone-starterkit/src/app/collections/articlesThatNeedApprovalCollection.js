import Backbone from 'backbone';
import ArticleModel from 'MODELSDIR/articleModel';

export default Backbone.Collection.extend({
  //These first few attributes are standard backbone attrbibutes that can be read about in the docs.
  initialize: function(options) {
    this.maxId = -1;
  },

  model: ArticleModel,

  parse: function(response, options) {
    for (let i = 0; i < response.length; i++) {
      let articleJSON = response[i];
      const articleId = articleJSON._id;
      if (articleId > this.maxId) {
        this.maxId = articleId;
      }
    }
    return response;
  },

  url: '/articles-that-need-approval',

  // Attributes below this line are not standard Backbone attributes, they are custom.
  fetchNextArticles: function() {
    this.fetch({
      data: $.param({
        how_many: 10,
        min_id: this.maxId + 1
      }),
      remove: false
    });
  }
});
