/*
 * config.js — the only file to edit when deploying.
 *
 * Two back ends, so testing never touches real participants:
 *   API_URL       the LIVE Apps Script web app URL (ends in /exec)
 *   TEST_API_URL  the TEST Apps Script web app URL (ends in /exec)
 *
 * The TEST back end is used automatically when the page is opened from your own
 * computer (file:// or localhost), or when the link ends in ?env=test.
 * Everyone else uses LIVE. If the chosen URL is empty, the pages run in preview
 * (demo) mode and save nothing.
 *
 * Both URLs are public by design; the back end re-checks every submission.
 */
window.WORKSHOP_CONFIG = {
  API_URL: '',
  TEST_API_URL: '',
  ALLOWED_EMAIL_DOMAINS: ['vsu.edu.ph'],
  SUPPORT_EMAIL: '',
};
