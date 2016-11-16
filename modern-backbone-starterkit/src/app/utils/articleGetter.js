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

  destroy() {
    this.stopListening();
  }

  getNextArticle() {
    if (!this.articleCollection.noMoreResults && this.nextArticleIndex > length - 30) {
      this.articleCollection.fetchNextArticles();
    }

    if (this.nextArticleIndex < this.articleCollection.length) {
      return Promise.resolve(this.articleCollection.at(this.nextArticleIndex++));
    } else {
      if (this.articleCollection.noMoreResults) {
        return Promise.reject("no more results");
      } else {
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
    if (this.promiseMap[index]) {
      const resolve = this.promiseMap[index][0];
      delete this.promiseMap[index];
      resolve(model);
    }
  }

  onCollectionUpdate(collection, options) {
    if (!_.isEmpty(this.promiseMap)) {
      this.articleCollection.fetchNextArticles();
    }
  }

  onNoMoreResults(collection, options) {
    const self = this;
    _.forEach(this.promiseMap, function(value, key) {
      const reject = value[1];
      delete self.promiseMap[key];
      reject("no more results");
    })
  }
}

export default ArticleGetter;
