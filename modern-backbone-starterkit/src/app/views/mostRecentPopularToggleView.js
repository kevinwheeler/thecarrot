import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';
//import Marionette from 'backbone.marionette';

import MostRecentArticlesCollection from 'COLLECTIONSDIR/mostRecentArticlesCollection';
import template from 'TEMPLATESDIR/mostRecentPopularToggleTemplate.hbs';
import 'STYLESDIR/stylus/mostRecentPopularToggle.css';

//export default Marionette.ItemView.extend({
export default Backbone.View.extend({
  className: 'kmw-most-recent-popular-toggle',

  events: {
    'change .kmw-most-recent-popular-select': 'recentPopularSelected',
    'change .kmw-time-interval-select':       'timeIntervalSelected'
  },

  initialize: function(options = {}) {
    this.options = options;
    this.views = [];
    this.articleGridView = options.articleGridView;

    const mostRecentArticlesCollection = new MostRecentArticlesCollection();
    this.mostRecentArticlesCollection = mostRecentArticlesCollection;
    this.mostRecentArticlesCollection.fetch();
    this.articleGridView.setArticleCollection(mostRecentArticlesCollection);

    //kmw: http://arturadib.com/hello-backbonejs/docs/1.html
    _.bindAll(this, 'render'); //comment came with code example: fixes loss of context for 'this' within methods
    this.render();
  },

  render: function() {
    _.forEach(this.views, function(view) {
      view.render();
    });
    this.$el.html(template());
    return this;
  },

  recentPopularSelected: function(e) {
    const val = e.target.value;
    if (val === 'most-recent') {
      console.log("in most recent");
      if (this.mostRecentArticlesCollection === undefined) {
        //TODO have a different if for each of the most popular time intervals
        //TODO Don't use the stub "MostRecentArticlesCollection" use a popularity one instead.
        this.mostRecentArticlesCollection = new MostRecentArticlesCollection();
        this.mostRecentArticlesCollection.fetch();
      }
      this.articleGridView.setArticleCollection(this.mostRecentArticlesCollection);
      this.$('.kmw-time-interval-select').addClass('kmw-hidden');

    } else if (val === 'most-popular') {
      console.log("in most popular");
      if (this.mostPopularArticlesCollection === undefined) {
        //TODO have a different if for each of the most popular time intervals
        //TODO Don't use the stub "MostRecentArticlesCollection" use a popularity one instead.
        this.mostPopularArticlesCollection = new MostRecentArticlesCollection();
        this.mostPopularArticlesCollection.fetch();
      }
      this.articleGridView.setArticleCollection(this.mostPopularArticlesCollection);
      this.$('.kmw-time-interval-select').removeClass('kmw-hidden');
    }
  },

  timeIntervalSelected: function(e) {
    console.log('time interval selected');
  }
});
