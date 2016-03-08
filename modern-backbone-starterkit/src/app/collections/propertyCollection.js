import Backbone from 'backbone';
import PropertyModel from '../models/propertyModel';

export default Backbone.Collection.extend({
  model: PropertyModel
});
