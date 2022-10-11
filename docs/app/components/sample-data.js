import Component from '@glimmer/component';
import { setComponentTemplate } from '@ember/component';
import { hbs } from 'ember-cli-htmlbars';

import { generateSampleData } from 'docs/data';
import { task, timeout } from 'ember-concurrency';
import { taskFor } from 'ember-concurrency-ts';
import { modifier } from 'ember-modifier';

export default class SampleData extends Component {
  setup = modifier(() => {
    taskFor(this._getData).perform();
  });

  @task
  *_getData() {
    const wait = this.args.timeout ?? 0;
    // Simulate waiting for an async request
    yield timeout(wait);

    return generateSampleData(this.args.rows, this.args.columns);
  }

  get data() {
    return taskFor(this._getData).lastSuccessful?.value;
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
    {{this.setup}}
    {{yield this.columns this.rows}}
  `,
  SampleData
);
