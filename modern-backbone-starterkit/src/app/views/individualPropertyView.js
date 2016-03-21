import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';

import AboutHeroContentView from './aboutHeroContentView.js';
import HeroView from './heroView.js';
import template from './individualPropertyTemplate.hbs';


//export default Marionette.ItemView.extend({
export default Backbone.View.extend({
  attachSubViews: function() {
    let $nav = this.$('.rwc-individual-property-view-nav-stub');
    $nav.replaceWith(this.options.navView.$el);
  },

  initialize(options = {}) {
    this.options = options;
    this.views = [];

   //kmw: http://arturadib.com/hello-backbonejs/docs/1.html
   _.bindAll(this, 'render'); //comment came with code example: fixes loss of context for 'this' within methods

    this.initialRender();
  },

  initialRender() {
    this.$el.html(this.template({}));
    this.attachSubViews();
    this.$('.rwc-individual-property-view-slider').slick({
      dots: true,
      arrows: false,
      infinite: true,
      slidesToShow: 2,
      slidesToScroll: 2
    });

  },

  className: 'rwc-individual-property-view',

  template: template,

  render: function() {
    _.forEach(this.views, function(view){
      view.render();
    });
    return this;
  }
});
