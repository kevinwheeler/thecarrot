import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';

import isEmail from 'validator/lib/isEmail';
import serviceProvider from 'UTILSDIR/serviceProvider';
import Spinner from 'UTILSDIR/spin';
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

    'submit .approval-notification-form': 'notificationFormSubmitted',
    'submit #patch-article': 'patchArticle',
  },

  initialize: function(options) {
    _.bindAll(this, ['onSocialPluginsParsed', 'emailNotificationRegistrationSuccess','emailNotificationRegistrationError']);
    this.articleGridView = options.articleGridView;
    this.articleModel = options.articleModel;
    this.currentUserModel = options.currentUserModel;
    this.flagArticleModalView = options.flagArticleModalView;
    this.navView = options.navView;
    this.voteModel = options.voteModel;
    this.router = options.router;
    this.listenTo(this.voteModel, 'change', this.render);
    this.listenTo(this.articleModel, 'change', this.render);
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
      const articleDoneFetching = this.articleModel.get('doneFetching') === true;
      const isAdmin = this.currentUserModel.get('userType') === 'admin';
      const authorOrApprovedOrAdmin = viewerIsAuthor || approved || isAdmin;

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
        imageURL: this.articleModel.get('imageURL'),
        isAdmin: isAdmin,
        isDownVoted: this.voteModel.isDownVoted(),
        isUpVoted: this.voteModel.isUpVoted(),
        listedStatus: this.articleModel.get('listed'),
        socialPluginsCached: this.socialPluginsCached,
        socialPluginsParsed: this.socialPluginsParsed,
        urlEncodedArticleURL: urlEncodedArticleURL,
      }));
      this.$("#article-id").val(serviceProvider.getRouter().getArticleIdOfCurrentRoute());
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
    parseFbElement(this.el, this.onSocialPluginsParsed);
    this.socialPluginsCached = true;
  },

  downvoteClicked: function() {
    this.voteModel.doVote("down");
  },

  getArticleGridView: function() {
    return this.articleGridView;
  },

  notificationFormSubmitted: function(e) {
    const opts = {
      lines: 12             // The number of lines to draw
      , length: 7             // The length of each line
      , width: 5              // The line thickness
      , radius: 10            // The radius of the inner circle
      , scale: 1.0            // Scales overall size of the spinner
      , corners: 1            // Roundness (0..1)
      , color: '#000'         // #rgb or #rrggbb
      , opacity: 1/4          // Opacity of the lines
      , rotate: 0             // Rotation offset
      , direction: 1          // 1: clockwise, -1: counterclockwise
      , speed: 1              // Rounds per second
      , trail: 100            // Afterglow percentage
      , fps: 20               // Frames per second when using setTimeout()
      , zIndex: 2e9           // Use a high z-index by default
      , className: 'spinner'  // CSS class to assign to the element
      , top: '50%'            // center vertically
      , left: '50%'           // center horizontally
      , shadow: false         // Whether to render a shadow
      , hwaccel: false        // Whether to use hardware acceleration (might be buggy)
      , position: 'absolute'  // Element positioning
    }

    const emailAddress = this.$("#article-notification-email").val();
    const isValidEmailAddr = isEmail(emailAddress);

    if (isValidEmailAddr) {
      this.$(".article-invalid-email").addClass("kmw-hidden");
      this.$(".notification-email-form-group").removeClass("has-error");
      const $loadingWheel = this.$("#approval-notification-loading-wheel");
      $loadingWheel.removeClass("kmw-hidden");
      const spinner = new Spinner(opts).spin($loadingWheel.get(0));

      const self = this;
      const $form = $(e.target);
      const url = $form.attr('action');
      const method = $form.attr('method');
      $.ajax({
        data: $form.serialize(),
        error: self.emailNotificationRegistrationError,
        success: self.emailNotificationRegistrationSuccess,
        type: method,
        url: url,
      });
    } else {
      this.$(".article-invalid-email").removeClass("kmw-hidden");
      this.$(".notification-email-form-group").addClass("has-error");
    }

    e.preventDefault();
  },

  emailNotificationRegistrationSuccess: function(response) {
    this.$("#approval-notification-loading-wheel").addClass("kmw-hidden");
    this.$(".approval-notification-success").removeClass("kmw-hidden");
    this.$(".approval-notification-error").addClass("kmw-hidden");
  },

  emailNotificationRegistrationError: function(xhr, ajaxOptions, thrownError) {
    this.$("#approval-notification-loading-wheel").addClass("kmw-hidden");
    this.$(".approval-notification-success").addClass("kmw-hidden");
    this.$(".approval-notification-error").removeClass("kmw-hidden");
  },

  onSocialPluginsParsed: function() {
    this.socialPluginsParsed = true;
    console.log("asdfasdf");
    this.$(".kmw-loading-comments").css('display', 'none');
  },

  patchArticle: function(e) {
    console.log("in patch article");
      const $form = $(e.target);
      const url = $form.attr('action');
      const method = "PATCH";
      $.ajax({
        data: $form.serialize(),
        error: function() {alert("Error updating article.")},
        success: function() {window.location.reload();},
        type: method,
        url: url,
      });

    e.preventDefault();
  },

  spamFlagClicked: function() {
    this.flagArticleModalView.open();
  },

  upvoteClicked: function() {
    this.voteModel.doVote("up");
  }
});
