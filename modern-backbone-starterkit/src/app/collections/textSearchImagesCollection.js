import Backbone from 'backbone';
import ImageModel from 'MODELSDIR/imageModel';

export default Backbone.Collection.extend({
  //These first few attributes are standard backbone attributes that can be read about in the docs.
  initialize: function(models, options) {
    this.doneFetching = false;
    this.query = options.query;
  },

  model: ImageModel,

  parse: function(response, options) {
    this.doneFetching = true;
    return response;
  },


  url: '/text-search-images',

  fetchImages: function() {
      this.fetch({
        data: $.param({
          search_query: this.query
        })
      });
  },
});
