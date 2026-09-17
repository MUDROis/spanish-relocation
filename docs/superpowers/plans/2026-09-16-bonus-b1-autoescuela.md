# Бонусный урок B1 «Misión Autoescuela» — план реализации

> **Для агентных работников:** обязательный суб-скилл: superpowers:subagent-driven-development (рекомендуется) или superpowers:executing-plans. Шаги используют checkbox (`- [ ]`) для отслеживания.

**Goal:** Создать `lessons/parents/bonus-auto-b1.html` на основе шаблона Qwen с MUDRO-обвесом; расширить `parseLessonId`; зарегистрировать бонусный модуль в конце карты курса `index.html`.

**Architecture:** Урок строится из контента Qwen (шаги 1–9, JS, ресурсы) + платформенный обвес по конвенциям `w05-l1.html`: topbar/auth-area, hero с meta-чипами, домашка (6 заданий), светофор (6 строк), quizlet-блок, скрипт-стек. `parseLessonId` расширяется регулярным выражением для `bonus-auto-bN`. На главной бонусная фаза рендерится JS-ом отдельным контейнером (недели не затрагиваются).

**Tech Stack:** HTML5, vanilla JS, Firebase (app/auth/firestore-compat CDN), ассеты `assets/js/{firebase-config,app-logic,app,lesson-gate}.js`, Node `node:test` для юнит-тестов.

## Global Constraints

- Платформенный скрипт-стек урока (обязательно перед `</body>`):
  `<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js">`, `firebase-auth-compat.js`, `firebase-firestore-compat.js`, `../../assets/js/firebase-config.js`, `../../assets/js/app-logic.js`, `../../assets/js/app.js`, `../../assets/js/lesson-gate.js`.
- Урок-id: `parents-bonus-auto-b1` (из `parseLessonId`).
- Самопроверка: `.tl-cell` parents, цвета `1`→`green`, `2`→`yellow`, `3`→`red` (путь `/lessons/parents/`).
- Quizlet-ссылка пользователя: `https://quizlet.com/fi/1209173757/mision-autoescuela-%D1%83%D1%80%D0%BE%D0%BA-b1-autoescuela-%D0%B8-psicotecnico-flash-cards/?i=2gqp1x&x=1jqt`.
- Ссылка на рабочий лист (плейсхолдер, файл добавит пользователь): `../../worksheets/bonus-auto-b1-parents.html`.
- Навигация бонуса: первый урок модуля (без prev), `next` → `bonus-auto-b2.html`, `↺` → `../../index.html`.
- Контент шагов 1–9 из шаблона Qwen **не менять** (TTS rate 0.88, таймеры 60/90 c, 35 слов, 5 дриллов, 4 ролевых, 6 speed-dating, 12 карточек).
- Бонусные уроки НЕ считаются в прогрессе недель: `updateHeroProgress` считает только `.lesson-link` внутри `#weeks-container`.

---

### Task 1: Расширить `parseLessonId` + тесты

**Файлы:**
- Modify: `assets/js/app-logic.js:4-8`
- Test: `tests/app-logic.test.js`

**Interfaces:**
- Consumes: — (public API no-op)
- Produces: `parseLessonId('/lessons/parents/bonus-auto-b1.html')` → `'parents-bonus-auto-b1'`; `parseLessonId('/lessons/kids/bonus-auto-b2.html')` → `'kids-bonus-auto-b2'`; существующие `wNN-lN` пути без регресса.

- [ ] **Step 1: Write the failing tests**

Открыть `tests/app-logic.test.js`, после теста `parseLessonId extracts audience and lesson` (строка ~13) добавить:

```js
test('parseLessonId extracts bonus lesson ids', () => {
  assert.equal(parseLessonId('/lessons/parents/bonus-auto-b1.html'), 'parents-bonus-auto-b1');
  assert.equal(parseLessonId('/spanish-relocation/lessons/kids/bonus-auto-b2.html'), 'kids-bonus-auto-b2');
  assert.equal(parseLessonId('/lessons/parents/w06-l1.html'), 'parents-w06-l1');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node tests/app-logic.test.js`
