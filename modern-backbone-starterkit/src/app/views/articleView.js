import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';

import serviceProvider from 'UTILSDIR/serviceProvider';
import template from 'TEMPLATESDIR/articleTemplate.hbs';
import 'STYLESDIR/stylus/article.css';
import {parseFbElement} from 'UTILSDIR/facebooksdk';


//export default Marionette.ItemView.extend({
export default Backbone.View.extend({
  className: 'kmw-article-view',

  events: {
    'click .kmw-js-spam-flag': 'spamFlagClicked',
    'click .kmw-js-upvote': 'upvoteClicked',
    'click .kmw-js-downvote': 'downvoteClicked',
  },

  initialize: function(options) {
    this.articleGridView = options.articleGridView;
    this.articleModel = options.articleModel;
    this.currentUserModel = options.currentUserModel;
    this.flagArticleModalView = options.flagArticleModalView;
    this.navView = options.navView;
    this.voteModel = options.voteModel;
    this.router = options.router;
    this.listenTo(this.voteModel, 'change', this.render);
    this.listenTo(this.articleModel, 'change', this.render);
    this.listenTo(this.currentUserModel, 'change', this.render);
    this.listenTo(this.router, 'beforeRoute', this.remove);
    this.socialPluginsCached = false;
    this.socialPluginsParsed = false;
    this.render();
    this.articleGridView.infiniteScroll();
  },

  render: _.throttle(function() {
      const viewerIsAuthor = this.articleModel.get('viewerIsAuthor');
      const approved = this.articleModel.get('approval') === 'approved';
      const approvalDenied = this.articleModel.get('approval') === 'denied';
      const approvalPending = this.articleModel.get('approval') === 'pending';
      const approvalPendingAndAuthor = approvalPending && viewerIsAuthor;
      const approvalPendingAndNotAuthor = approvalPending && !viewerIsAuthor;
      const approvalStatus = this.articleModel.get('approval');
      const currentUserDoneFetching = this.currentUserModel.get('doneFetching') === true;
      const articleDoneFetching = this.articleModel.get('doneFetching') === true;
      const isAdminRoute = serviceProvider.getRouter().currentRouteIsAdminArticleRoute();
      const isAdmin = this.currentUserModel.get('userType') === 'admin';
      const isAdminAndIsAdminRoute = isAdmin && isAdminRoute;

      const authorOrApprovedOrAdmin = viewerIsAuthor || approved || isAdmin;
      const isAdminRouteAndNotDoneFetching = isAdminRoute && !currentUserDoneFetching;
      const isAdminRouteAndNotAdmin = isAdminRoute && currentUserDoneFetching && !isAdmin;

      const articleURL = [location.protocol, '//', location.host, location.pathname].join('');
      const urlEncodedArticleURL = encodeURIComponent(articleURL);
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
        articleDoneFetching: articleDoneFetching,
        //http://stackoverflow.com/questions/5817505/is-there-any-method-to-get-url-without-query-string-in-java-script
        articleURL: articleURL,
        citationURL: "http://www.chicagotribune.com/bluesky/technology/ct-share-this-link-without-reading-it-ap-bsi-20160618-story.html",
        currentUserDoneFetching: currentUserDoneFetching,
        imageURL: this.articleModel.get('imageURL'),
        isAdmin: isAdmin,
        isAdminAndIsAdminRoute: isAdminAndIsAdminRoute,
        isAdminRoute: isAdminRoute,
        isAdminRouteAndNotAdmin: isAdminRouteAndNotAdmin,
        isAdminRouteAndNotDoneFetching: isAdminRouteAndNotDoneFetching,
        isDownVoted: this.voteModel.isDownVoted(),
        isUpVoted: this.voteModel.isUpVoted(),
        socialPluginsCached: this.socialPluginsCached,
        socialPluginsParsed: this.socialPluginsParsed,
        urlEncodedArticleURL: urlEncodedArticleURL,
      }));
      this.attachSubViews();
      if (approved && !this.socialPluginsCached) {
        this.cacheSocialPlugins();
      }

      return this;
    }, 16
  ),

  remove: function() {
    this.articleGridView.unbindInfiniteScroll();
    this.stopListening();
  },

  attachSubViews: function() {
    let $nav = this.$('.NAV-STUB');
    $nav.replaceWith(this.navView.$el);

    const $articleGrid = this.$('.ARTICLE-GRID-STUB');
    $articleGrid.replaceWith(this.articleGridView.$el);

    if (this.socialPluginsCached) {
      let $fbLikeStub = this.$('.FB-LIKE-STUB');
      $fbLikeStub.replaceWith(this.fbLikeEl);
      let $fbShareStub= this.$('.FB-SHARE-STUB');
      $fbShareStub.replaceWith(this.fbShareEl);
      let $fbCommentsStub = this.$('.FB-COMMENTS-STUB');
      $fbCommentsStub.replaceWith(this.fbCommentsEl);
    }
  },

  cacheSocialPlugins: function() {
    this.fbLikeEl = this.$('.fb-like').get(0);
    this.fbShareEl = this.$('.fb-share-button').get(0);
    this.fbCommentsEl= this.$('.fb-comments').get(0);
    _.bindAll(this, 'onSocialPluginsParsed');
    parseFbElement(this.el, this.onSocialPluginsParsed);
    this.socialPluginsCached = true;
  },

  downvoteClicked: function() {
    this.voteModel.doVote("down");
  },

  getArticleGridView: function() {
    return this.articleGridView;
  },

  onSocialPluginsParsed: function() {
    this.socialPluginsParsed = true;
    this.render();
  },

  spamFlagClicked: function() {
    this.flagArticleModalView.open();
  },

  upvoteClicked: function() {
    this.voteModel.doVote("up");
  }
});
