import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';
//import Marionette from 'backbone.marionette';

import template from 'TEMPLATESDIR/needApprovalArticleGridTemplate.hbs';
import dd from 'UTILSDIR/diffDOM';

//export default Marionette.ItemView.extend({
export default Backbone.View.extend({
  className: 'kmw-selectable-article-grid-view',

  events: {
  },

  initialize: function(options = {}) {
    this.useFlagsURL = options.useFlagsURL;
  },

  render: _.throttle(function() {
      const newHTMLString = template({
        articles: this.articleCollection.toJSON(),
        useFlagsURL: this.useFlagsURL
      });
      const newEl = $.parseHTML(newHTMLString)[0];
      const diffDomWrapper = this.$(".diff-dom-wrapper").get(0);
      if (diffDomWrapper !== undefined) {
        const diff = dd.diff(diffDomWrapper, newEl);
        dd.apply(diffDomWrapper, diff);
      } else {
        this.$el.html(newHTMLString);
      }

      this.delegateEvents();
      return this;
    }, 16
  ),

  fetchMoreResults: function() {
    this.articleCollection.fetchNextArticles();
  },

  setArticleCollection: function(articleCollection) {
    if (this.articleCollection !== undefined) {
      this.stopListening(this.articleCollection);
    }
    this.articleCollection = articleCollection;
    this.listenTo(this.articleCollection, 'change add', this.render);
    this.render();
  }
});
