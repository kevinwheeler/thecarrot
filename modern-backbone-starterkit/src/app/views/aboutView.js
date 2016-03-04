import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';
//import Marionette from 'backbone.marionette';

import HeroView from './heroView.js';
import AboutHeroContentView from './aboutHeroContentView.js';

//export default Marionette.ItemView.extend({
export default Backbone.View.extend({
  initialize: function(options = {}) {
    this.options = options;
    this.views = [];

    // The content we are filling the hero with.
    let ahcv = new AboutHeroContentView();
    this.views.push(ahcv);

    let hv = new HeroView({
      "contentView": ahcv,
    });
    this.$el.append(hv.$el);
    this.views.push(hv);

   //kmw: http://arturadib.com/hello-backbonejs/docs/1.html
   _.bindAll(this, 'render'); //comment came with code example: fixes loss of context for 'this' within methods
    this.render();
  },

  className: 'rwc-about-view',

  render: function() {
    _.forEach(this.views, function(view){
      view.render();
    });
    return this;
  }
});
