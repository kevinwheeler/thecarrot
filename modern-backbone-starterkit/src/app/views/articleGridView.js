import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';
//import Marionette from 'backbone.marionette';

import template from 'TEMPLATESDIR/articleGridTemplate.hbs';
import dd from 'UTILSDIR/diffDOM';

//export default Marionette.ItemView.extend({
export default Backbone.View.extend({
  className: 'kmw-article-grid-view',

  events: {
  },

  initialize: function(options = {}) {
  },

  render: _.throttle(function() {
    console.log("articles json = ")
    console.log(this.articleCollection.toJSON());
      const newHTMLString = template({
        articles: this.articleCollection.toJSON(),
        fetchingMoreResults: this.articleCollection.getCurrentlyFetching(),
        noMoreResults: this.articleCollection.getNoMoreResults()
      });
      const newEl = $.parseHTML(newHTMLString)[0];
      const diffDomWrapper = this.$(".diff-dom-wrapper").get(0);
      if (diffDomWrapper !== undefined) {
        const diff = dd.diff(diffDomWrapper, newEl);
        dd.apply(diffDomWrapper, diff);
      } else {
        this.$el.html(newHTMLString);
      }
      return this;
    }, 16
  ),

  fetchMoreResults: function() {
    this.articleCollection.fetchNextArticles();
    this.render();
  },

  setArticleCollection: function(articleCollection) {
    if (this.articleCollection !== undefined) {
      this.stopListening(this.articleCollection);
    }
    this.articleCollection = articleCollection;
    this.listenTo(this.articleCollection, 'change add', this.render);
    this.listenTo(this.articleCollection, 'noMoreResults', this.render);
    this.render();
  }
});