Expected: FAIL — `actual: null, expected: 'parents-bonus-auto-b1'`.

- [ ] **Step 3: Implement**

Заменить в `assets/js/app-logic.js:4-8` тело функции:

```js
function parseLessonId(path) {
  const m = String(path).match(/\/lessons\/(parents|kids)\/(w(\d{2})-l(\d+)|bonus-auto-b(\d+))\.html/);
  if (!m) return null;
  if (m[2].indexOf('bonus') === 0) return m[1] + '-bonus-auto-b' + m[5];
  return m[1] + '-w' + m[3] + '-l' + m[4];
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node tests/app-logic.test.js`
Expected: All tests PASS (10 предыдущих + 1 новый).

- [ ] **Step 5: Commit**

```bash
git add assets/js/app-logic.js tests/app-logic.test.js
git commit -m "feat: parseLessonId поддержка бонусных уроков bonus-auto-bN"
```

---

### Task 2: Бонусная фаза на главной `index.html`

**Файлы:**
- Modify: `index.html` (CSS + разметка + JS)

**Interfaces:**
- Consumes: `MAX_URL` (уже определён в `<script>` index.html:325), `toast()` (index.html:440), обработчик «умных ссылок» (index.html:419).
- Produces: контейнер `<div id="bonus-container"></div>` внутри `#map`; функция `renderBonus()`; клик-обработчик для `.lesson-link` внутри `#bonus-container`; фильтр `updateHeroProgress` на `#weeks-container`.

- [ ] **Step 1: CSS — добавить стили бонусной фазы**

После блока `/* ---------- фазы и недели ---------- */` (после строки 171) добавить:

```css
/* ---------- бонусный модуль ---------- */
.bonus{max-width:1100px;margin:46px auto 0}
.bonus .phase-head{background:linear-gradient(135deg,#B5651D,#E9A13B)}
.bonus .phase-head .icon{font-size:2.1rem}
.bonus .lesson-link{background:var(--p3);color:#fff;border-color:var(--p3)}
.bonus .lesson-link:hover{filter:brightness(.92);color:#fff}
.bonus .lesson-link.locked{background:#fff;border-style:dashed;border-color:rgba(43,33,24,.2);color:#b3aa9d}
.bonus .badge-gift{display:inline-block;background:#FFD75E;color:#2B2118;font-size:.72rem;font-weight:900;padding:4px 12px;border-radius:999px;margin-bottom:10px;letter-spacing:.4px;text-transform:uppercase}
```

- [ ] **Step 2: Разметка — контейнер бонуса внутри `#map`**

В `index.html` после строки 270 (`<div id="weeks-container"></div>`) вставить:

```html
    <div class="bonus" id="bonus-container"></div>
```

- [ ] **Step 3: JS — рендер бонусной фазы и клик**

В `index.html` внутри `<script>` (после блока «Умные ссылки уроков», т.е. после строки 434) добавить:

