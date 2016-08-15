import Backbone from 'backbone';
import ArticleModel from 'MODELSDIR/articleModel';

export default Backbone.Collection.extend({
  //These first few attributes are standard backbone attrbibutes that can be read about in the docs.
  initialize: function(options) {
    this.timeInterval = options.timeInterval;
    this.articleIDs = [];
  },
  model: ArticleModel,
  parse: function(response, options) {
    for (let i = 0; i < response.length; i++) {
      let articleJSON = response[i];
      const articleId = parseInt(articleJSON._id, 10);
      this.articleIDs.push(articleId);
    }
    return response;
  },
  url: '/most-viewed-articles',

  // Attributes below this line are not standard Backbone attributes, they are custom.
  fetchNextArticles: function() {
    this.fetch({
      contentType: "application/json",
      data: JSON.stringify({
        dont_include: this.articleIDs,
        how_many: 10,
        time_interval: this.timeInterval
      }),
      remove: false,
      type: 'POST'
    });
  }
});
