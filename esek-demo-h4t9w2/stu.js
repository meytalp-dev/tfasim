/* stu.js — דף התלמיד.ה (טלפון): קוד אישי, אישור שעות, הוספת עבודה, קביעת תור (למורשים).
   בלי סכומי כסף בשום מקום. נתונים: Esek (localStorage esek-demo-v2), אותו מכשיר כמו המערכת של הרכז.ת. */
(function () {
  'use strict';
  Esek.load2();
  try { Esek.autoPrep(Esek.now()); } catch (e) { /* ignore */ }

  var app = document.getElementById('app'), top = document.getElementById('top');
  var SKEY = 'esek-stu-id';
  var DAYN = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  var MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  var me = null;       // מזהה התלמיד.ה המחובר.ת
  var pin = '';
  var fixRows = [], addRows = [], B = {};

  function sget() { try { return sessionStorage.getItem(SKEY); } catch (e) { return null; } }
  function sset(v) { try { if (v) sessionStorage.setItem(SKEY, v); else sessionStorage.removeItem(SKEY); } catch (e) { /* ignore */ } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function ic(n) { return '<svg class="i" aria-hidden="true"><use href="#i-' + n + '"/></svg>'; }
  function ltr(x) { return '<bdi dir="ltr">' + esc(x) + '</bdi>'; }
  function st() { return Esek.state; }
  function stu() { return Esek.byId(st().students, me); }
  function r2(x) { return Math.round(x * 100) / 100; }
  function dm(d) { var p = d.split('-'); return +p[2] + '.' + +p[1]; }
  function dayName(d) { return DAYN[Esek.dayOfWeek(d)]; }
  function firstName(n) { return String(n || '').split(' ')[0]; }
  function shortName(n) { var p = String(n || '').split(' '); return p.length > 1 ? p[0] + ' ' + p[1].charAt(0) + '.' : p[0]; }
  function dateLabel(d) {
    var t = Esek.today();
    if (d === t) return 'היום';
    if (d === Esek.addDays(t, -1)) return 'אתמול';
    return 'יום ' + dayName(d) + ' ' + dm(d);
  }
  function cust(id) { return Esek.byId(st().customers, id); }
  function orderOf(id) { return Esek.byId(st().orders, id); }
  function taskName(id) { var t = Esek.byId(st().biz.tasks, id); return t ? t.name : ''; }
  function jobOf(e) {
    var o = orderOf(e.orderId), sv = o && o.serviceId ? Esek.byId(st().biz.services, o.serviceId) : null;
    var c = o && o.custId ? cust(o.custId) : null;
    return { service: sv ? sv.name : (o ? o.title : 'עבודה'), cust: c ? shortName(c.name) : '' };
  }
  function openDay(d) { return ((st().biz.hours || {}).days || [0, 1, 2, 3, 4]).indexOf(Esek.dayOfWeek(d)) >= 0; }

  /* ---------- ניווט ---------- */
  function go(h) { if (location.hash === '#' + h) render(); else location.hash = h; }
  function cur() { return (location.hash || '').slice(1) || 'home'; }
  function back(to) { return '<button class="back" type="button" data-go="' + to + '">' + ic('left') + 'חזרה</button>'; }

  function setTop() {
    if (!me) { top.innerHTML = '<img src="logo-minhal.png" alt="משרד העבודה">'; return; }
    top.innerHTML = '<img src="logo-minhal.png" alt="משרד העבודה"><span class="hi">שלום ' + esc(firstName(stu().name)) + '</span>' +
      '<button class="out" type="button" id="logout">' + ic('out') + 'יציאה</button>';
    document.getElementById('logout').onclick = function () { sset(''); me = null; pin = ''; go('code'); };
  }

  function render() {
    me = sget();
    if (me && !stu()) { me = null; sset(''); }
    var h = cur(), parts = h.split('/'), key = parts[0];
    if (!me && key !== 'code') { location.replace('#code'); return; }
    if (me && key === 'code') { location.replace('#home'); return; }
    if (key === 'book' && !stu().canBook) { location.replace('#home'); return; }
    setTop();
    var views = { code: vCode, home: vHome, fix: vFix, sent: vSent, add: vAdd, added: vAdded, book: vBook1, book2: vBook2, book3: vBook3, booked: vBooked };
    var fn = views[key] || vHome;
    app.innerHTML = fn(parts[1]);
    bind(key, parts[1]);
    window.scrollTo(0, 0);
  }

  /* ---------- קוד אישי ---------- */
  function demoCodes() {
    var s = st().students, out = [];
    var can = s.filter(function (x) { return x.canBook; })[0];
    if (can) out.push(can);
    s.filter(function (x) { return !x.canBook; }).slice(0, 3).forEach(function (x) { if (out.length < 3) out.push(x); });
    return out;
  }
  function pinBoxes() {
    var h = '';
    for (var i = 0; i < 4; i++) h += '<span class="' + (i === pin.length ? 'on' : '') + '">' + (pin.charAt(i) ? '•' : '') + '</span>';
    return h;
  }
  function vCode() {
    var keys = '';
    [1, 2, 3, 4, 5, 6, 7, 8, 9].forEach(function (n) { keys += '<button type="button" data-k="' + n + '">' + n + '</button>'; });
    keys += '<button type="button" class="fn" data-k="clr">נקה</button><button type="button" data-k="0">0</button><button type="button" class="fn" data-k="del" aria-label="מחיקת ספרה">מחק</button>';
    var demo = demoCodes().map(function (s) {
      return '<li>' + esc(s.name) + ': ' + ltr(s.pin) + (s.canBook ? ' <span class="muted">(מורשה.ית לקבוע תורים)</span>' : '') + '</li>';
    }).join('');
    return '<div class="card"><h2>הקוד האישי שלך</h2><p class="muted" style="margin:0">4 ספרות. את הקוד נותן.ת הרכז.ת.</p>' +
      '<div class="pin" id="pinbox" dir="ltr">' + pinBoxes() + '</div>' +
      '<input id="pin" class="sr" inputmode="numeric" pattern="[0-9]*" maxlength="4" readonly aria-label="קוד אישי" style="position:absolute;opacity:0;width:1px;height:1px">' +
      '<div id="perr" role="alert"></div>' +
      '<div class="pad" dir="ltr">' + keys + '</div></div>' +
      '<details class="demo card"><summary>קודי הדגמה</summary><ul style="list-style:none;margin:0;padding:0">' + demo + '</ul></details>';
  }
  function pinKey(k) {
    if (k === 'clr') pin = '';
    else if (k === 'del') pin = pin.slice(0, -1);
    else if (pin.length < 4) pin += k;
    var b = document.getElementById('pinbox'); if (b) b.innerHTML = pinBoxes();
    var inp = document.getElementById('pin'); if (inp) inp.value = pin;
    var err = document.getElementById('perr'); if (err) err.innerHTML = '';
    if (pin.length === 4) {
      var s = st().students.filter(function (x) { return String(x.pin) === pin; })[0];
      if (s) { sset(s.id); pin = ''; go('home'); }
      else {
        pin = '';
        if (b) b.innerHTML = pinBoxes();
        if (inp) inp.value = '';
        if (err) err.innerHTML = '<div class="msg err">הקוד לא נכון. אפשר לנסות שוב.</div>';
      }
    }
  }
  document.addEventListener('keydown', function (ev) {
    if (cur() !== 'code') return;
    if (/^[0-9]$/.test(ev.key)) pinKey(ev.key);
    else if (ev.key === 'Backspace') pinKey('del');
  });

  /* ---------- בית ---------- */
  function pendingList() {
    return Esek.entries({ stuId: me, status: 'prep' }).slice().sort(function (a, b) {
      return a.date < b.date ? -1 : a.date > b.date ? 1 : ((a.start || '') < (b.start || '') ? -1 : 1);
    });
  }
  function splitChips(split) {
    return (split || []).map(function (x) { return '<span>' + esc(taskName(x.taskId)) + ' ' + ltr(x.hours) + ' ש\'</span>'; }).join('');
  }
  function vHome() {
    var h = '', p = pendingList();
    if (p.length) {
      var e = p[0], j = jobOf(e);
      h += '<div class="card wait"><span class="kick">מחכה לאישור שלך</span>' + (p.length > 1 ? ' <span class="muted">' + ltr(1) + ' מתוך ' + ltr(p.length) + '</span>' : '') +
        '<div class="job">' + esc(j.service) + (j.cust ? ' · ' + esc(j.cust) : '') +
        '<small>' + esc(dateLabel(e.date)) + (e.start ? ' ' + ltr(e.start + '–' + e.end) : '') + ' · ' + ltr(e.hours) + ' שעות</small></div>' +
        '<div class="det">' + splitChips(e.split) + '</div>' +
        '<div class="btns"><button class="btn ok" type="button" id="okb" data-id="' + esc(e.id) + '">' + ic('check') + 'מאשר.ת</button>' +
        '<button class="btn" type="button" data-go="fix/' + esc(e.id) + '">' + ic('edit') + 'משהו לא נכון, לתקן</button></div></div>';
    }
    // התורים שלי
    var t = Esek.today(), d = t, label = 'התורים שלי היום';
    if (!openDay(t)) {
      for (var i = 1; i <= 7; i++) { d = Esek.addDays(t, i); if (openDay(d)) break; }
      label = 'היום סגור. התורים שלי ביום ' + dayName(d);
    }
    var list = Esek.appts(d).filter(function (o) { return o.status !== 'req' && (o.stuIds || []).indexOf(me) >= 0; });
    h += '<div class="card"><h2>' + esc(label) + '</h2>' + (list.length ? '<ul class="appt">' + list.map(function (o) {
      var c = o.custId ? cust(o.custId) : null, sv = Esek.byId(st().biz.services, o.serviceId);
      return '<li><span class="tm" dir="ltr">' + esc(o.time) + '</span><div><b>' + esc(sv ? sv.name : o.title) + '</b>' + (c ? ' <span>(' + esc(shortName(c.name)) + ')</span>' : '') + '</div></li>';
    }).join('') + '</ul>' : '<p class="muted" style="margin:0">אין לך תורים ' + (d === t ? 'היום' : 'ביום הזה') + '.</p>');
    h += '<div class="two"><button class="btn" type="button" data-go="add">' + ic('plus') + 'הוספת עבודה</button>' +
      (stu().canBook ? '<button class="btn pri" type="button" data-go="book">' + ic('cal') + 'קביעת תור</button>' : '') + '</div></div>';
    // שעות החודש
    var ym = t.slice(0, 7), mine = Esek.entries({ stuId: me, ym: ym });
    var okL = mine.filter(function (e) { return e.status === 'ok'; });
    var waitL = mine.filter(function (e) { return e.status === 'wait' || e.status === 'prep'; });
    h += '<div class="card"><h2>השעות שלי ב' + MONTHS[+ym.slice(5) - 1] + '</h2><div class="stats">' +
      '<div><b>' + ltr(Esek.sumHours(okL)) + '</b><span>שעות מאושרות</span></div>' +
      '<div><b>' + ltr(Esek.sumHours(waitL)) + '</b><span>ממתינות</span></div>' +
      '<div><b>' + ltr(Esek.workDays(okL)) + '</b><span>ימי עבודה</span></div></div></div>';
    return h;
  }

  /* ---------- עורך פירוט (משותף לתיקון ולהוספה) ---------- */
  function taskOpts(sel) {
    return '<option value="">משימה</option>' + st().biz.tasks.map(function (t) {
      return '<option value="' + esc(t.id) + '"' + (t.id === sel ? ' selected' : '') + '>' + esc(t.name) + '</option>';
    }).join('');
  }
  function splitHtml(rows, pre) {
    return rows.map(function (r, i) {
      return '<div class="splitrow"><select class="in" data-' + pre + 't="' + i + '" aria-label="משימה">' + taskOpts(r.taskId) + '</select>' +
        '<input class="in" type="number" min="0" step="0.25" inputmode="decimal" dir="ltr" data-' + pre + 'h="' + i + '" value="' + esc(r.hours) + '" aria-label="שעות">' +
        '<button class="x" type="button" data-' + pre + 'x="' + i + '" aria-label="הסרת שורה">' + ic('x') + '</button></div>';
    }).join('');
  }
  function bindSplit(rows, pre, rerender) {
    Array.prototype.forEach.call(app.querySelectorAll('[data-' + pre + 't]'), function (el) {
      el.onchange = function () { rows[+el.getAttribute('data-' + pre + 't')].taskId = el.value; };
    });
    Array.prototype.forEach.call(app.querySelectorAll('[data-' + pre + 'h]'), function (el) {
      el.oninput = function () { rows[+el.getAttribute('data-' + pre + 'h')].hours = el.value; };
    });
    Array.prototype.forEach.call(app.querySelectorAll('[data-' + pre + 'x]'), function (el) {
      el.onclick = function () { rows.splice(+el.getAttribute('data-' + pre + 'x'), 1); rerender(); };
    });
  }
  function cleanRows(rows) {
    return rows.filter(function (r) { return r.taskId || (+r.hours > 0); }).map(function (r) { return { taskId: r.taskId, hours: r2(+r.hours || 0) }; });
  }
  function checkSplit(rows, hours) {
    var cl = cleanRows(rows), sum = 0;
    for (var i = 0; i < cl.length; i++) {
      if (!cl[i].taskId) return { err: 'בכל שורת פירוט צריך לבחור משימה.' };
      if (!(cl[i].hours > 0)) return { err: 'בכל שורת פירוט צריך לכתוב שעות.' };
      sum += cl[i].hours;
    }
    sum = r2(sum);
    if (sum > hours + 0.005) return { err: 'הפירוט (' + sum + ' שעות) גדול מסך השעות (' + hours + '). אי אפשר לשלוח.' };
    return { split: cl.filter(function (x) { return x.hours > 0; }) };
  }

  /* ---------- תיקון דיווח ---------- */
  var fixId = null;
  function vFix(id) {
    var e = Esek.byId(st().entries, id);
    if (!e || e.status !== 'prep' || e.stuId !== me) { location.replace('#home'); return ''; }
    if (fixId !== id) { fixId = id; fixRows = (e.split || []).map(function (x) { return { taskId: x.taskId, hours: x.hours }; }); }
    var j = jobOf(e);
    return back('home') + '<div class="card"><h2>תיקון: ' + esc(j.service) + (j.cust ? ' · ' + esc(j.cust) : '') + '</h2>' +
      '<p class="muted" style="margin:0">' + esc(dateLabel(e.date)) + '</p>' +
      '<div class="row2"><div><label class="f" for="fs">התחלה</label><input class="in" id="fs" type="time" dir="ltr" value="' + esc(e.start || '') + '"></div>' +
      '<div><label class="f" for="fe">סיום</label><input class="in" id="fe" type="time" dir="ltr" value="' + esc(e.end || '') + '"></div></div>' +
      '<label class="f" for="fh">סך שעות</label><input class="in" id="fh" type="number" min="0" step="0.25" inputmode="decimal" dir="ltr" value="' + esc(e.hours) + '">' +
      '<label class="f">פירוט לפי משימות (לא חובה)</label><div id="frows">' + splitHtml(fixRows, 'f') + '</div>' +
      '<button class="btn sm" type="button" id="fadd">' + ic('plus') + 'הוספת שורה</button>' +
      '<div id="ferr" role="alert"></div></div>' +
      '<button class="btn pri" type="button" id="fsend" data-id="' + esc(id) + '">' + ic('check') + 'שליחה לאישור</button>';
  }
  function fixHours() {
    var s = document.getElementById('fs').value, en = document.getElementById('fe').value, hEl = document.getElementById('fh');
    if (s && en) { var h = Esek.hoursBetween(s, en); hEl.value = h; return h; }
    return r2(+hEl.value || 0);
  }

  /* ---------- הוספת עבודה ---------- */
  function myOrders() {
    return st().orders.filter(function (o) {
      if (o.status === 'req' || o.status === 'closed') return false;
      if (!o.custId) return o.status === 'work' || o.status === 'new';
      return (o.stuIds || []).indexOf(me) >= 0 && (o.status === 'sched' || o.status === 'done' || o.status === 'work');
    });
  }
  function vAdd() {
    var oo = myOrders();
    var opts = oo.map(function (o) {
      var c = o.custId ? cust(o.custId) : null;
      return '<option value="' + esc(o.id) + '">' + esc(o.custId ? o.title : o.title + ' (פנימי)') + (o.date ? ' · ' + dm(o.date) : '') + '</option>';
    }).join('');
    return back('home') + '<div class="card"><h2>הוספת עבודה</h2>' +
      '<label class="f" for="ad">תאריך</label><input class="in" id="ad" type="date" dir="ltr" value="' + Esek.today() + '">' +
      '<label class="f" for="ao">עבודה</label><select class="in" id="ao">' + opts + '</select>' +
      '<label class="f">איך מדווחים?</label><div class="two" style="margin-top:0"><button class="btn sm opt-mode" type="button" data-mode="t">שעת התחלה וסיום</button><button class="btn sm opt-mode" type="button" data-mode="h">סך שעות</button></div>' +
      '<div id="amode"></div>' +
      '<label class="f">פירוט לפי משימות (לא חובה)</label><div id="arows">' + splitHtml(addRows, 'a') + '</div>' +
      '<button class="btn sm" type="button" id="aadd">' + ic('plus') + 'הוספת שורה</button>' +
      '<div id="aerr" role="alert"></div></div>' +
      '<button class="btn pri" type="button" id="asend">' + ic('check') + 'שליחה לאישור הרכז.ת</button>';
  }
  var addMode = 't';
  function amodeHtml() {
    return addMode === 't'
      ? '<div class="row2"><div><label class="f" for="as">התחלה</label><input class="in" id="as" type="time" dir="ltr"></div><div><label class="f" for="ae">סיום</label><input class="in" id="ae" type="time" dir="ltr"></div></div>'
      : '<label class="f" for="ah">סך שעות</label><input class="in" id="ah" type="number" min="0" step="0.25" inputmode="decimal" dir="ltr">';
  }
  function addHours() {
    if (addMode === 't') {
      var s = document.getElementById('as').value, e = document.getElementById('ae').value;
      return { start: s, end: e, hours: s && e ? Esek.hoursBetween(s, e) : 0 };
    }
    return { start: '', end: '', hours: r2(+document.getElementById('ah').value || 0) };
  }
  function vAdded() {
    return '<div class="card done"><div class="ring">' + ic('check') + '</div><h2>נשלח לאישור הרכז.ת</h2><p class="muted">הדיווח יופיע ב"ממתינות" עד שהרכז.ת יאשר.</p></div>' +
      '<button class="btn pri" type="button" data-go="home">חזרה לדף הראשי</button>';
  }
  function vSent() {
    var more = pendingList().length;
    return '<div class="card done"><div class="ring">' + ic('check') + '</div><h2>נשלח לאישור הרכז.ת</h2><p class="muted">תודה, הדיווח עבר הלאה.</p></div>' +
      '<button class="btn pri" type="button" data-go="home">' + (more ? 'לדיווח הבא (' + more + ' נשארו)' : 'חזרה לדף הראשי') + '</button>';
  }

  /* ---------- קביעת תור (מורשים) ---------- */
  function vBook1() {
    var cs = st().customers.map(function (c) { return '<option value="' + esc(c.id) + '"' + (B.custId === c.id ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('');
    var ss = st().biz.services.map(function (s) { return '<option value="' + esc(s.id) + '"' + (B.svc === s.id ? ' selected' : '') + '>' + esc(s.name) + ' · ' + s.minutes + ' דק\'</option>'; }).join('');
    return back('home') + '<div class="card"><h2>קביעת תור: לקוח ושירות</h2>' +
      '<label class="f" for="bc">לקוח</label><select class="in" id="bc"><option value="">בחירת לקוח</option>' + cs + '<option value="new"' + (B.custId === 'new' ? ' selected' : '') + '>לקוח חדש</option></select>' +
      '<div id="bnew" ' + (B.custId === 'new' ? '' : 'hidden') + '><label class="f" for="bn">שם הלקוח</label><input class="in" id="bn" value="' + esc(B.newName || '') + '">' +
      '<label class="f" for="bp">טלפון</label><input class="in" id="bp" type="tel" inputmode="tel" dir="ltr" style="text-align:right" value="' + esc(B.newPhone || '') + '"></div>' +
      '<label class="f" for="bs">שירות</label><select class="in" id="bs"><option value="">בחירת שירות</option>' + ss + '</select>' +
      '<div id="berr" role="alert"></div></div>' +
      '<button class="btn pri" type="button" id="bnext1">המשך</button>';
  }
  function bookSlots() { return B.date && B.svc ? Esek.publicSlots(B.date, B.svc).filter(function (s) { return s.free; }) : []; }
  function vBook2() {
    if (!B.svc || !B.custId) { location.replace('#book'); return ''; }
    var sl = bookSlots();
    return back('book') + '<div class="card"><h2>קביעת תור: מתי</h2>' +
      '<label class="f" for="bd">תאריך</label><input class="in" id="bd" type="date" dir="ltr" min="' + Esek.today() + '" value="' + esc(B.date || '') + '">' +
      '<div id="bsl">' + slotsHtml(sl) + '</div><div id="berr" role="alert"></div></div>';
  }
  function slotsHtml(sl) {
    if (!B.date) return '<p class="muted">בוחרים תאריך ואז שעה.</p>';
    if (!openDay(B.date)) return '<div class="msg warn">העסק סגור ביום הזה.</div>';
    if (!sl.length) return '<div class="msg warn">אין שעות פנויות ביום הזה.</div>';
    return '<label class="f">שעה פנויה</label><div class="slots">' + sl.map(function (s) {
      return '<button class="opt' + (B.time === s.time ? ' sel' : '') + '" type="button" data-slot="' + s.time + '">' + ltr(s.time) + '</button>';
    }).join('') + '</div>';
  }
  function draftOrder() {
    var sv = Esek.byId(st().biz.services, B.svc);
    return { id: '_draft', date: B.date, time: B.time, minutes: +sv.minutes || 0, stuIds: B.stu.slice() };
  }
  function vBook3() {
    if (!B.svc || !B.custId || !B.date || !B.time) { location.replace('#book'); return ''; }
    if (!B.stu) B.stu = [me];
    var sv = Esek.byId(st().biz.services, B.svc);
    var cn = B.custId === 'new' ? B.newName : (cust(B.custId) || {}).name;
    var chk = st().students.map(function (s) {
      return '<label class="chk"><input type="checkbox" data-stu="' + esc(s.id) + '"' + (B.stu.indexOf(s.id) >= 0 ? ' checked' : '') + '><span>' + esc(s.name) + (s.id === me ? ' (אני)' : '') + '</span></label>';
    }).join('');
    return back('book2') + '<div class="card"><h2>קביעת תור: מי עובד.ת</h2>' +
      '<ul class="sum"><li><span>לקוח</span><b>' + esc(cn) + '</b></li><li><span>שירות</span><b>' + esc(sv.name) + '</b></li>' +
      '<li><span>מתי</span><b>' + esc(dayName(B.date)) + ' ' + ltr(dm(B.date)) + ' ' + ltr(B.time + '–' + Esek.apptEnd(draftOrder())) + '</b></li></ul>' +
      '<label class="f">תלמידים בתור</label>' + chk + '<div id="bwarn"></div></div>' +
      '<button class="btn pri" type="button" id="bsave">' + ic('check') + 'קביעת התור</button>';
  }
  function warnHtml() {
    if (!B.stu.length) return '<div class="msg err">צריך לבחור לפחות תלמיד.ה אחד.ת.</div>';
    var cf = Esek.conflicts(draftOrder());
    if (!cf.length) return '';
    return '<div class="msg warn">שימו לב: יש חפיפה עם תור אחר בשעות האלה (' + cf.map(function (o) { return ltr(o.time + '–' + Esek.apptEnd(o)); }).join(', ') + '). אפשר לקבוע בכל זאת.</div>';
  }
  function vBooked() {
    return '<div class="card done"><div class="ring">' + ic('check') + '</div><h2>התור נקבע</h2><p class="muted">הוא מופיע ביומן של הרכז.ת.</p></div>' +
      '<button class="btn pri" type="button" data-go="home">חזרה לדף הראשי</button>';
  }
  function saveBooking() {
    var sv = Esek.byId(st().biz.services, B.svc), c;
    if (B.custId === 'new') {
      var np = Esek.normPhone(B.newPhone);
      c = st().customers.filter(function (x) { return Esek.normPhone(x.phone) === np; })[0];
      if (!c) {
        c = { id: Esek.uid(), name: B.newName, contact: B.newName, phone: B.newPhone, email: '', bill: 'tasks', rateHour: 0, rateDay: 0, note: 'נוצר על ידי תלמיד.ה' };
        st().customers.push(c);
      }
    } else c = cust(B.custId);
    var o = Esek.addAppt({ custId: c.id, serviceId: sv.id, date: B.date, time: B.time, stuIds: B.stu.slice(), source: 'stu' });
    B = {};
    return o;
  }

  /* ---------- חיבור אירועים ---------- */
  function $(id) { return document.getElementById(id); }
  function bind(key, arg) {
    Array.prototype.forEach.call(app.querySelectorAll('[data-go]'), function (b) { b.onclick = function () { go(b.getAttribute('data-go')); }; });
    if (key === 'code') {
      Array.prototype.forEach.call(app.querySelectorAll('[data-k]'), function (b) { b.onclick = function () { pinKey(b.getAttribute('data-k')); }; });
    }
    if (key === 'home') {
      var ok = $('okb');
      if (ok) ok.onclick = function () { if (Esek.stuConfirm(ok.getAttribute('data-id'))) go('sent'); };
    }
    if (key === 'fix') {
      var rer = function () { $('frows').innerHTML = splitHtml(fixRows, 'f'); bindSplit(fixRows, 'f', rer); };
      bindSplit(fixRows, 'f', rer);
      $('fs').oninput = $('fe').oninput = fixHours;
      $('fadd').onclick = function () { fixRows.push({ taskId: '', hours: '' }); rer(); };
      $('fsend').onclick = function () {
        var s = $('fs').value, en = $('fe').value, hours = fixHours(), err = $('ferr');
        if (s && en && !(Esek.hoursBetween(s, en) > 0)) { err.innerHTML = '<div class="msg err">שעת הסיום צריכה להיות אחרי ההתחלה.</div>'; return; }
        if (!(hours > 0)) { err.innerHTML = '<div class="msg err">צריך לכתוב סך שעות גדול מאפס.</div>'; return; }
        var chk = checkSplit(fixRows, hours);
        if (chk.err) { err.innerHTML = '<div class="msg err">' + esc(chk.err) + '</div>'; return; }
        var patch = { start: s || null, end: en || null, hours: hours, split: chk.split };
        var r = Esek.stuConfirm(arg, patch);
        if (!r) { err.innerHTML = '<div class="msg err">לא הצלחנו לשמור. בדקו את השעות והפירוט.</div>'; return; }
        fixId = null; fixRows = [];
        go('sent');
      };
    }
    if (key === 'add') {
      var rer2 = function () { $('arows').innerHTML = splitHtml(addRows, 'a'); bindSplit(addRows, 'a', rer2); };
      bindSplit(addRows, 'a', rer2);
      var setMode = function (m) {
        addMode = m; $('amode').innerHTML = amodeHtml();
        Array.prototype.forEach.call(app.querySelectorAll('.opt-mode'), function (b) { b.className = 'btn sm opt-mode' + (b.getAttribute('data-mode') === m ? ' pri' : ''); });
      };
      Array.prototype.forEach.call(app.querySelectorAll('.opt-mode'), function (b) { b.onclick = function () { setMode(b.getAttribute('data-mode')); }; });
      setMode(addMode);
      $('aadd').onclick = function () { addRows.push({ taskId: '', hours: '' }); rer2(); };
      $('asend').onclick = function () {
        var err = $('aerr'), date = $('ad').value, oid = $('ao').value, hh = addHours();
        if (!date) { err.innerHTML = '<div class="msg err">צריך לבחור תאריך.</div>'; return; }
        if (!oid) { err.innerHTML = '<div class="msg err">צריך לבחור עבודה.</div>'; return; }
        if (addMode === 't' && !(hh.hours > 0)) { err.innerHTML = '<div class="msg err">צריך שעת התחלה וסיום, והסיום אחרי ההתחלה.</div>'; return; }
        if (!(hh.hours > 0)) { err.innerHTML = '<div class="msg err">צריך לכתוב סך שעות גדול מאפס.</div>'; return; }
        var chk = checkSplit(addRows, hh.hours);
        if (chk.err) { err.innerHTML = '<div class="msg err">' + esc(chk.err) + '</div>'; return; }
        var obj = { stuId: me, orderId: oid, date: date, by: 'stu', note: '', split: chk.split };
        if (hh.start && hh.end) { obj.start = hh.start; obj.end = hh.end; } else obj.hours = hh.hours;
        Esek.addEntry(obj);
        addRows = [];
        go('added');
      };
    }
    if (key === 'book') {
      $('bc').onchange = function () { $('bnew').hidden = $('bc').value !== 'new'; };
      $('bnext1').onclick = function () {
        var c = $('bc').value, s = $('bs').value, err = $('berr');
        if (!c) { err.innerHTML = '<div class="msg err">צריך לבחור לקוח.</div>'; return; }
        if (c === 'new') {
          var n = $('bn').value.trim(), p = $('bp').value.trim();
          if (!n) { err.innerHTML = '<div class="msg err">צריך שם ללקוח החדש.</div>'; return; }
          if (Esek.normPhone(p).length < 9) { err.innerHTML = '<div class="msg err">צריך טלפון תקין ללקוח החדש.</div>'; return; }
          B.newName = n; B.newPhone = p;
        }
        if (!s) { err.innerHTML = '<div class="msg err">צריך לבחור שירות.</div>'; return; }
        if (B.svc !== s) { B.time = null; }
        B.custId = c; B.svc = s;
        go('book2');
      };
    }
    if (key === 'book2') {
      var bindSlots = function () {
        Array.prototype.forEach.call(app.querySelectorAll('[data-slot]'), function (b) {
          b.onclick = function () { B.time = b.getAttribute('data-slot'); B.stu = B.stu || [me]; go('book3'); };
        });
      };
      bindSlots();
      $('bd').onchange = function () { B.date = $('bd').value; B.time = null; $('bsl').innerHTML = slotsHtml(bookSlots()); bindSlots(); };
    }
    if (key === 'book3') {
      var upd = function () { $('bwarn').innerHTML = warnHtml(); };
      upd();
      Array.prototype.forEach.call(app.querySelectorAll('[data-stu]'), function (cb) {
        cb.onchange = function () {
          var id = cb.getAttribute('data-stu'), i = B.stu.indexOf(id);
          if (cb.checked && i < 0) B.stu.push(id); else if (!cb.checked && i >= 0) B.stu.splice(i, 1);
          upd();
        };
      });
      $('bsave').onclick = function () {
        if (!B.stu.length) { upd(); return; }
        saveBooking();
        go('booked');
      };
    }
  }

  window.addEventListener('hashchange', render);
  render();
})();
