import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';

import template from 'TEMPLATESDIR/articleCardTemplate.hbs';
import 'STYLESDIR/stylus/articleCard.css';
import serviceProvider from 'UTILSDIR/serviceProvider';
import {parseFbElement} from 'UTILSDIR/facebooksdk'; //TODO

export default Backbone.View.extend({
  className: 'article-card',

  events: {
  },

  initialize: function(options) {
    this.articleModel = options.articleModel;
    this.render();
  },

  render: function() {
    const newHTMLString = template({
      article: this.articleModel.toJSON(),
      displayCategory: serviceProvider.getRouter().getCategory() === 'home'
    });

    this.$el.html(newHTMLString);
    parseFbElement(this.el);

    return this;
  },
});
