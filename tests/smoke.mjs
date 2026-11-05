// Smoke test for the PUBLISHED site (GitHub Pages). Read-only.
//   node tests/smoke.mjs https://vsu-twg-for-agentic-workspaces.github.io/workshop-web-app/
// Without a URL it explains how to run and exits without failing.

const base = (process.argv[2] || process.env.SITE_URL || '').replace(/\/?$/, '/');
if (base === '/') {
  console.log('Smoke test skipped: pass the published site URL as the first argument or SITE_URL.');
  process.exit(0);
}

let failures = 0;
const check = async (name, fn) => {
  try { await fn(); console.log('✔', name); } catch (e) { failures++; console.log('✖', name, '→', e.message); }
};
const fetchOk = async (p, type) => {
  const r = await fetch(base + p);
  if (!r.ok) throw new Error(`${p}: HTTP ${r.status}`);
  if (type && !(r.headers.get('content-type') || '').includes(type)) throw new Error(`${p}: unexpected type ${r.headers.get('content-type')}`);
  return r.text();
};

for (const page of ['index.html', 'register.html']) {
  await check(`${page} is published`, async () => {
    const html = await fetchOk(page, 'text/html');
    if (!html.includes('vsu-brand-logo-horizontal.png')) throw new Error('VSU logo missing');
  });
}
for (const asset of ['assets/css/styles.css', 'assets/js/config.js', 'assets/js/api.js', 'assets/js/validate.js',
  'assets/js/common.js', 'assets/js/register.js', 'assets/img/vsu-brand-logo-horizontal.png', 'assets/img/vsu-twg-logo.svg']) {
  await check(`${asset} loads`, () => fetchOk(asset));
}
await check('config points to an Apps Script /exec URL (not demo mode)', async () => {
  const js = await fetchOk('assets/js/config.js');
  if (!/API_URL:\s*'https:\/\/script\.google\.com\/macros\/s\/[^']+\/exec'/.test(js)) throw new Error('API_URL is empty: site is in demo mode');
});

console.log(failures ? `\n${failures} smoke check(s) failed.` : '\nAll smoke checks passed.');
process.exit(failures ? 1 : 0);
