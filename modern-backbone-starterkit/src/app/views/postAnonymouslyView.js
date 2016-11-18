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
    "change #post-anon-checkbox": "onCheckboxChanged",
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
      const templateParameters = {
        creditSrc: window.kmw.imageBaseUrl + 'static/article-credit.jpg',
        loggedIn: this.currentUserModel.get('loggedIn'),
      }
      if (this.currentUserModel.get('loggedIn')) {
        templateParameters.userPages = this.currentUserModel.toJSON().pages;
      } else {
        templateParameters.userPages = [];
      }
      this.$el.html(template(templateParameters));

      return this;
    }, 16
  ),

  onCheckboxChanged: function() {
    const $container = $('.post-anon-author-container');
    const isChecked = this.$('#post-anon-checkbox').is(':checked');
    if (isChecked) {
      $container.hide();
    } else {
      $container.show();
    }
  },

  onLoginClicked: function() {
    window.open("/upload-login", "uploadLoginWindow");
  }
});
