import Component from '@glimmer/component';
import { setComponentTemplate } from '@ember/component';
import { hbs } from 'ember-cli-htmlbars';

import { generateSampleData } from 'docs/data';
import { trackedFunction } from 'reactiveweb/function';

export default class SampleData extends Component {
  request = trackedFunction(this, async () => {
    const wait = this.args.timeout ?? 0;
    // Simulate waiting for an async request
    await new Promise((resolve) => setTimeout(resolve, wait));

    return generateSampleData(this.args.rows, this.args.columns);
  });

  get data() {
    return this.request.value;
  }

  get columns() {
    return this.data?.headers;
  }

  get rows() {
    return this.data?.rows;
  }
}

setComponentTemplate(
  hbs`
    {{yield this.columns this.rows}}
  `,
  SampleData
);
