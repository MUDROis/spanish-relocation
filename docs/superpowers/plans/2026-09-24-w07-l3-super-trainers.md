# Супер-тренажёры Станции 2 (w07-l3) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить в `lessons/kids/w07-l3.html` два интерактивных тренажёра — «Супер-сопоставление» (30 пар испанский↔русский в 3 этапах по 10) и «Супер-конструктор» (10 фраз из чипов слов) — и связать их с пунктом 3 домашнего задания.

**Architecture:** Обе секции внедряются в страницу чекпоинта между секцией «Диплом» и «Светофор». Логика повторяет существующие платформенные паттерны: сопоставление «клик-клик» по двум колонкам с `dataset.v` (w07-l1/w07-l2) и конструктор чипов с проверкой порядка (w07-l2:496-517). Состояние хранится в глобальных объектах (`SM`, `SCO`), рендер через `document.createElement` + `appendChild` в контейнеры. Озвучка тренажёров — **только TTS** через существующую `audTTS()` (по требованию пользователя; запасной HTML5-аудио не задействуется).

**Tech Stack:** Ванильный ES5 JavaScript с одним инлайн-скриптом урока, HTML+CSS (паттерны платформы `.match-item`, `.sb-word`, `.match-columns`, `.game-fb`). Тесты — Node-харнесс (DOM-стабы) `C:\Users\Lenovo\AppData\Local\Temp\opencode\w07-l3-harness.js`.

## Global Constraints

- Стиль кода урока: ES5 (`var`, `function`, без arrow/let/const/template-literal).
- Использовать существующие хелперы урока: `$(id)` = `document.getElementById`, `shuf(a)` (перемешивание), `audTTS(t)` (ТТS-озвучка).
- Тренажёры озвучиваются вызовом `audTTS(...)`, **не** `speak(...)` (никаких MP3 для тренажёров).
- Идентификаторы контейнеров/элементов не должны пересекаться с существующими (`gz*`, `sp*`, `spk*`, `op*`, `fb*`, `md*`, `wr*`, `mo*`, `ms*`, `mb*`, `tl*`, `passport`, `stars`, `dip-*`).
- Данные строго по спеке: 30 пар (этап 1 — канцелярия+час:10, этап 2 — дни+система:10, этап 3 — ступени+класс:10), 10 фраз конструктора.
- Запуск всех проверок: `node "C:\Users\Lenovo\AppData\Local\Temp\opencode\w07-l3-harness.js"` — ожидается `ALL PASS`.

---

### Task 1: Каркас — CSS, секции и анкоры (плюс уточнение харнесса)

**Files:**
- Modify: `lessons/kids/w07-l3.html` (вставка CSS в `<style>` перед `.grammar-hint`, секций после `.badge-zone` и перед `.tl-wrap`, анкоров в домашке)
- Test: `C:\Users\Lenovo\AppData\Local\Temp\opencode\w07-l3-harness.js`

**Interfaces:**
- Consumes: существующие CSS-переменные `--soft`, `--teal`, `--green`, `--sun` (определены в `:root`).
- Produces: DOM-идентификаторы `sm-name`, `sm-stars`, `sm-progress`, `sm-left`, `sm-right`, `sm-fb`, `sm-next`, `sm-reset`, `sc-count`, `sc-stars`, `sc-target`, `sc-pool`, `sc-fb`, `sc-retry`, `sc-next`; якоря `#super-match`, `#super-constructor`.

- [ ] **Step 1: Добавить в харнесс fidelity-улучшение** — у стабовых элементов `innerHTML` должен очищать `children` (как в реальном DOM):

```js
function makeEl(id) {
  const el = {
    id: id || null, _html: '', textContent: '', className: '', style: {},
    onclick: null, children: [], dataset: {},
    classList: { add() {}, remove() {}, contains() { return false; } },
    appendChild(c) { this.children.push(c); },
    removeChild() {}, querySelectorAll() { return []; },
    addEventListener() {}, getAttribute() { return null; }, parentNode: null
  };
  Object.defineProperty(el, 'innerHTML', {
    get() { return this._html; },
    set(v) { this._html = v; this.children.length = 0; }
  });
  return el;
}
```

