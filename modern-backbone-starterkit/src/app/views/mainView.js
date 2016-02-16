import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';
//import Marionette from 'backbone.marionette';

import template from './template.hbs';
import HeroView from './heroView.js';

//export default Marionette.ItemView.extend({
export default Backbone.View.extend({

  id: "content",
  initialize: function(options = {}) {
    this.options = options;
    this.views = [];
    let $heroViewEl = $('<div class="rwcHeroView"/>');
    this.$el.append($heroViewEl);
    let hv = new HeroView({el: $heroViewEl});
    this.views.push(hv);
   //kmw: http://arturadib.com/hello-backbonejs/docs/1.html
   _.bindAll(this, 'render'); //comment came with code example: fixes loss of context for 'this' within methods
    this.render();
  },

  template: template,
  render: function() {
    _.forEach(this.views, function(view){
      view.render();
    });
    return this;
  }


});
