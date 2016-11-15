import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';

import ArticleCardView from 'VIEWSDIR/articleCardView';

export default Backbone.View.extend({
  className: 'article-column',

  events: {
  },

  initialize: function(options) {
    this.numColumns = options.numColumns;
    this.articleGetter = options.articleGetter;
    this.$el.addClass("article-column-1-of-" + this.numColumns);

    this.infiniteScroll();
  },

  destroyView: function() {//http://stackoverflow.com/questions/6569704/destroy-or-remove-a-view-in-backbone-js

    // COMPLETELY UNBIND THE VIEW
    this.undelegateEvents();

    this.$el.removeData().unbind();

    // Remove view from DOM
    this.remove();
    Backbone.View.prototype.remove.call(this);

    $("#js-app").off("scroll", this.scrollFunction);
  },


  getArticle: function() {
    const self = this;
    this.articleGetter.getNextArticle().then(function(articleModel) {
      const articleCardView = new ArticleCardView({
        articleModel: articleModel
      });
      self.$el.append(articleCardView.el);
    }).catch(function(err) {
      if (err !== "no more results") {
        throw err;
      }
    });
  },

  infiniteScroll: function() {
    const self = this;
    if (this.scrollFunction !== undefined) {
      throw "Attached infinite scroll handler twice."
    }
    const $app = $("#js-app");
    this.scrollFunction = _.throttle(function() {
      self.getArticle();
    }, 500);

    $app.on("scroll", this.scrollFunction);
  },
});
