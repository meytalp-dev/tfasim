/* ===================================================================
   API — מערכת רכזי החניכות v2 (1.11.26)
   EXEC ריק = שרת מדומה בדפדפן (localStorage), לבדיקה בלבד. אותן פעולות ואותם שדות כמו gas/קוד.js.
   בשני המצבים השרת מקבל רק מה שכבר הוצפן בדפדפן, ושדות גלויים מוגדרים.
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
  function db() { var d; try { d = JSON.parse(localStorage.getItem(DBK) || 'null'); } catch (e) { d = null; } return d || { perms: [], schools: {}, codes: {}, sessions: {}, remq: {}, remlog: [], outbox: [] }; }
  function save(d) { try { localStorage.setItem(DBK, JSON.stringify(d)); } catch (e) { throw new Error('המקום בדפדפן נגמר (מצב בדיקה)'); } }
  function hash(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
  function mask(e) { var p = e.split('@'); return p[0][0] + '•••••@' + p[1][0] + '•••.' + p[1].split('.').pop(); }
  function pid(p) { return 'P' + Math.abs(hash(p.school + '|' + p.email)).toString(36); }
  /* בבדיקה: לכל בית ספר רכז.ת ומנהל.ת בדויים, מאושרים. בשרת האמיתי — לשונית "הרשאות" */
  function perms(d) {
    var base = (root.SCHOOLS || []).slice(0, 64).reduce(function (a, x) {
      var slug = 's' + Math.abs(hash(x.name)).toString(36);   /* אותיות קטנות — כמו בשרת האמיתי */
      a.push({ school: x.name, name: 'רכז.ת החניכות (בדיקה)', role: 'rakaz', email: 'rakaz.' + slug + '@school.example', active: 'כן' });
      a.push({ school: x.name, name: 'מנהל.ת בית הספר (בדיקה)', role: 'principal', email: 'menahel.' + slug + '@school.example', active: 'כן' });
      return a; }, []);
    base.push({ school: 'המרחב הפדגוגי', name: 'המרחב הפדגוגי', role: 'system', email: 'merhav@pedagogiamh.co.il', active: 'כן' });
    return base.concat(d.perms);
  }
  function today() { return new Date(Date.now() + 2 * 36e5).toISOString().slice(0, 10); }
  function okCipher(v) { return v === '' || /^v1\.[A-Za-z0-9+/=]+\.[A-Za-z0-9+/=]+$/.test(String(v || '')); }
  var STU_PLAIN = ['id', 'mg', 'cls', 'track', 'emp', 'days', 'dayHist', 'status', 'statusSrc', 'start', 'docs', 'stage', 'stageManual', 'why', 'formsMeta', 'created'];
  var EMP_PLAIN = ['name', 'mentor', 'manager', 'phone', 'mail', 'addr', 'slots', 'slotsRaw', 'mg', 'mas', 'masNotes', 'recheck', 'visit', 'talk', 'contact', 'lead', 'status', 'studsTxt', 'kind', 'client', 'hours', 'min'];
  function pick(o, keys) { var r = {}; keys.forEach(function (k) { if (o && o[k] !== undefined) r[k] = o[k]; }); return r; }

  function mock(q) {
    var d = db(), P = perms(d);
    var active = function () { return P.filter(function (p) { return p.active === 'כן'; }); };
    if (q.action === 'people') return { ok: true, people: active().filter(function (p) { return p.school === q.school; }).map(function (p) { return { pid: pid(p), name: p.name, role: p.role, masked: mask(p.email) }; }) };
    if (q.action === 'register') {
      if (!q.school || !q.name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(q.email || '')) return { ok: false, error: 'bad' };
      d.perms.push({ school: q.school, name: q.name, role: q.role === 'principal' ? 'principal' : 'rakaz', email: String(q.email).toLowerCase(), active: 'ממתין' }); save(d); return { ok: true };
    }
    if (q.action === 'codeSend') {
      var p = active().filter(function (x) { return x.school === q.school && pid(x) === q.pid; })[0];
      if (!p) return { ok: false, error: 'noperson' };
      var code = String(100000 + Math.floor(Math.random() * 900000));
      d.codes[q.pid] = { code: code, school: p.school, email: p.email, tries: 0, until: Date.now() + 20 * 6e4 }; save(d);
      return { ok: true, masked: mask(p.email), demoCode: code };   /* demoCode רק בבדיקה. בשרת האמיתי הקוד יוצא במייל */
    }
    if (q.action === 'codeVerify') {
      var c = d.codes[q.pid];
      if (!c || c.until < Date.now()) return { ok: false, error: 'expired' };
      if (++c.tries > 5) { delete d.codes[q.pid]; save(d); return { ok: false, error: 'tries' }; }
      if (String(q.code) !== c.code) { save(d); return { ok: false, error: 'badcode' }; }
      var pp = active().filter(function (x) { return x.school === c.school && x.email === c.email; })[0];
      var tok = 'T' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      d.sessions[tok] = { email: pp.email, name: pp.name, role: pp.role, school: pp.school };
      delete d.codes[q.pid]; save(d);
      return { ok: true, token: tok, me: d.sessions[tok] };
    }
    var s = d.sessions[q.token];
    if (!s || !active().some(function (x) { return x.email === s.email && x.school === s.school; })) return { ok: false, error: 'badsession' };
    if (['preload', 'preloadStatus', 'activationSend'].indexOf(q.action) >= 0) {
      if (s.role !== 'system') return { ok: false, error: 'forbidden' };
      if (q.action === 'preloadStatus') { var st = {}; (q.schools || []).forEach(function (n) { var x = d.schools[n]; st[n] = { state: !x || !x.recovery ? 'none' : x.pending ? 'pending' : 'active', n: x ? Object.keys(x.recs).length : 0 }; }); return { ok: true, status: st }; }
      var t = d.schools[q.school] = d.schools[q.school] || { keys: {}, recovery: null, recs: {} };
      if (q.action === 'activationSend') {
        if (!t.recovery || !t.pending) return { ok: false, error: 'notpending' };
        d.outbox.push({ to: q.to, subj: 'קוד הפעלה · ' + q.school, code: q.code, at: new Date().toISOString() }); save(d); return { ok: true };
      }
      if (t.recovery && !t.pending) return { ok: false, error: 'active' };
      if (!t.recovery && Object.keys(t.recs).length) return { ok: false, error: 'hasdata' };
      if (!q.recovery || !(q.recs || []).length) return { ok: false, error: 'bad' };
      for (var ri = 0; ri < q.recs.length; ri++) if (!/^stu:[A-Za-z0-9]{2,24}$/.test(q.recs[ri].k) || !q.recs[ri].e || !okCipher(q.recs[ri].e)) return { ok: false, error: 'notencrypted' };
      t.recs = {}; q.recs.forEach(function (x) { t.recs[x.k] = { p: pick(x.p, STU_PLAIN), e: x.e }; });
      t.recovery = q.recovery; t.pending = true; save(d); return { ok: true, n: q.recs.length };
    }
    var sc = d.schools[s.school] = d.schools[s.school] || { keys: {}, recovery: null, recs: {} };
    var edit = s.role === 'rakaz', R = function (o) { save(d); return Object.assign({ ok: true }, o || {}); };
    if (['keysInit', 'keysActivate', 'grant', 'put', 'remqSet', 'remSend'].indexOf(q.action) >= 0 && !edit) return { ok: false, error: 'readonly' };
    switch (q.action) {
      case 'me': return { ok: true, me: s };
      case 'logout': delete d.sessions[q.token]; return R();
      case 'keys':
        return { ok: true, initialized: !!sc.recovery, preloaded: !!(sc.recovery && sc.pending), recovery: sc.recovery, me: sc.keys[s.email] || null,
          users: active().filter(function (p) { return p.school === s.school; }).map(function (p) { var k = sc.keys[p.email]; return { email: p.email, name: p.name, role: p.role, pub: k ? k.pub : null, granted: !!(k && k.wrapped), at: k ? k.at : '' }; }) };
      case 'keysInit':
        if (sc.recovery) return { ok: false, error: 'already' };
        sc.keys[s.email] = { pub: q.pub, encPriv: q.encPriv, wrapped: q.wrapped, at: today() }; sc.recovery = q.recovery; return R();
      case 'keysActivate':
        if (!sc.recovery || !sc.pending) return { ok: false, error: 'already' };
        sc.keys[s.email] = { pub: q.pub, encPriv: q.encPriv, wrapped: q.wrapped, at: today() }; sc.recovery = q.recovery; sc.pending = false; return R();
      case 'keysSet': sc.keys[s.email] = { pub: q.pub, encPriv: q.encPriv, wrapped: q.wrapped || null, at: today() }; return R();
      case 'grant': { var k = sc.keys[String(q.email).toLowerCase()]; if (!k || !q.wrapped) return { ok: false, error: 'nokeys' }; k.wrapped = q.wrapped; k.at = today(); return R(); }
      case 'load':
        return { ok: true, me: s, recs: Object.keys(sc.recs).map(function (k) { return { k: k, p: sc.recs[k].p, e: sc.recs[k].e }; }),
          remlog: d.remlog.filter(function (r) { return r.school === s.school; }), remq: Object.keys(d.remq[s.school] || {}) };
      case 'put': {
        for (var i = 0; i < (q.recs || []).length; i++) {
          var r = q.recs[i], key = String(r.k || ''), pl = r.p || {}, e = String(r.e || '');
          if (!okCipher(e)) return { ok: false, error: 'notencrypted', key: key };
          if (/^stu:/.test(key)) { if (!e) return { ok: false, error: 'notencrypted', key: key }; pl = pick(pl, STU_PLAIN); if (Array.isArray(pl.docs)) pl.docs = pl.docs.map(function (x) { return { s: x && x.s || 'miss' }; }); }
          else if (/^att:\d{4}-\d{2}:/.test(key)) { pl = pick(pl, ['a', 't', 'ob', 'sb']); e = ''; }
          else if (/^emp:/.test(key)) pl = pick(pl, EMP_PLAIN);
          else if (/^mon:\d{4}-\d{2}$/.test(key)) { pl = pick(pl, ['sub', 'off']); e = ''; }
          else if (key === 'meta') { pl = pick(pl, ['frames', 'remCfg', 'gantt', 'manual', 'contacts']); e = ''; }
          else return { ok: false, error: 'badkey', key: key };
          if (r.del) delete sc.recs[key]; else sc.recs[key] = { p: pl, e: e };
        }
        return R({ n: (q.recs || []).length });
      }
      case 'remqSet': { var m = {}; (q.items || []).forEach(function (x) { if (x.to) m[x.k] = x; }); d.remq[s.school] = m; return R({ n: Object.keys(m).length }); }
      case 'remSend': {
        var qq = d.remq[s.school] || {}, n = 0;
        Object.keys(qq).forEach(function (k) { var x = qq[k], mm = k.match(/^(\d{4}-\d{2})-(\d{2}):([A-Za-z0-9]+):(teacher|grade)$/); if (!mm) return;
          d.outbox.push({ to: x.to, subj: x.subj, html: x.html, at: new Date().toISOString() });
          d.remlog.push({ school: s.school, m: mm[1], sid: mm[3], d: +mm[2], to: mm[4], who: '', at: today() }); n++; });
        d.remq[s.school] = {}; return R({ sent: n });
      }
      case 'raw': return { ok: true, raw: sc.recs };   /* בדיקה בלבד: מה רואה מי שפותח את הגיליון */
    }
    return { ok: false, error: 'badaction' };
  }
  function resetMock() { try { localStorage.removeItem(DBK); localStorage.removeItem(TOKEN_KEY); } catch (e) {} }

  root.API = { call: call, session: session, setSession: setSession, MOCK: MOCK, resetMock: resetMock };
})(window);
