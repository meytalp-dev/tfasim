/* בעלי התפקידים בבתי הספר — דף המפקח.ת (index.html) ודף רויטל (revital.html).
   הנתונים חיים מגיליון נספח בעלי התפקידים, דרך mode:"view" בשרת הנספח (View.js).
   השרת מאמת את טוקן שער ההרשאות ומחזיר רק את בתי הספר של מי שנכנס;
   מרחב all (רויטל, מיטל) מקבל את כל 64. שום פרט אישי לא יושב בקובץ הזה. */
(function () {
  'use strict';

  var API = 'https://script.google.com/macros/s/AKfycbw_ix0Qi2SkQHB081xdNA15kIQXGsUxO15keTMafPAcWRSy8gyIMmFR6_PV2UZ4_rTiuQ/exec';
  var PAGE = document.body.getAttribute('data-page');   /* mefakchim | revital */

  var ICON = {
    copy:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
    print: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/></svg>',
    arr:   '<svg class="arr" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
    fold:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 15l5 5 5-5M7 9l5-5 5 5"/></svg>'
  };

  var $ = function (id) { return document.getElementById(id); };
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function norm(s) { return String(s || '').replace(/[״"׳'\-–—·.,()]/g, ' ').replace(/\s+/g, ' ').trim(); }

  var DATA = null;

  /* ===== טעינה ===== */
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

  function load() {
    $('main').innerHTML = '<div class="loading">טוען את בעלי התפקידים…</div>';
    fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ mode: 'view', token: token() })
    }).then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.ok) { DATA = d; render(); return; }
        var err = d && d.error;
        if (err === 'badsession' && window.PMH_AUTH) { PMH_AUTH.logout(); return; }
        if (err === 'notinspector') {
          message('אין בתי ספר משויכים לחשבון הזה',
            'הדף מיועד למפקחים הפדגוגיים ולמטה. נכנסת בתור <span dir="ltr">' + esc(d.email || '') +
            '</span>. אם זו טעות, כתבו למיטל.');
          return;
        }
        message('הטעינה לא הצליחה', 'ייתכן שזו תקלה רגעית של גוגל. <button class="btn" id="retry">לנסות שוב</button>');
        $('retry').onclick = load;
      })
      .catch(function () {
        message('הטעינה לא הצליחה', 'בדקו את החיבור לאינטרנט. <button class="btn" id="retry">לנסות שוב</button>');
        $('retry').onclick = load;
      });
  }

  function message(title, html) {
    $('main').innerHTML = '<div class="msg"><h2>' + esc(title) + '</h2><p>' + html + '</p></div>';
  }

  function toast(t) {
    var el = $('toast');
    el.textContent = t;
    el.classList.add('on');
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove('on'); }, 1800);
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

  /* ===== עזרים ===== */
  function inspectors() {
    var seen = {}, out = [];
    DATA.schools.forEach(function (s) {
      s.inspector.split(' · ').forEach(function (n) { if (!seen[n]) { seen[n] = 1; out.push(n); } });
    });
    return out.sort(function (a, b) { return a.localeCompare(b, 'he'); });
  }
  function ofInspector(s, name) { return !name || s.inspector.split(' · ').indexOf(name) > -1; }
  function status(s) {
    if (!s.submitted) return { cls: 'none', t: 'לא הוגש נספח' };
    if (s.missing.length) return { cls: 'gap', t: 'חסרים ' + s.missing.length };
    return { cls: 'ok', t: 'מאויש במלואו' };
  }
  function tel(p) { return p ? '<a href="tel:' + esc(p.replace(/[^\d+]/g, '')) + '" dir="ltr">' + esc(p) + '</a>' : ''; }
  function mail(m) { return m ? '<a href="mailto:' + esc(m) + '" dir="ltr">' + esc(m) + '</a>' : ''; }

  /* תא ריק מסומן e — בנייד הוא מוסתר במקום להציג כותרת בלי ערך */
  function cell(cls, label, html) {
    var c = (cls ? cls + ' ' : '') + (html ? '' : 'e');
    return '<div' + (c.trim() ? ' class="' + c.trim() + '"' : '') + '><span class="k">' + label + '</span>' + html + '</div>';
  }
  function head(first) {
    return '<div class="ph"><div>' + first + '</div><div>שם</div><div>שעות</div><div>משרה</div><div>ותק</div><div>נייד</div><div>מייל</div></div>';
  }
  /* first: 'role' בכרטיס בית ספר · 'school' ברשימה לפי תפקיד */
  function row(p, first, s) {
    var c1 = first === 'school'
      ? '<div class="role">' + esc(s.school) + '<span class="sch">' + esc(s.inspector) + '</span></div>'
      : '<div class="role">' + esc(p.role) + (p.detail ? '<span class="det">' + esc(p.detail) + '</span>' : '') + '</div>';
    var nm = '<div class="nm">' + esc(p.name) +
      (first === 'school' && p.detail ? '<span class="det">' + esc(p.detail) + '</span>' : '') +
      (p.other ? '<span class="oth">גם: ' + esc(p.other) + '</span>' : '') + '</div>';
    return '<div class="pr">' + c1 + nm +
      cell('', 'שעות', esc(p.hours)) +
      cell('', 'משרה', p.scope ? esc(p.scope) + '%' : '') +
      cell('', 'ותק', p.seniority ? esc(p.seniority) + ' שנים' : '') +
      cell('tel', 'נייד', tel(p.phone)) +
      cell('em', 'מייל', mail(p.email)) + '</div>';
  }

  function schoolCard(s, open) {
    var st = status(s);
    var h = '<details class="school"' + (open ? ' open' : '') + ' data-school="' + esc(s.school) + '">' +
      '<summary><span class="nm">' + esc(s.school) + '</span>' +
      '<span class="meta">' + esc(s.network) + (DATA.admin ? ' · ' + esc(s.inspector) : '') + '</span>' +
      '<span class="st ' + st.cls + '">' + st.t + '</span>' + ICON.arr + '</summary><div class="sbody">';
    if (!s.submitted) {
      return h + '<div class="empty">בית הספר עוד לא הגיש את נספח בעלי התפקידים, ולכן כל התפקידים חסרים.</div></div></details>';
    }
    h += '<div class="sinfo">' +
      (s.principal ? '<span>מנהל.ת: <b>' + esc(s.principal) + '</b></span>' : '') +
      (s.classes ? '<span>כיתות: <b>' + s.classes + '</b></span>' : '') +
      '<span>בעלי תפקידים: <b>' + s.people.length + '</b></span>' +
      (s.ts ? '<span>הוגש: <b>' + esc(s.ts) + '</b></span>' : '') + '</div>';
    if (s.six) h += '<div class="sinfo"><span>תפקידי 6%: <b>' + esc(s.six) + '</b></span></div>';
    if (s.missing.length) {
      h += '<div class="missing"><span class="lbl">חסרים:</span><div class="chips">' +
        s.missing.map(function (m) { return '<span class="chip">' + esc(m) + '</span>'; }).join('') + '</div></div>';
    }
    if (s.notes) h += '<div class="note"><b>הערות בית הספר:</b> ' + esc(s.notes) + '</div>';
    if (s.people.length) {
      h += '<div class="ppl">' + head('תפקיד') + s.people.map(function (p) { return row(p, 'role', s); }).join('') + '</div>';
    }
    return h + '</div></details>';
  }

  function gapsText(list) {
    return list.filter(function (s) { return !s.submitted || s.missing.length; }).map(function (s) {
      return s.school + ': ' + (s.submitted ? s.missing.join(' · ') : 'לא הוגש נספח');
    }).join('\n');
  }
  function gapsBox(list) {
    var bad = list.filter(function (s) { return !s.submitted || s.missing.length; });
    var h = '<section class="gaps"><h2><span>מה חסר</span>' +
      (bad.length ? '<button class="btn" id="copyGaps">' + ICON.copy + 'העתקת רשימת החוסרים</button>' : '') + '</h2>';
    if (!bad.length) return h + '<div class="none">בכל בתי הספר כל התפקידים מאוישים.</div></section>';
    h += '<ul>' + bad.map(function (s) {
      return '<li><b>' + esc(s.school) + '</b>' + (DATA.admin ? ' <span class="meta" style="color:var(--muted);font-size:14px">· ' + esc(s.inspector) + '</span>' : '') +
        '<div class="chips">' + (s.submitted
          ? s.missing.map(function (m) { return '<span class="chip">' + esc(m) + '</span>'; }).join('')
          : '<span class="chip amber">לא הוגש נספח</span>') + '</div></li>';
    }).join('') + '</ul></section>';
    return h;
  }

  function kpis(list) {
    var people = 0, gaps = 0, none = 0;
    list.forEach(function (s) {
      people += s.people.length;
      if (!s.submitted) none++;
      else if (s.missing.length) gaps++;
    });
    return '<div class="kpis">' +
      '<div class="kpi"><div class="n">' + list.length + '</div><div class="l">בתי ספר</div></div>' +
      '<div class="kpi"><div class="n">' + people + '</div><div class="l">בעלי תפקידים</div></div>' +
      '<div class="kpi' + (gaps ? ' warn' : '') + '"><div class="n">' + gaps + '</div><div class="l">בתי ספר עם תפקידים חסרים</div></div>' +
      '<div class="kpi' + (none ? ' warn' : '') + '"><div class="n">' + none + '</div><div class="l">לא הגישו נספח</div></div></div>';
  }

  function whoLine() {
    var u = window.PMH_AUTH && PMH_AUTH.user();
    var name = DATA.inspector || (u && u.name) || DATA.email;
    $('who').innerHTML = 'נכנסת בתור <b>' + esc(name) + '</b> · עודכן ' + esc(DATA.generated) +
      ' · <button type="button" id="out">יציאה</button>';
    $('who').hidden = false;
    $('out').onclick = function () { PMH_AUTH.logout(); };
  }

  /* ===== דף המפקח.ת ===== */
  function renderMefakchim() {
    var insp = inspectors();
    var bar = '<div class="bar"><input id="q" type="search" placeholder="חיפוש בית ספר, שם או תפקיד">' +
      (DATA.admin ? '<select id="insp"><option value="">כל המפקחים</option>' +
        insp.map(function (n) { return '<option>' + esc(n) + '</option>'; }).join('') + '</select>' : '') +
      '<button class="btn" id="fold">' + ICON.fold + 'פתיחה / סגירה של הכול</button>' +
      '<button class="btn" id="print">' + ICON.print + 'הדפסה</button></div>';
    $('main').innerHTML = '<div id="top"></div>' + bar + '<div id="list"></div>';

    function draw() {
      var name = DATA.admin ? $('insp').value : '';
      var q = norm($('q').value);
      var list = DATA.schools.filter(function (s) { return ofInspector(s, name); });
      $('top').innerHTML = kpis(list) + gapsBox(list);
      var cb = $('copyGaps');
      if (cb) cb.onclick = function () { copy(gapsText(list), 'רשימת החוסרים הועתקה'); };
      var shown = list.filter(function (s) {
        if (!q) return true;
        var hay = norm([s.school, s.network, s.principal, s.missing.join(' ')].concat(
          s.people.map(function (p) { return p.role + ' ' + p.detail + ' ' + p.name; })).join(' '));
        return hay.indexOf(q) > -1;
      });
      var open = !DATA.admin || !!name || !!q;
      $('list').innerHTML = shown.length ? shown.map(function (s) { return schoolCard(s, open); }).join('')
        : '<div class="msg">לא נמצאו בתי ספר שמתאימים לחיפוש.</div>';
    }
    $('q').oninput = draw;
    if ($('insp')) $('insp').onchange = draw;
    $('print').onclick = function () {
      document.querySelectorAll('details.school').forEach(function (d) { d.open = true; });
      window.print();
    };
    $('fold').onclick = function () {
      var all = document.querySelectorAll('details.school');
      var anyClosed = Array.prototype.some.call(all, function (d) { return !d.open; });
      all.forEach(function (d) { d.open = anyClosed; });
    };
    draw();
  }

  /* ===== דף רויטל ===== */
  function roleOrder() {
    var count = {};
    DATA.schools.forEach(function (s) {
      s.people.forEach(function (p) { count[p.role] = (count[p.role] || 0) + 1; });
    });
    var rest = Object.keys(count).filter(function (r) { return DATA.core.indexOf(r) < 0; })
      .sort(function (a, b) { return count[b] - count[a]; });
    return { list: DATA.core.concat(rest), count: count };
  }
  function shortRole(r) { return r.split(' — ')[0]; }

  function renderRevital() {
    if (!DATA.admin) {
      message('הדף הזה מיועד לרויטל', 'כאן מופיעים כל בתי הספר וכל בעלי התפקידים. ' +
        '<a class="btn" href="./">לבתי הספר שלי</a>');
      return;
    }
    $('main').innerHTML = kpis(DATA.schools) +
      '<div class="tabs" role="tablist">' +
      '<button role="tab" id="t-role" aria-selected="true">לפי תפקיד</button>' +
      '<button role="tab" id="t-school" aria-selected="false">לפי בית ספר</button></div>' +
      '<div id="pane"></div>';
    var tab = 'role';
    try { tab = localStorage.getItem('bt_tab') || 'role'; } catch (e) {}
    function setTab(t) {
      tab = t;
      try { localStorage.setItem('bt_tab', t); } catch (e) {}
      $('t-role').setAttribute('aria-selected', t === 'role');
      $('t-school').setAttribute('aria-selected', t === 'school');
      if (t === 'role') byRole(); else bySchool();
    }
    $('t-role').onclick = function () { setTab('role'); };
    $('t-school').onclick = function () { setTab('school'); };
    setTab(tab);
  }

  function byRole() {
    var ro = roleOrder();
    var cur = ro.list[0];
    try { var saved = localStorage.getItem('bt_role'); if (saved && ro.list.indexOf(saved) > -1) cur = saved; } catch (e) {}
    var insp = inspectors();
    $('pane').innerHTML =
      '<div class="roles" id="roles">' + ro.list.map(function (r) {
        return '<button type="button" data-r="' + esc(r) + '" aria-pressed="' + (r === cur) + '">' +
          esc(shortRole(r)) + '<span class="c">' + (ro.count[r] || 0) + '</span></button>';
      }).join('') + '</div>' +
      '<div class="bar"><input id="q" type="search" placeholder="חיפוש שם או בית ספר">' +
      '<select id="insp"><option value="">כל המפקחים</option>' +
      insp.map(function (n) { return '<option>' + esc(n) + '</option>'; }).join('') + '</select>' +
      '<span class="count" id="cnt"></span></div>' +
      '<div id="rl"></div>';

    function draw() {
      var q = norm($('q').value), name = $('insp').value;
      var rows = [], missing = [];
      DATA.schools.forEach(function (s) {
        if (!ofInspector(s, name)) return;
        if (!s.submitted) { missing.push({ s: s, why: 'לא הוגש נספח' }); return; }
        s.people.forEach(function (p) {
          if (p.role !== cur) return;
          if (q && norm(s.school + ' ' + p.name + ' ' + p.detail).indexOf(q) < 0) return;
          rows.push({ p: p, s: s });
        });
        s.missing.forEach(function (m) {
          if (m === cur || m.indexOf(cur + ' — ') === 0) missing.push({ s: s, why: m === cur ? 'טרם אויש' : m.substring(cur.length + 3) + ' — טרם אויש' });
        });
      });
      $('cnt').textContent = rows.length + ' בעלי תפקידים';
      var h = '<div class="rolehead"><h2>' + esc(cur) + '</h2>' +
        (rows.length ? '<button class="btn primary" id="copyRole">' + ICON.copy + 'העתקת הרשימה (לאקסל)</button>' : '') + '</div>';
      h += rows.length
        ? '<div class="ppl">' + head('בית ספר') + rows.map(function (x) { return row(x.p, 'school', x.s); }).join('') + '</div>'
        : '<div class="msg">אין בעלי תפקידים שמתאימים לסינון.</div>';
      if (missing.length) {
        h += '<section class="gaps"><h2><span>חסר ב-' + missing.length + ' בתי ספר</span></h2><ul>' +
          missing.map(function (x) {
            return '<li><b>' + esc(x.s.school) + '</b> <span style="color:var(--muted);font-size:14px">· ' + esc(x.s.inspector) +
              '</span><div class="chips"><span class="chip' + (x.s.submitted ? '' : ' amber') + '">' + esc(x.why) + '</span></div></li>';
          }).join('') + '</ul></section>';
      }
      $('rl').innerHTML = h;
      if ($('copyRole')) $('copyRole').onclick = function () {
        var t = ['בית ספר', 'מפקח.ת', 'פירוט', 'שם', 'שעות', 'משרה', 'ותק', 'נייד', 'מייל'].join('\t') + '\n' +
          rows.map(function (x) {
            return [x.s.school, x.s.inspector, x.p.detail, x.p.name, x.p.hours, x.p.scope, x.p.seniority, x.p.phone, x.p.email].join('\t');
          }).join('\n');
        copy(t, 'הרשימה הועתקה. אפשר להדביק באקסל');
      };
    }
    $('roles').onclick = function (e) {
      var b = e.target.closest('button[data-r]');
      if (!b) return;
      cur = b.getAttribute('data-r');
      try { localStorage.setItem('bt_role', cur); } catch (err) {}
      document.querySelectorAll('#roles button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      draw();
    };
    $('q').oninput = draw;
    $('insp').onchange = draw;
    draw();
  }

  function bySchool() {
    var insp = inspectors();
    $('pane').innerHTML = '<div class="bar"><input id="q" type="search" placeholder="חיפוש בית ספר, שם או תפקיד">' +
      '<select id="insp"><option value="">כל המפקחים</option>' +
      insp.map(function (n) { return '<option>' + esc(n) + '</option>'; }).join('') + '</select>' +
      '<select id="stf"><option value="">כל בתי הספר</option><option value="gap">עם תפקידים חסרים</option>' +
      '<option value="none">לא הגישו נספח</option></select>' +
      '<button class="btn" id="fold">' + ICON.fold + 'פתיחה / סגירה</button>' +
      '<span class="count" id="cnt"></span></div><div id="sl"></div>';
    function draw() {
      var q = norm($('q').value), name = $('insp').value, stf = $('stf').value;
      var list = DATA.schools.filter(function (s) {
        if (!ofInspector(s, name)) return false;
        if (stf === 'gap' && !(s.submitted && s.missing.length)) return false;
        if (stf === 'none' && s.submitted) return false;
        if (!q) return true;
        return norm([s.school, s.network, s.principal, s.missing.join(' ')].concat(
          s.people.map(function (p) { return p.role + ' ' + p.detail + ' ' + p.name; })).join(' ')).indexOf(q) > -1;
      });
      $('cnt').textContent = list.length + ' בתי ספר';
      $('sl').innerHTML = list.length ? list.map(function (s) { return schoolCard(s, !!q); }).join('')
        : '<div class="msg">לא נמצאו בתי ספר שמתאימים לסינון.</div>';
    }
    $('q').oninput = draw;
    $('insp').onchange = draw;
    $('stf').onchange = draw;
    $('fold').onclick = function () {
      var all = document.querySelectorAll('details.school');
      var anyClosed = Array.prototype.some.call(all, function (d) { return !d.open; });
      all.forEach(function (d) { d.open = anyClosed; });
    };
    draw();
  }

  function render() {
    whoLine();
    if (PAGE === 'revital') renderRevital(); else renderMefakchim();
  }

  /* auth.js חושף את הדף ויורה pmh:in אחרי כניסה; אם הסשן כבר היה תקף — האירוע כבר נורה */
  var started = false;
  function start() { if (started) return; started = true; load(); }
  document.addEventListener('pmh:in', start);
  document.addEventListener('DOMContentLoaded', function () {
    if (document.documentElement.classList.contains('pmh-in')) start();
  });
})();
