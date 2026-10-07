# 📦 Как превратить CodeLearn в EXE-установщик и APK

Пошаговый гайд для новичка. Всё делается на **Windows 10/11** (для macOS/Linux отличия указаны отдельно).

Есть два пути:

| Путь | Что нужно | Время | Для кого |
|---|---|---|---|
| **А. Облачная сборка (GitHub Actions)** | Только аккаунт GitHub | ~15 минут | Если не хочется ставить Android Studio |
| **Б. Локальная сборка** | Node.js, Git, Android Studio | 1–2 часа в первый раз | Если хотите собирать сами и подписывать релизы |

---

## 0. Структура проекта (что за что отвечает)

```text
codelearn/
├── www/                  ← само приложение (HTML/CSS/JS) — одинаково для всех платформ
│   ├── data/content.js   ← уроки (генерируется из content/*.yaml)
│   └── icons/            ← иконки (icon.ico для Windows, icon-512.png для остальных)
├── content/*.yaml        ← исходники уроков
├── electron/main.js      ← оболочка для Windows/macOS/Linux
├── capacitor.config.json ← настройки Android (appId, имя)
├── package.json          ← версия приложения и команды сборки
└── .github/workflows/build.yml ← облачная сборка
```

---

## Путь А. Облачная сборка — без установки SDK ☁️

