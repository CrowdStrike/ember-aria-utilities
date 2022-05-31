import {
  downCell,
  firstCell,
  firstCellOfColumn,
  firstCellOfRow,
  lastCell,
  lastCellOfColumn,
  lastCellOfRow,
  nextCell,
  nextPage,
  prevCell,
  prevPage,
  restoreTabIndexes,
  upCell,
} from './focus';
import { DOWN, END, HOME, LEFT, PAGEDOWN, PAGEUP, RIGHT, UP } from './keys';
import { isCell, nonHeaderCell } from './node-selectors';

export const NAV_KEYS = [LEFT, DOWN, UP, RIGHT, HOME, END, PAGEDOWN, PAGEUP];

// presence means disabled
const disabledGrids = new WeakSet<Element>();

export const toggleNav = (grid: Element) =>
  isNavDisabled(grid) ? enableNav(grid) : disableNav(grid);
export const isNavDisabled = (grid: Element) => disabledGrids.has(grid);
export const disableNav = (grid: Element) => disabledGrids.add(grid);
export const enableNav = (grid: Element) => disabledGrids.delete(grid);

export function handleNavigation(
  event: KeyboardEvent,
  gridElement: HTMLElement,
  active: Element,
  isMac: boolean
) {
  let isNavvable = !isNavDisabled(gridElement);

  if (!isNavvable) {
    return;
  }

  // prevent scrolling
  event.preventDefault();

  /**
   * Accounts for when we've focused a button or other focusable in the grid
   * as long as navigation is enabled, we should still be able to move around
   */
  if (!isCell(active)) {
    let maybeCell = active.closest(nonHeaderCell);

    if (maybeCell) {
      active = maybeCell;
    }
  }

  /**
   * There exist events / behaviors that will remove the tabindex from a cell
   * so that default browser behavior does not eagerly re-focus the cell, say, after
   * pressing a button with the keyboard's space/enter keys.
   */
  restoreTabIndexes(gridElement);

  switch (event.key) {
    case LEFT:
      if (isMac && event.metaKey) {
        return firstCellOfRow(active);
      }

      // On Mac, Ctrl+Arrow moves virtual desktop
      // (so Ctrl+Arrow is not safe on Mac)
      if (!isMac && event.ctrlKey) {
        return firstCellOfRow(active);
      }

      return prevCell(active);
    case DOWN:
      if (isMac && event.metaKey) {
        return lastCellOfColumn(active);
      }

      // On Mac, Ctrl+Arrow moves virtual desktop
      // (so Ctrl+Arrow is not safe on Mac)
      if (!isMac && event.ctrlKey) {
        return lastCellOfColumn(active);
      }

      return downCell(active);
    case UP:
      if (isMac && event.metaKey) {
        return firstCellOfColumn(active);
      }

      // On Mac, Ctrl+Arrow moves virtual desktop
      // (so Ctrl+Arrow is not safe on Mac)
      if (!isMac && event.ctrlKey) {
        return firstCellOfColumn(active);
      }

      return upCell(active);
    case RIGHT:
      if (isMac && event.metaKey) {
        return lastCellOfRow(active);
      }

      // On Mac, Ctrl+Arrow moves virtual desktop
      // (so Ctrl+Arrow is not safe on Mac)
      if (!isMac && event.ctrlKey) {
        return lastCellOfRow(active);
      }

      return nextCell(active);
    case HOME:
      if (event.ctrlKey) {
        return firstCell(active);
      }

      return firstCellOfRow(active);
    case END:
      if (event.ctrlKey) {
        return lastCell(active);
      }

      return lastCellOfRow(active);
    case PAGEUP:
      return prevPage(active);
    case PAGEDOWN:
      return nextPage(active);
  }
}
