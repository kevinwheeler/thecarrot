import $ from 'jquery';
import Backbone from 'backbone';

import {categories} from 'ISOMORPHICDIR/categories';
import serviceProvider from './utils/serviceProvider.js';
import {articleSlugToId} from 'ISOMORPHICDIR/utils'
const articleRoute = require('ISOMORPHICDIR/routes').articleRoute;

export default Backbone.Router.extend({

  // IMPORTANT: Routes need to be duplicated on server code and in navbar code.
  // also categories duplicated here in router.getCategory()
  // Also, this hash doesn't include every route. There are more routes that are created dynamically in
  // initialize.
  routes: {
    '': 'categoryRoute',
    'admin/:subroute': 'adminRoute',
    //'article/:articleSlug'       : 'articleRoute',
    //'admin/article/:articleSlug'       : 'articleRoute',
    'flags/:articleId': 'flagsRoute',
    'login'       : 'loginRoute',
    'user/:userId'       : 'userRoute',
    'upload': 'uploadRoute'
  },

  execute: function(callback, args, name) {
    this.trigger('beforeRoute');
    if (callback) {
      callback.apply(this, args);
    }
  },

  exports: {
    articleRoutePrefix: articleRoute.routePrefix,
    adminArticleRoutePrefix: articleRoute.adminRoutePrefix
  },

  initialize(options) {
    this.$app = $('<div id="js-app" class="kmw-app"></div>');
    $('body').append(this.$app);

    for (let i=0; i < categories.length; i++) {
      this.route(categories[i].urlSlug, "categoryRoute");
    }

    this.route(articleRoute.backboneRouteString1, "articleRoute");
    //this.route(articleRoute.backboneRouteString2, "articleRoute");

    // http://stackoverflow.com/questions/7131909/facebook-callback-appends-to-return-url
    // Facebook adds #_=_ to the end of the redirect url after someone logs in or authenticates using facebook.
    // That screws up our routing when the redirect url would otherwise be "/", so we remove it.
    if (window.location.hash == '#_=_') {
      history.replaceState
        ? history.replaceState(null, null, window.location.href.split('#')[0])
        : window.location.hash = '';
    }

    this.interceptInternalURLs();
  },

  currentRouteIsAdminArticleRoute() {
    let url = window.location.pathname;

    if (url.indexOf('/' + articleRoute.adminRoutePrefix) === 0) {
      return true;
    } else {
      if ((url.indexOf('/' + articleRoute.routePrefix) !== 0) && (url.indexOf('/' + articleRoute.adminRoutePrefix) !== 0)) {
        throw "Called currentRouteIsAdminArticleRoute when not in an article route"
      }
      return false;
    }
  },

  // returns the category of the current route. Returns 'home' if we are on the homepage, and returns 'N/A' if we
  // aren't on a category route.
  getCategory() {
    let categoryURLSlug = window.location.pathname.substring(1); // remove leading slash
    let category;
    for (let i=0; i < categories.length; i++) {
      if (categoryURLSlug === categories[i].urlSlug) {
        category = categories[i].otherSlug;
      }
    }
    if (categoryURLSlug === '') {
      category = 'home'
    }
    if (category === undefined) {
      category = 'N/A'
    }
    return category;
  },

  getCategoryRoutePrefix() {
    return '/';
  },

  // Make sure when a user click's a link to somewhere else in our page it doesn't
  // cause a new pageload.
  interceptInternalURLs() {
    var self = this;

    //TODO for peformance reasons, it would be better to not use event delegation on document.
    $(document).on('click', 'a.kmw-dont-pageload', function(evt) {
      let href = $(this).attr('href');
      let isRootRelativeUrl = (href.charAt(0) === '/') && (href.charAt(1) !== '/');
      if (isRootRelativeUrl) {
        let urlWithoutLeadingSlash = href.slice(1, href.length);
        //http://stackoverflow.com/questions/24715689/detect-if-the-user-wanted-to-open-link-in-new-window-or-tab-mac-and-windows
        if (event.ctrlKey || event.shiftKey || event.metaKey || event.which == 2) {
          return true;
        } else {
          evt.preventDefault();
          self.navigate(urlWithoutLeadingSlash, true);
        }
      } else {
        throw "'dont-pageload' links that aren't root relative aren't implemented right now.";
      }
    });
  },

  articleRoute(articleSlug) {

    const articleId = articleSlugToId(articleSlug);
    let articleViewInst = serviceProvider.getArticleView(articleId);
    this.$app.children().detach();
    this.$app.empty().append(articleViewInst.$el);

    const articleCollection = serviceProvider.getBestArticlesCollection();
    articleCollection.fetchNextArticles();
    articleViewInst.getArticleGridView().setArticleCollection(articleCollection);
  },

  adminRoute(param) {
    let adminViewInst;
    if (param === 'need-approval-articles') {
      adminViewInst = serviceProvider.getAdminView("needApproval");
    } else if (param === "my-approval-history") {
       adminViewInst = serviceProvider.getAdminView("approvalHistory");
    } else if (param === 'flagged-articles') {
      adminViewInst = serviceProvider.getAdminView("flaggedArticles");
    } else {
      throw "invalid admin route";
    }
    this.$app.children().detach();
    this.$app.empty().append(adminViewInst.$el);
  },

  flagsRoute(articleId) {
    let flagsViewInst = serviceProvider.getFlagsView(articleId);
    this.$app.children().detach();
    this.$app.empty().append(flagsViewInst.$el);

    //let userViewInst = serviceProvider.getUserView(userId);
    //const app = $('#js-app');
    //app.children().detach();
    //$('#js-app').empty().append(userViewInst.$el);
  },

  userRoute(userId) {
    let userViewInst = serviceProvider.getUserView(userId);
    this.$app.children().detach();
    this.$app.empty().append(userViewInst.$el);
  },

  categoryRoute() {
    if (this.categoryView === undefined) {
      // Note this calls getHomeView instead of getCategoryView. Change this later to be less gacky if desired.
      this.categoryView = serviceProvider.getHomeView();
    }
    this.$app.children().detach();
    this.$app.empty().append(this.categoryView.$el);
    this.categoryView.render();
  },

  //homeRoute() {
  //  let homeViewInst = serviceProvider.getHomeView();
  //  const app = $('#js-app');
  //  app.children().detach();
  //  $('#js-app').empty().append(homeViewInst.$el);
  //  homeViewInst.render();
  //},

  loginRoute() {
    let loginViewInst = serviceProvider.getLoginView();
    this.$app.children().detach();
    this.$app.empty().append(loginViewInst.$el);
  },

  uploadRoute() {
    const uploadEl = $("<div><p>Hello</p></div>")[0];
    this.$app.children().detach();
    this.$app.empty().append(uploadEl);
    serviceProvider.getUploadView(uploadEl);
  },
});
