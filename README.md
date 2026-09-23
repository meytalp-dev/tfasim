# tfasim — tfasim.pedagogiamh.co.il

טפסים, דפי מעקב ודוחות פנימיים של המנהיגות הפדגוגית היוצרת, שלא שייכים לאתר הציבורי pedagogiamh.co.il.

- כל דף עומד בפני עצמו, עם `noindex` וקרדיט impactos בתחתית.
- קבצים משותפים (analytics.js, auth.js וכו') נטענים בכתובת מלאה מ-https://pedagogiamh.co.il.
- דף שנעול ב-auth.js דורש להוסיף את `https://tfasim.pedagogiamh.co.il` ל-Authorized JavaScript origins ב-Google Cloud.
- הדומיין: רשומת CNAME `tfasim` → `meytalp-dev.github.io` ב-LiveDNS (mynames.co.il).
- `mefakeach/` — "הבית של המפקח": סביבת עבודה אישית למפקחים (נעול `pikuah`). הצד שרת והמפרט ב-`רויטל\הבית-של-המפקח\`. בדיקות: `node mefakeach/tests/app.test.mjs && node mefakeach/tests/schools.test.mjs`.
