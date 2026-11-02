/* ===================================================================
   ניהול בתי ספר — מסך "בתי ספר" למנהל.ת המערכת (v2, 3.11.26)
   נרשם ב-Mabat (national.js) כמסך 'schools' לתפקיד system בלבד, ומצייר רק בתוך ה-el שקיבל.
   הנתונים: schoolsAdmin (לכל בית ספר: הפעלה, מי ברשימה לפי תפקיד עם מיילים ממוסכים, מצב הדיווח, דיווח אחרון, כניסה אחרונה)
   ורשת/מחוז/מגזר/מפקח.ת מ-schools.js. שורה נפתחת כמסך משנה (Mabat.sub) עם פירוט ורענון (stateRefresh).
   "מי טרם": לכל חוסר רשימה שנפתחת, מפולחת לפי מפקח.ת, עם העתקה כטקסט. אין שמות תלמידים ואין מיילים גלויים.
   ה-CSS כאן (קידומת .sa-) על הטוקנים של index.html.
   =================================================================== */
(function () {
  'use strict';
  var CSS = [
    '.sa{display:grid;gap:18px;min-width:0}',
    '.sa-head{display:flex;justify-content:space-between;align-items:baseline;gap:8px 16px;flex-wrap:wrap}',
    '.sa-head h2{font-size:1.7em;font-weight:800;letter-spacing:-.01em;margin:0}.sa-head p{margin:0;color:var(--muted)}',
    '.sa-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}',
    '.sa-kpi{background:var(--card);border:1px solid var(--line);border-radius:var(--r-card);padding:12px 10px;text-align:center}',
    '.sa-kpi b{display:block;font-family:var(--head);font-size:1.7em;color:var(--ink);line-height:1.1}.sa-kpi span{font-size:.85em;color:var(--muted)}.sa-kpi.warn b{color:var(--warn)}',
    '.sa-gaps{display:grid;gap:10px}',
    '.sa-gap{background:var(--card);border:1px solid var(--line);border-inline-start:5px solid var(--no);border-radius:var(--r-card)}',
    '.sa-gap summary{display:flex;align-items:center;gap:10px;min-height:52px;padding:8px 16px;cursor:pointer;list-style:none;font-family:var(--head);font-weight:700}',
    '.sa-gap summary::-webkit-details-marker{display:none}',
    '.sa-gap summary .sa-n{margin-inline-start:auto;color:var(--warn);white-space:nowrap}',
    '.sa-gap summary::after{content:"";width:9px;height:9px;border-inline-start:2px solid var(--muted);border-bottom:2px solid var(--muted);transform:rotate(-45deg);transition:transform .15s;flex:none}',
    '.sa-gap[open] summary::after{transform:rotate(135deg)}',
    '.sa-gap-b{padding:4px 16px 16px;display:grid;gap:12px;border-top:1px solid var(--line)}',
    '.sa-gap-b>p{margin:0;color:var(--muted);font-size:.9em}',
    '.sa-grp h4{display:flex;align-items:center;gap:8px;margin:0 0 6px;font-size:1em;font-family:var(--head);flex-wrap:wrap}.sa-grp h4 small{color:var(--muted);font-weight:400}',
    '.sa-chips{display:flex;gap:6px;flex-wrap:wrap}',
    '.sa-chip{display:inline-block;padding:.25em .7em;border-radius:999px;background:#F3E6CF;color:var(--warn);font-size:.9em}',
    '.sa-cp{display:inline-flex;align-items:center;gap:.4em;min-height:44px;padding:0 .9em;border:1px solid var(--line);border-radius:var(--r-btn);background:var(--card);font-weight:600;color:var(--ink);text-decoration:none}',
    '.sa-cp.mini{font-weight:500;font-size:.88em;margin-inline-start:auto}',
    '.sa-i{width:1.1em;height:1.1em;flex:none;vertical-align:-.2em}',
    '.sa-tools{display:grid;gap:10px}',
    '.sa-find{position:relative}.sa-find input{width:100%;min-height:44px;padding:.6em 1em;padding-inline-start:2.6em;border:1px solid var(--line);border-radius:var(--r-btn);background:var(--card);font:inherit;color:inherit}',
    '.sa-find .sa-i{position:absolute;inset-inline-start:.9em;top:.85em;color:var(--muted)}',
    '.sa-chipbar{display:flex;gap:8px;flex-wrap:wrap}',
    '.sa-fchip{min-height:44px;padding:0 .9em;border-radius:999px;border:1px solid var(--ink);color:var(--ink);background:transparent;font-size:.92em}',
    '.sa-fchip.on{background:var(--ink);color:#fff}',
    '.sa-sels{display:flex;gap:8px;flex-wrap:wrap}',
    '.sa-sels select{min-height:44px;padding:0 .8em;border:1px solid var(--line);border-radius:var(--r-btn);background:var(--card);font:inherit;color:inherit;flex:1 1 160px;max-width:280px}',
    '.sa-count{color:var(--muted);font-size:.9em;margin:0}',
    '.sa-table{background:var(--card);border:1px solid var(--line);border-radius:var(--r-card);overflow:hidden;min-width:0}',
    '.sa-th,.sa-row{display:grid;grid-template-columns:1.8fr 1.2fr .7fr 1fr 1.8fr 1.1fr .9fr;gap:8px;padding:10px 14px;align-items:center;border-top:1px solid var(--line)}',
    '.sa-th{border-top:0;font-size:.82em;color:var(--muted);background:var(--tint)}',
    '.sa-row{width:100%;text-align:start;min-height:52px;color:var(--text);font-size:.95em}.sa-row:hover{background:var(--tint)}',
    '.sa-name{font-family:var(--head);font-weight:700;color:var(--ink)}.sa-name small{display:block;color:var(--muted);font-weight:400;font-family:var(--body);font-size:.8em}',
    '.sa-tag{display:inline-block;font-style:normal;font-size:.8em;padding:.1em .6em;border-radius:999px;background:var(--tint);color:var(--muted);white-space:nowrap}',
    '.sa-tag.ok{background:#E3E9DC;color:var(--ok)}.sa-tag.no{background:#F3E6CF;color:var(--warn)}',
    '.sa-ppl{display:flex;gap:4px;flex-wrap:wrap}.sa-ppl i{font-style:normal;font-size:.78em;padding:.1em .5em;border-radius:999px;background:var(--tint);color:var(--muted);white-space:nowrap}',
    '.sa-ppl i.ok{background:#E3E9DC;color:var(--ok)}.sa-ppl i.no{background:#F3E6CF;color:var(--warn)}',
    '.sa-cell small{display:block;color:var(--muted);font-size:.8em}.sa-m{display:none}',
    '.sa-empty{color:var(--muted);padding:14px;margin:0}.sa-err{color:var(--warn);margin:0}',
    '.sa-det{display:grid;gap:14px}.sa-card{background:var(--card);border:1px solid var(--line);border-radius:var(--r-card);padding:16px 18px;display:grid;gap:10px}',
    '.sa-card h3{font-size:1.05em;margin:0;font-family:var(--head)}',
    '.sa-kv{display:grid;grid-template-columns:auto 1fr;gap:8px 16px;margin:0}.sa-kv dt{color:var(--muted)}.sa-kv dd{margin:0}',
    '.sa-mails{display:flex;gap:6px;flex-wrap:wrap;align-items:center}.sa-mails span{direction:ltr;unicode-bidi:isolate;font-size:.88em;background:var(--tint);padding:.1em .5em;border-radius:6px}',
    '.sa-act{display:flex;gap:8px 14px;flex-wrap:wrap;align-items:center}.sa-act small{color:var(--muted)}',
    '@media (max-width:760px){',
    '.sa-kpis{grid-template-columns:repeat(2,1fr)}.sa-th{display:none}',
    '.sa-row{grid-template-columns:1fr;gap:6px;padding:12px 14px}.sa-row .sa-cell{display:none}',
    '.sa-m{display:flex;gap:6px;flex-wrap:wrap;align-items:center}.sa-m small{flex:1 0 100%;color:var(--muted);font-size:.85em}',
    '.sa-kv{grid-template-columns:1fr;gap:2px 0}.sa-kv dd{margin-bottom:8px}.sa-cp.mini{margin-inline-start:0}',
    '}'
  ].join('\n');
  function style() { if (document.getElementById('sa-style')) return; var s = document.createElement('style'); s.id = 'sa-style'; s.textContent = CSS; document.head.appendChild(s); }

  var ICO = {
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h10"/>',
    refresh: '<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v5h-5"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'
  };
  var svg = function (n) { return '<svg class="sa-i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICO[n] + '</svg>'; };
  var escL = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var ACT = { none: ['לא נטען', ''], pending: ['ממתין להפעלה', 'no'], active: ['הופעל', 'ok'] };
  var REP = { done: ['הוגש', 'ok'], partial: ['חלקי', 'ok'], silent: ['טרם דיווח', 'no'], pending: ['—', ''], none: ['—', ''] };
  var ROLE = { rakaz: 'רכז.ת', principal: 'מנהל.ת', pedco: 'פדגוגי.ת' }, ROLES = ['rakaz', 'principal', 'pedco'];
  var MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  var GAPS = [
    { k: 'none', t: 'טרם הופעלו', of: 'בתי ספר', test: function (x) { return x.activation !== 'active'; } },
    { k: 'silent', t: 'הופעלו וטרם דיווחו החודש', of: 'שהופעלו', base: function (x) { return x.activation === 'active'; }, test: function (x) { return x.activation === 'active' && !reported(x); } },
    { k: 'norakaz', t: 'בלי רכז.ת ברשימה', of: 'בתי ספר', test: function (x) { return !x.people.rakaz.n; } }
  ];
  var FILT = [['all', 'הכול'], ['none', 'לא נטען'], ['pending', 'ממתין'], ['active', 'הופעל'], ['reported', 'דיווחו החודש'], ['silent', 'הופעלו וטרם דיווחו'], ['norakaz', 'בלי רכז.ת']];
  function reported(x) { return x.state === 'partial' || x.state === 'done'; }
  function tag(m, k) { var t = m[k] || ['—', '']; return '<em class="sa-tag ' + t[1] + '">' + t[0] + '</em>'; }
  function ymLbl(ym) { var p = String(ym || '').split('-'); return p.length === 2 ? MONTHS[+p[1] - 1] + ' ' + p[0] : ''; }
  function dmy(s) { var m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? +m[3] + '.' + +m[2] + '.' + m[1].slice(2) : ''; }
  function todayS() { return new Date(Date.now() + 2 * 36e5).toISOString().slice(0, 10); }
  function ago(s) {
    var m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})/); if (!m) return '—';
    var d = Math.round((Date.parse(todayS()) - Date.parse(m[0])) / 864e5);
    return d <= 0 ? 'היום' : d === 1 ? 'אתמול' : 'לפני ' + d + ' ימים';
  }
  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    return new Promise(function (res, rej) {
      var t = document.createElement('textarea'); t.value = text; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.select(); var ok = false; try { ok = document.execCommand('copy'); } catch (e) {} t.remove(); ok ? res() : rej();
    });
  }
  /* ---------- מייל ל"מי טרם": בנייד mailto אמיתי שנבנה בציור, במחשב טיוטת Gmail + HTML מימין לשמאל בלוח (mail-button) ---------- */
  var FROM = 'merhav@pedagogiamh.co.il', SIGN = 'בברכה,\nהמרחב הפדגוגי · המנהל להכשרה מקצועית · משרד העבודה';
  function isMobile() { return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (window.matchMedia && matchMedia('(pointer:coarse)').matches && innerWidth < 900); }
  var MAIL = {
    none: { su: 'מערכת רכזי החניכות · ממתינים להפעלה בבית הספר שלכם', body: function () { return 'שלום רב,\nמערכת רכזי החניכות מוכנה לבית הספר שלכם, ועדיין לא הופעלה. ההפעלה לוקחת כמה דקות: מנהל.ת בית הספר נכנס.ת עם קוד ההפעלה שנשלח במייל, והרכז.ת כבר ברשימה ונכנס.ת ישירות.\nאם הקוד לא הגיע או שמשהו לא עבד, אפשר להשיב למייל הזה ונעזור.'; } },
    silent: { su: function (ym) { return 'מערכת רכזי החניכות · הדיווח של ' + ymLbl(ym) + ' עדיין לא התחיל'; }, body: function (ym) { return 'שלום רב,\nבמערכת רכזי החניכות עדיין לא נרשם דיווח ל' + ymLbl(ym) + ' מבית הספר שלכם: לא נוכחות, לא השמות ולא אישור "החודש אין מועסקים". הנוכחות וההגשה ננעלות ב-10 בחודש הבא.\nאם יש קושי בכניסה או בדיווח, אפשר להשיב למייל הזה ונעזור.'; } },
    norakaz: { su: 'מערכת רכזי החניכות · חסר.ה רכז.ת חניכות ברשימה', body: function () { return 'שלום רב,\nבמערכת רכזי החניכות אין כרגע רכז.ת חניכות פעיל.ה לבית הספר שלכם, ולכן אי אפשר לדווח. מנהל.ת בית הספר מוסיפ.ה רכז.ת במסך הכניסה (שם ומייל), והרכז.ת מקבל.ת קוד כניסה למייל.\nאם משהו לא עבד, אפשר להשיב למייל הזה ונעזור.'; } }
  };
  function mailOf(k, miss, ym) {
    var m = MAIL[k], seen = {}, to = [];
    miss.forEach(function (x) { ['principal', 'rakaz'].forEach(function (r) { ((x.people[r] || {}).email || []).forEach(function (e) { e = String(e).trim().toLowerCase(); if (e && !seen[e]) { seen[e] = 1; to.push(e); } }); }); });
    var su = typeof m.su === 'function' ? m.su(ym) : m.su, text = m.body(ym) + '\n\n' + SIGN;
    var html = '<div dir="rtl" style="text-align:right;font-family:Arial,sans-serif">' + text.split('\n\n').map(function (p) { return '<p>' + escL(p).replace(/\n/g, '<br>') + '</p>'; }).join('') + '</div>';
    return { to: to, su: su, text: text, html: html };
  }
  function mailtoHref(m) {
    var one = m.to.length === 1;
    return 'mailto:' + (one ? encodeURIComponent(m.to[0]) : '') + '?' + (one ? '' : 'bcc=' + encodeURIComponent(m.to.join(',')) + '&') + 'subject=' + encodeURIComponent(m.su) + '&body=' + encodeURIComponent(m.text);
  }
  function gmailHref(m, withBody) {
    var one = m.to.length === 1;
    return 'https://mail.google.com/mail/?authuser=' + encodeURIComponent(FROM) + '&view=cm&fs=1&' + (one ? 'to=' : 'bcc=') + encodeURIComponent(m.to.join(',')) + '&su=' + encodeURIComponent(m.su) + (withBody ? '&body=' + encodeURIComponent(m.text) : '');
  }
  /* העתקה סינכרונית של HTML ללוח, לפני window.open (החלון החדש לוקח את הפוקוס). ה-div בתוך el בלבד */
  function copyHtml(host, html) {
    var d = document.createElement('div'); d.contentEditable = 'true'; d.setAttribute('aria-hidden', 'true'); d.style.cssText = 'position:fixed;inset-inline-start:-9999px;top:0;opacity:0;pointer-events:none'; d.innerHTML = html; host.appendChild(d);
    var ok = false;
    try { var r = document.createRange(); r.selectNodeContents(d); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); ok = document.execCommand('copy'); s.removeAllRanges(); } catch (e) {}
    d.remove(); return ok;
  }
  function pplHtml(p) {
    return '<span class="sa-ppl">' + ROLES.map(function (r) { var o = p[r] || { n: 0, pending: 0 }; return '<i class="' + (o.n ? 'ok' : r === 'rakaz' ? 'no' : '') + '">' + ROLE[r] + ' ' + o.n + (o.pending ? ' +' + o.pending + ' ממתין' : '') + '</i>'; }).join('') + '</span>';
  }
  function lastRepHtml(x) {
    var lr = x.lastReport; if (!lr) return tag(REP, x.activation === 'active' ? 'silent' : 'none');
    return tag(REP, lr.state) + '<small>' + ymLbl(lr.ym) + (lr.upd ? ' · ' + dmy(lr.upd) : '') + '</small>';
  }

  /* ---------- המודל: schoolsAdmin + schools.js ---------- */
  var F = { only: 'all', net: '', sec: '', q: '' }, LAST = null;
  function model(r) {
    var meta = {}; (window.SCHOOLS || []).forEach(function (x) { meta[x.name] = x; });
    return r.schools.map(function (x) {
      var m = meta[x.school] || {}, ppl = {};
      ROLES.forEach(function (k) { ppl[k] = Object.assign({ n: 0, pending: 0, masked: [] }, (x.people || {})[k] || {}); });
      return Object.assign({}, x, { people: ppl, net: m.net || '', d: m.d || '', s: m.s || '', sup: m.sup || '' });
    }).sort(function (a, b) { return a.school.localeCompare(b.school, 'he'); });
  }
  function filt(L) {
    var q = F.q.trim();
    return L.filter(function (x) {
      if (F.net && x.net !== F.net) return false;
      if (F.sec && x.s !== F.sec) return false;
      if (q && (x.school + ' ' + x.semel + ' ' + x.sup + ' ' + x.net + ' ' + x.d).indexOf(q) < 0) return false;
      switch (F.only) {
        case 'none': return x.activation === 'none';
        case 'pending': return x.activation === 'pending';
        case 'active': return x.activation === 'active';
        case 'reported': return reported(x);
        case 'silent': return x.activation === 'active' && !reported(x);
        case 'norakaz': return !x.people.rakaz.n;
      }
      return true;
    });
  }
  /* פילוח לפי מפקח.ת, הקבוצה הגדולה קודם (כלל "מי טרם": לכל מפקח.ת את החסרים שלו.ה) */
  function bySup(L) {
    var g = {}; L.forEach(function (x) { var k = x.sup || 'בלי שיוך'; (g[k] = g[k] || []).push(x.school); });
    return Object.keys(g).map(function (k) { return { sup: k, names: g[k] }; }).sort(function (a, b) { return b.names.length - a.names.length || a.sup.localeCompare(b.sup, 'he'); });
  }
  function gapText(gp, miss, total, grp) {
    var head = gp.t + ' · ' + miss.length + ' מתוך ' + total + ' ' + gp.of;
    if (grp) return grp.sup + ' · ' + gp.t + ' (' + grp.names.length + '):\n' + grp.names.join('\n');
    return head + '\n' + bySup(miss).map(function (g) { return g.sup + ' (' + g.names.length + '): ' + g.names.join(', '); }).join('\n');
  }

  /* ---------- המסך הראשי ---------- */
  function render(el, ctx) {
    style();
    var esc = ctx.esc || escL, api = ctx.api || (window.API && window.API.call), toast = ctx.toast || function (m) { var t = el.querySelector('.sa-toast') || el.appendChild(Object.assign(document.createElement('p'), { className: 'sa-toast sa-count' })); t.textContent = m; };
    if (ctx.me && ctx.me.role !== 'system') { el.innerHTML = '<p class="sa-err">המסך הזה פתוח רק למנהל.ת המערכת</p>'; return; }
    el.innerHTML = '<div class="sa"><div class="sa-head"><h2>בתי ספר</h2><p>טוען…</p></div></div>';
    var done = false;
    api('schoolsAdmin').then(function (r) {
      done = true;
      if (!r || !r.ok) { el.innerHTML = '<div class="sa"><div class="sa-head"><h2>בתי ספר</h2></div><p class="sa-err">הרשימה לא נטענה (' + esc(r && r.error || 'רשת') + ')</p><div><button class="sa-cp" data-act="retry">' + svg('refresh') + 'לנסות שוב</button></div></div>'; el.querySelector('[data-act=retry]').onclick = function () { render(el, ctx); }; return; }
      LAST = { ym: r.ym, L: model(r) }; paint();
    }, function (e) { done = true; el.innerHTML = '<div class="sa"><div class="sa-head"><h2>בתי ספר</h2></div><p class="sa-err">הרשימה לא נטענה (' + esc(e && e.message || 'רשת') + ')</p><div><button class="sa-cp" data-act="retry">' + svg('refresh') + 'לנסות שוב</button></div></div>'; el.querySelector('[data-act=retry]').onclick = function () { render(el, ctx); }; });

    function paint() {
      var L = LAST.L, N = L.length, shown = filt(L);
      var act = L.filter(function (x) { return x.activation === 'active'; }).length, pend = L.filter(function (x) { return x.activation === 'pending'; }).length;
      var rep = L.filter(reported).length, noR = L.filter(function (x) { return !x.people.rakaz.n; }).length;
      var nets = uniq(L.map(function (x) { return x.net; })), secs = uniq(L.map(function (x) { return x.s; }));
      var kp = [[act, 'הופעלו מתוך ' + N, ''], [pend, 'ממתינים להפעלה', pend ? 'warn' : ''], [rep, 'דיווחו ב' + ymLbl(LAST.ym), ''], [noR, 'בלי רכז.ת ברשימה', noR ? 'warn' : '']];
      el.innerHTML = '<div class="sa">'
        + '<div class="sa-head"><h2>בתי ספר</h2><p>' + N + ' בתי ספר · ' + esc(ymLbl(LAST.ym)) + '</p></div>'
        + '<div class="sa-kpis">' + kp.map(function (k) { return '<div class="sa-kpi ' + k[2] + '"><b>' + k[0] + '</b><span>' + k[1] + '</span></div>'; }).join('') + '</div>'
        + '<div class="sa-gaps">' + GAPS.map(function (gp) {
          var base = gp.base ? L.filter(gp.base) : L, miss = L.filter(gp.test), gs = bySup(miss);
          var m = miss.length ? mailOf(gp.k, miss, LAST.ym) : null;
          var mailBtn = !m ? '' : !m.to.length ? '<small>אין מיילים ברשימה</small>'
            : isMobile() ? '<a class="sa-cp" data-mailto="' + gp.k + '" href="' + esc(mailtoHref(m)) + '">' + svg('mail') + 'מייל ל-' + m.to.length + '</a>'
              : '<button class="sa-cp" data-mail="' + gp.k + '">' + svg('mail') + 'מייל ל-' + m.to.length + '</button>';
          return '<details class="sa-gap" data-gap="' + gp.k + '"><summary>' + gp.t + '<span class="sa-n">' + miss.length + ' מתוך ' + base.length + '</span></summary><div class="sa-gap-b">'
            + (miss.length ? '<div class="sa-act"><button class="sa-cp" data-copy="' + gp.k + '">' + svg('copy') + 'העתקת הרשימה</button>' + mailBtn + '<small>' + (m.to.length ? 'מייל למנהל.ת ולרכז.ת של בתי הספר ברשימה' + (m.to.length > 1 ? ', בעותק סמוי' : '') + ', מהמרחב · ' : '') + 'ההעתקה לפי מפקח.ת</small></div>'
              + gs.map(function (g, i) { return '<div class="sa-grp"><h4>' + esc(g.sup) + ' <small>' + g.names.length + '</small><button class="sa-cp mini" data-copy="' + gp.k + '" data-grp="' + i + '">' + svg('copy') + 'העתקה</button></h4><div class="sa-chips">' + g.names.map(function (n) { return '<span class="sa-chip">' + esc(n) + '</span>'; }).join('') + '</div></div>'; }).join('')
              : '<p>אין. כולם ' + (gp.k === 'norakaz' ? 'עם רכז.ת' : gp.k === 'none' ? 'הופעלו' : 'דיווחו') + '.</p>')
            + '</div></details>';
        }).join('') + '</div>'
        + '<div class="sa-tools"><div class="sa-find">' + svg('search') + '<input type="search" placeholder="חיפוש: בית ספר, סמל, מפקח.ת, רשת" value="' + esc(F.q) + '" aria-label="חיפוש"></div>'
        + '<div class="sa-chipbar">' + FILT.map(function (f) { return '<button class="sa-fchip' + (F.only === f[0] ? ' on' : '') + '" data-only="' + f[0] + '">' + f[1] + '</button>'; }).join('') + '</div>'
        + '<div class="sa-sels"><select data-f="net" aria-label="רשת"><option value="">כל הרשתות</option>' + nets.map(function (n) { return '<option' + (F.net === n ? ' selected' : '') + '>' + esc(n) + '</option>'; }).join('') + '</select>'
        + '<select data-f="sec" aria-label="מגזר"><option value="">כל המגזרים</option>' + secs.map(function (n) { return '<option' + (F.sec === n ? ' selected' : '') + '>' + esc(n) + '</option>'; }).join('') + '</select></div>'
        + '<p class="sa-count">' + shown.length + ' מתוך ' + N + ' ברשימה</p></div>'
        + '<div class="sa-table"><div class="sa-th"><span>בית ספר · מפקח.ת</span><span>רשת · מחוז</span><span>מגזר</span><span>הפעלה</span><span>ברשימה</span><span>דיווח אחרון</span><span>כניסה אחרונה</span></div>'
        + (shown.map(rowHtml).join('') || '<p class="sa-empty">לא נמצא.</p>') + '</div></div>';
      bind();
    }
    function rowHtml(x) {
      return '<button class="sa-row" data-school="' + esc(x.school) + '">'
        + '<span class="sa-name">' + esc(x.school) + '<small>' + esc(x.sup || '') + '</small></span>'
        + '<span class="sa-cell">' + esc(x.net) + ' · ' + esc(x.d) + '</span><span class="sa-cell">' + esc(x.s) + '</span>'
        + '<span class="sa-cell">' + tag(ACT, x.activation) + '</span><span class="sa-cell">' + pplHtml(x.people) + '</span>'
        + '<span class="sa-cell">' + lastRepHtml(x) + '</span><span class="sa-cell">' + ago(x.lastLogin) + '</span>'
        + '<span class="sa-m">' + tag(ACT, x.activation) + (x.activation === 'active' ? tag(REP, reported(x) ? x.state : 'silent') : '') + (x.people.rakaz.n ? '' : '<em class="sa-tag no">בלי רכז.ת</em>') + '<small>' + esc(x.net) + ' · ' + esc(x.d) + ' · ' + esc(x.s) + ' · כניסה: ' + ago(x.lastLogin) + '</small></span>'
        + '</button>';
    }
    function bind() {
      var root = el.querySelector('.sa');
      root.querySelector('.sa-find input').oninput = function (e) { F.q = e.target.value; repaintList(); };
      root.querySelectorAll('[data-f]').forEach(function (s) { s.onchange = function () { F[s.dataset.f] = s.value; repaintList(); }; });
      root.onclick = function (e) {
        var b = e.target.closest('[data-only]'); if (b) { F.only = b.dataset.only; root.querySelectorAll('[data-only]').forEach(function (c) { c.classList.toggle('on', c === b); }); repaintList(); return; }
        var c = e.target.closest('[data-copy]'); if (c) { doCopy(c); return; }
        var ml = e.target.closest('[data-mail]'); if (ml) { doMail(ml.dataset.mail); return; }
        if (e.target.closest('[data-mailto]')) return;   /* בנייד: קישור mailto אמיתי, הדפדפן פותח */
        var r = e.target.closest('[data-school]'); if (r) openRow(r.dataset.school);
      };
    }
    /* מחשב: הנוסח מועתק כ-HTML מימין לשמאל, ואז טיוטת Gmail מ-merhav עם הנמענים והנושא. מיטל מדביקה ב-Ctrl+V */
    function doMail(k) {
      var gp = GAPS.filter(function (g) { return g.k === k; })[0], m = mailOf(k, LAST.L.filter(gp.test), LAST.ym);
      if (!m.to.length) return toast('אין מיילים ברשימה');
      var copied = copyHtml(el, m.html);
      var w = window.open(gmailHref(m, !copied), '_blank');
      if (!w) return toast('הדפדפן חסם את החלון. הנוסח ' + (copied ? 'הועתק ללוח' : 'לא הועתק'));
      toast(copied ? 'הנוסח הועתק. בטיוטה: לחצי בגוף המייל ו-Ctrl+V' : 'הטיוטה נפתחה עם הנוסח בגוף (בלי יישור לימין)');
    }
    function repaintList() {
      var shown = filt(LAST.L), t = el.querySelector('.sa-table');
      t.innerHTML = t.firstElementChild.outerHTML + (shown.map(rowHtml).join('') || '<p class="sa-empty">לא נמצא.</p>');
      el.querySelector('.sa-count').textContent = shown.length + ' מתוך ' + LAST.L.length + ' ברשימה';
    }
    function doCopy(b) {
      var gp = GAPS.filter(function (g) { return g.k === b.dataset.copy; })[0], L = LAST.L, miss = L.filter(gp.test), base = gp.base ? L.filter(gp.base) : L;
      var grp = b.dataset.grp != null ? bySup(miss)[+b.dataset.grp] : null;
      copy(gapText(gp, miss, base.length, grp)).then(function () { toast(grp ? 'הרשימה של ' + grp.sup + ' הועתקה' : 'הרשימה הועתקה'); }, function () { toast('ההעתקה לא הצליחה'); });
    }

    /* ---------- מסך משנה: בית ספר אחד ---------- */
    function openRow(name) {
      var x = LAST.L.filter(function (y) { return y.school === name; })[0], sub = ctx.sub || (window.Mabat && window.Mabat.sub);
      if (!x || typeof sub !== 'function') return;
      sub({ key: 'sa-school', title: esc(x.school), html: function () { return detHtml(x); }, bind: function (body) {
        var b = body.querySelector('[data-act=refresh]');
        b.onclick = function () {
          b.disabled = true; var t = b.innerHTML; b.innerHTML = 'מחשב…';
          api('stateRefresh', { school: x.school }).then(function (r) {
            b.disabled = false; b.innerHTML = t;
            if (!r || !r.ok) return toast('הרענון לא הצליח (' + (r && r.error || 'רשת') + ')');
            x.state = r.state; x.calcAt = r.calcAt || x.calcAt; if (reported(x)) x.lastReport = { ym: r.ym, state: r.state, upd: todayS() };
            var rep = body.querySelector('[data-rep]'); if (rep) rep.innerHTML = repKv(x);
            toast('החישוב עודכן');
          }, function () { b.disabled = false; b.innerHTML = t; toast('הרענון לא הצליח'); });
        };
      } });
    }
    function repKv(x) {
      return '<dt>החודש</dt><dd>' + tag(REP, x.activation === 'active' ? (reported(x) ? x.state : 'silent') : 'none') + (x.calcAt ? ' <small class="sa-count">חושב ' + esc(x.calcAt) + '</small>' : '') + '</dd>'
        + '<dt>דיווח אחרון</dt><dd>' + (x.lastReport ? tag(REP, x.lastReport.state) + ' ' + esc(ymLbl(x.lastReport.ym)) + (x.lastReport.upd ? ' · ' + dmy(x.lastReport.upd) : '') : '—') + '</dd>'
        + '<dt>כניסה אחרונה</dt><dd>' + ago(x.lastLogin) + (x.lastLogin ? ' <small class="sa-count">' + esc(x.lastLogin) + '</small>' : '') + '</dd>';
    }
    function detHtml(x) {
      return '<div class="sa-det">'
        + '<div class="sa-card"><h3>בית הספר</h3><dl class="sa-kv"><dt>סמל</dt><dd>' + esc(x.semel || '—') + '</dd><dt>רשת · מחוז</dt><dd>' + esc(x.net || '—') + ' · ' + esc(x.d || '—') + '</dd><dt>מגזר</dt><dd>' + esc(x.s || '—') + '</dd><dt>מפקח.ת פדגוגי.ת</dt><dd>' + esc(x.sup || '—') + '</dd><dt>הפעלה</dt><dd>' + tag(ACT, x.activation) + '</dd></dl></div>'
        + '<div class="sa-card"><h3>מי ברשימה</h3><dl class="sa-kv">' + ROLES.map(function (r) { var o = x.people[r]; return '<dt>' + ROLE[r] + '</dt><dd>' + (o.n ? '<span class="sa-mails">' + o.masked.map(function (m) { return '<span>' + esc(m) + '</span>'; }).join('') + '</span>' : '<em class="sa-tag ' + (r === 'rakaz' ? 'no' : '') + '">אין</em>') + (o.pending ? ' <small class="sa-count">+' + o.pending + ' ממתין לאישור</small>' : '') + '</dd>'; }).join('') + '</dl></div>'
        + '<div class="sa-card"><h3>דיווח וכניסה</h3><dl class="sa-kv" data-rep>' + repKv(x) + '</dl><div class="sa-act"><button class="sa-cp" data-act="refresh">' + svg('refresh') + 'חישוב מחדש</button><small>מחשב את המצב של בית הספר הזה עכשיו</small></div></div>'
        + '</div>';
    }
    function uniq(a) { var s = {}; return a.filter(function (x) { return x && !s[x] && (s[x] = 1); }).sort(function (p, q) { return p.localeCompare(q, 'he'); }); }
  }

  function register() {
    if (!window.Mabat || typeof window.Mabat.register !== 'function') return false;
    window.Mabat.register('schools', { title: 'בתי ספר', icon: 'building', roles: ['system'], render: render });
    return true;
  }
  if (!register()) document.addEventListener('DOMContentLoaded', register);
})();
