/* shell.js — שלד מערכת הרכז.ת (גרסה 2): תפריט צד, ניתוב hash, ראש ותחתית, ועזרים משותפים לכל הדפים.
   נטען אחרי esek-core.js ולפני p-*.js. עיצוב: esek2.css.

   ===== לכותבי הדפים (p-*.js) =====
   רישום דף:
     Shell.page(id, { title, nav, render(el, params) })
       id     — הקטע הראשון ב-hash (#cal/2026-11-16 → id 'cal', params ['2026-11-16']).
       title  — כותרת לשונית הדפדפן.
       nav    — איזה פריט בתפריט מודגש (ברירת מחדל = id). למשל Shell.page('order', {nav:'cal', ...}).
       render — מקבל.ת אלמנט ריק (el) ומערך params. render רץ בתוך try/catch.
     כל render מתחיל ממצב טרי: השלד קורא Esek.load2() + Esek.autoPrep(Esek.now()) לפני כל הצגה
     (גם book.html/stu.html באותו דפדפן כותבים לאותו אחסון). לכן: בפעולות לחפש לפי id ברגע הפעולה,
     לא לשמור הפניות לאובייקטים בין הצגות.
   ניווט ורענון:
     Shell.go('#hours/prep')   — מעבר מסך (אם זה אותו hash: רענון).
     Shell.refresh()           — הצגה מחדש של המסך הנוכחי + עדכון התגים בתפריט (אחרי כל שינוי).
     Shell.hold(true|false)    — בזמן עריכה פתוחה: שינוי מלשונית אחרת לא יצייר מחדש את המסך.
     Shell.ym()                — החודש הנוכחי 'YYYY-MM' (לפי Esek.now()).
   עזרי HTML (כולם מחזירים מחרוזת HTML, חוץ מ-modal):
     Shell.esc(s)                       — בריחת HTML.
     Shell.ltr(s)                       — <bdi dir="ltr">s</bdi> (מספרים, שעות, טלפונים).
     Shell.fmtNum(n)                    — טקסט: עד 2 ספרות אחרי הנקודה, פסיקי אלפים.
     Shell.fmtHours(h, noUnit)          — <bdi dir="ltr">1.5</bdi> ש'  (noUnit=true: בלי "ש'").
     Shell.fmtMoney(n)                  — <bdi dir="ltr">1,234 ₪</bdi>.
     Shell.fmtDate(ymd, {year, noDay})  — "יום ראשון <bdi>15.11</bdi>" (year: 15.11.2026; noDay: בלי שם היום).
     Shell.fmtDateText(ymd, opt)        — אותו דבר כטקסט רגיל (להעתקה / CSV).
     Shell.dayName(ymd)                 — "יום ראשון".   Shell.monthName('2026-11') — "נובמבר".
     Shell.timeRange(start, end)        — <bdi dir="ltr">10:00–11:30</bdi> (ריק אם אין שעות).
     Shell.icon(name, cls)              — SVG קו. שמות: home calendar doc clock chart users box cap check edit copy
                                          alert chat plus chevron back phone mail whatsapp menu x down user coin file
                                          external trash.
     Shell.progress(x, n, label, cls)   — מונה "X מתוך N" עם פס (cls: 'o' זית / 'a' פטרול / 'w' ענבר).
     Shell.screenHead({title, sub, back, backLabel, actions}) — כותרת מסך; back = '#hours' מוסיף "חזרה".
     Shell.copyBtn(text, label)         — כפתור העתקה (המטפל מובנה בשלד; מציג "הועתק").
     Shell.alertTags(entry)             — תגיות ענבר: מעל 8 שעות / אחרי 20:00 / שבת (Esek.alertsOf).
     Shell.workLabel(order)             — {title, sub}: שירות + לקוח, או "עבודה פנימית" + שם העבודה.
     Shell.stuName(id) / Shell.custName(id) — שמות לפי מזהה.
   פעולות:
     Shell.copyText(text, msg)          — העתקה ללוח (עם גיבוי execCommand) + toast. מחזיר Promise<boolean>.
     Shell.toast(msg)                   — הודעה קצרה בתחתית.
     Shell.modal({title, html, actions:[{label, cls, onClick(api)}], onOpen(api)}) → api {el, body, close()}
                                          חלון קטן לטופס (בנייד: גיליון מלמטה). onClick שמחזיר false = החלון נשאר.
   מחלקות CSS שימושיות: card, pad, btn (pri/ok/warn/ghost/danger/icon), fld, form-grid, err, tag, tabs/tab,
   names + pend (רשימת "מי טרם"), sec-t, mini (טבלה קטנה), rows/row/row-m (שורות דיווח).
*/
(function () {
  'use strict';

  var Shell = {};
  var pages = {};
  var NAV_KEY = 'esek2-nav';
  var held = false, stale = false, curId = null;

  var MENU = [
    { id: 'home', label: 'בית', icon: 'home' },
    { group: 'עבודה', items: [
      { id: 'cal', label: 'יומן תורים', icon: 'calendar' },
      { id: 'quotes', label: 'הצעות מחיר', icon: 'doc' },
      { id: 'hours', label: 'דיווח שעות', icon: 'clock', badge: 'hours' }] },
    { group: 'כסף ודוחות', items: [
      { id: 'reports', label: 'עיבוד ודוחות', icon: 'chart' }] },
    { group: 'העסק', items: [
      { id: 'customers', label: 'לקוחות ושירותים', icon: 'users' },
      { id: 'stock', label: 'מלאי', icon: 'box', badge: 'stock' },
      { id: 'students', label: 'תלמידים', icon: 'cap' }] }
  ];
  function menuItems() {
    var out = [];
    MENU.forEach(function (m) { if (m.items) out = out.concat(m.items); else out.push(m); });
    return out;
  }
  Shell.menu = menuItems;

  /* ---------- עזרים ---------- */
  function esc(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  Shell.esc = esc;
  Shell.ltr = function (s) { return '<bdi dir="ltr">' + esc(s) + '</bdi>'; };
  Shell.fmtNum = function (n) {
    var v = Math.round((+n || 0) * 100) / 100;
    var neg = v < 0; v = Math.abs(v);
    var int = Math.floor(v), dec = Math.round((v - int) * 100);
    var s = String(int).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    if (dec) s += '.' + (dec < 10 ? '0' + dec : String(dec)).replace(/0$/, '');
    return (neg ? '-' : '') + s;
  };
  Shell.fmtHours = function (h, noUnit) {
    return '<bdi dir="ltr" class="num">' + Shell.fmtNum(h) + '</bdi>' + (noUnit ? '' : ' ש\'');
  };
  Shell.fmtMoney = function (n) {
    return '<bdi dir="ltr" class="num">' + Shell.fmtNum(Math.round(+n || 0)) + ' ₪</bdi>';
  };
  var DAYS = ['יום ראשון', 'יום שני', 'יום שלישי', 'יום רביעי', 'יום חמישי', 'יום שישי', 'יום שבת'];
  var MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  function parts(ymd) { var p = String(ymd || '').split('-'); return { y: +p[0], m: +p[1], d: +p[2] }; }
  Shell.dayName = function (ymd) { return ymd ? DAYS[Esek.dayOfWeek(ymd)] : ''; };
  Shell.monthName = function (ym) { var m = +String(ym).split('-')[1]; return MONTHS[(m || 1) - 1]; };
  function dm(ymd, year) { var p = parts(ymd); return p.d + '.' + p.m + (year ? '.' + p.y : ''); }
  Shell.fmtDateText = function (ymd, opt) {
    opt = opt || {};
    if (!ymd) return '';
    return (opt.noDay ? '' : Shell.dayName(ymd) + ' ') + dm(ymd, opt.year);
  };
  Shell.fmtDate = function (ymd, opt) {
    opt = opt || {};
    if (!ymd) return '';
    return (opt.noDay ? '' : esc(Shell.dayName(ymd)) + ' ') + '<bdi dir="ltr" class="num">' + dm(ymd, opt.year) + '</bdi>';
  };
  Shell.timeRange = function (a, b) {
    if (!a) return '';
    return '<bdi dir="ltr" class="num">' + esc(a) + (b ? '–' + esc(b) : '') + '</bdi>';
  };
  Shell.ym = function () { return Esek.today().slice(0, 7); };

  var ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
    calendar: '<rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
    doc: '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 12h7M9 16h5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    chart: '<path d="M4 20V4M4 20h16"/><path d="M8 16v-4M12 16V8M16 16v-6"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.7-3.6 3.3-5.5 6.5-5.5s5.8 1.9 6.5 5.5"/><path d="M16 4.8a3.5 3.5 0 0 1 0 6.4M18.5 14.8c1.6.8 2.7 2.5 3 5.2"/>',
    box: '<path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"/>',
    cap: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c2 1.7 4 2.5 6 2.5s4-.8 6-2.5v-5"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    alert: '<path d="M12 3.5 2.5 20h19z"/><path d="M12 10v4.5M12 17.5v.01"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    chevron: '<path d="M15 6l-6 6 6 6"/>',
    back: '<path d="M9 6l6 6-6 6"/>',
    phone: '<path d="M5 3.5h3.5l1.5 4.5-2.2 1.4a11 11 0 0 0 6.8 6.8l1.4-2.2 4.5 1.5V19a1.5 1.5 0 0 1-1.6 1.5C10.6 20 4 13.4 3.5 5.1A1.5 1.5 0 0 1 5 3.5z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5 12 13l8.5-6.5"/>',
    whatsapp: '<path d="M4.5 19.5l1.2-3.6A8 8 0 1 1 8.4 18.6z"/><path d="M9.2 9.3c.3 2 1.6 3.6 3.6 4.4l1.1-1 1.6.7c-.2 1-1 1.6-2 1.5-2.8-.4-5-2.6-5.4-5.4-.1-1 .5-1.8 1.5-2l.7 1.6z"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    down: '<path d="M6 9l6 6 6-6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c.8-4 3.8-6 7.5-6s6.7 2 7.5 6"/>',
    coin: '<circle cx="12" cy="12" r="9"/><path d="M9 8.5h4.5a2 2 0 0 1 0 4H9.5v3.5M9 8.5v7.5M15 15.5h-3"/>',
    file: '<path d="M6 3h8l4 4v14H6z"/><path d="M9 13l2 2 4-4"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'
  };
  Shell.icon = function (name, cls) {
    return '<svg class="i' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + (ICONS[name] || ICONS.doc) + '</svg>';
  };

  Shell.progress = function (x, n, label, cls) {
    x = +x || 0; n = +n || 0;
    var pct = n ? Math.max(0, Math.min(100, x * 100 / n)) : 0;
    var t = '<b class="num">' + Shell.fmtNum(x) + '</b> מתוך <b class="num">' + Shell.fmtNum(n) + '</b>' + (label ? ' ' + esc(label) : '');
    return '<div class="prog"><div class="prog-t">' + t + '</div><div class="bar" role="img" aria-label="' + esc(x + ' מתוך ' + n) + '"><i class="' + (cls || 'o') + '" style="width:' + pct.toFixed(1) + '%"></i></div></div>';
  };

  Shell.screenHead = function (o) {
    o = o || {};
    var back = o.back ? '<a class="back" href="' + esc(o.back) + '">' + Shell.icon('back', 'sm') + esc(o.backLabel || 'חזרה') + '</a>' : '';
    return back + '<div class="page-h"><div><h1>' + esc(o.title || '') + '</h1>' + (o.sub ? '<p>' + o.sub + '</p>' : '') + '</div>' +
      (o.actions ? '<div class="ph-acts">' + o.actions + '</div>' : '') + '</div>';
  };

  Shell.copyBtn = function (text, label) {
    return '<button class="btn" type="button" data-copy="' + esc(text) + '">' + Shell.icon('copy') + '<span>' + esc(label || 'העתקה') + '</span></button>';
  };

  var ALERTS = { over8: 'מעל 8 שעות ביום', late: 'אחרי <bdi dir="ltr">20:00</bdi>', shabbat: 'שבת' };
  Shell.alertTags = function (entry) {
    return Esek.alertsOf(entry).map(function (a) {
      return '<span class="tag">' + Shell.icon('alert') + (ALERTS[a] || esc(a)) + '</span>';
    }).join('');
  };

  Shell.stuName = function (id) { var s = Esek.byId(Esek.state.students, id); return s ? s.name : ''; };
  Shell.custName = function (id) { var c = Esek.byId(Esek.state.customers, id); return c ? c.name : ''; };
  Shell.workLabel = function (o) {
    if (!o) return { title: 'עבודה', sub: '' };
    if (!o.custId) return { title: 'עבודה פנימית', sub: o.title || '' };
    var sv = o.serviceId ? Esek.byId(Esek.state.biz.services, o.serviceId) : null;
    return { title: sv ? sv.name : (o.title || ''), sub: Shell.custName(o.custId) };
  };

  /* ---------- העתקה והודעות ---------- */
  var toastEl = null, toastT = null;
  Shell.toast = function (msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('on');
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove('on'); }, 2200);
  };
  function execCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed'; ta.style.top = '0'; ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }
  Shell.copyText = function (text, msg) {
    text = String(text || '');
    function done(ok) { Shell.toast(ok ? (msg || 'הועתק') : 'לא הצלחתי להעתיק. אפשר לסמן ולהעתיק ידנית.'); return ok; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { return done(true); }, function () { return done(execCopy(text)); });
    }
    return Promise.resolve(done(execCopy(text)));
  };

  /* ---------- חלון ---------- */
  Shell.modal = function (o) {
    o = o || {};
    var bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = '<div class="modal" role="dialog" aria-modal="true" aria-label="' + esc(o.title || '') + '">' +
      '<div class="modal-h"><h2>' + esc(o.title || '') + '</h2><button class="btn ghost icon" type="button" data-x aria-label="סגירה">' + Shell.icon('x') + '</button></div>' +
      '<div class="modal-b">' + (o.html || '') + '</div><div class="modal-a"></div></div>';
    var api = { el: bg, body: bg.querySelector('.modal-b'), close: close };
    var acts = bg.querySelector('.modal-a');
    (o.actions || [{ label: 'סגירה' }]).forEach(function (a) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn' + (a.cls ? ' ' + a.cls : '');
      b.innerHTML = a.html || esc(a.label);
      b.addEventListener('click', function () {
        var r = a.onClick ? a.onClick(api) : undefined;
        if (r !== false) close();
      });
      acts.appendChild(b);
    });
    function close() {
      if (bg.parentNode) bg.parentNode.removeChild(bg);
      document.removeEventListener('keydown', onKey);
      Shell.hold(false);
    }
    function onKey(e) { if (e.key === 'Escape') close(); }
    bg.addEventListener('click', function (e) { if (e.target === bg || e.target.closest('[data-x]')) close(); });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(bg);
    Shell.hold(true);
    if (o.onOpen) o.onOpen(api);
    var f = bg.querySelector('input,select,textarea') || bg.querySelector('.modal-a .btn');
    if (f) f.focus();
    return api;
  };

  /* ---------- טעינת נתונים ---------- */
  function fresh() {
    Esek.load2();
    try { Esek.autoPrep(Esek.now()); } catch (e) { console.error(e); }
    Esek.save();
  }
  Shell.hold = function (on) {
    held = !!on;
    if (!held && stale) { stale = false; Shell.refresh(); }
  };

  /* ---------- שלד ---------- */
  var mainEl, sideEl;
  function lsGet(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* חסום */ } }

  function navHtml() {
    var closed = lsGet(NAV_KEY) || {};
    function a(it) {
      return '<a class="nav-a" href="#' + it.id + '" data-nav="' + it.id + '">' + Shell.icon(it.icon) + esc(it.label) +
        (it.badge ? '<span class="badge' + (it.badge === 'stock' ? ' warn' : '') + '" data-badge="' + it.badge + '" hidden></span>' : '') + '</a>';
    }
    var h = '<div class="side-close"><b>תפריט</b><button type="button" data-close aria-label="סגירת התפריט">' + Shell.icon('x') + '</button></div>';
    MENU.forEach(function (m, gi) {
      if (!m.items) { h += a(m); return; }
      var open = !closed[m.group];
      h += '<div class="grp"><button class="grp-h" type="button" aria-expanded="' + open + '" aria-controls="grp' + gi + '" data-grp="' + esc(m.group) + '">' +
        esc(m.group) + Shell.icon('down') + '</button><div class="grp-b" id="grp' + gi + '"' + (open ? '' : ' hidden') + '>' +
        m.items.map(a).join('') + '</div></div>';
    });
    return h;
  }
  function viewLinks(cls) {
    return '<a class="' + cls + '" href="book.html" target="_blank" rel="noopener">' + Shell.icon('external', 'sm') + 'צפייה כלקוח</a>' +
      '<a class="' + cls + '" href="stu.html" target="_blank" rel="noopener">' + Shell.icon('external', 'sm') + 'צפייה כתלמיד.ה</a>';
  }
  function build() {
    var st = Esek.state, b = st.biz;
    var now = Esek.now(), td = Esek.today();
    document.body.innerHTML =
      '<header class="top">' +
        '<img src="logo-minhal.png" alt="המנהל להכשרה מקצועית · משרד העבודה">' +
        '<div class="brand"><b>העסק <span style="white-space:nowrap">הבית-ספרי</span> · הדגמה</b><small data-h="biz">' + esc(b.name) + '</small></div>' +
        '<div class="biz"><div><strong data-h="biz">' + esc(b.name) + '</strong>' + esc(b.school || '') + '</div><span class="sep"></span>' +
          '<div><strong>רכז.ת: <span data-h="mgr">' + esc(b.manager || '') + '</span></strong>' + esc(Shell.dayName(td)) + ' <bdi dir="ltr" class="num">' + dm(td, true) + '</bdi></div></div>' +
        '<div class="views">' + viewLinks('view-a') + '</div>' +
        '<button class="menu-btn" type="button" aria-expanded="false" aria-controls="side" data-menu>' + Shell.icon('menu') + 'תפריט</button>' +
      '</header>' +
      '<div class="shell">' +
        '<nav class="side" id="side" aria-label="תפריט ראשי">' + navHtml() +
          '<div class="side-foot"><span data-h="biz">' + esc(b.name) + '</span><br>' + esc(b.school || '') + '<br>רכז.ת: <span data-h="mgr">' + esc(b.manager || '') + '</span>' +
          '<div class="side-views">' + viewLinks('view-a') + '</div></div>' +
        '</nav>' +
        '<div class="scrim" data-close></div>' +
        '<main id="main" tabindex="-1"><div class="wrap"><div id="screen"></div>' +
          '<footer class="foot"><p>המרחב הפדגוגי · המנהל להכשרה מקצועית · משרד העבודה</p>' +
          '<p><a href="https://impactos.co.il/" target="_blank" rel="noopener">impactos</a></p></footer>' +
        '</div></main>' +
      '</div>';
    void now;
    mainEl = document.getElementById('screen');
    sideEl = document.getElementById('side');

    document.addEventListener('click', function (e) {
      var t = e.target;
      var cp = t.closest('[data-copy]');
      if (cp) {
        e.preventDefault();
        var sp = cp.querySelector('span'), old = sp ? sp.textContent : '';
        Shell.copyText(cp.getAttribute('data-copy')).then(function (ok) {
          if (ok && sp) { sp.textContent = 'הועתק'; setTimeout(function () { sp.textContent = old; }, 1600); }
        });
        return;
      }
      if (t.closest('[data-menu]')) { setNav(!document.body.classList.contains('nav-open')); return; }
      if (t.closest('[data-close]')) { setNav(false); return; }
      var g = t.closest('[data-grp]');
      if (g) {
        var open = g.getAttribute('aria-expanded') === 'true';
        g.setAttribute('aria-expanded', open ? 'false' : 'true');
        g.nextElementSibling.hidden = open;
        var c = lsGet(NAV_KEY) || {};
        if (open) c[g.getAttribute('data-grp')] = 1; else delete c[g.getAttribute('data-grp')];
        lsSet(NAV_KEY, c);
        return;
      }
      if (t.closest('.nav-a')) setNav(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('nav-open')) setNav(false);
    });
  }
  function setNav(o) {
    document.body.classList.toggle('nav-open', o);
    var mb = document.querySelector('[data-menu]');
    if (mb) mb.setAttribute('aria-expanded', o ? 'true' : 'false');
    if (o) { var f = sideEl.querySelector('.nav-a'); if (f) f.focus(); }
  }

  Shell.badges = function () {
    var w = Esek.entries({ status: 'wait' }).length, ls = Esek.lowStock().length;
    var map = { hours: w, stock: ls };
    document.querySelectorAll('[data-badge]').forEach(function (el) {
      var n = map[el.getAttribute('data-badge')] || 0;
      el.textContent = n;
      el.hidden = !n;
      el.setAttribute('aria-label', el.getAttribute('data-badge') === 'stock' ? n + ' פריטים מתחת למינימום' : n + ' ממתינים לאישורך');
    });
    var b = Esek.state.biz;
    document.querySelectorAll('[data-h="biz"]').forEach(function (el) { el.textContent = b.name; });
    document.querySelectorAll('[data-h="mgr"]').forEach(function (el) { el.textContent = b.manager || ''; });
  };

  /* ---------- ניתוב ---------- */
  function parseHash() {
    var h = decodeURIComponent(String(location.hash || '').replace(/^#/, ''));
    var segs = h.split('/').filter(function (x) { return x !== ''; });
    var id = segs.shift() || 'home';
    return { id: id, params: segs };
  }
  function titleOf(id) {
    var it = null;
    menuItems().forEach(function (m) { if (m.id === id) it = m; });
    return it ? it.label : '';
  }
  function render(scrollTop) {
    fresh();
    var r = parseHash(), p = pages[r.id];
    curId = r.id;
    var nav = (p && p.nav) || r.id;
    document.querySelectorAll('.nav-a').forEach(function (a) {
      if (a.getAttribute('data-nav') === nav) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    Shell.badges();
    held = false; stale = false;
    var el = document.createElement('section');
    el.className = 'screen';
    el.setAttribute('data-page', r.id);
    mainEl.innerHTML = '';
    mainEl.appendChild(el);
    var t = (p && p.title) || titleOf(r.id) || 'המסך';
    document.title = t + ' · העסק הבית-ספרי';
    if (!p) {
      el.innerHTML = Shell.screenHead({ title: titleOf(r.id) || 'המסך', back: r.id === 'home' ? '' : '#home', backLabel: 'חזרה לבית' }) +
        '<div class="card wip"><h2>בבנייה</h2><p>המסך הזה עוד לא מוכן בהדגמה.</p></div>';
    } else {
      try { p.render(el, r.params); }
      catch (err) {
        console.error(err);
        el.innerHTML = Shell.screenHead({ title: t, back: '#home', backLabel: 'חזרה לבית' }) +
          '<div class="card wip"><h2>משהו השתבש בהצגת המסך</h2><p>אפשר לחזור לבית ולנסות שוב.</p></div>';
      }
    }
    Shell.badges();
    if (scrollTop) { window.scrollTo(0, 0); }
  }
  Shell.page = function (id, def) { pages[id] = def || {}; if (mainEl && curId === id) render(false); };
  Shell.refresh = function () { render(false); };
  Shell.go = function (hash) {
    hash = String(hash || '#home');
    if (hash.charAt(0) !== '#') hash = '#' + hash;
    if (location.hash === hash) render(true); else location.hash = hash;
  };

  Shell.start = function () {
    fresh();
    build();
    window.addEventListener('hashchange', function () { setNav(false); render(true); });
    window.addEventListener('storage', function (e) {
      if (e.key && e.key !== 'esek-demo-v2') return;
      if (held) { stale = true; Esek.load2(); Shell.badges(); return; }
      render(false);
    });
    render(true);
  };

  window.Shell = Shell;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', Shell.start);
  else setTimeout(Shell.start, 0);
})();
