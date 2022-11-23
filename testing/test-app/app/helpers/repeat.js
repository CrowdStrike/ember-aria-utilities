import { helper } from '@ember/component/helper';

export default helper(function repeat([times]) {
  return Array.from({ length: times }, (_, i) => i);
});
