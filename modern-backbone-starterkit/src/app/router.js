import $ from 'jquery';
import Backbone from 'backbone';

import serviceProvider from './utils/serviceProvider.js';

export default Backbone.Router.extend({

  // IMPORTANT: Routes need to be duplicated on server code and in navbar code.
  routes: {
    '': 'homeRoute',
    'politics'    : 'categoryRoute',
    'sports'      : 'categoryRoute',
    'spirituality': 'categoryRoute',
    'business'    : 'categoryRoute',
    'other'       : 'categoryRoute'
    //'about': 'aboutRoute',
  },

  afterRoute() {
    this.routerEvents.trigger('routed');
  },

  initialize(options) {
    $('body').append('<div id="js-app"></div>');
    this.routerEvents = options.routerEvents;

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

  aboutRoute() {
    let aboutViewInst = serviceProvider.getAboutView();
    aboutViewInst.render();
    $('#js-app').empty().append(aboutViewInst.$el);
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

});