- [ ] **Step 2: Добавить в харнесс статические RED-проверки** (перед `console.log(pass...)`):

```js
// ---- super trainers scaffolding ----
check('homework anchors to trainers', html.includes('href="#super-match"') && html.includes('href="#super-constructor"'));
check('match section ids present', ['sm-name', 'sm-left', 'sm-right', 'sm-fb', 'sm-next', 'sm-reset'].every(function (id) { return html.includes('id="' + id + '"'); }));
check('constructor section ids present', ['sc-count', 'sc-target', 'sc-pool', 'sc-fb', 'sc-retry', 'sc-next'].every(function (id) { return html.includes('id="' + id + '"'); }));
check('trainer CSS present', html.includes('.match-columns{') && html.includes('.sb-word{') && html.includes('.game-fb{'));
```

- [ ] **Step 3: Прогнать харнесс и убедиться, что новые проверки ПАДАЮТ**
  Run: `node "C:\Users\Lenovo\AppData\Local\Temp\opencode\w07-l3-harness.js"`
  Expected: новые 4 проверки `FAIL`, остальные `PASS` (первая «RED»).

- [ ] **Step 4: Добавить CSS в `<style>` урока** (после строки `.grammar-hint:hover::after,.grammar-hint.active::after{opacity:1}`):

```css
  .game-fb{font-weight:800;margin-top:12px;min-height:26px}
  .match-columns{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .match-item{background:var(--soft);border:3px solid transparent;border-radius:12px;padding:11px;font-weight:800;cursor:pointer;text-align:center;font-size:.92rem;transition:.15s}
  .match-item.selected{border-color:var(--teal);background:#E0F2F1}
  .match-item.matched{background:#C8E6C9;border-color:var(--green);cursor:default;opacity:.85}
  .match-item.wrong{background:#FFCDD2;animation:shake .4s}
  .sb-pool{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
  .sb-word{background:#fff;border:2px solid var(--teal);border-radius:999px;padding:8px 16px;font-weight:800;cursor:pointer;transition:.15s}
  .sb-word:hover{background:var(--teal);color:#fff}
  .sb-word.placed{opacity:.3;cursor:default}
  .sb-target{border:3px dashed var(--teal);border-radius:16px;padding:14px 18px;font-weight:800;font-size:1.05rem;margin:12px 0;min-height:64px;text-align:center}
  .sm-meta{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px;font-weight:800}
  @media(max-width:600px){.match-columns{grid-template-columns:1fr}}
```

- [ ] **Step 5: Добавить HTML-секции** сразу после секции `.badge-zone` (`</section>` диплома) и перед `<section class="tl-wrap">`:

```html
  <!-- ТРЕНАЖЁР 1: СУПЕР-СОПОСТАВЛЕНИЕ -->
  <section class="block" style="--c:#3E7CB1" id="super-match">
    <div class="block-head"><h2 class="block-title">🧩 Супер-сопоставление</h2><span class="time-badge">этап <span id="sm-name">1</span></span></div>
    <div class="script">Соедини пары: испанское слово ↔ русский перевод. 3 этапа по 10 пар!</div>
    <div class="sm-meta"><span>⭐ Звёзд: <span id="sm-stars">0</span></span><span>Найдено: <span id="sm-progress">0/10</span></span></div>
    <div class="match-columns"><div id="sm-left"></div><div id="sm-right"></div></div>
    <div class="game-fb" id="sm-fb"></div>
    <button class="speak-btn" id="sm-next" style="display:none">Следующий этап →</button>
    <button class="speak-btn" style="background:#E9A13B" id="sm-reset">🔄 Начать заново</button>
  </section>

  <!-- ТРЕНАЖЁР 2: СУПЕР-КОНСТРУКТОР -->
  <section class="block" style="--c:#E91E63" id="super-constructor">
    <div class="block-head"><h2 class="block-title">🎯 Супер-конструктор</h2><span class="time-badge"><span id="sc-count">1</span> из 10</span></div>
    <div class="sm-meta"><span>⭐ Звёзд: <span id="sc-stars">0</span></span></div>
    <div class="sb-target" id="sc-target">…</div>
    <div class="sb-pool" id="sc-pool"></div>
    <div class="game-fb" id="sc-fb"></div>
    <button class="speak-btn" id="sc-retry" style="display:none">↺ Собрать снова</button>
    <button class="speak-btn gold" id="sc-next" style="display:none">Следующая фраза →</button>
  </section>
```

