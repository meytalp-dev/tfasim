/* p-cal.js — יומן תורים.
   #cal · #cal/<YYYY-MM-DD>   יום + פס שבוע, בקשות מלקוחות, קישור להזמנת תור
   #appt/new?date=<YYYY-MM-DD> תור חדש
   #order/<id>                 פרטי תור/הזמנה: עריכה, "התור בוצע", מה בוצע ללקוח, דיווחים, תזכורת
   חושף window.CalKit (רשימת תלמידים עם בדיקת התנגשות, חלון תזכורת) לשימוש p-quotes.js. */
(function () {
  'use strict';
  var S = Shell, esc = S.esc;
  var DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  var DL = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
  var OST = { req: 'בקשה מלקוח', 'new': 'בלי מועד', sched: 'נקבע', work: 'בביצוע', done: 'בוצע', closed: 'נסגר' };
  var EST = { prep: 'ממתין לתלמיד.ה', wait: 'ממתין לאישורך', ok: 'אושר', no: 'נדחה' };

  function toMin(t) { var p = String(t || '0:0').split(':'); return +p[0] * 60 + +p[1]; }
  function fromMin(m) { var h = Math.floor(m / 60), mm = m % 60; return (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm; }
  function r2(x) { return Math.round(x * 100) / 100; }
  function firstName(n) { return String(n || '').trim().split(/\s+/)[0]; }
  function splitQuery(p) {
    p = String(p || '');
    var i = p.indexOf('?'), q = {};
    if (i >= 0) {
      p.slice(i + 1).split('&').forEach(function (kv) {
        var a = kv.split('=');
        if (a[0]) q[a[0]] = a.slice(1).join('=');
      });
      p = p.slice(0, i);
    }
    return { id: p, q: q };
  }
  function isOpenDay(d) { var h = Esek.state.biz.hours || {}; return (h.days || []).indexOf(Esek.dayOfWeek(d)) >= 0; }
  function nowMin() { var n = Esek.now(); return n.getHours() * 60 + n.getMinutes(); }
  function isFuture(o) {
    if (!o || !o.date || !o.time) return false;
    var td = Esek.today();
    if (o.date !== td) return o.date > td;
    return toMin(o.time) > nowMin();
  }
  function canRemind(o) { return !!(o && o.custId && isFuture(o) && (o.status === 'sched' || o.status === 'new')); }
  function stuNames(o) { return (o.stuIds || []).map(function (id) { return S.stuName(id); }).filter(Boolean); }
  function svList() { return Esek.state.biz.services || []; }
  function taskList() { return Esek.state.biz.tasks || []; }
  function isMobile() {
    var ua = navigator.userAgent || '';
    if (/Android|iPhone|iPad|iPod|Mobile/i.test(ua)) return true;
    try { return window.matchMedia('(pointer:coarse)').matches && window.innerWidth < 900; } catch (e) { return false; }
  }

  /* ---------- רשימת תלמידים עם בדיקת התנגשות (משותף) ---------- */
  function busyOf(sid, ctx) {
    if (!ctx || !ctx.date || !ctx.time) return [];
    return Esek.conflicts({ id: ctx.id || '_draft', date: ctx.date, time: ctx.time, minutes: +ctx.minutes || 0, stuIds: [sid] });
  }
  function stuChecklist(sel, ctx) {
    sel = sel || [];
    var list = Esek.state.students.slice().sort(function (a, b) { return a.name.localeCompare(b.name, 'he'); });
    var warn = false;
    var h = '<div class="w-stus" role="group" aria-label="תלמידים">' + list.map(function (s) {
      var busy = busyOf(s.id, ctx), on = sel.indexOf(s.id) >= 0;
      if (busy.length && on) warn = true;
      return '<label class="chk w-stu' + (on ? ' on' : '') + '"><input type="checkbox" data-stu value="' + esc(s.id) + '"' + (on ? ' checked' : '') + '>' +
        '<span class="w-stu-n">' + esc(s.name) + (busy.length ? '<span class="tag">' + S.icon('alert') + 'בתור אחר ' + S.ltr(busy[0].time) + '</span>' : '') + '</span></label>';
    }).join('') + '</div>';
    h += '<p class="w-warn"' + (warn ? '' : ' hidden') + ' data-stu-warn>' + S.icon('alert', 'sm') + 'יש תלמיד.ה שמשובץ.ת בתור אחר באותה שעה. אפשר לשמור בכל זאת.</p>';
    return h;
  }
  function readChecked(root) {
    return Array.prototype.slice.call(root.querySelectorAll('[data-stu]:checked')).map(function (x) { return x.value; });
  }

  /* ---------- מחיר ללקוח (חישוב מקומי: fixedPrice > משימות > תנאי הלקוח) ---------- */
  function tasksTotal(rows) {
    var t = 0;
    (rows || []).forEach(function (r) { var tk = Esek.byId(taskList(), r.taskId); if (tk) t += (+r.qty || 0) * (+tk.price || 0); });
    return r2(t);
  }
  function chargeHtml(o, rows) {
    if (!o.billable) return '<b>לא לחיוב</b><span>ההזמנה מסומנת "לא לחיוב"</span>';
    if (o.fixedPrice !== undefined && o.fixedPrice !== null && o.fixedPrice !== '') {
      return '<b>לפי הצעת מחיר: ' + S.fmtMoney(o.fixedPrice) + '</b><span>המחיר נקבע בהצעה שאושרה, הפירוט לא משנה אותו</span>';
    }
    var c = Esek.byId(Esek.state.customers, o.custId), es = Esek.entries({ orderId: o.id, status: 'ok' });
    var good = (rows || []).filter(function (r) { return r.taskId && +r.qty > 0; });
    if (c && c.bill === 'tasks') return '<b>' + S.fmtMoney(tasksTotal(good)) + '</b><span>לפי מה שבוצע: כמות × מחיר קבוע למשימה, בלי קשר לשעות</span>';
    var hrs = Esek.sumHours(es), days = Esek.workDays(es), a = 0;
    if (c && (c.bill === 'hours' || c.bill === 'both')) a += hrs * (+c.rateHour || 0);
    if (c && (c.bill === 'days' || c.bill === 'both')) a += days * (+c.rateDay || 0);
    return '<b>' + S.fmtMoney(a) + '</b><span>לפי תנאי החיוב של הלקוח (' + S.fmtHours(hrs) + ' מאושרות)</span>';
  }

  /* ---------- תזכורת ללקוח ---------- */
  function rtlHtml(body) {
    return '<div dir="rtl" style="direction:rtl;text-align:right;font-family:Arial,sans-serif;font-size:15px;line-height:1.6">' +
      String(body).split('\n').map(function (l) {
        return '<p dir="rtl" style="margin:0 0 6px;direction:rtl;text-align:right">' + (esc(l) || '&nbsp;') + '</p>';
      }).join('') + '</div>';
  }
  function copyHtmlSync(html, plain) {
    var box = document.createElement('div');
    box.contentEditable = 'true';
    box.setAttribute('dir', 'rtl');
    box.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0;white-space:normal';
    box.innerHTML = html;
    document.body.appendChild(box);
    function onCopy(e) {
      try { e.clipboardData.setData('text/html', html); e.clipboardData.setData('text/plain', plain); e.preventDefault(); } catch (x) { /* ברירת המחדל: הבחירה */ }
    }
    document.addEventListener('copy', onCopy);
    var ok = false;
    try {
      var r = document.createRange();
      r.selectNodeContents(box);
      var s = window.getSelection();
      s.removeAllRanges(); s.addRange(r);
      ok = document.execCommand('copy');
      s.removeAllRanges();
    } catch (e) { ok = false; }
    document.removeEventListener('copy', onCopy);
    document.body.removeChild(box);
    return ok;
  }
  function reminderModal(orderId) {
    var st = Esek.state, o = Esek.byId(st.orders, orderId);
    if (!o) return;
    var c = Esek.byId(st.customers, o.custId), r = Esek.reminderText(orderId);
    if (!r) return;
    var email = c && c.email ? String(c.email).trim() : '';
    var mobile = isMobile(), phoneOk = c && Esek.normPhone(c.phone).length >= 9;
    var waOpt = phoneOk
      ? '<a class="btn w-opt" href="' + esc(r.wa) + '" target="_blank" rel="noopener" data-rem="wa">' + S.icon('whatsapp') + '<span><b>וואטסאפ</b><small>' + S.ltr(c.phone) + '</small></span></a>'
      : '<div class="w-opt off">' + S.icon('whatsapp') + '<span><b>וואטסאפ</b><small>אין טלפון תקין ללקוח.ה</small></span></div>';
    var mailOpt;
    if (!email) mailOpt = '<div class="w-opt off" aria-disabled="true">' + S.icon('mail') + '<span><b>מייל</b><small>אין כתובת מייל ללקוח.ה. אפשר להוסיף ב"לקוחות ושירותים".</small></span></div>';
    else if (mobile) {
      mailOpt = '<a class="btn w-opt" href="mailto:' + encodeURIComponent(email).replace(/%40/g, '@') + '?subject=' + encodeURIComponent(r.subject) + '&body=' + encodeURIComponent(r.body) +
        '" data-rem="mailto">' + S.icon('mail') + '<span><b>מייל</b><small>' + S.ltr(email) + '</small></span></a>';
    } else {
      mailOpt = '<button class="btn w-opt" type="button" data-rem="gmail">' + S.icon('mail') + '<span><b>מייל (טיוטה ב-Gmail)</b><small>' + S.ltr(email) + ' · הנוסח מועתק, מדביקים ב-<bdi dir="ltr">Ctrl+V</bdi></small></span></button>';
    }
    var html = '<p class="w-mut">' + esc(S.workLabel(o).title) + ' · ' + esc(c ? c.name : '') + ' · ' + S.fmtDate(o.date) + ' ' + S.ltr(o.time) + '</p>' +
      (o.reminded ? '<p><span class="tag ok">' + S.icon('check') + 'נשלחה תזכורת ' + S.fmtDate(o.reminded, { noDay: true }) + '</span></p>' : '') +
      '<div class="w-opts">' + waOpt + mailOpt + '</div>' +
      '<h3 class="w-h3">הנוסח</h3><div class="w-prev" dir="rtl">' + esc(r.body) + '</div>' +
      '<p class="w-mut">השליחה מהמכשיר שלך. אחרי הלחיצה התור יסומן "נשלחה תזכורת".</p>';
    var m = S.modal({ title: 'תזכורת ללקוח.ה', html: html, actions: [{ label: 'סגירה', cls: 'ghost' }] });
    function after() {
      Esek.markReminded(orderId);
      setTimeout(function () { m.close(); S.refresh(); }, 400);
    }
    m.body.addEventListener('click', function (e) {
      var b = e.target.closest('[data-rem]');
      if (!b) return;
      var kind = b.getAttribute('data-rem');
      if (kind === 'gmail') {
        e.preventDefault();
        var ok = copyHtmlSync(rtlHtml(r.body), r.body);
        window.open('https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(email) + '&su=' + encodeURIComponent(r.subject) +
          (ok ? '' : '&body=' + encodeURIComponent(r.body)), '_blank', 'noopener');
        S.toast(ok ? 'לחצו בגוף המייל ו-Ctrl+V' : 'הנוסח הועבר לטיוטה כטקסט');
      }
      after();
    });
  }

  /* ---------- בקשות: אישור ושיבוץ / דחייה ---------- */
  function acceptModal(orderId) {
    var o = Esek.byId(Esek.state.orders, orderId);
    if (!o) return;
    var w = S.workLabel(o), ctx = { id: o.id, date: o.date, time: o.time, minutes: o.minutes };
    S.modal({
      title: 'אישור ושיבוץ',
      html: '<p class="w-mut">' + esc(w.title) + ' · ' + esc(w.sub) + ' · ' + S.fmtDate(o.date) + ' ' + S.timeRange(o.time, Esek.apptEnd(o)) + '</p>' +
        '<h3 class="w-h3">מי עובד.ת בתור</h3><div data-acc>' + stuChecklist([], ctx) + '</div><p class="err" data-acc-err hidden>צריך לבחור לפחות תלמיד.ה אחד.ת.</p>',
      onOpen: function (api) {
        api.body.addEventListener('change', function () {
          var box = api.body.querySelector('[data-acc]');
          box.innerHTML = stuChecklist(readChecked(box), ctx);
        });
      },
      actions: [{ label: 'אישור ושיבוץ', cls: 'pri', onClick: function (api) {
        var ids = readChecked(api.body);
        api.body.querySelector('[data-acc-err]').hidden = !!ids.length;
        if (!ids.length) return false;
        if (!Esek.acceptReq(orderId, ids)) { S.toast('הבקשה כבר טופלה'); S.refresh(); return; }
        S.toast('הבקשה אושרה ושובצו ' + ids.length + ' תלמידים');
        setTimeout(S.refresh, 0);
      } }, { label: 'ביטול', cls: 'ghost' }]
    });
  }
  function rejectModal(orderId) {
    var o = Esek.byId(Esek.state.orders, orderId);
    if (!o) return;
    var w = S.workLabel(o);
    S.modal({
      title: 'דחיית הבקשה',
      html: '<p>' + esc(w.title) + ' · ' + esc(w.sub) + ' · ' + S.fmtDate(o.date) + ' ' + S.ltr(o.time) + '</p><p class="w-mut">המשבצת תשתחרר. כדאי להודיע ללקוח.ה בטלפון.</p>',
      actions: [{ label: 'דחייה', cls: 'warn', onClick: function () {
        Esek.rejectReq(orderId);
        S.toast('הבקשה נדחתה');
        setTimeout(S.refresh, 0);
      } }, { label: 'ביטול', cls: 'ghost' }]
    });
  }
  function reqButtons(o) {
    return '<button class="btn pri" type="button" data-accept="' + esc(o.id) + '">' + S.icon('check', 'sm') + 'אישור ושיבוץ</button>' +
      '<button class="btn danger" type="button" data-reject="' + esc(o.id) + '">דחייה</button>';
  }
  function remindBtn(o) {
    return '<button class="btn" type="button" data-remind="' + esc(o.id) + '">' + S.icon('chat', 'sm') + 'תזכורת</button>';
  }
  function bindCommon(el) {
    el.addEventListener('click', function (e) {
      var b;
      if ((b = e.target.closest('[data-accept]'))) acceptModal(b.getAttribute('data-accept'));
      else if ((b = e.target.closest('[data-reject]'))) rejectModal(b.getAttribute('data-reject'));
      else if ((b = e.target.closest('[data-remind]'))) reminderModal(b.getAttribute('data-remind'));
    });
  }

  /* ---------- #cal ---------- */
  function apptRow(o) {
    var w = S.workLabel(o), names = stuNames(o), conf = o.status !== 'req' ? Esek.conflicts(o) : [];
    var tags = '';
    if (o.status === 'req') tags += '<span class="tag">' + S.icon('chat') + 'בקשה</span>';
    else tags += '<span class="tag ' + (o.status === 'done' ? 'ok' : 'info') + '">' + esc(OST[o.status] || o.status) + '</span>';
    if (conf.length) tags += '<span class="tag">' + S.icon('alert') + 'מתנגש</span>';
    if (o.source === 'stu') tags += '<span class="tag info">נקבע ע"י תלמיד.ה</span>';
    if (o.source === 'cust' && o.status !== 'req') tags += '<span class="tag info">הוזמן ע"י הלקוח.ה</span>';
    if (o.reminded) tags += '<span class="tag ok">' + S.icon('check') + 'נשלחה תזכורת ' + S.fmtDate(o.reminded, { noDay: true }) + '</span>';
    var acts = o.status === 'req' ? reqButtons(o) : (canRemind(o) ? remindBtn(o) : '');
    acts += '<a class="btn ghost" href="#order/' + esc(o.id) + '">פרטים' + S.icon('chevron', 'sm') + '</a>';
    var sub = [w.sub, o.status === 'req' ? 'ממתינה לאישורך' : (names.length ? names.join(', ') : 'לא שובצו תלמידים')].filter(Boolean).join(' · ');
    return '<li class="w-appt' + (o.status === 'req' ? ' req' : '') + (o.status === 'done' ? ' done' : '') + '" data-appt="' + esc(o.id) + '">' +
      '<div class="w-tm">' + S.timeRange(o.time, Esek.apptEnd(o)) + '</div>' +
      '<div class="w-ap-b"><a class="w-ap-t" href="#order/' + esc(o.id) + '">' + esc(w.title) + '</a>' +
      '<div class="w-ap-s">' + esc(sub) + '</div><div class="w-tags">' + tags + '</div></div>' +
      '<div class="w-acts">' + acts + '</div></li>';
  }
  function dayTimeline(day, list) {
    if (!list.length) return '';
    var h = Esek.state.biz.hours || { open: '08:00', close: '16:00' };
    var o0 = toMin(h.open), c0 = toMin(h.close);
    list.forEach(function (o) {
      o0 = Math.min(o0, Math.floor(toMin(o.time) / 60) * 60);
      c0 = Math.max(c0, Math.ceil((toMin(o.time) + (+o.minutes || 30)) / 60) * 60);
    });
    var span = Math.max(60, c0 - o0), td = Esek.today(), nm = nowMin();
    function pos(m) { return Math.max(0, Math.min(100, (m - o0) * 100 / span)); }
    var lanes = [], LH = 50;
    var blocks = list.map(function (o) {
      var s = toMin(o.time), e = s + Math.max(+o.minutes || 0, 15), l = 0;
      while (l < lanes.length && lanes[l] > s) l++;
      lanes[l] = e;
      var cls = o.status === 'req' ? 'req' : (o.status === 'done' || day < td || (day === td && e <= nm)) ? 'done' : 'later';
      return '<a class="blk ' + cls + '" href="#order/' + esc(o.id) + '" style="right:' + pos(s).toFixed(2) + '%;width:calc(' + (pos(e) - pos(s)).toFixed(2) + '% - 3px);top:' + (4 + l * LH) + 'px;height:' + (LH - 6) + 'px">' +
        '<b><bdi dir="ltr" class="num">' + esc(o.time) + '</bdi></b><small>' + esc(S.workLabel(o).title) + '</small></a>';
    }).join('');
    var hrs = '', gl = '';
    for (var m = o0; m <= o0 + span; m += 60) {
      hrs += '<span style="right:' + pos(m).toFixed(2) + '%"><bdi dir="ltr" class="num">' + fromMin(m) + '</bdi></span>';
      if (m > o0 && m < o0 + span) gl += '<i class="gl" style="right:' + pos(m).toFixed(2) + '%"></i>';
    }
    var now = day === td && nm >= o0 && nm <= o0 + span ? '<div class="now" style="right:' + pos(nm).toFixed(2) + '%" data-t="עכשיו ' + fromMin(nm) + '"></div>' : '';
    return '<div class="card w-tl" aria-hidden="true"><div class="tl-track"><div class="tl-hours">' + hrs + '</div><div class="tl-body" style="height:' +
      (Math.max(1, lanes.length) * LH + 2) + 'px">' + gl + blocks + now + '</div></div></div>';
  }
  function bookCard() {
    var url = location.href.split('#')[0].replace(/[^\/]*$/, '') + 'book.html';
    return '<h2 class="sec-t">קישור להזמנת תור ללקוחות</h2><div class="card pad w-book">' +
      '<p class="w-mut">לקוחות בוחרים שירות, יום ומשבצת פנויה. הבקשה מגיעה לכאן לאישור ולשיבוץ.</p>' +
      '<p class="w-mut"><b>בהדגמה הדף עובד רק במכשיר הזה.</b> שליחת הקישור ללקוחות תתאפשר כשהנתונים יעברו לשרת משותף.</p>' +
      '<div class="w-row">' + (url ? '' : '') +
      '<a class="btn ghost" href="book.html" target="_blank" rel="noopener">' + S.icon('external', 'sm') + 'פתיחת הדף</a></div></div>';
  }
  function calScreen(el, params) {
    var td = Esek.today(), p = splitQuery(params[0]).id;
    var day = DATE_RE.test(p) ? p : td;
    var list = Esek.appts(day), wk = Esek.weekRange(day);
    var reqs = Esek.state.orders.filter(function (o) { return o.status === 'req'; })
      .sort(function (a, b) { return (a.date + a.time) < (b.date + b.time) ? -1 : 1; });
    var strip = '';
    for (var i = 0; i < 7; i++) {
      var d = Esek.addDays(wk.from, i), n = Esek.appts(d).length, open = isOpenDay(d);
      strip += '<a class="w-wd' + (d === td ? ' today' : '') + (open ? '' : ' closed') + '" href="#cal/' + d + '"' + (d === day ? ' aria-current="date"' : '') +
        ' aria-label="' + esc(S.fmtDateText(d) + ', ' + n + ' תורים' + (d === td ? ', היום' : '')) + '">' +
        '<span class="w-wd-n">' + DL[i] + '</span><span class="w-wd-d num" dir="ltr">' + S.fmtDateText(d, { noDay: true }) + '</span>' +
        '<span class="w-wd-c">' + (open || n ? '<b class="num">' + n + '</b>' : 'סגור') + '</span></a>';
    }
    var nAppt = list.filter(function (o) { return o.status !== 'req'; }).length, nReq = list.length - nAppt;
    el.innerHTML = S.screenHead({
      title: 'יומן תורים', sub: S.fmtDate(day, { year: true }) + (day === td ? ' · היום' : ''),
      actions: '<a class="btn pri" href="#appt/new?date=' + day + '">' + S.icon('plus') + 'תור חדש</a>'
    }) +
      '<div class="w-daynav"><a class="btn" href="#cal/' + Esek.addDays(day, -1) + '" aria-label="יום קודם">' + S.icon('back') + '<span>יום קודם</span></a>' +
      '<a class="btn' + (day === td ? ' pri' : '') + '" href="#cal/' + td + '">היום</a>' +
      '<a class="btn" href="#cal/' + Esek.addDays(day, 1) + '" aria-label="יום הבא"><span>יום הבא</span>' + S.icon('chevron') + '</a></div>' +
      '<nav class="w-week card" aria-label="השבוע">' + strip + '</nav>' +
      (reqs.length ? '<h2 class="sec-t">בקשות מלקוחות (' + S.ltr(reqs.length) + ')</h2><ul class="card w-list">' + reqs.map(function (o) {
        var w = S.workLabel(o);
        return '<li class="w-appt req"><div class="w-tm"><span class="w-tm-d">' + S.fmtDate(o.date) + '</span> <span class="w-tm-d">' + S.timeRange(o.time, Esek.apptEnd(o)) + '</span></div>' +
          '<div class="w-ap-b"><a class="w-ap-t" href="#order/' + esc(o.id) + '">' + esc(w.title) + '</a><div class="w-ap-s">' + esc(w.sub) + ' · ממתינה לאישורך</div>' +
          '<div class="w-tags"><span class="tag">' + S.icon('chat') + 'בקשה</span></div></div><div class="w-acts">' + reqButtons(o) + '</div></li>';
      }).join('') + '</ul>' : '') +
      '<h2 class="sec-t">' + (day === td ? 'התורים היום' : 'התורים ב' + esc(S.dayName(day))) + ' <span class="w-cnt">· תורים: ' + S.ltr(nAppt) + (nReq ? ' · בקשות: ' + S.ltr(nReq) : '') + '</span></h2>' +
      (isOpenDay(day) ? '' : '<div class="card pad w-closed">' + S.icon('calendar') + '<span>העסק סגור ביום זה</span></div>') +
      dayTimeline(day, list) +
      (list.length ? '<ul class="card w-list">' + list.map(apptRow).join('') + '</ul>'
        : (isOpenDay(day) ? '<div class="card pad w-empty">אין תורים ביום זה. <a href="#appt/new?date=' + day + '">קביעת תור</a></div>' : '')) +
      bookCard();
    bindCommon(el);
  }

  /* ---------- #appt/new ---------- */
  function svOptions(sel, emptyLbl) {
    return '<option value="">' + esc(emptyLbl || 'בחירה') + '</option>' + svList().map(function (s) {
      return '<option value="' + esc(s.id) + '"' + (s.id === sel ? ' selected' : '') + '>' + esc(s.name) + ' · ' + (+s.minutes || 0) + ' דק\'</option>';
    }).join('');
  }
  function custOptions(sel) {
    return Esek.state.customers.slice().sort(function (a, b) { return a.name.localeCompare(b.name, 'he'); }).map(function (c) {
      return '<option value="' + esc(c.id) + '"' + (c.id === sel ? ' selected' : '') + '>' + esc(c.name) + '</option>';
    }).join('');
  }
  function apptNew(el, query) {
    var td = Esek.today(), day = DATE_RE.test(query.date || '') ? query.date : td;
    el.innerHTML = S.screenHead({ title: 'תור חדש', back: '#cal/' + day, backLabel: 'חזרה ליומן' }) +
      '<div class="card pad"><div class="form-grid">' +
      '<label class="fld">לקוח.ה<select data-f-cust><option value="">בחירה</option><option value="__new">+ לקוח.ה חדש.ה</option><option value="__none">בלי לקוח.ה (עבודה פנימית)</option>' + custOptions('') + '</select></label>' +
      '<label class="fld">שירות<select data-f-sv>' + svOptions('') + '</select></label>' +
      '<label class="fld">כותרת<input type="text" data-f-title></label>' +
      '<label class="fld">משך (דקות)<input type="number" data-f-min inputmode="numeric" min="5" step="5" dir="ltr" value="30"></label>' +
      '</div>' +
      '<div class="form-grid w-newc" data-f-newc hidden>' +
      '<label class="fld">שם הלקוח.ה<input type="text" data-f-cn autocomplete="off"></label>' +
      '<label class="fld">טלפון<input type="tel" data-f-cp dir="ltr" inputmode="tel"></label>' +
      '<label class="fld">מייל (רשות)<input type="email" data-f-ce dir="ltr"></label></div>' +
      '<div class="form-grid" style="margin-top:14px">' +
      '<label class="fld">תאריך<input type="date" data-f-date dir="ltr" value="' + day + '"></label>' +
      '<label class="fld">שעה<select data-f-time></select></label>' +
      '</div><p class="w-mut" data-f-closed hidden>העסק סגור ביום זה. אפשר לבחור שעה ידנית.</p>' +
      '<div class="w-other" data-f-other hidden><label class="fld">שעה ידנית<input type="time" data-f-tm dir="ltr"></label></div>' +
      '<h3 class="w-h3">תלמידים בתור</h3><div data-f-stus></div>' +
      '<label class="chk"><input type="checkbox" data-f-bill checked>לחיוב הלקוח.ה</label>' +
      '<p class="err" data-f-err hidden></p>' +
      '<div class="w-row" style="margin-top:12px"><button class="btn pri" type="button" data-f-save>' + S.icon('check') + 'שמירת התור</button><a class="btn ghost" href="#cal/' + day + '">ביטול</a></div></div>';
    var q = function (s) { return el.querySelector(s); };
    var custS = q('[data-f-cust]'), svS = q('[data-f-sv]'), minI = q('[data-f-min]'), titleI = q('[data-f-title]');
    var dateI = q('[data-f-date]'), timeS = q('[data-f-time]'), tmI = q('[data-f-tm]'), stuBox = q('[data-f-stus]');
    var titleTouched = false;
    function curTime() { return timeS.value === '__other' || !timeS.options.length ? tmI.value : timeS.value; }
    function drawStus() { stuBox.innerHTML = stuChecklist(readChecked(stuBox), { date: dateI.value, time: curTime(), minutes: +minI.value || 0 }); }
    function drawSlots() {
      var prev = timeS.value, sl = dateI.value ? Esek.slots(dateI.value, +minI.value || 30) : [];
      q('[data-f-closed]').hidden = !!sl.length || !dateI.value;
      timeS.innerHTML = sl.map(function (s) {
        return '<option value="' + s.time + '">' + s.time + (s.busy ? ' · תפוס · ' + s.busy : '') + '</option>';
      }).join('') + '<option value="__other">שעה אחרת</option>';
      if (prev && timeS.querySelector('option[value="' + prev + '"]')) timeS.value = prev;
      else if (!sl.length) timeS.value = '__other';
      else {
        var free = sl.filter(function (s) { return !s.busy; })[0];
        timeS.value = (free || sl[0]).time;
      }
      q('[data-f-other]').hidden = timeS.value !== '__other';
      drawStus();
    }
    function autoTitle() {
      if (titleTouched) return;
      var sv = Esek.byId(svList(), svS.value), cn = custS.value === '__new' ? q('[data-f-cn]').value.trim() : S.custName(custS.value);
      titleI.value = (sv ? sv.name : '') + (sv && cn ? ' – ' : '') + (cn || '');
    }
    custS.addEventListener('change', function () {
      q('[data-f-newc]').hidden = custS.value !== '__new';
      q('[data-f-bill]').checked = custS.value !== '__none';
      autoTitle();
    });
    q('[data-f-cn]').addEventListener('input', autoTitle);
    titleI.addEventListener('input', function () { titleTouched = !!titleI.value; });
    svS.addEventListener('change', function () {
      var sv = Esek.byId(svList(), svS.value);
      if (sv) minI.value = +sv.minutes || 30;
      autoTitle(); drawSlots();
    });
    minI.addEventListener('change', drawSlots);
    dateI.addEventListener('change', drawSlots);
    timeS.addEventListener('change', function () { q('[data-f-other]').hidden = timeS.value !== '__other'; drawStus(); });
    tmI.addEventListener('change', drawStus);
    stuBox.addEventListener('change', drawStus);
    drawSlots();
    S.hold(true);
    q('[data-f-save]').addEventListener('click', function () {
      var err = q('[data-f-err]'), cv = custS.value, d = dateI.value, t = curTime(), mins = +minI.value || 0;
      var cn = q('[data-f-cn]').value.trim(), cp = q('[data-f-cp]').value.trim(), ce = q('[data-f-ce]').value.trim();
      var msg = !cv ? 'צריך לבחור לקוח.ה (או "בלי לקוח.ה").' :
        cv === '__new' && !cn ? 'צריך שם ללקוח.ה החדש.ה.' :
        cv === '__new' && Esek.normPhone(cp).length < 9 ? 'צריך טלפון תקין ללקוח.ה החדש.ה.' :
        cv === '__new' && ce && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(ce) ? 'כתובת המייל לא תקינה.' :
        !svS.value && !titleI.value.trim() ? 'צריך לבחור שירות או לכתוב כותרת.' :
        !d ? 'צריך תאריך.' : !/^\d{2}:\d{2}$/.test(t || '') ? 'צריך שעה.' : !(mins > 0) ? 'צריך משך בדקות.' : '';
      err.hidden = !msg; err.textContent = msg;
      if (msg) return;
      var st = Esek.state, custId = null;
      if (cv === '__new') {
        var np = Esek.normPhone(cp), ex = null;
        st.customers.forEach(function (c) { if (!ex && Esek.normPhone(c.phone) === np) ex = c; });
        if (ex) custId = ex.id;
        else {
          var c = { id: Esek.uid(), name: cn, contact: cn, phone: cp, email: ce, bill: 'hours', rateHour: 0, rateDay: 0, note: 'נוצר מתור חדש' };
          st.customers.push(c);
          custId = c.id;
        }
      } else if (cv !== '__none') custId = cv;
      var o = Esek.addAppt({ custId: custId, serviceId: svS.value || null, date: d, time: t, minutes: mins, stuIds: readChecked(stuBox),
        source: 'mgr', billable: q('[data-f-bill]').checked, title: titleI.value.trim() || undefined });
      if (!o) { err.hidden = false; err.textContent = 'התור לא נשמר.'; return; }
      S.hold(false);
      S.toast('התור נשמר: ' + S.fmtDateText(d) + ' ' + t);
      S.go('#cal/' + d);
    });
  }

  /* ---------- #order/<id> ---------- */
  function TasksEd(root, o, onChange) {
    var tasks = taskList();
    var rows = Array.isArray(o.tasks) ? o.tasks.map(function (x) { return { taskId: x.taskId, qty: x.qty }; }) : [];
    var prefilled = false;
    if (!Array.isArray(o.tasks)) {
      var sv = Esek.byId(svList(), o.serviceId);
      rows = ((sv && sv.split) || []).map(function (x) { return { taskId: x.taskId, qty: 1 }; });
      prefilled = rows.length > 0;
    }
    function opts(sel) {
      return tasks.map(function (t) { return '<option value="' + esc(t.id) + '"' + (t.id === sel ? ' selected' : '') + '>' + esc(t.name) + '</option>'; }).join('');
    }
    function draw() {
      root.innerHTML = (prefilled ? '<p class="w-mut">מולא מראש לפי חלוקת השירות. עדיין לא נשמר.</p>' : '') +
        (rows.length ? '<ul class="w-tasks">' + rows.map(function (r, i) {
          var t = Esek.byId(tasks, r.taskId);
          return '<li><label class="fld w-tk-t">משימה<select data-tk-task="' + i + '">' + opts(r.taskId) + '</select></label>' +
            '<label class="fld w-tk-q">כמות<input type="number" data-tk-q="' + i + '" min="0" step="1" inputmode="numeric" dir="ltr" value="' + esc(r.qty) + '"></label>' +
            '<div class="w-tk-p"><span>מחיר קבוע</span>' + S.fmtMoney(t ? t.price : 0) + '</div>' +
            '<div class="w-tk-a"><span>סה"כ</span><b data-tk-a="' + i + '">' + S.fmtMoney((+r.qty || 0) * (t ? +t.price || 0 : 0)) + '</b></div>' +
            '<button class="btn ghost icon" type="button" data-tk-del="' + i + '" aria-label="הסרת המשימה">' + S.icon('trash') + '</button></li>';
        }).join('') + '</ul>' : '<p class="w-mut">לא פורט מה בוצע. החיוב לפי תנאי החיוב של הלקוח.ה.</p>') +
        '<button class="btn" type="button" data-tk-add>' + S.icon('plus') + 'הוספת משימה</button>';
      onChange(rows);
    }
    root.addEventListener('change', function (e) {
      var t = e.target;
      if (t.hasAttribute('data-tk-task')) { rows[+t.getAttribute('data-tk-task')].taskId = t.value; draw(); }
    });
    root.addEventListener('input', function (e) {
      var t = e.target;
      if (t.hasAttribute('data-tk-q')) {
        var i = +t.getAttribute('data-tk-q'), tk = Esek.byId(tasks, rows[i].taskId);
        rows[i].qty = t.value;
        root.querySelector('[data-tk-a="' + i + '"]').innerHTML = S.fmtMoney((+t.value || 0) * (tk ? +tk.price || 0 : 0));
        onChange(rows);
      }
    });
    root.addEventListener('click', function (e) {
      var d = e.target.closest('[data-tk-del]');
      if (d) { rows.splice(+d.getAttribute('data-tk-del'), 1); draw(); return; }
      if (e.target.closest('[data-tk-add]') && tasks.length) { rows.push({ taskId: tasks[0].id, qty: 1 }); draw(); }
    });
    draw();
    return { get: function () { return rows.filter(function (r) { return r.taskId && +r.qty > 0; }).map(function (r) { return { taskId: r.taskId, qty: +r.qty }; }); } };
  }

  function orderScreen(el, params) {
    var st = Esek.state, id = splitQuery(params[0]).id, o = Esek.byId(st.orders, id);
    if (!o) {
      el.innerHTML = S.screenHead({ title: 'התור לא נמצא', back: '#cal', backLabel: 'חזרה ליומן' }) +
        '<div class="card wip"><p>ייתכן שהתור נמחק או שהקישור שגוי.</p></div>';
      return;
    }
    var w = S.workLabel(o), c = Esek.byId(st.customers, o.custId), isAppt = !!o.time;
    var back = o.date ? '#cal/' + o.date : '#cal';
    var src = { mgr: 'נקבע ע"י הרכז.ת', stu: 'נקבע ע"י תלמיד.ה', cust: 'הוזמן ע"י הלקוח.ה' }[o.source] || '';
    var conf = o.status !== 'req' ? Esek.conflicts(o) : [];
    var tags = '<span class="tag ' + (o.status === 'done' ? 'ok' : o.status === 'req' ? '' : 'info') + '">' + esc(OST[o.status] || o.status) + '</span>' +
      (conf.length ? '<span class="tag">' + S.icon('alert') + 'מתנגש עם ' + esc(conf.map(function (x) { return x.time + ' ' + S.workLabel(x).title; }).join(', ')) + '</span>' : '') +
      (src ? '<span class="tag info">' + src + '</span>' : '') +
      (o.reminded ? '<span class="tag ok">' + S.icon('check') + 'נשלחה תזכורת ' + S.fmtDate(o.reminded, { noDay: true }) + '</span>' : '');
    var acts = '';
    if (o.status === 'req') acts = reqButtons(o);
    else {
      if (canRemind(o)) acts += remindBtn(o);
      if (o.status === 'sched' && isAppt) acts += '<button class="btn ok" type="button" data-done>' + S.icon('check') + 'התור בוצע</button>';
    }
    var sub = [c ? esc(c.name) + (c.phone ? ' · ' + S.ltr(c.phone) : '') : 'עבודה פנימית',
      o.date ? S.fmtDate(o.date) + (o.time ? ' ' + S.timeRange(o.time, Esek.apptEnd(o)) : '') : 'בלי מועד'].join(' · ');
    var entries = Esek.entries({ orderId: o.id }).slice().sort(function (a, b) { return (a.date + (a.start || '')) < (b.date + (b.start || '')) ? 1 : -1; });
    var oc = o.custId ? Esek.byId(Esek.state.customers, o.custId) : null;
    var showTasks = !!oc && oc.bill === 'tasks' && o.status !== 'req' && o.status !== 'closed';
    var ctx = function () { return { id: o.id, date: q('[data-o-date]').value, time: q('[data-o-time]').value, minutes: +q('[data-o-min]').value || 0 }; };

    el.innerHTML = S.screenHead({ title: w.title, sub: sub, back: back, backLabel: 'חזרה ליומן' }) +
      '<div class="w-tags w-otags">' + tags + '</div>' +
      (acts ? '<div class="w-row w-oacts">' + acts + '</div>' : '') +
      (o.status === 'sched' && isAppt ? '<p class="w-mut">"התור בוצע" יוצר לכל תלמיד.ה בתור דיווח מוכן לאישור (ממתין לתלמיד.ה) ומוריד חומרים מהמלאי.</p>' : '') +
      '<h2 class="sec-t">פרטי התור</h2><div class="card pad"><div class="form-grid">' +
      '<label class="fld">שירות<select data-o-sv>' + svOptions(o.serviceId, 'בלי שירות') + '</select></label>' +
      '<label class="fld">תאריך<input type="date" data-o-date dir="ltr" value="' + esc(o.date || '') + '"></label>' +
      '<label class="fld">שעה<input type="time" data-o-time dir="ltr" value="' + esc(o.time || '') + '"></label>' +
      '<label class="fld">משך (דקות)<input type="number" data-o-min min="0" step="5" inputmode="numeric" dir="ltr" value="' + esc(o.minutes || 0) + '"></label>' +
      '</div>' +
      (o.status === 'req' ? '<p class="w-mut" style="margin-top:12px">את התלמידים משבצים באישור הבקשה.</p>' : '<h3 class="w-h3">תלמידים בתור</h3><div data-o-stus></div>') +
      '<label class="chk"><input type="checkbox" data-o-bill' + (o.billable ? ' checked' : '') + '>לחיוב הלקוח.ה</label>' +
      '<label class="fld" style="margin-top:8px">הערה<textarea data-o-note rows="2">' + esc(o.note || '') + '</textarea></label>' +
      '<p class="err" data-o-err hidden></p>' +
      '<div class="w-row" style="margin-top:12px"><button class="btn pri" type="button" data-o-save>' + S.icon('check') + 'שמירת השינויים</button></div></div>' +
      (showTasks ? '<h2 class="sec-t">מה בוצע ללקוח</h2><div class="card pad"><div data-o-tasks></div>' +
        '<div class="w-charge" data-o-charge></div>' +
        '<div class="w-row"><button class="btn pri" type="button" data-tk-save>' + S.icon('check') + 'שמירת מה שבוצע</button></div></div>' : '') +
      (oc && !showTasks && o.status !== 'req' ? '<h2 class="sec-t">חיוב ללקוח</h2><div class="card pad"><div class="w-charge"><span class="w-ch-l">חיוב ללקוח.ה</span><div>' + chargeHtml(o, []) + '</div></div></div>' : '') +
      '<h2 class="sec-t">דיווחי השעות של התור (' + S.ltr(entries.length) + ')</h2>' +
      (entries.length ? '<ul class="card w-list">' + entries.map(function (e) {
        var cls = e.status === 'ok' ? 'ok' : e.status === 'no' ? '' : 'info';
        return '<li class="w-rep"><div><b>' + esc(S.stuName(e.stuId)) + '</b><span>' + S.fmtDate(e.date) + ' · ' + (S.timeRange(e.start, e.end) || 'בלי שעות') + '</span></div>' +
          '<div class="w-rep-h">' + S.fmtHours(e.hours) + '</div><div><span class="tag ' + cls + '">' + esc(EST[e.status] || e.status) + '</span></div>' +
          '<a class="btn ghost" href="' + (e.status === 'prep' ? '#hours/prep' : e.status === 'ok' ? '#hours/ok' : '#hours') + '">לדיווח' + S.icon('chevron', 'sm') + '</a></li>';
      }).join('') + '</ul>' : '<div class="card pad w-empty">' + (o.status === 'sched' ? 'הדיווחים ייווצרו כשהתור יסומן "בוצע".' : 'אין דיווחים על התור הזה.') + '</div>');

    function q(s) { return el.querySelector(s); }
    var stuBox = q('[data-o-stus]');
    function drawStus() { if (stuBox) stuBox.innerHTML = stuChecklist(stuBox.innerHTML ? readChecked(stuBox) : (o.stuIds || []), ctx()); }
    drawStus();
    if (stuBox) stuBox.addEventListener('change', drawStus);
    ['[data-o-date]', '[data-o-time]', '[data-o-min]'].forEach(function (s) { q(s).addEventListener('change', drawStus); });
    q('[data-o-sv]').addEventListener('change', function () {
      var sv = Esek.byId(svList(), this.value);
      if (sv) { q('[data-o-min]').value = +sv.minutes || 0; drawStus(); }
    });

    var ted = null;
    if (showTasks) {
      ted = TasksEd(q('[data-o-tasks]'), o, function (rows) { q('[data-o-charge]').innerHTML = '<span class="w-ch-l">חיוב ללקוח.ה</span><div>' + chargeHtml(o, rows) + '</div>'; });
      q('[data-tk-save]').addEventListener('click', function () {
        var cur = Esek.byId(Esek.state.orders, o.id);
        if (!cur) return;
        Esek.setOrderTasks(cur.id, ted.get());
        S.toast('נשמר מה שבוצע ללקוח.ה');
        S.refresh();
      });
    }

    q('[data-o-save]').addEventListener('click', function () {
      var err = q('[data-o-err]'), d = q('[data-o-date]').value, t = q('[data-o-time]').value, mins = +q('[data-o-min]').value || 0;
      var msg = t && !d ? 'שעה בלי תאריך: צריך תאריך.' : isAppt && !t ? 'צריך שעה לתור.' : '';
      err.hidden = !msg; err.textContent = msg;
      if (msg) return;
      var cur = Esek.byId(Esek.state.orders, o.id);
      if (!cur) { S.toast('התור לא נמצא'); return; }
      var svId = q('[data-o-sv]').value || null, sv = Esek.byId(svList(), svId);
      if (svId !== cur.serviceId && sv) {
        cur.typeId = sv.typeId;
        if (cur.custId) cur.title = sv.name + ' – ' + S.custName(cur.custId);
      }
      cur.serviceId = svId;
      cur.date = d; cur.time = t; cur.minutes = mins;
      if (stuBox) cur.stuIds = readChecked(stuBox);
      cur.billable = q('[data-o-bill]').checked;
      cur.note = q('[data-o-note]').value.trim();
      if (cur.status === 'new' && d && t) cur.status = 'sched';
      Esek.save();
      S.toast('השינויים נשמרו');
      S.refresh();
    });

    el.addEventListener('click', function (e) {
      if (!e.target.closest('[data-done]')) return;
      var made = Esek.prepAppt(o.id);
      S.toast(made.length ? 'התור בוצע: נוצרו ' + made.length + ' דיווחים מוכנים לאישור התלמידים' : 'התור סומן כבוצע. לא נוצרו דיווחים (אין תלמידים חדשים בתור).');
      S.refresh();
    });
    bindCommon(el);
    S.hold(true);
  }

  window.CalKit = { stuChecklist: stuChecklist, readChecked: readChecked, reminderModal: reminderModal, isMobile: isMobile };

  Shell.page('cal', { title: 'יומן תורים', render: calScreen });
  Shell.page('appt', {
    title: 'תור חדש', nav: 'cal',
    render: function (el, params) { var p = splitQuery(params[0]); if (p.id !== 'new') return S.go('#appt/new'); apptNew(el, p.q); }
  });
  Shell.page('order', { title: 'תור / הזמנה', nav: 'cal', render: orderScreen });
})();