```js
/* ====== Бонусный модуль «Misión Autoescuela» ====== */
const BONUS_PHASE = {
  icon: '🎁', title: 'Бонусный модуль · Misión Autoescuela',
  sub: 'Права в Испании с нуля: автошкола, psicotécnico, теория и практика — 5 уроков-репетиций после Блока 1.',
  lessons: [
    { id: 'bonus-auto-b1', title: 'Урок B1 · Autoescuela и Psicotécnico' },
    { id: 'bonus-auto-b2', title: 'Урок B2 · Анатомия машины (скоро)' },
    { id: 'bonus-auto-b3', title: 'Урок B3 · Практика вождения (скоро)' },
    { id: 'bonus-auto-b4', title: 'Урок B4 · Теория и экзамен (скоро)' },
    { id: 'bonus-auto-b5', title: 'Урок B5 · День экзамена (скоро)' }
  ]
};

function renderBonus() {
  const el = document.getElementById('bonus-container');
  if (!el) return;
  el.innerHTML =
    '<div class="phase reveal" style="--pc:#B5651D;--pc-soft:#FBEFE0">' +
      '<div class="phase-head"><span class="icon" aria-hidden="true">' + BONUS_PHASE.icon + '</span>' +
        '<div><h3>' + BONUS_PHASE.title + '</h3><p>' + BONUS_PHASE.sub + '</p></div></div>' +
      '<div class="weeks"><article class="week">' +
        '<div class="week-head"><span class="week-num" aria-hidden="true">B</span>' +
          '<span class="week-titles"><span class="wtitle">Бонус после Блока 1</span>' +
          '<span class="week-teaser">Autoescuela · psicotécnico · DGT · теория · практика</span></span>' +
          '<span class="badge-gift">🎁 БОНУС</span></div>' +
        '<div class="week-body"><div class="week-body-inner"><div class="week-content">' +
          '<div class="lessons">' + BONUS_PHASE.lessons.map(function (l) {
            return '<a class="lesson-link" data-href="./lessons/parents/' + l.id + '.html" href="./lessons/parents/' + l.id + '.html">' + l.title + '</a>';
          }).join('') + '</div>' +
        '</div></div></div></article></div></div>';

  document.getElementById('bonus-container').addEventListener('click', async function (e) {
    const a = e.target.closest('.lesson-link');
    if (!a) return;
    const href = a.dataset.href || a.getAttribute('href');
    if (!href) return;
    try {
      const res = await fetch(href, { method: 'HEAD' });
      if (res.ok) { a.classList.add('live'); return; }
    } catch (_) {}
    e.preventDefault();
    toast('📚 Урок ещё в работе. Оставьте заявку в Max — пришлём, как только будет готов!');
    setTimeout(function () { window.open(MAX_URL, '_blank', 'noopener'); }, 1400);
  });
}
renderBonus();
```

- [ ] **Step 4: JS — фильтр прогресса на недели**

В `index.html:459` изменить `const links=[...document.querySelectorAll('.lesson-link')];` на:

```js
  const links=[...document.querySelectorAll('#weeks-container .lesson-link')];
```

Примечание: `getParentsDone()` по-прежнему считывает `mudro_done_parents`; бонусные id в него просто не добавятся из-за фильтра (кнопка завершения на бонусе физически кладёт `bonus-auto-b1` в этот же localStorage, но ссылка бонуса не меняется по классу `passed`, т.к. фильтр его игнорирует — это ожидаемое поведение по спеке).

- [ ] **Step 5: Проверка**

