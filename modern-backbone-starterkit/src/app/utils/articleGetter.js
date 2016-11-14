import Backbone from 'backbone';
import _ from 'lodash';

class ArticleGetter {
  constructor(articleCollection) {
    _.extend(this, Backbone.Events);
    this.articleCollection = articleCollection;
    this.nextArticleIndex = 0;
    this.promiseMap = {};
    this.articleCollection.fetchNextArticles();
    this.listenTo(this.articleCollection, 'add', this.onArticleAdded);
    this.listenTo(this.articleCollection, 'update', this.onCollectionUpdate);
    this.listenTo(this.articleCollection, 'noMoreResults', this.onNoMoreResults);
  }

  getNextArticle() {
    if (!this.articleCollection.noMoreResults && this.nextArticleIndex > length - 30) {
      this.articleCollection.fetchNextArticles();
    }

    console.log("next article index = ");
    console.log(this.nextArticleIndex);
    console.log("articleCollection length = ");
    console.log(this.articleCollection.length);
    if (this.nextArticleIndex < this.articleCollection.length) {
      console.log("a");
      return Promise.resolve(this.articleCollection.at(this.nextArticleIndex++));
    } else {
      console.log("b");
      if (this.articleCollection.noMoreResults) {
        console.log("c");
        return Promise.reject("no more results");
      } else {
        console.log("d");
        let resolveExternally;
        let rejectExternally;
        const prom = new Promise((resolve,reject) => {
          resolveExternally = resolve;
          rejectExternally = reject;
        });
        this.promiseMap[this.nextArticleIndex] = [resolveExternally, rejectExternally];
        this.nextArticleIndex++;
        return prom;
      }
    }
  }

  onArticleAdded(model, collection, options) {
    const index = collection.indexOf(model)
    console.log("in on arrticle added. index = ");
    console.log(index);
    if (this.promiseMap[index]) {
      console.log("resolving");
      const resolve = this.promiseMap[index][0];
      delete this.promiseMap[index];
      resolve(model);
    }
  }

  onCollectionUpdate(collection, options) {
    console.log("on collection update");
    if (!_.isEmpty(this.promiseMap)) {
      this.articleCollection.fetchNextArticles();
    }
  }

  //onNoMoreResults(collection, options) {
  //  const self = this;
  //  _.forEach(this.promiseMap, function(value, key) {
  //    const reject = value[1];
  //    delete self.promiseMap[key];
  //    reject("no more results");
  //  })
  //}
}

export default ArticleGetter;
