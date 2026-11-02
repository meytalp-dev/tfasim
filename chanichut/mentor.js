/* ===================================================================
   הקישור למנטור.ית — הצד של הרכז.ת (e4, 3.11.26). נטען ב-index.html אחרי crypto.js ו-api.js.
   המפרט: sochnim/mentor-api.md.
   window.Mentor = { setKey(schoolKey), createLink(emp, students) → url, revoke(emp) → n, links() → [{emp, url, created}], pull(ym) → { marks, fb } }

   לכל קישור מפתח AES משלו. הוא נכנס לחלק שאחרי # בכתובת (הדפדפן לא שולח אותו לשרת), ונשמר בשרת רק עטוף
   במפתח בית הספר (wrap), כדי שהרכז.ת תוכל להציג שוב את הקישור ולפענח את תשובות המשוב.
   רשימת השמות (roster) מוצפנת במפתח הקישור. השרת רואה רק v1.…
   pull מחזיר נתונים בלבד. הסימון ב-ATT ובתיק — ב-app.js (סוכן school).
   =================================================================== */
(function (root) {
  'use strict';
  var KEY = null;
  function setKey(k) { KEY = k || null; }
  function need() { if (!KEY) throw new Error('nokey'); }
  function base() { return location.href.replace(/[?#].*$/, '').replace(/[^/]*$/, '') + 'mentor.html'; }
  function url(k, b64) { return base() + '?k=' + k + '#' + b64; }
  async function keyOf(wrap) { var o = await CK.decJSON(KEY, wrap); return o && o.k ? { b64: o.k, key: await CK.keyFromB64u(o.k) } : null; }

  /* students: [{ id, name, cls, mg }] מפוענחים מהתיק */
  async function createLink(emp, students) {
    need();
    var list = (students || []).filter(function (s) { return s && s.id; }).map(function (s) { return { id: String(s.id), name: String(s.name || ''), cls: String(s.cls || ''), mg: String(s.mg || '') }; });
    if (!emp || !list.length) throw new Error('bad');
    var linkKey = await CK.newSchoolKey(), b64 = await CK.keyToB64u(linkKey), k = CK.randToken(18);
    var roster = await CK.encJSON(linkKey, list), wrap = await CK.encJSON(KEY, { k: b64 });
    var r = await API.call('mentorCreate', { emp: String(emp), k: k, ids: list.map(function (s) { return s.id; }), roster: roster, wrap: wrap });
    if (!r.ok) throw new Error(r.error || 'mentorCreate');
    return url(k, b64);
  }
  async function revoke(emp) {
    var r = await API.call('mentorRevoke', { emp: String(emp || '') });
    if (!r.ok) throw new Error(r.error || 'mentorRevoke');
    return r.n || 0;
  }
  /* הקישורים הפעילים, עם הכתובת המלאה (המפתח משוחזר מ-wrap) */
  async function links() {
    need();
    var r = await API.call('mentorPull', {});
    if (!r.ok) throw new Error(r.error || 'mentorPull');
    var out = [];
    for (var i = 0; i < (r.links || []).length; i++) {
      var L = r.links[i]; if (L.revoked) continue;
      try { var w = await keyOf(L.wrap); if (w) out.push({ emp: L.emp, k: L.k, url: url(L.k, w.b64), created: L.created, ids: L.ids || [] }); } catch (e) {}
    }
    return out;
  }
  /* מה שהמנטורים סימנו החודש + המשובים (התשובות הפתוחות מפוענחות במפתח הקישור). מחזיר נתונים בלבד */
  async function pull(ym) {
    need();
    var r = await API.call('mentorPull', ym ? { ym: ym } : {});
    if (!r.ok) throw new Error(r.error || 'mentorPull');
    var keys = {};
    for (var i = 0; i < (r.links || []).length; i++) { var L = r.links[i]; try { var w = await keyOf(L.wrap); if (w) keys[L.k] = w.key; } catch (e) {} }
    var fb = [];
    for (var j = 0; j < (r.fb || []).length; j++) {
      var f = r.fb[j], open = null;
      if (f.e && keys[f.k]) { try { open = await CK.decJSON(keys[f.k], f.e); } catch (e) { open = null; } }
      fb.push({ sid: f.sid, period: f.period, scores: f.scores || [], at: f.at || '', emp: f.emp, open: open || {} });
    }
    return { ym: r.ym, marks: (r.marks || []).map(function (m) { return { sid: m.sid, d: +m.d, v: m.v, emp: m.emp, at: m.at || '', ym: m.ym }; }), fb: fb };
  }
  root.Mentor = { setKey: setKey, createLink: createLink, revoke: revoke, links: links, pull: pull };
})(window);
