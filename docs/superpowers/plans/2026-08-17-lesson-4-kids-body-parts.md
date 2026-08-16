# Урок 4 (дети) «Части тела» — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Создать детский урок 4 (`lessons/kids/w02-l1.html`) «Части тела: _Me duele la cabeza_» по образцу урока 3, подключить его на карту курса и в навигацию урока 3.

**Architecture:** Клонируем `lessons/kids/w01-l3.html` в `lessons/kids/w02-l1.html` и хирургически заменяем мета-инфо, CSS-дополнения, блоки HTML и весь inline-JS. Урок остаётся самодостаточным HTML со встроенными стилями и JS (Web Speech API для озвучки), прогресс — в localStorage. Интеграция в курс — одна строка `attachLessonLink` в `kids.html` + ссылка в навигации `w01-l3.html`.

**Tech Stack:** Чистый HTML/CSS/JS, Web Speech API (es-ES, rate 0.8), localStorage, без сборки.

## Global Constraints

- Спека: `docs/superpowers/specs/2026-08-17-lesson-4-kids-body-parts-design.md` — обязательна к прочтению перед началом.
- Все правки — по образцу `lessons/kids/w01-l3.html`: CSS-переменные, шрифты Baloo 2 + Nunito, классы, стиль функций.
- Только проверенные YouTube-embed: `ppUnmAvLhwE` (Smile and Learn — partes del cuerpo) и `7EtQs96XBuA` (CantaJuego — TPR-песня). Больше никаких видео.
- Wordwall — только ссылки-карточки на поиск (`https://wordwall.net/ru/community?q=partes+del+cuerpo` и `?q=me+duele+me+duelen`), НЕ iframe.
- localStorage-ключи: `mudro_gender` (общий), `mudro_badge_doctor`='true', `mudro_lesson_4_done`=ISO-строка, `mudro_selfcheck_lesson4`=JSON {q1..q5}.
- В новых файлах/коде не добавлять комментарии.
- Без npm: `node --check`, `node --test tests/app-logic.test.js` — напрямую.
- Коммиты — на русском, стиль репозитория.

## Контракт (DOM-id и JS-функции, используемые задачами)

Все DOM-id и функции ниже определяются/используются в задачах 2–5. Список для сверки (чтобы имя в поздней задаче совпадало с ранней):

**DOM-id (HTML-секции):**
- `warmup-grid` (блок 1), `rand-body-output` (блок 2), `body-grid` (блок 3), `simon-cmd`, `simon-opts`, `simon-stars`, `simon-score-txt`, `simon-feedback`, `simon-start` (блок 3), `pain-chips`, `pain-slider`, `pain-es`, `pain-ru` (блок 4), `symptom-grid` (блок 5), `sim-stars`, `sim-score`, `sim-teacher`, `sim-situation`, `sim-prompt`, `sim-hint`, `sim-options`, `sim-feedback`, `sim-start` (блок 6), `badge-btn`, `badge-stamped` (блок 7), `words-body`, `words-doler`, `words-symptoms`, `words-doc` (слова), `match-left`, `match-right`, `match-feedback`, `sb-target`, `sb-pool`, `sb-result`, `level-scenarios`, `duele-scenarios` (тренажёры), `gb-boy`, `gb-girl` (род).

**JS-функции/данные (определяются в задаче 5, используются в той же задаче):**
- Данные: `BODY_PARTS`, `WARMUP`, `RANDOM_BODY`, `SIMON_ROUNDS`, `SYMPTOMS`, `DOC_ROUNDS`, `WORDS_DOLER`, `WORDS_SYMPTOMS`, `WORDS_DOC`, `LEVEL_SCENARIOS`, `DUELE_DATA`.
- Инфраструктура: `speak`, `speakCard`, `shuffle`, `confetti`, `renderWordGrid`, `bodyById`.
- Блок 1: `renderWarmup`, `revealBody`.
- Блок 2: `pressRandomBody`.
- Блок 3: `renderBodyCards`, `startSimon`, `playSimon`, `checkSimon`, `updateSimonStars`, `endSimon`.
- Блок 4: `renderPainChips`, `painLevel`, `updatePain`.
- Блок 5: `symptomEs`, `renderSymptoms`.
- Блок 6: `startSim`, `playRound`, `showSimOptions`, `checkSim`, `updateStars`, `endSim`, `docCorrect`.
- Блок 7: `stampBadge`.
- Слова/тренажёры: `renderWords`, `getMatchPairs`, `renderMatch`, `selectMatch`, `resetMatch`, `sbPhrases`, `renderSB`, `addWord`, `updateSBTarget`, `nextSB`, `renderLevelQuiz`, `checkLevel`, `renderDueleQuiz`, `checkDuele`.
- Род: `setGender`, `renderGenderButtons`.

---

### Task 1: Клонировать шаблон и заменить мета-инфо

**Files:**
- Create: `lessons/kids/w02-l1.html` (копия `lessons/kids/w01-l3.html`)
- Modify: `lessons/kids/w02-l1.html` (мета-инфо)

**Interfaces:**
- Consumes: `lessons/kids/w01-l3.html` (шаблон, полный текст 1–1645).
- Produces: файл-копия с мета-инфо урока 4; остальные секции пока не тронуты.

- [ ] **Step 1: Скопировать шаблон**

Run (из корня репозитория):
```powershell
Copy-Item -LiteralPath 'lessons/kids/w01-l3.html' -Destination 'lessons/kids/w02-l1.html'
```
Expected: файл создан. Проверка: `Test-Path -LiteralPath 'lessons/kids/w02-l1.html'` → True.

- [ ] **Step 2: Сменить `<title>` и `nav-right`**

Edit tool, oldString:
```html
<title>Урок 3: Эмоции — «Мне хорошо» / «Мне грустно» — Школа МУДРО</title>
```
newString:
```html
<title>Урок 4: Части тела — «У меня болит» — Школа МУДРО</title>
```

Edit tool, oldString:
```html
  <div class="nav-right">Станция 1 · Supervivencia · Урок 3 из 60</div>
```
newString:
```html
  <div class="nav-right">Станция 1 · Supervivencia · Урок 4 из 60</div>
```

- [ ] **Step 3: Заменить герой (tag, заголовок, подзаголовок)**

Edit tool, oldString:
```html
<header class="hero">
  <span class="lesson-tag">😄 УРОК 3 · НЕДЕЛЯ 1</span>
  <h1>Эмоции: <span>«Мне хорошо» / «Мне грустно»</span></h1>
  <p class="sub">В Испании эмоции — это не слабость, а способ общения! Сегодня ты научишься отвечать учителю: «Estoy un poco nervioso, pero ¡muy contento!»</p>
</header>
```
newString:
```html
<header class="hero">
  <span class="lesson-tag">🩺 УРОК 4 · НЕДЕЛЯ 2</span>
  <h1>Части тела: <span>«У меня болит…»</span></h1>
  <p class="sub">Ты в Испании, и вдруг что-то заболело! Сегодня ты научишься говорить по-испански: «Me duele la cabeza» — и смело пойдёшь в enfermería, если что-то заболит.</p>
</header>
```

- [ ] **Step 4: Заменить цели и итоговую ситуацию**

Edit tool, oldString:
```html
    <div class="goals-grid">
      <div class="goal-item"><span class="emoji">😄</span> Называть 6 основных чувств по-испански</div>
      <div class="goal-item"><span class="emoji">❓</span> Спрашивать и отвечать «¿Cómo estás?»</div>
      <div class="goal-item"><span class="emoji">🔄</span> Различать SER и ESTAR</div>
      <div class="goal-item"><span class="emoji">🎭</span> Подбирать эмоцию к школьной ситуации</div>
      <div class="goal-item"><span class="emoji">📔</span> Начать Emoji-дневник настроения</div>
      <div class="goal-item"><span class="emoji">🌡️</span> Градация: очень / чуть-чуть / нормально</div>
    </div>

    <div class="script" style="margin-top:18px">
      <strong>Итоговая ситуация:</strong> в первый день в испанской школе учитель спрашивает <em>«¿Cómo estás?»</em>, а ты уверенно отвечаешь:<br>
      <strong>«Estoy un poco nervioso, pero ¡muy contento!»</strong> — «Я немного нервничаю, но очень рад!» 🎉
    </div>
```
newString:
```html
    <div class="goals-grid">
      <div class="goal-item"><span class="emoji">🧍</span> Называть 12 частей тела по-испански</div>
      <div class="goal-item"><span class="emoji">🩹</span> Говорить «Me duele...» — что болит</div>
      <div class="goal-item"><span class="emoji">🦷</span> Различать duele (болит) и duelen (болят)</div>
      <div class="goal-item"><span class="emoji">🤒</span> Описывать симптомы: fiebre, tos, mareado</div>
      <div class="goal-item"><span class="emoji">🩺</span> Отвечать врачу на 5 вопросов</div>
      <div class="goal-item"><span class="emoji">🚨</span> Использовать SOS-фразы в медпункте</div>
    </div>

    <div class="script" style="margin-top:18px">
      <strong>Итоговая ситуация:</strong> в испанской школе у тебя что-то заболело, и ты подходишь к учителю:<br>
      <strong>«Profe, me duele la rodilla. ¿Puedo ir a la enfermería, por favor?»</strong> — «Учитель, у меня болит колено. Можно пойти в медпункт, пожалуйста?» 🩺
    </div>
```

- [ ] **Step 5: Заменить подпись переключателя рода**

Edit tool, oldString:
```html
    <p style="color:var(--ink-soft);font-weight:700;margin:6px 0">В испанском мальчик говорит <em>cansado</em>, а девочка — <em>cansada</em>! Выбери, кто ты, и все фразы урока станут правильными.</p>
```
newString:
```html
    <p style="color:var(--ink-soft);font-weight:700;margin:6px 0">В испанском мальчик говорит <em>mareado</em>, а девочка — <em>mareada</em>! Выбери, кто ты, и все фразы урока станут правильными.</p>
```

- [ ] **Step 6: Проверка JS-синтаксиса**

Run (из корня репозитория):
```powershell
$html=[System.IO.File]::ReadAllText((Resolve-Path 'lessons/kids/w02-l1.html'))
$js=[regex]::Match($html,'(?s)<script>(.*?)</script>').Groups[1].Value
[System.IO.File]::WriteAllText('C:\Users\Lenovo\AppData\Local\Temp\opencode\l4-check.js',$js,[System.Text.Encoding]::UTF8)
node --check 'C:\Users\Lenovo\AppData\Local\Temp\opencode\l4-check.js'
```
Expected: нет вывода, код возврата 0 (клонированный JS урока 3 синтаксически валиден).