1. Зарегистрируйтесь на <https://github.com>.
2. Нажмите **New repository** → имя `codelearn` → **Create repository**.
3. На странице репозитория: **uploading an existing file** → перетащите **содержимое** папки `codelearn` (включая скрытую папку `.github`!).
   - Если папка `.github` не перетаскивается — установите [GitHub Desktop](https://desktop.github.com), выберите *File → Add local repository* → папку `codelearn` → **Publish repository**.
4. Откройте вкладку **Actions**. Сборка запустится сама (или нажмите **Build apps → Run workflow**).
5. Через 10–15 минут откройте завершившийся запуск (зелёная галочка) → внизу раздел **Artifacts**:
   - `CodeLearn-android-apk` — APK для Android;
   - `CodeLearn-windows-latest` — `CodeLearn Setup 1.0.0.exe`;
   - `CodeLearn-ubuntu-latest` — AppImage и deb;
   - `CodeLearn-macos-latest` — dmg.
6. Скачайте zip, распакуйте — готово.

> APK из облака — **debug**-версия: её можно ставить на свои телефоны и раздавать друзьям, но не публиковать в Google Play. Для Play см. раздел «Подписанный релиз».

---

## Путь Б. Локальная сборка

### Шаг 1. Установите инструменты

1. **Node.js LTS** (20 или 22) — <https://nodejs.org> → кнопка LTS → установщик, всё по умолчанию.
2. **Git** — <https://git-scm.com/download/win> (по желанию, но удобно).
3. Проверьте в **PowerShell** (Win+X → Терминал):

```powershell
node -v    # v20.x или новее
npm -v
```

### Шаг 2. Установите зависимости

```powershell
cd C:\Projects\codelearn      # путь к распакованной папке
npm install
```

Будут скачаны Electron, electron-builder и Capacitor (~300 МБ, один раз).

> ⚠️ Путь к проекту лучше **без кириллицы и пробелов** (`C:\Projects\codelearn`, а не `C:\Мои документы\...`) — Gradle и NSIS иногда на этом спотыкаются.

### Шаг 3. Проверьте, что всё работает

```powershell
npm run content   # пересобрать уроки из content/*.yaml
npm start         # откроется окно приложения
```

Или в браузере: `npm run web` → <http://localhost:8080>.

---

## 🪟 EXE-установщик для Windows

### Сборка

```powershell
npm run dist:win
```

Через 1–3 минуты в папке `dist\` появится:

- `CodeLearn Setup 1.0.0.exe` — **установщик** (NSIS): мастер установки с выбором папки, ярлыки на рабочем столе и в «Пуске», удаление через «Программы и компоненты»;
- `win-unpacked\` — портативная версия (можно запускать `CodeLearn.exe` без установки).

### Настройки (в `package.json`)

```json
"version": "1.0.0",                 ← версия в имени файла и в «Программах»
"build": {
  "appId": "com.codelearn.app",
  "productName": "CodeLearn",       ← имя программы и ярлыка
  "win": { "target": "nsis", "icon": "www/icons/icon.ico" },
  "nsis": {
    "oneClick": false,                          ← мастер с кнопками «Далее»
    "allowToChangeInstallationDirectory": true  ← выбор папки
  }
}
```

Полезные дополнительные опции `nsis`:

```json
"nsis": {
  "oneClick": false,
  "allowToChangeInstallationDirectory": true,
  "createDesktopShortcut": true,
  "createStartMenuShortcut": true,
  "shortcutName": "CodeLearn",
  "installerLanguages": ["ru_RU"],
  "language": "1049",
  "license": "LICENSE.txt"
}
```

Портативный exe (без установки) — замените target: `"target": ["nsis", "portable"]`.

### Иконка

`www/icons/icon.ico` — должна содержать размер **256×256**. Сделать .ico из PNG: <https://icoconvert.com> или командой ImageMagick:

```powershell
magick icon-512.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```

### SmartScreen и подпись

При первом запуске неподписанного exe Windows покажет «Windows защитила ваш компьютер» → **Подробнее → Выполнить в любом случае**. Это нормально для бесплатных программ.

Чтобы предупреждения не было, нужен **сертификат подписи кода** (OV/EV, от ~$100–400/год: Sectigo, DigiCert, Certum). Подпись при сборке:

```powershell
$env:CSC_LINK = "C:\keys\codesign.pfx"
$env:CSC_KEY_PASSWORD = "пароль"
npm run dist:win
```

### Другие ОС

```bash
npm run dist:linux   # dist/CodeLearn-1.0.0.AppImage и .deb (собирать на Linux)
npm run dist:mac     # dist/CodeLearn-1.0.0.dmg (только на macOS)
```

---

## 🤖 APK для Android

### Шаг 1. Установите Android Studio

1. Скачайте <https://developer.android.com/studio> и установите со всеми галочками (Android SDK, Platform-Tools, Virtual Device).
2. При первом запуске пройдите мастер **Standard setup** — он скачает SDK (~3 ГБ).
3. **JDK 17.** Capacitor 6 собирается на JDK 17. В Android Studio: *File → Settings → Build, Execution, Deployment → Build Tools → Gradle → Gradle JDK* → выберите **17** (если нет — *Download JDK… → версия 17, Eclipse Temurin*).
4. Пропишите переменные среды (Пуск → «Изменение системных переменных среды» → Переменные среды):
   - `ANDROID_HOME` = `C:\Users\<Вы>\AppData\Local\Android\Sdk`
   - `JAVA_HOME` = путь к JDK 17 (например `C:\Program Files\Eclipse Adoptium\jdk-17...`)
   - в `Path` добавьте `%ANDROID_HOME%\platform-tools`
5. Перезапустите терминал и проверьте: `java -version` → 17.

### Шаг 2. Создайте Android-проект (один раз)

```powershell
npm run content
npm run android:init     # создаёт папку android/ и ставит иконки приложения
```

### Шаг 3. Соберите APK

**Вариант 1 — через Android Studio (проще):**

```powershell
npm run android:sync     # копирует www/ в Android-проект
npm run android:open     # открывает Android Studio
```

Подождите, пока внизу закончится *Gradle sync*, затем:

- **Run ▶** — запустить на подключённом телефоне (включите «Для разработчиков → Отладка по USB») или эмуляторе;
- **Build → Build App Bundle(s) / APK(s) → Build APK(s)** → во всплывающем окне **locate**.

**Вариант 2 — из командной строки:**

```powershell
npm run android:apk
```

Готовый файл: `android\app\build\outputs\apk\debug\app-debug.apk`.

> На macOS/Linux вместо `gradlew` используйте `./gradlew`: `cd android && ./gradlew assembleDebug`.

### Шаг 4. Установите на телефон

- Скопируйте APK на телефон и откройте его (разрешите «Установку из неизвестных источников»), или
- `adb install -r android\app\build\outputs\apk\debug\app-debug.apk`.

### После изменения уроков или кода

Всегда выполняйте:

```powershell
npm run content
npm run android:sync
```

и пересобирайте APK. Папку `android/` повторно создавать не нужно.

---

## 🔐 Подписанный релиз (Google Play / RuStore)

Debug-APK подписан временным ключом. Для публикации нужен **свой ключ**.

### 1. Создайте keystore (один раз!)

```powershell
keytool -genkey -v -keystore codelearn-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias codelearn
```

Сохраните файл `.jks` и пароли в надёжном месте (и в резервной копии). **Потеряете ключ — не сможете выпускать обновления** того же приложения.

### 2а. Подпись через Android Studio

*Build → Generate Signed Bundle / APK* → **Android App Bundle** (для Google Play) или **APK** (для RuStore/сайта) → укажите `.jks`, alias, пароли → **release** → Create.

### 2б. Подпись через Gradle (автоматически)

Создайте `android/keystore.properties` (не загружайте в Git!):

```properties
storeFile=C:/keys/codelearn-release.jks
storePassword=ВАШ_ПАРОЛЬ
keyAlias=codelearn
keyPassword=ВАШ_ПАРОЛЬ
```

В `android/app/build.gradle` добавьте:

```groovy
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    // ...
    signingConfigs {
        release {
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
        }
    }
}
```

Сборка:

```powershell
npm run android:release
```

Результат:

- `android\app\build\outputs\bundle\release\app-release.aab` — для Google Play;
- `android\app\build\outputs\apk\release\app-release.apk` — подписанный APK.

### 3. Версия приложения

В `android/app/build.gradle`:

```groovy
defaultConfig {
    versionCode 2        // целое число, увеличивать при КАЖДОЙ публикации
    versionName "1.1.0"  // то, что видит пользователь
}
```

Для Windows — поле `"version"` в `package.json`.

### 4. Публикация

- **Google Play**: <https://play.google.com/console> (разовый взнос $25) → создать приложение → загрузить `.aab` → заполнить описание, скриншоты, политику конфиденциальности (приложение не собирает данные — так и укажите) → закрытое тестирование → продакшн. Для новых личных аккаунтов Google требует 14 дней тестирования с 12+ тестировщиками.
- **RuStore**: <https://console.rustore.ru> — бесплатно, принимает APK.
- **Сайт / GitHub Releases** — просто выложите APK и EXE.

---

## 🎨 Название, иконка, appId

| Что | Где менять |
|---|---|
| Название (десктоп) | `package.json` → `productName`, `build.productName` |
| Название (Android) | `capacitor.config.json` → `appName`, затем `android/app/src/main/res/values/strings.xml` |
| ID приложения | `package.json` → `build.appId` и `capacitor.config.json` → `appId` (менять **до** `android:init`, после публикации — нельзя) |
| Иконка Windows | `www/icons/icon.ico` |
| Иконка Android/Linux/macOS | `www/icons/icon-512.png` → `node tools/android-icons.cjs` |

Для адаптивных иконок Android лучше: Android Studio → правый клик по `res` → *New → Image Asset*.

---

## 🧯 Типичные ошибки

| Ошибка | Решение |
|---|---|
| `'node' не является внутренней или внешней командой` | Переустановите Node.js, перезапустите терминал |
| `npm ERR! EPERM` / `EBUSY` при `npm install` | Закройте приложение и редакторы, запустите терминал от имени администратора, удалите `node_modules` и повторите |
| `JAVA_HOME is not set` | Укажите `JAVA_HOME` на JDK 17 (шаг 1.4) |
| `Unsupported class file major version 65` | Gradle запущен на JDK 21 — выберите JDK 17 в настройках Gradle JDK |
| `SDK location not found` | Создайте `android/local.properties` со строкой `sdk.dir=C:\\Users\\<Вы>\\AppData\\Local\\Android\\Sdk` |
| `Could not find android platform` при `android:sync` | Сначала выполните `npm run android:init` |
| Gradle долго качает / таймаут | Нужен стабильный интернет при первой сборке; повторите *File → Sync Project with Gradle Files* |
| Белый экран в APK | Не выполнили `npm run content` и `npm run android:sync` перед сборкой; проверьте, что есть `www/data/content.js` |
| В приложении старые уроки | Выполните `npm run android:sync`; в веб-версии увеличьте версию `CACHE` в `www/sw.js` (`codelearn-v2` → `v3`) |
| «Приложение не установлено» на телефоне | Удалите старую версию, подписанную другим ключом (debug ↔ release) |
| `electron-builder` не качает Electron/NSIS | Проблема сети/прокси; повторите или задайте `ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/` |
| `cannot execute binary` при `dist:mac` на Windows | dmg собирается только на macOS — используйте облачную сборку |
| Антивирус удаляет exe | Ложное срабатывание на неподписанный файл — добавьте в исключения или подпишите сертификатом |

---

## ✅ Шпаргалка

```powershell
npm install              # один раз
npm run content          # после правки уроков
npm start                # запустить на ПК
npm run dist:win         # → dist\CodeLearn Setup X.Y.Z.exe
npm run android:init     # один раз
npm run android:sync     # после любых изменений
npm run android:apk      # → android\app\build\outputs\apk\debug\app-debug.apk
npm run android:release  # → подписанные .aab и .apk (после настройки keystore)
```
