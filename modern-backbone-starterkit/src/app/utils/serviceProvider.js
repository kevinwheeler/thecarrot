import Backbone from 'backbone';

import HomeView from '../views/homeView';
import NavView from '../views/navView';
import Router from '../router';
import UploadView from '../views/uploadView.js';

var serviceProvider = {
  _createRouterEvents() {
    let routerEvents = {};
    _.extend(routerEvents, Backbone.Events);
    return routerEvents;
  },

  _createNavView() {
    let navItems = [];
    return new NavView({routerEvents: this.routerEvents});
  },

  getAboutView() {
    let aboutViewInst = new AboutView({navView: this.getNavView()});
    return aboutViewInst;
  },

  getHomeView() {
    let homeViewInst = new HomeView({navView: this.getNavView()});
    return homeViewInst;
  },

  getNavView() {
    return this.navView;
  },

  getUploadView() {
    let uploadViewInst = new UploadView();
    return uploadViewInst;
  },

  initialize() {
    this.routerEvents = this._createRouterEvents();
    this.navView = this._createNavView();
  },

  // returns data in raw json form
  getRouter() {
    return new Router({'routerEvents': this.routerEvents});
  }
};

serviceProvider.initialize();
export default serviceProvider;
