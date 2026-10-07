// Собирает content/*.yaml -> www/data/content.js
// Запуск: npm run content
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const MarkdownIt = require('markdown-it');
const md = new MarkdownIt({ html: false, linkify: true, typographer: true });

const root = path.join(__dirname, '..');
const dir = path.join(root, 'content');
const order = ['python', 'csharp', 'cpp', 'java', 'javascript', 'onec', 'arduino', 'esp32'];
const files = fs.readdirSync(dir).filter(f => f.endsWith('.yaml'));
const key = f => f.split(/[.-]/)[0];
files.sort((a, b) => order.indexOf(key(a)) - order.indexOf(key(b)) || (a.includes('-') - b.includes('-')) || a.localeCompare(b));

const courses = {};
const errors = [];
const r = s => (s ? md.render(String(s)) : '');
const ri = s => (s ? md.renderInline(String(s)) : '');

function checkEx(ex, where) {
  const t = ex.type;
  const need = (c, msg) => { if (!c) errors.push(`${where}: ${msg}`); };
  need(ex.q, 'нет q');
  if (t === 'choice') {
    need(Array.isArray(ex.options) && ex.options.length >= 2, 'options');
    const a = Array.isArray(ex.answer) ? ex.answer : [ex.answer];
    a.forEach(i => need(Number.isInteger(i) && i >= 0 && i < (ex.options || []).length, 'answer вне диапазона'));
  } else if (t === 'output') {
    need(ex.answer !== undefined, 'нет answer');
  } else if (t === 'fill') {
    const blanks = (String(ex.code || '').match(/___/g) || []).length;
    need(blanks > 0, 'нет ___ в code');
    need(Array.isArray(ex.answers) && ex.answers.length === blanks, `answers (${(ex.answers||[]).length}) != blanks (${blanks})`);
  } else if (t === 'order') {
    need(Array.isArray(ex.lines) && ex.lines.length >= 2, 'lines');
  } else if (t === 'bug') {
    const n = String(ex.code || '').replace(/\n$/, '').split('\n').length;
    need(Number.isInteger(ex.bugLine) && ex.bugLine >= 1 && ex.bugLine <= n, 'bugLine вне диапазона');
  } else errors.push(`${where}: неизвестный тип ${t}`);
}

for (const f of files) {
  let data;
  try { data = yaml.load(fs.readFileSync(path.join(dir, f), 'utf8')); }
  catch (e) { console.error(`YAML ошибка в ${f}: ${e.reason} (строка ${e.mark && e.mark.line + 1})`); process.exit(1); }
  const id = data.id;
  if (!courses[id]) {
    courses[id] = { id, title: data.title, short: data.short, color: data.color, lang: data.lang,
      icon: data.icon, description: data.description, modules: [] };
  }
  const c = courses[id];
  for (const m of data.modules || []) {
    const mod = { id: m.id, title: m.title, level: m.level || 'Junior', lessons: [] };
    for (const l of m.lessons || []) {
      if (typeof l === 'string') { mod.lessons.push({ title: l, soon: true }); continue; }
      const where = `${f} / ${l.id}`;
      (l.practice || []).forEach((ex, i) => checkEx(ex, `${where} #${i + 1}`));
      mod.lessons.push({
        id: l.id, title: l.title, xp: l.xp || 20, minutes: l.minutes || 15,
        theory: r(l.theory),
        practice: (l.practice || []).map(ex => ({ ...ex, q: ri(ex.q), explain: ri(ex.explain),
          options: ex.options ? ex.options.map(o => ri(o)) : undefined })),
        homework: l.homework ? {
          task: r(l.homework.task), hints: (l.homework.hints || []).map(ri),
          checklist: (l.homework.checklist || []).map(ri), solution: l.homework.solution || '',
        } : null,
      });
    }
    // модуль с тем же id из дополнительного файла заменяет заглушку
    const at = c.modules.findIndex(x => x.id === mod.id);
    if (at >= 0) c.modules[at] = mod; else c.modules.push(mod);
  }
}

const ids = new Set();
for (const c of Object.values(courses)) for (const m of c.modules) for (const l of m.lessons) {
  if (l.id) { if (ids.has(l.id)) errors.push('дубликат id ' + l.id); ids.add(l.id); }
}
if (errors.length) { console.error('ОШИБКИ КОНТЕНТА:\n' + errors.join('\n')); process.exit(1); }

const out = 'window.COURSES = ' + JSON.stringify(Object.values(courses)) + ';\n';
fs.writeFileSync(path.join(root, 'www', 'data', 'content.js'), out);
for (const c of Object.values(courses)) {
  const all = c.modules.flatMap(m => m.lessons);
  console.log(`${c.title}: модулей ${c.modules.length}, уроков ${all.length}, готовых ${all.filter(l => !l.soon).length}, упражнений ${all.reduce((s, l) => s + (l.practice ? l.practice.length : 0), 0)}`);
}
