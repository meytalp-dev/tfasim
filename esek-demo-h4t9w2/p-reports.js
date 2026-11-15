/* p-reports.js — #reports: עיבוד ודוחות. כל דוח מסך נפרד עם "חזרה".
   #reports                       רשימת 5 הדוחות
   #rep/pay/<ym>                  סיכום חודשי לשכר
   #rep/bill/all/<ym>             חיוב: סקירת כל הלקוחות בחודש
   #rep/bill/<custId>/<ym>        חיוב לפי לקוח (חודש)  ·  #rep/bill/<custId>/<from>/<to> (טווח תאריכים)
   #rep/cert                      שעות לתעודה
   #rep/cmp/<ymA>/<ymB>           השוואה בין חודשים + סיכום לפי תלמיד.ה ותאריך
   #rep/bulk                      תיקון גורף */
(function () {
  'use strict';
  var S = Shell, esc = S.esc;
  var ui = { billMode: 'month', sum: { cust: '', bill: false }, bf: null, bsel: {}, bshown: 30 };
  var STATUS = { prep: 'ממתין לתלמיד.ה', wait: 'ממתין לאישורך', ok: 'אושר', no: 'נדחה' };

  /* ---------- עזרים ---------- */
  function r2(x) { return Math.round((+x || 0) * 100) / 100; }
  function money(n) { return '<bdi dir="ltr" class="num">' + S.fmtNum(r2(n)) + ' ₪</bdi>'; }
  function num(n) { return '<bdi dir="ltr" class="num">' + S.fmtNum(n) + '</bdi>'; }
  function validYm(x) { return /^\d{4}-(0[1-9]|1[0-2])$/.test(x || ''); }
  function validD(x) { return /^\d{4}-\d{2}-\d{2}$/.test(x || ''); }
  function addMonth(ym, n) {
    var y = +ym.slice(0, 4), m = +ym.slice(5, 7) - 1 + n;
    y += Math.floor(m / 12); m = ((m % 12) + 12) % 12;
    return y + '-' + (m < 9 ? '0' : '') + (m + 1);
  }
  function ymLabel(ym) { return S.monthName(ym) + ' ' + ym.slice(0, 4); }
  function monthList(extra) {
    var cur = S.ym(), min = cur, out = [];
    Esek.state.entries.forEach(function (e) {
      var m = String(e.date || '').slice(0, 7);
      if (validYm(m) && m < min) min = m;
    });
    var lo = addMonth(cur, -11);
    if (min < lo) lo = min;
    for (var ym = cur, i = 0; ym >= lo && i < 36; ym = addMonth(ym, -1), i++) out.push(ym);
    if (extra && validYm(extra) && out.indexOf(extra) < 0) { out.push(extra); out.sort().reverse(); }
    return out;
  }
  function monthSel(attr, val, label, extraOpts) {
    return '<label class="fld">' + esc(label) + '<select ' + attr + '>' + (extraOpts || '') +
      monthList(val).map(function (ym) {
        return '<option value="' + ym + '"' + (ym === val ? ' selected' : '') + '>' + esc(ymLabel(ym)) + '</option>';
      }).join('') + '</select></label>';
  }
  function dText(ymd) { return S.fmtDateText(ymd, { noDay: true, year: true }); }
  function tsv(rows) {
    return rows.map(function (r) {
      return r.map(function (c) { return String(c === null || c === undefined ? '' : c).replace(/[\t\r\n]+/g, ' '); }).join('\t');
    }).join('\n');
  }
  function download(name, csv) {
    try {
      var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); if (a.parentNode) a.parentNode.removeChild(a); }, 1000);
      S.toast('הקובץ ירד: ' + name);
    } catch (e) { console.error(e); S.toast('לא הצלחתי ליצור את הקובץ'); }
  }
  // סרגל פעולות: העתקה / ייצוא / הדפסה
  function actBar(copyText, withCsv, withPrint) {
    return '<div class="bz-acts no-print">' +
      (copyText !== null && copyText !== undefined ? S.copyBtn(copyText, 'העתקה') : '') +
      (withCsv ? '<button class="btn" type="button" data-csv>' + S.icon('file') + '<span>ייצוא לאקסל</span></button>' : '') +
      (withPrint ? '<button class="btn" type="button" data-print>' + S.icon('doc') + '<span>הדפסה</span></button>' : '') +
      '</div>';
  }
  function wireActs(el, csvName, csvFn) {
    el.addEventListener('click', function (ev) {
      if (ev.target.closest('[data-csv]')) { download(csvName, csvFn()); }
      else if (ev.target.closest('[data-print]')) { try { window.print(); } catch (e) { /* חסום */ } }
    });
  }
  function custLabel(c) { return c ? c.name : ''; }
  function sortedCustomers() {
    return Esek.state.customers.slice().sort(function (a, b) { return String(a.name).localeCompare(String(b.name), 'he'); });
  }
  function sortedStudents() {
    return Esek.state.students.slice().sort(function (a, b) { return String(a.name).localeCompare(String(b.name), 'he'); });
  }
  function payTotal(ym) {
    var t = 0;
    Esek.payroll2(ym).forEach(function (r) { t += r.total; });
    return r2(t);
  }
  function billTotal(from, to) {
    var t = 0;
    Esek.state.customers.forEach(function (c) { t += Esek.custBill2(c.id, from, to).amount; });
    return r2(t);
  }
  function emptyCard(msg) { return '<div class="card bz-empty">' + esc(msg) + '</div>'; }

  /* ---------- רשימת הדוחות ---------- */
  function listScreen(el) {
    var ym = S.ym(), mr = Esek.monthRange(ym);
    var wait = Esek.entries({ status: 'wait' }).length + Esek.entries({ status: 'prep' }).length;
    var maxCert = 0;
    Esek.state.students.forEach(function (s) { var h = Esek.certHours(s.id); if (h > maxCert) maxCert = h; });
    var items = [
      { href: '#rep/pay', icon: 'coin', t: 'סיכום חודשי לשכר', s: 'לכל תלמיד.ה: שעות, ימי עבודה, שורה לכל תעריף וסה"כ', f: money(payTotal(ym)), fl: 'שכר ב' + S.monthName(ym) },
      { href: '#rep/bill', icon: 'file', t: 'חיוב לפי לקוח', s: 'משימות, הצעות מחיר ותנאי החיוב · מסמך דרישת תשלום להדפסה', f: money(billTotal(mr.from, mr.to)), fl: 'לחיוב ב' + S.monthName(ym) },
      { href: '#rep/cert', icon: 'cap', t: 'שעות לתעודה', s: 'שעות מקצועיות מאושרות לכל תלמיד.ה', f: S.fmtHours(maxCert), fl: 'הכי הרבה' },
      { href: '#rep/cmp', icon: 'chart', t: 'השוואה בין חודשים', s: 'שעות, ימי עבודה, שכר וחיוב · סיכום לפי תלמיד.ה ותאריך', f: esc(S.monthName(ym)) + ' מול ' + esc(S.monthName(addMonth(ym, -1))), fl: '' },
      { href: '#rep/bulk', icon: 'edit', t: 'תיקון גורף', s: 'סינון, סימון שורות ואישור, דחייה או שינוי שעות ותעריף בבת אחת', f: num(wait), fl: 'דיווחים לא סגורים' }
    ];
    el.innerHTML = S.screenHead({ title: 'עיבוד ודוחות', sub: esc(Esek.state.biz.name) + ' · ' + esc(ymLabel(ym)) }) +
      '<ul class="card bz-list">' + items.map(function (it) {
        return '<li><a class="bz-li" href="' + it.href + '"><span class="bz-ic">' + S.icon(it.icon) + '</span>' +
          '<span class="bz-tx"><b>' + esc(it.t) + '</b><span>' + esc(it.s) + '</span></span>' +
          '<span class="bz-fig"><b>' + it.f + '</b>' + (it.fl ? '<small>' + esc(it.fl) + '</small>' : '') + '</span>' +
          S.icon('chevron', 'bz-chev') + '</a></li>';
      }).join('') + '</ul>';
  }

  /* ---------- 1. סיכום חודשי לשכר ---------- */
  function lineName(l) { return l.taskId ? (l.task || 'משימה') : 'תעריף רגיל'; }
  function lineTxt(l) { return lineName(l) + ' ' + S.fmtNum(l.hours) + ' ש\' × ' + S.fmtNum(l.rate) + ' ₪ = ' + S.fmtNum(l.amount) + ' ₪'; }
  function payScreen(el, p) {
    var ym = validYm(p[0]) ? p[0] : S.ym();
    var rows = Esek.payroll2(ym), N = Esek.state.students.length;
    var grand = 0, hours = 0, days = 0;
    rows.forEach(function (r) { grand += r.total; hours += r.hours; days += r.days; });
    grand = r2(grand); hours = r2(hours);
    var copy = [['שם', 'כיתה', 'שעות', 'ימי עבודה', 'פירוט', 'סה"כ ₪']].concat(rows.map(function (r) {
      return [r.stu.name, r.stu.cls, r.hours, r.days, r.lines.map(lineTxt).join(' | '), r.total];
    })).concat([['סה"כ', '', hours, days, '', grand]]);
    var body = rows.map(function (r) {
      return '<tr data-total="' + r.total + '"><td data-l=""><b>' + esc(r.stu.name) + '</b><small>' + esc(r.stu.cls ? 'כיתה ' + r.stu.cls : '') + '</small></td>' +
        '<td data-l="שעות">' + S.fmtHours(r.hours) + '</td>' +
        '<td data-l="ימי עבודה">' + num(r.days) + '</td>' +
        '<td data-l="לפי תעריף" class="bz-lns">' + r.lines.map(function (l) {
          return '<div class="bz-ln"><span>' + esc(lineName(l)) + '</span><span class="muted">' + S.fmtHours(l.hours) + ' × ' + money(l.rate) + '</span><b>' + money(l.amount) + '</b></div>';
        }).join('') + (r.over ? '<span class="tag">' + S.icon('alert') + 'פירוט מעל השעות ב-' + S.ltr(r.over) + ' דיווחים: חושב בתעריף רגיל</span>' : '') + '</td>' +
        '<td data-l="סה&quot;כ" class="bz-sum">' + money(r.total) + '</td></tr>';
    }).join('');
    el.innerHTML = S.screenHead({ title: 'סיכום חודשי לשכר', sub: esc(ymLabel(ym)) + ' · שעות מאושרות בלבד', back: '#reports', backLabel: 'חזרה לדוחות' }) +
      '<div class="card pad bz-ctl no-print"><div class="bz-ctl-r">' + monthSel('data-ym', ym, 'חודש') + '</div>' + actBar(tsv(copy), true, true) + '</div>' +
      '<div class="bz-kpis">' +
        '<div class="card bz-kpi"><span>סה"כ לשכר</span><b data-grand="' + grand + '">' + money(grand) + '</b></div>' +
        '<div class="card bz-kpi"><span>שעות</span><b>' + S.fmtHours(hours) + '</b></div>' +
        '<div class="card bz-kpi">' + S.progress(rows.length, N, 'תלמידים עבדו', 'o') + '</div></div>' +
      (rows.length ? '<div class="card"><table class="bz-t"><thead><tr><th>תלמיד.ה</th><th>שעות</th><th>ימי עבודה</th><th>לפי תעריף</th><th>סה"כ</th></tr></thead><tbody>' + body +
        '</tbody><tfoot><tr><td data-l="">סה"כ</td><td data-l="שעות">' + S.fmtHours(hours) + '</td><td data-l="ימי עבודה">' + num(days) + '</td><td class="bz-hide-m"></td><td data-l="סה&quot;כ" class="bz-sum">' + money(grand) + '</td></tr></tfoot></table></div>'
        : emptyCard('אין שעות מאושרות ב' + ymLabel(ym) + '.'));
    el.querySelector('[data-ym]').onchange = function () { S.go('#rep/pay/' + this.value); };
    wireActs(el, 'שכר-' + ym + '.csv', function () {
      return Esek.toCSV(rows.map(function (r) {
        return { name: r.stu.name, cls: r.stu.cls, hours: r.hours, days: r.days, det: r.lines.map(lineTxt).join(' | '), total: r.total };
      }), [{ key: 'name', label: 'שם' }, { key: 'cls', label: 'כיתה' }, { key: 'hours', label: 'שעות' }, { key: 'days', label: 'ימי עבודה' },
        { key: 'det', label: 'פירוט לפי תעריף' }, { key: 'total', label: 'סה"כ ₪' }]);
    });
  }

  /* ---------- 2. חיוב לפי לקוח ---------- */
  function quoteOf(orderId) {
    var q = null;
    (Esek.state.quotes || []).forEach(function (x) { if (!q && x.orderId === orderId) q = x; });
    return q;
  }
  function billLines(b) {
    var out = [], c = b.cust || {};
    b.fixedLines.forEach(function (f) {
      var q = quoteOf(f.order.id);
      out.push({ text: (f.order.title || 'הזמנה') + ' · לפי הצעת מחיר' + (q ? ' מ-' + dText(q.date) : ''), qty: 1, unit: '', price: f.amount, amount: f.amount });
    });
    b.taskLines.forEach(function (l) {
      out.push({ text: l.task ? l.task.name : 'משימה', qty: l.qty, unit: 'ביצועים', price: l.price, amount: l.amount });
    });
    if (b.rest.hours > 0 || b.rest.days > 0) {
      if (c.bill === 'hours' || c.bill === 'both') out.push({ text: 'לפי תנאי החיוב · שעות עבודה', qty: b.rest.hours, unit: 'ש\'', price: +c.rateHour || 0, amount: r2(b.rest.hours * (+c.rateHour || 0)) });
      if (c.bill === 'days' || c.bill === 'both') out.push({ text: 'לפי תנאי החיוב · ימי עבודה', qty: b.rest.days, unit: 'ימים', price: +c.rateDay || 0, amount: r2(b.rest.days * (+c.rateDay || 0)) });
    }
    return out;
  }
  function custSel(val) {
    return '<label class="fld">לקוח<select data-cust><option value="all"' + (val === 'all' ? ' selected' : '') + '>כל הלקוחות (סקירת החודש)</option>' +
      sortedCustomers().map(function (c) { return '<option value="' + esc(c.id) + '"' + (c.id === val ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('') +
      '</select></label>';
  }
  function billScreen(el, p) {
    var custId = p[0] && p[0] !== 'all' && Esek.byId(Esek.state.customers, p[0]) ? p[0] : 'all';
    var from, to, ym = null, label;
    var range = custId !== 'all' && validD(p[1]) && validD(p[2]) && p[1] <= p[2];
    if (range) { from = p[1]; to = p[2]; label = dText(from) + ' עד ' + dText(to); }
    else { ym = validYm(p[1]) ? p[1] : S.ym(); var mr = Esek.monthRange(ym); from = mr.from; to = mr.to; label = ymLabel(ym); }
    ui.billMode = range ? 'range' : 'month';
    var ctl = '<div class="card pad bz-ctl no-print"><div class="bz-ctl-r">' + custSel(custId) +
      (custId !== 'all' ? '<div class="fld" role="radiogroup" aria-label="תקופה"><span>תקופה</span><div class="bz-seg">' +
        '<button type="button" class="' + (range ? '' : 'on') + '" data-mode="month" aria-pressed="' + !range + '">חודש</button>' +
        '<button type="button" class="' + (range ? 'on' : '') + '" data-mode="range" aria-pressed="' + range + '">טווח תאריכים</button></div></div>' : '') +
      (range ? '<label class="fld">מתאריך<input type="date" dir="ltr" data-from value="' + esc(from) + '"></label><label class="fld">עד תאריך<input type="date" dir="ltr" data-to value="' + esc(to) + '"></label>' +
        '<div class="fld"><span aria-hidden="true">&nbsp;</span><button class="btn pri" type="button" data-apply>הצגה</button></div>'
        : monthSel('data-ym', ym || S.ym(), 'חודש')) +
      '</div><p class="err" data-rerr hidden>תאריך הסיום צריך להיות אחרי תאריך ההתחלה.</p>';

    if (custId === 'all') return billOverview(el, ym, from, to, ctl);

    var b = Esek.custBill2(custId, from, to), c = b.cust, lines = billLines(b), biz = Esek.state.biz;
    var ords = b.orders.filter(function (x) { return x.hours > 0 || x.amount > 0; })
      .sort(function (a, z) { return String(a.order.date || '') < String(z.order.date || '') ? -1 : 1; });
    var terms = c.bill === 'tasks' ? 'לפי משימה · סכום קבוע לכל משימה שבוצעה' : c.bill === 'days' ? 'לפי ימי עבודה · ' + S.fmtNum(c.rateDay) + ' ₪ ליום'
      : c.bill === 'both' ? 'שעות וימים · ' + S.fmtNum(c.rateHour) + ' ₪ לשעה + ' + S.fmtNum(c.rateDay) + ' ₪ ליום'
        : 'לפי שעות · ' + S.fmtNum(c.rateHour) + ' ₪ לשעה';
    var copy = ['דרישת תשלום · ' + biz.name, 'אל: ' + c.name + (c.contact && c.contact !== c.name ? ' (' + c.contact + ')' : ''), 'תקופה: ' + label, '']
      .concat(lines.map(function (l) { return l.text + '\t' + S.fmtNum(l.qty) + (l.unit ? ' ' + l.unit : '') + '\t' + S.fmtNum(l.price) + ' ₪\t' + S.fmtNum(l.amount) + ' ₪'; }))
      .concat(['', 'סה"כ לתשלום\t\t\t' + S.fmtNum(b.amount) + ' ₪']).join('\n');
    var doc = '<article class="card bz-doc" aria-label="דרישת תשלום">' +
      '<header class="bz-doc-h"><div><h2>דרישת תשלום</h2><p>' + esc(biz.name) + (biz.school ? ' · ' + esc(biz.school) : '') + (biz.phone ? ' · ' + S.ltr(biz.phone) : '') + '</p></div>' +
        '<div class="bz-doc-meta"><span>תאריך: ' + S.fmtDate(Esek.today(), { noDay: true, year: true }) + '</span><span>תקופה: ' + esc(label) + '</span></div></header>' +
      '<div class="bz-doc-to"><span class="muted">אל</span><b>' + esc(c.name) + '</b>' +
        (c.contact && c.contact !== c.name ? '<span>' + esc(c.contact) + '</span>' : '') + (c.phone ? '<span>' + S.ltr(c.phone) + '</span>' : '') +
        (c.email ? '<span>' + S.ltr(c.email) + '</span>' : '') + '<span class="muted">תנאי חיוב: ' + esc(terms) + '</span></div>' +
      (lines.length ? '<table class="bz-t bz-doc-t"><thead><tr><th>תיאור</th><th>כמות</th><th>מחיר</th><th>סכום</th></tr></thead><tbody>' +
        lines.map(function (l) {
          return '<tr><td data-l="">' + esc(l.text) + '</td><td data-l="כמות">' + num(l.qty) + (l.unit ? ' ' + esc(l.unit) : '') + '</td>' +
            '<td data-l="מחיר">' + money(l.price) + '</td><td data-l="סכום" class="bz-sum">' + money(l.amount) + '</td></tr>';
        }).join('') + '</tbody><tfoot><tr><td colspan="3" data-l="" class="bz-hide-m">סה"כ לתשלום</td><td data-l="סה&quot;כ לתשלום" class="bz-sum" data-billtotal="' + b.amount + '">' + money(b.amount) + '</td></tr></tfoot></table>'
        : '<p class="bz-empty-in">אין חיובים בתקופה הזו.</p>') +
      '<footer class="bz-doc-f">המסמך הופק ממערכת העסק הבית-ספרי. זו דרישת תשלום, לא חשבונית.<span class="bz-sign">חתימה: ____________</span></footer></article>';
    var ordHtml = ords.length ? '<h2 class="sec-t">פירוט לפי הזמנה</h2><div class="card"><table class="bz-t"><thead><tr><th>תאריך</th><th>הזמנה</th><th>שעות</th><th>ימי עבודה</th><th>חיוב</th></tr></thead><tbody>' +
      ords.map(function (x) {
        var o = x.order, mode = x.mode === 'fixed' ? 'לפי הצעת מחיר' : x.mode === 'tasks' ? 'לפי משימות' : 'לפי תנאי החיוב';
        return '<tr><td data-l="תאריך">' + (o.date ? S.fmtDate(o.date) : '<span class="muted">בלי תאריך</span>') + '</td>' +
          '<td data-l="הזמנה"><a href="#order/' + esc(o.id) + '">' + esc(o.title || 'הזמנה') + '</a><small>' + esc(mode) + '</small></td>' +
          '<td data-l="שעות">' + S.fmtHours(x.hours) + '</td><td data-l="ימי עבודה">' + num(x.days) + '</td>' +
          '<td data-l="חיוב" class="bz-sum">' + (x.mode === 'terms' ? '<span class="muted">בשורת תנאי החיוב</span>' : money(x.amount)) + '</td></tr>';
      }).join('') + '</tbody></table></div>' : '';

    el.classList.add('bz-print-doc');
    el.innerHTML = S.screenHead({ title: 'חיוב לפי לקוח', sub: esc(c.name) + ' · ' + esc(label), back: '#rep/bill/all/' + (ym || S.ym()), backLabel: 'חזרה לסקירת החיוב' }) +
      ctl + actBar(copy, true, true) + '</div>' + doc + ordHtml;
    wireBillCtl(el, custId, ym);
    wireActs(el, 'חיוב-' + c.name.replace(/[\\/:*?"<>|\s]+/g, '-') + '-' + (ym || from + '_' + to) + '.csv', function () {
      return Esek.toCSV(lines.map(function (l) { return { text: l.text, qty: l.qty, unit: l.unit, price: l.price, amount: l.amount }; })
        .concat([{ text: 'סה"כ לתשלום', qty: '', unit: '', price: '', amount: b.amount }]),
      [{ key: 'text', label: 'תיאור' }, { key: 'qty', label: 'כמות' }, { key: 'unit', label: 'יחידה' }, { key: 'price', label: 'מחיר ₪' }, { key: 'amount', label: 'סכום ₪' }]);
    });
  }
  function wireBillCtl(el, custId, ym) {
    var cs = el.querySelector('[data-cust]');
    cs.onchange = function () {
      var m = el.querySelector('[data-ym]');
      S.go('#rep/bill/' + this.value + '/' + (m ? m.value : (ym || S.ym())));
    };
    var ys = el.querySelector('[data-ym]');
    if (ys) ys.onchange = function () { S.go('#rep/bill/' + custId + '/' + this.value); };
    el.querySelectorAll('[data-mode]').forEach(function (b) {
      b.onclick = function () {
        var md = b.getAttribute('data-mode');
        if (md === ui.billMode) return;
        ui.billMode = md;
        if (md === 'month') S.go('#rep/bill/' + custId + '/' + S.ym());
        else { var mr = Esek.monthRange(ym || S.ym()); S.go('#rep/bill/' + custId + '/' + mr.from + '/' + mr.to); }
      };
    });
    var ap = el.querySelector('[data-apply]');
    if (ap) ap.onclick = function () {
      var f = el.querySelector('[data-from]').value, t = el.querySelector('[data-to]').value, er = el.querySelector('[data-rerr]');
      var bad = !validD(f) || !validD(t) || f > t;
      er.hidden = !bad;
      if (!bad) S.go('#rep/bill/' + custId + '/' + f + '/' + t);
    };
  }
  function billOverview(el, ym, from, to, ctl) {
    var rows = [], zero = [];
    Esek.state.customers.forEach(function (c) {
      var b = Esek.custBill2(c.id, from, to);
      var n = b.orders.filter(function (x) { return x.hours > 0 || x.amount > 0; }).length;
      if (b.amount > 0 || b.hours > 0) rows.push({ c: c, b: b, n: n }); else zero.push(c);
    });
    rows.sort(function (a, z) { return z.b.amount - a.b.amount || String(a.c.name).localeCompare(String(z.c.name), 'he'); });
    var total = 0;
    rows.forEach(function (r) { total += r.b.amount; });
    total = r2(total);
    var copy = [['לקוח', 'הזמנות', 'שעות', 'סכום ₪']].concat(rows.map(function (r) { return [r.c.name, r.n, r.b.hours, r.b.amount]; })).concat([['סה"כ', '', '', total]]);
    el.innerHTML = S.screenHead({ title: 'חיוב לפי לקוח', sub: 'סקירת ' + esc(ymLabel(ym)) + ' · בחרו לקוח כדי להפיק דרישת תשלום', back: '#reports', backLabel: 'חזרה לדוחות' }) +
      ctl + actBar(tsv(copy), true, true) + '</div>' +
      '<div class="bz-kpis"><div class="card bz-kpi"><span>סה"כ לחיוב ב' + esc(S.monthName(ym)) + '</span><b>' + money(total) + '</b></div>' +
      '<div class="card bz-kpi">' + S.progress(rows.length, Esek.state.customers.length, 'לקוחות עם חיוב', 'a') + '</div></div>' +
      (rows.length ? '<div class="card"><table class="bz-t"><thead><tr><th>לקוח</th><th>הזמנות</th><th>שעות</th><th>סכום</th><th><span class="sr">פתיחה</span></th></tr></thead><tbody>' +
        rows.map(function (r) {
          return '<tr><td data-l=""><a href="#rep/bill/' + esc(r.c.id) + '/' + ym + '"><b>' + esc(r.c.name) + '</b></a></td>' +
            '<td data-l="הזמנות">' + num(r.n) + '</td><td data-l="שעות">' + S.fmtHours(r.b.hours) + '</td>' +
            '<td data-l="סכום" class="bz-sum">' + money(r.b.amount) + '</td>' +
            '<td class="bz-go no-print"><a class="btn" href="#rep/bill/' + esc(r.c.id) + '/' + ym + '">' + S.icon('file', 'sm') + 'דרישת תשלום</a></td></tr>';
        }).join('') + '</tbody><tfoot><tr><td data-l="">סה"כ</td><td class="bz-hide-m"></td><td class="bz-hide-m"></td><td data-l="סה&quot;כ" class="bz-sum">' + money(total) + '</td><td class="bz-hide-m"></td></tr></tfoot></table></div>'
        : emptyCard('אין חיובים ב' + ymLabel(ym) + '.')) +
      (zero.length ? '<p class="bz-note">בלי חיוב בחודש הזה: ' + zero.map(function (c) { return esc(c.name); }).join(' · ') + '</p>' : '');
    wireBillCtl(el, 'all', ym);
    wireActs(el, 'חיוב-לקוחות-' + ym + '.csv', function () {
      return Esek.toCSV(rows.map(function (r) { return { name: r.c.name, n: r.n, hours: r.b.hours, amount: r.b.amount }; }),
        [{ key: 'name', label: 'לקוח' }, { key: 'n', label: 'הזמנות' }, { key: 'hours', label: 'שעות' }, { key: 'amount', label: 'סכום ₪' }]);
    });
  }

  /* ---------- 3. שעות לתעודה ---------- */
  function certScreen(el) {
    var st = Esek.state;
    var rows = st.students.map(function (s) { return { s: s, h: Esek.certHours(s.id) }; })
      .sort(function (a, b) { return b.h - a.h || String(a.s.name).localeCompare(String(b.s.name), 'he'); });
    var max = 0, tot = 0;
    rows.forEach(function (r) { if (r.h > max) max = r.h; tot += r.h; });
    var pro = (st.biz.types || []).filter(function (t) { return t.pro; }).map(function (t) { return t.name; });
    var non = (st.biz.types || []).filter(function (t) { return !t.pro; }).map(function (t) { return t.name; });
    var copy = [['שם', 'כיתה', 'שעות לתעודה']].concat(rows.map(function (r) { return [r.s.name, r.s.cls, r.h]; }));
    el.innerHTML = S.screenHead({ title: 'שעות לתעודה', sub: 'כל השעות המאושרות בעבודה מקצועית, מתחילת הרישום', back: '#reports', backLabel: 'חזרה לדוחות' }) +
      '<div class="card pad bz-ctl no-print"><p class="bz-note" style="margin:0">נספרות: ' + (pro.length ? esc(pro.join(' · ')) : 'אין סוג עבודה מקצועי') +
        (non.length ? '. לא נספרות: ' + esc(non.join(' · ')) : '') + '. לפי סך השעות הכלליות, בלי קשר לפירוט המשימות.</p>' + actBar(tsv(copy), true, true) + '</div>' +
      '<div class="bz-kpis"><div class="card bz-kpi"><span>סה"כ שעות לתעודה</span><b>' + S.fmtHours(r2(tot)) + '</b></div>' +
        '<div class="card bz-kpi">' + S.progress(rows.filter(function (r) { return r.h > 0; }).length, rows.length, 'תלמידים עם שעות', 'o') + '</div></div>' +
      '<div class="card"><ul class="bz-bars">' + rows.map(function (r) {
        var pct = max ? r.h * 100 / max : 0;
        return '<li><a href="#student/' + esc(r.s.id) + '"><b>' + esc(r.s.name) + '</b><small>' + esc(r.s.cls ? 'כיתה ' + r.s.cls : '') + '</small></a>' +
          '<div class="bar" role="img" aria-label="' + esc(r.s.name + ': ' + S.fmtNum(r.h) + ' שעות') + '"><i class="o" style="width:' + pct.toFixed(1) + '%"></i></div>' +
          '<span class="bz-bv">' + S.fmtHours(r.h) + '</span></li>';
      }).join('') + '</ul></div>';
    wireActs(el, 'שעות-לתעודה-' + Esek.today() + '.csv', function () {
      return Esek.toCSV(rows.map(function (r) { return { name: r.s.name, cls: r.s.cls, h: r.h }; }),
        [{ key: 'name', label: 'שם' }, { key: 'cls', label: 'כיתה' }, { key: 'h', label: 'שעות לתעודה' }]);
    });
  }

  /* ---------- 4. השוואה בין חודשים + סיכום לפי תלמיד.ה ותאריך ---------- */
  function diff(a, b, isMoney) {
    var d = r2(a - b);
    if (!d) return '<span class="muted">ללא שינוי</span>';
    var s = (d > 0 ? '+' : '−') + S.fmtNum(Math.abs(d)) + (isMoney ? ' ₪' : '');
    return '<bdi dir="ltr" class="num bz-d ' + (d > 0 ? 'up' : 'dn') + '">' + esc(s) + '</bdi>';
  }
  function cmpScreen(el, p) {
    var A = validYm(p[0]) ? p[0] : S.ym(), B = validYm(p[1]) ? p[1] : addMonth(A, -1);
    var ra = Esek.monthRange(A), rb = Esek.monthRange(B), N = Esek.state.students.length;
    var cp = Esek.comparePeriods(ra, rb);
    var pa = payTotal(A), pb = payTotal(B), ba = billTotal(ra.from, ra.to), bb = billTotal(rb.from, rb.to);
    var M = [
      { t: 'שעות מאושרות', a: cp.a.hours, b: cp.b.hours, f: S.fmtHours },
      { t: 'מתוכן לחיוב', a: cp.a.billable, b: cp.b.billable, f: S.fmtHours },
      { t: 'ימי עבודה', a: cp.a.days, b: cp.b.days, f: num },
      { t: 'תלמידים שעבדו', a: cp.a.students, b: cp.b.students, f: function (x) { return S.progress(x, N, '', 'o'); }, cnt: true },
      { t: 'הזמנות ועבודות', a: cp.a.orders, b: cp.b.orders, f: num },
      { t: 'שכר', a: pa, b: pb, f: money, m: true },
      { t: 'חיוב ללקוחות', a: ba, b: bb, f: money, m: true }
    ];
    var copy = [['', ymLabel(A), ymLabel(B), 'הפרש']].concat(M.map(function (m) {
      return [m.t, m.cnt ? m.a + ' מתוך ' + N : m.a, m.cnt ? m.b + ' מתוך ' + N : m.b, r2(m.a - m.b)];
    }));
    // סיכום לפי תלמיד.ה ותאריך (כמו ה-Summary של Clockify)
    var su = ui.sum, sopt = { from: ra.from, to: ra.to, by: 'stu', then: 'date' };
    if (su.cust) sopt.custId = su.cust;
    if (su.bill) sopt.bill = true;
    var sm = Esek.summary(sopt);
    var custOpts = '<option value="">כל הלקוחות והעבודות</option><option value="internal"' + (su.cust === 'internal' ? ' selected' : '') + '>עבודה פנימית</option>' +
      sortedCustomers().map(function (c) { return '<option value="' + esc(c.id) + '"' + (su.cust === c.id ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('');
    var sumCopy = [['תלמיד.ה / תאריך', 'ימי עבודה', 'שעות']];
    sm.groups.forEach(function (g) {
      sumCopy.push([g.label, g.days, g.hours]);
      g.children.forEach(function (c) { sumCopy.push(['  ' + dText(c.key), '', c.hours]); });
    });
    sumCopy.push(['סה"כ', sm.days, sm.hours]);

    el.innerHTML = S.screenHead({ title: 'השוואה בין חודשים', sub: esc(ymLabel(A)) + ' מול ' + esc(ymLabel(B)), back: '#reports', backLabel: 'חזרה לדוחות' }) +
      '<div class="card pad bz-ctl no-print"><div class="bz-ctl-r">' + monthSel('data-a', A, 'חודש') + monthSel('data-b', B, 'לעומת') + '</div>' + actBar(tsv(copy), true, true) + '</div>' +
      '<div class="card"><table class="bz-t bz-cmp"><thead><tr><th>מדד</th><th>' + esc(ymLabel(A)) + '</th><th>' + esc(ymLabel(B)) + '</th><th>הפרש</th></tr></thead><tbody>' +
        M.map(function (m) {
          return '<tr><td data-l=""><b>' + esc(m.t) + '</b></td><td data-l="' + esc(ymLabel(A)) + '">' + m.f(m.a) + '</td><td data-l="' + esc(ymLabel(B)) + '">' + m.f(m.b) + '</td>' +
            '<td data-l="הפרש">' + diff(m.a, m.b, m.m) + '</td></tr>';
        }).join('') + '</tbody></table></div>' +
      '<h2 class="sec-t">סיכום לפי תלמיד.ה ותאריך · ' + esc(ymLabel(A)) + '</h2>' +
      '<div class="card bz-sumcard"><div class="pad bz-ctl-r no-print">' +
        '<label class="fld">לקוח<select data-scust>' + custOpts + '</select></label>' +
        '<label class="chk bz-chk"><input type="checkbox" data-sbill' + (su.bill ? ' checked' : '') + '>רק שעות לחיוב</label>' +
        '<div class="bz-acts" data-sumacts>' + S.copyBtn(tsv(sumCopy), 'העתקת הסיכום') + '<button class="btn" type="button" data-scsv>' + S.icon('file') + '<span>ייצוא הסיכום</span></button></div></div>' +
        '<div class="bz-sumtot"><span>סה"כ <b>' + S.fmtHours(sm.hours) + '</b></span><span>' + num(sm.days) + ' ימי עבודה</span>' +
          '<div class="bz-sumprog">' + S.progress(sm.students, N, 'תלמידים', 'o') + '</div></div>' +
        (sm.groups.length ? '<div class="bz-dets">' + sm.groups.map(function (g) {
          return '<details class="bz-det"><summary><span class="bz-dn"><b>' + esc(g.label) + '</b></span>' +
            '<span class="bz-days" title="ימי עבודה" aria-label="' + g.days + ' ימי עבודה">' + num(g.days) + '</span>' +
            '<span class="bz-dh">' + S.fmtHours(g.hours) + '</span>' + S.icon('down', 'bz-dchev') + '</summary>' +
            '<ul>' + g.children.map(function (c) {
              return '<li><span>' + S.fmtDate(c.key) + '</span><span>' + S.fmtHours(c.hours) + '</span></li>';
            }).join('') + '</ul></details>';
        }).join('') + '</div>' : '<p class="bz-empty-in">אין שעות מאושרות לפי הסינון הזה.</p>') +
      '</div>';
    el.querySelector('[data-a]').onchange = function () { S.go('#rep/cmp/' + this.value + '/' + el.querySelector('[data-b]').value); };
    el.querySelector('[data-b]').onchange = function () { S.go('#rep/cmp/' + el.querySelector('[data-a]').value + '/' + this.value); };
    el.querySelector('[data-scust]').onchange = function () { ui.sum.cust = this.value; S.refresh(); };
    el.querySelector('[data-sbill]').onchange = function () { ui.sum.bill = this.checked; S.refresh(); };
    el.querySelector('[data-scsv]').onclick = function () {
      download('סיכום-תלמידים-' + A + '.csv', Esek.toCSV(sumCopy.slice(1), sumCopy[0]));
    };
    wireActs(el, 'השוואה-' + A + '-' + B + '.csv', function () {
      return Esek.toCSV(copy.slice(1), ['מדד', ymLabel(A), ymLabel(B), 'הפרש']);
    });
  }

  /* ---------- 5. תיקון גורף ---------- */
  function bulkList(f) {
    var st = Esek.state;
    var q = {};
    if (f.ym !== 'all') q.ym = f.ym;
    if (f.stuId) q.stuId = f.stuId;
    if (f.status) q.status = f.status;
    return Esek.entries(q).filter(function (e) {
      if (!f.cust) return true;
      var o = Esek.byId(st.orders, e.orderId), oc = o ? o.custId : null;
      return f.cust === 'internal' ? !oc : oc === f.cust;
    }).sort(function (a, b) {
      var ka = a.date + (a.start || ''), kb = b.date + (b.start || '');
      return ka < kb ? 1 : ka > kb ? -1 : (a.id < b.id ? 1 : -1);
    });
  }
  function bulkScreen(el) {
    var st = Esek.state;
    if (!ui.bf) ui.bf = { ym: S.ym(), stuId: '', cust: '', status: '' };
    var f = ui.bf, list = bulkList(f), ids = {};
    list.forEach(function (e) { ids[e.id] = 1; });
    Object.keys(ui.bsel).forEach(function (k) { if (!ids[k]) delete ui.bsel[k]; });
    var shown = list.slice(0, ui.bshown), nSel = Object.keys(ui.bsel).length;
    function opt(v, l, cur) { return '<option value="' + esc(v) + '"' + (v === cur ? ' selected' : '') + '>' + esc(l) + '</option>'; }
    var filt = '<div class="card pad bz-ctl"><div class="bz-ctl-r bz-filt">' +
      monthSel('data-f="ym"', f.ym, 'חודש', '<option value="all"' + (f.ym === 'all' ? ' selected' : '') + '>כל החודשים</option>') +
      '<label class="fld">תלמיד.ה<select data-f="stuId">' + opt('', 'כל התלמידים', f.stuId) + sortedStudents().map(function (s) { return opt(s.id, s.name, f.stuId); }).join('') + '</select></label>' +
      '<label class="fld">לקוח<select data-f="cust">' + opt('', 'כל הלקוחות והעבודות', f.cust) + opt('internal', 'עבודה פנימית', f.cust) +
        sortedCustomers().map(function (c) { return opt(c.id, c.name, f.cust); }).join('') + '</select></label>' +
      '<label class="fld">מצב<select data-f="status">' + opt('', 'כל המצבים', f.status) +
        ['prep', 'wait', 'ok', 'no'].map(function (k) { return opt(k, STATUS[k], f.status); }).join('') + '</select></label></div></div>';
    var dis = nSel ? '' : ' disabled';
    var tb = '<div class="bz-btb"><div class="bz-btb-r"><label class="chk"><input type="checkbox" data-ball' + (list.length && nSel === list.length ? ' checked' : '') + (list.length ? '' : ' disabled') + '>' +
        'סימון כל ' + S.ltr(list.length) + ' השורות המסוננות</label><span class="bz-nsel">נבחרו <b data-nsel>' + nSel + '</b></span></div>' +
      '<div class="bz-btb-a">' +
        '<button class="btn ok" type="button" data-act="ok"' + dis + '>' + S.icon('check', 'sm') + 'אישור</button>' +
        '<button class="btn danger" type="button" data-act="no"' + dis + '>דחייה</button>' +
        '<button class="btn" type="button" data-act="times"' + dis + '>' + S.icon('clock', 'sm') + 'שעות התחלה-סיום</button>' +
        '<button class="btn" type="button" data-act="hours"' + dis + '>' + S.icon('edit', 'sm') + 'שינוי שעות</button>' +
        '<button class="btn" type="button" data-act="rate"' + dis + '>' + S.icon('coin', 'sm') + 'שינוי תעריף</button></div></div>';
    var rows = shown.map(function (e) {
      var o = Esek.byId(st.orders, e.orderId), w = S.workLabel(o), pay = Esek.payOf(e);
      var tcls = e.status === 'ok' ? 'tag ok' : e.status === 'no' ? 'tag bz-no' : e.status === 'prep' ? 'tag info' : 'tag';
      return '<li class="bz-br" data-brow="' + esc(e.id) + '" data-status="' + esc(e.status) + '"><label class="chk"><input type="checkbox" data-bsel="' + esc(e.id) + '"' + (ui.bsel[e.id] ? ' checked' : '') +
        ' aria-label="' + esc('סימון ' + S.stuName(e.stuId) + ' ' + S.fmtDateText(e.date)) + '"></label>' +
        '<div class="bz-bw"><b>' + esc(S.stuName(e.stuId)) + '</b><span>' + S.fmtDate(e.date) + '</span></div>' +
        '<div class="bz-bs"><b>' + esc(w.title) + '</b><span>' + esc(w.sub) + '</span></div>' +
        '<div class="bz-bh"><b>' + S.fmtHours(e.hours) + '</b><span>' + (S.timeRange(e.start, e.end) || 'בלי שעות') + '</span></div>' +
        '<div class="bz-bt"><span class="' + tcls + '">' + esc(STATUS[e.status] || e.status) + '</span><span class="bz-bpay">שכר ' + money(pay.total) +
          (e.rate !== undefined && e.rate !== null && e.rate !== '' ? ' · תעריף ידני ' + money(e.rate) : '') + '</span></div></li>';
    }).join('');
    el.innerHTML = S.screenHead({ title: 'תיקון גורף', sub: 'סינון, סימון ופעולה אחת על כל השורות המסומנות', back: '#reports', backLabel: 'חזרה לדוחות' }) + filt +
      '<div class="card">' + tb + (list.length ? '<ul class="bz-brows">' + rows + '</ul>' : '<div class="rows-empty">אין דיווחים לפי הסינון הזה.</div>') +
      (list.length > shown.length ? '<div class="bz-more"><button class="btn" type="button" data-bmore>הצגת עוד ' + Math.min(30, list.length - shown.length) + ' (מוצגים ' + shown.length + ' מתוך ' + list.length + ')</button></div>' : '') +
      '</div>';

    function sync() {
      var n = Object.keys(ui.bsel).length;
      el.querySelector('[data-nsel]').textContent = n;
      el.querySelectorAll('[data-act]').forEach(function (b) { b.disabled = !n; });
      var all = el.querySelector('[data-ball]');
      if (all) all.checked = list.length > 0 && n === list.length;
    }
    el.onchange = function (ev) {
      var t = ev.target;
      if (t.hasAttribute('data-f')) {
        ui.bf[t.getAttribute('data-f')] = t.value;
        ui.bsel = {}; ui.bshown = 30;
        S.refresh();
      } else if (t.hasAttribute('data-bsel')) {
        if (t.checked) ui.bsel[t.getAttribute('data-bsel')] = 1; else delete ui.bsel[t.getAttribute('data-bsel')];
        sync();
      } else if (t.hasAttribute('data-ball')) {
        ui.bsel = {};
        if (t.checked) list.forEach(function (e) { ui.bsel[e.id] = 1; });
        el.querySelectorAll('[data-bsel]').forEach(function (c) { c.checked = t.checked; });
        sync();
      }
    };
    el.onclick = function (ev) {
      var b;
      if (ev.target.closest('[data-bmore]')) { ui.bshown += 30; S.refresh(); return; }
      if ((b = ev.target.closest('[data-act]'))) bulkModal(b.getAttribute('data-act'));
    };
  }
  function bulkModal(act) {
    var ids = Object.keys(ui.bsel);
    if (!ids.length) return;
    var es = ids.map(function (id) { return Esek.byId(Esek.state.entries, id); }).filter(Boolean);
    var n = es.length, nOk = es.filter(function (e) { return e.status === 'ok'; }).length;
    var nNo = es.filter(function (e) { return e.status === 'no'; }).length;
    var nSplit = es.filter(function (e) { return (e.split || []).some(function (x) { return +x.hours > 0; }); }).length;
    var cnt = '<p class="bz-mcnt">ישתנו <b>' + S.ltr(n) + '</b> דיווחים.</p>';
    var T = {
      ok: { t: 'אישור ' + n + ' דיווחים', h: cnt + '<p>הדיווחים יסומנו "אושר" וייכנסו לשכר, לחיוב ולשעות לתעודה.' + (nOk ? ' (' + S.ltr(nOk) + ' מהם כבר מאושרים.)' : '') + '</p>', b: 'אישור', c: 'ok' },
      no: { t: 'דחיית ' + n + ' דיווחים', h: cnt + '<p>הדיווחים יסומנו "נדחה" ולא ייכנסו לשכר ולחיוב.' + (nNo ? ' (' + S.ltr(nNo) + ' מהם כבר נדחו.)' : '') + '</p>', b: 'דחייה', c: 'warn' },
      times: { t: 'שינוי שעות התחלה-סיום', h: cnt + '<p>כל הדיווחים המסומנים יקבלו את אותן שעות. סך השעות יחושב מהן.</p><div class="times"><label class="fld">שעת התחלה<input type="time" dir="ltr" data-m-s value="08:00"></label><label class="fld">שעת סיום<input type="time" dir="ltr" data-m-e value="12:00"></label></div>', b: 'שינוי השעות', c: 'pri' },
      hours: { t: 'שינוי סך השעות', h: cnt + '<p>שעות ההתחלה והסיום יימחקו, ויישאר סך השעות.</p><label class="fld">סה"כ שעות<input type="number" inputmode="decimal" min="0" step="0.25" dir="ltr" data-m-h value=""></label>', b: 'שינוי השעות', c: 'pri' },
      rate: { t: 'שינוי תעריף', h: cnt + '<label class="fld">תעריף רגיל לשעה (₪)<input type="number" inputmode="decimal" min="0" step="0.5" dir="ltr" data-m-r value=""></label>' +
        '<p class="bz-note">התעריף חל על השעות שלא פורטו למשימות. שעות שפורטו למשימה ממשיכות לפי תעריף המשימה.' + (nSplit ? ' ל-' + S.ltr(nSplit) + ' מהדיווחים המסומנים יש פירוט.' : '') + '</p>', b: 'שינוי התעריף', c: 'pri' }
    }[act];
    S.modal({
      title: T.t,
      html: T.h + '<p class="err" data-m-err hidden></p>',
      actions: [{
        label: T.b, cls: T.c, onClick: function (api) {
          var err = api.body.querySelector('[data-m-err]'), val, msg = '';
          if (act === 'times') {
            var s = api.body.querySelector('[data-m-s]').value, e = api.body.querySelector('[data-m-e]').value;
            if (!s || !e || !(Esek.hoursBetween(s, e) > 0)) msg = 'צריך שעת התחלה ושעת סיום אחריה.';
            val = { start: s, end: e };
          } else if (act === 'hours') {
            val = +api.body.querySelector('[data-m-h]').value;
            if (!(val > 0)) msg = 'צריך מספר שעות גדול מ-0.';
          } else if (act === 'rate') {
            var rv = api.body.querySelector('[data-m-r]').value;
            if (rv === '' || !isFinite(+rv) || +rv < 0) msg = 'צריך תעריף (0 ומעלה).';
            val = +rv;
          }
          if (msg) { err.hidden = false; err.textContent = msg; return false; }
          var r = Esek.bulk(ids, act, val);
          ui.bsel = {};
          S.toast('שונו ' + r.changed.length + ' דיווחים' + (r.skipped.length ? ' · ' + r.skipped.length + ' לא שונו' : ''));
          setTimeout(S.refresh, 0);
        }
      }, { label: 'ביטול', cls: 'ghost' }]
    });
  }

  /* ---------- רישום ---------- */
  Shell.page('reports', { title: 'עיבוד ודוחות', render: function (el) { listScreen(el); } });
  Shell.page('rep', {
    title: 'עיבוד ודוחות', nav: 'reports',
    render: function (el, params) {
      var kind = params[0], rest = params.slice(1);
      if (kind === 'pay') return payScreen(el, rest);
      if (kind === 'bill') return billScreen(el, rest);
      if (kind === 'cert') return certScreen(el);
      if (kind === 'cmp') return cmpScreen(el, rest);
      if (kind === 'bulk') return bulkScreen(el);
      return listScreen(el);
    }
  });
})();
