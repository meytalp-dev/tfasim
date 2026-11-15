/* p-students.js — #students: תלמידים.
   #students         רשימה: שם, שכבה, תעריף, קוד, "מורשה.ית לקבוע תורים", שעות מאושרות החודש · קישור לדף התלמיד.ה · איפוס ההדגמה
   #student/<id>     פרטי תלמיד.ה: שעות החודש, ימי עבודה, שעות לתעודה, דיווחים אחרונים, עריכה
   #student/new      תלמיד.ה חדש.ה
   הוספה/עריכה: אין בליבה, משנים את Esek.state ושומרים. קוד אישי = 4 ספרות, ייחודי (מחרוזת, אפס מוביל מותר). */
(function () {
  'use strict';
  var S = Shell, esc = S.esc;
  var STATUS = { prep: 'ממתין לתלמיד.ה', wait: 'ממתין לאישורך', ok: 'אושר', no: 'נדחה' };

  function trim(s) { return String(s || '').replace(/^\s+|\s+$/g, ''); }
  function num(n) { return '<bdi dir="ltr" class="num">' + S.fmtNum(n) + '</bdi>'; }
  function money(n) { return '<bdi dir="ltr" class="num">' + S.fmtNum(n) + ' ₪</bdi>'; }
  function stus() { return Esek.state.students; }
  function stuUrl() { try { return new URL('stu.html', location.href).href; } catch (e) { return 'stu.html'; } }
  function pinTaken(pin, exceptId) { return stus().some(function (s) { return String(s.pin) === pin && s.id !== exceptId; }); }
  function genPin(exceptId) {
    for (var i = 0; i < 500; i++) {
      var p = String(Math.floor(Math.random() * 10000));
      while (p.length < 4) p = '0' + p;
      if (!pinTaken(p, exceptId)) return p;
    }
    return '';
  }
  function monthOk(id, ym) { return Esek.entries({ stuId: id, ym: ym, status: 'ok' }); }

  function linkCard() {
    var u = stuUrl();
    return '<div class="card pad bz-link"><div class="bz-link-t"><b>דף התלמיד.ה</b><span>כל תלמיד.ה נכנס.ת עם הקוד האישי: התורים שלי, אישור שעות, הוספת עבודה' +
      ' וקביעת תור (למורשים).</span><span><b>בהדגמה הדף עובד רק במכשיר הזה.</b> שליחת הקישור לתלמידים תתאפשר כשהנתונים יעברו לשרת משותף.</span></div><div class="bz-acts">' +
      '<a class="btn" href="stu.html" target="_blank" rel="noopener">' + S.icon('external') + 'פתיחה</a>' + (u ? '' : '') + '</div></div>';
  }

  function listScreen(el) {
    var ym = S.ym(), list = stus().slice().sort(function (a, b) {
      return String(a.cls).localeCompare(String(b.cls), 'he') || String(a.name).localeCompare(String(b.name), 'he');
    });
    var nBook = list.filter(function (s) { return s.canBook; }).length;
    var worked = 0;
    var rows = list.map(function (s) {
      var es = monthOk(s.id, ym), h = Esek.sumHours(es);
      if (es.length) worked++;
      return '<li class="bz-stu" data-stu="' + esc(s.id) + '"><a class="bz-stn" href="#student/' + esc(s.id) + '"><b>' + esc(s.name) + '</b><span>כיתה ' + esc(s.cls || '') +
        ' · ' + money(s.rate) + ' לשעה</span></a>' +
        '<div class="bz-stc"><span class="muted">קוד</span><b>' + S.ltr(s.pin) + '</b></div>' +
        '<div class="bz-sth"><span class="muted">אושרו ב' + esc(S.monthName(ym)) + '</span><b>' + S.fmtHours(h) + '</b></div>' +
        '<label class="bz-sw"><input type="checkbox" role="switch" data-book="' + esc(s.id) + '"' + (s.canBook ? ' checked' : '') + '><span class="bz-swt" aria-hidden="true"></span>מורשה.ית לקבוע תורים</label></li>';
    }).join('');
    el.innerHTML = S.screenHead({ title: 'תלמידים', sub: esc(Esek.state.biz.name) + ' · ' + num(list.length) + ' תלמידים',
      actions: '<a class="btn pri" href="#student/new">' + S.icon('plus') + 'תלמיד.ה חדש.ה</a>' }) +
      linkCard() +
      '<div class="bz-kpis"><div class="card bz-kpi">' + S.progress(worked, list.length, 'עבדו ב' + S.monthName(ym), 'o') + '</div>' +
        '<div class="card bz-kpi">' + S.progress(nBook, list.length, 'מורשים לקבוע תורים', 'a') + '</div></div>' +
      '<ul class="card bz-stus">' + rows + '</ul>' +
      '<div class="card pad bz-reset"><div><b>איפוס נתוני ההדגמה</b><p class="bz-note">מחזיר את כל הנתונים במכשיר הזה לנתוני הדוגמה: תלמידים, תורים, דיווחים, לקוחות ומלאי. שינויים שעשיתם יימחקו.</p></div>' +
        '<button class="btn danger" type="button" data-reset>' + S.icon('trash', 'sm') + 'איפוס נתוני ההדגמה</button></div>';
    el.onchange = function (ev) {
      var t = ev.target;
      if (!t.hasAttribute('data-book')) return;
      var s = Esek.byId(stus(), t.getAttribute('data-book'));
      if (!s) return;
      s.canBook = t.checked;
      Esek.save();
      S.toast(s.name + (s.canBook ? ': מורשה.ית לקבוע תורים' : ': לא מורשה.ית לקבוע תורים'));
      S.refresh();
    };
    el.onclick = function (ev) {
      if (!ev.target.closest('[data-reset]')) return;
      S.modal({
        title: 'איפוס נתוני ההדגמה',
        html: '<p>כל הנתונים במכשיר הזה יוחלפו בנתוני הדוגמה. אי אפשר לבטל.</p>',
        actions: [{ label: 'איפוס', cls: 'warn', onClick: function () {
          Esek.reset2();
          location.hash = '#home';
          location.reload();
        } }, { label: 'ביטול', cls: 'ghost' }]
      });
    };
  }

  function formHtml(v, isNew) {
    return '<form class="card pad" data-sform novalidate><div class="form-grid">' +
      '<label class="fld">שם<input data-k="name" value="' + esc(v.name) + '"></label>' +
      '<label class="fld">כיתה / שכבה<input data-k="cls" value="' + esc(v.cls) + '" placeholder="למשל יא"></label>' +
      '<label class="fld">תעריף לשעה (₪)<input data-k="rate" type="number" inputmode="decimal" min="0" step="0.5" dir="ltr" value="' + esc(v.rate) + '"></label>' +
      '<div class="fld"><label for="pin-in">קוד אישי (4 ספרות)</label><div class="bz-pin"><input id="pin-in" data-k="pin" type="text" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" dir="ltr" autocomplete="off" value="' + esc(v.pin) + '">' +
        '<button class="btn" type="button" data-gen>יצירת קוד</button></div></div></div>' +
      '<label class="bz-sw bz-sw-f"><input type="checkbox" role="switch" data-k="canBook"' + (v.canBook ? ' checked' : '') + '><span class="bz-swt" aria-hidden="true"></span>מורשה.ית לקבוע תורים בדף התלמיד.ה</label>' +
      '<p class="bz-note">התעריף הרגיל חל על שעות שלא פורטו למשימה. שעות שפורטו משולמות לפי תעריף המשימה.</p>' +
      '<p class="err" data-err hidden></p>' +
      '<div class="fix-a"><button class="btn pri" type="submit">' + S.icon('check') + (isNew ? 'הוספה' : 'שמירה') + '</button>' +
      (isNew ? '<a class="btn ghost" href="#students">ביטול</a>' : '') + '</div></form>';
  }
  function wireForm(el, s) {
    var f = el.querySelector('[data-sform]');
    f.addEventListener('input', function () { S.hold(true); }, { once: true });
    f.querySelector('[data-gen]').addEventListener('click', function () {
      var p = genPin(s ? s.id : null);
      f.querySelector('[data-k="pin"]').value = p;
      S.hold(true);
    });
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      function g(k) { return f.querySelector('[data-k="' + k + '"]').value; }
      var name = trim(g('name')), cls = trim(g('cls')), rate = g('rate'), pin = trim(g('pin')), err = f.querySelector('[data-err]');
      var msg = !name ? 'צריך שם.' : (rate === '' || !(+rate >= 0)) ? 'צריך תעריף לשעה (0 ומעלה).'
        : !/^\d{4}$/.test(pin) ? 'הקוד צריך להיות בדיוק 4 ספרות.' : pinTaken(pin, s ? s.id : null) ? 'הקוד ' + pin + ' כבר שייך לתלמיד.ה אחר.ת. אפשר ללחוץ "יצירת קוד".' : '';
      err.hidden = !msg; err.textContent = msg;
      if (msg) return;
      var cur = s ? Esek.byId(stus(), s.id) : null;
      if (s && !cur) { S.toast('התלמיד.ה לא נמצא.ה'); S.go('#students'); return; }
      var x = cur || { id: 's' + Esek.uid(), grp: (stus()[0] && stus()[0].grp) || '' };
      x.name = name; x.cls = cls; x.rate = +rate; x.pin = pin; x.canBook = f.querySelector('[data-k="canBook"]').checked;
      if (!cur) stus().push(x);
      Esek.save(); S.hold(false);
      S.toast(cur ? 'הפרטים נשמרו' : 'התלמיד.ה נוסף.ה');
      if (!cur) S.go('#student/' + x.id); else S.refresh();
    });
  }

  function stuScreen(el, id) {
    if (id === 'new') {
      el.innerHTML = S.screenHead({ title: 'תלמיד.ה חדש.ה', back: '#students', backLabel: 'חזרה לתלמידים' }) +
        formHtml({ name: '', cls: '', rate: '', pin: genPin(null), canBook: false }, true);
      wireForm(el, null);
      return;
    }
    var s = Esek.byId(stus(), id);
    if (!s) {
      el.innerHTML = S.screenHead({ title: 'התלמיד.ה לא נמצא.ה', back: '#students', backLabel: 'חזרה לתלמידים' }) + '<div class="card bz-empty">ייתכן שנמחק.ה.</div>';
      return;
    }
    var ym = S.ym(), ok = monthOk(s.id, ym), cert = Esek.certHours(s.id);
    var pay = 0;
    ok.forEach(function (e) { pay += Esek.payOf(e).total; });
    var recent = Esek.entries({ stuId: s.id }).slice().sort(function (a, b) {
      var ka = a.date + (a.start || ''), kb = b.date + (b.start || '');
      return ka < kb ? 1 : ka > kb ? -1 : 0;
    }).slice(0, 10);
    el.innerHTML = S.screenHead({ title: s.name, sub: 'כיתה ' + esc(s.cls || '') + ' · קוד ' + S.ltr(s.pin) + (s.canBook ? ' · מורשה.ית לקבוע תורים' : ''), back: '#students', backLabel: 'חזרה לתלמידים' }) +
      '<div class="bz-kpis">' +
        '<div class="card bz-kpi"><span>שעות מאושרות ב' + esc(S.monthName(ym)) + '</span><b>' + S.fmtHours(Esek.sumHours(ok)) + '</b></div>' +
        '<div class="card bz-kpi"><span>ימי עבודה ב' + esc(S.monthName(ym)) + '</span><b>' + num(Esek.workDays(ok)) + '</b></div>' +
        '<div class="card bz-kpi"><span>שכר ב' + esc(S.monthName(ym)) + '</span><b>' + money(Math.round(pay * 100) / 100) + '</b></div>' +
        '<div class="card bz-kpi"><span>שעות לתעודה (סה"כ)</span><b>' + S.fmtHours(cert) + '</b></div></div>' +
      '<h2 class="sec-t">דיווחים אחרונים</h2>' +
      (recent.length ? '<ul class="card bz-list">' + recent.map(function (e) {
        var o = Esek.byId(Esek.state.orders, e.orderId), w = S.workLabel(o);
        var tc = e.status === 'ok' ? 'tag ok' : e.status === 'no' ? 'tag bz-no' : e.status === 'prep' ? 'tag info' : 'tag';
        return '<li><a class="bz-li" href="' + (e.status === 'prep' ? '#hours/prep' : e.status === 'wait' ? '#hours' : '#hours/ok') + '"><span class="bz-tx"><b>' + esc(w.title) + (w.sub ? ' · ' + esc(w.sub) : '') + '</b>' +
          '<span>' + S.fmtDate(e.date) + (e.start ? ' · ' + S.timeRange(e.start, e.end) : '') + '</span></span>' +
          '<span class="bz-fig"><b>' + S.fmtHours(e.hours) + '</b><span class="' + tc + '">' + esc(STATUS[e.status] || e.status) + '</span></span>' + S.icon('chevron', 'bz-chev') + '</a></li>';
      }).join('') + '</ul>' : '<div class="card bz-empty">עוד אין דיווחים.</div>') +
      '<h2 class="sec-t">עריכת פרטים</h2>' + formHtml(s, false) +
      '<h2 class="sec-t">דף התלמיד.ה</h2>' + linkCard();
    wireForm(el, s);
  }

  Shell.page('students', { title: 'תלמידים', render: function (el) { listScreen(el); } });
  Shell.page('student', { title: 'תלמיד.ה', nav: 'students', render: function (el, params) { stuScreen(el, params[0] || 'new'); } });
})();
