/* ===================================================================
   שכבת הנתונים — מערכת רכזי החניכות v2 (1.11.26)
   load: מוריד את הרשומות של בית הספר, מפענח בדפדפן ובונה את אותו מבנה שהמוקאפ עבד איתו.
   watch: אחרי כל פעולה של הרכז.ת משווה את המצב לשמירה האחרונה, מצפין את מה שהשתנה ושולח רק אותו.
   כך המסכים של המוקאפ עובדים כמו שהם, והשמירה לא תלויה בכל כפתור בנפרד.
   =================================================================== */
(function (root) {
  'use strict';
  const DOCS = ['תעודת זהות', 'חשבון בנק', 'אישור רפואי', 'טופס מוכנות ליציאה (חתום)', 'הסכם התקשרות עם המעסיק'];
  const MN = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  const STU_PLAIN = ['id', 'mg', 'cls', 'track', 'emp', 'days', 'dayHist', 'status', 'statusSrc', 'start', 'stage', 'stageManual', 'why', 'created'];
  const STU_PRIV = ['name', 'phone', 'phone2', 'tz', 'birth', 'sex', 'act', 'note', 'log', 'hist', 'forms', 'susp', 'mentor'];
  const EMP_PLAIN = ['name', 'mentor', 'manager', 'phone', 'mail', 'addr', 'slots', 'slotsRaw', 'mg', 'mas', 'masNotes', 'recheck', 'visit', 'talk', 'contact', 'lead', 'status', 'studsTxt', 'kind', 'client', 'hours', 'min'];
  const pick = (o, ks) => { const r = {}; ks.forEach(k => { if (o[k] !== undefined) r[k] = o[k]; }); return r; };
  const ymOf = (y, m) => y + '-' + String(m).padStart(2, '0');

  /* החודש המוצג: החודש הנוכחי, או החודש הקודם אם נבחר (להגשה בתחילת חודש) */
  function monthInfo(back) {
    const now = new Date(), d = new Date(now.getFullYear(), now.getMonth() - (back ? 1 : 0), 1);
    const y = d.getFullYear(), m = d.getMonth() + 1, last = new Date(y, m, 0).getDate();
    return { y, m, name: MN[m - 1], label: MN[m - 1] + ' ' + y, last, today: back ? last : now.getDate(), ym: ymOf(y, m), back: !!back };
  }

  let leaving = false;
  /* יציאה או החלפת חודש: שומרים הכול ואז עוזבים בלי אזהרה */
  async function leave() { clearTimeout(timer); timer = 0; await flush(); leaving = true; }
  let KEY = null, R = null, SNAP = {}, PRIV = {}, EXIST = new Set(), QSNAP = '', busy = false, again = false, timer = 0, failT = 0;

  async function load(key, me, back) {
    KEY = key;
    const res = await API.call('load');
    if (!res.ok) throw new Error(res.error || 'load');
    const M = monthInfo(back);
    R = { month: M, school: me.school, me, role: me.role === 'principal' ? 'manager' : me.role, DOCS,
      EMPS: {}, INS: {}, STU: [], ATT: {}, NOTES: {}, TIMES: {}, OFF: {}, OFFBAK: {}, SUSPBAK: {}, SUBMITTED: {}, MANUAL: {},
      meta: { frames: 'both', remCfg: { teacher: true, grade: true, streak: 3 }, gantt: {}, contacts: { cls: {}, grade: {} } }, REMLOG: [], bad: 0 };
    for (const r of res.recs) {
      EXIST.add(r.k);
      const p = r.p || {};
      if (r.k.startsWith('stu:')) {
        let pv = {};
        try { pv = (await CK.decJSON(key, r.e)) || {}; } catch (e) { R.bad++; continue; }   /* לא נפתח במפתח הזה — לא מציגים */
        PRIV[p.id] = pv;
        const s = Object.assign({}, pick(p, STU_PLAIN), pick(pv, STU_PRIV));
        s.days = s.days || []; s.log = s.log || []; s.hist = s.hist || []; s.forms = s.forms || {};
        s.docs = DOCS.map((_, i) => ({ s: ((p.docs || [])[i] || {}).s || 'miss', n: (pv.docN || [])[i] || '' }));
        R.STU.push(s);
        R.NOTES[p.id] = Object.assign({}, (pv.notes || {})[M.ym]);
      } else if (r.k.startsWith('att:' + M.ym + ':')) {
        const id = r.k.split(':')[2];
        R.ATT[id] = p.a || {}; R.TIMES[id] = p.t || {}; R.OFFBAK[id] = p.ob || {}; R.SUSPBAK[id] = p.sb || {};
      } else if (r.k.startsWith('emp:')) {
        const id = r.k.slice(4); (id[0] === 'I' ? R.INS : R.EMPS)[id] = p;
      } else if (r.k === 'mon:' + M.ym) {
        R.SUBMITTED = p.sub || {}; R.OFF = p.off || {};
      } else if (r.k === 'meta') {
        Object.assign(R.meta, p); R.meta.contacts = Object.assign({ cls: {}, grade: {} }, p.contacts);
        Object.entries(p.manual || {}).forEach(([sid, l]) => R.MANUAL[sid] = new Set(l));
      }
    }
    R.STU.sort((a, b) => String(a.created || '').localeCompare(String(b.created || '')) || String(a.name).localeCompare(String(b.name), 'he'));
    R.STU.forEach(s => { ['ATT', 'NOTES', 'TIMES', 'OFFBAK', 'SUSPBAK'].forEach(k => { R[k][s.id] = R[k][s.id] || {}; }); R.MANUAL[s.id] = R.MANUAL[s.id] || new Set(); });
    /* תזכורות שכבר יצאו החודש — בלי שם, השם מתווסף כאן מהתיק */
    R.REMLOG = (res.remlog || []).filter(x => x.m === M.ym);
    R.remqKeys = (res.remq || []).slice().sort();
    return R;
  }

  /* ---------- המצב הנוכחי כרשומות ---------- */
  function records() {
    const M = R.month, out = {};
    R.STU.forEach(s => {
      const p = pick(s, STU_PLAIN);
      p.docs = s.docs.map(d => ({ s: d.s || 'miss' }));
      p.formsMeta = {}; Object.entries(s.forms || {}).forEach(([i, f]) => { p.formsMeta[i] = { d: f.d, st: f.st }; });
      const pv = Object.assign({}, PRIV[s.id] || {}, pick(s, STU_PRIV));
      pv.docN = s.docs.map(d => d.n || '');
      pv.notes = Object.assign({}, (PRIV[s.id] || {}).notes, { [M.ym]: R.NOTES[s.id] || {} });
      if (!Object.keys(pv.notes[M.ym]).length) delete pv.notes[M.ym];
      out['stu:' + s.id] = { p, priv: pv };
      const a = { a: R.ATT[s.id] || {}, t: R.TIMES[s.id] || {}, ob: R.OFFBAK[s.id] || {}, sb: R.SUSPBAK[s.id] || {} };
      const ak = 'att:' + M.ym + ':' + s.id;
      if (EXIST.has(ak) || Object.values(a).some(o => Object.keys(o).length)) out[ak] = { p: a };
    });
    Object.entries(R.EMPS).concat(Object.entries(R.INS)).forEach(([id, e]) => { out['emp:' + id] = { p: pick(e, EMP_PLAIN) }; });
    out['mon:' + M.ym] = { p: { sub: R.SUBMITTED, off: R.OFF } };
    const manual = {}; Object.entries(R.MANUAL).forEach(([sid, set]) => { if (set && set.size) manual[sid] = [...set]; });
    out.meta = { p: { frames: R.meta.frames, remCfg: R.meta.remCfg, gantt: R.meta.gantt, manual, contacts: R.meta.contacts } };
    return out;
  }
  const sig = r => JSON.stringify(r);

  function watch() {
    Object.entries(records()).forEach(([k, r]) => { SNAP[k] = sig(r); });
    QSNAP = JSON.stringify(R.remqKeys);
    if (R.role !== 'rakaz') return;
    const kick = () => schedule(350);
    ['click', 'change', 'input', 'keyup'].forEach(t => document.addEventListener(t, kick));
    window.addEventListener('popstate', kick);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(true); });
    /* אזהרה רק כשיש שינוי שבאמת עוד לא נשמר. ביציאה מסודרת (leave) — כבר נשמר */
    window.addEventListener('beforeunload', e => { if (!leaving && (busy || dirtyCount())) { flush(true); e.preventDefault(); e.returnValue = ''; } });
    schedule(50);   /* תור התזכורות מתעדכן גם בלי פעולה, למשל אחרי שינוי שם */
  }
  function dirtyCount() { if (!R || R.role !== 'rakaz') return 0; let n = 0; Object.entries(records()).forEach(([k, r]) => { if (SNAP[k] !== sig(r)) n++; }); return n; }
  function schedule(ms) { clearTimeout(timer); timer = setTimeout(() => { timer = 0; flush(); }, ms); }
  function status(t, cls) { const el = document.getElementById('saveSt'); if (el) { el.textContent = t; el.className = 'save-st ' + (cls || ''); } }

  async function flush(beacon) {
    if (!R || R.role !== 'rakaz') return;
    if (busy) { again = true; return; }
    const cur = records(), send = [];
    for (const [k, r] of Object.entries(cur)) {
      const g = sig(r); if (SNAP[k] === g) continue;
      send.push({ k, p: r.p, e: r.priv ? await CK.encJSON(KEY, r.priv) : '', g });
    }
    const items = R.hooks && R.hooks.mails ? R.hooks.mails() : [];
    const qs = JSON.stringify(items.map(x => x.k).sort().concat(items.map(x => x.to + '|' + x.html)));
    if (!send.length && qs === QSNAP) return;
    busy = true; status('שומר…');
    try {
      if (send.length) {
        const res = await API.call('put', { recs: send.map(({ k, p, e }) => ({ k, p, e })), keepalive: !!beacon });
        if (!res.ok) throw new Error(res.error === 'readonly' ? 'צפייה בלבד' : res.error === 'badsession' ? 'החיבור פג. צריך להיכנס שוב' : 'השמירה לא הצליחה (' + (res.error || '') + ')');
        send.forEach(x => { SNAP[x.k] = x.g; EXIST.add(x.k); });
      }
      if (qs !== QSNAP) {
        const res = await API.call('remqSet', { items, keepalive: !!beacon });
        if (!res.ok) throw new Error('התזכורות לא נשמרו');
        QSNAP = qs;
      }
      status('נשמר', 'ok'); clearTimeout(failT);
    } catch (err) {
      status('לא נשמר · מנסה שוב', 'bad');
      if (R.hooks && R.hooks.toast) R.hooks.toast(String(err.message || err));
      clearTimeout(failT); failT = setTimeout(() => flush(), 8000);
    } finally {
      busy = false;
      if (again) { again = false; schedule(50); }
    }
  }

  root.Store = { load, watch, flush, leave, monthInfo, dirtyCount, DOCS };
})(window);
