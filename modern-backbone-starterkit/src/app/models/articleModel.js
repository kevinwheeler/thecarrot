// consider this an abstract class. AKA don't initialize instances of this class.
// initialize instances of the subclasses instead.
import Backbone from 'backbone';
import serviceProvider from 'UTILSDIR/serviceProvider';

export default Backbone.Model.extend({
  defaults: {
    articleURL: null, // This attribute is only found client side, and is created during parse()
    articleURLSlug: null,
    headline: null,
    imageURL: null,
    subline: null
  },

  parse: function(articleJSON, options) {
    articleJSON.articleURL = '/' + serviceProvider.getRouter().exports.articleRoutePrefix + '/' + articleJSON.articleURLSlug;
    return articleJSON;
  }
});
