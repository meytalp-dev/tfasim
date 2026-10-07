/* הבית של רויטל — מעטפת עם תפריט צד (כמו אדווה ומנור), 7.10.26.
   תפריט הצד: סקירה + 64 בתי הספר לפי מפקח.ת. כל בית ספר = עמוד אחד עם כל מה שיש עליו.
   מקורות (כל אחד נטען ונכשל בנפרד, שמות עוברים SchoolNames.canon):
     data/mosdot.json            — 64 בתי הספר, רשת, מחוז, מגזר, מפקח.ת, מגמות (ציבורי, בלי פרטי קשר)
     admin-contacts (שער)         — מנהלים ומפקחים עם טלפון ומייל (מוגן, מרחב all/mosdot)
     נספח mode:view (טוקן)        — בעלי התפקידים עם פרטים ומה חסר
     מנור registration.count      — מספרי רישום המורים לבית ספר
     מצבת ?mode=list              — מספר תלמידים
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
  var MENOR_LINK = 'https://pedagogiamh.co.il/hadrachot/ministry/rishum-morim.html';
  var MENOR_VIEW = 'https://pedagogiamh.co.il/hadrachot/ministry/';   /* "מבט ארצי" — רויטל = ministry במנור */
  /* הבית של המפקח — ביקורים, דוחות, משימות ומסמכים. רויטל = "מטה" בלשונית מפקחים שם, ורואה את כל המפקחים */
  var MEF_EXEC = GAS + 'AKfycbxyhvbkVUtydT70TH5Q2fYXu-MpFfAv0qxX7K-RzsSvt7UWXoxwjHun1zwK6MJQj6_K/exec';
  var MENOR_LOW = 0.5;

  var I = {
    home:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></svg>',
    car:   '<svg class="car" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.6"/><path d="M16 14.2c2.9.4 5 2.8 5 5.8"/></svg>',
    book:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19V5M4 19h16M8 16V9M13 16V6M18 16v-4"/></svg>',
    doc:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3 7-7"/><rect x="3" y="4" width="18" height="16" rx="3"/></svg>',
    ext:   '<svg class="ext" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M20 4l-9 9"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></svg>',
    mail:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
    copy:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>'
  };

  var $ = function (id) { return document.getElementById(id); };
  var SN = window.SchoolNames || { canon: function (n) { return n; } };
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function norm(s) { return String(s || '').replace(/[״"׳'\-–—·.,()/]/g, ' ').replace(/\s+/g, ' ').trim(); }

  /* ===== רשת ===== */
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
  var SCHOOLS = [], BY = {}, BYSEMEL = {}, CONTACTS = [];
  var ST = { contacts: 'load', nispach: 'load', menor: 'load', matz: 'load' };
  var CUR = '';     /* '' = סקירה · 's:<סמל>' = בית ספר · 'r:<תפקיד>' = לפי תפקיד */
  var CORE = [];
  var MEF = {};     /* סמל → {st:'load'|'ok'|'err'|'noaccess', d} */
  var OPENSEC = { head: true };   /* אילו מקטעים פתוחים — נשמר בין בתי ספר */

  function supsOf(s) { return s.sups && s.sups.length ? s.sups : [s.sup]; }

  /* ===== טלפון: הגיליון מוריד אפס מוביל (0508711450 → 508711450) ===== */
  function phoneOf(v) {
    var s = String(v || '').replace(/[^\d+]/g, '');
    if (s.indexOf('+972') === 0) s = '0' + s.slice(4);
    if (/^5\d{8}$/.test(s) || /^[2-9]\d{7}$/.test(s)) s = '0' + s;
    if (/^05\d{8}$/.test(s)) return s.slice(0, 3) + '-' + s.slice(3);
    if (/^0[2-9]\d{7}$/.test(s)) return s.slice(0, 2) + '-' + s.slice(2);
    return s;
  }
  function telA(p) { p = phoneOf(p); return p ? '<a href="tel:' + esc(p.replace(/[^\d+]/g, '')) + '" dir="ltr">' + esc(p) + '</a>' : ''; }
  /* תא מייל יכול להכיל כמה כתובות (ארגוני + פרטי), מופרדות בפסיק */
  function mailA(m) {
    return String(m || '').split(/[\s,;]+/).filter(function (x) { return x.indexOf('@') > 0; }).map(function (x) {
      return '<a href="mailto:' + esc(x) + '" dir="ltr">' + esc(x) + '</a>';
    }).join(' ');
  }
  /* כל המיילים של איש קשר: עמודת "מייל" + עמודת "מייל נוסף" (אם נוספה בגיליון) */
  function cMail(c) { return c ? [c['מייל'], c['מייל נוסף']].filter(Boolean).join(', ') : ''; }
  function initials(n) { var p = String(n || '').trim().split(/\s+/); return esc((p[0] || '').charAt(0) + (p[1] || '').charAt(0)); }

  function toast(t) {
    var el = $('toast');
    el.textContent = t; el.classList.add('on');
    clearTimeout(el._t); el._t = setTimeout(function () { el.classList.remove('on'); }, 1800);
  }
  function copy(text) {
    var ok = function () { toast('הועתק'); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(ok, function () { fb(); ok(); });
    else { fb(); ok(); }
    function fb() {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
    }
  }

  /* ===== טעינה ===== */
  function start() {
    $('main').innerHTML = '<div class="loading">טוען את בתי הספר…</div>';
    fetchJson(SRC.mosdot, {}, 20000).then(function (m) {
      SCHOOLS = m.schools || [];
      SCHOOLS.forEach(function (s) {
        var r = { s: s, nispach: null, menor: null, matz: null };
        BY[s.name] = r; BYSEMEL[String(s.semel)] = r;
      });
      CUR = fromHash();
      side(); render();
      loadContacts(); loadNispach(); loadMenor(); loadMatz();
    }).catch(function () {
      $('main').innerHTML = '<div class="card"><b>לא הצלחתי לטעון את רשימת בתי הספר.</b> <button class="btn" id="retry">לנסות שוב</button></div>';
      $('retry').onclick = start;
    });
  }
  function loaded(k, ok) { ST[k] = ok ? 'ok' : 'err'; side(); render(); }

  function loadContacts() {
    if (!window.PMH_AUTH || !PMH_AUTH.load) return loaded('contacts', false);
    PMH_AUTH.load('admin-contacts').then(function (r) {
      if (r && r.ok && Array.isArray(r.data)) { CONTACTS = r.data; loaded('contacts', true); }
      else loaded('contacts', false);
    }, function () { loaded('contacts', false); });
  }
  function loadNispach() {
    fetchJson(SRC.nispach, {
      method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ mode: 'view', token: token() })
    }, 45000).then(function (d) {
      if (!d || !d.ok) {
        if (d && d.error === 'badsession' && window.PMH_AUTH) { PMH_AUTH.logout(); return; }
        throw new Error();
      }
      CORE = d.core || [];
      d.schools.forEach(function (x) { var r = BY[SN.canon(x.school)]; if (r) r.nispach = x; });
      loaded('nispach', true);
    }).catch(function () { loaded('nispach', false); });
  }
  function loadMenor() {
    fetchJson(SRC.menor, {}, 45000).then(function (d) {
      if (!d || !d.ok) throw new Error();
      Object.keys(d.bySchool || {}).forEach(function (k) { var r = BY[SN.canon(k)]; if (r) r.menor = d.bySchool[k]; });
      loaded('menor', true);
    }).catch(function () { loaded('menor', false); });
  }
  function loadMatz() {
    fetchJson(SRC.matz, {}, 30000).then(function (d) {
      (d.rows || []).forEach(function (row) {
        var r = BY[SN.canon(row[1])];
        if (r) r.matz = { principal: row[0], n: Number(row[2]) || 0 };
      });
      loaded('matz', true);
    }).catch(function () { loaded('matz', false); });
  }

  /* ===== מה פתוח בבית ספר ===== */
  function rate(r) { return r.menor && r.menor.t ? r.menor.r / r.menor.t : null; }
  function issues(r) {
    var out = [];
    if (ST.nispach === 'ok') {
      if (!r.nispach || !r.nispach.submitted) out.push('נספח לא הוגש');
      else if (r.nispach.missing.length) out.push(r.nispach.missing.length + ' תפקידים חסרים');
    }
    var x = rate(r);
    if (ST.menor === 'ok' && x !== null && x < MENOR_LOW) out.push('רישום נמוך במנור');
    if (ST.matz === 'ok' && !r.matz) out.push('לא דיווח מצבת');
    return out;
  }
  function allLoaded() { return ST.nispach !== 'load' && ST.menor !== 'load' && ST.matz !== 'load'; }

  /* ===== ניתוב ===== */
  function fromHash() {
    var h = decodeURIComponent(String(location.hash || '').slice(1));
    var m = h.match(/^s=(\d+)$/);
    if (m && BYSEMEL[m[1]]) return 's:' + m[1];
    m = h.match(/^r=(.+)$/);
    if (m) return 'r:' + m[1];
    m = h.match(/^p=(.+)$/);
    if (m) return 'p:' + m[1];
    return '';
  }
  function go(to) {
    CUR = to || '';
    var hash = CUR ? '#' + CUR.charAt(0) + '=' + encodeURIComponent(CUR.slice(2)) : '';
    try { history.replaceState(null, '', hash || location.pathname); } catch (e) {}
    document.body.classList.remove('nav-on');
    side(); render();
    window.scrollTo(0, 0);
  }

  /* ===== תפריט הצד ===== */
  var OPENGRP = {};
  function roleList() {
    var count = {};
    SCHOOLS.forEach(function (s) {
      var x = BY[s.name].nispach;
      if (x && x.people) x.people.forEach(function (p) { count[p.role] = (count[p.role] || 0) + 1; });
    });
    var rest = Object.keys(count).filter(function (r) { return CORE.indexOf(r) < 0; })
      .sort(function (a, b) { return count[b] - count[a]; });
    return { list: CORE.concat(rest), count: count };
  }
  function shortRole(r) { return String(r).split(' — ')[0]; }

  function grpHtml(key, title, n, open, inner) {
    return '<li class="grp' + (open ? ' open' : '') + '"><button type="button" data-grp="' + esc(key) + '">' + title +
      '<span class="n">' + n + '</span>' + I.car + '</button><ul class="sl">' + inner + '</ul></li>';
  }
  function side() {
    var q = norm($('find').value);
    var cur = CUR.charAt(0) === 's' ? BYSEMEL[CUR.slice(2)].s : null;
    var h = '<li><button type="button" class="home" data-go=""' + (CUR ? '' : ' aria-current="true"') + '>' + I.home + 'סקירה</button></li>';
    h += '<li><a class="home" href="' + MENOR_VIEW + '" target="_blank" rel="noopener">' + I.chart + 'המבט שלי במנור' + I.ext + '</a></li>';

    /* לפי תפקיד */
    if (!q && ST.nispach === 'ok') {
      var ro = roleList();
      h += grpHtml('__roles', I.users + 'לפי תפקיד', ro.list.length, OPENGRP.__roles || CUR.charAt(0) === 'r',
        ro.list.map(function (r) {
          return '<li><button type="button" data-go="r:' + esc(r) + '"' + (CUR === 'r:' + r ? ' aria-current="true"' : '') + '>' +
            esc(shortRole(r)) + '<small class="c">' + (ro.count[r] || 0) + '</small></button></li>';
        }).join(''));
    }

    /* בתי הספר לפי מפקח.ת */
    h += '<li class="sep">בתי הספר לפי מפקח.ת</li>';
    var groups = {};
    SCHOOLS.forEach(function (s) { supsOf(s).forEach(function (n) { (groups[n] = groups[n] || []).push(s); }); });
    Object.keys(groups).sort(function (a, b) { return a.localeCompare(b, 'he'); }).forEach(function (n) {
      var list = groups[n].filter(function (s) { return !q || norm(s.name + ' ' + s.semel + ' ' + s.network).indexOf(q) > -1; });
      if (q && !list.length) return;
      var open = q || OPENGRP[n] || (cur && supsOf(cur).indexOf(n) > -1);
      h += grpHtml(n, esc(n), list.length, open || CUR === 'p:' + n,
        (q ? '' : '<li><button type="button" class="supl" data-go="p:' + esc(n) + '"' + (CUR === 'p:' + n ? ' aria-current="true"' : '') + '>' +
          I.mail + 'מצב ושליחה למפקח.ת</button></li>') + list.map(function (s) {
        var r = BY[s.name], dot = allLoaded() ? (issues(r).length ? 'bad' : 'ok') : '';
        return '<li><button type="button" data-go="s:' + esc(s.semel) + '"' + (CUR === 's:' + s.semel ? ' aria-current="true"' : '') +
          '><i class="dot ' + dot + '"></i>' + esc(s.name) + '</button></li>';
      }).join(''));
    });
    $('nav').innerHTML = h;
  }

  /* ===== מקטע מקופל ===== */
  function sec(key, icon, title, summary, body) {
    return '<details class="card sec" data-k="' + key + '"' + (OPENSEC[key] ? ' open' : '') + '><summary>' +
      '<span class="st">' + icon + esc(title) + '</span><span class="sum">' + summary + '</span>' + I.car + '</summary>' +
      '<div class="sb">' + body + '</div></details>';
  }
  function pending(k) { return ST[k] === 'load' ? '<div class="empty">טוען…</div>' : '<div class="empty">המקור לא נטען כרגע. רענון הדף ינסה שוב.</div>'; }
  function tag(cls, t) { return '<span class="chip ' + cls + '">' + esc(t) + '</span>'; }

  /* ===== עמוד ראשי ===== */
  function render() {
    if (CUR.charAt(0) === 's') school(BYSEMEL[CUR.slice(2)]);
    else if (CUR.charAt(0) === 'r') rolePage(CUR.slice(2));
    else if (CUR.charAt(0) === 'p') supPage(CUR.slice(2));
    else overview();
  }

  /* ----- סקירה ----- */
  var LISTS = {};
  function overview() {
    var nisNone = [], nisGap = [], low = [], matzNone = [];
    SCHOOLS.forEach(function (s) {
      var r = BY[s.name];
      if (ST.nispach === 'ok') {
        if (!r.nispach || !r.nispach.submitted) nisNone.push([s, 'לא הוגש']);
        else if (r.nispach.missing.length) nisGap.push([s, r.nispach.missing.length + ' חסרים']);
      }
      var x = rate(r);
      if (ST.menor === 'ok' && x !== null && x < MENOR_LOW) low.push([s, r.menor.r + ' מתוך ' + r.menor.t]);
      if (ST.matz === 'ok' && !r.matz) matzNone.push([s, '']);
    });
    nisGap.sort(function (a, b) { return parseInt(b[1], 10) - parseInt(a[1], 10); });
    low.sort(function (a, b) { return rate(BY[a[0].name]) - rate(BY[b[0].name]); });
    LISTS = {};
    function box(id, title, st, items) {
      if (st !== 'ok') return sec('ov-' + id, I.chart, title, st === 'load' ? 'טוען…' : 'לא נטען', pending(st === 'load' ? 'nispach' : 'x'));
      LISTS[id] = items.map(function (x) { return x[0].name + (x[1] ? ' — ' + x[1] : ''); }).join('\n');
      var body = items.length
        ? '<div class="row-end"><button class="btn" data-copy="' + id + '">' + I.copy + 'העתקת הרשימה</button></div><ul class="list">' +
          items.map(function (x) {
            return '<li><button type="button" data-go="s:' + esc(x[0].semel) + '">' + esc(x[0].name) + '<span>' + esc(x[1]) + '</span></button></li>';
          }).join('') + '</ul>'
        : '<div class="empty">אין. הכול תקין.</div>';
      return sec('ov-' + id, I.chart, title, items.length ? tag('', items.length + ' בתי ספר') : tag('ok', 'תקין'), body);
    }
    $('main').innerHTML =
      '<div class="card head"><h1>סקירה</h1><div class="meta">64 בתי ספר. בחרי בית ספר או תפקיד בתפריט.</div></div>' +
      box('a', 'נספח בעלי תפקידים · לא הגישו', ST.nispach, nisNone) +
      box('b', 'נספח · תפקידים חסרים', ST.nispach, nisGap) +
      box('c', 'מנור · נרשמו פחות מחצי המורים', ST.menor, low) +
      box('d', 'מצבת תלמידים · לא דיווחו', ST.matz, matzNone);
  }

  /* ----- אנשים ----- */
  function contactsFor(s) {
    return CONTACTS.filter(function (c) { return String(c['סמל מוסד'] || '').trim() === String(s.semel); });
  }
  function contactByName(n) {
    var k = norm(n);
    for (var i = 0; i < CONTACTS.length; i++) if (norm(CONTACTS[i]['שם']) === k) return CONTACTS[i];
    return null;
  }
  function personHtml(role, name, phone, email, extra) {
    var links = [telA(phone), mailA(email)].filter(Boolean).join('');
    return '<div class="person"><div class="av">' + initials(name) + '</div><div class="tx">' +
      '<div class="r">' + esc(role) + '</div><div class="nm">' + esc(name) + '</div>' +
      (links ? '<div class="lk">' + links + '</div>' : '') + (extra ? '<div class="x">' + extra + '</div>' : '') + '</div></div>';
  }
  function holderExtra(q) {
    return [q.hours ? q.hours + ' ש״ש' : '', q.scope ? 'משרה ' + q.scope + '%' : '', q.seniority ? 'ותק ' + q.seniority : '', q.other ? 'גם: ' + q.other : '']
      .filter(Boolean).map(esc).join(' · ');
  }

  /* ----- הבית של המפקח ----- */
  function loadMef(semel) {
    if (MEF[semel] && MEF[semel].st !== 'err') return;
    MEF[semel] = { st: 'load' };
    fetchJson(MEF_EXEC, {
      method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'school.get', token: token(), id: semel })
    }, 30000, 2).then(function (d) {
      if (d && d.ok) MEF[semel] = { st: 'ok', d: d };
      else MEF[semel] = { st: d && (d.error === 'notregistered' || d.error === 'unauthorized') ? 'noaccess' : 'err' };
      if (CUR === 's:' + semel) render();
    }).catch(function () { MEF[semel] = { st: 'err' }; if (CUR === 's:' + semel) render(); });
  }
  function fmtDate(iso) {
    var m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? (+m[3]) + '.' + (+m[2]) + '.' + m[1] : esc(iso);
  }

  /* ----- עמוד בית ספר ----- */
  function school(r) {
    var s = r.s, x = r.nispach, h = '';
    var principal = (x && x.principal) || (r.matz && r.matz.principal) || '';
    var cs = ST.contacts === 'ok' ? contactsFor(s) : [];
    var office = cs.map(function (c) { return c['טלפון מוסד']; }).filter(Boolean)[0];
    var p = rate(r);
    loadMef(String(s.semel));

    /* כותרת — תמיד פתוחה */
    h += '<div class="card head"><h1>' + esc(s.name) + '</h1><div class="meta">' +
      esc(s.network) + ' · סמל <b>' + esc(s.semel) + '</b> · ' + esc(s.district) + ' · ' + esc(s.sector) +
      (office ? ' · טלפון בית הספר ' + telA(office) : '') + '</div>' +
      '<div class="facts">' +
      '<div class="fact"><span>תלמידים</span><b>' + (r.matz ? r.matz.n : (ST.matz === 'ok' ? '—' : '…')) + '</b></div>' +
      '<div class="fact"><span>כיתות</span><b>' + (x && x.classes ? x.classes : (ST.nispach === 'ok' ? '—' : '…')) + '</b></div>' +
      '<div class="fact"><span>בעלי תפקידים</span><b>' + (x && x.submitted ? x.people.length : (ST.nispach === 'ok' ? '—' : '…')) + '</b></div>' +
      '<div class="fact"><span>מורים שנרשמו למנור</span><b class="' + (p === null ? '' : (p < MENOR_LOW ? 'bad' : 'ok')) + '">' +
        (r.menor && r.menor.t ? r.menor.r + '/' + r.menor.t : (ST.menor === 'ok' ? '—' : '…')) + '</b></div>' +
      '</div></div>';

    /* אנשי קשר */
    var cBody = '', cSum = '';
    if (ST.contacts !== 'ok') { cBody = pending('contacts'); cSum = ST.contacts === 'load' ? 'טוען…' : 'לא נטען'; }
    else {
      var pr = cs[0];
      cSum = esc(pr ? pr['שם'] : principal) + (pr && pr['טלפון'] ? ' · ' + esc(phoneOf(pr['טלפון'])) : '');
      if (cs.length) cBody += cs.map(function (c) { return personHtml(c['תפקיד'] || 'מנהל.ת', c['שם'], c['טלפון'] || c['e164'], cMail(c)); }).join('');
      else if (principal) cBody += personHtml('מנהל.ת', principal, '', '', 'אין פרטי קשר בגיליון אנשי הקשר');
      else cBody += '<div class="empty">אין רשומת מנהל.ת לבית הספר הזה.</div>';
      supsOf(s).forEach(function (n) {
        var c = contactByName(n);
        cBody += personHtml('מפקח.ת פדגוגי.ת', n, c && (c['טלפון'] || c['e164']), cMail(c),
          s.changed && s.supPrev ? 'בתשפ״ו: ' + esc(s.supPrev) : '');
      });
    }
    h += sec('contacts', I.phone, 'אנשי קשר', cSum, cBody);

    /* מגמות */
    var megs = (s.megamot || []).filter(function (m) { return m.name; });
    h += sec('megamot', I.book, 'מגמות', megs.length + ' מגמות',
      megs.length ? '<ul class="megs">' + megs.map(function (m) {
        var sub = [m.grades ? 'שכבות ' + m.grades : '', m.sups && m.sups.length ? 'מפקח.ת מקצועי.ת: ' + m.sups.join(', ') : ''].filter(Boolean).join(' · ');
        return '<li>' + esc(m.name) + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</li>';
      }).join('') + '</ul>' : '<div class="empty">אין מגמות רשומות בפריסה.</div>');

    /* בעלי תפקידים */
    var rBody = '', rSum = '';
    if (ST.nispach !== 'ok') { rBody = pending('nispach'); rSum = ST.nispach === 'load' ? 'טוען…' : 'לא נטען'; }
    else if (!x || !x.submitted) { rSum = tag('warn', 'הנספח לא הוגש'); rBody = '<div class="empty">בית הספר עוד לא הגיש את נספח בעלי התפקידים.</div>'; }
    else {
      rSum = x.people.length + ' · ' + (x.missing.length ? tag('', x.missing.length === 1 ? 'חסר תפקיד אחד' : x.missing.length + ' תפקידים חסרים') : tag('ok', 'מאויש'));
      rBody += '<div class="small" style="margin:0 0 10px">הנספח הוגש ' + esc(x.ts) + (x.six ? ' · תפקידי 6%: ' + esc(x.six) : '') + '</div>';
      if (x.missing.length) rBody += '<div class="miss">' + x.missing.map(function (m) { return tag('', 'חסר: ' + m); }).join('') + '</div>';
      if (x.notes) rBody += '<div class="note"><b>הערות בית הספר:</b> ' + esc(x.notes) + '</div>';
      rBody += x.people.map(function (q) {
        return personHtml(shortRole(q.role) + (q.detail ? ' · ' + q.detail : ''), q.name, q.phone, q.email, holderExtra(q));
      }).join('');
    }
    h += sec('roles', I.users, 'בעלי תפקידים', rSum, rBody);

    /* מנור */
    var mBody = '', mSum = '';
    if (ST.menor !== 'ok') { mBody = pending('menor'); mSum = ST.menor === 'load' ? 'טוען…' : 'לא נטען'; }
    else if (!r.menor || !r.menor.t) { mSum = 'אין מורים'; mBody = '<div class="empty">אין מורים רשומים במנור לבית הספר הזה.</div>'; }
    else {
      var pc = Math.round(100 * r.menor.r / r.menor.t);
      mSum = r.menor.r + ' מתוך ' + r.menor.t + ' · ' + (pc < 50 ? tag('', pc + '%') : tag('ok', pc + '%'));
      mBody = '<div class="meter"><div class="b"><i class="' + (pc < 50 ? 'low' : (pc < 80 ? 'mid' : '')) + '" style="width:' + pc + '%"></i></div><span>' + pc + '%</span></div>' +
        '<div class="small">נרשמו <b>' + r.menor.r + '</b> מתוך <b>' + r.menor.t + '</b> מורים · השלימו את כל הפרטים: <b>' + r.menor.d + '</b>' +
        ' · <a href="' + MENOR_LINK + '" target="_blank" rel="noopener">מי לא נרשם (במנור)</a></div>';
    }
    h += sec('menor', I.chart, 'מנור · רישום המורים', mSum, mBody);

    /* הבית של המפקח: ביקורים ודוחות, משימות, מסמכים */
    var mf = MEF[String(s.semel)] || { st: 'load' };
    var vBody = '', vSum = '', tBody = '', tSum = '';
    if (mf.st !== 'ok') {
      var msg = mf.st === 'load' ? 'טוען…' : (mf.st === 'noaccess'
        ? 'החשבון הזה לא רשום כ"מטה" בבית של המפקח. מיטל מוסיפה אותו בלשונית "מפקחים".'
        : 'המקור לא נטען כרגע. רענון הדף ינסה שוב.');
      vBody = tBody = '<div class="empty">' + msg + '</div>';
      vSum = tSum = mf.st === 'load' ? 'טוען…' : 'לא נטען';
    } else {
      var d = mf.d, vis = d.visits || [], tasks = d.tasks || [], docs = (d.docs || []).filter(function (z) { return !z.superseded; });
      var waiting = vis.filter(function (v) { return v.status !== 'open' && !v.hasReport; }).length;
      vSum = vis.length ? (vis.length === 1 ? 'ביקור אחד' : vis.length + ' ביקורים') + (waiting ? ' · ' + tag('warn', waiting === 1 ? 'דוח אחד ממתין' : waiting + ' דוחות ממתינים') : '') : 'אין ביקורים';
      vBody = vis.length ? '<ul class="list">' + vis.map(function (v) {
        var st = v.status === 'open' ? tag('', 'ביקור פתוח') : (v.hasReport ? tag('ok', 'דוח מאושר') : tag('warn', 'דוח ממתין'));
        var href = v.hasReport && v.reportId ? '../mefakeach/report.html?id=' + encodeURIComponent(v.reportId) : '../mefakeach/visit.html?id=' + encodeURIComponent(v.id);
        return '<li><a class="li" href="' + href + '" target="_blank" rel="noopener"><b>' + fmtDate(v.date) + '</b>' +
          (v.purpose ? ' · ' + esc(v.purpose) : '') + '<span>' + st + '</span></a></li>';
      }).join('') + '</ul>' : '<div class="empty">המפקח.ת עוד לא תיעד.ה ביקור בבית הספר הזה.</div>';
      vBody += '<div class="small">' + docs.length + ' מסמכים בתיק · <a href="../mefakeach/schools.html" data-mefpick="' + esc(s.semel) + '" target="_blank" rel="noopener">לתיק בבית של המפקח</a></div>';
      var open = tasks.filter(function (t) { return t.status !== 'done'; });
      var late = open.filter(function (t) { return t.late; }).length;
      tSum = open.length ? (open.length === 1 ? 'משימה פתוחה אחת' : open.length + ' משימות פתוחות') + (late ? ' · ' + tag('', late === 1 ? 'אחת באיחור' : late + ' באיחור') : '') : 'אין משימות פתוחות';
      tBody = open.length ? '<ul class="list">' + open.map(function (t) {
        return '<li><span class="li"><b>' + esc(t.title) + '</b>' + (t.owner_role ? ' · ' + esc(t.owner_role) : '') +
          '<span>' + (t.due ? tag(t.late ? '' : 'warn', 'עד ' + fmtDate(t.due)) : '') + '</span></span></li>';
      }).join('') + '</ul>' : '<div class="empty">אין משימות פתוחות לבית הספר הזה.</div>';
    }
    h += sec('visits', I.doc, 'ביקורי פיקוח ודוחות', vSum, vBody);
    h += sec('tasks', I.check, 'משימות', tSum, tBody);

    $('main').innerHTML = h;
  }

  /* ----- לפי תפקיד ----- */
  var ROLEVIEW = 'all';   /* all = רשימה אחת · sup = לפי מפקח.ת */
  try { ROLEVIEW = localStorage.getItem('revital.roleview') === 'sup' ? 'sup' : 'all'; } catch (e) {}
  /* ===== מייל =====
     נייד = <a href="mailto:"> אמיתי שנבנה בזמן הציור; מחשב = טיוטת Gmail בחלון חדש.
     גוף ארוך במחשב: HTML מימין לשמאל מועתק ללוח לפני פתיחת החלון, ומדביקים ב-Ctrl+V (ראו /mail-button).
     לרשימות תפקיד הנמענים בעותק מוסתר — רכזים לא רואים זה את זה. */
  var IS_MOBILE = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
    (window.matchMedia && matchMedia('(pointer:coarse)').matches && innerWidth < 900);
  var MAILS = {};
  function cleanMails(list) {
    var seen = {}, out = [];
    list.forEach(function (raw) {
      String(raw || '').split(/[\s,;]+/).forEach(function (m) {
        m = m.trim();
        if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(m) && !seen[m.toLowerCase()]) { seen[m.toLowerCase()] = 1; out.push(m); }
      });
    });
    return out;
  }
  function mailsOf(rows) { return cleanMails(rows.map(function (z) { return z[1].email; })); }
  /* M = {to:[], bcc:[], subject, text, html} */
  function mailHref(M) {
    var q = [];
    if (M.bcc && M.bcc.length) q.push('bcc=' + M.bcc.map(encodeURIComponent).join(','));
    q.push('subject=' + encodeURIComponent(M.subject || ''));
    if (M.text) q.push('body=' + encodeURIComponent(M.text));
    return 'mailto:' + (M.to || []).map(encodeURIComponent).join(',') + '?' + q.join('&');
  }
  function mailBtn(id, M, label) {
    MAILS[id] = M;
    if (!(M.to && M.to.length) && !(M.bcc && M.bcc.length)) return '';
    var n = (M.to || []).length + (M.bcc || []).length;
    /* במחשב שני מסלולים: Gmail (ראשי) ותוכנת המייל — Outlook (mailto, גוף קצר) */
    return '<a class="btn primary" data-mail="' + id + '" href="' + esc(mailHref(M)) + '">' + I.mail + esc(label || ('מייל ל-' + n)) +
      (IS_MOBILE ? '' : ' · Gmail') + '</a>' +
      (IS_MOBILE ? '' : '<a class="btn" href="' + esc(mailHref(M)) + '">' + I.mail + 'בתוכנת המייל (Outlook)</a>');
  }
  function copyHtml(html, text) {
    var ok = false, div = document.createElement('div');
    div.contentEditable = 'true';
    div.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
    div.innerHTML = html;
    document.body.appendChild(div);
    try {
      var r = document.createRange(); r.selectNodeContents(div);
      var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
      ok = document.execCommand('copy');
      sel.removeAllRanges();
    } catch (e) { ok = false; }
    document.body.removeChild(div);
    if (!ok) { try { fallbackText(text); ok = true; } catch (e2) {} }
    return ok;
  }
  function fallbackText(text) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
  function openDraft(M) {
    var url = 'https://mail.google.com/mail/?view=cm&fs=1' +
      (M.to && M.to.length ? '&to=' + encodeURIComponent(M.to.join(',')) : '') +
      (M.bcc && M.bcc.length ? '&bcc=' + encodeURIComponent(M.bcc.join(',')) : '') +
      '&su=' + encodeURIComponent(M.subject || '');
    if (M.html) {
      var copied = copyHtml(M.html, M.text || '');
      if (!copied) url += '&body=' + encodeURIComponent(M.text || '');
      window.open(url, '_blank', 'noopener');
      toast(copied ? 'התוכן הועתק. לחצי בגוף המייל ו-Ctrl+V' : 'נפתחה טיוטה');
    } else {
      window.open(url, '_blank', 'noopener');
    }
  }

  /* ----- לפי תפקיד ----- */
  var ROLEQ = '', ROLESUP = '';
  function roleRows(role) {
    var rows = [], missing = [];
    SCHOOLS.forEach(function (s) {
      var x = BY[s.name].nispach;
      if (!x || !x.submitted) { missing.push([s, 'לא הוגש נספח']); return; }
      x.people.forEach(function (p) { if (p.role === role) rows.push([s, p]); });
      x.missing.forEach(function (m) {
        if (m === role) missing.push([s, 'טרם אויש']);
        else if (m.indexOf(role + ' — ') === 0) missing.push([s, m.slice(role.length + 3) + ' — טרם אויש']);
      });
    });
    rows.sort(function (a, b) { return a[0].name.localeCompare(b[0].name, 'he'); });
    return { rows: rows, missing: missing };
  }
  function supNames() {
    var sups = {};
    SCHOOLS.forEach(function (s) { supsOf(s).forEach(function (n) { sups[n] = 1; }); });
    return Object.keys(sups).sort(function (a, b) { return a.localeCompare(b, 'he'); });
  }
  function rolePage(role) {
    if (ST.nispach !== 'ok') { $('main').innerHTML = '<div class="card head"><h1>' + esc(shortRole(role)) + '</h1>' + pending('nispach') + '</div>'; return; }
    var box = $('roleBox');
    if (!box || box.getAttribute('data-role') !== role) {
      ROLEQ = ''; ROLESUP = '';
      $('main').innerHTML = '<div class="card head" id="roleBox" data-role="' + esc(role) + '"><h1>' + esc(role) + '</h1>' +
        '<div class="meta" id="roleMeta"></div>' +
        '<div class="filters"><input id="rq" type="search" placeholder="חיפוש שם, בית ספר או פירוט">' +
        '<select id="rsup"><option value="">כל המפקחים</option>' +
        supNames().map(function (n) { return '<option>' + esc(n) + '</option>'; }).join('') + '</select></div>' +
        '<div class="views"><div class="seg" role="group" aria-label="תצוגה">' +
        '<button type="button" data-rview="all" aria-pressed="' + (ROLEVIEW === 'all') + '">רשימה אחת</button>' +
        '<button type="button" data-rview="sup" aria-pressed="' + (ROLEVIEW === 'sup') + '">לפי מפקח.ת</button></div>' +
        '<div class="acts" id="roleActs"></div></div></div><div id="roleList"></div>';
      $('rq').oninput = function () { ROLEQ = this.value; drawRole(role); };
      $('rsup').onchange = function () { ROLESUP = this.value; drawRole(role); };
    } else {
      Array.prototype.forEach.call(document.querySelectorAll('[data-rview]'), function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-rview') === ROLEVIEW);
      });
    }
    drawRole(role);
  }
  function drawRole(role) {
    var R = roleRows(role), q = norm(ROLEQ);
    var rows = R.rows.filter(function (z) {
      if (ROLESUP && supsOf(z[0]).indexOf(ROLESUP) < 0) return false;
      return !q || norm(z[0].name + ' ' + z[1].name + ' ' + z[1].detail + ' ' + z[0].network).indexOf(q) > -1;
    });
    var missing = R.missing.filter(function (z) { return !ROLESUP || supsOf(z[0]).indexOf(ROLESUP) > -1; });
    $('roleMeta').textContent = (rows.length !== R.rows.length ? rows.length + ' מתוך ' + R.rows.length : R.rows.length) +
      ' בעלי תפקידים' + (missing.length ? ' · חסר ב-' + missing.length + ' בתי ספר' : '');
    LISTS.role = ['בית ספר', 'מפקח.ת', 'פירוט', 'שם', 'נייד', 'מייל', 'שעות', 'משרה', 'ותק'].join('\t') + '\n' +
      rows.map(function (z) {
        var p = z[1];
        return [z[0].name, supsOf(z[0]).join(' · '), p.detail, p.name, p.phone, p.email, p.hours, p.scope, p.seniority].join('\t');
      }).join('\n');
    LISTS.roleMiss = missing.map(function (z) { return z[0].name + ' — ' + z[1]; }).join('\n');
    MAILS = {};
    var subj = shortRole(role);
    var all = mailsOf(rows);
    LISTS.roleMails = all.join(', ');
    $('roleActs').innerHTML = mailBtn('all', { bcc: all, subject: subj }) +
      (all.length ? '<button class="btn" data-copy="roleMails">' + I.copy + 'העתקת הכתובות</button>' : '') +
      '<button class="btn" data-copy="role">' + I.copy + 'העתקה לאקסל</button>';

    var h = '';
    if (!rows.length) h += '<div class="card"><div class="empty">אין בעלי תפקידים שמתאימים לחיפוש.</div></div>';
    else if (ROLEVIEW === 'all') {
      h += '<div class="card">' + rows.map(function (z) {
        var p = z[1];
        return personHtml(z[0].name + (p.detail ? ' · ' + p.detail : '') + ' · ' + supsOf(z[0]).join(' · '), p.name, p.phone, p.email, holderExtra(p));
      }).join('') + '</div>';
    } else {
      var bySup = {};
      rows.forEach(function (z) { supsOf(z[0]).forEach(function (n) { if (!ROLESUP || n === ROLESUP) (bySup[n] = bySup[n] || []).push(z); }); });
      Object.keys(bySup).sort(function (a, b) { return a.localeCompare(b, 'he'); }).forEach(function (n, k) {
        var list = bySup[n];
        h += sec('role-' + n, I.users, n, list.length + ' בעלי תפקידים',
          '<div class="acts row-end">' + mailBtn('s' + k, { bcc: mailsOf(list), subject: subj }) + '</div>' +
          list.map(function (z) {
            var p = z[1];
            return personHtml(z[0].name + (p.detail ? ' · ' + p.detail : ''), p.name, p.phone, p.email, holderExtra(p));
          }).join(''));
      });
    }
    if (missing.length) {
      h += sec('role-miss', I.chart, 'בתי ספר שבהם התפקיד חסר', tag('', missing.length + ' בתי ספר'),
        '<div class="row-end"><button class="btn" data-copy="roleMiss">' + I.copy + 'העתקה</button></div><ul class="list">' +
        missing.map(function (z) {
          return '<li><button type="button" data-go="s:' + esc(z[0].semel) + '">' + esc(z[0].name) + '<span>' + esc(z[1]) + '</span></button></li>';
        }).join('') + '</ul>');
    }
    $('roleList').innerHTML = h;
  }

  /* ----- עמוד מפקח.ת: מצב בתי הספר + שליחה במייל ----- */
  var SUP_PAGE = 'https://tfasim.pedagogiamh.co.il/baaley-tafkidim/';
  function supMail(name, list) {
    var c = contactByName(name);
    var to = cleanMails([cMail(c)]);
    var date = new Date().toLocaleDateString('he-IL');
    var td = 'style="border:1px solid #d9dee8;padding:6px 8px;text-align:right;vertical-align:top"';
    var th = 'style="border:1px solid #d9dee8;padding:6px 8px;text-align:right;background:#eef2fb"';
    var html = '<div dir="rtl" style="text-align:right;font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#16203c">' +
      'שלום ' + esc(name) + ',<br><br>זו תמונת המצב של בתי הספר שלך, נכון ל-' + esc(date) + '.<br><br>' +
      '<table dir="rtl" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%">' +
      '<tr><th ' + th + '>בית הספר</th><th ' + th + '>נספח בעלי תפקידים</th><th ' + th + '>מנור</th><th ' + th + '>מצבת</th></tr>' +
      list.map(function (r) {
        var x = r.nispach;
        var nis = ST.nispach !== 'ok' ? '' : (!x || !x.submitted ? '<b style="color:#c43c47">לא הוגש</b>' :
          (x.missing.length ? '<span style="color:#c43c47">חסר: ' + esc(x.missing.map(shortRole).join(', ')) + '</span>' : 'מאויש'));
        var men = r.menor && r.menor.t ? r.menor.r + ' מתוך ' + r.menor.t : '';
        var mz = r.matz ? r.matz.n + ' תלמידים' : (ST.matz === 'ok' ? '<span style="color:#c43c47">לא דווחה</span>' : '');
        return '<tr><td ' + td + '><b>' + esc(r.s.name) + '</b></td><td ' + td + '>' + nis + '</td><td ' + td + '>' + men + '</td><td ' + td + '>' + mz + '</td></tr>';
      }).join('') + '</table><br>';
    list.forEach(function (r) {
      var x = r.nispach;
      if (!x || !x.submitted || !x.people.length) return;
      html += '<div style="font-weight:bold;margin:14px 0 4px">בעלי התפקידים · ' + esc(r.s.name) + '</div>' +
        '<table dir="rtl" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%">' +
        '<tr><th ' + th + '>תפקיד</th><th ' + th + '>שם</th><th ' + th + '>נייד</th><th ' + th + '>מייל</th></tr>' +
        x.people.map(function (q) {
          return '<tr><td ' + td + '>' + esc(shortRole(q.role) + (q.detail ? ' · ' + q.detail : '')) + '</td><td ' + td + '>' + esc(q.name) +
            '</td><td ' + td + ' dir="ltr">' + esc(q.phone) + '</td><td ' + td + ' dir="ltr">' + esc(q.email) + '</td></tr>';
        }).join('') + '</table>';
    });
    html += '<br>הרשימה המלאה ומתעדכנת נמצאת גם בדף שלך: <a href="' + SUP_PAGE + '">בעלי התפקידים בבתי הספר שלי</a>.<br><br>תודה,<br>' +
      esc(($('meName').textContent || '').trim()) + '</div>';
    /* בנייד הגוף עובר בתוך קישור mailto, ולכן קצר: רק מה שפתוח */
    var open = list.filter(function (r) { return issues(r).length; });
    var text = 'שלום ' + name + ',\n\nזו תמונת המצב של בתי הספר שלך, נכון ל-' + date + ':\n\n' +
      (open.length ? open.map(function (r) { return '• ' + r.s.name + ': ' + issues(r).join(' · '); }).join('\n') : 'בכל בתי הספר הכול תקין.') +
      (open.length && open.length < list.length ? '\n\nבשאר ' + (list.length - open.length) + ' בתי הספר הכול תקין.' : '') +
      '\n\nהרשימה המלאה של בעלי התפקידים, עם טלפונים ומיילים, נמצאת בדף שלך:\n' + SUP_PAGE + '\n\nתודה,\n' + ($('meName').textContent || '').trim();
    return { to: to, subject: 'תמונת מצב · בתי הספר שלך · ' + date, html: html, text: text };
  }
  function supPage(name) {
    var list = SCHOOLS.filter(function (s) { return supsOf(s).indexOf(name) > -1; }).map(function (s) { return BY[s.name]; });
    var c = ST.contacts === 'ok' ? contactByName(name) : null;
    MAILS = {};
    var M = supMail(name, list);
    var h = '<div class="card head"><h1>' + esc(name) + '</h1><div class="meta">מפקח.ת פדגוגי.ת · ' + list.length + ' בתי ספר' +
      (c ? ' · ' + telA(c['טלפון'] || c['e164']) + (cMail(c) ? ' · ' + mailA(cMail(c)) : '') : '') + '</div>' +
      '<div class="views"><div class="small" style="margin:0">' + (M.to.length ? 'המייל כולל טבלת מצב לכל בית ספר ואת כל בעלי התפקידים.' :
        'אין מייל של המפקח.ת בגיליון אנשי הקשר.') + '</div>' +
      '<div class="acts">' + mailBtn('sup', M, 'שליחת המצב במייל') + '</div></div></div>';
    var bad = list.filter(function (r) { return issues(r).length; });
    h += sec('sup-state', I.chart, 'מצב בתי הספר', bad.length ? tag('', bad.length + ' עם משהו פתוח') : tag('ok', 'הכול תקין'),
      '<ul class="list">' + list.map(function (r) {
        var is = issues(r);
        return '<li><button type="button" data-go="s:' + esc(r.s.semel) + '">' + esc(r.s.name) +
          '<span>' + (is.length ? esc(is.join(' · ')) : 'תקין') + '</span></button></li>';
      }).join('') + '</ul>');
    var people = 0;
    var body = list.map(function (r) {
      var x = r.nispach;
      if (!x || !x.submitted) return '<div class="person"><div class="tx"><div class="nm">' + esc(r.s.name) + '</div><div class="x">הנספח לא הוגש</div></div></div>';
      people += x.people.length;
      return '<h4 class="subh">' + esc(r.s.name) + '</h4>' + x.people.map(function (q) {
        return personHtml(shortRole(q.role) + (q.detail ? ' · ' + q.detail : ''), q.name, q.phone, q.email, holderExtra(q));
      }).join('');
    }).join('');
    h += sec('sup-people', I.users, 'בעלי התפקידים בבתי הספר', ST.nispach === 'ok' ? people + ' בעלי תפקידים' : 'טוען…',
      ST.nispach === 'ok' ? body : pending('nispach'));
    $('main').innerHTML = h;
  }

  /* ===== אירועים ===== */
  document.addEventListener('toggle', function (e) {
    var d = e.target;
    if (d && d.classList && d.classList.contains('sec')) OPENSEC[d.getAttribute('data-k')] = d.open;
  }, true);
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target : null;
    if (!t) return;
    var mp = t.closest('[data-mefpick]');
    if (mp) { try { localStorage.setItem('mefakeach.school', mp.getAttribute('data-mefpick')); } catch (err) {} return; }
    var g = t.closest('[data-go]');
    if (g) { e.preventDefault(); go(g.getAttribute('data-go')); return; }
    var grp = t.closest('[data-grp]');
    if (grp) {
      var li = grp.parentNode, open = !li.classList.contains('open');
      li.classList.toggle('open', open);
      OPENGRP[grp.getAttribute('data-grp')] = open;
      return;
    }
    var rv = t.closest('[data-rview]');
    if (rv) { ROLEVIEW = rv.getAttribute('data-rview'); try { localStorage.setItem('revital.roleview', ROLEVIEW); } catch (err) {} render(); return; }
    var ml = t.closest('[data-mail]');
    if (ml && !IS_MOBILE) {
      var M = MAILS[ml.getAttribute('data-mail')];
      if (M) { e.preventDefault(); openDraft(M); }
      return;
    }
    var c = t.closest('[data-copy]');
    if (c) { e.preventDefault(); copy(LISTS[c.getAttribute('data-copy')] || ''); return; }
    if (t.closest('#burger')) { document.body.classList.toggle('nav-on'); return; }
    if (t.closest('#scrim')) { document.body.classList.remove('nav-on'); return; }
  });
  window.addEventListener('hashchange', function () { CUR = fromHash(); side(); render(); });

  var started = false;
  function boot() {
    if (started) return; started = true;
    var u = window.PMH_AUTH && PMH_AUTH.user();
    $('meName').textContent = (u && u.name) || 'מטה';
    $('out').onclick = function () { PMH_AUTH.logout(); };
    $('find').oninput = side;
    start();
  }
  document.addEventListener('pmh:in', boot);
  document.addEventListener('DOMContentLoaded', function () {
    if (document.documentElement.classList.contains('pmh-in')) boot();
  });
})();
