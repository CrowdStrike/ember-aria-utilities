import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

module('Integration | Helper | repeat', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    this.set('times', 3);

    await render(hbs`{{repeat this.times}}`);

    assert.dom(this.element).hasText('0,1,2');
  });
});
