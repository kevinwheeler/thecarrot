import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';

import serviceProvider from 'UTILSDIR/serviceProvider';
import template from 'TEMPLATESDIR/articleTemplate.hbs';
import 'STYLESDIR/stylus/article.css';
import 'UTILSDIR/facebooksdk';

//export default Marionette.ItemView.extend({
export default Backbone.View.extend({
  className: 'kmw-article-view',

  initialize: function(options = {}) {

    this.navView = options.navView;
    this.articleModel = options.articleModel;
    this.currentUserModel = options.currentUserModel;
    this.listenTo(this.articleModel, 'change', this.render);
    this.listenTo(this.currentUserModel, 'change', this.render);

    this.render();
  },

  render: _.throttle(function() {
      const viewerIsAuthor = this.articleModel.get('viewerIsAuthor');
      const approved = this.articleModel.get('approval') === 'approved';
      const approvalDenied = this.articleModel.get('approval') === 'denied';
      const approvalPending = this.articleModel.get('approval') === 'pending';
      const approvalPendingAndAuthor = approvalPending && viewerIsAuthor;
      const approvalPendingAndNotAuthor = approvalPending && !viewerIsAuthor;
      const approvalStatus= this.articleModel.get('approval');
      const currentUserDoneFetching = this.currentUserModel.get('doneFetching') === true;
      const isAdminRoute = serviceProvider.getRouter().currentRouteIsAdminArticleRoute();
      const isAdmin = this.currentUserModel.get('userType') === 'admin';

      const authorOrApprovedOrAdmin = viewerIsAuthor || approved || isAdmin;
      const isAdminRouteAndNotDoneFetching = isAdminRoute && !currentUserDoneFetching;
      const isAdminRouteAndNotAdmin = isAdminRoute && currentUserDoneFetching && !isAdmin;

      this.$el.children().detach();
      this.$el.html(template({
        authorOrApprovedOrAdmin: authorOrApprovedOrAdmin,
        approved: approved,
        approvalDenied: approvalDenied,
        approvalPending: approvalPending,
        approvalPendingAndAuthor: approvalPendingAndAuthor,
        approvalPendingAndNotAuthor: approvalPendingAndNotAuthor,
        approvalStatus: approvalStatus,
        article: this.articleModel.toJSON(),
        //http://stackoverflow.com/questions/5817505/is-there-any-method-to-get-url-without-query-string-in-java-script
        articleURL: [location.protocol, '//', location.host, location.pathname].join(''),
        citationURL: "http://www.chicagotribune.com/bluesky/technology/ct-share-this-link-without-reading-it-ap-bsi-20160618-story.html",
        currentUserDoneFetching: currentUserDoneFetching,
        imageURL: this.articleModel.get('imageURL'),
        isAdmin: isAdmin,
        isAdminRoute: isAdminRoute,
        isAdminRouteAndNotAdmin: isAdminRouteAndNotAdmin,
        isAdminRouteAndNotDoneFetching: isAdminRouteAndNotDoneFetching,
      }));
      this.attachSubViews();
      return this;
    }, 16
  ),

  attachSubViews: function() {
    let $nav = this.$('.NAV-STUB');
    $nav.replaceWith(this.navView.$el);
  },

});
