import Backbone from 'backbone';

import AllArticlesCollection from 'COLLECTIONSDIR/allArticlesCollection';
import ArticleGridView from 'VIEWSDIR/articleGridView';
import ArticleView from 'VIEWSDIR/articleView';
import HomeView from 'VIEWSDIR/homeView';
import MostRecentArticlesCollection from 'COLLECTIONSDIR/mostRecentArticlesCollection';
import NavView from 'VIEWSDIR/navView';
import Router from '../router';
import UploadModel from 'MODELSDIR/uploadModel';
import UploadView from 'VIEWSDIR/uploadView';

var serviceProvider = {
  _createRouter(routerEvents) {
    this.router = new Router({'routerEvents': routerEvents});
  },

  _createRouterEvents() {
    let routerEvents = {};
    _.extend(routerEvents, Backbone.Events);
    this.routerEvents = routerEvents;
  },

  _createNavView() {
    this.navView = new NavView({routerEvents: this.routerEvents});
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
    let mostRecentArticlesCollectionInst = new MostRecentArticlesCollection();
    mostRecentArticlesCollectionInst.fetch({'articleRoutePrefix': this.getRouter().exports.articleRoutePrefix});

    let articleGridViewInst = new ArticleGridView({
      articleCollection: mostRecentArticlesCollectionInst
    });

    let homeViewInst = new HomeView({
      navView: this.getNavView(),
      articleGridView: articleGridViewInst
    });

    return homeViewInst;
  },

  getNavView() {
    return this.navView;
  },

  getUploadView() {
    let uploadViewInst = new UploadView({
      model: this.getUploadModel(),
      navView: this.getNavView()
    });
    return uploadViewInst;
  },

  getUploadModel() {
    let uploadModelInst = new UploadModel();
    return uploadModelInst;
  },

  initialize() {
    this._createRouterEvents();
    this._createRouter(this.routerEvents);
    this._createNavView();
  },

  getRouter() {
    return this.router;
  }
};

serviceProvider.initialize();
export default serviceProvider;
