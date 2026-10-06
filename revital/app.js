/* הבית של רויטל — שלב 1 (6.10.26).
   64 בתי הספר מ-data/mosdot.json (פריסת הפיקוח), ושלושה מקורות חיים:
     נספח בעלי התפקידים — POST mode:view עם טוקן השער (פרטים אישיים, רק למרחב all)
     מנור — registration.count&by=school (מספרים בלבד, פתוח)
     מצבת תלמידים — ?mode=list (מספר תלמידים לבית ספר)
   כל מקור נטען ונכשל בנפרד. שמות בתי הספר עוברים SchoolNames.canon().
   שום מפתח ושום פרט אישי לא יושבים בקובץ הזה. */
(function () {
  'use strict';

  var GAS = 'https://script.google.com/macros/s/';
  var SRC = {
    mosdot:  'https://pedagogiamh.co.il/data/mosdot.json',
    nispach: GAS + 'AKfycbw_ix0Qi2SkQHB081xdNA15kIQXGsUxO15keTMafPAcWRSy8gyIMmFR6_PV2UZ4_rTiuQ/exec',
    menor:   GAS + 'AKfycbwDOLGv0Hr7KNjFJBIslJkDt9cDa2g4-Gfho3dTfI0AP3uwjlM3NGCwSnQkXZd4DUlyHg/exec?action=registration.count&by=school',
    matz:    GAS + 'AKfycbyozBbEf78cLV61ODLyzhzLSyI2auAUMd8YVgp0qZLGs3O4MYAFhAQuVG7NIxjX0Mq7Lw/exec?mode=list'
  };
  var LINKS = {
    nispach: 'https://pedagogiamh.co.il/nispach-baaley-tafkidim.html',
    nispachTrack: 'https://pedagogiamh.co.il/sikum-nispach-tafkidim.html',
    menor: 'https://pedagogiamh.co.il/hadrachot/ministry/rishum-morim.html',
    matz: 'https://pedagogiamh.co.il/sikum-matzevet.html'
  };
  var MENOR_LOW = 0.5;   /* מתחת לזה בית ספר נחשב "רישום נמוך" */

  var ICON = {
    copy:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
    x:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    doc:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.6"/><path d="M16 14.2c2.9.4 5 2.8 5 5.8"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19V5M4 19h16M8 16V9M13 16V6M18 16v-4"/></svg>'
  };

  var $ = function (id) { return document.getElementById(id); };
  var SN = window.SchoolNames || { canon: function (n) { return n; } };
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function norm(s) { return String(s || '').replace(/[״"׳'\-–—·.,()/]/g, ' ').replace(/\s+/g, ' ').trim(); }

  /* ===== רשת: פסק זמן + ניסיונות חוזרים (Apps Script מחזיר לפעמים 302→404 רגעי) ===== */
  function fetchJson(url, opts, ms, tries) {
    tries = tries || 3;
    return new Promise(function (res, rej) {
      var done = false;
      var t = setTimeout(function () { if (!done) { done = true; rej(new Error('timeout')); } }, ms);
      fetch(url, opts).then(function (r) { return r.json(); })
        .then(function (j) { if (!done) { done = true; clearTimeout(t); res(j); } })
        .catch(function (e) { if (!done) { done = true; clearTimeout(t); rej(e); } });
    }).catch(function (e) {
      if (tries > 1) return fetchJson(url, opts, ms, tries - 1);
      throw e;
    });
  }
  function token() {
    var keys = ['localStorage', 'sessionStorage'];
    for (var i = 0; i < keys.length; i++) {
      try {
        var s = JSON.parse(window[keys[i]].getItem('pmh_auth') || 'null');
        if (s && s.token && s.exp > Date.now()) return s.token;
      } catch (e) { /* אחסון חסום */ }
    }
    return '';
  }

  /* ===== מצב ===== */
  var SCHOOLS = [];             /* מ-mosdot.json */
  var BY = {};                  /* שם → שורה מאוחדת */
  var ST = { nispach: 'load', menor: 'load', matz: 'load' };   /* load | ok | err */
  var CORE = [];

  function toast(t) {
    var el = $('toast');
    el.textContent = t; el.classList.add('on');
    clearTimeout(el._t); el._t = setTimeout(function () { el.classList.remove('on'); }, 1800);
  }
  function copy(text, done) {
    var ok = function () { toast(done || 'הועתק'); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(ok, function () { fallback(text); ok(); });
    } else { fallback(text); ok(); }
  }
  function fallback(text) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }

  /* ===== טעינה ===== */
  function start() {
    $('main').innerHTML = '<div class="loading">טוען את בתי הספר…</div>';
    fetchJson(SRC.mosdot, {}, 20000).then(function (m) {
      SCHOOLS = m.schools || [];
      SCHOOLS.forEach(function (s) { BY[s.name] = { s: s, nispach: null, menor: null, matz: null }; });
      shell();
      loadNispach(); loadMenor(); loadMatz();
    }).catch(function () {
      $('main').innerHTML = '<div class="msg"><h2>הטעינה לא הצליחה</h2><p>לא הצלחתי לטעון את רשימת בתי הספר. ' +
        '<button class="btn" id="retry">לנסות שוב</button></p></div>';
      $('retry').onclick = start;
    });
  }

  function loadNispach() {
    fetchJson(SRC.nispach, {
      method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ mode: 'view', token: token() })
    }, 45000).then(function (d) {
      if (!d || !d.ok) {
        if (d && d.error === 'badsession' && window.PMH_AUTH) { PMH_AUTH.logout(); return; }
        throw new Error(d && d.error);
      }
      CORE = d.core || [];
      d.schools.forEach(function (x) { var r = BY[SN.canon(x.school)]; if (r) r.nispach = x; });
      ST.nispach = 'ok'; $('upd').textContent = d.generated; draw();
    }).catch(function () { ST.nispach = 'err'; draw(); });
  }
  function loadMenor() {
    fetchJson(SRC.menor, {}, 45000).then(function (d) {
      if (!d || !d.ok) throw new Error();
      Object.keys(d.bySchool || {}).forEach(function (k) { var r = BY[SN.canon(k)]; if (r) r.menor = d.bySchool[k]; });
      ST.menor = 'ok'; draw();
    }).catch(function () { ST.menor = 'err'; draw(); });
  }
  function loadMatz() {
    fetchJson(SRC.matz, {}, 30000).then(function (d) {
      (d.rows || []).forEach(function (row) {
        var r = BY[SN.canon(row[1])];
        if (r) r.matz = { principal: row[0], n: Number(row[2]) || 0 };
      });
      ST.matz = 'ok'; draw();
    }).catch(function () { ST.matz = 'err'; draw(); });
  }

  /* ===== מצב לכל מקור ===== */
  function nisState(r) {
    if (ST.nispach !== 'ok') return { cls: 'na', t: ST.nispach === 'err' ? 'לא נטען' : '…', open: false };
    var x = r.nispach;
    if (!x || !x.submitted) return { cls: 'none', t: 'לא הוגש', open: true };
    if (x.missing.length) return { cls: 'gap', t: 'חסרים ' + x.missing.length, open: true };
    return { cls: 'ok', t: 'מאויש', open: false };
  }
  function matzState(r) {
    if (ST.matz !== 'ok') return { cls: 'na', t: ST.matz === 'err' ? 'לא נטען' : '…', open: false };
    if (!r.matz) return { cls: 'none', t: 'לא דיווח', open: true };
    return { cls: 'ok', t: r.matz.n + ' תלמידים', open: false };
  }
  function menorRate(r) { return r.menor && r.menor.t ? r.menor.r / r.menor.t : null; }
  function menorOpen(r) { var x = menorRate(r); return ST.menor === 'ok' && x !== null && x < MENOR_LOW; }
  function meter(r) {
    if (ST.menor !== 'ok') return '<span class="pill na">' + (ST.menor === 'err' ? 'לא נטען' : '…') + '</span>';
    if (!r.menor || !r.menor.t) return '<span class="pill na">אין מורים</span>';
    var p = Math.round(100 * r.menor.r / r.menor.t);
    var cls = p < 50 ? 'low' : (p < 80 ? 'mid' : '');
    return '<div class="meter"><div class="b"><i class="' + cls + '" style="width:' + p + '%"></i></div><span>' +
      r.menor.r + '/' + r.menor.t + '</span></div>';
  }

  /* ===== שלד הדף ===== */
  function shell() {
    var sups = {};
    SCHOOLS.forEach(function (s) { (s.sups && s.sups.length ? s.sups : [s.sup]).forEach(function (n) { if (n) sups[n] = 1; }); });
    $('main').innerHTML =
      '<section id="todo" class="todo"></section>' +
      '<div class="bar"><input id="q" type="search" placeholder="חיפוש בית ספר, רשת או סמל">' +
      '<select id="insp"><option value="">כל המפקחים</option>' +
      Object.keys(sups).sort(function (a, b) { return a.localeCompare(b, 'he'); }).map(function (n) {
        return '<option>' + esc(n) + '</option>';
      }).join('') + '</select>' +
      '<select id="stf"><option value="">כל בתי הספר</option><option value="open">יש משהו פתוח</option></select>' +
      '<span class="count" id="cnt"></span></div>' +
      '<div class="grid"><div class="gh"><div>בית הספר</div><div>מפקח.ת</div><div>נספח בעלי תפקידים</div><div>מצבת</div><div>מנור: מורים שנרשמו</div></div>' +
      '<div id="rows"></div></div>';
    $('q').oninput = drawRows;
    $('insp').onchange = drawRows;
    $('stf').onchange = drawRows;
    draw();
  }

  function draw() { drawTodo(); drawRows(); if (OPEN) openSchool(OPEN); }

  function list() { return SCHOOLS.map(function (s) { return BY[s.name]; }); }
  function supsOf(s) { return s.sups && s.sups.length ? s.sups : [s.sup]; }

  function drawRows() {
    if (!$('rows')) return;
    var q = norm($('q').value), name = $('insp').value, stf = $('stf').value;
    var rows = list().filter(function (r) {
      if (name && supsOf(r.s).indexOf(name) < 0) return false;
      if (stf === 'open' && !(nisState(r).open || matzState(r).open || menorOpen(r))) return false;
      if (q && norm(r.s.name + ' ' + r.s.network + ' ' + r.s.semel + ' ' + r.s.sup).indexOf(q) < 0) return false;
      return true;
    });
    $('cnt').textContent = rows.length + ' בתי ספר';
    $('rows').innerHTML = rows.map(function (r) {
      var n = nisState(r), m = matzState(r);
      return '<button type="button" class="gr" data-s="' + esc(r.s.name) + '">' +
        '<div><span class="nm">' + esc(r.s.name) + '</span><span class="sub">' + esc(r.s.network) + ' · ' + esc(r.s.semel) + '</span></div>' +
        '<div><span class="k">מפקח.ת</span>' + esc(supsOf(r.s).join(' · ')) + '</div>' +
        '<div><span class="k">נספח</span><span class="pill ' + n.cls + '">' + n.t + '</span></div>' +
        '<div><span class="k">מצבת</span><span class="pill ' + m.cls + '">' + m.t + '</span></div>' +
        '<div><span class="k">מנור</span>' + meter(r) + '</div></button>';
    }).join('') || '<div class="msg">לא נמצאו בתי ספר שמתאימים לסינון.</div>';
  }

  /* ===== מה דורש טיפול ===== */
  function card(id, icon, title, state, items, unitText, links) {
    if (state === 'load') {
      return '<div class="t"><h3>' + icon + esc(title) + '</h3><div class="l">טוען…</div></div>';
    }
    if (state === 'err') {
      return '<div class="t err"><h3>' + icon + esc(title) + '</h3><div class="n">המקור לא נטען כרגע</div>' +
        '<div class="l">ייתכן שזו תקלה רגעית של גוגל. רענון הדף ינסה שוב.</div></div>';
    }
    var h = '<div class="t"><h3>' + icon + esc(title) + '</h3>' +
      '<div class="n' + (items.length ? '' : ' ok') + '">' + items.length + '</div><div class="l">' + unitText + '</div>';
    if (items.length) {
      h += '<details><summary>הרשימה</summary><ul>' + items.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') +
        '</ul><button class="btn" data-copy="' + id + '" style="margin-top:8px">' + ICON.copy + 'העתקה</button></details>';
    }
    h += '<div class="src">' + links + '</div></div>';
    COPY[id] = items.join('\n');
    return h;
  }
  var COPY = {};

  function drawTodo() {
    if (!$('todo')) return;
    var L = list();
    var nisNone = [], nisGap = [], matzNone = [], menLow = [], tot = { t: 0, r: 0 };
    L.forEach(function (r) {
      var sup = ' · ' + supsOf(r.s).join(' · ');
      if (ST.nispach === 'ok') {
        if (!r.nispach || !r.nispach.submitted) nisNone.push(r.s.name + sup);
        else if (r.nispach.missing.length) nisGap.push(r.s.name + ': ' + r.nispach.missing.join(' · '));
      }
      if (ST.matz === 'ok' && !r.matz) matzNone.push(r.s.name + sup);
      if (r.menor) { tot.t += r.menor.t; tot.r += r.menor.r; }
      if (menorOpen(r)) menLow.push(r.s.name + ' — ' + r.menor.r + ' מתוך ' + r.menor.t + sup);
    });
    var a = function (href, t) { return '<a href="' + href + '" target="_blank" rel="noopener">' + t + '</a>'; };
    $('todo').innerHTML =
      card('nisNone', ICON.doc, 'נספח בעלי תפקידים · לא הגישו', ST.nispach, nisNone, 'בתי ספר מתוך 64',
        a(LINKS.nispach, 'הטופס') + ' · ' + a(LINKS.nispachTrack, 'דף המעקב')) +
      card('nisGap', ICON.users, 'נספח · תפקידים חסרים', ST.nispach, nisGap, 'בתי ספר עם תפקיד שלא אויש',
        a('../baaley-tafkidim/revital.html', 'בעלי התפקידים לפי תפקיד')) +
      card('menLow', ICON.chart, 'מנור · רישום מורים נמוך', ST.menor, menLow,
        'בתי ספר שבהם נרשמו פחות מחצי המורים' + (tot.t ? ' · סה״כ ' + tot.r + ' מתוך ' + tot.t + ' מורים' : ''),
        a(LINKS.menor, 'רישום המורים במנור')) +
      card('matzNone', ICON.doc, 'מצבת תלמידים · לא דיווחו', ST.matz, matzNone, 'בתי ספר מתוך 64',
        a(LINKS.matz, 'סיכום המצבת'));
    Array.prototype.forEach.call(document.querySelectorAll('[data-copy]'), function (b) {
      b.onclick = function () { copy(COPY[b.getAttribute('data-copy')], 'הרשימה הועתקה'); };
    });
  }

  /* ===== תיק בית ספר ===== */
  var OPEN = '';
  function tel(p) { return p ? '<a href="tel:' + esc(p.replace(/[^\d+]/g, '')) + '" dir="ltr">' + esc(p) + '</a>' : ''; }
  function mail(m) { return m ? '<a href="mailto:' + esc(m) + '" dir="ltr">' + esc(m) + '</a>' : ''; }
  function cell(cls, label, html) {
    var c = ((cls ? cls + ' ' : '') + (html ? '' : 'e')).trim();
    return '<div' + (c ? ' class="' + c + '"' : '') + '><span class="k">' + label + '</span>' + html + '</div>';
  }
  function person(p) {
    return '<div class="pr"><div class="role">' + esc(p.role) + (p.detail ? '<span class="det">' + esc(p.detail) + '</span>' : '') + '</div>' +
      '<div class="nm">' + esc(p.name) + (p.other ? '<span class="oth">גם: ' + esc(p.other) + '</span>' : '') + '</div>' +
      cell('', 'שעות', esc(p.hours)) + cell('', 'משרה', p.scope ? esc(p.scope) + '%' : '') +
      cell('', 'ותק', p.seniority ? esc(p.seniority) + ' שנים' : '') +
      cell('tel', 'נייד', tel(p.phone)) + cell('em', 'מייל', mail(p.email)) + '</div>';
  }

  function openSchool(name) {
    var r = BY[name]; if (!r) return;
    OPEN = name;
    var s = r.s;
    var h = '<div class="dh"><h2>' + esc(s.name) + '</h2><button type="button" id="dclose" aria-label="סגירה">' + ICON.x + '</button></div><div class="db">';

    h += '<div class="box"><h3>פרטי המוסד</h3><div class="facts">' +
      '<div><span>סמל מוסד</span>' + esc(s.semel) + '</div>' +
      '<div><span>רשת</span>' + esc(s.network) + '</div>' +
      '<div><span>מחוז · מגזר</span>' + esc(s.district) + ' · ' + esc(s.sector) + '</div>' +
      '<div><span>מפקח.ת פדגוגי.ת</span>' + esc(supsOf(s).join(' · ')) +
      (s.changed && s.supPrev ? '<div class="stat">בתשפ״ו: ' + esc(s.supPrev) + '</div>' : '') + '</div>' +
      (r.nispach && r.nispach.principal ? '<div><span>מנהל.ת</span>' + esc(r.nispach.principal) + '</div>' : '') +
      (r.nispach && r.nispach.classes ? '<div><span>כיתות</span>' + r.nispach.classes + '</div>' : '') +
      (r.matz ? '<div><span>תלמידים (מצבת)</span>' + r.matz.n + '</div>' : '') +
      '</div>';
    var megs = (s.megamot || []).filter(function (m) { return m.name; });
    if (megs.length) {
      h += '<h3 style="margin-top:14px">מגמות</h3><ul class="megs">' + megs.map(function (m) {
        return '<li>' + esc(m.name) + (m.grades ? ' <span class="g">· ' + esc(m.grades) + '</span>' : '') +
          (m.sups && m.sups.length ? ' <span class="g">· ' + esc(m.sups.join(', ')) + '</span>' : '') + '</li>';
      }).join('') + '</ul>';
    }
    h += '</div>';

    h += '<div class="box"><h3>מנור · רישום המורים</h3>';
    if (ST.menor !== 'ok') h += '<div class="stat">' + (ST.menor === 'err' ? 'המקור לא נטען כרגע' : 'טוען…') + '</div>';
    else if (!r.menor || !r.menor.t) h += '<div class="stat">אין מורים רשומים במנור לבית הספר הזה.</div>';
    else h += meter(r) + '<div class="stat">נרשמו <b>' + r.menor.r + '</b> מתוך <b>' + r.menor.t + '</b> · השלימו את כל הפרטים: <b>' + r.menor.d + '</b>' +
      ' · <a href="' + LINKS.menor + '" target="_blank" rel="noopener">מי לא נרשם — במנור</a></div>';
    h += '</div>';

    h += '<div class="box"><h3>נספח בעלי התפקידים</h3>';
    var x = r.nispach;
    if (ST.nispach !== 'ok') h += '<div class="stat">' + (ST.nispach === 'err' ? 'המקור לא נטען כרגע' : 'טוען…') + '</div>';
    else if (!x || !x.submitted) h += '<div class="empty">בית הספר עוד לא הגיש את הנספח.</div>';
    else {
      h += '<div class="stat">הוגש <b>' + esc(x.ts) + '</b> · בעלי תפקידים: <b>' + x.people.length + '</b>' +
        (x.six ? ' · תפקידי 6%: ' + esc(x.six) : '') + '</div>';
      if (x.missing.length) h += '<div class="missing"><span class="lbl">חסרים:</span><div class="chips">' +
        x.missing.map(function (m) { return '<span class="chip">' + esc(m) + '</span>'; }).join('') + '</div></div>';
      if (x.notes) h += '<div class="note"><b>הערות בית הספר:</b> ' + esc(x.notes) + '</div>';
      if (x.people.length) h += '<div class="ppl">' + x.people.map(person).join('') + '</div>';
    }
    h += '</div></div>';

    $('drawer').innerHTML = h;
    $('drawer').classList.add('on');
    $('scrim').classList.add('on');
    $('dclose').onclick = closeSchool;
  }
  function closeSchool() {
    OPEN = '';
    $('drawer').classList.remove('on');
    $('scrim').classList.remove('on');
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.gr[data-s]');
    if (b) { openSchool(b.getAttribute('data-s')); $('dclose').focus(); }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && OPEN) closeSchool(); });

  function whoLine() {
    var u = window.PMH_AUTH && PMH_AUTH.user();
    $('who').innerHTML = 'נכנסת בתור <b>' + esc((u && u.name) || '') + '</b> · נספח עודכן <span id="upd">…</span>' +
      ' · <button type="button" id="out">יציאה</button>';
    $('who').hidden = false;
    $('out').onclick = function () { PMH_AUTH.logout(); };
  }

  var started = false;
  function go() {
    if (started) return; started = true;
    $('scrim').onclick = closeSchool;
    whoLine(); start();
  }
  document.addEventListener('pmh:in', go);
  document.addEventListener('DOMContentLoaded', function () {
    if (document.documentElement.classList.contains('pmh-in')) go();
  });
})();
