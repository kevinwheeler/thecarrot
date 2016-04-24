import $ from 'jquery';
import Backbone from 'backbone';

import serviceProvider from './utils/serviceProvider.js';

export default Backbone.Router.extend({

  // IMPORTANT: When you create a new route, make sure to add it server-side as well.
  // Note: these route names are assumed in other places (like navbar items). TODO take the time
  // to factor this out.
  routes: {
    '': 'homeRoute',
    'about': 'aboutRoute',
    'properties': 'propertiesRoute',
    'properties/:propertyslug': 'specificPropertyRoute',
    'map': 'mapRoute'
  },

  afterRoute() {
    console.log("after route");
    this.routerEvents.trigger('routed');
  },

  specificPropertyRoute(propertySlug) {
    console.log("specific property route");
    let individualPropertyViewInst = serviceProvider.getIndividualPropertyView(propertySlug);
    $('#js-app').empty().append(individualPropertyViewInst.$el);
    //$(window).trigger('resize'); // fixes slick slider being width 0. https://github.com/kenwheeler/slick/issues/235
    this.afterRoute();
  },

  initialize(options) {
    $('body').append('<div id="js-app"></div>');
    this.routerEvents = options.routerEvents;

    this.interceptInternalURLs();
  },

  // Make sure when a user click's a link to somewhere else in our page it doesn't
  // cause a new pageload.
  interceptInternalURLs() {
    var self = this;

    //TODO for peformance reasons, it would be better to not use event delegation on document.
    $(document).on('click', 'a.rwc-dont-pageload', function(evt) {
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

  aboutRoute() {
    let aboutViewInst = serviceProvider.getAboutView();
    aboutViewInst.render();
    $('#js-app').empty().append(aboutViewInst.$el);
    this.afterRoute();
  },

  homeRoute() {
    let homeViewInst = serviceProvider.getHomeView();
    homeViewInst.render();
    $('#js-app').empty().append(homeViewInst.$el);
    this.afterRoute();
  },

  mapRoute() {
    // As of right now, this route is only here for development purposes so that I
    // can test the map view

    let mv = serviceProvider.getMapView();
    mv.render();

    $('#js-app').empty().append(mv.$el);

  },
  propertiesRoute() {
    let pv = serviceProvider.getPropertiesView();
    pv.render();

    $('#js-app').empty().append(pv.$el);
    this.afterRoute();
  }
});
