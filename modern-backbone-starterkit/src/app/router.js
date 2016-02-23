import $ from 'jquery';
import Backbone from 'backbone';

import HomeView from './views/homeView';


export default Backbone.Router.extend({

  routes: {
    '': 'dashboard',
    'about': 'about'
  },

  initialize() {
    $('body').append('<div id="js-app"></div>');
    // inspired by http://stackoverflow.com/questions/9328513/backbone-js-and-pushstate
    let self = this;
    $(document).on('click', 'a:not([data-bypass])', function (evt) {
      let href = $(this).attr('href');
      evt.preventDefault();
      self.navigate(href, true);
    });
  },

  dashboard() {
    let homeViewInst = new HomeView({
        el: $('<div class="rwc-home-view"/>')
    }).render();
    $('#js-app').empty().append(homeViewInst.$el);
  },

  about() {
    let aboutViewInst = new HomeView({
      el: $('<div class="rwcMainView"/>')
    }).render();

    $('#js-app').empty().append(aboutViewInst.$el);
  }
});
