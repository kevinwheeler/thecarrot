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
    const apiUrl = this.url + '?max_id=' + (this.minId - 1) + "&how_many=10";
    const xhr = new XMLHttpRequest();
    xhr.open('GET', apiUrl);
    var self = this;
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          const response = this.parse(JSON.parse(xhr.responseText));
          this.add(response);
        } else {
          alert('An error has occurred while fetching the next set of results.');
        }
      }
    };
    xhr.send();
  }
});
