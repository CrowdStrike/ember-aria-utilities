import { nonHeaderCell } from './node-selectors';

// Grid -> LastClicked
const clicks = new WeakMap<HTMLElement, HTMLElement>();

// make only the first cell focusable initially
export function prepareFirstCell(grid: HTMLElement) {
  let firstCell = grid.querySelector(nonHeaderCell);

  setTabTarget(grid, firstCell as HTMLElement);
}

export function setTabTarget(grid: HTMLElement, cell?: HTMLElement | null) {
  if (!cell) return;

  let previous = clicks.get(grid);

  if (previous === cell) return;

  previous?.setAttribute('tabindex', '-1');

  cell.setAttribute('tabindex', '0');

  clicks.set(grid, cell);
}
