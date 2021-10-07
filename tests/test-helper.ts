import { currentURL, getSettledState, resetOnerror, setApplication } from '@ember/test-helpers';
import { getPendingWaiterState } from '@ember/test-waiters';
import * as QUnit from 'qunit';
import { setup } from 'qunit-dom';
import { start } from 'ember-qunit';

import Application from 'dummy/app';
import config from 'dummy/config/environment';

// Prevent tests from re-ordering on refresh
// (use seed query param to deliberately re-order)
QUnit.config.reorder = false;

// easy access debugging tools during a paused or stuck test
Object.assign(window, { getSettledState, currentURL, getPendingWaiterState });

// Allows us to freely setupOnerror without worrying about leaking state
QUnit.testDone(function () {
  resetOnerror();
});

setup(QUnit.assert);

setApplication(Application.create(config.APP));

start();
