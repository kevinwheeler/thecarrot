import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';

import template from 'TEMPLATESDIR/postAnonymouslyTemplate.hbs';
//import 'STYLESDIR/stylus/pictureSelect.css';

//export default Marionette.ItemView.extend({
export default Backbone.View.extend({
  // The first few attributes are all standard backbone attributes that can be
  // found in the backbone documentation.
  className: 'kmw-post-anonymously-view',

  events: {
    "click .post-anonymously-login": "onLoginClicked",
  },

  initialize: function(options) {
    const self = this;
    this.currentUserModel = options.currentUserModel;
    this.render();

    $(window).on('focus', function() {
      self.currentUserModel.fetchCurrentUser();
    });

    this.listenTo(this.currentUserModel, 'change', this.render);
  },

  render: _.throttle(function () {
      this.$el.html(template({
        loggedIn: this.currentUserModel.get('loggedIn'),
      }));

      return this;
    }, 16
  ),

  onLoginClicked: function() {
    window.open("/upload-login", "uploadLoginWindow");
  }
});