- [ ] **Step 6: Обновить пункт 3 домашнего задания** (заменить строку `147`):

```html
    <div class="task"><div class="task-num star">3</div><div><strong>Тренажёры Станции 2</strong> · 15 мин ⭐<br><a href="#super-match">🧩 Супер-сопоставление (30 пар)</a> · <a href="#super-constructor">🎯 Супер-конструктор</a></div></div>
```

- [ ] **Step 7: Прогнать харнесс — все проверки зелёные**
  Run: `node "C:\Users\Lenovo\AppData\Local\Temp\opencode\w07-l3-harness.js"` — «ALL PASS».

- [ ] **Step 8: Commit**

```bash
git add lessons/kids/w07-l3.html
git commit -m "w07-l3: каркас супер-тренажёров (секции, CSS, анкоры домашки)"
```

---

### Task 2: Тренажёр «Супер-сопоставление» (30 пар)

**Files:**
- Modify: `lessons/kids/w07-l3.html` (вставка JS-блока в конец инлайн-скрипта, перед `document.querySelectorAll('.tl-cell')...`)
- Test: `C:\Users\Lenovo\AppData\Local\Temp\opencode\w07-l3-harness.js`

**Interfaces:**
- Consumes: хелперы `$`, `shuf`; DOM-иды `sm-name`, `sm-stars`, `sm-progress`, `sm-left`, `sm-right`, `sm-fb`, `sm-next`, `sm-reset` (из Task 1).
- Produces: глобальные `SUPERM`, `SM`; функции `renderSM()`, `smClick(d)`, `smNext()`. Внутри использует `audTTS(es)` для озвучки испанского слова.

- [ ] **Step 1: Добавить в харнесс RED-тесты** (перед финальным `console.log(pass...)`):

```js
// ---- super matching ----
check('SUPERM: 3 stages x 10 pairs', typeof SUPERM === 'object' && SUPERM.length === 3 &&
  SUPERM.every(function (s) { return s.pairs && s.pairs.length === 10; }),
  SUPERM ? SUPERM.map(function (s) { return s.pairs.length; }).join(',') : 'undefined');
check('match boot renders 10 es + 10 ru', registry['sm-left'] && registry['sm-left'].children.length === 10 &&
  registry['sm-right'] && registry['sm-right'].children.length === 10,
  (registry['sm-left'] ? registry['sm-left'].children.length : '-') + '/' +
  (registry['sm-right'] ? registry['sm-right'].children.length : '-'));
(function () {
  const L = registry['sm-left'], R = registry['sm-right'];
  if (!L || !R || !L.children.length) return;
  const first = L.children[0], pairKey = first.dataset.v;
  const ruMatch = R.children.find(function (c) { return c.dataset.v === pairKey; });
  first.onclick();
  ruMatch.onclick();
  check('matching a pair increments done to 1', SM.done === 1, 'done=' + (SM ? SM.done : 'none'));
  check('matching speaks Spanish word (TTS)', spoken.indexOf(first.dataset.v) >= 0,
    'spoken=' + JSON.stringify(spoken));
})();
(function () {
  SM.stars = 0; SM.s = 0; renderSM();
  const L = registry['sm-left'], R = registry['sm-right'];
  const st = SUPERM[0];
  for (let i = 0; i < st.pairs.length; i++) {
    const key = st.pairs[i][0];
    const esEl = L.children.find(function (c) { return c.dataset.v === key; });
    const ruEl = R.children.find(function (c) { return c.dataset.v === key; });
    esEl.onclick(); ruEl.onclick();
  }
  check('stage complete shows Next button', registry['sm-next'].style.display !== 'none');
  check('stage completes: stars = 1', SM.stars === 1, 'stars=' + SM.stars);
  registry['sm-next'].onclick();
  check('next stage advances to stage 2', SM.s === 1 && registry['sm-name'].textContent === '2',
    's=' + (SM ? SM.s : '-') + ' name=' + registry['sm-name'].textContent);
})();
```

