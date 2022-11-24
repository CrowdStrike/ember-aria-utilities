import { assert } from '@ember/debug';
import { triggerKeyEvent } from '@ember/test-helpers';

import { DOWN, END, ENTER, ESCAPE, F2, HOME, LEFT, RIGHT, UP } from '../../modifiers/-private/keys';

/**
 *  NOTE: nth-child is 1-indexed
 *        we like math / graphs, so we convert to 0-indexed
 */
const gridSelectors = {
  tabbable: '[tabindex="0"]',
  untabbable: '[tabindex="-1"]',
  cell: '[role="cell"]',
  header: '[role="columnheader"]',
  row: '[role="row"]',
  grid: '[role="grid"]',

  firstHeaderCell: `[role="row"]:first-child [role="columnheader"]:first-child`,
  lastHeaderCell: `[role="row"]:first-child [role="columnheader"]:last-child`,
  firstCell: `[role="grid"] [role="cell"]:first-child`,
  bottomLeft: `[role="row"]:last-child [role="cell"]:first-child`,

  cellsInRow(n: number, append?: string) {
    return `${gridSelectors.rowAt(n)} ${gridSelectors.cell}${append}`;
  },

  /**
   * To account for nested grids
   */
  rowsOf(grid: Element) {
    let allRows = grid.querySelectorAll(gridSelectors.row);

    return [...allRows].filter((row) => row.closest(gridSelectors.grid) === grid);
  },

  rowAt(y?: number) {
    if (y === undefined) {
      return `${gridSelectors.row}:first-child`;
    }

    // goal: (0, 0) is the first non-header cell
    // header is nth: 1 (we want it to be undefined)
    // first row is nth: 2 (we want it to be 0)
    return `${gridSelectors.row}:nth-child(${y + 2})`;
  },

  cellAt(x: number, y?: number) {
    let row = gridSelectors.rowAt(y);

    if (y === undefined) {
      return `${row} ${gridSelectors.header}:nth-child(${x + 1})`;
    }

    return `${row} ${gridSelectors.cell}:nth-child(${x + 1})`;
  },
} as const;

const tableSelectors = {
  tabbable: '[tabindex="0"]',
  untabbable: '[tabindex="-1"]',
  cell: '[role="cell"]',
  header: 'th',
  row: 'tr',
  grid: '[role="grid"]',

  firstHeaderCell: `tr:first-child th:first-child`,
  lastHeaderCell: `tr:first-child th:last-child`,
  firstCell: `tobdy tr [role="cell"]:first-child, tbody tr td:first-child`,
  bottomLeft: `tbody tr:last-child [role="cell"]:first-child, tr:last-child td:first-child`,

  cellsInRow(n: number, append?: string) {
    return `${tableSelectors.rowAt(n)} ${tableSelectors.cell}${append}`;
  },

  /**
   * To account for nested grids
   */
  rowsOf(grid: Element) {
    let allRows = grid.querySelectorAll(tableSelectors.row);

    return [...allRows].filter((row) => row.closest(tableSelectors.grid) === grid);
  },

  rowAt(y?: number) {
    if (y === undefined) {
      return `thead ${tableSelectors.row}:first-child`;
    }

    // goal: (0, 0) is the first non-header cell
    // first row is nth: 1 (we want it to be 0)
    return `tbody ${tableSelectors.row}:nth-child(${y + 1})`;
  },

  cellAt(x: number, y?: number) {
    let row = tableSelectors.rowAt(y);

    if (y === undefined) {
      return `${row} ${tableSelectors.header}:nth-child(${x + 1})`;
    }

    return `${row} ${tableSelectors.cell}:nth-child(${x + 1})`;
  },
} as const;

const root = '#ember-testing';

function triggerable(key: string, options?: Parameters<typeof triggerKeyEvent>[3]) {
  /**
   * For use with other page-object patterns that may need a more specific scope than
   * the default root (for when multiple grids are rendered to a page)
   *
   */
  return (parent = '') => {
    let target = document.querySelector(`${root} ${parent} ${gridSelectors.grid}`);

    assert(`Target for ${key} not found`, target);

    return triggerKeyEvent(target, 'keydown', key, options);
  };
}

const keys = {
  /**
   * As it turns out, tab is complicated
   *   https://github.com/emberjs/ember-test-helpers/pull/771
   *
   *   NOTE: all usages of document.activeElement! are intentional
   *      we acknowledge that if activeElement is null, we've already goofed up and should not
   *      have been pressing a key
   */
  tab: triggerable('Tab'),
  left: triggerable(LEFT),
  down: triggerable(DOWN),
  up: triggerable(UP),
  right: triggerable(RIGHT),
  ctrlLeft: triggerable(LEFT, { ctrlKey: true }),
  ctrlDown: triggerable(DOWN, { ctrlKey: true }),
  ctrlUp: triggerable(UP, { ctrlKey: true }),
  ctrlRight: triggerable(RIGHT, { ctrlKey: true }),
  home: triggerable(HOME),
  end: triggerable(END),
  appleLeft: triggerable(LEFT, { metaKey: true }),
  appleRight: triggerable(RIGHT, { metaKey: true }),
  appleDown: triggerable(DOWN, { metaKey: true }),
  appleUp: triggerable(UP, { metaKey: true }),
  ctrlHome: triggerable(HOME, { ctrlKey: true }),
  ctrlEnd: triggerable(END, { ctrlKey: true }),
  enter: triggerable(ENTER),
  escape: triggerable(ESCAPE),
  f2: triggerable(F2),
} as const;

export const ariaGrid = {
  keys,
  gridSelectors,
  tableSelectors,
};
