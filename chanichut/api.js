/* ===================================================================
   API — מערכת רכזי החניכות v2 (1.11.26, תפקידים ומבט ארצי 2.11.26)
   EXEC ריק = שרת מדומה בדפדפן (localStorage), לבדיקה בלבד. אותן פעולות ואותם שדות כמו gas/קוד.js.
   בשני המצבים השרת מקבל רק מה שכבר הוצפן בדפדפן, ושדות גלויים מוגדרים.
   ?mock=seed — זורע נתונים בדויים לכמה בתי ספר (פעם אחת), כדי לבדוק את המבט הארצי. גם API.mockSeed(n).
   =================================================================== */
(function (root) {
  'use strict';
  /* הסקריפט בחשבון merhav: "מערכת רכזי החניכות v2" (1KpZdMOa4QJFqOhPLETFuSiMrzbYFywLc1IH3bpqyjyRcpxLBoFCgPnUf).
     ?mock בכתובת הדף = שרת מדומה לבדיקות */
  var EXEC = /[?&]mock\b/.test(location.search) ? '' : 'https://script.google.com/macros/s/AKfycbxMJyp_D7-HLLCjDcZLU2CfG1I83wCpjyd40uc8Ov8SpJ1agnLlUHJWg-es6IK6gOqQsQ/exec';
  var MOCK = !EXEC;
  var TOKEN_KEY = 'chanichut2-session';

  function session() { try { return JSON.parse(localStorage.getItem(TOKEN_KEY) || 'null'); } catch (e) { return null; } }
  function setSession(s) { try { s ? localStorage.setItem(TOKEN_KEY, JSON.stringify(s)) : localStorage.removeItem(TOKEN_KEY); } catch (e) {} }

  async function call(action, body) {
    var s = session();
    var req = Object.assign({ action: action, token: s && s.token }, body || {});
    if (MOCK) {
      await new Promise(function (r) { setTimeout(r, 80); });
      return JSON.parse(JSON.stringify(mock(JSON.parse(JSON.stringify(req)))));
    }
    /* text/plain — בלי preflight, כמו בשאר השרתים של המרחב */
    var r = await fetch(EXEC, { method: 'POST', body: JSON.stringify(req), headers: { 'Content-Type': 'text/plain;charset=utf-8' }, credentials: 'omit', keepalive: !!(body && body.keepalive) });
    return r.json();
  }

  /* ================= שרת מדומה ================= */
  var DBK = 'chanichut2-mock-db';
  var ROLES = ['rakaz', 'principal', 'pedco', 'system', 'staff', 'ped', 'pro', 'net'], KEYED = ['rakaz', 'principal', 'pedco'], NAT = ['system', 'staff', 'ped', 'pro', 'net'];
  var PIKUAH = 'פיקוח', NETP = 'רשת · ';
  var WHY = ['חסרים מסמכים', 'לא נמצא מעסיק', 'נגישות תחבורתית', 'סיבה אישית', 'עזב.ה'];
  /* מי רשאי לכל פעולה — כמו ALLOW_ בשרת */
  var ALLOW = {
    me: ROLES, logout: ROLES, keys: KEYED, keysSet: KEYED, load: KEYED, empDb: KEYED,
    keysInit: ['rakaz'], keysActivate: ['rakaz'], grant: ['rakaz'], put: ['rakaz'], remqSet: ['rakaz'], remSend: ['rakaz'], monConf: ['rakaz'], raw: ['rakaz'],
    rakazAdd: ['principal'],
    preload: ['system'], preloadStatus: ['system'], activationSend: ['system'], schoolsAdmin: ['system'], permsLoad: ['system'], baselineLoad: ['system'], stateRefresh: ['system'],
    natStats: NAT, natBaseline: NAT, schoolAnon: NAT, schoolEmps: ['system', 'ped', 'pro']
  };
  var WRITE = ['keysInit', 'keysActivate', 'grant', 'put', 'remqSet', 'remSend', 'monConf'];
  function blank() { return { perms: [], schools: {}, codes: {}, sessions: {}, remq: {}, remlog: [], outbox: [], base: null, seeded: 0 }; }
  function db() { var d; try { d = JSON.parse(localStorage.getItem(DBK) || 'null'); } catch (e) { d = null; } return Object.assign(blank(), d || {}); }
  function save(d) { try { localStorage.setItem(DBK, JSON.stringify(d)); } catch (e) { throw new Error('המקום בדפדפן נגמר (מצב בדיקה)'); } }
  function hash(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
  function mask(e) { var p = String(e).split('@'); return p.length < 2 ? '•••' : p[0][0] + '•••••@' + p[1][0] + '•••.' + p[1].split('.').pop(); }
  function pid(p) { return 'P' + Math.abs(hash(p.school + '|' + p.email + (p.school === PIKUAH ? '|' + p.role : ''))).toString(36); }
  function pkey(p) { return p.school + '|' + p.email + (p.school === PIKUAH ? '|' + p.role : ''); }
  var SCH = function () { return (root.SCHOOLS || []).slice(0, 64); };
  /* קודי מגמה לבדיקה: מהקבצים הציבוריים אם נטענו, אחרת רשימה קצרה */
  var FALLBACK_MG = [['1401', 'חשמלאי מוסמך'], ['2249', 'אוטוטק/אוטוטרוניקה'], ['603', 'עיצוב שיער'], ['3024', 'תפעול מערכות תקשוב'], ['1626', 'קולינריה']];
  var PRO_CODES = ['1401', '2249'];
  /* בבדיקה: לכל בית ספר רכז.ת, מנהל.ת ורכז.ת פדגוגי.ת בדויים, ולמבט הארצי מטה, מפקחים ורשת בדויים.
     ההיקף של המפקחים בבדיקה: פדגוגי.ת — בתי הספר של המפקח.ת הראשונ.ה ברשימה; מקצועי.ת — קודי PRO_CODES. בשרת האמיתי — היקף.js */
  function perms(d) {
    var L = SCH(), base = [];
    L.forEach(function (x) {
      var slug = 's' + Math.abs(hash(x.name)).toString(36);   /* אותיות קטנות — כמו בשרת האמיתי */
      base.push({ school: x.name, name: 'רכז.ת החניכות (בדיקה)', role: 'rakaz', email: 'rakaz.' + slug + '@school.example', active: 'כן' });
      base.push({ school: x.name, name: 'מנהל.ת בית הספר (בדיקה)', role: 'principal', email: 'menahel.' + slug + '@school.example', active: 'כן' });
      base.push({ school: x.name, name: 'רכז.ת פדגוגי.ת (בדיקה)', role: 'pedco', email: 'pedco.' + slug + '@school.example', active: 'כן' });
    });
    base.push({ school: 'המרחב הפדגוגי', name: 'המרחב הפדגוגי', role: 'system', email: 'merhav@pedagogiamh.co.il', active: 'כן' });
    base.push({ school: 'מטה', name: 'מטה (בדיקה)', role: 'staff', email: 'mate@example.org', active: 'כן' });
    if (L.length) {
      base.push({ school: PIKUAH, name: 'מפקח.ת פדגוגי.ת (בדיקה)', role: 'ped', email: 'ped@example.org', active: 'כן', supOf: L[0].sup });
      base.push({ school: NETP + L[0].net, name: 'רשת (בדיקה)', role: 'net', email: 'reshet@example.org', active: 'כן' });
    }
    base.push({ school: PIKUAH, name: 'מפקח.ת מקצועי.ת (בדיקה)', role: 'pro', email: 'pro@example.org', active: 'כן', codes: PRO_CODES });
    /* שורות בדיקה של מטה/פיקוח/רשת שנטענו (permsLoad או בדיקה) מחליפות את ברירת המחדל של אותו תפקיד */
    var own = {}; d.perms.forEach(function (p) { if (NAT.indexOf(p.role) >= 0) own[p.role] = 1; });
    base = base.filter(function (p) { return p.role === 'system' || !own[p.role]; });
    var m = {}, order = [];
    base.concat(d.perms).forEach(function (p) { var k = pkey(p); if (!m[k]) order.push(k); m[k] = Object.assign({}, m[k] || {}, p); });
    return order.map(function (k) { return m[k]; }).filter(function (p) { return ROLES.indexOf(p.role) >= 0; });
  }
  function today() { return new Date(Date.now() + 2 * 36e5).toISOString().slice(0, 10); }
  function nowS() { return new Date(Date.now() + 2 * 36e5).toISOString().slice(0, 16).replace('T', ' '); }
  function ymOf(back) { var t = today().split('-'), y = +t[0], m = +t[1] - (back || 0); while (m < 1) { m += 12; y--; } return y + '-' + (m < 10 ? '0' : '') + m; }
  function okCipher(v) { return v === '' || /^v1\.[A-Za-z0-9+/=]+\.[A-Za-z0-9+/=]+$/.test(String(v || '')); }
  var STU_PLAIN = ['id', 'mg', 'mgc', 'cls', 'track', 'emp', 'days', 'dayHist', 'status', 'statusSrc', 'start', 'docs', 'stage', 'stageManual', 'why', 'formsMeta', 'created'];
  var EMP_PLAIN = ['name', 'mentor', 'manager', 'phone', 'mail', 'addr', 'slots', 'slotsRaw', 'mg', 'mas', 'recheck', 'visit', 'talk', 'contact', 'lead', 'status', 'kind', 'client', 'hours', 'min'];
  var MON_PLAIN = ['sub', 'off', 'conf'];
  function pick(o, keys) { var r = {}; keys.forEach(function (k) { if (o && o[k] !== undefined) r[k] = o[k]; }); return r; }
  function nn(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); }
  function recState(t) { return !t || !t.recovery ? 'none' : t.pending ? 'pending' : 'active'; }

  /* ---------- היקף (כמו scope_ בשרת) ---------- */
  function mgNames(code) { var n = {}; if (root.MEGAMOT_CODES && root.MEGAMOT_CODES[code]) n[nn(root.MEGAMOT_CODES[code])] = 1; FALLBACK_MG.forEach(function (x) { if (x[0] === code) n[nn(x[1])] = 1; }); return n; }
  function scope(d, s) {
    if (s.role === 'system' || s.role === 'staff') return { all: true, schools: {} };
    var out = { schools: {} };
    if (KEYED.indexOf(s.role) >= 0) { out.schools[s.school] = true; return out; }
    if (s.role === 'ped') { var sup = s.supOf || (SCH()[0] || {}).sup; SCH().forEach(function (x) { if (x.sup === sup) out.schools[x.name] = true; }); }
    if (s.role === 'net') { var net = nn(s.school.slice(NETP.length)); SCH().forEach(function (x) { if (nn(x.net) === net) out.schools[x.name] = true; }); }
    if (s.role === 'pro') {
      out.mg = {};
      var codes = s.codes || PRO_CODES;
      SCH().forEach(function (x) {
        var has = (root.MEGAMOT && root.MEGAMOT[x.semel] || []).filter(function (m) { return codes.indexOf(String(m[1])) >= 0; }).map(function (m) { return [String(m[1]), m[0]]; });
        var t = d.schools[x.name];
        if (t) Object.keys(t.recs).forEach(function (k) { var p = t.recs[k].p; if (/^stu:/.test(k) && p.mgc && codes.indexOf(String(p.mgc)) >= 0) has.push([String(p.mgc), p.mg]); });
        if (!has.length) return;
        out.schools[x.name] = true;
        var o = out.mg[x.name] = { codes: {}, names: {} };
        has.forEach(function (h) { o.codes[h[0]] = true; o.names[nn(h[1])] = true; Object.assign(o.names, mgNames(h[0])); });
      });
    }
    return out;
  }
  function inScope(sc, school) { return !!(sc.all || sc.schools[school]); }
  function mgIn(sc, school, mg, mgc) { if (!sc.mg) return true; var o = sc.mg[school]; if (!o) return false; return mgc ? !!o.codes[String(mgc)] : !!o.names[nn(mg)]; }
  function allSchools(d) { var seen = {}, out = []; SCH().forEach(function (x) { if (!seen[x.name]) { seen[x.name] = 1; out.push(x.name); } }); Object.keys(d.schools).forEach(function (n) { if (!seen[n] && d.schools[n].recovery) { seen[n] = 1; out.push(n); } }); return out; }
  function semelOf(n) { var x = SCH().filter(function (y) { return y.name === n; })[0]; return x ? x.semel : ''; }

  /* ---------- ספירה (כמו countStats_ בשרת) ---------- */
  function wdOf(ym, d) { var p = ym.split('-'); return new Date(Date.UTC(+p[0], +p[1] - 1, d)).getUTCDay(); }
  function lastDay(ym) { var p = ym.split('-'); return new Date(Date.UTC(+p[0], +p[1], 0)).getUTCDate(); }
  function workDays(s, a, ym, upto) { var out = [], days = Array.isArray(s.days) ? s.days : [], h = s.dayHist && Array.isArray(s.dayHist.days) ? s.dayHist : null; for (var d = 1; d <= upto; d++) { var w = h && d < +h.from ? h.days : days; if (w.indexOf(wdOf(ym, d)) >= 0 || (a[d] && a[d] !== 'n')) out.push(d); } return out; }
  function zero() { return { n: 0, out: 0, in: 0, noData: 0, why: {}, places: 0, stage: [0, 0, 0, 0, 0], att: { p: 0, t: 0, u: 0 } }; }
  function countStats(recs, ym) {
    var cur = ymOf(0), upto = ym === cur ? +today().slice(8, 10) : ym < cur ? lastDay(ym) : 0, stus = [], att = {}, mon = {};
    Object.keys(recs).forEach(function (k) { var p = recs[k].p || {}; if (/^stu:/.test(k)) stus.push(p); else if (k.indexOf('att:' + ym + ':') === 0) att[k.split(':')[2]] = p.a || {}; else if (k === 'mon:' + ym) mon = p; });
    var sub = mon.sub || {}, all = zero(), mg = {}, places = {}, mgP = {}, marked = false;
    Object.keys(att).forEach(function (id) { Object.keys(att[id]).forEach(function (x) { if (att[id][x]) marked = true; }); });
    var add = function (o, s, a, place, ds) {
      o.n++; if (place === 'out') o.out++; else if (place === 'in') o.in++; else if (s.why) { var w = WHY.indexOf(s.why) >= 0 ? s.why : 'אחר'; o.why[w] = (o.why[w] || 0) + 1; } else o.noData++;
      var st = +s.stage; o.stage[st >= 0 && st <= 4 ? st : 0]++;
      ds.forEach(function (x) { var v = a[x]; if (!v) { o.att.u++; return; } if (v === 'n' || v === 'x') return; o.att.t++; if (v === 'p' || v === 's') o.att.p++; });
    };
    stus.forEach(function (s) {
      var name = nn(s.mg) || 'ללא מגמה', o = mg[name] = mg[name] || Object.assign(zero(), { code: '', sub: !!sub[s.mg] });
      if (!o.code && s.mgc) o.code = String(s.mgc);
      if (s.status === 'עזב') return;
      var a = att[s.id] || {}, emp = String(s.emp || ''), place = !emp ? '' : emp[0] === 'I' ? 'in' : 'out';
      var ds = workDays(s, a, ym, upto); add(all, s, a, place, ds); add(o, s, a, place, ds);
      if (emp) { places[emp] = 1; (mgP[name] = mgP[name] || {})[emp] = 1; }
    });
    all.places = Object.keys(places).length; Object.keys(mg).forEach(function (k) { mg[k].places = Object.keys(mgP[k] || {}).length; });
    var names = Object.keys(mg).filter(function (k) { return k !== 'ללא מגמה'; });
    all.allMg = names.length; all.subMg = names.filter(function (k) { return mg[k].sub; }).length; all.marked = marked; all.conf = mon.conf || null; all.mg = mg;
    return all;
  }
  function stateOf(rs, st) { if (rs !== 'active') return rs; if (st.conf || (st.allMg && st.subMg === st.allMg)) return 'done'; return st.marked || st.subMg ? 'partial' : 'silent'; }
  function filterMg(st, sc, school) {
    if (!st || !sc.mg) return st;
    var o = zero(), mg = {}, sub = 0, all = 0;
    Object.keys(st.mg || {}).forEach(function (k) {
      var x = st.mg[k]; if (!mgIn(sc, school, k, x.code)) return;
      mg[k] = x; all++; if (x.sub) sub++;
      ['n', 'out', 'in', 'noData', 'places'].forEach(function (f) { o[f] += +x[f] || 0; });
      Object.keys(x.why || {}).forEach(function (w) { o.why[w] = (o.why[w] || 0) + x.why[w]; });
      (x.stage || []).forEach(function (v, i) { o.stage[i] += +v || 0; });
      ['p', 't', 'u'].forEach(function (f) { o.att[f] += +(x.att || {})[f] || 0; });
    });
    o.allMg = all; o.subMg = sub; o.conf = st.conf; o.marked = st.marked; o.mg = mg; return o;
  }
  function view(st, state) {
    if (state === 'none' || !st) return null;
    if (state === 'pending' || state === 'silent') return { n: st.n, out: null, in: null, noData: null, why: null, places: null, stage: null, att: null, attPct: null, empPct: null, subMg: null, allMg: st.allMg == null ? null : st.allMg, conf: null, mg: null };
    var r = JSON.parse(JSON.stringify(st)); delete r.marked;
    r.empPct = r.n ? Math.round((r.out + r.in) / r.n * 100) : null; r.attPct = r.att && r.att.t ? Math.round(r.att.p / r.att.t * 100) : null;
    Object.keys(r.mg || {}).forEach(function (k) { var x = r.mg[k]; x.empPct = x.n ? Math.round((x.out + x.in) / x.n * 100) : null; x.attPct = x.att && x.att.t ? Math.round(x.att.p / x.att.t * 100) : null; });
    return r;
  }
  function natRow(d, sc, school, ym) {
    var t = d.schools[school], rs = recState(t), cur = ymOf(0), day = +today().slice(8, 10);
    var st = t ? countStats(t.recs, ym) : null, state = rs === 'active' ? stateOf(rs, st) : rs;
    var locked = ym >= cur ? false : ym === ymOf(1) ? (day > 10 ? 'all' : 'emp') : 'all';
    return { school: school, semel: semelOf(school), state: state, locked: locked, calcAt: t ? nowS() : '', stats: view(filterMg(st, sc, school), state) };
  }

  /* ---------- זריעת נתונים בדויים למבט הארצי ---------- */
  function rnd(seed) { var x = Math.abs(seed) || 1; return function () { x = (x * 16807) % 2147483647; return (x - 1) / 2147483646; }; }
  var FAKE_E = 'v1.U0VFRA==.TU9DSw==';   /* לא מוצפן באמת, ולא נפתח — רק בצורה של מוצפן */
  function seedDb(d, n) {
    var L = SCH().filter(function (x) { return !d.schools[x.name] || !d.schools[x.name].recovery; }).slice(0, n || 12), cur = ymOf(0), prev = ymOf(1), day = +today().slice(8, 10);
    L.forEach(function (x, i) {
      var r = rnd(hash(x.name)), kind = i % 6, recs = {};
      var mgs = (root.MEGAMOT && root.MEGAMOT[x.semel] || []).map(function (m) { return [String(m[1]), m[0]]; });
      if (!mgs.length) mgs = FALLBACK_MG.slice(i % 3, i % 3 + 3);
      if (i % 2 === 0 && !mgs.some(function (m) { return PRO_CODES.indexOf(m[0]) >= 0; })) mgs.push(FALLBACK_MG[0]);
      var count = 15 + Math.floor(r() * 25);
      for (var j = 0; j < count; j++) {
        var mg = mgs[j % mgs.length], id = 'Q' + i + 'x' + j, placed = kind !== 4 && r() < 0.5, inner = placed && r() < 0.15;
        var emp = placed ? (inner ? 'I' : 'E') + (1 + Math.floor(r() * 6)) : '';
        var p = { id: id, mg: mg[1], mgc: mg[0], cls: (j % 2 ? 'יב' : 'יא') + ' · קבוצה ' + (1 + j % 3), track: '', emp: emp, days: placed ? [0, 2, 4].slice(0, 1 + Math.floor(r() * 3)) : [], status: r() < 0.04 ? 'עזב' : 'לומד', statusSrc: 'list',
          stage: placed ? 1 + Math.floor(r() * 3) : 0, why: !placed && r() < 0.6 ? WHY[Math.floor(r() * 4)] : '', docs: [{ s: 'ok' }, { s: r() < 0.5 ? 'ok' : 'miss' }], created: '2026-09-0' + (1 + j % 9) };
        recs['stu:' + id] = { p: p, e: FAKE_E };
        if (placed && kind !== 0 && kind !== 1) [prev, cur].forEach(function (ym) {
          var a = {}, upto = ym === cur ? day : lastDay(ym);
          for (var dd = 1; dd <= upto; dd++) if (p.days.indexOf(wdOf(ym, dd)) >= 0 && r() < 0.9) a[dd] = r() < 0.85 ? 'p' : r() < 0.5 ? 'a' : 'x';
          recs['att:' + ym + ':' + id] = { p: { a: a, t: {}, ob: {}, sb: {} }, e: '' };
        });
      }
      for (var k = 1; k <= 6; k++) recs['emp:E' + k] = { p: { name: 'מעסיק בדוי ' + k, phone: '03-0000000', mail: 'mesik' + k + '@example.org', mas: 'מאושר', slots: 2 }, e: '' };
      recs['emp:I1'] = { p: { name: 'עסק בית-ספרי (בדוי)', kind: 'עסק בית-ספרי' }, e: '' };
      var names = mgs.map(function (m) { return m[1]; }), sub = {};
      if (kind === 2) names.forEach(function (m) { sub[m] = true; });
      if (kind === 3 || kind === 5) sub[names[0]] = true;
      recs['mon:' + cur] = { p: kind === 4 ? { sub: {}, off: {}, conf: today() } : { sub: sub, off: {} }, e: '' };
      var all = {}; names.forEach(function (m) { all[m] = true; });
      if (kind !== 1) recs['mon:' + prev] = { p: { sub: all, off: {} }, e: '' };
      d.schools[x.name] = { keys: {}, recovery: { ct: 'seed' }, pending: kind === 0, recs: recs, seed: true };
    });
    if (!d.base) d.base = { source: 'קובץ חיצוני (בדוי)', date: '2026-09-30', at: nowS(), rows: SCH().slice(0, 40).map(function (x) { var r = rnd(hash(x.semel)), nn2 = 40 + Math.floor(r() * 150), o = Math.floor(nn2 * r() * 0.2); return { school: x.name, semel: x.semel, stats: { n: nn2, out: o, in: Math.floor(o * 0.1) } }; }) };
    d.seeded = (d.seeded || 0) + L.length;
    return L.length;
  }

  function mock(q) {
    var d = db(), P = perms(d);
    var active = function () { return P.filter(function (p) { return p.active === 'כן'; }); };
    if (q.action === 'people') return { ok: true, people: active().filter(function (p) { return p.school === nn(q.school); }).map(function (p) { return { pid: pid(p), role: p.role, masked: mask(p.email) }; }) };
    if (q.action === 'register') {
      if (!q.school || !q.name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(q.email || '')) return { ok: false, error: 'bad' };
      if (P.some(function (p) { return p.school === q.school && p.email === String(q.email).toLowerCase(); })) return { ok: true, already: true };
      d.perms.push({ school: q.school, name: q.name, role: q.role === 'principal' ? 'principal' : 'rakaz', email: String(q.email).toLowerCase(), active: 'ממתין' }); save(d); return { ok: true };
    }
    if (q.action === 'codeSend') {
      var p = active().filter(function (x) { return x.school === nn(q.school) && pid(x) === q.pid; })[0];
      if (!p) return { ok: false, error: 'noperson' };
      var code = String(100000 + Math.floor(Math.random() * 900000));
      d.codes[q.pid] = { code: code, school: p.school, email: p.email, role: p.role, tries: 0, until: Date.now() + 20 * 6e4 }; save(d);
      return { ok: true, masked: mask(p.email), demoCode: code };   /* demoCode רק בבדיקה. בשרת האמיתי הקוד יוצא במייל */
    }
    if (q.action === 'codeVerify') {
      var c = d.codes[q.pid];
      if (!c || c.until < Date.now()) return { ok: false, error: 'expired' };
      if (++c.tries > 5) { delete d.codes[q.pid]; save(d); return { ok: false, error: 'tries' }; }
      if (String(q.code) !== c.code) { save(d); return { ok: false, error: 'badcode' }; }
      var pp = active().filter(function (x) { return x.school === c.school && x.email === c.email && (!c.role || x.role === c.role); })[0];
      if (!pp) return { ok: false, error: 'noperson' };
      var tok = 'T' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      d.sessions[tok] = { email: pp.email, name: pp.name, role: pp.role, school: pp.school };
      pp.last = nowS(); d.perms.push(Object.assign({}, pp));
      delete d.codes[q.pid]; save(d);
      return { ok: true, token: tok, me: d.sessions[tok] };
    }
    var ss = d.sessions[q.token], me = ss && active().filter(function (x) { return x.email === ss.email && x.school === ss.school && (!ss.role || x.role === ss.role); })[0];
    if (!me) return { ok: false, error: 'badsession' };
    var s = { email: me.email, name: me.name, role: me.role, school: me.school, active: me.active }, priv = { supOf: me.supOf, codes: me.codes };
    if (!ALLOW[q.action]) return { ok: false, error: 'badaction' };
    if (ALLOW[q.action].indexOf(s.role) < 0) return { ok: false, error: KEYED.indexOf(s.role) >= 0 && WRITE.indexOf(q.action) >= 0 ? 'readonly' : 'forbidden' };
    var R = function (o) { save(d); return Object.assign({ ok: true }, o || {}); };
    var sc0 = Object.assign({}, s, priv), cur = ymOf(0);

    /* ---------- מנהל.ת המערכת ---------- */
    if (['preload', 'preloadStatus', 'activationSend'].indexOf(q.action) >= 0) {
      if (q.action === 'preloadStatus') { var st = {}; (q.schools || []).forEach(function (n) { var x = d.schools[n]; st[n] = { state: recState(x), n: x ? Object.keys(x.recs).length : 0 }; }); return { ok: true, status: st }; }
      var t = d.schools[q.school] = d.schools[q.school] || { keys: {}, recovery: null, recs: {} };
      if (q.action === 'activationSend') {
        if (!t.recovery || !t.pending) return { ok: false, error: 'notpending' };
        d.outbox.push({ to: q.to, subj: 'קוד הפעלה · ' + q.school, code: q.code, at: new Date().toISOString() }); return R();
      }
      if (t.recovery && !t.pending) return { ok: false, error: 'active' };
      if (!t.recovery && Object.keys(t.recs).length) return { ok: false, error: 'hasdata' };
      if (!q.recovery || !(q.recs || []).length) return { ok: false, error: 'bad' };
      for (var ri = 0; ri < q.recs.length; ri++) if (!/^stu:[A-Za-z0-9]{2,24}$/.test(q.recs[ri].k) || !q.recs[ri].e || !okCipher(q.recs[ri].e)) return { ok: false, error: 'notencrypted' };
      t.recs = {}; q.recs.forEach(function (x) { t.recs[x.k] = { p: pick(x.p, STU_PLAIN), e: x.e }; });
      t.recovery = q.recovery; t.pending = true; return R({ n: q.recs.length });
    }
    if (q.action === 'natStats') {
      var sc = scope(d, sc0), ym = /^\d{4}-\d{2}$/.test(q.ym || '') ? q.ym : cur;
      return { ok: true, ym: ym, months: [ymOf(2), ymOf(1), cur], schools: allSchools(d).filter(function (n) { return inScope(sc, n); }).map(function (n) { return natRow(d, sc, n, ym); }) };
    }
    if (q.action === 'natBaseline') {
      var scb = scope(d, sc0);
      return { ok: true, rows: d.base ? d.base.rows.filter(function (r) { return inScope(scb, r.school); }).map(function (r) {
        var st2 = scb.mg ? { n: null, out: null, in: null, mg: {} } : r.stats;
        return { school: r.school, semel: r.semel, stats: st2, source: d.base.source, date: d.base.date, at: d.base.at }; }) : [] };
    }
    if (q.action === 'schoolAnon' || q.action === 'schoolEmps') {
      var sca = scope(d, sc0), school = nn(q.school);
      if (!school || !inScope(sca, school)) return { ok: false, error: 'forbidden' };
      var tt = d.schools[school] || { recs: {} }, recs = tt.recs;
      if (q.action === 'schoolEmps') return { ok: true, school: school, emps: Object.keys(recs).filter(function (k) { return /^emp:/.test(k); }).map(function (k) { var o = pick(recs[k].p, EMP_PLAIN); o.id = k.slice(4); return o; }) };
      var yy = /^\d{4}-\d{2}$/.test(q.ym || '') ? q.ym : cur, att = {};
      Object.keys(recs).forEach(function (k) { if (k.indexOf('att:' + yy + ':') === 0) att[k.split(':')[2]] = recs[k].p.a || {}; });
      var stus = Object.keys(recs).filter(function (k) { return /^stu:/.test(k); }).map(function (k) { return recs[k].p; })
        .filter(function (p) { return mgIn(sca, school, p.mg, p.mgc); })
        .sort(function (a, b) { return String(a.created || '').localeCompare(String(b.created || '')) || String(a.id).localeCompare(String(b.id)); });
      return { ok: true, school: school, ym: yy, stu: stus.map(function (p, i) { return { n: i + 1, mg: p.mg || '', mgc: p.mgc || '', cls: p.cls || '', emp: p.emp || '', status: p.status || '', stage: p.stage == null ? null : p.stage, why: p.why || '', a: att[p.id] || {} }; }) };
    }
    if (q.action === 'schoolsAdmin') {
      var all = P;
      return { ok: true, ym: cur, schools: allSchools(d).map(function (n) {
        /* מיילים גלויים של רכז.ת ומנהל.ת פעילים — רק למנהל.ת המערכת (כמו בשרת) */
        var ppl = {}, login = '', full = s.role === 'system';
        KEYED.forEach(function (r) { ppl[r] = { n: 0, pending: 0, masked: [] }; if (full && (r === 'rakaz' || r === 'principal')) ppl[r].email = []; });
        all.forEach(function (p) { if (p.school !== n || !ppl[p.role]) return; if (p.active === 'כן') { ppl[p.role].n++; ppl[p.role].masked.push(mask(p.email)); if (ppl[p.role].email) ppl[p.role].email.push(p.email); } else if (p.active === 'ממתין') ppl[p.role].pending++; if ((p.last || '') > login) login = p.last; });
        var row = natRow(d, { all: true, schools: {} }, n, cur), lr = null;
        if (row.state === 'partial' || row.state === 'done') lr = { ym: cur, state: row.state, upd: today() };
        else if (d.schools[n] && d.schools[n].recovery && !d.schools[n].pending) { var pr = natRow(d, { all: true, schools: {} }, n, ymOf(1)); if (pr.state === 'partial' || pr.state === 'done') lr = { ym: ymOf(1), state: pr.state, upd: '' }; }
        return { school: n, semel: semelOf(n), activation: recState(d.schools[n]), people: ppl, state: row.state, calcAt: row.calcAt, lastReport: lr, lastLogin: login };
      }) };
    }
    if (q.action === 'permsLoad') {
      if (!Array.isArray(q.rows) || !q.rows.length) return { ok: false, error: 'bad' };
      var want = {}, bad = 0, rank = { rakaz: 3, principal: 2, pedco: 1 };
      q.rows.forEach(function (r) {
        r = r || {}; var x = { school: nn(r.school), name: nn(r.name), role: String(r.role || '').trim().toLowerCase(), email: String(r.email || '').trim().toLowerCase(), phone: String(r.phone || '') };
        if (!x.school || ROLES.indexOf(x.role) < 0 || x.role === 'system' || !/^[^@\s,;]+@[^@\s,;]+\.[^@\s,;]+$/.test(x.email)) { bad++; return; }
        var k = pkey(x); if (!want[k] || (rank[x.role] || 0) > (rank[want[k].role] || 0)) want[k] = x;
      });
      var cur2 = {}, added = 0, updated = 0, same = 0, skipped = 0, roles = {};
      P.forEach(function (p) { cur2[pkey(p)] = p; });
      Object.keys(want).forEach(function (k) {
        var x = want[k], had = cur2[k]; roles[x.role] = 1;
        if (!had) { d.perms.push(Object.assign({ active: 'כן' }, x)); added++; return; }
        if (had.active === 'לא') { skipped++; return; }
        if (had.name === x.name && had.role === x.role && had.active === 'כן') { same++; return; }
        d.perms.push(Object.assign({}, had, x, { active: 'כן' })); updated++;
      });
      var missing = P.filter(function (p) { return roles[p.role] && p.active === 'כן' && !want[pkey(p)]; }).map(function (p) { return { school: p.school, role: p.role, masked: mask(p.email) }; });
      return R({ added: added, updated: updated, same: same, skipped: skipped, bad: bad, missing: missing });
    }
    if (q.action === 'baselineLoad') {
      if (d.base) return { ok: false, error: 'exists' };
      if (!Array.isArray(q.rows) || !q.rows.length || !q.source || !/^\d{4}-\d{2}-\d{2}$/.test(q.date || '')) return { ok: false, error: 'bad' };
      var nums = function (o, dep) { var r = {}; Object.keys(o || {}).forEach(function (k) { var v = o[k]; if (typeof v === 'number' && isFinite(v)) r[k] = v; else if (v && typeof v === 'object' && !Array.isArray(v) && dep > 0) r[k] = nums(v, dep - 1); }); return r; };
      d.base = { source: q.source, date: q.date, at: nowS(), rows: q.rows.filter(function (r) { return r && r.school; }).map(function (r) { return { school: nn(r.school), semel: String(r.semel || semelOf(nn(r.school))), stats: nums(r, 2) }; }) };
      return R({ n: d.base.rows.length });
    }
    if (q.action === 'stateRefresh') {
      var n0 = nn(q.school); if (allSchools(d).indexOf(n0) < 0) return { ok: false, error: 'bad' };
      var rr = natRow(d, { all: true, schools: {} }, n0, cur); return { ok: true, school: n0, ym: cur, state: rr.state, calcAt: rr.calcAt, stats: rr.stats };
    }
    if (q.action === 'rakazAdd') {
      var em = String(q.email || '').trim().toLowerCase();
      if (!nn(q.name) || !/^[^@\s,;]+@[^@\s,;]+\.[^@\s,;]+$/.test(em)) return { ok: false, error: 'bad' };
      if (em === s.email) return { ok: false, error: 'self' };
      if (active().some(function (p) { return p.school === s.school && p.role === 'rakaz'; })) return { ok: false, error: 'hasrakaz' };
      var ex = P.filter(function (p) { return p.school === s.school && p.email === em; })[0];
      if (ex && ex.active === 'לא') return { ok: false, error: 'blocked' };
      d.perms.push({ school: s.school, name: nn(q.name), role: 'rakaz', email: em, active: 'כן' }); return R();
    }

    /* ---------- בית הספר (עם מפתח) ---------- */
    var sc1 = d.schools[s.school] = d.schools[s.school] || { keys: {}, recovery: null, recs: {} };
    switch (q.action) {
      case 'me': return { ok: true, me: s };
      case 'logout': delete d.sessions[q.token]; return R();
      case 'keys':
        return { ok: true, initialized: !!sc1.recovery, preloaded: !!(sc1.recovery && sc1.pending), recovery: sc1.recovery, me: sc1.keys[s.email] || null,
          users: active().filter(function (p) { return p.school === s.school && KEYED.indexOf(p.role) >= 0; }).map(function (p) { var k = sc1.keys[p.email]; return { email: p.email, name: p.name, role: p.role, pub: k ? k.pub : null, granted: !!(k && k.wrapped), at: k ? k.at : '' }; }) };
      case 'keysInit':
        if (sc1.recovery) return { ok: false, error: 'already' };
        sc1.keys[s.email] = { pub: q.pub, encPriv: q.encPriv, wrapped: q.wrapped, at: today() }; sc1.recovery = q.recovery; return R();
      case 'keysActivate':
        if (!sc1.recovery || !sc1.pending) return { ok: false, error: 'already' };
        sc1.keys[s.email] = { pub: q.pub, encPriv: q.encPriv, wrapped: q.wrapped, at: today() }; sc1.recovery = q.recovery; sc1.pending = false; return R();
      case 'keysSet': sc1.keys[s.email] = { pub: q.pub, encPriv: q.encPriv, wrapped: q.wrapped || null, at: today() }; return R();
      case 'grant': { var k = sc1.keys[String(q.email).toLowerCase()]; if (!k || !q.wrapped) return { ok: false, error: 'nokeys' }; k.wrapped = q.wrapped; k.at = today(); return R(); }
      case 'load': {
        var y = /^\d{4}-\d{2}$/.test(q.ym || '') ? q.ym : '';
        return { ok: true, me: s, recs: Object.keys(sc1.recs).filter(function (k) { return !y || k.indexOf('att:') !== 0 || k.indexOf('att:' + y + ':') === 0; }).map(function (k) { return { k: k, p: sc1.recs[k].p, e: sc1.recs[k].e }; }),
          remlog: d.remlog.filter(function (r) { return r.school === s.school && (!y || r.m === y); }), remq: Object.keys(d.remq[s.school] || {}) };
      }
      case 'put': {
        if ((q.recs || []).length > 600) return { ok: false, error: 'toomany', max: 600 };
        for (var i = 0; i < (q.recs || []).length; i++) {
          var r = q.recs[i], key = String(r.k || ''), pl = r.p || {}, e = String(r.e || '');
          if (!okCipher(e)) return { ok: false, error: 'notencrypted', key: key };
          if (/^stu:/.test(key)) { if (!e) return { ok: false, error: 'notencrypted', key: key }; pl = pick(pl, STU_PLAIN); if (Array.isArray(pl.docs)) pl.docs = pl.docs.map(function (x) { return { s: x && x.s || 'miss' }; }); }
          else if (/^att:\d{4}-\d{2}:/.test(key)) { pl = pick(pl, ['a', 't', 'ob', 'sb']); e = ''; }
          else if (/^emp:/.test(key)) pl = pick(pl, EMP_PLAIN);
          else if (/^lead:/.test(key)) { if (!e) return { ok: false, error: 'notencrypted', key: key }; pl = pick(pl, ['id']); }
          else if (/^mon:\d{4}-\d{2}$/.test(key)) { pl = pick(pl, MON_PLAIN); e = ''; if (pl.conf === undefined && sc1.recs[key] && sc1.recs[key].p.conf) pl.conf = sc1.recs[key].p.conf; }
          else if (key === 'meta') { pl = pick(pl, ['frames', 'remCfg', 'gantt', 'manual', 'contacts', 'wiz']); e = ''; }
          else return { ok: false, error: 'badkey', key: key };
          if (r.del) delete sc1.recs[key]; else sc1.recs[key] = { p: pl, e: e };
        }
        return R({ n: (q.recs || []).length });
      }
      case 'monConf': {
        var ym2 = String(q.ym || ''); if (!/^\d{4}-\d{2}$/.test(ym2) || ym2 > cur) return { ok: false, error: 'bad' };
        var mk = 'mon:' + ym2, mp = (sc1.recs[mk] && sc1.recs[mk].p) || {};
        if (q.on === false) delete mp.conf; else mp.conf = today();
        sc1.recs[mk] = { p: pick(mp, MON_PLAIN), e: '' }; return R({ ym: ym2, conf: mp.conf || null });
      }
      case 'remqSet': { var m = {}; (q.items || []).forEach(function (x) { if (x.to) m[x.k] = x; }); d.remq[s.school] = m; return R({ n: Object.keys(m).length }); }
      case 'remSend': return { ok: false, error: 'scheduled', message: 'התזכורות יוצאות כל יום ב-16:00' };
      case 'empDb': return { ok: true, rows: root.EMP_DB || [] };
      case 'raw': return { ok: true, raw: sc1.recs };   /* בדיקה בלבד: מה רואה מי שפותח את הגיליון */
    }
    return { ok: false, error: 'badaction' };
  }
  function resetMock() { try { localStorage.removeItem(DBK); localStorage.removeItem(TOKEN_KEY); } catch (e) {} }
  /* בדיקה בלבד: זריעת נתונים בדויים לבתי ספר שעוד אין להם מרחב */
  function mockSeed(n) { if (!MOCK) return 0; var d = db(), k = seedDb(d, n); save(d); return k; }
  /* בדיקה בלבד: מה שהיה יוצא ב-16:00. מוסיף ליומן ומוחק מהתור, כמו בשרת */
  function mockSend() {
    if (!MOCK) return 0; var d = db(), n = 0;
    Object.keys(d.remq).forEach(function (sch) {
      Object.keys(d.remq[sch]).forEach(function (k) { var x = d.remq[sch][k], mm = k.match(/^(\d{4}-\d{2})-(\d{2}):([A-Za-z0-9]+):(teacher|grade)$/); if (!mm) return;
        if (d.remlog.some(function (r) { return r.school === sch && r.m === mm[1] && r.sid === mm[3] && r.d === +mm[2] && r.to === mm[4]; })) return;
        d.outbox.push({ to: x.to, subj: x.subj, html: x.html, at: new Date().toISOString() });
        d.remlog.push({ school: sch, m: mm[1], sid: mm[3], d: +mm[2], to: mm[4], who: '', at: today() }); n++; });
      d.remq[sch] = {};
    });
    save(d); return n;
  }
  if (MOCK && /[?&]mock=seed\b/.test(location.search)) { try { var d0 = db(); if (!d0.seeded) { seedDb(d0, 12); save(d0); } } catch (e) {} }

  root.API = { call: call, session: session, setSession: setSession, MOCK: MOCK, resetMock: resetMock, mockSeed: mockSeed, mockSend: mockSend };
})(window);
