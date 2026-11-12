/* esek-core.js — מודל, אחסון, חישובים ונתוני דוגמה להדגמת "העסק הבית-ספרי".
   בלי DOM ובלי תלויות. בדפדפן: window.Esek. ב-node: module.exports. */
(function (root) {
  'use strict';

  var KEY = 'esek-demo-v1';

  /* ---------- אחסון (localStorage או זיכרון ב-node) ---------- */
  var mem = {};
  var memStore = {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; },
    setItem: function (k, v) { mem[k] = String(v); },
    removeItem: function (k) { delete mem[k]; }
  };
  function store() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
    } catch (e) { /* חסום */ }
    return memStore;
  }

  /* ---------- תאריכים (מחרוזות מקומיות YYYY-MM-DD; בלי toISOString) ---------- */
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function fmt(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function parse(s) { var p = String(s).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function addDays(s, n) { var d = parse(s); d.setDate(d.getDate() + n); return fmt(d); }
  function dow(s) { return parse(s).getDay(); } // 6 = שבת
  function hhmm(d) { return pad2(d.getHours()) + ':' + pad2(d.getMinutes()); }
  function r2(x) { return Math.round(x * 100) / 100; }

  var Esek = {};
  var _uidN = 0;
  Esek._todayOverride = null;
  Esek.today = function () { return Esek._todayOverride || fmt(new Date()); };
  Esek.fmtDate = fmt;
  Esek.addDays = addDays;
  Esek.dayOfWeek = dow;

  Esek.STATUS = { 'new': 'חדשה', sched: 'נקבע מועד', work: 'בביצוע', done: 'הושלמה', closed: 'נסגרה' };
  Esek.ESTATUS = { wait: 'ממתין לאישור', ok: 'אושר', no: 'נדחה' };

  Esek.uid = function () {
    _uidN++;
    return 'x' + Date.now().toString(36) + _uidN.toString(36) + Math.floor(Math.random() * 1296).toString(36);
  };
  Esek.byId = function (list, id) {
    if (!list) return null;
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  };
  Esek.hoursBetween = function (start, end) {
    if (!start || !end) return 0;
    var a = String(start).split(':'), b = String(end).split(':');
    var m = (+b[0] * 60 + +b[1]) - (+a[0] * 60 + +a[1]);
    return m > 0 ? r2(m / 60) : 0;
  };

  /* ---------- תוספת 1: ברירות מחדל ועזרים ליומן ---------- */
  function defaultServices() {
    return [
      { id: 'sv1', name: 'צילום תדמית', typeId: 't1', minutes: 60, price: 900 },
      { id: 'sv2', name: 'צילום מוצר', typeId: 't1', minutes: 90, price: 600 },
      { id: 'sv3', name: 'סדנת סבונים', typeId: 't4', minutes: 120, price: 1500 },
      { id: 'sv4', name: 'סדנת צילום', typeId: 't4', minutes: 90, price: 1200 },
      { id: 'sv5', name: 'עריכת סרטון', typeId: 't2', minutes: 120, price: 1400 },
      { id: 'sv6', name: 'ייעוץ מיתוג', typeId: 't7', minutes: 45, price: 350 }
    ];
  }
  function defaultHours() { return { days: [0, 1, 2, 3, 4], open: '08:00', close: '16:00' }; }
  function upgradeOrder(o) {
    var ch = false;
    if (o.time === undefined || o.time === null) { o.time = ''; ch = true; }
    if (typeof o.minutes !== 'number') { o.minutes = 0; ch = true; }
    if (o.serviceId === undefined) { o.serviceId = null; ch = true; }
    if (!Array.isArray(o.stuIds)) { o.stuIds = []; ch = true; }
    return ch;
  }
  function toMin(t) { var p = String(t).split(':'); return +p[0] * 60 + +p[1]; }
  function fromMin(m) { m = Math.max(0, Math.min(1439, m)); return pad2(Math.floor(m / 60)) + ':' + pad2(m % 60); }
  function apptEndOf(o) { return o.time ? fromMin(toMin(o.time) + (+o.minutes || 0)) : ''; }
  function hoursCfgOf() { var b = S().biz; return (b && b.hours) || defaultHours(); }
  // חפיפה בדקות; תור בלי משך נחשב דקה אחת
  function overlaps(aS, aE, bS, bE) { return aS < bE && bS < aE; }

  /* ---------- טעינה ושמירה ---------- */
  Esek.state = null;
  function S() { if (!Esek.state) Esek.load(); return Esek.state; }

  function valid(s) {
    return s && s.biz && Array.isArray(s.students) && Array.isArray(s.customers) &&
      Array.isArray(s.orders) && Array.isArray(s.entries) && s.open && typeof s.open === 'object';
  }
  Esek.load = function () {
    var raw = null, s = null;
    try { raw = store().getItem(KEY); } catch (e) { raw = null; }
    if (raw) { try { s = JSON.parse(raw); } catch (e2) { s = null; } }
    if (!valid(s)) { s = Esek.seed(); Esek.state = s; Esek.save(); }
    else {
      // שדרוג מצב ישן (לפני תוספת 1)
      var up = false;
      if (!Array.isArray(s.biz.services)) { s.biz.services = defaultServices(); up = true; }
      if (!s.biz.hours || !Array.isArray(s.biz.hours.days)) { s.biz.hours = defaultHours(); up = true; }
      s.orders.forEach(function (o) { if (upgradeOrder(o)) up = true; });
      Esek.state = s;
      if (up) Esek.save();
    }
    Esek.state = s;
    return s;
  };
  Esek.save = function () {
    try { store().setItem(KEY, JSON.stringify(Esek.state)); } catch (e) { /* מלא/חסום */ }
    return Esek.state;
  };
  Esek.reset = function () {
    Esek.state = Esek.seed();
    Esek.save();
    return Esek.state;
  };

  /* ---------- סינון וחישובים ---------- */
  // בלי status: כל המצבים. דוחות ומונים מעבירים status:'ok'.
  Esek.entries = function (f) {
    f = f || {};
    var st = S(), out = [];
    for (var i = 0; i < st.entries.length; i++) {
      var e = st.entries[i];
      if (f.ym && String(e.date).slice(0, 7) !== f.ym) continue;
      if (f.from && e.date < f.from) continue;
      if (f.to && e.date > f.to) continue;
      if (f.stuId && e.stuId !== f.stuId) continue;
      if (f.orderId && e.orderId !== f.orderId) continue;
      if (f.status && e.status !== f.status) continue;
      if (f.custId) {
        var o = Esek.byId(st.orders, e.orderId);
        if (!o || o.custId !== f.custId) continue;
      }
      out.push(e);
    }
    return out;
  };
  // טהורות: סוכמות את מה שהועבר (לא מסננות לפי מצב)
  Esek.sumHours = function (list) {
    var t = 0;
    for (var i = 0; i < list.length; i++) t += +list[i].hours || 0;
    return r2(t);
  };
  Esek.workDays = function (list) {
    var seen = {}, n = 0;
    for (var i = 0; i < list.length; i++) {
      var k = list[i].stuId + '|' + list[i].date;
      if (!seen[k]) { seen[k] = 1; n++; }
    }
    return n;
  };
  Esek.rateOf = function (entry) {
    var st = S();
    var o = Esek.byId(st.orders, entry.orderId);
    if (o && o.payRate !== null && o.payRate !== undefined && o.payRate !== '') return +o.payRate;
    var s = Esek.byId(st.students, entry.stuId);
    return s ? +s.rate || 0 : 0;
  };
  Esek.alertsOf = function (entry) {
    var out = [], st = S();
    var tot = 0;
    for (var i = 0; i < st.entries.length; i++) {
      var e = st.entries[i];
      if (e.stuId === entry.stuId && e.date === entry.date && e.status !== 'no') tot += +e.hours || 0;
    }
    if (entry.status === 'no') tot = 0;
    if (r2(tot) > 8) out.push('over8');
    if (entry.end && String(entry.end) > '20:00') out.push('late');
    if (dow(entry.date) === 6) out.push('shabbat');
    return out;
  };

  Esek.payroll = function (ym) {
    var st = S(), list = Esek.entries({ ym: ym, status: 'ok' }), by = {}, order = [];
    list.forEach(function (e) {
      if (!by[e.stuId]) { by[e.stuId] = []; order.push(e.stuId); }
      by[e.stuId].push(e);
    });
    var rows = [];
    order.forEach(function (id) {
      var stu = Esek.byId(st.students, id);
      if (!stu) return;
      var es = by[id], rates = {}, total = 0;
      es.forEach(function (e) {
        var r = Esek.rateOf(e);
        rates[r] = (rates[r] || 0) + (+e.hours || 0);
        total += (+e.hours || 0) * r;
      });
      var lines = Object.keys(rates).map(Number).sort(function (a, b) { return a - b; })
        .map(function (r) { return { rate: r, hours: r2(rates[r]) }; });
      rows.push({
        stu: stu, hours: Esek.sumHours(es), days: Esek.workDays(es),
        rate: lines.length === 1 ? lines[0].rate : null, mixed: lines.length > 1,
        total: r2(total), lines: lines
      });
    });
    rows.sort(function (a, b) { return String(a.stu.name).localeCompare(String(b.stu.name), 'he'); });
    return rows;
  };

  Esek.custBill = function (custId, from, to) {
    var st = S(), cust = Esek.byId(st.customers, custId);
    var f = { from: from, to: to, status: 'ok' };
    var all = [], orders = [];
    st.orders.forEach(function (o) {
      if (o.custId !== custId || !o.billable) return;
      var es = Esek.entries({ from: from, to: to, orderId: o.id, status: 'ok' });
      all = all.concat(es);
      orders.push({ order: o, hours: Esek.sumHours(es), days: Esek.workDays(es) });
    });
    void f;
    var hours = Esek.sumHours(all), days = Esek.workDays(all), amount = 0;
    if (cust) {
      if (cust.bill === 'hours' || cust.bill === 'both') amount += hours * (+cust.rateHour || 0);
      if (cust.bill === 'days' || cust.bill === 'both') amount += days * (+cust.rateDay || 0);
    }
    return { cust: cust, hours: hours, days: days, amount: r2(amount), orders: orders };
  };

  Esek.certHours = function (stuId) {
    var st = S(), t = 0;
    Esek.entries({ stuId: stuId, status: 'ok' }).forEach(function (e) {
      var o = Esek.byId(st.orders, e.orderId);
      var ty = o ? Esek.byId(st.biz.types, o.typeId) : null;
      if (ty && ty.pro) t += +e.hours || 0;
    });
    return r2(t);
  };

  Esek.employedByClass = function (ym) {
    var st = S(), act = {}, res = {}, order = [];
    Esek.entries({ ym: ym, status: 'ok' }).forEach(function (e) { act[e.stuId] = 1; });
    st.students.forEach(function (s) {
      if (!res[s.cls]) { res[s.cls] = { cls: s.cls, total: 0, employed: 0, pct: 0 }; order.push(s.cls); }
      res[s.cls].total++;
      if (act[s.id]) res[s.cls].employed++;
    });
    return order.map(function (c) {
      var r = res[c];
      r.pct = r.total ? Math.round(r.employed * 100 / r.total) : 0;
      return r;
    });
  };

  Esek.hoursByType = function (from, to) {
    var st = S();
    return st.biz.types.map(function (ty) {
      var hours = 0, bill = 0, non = 0, cost = 0, orders = {}, n = 0;
      Esek.entries({ from: from, to: to, status: 'ok' }).forEach(function (e) {
        var o = Esek.byId(st.orders, e.orderId);
        if (!o || o.typeId !== ty.id) return;
        var h = +e.hours || 0;
        hours += h;
        if (o.billable) bill += h; else non += h;
        cost += h * Esek.rateOf(e);
        if (!orders[o.id]) { orders[o.id] = 1; n++; }
      });
      return {
        type: ty, hours: r2(hours), billable: r2(bill), nonBillable: r2(non), orders: n,
        avgPerOrder: n ? r2(hours / n) : 0, cost: r2(cost)
      };
    });
  };

  Esek.comparePeriods = function (a, b) {
    var st = S();
    function one(p) {
      var es = Esek.entries({ from: p.from, to: p.to, status: 'ok' });
      var bill = 0, stus = {}, ords = {}, ns = 0, no = 0;
      es.forEach(function (e) {
        var o = Esek.byId(st.orders, e.orderId);
        if (o && o.billable) bill += +e.hours || 0;
        if (!stus[e.stuId]) { stus[e.stuId] = 1; ns++; }
        if (!ords[e.orderId]) { ords[e.orderId] = 1; no++; }
      });
      return { hours: Esek.sumHours(es), billable: r2(bill), days: Esek.workDays(es), students: ns, orders: no };
    }
    return { a: one(a), b: one(b) };
  };

  Esek.missing = function (ym) {
    var act = {};
    Esek.entries({ ym: ym }).forEach(function (e) { act[e.stuId] = 1; });
    return S().students.filter(function (s) { return !act[s.id]; });
  };

  /* ---------- כתיבה ---------- */
  Esek.clockIn = function (stuId, orderId) {
    var st = S();
    st.open[stuId] = { orderId: orderId, startISO: new Date().toISOString() };
    Esek.save();
    return st.open[stuId];
  };
  Esek.clockOut = function (stuId) {
    var st = S(), op = st.open[stuId];
    if (!op) return null;
    var s = new Date(op.startISO), n = new Date();
    var hours = r2(Math.max(0, (n.getTime() - s.getTime()) / 3600000));
    var e = { id: Esek.uid(), stuId: stuId, orderId: op.orderId, date: fmt(s), start: null, end: null,
      hours: hours, by: 'stu', status: 'wait', note: '' };
    if (fmt(s) === fmt(n)) { e.start = hhmm(s); e.end = hhmm(n); }
    st.entries.push(e);
    delete st.open[stuId];
    Esek.save();
    return e;
  };
  Esek.addEntry = function (obj) {
    var st = S(), e = {};
    for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k)) e[k] = obj[k];
    e.id = e.id || Esek.uid();
    e.by = e.by === 'stu' ? 'stu' : 'mgr';
    e.status = e.by === 'mgr' ? 'ok' : 'wait';
    e.start = e.start || null;
    e.end = e.end || null;
    if (e.start && e.end) e.hours = Esek.hoursBetween(e.start, e.end);
    e.hours = r2(+e.hours || 0);
    e.note = e.note || '';
    st.entries.push(e);
    Esek.save();
    return e;
  };
  Esek.setEntryStatus = function (id, status) {
    var e = Esek.byId(S().entries, id);
    if (!e) return null;
    e.status = status;
    Esek.save();
    return e;
  };

  /* ---------- יומן תורים ---------- */
  Esek.appts = function (date) {
    return S().orders.filter(function (o) { return o.date === date && o.time && o.status !== 'closed'; })
      .sort(function (a, b) { return a.time < b.time ? -1 : a.time > b.time ? 1 : (a.id < b.id ? -1 : 1); });
  };
  Esek.apptEnd = function (order) { return apptEndOf(order); };
  Esek.conflicts = function (order) {
    if (!order || !order.time || !order.date) return [];
    var s1 = toMin(order.time), e1 = Math.max(toMin(apptEndOf(order)), s1 + 1);
    var mine = order.stuIds || [];
    return Esek.appts(order.date).filter(function (o) {
      if (o.id === order.id) return false;
      var s2 = toMin(o.time), e2 = Math.max(toMin(apptEndOf(o)), s2 + 1);
      if (!overlaps(s1, e1, s2, e2)) return false;
      return (o.stuIds || []).some(function (x) { return mine.indexOf(x) >= 0; });
    });
  };
  Esek.slots = function (date, minutes) {
    var h = hoursCfgOf();
    if (h.days.indexOf(dow(date)) < 0) return [];
    var len = +minutes || 30, list = Esek.appts(date), out = [];
    for (var t = toMin(h.open); t < toMin(h.close); t += 30) {
      var busy = 0;
      list.forEach(function (o) {
        var s2 = toMin(o.time), e2 = Math.max(toMin(apptEndOf(o)), s2 + 1);
        if (overlaps(t, t + len, s2, e2)) busy++;
      });
      out.push({ time: fromMin(t), busy: busy });
    }
    return out;
  };
  Esek.logAppt = function (orderId) {
    var st = S(), o = Esek.byId(st.orders, orderId), made = [];
    if (!o || !o.time) return made;
    (o.stuIds || []).forEach(function (sid) {
      var has = st.entries.some(function (e) { return e.stuId === sid && e.orderId === o.id && e.date === o.date; });
      if (!has) made.push(Esek.addEntry({ stuId: sid, orderId: o.id, date: o.date, start: o.time, end: apptEndOf(o), by: 'mgr', note: 'מתור' }));
    });
    o.status = 'done';
    Esek.save();
    return made;
  };

  /* ---------- תוספת 2: סיכום שעות עם חתכים ---------- */
  Esek.weekRange = function (date) {
    var from = addDays(date, -dow(date));
    return { from: from, to: addDays(from, 6) };
  };
  Esek.monthRange = function (ym) {
    var p = String(ym).split('-'), y = +p[0], m = +p[1];
    return { from: ym + '-01', to: ym + '-' + pad2(new Date(y, m, 0).getDate()) };
  };
  Esek.summary = function (opt) {
    opt = opt || {};
    var st = S();
    var list = [];
    Esek.entries({ from: opt.from, to: opt.to, status: 'ok' }).forEach(function (e) {
      var o = Esek.byId(st.orders, e.orderId);
      if (opt.custId !== undefined && opt.custId !== null && opt.custId !== '') {
        var oc = o ? o.custId : null;
        if (opt.custId === 'internal') { if (oc) return; }
        else if (oc !== opt.custId) return;
      }
      var bl = !!(o && o.billable);
      if (opt.bill === true && !bl) return;
      if (opt.bill === false && bl) return;
      list.push({ e: e, o: o, bl: bl, h: +e.hours || 0 });
    });

    function keyOf(kind, x) {
      var e = x.e, o = x.o;
      if (kind === 'cust') {
        if (!o || !o.custId) return { key: 'internal', label: 'עבודה פנימית' };
        var c = Esek.byId(st.customers, o.custId);
        return { key: o.custId, label: c ? c.name : o.custId };
      }
      if (kind === 'stu') {
        var s = Esek.byId(st.students, e.stuId);
        return { key: e.stuId, label: s ? s.name : e.stuId };
      }
      if (kind === 'order') return { key: e.orderId, label: o ? o.title : e.orderId };
      if (kind === 'type') {
        var ty = o ? Esek.byId(st.biz.types, o.typeId) : null;
        return { key: o ? o.typeId : '', label: ty ? ty.name : '' };
      }
      return { key: e.date, label: e.date };
    }
    function stats(items) {
      var b = 0, n = 0, stus = {}, sd = {}, ns = 0, nd = 0;
      items.forEach(function (x) {
        if (x.bl) b += x.h; else n += x.h;
        if (!stus[x.e.stuId]) { stus[x.e.stuId] = 1; ns++; }
        var k = x.e.stuId + '|' + x.e.date;
        if (!sd[k]) { sd[k] = 1; nd++; }
      });
      return { hours: r2(b + n), billable: r2(b), nonBillable: r2(n), students: ns, days: nd };
    }
    function group(items, kind) {
      var map = {}, order = [];
      items.forEach(function (x) {
        var k = keyOf(kind, x);
        if (!map[k.key]) { map[k.key] = { key: k.key, label: k.label, items: [] }; order.push(k.key); }
        map[k.key].items.push(x);
      });
      var gs = order.map(function (k) { return map[k]; });
      gs.sort(function (a, b) {
        if (kind === 'date') return a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
        var d = stats(b.items).hours - stats(a.items).hours;
        return d || String(a.label).localeCompare(String(b.label), 'he');
      });
      return gs;
    }

    var tot = stats(list);
    var res = { hours: tot.hours, billable: tot.billable, nonBillable: tot.nonBillable, students: tot.students,
      totalStudents: st.students.length, days: tot.days, byDay: [], groups: [] };

    // byDay: כל יום בטווח, כולל אפסים
    var from = opt.from, to = opt.to;
    if ((!from || !to) && list.length) {
      var ds = list.map(function (x) { return x.e.date; }).sort();
      from = from || ds[0]; to = to || ds[ds.length - 1];
    }
    if (from && to) {
      var perDay = {};
      list.forEach(function (x) {
        var p = perDay[x.e.date] || (perDay[x.e.date] = { b: 0, n: 0 });
        if (x.bl) p.b += x.h; else p.n += x.h;
      });
      for (var d = from; d <= to; d = addDays(d, 1)) {
        var p2 = perDay[d] || { b: 0, n: 0 };
        res.byDay.push({ date: d, billable: r2(p2.b), nonBillable: r2(p2.n) });
      }
    }

    if (opt.by) {
      res.groups = group(list, opt.by).map(function (g) {
        var s = stats(g.items);
        return { key: g.key, label: g.label, hours: s.hours, billable: s.billable, nonBillable: s.nonBillable,
          students: s.students, days: s.days,
          children: opt.then ? group(g.items, opt.then).map(function (c) {
            var cs2 = stats(c.items);
            return { key: c.key, label: c.label, hours: cs2.hours, billable: cs2.billable, nonBillable: cs2.nonBillable,
              students: cs2.students, days: cs2.days };
          }) : [] };
      });
    }
    return res;
  };

  Esek.toCSV = function (rows, cols) {
    rows = rows || [];
    if (!cols || !cols.length) {
      var f = rows[0];
      cols = !f ? [] : (Array.isArray(f) ? f.map(function (_, i) { return String(i); }) : Object.keys(f));
    }
    var cs = cols.map(function (c, i) {
      return (c && typeof c === 'object') ? { key: c.key, label: c.label !== undefined ? c.label : c.key } : { key: c, label: c, idx: i };
    });
    function q(v) {
      if (v === null || v === undefined) v = '';
      return '"' + String(v).replace(/"/g, '""') + '"';
    }
    var lines = [cs.map(function (c) { return q(c.label); }).join(',')];
    rows.forEach(function (r) {
      lines.push(cs.map(function (c, i) {
        return q(Array.isArray(r) ? r[i] : r[c.key]);
      }).join(','));
    });
    return '﻿' + lines.join('\r\n');
  };

  /* ---------- נתוני דוגמה (דטרמיניסטי; תאריכים יחסית להיום) ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  Esek.seed = function () {
    var rnd = mulberry32(20261111);
    function pick(a) { return a[Math.floor(rnd() * a.length)]; }
    var today = Esek.today();
    var td = parse(today);
    var ymNow = today.slice(0, 7);
    var curStart = ymNow + '-01';
    var prevStart = fmt(new Date(td.getFullYear(), td.getMonth() - 1, 1));
    var winStart = fmt(new Date(td.getFullYear(), td.getMonth() - 2, 1));

    var types = [
      { id: 't1', name: 'צילום אירוע', pro: true },
      { id: 't2', name: 'עריכה', pro: true },
      { id: 't3', name: 'ייצור סבונים', pro: true },
      { id: 't4', name: 'סדנה ללקוח', pro: true },
      { id: 't5', name: 'אריזה ומשלוח', pro: false },
      { id: 't6', name: 'פיתוח מוצר', pro: true },
      { id: 't7', name: 'שיווק', pro: false },
      { id: 't8', name: 'למידה והכשרה', pro: false }
    ];
    var names = [
      ['נועם ברק', 'יא', 'צילום', 34, '4821'], ['יסמין חסן', 'יא', 'סבונים', 36, '7305'],
      ['אורי לביא', 'יא', 'צילום', 32, '1593'], ['מיראל נאסר', 'יא', 'סדנאות', 35, '6047'],
      ['איתן שגב', 'יא', 'סבונים', 33, '2918'], ['לינה זועבי', 'יא', 'שיווק', 38, '8264'],
      ['דניאל רוזן', 'יא', 'צילום', 32, '3750'], ['עומר חדאד', 'יא', 'סבונים', 34, '9136'],
      ['שיר אלון', 'יב', 'סדנאות', 40, '5482'], ['ג׳אד מנסור', 'יב', 'צילום', 38, '0679'],
      ['תמר בן-דוד', 'יב', 'סבונים', 40, '3315'], ['אמיר ח׳ורי', 'יב', 'שיווק', 37, '7842'],
      ['ליאן מזרחי', 'יב', 'סדנאות', 36, '2206'], ['רועי פרידמן', 'יב', 'צילום', 39, '6951']
    ];
    var students = names.map(function (n, i) {
      return { id: 's' + (i + 1), name: n[0], cls: n[1], grp: n[2], rate: n[3], pin: n[4] };
    });
    var customers = [
      { id: 'c1', name: 'אלפא אירועים בע"מ', contact: 'הדס גולן', phone: '050-5550101', bill: 'both', rateHour: 120, rateDay: 350, note: 'חברה גדולה, חשבונית חודשית' },
      { id: 'c2', name: 'עיריית עמק הדוגמה', contact: 'יוסי אברהם', phone: '04-5550102', bill: 'hours', rateHour: 110, rateDay: 0, note: 'דרושה הזמנת רכש' },
      { id: 'c3', name: 'עמותת יד לקהילה', contact: 'רות שלום', phone: '052-5550103', bill: 'hours', rateHour: 90, rateDay: 0, note: '' },
      { id: 'c4', name: 'מיכל ברנע', contact: 'מיכל ברנע', phone: '054-5550104', bill: 'hours', rateHour: 100, rateDay: 0, note: 'לקוחה פרטית' },
      { id: 'c5', name: 'רשת חנויות שוק פתוח', contact: 'אלון דהן', phone: '053-5550105', bill: 'days', rateHour: 0, rateDay: 400, note: 'חיוב ליום-תלמיד' },
      { id: 'c6', name: 'אבי שחר', contact: 'אבי שחר', phone: '058-5550106', bill: 'hours', rateHour: 95, rateDay: 0, note: 'לקוח פרטי' }
    ];
    function od(n) { return addDays(today, n); }
    var orders = [
      { id: 'o1', custId: 'c1', title: 'צילום חנוכת משרדים', typeId: 't1', date: od(-70), billable: true, status: 'closed', payRate: null, note: '' },
      { id: 'o2', custId: 'c2', title: 'עריכת סרטון תדמית', typeId: 't2', date: od(-62), billable: true, status: 'closed', payRate: null, note: '' },
      { id: 'o3', custId: 'c1', title: 'סדנת סבונים לעובדים', typeId: 't4', date: od(-35), billable: true, status: 'done', payRate: null, note: '' },
      { id: 'o4', custId: 'c3', title: 'סדנת סבון לילדים', typeId: 't4', date: od(-28), billable: true, status: 'done', payRate: null, note: '' },
      { id: 'o5', custId: 'c1', title: 'צילום מוצרים לקטלוג', typeId: 't1', date: od(5), billable: true, status: 'work', payRate: null, note: '' },
      { id: 'o6', custId: 'c4', title: 'ייצור 300 סבוני מתנה', typeId: 't3', date: od(10), billable: true, status: 'work', payRate: null, note: '' },
      { id: 'o7', custId: 'c2', title: 'עריכת אלבום יום המעשים הטובים', typeId: 't2', date: od(7), billable: true, status: 'work', payRate: 42, note: 'תעריף מוגדל להזמנה' },
      { id: 'o8', custId: 'c3', title: 'סדנה לנוער בקהילה', typeId: 't4', date: od(14), billable: false, status: 'sched', payRate: null, note: 'תרומה לקהילה' },
      { id: 'o9', custId: 'c5', title: 'אריזת מארזי חג', typeId: 't5', date: od(12), billable: true, status: 'sched', payRate: null, note: '' },
      { id: 'o10', custId: 'c6', title: 'מארזי סבון לחתונה', typeId: 't3', date: '', billable: true, status: 'new', payRate: null, note: 'ממתינים לאישור הצעה' },
      { id: 'o11', custId: 'c5', title: 'מארזי חג לרשת', typeId: 't5', date: od(3), billable: true, status: 'work', payRate: null, note: '' },
      { id: 'o12', custId: null, title: 'מלאי סבונים שוטף', typeId: 't3', date: '', billable: false, status: 'work', payRate: null, note: 'עבודה פנימית' },
      { id: 'o13', custId: null, title: 'פיתוח אריזה חדשה', typeId: 't6', date: '', billable: false, status: 'work', payRate: null, note: 'עבודה פנימית' },
      { id: 'o14', custId: null, title: 'למידה והכשרה', typeId: 't8', date: '', billable: false, status: 'work', payRate: null, note: 'עבודה פנימית' }
    ];

    /* דיווחים */
    var entries = [], en = 0;
    function mk(stuId, orderId, date, start, hours, by, status, note) {
      var end = null;
      if (start) {
        var p = start.split(':'), m = +p[0] * 60 + +p[1] + Math.round(hours * 60);
        end = pad2(Math.floor(m / 60)) + ':' + pad2(m % 60);
      }
      en++;
      return { id: 'e' + en, stuId: stuId, orderId: orderId, date: date, start: start || null, end: end,
        hours: hours, by: by, status: status, note: note || '' };
    }
    function clearDay(stuId, date) {
      entries = entries.filter(function (e) { return !(e.stuId === stuId && e.date === date); });
    }
    var hopts = [1.5, 2, 2.5, 3, 3.5, 4, 4.5];
    var workDaysCur = [];
    for (var d = winStart; d <= today; d = addDays(d, 1)) {
      var wd = dow(d);
      if (wd === 6) continue;
      if (d >= curStart) workDaysCur.push(d);
      if (wd === 5 && rnd() > 0.3) continue;
      var k = wd === 5 ? 1 : 2 + (rnd() < 0.5 ? 1 : 0) - (rnd() < 0.2 ? 1 : 0);
      var inCur = d >= curStart;
      var elig = students.filter(function (s) { return !(inCur && (s.id === 's13' || s.id === 's14')); });
      var pool = ['o5', 'o6', 'o7', 'o11', 'o12', 'o13', 'o14'];
      if (d < prevStart) pool.push('o1', 'o2', 'o3', 'o4');
      else if (d < curStart) pool.push('o3', 'o4');
      var chosen = [];
      while (chosen.length < k) {
        var s = pick(elig);
        if (chosen.indexOf(s.id) < 0) chosen.push(s.id);
      }
      chosen.forEach(function (sid) {
        var hours = pick(hopts), oid = pick(pool);
        if (rnd() < 0.15) entries.push(mk(sid, oid, d, null, hours, 'mgr', 'ok', ''));
        else entries.push(mk(sid, oid, d, pad2(8 + Math.floor(rnd() * 7)) + ':' + (rnd() < 0.5 ? '00' : '30'), hours, 'stu', 'ok', ''));
      });
    }
    if (!workDaysCur.length) workDaysCur.push(today);
    var lastDay = workDaysCur[workDaysCur.length - 1];
    var lateDay = workDaysCur[Math.max(0, workDaysCur.length - 3)];

    // כל תלמיד.ה פרט ל-2 האחרונים עובד.ת בחודש הנוכחי; ושתי עבודות בתעריף מוגדל (o7)
    var firstDay = workDaysCur[0];
    students.forEach(function (s) {
      if (s.id === 's13' || s.id === 's14') return;
      var has = entries.some(function (e) { return e.stuId === s.id && e.date >= curStart; });
      if (!has) entries.push(mk(s.id, pick(['o5', 'o6', 'o12', 'o13']), firstDay, null, pick(hopts), 'mgr', 'ok', ''));
    });
    ['s1', 's6'].forEach(function (sid) {
      entries.push(mk(sid, 'o7', firstDay, null, 2, 'mgr', 'ok', 'עריכה בתעריף מוגדל'));
    });
    // יום עם מעל 8 שעות (שני דיווחים ממתינים)
    clearDay('s2', lastDay);
    var special = {};
    var a1 = mk('s2', 'o12', lastDay, '09:00', 5, 'stu', 'wait', ''); entries.push(a1);
    var a2 = mk('s2', 'o14', lastDay, '14:30', 4, 'stu', 'wait', ''); entries.push(a2);
    special[a1.id] = special[a2.id] = 1;
    // דיווח אחרי 20:00
    clearDay('s4', lateDay);
    var lt = mk('s4', 'o6', lateDay, '16:00', 4.5, 'stu', 'ok', 'ייצור לקראת משלוח'); entries.push(lt); special[lt.id] = 1;
    // שבת אחת בכוונה (חודש קודם)
    var sat = addDays(today, -21);
    while (dow(sat) !== 6) sat = addDays(sat, -1);
    if (sat >= winStart) {
      var sh = mk('s3', 'o12', sat, '10:00', 3, 'stu', 'ok', 'דיווח בשבת (דוגמה להתרעה)');
      entries.push(sh); special[sh.id] = 1;
    }
    // ממתינים + נדחה בחודש הנוכחי
    entries.sort(function (x, y) { return x.date < y.date ? -1 : x.date > y.date ? 1 : (x.start || '') < (y.start || '') ? -1 : 1; });
    var cand = entries.filter(function (e) { return e.date >= curStart && e.by === 'stu' && e.status === 'ok' && !special[e.id]; });
    var waits = cand.slice(Math.max(0, cand.length - 6));
    waits.forEach(function (e) { e.status = 'wait'; });
    var rest = cand.filter(function (e) { return waits.indexOf(e) < 0; });
    if (rest.length) { rest[0].status = 'no'; rest[0].note = 'שעות לא תואמות להזמנה'; }
    entries.forEach(function (e, i) { e.id = 'e' + (i + 1); });

    /* תורים (תוספת 1) — לא צורכים את מחולל האקראי */
    orders.forEach(upgradeOrder);
    var hoursCfg = defaultHours();
    var activeDays = hoursCfg.days;
    function isActive(ds) { return activeDays.indexOf(dow(ds)) >= 0; }
    var todayAct = today;
    while (!isActive(todayAct)) todayAct = addDays(todayAct, 1);
    var yAct = addDays(today, -1);
    while (!isActive(yAct)) yAct = addDays(yAct, -1);
    var fut = [];
    for (var fi = 1; fi <= 7; fi++) {
      var fd = addDays(today, fi);
      if (isActive(fd) && fd !== todayAct) fut.push(fd);
    }
    if (!fut.length) fut.push(addDays(todayAct, 1));
    function fday(i) { return fut[Math.min(i, fut.length - 1)]; }
    var svs = defaultServices();
    function appt(n, svId, custId, date, time, stuIds, status) {
      var sv = Esek.byId(svs, svId), c = Esek.byId(customers, custId);
      orders.push({ id: 'o' + n, custId: custId, title: sv.name + ' – ' + c.name, typeId: sv.typeId, date: date,
        time: time, minutes: sv.minutes, serviceId: svId, stuIds: stuIds, billable: true, status: status, payRate: null, note: '' });
    }
    appt(15, 'sv1', 'c1', yAct, '09:00', ['s1'], 'done');
    appt(16, 'sv6', 'c4', yAct, '13:00', ['s6'], 'sched');
    appt(17, 'sv2', 'c1', todayAct, '09:00', ['s3'], 'sched');
    appt(18, 'sv4', 'c3', todayAct, '10:30', ['s7', 's8'], 'sched');
    appt(19, 'sv3', 'c4', todayAct, '13:00', ['s5'], 'sched');
    appt(20, 'sv5', 'c2', fday(0), '09:00', ['s2'], 'sched');
    appt(21, 'sv1', 'c6', fday(2), '11:00', ['s7'], 'sched');
    appt(22, 'sv2', 'c1', fday(1), '10:00', ['s1'], 'sched');
    appt(23, 'sv6', 'c3', fday(1), '11:00', ['s1', 's3'], 'sched');
    appt(24, 'sv3', 'c5', fday(3), '13:00', ['s8', 's2'], 'sched');
    // התור שבוצע אתמול: דיווח ok שנרשם ממנו
    var dn = Esek.byId(orders, 'o15');
    entries.push({ id: 'e' + (entries.length + 1), stuId: 's1', orderId: 'o15', date: yAct, start: dn.time,
      end: apptEndOf(dn), hours: r2(dn.minutes / 60), by: 'mgr', status: 'ok', note: 'מתור' });

    var open = {};
    open.s5 = { orderId: 'o6', startISO: new Date(Date.now() - 95 * 60000).toISOString() };

    return {
      biz: { name: 'סטודיו סבון וצילום', school: 'בית ספר לדוגמה', manager: 'דנה (הדגמה)', types: types,
        services: svs, hours: hoursCfg },
      students: students, customers: customers, orders: orders, entries: entries, open: open
    };
  };

  // עזר להדגמה: 3 קודי כניסה לדוגמה (תלמידים בלי שעון פתוח)
  Esek.demoPins = function () {
    var st = S();
    return st.students.filter(function (s) { return !st.open[s.id] && s.id !== 's13' && s.id !== 's14'; })
      .slice(0, 3).map(function (s) { return { id: s.id, name: s.name, pin: s.pin }; });
  };

  Esek.load();

  if (typeof module !== 'undefined' && module.exports) module.exports = Esek;
  root.Esek = Esek;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