- [ ] **Step 7: Commit**

```bash
git add lessons/kids/w02-l1.html
git commit -m "урок 4 детям: клонирование шаблона и мета-инфо"
```

---

### Task 2: CSS-дополнения для новых блоков

**Files:**
- Modify: `lessons/kids/w02-l1.html` (CSS внутри `<style>`, перед `@media(max-width:600px)`)

**Interfaces:**
- Consumes: классы `.sim-btn`, `.sos-*`, `.thermo-*`, `.word-grid`, `.match-*`, `.sb-*`, `.level-*`, `.badge-*`, `.sim-*`, `.tools-table`, `.script`, `.homework`, `.selfcheck-table` — уже есть в шаблоне.
- Produces: CSS для `.body-*`, `.simon-*`, `.symptom-*` (используются в задачах 3 и 5).

- [ ] **Step 1: Добавить новые CSS-правила**

Edit tool, oldString:
```css
  @media(max-width:600px){
    .sos-grid{grid-template-columns:1fr 1fr}
    .emotion-grid{grid-template-columns:1fr 1fr}
    .match-columns{grid-template-columns:1fr}
    .word-grid{grid-template-columns:repeat(auto-fill,minmax(130px,1fr))}
    .diary-slots{grid-template-columns:repeat(4,1fr)}
  }
```
newString:
```css
  /* ---------- BODY PARTS (12 частей тела) ---------- */
  .body-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin:16px 0}
  .body-card{background:#fff;border-radius:16px;padding:16px 10px;text-align:center;cursor:pointer;border:3px solid var(--soft);transition:.2s;box-shadow:0 4px 12px rgba(0,0,0,.05);user-select:none;position:relative}
  .body-card:hover{transform:translateY(-4px);border-color:var(--sun)}
  .body-card.active{transform:scale(1.03);background:#FFF5F5}
  .body-emoji{font-size:2.2rem;display:block;margin-bottom:6px}
  .body-es{font-family:'Baloo 2',cursive;font-size:1.15rem;color:var(--terra);display:block}
  .body-ru{font-size:.85rem;color:var(--ink-soft);font-weight:700;display:block;margin-top:2px}
  .body-gesture{font-size:.8rem;color:var(--purple);font-weight:800;background:#F3E8FF;padding:4px 10px;border-radius:999px;display:inline-block;margin-top:8px}
  .body-art{position:absolute;top:8px;right:10px;font-weight:800;font-size:.7rem;padding:2px 8px;border-radius:999px}
  .body-art.fem{background:#ffe4ec;color:#c2416c}
  .body-art.masc{background:#e0f0ff;color:#1a6bb5}

  /* ---------- SIMÓN DICE ---------- */
  .simon-zone{background:linear-gradient(135deg,#EAF2FF,#DDEBFF);border-radius:18px;padding:22px;margin:16px 0;text-align:center}
  .simon-cmd{font-family:'Baloo 2',cursive;font-size:1.4rem;color:var(--blue);min-height:60px;margin:10px 0;display:flex;flex-direction:column;gap:4px}
  .simon-cmd .ru{font-size:.95rem;color:var(--ink-soft);font-weight:700;font-style:italic;font-family:'Nunito',sans-serif}
  .simon-opts{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:12px 0}
  .simon-opt{background:#fff;border:3px solid var(--blue);border-radius:12px;padding:8px 14px;font-weight:800;cursor:pointer;transition:.15s;font-family:'Nunito';font-size:.95rem}
  .simon-opt:hover:not(:disabled){background:var(--blue);color:#fff}
  .simon-opt.correct{background:var(--teal);border-color:var(--teal);color:#fff;transform:scale(1.05)}
  .simon-opt.wrong{background:#fde8e5;border-color:var(--red);animation:shake .4s}
  .simon-opt:disabled{cursor:not-allowed}
  .simon-opt.trap{background:#fff;border-color:var(--red);color:var(--red)}
  .simon-opt.trap:hover:not(:disabled){background:var(--red);color:#fff}
  .simon-score{font-weight:800;margin-top:10px}
  .simon-stars{font-size:1.6rem;letter-spacing:3px}

  /* ---------- SYMPTOMS ---------- */
  .symptom-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin:16px 0}
  .symptom-card{background:#fff;border-radius:16px;padding:18px;text-align:center;cursor:pointer;border:3px solid #ffe0e0;transition:.2s;box-shadow:0 4px 12px rgba(0,0,0,.05)}
  .symptom-card:hover{transform:translateY(-4px);border-color:var(--red)}
  .symptom-card.active{transform:scale(1.03);background:#FFF5F5}
  .symptom-emoji{font-size:2.4rem;display:block;margin-bottom:6px}
  .symptom-es{font-family:'Baloo 2',cursive;font-size:1.2rem;color:var(--red);display:block}
  .symptom-ru{font-size:.85rem;color:var(--ink-soft);font-weight:700;display:block;margin-top:2px}

  @media(max-width:600px){
    .sos-grid{grid-template-columns:1fr 1fr}
    .body-grid{grid-template-columns:1fr 1fr}
    .symptom-grid{grid-template-columns:1fr 1fr}
    .match-columns{grid-template-columns:1fr}
    .word-grid{grid-template-columns:repeat(auto-fill,minmax(130px,1fr))}
    .diary-slots{grid-template-columns:repeat(4,1fr)}
  }
```

- [ ] **Step 2: Проверка**

Run `node --check` на извлечённом скрипте (команда из Task 1 Step 6) — Expected: код возврата 0.

- [ ] **Step 3: Commit**

```bash
git add lessons/kids/w02-l1.html
git commit -m "урок 4 детям: css для новых блоков"
```

---

### Task 3: Блоки 1–7 (статический HTML)

**Files:**
- Modify: `lessons/kids/w02-l1.html` — секции от `<!-- БЛОК 1: РАЗОГРЕВ -->` до `<!-- СЛОВА УРОКА -->`

**Interfaces:**
- Consumes: классы из Task 2 и шаблона.
- Produces: DOM-id `warmup-grid`, `rand-body-output`, `body-grid`, `simon-cmd`, `simon-opts`, `simon-stars`, `simon-score-txt`, `simon-feedback`, `simon-start`, `pain-chips`, `pain-slider`, `pain-es`, `pain-ru`, `symptom-grid`, `sim-stars`, `sim-score`, `sim-teacher`, `sim-situation`, `sim-prompt`, `sim-hint`, `sim-options`, `sim-feedback`, `sim-start`, `badge-btn`, `badge-stamped` — заполняются JS в Task 5.

- [ ] **Step 1: Заменить секции блоков 1–7**

В Edit tool: oldString = точное содержимое текущего файла между строками-маркерами `  <!-- БЛОК 1: РАЗОГРЕВ -->` (включительно) и `  <!-- СЛОВА УРОКА -->` (исключительно), т.е. строки 392–649 скопированного шаблона. Прочитай файл и скопируй блок дословно (от `  <!-- БЛОК 1: РАЗОГРЕВ -->` до строки перед `  <!-- СЛОВА УРОКА -->`).

