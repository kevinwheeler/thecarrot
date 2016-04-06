import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';

import AboutHeroContentView from './aboutHeroContentView.js';
import HeroView from './heroView.js';
import template from './specificPropertyTemplate.hbs';


//export default Marionette.ItemView.extend({
export default Backbone.View.extend({

  initialize(options = {}) {
    this.options = options;
    this.views = [];

   //kmw: http://arturadib.com/hello-backbonejs/docs/1.html
   _.bindAll(this, 'render'); //comment came with code example: fixes loss of context for 'this' within methods

    this.initialRender();
  },

  initialRender() {
    this.$el.html(this.template({}));
    this.$el.slick({
      dots: true,
      arrows: false,
      infinite: true,
    });
  },

  className: 'rwc-individual-property-slider-view',

  template: template,

  render: function() {
    _.forEach(this.views, function(view){
      view.render();
    });
    return this;
  }
});
