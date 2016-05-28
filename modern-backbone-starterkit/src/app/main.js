import $ from 'jquery';
import Backbone from 'backbone';
import 'bootstrap';
import 'bootstrapCSS';
import 'bootstrapTheme';
//import '../../dist/css/main.css';

import serviceProvider from './utils/serviceProvider.js';

console.log("about to get router");
const router = serviceProvider.getRouter();
console.log("got router");

Backbone.history.start({pushState: true});
