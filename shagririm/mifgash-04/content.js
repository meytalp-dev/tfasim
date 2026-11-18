/* מפגש 4 שגרירים · כלי AI בחשבון משרד החינוך
   מקור אחד למצגת (index.html) ולדף המלווה (melave.html).
   t: 'k' = כלים, 'h' = הובלה, 'kh' = שניהם.
   shot: שם קובץ ב-img/ (מ-shots.json) או 'pending:<תיאור>' כשהצילום עוד לא צולם. */

const LINKS = {
  /* הכפתור "משרד העבודה" בדף הכניסה של משרד החינוך (pop.education.gov.il/sherutey-tiksuv-bachinuch/anan-google) */
  login: 'https://www.google.com/a/avoda-edu.org.il/ServiceLogin?continue=https://classroom.google.com/&passive=true',
  gemini: 'https://gemini.google.com/',
  vids: 'https://vids.google.com/',
  aistudio: 'https://aistudio.google.com/',
  firebase: 'https://console.firebase.google.com/',
  staff: 'cheder-morim.html'
};

const P = {
  pro: `אני מורה ל[מקצוע] בבית ספר של הכשרה מקצועית. תכנן/י לי יחידה של 3 שיעורים על [נושא], לתלמידים שמתקשים בקריאה: מטרה לכל שיעור, פעילות אחת לכל שיעור, ודרך פשוטה לבדוק שהבינו.
לפני שאת/ה עונה, שאל/י אותי 3 שאלות על הכיתה.
כתוב/י בעברית פשוטה, בלי מילים באנגלית.`,
  proLead: `אני רכז/ת חדשנות בבית ספר של הכשרה מקצועית. תכנן/י לי הדרכה של 15 דקות לצוות המורים על כלי AI אחד: [שם הכלי]. מה אומרים בפתיחה, הדגמה אחת, משימה קצרה שכל מורה עושה בטלפון, ושתי התנגדויות שכדאי להתכונן אליהן ומה עונים.
לפני שאת/ה עונה, שאל/י אותי 3 שאלות על הצוות.
כתוב/י בעברית פשוטה.`,
  canvasTool: `צור/י ב-Canvas פעילות קצרה לתלמידי [מגמה], כיתה [י/יא/יב]: 8 שאלות אמריקאיות על [נושא].
אחרי כל תשובה: משוב מיד והסבר של משפט אחד. בסוף: ציון ומה כדאי לחזור עליו.
בעברית פשוטה, מימין לשמאל, כפתורים גדולים שנוחים בטלפון.`,
  canvasFix: `הגדל/י את הכפתורים, הוסף/י טיימר של 30 שניות לכל שאלה, ושנה/י את הצבעים לכחול ולבן.`,
  canvasSlides: `צור/י ב-Canvas מצגת של 6 שקפים לשיעור על [נושא] ב[מקצוע]: שקף פתיחה עם שאלה, 4 שקפי תוכן עם דוגמה מהעבודה המקצועית, ושקף סיכום עם משימה קצרה.
בעברית, מימין לשמאל, מעט טקסט בכל שקף.`,
  vids: `חשמלאי צעיר בודק לוח חשמל בסדנה מוארת. המצלמה מתקרבת לאט לידיים שלו ולמכשיר המדידה. אור יום רך, סגנון ריאליסטי.`,
  asGame: `בנה משחק זיכרון קצר בעברית, מימין לשמאל, על 6 מושגים מ[המקצוע] וההגדרות שלהם.
כפתור "משחק חדש", מונה צעדים, ומסך סיום שמראה בכמה צעדים סיימו.
עיצוב נקי, כפתורים גדולים, מתאים לטלפון.`,
  asFix: `Fix any build issues`,
  asSurvey: `בנה שאלון קצר לצוות המורים, בעברית, מימין לשמאל: 4 שאלות על [נושא, למשל: איך אני משתמש/ת ב-AI בכיתה] — 3 שאלות בחירה ושאלה פתוחה אחת.
כל תשובה נשמרת ב-Firestore עם התחברות אנונימית. בלי שם ובלי מייל של מי שעונה.
הוסף דשבורד שרק [המייל שלי] יכול לפתוח: כמה ענו, גרף לכל שאלה, ורשימת התשובות הפתוחות.
כפתור "דשבורד" גלוי בראש הדף.`,
  asLive: `הוסף כפתור גלוי "מסך מנחה" בראש הדף. הוא פותח מסך שמציג את התשובות בזמן אמת, בגדול, להקרנה בישיבת צוות.`,
  stuck: (tool) => `אני עובד/ת ב-${tool} ונתקעתי. זה מה שאני רואה על המסך: [מתארים במילים, או מצרפים צילום מסך]. מה ללחוץ עכשיו? תענה/י בעברית פשוטה, צעד אחד בכל פעם.`
};

