/* הבית של רויטל — מעטפת עם תפריט צד (כמו אדווה ומנור), 7.10.26.
   תפריט הצד: סקירה + 64 בתי הספר לפי מפקח.ת. כל בית ספר = עמוד אחד עם כל מה שיש עליו.
   מקורות (כל אחד נטען ונכשל בנפרד, שמות עוברים SchoolNames.canon):
     data/mosdot.json            — 64 בתי הספר, רשת, מחוז, מגזר, מפקח.ת, מגמות (ציבורי, בלי פרטי קשר)
     admin-contacts (שער)         — מנהלים ומפקחים עם טלפון ומייל (מוגן, מרחב all/mosdot)
     נספח mode:view (טוקן)        — בעלי התפקידים עם פרטים ומה חסר
     מנור registration.count      — מספרי רישום המורים לבית ספר
     מצבת ?mode=list              — מספר תלמידים בלבד (לא חוסר — הוסר 7.10.26)
     pikuah-data (שער)            — מיפוי בית ספר, ביקורי תשפ״ו, יעדים מהוועדה (מוגן, מסונן לפי מפקח.ת בשרת)
     הבית של המפקח visit.list     — תאריכי הביקורים החדשים, ל"דורש תשומת לב"
   שום מפתח ושום פרט אישי לא יושבים בקובץ הזה. */
