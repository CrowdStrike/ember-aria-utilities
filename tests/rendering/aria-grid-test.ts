import { assert } from '@ember/debug';
import {
  click,
  find,
  findAll,
  focus,
  render,
  resetOnerror,
  settled,
  setupOnerror,
} from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { module, skip, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import { closestRow } from 'ember-aria-utilities/modifiers/-private/node-selectors';
import { ariaGrid } from 'ember-aria-utilities/test-support';

import { Grid, NestedGrid, repeat, withDefault } from '../helpers';

const { keys, selectors } = ariaGrid;

/**
 * About these tests:
 *
 *  a sample grid is rendered where each cell displays the cell's
 *  coordinates as text -- 0-indexed normalized on the first cell of the body
 *  (left, top -- just under the header).
 *
 *  all assertions around navigation will reference these coordinates.
 *
 */
module('{{aria-grid}}', function (hooks) {
  setupRenderingTest(hooks);

  /**
   * Asserts that the column header (0-indexed) is active
   */
  function assertActive(column: number, msg?: string): void;
  /**
   * Asserts that the cell is active at a given x,y coordinate starting in the top-left,
   * just under the header
   */
  function assertActive(x: number, y: number, msg?: string): void;

  function assertActive(x: number, yOrMsg?: number | string, maybeMsg?: string) {
    let y: undefined | number;
    let msg: undefined | string;

    if (typeof yOrMsg === 'number') {
      y = yOrMsg;
      msg = maybeMsg;
    }

    if (typeof yOrMsg === 'string') {
      msg = yOrMsg;
    }

    if (y === undefined || y === null) {
      // assert the header
      QUnit.assert.dom(document.activeElement).hasText(`${x}`, msg);
      QUnit.assert.dom(document.activeElement).hasAttribute('role', 'columnheader');

      return;
    }

    let text = `(${x}, ${y})`;

    /**
     * Tests if our tests are controlling focus correctly
     */
    QUnit.assert.dom(document.activeElement).hasAttribute('data-position', text, msg);
    /**
     * Tests if our code-under-test is controlling intent correctly
     */
    QUnit.assert.dom('[data-debug-has-intended-focus]').hasAttribute('data-position', text);
  }

  function assertRowIndex(grid?: Element) {
    let index = 1; // rowindex is 1-indexed

    let _grid = grid ?? find(selectors.grid);

    assert(`No "${selectors.grid}" found in the DOM`, _grid);

    let rows = selectors.rowsOf(_grid);

    for (let row of rows) {
      QUnit.assert.dom(row).hasAttribute('aria-rowindex', `${index}`);
      index++;
    }
  }

  hooks.beforeEach(function () {
    this.owner.register('helper:with-default', withDefault);
    this.owner.register('helper:repeat', repeat);
    this.owner.register(`component:grid`, Grid);
    this.owner.register(`component:nested-grid`, NestedGrid);
  });

  hooks.afterEach(function () {
    resetOnerror();
  });

  test('role=grid is required', async function (assert) {
    assert.expect(1);

    setupOnerror((e: Error) => {
      assert.equal(
        e.message,
        `Assertion Failed: {{aria-grid}} modifier may only be used on elements with role="grid"`
      );
    });

    await render(hbs`<div {{aria-grid}}></div>`);
  });

  test('Only the first cell has tabindex=0', async function (assert) {
    await render(hbs`<Grid />`);

    assert.dom(selectors.tabbable).exists({ count: 1 });
  });

  test('Clicking a cell switches the tabindex=0 cell', async function (assert) {
    await render(hbs`<Grid />`);

    let first = find(selectors.tabbable);
    let others = findAll(selectors.untabbable);

    await click(others[others.length - 1]);

    let newTabTarget = find(selectors.tabbable);

    assert.notEqual(first, newTabTarget);
  });

  module('ARIA', function () {
    test('row indices and row count are provided', async function (assert) {
      // 1: row count
      // 3: each row
      assert.expect(4);

      await render(hbs`<Grid @rows={{2}} />`);

      assert.dom(selectors.grid).hasAttribute('aria-rowcount', '3', 'one header + 2 rows');

      assertRowIndex();
    });

    test('rowcount / indices are updated when rows change', async function (assert) {
      // 1: row count
      // 1: row count update
      // 11: each row
      assert.expect(13);

      this.setProperties({ rows: 4 });

      await render(hbs`<Grid @rows={{this.rows}} />`);

      assert.dom(selectors.grid).hasAttribute('aria-rowcount', '5', 'one header + 4 rows');

      this.setProperties({ rows: 10 });
      await settled();

      assert.dom(selectors.grid).hasAttribute('aria-rowcount', '11', 'one header + 10 rows');

      assertRowIndex();
    });

    test('rows inserted within a row (nested grids) do not affect the outer row count and index incrementing', async function (assert) {
      // 1: row count
      // 1: row count (nested grid)
      // 3: each row
      // 2: each row
      assert.expect(7);

      await render(
        hbs`
          <div role="grid" {{aria-grid}}>
            <div role="row"><div role="cell"></div></div>
            <div role="row"><div role="cell"></div></div>
            <div role="row">
              <div role="cell">
                <div role="grid" {{aria-grid}}>
                  <div role="row"><div role="cell"></div></div>
                  <div role="row"><div role="cell"></div></div>
                </div>
              </div>
            </div>
          </div>
        `
      );

      let grids = findAll(selectors.grid);

      assert.dom(grids[0]).hasAttribute('aria-rowcount', '3');
      assertRowIndex(grids[0]);

      assert.dom(grids[1]).hasAttribute('aria-rowcount', '2');
      assertRowIndex(grids[1]);
    });

    test('index / count attributes remain stable when non-grid content changes', async function (assert) {
      this.setProperties({ showing: false });

      await render(
        hbs`
          <div role="grid" {{aria-grid}}>
            <div role="row"><div role="cell"></div></div>
            <div role="row"><div role="cell"></div></div>
            <div role="row">
              <div role="cell">
                {{#if this.showing}}
                  <button>hi</button>
                {{/if}}
              </div>
            </div>
          </div>
        `
      );

      let grids = findAll(selectors.grid);

      assert.dom(grids[0]).hasAttribute('aria-rowcount', '3');
      assert.dom('button').doesNotExist();

      this.setProperties({ showing: true });
      await settled();

      assert.dom('button').exists();
      // there is no way to hook in to the mutation observer used by aria-grid (for now?)
      // so this test is used to help debug that adding button does not also
      // cause installRowIndices to re-run
    });
  });

  module('Navigation', function () {
    /**
     * These tests are blocked until:
     *   https://github.com/emberjs/ember-test-helpers/pull/771
     *   is merged
     */
    module('Tab', function () {
      skip('initial selects the first non-header cell', async function (assert) {
        await render(hbs`
          <button id='before'>before</button>
          <Grid />
          <button id='after'>after</button>
        `);

        focus('#before');

        let first = find(selectors.cell);

        assert.notEqual(document.activeElement, first);

        await keys.tab();
        // await triggerKeyEvent('#before', 'keydown', 'Tab');

        assert.equal(document.activeElement, first);
      });

      skip('after clicking a cell, tabbing still exits the grid', async function (assert) {
        await render(hbs`
          <button id='before'>before</button>
          <Grid />
          <button id='after'>after</button>
        `);

        let others = findAll(selectors.untabbable);
        let last = others[others.length - 1];

        await click(last);
        await keys.tab();

        assert.equal(document.activeElement, last);
      });

      skip('with nested focusables', async function (assert) {
        assert.expect(0);
      });
    });

    module('Left', function () {
      test('when focus is on the left side', async function () {
        await render(hbs`<Grid />`);
        await click(selectors.tabbable);
        assertActive(0, 0);

        await keys.left();
        assertActive(0, 0, `can't go more left`);
      });

      test('when focus is on the right side', async function () {
        await render(hbs`<Grid @columns={{3}} />`);
        await click(selectors.cellsInRow(0, ':last-child'));
        assertActive(2, 0);

        await keys.left();
        assertActive(1, 0);

        await keys.left();
        assertActive(0, 0);

        await keys.left();
        assertActive(0, 0, `can't go more left`);
      });
    });

    module('Ctrl+Left', function () {
      test('when focus is on the left side', async function () {
        await render(hbs`<Grid />`);
        await click(selectors.tabbable);
        assertActive(0, 0);

        await keys.ctrlLeft();
        assertActive(0, 0, `can't go more left`);
      });

      test('when focus is on the right side', async function () {
        await render(hbs`<Grid @columns={{3}} />`);
        await click(selectors.cellsInRow(0, ':last-child'));
        assertActive(2, 0);

        await keys.ctrlLeft();
        assertActive(0, 0);

        await keys.ctrlLeft();
        assertActive(0, 0, `can't go more left`);
      });
    });

    module('Right', function () {
      test('when focus is on the left side', async function () {
        await render(hbs`<Grid @columns={{3}} />`);
        await click(selectors.tabbable);
        assertActive(0, 0);

        await keys.right();
        assertActive(1, 0);

        await keys.right();
        assertActive(2, 0);

        await keys.right();
        assertActive(2, 0, `can't go more right`);
      });

      test('when focus is on the right side', async function () {
        await render(hbs`<Grid @columns={{3}} />`);
        await click(selectors.cellsInRow(0, ':last-child'));
        assertActive(2, 0);

        await keys.right();
        assertActive(2, 0, `can't go right anymore`);
      });
    });

    module('Ctrl+Right', function () {
      test('when focus is on the left side', async function () {
        await render(hbs`<Grid @columns={{3}} />`);
        await click(selectors.tabbable);
        assertActive(0, 0);

        await keys.ctrlRight();
        assertActive(2, 0);

        await keys.ctrlRight();
        assertActive(2, 0, `can't go more right`);
      });

      test('when focus is on the right side', async function () {
        await render(hbs`<Grid @columns={{3}} />`);
        await click(selectors.cellsInRow(0, ':last-child'));
        assertActive(2, 0);

        await keys.ctrlRight();
        assertActive(2, 0, `can't go right anymore`);
      });
    });

    module('Up', function () {
      test('with initial focus', async function () {
        await render(hbs`<Grid />`);
        await click(selectors.tabbable);
        assertActive(0, 0);

        await keys.up();
        assertActive(0);

        await keys.up();
        assertActive(0, `can't go up anymore`);
      });

      test('when focus is at the top', async function () {
        await render(hbs`<Grid />`);
        await click(selectors.firstHeaderCell);
        assertActive(0);

        await keys.up();
        assertActive(0, `can't go up anymore`);
      });

      test('when focus is at the bottom', async function () {
        await render(hbs`<Grid @rows={{3}} />`);
        await click(selectors.bottomLeft);
        assertActive(0, 2);

        await keys.up();
        assertActive(0, 1);

        await keys.up();
        assertActive(0, 0);

        await keys.up();
        assertActive(0);

        await keys.up();
        assertActive(0, `can't go up anymore`);
      });
    });

    module('Ctrl+Up', function () {
      test('with initial focus', async function () {
        await render(hbs`<Grid />`);
        await click(selectors.tabbable);
        assertActive(0, 0);

        await keys.ctrlUp();
        assertActive(0);

        await keys.ctrlUp();
        assertActive(0, `can't go up anymore`);
      });

      test('when focus is at the top', async function () {
        await render(hbs`<Grid />`);
        await click(selectors.firstHeaderCell);
        assertActive(0);

        await keys.ctrlUp();
        assertActive(0, `can't go up anymore`);
      });

      test('when focus is at the bottom', async function () {
        await render(hbs`<Grid @rows={{3}} />`);
        await click(selectors.bottomLeft);
        assertActive(0, 2);

        await keys.ctrlUp();
        assertActive(0, 0);

        await keys.ctrlUp();
        assertActive(0);

        await keys.ctrlUp();
        assertActive(0, `can't go up anymore`);
      });
    });

    module('Down', function () {
      test('with initial focus', async function () {
        await render(hbs`<Grid />`);
        await click(selectors.tabbable);
        assertActive(0, 0);

        await keys.down();
        assertActive(0, 1);

        await keys.down();
        assertActive(0, 1, `can't go down anymore`);
      });

      test('when focus is at the top', async function () {
        await render(hbs`<Grid @rows={{3}} />`);
        await click(selectors.firstHeaderCell);
        assertActive(0);

        await keys.down();
        assertActive(0, 0);

        await keys.down();
        assertActive(0, 1);

        await keys.down();
        assertActive(0, 2);

        await keys.down();
        assertActive(0, 2, `can't go down anymore`);
      });

      test('when focus is at the bottom', async function () {
        await render(hbs`<Grid @rows={{3}} />`);
        await click(selectors.bottomLeft);
        assertActive(0, 2);

        await keys.down();
        assertActive(0, 2, `can't go down anymore`);
      });
    });

    module('Ctrl+Down', function () {
      test('with initial focus', async function () {
        await render(hbs`<Grid @rows={{3}} />`);
        await click(selectors.tabbable);
        assertActive(0, 0);

        await keys.ctrlDown();
        assertActive(0, 2);

        await keys.ctrlDown();
        assertActive(0, 2, `can't go down anymore`);
      });

      test('when focus is at the top', async function () {
        await render(hbs`<Grid @rows={{3}} />`);
        await click(selectors.firstHeaderCell);
        assertActive(0);

        await keys.ctrlDown();
        assertActive(0, 2);

        await keys.ctrlDown();
        assertActive(0, 2, `can't go down anymore`);
      });

      test('when focus is at the bottom', async function () {
        await render(hbs`<Grid @rows={{3}} />`);
        await click(selectors.bottomLeft);
        assertActive(0, 2);

        await keys.ctrlDown();
        assertActive(0, 2, `can't go down anymore`);
      });
    });

    module('Home', function () {
      test('with initial focus', async function () {
        await render(hbs`<Grid />`);
        await click(selectors.cellAt(0, 0));
        assertActive(0, 0);

        await keys.home();
        assertActive(0, 0);

        await keys.home();
        assertActive(0, 0, `already on the first cell of row`);
      });

      test('with focus on some other cell', async function () {
        await render(hbs`<Grid @columns={{3}} />`);
        await click(selectors.cellAt(1, 0));
        assertActive(1, 0);

        await keys.home();
        assertActive(0, 0);

        await keys.home();
        assertActive(0, 0, `already on the first cell of row`);
      });

      test('with focus in the header', async function () {
        await render(hbs`<Grid />`);
        await click(selectors.cellAt(1));
        assertActive(1);

        await keys.home();
        assertActive(0);

        await keys.home();
        assertActive(0, `already on the first cell of row`);
      });
    });

    module('Ctrl+Home', function () {
      test('with initial focus', async function () {
        await render(hbs`<Grid />`);
        await click(selectors.cellAt(0, 0));
        assertActive(0, 0);

        await keys.ctrlHome();
        assertActive(0, 0);

        await keys.ctrlHome();
        assertActive(0, 0, `already on the first cell`);
      });

      test('with focus on some other row', async function () {
        await render(hbs`<Grid @rows={{3}} />`);
        await click(selectors.cellAt(0, 2));
        assertActive(0, 2);

        await keys.ctrlHome();
        assertActive(0, 0);

        await keys.ctrlHome();
        assertActive(0, 0, `already on the first cell`);
      });

      test('with focus in the header', async function () {
        await render(hbs`<Grid @rows={{3}} />`);
        await click(selectors.cellAt(0));
        assertActive(0);

        await keys.ctrlHome();
        assertActive(0, 0);

        await keys.ctrlHome();
        assertActive(0, 0, `already on the first cell`);
      });
    });

    module('End', function () {
      test('with initial focus', async function () {
        await render(hbs`<Grid @columns={{3}} @rows={{3}} />`);
        await click(selectors.cellAt(0, 0));
        assertActive(0, 0);

        await keys.end();
        assertActive(2, 0);

        await keys.end();
        assertActive(2, 0, `already on the lest cell of row`);
      });

      test('with focus on some other cell', async function () {
        await render(hbs`<Grid @columns={{3}} @rows={{3}} />`);
        await click(selectors.cellAt(1, 1));
        assertActive(1, 1);

        await keys.end();
        assertActive(2, 1);

        await keys.end();
        assertActive(2, 1, `already on the lest cell of row`);
      });

      test('with focus in the header', async function () {
        await render(hbs`<Grid @columns={{3}} />`);
        await click(selectors.cellAt(1));
        assertActive(1);

        await keys.end();
        assertActive(2);

        await keys.end();
        assertActive(2, `already on the lest cell of row`);
      });
    });

    module('Ctrl+End', function () {
      test('with initial focus', async function () {
        await render(hbs`<Grid @columns={{3}} @rows={{3}} />`);
        await click(selectors.cellAt(0, 0));
        assertActive(0, 0);

        await keys.ctrlEnd();
        assertActive(2, 2);

        await keys.ctrlEnd();
        assertActive(2, 2, `already on the last cell`);
      });

      test('with focus on some other row', async function () {
        await render(hbs`<Grid @columns={{3}} @rows={{3}} />`);
        await click(selectors.cellAt(1, 1));
        assertActive(1, 1);

        await keys.ctrlEnd();
        assertActive(2, 2);

        await keys.ctrlEnd();
        assertActive(2, 2, `already on the last cell`);
      });

      test('with focus in the header', async function () {
        await render(hbs`<Grid @columns={{3}} @rows={{3}} />`);
        await click(selectors.cellAt(1));
        assertActive(1);

        await keys.ctrlEnd();
        assertActive(2, 2);

        await keys.ctrlEnd();
        assertActive(2, 2, `already on the last cell`);
      });
    });

    module('PageDown', function () {
      /* Not implemented yet */
    });

    module('PageUp', function () {
      /* Not implemented yet */
    });
  });

  module('macOS', function () {
    module('Ctrl+Home', function () {
      test('same behavior as without Ctrl', async function () {
        await render(hbs`<Grid @isMac={{true}} @rows={{3}} />`);
        await click(selectors.cellAt(0, 2));
        assertActive(0, 2);

        await keys.ctrlHome();
        assertActive(0, 0);

        await keys.ctrlHome();
        assertActive(0, 0, `already on the first cell`);
      });
    });

    module('Ctrl+End', function () {
      test('same behavior as without Ctrl', async function () {
        await render(hbs`<Grid @isMac={{true}} @columns={{3}} @rows={{3}} />`);
        await click(selectors.cellAt(1, 1));
        assertActive(1, 1);

        await keys.ctrlEnd();
        assertActive(2, 2);

        await keys.ctrlEnd();
        assertActive(2, 2, `already on the last cell`);
      });
    });

    module('Apple+Left', function () {
      test('when focus is on the left side', async function () {
        await render(hbs`<Grid @isMac={{true}} />`);
        await click(selectors.tabbable);
        assertActive(0, 0);

        await keys.appleLeft();
        assertActive(0, 0, `can't go more left`);
      });

      test('when focus is on the right side', async function () {
        await render(hbs`<Grid @isMac={{true}} @columns={{3}} />`);
        await click(selectors.cellsInRow(0, ':last-child'));
        assertActive(2, 0);

        await keys.appleLeft();
        assertActive(0, 0);

        await keys.appleLeft();
        assertActive(0, 0, `can't go more left`);
      });
    });

    module('Apple+Right', function () {
      test('when focus is on the left side', async function () {
        await render(hbs`<Grid @isMac={{true}} @columns={{3}} />`);
        await click(selectors.tabbable);
        assertActive(0, 0);

        await keys.appleRight();
        assertActive(2, 0);

        await keys.appleRight();
        assertActive(2, 0, `can't go more right`);
      });

      test('when focus is on the right side', async function () {
        await render(hbs`<Grid @isMac={{true}} @columns={{3}} />`);
        await click(selectors.cellsInRow(0, ':last-child'));
        assertActive(2, 0);

        await keys.appleRight();
        assertActive(2, 0, `can't go right anymore`);
      });
    });

    module('Apple+Up', function () {
      test('with initial focus', async function () {
        await render(hbs`<Grid @isMac={{true}} />`);
        await click(selectors.tabbable);
        assertActive(0, 0);

        await keys.appleUp();
        assertActive(0);

        await keys.appleUp();
        assertActive(0, `can't go up anymore`);
      });

      test('when focus is at the top', async function () {
        await render(hbs`<Grid @isMac={{true}} />`);
        await click(selectors.firstHeaderCell);
        assertActive(0);

        await keys.appleUp();
        assertActive(0, `can't go up anymore`);
      });

      test('when focus is at the bottom', async function () {
        await render(hbs`<Grid @isMac={{true}} @rows={{3}} />`);
        await click(selectors.bottomLeft);
        assertActive(0, 2);

        await keys.appleUp();
        assertActive(0, 0);

        await keys.appleUp();
        assertActive(0);

        await keys.appleUp();
        assertActive(0, `can't go up anymore`);
      });
    });

    module('Apple+Down', function () {
      test('with initial focus', async function () {
        await render(hbs`<Grid @isMac={{true}} @rows={{3}} />`);
        await click(selectors.tabbable);
        assertActive(0, 0);

        await keys.appleDown();
        assertActive(0, 2);

        await keys.appleDown();
        assertActive(0, 2, `can't go down anymore`);
      });

      test('when focus is at the top', async function () {
        await render(hbs`<Grid @isMac={{true}} @rows={{3}} />`);
        await click(selectors.firstHeaderCell);
        assertActive(0);

        await keys.appleDown();
        assertActive(0, 2);

        await keys.appleDown();
        assertActive(0, 2, `can't go down anymore`);
      });

      test('when focus is at the bottom', async function () {
        await render(hbs`<Grid @isMac={{true}} @rows={{3}} />`);
        await click(selectors.bottomLeft);
        assertActive(0, 2);

        await keys.appleDown();
        assertActive(0, 2, `can't go down anymore`);
      });
    });
  });

  module('Nested Grids', function () {
    test('after expanding a row, pressing down focuses normally', async function (assert) {
      await render(hbs`<NestedGrid />`);
      await click('button');
      await keys.right();
      await keys.down();

      let rootGrid = find(selectors.grid);
      let expected = rootGrid?.querySelector(
        `${selectors.row}[id]:not([hidden]) > ${selectors.cell}`
      );

      assert.ok(expected);
      assert.equal(document.activeElement, expected);
      assert.equal(document.activeElement?.closest(selectors.grid), rootGrid);
    });

    skip('when focus in a nested grid, escape goes back to the last cell in the outer grid', async function () {
      // This test is skipped because testing it requires the <TAB> key be implemented in test-helpers
      await render(hbs`<NestedGrid />`);
      await click('button');
      await keys.right();
      // assert non-nested grid
      await keys.down();

      await keys.down();
      // assert in nested grid
      await keys.escape();
      // assert non-nested grid
    });

    test('down/up skips hidden rows', async function (assert) {
      await render(hbs`<NestedGrid />`);
      await click('button');
      await keys.right();
      await keys.down();
      await keys.down();

      let rootGrid = find(selectors.grid);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      let rows = selectors.rowsOf(rootGrid!).filter((row: Element) => !row.hasAttribute('hidden'));
      let expected = rows[rows.length - 1];

      assert.ok(expected);
      assert.equal(closestRow(document.activeElement), expected);
      assert.equal(document.activeElement?.closest(selectors.grid), rootGrid);

      let buttons = findAll('button');

      for (let button of buttons) {
        await click(button);
      }

      await keys.up();
      await keys.up();

      assert.equal(closestRow(document.activeElement), rows[0]);
      assert.equal(document.activeElement?.closest(selectors.grid), rootGrid);
    });
  });
});
