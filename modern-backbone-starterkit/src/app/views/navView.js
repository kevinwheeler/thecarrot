import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';
//import Marionette from 'backbone.marionette';

import template from './navTemplate.hbs';
import 'STYLESDIR/css/nav.css';
import 'STYLESDIR/stylus/nav.css';
import bootstrap from 'bootstrap';
import viewport from 'bootstrapToolkit';

//export default Marionette.ItemView.extend({
export default Backbone.View.extend({
  //Thesee first few properties are standard Backbone properties. Look them up in Backbone's documentation.
  className: 'kmw-nav navbar',

  initialize: function(options = {}) {
    this.options = options;
    this.views = [];
    _.bindAll(this, 'collapse', 'render');//kmw: http://arturadib.com/hello-backbonejs/docs/1.html
    //TODO add nav item views to views array

    console.log("options = ");
    console.dir(options);
    //this.listenTo(options.routerEvents, 'routed', this.collapse);
    //this.updateHeightWhenBreakpointReached();
    this.initialRender();
    this.updateWhenBreakpointReached();
    this.toggleStickyOnScroll();
    this.setActiveElement();

    let self = this;
    //setInterval(function(){self.disableSticky()},750);

    _.bindAll(this, 'collapse', 'render');//kmw: http://arturadib.com/hello-backbonejs/docs/1.html
  },

  tagName: 'nav',

  template: template,

  render: function() {
    //TODO render sub views
    return this;
  },

  // All of the following properties are not standard backbone properties.
  collapse: function() {
    this.$('#rwc-nav-collapse').collapse('hide');
  },

  disableSticky: function() {
    this.$('.kmw-navbar-header').removeClass('kmw-navbar-header-sticky');
    this.$('.kmw-navbar').removeClass('kmw-navbar-sticky');
    this.$('.kmw-nav-hr').removeClass('kmw-nav-hr-sticky');
  },

  enableSticky: function() {
    this.$('.kmw-navbar-header').addClass('kmw-navbar-header-sticky');
    this.$('.kmw-navbar').addClass('kmw-navbar-sticky');
    this.$('.kmw-nav-hr').addClass('kmw-nav-hr-sticky');
  },

  initialRender: function() {
    this.$el.html(this.template());
    let $navItemsStub = this.$('.nav-items-stub');
    let navItemElements = [];
    _.forEach(this.options.navItems, function(nItem){
      navItemElements.push(nItem.$el);
    });
    $navItemsStub.replaceWith(navItemElements);
    if (this.isMobile()) {
      this.$el.addClass('kmw-nav-mobile');
    }
    //this.renderAllSubViews();
    //this.attachSubViews();
  },

  isMobile: function() {
    return viewport.is('xs');
  },

  setActiveElement: function() {
    // url without the host info. EX: if we are at 'example.com/route'
    // routeUrl will hold '/route'
    let routeUrl = window.location.href.toString().split(window.location.host)[1];
    let $navAnchors = this.$('li a');
    $navAnchors.each(function() {
      if (this.getAttribute('href') === routeUrl) {
        this.parentNode.className += ' active';
      }
    });
  },

  updateWhenBreakpointReached: function() {
    let self = this;
    $(window).resize(_.throttle(function() {
        if (self.isMobile()) {
          self.$el.addClass('kmw-nav-mobile');
        } else {
          self.$el.removeClass('kmw-nav-mobile');
        }
      }, 100)
    );
  },

  // http://stackoverflow.com/questions/18546067/why-is-the-window-width-smaller-than-the-viewport-width-set-in-media-queries
  // Used to compare against breakpoint width. Handles complexities of the width of scrollbar.
  viewport: function() {
    let e = window, a = 'inner';
    if (!('innerWidth' in window)) {
      a = 'client';
      e = document.documentElement || document.body;
    }
    return {width: e[ a + 'Width' ] , height: e[ a + 'Height' ]};
  },

  toggleStickyOnScroll: function() {
    let self = this;

    let runOnScroll = function() {
      let currentScrollAmount = $(document).scrollTop();
      let NUM_PIXELS_THRESHOLD = 200;

      if (currentScrollAmount > NUM_PIXELS_THRESHOLD) {
        self.enableSticky();
      } else {
        self.disableSticky();
      }
    };

    window.addEventListener("scroll", runOnScroll);
  }
});
