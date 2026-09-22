# Подсказки-спряжения в таблице повторения (ШАГ 6, урок 5.3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить всплывающие подсказки со спряжением для всех 10 конструкций таблицы `.rep-table` в шаге 6 урока `lessons/parents/w05-l3.html`.

**Architecture:** Переиспользуем существующий механизм `.grammar-hint` (CSS-тултип через `content:attr(data-hint)`, ховер + `.active`-тап). В таблице тултип показывается ВНИЗ от элемента (scoped-CSS), чтобы не обрезался контейнером `overflow-x:auto`. Нового JS нет.

**Tech Stack:** Статический HTML + CSS. Верификация — Node.js-скрипт (без фреймворков) в `C:\Users\Lenovo\AppData\Local\Temp\opencode\`.

## Global Constraints

- Единственный изменяемый файл: `lessons/parents/w05-l3.html` (кроме временного скрипта проверки в temp-dir).
- Механизм `.grammar-hint` не менять; JS-листенеры не трогать.
- 10 значений `data-hint` — ТОЧНО как в списке ниже (задания проверяют побайтово; кодировка файла UTF-8).
- CSS-оверрайды — два правила, порядок после `.rep-table .formula b{color:var(--p4)}` (строка 175).
- Стиль коммитов: короткие русские сообщения.

---

### Task 1: scoped CSS для положения тултипа в таблице

**Files:**
- Modify: `lessons/parents/w05-l3.html:175` (добавить 2 правила после строки `.rep-table .formula b{color:var(--p4)}`; у оверрайдов большая специфичность с `.rep-table`, media-query не требуется)
- Test: `C:\Users\Lenovo\AppData\Local\Temp\opencode\check-rep-hints.js` (создать)

**Interfaces:**
- Consumes: существующий `.grammar-hint` CSS-механизм (строки 109–112) и блок `.rep-table` (170–175).
- Produces: селекторы `.rep-table .grammar-hint::after` / `::before` с `top`-позицией — нужны в Task 2, чтобы тултипы в таблице не обрезались.

- [ ] **Step 1: Создать скрипт проверки** (полный код; в режиме `css` проверяет наличие правил и парсинг JS, в режиме `hints` — 10 значений `data-hint` и парсинг JS)

```js
const fs=require('fs'),vm=require('vm');
const file='C:/Users/Lenovo/YandexDisk-interactive.school/Platform/Interactivities/Espanol/spanish-relocation/lessons/parents/w05-l3.html';
const src=fs.readFileSync(file,'utf8');
let fail=0;
const scripts=[...src.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).filter(s=>s.trim().length);
for(const s of scripts){try{new vm.Script(s);}catch(e){console.log('JS PARSE FAIL:',e.message);fail=1;}}
const mode=process.argv[2];
if(mode==='css'){
  const rules=[
    '.rep-table .grammar-hint::after{bottom:auto;top:132%}',
    '.rep-table .grammar-hint::before{bottom:auto;top:122%;border-top-color:transparent;border-bottom-color:var(--ink)}'
  ];
  for(const r of rules){if(src.includes(r))console.log('OK  :',r);else{console.log('MISS:',r);fail=1;}}
}else if(mode==='hints'){
  const hints=[
    'ser: soy, eres, es, somos, sois, son — быть',
    'tener: tengo, tienes, tiene, tenemos, tenéis, tienen — иметь',
    'estar: estoy, estás, está, estamos, estáis, están — находиться (está/están с ударением)',
    'hay — есть/имеется, безличная форма, не спрягается',
    'tener que: tengo que / tienes que / tiene que / tenemos que / tenéis que / tienen que + инфинитив — должен',
    'hay que + инфинитив — нужно (безличное, не спрягается)',
    'ir a: voy a / vas a / va a / vamos a / vais a / van a + инфинитив — собираюсь',
    'quisiera — я хотел бы. Формы: quisiera, quisieras, quisiéramos, quisierais, quisieran',
    'poder: podría / podrías / podría / podríamos / podríais / podrían — не могли бы вы…?',
    'дополнения: me — мне, le — Вам (вежл.). Пример: ¿Me puede…?'
  ];
  for(const h of hints){
    const n=src.split('data-hint="'+h+'"').length-1;
    if(n===1)console.log('OK  :',h.slice(0,44)+'…');
    else{console.log('BAD → count '+n+': '+h);fail=1;}
  }
  const total=(src.match(/class="grammar-hint"/g)||[]).length;
  console.log('span .grammar-hint всего:',total);
  if(total!==10){console.log('ожидалось ровно 10');fail=1;}
}
if(fail){console.log('FAIL');process.exit(1);}
console.log('ALL CHECKS PASSED');
```

- [ ] **Step 2: Запустить проверку и увидеть FAIL (правил ещё нет)**

Run: `node "C:\Users\Lenovo\AppData\Local\Temp\opencode\check-rep-hints.js" css`
Expected: `MISS: .rep-table .grammar-hint::after{bottom:auto;top:132%}` → `FAIL`, exit code 1.

- [ ] **Step 3: Добавить CSS-оверрайды** — после строки `.rep-table .formula b{color:var(--p4)}` вставить (с пустой строкой между):

```css
  .rep-table .formula b{color:var(--p4)}
  /* Тултип в таблице — вниз, чтобы не обрезался контейнером overflow-x:auto */
  .rep-table .grammar-hint::after{bottom:auto;top:132%}
  .rep-table .grammar-hint::before{bottom:auto;top:122%;border-top-color:transparent;border-bottom-color:var(--ink)}
