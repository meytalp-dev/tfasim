(function () {
  'use strict';
  var E = window.Esek;
  var app = document.getElementById('app');
  var cur = null;          // מזהה תלמיד.ה מחוברת (בזיכרון בלבד, עמדה משותפת)
  var lastDone = null;     // הדיווח האחרון שנסגר
  var tick = null;
  var pick = '';
  var fgSel = { orderId: '', mode: 'times' };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function todayStr() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function fmtDate(s) { var p = String(s || '').split('-'); return p.length === 3 ? p[2] + '.' + p[1] : String(s || ''); }
  function num(h) { return (Math.round(h * 100) / 100).toString(); }
  function ltr(t) { return '<span class="ltr">' + esc(t) + '</span>'; }
  function hm(ms) {
    var m = Math.max(0, Math.floor(ms / 60000));
    return pad(Math.floor(m / 60)) + ':' + pad(m % 60);
  }
  function hm2(iso) { var d = new Date(iso); return pad(d.getHours()) + ':' + pad(d.getMinutes()); }

  var IC = {
    play: '<path d="M7 4l13 8-13 8z"/>',
    stop: '<rect x="5" y="5" width="14" height="14" rx="2"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>',
    list: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
    out: '<path d="M10 4H5v16h5"/><path d="M15 8l4 4-4 4M19 12H9"/>',
    back: '<path d="M9 5l7 7-7 7"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    work: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V4h6v3"/>'
  };
  function icon(n) {
    return '<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IC[n] + '</svg>';
  }

  function stu() { return cur ? E.byId(E.state.students, cur) : null; }
  function firstName(s) { return String(s.name || '').split(' ')[0]; }
  function orderTitle(id) { var o = E.byId(E.state.orders, id); return o ? o.title : 'הזמנה'; }
  function orderSub(o) {
    var c = o.custId ? E.byId(E.state.customers, o.custId) : null;
    return c ? c.name : 'עבודה פנימית';
  }
  function openOrders() {
    return E.state.orders.filter(function (o) {
      return o.status === 'sched' || o.status === 'work' || (!o.custId && o.status !== 'done' && o.status !== 'closed');
    });
  }
  function allOrders() { return E.state.orders.filter(function (o) { return o.status !== 'closed'; }); }
  function ym() { return todayStr().slice(0, 7); }

  function go(r) { if (location.hash === '#' + r) render(); else location.hash = r; }
  function route() { var r = (location.hash || '#pin').slice(1); return r || 'pin'; }
  function stopTick() { if (tick) { clearInterval(tick); tick = null; } }

  function render() {
    stopTick();
    E.load();
    var r = route();
    if (!stu() && r !== 'pin') { cur = null; r = 'pin'; }
    if (r === 'pin') return viewPin();
    if (r === 'home') return viewHome();
    if (r === 'done') return lastDone ? viewDone() : viewHome();
    if (r === 'forgot') return viewForgot();
    if (r === 'hours') return viewHours();
    viewHome();
  }

  function backBtn() { return '<button class="quiet" type="button" data-act="home">' + icon('back') + ' חזרה</button>'; }

  /* ---------- קוד אישי ---------- */
  function demoCodes() {
    var open = E.state.open || {};
    var s = E.state.students.slice().sort(function (a, b) { return (open[a.id] ? 1 : 0) - (open[b.id] ? 1 : 0); });
    return s.slice(0, 3);
  }
  function viewPin() {
    cur = null;
    var codes = demoCodes().map(function (s) {
      return '<li><span>' + esc(firstName(s)) + '</span><b class="ltr">' + esc(s.pin) + '</b></li>';
    }).join('');
    app.innerHTML =
      '<h1>שלום</h1><p class="lead">מה הקוד האישי שלך?</p>' +
      '<div class="pin-row"><input id="pin" class="pin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off" aria-label="קוד אישי, 4 ספרות" placeholder="••••"></div>' +
      '<p id="pinerr" class="err" role="alert" hidden>הקוד לא מוכר. נסו שוב</p>' +
      '<details class="demo"><summary>קודי הדגמה</summary><ul>' + codes + '</ul></details>';
    var inp = document.getElementById('pin');
    inp.addEventListener('input', function () {
      inp.value = inp.value.replace(/\D/g, '').slice(0, 4);
      document.getElementById('pinerr').hidden = true;
      if (inp.value.length === 4) {
        var s = E.state.students.filter(function (x) { return String(x.pin) === inp.value; })[0];
        if (s) { cur = s.id; go('home'); }
        else { document.getElementById('pinerr').hidden = false; inp.value = ''; inp.focus(); }
      }
    });
  }

  /* ---------- בית ---------- */
  function viewHome() {
    var s = stu(); if (!s) return viewPin();
    var op = E.state.open && E.state.open[cur];
    var h = '<h1>שלום ' + esc(firstName(s)) + '</h1>';
    if (op) {
      h += '<div class="clock"><div class="on">' + esc(orderTitle(op.orderId)) + '</div>' +
        '<div class="el" id="el">' + ltr('00:00') + '</div>' +
        '<div class="since">התחלתם ב-' + ltr(hm2(op.startISO)) + '</div></div>' +
        '<button class="bigbtn stop" type="button" data-act="out">' + icon('stop') + ' סיימתי</button>';
      app.innerHTML = h + navBtns(false);
      var upd = function () {
        var e = document.getElementById('el');
        if (e) e.innerHTML = ltr(hm(Date.now() - new Date(op.startISO).getTime()));
      };
      upd(); tick = setInterval(upd, 30000);
      return;
    }
    var os = openOrders();
    if (!os.some(function (o) { return o.id === pick; })) pick = '';
    h += myAppts(os);
    h += '<p class="lead">על מה עובדים?</p><div class="orders">' + (os.length ? os.map(function (o) {
      return '<button type="button" class="row-btn" data-act="pick" data-id="' + esc(o.id) + '" aria-pressed="' + (o.id === pick) + '">' + icon('work') +
        '<span class="t">' + esc(o.title) + '<small>' + esc(orderSub(o)) + '</small></span></button>';
    }).join('') : '<p class="empty">אין כרגע הזמנות פתוחות</p>') + '</div>' +
      '<button class="bigbtn" type="button" data-act="in" id="inbtn"' + (pick ? '' : ' disabled') + '>' + icon('play') + ' התחלתי</button>';
    app.innerHTML = h + navBtns(true);
  }
  function myAppts(os) {
    if (typeof E.appts !== 'function') return '';
    var list = (E.appts(todayStr()) || []).filter(function (o) {
      return o.stuIds && o.stuIds.indexOf(cur) >= 0 && os.some(function (x) { return x.id === o.id; });
    });
    if (!list.length) return '';
    return '<h2>התורים שלי היום</h2><div class="orders">' + list.map(function (o) {
      var end = typeof E.apptEnd === 'function' ? E.apptEnd(o) : '';
      return '<button type="button" class="row-btn" data-act="pick" data-id="' + esc(o.id) + '" aria-pressed="' + (o.id === pick) + '"><span class="t">' + esc(o.title) + '<small>' + ltr(o.time + (end ? '–' + end : '')) + '</small></span></button>';
    }).join('') + '</div>';
  }
  function navBtns(withForgot) {
    return '<div class="orders">' +
      (withForgot ? '<button class="quiet" type="button" data-act="forgot">' + icon('edit') + ' שכחתי לדווח</button>' : '') +
      '<button class="quiet" type="button" data-act="hours">' + icon('list') + ' השעות שלי החודש</button>' +
      '<button class="quiet" type="button" data-act="exit">' + icon('out') + ' יציאה</button></div>';
  }

  /* ---------- אישור ---------- */
  function viewDone() {
    app.innerHTML = '<div class="ok-mark">' + icon('check') + '</div>' +
      '<h1 class="center">נרשם</h1>' +
      '<p class="lead center">' + (lastDone.hours < 0.01 ? 'נרשם פחות מדקה' : 'נרשמו ' + ltr(num(lastDone.hours)) + ' שעות') + ' · ממתין לאישור</p>' +
      '<button class="bigbtn" type="button" data-act="home">אחלה</button>' +
      '<button class="quiet" type="button" data-act="exit">' + icon('out') + ' יציאה</button>';
  }

  /* ---------- שכחתי לדווח ---------- */
  function viewForgot() {
    var os = allOrders();
    if (!os.some(function (o) { return o.id === fgSel.orderId; })) fgSel.orderId = '';
    var t = todayStr();
    app.innerHTML = '<h1>שכחתי לדווח</h1><form id="fg" novalidate>' +
      '<label>תאריך<input type="date" id="f-date" value="' + t + '" max="' + t + '"></label>' +
      '<div class="lbl">על מה עבדתם?</div><div class="orders" id="f-orders">' + os.map(function (o) {
        return '<button type="button" class="row-btn" data-act="fpick" data-id="' + esc(o.id) + '" aria-pressed="' + (o.id === fgSel.orderId) + '"><span class="t">' + esc(o.title) + '<small>' + esc(orderSub(o)) + '</small></span></button>';
      }).join('') + '</div>' +
      '<div class="lbl">כמה זמן?</div>' +
      '<div class="seg"><button type="button" data-act="fmode" data-m="times" aria-pressed="' + (fgSel.mode === 'times') + '">משעה עד שעה</button>' +
      '<button type="button" data-act="fmode" data-m="hours" aria-pressed="' + (fgSel.mode === 'hours') + '">מספר שעות</button></div>' +
      (fgSel.mode === 'times'
        ? '<div class="two"><label>משעה<input type="time" id="f-start"></label><label>עד שעה<input type="time" id="f-end"></label></div>'
        : '<label>שעות<input type="number" id="f-hours" inputmode="decimal" step="0.25" min="0.25" max="12" placeholder="2.5"></label>') +
      '<p id="f-err" class="err" role="alert" hidden></p>' +
      '<button class="bigbtn" type="submit">שלחו לאישור</button></form>' + backBtn();
    document.getElementById('fg').addEventListener('submit', function (ev) { ev.preventDefault(); submitForgot(); });
  }
  function ferr(m) { var e = document.getElementById('f-err'); e.textContent = m; e.hidden = false; }
  function submitForgot() {
    var date = document.getElementById('f-date').value, t = todayStr();
    if (!date) return ferr('בחרו תאריך');
    if (date > t) return ferr('אי אפשר לדווח על תאריך עתידי');
    if (!fgSel.orderId) return ferr('בחרו הזמנה');
    var obj = { stuId: cur, orderId: fgSel.orderId, date: date, by: 'stu', note: '' };
    if (fgSel.mode === 'times') {
      var a = document.getElementById('f-start').value, b = document.getElementById('f-end').value;
      if (!a || !b) return ferr('מלאו שעת התחלה ושעת סיום');
      if (b <= a) return ferr('שעת הסיום חייבת להיות אחרי ההתחלה');
      var h = E.hoursBetween(a, b);
      if (!(h > 0 && h <= 12)) return ferr('אפשר לדווח עד 12 שעות');
      obj.start = a; obj.end = b; obj.hours = Math.round(h * 100) / 100;
    } else {
      var v = parseFloat(String(document.getElementById('f-hours').value).replace(',', '.'));
      if (!(v > 0 && v <= 12)) return ferr('מספר השעות צריך להיות בין 0 ל-12');
      obj.start = null; obj.end = null; obj.hours = Math.round(v * 100) / 100;
    }
    E.addEntry(obj);
    lastDone = { hours: obj.hours };
    go('done');
  }

  /* ---------- השעות שלי ---------- */
  function viewHours() {
    var all = E.entries({ ym: ym(), stuId: cur }).slice().sort(function (a, b) {
      return a.date < b.date ? 1 : a.date > b.date ? -1 : String(b.start || '').localeCompare(String(a.start || ''));
    });
    var ok = all.filter(function (e) { return e.status === 'ok'; });
    var wait = all.filter(function (e) { return e.status === 'wait'; });
    app.innerHTML = '<h1>השעות שלי החודש</h1><div class="stats">' +
      '<div class="stat"><span>מאושרות</span><b>' + ltr(num(E.sumHours(ok))) + '</b></div>' +
      '<div class="stat"><span>ממתינות לאישור</span><b>' + ltr(num(E.sumHours(wait))) + '</b></div>' +
      '<div class="stat"><span>ימי עבודה</span><b>' + ltr(String(E.workDays(ok))) + '</b></div></div>' +
      '<div class="list">' + (all.length ? all.map(function (e) {
        var when = e.start && e.end ? ' · ' + ltr(e.start + '–' + e.end) : '';
        return '<div class="ent"><div class="l1"><b>' + esc(orderTitle(e.orderId)) + '</b><i class="tag ' + esc(e.status) + '">' + esc(E.ESTATUS[e.status] || e.status) + '</i></div>' +
          '<div class="l2">' + ltr(fmtDate(e.date)) + when + ' · ' + ltr(num(e.hours)) + ' שעות</div></div>';
      }).join('') : '<p class="empty">עוד אין דיווחים החודש</p>') + '</div>' + backBtn();
  }

  /* ---------- פעולות ---------- */
  function restore(k) {
    var set = function (id, v) { var el = document.getElementById(id); if (el && v) el.value = v; };
    set('f-date', k.d); set('f-start', k.s); set('f-end', k.e); set('f-hours', k.h);
  }
  function val(id) { var el = document.getElementById(id); return el ? el.value : ''; }

  app.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-act]'); if (!b || b.disabled) return;
    var a = b.getAttribute('data-act');
    if (a === 'home') go('home');
    else if (a === 'forgot') go('forgot');
    else if (a === 'hours') go('hours');
    else if (a === 'exit') { cur = null; pick = ''; lastDone = null; fgSel = { orderId: '', mode: 'times' }; go('pin'); }
    else if (a === 'pick') { pick = b.getAttribute('data-id'); viewHome(); }
    else if (a === 'in') { if (pick) { E.clockIn(cur, pick); pick = ''; viewHome(); } }
    else if (a === 'out') {
      var e = E.clockOut(cur);
      if (e) { lastDone = { hours: Math.round(e.hours * 100) / 100 }; go('done'); } else go('home');
    }
    else if (a === 'fpick') {
      var keep = { d: val('f-date'), s: val('f-start'), e: val('f-end'), h: val('f-hours') };
      fgSel.orderId = b.getAttribute('data-id'); viewForgot(); restore(keep);
    }
    else if (a === 'fmode') {
      var dv = val('f-date');
      fgSel.mode = b.getAttribute('data-m'); viewForgot(); restore({ d: dv });
    }
  });

  window.addEventListener('hashchange', render);
  function refresh() {
    var r = route();
    if (r === 'forgot' || r === 'pin') { E.load(); return; } // לא למחוק קלט באמצע מילוי
    render();
  }
  window.addEventListener('focus', refresh);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) refresh(); });

  E.load();
  if (!location.hash) location.hash = 'pin';
  render();
})();
