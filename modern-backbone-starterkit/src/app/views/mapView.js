// This whole view is for development purposes only, to make sure I'm creating
// the properties collection and the shopping centers collection correctly.
// It's gotten gacky in that it is called propertiesView but it also
// displays shopping centers.
import $ from 'jquery';
import _ from 'lodash';
import Backbone from 'backbone';

import template from './propertiesTemplate.hbs';

export default Backbone.View.extend({

  initMap: function(propertiesColl, shoppingCentersColl) {
    let map = new google.maps.Map(this.$el.get()[0], {
      center: {lat: 33.563176, lng: -101.888109},
      zoom: 13
    });

    propertiesColl.forEach(function(property) {
      let marker = new google.maps.Marker({
        animation: google.maps.Animation.DROP,
        map: map,
        position: new google.maps.LatLng(property.get('latitude'), property.get('longitude'))
        //TODO add title field? (aka the pin's hover tooltip)
      });

      let infowindow = new google.maps.InfoWindow({
        content: 'Sup'
      });

      marker.addListener('click', function() {
        infowindow.open(map, marker);
      });

    });
  },

  initialize: function(options = {}) {
    this.options = options;
    this.views = [];
    this.initMap(options.propertiesColl, options.shoppingCentersColl);

    //kmw: http://arturadib.com/hello-backbonejs/docs/1.html
    _.bindAll(this, 'render'); //comment came with code example: fixes loss of context for 'this' within methods
    this.render();
  },

  className: 'rwc-map-view',

  render: function() {
    _.forEach(this.views, function(view) {
      view.render();
    });
    //this.$el.html(this.template({
    //  prop: JSON.stringify(this.options.propertiesColl.toJSON()),
    //  shop: JSON.stringify(this.options.shoppingCentersColl.toJSON())
    //}));
    return this;
  },

  template: template
});
