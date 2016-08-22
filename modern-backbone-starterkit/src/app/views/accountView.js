import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';
//import Marionette from 'backbone.marionette';

import $script from 'scriptjs';
import Spinner from 'UTILSDIR/spin';
import template from 'TEMPLATESDIR/accountTemplate.hbs';

//export default Marionette.ItemView.extend({
export default Backbone.View.extend({
  // The first few attributes are all standard backbone attributes that can be
  // found in the backbone documentation.
  className: 'kmw-login-view',

  events: {
  },

  initialize: function(options = {}) {
    // http://arturadib.com/hello-backbonejs/docs/1.html
    _.bindAll(this, 'render');
    this.views = [];
    this.isLoggedIn = window.kmw.user !== undefined;
    if (this.isLoggedIn) {
      this.displayName =  window.kmw.user.displayName;
    }
    this.render();
  },

  render: function () {
    this.$el.html(template({
      displayName: this.displayName,
      isLoggedIn: this.isLoggedIn
    }));
    //_.forEach(this.views, function(view) {
    //  view.render();
    //});
    return this;
  },
  // Attributes below aren't standard backbone attributes. They are custom.
});
