import Backbone from 'backbone';

import ArticleView from 'VIEWSDIR/articleView';
import HomeView from 'VIEWSDIR/homeView';
import NavView from 'VIEWSDIR/navView';
import Router from '../router';
import UploadModel from 'MODELSDIR/uploadModel';
import UploadView from 'VIEWSDIR/uploadView';

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

  getArticleView() {
    let articleViewInst = new ArticleView({navView: this.getNavView()});
    return articleViewInst;
  },

  getHomeView() {
    let homeViewInst = new HomeView({navView: this.getNavView()});
    return homeViewInst;
  },

  getNavView() {
    return this.navView;
  },

  getUploadView() {
    let uploadViewInst = new UploadView({
      model: this.getUploadModel()
    });
    return uploadViewInst;
  },

  getUploadModel() {
    let uploadModelInst = new UploadModel();
    return uploadModelInst;
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
