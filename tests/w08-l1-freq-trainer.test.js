const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

/* Регрессия: бонус-тренажёр «Наречия частотности» в уроке родителей 8.1
   (lessons/parents/w08-l1.html). Проверяем:
   — блок стоит сразу после основного тренажёра слов (#train-section);
   — не пересекается с уроком: свои id (fq-*), одна реализация speak()/shuffle(),
     массив FILL урока не перебит (у тренажёра — FQ_FILL);
   — все 5 режимов работают: шкала, сопоставление, сборка шкалы, вставка, конструктор. */

const LESSON = path.join(__dirname, '..', 'lessons', 'parents', 'w08-l1.html');
const html = fs.readFileSync(LESSON, 'utf8');

const START = '// ===== БОНУС-ТРЕНАЖЁР: НАРЕЧИЯ ЧАСТОТНОСТИ — НАЧАЛО =====';
const END = '// ===== БОНУС-ТРЕНАЖЁР: НАРЕЧИЯ ЧАСТОТНОСТИ — КОНЕЦ =====';

function countOf(haystack, needle) {
  return haystack.split(needle).length - 1;
}

// ---------------------------------------------------------------- DOM-заглушка
function makeEl(tag) {
  const el = {
    tagName: (tag || 'div').toUpperCase(),
    id: null, className: '', textContent: '', title: '',
    style: {}, dataset: {}, children: [], parentElement: null,
    onclick: null, _html: ''
  };
  el.classList = {
    add(...names) {
      for (const n of names) {
        if (n && !el.className.split(' ').includes(n)) el.className = (el.className + ' ' + n).trim();
      }
    },
    remove(...names) {
      el.className = el.className.split(' ').filter(c => c && !names.includes(c)).join(' ');
    },
    contains(n) { return el.className.split(' ').includes(n); },
    toggle(n) { if (el.classList.contains(n)) el.classList.remove(n); else el.classList.add(n); }
  };
  Object.defineProperty(el, 'innerHTML', {
    get() { return el._html; },
    set(v) { el._html = v; el.children.length = 0; }
  });
  el.appendChild = function (c) { c.parentElement = el; el.children.push(c); return c; };
  el.removeChild = function (c) {
    const i = el.children.indexOf(c);
    if (i >= 0) el.children.splice(i, 1);
  };
  el.querySelectorAll = function () { return []; };
  el.addEventListener = function () {};
  el.getAttribute = function (n) { return n === 'id' ? el.id : null; };
  el.closest = function () { return null; };
  return el;
}

const MODES = ['scale', 'match', 'build', 'fill', 'maker'];
const CONTAINERS = [
  'fq-scale-box', 'fq-match-box', 'fq-build-slots', 'fq-build-pool', 'fq-build-fb',
  'fq-fill-box', 'fq-fill-fb', 'fq-maker-adv', 'fq-maker-act',
  'fq-maker-result', 'fq-maker-es', 'fq-maker-ru', 'fq-maker-speak'
];

function boot() {
  const reg = {};
  for (const id of CONTAINERS) { reg[id] = makeEl('div'); reg[id].id = id; }

  const tabs = MODES.map((m) => { const t = makeEl('button'); t.className = 'tab'; t.dataset.mode = m; return t; });
  const modeEls = MODES.map((m) => {
    const e = makeEl('div');
    e.id = 'fq-' + m;
    e.className = 'fq-mode' + (m === 'scale' ? ' active' : '');
    reg[e.id] = e; // в реальном DOM это <div class="fq-mode" id="fq-режим">
    return e;
  });

  const document = {
    getElementById(id) { return reg[id] || null; },
    createElement(tag) { return makeEl(tag); },
    querySelectorAll(sel) {
      if (sel === '#fq-tabs .tab') return tabs;
      if (sel === '.fq-mode') return modeEls;
      return [];
    },
    querySelector(sel) { return sel === '#fq-tabs .tab' ? tabs[0] : null; }
  };

  const spoken = [];
  const timers = [];
  const sandbox = {
    document,
    window: {},
    console,
    setTimeout(fn) { timers.push(fn); return timers.length; },
    speak(t) { spoken.push(t); },
    shuffle(a) {
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    }
  };

  const s = html.indexOf(START);
  const e = html.indexOf(END);
  assert.ok(s >= 0, 'в уроке нет маркера начала блока тренажёра');
  assert.ok(e > s, 'в уроке нет маркера конца блока тренажёра');
  const code = html.slice(s, e);
  vm.runInNewContext(code, sandbox, { filename: 'freq-trainer.js' });

  return { ctx: sandbox, reg, tabs, modeEls, spoken, timers, document };
}

// ------------------------------------------------------------------ статика
test('блок тренажёра стоит сразу после основного тренажёра слов', () => {
  const iTrain = html.indexOf('id="train-section"');
  const iFreq = html.indexOf('id="freq-section"');
  const iQuizlet = html.indexOf('class="quizlet-box"');
  assert.ok(iTrain >= 0, 'в уроке есть основной тренажёр слов (#train-section)');
  assert.ok(iFreq > iTrain, 'тренажёр частотности идёт ПОСЛЕ основного тренажёра слов');
  assert.ok(iQuizlet > iFreq, 'тренажёр частотности стоит до блока Quizlet');
});

