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

  /* Зеркалим завершение в localStorage — по этим ключам
     страницы kids.html и index.html считают прогресс-бар. */
  function saveLocalDone() {
    if (!lessonId) return;
    try {
      var track = lessonId.split('-')[0];           // kids | parents
      var id = lessonId.replace(/^[^-]+-/, '');     // w03-l1
      var key = 'mudro_done_' + track;
      var list = JSON.parse(localStorage.getItem(key)) || [];
      if (list.indexOf(id) < 0) {
        list.push(id);
        localStorage.setItem(key, JSON.stringify(list));
      }
    } catch (e) {}
  }

  function markDone() {
    completedFlag = true;
    saveLocalDone();
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
    }  }

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
