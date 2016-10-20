import Backbone from 'backbone';
import ArticleModel from 'MODELSDIR/articleModel';
import serviceProvider from 'UTILSDIR/serviceProvider';

export default Backbone.Collection.extend({
  //These first few attributes are standard backbone attributes that can be read about in the docs.
  initialize: function(models, options) {
    this.maxId = -1;
  },

  parse: function(response, options) {
    for (let i = 0; i < response.length; i++) {
      let imageJSON = response[i];
      imageJSON.imageURL = window.kmw.imageBaseUrl + imageJSON.slug;
      const imageId = imageJSON._id;
      if (imageId  > this.maxId) {
        this.maxId = imageId;
      }
    }
    return response;
  },

  url: '/images-that-need-approval',

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
