// Лёгкая подсветка синтаксиса без зависимостей
(function () {
  const KW = {
    python: 'False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case self',
    csharp: 'abstract as base bool break byte case catch char checked class const continue decimal default delegate do double else enum event explicit extern false finally fixed float for foreach goto if implicit in int interface internal is lock long namespace new null object operator out override params private protected public readonly record ref return sbyte sealed short sizeof static string struct switch this throw true try typeof uint ulong unchecked unsafe ushort using var virtual void volatile while async await get set init yield where nameof',
    cpp: 'alignas auto bool break case catch char class const constexpr const_cast continue decltype default delete do double dynamic_cast else enum explicit extern false float for friend if inline int long mutable namespace new noexcept nullptr operator private protected public return short signed sizeof static static_cast struct switch template this throw true try typedef typename union unsigned using virtual void volatile while override final size_t',
    java: 'abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for if implements import instanceof int interface long native new null package private protected public return short static super switch synchronized this throw throws transient true false try var void volatile while record yield sealed permits',
    javascript: 'async await break case catch class const continue debugger default delete do else export extends false finally for from function if import in instanceof let new null of return static super switch this throw true try typeof undefined var void while yield type interface enum implements private public protected readonly keyof as satisfies abstract declare namespace never unknown any infer is',
    bsl: 'Если Тогда ИначеЕсли Иначе КонецЕсли Для Каждого Из По Цикл КонецЦикла Пока Процедура КонецПроцедуры Функция КонецФункции Возврат Перем Знач Экспорт Новый Истина Ложь Неопределено Null И ИЛИ НЕ Попытка Исключение КонецПопытки ВызватьИсключение Продолжить Прервать Выполнить Асинх Ждать If Then Else EndIf For Each In To Do EndDo While Procedure EndProcedure Function EndFunction Return Var Export New True False Undefined And Or Not Try Except EndTry Raise',
  };
  const TYPES = /^(int|str|float|list|dict|set|tuple|bool|String|Integer|List|Map|ArrayList|HashMap|Console|Math|System|std|vector|string|map|cout|cin|endl|Object|Array|Promise|JSON|console|Сообщить|Строка|Число|Массив|Структура|Соответствие|ТаблицаЗначений|Запрос|ТекущаяДата|Формат|СтрДлина|Тип|ТипЗнч)$/;
  const SETS = {};
  for (const k in KW) SETS[k] = new Set(KW[k].split(' ').map(w => (k === 'bsl' ? w.toLowerCase() : w)));
  const ALIAS = { py: 'python', cs: 'csharp', 'c#': 'csharp', 'c++': 'cpp', js: 'javascript', ts: 'javascript', typescript: 'javascript', jsx: 'javascript', tsx: 'javascript', '1c': 'bsl', onec: 'bsl' };

  const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

  function highlight(code, lang) {
    lang = ALIAS[lang] || lang;
    const kw = SETS[lang];
    if (!kw) return esc(code);
    const lineCom = lang === 'python' ? '#' : '//';
    let out = '', i = 0;
    const n = code.length;
    while (i < n) {
      const ch = code[i], rest = code.slice(i);
      // комментарии
      if (rest.startsWith(lineCom) || (lang !== 'python' && lang !== 'bsl' && rest.startsWith('/*'))) {
        let end;
        if (rest.startsWith('/*')) { end = code.indexOf('*/', i + 2); end = end < 0 ? n : end + 2; }
        else { end = code.indexOf('\n', i); if (end < 0) end = n; }
        out += '<span class="tk-com">' + esc(code.slice(i, end)) + '</span>'; i = end; continue;
      }
      // препроцессор
      if ((lang === 'cpp' && ch === '#') || (lang === 'bsl' && (ch === '&' || ch === '#') && (i === 0 || code[i - 1] === '\n'))) {
        let end = code.indexOf('\n', i); if (end < 0) end = n;
        out += '<span class="tk-pp">' + esc(code.slice(i, end)) + '</span>'; i = end; continue;
      }
      if (lang === 'python' && ch === '@') {
        const m = /^@[\w.]+/.exec(rest); if (m) { out += '<span class="tk-pp">' + esc(m[0]) + '</span>'; i += m[0].length; continue; }
      }
      // строки
      if (ch === '"' || ch === "'" || (ch === '`' && lang === 'javascript') || (lang === 'bsl' && ch === '|')) {
        let q = ch, j = i + 1;
        if (lang === 'python' && rest.startsWith(q.repeat(3))) {
          const e = code.indexOf(q.repeat(3), i + 3); j = e < 0 ? n : e + 3;
        } else if (lang === 'bsl') {
          if (ch === "'") { const e = code.indexOf("'", i + 1); j = e < 0 ? n : e + 1; }
          else { while (j < n && code[j] !== '"' && code[j] !== '\n') j++; j++; }
        } else {
          while (j < n && code[j] !== q) { if (code[j] === '\\') j++; if (code[j] === '\n' && q !== '`') break; j++; }
          j++;
        }
        // префиксы f"", $"" , @""
        out += '<span class="tk-str">' + esc(code.slice(i, Math.min(j, n))) + '</span>'; i = Math.min(j, n); continue;
      }
      // числа
      if (/[0-9]/.test(ch) && !/[\wА-Яа-яЁё]/.test(code[i - 1] || '')) {
        const m = /^(0x[0-9a-fA-F]+|\d[\d_]*(\.\d+)?([eE][+-]?\d+)?[fFLlmMdD]?)/.exec(rest);
        out += '<span class="tk-num">' + esc(m[0]) + '</span>'; i += m[0].length; continue;
      }
      // слова
      const wm = /^[A-Za-z_А-Яа-яЁё][\wА-Яа-яЁё]*/.exec(rest);
      if (wm) {
        const w = wm[0];
        const key = lang === 'bsl' ? w.toLowerCase() : w;
        const after = code.slice(i + w.length);
        if (kw.has(key)) out += '<span class="tk-kw">' + esc(w) + '</span>';
        else if (TYPES.test(w)) out += '<span class="tk-type">' + esc(w) + '</span>';
        else if (/^\s*\(/.test(after)) out += '<span class="tk-fn">' + esc(w) + '</span>';
        else if (/^[A-Z]/.test(w) && lang !== 'python' && lang !== 'bsl') out += '<span class="tk-type">' + esc(w) + '</span>';
        else out += esc(w);
        i += w.length; continue;
      }
      out += esc(ch); i++;
    }
    return out;
  }

  function highlightAll(root, defLang) {
    root.querySelectorAll('pre code').forEach(el => {
      if (el.dataset.hl) return;
      const m = /language-([\w+#]+)/.exec(el.className);
      el.innerHTML = highlight(el.textContent, m ? m[1] : defLang);
      el.dataset.hl = '1';
    });
  }
  window.HL = { highlight, highlightAll, esc };
})();
