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
    this.articleGridView = options.articleGridView;
    this.router = options.router;
    this.listenTo(this.router, 'route', this.update);

    this.$el.html(template());
    this.update();
    this.infiniteScroll();
  },

  infiniteScroll: function() {
    const self = this;
    const onScrollFunction = function() {
      const distanceFromBottom = $(document).height() - $(window).scrollTop() - $(window).height();
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

   //TODO debounce? I think we update on initialize and on route causing this to run twice in a row.
  update: function() {
    let category = this.router.getCategory();
    if (category === "home") {
      category = "all"
    }
    const staffPicksOnly = false;
    //if (category === "any") {
    //  staffPicksOnly = true;
    //} else {
    //  staffPicksOnly = false;
    //}

    if (category !== "N/A") {
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
          category: category,
          skipAheadAmount: skipAheadAmount,
          staffPicksOnly: staffPicksOnly,
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
  }
});
