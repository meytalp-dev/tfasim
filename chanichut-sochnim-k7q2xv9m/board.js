/* לוח סוכן העל. רק סוכן העל כותב כאן. כל סוכן כותב רק ל-reports/<id>.js שלו. בלי נתונים אישיים. */
window.BOARD = {
  updated: '2026-11-03T03:40:00+02:00',
  waiting: [
    'הפיילוט: להעלות את עתיד בת עמי ובית חנינה בנים בכלי ההכנה ולשלוח את הקודים למנהלים.',
    'רמת דוד: האם יש רכז.ת?',
    'להעביר את נספח בעלי התפקידים מחשבון בית הערבה ל-merhav לפני 12.11.'
  ],
  stages: [
    { id: 's0', name: '0 · תנאי פתיחה' },
    { id: 's1', name: '1 · בסיס' },
    { id: 's2', name: '2 · בנייה: שרת וכניסות' },
    { id: 's3', name: '3 · בנייה: מסכים, מבטים וניהול' },
    { id: 's4', name: '4 · קבצים ואוטומציות' },
    { id: 's5', name: '5 · בדיקה מלאה, פריסה ופיילוט' }
  ],
  agents: [
    { id: 'super', name: 'סוכן העל', role: 'מחלק משימות, בודק עבודה, מעדכן את הלוח ופורס אחרי אישור', status: 'doing', now: 'מרכז את גל 3: קבצים, עדכון רשימה, מנטור.ית וניקוי', files: ['sochnim/board.js', 'sochnim/index.html', 'sochnim/CONTRACT.md', 'sochnim/publish.cjs'] },
    { id: 'map', name: 'מיפוי', role: 'רשימת הפערים בין המוקאפ ל-v2 (קריאה בלבד)', status: 'done', files: ['sochnim/gaps.md'] },
    { id: 'server', name: 'שרת ונתונים', role: 'פעולות שרת, ספירה ארצית בלי שמות, אחסון ועומס', status: 'review', files: ['gas/קוד.js', 'gas/היקף.js', 'gas/appsscript.json', 'api.js', 'store.js', 'tests/server/'] },
    { id: 'gate', name: 'כניסות', role: 'כל התפקידים, טעינת הרשאות מראש ומבטים כמו במנור', status: 'done', files: ['gate.js', 'tests/gate/', 'sochnim/roles-views.md'] },
    { id: 'school', name: 'מסכי בית ספר', role: 'השלמת הפערים מול המוקאפ במסכי בית הספר', status: 'doing', files: ['app.js', 'index.html', 'tests/school/'] },
    { id: 'national', name: 'מבט ארצי ומבטי פיקוח', role: 'מסך ראשי, קטגוריות, חודשים, מבט מפקח.ת פדגוגי.ת ומקצועי.ת', status: 'done', files: ['national.js', 'national.css', 'megamot.js', 'tests/national/'] },
    { id: 'admin', name: 'ניהול בתי ספר', role: 'מי רשום, מי הופעל, מי דיווח, הזמנות', status: 'done', files: ['schools-admin.js', 'tests/admin/'] },
    { id: 'files', name: 'טעינת קבצים', role: 'כלי ההכנה לכל בתי הספר, נקודת פתיחה מספטמבר, עדכון במהלך השנה', status: 'doing', files: ['hachana/hachana.html', 'hachana/megamot-codes.js', 'hachana/anashim.html', 'tests/files/'] },
    { id: 'auto', name: 'אוטומציות', role: 'קישור למנטור.ית והעוזר', status: 'doing', files: ['mentor.html', 'mentor.js', 'gas/מנטור.js', 'sochnim/mentor-api.md', 'tests/auto/'] },
    { id: 'qa', name: 'בדיקות ואבטחה', role: 'בדיקות קצה, נייד, דליפת שמות ועומס. לא עורך קוד מערכת', status: 'todo', files: ['tests/'] }
  ],
  tasks: [
    { id: 'a1', stage: 's0', agent: 'super', status: 'done', title: 'השרת האמיתי עונה', note: 'נבדק ב-/exec' },
    { id: 'a2', stage: 's0', agent: 'super', status: 'done', title: 'אשף המעסיקים ומאגר סולם כבר בגרסה @3', note: 'נפרס בסשן מקביל, השינויים של הטעינה מראש נשמרו' },
    { id: 'a3', stage: 's0', agent: 'super', status: 'done', title: 'שורת כניסה למנהל.ת המערכת בשרת', note: 'השורה קיימת בשרת' },
    { id: 'a4', stage: 's0', agent: 'super', status: 'done', title: 'בדיקת כניסה מול השרת האמיתי', note: 'כולל זרימה מלאה עם בית ספר בדוי ב-@4: טעינה, הפעלה, פענוח, שמירה, ספירה' },
    { id: 'a5', stage: 's0', agent: 'super', status: 'todo', title: 'פיילוט: העלאת שלושת בתי הספר ושליחת קודים', note: 'הבדיקה מול השרת החי עברה. מיטל מעלה את בת עמי ובית חנינה בכלי ההכנה' },

    { id: 'b1', stage: 's1', agent: 'super', status: 'done', title: 'דף ניהול הסוכנים' },
    { id: 'b2', stage: 's1', agent: 'super', status: 'done', title: 'ניהול גרסאות מקומי ל-v2' },
    { id: 'b3', stage: 's1', agent: 'map', status: 'done', title: 'מיפוי פערים: מוקאפ מול v2, מסך מסך', note: '47 פערים: 5 גדולים, 20 בינוניים, 22 קטנים' },
    { id: 'b4', stage: 's1', agent: 'server', status: 'done', title: 'בדיקת אחסון ועומס ל-5,111 תלמידים' },
    { id: 'b5', stage: 's1', agent: 'gate', status: 'done', title: 'איך המבטים בנויים במנור, ומה יהיה כאן לכל תפקיד' },
    { id: 'b6', stage: 's1', agent: 'gate', status: 'done', title: 'מקור הרכזים והמנהלים לטעינה מראש' },
    { id: 'b7', stage: 's1', agent: 'super', status: 'done', title: 'מסמך הגדרות משותף: פעולות שרת ושדות' },

    { id: 'c0', stage: 's2', agent: 'server', status: 'done', title: 'קובץ ונעילה לכל בית ספר, ותיקון תקלות השמירה והתזכורות' },
    { id: 'c1', stage: 's2', agent: 'server', status: 'done', title: 'ספירה ארצית ממה שהמערכת מכילה, בלי שמות' },
    { id: 'c2', stage: 's2', agent: 'server', status: 'done', title: 'תמונת מצב חודשית, ו"טרם דיווח" במקום 0%' },
    { id: 'c3', stage: 's2', agent: 'server', status: 'done', title: 'הרשאות לפי תפקיד בכל פעולת שרת' },
    { id: 'c4', stage: 's2', agent: 'gate', status: 'done', title: 'כניסה לכל התפקידים' },
    { id: 'c5', stage: 's2', agent: 'gate', status: 'done', title: 'טעינת רכזים ומנהלים מראש, בלי אישור ידני' },
    { id: 'c6', stage: 's2', agent: 'server', status: 'done', title: 'מיילים גלויים ל-system במסך בתי הספר, לכפתור מייל' },
    { id: 'c7', stage: 's4', agent: 'server', status: 'review', title: 'פעולת ניקוי לבית ספר בדוי: שורות בקובץ הבקרה וקובץ הדרייב' },
    { id: 'c8', stage: 's4', agent: 'server', status: 'review', title: 'עדכון רשימה במהלך השנה: פעולות שרת' },
    { id: 'c9', stage: 's4', agent: 'server', status: 'review', title: 'ניתוב פעולות המנטור.ית בשרת ובמדומה' },

    { id: 'd1', stage: 's3', agent: 'school', status: 'done', title: 'השלמת פערים במסכי בית הספר' },
    { id: 'd2', stage: 's3', agent: 'national', status: 'done', title: 'מבט ארצי: מסך ראשי, קטגוריות וחודשים' },
    { id: 'd3', stage: 's3', agent: 'national', status: 'done', title: 'מבט מפקח.ת פדגוגי.ת' },
    { id: 'd4', stage: 's3', agent: 'national', status: 'done', title: 'מבט מפקח.ת מקצועי.ת' },
    { id: 'd5', stage: 's3', agent: 'admin', status: 'done', title: 'מסך ניהול בתי הספר: מי רשום, הופעל ודיווח' },
    { id: 'd6', stage: 's3', agent: 'admin', status: 'done', title: 'רשימת "מי טרם" עם העתקה ומייל' },

    { id: 'e1', stage: 's4', agent: 'files', status: 'doing', title: 'כלי ההכנה לכל 61 בתי הספר' },
    { id: 'e2', stage: 's4', agent: 'files', status: 'doing', title: 'מסוכמי ספטמבר כנקודת פתיחה' },
    { id: 'e3', stage: 's4', agent: 'files', status: 'doing', title: 'עדכון רשימה במהלך השנה, בלי לדרוס' },
    { id: 'd7', stage: 's4', agent: 'school', status: 'doing', title: 'מיזוג רשימה מעודכנת במסך התלמידים, וכפתור קישור למנטור.ית' },
    { id: 'e4', stage: 's4', agent: 'auto', status: 'doing', title: 'קישור למנטור.ית' },
    { id: 'e5', stage: 's4', agent: 'school', status: 'doing', title: 'העוזר' },

    { id: 'f1', stage: 's5', agent: 'qa', status: 'todo', title: 'בדיקת קצה לכל תפקיד' },
    { id: 'f2', stage: 's5', agent: 'qa', status: 'todo', title: 'בדיקת דליפת שמות ואבטחה' },
    { id: 'f3', stage: 's5', agent: 'qa', status: 'todo', title: 'נייד: iPhone, Pixel ומחשב' },
    { id: 'f4', stage: 's5', agent: 'super', status: 'todo', title: 'פריסה, אחרי "כן" שלך' }
  ]
};
