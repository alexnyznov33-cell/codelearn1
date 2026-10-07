// CodeLearn — основное приложение (маршрутизация и экраны)
(function () {
  const C = window.COURSES || [];
  const view = document.getElementById('view');
  const { esc, highlightAll } = window.HL;
  const LEVELS = { 'Junior': 'Junior', 'Junior+': 'Junior-plus', 'Middle': 'Middle' };

  window.toast = msg => { const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2200); };
  const applyTheme = () => document.body.classList.toggle('light', Store.state.settings.theme === 'light');
  applyTheme();

  // ---------- helpers ----------
  const course = id => C.find(c => c.id === id);
  const allLessons = c => c.modules.flatMap(m => m.lessons.map(l => ({ ...l, module: m })));
  const ready = c => allLessons(c).filter(l => !l.soon);
  function findLesson(c, lid) {
    const ls = ready(c); const i = ls.findIndex(l => l.id === lid);
    return { lesson: ls[i], prev: ls[i - 1], next: ls[i + 1], index: i };
  }
  function courseProgress(c) {
    const total = allLessons(c).length, avail = ready(c).length;
    const done = ready(c).filter(l => Store.isDone(l.id)).length;
    return { total, avail, done, pct: total ? Math.round((done / total) * 100) : 0 };
  }
  const icon = c => `<div class="course-icon" style="--c:${c.color}">${esc(c.short)}</div>`;
  function setNav(name) { document.querySelectorAll('[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === name)); }
  function nextLessonOf(c) { return ready(c).find(l => !Store.isDone(l.id)) || ready(c)[0]; }

  function courseCard(c) {
    const p = courseProgress(c);
    return `<a class="card course-card" style="--c:${c.color}" href="#/course/${c.id}">
      ${icon(c)}<b style="font-size:18px">${esc(c.title)}</b>
      <div class="muted small" style="min-height:44px">${esc(c.description)}</div>
      <div class="progress"><i style="width:${p.pct}%"></i></div>
      <div class="muted small">${p.done} из ${p.total} уроков · ${c.modules.length} модулей</div></a>`;
  }

  // ---------- screens ----------
  function home() {
    setNav('home');
    const s = Store.state, lv = Store.level();
    const doneCount = Object.keys(s.done).length;
    let cont = '';
    if (s.lastLesson && course(s.lastLesson.courseId)) {
      const c = course(s.lastLesson.courseId);
      const nl = Store.isDone(s.lastLesson.lessonId) ? (findLesson(c, s.lastLesson.lessonId).next || nextLessonOf(c)) : findLesson(c, s.lastLesson.lessonId).lesson;
      if (nl) cont = `<a class="btn white" href="#/lesson/${c.id}/${nl.id}">▶ Продолжить: ${esc(c.title)} — ${esc(nl.title)}</a>`;
    }
    if (!cont) cont = `<a class="btn white" href="#/courses">🚀 Выбрать первый курс</a>`;
    view.innerHTML = `
      <div class="hero"><h1>Привет! Готов кодить? 👋</h1>
        <p>Теория, практика и домашние задания: ${C.length} курсов по программированию и микроконтроллерам.</p>${cont}</div>
      <div class="stats">
        <div class="stat"><b>⭐ ${s.xp}</b><span>опыт (XP)</span></div>
        <div class="stat"><b>🏅 ${lv.lv}</b><span>уровень · ${lv.pct}% до следующего</span></div>
        <div class="stat"><b>🔥 ${s.streak.count}</b><span>дней подряд</span></div>
        <div class="stat"><b>✅ ${doneCount}</b><span>уроков пройдено</span></div>
        <a class="stat" href="#/review" style="color:inherit"><b>🔁 ${Object.keys(s.mistakes).length}</b><span>ошибок на повторение</span></a>
      </div>
      <h2>Курсы</h2><div class="grid">${C.map(courseCard).join('')}</div>`;
  }

  function courses() {
    setNav('courses');
    view.innerHTML = `<h1>Курсы</h1><p class="muted">Языки программирования — от основ до Middle; Arduino и ESP32 — основы электроники, embedded и IoT.</p>
      <input class="inp search" placeholder="🔎 Поиск урока по всем курсам…" id="q" />
      <div id="res"></div><div class="grid" id="cg">${C.map(courseCard).join('')}</div>`;
    const q = document.getElementById('q'), res = document.getElementById('res'), cg = document.getElementById('cg');
    q.oninput = () => {
      const v = q.value.trim().toLowerCase();
      cg.style.display = v ? 'none' : '';
      if (!v) { res.innerHTML = ''; return; }
      const found = [];
      C.forEach(c => allLessons(c).forEach(l => { if (l.title.toLowerCase().includes(v) || c.title.toLowerCase().includes(v)) found.push({ c, l }); }));
      res.innerHTML = found.length ? `<div class="card module open" style="padding:0"><div class="lessons" style="display:block;border:0">${found.slice(0, 60).map(({ c, l }) =>
        `<a class="lesson-row ${l.soon ? 'soon' : ''} ${Store.isDone(l.id) ? 'done' : ''}" href="#/lesson/${c.id}/${l.id}">
          <span class="st">${Store.isDone(l.id) ? '✓' : ''}</span><span class="lt">${esc(l.title)}<div class="muted small">${esc(c.title)} · ${esc(l.module.title)}</div></span>
          ${l.soon ? '<span class="badge">скоро</span>' : ''}</a>`).join('')}</div></div>` : '<div class="empty">Ничего не найдено</div>';
    };
  }

  function courseView(id) {
    setNav('courses');
    const c = course(id); if (!c) return notFound();
    const p = courseProgress(c);
    const nl = nextLessonOf(c);
    const firstOpen = c.modules.findIndex(m => m.lessons.some(l => !l.soon && !Store.isDone(l.id)));
    view.innerHTML = `<div class="crumbs"><a href="#/courses">Курсы</a> / ${esc(c.title)}</div>
      <div class="row" style="align-items:flex-start;gap:16px">${icon(c)}<div style="flex:1;min-width:220px">
        <h1>${esc(c.title)}</h1><div class="muted">${esc(c.description)}</div>
        <div class="progress" style="max-width:420px"><i style="width:${p.pct}%"></i></div>
        <div class="muted small">Пройдено ${p.done} из ${p.total} уроков (${p.pct}%) · доступно сейчас: ${p.avail}</div></div>
        ${nl ? `<a class="btn" href="#/lesson/${c.id}/${nl.id}">${p.done ? '▶ Продолжить' : '🚀 Начать курс'}</a>` : ''}</div>
      <h2>Программа курса</h2>
      ${c.modules.map((m, mi) => {
        const r = m.lessons.filter(l => !l.soon), d = r.filter(l => Store.isDone(l.id)).length;
        return `<div class="card module ${mi === Math.max(firstOpen, 0) ? 'open' : ''}">
          <div class="module-head"><div class="num">${mi + 1}</div><div class="t"><b>${esc(m.title)}</b>
            <span class="muted small">${m.lessons.length} уроков${r.length < m.lessons.length ? ` · готово ${r.length}` : ''}${d ? ` · пройдено ${d}` : ''}</span></div>
            <span class="badge ${LEVELS[m.level] || ''}">${esc(m.level)}</span><span class="muted">▾</span></div>
          <div class="lessons">${m.lessons.map(l => `<a class="lesson-row ${l.soon ? 'soon' : ''} ${Store.isDone(l.id) ? 'done' : ''}" href="${l.soon ? '#' : `#/lesson/${c.id}/${l.id}`}">
              <span class="st">${Store.isDone(l.id) ? '✓' : ''}</span><span class="lt">${esc(l.title)}</span>
              <span class="muted small">${l.soon ? 'скоро' : `${l.minutes} мин · ${l.xp} XP`}</span></a>`).join('')}</div></div>`;
      }).join('')}`;
    view.querySelectorAll('.module-head').forEach(h => h.onclick = () => h.parentElement.classList.toggle('open'));
  }

  function lessonView(cid, lid, stepArg) {
    setNav('courses');
    const c = course(cid); if (!c) return notFound();
    const { lesson: l, prev, next } = findLesson(c, lid); if (!l) return notFound();
    Store.setLast(cid, lid);
    const st = { step: stepArg || 'theory', idx: 0, results: [] };
    const hasHw = !!l.homework;
    const stepsDef = [['theory', '📖 Теория'], ['practice', `✍️ Практика (${l.practice.length})`]].concat(hasHw ? [['hw', '🏠 Домашнее задание']] : []).concat([['finish', '🏁 Итог']]);

    function frame(inner) {
      view.innerHTML = `<div class="crumbs"><a href="#/courses">Курсы</a> / <a href="#/course/${c.id}">${esc(c.title)}</a> / ${esc(l.module.title)}</div>
        <h1>${esc(l.title)}</h1><div class="muted small">${l.minutes} мин · ${l.xp} XP ${Store.isDone(l.id) ? '· ✅ пройден' : ''}</div>
        <div class="steps">${stepsDef.map(([k, t]) => `<span class="step ${st.step === k ? 'active' : ''}" data-s="${k}">${t}</span>`).join('')}</div>
        <div id="body">${inner}</div>`;
      view.querySelectorAll('.step').forEach(s => s.onclick = () => go(s.dataset.s));
      highlightAll(view, c.lang);
      window.scrollTo(0, 0);
    }
    function go(step) { st.step = step; if (step === 'practice') { st.idx = 0; st.results = []; } draw(); }

    function draw() {
      if (st.step === 'theory') {
        frame(`<div class="theory">${l.theory}</div><div class="ex-nav">
          ${prev ? `<a class="btn ghost" href="#/lesson/${c.id}/${prev.id}">← Предыдущий</a>` : ''}<span class="spacer"></span>
          <button class="btn" id="toPr">К практике →</button></div>`);
        document.getElementById('toPr').onclick = () => go('practice');
      } else if (st.step === 'practice') {
        if (!l.practice.length) return go(hasHw ? 'hw' : 'finish');
        if (st.idx >= l.practice.length) {
          const ok = st.results.filter(Boolean).length;
          frame(`<div class="card done-box"><div class="big">${ok === st.results.length ? '🎯' : ok / st.results.length >= .5 ? '👍' : '📚'}</div>
            <h2>Практика завершена: ${ok} из ${st.results.length}</h2>
            <p class="muted">${ok / st.results.length >= .5 ? 'Хороший результат!' : 'Стоит перечитать теорию и попробовать ещё раз.'} Ошибки попали в раздел «Повторение».</p>
            <div class="row" style="justify-content:center"><button class="btn ghost" id="again">↻ Ещё раз</button>
            <button class="btn" id="fw">${hasHw ? 'К домашнему заданию →' : 'Завершить урок →'}</button></div></div>`);
          document.getElementById('again').onclick = () => go('practice');
          document.getElementById('fw').onclick = () => go(hasHw ? 'hw' : 'finish');
          return;
        }
        frame(`<div class="dots">${l.practice.map((_, i) => `<i class="${i === st.idx ? 'cur' : st.results[i] === true ? 'ok' : st.results[i] === false ? 'bad' : ''}"></i>`).join('')}</div>
          <div class="muted small">Задание ${st.idx + 1} из ${l.practice.length}</div><div id="ex"></div>`);
        const ex = l.practice[st.idx], key = `${c.id}|${l.id}|${st.idx}`;
        Exercises.render(ex, c.lang, document.getElementById('ex'), (res, nav) => {
          st.results[st.idx] = res;
          if (res) { if (Store.state.mistakes[key]) Store.clearMistake(key); } else Store.addMistake(key);
          const b = document.createElement('button'); b.className = 'btn'; b.textContent = st.idx + 1 < l.practice.length ? 'Дальше →' : 'Результат →';
          b.onclick = () => { st.idx++; draw(); }; nav.appendChild(b); b.focus();
          highlightAll(view, c.lang);
        });
      } else if (st.step === 'hw') {
        const hw = l.homework, h = Store.hw(l.id);
        frame(`<div class="card hw-box"><h3 style="margin-top:0">🏠 Домашнее задание</h3><div class="theory">${hw.task}</div></div>
          ${hw.hints.length ? `<details><summary>💡 Подсказки (${hw.hints.length})</summary><ol>${hw.hints.map(x => `<li>${x}</li>`).join('')}</ol></details>` : ''}
          <h3>Ваше решение</h3><p class="muted small">Напишите код в своей IDE, запустите и вставьте сюда — он сохранится в приложении.</p>
          <textarea class="inp" id="hwa" rows="10" spellcheck="false" placeholder="Вставьте решение…">${esc(h.answer)}</textarea>
          ${hw.checklist.length ? `<h3>Самопроверка</h3>${hw.checklist.map((x, i) => `<label class="check-item"><input type="checkbox" data-i="${i}" ${h.checks.includes(i) ? 'checked' : ''}><span>${x}</span></label>`).join('')}` : ''}
          ${hw.solution ? `<details id="sol"><summary>👀 Эталонное решение (откройте после своей попытки)</summary><pre><code>${esc(hw.solution)}</code></pre></details>` : ''}
          <div class="ex-nav"><button class="btn ghost" id="bk">← Практика</button><span class="spacer"></span><button class="btn" id="fin">Завершить урок →</button></div>`);
        const ta = document.getElementById('hwa');
        ta.oninput = () => { h.answer = ta.value; Store.saveHw(); };
        ta.onkeydown = e => { if (e.key === 'Tab') { e.preventDefault(); const p = ta.selectionStart; ta.setRangeText('    ', p, ta.selectionEnd, 'end'); ta.oninput(); } };
        view.querySelectorAll('.check-item input').forEach(cb => cb.onchange = () => {
          const i = +cb.dataset.i; h.checks = h.checks.filter(x => x !== i); if (cb.checked) h.checks.push(i); Store.saveHw();
        });
        document.getElementById('bk').onclick = () => go('practice');
        document.getElementById('fin').onclick = () => go('finish');
      } else if (st.step === 'finish') {
        const total = st.results.length, ok = st.results.filter(Boolean).length;
        const practiced = total === l.practice.length;
        if (!practiced && !Store.isDone(l.id)) {
          frame(`<div class="card done-box"><div class="big">✍️</div><h2>Сначала пройдите практику</h2>
            <p class="muted">Урок засчитывается после выполнения всех заданий.</p><button class="btn" id="tp">К практике</button></div>`);
          document.getElementById('tp').onclick = () => go('practice'); return;
        }
        const score = practiced ? Math.round((ok / Math.max(total, 1)) * 100) : Store.state.done[l.id].score;
        let first = false;
        if (practiced) first = Store.completeLesson(l.id, score, Math.round(l.xp * Math.max(0.5, score / 100)));
        frame(`<div class="card done-box"><div class="big">🏆</div><h2>Урок пройден!</h2>
          <p>Результат практики: <b>${score}%</b>${practiced ? ` · ${first ? '+' + Math.round(l.xp * Math.max(0.5, score / 100)) : '+' + Math.round(l.xp * Math.max(0.5, score / 100) / 4)} XP` : ''}</p>
          <p class="muted">Всего опыта: ${Store.state.xp} XP · 🔥 серия ${Store.state.streak.count} дн.</p>
          <div class="row" style="justify-content:center">
            <a class="btn ghost" href="#/course/${c.id}">К программе курса</a>
            ${next ? `<a class="btn" href="#/lesson/${c.id}/${next.id}">Следующий урок: ${esc(next.title)} →</a>` : ''}</div></div>`);
        st.results = [];
      }
    }
    draw();
  }

  function review() {
    setNav('review');
    const items = Object.keys(Store.state.mistakes).map(k => {
      const [cid, lid, i] = k.split('|'); const c = course(cid); if (!c) return null;
      const l = ready(c).find(x => x.id === lid); if (!l || !l.practice[+i]) return null;
      return { k, c, l, ex: l.practice[+i] };
    }).filter(Boolean);
    if (!items.length) {
      view.innerHTML = `<h1>Повторение</h1><div class="card empty"><div style="font-size:48px">🎉</div>Ошибок для повторения нет. Задания, в которых вы ошиблись, появятся здесь.</div>`;
      return;
    }
    let i = 0;
    const draw = () => {
      if (i >= items.length) { review(); return; }
      const it = items[i];
      view.innerHTML = `<h1>Повторение</h1><p class="muted">Задание ${i + 1} из ${items.length} · ${esc(it.c.title)} → <a href="#/lesson/${it.c.id}/${it.l.id}">${esc(it.l.title)}</a></p><div id="ex"></div>`;
      Exercises.render(it.ex, it.c.lang, document.getElementById('ex'), (res, nav) => {
        if (res) Store.clearMistake(it.k); else Store.addMistake(it.k);
        const b = document.createElement('button'); b.className = 'btn'; b.textContent = 'Дальше →';
        b.onclick = () => { i++; draw(); }; nav.appendChild(b);
        highlightAll(view, it.c.lang);
      });
      highlightAll(view, it.c.lang);
    };
    draw();
  }

  function profile() {
    setNav('profile');
    const s = Store.state, lv = Store.level();
    view.innerHTML = `<h1>Профиль</h1>
      <div class="stats"><div class="stat"><b>⭐ ${s.xp}</b><span>XP</span></div><div class="stat"><b>🏅 ${lv.lv}</b><span>уровень</span></div>
      <div class="stat"><b>🔥 ${s.streak.count}</b><span>дней подряд</span></div><div class="stat"><b>✅ ${Object.keys(s.done).length}</b><span>уроков</span></div></div>
      <h2>Прогресс по курсам</h2>
      <div class="card">${C.map(c => { const p = courseProgress(c); return `<div style="margin-bottom:12px"><div class="row"><b>${esc(c.title)}</b><span class="spacer"></span><span class="muted small">${p.done}/${p.total}</span></div><div class="progress"><i style="width:${p.pct}%"></i></div></div>`; }).join('')}</div>
      <h2>Настройки</h2>
      <div class="card">
        <div class="switch"><span>Светлая тема</span><input type="checkbox" id="th" ${s.settings.theme === 'light' ? 'checked' : ''} style="width:22px;height:22px;accent-color:#7c5cff"></div>
        <div class="switch"><span>Резервная копия прогресса<div class="muted small">Перенос между компьютером и телефоном</div></span>
          <span class="row"><button class="btn ghost" id="exp">Экспорт</button><button class="btn ghost" id="imp">Импорт</button></span></div>
        <div class="switch" style="border:0"><span>Сбросить весь прогресс</span><button class="btn ghost" id="rst" style="color:var(--bad)!important">Сбросить</button></div>
      </div>
      <p class="muted small" style="margin-top:24px">CodeLearn 1.0 · работает офлайн · данные хранятся только на этом устройстве.</p>`;
    document.getElementById('th').onchange = e => { Store.setTheme(e.target.checked ? 'light' : 'dark'); applyTheme(); };
    document.getElementById('exp').onclick = async () => {
      const data = Store.export();
      try { await navigator.clipboard.writeText(data); toast('Прогресс скопирован в буфер обмена'); }
      catch (e) { const a = document.createElement('a'); a.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(data); a.download = 'codelearn-progress.json'; a.click(); }
    };
    document.getElementById('imp').onclick = () => {
      const v = prompt('Вставьте сохранённый прогресс (JSON):'); if (!v) return;
      try { Store.import(v); toast('Прогресс восстановлен'); profile(); } catch (e) { toast('Неверный формат данных'); }
    };
    document.getElementById('rst').onclick = () => { if (confirm('Точно сбросить весь прогресс?')) { Store.reset(); applyTheme(); profile(); toast('Прогресс сброшен'); } };
  }

  function notFound() { view.innerHTML = `<div class="empty"><h1>Страница не найдена</h1><a class="btn" href="#/">На главную</a></div>`; }

  function route() {
    const parts = (location.hash.replace(/^#\/?/, '') || '').split('/').filter(Boolean);
    const [a, b, c2, d] = parts;
    if (!a) home();
    else if (a === 'courses') courses();
    else if (a === 'course') courseView(b);
    else if (a === 'lesson') lessonView(b, c2, d);
    else if (a === 'review') review();
    else if (a === 'profile') profile();
    else notFound();
    view.focus({ preventScroll: true });
  }
  window.addEventListener('hashchange', route);
  route();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
