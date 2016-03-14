import Backbone from 'backbone';
import ShoppingCenterModel from '../models/shoppingCenterModel';

export default Backbone.Collection.extend({
  model: ShoppingCenterModel
});
