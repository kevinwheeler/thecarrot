const escaper = require('./escaper');

const escapeArticle = function(article) {
  article.headline = escaper.escapeHtml(article.headline);
  article.subline = escaper.escapeHtml(article.subline);
}

const unescapeArticle = function(article) {
  article.headline = escaper.unescapeHtml(article.headline);
  article.subline = escaper.unescapeHtml(article.subline);
}

const articleSlugToId = function(articleSlug) {
  return parseInt(articleSlug, 10);
}

module.exports = {
  articleSlugToId: articleSlugToId,
  escapeArticle: escapeArticle,
  unescapeArticle: unescapeArticle,
};