newString:
```html
  <!-- БЛОК 1: РАЗОГРЕВ -->
  <section class="block" style="--c:#F4A261">
    <div class="block-head">
      <h2 class="block-title">🔁 Разогрев: эмоции → тело</h2>
      <span class="time-badge">⏱ 3 минуты</span>
    </div>
    <p class="block-sub">Вспоминаем Урок 3! Наши эмоции живут в теле. Нажми на эмоцию — узнаешь, что говорит испанское тело!</p>

    <div class="script">
      Учитель спрашивает: <strong>«Cuando estás nervioso, ¿qué te duele?»</strong> — «Когда ты нервничаешь, что у тебя болит?»<br>
      Нажимай на карточки и запоминай связки «эмоция → тело». 👇
    </div>

    <div class="sos-grid" id="warmup-grid"></div>
  </section>

  <!-- БЛОК 2: ЗАЧЕМ НАМ ТЕЛО -->
  <section class="block" style="--c:#E8604C">
    <div class="block-head">
      <h2 class="block-title">💪 Зачем нам знать части тела?</h2>
      <span class="time-badge">⏱ 5 минут</span>
    </div>
    <p class="block-sub">Ты в Испании, и вдруг... что-то заболело! Части тела — это язык, на котором мы говорим о себе.</p>

    <div class="script">
      В испанской школе есть <strong>enfermería</strong> (медпункт). Если тебе плохо, ты говоришь учителю, а он зовёт медсестру.<br>
      Медсестра спросит: <strong>«¿Qué te pasa?»</strong> — «Что с тобой?» А если очень плохо — звони по номеру <strong>112</strong>: он работает по всей Испании и в Европе!<br>
      Готов отвечать? Сначала посмотри, как называются части тела!
    </div>

    <div class="video-zone">
      <h4 style="margin-bottom:8px">📺 Видео: LAS PARTES DEL CUERPO</h4>
      <p style="color:var(--ink-soft);font-weight:700;margin-bottom:10px">
        Smile and Learn — смотри, слушай и показывай на себе!
      </p>
      <div class="video-wrapper">
        <iframe src="https://www.youtube.com/embed/ppUnmAvLhwE"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen></iframe>
      </div>
      <div class="video-note">💡 Включи субтитры (CC) → Испанский, если нужно</div>
    </div>

    <div class="sos-zone">
      <p style="font-weight:800;margin-bottom:12px">Нажми на SOS-кнопку (Урок 2) — услышишь вопрос медсестры и случайную фразу о боли!</p>
      <button class="sos-big-btn" onclick="pressRandomBody()">🚨</button>
      <div class="sos-output" id="rand-body-output">
        <div class="es">Нажми кнопку 👆</div>
        <div class="ru">—</div>
      </div>
    </div>
  </section>

  <!-- БЛОК 3: 12 ЧАСТЕЙ ТЕЛА -->
  <section class="block" style="--c:#2A9D8F">
    <div class="block-head">
      <h2 class="block-title">🧩 12 частей тела</h2>
      <span class="time-badge">⏱ 10 минут</span>
    </div>
    <p class="block-sub">Ядро урока! Нажимай на карточку — услышишь озвучку. Показывай части тела на себе и повторяй!</p>

    <div class="body-grid" id="body-grid"></div>

    <div class="script">
      <strong>Запомни род!</strong> По-испански у каждой части тела есть род: <span style="color:#c2416c;font-weight:800">красный = la (она)</span>, <span style="color:#1a6bb5;font-weight:800">синий = el (он)</span>.<br>
      <strong>TPR-песня:</strong> CantaJuego — повторяй движения и пой! 🎶
    </div>

    <div class="video-zone">
      <div class="video-wrapper">
        <iframe src="https://www.youtube.com/embed/7EtQs96XBuA"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen></iframe>
      </div>
      <div class="video-note">🎶 «Cabeza, hombros, rodillas y pies» — голова, плечи, колени и ноги!</div>
    </div>

    <div class="simon-zone">
      <h4>🎲 Игра «Simón dice»</h4>
      <p style="color:var(--ink-soft);font-weight:700;margin:6px 0">Симон говорит команду — нажми нужную часть тела! Если Симон <strong>не</strong> сказал «Simón dice» — нажми «🚫 Стою спокойно»!</p>
      <div class="simon-cmd" id="simon-cmd">Нажми «▶ Начать»!</div>
      <div class="simon-opts" id="simon-opts"></div>
      <div class="simon-score"><span class="simon-stars" id="simon-stars">☆☆☆☆☆☆</span><br><span id="simon-score-txt">Звёзд Симона: 0/6</span></div>
      <div class="sim-feedback" id="simon-feedback"></div>
      <button class="sim-btn" id="simon-start" onclick="startSimon()">▶ Начать</button>
    </div>
  </section>

  <!-- БЛОК 4: ГЛАГОЛ DOLER -->
  <section class="block" style="--c:#2274A5">
    <div class="block-head">
      <h2 class="block-title">🩹 Глагол DOLER — «болит»</h2>
      <span class="time-badge">⏱ 10 минут</span>
    </div>
    <p class="block-sub">Главный глагол урока! Когда что-то болит, оно «болИтся» тебе. Нажимай на строки и слушай!</p>

    <div class="script">
      <strong>Механика:</strong> одна часть тела → <em>duele</em> (болит). Несколько частей → <em>duelen</em> (болят).<br>
      <span class="grammar-hint" data-hint="Me duele la cabeza = «Мне болит голова». Дословно: «Голова болит мне». Me = мне, le = ему/ей.">Me duele la cabeza</span> · <span class="grammar-hint" data-hint="Me duelen los ojos = «У меня болят глаза». Частей несколько — глагол duelen во множественном числе!">Me duelen los ojos</span>
    </div>

    <table class="tools-table" style="--c:#2274A5">
      <tr><th>Фраза</th><th>Перевод</th><th>🔊</th></tr>
      <tr onclick="speak('Me duele la cabeza')" style="cursor:pointer"><td><strong>Me duele la cabeza</strong></td><td>У меня болит голова</td><td><button class="speak-btn" style="--c:#2274A5;padding:4px 10px;font-size:.8rem">🔊</button></td></tr>
      <tr onclick="speak('Me duelen los ojos')" style="cursor:pointer"><td><strong>Me duelen los ojos</strong></td><td>У меня болят глаза</td><td><button class="speak-btn" style="--c:#2274A5;padding:4px 10px;font-size:.8rem">🔊</button></td></tr>
      <tr onclick="speak('Le duele la rodilla')" style="cursor:pointer"><td><strong>Le duele la rodilla</strong></td><td>У него/неё болит колено</td><td><button class="speak-btn" style="--c:#2274A5;padding:4px 10px;font-size:.8rem">🔊</button></td></tr>
      <tr onclick="speak('Le duelen los pies')" style="cursor:pointer"><td><strong>Le duelen los pies</strong></td><td>У него/неё болят стопы</td><td><button class="speak-btn" style="--c:#2274A5;padding:4px 10px;font-size:.8rem">🔊</button></td></tr>
    </table>

    <div class="thermo-zone">
      <h4>🌡 Шкала боли (1–10)</h4>
      <p style="color:var(--ink-soft);font-weight:700;margin:6px 0">Выбери часть тела, потом уровень боли: un poco (немного), bastante (ощутимо) или mucho (сильно).</p>

      <div class="thermo-chips" id="pain-chips"></div>

      <input type="range" min="1" max="10" value="5" class="thermo-slider" id="pain-slider" oninput="updatePain()">
      <div class="thermo-labels">
        <span class="l-grn">🟢 1–3 un poco</span>
        <span class="l-yel">🟡 4–7 bastante</span>
        <span class="l-red">🔴 8–10 mucho</span>
      </div>

      <div class="thermo-output">
        <div class="es" id="pain-es">Me duele la cabeza.</div>
        <div class="ru" id="pain-ru">У меня болит голова.</div>
      </div>
      <button class="speak-btn" style="--c:#2274A5;font-size:.95rem;padding:10px 20px" onclick="speak(document.getElementById('pain-es').textContent)">🔊 Произнести</button>
    </div>
  </section>

  <!-- БЛОК 5: СИМПТОМЫ -->
  <section class="block" style="--c:#D62828">
    <div class="block-head">
      <h2 class="block-title">🤒 Симптомы</h2>
      <span class="time-badge">⏱ 8 минут</span>
    </div>
    <p class="block-sub">Мало сказать, что болит, — надо объяснить, как ты себя чувствуешь! Нажимай на карточку и повторяй.</p>

    <div class="script">
      <strong>Правило:</strong> <em>tener</em> (иметь) + что у тебя есть: <em>Tengo fiebre</em> (у меня температура).<br>
      <em>estar</em> (быть) + какой ты: <em>Estoy cansado</em> (я устал). Вспомни SER vs ESTAR из Урока 3!
    </div>

    <div class="symptom-grid" id="symptom-grid"></div>

    <div class="script">
      <strong>Связь с эмоциями (Урок 3):</strong> часто мы не болеем, а просто нервничаем: <em>Estoy nervioso → Me duele el estómago</em> (живот).<br>
      Если ты устал: <em>Estoy cansado → Me duelen los ojos</em>. Эмоции живут в теле!
    </div>
  </section>

  <!-- БЛОК 6: СИМУЛЯЦИЯ -->
  <section class="block" style="--c:#8338EC">
    <div class="block-head">
      <h2 class="block-title">🩺 Симуляция «У врача»</h2>
      <span class="time-badge">⏱ 7 минут</span>
    </div>
    <p class="block-sub">Ты в кабинете врача в Испании. Врач задаёт вопросы — выбери правильный ответ! 5 раундов.</p>

    <div class="sim-game">
      <div class="sim-header">
        <div class="sim-stars" id="sim-stars">☆☆☆☆☆</div>
        <div class="sim-score" id="sim-score">Собери 5 звёзд доктора! ⭐</div>
      </div>

      <div class="sim-teacher" id="sim-teacher">
        <div class="round-label">🩺 Врач:</div>
        <div class="situation" id="sim-situation">Нажми «Начать приём»!</div>
      </div>

      <div class="sim-prompt" id="sim-prompt" style="display:none">
        💡 <span class="hint" id="sim-hint">—</span><br>👇 Как ты ответишь врачу? Выбери фразу:
      </div>
      <div class="sim-options" id="sim-options" style="display:none"></div>
      <div class="sim-feedback" id="sim-feedback"></div>

      <button class="sim-btn" id="sim-start" onclick="startSim()">🩺 Начать приём</button>
    </div>
  </section>

  <!-- БЛОК 7: БЕЙДЖ -->
  <section class="block" style="--c:#FFBE0B">
    <div class="block-head">
      <h2 class="block-title">🩺 Бейдж «Доктор»</h2>
      <span class="time-badge">⏱ 2 минуты</span>
    </div>
    <p class="block-sub">Ты прошёл весь урок! Теперь ты умеешь говорить, что у тебя болит, — как в испанской школе.</p>

    <div class="badge-zone">
      <div class="badge-icon">🩺</div>
      <h3>Доктор</h3>
      <p style="font-weight:700;color:var(--ink-soft)">Ты научился рассказывать врачу о своём здоровье по-испански!</p>
      <button class="badge-btn" id="badge-btn" onclick="stampBadge()">🏆 Получить бейдж!</button>
      <div class="badge-stamped" id="badge-stamped">
        🎉 ¡Enhorabuena! Бейдж «Доктор» 🩺 добавлен в твой паспорт!
      </div>
    </div>

    <div class="script">
      <strong>Итоговая ситуация урока:</strong><br>
      Ты подходишь к учителю и говоришь: <strong>«Profe, me duele la rodilla. ¿Puedo ir a la enfermería, por favor?»</strong><br>
      «Учитель, у меня болит колено. Можно пойти в медпункт, пожалуйста?» 🎉
    </div>
  </section>
```

- [ ] **Step 2: Проверка баланса тегов**

Run (из корня репозитория):
```powershell
$h=[System.IO.File]::ReadAllText((Resolve-Path 'lessons/kids/w02-l1.html'))
'dv open/close: ' + [regex]::Matches($h,'<div[ >]').Count + '/' + [regex]::Matches($h,'</div>').Count
'sc open/close: ' + [regex]::Matches($h,'<section[ >]').Count + '/' + [regex]::Matches($h,'</section>').Count
```
Expected: open/close равны в обеих строках.

- [ ] **Step 3: Commit**

```bash
git add lessons/kids/w02-l1.html
git commit -m "урок 4 детям: блоки 1-7"
```

---

### Task 4: Слова урока, тренажёры, Wordwall, домашка, самопроверка, навигация

**Files:**
- Modify: `lessons/kids/w02-l1.html` — секции `<!-- СЛОВА УРОКА -->`, `<!-- ТРЕНАЖЁРЫ -->`, `<!-- WORDWALL -->`, `<!-- ДОМАШКА -->`, самопроверка, `<!-- НАВИГАЦИЯ -->`

**Interfaces:**
- Consumes: DOM-id из Task 3, плюс новые id: `words-body`, `words-doler`, `words-symptoms`, `words-doc`, `match-left`, `match-right`, `match-feedback`, `sb-target`, `sb-pool`, `sb-result`, `level-scenarios`, `duele-scenarios`, `trainer-match`, `trainer-builder`, `trainer-thermo`, `trainer-duelen`.
- Produces: якоря `#trainer-match`, `#trainer-builder`, `#trainer-thermo`, `#trainer-duelen` (используются в домашке).

