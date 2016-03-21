import $ from 'jquery';
import 'slick';
import Backbone from 'backbone';
import 'bootstrap';

import Router from './router';


const router = new Router();

Backbone.history.start({pushState: true});

