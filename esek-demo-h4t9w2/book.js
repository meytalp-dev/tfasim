/* book.js — דף הלקוח: הזמנת תור לבד. מציג רק שירותים ומשבצות פנויות; אף שם של לקוח/תלמיד.ה. */
(function () {
  'use strict';
  Esek.load2();
  try { Esek.autoPrep(Esek.now()); } catch (e) { /* ignore */ }

  var app = document.getElementById('app');
  var D = { svc: null, date: null, time: null };
  var DAYN = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  var STEPS = ['svc', 'day', 'time', 'info'];

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function ic(n) { return '<svg class="i" aria-hidden="true"><use href="#i-' + n + '"/></svg>'; }
  function ltr(x) { return '<bdi dir="ltr">' + esc(x) + '</bdi>'; }
  function dm(d) { var p = d.split('-'); return +p[2] + '.' + +p[1]; }
  function dayName(d) { return DAYN[Esek.dayOfWeek(d)]; }
  function st() { return Esek.state; }
  function svc() { return Esek.byId(st().biz.services, D.svc); }

  function back(to) { return '<button class="back" type="button" data-go="' + to + '">' + ic('left') + 'חזרה</button>'; }
  function prog(n) {
    return '<div><div class="prog-t">שלב ' + ltr(n) + ' מתוך ' + ltr(4) + '</div><div class="prog"><i style="width:' + (n * 25) + '%"></i></div></div>';
  }

  function go(h) { if (location.hash === '#' + h) render(); else location.hash = h; }
  function cur() { var h = (location.hash || '').slice(1); return h || 'svc'; }

  function render() {
    var h = cur();
    if (h !== 'svc' && h !== 'done' && !D.svc) { location.replace('#svc'); return; }
    if ((h === 'time' || h === 'info') && !D.date) { location.replace('#day'); return; }
    if (h === 'info' && !D.time) { location.replace('#time'); return; }
    if (h === 'done' && !D.done) { location.replace('#svc'); return; }
    var fn = { svc: vSvc, day: vDay, time: vTime, info: vInfo, done: vDone }[h] || vSvc;
    app.innerHTML = fn();
    bind();
    window.scrollTo(0, 0);
  }

  function vSvc() {
    var b = st().biz;
    var list = b.services.map(function (s) {
      return '<button class="opt" type="button" data-svc="' + esc(s.id) + '"><span><b>' + esc(s.name) + '</b><small>' + ltr(s.minutes) + ' דקות</small></span>' +
        '<span><b>' + ltr(s.price) + ' ₪</b></span></button>';
    }).join('');
    return '<div class="hero"><h1>' + esc(b.name) + '</h1><p>קובעים תור בכמה לחיצות. הרכז.ת יאשר.ו ויחזרו אליך.</p></div>' +
      prog(1) + '<div class="card"><h2>איזה שירות?</h2><div class="opts">' + list + '</div></div>';
  }

  function openDays() {
    var out = [], t = Esek.today(), dayset = (st().biz.hours || {}).days || [0, 1, 2, 3, 4];
    for (var i = 0; i < 14; i++) {
      var d = Esek.addDays(t, i), open = dayset.indexOf(Esek.dayOfWeek(d)) >= 0;
      var free = open && Esek.publicSlots(d, D.svc).some(function (s) { return s.free; });
      out.push({ d: d, open: open, free: free });
    }
    return out;
  }
  function vDay() {
    var s = svc();
    var days = openDays().map(function (x) {
      var sub = !x.open ? 'סגור' : (x.free ? '' : 'מלא');
      return '<button class="opt' + (D.date === x.d ? ' sel' : '') + '" type="button" data-day="' + x.d + '"' + (x.free ? '' : ' disabled') + '>' +
        '<b>' + esc(dayName(x.d)) + '</b><span>' + ltr(dm(x.d)) + '</span>' + (sub ? '<small>' + sub + '</small>' : '') + '</button>';
    }).join('');
    return back('svc') + prog(2) + '<div class="card"><h2>' + esc(s.name) + ': באיזה יום?</h2><div class="days">' + days + '</div></div>';
  }

  function vTime() {
    var free = Esek.publicSlots(D.date, D.svc).filter(function (s) { return s.free; });
    var body = free.length ? '<div class="slots">' + free.map(function (s) {
      return '<button class="opt" type="button" data-time="' + s.time + '">' + ltr(s.time) + '</button>';
    }).join('') + '</div>' : '<p class="muted">אין שעות פנויות ביום הזה. אפשר לבחור יום אחר.</p>';
    return back('day') + prog(3) + '<div class="card"><h2>יום ' + esc(dayName(D.date)) + ' ' + ltr(dm(D.date)) + ': באיזו שעה?</h2>' + body + '</div>';
  }

  function vInfo() {
    var s = svc();
    return back('time') + prog(4) +
      '<div class="card"><h2>הפרטים שלך</h2>' +
      '<ul class="sum"><li><span>שירות</span><b>' + esc(s.name) + '</b></li>' +
      '<li><span>מתי</span><b>' + esc(dayName(D.date)) + ' ' + ltr(dm(D.date)) + ' ' + ltr(D.time) + '</b></li></ul>' +
      '<label class="f" for="nm">שם</label><input class="in" id="nm" autocomplete="name" value="' + esc(D.name || '') + '">' +
      '<label class="f" for="ph">טלפון</label><input class="in" id="ph" type="tel" inputmode="tel" dir="ltr" style="text-align:right" autocomplete="tel" value="' + esc(D.phone || '') + '">' +
      '<label class="f" for="em">מייל (לא חובה)</label><input class="in" id="em" type="email" inputmode="email" dir="ltr" style="text-align:right" autocomplete="email" value="' + esc(D.email || '') + '">' +
      '<div id="err"></div></div>' +
      '<button class="btn pri" type="button" id="send">' + ic('check') + 'שליחת בקשה</button>';
  }

  function vDone() {
    return '<div class="card done"><div class="ring">' + ic('check') + '</div><h2>הבקשה התקבלה</h2>' +
      '<p>הרכז.ת יאשר.ו ויחזרו אליך.</p></div>' +
      '<button class="btn" type="button" id="again">הזמנת תור נוסף</button>';
  }

  function bind() {
    var q = function (s, f) { Array.prototype.forEach.call(app.querySelectorAll(s), f); };
    q('[data-go]', function (b) { b.onclick = function () { go(b.getAttribute('data-go')); }; });
    q('[data-svc]', function (b) { b.onclick = function () { D.svc = b.getAttribute('data-svc'); D.date = null; D.time = null; go('day'); }; });
    q('[data-day]', function (b) { b.onclick = function () { D.date = b.getAttribute('data-day'); D.time = null; go('time'); }; });
    q('[data-time]', function (b) { b.onclick = function () { D.time = b.getAttribute('data-time'); go('info'); }; });
    var send = document.getElementById('send');
    if (send) send.onclick = function () {
      var name = document.getElementById('nm').value.trim(), phone = document.getElementById('ph').value.trim(), email = document.getElementById('em').value.trim();
      D.name = name; D.phone = phone; D.email = email;
      var err = document.getElementById('err'), msg = '';
      if (!name) msg = 'צריך לכתוב שם.';
      else if (Esek.normPhone(phone).length < 9) msg = 'צריך מספר טלפון תקין, כדי שיוכלו לחזור אליך.';
      if (msg) { err.innerHTML = '<div class="msg err" role="alert">' + msg + '</div>'; return; }
      var o = Esek.requestAppt({ serviceId: D.svc, date: D.date, time: D.time, name: name, phone: phone, email: email });
      if (!o) {
        err.innerHTML = '<div class="msg err" role="alert">השעה הזאת כבר נתפסה. אפשר לבחור שעה אחרת.</div>';
        D.time = null; setTimeout(function () { go('time'); }, 1600);
        return;
      }
      D.done = true; go('done');
    };
    var again = document.getElementById('again');
    if (again) again.onclick = function () { D = { svc: null, date: null, time: null }; go('svc'); };
  }

  window.addEventListener('hashchange', render);
  render();
})();
