# ember-aria-utilities

[![CI](https://github.com/CrowdStrike/ember-aria/actions/workflows/ci.yml/badge.svg)](https://github.com/CrowdStrike/ember-aria/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/ember-aria-utilities.svg)](https://www.npmjs.com/package/ember-aria-utilities)

ARIA utilities for helping create some of the more complex ARIA design patterns. Follows https://www.w3.org/TR/wai-aria-practices/

## Compatibility

- ember-source v4.8 or above
- ember-auto-import v2 or above
- ember-cli classic build, embroider safe and optimized builds
- typescript v4.5.2 or above

For testing

- @ember/test-helpers v2.4 or above

## Installation

```
ember install ember-aria-utilities
```

## `{{aria-grid}}`

This library provides keyboard interaction for grids based on the [ARIA Grid design pattern](https://www.w3.org/TR/wai-aria-practices-1.1/#grid). This benefits people that interact with grids via keyboard or methods other than a mouse. This includes people such as power users and people that can’t use a mouse. The keyboard interactions make it easier to navigate large data sets.

### Interactive Example

This example allows you to try out the keyboard interactions as outlined in [§Keyboard Interaction](#keyboard-interaction).

<div role="grid" {{aria-grid}}>
<div role="row">
  <div tabindex="-1" role="columnheader">Name</div>
  <div tabindex="-1" role="columnheader">Function</div>
  <div tabindex="-1" role="columnheader">Username</div>
</div>
<div role="row">
  <div tabindex="-1" role="cell">Jenny Judova</div>
  <div tabindex="-1" role="cell">Engineer</div>
  <div tabindex="-1" role="cell">n/a</div>
</div>
<div role="row">
  <div tabindex="-1" role="cell">Preston Sego</div>
  <div tabindex="-1" role="cell">Software Artificer</div>
  <div tabindex="-1" role="cell">@nullvoxpopuli</div>
</div>
<div role="row">
  <div tabindex="-1" role="cell">Zoë Bijl</div>
  <div tabindex="-1" role="cell">Rambling Accessibility Engineer</div>
  <div tabindex="-1" role="cell">@zoe</div>
</div>
</div>

### Keyboard Interaction

<table class="docfy-keyboard-interaction-table">
<caption class="sr-only">Keyboard Interaction</caption>
<thead>
<tr>
  <th>Key</th>
  <th>Function</th>
</tr>
</thead>
<tr>
  <th scope="row"><kbd>Arrow Keys</kbd></th>
  <td>Moves focus to the adjacent cell. If there is no adjacent cell in the pressed direction focus doesn’t move.</td>
</tr>
<tr>
  <th scope="row"><kbd>Ctrl+Arrow Keys</kbd></th>
  <td>
  Moves focus to the outer most cell in the pressed direction. If there is no adjacent cell in the pressed direction focus doesn’t move.

Note: If focus is on a cell inside the “body” and Ctrl+Up Arrow is pressed. Focus will move move to the top most cell in the “body”. A second press is needed to move into the column headers.

Note: There is no such difference between a “data cell” and a “row header”.

  </td>
</tr>
<tr>
  <th scope="row"><kbd>Home</kbd></th>
  <td>Moves focus to the first cell in the row that contains focus.</td>
</tr>
<tr>
  <th scope="row"><kbd>End</kbd></th>
  <td>Moves focus to the last cell in the row that contains focus.</td>
</tr>
<tr>
  <th scope="row"><kbd>Ctrl+Home</kbd></th>
  <td>Moves focus to the first cell in the first row.</td>
</tr>
<tr>
  <th scope="row"><kbd>Ctr+End</kbd></th>
  <td>Moves focus to the last cell in the last row.</td>
</tr>
</table>

#### Future Support

Future updates will allow for selection of cells/rows. Also included is the following keyboard support.

<table class="docfy-keyboard-interaction-table">
<caption class="sr-only">Keyboard Interaction</caption>
<thead>
<tr>
  <th>Key</th>
  <th>Function</th>
</tr>
</thead>
<tr>
  <th scope="row"><kbd>PageUp</kbd></th>
  <td>Moves focus to the last cell in the last row.</td>
</tr>
<tr>
  <th scope="row"><kbd>PageDown</kbd></th>
  <td>Moves focus to the last cell in the last row.</td>
</tr>
</table>

##### Related links

- [APG: ARIA Grid keyboard navigation](https://w3c.github.io/aria-practices/#keyboard-interaction-for-data-grids)
- [APG: Editing and Navigating Inside a Cell](https://w3c.github.io/aria-practices/#gridNav_inside)

### How to apply

`{{aria-grid}}` provides you the keyboard interaction. The component it’s applied to will need to have all the appropriate ARIA roles, states, and properties as outlined in the [authoring practices](https://www.w3.org/TR/wai-aria-practices-1.1/#grid).

```hbs preview-template
<div role="grid" {{aria-grid}}>
  <div role="row">
    <div tabindex="-1" role="columnheader">Name</div>
    <div tabindex="-1" role="columnheader">Function</div>
    <div tabindex="-1" role="columnheader">Username</div>
  </div>
  <div role="row">
    <div tabindex="-1" role="cell">Jenny Judova</div>
    <div tabindex="-1" role="cell">Engineer</div>
    <div tabindex="-1" role="cell">n/a</div>
  </div>
  <div role="row">
    <div tabindex="-1" role="cell">Preston Sego</div>
    <div tabindex="-1" role="cell">Software Artificer</div>
    <div tabindex="-1" role="cell">@nullvoxpopuli</div>
  </div>
  <div role="row">
    <div tabindex="-1" role="cell">Zoë Bijl</div>
    <div tabindex="-1" role="cell">Rambling Accessibility Engineer</div>
    <div tabindex="-1" role="cell">@zoe</div>
  </div>
</div>
```

## Contributing

See the [Contributing](CONTRIBUTING.md) guide for details.

## License

This project is licensed under the [MIT License](LICENSE.md).
