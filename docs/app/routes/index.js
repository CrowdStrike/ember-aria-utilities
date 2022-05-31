import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class Index extends Route {
  @service router;

  async beforeModel() {
    this.router.transitionTo('docs');
  }
}
