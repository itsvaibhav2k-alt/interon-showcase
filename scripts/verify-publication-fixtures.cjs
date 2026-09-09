// Offline current-tree fixture gate. Requires Node >=22.13; no DB, application, or network imports.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { stripTypeScriptTypes } = require('node:module');
const root = path.resolve(__dirname, '..');
const dir = path.join(root, 'apps/web/lib/mock-data');
function load(file, name) {
  const source = fs.readFileSync(path.join(dir, file + '.ts'), 'utf8');
  const js = stripTypeScriptTypes(source).replace('export const ' + name, 'const ' + name);
  return vm.runInNewContext(js + '\nJSON.stringify(' + name + ')', {}, { timeout: 1000 });
}
const students = JSON.parse(load('students', 'students'));
const staff = JSON.parse(load('staff', 'staff'));
const cases = JSON.parse(load('cases', 'cases'));
const tasks = JSON.parse(load('tasks', 'tasks'));
const audit = JSON.parse(load('audit', 'auditEvents'));
const words = 'One Two Three Four Five Six Seven Eight Nine Ten Eleven Twelve'.split(' ');
const expected = [12, 5, 14, 47, 67];
const groups = [students, staff, cases, tasks, audit];
groups.forEach((group, i) => {
  assert.equal(group.length, expected[i], 'fixture count');
  assert.equal(new Set(group.map(r => r.id)).size, group.length, 'unique fixture IDs');
  assert(group.every(r => /^synthetic-[a-z]+-\d{3}$/.test(r.id)), 'synthetic IDs');
});
students.forEach((s, i) => {
  assert(s.firstName === 'Student' && s.lastName === words[i], 'fictional student names');
  assert(s.preferredName === undefined || s.preferredName === 'Student', 'fictional preferred names');
  assert(s.bannerId === 'SYN' + String(i + 1).padStart(6, '0'), 'synthetic external IDs');
  assert(s.email === 'student.' + words[i].toLowerCase() + '@example.com', 'reserved emails');
  assert(s.ssnLast4 === '0000' && s.ssnMasked === '***-**-0000', 'placeholder SSN');
  assert(s.dob === '2000-01-01' && s.phoneMasked === '(***) ***-0100', 'placeholder birthdate/phone');
  assert(s.program === 'Example Program' && s.awards.every(a => a.amount === 1000), 'synthetic education/finance attributes');
  assert.equal(new Set(s.awards.map(a => a.kind)).size, s.awards.length, 'seed award unique constraint');
});
staff.forEach((s, i) => assert(s.name === 'Staff ' + words[i] && s.initials === 'S' + (i + 1), 'fictional staff'));
for (const c of cases) {
  assert(students.some(s => s.id === c.studentId), 'case student FK');
  assert(!c.assignedTo || staff.some(s => s.id === c.assignedTo), 'case staff FK');
  assert(['V1', 'V4', 'V5'].includes(c.group), 'supported case groups');
}
for (const t of tasks) {
  assert(cases.some(c => c.id === t.caseId), 'task case FK');
  assert(!t.notes || t.notes === 'Synthetic scenario note for demonstration.', 'synthetic task narrative');
}
for (const a of audit) {
  const c = cases.find(c => c.id === a.caseId);
  assert(c, 'audit case FK');
  if (a.actorRole === 'student') {
    const s = students.find(s => s.id === c.studentId);
    assert(a.actorName === s.firstName + ' ' + s.lastName, 'audit student actor');
  } else if (a.actorRole === 'system') {
    assert(a.actorName === 'System', 'system actor');
  } else {
    assert(staff.some(s => s.name === a.actorName && s.role === a.actorRole), 'exact staff actor resolution without seed fallback');
  }
  assert(!a.details || a.details === 'Synthetic audit detail for demonstration.', 'synthetic audit narrative');
}
for (const records of [cases, tasks, audit]) for (const r of records) {
  for (const key of ['createdAt','deadline','lastActionAt','requestedAt','dueAt','completedAt','timestamp']) {
    if (r[key]) assert(Number.isFinite(Date.parse(r[key])), 'valid fixture date');
  }
}
assert(cases.some(c => c.status === 'pending_student'), 'demo student selection remains actionable');
assert(staff.some(s => s.role === 'counselor') && staff.some(s => s.role === 'director'), 'demo staff roles');
// These two consumers must keep the same stable UUID namespace; do not execute the seed.
const namespace = p => fs.readFileSync(path.join(root, p), 'utf8').match(/INTERON_UUID_NAMESPACE = '([^']+)'/)[1];
assert(namespace('packages/db/src/seed.ts') === namespace('apps/web/lib/auth/users.ts'), 'auth/seed namespace consistency');
console.log(JSON.stringify({ result: 'PASS', students: students.length, staff: staff.length, cases: cases.length, tasks: tasks.length, auditEvents: audit.length, gates: ['fictional identities', 'reserved emails', 'synthetic personal attributes', 'unique IDs', 'foreign keys', 'exact audit actors', 'valid dates', 'demo roles', 'seed/auth namespace'] }, null, 2));
