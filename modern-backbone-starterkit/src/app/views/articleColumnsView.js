/*
 *  Decided to not use reactive design (any time the data changes, call render) because given the data alone, we don't
 *  have enough information to render. We want all columns to be equal height, so we need to know the heights of the columns
 *  so that we can add articles to the correct column.
 */
import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';
//import Marionette from 'backbone.marionette';

import template from 'TEMPLATESDIR/articleColumnsTemplate.hbs';
import articleCardTemplate from 'TEMPLATESDIR/articleCardTemplate.hbs';
import 'STYLESDIR/stylus/articleCard.css';
import 'STYLESDIR/stylus/articleColumns.css';
import dd from 'UTILSDIR/diffDOM';
import utils from 'UTILSDIR/utils';

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
      const self = this;
      // num columns array is a hack so that we can loop a dynamic number of times in handlebars.
      // The only way I saw to do this was to loop over each element in a dynamically sized array.
      const numColumnsArray = [];
      for (let i=1; i <= this.numColumns; i++) {
        numColumnsArray.push(i);
      }
      const newHTMLString = template({
        fetchingMoreResults: this.articleCollection.getCurrentlyFetching(),
        noMoreResults: this.articleCollection.getNoMoreResults(),
        numColumns: this.numColumns,
        numColumnsArray: numColumnsArray,
      });

      this.$el.children().detach();
      this.$el.html(newHTMLString);
      this.displayCategory = this.router.getCategory() === 'home';
      this.$columns = this.$el.find('.article-column');
      this.columnHeights = [];
      this.$columns.each(function(index) {
        self.columnHeights[index] = 0;
      });
      this.articleCollection.each(function(model) {
        self.addArticle(model);
      });

      return this;
    }, 16
  ),

  addArticle: function(model) {
    const article = model.toJSON();
    const newArticleCard = $.parseHTML(
      articleCardTemplate({
        article: article,
        displayCategory: this.displayCategory,
      })
    )[0];
    const $newArticleCard = $(newArticleCard);
    const shortestColumnIndex = utils.indexOfMin(this.columnHeights);
    const shortestColumn = this.$columns.get(shortestColumnIndex);

    shortestColumn.appendChild(newArticleCard);

    const articleCardHeight = $newArticleCard.height();
    const ghostWidth = $newArticleCard.find(".article-card-image-ghost").width();
    const ghostHeight = $newArticleCard.find(".article-card-image-ghost").height();
    const imageHeight = this.getImageHeight(article.imageWidth, article.imageHeight, ghostWidth)

    // Subtracts away the ghostHeight because the image may or may not have loaded yet and therefore,
    // the ghostHeight may or may not be 0. Therefore we compute the eventual height ourselves (imageHeight).
    const newArticleHeight = articleCardHeight - ghostHeight + imageHeight;
    this.columnHeights[shortestColumnIndex] += newArticleHeight;

    if (window.kmw.facebookInitialized) {
      window.FB.XFBML.parse(newArticleCard);
    }
  },

  fetchMoreResults: function() {
    this.articleCollection.fetchNextArticles();
    // TODO why did we have this render again? it was so like the no more results thing would pop up or something.
    //this.render();
  },

  getImageHeight(intrinsicWidth, intrinsicHeight, actualWidth) {
    // This max height of 500 is duplicated in css for .article-card-image-ghost
    return Math.min((intrinsicHeight/intrinsicWidth)*actualWidth, 500);
  },

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

  infiniteScroll: function() {
    const self = this;
    if (this.onScrollFunction !== undefined) {
      throw "Attached infinite scroll handler twice."
    }
    this.onScrollFunction = _.throttle(function() {
      if (self.articleCollection !== undefined) {
        const distanceFromBottom = $(document).height() - $(window).scrollTop() - $(window).height();
        if (distanceFromBottom < 500)  {
          self.articleCollection.fetchNextArticles();
        }
      }
    }, 50);

    $(window).scroll(this.onScrollFunction);
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

  reRenderWhenNumberOfColumnsShouldChange: function(){
    const self = this;
    $(window).resize(_.debounce(function() {
      if (self.numColumns !== self.getNumColumns()) {
        self.numColumns = self.getNumColumns();
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
    this.listenTo(this.articleCollection, 'add', this.addArticle);
    this.listenTo(this.articleCollection, 'fetching', this.onFetching);
    this.listenTo(this.articleCollection, 'doneFetching', this.onDoneFetching);
    this.listenTo(this.articleCollection, 'noMoreResults', this.onNoMoreResults);
    this.render();
    this.reRenderWhenNumberOfColumnsShouldChange();
  },

  unbindInfiniteScroll: function() {
    $(window).off("scroll", this.onScrollFunction);
  },
});
