import $ from 'jquery';
import Backbone from 'backbone';

import template from 'TEMPLATESDIR/flagArticleModalTemplate.hbs';

import "remodal";
import "remodalCSS";
import "remodalTheme";

//export default Marionette.ItemView.extend({
export default Backbone.View.extend({
  className: 'kmw-flag-article-modal-view',

  initialize: function(options = {}) {
    this.$el.html(template());
    //TODO do we need to remove this to avoid memory leak?
    this.remodalInst = this.$('[data-remodal-id=flag-article-modal]').remodal();
  },

  open: function() {
    this.remodalInst.open();
  }
});
