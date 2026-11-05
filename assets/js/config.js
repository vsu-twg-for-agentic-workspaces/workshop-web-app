/*
 * config.js — the only file to edit when deploying.
 *
 * API_URL: the Apps Script web app URL (Deploy → Manage deployments → Web app URL,
 * ends in /exec). It is public by design; the back end re-checks every submission.
 * Leave it empty to preview the pages without a back end (demo mode).
 */
window.WORKSHOP_CONFIG = {
  API_URL: '',
  ALLOWED_EMAIL_DOMAINS: ['vsu.edu.ph'],
  SUPPORT_EMAIL: '',
};
