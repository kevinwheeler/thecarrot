import Backbone from 'backbone';
import _ from 'lodash';
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
    if (_.isEmpty(response)) {
      response.loggedIn = false;
    } else {
      response.loggedIn = true;
    }
    response.doneFetching = true;
    return response;
  },
});
