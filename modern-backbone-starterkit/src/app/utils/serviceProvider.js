import Backbone from 'backbone';

import AdminView from 'VIEWSDIR/adminView';
import ApprovalHistoryArticleGridView from 'VIEWSDIR/approvalHistoryArticleGridView';
import ArticleGridView from 'VIEWSDIR/articleGridView';
import ArticleView from 'VIEWSDIR/articleView';
import ArticleColumnsView from 'VIEWSDIR/articleColumnsView';
import ArticleModel from 'MODELSDIR/articleModel';
import ArticlesThatNeedApprovalCollection from 'COLLECTIONSDIR/articlesThatNeedApprovalCollection';
import CurrentUserModel from 'MODELSDIR/currentUserModel';
import FlagArticleModalView from 'VIEWSDIR/flagArticleModalView';
import FlaggedArticlesCollection from 'COLLECTIONSDIR/flaggedArticlesCollection';
import HomeView from 'VIEWSDIR/homeView';
import LoginView from 'VIEWSDIR/loginView';
import MostRecentPopularToggleView from 'VIEWSDIR/mostRecentPopularToggleView';
import MyApprovalHistoryCollection from 'COLLECTIONSDIR/myApprovalHistoryCollection';
import MyAuthoredArticlesCollection from 'COLLECTIONSDIR/myAuthoredArticlesCollection';
import NavView from 'VIEWSDIR/navView';
import NeedApprovalArticleGridView from 'VIEWSDIR/needApprovalArticleGridView';
import Router from '../router';
import UploadModel from 'MODELSDIR/uploadModel';
import UploadView from 'VIEWSDIR/uploadView';
import UserModel from 'MODELSDIR/UserModel';
import UserView from 'VIEWSDIR/userView';

var serviceProvider = {
  _createRouter() {
    this.router = new Router();
  },

  _createNavView() {
    const currentUser = new CurrentUserModel();
    currentUser.fetchCurrentUser();
    this.navView = new NavView({
      currentUser: currentUser,
    });
  },

  //getAboutView() {
  //  let aboutViewInst = new AboutView({navView: this.getNavView()});
  //  return aboutViewInst;
  //},

  getAdminView(subroute) {

    let articlesCollection;
    let articleGridView;
    if (subroute === "approvalHistory") {
      articlesCollection = new MyApprovalHistoryCollection([]);
      articleGridView = new ApprovalHistoryArticleGridView();
    } else if (subroute === "needApproval") {
      articlesCollection = new ArticlesThatNeedApprovalCollection([]);
      articleGridView = new NeedApprovalArticleGridView();
    } else if (subroute === "flaggedArticles") {
      articlesCollection = new FlaggedArticlesCollection([]);
      articleGridView = new NeedApprovalArticleGridView();
    } else {
      throw "invalid collectionToUse";
    }
    articlesCollection.fetchNextArticles();
    articleGridView.setArticleCollection(articlesCollection);

    let adminViewInst = new AdminView({articleGridView: articleGridView});
    return adminViewInst;
  },

  getArticleView() {
    const currentUserModel = new CurrentUserModel();
    currentUserModel.fetchCurrentUser();
    const articleModelInst = this.getArticleModel({setIdToCurrentArticle: true});
    articleModelInst.fetchArticle();
    const flagArticleModalView = new FlagArticleModalView({
      articleId: this.getRouter().getArticleIdOfCurrentRoute()
    });
    const articleViewInst = new ArticleView({
      articleModel: articleModelInst,
      currentUserModel: currentUserModel,
      flagArticleModalView: flagArticleModalView,
      navView: this.getNavView()
    });
    return articleViewInst;
  },

  getArticleModel(options) {
    let articleModelInst = new ArticleModel(options);
    return articleModelInst;
  },

  getHomeView() {
    const articleGridViewInst = new ArticleColumnsView({
      router: this.getRouter()
    });

    const mostRecentPopularToggleViewInst = new MostRecentPopularToggleView({
      articleGridView: articleGridViewInst,
      router: this.getRouter()
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
    const articleGridViewInst = new ArticleGridView();
    const myAuthoredArticlesCollection = new MyAuthoredArticlesCollection({});
    myAuthoredArticlesCollection.fetchNextArticles();
    articleGridViewInst.setArticleCollection(myAuthoredArticlesCollection);

    const userModel = new UserModel({userId: userId});
    userModel.fetchUser();

    let userViewInst = new UserView({
      articleGridView: articleGridViewInst,
      userModel: userModel
    });
    return userViewInst;
  },

  initialize() {
    this._createRouter();
    this._createNavView();
  },

  getRouter() {
    return this.router;
  }
};

serviceProvider.initialize();
export default serviceProvider;
