/* app.js — מסכי המנהל.ת העסקי.ת. כל הנתונים והחישובים מ-window.Esek (esek-core.js).
   כל טקסט של משתמש נכנס כ-textContent בלבד (el()); אייקונים = מחרוזות SVG קבועות. */
(function () {
  'use strict';
  var E = window.Esek;
  if (!E) { document.getElementById('view').textContent = 'קובץ הנתונים לא נטען.'; return; }
  E.load();
  function S() { return E.state; }

  /* ---------- בניית DOM בטוחה ---------- */
  var PROPS = { value: 1, checked: 1, selected: 1, disabled: 1 };
  function el(tag, a) {
    var n = document.createElement(tag), post = [];
    if (a) Object.keys(a).forEach(function (k) {
      var v = a[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') n.className = v;
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') n.addEventListener(k.slice(2), v);
      else if (PROPS[k]) post.push([k, v]);
      else n.setAttribute(k, v === true ? '' : v);
    });
    add(n, Array.prototype.slice.call(arguments, 2));
    post.forEach(function (p) { n[p[0]] = p[1]; });
    return n;
  }
  function add(n, kids) {
    kids.forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      if (Array.isArray(c)) { add(n, c); return; }
      n.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
    });
    return n;
  }
  function L(t) { return el('span', { class: 'ltr', dir: 'ltr' }, t); }
  function join(parts, sep) {
    var out = [];
    parts.filter(function (p) { return p !== null && p !== undefined && p !== '' && p !== false; })
      .forEach(function (p, i) { if (i) out.push(sep || ' · '); out.push(p); });
    return out;
  }

  var I = {
    store: '<path d="M3 9l1.5-5h15L21 9"/><path d="M4 9v11h16V9"/><path d="M9 20v-6h6v6"/><path d="M3 9h18"/>',
    clip: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1"/><path d="M9 10h6M9 14h6M9 18h3"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    pen: '<path d="M4 20h4l10-10-4-4L4 16z"/><path d="m12 8 4 4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    download: '<path d="M12 4v12M6 10l6 6 6-6"/><path d="M4 20h16"/>',
    print: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 14h12v7H6z"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    back: '<path d="M9 6l6 6-6 6"/>',
    alert: '<path d="M12 3l9.5 17h-19z"/><path d="M12 10v4M12 17.5v.01"/>',
    reset: '<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4h4"/>',
    file: '<path d="M6 2h8l5 5v15H6z"/><path d="M14 2v5h5"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
    phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
    award: '<circle cx="12" cy="9" r="6"/><path d="M8.5 14l-1.5 8 5-3 5 3-1.5-8"/>',
    wallet: '<path d="M4 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4z"/><path d="M4 7V6a2 2 0 0 1 2-2h10"/><path d="M15 13.5h2"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    dots: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
    fwd: '<path d="M15 6l-6 6 6 6"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/>'
  };
  function ic(n) {
    var t = document.createElement('template');
    t.innerHTML = '<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (I[n] || '') + '</svg>';
    return t.content.firstChild;
  }
  function btn(label, icon, onclick, cls, extra) {
    var a = { type: 'button', class: 'btn ' + (cls || ''), onclick: onclick };
    if (extra) Object.keys(extra).forEach(function (k) { a[k] = extra[k]; });
    return el('button', a, icon ? ic(icon) : null, label);
  }
  function linkBtn(label, icon, href, cls) { return el('a', { class: 'btn ' + (cls || ''), href: href }, icon ? ic(icon) : null, label); }

  /* ---------- תבניות ---------- */
  function r2(x) { return Math.round((+x || 0) * 100) / 100; }
  function fh(n) { return String(r2(n)); }
  function money(n) { return r2(n).toLocaleString('he-IL', { maximumFractionDigits: 2 }) + ' ₪'; }
  var WD = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
  function pd(s) { var p = String(s).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function fd(s) { if (!s) return ''; var p = String(s).split('-'); return (+p[2]) + '.' + (+p[1]) + '.' + p[0].slice(2); }
  function fdw(s) { return s ? 'יום ' + WD[pd(s).getDay()] + ' ' + fd(s) : ''; }
  function today() { return E.today ? E.today() : ymd(new Date()); }
  function ymd(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function curYM() { return today().slice(0, 7); }
  function monthFrom(ym) { return ym + '-01'; }
  function monthTo(ym) { var p = ym.split('-'); return ymd(new Date(+p[0], +p[1], 0)); }
  function shiftYM(ym, k) { var p = ym.split('-'); return ymd(new Date(+p[0], +p[1] - 1 + k, 1)).slice(0, 7); }
  function monthLabel(ym) { var p = ym.split('-'); return new Date(+p[0], +p[1] - 1, 1).toLocaleDateString('he-IL', { month: 'long', year: 'numeric' }); }
  function timeRange(e) { return e.start && e.end ? L(e.start + '–' + e.end) : null; }
  function hrsNode(h) { return el('span', { class: 'hrs' }, L(fh(h)), ' ש׳'); }
  function stuName(id) { var s = E.byId(S().students, id); return s ? s.name : '—'; }
  function order(id) { return E.byId(S().orders, id); }
  function custName(o) { if (!o || !o.custId) return 'עבודה פנימית'; var c = E.byId(S().customers, o.custId); return c ? c.name : '—'; }
  function typeName(id) { var t = E.byId(S().biz.types, id); return t ? t.name : ''; }
  function isOpen(o) { return o.status === 'new' || o.status === 'sched' || o.status === 'work'; }
  var BILL = { hours: 'לפי שעות', days: 'לפי ימי-תלמיד', both: 'שעות וימי-תלמיד' };
  function billTerms(c) {
    var p = [];
    if (c.bill === 'hours' || c.bill === 'both') p.push(money(c.rateHour) + ' לשעה');
    if (c.bill === 'days' || c.bill === 'both') p.push(money(c.rateDay) + ' ליום-תלמיד');
    return p.join(' + ');
  }
  var ALERT = { over8: 'מעל 8 שעות', late: 'אחרי 20:00', shabbat: 'שבת' };
  function alertTags(e) { return E.alertsOf(e).map(function (a) { return el('span', { class: 'tag amber' }, ic('alert'), ALERT[a] || a); }); }
  var EST_CLS = { wait: 'wait', ok: 'ok', no: 'no' };
  function estTag(st) { return el('span', { class: 'tag ' + (EST_CLS[st] || '') }, E.ESTATUS[st] || st); }
  var OST_CLS = { 'new': 'amber', sched: '', work: 'ink', done: 'ok', closed: '' };
  function ostTag(st) { return el('span', { class: 'tag ' + (OST_CLS[st] || '') }, E.STATUS[st] || st); }

  /* ---------- הודעה, העתקה, הורדה ---------- */
  var toastT;
  function toast(msg) {
    var t = document.querySelector('.toast');
    if (!t) { t = el('div', { class: 'toast', role: 'status', 'aria-live': 'polite' }); document.body.appendChild(t); }
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(function () { t.hidden = true; }, 2600);
  }
  function copyText(s, okMsg) {
    function fallback() {
      var ta = el('textarea', { style: 'position:fixed;top:-1000px;opacity:0' }); ta.value = s;
      document.body.appendChild(ta); ta.select();
      var ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove(); toast(ok ? (okMsg || 'הועתק') : 'ההעתקה לא הצליחה');
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(s).then(function () { toast(okMsg || 'הועתק'); }, fallback);
    } else fallback();
  }
  function download(name, text) {
    var blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
    var a = el('a', { href: URL.createObjectURL(blob), download: name });
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  /* ---------- ניווט ---------- */
  var NAV = [['home', 'store', 'העסק'], ['cal', 'cal', 'יומן'], ['orders', 'clip', 'הזמנות'], ['customers', 'users', 'לקוחות'],
    ['hours', 'clock', 'שעות'], ['reports', 'chart', 'דוחות'], ['settings', 'gear', 'הגדרות']];
  var PHONE_TABS = 4; // בטלפון: 4 ראשונים + "עוד"
  var TAB_OF = { home: 'home', missing: 'home', cal: 'cal', appt: 'cal', orders: 'orders', order: 'orders', add: 'hours', customers: 'customers',
    customer: 'customers', hours: 'hours', reports: 'reports', rep: 'reports', settings: 'settings', more: 'more' };
  var curQuery = {};
  var stack = [];
  function curHash() { return location.hash && location.hash.length > 1 ? location.hash : '#home'; }
  function go(h) { location.hash = h; }
  function replace(h) { stack[stack.length - 1] = h; if (curHash() === h) render(true); else location.replace(h); }
  function goBack(parent) { if (stack.length > 1) history.back(); else replace(parent); }
  function backBtn(parent) { return btn('חזרה', 'back', function () { goBack(parent); }, 'quiet back'); }
  function onHash() {
    var h = curHash();
    if (stack.length > 1 && stack[stack.length - 2] === h) stack.pop();
    else if (stack[stack.length - 1] !== h) stack.push(h);
    render(false);
  }
  function buildNav() {
    var nav = document.getElementById('nav'), bar = document.getElementById('tabbar');
    NAV.forEach(function (n, i) {
      nav.appendChild(el('a', { href: '#' + n[0], 'data-tab': n[0] }, ic(n[1]), n[2]));
      if (i < PHONE_TABS) bar.appendChild(el('a', { href: '#' + n[0], 'data-tab': n[0] }, ic(n[1]), el('span', null, n[2])));
    });
    bar.appendChild(el('a', { href: '#more', 'data-tab': 'more' }, ic('dots'), el('span', null, 'עוד')));
  }
  function markNav(tab) {
    var phoneTab = NAV.slice(0, PHONE_TABS).some(function (n) { return n[0] === tab; }) ? tab : 'more';
    document.querySelectorAll('#nav a, #tabbar a').forEach(function (a) {
      var on = a.getAttribute('data-tab') === (a.parentNode.id === 'tabbar' ? phoneTab : tab);
      a.classList.toggle('cur', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }

  /* מצב תצוגה בזיכרון (לא נשמר) */
  var ui = { ym: curYM(), billFrom: monthFrom(curYM()), billTo: today(), typeFrom: monthFrom(curYM()), typeTo: today(),
    empYM: curYM(), cmpA: null, cmpB: null, editId: null, showAll: {}, fixed: {} };
  (function () {
    var pm = shiftYM(curYM(), -1), d = +today().slice(8, 10);
    ui.cmpA = { from: monthFrom(curYM()), to: today() };
    ui.cmpB = { from: monthFrom(pm), to: ymd(new Date(+pm.slice(0, 4), +pm.slice(5, 7) - 1, Math.min(d, +monthTo(pm).slice(8, 10)))) };
  })();

  function render(keepScroll) {
    var hq = curHash().slice(1).split('?');
    curQuery = {};
    (hq[1] || '').split('&').forEach(function (kv) { if (!kv) return; var p = kv.split('='); curQuery[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || ''); });
    var parts = hq[0].split('/');
    var name = parts[0], arg = parts[1] ? decodeURIComponent(parts[1]) : '', arg2 = parts[2] ? decodeURIComponent(parts[2]) : '';
    var fn = VIEWS[name] || VIEWS.home;
    var v = document.getElementById('view'), y = window.scrollY;
    document.getElementById('bizName').textContent = S().biz.name + ' · ' + S().biz.school;
    v.textContent = '';
    var out = fn(arg, arg2);
    add(v, [out]);
    markNav(TAB_OF[name] || 'home');
    var h1 = v.querySelector('h1');
    document.title = (h1 ? h1.textContent + ' · ' : '') + 'העסק הבית-ספרי · הדגמה';
    if (keepScroll) window.scrollTo(0, y); else { window.scrollTo(0, 0); v.focus({ preventScroll: true }); }
  }
  function head(title, parent, tools) {
    return el('div', { class: 'vh' }, parent ? backBtn(parent) : null, el('h1', null, title), tools || null);
  }
  function sub(title, extra) { return el('h2', { class: 'sub-h' }, title, extra || null); }
  function monthSelect(val, onch, label) {
    var opts = [];
    for (var k = 0; k < 8; k++) { var ym = shiftYM(curYM(), -k); opts.push(el('option', { value: ym }, monthLabel(ym))); }
    var s = el('select', { 'aria-label': label || 'חודש', value: val, onchange: function () { onch(s.value); } }, opts);
    return s;
  }
  function fld(label, input, full) { return el('label', { class: 'fld' + (full ? ' full' : '') }, el('span', null, label), input); }
  function meter(o) {
    var pct = o.total ? Math.max(0, Math.min(100, Math.round(o.part * 100 / o.total))) : 0;
    var body = [
      el('span', { class: 'm-l' }, ic(o.icon), o.label),
      el('span', { class: 'm-v' }, el('b', null, L(o.partTxt !== undefined ? o.partTxt : String(o.part))), o.ofTxt !== null ? [' מתוך ', L(o.totalTxt !== undefined ? o.totalTxt : String(o.total)), o.unit ? ' ' + o.unit : ''] : (o.unit ? ' ' + o.unit : '')),
      o.nobar ? null : el('span', { class: 'bar' + (o.amber ? ' amber' : ''), role: 'img', 'aria-label': pct + '%' }, el('i', { style: 'width:' + pct + '%' })),
      o.sub ? el('span', { class: 'm-s' }, o.sub) : null
    ];
    return o.href ? el('a', { class: 'meter', href: o.href }, body) : el('div', { class: 'meter' }, body);
  }
  function rowLink(href, icon, title, small, tags) {
    return el('a', { class: 'rowbtn' + (icon ? '' : ' noic'), href: href }, icon ? ic(icon) : null, el('b', null, title),
      el('span', { class: 'rtag' }, tags || null), el('span', { class: 'arr', 'aria-hidden': 'true' }), small ? el('small', null, small) : null);
  }

  /* ---------- 1. העסק ---------- */
  function vHome() {
    var ym = ui.ym, st = S();
    var ok = E.entries({ ym: ym, status: 'ok' });
    var total = E.sumHours(ok);
    var bill = E.sumHours(ok.filter(function (e) { var o = order(e.orderId); return o && o.billable; }));
    var miss = E.missing(ym), nStu = st.students.length;
    var waits = E.entries({ status: 'wait' });
    var openO = st.orders.filter(isOpen);
    var cnt = {}; openO.forEach(function (o) { cnt[o.status] = (cnt[o.status] || 0) + 1; });
    var pct = total ? Math.round(bill * 100 / total) : 0;
    return [
      head('העסק', null, fld('חודש', monthSelect(ym, function (v) { ui.ym = v; render(true); }))),
      el('p', { class: 'biz-m' }, st.biz.name + ' · ' + st.biz.school),
      el('div', { class: 'meters' },
        el('a', { class: 'meter', href: sumHash({ p: 'month', d: monthFrom(ym), c: 'all', b: 'all', by: 'cust', then: 'stu' }) },
          el('span', { class: 'm-l' }, ic('clock'), 'שעות מאושרות · ' + monthLabel(ym)),
          el('span', { class: 'm-v' }, el('b', null, L(fh(bill))), ' לחיוב מתוך ', L(fh(total)), ' שעות'),
          el('span', { class: 'bar', role: 'img', 'aria-label': pct + '% לחיוב' }, el('i', { style: 'width:' + pct + '%' }), el('i', { class: 'b2', style: 'width:' + (total ? 100 - pct : 0) + '%' })),
          el('span', { class: 'legend' }, el('span', null, el('i'), 'לחיוב ', L(fh(bill))), el('span', null, el('i', { class: 'b2' }), 'לא לחיוב ', L(fh(r2(total - bill)))))),
        meter({ icon: 'users', label: 'דיווחו בחודש', part: nStu - miss.length, total: nStu, unit: 'תלמידים', href: '#missing/' + ym,
          sub: miss.length ? [L(String(miss.length)), ' לא דיווחו · לרשימה'] : 'כולם דיווחו' }),
        meter({ icon: 'alert', label: 'ממתין לאישור', part: waits.length, total: 0, unit: 'דיווחים', nobar: true,
          ofTxt: null, href: '#hours', sub: waits.length ? [L(fh(E.sumHours(waits))), ' שעות · לאישור'] : 'אין ממתינים' }),
        meter({ icon: 'clip', label: 'הזמנות פתוחות', part: openO.length, total: st.orders.length, unit: 'הזמנות', href: '#orders',
          sub: join(['new', 'sched', 'work'].filter(function (k) { return cnt[k]; }).map(function (k) { return cnt[k] + ' ' + E.STATUS[k]; })) })
      ),
      sub('מעבר מהיר'),
      el('div', { class: 'rows' },
        hasCal() ? (function () {
          var ta = E.appts(today()) || [], hm = nowHM();
          var next = ta.filter(function (o) { return o.time >= hm && o.status !== 'done'; })[0];
          return rowLink('#cal', 'cal', 'התורים היום', ta.length ? join([[L(String(ta.length)), ' תורים'],
            next ? ['הקרוב ', L(next.time), ' ', next.title] : 'אין עוד תורים היום']) : 'אין תורים היום');
        })() : null,
        rowLink('#orders', 'clip', 'הזמנות', [L(String(openO.length)), ' פתוחות מתוך ', L(String(st.orders.length))]),
        rowLink('#rep/sum', 'chart', 'סיכום שעות', 'לפי יום, שבוע או חודש · לקוח ← תלמיד.ה'),
        rowLink('#customers', 'users', 'לקוחות', [L(String(st.customers.length)), ' לקוחות']),
        rowLink('#hours', 'clock', 'שעות', join([waits.length ? [L(String(waits.length)), ' ממתינים לאישור'] : 'אין ממתינים', Object.keys(st.open).length ? [L(String(Object.keys(st.open).length)), ' שעונים פתוחים'] : null])),
        rowLink('#reports', 'chart', 'דוחות', 'שכר · חיוב לקוח · תעודה · שאילתות'),
        rowLink('#settings', 'gear', 'הגדרות', 'העסק · סוגי עבודה · תלמידים')
      )
    ];
  }

  /* לא דיווחו */
  function vMissing(ym) {
    ym = /^\d{4}-\d{2}$/.test(ym) ? ym : ui.ym;
    var miss = E.missing(ym);
    return [
      head('לא דיווחו · ' + monthLabel(ym), '#home', miss.length ? btn('העתקת השמות', 'copy', function () { copyText(miss.map(function (s) { return s.name; }).join('\n'), 'השמות הועתקו'); }) : null),
      el('p', { class: 'hint' }, L(String(miss.length)), ' מתוך ', L(String(S().students.length)), ' תלמידים בלי אף דיווח בחודש'),
      el('div', { class: 'rows', style: 'margin-top:10px' }, miss.length ? miss.map(function (s) {
        return el('div', { class: 'lrow' }, ic('user'), el('b', { class: 'grow' }, s.name), el('span', { class: 'tag' }, s.cls + (s.grp ? ' · ' + s.grp : '')));
      }) : el('p', { class: 'empty' }, 'כולם דיווחו'))
    ];
  }

  /* ---------- 2. הזמנות ---------- */
  var SORD = { 'new': 0, sched: 1, work: 2, done: 3, closed: 4 };
  function okHours(f) { f.status = 'ok'; return E.sumHours(E.entries(f)); }
  function orderRow(o) {
    return rowLink('#order/' + o.id, null, o.title,
      join([custName(o), typeName(o.typeId), o.date ? L(fd(o.date)) : 'בלי מועד', o.billable ? null : 'לא לחיוב']),
      [ostTag(o.status), hrsNode(okHours({ orderId: o.id }))]);
  }
  function vOrders(f) {
    var st = S(), F = ['open', 'new', 'sched', 'work', 'done', 'closed', 'all'];
    if (F.indexOf(f) < 0) f = 'open';
    var list = st.orders.filter(function (o) { return f === 'all' ? true : f === 'open' ? isOpen(o) : o.status === f; })
      .slice().sort(function (a, b) { return (SORD[a.status] - SORD[b.status]) || ((a.date || '9') < (b.date || '9') ? -1 : 1); });
    function n(k) { return st.orders.filter(function (o) { return k === 'all' ? true : k === 'open' ? isOpen(o) : o.status === k; }).length; }
    var LB = { open: 'פתוחות', all: 'הכול' };
    return [
      head('הזמנות', null, linkBtn('הזמנה חדשה', 'plus', '#order/new', 'primary')),
      el('div', { class: 'chips', role: 'group', 'aria-label': 'סינון לפי מצב' }, F.map(function (k) {
        return el('button', { type: 'button', class: 'chip' + (k === f ? ' on' : ''), 'aria-pressed': k === f ? 'true' : 'false',
          onclick: function () { replace('#orders/' + k); } }, LB[k] || E.STATUS[k], el('small', null, L(String(n(k)))));
      })),
      el('div', { class: 'rows' }, list.length ? list.map(orderRow) : el('p', { class: 'empty' }, 'אין הזמנות במצב הזה'))
    ];
  }

  function entryRow(e, opts) {
    opts = opts || {};
    var o = order(e.orderId);
    var who = el('div', { class: 'who' },
      el('b', null, opts.showOrder === false ? stuName(e.stuId) : stuName(e.stuId)),
      el('small', null, join([opts.showOrder === false ? null : (o ? o.title : '—'), L(fdw(e.date)), timeRange(e), e.by === 'mgr' ? 'דווח ע״י המנהל.ת' : null, e.note || null])),
      el('div', { class: 'tags' }, opts.status ? estTag(e.status) : null, ui.fixed[e.id] ? el('span', { class: 'tag ink' }, ic('pen'), 'תוקן') : null, e.status !== 'no' ? alertTags(e) : null));
    return el('div', { class: 'erow' + (e.status === 'no' ? ' no' : '') }, who, hrsNode(e.hours), opts.acts || el('span'));
  }

  function vOrder(id) {
    var st = S(), isNew = id === 'new', o = isNew ? null : order(id);
    if (!isNew && !o) return [head('ההזמנה לא נמצאה', '#orders')];
    var d = o || { title: '', custId: null, typeId: st.biz.types[0] ? st.biz.types[0].id : '', date: '', billable: true, status: 'new', payRate: null, note: '', time: '', minutes: 0, serviceId: null, stuIds: [] };
    var fTitle = el('input', { value: d.title, maxlength: '80', required: true });
    var fCust = el('select', { value: d.custId || '' }, el('option', { value: '' }, 'עבודה פנימית (בלי לקוח)'),
      st.customers.map(function (c) { return el('option', { value: c.id }, c.name); }));
    var fType = el('select', { value: d.typeId }, st.biz.types.map(function (t) { return el('option', { value: t.id }, t.name + (t.pro ? ' · לתעודה' : '')); }));
    var fDate = el('input', { type: 'date', value: d.date || '' });
    var fBill = el('input', { type: 'checkbox', checked: !!d.billable });
    var fStatus = el('select', { value: d.status }, Object.keys(E.STATUS).map(function (k) { return el('option', { value: k }, E.STATUS[k]); }));
    var fPay = el('input', { type: 'number', min: '0', step: '0.5', inputmode: 'decimal', value: d.payRate === null || d.payRate === undefined ? '' : String(d.payRate), placeholder: 'לפי התלמיד.ה' });
    var fNote = el('textarea', { maxlength: '300', value: d.note || '' });
    var fTime = el('input', { type: 'time', value: d.time || '', step: '900' });
    var fMin = el('input', { type: 'number', min: '0', step: '15', inputmode: 'numeric', value: d.minutes ? String(d.minutes) : '' });
    var svcs = services();
    var fSvc = el('select', { value: d.serviceId || '' }, el('option', { value: '' }, 'בלי שירות'),
      svcs.map(function (s) { return el('option', { value: s.id }, s.name + ' · ' + s.minutes + ' דק׳'); }));
    fSvc.addEventListener('change', function () { var s = E.byId(svcs, fSvc.value); if (s) { fMin.value = String(s.minutes || ''); if (s.typeId) fType.value = s.typeId; } });
    var sel = {}; (d.stuIds || []).forEach(function (k) { sel[k] = 1; });
    var nSel = el('span', { class: 'count' });
    function updSel() { nSel.textContent = selIds(sel).length ? stuNames(selIds(sel)) : 'לא נבחרו'; }
    updSel();
    var stuBox = el('details', { class: 'fold full', style: 'grid-column:1/-1' }, el('summary', null, 'מי מבצע.ת', nSel), el('div', { class: 'fold-body' }, stuPicker(sel, updSel)));
    var msg = el('p', { class: 'form-msg', role: 'alert' });
    fCust.addEventListener('change', function () { if (!fCust.value) fBill.checked = false; });
    function save() {
      var t = fTitle.value.trim();
      if (!t) { msg.textContent = 'חסרה כותרת'; fTitle.focus(); return; }
      var pr = fPay.value.trim();
      if (pr !== '' && !(+pr >= 0)) { msg.textContent = 'תעריף לא תקין'; return; }
      if (fMin.value.trim() !== '' && !(+fMin.value >= 0)) { msg.textContent = 'משך לא תקין'; return; }
      if (fTime.value && !fDate.value) { msg.textContent = 'לתור צריך גם תאריך'; fDate.focus(); return; }
      var tgt = o || { id: E.uid() };
      tgt.title = t; tgt.custId = fCust.value || null; tgt.typeId = fType.value; tgt.date = fDate.value || '';
      tgt.billable = fBill.checked; tgt.status = fStatus.value; tgt.payRate = pr === '' ? null : +pr; tgt.note = fNote.value.trim();
      tgt.time = fTime.value || ''; tgt.minutes = +fMin.value || 0; tgt.serviceId = fSvc.value || null; tgt.stuIds = selIds(sel);
      if (!o) st.orders.push(tgt);
      E.save();
      toast(o ? 'ההזמנה נשמרה' : 'ההזמנה נוצרה');
      if (!o) replace('#order/' + tgt.id); else render(true);
    }
    var form = el('div', { class: 'card' },
      el('div', { class: 'form' },
        fld('כותרת', fTitle, true), fld('לקוח', fCust), fld('סוג עבודה', fType), fld('מועד', fDate), fld('שעה', fTime),
        fld('שירות', fSvc), fld('משך (דקות)', fMin), stuBox, fld('מצב', fStatus),
        fld('תעריף שכר להזמנה (₪ לשעה)', fPay), el('label', { class: 'chk' }, fBill, 'לחיוב'), fld('הערה', fNote, true)),
      msg, el('div', { class: 'btn-row' }, btn(isNew ? 'יצירת ההזמנה' : 'שמירה', 'check', save, 'primary')));
    var out = [head(isNew ? 'הזמנה חדשה' : o.title, '#orders')];
    if (!isNew && isAppt(o)) {
      var conf = conflictsOf(o);
      out.push(el('div', { class: 'appt-bar' },
        el('span', { class: 'grow' }, ic('cal'), ' תור · ', L(fd(o.date) + ' ' + o.time + '–' + apptEnd(o)),
          conf.length ? [' ', el('span', { class: 'tag amber' }, ic('alert'), 'מתנגש עם ' + conf.map(function (c) { return c.time + ' ' + c.title; }).join(', '))] : null),
        typeof E.logAppt === 'function' && o.status !== 'closed' ? btn('התור בוצע · רישום שעות', 'check', function () {
          if (!(o.stuIds || []).length) { toast('לא נבחרו תלמידים לתור'); return; }
          var made = E.logAppt(o.id) || [];
          toast(made.length ? 'נרשמו ' + made.length + ' דיווחים מאושרים' : 'השעות כבר רשומות · ההזמנה סומנה כהושלמה');
          render(true);
        }, 'ok') : null));
    }
    out.push(form);
    if (!isNew) {
      var all = E.entries({ orderId: o.id }).slice().sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
      var ok = all.filter(function (e) { return e.status === 'ok'; }), wt = all.filter(function (e) { return e.status === 'wait'; });
      var lim = ui.showAll[o.id] ? all.length : 8;
      out.push(
        sub('דיווחים על ההזמנה', el('span', { class: 'count' }, L(String(all.length)))),
        el('p', { class: 'hint' }, join([[L(fh(E.sumHours(ok))), ' שעות מאושרות'], [L(String(E.workDays(ok))), ' ימי-תלמיד'], wt.length ? [L(String(wt.length)), ' ממתינים'] : null])),
        el('div', { class: 'btn-row' }, linkBtn('הוספת שעות', 'plus', '#add/' + o.id)),
        el('div', { class: 'rows' }, all.length ? all.slice(0, lim).map(function (e) { return entryRow(e, { showOrder: false, status: true }); }) : el('p', { class: 'empty' }, 'אין עדיין דיווחים')),
        all.length > lim ? el('div', { class: 'btn-row' }, btn('הצגת כל ' + all.length, null, function () { ui.showAll[o.id] = 1; render(true); }, 'quiet')) : null
      );
    }
    return out;
  }

  /* הוספת שעות / דיווח במקום תלמיד.ה */
  function vAdd(orderId) {
    var st = S(), preset = orderId ? order(orderId) : null;
    var parent = preset ? '#order/' + preset.id : '#hours';
    var sel = {};
    var avail = st.orders.filter(function (o) { return o.status !== 'closed' || (preset && o.id === preset.id); });
    var fOrder = el('select', { value: preset ? preset.id : '' }, el('option', { value: '' }, 'בחירת הזמנה'),
      el('optgroup', { label: 'הזמנות של לקוחות' }, avail.filter(function (o) { return o.custId; }).map(function (o) { return el('option', { value: o.id }, o.title + ' · ' + custName(o)); })),
      el('optgroup', { label: 'עבודה פנימית' }, avail.filter(function (o) { return !o.custId; }).map(function (o) { return el('option', { value: o.id }, o.title); })));
    var fDate = el('input', { type: 'date', value: today(), max: today() });
    var fStart = el('input', { type: 'time', value: '09:00', step: '900' });
    var fEnd = el('input', { type: 'time', value: '13:00', step: '900' });
    var fHours = el('input', { type: 'number', min: '0.25', max: '24', step: '0.25', inputmode: 'decimal', value: '' });
    var fNote = el('input', { maxlength: '120' });
    var mode = 'time';
    var timeBox = el('div', { class: 'form', style: 'grid-column:1/-1' }, fld('משעה', fStart), fld('עד שעה', fEnd));
    var hoursBox = el('div', { class: 'form', style: 'grid-column:1/-1', hidden: true }, fld('מספר שעות', fHours));
    var segT, segH;
    function setMode(m) { mode = m; timeBox.hidden = m !== 'time'; hoursBox.hidden = m === 'time'; segT.classList.toggle('on', m === 'time'); segH.classList.toggle('on', m !== 'time'); segT.setAttribute('aria-pressed', m === 'time'); segH.setAttribute('aria-pressed', m !== 'time'); }
    segT = el('button', { type: 'button', class: 'on', 'aria-pressed': 'true', onclick: function () { setMode('time'); } }, 'משעה עד שעה');
    segH = el('button', { type: 'button', 'aria-pressed': 'false', onclick: function () { setMode('hours'); } }, 'מספר שעות');
    var countEl = el('span', { class: 'count' });
    var boxes = [];
    function upd() { var n = Object.keys(sel).length; countEl.textContent = 'נבחרו ' + n; }
    var classes = [];
    st.students.forEach(function (s) { if (classes.indexOf(s.cls) < 0) classes.push(s.cls); });
    var picks = classes.map(function (c) {
      var ss = st.students.filter(function (s) { return s.cls === c; });
      var cbs = ss.map(function (s) {
        var cb = el('input', { type: 'checkbox', onchange: function () { if (cb.checked) sel[s.id] = 1; else delete sel[s.id]; upd(); } });
        boxes.push(cb);
        return el('label', { class: 'chk' }, cb, s.name);
      });
      return el('div', { class: 'pick-grp' },
        el('h3', null, 'שכבה ' + c, btn('כל השכבה', null, function () {
          var allOn = ss.every(function (s) { return sel[s.id]; });
          ss.forEach(function (s, i) { cbs[i].firstChild.checked = !allOn; if (!allOn) sel[s.id] = 1; else delete sel[s.id]; });
          upd();
        }, 'sm quiet')),
        el('div', { class: 'picks' }, cbs));
    });
    upd();
    var msg = el('p', { class: 'form-msg', role: 'alert' });
    function save() {
      var ids = Object.keys(sel);
      if (!ids.length) { msg.textContent = 'לבחור לפחות תלמיד.ה אחד.ת'; return; }
      if (!fOrder.value) { msg.textContent = 'לבחור הזמנה'; fOrder.focus(); return; }
      if (!fDate.value) { msg.textContent = 'חסר תאריך'; return; }
      var rec = { orderId: fOrder.value, date: fDate.value, by: 'mgr', note: fNote.value.trim() };
      if (mode === 'time') {
        if (!fStart.value || !fEnd.value || !(E.hoursBetween(fStart.value, fEnd.value) > 0)) { msg.textContent = 'שעת הסיום צריכה להיות אחרי שעת ההתחלה'; return; }
        rec.start = fStart.value; rec.end = fEnd.value; rec.hours = E.hoursBetween(fStart.value, fEnd.value);
      } else {
        var h = +fHours.value;
        if (!(h > 0 && h <= 24)) { msg.textContent = 'מספר שעות לא תקין'; fHours.focus(); return; }
        rec.start = null; rec.end = null; rec.hours = h;
      }
      // שומרים לפי סדר הרשימה
      st.students.forEach(function (s) {
        if (!sel[s.id]) return;
        var r = {}; Object.keys(rec).forEach(function (k) { r[k] = rec[k]; }); r.stuId = s.id;
        E.addEntry(r);
      });
      toast('נוספו ' + ids.length + ' דיווחים · מאושרים');
      goBack(parent);
    }
    return [
      head(preset ? 'הוספת שעות' : 'דיווח במקום תלמיד.ה', parent),
      el('div', { class: 'card' },
        el('div', { class: 'form' },
          fld('הזמנה', fOrder, true), fld('תאריך', fDate),
          el('div', { class: 'fld' }, el('span', null, 'איך מדווחים'), el('div', { class: 'seg', role: 'group' }, segT, segH)),
          timeBox, hoursBox, fld('הערה', fNote, true))),
      el('div', { class: 'card' }, el('h2', { class: 'sub-h', style: 'margin-top:0' }, 'תלמידים', countEl), picks),
      msg,
      el('div', { class: 'btn-row' }, btn('שמירה', 'check', save, 'primary'), btn('ביטול', null, function () { goBack(parent); }, 'quiet'))
    ];
  }

  /* ---------- 3. לקוחות ---------- */
  function vCustomers() {
    var st = S(), ym = curYM();
    return [
      head('לקוחות', null, linkBtn('לקוח חדש', 'plus', '#customer/new', 'primary')),
      el('div', { class: 'rows' }, st.customers.length ? st.customers.map(function (c) {
        var op = st.orders.filter(function (o) { return o.custId === c.id && isOpen(o); }).length;
        return rowLink('#customer/' + c.id, null, c.name, join([c.contact && c.contact !== c.name ? c.contact : null, BILL[c.bill], billTerms(c)]),
          [el('span', { class: 'tag' + (op ? ' ink' : '') }, L(String(op)), ' פתוחות'), el('span', { class: 'tag' }, 'החודש ', L(fh(okHours({ custId: c.id, ym: ym }))), ' ש׳')]);
      }) : el('p', { class: 'empty' }, 'אין לקוחות'))
    ];
  }

  function vCustomer(id) {
    var st = S(), isNew = id === 'new', c = isNew ? null : E.byId(st.customers, id);
    if (!isNew && !c) return [head('הלקוח לא נמצא', '#customers')];
    var d = c || { name: '', contact: '', phone: '', bill: 'hours', rateHour: 0, rateDay: 0, note: '' };
    var fName = el('input', { value: d.name, maxlength: '80' });
    var fContact = el('input', { value: d.contact || '', maxlength: '60' });
    var fPhone = el('input', { type: 'tel', dir: 'ltr', value: d.phone || '', maxlength: '20', inputmode: 'tel' });
    var fBill = el('select', { value: d.bill }, Object.keys(BILL).map(function (k) { return el('option', { value: k }, BILL[k]); }));
    var fRH = el('input', { type: 'number', min: '0', step: '1', inputmode: 'decimal', value: String(d.rateHour || 0) });
    var fRD = el('input', { type: 'number', min: '0', step: '1', inputmode: 'decimal', value: String(d.rateDay || 0) });
    var fNote = el('textarea', { maxlength: '300', value: d.note || '' });
    var lRH = fld('₪ לשעה', fRH), lRD = fld('₪ ליום-תלמיד', fRD);
    function vis() { lRH.hidden = fBill.value === 'days'; lRD.hidden = fBill.value === 'hours'; }
    fBill.addEventListener('change', vis); vis();
    var msg = el('p', { class: 'form-msg', role: 'alert' });
    function save() {
      var n = fName.value.trim();
      if (!n) { msg.textContent = 'חסר שם'; fName.focus(); return; }
      if (!(+fRH.value >= 0) || !(+fRD.value >= 0)) { msg.textContent = 'תעריף לא תקין'; return; }
      var t = c || { id: E.uid() };
      t.name = n; t.contact = fContact.value.trim(); t.phone = fPhone.value.trim(); t.bill = fBill.value;
      t.rateHour = +fRH.value || 0; t.rateDay = +fRD.value || 0; t.note = fNote.value.trim();
      if (!c) st.customers.push(t);
      E.save(); toast(c ? 'הלקוח נשמר' : 'הלקוח נוסף');
      if (!c) replace('#customer/' + t.id); else render(true);
    }
    var out = [head(isNew ? 'לקוח חדש' : c.name, '#customers', isNew ? null : linkBtn('סיכום לחיוב', 'file', '#rep/bill/' + c.id, 'primary')),
      el('div', { class: 'card' },
        el('div', { class: 'form' }, fld('שם', fName, true), fld('איש.ת קשר', fContact), fld('טלפון', fPhone),
          fld('תנאי חיוב', fBill, true), lRH, lRD, fld('הערה', fNote, true)),
        msg, el('div', { class: 'btn-row' }, btn(isNew ? 'הוספת הלקוח' : 'שמירה', 'check', save, 'primary')))];
    if (!isNew) {
      var os = st.orders.filter(function (o) { return o.custId === c.id; }).sort(function (a, b) { return SORD[a.status] - SORD[b.status]; });
      out.push(sub('הזמנות', el('span', { class: 'count' }, L(String(os.length)))),
        el('div', { class: 'rows' }, os.length ? os.map(orderRow) : el('p', { class: 'empty' }, 'אין הזמנות')));
    }
    return out;
  }

  /* ---------- 4. שעות ---------- */
  function vHours() {
    var st = S();
    var waits = E.entries({ status: 'wait' }).slice().sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : (a.start || '') < (b.start || '') ? -1 : 1; });
    var miss = E.missing(curYM());
    function acts(e) {
      if (ui.editId === e.id) return null;
      return el('div', { class: 'acts' },
        btn('אישור', 'check', function () { E.setEntryStatus(e.id, 'ok'); toast('אושר'); render(true); }, 'sm ok'),
        btn('דחייה', 'x', function () { E.setEntryStatus(e.id, 'no'); toast('נדחה'); render(true); }, 'sm danger'),
        btn('תיקון', 'pen', function () { ui.editId = e.id; render(true); }, 'sm'));
    }
    function editor(e) {
      var fS = el('input', { type: 'time', value: e.start || '', step: '900' });
      var fE = el('input', { type: 'time', value: e.end || '', step: '900' });
      var fH = el('input', { type: 'number', min: '0.25', max: '24', step: '0.25', inputmode: 'decimal', value: String(e.hours) });
      var m = el('p', { class: 'form-msg', role: 'alert', style: 'flex-basis:100%' });
      function sync() { if (fS.value && fE.value) { var h = E.hoursBetween(fS.value, fE.value); if (h > 0) fH.value = String(h); } }
      fS.addEventListener('change', sync); fE.addEventListener('change', sync);
      // הקלדת מספר שעות ידנית גוברת על משעה/עד שעה
      fH.addEventListener('input', function () { fS.value = ''; fE.value = ''; });
      return el('div', { class: 'ed' }, fld('משעה', fS), fld('עד שעה', fE), fld('שעות', fH),
        btn('שמירה', 'check', function () {
          var h = +fH.value;
          if (fS.value && fE.value) { h = E.hoursBetween(fS.value, fE.value); if (!(h > 0)) { m.textContent = 'שעת הסיום לפני ההתחלה'; return; } }
          if (!(h > 0 && h <= 24)) { m.textContent = 'מספר שעות לא תקין'; return; }
          e.start = fS.value && fE.value ? fS.value : null; e.end = fS.value && fE.value ? fE.value : null; e.hours = r2(h);
          E.save(); ui.editId = null; ui.fixed[e.id] = 1; toast('עודכן ל-' + fh(e.hours) + ' שעות · ממתין לאישור'); render(true);
        }, 'sm primary'),
        btn('ביטול', null, function () { ui.editId = null; render(true); }, 'sm quiet'), m);
    }
    var openIds = Object.keys(st.open || {});
    var now = Date.now();
    return [
      head('שעות', null, linkBtn('דיווח במקום תלמיד.ה', 'plus', '#add', 'primary')),
      sub('ממתינות לאישור', el('span', { class: 'count' }, L(String(waits.length)))),
      waits.length > 1 ? el('div', { class: 'btn-row' }, btn('אישור הכול', 'check', function () {
        if (!window.confirm('לאשר ' + waits.length + ' דיווחים?')) return;
        waits.forEach(function (e) { E.setEntryStatus(e.id, 'ok'); });
        toast('אושרו ' + waits.length + ' דיווחים'); render(true);
      }, 'ok')) : null,
      el('div', { class: 'rows' }, waits.length ? waits.map(function (e) {
        var r = entryRow(e, { acts: acts(e) });
        if (ui.editId === e.id) r.appendChild(editor(e));
        return r;
      }) : el('p', { class: 'empty' }, 'אין דיווחים שממתינים')),
      sub('שעונים פתוחים', el('span', { class: 'count' }, L(String(openIds.length)))),
      el('div', { class: 'rows' }, openIds.length ? openIds.map(function (sid) {
        var op = st.open[sid], o = order(op.orderId), t0 = new Date(op.startISO);
        var mins = Math.max(0, Math.round((now - t0.getTime()) / 60000));
        var hh = ('0' + t0.getHours()).slice(-2) + ':' + ('0' + t0.getMinutes()).slice(-2);
        return el('div', { class: 'lrow' }, ic('clock'),
          el('div', { class: 'grow' }, el('b', { style: 'font-family:var(--head);color:var(--ink)' }, stuName(sid)),
            el('small', { style: 'display:block;color:var(--muted)' }, join([o ? o.title : '—', ['מ-', L(hh)], ['עברו ', L(Math.floor(mins / 60) + ':' + ('0' + mins % 60).slice(-2))]]))),
          btn('סגירה', 'stop', function () {
            var e = E.clockOut(sid);
            toast(e ? 'נרשמו ' + fh(e.hours) + ' שעות · ממתין לאישור' : 'השעון נסגר');
            render(true);
          }, 'sm'));
      }) : el('p', { class: 'empty' }, 'אין שעונים פתוחים')),
      sub('לא דיווחו החודש', el('span', { class: 'count' }, L(String(miss.length)), ' מתוך ', L(String(st.students.length)))),
      el('div', { class: 'rows' }, miss.length ? [
        el('div', { class: 'namelist' }, miss.map(function (s) { return el('span', { class: 'tag' }, s.name); })),
        el('div', { class: 'lrow' }, btn('העתקת השמות', 'copy', function () { copyText(miss.map(function (s) { return s.name; }).join('\n'), 'השמות הועתקו'); }, 'sm'))
      ] : el('p', { class: 'empty' }, 'כולם דיווחו החודש'))
    ];
  }

  /* ---------- 5. דוחות ---------- */
  function vReports() {
    return [head('דוחות'),
      el('div', { class: 'rows' },
        rowLink('#rep/sum', 'clock', 'סיכום שעות', 'יום / שבוע / חודש · לחיוב ולא לחיוב · לפי לקוח, תלמיד.ה, הזמנה'),
        rowLink('#rep/pay', 'wallet', 'דוח לחשבת השכר', 'חודש · שעות, ימי עבודה, תעריף, סה״כ'),
        rowLink('#rep/bill', 'file', 'סיכום לחיוב לקוח', 'לקוח וטווח תאריכים · מסמך להדפסה'),
        rowLink('#rep/cert', 'award', 'שעות מקצועיות לתעודה', 'לכל תלמיד.ה · סה״כ ולפי סוג עבודה'),
        rowLink('#rep/q', 'search', 'שאילתות', 'מועסקים לפי שכבה · שעות לפי סוג · השוואת תקופות'))];
  }

  /* טבלה + כלים. col: {label, num, cell(r)→node|text, text(r)→string} */
  function table(cols, rows, foot) {
    return el('div', { class: 'tbl-wrap' }, el('table', { class: 'tbl' },
      el('thead', null, el('tr', null, cols.map(function (c) { return el('th', { class: c.num ? 'n' : null, scope: 'col' }, c.label); }))),
      el('tbody', null, rows.length ? rows.map(function (r) {
        return el('tr', null, cols.map(function (c, i) {
          var v = c.cell ? c.cell(r) : c.text(r);
          return el('td', { class: (c.num ? 'n' : '') + (i === 0 ? ' nm' : ''), 'data-l': i ? c.label : null }, v === '' ? null : v);
        }));
      }) : el('tr', null, el('td', { colspan: String(cols.length) }, 'אין נתונים בתקופה'))),
      foot ? el('tfoot', null, el('tr', null, cols.map(function (c, i) {
        return el('td', { class: c.num ? 'n' : null, 'data-l': i && foot[i] !== '' ? c.label : null }, foot[i] === '' ? null : foot[i]);
      }))) : null));
  }
  function plain(cols, rows, foot) {
    var out = [cols.map(function (c) { return c.label; })];
    rows.forEach(function (r) { out.push(cols.map(function (c) { return String(c.text(r)); })); });
    if (foot) out.push(foot.map(function (v) { return v === undefined || v === null ? '' : (v instanceof Node ? v.textContent : String(v)); }));
    return out;
  }
  function tsv(lines) { return lines.map(function (l) { return l.map(function (v) { return String(v).replace(/[\t\n\r]+/g, ' '); }).join('\t'); }).join('\n'); }
  function tools(name, lines, extra) {
    return el('div', { class: 'rep-tools noprint' },
      btn('העתקה', 'copy', function () { copyText(tsv(lines), 'הטבלה הועתקה · אפשר להדביק באקסל'); }),
      btn('הורדת CSV', 'download', function () { download(name + '.csv', E.toCSV(lines.slice(1), lines[0])); }),
      btn('הדפסה', 'print', function () { window.print(); }),
      extra || null);
  }
  function printHead(title, period) {
    return el('div', { class: 'print-only doc-head' }, el('div', { class: 'dh-t' }, el('h2', null, title), el('small', null, S().biz.name + ' · ' + S().biz.school), el('small', null, period)),
      el('img', { src: 'logo-minhal.png', alt: '' }));
  }
  function printFoot() {
    return el('div', { class: 'print-only doc-foot' }, el('span', null, 'המרחב הפדגוגי · המנהל להכשרה מקצועית · משרד העבודה'), el('span', null, 'הופק ', L(fd(today()))));
  }
  function dateIn(val, on, label) { var i = el('input', { type: 'date', value: val, 'aria-label': label, onchange: function () { if (i.value) on(i.value); } }); return i; }

  function rPay() {
    var ym = ui.ym, rows = E.payroll(ym);
    function rateTxt(r) { return r.mixed ? 'משתנה (' + r.lines.map(function (l) { return fh(l.hours) + '×' + l.rate; }).join(', ') + ')' : r.rate + ' ₪'; }
    var cols = [
      { label: 'תלמיד.ה', cell: function (r) { return [r.stu.name, el('small', null, r.stu.cls)]; }, text: function (r) { return r.stu.name; } },
      { label: 'שעות', num: 1, cell: function (r) { return L(fh(r.hours)); }, text: function (r) { return fh(r.hours); } },
      { label: 'ימי עבודה', num: 1, cell: function (r) { return L(String(r.days)); }, text: function (r) { return r.days; } },
      { label: 'תעריף', num: 1, cell: function (r) {
        return r.mixed ? ['משתנה', el('small', null, r.lines.map(function (l) { return fh(l.hours) + ' ש׳ × ' + money(l.rate); }).join(' · '))] : L(money(r.rate));
      }, text: rateTxt },
      { label: 'סה״כ', num: 1, cell: function (r) { return L(money(r.total)); }, text: function (r) { return r2(r.total); } }
    ];
    var tH = 0, tD = 0, tT = 0; rows.forEach(function (r) { tH += r.hours; tD += r.days; tT += r.total; });
    var foot = ['סה״כ · ' + rows.length + ' תלמידים', L(fh(tH)), L(String(tD)), '', L(money(tT))];
    var footTxt = ['סה״כ', fh(tH), tD, '', r2(tT)];
    var lines = plain(cols, rows); lines.push(footTxt);
    return [
      head('דוח לחשבת השכר', '#reports'),
      el('div', { class: 'rep-ctl' }, fld('חודש', monthSelect(ym, function (v) { ui.ym = v; render(true); }))),
      tools('שכר-' + ym, lines),
      el('div', { class: 'print-area' }, printHead('דוח שעות ושכר לחשבת השכר', monthLabel(ym)), table(cols, rows, rows.length ? foot : null), printFoot()),
      el('p', { class: 'hint', style: 'margin-top:8px' }, 'רק דיווחים שאושרו')
    ];
  }

  function rBill(custId) {
    var st = S();
    var c = custId ? E.byId(st.customers, custId) : null;
    if (!c) c = st.customers[0];
    if (!c) return [head('סיכום לחיוב לקוח', '#reports'), el('p', { class: 'empty' }, 'אין לקוחות')];
    var from = ui.billFrom, to = ui.billTo;
    if (from > to) { var t = from; from = to; to = t; }
    var b = E.custBill(c.id, from, to);
    var rows = b.orders.filter(function (x) { return x.hours > 0 || x.days > 0; });
    var fCust = el('select', { value: c.id, 'aria-label': 'לקוח', onchange: function () { replace('#rep/bill/' + fCust.value); } },
      st.customers.map(function (x) { return el('option', { value: x.id }, x.name); }));
    var cols = [
      { label: 'הזמנה', cell: function (r) { return [r.order.title, el('small', null, typeName(r.order.typeId))]; }, text: function (r) { return r.order.title; } },
      { label: 'שעות', num: 1, cell: function (r) { return L(fh(r.hours)); }, text: function (r) { return fh(r.hours); } },
      { label: 'ימי-תלמיד', num: 1, cell: function (r) { return L(String(r.days)); }, text: function (r) { return r.days; } }
    ];
    var period = fd(from) + ' – ' + fd(to);
    var lines = [['סיכום לחיוב'], ['לקוח', b.cust.name], ['תקופה', period], ['תנאי חיוב', billTerms(b.cust)], []]
      .concat(plain(cols, rows)).concat([['סה״כ', fh(b.hours), b.days], [], ['לתשלום', r2(b.amount)]]);
    return [
      head('סיכום לחיוב לקוח', '#reports'),
      el('div', { class: 'rep-ctl' }, fld('לקוח', fCust), fld('מתאריך', dateIn(from, function (v) { ui.billFrom = v; render(true); }, 'מתאריך')),
        fld('עד תאריך', dateIn(to, function (v) { ui.billTo = v; render(true); }, 'עד תאריך'))),
      el('div', { class: 'rep-tools noprint' },
        btn('העתקה', 'copy', function () { copyText(tsv(lines), 'הסיכום הועתק'); }),
        btn('הדפסה', 'print', function () { window.print(); }, 'primary'),
        btn('הורדת CSV', 'download', function () { download('חיוב-' + b.cust.name + '.csv', E.toCSV(lines.slice(1), lines[0])); })),
      el('article', { class: 'doc print-area' },
        el('div', { class: 'doc-head' }, el('div', { class: 'dh-t' }, el('h2', null, 'סיכום לחיוב'), el('small', null, st.biz.name + ' · ' + st.biz.school)),
          el('img', { src: 'logo-minhal.png', alt: 'משרד העבודה · המנהל להכשרה מקצועית' })),
        el('dl', { class: 'kv' },
          el('dt', null, 'לקוח'), el('dd', null, b.cust.name),
          b.cust.contact ? [el('dt', null, 'איש.ת קשר'), el('dd', null, join([b.cust.contact, b.cust.phone ? L(b.cust.phone) : null]))] : null,
          el('dt', null, 'תקופה'), el('dd', null, L(period)),
          el('dt', null, 'תנאי חיוב'), el('dd', null, BILL[b.cust.bill] + ' · ' + billTerms(b.cust))),
        rows.length ? table(cols, rows, ['סה״כ', L(fh(b.hours)), L(String(b.days))]) : el('p', { class: 'empty' }, 'אין שעות מאושרות לחיוב בתקופה'),
        el('div', { class: 'doc-sum' },
          el('div', null, el('span', null, 'שעות'), el('b', null, L(fh(b.hours)))),
          el('div', null, el('span', null, 'ימי-תלמיד'), el('b', null, L(String(b.days)))),
          el('div', { class: 'tot' }, el('span', null, 'לתשלום'), el('b', null, L(money(b.amount))))),
        el('div', { class: 'doc-foot' }, el('span', null, 'המרחב הפדגוגי · המנהל להכשרה מקצועית · משרד העבודה'),
          el('span', null, 'הופק ', L(fd(today())), ' · ', st.biz.manager)))
    ];
  }

  function rCert() {
    var st = S(), pro = st.biz.types.filter(function (t) { return t.pro; });
    var rows = st.students.map(function (s) {
      var by = {};
      E.entries({ stuId: s.id, status: 'ok' }).forEach(function (e) {
        var o = order(e.orderId); if (!o) return;
        (by[o.typeId] = by[o.typeId] || []).push(e);
      });
      var r = { stu: s, total: E.certHours(s.id) };
      pro.forEach(function (t) { r[t.id] = by[t.id] ? E.sumHours(by[t.id]) : 0; });
      return r;
    }).sort(function (a, b) { return b.total - a.total; });
    var cols = [
      { label: 'תלמיד.ה', cell: function (r) { return [r.stu.name, el('small', null, r.stu.cls)]; }, text: function (r) { return r.stu.name; } },
      { label: 'שכבה', text: function (r) { return r.stu.cls; }, cell: function (r) { return r.stu.cls; } },
      { label: 'סה״כ לתעודה', num: 1, cell: function (r) { return el('b', null, L(fh(r.total))); }, text: function (r) { return fh(r.total); } }
    ].concat(pro.map(function (t) {
      return { label: t.name, num: 1, cell: function (r) { return r[t.id] ? L(fh(r[t.id])) : ''; }, text: function (r) { return fh(r[t.id]); } };
    }));
    // שכבה מופיעה כבר מתחת לשם; משאירים לעמודת ההעתקה בלבד
    var shown = cols.filter(function (c, i) { return i !== 1; });
    return [
      head('שעות מקצועיות לתעודה', '#reports'),
      el('p', { class: 'hint' }, 'שעות מאושרות בסוגי עבודה שנספרים לתעודה · מתחילת השנה'),
      tools('שעות-לתעודה', plain(cols, rows)),
      el('div', { class: 'print-area' }, printHead('שעות מקצועיות לתעודה', 'מתחילת השנה עד ' + fd(today())), table(shown, rows), printFoot())
    ];
  }

  function rQ(tab) {
    var T = [['emp', 'מועסקים לפי שכבה'], ['type', 'שעות לפי סוג עבודה'], ['cmp', 'השוואת תקופות']];
    if (!T.some(function (t) { return t[0] === tab; })) tab = 'emp';
    var out = [head('שאילתות', '#reports'),
      el('div', { class: 'chips noprint', role: 'group', 'aria-label': 'שאילתה' }, T.map(function (t) {
        return el('button', { type: 'button', class: 'chip' + (t[0] === tab ? ' on' : ''), 'aria-pressed': t[0] === tab ? 'true' : 'false', onclick: function () { replace('#rep/q/' + t[0]); } }, t[1]);
      }))];
    if (tab === 'emp') {
      var ym = ui.empYM, rows = E.employedByClass(ym);
      var cols = [{ label: 'שכבה', text: function (r) { return r.cls; } }, { label: 'מועסקים', num: 1, text: function (r) { return r.employed; } },
        { label: 'תלמידים בעסק', num: 1, text: function (r) { return r.total; } }, { label: 'אחוז', num: 1, text: function (r) { return r.pct + '%'; } }];
      out.push(el('div', { class: 'rep-ctl' }, fld('חודש', monthSelect(ym, function (v) { ui.empYM = v; render(true); }))),
        tools('מועסקים-' + ym, plain(cols, rows)),
        el('div', { class: 'print-area' }, printHead('אחוז מועסקים לפי שכבה', monthLabel(ym)),
          el('div', { class: 'meters' }, rows.map(function (r) {
            return meter({ icon: 'users', label: 'שכבה ' + r.cls, part: r.employed, total: r.total, unit: 'מועסקים', sub: [L(r.pct + '%'), ' · לפחות דיווח מאושר אחד בחודש'] });
          })), printFoot()));
    } else if (tab === 'type') {
      var from = ui.typeFrom, to = ui.typeTo; if (from > to) { var x = from; from = to; to = x; }
      var tr = E.hoursByType(from, to).filter(function (r) { return r.hours > 0; }).sort(function (a, b) { return b.hours - a.hours; });
      var tc = [
        { label: 'סוג עבודה', cell: function (r) { return [r.type.name, r.type.pro ? el('small', null, 'נספר לתעודה') : null]; }, text: function (r) { return r.type.name; } },
        { label: 'שעות', num: 1, cell: function (r) { return L(fh(r.hours)); }, text: function (r) { return fh(r.hours); } },
        { label: 'לחיוב', num: 1, cell: function (r) { return L(fh(r.billable)); }, text: function (r) { return fh(r.billable); } },
        { label: 'לא לחיוב', num: 1, cell: function (r) { return L(fh(r.nonBillable)); }, text: function (r) { return fh(r.nonBillable); } },
        { label: 'הזמנות', num: 1, cell: function (r) { return L(String(r.orders)); }, text: function (r) { return r.orders; } },
        { label: 'ממוצע להזמנה', num: 1, cell: function (r) { return L(fh(r.avgPerOrder)); }, text: function (r) { return fh(r.avgPerOrder); } },
        { label: 'עלות שכר', num: 1, cell: function (r) { return L(money(r.cost)); }, text: function (r) { return r2(r.cost); } }
      ];
      var s = { h: 0, b: 0, n: 0, c: 0 }; tr.forEach(function (r) { s.h += r.hours; s.b += r.billable; s.n += r.nonBillable; s.c += r.cost; });
      var lines = plain(tc, tr); lines.push(['סה״כ', fh(s.h), fh(s.b), fh(s.n), '', '', r2(s.c)]);
      out.push(el('div', { class: 'rep-ctl' }, fld('מתאריך', dateIn(from, function (v) { ui.typeFrom = v; render(true); }, 'מתאריך')),
        fld('עד תאריך', dateIn(to, function (v) { ui.typeTo = v; render(true); }, 'עד תאריך'))),
        tools('שעות-לפי-סוג', lines),
        el('div', { class: 'print-area' }, printHead('שעות לפי סוג עבודה', fd(from) + ' – ' + fd(to)),
          table(tc, tr, tr.length ? ['סה״כ', L(fh(s.h)), L(fh(s.b)), L(fh(s.n)), '', '', L(money(s.c))] : null), printFoot()));
    } else {
      var A = ui.cmpA, B = ui.cmpB, cp = E.comparePeriods(A, B);
      var M = [['hours', 'שעות'], ['billable', 'שעות לחיוב'], ['days', 'ימי-תלמיד'], ['students', 'תלמידים שעבדו'], ['orders', 'הזמנות']];
      var rows2 = M.map(function (m) { return { k: m[0], label: m[1], a: cp.a[m[0]], b: cp.b[m[0]] }; });
      function diff(r) { var d = r2(r.a - r.b); return (d > 0 ? '+' : '') + fh(d); }
      var pa = fd(A.from) + ' – ' + fd(A.to), pb = fd(B.from) + ' – ' + fd(B.to);
      var cc = [
        { label: 'מדד', text: function (r) { return r.label; } },
        { label: 'תקופה א׳', num: 1, cell: function (r) { return L(fh(r.a)); }, text: function (r) { return fh(r.a); } },
        { label: 'תקופה ב׳', num: 1, cell: function (r) { return L(fh(r.b)); }, text: function (r) { return fh(r.b); } },
        { label: 'שינוי', num: 1, cell: function (r) { return L(diff(r)); }, text: diff }
      ];
      function per(lbl, P, key) {
        return el('div', { class: 'fld' }, el('span', null, lbl),
          el('div', { style: 'display:flex;gap:6px;flex-wrap:wrap' },
            dateIn(P.from, function (v) { ui[key] = { from: v, to: P.to }; render(true); }, lbl + ' מתאריך'),
            dateIn(P.to, function (v) { ui[key] = { from: P.from, to: v }; render(true); }, lbl + ' עד תאריך')));
      }
      var cl = [['', 'תקופה א׳ ' + pa, 'תקופה ב׳ ' + pb, 'שינוי']].concat(rows2.map(function (r) { return [r.label, fh(r.a), fh(r.b), diff(r)]; }));
      out.push(el('div', { class: 'rep-ctl' }, per('תקופה א׳', A, 'cmpA'), per('תקופה ב׳', B, 'cmpB')),
        tools('השוואת-תקופות', cl),
        el('div', { class: 'print-area' }, printHead('השוואה בין תקופות', 'א׳ ' + pa + ' · ב׳ ' + pb),
          table(cc, rows2), printFoot()),
        el('p', { class: 'hint', style: 'margin-top:8px' }, 'א׳ ', L(pa), ' · ב׳ ', L(pb)));
    }
    return out;
  }

  /* ---------- סיכום שעות עם חתכים (תוספת 2) ---------- */
  var SUM_BY = { cust: 'לקוח', stu: 'תלמיד.ה', order: 'הזמנה', type: 'סוג עבודה', date: 'תאריך' };
  var SUM_P = { day: 'יום', week: 'שבוע', month: 'חודש' };
  function sumState() {
    var q = curQuery, l = ui.sum || {};
    var s = {
      p: SUM_P[q.p] ? q.p : (l.p || 'month'),
      d: /^\d{4}-\d{2}-\d{2}$/.test(q.d || '') ? q.d : (l.d || today()),
      c: q.c || l.c || 'all',
      b: { all: 1, yes: 1, no: 1 }[q.b] ? q.b : (l.b || 'all'),
      by: SUM_BY[q.by] ? q.by : (l.by || 'cust'),
      then: (SUM_BY[q.then] || q.then === 'none') ? q.then : (l.then || 'stu')
    };
    if (s.c !== 'all' && s.c !== 'internal' && !E.byId(S().customers, s.c)) s.c = 'all';
    if (s.then === s.by) s.then = 'none';
    return s;
  }
  function sumHash(s) {
    return '#rep/sum?' + ['p', 'd', 'c', 'b', 'by', 'then'].map(function (k) { return k + '=' + encodeURIComponent(s[k]); }).join('&');
  }
  function sumRange(s) {
    if (s.p === 'day') return { from: s.d, to: s.d };
    if (s.p === 'week') return E.weekRange(s.d);
    return E.monthRange(s.d.slice(0, 7));
  }
  function sumLabel(s, r) {
    if (s.p === 'day') return 'יום ' + WDL[pd(s.d).getDay()] + ' ' + fd(s.d);
    if (s.p === 'week') return fd(r.from) + ' – ' + fd(r.to);
    return monthLabel(s.d.slice(0, 7));
  }
  function sumShift(s, k) {
    if (s.p === 'day') return addD(s.d, k);
    if (s.p === 'week') return addD(s.d, 7 * k);
    return monthFrom(shiftYM(s.d.slice(0, 7), k));
  }
  function svgEl(tag, a) {
    var n = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.keys(a || {}).forEach(function (k) { n.setAttribute(k, a[k]); });
    for (var i = 2; i < arguments.length; i++) if (arguments[i]) n.appendChild(arguments[i]);
    return n;
  }
  function sumChart(days, p) {
    var n = days.length, max = 0;
    days.forEach(function (x) { max = Math.max(max, x.billable + x.nonBillable); });
    var top = max <= 4 ? 4 : max <= 8 ? 8 : Math.ceil(max / 4) * 4, H = 100, W = n * 10;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, preserveAspectRatio: 'none', class: 'chart-svg', role: 'img',
      'aria-label': 'שעות לפי יום · לחיוב ולא לחיוב' });
    [0.5, 1].forEach(function (f) { svg.appendChild(svgEl('line', { x1: 0, x2: W, y1: H - H * f, y2: H - H * f, class: 'grid', 'vector-effect': 'non-scaling-stroke' })); });
    days.forEach(function (x, i) {
      var hb = H * x.billable / top, hn = H * x.nonBillable / top, xx = i * 10 + 2;
      var g = svgEl('g', null, svgEl('title'));
      g.firstChild.textContent = fdw(x.date) + ' · לחיוב ' + fh(x.billable) + ' · לא לחיוב ' + fh(x.nonBillable);
      if (hb) g.appendChild(svgEl('rect', { x: xx, y: H - hb, width: 6, height: hb, class: 'b1' }));
      if (hn) g.appendChild(svgEl('rect', { x: xx, y: H - hb - hn, width: 6, height: hn, class: 'b2' }));
      svg.appendChild(g);
    });
    var labels = el('div', { class: 'chart-x', style: 'grid-template-columns:repeat(' + n + ',minmax(0,1fr))', 'aria-hidden': 'true' }, days.map(function (x) {
      var dd = pd(x.date).getDate();
      return el('span', { class: p === 'month' && !(dd === 1 || dd % 5 === 0) ? 'sk' : null }, p === 'week' ? [WD[pd(x.date).getDay()], el('br'), String(dd)] : String(dd));
    }));
    return el('div', { class: 'chart' },
      el('div', { class: 'chart-top' }, el('span', { class: 'legend' }, el('span', null, el('i'), 'לחיוב'), el('span', null, el('i', { class: 'b2' }), 'לא לחיוב')),
        el('span', { class: 'chart-max' }, 'קו עליון ', L(String(top)), ' ש׳ · אמצעי ', L(fh(top / 2)))),
      el('div', { class: 'chart-plot' }, svg), labels);
  }

  function rSum() {
    var st = S(), s = sumState();
    ui.sum = s;
    var r = sumRange(s);
    var res = E.summary({ from: r.from, to: r.to, custId: s.c === 'all' ? undefined : s.c,
      bill: s.b === 'all' ? undefined : s.b === 'yes', by: s.by, then: s.then === 'none' ? null : s.then });
    function set(k, v) { var x = {}; Object.keys(s).forEach(function (kk) { x[kk] = s[kk]; }); x[k] = v; if (k === 'by' && x.then === v) x.then = 'none'; replace(sumHash(x)); }
    function lbl(kind, g) { return kind === 'date' ? fdw(g.label) : (g.label || '—'); }
    var period = sumLabel(s, r);
    var custTxt = s.c === 'all' ? 'כל הלקוחות' : s.c === 'internal' ? 'עבודה פנימית' : E.byId(st.customers, s.c).name;
    var billTxt = { all: 'חיוב: הכול', yes: 'רק לחיוב', no: 'רק לא לחיוב' }[s.b];
    var filt = custTxt + ' · ' + billTxt;
    var openKey = function (g) { return s.by + ':' + g.key; };
    ui.sumOpen = ui.sumOpen || {};
    var thenKind = s.then === 'none' ? null : s.then;

    // מתג תקופה
    var pSeg = el('div', { class: 'seg', role: 'group', 'aria-label': 'תקופה' }, Object.keys(SUM_P).map(function (k) {
      return el('button', { type: 'button', class: k === s.p ? 'on' : null, 'aria-pressed': k === s.p ? 'true' : 'false', onclick: function () { set('p', k); } }, SUM_P[k]);
    }));
    var fCust = el('select', { value: s.c, onchange: function () { set('c', fCust.value); } },
      el('option', { value: 'all' }, 'כל הלקוחות'), st.customers.map(function (c) { return el('option', { value: c.id }, c.name); }),
      el('option', { value: 'internal' }, 'עבודה פנימית'));
    var fBill = el('select', { value: s.b, onchange: function () { set('b', fBill.value); } },
      el('option', { value: 'all' }, 'הכול'), el('option', { value: 'yes' }, 'לחיוב'), el('option', { value: 'no' }, 'לא לחיוב'));
    var fBy = el('select', { value: s.by, onchange: function () { set('by', fBy.value); } }, Object.keys(SUM_BY).map(function (k) { return el('option', { value: k }, SUM_BY[k]); }));
    var fThen = el('select', { value: s.then, onchange: function () { set('then', fThen.value); } }, el('option', { value: 'none' }, 'בלי'),
      Object.keys(SUM_BY).filter(function (k) { return k !== s.by; }).map(function (k) { return el('option', { value: k }, SUM_BY[k]); }));

    // שורת סיכום
    var bp = res.hours ? Math.round(res.billable * 100 / res.hours) : 0;
    var sp = res.totalStudents ? Math.round(res.students * 100 / res.totalStudents) : 0;
    var strip = el('div', { class: 'strip' },
      el('div', { class: 'st-cell' }, el('span', { class: 'm-l' }, 'סה״כ שעות'), el('b', { class: 'st-big' }, L(fh(res.hours)))),
      el('div', { class: 'st-cell wide' }, el('span', { class: 'm-l' }, 'לחיוב מול לא לחיוב'),
        el('span', { class: 'bar', role: 'img', 'aria-label': bp + '% לחיוב' }, el('i', { style: 'width:' + bp + '%' }), el('i', { class: 'b2', style: 'width:' + (res.hours ? 100 - bp : 0) + '%' })),
        el('span', { class: 'legend' }, el('span', null, el('i'), 'לחיוב ', L(fh(res.billable))), el('span', null, el('i', { class: 'b2' }), 'לא לחיוב ', L(fh(res.nonBillable))))),
      el('div', { class: 'st-cell' }, el('span', { class: 'm-l' }, 'עבדו'),
        el('span', { class: 'st-mid' }, el('b', null, L(String(res.students))), ' מתוך ', L(String(res.totalStudents))),
        el('span', { class: 'bar', role: 'img', 'aria-label': sp + '%' }, el('i', { style: 'width:' + sp + '%' }))),
      el('div', { class: 'st-cell' }, el('span', { class: 'm-l' }, 'ימי עבודה'), el('b', { class: 'st-big' }, L(String(res.days))), el('small', { class: 'hint' }, 'ימי-תלמיד')));

    // טבלה
    function cells(x, isKid, kind, hasKids, open, onToggle) {
      var name = lbl(kind, x);
      var subTxt = 'לחיוב ' + fh(x.billable) + ' · לא לחיוב ' + fh(x.nonBillable) + ' · ' + x.students + ' תלמידים · ' + x.days + ' ימים';
      var nameCell = hasKids
        ? el('button', { type: 'button', class: 'sg-name', 'aria-expanded': open ? 'true' : 'false', onclick: onToggle }, el('span', { class: 'sg-chev', 'aria-hidden': 'true' }), el('span', null, name))
        : el('span', { class: 'sg-name' + (isKid ? ' kid' : '') }, el('span', null, name));
      return el('div', { class: 'sg-row' + (isKid ? ' kid' : '') + (hasKids && open ? ' open' : '') },
        nameCell, el('span', { class: 'n hrs-c' }, L(fh(x.hours))), el('span', { class: 'n c2' }, L(fh(x.billable))), el('span', { class: 'n c2' }, L(fh(x.nonBillable))),
        el('span', { class: 'n c2' }, L(String(x.students))), el('span', { class: 'n c2' }, L(String(x.days))),
        el('small', { class: 'sg-sub' }, subTxt));
    }
    var body = res.groups.map(function (g) {
      var kids = g.children || [], k = openKey(g), open = !!ui.sumOpen[k];
      return el('div', { class: 'sg-grp' },
        cells(g, false, s.by, !!kids.length, open, function () { if (ui.sumOpen[k]) delete ui.sumOpen[k]; else ui.sumOpen[k] = 1; render(true); }),
        kids.length ? el('div', { class: 'sg-kids', hidden: !open }, kids.map(function (c) { return cells(c, true, thenKind, false); })) : null);
    });
    var anyKids = res.groups.some(function (g) { return (g.children || []).length; });
    var allOpen = anyKids && res.groups.every(function (g) { return !(g.children || []).length || ui.sumOpen[openKey(g)]; });
    var table2 = el('div', { class: 'sg' },
      el('div', { class: 'sg-row sg-head' }, el('span', null, SUM_BY[s.by] + (thenKind ? ' ← ' + SUM_BY[thenKind] : '')), el('span', { class: 'n' }, 'שעות'),
        el('span', { class: 'n c2' }, 'לחיוב'), el('span', { class: 'n c2' }, 'לא לחיוב'), el('span', { class: 'n c2' }, 'תלמידים'), el('span', { class: 'n c2' }, 'ימים')),
      body.length ? body : el('p', { class: 'empty' }, 'אין שעות מאושרות בתקופה ובסינון הזה'),
      body.length ? cells({ label: 'סה״כ', hours: res.hours, billable: res.billable, nonBillable: res.nonBillable, students: res.students, days: res.days }, false, 'x', false) : null);
    if (body.length) table2.lastChild.classList.add('sg-tot');

    // העתקה / CSV
    var head2 = [SUM_BY[s.by], thenKind ? SUM_BY[thenKind] : '', 'שעות', 'לחיוב', 'לא לחיוב', 'תלמידים', 'ימים'];
    var rows2 = [];
    res.groups.forEach(function (g) {
      rows2.push([lbl(s.by, g), '', fh(g.hours), fh(g.billable), fh(g.nonBillable), g.students, g.days]);
      (g.children || []).forEach(function (c) { rows2.push([lbl(s.by, g), lbl(thenKind, c), fh(c.hours), fh(c.billable), fh(c.nonBillable), c.students, c.days]); });
    });
    rows2.push(['סה״כ', '', fh(res.hours), fh(res.billable), fh(res.nonBillable), res.students, res.days]);
    var tsvLines = [['סיכום שעות', st.biz.name], ['תקופה', period], ['סינון', filt], []].concat([head2]).concat(rows2);

    return [
      head('סיכום שעות', '#reports'),
      el('div', { class: 'sum-ctl noprint' },
        el('div', { class: 'sum-per' }, pSeg,
          el('div', { class: 'sum-nav' },
            btn('קודם', 'back', function () { set('d', sumShift(s, -1)); }, 'sm quiet ic-only', { 'aria-label': SUM_P[s.p] + ' קודם' }),
            el('b', { class: 'sum-lbl' }, L(period)),
            btn('הבא', 'fwd', function () { set('d', sumShift(s, 1)); }, 'sm quiet ic-only', { 'aria-label': SUM_P[s.p] + ' הבא' })),
          btn('היום', null, function () { set('d', today()); }, 'sm')),
        el('div', { class: 'rep-ctl' }, fld('לקוח', fCust), fld('חיוב', fBill), fld('קיבוץ לפי', fBy), fld('ואז לפי', fThen))),
      el('div', { class: 'print-area' },
        printHead('סיכום שעות', period + ' · ' + filt),
        strip,
        s.p !== 'day' ? sumChart(res.byDay, s.p) : null,
        el('div', { class: 'sum-tools noprint' },
          anyKids ? btn(allOpen ? 'סגירת הכול' : 'פתיחת הכול', null, function () {
            res.groups.forEach(function (g) { if ((g.children || []).length) { if (allOpen) delete ui.sumOpen[openKey(g)]; else ui.sumOpen[openKey(g)] = 1; } });
            render(true);
          }, 'sm quiet') : null,
          el('span', { class: 'grow' }),
          btn('העתקה', 'copy', function () { copyText(tsv(tsvLines), 'הסיכום הועתק · אפשר להדביק באקסל'); }, 'sm'),
          btn('הורדת CSV', 'download', function () { download('סיכום-שעות-' + r.from + '.csv', E.toCSV(rows2, head2)); }, 'sm'),
          btn('הדפסה', 'print', function () { window.print(); }, 'sm')),
        table2,
        printFoot())
    ];
  }

  function vRep(which, arg) {
    if (which === 'sum') return rSum();
    if (which === 'pay') return rPay();
    if (which === 'bill') return rBill(arg);
    if (which === 'cert') return rCert();
    if (which === 'q') return rQ(arg);
    return vReports();
  }

  /* ---------- יומן תורים ---------- */
  function hasCal() { return typeof E.appts === 'function' && typeof E.slots === 'function'; }
  function services() { return Array.isArray(S().biz.services) ? S().biz.services : []; }
  var DEF_HOURS = { days: [0, 1, 2, 3, 4], open: '08:00', close: '16:00' };
  function bizHours() { var h = S().biz.hours; return h && Array.isArray(h.days) ? h : DEF_HOURS; }
  function isAppt(o) { return !!(o && o.date && o.time); }
  function apptEnd(o) { try { return typeof E.apptEnd === 'function' ? E.apptEnd(o) : o.time; } catch (e) { return o.time; } }
  function conflictsOf(o) { try { return typeof E.conflicts === 'function' ? (E.conflicts(o) || []) : []; } catch (e) { return []; } }
  function serviceName(id) { var s = id ? E.byId(services(), id) : null; return s ? s.name : ''; }
  function stuNames(ids) { return (ids || []).map(stuName).join(', '); }
  var WDL = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  function addD(s, n) { var d = pd(s); d.setDate(d.getDate() + n); return ymd(d); }
  function validDate(s) { return /^\d{4}-\d{2}-\d{2}$/.test(s || '') ? s : today(); }
  function dayOpen(x) { return bizHours().days.indexOf(pd(x).getDay()) >= 0; }
  function nowHM() { var d = new Date(); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  function noCal(title) { return [head(title || 'יומן'), el('p', { class: 'empty' }, 'היומן עדיין לא זמין בקובץ הנתונים')]; }

  function apptRow(o) {
    var sv = serviceName(o.serviceId), conf = conflictsOf(o).length;
    return el('a', { class: 'rowbtn noic', href: '#order/' + o.id },
      el('b', null, L(o.time + '–' + apptEnd(o)), ' · ', o.title),
      el('span', { class: 'rtag' }, conf ? el('span', { class: 'tag amber' }, ic('alert'), 'מתנגש') : null, ostTag(o.status)),
      el('span', { class: 'arr', 'aria-hidden': 'true' }),
      el('small', null, join([custName(o), sv && sv !== o.title ? sv : null, (o.stuIds || []).length ? stuNames(o.stuIds) : 'לא שובצו תלמידים'])));
  }

  function vCal(d) {
    if (!hasCal()) return noCal();
    d = validDate(d);
    var t = today(), wk0 = addD(d, -pd(d).getDay());
    var days = [];
    for (var i = 0; i < 7; i++) days.push(addD(wk0, i));
    var strip = el('div', { class: 'week', role: 'group', 'aria-label': 'השבוע' }, days.map(function (x) {
      var n = E.appts(x).length;
      return el('button', { type: 'button', class: 'wd' + (x === d ? ' on' : '') + (x === t ? ' today' : '') + (dayOpen(x) ? '' : ' off'),
        'aria-pressed': x === d ? 'true' : 'false', 'aria-label': 'יום ' + WDL[pd(x).getDay()] + ' ' + fd(x) + ' · ' + n + ' תורים',
        onclick: function () { replace('#cal/' + x); } },
        el('span', null, WD[pd(x).getDay()]), el('b', null, L(String(pd(x).getDate()))),
        el('small', null, n ? L(String(n)) : '·'));
    }));
    var list = E.appts(d) || [];
    var body;
    if (!dayOpen(d) && !list.length) body = el('p', { class: 'empty' }, 'העסק סגור ביום זה');
    else body = list.length ? list.map(apptRow) : el('p', { class: 'empty' }, 'אין תורים ביום זה');
    return [
      head('יומן', null, linkBtn('תור חדש', 'plus', '#appt/new?date=' + d, 'primary')),
      el('div', { class: 'cal-nav' },
        btn('יום קודם', 'back', function () { replace('#cal/' + addD(d, -1)); }, 'sm quiet', { 'aria-label': 'יום קודם' }),
        el('h2', { class: 'cal-day' }, 'יום ' + WDL[pd(d).getDay()] + ' ', L(fd(d)), d === t ? el('span', { class: 'tag ink' }, 'היום') : null),
        btn('יום הבא', 'fwd', function () { replace('#cal/' + addD(d, 1)); }, 'sm quiet', { 'aria-label': 'יום הבא' })),
      strip,
      d !== t ? el('div', { class: 'btn-row' }, btn('חזרה להיום', null, function () { replace('#cal/' + t); }, 'sm quiet')) : null,
      el('div', { class: 'rows', style: 'margin-top:10px' }, body)
    ];
  }

  function stuPicker(sel, onch) {
    var st = S(), classes = [];
    st.students.forEach(function (s) { if (classes.indexOf(s.cls) < 0) classes.push(s.cls); });
    return classes.map(function (c) {
      return el('div', { class: 'pick-grp' }, el('h3', null, 'שכבה ' + c),
        el('div', { class: 'picks' }, st.students.filter(function (s) { return s.cls === c; }).map(function (s) {
          var cb = el('input', { type: 'checkbox', checked: !!sel[s.id], onchange: function () { if (cb.checked) sel[s.id] = 1; else delete sel[s.id]; if (onch) onch(); } });
          return el('label', { class: 'chk' }, cb, s.name);
        })));
    });
  }
  function selIds(sel) { return S().students.filter(function (s) { return sel[s.id]; }).map(function (s) { return s.id; }); }

  function vAppt() {
    if (!hasCal()) return noCal('תור חדש');
    var st = S(), svcs = services(), date = validDate(curQuery.date || today());
    var parent = '#cal/' + date;
    var fCust = el('select', { value: '' }, el('option', { value: '' }, 'בחירת לקוח'),
      st.customers.map(function (c) { return el('option', { value: c.id }, c.name); }),
      el('option', { value: '__new' }, '+ לקוח חדש'));
    var fNName = el('input', { maxlength: '80' }), fNPhone = el('input', { type: 'tel', dir: 'ltr', inputmode: 'tel', maxlength: '20' });
    var newBox = el('div', { class: 'form', style: 'grid-column:1/-1', hidden: true }, fld('שם הלקוח', fNName), fld('טלפון', fNPhone));
    var fSvc = el('select', { value: '' }, el('option', { value: '' }, 'בלי שירות'),
      svcs.map(function (s) { return el('option', { value: s.id }, s.name + ' · ' + s.minutes + ' דק׳' + (s.price ? ' · ' + money(s.price) : '')); }));
    var fTitle = el('input', { maxlength: '80' });
    var fType = el('select', { value: st.biz.types[0] ? st.biz.types[0].id : '' }, st.biz.types.map(function (t) { return el('option', { value: t.id }, t.name); }));
    var fMin = el('input', { type: 'number', min: '15', step: '15', inputmode: 'numeric', value: '60' });
    var fDate = el('input', { type: 'date', value: date });
    var fTime = el('select', { 'aria-label': 'שעה' });
    var fBill = el('input', { type: 'checkbox', checked: true });
    var sel = {};
    var warn = el('p', { class: 'form-warn', role: 'status' });
    var msg = el('p', { class: 'form-msg', role: 'alert' });
    var lastAuto = '';
    function temp() {
      return { id: '__tmp', custId: fCust.value && fCust.value !== '__new' ? fCust.value : null, title: fTitle.value.trim(), typeId: fType.value,
        date: fDate.value, time: fTime.value, minutes: +fMin.value || 0, serviceId: fSvc.value || null, stuIds: selIds(sel),
        billable: fBill.checked, status: 'sched', payRate: null, note: '' };
    }
    function check() {
      warn.textContent = '';
      if (!fTime.value || !fDate.value) return;
      var c = conflictsOf(temp());
      if (c.length) warn.textContent = 'מתנגש עם ' + c.map(function (o) { return o.time + ' ' + o.title; }).join(', ') + ' · אפשר לשמור בכל זאת';
    }
    function fillSlots() {
      var prev = fTime.value, sl = fDate.value ? (E.slots(fDate.value, +fMin.value || 30) || []) : [];
      fTime.textContent = '';
      if (!sl.length) { fTime.appendChild(el('option', { value: '' }, 'העסק סגור ביום זה')); fTime.disabled = true; }
      else {
        fTime.disabled = false;
        sl.forEach(function (s) { fTime.appendChild(el('option', { value: s.time }, s.busy ? s.time + ' · תפוס · ' + s.busy : s.time)); });
        var keep = sl.some(function (s) { return s.time === prev; });
        var free = sl.filter(function (s) { return !s.busy; })[0];
        fTime.value = keep ? prev : (free || sl[0]).time;
      }
      check();
    }
    fCust.addEventListener('change', function () { newBox.hidden = fCust.value !== '__new'; });
    fSvc.addEventListener('change', function () {
      var s = E.byId(svcs, fSvc.value);
      if (s) {
        fMin.value = String(s.minutes || 60);
        if (s.typeId) fType.value = s.typeId;
        if (!fTitle.value.trim() || fTitle.value === lastAuto) fTitle.value = lastAuto = s.name;
      }
      fillSlots();
    });
    fDate.addEventListener('change', fillSlots);
    fMin.addEventListener('change', fillSlots);
    fTime.addEventListener('change', check);
    fillSlots();
    function save() {
      msg.textContent = '';
      var cid = fCust.value;
      if (!cid) { msg.textContent = 'לבחור לקוח'; fCust.focus(); return; }
      if (cid === '__new' && !fNName.value.trim()) { msg.textContent = 'חסר שם ללקוח החדש'; fNName.focus(); return; }
      var title = fTitle.value.trim() || serviceName(fSvc.value);
      if (!title) { msg.textContent = 'חסרה כותרת או שירות'; fTitle.focus(); return; }
      if (!fDate.value) { msg.textContent = 'חסר תאריך'; return; }
      if (!fTime.value) { msg.textContent = 'אין שעה פנויה ביום הזה · לבחור יום אחר'; return; }
      if (!(+fMin.value > 0)) { msg.textContent = 'משך לא תקין'; fMin.focus(); return; }
      if (cid === '__new') {
        var c = { id: E.uid(), name: fNName.value.trim(), contact: fNName.value.trim(), phone: fNPhone.value.trim(), bill: 'hours', rateHour: 0, rateDay: 0, note: 'נוסף מהיומן' };
        st.customers.push(c); cid = c.id;
      }
      var o = temp(); o.id = E.uid(); o.custId = cid; o.title = title;
      st.orders.push(o);
      E.save();
      var conf = conflictsOf(o).length;
      toast('התור נקבע · ' + fd(o.date) + ' ' + o.time + (conf ? ' · מתנגש' : ''));
      replace('#cal/' + o.date);
    }
    return [
      head('תור חדש', parent),
      el('div', { class: 'card' }, el('div', { class: 'form' },
        fld('לקוח', fCust, true), newBox,
        fld('שירות', fSvc), fld('כותרת', fTitle),
        fld('תאריך', fDate), fld('שעה', fTime),
        fld('משך (דקות)', fMin), fld('סוג עבודה', fType),
        el('label', { class: 'chk' }, fBill, 'לחיוב'))),
      el('div', { class: 'card' }, el('h2', { class: 'sub-h', style: 'margin-top:0' }, 'מי מבצע.ת'), stuPicker(sel, check)),
      warn, msg,
      el('div', { class: 'btn-row' }, btn('קביעת התור', 'check', save, 'primary'), btn('ביטול', null, function () { goBack(parent); }, 'quiet'))
    ];
  }

  function vMore() {
    return [head('עוד'), el('div', { class: 'rows' },
      NAV.slice(PHONE_TABS).map(function (n) { return rowLink('#' + n[0], n[1], n[2], null); }),
      el('a', { class: 'rowbtn', href: 'stu.html' }, ic('phone'), el('b', null, 'דף התלמיד.ה'), el('span', { class: 'rtag' }), el('span', { class: 'arr', 'aria-hidden': 'true' })))];
  }

  /* ---------- 6. הגדרות ---------- */
  function vSettings(part) {
    if (part === 'types') return sTypes();
    if (part === 'students') return sStudents();
    if (part === 'services') return sServices();
    if (part === 'bizhours') return sHours();
    var st = S(), bh = bizHours();
    var fN = el('input', { value: st.biz.name, maxlength: '60' }), fM = el('input', { value: st.biz.manager, maxlength: '60' });
    var msg = el('p', { class: 'form-msg', role: 'alert' });
    var pro = st.biz.types.filter(function (t) { return t.pro; }).length;
    return [
      head('הגדרות'),
      el('div', { class: 'card' }, el('div', { class: 'form' }, fld('שם העסק', fN), fld('מנהל.ת העסק', fM)), msg,
        el('div', { class: 'btn-row' }, btn('שמירה', 'check', function () {
          if (!fN.value.trim()) { msg.textContent = 'חסר שם עסק'; return; }
          st.biz.name = fN.value.trim(); st.biz.manager = fM.value.trim(); E.save(); toast('נשמר'); render(true);
        }, 'primary'))),
      el('div', { class: 'rows' },
        rowLink('#settings/types', 'clip', 'סוגי עבודה', [L(String(st.biz.types.length)), ' סוגים · ', L(String(pro)), ' נספרים לתעודה']),
        rowLink('#settings/students', 'users', 'תלמידים', [L(String(st.students.length)), ' תלמידים · תעריף וקוד אישי']),
        rowLink('#settings/services', 'tag', 'שירותים', [L(String(services().length)), ' שירותים · משך ומחיר']),
        rowLink('#settings/bizhours', 'cal', 'שעות פעילות', [bh.days.slice().sort().map(function (k) { return WD[k]; }).join(' '), ' · ', L(bh.open + '–' + bh.close)]),
        el('a', { class: 'rowbtn', href: 'stu.html' }, ic('phone'), el('b', null, 'דף התלמיד.ה'), el('span', { class: 'rtag' }), el('span', { class: 'arr', 'aria-hidden': 'true' }), el('small', null, L('stu.html'), ' · דיווח שעות מהטלפון')),
        el('button', { type: 'button', class: 'rowbtn', onclick: function () {
          if (!window.confirm('לאפס את כל נתוני ההדגמה? כל השינויים יימחקו.')) return;
          E.reset(); ui.editId = null; toast('נתוני ההדגמה אופסו'); render(true);
        } }, ic('reset'), el('b', null, 'איפוס נתוני ההדגמה'), el('span', { class: 'rtag' }), el('span'), el('small', null, 'חזרה לנתוני הדוגמה')))
    ];
  }
  function sTypes() {
    var st = S(), inputs = [];
    var rows = st.biz.types.map(function (t) {
      var n = el('input', { class: 'inp', value: t.name, maxlength: '40', 'aria-label': 'שם סוג העבודה' });
      var p = el('input', { type: 'checkbox', checked: !!t.pro });
      inputs.push([t, n, p]);
      return el('div', { class: 'lrow' }, el('div', { class: 'grow' }, n), el('label', { class: 'chk' }, p, 'נספר לתעודה'));
    });
    var nn = el('input', { class: 'inp', maxlength: '40', placeholder: 'סוג עבודה חדש', 'aria-label': 'סוג עבודה חדש' });
    var np = el('input', { type: 'checkbox', checked: true });
    var msg = el('p', { class: 'form-msg', role: 'alert' });
    return [
      head('סוגי עבודה', '#settings'),
      el('div', { class: 'rows' }, rows,
        el('div', { class: 'lrow' }, el('div', { class: 'grow' }, nn), el('label', { class: 'chk' }, np, 'נספר לתעודה'))),
      msg,
      el('div', { class: 'btn-row' }, btn('שמירה', 'check', function () {
        for (var i = 0; i < inputs.length; i++) if (!inputs[i][1].value.trim()) { msg.textContent = 'יש סוג עבודה בלי שם'; return; }
        inputs.forEach(function (x) { x[0].name = x[1].value.trim(); x[0].pro = x[2].checked; });
        if (nn.value.trim()) st.biz.types.push({ id: E.uid(), name: nn.value.trim(), pro: np.checked });
        E.save(); toast('סוגי העבודה נשמרו'); render(true);
      }, 'primary'))
    ];
  }
  function sServices() {
    var st = S(), types = st.biz.types, inputs = [];
    function row(s) {
      var n = el('input', { class: 'inp', value: s ? s.name : '', maxlength: '40', placeholder: s ? null : 'שירות חדש', 'aria-label': 'שם השירות' });
      var t = el('select', { class: 'inp', value: s && s.typeId ? s.typeId : (types[0] ? types[0].id : ''), 'aria-label': 'סוג עבודה' }, types.map(function (x) { return el('option', { value: x.id }, x.name); }));
      var m = el('input', { type: 'number', class: 'inp num-in', min: '5', step: '5', inputmode: 'numeric', value: s ? String(s.minutes || '') : '60', style: 'width:90px' });
      var p = el('input', { type: 'number', class: 'inp num-in', min: '0', step: '1', inputmode: 'decimal', value: s ? String(s.price || 0) : '', style: 'width:100px' });
      inputs.push([s, n, t, m, p]);
      return el('div', { class: 'lrow svc-row' }, el('div', { class: 'grow' }, n),
        el('label', { class: 'fld' }, el('span', null, 'סוג עבודה'), t),
        el('label', { class: 'fld' }, el('span', null, 'דקות'), m),
        el('label', { class: 'fld' }, el('span', null, '₪ ללקוח'), p));
    }
    var msg = el('p', { class: 'form-msg', role: 'alert' });
    return [
      head('שירותים', '#settings'),
      el('div', { class: 'rows' }, services().map(row), row(null)), msg,
      el('div', { class: 'btn-row' }, btn('שמירה', 'check', function () {
        var out = [];
        for (var i = 0; i < inputs.length; i++) {
          var x = inputs[i], name = x[1].value.trim();
          if (!x[0] && !name) continue;
          if (!name) { msg.textContent = 'יש שירות בלי שם'; x[1].focus(); return; }
          if (!(+x[3].value > 0)) { msg.textContent = 'משך לא תקין ב' + name; x[3].focus(); return; }
          if (!(+x[4].value >= 0)) { msg.textContent = 'מחיר לא תקין ב' + name; x[4].focus(); return; }
          var s = x[0] || { id: E.uid() };
          s.name = name; s.typeId = x[2].value; s.minutes = +x[3].value; s.price = +x[4].value || 0;
          out.push(s);
        }
        st.biz.services = out; E.save(); toast('השירותים נשמרו'); render(true);
      }, 'primary'))
    ];
  }
  function sHours() {
    var st = S(), bh = bizHours(), on = {};
    bh.days.forEach(function (k) { on[k] = 1; });
    var chips = WD.map(function (w, k) {
      var b = el('button', { type: 'button', class: 'chip' + (on[k] ? ' on' : ''), 'aria-pressed': on[k] ? 'true' : 'false', 'aria-label': 'יום ' + WDL[k] }, w);
      b.addEventListener('click', function () { if (on[k]) delete on[k]; else on[k] = 1; b.classList.toggle('on', !!on[k]); b.setAttribute('aria-pressed', on[k] ? 'true' : 'false'); });
      return b;
    });
    var fO = el('input', { type: 'time', value: bh.open, step: '1800' }), fC = el('input', { type: 'time', value: bh.close, step: '1800' });
    var msg = el('p', { class: 'form-msg', role: 'alert' });
    return [
      head('שעות פעילות', '#settings'),
      el('div', { class: 'card' },
        el('div', { class: 'fld' }, el('span', null, 'ימי פעילות'), el('div', { class: 'chips', role: 'group', 'aria-label': 'ימי פעילות' }, chips)),
        el('div', { class: 'form' }, fld('משעה', fO), fld('עד שעה', fC)), msg,
        el('div', { class: 'btn-row' }, btn('שמירה', 'check', function () {
          if (!fO.value || !fC.value || !(E.hoursBetween(fO.value, fC.value) > 0)) { msg.textContent = 'שעת הסגירה צריכה להיות אחרי שעת הפתיחה'; return; }
          st.biz.hours = { days: Object.keys(on).map(Number).sort(), open: fO.value, close: fC.value };
          E.save(); toast('שעות הפעילות נשמרו'); render(true);
        }, 'primary')))
    ];
  }
  function sStudents() {
    var st = S(), inputs = [];
    var rows = st.students.map(function (s) {
      var r = el('input', { type: 'number', class: 'inp num-in', min: '0', step: '0.5', inputmode: 'decimal', value: String(s.rate), 'aria-label': 'תעריף ' + s.name, style: 'width:90px' });
      var p = el('input', { class: 'inp num-in', value: s.pin, maxlength: '4', inputmode: 'numeric', pattern: '[0-9]{4}', 'aria-label': 'קוד אישי ' + s.name, style: 'width:90px' });
      inputs.push([s, r, p]);
      return el('div', { class: 'lrow' },
        el('div', { class: 'grow' }, el('b', { style: 'font-family:var(--head);color:var(--ink)' }, s.name), el('small', { style: 'display:block;color:var(--muted)' }, s.cls + (s.grp ? ' · ' + s.grp : ''))),
        el('label', { class: 'fld' }, el('span', null, '₪ לשעה'), r),
        el('label', { class: 'fld' }, el('span', null, 'קוד אישי'), p));
    });
    var msg = el('p', { class: 'form-msg', role: 'alert' });
    return [
      head('תלמידים', '#settings'),
      el('div', { class: 'rows' }, rows), msg,
      el('div', { class: 'btn-row' }, btn('שמירה', 'check', function () {
        var seen = {};
        for (var i = 0; i < inputs.length; i++) {
          var x = inputs[i], pin = x[2].value.trim();
          if (!/^\d{4}$/.test(pin)) { msg.textContent = 'קוד אישי של ' + x[0].name + ' צריך 4 ספרות'; x[2].focus(); return; }
          if (seen[pin]) { msg.textContent = 'הקוד ' + pin + ' כבר בשימוש'; x[2].focus(); return; }
          if (!(+x[1].value > 0)) { msg.textContent = 'תעריף לא תקין אצל ' + x[0].name; x[1].focus(); return; }
          seen[pin] = 1;
        }
        inputs.forEach(function (x) { x[0].rate = +x[1].value; x[0].pin = x[2].value.trim(); });
        E.save(); toast('התלמידים נשמרו'); render(true);
      }, 'primary'))
    ];
  }

  var VIEWS = {
    home: vHome, missing: vMissing, cal: vCal, appt: vAppt, more: vMore, orders: vOrders, order: vOrder, add: vAdd,
    customers: vCustomers, customer: vCustomer, hours: vHours, reports: vReports,
    rep: vRep, settings: vSettings
  };

  buildNav();
  window.addEventListener('hashchange', onHash);
  // שינוי מתלמיד.ה בלשונית אחרת
  window.addEventListener('storage', function (ev) { if (ev.key === 'esek-demo-v1') { E.load(); render(true); } });
  onHash();
})();
