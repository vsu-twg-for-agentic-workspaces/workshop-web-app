/*
 * api.js — talks to the Apps Script back end.
 * POST bodies are sent as text/plain so the browser makes a "simple" request
 * (no CORS preflight), which Apps Script web apps accept.
 */
(function () {
  'use strict';

  var cfg = window.WORKSHOP_CONFIG || {};
  var DEMO_EVENT = {
    event_id: 'DEMO',
    title: 'Capacity Building in Using AI Agents and Workflows in the University',
    days_hours: '2 days (10 hours)',
    dates: 'Sample dates',
    venue: 'Sample venue',
    status: 'open',
  };

  function isDemo() {
    return !cfg.API_URL;
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
    var url = cfg.API_URL + '?action=event&event=' + encodeURIComponent(eventId || '');
    return withTimeout(fetch(url, { redirect: 'follow' }), 20000)
      .then(function (r) { return r.json(); })
      .catch(networkError);
  }

  function post(body) {
    if (isDemo()) {
      return new Promise(function (resolve) {
        setTimeout(function () {
          resolve({ ok: true, demo: true, message: 'Demo mode: nothing was saved. Set API_URL in assets/js/config.js to connect the back end.' });
        }, 600);
      });
    }
    return withTimeout(fetch(cfg.API_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
    }), 60000)
      .then(function (r) { return r.json(); })
      .catch(networkError);
  }

  function eventIdFromUrl() {
    var id = new URLSearchParams(window.location.search).get('event') || '';
    return /^[A-Za-z0-9-]{1,40}$/.test(id) ? id : '';
  }

  window.WorkshopApi = { getEvent: getEvent, post: post, isDemo: isDemo, eventIdFromUrl: eventIdFromUrl };
})();
