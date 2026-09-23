// בדיקות רינדור של report.html — הרצה: node mefakeach/tests/report.test.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const win = {
  sessionStorage: { getItem: () => null }, localStorage: { getItem: () => null, setItem() {} },
  location: { pathname: "/mefakeach/report.html", search: "" },
  document: { addEventListener() {}, getElementById() { return null; }, querySelectorAll() { return []; } }
};
const ctx = vm.createContext({ window: win, document: win.document, console, JSON, Date, Promise, Object, String, Array, Number, URLSearchParams, fetch: () => Promise.resolve({ json: () => ({ ok: true }) }), setTimeout, clearTimeout });
vm.runInContext(fs.readFileSync(new URL("../app.js", import.meta.url), "utf8"), ctx);
const html = fs.readFileSync(new URL("../report.html", import.meta.url), "utf8");
const page = html.match(/<script id="page">([\s\S]*?)<\/script>/);
assert.ok(page, 'report.html חייב להכיל <script id="page">');
vm.runInContext(page[1], ctx);
const REPORT = ctx.window.REPORT;
let n = 0;
const t = (name, fn) => { try { fn(); n++; console.log("  ✓ " + name); } catch (e) { console.log("  ✗ " + name + "\n      " + String(e.message).split("\n")[0]); process.exitCode = 1; } };

t("formHtml: 4 חלקים, sec3 ריק עם placeholder, דגלים ורמזור מקופלים, טיוטה עם 'אשר דוח'", () => {
  const h = REPORT.formHtml({ id: "R1", status: "draft", version: 1, sec1: "א", sec2: "## חניכות\nש: ת", sec3: "", sec4: "להמשך בירור: x", national_flags: [], traffic: {} }, { school_name: 'קמ"ג', date: "2026-09-23" }, false);
  assert.match(h, /1 · פרטי הביקור/); assert.match(h, /שיקול הדעת שלך/); assert.match(h, /יש סוגיה לעדכון המפקחת הארצית/); assert.match(h, /אשר דוח/); assert.match(h, /קמ&quot;ג/); assert.doesNotMatch(h, /<script/);
  assert.doesNotMatch(h, /<details[^>]*open/, "דגלים ורמזור מקופלים כשריקים"); assert.doesNotMatch(h, /readonly/);
});
t("formHtml מאושר: שדות קריאה בלבד, כפתורי העתקה/הורדה/שפר ניסוח/תיקון", () => {
  const h = REPORT.formHtml({ id: "R1", status: "approved", version: 2, sec1: "א", sec2: "", sec3: "ב", sec4: "", national_flags: ["מוגנות"], traffic: { "אקלים": "green" } }, { school_name: "א", date: "2026-09-23" }, true);
  assert.match(h, /readonly/); assert.match(h, /העתקה/); assert.match(h, /הורדה/); assert.match(h, /שפר ניסוח/); assert.match(h, /תיקון/); assert.match(h, /גרסה 2/); assert.doesNotMatch(h, /אשר דוח/);
  assert.match(h, /value="מוגנות" checked/); assert.match(h, /value="green" selected/);
});
t("formHtml טיוטה של עמית (readOnly בלי approved) — בלי תיקון ובלי אשר דוח", () => {
  const h = REPORT.formHtml({ id: "R1", status: "draft", version: 1, sec1: "", sec2: "", sec3: "", sec4: "", national_flags: [], traffic: {} }, { school_name: "א", date: "2026-09-23" }, true);
  assert.doesNotMatch(h, /תיקון/); assert.doesNotMatch(h, /אשר דוח/); assert.match(h, /readonly/);
});
t("chatText מכיל את האיסור להוסיף ממצאים ואת הטקסט", () => { const c = REPORT.chatText("טקסט הדוח"); assert.match(c, /אל תמציא/); assert.match(c, /טקסט הדוח/); assert.match(c, /שפר ניסוח/); });
t("listHtml: טיוטה ומאושר", () => { const h = REPORT.listHtml([{ id: "R1", school_name: "א", date: "2026-09-23", status: "draft", version: 1 }, { id: "R2", school_name: "ב", date: "2026-09-01", status: "approved", version: 1 }]); assert.match(h, /טיוטה/); assert.match(h, /מאושר/); assert.match(h, /report\.html\?id=R2/); });
t("listHtml ריק — הודעה", () => { assert.match(REPORT.listHtml([]), /עדיין אין דוחות/); });
t("printHtml: מסמך להדפסה עם הטקסט מוברח", () => { const h = REPORT.printHtml("שורה <b>", "א", "2026-09-23"); assert.match(h, /dir="rtl"/); assert.match(h, /שורה &lt;b&gt;/); assert.doesNotMatch(h, /<b>/); });
t("הדף כולל noindex, auth.js במרחב pikuah וקרדיט impactos", () => {
  assert.match(html, /name="robots" content="noindex/); assert.match(html, /pedagogiamh\.co\.il\/auth\.js" data-space="pikuah"/); assert.match(html, /impact-os\.app/);
});
console.log(`\n${n} עברו`);
