import { tracked } from '@glimmer/tracking';

import { Resource } from 'ember-resources';

import type { Positional } from 'ember-resources';

export default class Toggle extends Resource<Positional<[unknown]>> {
  @tracked state = this.args.positional[0] ?? false;

  toggle = () => (this.state = !this.state);
}
