import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';

import serviceProvider from 'UTILSDIR/serviceProvider';
import template from 'TEMPLATESDIR/flagsTemplate.hbs';
import 'STYLESDIR/stylus/flags.css';
//import 'UTILSDIR/facebooksdk';

export default Backbone.View.extend({
  className: 'kmw-article-view',

  events: {
  },

  initialize: function(options = {}) {
    this.navView = options.navView;
    this.articleModel = options.articleModel;
    this.currentUserModel = options.currentUserModel;
    this.flagsCollection = options.flagsCollection;
    this.listenTo(this.flagsCollection, 'change add', this.render);
    this.listenTo(this.articleModel, 'change', this.render);
    this.listenTo(this.currentUserModel, 'change', this.render);
    this.listenTo(this.voteModel, 'change', this.render);

    this.render();
  },

  //TODO diff dom or something?
  render: _.throttle(function() {
      const approvalStatus = this.articleModel.get('approval');
      const approved = this.articleModel.get('approval') === 'approved';
      const currentUserDoneFetching = this.currentUserModel.get('doneFetching') === true;
      const userIsAdmin = currentUserDoneFetching && this.currentUserModel.get('userType') === 'admin';
      const userIsntAdmin = currentUserDoneFetching && this.currentUserModel.get('userType') !== 'admin';
      const approvedOrAdmin = approved || userIsAdmin;

      this.$el.children().detach();
      this.$el.html(template({
        approvalStatus: approvalStatus,
        approvedOrAdmin: approvedOrAdmin,
        article: this.articleModel.toJSON(),
        flags: this.flagsCollection.toJSON(),
        userIsAdmin: userIsAdmin,
        userIsntAdmin: userIsntAdmin,
      }));
      this.attachSubViews();
      return this;
    }, 16
  ),

  attachSubViews: function() {
    let $nav = this.$('.NAV-STUB');
    $nav.replaceWith(this.navView.$el);
  },
});
