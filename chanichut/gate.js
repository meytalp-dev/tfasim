/* ===================================================================
   הכניסה — מערכת רכזי החניכות v2 (1.11.26)
   1. בית ספר + מי נכנס.ת → קוד במייל (כמו במערכת הישנה).
   2. ההצפנה (crypto.js): סיסמה אישית פותחת את המפתח האישי, וממנו את מפתח בית הספר.
      רכז.ת ראשונ.ה יוצר.ת את מפתח בית הספר ומקבל.ת קוד שחזור להדפסה.
      מנהל.ת או רכז.ת נוספ.ת: יוצר.ת סיסמה ומחכה שהרכז.ת יאשר.ו אחרי השוואת קוד אימות.
   3. Store.load → startApp.
   תפקידים בלי מפתח (system, staff, ped, pro, net): אחרי הקוד נכנסים ישר למבט (startMabat), בלי סיסמה ובלי נתוני בית ספר.
   תפקיד שלא ברשימה נחסם (2.11.26).
   =================================================================== */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const STEPS = ['gLogin', 'gReg', 'gCodeS', 'gPass', 'gInit', 'gAct', 'gNew', 'gWait', 'gRec', 'gRakaz', 'gSoon', 'gBusy'];
  const show = id => { STEPS.forEach(x => { const el = $(x); if (el) el.hidden = x !== id; }); const f = $(id) && $(id).querySelector('input:not([type=checkbox]),select'); if (f && matchMedia('(pointer:fine)').matches) f.focus(); };
  const msg = (id, t, bad) => { const el = $(id); if (el) { el.textContent = t || ''; el.className = 'gate-msg' + (bad ? ' bad' : ''); } };
  const busy = (b, on, t) => { b.disabled = on; if (t) b.dataset.t = b.dataset.t || b.innerHTML; b.innerHTML = on && t ? t : (b.dataset.t || b.innerHTML); };
  const ERR = { noperson: 'לא נמצא.ה ברשימת המורשים של בית הספר', wait: 'קוד כבר נשלח. אפשר לבקש שוב בעוד דקה', cap: 'הגענו לתקרה היומית. אפשר לנסות מחר', expired: 'הקוד פג. צריך לשלוח קוד חדש', tries: 'יותר מדי ניסיונות. צריך לשלוח קוד חדש', badcode: 'הקוד לא נכון', badsession: 'החיבור פג. צריך להיכנס שוב', already: 'בית הספר כבר הוגדר. צריך להיכנס מחדש', bad: 'חסרים פרטים', forbidden: 'אין הרשאה לפעולה הזו', hasrakaz: 'בבית הספר כבר יש רכז.ת חניכות פעיל.ה', exists: 'המייל הזה כבר ברשימה של בית הספר', badrole: 'התפקיד הזה לא מוכר במערכת, ולכן אין כניסה' };
  const err = r => ERR[r && r.error] || 'משהו לא עבד (' + ((r && r.error) || 'רשת') + '). כדאי לנסות שוב';
  const BACK_KEY = 'chanichut2-back';
  let SENT_PID = '', ME = null, KEYS = null, SKEY = null, EXTRACT = false, PRIV = null;

  /* ---------- 1. בית ספר ומי נכנס.ת ---------- */
  /* רשימה סגורה של תפקידים (מסמך ההגדרות, סעיף 2). שלושת הראשונים עם מפתח בית ספר */
  const ROLE = { rakaz: 'רכז.ת החניכות', principal: 'מנהל.ת בית הספר', pedco: 'רכז.ת פדגוגי.ת', system: 'מנהל.ת המערכת', staff: 'מטה', ped: 'מפקח.ת פדגוגי.ת', pro: 'מפקח.ת מקצועי.ת', net: 'מנהל.ת רשת' };
  const ROLES = Object.keys(ROLE), KEYED = ['rakaz', 'principal', 'pedco'];
  const noKey = me => !KEYED.includes(me.role);
  const SCH = (window.SCHOOLS || []).map(x => x.name).sort((a, b) => a.localeCompare(b, 'he'));
  const NETS = [...new Set((window.SCHOOLS || []).map(x => x.net).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'he')).map(n => 'רשת · ' + n);
  const SYS = 'המרחב הפדגוגי', TOP = ['פיקוח', 'מטה'];
  const opts = l => l.map(n => `<option>${esc(n)}</option>`).join('');
  $('gSchool').innerHTML = '<option value="">בחירה: בית ספר, פיקוח, מטה או רשת</option>'
    + `<optgroup label="פיקוח ומטה">${opts(TOP)}</optgroup><optgroup label="רשתות">${opts(NETS)}</optgroup><optgroup label="${SYS}">${opts([SYS])}</optgroup><optgroup label="בתי הספר">${opts(SCH)}</optgroup>`;
  $('rSchool').innerHTML = '<option value="">בחירה מתוך 64 בתי הספר</option>' + opts(SCH);
  const PLACES = TOP.concat(NETS, [SYS], SCH);
  try { const last = localStorage.getItem('chanichut2-school'); if (last && PLACES.includes(last)) $('gSchool').value = last; } catch (e) {}
  let peopleFor = '';
  async function loadPeople() {
    const school = $('gSchool').value; if (school === peopleFor) return; peopleFor = school;
    $('gWho').innerHTML = ''; $('gSend').disabled = true;
    if (!school) return;
    $('gWho').innerHTML = '<option>טוען…</option>';
    const r = await API.call('people', { school });
    if (school !== peopleFor) return;   /* בינתיים נבחר מקום אחר */
    if (!r.ok) { $('gWho').innerHTML = ''; peopleFor = ''; return msg('mLogin', err(r), true); }
    /* בלי שם: תפקיד ומייל ממוסך. תפקיד לא מוכר לא מוצג */
    const L = r.people.filter(p => ROLE[p.role]).sort((a, b) => ROLES.indexOf(a.role) - ROLES.indexOf(b.role));
    $('gWho').innerHTML = L.map(p => `<option value="${esc(p.pid)}">${ROLE[p.role]} · ⁦${esc(p.masked)}⁩</option>`).join('') || '<option value="">אין עדיין משתמשים מאושרים</option>';
    $('gSend').disabled = !L.length;
    msg('mLogin', L.length ? '' : 'אין כאן עדיין משתמשים מאושרים. אפשר לפנות דרך "לא מצאתי את עצמי"');
  }
  $('gSchool').onchange = () => { try { localStorage.setItem('chanichut2-school', $('gSchool').value); } catch (e) {} msg('mLogin'); loadPeople(); };
  $('gSend').onclick = async () => {
    const b = $('gSend'); busy(b, true, 'שולח…');
    const pid = $('gWho').value;
    const r = await API.call('codeSend', { school: $('gSchool').value, pid });
    busy(b, false);
    if (!r.ok) return msg('mLogin', err(r), true);
    SENT_PID = pid;   /* האימות מול מי שקיבל.ה את הקוד, גם אם הרשימה נטענה מחדש בינתיים */
    $('gSentTo').textContent = r.masked; $('gCode').value = '';
    msg('mCode', r.demoCode ? 'מצב בדיקה · הקוד: ' + r.demoCode : '');
    show('gCodeS');
  };
  $('gToReg').onclick = () => { $('rSchool').value = SCH.includes($('gSchool').value) ? $('gSchool').value : ''; show('gReg'); };
  $('gToLogin').onclick = () => show('gLogin');
  $('gBack').onclick = () => show('gLogin');
  $('rSend').onclick = async () => {
    const v = { school: $('rSchool').value, name: $('rName').value.trim(), role: $('rRole').value, email: $('rMail').value.trim(), phone: $('rPhone').value.trim() };
    if (!v.school || !v.name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email)) return msg('mReg', 'צריך בית ספר, שם ומייל תקין', true);
    const b = $('rSend'); busy(b, true, 'שולח…'); const r = await API.call('register', v); busy(b, false);
    if (!r.ok) return msg('mReg', err(r), true);
    msg('mReg', 'הבקשה נקלטה. אחרי אישור של המרחב הפדגוגי אפשר להיכנס עם קוד למייל');
    b.disabled = true;
  };

  /* ---------- 2. הקוד מהמייל ---------- */
  $('gEnter').onclick = async () => {
    const code = $('gCode').value.replace(/\D/g, ''); if (code.length !== 6) return msg('mCode', 'הקוד בן 6 ספרות', true);
    const b = $('gEnter'); busy(b, true, 'בודק…');
    const r = await API.call('codeVerify', { pid: SENT_PID, code });
    busy(b, false);
    if (!r.ok) return msg('mCode', err(r), true);
    API.setSession({ token: r.token, me: r.me });
    afterLogin();
  };
  $('gCode').onkeydown = e => { if (e.key === 'Enter') $('gEnter').click(); };

  /* ---------- 3. ההצפנה ---------- */
  const rid = () => ME.school + '|' + ME.email;
  async function afterLogin() {
    ME = API.session().me;
    if (!ME || !ROLES.includes(ME.role)) { ME = null; try { await API.call('logout'); } catch (e) {} API.setSession(null); show('gLogin'); return msg('mLogin', ERR.badrole, true); }
    if (noKey(ME)) return mabat();
    show('gBusy');
    const saved = await CK.recall(rid());
    if (saved) { SKEY = saved; EXTRACT = false; return enter(); }
    const r = await API.call('keys');
    if (!r.ok) { if (r.error === 'badsession') return logout(); show('gLogin'); return msg('mLogin', err(r), true); }
    KEYS = r;
    $('gHello').textContent = 'שלום' + (ME.name ? ' ' + ME.name.split(' ')[0] : '');
    if (r.me && r.me.wrapped) return show('gPass');
    /* מנהל.ת בבית ספר בלי רכז.ת פעיל.ה: מוסיפ.ה את הרכז.ת, והקוד הולך רק למייל שהוזן */
    if (ME.role === 'principal' && !ADDED) { const p = await API.call('people', { school: ME.school }); if (p.ok && !p.people.some(x => x.role === 'rakaz')) return show('gRakaz'); }
    route();
  }
  let ADDED = false;
  $('kAdd').onclick = async () => {
    const v = { name: $('kName').value.trim(), email: $('kMail').value.trim() };
    if (!v.name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email)) return msg('mRakaz', 'צריך שם ומייל תקין', true);
    const b = $('kAdd'); busy(b, true, 'מוסיף…'); const r = await API.call('rakazAdd', v); busy(b, false);
    if (!r.ok && r.error !== 'hasrakaz') return msg('mRakaz', err(r), true);
    ADDED = true; $('kName').value = ''; $('kMail').value = '';
    route();
    msg(KEYS.me ? 'mWait' : 'mNew', r.ok ? 'הרכז.ת נוספ.ה ויכול.ה להיכנס עם קוד למייל. אחרי שהרכז.ת י.יכנס, הגישה שלך תיפתח באישור שלו.ה' : err(r));
  };
  function route() {
    const r = KEYS;
    if (r.me && r.me.wrapped) return show('gPass');
    if (r.preloaded && ME.role === 'rakaz') return show('gAct');
    if (r.me && !r.me.wrapped) return waitScreen();
    if (!r.initialized && ME.role === 'rakaz') return show('gInit');
    if (!r.initialized || r.preloaded) { show('gNew'); return msg('mNew', 'הרכז.ת של בית הספר עוד לא נכנס.ה למערכת. אפשר ליצור סיסמה עכשיו, והגישה תיפתח אחרי שהרכז.ת יאשר.ו'); }
    show('gNew');
  }
  $('pEnter').onclick = async () => {
    const pass = $('pPass').value; if (!pass) return;
    const b = $('pEnter'); busy(b, true, 'פותח…');
    try {
      PRIV = await CK.unlockPriv(KEYS.me.encPriv, pass);
      EXTRACT = ME.role === 'rakaz';
      SKEY = await CK.unwrap(PRIV, KEYS.me.wrapped, EXTRACT);
    } catch (e) { busy(b, false); return msg('mPass', 'הסיסמה לא נכונה', true); }
    if ($('pRemember').checked) await CK.remember(rid(), SKEY, 30);
    busy(b, false); $('pPass').value = '';
    enter();
  };
  $('pPass').onkeydown = e => { if (e.key === 'Enter') $('pEnter').click(); };
  $('pForgot').onclick = () => show('gRec');
  $('recBack').onclick = () => show('gPass');

  const passOk = (a, b, m) => { if (a.length < 8) { msg(m, 'סיסמה של 8 תווים לפחות', true); return false; } if (a !== b) { msg(m, 'שתי הסיסמאות לא זהות', true); return false; } return true; };
  /* רכז.ת ראשונ.ה: מפתח בית ספר חדש + קוד שחזור */
  let REC = '';
  $('iMake').onclick = async () => {
    const p1 = $('iPass1').value, p2 = $('iPass2').value; if (!passOk(p1, p2, 'mInit')) return;
    const b = $('iMake'); busy(b, true, 'מכין…');
    const sk = await CK.newSchoolKey(), uk = await CK.newUserKeys(p1);
    REC = CK.newRecoveryCode();
    const r = await API.call('keysInit', { pub: uk.pub, encPriv: uk.encPriv, wrapped: await CK.wrapFor(uk.pub, sk), recovery: await CK.wrapRecovery(REC, sk) });
    busy(b, false);
    if (!r.ok) return msg('mInit', err(r), true);
    SKEY = sk; EXTRACT = true;
    $('iRec').textContent = REC; $('iStep1').hidden = true; $('iStep2').hidden = false;
  };
  /* הדפסה מתוך הדף (3.11.26): חלון חדש נחסם בדפדפנים. בהדפסה מוצג רק #printRec */
  $('iPrint').onclick = () => {
    $('printRec').innerHTML = `<h2>מערכת רכזי החניכות · קוד שחזור</h2><p>${esc(ME.school)}</p><p style="font-size:26px;letter-spacing:3px;font-weight:bold" dir="ltr">${esc(REC)}</p><p>הקוד פותח את כל המידע של בית הספר אם הסיסמה נשכחה. לשמור במקום נעול. לא לשלוח במייל או בוואטסאפ.</p>`;
    document.body.classList.add('printing');
    const done = () => { document.body.classList.remove('printing'); $('printRec').innerHTML = ''; window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done); setTimeout(done, 60000);
    window.print();
  };
  $('iCopy').onclick = () => { const t = REC; (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => msg('mInit', 'הקוד הועתק. להדביק במקום בטוח, לא במייל ולא בוואטסאפ'), () => { const r = document.createRange(); r.selectNodeContents($('iRec')); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); msg('mInit', 'הקוד מסומן. להעתיק עם Ctrl+C או לחיצה ארוכה'); }); };
  /* עין לסיסמה: כפתור בכל שדה סיסמה במסך הכניסה */
  document.querySelectorAll('#gate input[type="password"]').forEach(inp => {
    const w = document.createElement('span'); w.className = 'pw'; inp.parentNode.insertBefore(w, inp); w.appendChild(inp);
    const b = document.createElement('button'); b.type = 'button'; b.className = 'eye'; b.setAttribute('aria-label', 'הצגת הסיסמה'); b.tabIndex = -1;
    const EYE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>', OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path d="M4 4l16 16"/></svg>';
    b.innerHTML = EYE; w.appendChild(b);
    b.onclick = () => { const show = inp.type === 'password'; inp.type = show ? 'text' : 'password'; b.innerHTML = show ? OFF : EYE; b.setAttribute('aria-label', show ? 'הסתרת הסיסמה' : 'הצגת הסיסמה'); inp.focus(); };
  });
  $('iSaved').onchange = () => { $('iGo').disabled = !$('iSaved').checked; };
  $('iGo').onclick = () => enter();
  /* רשימה שנטענה מראש: הקוד שהגיע למנהל.ת פותח את מפתח בית הספר, ומיד מוחלף בקוד שחזור חדש */
  $('aGo').onclick = async () => {
    const p1 = $('aPass1').value, p2 = $('aPass2').value; if (!passOk(p1, p2, 'mAct')) return;
    const b = $('aGo'); busy(b, true, 'פותח…');
    let sk;
    try { sk = await CK.unwrapRecovery($('aCode').value, KEYS.recovery); } catch (e) { busy(b, false); return msg('mAct', 'קוד ההפעלה לא נכון', true); }
    const uk = await CK.newUserKeys(p1);
    REC = CK.newRecoveryCode();
    const r = await API.call('keysActivate', { pub: uk.pub, encPriv: uk.encPriv, wrapped: await CK.wrapFor(uk.pub, sk), recovery: await CK.wrapRecovery(REC, sk) });
    busy(b, false);
    if (!r.ok) return msg('mAct', err(r), true);
    SKEY = sk; EXTRACT = true; $('aCode').value = '';
    $('iRec').textContent = REC; $('iStep1').hidden = true; $('iStep2').hidden = false; show('gInit');
  };
  /* מנהל.ת / רכז.ת נוספ.ת: סיסמה, ומחכים לאישור */
  $('nMake').onclick = async () => {
    const p1 = $('nPass1').value, p2 = $('nPass2').value; if (!passOk(p1, p2, 'mNew')) return;
    const b = $('nMake'); busy(b, true, 'מכין…');
    const uk = await CK.newUserKeys(p1);
    const r = await API.call('keysSet', { pub: uk.pub, encPriv: uk.encPriv });
    busy(b, false);
    if (!r.ok) return msg('mNew', err(r), true);
    KEYS.me = { pub: uk.pub, encPriv: uk.encPriv, wrapped: null };
    waitScreen();
  };
  async function waitScreen() { $('wFp').textContent = await CK.fingerprint(KEYS.me.pub); show('gWait'); }
  $('wAgain').onclick = async () => { const r = await API.call('keys'); if (r.ok) { KEYS = r; if (r.me && r.me.wrapped) { show('gPass'); return msg('mPass', 'הגישה אושרה. אפשר להיכנס עם הסיסמה'); } } msg('mWait', 'עוד לא אושר'); };
  /* שחזור בקוד המודפס: מפתח אישי חדש, עטוף מחדש */
  $('recGo').onclick = async () => {
    const p1 = $('recPass1').value, p2 = $('recPass2').value; if (!passOk(p1, p2, 'mRec')) return;
    const b = $('recGo'); busy(b, true, 'משחזר…');
    try {
      const sk = await CK.unwrapRecovery($('recCode').value, KEYS.recovery);
      const uk = await CK.newUserKeys(p1);
      const r = await API.call('keysSet', { pub: uk.pub, encPriv: uk.encPriv, wrapped: await CK.wrapFor(uk.pub, sk) });
      if (!r.ok) throw new Error(err(r));
      SKEY = sk; EXTRACT = true; busy(b, false); enter();
    } catch (e) { busy(b, false); msg('mRec', 'קוד השחזור לא נכון', true); }
  };

  /* ---------- 4. כניסה למערכת ---------- */
  async function enter() {
    show('gBusy');
    let back = 0; try { localStorage.removeItem(BACK_KEY); back = Math.max(0, +(sessionStorage.getItem(BACK_KEY) || 0) || 0); back = Math.min(back, Store.monthsBack()); } catch (e) {}   /* כמה חודשים אחורה. רק בלשונית הזו: פתיחה חדשה חוזרת לחודש הנוכחי (מאסטרו F-001) */
    try {
      const R = await Store.load(SKEY, ME, back);
      R.canGrant = EXTRACT;
      R.hooks = { logout, users, grant, setBack };
      window.startApp(R);
      Store.watch();
    } catch (e) {
      if (String(e.message) === 'badsession') return logout();
      show('gLogin'); msg('mLogin', 'הנתונים לא נטענו (' + e.message + '). כדאי לנסות שוב', true);
    }
  }
  /* בלי מפתח: לא CK, לא Store.load ולא נתוני בית ספר. המבט נבנה בנפרד (startMabat) */
  function mabat() {
    if (typeof window.startMabat === 'function') return window.startMabat(ME, { logout });
    $('sHello').textContent = 'שלום · ' + ROLE[ME.role];
    show('gSoon');
  }
  $('sOut').onclick = () => logout();
  function setBack(n) { try { sessionStorage.setItem(BACK_KEY, String(Math.max(0, +n || 0))); } catch (e) {} Store.leave().then(() => location.reload()); }
  async function logout() {
    if (ME && !noKey(ME)) { try { await Store.leave(); } catch (e) {} await CK.forget(rid()); }
    try { await API.call('logout'); } catch (e) {}
    API.setSession(null);
    location.replace(location.pathname + (API.MOCK ? location.search : ''));
  }
  /* ---------- הרשאות: מי מחכה לאישור ---------- */
  async function users() {
    const r = await API.call('keys'); if (!r.ok) return [];
    return Promise.all(r.users.map(async u => Object.assign(u, { fp: u.pub ? await CK.fingerprint(u.pub) : '' })));
  }
  async function grant(u) {
    if (!EXTRACT) return { ok: false, error: 'needpass' };
    const r = await API.call('grant', { email: u.email, wrapped: await CK.wrapFor(u.pub, SKEY) });
    return r;
  }

  /* ---------- התחלה ---------- */
  document.body.dataset.view = 'gate';
  const s = API.session();
  if (s && s.me) afterLogin(); else { show('gLogin'); if ($('gSchool').value) loadPeople(); }
})();
