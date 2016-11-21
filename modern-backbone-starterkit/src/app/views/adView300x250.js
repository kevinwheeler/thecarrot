import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';
//import Marionette from 'backbone.marionette';

import template from 'TEMPLATESDIR/chitika300x250ad.hbs';
import 'STYLESDIR/stylus/kmwAd.css';

window.kmw.chitikaCounter = 0;

//export default Marionette.ItemView.extend({
export default Backbone.View.extend({
  initialize: function(options = {}) {
    this.$el.html(template({
      counter: window.kmw.chitikaCounter
    }));
    window.kmw.chitikaCounter++;
  },

  className: 'kmw-chitika-view',
});
