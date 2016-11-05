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
    //"click .picture-arrow-left": "displayPreviousImages",
  },

  initialize: function(options) {
    this.currentUserModel = options.currentUserModel;
    //this.listenTo(this.imageCollection, 'sync', this.render);
    this.render();
  },

  render: _.throttle(function () {
      this.$el.html(template({
        loggedIn: this.currentUserModel.get('loggedIn'),
      }));

      return this;
    }, 16
  ),
});
