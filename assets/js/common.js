/*
 * common.js — shared by every page: loads the workshop named in ?event= and
 * shows it in the green band. Text is always inserted with textContent, never
 * as HTML, so nothing from the server can run as code on the page.
 */
(function () {
  'use strict';

  function $(sel) { return document.querySelector(sel); }

  function setText(sel, value) {
    var el = $(sel);
    if (!el) return;
    el.textContent = value || '';
    // Blank workshop details are hidden so no stray " · " separators show.
    if (el.closest('.meta')) el.hidden = !value;
  }

  function showPageError(message) {
    var box = $('#page-error');
    if (!box) return;
    if ($('#event-title') && !$('#event-title').textContent.trim()) {
      setText('#event-title', 'Workshop not available');
      ['#event-dates', '#event-hours', '#event-venue'].forEach(function (s) { setText(s, ''); });
    }
    box.querySelector('p').textContent = message;
    box.hidden = false;
    document.querySelectorAll('[data-needs-event]').forEach(function (el) { el.hidden = true; });
  }

  /** Hide the full-page loader and show the page (called once, success or failure). */
  function finishLoading() {
    document.body.classList.remove('is-loading');
    var loader = $('#page-loader');
    if (loader) loader.setAttribute('aria-hidden', 'true');
  }

  /** Resolves with the event object, or null after showing an error. Always ends the loader. */
  function loadEvent() {
    return fetchEvent().then(function (ev) {
      finishLoading();
      return ev;
    }, function (err) {
      showPageError('Something went wrong while loading. Please refresh the page or see a facilitator.');
      finishLoading();
      return null;
    });
  }

  function fetchEvent() {
    var id = window.WorkshopApi.eventIdFromUrl();
    if (!id && !window.WorkshopApi.isDemo()) {
      showPageError('This link is missing the workshop code. Please use the link or QR code from the facilitators.');
      return Promise.resolve(null);
    }
    return window.WorkshopApi.getEvent(id).then(function (res) {
      if (!res.ok) {
        showPageError((res.errors && res.errors[0]) || 'Workshop not found.');
        return null;
      }
      var ev = res.event;
      setText('#event-title', ev.title);
      setText('#event-dates', ev.dates);
      setText('#event-hours', ev.days_hours);
      setText('#event-venue', ev.venue);
      document.title = document.title.replace(/ — .*$/, '') + ' — ' + ev.title;
      if (res.demo && $('#demo-banner')) $('#demo-banner').hidden = false;
      else if (window.WorkshopApi.env === 'test' && $('#env-banner')) $('#env-banner').hidden = false;
      var keepTest = new URLSearchParams(window.location.search).get('env') === 'test';
      document.querySelectorAll('a[data-keep-event]').forEach(function (a) {
        a.href = a.getAttribute('href').split('?')[0] + '?event=' + encodeURIComponent(ev.event_id) + (keepTest ? '&env=test' : '');
      });
      return ev;
    });
  }

  window.WorkshopPage = { $: $, setText: setText, loadEvent: loadEvent, showPageError: showPageError, finishLoading: finishLoading };
})();
