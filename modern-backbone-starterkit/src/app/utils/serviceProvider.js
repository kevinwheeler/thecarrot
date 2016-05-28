import Backbone from 'backbone';

import ArticleModel from '../router';
import HomeView from '../views/homeView.js';
import NavView from '../views/navView.js';
import Router from '../router';

var serviceProvider = {
  //TODO clean up create vs get methods so there is a consistent pattern.
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
