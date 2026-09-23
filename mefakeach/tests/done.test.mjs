// בדיקות רינדור של done.html (דף המנהל) — הרצה: node mefakeach/tests/done.test.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const win = {
  sessionStorage: { getItem: () => null }, localStorage: { getItem: () => null, setItem() {} },
  location: { pathname: "/mefakeach/done.html", search: "?t=T1&k=abc" },
  document: { addEventListener() {}, getElementById() { return null; }, querySelectorAll() { return []; } }
};
const ctx = vm.createContext({ window: win, document: win.document, console, JSON, Date, Promise, Object, String, Array, Number, URLSearchParams, fetch: () => Promise.resolve({ json: () => ({ ok: true }) }), setTimeout, clearTimeout });
vm.runInContext(fs.readFileSync(new URL("../app.js", import.meta.url), "utf8"), ctx);
const html = fs.readFileSync(new URL("../done.html", import.meta.url), "utf8");
const page = html.match(/<script id="page">([\s\S]*?)<\/script>/);
assert.ok(page, 'done.html חייב להכיל <script id="page">');
vm.runInContext(page[1], ctx);
const DONE = ctx.window.DONE;
let n = 0;
const t = (name, fn) => { try { fn(); n++; console.log("  ✓ " + name); } catch (e) { console.log("  ✗ " + name + "\n      " + String(e.message).split("\n")[0]); process.exitCode = 1; } };

t("viewHtml: כותרת, בית ספר, מפקח.ת, מועד, כפתור בוצע, שדה קובץ; בלי מיילים/ניידים", () => {
  const h = DONE.viewHtml({ task: { id: "T1", title: "תוכנית תלת שנתית", owner_role: "רכז/ת פדגוגי/ת", due: "2026-10-15", status: "open", note: "" }, school_name: 'קמ"ג דימונה', sup_name: "סיגלית דאי" });
  assert.match(h, /תוכנית תלת שנתית/); assert.match(h, /קמ&quot;ג דימונה/); assert.match(h, /סיגלית דאי/); assert.match(h, /15\.10\.2026/); assert.match(h, /id="doneBtn"/); assert.match(h, /type="file"/); assert.doesNotMatch(h, /@/); assert.doesNotMatch(h, /<script/);
});
t("viewHtml על משימה שכבר בוצעה — 'כבר סומן' בלי כפתור", () => { const h = DONE.viewHtml({ task: { id: "T1", title: "x", status: "done", done_at: "2026-10-16T08:00:00Z" }, school_name: "א", sup_name: "ס" }); assert.match(h, /כבר סומן/); assert.doesNotMatch(h, /id="doneBtn"/); });
t("thanksHtml ו-invalidHtml", () => { assert.match(DONE.thanksHtml({ sup_name: "סיגלית" }), /תודה/); assert.match(DONE.invalidHtml(), /הקישור לא תקף/); });
t("הדף בלי auth.js, עם noindex וקרדיט", () => { assert.doesNotMatch(html, /auth\.js/); assert.match(html, /noindex/); assert.match(html, /impact-os\.app/); });
console.log(`\n${n} עברו`);