- [ ] **Step 1: Заменить секцию «Слова урока»**

Edit tool, oldString — текущая секция, начинающаяся с маркера `  <!-- СЛОВА УРОКА -->` и заканчивающаяся `  </section>` непосредственно перед маркером `  <!-- ТРЕНАЖЁРЫ -->`. Прочитай файл, найди по маркерам и скопируй блок дословно.

newString:
```html
  <!-- СЛОВА УРОКА -->
  <section class="block" style="--c:#8338EC">
    <div class="block-head">
      <h2 class="block-title">🗣 Слова урока</h2>
    </div>

    <h4>🧍 Части тела</h4>
    <div class="word-grid" id="words-body"></div>

    <h4 style="margin-top:18px">🩹 Doler: боль</h4>
    <div class="word-grid" id="words-doler"></div>

    <h4 style="margin-top:18px">🤒 Симптомы</h4>
    <div class="word-grid" id="words-symptoms"></div>

    <h4 style="margin-top:18px">🩺 У врача</h4>
    <div class="word-grid" id="words-doc"></div>
  </section>
```

- [ ] **Step 2: Заменить секцию «Тренажёры»**

Edit tool, oldString — текущая секция, начинающаяся с маркера `  <!-- ТРЕНАЖЁРЫ -->` и заканчивающаяся `  </section>` непосредственно перед маркером `  <!-- WORDWALL -->`. Прочитай файл, найди по маркерам и скопируй блок дословно.

newString:
```html
  <!-- ТРЕНАЖЁРЫ -->
  <section class="block" style="--c:#2A9D8F" id="trainers">
    <div class="block-head">
      <h2 class="block-title">🧩 Тренажёры для закрепления</h2>
    </div>

    <!-- Тренажёр 1: Match -->
    <div class="match-game" id="trainer-match">
      <h4>🧩 Сопоставление: «испанский ↔ русский»</h4>
      <p style="color:var(--ink-soft);font-weight:700;margin:8px 0">Выбери слово слева, потом его перевод справа. 12 пар!</p>
      <div class="match-columns">
        <div class="match-col" id="match-left"></div>
        <div class="match-col" id="match-right"></div>
      </div>
      <div class="match-feedback" id="match-feedback"></div>
      <button class="match-reset" onclick="resetMatch()">🔄 Начать заново</button>
    </div>

    <!-- Тренажёр 2: Sentence Builder -->
    <div class="sb" id="trainer-builder">
      <h4>🎯 Конструктор фраз: собери «Me duele...»</h4>
      <p style="color:var(--ink-soft);font-weight:700;margin:8px 0">Нажимай на слова в правильном порядке!</p>
      <div class="sb-target" id="sb-target">…</div>
      <div class="sb-pool" id="sb-pool"></div>
      <div class="sb-result" id="sb-result"></div>
      <button class="match-reset" style="background:var(--red);box-shadow:0 5px 0 #a82020" onclick="nextSB()">Следующая фраза →</button>
    </div>

    <!-- Тренажёр 3: Шкала боли -->
    <div class="level-quiz" id="trainer-thermo">
      <h4>🌡️ Тренажёр шкалы боли: подбери уровень</h4>
      <p style="color:var(--ink-soft);font-weight:700;margin:8px 0">В каждой ситуации выбери уровень боли: un poco (немного), bastante (ощутимо) или mucho (сильно).</p>
      <div id="level-scenarios"></div>
    </div>

    <!-- Тренажёр 4: duele/duelen -->
    <div class="level-quiz" id="trainer-duelen">
      <h4>⚖️ Тренажёр: duele или duelen?</h4>
      <p style="color:var(--ink-soft);font-weight:700;margin:8px 0">Одна часть — duele, несколько частей — duelen. Выбери правильный глагол!</p>
      <div id="duele-scenarios"></div>
    </div>
  </section>
```

- [ ] **Step 3: Заменить секцию «Wordwall»**

Edit tool, oldString — текущая секция, начинающаяся с маркера `  <!-- WORDWALL -->` и заканчивающаяся `  </section>` непосредственно перед маркером `  <!-- ДОМАШКА -->`. Прочитай файл, найди по маркерам и скопируй блок дословно.

newString:
```html
  <!-- WORDWALL -->
  <section class="block" style="--c:#2274A5">
    <div class="block-head">
      <h2 class="block-title">🎮 Wordwall-игры</h2>
    </div>
    <p class="block-sub">Поиграй в интерактивные игры по теме урока! Ссылки открываются в новой вкладке.</p>

    <div class="ww-zone">
      <div class="ww-card">
        <h5>🧍 Partes del cuerpo</h5>
        <p>Игры на Wordwall по частям тела: найди пару, викторина и другие!</p>
        <a class="ww-link" href="https://wordwall.net/ru/community?q=partes+del+cuerpo" target="_blank" rel="noopener">🎮 Играть на Wordwall</a>
      </div>
      <div class="ww-card">
        <h5>🩹 Me duele / Me duelen</h5>
        <p>Игры на Wordwall: как сказать, что у тебя болит!</p>
        <a class="ww-link" href="https://wordwall.net/ru/community?q=me+duele+me+duelen" target="_blank" rel="noopener">🎮 Играть на Wordwall</a>
      </div>
    </div>
  </section>
```

- [ ] **Step 4: Заменить «Домашнее задание»**

Edit tool, oldString — текущая секция `  <section class="homework">` ... `  </section>` (найди по маркеру `  <!-- ДОМАШКА -->`/`  <!-- САМОПРОВЕРКА -->`, скопируй дословно).

newString:
```html
  <section class="homework">
    <h3>🏡 Домашнее задание</h3>

    <div class="task">
      <div class="task-num star">1</div>
      <div>
        <strong>Семейная игра «Покажи и назови»</strong> · 5 мин ⭐<br>
        Показывай на себе части тела и называй их по-испански. Родители повторяют за тобой и угадывают по-русски!
      </div>
    </div>

    <div class="task">
      <div class="task-num">2</div>
      <div>
        <strong>Скажи, что болит</strong> · 3 мин<br>
        Потренируйся со шкалой боли: <em>Me duele la cabeza</em> · <em>Me duelen los pies</em> · <em>Me duele bastante la rodilla</em>.
      </div>
    </div>

    <div class="task">
      <div class="task-num">3</div>
      <div>
        <strong>Ролевая игра «У врача»</strong> · 7 мин<br>
        Мама или папа — врач, ты — пациент. Повтори диалог из урока: «¿Qué te pasa?» → «Me duele...». Поменяйтесь местами!
      </div>
    </div>

    <div class="task">
      <div class="task-num">4</div>
      <div>
        <strong>Повтори все новые слова</strong> · 2 мин<br>
        Нажимай на карточки раздела «Слова урока»: слушай и повторяй вслух.
      </div>
    </div>

    <div class="task">
      <div class="task-num star">5</div>
      <div>
        <strong>Тренажёры</strong> · 10 мин ⭐<br>
        Пройди все тренажёры урока:<br>
        <a href="#trainer-match" class="anchor">🧩 Сопоставление (12 пар)</a>
        <a href="#trainer-builder" class="anchor">🎯 Конструктор фраз (5 фраз)</a>
        <a href="#trainer-thermo" class="anchor">🌡️ Шкала боли (4 ситуации)</a>
        <a href="#trainer-duelen" class="anchor">⚖️ duele / duelen (4 фразы)</a>
      </div>
    </div>

    <div class="task">
      <div class="task-num">6</div>
      <div>
        <strong>Песня «Cabeza, hombros, rodillas y pies»</strong> · 3 мин<br>
        Посмотри ещё раз и спой, показывая на себе: голова, плечи, колени и ноги!
      </div>
    </div>

    <div class="task">
      <div class="task-num">7</div>
      <div>
        <strong>Самопроверка «Смайлик»</strong><br>
        Честно оцени себя по 5 критериям (таблица ниже).
      </div>
    </div>

    <div class="task">
      <div class="task-num star">8</div>
      <div>
        <strong>🏠 Семейная миссия недели 2</strong> · 5 мин ⭐<br>
        «Осмотр дома на безопасность»: вместе с родителями проверьте дом — ты называешь части тела по-испански, а родители находят предметы и места вокруг (окна, двери, аптечку). Найди и опасные места — острые углы!
      </div>
    </div>
  </section>
```

- [ ] **Step 5: Заменить таблицу самопроверки**

Edit tool, oldString — все 5 строк `<tr>` внутри `<tbody>` таблицы самопроверки (найди по маркеру `  <!-- САМОПРОВЕРКА -->` и первой строке с `name="q1"`, скопируй дословно).

newString:
```html
      <tbody>
        <tr>
          <td>Назвать 12 частей тела</td>
          <td><input type="radio" name="q1" value="great"></td>
          <td><input type="radio" name="q1" value="ok"></td>
          <td><input type="radio" name="q1" value="hard"></td>
        </tr>
        <tr>
          <td>Сказать «Me duele...»</td>
          <td><input type="radio" name="q2" value="great"></td>
          <td><input type="radio" name="q2" value="ok"></td>
          <td><input type="radio" name="q2" value="hard"></td>
        </tr>
        <tr>
          <td>Сказать «Me duelen...»</td>
          <td><input type="radio" name="q3" value="great"></td>
          <td><input type="radio" name="q3" value="ok"></td>
          <td><input type="radio" name="q3" value="hard"></td>
        </tr>
        <tr>
          <td>Описать симптомы (fiebre, tos, mareado)</td>
          <td><input type="radio" name="q4" value="great"></td>
          <td><input type="radio" name="q4" value="ok"></td>
          <td><input type="radio" name="q4" value="hard"></td>
        </tr>
        <tr>
          <td>Различать duele и duelen</td>
          <td><input type="radio" name="q5" value="great"></td>
          <td><input type="radio" name="q5" value="ok"></td>
          <td><input type="radio" name="q5" value="hard"></td>
        </tr>
      </tbody>
```

- [ ] **Step 6: Заменить навигацию внизу урока**

