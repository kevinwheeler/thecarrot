import $ from 'jquery';
import Backbone from 'backbone';

import categories from 'ISOMORPHICDIR/categories';
import serviceProvider from './utils/serviceProvider.js';

export default Backbone.Router.extend({

  // IMPORTANT: Routes need to be duplicated on server code and in navbar code.
  // also categories duplicated here in router.getCategory()
  // Also, this hash doesn't include every route. There are more routes that are created dynamically in
  // initialize.
  routes: {
    '': 'categoryRoute',
    'admin/:subroute'       : 'adminRoute',
    'article/:articleSlug'       : 'articleRoute',
    'admin/article/:articleSlug'       : 'articleRoute',
    'login'       : 'loginRoute',
    'user/:userId'       : 'userRoute',
    'upload': 'uploadRoute'
  },

  execute: function(callback, args, name) {
    if (this.categoryView !== undefined) {
      this.categoryView.beforeRoute();
    }
    if (callback) {
      callback.apply(this, args);
    }
  },

  exports: {
    articleRoutePrefix: 'article',
    adminArticleRoutePrefix: 'admin/article'
  },

  initialize(options) {
    $('body').append('<div id="js-app"></div>');

    for (let i=0; i < categories.length; i++) {
      this.route(categories[i].urlSlug, "categoryRoute");
    }

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

    if (url.indexOf('/admin/article') === 0) {
      return true;
    } else {
      if ((url.indexOf('/article') !== 0) && (url.indexOf('/admin/article') !== 0)) {
        throw "Called currentRouteIsAdminArticleRoute when not in an article route"
      }
      return false;
    }
  },

  getArticleIdOfCurrentRoute() {
    let url = window.location.pathname;
    if ((url.indexOf('/article') !== 0) && (url.indexOf('/admin/article') !== 0)) {
      throw "Called getArticleIdOfCurrentRoute() when not in an article route";
    }

    if (url.charAt(url.length - 1) === '/') { // Cut off trailing slash if there is one.
      url = url.substr(0, url.length - 1);
    }

    let articleSlug = url.substring(url.lastIndexOf('/') + 1);
    const id = parseInt(articleSlug, 10);
    return id;
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

  articleRoute() {
    let articleViewInst = serviceProvider.getArticleView();
    const app = $('#js-app');
    app.children().detach();
    $('#js-app').empty().append(articleViewInst.$el);
  },

  adminRoute(param) {
    let adminViewInst;
    console.log("in admin route. param = " + param)
    if (param === 'need-approval-articles') {
      adminViewInst = serviceProvider.getAdminView("needApproval");
    } else if (param === "my-approval-history") {
       adminViewInst = serviceProvider.getAdminView("approvalHistory");
    } else if (param === 'flagged-articles') {
      adminViewInst = serviceProvider.getAdminView("flaggedArticles");
    } else {
      throw "invalid admin route";
    }
    const app = $('#js-app');
    app.children().detach();
    $('#js-app').empty().append(adminViewInst.$el);
  },

  userRoute(userId) {
    let userViewInst = serviceProvider.getUserView(userId);
    const app = $('#js-app');
    app.children().detach();
    $('#js-app').empty().append(userViewInst.$el);
  },

  categoryRoute() {
    if (this.categoryView === undefined) {
      // Note this calls getHomeView instead of getCategoryView. Change this later to be less gacky if desired.
      this.categoryView = serviceProvider.getHomeView();
    }
    const app = $('#js-app');
    app.children().detach();
    $('#js-app').empty().append(this.categoryView.$el);
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
    const app = $('#js-app');
    app.children().detach();
    $('#js-app').empty().append(loginViewInst.$el);
  },

  uploadRoute() {
    let uploadViewInst = serviceProvider.getUploadView();
    const app = $('#js-app');
    app.children().detach();
    $('#js-app').empty().append(uploadViewInst.$el);
  },
});
