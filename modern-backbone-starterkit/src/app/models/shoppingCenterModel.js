import Backbone from 'backbone';

import PropertyModel from './articleModel.js';

export default PropertyModel.extend({
  initialize() {
    PropertyModel.prototype.initialize.apply(this, arguments);
  },
});
