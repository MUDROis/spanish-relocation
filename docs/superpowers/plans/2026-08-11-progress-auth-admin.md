# Прогресс, вход по email и админ-панель — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить сохранение прогресса учеников в Firestore, вход по email+пароль (аккаунты создаёт только админ), гейт уроков и админ-панель.

**Architecture:** Статический сайт на GitHub Pages без сборки. Firebase compat SDK 10 подключается через CDN-скрипты. Чистая логика вынесена в `assets/js/app-logic.js` (UMD) и покрыта тестами через `node --test`. Остальной код — тонкий слой поверх Firebase (`app.js`) и страницы (`login.html`, `admin.html`, `lesson-gate.js`). Правила безопасности в `firestore.rules`, деплой правил через Firebase CLI.

**Tech Stack:** Firebase Auth (email/password) + Cloud Firestore (compat SDK v10 через CDN), чистый HTML/CSS/JS, Node.js `node --test` для юнит-тестов.

## Global Constraints

- Без сборки и фреймворков: все файлы — статика, Firebase через CDN-скрипты (`https://www.gstatic.com/firebasejs/10.12.0/firebase-*-compat.js`).
- Без серверных функций (клиентский SDK; смена пароля — через `sendPasswordResetEmail`, удаление — блокировка + удаление данных).
- Идентификатор урока: `parents-w01-l1`, `kids-w01-l1` (префикс программы + неделя + номер).
- Самопроверка: родители — `green|yellow|red`, дети — `great|ok|hard`.
- Весь UI — на русском языке.
- В новых файлах/коде не добавлять комментарии.
- Хостинг не трогать: сайт остаётся на GitHub Pages, в `firebase.json` только правила Firestore.
- Сборка и тесты выполняются без `npm` (на этой машине npm.ps1 блокирован политикой) — использовать напрямую `node --test tests/app-logic.test.js` и `node --check <file>`.
- Спека: `docs/superpowers/specs/2026-08-11-progress-auth-admin-design.md`.

---

### Task 1: Чистая логика `app-logic.js` с юнит-тестами

**Files:**
- Create: `assets/js/app-logic.js`
- Create: `tests/app-logic.test.js`

**Interfaces:**
- Consumes: ничего.
- Produces: `window.AppLogic` (и `module.exports` для Node) со следующими функциями, которые используют все следующие задачи:
  - `pad2(n)` → `'01'`
  - `parseLessonId(path)` → `'parents-w01-l1'` | `null`
  - `colorToValue(color, audience)` → `'green'|'yellow'|'red'|'great'|'ok'|'hard'` | `null`
  - `normalizeSelfCheck(selfCheck)` → очищенный объект только с валидными значениями
  - `mergeStickers(localArr, remoteObj)` → объект объединённых наклеек
  - `summarizeLessons(lessons)` → `{ total, completed, inProgress }`
  - `formatDateTime(ts)` → `'ДД.ММ.ГГГГ ЧЧ:ММ'` | `'—'`
  - `countColors(selfCheck)` → `{ green: n, ... }`
  - `colorEmoji(v)` → `'🟢'` и т.п. | `'—'`

- [ ] **Step 1: Write the failing test**

