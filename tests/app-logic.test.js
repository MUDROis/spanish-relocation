const test = require('node:test');
const assert = require('node:assert');
const {
  pad2, parseLessonId, colorToValue, normalizeSelfCheck,
  mergeStickers, summarizeLessons, formatDateTime, countColors, colorEmoji
} = require('../assets/js/app-logic.js');

test('pad2 pads numbers to two digits', () => {
  assert.equal(pad2(1), '01');
  assert.equal(pad2(12), '12');
});

test('parseLessonId extracts audience and lesson', () => {
  assert.equal(parseLessonId('/lessons/parents/w01-l1.html'), 'parents-w01-l1');
  assert.equal(parseLessonId('/spanish-relocation/lessons/kids/w03-l2.html'), 'kids-w03-l2');
  assert.equal(parseLessonId('/index.html'), null);
});

test('colorToValue maps color codes per audience', () => {
  assert.equal(colorToValue('1', 'parents'), 'green');
  assert.equal(colorToValue('3', 'parents'), 'red');
  assert.equal(colorToValue('1', 'kids'), 'great');
  assert.equal(colorToValue('2', 'kids'), 'ok');
  assert.equal(colorToValue('9', 'parents'), null);
});

test('normalizeSelfCheck keeps only valid values', () => {
  assert.deepEqual(normalizeSelfCheck({ row0: 'green', row1: 'yellow', row2: 'red', row3: 'bad' }), { row0: 'green', row1: 'yellow', row2: 'red' });
  assert.deepEqual(normalizeSelfCheck(null), {});
  assert.deepEqual(normalizeSelfCheck({}), {});
});

test('mergeStickers merges local array with remote object', () => {
  assert.deepEqual(mergeStickers(['s1', 's2'], { s2: true, s3: true }), { s1: true, s2: true, s3: true });
  assert.deepEqual(mergeStickers([], null), {});
  assert.deepEqual(mergeStickers(['s1'], { s1: true }), { s1: true });
});

test('summarizeLessons counts states', () => {
  const lessons = { a: { completedAt: 1, openedAt: 1 }, b: { openedAt: 1 }, c: {} };
  assert.deepEqual(summarizeLessons(lessons), { total: 3, completed: 1, inProgress: 1 });
  assert.deepEqual(summarizeLessons(null), { total: 0, completed: 0, inProgress: 0 });
});

test('summarizeLessons filters by track', () => {
  const lessons = {
    'kids-w01-l1': { completedAt: 1 },
    'kids-w01-l2': { completedAt: 1 },
    'parents-w01-l1': { completedAt: 1 },
    'parents-w01-l2': { openedAt: 1 }
  };
  assert.deepEqual(summarizeLessons(lessons, 'kids'), { total: 2, completed: 2, inProgress: 0 });
  assert.deepEqual(summarizeLessons(lessons, 'parents'), { total: 2, completed: 1, inProgress: 1 });
});

test('formatDateTime formats timestamps', () => {
  assert.equal(formatDateTime(null), '—');
  assert.match(formatDateTime(new Date(2026, 0, 5, 9, 5)), /^\d{2}\.\d{2}\.2026 \d{2}:\d{2}$/);
});

test('countColors groups selfCheck by value', () => {
  assert.deepEqual(countColors({ row0: 'green', row1: 'red', row2: 'red' }), { green: 1, red: 2 });
});

test('colorEmoji maps values to emoji', () => {
  assert.equal(colorEmoji('green'), '🟢');
  assert.equal(colorEmoji('hard'), '😅');
  assert.equal(colorEmoji('nope'), '—');
});