/* ---------- הדף המלווה: שלב = פעולה אחת ---------- */
const STEPS = [
  { id:'open', t:'kh', title:'כתבו פעולה שכבר עשיתם',
    body:'מה עשיתם, ואיך היה.', field:{key:'since3', ph:'למשל: הראיתי לשתי מורות מגמת חשמל את הבוחן מהנוטבוק. אחת כבר השתמשה בו בכיתה, והתלמידים שיתפו פעולה'},
    help:{ see:null, ask:null, faq:['עוד לא עשיתם? כתבו מה מתכננים לעשות השבוע, ועם מי.'] } },

  { id:'login', t:'kh', title:'נכנסים עם החשבון של משרד החינוך, ופותחים את 9 הנקודות',
    body:'בדף הכניסה של משרד החינוך לסביבת גוגל בוחרים "משרד העבודה", ונכנסים עם החשבון. בדף שנפתח לוחצים על 9 הנקודות למעלה: שם כל הכלים, בחינם.', tools:['login','gemini'], shots:['login-portal','login-classroom','login-apps'],
    help:{ see:{shot:'login-classroom', text:'בפינה העליונה מופיעה האות של החשבון, ולידה 9 הנקודות. לוחצים על האות כדי לראות איזה חשבון פתוח.'},
      ask:P.stuck('Google Chrome, בהחלפת חשבון'),
      faq:['נפתח החשבון הפרטי ← לוחצים על התמונה בפינה ← בוחרים את החשבון של משרד החינוך.','אין סיסמה? מבקשים מרכז/ת התקשוב של הרשת, או מאיפוס הסיסמה של משרד החינוך.'] } },

  /* ---- Gemini Pro ---- */
  { id:'pro-pick', t:'k', part:'Gemini Pro', title:'בוחרים את המודל Pro',
    body:'בתיבת הכתיבה: לוחצים על שם המודל ← "מחקר מפורט" (3.1 Pro).', tools:['gemini'], shot:'gemini-model',
    help:{ see:{shot:'gemini-model', text:'נפתח תפריט עם שלושה מודלים. בוחרים בתחתון: מחקר מפורט, 3.1 Pro. הוא חושב לאט יותר ועמוק יותר.'},
      ask:P.stuck('Gemini, בבחירת מודל'),
      faq:[] } },
  { id:'pro-prompt', t:'k', part:'Gemini Pro', title:'מדביקים בקשת תכנון',
    body:'משנים את מה שבסוגריים, ושולחים. Gemini ישאל אתכם 3 שאלות לפני שהוא עונה.', prompt:P.pro, tools:['gemini'],
    help:{ see:{shot:'pending:gemini-pro-answer', text:'קודם 3 שאלות. אחרי שעונים, מגיעה תוכנית של 3 שיעורים.'},
      ask:'הנה התוכנית שקיבלתי: [מדביקים]. מה חסר בה למורה שמלמד/ת כיתה מתקשה? תן/י 3 תיקונים.',
      faq:['ענה מיד בלי לשאול ← כותבים: "קודם שאל אותי 3 שאלות".','התשובה ארוכה מדי ← "קצר לחצי, טבלה אחת".'] } },
  { id:'pro-lead', t:'h', part:'Gemini Pro', title:'Gemini Pro: מתכננים הדרכה לצוות',
    body:'בוחרים Pro (שם המודל ← "מחקר מפורט", 3.1 Pro), מדביקים, משנים את הסוגריים ושולחים.', prompt:P.proLead, tools:['gemini'], shot:'gemini-model',
    help:{ see:{shot:'gemini-model', text:'נפתח תפריט עם שלושה מודלים. בוחרים בתחתון: מחקר מפורט, 3.1 Pro. הוא חושב לאט יותר ועמוק יותר.'},
      ask:P.stuck('Gemini'),
      faq:[] } },

  /* ---- Canvas ---- */
  { id:'canvas-on', t:'k', part:'Canvas', title:'מסמנים Canvas',
    body:'בתיבת הכתיבה: לוחצים על + ← כלים נוספים ← Canvas.', tools:['gemini'], shot:'canvas-toggle',
    help:{ see:{shot:'canvas-toggle', text:'נפתח תפריט. בתחתית שלו: כלים נוספים, ובתוכו Canvas.'},
      ask:P.stuck('Gemini Canvas'),
      faq:['קיבלתי רק קוד ← Canvas לא היה מסומן. מסמנים ושולחים שוב.'] } },
  { id:'canvas-tool', t:'kh', part:'Canvas', title:'בונים פעילות לכיתה ב-Canvas',
    body:'מסמנים Canvas, מדביקים, משנים את הסוגריים ושולחים. אחרי כחצי דקה הפעילות נפתחת בתצוגה מקדימה.', prompt:P.canvasTool, tools:['gemini'], shot:'canvas-result',
    help:{ see:{shot:'canvas-result', text:'הפעילות נפתחת בתוך השיחה, בתצוגה מקדימה. אפשר ללחוץ ולנסות.'},
      ask:'בניתי ב-Gemini Canvas פעילות לכיתה, והיא [מה לא עובד]. מה לכתוב בשיחה כדי לתקן?',
      faq:['קיבלתי רק קוד ← Canvas לא היה מסומן.','הטקסט משמאל לימין ← כותבים בשיחה: "הכול מימין לשמאל".'] } },
  { id:'canvas-fix', t:'k', part:'Canvas', title:'משנים בשיחה',
    body:'כותבים בשיחה מה לשנות. Canvas מעדכן את אותה פעילות.', prompt:P.canvasFix, tools:['gemini'],
    help:{ see:{shot:'canvas-result', text:'הפעילות מתעדכנת במקום. אפשר לחזור לגרסה קודמת.'},
      ask:P.stuck('Gemini Canvas'),
      faq:['השינוי שבר משהו ← "חזור לגרסה הקודמת".'] } },
  { id:'canvas-share', t:'k', part:'Canvas', title:'מפרסמים את הפעילות כאתר',
    body:'מעל הפעילות: ייצוא ← Google Sites. כשמופיעה ההודעה לוחצים "פתיחת האתר" ← פרסום, כותבים שם לאתר, ושוב פרסום.', tools:['gemini'], shots:['canvas-export','canvas-site-made','sites-publish','sites-publish-dialog'],
    help:{ see:{shot:'sites-publish-dialog', text:'בחלון הפרסום כתוב מי יכול לראות את האתר: כל המשתמשים בדומיין Avoda-edu.'},
      ask:P.stuck('Gemini Canvas, בייצוא ל-Google Sites'),
      faq:['בייצוא יש שתי אפשרויות: Google Sites, או הורדת הקוד. כדי לשתף בוחרים Google Sites.'] } },
  { id:'canvas-slides', t:'k', part:'Canvas', title:'בונים גם מצגת ב-Canvas',
    body:'בשיחה חדשה, עם Canvas מסומן: מדביקים, משנים את הסוגריים ושולחים.', prompt:P.canvasSlides, tools:['gemini'],
    help:{ see:null, ask:'בניתי ב-Gemini Canvas מצגת לשיעור, והיא [מה לא טוב]. מה לכתוב בשיחה כדי לתקן?',
      faq:['יותר מדי טקסט בשקף ← כותבים בשיחה: "עד 3 שורות בכל שקף".','הטקסט משמאל לימין ← כותבים בשיחה: "הכול מימין לשמאל".'] } },

  /* ---- Vids ---- */
  { id:'vids-open', t:'kh', part:'Vids', title:'פותחים Vids ולוחצים "יצירת סרטונים"',
    body:'ב-9 הנקודות בוחרים Vids. בדף שנפתח לוחצים על "יצירת סרטונים".', tools:['vids'], shots:['vids-pick','vids-home'],
    help:{ see:{shot:'vids-create', text:'נפתח חלון "קטע וידאו מבוסס AI", עם תיבה לכתיבת הבקשה.'}, ask:P.stuck('Google Vids'),
      faq:['הממשק לא נפתח ← בודקים שזה החשבון של משרד החינוך.'] } },
  { id:'vids-prompt', t:'kh', part:'Vids', title:'כותבים מה רואים בסרטון',
    body:'כותבים בתיבה שמתחת ל"יצירה": מי, איפה, מה קורה, ואיך המצלמה זזה. בלי טקסט בתוך הסרטון.', prompt:P.vids, tools:['vids'], shot:'vids-create',
    help:{ see:{shot:'vids-made', text:'כשהקטע מוכן, הוא מופיע מעל התיבה.'}, ask:'אני רוצה סרטון של 10 שניות שיפתח שיעור על [נושא]. כתוב/י לי 3 תיאורי סצנה קצרים: מי, איפה, מה קורה, ואיך המצלמה זזה.',
      faq:['הסרטון לא דומה למה שרציתי ← מוסיפים פרטים: אור, זווית, תנועה.','טקסט בעברית יוצא משובש ← לא מבקשים טקסט בסרטון. מוסיפים כתוביות בשלב הבא.'] } },
  { id:'vids-add', t:'kh', part:'Vids', title:'לוחצים "הוספה"', warn:'בלי הלחיצה הזו הסרטון נמחק כשסוגרים את הכרטיסייה.',
    body:'מיד אחרי שהקטע נוצר, מתחת לסרטון.', tools:['vids'], shot:'vids-made',
    help:{ see:{shot:'vids-timeline'}, ask:P.stuck('Google Vids'),
      faq:['יש סצנה ריקה בהתחלה ← מוחקים אותה, אחרת היא נכנסת לסרטון.'] } },
  { id:'vids-plus', t:'kh', part:'Vids', title:'סצנה חדשה: לוחצים על +',
    body:'ה-+ הכחול ליד ציר הזמן פותח סצנה חדשה. כותבים בה בקשה חדשה, ושוב "הוספה".', tools:['vids'], shot:'vids-plus',
    help:{ see:null, ask:P.stuck('Google Vids, בהוספת סצנה'), faq:[] } },
  { id:'vids-text', t:'kh', part:'Vids', title:'מוסיפים כתוביות',
    body:'בסרגל הצד לוחצים על "כתוביות". לטקסט חופשי על הסרטון: "טקסט", שמתחתיו.', tools:['vids'], shot:'vids-captions',
    help:{ see:{shot:'vids-text'}, ask:P.stuck('Google Vids, בתיבת טקסט'),
      faq:['הטקסט משמאל לימין ← מסמנים את הטקסט ← יישור לימין.'] } },
  { id:'vids-download', t:'kh', part:'Vids', title:'מורידים כ-MP4',
    body:'קובץ ← הורדה ← סרטון MP4.', tools:['vids'], shot:'vids-download',
    help:{ see:{shot:'vids-download', text:'בתפריט קובץ: הורדה ← סרטון MP4. באותו תפריט יש גם ייצוא ל-Drive.'}, ask:P.stuck('Google Vids, בהורדה'),
      faq:['ירד סרטון ריק ← לא לחצתם "הוספה". חוזרים לשלב הקודם.','רוצים איכות גבוהה ← "הגדלת רזולוציה" ל-1080p לפני ההורדה.'] } },

  /* ---- AI Studio (הובלה) ---- */
  { id:'as-open', t:'h', part:'AI Studio', title:'נכנסים ל-AI Studio ולוחצים New app',
    body:'aistudio.google.com ← בתפריט משמאל, תחת BUILD: New app.', tools:['aistudio'], shot:'aistudio-newapp',
    help:{ see:{shot:'aistudio-newapp'}, ask:P.stuck('Google AI Studio'),
      faq:['הכול באנגלית ← קליק ימני ← "תרגום לעברית". מכבים את התרגום לפני שכותבים בקשה.','נפתח החשבון הפרטי ← מחליפים לחשבון של משרד החינוך (בכתובת יש מספר אחרי u).'] } },
  { id:'as-plan', t:'h', part:'AI Studio', title:'בוחרים PLAN',
    body:'ליד תיבת הכתיבה: Default mode ← PLAN.', tools:['aistudio'], shot:'as-modes',
    help:{ see:{shot:'as-modes'}, ask:P.stuck('Google AI Studio'),
      faq:['PLAN = לבקשה הראשונה. הוא שואל שאלות לפני שהוא בונה.','DEFAULT = לשינויים קטנים. MAX = כשנתקעים.'] } },
  { id:'as-prompt', t:'h', part:'AI Studio', title:'מדביקים את הבקשה',
    body:'משנים את המקצוע, ולוחצים שליחה.', prompt:P.asGame, tools:['aistudio'],
    help:{ see:{shot:'as-plan-q'}, ask:'אני רוצה לבנות ב-Google AI Studio [מה רוצים לבנות] למורים בבית הספר. כתוב/י לי בקשה ברורה בעברית: מה רואים במסך, אילו כפתורים יש, ומה קורה בסוף.',
      faq:['שכחתם לבחור PLAN ← זה בסדר. הוא יבנה מיד, ואפשר לשנות אחר כך.'] } },
  { id:'as-answer', t:'h', part:'AI Studio', title:'עונים לשאלות, ומאשרים את התוכנית',
    body:'בוחרים תשובה לכל שאלה ← מאשרים. הבנייה לוקחת כ-2 דקות.', tools:['aistudio'], shot:'as-plan-ready',
    help:{ see:{shot:'as-game'}, ask:P.stuck('Google AI Studio, בתוכנית'),
      faq:['התצוגה ריקה ← מרעננים, או כותבים בשיחה "Fix any build issues".'] } },
  { id:'as-change', t:'h', part:'AI Studio', title:'משנים בשיחה',
    body:'חוזרים ל-DEFAULT וכותבים שינוי אחד בכל פעם. נתקעתם? MAX.', prompt:P.asFix, tools:['aistudio'],
    help:{ see:{shot:'as-modes'}, ask:P.stuck('Google AI Studio'),
      faq:['השינוי שבר משהו ← חוזרים לגרסה קודמת בהיסטוריה של השיחה.','אותה תקלה חוזרת ← MAX ("work longer").'] } },
  { id:'as-share', t:'h', part:'AI Studio', title:'משתפים: Share ← Public',
    body:'Share ← מחליפים Restricted ל-Public ← מעתיקים את הקישור. לא Publish.', tools:['aistudio'], shot:'as-share-public',
    help:{ see:{shot:'as-share-btn'}, ask:P.stuck('Google AI Studio, בשיתוף'),
      faq:['Publish מבקש billing ← לא מגדירים. משתפים רק ב-Share.','מי שפותח רואה אזהרה על "מפתח אחר" ← לוחצים Continue.'] } },
  { id:'as-viewer', t:'h', part:'AI Studio', title:'בודקים מה רואה מי שפותח',
    body:'פותחים את הקישור בחלון גלישה בסתר, ונכנסים עם חשבון גוגל אחר.', shot:'pending:as-open-warn',
    help:{ see:{shot:'pending:as-open-warn', text:'מסך כניסה לגוגל, ואחריו אזהרה על "מפתח אחר". לוחצים Continue, והמשחק נפתח.'}, ask:P.stuck('Google AI Studio, בפתיחת קישור משותף'),
      faq:['צריך חשבון גוגל כדי לפתוח. גם חשבון פרטי עובד.','לא לתלמידים מתחת לגיל 18.'] } },
  { id:'as-firebase', t:'h', part:'שאלון ודשבורד', title:'הגדרה חד-פעמית: מפעילים התחברות אנונימית',
    body:'console.firebase.google.com ← הפרויקט Default Gemini Project ← Authentication ← Sign-in method ← Anonymous ← Enable.', tools:['firebase'], shot:'as-anon',
    help:{ see:{shot:'as-firebase-project'}, ask:P.stuck('Firebase console, בהפעלת Anonymous'),
      faq:['רואים פרויקט אחר ← בודקים בפינה שזה החשבון של משרד החינוך.','עושים את זה פעם אחת בלבד. כל אפליקציה אחר כך משתמשת בזה.'] } },
  { id:'as-survey', t:'h', part:'שאלון ודשבורד', title:'בונים שאלון לצוות עם דשבורד',
    body:'New app ← PLAN ← מדביקים, משנים את הנושא ואת המייל שלכם.', prompt:P.asSurvey, tools:['aistudio'], shot:'as-firestore-empty',
    help:{ see:{shot:'as-firestore-empty'}, ask:P.stuck('Google AI Studio, בשאלון עם Firestore'),
      faq:['התצוגה ריקה ← מרעננים, או "Fix any build issues".','מבקש Enable Firebase ← מאשרים.','הדשבורד לא נפתח ← בודקים שהמייל בבקשה הוא המייל שאיתו נכנסתם.'] } },
  { id:'as-live', t:'h', part:'שאלון ודשבורד', adv:true, title:'למתקדמים: מסך תשובות חי',
    body:'בשיחה של השאלון: מדביקים. ההוראה הזו חשובה: כפתור גלוי, לא כתובת מיוחדת.', prompt:P.asLive, tools:['aistudio'], shot:'as-live-participant',
    help:{ see:{shot:'as-live-participant'}, ask:P.stuck('Google AI Studio, במסך מנחה'),
      faq:['קישור שמתחיל ב-ais-pre מחזיר 404 ← עובד רק אחרי Share. משתפים קודם.'] } },

  /* ---- סיום ---- */
  { id:'studio', t:'k', title:'בוחרים כלי, ונכנסים לחדר שלו',
    body:'בוחרים כלי אחד: Gemini Pro, Canvas או Vids. נכנסים בזום לחדר שנושא את שם הכלי, בונים שם, ומדביקים כאן את הקישור.', field:{key:'mytool', ph:'הקישור לפעילות / לסרטון'},
    help:{ see:null, ask:'אני רכז/ת חדשנות בבית ספר של הכשרה מקצועית. הצוות שלי צריך [הצורך]. איזה כלי מתאים יותר: Gemini Pro, Canvas או Vids? ולמה, במשפט אחד?',
      faq:['לא יודעים מה לבחור ← חוזרים לצורך שבחרתם ביחידה 3.','לא רואים את החדרים בזום ← לוחצים על "חדרים" בסרגל התחתון של זום.'] } },
  { id:'studio', t:'h', title:'בונים כלי אחד לבית הספר שלי',
    body:'בוחרים כלי מהיום, בונים, ומדביקים כאן את הקישור.', field:{key:'mytool', ph:'הקישור לפעילות / לאפליקציה'},
    help:{ see:null, ask:'אני רכז/ת חדשנות בבית ספר של הכשרה מקצועית. הצוות שלי צריך [הצורך]. איזה כלי מתאים יותר: Gemini Pro, Canvas, Vids או AI Studio? ולמה, במשפט אחד?',
      faq:['לא יודעים מה לבנות ← חוזרים לצורך שבחרתם ביחידה 3.'] } },
  { id:'enrich-k', t:'k', enrich:true, title:'למתקדמים: Google AI Studio',
    body:'מתי AI Studio, ולא Pro? כשרוצים לבנות אפליקציה שאחרים משתמשים בה: שאלון, הצבעה, ענן מילים על המסך, דשבורד שמתעדכן לבד. נכנסים ל-aistudio.google.com ← New app ← מדביקים.', prompt:P.asGame, tools:['aistudio'], shot:'aistudio-home',
    help:{ see:{shot:'as-game'}, ask:P.stuck('Google AI Studio'), faq:['הכול באנגלית ← קליק ימני ← "תרגום לעברית".'] } },
  { id:'enrich-h', t:'h', enrich:true, title:'למי שנשאר זמן: סרטון ב-Vids',
    body:'Vids ← יצירת סרטונים ← כותבים בקשה ← "הוספה" ← קובץ ← הורדה.', prompt:P.vids, tools:['vids'], shot:'vids-made',
    help:{ see:{shot:'vids-ai-clip'}, ask:P.stuck('Google Vids'), faq:['בלי "הוספה" הסרטון נמחק כשסוגרים את הכרטיסייה.'] } },
  { id:'staff', t:'kh', title:'מכינים את המצגת לחדר המורים',
    body:'פותחים את המצגת, לוחצים על הכותרת וכותבים את שם בית הספר.', tools:['staff'],
    field:{key:'staffdate', ph:'מתי אציג אותה, ולמי. למשל: ישיבת צוות ביום שלישי 24.11, מורי המגמות'},
    help:{ see:null, ask:'אני מציג/ה לצוות המורים מצגת של 10 דקות על כלי AI. מה 2 השאלות הכי צפויות מהמורים, ומה עונים בקצרה?',
      faq:['אין אינטרנט בחדר ← מורידים מראש את הסרטון מ-Vids ומראים אותו מהמחשב.'] } },
  { id:'field', t:'kh', title:'משימת שטח',
    body:'מציגים את המצגת בחדר המורים, ומבקשים ממורה אחד/ת לנסות כלי אחד באותו שבוע.',
    fields:[{key:'f_who', ph:'מי ניסה/תה (שם פרטי ומקצוע)'},{key:'f_what', ph:'מה ניסה/תה ומה יצא'},{key:'f_next', ph:'הצעד הבא'}],
    help:{ see:null, ask:null, faq:['ממלאים אחרי ההצגה, עד המפגש הבא.'] } },
  { id:'feedback', t:'kh', title:'משוב',
    fb:true, help:{ see:null, ask:null, faq:[] } }
];

