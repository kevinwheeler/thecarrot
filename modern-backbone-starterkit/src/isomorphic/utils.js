const escaper = require('./escaper');

const escapeArticle = function(article) {
  article.headline = escaper.escapeHtml(article.headline);
  article.subline = escaper.escapeHtml(article.subline);
}

const unescapeArticle = function(article) {
  article.headline = escaper.unescapeHtml(article.headline);
  article.subline = escaper.unescapeHtml(article.subline);
}

const escapeUserInfo = function(user) {
  if (user.displayName) {
    user.displayName = escaper.escapeHtml(user.displayName);
  }
}

const unescapeUserInfo = function(user) {
  if (user.displayName) {
    user.displayName = escaper.unescapeHtml(user.displayName);
  }
}

const articleSlugToId = function(articleSlug) {
  return parseInt(articleSlug, 10);
}

module.exports = {
  articleSlugToId: articleSlugToId,
  escapeArticle: escapeArticle,
  unescapeArticle: unescapeArticle,
  escapeUserInfo: escapeUserInfo,
  unescapeUserInfo: unescapeUserInfo,
};
