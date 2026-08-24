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
    const sum = L.summarizeLessons(lessons, 'parents');
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
