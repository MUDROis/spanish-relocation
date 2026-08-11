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

  function signIn(email, password) {
    if (!ready()) return Promise.reject(new Error('Firebase не инициализирован'));
    return auth.signInWithEmailAndPassword(email, password);
  }

  function signOut() {
    if (!ready()) return Promise.resolve();
    return auth.signOut();
  }

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
    if (!ready()) return Promise.reject(new Error('Firebase не инициализирован'));
    return db.collection('progress').doc(uid).doc('stickers').set(stickers, { merge: true });
  }

  async function syncStickers(uid, localArr) {
    const remote = await getStickers(uid);
    const merged = window.AppLogic.mergeStickers(localArr, remote);
    await saveStickers(uid, merged);
    return merged;
  }

  async function createStudent(email, password, name, audience) {
    if (!ready()) throw new Error('Firebase не инициализирован');
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
    if (!ready()) return Promise.reject(new Error('Firebase не инициализирован'));
    return db.collection('students').doc(uid).update({ suspended: suspended });
  }

  function resetPassword(email) {
    if (!ready()) return Promise.reject(new Error('Firebase не инициализирован'));
    return auth.sendPasswordResetEmail(email);
  }

  async function deleteStudentData(uid) {
    if (!ready()) throw new Error('Firebase не инициализирован');
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
    if (!ready()) return Promise.resolve(null);
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
