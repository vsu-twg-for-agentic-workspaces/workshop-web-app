/*
 * certificate.js — "Check my certificate". Downloads the participant's unsigned
 * certificate PDF. The back end needs both the registered email and the full
 * name, and gives the same answer for every mismatch, so an email alone is not
 * enough to get someone else's certificate. Nothing is ever emailed.
 */
(function () {
  'use strict';

  var V = window.WorkshopValidate;
  var page = window.WorkshopPage;
  var form = document.getElementById('cert-form');
  var currentEvent = null;
  var lastUrl = null;

  function setFieldError(name, message) {
    document.getElementById(name + '-error').textContent = message || '';
    var input = document.getElementById(name);
    if (message) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
  }

  function showFormErrors(messages) {
    var box = document.getElementById('form-errors');
    var list = box.querySelector('ul');
    list.textContent = '';
    messages.forEach(function (m) {
      var li = document.createElement('li');
      li.textContent = m;
      list.appendChild(li);
    });
    box.hidden = false;
    box.focus();
  }

  /** base64 → PDF Blob URL (kept until the page closes or the next request). */
  function pdfUrl(base64) {
    var bin = atob(base64);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    if (lastUrl) URL.revokeObjectURL(lastUrl);
    lastUrl = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
    return lastUrl;
  }

  function showDone(res) {
    var cert = res.certificate;
    var download = document.getElementById('download-link');
    var print = document.getElementById('print-link');
    if (cert && cert.pdf_base64) {
      var url = pdfUrl(cert.pdf_base64);
      download.href = url;
      download.setAttribute('download', cert.filename || 'certificate.pdf');
      print.href = url;
      download.parentElement.hidden = false;
      print.parentElement.hidden = false;
      page.setText('#done-message', cert.label + ', control number ' + cert.ref + '.');
    } else {
      // Preview mode: there is no real PDF to show.
      download.parentElement.hidden = true;
      print.parentElement.hidden = true;
      page.setText('#done-message', res.message || 'Preview mode: nothing was looked up.');
    }
    form.hidden = true;
    var done = document.getElementById('done');
    done.hidden = false;
    done.focus();
  }

  form.addEventListener('input', function (e) {
    if (e.target.id === 'email' || e.target.id === 'full_name') setFieldError(e.target.id, '');
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    document.getElementById('form-errors').hidden = true;
    var email = V.normalizeEmail(document.getElementById('email').value);
    var fullName = V.cleanText(document.getElementById('full_name').value, V.LIMITS.NAME_MAX);
    var firstBad = null;
    if (!V.isValidEmail(email)) {
      setFieldError('email', 'Enter the email you used to register.');
      firstBad = firstBad || document.getElementById('email');
    }
    if (fullName.length < 3) {
      setFieldError('full_name', 'Enter your full name as you registered it.');
      firstBad = firstBad || document.getElementById('full_name');
    }
    if (firstBad) { firstBad.focus(); return; }

    var btn = document.getElementById('submit-btn');
    btn.disabled = true;
    btn.textContent = 'Looking up…';
    window.WorkshopApi.post({
      action: 'certificate',
      event_id: currentEvent.event_id,
      email: email,
      full_name: fullName,
      website: document.getElementById('website').value,
    }).then(function (res) {
      if (res.ok) showDone(res);
      else showFormErrors(res.errors || ['Something went wrong. Please try again.']);
    }).finally(function () {
      btn.disabled = false;
      btn.textContent = 'Get my certificate';
    });
  });

  page.loadEvent().then(function (ev) { currentEvent = ev; });
})();
