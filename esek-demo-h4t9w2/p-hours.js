/* p-hours.js — #hours: דיווח שעות.
   #hours (ממתין לאישורך) · #hours/prep (ממתין לתלמיד.ה) · #hours/ok (אושרו החודש) · #hours/new (דיווח במקום תלמיד.ה) */
(function () {
  'use strict';
  var S = Shell, esc = S.esc;
  var ui = { openId: null, sel: {}, okShown: 20 };

  function r2(x) { return Math.round(x * 100) / 100; }
  function clone(e, patch) { var o = {}, k; for (k in e) o[k] = e[k]; for (k in patch) o[k] = patch[k]; return o; }
  function sortEntries(list, desc) {
    return list.slice().sort(function (a, b) {
      var ka = a.date + (a.start || ''), kb = b.date + (b.start || '');
      if (ka === kb) return 0;
      return (ka < kb ? -1 : 1) * (desc ? -1 : 1);
    });
  }
  function taskName(id) { var t = Esek.byId(Esek.state.biz.tasks || [], id); return t ? t.name : ''; }

  /* ---------- פירוט לפי משימות (רכיב משותף לתיקון ולדיווח חדש) ---------- */
  function SplitEd(root, base, split, getHours, onChange) {
    var tasks = Esek.state.biz.tasks || [];
    var rows = (split || []).map(function (x) { return { taskId: x.taskId, hours: x.hours }; });
    function opts(sel) {
      return tasks.map(function (t) { return '<option value="' + esc(t.id) + '"' + (t.id === sel ? ' selected' : '') + '>' + esc(t.name) + '</option>'; }).join('');
    }
    function draw() {
      root.innerHTML = '<table class="mini"><thead><tr><th>משימה</th><th>שעות</th><th>תעריף</th><th>שכר</th><th><span class="sr">הסרה</span></th></tr></thead><tbody>' +
        rows.map(function (r, i) {
          var t = Esek.byId(tasks, r.taskId);
          return '<tr><td><select data-sp-task="' + i + '" aria-label="משימה">' + opts(r.taskId) + '</select></td>' +
            '<td><input data-sp-h="' + i + '" type="number" inputmode="decimal" min="0" step="0.25" dir="ltr" value="' + esc(r.hours) + '" aria-label="שעות למשימה"></td>' +
            '<td>' + S.fmtMoney(t ? t.rate : 0) + '</td>' +
            '<td data-sp-pay="' + i + '">' + S.fmtMoney((+r.hours || 0) * (t ? +t.rate || 0 : 0)) + '</td>' +
            '<td><button class="btn ghost icon" type="button" data-sp-del="' + i + '" aria-label="הסרת המשימה">' + S.icon('trash') + '</button></td></tr>';
        }).join('') + '</tbody><tfoot><tr><td colspan="5" data-sp-foot></td></tr></tfoot></table>' +
        '<button class="btn" type="button" data-sp-add>' + S.icon('plus') + 'הוספת משימה</button>' +
        '<p class="err" data-sp-err hidden></p>';
      foot();
    }
    function cur() { return rows.filter(function (r) { return r.taskId && +r.hours > 0; }).map(function (r) { return { taskId: r.taskId, hours: r2(+r.hours) }; }); }
    function foot() {
      var h = getHours(), sp = cur(), c = clone(base, { hours: h, split: sp });
      var over = Esek.splitOver(c), p = Esek.payOf(c), used = Esek.splitSum(c);
      var rest = 0;
      p.lines.forEach(function (l) { if (!l.taskId) rest = l; });
      var f = root.querySelector('[data-sp-foot]');
      f.innerHTML = 'פורטו ' + S.fmtHours(used) + ' מתוך ' + S.fmtHours(h) +
        (rest ? ' · יתרה ' + S.fmtHours(rest.hours) + ' בתעריף רגיל ' + S.fmtMoney(rest.rate) : '') +
        ' · <span>סה"כ שכר ' + (over ? '—' : S.fmtMoney(p.total)) + '</span>';
      var er = root.querySelector('[data-sp-err]');
      er.hidden = !over;
      er.innerHTML = over ? 'הפירוט (' + S.fmtHours(used) + ') גדול מסך השעות (' + S.fmtHours(h) + '). צריך לתקן לפני השמירה.' : '';
      if (onChange) onChange(over);
    }
    root.addEventListener('change', function (e) {
      var t = e.target;
      if (t.hasAttribute('data-sp-task')) { rows[+t.getAttribute('data-sp-task')].taskId = t.value; draw(); }
    });
    root.addEventListener('input', function (e) {
      var t = e.target;
      if (t.hasAttribute('data-sp-h')) {
        var i = +t.getAttribute('data-sp-h');
        rows[i].hours = t.value;
        var tk = Esek.byId(tasks, rows[i].taskId);
        root.querySelector('[data-sp-pay="' + i + '"]').innerHTML = S.fmtMoney((+t.value || 0) * (tk ? +tk.rate || 0 : 0));
        foot();
      }
    });
    root.addEventListener('click', function (e) {
      var d = e.target.closest('[data-sp-del]');
      if (d) { rows.splice(+d.getAttribute('data-sp-del'), 1); draw(); return; }
      if (e.target.closest('[data-sp-add]')) {
        if (!tasks.length) return;
        rows.push({ taskId: tasks[0].id, hours: '' });
        draw();
        var ins = root.querySelectorAll('[data-sp-h]');
        if (ins.length) ins[ins.length - 1].focus();
      }
    });
    draw();
    return {
      get: cur,
      over: function () { return Esek.splitOver(clone(base, { hours: getHours(), split: cur() })); },
      refresh: foot
    };
  }

  /* ---------- שעות: התחלה/סיום או סה"כ ---------- */
  function TimesEd(root, start, end, hours, onChange) {
    var mode = 'times';
    root.innerHTML = '<div class="times">' +
      '<label class="fld">שעת התחלה<input type="time" data-t-s dir="ltr" value="' + esc(start || '') + '"></label>' +
      '<label class="fld">שעת סיום<input type="time" data-t-e dir="ltr" value="' + esc(end || '') + '"></label>' +
      '<label class="fld">סה"כ שעות<input type="number" data-t-h inputmode="decimal" min="0" step="0.25" dir="ltr" value="' + esc(hours === null || hours === undefined ? '' : hours) + '"></label></div>';
    var s = root.querySelector('[data-t-s]'), e = root.querySelector('[data-t-e]'), h = root.querySelector('[data-t-h]');
    if (!start || !end) mode = 'hours';
    function fromTimes() {
      mode = 'times';
      if (s.value && e.value) h.value = Esek.hoursBetween(s.value, e.value) || '';
      onChange();
    }
    s.addEventListener('input', fromTimes);
    e.addEventListener('input', fromTimes);
    h.addEventListener('input', function () { mode = 'hours'; onChange(); });
    return {
      hours: function () { return r2(+h.value || 0); },
      val: function () { return { mode: mode, start: s.value, end: e.value, hours: r2(+h.value || 0) }; },
      set: function (a, b) { s.value = a || ''; e.value = b || ''; fromTimes(); }
    };
  }

  /* ---------- שורה ---------- */
  function rowHtml(e, tab) {
    var st = Esek.state, o = Esek.byId(st.orders, e.orderId), w = S.workLabel(o);
    var p = Esek.payOf(e), sp = (e.split || []).filter(function (x) { return +x.hours > 0; });
    var name = S.stuName(e.stuId);
    var det = (sp.length && !p.over
      ? '<span class="k">מפורט</span>' + sp.map(function (x) { return esc(taskName(x.taskId)) + ' ' + S.fmtHours(x.hours, true); }).join(' · ') + ' · '
      : '<span class="k none">בלי פירוט</span>') + 'שכר ' + S.fmtMoney(p.total);
    det += Shell.alertTags(e);
    if (e.note && e.note !== 'מתור') det += '<span class="tag info">' + esc(e.note) + '</span>';
    var check = tab !== 'ok';
    var acts = '';
    if (tab === 'wait') acts = '<button class="btn ok" type="button" data-ok="' + e.id + '">' + S.icon('check', 'sm') + 'אישור</button>';
    if (tab === 'prep') acts = '<button class="btn ok" type="button" data-ok="' + e.id + '">' + S.icon('check', 'sm') + 'אישור במקום התלמיד.ה</button>';
    if (check) acts += '<button class="btn" type="button" data-fix="' + e.id + '" aria-expanded="' + (ui.openId === e.id) + '">' + S.icon('edit', 'sm') + 'תיקון</button>' +
      '<button class="btn danger" type="button" data-no="' + e.id + '">דחייה</button>';
    return '<li class="row' + (ui.openId === e.id ? ' open' : '') + '" data-row="' + e.id + '"><div class="row-m' + (check ? '' : ' nock') + '">' +
      (check ? '<label class="chk"><input type="checkbox" data-sel="' + e.id + '"' + (ui.sel[e.id] ? ' checked' : '') + ' aria-label="סימון ' + esc(name) + '"></label>' : '') +
      '<div class="who"><b>' + esc(name) + '</b><span>' + S.fmtDate(e.date) + '</span></div>' +
      '<div class="svc"><b>' + esc(w.title) + '</b><span>' + esc(w.sub) + '</span></div>' +
      '<div class="hrs"><b>' + S.fmtHours(e.hours) + '</b><span>' + (S.timeRange(e.start, e.end) || 'בלי שעות') + '</span></div>' +
      '<div class="det">' + det + '</div>' +
      (check ? '<div class="acts">' + acts + '</div>' : '') +
      '</div>' + (ui.openId === e.id ? '<div class="fix" data-fixbox></div>' : '') + '</li>';
  }

  function openEditor(el, e) {
    var box = el.querySelector('[data-fixbox]');
    if (!box) return;
    var name = S.stuName(e.stuId);
    box.innerHTML = '<h3>תיקון הדיווח של ' + esc(name) + '</h3><div data-times></div><h3 style="font-size:15px;margin:4px 0 6px">פירוט לפי משימות (רשות)</h3><div data-split></div>' +
      '<p class="err" data-herr hidden>צריך שעות גדולות מ-0 (או שעת סיום אחרי שעת ההתחלה).</p>' +
      '<div class="fix-a"><button class="btn pri" type="button" data-save>' + S.icon('check') + 'שמירה ואישור</button><button class="btn ghost" type="button" data-cancel>ביטול</button></div>';
    var saveBtn = box.querySelector('[data-save]');
    var sp = null;
    var te = TimesEd(box.querySelector('[data-times]'), e.start, e.end, e.hours, function () { if (sp) sp.refresh(); });
    sp = SplitEd(box.querySelector('[data-split]'), e, e.split, te.hours, function (over) { saveBtn.disabled = over; });
    box.querySelector('[data-cancel]').addEventListener('click', function () { ui.openId = null; S.hold(false); S.refresh(); });
    saveBtn.addEventListener('click', function () {
      var v = te.val(), split = sp.get(), herr = box.querySelector('[data-herr]');
      var hrs = v.mode === 'times' ? Esek.hoursBetween(v.start, v.end) : v.hours;
      herr.hidden = hrs > 0;
      if (!(hrs > 0) || sp.over()) return;
      // הכול נבדק לפני השינוי הראשון
      var cur = Esek.byId(Esek.state.entries, e.id);
      if (!cur) { S.toast('הדיווח לא נמצא. ייתכן שעודכן במקום אחר.'); ui.openId = null; S.hold(false); S.refresh(); return; }
      if (Esek.splitOver(clone(cur, { hours: hrs, split: split }))) return;
      if (v.mode === 'times') {
        if (v.start !== cur.start || v.end !== cur.end) Esek.bulk([cur.id], 'times', { start: v.start, end: v.end });
      } else if (hrs !== +cur.hours || cur.start || cur.end) Esek.bulk([cur.id], 'hours', hrs);
      if (!Esek.setSplit(cur.id, split)) { S.toast('הפירוט לא נשמר: גדול מסך השעות.'); return; }
      Esek.mgrApprove(cur.id);
      ui.openId = null; S.hold(false);
      S.toast('הדיווח של ' + name + ' תוקן ואושר');
      S.refresh();
    });
    var f = box.querySelector('input');
    if (f) f.focus();
  }

  function pendCard(ym) {
    var nc = Esek.notConfirmed(ym), ms = Esek.missing(ym), n = Esek.state.students.length;
    function list(arr, emptyMsg) {
      if (!arr.length) return '<ul class="names none"><li>' + esc(emptyMsg) + '</li></ul>';
      return '<ul class="names">' + arr.map(function (s) { return '<li>' + esc(s.name) + '</li>'; }).join('') + '</ul>' +
        S.copyBtn(arr.map(function (s) { return s.name; }).join('\n'), 'העתקת השמות');
    }
    return '<aside class="card side-cards" aria-label="מי טרם">' +
      '<div class="pend"><h3>טרם אישרו</h3><p>יש להם דיווח מוכן מהתור שמחכה לאישור שלהם</p>' + list(nc, 'כולם אישרו') + '</div>' +
      '<div class="pend"><h3>לא דיווחו כלל החודש</h3>' + S.progress(n - ms.length, n, 'דיווחו ב' + S.monthName(ym), 'o') +
      '<div style="height:10px"></div>' + list(ms, 'כולם דיווחו') + '</div></aside>';
  }

  function listScreen(el, tab) {
    var ym = S.ym();
    var wait = sortEntries(Esek.entries({ status: 'wait' }), true);
    var prep = sortEntries(Esek.entries({ status: 'prep' }), true);
    var ok = sortEntries(Esek.entries({ ym: ym, status: 'ok' }), true);
    var list = tab === 'prep' ? prep : tab === 'ok' ? ok : wait;
    var ids = {};
    list.forEach(function (e) { ids[e.id] = 1; });
    Object.keys(ui.sel).forEach(function (k) { if (!ids[k]) delete ui.sel[k]; });
    if (ui.openId && !ids[ui.openId]) ui.openId = null;
    var shown = tab === 'ok' ? list.slice(0, ui.okShown) : list;

    function tabA(id, href, label, n) {
      return '<a class="tab" role="tab" href="' + href + '" aria-selected="' + (tab === id) + '">' + label + (n !== null ? ' (' + n + ')' : '') + '</a>';
    }
    var nSel = Object.keys(ui.sel).length;
    var toolbar = tab === 'ok'
      ? '<div class="toolbar"><span>' + S.ltr(ok.length) + ' דיווחים אושרו ב' + S.monthName(ym) + ' · ' + S.fmtHours(Esek.sumHours(ok)) + '</span></div>'
      : '<div class="toolbar"><label class="chk"><input type="checkbox" data-all' + (list.length && nSel === list.length ? ' checked' : '') + (list.length ? '' : ' disabled') + '>סימון הכול</label>' +
        '<div class="tb-acts"><button class="btn pri" type="button" data-bulk="ok"' + (nSel ? '' : ' disabled') + '>' + S.icon('check') +
        (tab === 'prep' ? 'אישור במקום התלמיד.ה' : 'אישור המסומנים') + ' <bdi dir="ltr">(<span data-nsel>' + nSel + '</span>)</bdi></button>' +
        '<button class="btn danger" type="button" data-bulk="no"' + (nSel ? '' : ' disabled') + '>דחיית המסומנים</button></div></div>';
    var empty = { wait: 'אין דיווחים שממתינים לאישורך.', prep: 'אין דיווחים שממתינים לתלמידים.', ok: 'עוד לא אושרו דיווחים החודש.' }[tab];

    el.innerHTML = S.screenHead({
      title: 'דיווח שעות', sub: esc(Esek.state.biz.name) + ' · ' + S.monthName(ym),
      actions: '<a class="btn" href="#hours/new">' + S.icon('plus') + 'דיווח במקום תלמיד.ה</a>'
    }) +
      '<div class="tabs" role="tablist">' + tabA('wait', '#hours', 'ממתין לאישורך', wait.length) + tabA('prep', '#hours/prep', 'ממתין לתלמיד.ה', prep.length) +
      tabA('ok', '#hours/ok', 'אושרו החודש', null) + '</div>' +
      '<div class="rep-grid"><div class="card">' + toolbar +
      (shown.length ? '<ul class="rows">' + shown.map(function (e) { return rowHtml(e, tab); }).join('') + '</ul>' : '<div class="rows-empty">' + empty + '</div>') +
      (tab === 'ok' && list.length > shown.length ? '<div class="toolbar" style="border-top:1px solid var(--line);border-bottom:0"><button class="btn" type="button" data-more>הצגת עוד ' + Math.min(20, list.length - shown.length) + ' (מתוך ' + list.length + ')</button></div>' : '') +
      '</div>' + pendCard(ym) + '</div>';

    if (ui.openId) openEditor(el, Esek.byId(Esek.state.entries, ui.openId));

    el.onchange = function (ev) {
      var t = ev.target;
      if (t.hasAttribute('data-sel')) {
        if (t.checked) ui.sel[t.getAttribute('data-sel')] = 1; else delete ui.sel[t.getAttribute('data-sel')];
        syncSel(el, list.length);
      } else if (t.hasAttribute('data-all')) {
        ui.sel = {};
        if (t.checked) list.forEach(function (e) { ui.sel[e.id] = 1; });
        el.querySelectorAll('[data-sel]').forEach(function (c) { c.checked = t.checked; });
        syncSel(el, list.length);
      }
    };
    el.onclick = function (ev) {
      var t = ev.target, b;
      if ((b = t.closest('[data-ok]'))) {
        var id = b.getAttribute('data-ok'), e0 = Esek.byId(Esek.state.entries, id);
        if (Esek.mgrApprove(id)) S.toast('אושר: ' + S.stuName(e0.stuId));
        delete ui.sel[id]; if (ui.openId === id) { ui.openId = null; S.hold(false); }
        S.refresh();
      } else if ((b = t.closest('[data-no]'))) {
        var nid = b.getAttribute('data-no'), e1 = Esek.byId(Esek.state.entries, nid);
        Esek.bulk([nid], 'no');
        S.toast('נדחה: ' + S.stuName(e1.stuId));
        delete ui.sel[nid]; if (ui.openId === nid) { ui.openId = null; S.hold(false); }
        S.refresh();
      } else if ((b = t.closest('[data-fix]'))) {
        var fid = b.getAttribute('data-fix');
        ui.openId = ui.openId === fid ? null : fid;
        S.hold(false);
        S.refresh();
        if (ui.openId) {
          S.hold(true);
          var row = document.querySelector('[data-row="' + fid + '"]');
          if (row && row.scrollIntoView) row.scrollIntoView({ block: 'nearest' });
        }
      } else if ((b = t.closest('[data-bulk]'))) {
        var ids2 = Object.keys(ui.sel);
        if (!ids2.length) return;
        var act = b.getAttribute('data-bulk');
        if (act === 'no') {
          S.modal({
            title: 'דחיית ' + ids2.length + ' דיווחים',
            html: '<p>הדיווחים המסומנים יסומנו "נדחה" ולא ייכנסו לשכר ולחיוב.</p>',
            actions: [{ label: 'דחייה', cls: 'warn', onClick: function () { doBulk(ids2, 'no'); } }, { label: 'ביטול', cls: 'ghost' }]
          });
        } else doBulk(ids2, 'ok');
      } else if (t.closest('[data-more]')) {
        ui.okShown += 20;
        S.refresh();
      }
    };
  }
  function doBulk(ids, act) {
    var r = Esek.bulk(ids, act);
    ui.sel = {}; ui.openId = null; S.hold(false);
    S.toast((act === 'ok' ? 'אושרו ' : 'נדחו ') + r.changed.length + ' דיווחים');
    S.refresh();
  }
  function syncSel(el, total) {
    var n = Object.keys(ui.sel).length;
    el.querySelectorAll('[data-nsel]').forEach(function (x) { x.textContent = n; });
    el.querySelectorAll('[data-bulk]').forEach(function (x) { x.disabled = !n; });
    var all = el.querySelector('[data-all]');
    if (all) all.checked = total > 0 && n === total;
  }

  /* ---------- דיווח במקום תלמיד.ה ---------- */
  function newScreen(el) {
    var st = Esek.state, today = Esek.today();
    var stuOpts = st.students.slice().sort(function (a, b) { return a.name.localeCompare(b.name, 'he'); })
      .map(function (s) { return '<option value="' + esc(s.id) + '">' + esc(s.name) + '</option>'; }).join('');
    el.innerHTML = S.screenHead({ title: 'דיווח במקום תלמיד.ה', sub: 'הדיווח נשמר כמאושר', back: '#hours', backLabel: 'חזרה לדיווח שעות' }) +
      '<div class="card pad"><div class="form-grid">' +
      '<label class="fld">תלמיד.ה<select data-n-stu><option value="">בחירה</option>' + stuOpts + '</select></label>' +
      '<label class="fld">תאריך<input type="date" data-n-date dir="ltr" value="' + today + '" max="' + Esek.addDays(today, 0) + '"></label>' +
      '<label class="fld" style="grid-column:1/-1">על מה עבד.ה<select data-n-order></select></label>' +
      '</div><div style="height:12px"></div><div data-n-times></div>' +
      '<h3 style="font-size:15px;margin:4px 0 6px">פירוט לפי משימות (רשות)</h3><div data-n-split></div>' +
      '<label class="fld" style="margin-top:12px">הערה (רשות)<input type="text" data-n-note value="דווח על ידי הרכז.ת"></label>' +
      '<p class="err" data-n-err hidden></p>' +
      '<div class="fix-a"><button class="btn pri" type="button" data-n-save>' + S.icon('check') + 'שמירה</button><a class="btn ghost" href="#hours">ביטול</a></div></div>';
    var selO = el.querySelector('[data-n-order]'), dateI = el.querySelector('[data-n-date]');
    function fillOrders() {
      var d = dateI.value, prev = selO.value;
      var appts = d ? Esek.appts(d).filter(function (o) { return o.status !== 'req'; }) : [];
      var internal = st.orders.filter(function (o) { return !o.custId && o.status !== 'closed'; });
      var open = st.orders.filter(function (o) { return o.custId && !o.time && ['new', 'work', 'sched'].indexOf(o.status) >= 0; });
      function op(o, lbl) { return '<option value="' + esc(o.id) + '">' + esc(lbl) + '</option>'; }
      var h = '<option value="">בחירה</option>';
      if (appts.length) h += '<optgroup label="תורים ביום הזה">' + appts.map(function (o) { var w = S.workLabel(o); return op(o, o.time + ' · ' + w.title + ' · ' + w.sub); }).join('') + '</optgroup>';
      if (internal.length) h += '<optgroup label="עבודה פנימית">' + internal.map(function (o) { return op(o, o.title); }).join('') + '</optgroup>';
      if (open.length) h += '<optgroup label="הזמנות פתוחות">' + open.map(function (o) { return op(o, o.title); }).join('') + '</optgroup>';
      selO.innerHTML = h;
      if (prev && selO.querySelector('option[value="' + prev + '"]')) selO.value = prev;
    }
    fillOrders();
    var sp = null, saveBtn = el.querySelector('[data-n-save]');
    var base = { id: '_new', stuId: '', orderId: '', hours: 0, split: [] };
    var te = TimesEd(el.querySelector('[data-n-times]'), '', '', '', function () { if (sp) sp.refresh(); });
    function makeSplit(split) {
      base.stuId = el.querySelector('[data-n-stu]').value;
      base.orderId = selO.value;
      sp = SplitEd(el.querySelector('[data-n-split]'), base, split, te.hours, function (over) { saveBtn.disabled = over; });
    }
    makeSplit([]);
    dateI.addEventListener('change', fillOrders);
    el.querySelector('[data-n-stu]').addEventListener('change', function () { base.stuId = this.value; sp.refresh(); });
    selO.addEventListener('change', function () {
      base.orderId = selO.value;
      var o = Esek.byId(st.orders, selO.value);
      if (o && o.time) {
        te.set(o.time, Esek.apptEnd(o));
        var sv = o.serviceId ? Esek.byId(st.biz.services, o.serviceId) : null;
        makeSplit(((sv && sv.split) || []).map(function (x) { return { taskId: x.taskId, hours: r2((+x.minutes || 0) / 60) }; }));
      } else sp.refresh();
    });
    S.hold(true);
    saveBtn.addEventListener('click', function () {
      var stu = el.querySelector('[data-n-stu]').value, d = dateI.value, oid = selO.value, v = te.val(), err = el.querySelector('[data-n-err]');
      var hrs = v.mode === 'times' ? Esek.hoursBetween(v.start, v.end) : v.hours;
      var msg = !stu ? 'צריך לבחור תלמיד.ה.' : !d ? 'צריך תאריך.' : !oid ? 'צריך לבחור על מה עבד.ה.' : !(hrs > 0) ? 'צריך שעות (או שעת סיום אחרי שעת ההתחלה).' : sp.over() ? 'הפירוט גדול מסך השעות.' : '';
      err.hidden = !msg; err.textContent = msg;
      if (msg) return;
      var e = Esek.addEntry({ stuId: stu, orderId: oid, date: d, start: v.mode === 'times' ? v.start : null, end: v.mode === 'times' ? v.end : null,
        hours: hrs, by: 'mgr', note: el.querySelector('[data-n-note]').value.trim() });
      var split = sp.get();
      if (split.length) Esek.setSplit(e.id, split);
      S.hold(false);
      S.toast('הדיווח של ' + S.stuName(stu) + ' נשמר ואושר');
      S.go('#hours/ok');
    });
  }

  Shell.page('hours', {
    title: 'דיווח שעות',
    render: function (el, params) {
      var tab = params[0] || 'wait';
      if (tab === 'new') return newScreen(el);
      if (tab !== 'prep' && tab !== 'ok') tab = 'wait';
      if (ui.tab !== tab) { ui.sel = {}; ui.openId = null; ui.okShown = 20; ui.tab = tab; }
      listScreen(el, tab);
      if (ui.openId) S.hold(true);
    }
  });
})();
