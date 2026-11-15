/* p-customers.js — #customers: לקוחות ושירותים.
   #customers           לשונית לקוחות
   #customers/services  לשונית שירותים ומשימות + שעות פעילות
   #customer/<id>|new   פרטי לקוח (עריכה), ההזמנות וההצעות שלו
   #service/<id>|new    שירות: שם, סוג עבודה, דקות, מחיר, חלוקה למשימות, חומרים
   הליבה לא כוללת פעולות הוספה/עריכה ללקוחות, שירותים, משימות ושעות פעילות: כאן משנים את Esek.state ושומרים ב-Esek.save(). */
(function () {
  'use strict';
  var S = Shell, esc = S.esc;
  var ui = { allOrders: false };
  var QST = { draft: 'טיוטה', sent: 'נשלחה', ok: 'אושרה', no: 'נדחתה' };
  var OST = { req: 'בקשה מלקוח' };
  var DAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

  function r2(x) { return Math.round((+x || 0) * 100) / 100; }
  function trim(s) { return String(s || '').replace(/^\s+|\s+$/g, ''); }
  function num(n) { return '<bdi dir="ltr" class="num">' + S.fmtNum(n) + '</bdi>'; }
  function money(n) { return '<bdi dir="ltr" class="num">' + S.fmtNum(r2(n)) + ' ₪</bdi>'; }
  function nid(p) { return p + Esek.uid(); }
  function byName(a, b) { return String(a.name).localeCompare(String(b.name), 'he'); }
  function st() { return Esek.state; }
  function tasks() { return st().biz.tasks || (st().biz.tasks = []); }
  function services() { return st().biz.services || (st().biz.services = []); }
  function items() { return (st().stock && st().stock.items) || []; }
  function termsText(c) {
    if (c.bill === 'tasks') return 'לפי משימה · סכום קבוע לכל משימה שבוצעה';
    if (c.bill === 'days') return 'לפי ימי עבודה · ' + S.fmtNum(c.rateDay) + ' ₪ ליום';
    if (c.bill === 'both') return 'שעות וימים · ' + S.fmtNum(c.rateHour) + ' ₪ לשעה + ' + S.fmtNum(c.rateDay) + ' ₪ ליום';
    return 'לפי שעות · ' + S.fmtNum(c.rateHour) + ' ₪ לשעה';
  }
  function holdOnInput(el) { el.addEventListener('input', function () { S.hold(true); }, { once: true }); }

  /* ---------- בדיקות שימוש (מחיקה רק אם לא בשימוש) ---------- */
  function custUse(id) {
    var o = st().orders.filter(function (x) { return x.custId === id; }).length;
    var q = (st().quotes || []).filter(function (x) { return x.custId === id; }).length;
    return { orders: o, quotes: q, used: o + q > 0 };
  }
  function serviceUse(id) {
    var o = st().orders.filter(function (x) { return x.serviceId === id; }).length;
    var q = (st().quotes || []).filter(function (x) { return (x.lines || []).some(function (l) { return l.serviceId === id; }); }).length;
    return { orders: o, quotes: q, used: o + q > 0 };
  }
  function taskUse(id) {
    var sv = services().filter(function (s) { return (s.split || []).some(function (x) { return x.taskId === id; }); }).length;
    var o = st().orders.filter(function (x) { return (x.tasks || []).some(function (t) { return t.taskId === id; }); }).length;
    var e = st().entries.filter(function (x) { return (x.split || []).some(function (t) { return t.taskId === id; }); }).length;
    return { services: sv, orders: o, entries: e, used: sv + o + e > 0 };
  }

  function tabs(cur) {
    function t(id, href, label) { return '<a class="tab" role="tab" href="' + href + '" aria-selected="' + (cur === id) + '">' + label + '</a>'; }
    return '<div class="tabs" role="tablist">' + t('cust', '#customers', 'לקוחות (' + st().customers.length + ')') +
      t('svc', '#customers/services', 'שירותים ומשימות · שעות פעילות') + '</div>';
  }

  /* ---------- לשונית לקוחות ---------- */
  function custList(el) {
    var cs = st().customers.slice().sort(byName);
    el.innerHTML = S.screenHead({ title: 'לקוחות ושירותים', sub: esc(st().biz.name),
      actions: '<a class="btn pri" href="#customer/new">' + S.icon('plus') + 'לקוח חדש</a>' }) + tabs('cust') +
      '<ul class="card bz-list">' + cs.map(function (c) {
        var u = custUse(c.id);
        return '<li><a class="bz-li" href="#customer/' + esc(c.id) + '"><span class="bz-ic">' + S.icon('user') + '</span>' +
          '<span class="bz-tx"><b>' + esc(c.name) + '</b><span>' + (c.phone ? S.ltr(c.phone) + ' · ' : '') + esc(termsText(c)) + '</span></span>' +
          '<span class="bz-fig"><b>' + num(u.orders) + '</b><small>הזמנות</small></span>' + S.icon('chevron', 'bz-chev') + '</a></li>';
      }).join('') + '</ul>';
  }

  /* ---------- לקוח ---------- */
  function custScreen(el, id) {
    var isNew = id === 'new', c = isNew ? null : Esek.byId(st().customers, id);
    if (!isNew && !c) {
      el.innerHTML = S.screenHead({ title: 'הלקוח לא נמצא', back: '#customers', backLabel: 'חזרה ללקוחות' }) + '<div class="card bz-empty">ייתכן שנמחק.</div>';
      return;
    }
    var v = c || { name: '', contact: '', phone: '', email: '', bill: 'tasks', rateHour: '', rateDay: '', note: '' };
    var form = '<form class="card pad" data-cform novalidate><div class="form-grid">' +
      '<label class="fld">שם הלקוח<input data-k="name" required value="' + esc(v.name) + '"></label>' +
      '<label class="fld">איש/אשת קשר<input data-k="contact" value="' + esc(v.contact) + '"></label>' +
      '<label class="fld">טלפון<input data-k="phone" type="tel" inputmode="tel" dir="ltr" value="' + esc(v.phone) + '"></label>' +
      '<label class="fld">מייל<input data-k="email" type="email" inputmode="email" dir="ltr" value="' + esc(v.email || '') + '"></label>' +
      '<label class="fld">איך הלקוח משלם<select data-k="bill">' +
        [['tasks', 'לפי משימה (סכום קבוע)'], ['hours', 'לפי שעות'], ['days', 'לפי ימי עבודה'], ['both', 'שעות וימים']].map(function (o) {
          return '<option value="' + o[0] + '"' + (v.bill === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
        }).join('') + '</select></label>' +
      '<label class="fld" data-rh>תעריף לשעה (₪)<input data-k="rateHour" type="number" inputmode="decimal" min="0" step="0.5" dir="ltr" value="' + esc(v.rateHour) + '"></label>' +
      '<label class="fld" data-rd>תעריף ליום עבודה (₪)<input data-k="rateDay" type="number" inputmode="decimal" min="0" step="0.5" dir="ltr" value="' + esc(v.rateDay) + '"></label>' +
      '<label class="fld bz-wide">הערה<textarea data-k="note">' + esc(v.note || '') + '</textarea></label></div>' +
      '<p class="bz-note" data-bnote></p>' +
      '<p class="err" data-err hidden></p>' +
      '<div class="fix-a"><button class="btn pri" type="submit">' + S.icon('check') + (isNew ? 'הוספת הלקוח' : 'שמירה') + '</button>' +
      (isNew ? '<a class="btn ghost" href="#customers">ביטול</a>' : '') + '</div></form>';

    var extra = '';
    if (!isNew) {
      var ords = st().orders.filter(function (o) { return o.custId === c.id; })
        .sort(function (a, b) { var ka = (a.date || '') + (a.time || ''), kb = (b.date || '') + (b.time || ''); return ka < kb ? 1 : ka > kb ? -1 : 0; });
      var shown = ui.allOrders === c.id ? ords : ords.slice(0, 8);
      var qs = (st().quotes || []).filter(function (q) { return q.custId === c.id; });
      var u = custUse(c.id);
      extra = '<h2 class="sec-t">הזמנות ותורים (' + ords.length + ')</h2>' +
        (ords.length ? '<ul class="card bz-list">' + shown.map(function (o) {
          var stt = OST[o.status] || Esek.STATUS[o.status] || o.status;
          return '<li><a class="bz-li" href="#order/' + esc(o.id) + '"><span class="bz-tx"><b>' + esc(S.workLabel(o).title || o.title) + '</b><span>' +
            (o.date ? S.fmtDate(o.date) + (o.time ? ' · ' + S.ltr(o.time) : '') : 'בלי תאריך') + '</span></span>' +
            '<span class="tag' + (o.status === 'done' || o.status === 'closed' ? ' ok' : o.status === 'req' ? '' : ' info') + '">' + esc(stt) + '</span>' + S.icon('chevron', 'bz-chev') + '</a></li>';
        }).join('') + '</ul>' + (ords.length > shown.length ? '<div class="bz-more"><button class="btn" type="button" data-allo>הצגת כל ' + ords.length + ' ההזמנות</button></div>' : '')
          : '<div class="card bz-empty">עוד אין הזמנות ללקוח הזה.</div>') +
        '<h2 class="sec-t">הצעות מחיר (' + qs.length + ')</h2>' +
        (qs.length ? '<ul class="card bz-list">' + qs.map(function (q) {
          return '<li><a class="bz-li" href="#quote/' + esc(q.id) + '"><span class="bz-tx"><b>' + esc((q.lines[0] && q.lines[0].text) || 'הצעת מחיר') +
            (q.lines.length > 1 ? ' ועוד ' + (q.lines.length - 1) : '') + '</b><span>' + S.fmtDate(q.date) + '</span></span>' +
            '<span class="bz-fig"><b>' + money(Esek.quoteTotal(q)) + '</b><small>' + esc(QST[q.status] || q.status) + '</small></span>' + S.icon('chevron', 'bz-chev') + '</a></li>';
        }).join('') + '</ul>' : '<div class="card bz-empty">אין הצעות מחיר ללקוח הזה.</div>') +
        '<div class="bz-danger">' + (u.used
          ? '<p class="bz-note">אי אפשר למחוק לקוח שיש לו הזמנות או הצעות מחיר.</p>'
          : '<button class="btn danger" type="button" data-del>' + S.icon('trash', 'sm') + 'מחיקת הלקוח</button>') + '</div>';
    }
    el.innerHTML = S.screenHead({ title: isNew ? 'לקוח חדש' : c.name, sub: isNew ? '' : esc(termsText(c)), back: '#customers', backLabel: 'חזרה ללקוחות',
      actions: isNew ? '' : '<a class="btn" href="#rep/bill/' + esc(c.id) + '/' + S.ym() + '">' + S.icon('file') + 'חיוב החודש</a>' }) + form + extra;

    var f = el.querySelector('[data-cform]');
    holdOnInput(f);
    function syncBill() {
      var b = f.querySelector('[data-k="bill"]').value;
      f.querySelector('[data-rd]').style.display = b === 'hours' || b === 'tasks' ? 'none' : '';
      f.querySelector('[data-rh]').style.display = b === 'days' || b === 'tasks' ? 'none' : '';
      f.querySelector('[data-bnote]').innerHTML = b === 'tasks'
        ? 'הלקוח משלם סכום קבוע על כל משימה שבוצעה, בלי קשר לשעות. את המחירים קובעים ב<a href="#customers/services">שירותים ומשימות</a>. הזמנה מהצעת מחיר מחויבת לפי ההצעה.'
        : 'הלקוח משלם לפי השעות או הימים שאושרו בדיווחים. הזמנה מהצעת מחיר מחויבת לפי ההצעה.';
    }
    f.querySelector('[data-k="bill"]').addEventListener('change', syncBill);
    syncBill();
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      function g(k) { return f.querySelector('[data-k="' + k + '"]').value; }
      var d = { name: trim(g('name')), contact: trim(g('contact')), phone: trim(g('phone')), email: trim(g('email')), bill: g('bill'),
        rateHour: g('rateHour'), rateDay: g('rateDay'), note: trim(g('note')) };
      var err = f.querySelector('[data-err]'), msg = '';
      if (!d.name) msg = 'צריך שם לקוח.';
      else if (st().customers.some(function (x) { return x.name === d.name && (!c || x.id !== c.id); })) msg = 'כבר יש לקוח בשם הזה.';
      else if (d.phone && Esek.normPhone(d.phone).length < 9) msg = 'מספר הטלפון קצר מדי.';
      else if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) msg = 'כתובת המייל לא תקינה.';
      else if (d.bill !== 'tasks' && ((d.bill !== 'days' && (d.rateHour === '' || +d.rateHour < 0)) || (d.bill !== 'hours' && (d.rateDay === '' || +d.rateDay < 0)))) msg = 'צריך תעריף (0 ומעלה).';
      err.hidden = !msg; err.textContent = msg;
      if (msg) return;
      var cur = isNew ? null : Esek.byId(st().customers, c.id);
      if (!isNew && !cur) { S.toast('הלקוח לא נמצא. ייתכן שנמחק.'); S.go('#customers'); return; }
      var t = cur || { id: nid('c') };
      t.name = d.name; t.contact = d.contact || d.name; t.phone = d.phone; t.email = d.email; t.bill = d.bill;
      t.rateHour = d.bill === 'days' || d.bill === 'tasks' ? (+t.rateHour || 0) : +d.rateHour;
      t.rateDay = d.bill === 'hours' || d.bill === 'tasks' ? (+t.rateDay || 0) : +d.rateDay;
      t.note = d.note;
      if (!cur) st().customers.push(t);
      Esek.save();
      S.hold(false);
      S.toast(isNew ? 'הלקוח נוסף' : 'הפרטים נשמרו');
      if (isNew) S.go('#customer/' + t.id); else S.refresh();
    });
    el.addEventListener('click', function (ev) {
      if (ev.target.closest('[data-allo]')) { ui.allOrders = c.id; S.refresh(); }
      else if (ev.target.closest('[data-del]')) {
        S.modal({ title: 'מחיקת ' + c.name, html: '<p>הלקוח יימחק מהרשימה. אין לו הזמנות או הצעות מחיר.</p>',
          actions: [{ label: 'מחיקה', cls: 'warn', onClick: function () {
            if (custUse(c.id).used) { S.toast('הלקוח בשימוש, לא נמחק'); return; }
            st().customers = st().customers.filter(function (x) { return x.id !== c.id; });
            Esek.save(); S.toast('הלקוח נמחק'); setTimeout(function () { S.go('#customers'); }, 0);
          } }, { label: 'ביטול', cls: 'ghost' }] });
      }
    });
  }

  /* ---------- לשונית שירותים ומשימות + שעות פעילות ---------- */
  function taskName(id) { var t = Esek.byId(tasks(), id); return t ? t.name : 'משימה'; }
  function itemOf(id) { return Esek.byId(items(), id); }
  function typeName(id) { var t = Esek.byId(st().biz.types || [], id); return t ? t.name : ''; }
  function svcTab(el) {
    var svs = services().slice().sort(byName), tks = tasks(), h = st().biz.hours || { days: [], open: '08:00', close: '16:00' };
    el.innerHTML = S.screenHead({ title: 'לקוחות ושירותים', sub: esc(st().biz.name),
      actions: '<a class="btn pri" href="#service/new">' + S.icon('plus') + 'שירות חדש</a>' }) + tabs('svc') +
      '<h2 class="sec-t">שירותים (' + svs.length + ')</h2>' +
      '<ul class="card bz-list">' + svs.map(function (s) {
        var sp = (s.split || []).map(function (x) { return taskName(x.taskId) + ' ' + x.minutes + ' דק\''; }).join(' + ');
        var mt = (s.materials || []).map(function (m) { var it = itemOf(m.itemId); return (it ? it.name : 'פריט') + ' × ' + S.fmtNum(m.qty); }).join(' · ');
        return '<li><a class="bz-li" href="#service/' + esc(s.id) + '"><span class="bz-ic">' + S.icon('doc') + '</span>' +
          '<span class="bz-tx"><b>' + esc(s.name) + '</b><span>' + esc(typeName(s.typeId)) + ' · ' + num(s.minutes) + ' דק\'' +
          (sp ? ' · ' + esc(sp) : '') + '</span>' + (mt ? '<span class="bz-sub2">חומרים: ' + esc(mt) + '</span>' : '') + '</span>' +
          '<span class="bz-fig"><b>' + money(s.price) + '</b><small>מחיר לתצוגה</small></span>' + S.icon('chevron', 'bz-chev') + '</a></li>';
      }).join('') + '</ul>' +
      '<h2 class="sec-t">משימות (' + tks.length + ')</h2>' +
      '<p class="bz-note">תעריף לשעה = שכר התלמיד.ה על שעות שפורטו למשימה. מחיר לביצוע = מה שהלקוח משלם על כל ביצוע, בלי קשר לשעות.</p>' +
      '<div class="card"><table class="bz-t"><thead><tr><th>משימה</th><th>שכר לשעה</th><th>מחיר ללקוח לביצוע</th><th><span class="sr">פעולות</span></th></tr></thead><tbody>' +
        tks.map(function (t) {
          return '<tr data-task="' + esc(t.id) + '"><td data-l=""><b>' + esc(t.name) + '</b></td><td data-l="שכר לשעה">' + money(t.rate) + '</td>' +
            '<td data-l="מחיר לביצוע">' + money(t.price) + '</td><td class="bz-go"><button class="btn" type="button" data-tedit="' + esc(t.id) + '">' + S.icon('edit', 'sm') + 'עריכה</button></td></tr>';
        }).join('') + '</tbody></table><div class="bz-more"><button class="btn" type="button" data-tadd>' + S.icon('plus') + 'משימה חדשה</button></div></div>' +
      '<h2 class="sec-t">שעות פעילות</h2>' +
      '<form class="card pad" data-hform><fieldset class="bz-days-f"><legend>ימי פעילות</legend><div class="bz-dayck">' +
        DAYS.map(function (d, i) {
          return '<label class="chk"><input type="checkbox" data-day="' + i + '"' + (h.days.indexOf(i) >= 0 ? ' checked' : '') + '>' + d + '</label>';
        }).join('') + '</div></fieldset>' +
        '<div class="times"><label class="fld">משעה<input type="time" dir="ltr" data-open value="' + esc(h.open) + '"></label>' +
        '<label class="fld">עד שעה<input type="time" dir="ltr" data-close value="' + esc(h.close) + '"></label></div>' +
        '<p class="bz-note">לפי השעות האלה נבנים ציר היום בבית והמשבצות הפנויות בדף ההזמנה ללקוחות.</p>' +
        '<p class="err" data-herr hidden></p><div class="fix-a"><button class="btn pri" type="submit">' + S.icon('check') + 'שמירת שעות הפעילות</button></div></form>';

    var hf = el.querySelector('[data-hform]');
    holdOnInput(hf);
    hf.addEventListener('change', function () { S.hold(true); });
    hf.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var days = [];
      hf.querySelectorAll('[data-day]').forEach(function (c) { if (c.checked) days.push(+c.getAttribute('data-day')); });
      var o = hf.querySelector('[data-open]').value, c2 = hf.querySelector('[data-close]').value, err = hf.querySelector('[data-herr]');
      var msg = !days.length ? 'צריך לפחות יום פעילות אחד.' : !o || !c2 || !(Esek.hoursBetween(o, c2) > 0) ? 'שעת הסיום צריכה להיות אחרי שעת הפתיחה.' : '';
      err.hidden = !msg; err.textContent = msg;
      if (msg) return;
      st().biz.hours = { days: days, open: o, close: c2 };
      Esek.save(); S.hold(false); S.toast('שעות הפעילות נשמרו'); S.refresh();
    });
    el.onclick = function (ev) {
      var b;
      if ((b = ev.target.closest('[data-tedit]'))) taskModal(b.getAttribute('data-tedit'));
      else if (ev.target.closest('[data-tadd]')) taskModal(null);
    };
  }
  function taskModal(id) {
    var t = id ? Esek.byId(tasks(), id) : null, u = t ? taskUse(t.id) : { used: false };
    var v = t || { name: '', rate: '', price: '' };
    S.modal({
      title: t ? 'עריכת משימה' : 'משימה חדשה',
      html: '<div class="form-grid"><label class="fld bz-wide">שם המשימה<input data-tn value="' + esc(v.name) + '"></label>' +
        '<label class="fld">שכר לשעה לתלמיד.ה (₪)<input data-tr type="number" inputmode="decimal" min="0" step="0.5" dir="ltr" value="' + esc(v.rate) + '"></label>' +
        '<label class="fld">מחיר ללקוח לכל ביצוע (₪)<input data-tp type="number" inputmode="decimal" min="0" step="1" dir="ltr" value="' + esc(v.price) + '"></label></div>' +
        '<p class="bz-note">משימה פנימית (בלי חיוב ללקוח): מחיר 0.</p>' +
        (t ? (u.used ? '<p class="bz-note">בשימוש: ' + [u.services ? u.services + ' שירותים' : '', u.orders ? u.orders + ' הזמנות' : '', u.entries ? u.entries + ' דיווחים' : ''].filter(Boolean).join(' · ') + '. לכן אי אפשר למחוק.</p>'
          : '<button class="btn danger" type="button" data-tdel>' + S.icon('trash', 'sm') + 'מחיקת המשימה</button>') : '') +
        '<p class="err" data-terr hidden></p>',
      onOpen: function (api) {
        var d = api.body.querySelector('[data-tdel]');
        if (d) d.addEventListener('click', function () {
          if (taskUse(t.id).used) return;
          st().biz.tasks = tasks().filter(function (x) { return x.id !== t.id; });
          Esek.save(); api.close(); S.toast('המשימה נמחקה'); S.refresh();
        });
      },
      actions: [{ label: t ? 'שמירה' : 'הוספה', cls: 'pri', onClick: function (api) {
        var n = trim(api.body.querySelector('[data-tn]').value), r = api.body.querySelector('[data-tr]').value, p = api.body.querySelector('[data-tp]').value;
        var err = api.body.querySelector('[data-terr]');
        var msg = !n ? 'צריך שם משימה.' : tasks().some(function (x) { return x.name === n && (!t || x.id !== t.id); }) ? 'כבר יש משימה בשם הזה.'
          : (r === '' || +r < 0) ? 'צריך שכר לשעה (0 ומעלה).' : (p === '' || +p < 0) ? 'צריך מחיר לביצוע (0 ומעלה).' : '';
        if (msg) { err.hidden = false; err.textContent = msg; return false; }
        var cur = t ? Esek.byId(tasks(), t.id) : null;
        var x = cur || { id: nid('tk') };
        x.name = n; x.rate = +r; x.price = +p;
        if (!cur) tasks().push(x);
        Esek.save(); S.toast(t ? 'המשימה נשמרה' : 'המשימה נוספה'); setTimeout(S.refresh, 0);
      } }, { label: 'ביטול', cls: 'ghost' }]
    });
  }

  /* ---------- שירות ---------- */
  function svcScreen(el, id) {
    var isNew = id === 'new', s = isNew ? null : Esek.byId(services(), id);
    if (!isNew && !s) {
      el.innerHTML = S.screenHead({ title: 'השירות לא נמצא', back: '#customers/services', backLabel: 'חזרה לשירותים' }) + '<div class="card bz-empty">ייתכן שנמחק.</div>';
      return;
    }
    var types = st().biz.types || [];
    var v = s || { name: '', typeId: types[0] ? types[0].id : '', minutes: 30, price: '', split: [], materials: [] };
    var split = (v.split || []).map(function (x) { return { taskId: x.taskId, minutes: x.minutes }; });
    var mats = (v.materials || []).map(function (x) { return { itemId: x.itemId, qty: x.qty }; });
    var u = s ? serviceUse(s.id) : { used: false };
    el.innerHTML = S.screenHead({ title: isNew ? 'שירות חדש' : s.name, back: '#customers/services', backLabel: 'חזרה לשירותים' }) +
      '<form class="card pad" data-sform novalidate><div class="form-grid">' +
        '<label class="fld">שם השירות<input data-k="name" value="' + esc(v.name) + '"></label>' +
        '<label class="fld">סוג עבודה<select data-k="typeId">' + types.map(function (t) {
          return '<option value="' + esc(t.id) + '"' + (t.id === v.typeId ? ' selected' : '') + '>' + esc(t.name) + (t.pro ? ' (נספר לתעודה)' : '') + '</option>';
        }).join('') + '</select></label>' +
        '<label class="fld">משך (דקות)<input data-k="minutes" type="number" inputmode="numeric" min="5" step="5" dir="ltr" value="' + esc(v.minutes) + '"></label>' +
        '<label class="fld">מחיר לתצוגה (₪)<input data-k="price" type="number" inputmode="decimal" min="0" step="1" dir="ltr" value="' + esc(v.price) + '"></label></div>' +
        '<p class="bz-note">המחיר לתצוגה ממלא שורה בהצעת מחיר. החיוב בפועל: לפי המשימות שבוצעו, הצעת מחיר שאושרה או תנאי הלקוח.</p>' +
        '<h3 class="bz-h3">חלוקה למשימות (ברירת מחדל לדיווח)</h3><div data-split></div>' +
        '<h3 class="bz-h3">חומרים לכל ביצוע (יורדים מהמלאי)</h3><div data-mats></div>' +
        '<p class="err" data-err hidden></p>' +
        '<div class="fix-a"><button class="btn pri" type="submit">' + S.icon('check') + (isNew ? 'הוספת השירות' : 'שמירה') + '</button>' +
        (isNew ? '<a class="btn ghost" href="#customers/services">ביטול</a>' : '') + '</div></form>' +
      (isNew ? '' : '<div class="bz-danger">' + (u.used ? '<p class="bz-note">אי אפשר למחוק: השירות מופיע ב-' + [u.orders ? u.orders + ' הזמנות' : '', u.quotes ? u.quotes + ' הצעות מחיר' : ''].filter(Boolean).join(' ו-') + '.</p>'
        : '<button class="btn danger" type="button" data-del>' + S.icon('trash', 'sm') + 'מחיקת השירות</button>') + '</div>');

    var f = el.querySelector('[data-sform]'), spEl = f.querySelector('[data-split]'), mtEl = f.querySelector('[data-mats]');
    holdOnInput(f);
    function minutesV() { return +f.querySelector('[data-k="minutes"]').value || 0; }
    function drawSplit() {
      var tks = tasks(), used = 0;
      split.forEach(function (x) { used += +x.minutes || 0; });
      spEl.innerHTML = (split.length ? '<ul class="bz-ed">' + split.map(function (x, i) {
        return '<li><label class="fld">משימה<select data-sp-t="' + i + '">' + tks.map(function (t) {
          return '<option value="' + esc(t.id) + '"' + (t.id === x.taskId ? ' selected' : '') + '>' + esc(t.name) + '</option>';
        }).join('') + '</select></label><label class="fld">דקות<input data-sp-m="' + i + '" type="number" inputmode="numeric" min="0" step="5" dir="ltr" value="' + esc(x.minutes) + '"></label>' +
          '<button class="btn ghost icon" type="button" data-sp-del="' + i + '" aria-label="הסרת המשימה">' + S.icon('trash') + '</button></li>';
      }).join('') + '</ul>' : '<p class="bz-note">אין חלוקה: כל השעות בתעריף הרגיל, והלקוח לפי תנאי החיוב.</p>') +
        '<p class="bz-sumline" data-sp-sum>חולקו ' + num(used) + ' מתוך ' + num(minutesV()) + ' דקות</p>' +
        '<button class="btn" type="button" data-sp-add' + (tks.length ? '' : ' disabled') + '>' + S.icon('plus') + 'הוספת משימה</button>';
    }
    function drawMats() {
      var its = items();
      mtEl.innerHTML = (mats.length ? '<ul class="bz-ed">' + mats.map(function (x, i) {
        var it = itemOf(x.itemId);
        return '<li><label class="fld">פריט מלאי<select data-mt-i="' + i + '">' + its.map(function (t) {
          return '<option value="' + esc(t.id) + '"' + (t.id === x.itemId ? ' selected' : '') + '>' + esc(t.name) + '</option>';
        }).join('') + '</select></label><label class="fld">כמות' + (it ? ' (' + esc(it.unit) + ')' : '') + '<input data-mt-q="' + i + '" type="number" inputmode="decimal" min="0" step="0.05" dir="ltr" value="' + esc(x.qty) + '"></label>' +
          '<button class="btn ghost icon" type="button" data-mt-del="' + i + '" aria-label="הסרת הפריט">' + S.icon('trash') + '</button></li>';
      }).join('') + '</ul>' : '<p class="bz-note">השירות לא צורך חומרים מהמלאי.</p>') +
        '<button class="btn" type="button" data-mt-add' + (its.length ? '' : ' disabled') + '>' + S.icon('plus') + 'הוספת חומר</button>';
    }
    drawSplit(); drawMats();
    f.addEventListener('change', function (ev) {
      var t = ev.target;
      if (t.hasAttribute('data-sp-t')) split[+t.getAttribute('data-sp-t')].taskId = t.value;
      else if (t.hasAttribute('data-mt-i')) { mats[+t.getAttribute('data-mt-i')].itemId = t.value; drawMats(); }
    });
    f.addEventListener('input', function (ev) {
      var t = ev.target;
      if (t.hasAttribute('data-sp-m')) { split[+t.getAttribute('data-sp-m')].minutes = t.value; }
      else if (t.hasAttribute('data-mt-q')) { mats[+t.getAttribute('data-mt-q')].qty = t.value; return; }
      else if (t.getAttribute('data-k') !== 'minutes') return;
      var used = 0;
      split.forEach(function (x) { used += +x.minutes || 0; });
      var sm = f.querySelector('[data-sp-sum]');
      if (sm) sm.innerHTML = 'חולקו ' + num(used) + ' מתוך ' + num(minutesV()) + ' דקות';
    });
    f.addEventListener('click', function (ev) {
      var b;
      if ((b = ev.target.closest('[data-sp-del]'))) { split.splice(+b.getAttribute('data-sp-del'), 1); drawSplit(); }
      else if (ev.target.closest('[data-sp-add]')) { S.hold(true); split.push({ taskId: tasks()[0].id, minutes: '' }); drawSplit(); }
      else if ((b = ev.target.closest('[data-mt-del]'))) { mats.splice(+b.getAttribute('data-mt-del'), 1); drawMats(); }
      else if (ev.target.closest('[data-mt-add]')) { S.hold(true); mats.push({ itemId: items()[0].id, qty: 1 }); drawMats(); }
    });
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      function g(k) { return f.querySelector('[data-k="' + k + '"]').value; }
      var name = trim(g('name')), mins = +g('minutes'), price = g('price'), err = f.querySelector('[data-err]');
      var sp = split.filter(function (x) { return x.taskId && +x.minutes > 0; }).map(function (x) { return { taskId: x.taskId, minutes: Math.round(+x.minutes) }; });
      var mt = mats.filter(function (x) { return x.itemId && +x.qty > 0; }).map(function (x) { return { itemId: x.itemId, qty: r2(+x.qty) }; });
      var spSum = 0;
      sp.forEach(function (x) { spSum += x.minutes; });
      var msg = !name ? 'צריך שם שירות.' : services().some(function (x) { return x.name === name && (!s || x.id !== s.id); }) ? 'כבר יש שירות בשם הזה.'
        : !(mins > 0) ? 'צריך משך בדקות.' : (price === '' || +price < 0) ? 'צריך מחיר לתצוגה (0 ומעלה).'
          : spSum > mins ? 'החלוקה למשימות (' + spSum + ' דק\') ארוכה ממשך השירות (' + mins + ' דק\').' : '';
      err.hidden = !msg; err.textContent = msg;
      if (msg) return;
      var cur = isNew ? null : Esek.byId(services(), s.id);
      if (!isNew && !cur) { S.toast('השירות לא נמצא. ייתכן שנמחק.'); S.go('#customers/services'); return; }
      var x = cur || { id: nid('sv') };
      x.name = name; x.typeId = g('typeId'); x.minutes = Math.round(mins); x.price = +price; x.split = sp; x.materials = mt;
      if (!cur) services().push(x);
      Esek.save(); S.hold(false);
      S.toast(isNew ? 'השירות נוסף' : 'השירות נשמר');
      if (isNew) S.go('#service/' + x.id); else S.refresh();
    });
    var del = el.querySelector('[data-del]');
    if (del) del.addEventListener('click', function () {
      S.modal({ title: 'מחיקת ' + s.name, html: '<p>השירות יימחק. הוא לא מופיע בהזמנות או בהצעות מחיר.</p>',
        actions: [{ label: 'מחיקה', cls: 'warn', onClick: function () {
          if (serviceUse(s.id).used) { S.toast('השירות בשימוש, לא נמחק'); return; }
          st().biz.services = services().filter(function (x) { return x.id !== s.id; });
          Esek.save(); S.toast('השירות נמחק'); setTimeout(function () { S.go('#customers/services'); }, 0);
        } }, { label: 'ביטול', cls: 'ghost' }] });
    });
  }

  Shell.page('customers', {
    title: 'לקוחות ושירותים',
    render: function (el, params) {
      if (params[0] === 'services') svcTab(el); else custList(el);
    }
  });
  Shell.page('customer', { title: 'לקוח', nav: 'customers', render: function (el, params) { custScreen(el, params[0] || 'new'); } });
  Shell.page('service', { title: 'שירות', nav: 'customers', render: function (el, params) { svcScreen(el, params[0] || 'new'); } });
})();
