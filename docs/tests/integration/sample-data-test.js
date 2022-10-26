import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

module('Integration | Component | sample-data', function (hooks) {
  setupRenderingTest(hooks);
  test('it renders and displays data according to the timeout', async function (assert) {
    await render(
      hbs`<SampleData @columns={{2}} @rows={{2}} as |columns rows|>
      <p data-test-selector="column">{{columns.[1]}}</p>
      <p data-test-selector="total-columns">{{columns.length}}</p>
      <p data-test-selector="row">{{rows.[1]}}</p>
      <p data-test-selector="total-rows">{{rows.length}}</p>
      </SampleData>`
    );

    // generateSampleData returns different text each time
    assert.dom('[data-test-selector=column]').hasAnyText();
    assert.dom('[data-test-selector=row]').hasAnyText();

    assert.dom('[data-test-selector=total-columns]').hasText('2');
    assert.dom('[data-test-selector=total-rows]').hasText('2');

    await render(
      hbs`<SampleData @columns={{4}} @rows={{4}} @timeout={{5000}} as |columns rows|>
      <p data-test-selector="column">{{columns.[1]}}</p>
      <p data-test-selector="total-columns">{{columns.length}}</p>
      <p data-test-selector="row">{{rows.[1]}}</p>
      <p data-test-selector="total-rows">{{rows.length}}</p>
      </SampleData>`
    );
    assert.dom('[data-test-selector=column]').doesNotContainText();
    assert.dom('[data-test-selector=row]').doesNotContainText();
    assert.dom('[data-test-selector=total-columns]').doesNotContainText();
    assert.dom('[data-test-selector=total-rows]').doesNotContainText();

    await new Promise(resolve => setTimeout(resolve, 5000));

    assert.dom('[data-test-selector=column]').hasAnyText();
    assert.dom('[data-test-selector=row]').hasAnyText();
    assert.dom('[data-test-selector=total-columns]').hasText('4');
    assert.dom('[data-test-selector=total-rows]').hasText('4');
  });
});
