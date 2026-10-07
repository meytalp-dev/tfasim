/* תובי — הבוט של תובה (7.10.26).
   1. תדריך לפני ביקור: ממלא את [data-tovi-slot] בעמוד בית ספר (app.js). התוצאה נשמרת כאן,
      ולכן גם כש-app.js מרנדר מחדש את העמוד, התדריך חוזר למקומו.
   2. צ'אט: בועה צפה בכל עמוד (מיטל בחרה "חלונית צפה").
   הנתונים לא נשמרים בדף ולא בדפדפן — השרת של תובי מאמת את הטוקן מול השער ומסנן לפי בתי הספר של המחובר.ת.
   השיחה נשמרת רק בזיכרון של הלשונית. */
(function () {
  var TOVI_EXEC = 'https://script.google.com/macros/s/AKfycbxGnq5H1y9ubpgUCXRSE5T8aSNVPtEf-15RitWu2UofCvLszICoEUEzAFXpXEaOJzQg/exec';
  /* TOVI_OPEN = תובי מוצג לכל מי שנכנס.ה לתובה (מיטל, 7.10.26: "הקישור לא יישלח למפקחים עד שאבדוק").
     false = רק מי שנכנס.ה פעם אחת עם ?tovi=1 — מתג חירום אם צריך להסתיר מהר */
  var TOVI_OPEN = true;
  try {
    var qm = /[?&]tovi=([01])/.exec(location.search);
    if (qm) localStorage.setItem('tovi.on', qm[1]);
    if (!TOVI_OPEN && localStorage.getItem('tovi.on') !== '1') return;
  } catch (e) { if (!TOVI_OPEN && !/[?&]tovi=1/.test(location.search)) return; }

  var I = {
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 4.6L18.5 9l-4.7 1.5L12 15l-1.8-4.5L5.5 9l4.7-1.4z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></svg>',
    chat:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>',
    x:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    send:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12L4 4l3 8-3 8z"/><path d="M7 12h13"/></svg>'
  };
  var AVATAR = '<img class="tovi-av" src="brand/tubi-avatar.png" alt="" width="32" height="32">';
  var ERR = {
    badsession: 'הכניסה פגה. צריך להיכנס מחדש לתובה.',
    notlisted: 'החשבון הזה לא מורשה לתובי.', inactive: 'ההרשאה הושהתה.', nospace: 'החשבון הזה לא מורשה לתובי.',
    nodata: 'נתוני הפיקוח לא נטענו כרגע. אפשר לנסות שוב בעוד רגע.',
    'no-api-key': 'תובי עוד לא מחובר. מיטל משלימה את ההגדרה.',
    noschool: 'אין לתובי נתונים על בית הספר הזה.'
  };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function errText(d) { return (d && ERR[d.error]) || 'משהו השתבש. אפשר לנסות שוב.'; }

  /* קריאה לשרת. ניסיון חוזר אחד — Apps Script מחזיר לפעמים דף ריק רגעי */
  function post(body, tries) {
    var R = window.REVITAL;
    if (!R || !R.token) return Promise.reject(new Error('noapp'));
    var snap = R.snap();
    body.token = R.token(); body.snap = snap; body.only = Object.keys(snap);
    return fetch(TOVI_EXEC, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); })
      .catch(function (e) { if ((tries || 0) < 1) return post(body, 1); throw e; });
  }

  /* ===== תדריך לפני ביקור ===== */
  var B = {};   /* semel → { st: load|ok|err, d } */
  var PARTS = [['status', 'תמונת מצב'], ['changed', 'מה השתנה מאז הביקור האחרון'], ['checks', 'נקודות לבדיקה בביקור'], ['recs', 'המלצות לפיקוח']];

  function briefHtml(semel) {
    var b = B[semel];
    if (!b) return '<div class="tovi-call"><button type="button" class="btn primary" data-tovi-brief="' + esc(semel) + '">' + I.spark + 'תדריך לפני ביקור</button>' +
      '<span>תובי מסכם את כל מה שיש בתובה על בית הספר: מצב, מה השתנה, מה לבדוק והמלצות.</span></div>';
    if (b.st === 'load') return '<div class="tovi-call"><span class="tovi-wait">' + I.spark + 'תובי מכין תדריך… זה לוקח עד דקה.</span></div>';
    if (b.st === 'err') return '<div class="tovi-call"><span class="tovi-err">' + esc(b.msg) + '</span><button type="button" class="btn sm" data-tovi-brief="' + esc(semel) + '">לנסות שוב</button></div>';
    var d = b.d, br = d.brief || {};
    var body = PARTS.map(function (p) {
      var list = br[p[0]] || [];
      if (!list.length) return p[0] === 'changed' ? '<h3>' + p[1] + '</h3><p class="tovi-none">לא נמצא בנתונים שינוי מתוארך מאז הביקור האחרון.</p>' : '';
      return '<h3>' + p[1] + '</h3><ul>' + list.map(function (i) {
        return '<li>' + esc(i.t) + (i.src ? ' <span class="tovi-src">' + esc(i.src) + '</span>' : '') + '</li>';
      }).join('') + '</ul>';
    }).join('');
    if (br.missing) body += '<p class="tovi-miss">חסר לתמונה מלאה: ' + esc(br.missing) + '</p>';
    return '<details class="card tovi-brief" open><summary>' + I.spark + '<b>תדריך לפני ביקור</b><span>נוצר ' + esc(d.at || '') + '</span></summary>' +
      '<div class="tovi-b">' + body + '<p class="tovi-foot">תובי מסכם רק את מה שיש בתובה. כדאי לבדוק כל נתון לפני שמסתמכים עליו.</p></div></details>';
  }
  function fillSlots() {
    var slots = document.querySelectorAll('[data-tovi-slot]');
    for (var i = 0; i < slots.length; i++) {
      var s = slots[i].getAttribute('data-tovi-slot'), h = briefHtml(s);
      if (slots[i].getAttribute('data-h') !== h) { slots[i].innerHTML = h; slots[i].setAttribute('data-h', h); }
    }
  }
  function brief(semel) {
    B[semel] = { st: 'load' }; fillSlots();
    post({ action: 'brief', semel: semel }).then(function (d) {
      if (d && d.ok && d.limited) B[semel] = { st: 'err', msg: d.message };
      else if (d && d.ok && d.brief) B[semel] = { st: 'ok', d: d };
      else B[semel] = { st: 'err', msg: errText(d) };
      fillSlots();
    }).catch(function () { B[semel] = { st: 'err', msg: 'אין חיבור לתובי כרגע. אפשר לנסות שוב.' }; fillSlots(); });
  }

  /* ===== צ'אט צף ===== */
  var EXAMPLES = ['אילו בתי ספר שלי לא הגישו סל תוכניות?', 'באילו בתי ספר יש מדדים במצב סיכון?', 'איפה לא היה ביקור הרבה זמן?', 'מה היעדים של בית הספר הזה?'];
  var H = [], busy = false, fab, panel, log, inp;

  function buildChat() {
    fab = document.createElement('button');
    fab.type = 'button'; fab.className = 'tovi-fab'; fab.setAttribute('aria-label', 'שאלו את תובי');
    /* האווטאר מתיקיית המיתוג (שיחת המיתוג, 7.10.26): תובי מופיע רק כאווטאר קטן */
    fab.innerHTML = AVATAR + '<span>תובי</span>';
    panel = document.createElement('section');
    panel.className = 'tovi-panel'; panel.hidden = true; panel.setAttribute('aria-label', 'תובי');
    panel.innerHTML = '<header><div>' + AVATAR + '<b>תובי</b><small>שאלות על בתי הספר שלך</small></div>' +
      '<button type="button" class="tovi-x" aria-label="סגירה">' + I.x + '</button></header>' +
      '<div class="tovi-log" aria-live="polite"></div>' +
      '<form class="tovi-form"><textarea rows="2" placeholder="למשל: מה השתנה בבית הספר מאז הביקור?" aria-label="השאלה"></textarea>' +
      '<button type="submit" class="tovi-send" aria-label="שליחה">' + I.send + '</button></form>';
    document.body.appendChild(fab); document.body.appendChild(panel);
    log = panel.querySelector('.tovi-log'); inp = panel.querySelector('textarea');
    fab.onclick = function () { open(true); };
    panel.querySelector('.tovi-x').onclick = function () { open(false); };
    panel.querySelector('form').onsubmit = function (e) { e.preventDefault(); ask(inp.value); };
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(inp.value); } });
    paint();
  }
  function open(on) {
    panel.hidden = !on; fab.hidden = on;
    document.body.classList.toggle('tovi-on', on);
    if (on) setTimeout(function () { inp.focus(); }, 30);
  }
  function fmt(t) {
    var out = '', inList = false;
    String(t || '').split('\n').forEach(function (line) {
      var m = line.match(/^\s*[-•]\s+(.*)$/);
      if (m) { if (!inList) { out += '<ul>'; inList = true; } out += '<li>' + esc(m[1]) + '</li>'; return; }
      if (inList) { out += '</ul>'; inList = false; }
      if (line.trim()) out += '<p>' + esc(line) + '</p>';
    });
    return out + (inList ? '</ul>' : '');
  }
  function paint() {
    var h = '';
    if (!H.length) {
      h += '<div class="tovi-hi"><p>אני עונה מתוך מה שיש בתובה על בתי הספר שלך: מיפוי, ביקורים, יעדים, סל תוכניות ומה חסר. כשאין לי נתון, אגיד את זה.</p>' +
        '<div class="tovi-ex">' + EXAMPLES.map(function (q) { return '<button type="button" data-tovi-q="' + esc(q) + '">' + esc(q) + '</button>'; }).join('') + '</div></div>';
    }
    H.forEach(function (m) {
      if (m.role === 'user') h += '<div class="tovi-m me">' + esc(m.content) + '</div>';
      else h += '<div class="tovi-m bot' + (m.err ? ' err' : '') + '">' + fmt(m.content) +
        (m.sources && m.sources.length ? '<div class="tovi-srcs">' + m.sources.map(function (s) { return '<span class="tovi-src">' + esc(s) + '</span>'; }).join('') + '</div>' : '') + '</div>';
    });
    if (busy) h += '<div class="tovi-m bot tovi-wait">תובי בודק בנתונים…</div>';
    log.innerHTML = h;
    log.scrollTop = log.scrollHeight;
  }
  function ask(q) {
    q = String(q || '').trim();
    if (!q || busy) return;
    var R = window.REVITAL, at = R && R.at ? R.at() : '';
    var history = H.filter(function (m) { return !m.err; }).slice(-6).map(function (m) { return { role: m.role, content: m.content }; });
    H.push({ role: 'user', content: q }); inp.value = ''; busy = true; paint();
    post({ action: 'ask', question: q, history: history, semel: at.indexOf('s:') === 0 ? at.slice(2) : '' }).then(function (d) {
      if (d && d.ok) H.push({ role: 'assistant', content: d.answer, sources: d.sources || [], err: !!d.limited });
      else H.push({ role: 'assistant', content: errText(d), err: true });
    }).catch(function () {
      H.push({ role: 'assistant', content: 'אין חיבור לתובי כרגע. אפשר לנסות שוב.', err: true });
    }).then(function () { busy = false; paint(); });
  }

  /* ===== חיבור לדף ===== */
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-tovi-brief]');
    if (b) { brief(b.getAttribute('data-tovi-brief')); return; }
    var q = e.target.closest && e.target.closest('[data-tovi-q]');
    if (q) ask(q.getAttribute('data-tovi-q'));
  });
  function start() {
    if (fab) return;
    buildChat();
    var main = document.getElementById('main');
    if (main && window.MutationObserver) new MutationObserver(fillSlots).observe(main, { childList: true });
    fillSlots();
  }
  document.addEventListener('pmh:in', start);
  if (document.documentElement.classList.contains('pmh-in')) start();
  else document.addEventListener('DOMContentLoaded', function () { if (document.documentElement.classList.contains('pmh-in')) start(); });
})();
