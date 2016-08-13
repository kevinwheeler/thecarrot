import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';

import escaper from 'ISOMORPHICDIR/escaper.js';
import template from 'TEMPLATESDIR/articleTemplate.hbs';
import 'UTILSDIR/facebooksdk';

//export default Marionette.ItemView.extend({
export default Backbone.View.extend({
  className: 'rwc-article-view',

  initialize: function(options = {}) {
    this.views = [];

    this.views.push(options.navView);
    this.navView = options.navView;

    // kmw: http://arturadib.com/hello-backbonejs/docs/1.html
    _.bindAll(this, 'render'); //comment came with code example: fixes loss of context for 'this' within methods

    this.$el.html(template({
      //http://stackoverflow.com/questions/5817505/is-there-any-method-to-get-url-without-query-string-in-java-script
      articleURL: [location.protocol, '//', location.host, location.pathname].join(''),
      imageURL: window.kmw.article.imageURL
    }));
    console.log("obj = ");
    console.log(escaper);
    this.$('#kmw-headline').text(escaper.unescapeHtml(window.kmw.article.headline));
    this.$('#kmw-subline').text(escaper.unescapeHtml(window.kmw.article.subline));
    this.attachSubViews();
    this.render();
  },

  render: function() {
    _.forEach(this.views, function(view) {
      view.render();
    });
    return this;
  },

  attachSubViews: function() {
    let $nav = this.$('.NAV-STUB');
    $nav.replaceWith(this.navView.$el);
  },

});