/* ---------- המצגת ---------- */
/* kinds: cover · q (שאלה לחדר) · map (לאן הולכים) · part · step · prompt · warn · list · studio · staff · field · end */
const SLIDES = [
  {k:'cover', t:'kh'},
  {k:'q', t:'kh', ref:'open', title:'כתבו פעולה שכבר עשיתם', sub:'בדף המלווה: מה עשיתם, ואיך היה.'},
  {k:'map', t:'kh', title:'לאן הולכים?', rows:[
    ['לתכנן שיעור, הדרכה או מחוון','Gemini Pro','k'],
    ['פעילות קטנה לכיתה, או מצגת','Canvas','k'],
    ['סרטון של 10 שניות לפתיחת שיעור','Vids','kh'],
    ['כלי לצוות שאוסף תשובות, עם דשבורד','AI Studio','h']]},
  {k:'step', t:'kh', ref:'login', n:1, kicker:'לפני הכול', title:'נכנסים דרך "משרד העבודה"', call:'בדף הכניסה של משרד החינוך לסביבת גוגל: בוחרים משרד העבודה, ונכנסים עם החשבון.', shot:'login-portal'},
  {k:'step', t:'kh', ref:'login', n:2, kicker:'לפני הכול', title:'לוחצים על 9 הנקודות', call:'בדף שנפתח, בפינה למעלה.', shot:'login-classroom'},
  {k:'step', t:'k', ref:'login', n:3, kicker:'לפני הכול', title:'כאן כל הכלים, בחינם', call:'היום נשתמש ב-Gemini וב-Vids.', shot:'login-apps'},
  {k:'step', t:'h', ref:'login', n:3, kicker:'לפני הכול', title:'כאן כל הכלים, בחינם', call:'כל הכלים של גוגל, בחשבון הזה.', shot:'login-apps'},

  {k:'part', t:'kh', n:'א', title:'Gemini Pro', sub:'חושב לאט יותר, ועמוק יותר'},
  {k:'prompt', t:'h', ref:'pro-lead', kicker:'Gemini Pro', title:'מתכננים הדרכה לצוות'},
  {k:'list', t:'k', title:'מתי בוחרים Pro?', items:[['תכנון','יחידת לימוד, מערך שיעור, הדרכה'],['ניתוח','קובץ, נתונים, טקסט ארוך'],['מחוון','קריטריונים ורמות']], foot:'לשאלה מהירה, המודל הרגיל מספיק. ברשימת המודלים, Pro נקרא "מחקר מפורט".'},
  {k:'step', t:'k', ref:'pro-pick', n:1, kicker:'Gemini Pro', title:'בוחרים Pro', call:'בתיבת הכתיבה: שם המודל ← מחקר מפורט (3.1 Pro)'},
  {k:'prompt', t:'k', ref:'pro-prompt', kicker:'Gemini Pro', title:'בקשת תכנון'},

  {k:'part', t:'kh', n:'ב', title:'Canvas', sub:'פעילות קטנה לכיתה, ומצגת'},
  {k:'step', t:'k', ref:'canvas-on', n:1, kicker:'Canvas', title:'מסמנים Canvas', call:'בתיבת הכתיבה: + ← כלים נוספים ← Canvas'},
  {k:'prompt', t:'kh', ref:'canvas-tool', kicker:'Canvas', title:'פעילות לכיתה'},
  {k:'prompt', t:'k', ref:'canvas-fix', kicker:'Canvas', title:'משנים בשיחה'},
  {k:'step', t:'k', ref:'canvas-share', n:4, kicker:'Canvas', title:'ייצוא ← Google Sites', call:'מעל הפעילות, בצד שמאל. האפשרות השנייה: הורדת הקוד.', shot:'canvas-export'},
  {k:'step', t:'k', ref:'canvas-share', n:5, kicker:'Canvas', title:'פותחים את האתר, ולוחצים "פרסום"', call:'קודם "פתיחת האתר" בהודעה שמופיעה, ואז פרסום למעלה.', shot:'sites-publish'},
  {k:'step', t:'k', ref:'canvas-share', n:6, kicker:'Canvas', title:'כותבים שם לאתר', call:'ושוב פרסום. רואים אותו כל המשתמשים בדומיין Avoda-edu.', shot:'sites-publish-dialog'},
  {k:'prompt', t:'k', ref:'canvas-slides', kicker:'Canvas · לא רק פעילות', title:'גם מצגת'},

  {k:'part', t:'kh', n:'ג', title:'Vids', sub:'סרטון של 10 שניות, בחינם'},
  {k:'step', t:'kh', ref:'vids-open', n:1, kicker:'Vids', title:'בוחרים Vids', call:'ב-9 הנקודות.', shot:'vids-pick'},
  {k:'step', t:'kh', ref:'vids-open', n:2, kicker:'Vids', title:'לוחצים "יצירת סרטונים"', call:'בדף הראשי של Vids.', shot:'vids-home'},
  {k:'step', t:'kh', ref:'vids-prompt', n:3, kicker:'Vids', title:'כאן כותבים את הבקשה', call:'בתיבה שמתחת ל"יצירה".', shot:'vids-create'},
  {k:'prompt', t:'kh', ref:'vids-prompt', kicker:'Vids', title:'מה רואים בסרטון'},
  {k:'warn', t:'kh', ref:'vids-add', kicker:'Vids · אחרי שהקטע נוצר', title:'לוחצים "הוספה"', x:'בלי הלחיצה הזו הסרטון נמחק כשסוגרים את הכרטיסייה.', shot:'vids-made'},
  {k:'step', t:'kh', ref:'vids-plus', n:6, kicker:'Vids', title:'סצנה חדשה: לוחצים על +', call:'ואז כותבים בקשה חדשה.', shot:'vids-plus'},
  {k:'step', t:'kh', ref:'vids-text', n:7, kicker:'Vids', title:'מוסיפים כתוביות', call:'בסרגל הצד: כתוביות.'},
  {k:'step', t:'kh', ref:'vids-download', n:8, kicker:'Vids', title:'מורידים כ-MP4', call:'קובץ ← הורדה ← סרטון MP4'},

  {k:'when', t:'k', kicker:'למתקדמים · Google AI Studio', title:'מתי AI Studio, ולא Pro?', items:[
    'כשרוצים לבנות אפליקציה, ולא לקבל תשובה',
    'כשהתשובות צריכות להישמר: שאלון, הצבעה, משוב',
    'כשרוצים דשבורד שמציג את מה שנאסף, ומתעדכן לבד',
    'כשעושים פעילות חיה על המסך: ענן מילים, הצבעה, חידון כיתתי',
    'כשכולם נכנסים מאותו קישור, כל אחד מהטלפון שלו'],
    foot:'Pro עונה לי. AI Studio בונה משהו שאחרים משתמשים בו.'},
  {k:'step', t:'k', ref:'enrich-k', n:1, kicker:'למתקדמים · Google AI Studio', title:'לוחצים New app', call:'aistudio.google.com ← בתפריט משמאל, תחת BUILD', shot:'aistudio-home'},

  {k:'part', t:'h', n:'ד', title:'AI Studio', sub:'כלי לצוות, עם תוצאות'},
  {k:'step', t:'h', ref:'as-open', n:1, kicker:'AI Studio', title:'לוחצים New app', call:'בתפריט משמאל, תחת BUILD'},
  {k:'modes', t:'h', title:'שלושה מצבים', rows:[['PLAN','הבקשה הראשונה. שואל שאלות לפני שבונה.'],['DEFAULT','שינויים קטנים, אחד בכל פעם.'],['MAX','כשנתקעים. עובד יותר זמן.']], shot:'as-modes'},
  {k:'prompt', t:'h', ref:'as-prompt', kicker:'AI Studio · PLAN', title:'משחק לכיתה'},
  {k:'step', t:'h', ref:'as-answer', n:3, kicker:'AI Studio', title:'עונים לשאלות, ומאשרים', call:'הבנייה לוקחת כ-2 דקות'},
  {k:'step', t:'h', ref:'as-share', n:4, kicker:'AI Studio', title:'Share ← Public', call:'ומעתיקים את הקישור'},
  {k:'warn', t:'h', kicker:'AI Studio', title:'לא Publish', x:'Publish מבקש להגדיר תשלום (billing). לא מגדירים. משתפים רק ב-Share.', shot:'as-publish-billing'},
  {k:'part', t:'h', n:'ה', title:'שאלון לצוות, ודשבורד', sub:'התשובות נשמרות, ורק אתם רואים אותן'},
  {k:'step', t:'h', ref:'as-firebase', n:1, kicker:'פעם אחת בלבד', title:'מפעילים התחברות אנונימית', call:'Firebase ← Authentication ← Sign-in method ← Anonymous'},
  {k:'prompt', t:'h', ref:'as-survey', kicker:'AI Studio · PLAN', title:'שאלון לצוות עם דשבורד'},
  {k:'prompt', t:'h', ref:'as-live', kicker:'למתקדמים', title:'מסך תשובות חי לישיבת צוות'},

  {k:'list', t:'kh', title:'מה בתשלום, ומה אסור', items:[
    ['בתשלום','Publish ב-AI Studio, Gemini 4 Carbon, מודלי הווידאו ב-AI Studio'],
    ['לא לתלמידים','AI Studio: רק מגיל 18'],
    ['אסור להכניס','שמות, תעודות זהות וציונים של תלמידים']], foot:'כלל אחד: מה שלא הייתם שולחים במייל לכל ההורים, לא מכניסים.'},
  {k:'studio', t:'kh', ref:'studio', title:'עכשיו אתם: כלי אחד לבית הספר שלי',
    /* מסלול כלים: כל אחד בוחר כלי ונכנס לחדר שלו בזום */
    titleK:'בוחרים כלי, ונכנסים לחדר שלו',
    rooms:[
      {name:'Gemini Pro', what:'תכנון שיעור, הדרכה או מחוון', link:'gemini', prompt:'pro'},
      {name:'Canvas', what:'פעילות קטנה לכיתה', link:'gemini', prompt:'canvasTool'},
      {name:'Vids', what:'סרטון של 10 שניות לפתיחת שיעור', link:'vids', prompt:'vids'}],
    footK:'בחדר: בונים, מנסים בטלפון, ומדביקים את הקישור בדף המלווה.'},
  {k:'staff', t:'kh', ref:'staff', title:'המצגת לחדר המורים', sub:'13 שקפים, ובהם שלושה סרטונים קצרים. פותחים מהקישור, כותבים את שם בית הספר, ומציגים.'},
  {k:'field', t:'kh', ref:'field', title:'משימת שטח', sub:'מציגים בחדר המורים, ומורה אחד/ת מנסה כלי אחד באותו שבוע.'},
  {k:'qa', t:'kh', title:'שאלות ותשובות', items:[
    ['קיבלתם רק קוד?','Canvas לא היה מסומן. מסמנים, ושולחים שוב.']]},
  {k:'end', t:'kh', ref:'feedback'}
];

const SESSION = {
  k:{ name:'כלים', date:'16.11', title:'כלי AI בחשבון משרד החינוך', tools:[['Gemini Pro','תכנון ומחוון'],['Canvas','פעילות לכיתה'],['Vids','סרטון בחינם']] },
  h:{ name:'הובלה', date:'18.11', title:'כלי AI בחשבון משרד החינוך', tools:[['Gemini Pro','תכנון הדרכה'],['Canvas','פעילות לכיתה'],['Vids','סרטון בחינם'],['AI Studio','שאלון ודשבורד לצוות']] }
};

function stepsFor(t){ return STEPS.filter(s => s.t.includes(t)); }
function stepNo(id, t){ return stepsFor(t).findIndex(s => s.id === id) + 1; }
