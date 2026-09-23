/* הבית של המפקח — לקוח משותף.
   הדפים ב-tfasim/mefakeach/ טוענים אותו אחרי auth.js של האתר (data-space="pikuah").
   הטוקן נקרא מהסשן של auth.js (sessionStorage.pmh_auth) ונשלח לשרת בכל קריאה. */
(function (w, d) {
  "use strict";
  var EXEC = "https://script.google.com/macros/s/AKfycbxyhvbkVUtydT70TH5Q2fYXu-MpFfAv0qxX7K-RzsSvt7UWXoxwjHun1zwK6MJQj6_K/exec";
  var PICK_KEY = "mefakeach.school";

  function token() {
    try {
      var s = JSON.parse(w.sessionStorage.getItem("pmh_auth") || "null");
      if (!s || !s.token || !s.exp || s.exp < Date.now()) return "";
      return s.token;
    } catch (e) { return ""; }
  }
  /* אפס סקריפט נופל לפעמים ל-302→404 רגעי או לא עונה — פסק זמן 25ש' ושני ניסיונות חוזרים לפני "network" */
  var API_TIMEOUT = 25000, API_RETRIES = 2;
  function fetchOnce(payload) {
    var ctl = typeof AbortController !== "undefined" ? new AbortController() : null, timer = ctl && setTimeout(function () { ctl.abort(); }, API_TIMEOUT);
    return fetch(EXEC, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload), signal: ctl ? ctl.signal : undefined })
      .then(function (r) { return r.json(); }).finally(function () { if (timer) clearTimeout(timer); });
  }
  function api(action, body, _try) {
    var payload = Object.assign({ action: action, token: token() }, body || {}); _try = _try || 0;
    return fetchOnce(payload)
      .then(function (r) { if (r && r.error === "unauthorized") sessionExpired(); return r; })
      .catch(function () { if (_try < API_RETRIES) return api(action, body, _try + 1); return { ok: false, error: "network" }; });
  }
  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }
  function fmtDate(iso) {
    if (!iso) return "";
    var dt = new Date(iso);
    if (isNaN(dt)) return String(iso);
    return dt.getDate() + "." + (dt.getMonth() + 1) + "." + dt.getFullYear();
  }
  function statusTag(st) { if (!st) return ""; return '<span class="tag ' + escapeHtml(st.kind || "gray") + '">' + escapeHtml(st.text) + "</span>"; }
  function pickedSchool() { try { return w.localStorage.getItem(PICK_KEY) || ""; } catch (e) { return ""; } }
  function setPicked(id) { try { w.localStorage.setItem(PICK_KEY, id || ""); } catch (e) { /* ללא זיכרון — לא נורא */ } }
  function toast(msg) {
    var el = d.getElementById("toast"); if (!el) return;
    el.textContent = msg; el.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(function () { el.hidden = true; }, 2600);
  }
  /* לפני shell() עוד אין #main — אז מציירים לתוך #app, כדי שהמסך לא יישאר על "טוען…" */
  function sessionExpired() {
    var m = d.getElementById("main") || d.getElementById("app"); if (!m) return;
    m.innerHTML = '<div class="card" style="max-width:480px;margin:40px auto;text-align:center;grid-column:1/-1"><h3>הסשן פג</h3><p>כניסה מחדש ואז חוזרים לאותו מקום.</p><button class="btn p" onclick="location.reload()">כניסה מחדש</button></div>';
  }

  var NAV = [
    ["index.html", "על השולחן", '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'],
    ["schools.html", "בתי הספר שלי", '<path d="M4 21V8l8-5 8 5v13"/><path d="M9 21v-6h6v6"/>'],
    ["visit.html", "הביקור שלי", '<path d="M9 11l3 3 7-7"/><rect x="3" y="4" width="18" height="16" rx="3"/>'],
    ["report.html", "הדוח שלי", '<path d="M6 3h9l5 5v13H6z"/><path d="M14 3v6h6M9 13h7M9 17h7"/>'],
    ["tracking.html", "המעקב שלי", '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'],
    ["calendar.html", "היומן שלי", '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>']
  ];
  /* מצייר סרגל צד + אזור תוכן; מחזיר את אלמנט התוכן. דפים שעוד לא קיימים מסומנים "בקרוב". */
  function shell(opts) {
    opts = opts || {};
    var me = opts.me || {}; var initial = (me.name || "?").charAt(0);
    var available = opts.available || ["schools.html", "visit.html", "report.html", "tracking.html"];
    var links = NAV.map(function (n) {
      var here = w.location.pathname.indexOf(n[0]) > -1 || (n[0] === "index.html" && /\/mefakeach\/?$/.test(w.location.pathname));
      var soon = available.indexOf(n[0]) < 0;
      return '<a href="' + (soon ? "#" : n[0]) + '" class="' + (here ? "on" : "") + (soon ? " soon" : "") + '"><svg class="i" viewBox="0 0 24 24">' + n[2] + "</svg>" + n[1] + (soon ? '<span class="b">בקרוב</span>' : "") + "</a>";
    }).join("");
    d.getElementById("app").innerHTML =
      '<aside class="side"><div class="who"><div class="av">' + escapeHtml(initial) + "</div><div>" + escapeHtml(me.name || "") +
      "<small>" + escapeHtml(me.role === "מטה" ? "מטה" : "מפקח.ת פדגוגי.ת") + (opts.count != null ? " · " + opts.count + " בתי ספר" : "") + "</small></div></div>" +
      "<nav>" + links + '</nav><div class="foot"><a href="#" id="logout">יציאה</a></div></aside>' +
      '<div class="mainwrap"><div class="pick" id="pick"></div><div class="main" id="main"></div></div>';
    d.getElementById("logout").addEventListener("click", function (e) { e.preventDefault(); if (w.PMH_AUTH) w.PMH_AUTH.logout(); });
    return d.getElementById("main");
  }
  function picker(schools, onChange) {
    var cur = pickedSchool();
    if (!schools.some(function (s) { return String(s.id) === cur; })) cur = "";
    var el = d.getElementById("pick"); if (!el) return;
    el.innerHTML = '<label for="pickSel">בית ספר</label><select id="pickSel"><option value="">כל בתי הספר שלי</option>' +
      schools.map(function (s) { return '<option value="' + escapeHtml(s.id) + '"' + (String(s.id) === cur ? " selected" : "") + ">" + escapeHtml(s.name) + "</option>"; }).join("") + "</select>";
    d.getElementById("pickSel").addEventListener("change", function () { setPicked(this.value); onChange(this.value); });
  }

  w.MEF = { EXEC: EXEC, token: token, api: api, escapeHtml: escapeHtml, fmtDate: fmtDate, statusTag: statusTag, shell: shell, picker: picker, pickedSchool: pickedSchool, setPicked: setPicked, toast: toast, sessionExpired: sessionExpired };
})(window, document);
