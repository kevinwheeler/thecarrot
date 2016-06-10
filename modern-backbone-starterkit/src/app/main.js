import $ from 'jquery';
import Backbone from 'backbone';
import 'bootstrap';
import 'bootstrapCSS';
import 'bootstrapTheme';
//import '../../dist/css/main.css';

import serviceProvider from './utils/serviceProvider.js';

const router = serviceProvider.getRouter();

Backbone.history.start({pushState: true});
