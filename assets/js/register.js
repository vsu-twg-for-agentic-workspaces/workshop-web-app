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

  /** 'open' when the workshop also accepts attendees from other organizations (#114). */
  function audience() {
    return currentEvent && currentEvent.audience === 'open' ? 'open' : 'vsu_only';
  }

  function isOther() {
    if (audience() !== 'open') return false;
    var picked = form.querySelector('input[name="affiliation"]:checked');
    return !!picked && picked.value === 'Other';
  }

  /** The fields each step checks. A VSU-only workshop asks exactly what it always has. */
  function stepFields(step) {
    if (step === 1) return ['consent'];
    if (step === 2) return (audience() === 'open' ? ['affiliation'] : []).concat(['full_name', 'email']);
    return isOther()
      ? ['organization', 'organization_type', 'college_office', 'position', 'prior_ai_use', 'laptop_os']
      : ['campus', 'college_office', 'position', 'faculty_or_staff', 'prior_ai_use', 'laptop_os'];
  }

  function fillSelect(id, names) {
    var select = document.getElementById(id);
    names.forEach(function (name) {
      var opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      select.appendChild(opt);
    });
  }

  // Campus list comes from the Brand Book's official names (validate.js).
  fillSelect('campus', V.CHOICES.CAMPUS);
  fillSelect('organization_type', V.CHOICES.ORGANIZATION_TYPE);

  // Labels, hints and placeholders for VSU attendees and for attendees from other organizations (#114).
  var WORDING = {
    vsu: {
      emailLabel: 'Institutional email',
      emailPlaceholder: 'juan.delacruz@vsu.edu.ph',
      officeLabel: 'Office',
      officeHint: 'e.g., Faculty of Natural and Mathematical Sciences, Department of Computer Science and Technology, or Office of the Director for Quality Assurance',
      officePlaceholder: 'Department of Computer Science and Technology',
      positionHint: 'e.g., Administrative Aide II, Department dDRC, Research Assistant, or Professor VI and Head, DPM',
      positionPlaceholder: 'Administrative Aide II',
    },
    other: {
      emailLabel: 'Email',
      emailPlaceholder: 'juan.delacruz@example.com',
      officeLabel: 'Office or unit',
      officeHint: 'e.g., City Planning and Development Office, Human Resource Management Office, or Records Section',
      officePlaceholder: 'City Planning and Development Office',
      positionHint: 'e.g., Administrative Officer II, Teacher III, Project Development Officer I, or Municipal Agriculturist',
      positionPlaceholder: 'Administrative Officer II',
    },
  };

  /** Shows the questions that fit the workshop's audience and the chosen affiliation. */
  function applyAudience() {
    var other = isOther();
    document.getElementById('affiliation-group').hidden = audience() !== 'open';
    form.querySelectorAll('[data-for="vsu"]').forEach(function (el) { el.hidden = other; });
    form.querySelectorAll('[data-for="other"]').forEach(function (el) { el.hidden = !other; });
    var w = other ? WORDING.other : WORDING.vsu;
    page.setText('#email-label', w.emailLabel);
    document.getElementById('email').setAttribute('placeholder', w.emailPlaceholder);
    page.setText('#college_office-label', w.officeLabel);
    page.setText('#college_office-hint', w.officeHint);
    document.getElementById('college_office').setAttribute('placeholder', w.officePlaceholder);
    page.setText('#position-hint', w.positionHint);
    document.getElementById('position').setAttribute('placeholder', w.positionPlaceholder);
  }

  if (cfg.SUPPORT_EMAIL) {
    page.setText('#support-contact', ' at ' + cfg.SUPPORT_EMAIL);
  }

  function readForm() {
    var fd = new FormData(form);
    return {
      consent: document.getElementById('consent').checked,
      affiliation: fd.get('affiliation') || '',
      organization: fd.get('organization'),
      organization_type: fd.get('organization_type'),
      full_name: fd.get('full_name'),
      email: fd.get('email'),
      campus: fd.get('campus'),
      college_office: fd.get('college_office'),
      position: fd.get('position'),
      faculty_or_staff: fd.get('faculty_or_staff') || '',
      prior_ai_use: fd.get('prior_ai_use') || '',
      laptop_os: fd.get('laptop_os') || '',
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
    var result = V.validateRegistration(readForm(), cfg.ALLOWED_EMAIL_DOMAINS || [], audience());
    var firstBad = null;
    stepFields(step).forEach(function (name) {
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
    if (e.target.name === 'affiliation') {
      applyAudience();
      setFieldError('email', ''); // the email rule depends on the affiliation
    }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!checkStep(3)) return;
    var all = V.validateRegistration(readForm(), cfg.ALLOWED_EMAIL_DOMAINS || [], audience());
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
    applyAudience();
    if (ev && ev.status !== 'open') {
      page.showPageError('Registration for this workshop is closed.');
    }
  });
})();
