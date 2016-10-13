// consider this an abstract class. AKA don't initialize instances of this class.
// initialize instances of the subclasses instead.
import Backbone from 'backbone';
import serviceProvider from 'UTILSDIR/serviceProvider';

export default Backbone.Model.extend({
  defaults: {
    doneFetching: false
  },

  //url: '/userinfo',
  //
  //fetchCurrentUser: function() {
  //  this.fetch({
  //    data: {
  //      'user_id': 'currentUser'
  //    }
  //  });
  //},

  parse: function(response, options) {
    if (Object.keys(response).length) {
      response.loggedIn = true;
    } else {
      response.loggedIn = false;
    }
    response.doneFetching = true;
    return response;
  },
});
