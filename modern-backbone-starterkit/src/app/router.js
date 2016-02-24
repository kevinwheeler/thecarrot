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

    var self = this;

    $(document).on('click', 'a.rwc-dont-pageload', function (evt) {
      let href = $(this).attr('href');
      let isRootRelativeUrl = (href.charAt(0) === '/') && (href.charAt(1) !== '/')
      if (isRootRelativeUrl) {
        let urlWithoutLeadingSlash = href.slice(1, href.length);
        evt.preventDefault();
        self.navigate(urlWithoutLeadingSlash, true);
      }
      else {
        throw "'dont-pageload' links that aren't root relative aren't implemented right now.";
      }
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
