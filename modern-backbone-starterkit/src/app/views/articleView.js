import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';

import template from 'TEMPLATESDIR/articleTemplate.hbs';
import 'STYLESDIR/stylus/article.css';
import 'UTILSDIR/facebooksdk';

//export default Marionette.ItemView.extend({
export default Backbone.View.extend({
  className: 'rwc-article-view',

  initialize: function(options = {}) {
    this.views = [];

    this.views.push(options.navView);
    this.navView = options.navView;
    this.articleModel = options.articleModel;
    this.listenTo(this.articleModel, 'change', this.render);

    // kmw: http://arturadib.com/hello-backbonejs/docs/1.html
    _.bindAll(this, 'render'); //comment came with code example: fixes loss of context for 'this' within methods

    this.attachSubViews();
    this.render();
  },

  //TODO throttle
  render: function() {
    console.log("rendering article view");
    //_.forEach(this.views, function(view) {
    //  view.render();
    //});

    //this.$el.html(template({
    //  article: window.kmw.article,
    //  //http://stackoverflow.com/questions/5817505/is-there-any-method-to-get-url-without-query-string-in-java-script
    //  articleURL: [location.protocol, '//', location.host, location.pathname].join(''),
    //  citationURL: "http://www.chicagotribune.com/bluesky/technology/ct-share-this-link-without-reading-it-ap-bsi-20160618-story.html",
    //  imageURL: window.kmw.article.imageURL
    //}));

    this.$el.html(template({
      article: this.articleModel.toJSON(),
      //http://stackoverflow.com/questions/5817505/is-there-any-method-to-get-url-without-query-string-in-java-script
      articleURL: this.articleModel.get('articleURL'),
      //articleURL: [location.protocol, '//', location.host, location.pathname].join(''),
      citationURL: "http://www.chicagotribune.com/bluesky/technology/ct-share-this-link-without-reading-it-ap-bsi-20160618-story.html",
      imageURL: this.articleModel.get('imageURL')
    }));
    return this;
  },

  attachSubViews: function() {
    let $nav = this.$('.NAV-STUB');
    $nav.replaceWith(this.navView.$el);
  },

});