(function () {
  'use strict';

  var GAS = 'https://script.google.com/macros/s/';
  var SRC = {
    mosdot:  'https://pedagogiamh.co.il/data/mosdot.json',
    nispach: GAS + 'AKfycbw_ix0Qi2SkQHB081xdNA15kIQXGsUxO15keTMafPAcWRSy8gyIMmFR6_PV2UZ4_rTiuQ/exec',
    menor:   GAS + 'AKfycbwDOLGv0Hr7KNjFJBIslJkDt9cDa2g4-Gfho3dTfI0AP3uwjlM3NGCwSnQkXZd4DUlyHg/exec?action=registration.count&by=school',
    matz:    GAS + 'AKfycbyozBbEf78cLV61ODLyzhzLSyI2auAUMd8YVgp0qZLGs3O4MYAFhAQuVG7NIxjX0Mq7Lw/exec?mode=list',
    /* השתלמות מוסדית (בית ספרית) — שורה לכל בקשה, בלי פרטי מנהל */
    bs:      GAS + 'AKfycbybTYpXL_XPluv-r1wUZaWwDsZjAtXX4BeaO7quSQOvqWf0u8EUNJUbAxleScvchzcX/exec?mode=public',
    /* רישום להשתלמויות המקוונות — מספרים בלבד לכל בית ספר */
    rg:      GAS + 'AKfycbxraYAhcv_oefTLHxyOfripC0R2LlmPMgYNIWR4rCQUa0FFybRoFHIe4zqgWB1MikF9/exec?mode=schools'
  };
  var MENOR_LINK = 'https://pedagogiamh.co.il/hadrachot/ministry/rishum-morim.html';
  var MENOR_VIEW = 'https://pedagogiamh.co.il/hadrachot/ministry/';   /* "מבט ארצי" — רויטל = ministry במנור */
  /* הבית של המפקח — ביקורים, דוחות, משימות ומסמכים. רויטל = "מטה" בלשונית מפקחים שם, ורואה את כל המפקחים */
  var MEF_EXEC = GAS + 'AKfycbxyhvbkVUtydT70TH5Q2fYXu-MpFfAv0qxX7K-RzsSvt7UWXoxwjHun1zwK6MJQj6_K/exec';
  var MENOR_LOW = 0.5;
  var BS_LINK = 'https://pedagogiamh.co.il/sikum-hishtalmuyot.html';
  var RG_LINK = 'https://pedagogiamh.co.il/sikum-rishum-hishtalmuyot.html';
  var WS = [['social', 'רכזים חברתיים'], ['matal', 'מת״ליות'], ['career', 'נתיבים לקריירה'],
            ['honchim', 'מורים חונכים'], ['ped', 'רכזים פדגוגיים'], ['sherut', 'שירות לאומי']];
  /* סוגי החוסרים — הסדר הזה הוא הסדר בכל הרשימות */
  var GAP_KINDS = [['nispach', 'נספח בעלי תפקידים'], ['bs', 'השתלמות מוסדית'], ['rg', 'רישום להשתלמויות'],
                   ['menor', 'רישום מורים למנור'], ['sal', 'סל תוכניות']];   /* מצבת התלמידים הוסרה (מיטל, 7.10.26) */
  /* "דורש תשומת לב" — אותות לפיקוח, לא חוסרים של בית הספר (מיטל, 7.10.26). לכן בלי מייל למנהל.ת */
  var FLAG_KINDS = [['visit', 'לא היה ביקור 3 חודשים'], ['risk', 'מדדים במצב סיכון'], ['goals', 'אין יעדים מהוועדה'],
                    ['aklim', 'אקלים: פער או ירידה']];
  var VISIT_DAYS = 90;
  /* שאלון אקלים תשפ"ו (מיטל, 7.10.26): ממד חריג = 12 נקודות ומעלה מתחת להשוואה, או ירידה של 12 ומעלה
     מתשפ"ה. כרטיס עם פחות מ-10 משיבים מוצג עם הערה, ולא נכנס להתראות */
  var AKL_GAP = 12, AKL_MIN = 10;
  var AKL_AUD = ['מורים', 'תלמידים', 'פדגוגיה'];
  var LV = { 'יציב ומתקדם': 'ok', 'בתהליך/דורש חיזוק': 'warn', 'במצב סיכון': 'bad' };
  /* קבוצות המדדים במיפוי — כל קבוצה מתחילה במדד הזה, לפי סדר העמודות */
  var LV_GROUPS = [['אקלים בית ספרי', 'אקלים, חוסן ומענים'], ['איכות ההוראה', 'הוראה ולמידה'], ['הערכה כללית של המנהל', 'ניהול']];

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
    copy:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
    flag:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/></svg>'
  };

  var $ = function (id) { return document.getElementById(id); };
  /* ===== מי נכנס.ה (7.10.26: הבית נפתח גם למפקחים) =====
     all (רויטל, מיטל) = כל בתי הספר. pikuah = רק בתי הספר של המפקח.ת (גם השרת מסנן — זה רק התצוגה).
     ?as=<שם> — אדמין רואה את הבית בדיוק כמו המפקח.ת הזה/ו (לבדיקה ולהדגמה). */
  var ME = null, IS_ADMIN = false, AS = '', SUPNAME = '';
  function whoAmI() {
    ME = (window.PMH_AUTH && PMH_AUTH.user()) || {};
    IS_ADMIN = (ME.spaces || []).some(function (x) { return String(x).trim() === 'all'; });
    var m = location.search.match(/[?&]as=([^&]+)/);
    AS = IS_ADMIN && m ? decodeURIComponent(m[1].replace(/\+/g, ' ')).trim() : '';
    SUPNAME = IS_ADMIN ? AS : String(ME.name || '').trim();
  }
  function adminView() { return IS_ADMIN && !AS; }
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
  var ST = { contacts: 'load', nispach: 'load', menor: 'load', matz: 'load', bs: 'load', rg: 'load', sherut: 'load', pk: 'load', mv: 'load', sal: 'load', wait: 'load' };
  /* בנות שירות — מהמפתח המוגן admin-sherut בשער (גיליון "בנות שירות — אדמין המוסדות", בלי ת"ז) */
  var SHERUT_ROLE = 'בנות שירות';
  var CUR = '';     /* '' = סקירה · 's:<סמל>' = בית ספר · 'r:<תפקיד>' = לפי תפקיד */
  var CORE = [];
  var MEF = {};     /* סמל → {st:'load'|'ok'|'err'|'noaccess', d} */
  var OPENSEC = { head: true };   /* אילו מקטעים פתוחים — נשמר בין בתי ספר */
  /* לשוניות בעמוד בית ספר (מיטל, 7.10.26: "הדף ארוך מדי") — "פיקוח" מפוצל לשתיים */
  var TABS = [['ov', 'סקירה'], ['ppl', 'אנשים'], ['map', 'מיפוי ויעדים'], ['akl', 'אקלים'], ['vis', 'ביקורים ומשימות'], ['sal', 'סל תוכניות'], ['lrn', 'למידה']];
  var STAB = 'ov';

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
      if (SUPNAME) SCHOOLS = SCHOOLS.filter(function (s) { return supsOf(s).indexOf(SUPNAME) > -1; });
      var mine = {}; SCHOOLS.forEach(function (s) { mine[String(s.semel)] = 1; });
      Object.keys(BYSEMEL).forEach(function (k) { if (!mine[k]) delete BYSEMEL[k]; });
      $('meCount').textContent = SCHOOLS.length + ' בתי ספר';
      if (!SCHOOLS.length) {
        $('main').innerHTML = '<div class="card"><b>עוד לא משויכים לחשבון הזה בתי ספר.</b><div class="small">אם זו טעות, כתבו למיטל — היא תעדכן את השיוך.</div></div>';
        return;
      }
      CUR = fromHash();
      side(); render();
      document.dispatchEvent(new Event('revital:ready'));
      loadContacts(); loadSherut(); loadNispach(); loadMenor(); loadMatz(); loadBs(); loadRg();
      loadPikuah(); loadMefVisits(); loadForms(); loadWait();
    }).catch(function () {
      $('main').innerHTML = '<div class="card"><b>לא הצלחתי לטעון את רשימת בתי הספר.</b> <button class="btn" id="retry">לנסות שוב</button></div>';
      $('retry').onclick = start;
    });
  }
  function loaded(k, ok) { ST[k] = ok ? 'ok' : 'err'; side(); render(); }

  /* "מה מחכה לך?" (מיטל, 8.10.26) — בקשות השתלמות מוסדית שממתינות לאישור, עם הקישור האישי.
     מגיע רק דרך השער, מסונן לבתי הספר של המחובר.ת. חוזרים לטאב אחרי אישור → נטען מחדש */
  var WAIT = [];
  function loadWait() {
    if (!window.PMH_AUTH || !PMH_AUTH.load) return loaded('wait', false);
    PMH_AUTH.load('hishtal-wait').then(function (res) {
      if (!(res && res.ok && Array.isArray(res.data))) return loaded('wait', false);
      WAIT = res.data; loaded('wait', true);
    }, function () { loaded('wait', false); });
  }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && ST.wait && ST.wait !== 'load' && SCHOOLS.length) loadWait();
  });

  function loadContacts() {
    if (!window.PMH_AUTH || !PMH_AUTH.load) return loaded('contacts', false);
    PMH_AUTH.load('admin-contacts').then(function (r) {
      if (r && r.ok && Array.isArray(r.data)) { CONTACTS = r.data; loaded('contacts', true); }
      else loaded('contacts', false);
    }, function () { loaded('contacts', false); });
  }
  function loadSherut() {
    if (!window.PMH_AUTH || !PMH_AUTH.load) return loaded('sherut', false);
    PMH_AUTH.load('admin-sherut').then(function (res) {
      if (!(res && res.ok && Array.isArray(res.data))) return loaded('sherut', false);
      res.data.forEach(function (row) {
        var r = BY[SN.canon(String(row['בית ספר'] || '').trim())];
        if (r) (r.sherut = r.sherut || []).push(row);
      });
      loaded('sherut', true);
    }, function () { loaded('sherut', false); });
  }
  function sherutDates(row) {
    function d(v) { var m = String(v || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? (+m[3]) + '.' + (+m[2]) + '.' + m[1].slice(2) : String(v || ''); }
    return row['תחילת שירות'] ? 'שירות ' + d(row['תחילת שירות']) + '–' + d(row['סיום שירות']) : String(row['סטטוס'] || '');
  }
  /* בת שירות בצורה של בעל.ת תפקיד, כדי שכל הרשימות והמיילים יעבדו עליה כרגיל */
  function sherutPerson(row) {
    return {
      role: SHERUT_ROLE, detail: row['רכזת'] ? 'רכזת: ' + row['רכזת'] : '', name: String(row['שם'] || ''),
      phone: String(row['נייד'] || row['e164'] || ''), email: String(row['מייל'] || ''),
      note: [row['עיר'], sherutDates(row)].filter(Boolean).join(' · ')
    };
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

  function loadBs() {
    fetchJson(SRC.bs, {}, 45000).then(function (d) {
      /* שליחה חוזרת מוסיפה שורה — האחרונה לפי הסדר היא הקובעת */
      (d.rows || []).forEach(function (row) {
        var r = BYSEMEL[String(row['סמל מוסד'] || '').trim()] || BY[SN.canon(row['בית הספר'])];
        if (r) r.bs = { status: String(row['סטטוס'] || ''), name: String(row['שם ההשתלמות'] || ''), ts: String(row['חותמת זמן'] || '') };
      });
      loaded('bs', true);
    }).catch(function () { loaded('bs', false); });
  }
  function loadRg() {
    fetchJson(SRC.rg, {}, 45000).then(function (d) {
      Object.keys(d.schools || {}).forEach(function (k) { var r = BY[SN.canon(k)]; if (r) r.rg = d.schools[k]; });
      loaded('rg', true);
    }).catch(function () { loaded('rg', false); });
  }

  /* מיפוי, ביקורי תשפ״ו ויעדים — מהשער. השרת מחזיר רק את בתי הספר של המחובר.ת (all = הכול) */
  function loadPikuah() {
    if (!window.PMH_AUTH || !PMH_AUTH.load) { ST.sal = ST.akl = 'err'; return loaded('pk', false); }
    PMH_AUTH.load('pikuah-data').then(function (res) {
      var d = res && res.ok && res.data;
      if (!d || d.error) { ST.sal = ST.akl = 'err'; return loaded('pk', false); }
      SCHOOLS.forEach(function (s) { var r = BY[s.name]; r.mipui = []; r.bik = []; r.yaad = ''; r.sal = null; r.akl = []; r.aklWeak = []; });
      /* אקלים: בשער שלפני 7.10.26 אין את המפתח — אז "לא נטען", לא "לא התקבל דוח" */
      ST.akl = Array.isArray(d.aklim) && d.aklim.length ? 'ok' : 'err';
      (d.aklim || []).forEach(function (row) { var r = at(row); if (r) r.akl.push(row); });
      (d.aklimWeak || []).forEach(function (row) { var r = at(row); if (r) r.aklWeak.push(row); });
      (d.sal || []).forEach(function (row) { var r = at(row); if (r) r.sal = row; });
      function at(row) { return BYSEMEL[String(row['סמל מוסד'] || '').trim()]; }
      (d.mipui || []).forEach(function (row) { var r = at(row); if (r) r.mipui.push(row); });
      (d.bikurim || []).forEach(function (row) { var r = at(row); if (r) r.bik.push(row); });
      (d.yaadim || []).forEach(function (row) { var r = at(row); if (r) r.yaad = String(row['יעדים מהוועדה האחרונה'] || '').trim(); });
      SCHOOLS.forEach(function (s) {
        var r = BY[s.name];
        r.mipui.sort(function (a, b) { return String(b['תאריך קליטת טופס']).localeCompare(String(a['תאריך קליטת טופס'])); });
        r.bik.sort(function (a, b) { return String(b['תאריך']).localeCompare(String(a['תאריך'])); });
      });
      ST.sal = 'ok';
      loaded('pk', true);
    }, function () { ST.sal = 'err'; ST.akl = 'err'; loaded('pk', false); });
  }
  /* הביקורים החדשים (תשפ״ז) יושבים בבית של המפקח — רק התאריך האחרון לכל בית ספר */
  function loadMefVisits() {
    fetchJson(MEF_EXEC, {
      method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'visit.list', token: token() })
    }, 45000, 2).then(function (d) {
      if (!d || !d.ok) throw new Error();
      (d.visits || []).forEach(function (v) {
        var r = BYSEMEL[String(v.school_id)], dt = String(v.date || '').slice(0, 10);
        if (r && dt && (!r.mvLast || dt > r.mvLast)) r.mvLast = dt;
      });
      loaded('mv', true);
    }).catch(function () { loaded('mv', false); });
  }

  /* ===== מה חסר בבית ספר — מקור אחד לרשימות, לנקודות בתפריט ולמיילים ===== */
  function rate(r) { return r.menor && r.menor.t ? r.menor.r / r.menor.t : null; }
  function rgTotal(r) {
    var n = 0;
    WS.forEach(function (w) { n += Number(r.rg && r.rg[w[0]]) || 0; });
    return n;
  }
  function gaps(r) {
    var out = [];
    if (ST.nispach === 'ok') {
      if (!r.nispach || !r.nispach.submitted) out.push({ k: 'nispach', t: 'נספח בעלי התפקידים לא הוגש' });
      else if (r.nispach.missing.length) out.push({ k: 'nispach', t: 'חסרים בעלי תפקידים: ' + r.nispach.missing.map(shortRole).join(', ') });
    }
    if (ST.bs === 'ok') {
      var st = r.bs ? r.bs.status : '';
      if (!r.bs) out.push({ k: 'bs', t: 'השתלמות מוסדית לא הוגשה' });
      else if (st.indexOf('ממתין') > -1) out.push({ k: 'bs', t: 'השתלמות מוסדית ממתינה לאישור המפקח.ת' });
      else if (st.indexOf('נדח') > -1 || st.indexOf('הוחזר') > -1) out.push({ k: 'bs', t: 'השתלמות מוסדית: ' + st + ' · צריך להגיש מחדש' });
    }
    /* כל השתלמות בנפרד (מיטל, 7.10.26): בית ספר שאף אחד ממנו לא נרשם להשתלמות מסוימת = חוסר */
    if (ST.rg === 'ok') {
      var noWs = WS.filter(function (w) { return !(Number(r.rg && r.rg[w[0]]) > 0); }).map(function (w) { return w[1]; });
      if (noWs.length === WS.length) out.push({ k: 'rg', t: 'לא נרשם אף אחד לאף השתלמות' });
      else if (noWs.length) out.push({ k: 'rg', t: 'לא נרשמו ל: ' + noWs.join(', ') });
    }
    /* מנור: המצב של כל בית ספר, לא רק מתחת לסף — כל מורה שלא נרשם נחשב */
    if (ST.menor === 'ok') {
      if (!r.menor || !r.menor.t) out.push({ k: 'menor', t: 'מנור: אין מורים רשומים לבית הספר' });
      else if (r.menor.r < r.menor.t) out.push({ k: 'menor', t: 'מנור: נרשמו ' + r.menor.r + ' מתוך ' + r.menor.t + ' מורים · ' + (r.menor.t - r.menor.r) + ' טרם נרשמו' });
    }
    salGap(r, out);
    return out;
  }
  function issues(r) { return gaps(r).map(function (g) { return g.t; }); }
  /* סל תוכניות תשפ"ז (7.10.26) — חוסר רק כשלא הוגש. הערת האישור מוצגת בלשונית */
  function salGap(r, out) { if (ST.sal === 'ok' && !r.sal) out.push({ k: 'sal', t: 'סל תוכניות לא הוגש' }); }
  /* מספר התלמידים: מהמצבת אם דווחה, אחרת מהמיפוי */
  function studentsOf(r) { return r.matz && r.matz.n ? r.matz.n : (r.mipui && r.mipui[0] ? field(r.mipui[0], 'מספר תלמידים מט') : ''); }
  function allLoaded() { return ['nispach', 'menor', 'bs', 'rg', 'sal'].every(function (k) { return ST[k] !== 'load'; }); }

  /* ===== דורש תשומת לב — אותות לפיקוח ===== */
  function field(row, prefix) {
    if (!row) return '';
    for (var k in row) if (k.indexOf(prefix) === 0) return String(row[k] || '').trim();
    return '';
  }
  /* מדדי המיפוי לפי הסדר, עם הקבוצה של כל מדד */
  function levels(row) {
    var out = [], grp = 'כללי';
    Object.keys(row || {}).forEach(function (k) {
      LV_GROUPS.forEach(function (g) { if (k.indexOf(g[0]) === 0) grp = g[1]; });
      var v = String(row[k] || '').trim();
      if (LV[v]) out.push({ name: k, v: v, cls: LV[v], grp: grp });
    });
    return out;
  }
  function riskOf(r) { return r.mipui && r.mipui[0] ? levels(r.mipui[0]).filter(function (x) { return x.cls === 'bad'; }) : []; }
  function lastVisit(r) {
    var a = r.bik && r.bik[0] ? String(r.bik[0]['תאריך']).slice(0, 10) : '', b = r.mvLast || '';
    return a > b ? a : b;
  }
  function daysSince(iso) { return Math.floor((Date.now() - new Date(iso + 'T00:00:00').getTime()) / 864e5); }
  function flags(r) {
    var out = [];
    /* ביקור: צריך גם את הקובץ וגם את הבית של המפקח — בלי אחד מהם כמעט הכול ייראה "בלי ביקור" */
    if (ST.pk === 'ok' && ST.mv === 'ok') {
      var lv = lastVisit(r);
      if (!lv) out.push({ k: 'visit', t: 'לא תועד אף ביקור' });
      else if (daysSince(lv) > VISIT_DAYS) out.push({ k: 'visit', t: 'ביקור אחרון ' + fmtDate(lv) + ' · לפני ' + Math.round(daysSince(lv) / 30) + ' חודשים' });
    }
    if (ST.pk === 'ok') {
      var rk = riskOf(r), overall = field(r.mipui[0], 'דירוג כולל');
      if (rk.length) out.push({ k: 'risk', t: 'במצב סיכון: ' + rk.map(function (x) { return x.name; }).join(', ') });
      else if (overall.indexOf('סיכון') === 0) out.push({ k: 'risk', t: overall });
      if (!r.yaad) out.push({ k: 'goals', t: 'אין יעדים מהוועדה המלווה האחרונה' });
    }
    if (ST.akl === 'ok') {
      var ab = aklBad(r);
      if (ab.length) out.push({ k: 'aklim', t: 'אקלים: ' + ab.slice(0, 3).map(aklWhy).join(' · ') + (ab.length > 3 ? ' · ועוד ' + (ab.length - 3) : '') });
    }
    return out;
  }

  /* ===== שאלון אקלים תשפ"ו ===== */
  function aklNum(v) { v = String(v == null ? '' : v).trim(); return v === '' ? null : Number(v); }
  function aklFew(row) { var n = aklNum(row['משיבים']); return n !== null && n < AKL_MIN; }
  /* "פדגוגיה (מורים)" בקובץ הפדגוגיה זהה לממד בקובץ המורים — מסומן רק שם */
  function aklDup(row) { return row['קהל'] === 'פדגוגיה' && row['ממד'] === 'פדגוגיה (מורים)'; }
  function aklGap(row) { var g = aklNum(row['פער מההשוואה']); return g !== null && g <= -AKL_GAP; }
  function aklDrop(row) { var c = aklNum(row['שינוי מתשפ"ה']); return c !== null && c <= -AKL_GAP; }
  function aklLow(row) { return !aklFew(row) && (aklGap(row) || aklDrop(row)); }
  function aklBad(r) { return (r.akl || []).filter(function (row) { return !aklDup(row) && aklLow(row); }); }
  function aklCmpName(row) { return String(row['סוג השוואה'] || '').indexOf('דומים') > -1 ? 'דומים' : 'הקבוצה'; }
  function aklWhy(row) { return row['קהל'] + (row['יחידה'] ? ' ' + row['יחידה'] : '') + ': ' + row['ממד'] + ' ' + aklReason(row); }
  function aklReason(row) {
    var p = [];
    if (aklGap(row)) p.push('נמוך ב-' + Math.round(-aklNum(row['פער מההשוואה'])) + ' מ' + (aklCmpName(row) === 'דומים' ? 'הדומים' : 'הקבוצה'));
    if (aklDrop(row)) p.push('ירד ב-' + Math.round(-aklNum(row['שינוי מתשפ"ה'])));
    return p.join(', ');
  }

  /* ===== ניתוב ===== */
  function fromHash() {
    var h = decodeURIComponent(String(location.hash || '').slice(1));
    if (h === 'S' || h === 'R' || h === 'P' || h === 'G' || h === 'A' || h === 'F' || h === 'N') return h;
    var m = h.match(/^s=(\d+)(?:&t=(\w+))?$/);
    if (m && BYSEMEL[m[1]]) { STAB = TABS.some(function (t) { return t[0] === m[2]; }) ? m[2] : 'ov'; return 's:' + m[1]; }
    m = h.match(/^m=(ok|warn|bad|none)$/);
    if (m) return 'm:' + m[1];
    m = h.match(/^r=(.+)$/);
    if (m) return 'r:' + m[1];
    m = h.match(/^p=(.+)$/);
    if (m) return 'p:' + m[1];
    m = h.match(/^f=(.+)$/);
    if (m) return 'f:' + m[1];
    return '';
  }
  var FROM = null;   /* מאיזה עמוד רשימה נכנסו לעמוד פנימי — אליו מוביל "חזרה" */
  function go(to) {
    to = to || '';
    var tt = /^(s:\d+)&t=(\w+)$/.exec(to);   /* ישר ללשונית (למשל אקלים מ"דורש תשומת לב") */
    if (tt) to = tt[1];
    if (CUR === 'N') nfSync();   /* טיוטת טופס חדש נשמרת גם כשיוצאים מהעמוד */
    if (to.indexOf(':') > -1) { if (CUR.indexOf(':') < 0) FROM = CUR; }
    else FROM = null;
    if (to !== CUR && to.charAt(0) === 's') STAB = 'ov';   /* בית ספר אחר נפתח בסקירה */
    if (tt) STAB = tt[2];
    CUR = to;
    setHash();
    document.body.classList.remove('nav-on');
    side(); render();
    window.scrollTo(0, 0);
  }
  function setHash() {
    var hash = !CUR ? '' : (CUR.length === 1 ? '#' + CUR : '#' + CUR.charAt(0) + '=' + encodeURIComponent(CUR.slice(2)));
    if (CUR.charAt(0) === 's' && STAB !== 'ov') hash += '&t=' + STAB;
    try { history.replaceState(null, '', hash || location.pathname + location.search); } catch (e) {}
  }

  /* ===== תפריט הצד ===== */
  function roleList() {
    var count = {};
    SCHOOLS.forEach(function (s) {
      var x = BY[s.name].nispach;
      if (x && x.people) x.people.forEach(function (p) { count[p.role] = (count[p.role] || 0) + 1; });
    });
    var rest = Object.keys(count).filter(function (r) { return CORE.indexOf(r) < 0; })
      .sort(function (a, b) { return count[b] - count[a]; });
    var list = CORE.concat(rest);
    if (ST.sherut === 'ok') {
      count[SHERUT_ROLE] = 0;
      SCHOOLS.forEach(function (s) { count[SHERUT_ROLE] += (BY[s.name].sherut || []).length; });
      list.push(SHERUT_ROLE);
    }
    return { list: list, count: count };
  }
  function shortRole(r) { return String(r).split(' — ')[0]; }

  /* תפריט הצד = פריטים קבועים בלבד. שום רשימה לא נפתחת בתוכו — כל תוכן מוצג באמצע (מיטל, 7.10.26) */
  function section() {
    var c = CUR.charAt(0);
    if (!CUR) return '';
    if (CUR === 'S' || c === 's') return 'S';
    if (CUR === 'R' || c === 'r') return 'R';
    if (CUR === 'P' || c === 'p') return 'P';
    if (CUR === 'G') return 'G';
    if (CUR === 'A') return 'A';
    if (CUR === 'F' || CUR === 'N' || c === 'f') return 'F';
    return '';
  }
  function side() {
    var at = section();
    function item(key, icon, label, n) {
      return '<li><button type="button" class="home" data-go="' + key + '"' + (at === key ? ' aria-current="true"' : '') + '>' +
        icon + label + (n ? '<span class="n">' + n + '</span>' : '') + '</button></li>';
    }
    var bad = allLoaded() ? SCHOOLS.filter(function (s) { return issues(BY[s.name]).length; }).length : 0;
    var att = ST.pk === 'ok' ? SCHOOLS.filter(function (s) { return flags(BY[s.name]).length; }).length : 0;
    /* דשבורד = דף הבית; "מה חסר" ו"דורש תשומת לב" = פריטים משלהם (מיטל, 7.10.26) */
    $('nav').innerHTML =
      item('', I.home, 'דשבורד', '') +
      item('G', I.check, 'מה חסר לכל בית ספר', bad ? String(bad) : '') +
      item('A', I.chart, 'דורש תשומת לב', att ? String(att) : '') +
      item('S', I.book, 'בתי הספר', String(SCHOOLS.length)) +
      item('R', I.users, 'בעלי תפקידים לפי תפקיד', '') +
      (adminView() ? item('F', I.doc, 'טפסים פעילים', fNavCount()) : '') +
      (adminView() ? item('P', I.mail, 'מפקחים · מצב ושליחה', '') : '') +
      '<li class="sep"></li>' +
      (adminView() ? '<li><a class="home" href="' + MENOR_VIEW + '" target="_blank" rel="noopener">' + I.chart + 'המבט שלי במנור' + I.ext + '</a></li>' : '') +
      '<li><button type="button" class="home" id="tourLink" data-tour-start>' + I.flag + 'סיור במערכת</button></li>';
  }

  /* ----- עמודי רשימה באמצע ----- */
  var SQ = '', SSUP = '';
  function schoolsPage() {
    if (!$('schBox')) {
      $('main').innerHTML = '<div class="card head" id="schBox"><h1>בתי הספר</h1><div class="meta">' + SCHOOLS.length + ' בתי ספר · לחיצה על בית ספר פותחת את כל מה שיש עליו</div>' +
        '<div class="filters"><input id="sq" type="search" placeholder="חיפוש בית ספר, רשת או סמל" value="' + esc(SQ) + '">' +
        '<select id="ssup"><option value="">כל המפקחים</option>' + supNames().map(function (n) {
          return '<option' + (n === SSUP ? ' selected' : '') + '>' + esc(n) + '</option>'; }).join('') + '</select></div></div>' +
        '<div id="schList"></div>';
      $('sq').oninput = function () { SQ = this.value; drawSchools(); };
      $('ssup').onchange = function () { SSUP = this.value; drawSchools(); };
    }
    drawSchools();
  }
  function drawSchools() {
    var q = norm(SQ), done = allLoaded(), h = '';
    supNames().forEach(function (n) {
      if (SSUP && n !== SSUP) return;
      var list = SCHOOLS.filter(function (s) {
        return supsOf(s).indexOf(n) > -1 && (!q || norm(s.name + ' ' + s.semel + ' ' + s.network).indexOf(q) > -1);
      });
      if (!list.length) return;
      h += '<div class="card"><p class="eyebrow">' + I.users + esc(n) + '<span class="end">' + list.length + ' בתי ספר</span></p><div class="tiles">' +
        list.map(function (s) {
          var is = done ? issues(BY[s.name]) : [];
          return '<button type="button" class="tile" data-go="s:' + esc(s.semel) + '"><i class="dot ' + (done ? (is.length ? 'bad' : 'ok') : '') + '"></i>' +
            '<span><b>' + esc(s.name) + '</b><small>' + esc(s.network) + ' · ' + esc(s.semel) + (is.length ? ' · ' + is.length + ' פתוחים' : '') + '</small></span></button>';
        }).join('') + '</div></div>';
    });
    $('schList').innerHTML = h || '<div class="card"><div class="empty">לא נמצאו בתי ספר.</div></div>';
  }
  function rolesPage() {
    var ro = roleList();
    $('main').innerHTML = '<div class="card head"><h1>בעלי תפקידים לפי תפקיד</h1><div class="meta">בחרי תפקיד כדי לראות את כל בעלי התפקיד מכל בתי הספר</div></div>' +
      (ST.nispach !== 'ok' ? '<div class="card">' + pending('nispach') + '</div>' :
      '<div class="card"><div class="tiles">' + ro.list.map(function (r) {
        return '<button type="button" class="tile" data-go="r:' + esc(r) + '"><span><b>' + esc(shortRole(r)) + '</b><small>' + (ro.count[r] || 0) + ' ' +
          (r === SHERUT_ROLE ? 'בנות שירות' : 'בעלי תפקידים') + '</small></span></button>';
      }).join('') + '</div></div>');
  }
  function supsPage() {
    var done = allLoaded();
    $('main').innerHTML = '<div class="card head"><h1>מפקחים · מצב ושליחה</h1><div class="meta">לכל מפקח.ת: מצב בתי הספר, בעלי התפקידים ושליחת המצב במייל</div></div>' +
      '<div class="card"><div class="tiles">' + supNames().map(function (n) {
        var list = SCHOOLS.filter(function (s) { return supsOf(s).indexOf(n) > -1; });
        var bad = done ? list.filter(function (s) { return issues(BY[s.name]).length; }).length : 0;
        return '<button type="button" class="tile" data-go="p:' + esc(n) + '"><span><b>' + esc(n) + '</b><small>' + list.length + ' בתי ספר' +
          (done ? ' · ' + bad + ' עם חוסרים' : '') + '</small></span></button>';
      }).join('') + '</div></div>';
  }
  /* "חזרה" בראש עמוד פנימי */
  function backLink() {
    var at = FROM !== null ? FROM : section();
    var lbl = { '': 'לדשבורד', G: 'למה חסר לכל בית ספר', A: 'לדורש תשומת לב', S: 'לכל בתי הספר', R: 'לכל התפקידים', P: 'לכל המפקחים', F: 'לכל הטפסים' }[at];
    return lbl ? '<button type="button" class="back" data-go="' + at + '">→ ' + lbl + '</button>' : '';
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
    if (CUR === 'S') schoolsPage();
    else if (CUR === 'R') rolesPage();
    else if (CUR === 'P') supsPage();
    else if (CUR.charAt(0) === 's') school(BYSEMEL[CUR.slice(2)]);
    else if (CUR.charAt(0) === 'r') rolePage(CUR.slice(2));
    else if (CUR.charAt(0) === 'p') supPage(CUR.slice(2));
    else if (CUR.charAt(0) === 'm') mapList(CUR.slice(2));
    else if (CUR === 'G') overview();
    else if (CUR === 'A') attPage();
    else if (CUR === 'F') formsPage();
    else if (CUR === 'N') { if (adminView()) newFormPage(); else formsPage(); }
    else if (CUR.charAt(0) === 'f') formPage(CUR.slice(2));
    else dashboard();
  }

  /* ----- מה חסר לכל בית ספר (דף הבית) ----- */
  var LISTS = {};
  var GQ = '', GSUP = '', GKIND = '', GVIEW = 'all';
  try { GVIEW = localStorage.getItem('revital.gapview') === 'sup' ? 'sup' : 'all'; } catch (e) {}
  function gapRows() {
    var q = norm(GQ);
    return SCHOOLS.map(function (s) {
      var r = BY[s.name];
      var g = gaps(r).filter(function (x) { return !GKIND || x.k === GKIND; });
      return { r: r, g: g };
    }).filter(function (z) {
      if (!z.g.length) return false;
      if (GSUP && supsOf(z.r.s).indexOf(GSUP) < 0) return false;
      return !q || norm(z.r.s.name + ' ' + z.r.s.network + ' ' + z.r.s.semel).indexOf(q) > -1;
    });
  }
  /* שורה = כפתור שפותח את בית הספר + כפתור מייל למנהל.ת (מחוץ לכפתור — אין כפתור בתוך כפתור) */
  function gapLi(z, withSup) {
    return '<li class="gapw"><button type="button" class="gapi" data-go="s:' + esc(z.r.s.semel) + '"><span class="gn">' + esc(z.r.s.name) +
      (withSup ? '<small>' + esc(supsOf(z.r.s).join(' · ')) + '</small>' : '') + '</span><span class="gc">' +
      z.g.map(function (x) { return '<span class="chip k-' + x.k + '">' + esc(x.t) + '</span>'; }).join('') + '</span></button>' +
      principalBtn(z.r, gaps(z.r), 'pm-' + z.r.s.semel) + '</li>';
  }
  /* מייל למנהל.ת עם החוסרים — המייל מגיליון אנשי הקשר (שורת המנהל.ת לפי סמל) */
  function principalOf(r) {
    var cs = ST.contacts === 'ok' ? contactsFor(r.s) : [];
    var c = cs.filter(function (x) { return /מנהל/.test(String(x['תפקיד'] || x['סוג'] || '')); })[0] || cs[0];
    return { name: c ? c['שם'] : ((r.nispach && r.nispach.principal) || ''), mails: cleanMails([cMail(c)]) };
  }
  function principalMail(r, g) {
    var pr = principalOf(r), me = ($('meName').textContent || '').trim(), date = new Date().toLocaleDateString('he-IL');
    var hello = 'שלום' + (pr.name ? ' ' + pr.name : '') + ',';
    var html = '<div dir="rtl" style="text-align:right;font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:#16203c">' +
      esc(hello) + '<br><br>ריכזנו מה עוד חסר ב' + esc(r.s.name) + ', נכון ל-' + esc(date) + ':<ul style="margin:6px 0;padding-right:20px">' +
      g.map(function (x) { return '<li>' + esc(x.t) + '</li>'; }).join('') + '</ul>אשמח להשלמה בהקדם. אם משהו כאן לא מדויק, כתבו לי.<br><br>תודה,<br>' + esc(me) + '</div>';
    var text = hello + '\n\nריכזנו מה עוד חסר ב' + r.s.name + ', נכון ל-' + date + ':\n' +
      g.map(function (x) { return '• ' + x.t; }).join('\n') + '\n\nאשמח להשלמה בהקדם. אם משהו כאן לא מדויק, כתבו לי.\n\nתודה,\n' + me;
    return { to: pr.mails, cc: [], subject: 'מה חסר · ' + r.s.name, html: html, text: text };
  }
  function principalBtn(r, g, id) {
    if (!g.length) return '';
    if (ST.contacts !== 'ok') return '<span class="pmail muted">' + (ST.contacts === 'load' ? '…' : '') + '</span>';
    var M = principalMail(r, g);
    if (!M.to.length) return '<span class="pmail muted" title="אין מייל של המנהל.ת בגיליון אנשי הקשר">אין מייל למנהל.ת</span>';
    MAILS[id] = M;
    var href = esc(mailHref(M));
    return '<span class="pmail"><a class="btn sm primary" data-mail="' + esc(id) + '" href="' + href + '">' + I.mail + 'מייל למנהל.ת</a>' +
      (IS_MOBILE ? '' : '<a class="btn sm" href="' + href + '" title="בתוכנת המייל (Outlook)">Outlook</a>') + '</span>';
  }
  function gapsMail(name, rows) {
    var c = contactByName(name);
    var to = cleanMails([cMail(c)]);
    var date = new Date().toLocaleDateString('he-IL');
    var me = ($('meName').textContent || '').trim();
    var html = '<div dir="rtl" style="text-align:right;font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:#16203c">' +
      'שלום ' + esc(name) + ',<br><br>ריכזתי מה עוד חסר בבתי הספר שלך, נכון ל-' + esc(date) + ':<br>' +
      rows.map(function (z) {
        return '<div style="margin:12px 0 2px;font-weight:bold">' + esc(z.r.s.name) + '</div><ul style="margin:0;padding-right:20px">' +
          z.g.map(function (x) { return '<li>' + esc(x.t) + '</li>'; }).join('') + '</ul>';
      }).join('') + '<br>אשמח שתעבור/י על זה מול המנהלים.<br><br>תודה,<br>' + esc(me) + '</div>';
    var text = 'שלום ' + name + ',\n\nריכזתי מה עוד חסר בבתי הספר שלך, נכון ל-' + date + ':\n\n' +
      rows.map(function (z) { return z.r.s.name + ':\n' + z.g.map(function (x) { return '  • ' + x.t; }).join('\n'); }).join('\n\n') +
      '\n\nאשמח שתעבור/י על זה מול המנהלים.\n\nתודה,\n' + me;
    return { to: to, subject: 'מה חסר בבתי הספר שלך · ' + date, html: html, text: text };
  }
  function overview() {
    if (!$('gapBox')) {
      var kinds = GAP_KINDS.map(function (k) { return '<option value="' + k[0] + '"' + (GKIND === k[0] ? ' selected' : '') + '>' + esc(k[1]) + '</option>'; }).join('');
      $('main').innerHTML = '<div class="card head" id="gapBox"><h1>מה חסר לכל בית ספר</h1><div class="meta" id="gapMeta"></div>' +
        '<div class="kinds" id="gapKinds"></div>' +
        '<div class="filters"><input id="gq" type="search" placeholder="חיפוש בית ספר, רשת או סמל" value="' + esc(GQ) + '">' +
        '<select id="gkind"><option value="">כל סוגי החוסרים</option>' + kinds + '</select>' +
        '<select id="gsup"><option value="">כל המפקחים</option>' + supNames().map(function (n) {
          return '<option' + (n === GSUP ? ' selected' : '') + '>' + esc(n) + '</option>'; }).join('') + '</select></div>' +
        '<div class="views"><div class="seg" role="group" aria-label="תצוגה">' +
        '<button type="button" data-gview="all">רשימה אחת</button><button type="button" data-gview="sup">לפי מפקח.ת</button></div>' +
        '<div class="acts"><button class="btn" data-copy="gaps">' + I.copy + 'העתקה לאקסל</button></div></div></div><div id="gapList"></div>';
      $('gq').oninput = function () { GQ = this.value; drawGaps(); };
      $('gkind').onchange = function () { GKIND = this.value; drawGaps(); };
      $('gsup').onchange = function () { GSUP = this.value; drawGaps(); };
    }
    drawGaps();
  }
  /* ===== דשבורד = דף הבית (מיטל, 7.10.26) =====
     ברוכים הבאים (מלא בכניסה הראשונה, אחר כך שורה קצרה) · 4 מספרים · מצב המיפוי לפי צבע · סיכום מה חסר ודורש תשומת לב */
  var MAP_ST = [['ok', 'תפקוד יציב', 'ליווי שגרתי'], ['warn', 'פערים ממוקדים', 'ליווי מוגבר'], ['bad', 'סיכון מערכתי', 'התערבות צמודה'], ['none', 'אין מיפוי', '']];
  function mapState(r) {
    var ov = r.mipui && r.mipui[0] ? field(r.mipui[0], 'דירוג כולל') : '';
    if (ov.indexOf('תפקוד יציב') === 0) return 'ok';
    if (ov.indexOf('פערים') === 0) return 'warn';
    if (ov.indexOf('סיכון') === 0) return 'bad';
    return 'none';
  }
  var WELCOME_NOW = false;
  try { if (localStorage.getItem('revital.welcome') !== 'seen') { WELCOME_NOW = true; localStorage.setItem('revital.welcome', 'seen'); } } catch (e) { WELCOME_NOW = true; }
  /* מה מחכה לפעולה של המפקח.ת. היום: אישור השתלמות מוסדית. סוג חדש = עוד push ב-waitItems() */
  function waitItems() {
    var out = [];
    WAIT.forEach(function (w) {
      var byName = BY[SN.canon(String(w['בית הספר'] || '').trim())];
      var r = BYSEMEL[String(w['סמל מוסד'] || '').trim()] || (byName && BYSEMEL[String(byName.s.semel)]);
      if (!r) return;                      /* לא מבתי הספר שבתצוגה (?as=) */
      out.push({
        t: 'אישור השתלמות מוסדית', school: r.s.name, sups: supsOf(r.s),
        sub: [w['שם ההשתלמות'], w['חריגים'] ? 'חורגת מתנאי הסף — לשיחה עם המנהל.ת' : ''].filter(Boolean).join(' · '),
        when: String(w['חותמת זמן'] || '').split(' ')[0], href: String(w['קישור'] || ''), act: 'לאישור הבקשה'
      });
    });
    return out;
  }
  function dashWait() {
    var adm = adminView(), items = ST.wait === 'ok' ? waitItems() : [];
    var body = ST.wait === 'load' ? '<div class="empty">טוען…</div>'
      : ST.wait !== 'ok' ? '<div class="empty">לא הצלחתי לטעון כרגע.</div>'
      : !items.length ? '<div class="empty">' + (adm ? 'אין כרגע בקשות שממתינות למפקחים.' : 'אין כרגע משהו שמחכה לך.') + '</div>'
      : '<ul class="list wait">' + items.map(function (x) {
          return '<li><a class="li" href="' + esc(x.href) + '" target="_blank" rel="noopener"><span class="wt"><b>' + esc(x.t) + ' · ' + esc(x.school) + '</b>' +
            '<small>' + esc(x.sub) + (x.when ? ' · הוגשה ' + esc(x.when) : '') + (adm ? ' · ' + esc(x.sups.join(' · ')) : '') + '</small></span>' +
            '<span class="btn primary">' + esc(x.act) + ' ←</span></a></li>';
        }).join('') + '</ul>';
    return '<div class="card" id="dashWait"><h2 class="h2">' + (adm ? 'מה מחכה למפקחים' : 'מה מחכה לך?') +
      (items.length ? ' <span class="wn">' + items.length + '</span>' : '') + '</h2>' + body + '</div>';
  }
  function firstName() { return String(($('meName').textContent || '').trim()).split(/\s+/)[0] || ''; }
  function dashboard() {
    var n = SCHOOLS.length, done = allLoaded(), pk = ST.pk === 'ok';
    var gapN = done ? SCHOOLS.filter(function (s) { return issues(BY[s.name]).length; }).length : null;
    var attN = pk ? SCHOOLS.filter(function (s) { return flags(BY[s.name]).length; }).length : null;
    var riskN = pk ? SCHOOLS.filter(function (s) { return flags(BY[s.name]).some(function (x) { return x.k === 'risk'; }); }).length : null;
    var name = firstName(), h = '';

    h += WELCOME_NOW
      ? '<div class="card welcome" id="welcome"><h1>' + (name ? 'שלום ' + esc(name) + ', ' : '') + 'ברוכים הבאים לתובה</h1>' +
        '<p>שמחים שאת/ה איתנו. מטרת תובה היא לעזור לך לייעל את תהליכי העבודה ואת העבודה מול הצוותים השונים.</p>' +
        '<div class="acts"><button type="button" class="btn primary" data-tour-start>' + I.flag + 'לסיור במערכת</button>' +
        '<button type="button" class="btn" id="welcomeOk">לדשבורד</button></div></div>'
      : '<div class="hello" id="hello">' + (name ? 'שלום ' + esc(name) + ' · ' : '') + 'טוב לראות אותך שוב' +
        '<button type="button" class="linkbtn" data-tour-start>' + I.flag + 'סיור במערכת</button></div>';

    h += dashWait();

    /* "כמה מתוך N" עם פס (מיטל, 7.10.26: חלופה ב׳, בצבעי הלוגו) — המספר ביחס לכלל בתי הספר */
    function stat(go, num, label, hint, color, extra) {
      var pc = num === null || !n ? 0 : Math.round(100 * num / n);
      return '<button type="button" class="pstat" data-go="' + go + '"' + (extra || '') + '><span class="t">' + label + '</span>' +
        '<span class="v">' + (num === null ? '…' : num) + ' <em>מתוך ' + n + '</em></span>' +
        '<span class="bar"><i style="width:' + pc + '%;background:' + color + '"></i></span><span class="hint">' + hint + '</span></button>';
    }
    h += '<div id="dashStats"><div class="head64"><b>' + n + '</b> בתי ספר</div><div class="pstats">' +
      stat('G', gapN, 'עם חוסרים להשלמה', 'נספח, השתלמויות, מנור, סל תוכניות', 'var(--brand)', ' data-gk=""') +
      stat('A', attN, 'דורשים תשומת לב', 'ביקור, מדדים בסיכון, יעדים', 'var(--brand-sky)', ' data-ak=""') +
      stat('A', riskN, 'עם מדד במצב סיכון', 'לפי המיפוי האחרון', 'var(--blue)', ' data-ak="risk"') + '</div></div>';
    h += '<div data-tovi-insight="focus:all"></div>';   /* תובי: על מה להתמקד השבוע — אותה תוצאה גם ב"דורש תשומת לב" (tovi.js) */

    /* מצב במיפוי — פס אחד לפי הדירוג הכולל, עם מקרא שהוא גם הטבלה */
    var cnt = { ok: 0, warn: 0, bad: 0, none: 0 };
    if (pk) SCHOOLS.forEach(function (s) { cnt[mapState(BY[s.name])]++; });
    h += '<div class="card" id="dashMap"><h2 class="h2">מצב בתי הספר במיפוי</h2><div class="meta">לפי הדירוג הכולל במיפוי האחרון (מרץ 2026) · לחיצה על צבע מציגה את בתי הספר</div>' +
      (!pk ? '<div class="empty">' + (ST.pk === 'load' ? 'טוען…' : 'נתוני המיפוי לא נטענו כרגע.') + '</div>' :
        '<div class="mbar" role="img" aria-label="' + MAP_ST.map(function (m) { return m[1] + ' ' + cnt[m[0]]; }).join(', ') + '">' +
        MAP_ST.filter(function (m) { return cnt[m[0]]; }).map(function (m) {
          return '<button type="button" class="seg-' + m[0] + '" style="flex-grow:' + cnt[m[0]] + '" data-go="m:' + m[0] + '" title="' + m[1] + ': ' + cnt[m[0]] + ' בתי ספר">' +
            (cnt[m[0]] / n > 0.07 ? cnt[m[0]] : '') + '</button>';
        }).join('') + '</div>' +
        '<ul class="mleg">' + MAP_ST.map(function (m) {
          return '<li><button type="button" data-go="m:' + m[0] + '"><i class="sw seg-' + m[0] + '"></i><b>' + cnt[m[0]] + '</b> ' + m[1] +
            (m[2] ? '<small>' + m[2] + '</small>' : '') + '</button></li>';
        }).join('') + '</ul>') + '</div>';

    /* סיכום — כמה בתי ספר בכל סוג, לחיצה פותחת את הרשימה מסוננת */
    var gc = {}, ac = {};
    SCHOOLS.forEach(function (s) {
      gaps(BY[s.name]).forEach(function (x) { gc[x.k] = (gc[x.k] || 0) + 1; });
      flags(BY[s.name]).forEach(function (x) { ac[x.k] = (ac[x.k] || 0) + 1; });
    });
    function chips(kinds, c, attr, ready) {
      return kinds.map(function (k) {
        return '<button type="button" class="chip k-' + k[0] + '" ' + attr + '="' + k[0] + '">' + (ready(k[0]) ? (c[k[0]] || 0) : '…') + ' · ' + esc(k[1]) + '</button>';
      }).join('');
    }
    h += '<div class="card" id="dashSum"><h2 class="h2">חוסרים ותשומת לב</h2>' +
      '<div class="sumrow"><button type="button" class="sumh" data-go="G">מה חסר לכל בית ספר ←</button><div class="gc">' +
      chips(GAP_KINDS, gc, 'data-gk', function (k) { return ST[k] === 'ok'; }) + '</div></div>' +
      '<div class="sumrow"><button type="button" class="sumh" data-go="A">דורש תשומת לב ←</button><div class="gc">' +
      chips(FLAG_KINDS, ac, 'data-ak', function (k) { return k === 'visit' ? (pk && ST.mv === 'ok') : pk; }) + '</div></div></div>';

    h += dashForms();
    $('main').innerHTML = h;
    var ok = $('welcomeOk');
    if (ok) ok.onclick = function () { WELCOME_NOW = false; dashboard(); };
  }
  /* בתי הספר בצבע אחד של המיפוי */
  function mapList(k) {
    var m = MAP_ST.filter(function (x) { return x[0] === k; })[0] || MAP_ST[3];
    var list = SCHOOLS.filter(function (s) { return ST.pk === 'ok' && mapState(BY[s.name]) === k; });
    $('main').innerHTML = backLink() + '<div class="card head"><h1><i class="sw seg-' + k + '"></i> ' + esc(m[1]) + '</h1><div class="meta">' +
      (ST.pk !== 'ok' ? 'טוען…' : list.length + ' בתי ספר' + (m[2] ? ' · ' + m[2] : '') + ' · לפי הדירוג הכולל במיפוי האחרון') + '</div></div>' +
      '<div class="card"><div class="tiles">' + list.map(function (s) {
        var r = BY[s.name], rk = riskOf(r).length;
        return '<button type="button" class="tile" data-go="s:' + esc(s.semel) + '"><i class="sw seg-' + k + '"></i><span><b>' + esc(s.name) + '</b><small>' +
          esc(supsOf(s).join(' · ')) + (rk ? ' · ' + rk + ' במצב סיכון' : '') + '</small></span></button>';
      }).join('') + '</div>' + (list.length ? '' : '<div class="empty">אין בתי ספר בקבוצה הזו.</div>') + '</div>';
  }

  /* דורש תשומת לב — עמוד משלו בתפריט, עם סינון משלו */
  function attPage() {
    if (!$('attBox')) {
      $('main').innerHTML = '<div class="card head" id="attBox"><h1>דורש תשומת לב</h1><div class="meta" id="attMeta"></div>' +
        '<div class="kinds" id="attKinds"></div>' +
        '<div class="filters"><select id="asup"><option value="">כל המפקחים</option>' + supNames().map(function (n) {
          return '<option' + (n === ASUP ? ' selected' : '') + '>' + esc(n) + '</option>'; }).join('') + '</select></div>' +
        '<div class="views"><div class="seg" role="group" aria-label="תצוגה">' +
        '<button type="button" data-aview="all">רשימה אחת</button><button type="button" data-aview="sup">לפי מפקח.ת</button></div>' +
        '<div class="acts"><button class="btn" data-copy="att">' + I.copy + 'העתקה לאקסל</button></div></div>' +
        '<div data-tovi-insight="focus:all"></div></div><div id="attList"></div>';   /* תובי: על מה להתמקד השבוע (tovi.js) */
      $('asup').onchange = function () { ASUP = this.value; drawAtt(); };
    }
    drawAtt();
  }

  var ASUP = '', AKIND = '', AVIEW = 'all';
  try { AVIEW = localStorage.getItem('revital.attview') === 'sup' ? 'sup' : 'all'; } catch (e) {}
  function attRows() {
    return SCHOOLS.map(function (s) {
      var r = BY[s.name];
      return { r: r, g: flags(r).filter(function (x) { return !AKIND || x.k === AKIND; }) };
    }).filter(function (z) { return z.g.length && (!ASUP || supsOf(z.r.s).indexOf(ASUP) > -1); });
  }
  function attLi(z, withSup) {
    var onlyAkl = z.g.every(function (x) { return x.k === 'aklim'; });
    return '<li class="gapw"><button type="button" class="gapi" data-go="s:' + esc(z.r.s.semel) + (onlyAkl ? '&t=akl' : '') + '"><span class="gn">' + esc(z.r.s.name) +
      (withSup ? '<small>' + esc(supsOf(z.r.s).join(' · ')) + '</small>' : '') + '</span><span class="gc">' +
      z.g.map(function (x) { return '<span class="chip k-' + x.k + '">' + esc(x.t) + '</span>'; }).join('') + '</span></button></li>';
  }
  function attMail(name, rows) {
    var c = contactByName(name), to = cleanMails([cMail(c)]);
    var date = new Date().toLocaleDateString('he-IL'), me = ($('meName').textContent || '').trim();
    var html = '<div dir="rtl" style="text-align:right;font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:#16203c">' +
      'שלום ' + esc(name) + ',<br><br>אלה בתי הספר שלך שדורשים תשומת לב, נכון ל-' + esc(date) + ':<br>' +
      rows.map(function (z) {
        return '<div style="margin:12px 0 2px;font-weight:bold">' + esc(z.r.s.name) + '</div><ul style="margin:0;padding-right:20px">' +
          z.g.map(function (x) { return '<li>' + esc(x.t) + '</li>'; }).join('') + '</ul>';
      }).join('') + '<br>אשמח שנדבר על זה.<br><br>תודה,<br>' + esc(me) + '</div>';
    var text = 'שלום ' + name + ',\n\nאלה בתי הספר שלך שדורשים תשומת לב, נכון ל-' + date + ':\n\n' +
      rows.map(function (z) { return z.r.s.name + ':\n' + z.g.map(function (x) { return '  • ' + x.t; }).join('\n'); }).join('\n\n') +
      '\n\nאשמח שנדבר על זה.\n\nתודה,\n' + me;
    return { to: to, subject: 'דורש תשומת לב · בתי הספר שלך · ' + date, html: html, text: text };
  }
  function drawAtt() {
    if (!$('attList')) return;
    Array.prototype.forEach.call(document.querySelectorAll('[data-aview]'), function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-aview') === AVIEW); });
    var cnt = {};
    SCHOOLS.forEach(function (s) { flags(BY[s.name]).forEach(function (x) { cnt[x.k] = (cnt[x.k] || 0) + 1; }); });
    function stOf(k) { return k === 'visit' ? (ST.pk === 'ok' && ST.mv === 'ok' ? 'ok' : (ST.pk === 'load' || ST.mv === 'load' ? 'load' : 'err')) : ST.pk; }
    $('attKinds').innerHTML = FLAG_KINDS.map(function (k) {
      var st = stOf(k[0]);
      return '<button type="button" class="kind k-' + k[0] + (AKIND === k[0] ? ' on' : '') + '" data-akind="' + k[0] + '"><b>' +
        (st === 'ok' ? (cnt[k[0]] || 0) : (st === 'load' ? '…' : '—')) + '</b>' + esc(k[1]) + '</button>';
    }).join('');
    var rows = attRows();
    var fail = [];
    if (ST.pk === 'err') fail.push('מיפוי, ביקורים ויעדים');
    if (ST.mv === 'err') fail.push('הביקורים מהבית של המפקח');
    $('attMeta').innerHTML = 'אותות לפיקוח, לא דברים שבית הספר צריך להשלים · ' + rows.length + ' בתי ספר' +
      (ST.pk === 'load' || ST.mv === 'load' ? ' · טוען…' : '') +
      (fail.length ? ' · <span style="color:var(--bad)">לא נטען: ' + esc(fail.join(', ')) + '</span>' : '');
    LISTS.att = ['בית ספר', 'מפקח.ת', 'דורש תשומת לב'].join('\t') + '\n' + rows.map(function (z) {
      return [z.r.s.name, supsOf(z.r.s).join(' · '), z.g.map(function (x) { return x.t; }).join(' | ')].join('\t');
    }).join('\n');
    var h = '';
    if (!rows.length) h = '<div class="card"><div class="empty">' + (ST.pk === 'load' ? 'טוען…' : 'אין בתי ספר שמתאימים לסינון.') + '</div></div>';
    else if (AVIEW === 'all') h = '<div class="card"><ul class="glist">' + rows.map(function (z) { return attLi(z, true); }).join('') + '</ul></div>';
    else {
      var bySup = {};
      rows.forEach(function (z) { supsOf(z.r.s).forEach(function (n) { if (!ASUP || n === ASUP) (bySup[n] = bySup[n] || []).push(z); }); });
      Object.keys(bySup).sort(function (a, b) { return a.localeCompare(b, 'he'); }).forEach(function (n, k) {
        var list = bySup[n], M = attMail(n, list);
        h += sec('att-' + n, I.users, n, tag('', list.length + ' בתי ספר'),
          '<div class="acts row-end">' + (M.to.length ? mailBtn('a' + k, M, 'שליחת הרשימה ל' + n) : '<span class="small">אין מייל של המפקח.ת בגיליון אנשי הקשר</span>') + '</div>' +
          '<ul class="glist">' + list.map(function (z) { return attLi(z, false); }).join('') + '</ul>');
      });
    }
    $('attList').innerHTML = h;
  }
  function drawGaps() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-gview]'), function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-gview') === GVIEW); });
    var waiting = ['nispach', 'menor', 'bs', 'rg', 'sal'].filter(function (k) { return ST[k] === 'load'; }).length;
    var failed = GAP_KINDS.filter(function (k) { return ST[k[0]] === 'err'; }).map(function (k) { return k[1]; });
    var rows = gapRows();
    /* מונה לכל סוג — על כל בתי הספר, בלי הסינונים */
    var cnt = {};
    SCHOOLS.forEach(function (s) { gaps(BY[s.name]).forEach(function (x) { cnt[x.k] = (cnt[x.k] || 0) + 1; }); });
    $('gapKinds').innerHTML = GAP_KINDS.map(function (k) {
      var st = ST[k[0]];
      return '<button type="button" class="kind k-' + k[0] + (GKIND === k[0] ? ' on' : '') + '" data-gkind="' + k[0] + '"><b>' +
        (st === 'ok' ? (cnt[k[0]] || 0) : (st === 'load' ? '…' : '—')) + '</b>' + esc(k[1]) + '</button>';
    }).join('') + '<div class="kind soon"><b>בבנייה</b>הגשת תוכנית עבודה</div>';
    $('gapMeta').innerHTML = rows.length + ' בתי ספר עם חוסרים' + (waiting ? ' · עוד ' + waiting + ' מקורות נטענים…' : '') +
      (failed.length ? ' · <span style="color:var(--bad)">לא נטען: ' + esc(failed.join(', ')) + '</span>' : '') +
      '';
    LISTS.gaps = ['בית ספר', 'מפקח.ת', 'מה חסר'].join('\t') + '\n' + rows.map(function (z) {
      return [z.r.s.name, supsOf(z.r.s).join(' · '), z.g.map(function (x) { return x.t; }).join(' | ')].join('\t');
    }).join('\n');
    MAILS = {};
    var h = '';
    if (!rows.length) h = '<div class="card"><div class="empty">' + (waiting ? 'טוען…' : 'אין חוסרים שמתאימים לסינון.') + '</div></div>';
    else if (GVIEW === 'all') h = '<div class="card"><ul class="glist">' + rows.map(function (z) { return gapLi(z, true); }).join('') + '</ul></div>';
    else {
      var bySup = {};
      rows.forEach(function (z) { supsOf(z.r.s).forEach(function (n) { if (!GSUP || n === GSUP) (bySup[n] = bySup[n] || []).push(z); }); });
      Object.keys(bySup).sort(function (a, b) { return a.localeCompare(b, 'he'); }).forEach(function (n, k) {
        var list = bySup[n], M = gapsMail(n, list);
        h += sec('gap-' + n, I.users, n, tag('', list.length + ' בתי ספר עם חוסרים'),
          '<div class="acts row-end">' + (M.to.length ? mailBtn('g' + k, M, 'שליחת הרשימה ל' + n) : '<span class="small">אין מייל של המפקח.ת בגיליון אנשי הקשר</span>') + '</div>' +
          '<ul class="glist">' + list.map(function (z) { return gapLi(z, false); }).join('') + '</ul>');
      });
    }
    $('gapList').innerHTML = h;
    drawAtt();   /* drawGaps מאפס את MAILS — ציור מחדש רושם שוב את מיילי "דורש תשומת לב" */
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
    if (q.note) return esc(q.note);
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
    var s = r.s, x = r.nispach, h = '', P = {};
    var principal = (x && x.principal) || (r.matz && r.matz.principal) || '';
    var cs = ST.contacts === 'ok' ? contactsFor(s) : [];
    var office = cs.map(function (c) { return c['טלפון מוסד']; }).filter(Boolean)[0];
    var p = rate(r);
    loadMef(String(s.semel));

    /* כותרת — תמיד פתוחה */
    h += backLink() + '<div class="card head"><h1>' + esc(s.name) + '</h1><div class="meta">' +
      esc(s.network) + ' · סמל <b>' + esc(s.semel) + '</b> · ' + esc(s.district) + ' · ' + esc(s.sector) +
      (office ? ' · טלפון בית הספר ' + telA(office) : '') + '</div>' +
      '<div class="facts">' +
      '<div class="fact"><span>תלמידים</span><b>' + (studentsOf(r) || (ST.matz === 'load' || ST.pk === 'load' ? '…' : '—')) + '</b></div>' +
      '<div class="fact"><span>כיתות</span><b>' + (x && x.classes ? x.classes : (ST.nispach === 'ok' ? '—' : '…')) + '</b></div>' +
      '<div class="fact"><span>בעלי תפקידים</span><b>' + (x && x.submitted ? x.people.length : (ST.nispach === 'ok' ? '—' : '…')) + '</b></div>' +
      '<div class="fact"><span>מורים שנרשמו למנור</span><b class="' + (p === null ? '' : (p < MENOR_LOW ? 'bad' : 'ok')) + '">' +
        (r.menor && r.menor.t ? r.menor.r + '/' + r.menor.t : (ST.menor === 'ok' ? '—' : '…')) + '</b></div>' +
      '</div>' + (function () {
        var g = gaps(r);
        if (!g.length) return '';
        return '<div class="views"><div class="gc">' + g.map(function (x) { return '<span class="chip k-' + x.k + '">' + esc(x.t) + '</span>'; }).join('') +
          '</div>' + principalBtn(r, g, 'pm-head') + '</div>';
      })() + '</div>' +
      '<div data-tovi-slot="' + esc(s.semel) + '"></div>';   /* תובי: תדריך לפני ביקור (tovi.js) */

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
    P.contacts = sec('contacts', I.phone, 'אנשי קשר', cSum, cBody);

    /* מגמות */
    var megs = (s.megamot || []).filter(function (m) { return m.name; });
    P.megamot = sec('megamot', I.book, 'מגמות', megs.length + ' מגמות',
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
    P.roles = sec('roles', I.users, 'בעלי תפקידים', rSum, rBody);

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
    P.menor = sec('menor', I.chart, 'מנור · רישום המורים', mSum, mBody);

    /* השתלמויות: מוסדית + רישום להשתלמויות המקוונות */
    var hBody = '', hSum = [];
    if (ST.bs !== 'ok') { hBody += pending('bs'); }
    else if (!r.bs) { hSum.push(tag('', 'מוסדית לא הוגשה')); hBody += '<div class="miss">' + tag('', 'השתלמות מוסדית לא הוגשה') + '</div>'; }
    else {
      var bst = r.bs.status, bcls = bst.indexOf('מאושר') > -1 ? 'ok' : (bst.indexOf('ממתין') > -1 ? 'warn' : '');
      hSum.push(tag(bcls, 'מוסדית: ' + bst.split(' — ')[0]));
      hBody += '<div class="person"><div class="tx"><div class="r">השתלמות מוסדית</div><div class="nm">' + esc(r.bs.name) + '</div>' +
        '<div class="x">' + tag(bcls, bst) + (r.bs.ts ? ' · הוגשה ' + esc(r.bs.ts.split(' ')[0]) : '') + '</div></div></div>';
    }
    if (ST.rg !== 'ok') { hBody += pending('rg'); }
    else {
      var tot = rgTotal(r);
      hSum.push(tot ? tot + ' נרשמו' : tag('', 'אין נרשמים'));
      hBody += '<h4 class="subh" style="margin-top:12px">רישום להשתלמויות המקוונות</h4>' + (tot ? '<ul class="megs">' + WS.map(function (w) {
        var n = Number(r.rg && r.rg[w[0]]) || 0;
        return '<li>' + esc(w[1]) + '<small>' + (n ? n + ' נרשמו' : 'אף אחד לא נרשם') + '</small></li>';
      }).join('') + '</ul>' : '<div class="empty">אף אחד מבית הספר עוד לא נרשם להשתלמויות.</div>');
      hBody += '<div class="small"><a href="' + BS_LINK + '" target="_blank" rel="noopener">מעקב ההשתלמות המוסדית</a> · ' +
        '<a href="' + RG_LINK + '" target="_blank" rel="noopener">מעקב הרישום להשתלמויות</a></div>';
      hBody += '<div data-tovi-insight="hisht:' + esc(s.semel) + '"></div>';   /* תובי: איזו השתלמות תקדם את בית הספר (tovi.js) */
    }
    P.hisht = sec('hisht', I.book, 'השתלמויות', hSum.join(' · ') || 'טוען…', hBody);

    /* בנות שירות */
    var sh = r.sherut || [];
    P.sherut = sec('sherut', I.users, 'בנות שירות',
      ST.sherut === 'ok' ? (sh.length ? (sh.length === 1 ? 'בת שירות אחת' : sh.length + ' בנות שירות') : 'אין') : (ST.sherut === 'load' ? 'טוען…' : 'לא נטען'),
      ST.sherut !== 'ok' ? pending('sherut') : (sh.length ? sh.map(function (row) {
        var q = sherutPerson(row);
        return personHtml('בת שירות' + (q.detail ? ' · ' + q.detail : ''), q.name, q.phone, q.email, esc(q.note));
      }).join('') : '<div class="empty">אין בנות שירות משובצות בבית הספר הזה.</div>'));

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
    P.visits = sec('visits', I.doc, 'ביקורי פיקוח ודוחות', vSum, vBody);
    P.tasks = sec('tasks', I.check, 'משימות', tSum, tBody);

    /* לשוניות (מיטל, 7.10.26: "הדף ארוך מדי") — הכותרת תמיד למעלה, מתחתיה תפריט משנה */
    var K = pikuahSecs(r);
    var ppl = cSum, lrn = [mSum, hSum.join(' · ')].filter(Boolean).join(' · ');
    var SL = salTab(r);
    var AK = aklimTab(r);
    var fl = flags(r);
    var T = {
      ov: (fl.length ? '<div class="card"><p class="eyebrow">' + I.chart + 'דורש תשומת לב</p><div class="gc">' +
            fl.map(function (z) {
              return z.k === 'aklim' ? '<button type="button" class="chip k-aklim" data-tab="akl">' + esc(z.t) + '</button>'
                : '<span class="chip k-' + z.k + '">' + esc(z.t) + '</span>';
            }).join('') + '</div></div>' : '') +
          '<div class="card"><ul class="tabsum">' +
          [['ppl', I.users, ppl], ['map', I.chart, K.sumMap], ['akl', I.chart, AK.sum], ['vis', I.doc, [K.sumVis, vSum].filter(Boolean).join(' · ')], ['sal', I.doc, SL.sum], ['lrn', I.book, lrn]]
            .map(function (z) {
              var lbl = TABS.filter(function (t) { return t[0] === z[0]; })[0][1];
              return '<li><button type="button" data-tab="' + z[0] + '"><span class="st">' + z[1] + esc(lbl) + '</span><span class="sum">' + (z[2] || '') + '</span><span class="go">←</span></button></li>';
            }).join('') + '</ul></div>' + schoolForms(s),
      ppl: P.contacts + P.roles + P.sherut,
      map: K.yaad + K.mipui,
      akl: AK.body,
      vis: '<div data-tovi-insight="visits:' + esc(s.semel) + '"></div>' + K.bik + P.visits + P.tasks,   /* תובי: תובנות מהביקורים (tovi.js) */
      sal: SL.body + (r.sal ? '<div data-tovi-insight="sal:' + esc(s.semel) + '"></div>' : ''),   /* תובי: הסל מול הצרכים (tovi.js) */
      lrn: P.megamot + P.hisht + P.menor
    };
    h += '<nav class="tabs" id="schTabs" role="tablist" aria-label="חלקי העמוד">' + TABS.map(function (t) {
      return '<button type="button" role="tab" data-tab="' + t[0] + '" aria-selected="' + (STAB === t[0]) + '">' + esc(t[1]) + '</button>';
    }).join('') + '</nav><div class="tabp" role="tabpanel">' + (T[STAB] || T.ov) + '</div>';
    $('main').innerHTML = h;
    /* בנייד הלשוניות גוללות לרוחב — הלשונית הנבחרת נכנסת למסך (רק בתוך הפס, בלי לגלול את הדף) */
    var nav = $('schTabs'), sel = nav && nav.querySelector('[aria-selected="true"]');
    if (sel) {
      var a = nav.getBoundingClientRect(), b = sel.getBoundingClientRect();
      if (b.right > a.right) nav.scrollLeft += b.right - a.right + 8;
      else if (b.left < a.left) nav.scrollLeft -= a.left - b.left + 8;
    }
  }

  /* ----- לשונית אקלים: כרטיס לכל קהל, פס לכל ממד מול ההשוואה, חץ מול תשפ"ה, 3 ההיגדים החלשים ----- */
  function aklimTab(r) {
    var head = '<p class="eyebrow">' + I.chart + 'שאלון אקלים תשפ״ו</p>';
    if (ST.akl !== 'ok') {
      var sm = ST.pk === 'load' ? 'טוען…' : 'לא נטען';
      return { sum: sm, body: '<div class="card">' + head + (ST.pk === 'load' ? pending('pk') : '<div class="empty">נתוני האקלים לא נטענו כרגע. רענון הדף ינסה שוב.</div>') + '</div>' };
    }
    if (!r.akl.length) return { sum: 'לא התקבל דוח', body: '<div class="card">' + head + '<div class="empty">לא התקבל דוח אקלים תשפ״ו לבית הספר הזה.</div></div>' };

    var cards = [], by = {};
    r.akl.forEach(function (row) {
      var k = row['קהל'] + '|' + (row['יחידה'] || '');
      if (!by[k]) { by[k] = []; cards.push(k); }
      by[k].push(row);
    });
    cards.sort(function (a, b) { return AKL_AUD.indexOf(a.split('|')[0]) - AKL_AUD.indexOf(b.split('|')[0]) || a.localeCompare(b); });
    var nBad = aklBad(r).length;

    function n1(v) { var x = aklNum(v); return x === null ? '' : String(Math.round(x * 10) / 10); }
    function bar(row) {
      var cur = aklNum(row['תשפ"ו']), cmp = aklNum(row['השוואה']), chg = aklNum(row['שינוי מתשפ"ה']);
      var low = !aklDup(row) && aklLow(row), clamp = function (x) { return Math.max(0, Math.min(100, x)); };
      var tip = 'תשפ״ו ' + n1(cur) + (cmp !== null ? ' · ' + (aklCmpName(row) === 'דומים' ? 'בתי ספר דומים ' : 'קבוצת התייחסות ') + n1(cmp) : '') +
        (aklNum(row['תשפ"ה']) !== null ? ' · תשפ״ה ' + n1(row['תשפ"ה']) : '') + (aklNum(row['תשפ"ד']) !== null ? ' · תשפ״ד ' + n1(row['תשפ"ד']) : '');
      var arrow = chg === null ? '' : '<span class="akd' + (aklDrop(row) && !aklFew(row) ? ' bad' : '') + '">' +
        (Math.abs(chg) < 0.5 ? '= ' : (chg > 0 ? '↑ ' : '↓ ')) + Math.abs(Math.round(chg)) + '</span>';
      return '<li class="akb' + (low ? ' low' : '') + '"><div class="akn">' + esc(row['ממד']) + '</div>' +
        '<div class="akr"><div class="akt" title="' + esc(tip) + '"><i class="akf" style="width:' + clamp(cur || 0) + '%"></i>' +
        (cmp !== null ? '<i class="akc" style="inset-inline-start:' + clamp(cmp) + '%"></i>' : '') + '</div>' +
        '<div class="akv"><b>' + Math.round(cur) + '</b>' + (cmp !== null ? '<span>' + aklCmpName(row) + ' ' + Math.round(cmp) + '</span>' : '') + arrow + '</div></div>' +
        (low ? '<div class="akw">' + esc(aklReason(row)) + '</div>' : '') +
        (aklDup(row) ? '<div class="akw muted">אותו ממד כמו בכרטיס המורים — מסומן שם</div>' : '') + '</li>';
    }

    var body = cards.map(function (k) {
      var rows = by[k], aud = k.split('|')[0], unit = k.split('|')[1], f = rows[0];
      var few = aklFew(f), bad = rows.filter(function (x) { return !aklDup(x) && aklLow(x); }).length;
      var resp = aklNum(f['משיבים']), reg = aklNum(f['רשומים']), rt = aklNum(f['שיעור משיבים']);
      var sum = (resp !== null ? resp + ' משיבים' + (reg && reg >= resp ? ' מתוך ' + reg : '') : '') +
        (few ? ' ' + tag('warn', 'מעט משיבים') : (bad ? ' ' + tag('k-aklim', bad === 1 ? 'ממד אחד חריג' : bad + ' ממדים חריגים') : ''));
      var kinds = rows.map(function (x) { return x['סוג השוואה']; }).filter(Boolean);
      var weak = r.aklWeak.filter(function (x) { return x['קהל'] === aud && String(x['יחידה'] || '') === unit; })
        .sort(function (a, b) { return Number(a['דירוג בכרטיס']) - Number(b['דירוג בכרטיס']); });
      var b = '<div class="small akkey">הפס: ציון תשפ״ו (0–100)' + (kinds.length ? ' · הקו: ' + esc(kinds[0]) : '') + ' · החץ: שינוי מתשפ״ה' +
        (rt !== null && rt <= 100 ? ' · שיעור משיבים ' + rt + '%' : '') + '</div>' +
        (few ? '<div class="note">ענו רק ' + resp + '. הציונים פחות אמינים, ולכן הכרטיס לא נכנס ל"דורש תשומת לב".</div>' : '') +
        '<ul class="akl">' + rows.map(bar).join('') + '</ul>' +
        (weak.length ? '<details class="vis" style="margin-top:12px"><summary><b>3 ההיגדים החלשים</b></summary><div class="vb"><ul class="lvl">' +
          weak.map(function (x) {
            return '<li><span>' + esc(x['היגד']) + '<small style="display:block;color:var(--muted)">' + esc(x['ממד']) +
              (String(x['אחוז במידה רבה / מאוד']) !== '' ? ' · ' + esc(x['אחוז במידה רבה / מאוד']) + '% במידה רבה / רבה מאוד' : '') + '</small></span>' +
              '<span class="chip warn">' + Math.round(aklNum(x['ממוצע'])) + '</span></li>';
          }).join('') + '</ul></div></details>' : '');
      return sec('akl-' + aud + unit, aud === 'פדגוגיה' ? I.book : I.users,
        aud + (unit ? ' · ' + unit : ''), sum, b);
    }).join('');

    var got = AKL_AUD.filter(function (a) { return cards.some(function (k) { return k.split('|')[0] === a; }); });
    return {
      sum: nBad ? tag('k-aklim', nBad === 1 ? 'ממד אחד חריג' : nBad + ' ממדים חריגים') : 'אין פער או ירידה',
      body: '<div class="card">' + head + '<div class="small">התקבלו: ' + esc(got.join(' · ')) +
        (got.length < 3 ? ' · לא התקבל: ' + esc(AKL_AUD.filter(function (a) { return got.indexOf(a) < 0; }).join(' · ')) : '') +
        ' · חריג = ' + AKL_GAP + ' נקודות ומעלה מתחת להשוואה, או ירידה של ' + AKL_GAP + ' ומעלה מתשפ״ה</div></div>' +
        '<div data-tovi-insight="aklim:' + esc(r.s.semel) + '"></div>' + body   /* תובי: תובנות על האקלים (tovi.js) */
    };
  }

  /* ----- לשונית סל תוכניות: סטטוס, הערת האישור, המסמך (בדרייב של אורט, משותף עם רויטל ועם המפקח.ת) ----- */
  function salTab(r) {
    if (ST.sal !== 'ok') return { sum: ST.sal === 'load' ? 'טוען…' : 'לא נטען', body: '<div class="card">' + pending('sal') + '</div>' };
    var x = r.sal;
    if (!x) return { sum: tag('k-sal', 'לא הוגש'),
      body: '<div class="card"><p class="eyebrow">' + I.doc + 'סל תוכניות להעשרה וטיפוח הלומד · תשפ״ז</p><div class="gc"><span class="chip k-sal">סל התוכניות לא הוגש</span></div>' +
        '<div class="small">אין מסמך הגשה של בית הספר בקובץ שהתקבל.</div></div>' };
    var note = String(x['הערה'] || '').trim(), fid = String(x['מזהה קובץ בדרייב'] || '').trim();
    return {
      sum: tag('ok', 'הוגש') + (note ? ' ' + tag('warn', note) : ''),
      body: '<div class="card"><p class="eyebrow">' + I.doc + 'סל תוכניות להעשרה וטיפוח הלומד · תשפ״ז</p>' +
        '<div class="gc">' + tag('ok', 'הוגש') + '</div>' +
        (note ? '<div class="note" style="margin-top:10px"><b>הערה לאישור:</b> ' + esc(note) + '</div>' : '') +
        '<div class="acts" style="margin-top:10px">' + (fid
          ? '<button type="button" class="btn primary" data-saldoc="' + esc(r.s.semel) + '">' + I.doc + 'פתיחת המסמך</button>'
          : '<span class="small">המסמך עוד לא הועלה לדרייב.</span>') + '</div>' +
        '<div class="small">' + esc(x['שם הקובץ'] || '') + ' · המסמך נפתח דרך הבית, רק למי שבית הספר משויך אליו/ה.</div></div>' +
        salSummary(x)
    };
  }

  /* תקציר המסמך (עמודת "תקציר" בגיליון, JSON) — מוכן מראש מכל מסמך, כולל סרוקים. משמש גם את הבוט */
  function salSummary(x) {
    var j = null;
    try { j = JSON.parse(String(x['תקציר'] || '')); } catch (e) { j = null; }
    if (!j) return '';
    var goals = Object.keys(j.goals || {}).filter(function (k) { return String(j.goals[k] || '').trim(); });
    var progs = j.programs || [];
    var facts = [j.approved_students ? ['תלמידים מאושרים', j.approved_students] : null, j.approved_classes ? ['כיתות מאושרות', j.approved_classes] : null,
                 progs.length ? ['תוכניות בסל', progs.length] : null].filter(Boolean);
    return '<div class="card"><p class="eyebrow">' + I.book + 'מה בית הספר הגיש · תקציר' +
      '<span class="end">' + (j.source === 'סרוק' ? 'נקרא ממסמך סרוק · ' : '') + 'אמינות ' + esc(j.confidence || '') + '</span></p>' +
      (facts.length ? '<div class="facts">' + facts.map(function (f) { return '<div class="fact"><span>' + esc(f[0]) + '</span><b>' + esc(f[1]) + '</b></div>'; }).join('') + '</div>' : '') +
      ((j.megamot || []).length ? '<div class="note" style="margin-top:10px"><b>מגמות:</b> ' + esc(j.megamot.join(', ')) + '</div>' : '') +
      (j.background ? '<div class="note"><b>רקע:</b> ' + esc(j.background) + '</div>' : '') +
      (goals.length ? '<h4 class="subh">מטרות בית הספר</h4><ul class="lvl">' + goals.map(function (k) {
        return '<li><span><b>' + esc(k) + ':</b> ' + esc(j.goals[k]) + '</span></li>'; }).join('') + '</ul>' : '') +
      (progs.length ? '<details class="vis" style="margin-top:12px"><summary><b>התוכניות שהוגשו</b> · ' + progs.length + '</summary><div class="vb"><ul class="lvl">' +
        progs.map(function (p) {
          return '<li><span><b>' + esc(p.name) + '</b>' + (p.target ? ' · ' + esc(p.target) : '') + (p.details ? '<small style="display:block;color:var(--muted)">' + esc(p.details) + '</small>' : '') +
            '</span>' + (p.domain ? '<span class="chip ok">' + esc(p.domain) + '</span>' : '') + '</li>';
        }).join('') + '</ul></div></details>' : '') +
      (j.notes ? '<div class="small">' + esc(j.notes) + '</div>' : '') + '</div>';
  }

  /* פתיחת מסמך הסל: חלון נפתח מיד בלחיצה (אחרת הדפדפן חוסם), והמסמך נטען אליו מהשער.
     השער בודק שבית הספר משויך למי שנכנס.ה — בלי שיתוף בדרייב (מיטל, 7.10.26) */
  var GATE_EXEC = GAS + 'AKfycbynKp-eTNj7pY5lTaSD5_S_qhBH2RgEeLWOPW5ZeF2dTQ5hifL3Q7Lb4KDdQYJ_4Vz9/exec';
  function openSalDoc(semel) {
    var w = window.open('', '_blank');
    if (w) w.document.write('<p dir="rtl" style="font-family:Arial,sans-serif;padding:24px">טוען את המסמך…</p>');
    toast('טוען את המסמך…');
    fetchJson(GATE_EXEC, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'salDoc', token: token(), semel: semel }) }, 90000, 1).then(function (d) {
      if (!d || !d.ok) throw new Error(d && d.error || 'err');
      var bin = atob(d.b64), arr = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      var url = URL.createObjectURL(new Blob([arr], { type: d.mime || 'application/pdf' }));
      if (w) w.location.href = url; else location.href = url;
    }).catch(function (e) {
      if (w) w.close();
      toast(String(e.message) === 'notyours' ? 'המסמך לא שייך לבתי הספר שלך' : 'לא הצלחתי לפתוח את המסמך. נסו שוב בעוד רגע.');
    });
  }

  /* ----- עמוד בית ספר: יעדים, מיפוי, ביקורי תשפ״ו (pikuah-data) ----- */
  function para(t) { return '<div class="pre">' + esc(t) + '</div>'; }
  function linksOf(t) {
    return String(t || '').split(/[\s,]+/).filter(function (u) { return /^https?:\/\//.test(u); }).map(function (u, i) {
      return '<a href="' + esc(u) + '" target="_blank" rel="noopener">קובץ ' + (i + 1) + I.ext + '</a>';
    }).join(' · ');
  }
  function pikuahSecs(r) {
    var K = {};
    if (ST.pk !== 'ok') {
      var sm = ST.pk === 'load' ? 'טוען…' : 'לא נטען';
      return { yaad: sec('yaad', I.check, 'יעדים מהוועדה המלווה', sm, pending('pk')),
        mipui: sec('mipui', I.chart, 'מיפוי בית הספר', sm, pending('pk')),
        bik: sec('bik', I.doc, 'ביקורי פיקוח (מונדיי)', sm, pending('pk')), sumMap: sm, sumVis: '' };
    }

    /* יעדים */
    K.yaad = sec('yaad', I.check, 'יעדים מהוועדה המלווה', r.yaad ? 'יש יעדים' : tag('k-goals', 'אין יעדים'),
      r.yaad ? para(r.yaad) + '<div data-tovi-insight="goals:' + esc(r.s.semel) + '"></div>'   /* תובי: תובנות להשגת היעדים (tovi.js) */
        : '<div class="empty">אין יעדים מהוועדה המלווה האחרונה בקובץ.</div>');

    /* מיפוי — לפעמים שני מיפויים (שני מפקחים). החדש למעלה */
    var mp = r.mipui || [];
    var mSum = 'אין מיפוי';
    if (mp.length) {
      var rk = riskOf(r), ov = field(mp[0], 'דירוג כולל');
      mSum = (ov ? tag(ov.indexOf('סיכון') === 0 ? '' : (ov.indexOf('פערים') === 0 ? 'warn' : 'ok'), ov.split(',')[0]) : '') +
        (rk.length ? ' ' + tag('', rk.length === 1 ? 'מדד אחד במצב סיכון' : rk.length + ' במצב סיכון') : '') +
        ' · ' + fmtDate(field(mp[0], 'תאריך קליטת טופס'));
    }
    K.mipui = sec('mipui', I.chart, 'מיפוי בית הספר', mSum, mp.length ? mp.map(function (row, i) {
      var who = esc(field(row, 'מפקח')) + ' · ' + fmtDate(field(row, 'תאריך קליטת טופס'));
      /* מיפוי קודם (מפקח.ת נוסף.ת) — מקופל, שהעמוד לא יתארך */
      if (i) return '<details class="vis"><summary><b>מיפוי קודם</b> · ' + who + '</summary><div class="vb">' + mipuiBody(row) + '</div></details>';
      return (mp.length > 1 ? '<h4 class="subh">המיפוי האחרון · ' + who + '</h4>' : '<div class="small" style="margin:0 0 10px">מילא.ה: ' + who + '</div>') +
        mipuiBody(row);
    }).join('') + '<div data-tovi-insight="mipui:' + esc(r.s.semel) + '"></div>'   /* תובי: תובנות על המדדים החלשים (tovi.js) */
      : '<div class="empty">אין מיפוי לבית הספר הזה בקובץ (מרץ 2026).</div>');
    function mipuiBody(row) {
      var lv = levels(row), groups = [];
      lv.forEach(function (x) { var g = groups[groups.length - 1]; if (!g || g.n !== x.grp) groups.push(g = { n: x.grp, l: [] }); g.l.push(x); });
      var nums = [['מספר תלמידים מט', 'תלמידים ט–יב'], ['מספר תלמידי קורסים', 'תלמידי קורסים'],
                  ['אחוז התלמידים הזכאים לתעודת מקצוע', 'זכאים לתעודת מקצוע %'], ['אחוז התלמידים הזכאים לתעודה טכנולוגית', 'זכאים לתעודה טכנולוגית %'],
                  ['אחוז התלמידים הזכאים לתעודת בגרות', 'זכאים לבגרות %'], ['אחוז התלמידים המועסקים', 'מועסקים בתחום %'], ['אחוז גיוס', 'גיוס / שירות / מכינה %']]
        .map(function (n) { return [n[1], field(row, n[0])]; }).filter(function (n) { return n[1]; });
      var txts = [['תמונת מצב', 'תמונת מצב מחצית'], ['נימוק קצר', 'נימוק'], ['החלטה אופרטיבית', 'החלטה אופרטיבית למחצית ב׳'],
                  ['יעד פיקוח מרכזי', 'יעד הפיקוח המרכזי עד סוף השנה'], ['מגמות לימוד', 'מגמות']]
        .map(function (n) { return [n[1], field(row, n[0])]; }).filter(function (n) { return n[1]; });
      return txts.map(function (t) { return '<div class="note"><b>' + esc(t[0]) + ':</b> ' + esc(t[1]) + '</div>'; }).join('') +
        (nums.length ? '<div class="facts">' + nums.map(function (n) { return '<div class="fact"><span>' + esc(n[0]) + '</span><b>' + esc(n[1]) + '</b></div>'; }).join('') + '</div>' : '') +
        groups.map(function (g) {
          return '<h4 class="subh">' + esc(g.n) + '</h4><ul class="lvl">' + g.l.map(function (x) {
            return '<li>' + esc(x.name) + '<span class="chip ' + (x.cls === 'bad' ? '' : x.cls) + '">' + esc(x.v) + '</span></li>';
          }).join('') + '</ul>';
        }).join('');
    }

    /* ביקורי פיקוח מהייצוא של מונדיי (תשפ״ו וגם תחילת תשפ״ז). כל ביקור מקופל בפני עצמו */
    var bk = r.bik || [];
    K.bik = sec('bik', I.doc, 'ביקורי פיקוח (מונדיי)', bk.length ? (bk.length === 1 ? 'ביקור אחד' : bk.length + ' ביקורים') + ' · אחרון ' + fmtDate(bk[0]['תאריך']) : 'אין ביקורים',
      bk.length ? bk.map(function (v) {
        var parts = [['נוכחים', v['נוכחים']], ['מטרות', v['מטרות']], ['נושאים שעלו', v['נושאים']], ['סיכום', v['סיכום']], ['פעולות ונושאים למעקב', v['פעולות למעקב']]]
          .filter(function (p) { return String(p[1] || '').trim(); });
        var files = linksOf(v['מסמכים']);
        return '<details class="vis"><summary><b>' + fmtDate(v['תאריך']) + '</b> · ' + esc(v['מפקח.ת']) +
          (v['מטרות'] ? '<span>' + esc(String(v['מטרות']).slice(0, 80)) + '</span>' : '') + '</summary><div class="vb">' +
          parts.map(function (p) { return '<h5>' + esc(p[0]) + '</h5>' + para(p[1]); }).join('') +
          (files ? '<div class="small">קבצים במונדיי: ' + files + '</div>' : '') + '</div></details>';
      }).join('') : '<div class="empty">אין ביקורים במונדיי לבית הספר הזה.</div>');
    K.sumMap = (r.yaad ? 'יש יעדים מהוועדה' : tag('k-goals', 'אין יעדים')) + ' · ' + mSum;
    K.sumVis = bk.length ? (bk.length === 1 ? 'ביקור אחד במונדיי' : bk.length + ' ביקורים במונדיי') + ' · אחרון ' + fmtDate(bk[0]['תאריך']) : 'אין ביקורים במונדיי';
    return K;
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
    if (role === SHERUT_ROLE) {
      SCHOOLS.forEach(function (s) { (BY[s.name].sherut || []).forEach(function (row) { rows.push([s, sherutPerson(row)]); }); });
      rows.sort(function (a, b) { return a[0].name.localeCompare(b[0].name, 'he'); });
      return { rows: rows, missing: [] };
    }
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
    var need = role === SHERUT_ROLE ? 'sherut' : 'nispach';
    if (ST[need] !== 'ok') { $('main').innerHTML = '<div class="card head"><h1>' + esc(shortRole(role)) + '</h1>' + pending(need) + '</div>'; return; }
    var box = $('roleBox');
    if (!box || box.getAttribute('data-role') !== role) {
      ROLEQ = ''; ROLESUP = '';
      $('main').innerHTML = backLink() + '<div class="card head" id="roleBox" data-role="' + esc(role) + '"><h1>' + esc(role) + '</h1>' +
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
      (role === SHERUT_ROLE ? ' בנות שירות' : ' בעלי תפקידים') + (missing.length ? ' · חסר ב-' + missing.length + ' בתי ספר' : '');
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
      '<tr><th ' + th + '>בית הספר</th><th ' + th + '>נספח בעלי תפקידים</th><th ' + th + '>מנור</th></tr>' +
      list.map(function (r) {
        var x = r.nispach;
        var nis = ST.nispach !== 'ok' ? '' : (!x || !x.submitted ? '<b style="color:#c43c47">לא הוגש</b>' :
          (x.missing.length ? '<span style="color:#c43c47">חסר: ' + esc(x.missing.map(shortRole).join(', ')) + '</span>' : 'מאויש'));
        var men = r.menor && r.menor.t ? r.menor.r + ' מתוך ' + r.menor.t : '';
        return '<tr><td ' + td + '><b>' + esc(r.s.name) + '</b></td><td ' + td + '>' + nis + '</td><td ' + td + '>' + men + '</td></tr>';
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
    var h = backLink() + '<div class="card head"><h1>' + esc(name) + '</h1><div class="meta">מפקח.ת פדגוגי.ת · ' + list.length + ' בתי ספר' +
      (c ? ' · ' + telA(c['טלפון'] || c['e164']) + (cMail(c) ? ' · ' + mailA(cMail(c)) : '') : '') + '</div>' +
      '<div class="views"><div class="small" style="margin:0">' + (M.to.length ? 'המייל כולל טבלת מצב לכל בית ספר ואת כל בעלי התפקידים.' :
        'אין מייל של המפקח.ת בגיליון אנשי הקשר.') + '</div>' +
      '<div class="acts">' + mailBtn('sup', M, 'שליחת המצב במייל') +
      '<a class="btn" href="?as=' + encodeURIComponent(name) + '" target="_blank" rel="noopener">' + I.home + 'הבית כמו ש' + esc(name) + ' רואה' + I.ext + '</a></div></div></div>';
    if (adminView() && list.length) h += '<div data-tovi-insight="sup:' + esc(name) + '"></div>';   /* תובי: תמונת מצב של המפקח.ת — אדמין בלבד, השרת בודק שוב (tovi.js) */
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

  /* ===== טפסים פעילים (נקראו בהתחלה "טפסים נקודתיים", 7.10.26) =====
     טפסי רישום/דיווח זמניים. שרת וגיליון משלהם ("טפסים נקודתיים — הבית של רויטל"); הטופס הציבורי: tfasim/f.html?id=<מזהה>.
     טופס חדש = שורה בלשונית "טפסים". סגירה = כפתור כאן — הטופס עובר לארכיון והפניות נשמרות.
     אדמין בלבד: השרת מאמת את הטוקן מול השער (מרחב all). */
  var FORMS_EXEC = GAS + 'AKfycbylxc_Y8ozHXD7a2qQH1ICT-68ctUpvyARL2jNazaSOj1GxygU3zI8flb2xNndvGLMe/exec';
  var FORM_URL = 'https://tfasim.pedagogiamh.co.il/f.html?id=';
  var F_DONE = 'טופל', F_OPEN = 'פתוח';
  var FORMS = [], FFILT = 'open';
  ST.forms = 'load';
  function loadForms(then) {
    if (!adminView()) { ST.forms = 'na'; return; }
    fetchJson(FORMS_EXEC, { method: 'POST', body: JSON.stringify({ action: 'admin', token: token() }) }, 45000).then(function (d) {
      if (!d || !d.ok) throw new Error((d && d.error) || 'fail');
      FORMS = d.forms || [];
      if (then) { ST.forms = 'ok'; then(); } else loaded('forms', true);
    }).catch(function () { loaded('forms', false); });
  }

  /* ----- בונה טפסים: רויטל יוצרת טופס בעצמה (מיטל, 7.10.26) -----
     השדות הקבועים (בית ספר מ-64, שם מלא, מייל) נוספים תמיד בדף הטופס — כאן רק השאלות הנוספות.
     "כן / לא" נשמר כבחירה מרשימה עם שתי אפשרויות. הטיוטה נשמרת ב-NF עד היצירה. */
  var NF = null;
  var NF_TYPES = [['text', 'טקסט קצר'], ['textarea', 'טקסט ארוך'], ['select', 'בחירה מרשימה'], ['yesno', 'כן / לא']];
  var NF_RESERVED = ['חותמת זמן', 'מזהה פנייה', 'בית ספר', 'שם מלא', 'מייל', 'סטטוס', 'עודכן'];
  function nfReset() { NF = { title: '', intro: '', track: false, fields: [{ label: '', type: 'textarea', req: true, options: '', other: false }] }; }
  function newFormPage(force) {
    if ($('nfBox') && !force) return;   /* render() מכל מקור שנטען לא מוחק את מה שהוקלד */
    if (!NF) nfReset();
    var h = backLink() + '<div class="card head" id="nfBox"><h1>טופס חדש</h1><div class="meta">בכל טופס יש תמיד: <b>בית ספר</b> (בחירה מ-64), <b>שם מלא</b> ו<b>מייל לחזרה</b>. כאן מוסיפים את השאר.</div></div>' +
      '<div class="card nf"><label class="nfl">כותרת הטופס <span class="req">*</span><input id="nfTitle" maxlength="120" value="' + esc(NF.title) + '" placeholder="למשל: רישום ליום עיון רכזים"></label>' +
      '<label class="nfl">הסבר קצר שיופיע מתחת לכותרת<textarea id="nfIntro" maxlength="1000" rows="3">' + esc(NF.intro) + '</textarea></label></div>' +
      '<div class="card nf"><p class="eyebrow">' + I.doc + 'השאלות</p>' + NF.fields.map(function (f, i) {
        var sel = f.type === 'select';
        return '<div class="nfq" data-i="' + i + '"><div class="nfrow"><span class="nfn">' + (i + 1) + '</span>' +
          '<input class="nfLabel" maxlength="150" placeholder="השאלה, למשל: תפקיד" value="' + esc(f.label) + '">' +
          '<select class="nfType" aria-label="סוג התשובה">' + NF_TYPES.map(function (t) {
            return '<option value="' + t[0] + '"' + (f.type === t[0] ? ' selected' : '') + '>' + t[1] + '</option>'; }).join('') + '</select></div>' +
          (sel ? '<textarea class="nfOpts" rows="4" placeholder="אפשרות אחת בכל שורה">' + esc(f.options) + '</textarea>' : '') +
          '<div class="nfrow2"><label><input type="checkbox" class="nfReq"' + (f.req ? ' checked' : '') + '> חובה</label>' +
          (sel ? '<label><input type="checkbox" class="nfOther"' + (f.other ? ' checked' : '') + '> אפשרות "אחר" עם שדה כתיבה</label>' : '') +
          (NF.fields.length > 1 ? '<button type="button" class="linkbtn" data-nfdel="' + i + '">הסרת השאלה</button>' : '') + '</div></div>';
      }).join('') + '<button type="button" class="btn" data-nfadd>+ הוספת שאלה</button></div>' +
      '<div class="card nf"><label class="nfchk"><input type="checkbox" id="nfTrack"' + (NF.track ? ' checked' : '') + '><span><b>לעקוב מי לא מילא</b>' +
      '<small>בדף המעקב תופיע רשימת בתי הספר שטרם מילאו, עם העתקה ומייל למנהלים. מתאים לרישום שכל בתי הספר צריכים למלא.</small></span></label>' +
      '<div class="nferr" id="nfErr" role="alert"></div>' +
      '<div class="acts" style="margin-top:14px"><button type="button" class="btn primary" id="nfCreate">יצירת הטופס</button></div></div>';
    $('main').innerHTML = h;
  }
  function nfSync() {
    if (!$('nfBox') || !NF) return;
    NF.title = $('nfTitle').value; NF.intro = $('nfIntro').value; NF.track = $('nfTrack').checked;
    Array.prototype.forEach.call(document.querySelectorAll('.nfq'), function (q) {
      var f = NF.fields[+q.getAttribute('data-i')];
      if (!f) return;
      f.label = q.querySelector('.nfLabel').value;
      f.type = q.querySelector('.nfType').value;
      f.req = q.querySelector('.nfReq').checked;
      var o = q.querySelector('.nfOpts'); if (o) f.options = o.value;
      var ot = q.querySelector('.nfOther'); if (ot) f.other = ot.checked;
    });
  }
  function nfCreate() {
    nfSync();
    var err = '', seen = {}, fields = [];
    var title = NF.title.trim();
    if (!title) err = 'חסרה כותרת לטופס.';
    NF.fields.forEach(function (f, i) {
      var label = f.label.trim();
      if (err || !label) return;
      if (NF_RESERVED.indexOf(label) > -1) { err = 'השאלה "' + label + '" כבר קיימת בכל טופס — אין צורך להוסיף אותה.'; return; }
      if (seen[label]) { err = 'השאלה "' + label + '" מופיעה פעמיים.'; return; }
      seen[label] = 1;
      var x = { label: label, type: f.type, req: f.req };
      if (f.type === 'yesno') { x.type = 'select'; x.options = ['כן', 'לא']; }
      else if (f.type === 'select') {
        x.options = f.options.split('\n').map(function (o) { return o.trim(); }).filter(Boolean);
        x.other = f.other;
        if (!x.options.length) { err = 'בשאלה ' + (i + 1) + ' ("' + label + '") חסרות אפשרויות לבחירה.'; return; }
      }
      fields.push(x);
    });
    $('nfErr').textContent = err;
    if (err) return;
    var btn = $('nfCreate');
    btn.disabled = true; btn.textContent = 'יוצר את הטופס…';
    fPost({ action: 'createForm', title: title, intro: NF.intro.trim(), fields: fields, track: NF.track }).then(function (d) {
      NF = null;
      loadForms(function () {
        go('f:' + d.id);
        copy(FORM_URL + encodeURIComponent(d.id));
        toast('הטופס נוצר והקישור הועתק');
      });
    }, function () {
      btn.disabled = false; btn.textContent = 'יצירת הטופס';
      $('nfErr').textContent = 'היצירה לא הצליחה. נסי שוב בעוד רגע.';
    });
  }
  function fPost(body) {
    body.token = token();
    return fetchJson(FORMS_EXEC, { method: 'POST', body: JSON.stringify(body) }, 45000).then(function (d) {
      if (!d || !d.ok) throw new Error((d && d.error) || 'fail');
      return d;
    });
  }
  function fById(id) { return FORMS.filter(function (f) { return f.id === id; })[0] || null; }
  function fIsDone(r) { return String(r['סטטוס']) === F_DONE; }
  function fOpenN(f) { return fIsG(f) ? 0 : (f.rows || []).filter(function (r) { return !fIsDone(r); }).length; }
  /* טופס גוגל מחובר (src=gform): השורות = לשונית התשובות כמו שהיא. מזהים עמודות לפי שם השאלה */
  function fIsG(f) { return f.src === 'gform'; }
  function fCol(f, re) { return (f.head || []).filter(function (h) { return re.test(h); })[0] || ''; }
  function fSchoolOf(f, r) {
    if (!fIsG(f)) return String(r['בית ספר'] || '').trim();
    return String(r[fCol(f, /בית הספר|ביה"ס|ביה״ס|בית ספר/)] || '').trim();
  }
  function fNameOf(f, r) {
    if (!fIsG(f)) return String(r['שם מלא'] || '').trim();
    var a = fCol(f, /^שם פרטי/), b = fCol(f, /^שם משפחה/);
    if (a) return (String(r[a] || '').trim() + ' ' + String(r[b] || '').trim()).trim();
    return String(r[fCol(f, /^שם (המנהל|מלא)|^שם$/)] || '').trim();
  }
  function fPhoneNorm(v) {
    var d = String(v || '').replace(/\D/g, '');
    if (d.indexOf('972') === 0) d = '0' + d.slice(3);
    if (d.length === 9 && d.charAt(0) === '5') d = '0' + d;
    return d;
  }
  function fPhoneOf(f, r) { var c = fCol(f, /פלאפון|נייד|טלפון/); return c ? fPhoneNorm(r[c]) : ''; }
  /* מי שנרשם פעמיים נספר פעם אחת — לפי נייד, ואם אין נייד לפי שם + בית ספר. החדשים למעלה */
  function fRegs(f) {
    var seen = {}, out = [];
    (f.rows || []).slice().reverse().forEach(function (r) {
      var k = fPhoneOf(f, r) || (fNameOf(f, r) + '|' + SN.canon(fSchoolOf(f, r)));
      if (seen[k]) return;
      seen[k] = 1; out.push(r);
    });
    return out;
  }
  function fNavCount() {
    if (ST.forms !== 'ok') return '';
    var n = 0;
    FORMS.forEach(function (f) { if (f.open) n += fOpenN(f); });
    return n ? String(n) : '';
  }
  /* 'yyyy-MM-ddTHH:mm' → '7.10.26 · 14:30' */
  function fDate(v, dayOnly) {
    var m = String(v || '').match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}:\d{2}))?/);
    if (!m) return String(v || '');
    var d = (+m[3]) + '.' + (+m[2]) + '.' + m[1].slice(2);
    return dayOnly || !m[4] ? d : d + ' · ' + m[4];
  }
  /* תוכן הפנייה — השדה הארוך הראשון (למשל "מהות התקלה") */
  function fMainField(f) { return (f.fields || []).filter(function (x) { return x.type === 'textarea'; })[0] || null; }
  function fRoleOf(f, r) {
    var x = (f.fields || []).filter(function (y) { return y.type === 'select'; })[0];
    return x ? String(r[x.label] || '') : '';
  }

  function formsPage() {
    var h = '<div class="card head"><h1>טפסים פעילים</h1><div class="meta">טפסי רישום ודיווח זמניים. טופס שנסגר עובר לארכיון, והפניות שלו נשמרות.</div>' +
      '<div class="acts" style="margin-top:12px"><button type="button" class="btn primary" data-go="N">+ טופס חדש</button></div></div>';
    if (ST.forms !== 'ok') { $('main').innerHTML = h + '<div class="card">' + pending('forms') + '</div>'; return; }
    var open = FORMS.filter(function (f) { return f.open; }), closed = FORMS.filter(function (f) { return !f.open; });
    h += '<div class="card"><p class="eyebrow">' + I.doc + 'טפסים פתוחים</p>' +
      (open.length ? '<div class="tiles">' + open.map(fTile).join('') + '</div>' : '<div class="empty">אין כרגע טפסים פתוחים.</div>') + '</div>';
    if (closed.length) {
      h += '<details class="card sec" data-k="farch"' + (OPENSEC.farch ? ' open' : '') + '><summary><span class="st">' + I.doc + 'ארכיון</span><span class="sum">' +
        (closed.length === 1 ? 'טופס סגור אחד' : closed.length + ' טפסים סגורים') + '</span>' + I.car + '</summary>' +
        '<div class="sb"><div class="tiles">' + closed.map(fTile).join('') + '</div></div></details>';
    }
    $('main').innerHTML = h;
  }
  /* אריח = כותרת + שני כפתורים: הטופס עצמו (נפתח בלשונית חדשה) ודף המעקב (מיטל, 7.10.26) */
  function fTile(f) {
    var n = (f.rows || []).length, o = fOpenN(f), g = fIsG(f);
    var link = g ? (f.link || '') : FORM_URL + encodeURIComponent(f.id);
    return '<div class="tile ftile">' + I.doc + '<span class="ftx"><button type="button" class="fttl" data-go="f:' + esc(f.id) + '">' + esc(f.title) + '</button><small>' +
      (g ? (f.error ? 'אין גישה לגיליון' : 'טופס גוגל · ' + fRegs(f).length + ' נרשמו') :
        (f.track === 'schools' ? 'מילאו ' + fFilled(f).n + ' מתוך ' + SCHOOLS.length + ' · ' : '') +
        (n ? n + ' פניות' + (o ? ' · ' + o + ' פתוחות' : ' · כולן טופלו') : 'אין פניות עדיין')) +
      (f.open ? ' · נפתח ' + esc(fDate(f.opened, true)) : (f.closed ? ' · נסגר ' + esc(fDate(f.closed, true)) : '')) + '</small>' +
      '<span class="fbt">' + (link ? '<a class="btn sm" href="' + esc(link) + '" target="_blank" rel="noopener">' + I.ext + 'הטופס</a>' : '') +
      '<button type="button" class="btn sm primary" data-go="f:' + esc(f.id) + '">' + I.chart + 'מעקב</button></span></span></div>';
  }
  /* בתי הספר שמילאו (לפי השם האחיד) — לטפסים עם מעקב */
  function fFilled(f) {
    var set = {}, n = 0;
    (f.rows || []).forEach(function (r) { set[SN.canon(fSchoolOf(f, r))] = 1; });
    SCHOOLS.forEach(function (s) { if (set[s.name]) n++; });
    return { set: set, n: n };
  }
  /* "טרם מילאו" — מקופל, עם העתקה ומייל למנהלים (עותק מוסתר) */
  function fMissing(f) {
    var fl = fFilled(f), miss = SCHOOLS.filter(function (s) { return !fl.set[s.name]; });
    if (!miss.length) return '<div class="card"><p class="eyebrow">' + I.check + 'מעקב</p><div class="empty">כל ' + SCHOOLS.length + ' בתי הספר מילאו.</div></div>';
    LISTS.formMiss = ['בית ספר\tמפקח.ת'].concat(miss.map(function (s) { return s.name + '\t' + supsOf(s).join(', '); })).join('\n');
    var link = fIsG(f) && f.link ? f.link : FORM_URL + encodeURIComponent(f.id), mailPart = '';
    if (ST.contacts === 'ok') {
      var bcc = [], noMail = 0;
      miss.forEach(function (s) { var m = principalOf(BY[s.name]).mails; if (m.length) bcc = bcc.concat(m); else noMail++; });
      var me = ($('meName').textContent || '').trim();
      var html = '<div dir="rtl" style="text-align:right;font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:#16203c">שלום,<br><br>' +
        'עוד לא קיבלנו מבית הספר שלכם את "' + esc(f.title) + '".<br>אפשר למלא כאן: <a href="' + esc(link) + '" dir="ltr">' + esc(link) + '</a><br><br>תודה,<br>' + esc(me) + '</div>';
      var text = 'שלום,\n\nעוד לא קיבלנו מבית הספר שלכם את "' + f.title + '".\nאפשר למלא כאן: ' + link + '\n\nתודה,\n' + me;
      mailPart = mailBtn('fmiss-' + f.id, { to: [], bcc: cleanMails(bcc), subject: 'תזכורת · ' + f.title, html: html, text: text }, 'מייל למנהלים (' + (miss.length - noMail) + ')') +
        (noMail ? '<span class="small">' + noMail + ' בלי מייל של מנהל.ת בגיליון אנשי הקשר</span>' : '');
    } else mailPart = '<span class="small">' + (ST.contacts === 'load' ? 'טוען את אנשי הקשר…' : 'אנשי הקשר לא נטענו — אין כרגע מייל למנהלים') + '</span>';
    return sec('fmiss', I.check, fIsG(f) ? 'טרם נרשמו' : 'טרם מילאו', tag('warn', miss.length + ' בתי ספר') + (fIsG(f) ? ' · נרשמו ' : ' · מילאו ') + fl.n + ' מתוך ' + SCHOOLS.length,
      '<div class="acts" style="margin-bottom:12px"><button type="button" class="btn" data-copy="formMiss">' + I.copy + 'העתקת הרשימה</button>' + mailPart + '</div>' +
      '<ul class="list">' + miss.map(function (s) {
        return '<li><button type="button" data-go="s:' + esc(s.semel) + '">' + esc(s.name) + '<span>' + esc(supsOf(s).join(' · ')) + '</span></button></li>';
      }).join('') + '</ul>');
  }

  function formPage(id) {
    var f = fById(id);
    if (ST.forms !== 'ok' || !f) {
      $('main').innerHTML = backLink() + '<div class="card">' + (ST.forms === 'ok' ? '<div class="empty">הטופס לא נמצא.</div>' : pending('forms')) + '</div>';
      return;
    }
    if (fIsG(f)) return gFormPage(f);
    MAILS = {};
    var rows = (f.rows || []).slice().reverse();   /* החדשות למעלה */
    var o = fOpenN(f), done = rows.length - o;
    var shown = rows.filter(function (r) { return FFILT === 'all' || (FFILT === 'done') === fIsDone(r); });
    var link = FORM_URL + encodeURIComponent(f.id);
    LISTS.formLink = link;
    LISTS.form = fTsv(f, shown);
    var h = backLink() + '<div class="card head"><h1>' + esc(f.title) + '</h1><div class="meta">' +
      (f.open ? tag('ok', 'פתוח') + ' · נפתח ' + esc(fDate(f.opened, true)) : tag('warn', 'סגור') + (f.closed ? ' · נסגר ' + esc(fDate(f.closed, true)) : '')) +
      ' · <b>' + rows.length + '</b> פניות · <b>' + o + '</b> פתוחות</div>' +
      '<div class="views"><div class="seg" role="group" aria-label="סינון">' +
      [['open', 'פתוחות (' + o + ')'], ['done', 'טופלו (' + done + ')'], ['all', 'הכול (' + rows.length + ')']].map(function (b) {
        return '<button type="button" data-ffilt="' + b[0] + '" aria-pressed="' + (FFILT === b[0]) + '">' + b[1] + '</button>';
      }).join('') + '</div>' +
      '<div class="acts"><button type="button" class="btn" data-copy="formLink">' + I.copy + 'העתקת הקישור לטופס</button>' +
      '<a class="btn" href="' + esc(link) + '" target="_blank" rel="noopener">' + I.ext + 'פתיחת הטופס</a>' +
      (shown.length ? '<button type="button" class="btn" data-copy="form">' + I.copy + 'העתקה לאקסל</button>' : '') +
      '<button type="button" class="btn" data-fopen="' + (f.open ? '0' : '1') + '" data-fid="' + esc(f.id) + '">' + (f.open ? 'סגירת הטופס' : 'פתיחה מחדש') + '</button>' +
      (f.open ? '' : '<button type="button" class="btn fdel" data-fdel="' + esc(f.id) + '">מחיקת הטופס</button>') +
      '</div></div></div>';
    if (f.track === 'schools') h += fMissing(f);
    h += shown.length ? shown.map(function (r) { return fItem(f, r); }).join('')
      : '<div class="card"><div class="empty">' + (FFILT === 'open' ? (rows.length ? 'כל הפניות טופלו.' : 'עוד לא הגיעו פניות.') : 'אין פניות להצגה.') + '</div></div>';
    $('main').innerHTML = h;
  }
  function fItem(f, r) {
    var done = fIsDone(r), rid = String(r['מזהה פנייה'] || ''), role = fRoleOf(f, r);
    var sum = esc(r['שם מלא']) + (role ? ' · ' + esc(role) : '') + ' · ' + esc(fDate(r['חותמת זמן'])) + ' ' + (done ? tag('ok', F_DONE) : tag('warn', F_OPEN));
    var body = (f.fields || []).filter(function (x) { return x.type !== 'select'; }).map(function (x) {
      return '<div class="fv"><span>' + esc(x.label) + '</span><div>' + esc(r[x.label]).replace(/\n/g, '<br>') + '</div></div>';
    }).join('') +
      '<div class="small">' + esc(r['שם מלא']) + (role ? ' · ' + esc(role) : '') + ' · ' + mailA(r['מייל']) +
      (done && r['עודכן'] ? ' · סומן כטופל ' + esc(fDate(r['עודכן'])) : '') + '</div>' +
      '<div class="acts" style="margin-top:12px">' + mailBtn('fm-' + rid, fReplyMail(f, r), 'מענה במייל') +
      '<button type="button" class="btn" data-fst="' + (done ? F_OPEN : F_DONE) + '" data-fid="' + esc(f.id) + '" data-rid="' + esc(rid) + '">' +
      (done ? 'החזרה לפתוח' : I.check + 'סימון כטופל') + '</button></div>';
    return sec('f-' + rid, I.doc, r['בית ספר'], sum, body);
  }
  function fReplyMail(f, r) {
    var me = ($('meName').textContent || '').trim(), name = String(r['שם מלא'] || '').trim();
    var mf = fMainField(f), said = mf ? String(r[mf.label] || '').trim() : '', day = fDate(r['חותמת זמן'], true);
    var hello = 'שלום' + (name ? ' ' + name : '') + ',';
    var html = '<div dir="rtl" style="text-align:right;font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:#16203c">' +
      esc(hello) + '<br><br>תודה על הפנייה מ-' + esc(day) + ' (' + esc(f.title) + ').' +
      (said ? '<div style="margin:8px 0;padding:8px 12px;border-right:3px solid #c9d6ff;background:#f6f8fd;color:#3d4a70">' + esc(said).replace(/\n/g, '<br>') + '</div>' : '<br>') +
      '<br><br>בברכה,<br>' + esc(me) + '</div>';
    var text = hello + '\n\nתודה על הפנייה מ-' + day + ' (' + f.title + ').' + (said ? '\n\n> ' + said.replace(/\n/g, '\n> ') : '') +
      '\n\n\n\nבברכה,\n' + me;
    return { to: cleanMails([r['מייל']]), subject: 'בנוגע לפנייה שלך · ' + f.title, html: html, text: text };
  }
  function fTsv(f, rows) {
    var head = (f.head || []).filter(function (k) { return k !== 'מזהה פנייה'; });
    function cell(v) { return String(v == null ? '' : v).replace(/[\t\r\n]+/g, ' ').trim(); }
    return [head.join('\t')].concat(rows.map(function (r) {
      return head.map(function (k) { return cell(/^(חותמת זמן|עודכן)$/.test(k) ? fDate(r[k]) : r[k]); }).join('\t');
    })).join('\n');
  }
  function fSetStatus(id, rid, status) {
    var f = fById(id), r = f && (f.rows || []).filter(function (x) { return String(x['מזהה פנייה']) === rid; })[0];
    if (!r) return;
    var prev = r['סטטוס'], prevUp = r['עודכן'];
    r['סטטוס'] = status;
    r['עודכן'] = new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16);
    side(); render();
    fPost({ action: 'setStatus', id: id, rid: rid, status: status }).then(function () {
      toast(status === F_DONE ? 'סומן כטופל' : 'הוחזר לפתוח');
    }, function () {
      r['סטטוס'] = prev; r['עודכן'] = prevUp;
      side(); render();
      toast('השמירה לא הצליחה. נסי שוב');
    });
  }
  function fSetOpen(id, open) {
    var f = fById(id);
    if (!f) return;
    if (!open && !window.confirm('לסגור את הטופס "' + f.title + '"?\nמי שייכנס לקישור יראה "הטופס נסגר". הפניות נשמרות, והטופס עובר לארכיון.')) return;
    fPost({ action: 'setOpen', id: id, open: open }).then(function (d) {
      if (d.warn === 'gform') window.alert('בבית הטופס ' + (open ? 'נפתח' : 'נסגר') + ', אבל לא הצלחתי ' + (open ? 'לפתוח' : 'לסגור') + ' את טופס הגוגל עצמו. צריך לעשות את זה ידנית בטופס (תגובות ← מקבל תגובות).');
      f.open = open;
      if (open) f.closed = ''; else f.closed = new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16);
      toast(open ? 'הטופס נפתח מחדש' : 'הטופס נסגר');
      side(); render();
    }, function () { toast('הפעולה לא הצליחה. נסי שוב'); });
  }
  /* ----- דף מעקב לטופס גוגל מחובר: מי נרשם (בלי כפילויות) + טרם נרשמו (בתי ספר / בנות שירות) ----- */
  var FOUT = [];
  function gFormPage(f) {
    MAILS = {};
    var regs = fRegs(f), dup = (f.rows || []).length - regs.length;
    var nameC = fCol(f, /^שם/), skip = { 'חותמת זמן': 1 };
    LISTS.formLink = f.link || '';
    LISTS.form = [(f.head || []).join('\t')].concat(regs.map(function (r) {
      return (f.head || []).map(function (k) { return String(r[k] == null ? '' : (k === 'חותמת זמן' ? fDate(r[k]) : r[k])).replace(/[\t\r\n]+/g, ' ').trim(); }).join('\t');
    })).join('\n');
    var h = backLink() + '<div class="card head"><h1>' + esc(f.title) + '</h1><div class="meta">' +
      (f.open ? tag('ok', 'פתוח') : tag('warn', 'סגור')) + ' · טופס גוגל · <b>' + regs.length + '</b> נרשמו' +
      (dup ? ' · ' + dup + (dup === 1 ? ' הרשמה כפולה לא נספרה' : ' הרשמות כפולות לא נספרו') : '') + '</div>' +
      '<div class="views"><div class="acts">' +
      (f.link ? '<button type="button" class="btn" data-copy="formLink">' + I.copy + 'העתקת הקישור לטופס</button>' +
        '<a class="btn" href="' + esc(f.link) + '" target="_blank" rel="noopener">' + I.ext + 'פתיחת הטופס</a>' : '') +
      (regs.length ? '<button type="button" class="btn" data-copy="form">' + I.copy + 'העתקה לאקסל</button>' : '') +
      '<button type="button" class="btn" data-fopen="' + (f.open ? '0' : '1') + '" data-fid="' + esc(f.id) + '">' + (f.open ? 'סגירת הטופס' : 'פתיחה מחדש') + '</button>' +
      (f.open ? '' : '<button type="button" class="btn fdel" data-fdel="' + esc(f.id) + '">מחיקת הטופס</button>') +
      '</div></div></div>';
    if (f.error) {
      $('main').innerHTML = h + '<div class="card"><div class="empty">אין גישה לגיליון התשובות של הטופס. צריך לשתף אותו עם meytalp@bethaarava.ort.org.il.</div></div>';
      return;
    }
    if (f.track === 'schools') h += fMissing(f);
    else if (f.track === 'sherut') h += fSherutTrack(f, regs);
    h += '<div class="card"><p class="eyebrow">' + I.users + 'מי נרשם (' + regs.length + ')</p>' + (regs.length ? '' : '<div class="empty">עוד אין נרשמים.</div>') + '</div>';
    h += regs.map(function (r, i) {
      var sch = fSchoolOf(f, r), c = SN.canon(sch);
      var body = (f.head || []).filter(function (k) { return !skip[k] && k !== nameC && String(r[k] == null ? '' : r[k]).trim(); }).map(function (k) {
        return '<div class="fv"><span>' + esc(k) + '</span><div>' + esc(r[k]).replace(/\n/g, '<br>') + '</div></div>';
      }).join('');
      return sec('g-' + f.id + '-' + i, I.users, fNameOf(f, r) || '—', esc(BY[c] ? c : sch) + ' · ' + esc(fDate(r['חותמת זמן'])), body);
    }).join('');
    $('main').innerHTML = h;
  }
  /* בנות שירות: ההתאמה לפי נייד מול הרשימה שבבית (admin-sherut) */
  function fSherutTrack(f, regs) {
    if (ST.sherut !== 'ok') return '<div class="card">' + pending('sherut') + '</div>';
    var regPh = {}, all = [], listPh = {};
    regs.forEach(function (r) { var p = fPhoneOf(f, r); if (p) regPh[p] = 1; });
    SCHOOLS.forEach(function (s) {
      (BY[s.name].sherut || []).forEach(function (row) {
        var p = fPhoneNorm(row['נייד'] || row['e164']);
        all.push({ s: s, name: String(row['שם'] || ''), ph: p });
        if (p) listPh[p] = 1;
      });
    });
    var miss = all.filter(function (x) { return !x.ph || !regPh[x.ph]; });
    FOUT = regs.filter(function (r) { var p = fPhoneOf(f, r); return p && !listPh[p]; }).map(function (r) {
      return { name: fNameOf(f, r), phone: fPhoneOf(f, r), raw: fSchoolOf(f, r) };
    });
    LISTS.formMiss = ['שם\tבית ספר\tנייד'].concat(miss.map(function (x) { return x.name + '\t' + x.s.name + '\t' + x.ph; })).join('\n');
    var h = miss.length
      ? sec('fmiss', I.check, 'טרם נרשמו', tag('warn', miss.length + ' בנות שירות') + ' · נרשמו ' + (all.length - miss.length) + ' מתוך ' + all.length,
        '<div class="acts" style="margin-bottom:12px"><button type="button" class="btn" data-copy="formMiss">' + I.copy + 'העתקת שמות וניידים</button></div>' +
        '<ul class="list">' + miss.map(function (x) {
          return '<li><span class="li"><b>' + esc(x.name) + '</b><span>' + esc(x.s.name) + (x.ph ? ' · ' + telA(x.ph) : '') + '</span></span></li>';
        }).join('') + '</ul>')
      : '<div class="card"><p class="eyebrow">' + I.check + 'מעקב</p><div class="empty">כל ' + all.length + ' בנות השירות נרשמו.</div></div>';
    if (FOUT.length) {
      var opts = SCHOOLS.map(function (s) { return s.name; }).sort();
      h += sec('fout', I.users, 'נרשמו ולא ברשימת בנות השירות', FOUT.length + ' נרשמות',
        '<div class="small" style="margin:0 0 10px">הנייד שלהן לא נמצא ברשימה. בוחרים בית ספר ולוחצים "הוספה לרשימה". הן יופיעו מעכשיו בבית ובאדמין המוסדות.</div>' +
        '<ul class="list">' + FOUT.map(function (x, i) {
          var c = SN.canon(x.raw);
          return '<li class="foutli"><span><b>' + esc(x.name) + '</b> · ' + esc(x.raw) + ' · <span dir="ltr">' + esc(x.phone) + '</span></span>' +
            '<span class="foutact"><select id="fosch' + i + '" aria-label="בית ספר"><option value="">בחרו בית ספר</option>' + opts.map(function (n) {
              return '<option' + (n === c ? ' selected' : '') + '>' + esc(n) + '</option>'; }).join('') + '</select>' +
            '<button type="button" class="btn sm primary" data-foadd="' + i + '">הוספה לרשימה</button></span></li>';
        }).join('') + '</ul>');
    }
    return h;
  }
  function fAddSherut(i) {
    var x = FOUT[i], school = $('fosch' + i) && $('fosch' + i).value;
    if (!x) return;
    if (!school || !BY[school]) { toast('צריך לבחור בית ספר'); return; }
    var semel = String(BY[school].s.semel);
    fPost({ action: 'addSherut', name: x.name, phone: x.phone, school: school, semel: semel }).then(function () {
      (BY[school].sherut = BY[school].sherut || []).push({ 'בית ספר': school, 'שם': x.name, 'נייד': x.phone.slice(0, 3) + '-' + x.phone.slice(3), 'e164': '972' + x.phone.slice(1) });
      toast(x.name + ' נוספה לרשימה');
      render();
    }, function () { toast('ההוספה לא הצליחה. נסי שוב'); });
  }

  /* מחיקה — רק טופס סגור. בשרת ההגדרה עוברת ללשונית "נמחקו" והפניות נשמרות בלשונית מוסתרת (אפשר לשחזר) */
  function fDelete(id) {
    var f = fById(id);
    if (!f || f.open) return;
    var n = (f.rows || []).length;
    if (!window.confirm('למחוק את הטופס "' + f.title + '"?\n' + (n === 1 ? 'פנייה אחת תוסר מהבית. ' : (n ? n + ' פניות יוסרו מהבית. ' : '')) +
      'הטופס ייעלם מהרשימה ומהארכיון. הנתונים נשמרים בגיליון, ומיטל יכולה לשחזר במקרה הצורך.')) return;
    fPost({ action: 'deleteForm', id: id }).then(function () {
      FORMS = FORMS.filter(function (x) { return x.id !== id; });
      toast('הטופס נמחק');
      go('F');
    }, function () { toast('המחיקה לא הצליחה. נסי שוב'); });
  }
  /* דשבורד — שורה מרוכזת אחת, רק כשיש טופס פתוח */
  function dashForms() {
    if (!adminView() || ST.forms !== 'ok') return '';
    var open = FORMS.filter(function (f) { return f.open; });
    if (!open.length) return '';
    var n = 0;
    open.forEach(function (f) { n += fOpenN(f); });
    return '<div class="card" id="dashForms"><h2 class="h2">טפסים פעילים</h2><div class="sumrow">' +
      '<button type="button" class="sumh" data-go="F">' + (n ? n + ' פניות פתוחות' : 'אין פניות פתוחות') + ' · ' +
      (open.length === 1 ? 'טופס פתוח אחד' : open.length + ' טפסים פתוחים') + ' ←</button><div class="gc">' +
      open.map(function (f) {
        if (fIsG(f)) return '<button type="button" class="chip ok" data-go="f:' + esc(f.id) + '">' + esc(f.title) + ' · ' + fRegs(f).length + ' נרשמו</button>';
        var o = fOpenN(f);
        return '<button type="button" class="chip ' + (o ? 'warn' : 'ok') + '" data-go="f:' + esc(f.id) + '">' + esc(f.title) + ' · ' + o + '</button>';
      }).join('') + '</div></div></div>';
  }
  /* עמוד בית ספר (סקירה) — הפניות של בית הספר מכל הטפסים */
  function schoolForms(s) {
    if (!adminView() || ST.forms !== 'ok') return '';
    var items = [];
    FORMS.forEach(function (f) {
      (fIsG(f) ? fRegs(f) : (f.rows || [])).forEach(function (r) { if (SN.canon(fSchoolOf(f, r)) === s.name) items.push({ f: f, r: r }); });
    });
    if (!items.length) return '';
    items.sort(function (a, b) { return String(b.r['חותמת זמן']).localeCompare(String(a.r['חותמת זמן'])); });
    return '<div class="card"><p class="eyebrow">' + I.doc + 'בטפסים הפעילים</p><ul class="list">' + items.map(function (z) {
      return '<li><button type="button" data-go="f:' + esc(z.f.id) + '">' + esc(z.f.title) + ' · ' + esc(fNameOf(z.f, z.r)) +
        '<span>' + esc(fDate(z.r['חותמת זמן'], true)) + ' · ' + (fIsG(z.f) ? 'נרשם.ה' : (fIsDone(z.r) ? F_DONE : F_OPEN)) + '</span></button></li>';
    }).join('') + '</ul></div>';
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
    /* לפני data-go: כפתור שמסנן ואז עובר לרשימה */
    var sd = t.closest('[data-saldoc]');
    if (sd) { e.preventDefault(); openSalDoc(sd.getAttribute('data-saldoc')); return; }
    var gk2 = t.closest('[data-gk]');
    if (gk2) { GKIND = gk2.getAttribute('data-gk'); go('G'); return; }
    var ak2 = t.closest('[data-ak]');
    if (ak2) { AKIND = ak2.getAttribute('data-ak'); go('A'); return; }
    var g = t.closest('[data-go]');
    if (g) { e.preventDefault(); go(g.getAttribute('data-go')); return; }
    var gv = t.closest('[data-gview]');
    if (gv) { GVIEW = gv.getAttribute('data-gview'); try { localStorage.setItem('revital.gapview', GVIEW); } catch (err) {} drawGaps(); return; }
    var gk = t.closest('[data-gkind]');
    if (gk) { var kk = gk.getAttribute('data-gkind'); GKIND = GKIND === kk ? '' : kk; if ($('gkind')) $('gkind').value = GKIND; drawGaps(); return; }
    var tb = t.closest('[data-tab]');
    if (tb) { STAB = tb.getAttribute('data-tab'); setHash(); render(); return; }
    var av = t.closest('[data-aview]');
    if (av) { AVIEW = av.getAttribute('data-aview'); try { localStorage.setItem('revital.attview', AVIEW); } catch (err) {} drawAtt(); return; }
    var ak = t.closest('[data-akind]');
    if (ak) { var ka = ak.getAttribute('data-akind'); AKIND = AKIND === ka ? '' : ka; drawAtt(); return; }
    if (t.closest('[data-nfadd]')) { nfSync(); NF.fields.push({ label: '', type: 'text', req: false, options: '', other: false }); newFormPage(true); return; }
    var nd = t.closest('[data-nfdel]');
    if (nd) { nfSync(); NF.fields.splice(+nd.getAttribute('data-nfdel'), 1); newFormPage(true); return; }
    if (t.closest('#nfCreate')) { nfCreate(); return; }
    var ff = t.closest('[data-ffilt]');
    if (ff) { FFILT = ff.getAttribute('data-ffilt'); render(); return; }
    var fs = t.closest('[data-fst]');
    if (fs) { fSetStatus(fs.getAttribute('data-fid'), fs.getAttribute('data-rid'), fs.getAttribute('data-fst')); return; }
    var fa = t.closest('[data-foadd]');
    if (fa) { fAddSherut(+fa.getAttribute('data-foadd')); return; }
    var fd = t.closest('[data-fdel]');
    if (fd) { fDelete(fd.getAttribute('data-fdel')); return; }
    var fo = t.closest('[data-fopen]');
    if (fo) { fSetOpen(fo.getAttribute('data-fid'), fo.getAttribute('data-fopen') === '1'); return; }
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
  /* בונה הטפסים: שינוי סוג תשובה מציג/מסתיר את שדה האפשרויות */
  document.addEventListener('change', function (e) {
    if (e.target && e.target.classList && e.target.classList.contains('nfType')) { nfSync(); newFormPage(true); }
  });
  window.addEventListener('hashchange', function () { CUR = fromHash(); side(); render(); });

  /* לסיור (tour.js): ניווט בין עמודי הבית */
  window.REVITAL = {
    go: function (to) { go(to); },
    at: function () { return CUR; },
    firstSchool: function () {
      var s = SCHOOLS.filter(function (x) { return BY[x.name].mipui && BY[x.name].mipui.length; })[0] || SCHOOLS[0];
      return s ? 's:' + s.semel : '';
    },
    /* תובי (7.10.26): מה שהדף מחשב ולשרת של תובי אין — חוסרים, דגלים, מנור, נספח, הבית של המפקח.
       רק בתי הספר שבתצוגה. השרת של תובי מקבל רק סמלים שהשער אישר למחובר.ת */
    token: function () { return token(); },
    snap: function () {
      var out = {};
      SCHOOLS.forEach(function (s) { out[s.semel] = snapOf(BY[s.name]); });
      return out;
    }
  };
  function snapOf(r) {
    var s = r.s, x = r.nispach, mf = MEF[String(s.semel)], mef = [];
    if (mf && mf.st === 'ok') {
      (mf.d.visits || []).forEach(function (v) {
        mef.push('ביקור ' + String(v.date || '').slice(0, 10) + (v.purpose ? ' · ' + v.purpose : '') +
          ' · ' + (v.status === 'open' ? 'ביקור פתוח' : (v.hasReport ? 'דוח מאושר' : 'דוח ממתין')));
      });
      (mf.d.tasks || []).filter(function (t) { return t.status !== 'done'; }).forEach(function (t) {
        mef.push('משימה פתוחה: ' + t.title + (t.owner_role ? ' · ' + t.owner_role : '') + (t.due ? ' · עד ' + t.due : '') + (t.late ? ' · באיחור' : ''));
      });
    }
    return {
      n: s.name, sup: supsOf(s).join(', '),
      gaps: gaps(r).map(function (g) { return g.t; }),
      flags: flags(r).map(function (f) { return f.t; }),
      menor: r.menor && r.menor.t ? 'נרשמו ' + r.menor.r + ' מתוך ' + r.menor.t + ' מורים' : '',
      roles: ST.nispach !== 'ok' ? '' : (!x || !x.submitted ? 'הנספח לא הוגש' :
        'הוגש ' + x.ts + ' · ' + x.people.length + ' בעלי תפקידים' + (x.missing.length ? ' · חסרים: ' + x.missing.join(', ') : '')),
      mef: mef, lastMef: r.mvLast || '',
      /* השתלמויות (8.10.26): המוסדית + כמה נרשמו לכל אחת מההשתלמויות המקוונות */
      hisht: [ST.bs !== 'ok' ? '' : (r.bs ? 'השתלמות מוסדית: ' + r.bs.status + (r.bs.name ? ' · ' + r.bs.name : '') : 'השתלמות מוסדית: לא הוגשה'),
        ST.rg !== 'ok' ? '' : 'נרשמו להשתלמויות המקוונות: ' + WS.map(function (w) { return w[1] + ' ' + (Number(r.rg && r.rg[w[0]]) || 0); }).join(', ')
      ].filter(Boolean).join(' · ')
    };
  }

  var started = false;
  function boot() {
    if (started) return; started = true;
    whoAmI();
    var nm = SUPNAME || ME.name || 'מטה';
    $('meName').textContent = nm;
    var first = String(nm).split(/\s+/)[0];
    /* "תובה" = שם המערכת (מיטל, 7.10.26); השם של המחובר.ת נשאר בתפריט הצד */
    $('brandName').textContent = 'תובה';
    document.title = 'תובה · ' + first;
    if (AS) {
      var bar = document.createElement('div');
      bar.className = 'asbar';
      bar.innerHTML = 'תצוגה כמו ש<b>' + esc(AS) + '</b> רואה את הבית · <a href="' + location.pathname + '">חזרה לתצוגה שלי</a>';
      document.body.insertBefore(bar, document.body.firstChild);
    }
    $('out').onclick = function () { PMH_AUTH.logout(); };

    start();
  }
  document.addEventListener('pmh:in', boot);
  document.addEventListener('DOMContentLoaded', function () {
    if (document.documentElement.classList.contains('pmh-in')) boot();
  });
})();
