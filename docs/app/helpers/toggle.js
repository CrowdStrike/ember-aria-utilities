import { tracked } from '@glimmer/tracking';

import { Resource } from 'ember-modify-based-class-resource';

export default class Toggle extends Resource {
  @tracked state = false;

  modify([nextState]) {
    this.state = nextState;
  }

  toggle = () => (this.state = !this.state);
}
