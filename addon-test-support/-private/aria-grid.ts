import { assert } from '@ember/debug';
import { triggerKeyEvent } from '@ember/test-helpers';

import {
  DOWN,
  END,
  ENTER,
  ESCAPE,
  F2,
  HOME,
  LEFT,
  RIGHT,
  UP,
} from 'ember-aria-utilities/modifiers/-private/keys';

/**
 *  NOTE: nth-child is 1-indexed
 *        we like math / graphs, so we convert to 0-indexed
 */
const selectors = {
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
    return `${selectors.rowAt(n)} ${selectors.cell}${append}`;
  },

  /**
   * To account for nested grids
   */
  rowsOf(grid: Element) {
    let allRows = grid.querySelectorAll(selectors.row);

    return [...allRows].filter((row) => row.closest(selectors.grid) === grid);
  },

  rowAt(y?: number) {
    if (y === undefined) {
      return `${selectors.row}:first-child`;
    }

    // goal: (0, 0) is the first non-header cell
    // header is nth: 1 (we want it to be undefined)
    // first row is nth: 2 (we want it to be 0)
    return `${selectors.row}:nth-child(${y + 2})`;
  },

  cellAt(x: number, y?: number) {
    let row = selectors.rowAt(y);

    if (y === undefined) {
      return `${row} ${selectors.header}:nth-child(${x + 1})`;
    }

    return `${row} ${selectors.cell}:nth-child(${x + 1})`;
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
    let target = document.querySelector(`${root} ${parent} ${selectors.grid}`);

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
  selectors,
};