Открыть `index.html` в браузере (или Node — синтаксис): 
Run: `node --check` не применим для inline; вместо этого — визуальная проверка: на странице после «недель» появляется бонусная фаза, клик по недоступным урокам B2–B5 показывает toast и ведёт в Max; `README`/теги сбалансированы.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: бонусный модуль Misión Autoescuela на карте курса"
```

---

### Task 3: Урок `lessons/parents/bonus-auto-b1.html`

**Файлы:**
- Create: `lessons/parents/bonus-auto-b1.html`
- Source: `C:\Users\Lenovo\Downloads\Qwen_html_20260916_9pn2ihoy8.html`

**Interfaces:**
- Consumes: шаблон Qwen (803 строки); конвенции `lessons/parents/w05-l1.html` (topbar, hero, светофор, домашка, стек).
- Produces: готовый урок `bonus-auto-b1.html`, распознаваемый `parseLessonId`.

- [ ] **Step 1: Скопировать шаблон как основу**

Скопировать `C:\Users\Lenovo\Downloads\Qwen_html_20260916_9pn2ihoy8.html` → `lessons/parents/bonus-auto-b1.html`. Весь контент шагов 1–9, блок «Внешние ресурсы», `<script>` с TTS/warmup/vocab/drill/cards и финальный `</body></html>` остаются БЕЗ изменений содержимого. Далее — только обвес по шагам ниже.

- [ ] **Step 2: `<title>`**

Заменить title на: `Бонусный урок B1 · Autoescuela и Psicotécnico — МУДРО`

- [ ] **Step 3: Добавить MUDRO-CSS**

В `<style>` (после строки `:root{...}` → перед `*{margin:0...}`) добавить:

```css
  .lesson-topbar{position:sticky;top:0;z-index:50;background:rgba(255,247,239,.95);backdrop-filter:blur(10px);border-bottom:1px solid rgba(43,33,24,.06)}
  .lesson-topbar .inner{max-width:1100px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;padding:12px 20px;gap:14px;flex-wrap:wrap}
  .back-link{display:inline-flex;align-items:center;gap:8px;text-decoration:none;color:var(--ink);font-weight:900;font-size:.92rem}
  .back-link:hover{color:var(--p1)}
  .lesson-id{font-weight:900;color:var(--muted);font-size:.85rem}
  #auth-area{display:inline-flex}
  .lesson-hero{max-width:1100px;margin:0 auto;padding:40px 20px 30px}
  .lesson-hero h1{font-size:clamp(1.7rem,4.5vw,2.7rem);font-weight:900;line-height:1.15}
  .lesson-hero h1 em{font-style:normal;color:var(--p1)}
  .lesson-hero .sub{max-width:700px;margin:12px auto 0;color:var(--muted);font-weight:700}
  .phase-tag{display:inline-flex;align-items:center;gap:8px;background:var(--p1);color:#fff;font-weight:900;font-size:.8rem;padding:7px 16px;border-radius:999px;margin-bottom:14px}
  .lesson-meta{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}
  .meta-chip{background:#fff;border-radius:999px;padding:9px 16px;font-weight:800;font-size:.85rem;box-shadow:var(--shadow);display:inline-flex;align-items:center;gap:7px}
  .tl-table{width:100%;border-collapse:collapse;margin-top:10px;font-weight:800;font-size:.88rem}
  .tl-table th,.tl-table td{border:1px dashed rgba(43,33,24,.3);padding:8px 10px;text-align:left;background:#fff}
  .tl-table th{background:#2B2118;color:#fff;border-color:rgba(255,255,255,.25)}
  .tl-cell{display:inline-flex;align-items:center;justify-content:center;gap:4px;min-width:52px;padding:7px 10px;border-radius:10px;border:2px solid transparent;cursor:pointer;font-size:1rem;font-weight:800;transition:.15s;text-align:center}
  .tl-cell:hover{background:#FFF7EF}
  .tl-cell.active{border-color:#2B2118;background:#FFF3DC}
  .hw-item{background:var(--card);border-radius:14px;padding:16px;margin-bottom:14px;box-shadow:var(--shadow)}
  .hw-item h4{color:var(--p1);margin-bottom:4px}
  .hw-meta{font-weight:800;font-size:.9rem;color:var(--muted);margin:4px 0 18px}
  .hw-send{margin-top:16px;background:#2B2118;color:#FFD75E;border-radius:14px;padding:16px 20px;font-weight:800;font-size:.93rem}
  .hw-send p{color:#fff;margin-bottom:6px}
  .hw-send li{margin:4px 0;list-style:none;padding-left:26px;position:relative;color:#fff}
  .hw-send li::before{content:'🎯';position:absolute;left:0}
  .quizlet-box{background:var(--p2);color:#fff;border-radius:var(--radius);padding:26px;text-align:center}
  .quizlet-box h3{margin-bottom:8px}
  .quizlet-box p{font-weight:700;opacity:.92;margin-bottom:16px}
  .quizlet-box a{display:inline-block;background:#fff;color:var(--p2);padding:13px 30px;border-radius:999px;font-weight:900;text-decoration:none;transition:.2s}
  .quizlet-box a:hover{transform:translateY(-2px)}
  #toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px);background:#2B2118;color:#fff;padding:12px 22px;border-radius:999px;opacity:0;transition:.3s;z-index:100;font-weight:800;pointer-events:none;max-width:90vw;text-align:center;font-size:.9rem}
  #toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
```

- [ ] **Step 4: Topbar → lesson-topbar**

Заменить блок (строки 138–141 шаблона):
```html
<div class="topbar"><div class="inner">
  <a href="../../index.html">← К карте курса</a>
  <span class="lesson-badge">🎁 Бонусный модуль · Урок B1 из B5 · Разговорный формат</span>
</div></div>
```
на:
```html
<div class="lesson-topbar"><div class="inner">
  <a href="../../index.html" class="back-link">← К карте курса</a>
  <span class="lesson-id">🎁 Бонусный модуль · Урок B1 из B5 · Misión Autoescuela</span>
  <span id="auth-area"></span>
</div></div>
```

- [ ] **Step 5: Hero → lesson-hero**

Заменить блок hero (строки 143–152 шаблона) на:
```html
<section class="lesson-hero">
  <span class="phase-tag">🎁 Бонусный модуль · Misión Autoescuela</span>
  <h1>Урок B1 · <em>Autoescuela y Psicotécnico</em> — записываемся и проходим медосмотр</h1>
  <p class="sub">40+ минут разговорной практики: запись в автошколу, psicotécnico, решение проблем с документами и статусом заявки в DGT.</p>
  <div class="lesson-meta">
    <span class="meta-chip">🎯 Цель: записаться в автошколу и пройти психотехнический тест</span>
    <span class="meta-chip">🗣 35 слов в 5 категориях</span>
    <span class="meta-chip">🧩 es necesario / hace falta / hay que; ¿Podría…? / Quisiera…</span>
    <span class="meta-chip">📋 Продукт: заявка на экзамен + чек-лист документов</span>
    <span class="meta-chip">⏱ 50 минут · A2</span>
  </div>
</section>
```

- [ ] **Step 6: Домашнее задание (6 заданий)**

После секции `<section class="section">` с заголовком «Reflection & Action Plan» (конец шаблона, перед блоком «Внешние ресурсы») вставить:

```html
<!-- ═══════════ ДОМАШКА ═══════════ -->
<section class="section">
  <div class="step-head"><div class="step-num">🏠</div><div class="step-title"><h2>Домашнее задание · Урок B1 «Autoescuela y Psicotécnico»</h2><span class="time">⏱ ~25–30 минут</span></div></div>

  <div class="card">
    <div class="hw-item" style="margin-bottom:22px">
      <h4>🎤 Задание 1. «Мой первый звонок в автошколу» (говорение) · 7 мин ⭐</h4>
      <div class="hw-meta">Цель: преодолеть страх звонка и довести вежливые просьбы до автоматизма.</div>
      <p>Запишите голосовое сообщение (2–3 минуты): вы звоните в автошколу, представляетесь, говорите, что хотите записаться на категорию B, спрашиваете про документы и стоимость. Минимум 2 дубля!</p>
      <div style="background:#F0F4FF;padding:10px;border-radius:8px;margin-top:8px;font-style:italic">
        Buenos días. Quisiera matricularme para el permiso B. Mi NIE es X-12345678-A. ¿Qué documentos necesito? ¿Cuánto cuesta el curso? ¿Hay permanencia? Muchas gracias.
      </div>
      <button class="speak-btn" onclick="speak('Buenos días. Quisiera matricularme para el permiso B. Mi NIE es X, uno, dos, tres... ¿Qué documentos necesito? ¿Cuánto cuesta el curso? ¿Hay permanencia? Muchas gracias.')" style="margin-top:8px">🔊 Прослушать образец</button>
    </div>

    <div class="hw-item" style="margin-bottom:22px">
      <h4>✍️ Задание 2. PBL: «Заявка на экзамен» · 7 мин</h4>
      <div class="hw-meta">Цель: перенести навык в настоящую жизнь.</div>
      <p>Напишите черновик заявки (solicitud) на экзамен: ваши данные, тип прав (permiso B), выбранная автошкола и удобные даты. Используйте конструкции урока: <b>Hay que presentar…</b>, <b>Es necesario…</b>, <b>Quisiera…</b>. Пришлите текстом преподавателю.</p>
      <div style="background:#F0F4FF;padding:10px;border-radius:8px;margin-top:8px;font-style:italic">
        Quisiera presentarme al examen del permiso B. Hay que presentar el NIE, el empadronamiento y el certificado médico. Es necesario pagar la tasa. Quisiera recibir la convocatoria lo antes posible.
      </div>
      <button class="speak-btn" onclick="speak('Quisiera presentarme al examen del permiso B. Hay que presentar el NIE, el empadronamiento y el certificado médico. Es necesario pagar la tasa. Quisiera recibir la convocatoria lo antes posible.')" style="margin-top:8px">🔊 Прослушать образец</button>
    </div>

    <div class="hw-item" style="margin-bottom:22px">
      <h4>📋 Задание 3. Чек-лист документов · 5 мин</h4>
      <div class="hw-meta">Цель: собрать реальный список документов для автошколы.</div>
      <p>Составьте чек-лист из 5–6 документов для записи в автошколу (используйте слова урока): pasaporte, NIE, empadronamiento, fotografías, certificado médico, justificante de pago. Отметьте, что уже есть, а чего не хватает. Пришлите фото списка.</p>
    </div>

    <div class="hw-item" style="margin-bottom:22px">
      <h4>🎮 Задание 4. Тренажёр · 10 мин</h4>
      <div class="hw-meta">Цель: довести слова урока до автоматизма.</div>
      <p style="margin-bottom:12px">Откройте карточки Quizlet урока B1 и пройдите режимы «Карточки» и «Заучивание»: называйте перевод ДО переворота карточки.</p>
      <div class="quizlet-box" style="margin-top:10px">
        <h3>🃏 Карточки Quizlet · Урок B1</h3>
        <p>Слова урока: бюрократия, медцентр, документы, глаголы, сроки.</p>
        <a href="https://quizlet.com/fi/1209173757/mision-autoescuela-%D1%83%D1%80%D0%BE%D0%BA-b1-autoescuela-%D0%B8-psicotecnico-flash-cards/?i=2gqp1x&x=1jqt" target="_blank" rel="noopener">Открыть карточки →</a>
      </div>
    </div>

    <div class="hw-item" style="margin-bottom:22px">
      <h4>👨‍👩‍👧 Задание 5. Семейная миссия · 10 мин</h4>
      <div class="hw-meta">Цель: связать урок с детским курсом (мост к детскому B2 «Анатомия машины»).</div>
      <p><b>«Машина мечты»:</b> Попросите детей нарисовать машину мечты и подписать 5 деталей по-испански: <i>la rueda</i> (колесо), <i>la puerta</i> (дверь), <i>el volante</i> (руль), <i>el espejo</i> (зеркало), <i>el faro</i> (фара). Фото рисунка — в домашнее задание.</p>
      <button class="speak-btn" onclick="speak('Vamos a dibujar el coche de nuestros sueños. La rueda, la puerta, el volante, el espejo y el faro.')" style="margin-top:8px">🔊 Прослушать образец</button>
    </div>

    <div class="hw-item">
      <h4>📄 Задание 6. Рабочий лист · 20–25 мин</h4>
      <div class="hw-meta">Цель: закрепить весь урок на бумаге.</div>
      <p>Распечатайте или заполните с экрана: лексика, конструкции необходимости, ролевые сценарии, заявка на экзамен. Пришлите фото заполненного листа.</p>
      <a href="../../worksheets/bonus-auto-b1-parents.html" class="btn btn-secondary" style="margin-top:10px">📄 Открыть рабочий лист (A4, печать)</a>
    </div>

    <div class="hw-send">
      <p>📤 Формат сдачи домашки:</p>
      <ul>
        <li>голосовое сообщение «Мой первый звонок» (задание 1)</li>
        <li>заявка на экзамен + чек-лист документов (задания 2 и 3)</li>
        <li>фото рисунка «Машина мечты» + фото рабочего листа (задания 5 и 6)</li>
        <li>«Светофор» самопроверки</li>
      </ul>
    </div>
  </div>
</section>
```

- [ ] **Step 7: Светофор (6 строк)**

Сразу после блока домашки (тот же `<section class="section">` закрывается, далее) вставить:

```html
<!-- ═══════════ СВЕТОФОР ═══════════ -->
<section class="section">
  <div class="step-head"><div class="step-num">✅</div><div class="step-title"><h2>Светофор</h2><span class="time">Самопроверка</span></div></div>
  <div class="card">
    <p class="hint">Честно отметьте, как получается у вас сейчас. Сохранённые отметки видны преподавателю.</p>
    <div style="overflow-x:auto">
    <table class="tl-table">
      <thead><tr><th>Умею</th><th>🟢 уверенно</th><th>🟡 с подсказкой</th><th>🔴 пока сложно</th></tr></thead>
      <tbody id="tl-body"></tbody>
    </table>
    </div>
    <button class="btn btn-ghost" onclick="resetTL()" style="margin-top:12px">↺ Сбросить отметки</button>
    <p class="hint" style="margin-top:10px">📸 Отправьте «светофор» преподавателю — на следующем уроке разберём всё, что 🟡 и 🔴.</p>
  </div>
</section>
```

- [ ] **Step 8: Quizlet-блок**

После светофора вставить:

```html
<!-- ═══════════ QUIZLET ═══════════ -->
<section class="section">
  <div class="quizlet-box">
    <h3>🃏 Карточки Quizlet · Урок B1 «Misión Autoescuela»</h3>
    <p>35 слов по теме вождения: автошкола, медосмотр, документы, глаголы, сроки. Повторяйте перед B2.</p>
    <a href="https://quizlet.com/fi/1209173757/mision-autoescuela-%D1%83%D1%80%D0%BE%D0%BA-b1-autoescuela-%D0%B8-psicotecnico-flash-cards/?i=2gqp1x&x=1jqt" target="_blank" rel="noopener">Открыть карточки →</a>
  </div>
</section>
```

- [ ] **Step 9: Внешние ресурсы — добавить DGT**

В существующий блок `<div class="resources-grid">` (шаблон, строки 403–428) после последней `.resource-card` добавить две карточки:

```html
    <div class="resource-card">
      <span class="tag">🏛 Официально</span>
      <h4>DGT — Dirección General de Tráfico</h4>
      <p>Официальный сайт: требования, tasas, convocatorias, запись на экзамен по разрешению B.</p>
      <a href="https://www.dgt.es/" target="_blank" rel="noopener">Открыть →</a>
    </div>
    <div class="resource-card">
      <span class="tag">📰 Журнал</span>
      <h4>Revista DGT</h4>
      <p>Материалы о вождении и психотехнических тестах от самой DGT.</p>
      <a href="https://revista.dgt.es/" target="_blank" rel="noopener">Читать →</a>
    </div>
```

- [ ] **Step 10: Навигация**

Заменить блок `lesson-nav` (шаблон, строки 433–437) на:

```html
<div class="lesson-nav">
  <a href="../../index.html">🎁 Бонусный модуль<br><small>Карта курса</small></a>
  <a href="bonus-auto-b2.html">Следующий →<br><small>Урок B2 · Анатомия машины (скоро)</small></a>
</div>
```

- [ ] **Step 11: JS — светофор + toast + скрипт-стек**

В конце существующего `<script>` шаблона (после `renderCards();`, перед `</script>`) добавить:

```js
// ===== СВЕТОФОР =====
var TL = [
  'Записаться в автошколу (Quisiera matricularme para el permiso B…)',
  'Задать вопросы о документах и цене (¿Qué documentos necesito? ¿Cuánto cuesta?)',
  'Записаться на psicotécnico и пройти медосмотр',
  'Объяснить, что нужно сделать: es necesario / hace falta / hay que',
  'Спросить о статусе заявки в DGT (¿Cuándo recibiré la convocatoria?)',
  'Составить заявку на экзамен и чек-лист документов'
];

function renderTL(){
  var tb = document.getElementById('tl-body');
  if(!tb) return;
  tb.innerHTML = '';
  TL.forEach(function(t, rowIdx){
    var tr = document.createElement('tr');
    tr.innerHTML = '<td>' + t + '</td>' +
      '<td><button class="tl-cell green" data-row="' + rowIdx + '" data-color="1">🟢</button></td>' +
      '<td><button class="tl-cell yellow" data-row="' + rowIdx + '" data-color="2">🟡</button></td>' +
      '<td><button class="tl-cell red" data-row="' + rowIdx + '" data-color="3">🔴</button></td>';
    tr.querySelectorAll('.tl-cell').forEach(function(b){
      b.onclick = function(){
        tr.querySelectorAll('.tl-cell').forEach(function(x){ x.classList.remove('active'); });
        b.classList.add('active');
      };
    });
    tb.appendChild(tr);
  });
}
renderTL();

function resetTL(){
  document.querySelectorAll('.tl-cell').forEach(function(b){ b.classList.remove('active'); });
}
```

После `</script>` шаблона, перед `</body>`, вставить:

```html
<div id="toast" role="status"></div>

<!-- Скрипт-стек (обязательно перед </body>) -->
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>
<script src="../../assets/js/firebase-config.js"></script>
<script src="../../assets/js/app-logic.js"></script>
<script src="../../assets/js/app.js"></script>
<script src="../../assets/js/lesson-gate.js"></script>
```

- [ ] **Step 12: Проверки**

Из директории репозитория:
1. Run: `node tests/app-logic.test.js` — Expected: PASS.
2. Run: извлечь inline JS урока в временный `.js` и `node --check`:
   `node -e "const fs=require('fs');const html=fs.readFileSync('lessons/parents/bonus-auto-b1.html','utf8');const m=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];m.forEach((x,i)=>{fs.writeFileSync('C:/Users/Lenovo/AppData/Local/Temp/opencode/inline'+i+'.js',x[1]);});"` затем `node --check C:/Users/Lenovo/AppData/Local/Temp/opencode/inline0.js` (повторить для каждого индекса).
3. Проверка баланса тегов: открыть и закрыть одинаковые `<section>`, `<div class="card">`, `<table>`, `<div class="quizlet-box">`.
4. Проверить: вучет auth-area ровно один раз; `#tl-body` один; `lesson-gate.js` присутствует; quizlet-ссылка в домашке и в quizlet-блоке совпадает; nav содержит `bonus-auto-b2.html`; рабочих ссылок `.speak-btn` на `speak(` — функции нет конфликтов (в шаблоне только один `speak`).

- [ ] **Step 13: Commit**

```bash
git add lessons/parents/bonus-auto-b1.html
git commit -m "feat: бонусный урок B1 (родители) Autoescuela y Psicotécnico из шаблона Qwen"
```

---

### Task 4: Комплексная проверка

- [ ] **Step 1: Все тесты**

Run: `node tests/app-logic.test.js` — Expected: PASS.

- [ ] **Step 2: Инструментные проверки**

1. `git status` — чистый рабочий набор из трёх коммитов.
2. Обновить спеку? — нет, спека уже финальна.
3. Открыть `index.html` и `bonus-auto-b1.html` в браузере: бонусная фаза видна, урок открывается (при наличии firebase-конфига), навигация работает.

- [ ] **Step 3: Финал**

Отчёт пользователю: файлы, коммиты, что осталось (рабочий лист `bonus-auto-b1-parents.html` добавит пользователь, B2–B5 в разработке).