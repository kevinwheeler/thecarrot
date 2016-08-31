import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';
//import Marionette from 'backbone.marionette';

import template from 'TEMPLATESDIR/approvalHistoryArticleGridTemplate.hbs';
import diffDOM from 'diff-dom';

//export default Marionette.ItemView.extend({
export default Backbone.View.extend({
  className: 'kmw-selectable-article-grid-view',

  events: {
  },

  initialize: function(options = {}) {
    this.dd = new diffDOM({
      valueDiffing: false
    });
    this.displayApprovalHistory = options.displayApprovalHistory;
    this.hasRenderedOnce = false;
    _.bindAll(this, 'render'); //comment came with code example: fixes loss of context for 'this' within methods
  },

  render: function() {
   const newHTMLString = template({
     articles: this.articleCollection.toJSON()
   });
   if (this.hasRenderedOnce) {
     const newEl = $.parseHTML(newHTMLString)[0];
     const diffDomWrapper = this.$(".diff-dom-wrapper").get(0);
     const diff = this.dd.diff(diffDomWrapper, newEl);
     this.dd.apply(diffDomWrapper, diff);
   } else {
     this.hasRenderedOnce = true;
     this.$el.html(newHTMLString);
   }

   this.delegateEvents();
   return this;
  },

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
