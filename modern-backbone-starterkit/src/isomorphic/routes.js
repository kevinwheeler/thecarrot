// We pretty much call our headlines 'articles' in every place except for the URL since the URL is
// client facing, we actually call it a headline.
const articleRoute = {
  backboneRouteString1: 'headline/:articleSlug',
  backboneRouteString2: 'admin/headline/:articleSlug',
  nodeRouteString: '/:admin((admin/)?)headline/:articleSlug',
  routePrefix: 'headline',
  adminRoutePrefix: 'admin/headline'
};

module.exports = {
  articleRoute: articleRoute
}
