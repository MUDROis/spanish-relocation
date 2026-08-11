const test = require('node:test');
const assert = require('node:assert');

function makeWindow() {
  const auth = {
    signInWithEmailAndPassword(email, password) { return Promise.resolve({ user: { uid: 'u1', email } }); },
    signOut() { return Promise.resolve(); },
    sendPasswordResetEmail(email) { return Promise.resolve(email); }
  };
  const firestore = {
    FieldValue: { serverTimestamp: function () { return { __ts: true }; } },
    collection: function () {
      return { doc: function () { return { get: function () { return Promise.resolve({ exists: false, data: function () { return null; } }); } }; } };
    }
  };
  const app = {
    apps: [],
    initializeApp(config) { this.config = config; this.apps.push({}); },
    auth() { return auth; },
    firestore() { return firestore; }
  };
  return { firebase: app, FIREBASE_CONFIG: { apiKey: 'k' } };
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
