import Backbone from 'backbone';
import serviceProvider from 'UTILSDIR/serviceProvider';

export default Backbone.Model.extend({
  defaults: {
    doneFetching: false
  },

  fetchUser: function() {
    this.fetch({
      data: {
        'user_id': this.userId
      }
    });
  },

  initialize: function(options) {
    this.userId = options.userId;
  },

  parse: function(response, options) {
    response.doneFetching = true;
    return response;
  },

  url: '/userinfo',
});
