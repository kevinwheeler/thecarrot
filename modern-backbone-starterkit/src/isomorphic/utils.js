const articleSlugToId = function(articleSlug) {
  return parseInt(articleSlug, 10);
}

module.exports = {
  articleSlugToId: articleSlugToId
};