Edit tool, oldString:
```html
  <div class="lesson-nav">
    <a href="./w01-l2.html" class="nav-prev">
      <div class="nav-small">← Предыдущий урок</div>
      <div class="nav-title">Урок 2: SOS-фразы 🆘</div>
    </a>
    <div class="nav-locked">
      <div class="nav-small">Следующий урок →</div>
      <div class="nav-title">Урок 4: Части тела 🔒 скоро</div>
    </div>
  </div>
```
newString:
```html
  <div class="lesson-nav">
    <a href="./w01-l3.html" class="nav-prev">
      <div class="nav-small">← Предыдущий урок</div>
      <div class="nav-title">Урок 3: Эмоции 😄</div>
    </a>
    <div class="nav-locked">
      <div class="nav-small">Следующий урок →</div>
      <div class="nav-title">Урок 5: 🔒 скоро</div>
    </div>
  </div>
```

- [ ] **Step 7: Проверка баланса тегов**

Run команду из Task 3 Step 2. Expected: равенство открывающих/закрывающих `<div>` и `<section>`.

- [ ] **Step 8: Commit**

```bash
git add lessons/kids/w02-l1.html
git commit -m "урок 4 детям: слова, тренажёры, wordwall, домашка, самопроверка"
```

---

### Task 5: Полный JS-движок урока

**Files:**
- Modify: `lessons/kids/w02-l1.html` — содержимое `<script>...</script>` (заменить целиком)

**Interfaces:**
- Consumes: все DOM-id из Task 3 и Task 4; `mudro_gender`, `mudro_badge_doctor`, `mudro_lesson_4_done`, `mudro_selfcheck_lesson4`.
- Produces: функции из раздела «Контракт»; `onclick`-обработчики в HTML (`pressRandomBody`, `updatePain`, `startSimon`, `startSim`, `stampBadge`, `resetMatch`, `nextSB`).

- [ ] **Step 1: Заменить весь inline-скрипт**

В Edit tool: oldString = всё содержимое между `<script>` и `</script>` в текущем файле (прочитай файл и скопируй дословно).

