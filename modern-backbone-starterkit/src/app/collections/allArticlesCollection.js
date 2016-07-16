import Backbone from 'backbone';
import ArticleModel from 'MODELSDIR/articleModel';

export default Backbone.Collection.extend({
  model: ArticleModel,
  url: '/all-articles'

  //parse: function(response, options){
  //  console.log("parse options = ");
  //  console.dir(options);
  //  return response;
  //}
});
