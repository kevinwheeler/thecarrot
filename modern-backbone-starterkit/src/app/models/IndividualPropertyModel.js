/*
    This file (individualPropertyModel.js) represents a property that is not a shopping center. IE
    it is an individual property.
 */
import Backbone from 'backbone';

import PropertyModel from './propertyModel.js';

export default PropertyModel.extend({
  initialize() {
    PropertyModel.prototype.initialize.apply(this, arguments);
    console.log("initializing individual property");
  }
});
