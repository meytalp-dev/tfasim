/* ריכוז נתוני ביטחון וחירום במוסד חינוכי — תשפ"ז (3.11.26)
   קובץ משותף לטופס (bitachon.html), לדף המעקב (bitachon-maakav.html) ולשרת (רויטל\bitachon-gas\Fields.js — עותק זהה).
   השדות, הסדר והכותרות לקוחים מהקובץ "ריכוז נתוני ביטחון מוסדות חינוך תשפז.xlsx" של משרד החינוך.
   ES5 בלבד, בלי window/document ברמה העליונה — הקובץ רץ גם ב-Apps Script. */
var BITACHON = (function () {
  'use strict';

  // סמל · שם · רשת · מפקחים — כמו בדפי הסלים (64 בתי ספר)
  var SCHOOLS = [
    ["45001","אורט תעשייה אווירית","אורט",["סיגלית דאי"]],
    ["45002","אורט תל נוף","אורט",["סיגלית דאי"]],
    ["45005","אורט אורמת","אורט",["סיגלית דאי"]],
    ["45007","דן גורמה","אורט",["סיגלית דאי"]],
    ["55003","אורט כרמל","אורט",["יסמין אמון"]],
    ["65007","אורט בית הערבה","אורט",["רויטל אמיר"]],
    ["65079","צור ברק","אורט",["סיגלית דאי"]],
    ["43403","תיכון חברתי ת\"א","דרור",["ליאת צבר"]],
    ["53403","התיכון החברתי חיפה","דרור",["ליאת צבר"]],
    ["53405","דרור גליל","דרור",["ליאת צבר"]],
    ["63401","חוש\"ן","דרור",["רויטל אמיר"]],
    ["83424","מצפה רמון","דרור",["רביב שורץ"]],
    ["83425","דרור נווה מדבר","דרור",["שרונה בלוך"]],
    ["54100","אל אמאני סכנין","סכנין",["יסמין אמון"]],
    ["54101","ערערה","סכנין",["יסמין אמון"]],
    ["54102","כפר יסיף","סכנין",["יסמין אמון"]],
    ["54105","אום אל פחם בנות","סכנין",["ליאת צבר"]],
    ["54106","שפרעם","סכנין",["רביב שורץ"]],
    ["54107","אבו סנאן","סכנין",["ליאת צבר"]],
    ["54108","אלחכמה כסרא-סמיע","סכנין",["יסמין אמון"]],
    ["54109","טורען","סכנין",["יסמין אמון"]],
    ["54112","אום אל פחם בנים","סכנין",["רביב שורץ"]],
    ["54113","אכסאל","סכנין",["יסמין אמון"]],
    ["64100","בית חנינה בנות","סכנין",["ויסאם סואלחה"]],
    ["64102","בית חנינה בנים","סכנין",["ויסאם סואלחה"]],
    ["64103","כפר עקב","סכנין",["ויסאם סואלחה"]],
    ["84101","לקייה","סכנין",["שרונה בלוך"]],
    ["84102","שגב שלום","סכנין",["שרונה בלוך"]],
    ["84104","סכנין תל שבע","סכנין",["שרונה בלוך"]],
    ["44008","תיכון החממה","עמל",["סיגלית דאי","רויטל אמיר"]],
    ["44011","עמל טייבה ב'","עמל",["ויסאם סואלחה"]],
    ["44050","עמל טק אין","עמל",["סיגלית דאי"]],
    ["54008","נצרת","עמל",["יסמין אמון"]],
    ["54009","מרחביה/מעיינות","עמל",["יששכר חפץ"]],
    ["54017","רמת דוד","עמל",["ליאת צבר"]],
    ["54021","אנרג'י טק","עמל",["ליאת צבר"]],
    ["54040","תיכון שיח","עמל",["ליאת צבר"]],
    ["64001","עמל אשדוד","עמל",["סיגלית דאי"]],
    ["84003","עמל רהט","עמל",["יסמין אמון","סיגלית דאי"]],
    ["42919","עתיד פלמחים","עתיד",["סיגלית דאי"]],
    ["42924","עתיד כפר חב\"ד","עתיד",["יששכר חפץ"]],
    ["42925","אור דניאל","עתיד",["יששכר חפץ"]],
    ["52901","עתיד כרמיאל","עתיד",["רביב שורץ"]],
    ["52909","תיכון טכנולוגי אי טק סקול (מסעדה)","עתיד",["יסמין אמון"]],
    ["52916","עתיד גליל מערבי ירכא בנים","עתיד",["יסמין אמון"]],
    ["52918","ג'וליס בנות","עתיד",["יסמין אמון"]],
    ["52919","תיכון עוצמ\"ה עתיד זוקו","עתיד",["ליאת צבר"]],
    ["52920","תפן ליזמות","עתיד",["יסמין אמון"]],
    ["52921","צור ים","עתיד",["ליאת צבר"]],
    ["52922","עתיד טק ביר אל מכסור","עתיד",["יסמין אמון"]],
    ["52923","עתיד בת עמי","עתיד",["יששכר חפץ"]],
    ["62903","אור העתיד תורני מקצועי","עתיד",["יששכר חפץ"]],
    ["82918","עתיד באר שבע","עתיד",["סיגלית דאי"]],
    ["82921","קמ\"ג דימונה","עתיד",["סיגלית דאי"]],
    ["82922","ישיבת עתיד אור מנחם","עתיד",["יששכר חפץ"]],
    ["82923","בית דוד","עתיד",["יששכר חפץ"]],
    ["51511","רימונים","רימונים",["ליאת צבר"]],
    ["58801","טל חרמון","טל חרמון",["יששכר חפץ"]],
    ["55400","ישיבת חנוך לנער","ישיבת חנוך לנער",["יששכר חפץ"]],
    ["55501","כפר זיתים","כפר זיתים",["יששכר חפץ"]],
    ["46101","נחלים","נחלים",["יששכר חפץ"]],
    ["55621","בית אל","בית אל",["ליאת צבר"]],
    ["61902","הדר","בית שולמית",["יששכר חפץ"]],
    ["64101","סור באהר","סכנין",["רביב שורץ"]]
  ];

  /* החלקים — כמו בקובץ: אות, כותרת, כותרת־משנה (שורת הקבוצה בקובץ) */
  var SECTIONS = [
    { id: 'a', title: 'א. נתונים כלליים', sub: 'פרטי המוסד' },
    { id: 'b', title: 'ב. ריכוז כ"א ביטחון', sub: 'פרטי רכז ביטחון, בטיחות ושעת חירום' },
    { id: 'c', title: 'ג. מוכנות ואמצעים לחירום', sub: 'מאפייני חירום · עזרה ראשונה · רעידת אדמה · פינוי חירום' },
    { id: 'd', title: 'ד. מרחבים מוגנים ונתוני מיגון', sub: 'מדידת מרחבים מוגנים' },
    { id: 'e', title: 'ה. סקר מרכיבי ביטחון', sub: 'מצלמות אבטחה · סקר מרכיבי ביטחון' },
    { id: 'f', title: 'מגיש/ת הדוח', sub: '' }
  ];

  /* השדות. type: school · auto · text · tel · email · tz · num · yn (כן/לא) · has (יש/אין) · note · calc
     req: חובה · when: [מפתח, ערך] — מופיע (וחובה) רק כשהשדה ההוא בערך הזה
     label = הכותרת כפי שהיא בקובץ (להדפסה ולגיליון); short = כותרת קצרה לטופס */
  var FIELDS = [
    // א. פרטי המוסד
    { key: 'authority', sec: 'a', label: 'שם הרשות', type: 'text', req: true, when: ['kabatEscort', 'יש'] },
    { key: 'owner', sec: 'a', label: 'בעלות', type: 'auto', hint: 'מתמלא לפי בית הספר, ניתן לתיקון' },
    { key: 'school', sec: 'a', label: 'שם בית הספר', type: 'school', req: true },
    { key: 'semel', sec: 'a', label: 'סמל מוסד', type: 'auto' },
    { key: 'address', sec: 'a', label: 'כתובת בית הספר', type: 'text', req: true, when: ['kabatEscort', 'יש'] },
    { key: 'schoolEmail', sec: 'a', label: 'דוא"ל המוסד', type: 'email', req: true },
    { key: 'principal', sec: 'a', label: 'שם המנהל/ת', type: 'text', req: true, when: ['kabatEscort', 'יש'] },
    { key: 'principalPhone', sec: 'a', label: 'נייד מנהל/ת', type: 'tel', req: true },
    { key: 'staff', sec: 'a', label: 'מספר צוות בוגר חינוכי', type: 'num', req: true },
    { key: 'students', sec: 'a', label: 'מספר תלמידים בשנת תשפ"ז', type: 'num', req: true },
    { key: 'notesA', sec: 'a', label: 'הערות לנתונים', type: 'note' },
    // ב. רכז ביטחון
    { key: 'hasCoord', sec: 'b', label: 'האם יש רכז ביטחון', type: 'has', req: true },
    { key: 'coordName', sec: 'b', label: 'שם רכז הביטחון', type: 'text', req: true, when: ['hasCoord', 'יש'] },
    { key: 'coordId', sec: 'b', label: 'ת"ז רכז הביטחון', type: 'tz', req: true, when: ['hasCoord', 'יש'] },
    { key: 'coordPhone', sec: 'b', label: 'טלפון רכז הביטחון', type: 'tel', req: true, when: ['hasCoord', 'יש'] },
    { key: 'coordEmail', sec: 'b', label: 'מייל רכז הביטחון', type: 'email', req: true, when: ['hasCoord', 'יש'] },
    { key: 'coordTrained', sec: 'b', label: 'האם עבר הכשרה בקורס של משרד החינוך?', type: 'yn', req: true, when: ['hasCoord', 'יש'] },
    { key: 'kabatName', sec: 'b', label: 'שם קב"ט מוס"ח של הרשות', type: 'text', req: true, when: ['kabatEscort', 'יש'] },
    { key: 'kabatPhone', sec: 'b', label: 'נייד קב"ט', type: 'tel', req: true, when: ['kabatEscort', 'יש'] },
    { key: 'kabatEscort', sec: 'b', label: 'ליווי קב"ט הרשות', type: 'has', req: true },
    { key: 'notesB', sec: 'b', label: 'הערות לנתונים', type: 'note' },
    // ג. מוכנות ואמצעים
    { key: 'dataFile', sec: 'c', group: 'מאפייני חירום', label: 'קיום תיק ביטחון ושטח מתוקפים לשנת הלימודים', type: 'yn', req: true },
    { key: 'absorption', sec: 'c', group: 'מאפייני חירום', label: 'מוגדר כמתקן קליטה', type: 'yn', req: true },
    { key: 'firstAidKit', sec: 'c', group: 'עזרה ראשונה', label: 'תיק עזרה ראשונה ע"פ תקן', type: 'yn', req: true },
    { key: 'stretcher', sec: 'c', group: 'עזרה ראשונה', label: 'אלונקה לפי תקן', type: 'yn', req: true },
    { key: 'defib', sec: 'c', group: 'עזרה ראשונה', label: 'מכשיר דפיברילטור', type: 'yn', req: true },
    { key: 'defibCompany', sec: 'c', group: 'עזרה ראשונה', label: 'אם קיים איזו חברה (חובה מעל 500)', short: 'חברת הדפיברילטור', type: 'text', req: true, when: ['defib', 'כן'] },
    { key: 'epipen', sec: 'c', group: 'עזרה ראשונה', label: 'מזרק אפיפן מרכיב חובה', type: 'yn', req: true },
    { key: 'rescueCabinet', sec: 'c', group: 'עזרה ראשונה', label: 'ארון חילוץ מחלץ קל', type: 'yn', req: true },
    { key: 'quakeAlert', sec: 'c', group: 'רעידת אדמה', label: 'האם קיימת מערכת התרעה לרעידת אדמה', type: 'yn', req: true },
    { key: 'evacPlan', sec: 'c', group: 'פינוי חירום', label: 'תוכנית לפינוי המוסד במצב חירום', type: 'yn', req: true },
    // ד. מיגון
    { key: 'mamadCount', sec: 'd', label: 'מרחב מוגן מוסדי – לציין מספר מרחבים מוגנים', short: 'מרחב מוגן מוסדי – מספר מרחבים', type: 'num', req: true },
    { key: 'mamadArea', sec: 'd', label: 'מרחב מוגן מוסדי – לציין מ"ר של כלל המרחבים המוגנים המוסדיים ביחד', short: 'מרחב מוגן מוסדי – מ"ר (כל המרחבים ביחד)', type: 'num', req: true },
    { key: 'upperCount', sec: 'd', label: 'מקלט עילי – מספר מרחבים', type: 'num', req: true },
    { key: 'upperArea', sec: 'd', label: 'מקלט עילי – מ"ר', type: 'num', req: true },
    { key: 'lowerCount', sec: 'd', label: 'מקלט תחתי – מספר מרחבים', type: 'num', req: true },
    { key: 'lowerArea', sec: 'd', label: 'מקלט תחתי – מ"ר', type: 'num', req: true },
    { key: 'totalCount', sec: 'd', label: 'סה"כ מרחבים', type: 'calc' },
    { key: 'totalArea', sec: 'd', label: 'סה"כ מ"ר בפועל', type: 'calc' },
    { key: 'reqArea', sec: 'd', label: 'שטח נדרש לפי תקן (תלמידים × 0.5)', type: 'calc' },
    { key: 'gap', sec: 'd', label: 'פערי מיגון (בפועל – תוך לקיחת זמן התראה לפי איזור המוסד החינוכי)', short: 'פערי מיגון (בפועל פחות נדרש)', type: 'calc' },
    // ה. סקר מרכיבי ביטחון
    { key: 'cameras', sec: 'e', group: 'מצלמות אבטחה', label: 'אם יש מצלמות בבית הספר לציין כמות', short: 'מצלמות אבטחה – כמות', type: 'num', req: true, hint: '0 אם אין מצלמות' },
    { key: 'gatePed', sec: 'e', group: 'סקר מרכיבי ביטחון', label: 'שער להולכי רגל', type: 'yn', req: true },
    { key: 'gateCar', sec: 'e', group: 'סקר מרכיבי ביטחון', label: 'שער לכלי רכב', type: 'yn', req: true },
    { key: 'gateEscape', sec: 'e', group: 'סקר מרכיבי ביטחון', label: 'שער מילוט אחורי', type: 'yn', req: true },
    { key: 'fence', sec: 'e', group: 'סקר מרכיבי ביטחון', label: 'גדר היקפית', type: 'yn', req: true },
    { key: 'guardBooth', sec: 'e', group: 'סקר מרכיבי ביטחון', label: 'ביתן שומר ע"פ איפיון משטרת ישראל', type: 'yn', req: true },
    { key: 'radio', sec: 'e', group: 'סקר מרכיבי ביטחון', label: 'מכשיר תקשורת למזכירות', type: 'yn', req: true },
    { key: 'guard', sec: 'e', group: 'סקר מרכיבי ביטחון', label: 'מאבטח מוס"ח לפי דרישות משטרה', type: 'yn', req: true },
    { key: 'caravans', sec: 'e', group: 'סקר מרכיבי ביטחון', label: 'מס\' כיתות יבילים/קרוואנים', type: 'num', req: true, hint: '0 אם אין' },
    { key: 'notesE', sec: 'e', label: 'הערות', type: 'note' },
    // מגיש/ת הדוח
    { key: 'submitter', sec: 'f', label: 'מגיש/ת הדוח', type: 'text', req: true, when: ['kabatEscort', 'יש'] },
    { key: 'submitterRole', sec: 'f', label: 'תפקיד מגיש/ת הדוח', type: 'text', req: true }
  ];

  var byKey = {};
  FIELDS.forEach(function (f) { byKey[f.key] = f; });

  function school(name) {
    for (var i = 0; i < SCHOOLS.length; i++) if (SCHOOLS[i][1] === name) return SCHOOLS[i];
    return null;
  }

  function num(v) {
    if (v === '' || v == null) return null;
    var n = Number(String(v).replace(/[^\d.\-]/g, ''));
    return isNaN(n) ? null : n;
  }

  /* השדות המחושבים — כמו הנוסחאות בקובץ (שורה 22) */
  function compute(d) {
    var c = [num(d.mamadCount), num(d.upperCount), num(d.lowerCount)].filter(function (x) { return x !== null; });
    var a = [num(d.mamadArea), num(d.upperArea), num(d.lowerArea)].filter(function (x) { return x !== null; });
    var st = num(d.students);
    var out = {};
    out.totalCount = c.length ? c.reduce(function (s, x) { return s + x; }, 0) : '';
    out.totalArea = a.length ? Math.round(a.reduce(function (s, x) { return s + x; }, 0) * 100) / 100 : '';
    out.reqArea = st === null ? '' : Math.round(st * 0.5 * 100) / 100;
    out.gap = (out.totalArea === '' || out.reqArea === '') ? '' : Math.round((out.totalArea - out.reqArea) * 100) / 100;
    return out;
  }

  /* האם השדה פעיל (לא מוסתר ע"י when) */
  function active(f, d) {
    return !f.when || String(d[f.when[0]] || '') === f.when[1];
  }

  /* ערך להצגה/לגיליון */
  function display(f, d) {
    var v = d[f.key];
    if (v == null) return '';
    return String(v);
  }

  /* כותרות הגיליון/האקסל — בסדר הקובץ, עם עמודות זיהוי בתחילה */
  var META_HEAD = ['עודכן', 'סמל מוסד', 'בית ספר', 'רשת', 'מפקח.ת'];
  function head() {
    return META_HEAD.concat(FIELDS.filter(function (f) { return f.key !== 'school' && f.key !== 'semel'; }).map(function (f) { return f.label; }));
  }
  function rowKeys() {
    return FIELDS.filter(function (f) { return f.key !== 'school' && f.key !== 'semel'; }).map(function (f) { return f.key; });
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }

  /* תצוגת הדפסה — כמו הקובץ: כל חלק טבלה עם שורת כותרות ושורת ערכים. d כולל גם at (תאריך) */
  function renderPrint(d) {
    var calc = compute(d);
    var h = '<div class="bp" dir="rtl">';
    h += '<h1>ריכוז נתוני ביטחון וחירום במוסד חינוכי</h1>';
    h += '<div class="bp-sub">שנת הלימודים תשפ"ז · ' + esc(d.school || '') + (d.semel ? ' · סמל מוסד ' + esc(d.semel) : '') + '</div>';
    SECTIONS.forEach(function (s) {
      if (s.id === 'f') return;
      var fs = FIELDS.filter(function (f) { return f.sec === s.id; });
      h += '<h2>' + esc(s.title) + '.</h2>';
      if (s.sub) h += '<div class="bp-grp">' + esc(s.sub) + '</div>';
      h += '<table><thead><tr>';
      fs.forEach(function (f) { h += '<th>' + esc(f.label) + '</th>'; });
      h += '</tr></thead><tbody><tr>';
      fs.forEach(function (f) {
        var v = f.type === 'calc' ? calc[f.key] : (active(f, d) ? display(f, d) : '');
        h += '<td' + (f.type === 'note' ? ' class="note"' : '') + '>' + esc(v) + '</td>';
      });
      h += '</tr></tbody></table>';
    });
    var at = d.at || '';
    h += '<div class="bp-foot"><span>תאריך: <bdi dir="ltr">' + esc(at || '___/___/___') + '</bdi>.</span>' +
      '<span>מגיש/ת הדו"ח: ' + esc(d.submitter || '__________________') + (d.submitterRole ? ' (' + esc(d.submitterRole) + ')' : '') + '</span>' +
      '<span>חתימת מנהל/ת המוסד וחותמת: _______________________.</span></div>';
    h += '</div>';
    return h;
  }

  /* ה-CSS של ההדפסה — משותף לשני הדפים */
  var PRINT_CSS = '.bp{font-family:Arial,"Segoe UI",sans-serif;color:#000;font-size:11px;line-height:1.35;direction:rtl}' +
    '.bp h1{font-size:18px;text-align:center;margin:0 0 2px}.bp .bp-sub{text-align:center;font-size:12px;margin-bottom:10px}' +
    '.bp h2{font-size:13px;margin:12px 0 2px;font-weight:700}.bp .bp-grp{font-size:10.5px;color:#333;margin-bottom:3px}' +
    '.bp table{width:100%;border-collapse:collapse;table-layout:fixed}' +
    '.bp th,.bp td{border:1px solid #000;padding:4px 5px;vertical-align:top;text-align:center;overflow-wrap:anywhere;unicode-bidi:plaintext}' +
    '.bp th{background:#e8edf5;font-weight:700;font-size:10px}.bp td{min-height:26px;height:26px;font-size:11.5px}' +
    '.bp td.note{text-align:right}' +
    '.bp .bp-foot{display:flex;justify-content:space-between;gap:16px;margin-top:22px;font-size:11.5px;flex-wrap:wrap}' +
    '@page{size:A4 landscape;margin:12mm}';

  return {
    SCHOOLS: SCHOOLS, SECTIONS: SECTIONS, FIELDS: FIELDS, byKey: byKey, school: school,
    compute: compute, active: active, num: num, head: head, rowKeys: rowKeys, META_HEAD: META_HEAD,
    renderPrint: renderPrint, PRINT_CSS: PRINT_CSS, esc: esc
  };
})();
