// Копирует иконку приложения во все mipmap-папки Android-проекта
const fs = require('fs'), path = require('path');
const res = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
const src = path.join(__dirname, '..', 'www', 'icons', 'icon-512.png');
if (!fs.existsSync(res)) { console.log('Сначала выполните: npx cap add android'); process.exit(0); }
for (const d of fs.readdirSync(res).filter(d => d.startsWith('mipmap-') && !d.includes('anydpi'))) {
  for (const f of ['ic_launcher.png', 'ic_launcher_round.png', 'ic_launcher_foreground.png']) {
    const target = path.join(res, d, f);
    if (fs.existsSync(target)) fs.copyFileSync(src, target);
  }
}
// убираем adaptive-иконки, чтобы использовалась наша картинка
const any = path.join(res, 'mipmap-anydpi-v26');
if (fs.existsSync(any)) fs.rmSync(any, { recursive: true });
console.log('Иконки Android обновлены');
