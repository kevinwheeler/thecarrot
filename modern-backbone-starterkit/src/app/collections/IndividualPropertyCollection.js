import Backbone from 'backbone';
import IndividualPropertyModel from '../models/individualPropertyModel';

export default Backbone.Collection.extend({
  model: IndividualPropertyModel
});
