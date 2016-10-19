import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';
//import Marionette from 'backbone.marionette';

import template from 'TEMPLATESDIR/pictureSelectTemplate.hbs';
import 'image-picker/image-picker/image-picker.min.js';
import 'image-picker/image-picker/image-picker.css';
import 'STYLESDIR/stylus/pictureSelect.css';

//export default Marionette.ItemView.extend({
export default Backbone.View.extend({
  // The first few attributes are all standard backbone attributes that can be
  // found in the backbone documentation.
  className: 'kmw-picture-select-view',

  events: {
  },

  initialize: function(options) {
    this.indexOfFirst = 0;
    this.featuredImagesCollection = options.featuredImagesCollection;
    this.listenTo(this.featuredImagesCollection, 'sync', this.render);
    this.render();
  },

  render: _.throttle(function () {
      const images = this.featuredImagesCollection.toJSON();
      const imagesSubset = images.slice(0, 10);
      let selectedImage;
      if (this.imagePicker !== undefined) {
        this.imagePicker.destroy();
      }
      this.$el.html(template({
        images: imagesSubset
      }));
      const $imagePicker = this.$(".kmw-image-picker");
      $imagePicker.imagepicker({

      });
      this.imagePicker = $imagePicker.data("picker");
      const $ul = $imagePicker.next();
      const $LIs = $imagePicker.next().find("li");
      $ul.addClass("kmw-row")
      $ul.addClass("row")
      $LIs.addClass("col-sm-12");
      $LIs.addClass("col-md-6");
      $LIs.addClass("col-lg-4");
      $LIs.addClass("kmw-picture-li");
      return this;
    }, 16
  ),
});
