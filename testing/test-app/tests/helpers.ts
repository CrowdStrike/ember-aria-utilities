import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { setComponentTemplate } from '@ember/component';
import { helper } from '@ember/component/helper';
import templateOnly from '@ember/component/template-only';
import { guidFor } from '@ember/object/internals';
import { hbs } from 'ember-cli-htmlbars';

import { Resource } from 'ember-modify-based-class-resource';

interface Signature {
  Positional: [unknown];
}

class Toggle extends Resource<Signature> {
  @tracked state: unknown = false;

  modify([nextState]: [unknown]) {
    this.state = nextState;
  }

  toggle = () => (this.state = !this.state);
}

export const repeat = helper(([times]: [number]) => Array.from({ length: times }, (_, i) => i));
export const withDefault = helper(([passthrough, fallback]) => passthrough ?? fallback);

const Cell = setComponentTemplate(
  hbs`
    <div role="cell" tabindex="-1" id="cell-{{@col}}x{{@row}}-of-{{@columns}}" data-position="({{@col}}, {{@row}})">
      ({{@col}}, {{@row}})
    </div>`,
  templateOnly()
);

export class Grid extends Component {
  Cell = Cell;
}

setComponentTemplate(
  hbs`
    <div {{aria-grid (with-default @isMac false)}} role="grid" ...attributes>
      <div role="row">
        {{#each (repeat (with-default @columns 2)) as |num|}}
          <div role="columnheader" tabindex="-1">{{num}}</div>
        {{/each}}
      </div>

      {{#each (repeat (with-default @rows 2)) as |row|}}
        <div role="row">
          {{#each (repeat (with-default @columns 2)) as |col|}}
            <this.Cell @col={{col}} @row={{row}} @columns={{@columns}} />
          {{/each}}
        </div>
      {{/each}}
    </div>
  `,
  Grid
);

export class NestedGrid extends Component {
  toggle = Toggle;
  guidFor = guidFor;
  Cell = Cell;
  Grid = Grid;

  thisGuid = guidFor(this);
  rowGuid = (row: number) => `${this.thisGuid}-row-${row}`;
  not = (x: unknown) => !x;
}
setComponentTemplate(
  hbs`
    <div {{aria-grid (with-default @isMac false)}} role="grid" ...attributes>
      <div role="row">
        <div role="columnheader" tabindex="-1">
          Expand
        </div>

        {{#each (repeat (with-default @columns 2)) as |num|}}
          <div role="columnheader" tabindex="-1">{{num}}</div>
        {{/each}}
      </div>

      {{#each (repeat (with-default @rows 2)) as |row|}}
        {{#let (this.rowGuid row) as |rowId|}}
          {{#let (this.toggle) as |t|}}
            <div role="row">
              <div role="cell" tabindex="-1">
                <button
                  type="button"
                  aria-expanded="{{t.state}}"
                  aria-controls="row-expand-{{rowId}}"
                  {{on "click" t.toggle}}
                >
                  Toggle Row
                </button>
              </div>


              {{#each (repeat (with-default @columns 2)) as |col|}}
                <this.Cell @col={{col}} @row={{row}} @columns={{@columns}} />
              {{/each}}
            </div>

            <div
              id="row-expand-{{rowId}}"
              role="row"
              hidden={{this.not t.state}}
            >
              {{#if t.state}}
                <div role="cell" aria-colspan="{{@columns.length}}">
                  <Grid @rows={{@rows}} @columns={{@columns}} @isMac={{@isMac}} />
                </div>
              {{/if}}
            </div>

          {{/let}}
        {{/let}}
      {{/each}}
    </div>
  `,
  NestedGrid
);