- [ ] **Step 2: Прогнать харнесс — RED**
  Expected: проверки `SUPERM`/`match boot`/`matching a pair`/`stage complete`/`next stage` ПАДАЮТ (не определено), остальные PASS.

- [ ] **Step 3: Вставить JS-блок матча** в конец скрипта урока (перед строкой `document.querySelectorAll('.tl-cell')...`):

```js
/* ===== ТРЕНАЖЁР 1: СУПЕР-СОПОСТАВЛЕНИЕ (30 пар) ===== */
var SUPERM=[
 {pairs:[['el lápiz','карандаш'],['la goma','ластик'],['el cuaderno','тетрадь'],['el estuche','пенал'],['la regla','линейка'],['la mochila','рюкзак'],['los lápices','карандаши'],['las nueve','девять часов'],['la hora','час (время)'],['Mates','математика']]},
 {pairs:[['el lunes','понедельник'],['el martes','вторник'],['el miércoles','среда'],['el jueves','четверг'],['el viernes','пятница'],['el sábado','суббота'],['el domingo','воскресенье'],['el colegio','школа (6–12)'],['el instituto','средняя школа (12–16)'],['la ESO','старшие классы']]},
 {pairs:[['Infantil','дошкольное звено'],['Primaria','начальная школа'],['el trimestre','триместр'],['la pizarra','доска'],['la mesa','парта'],['la silla','стул'],['la papelera','корзина'],['la puerta','дверь'],['la ventana','окно'],['el reloj','часы (настенные)']]}
];
var SM={s:0,sel:null,done:0,stars:0};
function renderSM(){
  var st=SUPERM[SM.s];
  SM.sel=null;SM.done=0;
  $('sm-name').textContent=st.name||(SM.s+1);
  $('sm-progress').textContent='0/10';
  $('sm-fb').textContent='';
  $('sm-next').style.display='none';
  var L=$('sm-left'),R=$('sm-right');
  L.innerHTML='';R.innerHTML='';
  shuf(st.pairs.slice()).forEach(function(p){
    var d=document.createElement('div');d.className='match-item';d.textContent=p[0];d.dataset.v=p[0];
    d.onclick=function(){smClick(d);};L.appendChild(d);
  });
  shuf(st.pairs.slice()).forEach(function(p){
    var d=document.createElement('div');d.className='match-item';d.textContent=p[1];d.dataset.v=p[0];
    d.onclick=function(){smClick(d);};R.appendChild(d);
  });
}
function smClick(d){
  if(d.className.indexOf('matched')>=0)return;
  if(!SM.sel){SM.sel=d;d.className='match-item selected';return;}
  if(SM.sel===d){d.className='match-item';SM.sel=null;return;}
  if(SM.sel.dataset.v===d.dataset.v){
    SM.sel.className='match-item matched';d.className='match-item matched';SM.sel=null;
    SM.done++;$('sm-progress').textContent=SM.done+'/10';
    audTTS(SUPERM[SM.s].pairs.filter(function(p){return p[0]===d.dataset.v;})[0][0]);
    $('sm-fb').textContent='✅ Найдено '+SM.done+'/10';
    if(SM.done===10){
      SM.stars++;$('sm-stars').textContent=SM.stars;
      $('sm-fb').textContent='🏆 Этап пройден! ⭐ +1';
      $('sm-next').style.display='';
    }
  }else{
    var a=SM.sel;d.className='match-item wrong';a.className='match-item wrong';SM.sel=null;
    var ok=SUPERM[SM.s].pairs.filter(function(p){return p[0]===d.dataset.v;})[0];
    var fb=ok?ok[0]+' — '+ok[1]:'?';
    $('sm-fb').textContent='❌ Правильно: '+fb;
    setTimeout(function(){a.className='match-item';d.className='match-item';},600);
  }
}
function smNext(){SM.s++;if(SM.s>=SUPERM.length){$('sm-fb').textContent='🎉 Супер-сопоставление пройдено! '+SM.stars+' из 3 звёзд. ¡Enhorabuena!';$('sm-next').style.display='none';return;}renderSM();}
$('sm-next').onclick=smNext;
$('sm-reset').onclick=function(){SM.s=0;SM.stars=0;$('sm-stars').textContent='0';renderSM();};
renderSM();
```

