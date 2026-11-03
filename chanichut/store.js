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
  /* statusSrc: 'list' (מרשימת הלומדים) | 'manual' (עודכן ידנית) | 'list-missing' (לא ברשימה המעודכנת · לבדיקה) */
  const STU_PLAIN = ['id', 'mg', 'mgc', 'cls', 'track', 'emp', 'days', 'dayHist', 'status', 'statusSrc', 'start', 'stage', 'stageManual', 'why', 'created'];
  const STU_PRIV = ['name', 'phone', 'phone2', 'tz', 'birth', 'sex', 'act', 'note', 'log', 'hist', 'forms', 'susp', 'mentor'];
  const EMP_PLAIN = ['name', 'mentor', 'manager', 'phone', 'mail', 'addr', 'slots', 'slotsRaw', 'mg', 'mas', 'recheck', 'visit', 'talk', 'contact', 'lead', 'status', 'kind', 'client', 'hours', 'min'];
  /* טקסט חופשי של מעסיק — עלול לכלול שמות, ולכן מוצפן */
  const EMP_PRIV = ['studsTxt', 'masNotes'];
  /* ריכוז שמירות: ממתינים 2.5 שניות אחרי הפעולה האחרונה. אחרי כשל — המתנה גוברת עם פיזור */
  const DEBOUNCE = 2500, MAX_BATCH = 300, BEACON_BYTES = 48000;
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
  let KEY = null, R = null, SNAP = {}, PRIV = {}, EXIST = new Set(), QSNAP = '', busy = false, again = false, timer = 0, failT = 0, fails = 0;

  async function load(key, me, back) {
    KEY = key;
    const M = monthInfo(back);
    /* רק הנוכחות של החודש המוצג */
    const res = await API.call('load', { ym: M.ym });
    if (!res.ok) throw new Error(res.error || 'load');
    R = { month: M, school: me.school, me, role: me.role === 'principal' ? 'manager' : me.role, DOCS,
      EMPS: {}, INS: {}, LEADS: [], STU: [], ATT: {}, NOTES: {}, TIMES: {}, OFF: {}, OFFBAK: {}, SUSPBAK: {}, SUBMITTED: {}, CONF: null, MANUAL: {},
      meta: { frames: 'both', remCfg: { teacher: true, grade: true, streak: 3 }, gantt: {}, contacts: { cls: {}, grade: {} } }, REMLOG: [], bad: 0,
      /* רשימה מעודכנת ממתינה (רק לרכז.ת): הרשומות upd: מוצפנות במפתח חד-פעמי אחר, ולכן עוברות כמו שהן.
         מסך התלמידים פותח אותן עם הקוד מהמייל: CK.unwrapRecovery(code, update.wrap) ואז פענוח של כל e */
      update: null };
    const upd = [];
    for (const r of res.recs) {
      const p = r.p || {};
      if (r.k.startsWith('upd:')) { upd.push({ k: r.k, p, e: r.e || '' }); continue; }
      EXIST.add(r.k);
      if (r.k.startsWith('stu:')) {
        let pv = {};
        try { pv = (await CK.decJSON(key, r.e)) || {}; } catch (e) { R.bad++; continue; }   /* לא נפתח במפתח הזה — לא מציגים */
        PRIV[p.id] = pv;
        const s = Object.assign({}, pick(p, STU_PLAIN), pick(pv, STU_PRIV));
        s.days = s.days || []; s.log = s.log || []; s.hist = s.hist || []; s.forms = s.forms || {};
        s.docs = DOCS.map((_, i) => ({ s: ((p.docs || [])[i] || {}).s || 'miss', n: (pv.docN || [])[i] || '' }));
        R.STU.push(s);
        R.NOTES[p.id] = Object.assign({}, (pv.notes || {})[M.ym]);
      } else if (r.k.startsWith('lead:')) {
        try { const pv = await CK.decJSON(key, r.e); if (pv) R.LEADS.push(pv); } catch (e) { R.bad++; }
      } else if (r.k.startsWith('att:' + M.ym + ':')) {
        const id = r.k.split(':')[2];
        R.ATT[id] = p.a || {}; R.TIMES[id] = p.t || {}; R.OFFBAK[id] = p.ob || {}; R.SUSPBAK[id] = p.sb || {};
      } else if (r.k.startsWith('emp:')) {
        const id = r.k.slice(4); let pv = {};
        if (r.e) { try { pv = (await CK.decJSON(key, r.e)) || {}; } catch (e) { R.bad++; } }
        (id[0] === 'I' ? R.INS : R.EMPS)[id] = Object.assign({}, p, pick(pv, EMP_PRIV));
      } else if (r.k === 'mon:' + M.ym) {
        R.SUBMITTED = p.sub || {}; R.OFF = p.off || {}; R.CONF = p.conf || null;
      } else if (r.k === 'meta') {
        Object.assign(R.meta, p); R.meta.contacts = Object.assign({ cls: {}, grade: {} }, p.contacts);
        Object.entries(p.manual || {}).forEach(([sid, l]) => R.MANUAL[sid] = new Set(l));
      }
    }
    R.STU.sort((a, b) => String(a.created || '').localeCompare(String(b.created || '')) || String(a.name).localeCompare(String(b.name), 'he'));
    R.LEADS.sort((a, b) => (b.created || 0) - (a.created || 0));
    R.STU.forEach(s => { ['ATT', 'NOTES', 'TIMES', 'OFFBAK', 'SUSPBAK'].forEach(k => { R[k][s.id] = R[k][s.id] || {}; }); R.MANUAL[s.id] = R.MANUAL[s.id] || new Set(); });
    /* תזכורות שכבר יצאו החודש — בלי שם, השם מתווסף כאן מהתיק */
    R.REMLOG = (res.remlog || []).filter(x => x.m === M.ym);
    R.remqKeys = (res.remq || []).slice().sort();
    if (res.update && res.update.wrap && upd.length) R.update = { wrap: res.update.wrap, at: res.update.at || '', recs: upd };
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
    Object.entries(R.EMPS).concat(Object.entries(R.INS)).forEach(([id, e]) => { const pv = pick(e, EMP_PRIV); out['emp:' + id] = Object.keys(pv).length ? { p: pick(e, EMP_PLAIN), priv: pv } : { p: pick(e, EMP_PLAIN) }; });
    R.LEADS.forEach(l => { out['lead:' + l.id] = { p: { id: l.id }, priv: l }; });
    out['mon:' + M.ym] = { p: R.CONF ? { sub: R.SUBMITTED, off: R.OFF, conf: R.CONF } : { sub: R.SUBMITTED, off: R.OFF } };
    const manual = {}; Object.entries(R.MANUAL).forEach(([sid, set]) => { if (set && set.size) manual[sid] = [...set]; });
    out.meta = { p: { frames: R.meta.frames, remCfg: R.meta.remCfg, gantt: R.meta.gantt, manual, contacts: R.meta.contacts, wiz: R.meta.wiz } };
    return out;
  }
  const sig = r => JSON.stringify(r);

  function watch() {
    Object.entries(records()).forEach(([k, r]) => { SNAP[k] = sig(r); });
    QSNAP = JSON.stringify(R.remqKeys);
    if (R.role !== 'rakaz') return;
    const kick = () => { if (!failT) schedule(DEBOUNCE); };
    ['click', 'change', 'input', 'keyup'].forEach(t => document.addEventListener(t, kick));
    window.addEventListener('popstate', kick);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(true); });
    /* אזהרה רק כשיש שינוי שבאמת עוד לא נשמר. ביציאה מסודרת (leave) — כבר נשמר */
    window.addEventListener('beforeunload', e => { if (!leaving && (busy || dirtyCount())) { flush(true); e.preventDefault(); e.returnValue = ''; } });
    schedule(50);   /* תור התזכורות מתעדכן גם בלי פעולה, למשל אחרי שינוי שם */
  }
  function dirtyCount() { if (!R || R.role !== 'rakaz') return 0; let n = 0; const cur = records(); Object.entries(cur).forEach(([k, r]) => { if (SNAP[k] !== sig(r)) n++; }); Object.keys(SNAP).forEach(k => { if (!(k in cur)) n++; }); return n; }
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
    /* מחיקות: רשומה שהייתה בשמירה הקודמת ואיננה יותר (תלמיד.ה שנמחק.ה מהרשימה). השרת דורש הצפנה לא ריקה ל-stu:/lead: */
    for (const k of Object.keys(SNAP)) if (!(k in cur)) send.push({ k, p: {}, e: /^(stu|lead):/.test(k) ? await CK.encJSON(KEY, {}) : '', del: true, g: '' });
    const items = R.hooks && R.hooks.mails ? R.hooks.mails() : [];
    const qs = JSON.stringify(items.map(x => x.k).sort().concat(items.map(x => x.to + '|' + x.html)));
    if (!send.length && qs === QSNAP) return;
    busy = true; status('שומר…');
    clearTimeout(failT); failT = 0;
    let busyErr = false;
    try {
      /* מנות: עד 300 רשומות, וביציאה מהדף עד 48KB לבקשה (מגבלת keepalive) */
      const batches = []; let cur = [], size = 0;
      for (const x of send) {
        const n = JSON.stringify(x.p).length + x.e.length + x.k.length + 20;
        if (cur.length && (cur.length >= MAX_BATCH || (beacon && size + n > BEACON_BYTES))) { batches.push(cur); cur = []; size = 0; }
        cur.push(x); size += n;
      }
      if (cur.length) batches.push(cur);
      for (const b of batches) {
        const res = await API.call('put', { recs: b.map(({ k, p, e, del }) => del ? { k, p, e, del: true } : { k, p, e }), keepalive: !!beacon });
        if (!res.ok) { busyErr = res.error === 'busy'; throw new Error(res.error === 'readonly' ? 'צפייה בלבד' : res.error === 'badsession' ? 'החיבור פג. צריך להיכנס שוב' : busyErr ? 'השרת עמוס, מנסה שוב' : 'השמירה לא הצליחה (' + (res.error || '') + ')'); }
        b.forEach(x => { if (x.del) { delete SNAP[x.k]; EXIST.delete(x.k); } else { SNAP[x.k] = x.g; EXIST.add(x.k); } });
      }
      if (qs !== QSNAP) {
        const res = await API.call('remqSet', { items, keepalive: !!beacon });
        if (!res.ok) { busyErr = res.error === 'busy'; throw new Error('התזכורות לא נשמרו'); }
        QSNAP = qs;
      }
      status('נשמר', 'ok'); fails = 0;
    } catch (err) {
      status('לא נשמר · מנסה שוב', 'bad');
      if (R.hooks && R.hooks.toast && fails < 2) R.hooks.toast(String(err.message || err));
      /* המתנה גוברת עם פיזור, כדי שכל הרכזים לא ינסו שוב באותה שנייה: 8, 16, 32, 60 שניות */
      fails++;
      const wait = Math.min(60000, 8000 * Math.pow(2, fails - 1) * (busyErr ? 1.5 : 1)) + Math.floor(Math.random() * 4000);
      failT = setTimeout(() => { failT = 0; flush(); }, wait);
    } finally {
      busy = false;
      if (again) { again = false; schedule(50); }
    }
  }

  root.Store = { load, watch, flush, leave, monthInfo, dirtyCount, DOCS };
})(window);