test('все 5 режимов тренажёра есть в разметке', () => {
  for (const m of MODES) {
    assert.ok(html.includes('id="fq-' + m + '"'), 'нет режима #' + m);
    assert.ok(html.includes("showFQ('" + m + "'"), 'нет переключателя режима #' + m);
  }
  assert.ok(html.includes('id="fq-tabs"'), 'нет вкладок тренажёра');
});

test('тренажёр не пересекается с уроком: id, speak(), shuffle(), FILL', () => {
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(x => x[1]);
  const dupes = ids.filter((v, i) => ids.indexOf(v) !== i);
  assert.deepStrictEqual(dupes, [], 'дубли id в уроке');

  assert.strictEqual(countOf(html, 'function speak('), 1, 'должен быть ровно один speak()');
  assert.strictEqual(countOf(html, 'function shuffle('), 1, 'должен быть ровно один shuffle()');
  assert.strictEqual(countOf(html, 'var FILL ='), 1, 'массив FILL урока не должен перебиваться');
  assert.strictEqual(countOf(html, 'var FQ_FILL ='), 1, 'у тренажёра свой массив FQ_FILL');

  // id из исходного тренажёра не должны появляться без префикса fq-
  for (const id of ['scale-box', 'match-box', 'build-slots', 'build-pool', 'fill-box', 'maker-adv', 'maker-act']) {
    assert.ok(!html.includes('id="' + id + '"'), 'id "' + id + '" должен быть с префиксом fq-');
  }
});

// ------------------------------------------------------------------ данные
test('данные шкалы: 8 наречий 100% → 0% с переводами и примерами', () => {
  const { ctx } = boot();
  const adv = Array.from(ctx.FQ_ADV);
  assert.strictEqual(adv.length, 8);
  assert.deepStrictEqual(adv.map(a => a.pct), [100, 95, 85, 75, 50, 25, 15, 0]);
  assert.strictEqual(new Set(adv.map(a => a.es)).size, 8, 'наречия не повторяются');
  assert.strictEqual(new Set(adv.map(a => a.ru)).size, 8, 'переводы не повторяются');
  for (const a of adv) {
    assert.ok(a.ru && a.ruM && a.ex && a.exRu && a.sc && a.scRu, 'неполные данные: ' + a.es);
  }
  // шкала идёт по убыванию
  for (let i = 1; i < adv.length; i++) assert.ok(adv[i - 1].pct > adv[i].pct);
});

test('вопросы «Вставь наречие» соответствуют шкале', () => {
  const { ctx } = boot();
  const fill = Array.from(ctx.FQ_FILL);
  assert.strictEqual(fill.length, 8);
  for (const q of fill) {
    const adv = ctx.FQ_ADV.find(a => a.es === q.ok);
    assert.ok(adv, 'нет наречия ' + q.ok);
    assert.strictEqual(q.hint, adv.pct + '%', 'подсказка не совпадает с процентом: ' + q.ok);
    assert.ok(q.s.startsWith('___ '), 'пропуск должен стоять в начале фразы');
  }
});

// ------------------------------------------------------------------ режимы
test('режим «Шкала»: 8 строк, проценты, два примера, раскрытие по клику', () => {
  const { reg } = boot();
  const items = reg['fq-scale-box'].children;
  assert.strictEqual(items.length, 8);

  const first = items[0];
  const row = first.children[0];
  assert.strictEqual(row.children[0].textContent, '100%');
  assert.strictEqual(row.children[1].children[0].textContent, 'siempre');

  const detail = first.children[1];
  assert.strictEqual(detail.children.length, 4, 'ожидаем 2 примера + 2 перевода');
  assert.ok(detail.children[0].children[1].textContent.startsWith('Siempre'));
  assert.ok(detail.children[2].children[1].textContent.startsWith('Siempre recogemos'));

  // клик по строке раскрывает примеры
  row.onclick({ target: { tagName: 'DIV' } });
  assert.ok(detail.classList.contains('open'), 'примеры должны раскрыться');
  // клик по кнопке внутри строки не должен переключать шкалу (кнопка сама управляет примером)
  row.onclick({ target: { tagName: 'BUTTON' } });
  assert.ok(detail.classList.contains('open'), 'клик по кнопке не должен закрывать/открывать шкалу');
});

test('режим «Наречие ↔ процент»: верная пара — зелёная, неверная — красная', () => {
  const { reg, spoken } = boot();
  const cols = reg['fq-match-box'].children[0].children; // .match-container → 2 колонки
  assert.strictEqual(cols[0].children.length, 8);
  assert.strictEqual(cols[1].children.length, 8);

  const left = cols[0].children.find(c => c.textContent === 'siempre');
  const right = cols[1].children.find(c => c.textContent === '100%');
  left.onclick();
  right.onclick();
  assert.ok(left.classList.contains('done'), 'верная пара должна стать зелёной');
  assert.ok(right.classList.contains('done'));
  assert.ok(spoken.includes('siempre'), 'верная пара озвучивается');

  const left2 = cols[0].children.find(c => c.textContent === 'nunca');
  const right2 = cols[1].children.find(c => c.textContent === '50%');
  left2.onclick();
  right2.onclick();
  assert.ok(left2.classList.contains('error'), 'неверная пара должна стать красной');
  assert.ok(right2.classList.contains('error'));
});

