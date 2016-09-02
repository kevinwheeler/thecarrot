import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';
//import Marionette from 'backbone.marionette';

import $script from 'scriptjs';
import Spinner from 'UTILSDIR/spin';
import template from 'TEMPLATESDIR/loginTemplate.hbs';

//export default Marionette.ItemView.extend({
export default Backbone.View.extend({
  // The first few attributes are all standard backbone attributes that can be
  // found in the backbone documentation.
  className: 'kmw-login-view',

  events: {
  },

  initialize: function(options = {}) {
    this.$el.html(template());
  },

  // Attributes below aren't standard backbone attributes. They are custom.
});
