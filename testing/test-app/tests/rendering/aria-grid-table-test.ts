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

import { ariaGrid } from 'ember-aria-utilities/test-support';

import { repeat, withDefault } from '../helpers';

const { keys, gridSelectors, tableSelectors } = ariaGrid;

const debugAssert: typeof assert = assert;

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
module('{{aria-grid}}: <Table /> tests', function (hooks) {
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

      if (document.activeElement?.tagName === 'TH') {
        QUnit.assert.dom(document.activeElement).hasTagName('th');
      } else {
        QUnit.assert.dom(document.activeElement).hasAttribute('role', 'columnheader');
      }

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

    let _grid = grid ?? find(tableSelectors.grid);

    assert(`No "${tableSelectors.grid}" found in the DOM`, _grid);

    let rows = tableSelectors.rowsOf(_grid);

    for (let row of rows) {
      QUnit.assert.dom(row).hasAttribute('aria-rowindex', `${index}`);
      index++;
    }
  }

  hooks.beforeEach(function () {
    this.owner.register('helper:with-default', withDefault);
    this.owner.register('helper:repeat', repeat);
  });

  hooks.afterEach(function () {
    resetOnerror();
  });

  test('role=grid is required', async function (assert) {
    assert.expect(1);

    setupOnerror((e: unknown) => {
      if (!(e instanceof Error)) {
        // Lint rule doesn't know how to handle arrow functions...
        // eslint-disable-next-line qunit/no-early-return
        return;
      }

      assert.strictEqual(
        e.message,
        `Assertion Failed: {{aria-grid}} modifier may only be used on elements with role="grid"`
      );
    });

    await render(hbs`<div {{aria-grid}}></div>`);
  });

  test('Only the first cell has tabindex=0', async function (assert) {
    await render(hbs`<Table />`);

    assert.dom(tableSelectors.tabbable).exists({ count: 1 });
  });

  test('Clicking a cell switches the tabindex=0 cell', async function (assert) {
    await render(hbs`<Table />`);

    let first = find(tableSelectors.tabbable);
    let others = findAll(tableSelectors.untabbable);

    debugAssert(`No untabbable elements found`, Array.isArray(others));

    let lastElement = others[others.length - 1];

    debugAssert(`Last untabbable element not available`, lastElement);

    await click(lastElement);

    let newTabTarget = find(tableSelectors.tabbable);

    assert.notEqual(first, newTabTarget);
  });

  module('ARIA', function () {
    test('row indices and row count are provided', async function (assert) {
      // 1: row count
      // 3: each row
      assert.expect(4);

      await render(hbs`<Table @rows={{2}} />`);

      assert.dom(tableSelectors.grid).hasAttribute('aria-rowcount', '3', 'one header + 2 rows');

      assertRowIndex(undefined);
    });

    test('rowcount / indices are updated when rows change', async function (assert) {
      // 1: row count
      // 1: row count update
      // 11: each row
      assert.expect(13);

      this.setProperties({ rows: 4 });

      await render(hbs`<Table @rows={{this.rows}} />`);

      assert.dom(tableSelectors.grid).hasAttribute('aria-rowcount', '5', 'one header + 4 rows');

      this.setProperties({ rows: 10 });

      await settled();

      assert.dom(tableSelectors.grid).hasAttribute('aria-rowcount', '11', 'one header + 10 rows');
      assertRowIndex(undefined);
    });

    test('rowcount / indices are updated when data is loaded asynchronously', async function (assert) {
      await render(
        hbs`<AsyncData @rows={{2}} as |rows|>
        <Table @rows={{rows}} /></AsyncData>`
      );

      assert.dom(tableSelectors.grid).hasAttribute('aria-rowcount', '3', 'one header + 2 rows');

      await render(
        hbs`<AsyncData @timeout={{3000}} @rows={{10}} as |rows|>
        <Table @rows={{rows}} /></AsyncData>`
      );

      await new Promise((resolve) => setTimeout(resolve, 3000));

      assert.dom(tableSelectors.grid).hasAttribute('aria-rowcount', '11', 'one header + 10 rows');
      assertRowIndex(undefined);
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
          <Table />
          <button id='after'>after</button>
        `);

        focus('#before');

        let first = find(gridSelectors.cell);

        assert.notEqual(document.activeElement, first);

        await keys.tab();
        // await triggerKeyEvent('#before', 'keydown', 'Tab');

        assert.strictEqual(document.activeElement, first);
      });

      skip('after clicking a cell, tabbing still exits the grid', async function (assert) {
        await render(hbs`
          <button id='before'>before</button>
          <Table />
          <button id='after'>after</button>
        `);

        let others = findAll(gridSelectors.untabbable);
        let last = others[others.length - 1];

        debugAssert(`Last untabbable not available`, last);

        await click(last);
        await keys.tab();

        assert.strictEqual(document.activeElement, last);
      });

      skip('with nested focusables', async function (assert) {
        assert.expect(0);
      });
    });

    module('Left', function () {
      test('when focus is on the left side', async function () {
        await render(hbs`<Table />`);
        await click(tableSelectors.tabbable);
        assertActive(0, 0);

        await keys.left();
        assertActive(0, 0, `can't go more left`);
      });

      test('when focus is on the right side', async function () {
        await render(hbs`<Table @columns={{3}} />`);
        await click(tableSelectors.cellsInRow(0, ':last-child'));
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
        await render(hbs`<Table />`);
        await click(tableSelectors.tabbable);
        assertActive(0, 0);

        await keys.ctrlLeft();
        assertActive(0, 0, `can't go more left`);
      });

      test('when focus is on the right side', async function () {
        await render(hbs`<Table @columns={{3}} />`);
        await click(tableSelectors.cellsInRow(0, ':last-child'));
        assertActive(2, 0);

        await keys.ctrlLeft();
        assertActive(1, 0);

        await keys.ctrlLeft();
        assertActive(0, 0, `can't go more left`);
      });
    });

    module('Right', function () {
      test('when focus is on the left side', async function () {
        await render(hbs`<Table @columns={{3}} />`);
        await click(tableSelectors.tabbable);
        assertActive(0, 0);

        await keys.right();
        assertActive(1, 0);

        await keys.right();
        assertActive(2, 0);

        await keys.right();
        assertActive(2, 0, `can't go more right`);
      });

      test('when focus is on the right side', async function () {
        await render(hbs`<Table @columns={{3}} />`);
        await click(tableSelectors.cellsInRow(0, ':last-child'));
        assertActive(2, 0);

        await keys.right();
        assertActive(2, 0, `can't go right anymore`);
      });
    });

    module('Ctrl+Right', function () {
      test('when focus is on the left side', async function () {
        await render(hbs`<Table @columns={{3}} />`);
        await click(tableSelectors.tabbable);
        assertActive(0, 0);

        await keys.ctrlRight();
        assertActive(1, 0);

        await keys.ctrlRight();
        assertActive(2, 0);

        await keys.ctrlRight();
        assertActive(2, 0, `can't go more right`);
      });

      test('when focus is on the right side', async function () {
        await render(hbs`<Table @columns={{3}} />`);
        await click(tableSelectors.cellsInRow(0, ':last-child'));
        assertActive(2, 0);

        await keys.ctrlRight();
        assertActive(2, 0, `can't go right anymore`);
      });
    });

    module('Up', function () {
      test('with initial focus', async function () {
        await render(hbs`<Table />`);
        await click(tableSelectors.tabbable);
        assertActive(0, 0);

        await keys.up();
        assertActive(0);

        await keys.up();
        assertActive(0, `can't go up anymore`);
      });

      test('when focus is at the top', async function () {
        await render(hbs`<Table />`);
        await click(tableSelectors.firstHeaderCell);
        assertActive(0);

        await keys.up();
        assertActive(0, `can't go up anymore`);
      });

      test('when focus is at the bottom', async function () {
        await render(hbs`<Table @rows={{3}} />`);
        await click(tableSelectors.bottomLeft);
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
        await render(hbs`<Table />`);
        await click(tableSelectors.tabbable);
        assertActive(0, 0);

        await keys.ctrlUp();
        assertActive(0);

        await keys.ctrlUp();
        assertActive(0, `can't go up anymore`);
      });

      test('when focus is at the top', async function () {
        await render(hbs`<Table />`);
        await click(tableSelectors.firstHeaderCell);
        assertActive(0);

        await keys.ctrlUp();
        assertActive(0, `can't go up anymore`);
      });

      test('when focus is at the bottom', async function () {
        await render(hbs`<Table @rows={{3}} />`);
        await click(tableSelectors.bottomLeft);
        assertActive(0, 2);

        await keys.ctrlUp();
        assertActive(0, 1);

        await keys.ctrlUp();
        assertActive(0, 0);

        await keys.ctrlUp();
        assertActive(0, `can't go up anymore`);
      });
    });

    module('Down', function () {
      test('with initial focus', async function () {
        await render(hbs`<Table />`);
        await click(tableSelectors.tabbable);
        assertActive(0, 0);

        await keys.down();
        assertActive(0, 1);

        await keys.down();
        assertActive(0, 1, `can't go down anymore`);
      });

      test('when focus is at the top', async function () {
        await render(hbs`<Table @rows={{3}} />`);
        await click(tableSelectors.firstHeaderCell);
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
        await render(hbs`<Table @rows={{3}} />`);
        await click(tableSelectors.bottomLeft);
        assertActive(0, 2);

        await keys.down();
        assertActive(0, 2, `can't go down anymore`);
      });
    });

    module('Ctrl+Down', function () {
      test('with initial focus', async function () {
        await render(hbs`<Table @rows={{3}} />`);
        await click(tableSelectors.tabbable);
        assertActive(0, 0);

        await keys.ctrlDown();
        assertActive(0, 1);

        await keys.ctrlDown();
        assertActive(0, 2);

        await keys.ctrlDown();
        assertActive(0, 2, `can't go down anymore`);
      });

      test('when focus is at the top', async function () {
        await render(hbs`<Table @rows={{3}} />`);
        await click(tableSelectors.firstHeaderCell);
        assertActive(0);

        await keys.ctrlDown();
        assertActive(0, 0);

        await keys.ctrlDown();
        assertActive(0, 1);

        await keys.ctrlDown();
        assertActive(0, 2);

        await keys.ctrlDown();
        assertActive(0, 2, `can't go down anymore`);
      });

      test('when focus is at the bottom', async function () {
        await render(hbs`<Table @rows={{3}} />`);
        await click(tableSelectors.bottomLeft);
        assertActive(0, 2);

        await keys.ctrlDown();
        assertActive(0, 2, `can't go down anymore`);
      });
    });

    module('Home', function () {
      test('with initial focus', async function () {
        await render(hbs`<Table />`);
        await click(tableSelectors.cellAt(0, 0));
        assertActive(0, 0);

        await keys.home();
        assertActive(0, 0);

        await keys.home();
        assertActive(0, 0, `already on the first cell of row`);
      });

      test('with focus on some other cell', async function () {
        await render(hbs`<Table @columns={{3}} />`);
        await click(tableSelectors.cellAt(1, 0));
        assertActive(1, 0);

        await keys.home();
        assertActive(0, 0);

        await keys.home();
        assertActive(0, 0, `already on the first cell of row`);
      });

      test('with focus in the header', async function () {
        await render(hbs`<Table />`);
        await click(tableSelectors.cellAt(1));
        assertActive(1);

        await keys.home();
        assertActive(0);

        await keys.home();
        assertActive(0, `already on the first cell of row`);
      });
    });

    module('Ctrl+Home', function () {
      test('with initial focus', async function () {
        await render(hbs`<Table />`);
        await click(tableSelectors.cellAt(0, 0));
        assertActive(0, 0);

        await keys.ctrlHome();
        assertActive(0, 0);

        await keys.ctrlHome();
        assertActive(0, 0, `already on the first cell`);
      });

      test('with focus on some other row', async function () {
        await render(hbs`<Table @rows={{3}} />`);
        await click(tableSelectors.cellAt(0, 2));
        assertActive(0, 2);

        await keys.ctrlHome();
        assertActive(0, 0);

        await keys.ctrlHome();
        assertActive(0, 0, `already on the first cell`);
      });

      test('with focus in the header', async function () {
        await render(hbs`<Table @rows={{3}} />`);
        await click(tableSelectors.cellAt(0));
        assertActive(0);

        await keys.ctrlHome();
        assertActive(0, 0);

        await keys.ctrlHome();
        assertActive(0, 0, `already on the first cell`);
      });
    });

    module('End', function () {
      test('with initial focus', async function () {
        await render(hbs`<Table @columns={{3}} @rows={{3}} />`);
        await click(tableSelectors.cellAt(0, 0));
        assertActive(0, 0);

        await keys.end();
        assertActive(2, 0);

        await keys.end();
        assertActive(2, 0, `already on the lest cell of row`);
      });

      test('with focus on some other cell', async function () {
        await render(hbs`<Table @columns={{3}} @rows={{3}} />`);
        await click(tableSelectors.cellAt(1, 1));
        assertActive(1, 1);

        await keys.end();
        assertActive(2, 1);

        await keys.end();
        assertActive(2, 1, `already on the lest cell of row`);
      });

      test('with focus in the header', async function () {
        await render(hbs`<Table @columns={{3}} />`);
        await click(tableSelectors.cellAt(1));
        assertActive(1);

        await keys.end();
        assertActive(2);

        await keys.end();
        assertActive(2, `already on the lest cell of row`);
      });
    });

    module('Ctrl+End', function () {
      test('with initial focus', async function () {
        await render(hbs`<Table @columns={{3}} @rows={{3}} />`);
        await click(tableSelectors.cellAt(0, 0));
        assertActive(0, 0);

        await keys.ctrlEnd();
        assertActive(2, 2);

        await keys.ctrlEnd();
        assertActive(2, 2, `already on the last cell`);
      });

      test('with focus on some other row', async function () {
        await render(hbs`<Table @columns={{3}} @rows={{3}} />`);
        await click(tableSelectors.cellAt(1, 1));
        assertActive(1, 1);

        await keys.ctrlEnd();
        assertActive(2, 2);

        await keys.ctrlEnd();
        assertActive(2, 2, `already on the last cell`);
      });

      test('with focus in the header', async function () {
        await render(hbs`<Table @columns={{3}} @rows={{3}} />`);
        await click(tableSelectors.cellAt(1));
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
        await render(hbs`<Table @isMac={{true}} @rows={{3}} />`);
        await click(tableSelectors.cellAt(0, 2));
        assertActive(0, 2);

        await keys.ctrlHome();
        assertActive(0, 0);

        await keys.ctrlHome();
        assertActive(0, 0, `already on the first cell`);
      });
    });

    module('Ctrl+End', function () {
      test('same behavior as without Ctrl', async function () {
        await render(hbs`<Table @isMac={{true}} @columns={{3}} @rows={{3}} />`);
        await click(tableSelectors.cellAt(1, 1));
        assertActive(1, 1);

        await keys.ctrlEnd();
        assertActive(2, 2);

        await keys.ctrlEnd();
        assertActive(2, 2, `already on the last cell`);
      });
    });

    module('Apple+Left', function () {
      test('when focus is on the left side', async function () {
        await render(hbs`<Table @isMac={{true}} />`);
        await click(tableSelectors.tabbable);
        assertActive(0, 0);

        await keys.appleLeft();
        assertActive(0, 0, `can't go more left`);
      });

      test('when focus is on the right side', async function () {
        await render(hbs`<Table @isMac={{true}} @columns={{3}} />`);
        await click(tableSelectors.cellsInRow(0, ':last-child'));
        assertActive(2, 0);

        await keys.appleLeft();
        assertActive(0, 0);

        await keys.appleLeft();
        assertActive(0, 0, `can't go more left`);
      });
    });

    module('Apple+Right', function () {
      test('when focus is on the left side', async function () {
        await render(hbs`<Table @isMac={{true}} @columns={{3}} />`);
        await click(tableSelectors.tabbable);
        assertActive(0, 0);

        await keys.appleRight();
        assertActive(2, 0);

        await keys.appleRight();
        assertActive(2, 0, `can't go more right`);
      });

      test('when focus is on the right side', async function () {
        await render(hbs`<Table @isMac={{true}} @columns={{3}} />`);
        await click(tableSelectors.cellsInRow(0, ':last-child'));
        assertActive(2, 0);

        await keys.appleRight();
        assertActive(2, 0, `can't go right anymore`);
      });
    });

    module('Apple+Up', function () {
      test('with initial focus', async function () {
        await render(hbs`<Table @isMac={{true}} />`);
        await click(tableSelectors.tabbable);
        assertActive(0, 0);

        await keys.appleUp();
        assertActive(0);

        await keys.appleUp();
        assertActive(0, `can't go up anymore`);
      });

      test('when focus is at the top', async function () {
        await render(hbs`<Table @isMac={{true}} />`);
        await click(tableSelectors.firstHeaderCell);
        assertActive(0);

        await keys.appleUp();
        assertActive(0, `can't go up anymore`);
      });

      test('when focus is at the bottom', async function () {
        await render(hbs`<Table @isMac={{true}} @rows={{3}} />`);
        await click(tableSelectors.bottomLeft);
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
        await render(hbs`<Table @isMac={{true}} @rows={{3}} />`);
        await click(tableSelectors.tabbable);
        assertActive(0, 0);

        await keys.appleDown();
        assertActive(0, 2);

        await keys.appleDown();
        assertActive(0, 2, `can't go down anymore`);
      });

      test('when focus is at the top', async function () {
        await render(hbs`<Table @isMac={{true}} @rows={{3}} />`);
        await click(tableSelectors.firstHeaderCell);
        assertActive(0);

        await keys.appleDown();
        assertActive(0, 2);

        await keys.appleDown();
        assertActive(0, 2, `can't go down anymore`);
      });

      test('when focus is at the bottom', async function () {
        await render(hbs`<Table @isMac={{true}} @rows={{3}} />`);
        await click(tableSelectors.bottomLeft);
        assertActive(0, 2);

        await keys.appleDown();
        assertActive(0, 2, `can't go down anymore`);
      });
    });
  });
});
