export const cellRoles = ['cell', 'columnheader', 'rowheader'];
export const cellSelector = '[role=cell], [role=columnheader], [role="rowheader"]';
export const nonHeaderCell = '[role=cell], [role="rowheader"]';
export const focusables = `button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])`;

/**
 * NOTE: CSS Selectors do not yet have ancestor selectors (:has support pending)
 *       When :has lands, a lot of this file can get cleaned up.
 *
 *       For example:
 *       - you have a grid
 *         - but it's nested in a grid
 *         - when you arrow up / down
 *         - you should be able to skip the inner grid (you have to tab to it)
 */

export function closestRow(current?: Element | null) {
  if (!current) return;
  if (!isCell(current)) return;

  let group = current.closest('[role="row"], tr');

  if (!group) return;

  return group;
}

export function rowAbove(element?: Element | null) {
  let row = closestRow(element);

  if (!row) return;

  let grid = row.closest('[role="grid"]');

  if (!grid) return;

  /**
   * There is no way to, with a CSS selector, say:
   * "give me rows that are not descendants of a row"
   * so we have to use JS to filter them
   */
  let rows = grid.querySelectorAll('[role="row"]:not([hidden]), tr:not([hidden])');

  // rows is an iterable, so let's take advantage of the fact
  // we don't *have* to enumerate all rows
  for (let index = 0; index < rows.length; index++) {
    let current = rows[index];

    if (current === row) {
      let offset = 1;
      let above = rows[index - offset];

      if (!above) return;

      while (above.closest('[role="grid"]') !== grid) {
        offset += 1;
        above = rows[index - offset];
      }

      return above;
    }
  }

  return;
}

export function rowBelow(element?: Element | null) {
  let row = closestRow(element);

  if (!row) return;

  let grid = row.closest('[role="grid"]');

  if (!grid) return;

  /**
   * There is no way to, with a CSS selector, say:
   * "give me rows that are not descendants of a row"
   * so we have to use JS to filter them
   */
  let rows = grid.querySelectorAll('[role="row"]:not([hidden]),tr:not([hidden])');

  // rows is an iterable, so let's take advantage of the fact
  // we don't *have* to enumerate all rows
  for (let index = 0; index < rows.length; index++) {
    let current = rows[index];

    if (current === row) {
      let offset = 1;
      let below = rows[index + offset];

      if (!below) return;

      while (below.closest('[role="grid"]') !== grid) {
        offset += 1;
        below = rows[index + offset];
      }

      return below;
    }
  }

  return;
}

export function siblingsOf(cell: Element) {
  let row = closestRow(cell);

  if (!row) return;

  return cellsOfRow(row);
}

export function cellsOfRow(row: Element) {
  return [...row.querySelectorAll(cellSelector)].filter((cell) => closestRow(cell) === row);
}

export function isCell(element?: Element | null): boolean {
  if (!element) return false;

  let role = element.getAttribute('role');

  return cellRoles.includes(role as string);
}

export function containingGridOf(grid?: Element) {
  if (!grid) return;

  return grid.parentElement?.closest('[role="grid"]');
}

export function isNestedGrid(grid?: Element) {
  return Boolean(containingGridOf(grid));
}
