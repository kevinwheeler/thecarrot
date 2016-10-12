import Backbone from 'backbone';

import AdminView from 'VIEWSDIR/adminView';
import ApprovalHistoryArticleGridView from 'VIEWSDIR/approvalHistoryArticleGridView';
import ArticleGridView from 'VIEWSDIR/articleGridView';
import ArticleView from 'VIEWSDIR/articleView';
import ArticleColumnsView from 'VIEWSDIR/articleColumnsView';
import ArticleModel from 'MODELSDIR/articleModel';
import ArticlesThatNeedApprovalCollection from 'COLLECTIONSDIR/articlesThatNeedApprovalCollection';
import BestArticlesCollection from 'COLLECTIONSDIR/bestArticlesCollection';
import CurrentUserModel from 'MODELSDIR/currentUserModel';
import FlagArticleModalView from 'VIEWSDIR/flagArticleModalView';
import FlagsCollection from 'COLLECTIONSDIR/flagsCollection';
import FlagsView from 'VIEWSDIR/flagsView';
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
import {unescapeArticle} from 'ISOMORPHICDIR/utils';
import VoteModel from 'MODELSDIR/voteModel';

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

  getAdminView(route) {

    let articlesCollection;
    let articleGridView;
    if (route === "approvalHistory") {
      articlesCollection = new MyApprovalHistoryCollection([]);
      articleGridView = new ApprovalHistoryArticleGridView();
    } else if (route === "needApproval") {
      articlesCollection = new ArticlesThatNeedApprovalCollection([]);
      articleGridView = new NeedApprovalArticleGridView();
    } else if (route === "flaggedArticles") {
      articlesCollection = new FlaggedArticlesCollection([]);
      articleGridView = new NeedApprovalArticleGridView({
        useFlagsURL: true
      });
    } else {
      throw "invalid admin route";
    }
    articlesCollection.fetchNextArticles();
    articleGridView.setArticleCollection(articlesCollection);

    let adminViewInst = new AdminView({
      articleGridView: articleGridView,
      navView: this.getNavView()
    });
    return adminViewInst;
  },

  getArticleView(articleId) {
    const articleGridViewInst = new ArticleColumnsView({
      router: this.getRouter()
    });
    const voteModel = new VoteModel({
      articleId: articleId
    });
    const currentUserModel = new CurrentUserModel();
    currentUserModel.fetchCurrentUser();
    const articleModelInst = this.getArticleModel({_id: articleId});
    const flagArticleModalView = new FlagArticleModalView({
      articleId: articleId
    });
    const articleViewInst = new ArticleView({
      articleGridView: articleGridViewInst,
      articleModel: articleModelInst,
      currentUserModel: currentUserModel,
      flagArticleModalView: flagArticleModalView,
      navView: this.getNavView(),
      router: this.getRouter(),
      voteModel: voteModel
    });
    return articleViewInst;
  },

  getArticleModel(options) {
    let articleModelInst;
    if (window.kmw.article !== undefined && options._id == window.kmw.article._id) {
      articleModelInst = new ArticleModel(window.kmw.article, {parse: true});
    } else {
      articleModelInst = new ArticleModel(options);
      articleModelInst.fetchArticle();
    }
    return articleModelInst;
  },

  getBestArticlesCollection() {
    const articleCollection = new BestArticlesCollection([], {
      category: 'all',
      skipAheadAmount: 0,
      staffPicksOnly: false,
      timeInterval: 'all_time',
    });
    return articleCollection;
  },

  getFlagsView(articleId) {
    const currentUserModel = new CurrentUserModel();
    const flagsCollection = new FlagsCollection([], {articleId: articleId});
    flagsCollection.fetchNextFlags();
    currentUserModel.fetchCurrentUser();
    const articleModelInst = this.getArticleModel({_id: articleId});
    articleModelInst.fetchArticle();
    const flagsViewInst = new FlagsView({
      articleModel: articleModelInst,
      currentUserModel: currentUserModel,
      flagsCollection: flagsCollection,
      navView: this.getNavView(),
    });
    return flagsViewInst;
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

  getUploadView(el) {
    let uploadViewInst = new UploadView({
      el: el,
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
    if (window.kmw.article !== undefined) {
      unescapeArticle(window.kmw.article);
    }
    this._createRouter();
    this._createNavView();
  },

  getRouter() {
    return this.router;
  }
};

serviceProvider.initialize();
export default serviceProvider;
