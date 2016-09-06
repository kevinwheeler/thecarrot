import $ from 'jquery';
import Backbone from 'backbone';

import template from 'TEMPLATESDIR/flagArticleModalTemplate.hbs';
import {grecaptchaLoaded, renderElementOnLoad} from 'UTILSDIR/recaptcha'

import 'remodal';
import 'remodalCSS';
import 'remodalTheme';

//export default Marionette.ItemView.extend({
export default Backbone.View.extend({
  className: 'kmw-flag-article-modal-view',

  initialize: function(options = {}) {
    this.$el.html(template());
    //TODO do we need to remove this to avoid memory leak?

    const recaptchaEl = this.$('.kmw-recaptcha').get(0);
    console.log(recaptchaEl);
    if (grecaptchaLoaded) {
      window.grecaptcha.render(recaptchaEl, {
        'sitekey': '6LeFjiETAAAAAMLWg5ccuWZCgavMCitFq-C4RpYh'//TODO move this to an environment variable.
      });
    } else {
      renderElementOnLoad(recaptchaEl);
    }
    this.remodalInst = this.$('[data-remodal-id=flag-article-modal]').remodal();
  },

  open: function() {
    this.remodalInst.open();
  }
});