- [ ] **Step 4: Прогнать харнесс — GREEN**
  Expected: все проверки матча PASS, остальные PASS. Итог `ALL PASS`.

- [ ] **Step 5: Commit**

```bash
git add lessons/kids/w07-l3.html
git commit -m "w07-l3: тренажёр супер-сопоставление (30 пар, 3 этапа)"
```

---

### Task 3: Тренажёр «Супер-конструктор» (10 фраз)

**Files:**
- Modify: `lessons/kids/w07-l3.html` (JS-блок после блока матча, перед `document.querySelectorAll('.tl-cell')...`)
- Test: `C:\Users\Lenovo\AppData\Local\Temp\opencode\w07-l3-harness.js`

**Interfaces:**
- Consumes: хелперы `$`, `shuf`, `audTTS`; DOM-иды `sc-count`, `sc-stars`, `sc-target`, `sc-pool`, `sc-fb`, `sc-retry`, `sc-next` (Task 1).
- Produces: глобальные `SUPERC`, `SCO`; функции `renderSC()`, `scRetry()`, `scNext()`.

- [ ] **Step 1: Добавить в харнесс RED-тесты**:

```js
// ---- super constructor ----
check('SUPERC: 10 phrases', typeof SUPERC === 'object' && SUPERC.length === 10,
  SUPERC ? String(SUPERC.length) : 'undefined');
check('constructor boot shows 10 chips', registry['sc-pool'] && registry['sc-pool'].children.length === 10,
  registry['sc-pool'] ? String(registry['sc-pool'].children.length) : '-');
(function () {
  const pool = registry['sc-pool'];
  if (!pool) return;
  const ph = SUPERC[0];
  spoken.length = 0;
  for (let i = 0; i < ph.w.length; i++) {
    const idx = pool.children.findIndex(function (c) { return c.textContent === ph.w[i]; });
    if (idx < 0) break;
    pool.children[idx].onclick();
  }
  check('correct order builds phrase and stars=1', SCO.stars === 1,
    'stars=' + (SCO ? SCO.stars : '-') + ' target=' + registry['sc-target'].textContent);
  check('constructor solves speak via TTS', spoken.length === 1 && spoken[0] === SUPERC[0].w.join(' '),
    JSON.stringify(spoken));
  check('next phrase button shows', registry['sc-next'].style.display !== 'none');
  registry['sc-next'].onclick();
  check('next advances to phrase 2', SCO.i === 1 && registry['sc-count'].textContent === '2',
    'i=' + (SCO ? SCO.i : '-') + ' count=' + registry['sc-count'].textContent);
})();
```

- [ ] **Step 2: Прогнать харнесс — RED**
  Expected: три проверки конструктора ПАДАЮТ, остальные PASS.

- [ ] **Step 3: Вставить JS-блок конструктора** (после блока матча):

