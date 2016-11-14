import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';

import ArticleCardView from 'VIEWSDIR/articleCardView';

export default Backbone.View.extend({
  className: 'article-column',

  events: {
  },

  initialize: function(options) {
    const self = this;
    this.numColumns = options.numColumns;
    this.articleGetter = options.articleGetter;
    this.$el.addClass("article-column-1-of-" + this.numColumns);

    for (let i=0; i < 5; i++) {
      self.articleGetter.getNextArticle().then(function(articleModel) {
        console.log("appending article card view");
        const articleCardView = new ArticleCardView({
          articleModel: articleModel
        });
        self.$el.append(articleCardView.el);
      }).catch(function(err) {
        console.log("in catch in initialize. error =");
        console.log(err);
      })
    }
    this.infiniteScroll();
  },

  infiniteScroll: function() {
    const self = this;
    if (this.scrollFunction !== undefined) {
      throw "Attached infinite scroll handler twice."
    }
    const $app = $("#js-app");
    this.scrollFunction = _.throttle(function() {
      self.articleGetter.getNextArticle().then(function(articleModel) {
        console.log("in then. article model = ");
        console.log(articleModel);
        const articleCardView = new ArticleCardView({
          articleModel: articleModel
        });
        self.$el.append(articleCardView.el);
      }).catch(function(err) {
        console.log("in catch. err = ");
        console.log(err);
      });
    }, 1000); //TODO don't throttle, only use once.

    $app.scroll(this.scrollFunction);
    //TODO de-register
  },
});
