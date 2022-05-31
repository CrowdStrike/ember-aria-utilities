import { tracked } from '@glimmer/tracking';

import { Resource } from 'ember-resources/core';

export default class Toggle extends Resource {
  @tracked state = false;

  modify([nextState]) {
    this.state = nextState;
  }

  toggle = () => (this.state = !this.state);
}
