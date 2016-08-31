import Backbone from 'backbone';
import ArticleModel from 'MODELSDIR/articleModel';
import serviceProvider from 'UTILSDIR/serviceProvider';

//TODO trying to fetch more articles returns the same ones every time.

export default Backbone.Collection.extend({
  //These first few attributes are standard backbone attrbibutes that can be read about in the docs.
  initialize: function(options) {
    window.kmwhist = this;
    this.minId = Number.MAX_SAFE_INTEGER;
  },

  //model: ArticleModel,

  parse: function(response, options) {
    // '/api/my-approval-history' augments the articles returned with two extra attributes,
    // 'historicalApprovalVerdict' and 'historicalApprovalTimestamp'
    for (let i = 0; i < response.length; i++) {
      let articleJSON = response[i];

      articleJSON.adminArticleURL = '/' + serviceProvider.getRouter().exports.adminArticleRoutePrefix + '/' + articleJSON.articleURLSlug;

      // convert to a more human readable representation.
      const timestamp = new Date(Date.parse(articleJSON.historicalApprovalTimestamp)).toString();
      articleJSON.historicalApprovalTimestamp = timestamp;


      // Keep track of minimum ID out of all the articles in this collection.
      const approvalId = parseInt(articleJSON.approvalId, 10);
      if (approvalId < this.minId) {
        this.minId = approvalId;
      }
    }
    return response;
  },

  url: '/api/my-approval-history',

  // Attributes below this line are not standard Backbone attributes, they are custom.
  fetchNextArticles: function() {
    this.fetch({
      data: $.param({
        how_many: 10,
        max_id: this.minId - 1
      }),
      remove: false
    });
  }
});
