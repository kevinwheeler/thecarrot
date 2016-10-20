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
import FeaturedImagesCollection from 'COLLECTIONSDIR/featuredImagesCollection';
import FlagArticleModalView from 'VIEWSDIR/flagArticleModalView';
import FlagsCollection from 'COLLECTIONSDIR/flagsCollection';
import FlagsView from 'VIEWSDIR/flagsView';
import FlaggedArticlesCollection from 'COLLECTIONSDIR/flaggedArticlesCollection';
import HomeView from 'VIEWSDIR/homeView';
import ImagesThatNeedApprovalCollection from 'COLLECTIONSDIR/imagesThatNeedApprovalCollection';
import LoginView from 'VIEWSDIR/loginView';
import MostRecentPopularToggleView from 'VIEWSDIR/mostRecentPopularToggleView';
import MyApprovalHistoryCollection from 'COLLECTIONSDIR/myApprovalHistoryCollection';
import MyAuthoredArticlesCollection from 'COLLECTIONSDIR/myAuthoredArticlesCollection';
import NavView from 'VIEWSDIR/navView';
import NeedApprovalArticleGridView from 'VIEWSDIR/needApprovalArticleGridView';
import NeedApprovalImageGridView from 'VIEWSDIR/needApprovalImageGridView';
import PictureSelectView from 'VIEWSDIR/pictureSelectView';
import Router from '../router';
import TextSearchImagesCollection from 'COLLECTIONSDIR/textSearchImagesCollection';
import UploadModel from 'MODELSDIR/uploadModel';
import UploadView from 'VIEWSDIR/uploadView';
import UserModel from 'MODELSDIR/UserModel';
import UserView from 'VIEWSDIR/userView';
import {unescapeArticle, unescapeUserInfo} from 'ISOMORPHICDIR/utils';
import VoteModel from 'MODELSDIR/voteModel';

var serviceProvider = {
  _createCurrentUserModel() {
    this.currentUserModelInst = new CurrentUserModel(window.kmw.currentUser, {parse: true});
  },

  _createNavView() {
    const currentUser = this.getCurrentUserModel();
    this.navView = new NavView({
      currentUser: currentUser,
    });
  },

  _createRouter() {
    this.router = new Router();
  },

  //getAboutView() {
  //  let aboutViewInst = new AboutView({navView: this.getNavView()});
  //  return aboutViewInst;
  //},

  getAdminView(route) {

    // Hacky, but was a quick fix. We call it articlesCollection even though it may be
    // a image collection now. Clean up later if we actually care.
    let articlesCollection;
    let gridView;
    if (route === "approvalHistory") {
      articlesCollection = new MyApprovalHistoryCollection([]);
      gridView = new ApprovalHistoryArticleGridView();
    } else if (route === "needApproval") {
      articlesCollection = new ArticlesThatNeedApprovalCollection([]);
      gridView = new NeedApprovalArticleGridView();
    } else if (route === "needApprovalImages") {
      articlesCollection = new ImagesThatNeedApprovalCollection([]);
      gridView = new NeedApprovalImageGridView();
    } else if (route === "flaggedArticles") {
      articlesCollection = new FlaggedArticlesCollection([]);
      gridView = new NeedApprovalArticleGridView({
        useFlagsURL: true
      });
    } else {
      throw "invalid admin route";
    }
    articlesCollection.fetchNextArticles();
    gridView.setArticleCollection(articlesCollection);

    let adminViewInst = new AdminView({
      gridView: gridView,
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
    const currentUserModel = this.getCurrentUserModel();
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

  getCurrentUserModel() {
    return this.currentUserModelInst;
  },

  getFlagsView(articleId) {
    const currentUserModel = this.getCurrentUserModel();
    const flagsCollection = new FlagsCollection([], {articleId: articleId});
    flagsCollection.fetchNextFlags();
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

  getPictureSelectView() {
    //const featuredImagesCollectionInst = new FeaturedImagesCollection();
    //featuredImagesCollectionInst.fetch();
    const featuredImagesCollectionInst = new TextSearchImagesCollection([], {
      query: "1"
    });
    featuredImagesCollectionInst.fetchImages();
    return new PictureSelectView({
      featuredImagesCollection: featuredImagesCollectionInst
    });
  },

  getUploadView(el, isAdminRoute) {
    let uploadViewInst = new UploadView({
      el: el,
      isAdminRoute: isAdminRoute,
      model: this.getUploadModel(),
      navView: this.getNavView(),
      pictureSelectView: this.getPictureSelectView()
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

    if (window.kmw.currentUser !== undefined) {
      unescapeUserInfo(window.kmw.currentUser);
    }


    this._createRouter();
    this._createCurrentUserModel();
    this._createNavView();
  },

  getRouter() {
    return this.router;
  }
};

serviceProvider.initialize();
export default serviceProvider;
