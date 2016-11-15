/*
 *  Decided to not use reactive design (any time the data changes, call render) because given the data alone, we don't
 *  have enough information to render. We want all columns to be equal height, so we need to know the heights of the columns
 *  so that we can add articles to the correct column.
 */
import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';

import template from 'TEMPLATESDIR/articleColumnsTemplate.hbs';
import articleCardTemplate from 'TEMPLATESDIR/articleCardTemplate.hbs';
import 'STYLESDIR/stylus/articleCard.css';
import 'STYLESDIR/stylus/articleColumns.css';
import dd from 'UTILSDIR/diffDOM';
import utils from 'UTILSDIR/utils';
import ArticleGetter from 'UTILSDIR/articleGetter';
import ArticleColumnView from 'VIEWSDIR/articleColumnView';
import {parseFbElement} from 'UTILSDIR/facebooksdk';

//export default Marionette.ItemView.extend({
export default Backbone.View.extend({
  className: 'kmw-article-columns-view',

  events: {
  },

  initialize: function(options) {
    this.router = options.router;
  },

  render: _.throttle(function() {
      this.numColumns = this.getNumColumns();
      const newHTMLString = template({
        fetchingMoreResults: this.articleCollection.getCurrentlyFetching(),
        noMoreResults: this.articleCollection.getNoMoreResults(),
        numColumns: this.numColumns,
      });

      //this.$el.children().detach();
      this.$el.html(newHTMLString);

      if (this.columnViews) {
        _.forEach(this.columnViews, function(view) {
          view.destroyView();
        })
      }
      if (this.articleGetter) {
        this.articleGetter.destroy();
      }

      this.articleGetter = new ArticleGetter(this.articleCollection);
      this.columnViews = [];
      for (let i = 0; i < this.numColumns; i++) {
        const articleColumnView = new ArticleColumnView({
          articleGetter: this.articleGetter,
          numColumns: this.numColumns
        })
        this.columnViews.push(articleColumnView);

        this.$('.columns-container').append(articleColumnView.el);
      }

      const INITIAL_NUM_ARTICLES_PER_COLUMN = 10;
      for (let i=0; i < INITIAL_NUM_ARTICLES_PER_COLUMN; i++) {
        for (let j=0; j < this.numColumns; j++) {
          const articleColumnView = this.columnViews[j];
          articleColumnView.getArticle();
        }
      }

      return this;
    }, 16
  ),

  getNumColumns: function() {
    const windowWidth = $(window).width();

    if (windowWidth < 800) {
      return 1
    }
    else if (windowWidth < 1200) {
      return 2
    } else {
      return 3;
    }
  },

  onDoneFetching: function() {
    this.$(".js-article-columns-loading").addClass("kmw-hidden");
  },

  onFetching: function() {
    this.$(".js-article-columns-loading").removeClass("kmw-hidden");
  },

  onNoMoreResults: function() {
    this.$(".js-article-columns-no-more-results").removeClass("kmw-hidden");
  },

  reRenderWhenNumberOfColumnsShouldChange: function() {
    this.rerenderingSet = true;
    const self = this;
    $(window).resize(_.debounce(function() {
      if (self.numColumns !== self.getNumColumns()) {
        self.render();
      }
    }, 30));
  },

  setArticleCollection: function(articleCollection) {
    if (articleCollection === this.articleCollection) {
      return;
    }
    if (this.articleCollection === undefined) {

    } else {
      this.stopListening(this.articleCollection);
    }
    this.articleCollection = articleCollection;
    //this.listenTo(this.articleCollection, 'add', this.addArticle);
    this.listenTo(this.articleCollection, 'fetching', this.onFetching);
    this.listenTo(this.articleCollection, 'doneFetching', this.onDoneFetching);
    this.listenTo(this.articleCollection, 'noMoreResults', this.onNoMoreResults);
    this.render();
    if (!this.rerenderingSet) {
      this.reRenderWhenNumberOfColumnsShouldChange();
    }
  },
});
