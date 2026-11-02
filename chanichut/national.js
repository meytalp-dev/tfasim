/* ===================================================================
   המבט הארצי ומבטי הפיקוח — מערכת רכזי החניכות v2 (3.11.26)
   לתפקידים בלי מפתח בית ספר: system, staff, ped, pro, net. gate.js קורא ל-window.startMabat(me, { logout }).
   כל המספרים מהשרת בלבד: natStats (חודשים ותמונת מצב), natBaseline (נקודת הפתיחה החיצונית, בנפרד),
   schoolAnon ("תלמיד.ה N", בלי שמות), schoolEmps (מעסיקים, ל-system/ped/pro). השרת כבר מסנן לפי ההיקף של התפקיד.
   המבנה והעיצוב מהמוקאפ המאושר (מוקאפ-כיוונים/mock2.js מ-renderNatHome ואילך, b2.html).
   window.Mabat = { register, open, sub } מוגדר לפני startMabat: schools-admin.js רושם את "בתי ספר" ל-system.
   =================================================================== */
(function () {
  'use strict';
  const I = {
    check: '<path d="m5 12 4 4L19 7"/>', back: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    building: '<path d="M4 21V5h10v16M14 10h6v11M8 9h2M8 13h2M8 17h2"/>',
    file: '<path d="M6 2h8l5 5v15H6z"/><path d="M14 2v5h5"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    download: '<path d="M12 4v12M6 10l6 6 6-6"/><path d="M4 20h16"/>',
    map: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    print: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 14h12v7H6z"/>',
    out: '<path d="M10 4H5v16h5"/><path d="M14 8l-4 4 4 4"/><path d="M10 12h10"/>'
  };
  const ic = n => `<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${I[n] || I.chart}</svg>`;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const $ = id => document.getElementById(id);
  const chev = '<span class="arr" aria-hidden="true"></span>';
  const LOGO = '<svg class="brand-mark" viewBox="0 0 320 350" aria-hidden="true"><path d="M74 300 V118 C74 72 102 44 148 44 H160" fill="none" stroke="#1D4F5E" stroke-width="76" stroke-linecap="round" stroke-linejoin="round"/><path d="M130 6 H226 A60 60 0 0 1 286 66 V74 C262 78 246 94 238 116 L222 82 H166 Z" fill="#C4862A"/><rect x="206" y="22" width="80" height="312" rx="40" fill="#7F9A8E" stroke="#F6F2E9" stroke-width="9" paint-order="stroke"/></svg>';
  const heb = n => n == null ? '—' : Number(n).toLocaleString('he');
  const dash = v => v == null ? '—' : v;

  /* ================= הממשק לסוכנים אחרים: Mabat.register / open / sub ================= */
  const REG = [];
  let CTX = null, OPEN = null, SUB = null;
  window.Mabat = {
    register(id, o) { if (!id || REG.some(r => r.id === id)) return; REG.push(Object.assign({ id: String(id), roles: [] }, o || {})); if (CTX) CTX.nav(); },
    open(id) { if (OPEN) OPEN(String(id)); },
    sub(spec) { if (SUB) SUB(spec); }
  };

  /* ================= 64 בתי הספר (schools.js) והמגמות עם המפקחים המקצועיים (megamot.js). רק שמות וסיווגים, בלי מספרים ================= */
  const SCHOOLS = window.SCHOOLS || [];
  const BY_NAME = {}; SCHOOLS.forEach(x => { if (!BY_NAME[x.name]) BY_NAME[x.name] = x; });
  const nkey = s => String(s || '').replace(/[^א-ת0-9A-Za-z]/g, '');
  const NO_PS = 'ללא מפקח.ת מקצועי.ת';
  let MEG = {}, MG_NAME = {};
  /* megamot.js נטען כאן אם index.html לא טען אותו (הקובץ ליד national.js) */
  function loadMeg() {
    return new Promise(res => {
      const done = () => { MEG = window.MEGAMOT || {}; const c = {}; Object.values(MEG).forEach(l => l.forEach(([mg, code]) => { if (!code) return; const k = c[code] = c[code] || {}; k[mg] = (k[mg] || 0) + 1; })); MG_NAME = {}; for (const k in c) MG_NAME[k] = Object.entries(c[k]).sort((a, b) => b[1] - a[1])[0][0]; res(); };
      if (window.MEGAMOT) return done();
      const s = document.createElement('script'); s.src = 'megamot.js'; s.onload = done; s.onerror = done; document.head.appendChild(s);
    });
  }
  function psOf(semel, code, name) { const l = MEG[semel] || []; let m = code ? l.find(r => String(r[1]) === String(code)) : null; if (!m) m = l.find(r => nkey(r[0]) === nkey(name)); return m ? m[2] : ''; }

  /* ================= חישובים: אחוז רק על מי שדיווחו, null במקום 0 ================= */
  const sum = (l, k) => l.reduce((a, x) => a + (+x[k] || 0), 0);
  const empPct = x => x && x.w != null && x.n ? Math.round(x.w / x.n * 100) : null;
  const lvl = p => p == null ? 'x' : p > 70 ? 'g' : p >= 40 ? 'o' : 'r';
  const pc = p => p == null ? '<span class="pc x">—</span>' : `<span class="pc ${lvl(p)}">${p}%</span>`;
  const BANDS = [['g', 'מעל 70%'], ['o', '40%–70%'], ['r', 'מתחת ל-40%']];
  const STATE_T = { none: 'אין מרחב', pending: 'לא הופעל', silent: 'טרם דיווח', partial: 'בדיווח', done: 'דיווח מלא' };
  const stateTag = x => x.state === 'done' ? '<em class="tag ok">דיווח מלא</em>' : x.state === 'partial' ? `<em class="tag part">בדיווח${x.allMg ? ` · ${x.subMg || 0} מתוך ${x.allMg} מגמות` : ''}</em>` : `<em class="tag x">${STATE_T[x.state] || 'טרם דיווח'}</em>`;
  /* סיכום של רשימה: מספרים רק מהמדווחים, והכיסוי לצידם */
  function agg(l) {
    const R = l.filter(x => x.rep), io = R.length > 0 && R.every(x => x.out != null), T = sum(R, 'attT');
    return { cnt: l.length, rep: R.length, n: l.some(x => x.n != null) ? sum(l.filter(x => x.n != null), 'n') : null, nRep: R.length ? sum(R, 'n') : null,
      w: R.length ? sum(R, 'w') : null, out: io ? sum(R, 'out') : null, inn: io ? sum(R, 'inn') : null, none: R.length ? sum(R, 'none') : null, noData: R.length ? sum(R, 'noData') : null,
      places: R.length && R.some(x => x.places != null) ? sum(R, 'places') : null, att: T ? Math.round(sum(R, 'attP') / T * 100) : null, attT: T, attP: sum(R, 'attP'), rep1: R.length > 0 };
  }
  const covTxt = A => A.cnt === A.rep ? `דיווחו כל ${A.cnt} בתי הספר` : `דיווחו ${A.rep} מתוך ${A.cnt} בתי ספר` + (A.n != null && A.nRep != null ? ` · ${heb(A.nRep)} מתוך ${heb(A.n)} תלמידים` : '');
  const dl = (now, was, u = '') => { if (now == null || was == null) return '<span class="dl">—</span>'; const d = now - was; return `<span class="dl">${d ? (d > 0 ? '▲' : '▼') + ' ' + Math.abs(d) + u : 'ללא שינוי'}</span>`; };
  const ioSeg = (out, inn) => (out ? `<i class="io-o" style="flex:${out} 1 0"></i>` : '') + (inn ? `<i class="io-i" style="flex:${inn} 1 0"></i>` : '');
  const monName = ym => { const p = String(ym || '').split('-'); const N = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']; return N[+p[1] - 1] || ym; };
  const table = (cols, rows, cls) => `<div class="mg-row mg-head">${cols.map(c => `<span>${c[0]}</span>`).join('')}</div>` + rows.map(r => `<div class="mg-row ${cls ? cls(r) : ''}">${cols.map((c, i) => `<span${i ? ` data-l="${c[0]}"` : ''}>${c[1](r)}</span>`).join('')}</div>`).join('') + (rows.length ? '' : '<div class="mg-row"><span class="empty">לא נמצא.</span></div>');
  const tbl = (cols, rows, cls) => `<div class="mg-table cards nat9" style="--c:${Math.max(1, cols.length - 2)}">${table(cols, rows, cls)}</div>`;
  const kpiHtml = ([v, l, d, c, act]) => { const t = act ? 'button' : 'div'; return `<${t} class="kpi ${act ? 'kpi-btn' : ''}" ${act ? 'data-zero="1"' : ''}><b class="${c || ''}">${v}</b><span>${l}</span>${d ? `<small class="kd">${d}</small>` : ''}${act ? `<small class="kpi-go">לרשימה ${chev}</small>` : ''}</${t}>`; };

  /* ================= המבט ================= */
  window.startMabat = function (me, hooks) {
    const ROLE = me.role, API_ = window.API;
    const ROLE_LBL = { system: 'מנהל.ת המערכת', staff: 'מטה', ped: 'מפקח.ת פדגוגי.ת', pro: 'מפקח.ת מקצועי.ת', net: 'מנהל.ת רשת' };
    const TITLE = { system: 'החניכות בכל הארץ', staff: 'המבט שלך · מטה', ped: 'המבט שלך · מפקח.ת פדגוגי.ת', pro: 'המבט שלך · מפקח.ת מקצועי.ת', net: 'המבט שלך · מנהל.ת רשת' };
    const SEE_EMPS = ['system', 'ped', 'pro'].includes(ROLE);
    const HOME = ROLE === 'pro' ? 'pikuah' : 'national';
    document.body.dataset.role = ROLE;
    const root = $('app');
    root.innerHTML = `
  <header class="top">
    <div class="brand">${LOGO}<div><b>חניכות</b><small id="roleLbl">${esc(me.school)} · ${ROLE_LBL[ROLE] || ROLE}</small></div><img class="top-minhal" src="logo-minhal.png" alt="משרד העבודה · מינהל הכשרה מקצועית"></div>
    <nav class="nav" id="nav"></nav>
    <div class="actions"><button class="btn quiet" id="logout">יציאה</button></div>
  </header>
  <main class="page"><div class="content">
    <section class="sec natv" id="national">
      <div class="sec-head row-head"><h2>${TITLE[ROLE] || 'המבט שלך'} <span id="natTag"></span></h2><button class="btn noprint" data-act="print">${ic('print')}הדפסה</button></div>
      <div class="nat-months noprint" id="natMonths"></div>
      <div class="nh-grid" id="natHome"></div>
      <div id="natBase"></div>
      <h3 class="sub-h">הקטגוריות</h3>
      <div class="nc-grid" id="natCats"></div>
      <p class="hint" id="natHomeNo"></p>
    </section>
    <section class="sec natv" id="natcat">
      <div class="sec-head row-head sub-head"><button class="btn quiet noprint" data-act="nat-back">${ic('back')}חזרה</button><h2><span id="natCatT"></span> <span id="natCatTag"></span></h2><button class="btn noprint" data-act="print">${ic('print')}הדפסה</button></div>
      <div class="nat-months noprint" id="natMonthsC"></div>
      <p class="cov" id="natCov"></p>
      <div class="kpis nat-top" id="natKpis"></div>
      <div class="nat-grid"><div class="nat-main">
      <details class="insights" id="natIns"></details>
      <p class="print-only" id="natPrintMeta"></p>
      <div id="natChart"></div>
      <div class="filt-row noprint"><div class="finder nat-find"><span class="finder-ic">${ic('search')}</span><input id="natFind" class="find" placeholder="בית ספר, רשת או מחוז" autocomplete="off"></div><div class="chips filt" id="natChips"></div></div>
      <div class="cmp-row noprint"><div id="natCmpC"></div><button class="chip nat-sort" id="natByCh" hidden>מיון לפי השינוי</button></div>
      <div class="mg-table cards" id="natTable"></div>
      </div><aside class="lights" id="natLights"></aside></div>
    </section>
    <section class="sec natv" id="pikuah">
      <div class="sec-head row-head"><h2>${TITLE.pro} <span id="pkTag"></span></h2><button class="btn noprint" data-act="print">${ic('print')}הדפסה</button></div>
      <div class="nat-months noprint" id="pkMonths"></div>
      <p class="cov" id="pkCov"></p>
      <div class="kpis" id="pkKpis"></div>
      <div id="pkBase"></div>
      <div id="pkChart"></div>
      <p class="pc-leg"><span class="pc g">מעל 70%</span><span class="pc o">40%–70%</span><span class="pc r">מתחת ל-40%</span><span class="pc x">טרם דיווח</span></p>
      <div class="cmp-row noprint"><div id="pkCmpC"></div></div>
      <div class="mg-table cards" id="pkTable"></div>
      <div id="pkUnrep"></div>
    </section>
    <section class="sec" id="sub">
      <div class="sec-head row-head sub-head"><button class="btn quiet noprint" data-act="sub-back">${ic('back')}חזרה</button><h2 id="subTitle"></h2></div>
      <div id="subBody"></div>
    </section>
  </div></main>
  <footer class="foot">המרחב הפדגוגי · המנהל להכשרה מקצועית · משרד העבודה<br><a href="https://impactos.co.il/" dir="ltr">impactos</a> נבנה על ידי</footer>
  <nav class="tabbar mb" id="tabbar"></nav>
  <div class="toast" id="toast" hidden></div>`;
    let toastT; function toast(m) { const t = $('toast'); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 2600); }

    /* ---------- ניווט, מסכי משנה והיסטוריה (כמו ב-app.js: "חזרה" של הטלפון חוזרת מסך אחד) ---------- */
    const content = root.querySelector('.content');
    const mine = () => REG.filter(r => (r.roles || []).includes(ROLE));
    const VIEWS = () => [HOME, 'natcat', 'sub'].concat(mine().map(r => 'mb-' + r.id));
    const cur = () => document.body.dataset.view;
    const SUBS = []; let subParent = HOME; const SCROLL = {};
    function secFor(id) { let el = $('mb-' + id); if (!el) { el = document.createElement('section'); el.className = 'sec'; el.id = 'mb-' + id; content.insertBefore(el, $('sub')); } return el; }
    function renderNav() {
      const items = [[HOME, 'chart', 'סקירה']].concat(mine().map(r => ['mb-' + r.id, r.icon || 'building', r.title || r.id]));
      $('nav').innerHTML = items.map(([v, i, l]) => `<a href="#${v}" data-v="${v}">${ic(i)}<span>${esc(l)}</span></a>`).join('');
      $('tabbar').innerHTML = items.map(([v, i, l]) => `<a href="#${v}" data-v="${v}">${ic(i)}<span>${esc(l)}</span></a>`).join('') + `<button type="button" data-act="logout">${ic('out')}<span>יציאה</span></button>`;
      markNav();
    }
    function markNav() {
      const v = cur() === 'sub' ? subParent : cur(), top = v === 'natcat' ? HOME : v;
      document.querySelectorAll('#nav a, #tabbar a').forEach(a => a.classList.toggle('cur', a.dataset.v === top));
    }
    function show(view) { content.querySelectorAll(':scope>.sec').forEach(s => s.classList.toggle('mb-cur', s.id === view)); document.body.dataset.view = view; markNav(); }
    function go(view, o = {}) {
      if (!VIEWS().includes(view) || view === 'sub') view = HOME;
      if (!o.pop) SUBS.length = 0;
      const same = cur() === view;
      if (view.startsWith('mb-')) { const r = REG.find(x => 'mb-' + x.id === view); if (r && typeof r.render === 'function') { const el = secFor(r.id); try { r.render(el, CTX); } catch (e) { el.innerHTML = `<p class="warn">המסך לא נטען (${esc(e.message)})</p>`; } } }
      show(view); window.scrollTo(0, o.scroll || 0);
      try { if (o.pop) { } else if (o.replace || same) history.replaceState({ v: view, d: 0 }, '', '#' + view); else history.pushState({ v: view, d: 0 }, '', '#' + view); } catch (e) {}
    }
    const topSub = () => SUBS[SUBS.length - 1];
    function paintSub() {
      const s = topSub(); if (!s) return; subParent = s.parent || subParent;
      $('subTitle').innerHTML = typeof s.title === 'function' ? s.title() : s.title;
      const old = $('subBody'), body = old.cloneNode(false); old.replaceWith(body); body.innerHTML = s.html();
      if (s.bind) s.bind(body, s);
      markNav();
    }
    function openSub(spec, o = {}) {
      const from = cur();
      if (from !== 'sub') { SCROLL[from] = window.scrollY; spec.parent = spec.parent || from; } else spec.parent = spec.parent || topSub().parent;
      if (o.replace && SUBS.length) { SUBS[SUBS.length - 1] = spec; history.replaceState({ v: 'sub', d: SUBS.length }, '', '#sub'); }
      else { SUBS.push(spec); history.pushState({ v: 'sub', d: SUBS.length }, '', '#sub'); }
      paintSub(); show('sub'); window.scrollTo(0, 0);
      if (typeof spec.load === 'function') spec.load().then(() => { if (topSub() === spec && cur() === 'sub') paintSub(); }, e => { if (topSub() === spec) { spec.err = e && e.message || 'רשת'; if (cur() === 'sub') paintSub(); } });
    }
    function closeSub() { history.back(); }
    window.addEventListener('popstate', e => {
      const st = e.state || { v: HOME, d: 0 };
      if (st.v === 'sub') {
        while (SUBS.length > st.d) SUBS.pop();
        if (SUBS.length && SUBS.length === st.d) { paintSub(); show('sub'); window.scrollTo(0, 0); return; }
        SUBS.length = 0; go(subParent, { pop: true, scroll: SCROLL[subParent] }); return;
      }
      const fromSub = SUBS.length > 0; SUBS.length = 0; go(st.v, { pop: true, scroll: fromSub ? SCROLL[st.v] : 0 });
    });
    const logout = () => hooks && hooks.logout ? hooks.logout() : location.reload();
    $('logout').onclick = logout;
    document.addEventListener('click', e => {
      if (e.target.closest('[data-act="logout"]')) return logout();
      if (e.target.closest('[data-act="print"]')) return window.print();
      if (e.target.closest('[data-act="sub-back"]') || e.target.closest('[data-act="nat-back"]')) return closeSub();
      const a = e.target.closest('a[href^="#"]'); if (!a || !a.dataset.v) return;
      e.preventDefault(); go(a.dataset.v);
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && cur() === 'sub') closeSub(); });
    /* הדפסה: פותחים את המקופל (תובנות, תלמידים, מעסיקים) ומדפיסים את המסך הנוכחי */
    addEventListener('beforeprint', () => document.querySelectorAll('.sec details').forEach(d => { d.dataset.wasOpen = d.open ? '1' : ''; d.open = true; }));
    addEventListener('afterprint', () => document.querySelectorAll('.sec details').forEach(d => { if (d.dataset.wasOpen === '') d.open = false; }));
    /* ריחוף מעל פס בגרף: המספרים המלאים */
    const ntip = document.createElement('div'); ntip.className = 'ntip noprint'; ntip.hidden = true; document.body.appendChild(ntip);
    document.addEventListener('mousemove', e => { const t = e.target.closest && e.target.closest('[data-tip]'); ntip.hidden = !t; if (!t) return; ntip.textContent = t.dataset.tip; ntip.style.left = Math.max(8, Math.min(innerWidth - ntip.offsetWidth - 8, e.clientX - ntip.offsetWidth / 2)) + 'px'; ntip.style.top = Math.max(8, e.clientY - ntip.offsetHeight - 12) + 'px'; });

    /* ---------- השרת ---------- */
    async function api(action, body) {
      const r = await API_.call(action, body);
      if (!r || !r.ok) { if (r && r.error === 'badsession') { logout(); throw new Error('badsession'); } throw new Error((r && r.error) || 'רשת'); }
      return r;
    }
    CTX = { me, api: (a, b) => API_.call(a, b), toast, esc, ic, nav: renderNav };
    OPEN = id => go('mb-' + id); SUB = spec => openSub(spec);

    /* ---------- הנתונים: חודשים מהשרת בלבד, שורה לכל בית ספר ---------- */
    const DATA = {};   /* ym → שורות */
    let MONTHS = [], BASE = null, YEARS = 1;
    function rowOf(r) {
      const b = BY_NAME[r.school] || {}, st = r.stats, rep = r.state === 'partial' || r.state === 'done';
      const x = { name: r.school, label: r.school, semel: r.semel || b.semel || '', net: b.net || '', d: b.d || '', s: b.s || '', sup: b.sup || '', state: r.state || 'none', rep, locked: r.locked, calcAt: r.calcAt || '',
        n: st && st.n != null ? st.n : null, w: null, out: null, inn: null, none: null, noData: null, places: null, att: null, attP: 0, attT: 0, stage: null, subMg: st ? st.subMg : null, allMg: st ? st.allMg : null, conf: st ? st.conf : null, mgs: [] };
      if (!rep || !st) return x;
      x.w = (+st.out || 0) + (+st.in || 0); x.out = +st.out || 0; x.inn = +st.in || 0; x.none = (x.n || 0) - x.w; x.noData = st.noData == null ? null : +st.noData; x.places = st.places == null ? null : +st.places;
      x.att = st.attPct == null ? null : +st.attPct; x.attP = st.att ? +st.att.p || 0 : 0; x.attT = st.att ? +st.att.t || 0 : 0; x.stage = st.stage || null; x.why = st.why || null;
      x.mgs = Object.keys(st.mg || {}).map(k => { const m = st.mg[k], w = (+m.out || 0) + (+m.in || 0), code = m.code ? String(m.code) : ''; return { mg: k, code, key: code || nkey(k), label: code && MG_NAME[code] || k, ps: psOf(x.semel, code, k) || NO_PS, rep: true, n: +m.n || 0, w, out: +m.out || 0, inn: +m.in || 0, none: (+m.n || 0) - w, noData: m.noData == null ? null : +m.noData, places: m.places == null ? null : +m.places, att: m.attPct == null ? null : +m.attPct, attP: m.att ? +m.att.p || 0 : 0, attT: m.att ? +m.att.t || 0 : 0, sub: !!m.sub, sch: x }; });
      return x;
    }
    async function loadMonth(ym) { if (DATA[ym]) return DATA[ym]; const r = await api('natStats', ym ? { ym } : {}); const rows = (r.schools || []).map(rowOf); DATA[r.ym || ym] = rows; return { ym: r.ym || ym, months: r.months || [], rows }; }
    const rows = ym => DATA[ym] || [];
    const F = { mon: '', cmp: '', slice: 'school', q: '', only: '', band: '', byCh: false };
    const mLbl = ym => monName(ym) + (YEARS > 1 ? ' ' + String(ym).slice(0, 4) : '');
    const monTag = () => `<em class="tag ok">${esc(mLbl(F.mon))}</em>`;
    const prevMap = () => { const m = {}; if (F.cmp) rows(F.cmp).forEach(x => { m[x.name] = x; }); return m; };
    const withPrev = L => { const pm = prevMap(); return L.map(x => Object.assign({}, x, { prev: F.cmp && pm[x.name] && pm[x.name].rep ? pm[x.name] : null })); };
    const prevMg = (pm, m) => { const p = F.cmp && pm[m.sch.name]; if (!p || !p.rep) return null; return p.mgs.find(q => q.key === m.key) || null; };
    const SECTORS = [...new Set(SCHOOLS.map(x => x.s).filter(Boolean))], DISTRICTS = [...new Set(SCHOOLS.map(x => x.d).filter(Boolean))];

    /* ---------- סינון, חיתוכים, תובנות ---------- */
    function filt(f) { const q = f.q.trim(); return rows(F.mon).filter(x => (!q || x.name.includes(q) || x.net.includes(q) || x.d.includes(q) || x.s === q) && (!f.only || (f.only === 'none' ? x.rep && x.n && x.none / x.n > .3 : f.only === 'unrep' ? !x.rep : x.d === f.only || x.s === f.only || x.sup === f.only || x.net === f.only))); }
    const chipsHtml = (f, extra) => [['', 'הכול'], ...extra, ...DISTRICTS.map(d => [d, d])].map(([v, l]) => `<button class="chip ${f.only === v ? 'on' : ''}" data-only="${esc(v)}">${esc(l)}</button>`).join('');
    const allMgs = L => L.flatMap(x => x.mgs);
    const KF = { sector: x => x.s || 'אחר', net: x => x.net || 'אחר', sup: x => x.sup || 'ללא מפקח.ת' };
    /* קבוצה: המספרים מהמדווחים, ולצידם כמה דיווחו מתוך כמה */
    function groupRows(L, slice) {
      if (KF[slice]) { const kf = KF[slice]; return Object.entries(L.reduce((o, x) => ((o[kf(x)] = o[kf(x)] || []).push(x), o), {})).map(([k, l]) => { const A = agg(l); return Object.assign({ k, label: k, sc: l.length, rep: A.rep1, items: l }, A); }); }
      const M = allMgs(L), key = slice === 'ps' ? m => m.ps || NO_PS : m => m.key;
      return Object.entries(M.reduce((o, m) => ((o[key(m)] = o[key(m)] || []).push(m), o), {})).map(([k, l]) => { const A = agg(l); return Object.assign({ k, label: slice === 'ps' ? k : l[0].label, sc: new Set(l.map(m => m.sch.name)).size, mgc: l.length, rep: A.rep1, items: l }, A); });
    }
    function insights(L) {
      const R = L.filter(x => x.rep); if (!L.length) return [];
      const out = [], A = agg(L);
      if (A.rep < A.cnt) out.push(`${A.cnt - A.rep} מתוך ${A.cnt} בתי ספר טרם דיווחו ל${mLbl(F.mon)}. המספרים כאן על ${A.rep} שדיווחו.`);
      if (!R.length) return out;
      out.push(`${heb(A.w)} מתוך ${heb(A.nRep)} תלמידים מועסקים (${empPct(A)}%).`);
      const byS = groupRows(R, 'sector').filter(g => g.nRep >= 30).sort((a, b) => empPct(a) - empPct(b));
      if (byS.length > 1) out.push(`בתעסוקה, המגזר ה${esc(byS[0].label)} הכי נמוך (${empPct(byS[0])}%) והמגזר ה${esc(byS[byS.length - 1].label)} הכי גבוה (${empPct(byS[byS.length - 1])}%).`);
      const zero = R.filter(x => x.n && !x.w), red = R.filter(x => empPct(x) < 40);
      if (zero.length) out.push(`ב-${zero.length} בתי ספר שדיווחו אין עוד אף תלמיד.ה מועסק.ת.`);
      if (red.length) out.push(`${red.length} מתוך ${R.length} בתי ספר שדיווחו מתחת ל-40% תעסוקה.`);
      const green = R.filter(x => empPct(x) > 70).sort((a, b) => empPct(b) - empPct(a));
      if (green.length) out.push(`מעל 70% תעסוקה: ${green.slice(0, 4).map(x => `${esc(x.name)} (${empPct(x)}%)`).join(', ')}${green.length > 4 ? ' ועוד' : ''}.`);
      const byM = groupRows(R, 'mg').filter(g => g.nRep >= 40).sort((a, b) => empPct(a) - empPct(b));
      if (byM.length > 1) out.push(`מבין המגמות הגדולות, ${esc(byM[byM.length - 1].label)} הכי גבוהה בתעסוקה (${empPct(byM[byM.length - 1])}%) ו${esc(byM[0].label)} הכי נמוכה (${empPct(byM[0])}%).`);
      if (A.w && A.inn != null) out.push(`${Math.round(A.inn / A.w * 100)}% מהמועסקים בתעסוקת פנים (${A.inn} תלמידים).`);
      if (A.noData) out.push(`ל-${A.noData} תלמידים אין עדיין מידע על תעסוקה (לא מועסקים ובלי סיבה).`);
      if (A.att != null) { const lowAtt = R.filter(x => x.att != null && x.att < 70).length; if (lowAtt) out.push(`ב-${lowAtt} בתי ספר הנוכחות בתעסוקה מתחת ל-70%.`); }
      if (F.cmp) { const P = agg(withPrev(R).map(x => x.prev).filter(Boolean)); if (P.rep1) out.unshift(`מול ${mLbl(F.cmp)}: מ-${heb(P.w)} ל-${heb(A.w)} מועסקים, מ-${empPct(P)}% ל-${empPct(A)}%.`); }
      return out;
    }
    const UNIT = { school: 'בתי ספר', io: 'בתי ספר', net: 'רשתות', sector: 'מגזרים', sup: 'מפקחים פדגוגיים', ps: 'מפקחים', mg: 'מגמות' };
    const PH = { school: 'בית ספר, רשת או מחוז', io: 'בית ספר, רשת או מחוז', net: 'שם הרשת', sector: 'מגזר', sup: 'שם המפקח.ת', ps: 'שם המפקח.ת', mg: 'שם המגמה' };
    const CATS = [['school', 'building', 'בתי ספר'], ['sector', 'layers', 'מגזרים'], ['net', 'building', 'רשתות'], ['mg', 'chart', 'מגמות'], ['sup', 'user', 'מפקחים פדגוגיים'], ['ps', 'user', 'מפקחים מקצועיים'], ['io', 'layers', 'תעסוקת פנים וחוץ']];
    const CAT_NAME = Object.fromEntries(CATS.map(c => [c[0], c[2]]));
    const ioCols = [['תעסוקת חוץ', r => dash(r.out)], ['תעסוקת פנים', r => dash(r.inn)]];
    const tailCols = [['נוכחות', r => r.rep ? pc(r.att) : '—'], ['מקומות תעסוקה', r => dash(r.places)]];
    const cmpCols = () => F.cmp ? [['ב' + mLbl(F.cmp), r => r.prev ? pc(empPct(r.prev)) : '—'], ['שינוי', r => r.prev && r.rep ? dl(empPct(r), empPct(r.prev), ' נק׳') : '—']] : [];
    /* מיון: לפי אחוז מהנמוך, "טרם דיווח" בסוף */
    const byPct = (a, b) => (a.rep === b.rep ? 0 : a.rep ? -1 : 1) || (a.rep ? empPct(a) - empPct(b) : String(a.label).localeCompare(String(b.label), 'he'));
    const schName = x => `<button class="name" data-natsch="${esc(x.name)}">${esc(x.name)}<small>${x.rep ? (x.mgs.length ? x.mgs.length + ' מגמות · ' : '') + STATE_T[x.state] : STATE_T[x.state] || 'טרם דיווח'}</small></button>`;

    /* ---------- בורר החודש וההשוואה ---------- */
    const monBar = () => `<div class="nm"><b>חודש</b>${MONTHS.map(m => `<button class="chip ${m === F.mon ? 'on' : ''}" data-mon="${m}" aria-pressed="${m === F.mon}">${esc(mLbl(m))}</button>`).join('')}</div>`;
    const cmpBar = () => MONTHS.length < 2 ? '' : `<div class="nm"><b>השוואה ל</b><button class="chip ${F.cmp ? '' : 'on'}" data-cmp="" aria-pressed="${!F.cmp}">בלי</button>${MONTHS.filter(m => m !== F.mon).map(m => `<button class="chip ${m === F.cmp ? 'on' : ''}" data-cmp="${m}" aria-pressed="${m === F.cmp}">${esc(mLbl(m))}</button>`).join('')}</div>`;
    function setMon(k) { if (!MONTHS.includes(k)) return; F.mon = k; if (F.cmp === k) F.cmp = ''; renderAll(); }
    function setCmp(k) { F.cmp = MONTHS.includes(k) ? k : ''; if (!F.cmp) F.byCh = false; renderAll(); }
    function renderAll() { if (ROLE === 'pro') renderPikuah(); else { renderNational(); renderNatHome(); } if (cur() === 'sub' && topSub()) paintSub(); }

    /* ---------- המסך הראשי: המספר הארצי, הגרף לפי חודש, הרמזור, נקודת הפתיחה והקטגוריות ---------- */
    function renderNatHome() {
      const L = rows(F.mon), A = agg(L), P = F.cmp ? agg(rows(F.cmp)) : null, R = L.filter(x => x.rep);
      const months = MONTHS.map(m => ({ m, A: agg(rows(m)) })), maxP = Math.max(10, ...months.map(r => empPct(r.A) || 0));
      const band = k => R.filter(x => lvl(empPct(x)) === k).length, unrep = L.length - R.length;
      $('natTag').innerHTML = `· ${monTag()}`;
      $('natMonths').innerHTML = monBar();
      $('natHome').innerHTML = `<div class="nh-card nh-hero"><h3>תעסוקה בחניכות</h3><b class="nh-big">${pc(empPct(A))}</b><p>${A.w == null ? 'אף בית ספר טרם דיווח' : `<b>${heb(A.w)}</b> מועסקים מתוך <b>${heb(A.nRep)}</b> לומדים`}</p><p class="nh-cov">${covTxt(A)}</p>${P && P.rep1 ? `<small class="kd">${dl(empPct(A), empPct(P), ' נק׳')} מול ${esc(mLbl(F.cmp))}</small>` : ''}</div>
      <div class="nh-card"><h3>התעסוקה לפי חודש</h3><div class="nh-cols">${months.map(r => { const p = empPct(r.A); return `<button class="nh-col ${p == null ? 'none' : ''} ${r.m === F.mon ? 'cur' : ''}" data-mon="${r.m}" data-tip="${esc(mLbl(r.m))}: ${p == null ? 'טרם דיווח' : `${heb(r.A.w)} מתוך ${heb(r.A.nRep)} מועסקים · ${covTxt(r.A)}`}"><b>${p == null ? '—' : p + '%'}</b><i style="height:${p == null ? 2 : Math.max(2, Math.round(p / maxP * 110))}px"></i><span>${esc(mLbl(r.m))}<small>${r.A.rep} מתוך ${r.A.cnt} דיווחו</small></span></button>`; }).join('')}</div><div class="nh-cmp noprint">${cmpBar()}</div></div>
      <div class="nh-card nh-tl"><h3>רמזור בתי הספר</h3><div class="tl">${BANDS.map(([k, l]) => `<button class="tl-l ${k}" data-band="${k}"><b>${band(k)}</b><span>${l}</span></button>`).join('')}<button class="tl-l x tl-x" data-band="x"><b>${unrep}</b><span>טרם דיווחו</span></button></div></div>`;
      $('natBase').innerHTML = baseCard();
      $('natCats').innerHTML = CATS.map(([k, i, t]) => {
        let mini, line;
        if (k === 'io') { mini = A.w ? `<span class="ios">${ioSeg(A.out, A.inn)}</span>` : '<span class="hint">—</span>'; line = A.w == null ? 'טרם דיווח' : `חוץ ${heb(A.out)} · פנים ${heb(A.inn)}`; }
        else if (k === 'school') { mini = `<span class="nc-bands">${BANDS.map(([b]) => band(b) ? `<i class="mgc-f ${b}" style="flex:${band(b)} 1 0"></i>` : '').join('')}${unrep ? `<i class="mgc-f x" style="flex:${unrep} 1 0"></i>` : ''}</span>`; line = `${band('g')} ירוק · ${band('o')} כתום · ${band('r')} אדום · ${unrep} טרם דיווחו`; }
        else {
          const G = groupRows(L, k), top3 = G.slice().sort((a, b) => (b.nRep || 0) - (a.nRep || 0)).slice(0, 3), mx = Math.max(10, ...top3.map(g => empPct(g) || 0)), big = G.filter(g => g.rep && g.nRep >= 30), best = (big.length ? big : G.filter(g => g.rep)).sort((a, b) => empPct(b) - empPct(a))[0];
          mini = top3.map(g => `<span class="nc-m"><span class="nc-ml">${esc(g.label)}</span><span class="nc-mt"><i class="mgc-f ${lvl(empPct(g))}" style="width:${(empPct(g) || 0) / mx * 100}%"></i></span><b>${empPct(g) == null ? '—' : empPct(g) + '%'}</b></span>`).join('') || '<span class="hint">—</span>';
          line = best ? `הכי גבוה: ${esc(best.label)}, ${empPct(best)}%` : 'טרם דיווח';
        }
        const count = k === 'school' || k === 'io' ? L.length + ' בתי ספר' : groupRows(L, k).length + ' ' + (k === 'sup' ? 'מפקחים' : UNIT[k]);
        return `<button class="nc-card" data-cat="${k}"><span class="nc-h">${ic(i)}<b>${t}</b><small>${count}</small>${chev}</span><span class="nc-mini">${mini}</span><span class="nc-line">${line}</span></button>`;
      }).join('');
      $('natHomeNo').textContent = L.length ? '' : 'אין בתי ספר בהיקף שלך';
    }
    /* נקודת הפתיחה: דיווח חיצוני, מסומן ונפרד. לא בקו המגמה ולא בהשוואה */
    function baseCard() {
      if (!BASE || !BASE.rows.length) return '';
      const l = BASE.rows.filter(r => r.stats && r.stats.n != null), n = sum(l.map(r => r.stats), 'n'), w = sum(l.map(r => r.stats), 'out') + sum(l.map(r => r.stats), 'in'), p = n ? Math.round(w / n * 100) : null;
      if (!l.length) return `<div class="nh-card nh-base"><h3>נקודת הפתיחה <em class="tag mid">דיווח חיצוני · ${esc(BASE.mon)}</em></h3><p class="hint">נקודת הפתיחה היא לפי בית ספר בלבד, ולא לפי מגמה.</p></div>`;
      return `<div class="nh-card nh-base"><h3>נקודת הפתיחה <em class="tag mid">דיווח חיצוני · ${esc(BASE.mon)}</em></h3><p><b class="nh-big">${pc(p)}</b> <b>${heb(w)}</b> מועסקים מתוך <b>${heb(n)}</b> לומדים · ${l.length} בתי ספר</p><p class="hint">מקור: ${esc(BASE.source)} · ${esc(BASE.date)}. לא חלק מקו המגמה של המערכת ולא נכנס להשוואה.</p></div>`;
    }
    /* ---------- מסך קטגוריה: סיכום, גרף, סינון, חיפוש, טבלה, רמזור ---------- */
    let NAT_ITEMS = [];
    function renderNational() {
      const sl = F.slice, q = F.q.trim();
      const L = withPrev(filt(sl === 'school' || sl === 'io' ? F : Object.assign({}, F, { q: '' }))), A = agg(L), P = F.cmp ? agg(L.map(x => x.prev).filter(Boolean)) : null, pm = prevMap();
      $('natCatTag').innerHTML = `· ${monTag()}`; $('natCatT').textContent = CAT_NAME[sl];
      $('natMonthsC').innerHTML = monBar(); $('natCmpC').innerHTML = cmpBar();
      { const s = $('natByCh'); s.hidden = !F.cmp; s.classList.toggle('on', !!F.byCh); s.setAttribute('aria-pressed', !!F.byCh); }
      $('natCov').innerHTML = covTxt(A) + (A.rep < A.cnt ? ' · האחוזים רק על מי שדיווחו' : '');
      $('natIns').hidden = sl !== 'school';
      { const ins = insights(L); $('natIns').innerHTML = `<summary>${ic('chart')}תובנות<small>${ins.length}</small></summary><ul>${ins.map(t => `<li>${t}</li>`).join('')}</ul>`; }
      $('natChips').innerHTML = chipsHtml(F, [['none', 'הרבה לא מועסקים'], ['unrep', 'טרם דיווחו'], ...(sl === 'sector' ? [] : SECTORS.map(s => [s, s]))]);
      $('natFind').placeholder = PH[sl];
      const el = $('natTable'); let cols, items;
      if (sl === 'school') {
        cols = [['בית ספר', schName], ['מגזר · מחוז', x => `${esc(x.s)} · ${esc(x.d)}`], ['תלמידים', x => dash(x.n)], ['מועסקים', x => dash(x.w)], ['תעסוקה', x => pc(empPct(x))], ...cmpCols(), ...ioCols, ['לא מועסקים', x => dash(x.none)], ...tailCols];
        items = L;
      } else if (sl === 'io') {
        cols = [['בית ספר', x => `<button class="name" data-natsch="${esc(x.name)}">${esc(x.name)}<small>${esc(x.net)}${x.rep ? '' : ' · ' + (STATE_T[x.state] || 'טרם דיווח')}</small></button>`], ['מגזר · מחוז', x => `${esc(x.s)} · ${esc(x.d)}`], ['מועסקים', x => dash(x.w)], ...(F.cmp ? [['מועסקים ב' + mLbl(F.cmp), x => x.prev ? x.prev.w : '—'], ['שינוי', x => x.prev && x.rep ? dl(x.w, x.prev.w) : '—']] : []), ['תעסוקת חוץ', x => dash(x.out)], ['תעסוקת פנים', x => dash(x.inn)], ['חוץ מול פנים', x => x.w ? `<span class="iobar">${ioSeg(x.out, x.inn)}</span>` : '—']];
        items = L;
      } else {
        const head = { sector: 'מגזר', sup: 'מפקח.ת פדגוגי.ת', net: 'רשת', ps: 'מפקח.ת מקצועי.ת', mg: 'מגמה' }[sl], bySch = !!KF[sl];
        cols = [[head, g => `<button class="name" data-grp="${sl}" data-k="${esc(g.k)}">${esc(g.label)}${bySch && g.rep < g.cnt ? `<small>דיווחו ${g.rep} מתוך ${g.cnt}</small>` : ''}</button>`], [bySch ? 'בתי ספר' : 'בתי ספר · מגמות', g => bySch ? g.sc : `${g.sc} · ${g.mgc}`], ['תלמידים', g => dash(g.n)], ['מועסקים', g => dash(g.w)], ['תעסוקה', g => pc(empPct(g))], ...cmpCols(), ...ioCols, ['לא מועסקים', g => dash(g.none)], ...tailCols];
        const pg = F.cmp ? Object.fromEntries(groupRows(withPrev(rows(F.cmp)).filter(x => L.some(y => y.name === x.name)), sl).map(g => [g.k, g])) : {};
        items = groupRows(L, sl).filter(g => !q || g.label.includes(q)).map(g => Object.assign(g, { prev: pg[g.k] && pg[g.k].rep ? pg[g.k] : null }));
      }
      NAT_ITEMS = items;
      $('natKpis').innerHTML = catKpis(sl, items, A, P).map(kpiHtml).join('');
      const chg = x => !x.prev || !x.rep ? -Infinity : sl === 'io' ? x.w - x.prev.w : empPct(x) - empPct(x.prev);
      const bandOf = x => x.rep ? lvl(empPct(x)) : 'x';
      const rowsOut = items.filter(x => !F.band || bandOf(x) === F.band).sort(F.cmp && F.byCh ? (a, b) => chg(b) - chg(a) : sl === 'io' ? (a, b) => (b.rep ? 1 : 0) - (a.rep ? 1 : 0) || (b.w ? b.inn / b.w : -1) - (a.w ? a.inn / a.w : -1) || (b.w || 0) - (a.w || 0) : byPct);
      el.style.setProperty('--c', cols.length - 2); el.innerHTML = table(cols, rowsOut, r => r.rep ? '' : 'unrep');
      $('natChart').innerHTML = (sl === 'mg' ? mgChart(rowsOut) : sl === 'io' ? ioCharts(L) : sl === 'school' ? schDist(items) : rateChart(rowsOut, { title: 'אחוז התעסוקה · ' + CAT_NAME[sl], attr: g => `data-grp="${sl}" data-k="${esc(g.k)}"` })) || `<p class="hint">אף בית ספר לא דיווח ל${esc(mLbl(F.mon))}, ולכן אין גרף.</p>`;
      $('natPrintMeta').textContent = [mLbl(F.mon), F.cmp && 'מול ' + mLbl(F.cmp), CAT_NAME[sl], F.only && ({ none: 'הרבה לא מועסקים', unrep: 'טרם דיווחו' }[F.only] || F.only), q && 'חיפוש: ' + q, F.band && 'רמזור: ' + (F.band === 'x' ? 'טרם דיווח' : BANDS.find(b => b[0] === F.band)[1]), rowsOut.length + ' ' + UNIT[sl], covTxt(A)].filter(Boolean).join(' · ');
      renderLights(items, sl);
    }
    function catKpis(sl, items, A, P) {
      const R = items.filter(x => x.rep);
      if (sl === 'io') { const part = A.w ? Math.round(A.inn / A.w * 100) : null; return [[dash(A.w), 'מועסקים', P && dl(A.w, P.w)], [dash(A.out), 'תעסוקת חוץ', P && dl(A.out, P.out)], [dash(A.inn), 'תעסוקת פנים', P && dl(A.inn, P.inn)], [part == null ? '—' : part + '%', 'מהמועסקים בתעסוקת פנים'], [R.filter(x => x.inn).length, 'בתי ספר עם תעסוקת פנים'], [R.filter(x => x.out && !x.inn).length, 'בתי ספר רק עם תעסוקת חוץ']]; }
      const big = R.filter(x => x.nRep != null ? x.nRep >= 30 : x.n >= 30), pool = (big.length ? big : R).slice().sort((a, b) => empPct(b) - empPct(a)), zero = R.filter(x => x.n && !x.w).length;
      const out = [[items.length, UNIT[sl]], [pc(empPct(A)), 'תעסוקה', P && P.rep1 && dl(empPct(A), empPct(P), ' נק׳')], [dash(A.w), 'מועסקים מתוך ' + heb(A.nRep), P && P.rep1 && dl(A.w, P.w)]];
      if (pool.length > 1) out.push([esc(pool[0].label), 'הכי גבוה · ' + empPct(pool[0]) + '%', '', 'kt']);
      if (zero) out.push([zero, 'בלי אף מועסק.ת', '', '', true]); else if (pool.length > 1) out.push([esc(pool[pool.length - 1].label), 'הכי נמוך · ' + empPct(pool[pool.length - 1]) + '%', '', 'kt']);
      if (P) { const up = R.filter(x => x.prev).sort((a, b) => (empPct(b) - empPct(b.prev)) - (empPct(a) - empPct(a.prev)))[0]; if (up && empPct(up) > empPct(up.prev)) out.push([esc(up.label), `הכי עלה · ${empPct(up) - empPct(up.prev)} נק׳`, '', 'kt']); }
      if (items.length - R.length) out.push([items.length - R.length, 'טרם דיווחו', '', 'x']);
      return out;
    }
    /* ---------- הגרפים ---------- */
    function mgChart(rowsIn) {
      const L = rowsIn.filter(g => g.rep).sort((a, b) => b.nRep - a.nRep); if (!L.length) return '';
      const max = L[0].nRep;
      return `<div class="mgc" role="img" aria-label="לומדים ומועסקים לפי מגמה"><div class="mgc-leg"><span><i class="mgc-w"></i>לומדים</span><span><i class="pc-dot g"></i><i class="pc-dot o"></i><i class="pc-dot r"></i>מועסקים, בצבע הרמזור</span>${F.cmp ? `<span><i class="mgc-ck"></i>${esc(mLbl(F.cmp))}</span>` : ''}</div>${L.map(g => `<button class="mgc-r" data-grp="mg" data-k="${esc(g.k)}" data-tip="${esc(g.label)}: ${g.w} מתוך ${g.nRep} מועסקים (${empPct(g)}%)${g.prev ? ` · ב${esc(mLbl(F.cmp))} ${empPct(g.prev)}%` : ''} · ${g.sc} בתי ספר"><span class="mgc-l">${esc(g.label)}</span><span class="mgc-t"><i class="mgc-b" style="width:${Math.max(2, g.nRep / max * 100)}%"><i class="mgc-f ${lvl(empPct(g))}" style="width:${g.w ? Math.max(3, empPct(g)) : 0}%"></i>${g.prev ? `<i class="mgc-c" style="inset-inline-start:${empPct(g.prev)}%"></i>` : ''}</i></span><span class="mgc-v">${g.w} מתוך ${g.nRep} · <b>${empPct(g)}%</b></span></button>`).join('')}</div>`;
    }
    function rateChart(rowsIn, o) {
      const L = rowsIn.filter(g => g.rep).sort((a, b) => empPct(b) - empPct(a) || (b.nRep || b.n) - (a.nRep || a.n)); if (!L.length) return '';
      const max = Math.max(10, Math.ceil(Math.max(...L.flatMap(g => [empPct(g), g.prev ? empPct(g.prev) : 0])) / 10) * 10), c = F.cmp && mLbl(F.cmp);
      return `<div class="mgc nc" role="img" aria-label="${esc(o.title)}"><h3 class="mgc-h">${esc(o.title)}</h3><div class="mgc-leg"><span><i class="pc-dot g"></i><i class="pc-dot o"></i><i class="pc-dot r"></i>${esc(mLbl(F.mon))}, בצבע הרמזור</span>${c ? `<span><i class="nb-p nb-key"></i>${esc(c)}</span>` : ''}</div>${L.map(g => { const n = g.nRep != null ? g.nRep : g.n; return `<button class="mgc-r" ${o.attr(g)} data-tip="${esc(g.label)}: ${g.w} מתוך ${n} מועסקים (${empPct(g)}%)${g.prev ? ` · ב${esc(c)} ${g.prev.w} מתוך ${g.prev.nRep != null ? g.prev.nRep : g.prev.n} (${empPct(g.prev)}%)` : ''}"><span class="mgc-l">${esc(g.label)}${g.sc ? ` <small>${g.sc === 1 ? 'בית ספר אחד' : g.sc + ' בתי ספר'}</small>` : ''}</span><span class="nc-t"><i class="nb mgc-f ${lvl(empPct(g))}" style="width:${empPct(g) / max * 100}%"></i>${g.prev ? `<i class="nb-p" style="width:${empPct(g.prev) / max * 100}%"></i>` : ''}</span><span class="mgc-v"><b>${empPct(g)}%</b>${g.prev ? ` · ב${esc(c)} ${empPct(g.prev)}%` : ''} · ${g.w} מתוך ${n}</span></button>`; }).join('')}</div>`;
    }
    function schDist(items) {
      const B = [['בלי מועסקים', 'r', p => p === 0], ['1%–19%', 'r', p => p > 0 && p < 20], ['20%–39%', 'r', p => p >= 20 && p < 40], ['40%–70%', 'o', p => p >= 40 && p <= 70], ['מעל 70%', 'g', p => p > 70], ['טרם דיווחו', 'x', p => p == null]], c = F.cmp && mLbl(F.cmp);
      const cnt = (l, f) => l.filter(x => f(x.rep && x.n ? empPct(x) : x.rep ? null : null)).length, pl = c ? items.map(x => x.prev).filter(Boolean) : [], max = Math.max(1, ...B.flatMap(b => [cnt(items, b[2]), cnt(pl, b[2])]));
      return `<div class="mgc nc" role="img" aria-label="כמה בתי ספר בכל טווח תעסוקה"><h3 class="mgc-h">כמה בתי ספר בכל טווח תעסוקה</h3>${c ? `<div class="mgc-leg"><span><i class="nb-p nb-key"></i>${esc(c)}</span></div>` : ''}${B.map(([l, k, f]) => { const v = cnt(items, f), p = c ? cnt(pl, f) : null, go = (l === 'בלי מועסקים' && v) ? 'data-zero="1"' : (l === 'טרם דיווחו' && v) ? 'data-band="x"' : '', T = go ? 'button' : 'div'; return `<${T} class="mgc-r ${go ? '' : 'still'}" ${go} data-tip="${l}: ${v} בתי ספר${c ? ` · ב${esc(c)} ${p}` : ''}"><span class="mgc-l">${l}</span><span class="nc-t"><i class="nb mgc-f ${k}" style="width:${v / max * 100}%"></i>${c ? `<i class="nb-p" style="width:${p / max * 100}%"></i>` : ''}</span><span class="mgc-v"><b>${v}</b> בתי ספר${c ? ` · ב${esc(c)} ${p}` : ''}</span></${T}>`; }).join('')}</div>`;
    }
    const ioVal = r => `חוץ <b>${dash(r.out)}</b> · פנים <b>${dash(r.inn)}</b> · סה״כ <b>${dash(r.w)}</b>`;
    const ioTip = (l, r) => r.w == null ? `${l}: טרם דיווח` : `${l}: ${r.w} מועסקים · ${r.out} בתעסוקת חוץ, ${r.inn} בתעסוקת פנים${r.w ? ` (${Math.round(r.inn / r.w * 100)}% בפנים)` : ''}`;
    function ioCharts(L) {
      const leg = `<div class="mgc-leg"><span><i class="io-key io-o"></i>תעסוקת חוץ · אצל מעסיק מחוץ לבית הספר</span><span><i class="io-key io-i"></i>תעסוקת פנים · עסק בית-ספרי</span></div>`, c = F.cmp && mLbl(F.cmp);
      const months = MONTHS.map(m => Object.assign({ m }, agg(rows(m).filter(x => L.some(y => y.name === x.name))))), maxM = Math.max(1, ...months.map(r => r.w || 0));
      const nets = groupRows(L, 'net').sort((a, b) => (b.w || 0) - (a.w || 0) || (b.n || 0) - (a.n || 0)), pn = c ? Object.fromEntries(groupRows(rows(F.cmp).filter(x => L.some(y => y.name === x.name)), 'net').map(g => [g.k, g])) : {}, maxN = Math.max(1, ...nets.flatMap(g => [g.w || 0, pn[g.k] ? pn[g.k].w || 0 : 0]));
      const bar = (r, max) => `<span class="ios" style="width:${r.w ? Math.max(1.5, r.w / max * 100) : 0}%">${ioSeg(r.out, r.inn)}</span>`;
      return `<div class="mgc nc" role="img" aria-label="תעסוקת חוץ ותעסוקת פנים לפי חודש"><h3 class="mgc-h">תעסוקת חוץ ותעסוקת פנים לפי חודש</h3>${leg}${months.map(r => `<button class="mgc-r ${r.m === F.mon ? 'cur' : ''}" data-mon="${r.m}" data-tip="${esc(ioTip(mLbl(r.m), r))}"><span class="mgc-l">${esc(mLbl(r.m))} <small>${r.rep} מתוך ${r.cnt} דיווחו</small></span><span class="nc-t">${bar(r, maxM)}</span><span class="mgc-v">${ioVal(r)}</span></button>`).join('')}</div>
      <div class="mgc nc" role="img" aria-label="תעסוקת חוץ ותעסוקת פנים לפי רשת"><h3 class="mgc-h">לפי רשת · ${esc(mLbl(F.mon))}</h3>${c ? `<div class="mgc-leg"><span><i class="nb-p nb-key"></i>סך המועסקים ב${esc(c)}</span></div>` : ''}${nets.map(g => { const p = pn[g.k]; return `<button class="mgc-r" data-grp="net" data-k="${esc(g.k)}" data-tip="${esc(ioTip(g.label, g))}${p && p.w != null ? ` · ב${esc(c)} ${p.w} מועסקים` : ''}"><span class="mgc-l">${esc(g.label)} <small>${g.sc === 1 ? 'בית ספר אחד' : g.sc + ' בתי ספר'}${g.rep < g.cnt ? ` · דיווחו ${g.rep}` : ''}</small></span><span class="nc-t">${bar(g, maxN)}${p && p.w != null ? `<i class="nb-p" style="width:${p.w / maxN * 100}%"></i>` : ''}</span><span class="mgc-v">${ioVal(g)}</span></button>`; }).join('')}</div>
      <h3 class="sub-h">לפי בית ספר</h3>`;
    }
    /* הרמזור: כמה שורות בכל צבע. "טרם דיווח" אפור, לא צבע. לחיצה פותחת את הרשימה ומסננת את הטבלה */
    function renderLights(items, sl) {
      const bandOf = x => x.rep ? lvl(empPct(x)) : 'x', by = k => items.filter(x => bandOf(x) === k).sort((a, b) => (empPct(b) || 0) - (empPct(a) || 0)), on = F.band;
      const att = x => KF[sl] || sl === 'mg' || sl === 'ps' ? `data-grp="${sl}" data-k="${esc(x.k)}"` : `data-natsch="${esc(x.name)}"`;
      const ALL = BANDS.concat([['x', 'טרם דיווחו']]);
      $('natLights').innerHTML = `<h3>רמזור התעסוקה <small>${items.length} ${UNIT[sl]}</small></h3><div class="tl">${ALL.map(([k, l]) => `<button class="tl-l ${k} ${k === 'x' ? 'tl-x' : ''} ${on === k ? 'on' : ''} ${on && on !== k ? 'dim' : ''}" data-band="${k}" aria-pressed="${on === k}"><b>${by(k).length}</b><span>${l}</span></button>`).join('')}</div>` +
        (on ? `<div class="tl-list"><div class="tl-h"><b>${UNIT[sl]} · ${ALL.find(b => b[0] === on)[1]}</b><button class="lnk" data-band="">ניקוי</button></div><ul>${by(on).map(x => `<li><button class="tl-s" ${att(x)}><span>${esc(x.label)}</span>${pc(empPct(x))}</button></li>`).join('') || '<li class="hint">אין</li>'}</ul>${on === 'x' && by(on).length ? `<button class="lnk" data-act="copy-unrep">${ic('file')}העתקת הרשימה</button>` : ''}</div>` : `<p class="hint tl-tip">לחיצה על צבע מציגה את הרשימה</p>`);
    }
    function openCat(sl, band) { F.slice = sl; F.q = ''; F.only = ''; F.band = band || ''; $('natFind').value = ''; renderNational(); go('natcat'); }
    function openGroup(sl, k) {
      if (sl === 'ps') return k === NO_PS ? toast('מגמות שלא נמצאו בטבלת הפיקוח המקצועי') : openSub(natPsSpec(k));
      if (sl === 'mg') return openSub(natMgSpec(k));
      openSub(natGroupSpec(sl, k));
    }
    const copyList = (l, what) => (navigator.clipboard ? navigator.clipboard.writeText(l.join('\n')) : Promise.reject()).then(() => toast(what || 'הרשימה הועתקה'), () => toast('ההעתקה לא הצליחה'));
    $('natChart').onclick = e => { if (e.target.closest('[data-zero]')) return openSub(natZeroSpec(F.slice)); const m = e.target.closest('[data-mon]'); if (m) return setMon(m.dataset.mon); const b = e.target.closest('[data-band]'); if (b) { F.band = b.dataset.band; return renderNational(); } const g = e.target.closest('[data-grp]'); if (g) openGroup(g.dataset.grp, g.dataset.k); };
    $('natHome').onclick = $('natCats').onclick = e => {
      const d = e.target.closest('[data-cmp]'); if (d) return setCmp(d.dataset.cmp);
      const m = e.target.closest('[data-mon]'); if (m) return setMon(m.dataset.mon);
      const b = e.target.closest('[data-band]'); if (b) return openCat('school', b.dataset.band);
      const c = e.target.closest('[data-cat]'); if (c) openCat(c.dataset.cat);
    };
    $('natKpis').onclick = e => { if (e.target.closest('[data-zero]')) openSub(natZeroSpec(F.slice)); };
    $('natByCh').onclick = () => { F.byCh = !F.byCh; renderNational(); };
    $('natMonths').onclick = $('natMonthsC').onclick = e => { const b = e.target.closest('[data-mon]'); if (b) setMon(b.dataset.mon); };
    $('natCmpC').onclick = e => { const b = e.target.closest('[data-cmp]'); if (b) setCmp(b.dataset.cmp); };
    $('natFind').oninput = e => { F.q = e.target.value; renderNational(); };
    $('natChips').onclick = e => { const b = e.target.closest('[data-only]'); if (b) { F.only = b.dataset.only; renderNational(); } };
    $('natLights').onclick = e => {
      if (e.target.closest('[data-act="copy-unrep"]')) return copyList(NAT_ITEMS.filter(x => !x.rep).map(x => x.label));
      const s = e.target.closest('[data-natsch]'); if (s) return openSub(natSchoolSpec(s.dataset.natsch));
      const g = e.target.closest('[data-grp]'); if (g) return openGroup(g.dataset.grp, g.dataset.k);
      const b = e.target.closest('[data-band]'); if (!b) return;
      F.band = b.dataset.band && F.band !== b.dataset.band ? b.dataset.band : ''; renderNational();
    };
    $('natTable').onclick = e => { const s = e.target.closest('[data-natsch]'); if (s) return openSub(natSchoolSpec(s.dataset.natsch)); const g = e.target.closest('[data-grp]'); if (g) openGroup(g.dataset.grp, g.dataset.k); };

    /* ---------- מסכי משנה: "בלי אף מועסק.ת", קבוצה, מגמה, מפקח.ת מקצועי.ת ---------- */
    function natZeroSpec(sl) {
      const bySch = sl === 'school' || sl === 'io', rowsZ = NAT_ITEMS.filter(x => x.rep && x.n && !x.w).sort((a, b) => b.n - a.n);
      const cols = bySch ? [['בית ספר', x => `<button class="name" data-natsch="${esc(x.name)}">${esc(x.name)}</button>`], ['רשת', x => esc(x.net)], ['מגזר · מחוז', x => `${esc(x.s)} · ${esc(x.d)}`], ['מפקח.ת פדגוגי.ת', x => esc(x.sup)], ['תלמידים', x => x.n]] : [[CAT_NAME[sl], g => `<button class="name" data-grp="${sl}" data-k="${esc(g.k)}">${esc(g.label)}</button>`], ['בתי ספר', g => g.sc], ['תלמידים', g => dash(g.nRep)]];
      return { title: `${UNIT[sl]} בלי אף מועסק.ת`, html: () => `<div class="nat-sch-head"><p class="nat-sch-mon">${rowsZ.length} · ${monTag()} · מתוך מי שדיווחו</p><div class="emp-b noprint"><button class="btn" data-act="copy-zero">${ic('file')}העתקת הרשימה</button><button class="btn" data-act="print">${ic('print')}הדפסה</button></div></div>${tbl(cols, rowsZ)}`,
        bind: el => { el.onclick = e => { if (e.target.closest('[data-act="copy-zero"]')) return copyList(rowsZ.map(x => x.label)); const s = e.target.closest('[data-natsch]'); if (s) return openSub(natSchoolSpec(s.dataset.natsch)); const g = e.target.closest('[data-grp]'); if (g) openGroup(g.dataset.grp, g.dataset.k); }; } };
    }
    function grpKpis(l, sc) {
      const A = agg(l), pl = l.map(x => x.prev).filter(Boolean), P = pl.length && F.cmp ? agg(pl) : null, d = (a, b) => P && P.rep1 ? dl(a, b) : '';
      return [[sc, 'בתי ספר'], [dash(A.nRep), 'תלמידים בחניכות', d(A.nRep, P && P.nRep)], [dash(A.w), 'מועסקים', d(A.w, P && P.w)], [pc(empPct(A)), 'תעסוקה', P && P.rep1 ? dl(empPct(A), empPct(P), ' נק׳') : ''], ...(A.out != null ? [[A.out, 'תעסוקת חוץ', d(A.out, P && P.out)], [A.inn, 'תעסוקת פנים', d(A.inn, P && P.inn)]] : []), [dash(A.none), 'לא מועסקים', d(A.none, P && P.none)], ...(A.cnt > A.rep ? [[A.cnt - A.rep, 'טרם דיווחו', '', 'x']] : [])];
    }
    const schCols = () => [['בית ספר', schName], ['מגזר · מחוז', x => `${esc(x.s)} · ${esc(x.d)}`], ['תלמידים', x => dash(x.n)], ['מועסקים', x => dash(x.w)], ['תעסוקה', x => pc(empPct(x))], ...cmpCols(), ...ioCols, ['לא מועסקים', x => dash(x.none)]];
    function natGroupSpec(sl, k) {
      const kf = KF[sl], L = withPrev(rows(F.mon).filter(x => kf(x) === k)).map(x => Object.assign(x, { k: x.name, sc: 0 })).sort(byPct), A = agg(L);
      return { title: ({ sector: 'מגזר ', net: 'רשת ' }[sl] || '') + esc(k), html: () => `<div class="nat-sch-head"><p class="nat-sch-mon">${monTag()} · ${covTxt(A)}</p><div class="emp-b noprint"><button class="btn" data-act="print">${ic('print')}הדפסה</button></div></div><div class="kpis nat-k">${grpKpis(L, L.length).map(kpiHtml).join('')}</div>${L.filter(x => x.rep).length > 1 ? rateChart(L, { title: 'אחוז התעסוקה לפי בית ספר', attr: g => `data-natsch="${esc(g.name)}"` }) : ''}${tbl(schCols(), L, r => r.rep ? '' : 'unrep')}`,
        bind: el => { el.onclick = e => { const b = e.target.closest('[data-natsch]'); if (b) openSub(natSchoolSpec(b.dataset.natsch)); }; } };
    }
    const mgRowsCols = () => [['בית ספר', m => `<button class="name" data-natsch="${esc(m.sch.name)}">${esc(m.sch.name)}</button>`], ['מגמה', m => esc(m.mg)], ['מפקח.ת מקצועי.ת', m => esc(m.ps || '—')], ['תלמידים', m => m.n], ['מועסקים', m => m.w], ['תעסוקה', m => pc(empPct(m))], ...cmpCols(), ...ioCols, ['לא מועסקים', m => m.none], ...tailCols];
    function mgItems(pred) { const pm = prevMap(); return allMgs(filt(Object.assign({}, F, { q: '' }))).filter(pred).map(m => Object.assign({}, m, { prev: prevMg(pm, m), label: m.sch.name, k: m.sch.name, sc: 0 })).sort((a, b) => empPct(a) - empPct(b)); }
    function natMgSpec(key) {
      const M = mgItems(m => m.key === key), L = rows(F.mon), unrep = L.filter(x => !x.rep && (MEG[x.semel] || []).some(r => (r[1] ? String(r[1]) : nkey(r[0])) === key));
      return { title: 'מגמת ' + esc(M[0] ? M[0].label : MG_NAME[key] || key), html: () => `<div class="nat-sch-head"><p class="nat-sch-mon">${monTag()}${unrep.length ? ` · ${unrep.length} בתי ספר עם המגמה טרם דיווחו` : ''}</p><div class="emp-b noprint"><button class="btn" data-act="print">${ic('print')}הדפסה</button></div></div><div class="kpis nat-k">${grpKpis(M, new Set(M.map(m => m.sch.name)).size).map(kpiHtml).join('')}</div>${M.length > 1 ? rateChart(M, { title: 'אחוז התעסוקה לפי בית ספר', attr: g => `data-natsch="${esc(g.k)}"` }) : ''}${tbl(mgRowsCols(), M)}${unrep.length ? `<p class="hint">טרם דיווחו: ${unrep.map(x => esc(x.name)).join(' · ')}</p>` : ''}`,
        bind: el => { el.onclick = e => { const b = e.target.closest('[data-natsch]'); if (b) openSub(natSchoolSpec(b.dataset.natsch)); }; } };
    }
    function natPsSpec(ps) {
      const M = mgItems(m => (m.ps || NO_PS) === ps);
      return { title: 'המגמות של ' + esc(ps), html: () => `<div class="nat-sch-head"><p class="nat-sch-mon">${monTag()}</p><div class="emp-b noprint"><button class="btn" data-act="print">${ic('print')}הדפסה</button></div></div><div class="kpis nat-k">${grpKpis(M, new Set(M.map(m => m.sch.name)).size).concat([[M.length, 'מגמות']]).map(kpiHtml).join('')}</div>${M.length > 1 ? rateChart(M.map(m => Object.assign({}, m, { label: m.sch.name + ' · ' + m.mg })), { title: 'אחוז התעסוקה לפי בית ספר ומגמה', attr: g => `data-natsch="${esc(g.k)}"` }) : ''}${tbl(mgRowsCols(), M)}`,
        bind: el => { el.onclick = e => { const b = e.target.closest('[data-natsch]'); if (b) openSub(natSchoolSpec(b.dataset.natsch)); }; } };
    }

    /* ---------- בית ספר במבט: מגמות, "תלמיד.ה N" (schoolAnon) ומעסיקים (schoolEmps). בלי שמות תלמידים ---------- */
    const STAGES = ['טרם משובץ.ת', 'שיבוץ', 'שימור', 'חניכות משמעותית', 'אופק תעסוקתי'];
    const placeOf = emp => !emp ? '' : String(emp)[0] === 'I' ? 'in' : 'out';
    function natSchoolSpec(name) {
      const S = {};   /* נטען אחרי הפתיחה */
      const spec = { title: esc(name), load: async () => {
        const ym = F.mon, a = await api('schoolAnon', { school: name, ym }); S.stu = a.stu || []; S.ym = ym;
        if (SEE_EMPS) { try { const e = await api('schoolEmps', { school: name }); S.emps = e.emps || []; } catch (e) { S.emps = null; S.empErr = e.message; } }
      }, html: () => {
        const x = rows(F.mon).find(r => r.name === name); if (!x) return '<p class="hint">בית הספר לא בהיקף שלך</p>';
        if (x.state === 'none') S.stu = S.stu || [];
        const pm = prevMap(), P = F.cmp && pm[name] && pm[name].rep ? pm[name] : null, M = x.mgs.map(m => Object.assign({}, m, { prev: P ? P.mgs.find(q => q.key === m.key) || null : null })).sort((a, b) => empPct(a) - empPct(b));
        const cols = [['מגמה', m => `<b>${esc(m.mg)}</b>`], ['מפקח.ת מקצועי.ת', m => esc(m.ps === NO_PS ? '—' : m.ps)], ['תלמידים', m => m.n], ['מועסקים', m => m.w], ['תעסוקה', m => pc(empPct(m))], ...cmpCols(), ...ioCols, ['לא מועסקים', m => m.none], ...tailCols, ['הגשה', m => m.sub ? '<em class="tag ok">הוגש</em>' : '<em class="tag no">טרם</em>']];
        const base = BASE && BASE.rows.find(r => r.school === name), bs = base && base.stats && base.stats.n != null ? base.stats : null, bw = bs ? (+bs.out || 0) + (+bs.in || 0) : null;
        const kp = x.rep ? [[heb(x.n), 'תלמידים בחניכות', P && dl(x.n, P.n)], [heb(x.w), 'מועסקים', P && dl(x.w, P.w)], [pc(empPct(x)), 'תעסוקה', P && dl(empPct(x), empPct(P), ' נק׳')], [heb(x.out), 'תעסוקת חוץ', P && dl(x.out, P.out)], [heb(x.inn), 'תעסוקת פנים', P && dl(x.inn, P.inn)], [heb(x.none), 'לא מועסקים', P && dl(x.none, P.none)], [dash(x.noData), 'בלי מידע על תעסוקה'], [pc(x.att), 'נוכחות בתעסוקה'], [dash(x.places), 'מקומות תעסוקה']] : [[heb(x.n), 'תלמידים בחניכות'], ['—', 'מועסקים'], [pc(null), 'תעסוקה']];
        return `<div class="nat-sch-head"><p class="hint">${esc(x.s)} · ${esc(x.net)} · ${esc(x.d)} · מפקח.ת פדגוגי.ת: ${esc(x.sup || '—')}</p><div class="emp-b noprint"><button class="btn" data-act="print">${ic('print')}הדפסה</button></div></div>
        <p class="nat-sch-mon">${monTag()} ${stateTag(x)}${P ? ` <span class="hint">מול ${esc(mLbl(F.cmp))}</span>` : ''}${x.calcAt ? ` <span class="hint">חושב ${esc(x.calcAt)}</span>` : ''}</p>
        <h2 class="print-only">${esc(name)} · תעסוקה בחניכות · ${esc(mLbl(F.mon))}</h2>
        ${x.rep ? '' : `<p class="hint">${x.state === 'pending' ? 'בית הספר עוד לא הופעל: הרשימה מחכה מוצפנת.' : x.state === 'none' ? 'לבית הספר אין עדיין מרחב במערכת.' : 'בית הספר טרם דיווח החודש (אין סימון נוכחות, הגשה או אישור). נתוני התעסוקה לא מוצגים.'}</p>`}
        <div class="kpis">${kp.map(([v, l, d]) => `<div class="kpi"><b>${v}</b><span>${l}</span>${d ? `<small class="kd">${d}</small>` : ''}</div>`).join('')}</div>
        ${bs ? `<p class="hint"><em class="tag mid">דיווח חיצוני · ${esc(BASE.mon)}</em> ${heb(bw)} מתוך ${heb(bs.n)} מועסקים (${bs.n ? Math.round(bw / bs.n * 100) : '—'}%) · נקודת הפתיחה, לא חלק מקו המגמה</p>` : ''}
        ${x.rep ? `<h3 class="sub-h">לפי מגמה</h3>${tbl(cols, M)}` : ''}
        ${stuSection(x)}${empSection(x)}`;
      }, bind: el => { el.onclick = e => { const b = e.target.closest('[data-pk]'); if (b && ROLE !== 'pro') openSub(natPsSpec(b.dataset.pk)); }; } };
      function stuSection(x) {
        if (spec.err) return `<p class="warn">התלמידים לא נטענו (${esc(spec.err)})</p>`;
        if (!S.stu) return '<p class="mb-load">טוען את התלמידים…</p>';
        const L = S.stu, live = L.filter(s => s.status !== 'עזב'), attOf = s => { let p = 0, t = 0; Object.values(s.a || {}).forEach(v => { if (!v || v === 'n' || v === 'x') return; t++; if (v === 'p' || v === 's') p++; }); return t ? `${p} מתוך ${t}` : '—'; };
        const cols = [['תלמיד.ה', s => `<b>תלמיד.ה ${s.n}</b>${s.status && s.status !== 'לומד' ? ` <em class="tag ${s.status === 'עזב' ? 'x' : 'susp'}">${esc(s.status)}</em>` : ''}`], ['מגמה', s => esc(s.mg || '—')], ['קבוצה', s => esc(s.cls || '—')],
          ...(x.rep ? [['תעסוקה', s => placeOf(s.emp) === 'in' ? 'תעסוקת פנים' : placeOf(s.emp) === 'out' ? 'תעסוקת חוץ' : s.why ? `<span class="hint">לא מועסק.ת · ${esc(s.why)}</span>` : '<span class="hint">אין מידע</span>'], ['שלב', s => esc(STAGES[+s.stage] || '—')], ['נוכחות ' + mLbl(S.ym), s => attOf(s)]] : [])];
        return `<details class="grp stu-l"><summary>תלמידים <small>${live.length}${L.length - live.length ? ` · ${L.length - live.length} עזבו` : ''} · בלי שמות</small></summary>${tbl(cols, L)}</details>`;
      }
      function empSection(x) {
        if (!SEE_EMPS || x.state === 'none' || x.state === 'pending') return '';
        if (S.emps === null) return `<p class="warn">המעסיקים לא נטענו (${esc(S.empErr || '')})</p>`;
        if (!S.emps) return '';
        const E = S.emps, cnt = id => (S.stu || []).filter(s => s.status !== 'עזב' && s.emp === id).length;
        const mgsOf = e => Array.isArray(e.mg) ? e.mg : e.mg ? [e.mg] : [], names = [...new Set(E.flatMap(mgsOf).concat(x.mgs.map(m => m.mg)))];
        const contact = e => [e.mentor && `מנטור.ית: <b>${esc(e.mentor)}</b>`, e.manager && `מנהל.ת: <b>${esc(e.manager)}</b>`, e.phone && `<span dir="ltr">${esc(e.phone)}</span>`, e.mail && `<span dir="ltr">${esc(e.mail)}</span>`].filter(Boolean).join('<br>') || '—';
        const cols = [['מעסיק', r => `<b>${esc(r.name || r.id)}</b>${r.addr ? `<small class="hint">${esc(r.addr)}</small>` : ''}`], ['סוג', r => placeOf(r.id) === 'in' || r.kind === 'עסק בית-ספרי' ? '<em class="tag">תעסוקת פנים</em>' : 'תעסוקת חוץ'], ['פרטי קשר', r => `<span class="emp-contact">${contact(r)}</span>`], ['תלמידים', r => cnt(r.id)], ['המסננת', r => r.mas ? `<em class="tag ${/מאושר/.test(r.mas) ? 'ok' : 'no'}">${esc(r.mas)}</em>` : '<span class="hint">לא נבדק</span>']];
        const noMg = E.filter(e => !mgsOf(e).length);
        return `<h3 class="sub-h">מעסיקים לפי מגמה <small class="hint">${E.length} מעסיקים · כולל פרטי קשר</small></h3>` + (E.length ? names.map(mg => { const l = E.filter(e => mgsOf(e).includes(mg)).sort((a, b) => cnt(b.id) - cnt(a.id)); if (!l.length) return ''; return `<details class="grp"><summary>${esc(mg)}<small>${l.length} מעסיקים · ${l.reduce((a, r) => a + cnt(r.id), 0)} תלמידים</small></summary>${tbl(cols, l)}</details>`; }).join('') + (noMg.length ? `<details class="grp"><summary>ללא מגמה<small>${noMg.length} מעסיקים</small></summary>${tbl(cols, noMg)}</details>` : '') : '<p class="hint">הרכז.ת עוד לא הזין.ה מעסיקים.</p>');
      }
      return spec;
    }

    /* ---------- מבט המפקח.ת המקצועי.ת: המגמות שלו.ה בכל בתי הספר, על ההיקף שהשרת מחזיר. בלי בחירה חופשית של מפקח.ת ---------- */
    function renderPikuah() {
      const L = rows(F.mon), M = mgItems(() => true), A = agg(M), AS = agg(L), unrep = L.filter(x => !x.rep);
      $('pkTag').innerHTML = `· ${monTag()}`; $('pkMonths').innerHTML = monBar(); $('pkCmpC').innerHTML = cmpBar();
      $('pkCov').innerHTML = covTxt(AS) + (AS.rep < AS.cnt ? ' · האחוזים רק על מי שדיווחו' : '');
      const pl = M.map(m => m.prev).filter(Boolean), P = pl.length && F.cmp ? agg(pl) : null, d = (a, b) => P && P.rep1 ? dl(a, b) : '';
      $('pkKpis').innerHTML = [[AS.rep + (AS.cnt > AS.rep ? ` מתוך ${AS.cnt}` : ''), 'בתי ספר דיווחו'], [M.length, 'מגמות'], [dash(A.nRep), 'תלמידים בחניכות', d(A.nRep, P && P.nRep)], [dash(A.w), 'מועסקים', d(A.w, P && P.w)], [pc(empPct(A)), 'תעסוקה', P && P.rep1 ? dl(empPct(A), empPct(P), ' נק׳') : ''], [dash(A.places), 'מקומות תעסוקה'], [A.out == null ? '—' : `${A.out} · ${A.inn}`, 'תעסוקת חוץ · פנים'], [pc(A.att), 'נוכחות בתעסוקה']].map(kpiHtml).join('');
      $('pkBase').innerHTML = baseCard();
      $('pkChart').innerHTML = M.filter(m => m.rep).length > 1 ? rateChart(M.map(m => Object.assign({}, m, { label: m.sch.name + ' · ' + m.mg })), { title: 'אחוז התעסוקה לפי בית ספר ומגמה', attr: g => `data-natsch="${esc(g.k)}"` }) : '';
      const cols = [['בית ספר', m => `<button class="name" data-natsch="${esc(m.sch.name)}">${esc(m.sch.name)}</button>`], ['מגמה', m => esc(m.mg)], ['תלמידים', m => m.n], ['מועסקים', m => m.w], ['תעסוקה', m => pc(empPct(m))], ...cmpCols(), ...ioCols, ['לא מועסקים', m => m.none], ...tailCols];
      const el = $('pkTable'); el.style.setProperty('--c', cols.length - 2); el.innerHTML = table(cols, M);
      $('pkUnrep').innerHTML = unrep.length ? `<details class="grp"><summary>טרם דיווחו <small>${unrep.length} בתי ספר</small></summary><div class="mg-table cards nat9" style="--c:1">${table([['בית ספר', schName], ['מצב', x => stateTag(x)], ['תלמידים', x => dash(x.n)]], unrep, () => 'unrep')}</div><button class="lnk noprint" data-act="copy-unrep">${ic('file')}העתקת הרשימה</button></details>` : '';
    }
    $('pikuah').onclick = e => {
      if (e.target.closest('[data-act="copy-unrep"]')) return copyList(rows(F.mon).filter(x => !x.rep).map(x => x.name));
      const m = e.target.closest('[data-mon]'); if (m) return setMon(m.dataset.mon);
      const c = e.target.closest('[data-cmp]'); if (c) return setCmp(c.dataset.cmp);
      const s = e.target.closest('[data-natsch]'); if (s) openSub(natSchoolSpec(s.dataset.natsch));
    };

    /* ---------- התחלה: החודשים מהשרת, ואז כל חודש ונקודת הפתיחה ---------- */
    renderNav();
    content.querySelectorAll(':scope>.sec').forEach(s => s.classList.remove('mb-cur'));
    $(HOME).classList.add('mb-cur'); document.body.dataset.view = HOME;
    $(HOME === 'pikuah' ? 'pkKpis' : 'natHome').innerHTML = '<p class="mb-load">טוען את הנתונים מהשרת…</p>';
    try { history.scrollRestoration = 'manual'; } catch (e) {}
    (async () => {
      try {
        await loadMeg();
        const first = await loadMonth('');
        MONTHS = [...new Set((first.months || []).concat([first.ym]).filter(m => /^\d{4}-\d{2}$/.test(m)))].sort();
        YEARS = new Set(MONTHS.map(m => m.slice(0, 4))).size;
        F.mon = MONTHS.includes(first.ym) ? first.ym : MONTHS[MONTHS.length - 1];
        await Promise.all(MONTHS.filter(m => !DATA[m]).map(m => loadMonth(m)));
        try { const b = await api('natBaseline'); const rowsB = b.rows || []; BASE = rowsB.length ? { rows: rowsB, source: rowsB[0].source || 'קובץ חיצוני', date: rowsB[0].date || '', mon: monName((rowsB[0].date || '').slice(0, 7)) } : null; } catch (e) { BASE = null; }
        renderAll();
        go(HOME, { replace: true });
      } catch (e) {
        if (String(e.message) === 'badsession') return;
        $(HOME === 'pikuah' ? 'pkKpis' : 'natHome').innerHTML = `<p class="warn">הנתונים לא נטענו (${esc(e.message)}). כדאי לרענן את הדף.</p>`;
      }
    })();
  };
})();
