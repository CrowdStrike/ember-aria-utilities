import EmberRouter from '@ember/routing/router';

import { addDocfyRoutes } from '@docfy/ember';
import config from 'docs/config/environment';

export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function () {
  addDocfyRoutes(this);
  this.route('examples', function () {
    this.route('aria-grid', function () {
      this.route('nested');
    });
  });
});
