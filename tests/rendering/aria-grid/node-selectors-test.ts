import { find, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import { rowAbove, rowBelow, siblingsOf } from 'ember-aria/modifiers/-private/node-selectors';

async function renderNestedGrid() {
  await render(hbs`
    <div role="grid" id="grid-a">
      <div role="row" id="row-a">
        <div role="cell" id="cell-a"></div>
        <div role="cell" id="cell-b">

          <div role="grid" id="grid-b">
            <div role="row" id="row-b">
              <div role="cell" id="cell-c"></div>
            </div>
          </div>
        </div>

      </div>
      <!-- row b is within the tested grid -->
      <div role="row" id="row-c">
        <div role="cell" id="cell-d"></div>
        <div role="cell" id="cell-e"></div>
      </div>
    </div>
  `);
}

module('Rendering | node-selectors', function (hooks) {
  setupRenderingTest(hooks);

  module('siblingsOf', function () {
    test('does not select nested cells in a nested grid', async function (assert) {
      await renderNestedGrid();

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      let firstCell = find('#cell-a')!;
      let siblings = siblingsOf(firstCell);

      assert.equal(siblings?.length, 2);
      assert.deepEqual(
        siblings?.map((cell) => cell.id),
        ['cell-a', 'cell-b']
      );
    });
  });

  module('rowAbove', function () {
    test('skips rows in the nested grid', async function (assert) {
      await renderNestedGrid();

      let lastCell = find('#cell-e');
      let above = rowAbove(lastCell);

      assert.ok(above, 'a row above exists');
      assert.equal(above?.id, 'row-a');
    });
  });

  module('rowBelow', function () {
    test('skips rows in the nested grid', async function (assert) {
      await renderNestedGrid();

      let firstCell = find('#cell-a');
      let below = rowBelow(firstCell);

      assert.ok(below, 'a row above exists');
      assert.equal(below?.id, 'row-c');
    });
  });
});
