import Controller from '@ember/controller';
import { guidFor } from '@ember/object/internals';

export default class NestedController extends Controller {
  doubled = (num) => num * 2;
  mainRow = (index) => index * 2;
  expandedRow = (index) => index * 2 + 1;
  guidFor = (anything) => guidFor(anything);
  not = (value) => !value;
}