Create `tests/app-logic.test.js`:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/app-logic.test.js`
Expected: FAIL with `Cannot find module '../assets/js/app-logic.js'`

- [ ] **Step 3: Write minimal implementation**

Create `assets/js/app-logic.js`:

```js
(function (global) {
  function pad2(n) { return String(n).padStart(2, '0'); }

  function parseLessonId(path) {
    const m = String(path).match(/\/lessons\/(parents|kids)\/w(\d{2})-l(\d+)\.html/);
    if (!m) return null;
    return m[1] + '-w' + m[2] + '-l' + m[3];
  }

  const COLOR_MAP = { parents: { '1': 'green', '2': 'yellow', '3': 'red' }, kids: { '1': 'great', '2': 'ok', '3': 'hard' } };

  function colorToValue(color, audience) {
    const map = COLOR_MAP[audience] || COLOR_MAP.parents;
    return map[color] || null;
  }

  const VALID = { green: 1, yellow: 1, red: 1, great: 1, ok: 1, hard: 1 };

  function normalizeSelfCheck(selfCheck) {
    if (!selfCheck || typeof selfCheck !== 'object') return {};
    const out = {};
    Object.keys(selfCheck).forEach(function (k) {
      if (VALID[selfCheck[k]]) out[k] = selfCheck[k];
    });
    return out;
  }

  function mergeStickers(localArr, remoteObj) {
    const out = {};
    if (remoteObj && typeof remoteObj === 'object') {
      Object.keys(remoteObj).forEach(function (k) { if (remoteObj[k]) out[k] = true; });
    }
    (Array.isArray(localArr) ? localArr : []).forEach(function (id) {
      if (id && !out[id]) out[id] = true;
    });
    return out;
  }

  function summarizeLessons(lessons) {
    let total = 0, completed = 0, inProgress = 0;
    Object.keys(lessons || {}).forEach(function (id) {
      const l = lessons[id];
      if (!l) return;
      total++;
      if (l.completedAt) completed++;
      else if (l.openedAt) inProgress++;
    });
    return { total: total, completed: completed, inProgress: inProgress };
  }

  function formatDateTime(ts) {
    if (!ts) return '—';
    const d = ts instanceof Date ? ts : new Date(ts);
    if (isNaN(d.getTime())) return '—';
    const p = function (n) { return String(n).padStart(2, '0'); };
    return p(d.getDate()) + '.' + p(d.getMonth() + 1) + '.' + d.getFullYear() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  function countColors(selfCheck) {
    const counts = {};
    Object.keys(selfCheck || {}).forEach(function (k) {
      const v = selfCheck[k];
      counts[v] = (counts[v] || 0) + 1;
    });
    return counts;
  }

  const EMOJI = { green: '🟢', yellow: '🟡', red: '🔴', great: '😄', ok: '🙂', hard: '😅' };

  function colorEmoji(v) { return EMOJI[v] || '—'; }

  const AppLogic = {
    pad2: pad2, parseLessonId: parseLessonId, colorToValue: colorToValue,
    normalizeSelfCheck: normalizeSelfCheck, mergeStickers: mergeStickers,
    summarizeLessons: summarizeLessons, formatDateTime: formatDateTime,
    countColors: countColors, colorEmoji: colorEmoji
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = AppLogic;
  if (global) global.AppLogic = AppLogic;
})(typeof window !== 'undefined' ? window : this);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/app-logic.test.js`
Expected: PASS (9 tests, 0 failures)

- [ ] **Step 5: Commit**

```bash
git add assets/js/app-logic.js tests/app-logic.test.js
git commit -m "feat: add pure progress logic module with tests"
```

---

### Task 2: Конфиг Firebase и слой `app.js`

**Files:**
- Create: `assets/js/firebase-config.js`
- Create: `assets/js/app.js`

**Interfaces:**
- Consumes: `window.FIREBASE_CONFIG`, `window.ADMIN_EMAILS` (из firebase-config.js); `window.AppLogic.mergeStickers` (Task 1).
- Produces: `window.App` с API, используемым в Task 4–9:
  - `getCurrentUser()` → user | null
  - `onAuth(cb)` — подписка на смену сессии
  - `signIn(email, password)`, `signOut()` → Promise
  - `ensureProfile(uid)` → data | null
  - `saveLesson(lessonId, patch)` — запись `progress/{uid}/lessons/{lessonId}` (merge + `lastActivity`)
  - `logActivity(type, lessonId?)` — добавление события
  - `getLessonsProgress(uid)`, `getLessonProgress(uid, lessonId)` → объекты
  - `getActivity(uid, limit)` → массив
  - `getStickers(uid)`, `saveStickers(uid, obj)`, `syncStickers(uid, localArr)` → объект
  - `createStudent(email, password, name, audience)` → user
  - `setSuspended(uid, bool)`, `resetPassword(email)`, `deleteStudentData(uid)`
  - `listStudents()` → массив документов `students` c ролью `student`
  - `getStudentDoc(uid)` → data | null

- [ ] **Step 1: Write `assets/js/firebase-config.js`**

```js
window.FIREBASE_CONFIG = {
  apiKey: "PASTE_API_KEY",
  authDomain: "spanish-relocation.firebaseapp.com",
  projectId: "spanish-relocation",
  storageBucket: "spanish-relocation.appspot.com",
  messagingSenderId: "PASTE_SENDER_ID",
  appId: "PASTE_APP_ID"
};
window.ADMIN_EMAILS = ["admin@example.com"];
```

- [ ] **Step 2: Write `assets/js/app.js`**

```js
(function () {
  if (window.App) return;
  const app = window.firebase;
  let auth = null;
  let db = null;

  function ready() {
    if (auth && db) return true;
    if (!app || !window.FIREBASE_CONFIG) return false;
    try {
      if (!app.apps.length) app.initializeApp(window.FIREBASE_CONFIG);
      auth = app.auth();
      db = app.firestore();
    } catch (e) {}
    return !!(auth && db);
  }

  function getCurrentUser() { return ready() ? auth.currentUser : null; }

  function onAuth(cb) {
    if (!ready()) { cb(null); return; }
    auth.onAuthStateChanged(function (user) { cb(user); });
  }

  function signIn(email, password) { return auth.signInWithEmailAndPassword(email, password); }

  function signOut() { return auth.signOut(); }

  async function ensureProfile(uid) {
    if (!ready()) return null;
    const snap = await db.collection('students').doc(uid).get();
    return snap.exists ? snap.data() : null;
  }

  function ts() { return app.firestore.FieldValue.serverTimestamp(); }

  function saveLesson(lessonId, patch) {
    if (!ready() || !auth.currentUser) return Promise.reject(new Error('no session'));
    const ref = db.collection('progress').doc(auth.currentUser.uid).collection('lessons').doc(lessonId);
    const data = Object.assign({}, patch, { lastActivity: ts() });
    return ref.set(data, { merge: true });
  }

  function logActivity(type, lessonId) {
    if (!ready() || !auth.currentUser) return Promise.resolve();
    return db.collection('progress').doc(auth.currentUser.uid).collection('activity').add({
      type: type,
      lessonId: lessonId || null,
      ts: ts()
    });
  }

  async function getLessonsProgress(uid) {
    if (!ready()) return {};
    const snap = await db.collection('progress').doc(uid).collection('lessons').get();
    const out = {};
    snap.forEach(function (d) { out[d.id] = d.data(); });
    return out;
  }

  async function getLessonProgress(uid, lessonId) {
    if (!ready()) return null;
    const snap = await db.collection('progress').doc(uid).collection('lessons').doc(lessonId).get();
    return snap.exists ? snap.data() : null;
  }

  async function getActivity(uid, limit) {
    if (!ready()) return [];
    const snap = await db.collection('progress').doc(uid).collection('activity')
      .orderBy('ts', 'desc').limit(limit || 50).get();
    const out = [];
    snap.forEach(function (d) { out.push(Object.assign({ id: d.id }, d.data())); });
    return out;
  }

  async function getStickers(uid) {
    if (!ready()) return {};
    const snap = await db.collection('progress').doc(uid).doc('stickers').get();
    return snap.exists ? snap.data() : {};
  }

  function saveStickers(uid, stickers) {
    return db.collection('progress').doc(uid).doc('stickers').set(stickers, { merge: true });
  }

  async function syncStickers(uid, localArr) {
    const remote = await getStickers(uid);
    const merged = window.AppLogic.mergeStickers(localArr, remote);
    await saveStickers(uid, merged);
    return merged;
  }

  async function createStudent(email, password, name, audience) {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    const uid = cred.user.uid;
    await db.collection('students').doc(uid).set({
      email: email,
      name: name,
      audience: audience,
      role: 'student',
      suspended: false,
      createdAt: ts()
    });
    return cred.user;
  }

  function setSuspended(uid, suspended) {
    return db.collection('students').doc(uid).update({ suspended: suspended });
  }

  function resetPassword(email) {
    return auth.sendPasswordResetEmail(email);
  }

  async function deleteStudentData(uid) {
    const lessons = await db.collection('progress').doc(uid).collection('lessons').get();
    await Promise.all(lessons.docs.map(function (d) { return d.ref.delete(); }));
    const acts = await db.collection('progress').doc(uid).collection('activity').get();
    await Promise.all(acts.docs.map(function (d) { return d.ref.delete(); }));
    try { await db.collection('progress').doc(uid).doc('stickers').delete(); } catch (e) {}
    await db.collection('students').doc(uid).delete();
  }

  async function listStudents() {
    if (!ready()) return [];
    const snap = await db.collection('students').where('role', '==', 'student').get();
    const out = [];
    snap.forEach(function (d) { out.push(Object.assign({ uid: d.id }, d.data())); });
    return out;
  }

  function getStudentDoc(uid) {
    return db.collection('students').doc(uid).get().then(function (s) { return s.exists ? s.data() : null; });
  }

  window.App = {
    getCurrentUser: getCurrentUser, onAuth: onAuth, signIn: signIn, signOut: signOut,
    ensureProfile: ensureProfile, saveLesson: saveLesson, logActivity: logActivity,
    getLessonsProgress: getLessonsProgress, getLessonProgress: getLessonProgress,
    getActivity: getActivity, getStickers: getStickers, saveStickers: saveStickers,
    syncStickers: syncStickers, createStudent: createStudent, setSuspended: setSuspended,
    resetPassword: resetPassword, deleteStudentData: deleteStudentData,
    listStudents: listStudents, getStudentDoc: getStudentDoc
  };
})();
```

- [ ] **Step 3: Syntax-check both files**

Run: `node --check assets/js/app.js; node --check assets/js/firebase-config.js`
Expected: no output, exit code 0

- [ ] **Step 4: Commit**

```bash
git add assets/js/firebase-config.js assets/js/app.js
git commit -m "feat: add firebase config and app service layer"
```

---

### Task 3: Правила Firestore и конфиг CLI

**Files:**
- Create: `firestore.rules`
- Create: `firebase.json`

**Interfaces:**
- Consumes: ничего.
- Produces: правила, разрешающие владельцу работать со своим `progress`, админу — со всем; создание `students/{uid}` только админом или bootstrap-админом по email-списку. Деплой правил — вручную через CLI (пользователь).

- [ ] **Step 1: Write `firestore.rules`**

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }
    function isAdmin() {
      return isSignedIn() && get(/databases/$(database)/documents/students/$(request.auth.uid)).data.role == 'admin';
    }
    function isOwner(uid) {
      return isSignedIn() && request.auth.uid == uid;
    }
    function isAdminEmail() {
      return isSignedIn() && request.auth.token.email in ['admin@example.com'];
    }
    match /students/{uid} {
      allow read: if isOwner(uid) || isAdmin();
      allow create: if isAdmin() || (isOwner(uid) && isAdminEmail() && request.resource.data.role == 'admin');
      allow update, delete: if isAdmin();
    }
    match /progress/{userId}/{docId} {
      allow read: if isOwner(userId) || isAdmin();
      allow write: if isOwner(userId) || isAdmin();
    }
  }
}
```

- [ ] **Step 2: Write `firebase.json`**

```json
{
  "firestore": {
    "rules": "firestore.rules"
  }
}
```

- [ ] **Step 3: Verify syntax**

Run: `firebase --version`
Expected: version output (CLI установлен). Правила синтаксически проверяются только при деплое или в Rules Playground.

- [ ] **Step 4: Commit**

```bash
git add firestore.rules firebase.json
git commit -m "feat: add firestore security rules"
```

> **Manual (user), после того как email админа вписан в `firestore.rules`:**
> ```
> firebase login
> firebase use spanish-relocation
> firebase deploy --only firestore:rules
> ```

---

### Task 4: Страница входа `login.html`

**Files:**
- Create: `login.html`

**Interfaces:**
- Consumes: `window.App` (Task 2), `window.ADMIN_EMAILS` (Task 2).
- Produces: страница входа; после успешного входа — редирект на `?next=` или `index.html`; bootstrap-документ админа при первом входе.

- [ ] **Step 1: Write `login.html`**

```html
<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#FFF7EF">
<title>Вход · Интерактивная школа МУДРО</title>
<link rel="icon" type="image/x-icon" href="favicon.ico">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&display=swap" rel="stylesheet">
<style>
:root{--bg:#FFF7EF;--ink:#2B2118;--muted:#7A6A5C;--card:#fff;--p1:#E2725B;--radius:18px;--shadow:0 10px 30px rgba(43,33,24,.08)}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Nunito',system-ui,sans-serif;background:var(--bg);color:var(--ink);line-height:1.5;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
.card{background:var(--card);border-radius:24px;box-shadow:var(--shadow);padding:36px 32px;width:100%;max-width:400px}
.logo{display:flex;align-items:center;gap:10px;font-weight:900;justify-content:center;margin-bottom:6px}
.logo img{height:38px;border-radius:8px}
h1{font-size:1.4rem;font-weight:900;text-align:center;margin:10px 0 4px}
.sub{text-align:center;color:var(--muted);font-weight:700;font-size:.9rem;margin-bottom:22px}
label{display:block;font-weight:800;font-size:.85rem;color:var(--muted);margin:14px 0 6px}
input{width:100%;padding:13px 14px;border-radius:12px;border:2px solid rgba(43,33,24,.15);font-family:inherit;font-weight:800;font-size:1rem}
input:focus{outline:none;border-color:var(--p1)}
.btn{width:100%;margin-top:20px;padding:14px;border-radius:999px;border:none;background:var(--p1);color:#fff;font-family:inherit;font-weight:900;font-size:1rem;cursor:pointer;transition:.2s;box-shadow:0 8px 20px rgba(226,114,91,.35)}
.btn:hover{transform:translateY(-2px)}
.btn:disabled{opacity:.6;cursor:wait;transform:none}
.link-row{display:flex;justify-content:space-between;align-items:center;margin-top:14px;flex-wrap:wrap;gap:8px}
.link-row a{color:var(--muted);font-weight:800;font-size:.85rem;text-decoration:none}
.link-row a:hover{color:var(--ink)}
.err{display:none;background:#FDE8E5;border:1px solid rgba(192,90,69,.4);color:#A23B2A;border-radius:12px;padding:11px 14px;font-weight:800;font-size:.88rem;margin-top:16px}
.err.show{display:block}
#toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px);background:#2B2118;color:#fff;padding:12px 22px;border-radius:999px;opacity:0;transition:.3s;z-index:100;font-weight:800;pointer-events:none;max-width:90vw;text-align:center;font-size:.9rem}
#toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
</style>
</head>
<body>

<div class="card">
  <div class="logo"><img src="logo.png" alt="МУДРО" onerror="this.style.display='none'">Интерактивная школа МУДРО</div>
  <h1>Вход в личный кабинет</h1>
  <p class="sub">Введите email и пароль, выданные администратором</p>
  <label for="email">Email</label>
  <input type="email" id="email" autocomplete="email" placeholder="student@example.com">
  <label for="password">Пароль</label>
  <input type="password" id="password" autocomplete="current-password" placeholder="••••••••">
  <button class="btn" id="submit">Войти →</button>
  <div class="err" id="err"></div>
  <div class="link-row">
    <a href="#" id="forgot">Забыли пароль?</a>
    <a href="index.html">← На главную</a>
  </div>
</div>
<div id="toast" role="status"></div>

<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>
<script src="assets/js/firebase-config.js"></script>
<script src="assets/js/app-logic.js"></script>
<script src="assets/js/app.js"></script>
<script>
(function () {
  const err = document.getElementById('err');
  const submit = document.getElementById('submit');
  const emailEl = document.getElementById('email');
  const passEl = document.getElementById('password');
  const next = new URLSearchParams(location.search).get('next');

  function showErr(msg) { err.textContent = msg; err.classList.add('show'); }
  function clearErr() { err.classList.remove('show'); }
  let tId;
  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(tId);
    tId = setTimeout(function () { t.classList.remove('show'); }, 3200);
  }

  function go() {
    if (next && next.startsWith('/') && !next.startsWith('//')) location.href = next;
    else if (next && !next.startsWith('http')) location.href = next;
    else location.href = 'index.html';
  }

  async function afterLogin(user) {
    const profile = await window.App.ensureProfile(user.uid).catch(function () { return null; });
    if (profile) { go(); return; }
    if (window.ADMIN_EMAILS.indexOf(user.email.toLowerCase()) !== -1) {
      const db = window.firebase.firestore();
      await db.collection('students').doc(user.uid).set({
        email: user.email,
        name: user.email,
        audience: 'parents',
        role: 'admin',
        suspended: false,
        createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
      }).catch(function () {});
      go();
      return;
    }
    await window.App.signOut().catch(function () {});
    showErr('Аккаунт не активирован. Обратитесь к администратору.');
  }

  async function onLogin() {
    clearErr();
    const email = emailEl.value.trim();
    const password = passEl.value;
    if (!email || !password) { showErr('Введите email и пароль'); return; }
    submit.disabled = true;
    submit.textContent = 'Входим…';
    try {
      const cred = await window.App.signIn(email, password);
      await afterLogin(cred.user);
    } catch (e) {
      submit.disabled = false;
      submit.textContent = 'Войти →';
      if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password') {
        showErr('Неверный email или пароль');
      } else if (e.code === 'auth/invalid-email') {
        showErr('Некорректный email');
      } else if (e.code === 'auth/too-many-requests') {
        showErr('Слишком много попыток. Попробуйте позже');
      } else {
        showErr('Не удалось войти. Проверьте подключение');
      }
    }
  }

  submit.onclick = onLogin;
  document.addEventListener('keydown', function (e) { if (e.key === 'Enter') onLogin(); });
  document.getElementById('forgot').onclick = function (e) {
    e.preventDefault();
    const email = emailEl.value.trim();
    if (!email) { showErr('Введите email в поле выше'); return; }
    window.App.resetPassword(email).then(function () {
      toast('📧 Письмо для сброса пароля отправлено');
    }).catch(function () { toast('Не удалось отправить письмо'); });
  };
})();
</script>
</body>
</html>
```

- [ ] **Step 2: Verify page structure**

Run: `node --check` не применим к HTML. Проверить, что страница не содержит опечаток: файл открывается, все `id` в JS соответствуют разметке (email, password, submit, err, forgot, toast).

- [ ] **Step 3: Commit**

```bash
git add login.html
git commit -m "feat: add login page with password reset"
```

> **Manual (user), для рабочей проверки входа:**
> 1. В консоли Firebase → Authentication → Users создать тестового ученика (email+пароль).
> 2. В `firebase-config.js` вписать реальные ключи проекта, домен `MUDROis.github.io` добавить в Authorized domains.
> 3. Открыть локально через сервер: `npx serve` → `http://localhost:3000/login.html`, войти тестовым аккаунтом → должен вернуть на `index.html`.

---

### Task 5: Гейт уроков `lesson-gate.js` + подключение в оба урока

**Files:**
- Create: `assets/js/lesson-gate.js`
- Modify: `lessons/parents/w01-l1.html` (скрипты в конец `</body>`, ранний оверлей после `<body>`, `#auth-area` в шапке)
- Modify: `lessons/kids/w01-l1.html` (то же)

**Interfaces:**
- Consumes: `window.App` (Task 2), `window.AppLogic` (Task 1).
- Produces: гейт входа, блокировка приостановленных, запись `lessonOpened`, сохранение `selfCheck` по кликам `.tl-cell`, кнопка «Урок завершён» с записью `completedAt` + конфетти, рендер имени/«Выйти» в `#auth-area`.

- [ ] **Step 1: Write `assets/js/lesson-gate.js`**

```js
(function () {
  const L = window.AppLogic;
  if (!L) return;

  const OVERLAY_ID = 'gate-overlay';
  const CSS = '#gate-overlay{position:fixed;inset:0;z-index:99999;background:#FFF7EF;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;font-family:Nunito,system-ui,sans-serif;color:#2B2118;text-align:center;padding:24px}'
    + '#gate-overlay .spinner{width:44px;height:44px;border:5px solid rgba(226,114,91,.25);border-top-color:#E2725B;border-radius:50%;animation:gateSpin 1s linear infinite}'
    + '@keyframes gateSpin{to{transform:rotate(360deg)}}'
    + '#gate-overlay .gate-title{font-size:1.3rem;font-weight:900}'
    + '#gate-overlay .gate-sub{font-weight:700;color:#7A6A5C;max-width:420px}'
    + '#gate-overlay .gate-btn{display:inline-block;margin-top:12px;background:#E2725B;color:#fff;border-radius:999px;padding:12px 24px;font-weight:900;text-decoration:none}'
    + '.gate-done{position:fixed;right:18px;bottom:18px;z-index:9000;background:#7A8B4C;color:#fff;border:none;border-radius:999px;padding:14px 22px;font-family:Nunito,system-ui,sans-serif;font-weight:900;font-size:.95rem;cursor:pointer;box-shadow:0 8px 20px rgba(122,139,76,.4);transition:.2s}'
    + '.gate-done:hover{transform:translateY(-2px)}'
    + '.gate-done.completed{background:#3E7CB1;cursor:default}'
    + '.gate-confetti{position:fixed;top:-40px;font-size:26px;z-index:9998;animation:gateFall linear forwards;pointer-events:none}'
    + '@keyframes gateFall{to{transform:translateY(115vh) rotate(560deg)}}'
    + '#gate-toast{position:fixed;bottom:80px;right:18px;z-index:9500;background:#2B2118;color:#fff;padding:12px 20px;border-radius:999px;font-weight:800;font-size:.9rem;font-family:Nunito,system-ui,sans-serif;opacity:0;transition:.3s}';

  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  let overlay = document.getElementById(OVERLAY_ID);
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = '<div class="spinner"></div><div class="gate-title">Проверяем доступ…</div>';

  const lessonId = L.parseLessonId(location.pathname);
  const audience = lessonId ? lessonId.split('-')[0] : null;

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function showBlock(title, sub, link) {
    overlay.innerHTML = '<div class="gate-title">' + escapeHtml(title) + '</div><div class="gate-sub">' + escapeHtml(sub) + '</div>'
      + (link ? '<a class="gate-btn" href="' + link + '">Войти</a>' : '');
  }

  function goLogin() {
    const next = encodeURIComponent(location.pathname + location.search);
    location.href = '../../login.html?next=' + next;
  }

  function renderAuthArea(user, name) {
    const box = document.getElementById('auth-area');
    if (!box) return;
    box.innerHTML = user
      ? '<span style="font-weight:800;color:#7A6A5C;margin-right:8px">' + escapeHtml(name) + '</span>'
        + '<a href="#" id="gate-logout" style="font-weight:800;color:#E2725B">Выйти</a>'
      : '<a href="../../login.html" style="font-weight:800;color:#E2725B">Войти</a>';
    const lo = document.getElementById('gate-logout');
    if (lo) lo.onclick = function (e) { e.preventDefault(); window.App.signOut(); };
  }

  let selfCheck = {};

  function initSelfCheckHooks() {
    document.addEventListener('click', function (e) {
      const cell = e.target.closest('.tl-cell');
      if (!cell) return;
      const key = 'row' + cell.dataset.row;
      const value = L.colorToValue(cell.dataset.color, audience);
      if (!value) return;
      selfCheck[key] = value;
      const clean = L.normalizeSelfCheck(selfCheck);
      window.App.saveLesson(lessonId, { selfCheck: clean }).catch(function () {});
      window.App.logActivity('selfCheck', lessonId).catch(function () {});
    });
  }

  let doneBtn = null;
  let completedFlag = false;

  function markDone() {
    completedFlag = true;
    doneBtn.classList.add('completed');
    doneBtn.textContent = '🎉 Урок пройден';
  }

  function injectDoneButton() {
    if (document.querySelector('.gate-done')) return;
    doneBtn = document.createElement('button');
    doneBtn.className = 'gate-done';
    doneBtn.textContent = '✅ Урок завершён';
    document.body.appendChild(doneBtn);
    doneBtn.onclick = function () {
      if (completedFlag) return;
      window.App.saveLesson(lessonId, { completedAt: window.firebase.firestore.FieldValue.serverTimestamp() }).then(markDone).catch(function () {});
      window.App.logActivity('lessonCompleted', lessonId).catch(function () {});
      toast('🎉 Урок пройден! Так держать!');
      confetti();
    };
    const u = window.App.getCurrentUser();
    if (u) {
      window.App.getLessonProgress(u.uid, lessonId).then(function (p) {
        if (p && p.completedAt) markDone();
      }).catch(function () {});
    }
  }

  function toast(msg) {
    let t = document.getElementById('gate-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'gate-toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.style.opacity = '0'; }, 3200);
  }

  function confetti() {
    for (let i = 0; i < 18; i++) {
      const c = document.createElement('span');
      c.className = 'gate-confetti';
      c.textContent = Math.random() > 0.5 ? '🎉' : '⭐';
      c.style.left = Math.random() * 100 + 'vw';
      c.style.animationDuration = (1.2 + Math.random() * 1.2) + 's';
      c.style.animationDelay = (Math.random() * 0.5) + 's';
      document.body.appendChild(c);
      setTimeout(function () { c.remove(); }, 3200);
    }
  }

  function open(profile) {
    if (!overlay.parentNode) return;
    overlay.remove();
    renderAuthArea(window.App.getCurrentUser(), profile && profile.name ? profile.name : (window.App.getCurrentUser() ? window.App.getCurrentUser().email : ''));
    initSelfCheckHooks();
    injectDoneButton();
  }

  window.App.onAuth(async function (user) {
    if (!lessonId) { open(null); return; }
    if (!user) {
      showBlock('Необходим вход', 'Чтобы открыть урок, войдите в свой аккаунт ученика.', '');
      setTimeout(goLogin, 1200);
      return;
    }
    const profile = await window.App.ensureProfile(user.uid);
    if (!profile) {
      await window.App.signOut().catch(function () {});
      showBlock('Аккаунт не активирован', 'Обратитесь к администратору, чтобы получить доступ к урокам.', '../../login.html');
      return;
    }
    if (profile.suspended) {
      showBlock('Доступ приостановлен', 'Ваш доступ к урокам приостановлен. Обратитесь к администратору.', '');
      return;
    }
    open(profile);
    const uid = user.uid;
    const prog = await window.App.getLessonProgress(uid, lessonId).catch(function () { return null; });
    if (!prog || !prog.openedAt) {
      window.App.saveLesson(lessonId, { openedAt: window.firebase.firestore.FieldValue.serverTimestamp() }).catch(function () {});
    }
    window.App.logActivity('lessonOpened', lessonId).catch(function () {});
  });
})();
```

- [ ] **Step 2: Modify `lessons/parents/w01-l1.html`**

Вставить сразу после `<body>` (строка 223):

```html
<script>document.body.insertAdjacentHTML('afterbegin','<div id="gate-overlay" style="position:fixed;inset:0;z-index:99999;background:#FFF7EF"></div>');</script>
```

В шапке после `<span class="lesson-id">…</span>` (строка 227) добавить:

```html
<span id="auth-area"></span>
```

Перед `</body>` (строка 902, после закрывающего `</script>`) добавить:

```html
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>
<script src="../../assets/js/firebase-config.js"></script>
<script src="../../assets/js/app-logic.js"></script>
<script src="../../assets/js/app.js"></script>
<script src="../../assets/js/lesson-gate.js"></script>
```

- [ ] **Step 3: Modify `lessons/kids/w01-l1.html`**

Вставить сразу после `<body>` (строка 202):

```html
<script>document.body.insertAdjacentHTML('afterbegin','<div id="gate-overlay" style="position:fixed;inset:0;z-index:99999;background:#FFF7EF"></div>');</script>
```

В шапке в `.nav-right` (строка 209) заменить текст на:

```html
<div class="nav-right"><span id="auth-area"></span></div>
```

Перед `</body>` (строка 1109, после закрывающего `</script>`) добавить:

```html
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>
<script src="../../assets/js/firebase-config.js"></script>
<script src="../../assets/js/app-logic.js"></script>
<script src="../../assets/js/app.js"></script>
<script src="../../assets/js/lesson-gate.js"></script>
```

- [ ] **Step 4: Syntax-check gate script**

Run: `node --check assets/js/lesson-gate.js`
Expected: no output, exit code 0

- [ ] **Step 5: Commit**

```bash
git add assets/js/lesson-gate.js lessons/parents/w01-l1.html lessons/kids/w01-l1.html
git commit -m "feat: gate lessons behind auth and save self-check progress"
```

> **Manual (user), после входа рабочим учеником:**
> 1. Гость открывает `lessons/parents/w01-l1.html` → через ~1 с редирект на `login.html?next=...`.
> 2. Ученик входит → урок открывается, в шапке имя и «Выйти».
> 3. Клики по «светофору» → в Firestore (консоль: `progress/{uid}/lessons/parents-w01-l1.selfCheck`) появляются `row0…row3`.
> 4. Кнопка «✅ Урок завершён» → появляется `completedAt`, конфетти, кнопка меняется на «🎉 Урок пройден».
> 5. Тот же сценарий на `lessons/kids/w01-l1.html` (смайлики `great/ok/hard`).

---

### Task 6: Персонализация `index.html`

**Files:**
- Modify: `index.html` (шапка + скрипты)
- Create: `assets/js/personalize.js`

**Interfaces:**
- Consumes: `window.App` (Task 2), `window.AppLogic` (Task 1), глобальные элементы `index.html` (`#auth-area`, `.lesson-link`, `.hero-progress .progress-text`, `#hero-progress-bar`, `.hero-progress .lesson-tag`).
- Produces: для гостя — кнопка «Войти»; для вошедшего — имя + «Выйти», персональная полоса прогресса и галочки у пройденных уроков на карте.

- [ ] **Step 1: Add `#auth-area` to the header of `index.html`**

Заменить в шапке (строка 223–226) блок переключателя аудиторий на:

```html
  <span id="auth-area"></span>
  <div class="audience-switch" role="navigation" aria-label="Выбор аудитории курса">
    <a href="index.html" class="active" aria-current="page">Родителям</a>
    <a href="kids.html">Детям</a>
  </div>
```

Добавить в CSS (после строки `.topbar .audience-switch a{text-decoration:none;white-space:nowrap}`):

```css
.topbar #auth-area{display:flex;align-items:center;gap:10px;font-size:.9rem}
.topbar #auth-area a.ctrl{border:none}
```

- [ ] **Step 2: Add scripts at the end of `index.html`**

После закрывающего `</script>` (строка 466) добавить:

```html
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>
<script src="assets/js/firebase-config.js"></script>
<script src="assets/js/app-logic.js"></script>
<script src="assets/js/app.js"></script>
<script src="assets/js/personalize.js"></script>
```

- [ ] **Step 3: Write `assets/js/personalize.js`**

```js
(function () {
  const A = window.App;
  const L = window.AppLogic;

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  A.onAuth(async function (user) {
    const box = document.getElementById('auth-area');
    if (!box) return;
    if (!user) {
      box.innerHTML = '<a href="login.html" class="ctrl" style="background:var(--p1);color:#fff">Войти</a>';
      return;
    }
    const profile = await A.ensureProfile(user.uid).catch(function () { return null; });
    box.innerHTML = '<span style="font-weight:900;color:var(--muted)">' + escapeHtml(profile && profile.name ? profile.name : user.email) + '</span>'
      + '<a href="#" id="logout-btn" class="ctrl">Выйти</a>';
    document.getElementById('logout-btn').onclick = function (e) { e.preventDefault(); A.signOut(); };

    const lessons = await A.getLessonsProgress(user.uid).catch(function () { return {}; });
    const sum = L.summarizeLessons(lessons);
    if (sum.total > 0) {
      const bar = document.getElementById('hero-progress-bar');
      const txt = document.querySelector('.hero-progress .progress-text');
      const tag = document.querySelector('.hero-progress .lesson-tag');
      const pct = Math.round(sum.completed / 60 * 100);
      if (bar) bar.style.width = Math.max(pct, 1) + '%';
      if (txt) txt.textContent = sum.completed + ' из 60 уроков — ' + pct + '% пути 🚀';
      if (tag) tag.textContent = 'МОЙ ПРОГРЕСС';
    }
    const done = new Set();
    Object.keys(lessons).forEach(function (id) { if (lessons[id].completedAt) done.add(id); });
    document.querySelectorAll('.lesson-link').forEach(function (a) {
      const id = L.parseLessonId(a.getAttribute('href'));
      if (id && done.has(id)) {
        a.classList.add('live');
        a.textContent = '✓ ' + a.textContent;
      }
    });
  });
})();
```

- [ ] **Step 4: Syntax-check and commit**

Run: `node --check assets/js/personalize.js`
Expected: no output, exit code 0

```bash
git add index.html assets/js/personalize.js
git commit -m "feat: personalize parents map for logged-in students"
```

> **Manual (user):** гость видит «Войти»; после входа — имя, «Выйти», полоса прогресса и «✓» у пройденных уроков.

---

### Task 7: Персонализация `kids.html` + синхронизация наклеек

**Files:**
- Modify: `kids.html` (шапка, скрипты, функция `collect`)
- Create: `assets/js/personalize-kids.js`

**Interfaces:**
- Consumes: `window.App` (Task 2), `window.AppLogic` (Task 1), глобальные `stickers`, `renderAlbum` из `kids.html`.
- Produces: для гостя — кнопка «Войти»; для вошедшего — имя + «Выйти», наклейки из аккаунта, полоса прогресса; клик по наклейке сохраняется в Firestore.

- [ ] **Step 1: Modify `kids.html` header**

В шапке (после строки 129, внутри `<header class="header">`) добавить:

```html
  <div id="auth-area" style="display:flex;align-items:center;gap:10px"></div>
```

- [ ] **Step 2: Modify `kids.html` `collect()`**

В функции `collect` (строка 262–266) заменить тело на:

```js
function collect(id){
  if(got(id))return;
  stickers.push(id);localStorage.setItem('spain_stickers',JSON.stringify(stickers));
  renderAlbum();openModalRefresh(id);confetti(STATIONS.find(s=>s.id===id).emoji);
  if(window.App && window.App.getCurrentUser()){
    const uid=window.App.getCurrentUser().uid;
    window.App.saveStickers(uid,{[id]:true});
    window.App.logActivity('sticker',null);
  }
}
```

- [ ] **Step 3: Add scripts at the end of `kids.html`**

После закрывающего `</script>` (строка 320) добавить:

```html
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>
<script src="assets/js/firebase-config.js"></script>
<script src="assets/js/app-logic.js"></script>
<script src="assets/js/app.js"></script>
<script src="assets/js/personalize-kids.js"></script>
```

- [ ] **Step 4: Write `assets/js/personalize-kids.js`**

```js
(function () {
  const A = window.App;
  const L = window.AppLogic;

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  A.onAuth(async function (user) {
    const box = document.getElementById('auth-area');
    if (!box) return;
    if (!user) {
      box.innerHTML = '<a href="login.html" class="mode-btn" style="background:var(--terra);color:#fff">Войти</a>';
      return;
    }
    const profile = await A.ensureProfile(user.uid).catch(function () { return null; });
    box.innerHTML = '<span style="font-weight:800;color:var(--ink);font-size:.9rem">' + escapeHtml(profile && profile.name ? profile.name : user.email) + '</span>'
      + '<a href="#" id="logout-btn" class="mode-btn" style="background:#fff">Выйти</a>';
    document.getElementById('logout-btn').onclick = function (e) { e.preventDefault(); A.signOut(); };

    let local = [];
    try { local = JSON.parse(localStorage.getItem('spain_stickers') || '[]'); } catch (e) {}
    const merged = await A.syncStickers(user.uid, local).catch(function () { return null; });
    if (merged) {
      try { localStorage.setItem('spain_stickers', JSON.stringify(Object.keys(merged))); } catch (e) {}
      stickers = Object.keys(merged);
      renderAlbum();
    }

    const lessons = await A.getLessonsProgress(user.uid).catch(function () { return {}; });
    const sum = L.summarizeLessons(lessons);
    const bar = document.getElementById('progress-bar');
    const txt = document.querySelector('.hero-progress .progress-text');
    if (sum.total > 0 && bar) bar.style.width = Math.max(Math.round(sum.completed / 60 * 100), 1) + '%';
    if (sum.total > 0 && txt) txt.textContent = sum.completed + ' из 60 уроков — твой путь 🚀';
  });
})();
```

- [ ] **Step 5: Syntax-check and commit**

Run: `node --check assets/js/personalize-kids.js`
Expected: no output, exit code 0

```bash
git add kids.html assets/js/personalize-kids.js
git commit -m "feat: personalize kids map and sync stickers to account"
```

> **Manual (user):** ребёнок входит, наклейки переносятся из localStorage в аккаунт и появляются из аккаунта на любом устройстве; клик по наклейке пишет в Firestore.

---

### Task 8: Админ-панель `admin.html` + `admin.js`

**Files:**
- Create: `admin.html`
- Create: `assets/js/admin.js`

**Interfaces:**
- Consumes: `window.App` (Task 2), `window.AppLogic` (Task 1).
- Produces: гейт по роли `admin`, таблица учеников, карточка ученика (уроки + самопроверка + лента), добавление, приостановка/возобновление, сброс пароля письмом, удаление.

- [ ] **Step 1: Write `admin.html`**

```html
<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#FFF7EF">
<title>Админ-панель · МУДРО</title>
<link rel="icon" type="image/x-icon" href="favicon.ico">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&display=swap" rel="stylesheet">
<style>
:root{--bg:#FFF7EF;--ink:#2B2118;--muted:#7A6A5C;--card:#fff;--p1:#E2725B;--p2:#7A8B4C;--radius:18px;--shadow:0 10px 30px rgba(43,33,24,.08)}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Nunito',system-ui,sans-serif;background:var(--bg);color:var(--ink);line-height:1.5}
.topbar{position:sticky;top:0;z-index:50;background:rgba(255,247,239,.95);backdrop-filter:blur(10px);border-bottom:1px solid rgba(43,33,24,.06)}
.topbar .inner{max-width:1100px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;padding:12px 20px;gap:14px;flex-wrap:wrap}
.topbar .logo{font-weight:900;text-decoration:none;color:var(--ink)}
.topbar .email{font-weight:800;color:var(--muted);font-size:.9rem}
.topbar .logout{font-weight:800;color:var(--p1);text-decoration:none}
.wrap{max-width:1100px;margin:0 auto;padding:30px 20px}
h1{font-size:1.6rem;font-weight:900;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px}
h1 .add{background:var(--p2);color:#fff;border:none;border-radius:999px;padding:12px 22px;font-family:inherit;font-weight:900;font-size:.95rem;cursor:pointer;box-shadow:0 6px 16px rgba(122,139,76,.35)}
table{width:100%;border-collapse:collapse;margin-top:20px;background:var(--card);border-radius:var(--radius);overflow:hidden;box-shadow:var(--shadow)}
th,td{text-align:left;padding:12px 14px;border-bottom:1px solid rgba(43,33,24,.08);font-size:.9rem;vertical-align:middle}
th{background:#2B2118;color:#fff;font-size:.8rem;letter-spacing:.4px;text-transform:uppercase}
tr:last-child td{border-bottom:none}
tr:hover td{background:#FFF7EF}
.row-actions button{background:#F5EFE7;border:1.5px solid rgba(43,33,24,.15);border-radius:999px;padding:6px 12px;font-family:inherit;font-weight:800;font-size:.8rem;cursor:pointer;margin:2px;color:var(--ink)}
.row-actions button:hover{border-color:var(--ink)}
.row-actions button.danger{background:#FDE8E5;border-color:rgba(192,90,69,.4);color:#A23B2A}
.badge{padding:4px 12px;border-radius:999px;font-weight:900;font-size:.78rem}
.badge.ok{background:#EFF2E4;color:#4F6B2F}
.badge.warn{background:#FCF0DC;color:#8a6d1f}
.overlay{position:fixed;inset:0;background:rgba(43,33,24,.55);display:flex;align-items:center;justify-content:center;padding:18px;z-index:100;opacity:0;pointer-events:none;transition:.25s}
.overlay.show{opacity:1;pointer-events:auto}
.modal{background:#fff;border-radius:22px;max-width:760px;width:100%;max-height:88vh;overflow:auto;padding:28px;position:relative;transform:translateY(20px);transition:.25s}
.overlay.show .modal{transform:none}
.close{position:absolute;top:14px;right:16px;background:#f3efe6;border:none;border-radius:50%;width:36px;height:36px;font-size:16px;cursor:pointer;font-weight:800}
.modal h2{font-size:1.3rem;font-weight:900;margin-bottom:4px}
.modal .sub{color:var(--muted);font-weight:700;font-size:.9rem;margin-bottom:18px}
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.form-grid label{display:block;font-weight:800;font-size:.82rem;color:var(--muted);margin-bottom:5px}
.form-grid input,.form-grid select{width:100%;padding:11px 12px;border-radius:12px;border:2px solid rgba(43,33,24,.15);font-family:inherit;font-weight:800;font-size:.95rem}
.form-grid input:focus,.form-grid select:focus{outline:none;border-color:var(--p2)}
.modal .actions{margin-top:20px;display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap}
.btn{display:inline-flex;align-items:center;gap:8px;padding:12px 22px;border-radius:999px;font-family:inherit;font-weight:900;font-size:.92rem;cursor:pointer;border:none;transition:.2s}
.btn-primary{background:var(--p1);color:#fff}
.btn-ghost{background:#fff;border:2px solid rgba(43,33,24,.15);color:var(--ink)}
.btn:disabled{opacity:.6;cursor:wait}
h3{font-size:1rem;font-weight:900;margin:18px 0 8px}
.scroll{overflow:auto;max-height:260px}
table.inner{box-shadow:none;border:1px solid rgba(43,33,24,.1);margin-top:0}
table.inner th{font-size:.72rem}
ul.feed{list-style:none;font-size:.88rem;font-weight:700}
ul.feed li{padding:5px 0;border-bottom:1px dashed rgba(43,33,24,.1)}
.locked{max-width:480px;margin:80px auto;text-align:center;padding:30px;background:#fff;border-radius:22px;box-shadow:var(--shadow)}
.locked a{display:inline-block;margin-top:14px;color:var(--p1);font-weight:800;text-decoration:none}
.hidden{display:none!important}
#toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px);background:#2B2118;color:#fff;padding:12px 22px;border-radius:999px;opacity:0;transition:.3s;z-index:200;font-weight:800;pointer-events:none;max-width:90vw;text-align:center;font-size:.9rem}
#toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
@media(max-width:640px){.form-grid{grid-template-columns:1fr}}
</style>
</head>
<body>

<div class="topbar"><div class="inner">
  <a href="index.html" class="logo">🛠 Админ-панель · МУДРО</a>
  <div style="display:flex;align-items:center;gap:14px"><span class="email" id="admin-email"></span><a href="#" class="logout" id="logout">Выйти</a></div>
</div></div>

<div id="screen" class="hidden">
  <div class="wrap">
    <h1>Ученики <button class="add" id="add-btn">＋ Добавить ученика</button></h1>
    <p style="color:var(--muted);font-weight:700;font-size:.9rem;margin-top:6px" id="loading" class="hidden">Загружаем данные…</p>
    <table id="students-table">
      <thead><tr><th>Имя</th><th>Email</th><th>Программа</th><th>Статус</th><th>Уроков пройдено</th><th>Последняя активность</th><th>Действия</th></tr></thead>
      <tbody id="students-body"></tbody>
    </table>
  </div>
</div>

<div class="overlay" id="modal">
  <div class="modal">
    <button class="close" id="modal-close">✕</button>
    <h2 id="student-name"></h2>
    <div class="sub" id="student-email"></div>
    <h3>Уроки и самопроверка</h3>
    <div class="scroll"><table class="inner"><thead><tr><th>Урок</th><th>Завершён</th><th>Открыт</th><th>Самопроверка</th></tr></thead><tbody id="student-lessons"></tbody></table></div>
    <h3>Лента активности</h3>
    <ul class="feed" id="student-feed"></ul>
  </div>
</div>

<div class="overlay" id="add-modal">
  <div class="modal" style="max-width:520px">
    <button class="close" id="add-close">✕</button>
    <h2>Добавить ученика</h2>
    <div class="sub">Аккаунт создаётся сразу. Пароль выдайте ученику лично.</div>
    <div class="form-grid">
      <div><label>Имя</label><input id="add-name" placeholder="Анна Иванова"></div>
      <div><label>Email</label><input id="add-email" type="email" placeholder="anna@example.com"></div>
      <div><label>Пароль (мин. 6 символов)</label><input id="add-pass" type="text" placeholder="пароль"></div>
      <div><label>Программа</label><select id="add-audience"><option value="parents">Родители</option><option value="kids">Дети</option></select></div>
    </div>
    <div class="actions">
      <button class="btn btn-ghost" id="add-cancel">Отмена</button>
      <button class="btn btn-primary" id="add-submit">Создать аккаунт</button>
    </div>
  </div>
</div>

<div id="toast" role="status"></div>

<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>
<script src="assets/js/firebase-config.js"></script>
<script src="assets/js/app-logic.js"></script>
<script src="assets/js/app.js"></script>
<script src="assets/js/admin.js"></script>
</body>
</html>
```

- [ ] **Step 2: Write `assets/js/admin.js`**

```js
(function () {
  const A = window.App;
  const L = window.AppLogic;
  const state = { user: null, students: [] };

  function el(id) { return document.getElementById(id); }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  let toastTimer;
  function toast(msg) {
    const t = el('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 3200);
  }

  function timestampToDate(ts) {
    if (!ts) return null;
    if (ts.toDate) return ts.toDate();
    if (ts.seconds) return new Date(ts.seconds * 1000);
    return ts instanceof Date ? ts : new Date(ts);
  }

  function gate() {
    A.onAuth(async function (user) {
      if (!user) {
        location.href = 'login.html?next=' + encodeURIComponent(location.pathname);
        return;
      }
      const profile = await A.ensureProfile(user.uid);
      if (!profile || profile.role !== 'admin') {
        el('screen').outerHTML = '<div class="locked"><h1>🔒 Доступ запрещён</h1><p>Эта страница только для администратора.</p><a href="index.html">← На главную</a></div>';
        return;
      }
      state.user = user;
      el('screen').classList.remove('hidden');
      el('admin-email').textContent = user.email;
      el('logout').onclick = function (e) { e.preventDefault(); A.signOut().then(function () { location.href = 'index.html'; }); };
      await loadStudents();
    });
  }

  function lastActivity(lessons) {
    let last = null;
    Object.keys(lessons || {}).forEach(function (id) {
      const l = lessons[id];
      const t = l.lastActivity || l.openedAt || l.completedAt;
      if (t) {
        const ms = timestampToDate(t).getTime();
        if (!last || ms > last) last = ms;
      }
    });
    return last ? L.formatDateTime(new Date(last)) : '—';
  }

  async function loadStudents() {
    el('loading').classList.remove('hidden');
    const students = await A.listStudents().catch(function () { return []; });
    for (const s of students) {
      s.lessons = await A.getLessonsProgress(s.uid).catch(function () { return {}; });
    }
    state.students = students.sort(function (a, b) { return a.name.localeCompare(b.name, 'ru'); });
    renderStudents();
    el('loading').classList.add('hidden');
  }

  function renderStudents() {
    const rows = state.students.map(function (s) {
      const sum = L.summarizeLessons(s.lessons);
      return '<tr>'
        + '<td>' + escapeHtml(s.name) + '</td>'
        + '<td>' + escapeHtml(s.email) + '</td>'
        + '<td>' + (s.audience === 'kids' ? 'Дети' : 'Родители') + '</td>'
        + '<td>' + (s.suspended ? '<span class="badge warn">Приостановлен</span>' : '<span class="badge ok">Активен</span>') + '</td>'
        + '<td>' + sum.completed + ' / ' + sum.total + '</td>'
        + '<td>' + lastActivity(s.lessons) + '</td>'
        + '<td class="row-actions">'
        + '<button data-act="view" data-uid="' + s.uid + '">Детали</button>'
        + '<button data-act="toggle" data-uid="' + s.uid + '">' + (s.suspended ? 'Возобновить' : 'Приостановить') + '</button>'
        + '<button data-act="reset" data-uid="' + s.uid + '">Сбросить пароль</button>'
        + '<button data-act="del" data-uid="' + s.uid + '" class="danger">Удалить</button>'
        + '</td></tr>';
    }).join('');
    el('students-body').innerHTML = rows || '<tr><td colspan="7" style="text-align:center;color:#7A6A5C">Учеников пока нет. Добавьте первого!</td></tr>';
  }

  el('students-table').addEventListener('click', async function (e) {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const uid = btn.dataset.uid;
    const s = state.students.find(function (x) { return x.uid === uid; });
    if (!s) return;
    if (btn.dataset.act === 'view') {
      await openStudent(s);
    } else if (btn.dataset.act === 'toggle') {
      await A.setSuspended(uid, !s.suspended).catch(function () { toast('Не удалось изменить статус'); });
      s.suspended = !s.suspended;
      renderStudents();
    } else if (btn.dataset.act === 'reset') {
      await A.resetPassword(s.email).catch(function () { toast('Не удалось отправить письмо'); });
      toast('📧 Письмо для сброса пароля отправлено на ' + s.email);
    } else if (btn.dataset.act === 'del') {
      if (!confirm('Удалить ученика «' + s.name + '»? Прогресс будет удалён безвозвратно.')) return;
      await A.deleteStudentData(uid).catch(function () { toast('Не удалось удалить ученика'); });
      state.students = state.students.filter(function (x) { return x.uid !== uid; });
      renderStudents();
    }
  });

  async function openStudent(s) {
    const lessons = s.lessons || {};
    const acts = await A.getActivity(s.uid, 30).catch(function () { return []; });
    const ACT_LABEL = { lessonOpened: 'открыл урок', lessonCompleted: 'завершил урок', selfCheck: 'прошёл самопроверку', sticker: 'получил наклейку' };
    const rows = Object.keys(lessons).sort().map(function (id) {
      const l = lessons[id];
      const colors = L.countColors(l.selfCheck);
      const emoji = Object.keys(colors).map(function (c) { return L.colorEmoji(c) + ' ' + colors[c]; }).join('  ') || '—';
      return '<tr>'
        + '<td>' + escapeHtml(id) + '</td>'
        + '<td>' + (l.completedAt ? L.formatDateTime(timestampToDate(l.completedAt)) : '—') + '</td>'
        + '<td>' + (l.openedAt ? L.formatDateTime(timestampToDate(l.openedAt)) : '—') + '</td>'
        + '<td>' + emoji + '</td></tr>';
    }).join('');
    const feed = acts.map(function (a) {
      return '<li>' + L.formatDateTime(timestampToDate(a.ts)) + ' · ' + (ACT_LABEL[a.type] || a.type) + (a.lessonId ? ' · ' + escapeHtml(a.lessonId) : '') + '</li>';
    }).join('') || '<li style="color:#7A6A5C">Активности пока нет</li>';
    el('student-name').textContent = s.name;
    el('student-email').textContent = s.email;
    el('student-lessons').innerHTML = rows || '<tr><td colspan="4" style="text-align:center;color:#7A6A5C">Уроков ещё не открывал</td></tr>';
    el('student-feed').innerHTML = feed;
    el('modal').classList.add('show');
  }

  el('modal-close').onclick = function () { el('modal').classList.remove('show'); };
  el('add-btn').onclick = function () {
    el('add-name').value = ''; el('add-email').value = ''; el('add-pass').value = '';
    el('add-modal').classList.add('show');
  };
  el('add-close').onclick = function () { el('add-modal').classList.remove('show'); };
  el('add-cancel').onclick = function () { el('add-modal').classList.remove('show'); };

  el('add-submit').onclick = async function () {
    const name = el('add-name').value.trim();
    const email = el('add-email').value.trim();
    const pass = el('add-pass').value;
    const audience = el('add-audience').value;
    if (!name || !email || pass.length < 6) { toast('Заполните все поля (пароль — не короче 6 символов)'); return; }
    el('add-submit').disabled = true;
    try {
      await A.createStudent(email, pass, name, audience);
      el('add-modal').classList.remove('show');
      toast('✅ Ученик добавлен. Пароль выдайте ученику лично.');
      await loadStudents();
    } catch (e) {
      toast('Ошибка: ' + (e.message || 'проверьте данные'));
    }
    el('add-submit').disabled = false;
  };

  gate();
})();
```

- [ ] **Step 3: Syntax-check and commit**

Run: `node --check assets/js/admin.js`
Expected: no output, exit code 0

```bash
git add admin.html assets/js/admin.js
git commit -m "feat: add admin panel for student management and progress"
```

> **Manual (user):** админ (создан в консоли Firebase Auth, email в `ADMIN_EMAILS` и в `firestore.rules`) входит → видит список учеников; «Детали» показывает самопроверку по каждому уроку; «Приостановить» блокирует доступ к урокам; «Сбросить пароль» шлёт письмо; «Удалить» убирает ученика и прогресс.

---

### Task 9: Финальная проверка и чек-лист настройки

**Files:**
- Modify: ничего нового (проверочный чек-лист).

- [ ] **Step 1: Полный прогон автотестов**

Run: `node --test tests/app-logic.test.js`
Expected: 9 tests pass.

Run: `node --check assets/js/app-logic.js; node --check assets/js/app.js; node --check assets/js/lesson-gate.js; node --check assets/js/personalize.js; node --check assets/js/personalize-kids.js; node --check assets/js/admin.js`
Expected: no output for all, exit code 0.

- [ ] **Step 2: Проверка состава файлов**

Run: `git status --short`
Expected: только ожидаемые изменения; проверить, что нет случайных файлов.

- [ ] **Step 3: Commit финальных правок (если были)**

```bash
git add -A
git commit -m "chore: final verification"
```

- [ ] **Step 4: Чек-лист настройки для пользователя (документировать в `README.md`)**

Добавить в `README.md` раздел «Настройка Firebase»:

```markdown
# Настройка Firebase

1. В консоли Firebase → проект `spanish-relocation`: Authentication → Sign-in method → Email/Password включён.
2. Cloud Firestore → создать базу (production mode).
3. Authentication → Settings → Authorized domains → добавить `MUDROis.github.io`.
4. В `assets/js/firebase-config.js` вписать ключи веб-приложения (Project settings → Your apps → SDK setup) и свой email в `window.ADMIN_EMAILS`.
5. В `firestore.rules` вписать тот же email админа в `isAdminEmail()`.
6. Загрузить правила:
   firebase login
   firebase use spanish-relocation
   firebase deploy --only firestore:rules
7. Authentication → Users → Add user — создать аккаунт администратора (ваш email + пароль).
8. Открыть `admin.html` → войти администратором → появится админ-панель (документ админа создастся автоматически).
9. В админ-панели «Добавить ученика» — имя, email, пароль, программа. Пароль выдаётся ученику лично.
10. Ученик входит через `login.html`, открывает уроки — прогресс и самопроверка сохраняются в Firestore.

Ограничения: смена пароля — через письмо-сброс на email ученика; «удаление» ученика не удаляет Auth-аккаунт, но полностью закрывает доступ и удаляет прогресс.
```

- [ ] **Step 5: Commit README**

```bash
git add README.md
git commit -m "docs: add firebase setup checklist"
```

---

## Self-Review

**Spec coverage:**
- Сохранение прогресса в Firestore → Task 2 (`saveLesson`, `logActivity`), Task 5 (гейт), Task 6–7 (карты). ✓
- Вход по email (аккаунты создаёт админ) → Task 2 (`createStudent`), Task 4 (`login.html`), Task 8 (админ-панель). ✓
- Главные страницы открыты гостям → Task 6–7 (персонализация только при входе). ✓
- Админ: прогресс каждого ученика + самопроверка → Task 8 (карточка ученика: уроки, даты, эмодзи самопроверки, лента). ✓
- Управление учениками: добавление, приостановка, смена пароля (письмом), удаление → Task 8. ✓
- Правила через CLI → Task 3 (firebase.json + firestore.rules) и чек-лист Task 9. ✓
- Наклейки детей синхронизируются с аккаунтом → Task 7. ✓

**Placeholder scan:** Единственные плейсхолдеры — `PASTE_API_KEY` и `admin@example.com` в конфиге/правилах; это сознательные значения, которые заполняет пользователь (описано в Task 2, 3, 9), не «TODO». ✓

**Type consistency:** `window.App.*` и `window.AppLogic.*` имена в Task 4–9 совпадают с определениями в Task 1–2 (`parseLessonId`, `colorToValue`, `normalizeSelfCheck`, `mergeStickers`, `summarizeLessons`, `formatDateTime`, `countColors`, `colorEmoji`, `saveLesson`, `logActivity`, `getLessonsProgress`, `getLessonProgress`, `getActivity`, `syncStickers`, `saveStickers`, `createStudent`, `setSuspended`, `resetPassword`, `deleteStudentData`, `listStudents`, `ensureProfile`, `getCurrentUser`, `onAuth`, `signOut`). Формат selfCheck-значений согласован между `colorToValue`, `normalizeSelfCheck`, `countColors`, `colorEmoji` и админ-панелью. ✓
