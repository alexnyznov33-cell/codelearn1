// Regression checks for embedded courses. No dependencies required.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert/strict');
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../www/data/content.js'), 'utf8'), ctx);
const courses = ctx.window.COURSES;
assert.equal(courses.length, 8);
const ids = new Set();
for (const c of courses) for (const m of c.modules) for (const l of m.lessons) {
  assert(l.id && !ids.has(l.id), `Missing/duplicate lesson ID: ${l.id}`);
  ids.add(l.id);
}
for (const cid of ['arduino', 'esp32']) {
  const c = courses.find(c => c.id === cid);
  assert(c && c.lang === 'cpp');
  assert.equal(c.modules.length, 4);
  const lessons = c.modules.flatMap(m => m.lessons);
  assert.equal(lessons.length, 12);
  const types = new Set();
  for (const l of lessons) {
    assert(!l.soon && l.theory.includes('<pre>') && l.theory.includes('не компилирует'));
    assert.equal(l.practice.length, 5);
    assert(l.homework.task && l.homework.solution && l.homework.checklist.length);
    for (const ex of l.practice) {
      types.add(ex.type);
      assert(ex.q && ex.explain);
      if (ex.type === 'choice') assert(ex.answer >= 0 && ex.answer < ex.options.length);
      if (ex.type === 'fill') assert.equal(ex.answers.length, (ex.code.match(/___/g) || []).length);
      if (ex.type === 'bug') assert(ex.bugLine > 0 && ex.bugLine <= ex.code.trimEnd().split('\n').length && ex.fix);
      if (ex.type === 'output') assert.equal(typeof ex.answer, 'string');
      if (ex.type === 'order') assert(ex.lines.length >= 2);
    }
  }
  assert.equal(types.size, 5);
  console.log(`${c.title}: 12 lessons, 60 exercises, 12 homework tasks — OK`);
}
console.log('8 courses; unique lesson IDs; embedded content schema — OK');
