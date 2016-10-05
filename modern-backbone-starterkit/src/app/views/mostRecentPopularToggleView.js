import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';
//import Marionette from 'backbone.marionette';

import BestArticlesCollection from 'COLLECTIONSDIR/bestArticlesCollection';
import MostRecentArticlesCollection from 'COLLECTIONSDIR/mostRecentArticlesCollection';
import MostViewedArticlesCollection from 'COLLECTIONSDIR/mostViewedArticlesCollection';
import serviceProvider from 'UTILSDIR/serviceProvider';
import template from 'TEMPLATESDIR/mostRecentPopularToggleTemplate.hbs';
import 'STYLESDIR/stylus/mostRecentPopularToggle.css';

//export default Marionette.ItemView.extend({
export default Backbone.View.extend({
  className: 'kmw-most-recent-popular-toggle',

  events: {
    'change .kmw-collection-type-select': 'update',
    'change .kmw-time-interval-select': 'update',
    'input .kmw-skip-ahead': 'debouncedUpdate'
  },

  initialize: function(options = {}) {
    this.options = options;
    this.articleGridView = options.articleGridView;
    this.articleGridView.setMostRecentPopularToggleView(this);
    this.router = options.router;
    this.listenTo(this.router, 'route', this.update);
    this.listenTo(this.router, 'beforeRoute', this.beforeRoute);
    this.$el.children().detach();
    this.$el.html(template());
    this.update();
    this.infiniteScroll();
  },

  beforeRoute: function() {
    if (serviceProvider.getRouter().getCategory() !== 'N/A') {
      this.saveScrollPosition();
    }
  },

  infiniteScroll: function() {
    const self = this;
    const onScrollFunction = function() {
      const distanceFromBottom = $(document).height() - $(window).scrollTop() - $(window).height();
      if (distanceFromBottom < 500)  {
        self.articleGridView.fetchMoreResults();
      }
    };

    $(window).scroll(_.throttle(onScrollFunction, 50));
  },

  debouncedUpdate: _.debounce(function() {
      this.update();
    }, 500
  ),

  restoreScrollPosition: function () {
    $(window).scrollTop(this.scrollPosition);
  },

  // returns true if we aren't supposed to load in a brand new article collection
  // restore one the one we were last using.
  shouldRestorePreviousSession: function () {
    const timeInterval = this.$('.kmw-time-interval-select').get(0).value;
    const collectionType = this.$('.kmw-collection-type-select').get(0).value;
    const $skipAhead = this.$(".kmw-skip-ahead");
    const skipAheadAmount = parseInt($skipAhead.get(0).value, 10);
    const category = this.router.getCategory();

    if (
      timeInterval !== this.lastTimeInterval ||
      collectionType !== this.lastCollectionType ||
      skipAheadAmount !== this.lastSkipAheadAmount ||
      category !== this.lastCategory
    ) {
      return false;
    } else {
      return true;
    }
  },

  saveSessionInfo: function() {
    this.lastTimeInterval = this.$('.kmw-time-interval-select').get(0).value;
    this.lastCollectionType = this.$('.kmw-collection-type-select').get(0).value;
    const $skipAhead = this.$(".kmw-skip-ahead");
    this.lastSkipAheadAmount = parseInt($skipAhead.get(0).value, 10);
    this.lastCategory = this.router.getCategory();
  },

  saveScrollPosition: function () {
    this.scrollPosition = $(window).scrollTop();
  },

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

    if (category !== "N/A") { // if we are on a page that is actually supposed to display a list of popular/most recent articles
      if (this.shouldRestorePreviousSession()) {
        this.restoreScrollPosition();
      } else {
        // TODO if we ever change it such that clicking on a different category doesn't cause a new page load,
        // we will want to make it such that we reset the controls/inputs when we click on a new category.

        const collectionType = this.$('.kmw-collection-type-select').get(0).value;
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

        this.saveSessionInfo();

        if (collectionType === 'most-recent') {
          this.articleCollection = new MostRecentArticlesCollection([], {
            category: category,
            skipAheadAmount: skipAheadAmount,
            staffPicksOnly: staffPicksOnly,
          });
          this.$('.kmw-time-interval-select').addClass('kmw-hidden');
        } else if (collectionType === 'most-popular') {
          const timeInterval = this.$('.kmw-time-interval-select').get(0).value;
          this.articleCollection = new MostViewedArticlesCollection([], {
            category: category,
            skipAheadAmount: skipAheadAmount,
            staffPicksOnly: staffPicksOnly,
            timeInterval: timeInterval,
          });
          this.$('.kmw-time-interval-select').removeClass('kmw-hidden');
        } else if (collectionType === 'best') {
          const timeInterval = this.$('.kmw-time-interval-select').get(0).value;
          this.articleCollection = new BestArticlesCollection([], {
            category: category,
            skipAheadAmount: skipAheadAmount,
            staffPicksOnly: staffPicksOnly,
            timeInterval: timeInterval,
          });
          this.$('.kmw-time-interval-select').removeClass('kmw-hidden');
        }
        this.articleCollection.fetchNextArticles();
        this.articleGridView.setArticleCollection(this.articleCollection);
      }

      //if (collectionType === 'most-recent') {
      //  //if (this.mostRecentArticlesCollection === undefined) {
      //  this.mostRecentArticlesCollection = new MostRecentArticlesCollection([], {
      //    category: category,
      //    skipAheadAmount: skipAheadAmount,
      //    staffPicksOnly: staffPicksOnly,
      //  });
      //  this.mostRecentArticlesCollection.fetchNextArticles();
      //  //}
      //  this.articleGridView.setArticleCollection(this.mostRecentArticlesCollection);
      //  this.$('.kmw-time-interval-select').addClass('kmw-hidden');
      //
      //
      //} else if (collectionType === 'most-popular') {
      //  const timeInterval = this.$('.kmw-time-interval-select').get(0).value
      //
      //  if (timeInterval === 'daily') {
      //    //if (this.mostViewedArticlesDailyCollection === undefined) {
      //    this.mostViewedArticlesDailyCollection = new MostViewedArticlesCollection([], {
      //      timeInterval: 'daily',
      //      skipAheadAmount: skipAheadAmount
      //    });
      //    this.mostViewedArticlesDailyCollection.fetchNextArticles();
      //    //}
      //    this.articleGridView.setArticleCollection(this.mostViewedArticlesDailyCollection);
      //
      //  } else if (timeInterval === 'weekly') {
      //    //if (this.mostViewedArticlesWeeklyCollection === undefined) {
      //    this.mostViewedArticlesWeeklyCollection = new MostViewedArticlesCollection([], {
      //      timeInterval: 'weekly',
      //      skipAheadAmount: skipAheadAmount
      //    });
      //    this.mostViewedArticlesWeeklyCollection.fetchNextArticles();
      //    //}
      //    this.articleGridView.setArticleCollection(this.mostViewedArticlesWeeklyCollection);
      //
      //  } else if (timeInterval === 'monthly') {
      //    //if (this.mostViewedArticlesMonthlyCollection === undefined) {
      //    this.mostViewedArticlesMonthlyCollection = new MostViewedArticlesCollection([], {
      //      timeInterval: 'monthly',
      //      skipAheadAmount: skipAheadAmount
      //    });
      //    this.mostViewedArticlesMonthlyCollection.fetchNextArticles();
      //    //}
      //    this.articleGridView.setArticleCollection(this.mostViewedArticlesMonthlyCollection);
      //
      //  } else if (timeInterval === 'all_time') {
      //    //if (this.mostViewedArticlesAllTimeCollection === undefined) {
      //    this.mostViewedArticlesAllTimeCollection = new MostViewedArticlesCollection([], {
      //      timeInterval: 'all_time',
      //      skipAheadAmount: skipAheadAmount
      //    });
      //    this.mostViewedArticlesAllTimeCollection.fetchNextArticles();
      //    //}
      //    this.articleGridView.setArticleCollection(this.mostViewedArticlesAllTimeCollection);
      //  }
      //
      //  this.$('.kmw-time-interval-select').removeClass('kmw-hidden');
      //}
    }
  }
});
