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

  /* track: 'kids' | 'parents' — считает только уроки нужной аудитории
     (в progress/{uid}/lessons лежат документы обоих треков). */
  function summarizeLessons(lessons, track) {
    const prefix = track ? track + '-' : null;
    let total = 0, completed = 0, inProgress = 0;
    Object.keys(lessons || {}).forEach(function (id) {
      const l = lessons[id];
      if (!l) return;
      if (prefix && String(id).indexOf(prefix) !== 0) return;
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
