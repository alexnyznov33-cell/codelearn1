# Берёт в кавычки однострочные значения с ": " или " #" (частая ошибка YAML), не трогая блоки "|"
import re, sys
for p in sys.argv[1:]:
    out, block = [], None
    for line in open(p, encoding='utf8'):
        ind = len(line) - len(line.lstrip(' '))
        if block is not None:
            if line.strip() == '' or ind > block:
                out.append(line); continue
            block = None
        m = re.match(r'^(\s*(?:- )?(?:q|explain|fix|title|description|answer): )(.+?)\s*$', line) or re.match(r'^(\s*- )(?!type:|id:)(.+?)\s*$', line)
        if m:
            v = m.group(2)
            if not v.startswith(('"', "'", '|', '[', '{')) and (': ' in v or v.endswith(':') or ' #' in v or v.startswith(('`', '*', '@', '&', '!', '%'))):
                v = '"' + v.replace('\\', '\\\\').replace('"', '\\"') + '"'
                line = m.group(1) + v + '\n'
        if re.search(r':\s*[|>][-+]?\s*$', line):
            block = ind
        out.append(line)
    open(p, 'w', encoding='utf8').write(''.join(out))
