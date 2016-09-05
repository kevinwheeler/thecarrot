import $ from 'jquery';
import Backbone from 'backbone';

import serviceProvider from './utils/serviceProvider.js';

export default Backbone.Router.extend({

  // IMPORTANT: Routes need to be duplicated on server code and in navbar code.
  // also categories duplicated here in router.getCategory()
  routes: {
    'business'      : 'categoryRoute',
    'other'         : 'categoryRoute',
    'politics'      : 'categoryRoute',
    'spirituality'  : 'categoryRoute',
    'sports'        : 'categoryRoute',
    'science-and-technology'    : 'categoryRoute',

    '': 'categoryRoute',
    'admin'       : 'adminRoute',
    'admin/my-approval-histor:y'       : 'adminRoute',
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
    const pathnameToCategoryMap = {
      '/'                          : 'home',
      '/business'                  : 'business',
      '/entertainment'             : 'entertainment',
      '/other'                     : 'other',
      '/politics'                  : 'politics',
      '/spirituality'              : 'spirituality',
      '/sports'                    : 'sports',
      '/science-and-technology'    : 'science-and-technology',
    }
    let category = pathnameToCategoryMap[window.location.pathname];
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
        evt.preventDefault();
        self.navigate(urlWithoutLeadingSlash, true);
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
    if (param === "y") {
       adminViewInst = serviceProvider.getAdminView("approvalHistory");
    } else {
       adminViewInst = serviceProvider.getAdminView("needApproval");
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
