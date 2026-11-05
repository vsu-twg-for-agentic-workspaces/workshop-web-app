// Unit tests: which back end (test or live) the pages talk to.
// Run:  npm run test:unit
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { chooseEnvironment, eventIdFrom } = require('../assets/js/api.js');

const cfg = { API_URL: 'https://script.google.com/macros/s/LIVE/exec', TEST_API_URL: 'https://script.google.com/macros/s/TEST/exec' };
const site = (search = '') => ({ protocol: 'https:', hostname: 'vsu-twg-for-agentic-workspaces.github.io', search });

test('participants on the published site use LIVE', () => {
  assert.deepEqual(chooseEnvironment(cfg, site('?event=AW-2026-01')), { env: 'live', url: cfg.API_URL });
});

test('?env=test on the published site uses TEST', () => {
  assert.deepEqual(chooseEnvironment(cfg, site('?event=AW-2026-01&env=test')), { env: 'test', url: cfg.TEST_API_URL });
});

test('opening the files on your own computer uses TEST', () => {
  for (const loc of [
    { protocol: 'file:', hostname: '', search: '' },
    { protocol: 'http:', hostname: 'localhost', search: '' },
    { protocol: 'http:', hostname: '127.0.0.1', search: '' },
  ]) assert.equal(chooseEnvironment(cfg, loc).env, 'test', JSON.stringify(loc));
});

test('any other env value stays LIVE (no accidental switch)', () => {
  assert.equal(chooseEnvironment(cfg, site('?env=TEST')).env, 'live');
  assert.equal(chooseEnvironment(cfg, site('?env=dev')).env, 'live');
});

test('TEST never falls back to the LIVE URL: empty TEST_API_URL means preview mode', () => {
  assert.deepEqual(chooseEnvironment({ API_URL: cfg.API_URL, TEST_API_URL: '' }, site('?env=test')), { env: 'test', url: '' });
});

test('event codes are limited to safe characters', () => {
  assert.equal(eventIdFrom('?event=AW-2026-01'), 'AW-2026-01');
  assert.equal(eventIdFrom('?event=<script>'), '');
  assert.equal(eventIdFrom(''), '');
});
