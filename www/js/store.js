// Хранение прогресса (localStorage) — работает офлайн в браузере, Electron и Android WebView
(function () {
  const KEY = 'codelearn.v1';
  const def = () => ({ done: {}, xp: 0, streak: { count: 0, last: null }, hw: {}, mistakes: {}, lastLesson: null,
    settings: { theme: 'dark' }, started: new Date().toISOString() });
  let s;
  try { s = Object.assign(def(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { s = def(); }
  const save = () => localStorage.setItem(KEY, JSON.stringify(s));
  const today = () => new Date().toISOString().slice(0, 10);

  function touchStreak() {
    const t = today();
    if (s.streak.last === t) return;
    const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    s.streak.count = s.streak.last === y ? s.streak.count + 1 : 1;
    s.streak.last = t;
  }

  window.Store = {
    get state() { return s; },
    isDone: id => !!s.done[id],
    completeLesson(id, score, xp) {
      const first = !s.done[id];
      const prev = s.done[id];
      s.done[id] = { date: new Date().toISOString(), score: Math.max(score, prev ? prev.score : 0) };
      if (first) s.xp += xp; else s.xp += Math.round(xp / 4);
      touchStreak(); save();
      return first;
    },
    setLast(courseId, lessonId) { s.lastLesson = { courseId, lessonId }; save(); },
    addMistake(key) { s.mistakes[key] = (s.mistakes[key] || 0) + 1; save(); },
    clearMistake(key) { delete s.mistakes[key]; s.xp += 2; save(); },
    hw(id) { return s.hw[id] || (s.hw[id] = { checks: [], answer: '' }); },
    saveHw() { save(); },
    setTheme(t) { s.settings.theme = t; save(); },
    reset() { s = def(); save(); },
    export() { return JSON.stringify(s, null, 2); },
    import(json) { const d = JSON.parse(json); if (!d.done) throw new Error('bad'); s = Object.assign(def(), d); save(); },
    level() { // уровень по XP
      const lv = Math.floor(Math.sqrt(s.xp / 50)) + 1;
      const cur = 50 * (lv - 1) ** 2, next = 50 * lv ** 2;
      return { lv, pct: Math.round(((s.xp - cur) / (next - cur)) * 100), next };
    },
  };
})();
