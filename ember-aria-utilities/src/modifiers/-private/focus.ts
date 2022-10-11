import { assert } from '@ember/debug';

import { isDevelopingApp, isTesting, macroCondition } from '@embroider/macros';

import { enableNav } from './navigation-state';
import {
  cellRoles,
  cellSelector,
  cellsOfRow,
  closestRow,
  containingGridOf,
  focusables,
  nonHeaderCell,
  rowAbove,
  rowBelow,
  siblingsOf,
} from './node-selectors';

type Nullable<T> = null | undefined | T;

// Grid -> Cell
const lastFocused = new WeakMap<Element, Element>();

/**
 * For debugging focus in testing, when focus / activeElement
 * can be finnicky depending on where you click in the DOM during a paused
 * test.
 *
 * There is no bound blur event that removes the data-has-intended-focus attribute
 * so inspecting the focus intent is possible without worrying about where focus
 * actually is -- though, in testing, real focus is still used, so activeElement
 * is still significant.
 *
 * NOTE: this attribute (data-debug-has-intended-focus),
 *       the extra queryAll and DOM mutations are not present in
 *       production builds
 */
export function focus(cell?: Element | null) {
  if (!(cell instanceof HTMLElement)) return;

  let grid = cell.closest('[role="grid"]');

  if (!grid) return;

  enableNav(grid);

  if (macroCondition(isDevelopingApp() || isTesting())) {
    assert(`cell cannot acquire focus outside of a grid`, grid);

    let debugFocusAttr = 'data-debug-has-intended-focus';
    let existingFocus = grid.querySelectorAll(`[${debugFocusAttr}]`);

    if (existingFocus.length) {
      for (let existing of existingFocus) {
        existing.removeAttribute(debugFocusAttr);
      }
    }

    cell.setAttribute(debugFocusAttr, 'true');
  }

  cell.focus();
  lastFocused.set(grid, cell);
}

export function deFocus(cell: Element) {
  cell.removeAttribute('tabindex');
}

export function focusSurroundGridOf(grid?: Element) {
  let outerGrid = containingGridOf(grid);

  if (!outerGrid) return;

  let last = lastFocused.get(outerGrid);

  if (last) {
    focus(last);

    return;
  }

  let focusable = outerGrid.querySelector('[tabindex="0"]');

  focus(focusable);
}

export function restoreTabIndexes(grid: Element) {
  let unfocusables = cellRoles.map((role) => `[role="${role}"]:not([tabindex])`).join(', ');
  let cells = grid.querySelectorAll(unfocusables);

  for (let cell of cells) {
    cell.setAttribute('tabindex', '-1');
  }
}

export function focusFirstFocusableWithin(cell: Element) {
  let focusable = cell.querySelector(focusables) as HTMLElement | undefined;

  if (!focusable) return;

  focusable.focus();
}

export function firstCellOfRow(current: Element) {
  let cells = siblingsOf(current);

  if (!cells) return;

  let first = cells[0];

  focus(first);
}

/**
 * If in the middle of a grid:
 * - first occurrence: first cell under the header
 * - if already on the first cell under the header, calling this again will take you in to the header
 */
export function firstCellOfColumn(current: Element) {
  let grid = current.closest('[role="grid"]');
  let row = closestRow(current);
  let cells = siblingsOf(current);

  if (!cells) return;
  if (!row) return;
  if (!grid) return;

  let index = cells.indexOf(current);
  let topRow: Nullable<Element> = closestRow(grid.querySelector('[role="row"] [role="cell"]'));

  let firstRow = grid.querySelector('[role="row"]');

  // We can't go first-er
  if (row === firstRow) return;

  if (row === topRow) {
    topRow = closestRow(grid.querySelector('[role="row"] [role="columnheader"]'));
  }

  if (!topRow) return;

  let topCells = topRow.querySelectorAll(cellSelector);
  let cell = topCells[index];

  focus(cell);
}

export function lastCellOfColumn(current: Element) {
  let grid = current.closest('[role="grid"]');
  let row = closestRow(current);
  let cells = siblingsOf(current);

  if (!cells) return;
  if (!row) return;
  if (!grid) return;

  let index = cells.indexOf(current);
  let bottomRow = grid.querySelector('[role="row"]:last-child');

  if (!bottomRow) return;

  let topCells = bottomRow.querySelectorAll(cellSelector);
  let cell = topCells[index];

  focus(cell);
}

export function lastCellOfRow(current: Element) {
  let cells = siblingsOf(current);

  if (!cells) return;

  let last = cells[cells.length - 1];

  focus(last);
}

export function firstCell(current: Element) {
  let grid = current.closest('[role="grid"]');

  if (!grid) return;

  let cell = grid.querySelector('[role="cell"]:first-child, [role=rowheader]:first-child');

  focus(cell);
}

export function lastCell(current: Element) {
  let grid = current.closest('[role="grid"]');

  if (!grid) return;

  let cells = grid.querySelectorAll(nonHeaderCell);

  if (!cells) return;

  let cell = cells[cells.length - 1];

  focus(cell);
}

/**
 * Find row 1 *above* the top visible row
 * or do nothing
 */
export function prevPage(current: Element) {
  let grid = current.closest('[role="grid"]');

  // eslint-disable-next-line no-console
  console.warn('not implemented yet', { grid });
}

/**
 * Find row 1 *below* the bottom visible row
 * or do nothing
 */
export function nextPage(current: Element) {
  let grid = current.closest('[role="grid"]');

  // eslint-disable-next-line no-console
  console.warn('not implemented yet', { grid });
}

export function upCell(current: Element) {
  let row = rowAbove(current);
  let cells = siblingsOf(current);

  if (!row) return;
  if (!cells) return;

  let currentCellIndex = cells.indexOf(current);
  let upCells = cellsOfRow(row);
  let upCell = upCells[currentCellIndex];

  focus(upCell || upCells[0]);
}

export function downCell(current: Element) {
  let row = rowBelow(current);
  let cells = siblingsOf(current);

  if (!row) return;
  if (!cells) return;

  let currentCellIndex = cells.indexOf(current);
  let downCells = cellsOfRow(row);
  let downCell = downCells[currentCellIndex];

  focus(downCell || downCells[0]);
}

export function nextCell(current: Element) {
  let cells = siblingsOf(current);

  if (!cells) return;

  let currentIndex = cells.indexOf(current);
  let nextCell = cells[currentIndex + 1];

  focus(nextCell);
}

export function prevCell(current: Element) {
  let cells = siblingsOf(current);

  if (!cells) return;

  let currentIndex = cells.indexOf(current);
  let prevCell = cells[currentIndex - 1];

  focus(prevCell);
}
