/* ===================================================================
   הצפנה בדפדפן — מערכת רכזי החניכות (23.10.26)

   מיטל: "השמות של התלמידים מוצפנים ולא נראים לעין שלי, רק לעין של בית הספר".
   לכן כל פרט מזהה של תלמיד.ה מוצפן כאן, בדפדפן, לפני שהוא יוצא מהמחשב.
   השרת (Apps Script בחשבון merhav) והגיליון רואים רק תווים מוצפנים.

   המפתחות:
   - מפתח בית הספר (AES-GCM 256) — אחד לכל בית ספר. מצפין שמות, טלפונים, הערות, יומן שיחות וקבצים.
   - לכל משתמש.ת זוג מפתחות ECDH P-256. המפתח הפרטי נשמר בשרת רק מוצפן בסיסמה האישית (PBKDF2).
   - מפתח בית הספר נשמר בשרת "עטוף" בנפרד לכל משתמש.ת מורשה (ECDH + AES-GCM),
     ועוד עטיפה אחת בקוד השחזור המודפס.
   - אף סיסמה ואף מפתח לא נשלחים לשרת בגלוי.
   =================================================================== */
(function (root) {
  'use strict';
  var S = (root.crypto || {}).subtle;
  var TE = new TextEncoder(), TD = new TextDecoder();
  var PASS_ITER = 310000;      /* PBKDF2 לסיסמה אישית */
  var REC_ITER = 100000;       /* קוד השחזור ארוך ואקראי, מספיק פחות */
  var EC = { name: 'ECDH', namedCurve: 'P-256' };

  function b64(buf) {
    var b = new Uint8Array(buf), s = '';
    for (var i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
    return btoa(s);
  }
  function unb64(s) {
    var bin = atob(s), b = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
    return b;
  }
  function rand(n) { return root.crypto.getRandomValues(new Uint8Array(n)); }

  async function aesEnc(key, bytes) {
    var iv = rand(12);
    var ct = await S.encrypt({ name: 'AES-GCM', iv: iv }, key, bytes);
    return { iv: b64(iv), ct: b64(ct) };
  }
  async function aesDec(key, box) {
    return new Uint8Array(await S.decrypt({ name: 'AES-GCM', iv: unb64(box.iv) }, key, unb64(box.ct)));
  }
  async function passKey(pass, salt, iter) {
    var base = await S.importKey('raw', TE.encode(pass), 'PBKDF2', false, ['deriveKey']);
    return S.deriveKey({ name: 'PBKDF2', salt: salt, iterations: iter, hash: 'SHA-256' }, base,
      { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  async function importSchoolKey(raw, extractable) {
    return S.importKey('raw', raw, { name: 'AES-GCM' }, !!extractable, ['encrypt', 'decrypt']);
  }

  /* ---------- מפתח בית הספר ---------- */
  async function newSchoolKey() {
    return S.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  }

  /* ---------- מפתחות אישיים ---------- */
  /* מחזיר את מה שנשמר בשרת (pub, encPriv) ואת המפתח הפרטי לשימוש בסשן */
  async function newUserKeys(pass) {
    var kp = await S.generateKey(EC, true, ['deriveKey']);
    var pub = await S.exportKey('jwk', kp.publicKey);
    var pkcs8 = await S.exportKey('pkcs8', kp.privateKey);
    var salt = rand(16);
    var box = await aesEnc(await passKey(pass, salt, PASS_ITER), new Uint8Array(pkcs8));
    return { pub: pubOnly(pub), encPriv: { salt: b64(salt), iter: PASS_ITER, iv: box.iv, ct: box.ct }, priv: kp.privateKey };
  }
  function pubOnly(j) { return { kty: j.kty, crv: j.crv, x: j.x, y: j.y }; }
  /* סיסמה שגויה → זורק שגיאה (AES-GCM מאמת) */
  async function unlockPriv(encPriv, pass) {
    var k = await passKey(pass, unb64(encPriv.salt), encPriv.iter || PASS_ITER);
    var pkcs8 = await aesDec(k, encPriv);
    return S.importKey('pkcs8', pkcs8, EC, false, ['deriveKey']);
  }

  /* ---------- עטיפת מפתח בית הספר למשתמש.ת ---------- */
  async function wrapFor(pubJwk, schoolKey) {
    var pub = await S.importKey('jwk', pubJwk, EC, false, []);
    var eph = await S.generateKey(EC, true, ['deriveKey']);
    var k = await S.deriveKey({ name: 'ECDH', public: pub }, eph.privateKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
    var raw = new Uint8Array(await S.exportKey('raw', schoolKey));
    var box = await aesEnc(k, raw);
    return { eph: pubOnly(await S.exportKey('jwk', eph.publicKey)), iv: box.iv, ct: box.ct };
  }
  /* extractable נדרש רק לרכז.ת — כדי לעטוף את המפתח למנהל.ת או לקוד שחזור חדש */
  async function unwrap(priv, w, extractable) {
    var eph = await S.importKey('jwk', w.eph, EC, false, []);
    var k = await S.deriveKey({ name: 'ECDH', public: eph }, priv, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    return importSchoolKey(await aesDec(k, w), extractable);
  }

  /* ---------- קוד שחזור ---------- */
  var ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   /* בלי O/0/I/1 — קל להקליד מדף מודפס */
  function newRecoveryCode() {
    var b = rand(20), out = '';
    for (var i = 0; i < 20; i++) out += ALPHA[b[i] % 32];
    return out.match(/.{4}/g).join('-');
  }
  function normRecovery(code) { return String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }
  async function wrapRecovery(code, schoolKey) {
    var salt = rand(16);
    var raw = new Uint8Array(await S.exportKey('raw', schoolKey));
    var box = await aesEnc(await passKey(normRecovery(code), salt, REC_ITER), raw);
    return { salt: b64(salt), iter: REC_ITER, iv: box.iv, ct: box.ct };
  }
  async function unwrapRecovery(code, w) {
    var raw = await aesDec(await passKey(normRecovery(code), unb64(w.salt), w.iter || REC_ITER), w);
    return importSchoolKey(raw, true);
  }

  /* ---------- טביעת אצבע של מפתח ציבורי ----------
     מנהל.ת מקריא.ה לרכז.ת את 8 התווים לפני שהרכז.ת מאשר.ת גישה.
     כך גם מי ששולט בשרת לא יכול להחליף בשקט את המפתח הציבורי בשלו. */
  async function fingerprint(pubJwk) {
    var h = new Uint8Array(await S.digest('SHA-256', TE.encode(pubJwk.crv + '|' + pubJwk.x + '|' + pubJwk.y)));
    var s = '';
    for (var i = 0; i < 4; i++) s += ('0' + h[i].toString(16)).slice(-2);
    return (s.slice(0, 4) + '-' + s.slice(4)).toUpperCase();
  }

  /* ---------- שדות מוצפנים ---------- */
  /* "v1." + iv + "." + ct — מחרוזת אחת שנשמרת בתא בגיליון */
  async function encJSON(key, obj) {
    var box = await aesEnc(key, TE.encode(JSON.stringify(obj)));
    return 'v1.' + box.iv + '.' + box.ct;
  }
  async function decJSON(key, s) {
    if (!s) return null;
    var p = String(s).split('.');
    if (p[0] !== 'v1' || p.length !== 3) throw new Error('badcipher');
    return JSON.parse(TD.decode(await aesDec(key, { iv: p[1], ct: p[2] })));
  }
  async function encBytes(key, bytes) { var box = await aesEnc(key, bytes); return 'v1.' + box.iv + '.' + box.ct; }
  async function decBytes(key, s) { var p = String(s).split('.'); return aesDec(key, { iv: p[1], ct: p[2] }); }

  /* ---------- מפתח קישור למנטור (24.10.26) ----------
     מפתח AES נפרד לכל קישור. הוא נכנס לחלק של הקישור שאחרי # — את החלק הזה הדפדפן לא שולח לשרת אף פעם.
     כך המנטור רואה את שמות התלמידים שאצלו, והשרת עדיין לא. */
  async function keyToB64u(key) { return b64(await S.exportKey('raw', key)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  async function keyFromB64u(s) {
    s = String(s || '').replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '=';
    return importSchoolKey(unb64(s), false);
  }
  function randToken(n) { var b = rand(n || 18); return b64(b).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }

  /* ---------- זכירה במכשיר (לא חובה) ----------
     המפתח נשמר ב-IndexedDB כאובייקט שאי אפשר לייצא (extractable=false):
     הדף יכול להשתמש בו, אבל אי אפשר "להעתיק" אותו החוצה. נמחק ביציאה. */
  var DB = 'chanichut-keys', ST = 'k';
  function idb() {
    return new Promise(function (res, rej) {
      var r = indexedDB.open(DB, 1);
      r.onupgradeneeded = function () { r.result.createObjectStore(ST); };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
    });
  }
  async function remember(id, schoolKey, days) {
    try {
      var raw = await S.exportKey('raw', schoolKey);
      var k = await importSchoolKey(raw, false);
      var db = await idb();
      await new Promise(function (res, rej) {
        var t = db.transaction(ST, 'readwrite');
        t.objectStore(ST).put({ key: k, until: Date.now() + days * 864e5 }, id);
        t.oncomplete = res; t.onerror = function () { rej(t.error); };
      });
      db.close();
      return true;
    } catch (e) { return false; }
  }
  async function recall(id) {
    try {
      var db = await idb();
      var v = await new Promise(function (res, rej) {
        var r = db.transaction(ST).objectStore(ST).get(id);
        r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); };
      });
      db.close();
      if (!v || v.until < Date.now()) { if (v) forget(id); return null; }
      return v.key;
    } catch (e) { return null; }
  }
  async function forget(id) {
    try {
      var db = await idb();
      await new Promise(function (res) { var t = db.transaction(ST, 'readwrite'); t.objectStore(ST).delete(id); t.oncomplete = res; t.onerror = res; });
      db.close();
    } catch (e) {}
  }

  root.CK = {
    ok: !!S, b64: b64, unb64: unb64,
    newSchoolKey: newSchoolKey, newUserKeys: newUserKeys, unlockPriv: unlockPriv,
    wrapFor: wrapFor, unwrap: unwrap,
    newRecoveryCode: newRecoveryCode, wrapRecovery: wrapRecovery, unwrapRecovery: unwrapRecovery,
    fingerprint: fingerprint, encJSON: encJSON, decJSON: decJSON, encBytes: encBytes, decBytes: decBytes,
    remember: remember, recall: recall, forget: forget, keyToB64u: keyToB64u, keyFromB64u: keyFromB64u, randToken: randToken
  };
})(typeof window !== 'undefined' ? window : globalThis);
