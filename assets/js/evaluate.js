/*
 * evaluate.js — the Day 2 evaluation form. Submitting it makes the certificate
 * ready to download (the back end checks the participant is registered and marked present).
 */
(function () {
  'use strict';

  var V = window.WorkshopValidate;
  var page = window.WorkshopPage;
  var form = document.getElementById('eval-form');
  var currentEvent = null;

  // Build the five 1–5 rating rows from one list, so labels stay in step with validate.js.
  var host = document.getElementById('ratings');
  V.RATINGS.forEach(function (r) {
    var fs = document.createElement('fieldset');
    fs.className = 'rating';
    fs.setAttribute('aria-describedby', r.name + '-error');
    var legend = document.createElement('legend');
    legend.textContent = r.label;
    fs.appendChild(legend);
    var scale = document.createElement('div');
    scale.className = 'scale';
    for (var n = 1; n <= 5; n++) {
      var label = document.createElement('label');
      var input = document.createElement('input');
      input.type = 'radio';
      input.name = r.name;
      input.value = String(n);
      input.setAttribute('aria-label', r.label + ': ' + n + ' of 5');
      var num = document.createElement('span');
      num.textContent = String(n);
      label.appendChild(input);
      label.appendChild(num);
      scale.appendChild(label);
    }
    fs.appendChild(scale);
    var err = document.createElement('span');
    err.className = 'field-error';
    err.id = r.name + '-error';
    fs.appendChild(err);
    host.appendChild(fs);
  });

  function readForm() {
    var fd = new FormData(form);
    var data = {
      email: fd.get('email'),
      improve: fd.get('improve'),
      apply_areas: fd.getAll('apply_areas'),
      apply_areas_other: fd.get('apply_areas_other'),
      name_confirmed: document.getElementById('name_confirmed').checked,
      website: fd.get('website') || '',
    };
    V.RATINGS.forEach(function (r) { data[r.name] = fd.get(r.name); });
    return data;
  }

  function setFieldError(name, message) {
    var errEl = document.getElementById(name + '-error');
    if (errEl) errEl.textContent = message || '';
    form.querySelectorAll('[name="' + name + '"]').forEach(function (input) {
      if (message) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    });
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

  // "Other" shows its text box only when ticked.
  var otherBox = document.getElementById('apply_other');
  var otherField = document.getElementById('apply_areas_other-field');
  function syncOther() {
    otherField.hidden = !otherBox.checked;
    otherBox.setAttribute('aria-expanded', otherBox.checked ? 'true' : 'false');
    if (!otherBox.checked) setFieldError('apply_areas_other', '');
  }
  otherBox.addEventListener('change', function () {
    syncOther();
    if (otherBox.checked) document.getElementById('apply_areas_other').focus();
  });
  syncOther();

  form.addEventListener('change', function (e) {
    if (e.target.name) setFieldError(e.target.name, '');
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    document.getElementById('form-errors').hidden = true;
    var raw = readForm();
    var result = V.validateEvaluation(raw);
    var names = ['email'].concat(V.RATINGS.map(function (r) { return r.name; }), ['apply_areas', 'apply_areas_other', 'name_confirmed']);
    var firstBad = null;
    names.forEach(function (name) {
      setFieldError(name, result.errors[name]);
      if (result.errors[name] && !firstBad) firstBad = form.querySelector('[name="' + name + '"]');
    });
    if (firstBad) { firstBad.focus(); return; }

    var btn = document.getElementById('submit-btn');
    btn.disabled = true;
    btn.textContent = 'Submitting…';

    var body = Object.assign({ action: 'evaluate', event_id: currentEvent.event_id, website: raw.website }, result.data);
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
      btn.textContent = 'Submit evaluation';
    });
  });

  page.loadEvent().then(function (ev) {
    currentEvent = ev;
    if (ev && ev.status !== 'open') page.showPageError('The evaluation for this workshop is closed.');
  });
})();
