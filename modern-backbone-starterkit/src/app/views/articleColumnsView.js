import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';
//import Marionette from 'backbone.marionette';

import template from 'TEMPLATESDIR/articleColumnsTemplate.hbs';
import articleCardTemplate from 'TEMPLATESDIR/articleCardTemplate.hbs';
import 'STYLESDIR/stylus/articleCard.css';
import 'STYLESDIR/stylus/articleColumns.css';
import dd from 'UTILSDIR/diffDOM';

//export default Marionette.ItemView.extend({
export default Backbone.View.extend({
  className: 'kmw-article-columns-view',

  events: {
  },

  initialize: function(options) {
    this.router = options.router;
  },

  render: _.throttle(function() {
      let numColumns = 3;
      // num columns array is a hack so that we can loop a dynamic number of times in handlebars.
      // The only way I saw to do this was to loop over each element in a dynamically sized array.
      const numColumnsArray = [];
      for (let i=1; i <= numColumns; i++) {
        numColumnsArray.push(i);
      }
      const newHTMLString = template({
        articles: this.articleCollection.toJSON(),
        fetchingMoreResults: this.articleCollection.getCurrentlyFetching(),
        noMoreResults: this.articleCollection.getNoMoreResults(),
        numColumns: numColumns,
        numColumnsArray: numColumnsArray,
      });
      const newEl = $.parseHTML(newHTMLString)[0];
      const $newEl = $(newEl);
      const $columns = $newEl.find('.article-column');
      const articles = this.articleCollection.toJSON();
      const displayCategory = this.router.getCategory() === 'home';
      for (let i=0; i < articles.length; i++) {
        console.log("i = " + i);
        console.log("article = ");
        console.log(articles[i]);
        $columns.get(i % numColumns).appendChild(
          $.parseHTML(
            articleCardTemplate({
              article: articles[i],
              displayCategory: displayCategory
            })
          )[0]
        );
      }

      // apply update using diffDom
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
