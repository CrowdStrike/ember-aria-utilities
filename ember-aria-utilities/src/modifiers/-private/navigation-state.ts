// presence means disabled
const disabledGrids = new WeakSet<Element>();

export const toggleNav = (grid: Element) =>
  isNavDisabled(grid) ? enableNav(grid) : disableNav(grid);
export const isNavDisabled = (grid: Element) => disabledGrids.has(grid);
export const disableNav = (grid: Element) => disabledGrids.add(grid);
export const enableNav = (grid: Element) => disabledGrids.delete(grid);
