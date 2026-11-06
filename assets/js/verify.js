/*
 * verify.js — "Verify a certificate". Confirms that a control number was really
 * issued. The answer shows only the certificate type, the workshop and the issue
 * date, never the holder's name or email. Works without a workshop code, and
 * accepts ?ref=<control number> so a printed link or QR code can fill it in.
 */
(function () {
  'use strict';

  var page = window.WorkshopPage;
  var api = window.WorkshopApi;
  var form = document.getElementById('verify-form');
  var input = document.getElementById('ref');
  var btn = document.getElementById('submit-btn');

  function clean(ref) {
    return String(ref || '').replace(/\s+/g, '').toUpperCase().slice(0, 60);
  }

  function setError(message) {
    document.getElementById('ref-error').textContent = message || '';
    if (message) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
  }

  function show(id) {
    ['result-ok', 'result-none'].forEach(function (x) { document.getElementById(x).hidden = x !== id; });
    var el = document.getElementById(id);
    el.focus();
  }

  function check(ref) {
    btn.disabled = true;
    btn.textContent = 'Checking…';
    return api.verify(ref).then(function (res) {
      if (res.ok && res.certificate) {
        page.setText('#r-ref', res.certificate.ref);
        page.setText('#r-type', res.certificate.label);
        page.setText('#r-workshop', res.certificate.workshop);
        page.setText('#r-date', res.certificate.issue_date);
        show('result-ok');
      } else {
        page.setText('#none-message', (res.errors && res.errors[0]) || 'No certificate with this control number was found.');
        show('result-none');
      }
    }).finally(function () {
      btn.disabled = false;
      btn.textContent = 'Verify';
    });
  }

  input.addEventListener('input', function () { setError(''); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ref = clean(input.value);
    if (ref.length < 5) {
      setError('Enter the control number printed on the certificate, e.g., TWG-AW-2026-C-001.');
      input.focus();
      return;
    }
    input.value = ref;
    check(ref);
  });

  if (api.isDemo()) document.getElementById('demo-banner').hidden = false;
  else if (api.env === 'test') document.getElementById('env-banner').hidden = false;
  page.finishLoading();

  var fromUrl = clean(new URLSearchParams(window.location.search).get('ref'));
  if (fromUrl) {
    input.value = fromUrl;
    check(fromUrl);
  }
})();
