import Backbone from 'backbone';

import UserView from 'VIEWSDIR/userView';
import AllArticlesCollection from 'COLLECTIONSDIR/allArticlesCollection';
import ArticleGridView from 'VIEWSDIR/articleGridView';
import ArticleView from 'VIEWSDIR/articleView';
import CurrentUserModel from 'MODELSDIR/currentUserModel';
import HomeView from 'VIEWSDIR/homeView';
import LoginView from 'VIEWSDIR/loginView';
import MostRecentPopularToggleView from 'VIEWSDIR/mostRecentPopularToggleView';
import NavView from 'VIEWSDIR/navView';
import Router from '../router';
import UploadModel from 'MODELSDIR/uploadModel';
import UploadView from 'VIEWSDIR/uploadView';
import UserModel from 'MODELSDIR/UserModel';

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
    const currentUser = new CurrentUserModel();
    currentUser.fetchCurrentUser();
    this.navView = new NavView({
      currentUser: currentUser,
      routerEvents: this.routerEvents
    });
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
    const articleGridViewInst = new ArticleGridView();

    const mostRecentPopularToggleViewInst = new MostRecentPopularToggleView({
      articleGridView: articleGridViewInst
    });

    const homeViewInst = new HomeView({
      articleGridView: articleGridViewInst,
      mostRecentPopularToggleView: mostRecentPopularToggleViewInst,
      navView: this.getNavView()
    });

    return homeViewInst;
  },

  getLoginView() {
    let loginViewInst = new LoginView();
    return loginViewInst;
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

  getUserView(userId) {
    const userModel = new UserModel({userId: userId});
    userModel.fetchUser();
    let userViewInst = new UserView({userModel: userModel});
    return userViewInst;
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
