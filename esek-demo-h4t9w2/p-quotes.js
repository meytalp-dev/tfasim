/* p-quotes.js — הצעות מחיר.
   #quotes · #quotes/<draft|sent|ok|no>   רשימה לפי מצב
   #quote/new · #quote/<id>               עריכה, מסמך להדפסה, העתקה, "יצירת תור/הזמנה" כשההצעה אושרה */
(function () {
  'use strict';
  var S = Shell, esc = S.esc;
  var QST = { draft: 'טיוטה', sent: 'נשלחה', ok: 'אושרה', no: 'נדחתה' };
  var QCLS = { draft: '', sent: 'info', ok: 'ok', no: 'no' };
  var ORDER = ['draft', 'sent', 'ok', 'no'];

  function r2(x) { return Math.round(x * 100) / 100; }
  function svList() { return Esek.state.biz.services || []; }
  function tagQ(s) { return '<span class="tag ' + (QCLS[s] || '') + '">' + esc(QST[s] || s) + '</span>'; }

  /* ---------- רשימה ---------- */
  function listScreen(el, filter) {
    var qs = (Esek.state.quotes || []).slice().sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
    var cnt = {};
    qs.forEach(function (q) { cnt[q.status] = (cnt[q.status] || 0) + 1; });
    var shown = filter ? qs.filter(function (q) { return q.status === filter; }) : qs;
    function chip(id, label, n) {
      var on = (filter || '') === id;
      return '<a class="w-chip" href="#quotes' + (id ? '/' + id : '') + '"' + (on ? ' aria-current="true"' : '') + '>' + esc(label) + ' <bdi dir="ltr" class="num">' + n + '</bdi></a>';
    }
    el.innerHTML = S.screenHead({
      title: 'הצעות מחיר', sub: esc(Esek.state.biz.name),
      actions: '<a class="btn pri" href="#quote/new">' + S.icon('plus') + 'הצעה חדשה</a>'
    }) +
      '<nav class="w-chips" aria-label="סינון לפי מצב">' + chip('', 'הכול', qs.length) +
      ORDER.map(function (s) { return chip(s, QST[s], cnt[s] || 0); }).join('') + '</nav>' +
      (shown.length ? '<ul class="card w-list">' + shown.map(function (q) {
        return '<li><a class="w-qrow" href="#quote/' + esc(q.id) + '"><span class="w-q-c"><b>' + esc(S.custName(q.custId) || 'בלי לקוח.ה') + '</b><span>' +
          esc((q.lines || []).map(function (l) { return l.text; }).filter(Boolean).join(' · ')) + '</span></span>' +
          '<span class="w-q-d">' + S.fmtDate(q.date, { noDay: true }) + '</span>' +
          '<span class="w-q-t">' + S.fmtMoney(Esek.quoteTotal(q)) + '</span>' +
          '<span class="w-q-s">' + tagQ(q.status) + (q.orderId ? '<span class="tag info">יש תור</span>' : '') + '</span>' + S.icon('chevron', 'sm') + '</a></li>';
      }).join('') + '</ul>' : '<div class="card pad w-empty">אין הצעות ' + (filter ? 'במצב "' + esc(QST[filter]) + '"' : '') + '. <a href="#quote/new">הצעה חדשה</a></div>');
  }

  /* ---------- מסמך ---------- */
  function docHtml(d) {
    var st = Esek.state, c = Esek.byId(st.customers, d.custId), total = Esek.quoteTotal(d);
    var lines = d.lines.filter(function (l) { return String(l.text || '').trim(); });
    return '<div class="w-doc-h"><div><b class="w-doc-biz">' + esc(st.biz.name) + '</b><span>' + esc(st.biz.school || '') +
      (st.biz.phone ? ' · ' + S.ltr(st.biz.phone) : '') + '</span></div><div class="w-doc-t"><b>הצעת מחיר</b><span>' + S.fmtDate(d.date, { year: true, noDay: true }) + '</span></div></div>' +
      '<p class="w-doc-to">לכבוד: <b>' + esc(c ? c.name : '') + '</b>' + (c && c.phone ? ' · ' + S.ltr(c.phone) : '') + '</p>' +
      '<table class="w-doc-tb"><thead><tr><th>פריט</th><th>כמות</th><th>מחיר</th><th>סה"כ</th></tr></thead><tbody>' +
      (lines.length ? lines.map(function (l) {
        return '<tr><td>' + esc(l.text) + '</td><td>' + S.ltr(S.fmtNum(l.qty)) + '</td><td>' + S.fmtMoney(l.price) + '</td><td>' + S.fmtMoney((+l.qty || 0) * (+l.price || 0)) + '</td></tr>';
      }).join('') : '<tr><td colspan="4" class="w-mut">עוד אין שורות</td></tr>') +
      '</tbody><tfoot><tr><td colspan="3">סה"כ</td><td>' + S.fmtMoney(total) + '</td></tr></tfoot></table>' +
      (String(d.note || '').trim() ? '<p class="w-doc-note">' + esc(d.note) + '</p>' : '');
  }
  function plainText(d) {
    var st = Esek.state, c = Esek.byId(st.customers, d.custId);
    var out = ['הצעת מחיר · ' + st.biz.name, 'תאריך: ' + S.fmtDateText(d.date, { year: true, noDay: true }), 'לכבוד: ' + (c ? c.name : ''), ''];
    d.lines.forEach(function (l) {
      if (!String(l.text || '').trim()) return;
      out.push(l.text + ': ' + S.fmtNum(l.qty) + ' × ' + S.fmtNum(l.price) + ' ₪ = ' + S.fmtNum((+l.qty || 0) * (+l.price || 0)) + ' ₪');
    });
    out.push('', 'סה"כ: ' + S.fmtNum(Esek.quoteTotal(d)) + ' ₪');
    if (String(d.note || '').trim()) out.push('', d.note);
    if (st.biz.phone) out.push('', 'לפרטים: ' + st.biz.phone);
    return out.join('\n');
  }
  function printDoc() {
    document.body.classList.add('w-print-q');
    function off() { document.body.classList.remove('w-print-q'); window.removeEventListener('afterprint', off); }
    window.addEventListener('afterprint', off);
    try { window.print(); } catch (e) { /* חסום */ }
    setTimeout(off, 1500);
  }

  /* ---------- יצירת תור/הזמנה מהצעה שאושרה ---------- */
  function toOrderModal(qid) {
    var CK = window.CalKit;
    var td = Esek.today(), d0 = td;
    var q = Esek.byId(Esek.state.quotes, qid), first = null;
    (q.lines || []).forEach(function (l) { if (!first && l.serviceId) first = Esek.byId(svList(), l.serviceId); });
    var mins = first ? +first.minutes || 0 : 0;
    function ctx(api) { return { date: api.body.querySelector('[data-to-d]').value, time: api.body.querySelector('[data-to-t]').value, minutes: mins }; }
    S.modal({
      title: 'יצירת תור/הזמנה',
      html: '<p class="w-mut">' + esc(S.custName(q.custId)) + ' · ' + S.fmtMoney(Esek.quoteTotal(q)) + ' · המחיר ללקוח.ה יהיה לפי ההצעה.</p>' +
        '<div class="form-grid"><label class="fld">תאריך<input type="date" data-to-d dir="ltr" value="' + d0 + '"></label>' +
        '<label class="fld">שעה<input type="time" data-to-t dir="ltr" step="300"></label></div>' +
        '<p class="w-mut">בלי שעה: נוצרת הזמנה בלי מועד, ואפשר לקבוע אחר כך.</p>' +
        '<h3 class="w-h3">תלמידים</h3><div data-to-s>' + (CK ? CK.stuChecklist([], null) : '') + '</div>',
      onOpen: function (api) {
        api.body.addEventListener('change', function (e) {
          if (!CK) return;
          var box = api.body.querySelector('[data-to-s]');
          var sel = CK.readChecked(box);
          if (e.target.hasAttribute('data-stu') || e.target.hasAttribute('data-to-d') || e.target.hasAttribute('data-to-t')) box.innerHTML = CK.stuChecklist(sel, ctx(api));
        });
      },
      actions: [{ label: 'יצירה', cls: 'pri', onClick: function (api) {
        var c = ctx(api), ids = CK ? CK.readChecked(api.body) : [];
        var o = Esek.quoteToOrder(qid, { date: c.date, time: c.date ? c.time : '', stuIds: ids });
        if (!o) { S.toast('לא ניתן ליצור: ההצעה לא מאושרת'); return; }
        S.toast(o.time ? 'נוצר תור' : 'נוצרה הזמנה בלי מועד');
        setTimeout(function () { S.go('#order/' + o.id); }, 0);
      } }, { label: 'ביטול', cls: 'ghost' }]
    });
  }

  /* ---------- עריכה ---------- */
  function editScreen(el, id) {
    var st = Esek.state, isNew = id === 'new', src = isNew ? null : Esek.byId(st.quotes, id);
    if (!isNew && !src) {
      el.innerHTML = S.screenHead({ title: 'ההצעה לא נמצאה', back: '#quotes', backLabel: 'חזרה להצעות' }) + '<div class="card wip"><p>ייתכן שהקישור שגוי.</p></div>';
      return;
    }
    var d = src ? JSON.parse(JSON.stringify(src)) : { id: null, custId: '', date: Esek.today(), status: 'draft', lines: [{ serviceId: null, text: '', qty: 1, price: 0 }], note: '', orderId: null };
    if (!d.lines.length) d.lines.push({ serviceId: null, text: '', qty: 1, price: 0 });
    var custOpts = st.customers.slice().sort(function (a, b) { return a.name.localeCompare(b.name, 'he'); }).map(function (c) {
      return '<option value="' + esc(c.id) + '"' + (c.id === d.custId ? ' selected' : '') + '>' + esc(c.name) + '</option>';
    }).join('');
    var orderLink = '';
    if (src && src.orderId) {
      var ord = Esek.byId(st.orders, src.orderId);
      orderLink = '<a class="btn" href="#order/' + esc(src.orderId) + '">' + S.icon('calendar') + 'לתור/הזמנה' + (ord && ord.date ? ' · ' + S.fmtDate(ord.date, { noDay: true }) : '') + '</a>';
    } else if (src && src.status === 'ok') {
      orderLink = '<button class="btn ok" type="button" data-q-order>' + S.icon('calendar') + 'יצירת תור/הזמנה</button>';
    }
    el.innerHTML = S.screenHead({
      title: isNew ? 'הצעת מחיר חדשה' : 'הצעת מחיר', sub: isNew ? '' : esc(S.custName(d.custId)) + ' · ' + tagQ(d.status),
      back: '#quotes', backLabel: 'חזרה להצעות'
    }) +
      (orderLink ? '<div class="w-row w-oacts">' + orderLink + '</div>' : '') +
      '<div class="w-q-grid"><div class="card pad w-q-form">' +
      '<div class="form-grid"><label class="fld">לקוח.ה<select data-q-cust><option value="">בחירה</option>' + custOpts + '</select></label>' +
      '<label class="fld">תאריך<input type="date" data-q-date dir="ltr" value="' + esc(d.date) + '"></label>' +
      '<label class="fld">מצב<select data-q-st>' + ORDER.map(function (s) { return '<option value="' + s + '"' + (s === d.status ? ' selected' : '') + '>' + QST[s] + '</option>'; }).join('') + '</select></label></div>' +
      '<h3 class="w-h3">שורות</h3><ul class="w-qlines" data-q-lines></ul>' +
      '<button class="btn" type="button" data-q-add>' + S.icon('plus') + 'הוספת שורה</button>' +
      '<div class="w-q-total"><span>סה"כ</span><b data-q-total></b></div>' +
      '<label class="fld">הערה<textarea data-q-note rows="2">' + esc(d.note || '') + '</textarea></label>' +
      '<p class="err" data-q-err hidden></p>' +
      '<div class="w-row" style="margin-top:12px"><button class="btn pri" type="button" data-q-save>' + S.icon('check') + 'שמירה</button>' +
      '<a class="btn ghost" href="#quotes">ביטול</a></div></div>' +
      '<div class="w-q-side"><div class="w-row"><button class="btn" type="button" data-q-print>' + S.icon('file') + 'הדפסה</button>' +
      '<button class="btn" type="button" data-q-copy>' + S.icon('copy') + '<span>העתקה</span></button></div>' +
      '<article class="card w-doc" data-q-doc aria-label="המסמך להדפסה"></article></div></div>';

    function q(s) { return el.querySelector(s); }
    var linesEl = q('[data-q-lines]');
    function svOpts(sel) {
      return '<option value="">טקסט חופשי</option>' + svList().map(function (s) {
        return '<option value="' + esc(s.id) + '"' + (s.id === sel ? ' selected' : '') + '>' + esc(s.name) + ' · ' + S.fmtNum(s.price) + ' ₪</option>';
      }).join('');
    }
    function drawLines() {
      linesEl.innerHTML = d.lines.map(function (l, i) {
        return '<li><label class="fld w-ql-sv">שירות<select data-l-sv="' + i + '">' + svOpts(l.serviceId) + '</select></label>' +
          '<label class="fld w-ql-tx">תיאור<input type="text" data-l-tx="' + i + '" value="' + esc(l.text) + '"></label>' +
          '<label class="fld w-ql-q">כמות<input type="number" data-l-q="' + i + '" min="0" step="1" inputmode="decimal" dir="ltr" value="' + esc(l.qty) + '"></label>' +
          '<label class="fld w-ql-p">מחיר ליחידה<input type="number" data-l-p="' + i + '" min="0" step="1" inputmode="decimal" dir="ltr" value="' + esc(l.price) + '"></label>' +
          '<div class="w-ql-a"><span>סה"כ שורה</span><b data-l-a="' + i + '">' + S.fmtMoney((+l.qty || 0) * (+l.price || 0)) + '</b></div>' +
          '<button class="btn ghost icon" type="button" data-l-del="' + i + '" aria-label="הסרת השורה"' + (d.lines.length < 2 ? ' disabled' : '') + '>' + S.icon('trash') + '</button></li>';
      }).join('');
      sync();
    }
    function sync() {
      d.custId = q('[data-q-cust]').value;
      d.date = q('[data-q-date]').value;
      d.status = q('[data-q-st]').value;
      d.note = q('[data-q-note]').value;
      d.lines.forEach(function (l, i) {
        var a = linesEl.querySelector('[data-l-a="' + i + '"]');
        if (a) a.innerHTML = S.fmtMoney((+l.qty || 0) * (+l.price || 0));
      });
      q('[data-q-total]').innerHTML = S.fmtMoney(Esek.quoteTotal(d));
      q('[data-q-doc]').innerHTML = docHtml(d);
    }
    el.addEventListener('input', function (e) {
      var t = e.target, i;
      if (t.hasAttribute('data-l-tx')) d.lines[+t.getAttribute('data-l-tx')].text = t.value;
      else if (t.hasAttribute('data-l-q')) d.lines[+t.getAttribute('data-l-q')].qty = t.value === '' ? '' : +t.value;
      else if (t.hasAttribute('data-l-p')) d.lines[+t.getAttribute('data-l-p')].price = t.value === '' ? '' : +t.value;
      void i;
      sync();
    });
    el.addEventListener('change', function (e) {
      var t = e.target;
      if (t.hasAttribute('data-l-sv')) {
        var l = d.lines[+t.getAttribute('data-l-sv')], sv = Esek.byId(svList(), t.value);
        l.serviceId = sv ? sv.id : null;
        if (sv) { l.text = sv.name; l.price = +sv.price || 0; }
        drawLines();
        return;
      }
      sync();
    });
    el.addEventListener('click', function (e) {
      var b;
      if ((b = e.target.closest('[data-l-del]'))) { d.lines.splice(+b.getAttribute('data-l-del'), 1); drawLines(); }
      else if (e.target.closest('[data-q-add]')) {
        d.lines.push({ serviceId: null, text: '', qty: 1, price: 0 });
        drawLines();
        var sels = linesEl.querySelectorAll('[data-l-sv]');
        if (sels.length) sels[sels.length - 1].focus();
      } else if (e.target.closest('[data-q-print]')) printDoc();
      else if (e.target.closest('[data-q-copy]')) S.copyText(plainText(d), 'ההצעה הועתקה');
      else if (e.target.closest('[data-q-order]')) toOrderModal(src.id);
      else if (e.target.closest('[data-q-save]')) save();
    });
    function save() {
      sync();
      var err = q('[data-q-err]');
      var lines = d.lines.filter(function (l) { return String(l.text || '').trim(); }).map(function (l) {
        return { serviceId: l.serviceId || null, text: String(l.text).trim(), qty: r2(+l.qty || 0), price: r2(+l.price || 0) };
      });
      var msg = !d.custId ? 'צריך לבחור לקוח.ה.' : !d.date ? 'צריך תאריך.' : !lines.length ? 'צריך לפחות שורה אחת עם תיאור.' :
        lines.some(function (l) { return !(l.qty > 0); }) ? 'בכל שורה צריכה להיות כמות גדולה מ-0.' : '';
      err.hidden = !msg; err.textContent = msg;
      if (msg) return;
      var list = Esek.state.quotes, cur = d.id ? Esek.byId(list, d.id) : null;
      if (!cur) { cur = { id: Esek.uid(), orderId: null }; list.push(cur); }
      cur.custId = d.custId; cur.date = d.date; cur.status = d.status; cur.lines = lines; cur.note = String(d.note || '').trim();
      Esek.save();
      S.hold(false);
      S.toast('ההצעה נשמרה' + (cur.status === 'ok' && !cur.orderId ? '. אפשר ליצור ממנה תור.' : ''));
      S.go('#quote/' + cur.id);
    }
    drawLines();
    S.hold(true);
  }

  Shell.page('quotes', {
    title: 'הצעות מחיר',
    render: function (el, params) { var f = params[0]; listScreen(el, QST[f] ? f : ''); }
  });
  Shell.page('quote', {
    title: 'הצעת מחיר', nav: 'quotes',
    render: function (el, params) { editScreen(el, String(params[0] || 'new').split('?')[0]); }
  });
})();
