import $ from 'jquery';
import Backbone from 'backbone';

import AboutHeroContentView from './views/aboutHeroContentView.js';
import AboutView from './views/aboutView.js';
import HeroView from './views/heroView.js';
import HomeView from './views/homeView.js';
import HomeHeroContentView from './views/homeHeroContentView.js';
import MapView from './views/mapView.js';
import MultiLevelNavItem from './views/multiLevelNavItemView.js';
import NavView from './views/navView.js';
import NavItemView from './views/navItemView.js';
import PropertiesView from './views/propertiesView.js';
import PropertyModel from './models/propertyModel.js';
import PropertyCollection from './collections/propertyCollection.js';
import ShoppingCenterCollection from './collections/ShoppingCenterCollection.js';

export default Backbone.Router.extend({

  // IMPORTANT: When you create a new route, make sure to add it server-side as well.
  routes: {
    '': 'home',
    'about': 'about',
    'properties': 'properties',
    'map': 'map'
  },

  afterRoute() {
    this.navView.collapse();
  },

  initialize() {
    $('body').append('<div id="js-app"></div>');

    var self = this;

    let navItems = [];

    let aboutNavItem = new NavItemView({
      href: '/about',
      urlText: 'About'
    });

    navItems.push(aboutNavItem);

    let property1NavItem = new NavItemView({
      href: '/property1',
      urlText: 'property1'
    });

    let property2NavItem = new NavItemView({
      href: '/property2',
      urlText: 'property2'
    });

    let propertyNavItems = [property1NavItem, property2NavItem];

    let propertiesNavItem = new MultiLevelNavItem({
      navItems: propertyNavItems,
      text: 'Properties'
    });

    navItems.push(propertiesNavItem);

    this.navView = new NavView({navItems: navItems});

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

  about() {
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
    return [{
      name: 'CVS',
      address: '3801 19th St, Lubbock, TX 79423',
      latitude: 33.578188,
      longitude: -101.897021
    }, {
      name: 'Verizon',
      address: '5810 W Loop 289, Lubbock, TX 79424',
      latitude: 33.541481,
      longitude: -101.935755
    }, {
      name: "Lowe's",
      address: '5725 19th St, Lubbock, TX 79407',
      latitude: 33.576511,
      longitude: -101.938837
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

  home() {
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

  map() {
    // As of right now, this route is only here for development purposes so that I
    // can test the map view

    let properties = this.getProperties();
    let shoppingCenters = this.getShoppingCenters();
    let propertiesColl = new PropertyCollection(properties);//temp. changed it from a properties collection to a shopping center collection.
    let shoppingCentersColl = new ShoppingCenterCollection(shoppingCenters);//temp. changed it from a properties collection to a shopping center collection.
    let mv = new MapView({
      propertiesColl: propertiesColl,
      shoppingCentersColl: shoppingCentersColl
    }).render();

    $('#js-app').empty().append(mv.$el);

  },
  properties() {
    // this whole route is for development only, to make sure I'm creating the collections
    // correctly.

    let properties = this.getProperties();
    let shoppingCenters = this.getShoppingCenters();

    let propertiesColl = new PropertyCollection(properties);
    let shoppingCentersColl = new ShoppingCenterCollection(shoppingCenters);
    //let propertyCollection = new PropertyModel({
    //  address: 'right behind you'
    //});
    let pv = new PropertiesView({
      propertiesColl: propertiesColl,
      shoppingCentersColl: shoppingCentersColl
    }).render();

    $('#js-app').empty().append(pv.$el);
    this.afterRoute();
  }
});
