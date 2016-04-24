import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';

import AboutHeroContentView from './aboutHeroContentView.js';
import HeroView from './heroView.js';
import template from './specificPropertyTemplate.hbs';


//export default Marionette.ItemView.extend({
export default Backbone.View.extend({
  attachSubViews: function() {
    let $nav = this.$('.rwc-specific-property-view-nav-stub');
    console.log("nav = ");
    console.dir($nav);
    $nav.replaceWith(this.options.navView.$el);

    let $slides = this.$('.rwc-specific-property-view-slider-slide-stub');
    $slides.replaceWith(this.options.slides);
  },

  initialize(options = {}) {
    this.options = options;
    this.views = [];

   //kmw: http://arturadib.com/hello-backbonejs/docs/1.html
   _.bindAll(this, 'render'); //comment came with code example: fixes loss of context for 'this' within methods

    this.initialRender();
  },

  initialRender() {
    console.log("in initial render");
    this.$el.html(this.template({}));
    this.attachSubViews();
    this.$('.rwc-specific-property-view-slider').slick({
      dots: false,
      arrows: true,
      infinite: true,
    });
    this.$('.rwc-specific-property-view-slider-slide').css('width', ''); //Undo slick slider's shennanigans
  },

  className: 'rwc-specific-property-view',

  template: template,

  render: function() {
    console.log("in render");
    _.forEach(this.views, function(view){
      view.render();
    });
    return this;
  }
});
