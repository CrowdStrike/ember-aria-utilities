import Component from '@glimmer/component';
// typed-ember has not published templates for this export
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import { setComponentTemplate } from '@ember/component';
import { hbs } from 'ember-cli-htmlbars';

import { trackedFunction } from 'reactiveweb/function';

export default class AsyncData extends Component {
  request = trackedFunction(this, async () => {
    const wait = this.args.timeout ?? 0;

    // Simulate waiting for an async request
    await new Promise((resolve) => setTimeout(resolve, wait));

    return { rows: this.args.rows, columns: this.args.columns };
  });

  get data() {
    return this.request.value;
  }

  get columns() {
    return this.data?.columns;
  }

  get rows() {
    return this.data?.rows;
  }
}

setComponentTemplate(
  hbs`
    {{yield this.rows this.columns }}
  `,
  AsyncData
);
