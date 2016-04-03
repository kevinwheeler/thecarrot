import Backbone from 'backbone';

import AboutHeroContentView from '../views/aboutHeroContentView.js';
import AboutView from '../views/aboutView.js';
import slideTemplate from '../views/propertyTemplates/genericSpecificPropertySlideTemplate.hbs';
import HeroView from '../views/heroView.js';
import HomeView from '../views/homeView.js';
import HomeHeroContentView from '../views/homeHeroContentView.js';
import SpecificPropertyView from '../views/specificPropertyView.js';
import MapView from '../views/mapView.js';
import MultiLevelNavItem from '../views/multiLevelNavItemView.js';
import NavView from '../views/navView.js';
import NavItemView from '../views/navItemView.js';
import PropertyCollection from '../collections/propertyCollection.js';
import PropertiesView from '../views/propertiesView.js';
import IndividualPropertyModel from '../models/individualPropertyModel.js';
import IndividualPropertyCollection from '../collections/individualPropertyCollection.js';
import Router from '../router';
import ShoppingCenterCollection from '../collections/ShoppingCenterCollection.js';

var serviceProvider = {
  //TODO clean up create vs get methods so there is a consistent pattern.
  createRouterEvents() {
    let routerEvents = {};
    _.extend(routerEvents, Backbone.Events);
    return routerEvents;
  },

  getAboutView() {
    // The content we are filling the hero with.
    let ahcv = new AboutHeroContentView();
    let hv = new HeroView({
      'contentView': ahcv,
      'navView': this.navView
    });

    let aboutViewInst = new AboutView({
      'heroView': hv
    });
    return aboutViewInst;
  },

  getHomeView() {
    let hhcv = new HomeHeroContentView();

    let hv = new HeroView({
      'contentView': hhcv,
      'navView': this.navView
    });
    let homeViewInst = new HomeView({
      'heroView': hv
    });
    return homeViewInst;
  },

  getIndividualPropertyView(propertySlug) {
    /*
     * inputs:
     * propertySlug: the URL slug for the property that we are creating a view for.
     */
    let property = this.allPropertiesColl.getProperty(propertySlug);
    if (!property) {
      throw "Property not found for this property slug/url"; //TODO 404?
    }
    let individualPropertyViewInst = new SpecificPropertyView({
      'navView': this.navView,
      'slides': property.get('slides')
    });
    return individualPropertyViewInst;
  },

  getMapView() {
    let mv = new MapView({
      individualPropertiesColl: this.individualPropertiesColl,
      shoppingCentersColl: this.shoppingCentersColl
    });
    return mv;
  },

  getPropertiesView() {
    let pv = new PropertiesView({
      individualPropertiesColl: this.individualPropertiesColl,
      shoppingCentersColl: this.shoppingCentersColl,
      allPropertiesColl: this.allPropertiesColl
    });
    return pv;
  },

  createNavView() {
    let navItems = [];
    let propertiesNavItem = this.createPropertiesNavItem();

    navItems.push(propertiesNavItem);

    let aboutNavItem = new NavItemView({
      href: '/about',
      urlText: 'About'
    });

    navItems.push(aboutNavItem);

    return new NavView({navItems: navItems, routerEvents: this.routerEvents});
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

    let properties = this.getProperties();
    let shoppingCenters = this.getShoppingCenters();
    this.individualPropertiesColl = new IndividualPropertyCollection(properties);//temp. changed it from a properties collection to a shopping center collection.
    this.shoppingCentersColl = new ShoppingCenterCollection(shoppingCenters);//temp. changed it from a properties collection to a shopping center collection.
    this.allPropertiesColl = new PropertyCollection();
    this.allPropertiesColl.add(this.individualPropertiesColl.models);
    this.allPropertiesColl.add(this.shoppingCentersColl.models);

    this.routerEvents = this.createRouterEvents();
    this.navView = this.createNavView();
  },

  // returns data in raw json form
  getProperties() {
    let urlPrefix = '/properties/'; // this is currently duplicated in the routes hash up

    let retval = [{
      address: '3801 19th St, Lubbock, TX 79423',
      latitude: 33.578188,
      longitude: -101.897021,
      name: 'CVS',
      navText: '3801 19th St',
      url: urlPrefix + '3801-19th-St', // note duplication
      urlSlug: '3801-19th-St' // note duplication
    }, {
      address: '5810 W Loop 289, Lubbock, TX 79424',
      latitude: 33.541481,
      longitude: -101.935755,
      name: 'Verizon',
      navText: '5810 W Loop 289',
      url: urlPrefix + '5810-W-Loop-289', //note duplication
      urlSlug: '5810-W-Loop-289' //note duplication
    }, {
      address: '5725 19th St, Lubbock, TX 79407',
      latitude: 33.576511,
      longitude: -101.938,
      name: "Lowe's",
      navText: '5725 19th St',
      url: urlPrefix + '5725-19th-St', //note duplication
      urlSlug: '5725-19th-St' // note duplication
    }];

    // Dynamically add attribute 'slides' to each object.
    for (let i = 0; i < retval.length; ++i) {
      // right now using the same value 3 times just as a stub.
      retval[i].slides = [slideTemplate(retval[i]), slideTemplate(retval[i]), slideTemplate(retval[i])];
    }

    return retval;
  },

  getRouter() {
    return new Router({'routerEvents': this.routerEvents});
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

};

serviceProvider.initialize();
export default serviceProvider;
