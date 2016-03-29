import $ from 'jquery';
import 'slick';
import Backbone from 'backbone';
import 'bootstrap';

import serviceProvider from './utils/serviceProvider.js';

const router = serviceProvider.getRouter();

Backbone.history.start({pushState: true});

