import $ from 'jquery';
import Backbone from 'backbone';

import MainView from './views/mainView';


export default Backbone.Router.extend({

  routes: {
    '': 'dashboard',
    'about': 'about'
  },

  initialize() {
    $('body').append('<div id="js-app"></div>');
  },

  dashboard() {
    var mainViewInst = new MainView({
        el: $('<div class=".rwcHellowView"/>')
    }).render();
    $('#js-app').empty().append(mainViewInst.$el);
  },

  about() {
    var mainViewInst = new MainView({
      template: _.template('Im the about page')
    }).render();

    $('#js-app').empty().append(mainViewInst.$el);
  }

});
