import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';
//import Marionette from 'backbone.marionette';

import template from './template.hbs';

//export default Marionette.ItemView.extend({
export default Backbone.View.extend({

  id: "content",
  initialize: function(options = {}) {
    this.options = options;
   //kmw: http://arturadib.com/hello-backbonejs/docs/1.html
   _.bindAll(this, 'render'); //comment came with code example: fixes loss of context for 'this' within methods
    
    this.render(); //comment came with code example: not all views are self-rendering. This one is.
  },
  template: template,
  render: function() {
    //this.$el.html(this.template(this.model.attributes));
    this.$el.html(this.template({name: "dummy"}));
    return this;
  }


})
