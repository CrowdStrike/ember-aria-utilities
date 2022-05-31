'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function (defaults) {
  let app = new EmberApp(defaults, {
    // Add options here
  });

  const { maybeEmbroider } = require('@embroider/test-setup');

  return maybeEmbroider(app, {
    // Embroider does not know how to resolve local helpers
    // https://github.com/embroider-build/embroider/issues/894
    staticHelpers: false,

    skipBabel: [
      {
        package: 'qunit',
      },
    ],
    packageRules: [
      {
        package: 'test-app',
        helpers: {
          '{{this.doubled}}': { safeToIgnore: true },
          '{{this.guidFor}}': { safeToIgnore: true },
        },
        components: {
          '{{this.doubled}}': { safeToIgnore: true },
          '{{this.guidFor}}': { safeToIgnore: true },
          '{{grid}}': { safeToIgnore: true },
          '{{nested-grid}}': { safeToIgnore: true },
        },
      },
    ],
  });
};
