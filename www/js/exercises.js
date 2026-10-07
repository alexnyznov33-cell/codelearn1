// Движок упражнений: choice, output, fill, order, bug
(function () {
  const { highlight, esc } = window.HL;
  const norm = s => String(s).replace(/\r/g, '').split('\n').map(l => l.replace(/\s+$/, '')).join('\n').trim();
  const squash = s => String(s).replace(/\s+/g, '').replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  const list = a => (Array.isArray(a) ? a : [a]).map(String);
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const codeBlock = (code, lang) => code ? `<pre><code>${highlight(String(code).replace(/\n$/, ''), lang)}</code></pre>` : '';

  function render(ex, lang, el, onResult) {
    el.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'ex';
    let check, answered = false;
    const q = `<div class="ex-q">${ex.q}</div>`;

    if (ex.type === 'choice') {
      const multi = Array.isArray(ex.answer);
      const sel = new Set();
      wrap.innerHTML = q + codeBlock(ex.code, lang) + (multi ? '<p class="muted small">Выберите все правильные варианты</p>' : '') +
        `<div class="opts">${ex.options.map((o, i) => `<button class="opt" data-i="${i}">${o}</button>`).join('')}</div>`;
      wrap.querySelectorAll('.opt').forEach(b => b.onclick = () => {
        if (answered) return;
        const i = +b.dataset.i;
        if (!multi) sel.clear(), wrap.querySelectorAll('.opt').forEach(x => x.classList.remove('sel'));
        sel.has(i) ? sel.delete(i) : sel.add(i);
        b.classList.toggle('sel', sel.has(i));
      });
      check = () => {
        if (!sel.size) return null;
        const right = new Set(multi ? ex.answer : [ex.answer]);
        wrap.querySelectorAll('.opt').forEach(b => {
          const i = +b.dataset.i;
          if (right.has(i)) b.classList.add('right'); else if (sel.has(i)) b.classList.add('wrong');
        });
        return right.size === sel.size && [...sel].every(i => right.has(i));
      };
    }

    else if (ex.type === 'output') {
      wrap.innerHTML = q + codeBlock(ex.code, lang) +
        `<textarea class="inp" rows="2" placeholder="Введите вывод программы точно, как в консоли"></textarea>`;
      const inp = wrap.querySelector('textarea');
      check = () => {
        if (!inp.value.trim()) return null;
        const ok = list(ex.answer).some(a => norm(a) === norm(inp.value));
        inp.classList.add(ok ? 'right' : 'wrong'); inp.readOnly = true;
        return ok;
      };
      wrap.correct = () => `<pre><code>${esc(list(ex.answer)[0])}</code></pre>`;
    }

    else if (ex.type === 'fill') {
      const parts = String(ex.code).replace(/\n$/, '').split('___');
      let html = '';
      parts.forEach((p, i) => {
        html += highlight(p, lang);
        if (i < parts.length - 1) html += `<input class="blank" data-i="${i}" autocomplete="off" autocapitalize="off" spellcheck="false" size="${Math.max(4, Math.max(...list(ex.answers[i]).map(s => s.length)))}">`;
      });
      wrap.innerHTML = q + `<pre><code>${html}</code></pre>`;
      const inputs = [...wrap.querySelectorAll('.blank')];
      check = () => {
        if (inputs.every(x => !x.value.trim())) return null;
        let all = true;
        inputs.forEach((x, i) => {
          const ok = list(ex.answers[i]).some(a => squash(a) === squash(x.value));
          x.classList.add(ok ? 'right' : 'wrong'); x.readOnly = true; all = all && ok;
        });
        return all;
      };
      wrap.correct = () => 'Правильно: ' + ex.answers.map(a => `<code>${esc(list(a)[0])}</code>`).join(', ');
    }

    else if (ex.type === 'order') {
      let items = ex.lines.map((t, i) => ({ t, i }));
      do { items = shuffle(items); } while (items.length > 1 && items.every((x, k) => x.i === k));
      wrap.innerHTML = q + '<p class="muted small">Расставьте строки в правильном порядке кнопками ▲▼</p><div class="order-list"></div>';
      const box = wrap.querySelector('.order-list');
      const draw = () => {
        box.innerHTML = items.map((x, k) => `<div class="order-item" data-k="${k}"><code>${highlight(x.t, lang)}</code>
          <button data-a="up" aria-label="Вверх">▲</button><button data-a="down" aria-label="Вниз">▼</button></div>`).join('');
        box.querySelectorAll('button').forEach(b => b.onclick = () => {
          if (answered) return;
          const k = +b.parentElement.dataset.k, d = b.dataset.a === 'up' ? -1 : 1, j = k + d;
          if (j < 0 || j >= items.length) return;
          [items[k], items[j]] = [items[j], items[k]]; draw();
        });
      };
      draw();
      check = () => {
        let ok = true;
        box.querySelectorAll('.order-item').forEach((d, k) => {
          // допускаем одинаковые строки
          const good = items[k].t === ex.lines[k];
          d.classList.add(good ? 'right' : 'wrong'); ok = ok && good;
        });
        return ok;
      };
      wrap.correct = () => codeBlock(ex.lines.join('\n'), lang);
    }

    else if (ex.type === 'bug') {
      const lines = String(ex.code).replace(/\n$/, '').split('\n');
      let sel = 0;
      wrap.innerHTML = q + '<p class="muted small">Нажмите на строку с ошибкой</p><div class="bug-code">' +
        lines.map((l, i) => `<div class="bug-line" data-n="${i + 1}"><span class="ln">${i + 1}</span><span>${highlight(l, lang) || ' '}</span></div>`).join('') + '</div>';
      wrap.querySelectorAll('.bug-line').forEach(d => d.onclick = () => {
        if (answered) return;
        wrap.querySelectorAll('.bug-line').forEach(x => x.classList.remove('sel'));
        d.classList.add('sel'); sel = +d.dataset.n;
      });
      check = () => {
        if (!sel) return null;
        const ok = sel === ex.bugLine;
        wrap.querySelector(`[data-n="${sel}"]`).classList.add(ok ? 'right' : 'wrong');
        if (!ok) wrap.querySelector(`[data-n="${ex.bugLine}"]`).classList.add('right');
        return ok;
      };
      wrap.correct = () => ex.fix ? 'Исправление:' + codeBlock(ex.fix, lang) : '';
    }

    const fb = document.createElement('div'); fb.className = 'feedback';
    const nav = document.createElement('div'); nav.className = 'ex-nav';
    nav.innerHTML = '<button class="btn" data-check>Проверить</button>';
    wrap.append(fb, nav);
    el.appendChild(wrap);
    const btn = nav.querySelector('[data-check]');
    btn.onclick = () => {
      if (answered) return;
      const res = check();
      if (res === null) { window.toast && toast('Сначала дайте ответ'); return; }
      answered = true;
      fb.className = 'feedback show ' + (res ? 'ok' : 'bad');
      fb.innerHTML = `<b>${res ? '✅ Верно!' : '❌ Неверно'}</b>` +
        (!res && wrap.correct ? `<div style="margin-top:6px">${wrap.correct()}</div>` : '') +
        (ex.explain ? `<div style="margin-top:6px">${ex.explain}</div>` : '');
      btn.remove();
      onResult(res, nav);
    };
  }
  window.Exercises = { render };
})();
