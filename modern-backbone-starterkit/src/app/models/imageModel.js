// consider this an abstract class. AKA don't initialize instances of this class.
// initialize instances of the subclasses instead.
import Backbone from 'backbone';
import serviceProvider from 'UTILSDIR/serviceProvider';
import cat from 'ISOMORPHICDIR/categories';

export default Backbone.Model.extend({
  defaults: {
  },

  idAttribute: "_id",

  parse: function(imageJSON, options) {
    imageJSON.url = window.kmw.imageBaseUrl + imageJSON.slug;
    return imageJSON;
  },
});
