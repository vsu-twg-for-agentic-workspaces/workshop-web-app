/*
 * api.js — talks to the Apps Script back end.
 * POST bodies are sent as text/plain so the browser makes a "simple" request
 * (no CORS preflight), which Apps Script web apps accept.
 */
(function (root) {
  'use strict';

  /**
   * Decide which back end to use. Pure function, so it can be unit-tested.
   * loc: { protocol, hostname, search }. Returns { env: 'test'|'live', url }.
   */
  function chooseEnvironment(cfg, loc) {
    cfg = cfg || {};
    var params = new URLSearchParams(loc.search || '');
    var local = loc.protocol === 'file:' || loc.hostname === 'localhost' || loc.hostname === '127.0.0.1';
    var wantsTest = params.get('env') === 'test' || local;
    return wantsTest
      ? { env: 'test', url: cfg.TEST_API_URL || '' }
      : { env: 'live', url: cfg.API_URL || '' };
  }

  function eventIdFrom(search) {
    var id = new URLSearchParams(search || '').get('event') || '';
    return /^[A-Za-z0-9-]{1,40}$/.test(id) ? id : '';
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { chooseEnvironment: chooseEnvironment, eventIdFrom: eventIdFrom };
  }
  if (typeof window === 'undefined') return;

  var cfg = window.WORKSHOP_CONFIG || {};
  var target = chooseEnvironment(cfg, window.location);
  var DEMO_EVENT = {
    event_id: 'DEMO',
    title: 'Capacity Building in Using AI Agents and Workflows in the University',
    days_hours: '2 days (10 hours)',
    dates: 'Sample dates',
    venue: 'Sample venue',
    status: 'open',
  };

  function isDemo() {
    return !target.url;
  }

  function withTimeout(promise, ms) {
    return Promise.race([
      promise,
      new Promise(function (_, reject) {
        setTimeout(function () { reject(new Error('timeout')); }, ms);
      }),
    ]);
  }

  function networkError() {
    return { ok: false, errors: ['We could not reach the server. Check your internet connection and try again.'] };
  }

  function getEvent(eventId) {
    if (isDemo()) return Promise.resolve({ ok: true, event: Object.assign({}, DEMO_EVENT, { event_id: eventId || 'DEMO' }), demo: true });
    var url = target.url + '?action=event&event=' + encodeURIComponent(eventId || '');
    return withTimeout(fetch(url, { redirect: 'follow' }), 20000)
      .then(function (r) { return r.json(); })
      .catch(networkError);
  }

  function post(body) {
    if (isDemo()) {
      return new Promise(function (resolve) {
        setTimeout(function () {
          resolve({ ok: true, demo: true, message: 'Preview mode: nothing was saved.' });
        }, 600);
      });
    }
    return withTimeout(fetch(target.url, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
    }), 60000)
      .then(function (r) { return r.json(); })
      .catch(networkError);
  }

  root.WorkshopApi = {
    env: target.env,
    getEvent: getEvent,
    post: post,
    isDemo: isDemo,
    eventIdFromUrl: function () { return eventIdFrom(window.location.search); },
  };
})(typeof window !== 'undefined' ? window : this);
