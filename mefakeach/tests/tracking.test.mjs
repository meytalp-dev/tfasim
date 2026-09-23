// בדיקות רינדור של tracking.html — הרצה: node mefakeach/tests/tracking.test.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const win = {
  sessionStorage: { getItem: () => null }, localStorage: { getItem: () => null, setItem() {} },
  location: { pathname: "/mefakeach/tracking.html", search: "" },
  document: { addEventListener() {}, getElementById() { return null; }, querySelectorAll() { return []; } }
};
const ctx = vm.createContext({ window: win, document: win.document, console, JSON, Date, Promise, Object, String, Array, Number, URLSearchParams, fetch: () => Promise.resolve({ json: () => ({ ok: true }) }), setTimeout, clearTimeout });
vm.runInContext(fs.readFileSync(new URL("../app.js", import.meta.url), "utf8"), ctx);
const html = fs.readFileSync(new URL("../tracking.html", import.meta.url), "utf8");
const page = html.match(/<script id="page">([\s\S]*?)<\/script>/);
assert.ok(page, 'tracking.html חייב להכיל <script id="page">');
vm.runInContext(page[1], ctx);
const TRACK = ctx.window.TRACK;
let n = 0;
const t = (name, fn) => { try { fn(); n++; console.log("  ✓ " + name); } catch (e) { console.log("  ✗ " + name + "\n      " + String(e.message).split("\n")[0]); process.exitCode = 1; } };

const data = { schools: [{ id: "1", name: "החממה" }, { id: "2", name: "פלמחים" }, { id: "3", name: "אורמת" }], tasks: [
  { id: "T1", school_id: "1", title: "תוכנית תלת שנתית", owner_role: "רכז/ת פדגוגי/ת", due: "2026-10-15", status: "open", late: false, mine: true, source: "manual" },
  { id: "T2", school_id: "1", title: "ישן", due: "2026-09-01", status: "open", late: true, mine: true, source: "visit" },
  { id: "T3", school_id: "2", title: "בוצעה", due: "", status: "done", late: false, mine: true, source: "manual", done_at: "2026-09-20" }],
  hq: { forms: [{ id: "nispach", name: "נספח בעלי התפקידים", kind: "submission", deadline: "2026-09-20", available: true, submitted: ["3"], missing: ["1", "2"], unresolved: [], link_template: "https://pedagogiamh.co.il/nispach-baaley-tafkidim.html" }, { id: "x", name: "לא זמין", kind: "submission", available: false, submitted: [], missing: [], unresolved: [] }], approvals: [{ form_id: "hishtalmut", form_name: "השתלמות", school_id: "2", school_name: "פלמחים", title: "פדגוגיה דואלית", link: "https://pedagogiamh.co.il/ishur-hishtalmut.html?t=TOK" }] } };