newString:
```html
/* ========== ОЗВУЧКА ========== */
let esVoice=null;
function loadVoices(){
  const voices=speechSynthesis.getVoices();
  esVoice=voices.find(v=>v.lang.startsWith('es'));
}
speechSynthesis.onvoiceschanged=loadVoices;
loadVoices();

function speak(text){
  if(!text) return;
  const u=new SpeechSynthesisUtterance(text);
  u.lang='es-ES';u.rate=0.8;u.pitch=1.05;
  if(esVoice)u.voice=esVoice;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

/* ========== ГРАММАТИЧЕСКИЕ ПОДСКАЗКИ (мобильный тап) ========== */
document.addEventListener('click', function(e){
  const hint = e.target.closest('.grammar-hint');
  if(hint){
    document.querySelectorAll('.grammar-hint.active').forEach(el => {
      if(el !== hint) el.classList.remove('active');
    });
    hint.classList.toggle('active');
    e.stopPropagation();
    return;
  }
  document.querySelectorAll('.grammar-hint.active').forEach(el => {
    el.classList.remove('active');
  });
});

/* ========== РОД (мальчик/девочка) ========== */
let gender = localStorage.getItem('mudro_gender') === 'girl' ? 'girl' : 'boy';

function setGender(g){
  gender = g;
  localStorage.setItem('mudro_gender', g);
  document.getElementById('gb-boy').classList.toggle('active', g === 'boy');
  document.getElementById('gb-girl').classList.toggle('active', g === 'girl');
  renderWarmup();
  renderSymptoms();
  renderWords();
}

function renderGenderButtons(){
  document.getElementById('gb-boy').classList.toggle('active', gender === 'boy');
  document.getElementById('gb-girl').classList.toggle('active', gender === 'girl');
}

function speakCard(card,text){
  document.querySelectorAll('.body-card.active, .symptom-card.active').forEach(c=>c.classList.remove('active'));
  card.classList.add('active');
  speak(text);
  setTimeout(()=>card.classList.remove('active'),1200);
}

/* ========== ДАННЫЕ: ЧАСТИ ТЕЛА ========== */
const BODY_PARTS=[
  {id:'ojos',    emoji:'👀', es:'los ojos',     ru:'глаза',  art:'los', gender:'m', gesture:'Покажи на свои глаза', phrase:'Me duelen los ojos',    phraseRu:'У меня болят глаза'},
  {id:'oreja',   emoji:'👂', es:'la oreja',     ru:'ухо',    art:'la',  gender:'f', gesture:'Потрогай своё ухо',     phrase:'Me duele la oreja',     phraseRu:'У меня болит ухо'},
  {id:'nariz',   emoji:'👃', es:'la nariz',     ru:'нос',    art:'la',  gender:'f', gesture:'Покажи на свой нос',    phrase:'Me duele la nariz',     phraseRu:'У меня болит нос'},
  {id:'boca',    emoji:'👄', es:'la boca',      ru:'рот',    art:'la',  gender:'f', gesture:'Улыбнись и покажи рот', phrase:'Me duele la boca',      phraseRu:'У меня болит рот'},
  {id:'dientes', emoji:'🦷', es:'los dientes',  ru:'зубы',   art:'los', gender:'m', gesture:'Покажи свои зубы',     phrase:'Me duelen los dientes', phraseRu:'У меня болят зубы'},
  {id:'cabeza',  emoji:'🤯', es:'la cabeza',    ru:'голова', art:'la',  gender:'f', gesture:'Погладь себя по голове',phrase:'Me duele la cabeza',    phraseRu:'У меня болит голова'},
  {id:'brazo',   emoji:'💪', es:'el brazo',     ru:'рука',   art:'el',  gender:'m', gesture:'Покажи свой бицепс',   phrase:'Me duele el brazo',     phraseRu:'У меня болит рука'},
  {id:'mano',    emoji:'🖐', es:'la mano',      ru:'кисть',  art:'la',  gender:'f', gesture:'Помаши рукой',        phrase:'Me duele la mano',      phraseRu:'У меня болит кисть'},
  {id:'dedo',    emoji:'🤚', es:'el dedo',      ru:'палец',  art:'el',  gender:'m', gesture:'Покажи один палец',   phrase:'Me duele el dedo',      phraseRu:'У меня болит палец'},
  {id:'pierna',  emoji:'🦵', es:'la pierna',    ru:'нога',   art:'la',  gender:'f', gesture:'Покажи свою ногу',    phrase:'Me duele la pierna',    phraseRu:'У меня болит нога'},
  {id:'pie',     emoji:'🦶', es:'el pie',       ru:'стопа',  art:'el',  gender:'m', gesture:'Топни ногой',         phrase:'Me duele el pie',       phraseRu:'У меня болит стопа'},
  {id:'rodilla', emoji:'🧎', es:'la rodilla',   ru:'колено', art:'la',  gender:'f', gesture:'Похлопай по коленке', phrase:'Me duele la rodilla',   phraseRu:'У меня болит колено'}
];

function bodyById(id){ return BODY_PARTS.find(p=>p.id===id); }

/* ========== БЛОК 1: РАЗОГРЕВ (эмоции → тело) ========== */
const WARMUP=[
  {emoji:'😴', m:'Estoy cansado', f:'Estoy cansada', ru:'Я устал(а) · Урок 3', body:'Me duelen los ojos',   bodyRu:'У меня болят глаза'},
  {emoji:'😰', m:'Estoy nervioso', f:'Estoy nerviosa', ru:'Я нервничаю · Урок 3', body:'Me duele el estómago', bodyRu:'У меня болит живот'},
  {emoji:'😡', m:'Estoy enojado', f:'Estoy enojada', ru:'Я злюсь · Урок 3', body:'Me duele la cabeza',    bodyRu:'У меня болит голова'}
];

function renderWarmup(){
  const grid=document.getElementById('warmup-grid');
  grid.innerHTML='';
  WARMUP.forEach(w=>{
    const es=gender==='girl'?w.f:w.m;
    const card=document.createElement('div');
    card.className='sos-card';
    card.style.setProperty('--c','#F4A261');
    card.innerHTML='<div class="sos-emoji">'+w.emoji+'</div>'
      +'<div class="sos-phrase">'+es+'</div>'
      +'<div class="sos-meaning">'+w.ru+'</div>'
      +'<div class="sos-emotion-link" style="display:none"><span class="link-es">🩹 '+w.body+'</span><br>'+w.bodyRu+'</div>';
    card.onclick=function(){ revealBody(card, w.body); };
    grid.appendChild(card);
  });
}

function revealBody(card,bodyPhrase){
  document.querySelectorAll('#warmup-grid .sos-card').forEach(c=>c.classList.remove('active'));
  card.classList.add('active');
  card.querySelector('.sos-emotion-link').style.display='block';
  speak(bodyPhrase);
  setTimeout(()=>card.classList.remove('active'),1200);
}

/* ========== БЛОК 2: СЛУЧАЙНАЯ ФРАЗА (SOS) ========== */
const RANDOM_BODY=[
  {es:'¿Dónde te duele?', ru:'Где у тебя болит? (вопрос медсестры)'},
  {es:'Me duele la cabeza.', ru:'У меня болит голова.'},
  {es:'Me duelen los pies.', ru:'У меня болят стопы.'},
  {es:'Me duele la barriga.', ru:'У меня болит живот.'},
  {es:'Me duele la garganta.', ru:'У меня болит горло.'}
];

function pressRandomBody(){
  const m=RANDOM_BODY[Math.floor(Math.random()*RANDOM_BODY.length)];
  const out=document.getElementById('rand-body-output');
  out.innerHTML='<div class="es">'+m.es+'</div><div class="ru">'+m.ru+'</div>';
  speak(m.es);
}

/* ========== БЛОК 3: КАРТОЧКИ ЧАСТЕЙ ТЕЛА ========== */
function renderBodyCards(){
  const grid=document.getElementById('body-grid');
  grid.innerHTML='';
  BODY_PARTS.forEach(p=>{
    const card=document.createElement('div');
    card.className='body-card';
    card.innerHTML='<span class="body-art '+(p.gender==='f'?'fem':'masc')+'">'+p.art+'</span>'
      +'<span class="body-emoji">'+p.emoji+'</span>'
      +'<span class="body-es">'+p.es+'</span>'
      +'<span class="body-ru">'+p.ru+'</span>'
      +'<span class="body-gesture">👆 '+p.gesture+'</span>';
    card.onclick=function(){ speakCard(card, p.es); };
    grid.appendChild(card);
  });
}

/* ========== БЛОК 3: ИГРА «SIMÓN DICE» ========== */
const SIMON_ROUNDS=[
  {cmd:'¡Simón dice: señala los ojos!', ru:'Симон говорит: покажи на глаза!', target:'ojos', trap:false},
  {cmd:'¡Simón dice: toca la nariz!', ru:'Симон говорит: тронь нос!', target:'nariz', trap:false},
  {cmd:'¡Toca la cabeza!', ru:'Тронь голову! (Симон НЕ говорил!)', target:'cabeza', trap:true},
  {cmd:'¡Simón dice: toca la oreja!', ru:'Симон говорит: тронь ухо!', target:'oreja', trap:false},
  {cmd:'¡Señala la boca!', ru:'Покажи на рот! (Симон НЕ говорил!)', target:'boca', trap:true},
  {cmd:'¡Simón dice: señala la rodilla!', ru:'Симон говорит: покажи на колено!', target:'rodilla', trap:false}
];

let simonRound=0, simonStars=0;

function startSimon(){
  simonRound=0; simonStars=0;
  document.getElementById('simon-start').style.display='none';
  updateSimonStars();
  playSimon();
}

function playSimon(){
  if(simonRound>=SIMON_ROUNDS.length){ endSimon(); return; }
  const r=SIMON_ROUNDS[simonRound];
  const cmd=document.getElementById('simon-cmd');
  cmd.innerHTML='<span class="es">'+r.cmd+'</span><span class="ru">'+r.ru+'</span>';
  speak(r.cmd);
  document.getElementById('simon-feedback').textContent='';
  const opts=document.getElementById('simon-opts');
  opts.innerHTML='';
  const others=shuffle(BODY_PARTS.map(p=>p.id).filter(id=>id!==r.target)).slice(0,4);
  const ids=[r.target].concat(others);
  ids.forEach(id=>{
    const p=bodyById(id);
    const b=document.createElement('button');
    b.className='simon-opt';
    b.dataset.id=id;
    b.textContent=p.emoji+' '+p.es;
    b.onclick=function(){ checkSimon(id,b,r); };
    opts.appendChild(b);
  });
  if(r.trap){
    const b=document.createElement('button');
    b.className='simon-opt trap';
    b.textContent='🚫 ¡Me quedo quieto! (Стою спокойно)';
    b.onclick=function(){ checkSimon('stay',b,r); };
    opts.appendChild(b);
  }
}

function checkSimon(id,btn,r){
  document.querySelectorAll('.simon-opt').forEach(b=>b.disabled=true);
  const fb=document.getElementById('simon-feedback');
  const good = r.trap ? id==='stay' : id===r.target;
  if(good){
    btn.classList.add('correct');
    simonStars++;
    fb.textContent=r.trap?'🎉 ¡Muy bien! Ты не попался!':'🎉 ¡Muy bien! Правильная часть тела!';
    speak('¡Muy bien!');
  }else{
    btn.classList.add('wrong');
    if(r.trap){
      fb.textContent='😅 ¡Trampa! Симон не говорил «Simón dice» — надо стоять спокойно!';
    }else{
      fb.textContent='😅 Не то! Симон сказал: «'+r.cmd+'»';
      document.querySelectorAll('.simon-opt').forEach(b=>{ if(b.dataset.id===r.target) b.classList.add('correct'); });
    }
  }
  updateSimonStars();
  simonRound++;
  setTimeout(playSimon,2000);
}

function updateSimonStars(){
  const el=document.getElementById('simon-stars');
  let s='';
  for(let i=0;i<6;i++) s+=i<simonStars?'⭐':'☆';
  el.textContent=s;
  document.getElementById('simon-score-txt').textContent='Звёзд Симона: '+simonStars+'/6';
}

function endSimon(){
  document.getElementById('simon-opts').innerHTML='';
  document.getElementById('simon-cmd').textContent=simonStars>=5?'🏆 Отлично! Ты мастер Симона!':simonStars>=3?'👍 Хорошо! Ещё чуть-чуть практики!':'💪 Повтори части тела и попробуй снова!';
  document.getElementById('simon-start').style.display='block';
  document.getElementById('simon-start').textContent='🔄 Играть снова';
  if(simonStars>=5) confetti('🎲');
}

/* ========== БЛОК 4: ШКАЛА БОЛИ ========== */
let painPart=BODY_PARTS[5];

function renderPainChips(){
  const box=document.getElementById('pain-chips');
  box.innerHTML='';
  BODY_PARTS.forEach(p=>{
    const chip=document.createElement('button');
    chip.className='thermo-chip'+(p.id===painPart.id?' active':'');
    chip.textContent=p.emoji+' '+p.es;
    chip.onclick=function(){
      painPart=p;
      renderPainChips();
      updatePain();
    };
    box.appendChild(chip);
  });
}

function painLevel(l){
  if(l<=3) return {w:'un poco', t:'немного'};
  if(l<=7) return {w:'bastante', t:'ощутимо'};
  return {w:'mucho', t:'сильно'};
}

function updatePain(){
  const l=parseInt(document.getElementById('pain-slider').value,10);
  const info=painLevel(l);
  const parts=painPart.phrase.split(' ');
  const es=parts[0]+' '+parts[1]+' '+info.w+' '+parts.slice(2).join(' ');
  const ru='У меня '+info.t+' '+painPart.phraseRu.replace(/^У меня\s+/,'');
  document.getElementById('pain-es').textContent=es;
  document.getElementById('pain-ru').textContent=ru;
}

/* ========== БЛОК 5: СИМПТОМЫ ========== */
const SYMPTOMS=[
  {emoji:'🌡️', es:'Tengo fiebre', ru:'У меня температура', gender:false},
  {emoji:'😮‍💨', es:'Tengo tos', ru:'Я кашляю', gender:false},
  {emoji:'🤢', es:'Tengo náuseas', ru:'Меня тошнит', gender:false},
  {emoji:'😵‍💫', es:'Estoy mareado/a', ru:'У меня кружится голова', gender:true},
  {emoji:'😴', es:'Estoy cansado/a', ru:'Я устал(а)', gender:true},
  {emoji:'🤒', es:'Estoy enfermo/a', ru:'Я болею', gender:true}
];

function symptomEs(s){
  if(!s.gender) return s.es;
  return gender==='girl' ? s.es.replace('o/a','a') : s.es.replace('o/a','o');
}

function renderSymptoms(){
  const grid=document.getElementById('symptom-grid');
  grid.innerHTML='';
  SYMPTOMS.forEach(s=>{
    const es=symptomEs(s);
    const card=document.createElement('div');
    card.className='symptom-card';
    card.innerHTML='<span class="symptom-emoji">'+s.emoji+'</span>'
      +'<span class="symptom-es">'+es+'</span>'
      +'<span class="symptom-ru">'+s.ru+'</span>';
    card.onclick=function(){ speakCard(card, es); };
    grid.appendChild(card);
  });
}

/* ========== БЛОК 6: СИМУЛЯЦИЯ «У ВРАЧА» ========== */
const DOC_ROUNDS=[
  {doc:'¿Qué te pasa?', docRu:'Что с тобой?', correct:'Me duele la cabeza.', distract:['Tengo tos','Estoy muy bien, gracias']},
  {doc:'¿Dónde te duele?', docRu:'Где у тебя болит?', correct:'Aquí, en la rodilla.', distract:['Me llamo Masha','Soy de Rusia']},
  {doc:'¿Tienes fiebre?', docRu:'У тебя температура?', correct:'Sí, tengo fiebre y tos.', distract:['No, soy de Rusia','Me duele nada']},
  {doc:'¿Qué te pasa?', docRu:'Что с тобой?', correct:'Tengo náuseas.', distract:['Estoy muy contento','Tengo nueve años']},
  {doc:'¿Estás mareado?', docRu:'У тебя кружится голова?', correct:function(){ return gender==='girl' ? 'Sí, estoy mareada.' : 'Sí, estoy mareado.'; }, distract:['Sí, tengo la mano grande','No, estoy muy contento']}
];

let simRound=0, simStars=0;

function docCorrect(r){ return typeof r.correct==='function' ? r.correct() : r.correct; }

function startSim(){
  simRound=0; simStars=0;
  document.getElementById('sim-start').style.display='none';
  updateStars();
  playRound();
}

function playRound(){
  if(simRound>=DOC_ROUNDS.length){ endSim(); return; }
  const r=DOC_ROUNDS[simRound];
  document.getElementById('sim-situation').textContent='';
  document.getElementById('sim-feedback').textContent='🎧 Читай внимательно...';
  document.getElementById('sim-prompt').style.display='none';
  document.getElementById('sim-options').style.display='none';
  document.getElementById('sim-hint').textContent=r.docRu;
  document.querySelector('.round-label').textContent='🩺 Вопрос врача (раунд '+(simRound+1)+' из 5):';
  document.getElementById('sim-situation').textContent=r.doc+' «'+r.docRu+'»';
  setTimeout(()=>{
    document.getElementById('sim-prompt').style.display='block';
    showSimOptions(r);
  },800);
}

function showSimOptions(r){
  const opts=document.getElementById('sim-options');
  opts.style.display='flex';
  opts.innerHTML='';
  document.getElementById('sim-feedback').textContent='';
  const correct=docCorrect(r);
  const answers=shuffle([correct].concat(r.distract));
  answers.forEach(a=>{
    const btn=document.createElement('button');
    btn.className='sim-opt';
    btn.textContent=a;
    btn.onclick=function(){ checkSim(a,btn,r); };
    opts.appendChild(btn);
  });
}

function checkSim(ans,btn,r){
  document.querySelectorAll('.sim-opt').forEach(b=>b.disabled=true);
  const correct=docCorrect(r);
  if(ans===correct){
    btn.classList.add('correct');
    simStars++;
    document.getElementById('sim-feedback').textContent='🎉 ¡Muy bien! Правильный ответ!';
    speak(correct);
  }else{
    btn.classList.add('wrong');
    document.getElementById('sim-feedback').textContent='😅 Не то! Правильный ответ: «'+correct+'»';
    document.querySelectorAll('.sim-opt').forEach(b=>{ if(b.textContent===correct) b.classList.add('correct'); });
    speak(correct);
  }
  updateStars();
  simRound++;
  setTimeout(playRound,2200);
}

function updateStars(){
  const starsEl=document.getElementById('sim-stars');
  let s='';
  for(let i=0;i<5;i++) s+=i<simStars?'⭐':'☆';
  starsEl.textContent=s;
  document.getElementById('sim-score').textContent='Звёзд доктора: '+simStars+'/5';
}

function endSim(){
  document.getElementById('sim-options').style.display='none';
  document.getElementById('sim-prompt').style.display='none';
  document.getElementById('sim-feedback').textContent='';
  const msg=simStars>=4?'🏆 Отлично! Ты настоящий доктор!':simStars>=2?'👍 Хорошо! Ещё чуть-чуть практики!':'💪 Ничего! Повтори фразы и попробуй снова!';
  document.getElementById('sim-situation').textContent=msg;
  document.getElementById('sim-start').style.display='block';
  document.getElementById('sim-start').textContent='🔄 Играть снова';
  if(simStars>=4) confetti('🩺');
}

/* ========== БЛОК 7: БЕЙДЖ ========== */
function stampBadge(){
  document.getElementById('badge-stamped').classList.add('show');
  document.getElementById('badge-btn').style.display='none';
  speak('¡Enhorabuena! Eres un doctor increíble.');
  confetti('🩺');
  localStorage.setItem('mudro_badge_doctor','true');
  localStorage.setItem('mudro_lesson_4_done', new Date().toISOString());
}

if(localStorage.getItem('mudro_badge_doctor')==='true'){
  document.getElementById('badge-stamped').classList.add('show');
  document.getElementById('badge-btn').style.display='none';
}

/* ========== СЛОВА УРОКА ========== */
const WORDS_BODY=BODY_PARTS.map(p=>({es:p.es, ru:p.ru}));
const WORDS_DOLER=[
  {es:'Me duele la cabeza', ru:'У меня болит голова'},
  {es:'Me duelen los ojos', ru:'У меня болят глаза'},
  {es:'un poco', ru:'немного'},
  {es:'bastante', ru:'ощутимо'},
  {es:'mucho', ru:'сильно'},
  {es:'¿Qué te pasa?', ru:'Что с тобой?'}
];
const WORDS_SYMPTOMS=[
  {es:'Tengo fiebre', ru:'У меня температура'},
  {es:'Tengo tos', ru:'Я кашляю'},
  {es:'Tengo náuseas', ru:'Меня тошнит'},
  {es:'Estoy mareado/a', ru:'У меня кружится голова'},
  {es:'Estoy cansado/a', ru:'Я устал(а)'},
  {es:'Estoy enfermo/a', ru:'Я болею'}
];
const WORDS_DOC=[
  {es:'Aquí, en la rodilla', ru:'Здесь, в колене'},
  {es:'la enfermería', ru:'медпункт'},
  {es:'¿Puedo ir a la enfermería?', ru:'Можно пойти в медпункт?'},
  {es:'Por favor', ru:'пожалуйста'},
  {es:'Tengo fiebre y tos', ru:'У меня температура и кашель'}
];

function renderWordGrid(arr,containerId){
  const container=document.getElementById(containerId);
  container.innerHTML='';
  arr.forEach(w=>{
    const card=document.createElement('div');
    card.className='word-card';
    card.innerHTML='<span class="w-es">'+w.es+'</span><span class="w-ru">'+w.ru+'</span>';
    card.onclick=function(){ speak(w.es); };
    container.appendChild(card);
  });
}

function renderWords(){
  renderWordGrid(WORDS_BODY,'words-body');
  renderWordGrid(WORDS_DOLER,'words-doler');
  renderWordGrid(WORDS_SYMPTOMS,'words-symptoms');
  renderWordGrid(WORDS_DOC,'words-doc');
}

/* ========== MATCH GAME ========== */
function getMatchPairs(){
  return BODY_PARTS.map(p=>({es:p.es, ru:p.ru}));
}

let matchSelected=null, matchFound=0;

function shuffle(arr){ return arr.map(v=>[Math.random(),v]).sort((a,b)=>a[0]-b[0]).map(v=>v[1]); }

function renderMatch(){
  const left=document.getElementById('match-left');
  const right=document.getElementById('match-right');
  left.innerHTML=''; right.innerHTML='';
  matchSelected=null; matchFound=0;
  document.getElementById('match-feedback').textContent='Выбери слово слева 👈';

  const pairs=getMatchPairs();
  const leftItems=shuffle(pairs.slice());
  const rightItems=shuffle(pairs.slice());

  leftItems.forEach((p,i)=>{
    const item=document.createElement('div');
    item.className='match-item';
    item.textContent=p.es;
    item.dataset.pair=i;
    item.dataset.side='left';
    item.dataset.value=p.es;
    item.onclick=function(){ selectMatch(item); };
    left.appendChild(item);
  });

  rightItems.forEach((p,i)=>{
    const item=document.createElement('div');
    item.className='match-item';
    item.textContent=p.ru;
    item.dataset.pair=i;
    item.dataset.side='right';
    item.dataset.value=p.ru;
    item.onclick=function(){ selectMatch(item); };
    right.appendChild(item);
  });
}

function selectMatch(item){
  if(item.classList.contains('matched')) return;

  if(!matchSelected){
    matchSelected=item;
    item.classList.add('selected');
    document.getElementById('match-feedback').textContent='Теперь выбери пару справа 👉';
    return;
  }

  if(matchSelected===item){
    item.classList.remove('selected');
    matchSelected=null;
    document.getElementById('match-feedback').textContent='Выбери слово слева 👈';
    return;
  }

  if(matchSelected.dataset.side===item.dataset.side){
    matchSelected.classList.remove('selected');
    matchSelected=item;
    item.classList.add('selected');
    return;
  }

  const es=matchSelected.dataset.side==='left'?matchSelected.dataset.value:item.dataset.value;
  const ru=matchSelected.dataset.side==='right'?matchSelected.dataset.value:item.dataset.value;
  const pairs=getMatchPairs();
  const pair=pairs.find(p=>p.es===es && p.ru===ru);

  if(pair){
    matchSelected.classList.remove('selected');
    matchSelected.classList.add('matched');
    item.classList.add('matched');
    matchFound++;
    speak(pair.es);
    document.getElementById('match-feedback').textContent='🎉 ¡Bien! Найдено '+matchFound+'/'+pairs.length;
    if(matchFound===pairs.length){
      setTimeout(function(){
        document.getElementById('match-feedback').textContent='🏆 Отлично! Все пары найдены!';
        confetti('🎯');
      },500);
    }
  }else{
    matchSelected.classList.add('wrong');
    item.classList.add('wrong');
    document.getElementById('match-feedback').textContent='😅 Не пара! Попробуй ещё раз.';
    const ms=matchSelected;
    setTimeout(function(){
      ms.classList.remove('wrong','selected');
      item.classList.remove('wrong');
    },600);
  }
  matchSelected=null;
}

function resetMatch(){ renderMatch(); }

/* ========== SENTENCE BUILDER ========== */
function sbPhrases(){
  return [
    {words:['Me','duele','la','cabeza.'], translation:'У меня болит голова.'},
    {words:['Me','duelen','los','ojos.'], translation:'У меня болят глаза.'},
    {words:['Me','duele','un','poco','la','rodilla.'], translation:'У меня немного болит колено.'},
    {words:['Me','duele','mucho','el','brazo.'], translation:'У меня сильно болит рука.'},
    {words:['Le','duelen','los','pies.'], translation:'У него/неё болят стопы.'}
  ];
}

let sbCurrent=0, sbPlaced=[], sbPhraseList=[];

function renderSB(){
  sbPhraseList=sbPhrases();
  const target=document.getElementById('sb-target');
  const pool=document.getElementById('sb-pool');
  const result=document.getElementById('sb-result');

  const phrase=sbPhraseList[sbCurrent];
  sbPlaced=[];
  target.textContent='…';
  result.textContent='';

  pool.innerHTML='';
  const shuffled=shuffle(phrase.words.slice());
  shuffled.forEach((w,i)=>{
    const btn=document.createElement('div');
    btn.className='sb-word';
    btn.textContent=w;
    btn.dataset.idx=i;
    btn.onclick=function(){ addWord(btn,w); };
    pool.appendChild(btn);
  });
}

function addWord(btn,w){
  if(btn.classList.contains('placed')) return;
  btn.classList.add('placed');
  sbPlaced.push(w);
  updateSBTarget();
}

function updateSBTarget(){
  const target=document.getElementById('sb-target');
  const phrase=sbPhraseList[sbCurrent];
  target.textContent=sbPlaced.join(' ') || '…';

  if(sbPlaced.length===phrase.words.length){
    const correct=sbPlaced.every(function(w,i){ return w===phrase.words[i]; });
    const result=document.getElementById('sb-result');
    if(correct){
      result.innerHTML='✅ <span style="color:var(--teal)">¡Perfecto!</span><div class="sb-translation">'+phrase.translation+'</div>';
      speak(sbPlaced.join(' '));
      confetti('🎯');
    }else{
      result.innerHTML='❌ Не совсем… Правильный порядок: <strong>'+phrase.words.join(' ')+'</strong><div class="sb-translation">'+phrase.translation+'</div>';
      setTimeout(function(){ speak(phrase.words.join(' ')); },400);
    }
  }
}

function nextSB(){
  sbCurrent=(sbCurrent+1)%sbPhraseList.length;
  renderSB();
}

/* ========== LEVEL QUIZ (ШКАЛА БОЛИ) ========== */
const LEVEL_SCENARIOS=[
  {sit:'🚴 Ты упал с велосипеда и сильно ударил колено', correct:'mucho', es:'Me duele mucho la rodilla.', hint:'Боль сильная — самый высокий уровень!'},
  {sit:'🍫 Съел много сладкого, живот чуть-чуть ноет', correct:'un poco', es:'Me duele un poco la barriga.', hint:'Боль маленькая — низкий уровень!'},
  {sit:'📚 Весь день писал контрольную, глаза устали и болят ощутимо', correct:'bastante', es:'Me duelen bastante los ojos.', hint:'Боль заметная — средний уровень!'},
  {sit:'🦷 Сходил к зубному, десна немного ноет', correct:'un poco', es:'Me duele un poco la encía.', hint:'Боль маленькая — низкий уровень!'}
];

function renderLevelQuiz(){
  const box=document.getElementById('level-scenarios');
  box.innerHTML='';
  LEVEL_SCENARIOS.forEach(function(s,i){
    const div=document.createElement('div');
    div.className='level-scenario';
    div.innerHTML='<div class="situation">📌 Ситуация '+(i+1)+': '+s.sit+'</div>'
      +'<div class="level-choices">'
      +'<button class="level-choice" onclick="checkLevel(this,'+i+',\'mucho\')">mucho (сильно)</button>'
      +'<button class="level-choice" onclick="checkLevel(this,'+i+',\'bastante\')">bastante (ощутимо)</button>'
      +'<button class="level-choice" onclick="checkLevel(this,'+i+',\'un poco\')">un poco (немного)</button>'
      +'</div>'
      +'<div class="level-feedback" id="lv-fb-'+i+'"></div>';
    box.appendChild(div);
  });
}

function checkLevel(btn,idx,answer){
  const s=LEVEL_SCENARIOS[idx];
  const container=btn.closest('.level-scenario');
  container.querySelectorAll('.level-choice').forEach(b=>b.disabled=true);
  const fb=document.getElementById('lv-fb-'+idx);
  if(answer===s.correct){
    btn.classList.add('correct');
    fb.innerHTML='✅ <span style="color:var(--teal)">'+s.es+'</span> — '+s.hint;
    fb.className='level-feedback ok';
    speak(s.es);
  }else{
    btn.classList.add('wrong');
    container.querySelectorAll('.level-choice').forEach(b=>{
      if(b.getAttribute('onclick').indexOf("'"+s.correct+"'")!==-1) b.classList.add('correct');
    });
    fb.innerHTML='❌ Правильно: <strong>'+s.es+'</strong> — '+s.hint;
    fb.className='level-feedback bad';
  }
}

/* ========== КВИЗ DUELE/DUELEN ========== */
const DUELE_DATA=[
  {blank:'Me ___ la cabeza', verb:'duele', ru:'голова — одна'},
  {blank:'Me ___ los pies', verb:'duelen', ru:'стопы — несколько'},
  {blank:'Me ___ los dientes', verb:'duelen', ru:'зубы — несколько'},
  {blank:'Le ___ la rodilla', verb:'duele', ru:'колено — одно'}
];

function renderDueleQuiz(){
  const box=document.getElementById('duele-scenarios');
  box.innerHTML='';
  DUELE_DATA.forEach((row,i)=>{
    const div=document.createElement('div');
    div.className='level-scenario';
    div.innerHTML='<div class="situation">Фраза '+(i+1)+': «'+row.blank.replace('___','<strong style="color:var(--blue)">___</strong>')+'» · '+row.ru+'</div>'
      +'<div class="level-choices">'
      +'<button class="level-choice" onclick="checkDuele(this,'+i+',\'duele\')">duele (болит)</button>'
      +'<button class="level-choice" onclick="checkDuele(this,'+i+',\'duelen\')">duelen (болят)</button>'
      +'</div>'
      +'<div class="level-feedback" id="dl-fb-'+i+'"></div>';
    box.appendChild(div);
  });
}

function checkDuele(btn,idx,answer){
  const row=DUELE_DATA[idx];
  const container=btn.closest('.level-scenario');
  container.querySelectorAll('.level-choice').forEach(b=>b.disabled=true);
  const fb=document.getElementById('dl-fb-'+idx);
  const full=row.blank.replace('___','<strong>'+row.verb+'</strong>');
  const fullEs=row.blank.replace('___',row.verb);
  if(answer===row.verb){
    btn.classList.add('correct');
    fb.innerHTML='✅ <span style="color:var(--teal)">'+full+'</span>';
    fb.className='level-feedback ok';
    speak(fullEs);
  }else{
    btn.classList.add('wrong');
    container.querySelectorAll('.level-choice').forEach(b=>{
      if(b.getAttribute('onclick').indexOf("'"+row.verb+"'")!==-1) b.classList.add('correct');
    });
    fb.innerHTML='❌ Правильно: '+full;
    fb.className='level-feedback bad';
    speak(fullEs);
  }
}

/* ========== КОНФЕТТИ ========== */
function confetti(emoji){
  for(let i=0;i<16;i++){
    const c=document.createElement('span');
    c.className='confetti';
    c.textContent=Math.random()>.5?emoji:'🎉';
    c.style.left=Math.random()*100+'vw';
    c.style.animationDuration=(1.2+Math.random()*1.2)+'s';
    c.style.animationDelay=(Math.random()*.4)+'s';
    document.body.appendChild(c);
    setTimeout(function(){ c.remove(); },3000);
  }
}

/* ========== ИНИЦИАЛИЗАЦИЯ ========== */
renderGenderButtons();
renderWarmup();
renderBodyCards();
renderPainChips();
updatePain();
renderSymptoms();
renderWords();
renderMatch();
renderSB();
renderLevelQuiz();
renderDueleQuiz();

/* ========== СОХРАНЕНИЕ САМОПРОВЕРКИ ========== */
document.querySelectorAll('.selfcheck-table input[type=radio]').forEach(function(input){
  input.addEventListener('change',function(){
    const data={};
    for(let i=1;i<=5;i++){
      const selected=document.querySelector('input[name=q'+i+']:checked');
      if(selected) data['q'+i]=selected.value;
    }
    localStorage.setItem('mudro_selfcheck_lesson4',JSON.stringify(data));
  });
});

const savedCheck=localStorage.getItem('mudro_selfcheck_lesson4');
if(savedCheck){
  try{
    const data=JSON.parse(savedCheck);
    Object.keys(data).forEach(function(key){
      const input=document.querySelector('input[name='+key+'][value='+data[key]+']');
      if(input) input.checked=true;
    });
  }catch(e){}
}
```

