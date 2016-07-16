import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';
//import Marionette from 'backbone.marionette';

import template from 'TEMPLATESDIR/articleGridTemplate.hbs';
import 'UTILSDIR/facebooksdk';

//export default Marionette.ItemView.extend({
export default Backbone.View.extend({
  className: 'rwc-article-grid-view',

  initialize: function(options = {}) {
    // kmw: http://arturadib.com/hello-backbonejs/docs/1.html
    _.bindAll(this, 'render'); //comment came with code example: fixes loss of context for 'this' within methods

    this.views = [];

    this.articleCollection = options.articleCollection;

    this.listenTo(this.articleCollection, 'change add', this.render);

    this.render();
  },

  render: function() {
    _.forEach(this.views, function(view) {
      view.render();
    });

    this.$el.html(template({
      articles: this.articleCollection.toJSON()
    }));

    return this;
  }
});
