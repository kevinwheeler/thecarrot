import $ from 'jquery';
import Backbone from 'backbone';

import AboutHeroContentView from './views/aboutHeroContentView.js';
import AboutView from './views/aboutView';
import HeroView from './views/heroView.js';
import HomeView from './views/homeView';
import HomeHeroContentView from './views/homeHeroContentView.js';

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
    // The content we are filling the hero with.
    let ahcv = new AboutHeroContentView();
    let hv = new HeroView({
      'contentView': ahcv,
    });

    let aboutViewInst = new AboutView({
      'heroView': hv
    }).render();
    $('#js-app').empty().append(aboutViewInst.$el);
  },

  home() {
    // The content we are filling the hero with.
    let hhcv = new HomeHeroContentView();

    let hv = new HeroView({
      'contentView': hhcv,
    });
    let homeViewInst = new HomeView({
      'heroView': hv
    }).render();
    $('#js-app').empty().append(homeViewInst.$el);
  }
});