```js
/* ===== ТРЕНАЖЁР 2: СУПЕР-КОНСТРУКТОР (10 фраз) ===== */
var SUPERC=[
 {w:['El','lunes','tengo','Mates','a','las','nueve.'],t:'У меня математика в понедельник в девять'},
 {w:['Son','las','dos','y','media.'],t:'Сейчас половина третьего'},
 {w:['La','pizarra','está','delante','de','la','mesa.'],t:'Доска перед партой'},
 {w:['Los','libros','están','en','la','estantería.'],t:'Книги на полке'},
 {w:['En','mi','mochila','hay','un','lápiz','y','un','cuaderno.'],t:'В рюкзаке карандаш и тетрадь'},
 {w:['Yo','estoy','en','Primaria','y','tengo','ocho','años.'],t:'Я в начальной школе, мне восемь лет'},
 {w:['Mi','clase','es','luminosa','y','moderna.'],t:'Мой класс светлый и современный'},
 {w:['En','mi','clase','se','puede','trabajar','en','equipo.'],t:'В классе можно работать в команде'},
 {w:['En','clase','no','se','puede','usar','el','móvil.'],t:'В классе нельзя пользоваться телефоном'},
 {w:['Tengo','que','escuchar','al','profe.'],t:'Я должен слушать учителя'}
];
var SCO={i:0,built:[],stars:0};
function renderSC(){
  SCO.built=[];
  var ph=SUPERC[SCO.i];
  $('sc-count').textContent=SCO.i+1;
  $('sc-target').textContent='…';
  $('sc-fb').textContent='';
  $('sc-retry').style.display='none';
  $('sc-next').style.display='none';
  var pool=$('sc-pool');pool.innerHTML='';
  shuf(ph.w.slice()).forEach(function(w){
    var b=document.createElement('div');b.className='sb-word';b.textContent=w;
    b.onclick=function(){
      if(b.className.indexOf('placed')>=0)return;
      b.className='sb-word placed';
      SCO.built.push(w);
      $('sc-target').textContent=SCO.built.join(' ');
      if(SCO.built.length===SUPERC[SCO.i].w.length){
        var ok=SCO.built.every(function(x,i){return x===SUPERC[SCO.i].w[i];});
        if(ok){SCO.stars++;$('sc-stars').textContent=SCO.stars;$('sc-fb').textContent='✅ ¡Perfecto! '+SUPERC[SCO.i].t;$('sc-next').style.display='';audTTS(SUPERC[SCO.i].w.join(' '));}
        else{$('sc-fb').textContent='❌ Правильно: '+SUPERC[SCO.i].w.join(' ');$('sc-retry').style.display='';}
      }
    };
    pool.appendChild(b);
  });
}
function scRetry(){renderSC();}
function scNext(){SCO.i=(SCO.i+1)%SUPERC.length;if(SCO.i===0){$('sc-fb').textContent='🎉 Конструктор пройден! '+SCO.stars+' из 10 звёзд. ¡Bien hecho!';return;}renderSC();}
$('sc-retry').onclick=scRetry;
$('sc-next').onclick=scNext;
renderSC();
```

- [ ] **Step 4: Прогнать харнесс — GREEN**
  Expected: все проверки PASS, итог `ALL PASS`.

- [ ] **Step 5: Commit**

```bash
git add lessons/kids/w07-l3.html
git commit -m "w07-l3: тренажёр супер-конструктор (10 фраз, чипы)"
```

---

### Task 4: Регрессия и завершение

**Files:**
- Test: `C:\Users\Lenovo\AppData\Local\Temp\opencode\w07-l3-harness.js`

**Interfaces:** без новых.

- [ ] **Step 1: Полный прогон харнесса**
  Run: `node "C:\Users\Lenovo\AppData\Local\Temp\opencode\w07-l3-harness.js"`
  Expected: `ALL PASS` (включая старые проверки: 7 штампов, `sp2` → MP3, `resume()` отсутствует, quizlet, домашка, `[mudro]`-диагностика, AUD-карта 16 фраз).

- [ ] **Step 2: Визуальная сверка данных со спекой**
  - 30 пар: этап 1 «Рюкзак и время», этап 2 «Дни и система», этап 3 «Класс» — ровно по 10, без пропусков/дублей.
  - 10 фраз конструктора — токены собираются в фразы из спеки (без лишних пробелов, с точками).

- [ ] **Step 3: Commit (если были правки)**

```bash
git add lessons/kids/w07-l3.html
git commit -m "w07-l3: финальная регрессия супер-тренажёров"
```