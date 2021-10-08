import Component from '@glimmer/component';
import { cached } from '@glimmer/tracking';
import { setComponentTemplate } from '@ember/component';
import { hbs } from 'ember-cli-htmlbars';

import { generateSampleData } from 'dummy/data';

export default class SampleData extends Component {
  @cached
  get data() {
    return generateSampleData(this.args.rows, this.args.columns);
  }

  get columns() {
    return this.data.headers;
  }

  get rows() {
    return this.data.rows;
  }
}

setComponentTemplate(
  hbs`
    {{yield this.columns this.rows}}
  `,
  SampleData
);