test('режим «Собери шкалу»: порядок 100% → 0%, ошибки считаются', () => {
  const { reg } = boot();
  const slots = reg['fq-build-slots'].children;
  const pool = reg['fq-build-pool'].children;
  assert.strictEqual(slots.length, 8);
  assert.strictEqual(pool.length, 8);

  // ошибка: начинаем не с 100%
  const wrong = pool.find(c => c.textContent === 'nunca');
  wrong.onclick();
  assert.ok(wrong.classList.contains('error'));
  assert.ok(reg['fq-build-fb'].classList.contains('bad'), 'показан фидбек об ошибке');

  // правильный порядок
  const order = ['siempre', 'casi siempre', 'muchas veces', 'a menudo', 'a veces', 'pocas veces', 'casi nunca', 'nunca'];
  order.forEach((name, i) => {
    const chip = pool.find(c => c.textContent === name);
    assert.ok(chip, 'нет чипа ' + name);
    chip.onclick();
    assert.strictEqual(slots[i].children[1].textContent, name, 'слот ' + i + ' заполнен неверно');
    assert.ok(slots[i].children[1].classList.contains('filled'));
  });
  assert.ok(reg['fq-build-fb'].classList.contains('ok'), 'фидбек об успехе');
  assert.match(reg['fq-build-fb'].textContent, /Ошибок: 1/);
});

test('режим «Вставь наречие»: 8 вопросов × 4 варианта, проверка сразу', () => {
  const { reg, spoken } = boot();
  const cards = reg['fq-fill-box'].children;
  assert.strictEqual(cards.length, 8);
  for (const card of cards) {
    const opts = card.children[2].children;
    assert.strictEqual(opts.length, 4, 'в каждом вопросе 4 варианта');
    assert.strictEqual(new Set(opts.map(o => o.textContent)).size, 4, 'варианты не повторяются');
  }

  // верный ответ
  const opts1 = cards[0].children[2].children;
  const good = opts1.find(o => o.textContent === 'siempre');
  good.onclick();
  assert.ok(good.classList.contains('correct'), 'верный ответ отмечен зелёным');
  assert.ok(spoken.some(t => t.indexOf('Siempre me levanto a las 8.') === 0), 'фраза озвучена: ' + JSON.stringify(spoken));

  // неверный ответ: красным, верный подсвечен рядом
  const opts2 = cards[1].children[2].children;
  const bad = opts2.find(o => o.textContent !== 'casi siempre');
  bad.onclick();
  assert.ok(bad.classList.contains('wrong'), 'неверный ответ отмечен красным');
  assert.ok(opts2.find(o => o.textContent === 'casi siempre').classList.contains('correct'));
});

test('режим «Моя привычка»: фраза, перевод и озвучка', () => {
  const { reg, spoken } = boot();
  const advBtns = reg['fq-maker-adv'].children;
  const actBtns = reg['fq-maker-act'].children;
  assert.strictEqual(advBtns.length, 8);
  assert.ok(actBtns.length >= 8, 'есть действия для конструктора');

  advBtns.find(b => b.textContent === 'nunca').onclick();
  actBtns.find(b => b.textContent === 'voy al centro de salud').onclick();

  assert.strictEqual(reg['fq-maker-es'].textContent, 'Nunca voy al centro de salud.');
  assert.strictEqual(reg['fq-maker-ru'].textContent, 'Никогда не хожу в центр здоровья.');
  assert.strictEqual(reg['fq-maker-result'].style.display, 'block');

  reg['fq-maker-speak'].onclick();
  assert.ok(spoken.includes('Nunca voy al centro de salud.'), 'фраза озвучена');
});

test('«Светофор» отдаёт цвета в правильном формате (data-color) — иначе гейт не сохраняет отметки', () => {
  assert.ok(html.includes('data-color="1"'), 'нет data-color="1"');
  assert.ok(html.includes('data-color="2"'), 'нет data-color="2"');
  assert.ok(html.includes('data-color="3"'), 'нет data-color="3"');
  assert.ok(!/tl-cell[^>]*\sdata-c=/.test(html), 'атрибут data-c не читается lesson-gate.js');
});

test('переключение вкладок переключает видимый режим', () => {
  const { ctx, tabs, modeEls } = boot();
  ctx.showFQ('fill', tabs[3]);
  assert.ok(modeEls[3].classList.contains('active'), 'режим «Вставь наречие» активен');
  assert.ok(!modeEls[0].classList.contains('active'), 'режим «Шкала» больше не активен');
  assert.ok(tabs[3].classList.contains('active'), 'вкладка активна');
});