```

- [ ] **Step 4: Запустить проверку и увидеть PASS**

Run: `node "C:\Users\Lenovo\AppData\Local\Temp\opencode\check-rep-hints.js" css`
Expected: 2× `OK : ...`, `ALL CHECKS PASSED`, exit code 0.

- [ ] **Step 5: Коммит**

```bash
git add lessons/parents/w05-l3.html
git commit -m "5.3: тултип в таблице повторения показывать вниз (scoped css)"
```

---

### Task 2: подсказки `data-hint` для всех 10 строк таблицы

**Files:**
- Modify: `lessons/parents/w05-l3.html:499-508` (10 строк `<tr>` таблицы `.rep-table`)
- Test: `C:\Users\Lenovo\AppData\Local\Temp\opencode\check-rep-hints.js` (создан в Task 1)

**Interfaces:**
- Consumes: `.grammar-hint` механизм + scoped-позиция из Task 1.
- Produces: 10 `<b class="grammar-hint" data-hint="…">` — финальный визуальный результат.

- [ ] **Step 1: Запустить проверку и увидеть FAIL (подсказок ещё нет)**

Run: `node "C:\Users\Lenovo\AppData\Local\Temp\opencode\check-rep-hints.js" hints`
Expected: 10× `BAD → count 0: ...` и `span .grammar-hint всего: 0` → `FAIL`, exit code 1.

- [ ] **Step 2: Заменить 10 строк таблицы** (строки 499–508; старый текст → новый)

Строки 1–3 (`ser`, `tener`, `estar`):

```html
        <tr><td class="week">1–2</td><td class="formula"><b class="grammar-hint" data-hint="ser: soy, eres, es, somos, sois, son — быть">ser</b> — быть (суть)</td><td>Soy ruso.</td><td><button class="speak-btn speak" data-text="Soy ruso.">🔊</button></td></tr>
        <tr><td class="week">1–2</td><td class="formula"><b class="grammar-hint" data-hint="tener: tengo, tienes, tiene, tenemos, tenéis, tienen — иметь">tener</b> — иметь</td><td>Tengo un NIE.</td><td><button class="speak-btn speak" data-text="Tengo un NIE.">🔊</button></td></tr>
        <tr><td class="week">1–2</td><td class="formula"><b class="grammar-hint" data-hint="estar: estoy, estás, está, estamos, estáis, están — находиться (está/están с ударением)">estar</b> — находиться</td><td>El ayuntamiento está en el centro.</td><td><button class="speak-btn speak" data-text="El ayuntamiento está en el centro.">🔊</button></td></tr>
