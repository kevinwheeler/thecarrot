import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';
//import Marionette from 'backbone.marionette';

import template from 'TEMPLATESDIR/aboutTemplate.hbs';
import {parseFbElement} from 'UTILSDIR/facebooksdk';

//export default Marionette.ItemView.extend({
export default Backbone.View.extend({
  initialize: function(options = {}) {
    this.navView = options.navView;
    this.$el.html(template({
      citationURL: "http://www.chicagotribune.com/bluesky/technology/ct-share-this-link-without-reading-it-ap-bsi-20160618-story.html",
    }));
    this.attachSubViews();
    parseFbElement(this.el);
  },

  className: 'kmw-about-view',

  attachSubViews: function() {
    let $nav = this.$('.NAV-STUB');
    $nav.replaceWith(this.navView.$el);
  },

});
