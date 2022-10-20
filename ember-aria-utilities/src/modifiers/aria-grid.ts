import { assert } from '@ember/debug';

import { modifier } from 'ember-modifier';

import { deFocus, focus, focusFirstFocusableWithin, focusSurroundGridOf } from './-private/focus';
import { prepareFirstCell, setTabTarget } from './-private/focus-intent';
import { ENTER, ESCAPE, F2 } from './-private/keys';
import { handleNavigation, NAV_KEYS } from './-private/navigation';
import { disableNav, enableNav, isNavDisabled, toggleNav } from './-private/navigation-state';
import { cellSelector, isCell, isNestedGrid } from './-private/node-selectors';

/**
 * Setup:
 *   all cells must be rendered with tabindex="-1"
 *   element {{aria-grid}} attaches to *must* have role="grid"
 *
 * {{aria-grid}} takes no arguments
 */
const gridData = modifier(
  (gridElement: HTMLElement, [isMac = navigator.appVersion.includes('Mac')]) => {
    assert(
      `{{aria-grid}} modifier may only be used on elements with role="grid"`,
      gridElement.getAttribute('role') === 'grid'
    );

    let mutationDestructor = setupMutationObserver(gridElement);
    let keyHandler = keyHandlerFor(gridElement, isMac as boolean);
    let clickHandler = clickHandlerFor(gridElement);

    gridElement.addEventListener('keydown', keyHandler);
    gridElement.addEventListener('click', clickHandler);

    return () => {
      mutationDestructor?.();
      gridElement.removeEventListener('keydown', keyHandler);
      gridElement.removeEventListener('click', clickHandler);
    };
  },
  { eager: false }
);

export default gridData;

/*************************************************
 * event handlers and supporting functions
 ************************************************/

// Grid -> MutationObserver

function setupMutationObserver(grid: HTMLElement) {
  // our modifier doesn't take any arguments that would require destroying the
  // mutation observer
  let observer = new MutationObserver((/* mutationList */) => {
    if (grid && document.body.contains(grid)) {
      prepareFirstCell(grid);
      installRowIndices(grid);
    }
  });

  // Start observing the target node for configured mutations
  observer.observe(grid, {
    childList: true,
    subtree: true, // needed for tables with thead/tbody
  });

  // Later, you can stop observing
  return () => observer?.disconnect();
}

function installRowIndices(grid: HTMLElement) {
  // TODO:
  //  CSS doesn't have a way to select rows that are not descendants of another row.
  //  For now, we have to use JS to simulate this behavior, but we should go back to CSS
  //  as soon as we are able.
  let allRows = grid.querySelectorAll('[role="row"], tr');
  let rows = [...allRows].filter((row) => row.closest('[role="grid"]') === grid);

  grid.setAttribute('aria-rowcount', `${rows.length}`);

  // aria-rowindex is 1-indexed
  rows.forEach((row, index) => row.setAttribute('aria-rowindex', `${index + 1}`));
}

function clickHandlerFor(gridElement: HTMLElement) {
  return (event: MouseEvent) => {
    let { target } = event;

    if (!(target instanceof HTMLElement)) return;
    if (!gridElement.contains(target)) return;

    let cell = isCell(target) ? target : target.closest(cellSelector);

    if (!cell) return;

    assert(`expected above cell to be focusable`, cell instanceof HTMLElement);

    setTabTarget(gridElement, cell);

    focus(cell);
  };
}

function keyHandlerFor(gridElement: HTMLElement, isMac: boolean) {
  return (event: KeyboardEvent) => {
    let active = document.activeElement;

    if (!active) return;
    if (!gridElement.contains(active)) return;

    // if we have nested tables, or nested keyboard nav, prevent wrapping event listeners
    // from handling these key presses
    event.stopPropagation();

    if (NAV_KEYS.includes(event.key)) {
      return handleNavigation(event, gridElement, active, isMac);
    }

    switch (event.code) {
      case ENTER:
        // TODO: if active is a focusable within a cell do not focus the cell
        //      also -- where is that happening?
        if (isCell(active)) {
          event.preventDefault();
          disableNav(gridElement);

          focusFirstFocusableWithin(active);
          deFocus(active);
        }

        return;
      case F2:
        return toggleNav(gridElement);
      case ESCAPE:
        if (isNavDisabled(gridElement)) {
          enableNav(gridElement);

          return;
        }

        if (isNestedGrid(gridElement)) {
          focusSurroundGridOf(gridElement);

          return;
        }

        return;

      default:
        // if (DEBUG) {
        //   // eslint-disable-next-line no-console
        //   console.debug(`Ignored key event`, event);
        // }
        // ignore?
        break;
    }
  };
}
