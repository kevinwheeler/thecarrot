import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';
//import Marionette from 'backbone.marionette';

import template from 'TEMPLATESDIR/pictureSelectTemplate.hbs';
import 'image-picker/image-picker/image-picker.min.js';
import 'image-picker/image-picker/image-picker.css';
import 'STYLESDIR/stylus/pictureSelect.css';

const NUM_IMAGES_PER_PAGE = 10;

//export default Marionette.ItemView.extend({
export default Backbone.View.extend({
  // The first few attributes are all standard backbone attributes that can be
  // found in the backbone documentation.
  className: 'kmw-picture-select-view',

  events: {
    "click .picture-arrow-left": "displayPreviousImages",
    "click .picture-arrow-right": "displayNextImages",
    "change #kmw-image-id": 'imageIdChanged', // we also have event handling for this event in the uploadView.
  },

  initialize: function(options) {
    this.indexOfFirst = 0;
    this.featuredImagesCollection = options.featuredImagesCollection;
    this.listenTo(this.featuredImagesCollection, 'sync', this.render);
    this.render();
  },

  render: _.throttle(function () {
      const images = this.featuredImagesCollection.toJSON();
      const upperBound = Math.min(this.indexOfFirst + NUM_IMAGES_PER_PAGE, images.length);
      const imagesSubset = images.slice(this.indexOfFirst, upperBound);
      const previousResultsExist = this.indexOfFirst !== 0;
      const nextResultsExist = this.indexOfFirst + NUM_IMAGES_PER_PAGE < images.length;
      for (let i = 0; i < imagesSubset.length; i++) {
        const image = imagesSubset[i];
        if (image._id === this.selectedImageId) {
          image.selected = true;
        } else {
          image.selected = false;
        }
      }
      if (this.imagePicker !== undefined) {
        this.imagePicker.destroy();
      }
      this.$el.html(template({
        doneFetching: this.featuredImagesCollection.doneFetching,
        images: imagesSubset,
        leftArrowDisabled: !previousResultsExist,
        numberOfFirstResult: this.indexOfFirst + 1,
        numberOfLastResult: upperBound,
        rightArrowDisabled: !nextResultsExist,
        resultsExist: images.length !== 0,
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

  displayNextImages: function() {
    if (this.indexOfFirst + NUM_IMAGES_PER_PAGE >= this.featuredImagesCollection.length) {
      return;
    } else {
      this.indexOfFirst = this.indexOfFirst + NUM_IMAGES_PER_PAGE;
    }
    this.render();
  },

  displayPreviousImages: function() {
    this.indexOfFirst = Math.max(this.indexOfFirst - NUM_IMAGES_PER_PAGE, 0);
    this.render();
  },

  imageIdChanged: function() {
    this.selectedImageId = parseInt(this.$("#kmw-image-id").val(), 10);
  }
});