```

Строки 4–7 (`hay`, `tengo que`, `hay que`, `voy a`):

```html
        <tr><td class="week">1–2</td><td class="formula"><b class="grammar-hint" data-hint="hay — есть/имеется, безличная форма, не спрягается">hay</b> — есть</td><td>Hay una ventanilla.</td><td><button class="speak-btn speak" data-text="Hay una ventanilla.">🔊</button></td></tr>
        <tr><td class="week">3–4</td><td class="formula"><b class="grammar-hint" data-hint="tener que: tengo que / tienes que / tiene que / tenemos que / tenéis que / tienen que + инфинитив — должен">tengo que</b> + инфинитив — я должен</td><td>Tengo que rellenar la hoja.</td><td><button class="speak-btn speak" data-text="Tengo que rellenar la hoja.">🔊</button></td></tr>
        <tr><td class="week">3–4</td><td class="formula"><b class="grammar-hint" data-hint="hay que + инфинитив — нужно (безличное, не спрягается)">hay que</b> + инфинитив — нужно</td><td>Hay que adjuntar el pasaporte.</td><td><button class="speak-btn speak" data-text="Hay que adjuntar el pasaporte.">🔊</button></td></tr>
        <tr><td class="week">3–4</td><td class="formula"><b class="grammar-hint" data-hint="ir a: voy a / vas a / va a / vamos a / vais a / van a + инфинитив — собираюсь">voy a</b> + инфинитив — я собираюсь</td><td>Voy a recoger el certificado.</td><td><button class="speak-btn speak" data-text="Voy a recoger el certificado.">🔊</button></td></tr>
```

Строки 8–10 (`quisiera`, `¿podría...?`, `me / le`):

```html
        <tr><td class="week">5</td><td class="formula"><b class="grammar-hint" data-hint="quisiera — я хотел бы. Формы: quisiera, quisieras, quisiéramos, quisierais, quisieran">quisiera</b> — я хотел бы</td><td>Quisiera empadronarme.</td><td><button class="speak-btn speak" data-text="Quisiera empadronarme.">🔊</button></td></tr>
        <tr><td class="week">5</td><td class="formula"><b class="grammar-hint" data-hint="poder: podría / podrías / podría / podríamos / podríais / podrían — не могли бы вы…?">¿podría...?</b> — не могли бы вы?</td><td>¿Podría darme una cita?</td><td><button class="speak-btn speak" data-text="¿Podría darme una cita?">🔊</button></td></tr>
        <tr><td class="week">5</td><td class="formula"><b class="grammar-hint" data-hint="дополнения: me — мне, le — Вам (вежл.). Пример: ¿Me puede…?">me / le</b> — мне / Вам</td><td>¿Me puede mandar el certificado?</td><td><button class="speak-btn speak" data-text="¿Me puede mandar el certificado?">🔊</button></td></tr>
```

- [ ] **Step 3: Запустить проверку и увидеть PASS**

Run: `node "C:\Users\Lenovo\AppData\Local\Temp\opencode\check-rep-hints.js" hints`
Expected: 10× `OK : ...`, `span .grammar-hint всего: 10`, `ALL CHECKS PASSED`, exit code 0.

- [ ] **Step 4: Визуальная проверка в браузере** (опционально, но желательно): открыть урок, в таблице навести/тапнуть на конструкцию `ser` — тултип с формами появляется СНИЗУ, первая и последняя строки не обрезаются; 🔊 в соседней колонке озвучивает пример (не конфликтует с подсказкой).

- [ ] **Step 5: Коммит**

```bash
git add lessons/parents/w05-l3.html
git commit -m "5.3: подсказки со спряжением в таблице повторения (10 конструкций)"
```

---