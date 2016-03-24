import Backbone from 'backbone';

import PropertyModel from './propertyModel.js';

export default PropertyModel.extend({
  initialize() {
    PropertyModel.prototype.initialize.apply(this, arguments);
  },
});
