import $ from 'jquery';
import Backbone from 'backbone';

import HomeView from './views/homeView';
import AboutView from './views/aboutView';


export default Backbone.Router.extend({

  routes: {
    '': 'home',
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

  about() {
    let aboutViewInst = new AboutView({
      el: $('<div class="rwc-about-view"/>')
    }).render();

    $('#js-app').empty().append(aboutViewInst.$el);
  },

  home() {
    let homeViewInst = new HomeView({
      el: $('<div class="rwc-home-view"/>')
    }).render();
    $('#js-app').empty().append(homeViewInst.$el);
  }
});
