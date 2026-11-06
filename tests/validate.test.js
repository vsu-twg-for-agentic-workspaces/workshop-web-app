// Unit tests for assets/js/validate.js (the participant-side checks).
// Run:  npm run test:unit
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const V = require('../assets/js/validate.js');

const good = () => ({
  consent: true,
  full_name: 'Juan A. Dela Cruz',
  email: ' Juan.DelaCruz@VSU.edu.ph ',
  campus: 'VSU Main Campus',
  college_office: 'College of Sample Studies',
  position: 'Instructor I',
  faculty_or_staff: 'Faculty',
  prior_ai_use: 'Never',
});

test('valid registration passes and email is normalized', () => {
  const r = V.validateRegistration(good(), ['vsu.edu.ph']);
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.data.email, 'juan.delacruz@vsu.edu.ph');
});

test('each missing field gets its own message keyed by field name', () => {
  const r = V.validateRegistration({}, ['vsu.edu.ph']);
  assert.equal(r.ok, false);
  assert.deepEqual(Object.keys(r.errors).sort(), [
    'campus', 'college_office', 'consent', 'email', 'faculty_or_staff', 'full_name', 'position', 'prior_ai_use',
  ]);
});

test('consent must be exactly true', () => {
  assert.ok(V.validateRegistration({ ...good(), consent: 'true' }, []).errors.consent);
});

test('institutional domain enforced only when configured', () => {
  assert.ok(V.validateRegistration({ ...good(), email: 'a@gmail.com' }, ['vsu.edu.ph']).errors.email);
  assert.equal(V.validateRegistration({ ...good(), email: 'a@gmail.com' }, []).ok, true);
});

test('only official campus names are accepted (Brand Book §7)', () => {
  for (const c of V.CHOICES.CAMPUS) assert.equal(V.validateRegistration({ ...good(), campus: c }, []).ok, true);
  for (const bad of ['VSU-A', 'VSU Alangalang Campus', 'Satellite Campus', '']) {
    assert.ok(V.validateRegistration({ ...good(), campus: bad }, []).errors.campus, bad);
  }
});

test('campus list uses Brand Book names: no hyphens, no "Campus" suffix on component colleges', () => {
  assert.deepEqual(V.CHOICES.CAMPUS, ['VSU Main Campus', 'VSU Villaba', 'VSU Isabel', 'VSU Tolosa', 'VSU Alangalang']);
  for (const c of V.CHOICES.CAMPUS.slice(1)) {
    assert.doesNotMatch(c, /-|Campus$/);
  }
});

test('choices must come from the lists the back end accepts', () => {
  assert.ok(V.validateRegistration({ ...good(), faculty_or_staff: 'Student' }, []).errors.faculty_or_staff);
  assert.ok(V.validateRegistration({ ...good(), prior_ai_use: 'Daily' }, []).errors.prior_ai_use);
  assert.deepEqual(V.CHOICES.FACULTY_OR_STAFF, ['Faculty', 'Staff']);
  assert.deepEqual(V.CHOICES.PRIOR_AI_USE, ['Never', 'Tried', 'Regularly']);
});

test('text is cleaned and capped like the back end', () => {
  const r = V.validateRegistration({ ...good(), full_name: '  Ana\n\tMaría  ' + 'x'.repeat(300) }, []);
  assert.ok(r.data.full_name.startsWith('Ana María'));
  assert.equal(r.data.full_name.length, V.LIMITS.NAME_MAX);
});

test('the cleaned data has exactly the keys the back end expects', () => {
  const r = V.validateRegistration(good(), []);
  assert.deepEqual(Object.keys(r.data).sort(), [
    'campus', 'college_office', 'consent', 'email', 'faculty_or_staff', 'full_name', 'position', 'prior_ai_use',
  ]);
});

// ---------- Evaluation ----------

const goodEval = () => ({
  email: ' Juan.DelaCruz@vsu.edu.ph ',
  rating_content: '5', rating_pace: '4', rating_handouts_labs: '5', rating_facilitators: '5', rating_overall: '4',
  improve: 'More lab time', apply_areas: ['Work', 'Personal'], name_confirmed: true,
});

test('evaluation: valid input passes; ratings become numbers; email normalized', () => {
  const r = V.validateEvaluation(goodEval());
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.data.email, 'juan.delacruz@vsu.edu.ph');
  assert.equal(r.data.rating_pace, 4);
});

test('evaluation: every rating must be a whole number 1–5, each with its own message', () => {
  const r = V.validateEvaluation({ ...goodEval(), rating_content: '6', rating_pace: '', rating_overall: '3.5' });
  for (const k of ['rating_content', 'rating_pace', 'rating_overall']) assert.ok(r.errors[k], k);
  assert.ok(!r.errors.rating_facilitators);
});

test('evaluation: at least one application area, only allowed values kept', () => {
  assert.ok(V.validateEvaluation({ ...goodEval(), apply_areas: [] }).errors.apply_areas);
  assert.ok(V.validateEvaluation({ ...goodEval(), apply_areas: ['Hacking'] }).errors.apply_areas);
  assert.deepEqual(V.validateEvaluation({ ...goodEval(), apply_areas: ['Work', 'Hacking'] }).data.apply_areas, ['Work']);
});

test('evaluation: name confirmation required', () => {
  assert.ok(V.validateEvaluation({ ...goodEval(), name_confirmed: false }).errors.name_confirmed);
});

test('evaluation: "Other" needs its text; the text is dropped when Other is not ticked', () => {
  assert.ok(V.validateEvaluation({ ...goodEval(), apply_areas: ['Other'], apply_areas_other: ' ' }).errors.apply_areas_other);
  const ok = V.validateEvaluation({ ...goodEval(), apply_areas: ['Other'], apply_areas_other: ' Church  records ' });
  assert.equal(ok.ok, true, JSON.stringify(ok.errors));
  assert.equal(ok.data.apply_areas_other, 'Church records');
  assert.equal(V.validateEvaluation({ ...goodEval(), apply_areas_other: 'stray' }).data.apply_areas_other, '');
});

test('evaluation: lists match the back end (§11.4 Parts D–E)', () => {
  assert.deepEqual(V.RATINGS.map((r) => r.name), ['rating_content', 'rating_pace', 'rating_handouts_labs', 'rating_facilitators', 'rating_overall']);
  assert.deepEqual(V.CHOICES.APPLY_AREAS, ['Work', 'Profession', 'Hobby', 'Personal', 'Other']);
  assert.deepEqual(Object.keys(V.validateEvaluation(goodEval()).data).sort(), [
    'apply_areas', 'apply_areas_other', 'email', 'improve', 'name_confirmed',
    'rating_content', 'rating_facilitators', 'rating_handouts_labs', 'rating_overall', 'rating_pace',
  ]);
});
