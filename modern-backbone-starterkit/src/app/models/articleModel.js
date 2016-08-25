// consider this an abstract class. AKA don't initialize instances of this class.
// initialize instances of the subclasses instead.
import Backbone from 'backbone';
import serviceProvider from 'UTILSDIR/serviceProvider';

export default Backbone.Model.extend({
  defaults: {
    _id: null,
    articleURL: null, // This attribute is only found client side, and is created during parse()
    articleURLSlug: null,
    dateCreated: null,
    headline: null,
    imageURL: null,
    subline: null
  },

  idAttribute: "_id",

  initialize: function(options) {
    window.kmwmod = this;
    if (options.setIdToCurrentArticle === true) {
      // TODO move url code out to router file
      let url = window.location.href;
      if (url.charAt(url.length - 1) === '/') { // Cut off trailing slash if there is one.
        url = url.substr(0, url.length - 1);
      }
      let articleSlug = url.substring(url.lastIndexOf('/') + 1);
      this._id = parseInt(articleSlug, 10);
    }
  },

  url: function() {
    return "/api/article/" + this._id;
  },

  parse: function(articleJSON, options) {
    articleJSON.articleURL = '/' + serviceProvider.getRouter().exports.articleRoutePrefix + '/' + articleJSON.articleURLSlug;
    console.log("in parse. articlejson = ")
    console.log(articleJSON);
    return articleJSON;
  }
});
