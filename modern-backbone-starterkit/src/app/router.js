import $ from 'jquery';
import Backbone from 'backbone';

import serviceProvider from './utils/serviceProvider.js';

export default Backbone.Router.extend({

  // IMPORTANT: Routes need to be duplicated on server code and in navbar code.
  routes: {
    'business'      : 'categoryRoute',
    'education'     : 'categoryRoute',
    'other'         : 'categoryRoute',
    'politics'      : 'categoryRoute',
    'spirituality'  : 'categoryRoute',
    'sports'        : 'categoryRoute',
    'technology'    : 'categoryRoute',

    '': 'homeRoute',
    'article/:articleid'       : 'articleRoute',
    'login'       : 'loginRoute',
    'account'       : 'accountRoute',
    'upload': 'uploadRoute'
  },

  afterRoute() {
    this.routerEvents.trigger('routed');
  },

  exports: {
    articleRoutePrefix: 'article'
  },

  initialize(options) {
    $('body').append('<div id="js-app"></div>');
    this.routerEvents = options.routerEvents;

    // http://stackoverflow.com/questions/7131909/facebook-callback-appends-to-return-url
    // Facebook adds #_=_ to the end of the redirect url after someone logs in or authenticates using facebook.
    // That screws up our routing when the redirect url would otherwise be "/", so we remove it.
    if (window.location.hash == '#_=_'){
      history.replaceState
        ? history.replaceState(null, null, window.location.href.split('#')[0])
        : window.location.hash = '';
    }

    //this.interceptInternalURLs();
  },

  // Make sure when a user click's a link to somewhere else in our page it doesn't
  // cause a new pageload.
  //interceptInternalURLs() {
  //  var self = this;

  //  //TODO for peformance reasons, it would be better to not use event delegation on document.
  //  $(document).on('click', 'a.rwc-dont-pageload', function(evt) {
  //    let href = $(this).attr('href');
  //    let isRootRelativeUrl = (href.charAt(0) === '/') && (href.charAt(1) !== '/');
  //    if (isRootRelativeUrl) {
  //      let urlWithoutLeadingSlash = href.slice(1, href.length);
  //      evt.preventDefault();
  //      self.navigate(urlWithoutLeadingSlash, true);
  //    } else {
  //      throw "'dont-pageload' links that aren't root relative aren't implemented right now.";
  //    }
  //  });
  //},

  articleRoute() {
    let homeViewInst = serviceProvider.getArticleView();
    homeViewInst.render();
    $('#js-app').empty().append(homeViewInst.$el);
    this.afterRoute();
  },

  accountRoute() {
    let accountViewInst = serviceProvider.getAccountView();
    accountViewInst.render();
    $('#js-app').empty().append(accountViewInst.$el);
    this.afterRoute();
  },

  categoryRoute() {
    let homeViewInst = serviceProvider.getHomeView();
    homeViewInst.render();
    $('#js-app').empty().append(homeViewInst.$el);
    this.afterRoute();
  },

  homeRoute() {
    let homeViewInst = serviceProvider.getHomeView();
    homeViewInst.render();
    $('#js-app').empty().append(homeViewInst.$el);
    this.afterRoute();
  },

  loginRoute() {
    let loginViewInst = serviceProvider.getLoginView();
    loginViewInst.render();
    $('#js-app').empty().append(loginViewInst.$el);
    this.afterRoute();
  },

  uploadRoute() {
    let uploadViewInst = serviceProvider.getUploadView();
    uploadViewInst.render();
    $('#js-app').empty().append(uploadViewInst.$el);
    this.afterRoute();
  },
});