- [ ] **Step 2: Проверка JS-синтаксиса**

Run команду из Task 1 Step 6. Expected: код возврата 0, нет вывода.

- [ ] **Step 3: Проверка ссылок на DOM-id**

Run:
```powershell
$h=[System.IO.File]::ReadAllText((Resolve-Path 'lessons/kids/w02-l1.html'))
$ids=[regex]::Matches($h,'id="([^"]+)"') | ForEach-Object { $_.Groups[1].Value }
$used=[regex]::Matches($h,"getElementById\('([^']+)'\)") | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
$missing=$used | Where-Object { $ids -notcontains $_ }
if($missing){ 'MISSING:'; $missing } else { 'OK: all getElementById ids exist' }
```
Expected: `OK: all getElementById ids exist`. (Допускается отсутствие в списке только тех, что заданы в HTML-задачах 3–4 и присутствуют в файле.)

- [ ] **Step 4: Проверка баланса тегов**

Run команду из Task 3 Step 2. Expected: равенство.

- [ ] **Step 5: Commit**

```bash
git add lessons/kids/w02-l1.html
git commit -m "урок 4 детям: js-движок"
```

---

### Task 6: Интеграция в курс (kids.html и навигация урока 3)

**Files:**
- Modify: `kids.html:321` (после строки `attachLessonLink('s1', 3, ...)`)
- Modify: `lessons/kids/w01-l3.html:862-865` (блок `.nav-locked`)

