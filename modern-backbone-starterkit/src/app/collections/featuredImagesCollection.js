import Backbone from 'backbone';
import ImageModel from 'MODELSDIR/imageModel';

export default Backbone.Collection.extend({
  //These first few attributes are standard backbone attributes that can be read about in the docs.
  initialize: function(models, options) {
  },

  model: ImageModel,

  url: '/featured-images',
});
