import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

module('Integration | Helper | with-default', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    this.set('macValue', false);

    await render(hbs`{{with-default this.macValue}}`);

    assert.dom(this.element).hasText('false');
  });
});
