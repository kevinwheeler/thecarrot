import Backbone from 'backbone';
import PropertyModel from '../models/individualPropertyModel';

export default Backbone.Collection.extend({
  model: PropertyModel
});
