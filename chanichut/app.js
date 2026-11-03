/* מערכת רכזי החניכות v2 (1.11.26) — נבנתה מהמוקאפ שאושר (מוקאפ-כיוונים\mock2.js).
   הנתונים מגיעים מ-store.js אחרי הכניסה והפענוח (R), וכל שינוי נשמר לבד (Store.watch).
   מבנה: מסכים ראשיים בניווט; כל לחיצה פותחת מסך משנה נפרד (#sub) שנרשם בהיסטוריה — "חזרה" של הטלפון חוזרת מסך אחד. */
/* הקישור למנטור.ית (mentor.js) צריך את מפתח בית הספר כדי לעטוף את מפתח הקישור. המפתח נשאר ב-gate.js ולא מגיע ל-startApp,
   ולכן עוטפים כאן את Store.load: המפתח עובר ל-Mentor.setKey ברגע הטעינה, בלי לגעת ב-gate.js או ב-store.js */
(function () {
  if (!window.Store || !window.Mentor || Store.load.mentorWrapped) return;
  const load = Store.load;
  Store.load = function (key) { try { Mentor.setKey(key); } catch (e) {} return load.apply(this, arguments); };
  Store.load.mentorWrapped = true;
})();
window.startApp = function (R) {
  'use strict';
  const I = {
    home: '<path d="M3 11 12 3l9 8"/><path d="M5 10v10h14V10"/>',
    check: '<path d="m5 12 4 4L19 7"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>', plus: '<path d="M12 5v14M5 12h14"/>',
    back: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    send: '<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    building: '<path d="M4 21V5h10v16M14 10h6v11M8 9h2M8 13h2M8 17h2"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>',
    file: '<path d="M6 2h8l5 5v15H6z"/><path d="M14 2v5h5"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/>',
    upload: '<path d="M12 16V4M6 10l6-6 6 6"/><path d="M4 20h16"/>',
    download: '<path d="M12 4v12M6 10l6 6 6-6"/><path d="M4 20h16"/>',
    map: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
    pen: '<path d="M4 20h4l10-10-4-4L4 16z"/><path d="m12 8 4 4"/>',
    print: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 14h12v7H6z"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    wallet: '<path d="M4 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4z"/><path d="M4 7V6a2 2 0 0 1 2-2h10"/><path d="M15 13.5h2"/>',
    folder: '<path d="M3 7h6l2 2h10v11H3z"/>',
    filter: '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    gantt: '<path d="M4 6h8M8 12h10M6 18h7"/><path d="M3 3v18"/>',
    dots: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
    out: '<path d="M10 4H5v16h5"/><path d="M14 8l-4 4 4 4"/><path d="M10 12h10"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    trash: '<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/>'
  };
  const ic = n => `<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${I[n]}</svg>`;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const $ = id => document.getElementById(id);
  const chev = '<span class="arr" aria-hidden="true"></span>';

  /* ================= נתונים ================= */
  const MONTH = R.month;
  const SCHOOL = R.school;
  const STAGES = ['טרם משובץ.ת', 'שיבוץ', 'שימור', 'חניכות משמעותית', 'אופק תעסוקתי'];
  const PLACE = id => !id ? '' : id[0] === 'I' ? 'in' : 'out';
  let FRAMES = R.meta.frames || 'both';
  const DOCS = R.DOCS;
  const SITE = 'https://pedagogiamh.co.il/';
  const TODAY = MONTH.today + '.' + MONTH.m;

  /* אבני הדרך של השנה: שם, מועד, איך מזהים ביומן, רק החודש. לכל אחת טופס (FORMS) לפי המקורות באתר המרחב */
  const MILES = [
    ['טופס מוכנות ליציאה', 'לפני השיבוץ', /מוכנות ליציאה/],
    ['שיחת הכנה אישית', 'ספטמבר', /שיחת הכנה/],
    ['ליווי ביום הראשון', 'ספטמבר', /יום הראשון|יום ראשון בעבודה/],
    ['רפלקציה אחרי שבוע', 'אוקטובר', /רפלקציה/],
    ['שיחה אישית · ' + MONTH.name, 'כל חודש', /שיחה אישית/, true],
    ['משוב המעסיק · פברואר', 'פברואר', /משוב המעסיק(?!.*(שני|יוני))|נספח א(?!.*(שני|יוני))/],
    ['משוב המעסיק · יוני', 'יוני', /(משוב המעסיק|נספח א).*(שני|יוני)/],
    /* נוספו 1.11.26 בסוף הרשימה כדי לא להזיז את המספור של הטפסים השמורים. בתצוגה הם במקומם (MILE_ORDER) */
    ['שיחת הורים', 'לפני השיבוץ', /שיחת הורים|שיחה עם ההורים/],
    ['הזמנת הורים לתעסוקה', 'ינואר', /הזמנת (ה)?הורים|ביקור (ה)?הורים/]
  ];
  const MILE_ORDER = [0, 7, 1, 2, 3, 4, 8, 5, 6];
  const SC5 =['טעונה שיפור', 'בינונית', 'טובה', 'טובה מאוד', 'מצוינת'];
  const NISPACH_A = ['לעמוד מול קהל ולהציג רעיון', 'לתקשר עם לקוחות ולתת שירות', 'לצבור ניסיון מקצועי משמעותי', 'מקום העבודה נותן משמעות ושייכות', 'גאווה בעצמו.ה ובעבודתו.ה', 'לחפש הזדמנויות לקדם את מקום העבודה', 'רצון ללמוד ולהשתפר במקצוע', 'שיתוף פעולה ועבודת צוות', 'חיבור למקצוע', 'לקיחת אחריות והשפעה', 'התמודדות עם מצבי לחץ', 'לתת ולקבל ביקורת בונה', 'שיפור הקשר עם המורים', 'יישום הנלמד במגמה', 'ביטוי רעיונות ושכנוע', 'התייעצות ושמיעת דעות', 'פעולה במצבי אי-ודאות', 'הבנה שהשקעה מביאה שיפור'];
  const FORMS = [
    { who: 'רכז.ת החניכות, מורה המגמה, המחנך.ת וההורים · לפני השיבוץ', src: ['nohal-rakaz-chanichut.html', 'נוהל רכז.ת החניכות'], f: [
      ['head', 'מקום העבודה המיועד'], ['text', 'שם העסק, התפקיד המוצע ותיאור המשימות'],
      ['head', 'מיומנויות מקצועיות · ממלא.ת מורה המגמה'], ['scale5', 'שליטה במיומנויות המקצועיות הנדרשות'], ['text', 'תחומים הדורשים שיפור ומענה בית-ספרי מתוכנן'],
      ['head', 'מיומנויות תפקודיות ובינאישיות · רכז.ת החניכות והמחנך.ת'], ['scale5', 'אחריות אישית והתמדה'], ['scale5', 'תקשורת בינאישית ועבודת צוות'], ['scale5', 'יכולת הסתגלות וקבלת סמכות'], ['text', 'מיומנויות שנכון לעבוד עליהן עם התלמיד.ה'],
      ['head', 'שיחת תיאום עם ההורים'], ['text', 'עמדת ההורים, ציפיות, חששות ודגשים מיוחדים'],
      ['head', 'חתימות'], ['check', 'רכז.ת החניכות'], ['check', 'מחנך.ת הכיתה'], ['check', 'מורה המגמה'], ['check', 'התלמיד.ה']] },
    { who: 'רכז.ת החניכות עם התלמיד.ה · לפני המפגש עם המנטור.ית', src: ['career-rakaz.html', 'הגאנט השנתי של הליווי'], f: [
      ['text', 'מה מסקרן אותך?'], ['text', 'איך את.ה מדמיין.ת את המקום?'], ['text', 'ממה את.ה חושש.ת?'], ['text', 'מה תרצה.י לבקש מהמנטור.ית?'], ['text', 'מה הציפיות שלך?'], ['text', 'סיכום הרכז.ת']] },
    { who: 'רכז.ת החניכות נוכח.ת בפגישת ההיכרות עם המנטור.ית', src: ['career-rakaz.html', 'הגאנט השנתי של הליווי'], f: [
      ['head', 'תיאום ציפיות עם המנטור.ית'], ['check', 'התנהגות במקום העבודה: הגעה, הפסקות, קוד לבוש'], ['check', 'ציפיות מקצועיות: משימות וסדר יום'], ['check', 'ציפיות לימודיות: חיבור לתוכנית הלימודים'],
      ['head', 'התלמיד.ה ראיין.ה את המנטור.ית'], ['check', 'איך התחלת בתחום?'], ['check', 'איך נראה יום עבודה?'], ['check', 'אילו כישורים צריך?'], ['check', 'מה את.ה אוהב.ת בעבודה?'], ['check', 'איך הארגון משפיע על הקהילה?'],
      ['text', 'מה סוכם ומה לבדוק בשבוע הראשון']] },
    { who: 'שיחה אישית עם התלמיד.ה · שבוע אחרי הכניסה לעבודה', src: ['career-rakaz.html', 'הגאנט השנתי של הליווי'], f: [
      ['text', 'איך הייתה החוויה?'], ['text', 'מה למדת?'], ['scale4', 'האם המקום עורר רצון לעבוד בו?'], ['text', 'מה הכי פחות אהבת?'], ['text', 'איך האווירה בארגון?'], ['text', 'תאר.י את המנטור.ית ואת תפקידו.ה'], ['text', 'סיכום הרכז.ת והפעולה הבאה']] },
    { who: 'שיחת חתך אישית · אחת לחודש לכל תלמיד.ה', src: ['nohal-rakaz-chanichut.html', 'נוהל רכז.ת החניכות · ליווי ורפלקציה'], f: [
      ['text', 'מה הולך טוב החודש'], ['head', 'קשיים שעלו'], ['check', 'בעבודה'], ['check', 'עם המנטור.ית'], ['check', 'שכר ותלוש'], ['check', 'הגעה והסעות'], ['check', 'בבית הספר'],
      ['scale4', 'תחושת מסוגלות והתמדה'], ['text', 'מה סוכם'], ['check', 'לעדכן את המחנך.ת או הצוות הטיפולי']] },
    { who: 'המעסיק.ה או המנטור.ית · פברואר ויוני', src: ['career-rakaz.html', 'ארגז הכלים · משוב המעסיק על התלמיד'], mentor: true, f: [
      ['head', 'ההשפעה על התלמיד.ה · 1 עד 4 (4 = במידה רבה)'], ...NISPACH_A.map(x => ['scale4', x]),
      ['head', 'שאלות פתוחות'], ['text', 'מהות עבודת התלמיד.ה'], ['text', 'רציתי להוסיף'], ['text', 'הצעות לשיפור התהליך']] },
    /* 6 = יוני משתמש בטופס של פברואר (formOf). 7, 8 = ההורים */
    null,
    { who: 'רכז.ת החניכות עם ההורים והתלמיד.ה · לפני השיבוץ', src: ['nohal-rakaz-chanichut.html', 'נוהל רכז.ת החניכות'], f: [
      ['head', 'מה הוצג להורים'], ['check', 'מהי תוכנית החניכות ומה מטרותיה'], ['check', 'מקום העבודה המיועד והתפקיד'], ['check', 'ימי העבודה, השעות וההגעה'], ['check', 'שכר, תלוש וביטוח'], ['check', 'פרטי הקשר של הרכז.ת'],
      ['head', 'עמדת ההורים'], ['text', 'ציפיות'], ['text', 'חששות ודגשים מיוחדים'], ['check', 'ההורים מסכימים ליציאה לתעסוקה'], ['text', 'מה סוכם']] },
    { who: 'הזמנת ההורים לביקור במקום העבודה · במהלך השנה', src: ['career-rakaz.html', 'הגאנט השנתי של הליווי'], f: [
      ['text', 'מועד הביקור'], ['check', 'ההזמנה נשלחה להורים'], ['check', 'המנטור.ית עודכן.ה ותיאם.ה'], ['check', 'ההורים הגיעו'],
      ['text', 'מה התלמיד.ה הציג.ה להורים'], ['text', 'רשמים של ההורים'], ['text', 'מה סוכם']] }
  ];
  const formOf = i => FORMS[i] || FORMS[5];
  /* טופס נחשב רק כשהוא הושלם. טיוטה לא מסמנת את אבן הדרך */
  const hasForm = (s, i) => !!(s && s.forms && s.forms[i] && s.forms[i].st !== 'draft');
  const isDraft = (s, i) => !!(s && s.forms && s.forms[i] && s.forms[i].st === 'draft');

  /* המסננת: חמשת העקרונות (chanichut-masnenet) — נבדקת רק בפתיחת מעסיק חדש */
  /* לכל עיקרון הפרקטיקות מהטבלה באתר. 1 = תנאי סף (חובה): בלעדיו אין שיבוץ עד שמוסדר */
  const MASNENET = [
    ['יחסים של כבוד והתפתחות', [['יחסי כבוד בחניכות', 1], ['תשלום לתלמיד.ה על פי חוק · תלוש וביטוח', 1], ['סביבת עבודה מיטיבה ובטוחה', 1], ['מנטור.ית קבוע.ה לליווי והנחיה', 1], ['עדיפות להתנסויות "אימפקט" חברתיות־ערכיות']]],
    ['התנסות דואלית', [['תהליכי שיום ורפלקציה וצבירת הון אינטלקטואלי'], ['חיבור ללמידה ולמקצוע עם היזון חוזר'], ['הערכה משקפת ומעצבת לתלמיד.ה']]],
    ['פתיחת אופקים', [['עבודה מקצועית ומשמעותית'], ['התנסויות מגוונות בתחום'], ['התמודדות עם אתגרים ודילמות "בחיים האמיתיים"'], ['מפגש עם מומחים מובילים'], ['קרדיטציה ותיק עבודות']]],
    ['כישורים ומיומנויות', [['הרגלים ומיומנויות מקצועיות, אישיות ובין־אישיות'], ['הזדמנויות ביטוי מגוונות'], ['אוריינות לשונית, תקשורת ועמידה מול קהל'], ['הבנת מקומי בעולם וכלים לביטוי עצמי']]],
    ['סביבה דינאמית ומשתנה', [['סביבת עבודה בהתפתחות מתמדת המחוברת לעולם העבודה'], ['אפשרות לשינויים'], ['מקום מעורר השראה']]]
  ];
  /* שלוש פעולות הבקרה בכניסה (נוהל רכז החניכות, נספח ג) — לפני כל אישור */
  const MAS_CTRL = ['אינטייק מקדים עם המעסיק', 'סיור בטיחות פיזי בעסק', 'הסכם התקשרות חתום · שכר לפי חוק, תלוש, ביטוח ומנטור.ית'];

  const EMPS = R.EMPS;
  /* שיבוץ רק אצל מעסיק שלא נפסל במסננת (ולא פנייה פתוחה). מעסיק "לא מאושר" נשאר ברשימה לתיעוד */
  const canPlace = e => !!e && !e.lead && e.mas !== 'לא מאושר';
  const WHY_NONE = ['חסרים מסמכים', 'לא נמצא מעסיק', 'נגישות תחבורתית', 'סיבה אישית', 'עזב.ה'];
  /* תקנים: רק מספר. כל ערך אחר מהקובץ ("לבדוק!", "1?", תאריך) נשמר כהערה ולא מוצג כמספר */
  Object.values(EMPS).forEach(e => { const raw = String(e.slots == null ? '' : e.slots).trim(); if (!/^\d+$/.test(raw)) { e.slotsRaw = raw; e.slots = ''; } });
  const INS = R.INS;
  const docsOf = s => s.docs.filter(d => d.s === 'ok' || d.s === 'na').length;
  const mkDocs = n => DOCS.map((_, i) => ({ s: i < n ? 'ok' : 'miss', n: '' }));
  const STU = R.STU;
  const ATT = R.ATT; const NOTES = R.NOTES;
  /* מצב התלמיד.ה (לומד / מושעה / עזב) מגיע מרשימת הלומדים; שינוי ידני בתיק מסומן ככזה */
  STU.forEach(s => { ATT[s.id] = ATT[s.id] || {}; NOTES[s.id] = NOTES[s.id] || {}; s.status = s.status || 'לומד'; s.statusSrc = s.statusSrc || 'list'; s.track = s.track || ''; s.mentor = s.mentor || ''; s.act = s.act || ''; s.log = s.log || []; s.hist = s.hist || []; s.susp = s.susp || null; s.forms = s.forms || {}; s.stageManual = s.stageManual == null ? null : s.stageManual; });
  /* הערה ליום בלי "הגיע" / "לא הגיע" בתחילתה — זה כבר מופיע בסימון היום */
  Object.values(NOTES).forEach(o => Object.keys(o).forEach(d => { const v = String(o[d]).replace(/^\s*(לא\s*)?הגיע\.?ה?\s*[-–:,.]*\s*/, '').trim(); if (v) o[d] = v; else delete o[d]; }));
  const TIMES = R.TIMES, OFF = R.OFF;
  const wdOf = d => new Date(MONTH.y, MONTH.m - 1, d).getDay();
  /* ימי העבודה של החודש: לפני שינוי מערכת הימים — הימים הקודמים (dayHist), ויום שכבר דווח נשאר תמיד (גם "יום נוסף") */
  function dates(s) { const out = [], a = ATT[s.id] || {}; for (let d = 1; d <= MONTH.last; d++) { const w = s.dayHist && d < s.dayHist.from ? s.dayHist.days : s.days; if (w.includes(wdOf(d)) || (a[d] && a[d] !== 'n')) out.push(d); } return out; }
  const wd = d => 'אבגדהוש'[wdOf(d)] + '׳';
  /* יום בלי תעסוקה לכל הכיתה, והשעיה של תלמיד.ה — נרשמים כ"לא בעבודה" בימי העבודה. הסימון שהיה נשמר (OFFBAK) וחוזר בביטול */
  /* הסימון המקורי של יום נשמר פעם אחת בלבד — ב-OFFBAK (יום בלי תעסוקה) או ב-SUSPBAK (השעיה) — וחוזר כששניהם הוסרו */
  const OFFBAK = R.OFFBAK, SUSPBAK = R.SUSPBAK;
  const bak = (M, s) => M[s.id] = M[s.id] || {};
  function applyOff(cls, d, why) { (OFF[cls] = OFF[cls] || {})[d] = why; STU.filter(s => s.cls === cls).forEach(s => { if (!dates(s).includes(d)) return; const b = bak(OFFBAK, s); if (!(d in b) && !(d in bak(SUSPBAK, s))) b[d] = ATT[s.id][d]; ATT[s.id][d] = 'n'; }); }
  function removeOff(cls, d) { if (OFF[cls]) delete OFF[cls][d]; STU.filter(s => s.cls === cls).forEach(s => { const b = bak(OFFBAK, s); if (suspended(s, d)) { ATT[s.id][d] = 'n'; if (d in b) bak(SUSPBAK, s)[d] = b[d]; } else if (d in b) { if (b[d]) ATT[s.id][d] = b[d]; else delete ATT[s.id][d]; } else if (ATT[s.id][d] === 'n') delete ATT[s.id][d]; delete b[d]; }); }
  /* תאריך מלא מ"28.9" או "28.9.2026". בלי שנה: לפי שנת הלימודים (ספטמבר–אוגוסט) */
  const fullDate = t => { const p = String(t || '').split('.').map(Number); if (!p[0]) return null; const m = p[1] || MONTH.m, y0 = MONTH.m >= 8 ? MONTH.y : MONTH.y - 1; return new Date(p[2] || (m >= 8 ? y0 : y0 + 1), m - 1, p[0]); };
  const suspended = (s, d) => { if (s.status !== 'מושעה' || !s.susp) return false; const f = fullDate(s.susp.from), t = fullDate(s.susp.to), x = new Date(MONTH.y, MONTH.m - 1, d); return !!f && x >= f && (!t || x <= t); };
  function applySusp(s) { const b = bak(SUSPBAK, s); dates(s).forEach(d => { const off = OFF[s.cls] && OFF[s.cls][d];
    if (suspended(s, d)) { if (!(d in b) && !off) b[d] = ATT[s.id][d]; ATT[s.id][d] = 'n'; }
    else if (d in b) { if (off) { ATT[s.id][d] = 'n'; bak(OFFBAK, s)[d] = b[d]; } else if (b[d]) ATT[s.id][d] = b[d]; else delete ATT[s.id][d]; delete b[d]; }
    else if (ATT[s.id][d] === 'n' && !off) delete ATT[s.id][d]; }); }
  /* שלב בפירמידה: אוטומטי עד "שימור" ממה שרשום; שלבים גבוהים יותר — הרכז.ת מסמנ.ת בתיק */
  const present = v => v === 'p' || v === 's';
  /* שעות (3.11.26): שעות ביום עבודה לתלמיד.ה (או ברירת מחדל מהמעסיק), או לפי הגעה ויציאה של אותו יום; סה"כ חודשי אוטומטי, או ידני לבתי ספר שמדווחים רק סה"כ */
  const tmHours = t => { if (!t || !t.i || !t.o) return 0; const [a, b] = [t.i, t.o].map(x => { const m = String(x).match(/^(\d{1,2}):(\d{2})$/); return m ? +m[1] * 60 + +m[2] : null; }); return a == null || b == null || b <= a ? 0 : Math.round((b - a) / 6) / 10; };
  const hrsPerDay = s => +s.hrs || +((EMPS[s.emp] || {}).hpd) || 0;
  const hoursOf = s => { const man = s.hrsMan && s.hrsMan[MONTH.ym]; if (man != null && man !== '') return { h: +man || 0, manual: true }; let h = 0; dates(s).forEach(d => { if (!present(ATT[s.id][d])) return; h += tmHours(TIMES[s.id][d]) || hrsPerDay(s); }); return { h: Math.round(h * 10) / 10, manual: false }; };
  const fmtH = h => String(Math.round((+h || 0) * 10) / 10);
  const hoursTxt = s => { const o = hoursOf(s); return o.h || hrsPerDay(s) || o.manual ? ` · ${fmtH(o.h)} שעות${o.manual ? ' (ידני)' : ''}` : ''; };
  /* זיהוי ביומן: לא כשלפני הביטוי באותו משפט יש "לא", "טרם", "חסר" וכו׳, ולא רישום של "הקישור נשלח" */
  const negated = (t, re) => { const m = t.match(re); if (!m) return true; const pre = t.slice(0, m.index).split(/[;,.·:\n]/).pop(); return /(^|\s)(לא|טרם|אין|חסר|חסרה|חסרים|בלי|ללא|נדחה|נדחתה|בוטל|בוטלה)(\s|$)/.test(pre); };
  const hasLog = (s, re, thisMonth) => (s.log || []).some(l => !l.sent && !l.form && re.test(l.t) && !negated(l.t, re) && (!thisMonth || +String(l.d).split('.')[1] === MONTH.m));
  const sentOf = (s, i) => (s.log || []).some(l => l.sent && l.mi === i);
  const milesOf = s => MILES.map(([, , re, tm], i) => hasForm(s, i) || hasLog(s, re, tm));
  function autoStage(s) { const a = ATT[s.id], ds = dates(s), p = ds.filter(d => present(a[d])).length; return p >= 3 && ds.filter(d => a[d] === 'a').length <= 1 ? 2 : 1; }
  function stageOf(s) { return !s.emp ? 0 : s.status === 'עזב' ? 1 : s.stageManual != null ? s.stageManual : autoStage(s); }
  STU.forEach(s => { s.stage = stageOf(s); });

  /* ================= תזכורות על היעדרות =================
     לא נשלחות בלחיצה — יוצאות פעם ביום ב-16:00 על מה שמסומן "לא הגיע.ה" באותו רגע. כך לחיצה בטעות לא שולחת מייל. */
  const REM = [], REM_CFG = R.meta.remCfg;
  const gradeOf = cls => String(cls).split('·')[0].replace(/[0-9]/g, '').trim();
  /* אנשי הקשר לתזכורות — בית הספר מזין במסך "ניהול · משתמשים" (מיטל, 1.11.26) */
  const CT = R.meta.contacts;
  const TEACHER = cls => (CT.cls[cls] || {}).name ? CT.cls[cls].name + ' (מחנך.ת ' + cls + ')' : 'מחנך.ת ' + cls;
  const GRADE = cls => (CT.grade[gradeOf(cls)] || {}).name ? CT.grade[gradeOf(cls)].name + ' (רכז.ת שכבה ' + gradeOf(cls) + ')' : 'רכז.ת שכבה ' + gradeOf(cls);
  const mailOf = r => { const s = STU.find(x => x.id === r.sid); return !s ? '' : r.to === 'teacher' ? (CT.cls[s.cls] || {}).mail || '' : (CT.grade[gradeOf(s.cls)] || {}).mail || ''; };
  function streak(s, d) { const ds = dates(s).filter(x => x <= d); let n = 0; for (let i = ds.length - 1; i >= 0; i--) { const v = ATT[s.id][ds[i]]; if (v === 'a') n++; else if (v === 'n') continue; else break; } return n; }
  function remFor(s, d) {
    if (ATT[s.id][d] !== 'a' || s.status === 'עזב') return [];
    const n = streak(s, d), out = [];
    if (REM_CFG.teacher) out.push({ sid: s.id, d, to: 'teacher', who: TEACHER(s.cls), t: `${s.name} לא הגיע.ה לתעסוקה ב-${wd(d)} ${d}.${MONTH.m}${n > 1 ? ` (${n} ימי עבודה ברצף)` : ''}` });
    if (REM_CFG.grade && n >= REM_CFG.streak) out.push({ sid: s.id, d, to: 'grade', who: GRADE(s.cls), t: `${s.name}: ${n} ימי עבודה ברצף בלי להגיע לתעסוקה` });
    return out;
  }
  const isSent = r => REM.some(x => x.sid === r.sid && x.d === r.d && x.to === r.to);
  /* תזכורת יוצאת רק על היעדרות מהימים האחרונים בחודש הנוכחי — לא על ימים ישנים שמוזנים בדיעבד */
  const REM_DAYS = 4;
  function pending() { const out = []; if (MONTH.back) return out; STU.forEach(s => dates(s).filter(d => d <= MONTH.today && d >= MONTH.today - REM_DAYS).forEach(d => remFor(s, d).forEach(r => { if (!isSent(r)) out.push(r); }))); return out; }
  /* מה שנשלח כבר (מהשרת, בלי שם) — השם והנוסח נבנים כאן מהתיק */
  R.REMLOG.forEach(x => { const s = STU.find(y => y.id === x.sid); if (!s) return; const n = streak(s, x.d); REM.unshift({ sid: s.id, d: x.d, to: x.to, who: x.to === 'grade' ? GRADE(s.cls) : TEACHER(s.cls), t: x.to === 'grade' ? `${s.name}: ${n} ימי עבודה ברצף בלי להגיע לתעסוקה` : `${s.name} לא הגיע.ה לתעסוקה ב-${wd(x.d)} ${x.d}.${MONTH.m}` }); });
  /* אפשרות ד׳ (מיטל, 1.11.26): הנוסח עם השם נבנה כאן בדפדפן ונשאר בשרת עד 16:00. השרת שולח ומוחק */
  function mails() {
    return pending().map(r => ({ r, to: mailOf(r) })).filter(x => x.to).map(({ r, to }) => {
      const s = STU.find(x => x.id === r.sid), dd = String(r.d).padStart(2, '0');
      return { k: `${MONTH.ym}-${dd}:${r.sid}:${r.to}`, to, subj: `היעדרות מהתעסוקה · ${s.cls} · מערכת רכזי החניכות`,
        html: `<div dir="rtl" style="font-family:Arial,sans-serif;font-size:15px;text-align:right;line-height:1.7">שלום${r.who.includes('(') ? ' ' + esc(r.who.split(' (')[0]) : ''},<br><br>${esc(r.t)}.<br>פרטים אצל רכז.ת החניכות של ${esc(SCHOOL)}.<br><br>המרחב הפדגוגי · המנהל להכשרה מקצועית · משרד העבודה</div>` };
    });
  }
  const remCount = sid => REM.filter(r => r.sid === sid).length + pending().filter(r => r.sid === sid).length;

  const SUBMITTED = R.SUBMITTED;
  /* רשימת מותרים: רק רכז.ת החניכות עורכ.ת. כל תפקיד אחר צפייה בלבד, גם במקלדת */
  const canEdit = () => document.body.dataset.role === 'rakaz';
  const MGS = [], classes = [];
  /* המגמות והכיתות נגזרות מהתלמידים, ומתעדכנות כשנוסף.ה תלמיד.ה */
  const syncGroups = () => { MGS.splice(0, MGS.length, ...new Set(STU.map(s => s.mg).filter(Boolean))); classes.splice(0, classes.length, ...new Set(STU.map(s => s.cls).filter(Boolean))); };
  syncGroups();
  /* אחוז נוכחות — רק מתוך הימים שסומנו (יום שעוד לא סומן לא נספר כהיעדרות) */
  /* כלל אחד לכל התצוגות: "לא בעבודה" והיעדרות באישור לא נספרים, לא כנוכחות ולא כהיעדרות */
  const attStat = l => { let p = 0, t = 0, u = 0; l.forEach(s => { const a = ATT[s.id]; dates(s).forEach(d => { if (d > MONTH.today) return; if (!a[d]) { u++; return; } if (a[d] === 'n' || a[d] === 'x') return; t++; if (present(a[d])) p++; }); }); return { pct: t ? Math.round(p / t * 100) : 0, unmarked: u, p, t }; };
  const attPct = l => attStat(l).pct;
  const empName = id => EMPS[id] ? EMPS[id].name : INS[id] ? INS[id].name : 'לא משובץ.ת';
  const first = s => s ? String(s.name || '').split(' ')[0] : '';
  const sPlaced = STU.find(s => PLACE(s.emp) === 'out') || STU[0];
  const sNone = STU.find(s => !s.emp && s.status !== 'עזב') || STU[STU.length - 1];
  const active = () => STU.filter(s => s.status !== 'עזב');
  const newLeadId = () => 'L' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  /* פניות נשמרות מוצפנות (lead:<id>). מעסיק שסומן כפנייה בקובץ נכנס פעם אחת כפנייה */
  const LEADS = R.LEADS;
  Object.values(EMPS).filter(e => e.lead && !LEADS.some(l => l.name === e.name)).forEach(e => LEADS.push({ id: newLeadId(), name: e.name, st: e.status || 'פניתי', note: e.studsTxt || '', who: e.mentor || '', phone: e.phone || '' }));
  const LEAVING = /עוזב|עזב|נשר|הפסיק ללמוד/;

  /* המבט הארצי וניהול בתי הספר: national.js ו-schools-admin.js (startMabat), על נתוני השרת בלבד */
  const LOGO ='<svg class="lg" viewBox="0 0 320 350" aria-hidden="true"><path d="M74 300 V118 C74 72 102 44 148 44 H160" fill="none" stroke="#1D4F5E" stroke-width="76" stroke-linecap="round" stroke-linejoin="round"/><path d="M130 6 H226 A60 60 0 0 1 286 66 V74 C262 78 246 94 238 116 L222 82 H166 Z" fill="#C4862A"/><rect x="206" y="22" width="80" height="312" rx="40" fill="#7F9A8E" stroke="#F6F2E9" stroke-width="9" paint-order="stroke"/></svg>';
  const WORD = '<svg class="gate-word" viewBox="0 0 360 120" role="img" aria-label="חניכות · נוכחות · קשר · צמיחה"><text x="180" y="78" text-anchor="middle" font-family="Rubik, sans-serif" font-weight="800" font-size="86" fill="#1D4F5E">חניכות</text><text x="180" y="112" text-anchor="middle" font-family="Rubik, sans-serif" font-weight="500" font-size="22" fill="#1D4F5E">נוכחות · קשר · צמיחה</text></svg>';

  /* ================= טפסים וקישורים חשובים — מהמרחב הפדגוגי ================= */
  const LINKS = [
    ['הנהלים והמסמכים המחייבים', [
      ['נוהל רכז.ת החניכות והתעסוקה', 'הגדרת התפקיד, הסמכויות וששת הנספחים', 'nohal-rakaz-chanichut.html'],
      ['מסמך ההיערכות לתכנון תשפ״ז · עדכון מס׳ 5', 'PDF · הנוסח המחייב', 'docs/heerchut-tashpaz-idkun5.pdf'],
      ['סל תוכניות להעשרה וטיפוח הלומד', 'רכיב "מקצוע וחניכות" · 35% מהסל', 'takziv-sal.html'],
      ['סעיף 117 · עסקים בית-ספריים', 'עסק בית-ספרי · טופס מועמדות', 'takziv-117.html'],
      ['מסמך הפרמטרים · נספח א׳ משוב המעסיק', 'דרייב · הטופס המלא', 'https://drive.google.com/file/d/1xCzUWg8Kqa5zzry8ilOE9L3phl0M53xV/view'],
      ['מסמך "חניכות"', 'דרייב', 'https://drive.google.com/file/d/1nB39wiq4kLBQKT1MEzh9mZWGoQFx-L8L/view']]],
    ['ארגז הכלים של רכז.ת החניכות', [
      ['ארגז הכלים', 'המשרה, הפרמטרים, הגאנט השנתי, המטלות והסדנאות', 'career-rakaz.html'],
      ['תיק החפיפה', 'כניסה לתפקיד: מיפוי, מאגר מעסיקים, תוכנית עבודה', 'chanichut-rakaz.html'],
      ['שער החניכות', 'כל התחום', 'chanichut.html'],
      ['חוברת עשרת הצעדים', 'Canva', 'https://www.canva.com/design/DAGeTwh7yf0/W1z-DGMKgPT7mQTsxZWLtA/view'],
      ['מצגת פירמידת החניכות', 'PowerPoint', 'docs/chanichut-piramida.pptx']]],
    ['בדיקת מעסיק ומעקב תלמיד.ה', [
      ['מסננת החניכות', 'חמשת העקרונות וטבלת הבדיקה בביקור', 'chanichut-masnenet.html'],
      ['פירמידת החניכות', 'ארבעת השלבים, המחוון והמיפוי הכיתתי', 'chanichut-piramida.html'],
      ['שמונת מודלי החניכות', 'ממעסיק חיצוני ועד עסק עצמאי', 'chanichut-model-1.html']]],
    ['טפסים', [
      ['טופס משוב המעסיק', 'משוב שוטף מהמעסיק על התלמיד.ה', 'mishov-maasik.html'],
      ['נספח א׳ · משוב המעסיק על התלמיד', '18 תחומים · פברואר ויוני', 'career-rakaz.html#feedback'],
      ['נספח ב׳ · טופס מוכנות ליציאה לתעסוקה', 'לפני השיבוץ · רכז.ת, מורה המגמה, מחנך.ת והורים', 'nohal-rakaz-chanichut.html'],
      ['נספח ה׳ · טופס לקראת יציאת תלמיד לתעסוקה', 'תיק החפיפה', 'chanichut-rakaz.html'],
      ['טופס המועמדות למודל 117', 'נספח א׳ לנוהל החניכות', 'takziv-117.html']]],
    ['תיקיות בדרייב', [
      ['תיקיית "חניכות" · דרייב המנהלים', 'Google Drive', 'https://drive.google.com/drive/folders/1JiD_Zkwjd9x35Q4iYTv1WsRzBhxCNRtH'],
      ['תיקיית חונכות ותעסוקה', 'Google Drive', 'https://drive.google.com/drive/folders/1rQEZ2DYw2xCA-MGEKZnjO4xBSpX8WSVI']]]
  ];

  /* ================= תוכנית חניכות — רכיב "מקצוע וחניכות" בסל התוכניות (35% · 3,400 ₪ לתלמיד) ================= */
  const PROG = { students: R ? 180 : 210, items: [] };
  const PROG_TYPES = ['כנס מעסיקים', 'יום שיא בתחום המקצועי', 'תחרות', 'סיור לימודי', 'פרויקט מקצועי', 'קורס מקצועי · ריבוי תעודות', 'כיתת אומן או הרצאה', 'מפגש שיא הורים · תלמידים · מעסיקים', 'אירוע הוקרה למעסיקים ולמנטורים', 'אחר'];
  const BEATS = [['פעימה ראשונה', '50%', 'ספטמבר · אחרי אישור התוכנית', true], ['פעימה שנייה', '35%', 'ינואר · אחרי הוועדה המלווה', false], ['פעימה שלישית', '15%', 'עד 20.6 · אחרי הדוח המסכם', false]];
  PROG.items = [
    { type: 'סיור לימודי', desc: 'סיור במפעל תעשיות גל · ' + MGS[0], part: 26, plan: 4200, done: 3900, rec: 'קבלה 1182 · הסעות.pdf', d: '12.' + MONTH.m, who: 'הסעות הצפון' },
    { type: 'כנס מעסיקים', desc: 'מפגש מעסיקים ומנטורים · פתיחת שנה', part: 40, plan: 6500, done: 0, rec: '', d: '', who: '' },
    { type: 'קורס מקצועי · ריבוי תעודות', desc: 'קורס בטיחות בעבודה לכל תלמידי החניכות', part: 27, plan: 9800, done: 9800, rec: '', d: '3.' + MONTH.m, who: 'המכללה לבטיחות' }
  ];
  const budget = () => Math.round(PROG.students * 3400 * 0.35);
  const nis = n => (n || 0).toLocaleString('he-IL') + ' ₪';

  /* ================= הגאנט השנתי של הליווי (career-rakaz + נוהל רכז.ת החניכות) ================= */
  const GM = ['אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר', 'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני'];
  const PHASES = [['בחינת התאמה', 0, 0, 's0'], ['הכנה וליווי', 1, 1, 's1'], ['רפלקציה', 2, 2, 's2'], ['ליווי שוטף', 3, 5, 's3'], ['בדיקה חוזרת', 6, 6, 's0'], ['ליווי שוטף', 7, 9, 's3'], ['סיכום והוקרה', 10, 10, 's4']];
  const CUR_M = (MONTH.m - 8 + 12) % 12;
  const RP = 'דוח תעסוקה חודשי עד ';
  const G = [
    [{ t: 'בחינת כל מעסיק חדש במסננת · ששת הפרמטרים' }, { t: 'ריאיון למנטור.ית אצל כל מעסיק חדש · חמשת הפרמטרים' }, { t: 'מיפוי כל תלמידי המגמות' }, { t: 'עדכון מאגר המעסיקים' }, { t: 'תוכנית עבודה שנתית לאישור המנהל.ת' }],
    [{ t: 'העלאת נתוני בית הספר למערכת' }, { t: 'טופס מוכנות ליציאה לכל תלמיד.ה', m: 0 }, { t: 'שיחת הכנה אישית לפני המפגש עם המנטור.ית', m: 1 }, { t: 'ליווי ביום הראשון', m: 2 }, { t: 'הסכם התקשרות עם כל מעסיק' }, { t: 'שיחת הורים לכל תלמיד.ה', m: 7 }],
    [{ t: 'רפלקציה שבוע אחרי הכניסה לעבודה', m: 3 }, { t: 'שיחה אישית חודשית לכל תלמיד.ה', m: 4 }, { t: RP + '31.10' }, { t: 'ביקור במעסיקים · סבב ראשון' }],
    [{ t: 'שיחה אישית חודשית לכל תלמיד.ה', m: 4 }, { t: RP + '30.11' }, { t: 'ישיבה עם רכזי המגמות (דו-שבועי)' }],
    [{ t: 'שיחה אישית חודשית לכל תלמיד.ה', m: 4 }, { t: RP + '31.12' }, { t: 'סגירת מצבת תלמידים 1.12' }, { t: 'ביקור במעסיקים · סבב שני' }],
    [{ t: 'שיחה אישית חודשית לכל תלמיד.ה', m: 4 }, { t: RP + '31.1' }, { t: 'הצגת התקדמות תוכנית החניכות בוועדה המלווה' }, { t: 'הזמנת הורים לתעסוקה', m: 8 }],
    [{ t: 'בדיקה חוזרת של התאמת המעסיק והמנטור.ית' }, { t: 'משוב המעסיק על כל תלמיד.ה', m: 5 }, { t: 'שיחה אישית חודשית לכל תלמיד.ה', m: 4 }, { t: RP + '28.2' }, { t: 'ביקור במעסיקים · סבב שלישי' }],
    [{ t: 'שיחה אישית חודשית לכל תלמיד.ה', m: 4 }, { t: RP + '31.3' }],
    [{ t: 'הגשת מועמדות לעסק בית-ספרי (סעיף 117) עד 30.4' },{ t: 'שיחה אישית חודשית לכל תלמיד.ה', m: 4 }, { t: RP + '30.4' }, { t: 'ביקור במעסיקים · סבב רביעי' }],
    [{ t: 'שיחה אישית חודשית לכל תלמיד.ה', m: 4 }, { t: RP + '31.5' }],
    [{ t: 'משוב שני של המעסיק על כל תלמיד.ה', m: 6 }, { t: 'בחינה חוזרת של המעסיקים לשנה הבאה' }, { t: 'אירוע הוקרה למעסיקים ולמנטורים' }, { t: RP + '30.6' }, { t: 'דוח מסכם של תוכנית החניכות עד 20.6' }, { t: 'סיכום שנה והפקת לקחים' }]
  ];
  /* סימון ידני בגאנט נשמר לפי שנת הלימודים (מתחילה באוגוסט) */
  const GY = MONTH.m >= 8 ? MONTH.y : MONTH.y - 1, gk = (mi, i) => GY + ':' + mi + '.' + i;
  R.meta.gantt = R.meta.gantt || {};
  G.forEach((items, mi) => items.forEach((it, i) => { if (it.m === 4 && mi !== CUR_M) delete it.m; if (it.m == null) it.d = !!R.meta.gantt[gk(mi, i)]; })); /* חודש שעבר ≠ בוצע. מסמנים ידנית */
  /* פריטי ההורים (1.11.26) נוספו בסוף החודש שלהם, כדי לא להזיז סימונים שמורים (gk לפי מיקום). הסדר למטה הוא רק לתצוגה */
  const G_ORDER = { 1: [0, 1, 5, 2, 3, 4], 5: [0, 3, 1, 2] };
  const gOrder = mi => G_ORDER[mi] || G[mi].map((_, i) => i);
  const mileStudents = i => active().filter(s => i === 0 || i === 7 || s.emp);
  const mileCount = i => { const l = mileStudents(i); return { x: l.filter(s => milesOf(s)[i]).length, n: l.length }; };

  /* ================= הדף ================= */
  const NAV = [['overview', 'chart', 'סקירה'], ['att', 'cal', 'נוכחות'], ['students', 'user', 'תלמידים'], ['employers', 'building', 'מעסיקים'], ['checklist', 'check', "צ'ק ליסט"], /* ['program', 'wallet', 'תוכנית חניכות'] — מוסתר כרגע (31.10.26) */ ['links', 'link', 'טפסים וקישורים'], ['reports', 'download', 'דוחות'], ['admin', 'lock', 'ניהול']];
  const TABS = ['overview', 'att', 'students', 'employers'];
  const root = document.getElementById('app');
  root.innerHTML = `
  <header class="top">
    <div class="brand">${LOGO.replace('class="lg"', 'class="brand-mark"')}<div><b>חניכות</b><small id="roleLbl">${esc(SCHOOL)} · רכז.ת החניכות</small></div><img class="top-minhal" src="logo-minhal.png" alt="משרד העבודה · מינהל הכשרה מקצועית"></div>
    <nav class="nav" id="nav">
      ${NAV.slice(0, 5).map(([v, i, l]) => `<a href="#${v}">${ic(i)}<span>${l}</span></a>`).join('')}<a href="#more">${ic('dots')}<span>עוד</span></a>
    </nav>
    <div class="actions">
      <button class="btn primary big edit" data-act="att">${ic('cal')}דיווח נוכחות</button>
      <span class="save-st" id="saveSt" role="status" aria-live="polite"></span>
      <button class="btn quiet" id="logout">יציאה</button>
    </div>
  </header>
  <main class="page">
    <aside class="side">
      <details class="sec today" id="today">
        <summary><h2>מה דורש טיפול היום</h2><span class="count" id="todayN">0</span></summary>
        <ul class="todo" id="todoList"></ul>
      </details>
      <details class="sec agent" id="agent">
        <summary>${ic('spark')}<h2>לכתוב במקום ללחוץ</h2></summary>
        <div class="agent-row"><input id="cmd" class="cmd" placeholder="למשל: סמן ש${esc(first(sPlaced))} הגיע היום" autocomplete="off"><button class="btn primary" id="cmdGo" aria-label="ביצוע">${ic('send')}</button></div>
        <div class="chips" id="chips">
          <button class="chip" data-cmd="סמן ש${esc(first(sPlaced))} הגיע היום">סמן ש${esc(first(sPlaced))} הגיע היום</button>
          <button class="chip" data-cmd="מי לא הגיע השבוע">מי לא הגיע השבוע</button>
          <button class="chip" data-cmd="הגש את הנוכחות של ${esc(MGS[0])}">הגש את הנוכחות של ${esc(MGS[0])}</button>
          <button class="chip" data-cmd="מצא מעסיקים ל${esc(MGS[0])}">מצא מעסיקים ל${esc(MGS[0])}</button>
          <button class="chip" data-cmd="מה חסר ל${esc(first(sNone))}">מה חסר ל${esc(first(sNone))}</button>
          <button class="chip" data-cmd="אין תעסוקה ב-${MONTH.today}.${MONTH.m} לכיתה ${esc(classes[0])}, פורים">אין תעסוקה ב-${MONTH.today}.${MONTH.m} לכיתה ${esc(classes[0])}</button>
        </div>
        <div class="agent-out" id="agentOut" hidden></div>
      </details>
    </aside>

    <div class="content">
    <section class="sec overview" id="overview">
      <div class="sec-head row-head"><h2 id="ovTitle">החניכות ב${esc(SCHOOL)}</h2></div>
      <div class="kpis" id="kpis"></div>
      <h3 class="sub-h">תעסוקה לפי מגמה · ${esc(MONTH.label)}</h3>
      <div class="mg-table cards" id="mgTable"></div>
      <h3 class="sub-h">איפה התלמידים בפירמידת החניכות</h3>
      <div class="pyr" id="pyr"></div>
    </section>

    <section class="sec att" id="att">
      <div class="sec-head att-head"><h2>דיווח נוכחות</h2><label class="mon-lbl">חודש הדיווח <select class="mon-pick" id="monPick" aria-label="חודש הדיווח">${(() => { const N = Store.monthsBack(), opt = b => { const m = Store.monthInfo(b); return `<option value="${b}" ${MONTH.back === b ? 'selected' : ''}>${esc(m.label)}</option>`; }; const open = [0, 1].filter(b => b <= N).map(opt).join(''), old = []; for (let b = 2; b <= N; b++) old.push(opt(b)); return open + (old.length ? `<optgroup label="חודשים קודמים">${old.join('')}</optgroup>` : ''); })()}</select></label><button class="btn quiet" data-act="att-close">${ic('back')}חזרה</button></div>
      <div class="confirm" id="prevBar" hidden></div>
      <div class="finder"><span class="finder-ic">${ic('search')}</span><input id="find" class="find big" placeholder="כיתה או מספר פעולה" autocomplete="off"></div>
      <div class="emp-b edit att-pull"><button class="btn" data-act="mentor-pull">${ic('download')}משיכת סימוני המנטור.ית</button><span class="hint">מה שהמנטורים סימנו בקישור שלהם · רק ימים שלא סומנו כאן</span></div>
      <div id="grpList" class="grp-list" hidden></div>
      <div id="roster" class="roster" hidden></div>
    </section>

    <section class="sec" id="students">
      <div class="sec-head row-head"><h2>התלמידים שלי</h2><button class="btn primary edit" data-act="new-stu">${ic('plus')}תלמיד.ה חדש.ה</button></div>
      <div class="confirm edit" id="updBar" hidden></div>
      <div class="stu-filters"><label class="mon-lbl">קבוצה <select class="mon-pick stu-sel" id="stuCls"><option value="">כל הקבוצות</option></select></label><label class="mon-lbl">מגמה <select class="mon-pick stu-sel" id="stuMg"><option value="">כל המגמות</option></select></label></div>
      <div class="finder"><span class="finder-ic">${ic('search')}</span><input id="stuFind" class="find" placeholder="חיפוש חופשי: שם, קבוצה, מגמה או מספר פעולה" autocomplete="off"></div>
      <div id="stuHits" hidden></div>
      <div id="stuList"></div>
    </section>

    <section class="sec" id="employers">
      <div class="sec-head row-head"><h2>איפה התלמידים עובדים</h2><div class="emp-b edit"><button class="btn primary" data-act="new-emp">${ic('plus')}מעסיק חדש</button><button class="btn" data-act="wiz">${ic('map')}אשף מציאת מעסיקים</button></div></div>
      <div class="tabs" id="empTabs"><button class="tab cur" data-tab="out">${ic('building')}מעסיקים בחוץ</button><button class="tab" data-tab="in">${ic('home')}עסק בית-ספרי</button><button class="tab" data-tab="leads">${ic('user')}פניות <span id="leadsN"></span></button></div>
      <div id="panelOut"></div>
      <div id="panelIn" hidden></div>
      <div id="panelLeads" hidden></div>
    </section>

    <section class="sec" id="checklist">
      <div class="sec-head"><h2>צ'ק ליסט של רכז.ת החניכות</h2></div>
      <div class="tabs" id="chkTabs"><button class="tab cur" data-tab="stu">${ic('user')}לפי תלמיד.ה</button><button class="tab" data-tab="cal">${ic('gantt')}הגאנט השנתי</button></div>
      <div id="chkStu"></div>
      <div id="chkCal" hidden></div>
    </section>

    <section class="sec" id="program">
      <div class="sec-head row-head"><div><h2>תוכנית חניכות · תשפ״ז</h2><p class="hint">רכיב "מקצוע וחניכות" בסל התוכניות · 35% מהסל · <a href="${SITE}takziv-sal.html" target="_blank" rel="noopener">המקור</a></p></div><div class="emp-b"><button class="btn primary edit" data-act="prog-add">${ic('plus')}הוספת פעילות</button><button class="btn" data-act="prog-print">${ic('print')}דוח להדפסה</button></div></div>
      <div id="progBody"></div>
    </section>

    <section class="sec" id="links">
      <div class="sec-head row-head"><div><h2>טפסים וקישורים חשובים</h2><p class="hint">מהמרחב הפדגוגי · <span dir="ltr">pedagogiamh.co.il</span></p></div></div>
      <div id="linksBody"></div>
    </section>

    <section class="sec" id="reports">
      <div class="sec-head"><h2>דוחות</h2></div>
      <div class="rows" id="repRows"></div>
    </section>

    <section class="sec" id="admin">
      <div class="sec-head"><h2>ניהול</h2></div>
      <div class="rows" id="admRows"></div>
    </section>

    <section class="sec" id="more">
      <div class="sec-head"><h2>עוד</h2></div>
      <div class="rows">
        ${NAV.filter(([v]) => !TABS.includes(v)).map(([v, i, l]) => `<a class="rowbtn" href="#${v}">${ic(i)}<b>${l}</b><span></span>${chev}</a>`).join('')}
        <button class="rowbtn" data-act="logout">${ic('out')}<b>יציאה</b><span></span>${chev}</button>
      </div>
    </section>

    <section class="sec" id="sub">
      <div class="sec-head row-head sub-head"><button class="btn quiet noprint" data-act="sub-back">${ic('back')}חזרה</button><h2 id="subTitle"></h2></div>
      <div id="subBody"></div>
    </section>
    </div>
  </main>
  <footer class="foot"><a class="btn quiet" id="helpLink" href="mailto:merhav@pedagogiamh.co.il?subject=${encodeURIComponent('מערכת רכזי החניכות · ' + SCHOOL + ' · תקלה')}&amp;body=${encodeURIComponent('שלום,\nנתקלתי בבעיה במערכת רכזי החניכות.\n\nבית הספר: ' + SCHOOL + '\nבאיזה מסך: \nמה קרה: \n')}">${ic('mail')}נתקלתם בבעיה?</a><br>המרחב הפדגוגי · המנהל להכשרה מקצועית · משרד העבודה<br><a href="https://impactos.co.il/" dir="ltr">impactos</a> נבנה על ידי</footer>
  <nav class="tabbar" id="tabbar">${TABS.map(v => { const [, i, l] = NAV.find(n => n[0] === v); return `<a href="#${v}" data-tab="${v}">${ic(i)}<span>${l}</span></a>`; }).join('')}<a href="#more" data-tab="more">${ic('dots')}<span>עוד</span></a></nav>
  <div class="toast" id="toast" hidden></div>`;

  let toastT; function toast(m) { const t = $('toast'); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 2600); }
  const copyTxt = (t, m) => (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast(m || 'הועתק'), () => toast('ההעתקה לא הצליחה'));

  /* ================= ניווט, תפקידים, מסכי משנה והיסטוריה ================= */
  const VIEWS = ['overview', 'att', 'students', 'employers', 'checklist', 'links', 'reports', 'admin', 'more', 'sub'];
  let ROLE = 'rakaz';
  const ROLE_LBL = { rakaz: 'רכז.ת החניכות', manager: 'מנהל.ת בית הספר', pedco: 'רכז.ת פדגוגי.ת', system: 'מנהל.ת המערכת · המרחב הפדגוגי', staff: 'מטה', ped: 'מפקח.ת פדגוגי.ת', pro: 'מפקח.ת מקצועי.ת', net: 'מנהל.ת רשת' };
  function setRole(r) { ROLE = r; document.body.dataset.role = r; $('roleLbl').textContent = (r === 'system' ? '' : SCHOOL + ' · ') + ROLE_LBL[r]; $('ovTitle').textContent = 'החניכות ב' + SCHOOL; }
  const SUBS = []; let subParent = 'overview'; const SCROLL = {};
  const cur = () => document.body.dataset.view;
  const topSub = () => SUBS[SUBS.length - 1];
  function paintSub() {
    const s = topSub(); subParent = s.parent || subParent;
    $('subTitle').innerHTML = typeof s.title === 'function' ? s.title() : s.title;
    /* גוף חדש בכל ציור — כדי שמאזינים של מסך קודם לא יפעלו במסך הזה */
    const old = $('subBody'), body = old.cloneNode(false); old.replaceWith(body); body.innerHTML = s.html();
    if (s.bind) s.bind(body, s);
    if (ROLE !== 'rakaz') body.querySelectorAll('input,select,textarea,button.dp,button[data-stage]').forEach(x => { if (!x.classList.contains('view-ok')) x.disabled = true; });
    if (s.dirtyWatch) body.addEventListener('input', () => { s.dirty = true; });
    markNav();
  }
  function refreshSub() { if (SUBS.length && cur() === 'sub') paintSub(); }
  function openSub(spec, o = {}) {
    const from = cur();
    if (from !== 'sub') { SCROLL[from] = window.scrollY; spec.parent = spec.parent || from; }
    else spec.parent = spec.parent || topSub().parent;
    if (o.replace && SUBS.length) { SUBS[SUBS.length - 1] = spec; history.replaceState({ v: 'sub', d: SUBS.length }, '', '#sub'); }
    else { SUBS.push(spec); history.pushState({ v: 'sub', d: SUBS.length }, '', '#sub'); }
    paintSub(); document.body.dataset.view = 'sub'; window.scrollTo(0, 0);
  }
  function closeSub() { history.back(); }
  window.addEventListener('popstate', e => {
    const st = e.state || { v: 'overview', d: 0 };
    const t = topSub();
    if (t && t.dirty && cur() === 'sub' && (st.v !== 'sub' || st.d < SUBS.length) && !confirm('לצאת בלי לשמור?')) { history.pushState({ v: 'sub', d: SUBS.length }, '', '#sub'); return; }
    if (st.v === 'sub') {
      while (SUBS.length > st.d) SUBS.pop();
      if (SUBS.length && SUBS.length === st.d) { paintSub(); document.body.dataset.view = 'sub'; window.scrollTo(0, 0); return; }
      SUBS.length = 0; renderMain(); go(subParent, { pop: true, scroll: SCROLL[subParent] }); return;
    }
    const fromSub = SUBS.length > 0; SUBS.length = 0; renderMain();
    go(st.v, { pop: true, scroll: fromSub ? SCROLL[st.v] : 0 });
  });
  function markNav() {
    const v = cur() === 'sub' ? subParent : cur();
    const navHit = [...document.querySelectorAll('#nav a')].some(a => a.getAttribute('href') === '#' + v);
    document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('cur', a.getAttribute('href') === '#' + (navHit ? v : 'more')));
    const tab = TABS.includes(v) ? v : 'more';
    document.querySelectorAll('#tabbar a').forEach(a => a.classList.toggle('cur', a.dataset.tab === tab));
  }
  function go(view, o = {}) {
    if (!VIEWS.includes(view) || view === 'sub') view = 'overview';
    /* יציאה מטופס שלא נשמר — גם דרך התפריט, לא רק ב"חזרה" */
    if (!o.pop && cur() === 'sub' && SUBS.some(x => x.dirty) && !confirm('לצאת בלי לשמור?')) return;
    if (!o.pop) SUBS.length = 0;
    const same = cur() === view;
    document.body.dataset.view = view;
    markNav();
    window.scrollTo(0, o.scroll || 0);
    if (view === 'att' && matchMedia('(pointer:fine)').matches) $('find').focus();
    try { if (o.pop) { } else if (o.replace || same) history.replaceState({ v: view, d: 0 }, '', '#' + view); else history.pushState({ v: view, d: 0 }, '', '#' + view); } catch (e) {}
  }
  function renderMain() { renderPrevBar(); renderRoster(); renderOverview(); renderStuList(); renderEmps(); renderChkStu(); renderChkCal(); renderProgram(); renderReports(); renderAdmin(); }
  const logout = () => { if (SUBS.some(x => x.dirty) && !confirm('לצאת בלי לשמור?')) return; R.hooks.logout(); };
  $('logout').onclick = logout;
  /* החודש המוצג: הנוכחי או הקודם (להגשה בתחילת החודש). מחליפים — הנתונים נטענים מחדש */
  $('monPick').onchange = e => R.hooks.setBack(+e.target.value);
  /* תזכורת: החודש הקודם עוד לא הוגש (או הוגש חלקית) — רק כשמסתכלים על החודש הנוכחי ויש תלמידים */
  function renderPrevBar() {
    const b = $('prevBar'); if (!b) return;
    const pm = Store.monthInfo(1), sub = (R.MONS || {})[pm.ym] || {}, open = MGS.filter(m => !sub[m]);
    const show = MONTH.back === 0 && Store.monthsBack() >= 1 && active().length > 0 && open.length > 0;
    b.hidden = !show; if (!show) { b.innerHTML = ''; return; }
    b.innerHTML = `<p><b>${esc(pm.label)} עוד לא הוגש</b>${open.length < MGS.length ? ' · ' + open.map(esc).join(', ') : ''}. הדיווח הוא על החודש שעבר.</p><div class="confirm-b"><button class="btn primary" data-act="go-prev">${ic('cal')}לדיווח על ${esc(pm.name)}</button></div>`;
    b.querySelector('[data-act="go-prev"]').onclick = () => R.hooks.setBack(1);
  }
  document.addEventListener('click', e => {
    if (e.target.closest('[data-act="logout"]')) return logout();
    const a = e.target.closest('a[href^="#"]'); if (!a || a.dataset.open || a.dataset.sub) return;
    const v = a.getAttribute('href').slice(1); if (VIEWS.includes(v)) { e.preventDefault(); go(v); }
  });
  document.querySelector('[data-act="att"]').onclick = () => go('att');
  document.querySelector('[data-act="att-close"]').onclick = () => go('overview');
  document.querySelector('[data-act="sub-back"]').onclick = closeSub;
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && cur() === 'sub') closeSub(); });

  /* ================= סקירה + מה דורש טיפול ================= */
  const cellsRow = (vals, labels) => vals.map((v, i) => `<span${i && labels[i] ? ` data-l="${labels[i]}"` : ''}>${v}</span>`).join('');
  function renderOverview() {
    const L = active(), out = L.filter(s => PLACE(s.emp) === 'out').length, inn = L.filter(s => PLACE(s.emp) === 'in').length, st = attStat(L), sub = MGS.filter(m => SUBMITTED[m]).length;
    const both = FRAMES === 'both';
    const kp = [[L.length, 'תלמידים בחניכות'], [out, both ? 'עובדים בחוץ' : 'עובדים'], [inn, 'עובדים בעסק בית-ספרי'], [L.length - out - inn, 'לא מועסקים'], [st.pct + '%', 'נוכחות ' + MONTH.name + (st.unmarked ? `<small>${st.unmarked} ימים לא סומנו</small>` : '')], [`${sub}/${MGS.length}`, 'מגמות הוגשו']];
    $('kpis').innerHTML = kp.filter((_, i) => !(i === 1 && FRAMES === 'in') && !(i === 2 && FRAMES === 'out')).map(([n, l]) => `<div class="kpi"><b>${n}</b><span>${l}</span></div>`).join('');
    const cols = ['מגמה', 'תלמידים', both ? 'בחוץ' : 'עובדים', 'עסק בית-ספרי', 'לא מועסקים', 'נוכחות', 'הגשה'];
    const keep = (_, i) => !(i === 2 && FRAMES === 'in') && !(i === 3 && FRAMES === 'out');
    const lab = cols.filter(keep);
    $('mgTable').innerHTML = `<div class="mg-row mg-head">${lab.map(c => `<span>${c}</span>`).join('')}</div>` +
      MGS.map(m => { const l = L.filter(s => s.mg === m), o = l.filter(s => PLACE(s.emp) === 'out').length, n = l.filter(s => PLACE(s.emp) === 'in').length, p = attPct(l), none = l.length - o - n;
        return `<div class="mg-row">${cellsRow([`<button class="lnk mg-open" data-mg="${esc(m)}" title="לתלמידי המגמה"><b>${esc(m)}</b></button>`, l.length, o, n, `<span class="${none ? 'warn' : ''}">${none}</span>`, `<i class="pbar"><i style="width:${p}%"></i></i>${p}%`, SUBMITTED[m] ? '<em class="tag ok">הוגש</em>' : '<em class="tag no">טרם</em>'].filter(keep), lab)}</div>`; }).join('');
    $('mgTable').classList.toggle('six', !both);
    const cnt = STAGES.map((_, i) => L.filter(s => s.stage === i).length);
    $('pyr').innerHTML = `<div class="pyr-bar">${STAGES.map((st2, i) => cnt[i] ? `<span class="pyr-seg s${i}" style="flex:${cnt[i]}" title="${st2}">${cnt[i]}</span>` : '').join('')}</div><div class="pyr-leg">${STAGES.map((st2, i) => `<span><i class="s${i}"></i>${st2} · ${cnt[i]}</span>`).join('')}</div>`;
    renderToday();
  }
  function renderToday() {
    const L = active(), items = [];
    const left = attStat(L).unmarked;
    if (left) items.push(`<li><span class="dot urgent"></span><b>נוכחות ${esc(MONTH.name)}</b> — ${left} ימים עוד לא סומנו. <a href="#att">לדיווח</a></li>`);
    L.filter(s => s.status === 'לומד' && (LEAVING.test(s.note) || Object.values(NOTES[s.id]).some(n => LEAVING.test(n)))).forEach(s => { const n = [s.note, ...Object.values(NOTES[s.id])].find(x => LEAVING.test(x || '')); items.push(`<li><span class="dot urgent"></span><b>${esc(s.name)}</b> — לבדוק אם עוד לומד.ת: "${esc(n)}". <a href="#" data-open="${s.id}">לתיק</a></li>`); });
    L.filter(s => dates(s).filter(d => ATT[s.id][d] === 'a').length >= 2).forEach(s => { const ds = dates(s).filter(d => ATT[s.id][d] === 'a'), n = streak(s, MONTH.today); items.push(`<li><span class="dot urgent"></span><b>${esc(s.name)}</b> לא הגיע.ה ${ds.length} פעמים: ${ds.map(d => d + '.' + MONTH.m).join(', ')}.${n >= REM_CFG.streak ? ` <b>${n} ברצף</b> · רכז.ת השכבה מעודכנ.ת.` : ''} <a href="#" data-open="${s.id}">לתיק</a></li>`); });
    const pd = pending().length; if (pd) items.push(`<li><span class="dot"></span><b>${pd} תזכורות על היעדרות</b> יוצאות היום ב-16:00. <a href="#" data-sub="rem">לרשימה</a></li>`);
    const none = L.filter(s => !s.emp);
    if (none.length) items.push(`<li><span class="dot"></span><b>${none.length} בלי מקום עבודה:</b> ${none.map(s => `<a href="#" data-open="${s.id}">${esc(first(s))}</a>`).join(', ')}</li>`);
    openLeads().filter(l => leadDue(l) || (/פניתי/.test(l.st) && leadStale(l))).forEach(l => items.push(`<li><span class="dot"></span><b>${esc(l.name)}</b> — ${esc((leadDue(l) ? l.next : (lastLog(l) || {}).text || l.note || '').slice(0, 70))} <a href="#employers">למעסיקים</a></li>`));
    // תוכנית חניכות מוסתרת כרגע (31.10.26)
    // const unrec = PROG.items.filter(x => x.done && !x.rec).length;
    // if (unrec) items.push(`<li><span class="dot"></span><b>תוכנית חניכות:</b> ${unrec} הוצאות בלי קבלה. <a href="#program">לתוכנית</a></li>`);
    $('todoList').innerHTML = items.join(''); $('todayN').textContent = items.length;
  }

  /* ================= נוכחות ================= */
  const norm = s => String(s || '').replace(/["'״׳\s]/g, '');
  let shown = [];
  function find(q) { const n = norm(q), ex = active().filter(s => norm(s.cls) === n); shown = !n ? [] : ex.length ? ex : active().filter(s => norm(s.cls).startsWith(n) || (s.act && s.act.startsWith(n)) || s.name.includes(q.trim())); renderRoster(); }
  /* רשימה שנטענה מראש: אין מספר כיתה, אז בוחרים קבוצה. המספור לפי סדר מספרי הפעולה */
  function renderGroups() {
    const box = $('grpList'); if (!box) return;
    const L = active().filter(s => s.act); box.hidden = !L.length; if (!L.length) { box.innerHTML = ''; return; }
    const cur = shown.length && shown.every(s => s.cls === shown[0].cls) ? shown[0].cls : '';
    const names = [...new Set(L.map(s => s.cls))].sort((a, b) => a.localeCompare(b, 'he', { numeric: true }));
    box.innerHTML = names.map(c => { const g = L.filter(s => s.cls === c); return `<button class="grp-btn ${c === cur ? 'on' : ''}" data-grp="${esc(c)}"><b>${esc(c)} · ${g.length} תלמידים</b><small>מספר פעולה ${esc(g[0].act)}</small><small>${[...new Set(g.map(s => s.mg))].map(esc).join(', ')}</small></button>`; }).join('');
  }
  $('find').oninput = e => find(e.target.value);
  $('grpList').onclick = e => { const b = e.target.closest('[data-grp]'); if (b) { $('find').value = b.dataset.grp; find(b.dataset.grp); } };
  const tmTxt = t => t && (t.i || t.o) ? `<span class="tm">${esc(t.i || '')}–${esc(t.o || '')}</span>` : '';
  const offWhy = (s, d) => OFF[s.cls] && OFF[s.cls][d];
  const stLbl = (s, d) => { const v = ATT[s.id][d]; return v === 'a' ? 'לא הגיע.ה' : v === 'x' ? 'היעדרות באישור' : v === 'n' ? (offWhy(s, d) || (suspended(s, d) ? 'השעיה' : 'לא בעבודה')) : v ? 'הגיע.ה' : 'לא סומן'; };
  /* תא יום (3.11.26, מהפיילוט): יום בשבוע + תאריך, סימן ✓/✗ בתוך התא, "היום" במסגרת, ימים עתידיים מעומעמים ולא לחיצים */
  const isFuture = d => !MONTH.back && d > MONTH.today, isToday = d => !MONTH.back && d === MONTH.today;
  const cellHtml = (s, d, btn) => { const v = ATT[s.id][d], note = NOTES[s.id][d], t = TIMES[s.id][d], lbl = stLbl(s, d); const tt = t && (t.i || t.o) ? ` · ${t.i || ''}–${t.o || ''}` : ''; const lock = btn && ((v === 'n' && (offWhy(s, d) || suspended(s, d))) || isFuture(d)); return `<${btn ? 'button' : 'span'} class="cell ${v || ''} ${note ? 'has-note' : ''} ${isToday(d) ? 'today' : ''} ${isFuture(d) ? 'future' : ''}" data-d="${d}" ${lock ? 'disabled' : ''} title="${esc(lbl + tt + (note ? ' · ' + note : ''))}" aria-label="${wd(d)} ${d}.${MONTH.m} · ${esc(lbl + tt + (note ? ' · הערה: ' + note : ''))}"><small>${wd(d)}</small><span>${d}</span></${btn ? 'button' : 'span'}>`; };
  function dayLines(s) { const ds = [...new Set([...Object.keys(NOTES[s.id]), ...Object.keys(TIMES[s.id]).filter(d => TIMES[s.id][d].i || TIMES[s.id][d].o)])].map(Number).sort((a, b) => a - b); return ds.length ? `<ul class="day-notes">${ds.map(d => `<li><b>${d}.${MONTH.m}</b> ${tmTxt(TIMES[s.id][d])} ${esc(NOTES[s.id][d] || '')}</li>`).join('')}</ul>` : ''; }
  /* "לא ברשימה · לבדיקה": מי שלא הופיע.ה ברשימה המעודכנת (d7). נשאר.ת עד שהרכז.ת מעדכנ.ת מצב או שהרשימה הבאה כוללת אותו.ה */
  const missTag = s => s.statusSrc === 'list-missing' ? ' <em class="tag no">לא ברשימה · לבדיקה</em>' : '';
  const statusTag = s => (s.status === 'עזב' ? ' <em class="tag no">עזב.ה</em>' : s.status === 'מושעה' ? ` <em class="tag susp">מושעה.ת${s.susp && s.susp.to ? ' עד ' + esc(s.susp.to) : ''}</em>` : '') + missTag(s);
  const LEGEND = `<p class="att-how">הקשה אחת על היום = <b>✓ הגיע.ה</b> · הקשה שנייה = <b>✗ לא הגיע.ה</b> · שלישית מנקה. היעדרות באישור, הערה ושעות: בכפתור "הערה או שעות" של התלמיד.ה.</p>
      <div class="att-legend" aria-label="מקרא"><span><i class="cell x"></i>באישור</span><span><i class="cell n"></i>לא בעבודה</span><span><i class="cell today"></i>היום</span><span><i class="cell future"></i>עוד לא הגיע</span><span><i class="cell has-note"></i>יש הערה</span></div>`;
  function renderRoster() {
    renderGroups();
    const r = $('roster');
    if (!shown.length) { r.innerHTML = $('find').value ? '<p class="empty">לא נמצא.</p>' : ''; r.hidden = !$('find').value; return; }
    shown = shown.filter(s => STU.includes(s));
    r.hidden = false;
    /* ההגשה היא של המגמה כולה, לא של מי שמופיע בחיפוש */
    const mg = shown[0].mg, cls = shown[0].cls, offs = Object.entries(OFF[cls] || {}).sort((a, b) => a[0] - b[0]);
    const gmgs = [...new Set(shown.map(s => s.mg))], open = gmgs.filter(m => !SUBMITTED[m]), sub = !open.length, ed = canEdit();
    const grp = active().filter(s => open.includes(s.mg)), left = grp.reduce((n, s) => n + dates(s).filter(d => d <= MONTH.today && !ATT[s.id][d]).length, 0);
    r.innerHTML = `<div class="roster-head"><b>${esc(cls)}${shown.every(s => s.mg === mg) ? ' · ' + esc(mg) : ''}</b>${gmgs.some(m => SUBMITTED[m]) ? `<span class="tag ok">הוגש${open.length ? ': ' + gmgs.filter(m => SUBMITTED[m]).map(esc).join(', ') : ''}</span><button class="lnk off-btn edit" data-act="reopen">${ic('pen')}פתיחה לתיקון</button>` : ''}${sub ? '' : `<button class="lnk off-btn edit" data-act="off-open">${ic('cal')}יום בלי תעסוקה</button>`}</div>
      ${LEGEND}
      ${offs.length ? `<div class="off-list">${offs.map(([d, w]) => `<span class="off-chip">${wd(+d)} ${d}.${MONTH.m} · ${esc(w)}${sub ? '' : `<button class="edit" data-off-del="${d}" aria-label="ביטול">×</button>`}</span>`).join('')}</div>` : ''}
      ${shown.map(s => { const ds = dates(s), a = ATT[s.id], p = ds.filter(d => present(a[d])).length, nn = Object.keys(NOTES[s.id]).length + Object.values(TIMES[s.id]).filter(t => t.i || t.o).length, rc = remCount(s.id);
        return `<div class="row ${s.status === 'עזב' ? 'left' : ''}" data-sid="${s.id}"><div class="who"><button class="name" data-open="${s.id}">${esc(s.name)}</button>${statusTag(s)}<small>${esc(empName(s.emp))}${s.days.length ? ' · ' + s.days.map(d => 'אבגדהו'[d] + '׳').join(' ') : ''}</small>${s.note ? `<small class="snote">${esc(s.note)}</small>` : ''}</div>
        <div class="cells">${ds.map(d => cellHtml(s, d, ed && !SUBMITTED[s.mg])).join('')}${ds.length ? '' : '<span class="hint">אין ימי עבודה</span>'}</div><div class="sum"><span>${p} מתוך ${MONTH.back ? ds.length : ds.filter(d => d <= MONTH.today).length}${MONTH.back ? '' : ' עד היום'}${hoursTxt(s)}</span><button class="lnk note-btn" data-notes="${s.id}">${ic('pen')}${nn ? 'הערות ושעות · ' + nn : 'הערה או שעות'}</button>${rc ? `<button class="lnk note-btn" data-open="${s.id}">${ic('bell')}תזכורות · ${rc}</button>` : ''}</div></div>`; }).join('')}
      <div class="roster-foot edit"><button class="btn primary big" data-act="submit" ${sub ? 'disabled' : ''}>${ic('send')}${sub ? 'הוגש' : 'שליחת הדיווח · ' + open.map(esc).join(', ') + ' · ' + esc(MONTH.name)}</button>${sub ? '' : `<span class="hint">כל המגמה: ${grp.length} תלמידים${left ? ` · ${left} ימים עוד לא סומנו` : ''}</span>`}<span class="hint">סה"כ שעות ${esc(MONTH.name)}: <b>${fmtH(shown.reduce((n, s) => n + hoursOf(s).h, 0))}</b></span></div>`;
  }
  /* אחרי כל שינוי נוכחות — מכל מסלול — השלב בפירמידה מחושב מחדש */
  const afterAtt = () => { STU.forEach(s => { s.stage = stageOf(s); }); renderStuList(); renderRoster(); renderOverview(); renderChkStu(); refreshSub(); };
  /* משיכת מה שהמנטורים סימנו בקישור שלהם (Mentor.pull): נוכחות רק לימים שלא סומנו כאן ולמגמה שלא הוגשה; משוב המעסיק לטופס 5/6 אם עוד לא מולא */
  const dOf = at => { const m = String(at || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? +m[3] + '.' + +m[2] : TODAY; };
  async function mentorPull(b) {
    if (!window.Mentor) return toast('הקישור למנטור.ית לא זמין');
    if (b) b.disabled = true;
    try {
      const r = await Mentor.pull(MONTH.ym), marks = r.marks || r.att || [];
      let n = 0, kept = 0, locked = 0, nf = 0;
      marks.forEach(m => { const s = STU.find(x => x.id === m.sid), d = +m.d; if (!s || !['p', 'a', 'x'].includes(m.v) || !(d >= 1 && d <= MONTH.last)) return; if (SUBMITTED[s.mg]) { locked++; return; } if (ATT[s.id][d]) { kept++; return; } ATT[s.id][d] = m.v; n++; });
      (r.fb || []).forEach(f => { const s = STU.find(x => x.id === f.sid), i = f.period === 'fb2' ? 6 : 5; if (!s || hasForm(s, i)) return;
        const a = {}; (f.scores || []).forEach((v, j) => { if (j < NISPACH_A.length && v >= 1 && v <= 4) a['q' + j] = String(v); }); const o = f.open || {};
        if (o.work) a.q18 = String(o.work); if (o.add) a.q19 = String(o.add); if (o.improve) a.q20 = String(o.improve);
        if (!Object.keys(a).length) return; s.forms[i] = { d: dOf(f.at), a, st: 'done' }; s.log.unshift({ d: TODAY, t: MILES[i][0] + ' · מולא בקישור המנטור.ית' + (o.mentor ? ' · ' + o.mentor : ''), form: true }); nf++; });
      afterAtt(); renderChkCal();
      toast(`נמשכו ${n} סימונים${kept ? ` · ${kept} כבר היו מסומנים כאן` : ''}${locked ? ` · ${locked} במגמה שהוגשה` : ''}${nf ? ` · ${nf} משובי מעסיק` : ''}`);
    } catch (err) { toast('המשיכה לא הצליחה (' + (err.message || err) + ')'); }
    if (b) b.disabled = false;
  }
  document.querySelector('[data-act="mentor-pull"]').onclick = ev => mentorPull(ev.currentTarget);
  $('roster').onclick = e => {
    const c = e.target.closest('.cell'); if (c && !canEdit()) return; if (c && !c.disabled && c.tagName === 'BUTTON') { const sid = c.closest('.row').dataset.sid, d = +c.dataset.d, cv = ATT[sid][d]; /* ✓ → ✗ → ריק. "באישור" רק ממסך ההערות */ ATT[sid][d] = cv === 'p' || cv === 's' ? 'a' : cv === 'a' || cv === 'x' ? '' : 'p'; if (!ATT[sid][d]) delete ATT[sid][d]; const s = STU.find(x => x.id === sid); s.stage = stageOf(s); afterAtt(); return; }
    const nb = e.target.closest('[data-notes]'); if (nb) { openSub(notesSpec(STU.find(s => s.id === nb.dataset.notes))); return; }
    const od = e.target.closest('[data-off-del]'); if (od) { removeOff(shown[0].cls, +od.dataset.offDel); afterAtt(); toast('היום הוחזר לדיווח'); return; }
    if (e.target.closest('[data-act="off-open"]')) { openSub(offSpec(shown[0].cls)); return; }
    if (!canEdit()) return;
    if (e.target.closest('[data-act="submit"]')) {
      const mgs = [...new Set(shown.map(s => s.mg))].filter(m => !SUBMITTED[m]); if (!mgs.length) return;
      const parts = mgs.map(m => { const l = active().filter(s => s.mg === m), miss = l.reduce((n, s) => n + dates(s).filter(d => d <= MONTH.today && !ATT[s.id][d]).length, 0); return `${m}: ${l.length} תלמידים${miss ? `, ${miss} ימים עוד לא סומנו` : ', הכול מסומן'}`; });
      if (!confirm(`להגיש את נוכחות ${MONTH.name} של כל המגמה?\n\n${parts.join('\n')}\n\nאחרי ההגשה החודש נעול.`)) return;
      mgs.forEach(m => SUBMITTED[m] = true); afterAtt(); toast('הדיווח של ' + mgs.join(', ') + ' ל' + MONTH.name + ' נשלח'); return;
    }
    if (e.target.closest('[data-act="reopen"]')) {
      const mgs = [...new Set(shown.map(s => s.mg))].filter(m => SUBMITTED[m]);
      if (!mgs.length || !confirm(`לפתוח לתיקון את הדיווח של ${mgs.join(', ')} ל${MONTH.name}?\nאחרי התיקון צריך להגיש שוב.`)) return;
      mgs.forEach(m => delete SUBMITTED[m]); afterAtt(); toast('הדיווח נפתח לתיקון · צריך להגיש שוב');
    }
  };
  /* מסך משנה: הערות ושעות של תלמיד.ה */
  function notesSpec(s) {
    return { title: () => `${esc(s.name)} · הערות ושעות · ${esc(MONTH.name)}`, html: () => `<div class="sub-card"><p class="hint">${esc(empName(s.emp))}${s.days.length ? ' · ' + s.days.map(d => 'אבגדהו'[d] + '׳').join(' ') : ''}</p>
        <div class="nt-list"><div class="nt-row nt-head"><span>יום</span><span>מצב</span><span>הערה</span><span>הגעה</span><span>יציאה</span></div>${dates(s).map(d => { const t = TIMES[s.id][d] || {}, v = ATT[s.id][d], lockN = v === 'n' && (offWhy(s, d) || suspended(s, d)); return `<div class="nt-row"><b class="nt-day">${wd(d)} ${d}.${MONTH.m}</b><select class="nt-sel ${v || ''}" data-st="${d}" aria-label="מצב ל-${d}.${MONTH.m}" ${SUBMITTED[s.mg] || lockN || isFuture(d) ? 'disabled' : ''}>${lockN ? `<option value="n" selected>${esc(stLbl(s, d))}</option>` : [['', 'לא סומן'], ['p', '✓ הגיע.ה'], ['a', '✗ לא הגיע.ה'], ['x', 'היעדרות באישור']].map(([k, l]) => `<option value="${k}" ${(v === 's' ? 'p' : v || '') === k ? 'selected' : ''}>${l}</option>`).join('')}</select><input data-nd="${d}" value="${esc(NOTES[s.id][d] || '')}" placeholder="הערה ליום הזה" aria-label="הערה ל-${d}.${MONTH.m}"><label class="nt-t"><span>הגעה</span><input type="time" data-ti="${d}" value="${esc(t.i || '')}" ${SUBMITTED[s.mg] ? 'disabled' : ''}></label><label class="nt-t"><span>יציאה</span><input type="time" data-to="${d}" value="${esc(t.o || '')}" ${SUBMITTED[s.mg] ? 'disabled' : ''}></label></div>`; }).join('')}</div>${SUBMITTED[s.mg] ? `<p class="hint">הנוכחות של ${esc(s.mg)} הוגשה. לשינוי שעות: "פתיחה לתיקון" במסך הנוכחות.</p>` : ''}
        <div class="emp-b mf-b edit"><button class="btn primary" data-act="done">${ic('check')}סיום</button></div></div>`,
      bind: el => {
        el.addEventListener('change', e => {
          const st = e.target.closest('[data-st]'); if (st) { if (SUBMITTED[s.mg]) return toast('הנוכחות הוגשה · צריך קודם פתיחה לתיקון'); const d = +st.dataset.st; if (st.value) ATT[s.id][d] = st.value; else delete ATT[s.id][d]; s.stage = stageOf(s); afterAtt(); return; }
          const inp = e.target.closest('[data-nd]'); if (inp) { const d = +inp.dataset.nd; if (inp.value.trim()) NOTES[s.id][d] = inp.value.trim(); else delete NOTES[s.id][d]; return; }
          const ti = e.target.closest('[data-ti],[data-to]'); if (ti && SUBMITTED[s.mg]) return toast('הנוכחות הוגשה · צריך קודם פתיחה לתיקון'); if (ti) { const d = +(ti.dataset.ti || ti.dataset.to); const t = TIMES[s.id][d] = TIMES[s.id][d] || {}; if (ti.dataset.ti) t.i = ti.value; else t.o = ti.value; if (!t.i && !t.o) delete TIMES[s.id][d]; else if (!ATT[s.id][d]) ATT[s.id][d] = 'p'; }
        });
        el.querySelector('[data-act="done"]').onclick = closeSub;
      } };
  }
  /* מסך משנה: יום בלי תעסוקה לכל הכיתה */
  function offSpec(cls) {
    return { title: 'יום בלי תעסוקה · ' + esc(cls), html: () => `<div class="sub-card"><div class="off-form"><label class="field"><span>היום</span><select id="offDay">${Array.from({ length: MONTH.last }, (_, i) => i + 1).filter(d => wdOf(d) < 6).map(d => `<option value="${d}" ${d === MONTH.today ? 'selected' : ''}>${wd(d)} ${d}.${MONTH.m}</option>`).join('')}</select></label><label class="field"><span>הסיבה</span><select id="offWhy"><option>פורים</option><option>פסח</option><option>חנוכה</option><option>מרתון מתמטיקה</option><option>טיול שנתי</option><option>יום בלי תעסוקה</option></select></label></div>
        <p class="hint">${STU.filter(s => s.cls === cls && s.status !== 'עזב').length} תלמידים בכיתה</p>
        <div class="emp-b mf-b edit"><button class="btn primary" data-act="save">${ic('check')}לכל ${esc(cls)}</button></div></div>`,
      bind: el => { el.querySelector('[data-act="save"]').onclick = () => { const d = +$('offDay').value, w = $('offWhy').value; applyOff(cls, d, w); closeSub(); toast(`${cls}: ${d}.${MONTH.m} בלי תעסוקה · ${w}`); }; } };
  }

  /* ================= תלמידים ================= */
  /* שורת תלמיד.ה ברשימה (3.11.26, מהפיילוט): שם (פותח תיק), שיבוץ בתיבת בחירה אחת, עיפרון לעריכה ומחיקה */
  const plOptions = s => { const cur = s.emp || ''; const grp = (map, lab) => { const l = Object.entries(map).filter(([id, e]) => id === cur || canPlace(e)); return l.length ? `<optgroup label="${lab}">${l.map(([id, e]) => `<option value="${id}" ${id === cur ? 'selected' : ''}>${esc(e.name)}</option>`).join('')}</optgroup>` : ''; };
    return `<option value="" ${!cur ? 'selected' : ''}>לא מועסק.ת</option>${grp(EMPS, 'מעסיקים')}${grp(INS, 'עסק בית-ספרי')}`; };
  const stuRow = s => `<div class="stu-row ${s.status === 'עזב' ? 'left' : ''}" data-sid="${s.id}"><button class="stu-name" data-open="${s.id}"><b>${esc(s.name)}${statusTag(s)}</b><span>${esc(s.mg)}${s.note ? ' · ' + esc(s.note) : ''}</span></button>${canEdit() ? `<select class="stu-pl" data-pl-sel="${s.id}" aria-label="שיבוץ של ${esc(s.name)}">${plOptions(s)}</select>` : `<span class="stu-emp">${esc(empName(s.emp))}</span>`}<span class="stage s${s.stage}">${STAGES[s.stage]}</span><button class="stu-edit edit" data-edit="${s.id}" aria-label="עריכת הפרטים של ${esc(s.name)}" title="עריכה ומחיקה">${ic('pen')}</button></div>`;
  const clsSort = (a, b) => a.localeCompare(b, 'he', { numeric: true });
  /* הרשימה לפי קבוצה (יא · קבוצה 1 … ואז יב), בכותרת מספר הפעולה והמגמות */
  /* סינון (3.11.26): קבוצה, מגמה וחיפוש חופשי פועלים יחד על אותה רשימה. עם סינון או חיפוש כל הקבוצות פתוחות */
  const STU_F = { cls: '', mg: '', q: '' };
  const stuMatch = s => { const q = STU_F.q, n = norm(q); return (!STU_F.cls || s.cls === STU_F.cls) && (!STU_F.mg || s.mg === STU_F.mg) && (!n || s.name.includes(q) || norm(s.cls).includes(n) || norm(s.mg).includes(n) || (s.act && s.act.startsWith(n))); };
  function stuFilterOpts() {
    const fill = (id, vals, all) => { const sel = $(id); if (!sel) return; const cur = sel.value; sel.innerHTML = `<option value="">${all}</option>` + vals.map(v => `<option value="${esc(v)}" ${v === cur ? 'selected' : ''}>${esc(v)}</option>`).join(''); if (![...sel.options].some(o => o.value === cur)) { sel.value = ''; STU_F[id === 'stuCls' ? 'cls' : 'mg'] = ''; } };
    fill('stuCls', [...new Set(STU.map(s => s.cls).filter(Boolean))].sort(clsSort), 'כל הקבוצות');
    fill('stuMg', [...new Set(STU.map(s => s.mg).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'he')), 'כל המגמות');
  }
  function renderStuList() {
    stuFilterOpts();
    const filtering = !!(STU_F.cls || STU_F.mg || STU_F.q);
    const open = new Set([...document.querySelectorAll('#stuList details[open]')].map(d => d.dataset.cls)), groups = {};
    STU.filter(stuMatch).forEach(s => { const c = s.cls || 'בלי קבוצה'; (groups[c] = groups[c] || []).push(s); });
    const names = Object.keys(groups).sort(clsSort), shownN = names.reduce((n, c) => n + groups[c].length, 0);
    $('stuList').innerHTML = (filtering ? `<p class="hint stu-cnt">${shownN} מתוך ${STU.length} תלמידים${shownN ? '' : ' · <button class="lnk" data-act="stu-clear">ניקוי הסינון</button>'}</p>` : '') +
      (names.map(c => { const l = groups[c], mgs = [...new Set(l.map(s => s.mg).filter(Boolean))], act = l.map(s => s.act).find(Boolean); return `<details class="grp" data-cls="${esc(c)}" ${open.has(c) || names.length === 1 || filtering ? 'open' : ''}><summary>${esc(c)}<small>${l.length} תלמידים${act ? ' · מספר פעולה ' + esc(act) : ''}${mgs.length ? ' · ' + mgs.map(esc).join(', ') : ''}</small></summary>${l.map(stuRow).join('')}</details>`; }).join('') || (filtering ? '<p class="empty">לא נמצא.</p>' : '<p class="empty">אין תלמידים עדיין.</p>'));
  }
  $('stuFind').oninput = e => { STU_F.q = e.target.value.trim(); renderStuList(); };
  $('stuCls').onchange = e => { STU_F.cls = e.target.value; renderStuList(); };
  $('stuMg').onchange = e => { STU_F.mg = e.target.value; renderStuList(); };
  /* סקירה: לחיצה על מגמה פותחת את התלמידים שלה (מסונן; "כל המגמות" מחזיר) */
  $('mgTable').addEventListener('click', e => { const b = e.target.closest('[data-mg]'); if (!b) return; STU_F.mg = b.dataset.mg; STU_F.cls = STU_F.q = ''; $('stuFind').value = ''; $('stuCls').value = ''; $('stuMg').value = STU_F.mg; renderStuList(); go('students'); });
  $('stuList').addEventListener('click', e => { if (e.target.closest('[data-act="stu-clear"]')) { STU_F.cls = STU_F.mg = STU_F.q = ''; $('stuFind').value = ''; $('stuCls').value = ''; $('stuMg').value = ''; renderStuList(); } });
  /* שיבוץ: מקום אחד לכל השינויים (רשימה, מסך המעסיק). התיק משתמש באותם כללים */
  function setEmp(s, v, quiet) {
    v = v || '';
    if (v && !EMPS[v] && !INS[v]) return false;
    if (EMPS[v] && !canPlace(EMPS[v])) { if (!quiet) toast('אי אפשר לשבץ אצל מעסיק שלא אושר במסננת'); return false; }
    const prev = s.emp || ''; if (prev === v) return true;
    s.emp = v; s.hist.unshift({ d: `${TODAY}.${MONTH.y}`, from: prev, to: v, why: '' }); if (!v) s.stageManual = null; else s.why = '';
    s.stage = stageOf(s); if (!quiet) { renderStuList(); renderOverview(); renderChkStu(); renderRoster(); renderEmps(); } return true;
  }
  $('students').addEventListener('change', e => { const sel = e.target.closest('[data-pl-sel]'); if (!sel) return; const s = STU.find(x => x.id === sel.dataset.plSel); if (!s) return; if (!setEmp(s, sel.value)) { sel.value = s.emp || ''; return; } toast(s.name + ': ' + (s.emp ? empName(s.emp) : 'לא מועסק.ת')); });
  $('students').addEventListener('click', e => { const b = e.target.closest('[data-edit]'); if (!b) return; const s = STU.find(x => x.id === b.dataset.edit); if (s) openSub(editStuSpec(s)); });
  /* עריכת הפרטים ומחיקה — מהרשימה ומהתיק */
  function editStuSpec(s) {
    const f = (id, l, v, extra = '') => `<label class="field"><span>${l}</span><input class="find" id="${id}" value="${esc(v || '')}"${extra}></label>`;
    return { dirtyWatch: true, title: () => 'עריכת הפרטים · ' + esc(s.name), html: () => `<div class="sub-card newform">
        <div class="field-row">${f('esName', 'שם מלא', s.name)}${f('esAct', 'מספר פעולה', s.act, ' dir="ltr"')}</div>
        <div class="field-row">${(() => { /* מעבר בין קבוצות ומגמות (3.11.26): בחירה מהקיימות, או "אחר / חדש" */ const sel = (id, label, cur, opts) => `<label class="field"><span>${label}</span><select class="find" id="${id}">${[...new Set([cur, ...opts].filter(Boolean))].sort(clsSort).map(o => `<option value="${esc(o)}" ${o === cur ? 'selected' : ''}>${esc(o)}</option>`).join('')}<option value="__new">אחר / חדש…</option></select><input class="find" id="${id}N" hidden placeholder="${label} חדש.ה"></label>`; return sel('esCls', 'קבוצה / כיתה', s.cls, classes) + sel('esMg', 'מגמה', s.mg, MGS); })()}</div>
        <div class="field-row">${f('esPhone', 'טלפון', s.phone, ' dir="ltr"')}${f('esPhone2', 'טלפון נוסף', s.phone2, ' dir="ltr"')}</div>
        <div class="field-row">${f('esTz', 'תעודת זהות', s.tz, ' dir="ltr"')}${f('esBirth', 'שנת לידה', s.birth, ' dir="ltr" inputmode="numeric"')}</div>
        <div class="emp-b mf-b"><button class="btn primary" id="esSave">${ic('check')}שמירה</button><button class="btn quiet" id="esDel">${ic('trash')}מחיקה מהרשימה</button></div></div>`,
      bind: (el, spec) => {
        if (matchMedia('(pointer:fine)').matches) $('esName').focus();
        ['esCls', 'esMg'].forEach(id => { $(id).onchange = () => { const n = $(id + 'N'); n.hidden = $(id).value !== '__new'; if (!n.hidden) n.focus(); }; });
        const pick = id => $(id).value === '__new' ? $(id + 'N').value.trim() : $(id).value;
        $('esSave').onclick = () => {
          const name = $('esName').value.trim(), cls = pick('esCls'), mg = pick('esMg'), b = $('esBirth').value.trim();
          if (!name) return toast('צריך שם'); if (!cls || !mg) return toast('צריך קבוצה ומגמה'); if (b && !/^\d{4}$/.test(b)) return toast('שנת לידה: 4 ספרות');
          const moved = [cls !== s.cls ? `מקבוצה ${s.cls || '—'} ל${cls}` : '', mg !== s.mg ? `ממגמה ${s.mg || '—'} ל${mg}` : ''].filter(Boolean);
          Object.assign(s, { name, cls, mg, act: $('esAct').value.trim(), phone: $('esPhone').value.trim(), phone2: $('esPhone2').value.trim(), tz: $('esTz').value.trim(), birth: b ? +b : '' });
          if (moved.length) { s.log = s.log || []; s.log.unshift({ d: TODAY, t: 'הועבר.ה ' + moved.join(' · ') }); }
          syncGroups(); spec.dirty = false; renderMain(); closeSub(); toast(moved.length ? name + ': ' + moved.join(' · ') : 'הפרטים של ' + name + ' עודכנו');
        };
        $('esDel').onclick = () => { if (!confirm(`למחוק את ${s.name} מהרשימה? גם הנוכחות וההערות יימחקו. אי אפשר לבטל`)) return; const n = s.name; deleteStu(s); spec.dirty = false; go('students'); toast(n + ' נמחק.ה מהרשימה'); };
      } };
  }
  function deleteStu(s) { const i = STU.indexOf(s); if (i >= 0) STU.splice(i, 1); [ATT, NOTES, TIMES, OFFBAK, SUSPBAK, MANUAL].forEach(o => { delete o[s.id]; }); syncGroups(); renderMain(); }
  document.querySelector('[data-act="new-stu"]').onclick = () => openSub(newStuSpec());
  /* מזהה אקראי — לא נגזר מהשם */
  const newId = p => p + Array.from(crypto.getRandomValues(new Uint8Array(6)), b => 'abcdefghijkmnpqrstuvwxyz23456789'[b % 32]).join('');
  /* הוספה ידנית (statusSrc 'manual') או מרשימה מעודכנת ('list', עם ת"ז, קוד מגמה ושאר השדות של הקובץ). quiet = בלי ציור, כשמוסיפים הרבה */
  function addStu(v, quiet) {
    const s = { id: newId('T'), name: v.name, mg: v.mg, cls: v.cls, act: v.act || '', emp: '', days: v.days || [], phone: v.phone || '', phone2: v.phone2 || '', tz: v.tz || '', birth: v.birth || '', sex: v.sex || '', docs: mkDocs(0), start: '', note: '', status: 'לומד', statusSrc: v.statusSrc || 'manual', stage: 0, stageManual: null, track: v.track || '', mentor: '', log: [], hist: [], susp: null, forms: {}, created: new Date().toISOString() };
    if (v.mgc) s.mgc = v.mgc;
    STU.push(s); ATT[s.id] = {}; NOTES[s.id] = {}; TIMES[s.id] = {}; OFFBAK[s.id] = {}; SUSPBAK[s.id] = {}; MANUAL[s.id] = new Set();
    if (!quiet) { syncGroups(); renderMain(); }
    return s;
  }

  /* ---- רשימה מעודכנת ממתינה (d7): upd: מוצפנים במפתח חד-פעמי; הקוד מהמייל פותח אותם כאן, בדפדפן בלבד ---- */
  const normName = n => String(n || '').replace(/["'״׳\-\s]/g, '');
  function renderUpd() { const b = $('updBar'); if (!b) return; const u = R.update; b.hidden = !(u && u.recs && u.recs.length && canEdit()); if (b.hidden) { b.innerHTML = ''; return; } b.innerHTML = `<p><b>רשימת תלמידים מעודכנת ממתינה</b> · ${u.recs.length} תלמידים${u.at ? ' · הועלתה ' + esc(String(u.at).slice(0, 10)) : ''}. הקוד שהגיע במייל פותח אותה. מי שכבר ברשימה נשאר.ת כפי שמילאת; חדשים נוספים; מי שלא ברשימה מסומנ.ת לבדיקה ולא נמחק.ת.</p><div class="confirm-b"><button class="btn primary" data-act="upd-open">${ic('lock')}פתיחה עם הקוד</button></div>`; b.querySelector('[data-act="upd-open"]').onclick = () => openSub(updSpec()); }
  /* השוואה: ת"ז קודם; בלי ת"ז (הוספה ידנית) — לפי השם. מי שעזב.ה לא נחשב.ת "לא ברשימה" */
  function updDiff(list) {
    const used = new Set(), news = [], olds = [];
    list.forEach(x => {
      const pv = x.pv, tz = String(pv.tz || '').trim();
      let s = tz ? STU.find(y => !used.has(y.id) && String(y.tz || '').trim() === tz) : null;
      if (!s && pv.name) s = STU.find(y => !used.has(y.id) && !y.tz && normName(y.name) === normName(pv.name));
      if (s) { used.add(s.id); olds.push({ s, x }); } else news.push(x);
    });
    return { news, olds, miss: STU.filter(s => !used.has(s.id) && s.status !== 'עזב') };
  }
  function updApply(d) {
    d.news.forEach(({ p, pv }) => addStu({ name: pv.name, phone: pv.phone, phone2: pv.phone2, tz: pv.tz, birth: pv.birth, sex: pv.sex, act: pv.act, mg: p.mg || '', mgc: p.mgc, cls: p.cls || '', track: p.track, statusSrc: 'list' }, true));
    d.olds.forEach(({ s, x }) => { const { p, pv } = x;
      ['phone', 'phone2', 'birth', 'tz'].forEach(k => { if (!s[k] && pv[k]) s[k] = pv[k]; });
      if (!s.cls && p.cls) s.cls = p.cls; if (!s.mgc && p.mgc) s.mgc = p.mgc;
      if (s.statusSrc === 'list-missing') s.statusSrc = 'list'; });
    d.miss.forEach(s => { s.statusSrc = 'list-missing'; });
    syncGroups(); renderMain();
  }
  function updSpec() {
    let diff = null;
    const names = l => l.map(n => `<li>${esc(n)}</li>`).join('') || '<li class="hint">אין</li>';
    return { title: 'רשימה מעודכנת · הקוד מהמייל', html: () => diff ? `<div class="sub-card"><h3>${ic('user')}מה ישתנה</h3><ul class="chk-items"><li><b>${diff.news.length} חדשים</b> ייתווספו</li><li><b>${diff.olds.length} קיימים</b> יישארו כפי שמילאת (רק טלפון, שנת לידה וקבוצה ריקים יושלמו)</li><li><b>${diff.miss.length} לא ברשימה</b> יסומנו "לא ברשימה · לבדיקה" ולא יימחקו</li></ul>
        <details class="hist"><summary>חדשים<small>${diff.news.length}</small></summary><ul class="chk-items">${names(diff.news.map(x => x.pv.name + ' · ' + (x.p.cls || '')))}</ul></details>
        <details class="hist"><summary>לא ברשימה<small>${diff.miss.length}</small></summary><ul class="chk-items">${names(diff.miss.map(s => s.name + ' · ' + s.cls))}</ul></details>
        <div class="emp-b mf-b"><button class="btn primary" id="updGo">${ic('check')}אישור ומיזוג</button><button class="btn quiet" id="updNo">ביטול</button></div></div>`
      : `<div class="sub-card newform"><p class="hint">הרשימה המעודכנת מוצפנת בקוד חד-פעמי ששלח המרחב הפדגוגי במייל. הקוד פותח אותה כאן בדפדפן בלבד, ואחרי המיזוג הוא לא נחוץ עוד.</p>
        <label class="field"><span>הקוד מהמייל</span><input class="find" id="updCode" dir="ltr" autocomplete="off" placeholder="XXXX-XXXX-XXXX-XXXX-XXXX"></label>
        <p class="hint" id="updMsg"></p><div class="emp-b mf-b"><button class="btn primary" id="updOpen">${ic('lock')}פתיחה</button></div></div>`,
      bind: el => {
        const go = el.querySelector('#updGo'), open = el.querySelector('#updOpen');
        if (open) open.onclick = async () => {
          const u = R.update, code = $('updCode').value.trim(); if (!u) return closeSub(); if (!code) return toast('צריך את הקוד מהמייל');
          open.disabled = true; $('updMsg').textContent = 'פותח…';
          try {
            const key = await CK.unwrapRecovery(code, u.wrap), list = [];
            for (const r of u.recs) { const pv = await CK.decJSON(key, r.e); if (pv) list.push({ p: r.p || {}, pv }); }
            if (!list.length) throw new Error('empty');
            diff = updDiff(list); refreshSub();
          } catch (e) { open.disabled = false; $('updMsg').textContent = 'הקוד לא נכון. כדאי לבדוק אותו מול המייל'; toast('הקוד לא נכון'); }
        };
        if (el.querySelector('#updNo')) el.querySelector('#updNo').onclick = closeSub;
        if (go) go.onclick = async () => {
          const n = { a: diff.news.length, o: diff.olds.length, m: diff.miss.length };
          go.disabled = true; updApply(diff); diff = null;
          const r = await API.call('updateDone');
          if (r.ok) { R.update = null; renderUpd(); closeSub(); toast(`הרשימה מוזגה: ${n.a} נוספו, ${n.o} נשארו, ${n.m} לבדיקה`); }
          else { renderUpd(); closeSub(); toast('התלמידים עודכנו, אבל הרשימה הממתינה לא נסגרה בשרת (' + (r.error || '') + ')'); }
        };
      } };
  }
  function newStuSpec() {
    return { dirtyWatch: true, title: 'תלמיד.ה חדש.ה', html: () => `<div class="sub-card newform">
        <div class="field-row"><label class="field"><span>שם מלא</span><input class="find" id="nsName"></label><label class="field"><span>כיתה</span><input class="find" id="nsCls" value="${esc(classes[0])}"></label></div>
        <div class="field-row"><label class="field"><span>מגמה</span><input class="find" id="nsMg" list="nsMgL" value="${esc(MGS[0] || '')}"><datalist id="nsMgL">${MGS.map(m => `<option value="${esc(m)}">`).join('')}</datalist></label><div class="field"><span>ימי עבודה</span><div class="daypick" id="nsDays">${'אבגדהו'.split('').map((n, i) => `<button type="button" class="dp" data-day="${i}">${n}׳</button>`).join('')}</div></div></div>
        <div class="emp-b mf-b"><button class="btn primary" id="nsSave">${ic('check')}שמירה</button></div></div>`,
      bind: (el, spec) => {
        if (matchMedia('(pointer:fine)').matches) $('nsName').focus();
        $('nsDays').onclick = e => { const b = e.target.closest('.dp'); if (b) { b.classList.toggle('on'); spec.dirty = true; } };
        $('nsSave').onclick = () => { const name = $('nsName').value.trim(), mg = $('nsMg').value.trim(), cls = $('nsCls').value.trim(); if (!name) return toast('צריך שם'); if (!mg || !cls) return toast('צריך מגמה וכיתה'); const s = addStu({ name, mg, cls, days: [...$('nsDays').querySelectorAll('.dp.on')].map(b => +b.dataset.day) }); spec.dirty = false; openTik(s.id, { replace: true }); toast(name + ' נוסף.ה'); };
      } };
  }

  /* ---- התיק (מסך משנה) ---- */
  function tikHtml(s) {
    const ds = dates(s), a = ATT[s.id];
    const pl = PLACE(s.emp), who = pl === 'out' ? ' · מנטור.ית ' + esc(s.mentor || (EMPS[s.emp] || {}).mentor || '') : pl === 'in' ? ' · מנהל.ת העבודה ' + esc((INS[s.emp] || {}).manager || '') : '';
    const opts = (o, cur2) => Object.entries(o).filter(([eid, e]) => eid === cur2 || canPlace(e)).map(([eid, e]) => `<option value="${eid}" ${eid === cur2 ? 'selected' : ''}>${esc(e.name)}${e.mas === 'לא מאושר' ? ' · לא מאושר' : ''}</option>`).join('');
    const miles = milesOf(s);
    const rems = [...pending().filter(r => r.sid === s.id).map(r => ({ ...r, p: true })), ...REM.filter(r => r.sid === s.id)];
    return `<p class="hint tik-sub">${esc(s.mg)}${s.track ? ' · מסלול ' + esc(s.track) : ''} · ${esc(s.cls)}${s.act ? ' · מספר פעולה ' + esc(s.act) : ''} · ${esc(empName(s.emp))}${who}${s.start ? ' · מ-' + esc(s.start) : ''}${s.birth ? ` · שנת לידה ${esc(s.birth)} (גיל ${MONTH.y - s.birth} בערך)` : ''}${s.phone ? ` · <a href="tel:${esc(s.phone)}" dir="ltr">${esc(s.phone)}</a>` : ''}${s.phone2 ? ` · <a href="tel:${esc(s.phone2)}" dir="ltr">${esc(s.phone2)}</a>` : ''}</p>${s.note ? `<p class="snote big">${ic('pen')}${esc(s.note)}</p>` : ''}
      <div class="emp-b edit tik-tools"><button class="btn" data-act="stu-edit">${ic('pen')}עריכת הפרטים</button></div>
      <div class="tik-grid">
        <div class="tik-card wide place" id="placeCard"><h3>${ic('building')}איפה עובד.ת</h3><div class="place-row">
          <label class="pl ${pl === 'out' ? 'on' : ''}"><input type="radio" name="pl" value="out" ${pl === 'out' ? 'checked' : ''}>מעסיק בחוץ</label>
          <label class="pl ${pl === 'in' ? 'on' : ''}"><input type="radio" name="pl" value="in" ${pl === 'in' ? 'checked' : ''}>עסק בית-ספרי</label>
          <label class="pl ${!pl ? 'on' : ''}"><input type="radio" name="pl" value="" ${!pl ? 'checked' : ''}>לא מועסק.ת</label>
          <select id="plSel" ${!pl ? 'hidden' : ''}>${pl === 'in' ? opts(INS, s.emp) : opts(EMPS, s.emp)}</select>
          ${!pl ? `<select id="plWhy" aria-label="סיבת אי-העסקה"><option value="">סיבת אי-העסקה</option>${WHY_NONE.map(w => `<option ${s.why === w ? 'selected' : ''}>${w}</option>`).join('')}</select>` : ''}</div>
          <details class="hist"><summary>${ic('cal')}היסטוריית שיבוץ<small>${s.hist.length}</small></summary><ul class="chk-items">${s.hist.map(h => `<li><span><b>${esc(h.d)}</b> מ${esc(empName(h.from))} ל${esc(empName(h.to))}${h.why ? ' · ' + esc(h.why) : ''}</span></li>`).join('') || '<li class="hint">אין שינויים</li>'}</ul></details></div>
        <div class="tik-card" id="statusCard"><h3>${ic('user')}מצב התלמיד.ה</h3><div class="place-row"><select id="stSel">${['לומד', 'מושעה', 'עזב', 'לא ידוע'].map(v => `<option value="${v}" ${s.status === v ? 'selected' : ''}>${v === 'לומד' ? 'לומד.ת' : v === 'מושעה' ? 'מושעה.ת' : v === 'עזב' ? 'עזב.ה' : 'לא ידוע'}</option>`).join('')}</select><em class="tag ${s.statusSrc === 'list' ? '' : s.statusSrc === 'list-missing' ? 'no' : 'mid'}">${s.statusSrc === 'list' ? 'מרשימת הלומדים' : s.statusSrc === 'list-missing' ? 'לא ברשימה · לבדיקה' : 'עודכן ידנית'}</em></div>
          ${s.status === 'מושעה' ? `<div class="place-row susp-row"><label>מ-<input class="find" id="spFrom" value="${esc((s.susp || {}).from || '')}" placeholder="10.${MONTH.m}"></label><label>עד <input class="find" id="spTo" value="${esc((s.susp || {}).to || '')}" placeholder="20.${MONTH.m}"></label><input class="find why" id="spWhy" value="${esc((s.susp || {}).why || '')}" placeholder="סיבה"></div>` : ''}</div>
        <div class="tik-card pyr-card"><h3>${ic('layers')}שלב בפירמידה <em class="tag ${s.stageManual != null ? 'mid' : ''}">${s.stageManual != null ? 'עודכן ידנית' : 'אוטומטי'}</em></h3><div class="stage-row">${STAGES.map((st, i) => `<button class="st ${i === s.stage ? 'cur' : i < s.stage ? 'done' : ''}" data-stage="${i}" ${(!s.emp && i > 0) || (s.emp && i === 0) ? 'disabled' : ''}>${st}</button>`).join('')}</div><dl class="kv"><dt>מה חסם את המעבר</dt><dd>${esc(s.note || 'אין חסם')}</dd><dt>הפעולה הבאה</dt><dd>${!s.emp ? 'איתור מקום עבודה' : docsOf(s) < DOCS.length ? 'השלמת מסמכים' : 'שיחה אישית'}</dd><dt>אחראי.ת · מועד</dt><dd>רכז.ת החניכות · החודש</dd></dl></div>
        <div class="tik-card"><h3>${ic('cal')}אבני הדרך של השנה <small>מהטפסים ומהיומן</small></h3><ul class="talks miles">${MILE_ORDER.map(i => { const [m, when] = MILES[i]; return `<li class="${miles[i] ? 'ok' : ''}">${ic(miles[i] ? 'check' : 'chat')}<span>${m}</span><small>${hasForm(s, i) ? 'מולא ' + esc(s.forms[i].d) : isDraft(s, i) ? '<em class="tag mid">טיוטה</em>' : sentOf(s, i) && !miles[i] ? '<em class="tag mid">הקישור נשלח</em>' : when}</small><button class="lnk mf-open" data-form="${i}">${hasForm(s, i) ? 'צפייה' : isDraft(s, i) ? 'המשך' : 'מילוי'}</button></li>`; }).join('')}</ul></div>
        <div class="tik-card"><h3>${ic('bell')}תזכורות</h3><ul class="rem-list">${rems.map(r => `<li><small>${r.d}.${MONTH.m} · ${esc(r.who)}${r.p ? ' · <b>תצא היום ב-16:00</b>' : ' · נשלחה'}</small>${esc(r.t)}</li>`).join('') || '<li class="hint">אין תזכורות</li>'}</ul></div>
        <div class="tik-card"><h3>${ic('file')}מסמכים <small>${docsOf(s)}/${DOCS.length}</small></h3><div class="bar"><i style="width:${docsOf(s) / DOCS.length * 100}%"></i></div><ul class="docs-l">${DOCS.map((d, i) => { const x = s.docs[i] || { s: 'miss', n: '' }; return `<li class="${x.s === 'ok' ? 'ok' : x.s === 'na' ? 'na' : ''}">${ic(x.s === 'ok' ? 'check' : x.s === 'na' ? 'x' : 'file')}<span>${d}${x.n ? ` <em class="dnote">${esc(x.n)}</em>` : ''}</span>${x.s === 'miss' || !x.s ? '<button class="lnk up-l edit" data-doc="' + i + '">התקבל</button>' : (x.s === 'na' ? '<small>לא צריך</small>' : '') + '<button class="lnk up-l edit" data-undoc="' + i + '">ביטול הסימון</button>'}</li>`; }).join('')}</ul></div>
        <div class="tik-card"><h3>${ic('cal')}ימי עבודה ונוכחות</h3><div class="daypick" id="dayPick">${'אבגדהו'.split('').map((n, i) => `<button class="dp ${s.days.includes(i) ? 'on' : ''}" data-day="${i}">${n}׳</button>`).join('')}</div><div class="cells">${ds.map(d => cellHtml(s, d, false)).join('')}</div><p class="hint">${esc(MONTH.name)}: ${ds.filter(d => present(a[d])).length} מתוך ${ds.length} ימים</p>${dayLines(s)}
          ${(() => { const o = hoursOf(s), hp = (EMPS[s.emp] || {}).hpd, man = s.hrsMan && s.hrsMan[MONTH.ym]; return `<div class="field-row hrs-row"><label class="field"><span>שעות ביום עבודה</span><input class="find" id="tkHrs" dir="ltr" inputmode="decimal" value="${esc(s.hrs || '')}" placeholder="${hp ? 'מהמעסיק: ' + esc(hp) : 'למשל 4'}"></label><label class="field"><span>סה"כ שעות ${esc(MONTH.name)} · ידני, במקום החישוב</span><input class="find" id="tkHrsMan" dir="ltr" inputmode="decimal" value="${man != null ? esc(man) : ''}" placeholder="רק אם מדווחים סה"כ"></label></div><p class="hint">סה"כ ${esc(MONTH.name)}: <b>${fmtH(o.h)} שעות</b> ${o.manual ? '(ידני)' : '(אוטומטי: ימים ✓ × שעות ליום, או לפי הגעה ויציאה)'}</p>`; })()}</div>
        <div class="tik-card wide"><h3>${ic('chat')}יומן</h3><ul class="log" id="tikLog">${(s.log || []).map(l => `<li><small>${esc(l.d)}</small>${esc(l.t)}</li>`).join('') || '<li class="hint">אין רישומים עדיין</li>'}</ul><div class="log-add edit"><input placeholder="מה נאמר ומה חסר" class="find" id="logIn"><button class="btn" id="logAdd">הוספה</button></div></div>
      </div>`;
  }
  function tikBind(el, s) {
    const redo = () => { s.stage = stageOf(s); refreshSub(); renderStuList(); renderOverview(); renderChkStu(); renderRoster(); renderEmps(); };
    el.querySelectorAll('[data-form]').forEach(b => b.onclick = () => openSub(formSpec(s, +b.dataset.form)));
    const ed = el.querySelector('[data-act="stu-edit"]'); if (ed) ed.onclick = () => openSub(editStuSpec(s));
    const num = v => { const n = +String(v).trim().replace(',', '.'); return isFinite(n) && n >= 0 ? Math.round(n * 10) / 10 : null; };
    $('tkHrs').onchange = e => { const v = e.target.value.trim(); if (v && num(v) == null) return toast('שעות: רק מספר'); s.hrs = v ? num(v) : ''; redo(); toast('שעות ביום עבודה עודכנו'); };
    $('tkHrsMan').onchange = e => { const v = e.target.value.trim(); if (v && num(v) == null) return toast('שעות: רק מספר'); s.hrsMan = Object.assign({}, s.hrsMan); if (v) s.hrsMan[MONTH.ym] = num(v); else delete s.hrsMan[MONTH.ym]; redo(); toast(v ? 'סה"כ השעות נרשם ידנית' : 'חזרה לחישוב אוטומטי'); };
    $('logAdd').onclick = () => { const v = $('logIn').value.trim(); if (!v) return; s.log.unshift({ d: TODAY, t: v }); redo(); };
    $('logIn').onkeydown = e => { if (e.key === 'Enter') $('logAdd').click(); };
    el.querySelectorAll('[data-doc]').forEach(b => b.onclick = () => { s.docs[+b.dataset.doc] = { s: 'ok', n: '' }; redo(); toast('סומן שהתקבל'); });
    el.querySelectorAll('[data-undoc]').forEach(b => b.onclick = () => { const i = +b.dataset.undoc; if (!confirm(`לבטל את הסימון של "${DOCS[i]}"?`)) return; s.docs[i] = { s: 'miss', n: (s.docs[i] || {}).n || '' }; if (MANUAL[s.id]) MANUAL[s.id].delete('0.' + i); redo(); toast('הסימון בוטל'); });
    el.querySelectorAll('[data-stage]').forEach(b => b.onclick = () => { const i = +b.dataset.stage; s.stageManual = s.stageManual === i ? null : i; redo(); toast(s.stageManual == null ? 'השלב חזר לאוטומטי' : 'השלב עודכן: ' + STAGES[i]); });
    $('placeCard').onchange = e => {
      const prev = s.emp;
      if (e.target.id === 'plWhy') { s.why = e.target.value; redo(); toast('הסיבה נשמרה'); return; }
      if (e.target.name === 'pl') { const v = e.target.value, ok = Object.keys(EMPS).filter(eid => canPlace(EMPS[eid])); s.emp = v === 'out' ? ok.find(eid => (EMPS[eid].mg || []).includes(s.mg)) || ok[0] || '' : v === 'in' ? Object.keys(INS).find(eid => (INS[eid].mg || []).includes(s.mg)) || Object.keys(INS)[0] : ''; if (v === 'out' && !s.emp) toast('אין מעסיק מאושר לשיבוץ'); }
      else if (e.target.id === 'plSel') { if (EMPS[e.target.value] && !canPlace(EMPS[e.target.value])) return toast('אי אפשר לשבץ אצל מעסיק שלא אושר במסננת'); s.emp = e.target.value; }
      else return;
      if (prev !== s.emp) { s.hist.unshift({ d: `${TODAY}.${MONTH.y}`, from: prev, to: s.emp, why: '' }); if (!s.emp) s.stageManual = null; else s.why = ''; }
      redo(); toast('השיבוץ של ' + s.name + ' עודכן');
    };
    $('statusCard').onchange = e => {
      if (e.target.id === 'stSel') { s.status = e.target.value; s.statusSrc = 'manual'; if (s.status === 'מושעה' && !s.susp) s.susp = { from: TODAY, to: '', why: '' }; if (s.status !== 'מושעה') { const was = s.susp; s.susp = null; if (was) applySusp(s); } else applySusp(s); }
      else if (/^sp/.test(e.target.id)) { s.susp = s.susp || {}; const k = { spFrom: 'from', spTo: 'to', spWhy: 'why' }[e.target.id], was = s.susp[k]; s.susp[k] = e.target.value.trim(); const f = fullDate(s.susp.from), t = fullDate(s.susp.to); if (f && t && t < f) { s.susp[k] = was; e.target.value = was || ''; return toast('תאריך הסיום לפני תאריך ההתחלה'); } applySusp(s); }
      else return;
      redo(); toast('המצב של ' + s.name + ' עודכן');
    };
    $('dayPick').onclick = e => { const b = e.target.closest('[data-day]'); if (!b || b.disabled) return; const i = +b.dataset.day; if (!s.dayHist) s.dayHist = { from: MONTH.today, days: [...s.days] }; s.days = s.days.includes(i) ? s.days.filter(x => x !== i) : [...s.days, i].sort(); redo(); toast('ימי העבודה של ' + s.name + ' עודכנו'); };
  }
  function openTik(id, o) { const s = STU.find(x => x.id === id); if (!s) return; const t = topSub(); if (t && t.key === 'tik' && t.id === id && cur() === 'sub') { refreshSub(); return; } openSub({ key: 'tik', id, title: () => `${esc(s.name)}${statusTag(s)}`, html: () => tikHtml(s), bind: el => tikBind(el, s) }, o); }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-open]'); if (b) { e.preventDefault(); openTik(b.dataset.open); return; }
    const sb = e.target.closest('[data-sub]'); if (sb) { e.preventDefault(); openSub(admSpec(sb.dataset.sub)); }
  });
  /* ---- טופס של אבן דרך: מילוי, צפייה והדפסה (גם טופס ריק) ---- */
  function formSpec(s, i) {
    const F = formOf(i);
    return { dirtyWatch: true, title: () => `${esc(s.name)} · ${MILES[i][0]}`, html: () => { const saved = s && s.forms[i], a = saved ? saved.a : {}; let n = 0;
      return `<div class="sub-card mform">
      <p class="hint">${F.who} · <a href="${SITE}${F.src[0]}" target="_blank" rel="noopener">${F.src[1]}</a>${saved ? (saved.st === 'draft' ? ' · טיוטה מ-' : ' · מולא ') + esc(saved.d) : ''}</p>
      ${F.f.map(([k, t]) => { if (k === 'head') return `<h4 class="mf-h">${t}</h4>`; const id = 'q' + (n++), v = a[id];
        if (k === 'text') return `<label class="mf"><span>${t}</span><textarea data-q="${id}" rows="2">${esc(v || '')}</textarea></label>`;
        if (k === 'check') return `<label class="mf-c"><input type="checkbox" data-q="${id}" ${v ? 'checked' : ''}>${t}</label>`;
        const opts = k === 'scale5' ? SC5 : ['1', '2', '3', '4'];
        return `<div class="mf"><span>${t}</span><div class="scale">${opts.map((o, j) => `<label class="sc ${v == j + 1 ? 'on' : ''}"><input type="radio" name="${s ? s.id : 'blank'}-${id}" data-q="${id}" value="${j + 1}" ${v == j + 1 ? 'checked' : ''}>${o}</label>`).join('')}</div></div>`; }).join('')}
      <div class="emp-b mf-b edit"><button class="btn primary" data-act="form-save">${ic('check')}שמירה</button></div></div>`; },
      bind: (el, spec) => {
        el.addEventListener('change', e => { if (e.target.type === 'radio') e.target.closest('.scale').querySelectorAll('.sc').forEach(l => l.classList.toggle('on', l.querySelector('input').checked)); });
        const save = el.querySelector('[data-act="form-save"]'); if (save) save.onclick = () => { const a = {}; el.querySelectorAll('[data-q]').forEach(x => { if (x.type === 'checkbox') { if (x.checked) a[x.dataset.q] = true; } else if (x.type === 'radio') { if (x.checked) a[x.dataset.q] = x.value; } else if (x.value.trim()) a[x.dataset.q] = x.value.trim(); });
          /* הושלם = כל שאלות הדירוג ולפחות תשובה פתוחה אחת. פחות מזה = טיוטה, שלא מסמנת את אבן הדרך */
          if (!Object.keys(a).length) return toast('הטופס ריק · לא נשמר');
          const qs = []; let n = 0; F.f.forEach(([k]) => { if (k !== 'head') qs.push([k, 'q' + (n++)]); });
          const scMiss = qs.filter(([k, id]) => /^scale/.test(k) && !a[id]).length, txt = qs.filter(([k]) => k === 'text'), txtOk = !txt.length || txt.some(([, id]) => a[id]);
          const done = !scMiss && txtOk, was = hasForm(s, i);
          s.forms[i] = { d: TODAY, a, st: done ? 'done' : 'draft' };
          if (done && !was) s.log.unshift({ d: TODAY, t: MILES[i][0] + ' · הטופס מולא', form: true });
          spec.dirty = false; renderChkStu(); renderChkCal(); renderStuList(); closeSub();
          toast(done ? 'הטופס הושלם' : 'נשמר כטיוטה · ' + [scMiss ? `חסרות ${scMiss} שאלות דירוג` : '', txtOk ? '' : 'חסרה תשובה פתוחה'].filter(Boolean).join(' · ')); };
      } };
  }

  /* ================= מעסיקים — רשימה לפי מגמה, פרטים במסך נפרד ================= */
  const masTag = e => e.mas ? `<em class="tag ${e.mas === 'מאושר' ? 'ok' : e.mas === 'לא מאושר' ? 'no' : 'mid'}">${esc(e.mas)}</em>` : '<em class="tag">טרם נבדק במסננת</em>';
  function empRows(map, kind) {
    const mgs = [...new Set([...MGS, ...Object.values(map).flatMap(e => e.mg || [])])];
    const used = new Set();
    const groups = mgs.map(mg => [mg, Object.entries(map).filter(([, e]) => (e.mg || []).includes(mg) && !e.lead)]).filter(([, l]) => l.length);
    groups.forEach(([, l]) => l.forEach(([id]) => used.add(id)));
    const rest = Object.entries(map).filter(([id, e]) => !used.has(id) && !e.lead); if (rest.length) groups.push(['בלי מגמה', rest]);
    if (!groups.length) return '<p class="empty">אין עדיין.</p>';
    return groups.map(([mg, l]) => `<details class="grp" open><summary>${esc(mg)}<small>${l.length}</small></summary><div class="rows">${l.map(([id, e]) => { const st = STU.filter(s => s.emp === id && s.status !== 'עזב'); return `<button class="rowbtn" data-emp="${id}">${ic(kind === 'in' ? 'home' : 'building')}<b>${esc(e.name)}</b><span class="rtag">${kind === 'in' ? `<em class="tag">${esc(e.kind || '')}</em>` : masTag(e)}${st.length ? ` <em class="tag">${st.length} תלמידים</em>` : ''}${kind === 'out' && (e.visit === '—' || e.contact > 40) ? ' <em class="tag no">ביקור באיחור</em>' : ''}</span>${chev}<small>${kind === 'in' ? 'מנהל.ת העבודה ' + esc(e.manager || '') : (e.mentor ? 'מנטור.ית ' + esc(e.mentor) : '')}${e.addr ? ' · ' + esc(e.addr) : ''}${st.length ? ' · ' + st.map(first).map(esc).join(', ') : ''}</small></button>`; }).join('')}</div></details>`).join('');
  }
  function renderEmps() { $('panelOut').innerHTML = empRows(EMPS, 'out'); $('panelIn').innerHTML = empRows(INS, 'in') + `<div class="wiz-cta"><div><h3>${ic('plus')}עסק בית-ספרי חדש</h3></div><button class="btn primary edit" data-act="new-ins">${ic('plus')}הוספת עסק בית-ספרי</button></div>`; paintLeads(); }
  document.getElementById('employers').addEventListener('click', e => {
    const b = e.target.closest('[data-emp]'); if (b) { openSub(empSpec(b.dataset.emp)); return; }
    if (e.target.closest('[data-act="new-ins"]')) openSub(empEditSpec(newId('I'), { name: '', kind: 'עסק בית-ספרי', manager: '', mg: [], hours: 15, min: 10 }));
  });
  function empSpec(id) {
    const e = EMPS[id] || INS[id], inn = !!INS[id];
    return { title: () => `${esc(e.name)} ${inn ? `<em class="tag">${esc(e.kind || '')}</em>` : masTag(e)}`, html: () => { const l = STU.filter(s => s.emp === id && s.status !== 'עזב');
      return `<div class="tik-grid">
        <div class="tik-card"><h3>${ic('user')}${inn ? 'מנהל.ת העבודה' : 'מנטור.ית'}</h3><dl class="kv">${inn ? `<dt>שם</dt><dd>${esc(e.manager || '—')}</dd>` : `<dt>איש.אשת קשר</dt><dd>${esc(e.manager || '—')}</dd><dt>מנטור.ית</dt><dd>${esc(e.mentor || '—')}</dd>`}${e.phone ? `<dt>טלפון</dt><dd dir="ltr">${esc(e.phone)}</dd>` : ''}${e.mail ? `<dt>מייל</dt><dd dir="ltr">${esc(e.mail)}</dd>` : ''}${e.addr ? `<dt>כתובת</dt><dd>${esc(e.addr)}</dd>` : ''}<dt>מגמות</dt><dd>${(e.mg || []).map(esc).join(' · ') || '—'}</dd>${inn ? '' : `<dt>תקנים</dt><dd>${e.slots ? esc(e.slots) : 'לא ידוע'}${e.slotsRaw ? ` <em class="tag no">בקובץ: ${esc(e.slotsRaw)}</em>` : ''}</dd>`}</dl></div>
        <div class="tik-card"><h3>${ic('user')}תלמידים <small>${l.length}</small></h3><ul class="docs-l">${l.map(s => `<li class="ok">${ic('user')}<span><a href="#" data-open="${s.id}">${esc(s.name)}</a> · ${esc(s.cls)}${s.days.length ? ' · ' + s.days.map(d => 'אבגדהו'[d] + '׳').join(' ') : ''}</span></li>`).join('') || '<li class="hint">אין תלמידים משובצים</li>'}${inn && e.min ? `<li class="${l.length < e.min ? '' : 'ok'}"><span class="${l.length < e.min ? 'warn' : ''}">${l.length} מתוך ${e.min} לפחות</span></li>` : ''}</ul><div class="emp-b edit"><button class="btn" data-act="emp-assign">${ic('user')}שיוך תלמידים</button></div></div>
        ${inn ? '' : `<div class="tik-card edit" id="mlCard"><h3>${ic('link')}קישור למנטור.ית</h3><p class="hint">הקישור פותח את שמות התלמידים שאצל המעסיק. לשלוח רק למנטור.ית. המנטור.ית מסמנ.ת בו נוכחות וממלא.ת את משוב המעסיק, ואת הסימונים מושכים במסך הנוכחות.</p><div id="mlBox"><p class="hint">בודק אם יש קישור פעיל…</p></div><div class="emp-b"><button class="btn primary" data-act="mentor-link" ${l.length ? '' : 'disabled'}>${ic('link')}קישור למנטור.ית</button><button class="btn quiet" data-act="mentor-revoke">${ic('x')}ביטול הקישור</button></div></div>`}
        ${inn ? `<div class="tik-card"><h3>${ic('wallet')}סעיף 117</h3><dl class="kv"><dt>היקף</dt><dd>${e.hours} ש"ש · 100 שעות חניכות לתלמיד.ה בשנה</dd>${e.client ? `<dt>לקוח</dt><dd>${esc(e.client)}</dd>` : ''}</dl></div>`
          : `<div class="tik-card"><h3>${ic('filter')}המסננת</h3><dl class="kv"><dt>ההחלטה</dt><dd>${e.mas ? masTag(e) : '<span class="hint">לא נבדק</span>'}</dd>${e.recheck ? `<dt>בדיקה חוזרת</dt><dd>${esc(e.recheck)}</dd>` : ''}${e.masNotes ? `<dt>הערות</dt><dd>${esc(e.masNotes)}</dd>` : ''}</dl></div>
          <div class="tik-card"><h3>${ic('clock')}קשר</h3><dl class="kv"><dt>קשר אחרון</dt><dd>${esc(e.talk || '—')}</dd><dt>ביקור אחרון</dt><dd class="${e.visit === '—' || e.contact > 40 ? 'warn' : ''}">${esc(e.visit || '—')}${e.contact > 40 ? ' · באיחור' : ''}</dd>${e.status ? `<dt>סטטוס</dt><dd>${esc(e.status)}</dd>` : ''}${e.studsTxt && !l.length ? `<dt>הערה</dt><dd>${esc(e.studsTxt)}</dd>` : ''}</dl><div class="emp-b edit"><button class="btn" data-act="talked">${ic('chat')}דיברתי איתם היום</button><button class="btn" data-act="visited">${ic('check')}ביקרתי שם היום</button></div></div>`}
      </div><div class="emp-b mf-b edit"><button class="btn" data-act="emp-edit">${ic('pen')}עריכת הפרטים</button></div>`; },
      bind: el => {
        const t = el.querySelector('[data-act="talked"]'); if (t) t.onclick = () => { e.talk = TODAY; renderEmps(); refreshSub(); toast('נרשם: שיחה עם ' + e.name + ' היום'); };
        const v = el.querySelector('[data-act="visited"]'); if (v) v.onclick = () => { e.visit = TODAY; e.talk = TODAY; e.contact = 0; renderEmps(); renderChkStu(); refreshSub(); toast('נרשם: ביקור אצל ' + e.name + ' היום'); };
        el.querySelector('[data-act="emp-edit"]').onclick = () => openSub(empEditSpec(id));
        const as = el.querySelector('[data-act="emp-assign"]'); if (as) as.onclick = () => openSub(assignSpec(id));
        /* הקישור למנטור.ית (mentor.js): קישור אחד למעסיק, המפתח אחרי # לא מגיע לשרת. יצירה מחדש מחליפה את הקודם */
        const ml = el.querySelector('#mlBox');
        if (ml && canEdit()) {
          const showLink = (url, created) => { ml.innerHTML = url ? `<div class="ml-row"><input class="find" id="mlUrl" readonly dir="ltr" value="${esc(url)}" aria-label="הקישור למנטור.ית"><button class="btn" data-act="ml-copy">${ic('file')}העתקה</button>${created ? `<small class="hint">נוצר ${esc(created)}</small>` : ''}</div>` : '<p class="hint">אין קישור פעיל</p>'; const c = ml.querySelector('[data-act="ml-copy"]'); if (c) c.onclick = () => { $('mlUrl').select(); copyTxt(url, 'הקישור הועתק · לשלוח רק למנטור.ית'); }; };
          if (!window.Mentor) showLink(''); else Mentor.links().then(ls => { const L = ls.find(x => x.emp === id); if (el.isConnected) showLink(L ? L.url : '', L && L.created); }).catch(() => { if (el.isConnected) showLink(''); });
          el.querySelector('[data-act="mentor-link"]').onclick = async ev => {
            const b = ev.currentTarget, l = STU.filter(s => s.emp === id && s.status !== 'עזב');
            if (!window.Mentor) return toast('הקישור למנטור.ית לא זמין'); if (!l.length) return toast('אין תלמידים משובצים אצל המעסיק');
            b.disabled = true;
            try { await Store.flush(); const url = await Mentor.createLink(id, l.map(s => ({ id: s.id, name: s.name, cls: s.cls, mg: s.mg }))); showLink(url, TODAY); toast('הקישור נוצר · לשלוח רק למנטור.ית'); }
            catch (err) { toast('הקישור לא נוצר (' + (err.message || err) + ')'); }
            b.disabled = false;
          };
          el.querySelector('[data-act="mentor-revoke"]').onclick = async () => {
            if (!window.Mentor || !confirm('לבטל את הקישור של המנטור.ית? מה שכבר סומן נשאר')) return;
            try { const n = await Mentor.revoke(id); showLink(''); toast(n ? 'הקישור בוטל' : 'לא היה קישור פעיל'); } catch (err) { toast('הביטול לא הצליח (' + (err.message || err) + ')'); }
          };
        }
      } };
  }
  /* שיוך תלמידים ממסך המעסיק: רשימת סימון לפי קבוצה. מסומן = אצל המעסיק הזה, הסרת סימון = הסרה */
  function assignSpec(id) {
    const e = EMPS[id] || INS[id];
    return { title: () => 'שיוך תלמידים · ' + esc(e.name), html: () => { const groups = {}; active().forEach(s => { const c = s.cls || 'בלי קבוצה'; (groups[c] = groups[c] || []).push(s); }); const names = Object.keys(groups).sort(clsSort);
      return `<div class="sub-card"><p class="hint">מסמנים את מי שעובד.ת אצל ${esc(e.name)} ולוחצים "שמירה". הסרת סימון מסירה מהמעסיק.</p>${names.map(c => `<details class="grp" open><summary>${esc(c)}<small>${groups[c].filter(s => s.emp === id).length} מתוך ${groups[c].length}</small></summary><ul class="chk-items asg">${groups[c].map(s => `<li><label><input type="checkbox" data-asg="${s.id}" ${s.emp === id ? 'checked' : ''}>${esc(s.name)}${s.emp && s.emp !== id ? ` <small class="hint">אצל ${esc(empName(s.emp))}</small>` : ''}</label></li>`).join('')}</ul></details>`).join('') || '<p class="empty">אין תלמידים.</p>'}
        <div class="emp-b mf-b edit"><button class="btn primary" id="asgSave">${ic('check')}שמירה</button></div></div>`; },
      bind: el => { $('asgSave').onclick = () => { let n = 0; el.querySelectorAll('[data-asg]').forEach(c => { const s = STU.find(x => x.id === c.dataset.asg); if (!s) return; if (c.checked && s.emp !== id) { if (setEmp(s, id)) n++; } else if (!c.checked && s.emp === id) { setEmp(s, ''); n++; } }); closeSub(); toast(n ? `השיבוץ אצל ${e.name} עודכן · ${n} תלמידים` : 'אין שינוי'); }; } };
  }
  /* עריכת פרטים של מעסיק (ומנטור.ית) או עסק בית-ספרי קיימים */
  /* draft = עסק בית-ספרי חדש: נוצר רק בשמירה. הסוג תמיד "עסק בית-ספרי" (מיטל, 1.11.26) — אין בחירה */
  function empEditSpec(id, draft) {
    const e = draft || EMPS[id] || INS[id], inn = !!draft || !!INS[id];
    const fld = (k, l, ltr) => `<label class="field"><span>${l}</span><input class="find" data-ee="${k}" value="${esc(e[k] || '')}"${ltr ? ' dir="ltr"' : ''}></label>`;
    return { dirtyWatch: true, title: () => draft ? 'עסק בית-ספרי חדש' : 'עריכת הפרטים · ' + esc(e.name), html: () => `<div class="sub-card newform">
        <div class="field-row">${fld('name', inn ? 'שם העסק הבית-ספרי' : 'שם המעסיק')}${inn ? fld('manager', 'מנהל.ת העבודה') : fld('manager', 'איש.אשת קשר')}</div>
        ${inn ? '' : `<div class="field-row">${fld('mentor', 'מנטור.ית / חונך.ת')}</div>`}
        ${inn ? `<div class="field-row">${fld('client', 'לקוח')}</div>` : ''}
        ${inn ? '' :`<div class="field-row">${fld('phone', 'טלפון', true)}${fld('mail', 'מייל', true)}</div><div class="field-row">${fld('addr', 'כתובת')}${fld('slots', 'כמה תקנים', true)}</div><div class="field-row">${fld('hpd', 'שעות ביום עבודה · ברירת מחדל לתלמידים אצל המעסיק', true)}</div>`}
        <div class="field"><span>מגמות</span><div class="place-row">${[...new Set([...MGS, ...(e.mg || [])])].map(m => `<label class="pl ${(e.mg || []).includes(m) ? 'on' : ''}"><input type="checkbox" name="eeMg" value="${esc(m)}" ${(e.mg || []).includes(m) ? 'checked' : ''}>${esc(m)}</label>`).join('')}</div></div>
        <div class="emp-b mf-b"><button class="btn primary" id="eeSave">${ic('check')}שמירה</button></div></div>`,
      bind: (el, spec) => {
        el.addEventListener('change', ev => { if (ev.target.name === 'eeMg') ev.target.closest('.pl').classList.toggle('on', ev.target.checked); });
        $('eeSave').onclick = () => {
          const v = {}; el.querySelectorAll('[data-ee]').forEach(x => v[x.dataset.ee] = x.value.trim());
          if (!v.name) return toast('צריך שם');
          if (!inn && v.slots && !/^\d+$/.test(v.slots)) return toast('תקנים: רק מספר');
          const mgs = [...el.querySelectorAll('input[name="eeMg"]:checked')].map(x => x.value); if (!mgs.length) return toast('צריך לפחות מגמה אחת');
          Object.assign(e, v, { mg: mgs }); if (!inn && v.slots) e.slotsRaw = ''; if (draft) INS[id] = e;
          spec.dirty = false; renderEmps(); renderStuList(); closeSub(); toast('הפרטים עודכנו');
        };
      } };
  }
  document.querySelector('[data-act="new-emp"]').onclick = () => openSub(newEmpSpec());
  function newEmpSpec(p = {}) {
    /* 3.11.26 (מהפיילוט): רק פרטי המעסיק בראש הטופס. שם חובה; איש.אשת קשר, טלפון וכתובת חשובים (שאלה אם חסר). המסננת מקופלת ולא חובה */
    return { dirtyWatch: true, title: 'מעסיק חדש', html: () => `<div class="sub-card newform">
        <div class="field-row"><label class="field"><span>שם המעסיק</span><input class="find" id="neName" value="${esc(p.name || '')}"></label><label class="field"><span>איש.אשת קשר</span><input class="find" id="neContact" value="${esc(p.manager || p.who || '')}"></label></div>
        <div class="field-row"><label class="field"><span>טלפון</span><input class="find" id="nePhone" dir="ltr" value="${esc(p.phone || '')}"></label><label class="field"><span>כתובת</span><input class="find" id="neAddr" value="${esc(p.addr || '')}"></label></div>
        <div class="field-row"><label class="field"><span>מנטור.ית / חונך.ת</span><input class="find" id="neMentor" value="${esc(p.mentor || '')}"></label><label class="field"><span>מייל</span><input class="find" id="neMail" dir="ltr" value="${esc(p.mail || '')}"></label></div>
        <div class="field-row"><div class="field"><span>מגמות</span><div class="place-row">${MGS.map(m => `<label class="pl"><input type="checkbox" name="neMg" value="${esc(m)}">${esc(m)}</label>`).join('')}</div></div><label class="field"><span>כמה תקנים</span><input class="find" id="neSlots" dir="ltr" inputmode="numeric" value="1"></label></div>
        <div class="emp-b mf-b edit"><button class="btn primary" id="neSave">${ic('check')}שמירה</button></div>
      </div>
      <details class="sub-card masn fold"><summary>${ic('filter')}מסננת החניכות <small>אפשר למלא עכשיו או אחרי הביקור אצל המעסיק · <a href="${SITE}chanichut-masnenet.html" target="_blank" rel="noopener">המקור</a></small></summary>
        <h4 class="mf-h">בקרה בכניסה</h4>
        <ul class="msp-l">${MAS_CTRL.map((c, j) => `<li><label><input type="checkbox" data-ctrl="${j}"><span>${c}</span></label></li>`).join('')}</ul>
        ${MASNENET.map(([p, pr], i) => `<div class="msp"><div class="msp-h"><b>${i + 1}. ${p}</b><em class="tag" id="msSt${i}">טרם סומן</em></div><ul class="msp-l">${pr.map(([t, must], j) => `<li><label><input type="checkbox" data-pi="${i}" data-pj="${j}"><span>${t}${must ? ' <em class="tag mid">חובה</em>' : ''}</span></label></li>`).join('')}</ul><input class="find" data-msn="${i}" placeholder="מה נצפה, מה סוכם ועד מתי"></div>`).join('')}
        <div class="ms-sug" id="msSug"></div>
        <h4 class="mf-h">פרטי הביקור וההחלטה</h4>
        <div class="field-row"><label class="field"><span>תאריך הביקור</span><input class="find" id="msDate" value="${TODAY}.${MONTH.y}"></label><label class="field"><span>תאריך בדיקה חוזרת</span><input class="find" id="msRe" placeholder="למשל פברואר"></label></div>
        <div class="mf"><span>ההחלטה</span><div class="scale" id="msDec">${['מאושר', 'מאושר בליווי', 'לא מאושר'].map(o => `<label class="sc"><input type="radio" name="msDec" value="${o}">${o}</label>`).join('')}</div></div>
        <label class="field" id="msPlanF" hidden><span>תוכנית השלמה עם המעסיק · מה יושלם, מי אחראי בעסק, עד מתי</span><textarea class="find" id="msPlan" rows="3"></textarea></label>
        <p class="hint">אחרי שממלאים את המסננת, לוחצים "שמירה" למעלה.</p></details>`,
      bind: (el, spec) => {
        /* המסננת מחשבת לבד: מצב כל עיקרון מהפרקטיקות שסומנו, והחלטה מוצעת. אפשר לבחור אחרת, בגבולות תנאי הסף */
        let decManual = false;
        const chk = sel => [...el.querySelectorAll(sel)];
        const stOf = i => { const b = chk(`[data-pi="${i}"]`), n = b.filter(x => x.checked).length; return !n ? 'לא מתקיים' : n === b.length ? 'מתקיים' : 'חלקי'; };
        const mustMiss = () => MASNENET.flatMap(([, pr], i) => pr.map(([t, must], j) => must && !el.querySelector(`[data-pi="${i}"][data-pj="${j}"]`).checked ? t : '')).filter(Boolean);
        const ctrlMiss = () => MAS_CTRL.filter((_, j) => !el.querySelector(`[data-ctrl="${j}"]`).checked);
        const suggest = () => { const mm = mustMiss(), cm = ctrlMiss(), st = MASNENET.map((_, i) => stOf(i)), ok = st.filter(x => x === 'מתקיים').length;
          if (mm.length || cm.length) return { dec: 'לא מאושר', why: 'אין שיבוץ עד שיוסדר: ' + [...mm, ...cm].join(' · ') };
          if (ok === MASNENET.length) return { dec: 'מאושר', why: 'כל העקרונות מתקיימים' };
          return { dec: 'מאושר בליווי', why: `תנאי הסף מתקיימים, ${ok} מתוך ${MASNENET.length} עקרונות במלואם · צריך תוכנית השלמה ובדיקה חוזרת` }; };
        const setDec = v => chk('input[name="msDec"]').forEach(x => { x.checked = x.value === v; x.closest('.sc').classList.toggle('on', x.checked); });
        const refreshMas = () => {
          const touched = chk('[data-pi],[data-ctrl]').some(x => x.checked);
          MASNENET.forEach((_, i) => { const t = $('msSt' + i), s = stOf(i), any = chk(`[data-pi="${i}"]`).some(x => x.checked); t.textContent = any || touched ? s : 'טרם סומן'; t.className = 'tag ' + (!(any || touched) ? '' : s === 'מתקיים' ? 'ok' : s === 'חלקי' ? 'mid' : 'no'); });
          const g = suggest(); $('msSug').innerHTML = touched ? `${ic('filter')}<span><b>ההחלטה המוצעת: ${g.dec}</b><small>${esc(g.why)}</small></span>` : '';
          if (touched && !decManual) setDec(g.dec);
          const cur = (el.querySelector('input[name="msDec"]:checked') || {}).value; $('msPlanF').hidden = cur !== 'מאושר בליווי';
        };
        el.addEventListener('change', e => { if (e.target.type === 'radio') e.target.closest('.scale').querySelectorAll('.sc').forEach(l => l.classList.toggle('on', l.querySelector('input').checked)); if (e.target.name === 'neMg') e.target.closest('.pl').classList.toggle('on', e.target.checked); if (e.target.name === 'msDec') decManual = true; if (e.target.matches('[data-pi],[data-ctrl],[name="msDec"]')) refreshMas(); });
        if (matchMedia('(pointer:fine)').matches) $('neName').focus();
        $('neSave').onclick = () => {
          const name = $('neName').value.trim(); if (!name) return toast('צריך שם מעסיק');
          const who = $('neContact').value.trim(), phone = $('nePhone').value.trim(), addr = $('neAddr').value.trim();
          const missing = [!who && 'איש.אשת קשר', !phone && 'טלפון', !addr && 'כתובת'].filter(Boolean);
          if (missing.length && !confirm('חסר: ' + missing.join(', ') + '. לשמור בכל זאת?')) return;
          /* המסננת רק אם נגעו בה. בלי מסננת המעסיק "טרם נבדק" ואפשר לשבץ אליו */
          const touched = chk('[data-pi],[data-ctrl]').some(x => x.checked) || !!el.querySelector('input[name="msDec"]:checked');
          const dec = touched ? (el.querySelector('input[name="msDec"]:checked') || {}).value : '';
          if (touched) {
            if (!dec) return toast('חסרה ההחלטה של המסננת');
            /* אישור (גם "בליווי") רק כשתנאי הסף ופעולות הבקרה מתקיימים. שאר העקרונות אפשר להשלים בליווי */
            if (dec !== 'לא מאושר' && (mustMiss().length || ctrlMiss().length)) return toast('כדי לאשר: ' + [...mustMiss(), ...ctrlMiss()][0]);
            if (dec === 'מאושר' && suggest().dec !== 'מאושר') return toast('לא כל העקרונות מתקיימים: "מאושר בליווי" עם תוכנית השלמה');
            if (dec === 'מאושר בליווי' && (!$('msPlan').value.trim() || !$('msRe').value.trim())) return toast('מאושר בליווי: צריך תוכנית השלמה ותאריך בדיקה חוזרת');
          }
          const mgs = [...el.querySelectorAll('input[name="neMg"]:checked')].map(x => x.value);
          const notes = !touched ? '' : MASNENET.map(([p, pr], i) => { const n = el.querySelector(`[data-msn="${i}"]`).value.trim(), c = chk(`[data-pi="${i}"]`).filter(x => x.checked).length; return `${p}: ${stOf(i)} (${c}/${pr.length})${n ? ' · ' + n : ''}`; }).join(' · ') + ($('msPlan').value.trim() && dec === 'מאושר בליווי' ? ' · תוכנית השלמה: ' + $('msPlan').value.trim() : '');
          const slots = $('neSlots').value.trim();
          const id = 'E' + Date.now().toString(36);
          /* manager = איש.אשת הקשר אצל מעסיק חיצוני (אצל עסק בית-ספרי: מנהל.ת העבודה). contact = ימים מהקשר האחרון */
          EMPS[id] = { name, manager: who, mentor: $('neMentor').value.trim(), phone, addr, mail: $('neMail').value.trim(), slots: /^\d+$/.test(slots) ? slots : '', mg: mgs.length ? mgs : MGS.slice(0, 1), status: '', studsTxt: '', lead: false, mas: dec, recheck: touched ? $('msRe').value.trim() : '', visit: touched ? $('msDate').value.trim().replace(/\.\d{4}$/, '') : '', contact: 0, masNotes: notes };
          if (p.lead) { p.lead.done = isoToday(); leadsChanged(); }
          spec.dirty = false; renderEmps(); renderStuList(); closeSub(); toast(name + ' נוסף · ' + (dec || 'טרם נבדק במסננת'));
        };
      } };
  }
  document.querySelector('[data-act="wiz"]').onclick = () => openSub(wizSpec(WZ.fam ? '' : MGS[0]));
  /* ---- אשף מציאת מעסיקים: מאגר המעסיקים + עסקים במפה ---- */
  /* המאגר יורד מהשרת רק כשפותחים את האשף, ולא נשמר בדפדפן: יש בו ניידים אישיים */
  let DB = [], DB_FAMS = [], DB_STATE = '';
  async function loadDb() {
    if (DB_STATE === 'ok' || DB_STATE === 'loading') return;
    DB_STATE = 'loading';
    let res = null; try { res = await API.call('empDb'); } catch (e) {}
    if (res && res.ok) { DB = res.rows.map((x, i) => ({ ...x, id: i })); DB_FAMS = [...new Set(DB.flatMap(x => x.fam))].filter(f => f !== 'כללי').sort((p, q) => p.localeCompare(q, 'he')); DB_STATE = 'ok'; }
    else DB_STATE = 'err';
    refreshSub();
  }
  const WM = window.WIZMAP;
  const DB_ST = ['שולבו תלמידים', 'סוכם על המשך שיתוף פעולה', 'סוכם עקרונית על שילוב תלמידים', 'בתהליך חיבור'];
  const DB_AREAS = ['צפון', 'מרכז', 'ירושלים', 'דרום'];
  const MG_FAM = [[/אוטו|רכב|צמ"ה/, 'אוטוטרוניקה'], [/קולינר|קונדיט|טבח|אפי/, 'קולינריה וקונדיטוריה'], [/קירור|מיזוג/, 'מיזוג וקירור'], [/חשמל/, 'חשמל'], [/שיער|איפור|קוסמט|טיפוח/, 'טיפוח החן ועיצוב שיער'], [/מדיה|סאונד|צליל|יוצרי|קריא|הפקת|שיווק/, 'מדיה וסאונד'], [/סייבר|הייטק|תכנות|תקשוב|סלולר|אתרים/, 'הייטק ותקשוב'], [/ריתוך|CNC|אלומיניום|ייצור|מערכות תיכון|מכטרוניק/, 'מתכת וייצור'], [/נגר/, 'נגרות'], [/אדריכל/, 'אדריכלות'], [/שיניים/, 'טכנאות שיניים'], [/ספורט/, 'ספורט'], [/ינקות/, 'גיל הרך']];
  const famOf = mg => (MG_FAM.find(([re]) => re.test(mg)) || [])[1] || '';
  const SCHOOL_AREA = { 'חיפה': 'צפון', 'תל אביב': 'מרכז', 'ירושלים': 'ירושלים', 'באר שבע': 'דרום' }[((window.SCHOOLS || []).find(x => x.name === SCHOOL) || {}).d] || '';
  const LEAD_ST = ['לפנות', 'פניתי', 'חזרו אליי', 'נקבעה פגישה', 'לא מתאים'];
  const ZONE_KM = 0.6;
  /* מיקום והסתרות נשמרים לבית הספר (meta.wiz) */
  const WIZ_S = R.meta.wiz = R.meta.wiz || {};
  const wzGet = k => WIZ_S[k];
  const wzSet = (k, v) => { WIZ_S[k] = v; };
  const WZ = { tab: 'db', fam: '', area: SCHOOL_AREA, st: '', q: '', lim: 30, hide: new Set(wzGet('hide') || []), mapMg: MGS[0] || '', radius: 10, loc: wzGet('loc'), locs: null, res: null, busy: '', err: '', hideOsm: new Set(wzGet('hideOsm') || []), zones: wzGet('zones') || [] };
  const dayMark = () => { const d = new Date(); return d.getDate() + '.' + (d.getMonth() + 1); };
  const known = name => { const n = WM.norm(name); return openLeads().some(l => WM.norm(l.name) === n) ? 'בפניות' : Object.values(EMPS).some(e => WM.norm(e.name) === n) ? 'ברשימה' : ''; };
  const openLeads = () => LEADS.filter(l => !l.done);
  const isoToday = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const dm = iso => { const [, m, d] = String(iso || '').split('-'); return d ? +d + '.' + +m : ''; };
  const lastLog = l => (l.log || [])[0];
  const leadDue = l => !!(l.next && l.nextAt && l.nextAt <= isoToday() && !/לא מתאים/.test(l.st));
  /* פנייה שעברו 7 ימים בלי תשובה. בלי תאריך: נחשבת כמחכה */
  function leadStale(l) {
    if (lastLog(l)) return (new Date(isoToday()) - new Date(lastLog(l).at)) / 864e5 >= 7;
    const m = /(\d{1,2})\.(\d{1,2})/.exec(l.st); if (!m) return true;
    const now = new Date(); let d = new Date(now.getFullYear(), +m[2] - 1, +m[1]);
    if (d > now) d = new Date(now.getFullYear() - 1, +m[2] - 1, +m[1]);
    return (now - d) / 864e5 >= 7;
  }
  function leadsChanged() { renderToday(); paintLeads(); }
  const addLead = l => { l.id = newLeadId(); l.created = Date.now(); LEADS.unshift(l); leadsChanged(); toast(l.name + ' נוסף לפניות'); };
  function paintLeads() { const n = $('leadsN'), box = $('panelLeads'); if (n) n.textContent = openLeads().length; if (box) box.innerHTML = `<ul class="leads wz-leads">${leadRows()}</ul>`; }
  const leadRows = () => LEADS.map((l, i) => { if (l.done) return ''; const g = lastLog(l); return `<li><button class="wz-lead" data-li="${i}"><b>${esc(l.name)}</b><span class="lead-st ${/חזרו|פגישה/.test(l.st) ? 's3' : 's2'}">${esc(l.st)}</span>${leadDue(l) ? '<em class="tag mid">הגיע הזמן</em>' : ''}<span class="hint wz-lead-t">${g ? esc(dm(g.at) + ' · ' + g.text.slice(0, 90)) : [l.note, l.who, l.phone].filter(Boolean).map(esc).join(' · ')}${l.next ? `<br>הצעד הבא: ${esc(l.next)}${l.nextAt ? ' · ' + dm(l.nextAt) : ''}` : ''}</span></button></li>`; }).join('') || '<li class="hint">אין פניות עדיין</li>';

  const haveTag = (name, have) => have === 'בפניות' ? `<button class="lnk" data-li="${LEADS.findIndex(l => !l.done && WM.norm(l.name) === WM.norm(name))}">כבר בפניות</button>` : `<em class="tag">כבר ${have}</em>`;
  function dbMatches() {
    const q = WZ.q.trim();
    return DB.filter(x => !WZ.hide.has(x.n)
      && (!WZ.fam || x.fam.includes(WZ.fam) || x.fam.includes('כללי'))
      && (!WZ.area || x.a.includes(WZ.area) || x.a.includes('ארצי'))
      && (!WZ.st || x.s === WZ.st)
      && (!q || [x.n, x.c, x.p, x.f].some(v => v.includes(q))))
      .sort((a, b) => (DB_ST.indexOf(a.s) + 1 || 9) - (DB_ST.indexOf(b.s) + 1 || 9));
  }
  function dbRow(x) {
    const have = known(x.n);
    const meta = [x.f, x.p, x.z].filter(Boolean).map(esc).join(' · ');
    const tel = x.t ? `<a href="tel:${x.t.replace(/\D/g, '')}" dir="ltr">${esc(x.t)}</a>` : x.tx ? `<span class="muted">טלפון לבדיקה: <span dir="ltr">${esc(x.tx)}</span></span>` : '<span class="muted">אין טלפון</span>';
    const mail = x.m ? `<span dir="ltr">${esc(x.m)}</span>` : x.mx ? `<span class="muted">מייל לבדיקה: <span dir="ltr">${esc(x.mx)}</span></span>` : '';
    return `<li class="wz-row"><div class="wz-m"><b>${esc(x.n)}</b>${x.s ? `<em class="tag ${x.s === DB_ST[0] ? 'ok' : ''}">${esc(x.s)}</em>` : ''}
      <div class="hint">${meta}</div><div class="wz-links">${x.c ? `<span>${esc(x.c)}</span>` : ''}${tel}${mail}</div></div>
      <div class="wz-act">${have ? haveTag(x.n, have) : `<button class="btn edit" data-dbl="${x.id}">${ic('plus')}לפניות</button>`}<button class="lnk edit" data-dbh="${x.id}">לא רלוונטי</button></div></li>`;
  }
  function paintDb(el) {
    const box = el.querySelector('#wzList'); if (!box) return;
    if (DB_STATE !== 'ok') { box.innerHTML = `<p class="hint">${DB_STATE === 'err' ? 'המאגר לא נטען. אפשר לצאת ולפתוח את האשף שוב' : 'טוען את המאגר…'}</p>`; return; }
    const all = dbMatches();
    const hid = WZ.hide.size ? ` · <button class="lnk" data-act="wz-unhide">מוסתרים: ${WZ.hide.size}</button>` : '';
    box.innerHTML = `<p class="hint wz-n">${all.length} מעסיקים${hid}</p><ul class="wz-list">${all.slice(0, WZ.lim).map(dbRow).join('') || '<li class="hint">לא נמצאו מעסיקים. אפשר לשנות אזור או תחום</li>'}</ul>${all.length > WZ.lim ? `<button class="btn wz-more" data-act="wz-more">הצגת עוד ${Math.min(30, all.length - WZ.lim)}</button>` : ''}`;
  }
  const zoneOf = x => WZ.zones.find(z => x.lat && WM.km(z.lat, z.lon, x.lat, x.lon) <= z.r);
  function mapRows() {
    if (WZ.busy) return `<p class="hint">${esc(WZ.busy)}</p>`;
    if (WZ.err) return `<p class="hint">${esc(WZ.err)}</p>`;
    if (!WZ.res) return '';
    const vis = WZ.res.filter(x => !WZ.hideOsm.has(x.osm) && !zoneOf(x)), hid = WZ.res.length - vis.length;
    const unhide = WZ.hideOsm.size || WZ.zones.length ? ` · <button class="lnk" data-act="wz-unmap">מוסתרים: ${hid}</button>` : '';
    return `<p class="hint wz-n">${vis.length} עסקים עד ${WZ.radius} ק"מ${unhide}</p><ul class="wz-list">${vis.map(x => { const have = known(x.name), i = WZ.res.indexOf(x); return `<li class="wz-row"><div class="wz-m"><b>${esc(x.name)}</b>
      <div class="hint">${[x.type, x.dist.toFixed(1) + ' ק"מ', x.addr].filter(Boolean).map(esc).join(' · ')}</div>
      <div class="wz-links">${x.phone ? `<a href="tel:${esc(x.phone.replace(/[^\d+]/g, ''))}" dir="ltr">${esc(x.phone)}</a>` : '<span class="muted">אין טלפון במפה</span>'}${x.web ? `<a href="${esc(/^http/.test(x.web) ? x.web : 'https://' + x.web)}" target="_blank" rel="noopener">אתר</a>` : ''}<a href="https://www.google.com/maps/search/${encodeURIComponent(x.name + ' ' + (x.addr || ''))}/@${x.lat},${x.lon},17z" target="_blank" rel="noopener">במפה</a></div></div>
      <div class="wz-act">${have ? haveTag(x.name, have) : `<button class="btn edit" data-mpl="${i}">${ic('plus')}לפניות</button>`}<button class="lnk edit" data-mph="${i}">לא רלוונטי</button><button class="lnk edit" data-mpz="${i}">הסתרת האזור</button></div></li>`; }).join('') || '<li class="hint">לא נמצאו עסקים. אפשר להרחיק את הטווח או לבחור מגמה אחרת</li>'}</ul>
      <p class="hint wz-src">המפה לא מכירה כל עסק, בעיקר עסקים קטנים. מקור: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap</a></p>`;
  }
  function wizSpec(mg) {
    if (mg) { WZ.fam = famOf(mg); WZ.mapMg = mg; }
    loadDb();
    const opt = (v, cur, label) => `<option value="${esc(v)}" ${v === cur ? 'selected' : ''}>${esc(label || v)}</option>`;
    const dbHtml = () => `<div class="wiz-row wz-filters"><label>תחום <select id="wzFam">${opt('', WZ.fam, 'כל התחומים')}${DB_FAMS.map(f => opt(f, WZ.fam)).join('')}</select></label><label>אזור <select id="wzArea">${opt('', WZ.area, 'כל האזורים')}${DB_AREAS.map(a => opt(a, WZ.area)).join('')}</select></label><label>סטטוס <select id="wzSt">${opt('', WZ.st, 'כל הסטטוסים')}${DB_ST.map(s => opt(s, WZ.st)).join('')}</select></label><label class="wz-q">חיפוש <input class="find" id="wzQ" value="${esc(WZ.q)}" placeholder="שם עסק, איש קשר או מקום"></label></div><div id="wzList"></div>`;
    const mapHtml = () => (WZ.loc ? `<p class="hint">ליד <b>${esc(WZ.loc.label)}</b> · <button class="lnk" data-act="wz-reloc">שינוי מיקום</button></p>
        <div class="wiz-row"><label>מגמה <select id="wizMg">${(MGS.length ? MGS : DB_FAMS).map(m => opt(m, WZ.mapMg)).join('')}</select></label><label>טווח <select id="wizR">${[5, 10, 20, 30].map(r => opt(String(r), String(WZ.radius), r + ' ק"מ')).join('')}</select></label><button class="btn primary" id="wizGo" ${WZ.busy ? 'disabled' : ''}>${ic('search')}חיפוש</button></div><div id="wizOut">${mapRows()}</div>`
      : `<div class="wiz-row"><label class="wz-q">איפה בית הספר? <input class="find" id="wzLocQ" placeholder="עיר, ישוב או כתובת"></label><button class="btn primary" id="wzLocGo">${ic('search')}חיפוש</button></div><div id="wzLocs">${WZ.err ? `<p class="hint">${esc(WZ.err)}</p>` : ''}${(WZ.locs || []).map((x, i) => `<button class="rowbtn wz-loc" data-loc="${i}">${esc(x.label)}</button>`).join('')}${WZ.locs && !WZ.locs.length ? '<p class="hint">לא נמצא. אפשר לנסות שם של עיר</p>' : ''}</div>`);
    const runMap = async () => {
      WZ.busy = 'מחפש במפה…'; WZ.err = ''; WZ.res = null; refreshSub();
      try { WZ.res = await WM.search(WZ.loc, WZ.radius, [WZ.mapMg], m => { WZ.busy = m; refreshSub(); }); }
      catch (e) { WZ.err = e.message || 'המפה לא זמינה כרגע'; }
      WZ.busy = ''; refreshSub();
    };
    const runLoc = async q => {
      WZ.err = ''; WZ.locs = null;
      try { WZ.locs = await WM.geocode(q); } catch (e) { WZ.err = e.message || 'המפה לא זמינה כרגע'; }
      refreshSub();
    };
    return { title: 'אשף מציאת מעסיקים', html: () => `<div class="sub-card">
        <div class="tabs" id="wzTabs"><button class="tab ${WZ.tab === 'db' ? 'cur' : ''}" data-wt="db">${ic('building')}מאגר מעסיקים</button><button class="tab ${WZ.tab === 'map' ? 'cur' : ''}" data-wt="map">${ic('map')}עסקים במפה</button><button class="tab ${WZ.tab === 'leads' ? 'cur' : ''}" data-wt="leads">${ic('user')}פניות ${openLeads().length}</button></div>
        ${WZ.tab === 'db' ? dbHtml() : WZ.tab === 'map' ? mapHtml() : `<ul class="leads wz-leads" id="leads">${leadRows()}</ul>`}</div>`,
      bind: el => {
        const on = (id, ev, fn) => { const n = el.querySelector('#' + id); if (n) n['on' + ev] = fn; };
        paintDb(el);
        const fil = k => e => { WZ[k] = e.target.value; WZ.lim = 30; paintDb(el); };
        on('wzFam', 'change', fil('fam')); on('wzArea', 'change', fil('area')); on('wzSt', 'change', fil('st')); on('wzQ', 'input', fil('q'));
        on('wizMg', 'change', e => { WZ.mapMg = e.target.value; });
        on('wizR', 'change', e => { WZ.radius = +e.target.value; });
        on('wizGo', 'click', runMap);
        on('wzLocGo', 'click', () => { const q = el.querySelector('#wzLocQ').value.trim(); if (q) runLoc(q); });
        on('wzLocQ', 'keydown', e => { if (e.key === 'Enter') el.querySelector('#wzLocGo').click(); });
        el.onclick = e => {
          const t = e.target.closest('button'); if (!t) return;
          const d = t.dataset;
          if (d.wt) { WZ.tab = d.wt; refreshSub(); return; }
          if (d.li != null) { openSub(leadSpec(LEADS[+d.li])); return; }
          if (d.act === 'wz-more') { WZ.lim += 30; paintDb(el); return; }
          if (d.act === 'wz-unhide') { WZ.hide.clear(); wzSet('hide', []); paintDb(el); return; }
          if (d.act === 'wz-unmap') { WZ.hideOsm.clear(); WZ.zones = []; wzSet('hideOsm', []); wzSet('zones', []); refreshSub(); return; }
          if (d.act === 'wz-reloc') { WZ.loc = null; WZ.locs = null; WZ.res = null; WZ.err = ''; wzSet('loc', null); refreshSub(); return; }
          if (d.loc != null) { WZ.loc = WZ.locs[+d.loc]; WZ.locs = null; wzSet('loc', WZ.loc); runMap(); return; }
          if (d.dbl != null) { const x = DB[+d.dbl]; addLead({ name: x.n, st: 'לפנות', note: [x.f, x.p].filter(Boolean).join(' · '), who: x.c, phone: x.t || x.tx || '', mail: x.m || x.mx || '', addr: x.p, mg: MGS.find(m => x.fam.includes(famOf(m))) || x.f }); refreshSub(); return; }
          if (d.dbh != null) { WZ.hide.add(DB[+d.dbh].n); wzSet('hide', [...WZ.hide]); paintDb(el); return; }
          if (d.mpl != null) { const x = WZ.res[+d.mpl]; addLead({ name: x.name, st: 'לפנות', note: [x.type, x.web].filter(Boolean).join(' · '), who: '', phone: x.phone, mail: x.mail, addr: x.addr, mg: WZ.mapMg }); refreshSub(); return; }
          if (d.mph != null) { WZ.hideOsm.add(WZ.res[+d.mph].osm); wzSet('hideOsm', [...WZ.hideOsm]); refreshSub(); return; }
          if (d.mpz != null) { const x = WZ.res[+d.mpz], lbl = (x.addr || x.name).split(',')[0].trim(); if (!confirm(`להסתיר את כל העסקים ברדיוס ${ZONE_KM * 1000} מטר סביב ${lbl}?`)) return; WZ.zones.push({ lat: +x.lat.toFixed(5), lon: +x.lon.toFixed(5), r: ZONE_KM, label: lbl }); wzSet('zones', WZ.zones); refreshSub(); }
        };
      } };
  }
  /* מסך פנייה: פרטים, שלב, תיעוד מה נאמר, הצעד הבא, נוסח פנייה ומעבר ל"מעסיק חדש" עם המסננת */
  const LOG_WAYS = ['שיחת טלפון', 'מייל', 'הודעה', 'ביקור', 'פגישה'];
  function leadSpec(l) {
    const stageNow = () => LEAD_ST.find(s => l.st.startsWith(s)) || '';
    const text = WM.pitch({ contact: l.who || '', me: (R.me && R.me.name) || '[שם]', school: SCHOOL, mg: l.mg || MGS[0] || '', name: l.name });
    const spec = { title: () => esc(l.name), html: () => `<div class="sub-card">
        <p class="hint">${[l.note, l.who].filter(Boolean).map(esc).join(' · ')}</p>
        <div class="wz-links">${l.phone ? `<a href="tel:${esc(l.phone.replace(/[^\d+]/g, ''))}" dir="ltr">${esc(l.phone)}</a>` : ''}${l.mail ? `<span dir="ltr">${esc(l.mail)}</span>` : ''}</div>
        <div class="wiz-row wz-stage"><label>שלב <select id="wzStage" class="edit">${stageNow() ? '' : `<option selected>${esc(l.st)}</option>`}${LEAD_ST.map(s => `<option ${s === stageNow() ? 'selected' : ''}>${s}</option>`).join('')}</select></label><button class="btn primary edit" id="wzToEmp">${ic('plus')}הוספה כמעסיק</button></div></div>
      <div class="sub-card"><h3>תיעוד הפנייה</h3>
        <div class="newform wz-logform edit">
          <div class="field-row"><label class="field"><span>תאריך</span><input class="find" type="date" id="logAt" value="${isoToday()}" max="${isoToday()}"></label><label class="field"><span>איך</span><select id="logWay">${LOG_WAYS.map(w => `<option>${w}</option>`).join('')}</select></label></div>
          <label class="field"><span>מה נאמר</span><textarea class="find wz-pitch" id="logText" rows="4" maxlength="2000"></textarea></label>
          <div class="field-row"><label class="field"><span>הצעד הבא</span><input class="find" id="logNext" maxlength="300" value="${esc(l.next || '')}"></label><label class="field"><span>עד מתי</span><input class="find" type="date" id="logNextAt" value="${esc(l.nextAt || '')}"></label></div>
          <button class="btn primary" id="logSave">שמירת התיעוד</button>
        </div>
        <ul class="wz-log">${(l.log || []).map((g, i) => `<li><div class="wz-log-h"><b>${esc(dm(g.at))}</b><em class="tag">${esc(g.way)}</em><button class="lnk edit" data-logdel="${i}">מחיקה</button></div><p>${esc(g.text)}</p></li>`).join('') || '<li class="hint">אין עדיין תיעוד</li>'}</ul></div>
      <details class="sub-card wz-pitch-box"><summary>נוסח פנייה</summary><textarea class="find wz-pitch" id="wzPitch" rows="17">${esc(text)}</textarea><button class="btn" id="wzCopy">העתקת הנוסח</button></details>`,
      bind: el => {
        const q = id => el.querySelector('#' + id);
        q('wzStage').onchange = e => { const v = e.target.value; l.st = v === 'פניתי' ? 'פניתי · ' + dayMark() : v; leadsChanged(); toast('השלב עודכן'); };
        ['logText', 'logNext', 'logNextAt'].forEach(id => { q(id).oninput = () => { spec.dirty = true; }; });
        q('logSave').onclick = () => {
          const t = q('logText').value.trim(), nx = q('logNext').value.trim(), at = q('logAt').value || isoToday();
          if (!t && !nx) return toast('צריך לכתוב מה נאמר');
          if (t) { l.log = l.log || []; l.log.unshift({ at, way: q('logWay').value, text: t }); l.log.sort((a, b) => b.at.localeCompare(a.at)); }
          l.next = nx; l.nextAt = nx ? q('logNextAt').value : '';
          /* תיעוד ראשון של פנייה שעוד לא יצאה מסמן "פניתי" */
          if (t && stageNow() === 'לפנות') l.st = 'פניתי · ' + dm(at);
          spec.dirty = false; leadsChanged(); refreshSub(); toast('התיעוד נשמר');
        };
        el.onclick = e => { const b = e.target.closest('[data-logdel]'); if (!b || !confirm('למחוק את התיעוד?')) return; l.log.splice(+b.dataset.logdel, 1); leadsChanged(); refreshSub(); };
        q('wzCopy').onclick = () => (navigator.clipboard ? navigator.clipboard.writeText(q('wzPitch').value) : Promise.reject()).then(() => toast('הנוסח הועתק'), () => toast('ההעתקה לא הצליחה'));
        q('wzToEmp').onclick = () => openSub(newEmpSpec({ name: l.name, mentor: l.who, phone: l.phone, addr: l.addr, lead: l }));
      } };
    return spec;
  }

  /* ================= צ'ק ליסט ================= */
  const CHK = [
    ['קבלת התלמיד.ה', [...DOCS, 'שיחת הורים']],
    ['חיבור עם מעסיק', ['מעסיק נבחן במסננת', 'ריאיון למנטור.ית', 'הסכם התקשרות', 'שיחת הכנה אישית']],
    ['קליטה בעבודה', ['ליווי ביום הראשון', 'רפלקציה אחרי שבוע', 'תלוש שכר ראשון', 'דווח.ה בדוח החודשי הראשון']],
    ['ליווי שוטף', ['שיחה אישית החודש', 'נוכחות החודש מלאה', 'ביקור אצל המעסיק (חודשיים)', 'משוב המעסיק · פברואר', 'משוב המעסיק · יוני', 'שלב בפירמידה מעודכן', 'הזמנת הורים לתעסוקה']]
  ];
  const CHKN = CHK.reduce((n, [, l]) => n + l.length, 0);
  /* הצ'ק ליסט מתמלא לבד מהתיק (מסמכים, יומן, טפסים, שיבוץ, נוכחות, הגשה). מה שהתיק לא יודע נשאר ריק, והרכז.ת מסמנ.ת ידנית */
  const MANUAL = R.MANUAL, AUTO = {}, DONE = {};
  function autoChk(s) {
    const d = new Set(), e = EMPS[s.emp], ds = dates(s);
    s.docs.forEach((x, i) => { if (x.s === 'ok' || x.s === 'na') d.add('0.' + i); });
    if (milesOf(s)[7] || hasForm(s, 0)) d.add('0.' + DOCS.length);
    if (e && e.mas && e.mas !== 'לא מאושר') d.add('1.0');
    if (hasLog(s, /ריאיון/)) d.add('1.1');
    if (DOCS.some((n, i) => /הסכם/.test(n) && s.docs[i] && s.docs[i].s === 'ok') || hasLog(s, /הסכם/)) d.add('1.2');
    if (hasLog(s, /שיחת הכנה/) || hasForm(s, 1)) d.add('1.3');
    if (hasLog(s, /יום הראשון|יום ראשון בעבודה/) || hasForm(s, 2)) d.add('2.0');
    if (hasLog(s, /רפלקציה/) || hasForm(s, 3)) d.add('2.1');
    if (hasLog(s, /תלוש/)) d.add('2.2');
    if (s.emp && SUBMITTED[s.mg]) d.add('2.3');
    if (hasLog(s, /שיחה אישית/, true) || hasForm(s, 4)) d.add('3.0');
    if (s.emp && ds.length && ds.filter(x => x <= MONTH.today).every(x => ATT[s.id][x])) d.add('3.1');
    if (e && e.visit && e.visit !== '—' && !(e.contact > 60)) d.add('3.2');
    if (milesOf(s)[5]) d.add('3.3');
    if (milesOf(s)[6]) d.add('3.4');
    if (s.stageManual != null) d.add('3.5');
    if (milesOf(s)[8]) d.add('3.6');
    return d;
  }
  function refreshChk() { STU.forEach(s => { MANUAL[s.id] = MANUAL[s.id] || new Set(); AUTO[s.id] = autoChk(s); DONE[s.id] = new Set([...AUTO[s.id], ...MANUAL[s.id]]); }); }
  function renderChkStu() {
    refreshChk();
    $('chkStu').innerHTML = `<div class="chk-grid"><div class="chk-row chk-head"><span></span>${CHK.map(([n, l]) => `<span>${n}<small>${l.length}</small></span>`).join('')}<span>סה"כ</span></div>` +
      active().map(s => { const d = DONE[s.id]; return `<div class="chk-row"><button class="name" data-open="${s.id}">${esc(s.name)}<small>${esc(s.cls)}${s.emp ? ' · ' + esc(empName(s.emp)) : ''}</small></button>${CHK.map(([, l], gi) => { const n = l.filter((_, i) => d.has(gi + '.' + i)).length; return `<button class="chk-cell ${n === l.length ? 'full' : n ? 'part' : ''}" data-sid="${s.id}" data-g="${gi}"><i style="--p:${n / l.length}"></i><span>${n}/${l.length}</span><small class="cl">${CHK[gi][0]}</small></button>`; }).join('')}<span class="chk-sum">${d.size}/${CHKN}</span></div>`; }).join('') + '</div>';
  }
  function chkSpec(sid, gi) {
    const s = STU.find(x => x.id === sid), [name, items] = CHK[gi];
    return { title: () => `${esc(s.name)} · ${name}`, html: () => { refreshChk(); const d = DONE[sid], a = AUTO[sid];
      return `<div class="sub-card"><p class="hint">${esc(s.cls)}${s.emp ? ' · ' + esc(empName(s.emp)) : ''} · <a href="#" data-open="${s.id}">לתיק</a></p><ul class="chk-items">${items.map((it, i) => { const k = gi + '.' + i, au = a.has(k); return `<li class="${d.has(k) ? 'ok' : ''}"><label><input type="checkbox" data-k="${k}" ${d.has(k) ? 'checked' : ''} ${au ? 'disabled' : ''}>${it}</label>${au ? '<small class="auto">מהתיק</small>' : gi === 0 && s.docs[i] && s.docs[i].n ? `<small>${esc(s.docs[i].n)}</small>` : ''}</li>`; }).join('')}</ul></div>`; },
      bind: el => { el.onchange = e => { const k = e.target.dataset.k; if (!k) return; const m = MANUAL[sid], di = +k.split('.')[1];
          /* מסמכים: מקור אחד — התיק. הצ'ק ליסט כותב לתיק ולא שומר סימון משלו */
          if (gi === 0 && s.docs[di]) s.docs[di].s = e.target.checked ? 'ok' : 'miss'; else e.target.checked ? m.add(k) : m.delete(k); renderChkStu(); renderStuList(); refreshSub(); }; } };
  }
  $('chkStu').addEventListener('click', e => { const c = e.target.closest('.chk-cell'); if (c) openSub(chkSpec(c.dataset.sid, +c.dataset.g)); });
  /* ---- הגאנט השנתי ---- */
  function renderChkCal() {
    const strip = `<div class="gantt" role="img" aria-label="הגאנט השנתי של הליווי">${GM.map((m, i) => `<span class="gm ${i === CUR_M ? 'cur' : i < CUR_M ? 'past' : ''}" style="grid-column:${i + 1}">${m.slice(0, 3)}</span>`).join('')}${PHASES.map(([n, a, b, c]) => `<span class="gp ${c}" style="grid-column:${a + 1}/${b + 2}">${n}</span>`).join('')}${`<span class="gnow" style="grid-column:${CUR_M + 1}"></span>`}</div>
      <p class="hint g-src">לפי <a href="${SITE}career-rakaz.html" target="_blank" rel="noopener">הגאנט השנתי של הליווי</a> ו<a href="${SITE}nohal-rakaz-chanichut.html" target="_blank" rel="noopener">נוהל רכז.ת החניכות</a></p>`;
    $('chkCal').innerHTML = strip + `<div class="cal-list">${G.map((items, mi) => {
      const st = mi < CUR_M ? 'past' : mi === CUR_M ? 'cur' : 'next', ph = PHASES.find(([, a, b]) => mi >= a && mi <= b);
      const doneOf = it => it.m != null ? (() => { const c = mileCount(it.m); return c.n > 0 && c.x === c.n; })() : it.d === true;
      const done = items.filter(doneOf).length;
      return `<details class="cal-m ${st}" ${mi === CUR_M ? 'open' : ''}><summary><b>${GM[mi]}</b><em class="tag gtag ${ph[3]}">${ph[0]}</em><span class="hint">${done}/${items.length}</span>${mi === CUR_M ? '<em class="tag no">החודש</em>' : ''}</summary><ul class="chk-items">${gOrder(mi).map(i => { const it = items[i], dn = doneOf(it); let extra = '';
        if (it.m != null) { const c = mileCount(it.m); extra = `<span class="mprog"><em class="tag ${c.x === c.n && c.n ? 'ok' : 'no'}">${c.x}/${c.n}</em><button class="lnk" data-mile="${it.m}">תלמידים וטפסים</button></span>`; }
        return `<li class="${dn ? 'ok' : ''}"><label><input type="checkbox" data-m="${mi}" data-i="${i}" ${dn ? 'checked' : ''} ${it.m != null ? 'disabled' : ''}>${it.t}</label>${extra}</li>`; }).join('')}</ul></details>`; }).join('')}</div>`;
  }
  $('chkCal').addEventListener('change', e => { const m = e.target.dataset.m; if (m == null) return; if (!canEdit()) return renderChkCal(); const i = +e.target.dataset.i; G[+m][i].d = e.target.checked; if (e.target.checked) R.meta.gantt[gk(+m, i)] = true; else delete R.meta.gantt[gk(+m, i)]; renderChkCal(); });
  $('chkCal').addEventListener('click', e => { const b = e.target.closest('[data-mile]'); if (b) openSub(mileListSpec(+b.dataset.mile)); });
  function mileListSpec(i) {
    const F = formOf(i);
    return { title: MILES[i][0], html: () => { const l = mileStudents(i), c = mileCount(i);
      return `<div class="sub-card"><p class="hint">${F.who} · <a href="${SITE}${F.src[0]}" target="_blank" rel="noopener">${F.src[1]}</a></p><em class="tag ${c.x === c.n && c.n ? 'ok' : 'no'}">${c.x} מתוך ${c.n}</em></div>
        <div class="rows">${l.map(s => { const f = hasForm(s, i), lg = !f && milesOf(s)[i]; return `<button class="rowbtn" data-mf="${s.id}">${ic('user')}<b>${esc(s.name)}</b><span class="rtag">${f ? `<em class="tag ok">מולא ${esc(s.forms[i].d)}</em>` : lg ? '<em class="tag ok">רשום ביומן</em>' : '<em class="tag no">חסר</em>'}</span>${chev}<small>${esc(s.cls)} · ${esc(empName(s.emp))}</small></button>`; }).join('') || '<p class="empty">אין תלמידים.</p>'}</div>`; },
      bind: el => { el.querySelectorAll('[data-mf]').forEach(b => b.onclick = () => openSub(formSpec(STU.find(s => s.id === b.dataset.mf), i))); } };
  }
  $('chkTabs').onclick = e => { const b = e.target.closest('[data-tab]'); if (!b) return; document.querySelectorAll('#chkTabs .tab').forEach(x => x.classList.toggle('cur', x === b)); $('chkStu').hidden = b.dataset.tab !== 'stu'; $('chkCal').hidden = b.dataset.tab !== 'cal'; if (b.dataset.tab === 'cal') { const g = document.querySelector('.gantt'), c = g && g.querySelector('.gm.cur'); if (g && c && g.scrollWidth > g.clientWidth) g.scrollLeft = c.offsetLeft - g.clientWidth / 2 + c.offsetWidth / 2; } };
  $('empTabs').onclick = e => { const b = e.target.closest('[data-tab]'); if (!b) return; document.querySelectorAll('#empTabs .tab').forEach(x => x.classList.toggle('cur', x === b)); $('panelOut').hidden = b.dataset.tab !== 'out'; $('panelIn').hidden = b.dataset.tab !== 'in'; $('panelLeads').hidden = b.dataset.tab !== 'leads'; };
  $('panelLeads').onclick = e => { const b = e.target.closest('[data-li]'); if (b) openSub(leadSpec(LEADS[+b.dataset.li])); };

  /* ================= תוכנית חניכות ================= */
  function renderProgram() {
    const plan = PROG.items.reduce((a, x) => a + (+x.plan || 0), 0), done = PROG.items.reduce((a, x) => a + (+x.done || 0), 0), rec = PROG.items.filter(x => x.rec).length, B = budget();
    $('progBody').innerHTML = `<div class="kpis prog-kpis">
        <div class="kpi"><b>${nis(B)}</b><span>הרכיב לבית הספר</span></div><div class="kpi"><b>${nis(plan)}</b><span>תוכנן</span></div><div class="kpi"><b>${nis(done)}</b><span>בוצע</span></div><div class="kpi"><b class="${B - done < 0 ? 'warn' : ''}">${nis(B - done)}</b><span>יתרה</span></div><div class="kpi"><b>${rec}/${PROG.items.filter(x => x.done).length}</b><span>קבלות להוצאות</span></div>
        <div class="kpi edit"><label class="kpi-in"><input type="number" id="progStu" value="${PROG.students}" min="0" dir="ltr"><span>תלמידי ט׳–י״ב בתכנון המאושר</span></label></div></div>
      <h3 class="sub-h">הפעימות</h3>
      <div class="beats">${BEATS.map(([n, p, w, ok]) => `<div class="beat ${ok ? 'ok' : ''}">${ic(ok ? 'check' : 'clock')}<b>${n} · ${p}</b><small>${w}</small></div>`).join('')}</div>
      <h3 class="sub-h">הפעילויות</h3>
      <div class="rows" id="progRows">${PROG.items.map((x, i) => `<button class="rowbtn" data-prog="${i}">${ic('wallet')}<b>${esc(x.type)}</b><span class="rtag"><em class="tag">${nis(x.plan)}</em>${x.done ? ` <em class="tag ${x.rec ? 'ok' : 'no'}">${x.rec ? 'בוצע · יש קבלה' : 'בוצע · חסרה קבלה'}</em>` : ''}</span>${chev}<small>${esc(x.desc)}${x.part ? ' · ' + x.part + ' משתתפים' : ''}${x.d ? ' · ' + esc(x.d) : ''}${x.who ? ' · ' + esc(x.who) : ''}</small></button>`).join('') || '<p class="empty">עוד אין פעילויות בתוכנית.</p>'}</div>`;
    const inp = $('progStu'); if (inp) inp.onchange = () => { PROG.students = +inp.value || 0; renderProgram(); };
  }
  document.getElementById('program').addEventListener('click', e => {
    const b = e.target.closest('[data-prog]'); if (b) { openSub(progItemSpec(+b.dataset.prog)); return; }
    if (e.target.closest('[data-act="prog-add"]')) openSub(progItemSpec(null));
    if (e.target.closest('[data-act="prog-print"]')) openSub(progPrintSpec());
  });
  function progItemSpec(idx) {
    const x = idx == null ? { type: PROG_TYPES[0], desc: '', part: '', plan: '', done: '', rec: '', d: '', who: '' } : PROG.items[idx];
    return { dirtyWatch: true, title: idx == null ? 'פעילות חדשה בתוכנית' : esc(x.type), html: () => `<div class="sub-card newform">
        <div class="field-row"><label class="field"><span>סוג הפעילות</span><select id="piType">${PROG_TYPES.map(t => `<option ${t === x.type ? 'selected' : ''}>${t}</option>`).join('')}</select></label><label class="field"><span>תאריך</span><input class="find" id="piD" value="${esc(x.d)}" placeholder="${TODAY}"></label></div>
        <label class="field"><span>תיאור</span><input class="find" id="piDesc" value="${esc(x.desc)}"></label>
        <div class="field-row"><label class="field"><span>ספק / מעסיק</span><input class="find" id="piWho" value="${esc(x.who)}"></label><label class="field"><span>משתתפים</span><input class="find" id="piPart" type="number" dir="ltr" value="${esc(x.part)}"></label></div>
        <div class="field-row"><label class="field"><span>סכום מתוכנן ₪</span><input class="find" id="piPlan" type="number" dir="ltr" value="${esc(x.plan)}"></label><label class="field"><span>בוצע בפועל ₪</span><input class="find" id="piDone" type="number" dir="ltr" value="${esc(x.done)}"></label></div>
        <div class="field"><span>קבלה או חשבונית</span><div class="rec-row">${x.rec ? `<em class="tag ok">${ic('file')}${esc(x.rec)}</em>` : '<em class="tag no">חסרה</em>'}<label class="btn edit">${ic('upload')}העלאת קבלה<input type="file" id="piRec" accept=".pdf,image/*" hidden></label></div></div>
        <div class="emp-b mf-b edit"><button class="btn primary" id="piSave">${ic('check')}שמירה</button>${idx != null ? `<button class="btn quiet" id="piDel">${ic('x')}מחיקה</button>` : ''}</div></div>`,
      bind: (el, spec) => {
        $('piRec').onchange = () => { const f = $('piRec').files[0]; if (f) { x.rec = f.name; spec.dirty = true; refreshSub(); toast('הקבלה צורפה · לשמור'); } };
        $('piSave').onclick = () => { Object.assign(x, { type: $('piType').value, d: $('piD').value.trim(), desc: $('piDesc').value.trim(), who: $('piWho').value.trim(), part: +$('piPart').value || '', plan: +$('piPlan').value || 0, done: +$('piDone').value || 0 }); if (idx == null && !PROG.items.includes(x)) PROG.items.push(x); spec.dirty = false; renderProgram(); renderToday(); closeSub(); toast('הפעילות נשמרה'); };
        const del = $('piDel'); if (del) del.onclick = () => { if (!confirm('למחוק את הפעילות?')) return; PROG.items.splice(idx, 1); spec.dirty = false; renderProgram(); renderToday(); closeSub(); toast('הפעילות נמחקה'); };
      } };
  }
  function progPrintSpec() {
    return { title: 'דוח תוכנית החניכות · תשפ״ז', html: () => { const plan = PROG.items.reduce((a, x) => a + (+x.plan || 0), 0), done = PROG.items.reduce((a, x) => a + (+x.done || 0), 0), part = PROG.items.reduce((a, x) => a + (+x.part || 0), 0);
      return `<div class="sub-card print-doc">
        <div class="pd-head"><div><b>${esc(SCHOOL)}</b><br>רכיב "מקצוע וחניכות" בסל התוכניות · תשפ״ז<br><small>${esc(MONTH.label)} · רכז.ת החניכות</small></div>${LOGO.replace('class="lg"', 'class="pd-logo"')}</div>
        <dl class="kv pd-kv"><dt>תלמידי ט׳–י״ב בתכנון</dt><dd>${PROG.students}</dd><dt>הרכיב לבית הספר</dt><dd>${nis(budget())}</dd><dt>תוכנן</dt><dd>${nis(plan)}</dd><dt>בוצע</dt><dd>${nis(done)}</dd><dt>משתתפים (מצטבר)</dt><dd>${part}</dd></dl>
        <h3>הפעילויות שבוצעו ותוכננו</h3>
        <table class="pd-table"><thead><tr><th>פעילות</th><th>תיאור</th><th>תאריך</th><th>משתתפים</th><th>תוכנן</th><th>בוצע</th><th>אסמכתה</th></tr></thead><tbody>${PROG.items.map(x => `<tr><td>${esc(x.type)}</td><td>${esc(x.desc)}</td><td>${esc(x.d || '—')}</td><td>${x.part || '—'}</td><td>${nis(x.plan)}</td><td>${x.done ? nis(x.done) : '—'}</td><td>${x.rec ? esc(x.rec) : (x.done ? '<span class="warn">חסרה</span>' : '—')}</td></tr>`).join('')}</tbody><tfoot><tr><td colspan="4">סה"כ</td><td>${nis(plan)}</td><td>${nis(done)}</td><td></td></tr></tfoot></table>
        <h3>עמידה ביעדים ותרומה לתלמידים</h3><textarea class="pd-text view-ok" rows="3" placeholder="מה הושג, מה ההשפעה על אחוז המועסקים ועל גיוון מקומות התעסוקה"></textarea>
        <h3>המלצות להמשך</h3><textarea class="pd-text view-ok" rows="2"></textarea>
        <p class="pd-sign">חתימת רכז.ת החניכות: ____________ &nbsp;&nbsp; חתימת מנהל.ת בית הספר: ____________ &nbsp;&nbsp; תאריך: ${TODAY}.${MONTH.y}</p>
        <div class="emp-b mf-b noprint"><button class="btn primary view-ok" id="pdPrint">${ic('print')}הדפסה או שמירה כ-PDF</button></div></div>`; },
      bind: () => { $('pdPrint').onclick = () => window.print(); } };
  }

  /* ================= טפסים וקישורים ================= */
  function renderLinks() {
    $('linksBody').innerHTML = LINKS.map(([g, items]) => `<details class="grp" open><summary>${esc(g)}<small>${items.length}</small></summary><div class="rows">${items.map(([t, d, u]) => { const ext = /^https?:/.test(u), href = ext ? u : SITE + u, dom = ext ? new URL(u).hostname.replace('www.', '') : 'pedagogiamh.co.il'; return `<a class="rowbtn" href="${esc(href)}" target="_blank" rel="noopener">${ic(/\.pdf$|\.pptx$/.test(u) ? 'file' : ext ? 'folder' : 'link')}<b>${esc(t)}</b><span class="rtag"><em class="tag" dir="ltr">${esc(dom)}</em></span>${chev}<small>${esc(d)}</small></a>`; }).join('')}</div></details>`).join('');
  }

  /* ================= דוחות — שורות, כל דוח במסך משלו ================= */
  const REPORTS = [
    ['month', 'download', 'דוח תעסוקה חודשי', () => `${esc(MONTH.label)} · ${active().length} תלמידים · ${MGS.filter(m => SUBMITTED[m]).length}/${MGS.length} מגמות הוגשו`],
    ['manager', 'eye', 'דוח חודשי למנהל.ת', () => 'מספרים לפי מגמה ופירמידה'],
    ['days', 'cal', 'נוכחות לפי ימים', () => esc(MONTH.name) + ' · לפי כיתה']
  ];
  /* ייצוא לקובץ CSV (נפתח באקסל). נבנה בדפדפן — השמות לא עוברים בשרת */
  function exportMonth() {
    const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const rows = [['תלמיד.ה', 'כיתה', 'מגמה', 'מעסיק', 'סיבת אי-העסקה', 'ימי עבודה', 'הגיע.ה', 'סומנו', 'שעות', 'מצב', 'שלב בפירמידה', 'הגשה']].concat(active().map(s => { const st = attStat([s]); return [s.name, s.cls, s.mg, s.emp ? empName(s.emp) : '', s.emp ? '' : s.why || '', dates(s).length, st.p, st.t, fmtH(hoursOf(s).h), s.status, STAGES[s.stage], SUBMITTED[s.mg] ? 'הוגש' : 'טרם']; }));
    const blob = new Blob(['﻿' + rows.map(r => r.map(q).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `דוח תעסוקה · ${SCHOOL} · ${MONTH.label}.csv`; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function renderReports() { $('repRows').innerHTML = REPORTS.map(([k, i, t, d]) => `<button class="rowbtn" data-rep="${k}">${ic(i)}<b>${t}</b><span></span>${chev}<small>${d()}</small></button>`).join(''); }
  $('repRows').onclick = e => { const b = e.target.closest('[data-rep]'); if (!b) return; openSub(repSpec(b.dataset.rep)); };
  function repSpec(k) {
    const R0 = REPORTS.find(r => r[0] === k);
    const specs = {
      month: { html: () => { const L = active(), none = L.filter(s => !s.emp && !s.why).length, lab = ['תלמיד.ה', 'מגמה', 'מעסיק', 'ימי עבודה', 'נוכחות', 'שעות', 'מצב', 'הגשה']; return `<div class="sub-card"><div class="rep-row"><select class="view-ok"><option>${esc(MONTH.label)}</option></select><button class="btn primary edit" id="repExport">${ic('download')}ייצוא</button></div>${none ? `<p class="hint warn">${none} תלמידים בלי מקום עבודה ובלי "סיבת אי-העסקה". צריך להשלים בתיק לפני הייצוא.</p>` : ''}
          <div class="mg-table cards"><div class="mg-row mg-head rep8">${lab.map(x => `<span>${x}</span>`).join('')}</div>${L.map(s => { const ds = dates(s), p = ds.filter(d => present(ATT[s.id][d])).length; return `<div class="mg-row rep8">${cellsRow([`<a href="#" data-open="${s.id}">${esc(s.name)}</a>`, esc(s.mg), esc(empName(s.emp)) + (!s.emp && s.why ? ' · ' + esc(s.why) : ''), ds.length, (st => `${st.p}/${st.t}`)(attStat([s])), fmtH(hoursOf(s).h), s.status === 'לומד' ? 'לומד.ת' : esc(s.status), SUBMITTED[s.mg] ? '<em class="tag ok">הוגש</em>' : '<em class="tag no">טרם</em>'], lab)}</div>`; }).join('')}</div></div>`; }, bind: () => { const b = $('repExport'); if (b) b.onclick = () => { exportMonth(); toast('הקובץ ירד · ' + MONTH.label); }; } },
      manager: { html: () => { const L = active(), out = L.filter(s => PLACE(s.emp) === 'out').length, inn = L.filter(s => PLACE(s.emp) === 'in').length, cnt = STAGES.map((_, i) => L.filter(s => s.stage === i).length), lab = ['מגמה', 'תלמידים', 'בחוץ', 'עסק בית-ספרי', 'לא מועסקים', 'נוכחות', 'שעות', 'הגשה']; return `<div class="sub-card"><p class="hint">מה שהמנהל.ת מקבל.ת במייל בסוף כל חודש</p><div class="kpis">${[[L.length, 'תלמידים בחניכות'], [out, 'עובדים בחוץ'], [inn, 'עובדים בעסק בית-ספרי'], [L.length - out - inn, 'לא מועסקים'], [attPct(L) + '%', 'נוכחות ' + MONTH.name], [`${MGS.filter(m => SUBMITTED[m]).length}/${MGS.length}`, 'מגמות הוגשו']].map(([n, l]) => `<div class="kpi"><b>${n}</b><span>${l}</span></div>`).join('')}</div>
          <h3 class="sub-h">לפי מגמה</h3><div class="mg-table cards"><div class="mg-row mg-head m8">${lab.map(x => `<span>${x}</span>`).join('')}</div>${MGS.map(m => { const l = L.filter(s => s.mg === m), o = l.filter(s => PLACE(s.emp) === 'out').length, n = l.filter(s => PLACE(s.emp) === 'in').length; return `<div class="mg-row m8">${cellsRow([`<b>${esc(m)}</b>`, l.length, o, n, l.length - o - n, attPct(l) + '%', fmtH(l.reduce((q, s) => q + hoursOf(s).h, 0)), SUBMITTED[m] ? 'הוגש' : 'טרם'], lab)}</div>`; }).join('')}</div>
          <h3 class="sub-h">הפירמידה</h3><div class="pyr-bar">${STAGES.map((st, i) => cnt[i] ? `<span class="pyr-seg s${i}" style="flex:${cnt[i]}">${cnt[i]}</span>` : '').join('')}</div><div class="pyr-leg">${STAGES.map((st, i) => `<span><i class="s${i}"></i>${st} · ${cnt[i]}</span>`).join('')}</div></div>`; } },
      days: { html: () => `<div class="sub-card"><div class="rep-row"><select id="daysCls" class="view-ok">${classes.map(c => `<option>${esc(c)}</option>`).join('')}</select></div>${LEGEND}<div id="daysOut" class="fold-rep"></div></div>`, bind: () => { const paint = () => { const cls = $('daysCls').value, l = active().filter(s => s.cls === cls); $('daysOut').innerHTML = l.map(s => { const ds = dates(s); return `<div class="row"><div class="who"><b>${esc(s.name)}</b>${statusTag(s)}<small>${esc(empName(s.emp))}</small></div><div class="cells">${ds.map(d => cellHtml(s, d, false)).join('')}</div><div class="sum">${ds.filter(d => present(ATT[s.id][d])).length} מתוך ${ds.length}</div>${dayLines(s)}</div>`; }).join('') || '<p class="empty">אין תלמידים בכיתה.</p>'; }; $('daysCls').onchange = paint; paint(); } },
    };
    return { title: R0[2], ...specs[k] };
  }

  /* ================= ניהול — שורות, כל נושא במסך משלו ================= */
  const ADMIN = [
    ['upload', 'upload', 'הוספת תלמידים מרשימה', () => 'הדבקה מאקסל: שם, כיתה, מגמה'],
    ['listfile', 'file', 'רשימה מקובץ · תלמידים ומעסיקים', () => 'Excel או CSV: שיבוץ תלמידים למעסיקים, מעסיקים חדשים נוספים לבד'],
    ['users', 'user', 'משתמשים', () => `${Object.values(CT.cls).filter(x => x.mail).length} מחנכים · ${Object.values(CT.grade).filter(x => x.mail).length} רכזי שכבה · אישור גישה`],
    ['frames', 'layers', 'תעסוקה בחוץ ובעסק בית-ספרי', () => ({ out: 'תעסוקת חוץ בלבד', in: 'עסק בית-ספרי בלבד', both: 'חוץ ועסק בית-ספרי' })[FRAMES]],
    ['rem', 'bell', 'תזכורות על היעדרות', () => `כל יום ב-16:00 · אחרי ${REM_CFG.streak} ברצף גם לרכז.ת השכבה · ${REM.length} נשלחו${pending().length ? ' · ' + pending().length + ' יוצאות היום' : ''}`]
  ];
  function renderAdmin() { $('admRows').innerHTML = ADMIN.map(([k, i, t, d]) => `<button class="rowbtn" data-adm="${k}">${ic(i)}<b>${t}</b><span></span>${chev}<small>${d()}</small></button>`).join(''); }
  $('admRows').onclick = e => { const b = e.target.closest('[data-adm]'); if (!b) return; openSub(admSpec(b.dataset.adm)); };
  /* הדבקה מאקסל: כל שורה תלמיד.ה. עמודות: שם, כיתה, מגמה, ואם יש — טלפון ומספר פעולה. מפריד: טאב או פסיק */
  function parseList(txt) {
    return txt.split(/\r?\n/).map(l => l.split(/\t|,/).map(x => x.trim())).filter(c => c[0] && !/^שם/.test(c[0]))
      .map(c => ({ name: c[0], cls: c[1] || '', mg: c[2] || '', phone: c[3] || '', act: c[4] || '' }));
  }
  let USERS = null;
  const ROLE_HE = { rakaz: 'רכז.ת החניכות', principal: 'מנהל.ת בית הספר', pedco: 'רכז.ת פדגוגי.ת' };

  /* ===== רשימה מקובץ: תלמידים ומעסיקים (3.11.26, מהפיילוט) =====
     Excel או CSV שבית הספר כבר מנהל. הכול בדפדפן: הקובץ לא עולה לשרת. העמודות מזוהות לפי הכותרת, בכל סדר.
     תלמיד.ה לפי ת"ז ואז לפי שם; מעסיק לפי שם (חדש = "טרם נבדק במסננת"). תצוגה מקדימה לפני העדכון. */
  const LF_COLS = {
    name: ['שם מלא', 'שם', 'שם התלמיד', 'שם תלמיד', 'שם התלמיד/ה', 'שם התלמיד.ה', 'תלמיד', 'תלמיד/ה', 'תלמיד.ה', 'שם התלמידה'], first: ['שם פרטי', 'פרטי'], last: ['שם משפחה', 'משפחה'],
    tz: ['תעודת זהות', 'ת"ז', 'ת.ז', 'ת.ז.', 'תז', 'מספר זהות', 'ת״ז'], cls: ['כיתה', 'קבוצה', 'כתה'], mg: ['מגמה', 'מקצוע'], act: ['מספר פעולה', 'פעולה'],
    emp: ['מעסיק', 'שם המעסיק', 'שם מעסיק', 'מקום עבודה', 'מקום העבודה', 'מקום התעסוקה', 'מקום תעסוקה', 'עסק', 'שם העסק', 'מקום חניכות', 'חניכות'],
    contact: ['איש קשר', 'אשת קשר', 'איש.אשת קשר', 'שם איש קשר', 'איש קשר במעסיק', 'מנהל', 'מנהל העבודה'], ephone: ['טלפון מעסיק', 'טלפון המעסיק', 'טלפון איש קשר', 'נייד מעסיק', 'טלפון'],
    addr: ['כתובת', 'כתובת המעסיק', 'כתובת העסק'], days: ['ימי עבודה', 'ימים', 'ימי חניכות', 'יום עבודה'], phone: ['טלפון תלמיד', 'נייד תלמיד', 'טלפון התלמיד', 'נייד', 'טלפון תלמיד/ה'],
    mentor: ['מנטור', 'מנטורית', 'מנטור.ית', 'חונך', 'חונכת', 'חונך.ת']
  };
  const lfNorm = s => String(s == null ? '' : s).replace(/[\s"'״׳.:/\-]+/g, '').toLowerCase();
  function lfHeader(rows) {
    const keys = {}; Object.entries(LF_COLS).forEach(([k, l]) => l.forEach(h => { keys[lfNorm(h)] = keys[lfNorm(h)] || k; }));
    let best = null;
    rows.slice(0, 25).forEach((r, i) => { const ix = {}; let n = 0; r.forEach((c, j) => { const k = keys[lfNorm(c)]; if (k && ix[k] == null) { ix[k] = j; n++; } }); if (n >= 2 && (!best || n > best.n)) best = { i, ix, n }; });
    return best;
  }
  const lfDays = v => { const M = { 'א': 0, 'ב': 1, 'ג': 2, 'ד': 3, 'ה': 4, 'ו': 5, 'ראשון': 0, 'שני': 1, 'שלישי': 2, 'רביעי': 3, 'חמישי': 4, 'שישי': 5 }; return [...new Set(String(v || '').split(/[,\s/·+;|]+/).map(x => x.replace(/[׳'"]/g, '').replace(/^יום/, '')).map(x => M[x]).filter(x => x != null))].sort(); };
  const lfTz = v => { const d = String(v == null ? '' : v).replace(/\D/g, ''); return d && d.length <= 9 ? d.padStart(9, '0') : d; };
  function lfParseCsv(txt) {
    const rows = []; let row = [], cell = '', q = false;
    for (let i = 0; i < txt.length; i++) { const ch = txt[i];
      if (q) { if (ch === '"') { if (txt[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
      else if (ch === '"' && cell === '') q = true;   /* גרשיים פותחים רק בתחילת תא: ת"ז באמצע תא נשאר כמו שהוא */
      else if (ch === ',' || ch === '\t' || ch === ';') { row.push(cell); cell = ''; }
      else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; } else if (ch !== '\r') cell += ch; }
    row.push(cell); if (row.some(c => c !== '')) rows.push(row);
    return rows;
  }
  function lfLoadXlsx() { return window.XLSX ? Promise.resolve() : new Promise((res, rej) => { const sc = document.createElement('script'); sc.src = 'xlsx.full.min.js'; sc.onload = res; sc.onerror = () => rej(new Error('ספריית האקסל לא נטענה')); document.head.appendChild(sc); }); }
  async function lfReadFile(f) {
    const buf = await f.arrayBuffer();
    if (/\.(csv|tsv|txt)$/i.test(f.name)) { let t = new TextDecoder('utf-8').decode(buf); if (t.includes('�')) { try { t = new TextDecoder('windows-1255').decode(buf); } catch (e) {} } return lfParseCsv(t.replace(/^﻿/, '')); }
    await lfLoadXlsx();
    const wb = XLSX.read(buf, { type: 'array' }), sh = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sh, { header: 1, raw: false, defval: '' }).map(r => r.map(c => String(c == null ? '' : c)));
  }
  const lfEmpByName = n => { const k = normName(n); return Object.entries(EMPS).concat(Object.entries(INS)).find(([, e]) => normName(e.name) === k); };
  /* ניתוח: לכל שורה — התלמיד.ה שנמצא.ה (או לא), והמעסיק (קיים או חדש) */
  function lfAnalyze(rows) {
    const H = lfHeader(rows); if (!H) return { error: 'לא נמצאה שורת כותרות. צריך לפחות שתי עמודות מוכרות, למשל "שם" ו"מעסיק".' };
    const ix = H.ix, has = k => ix[k] != null, g = (r, k) => has(k) ? String(r[ix[k]] == null ? '' : r[ix[k]]).replace(/\s+/g, ' ').trim() : '';
    if (!has('name') && !(has('first') && has('last'))) return { error: 'לא נמצאה עמודת שם (או "שם פרטי" ו"שם משפחה").' };
    const used = new Set(), newEmps = {}, items = [];
    rows.slice(H.i + 1).forEach(r => {
      const name = has('name') ? g(r, 'name') : (g(r, 'first') + ' ' + g(r, 'last')).trim(); if (!name && !g(r, 'tz')) return;
      const tz = lfTz(g(r, 'tz'));
      let s = tz ? STU.find(y => !used.has(y.id) && lfTz(y.tz) === tz) : null;
      if (!s && name) s = STU.find(y => !used.has(y.id) && normName(y.name) === normName(name));
      if (s) used.add(s.id);
      const emp = g(r, 'emp'), ex = emp ? lfEmpByName(emp) : null, nk = emp && !ex ? normName(emp) : '';
      if (nk && !newEmps[nk]) newEmps[nk] = { name: emp, manager: g(r, 'contact'), phone: g(r, 'ephone'), addr: g(r, 'addr'), mentor: g(r, 'mentor'), mgs: new Set() };
      if (nk && (s ? s.mg : g(r, 'mg'))) newEmps[nk].mgs.add(s ? s.mg : g(r, 'mg'));
      items.push({ name: s ? s.name : name, s, tz, cls: g(r, 'cls'), mg: g(r, 'mg'), act: g(r, 'act'), phone: g(r, 'phone'), emp, empId: ex ? ex[0] : '', newKey: nk, days: has('days') ? lfDays(g(r, 'days')) : null, hasDays: has('days') && !!g(r, 'days') });
    });
    return { cols: Object.keys(ix), items, newEmps, found: items.filter(x => x.s).length, missing: items.filter(x => !x.s), withEmp: items.filter(x => x.emp).length };
  }
  function listFileSpec() {
    let A = null, FNAME = '';
    const colsHe = { name: 'שם', first: 'שם פרטי', last: 'שם משפחה', tz: 'ת"ז', cls: 'כיתה', mg: 'מגמה', act: 'מספר פעולה', emp: 'מעסיק', contact: 'איש קשר', ephone: 'טלפון מעסיק', addr: 'כתובת', days: 'ימי עבודה', phone: 'טלפון תלמיד.ה', mentor: 'מנטור.ית' };
    return { html: () => `<div class="sub-card newform">
        <p class="hint">קובץ Excel או CSV שכבר יש לבית הספר. העמודות מזוהות לפי הכותרת, בכל סדר: שם (או שם פרטי ושם משפחה), ת"ז, כיתה, מגמה, מעסיק, איש קשר, טלפון מעסיק, כתובת, ימי עבודה. עמודה שאין בקובץ לא משתנה. הקובץ נשאר במחשב שלך ולא עולה לשרת.</p>
        <label class="field"><span>הקובץ</span><input type="file" id="lfFile" class="find" accept=".xlsx,.xls,.csv,.tsv,.txt"></label>
        <div id="lfPrev"></div>
        <label class="gate-check" id="lfAddWrap" hidden><input type="checkbox" id="lfAdd">להוסיף כתלמידים חדשים את מי שלא נמצא ברשימה</label>
        <div class="emp-b mf-b edit"><button class="btn primary" id="lfGo" disabled>${ic('check')}עדכון</button></div></div>`,
      bind: (el, spec) => {
        const prev = () => {
          if (!A) { $('lfPrev').innerHTML = ''; $('lfGo').disabled = true; $('lfAddWrap').hidden = true; return; }
          if (A.error) { $('lfPrev').innerHTML = `<p class="hint warn">${esc(A.error)}</p>`; $('lfGo').disabled = true; $('lfAddWrap').hidden = true; return; }
          const nNew = Object.keys(A.newEmps).length, addNew = $('lfAdd').checked;
          $('lfAddWrap').hidden = !A.missing.length;
          $('lfPrev').innerHTML = `<p class="hint"><b>${esc(FNAME)}</b> · זוהו: ${A.cols.map(c => colsHe[c] || c).join(', ')}</p>
            <div class="kpis lf-kpis">${[[A.items.length, 'שורות בקובץ'], [A.found, 'תלמידים נמצאו'], [A.missing.length, 'לא נמצאו'], [A.withEmp, 'עם מעסיק'], [nNew, 'מעסיקים חדשים']].map(([n, l]) => `<div class="kpi"><b>${n}</b><span>${l}</span></div>`).join('')}</div>
            ${A.missing.length ? `<details class="grp"><summary>לא נמצאו ברשימה<small>${A.missing.length}</small></summary><ul class="chk-items">${A.missing.map(x => `<li><span>${esc(x.name)}${x.tz ? ' · ' + esc(x.tz) : ''}${x.cls ? ' · ' + esc(x.cls) : ''}${x.emp ? ' · ' + esc(x.emp) : ''}</span></li>`).join('')}</ul></details>` : ''}
            ${nNew ? `<details class="grp"><summary>מעסיקים חדשים שייווצרו<small>${nNew}</small></summary><ul class="chk-items">${Object.values(A.newEmps).map(e => `<li><span><b>${esc(e.name)}</b>${e.manager ? ' · ' + esc(e.manager) : ''}${e.phone ? ' · <span dir="ltr">' + esc(e.phone) + '</span>' : ''}${e.addr ? ' · ' + esc(e.addr) : ''}</span></li>`).join('')}</ul></details>` : ''}
            <details class="grp" open><summary>מה יתעדכן<small>${A.items.length}</small></summary><div class="lf-table"><div class="lf-row lf-head"><span>תלמיד.ה</span><span>מצב</span><span>מעסיק</span></div>${A.items.map(x => `<div class="lf-row"><span>${esc(x.name)}</span><span>${x.s ? '<em class="tag ok">נמצא.ה</em>' : addNew ? '<em class="tag mid">יתווסף.תתווסף</em>' : '<em class="tag no">לא נמצא.ה</em>'}</span><span>${x.emp ? esc(x.emp) + (x.empId ? '' : ' <em class="tag">חדש</em>') + (x.s && x.s.emp && x.s.emp !== x.empId ? ` <small class="hint">היום: ${esc(empName(x.s.emp))}</small>` : '') : '<span class="hint">—</span>'}</span></div>`).join('')}</div></details>`;
          $('lfGo').disabled = !(A.found || (addNew && A.missing.length));
        };
        $('lfFile').onchange = async e => {
          const f = e.target.files[0]; A = null; FNAME = f ? f.name : ''; if (!f) return prev();
          $('lfPrev').innerHTML = '<p class="hint">קורא את הקובץ…</p>';
          try { A = lfAnalyze(await lfReadFile(f)); spec.dirty = true; } catch (x) { A = { error: 'הקובץ לא נקרא: ' + (x.message || x) }; }
          prev();
        };
        $('lfAdd').onchange = prev;
        $('lfGo').onclick = () => {
          if (!A || A.error) return;
          const addNew = $('lfAdd').checked, made = {}; let assigned = 0, added = 0, updated = 0;
          Object.entries(A.newEmps).forEach(([k, e]) => { const id = 'E' + Date.now().toString(36) + Object.keys(made).length; made[k] = id; EMPS[id] = { name: e.name, manager: e.manager, mentor: e.mentor, phone: e.phone, addr: e.addr, mail: '', slots: '', mg: [...e.mgs].filter(Boolean).length ? [...e.mgs].filter(Boolean) : MGS.slice(0, 1), status: '', studsTxt: '', lead: false, mas: '', recheck: '', visit: '', contact: 0, masNotes: '' }; });
          A.items.forEach(x => {
            let s = x.s;
            if (!s) { if (!addNew) return; s = addStu({ name: x.name, tz: x.tz, cls: x.cls, mg: x.mg, act: x.act, phone: x.phone, days: x.days || [] }, true); added++; }
            else { let ch = false; if (!s.cls && x.cls) { s.cls = x.cls; ch = true; } if (!s.mg && x.mg) { s.mg = x.mg; ch = true; } if (!s.tz && x.tz) { s.tz = x.tz; ch = true; } if (!s.phone && x.phone) { s.phone = x.phone; ch = true; } if (x.hasDays && x.days.length && x.days.join() !== s.days.join()) { s.days = x.days; ch = true; } if (ch) updated++; }
            const id = x.empId || made[x.newKey]; if (id && s.emp !== id && setEmp(s, id, true)) assigned++;
          });
          syncGroups(); renderMain(); spec.dirty = false; closeSub();
          toast(`עודכן: ${assigned} שיבוצים · ${Object.keys(made).length} מעסיקים חדשים${added ? ` · ${added} תלמידים נוספו` : ''}${updated ? ` · ${updated} פרטים הושלמו` : ''}`);
        };
      } };
  }
  function admSpec(k) {
    const A0 = ADMIN.find(a => a[0] === k);
    const specs = {
      listfile: listFileSpec(),
      upload: { dirtyWatch: true, html: () => `<div class="sub-card newform"><label class="field"><span>שורה לכל תלמיד.ה: שם, כיתה, מגמה (ואם יש: טלפון, מספר פעולה)</span><textarea id="upTxt" rows="8" class="find"></textarea></label><div id="upPrev"></div>
          <div class="emp-b mf-b edit"><button class="btn primary" id="upAdd" disabled>${ic('plus')}הוספה</button></div></div>`,
        bind: (el, spec) => {
          const isDup = x => STU.some(s => s.name === x.name && s.cls === x.cls);
          const prev = () => { const l = parseList($('upTxt').value), bad = l.filter(x => !x.cls || !x.mg).length, dup = l.filter(isDup).length;
            $('upPrev').innerHTML = l.length ? `<p class="hint">${l.length} תלמידים${bad ? ` · <span class="warn">${bad} בלי כיתה או מגמה · לא ייכנסו</span>` : ''}${dup ? ` · ${dup} כבר במערכת · לא ייכנסו שוב` : ''}</p>` : '';
            $('upAdd').disabled = !l.some(x => x.cls && x.mg && !isDup(x)); };
          $('upTxt').oninput = prev;
          $('upAdd').onclick = () => { const l = parseList($('upTxt').value).filter(x => x.cls && x.mg && !isDup(x)); l.forEach(addStu); spec.dirty = false; closeSub(); toast(l.length + ' תלמידים נוספו'); };
        } },
      users: { html: () => { const cls = [...classes].sort((a, b) => a.localeCompare(b, 'he')), grades = [...new Set(cls.map(gradeOf))];
          const u = USERS == null ? '<li class="hint">טוען…</li>' : USERS.map(x => `<li><b>${esc(x.name)}</b><span>${ROLE_HE[x.role] || ''} · <span dir="ltr">${esc(x.email)}</span></span>${x.granted ? '<em class="tag ok">יש גישה</em>' : x.pub ? `<em class="tag no">מחכה לאישור</em><button class="btn edit" data-grant="${esc(x.email)}">${ic('check')}אישור גישה</button>` : '<em class="tag">עוד לא נכנס.ה</em>'}</li>`).join('');
          const row = (kind, key, lbl) => { const c = CT[kind][key] || {}; return `<div class="field-row"><label class="field"><span>${esc(lbl)}</span><input class="find" data-ct="${kind}" data-key="${esc(key)}" data-f="name" value="${esc(c.name || '')}" placeholder="שם"></label><label class="field"><span>מייל</span><input class="find" type="email" dir="ltr" data-ct="${kind}" data-key="${esc(key)}" data-f="mail" value="${esc(c.mail || '')}"></label></div>`; };
          return `<div class="sub-card"><h3>${ic('lock')}מי נכנס.ת למערכת</h3><ul class="users">${u}</ul><p class="hint">מנהל.ת או רכז.ת נוספ.ת נרשמים במסך הכניסה, יוצרים סיסמה ומקריאים קוד אימות. כאן מאשרים.</p></div>
          <div class="sub-card newform"><h3>${ic('bell')}מקבלי תזכורות היעדרות</h3>${cls.length ? `<h4 class="mf-h">מחנכי הכיתות</h4>${cls.map(c => row('cls', c, 'מחנך.ת ' + c)).join('')}<h4 class="mf-h">רכזי השכבות</h4>${grades.map(g => row('grade', g, 'רכז.ת שכבה ' + g)).join('')}` : '<p class="empty">אחרי שיש תלמידים, הכיתות יופיעו כאן.</p>'}</div>`; },
        bind: el => {
          if (USERS == null) R.hooks.users().then(l => { USERS = l; refreshSub(); });
          el.addEventListener('change', e => { const x = e.target.closest('[data-ct]'); if (!x) return; const v = x.value.trim();
            if (x.dataset.f === 'mail' && v && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) return toast('המייל לא תקין');
            const o = CT[x.dataset.ct][x.dataset.key] = CT[x.dataset.ct][x.dataset.key] || {}; o[x.dataset.f] = v; renderAdmin(); toast('נשמר'); });
          el.addEventListener('click', async e => { const b = e.target.closest('[data-grant]'); if (!b) return; const x = USERS.find(y => y.email === b.dataset.grant);
            if (!R.canGrant) return toast('כדי לאשר גישה צריך לצאת ולהיכנס עם הסיסמה');
            const typed = prompt(`קוד האימות ש${x.name} מקריא.ה (8 תווים):`); if (typed == null) return;
            if (typed.replace(/[^0-9a-f]/gi, '').toUpperCase() !== x.fp.replace(/-/g, '')) return alert('הקוד לא תואם. לא לאשר, לבדוק שוב מול ' + x.name);
            b.disabled = true; const r = await R.hooks.grant(x); if (!r.ok) { b.disabled = false; return toast('האישור לא נשמר'); }
            USERS = null; refreshSub(); toast('ניתנה גישה ל' + x.name); });
        } },
      frames: { html: () => `<div class="sub-card"><ul class="perm" id="framesPick"><li><label><input type="radio" name="fr" value="out" ${FRAMES === 'out' ? 'checked' : ''}> תעסוקת חוץ בלבד</label></li><li><label><input type="radio" name="fr" value="in" ${FRAMES === 'in' ? 'checked' : ''}> עסק בית-ספרי בלבד</label></li><li><label><input type="radio" name="fr" value="both" ${FRAMES === 'both' ? 'checked' : ''}> שניהם</label></li></ul><p class="hint">עסק בית-ספרי · סעיף 117</p></div>`,
        bind: () => { $('framesPick').onchange = e => { FRAMES = e.target.value; R.meta.frames = FRAMES; document.body.dataset.frames = FRAMES; renderOverview(); renderAdmin(); if (FRAMES !== 'both') document.querySelector(`#empTabs [data-tab="${FRAMES}"]`).click(); toast('נשמר'); }; } },
      rem: { html: () => { const p = pending(); return `<div class="sub-card" id="remCard"><ul class="perm"><li><label><input type="checkbox" id="remT" ${REM_CFG.teacher ? 'checked' : ''}> תלמיד.ה לא הגיע.ה לתעסוקה: מייל למחנך.ת הכיתה, כל יום ב-16:00</label></li><li><label><input type="checkbox" id="remG" ${REM_CFG.grade ? 'checked' : ''}> <input type="number" id="remN" class="num" value="${REM_CFG.streak}" min="2" max="10"> ימי עבודה ברצף: גם לרכז.ת השכבה</label></li></ul>
          <h4 class="mf-h">יוצאות היום ב-16:00 <small>${p.length}</small></h4><ul class="rem-list">${p.map(r => `<li><small>${r.d}.${MONTH.m} · ${esc(r.who)}${mailOf(r) ? '' : ' · <b class="warn">אין מייל, לא תצא</b>'}</small>${esc(r.t)} <a href="#" data-open="${r.sid}">לתיק</a></li>`).join('') || '<li class="hint">אין</li>'}</ul><p class="hint">התזכורות יוצאות מהשרת פעם ביום ב-16:00 (לא בשבת), על מה שמסומן "לא הגיע.ה" באותו רגע. אין שליחה בלחיצה.</p>
          <h4 class="mf-h">נשלחו החודש <small>${REM.length}</small></h4><ul class="rem-list">${REM.slice(0, 20).map(r => `<li><small>${r.d}.${MONTH.m} · ${esc(r.who)}</small>${esc(r.t)} <a href="#" data-open="${r.sid}">לתיק</a></li>`).join('') || '<li class="hint">לא נשלחו תזכורות החודש</li>'}</ul></div>`; },
        bind: el => { el.querySelector('.perm').onchange = () => { REM_CFG.teacher = $('remT').checked; REM_CFG.grade = $('remG').checked; REM_CFG.streak = +$('remN').value || 3; renderOverview(); renderAdmin(); refreshSub(); toast('הגדרת התזכורות נשמרה'); }; } }
    };
    return { title: A0[2], ...specs[k] };
  }
  document.body.dataset.frames = FRAMES;

  /* ================= העוזר ================= */
  const out = $('agentOut');
  /* יום בחודש הפעיל. תאריך בחודש אחר או יום שלא קיים → 0, והעוזר מבקש תיקון */
  function dateOf(t) { if (/אתמול/.test(t)) return MONTH.today - 1; if (/היום/.test(t)) return MONTH.today; const m = t.match(/(\d{1,2})\.(\d{1,2})/); if (!m) return MONTH.today; return +m[2] === MONTH.m && +m[1] >= 1 && +m[1] <= MONTH.last ? +m[1] : 0; }
  const badDate = () => show(`<p>אפשר לרשום כאן רק ימים ב${esc(MONTH.name)} (1.${MONTH.m} עד ${MONTH.last}.${MONTH.m}). כדאי לבדוק את התאריך.</p>`, null);
  const lockedMsg = mgs => show(`<p>הנוכחות של <b>${mgs.map(esc).join(', ')}</b> ל${esc(MONTH.name)} כבר הוגשה. כדי לשנות: "פתיחה לתיקון" במסך הנוכחות.</p>`, null);
  function run(text) {
    const t = text.trim(); if (!t) return;
    const who = STU.find(s => t.includes(first(s)));
    if (/מי לא הגיע/.test(t)) {
      const l = active().filter(s => Object.entries(ATT[s.id]).some(([d, v]) => v === 'a' && +d >= MONTH.today - 6));
      return show(`<p><b>לא הגיעו השבוע:</b></p><ul>${l.map(s => `<li>${esc(s.name)} · ${Object.entries(ATT[s.id]).filter(([d, v]) => v === 'a' && +d >= MONTH.today - 6).map(([d]) => d + '.' + MONTH.m).join(', ')}${Object.entries(NOTES[s.id]).filter(([d]) => +d >= MONTH.today - 6).map(([, n]) => ' · ' + esc(n)).join('')} <a href="#" data-open="${s.id}">לתיק</a></li>`).join('') || '<li>כולם הגיעו</li>'}</ul>`, null);
    }
    if (/מצא|חפש|מעסיקים ל/.test(t)) { const mg = MGS.find(m => t.includes(m)) || MGS[0]; openSub(wizSpec(mg)); return show(`<p>פתחתי את האשף${mg ? ` עם <b>${esc(mg)}</b>` : ''}.</p>`, null); }
    if (/העל|ייבוא|נתוני בית/.test(t)) { return show('<p>ההעלאה נמצאת במסך הניהול. <a href="#admin">לניהול</a></p>', null); }
    if (/אין תעסוקה|בלי תעסוקה|לא עובדים/.test(t)) {
      const d = dateOf(t), cls = classes.find(c => norm(t).includes(norm(c))) || (shown[0] && shown[0].cls);
      if (!cls) return show(`<p>לאיזו כיתה? למשל: אין תעסוקה ב-${MONTH.today}.${MONTH.m} לכיתה ${esc(classes[0])}, פורים.</p>`, null);
      if (!d) return badDate();
      const lk = [...new Set(STU.filter(s => s.cls === cls && SUBMITTED[s.mg]).map(s => s.mg))]; if (lk.length) return lockedMsg(lk);
      const why = (t.match(/(פורים|פסח|חנוכה|סוכות|מרתון[^,.]*|טיול[^,.]*)/) || [])[1] || 'יום בלי תעסוקה';
      return show(`<p>לסמן את <b>${wd(d)} ${d}.${MONTH.m}</b> כיום בלי תעסוקה לכל <b>${esc(cls)}</b> · ${esc(why)}?</p>`, () => { applyOff(cls, d, why.trim()); if (!shown.length || shown[0].cls !== cls) { $('find').value = cls; find(cls); } afterAtt(); return `${cls}: ${d}.${MONTH.m} בלי תעסוקה`; });
    }
    if (/נוכחות|דיווח/.test(t) && !who && !/הגש/.test(t)) { return show(`<p>לדיווח נוכחות: <a href="#att">למסך הדיווח</a>. אפשר גם לכתוב כאן, למשל "סמן ש${esc(first(sPlaced))} הגיע היום".</p>`, null); }
    if (/מה חסר/.test(t) && who) { const miss = DOCS.filter((_, i) => who.docs[i] && who.docs[i].s !== 'ok' && who.docs[i].s !== 'na'); return show(`<p><b>${esc(who.name)}</b>${who.emp ? '' : ' · בלי מקום עבודה'}${who.note ? ' · ' + esc(who.note) : ''}</p><ul>${miss.map(d => `<li>מסמך: ${d}</li>`).join('') || '<li>כל המסמכים התקבלו</li>'}</ul><p><a href="#" data-open="${who.id}">לתיק</a></p>`, null); }
    if (/הגש/.test(t)) {
      const mg = MGS.find(m => t.includes(m));
      if (!mg) return show(`<p>איזו מגמה להגיש? למשל: הגש את הנוכחות של ${esc(MGS[0])}.</p>`, null);
      if (SUBMITTED[mg]) return show(`<p>${esc(mg)} כבר הוגשה ל${esc(MONTH.name)}.</p>`, null);
      const l = active().filter(s => s.mg === mg), miss = l.reduce((n, s) => n + dates(s).filter(d => d <= MONTH.today && !ATT[s.id][d]).length, 0);
      return show(`<p>להגיש את נוכחות <b>${esc(mg)}</b> ל${esc(MONTH.name)}? ${l.length} תלמידים${miss ? `, <b>${miss} ימים עדיין לא סומנו</b>` : ', הכול מסומן'}. אחרי ההגשה החודש נעול.</p>`, () => { SUBMITTED[mg] = true; afterAtt(); return 'נוכחות ' + mg + ' הוגשה'; });
    }
    if (who) {
      const d = dateOf(t); if (!d) return badDate(); if (SUBMITTED[who.mg]) return lockedMsg([who.mg]);
      const abs = /לא הגיע|חיסור|חסר|נעדר/.test(t), ok = dates(who).includes(d);
      return show(`<p>לסמן ש<b>${esc(who.name)}</b> <b>${abs ? 'לא הגיע.ה' : 'הגיע.ה'}</b> ב-<b>${d}.${MONTH.m}</b>${who.emp ? ' ל' + esc(empName(who.emp)) : ''}?${ok ? '' : ' <span class="warn">זה לא יום עבודה קבוע שלו.ה, יירשם כיום נוסף.</span>'}</p>`,
        () => { ATT[who.id][d] = abs ? 'a' : 'p'; if (!shown.some(s => s.id === who.id)) { $('find').value = who.cls; find(who.cls); } afterAtt(); return `סומן: ${who.name}, ${d}.${MONTH.m}${abs && REM_CFG.teacher ? ' · תזכורת למחנך.ת תצא ב-16:00' : ''}`; });
    }
    show(`<p>לא הבנתי. אפשר: "סמן ש${esc(first(sPlaced))} הגיע היום", "מי לא הגיע השבוע", "הגש את הנוכחות של ${esc(MGS[0])}", "מצא מעסיקים ל${esc(MGS[0])}", "מה חסר ל${esc(first(sNone))}", "אין תעסוקה ב-${MONTH.today}.${MONTH.m} לכיתה ${esc(classes[0])}".</p>`, null);
  }
  function show(html, apply) {
    out.hidden = false;
    out.innerHTML = `<div class="confirm">${html}${apply ? `<div class="confirm-b"><button class="btn primary" id="aYes">${ic('check')}כן</button><button class="btn quiet" id="aNo">ביטול</button></div>` : `<div class="confirm-b"><button class="btn quiet" id="aNo">סגירה</button></div>`}</div>`;
    $('aNo').onclick = () => { out.hidden = true; };
    if (apply) $('aYes').onclick = () => { const m = apply(); out.innerHTML = `<div class="confirm done">${ic('check')}${esc(m)} <button class="lnk" id="aNo">סגירה</button></div>`; $('aNo').onclick = () => { out.hidden = true; }; toast(m); $('cmd').value = ''; };
  }
  $('cmdGo').onclick = () => run($('cmd').value);
  $('cmd').onkeydown = e => { if (e.key === 'Enter') run($('cmd').value); };
  $('chips').onclick = e => { const b = e.target.closest('[data-cmd]'); if (!b) return; $('cmd').value = b.dataset.cmd; run(b.dataset.cmd); };

  /* ================= התחלה ================= */
  try { history.scrollRestoration = 'manual'; } catch (e) {}
  renderStuList(); renderEmps(); renderChkStu(); renderChkCal(); renderOverview(); renderRoster(); renderProgram(); renderLinks(); renderReports(); renderAdmin();
  setRole(R.role); renderUpd();
  /* לשמירה (store.js): תור תזכורות 16:00 והודעות */
  R.hooks.mails = mails; R.hooks.toast = toast;
  if (R.bad) toast(R.bad + ' רשומות לא נפתחו במפתח הזה');
  const h = (location.hash || '').slice(1);
  go(VIEWS.includes(h) && !['gate', 'sub'].includes(h) ? h : 'overview', { replace: true });
};
