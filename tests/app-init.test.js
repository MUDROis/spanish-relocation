const test = require('node:test');
const assert = require('node:assert');

function makeWindow() {
  const auth = {
    currentUser: null,
    signInWithEmailAndPassword(email, password) {
      this.currentUser = { uid: 'u1', email };
      return Promise.resolve({ user: this.currentUser });
    },
    signOut() { this.currentUser = null; return Promise.resolve(); },
    sendPasswordResetEmail(email) { return Promise.resolve(email); },
    createUserWithEmailAndPassword(email, password) {
      this.currentUser = { uid: 'new-uid', email };
      return Promise.resolve({ user: this.currentUser });
    },
    onAuthStateChanged(cb) { cb(this.currentUser); }
  };
  const writes = [];
  const firestore = {
    FieldValue: { serverTimestamp: function () { return { __ts: true }; } },
    collection: function (name) {
      return {
        doc: function (id) {
          return {
            get: function () { return Promise.resolve({ exists: false, data: function () { return null; } }); },
            set: function (data, opts) { writes.push({ collection: name, id: id, data: data, opts: opts }); return Promise.resolve(); }
          };
        }
      };
    }
  };
  const firestoreFn = function () { return firestore; };
  firestoreFn.FieldValue = { serverTimestamp: function () { return { __ts: true }; } };
  const app = {
    apps: [],
    initializeApp(config) { this.config = config; this.apps.push({}); },
    auth() { return auth; },
    firestore: firestoreFn
  };
  return { firebase: app, FIREBASE_CONFIG: { apiKey: 'k' }, writes: writes };
}

function freshApp() {
  delete require.cache[require.resolve('../assets/js/app.js')];
  global.window = makeWindow();
  require('../assets/js/app.js');
  return global.window;
}

test('signIn initializes firebase before signing in', async () => {
  const win = freshApp();
  const cred = await win.App.signIn('a@b.c', 'pass');
  assert.equal(cred.user.uid, 'u1');
  assert.equal(win.firebase.apps.length, 1);
});

test('signOut initializes firebase before signing out', async () => {
  const win = freshApp();
  await win.App.signIn('a@b.c', 'pass');
  await win.App.signOut();
  assert.equal(win.firebase.apps.length, 1);
});

test('resetPassword initializes firebase before sending email', async () => {
  const win = freshApp();
  const email = await win.App.resetPassword('a@b.c');
  assert.equal(email, 'a@b.c');
  assert.equal(win.firebase.apps.length, 1);
});

test('ensureProfile reads from db after initialization', async () => {
  const win = freshApp();
  const result = await win.App.ensureProfile('u1');
  assert.equal(result, null);
  assert.equal(win.firebase.apps.length, 1);
});

test('createStudent keeps admin session and writes student profile', async () => {
  const win = freshApp();
  win.fetch = function () {
    return Promise.resolve({ json: function () { return Promise.resolve({ localId: 'new-uid', email: 'student@x.ru' }); } });
  };
  await win.App.signIn('admin@x.ru', 'pass');
  await win.App.createStudent('student@x.ru', 'pass123', 'Аня', 'kids');
  assert.equal(win.firebase.auth().currentUser.uid, 'u1');
  const w = win.writes.find(function (x) { return x.collection === 'students' && x.id === 'new-uid'; });
  assert.ok(w, 'expected students/new-uid write');
  assert.equal(w.data.role, 'student');
  assert.equal(w.data.email, 'student@x.ru');
  assert.equal(w.data.suspended, false);
});
