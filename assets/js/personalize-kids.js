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
