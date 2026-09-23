// בדיקות רינדור של visit.html — הרצה: node mefakeach/tests/visit.test.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const win = {
  sessionStorage: { getItem: () => null }, localStorage: { getItem: () => null, setItem() {} },
  location: { pathname: "/mefakeach/visit.html", search: "" },
  document: { addEventListener() {}, getElementById() { return null; }, querySelectorAll() { return []; } }
};
const ctx = vm.createContext({ window: win, document: win.document, console, JSON, Date, Promise, Object, String, Array, Number, URLSearchParams, fetch: () => Promise.resolve({ json: () => ({ ok: true }) }), setTimeout, clearTimeout });
vm.runInContext(fs.readFileSync(new URL("../app.js", import.meta.url), "utf8"), ctx);
const html = fs.readFileSync(new URL("../visit.html", import.meta.url), "utf8");
const page = html.match(/<script id="page">([\s\S]*?)<\/script>/);
assert.ok(page, 'visit.html חייב להכיל <script id="page">');
vm.runInContext(page[1], ctx);
const VISIT = ctx.window.VISIT;
let n = 0;
const t = (name, fn) => { try { fn(); n++; console.log("  ✓ " + name); } catch (e) { console.log("  ✗ " + name + "\n      " + String(e.message).split("\n")[0]); process.exitCode = 1; } };

t("listHtml: ביקור פתוח מציג 'המשך', סגור בלי דוח 'לדוח', מאושר 'דוח מאושר'", () => {
  const h = VISIT.listHtml([{ id: "V1", school_name: "אורט אורמת", date: "2026-09-23", status: "open" }, { id: "V2", school_name: "עמל אשדוד", date: "2026-09-18", status: "closed", hasReport: false, reportId: "R2", reportStatus: "draft" }, { id: "V3", school_name: "דן גורמה", date: "2026-09-09", status: "closed", hasReport: true, reportId: "R3", reportStatus: "approved" }]);
  assert.match(h, /המשך הביקור/); assert.match(h, /השלמת הדוח/); assert.match(h, /דוח מאושר/); assert.doesNotMatch(h, /<script/);
  assert.match(h, /report\.html\?id=R3/); assert.match(h, /report\.html\?visit=V2/); assert.match(h, /visit\.html\?id=V1&mode=q/);
});
t("listHtml ריק — הודעה", () => { assert.match(VISIT.listHtml([]), /עדיין אין ביקורים/); });
t("openFormHtml: בית ספר נבחר מראש, 7 בעלי תפקידים כתיבות סימון, תאריך היום", () => {
  const h = VISIT.openFormHtml([{ id: "1", name: "א" }, { id: "2", name: 'קמ"ג' }], "2", ["מנהל/ת", "רכז/ת פדגוגי/ת"]);
  assert.match(h, /value="2" selected/); assert.match(h, /קמ&quot;ג/); assert.equal((h.match(/type="checkbox"/g) || []).length, 2); assert.match(h, /type="date"/);
});
t("prepHtml: שלושה מקורות; מקור ריק לא מוצג", () => {
  const h = VISIT.prepHtml({ prep: { lastReport: { date: "2026-08-07", recommendations: ["המלצה א"], clarify: ["מצבת"] }, openTasks: [], newDocs: [{ id: "D1", title: "תוכנית", uploaded_at: "2026-09-20" }] } });
  assert.match(h, /המלצה א/); assert.match(h, /לבירור: מצבת/); assert.doesNotMatch(h, /פתוח מול בית הספר/); assert.match(h, /תוכנית/);
});
t("prepHtml בלי כלום — הודעה 'אין עדיין'", () => { assert.match(VISIT.prepHtml({ prep: { lastReport: null, openTasks: [], newDocs: [] } }), /אין עדיין דוח קודם/); });
t("questionsHtml: מסננים תקופה ותפקיד; תשובה קיימת ומצב מסומן; שאלה שלי מסומנת", () => {
  const qs = [{ id: "Q1", topic: "השתלמות", role: "רכז/ת פדגוגי/ת", text: "שאלה 1", months: "" }, { id: "Q2", topic: "פתיחה", role: "מנהל/ת", text: "שאלה 2", months: "9,10", mine: true }];
  const h = VISIT.questionsHtml(qs, [{ question_id: "Q1", answer: "יש", state: "clarify" }], { role: "", month: 9 });
  assert.match(h, /value="יש"/); assert.match(h, /data-state="clarify"[^>]*class="[^"]*on/); assert.match(h, /שלי/);
  const only = VISIT.questionsHtml(qs, [], { role: "מנהל/ת", month: 9 }); assert.doesNotMatch(only, /שאלה 1/); assert.match(only, /שאלה 2/);
  const nov = VISIT.questionsHtml(qs, [], { role: "", month: 11 }); assert.match(nov, /שאלה 1/); assert.doesNotMatch(nov, /שאלה 2/);
  const all = VISIT.questionsHtml(qs, [], { role: "", month: 11, all: true }); assert.match(all, /שאלה 2/);
  const found = VISIT.questionsHtml(qs, [], { role: "", month: 9, q: "פתיחה" }); assert.doesNotMatch(found, /שאלה 1/); assert.match(found, /שאלה 2/);
});
t("questionsHtml ריק — הודעה", () => { assert.match(VISIT.questionsHtml([], [], { role: "מת\"לית", month: 9 }), /אין שאלות/); });
t("roleNoteHtml: שדה הערה לבעל תפקיד רק כשמסנן תפקיד פעיל", () => {
  assert.match(VISIT.roleNoteHtml("מנהל/ת", { "מנהל/ת": "הערה א" }, false), /הערה א/);
  assert.match(VISIT.roleNoteHtml("מנהל/ת", {}, true), /readonly/);
  assert.equal(VISIT.roleNoteHtml("", {}, false), "");
});
t("הדף כולל noindex, auth.js במרחב pikuah, queue.js וקרדיט impactos", () => {
  assert.match(html, /name="robots" content="noindex/); assert.match(html, /pedagogiamh\.co\.il\/auth\.js" data-space="pikuah"/); assert.match(html, /queue\.js/); assert.match(html, /impact-os\.app/);
});
t("סקירה: mergeAnswers — פריט מהתור גובר על תשובת השרת לאותה שאלה", () => {
  const m = VISIT.mergeAnswers([{ question_id: "Q1", role: "מנהל/ת", answer: "ישן", state: "answered" }, { question_id: "Q2", role: "מנהל/ת", answer: "ב", state: "" }], [{ k: "Q1", question_id: "Q1", role: "מנהל/ת", answer: "חדש", state: "clarify" }, { k: "Q3", question_id: "Q3", role: "מת\"לית", answer: "ג", state: "answered" }]);
  assert.equal(m.Q1.answer, "חדש"); assert.equal(m.Q1.state, "clarify"); assert.equal(m.Q2.answer, "ב"); assert.equal(m.Q3.answer, "ג"); assert.equal(m.Q1.k, "Q1");
});
console.log(`\n${n} עברו`);
