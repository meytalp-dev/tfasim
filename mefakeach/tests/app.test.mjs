// בדיקות לפונקציות הטהורות של app.js — הרצה: node mefakeach/tests/app.test.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const store = {}, local = {};
const win = {
  sessionStorage: { getItem: k => store[k] ?? null },
  localStorage: { getItem: k => local[k] ?? null, setItem: (k, v) => { local[k] = String(v); } },
  location: { pathname: "/mefakeach/schools.html" },
  document: { addEventListener() {}, getElementById() { return null; } }
};
const ctx = vm.createContext({ window: win, document: win.document, console, JSON, Date, Promise, Object, String, fetch: () => Promise.resolve({ json: () => ({ ok: true }) }), setTimeout, clearTimeout });
vm.runInContext(fs.readFileSync(new URL("../app.js", import.meta.url), "utf8"), ctx);
const MEF = ctx.window.MEF;
let n = 0;
const t = (name, fn) => { try { fn(); n++; console.log("  ✓ " + name); } catch (e) { console.log("  ✗ " + name + "\n      " + String(e.message).split("\n")[0]); process.exitCode = 1; } };

t("token() ריק כשאין סשן, ומחזיר את הטוקן כשיש", () => {
  assert.equal(MEF.token(), "");
  store.pmh_auth = JSON.stringify({ token: "abc", exp: Date.now() + 1e6, spaces: ["pikuah"] });
  assert.equal(MEF.token(), "abc");
});
t("סשן שפג — token ריק", () => { store.pmh_auth = JSON.stringify({ token: "abc", exp: 1 }); assert.equal(MEF.token(), ""); });
t("escapeHtml מטפל בגרשיים ולוכסן", () => { assert.equal(MEF.escapeHtml('קמ"ג <b> ת\\"א'), 'קמ&quot;ג &lt;b&gt; ת\\&quot;א'); });
t("fmtDate: ISO → יום.חודש.שנה", () => { assert.equal(MEF.fmtDate("2026-09-23T10:00:00.000Z"), "23.9.2026"); assert.equal(MEF.fmtDate(""), ""); });
t("statusTag מחזיר מחלקה לפי kind", () => { assert.match(MEF.statusTag({ kind: "bad", text: "1 באיחור" }), /class="tag bad"/); });
t("בורר בית ספר נשמר ב-localStorage", () => { MEF.setPicked("45005"); assert.equal(MEF.pickedSchool(), "45005"); MEF.setPicked(""); assert.equal(MEF.pickedSchool(), ""); });
t("sessionExpired מצייר לתוך #app כשעוד אין #main (לפני shell)", () => {
  const app = { innerHTML: "טוען…" };
  win.document.getElementById = id => (id === "app" ? app : null);
  MEF.sessionExpired();
  assert.match(app.innerHTML, /כניסה מחדש/);
  win.document.getElementById = () => null;
});
console.log(`\n${n} עברו`);
