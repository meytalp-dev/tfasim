/* p-stock.js — #stock: מלאי.
   #stock          רשימת הפריטים: כמות מול מינימום, כניסה/יציאה מהירה, פריט חדש
   #stock/<itemId> פריט: תנועה עם הערה, היסטוריית תנועות (כולל ירידה אוטומטית מתורים), עריכה
   תנועות דרך Esek.stockMove. הוספה/עריכה/מחיקה של פריט: אין בליבה, משנים את Esek.state ושומרים. */
(function () {
  'use strict';
  var S = Shell, esc = S.esc;

  function r2(x) { return Math.round((+x || 0) * 100) / 100; }
  function trim(s) { return String(s || '').replace(/^\s+|\s+$/g, ''); }
  function num(n) { return '<bdi dir="ltr" class="num">' + S.fmtNum(n) + '</bdi>'; }
  function stk() { var s = Esek.state; if (!s.stock) s.stock = { items: [], moves: [] }; return s.stock; }
  function isLow(it) { return (+it.qty || 0) < (+it.min || 0); }
  function usedIn(itemId) {
    return (Esek.state.biz.services || []).filter(function (s) { return (s.materials || []).some(function (m) { return m.itemId === itemId; }); });
  }
  function qtyBar(it) {
    var q = Math.max(0, +it.qty || 0), m = +it.min || 0, scale = Math.max(m * 2, q, 1);
    var pct = q * 100 / scale, mp = m * 100 / scale;
    return '<div class="bz-qbar" role="img" aria-label="' + esc(S.fmtNum(q) + ' ' + it.unit + ', מינימום ' + S.fmtNum(m)) + '">' +
      '<i class="' + (isLow(it) ? 'w' : 'o') + '" style="width:' + pct.toFixed(1) + '%"></i>' +
      (m ? '<span class="bz-qmin" style="right:' + mp.toFixed(1) + '%" title="מינימום"></span>' : '') + '</div>';
  }
  function lowTag() { return '<span class="tag">' + S.icon('alert') + 'מתחת למינימום</span>'; }

  function moveModal(itemId, dir) {
    var it = Esek.byId(stk().items, itemId);
    if (!it) return;
    S.modal({
      title: (dir > 0 ? 'כניסה למלאי · ' : 'יציאה מהמלאי · ') + it.name,
      html: '<p>במלאי עכשיו: <b>' + num(it.qty) + '</b> ' + esc(it.unit) + '</p>' +
        '<div class="form-grid"><label class="fld">כמות (' + esc(it.unit) + ')<input data-mq type="number" inputmode="decimal" min="0" step="0.5" dir="ltr"></label>' +
        '<label class="fld">הערה<input data-mn placeholder="' + (dir > 0 ? 'למשל: משלוח מהספק' : 'למשל: נפגם, שימוש בסדנה') + '"></label></div>' +
        '<p class="err" data-merr hidden></p>',
      actions: [{ label: dir > 0 ? 'הוספה למלאי' : 'הורדה מהמלאי', cls: dir > 0 ? 'ok' : 'warn', onClick: function (api) {
        var q = +api.body.querySelector('[data-mq]').value, note = trim(api.body.querySelector('[data-mn]').value), err = api.body.querySelector('[data-merr]');
        if (!(q > 0)) { err.hidden = false; err.textContent = 'צריך כמות גדולה מ-0.'; return false; }
        var cur = Esek.byId(stk().items, itemId);
        if (dir < 0 && cur && q > (+cur.qty || 0)) { err.hidden = false; err.textContent = 'אין מספיק במלאי (יש ' + S.fmtNum(cur.qty) + ').'; return false; }
        var m = Esek.stockMove(itemId, dir * q, note || (dir > 0 ? 'כניסה ידנית' : 'יציאה ידנית'));
        if (!m) { err.hidden = false; err.textContent = 'התנועה לא נשמרה.'; return false; }
        var after = Esek.byId(Esek.state.stock.items, itemId);
        S.toast(it.name + ': ' + (dir > 0 ? '+' : '−') + S.fmtNum(q) + ' · עכשיו ' + S.fmtNum(after.qty) + (isLow(after) ? ' (מתחת למינימום)' : ''));
        setTimeout(S.refresh, 0);
      } }, { label: 'ביטול', cls: 'ghost' }]
    });
  }

  function itemModal(it) {
    var v = it || { name: '', unit: 'יחידה', qty: '', min: '' };
    S.modal({
      title: it ? 'עריכת פריט' : 'פריט חדש',
      html: '<div class="form-grid"><label class="fld bz-wide">שם הפריט<input data-iname value="' + esc(v.name) + '"></label>' +
        '<label class="fld">יחידה<input data-iu value="' + esc(v.unit) + '" placeholder="יחידה, ליטר, קופסה"></label>' +
        (it ? '' : '<label class="fld">כמות התחלתית<input data-iq type="number" inputmode="decimal" min="0" step="0.5" dir="ltr" value="' + esc(v.qty) + '"></label>') +
        '<label class="fld">מינימום (התרעה מתחתיו)<input data-im type="number" inputmode="decimal" min="0" step="0.5" dir="ltr" value="' + esc(v.min) + '"></label></div>' +
        (it ? '<p class="bz-note">את הכמות משנים בכניסה/יציאה, כדי שתישאר היסטוריה.</p>' : '') + '<p class="err" data-ierr hidden></p>',
      actions: [{ label: it ? 'שמירה' : 'הוספה', cls: 'pri', onClick: function (api) {
        var b = api.body, n = trim(b.querySelector('[data-iname]').value), u = trim(b.querySelector('[data-iu]').value);
        var q = it ? null : b.querySelector('[data-iq]').value, m = b.querySelector('[data-im]').value, err = b.querySelector('[data-ierr]');
        var msg = !n ? 'צריך שם פריט.' : stk().items.some(function (x) { return x.name === n && (!it || x.id !== it.id); }) ? 'כבר יש פריט בשם הזה.'
          : !u ? 'צריך יחידה.' : (!it && (q === '' || +q < 0)) ? 'צריך כמות התחלתית (0 ומעלה).' : (m === '' || +m < 0) ? 'צריך מינימום (0 ומעלה).' : '';
        if (msg) { err.hidden = false; err.textContent = msg; return false; }
        if (it) {
          var cur = Esek.byId(stk().items, it.id);
          if (cur) { cur.name = n; cur.unit = u; cur.min = r2(+m); }
          Esek.save(); S.toast('הפריט נשמר');
        } else {
          var x = { id: 'i' + Esek.uid(), name: n, unit: u, qty: 0, min: r2(+m) };
          stk().items.push(x);
          Esek.save();
          if (+q > 0) Esek.stockMove(x.id, r2(+q), 'כמות התחלתית');
          S.toast('הפריט נוסף');
        }
        setTimeout(S.refresh, 0);
      } }, { label: 'ביטול', cls: 'ghost' }]
    });
  }

  function listScreen(el) {
    var its = stk().items.slice().sort(function (a, b) {
      if (isLow(a) !== isLow(b)) return isLow(a) ? -1 : 1;
      return String(a.name).localeCompare(String(b.name), 'he');
    });
    var low = its.filter(isLow);
    el.innerHTML = S.screenHead({ title: 'מלאי', sub: esc(Esek.state.biz.name) + ' · חומרים יורדים לבד כשתור מסומן "בוצע"',
      actions: '<button class="btn pri" type="button" data-new>' + S.icon('plus') + 'פריט חדש</button>' }) +
      '<div class="bz-kpis"><div class="card bz-kpi">' + S.progress(its.length - low.length, its.length, 'פריטים מעל המינימום', low.length ? 'w' : 'o') + '</div>' +
      (low.length ? '<div class="card bz-kpi bz-lowk"><span>' + S.icon('alert', 'sm') + 'צריך להזמין</span><b>' + low.map(function (x) { return esc(x.name); }).join(' · ') + '</b>' +
        S.copyBtn(low.map(function (x) { return x.name + ' (יש ' + S.fmtNum(x.qty) + ' ' + x.unit + ', מינימום ' + S.fmtNum(x.min) + ')'; }).join('\n'), 'העתקת רשימה להזמנה') + '</div>' : '') + '</div>' +
      (its.length ? '<ul class="card bz-stock">' + its.map(function (it) {
        return '<li class="bz-si' + (isLow(it) ? ' low' : '') + '" data-item="' + esc(it.id) + '">' +
          '<a class="bz-sn" href="#stock/' + esc(it.id) + '"><b>' + esc(it.name) + '</b><span>' + esc(it.unit) + ' · מינימום ' + num(it.min) + '</span></a>' +
          '<div class="bz-sq"><div class="bz-sqn"><b data-qty>' + num(it.qty) + '</b>' + (isLow(it) ? lowTag() : '') + '</div>' + qtyBar(it) + '</div>' +
          '<div class="bz-sa"><button class="btn ok" type="button" data-in="' + esc(it.id) + '" aria-label="' + esc('כניסה למלאי: ' + it.name) + '">' + S.icon('plus', 'sm') + 'כניסה</button>' +
          '<button class="btn" type="button" data-out="' + esc(it.id) + '" aria-label="' + esc('יציאה מהמלאי: ' + it.name) + '">יציאה</button>' +
          '<a class="btn ghost" href="#stock/' + esc(it.id) + '">היסטוריה</a></div></li>';
      }).join('') + '</ul>' : '<div class="card bz-empty">עוד אין פריטים במלאי.</div>');
    el.onclick = function (ev) {
      var b;
      if (ev.target.closest('[data-new]')) itemModal(null);
      else if ((b = ev.target.closest('[data-in]'))) moveModal(b.getAttribute('data-in'), 1);
      else if ((b = ev.target.closest('[data-out]'))) moveModal(b.getAttribute('data-out'), -1);
    };
  }

  function itemScreen(el, id) {
    var it = Esek.byId(stk().items, id);
    if (!it) {
      el.innerHTML = S.screenHead({ title: 'הפריט לא נמצא', back: '#stock', backLabel: 'חזרה למלאי' }) + '<div class="card bz-empty">ייתכן שנמחק.</div>';
      return;
    }
    var moves = stk().moves.filter(function (m) { return m.itemId === it.id; });
    // יתרה אחרי כל תנועה: מחושבת אחורה מהכמות הנוכחית
    var ordered = moves.map(function (m, i) { return { m: m, i: i }; }).sort(function (a, b) {
      return a.m.date < b.m.date ? 1 : a.m.date > b.m.date ? -1 : b.i - a.i;
    });
    var bal = +it.qty || 0;
    ordered.forEach(function (x) { x.after = r2(bal); bal = r2(bal - (+x.m.delta || 0)); });
    var sv = usedIn(it.id);
    var canDel = !moves.length && !sv.length;
    el.innerHTML = S.screenHead({ title: it.name, sub: esc(it.unit) + ' · מינימום ' + num(it.min), back: '#stock', backLabel: 'חזרה למלאי',
      actions: '<button class="btn" type="button" data-edit>' + S.icon('edit') + 'עריכה</button>' }) +
      '<div class="card pad bz-item' + (isLow(it) ? ' low' : '') + '"><div class="bz-sqn"><span>במלאי עכשיו</span><b data-qty>' + num(it.qty) + '</b><span>' + esc(it.unit) + '</span>' + (isLow(it) ? lowTag() : '') + '</div>' + qtyBar(it) +
        (sv.length ? '<p class="bz-note">יורד אוטומטית בכל ביצוע של: ' + sv.map(function (s) {
          var m = (s.materials || []).filter(function (x) { return x.itemId === it.id; })[0];
          return esc(s.name) + ' (' + S.fmtNum(m ? m.qty : 0) + ')';
        }).join(' · ') + '</p>' : '<p class="bz-note">אף שירות לא צורך את הפריט הזה.</p>') + '</div>' +
      '<h2 class="sec-t">תנועה חדשה</h2>' +
      '<form class="card pad" data-mform novalidate><div class="form-grid">' +
        '<label class="fld">סוג<select data-md><option value="1">כניסה (הוספה)</option><option value="-1">יציאה (הורדה)</option></select></label>' +
        '<label class="fld">כמות (' + esc(it.unit) + ')<input data-mq type="number" inputmode="decimal" min="0" step="0.5" dir="ltr"></label>' +
        '<label class="fld bz-wide">הערה<input data-mn placeholder="למשל: משלוח מהספק"></label></div>' +
        '<p class="err" data-merr hidden></p><div class="fix-a"><button class="btn pri" type="submit">' + S.icon('check') + 'שמירת התנועה</button></div></form>' +
      '<h2 class="sec-t">היסטוריית תנועות (' + moves.length + ')</h2>' +
      (ordered.length ? '<div class="card"><table class="bz-t"><thead><tr><th>תאריך</th><th>שינוי</th><th>יתרה</th><th>פירוט</th></tr></thead><tbody>' +
        ordered.map(function (x) {
          var m = x.m, d = +m.delta || 0, o = m.orderId ? Esek.byId(Esek.state.orders, m.orderId) : null;
          return '<tr><td data-l="תאריך">' + S.fmtDate(m.date) + '</td>' +
            '<td data-l="שינוי"><bdi dir="ltr" class="num bz-d ' + (d > 0 ? 'up' : 'dn') + '">' + (d > 0 ? '+' : '−') + S.fmtNum(Math.abs(d)) + '</bdi></td>' +
            '<td data-l="יתרה">' + num(x.after) + '</td>' +
            '<td data-l="פירוט">' + esc(m.note || '') + (m.orderId ? ' <a href="#order/' + esc(m.orderId) + '">' + S.icon('calendar', 'sm') + ' לתור' +
              (o && o.date ? ' ' + S.fmtDate(o.date, { noDay: true }) : '') + '</a> <span class="tag info">אוטומטי</span>' : '') + '</td></tr>';
        }).join('') + '</tbody></table></div>' : '<div class="card bz-empty">עוד אין תנועות לפריט הזה.</div>') +
      '<div class="bz-danger">' + (canDel ? '<button class="btn danger" type="button" data-del>' + S.icon('trash', 'sm') + 'מחיקת הפריט</button>'
        : '<p class="bz-note">אי אפשר למחוק פריט שיש לו תנועות או ששירות צורך אותו.</p>') + '</div>';

    var f = el.querySelector('[data-mform]');
    f.addEventListener('input', function () { S.hold(true); }, { once: true });
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var dir = +f.querySelector('[data-md]').value, q = +f.querySelector('[data-mq]').value, note = trim(f.querySelector('[data-mn]').value), err = f.querySelector('[data-merr]');
      var cur = Esek.byId(stk().items, it.id);
      var msg = !(q > 0) ? 'צריך כמות גדולה מ-0.' : (dir < 0 && cur && q > (+cur.qty || 0)) ? 'אין מספיק במלאי (יש ' + S.fmtNum(cur.qty) + ').' : '';
      err.hidden = !msg; err.textContent = msg;
      if (msg) return;
      Esek.stockMove(it.id, dir * q, note || (dir > 0 ? 'כניסה ידנית' : 'יציאה ידנית'));
      S.hold(false);
      S.toast('התנועה נשמרה');
      S.refresh();
    });
    el.onclick = function (ev) {
      if (ev.target.closest('[data-edit]')) itemModal(it);
      else if (ev.target.closest('[data-del]')) {
        S.modal({ title: 'מחיקת ' + it.name, html: '<p>הפריט יימחק מהמלאי.</p>', actions: [{ label: 'מחיקה', cls: 'warn', onClick: function () {
          stk().items = stk().items.filter(function (x) { return x.id !== it.id; });
          Esek.save(); S.toast('הפריט נמחק'); setTimeout(function () { S.go('#stock'); }, 0);
        } }, { label: 'ביטול', cls: 'ghost' }] });
      }
    };
  }

  Shell.page('stock', {
    title: 'מלאי',
    render: function (el, params) { if (params[0]) itemScreen(el, params[0]); else listScreen(el); }
  });
})();
