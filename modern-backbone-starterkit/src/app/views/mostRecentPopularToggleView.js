import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';
//import Marionette from 'backbone.marionette';

import MostRecentArticlesCollection from 'COLLECTIONSDIR/mostRecentArticlesCollection';
import MostViewedArticlesCollection from 'COLLECTIONSDIR/mostViewedArticlesCollection';
import template from 'TEMPLATESDIR/mostRecentPopularToggleTemplate.hbs';
import 'STYLESDIR/stylus/mostRecentPopularToggle.css';

//export default Marionette.ItemView.extend({
export default Backbone.View.extend({
  className: 'kmw-most-recent-popular-toggle',

  events: {
    'change .kmw-most-recent-popular-select': 'update',
    'change .kmw-time-interval-select': 'update'
  },

  initialize: function(options = {}) {
    this.options = options;
    this.views = [];
    this.articleGridView = options.articleGridView;

    //const mostRecentArticlesCollection = new MostRecentArticlesCollection();
    //this.mostRecentArticlesCollection = mostRecentArticlesCollection;
    //this.mostRecentArticlesCollection.fetch();
    //this.articleGridView.setArticleCollection(mostRecentArticlesCollection);

    //kmw: http://arturadib.com/hello-backbonejs/docs/1.html
    _.bindAll(this, 'render'); //comment came with code example: fixes loss of context for 'this' within methods
    this.render();
    this.update();
  },

  render: function() {
    _.forEach(this.views, function(view) {
      view.render();
    });
    this.$el.html(template());
    return this;
  },

  update: function() {
    console.log("in on change");
    const recentOrPopular = this.$('.kmw-most-recent-popular-select').get(0).value;
    console.log(recentOrPopular);
    if (recentOrPopular === 'most-recent') {
      if (this.mostRecentArticlesCollection === undefined) {
        this.mostRecentArticlesCollection = new MostRecentArticlesCollection();
        this.mostRecentArticlesCollection.fetchNextArticles();
      }
      this.articleGridView.setArticleCollection(this.mostRecentArticlesCollection);
      this.$('.kmw-time-interval-select').addClass('kmw-hidden');

    } else if (recentOrPopular === 'most-popular') {
      console.log("in most popular");
      if (this.mostViewedArticlesCollection === undefined) {
        this.mostViewedArticlesCollection = new MostViewedArticlesCollection({
          timeInterval: 'all-time'
        });
        this.mostViewedArticlesCollection.fetchNextArticles();
      }
      this.articleGridView.setArticleCollection(this.mostViewedArticlesCollection);
      this.$('.kmw-time-interval-select').removeClass('kmw-hidden');
    }
  },

  timeIntervalSelected: function(e) {
    console.log('time interval selected');
  }
});
