const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

/* Регрессия: кнопка «Завершить урок» и гейт доступа добавляет lesson-gate.js.
   Урок без этого скрипта открывается без входа и без кнопки завершения. */
const LESSON_DIRS = ['lessons/kids', 'lessons/parents'];

function lessonFiles(dir) {
  const abs = path.join(__dirname, '..', dir);
  return fs.readdirSync(abs)
    .filter(function (f) { return f.slice(-5).toLowerCase() === '.html'; })
    .map(function (f) { return path.join(abs, f); });
}

test('every lesson loads lesson-gate.js (adds the "Завершить урок" button)', () => {
  for (const dir of LESSON_DIRS) {
    const files = lessonFiles(dir);
    assert.ok(files.length > 0, dir + ' should contain lessons');
    for (const file of files) {
      const html = fs.readFileSync(file, 'utf8');
      assert.ok(
        html.indexOf('assets/js/lesson-gate.js') !== -1,
        path.relative(path.join(__dirname, '..'), file) + ' must include lesson-gate.js'
      );
    }
  }
});