**Interfaces:**
- Consumes: функция `attachLessonLink(station, lesson, url)` в `kids.html`.
- Produces: чип «Урок 4» становится ссылкой; из урока 3 можно перейти в урок 4.

- [ ] **Step 1: Подключить урок 4 на карте курса**

Edit tool в `kids.html`, oldString:
```html
attachLessonLink('s1', 3, './lessons/kids/w01-l3.html');
```
newString:
```html
attachLessonLink('s1', 3, './lessons/kids/w01-l3.html');
attachLessonLink('s1', 4, './lessons/kids/w02-l1.html');
```

- [ ] **Step 2: Ссылка «Урок 4» в навигации урока 3**

Edit tool в `lessons/kids/w01-l3.html`, oldString:
```html
    <div class="nav-locked">
      <div class="nav-small">Следующий урок →</div>
      <div class="nav-title">Урок 4: Части тела 🔒 скоро</div>
    </div>
```
newString:
```html
    <a href="./w02-l1.html" class="nav-next">
      <div class="nav-small">Следующий урок →</div>
      <div class="nav-title">Урок 4: Части тела 🩺</div>
    </a>
```

- [ ] **Step 3: Проверка**

Run `node --test tests/app-logic.test.js` — Expected: `fail 0`. Run `node --check` на извлечённом скрипте `w02-l1.html` (Task 1 Step 6) — код возврата 0.

- [ ] **Step 4: Commit**

```bash
git add kids.html lessons/kids/w01-l3.html
git commit -m "урок 4 детям: подключение к курсу и навигация"
```

---

### Task 7: Финальная проверка

**Files:**
- Проверяемые: `lessons/kids/w02-l1.html`, `kids.html`, `lessons/kids/w01-l3.html`

**Interfaces:**
- Consumes: результат всех предыдущих задач.

- [ ] **Step 1: JS-синтаксис**

Run команду из Task 1 Step 6. Expected: код возврата 0.

- [ ] **Step 2: Юнит-тесты**

Run `node --test tests/app-logic.test.js`. Expected: `fail 0`.

- [ ] **Step 3: Баланс тегов и проверка контента**

Run команду из Task 3 Step 2. Expected: равенство.

Run и убедись, что в файле ровно по одному вхождению:
```powershell
$h=[System.IO.File]::ReadAllText((Resolve-Path 'lessons/kids/w02-l1.html'))
'ppUnmAvLhwE: ' + ([regex]::Matches($h,'ppUnmAvLhwE')).Count
'7EtQs96XBuA: ' + ([regex]::Matches($h,'7EtQs96XBuA')).Count
'wordwall iframe: ' + ([regex]::Matches($h,'wordwall.net/ru/embed')).Count
'mudro_badge_doctor: ' + ([regex]::Matches($h,'mudro_badge_doctor')).Count
'mudro_selfcheck_lesson4: ' + ([regex]::Matches($h,'mudro_selfcheck_lesson4')).Count
```
Expected: `1`, `1`, `0`, `2`, `2`.

- [ ] **Step 4: Ручная проверка в браузере (пользователь)**

Открыть `kids.html` → «Урок 4» кликабелен → открыть урок. Проверить: озвучка карточек, игра «Simón dice», шкала боли, симуляция «У врача», бейдж (localStorage `mudro_badge_doctor`), самопроверка сохраняется (`mudro_selfcheck_lesson4`), навигация урок 3 ↔ урок 4.

- [ ] **Step 5: Статус и коммит**

Run `git status`. Expected: только ожидаемые изменения.
```bash
git add -A
git commit -m "урок 4 детям: готово"
```
Если в Task 1–6 уже всё закоммичено, этот шаг можно пропустить (после проверки `git status` чистый).

---
