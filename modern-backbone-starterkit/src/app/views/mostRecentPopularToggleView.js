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
    'change .kmw-time-interval-select': 'update',
    'input .kmw-skip-ahead': 'debouncedUpdate'
  },

  initialize: function(options = {}) {
    this.options = options;
    this.views = [];
    this.articleGridView = options.articleGridView;

    //kmw: http://arturadib.com/hello-backbonejs/docs/1.html
    _.bindAll(this, 'render'); //comment came with code example: fixes loss of context for 'this' within methods
    this.render();
    this.update();
    this.infiniteScroll();
  },

  render: function() {
    _.forEach(this.views, function(view) {
      view.render();
    });
    this.$el.html(template());
    return this;
  },

  infiniteScroll: function() {
    const self = this;
    const onScrollFunction = function() {
      const distanceFromBottom = $(document).height() - $(window).scrollTop() - $(window).height();
      console.log("distance from bottom = " + distanceFromBottom + " " + typeof(distanceFromBottom));
      if(distanceFromBottom < 500)  {
        self.articleGridView.fetchMoreResults();
      }
    };

    $(window).scroll(_.throttle(onScrollFunction, 50));
  },

  debouncedUpdate: _.debounce(function() {
      this.update();
    }, 500
  ),

  update: function() {
    const recentOrPopular = this.$('.kmw-most-recent-popular-select').get(0).value;
    const $skipAhead = this.$(".kmw-skip-ahead");
    let skipAheadAmount = parseInt($skipAhead.get(0).value, 10);
    if (_.isNaN(skipAheadAmount)) {
      skipAheadAmount = 0;
    }

    if(skipAheadAmount > 1000) {
      alert("skip ahead amount cannot exceed 1000");
      $skipAhead.val(1000);
      skipAheadAmount = 1000;
    }

    if(skipAheadAmount < 0) {
      alert("skip ahead amount must be a non-negative number.");
      $skipAhead.val(0);
      skipAheadAmount = 0;
    }

    if (recentOrPopular === 'most-recent') {
      //if (this.mostRecentArticlesCollection === undefined) {
        this.mostRecentArticlesCollection = new MostRecentArticlesCollection({
          skipAheadAmount: skipAheadAmount
        });
        this.mostRecentArticlesCollection.fetchNextArticles();
      //}
      this.articleGridView.setArticleCollection(this.mostRecentArticlesCollection);
      this.$('.kmw-time-interval-select').addClass('kmw-hidden');


    } else if (recentOrPopular === 'most-popular') {
      const timeInterval = this.$('.kmw-time-interval-select').get(0).value

      if (timeInterval === 'daily') {
        //if (this.mostViewedArticlesDailyCollection === undefined) {
          this.mostViewedArticlesDailyCollection = new MostViewedArticlesCollection({
            timeInterval: 'daily',
            skipAheadAmount: skipAheadAmount
          });
          this.mostViewedArticlesDailyCollection.fetchNextArticles();
        //}
        this.articleGridView.setArticleCollection(this.mostViewedArticlesDailyCollection);

      } else if (timeInterval === 'weekly') {
        //if (this.mostViewedArticlesWeeklyCollection === undefined) {
          this.mostViewedArticlesWeeklyCollection = new MostViewedArticlesCollection({
            timeInterval: 'weekly',
            skipAheadAmount: skipAheadAmount
          });
          this.mostViewedArticlesWeeklyCollection.fetchNextArticles();
        //}
        this.articleGridView.setArticleCollection(this.mostViewedArticlesWeeklyCollection);

      } else if (timeInterval === 'monthly') {
        //if (this.mostViewedArticlesMonthlyCollection === undefined) {
          this.mostViewedArticlesMonthlyCollection = new MostViewedArticlesCollection({
            timeInterval: 'monthly',
            skipAheadAmount: skipAheadAmount
          });
          this.mostViewedArticlesMonthlyCollection.fetchNextArticles();
        //}
        this.articleGridView.setArticleCollection(this.mostViewedArticlesMonthlyCollection);

      } else if (timeInterval === 'all_time') {
        //if (this.mostViewedArticlesAllTimeCollection === undefined) {
          this.mostViewedArticlesAllTimeCollection = new MostViewedArticlesCollection({
            timeInterval: 'all_time',
            skipAheadAmount: skipAheadAmount
          });
          this.mostViewedArticlesAllTimeCollection.fetchNextArticles();
        //}
        this.articleGridView.setArticleCollection(this.mostViewedArticlesAllTimeCollection);
      }

      this.$('.kmw-time-interval-select').removeClass('kmw-hidden');
    }
  }
});
