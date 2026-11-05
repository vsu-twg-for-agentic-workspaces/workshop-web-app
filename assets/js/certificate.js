/*
 * certificate.js — "Check my certificate". Asks the back end to re-send an issued
 * certificate. The answer is the same for every email (registered or not), and the
 * certificate only ever goes to the registered address.
 */
(function () {
  'use strict';

  var V = window.WorkshopValidate;
  var page = window.WorkshopPage;
  var form = document.getElementById('cert-form');
  var currentEvent = null;

  function setEmailError(message) {
    document.getElementById('email-error').textContent = message || '';
    var input = document.getElementById('email');
    if (message) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
  }

  form.addEventListener('input', function () { setEmailError(''); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = V.normalizeEmail(document.getElementById('email').value);
    if (!V.isValidEmail(email)) {
      setEmailError('Enter the email you used to register.');
      document.getElementById('email').focus();
      return;
    }
    var btn = document.getElementById('submit-btn');
    btn.disabled = true;
    btn.textContent = 'Sending…';
    window.WorkshopApi.post({
      action: 'resend',
      event_id: currentEvent.event_id,
      email: email,
      website: document.getElementById('website').value,
    }).then(function (res) {
      if (res.ok) {
        form.hidden = true;
        page.setText('#done-message', res.message);
        var done = document.getElementById('done');
        done.hidden = false;
        done.focus();
      } else {
        var box = document.getElementById('form-errors');
        var list = box.querySelector('ul');
        list.textContent = '';
        (res.errors || ['Something went wrong. Please try again.']).forEach(function (m) {
          var li = document.createElement('li');
          li.textContent = m;
          list.appendChild(li);
        });
        box.hidden = false;
        box.focus();
      }
    }).finally(function () {
      btn.disabled = false;
      btn.textContent = 'Send my certificate';
    });
  });

  page.loadEvent().then(function (ev) { currentEvent = ev; });
})();
