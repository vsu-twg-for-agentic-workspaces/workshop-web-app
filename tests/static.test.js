// Static checks on the pages: accessibility basics, Brand Book rules,
// safe coding (no HTML injection), and nothing sensitive in this public repo.
// Run:  npm run test:static
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const pages = fs.readdirSync(root).filter((f) => f.endsWith('.html'));
const jsFiles = fs.readdirSync(path.join(root, 'assets/js')).map((f) => 'assets/js/' + f);

test('every page has lang, viewport, a title, a skip link and a main landmark', () => {
  for (const p of pages) {
    const h = read(p);
    assert.match(h, /<html lang="en">/, p);
    assert.match(h, /name="viewport"/, p);
    assert.match(h, /<title>[^<]+<\/title>/, p);
    assert.match(h, /class="skip-link" href="#main"/, p);
    assert.match(h, /<main id="main">/, p);
  }
});

test('every image has an alt attribute and width/height', () => {
  for (const p of pages) {
    for (const img of read(p).match(/<img\b[^>]*>/g) || []) {
      assert.match(img, /\balt="/, `${p}: ${img}`);
      assert.match(img, /\bwidth="\d+"/, `${p}: ${img}`);
      assert.match(img, /\bheight="\d+"/, `${p}: ${img}`);
    }
  }
});

test('Brand Book: the VSU logo keeps its real proportions (no stretching)', () => {
  const png = fs.readFileSync(path.join(root, 'assets/img/vsu-brand-logo-horizontal.png'));
  const ratio = png.readUInt32BE(16) / png.readUInt32BE(20);
  for (const p of pages) {
    const tag = (read(p).match(/<img[^>]*vsu-brand-logo-horizontal\.png[^>]*>/) || [])[0];
    assert.ok(tag, p + ' is missing the VSU brand logo');
    const w = Number(tag.match(/width="(\d+)"/)[1]);
    const h = Number(tag.match(/height="(\d+)"/)[1]);
    assert.ok(Math.abs(w / h - ratio) < 0.05, `${p}: logo ${w}x${h} distorts the ${ratio.toFixed(3)} ratio`);
  }
});

test('Brand Book: the VSU logo sits in the header (position of primacy) and appears before the TWG logo', () => {
  for (const p of pages) {
    const h = read(p);
    const header = h.slice(h.indexOf('<header'), h.indexOf('</header>'));
    assert.match(header, /vsu-brand-logo-horizontal\.png/, p);
    const twg = h.indexOf('vsu-twg-logo');
    if (twg !== -1) assert.ok(twg > h.indexOf('vsu-brand-logo-horizontal'), p);
  }
});

test('Brand Book: no VSU Seal, no logo filters or effects, brand fonts and colors in CSS', () => {
  const css = read('assets/css/styles.css');
  for (const p of pages) assert.doesNotMatch(read(p), /seal/i, p + ' uses the VSU Seal');
  assert.doesNotMatch(css, /\.brand-logo[^}]*(filter|box-shadow|transform|opacity)/, 'logo must be used unaltered');
  assert.match(css, /--font-heading: 'Montserrat'/);
  assert.match(css, /--font-body: 'Roboto'/);
  for (const hex of ['#17321A', '#146939', '#00954F', '#FDC530']) assert.ok(css.includes(hex), 'missing VSU color ' + hex);
});

test('Brand Book: gold and yellow are never used as text color', () => {
  const css = read('assets/css/styles.css');
  for (const rule of css.match(/[^{}]+\{[^}]*\}/g)) {
    if (/(^|[^-])color:\s*var\(--vsu-gold(-light)?\)/.test(rule)) {
      assert.match(rule, /event-band|eyebrow/, 'gold text is only allowed on the dark green band: ' + rule.trim().slice(0, 60));
    }
  }
});

test('all JavaScript parses', () => {
  for (const f of jsFiles) assert.doesNotThrow(() => new vm.Script(read(f), { filename: f }), f);
});

test('no HTML injection: scripts never write HTML strings into the page', () => {
  for (const f of jsFiles) {
    assert.doesNotMatch(read(f), /\.innerHTML\s*=|insertAdjacentHTML|document\.write|outerHTML\s*=/, f);
  }
});

test('every script and stylesheet a page loads exists; only Google Fonts is external', () => {
  for (const p of pages) {
    const h = read(p);
    for (const m of h.matchAll(/(?:src|href)="([^"#?]+\.(?:js|css|png|svg))"/g)) {
      assert.ok(fs.existsSync(path.join(root, m[1])), `${p} references missing ${m[1]}`);
    }
    for (const m of h.matchAll(/<script[^>]+src="(https?:[^"]+)"/g)) assert.fail(`${p} loads external script ${m[1]}`);
    for (const m of h.matchAll(/<link[^>]+href="(https?:[^"]+)"/g)) {
      assert.match(m[1], /^https:\/\/fonts\.(googleapis|gstatic)\.com/, p);
    }
  }
});

test('pages only link to pages that exist', () => {
  for (const p of pages) {
    for (const m of read(p).matchAll(/href="([a-z-]+\.html)"/g)) {
      assert.ok(pages.includes(m[1]), `${p} links to missing ${m[1]}`);
    }
  }
});

test('registration form fields match what the back end expects', () => {
  const h = read('register.html');
  const names = new Set([...h.matchAll(/name="([a-z_]+)"/g)].map((m) => m[1]));
  for (const f of ['consent', 'full_name', 'email', 'campus', 'college_office', 'position', 'faculty_or_staff', 'prior_ai_use', 'website']) {
    assert.ok(names.has(f), 'register.html missing field ' + f);
  }
  assert.match(h, /name="website" tabindex="-1"/, 'honeypot must be skipped by keyboard users');
});

test('registration asks only what training-design.md §11.4 allows (no birth date, address, ID)', () => {
  const h = read('register.html').toLowerCase();
  for (const banned of ['name="birth', 'name="address', 'name="id_number', 'name="phone', 'type="date"']) {
    assert.ok(!h.includes(banned), 'register.html must not ask for ' + banned);
  }
});

test('every field has an error slot and is described by it', () => {
  const h = read('register.html');
  for (const f of ['consent', 'full_name', 'email', 'campus', 'college_office', 'position', 'faculty_or_staff', 'prior_ai_use']) {
    assert.match(h, new RegExp(`id="${f}-error"`), f);
    assert.match(h, new RegExp(`aria-describedby="[^"]*${f}-error`), f);
  }
});

test('config: API_URL is empty (demo) or an Apps Script /exec URL', () => {
  const ctx = vm.createContext({ window: {} });
  vm.runInContext(read('assets/js/config.js'), ctx);
  const url = ctx.window.WORKSHOP_CONFIG.API_URL;
  assert.ok(url === '' || /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url), url);
});

test('public repo hygiene: no data files, keys or spreadsheets committed', () => {
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    if (['.git', 'node_modules'].includes(e.name)) return [];
    const p = path.join(d, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
  for (const f of walk(root)) {
    assert.doesNotMatch(f, /\.(csv|xlsx?|ods|json\.bak|pem|key)$/i, 'do not commit ' + f);
    if (/\.(html|js|css|md|json)$/.test(f)) {
      assert.doesNotMatch(fs.readFileSync(f, 'utf8'), /-----BEGIN [A-Z ]*PRIVATE KEY-----|AIza[0-9A-Za-z_-]{35}/, f);
    }
  }
});
