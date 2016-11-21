import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';

import ArticleCardView from 'VIEWSDIR/articleCardView';
import AdView from 'VIEWSDIR/adView300x250';
import VoteModel from 'MODELSDIR/voteModel';

export default Backbone.View.extend({
  className: 'article-column',

  events: {
  },

  initialize: function(options) {
    this.numColumns = options.numColumns;
    this.articleGetter = options.articleGetter;
    this.$el.addClass("article-column-1-of-" + this.numColumns);
    this.articleCardViews = [];

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
    _.forEach(this.articleCardViews, function(view) {
      view.destroyView();
    })
  },


  getArticle: function() {
    const self = this;
    this.articleGetter.getNextArticle().then(function(articleModel) {
      const voteModel = new VoteModel({
        articleId: articleModel.get("_id")
      });

      const articleCardView = new ArticleCardView({
        articleModel: articleModel,
        voteModel: voteModel
      });
      self.$el.append(articleCardView.el);
      self.articleCardViews.push(articleCardView);

      if (self.articleCardViews.length % 4 === 0 && window.kmw.chitikaCounter < 3) {
        self.$el.append((new AdView()).el);
      }
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
