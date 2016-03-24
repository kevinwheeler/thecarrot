import $ from 'jquery';
import Backbone from 'backbone';

import AboutHeroContentView from './views/aboutHeroContentView.js';
import AboutView from './views/aboutView.js';
import HeroView from './views/heroView.js';
import HomeView from './views/homeView.js';
import HomeHeroContentView from './views/homeHeroContentView.js';
import IndividualPropertyView from './views/individualPropertyView.js';
import MapView from './views/mapView.js';
import MultiLevelNavItem from './views/multiLevelNavItemView.js';
import NavView from './views/navView.js';
import NavItemView from './views/navItemView.js';
import PropertyCollection from './collections/propertyCollection.js';
import PropertiesView from './views/propertiesView.js';
import IndividualPropertyModel from './models/individualPropertyModel.js';
import IndividualPropertyCollection from './collections/individualPropertyCollection.js';
import ShoppingCenterCollection from './collections/ShoppingCenterCollection.js';

export default Backbone.Router.extend({

  // IMPORTANT: When you create a new route, make sure to add it server-side as well.
  // Note these route names are assumed in other places (like navbar items). TODO take the time
  // to factor this out.
  routes: {
    '': 'homeRoute',
    'about': 'aboutRoute',
    'properties': 'propertiesRoute',
    'properties/:propertyslug': 'specificPropertyRoute',
    'map': 'mapRoute'
  },

  afterRoute() {
    this.navView.collapse();
  },

  specificPropertyRoute(propertySlug) {
    let individualPropertyViewInst = new IndividualPropertyView({
      'navView': this.navView
    }).render();
    $('#js-app').empty().append(individualPropertyViewInst.$el);
    this.afterRoute();
  },

  //createDynamicRoutes(propertiesColl) {
  //  var self = this;

  //  //create /properties/<property-slug> routes
  //  propertiesColl.forEach(function(property) {
  //    let routeURL = property.get('url');
  //    //assume URL has a leading slash and remove it.
  //    routeURL = routeURL.slice(1, routeURL.length);
  //    let routeName = routeURL;
  //    self.route(routeURL, routeName, self.individualPropertyRoute);
  //  });
  //},

  createNavView() {
    let navItems = [];
    let propertiesNavItem = this.createPropertiesNavItem();

    navItems.push(propertiesNavItem);

    let aboutNavItem = new NavItemView({
      href: '/about',
      urlText: 'About'
    });

    navItems.push(aboutNavItem);

    return new NavView({navItems: navItems});
  },

  createNavItemForEachProperty() {
    let retVal = [];
    this.individualPropertiesColl.forEach(function(property) {
      retVal.push(new NavItemView({
        href: property.get('url'),
        urlText: property.get('navText')
      }));
    });

    return retVal;
  },

  createPropertiesNavItem() {
    let allPropertiesNavItem = new NavItemView({
      href: '/properties',
      urlText: 'All Properties'
    });

    let navItemForEachProperty = this.createNavItemForEachProperty();
    let allNavItems = [allPropertiesNavItem].concat(navItemForEachProperty);

    let propertiesNavItem = new MultiLevelNavItem({
      navItems: allNavItems,
      text: 'Properties'
    });

    return propertiesNavItem;
  },

  initialize() {
    $('body').append('<div id="js-app"></div>');

    let properties = this.getProperties();
    let shoppingCenters = this.getShoppingCenters();
    this.individualPropertiesColl = new IndividualPropertyCollection(properties);//temp. changed it from a properties collection to a shopping center collection.
    this.shoppingCentersColl = new ShoppingCenterCollection(shoppingCenters);//temp. changed it from a properties collection to a shopping center collection.
    this.allPropertiesColl = new PropertyCollection();
    this.allPropertiesColl.add(this.individualPropertiesColl.models);
    this.allPropertiesColl.add(this.shoppingCentersColl.models);

    this.navView = this.createNavView();
    this.interceptInternalURLs();
    //this.createDynamicRoutes(this.individualPropertiesColl);
  },

  // Make sure when a user click's a link to somewhere else in our page it doesn't
  // cause a new pageload.
  interceptInternalURLs() {
    var self = this;

    //TODO for peformance reasons, it would be better to not use event delegation on document.
    $(document).on('click', 'a.rwc-dont-pageload', function(evt) {
      let href = $(this).attr('href');
      let isRootRelativeUrl = (href.charAt(0) === '/') && (href.charAt(1) !== '/');
      if (isRootRelativeUrl) {
        let urlWithoutLeadingSlash = href.slice(1, href.length);
        evt.preventDefault();
        self.navigate(urlWithoutLeadingSlash, true);
      } else {
        throw "'dont-pageload' links that aren't root relative aren't implemented right now.";
      }
    });
  },

  aboutRoute() {
    // The content we are filling the hero with.
    let ahcv = new AboutHeroContentView();
    let hv = new HeroView({
      'contentView': ahcv,
      'navView': this.navView
    });

    let aboutViewInst = new AboutView({
      'heroView': hv
    }).render();
    $('#js-app').empty().append(aboutViewInst.$el);
    this.afterRoute();
  },

  getProperties() {
    let urlPrefix = '/properties/';
    return [{
      address: '3801 19th St, Lubbock, TX 79423',
      latitude: 33.578188,
      longitude: -101.897021,
      name: 'CVS',
      navText: '3801 19th St',
      url: urlPrefix + '3801-19th-St'
    }, {
      address: '5810 W Loop 289, Lubbock, TX 79424',
      latitude: 33.541481,
      longitude: -101.935755,
      name: 'Verizon',
      navText: '5810 W Loop 289',
      url: urlPrefix + '5810-W-Loop-289'
    }, {
      address: '5725 19th St, Lubbock, TX 79407',
      latitude: 33.576511,
      longitude: -101.938,
      name: "Lowe's",
      navText: '5725 19th St',
      url: urlPrefix + '5725-19th-St'
    }];
  },

  getShoppingCenters() {
    //TODO add windsor creek, chateau, random piece of land on 34th.
    return [{
      name: 'Redbud Square',
      address: '1150 Slide Rd, Lubbock, TX 79416'
    }, {
      name: 'The Quorum',
      address: '5102 60th, Lubbock, TX 79414'
    }, {
      name: 'Frankford Shopping Center',
      address: '5610 Frankford Ave, Lubbock, TX 79424'
    }];
  },

  homeRoute() {
    // The content we are filling the hero with.
    let hhcv = new HomeHeroContentView();

    let hv = new HeroView({
      'contentView': hhcv,
      'navView': this.navView
    });
    let homeViewInst = new HomeView({
      'heroView': hv
    }).render();
    $('#js-app').empty().append(homeViewInst.$el);
    this.afterRoute();
  },

  mapRoute() {
    // As of right now, this route is only here for development purposes so that I
    // can test the map view

    let mv = new MapView({
      individualPropertiesColl: this.individualPropertiesColl,
      shoppingCentersColl: this.shoppingCentersColl
    }).render();

    $('#js-app').empty().append(mv.$el);

  },
  propertiesRoute() {
    let pv = new PropertiesView({
      individualPropertiesColl: this.individualPropertiesColl,
      shoppingCentersColl: this.shoppingCentersColl,
      allPropertiesColl: this.allPropertiesColl
    }).render();

    $('#js-app').empty().append(pv.$el);
    this.afterRoute();
  }
});
