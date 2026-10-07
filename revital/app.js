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
  var MENOR_LOW = 0.5;

  var I = {
    home:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></svg>',
    car:   '<svg class="car" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.6"/><path d="M16 14.2c2.9.4 5 2.8 5 5.8"/></svg>',
    book:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19V5M4 19h16M8 16V9M13 16V6M18 16v-4"/></svg>',
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
  var CUR = '';   /* '' = סקירה, אחרת סמל מוסד */

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
  function mailA(m) { m = String(m || '').trim(); return m ? '<a href="mailto:' + esc(m) + '" dir="ltr">' + esc(m) + '</a>' : ''; }
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
      var h = String(location.hash || '').match(/s=(\d+)/);
      CUR = h && BYSEMEL[h[1]] ? h[1] : '';
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

  /* ===== תפריט הצד ===== */
  var OPENGRP = {};
  function side() {
    var q = norm($('find').value);
    var groups = {};
    SCHOOLS.forEach(function (s) {
      supsOf(s).forEach(function (n) { (groups[n] = groups[n] || []).push(s); });
    });
    var names = Object.keys(groups).sort(function (a, b) { return a.localeCompare(b, 'he'); });
    var curSchool = CUR && BYSEMEL[CUR] ? BYSEMEL[CUR].s : null;
    var h = '<li><button type="button" class="home" data-go=""' + (CUR ? '' : ' aria-current="true"') + '>' + I.home + 'סקירה</button></li>';
    names.forEach(function (n) {
      var list = groups[n].filter(function (s) {
        return !q || norm(s.name + ' ' + s.semel + ' ' + s.network).indexOf(q) > -1;
      });
      if (q && !list.length) return;
      var open = q || OPENGRP[n] || (curSchool && supsOf(curSchool).indexOf(n) > -1);
      h += '<li class="grp' + (open ? ' open' : '') + '"><button type="button" data-grp="' + esc(n) + '">' + esc(n) +
        '<span class="n">' + list.length + '</span>' + I.car + '</button><ul class="sl">' +
        list.map(function (s) {
          var r = BY[s.name], dot = allLoaded() ? (issues(r).length ? 'bad' : 'ok') : '';
          return '<li><button type="button" data-go="' + esc(s.semel) + '"' + (String(s.semel) === CUR ? ' aria-current="true"' : '') +
            '><i class="dot ' + dot + '"></i>' + esc(s.name) + '</button></li>';
        }).join('') + '</ul></li>';
    });
    $('nav').innerHTML = h;
  }

  /* ===== עמוד ראשי ===== */
  function render() { if (CUR) school(BYSEMEL[CUR]); else overview(); }

  function go(semel) {
    CUR = semel || '';
    try { history.replaceState(null, '', CUR ? '#s=' + CUR : location.pathname); } catch (e) {}
    document.body.classList.remove('nav-on');
    side(); render();
    window.scrollTo(0, 0);
  }

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
    function box(id, title, st, items, unit) {
      if (st === 'load') return '<div class="card"><p class="eyebrow">' + esc(title) + '</p><div class="l">טוען…</div></div>';
      if (st === 'err') return '<div class="card"><p class="eyebrow">' + esc(title) + '</p><div class="l">המקור לא נטען כרגע. רענון הדף ינסה שוב.</div></div>';
      LISTS[id] = items.map(function (x) { return x[0].name + (x[1] ? ' — ' + x[1] : ''); }).join('\n');
      return '<div class="card"><p class="eyebrow">' + esc(title) +
        (items.length ? '<span class="end"><button class="btn" data-copy="' + id + '">' + I.copy + 'העתקה</button></span>' : '') + '</p>' +
        '<div class="big' + (items.length ? '' : ' ok') + '">' + items.length + '</div><div class="l">' + unit + '</div>' +
        (items.length ? '<ul class="list">' + items.map(function (x) {
          return '<li><button type="button" data-go="' + esc(x[0].semel) + '">' + esc(x[0].name) + '<span>' + esc(x[1]) + '</span></button></li>';
        }).join('') + '</ul>' : '') + '</div>';
    }
    LISTS = {};
    $('main').innerHTML =
      '<div class="card head"><h1>סקירה</h1><div class="meta">64 בתי ספר · בחרי בית ספר בתפריט כדי לראות את כל מה שיש עליו</div></div>' +
      '<div class="ov" style="margin-top:14px">' +
      box('a', 'נספח בעלי תפקידים · לא הגישו', ST.nispach, nisNone, 'בתי ספר') +
      box('b', 'נספח · תפקידים חסרים', ST.nispach, nisGap, 'בתי ספר') +
      box('c', 'מנור · נרשמו פחות מחצי המורים', ST.menor, low, 'בתי ספר') +
      box('d', 'מצבת תלמידים · לא דיווחו', ST.matz, matzNone, 'בתי ספר') +
      '</div>';
  }
  var LISTS = {};

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
  function pending(k) { return ST[k] === 'load' ? '<div class="empty">טוען…</div>' : '<div class="empty">המקור לא נטען כרגע. רענון הדף ינסה שוב.</div>'; }

  function school(r) {
    var s = r.s, x = r.nispach, h = '';
    var principal = (x && x.principal) || (r.matz && r.matz.principal) || '';

    /* כותרת + מספרים */
    var p = rate(r);
    var cs = ST.contacts === 'ok' ? contactsFor(s) : [];
    var office = cs.map(function (c) { return c['טלפון מוסד']; }).filter(Boolean)[0];
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
    h += '<div class="card"><p class="eyebrow">' + I.phone + 'אנשי קשר</p>';
    if (ST.contacts !== 'ok') h += pending('contacts');
    if (ST.contacts === 'ok') {
      if (cs.length) h += cs.map(function (c) { return personHtml(c['תפקיד'] || 'מנהל.ת', c['שם'], c['טלפון'] || c['e164'], c['מייל']); }).join('');
      else if (principal) h += personHtml('מנהל.ת', principal, '', '', 'אין פרטי קשר בגיליון אנשי הקשר');
      else h += '<div class="empty">אין רשומת מנהל.ת לבית הספר הזה.</div>';
      supsOf(s).forEach(function (n) {
        var c = contactByName(n);
        h += personHtml('מפקח.ת פדגוגי.ת', n, c && (c['טלפון'] || c['e164']), c && c['מייל'],
          s.changed && s.supPrev ? 'בתשפ״ו: ' + esc(s.supPrev) : '');
      });
    }
    h += '</div>';

    /* מגמות */
    var megs = (s.megamot || []).filter(function (m) { return m.name; });
    h += '<div class="card"><p class="eyebrow">' + I.book + 'מגמות<span class="end">' + megs.length + '</span></p>';
    h += megs.length ? '<ul class="megs">' + megs.map(function (m) {
      var sub = [m.grades ? 'שכבות ' + m.grades : '', m.sups && m.sups.length ? 'מפקח.ת מקצועי.ת: ' + m.sups.join(', ') : ''].filter(Boolean).join(' · ');
      return '<li>' + esc(m.name) + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</li>';
    }).join('') + '</ul>' : '<div class="empty">אין מגמות רשומות בפריסה.</div>';
    h += '</div>';

    /* בעלי תפקידים */
    h += '<div class="card"><p class="eyebrow">' + I.users + 'בעלי תפקידים' +
      (x && x.ts ? '<span class="end">הנספח הוגש ' + esc(x.ts) + '</span>' : '') + '</p>';
    if (ST.nispach !== 'ok') h += pending('nispach');
    else if (!x || !x.submitted) h += '<div class="miss"><span class="chip warn">בית הספר עוד לא הגיש את נספח בעלי התפקידים</span></div>';
    else {
      h += x.missing.length
        ? '<div class="miss">' + x.missing.map(function (m) { return '<span class="chip">חסר: ' + esc(m) + '</span>'; }).join('') + '</div>'
        : '<div class="miss"><span class="chip ok">כל התפקידים מאוישים</span></div>';
      if (x.notes) h += '<div class="note"><b>הערות בית הספר:</b> ' + esc(x.notes) + '</div>';
      h += x.people.map(function (q) {
        var role = q.role.split(' — ')[0] + (q.detail ? ' · ' + q.detail : '');
        var extra = [q.hours ? q.hours + ' ש״ש' : '', q.scope ? 'משרה ' + q.scope + '%' : '', q.seniority ? 'ותק ' + q.seniority : '', q.other ? 'גם: ' + q.other : '']
          .filter(Boolean).map(esc).join(' · ');
        return personHtml(role, q.name, q.phone, q.email, extra);
      }).join('');
    }
    h += '</div>';

    /* מנור */
    h += '<div class="card"><p class="eyebrow">' + I.chart + 'מנור · רישום המורים</p>';
    if (ST.menor !== 'ok') h += pending('menor');
    else if (!r.menor || !r.menor.t) h += '<div class="empty">אין מורים רשומים במנור לבית הספר הזה.</div>';
    else {
      var pc = Math.round(100 * r.menor.r / r.menor.t);
      h += '<div class="meter"><div class="b"><i class="' + (pc < 50 ? 'low' : (pc < 80 ? 'mid' : '')) + '" style="width:' + pc + '%"></i></div><span>' + pc + '%</span></div>' +
        '<div class="small">נרשמו <b>' + r.menor.r + '</b> מתוך <b>' + r.menor.t + '</b> מורים · השלימו את כל הפרטים: <b>' + r.menor.d + '</b>' +
        ' · <a href="' + MENOR_LINK + '" target="_blank" rel="noopener">מי לא נרשם (במנור)</a></div>';
    }
    h += '</div>';

    $('main').innerHTML = h;
  }

  /* ===== אירועים ===== */
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target : null;
    if (!t) return;
    var g = t.closest('[data-go]');
    if (g) { go(g.getAttribute('data-go')); return; }
    var grp = t.closest('[data-grp]');
    if (grp) {
      var n = grp.getAttribute('data-grp');
      var li = grp.parentNode;
      var open = !li.classList.contains('open');
      li.classList.toggle('open', open);
      OPENGRP[n] = open;
      return;
    }
    var c = t.closest('[data-copy]');
    if (c) { copy(LISTS[c.getAttribute('data-copy')] || ''); return; }
    if (t.closest('#burger')) { document.body.classList.toggle('nav-on'); return; }
    if (t.closest('#scrim')) { document.body.classList.remove('nav-on'); return; }
  });

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
