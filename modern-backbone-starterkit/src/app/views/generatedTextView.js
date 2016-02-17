import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';
//import Marionette from 'backbone.marionette';

import template from './generatedTextTemplate.hbs';

//export default Marionette.ItemView.extend({
export default Backbone.View.extend({

  initialize: function(options = {}) {
    this.options = options;
    this.views = [];
    //kmw: http://arturadib.com/hello-backbonejs/docs/1.html
    _.bindAll(this, 'render'); //comment came with code example: fixes loss of context for 'this' within methods

    this.textGeneratorModelInst = options.textGeneratorModelInst;
    this.listenTo(this.textGeneratorModelInst, 'change:generatedText', this.render);
    this.render();
  },

  template: template,

  render: function() {
    this.$el.html(this.template({}));
    let $textArea = this.$el.find('.rwc-generated-text-text-area');
    $textArea.val(this.textGeneratorModelInst.get('generatedText'));
    return this;
  }

});
