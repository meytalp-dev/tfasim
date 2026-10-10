/* סיור במערכת — הבית של רויטל ושל המפקחים (7.10.26, בקשת מיטל).
   מבוסס על הסיור של מבט המורה במנור (hadrachot/teacher/tour.js), עם תוספת אחת:
   תחנה יכולה לעבור לעמוד אחר בבית (go) לפני שהיא מדגישה אותו.
   נפתח מכפתור עם data-tour-start (כרטיס הפתיחה, שורת הברכה, תפריט הצד) או מ-?tour=1.
   הנוסח בלי פנייה מגדרית — אותו סיור ישמש את כל המפקחים. */
(function () {
  var STEPS = [
    { go: '', sel: '#welcome, #hello', title: 'ברוכים הבאים לבית',
      text: 'הבית מרכז את כל מה שידוע על בתי הספר שלך: מי בתפקיד, מה חסר, מה מצבם במיפוי, ומה קרה בביקורים — במקום אחד, בלי לחפש בין טפסים. ובסוף הסיור — תובי, העוזר החכם שמכין תדריכים ועונה על שאלות.' },
    { go: '', sel: '.side', title: 'התפריט',
      text: 'הדשבורד, מה חסר, דורש תשומת לב, בתי הספר, בעלי התפקידים, הודעה למנהלים, טפסים וקישורים ותוכנית העבודה. בטלפון התפריט נפתח מהכפתור שבפינה.' },
    /* תחנות חדשות (9.10.26, מיטל: "לעדכן את הסיור עם כל השינויים החדשים") */
    { go: '', sel: '#dashCk', title: 'צ׳ק ליסט ביקור',
      text: 'בראש הדשבורד: בוחרים בית ספר ומסמנים תוך כדי הביקור — 30 הסעיפים של הצ׳ק ליסט המומלץ למפקח: קיים, חלקי או לא קיים, עם הערה. מסמנים מי נכח, וקובעים 2–3 צעדי פעולה עד הביקור הבא. הכול נשמר לבד, ותובי מזכיר את צעדי הפעולה בתדריך הבא.' },
    { go: '', sel: '#dashRep', title: 'דוח ביקור בהקלטה',
      text: 'אחרי הביקור: מקליטים או מכתיבים מה היה, ותובי כותב דוח בשדות של טופס הביקור במונדיי. בודקים, מתקנים ושומרים.' },
    { go: '', sel: '#dashWait', title: 'מה מחכה לך?',
      text: 'בקשות שממתינות לאישור שלך, למשל השתלמות מוסדית שבית ספר הגיש. לחיצה פותחת את הבקשה.' },
    { go: '', sel: '#dashStats', title: 'המספרים העיקריים',
      text: 'כמה בתי ספר, כמה עם חוסרים להשלמה, כמה דורשים תשומת לב וכמה עם מדד במצב סיכון. לחיצה על מספר פותחת את הרשימה.' },
    { go: '', sel: '#dashMap', title: 'מצב בתי הספר במיפוי',
      text: 'ירוק — תפקוד יציב, כתום — פערים ממוקדים, אדום — סיכון מערכתי, אפור — אין מיפוי. לחיצה על צבע מציגה את בתי הספר שבו.' },
    { go: 'G', sel: '#gapBox', title: 'מה חסר לכל בית ספר',
      text: 'מה בית הספר עוד צריך להגיש: נספח בעלי תפקידים, השתלמויות, רישום מורים למנור, מצבת. כל כרטיס מסנן. ליד כל בית ספר — כפתור מייל למנהל.ת עם מה שחסר, וכפתור "תגובה" לעדכן את המטה (למשל "המנהל הבטיח להגיש עד יום ראשון").' },
    { go: 'A', sel: '#attBox', title: 'דורש תשומת לב',
      text: 'אותות לפיקוח, לא משימות לבית הספר: לא היה ביקור שלושה חודשים, מדדים במצב סיכון, אין יעדים מהוועדה המלווה. בתצוגה "לפי מפקח.ת" אפשר לשלוח את הרשימה במייל.' },
    { go: 'S', sel: '#schBox', title: 'בתי הספר',
      text: 'כל בתי הספר לפי מפקח.ת. חיפוש לפי שם, רשת או סמל. לחיצה על בית ספר פותחת את העמוד שלו.' },
    { go: '@school', sel: '#schTabs', title: 'העמוד של בית ספר',
      text: 'למעלה הפרטים והמספרים. מתחת — לשוניות: סקירה, אנשים, מיפוי ויעדים, ועדה מלווה, אקלים, ביקורים ומשימות, סל תוכניות ולמידה. הצ׳ק ליסט ודוח הביקור נמצאים גם בלשונית "ביקורים ומשימות". כל מקטע מקופל, ונפתח בלחיצה.' },
    { go: 'M', sel: '#msgBox, #main .card.head', title: 'הודעה למנהלים',
      text: 'כותבים הודעה אחת, בוחרים לאילו מנהלים, ומקבלים טיוטה מוכנה מהמייל — המנהלים בעותק מוסתר. אפשר לצרף קובץ: הוא עולה לדרייב, וההודעה מקבלת קישור אליו.' },
    { go: 'F', sel: '#main .card.head', title: 'טפסים וקישורים',
      text: 'הקישורים הפתוחים שאפשר לשלוח למנהלים ולבעלי התפקידים — ולצד כל קישור: מי מבתי הספר כבר מילא ומי עוד לא, עם העתקה ותזכורת במייל.' },
    { go: 'W', sel: '.plcard, [data-k="plantrack"]', title: 'תוכנית העבודה',
      text: 'תוכנית העבודה השנתית לפי נספח ב בהנחיות התפקיד. תובי מכין טיוטה — תדירות ביקור ודגשים לכל בית ספר, גאנט חודשי וליווי בעלי תפקידים — עורכים, והכול נשמר לבד עד ההגשה. עבודת המטה נכתבת ידנית. במטה רואים מי הגיש ומי עוד לא.' },
    { go: 'K', sel: '#kitBox', title: 'ערכת המפקח.ת',
      text: 'כל מה שהיה במרחב הפיקוח באתר — עכשיו כאן: הנחיות התפקיד, תוכנית העבודה השנתית, הביקור והדוח, ועדות מלוות, פריסת הפיקוח והמגמות, וקישורים לדרייב. לוחצים על אריח, והמסמך נפתח בתוך תובה.' },
    /* תובי (8.10.26, בקשת מיטל: "ממש חשוב"). תחנה שהרכיב שלה לא מוצג (תובי כבוי) — מדולגת */
    { go: '@school', sel: '[data-tovi-slot]', title: 'תובי — תדריך לפני ביקור',
      text: 'תובי הוא העוזר החכם של תובה. לפני ביקור לוחצים כאן, ותוך כדקה מתקבל תדריך: תמונת מצב, מה השתנה מאז הביקור האחרון, נקודות לבדיקה והמלצות — עם המקור ליד כל טענה. אפשר להדפיס, להעתיק או לשלוח במייל.' },
    { go: '', sel: '[data-tovi-insight="focus:all"]', title: 'תובנות מתובי',
      text: 'כפתורים כאלה מופיעים לאורך תובה: על מה להתמקד השבוע, תובנות על האקלים, המדדים החלשים, הביקורים, היעדים, סל התוכניות וההשתלמויות. לחיצה — ותובי מנתח את הנתונים ומציע צעדים.' },
    { go: '', sel: '.tovi-fab', title: 'לשאול את תובי',
      text: 'הכפתור הזה נמצא בכל עמוד. אפשר לשאול את תובי כל שאלה על בתי הספר שלך — "אילו בתי ספר לא הגישו סל?", "מה היעדים של בית הספר?" — ולבחור בחלונית על איזה בית ספר שואלים. תובי רואה רק את בתי הספר שלך ונשען על הנתונים בתובה ועל ספר ההפעלה. כדאי לבדוק את המקור לפני שמחליטים.' },
    { go: '', sel: '#tourLink', title: 'אפשר לחזור לסיור',
      text: 'הסיור נמצא תמיד כאן בתפריט, ומעליו "מה תובי יכול לעשות?" — הסבר מלא על תובי. בהצלחה!' }
  ];

  var i = 0, steps = [], box, hole;
  function pick(sel) {
    var list = document.querySelectorAll(sel);
    for (var k = 0; k < list.length; k++) {
      var el = list[k], r = el.getBoundingClientRect();
      /* לא offsetParent — המגירה בטלפון היא position:fixed, ושם הוא תמיד null */
      if (el.getClientRects().length && r.height > 0 && r.right > 0 && r.left < window.innerWidth && getComputedStyle(el).visibility !== 'hidden') return el;
    }
    return null;
  }
  function navTo(s) {
    if (!window.REVITAL || s.go === undefined) return;
    var to = s.go === '@school' ? window.REVITAL.firstSchool() : s.go;
    if (window.REVITAL.at() !== to) window.REVITAL.go(to);
  }
  /* בטלפון התפריט הוא מגירה — פותחים אותה רק לתחנות שמדגישות אותו */
  function drawer(on) { document.body.classList.toggle('nav-on', !!on && window.innerWidth < 960); }

  function build() {
    hole = document.createElement('div'); hole.className = 'tour-hole';
    box = document.createElement('div'); box.className = 'tour-box';
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-live', 'polite');
    document.body.appendChild(hole); document.body.appendChild(box);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, { passive: true });
  }
  function onKey(e) {
    if (!box) return;
    if (e.key === 'Escape') end();
    if (e.key === 'ArrowLeft') step(1);
    if (e.key === 'ArrowRight') step(-1);
  }
  function place() {
    if (!box || !steps[i]) return;
    var el = pick(steps[i].sel);
    if (!el) return;
    var r = el.getBoundingClientRect(), pad = 8;
    /* מקטע גבוה מהמסך — מדגישים רק את החלק הנראה */
    var top = Math.max(r.top, 8), bottom = Math.min(r.bottom, window.innerHeight - 8);
    hole.style.top = (top - pad) + 'px'; hole.style.left = (r.left - pad) + 'px';
    hole.style.width = (r.width + pad * 2) + 'px'; hole.style.height = (bottom - top + pad * 2) + 'px';
    var bw = Math.min(360, window.innerWidth - 24);
    box.style.width = bw + 'px';
    var below = bottom + 14 + box.offsetHeight < window.innerHeight;
    var bt = below ? bottom + 14 : Math.max(12, top - 14 - box.offsetHeight);
    if (!below && top - 14 - box.offsetHeight < 12) bt = window.innerHeight - box.offsetHeight - 12;   /* אין מקום — בתחתית */
    var left = r.left + r.width - bw;   /* RTL: מיושר לקצה הימני */
    left = Math.max(12, Math.min(left, window.innerWidth - bw - 12));
    box.style.top = bt + 'px'; box.style.left = left + 'px';
  }
  function show() {
    var s = steps[i];
    navTo(s);
    drawer(s.sel === '.side' || s.sel === '#tourLink');
    setTimeout(function () {
      var el = pick(s.sel);
      if (!el) return step(1);   /* העמוד לא הציג את המקטע — ממשיכים */
      el.scrollIntoView({ behavior: 'smooth', block: el.getBoundingClientRect().height > window.innerHeight * 0.6 ? 'start' : 'center' });
      box.innerHTML = '<div class="tour-count">' + (i + 1) + ' מתוך ' + steps.length + '</div>' +
        '<h3>' + s.title + '</h3><p>' + s.text + '</p><div class="tour-actions">' +
        '<button type="button" class="tour-next">' + (i === steps.length - 1 ? 'סיום' : 'הבא') + '</button>' +
        (i ? '<button type="button" class="tour-prev">הקודם</button>' : '') +
        '<button type="button" class="tour-skip">יציאה מהסיור</button></div>';
      box.querySelector('.tour-next').onclick = function () { step(1); };
      var prev = box.querySelector('.tour-prev'); if (prev) prev.onclick = function () { step(-1); };
      box.querySelector('.tour-skip').onclick = end;
      place(); setTimeout(place, 400);
      box.querySelector('.tour-next').focus({ preventScroll: true });
    }, s.go !== undefined ? 250 : 0);
  }
  var dir = 1;
  function step(d) {
    dir = d;
    var n = i + d;
    if (n >= steps.length) return end();
    if (n < 0) return;
    i = n; show();
  }
  function end() {
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', place);
    window.removeEventListener('scroll', place);
    if (box) box.remove(); if (hole) hole.remove();
    box = hole = null;
    drawer(false);
    if (window.REVITAL) window.REVITAL.go('');
  }
  function start() {
    if (box) return;
    steps = STEPS.slice();
    i = 0; build(); show();
  }
  window.REVITAL_TOUR = { start: start };
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('[data-tour-start]')) { e.preventDefault(); start(); }
  });
  /* ?tour=1 — קישור שאפשר לשלוח למפקחים */
  if (/[?&]tour=1\b/.test(location.search)) {
    document.addEventListener('revital:ready', function () { setTimeout(start, 400); }, { once: true });
  }
})();
