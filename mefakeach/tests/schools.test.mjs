// בדיקות רינדור של schools.html — הרצה: node mefakeach/tests/schools.test.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const win = {
  sessionStorage: { getItem: () => null }, localStorage: { getItem: () => null, setItem() {} },
  location: { pathname: "/mefakeach/schools.html" },
  document: { addEventListener() {}, getElementById() { return null; }, querySelectorAll() { return []; } }
};
const ctx = vm.createContext({ window: win, document: win.document, console, JSON, Date, Promise, Object, String, Array, fetch: () => Promise.resolve({ json: () => ({ ok: true }) }), setTimeout, clearTimeout });
vm.runInContext(fs.readFileSync(new URL("../app.js", import.meta.url), "utf8"), ctx);
const html = fs.readFileSync(new URL("../schools.html", import.meta.url), "utf8");
const page = html.match(/<script id="page">([\s\S]*?)<\/script>/);
assert.ok(page, 'schools.html חייב להכיל <script id="page">');
vm.runInContext(page[1], ctx);
const SCHOOLS = ctx.window.SCHOOLS;
let n = 0;
const t = (name, fn) => { try { fn(); n++; console.log("  ✓ " + name); } catch (e) { console.log("  ✗ " + name + "\n      " + String(e.message).split("\n")[0]); process.exitCode = 1; } };

t("cardsHtml: שם עם גרשיים מוצג נכון ושורת מצב", () => {
  const out = SCHOOLS.cardsHtml([{ id: "82921", name: 'קמ"ג דימונה', city: "דימונה", net: "עמל", status: { kind: "gray", text: "טרם בוקר השנה" } }]);
  assert.match(out, /קמ&quot;ג דימונה/); assert.match(out, /טרם בוקר השנה/); assert.doesNotMatch(out, /<script/);
});
t("cardsHtml ריק — הודעה ולא שגיאה", () => { assert.match(SCHOOLS.cardsHtml([]), /לא משויכים לך בתי ספר/); });
t("fileHtml: לשונית מסמכים מציגה גרסה ישנה כגרסה קודמת", () => {
  const out = SCHOOLS.fileHtml({ id: "1", name: "א", principal_name: "ר", principal_phone: "050", principal_email: "r@x" },
    [{ id: "D1", title: "v1", type: "אחר", uploaded_at: "2026-09-01", superseded: true }, { id: "D2", title: "v2", type: "אחר", uploaded_at: "2026-09-02", replaces: "D1" }], "docs");
  assert.match(out, /v2/); assert.match(out, /גרסה קודמת/);
});
t("fileHtml: לשונית פרטים מציגה מנהל/ת עם נייד ומייל", () => {
  const out = SCHOOLS.fileHtml({ id: "1", name: "א", principal_name: "רונית", principal_phone: "050-1", principal_email: "r@x" }, [], "details");
  assert.match(out, /רונית/); assert.match(out, /tel:050-1/); assert.match(out, /mailto:r@x/);
});
t("fileHtml: קישורי המעקב בפרטים מסוננים לשם בית הספר (?q=), גם עם גרשיים", () => {
  const out = SCHOOLS.fileHtml({ id: "82921", name: 'קמ"ג דימונה' }, [], "details");
  assert.match(out, /sikum-nispach-tafkidim\.html\?q=%D7%A7%D7%9E%22%D7%92%20%D7%93%D7%99%D7%9E%D7%95%D7%A0%D7%94/);
  assert.match(out, /sikum-hishtalmuyot\.html\?q=/);
});
t("fileHtml: לשונית ביקורים ריקה מציגה 'עדיין אין ביקורים'", () => { assert.match(SCHOOLS.fileHtml({ id: "1", name: "א" }, [], "visits"), /עדיין אין ביקורים/); });
t("הדף כולל noindex, auth.js של האתר במרחב pikuah, וקרדיט impactos", () => {
  assert.match(html, /name="robots" content="noindex/); assert.match(html, /pedagogiamh\.co\.il\/auth\.js" data-space="pikuah"/); assert.match(html, /impact-os\.app/);
});
console.log(`\n${n} עברו`);
