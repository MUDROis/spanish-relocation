(function () {
  const A = window.App;
  const L = window.AppLogic;
  const state = { user: null, students: [], current: null };
  /* Полный курс: 20 недель × 3 урока для каждого трека. */
  const COURSE_TOTAL = 60;

  function el(id) { return document.getElementById(id); }

  function trackOf(s) {
    if (s.audience === 'kids' || s.audience === 'parents') return s.audience;
    return null;
  }

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
      const sum = L.summarizeLessons(s.lessons, trackOf(s));
      const pct = Math.round(sum.completed / COURSE_TOTAL * 100);
      return '<tr>'
        + '<td>' + escapeHtml(s.name) + '</td>'
        + '<td>' + escapeHtml(s.email) + '</td>'
        + '<td>' + (s.audience === 'kids' ? 'Дети' : 'Родители') + '</td>'
        + '<td>' + (s.suspended ? '<span class="badge warn">Приостановлен</span>' : '<span class="badge ok">Активен</span>') + '</td>'
        + '<td><strong>' + sum.completed + ' / ' + COURSE_TOTAL + '</strong> <span class="mini">(' + pct + '%)</span></td>'
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

  function lessonSort(a, b) {
    const pa = String(a).split('-'), pb = String(b).split('-');
    if (pa[0] !== pb[0]) return pa[0] < pb[0] ? -1 : 1;
    const wa = parseInt(pa[1].replace(/\D/g, ''), 10), wb = parseInt(pb[1].replace(/\D/g, ''), 10);
    if (wa !== wb) return wa - wb;
    return parseInt(pa[2].replace(/\D/g, ''), 10) - parseInt(pb[2].replace(/\D/g, ''), 10);
  }

  function prettyLesson(id) {
    const m = String(id).match(/^(kids|parents)-w(\d+)-l(\d+)$/);
    if (!m) return escapeHtml(id);
    return (m[1] === 'kids' ? '👶 Дети' : '👪 Родители') + ' · неделя ' + m[2] + ' · урок ' + m[3]
      + '<div class="mini">' + escapeHtml(id) + '</div>';
  }

  async function openStudent(s) {
    state.current = s;
    const lessons = s.lessons || {};
    const track = trackOf(s);
    const sum = L.summarizeLessons(lessons, track);
    el('student-progress').textContent = 'Пройдено уроков: ' + sum.completed + ' из ' + COURSE_TOTAL
      + ' (' + Math.round(sum.completed / COURSE_TOTAL * 100) + '%) · в работе: ' + sum.inProgress;
    const acts = await A.getActivity(s.uid, 30).catch(function () { return []; });
    const ACT_LABEL = { lessonOpened: 'открыл урок', lessonCompleted: 'завершил урок', selfCheck: 'прошёл самопроверку', sticker: 'получил наклейку' };
    const ids = Object.keys(lessons).sort(lessonSort);
    const rows = ids.map(function (id) {
      const l = lessons[id];
      const colors = L.countColors(l.selfCheck);
      const emoji = Object.keys(colors).map(function (c) { return L.colorEmoji(c) + ' ' + colors[c]; }).join('  ') || '—';
      return '<tr class="lesson-row" data-id="' + escapeHtml(id) + '">'
        + '<td><span class="chev">▸</span>' + prettyLesson(id) + '</td>'
        + '<td>' + (l.completedAt ? '<span class="badge ok">✅ Завершён</span>' : '<span class="badge warn">👀 Начат</span>') + '</td>'
        + '<td>' + (l.openedAt ? L.formatDateTime(timestampToDate(l.openedAt)) : '—') + '</td>'
        + '<td>' + emoji + '</td></tr>'
        + '<tr class="sc-detail hidden" data-for="' + escapeHtml(id) + '"><td colspan="4"></td></tr>';
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

  /* ===== Светофор: подписи строк тянем из HTML урока ===== */
  const SC_CACHE = {};

  function lessonUrl(id) {
    const m = String(id).match(/^(parents|kids)-w(\d{2})-l(\d+)$/);
    return m ? './lessons/' + m[1] + '/w' + m[2] + '-l' + m[3] + '.html' : null;
  }

  function selfCheckLabels(id) {
    if (!SC_CACHE[id]) {
      SC_CACHE[id] = (async function () {
        const url = lessonUrl(id);
        if (!url) return null;
        try {
          const res = await fetch(url);
          if (!res.ok) return null;
          const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
          let table = null;
          doc.querySelectorAll('.tl-table').forEach(function (t) {
            if (!table && t.querySelector('.tl-cell')) table = t;
          });
          if (!table) return null;
          const labels = [];
          table.querySelectorAll('tr').forEach(function (tr) {
            const td = tr.querySelector('td');
            if (td && tr.querySelector('.tl-cell')) labels.push(td.textContent.trim());
          });
          return labels.length ? labels : null;
        } catch (e) {
          return null;
        }
      })();
    }
    return SC_CACHE[id];
  }

  async function buildScDetail(id, sc) {
    const labels = await selfCheckLabels(id);
    const aud = String(id).split('-')[0];
    const items = Object.keys(sc).map(function (k) {
      const idx = parseInt(String(k).replace(/\D/g, ''), 10);
      return {
        label: labels && labels[idx] != null ? labels[idx] : 'Пункт ' + (idx + 1),
        value: sc[k]
      };
    });
    const groups = {};
    items.forEach(function (it) { (groups[it.value] = groups[it.value] || []).push(it.label); });
    const order = aud === 'kids' ? ['great', 'ok', 'hard'] : ['green', 'yellow', 'red'];
    const head = aud === 'kids'
      ? { great: '😄 Получилось легко', ok: '🙂 Получилось', hard: '😅 Не получилось / было трудно' }
      : { green: '🟢 Получилось', yellow: '🟡 Частично получилось', red: '🔴 Не получилось' };
    const html = order.filter(function (v) { return groups[v] && groups[v].length; }).map(function (v) {
      return '<div class="sc-group"><div class="sc-head">' + head[v] + '</div>'
        + groups[v].map(function (t) { return '<div class="sc-line">• ' + escapeHtml(t) + '</div>'; }).join('')
        + '</div>';
    }).join('');
    return html || '<span style="color:#7A6A5C">Светофор не заполнялся</span>';
  }

  el('student-lessons').addEventListener('click', async function (e) {
    const tr = e.target.closest('tr.lesson-row');
    if (!tr) return;
    const id = tr.dataset.id;
    const detail = el('student-lessons').querySelector('tr.sc-detail[data-for="' + id + '"]');
    if (!detail) return;
    const chev = tr.querySelector('.chev');
    const isOpen = !detail.classList.contains('hidden');
    if (isOpen) {
      detail.classList.add('hidden');
      if (chev) chev.textContent = '▸';
      return;
    }
    detail.classList.remove('hidden');
    if (chev) chev.textContent = '▾';
    const box = detail.querySelector('td');
    if (box.dataset.loaded) return;
    box.dataset.loaded = '1';
    const l = state.current && state.current.lessons ? state.current.lessons[id] : null;
    const sc = l && l.selfCheck && Object.keys(l.selfCheck).length ? l.selfCheck : null;
    if (!sc) {
      box.innerHTML = '<span style="color:#7A6A5C">Светофор в этом уроке не заполнялся</span>';
      return;
    }
    box.innerHTML = '<span style="color:#7A6A5C">Загружаем…</span>';
    box.innerHTML = await buildScDetail(id, sc);
  });

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
