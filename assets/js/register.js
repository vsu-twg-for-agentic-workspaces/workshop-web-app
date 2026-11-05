/*
 * register.js — the three-step registration form.
 * Each step is checked before moving on; the back end re-checks everything.
 */
(function () {
  'use strict';

  var V = window.WorkshopValidate;
  var cfg = window.WORKSHOP_CONFIG || {};
  var page = window.WorkshopPage;
  var form = document.getElementById('reg-form');
  var currentEvent = null;

  var STEP_FIELDS = {
    1: ['consent'],
    2: ['full_name', 'email'],
    3: ['campus', 'college_office', 'position', 'faculty_or_staff', 'prior_ai_use'],
  };

  // Campus list comes from the Brand Book's official names (validate.js).
  var campus = document.getElementById('campus');
  V.CHOICES.CAMPUS.forEach(function (name) {
    var opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    campus.appendChild(opt);
  });

  if (cfg.SUPPORT_EMAIL) {
    page.setText('#support-contact', ' at ' + cfg.SUPPORT_EMAIL);
  }

  function readForm() {
    var fd = new FormData(form);
    return {
      consent: document.getElementById('consent').checked,
      full_name: fd.get('full_name'),
      email: fd.get('email'),
      campus: fd.get('campus'),
      college_office: fd.get('college_office'),
      position: fd.get('position'),
      faculty_or_staff: fd.get('faculty_or_staff') || '',
      prior_ai_use: fd.get('prior_ai_use') || '',
      website: fd.get('website') || '',
    };
  }

  function setFieldError(name, message) {
    var errEl = document.getElementById(name + '-error');
    if (errEl) errEl.textContent = message || '';
    form.querySelectorAll('[name="' + name + '"]').forEach(function (input) {
      if (message) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    });
  }

  /** Shows errors for one step's fields; returns true if the step is valid. */
  function checkStep(step) {
    var result = V.validateRegistration(readForm(), cfg.ALLOWED_EMAIL_DOMAINS || []);
    var firstBad = null;
    STEP_FIELDS[step].forEach(function (name) {
      var msg = result.errors[name];
      setFieldError(name, msg);
      if (msg && !firstBad) firstBad = form.querySelector('[name="' + name + '"]');
    });
    if (firstBad) firstBad.focus();
    return !firstBad;
  }

  function showStep(step) {
    form.querySelectorAll('[data-step]').forEach(function (sec) {
      sec.hidden = sec.getAttribute('data-step') !== String(step);
    });
    form.querySelectorAll('[data-step-label]').forEach(function (li) {
      var n = Number(li.getAttribute('data-step-label'));
      if (n === step) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
      li.classList.toggle('done', n < step);
    });
    hideFormErrors();
    var heading = form.querySelector('[data-step="' + step + '"] h2');
    if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus(); }
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

  function hideFormErrors() {
    document.getElementById('form-errors').hidden = true;
  }

  form.addEventListener('click', function (e) {
    var next = e.target.closest('[data-next]');
    var back = e.target.closest('[data-back]');
    if (next) {
      var target = Number(next.getAttribute('data-next'));
      if (checkStep(target - 1)) showStep(target);
    } else if (back) {
      showStep(Number(back.getAttribute('data-back')));
    }
  });

  // Clear a field's error as soon as the participant fixes it.
  form.addEventListener('change', function (e) {
    if (e.target.name) setFieldError(e.target.name, '');
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!checkStep(3)) return;
    var all = V.validateRegistration(readForm(), cfg.ALLOWED_EMAIL_DOMAINS || []);
    if (!all.ok) { // e.g., an earlier step was changed
      showFormErrors(Object.keys(all.errors).map(function (k) { return all.errors[k]; }));
      return;
    }

    var btn = document.getElementById('submit-btn');
    btn.disabled = true;
    btn.textContent = 'Registering…';

    var body = Object.assign({ action: 'register', event_id: currentEvent.event_id, website: readForm().website }, all.data);
    window.WorkshopApi.post(body).then(function (res) {
      if (res.ok) {
        form.hidden = true;
        page.setText('#done-message', res.message);
        var done = document.getElementById('done');
        done.hidden = false;
        done.focus();
        window.scrollTo(0, 0);
      } else {
        showFormErrors(res.errors || ['Something went wrong. Please try again.']);
      }
    }).finally(function () {
      btn.disabled = false;
      btn.textContent = 'Register';
    });
  });

  page.loadEvent().then(function (ev) {
    currentEvent = ev;
    if (ev && ev.status !== 'open') {
      page.showPageError('Registration for this workshop is closed.');
    }
  });
})();
