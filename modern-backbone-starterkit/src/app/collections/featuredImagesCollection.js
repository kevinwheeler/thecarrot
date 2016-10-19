import Backbone from 'backbone';
import ImageModel from 'MODELSDIR/imageModel';

export default Backbone.Collection.extend({
  //These first few attributes are standard backbone attributes that can be read about in the docs.
  initialize: function(models, options) {
    this.doneFetching = false;
  },

  model: ImageModel,

  parse: function(response, options) {
    this.doneFetching = true;
    return response;
  },

  url: '/featured-images',
});
