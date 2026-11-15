/* esek-core.js — מודל, אחסון, חישובים ונתוני דוגמה להדגמת "העסק הבית-ספרי".
   בלי DOM ובלי תלויות. בדפדפן: window.Esek. ב-node: module.exports. */
(function (root) {
  'use strict';

  var KEY = 'esek-demo-v1';
  var KEY2 = 'esek-demo-v2';
  var v2mode = false;
  /* גרסה 2 (תוספות בסוף הקובץ), בקצרה:
     - מסלול v1 (load/save/reset/seed, מפתח esek-demo-v1) לא השתנה. מסלול v2: Esek.load2 / reset2 / seed2,
       מפתח esek-demo-v2 דרך Esek.store = {get(), set(state)}.
     - Esek.useStore(adapter) מחליף מתאם (למשל שרת) ועובר למצב v2; Esek.setState(s) מחליף את המצב בזיכרון
       בלי לכתוב אותו חזרה (למשל אחרי load מהשרת). במצב v2 גם Esek.save הישן כותב דרך המתאם.
     - Esek.now = () => new Date() הוא השעון של כל לוגיקת התאריכים החדשה (בדיקות מחליפות אותו). */

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
  Esek.now = function () { return new Date(); }; // שעון מוזרק: בבדיקות מחליפים
  Esek.today = function () { return Esek._todayOverride || fmt(Esek.now()); };
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
    if (v2mode) { try { Esek.store.set(Esek.state); } catch (e0) { /* מתאם נכשל */ } return Esek.state; }
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
    if (!o || !o.time || o.status === 'req') return made;
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

  /* =====================================================================
     גרסה 2: אחסון דרך מתאם, שכר לפי משימות, חיוב, תורים ובקשות, מלאי, הצעות, תזכורת
     ===================================================================== */

  /* ---------- אחסון v2 ---------- */
  Esek.store = {
    get: function () {
      var raw = null;
      try { raw = store().getItem(KEY2); } catch (e) { raw = null; }
      if (!raw) return null;
      try { return JSON.parse(raw); } catch (e2) { return null; }
    },
    set: function (state) {
      try { store().setItem(KEY2, JSON.stringify(state)); } catch (e) { /* מלא/חסום */ }
    }
  };
  Esek.useStore = function (adapter) {
    if (adapter && typeof adapter.get === 'function' && typeof adapter.set === 'function') Esek.store = adapter;
    v2mode = true;
    return Esek.store;
  };
  function upgrade2(s) {
    if (!s.biz.tasks) s.biz.tasks = [];
    if (!s.biz.services) s.biz.services = [];
    if (!s.biz.hours) s.biz.hours = defaultHours();
    if (!s.stock) s.stock = { items: [], moves: [] };
    if (!s.quotes) s.quotes = [];
    s.orders.forEach(function (o) { upgradeOrder(o); });
    return s;
  }
  function valid2(s) { return valid(s) && s.stock && Array.isArray(s.stock.items) && Array.isArray(s.quotes); }
  Esek.setState = function (s) {
    v2mode = true;
    Esek.state = valid(s) ? upgrade2(s) : s;
    return Esek.state;
  };
  Esek.load2 = function () {
    v2mode = true;
    var s = null;
    try { s = Esek.store.get(); } catch (e) { s = null; }
    if (!valid2(s)) { Esek.state = Esek.seed2(); Esek.save(); }
    else Esek.state = upgrade2(s);
    return Esek.state;
  };
  Esek.reset2 = function () {
    v2mode = true;
    Esek.state = Esek.seed2();
    Esek.save();
    return Esek.state;
  };

  /* ---------- עזרים ---------- */
  function normPhone(p) {
    var d = String(p || '').replace(/\D/g, '');
    if (d.indexOf('972') === 0) d = '0' + d.slice(3);
    return d;
  }
  Esek.normPhone = normPhone;
  function waPhone(p) {
    var d = normPhone(p);
    return d.charAt(0) === '0' ? '972' + d.slice(1) : d;
  }
  function svOf(id) { return Esek.byId(S().biz.services, id); }
  function splitSumOf(split) {
    var t = 0;
    (split || []).forEach(function (x) { t += +x.hours || 0; });
    return r2(t);
  }
  Esek.splitSum = function (entry) { return splitSumOf(entry && entry.split); };
  Esek.splitOver = function (entry) { return splitSumOf(entry.split) > r2(+entry.hours || 0) + 0.005; };
  function fixSplit(e) { if (e.split && Esek.splitOver(e)) e.split = []; }
  function splitFromService(sv) {
    return ((sv && sv.split) || []).map(function (x) { return { taskId: x.taskId, hours: r2((+x.minutes || 0) / 60) }; });
  }
  function endDate(o) {
    var p = parse(o.date), m = toMin(o.time) + (+o.minutes || 0);
    p.setHours(Math.floor(m / 60), m % 60, 0, 0);
    return p;
  }

  /* ---------- שכר לפי משימות ---------- */
  // תעריף רגיל: entry.rate (עקיפה ידנית, bulk 'rate') ואז order.payRate ואז student.rate
  Esek.rateOf2 = function (entry) {
    if (entry.rate !== null && entry.rate !== undefined && entry.rate !== '') return +entry.rate;
    return Esek.rateOf(entry);
  };
  Esek.payOf = function (entry) {
    var st = S(), normal = Esek.rateOf2(entry), hours = +entry.hours || 0;
    var over = Esek.splitOver(entry), lines = [], used = 0, idx = {};
    if (!over) {
      (entry.split || []).forEach(function (x) {
        var t = Esek.byId(st.biz.tasks, x.taskId), h = +x.hours || 0;
        if (!t || h <= 0) return;
        if (idx[t.id] === undefined) { idx[t.id] = lines.length; lines.push({ taskId: t.id, rate: +t.rate || 0, hours: 0 }); }
        lines[idx[t.id]].hours = r2(lines[idx[t.id]].hours + h);
        used += h;
      });
    }
    var rest = r2(hours - used);
    if (rest > 0) lines.push({ taskId: null, rate: normal, hours: rest });
    var total = 0;
    lines.forEach(function (l) { total += l.hours * l.rate; });
    return { total: r2(total), lines: lines, over: over };
  };
  Esek.payroll2 = function (ym) {
    var st = S(), by = {}, order = [], rows = [];
    Esek.entries({ ym: ym, status: 'ok' }).forEach(function (e) {
      if (!by[e.stuId]) { by[e.stuId] = []; order.push(e.stuId); }
      by[e.stuId].push(e);
    });
    order.forEach(function (id) {
      var stu = Esek.byId(st.students, id);
      if (!stu) return;
      var es = by[id], map = {}, keys = [], total = 0, overN = 0;
      es.forEach(function (e) {
        var p = Esek.payOf(e);
        if (p.over) overN++;
        total += p.total;
        p.lines.forEach(function (l) {
          var k = (l.taskId || '') + '|' + l.rate;
          if (!map[k]) { var t = l.taskId ? Esek.byId(st.biz.tasks, l.taskId) : null;
            map[k] = { taskId: l.taskId, task: t ? t.name : null, rate: l.rate, hours: 0, amount: 0 }; keys.push(k); }
          map[k].hours = r2(map[k].hours + l.hours);
          map[k].amount = r2(map[k].amount + l.hours * l.rate);
        });
      });
      var lines = keys.map(function (k) { return map[k]; }).sort(function (a, b) {
        if (!a.taskId !== !b.taskId) return a.taskId ? 1 : -1;
        return String(a.task || '').localeCompare(String(b.task || ''), 'he') || a.rate - b.rate;
      });
      rows.push({ stu: stu, hours: Esek.sumHours(es), days: Esek.workDays(es), total: r2(total), lines: lines, over: overN });
    });
    rows.sort(function (a, b) { return String(a.stu.name).localeCompare(String(b.stu.name), 'he'); });
    return rows;
  };

  /* המשימות שמחויבות בהזמנה: מה שנשמר בהזמנה, ואם לא נשמר — לפי חלוקת השירות (פעם אחת לכל משימה) */
  Esek.orderTasks = function (o) {
    if (!o) return [];
    if (Array.isArray(o.tasks)) return o.tasks;
    var sv = svOf(o.serviceId);
    return ((sv && sv.split) || []).map(function (x) { return { taskId: x.taskId, qty: 1 }; });
  };
  /* ---------- חיוב לקוח: הצעת מחיר > בחירת הלקוח (לפי משימה / לפי שעות וימים) ---------- */
  Esek.custBill2 = function (custId, from, to) {
    var st = S(), cust = Esek.byId(st.customers, custId);
    var byTask = !!cust && cust.bill === 'tasks';
    var all = [], rest = [], orders = [], fixed = [], tmap = {}, tkeys = [], amount = 0;
    st.orders.forEach(function (o) {
      if (o.custId !== custId || !o.billable) return;
      var okAll = Esek.entries({ orderId: o.id, status: 'ok' });
      var es = Esek.entries({ from: from, to: to, orderId: o.id, status: 'ok' });
      var mode = (o.fixedPrice !== undefined && o.fixedPrice !== null && o.fixedPrice !== '') ? 'fixed'
        : (byTask ? 'tasks' : 'terms');
      var oa = 0;
      if (mode === 'terms') {
        all = all.concat(es); rest = rest.concat(es);
      } else {
        // חיוב ברמת ההזמנה: נספר בטווח שבו נופל תאריך ההזמנה (או הדיווח המאושר הראשון), ורק אם יש דיווח מאושר
        var bd = o.date;
        if (!bd && okAll.length) bd = okAll.map(function (e) { return e.date; }).sort()[0];
        var inRange = okAll.length && bd && (!from || bd >= from) && (!to || bd <= to);
        all = all.concat(es);
        if (inRange) {
          if (mode === 'fixed') { oa = +o.fixedPrice || 0; fixed.push({ order: o, amount: r2(oa) }); }
          else Esek.orderTasks(o).forEach(function (x) {
            var t = Esek.byId(st.biz.tasks, x.taskId);
            if (!t) return;
            var q = +x.qty || 0, a = q * (+t.price || 0);
            if (!tmap[t.id]) { tmap[t.id] = { taskId: t.id, task: t, qty: 0, price: +t.price || 0, amount: 0 }; tkeys.push(t.id); }
            tmap[t.id].qty += q; tmap[t.id].amount = r2(tmap[t.id].amount + a);
            oa += a;
          });
          amount += oa;
        }
      }
      orders.push({ order: o, hours: Esek.sumHours(es), days: Esek.workDays(es), mode: mode, amount: r2(oa) });
    });
    var rh = Esek.sumHours(rest), rd = Esek.workDays(rest), ra = 0;
    if (cust) {
      if (cust.bill === 'hours' || cust.bill === 'both') ra += rh * (+cust.rateHour || 0);
      if (cust.bill === 'days' || cust.bill === 'both') ra += rd * (+cust.rateDay || 0);
    }
    var fixedTotal = 0;
    fixed.forEach(function (f) { fixedTotal += f.amount; });
    var taskLines = tkeys.map(function (k) { return tmap[k]; });
    var taskTotal = 0;
    taskLines.forEach(function (l) { taskTotal += l.amount; });
    return { cust: cust, hours: Esek.sumHours(all), days: Esek.workDays(all), amount: r2(ra + fixedTotal + taskTotal),
      fixedLines: fixed, taskLines: taskLines, rest: { hours: rh, days: rd, amount: r2(ra) }, orders: orders };
  };

  /* ---------- מלאי ---------- */
  Esek.stockMove = function (itemId, delta, note, orderId) {
    var st = S(), it = Esek.byId(st.stock.items, itemId);
    if (!it || !isFinite(+delta) || +delta === 0) return null;
    it.qty = r2((+it.qty || 0) + +delta);
    var m = { id: Esek.uid(), itemId: itemId, date: Esek.today(), delta: r2(+delta), orderId: orderId || null, note: note || '' };
    st.stock.moves.push(m);
    Esek.save();
    return m;
  };
  Esek.lowStock = function () {
    return S().stock.items.filter(function (it) { return (+it.qty || 0) < (+it.min || 0); });
  };
  Esek.stockOut = function (order) {
    var st = S(), o = typeof order === 'string' ? Esek.byId(st.orders, order) : order, made = [];
    if (!o || o.stockDone) return made;
    var sv = svOf(o.serviceId);
    (sv && sv.materials || []).forEach(function (m) {
      var mv = Esek.stockMove(m.itemId, -(+m.qty || 0), 'תור: ' + sv.name, o.id);
      if (mv) made.push(mv);
    });
    o.stockDone = true;
    Esek.save();
    return made;
  };

  /* ---------- שרשרת: תור -> דיווח מוכן -> תלמיד.ה -> רכז.ת ---------- */
  Esek.prepAppt = function (orderId) {
    var st = S(), o = Esek.byId(st.orders, orderId), made = [];
    if (!o || !o.time || o.status !== 'sched') return made;
    var sv = svOf(o.serviceId);
    (o.stuIds || []).forEach(function (sid) {
      var has = st.entries.some(function (e) { return e.stuId === sid && e.orderId === o.id && e.date === o.date; });
      if (has) return;
      var e = { id: Esek.uid(), stuId: sid, orderId: o.id, date: o.date, start: o.time, end: apptEndOf(o),
        hours: Esek.hoursBetween(o.time, apptEndOf(o)), by: 'mgr', status: 'prep', stuOk: false, note: 'מתור',
        split: splitFromService(sv) };
      fixSplit(e);
      st.entries.push(e);
      made.push(e);
    });
    if (!Array.isArray(o.tasks) && sv && sv.split && sv.split.length) {
      o.tasks = sv.split.map(function (x) { return { taskId: x.taskId, qty: 1 }; });
    }
    o.status = 'done';
    Esek.stockOut(o);
    Esek.save();
    return made;
  };
  Esek.autoPrep = function (now) {
    now = now || Esek.now();
    var nd = fmt(now), nm = now.getHours() * 60 + now.getMinutes(), made = [];
    S().orders.slice().forEach(function (o) {
      if (o.status !== 'sched' || !o.time || !o.date) return;
      var due = o.date < nd || (o.date === nd && toMin(apptEndOf(o)) < nm);
      if (due) made = made.concat(Esek.prepAppt(o.id));
    });
    return made;
  };
  Esek.setSplit = function (id, split) {
    var e = Esek.byId(S().entries, id);
    if (!e) return null;
    var cl = (split || []).map(function (x) { return { taskId: x.taskId, hours: r2(+x.hours || 0) }; })
      .filter(function (x) { return x.hours > 0; });
    if (splitSumOf(cl) > r2(+e.hours || 0) + 0.005) return null;
    e.split = cl;
    Esek.save();
    return e;
  };
  Esek.setOrderTasks = function (orderId, tasks) {
    var o = Esek.byId(S().orders, orderId);
    if (!o) return null;
    o.tasks = (tasks || []).map(function (x) { return { taskId: x.taskId, qty: +x.qty || 0 }; }).filter(function (x) { return x.qty > 0; });
    Esek.save();
    return o;
  };
  Esek.stuConfirm = function (id, patch) {
    var e = Esek.byId(S().entries, id);
    if (!e || e.status !== 'prep') return null;
    patch = patch || {};
    var start = patch.start !== undefined ? patch.start : e.start, end = patch.end !== undefined ? patch.end : e.end;
    var hours = e.hours;
    if (patch.hours !== undefined && patch.hours !== null && patch.hours !== '') hours = r2(+patch.hours || 0);
    else if (patch.start !== undefined || patch.end !== undefined) { if (start && end) hours = Esek.hoursBetween(start, end); }
    if (patch.split) {
      var cl = patch.split.map(function (x) { return { taskId: x.taskId, hours: r2(+x.hours || 0) }; }).filter(function (x) { return x.hours > 0; });
      if (splitSumOf(cl) > hours + 0.005) return null; // פירוט מעל סך השעות: נדחה, בלי שינוי כלשהו
    }
    e.start = start || null; e.end = end || null; e.hours = hours;
    if (patch.note !== undefined) e.note = patch.note;
    if (patch.split) e.split = cl;
    fixSplit(e); // שעות שהופחתו מתחת לפירוט הקיים: הפירוט מתבטל
    e.status = 'wait'; e.stuOk = true;
    Esek.save();
    return e;
  };
  Esek.mgrApprove = function (id) {
    var e = Esek.byId(S().entries, id);
    if (!e || (e.status !== 'wait' && e.status !== 'prep')) return null;
    e.status = 'ok';
    Esek.save();
    return e;
  };
  Esek.bulk = function (ids, action, val) {
    var st = S(), changed = [], skipped = [];
    (ids || []).forEach(function (id) {
      var e = Esek.byId(st.entries, id), good = true;
      if (!e) { skipped.push(id); return; }
      if (action === 'ok' || action === 'no') e.status = action;
      else if (action === 'times') {
        var h = val && val.start && val.end ? Esek.hoursBetween(val.start, val.end) : 0;
        if (h > 0) { e.start = val.start; e.end = val.end; e.hours = h; fixSplit(e); } else good = false;
      } else if (action === 'hours') {
        var v = +val;
        if (v > 0) { e.hours = r2(v); e.start = null; e.end = null; fixSplit(e); } else good = false;
      } else if (action === 'rate') {
        if (val !== '' && val !== null && val !== undefined && isFinite(+val) && +val >= 0) e.rate = +val; else good = false;
      } else good = false;
      (good ? changed : skipped).push(id);
    });
    Esek.save();
    return { changed: changed, skipped: skipped };
  };
  Esek.notConfirmed = function (ym) {
    var act = {};
    Esek.entries({ ym: ym, status: 'prep' }).forEach(function (e) { act[e.stuId] = 1; });
    return S().students.filter(function (s) { return act[s.id]; });
  };

  /* ---------- בקשות לקוחות ---------- */
  Esek.publicSlots = function (date, serviceId) {
    var st = S(), sv = svOf(serviceId), len = sv ? +sv.minutes || 30 : 30;
    var cap = +st.biz.capacity || 1, h = hoursCfgOf(), nd = Esek.now(), today = fmt(nd), nm = nd.getHours() * 60 + nd.getMinutes();
    return Esek.slots(date, len).map(function (s) {
      var m = toMin(s.time);
      var free = s.busy < cap && m + len <= toMin(h.close) && date >= today && !(date === today && m <= nm);
      return { time: s.time, free: free };
    });
  };
  Esek.requestAppt = function (r) {
    var st = S();
    r = r || {};
    var sv = svOf(r.serviceId), np = normPhone(r.phone), nm = String(r.name || '').replace(/^\s+|\s+$/g, '');
    if (!sv || !r.date || !r.time || !nm || np.length < 9) return null;
    var free = Esek.publicSlots(r.date, r.serviceId).some(function (s) { return s.time === r.time && s.free; });
    if (!free) return null;
    var cust = null;
    st.customers.forEach(function (c) { if (!cust && normPhone(c.phone) === np) cust = c; });
    if (!cust) {
      cust = { id: Esek.uid(), name: nm, contact: nm, phone: String(r.phone).replace(/^\s+|\s+$/g, ''), email: r.email || '',
        bill: 'tasks', rateHour: 0, rateDay: 0, note: 'נוצר מבקשה באתר' };
      st.customers.push(cust);
    } else if (!cust.email && r.email) cust.email = r.email;
    var o = { id: Esek.uid(), custId: cust.id, title: sv.name + ' – ' + cust.name, typeId: sv.typeId, date: r.date, time: r.time,
      minutes: +sv.minutes || 0, serviceId: sv.id, stuIds: [], billable: true, status: 'req', source: 'cust', payRate: null,
      note: '', reminded: '', stockDone: false };
    st.orders.push(o);
    Esek.save();
    return o;
  };
  Esek.acceptReq = function (orderId, stuIds) {
    var o = Esek.byId(S().orders, orderId);
    if (!o || o.status !== 'req') return null;
    o.stuIds = (stuIds || []).slice();
    o.status = 'sched';
    Esek.save();
    return o;
  };
  Esek.rejectReq = function (orderId) {
    var o = Esek.byId(S().orders, orderId);
    if (!o || o.status !== 'req') return null;
    o.status = 'closed';
    Esek.save();
    return o;
  };

  // תור חדש מהרכז.ת או מתלמיד.ה מורשה.ית: f = {custId, serviceId, date, time, stuIds, source:'mgr'|'stu', billable?, title?, minutes?}
  Esek.addAppt = function (f) {
    var st = S(), sv = svOf(f.serviceId), cust = Esek.byId(st.customers, f.custId);
    if (!f.date || !f.time) return null;
    var o = { id: Esek.uid(), custId: cust ? cust.id : null,
      title: f.title || ((sv ? sv.name : 'תור') + (cust ? ' – ' + cust.name : '')),
      typeId: sv ? sv.typeId : (f.typeId || null), date: f.date, time: f.time,
      minutes: +f.minutes || (sv ? +sv.minutes || 0 : 0), serviceId: sv ? sv.id : null,
      stuIds: (f.stuIds || []).slice(), billable: f.billable !== false, status: 'sched',
      source: f.source === 'stu' ? 'stu' : 'mgr', payRate: null, note: f.note || '', reminded: '', stockDone: false };
    st.orders.push(o);
    Esek.save();
    return o;
  };

  /* ---------- הצעות מחיר ---------- */
  Esek.quoteTotal = function (q) {
    var t = 0;
    ((q && q.lines) || []).forEach(function (l) { t += (+l.qty || 0) * (+l.price || 0); });
    return r2(t);
  };
  Esek.quoteToOrder = function (quoteId, opt) {
    var st = S(), q = Esek.byId(st.quotes, quoteId);
    opt = opt || {};
    if (!q) return null;
    if (q.orderId) return Esek.byId(st.orders, q.orderId);
    if (q.status !== 'ok') return null;
    var first = null;
    q.lines.forEach(function (l) { if (!first && l.serviceId && svOf(l.serviceId)) first = svOf(l.serviceId); });
    var cust = Esek.byId(st.customers, q.custId);
    var o = { id: Esek.uid(), custId: q.custId, title: (first ? first.name : (q.lines[0] && q.lines[0].text) || 'הצעת מחיר') + ' – ' + (cust ? cust.name : ''),
      typeId: first ? first.typeId : (st.biz.types[0] ? st.biz.types[0].id : ''), date: opt.date || '', time: opt.time || '',
      minutes: first ? +first.minutes || 0 : 0, serviceId: first ? first.id : null, stuIds: (opt.stuIds || []).slice(), billable: true,
      status: opt.date && opt.time ? 'sched' : 'new', source: 'mgr', payRate: null, note: q.note || '', reminded: '', stockDone: false,
      fixedPrice: Esek.quoteTotal(q) };
    st.orders.push(o);
    q.orderId = o.id;
    Esek.save();
    return o;
  };

  /* ---------- תזכורת ללקוח (כפתור; בלי שליחה אוטומטית) ---------- */
  var DAYS_HE = ['יום ראשון', 'יום שני', 'יום שלישי', 'יום רביעי', 'יום חמישי', 'יום שישי', 'יום שבת'];
  Esek.reminderText = function (orderId) {
    var st = S(), o = Esek.byId(st.orders, orderId);
    if (!o || !o.date) return null;
    var cust = Esek.byId(st.customers, o.custId), sv = svOf(o.serviceId);
    var d = parse(o.date), when = DAYS_HE[d.getDay()] + ' ' + pad2(d.getDate()) + '.' + pad2(d.getMonth() + 1) + '.' + d.getFullYear();
    var svName = sv ? sv.name : (o.title || '');
    var subject = 'תזכורת לתור ב' + st.biz.name + ' – ' + when + (o.time ? ' בשעה ' + o.time : '');
    var greetName = cust ? String(cust.contact || cust.name || '').trim().split(/\s+/)[0] : '';
    var body = 'שלום' + (greetName ? ' ' + greetName : '') + ',\n' +
      'תזכורת לתור שלך ב' + st.biz.name + '.\n' +
      'שירות: ' + svName + '\n' +
      'מתי: ' + when + (o.time ? ' בשעה ' + o.time : '') + '\n' +
      'לביטול או שינוי: ' + (st.biz.phone || '');
    var wp = cust ? waPhone(cust.phone) : '';
    return { subject: subject, body: body, wa: 'https://wa.me/' + wp + '?text=' + encodeURIComponent(body) };
  };
  Esek.markReminded = function (orderId) {
    var o = Esek.byId(S().orders, orderId);
    if (!o) return null;
    o.reminded = Esek.today();
    Esek.save();
    return o;
  };

  /* ---------- נתוני דוגמה v2: מספרה (דטרמיניסטי; תאריכים יחסית ל-Esek.now()) ---------- */
  Esek.seed2 = function () {
    var rnd = mulberry32(20261114);
    function pick(a) { return a[Math.floor(rnd() * a.length)]; }
    var today = fmt(Esek.now()), ymNow = today.slice(0, 7), curStart = ymNow + '-01', winStart = addDays(today, -60);

    var types = [{ id: 't1', name: 'עבודת מספרה', pro: true }, { id: 't2', name: 'דלפק וסידור', pro: false }];
    var tasks = [
      { id: 'tk1', name: 'תספורת', rate: 38, price: 80 },
      { id: 'tk2', name: 'צבע / מריחה', rate: 42, price: 250 },
      { id: 'tk3', name: 'שטיפה', rate: 34, price: 30 },
      { id: 'tk4', name: 'פן', rate: 38, price: 70 },
      { id: 'tk5', name: 'החלקה', rate: 46, price: 400 },
      { id: 'tk6', name: 'ניקיון וסידור (פנימי)', rate: 32, price: 0 },
      { id: 'tk7', name: 'דלפק (פנימי)', rate: 32, price: 0 }
    ];
    var services = [
      { id: 'sv1', name: 'תספורת', typeId: 't1', minutes: 30, price: 80, split: [{ taskId: 'tk1', minutes: 30 }], materials: [] },
      { id: 'sv2', name: 'תספורת ושטיפה', typeId: 't1', minutes: 45, price: 110,
        split: [{ taskId: 'tk1', minutes: 30 }, { taskId: 'tk3', minutes: 15 }], materials: [{ itemId: 'i1', qty: 0.1 }] },
      { id: 'sv3', name: 'צבע', typeId: 't1', minutes: 90, price: 320,
        split: [{ taskId: 'tk2', minutes: 60 }, { taskId: 'tk4', minutes: 30 }], materials: [{ itemId: 'i2', qty: 1 }, { itemId: 'i5', qty: 1 }] },
      { id: 'sv4', name: 'פן', typeId: 't1', minutes: 30, price: 70, split: [{ taskId: 'tk4', minutes: 30 }], materials: [{ itemId: 'i6', qty: 1 }] },
      { id: 'sv5', name: 'החלקה', typeId: 't1', minutes: 120, price: 450,
        split: [{ taskId: 'tk5', minutes: 90 }, { taskId: 'tk3', minutes: 15 }, { taskId: 'tk4', minutes: 15 }],
        materials: [{ itemId: 'i4', qty: 1 }, { itemId: 'i1', qty: 0.1 }] },
      { id: 'sv6', name: 'טיפול מסכה', typeId: 't1', minutes: 30, price: 60, split: [{ taskId: 'tk3', minutes: 30 }], materials: [{ itemId: 'i3', qty: 1 }] }
    ];
    var hoursCfg = defaultHours();
    var snames = [['נור חדאד', 'יא', 34, '4821'], ['רים סעדי', 'יא', 35, '7305'], ['יואב לוי', 'יב', 36, '1593'],
      ['שירה כהן', 'יא', 34, '6047'], ['אחמד נאסר', 'יב', 37, '2918'], ['ליאן דאהר', 'יא', 33, '8264'],
      ['עומר כץ', 'יא', 34, '3750'], ['טל ברוך', 'יב', 36, '9136'], ['מאיה גבאי', 'יא', 33, '5482'],
      ['דור אזולאי', 'יב', 38, '0679'], ['נועה פרץ', 'יא', 34, '3315'], ['יאסמין עלי', 'יב', 37, '7842'],
      ['אדם קורן', 'יא', 32, '2206'], ['הדר ביטון', 'יב', 35, '6951']];
    var students = snames.map(function (n, i) {
      return { id: 's' + (i + 1), name: n[0], cls: n[1], grp: 'מספרה', rate: n[2], pin: n[3], canBook: i < 3 };
    });
    var cn = [['הדס גולן', 'tasks', 60], ['יוסי אברהם', 'tasks', 55], ['רות שלום', 'tasks', 50], ['מיכל ברנע', 'tasks', 60],
      ['אלון דהן', 'tasks', 55], ['אבי שחר', 'tasks', 60], ['דנה מזרחי', 'tasks', 50], ['גיל אשכנזי', 'tasks', 55],
      ['ליאת רוזן', 'hours', 60], ['שמעון בן-חיים', 'hours', 50], ['מיה סגל', 'hours', 55], ['בית אבות הדגמה', 'days', 0]];
    var customers = cn.map(function (c, i) {
      return { id: 'c' + (i + 1), name: c[0], contact: c[0], phone: '050-0000' + (101 + i), email: i % 2 ? '' : 'demo' + (i + 1) + '@example.com',
        bill: c[1], rateHour: c[2], rateDay: c[1] === 'days' ? 150 : 0, note: '' };
    });
    customers.push({ id: 'c13', name: 'קרן ויצמן', contact: 'קרן ויצמן', phone: '050-0000113', email: '', bill: 'tasks', rateHour: 55, rateDay: 0, note: 'פנתה דרך הדף' });

    var orders = [], entries = [], on = 0, en = 0;
    function mkOrder(f) {
      on++;
      var o = { id: 'o' + on, custId: f.custId, title: f.title, typeId: f.typeId, date: f.date || '', time: f.time || '', minutes: f.minutes || 0,
        serviceId: f.serviceId || null, stuIds: f.stuIds || [], billable: !!f.billable, status: f.status, payRate: null, note: f.note || '',
        source: f.source || 'mgr', reminded: '', stockDone: !!f.stockDone };
      if (f.tasks) o.tasks = f.tasks;
      if (f.fixedPrice !== undefined) o.fixedPrice = f.fixedPrice;
      orders.push(o);
      return o;
    }
    function apptOrder(svId, custId, date, time, stuIds, status, extra) {
      var sv = Esek.byId(services, svId), c = Esek.byId(customers, custId);
      extra = extra || {};
      return mkOrder({ custId: custId, title: sv.name + ' – ' + c.name, typeId: sv.typeId, date: date, time: time, minutes: sv.minutes,
        serviceId: svId, stuIds: stuIds, billable: true, status: status, source: extra.source, stockDone: extra.stockDone,
        tasks: extra.tasks, fixedPrice: extra.fixedPrice });
    }
    function mkEntry(stuId, orderId, date, start, hours, by, status, note, split, stuOk) {
      var end = null;
      if (start) { var m = toMin(start) + Math.round(hours * 60); end = pad2(Math.floor(m / 60)) + ':' + pad2(m % 60); }
      en++;
      var e = { id: 'e' + en, stuId: stuId, orderId: orderId, date: date, start: start || null, end: end, hours: hours, by: by,
        status: status, note: note || '' };
      if (split) e.split = split;
      if (stuOk !== undefined) e.stuOk = stuOk;
      entries.push(e);
      return e;
    }
    var oClean = mkOrder({ custId: null, title: 'ניקיון וסידור הסלון', typeId: 't2', billable: false, status: 'work', note: 'עבודה פנימית' });
    var oDesk = mkOrder({ custId: null, title: 'דלפק וקבלת קהל', typeId: 't2', billable: false, status: 'work', note: 'עבודה פנימית' });

    var activeDays = [];
    for (var d = winStart; d < today; d = addDays(d, 1)) if (hoursCfg.days.indexOf(dow(d)) >= 0) activeDays.push(d);
    var nAct = activeDays.length;
    var oneBefore = nAct ? activeDays[nAct - 1] : addDays(today, -1);
    var twoBefore = nAct > 1 ? activeDays[nAct - 2] : oneBefore;

    activeDays.forEach(function (day) {
      // החודש: שני תלמידים בלי אף דיווח (להדגמת "לא דיווחו כלל")
      var pool = day >= curStart ? students.filter(function (s) { return s.id !== 's13' && s.id !== 's14'; }) : students;
      var used = {}, slots = ['08:00', pick(['09:30', '10:00']), '11:30', pick(['13:00', '13:30'])];
      slots.forEach(function (tm) {
        var sv = pick(services), cust = pick(customers.slice(0, 12)), rn = rnd(), n = rn < 0.15 ? 3 : rn < 0.55 ? 2 : 1, sids = [];
        while (sids.length < n) { var s = pick(pool); if (!used[s.id] && sids.indexOf(s.id) < 0) sids.push(s.id); }
        sids.forEach(function (x) { used[x] = 1; });
        var o = apptOrder(sv.id, cust.id, day, tm, sids, 'done', { stockDone: true });
        if (rnd() < 0.8) o.tasks = sv.split.map(function (x) { return { taskId: x.taskId, qty: 1 }; });
        sids.forEach(function (sid) {
          var status = day === oneBefore ? 'prep' : day === twoBefore ? 'wait' : 'ok';
          mkEntry(sid, o.id, day, tm, r2(sv.minutes / 60), day === oneBefore ? 'mgr' : 'stu', status, day === oneBefore ? 'מתור' : '',
            splitFromService(sv), status === 'wait' || status === 'ok' ? true : false);
        });
      });
      // עבודה פנימית: שעות כלליות, לפעמים עם פירוט
      for (var k = 0; k < 2 + (rnd() < 0.5 ? 1 : 0); k++) {
        var s2 = pick(pool), h = pick([1, 1.5, 2]);
        if (used[s2.id]) continue;
        used[s2.id] = 1;
        var split = rnd() < 0.3 ? [{ taskId: 'tk6', hours: r2(h / 2) }] : [];
        var st2 = day === oneBefore ? 'prep' : day === twoBefore ? 'wait' : 'ok';
        mkEntry(s2.id, rnd() < 0.5 ? oClean.id : oDesk.id, day, null, h, day === oneBefore ? 'mgr' : 'stu', st2, '', split, st2 === 'ok' || st2 === 'wait');
      }
    });
    // חריגים בכוונה: מעל 8 שעות, אחרי 20:00, שבת, נדחה
    mkEntry('s2', oClean.id, oneBefore, '08:00', 5, 'stu', 'wait', 'חריג: מעל 8 שעות', [], true);
    mkEntry('s2', oDesk.id, oneBefore, '14:00', 4, 'stu', 'wait', '', [], true);
    mkEntry('s4', oDesk.id, twoBefore, '16:30', 4.5, 'stu', 'ok', 'משמרת ערב (דוגמה להתרעה)', [], true);
    var sat = addDays(today, -21);
    while (dow(sat) !== 6) sat = addDays(sat, -1);
    if (sat >= winStart) mkEntry('s3', oClean.id, sat, '10:00', 3, 'stu', 'ok', 'דיווח בשבת (דוגמה להתרעה)', [], true);
    var rej = mkEntry('s5', oDesk.id, oneBefore, null, 2, 'stu', 'no', 'שעות לא תואמות', [], true);
    void rej;

    // היום: תורים (חלקם כבר הסתיימו, כדי ש-autoPrep יצור דיווחים מוכנים)
    var todayAct = today;
    while (hoursCfg.days.indexOf(dow(todayAct)) < 0) todayAct = addDays(todayAct, -1);
    apptOrder('sv1', 'c1', todayAct, '08:00', ['s1'], 'sched');
    apptOrder('sv3', 'c2', todayAct, '09:00', ['s2', 's6'], 'sched');
    apptOrder('sv2', 'c3', todayAct, '11:00', ['s3'], 'sched');
    apptOrder('sv4', 'c4', todayAct, '13:00', ['s1'], 'sched');
    apptOrder('sv5', 'c5', todayAct, '14:00', ['s2'], 'sched');
    var fut = [];
    for (var fi = 1; fi <= 14 && fut.length < 4; fi++) { var fd = addDays(today, fi); if (hoursCfg.days.indexOf(dow(fd)) >= 0) fut.push(fd); }
    apptOrder('sv1', 'c6', fut[0], '09:00', ['s7'], 'sched');
    apptOrder('sv6', 'c7', fut[0], '11:00', ['s1'], 'sched', { source: 'stu' });
    // בקשות לקוחות ממתינות
    apptOrder('sv4', 'c9', fut[1], '10:00', [], 'req', { source: 'cust' });
    apptOrder('sv2', 'c13', fut[2], '12:00', [], 'req', { source: 'cust' });

    var stock = { items: [
      { id: 'i1', name: 'שמפו מקצועי', unit: 'ליטר', qty: 12, min: 5 },
      { id: 'i2', name: 'צבע שיער', unit: 'שפופרת', qty: 20, min: 8 },
      { id: 'i3', name: 'מסכה לשיער', unit: 'יחידה', qty: 9, min: 4 },
      { id: 'i4', name: 'תמיסת החלקה', unit: 'בקבוק', qty: 3, min: 4 },
      { id: 'i5', name: 'כפפות', unit: 'זוג', qty: 60, min: 20 },
      { id: 'i6', name: 'קצף עיצוב', unit: 'יחידה', qty: 10, min: 3 }],
      moves: [
        { id: 'm1', itemId: 'i4', date: addDays(today, -20), delta: 6, orderId: null, note: 'משלוח מהספק' },
        { id: 'm2', itemId: 'i4', date: addDays(today, -6), delta: -3, orderId: null, note: 'שימוש בהחלקות השבוע' },
        { id: 'm3', itemId: 'i2', date: addDays(today, -12), delta: 10, orderId: null, note: 'משלוח מהספק' }] };

    var qOrder = apptOrder('sv5', 'c8', fut[1], '13:00', ['s9'], 'sched');
    var quotes = [
      { id: 'q1', custId: 'c1', date: addDays(today, -3), status: 'draft', lines: [{ serviceId: 'sv3', text: 'צבע', qty: 4, price: 300 }], note: 'צוות משרד, ארבעה אנשים', orderId: null },
      { id: 'q2', custId: 'c2', date: addDays(today, -6), status: 'sent', lines: [{ serviceId: 'sv2', text: 'תספורת ושטיפה', qty: 3, price: 100 }], note: '', orderId: null },
      { id: 'q3', custId: 'c8', date: addDays(today, -9), status: 'ok',
        lines: [{ serviceId: 'sv5', text: 'החלקה', qty: 1, price: 450 }, { serviceId: null, text: 'מארז טיפוח', qty: 1, price: 90 }], note: 'חבילת כלה', orderId: qOrder.id },
      { id: 'q4', custId: 'c10', date: addDays(today, -15), status: 'no', lines: [{ serviceId: 'sv3', text: 'צבע', qty: 2, price: 330 }], note: 'המחיר גבוה ללקוח', orderId: null }
    ];
    qOrder.fixedPrice = Esek.quoteTotal(quotes[2]);

    return {
      biz: { name: 'מספרת הדגמה', school: 'בית ספר לדוגמה', manager: 'דנה (הדגמה)', phone: '050-0000100', types: types, tasks: tasks,
        services: services, hours: hoursCfg, capacity: 2 },
      students: students, customers: customers, orders: orders, entries: entries, open: {}, stock: stock, quotes: quotes
    };
  };

  Esek.load();

  if (typeof module !== 'undefined' && module.exports) module.exports = Esek;
  root.Esek = Esek;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