const F = (o) => Object.assign({ school: "", late: false, done: false, today: "2026-09-23" }, o || {});
t("build: קבוצות לפי בית ספר עם פריטי משימה ומהמטה, מיון לפי איחור, בלי בתי ספר שקטים", () => {
  const b = TRACK.build(data, F());
  assert.equal(JSON.stringify(b.groups.map(g => g.name)), JSON.stringify(["החממה", "פלמחים"]));
  assert.equal(b.groups[0].items.length, 3); assert.equal(b.groups[0].items.filter(i => i.kind === "hq").length, 1); assert.equal(b.groups[0].late, 2, "ישן + נספח שעבר מועדו");
  assert.equal(b.groups[1].items.length, 1); assert.equal(b.groups[1].items[0].kind, "hq");
  assert.equal(b.totals.open, 4); assert.equal(b.totals.late, 3); assert.equal(b.totals.quiet, 1);
});
t("build: מסננים — רק באיחור, בוצעו, לפי בית ספר", () => {
  assert.equal(TRACK.build(data, F({ late: true })).totals.open, 3);
  const dn = TRACK.build(data, F({ done: true })); assert.equal(dn.groups.length, 1); assert.equal(dn.groups[0].items[0].id, "T3");
  assert.equal(TRACK.build(data, F({ school: "2" })).groups.length, 1);
});
t("schoolRowsHtml: משימה עם 'בוצע' ו'תזכורת'; פריט מהמטה עם 'תזכורת' ו'פרטים' ובלי 'בוצע'; לא שלי — בלי בוצע", () => {
  const b = TRACK.build(Object.assign({}, data, { tasks: data.tasks.concat([{ id: "T9", school_id: "1", title: "של עמיתה", due: "", status: "open", late: false, mine: false, source: "manual" }]) }), F());
  const h = TRACK.schoolRowsHtml(b.groups, {});
  const rowOf = id => { const i = h.indexOf('data-id="' + id + '"'); return h.substring(i, h.indexOf('<div class="task', i + 5) > -1 ? h.indexOf('<div class="task', i + 5) : h.length); };
  assert.match(rowOf("T1"), /data-act="done"/); assert.match(rowOf("T1"), /data-act="open"/);
  assert.match(rowOf("F:nispach:1"), /data-act="hqremind"/); assert.match(rowOf("F:nispach:1"), /data-act="open"/); assert.doesNotMatch(rowOf("F:nispach:1"), /data-act="done"/);
  assert.match(h, /מהמטה/); assert.match(h, /2 באיחור/); assert.doesNotMatch(h, /<script/);
  assert.doesNotMatch(rowOf("T9"), /data-act="done"/); assert.match(rowOf("T9"), /של עמית/);
});
t("schoolRowsHtml ריק — הודעה", () => { assert.match(TRACK.schoolRowsHtml([], {}), /לא חייב לך כלום/); });
t("formsHtml: X מתוך Y הגישו + מי טרם + לא זמין; missingText להעתקה", () => {
  const byId = { 1: "החממה", 2: "פלמחים", 3: "אורמת" };
  const h = TRACK.formsHtml(data.hq.forms, byId);
  assert.match(h, /1 מתוך 3 הגישו/); assert.match(h, /החממה/); assert.match(h, /לא זמין כרגע/);
  assert.equal(TRACK.missingText(data.hq.forms[0], byId), "נספח בעלי התפקידים — טרם הגישו (2): החממה, פלמחים");
});
t("approvalsHtml: כרטיס ממתין לאישור עם קישור; ריק — כלום", () => { assert.match(TRACK.approvalsHtml(data.hq.approvals), /ממתין לאישור שלך[\s\S]*פלמחים[\s\S]*ishur-hishtalmut\.html\?t=TOK/); assert.equal(TRACK.approvalsHtml([]), ""); });
t("drawerHtml: משימה עם אחראי, מועד, מתג תזכורת למנהל, הערה, מקור, היסטוריה, מחיקה; פריט מהמטה בלי מחיקה ועם קישור לטופס", () => {
  const b = TRACK.build(data, F());
  const task = b.groups[0].items.find(i => i.id === "T1"), hq = b.groups[0].items.find(i => i.kind === "hq");
  const h = TRACK.drawerHtml(task, { reminders: [{ to: "principal", sent_at: "2026-09-21T05:00:00Z", result: "sent" }], school: { principal_email: true } });
  assert.match(h, /name="notify"/); assert.match(h, /21\.9\.2026/); assert.match(h, /data-act="delete"/); assert.match(h, /מקור: ידני/); assert.match(h, /name="due" value="2026-10-15"/);
  const h2 = TRACK.drawerHtml(hq, {}); assert.doesNotMatch(h2, /data-act="delete"/); assert.match(h2, /ייסגר לבד/); assert.match(h2, /לטופס/);
});
t("drawerHtml: משימה של עמיתה — קריאה בלבד, בלי שמירה/מחיקה", () => {
  const h = TRACK.drawerHtml({ kind: "task", id: "T9", title: "x", owner_role: "", due: "", status: "open", mine: false, source: "manual", note: "", notify_principal: "" }, {});
  assert.doesNotMatch(h, /data-act="delete"/); assert.doesNotMatch(h, /type="submit"/); assert.match(h, /disabled/);
});
t("newTaskHtml: רב-בחירה של בתי ספר עם בחירה מראש, בעלי תפקידים, מועד, מתג מנהל; pasteHtml מציג כותרת ומועד שזוהו", () => {
  const h = TRACK.newTaskHtml(data.schools, ["מנהל/ת", "רכז/ת פדגוגי/ת"], "2");
  assert.match(h, /value="2" checked/); assert.equal((h.match(/name="school_ids"/g) || []).length, 3); assert.match(h, /name="notify_principal"/);
  const p = TRACK.pasteHtml(data.schools, { title: "נספח", due: "2026-09-20", body: "..." }); assert.match(p, /value="נספח"/); assert.match(p, /value="2026-09-20"/); assert.equal((p.match(/checked/g) || []).length, 3, "ברירת מחדל: כולם");
  assert.match(TRACK.pasteHtml(data.schools, null), /name="text"/);
});
t("הדף כולל noindex, auth.js במרחב pikuah וקרדיט", () => { assert.match(html, /noindex/); assert.match(html, /auth\.js" data-space="pikuah"/); assert.match(html, /impact-os\.app/); });
console.log(`\n${n} עברו`);
