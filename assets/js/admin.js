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
