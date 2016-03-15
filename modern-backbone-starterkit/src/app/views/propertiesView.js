import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';

import template from './propertiesTemplate.hbs';

export default Backbone.View.extend({

  initialize: function(options = {}) {
    this.options = options;
    this.views = [];

    //kmw: http://arturadib.com/hello-backbonejs/docs/1.html
    _.bindAll(this, 'render'); //comment came with code example: fixes loss of context for 'this' within methods
    this.render();
  },

  className: 'rwc-properties-view',

  render: function() {
    _.forEach(this.views, function(view) {
      view.render();
    });
    this.$el.html(this.template({
      prop: JSON.stringify(this.options.propertiesColl.toJSON()),
      shop: JSON.stringify(this.options.shoppingCentersColl.toJSON())
    }));
    return this;
  },

  template: template
});
