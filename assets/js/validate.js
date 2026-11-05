/*
 * validate.js — the same checks the Apps Script back end runs (web-app/apps-script/
 * Validation.gs in the workshop repo), so participants see problems before they
 * submit. The back end still re-checks everything; these are only a convenience.
 */
(function (root) {
  'use strict';

  var CHOICES = {
    CAMPUS: ['VSU Main Campus', 'VSU Villaba', 'VSU Isabel', 'VSU Tolosa', 'VSU Alangalang'],
    FACULTY_OR_STAFF: ['Faculty', 'Staff'],
    PRIOR_AI_USE: ['Never', 'Tried', 'Regularly'],
  };

  var LIMITS = { NAME_MAX: 120, TEXT_MAX: 200 };

  function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
  }

  function cleanText(value, max) {
    var s = String(value == null ? '' : value).replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();
    return s.length > max ? s.slice(0, max) : s;
  }

  function domainAllowed(email, allowedDomains) {
    if (!allowedDomains || !allowedDomains.length) return true;
    return allowedDomains.indexOf(email.split('@')[1] || '') !== -1;
  }

  /**
   * Returns { ok, errors: { field: message }, data } for the registration form.
   * Error keys match the form field names so each message shows under its field.
   */
  function validateRegistration(input, allowedDomains) {
    var p = input || {};
    var errors = {};
    var data = {
      email: normalizeEmail(p.email),
      full_name: cleanText(p.full_name, LIMITS.NAME_MAX),
      campus: cleanText(p.campus, LIMITS.TEXT_MAX),
      college_office: cleanText(p.college_office, LIMITS.TEXT_MAX),
      position: cleanText(p.position, LIMITS.TEXT_MAX),
      faculty_or_staff: cleanText(p.faculty_or_staff, 20),
      prior_ai_use: cleanText(p.prior_ai_use, 20),
      consent: p.consent === true,
    };

    if (!data.consent) errors.consent = 'Please agree to the privacy notice to continue.';
    if (data.full_name.length < 3) errors.full_name = 'Enter your full name as it should appear on your certificate.';
    if (!isValidEmail(data.email)) errors.email = 'Enter a valid email address, like juan.delacruz@vsu.edu.ph.';
    else if (!domainAllowed(data.email, allowedDomains)) errors.email = 'Use your institutional email address (' + allowedDomains.join(', ') + ').';
    if (CHOICES.CAMPUS.indexOf(data.campus) === -1) errors.campus = 'Choose your campus.';
    if (!data.college_office) errors.college_office = 'Enter your college or office.';
    if (!data.position) errors.position = 'Enter your position or designation.';
    if (CHOICES.FACULTY_OR_STAFF.indexOf(data.faculty_or_staff) === -1) errors.faculty_or_staff = 'Choose Faculty or Staff.';
    if (CHOICES.PRIOR_AI_USE.indexOf(data.prior_ai_use) === -1) errors.prior_ai_use = 'Choose one answer.';

    return { ok: Object.keys(errors).length === 0, errors: errors, data: data };
  }

  var api = {
    CHOICES: CHOICES,
    LIMITS: LIMITS,
    normalizeEmail: normalizeEmail,
    isValidEmail: isValidEmail,
    cleanText: cleanText,
    domainAllowed: domainAllowed,
    validateRegistration: validateRegistration,
  };

  root.WorkshopValidate = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : this);
