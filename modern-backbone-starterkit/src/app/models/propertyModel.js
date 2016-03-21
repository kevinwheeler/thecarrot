import Backbone from 'backbone';

export default Backbone.Model.extend({
  defaults: {
    // Commented out because I don't actually want a default value, but I left
    // the fields here to show what properties are expected. We could change this
    // to a validation check during initialization later instead.
    //'address':  '',
    //latitude: '',
    //longitude: ''
  },
  getURL() {
    return this.URL;
  }
});
