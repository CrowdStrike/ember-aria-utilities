import { helper } from '@ember/component/helper';

export default helper(function withDefault(passthrough, fallback) {
  return passthrough ?? fallback;
});
