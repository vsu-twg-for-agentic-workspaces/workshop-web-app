/*
 * config.js — the only file to edit when deploying.
 *
 * Two back ends, so testing never touches real participants:
 *   API_URL       the LIVE Apps Script web app URL (ends in /exec)
 *   TEST_API_URL  the TEST Apps Script web app URL (ends in /exec)
 *
 * The TEST back end is used automatically when the page is opened from your own
 * computer (file:// or localhost), or when the link ends in ?env=test.
 * Everyone else uses LIVE. If API_URL is empty, the live pages say the workshop
 * is not open yet and hide every form. If TEST_API_URL is empty, test pages run
 * in preview (demo) mode and save nothing.
 *
 * Both URLs are public by design; the back end re-checks every submission.
 */
window.WORKSHOP_CONFIG = {
  API_URL: '',
  TEST_API_URL: 'https://script.google.com/macros/s/AKfycbz7EPbx7bE18oNFhOvdZCRhxq6CqInrUI0MT_bgGbBp3OPEYa_2bgxE3RRLAwZT5abGgg/exec',
  ALLOWED_EMAIL_DOMAINS: ['vsu.edu.ph'],
  SUPPORT_EMAIL: '',
};
