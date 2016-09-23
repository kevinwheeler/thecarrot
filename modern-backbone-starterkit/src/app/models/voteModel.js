// consider this an abstract class. AKA don't initialize instances of this class.
// initialize instances of the subclasses instead.
import Backbone from 'backbone';
import serviceProvider from 'UTILSDIR/serviceProvider';
import cat from 'ISOMORPHICDIR/categories';

export default Backbone.Model.extend({
  defaults: {
    voteStatus: "clear"
  },

  initialize: function(options) {
    this.articleId = options.articleId;
  },

  isUpVoted: function() {
    return this.get('voteStatus') === 'up';
  },

  isDownVoted: function() {
    return this.get('voteStatus') === 'down';
  },

  doVote: function(voteType) {
    if (voteType !== "down" && voteType !== "up") {
      throw "invalid voteType";
    }

    this.set('voteStatus', voteType);
    $.ajax({
      type: "POST",
      url: '/vote',
      data: {
        article_id: this.get('articleId'),
        vote_type: voteType
      },
    });
  },
});
