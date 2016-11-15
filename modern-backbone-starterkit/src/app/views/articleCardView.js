import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';

import template from 'TEMPLATESDIR/articleCardTemplate.hbs';
import 'STYLESDIR/stylus/articleCard.css';
import serviceProvider from 'UTILSDIR/serviceProvider';
import {parseFbElement} from 'UTILSDIR/facebooksdk';

export default Backbone.View.extend({
  className: 'article-card',

  events: {
    'click .kmw-js-upvote': 'upvoteClicked',
    'click .kmw-js-downvote': 'downvoteClicked',
  },

  initialize: function(options) {
    this.articleModel = options.articleModel;
    this.voteModel = options.voteModel;

    const newHTMLString = template({
      article: this.articleModel.toJSON(),
      displayCategory: serviceProvider.getRouter().getCategory() === 'home'
    });

    this.$el.html(newHTMLString);
    parseFbElement(this.el);
  },

  destroyView: function() {//http://stackoverflow.com/questions/6569704/destroy-or-remove-a-view-in-backbone-js
    // COMPLETELY UNBIND THE VIEW
    this.undelegateEvents();

    this.$el.removeData().unbind();

    // Remove view from DOM
    this.remove();
    Backbone.View.prototype.remove.call(this);
  },

  downvoteClicked: function() {
    this.voteModel.doVote("down");
    this.$('.kmw-js-upvote').removeClass('kmw-selected');
    this.$('.kmw-js-downvote').addClass('kmw-selected');
  },

  upvoteClicked: function() {
    this.voteModel.doVote("up");
    this.$('.kmw-js-upvote').addClass('kmw-selected');
    this.$('.kmw-js-downvote').removeClass('kmw-selected');
  }
});
