// בדיקות לתור האופליין queue.js — הרצה: node mefakeach/tests/queue.test.mjs
import assert from "node:assert/strict"; import fs from "node:fs"; import vm from "node:vm";
const local = {}; const events = [];
const win = { localStorage: { getItem: k => local[k] ?? null, setItem: (k, v) => { local[k] = String(v); }, removeItem: k => { delete local[k]; } } };
const doc = { dispatchEvent: e => { events.push(e); return true; } };
const ctx = vm.createContext({ window: win, document: doc, JSON, Promise, Object, Array, CustomEvent: class { constructor(t, o) { this.type = t; this.detail = o && o.detail; } }, setTimeout, console });
vm.runInContext(fs.readFileSync(new URL("../queue.js", import.meta.url), "utf8"), ctx);
const MEFQ = ctx.window.MEFQ;
let n = 0; const t = async (name, fn) => { try { await fn(); n++; console.log("  ✓ " + name); } catch (e) { console.log("  ✗ " + name + "\n      " + e.message); process.exitCode = 1; } };
await t("push שולח מיד כשהשליחה מצליחה, והתור מתרוקן", async () => {
  const sent = []; const q = MEFQ.make("k1", items => { sent.push(items.slice()); return Promise.resolve(true); });
  await q.push({ k: "Q1", answer: "א" });
  assert.equal(sent.length, 1); assert.equal(q.size(), 0); assert.equal(q.pending(), false); assert.equal(local["mefakeach.q.k1"], undefined);
});
await t("כשהשליחה נכשלת הפריטים נשארים ב-localStorage ו-pending=true", async () => {
  const q = MEFQ.make("k2", () => Promise.resolve(false));
  await q.push({ k: "Q1", answer: "א" }); await q.push({ k: "Q2", answer: "ב" });
  assert.equal(q.size(), 2); assert.equal(q.pending(), true); assert.equal(JSON.parse(local["mefakeach.q.k2"]).length, 2);
});
await t("push לאותו k מאחד — השמירה האחרונה מנצחת", async () => {
  const q = MEFQ.make("k3", () => Promise.resolve(false));
  await q.push({ k: "Q1", answer: "א" }); await q.push({ k: "Q1", answer: "ב" });
  assert.equal(q.size(), 1); assert.equal(JSON.parse(local["mefakeach.q.k3"])[0].answer, "ב");
});
await t("תור שנשמר קודם נטען בטעינה הבאה ונשלח ב-flush", async () => {
  local["mefakeach.q.k4"] = JSON.stringify([{ k: "Q9", answer: "ישן" }]);
  const sent = []; const q = MEFQ.make("k4", items => { sent.push(items.slice()); return Promise.resolve(true); });
  assert.equal(q.size(), 1); await q.flush(); assert.equal(sent[0][0].answer, "ישן"); assert.equal(q.size(), 0);
});
await t("אירוע mefq:state נורה עם pending", async () => {
  events.length = 0; const q = MEFQ.make("k5", () => Promise.resolve(false)); await q.push({ k: "Q1" });
  assert.ok(events.some(e => e.type === "mefq:state" && e.detail.key === "k5" && e.detail.pending === true));
});
await t("שליחה שזורקת שגיאה (אין רשת) לא מאבדת פריטים", async () => {
  const q = MEFQ.make("k6", () => Promise.reject(new Error("offline")));
  await q.push({ k: "Q1", answer: "א" });
  assert.equal(q.size(), 1); assert.equal(q.pending(), true);
});
await t("push בזמן שליחה: הפריט החדש נשמר ונשלח בסבב הבא", async () => {
  let resolveFirst; const sent = [];
  const q = MEFQ.make("k7", items => { sent.push(items.map(i => i.k)); return new Promise(r => { if (!resolveFirst) resolveFirst = r; else r(true); }); });
  const p1 = q.push({ k: "Q1" }); await q.push({ k: "Q2" });
  assert.equal(q.size(), 2, "Q2 ממתין בזמן ש-Q1 בשליחה");
  resolveFirst(true); await p1; await q.flush();
  assert.equal(q.size(), 0); assert.deepEqual(sent, [["Q1"], ["Q2"]]);
});
await t("סקירה: פריט שנדחף בזמן שליחה נשלח לבד אחרי שהשליחה מסתיימת, בלי flush ידני", async () => {
  let resolveFirst; const sent = [];
  const q = MEFQ.make("k8", items => { sent.push(items.map(i => i.k)); return new Promise(r => { if (!resolveFirst) resolveFirst = r; else r(true); }); });
  const p1 = q.push({ k: "Q1" }); await q.push({ k: "Q2" });
  resolveFirst(true); await p1;
  assert.equal(q.size(), 0); assert.deepEqual(sent, [["Q1"], ["Q2"]]); assert.equal(q.pending(), false);
});
await t("סקירה: sender שמחזיר 'drop' (ביקור נעול) מנקה את התור ולא מנסה שוב", async () => {
  let calls = 0; const q = MEFQ.make("k9", () => { calls++; return Promise.resolve("drop"); });
  await q.push({ k: "Q1", answer: "א" });
  assert.equal(q.size(), 0); assert.equal(q.pending(), false); assert.equal(local["mefakeach.q.k9"], undefined);
  await q.flush(); assert.equal(calls, 1);
});
await t("סקירה: items() חושף את הפריטים הממתינים למיזוג אחרי רענון", async () => {
  local["mefakeach.q.k10"] = JSON.stringify([{ k: "Q9", answer: "ישן", state: "answered" }]);
  const q = MEFQ.make("k10", () => Promise.resolve(false));
  assert.deepEqual(q.items().map(i => i.k), ["Q9"]);
  q.items().push({ k: "X" }); assert.equal(q.size(), 1, "items() מחזיר עותק");
});
console.log(`\n${n} עברו`);
