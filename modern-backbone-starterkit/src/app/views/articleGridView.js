import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';
//import Marionette from 'backbone.marionette';

import template from 'TEMPLATESDIR/articleGridTemplate.hbs';

//export default Marionette.ItemView.extend({
export default Backbone.View.extend({
  className: 'kmw-article-grid-view',

  events: {
    'click .kmw-fetch-more': 'fetchMoreResults'
  },

  initialize: function(options = {}) {
    window.articleGridView = this;
    // kmw: http://arturadib.com/hello-backbonejs/docs/1.html
    _.bindAll(this, 'render'); //comment came with code example: fixes loss of context for 'this' within methods

    //this.articleCollection = options.articleCollection;

    //this.listenTo(this.articleCollection, 'change add', this.render);

    //this.render();
  },

  render: _.throttle(function() {
      //TODO this gets called once for every article
      const articleCollectionJSON = this.articleCollection.toJSON();
      this.$el.html(template({
        articles: this.articleCollection.toJSON()
      }));

      return this;
    }, 16
  ),

  fetchMoreResults: function() {
    console.log("should be fetching");
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
