/* p-home.js — #home: ציר היום, השרשרת, מה מחכה לך, סיכום החודש, כרטיס לכל פריט בתפריט. */
(function () {
  'use strict';
  var S = Shell, esc = S.esc;

  function toMin(t) { var p = String(t || '0:0').split(':'); return +p[0] * 60 + +p[1]; }
  function fromMin(m) { var h = Math.floor(m / 60), mm = m % 60; return (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm; }
  function firstName(n) { return String(n || '').trim().split(/\s+/)[0]; }
  function plural(n, one, many) { return n === 1 ? one : S.ltr(n) + ' ' + many; }

  // היום, ואם היום סגור: יום הפעילות הבא
  function displayDay(st, today) {
    var days = (st.biz.hours && st.biz.hours.days) || [];
    if (!days.length) return today;
    var d = today;
    for (var i = 0; i < 14; i++) {
      if (days.indexOf(Esek.dayOfWeek(d)) >= 0) return d;
      d = Esek.addDays(d, 1);
    }
    return today;
  }

  function greeting(h) {
    if (h >= 5 && h < 12) return 'בוקר טוב';
    if (h >= 12 && h < 17) return 'צהריים טובים';
    if (h >= 17 && h < 22) return 'ערב טוב';
    return 'לילה טוב';
  }

  function apptInfo(st, o) {
    var w = S.workLabel(o);
    var stus = (o.stuIds || []).map(function (id) { return firstName(S.stuName(id)); }).filter(Boolean).join(', ');
    var cust = S.custName(o.custId);
    return { title: w.title, cust: cust, stus: stus };
  }

  function timeline(st, day, today, now) {
    var h = st.biz.hours || { open: '08:00', close: '16:00' };
    var list = Esek.appts(day);
    var isToday = day === today, nowM = now.getHours() * 60 + now.getMinutes();
    var o0 = toMin(h.open), c0 = toMin(h.close);
    list.forEach(function (o) {
      o0 = Math.min(o0, Math.floor(toMin(o.time) / 60) * 60);
      c0 = Math.max(c0, Math.ceil((toMin(o.time) + (+o.minutes || 30)) / 60) * 60);
    });
    var span = Math.max(60, c0 - o0);
    function pos(m) { return Math.max(0, Math.min(100, (m - o0) * 100 / span)); }

    // מצב כל תור: הסתיים / הקרוב / בהמשך / בקשה
    var upSet = false;
    var items = list.map(function (o) {
      var s = toMin(o.time), e = s + Math.max(+o.minutes || 0, 15);
      var cls;
      if (o.status === 'req') cls = 'req';
      else if (o.status === 'done' || (isToday && e <= nowM) || day < today) cls = 'done';
      else if (!upSet) { cls = 'up'; upSet = true; }
      else cls = 'later';
      return { o: o, s: s, e: e, cls: cls, info: apptInfo(st, o) };
    });
    // מסלולים לתורים חופפים
    var lanes = [];
    items.forEach(function (it) {
      var l = 0;
      while (l < lanes.length && lanes[l] > it.s) l++;
      lanes[l] = it.e;
      it.lane = l;
    });
    var nL = Math.max(1, lanes.length), LH = 58;

    var nAppt = items.filter(function (x) { return x.cls !== 'req'; }).length;
    var nReq = items.length - nAppt;
    var head = isToday ? 'היום' : 'התורים של ' + esc(S.dayName(day)) + ' <bdi dir="ltr" class="num">' + S.fmtDateText(day, { noDay: true }) + '</bdi>';
    var note = '';
    if (!isToday) {
      var td = Esek.dayOfWeek(today), open = (st.biz.hours.days || []).indexOf(td) >= 0;
      note = open ? '' : 'היום ' + esc(S.dayName(today).replace('יום ', '')) + ', העסק סגור';
    }
    var meta = (note ? note + ' · ' : '') + 'תורים: <b class="num">' + nAppt + '</b>' + (nReq ? ' · בקשות: <b class="num">' + nReq + '</b>' : '');

    var hrs = '', gl = '';
    for (var m = o0; m <= o0 + span; m += 60) {
      hrs += '<span style="right:' + pos(m).toFixed(2) + '%"><bdi dir="ltr" class="num">' + fromMin(m) + '</bdi></span>';
      if (m > o0 && m < o0 + span) gl += '<i class="gl" style="right:' + pos(m).toFixed(2) + '%"></i>';
    }
    var past = '', nowM2 = '';
    if (isToday && nowM > o0) past = '<div class="tl-past" style="width:' + pos(nowM).toFixed(2) + '%"></div>';
    if (isToday && nowM >= o0 && nowM <= o0 + span) nowM2 = '<div class="now" style="right:' + pos(nowM).toFixed(2) + '%" data-t="עכשיו ' + fromMin(nowM) + '"></div>';

    var blocks = items.map(function (it) {
      var lbl = it.info.title + (it.info.cust ? ' · ' + it.info.cust : '');
      var sub = it.cls === 'req' ? 'בקשה מלקוח, ממתינה לאישור' : (it.info.cust ? it.info.cust : '') + (it.info.stus ? ' · ' + it.info.stus : '');
      return '<a class="blk ' + it.cls + (it.e - it.s <= 45 ? ' narrow' : '') + '" href="#order/' + esc(it.o.id) + '" title="' + esc(it.o.time + ' ' + lbl) + '" style="right:' + pos(it.s).toFixed(2) +
        '%;width:calc(' + (pos(it.e) - pos(it.s)).toFixed(2) + '% - 3px);top:' + (5 + it.lane * LH) + 'px;height:' + (LH - 6) + 'px">' +
        '<b><bdi dir="ltr" class="num">' + esc(it.o.time) + '</bdi></b><small>' + esc(it.info.title) + (it.e - it.s >= 60 ? ' · ' + esc(sub) : '') + '</small></a>';
    }).join('');

    var lis = items.map(function (it) {
      var sub = it.cls === 'req' ? 'בקשה מלקוח · ממתינה לאישור' : [it.info.cust, it.info.stus].filter(Boolean).join(' · ');
      var state = { done: 'הסתיים', up: 'הקרוב', later: '', req: '' }[it.cls];
      return '<li><a class="' + it.cls + '" href="#order/' + esc(it.o.id) + '"><span class="tm"><bdi dir="ltr">' + esc(it.o.time) + '</bdi></span>' +
        '<span class="lx"><b>' + esc(it.info.title) + (state ? ' <span class="muted">· ' + state + '</span>' : '') + '</b><small>' + esc(sub) + '</small></span>' + S.icon('chevron', 'sm') + '</a></li>';
    }).join('');

    var body = items.length
      ? '<div class="tl-track"><div class="tl-hours">' + hrs + '</div>' +
        '<div class="tl-body" style="height:' + (nL * LH + 4) + 'px">' + gl + past + blocks + nowM2 + '</div></div>' +
        '<div class="tl-legend"><span><i style="background:#fff;border-color:var(--line-2)"></i>הסתיים</span>' +
        '<span><i style="background:var(--petrol);border-color:var(--petrol)"></i>הקרוב</span>' +
        '<span><i style="background:var(--petrol-soft);border-color:#C7D7DB"></i>בהמשך</span>' +
        '<span><i style="background:var(--amber-soft);border:2px dashed var(--amber)"></i>בקשה מלקוח</span></div>' +
        '<ul class="tl-list">' + lis + '</ul>'
      : '<div class="tl-empty">אין תורים ביום הזה. <a href="#cal/' + esc(day) + '">ליומן</a></div>';

    return { nAppt: nAppt, html: '<div class="card tl-card" aria-label="ציר התורים"><div class="tl-h"><h2>' + head + '</h2><span>' + meta + '</span></div>' + body + '</div>' };
  }

  function chain(st, day, today, nAppt, ym, okHours) {
    var prep = Esek.entries({ status: 'prep' });
    var wait = Esek.entries({ status: 'wait' }).length;
    var prepStus = {};
    prep.forEach(function (e) { prepStus[e.stuId] = 1; });
    var nStu = Object.keys(prepStus).length;
    var dayLbl = day === today ? 'תורים היום' : 'תורים ב' + S.dayName(day);
    function step(cls, href, icon, n, l, s) {
      return '<li class="step ' + cls + '"><a href="' + href + '"><div class="dot">' + S.icon(icon) + '</div>' +
        '<div class="step-n num">' + n + '</div><div class="step-l">' + l + '</div><div class="step-s">' + s + '</div></a></li>';
    }
    return '<div class="card chain" aria-label="השרשרת"><div class="chain-h"><h2>השרשרת</h2><span>מהתור ועד השכר והחיוב</span></div><ol class="steps">' +
      step(nAppt ? 'has' : '', '#cal/' + day, 'calendar', nAppt, 'תור', esc(dayLbl)) +
      step(prep.length ? 'has' : '', '#hours/prep', 'file', prep.length, 'דיווח מוכן', 'דיווחים שנוצרו מהתורים') +
      step(nStu ? 'has' : '', '#hours/prep', 'user', nStu, 'אישור תלמיד.ה', 'תלמידים שטרם אישרו') +
      step(wait ? 'you' : '', '#hours', 'check', wait, 'אישור רכז.ת', 'ממתינים לאישורך') +
      step('done', '#reports', 'coin', '<bdi dir="ltr">' + S.fmtNum(okHours) + '</bdi> <small>ש\'</small>', 'שכר וחיוב', 'שעות מאושרות ב' + S.monthName(ym)) +
      '</ol></div>';
  }

  function nextAppt(st, today, now) {
    var nowM = now.getHours() * 60 + now.getMinutes();
    for (var i = 0; i < 21; i++) {
      var d = Esek.addDays(today, i);
      var hit = Esek.appts(d).filter(function (o) {
        return o.status === 'sched' && (d > today || toMin(o.time) >= nowM);
      })[0];
      if (hit) return hit;
    }
    return null;
  }

  function actions(st, today, now) {
    var rows = [];
    function row(icCls, icon, title, sub, btn, href, btnCls) {
      rows.push('<div class="act"><div class="act-ico ' + icCls + '">' + S.icon(icon) + '</div><div class="act-body"><div class="act-title">' + title +
        '</div><div class="act-sub">' + sub + '</div></div><a class="btn ' + (btnCls || 'pri') + '" href="' + href + '">' + btn + '</a></div>');
    }
    var reqs = st.orders.filter(function (o) { return o.status === 'req'; })
      .sort(function (a, b) { return (a.date + a.time) < (b.date + b.time) ? -1 : 1; });
    if (reqs.length) {
      var r0 = reqs[0], w0 = S.workLabel(r0);
      row('', 'chat', reqs.length === 1 ? 'בקשה אחת מלקוח לאישור' : '<span class="n num">' + reqs.length + '</span> בקשות מלקוחות לאישור',
        'הראשונה: ' + esc(w0.title) + ' · ' + esc(w0.sub) + ' · ' + S.fmtDate(r0.date) + ' ' + S.ltr(r0.time), 'לבקשות', '#cal');
    }
    var wait = Esek.entries({ status: 'wait' }).length, prep = Esek.entries({ status: 'prep' }).length;
    if (wait) {
      row('', 'clock', wait === 1 ? 'דיווח אחד לאישורך' : '<span class="n num">' + wait + '</span> דיווחים לאישורך',
        'דיווחי שעות: ' + S.ltr(wait) + ' ממתינים לאישורך' + (prep ? ' · ' + S.ltr(prep) + ' ממתינים לתלמיד.ה' : ''), 'לאישור השעות', '#hours');
    }
    var low = Esek.lowStock();
    if (low.length === 1) {
      var it = low[0];
      row('alert', 'alert', 'מלאי: ' + esc(it.name), 'נשארו <b style="color:var(--amber-2)">' + S.ltr(S.fmtNum(it.qty)) + '</b> ' + esc(it.unit || '') +
        ' (מינימום ' + S.ltr(S.fmtNum(it.min)) + ')', 'למלאי', '#stock', 'warn');
    } else if (low.length > 1) {
      row('alert', 'alert', '<span class="n alert num">' + low.length + '</span> פריטים מתחת למינימום',
        low.map(function (x) { return esc(x.name); }).join(' · '), 'למלאי', '#stock', 'warn');
    }
    var nx = nextAppt(st, today, now);
    if (nx) {
      var inf = apptInfo(st, nx);
      var when = nx.date === today ? '' : ' · ' + S.fmtDate(nx.date);
      row('calm', 'calendar', 'התור הבא ' + S.ltr(nx.time) + ' · ' + esc(inf.title) + when,
        [inf.cust ? 'לקוח.ה: ' + esc(inf.cust) : '', esc(inf.stus)].filter(Boolean).join(' · '), 'ליומן', '#cal/' + nx.date, '');
    }
    return '<h2 class="sec-t">מה מחכה לך היום</h2><div class="card acts-card">' +
      (rows.length ? rows.join('') : '<div class="act-none">אין משימות פתוחות כרגע.</div>') + '</div>';
  }

  function month(st, ym) {
    var r = Esek.monthRange(ym), sm = Esek.summary({ from: r.from, to: r.to });
    var bill = 0;
    st.customers.forEach(function (c) { bill += Esek.custBill2(c.id, r.from, r.to).amount || 0; });
    var pay = 0;
    Esek.payroll2(ym).forEach(function (p) { pay += p.total || 0; });
    var pb = sm.hours ? sm.billable * 100 / sm.hours : 0;
    return {
      hours: sm.hours, pay: pay,
      html: '<h2 class="sec-t">סיכום החודש (' + S.monthName(ym) + ')</h2><div class="card month">' +
        '<div class="m"><h3>שעות מאושרות</h3><div class="big"><bdi dir="ltr" class="num">' + S.fmtNum(sm.hours) + '</bdi></div>' +
        '<div class="bar" role="img" aria-label="' + esc(S.fmtNum(sm.billable) + ' לחיוב, ' + S.fmtNum(sm.nonBillable) + ' לא לחיוב') + '"><i class="a" style="width:' + pb.toFixed(1) + '%"></i><i class="b" style="width:' + (sm.hours ? (100 - pb).toFixed(1) : 0) + '%"></i></div>' +
        '<div class="legend"><span><i style="background:var(--petrol)"></i>לחיוב ' + S.fmtHours(sm.billable, true) + '</span><span><i style="background:var(--petrol-mid)"></i>לא לחיוב ' + S.fmtHours(sm.nonBillable, true) + '</span></div></div>' +
        '<div class="m"><h3>תלמידים שעבדו</h3><div class="big"><bdi dir="ltr" class="num">' + sm.students + '</bdi> <small>מתוך ' + sm.totalStudents + '</small></div>' +
        S.progress(sm.students, sm.totalStudents, 'תלמידים עבדו החודש', 'o') + '</div>' +
        '<div class="m money"><a href="#reports"><span>לחיוב ללקוחות</span><b>' + S.fmtMoney(bill) + '</b></a>' +
        '<a href="#reports"><span>שכר</span><b>' + S.fmtMoney(pay) + '</b></a></div>' +
        '</div>'
    };
  }

  function tiles(st, day, today, nAppt, ym, pay) {
    var reqN = st.orders.filter(function (o) { return o.status === 'req'; }).length;
    var qs = st.quotes || [], sent = qs.filter(function (q) { return q.status === 'sent'; }).length, draft = qs.filter(function (q) { return q.status === 'draft'; }).length;
    var wait = Esek.entries({ status: 'wait' }).length, low = Esek.lowStock().length;
    var can = st.students.filter(function (s) { return s.canBook; }).length;
    var dl = day === today ? 'היום' : 'ב' + S.dayName(day);
    var T = {
      cal: { t: S.ltr(nAppt) + ' תורים ' + esc(dl) + (reqN ? ' · ' + S.ltr(reqN) + ' בקשות' : '') },
      quotes: { t: sent || draft ? [sent ? S.ltr(sent) + ' נשלחו, מחכות לתשובה' : '', draft ? S.ltr(draft) + ' טיוטות' : ''].filter(Boolean).join(' · ') : S.ltr(qs.length) + ' הצעות' },
      hours: { t: wait ? S.ltr(wait) + ' ממתינים לאישורך' : 'אין דיווחים שממתינים לך', w: !!wait },
      reports: { t: 'שכר ' + S.monthName(ym) + ': ' + S.fmtMoney(pay) },
      customers: { t: S.ltr(st.customers.length) + ' לקוחות · ' + S.ltr((st.biz.services || []).length) + ' שירותים' },
      stock: { t: low ? (low === 1 ? 'פריט אחד מתחת למינימום' : S.ltr(low) + ' פריטים מתחת למינימום') : 'כל הפריטים מעל המינימום', w: !!low },
      students: { t: S.ltr(st.students.length) + ' · ' + S.ltr(can) + ' מורשים לקבוע תורים' }
    };
    return '<h2 class="sec-t">כל המסכים</h2><div class="tiles">' + S.menu().filter(function (m) { return m.id !== 'home'; }).map(function (m) {
      var x = T[m.id] || { t: '' };
      return '<a class="card tile" href="#' + m.id + '"><span class="ic">' + S.icon(m.icon) + '</span><span class="tx"><b>' + esc(m.label) + '</b><span' + (x.w ? ' class="w"' : '') + '>' + x.t + '</span></span>' + S.icon('chevron', 'chev') + '</a>';
    }).join('') + '</div>';
  }

  Shell.page('home', {
    title: 'בית',
    render: function (el) {
      var st = Esek.state, now = Esek.now(), today = Esek.today(), ym = S.ym();
      var day = displayDay(st, today);
      var tl = timeline(st, day, today, now);
      var mo = month(st, ym);
      var mgr = firstName(st.biz.manager) || '';
      el.innerHTML =
        '<div class="page-h"><div><h1>' + greeting(now.getHours()) + (mgr ? ', ' + esc(mgr) : '') + '</h1><p>' +
        S.fmtDate(today, { year: true }) + ' · ' + esc(st.biz.name) + '</p></div></div>' +
        tl.html +
        '<div style="height:16px"></div>' +
        chain(st, day, today, tl.nAppt, ym, mo.hours) +
        actions(st, today, now) +
        mo.html +
        tiles(st, day, today, tl.nAppt, ym, mo.pay);
    }
  });
})();
