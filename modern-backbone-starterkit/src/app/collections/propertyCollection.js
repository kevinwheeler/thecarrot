import Backbone from 'backbone';
import PropertyModel from '../models/propertyModel';

export default Backbone.Collect.extend({
  model: PropertyModel
});
