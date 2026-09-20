/* מסך אלנט — משימה 8 באפיון (סעיפים 3.3 ו-5.3).
 *
 * שתי דרכי כניסה, ושתיהן מזוהות:
 *   שני  — אסימון של שער ההרשאות של המרחב הפדגוגי (מרחב tikshuv).
 *          האסימון יושב ב-sessionStorage תחת pmh_auth, נוצר ע"י auth.js של
 *          האתר, והשרת שלנו שולח אותו חזרה לשער ושואל מי זה. אין כאן סוד.
 *   מיטל — מפתח הניהול, כמו במסך "היום".
 *
 * אין בקובץ הזה שם, בית ספר, מייל, סף או מפתח. הכול מהשרת.
 * גם הסף לא: הוא מגיע ב-rules בכל טעינה, ולכן שינוי שלו בגיליון משנה
 * את המסך הזה בלי לגעת בקוד.
 */

(function (w, d) {
  "use strict";

  var API = "https://script.google.com/macros/s/AKfycbz1QHFO-kku43XIVJCuYLAvL3pARvdKeUYbIsBq-A8gKrVlsnAhGf0WUGIlAzeCgtBy/exec";
  var GATE_STORE = "pmh_auth";        /* המפתח שבו auth.js של האתר שומר את הסשן */
  var KEY_STORE = "shag.teamkey";     /* מפתח הניהול, משותף עם מסך "היום" */
  var SPACES = ["tikshuv", "all"];

  var E = {
    key: "",        /* מפתח הניהול, אם מיטל */
    token: "",      /* אסימון השער, אם שני */
    level: "",      /* admin | elnet */
    data: null,     /* התשובה האחרונה של mode=elig */
    track: "",
    sessions: {},   /* מפגשים לפי מסלול, מ-mode=content */
    sync: null,     /* התצוגה המקדימה האחרונה */
    busy: false
  };

  function el(id) { return d.getElementById(id); }
  function esc(s) {
    return String(s === null || s === undefined ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function icon(id, size) {
    return '<svg class="ico" width="' + (size || 18) + '" height="' + (size || 18) + '" fill="none" ' +
      'stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" ' +
      'aria-hidden="true"><use href="#' + id + '"/></svg>';
  }

  /* ---------------------------- הרשת ---------------------------- */

  function qs(obj) {
    var out = [];
    for (var k in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] !== "" && obj[k] !== undefined) {
        out.push(encodeURIComponent(k) + "=" + encodeURIComponent(obj[k]));
      }
    }
    return out.join("&");
  }

  /* שלושה ניסיונות: Apps Script מחזיר 302 זמני שנראה כמו תקלה ואינו כזו */
  function getJson(params, tries) {
    var n = tries === undefined ? 3 : tries;
    return fetch(API + "?" + qs(params) + "&_=" + Date.now(), { method: "GET" })
      .then(function (r) { return r.json(); })
      .catch(function (e) {
        if (n > 1) return getJson(params, n - 1);
        throw e;
      });
  }

  function post(body) {
    return fetch(API, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body)
    }).then(function (r) { return r.json(); });
  }

  function auth() {
    return E.key ? { key: E.key } : { t: E.token };
  }

  /* ---------------------------- זיהוי ---------------------------- */

  /* הסשן של שער ההרשאות. אם אין, או שאין בו את המרחב שלנו, מחזיר "". */
  function gateToken() {
    var s = null;
    try { s = JSON.parse(w.sessionStorage.getItem(GATE_STORE) || "null"); } catch (e) { return ""; }
    if (!s || !s.token || !s.exp || s.exp < Date.now()) return "";
    var spaces = s.spaces || [];
    if (typeof spaces === "string") spaces = spaces.split(/[,\s|]+/);
    for (var i = 0; i < spaces.length; i++) {
      if (SPACES.indexOf(String(spaces[i])) > -1) return s.token;
    }
    return "";
  }

  function gateUser() {
    try {
      var s = JSON.parse(w.sessionStorage.getItem(GATE_STORE) || "null");
      return s && s.email ? (s.name || s.email) : "";
    } catch (e) { return ""; }
  }

  /* המפתח עשוי להגיע כקישור מלא, עם # או לבדו — אותה לוגיקה כמו team.html */
  function keyFrom(text) {
    var t = String(text || "").trim();
    var m = t.match(/[?&#](?:key|k)=(adm-[0-9a-z-]{8,64})/i) || t.match(/^(adm-[0-9a-z-]{8,64})$/i);
    return m ? m[1] : "";
  }

  function keyGet() {
    try { return w.localStorage.getItem(KEY_STORE) || ""; } catch (e) { return ""; }
  }

  function keySet(k) {
    try { w.localStorage.setItem(KEY_STORE, k); } catch (e) { /* גלישה פרטית */ }
  }

  /* ---------------------------- הצגה ---------------------------- */

  function ruleText(r) {
    var parts = [];
    parts.push("נוכחות ב-" + r.minSessions + " מפגשים לפחות");
    parts.push("הגשת " + r.minUnits + " יחידות א-סינכרוניות");
    if (r.needMicro) parts.push("העברת מיקרו-הדרכה אחת לצוות בית הספר");
    parts.push("מטלה מסכמת בציון " + r.passScore + " ומעלה");
    return parts.join(" · ") + ".";
  }

  function stClass(s) {
    if (s === "עומד/ת בתנאים") return "ok";
    if (s === "לא עומד/ת בתנאים") return "bad";
    if (s === "בסיכון") return "risk";
    return "";
  }

  function yesNo(v) {
    return v ? '<span class="st ok">' + icon("e-check", 15) + "</span>" : '<span class="miss">—</span>';
  }

  function trackData() {
    if (!E.data) return null;
    for (var i = 0; i < E.data.tracks.length; i++) {
      if (E.data.tracks[i].track === E.track) return E.data.tracks[i];
    }
    return E.data.tracks[0] || null;
  }

  function renderTabs() {
    var box = el("e-tracks");
    if (!E.data) return;
    var html = [];
    for (var i = 0; i < E.data.tracks.length; i++) {
      var t = E.data.tracks[i];
      html.push('<button type="button" role="tab" data-track="' + esc(t.track) + '" ' +
        'aria-selected="' + (t.track === E.track ? "true" : "false") + '">' +
        esc(t.track) + "</button>");
    }
    box.innerHTML = html.join("");
  }

  function renderTable() {
    var t = trackData();
    if (!t) return;
    el("e-table-h").textContent = "טבלת הזכאות · מסלול " + t.track;
    el("e-sum").textContent =
      "עומדים בתנאים " + t.counts.ok + " · בתהליך " + t.counts.wip +
      " · בסיכון " + t.counts.risk + " · לא עומדים " + t.counts.fail +
      " · סך הכול " + t.people;

    var rows = [];
    for (var i = 0; i < t.rows.length; i++) {
      var r = t.rows[i];
      rows.push("<tr>" +
        '<td class="name">' + esc(r.name) + "</td>" +
        '<td class="school">' + esc(r.school) + "</td>" +
        '<td class="mail">' + esc(r.mail) + "</td>" +
        '<td class="num">' + r.present + " מתוך " + t.sessionsHeld + "</td>" +
        '<td class="num">' + (r.absences || '<span class="miss">—</span>') + "</td>" +
        '<td class="num">' + r.units + "</td>" +
        "<td>" + yesNo(r.micro) + "</td>" +
        "<td>" + yesNo(r.task) + "</td>" +
        '<td class="num">' + (r.grade || '<span class="miss">—</span>') + "</td>" +
        '<td class="st ' + stClass(r.status) + '">' + esc(r.status) + "</td>" +
        "</tr>");
    }
    el("e-rows").innerHTML = rows.join("");
    el("e-empty").hidden = rows.length > 0;
  }

  function renderSessions() {
    var list = E.sessions[E.track] || [];
    var rows = [];
    for (var i = 0; i < list.length; i++) {
      var s = list[i];
      var state = s.state === "past" ? "התקיים" : s.state === "now" ? "היום" : "טרם התקיים";
      rows.push("<tr>" +
        '<td class="num">' + esc(s.num) + "</td>" +
        '<td class="name">' + esc(s.topic) + "</td>" +
        '<td class="num">' + esc(s.date) + "</td>" +
        "<td>" + esc(s.type) + "</td>" +
        "<td>" + state + "</td></tr>");
    }
    el("e-sessions").innerHTML = rows.join("") ||
      '<tr><td colspan="5" class="miss">התוכן עוד לא נטען.</td></tr>';
  }

  function renderSubs() {
    var box = el("e-subs-box");
    if (!E.data || !E.data.rules.seesSubmissions) { box.hidden = true; return; }
    box.hidden = false;
    el("e-subs-text").textContent =
      "צפייה בהגשות פתוחה במתג נפרד בהגדרות, ואפשר לכבות אותה בלי לפגוע " +
      "בשאר ההרשאות. תוכן ההגשות עצמו נבנה בשלב ב׳ של המודול.";
  }

  function render() {
    if (!E.data) return;
    el("e-rule").textContent = ruleText(E.data.rules);
    el("e-open").href = "https://docs.google.com/spreadsheets/d/" + E.data.elnetFile + "/edit";
    el("e-admin-tools").hidden = E.level !== "admin";
    el("e-who").textContent = E.level === "admin" ? "מיטל · ניהול" : (gateUser() || "אלנט");
    renderTabs();
    renderTable();
    renderSessions();
    renderSubs();
    el("e-body").hidden = false;
    el("e-gate").hidden = true;
  }

  /* ---------------------------- טעינה ---------------------------- */

  function load() {
    var p = auth();
    return getJson({ mode: "elig", key: p.key || "", t: p.t || "" }).then(function (r) {
      if (!r || r.ok !== true) {
        fail(r && r.error === "noaccess"
          ? "אין הרשאה למסך הזה. צריך להיכנס דרך שער ההרשאות עם הרשאה למרחב ההשתלמות."
          : "השרת החזיר שגיאה. כדאי לרענן.");
        return null;
      }
      E.data = r;
      E.level = r.level;
      if (!E.track && r.tracks.length) E.track = r.tracks[0].track;
      render();
      return loadSessions();
    }).catch(function () {
      fail("אין חיבור לשרת. כדאי לרענן.");
    });
  }

  function loadSessions() {
    if (E.sessions[E.track]) { renderSessions(); return; }
    /* mode=content דורש הזדהות מאז 20.9.26 — מפתח הניהול או אסימון השער */
    var q = auth();
    q.mode = "content"; q.what = "list"; q.track = E.track;
    return getJson(q).then(function (r) {
      E.sessions[E.track] = (r && r.ok && r.sessions) ? r.sessions : [];
      renderSessions();
    }).catch(function () { /* התוכן אינו חוסם את הטבלה */ });
  }

  function fail(text) {
    el("e-gate").hidden = false;
    el("e-body").hidden = true;
    var box = el("e-gerr");
    box.hidden = false;
    box.textContent = text;
  }

  /* ---------------------------- סנכרון ---------------------------- */

  function syncPreview() {
    if (E.busy) return;
    E.busy = true;
    el("e-prev").disabled = true;
    post({ action: "elnetPreview", key: E.key }).then(function (r) {
      E.busy = false;
      el("e-prev").disabled = false;
      if (!r || r.ok !== true) { syncOut(syncErr(r)); return; }
      E.sync = r;
      syncOut(syncHtml(r));
      var b = el("e-apply");
      b.hidden = !r.token || r.nothingToWrite;
      b.innerHTML = icon("e-sync") + "כתיבה לקובץ · " + r.totals.cells + " תאים";
    }).catch(function () {
      E.busy = false;
      el("e-prev").disabled = false;
      syncOut('<p class="warn">אין חיבור לשרת.</p>');
    });
  }

  function syncApply() {
    if (E.busy || !E.sync || !E.sync.token) return;
    var t = E.sync.totals;
    if (!w.confirm("לכתוב לקובץ המשותף " + t.cells + " תאים ו-" + t.headers + " כותרות?\n" +
      "נכתבות רק עמודות 12 עד 23. פרטי המשתתפים בעמודות 1 עד 11 לא ייגעו.")) return;
    E.busy = true;
    el("e-apply").disabled = true;
    post({ action: "elnetApply", key: E.key, token: E.sync.token }).then(function (r) {
      E.busy = false;
      el("e-apply").disabled = false;
      if (!r || r.ok !== true) { syncOut(syncErr(r)); return; }
      el("e-apply").hidden = true;
      E.sync = null;
      syncOut("<h3>הסנכרון הסתיים</h3><ul>" +
        "<li>נכתבו " + r.written.cells + " תאים ו-" + r.written.headers + " כותרות.</li>" +
        "<li>" + (r.verified ? "השרת בדק אחרי הכתיבה ולא נשאר הפרש." :
          "נשארו " + r.leftAfter + " הפרשים. כדאי לעשות תצוגה מקדימה שוב.") + "</li></ul>");
      load();
    }).catch(function () {
      E.busy = false;
      el("e-apply").disabled = false;
      syncOut('<p class="warn">אין חיבור לשרת. לבדוק בקובץ לפני שמנסים שוב.</p>');
    });
  }

  function syncErr(r) {
    var msg = (r && r.message) || "השרת החזיר שגיאה.";
    return '<p class="warn">' + esc(msg) + "</p>";
  }

  function syncHtml(r) {
    var t = r.totals;
    var out = ["<h3>מה ייכתב לקובץ</h3><ul>"];
    out.push("<li>" + t.matched + " שורות בקובץ הותאמו למשתתפים לפי מייל.</li>");
    out.push("<li>" + t.cells + " תאי נוכחות, קישור וציון, ו-" + t.headers + " כותרות של תאריך וסוג מפגש.</li>");
    if (t.unmatchedFile) out.push('<li class="warn">' + t.unmatchedFile + " שורות בקובץ בלי התאמה במודול — לא ייכתבו.</li>");
    if (t.unmatchedModule) out.push('<li class="warn">' + t.unmatchedModule + " משתתפים במודול שאינם בקובץ — צריך להוסיף אותם לקובץ.</li>");
    if (t.duplicates) out.push('<li class="warn">' + t.duplicates + " מיילים כפולים — מדולגים.</li>");
    if (r.nothingToWrite) out.push("<li>אין שינוי לכתוב כרגע.</li>");
    out.push("</ul>");
    return out.join("");
  }

  function syncOut(html) {
    var box = el("e-syncout");
    box.hidden = false;
    box.innerHTML = html;
  }

  /* ---------------------------- ייצוא ---------------------------- */

  /* ייצוא של מה שמוצג, לא של הגיליון. נועד לדוח פנימי אצל אלנט. */
  function csv() {
    var t = trackData();
    if (!t) return;
    var head = ["שם", "בית ספר", "מייל", "נוכחות", "מתוך", "היעדרויות", "יחידות",
      "מיקרו-הדרכה", "מטלה מסכמת", "ציון", "סטטוס"];
    var lines = [head.join(",")];
    for (var i = 0; i < t.rows.length; i++) {
      var r = t.rows[i];
      lines.push([r.name, r.school, r.mail, r.present, t.sessionsHeld, r.absences, r.units,
        r.micro ? "כן" : "לא", r.task ? "כן" : "לא", r.grade, r.status]
        .map(function (v) { return '"' + String(v === undefined ? "" : v).replace(/"/g, '""') + '"'; })
        .join(","));
    }
    var blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    var a = d.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "זכאות-" + t.track + ".csv";
    d.body.appendChild(a);
    a.click();
    d.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }

  /* ---------------------------- הפעלה ---------------------------- */

  function start() {
    /* מפתח בכתובת: נשמר ונמחק מסרגל הכתובת, שלא יישאר בהיסטוריה */
    var fromUrl = keyFrom(w.location.href);
    if (fromUrl) {
      keySet(fromUrl);
      try { w.history.replaceState(null, "", w.location.pathname); } catch (e) { /* לא קריטי */ }
    }
    E.key = fromUrl || keyGet();
    E.token = E.key ? "" : gateToken();

    el("e-tracks").addEventListener("click", function (ev) {
      var b = ev.target.closest ? ev.target.closest("button[data-track]") : null;
      if (!b) return;
      E.track = b.getAttribute("data-track");
      renderTabs();
      renderTable();
      loadSessions();
    });
    el("e-prev").addEventListener("click", syncPreview);
    el("e-apply").addEventListener("click", syncApply);
    el("e-csv").addEventListener("click", csv);
    el("e-keyGo").addEventListener("click", function () {
      var k = keyFrom(el("e-keyin").value);
      if (!k) {
        el("e-gerr").hidden = false;
        el("e-gerr").textContent = "המפתח לא נראה תקין.";
        return;
      }
      keySet(k);
      E.key = k;
      E.token = "";
      el("e-gerr").hidden = true;
      load();
    });
    el("e-keyin").addEventListener("keydown", function (ev) {
      if (ev.key === "Enter") { ev.preventDefault(); el("e-keyGo").click(); }
    });

    if (!E.key && !E.token) {
      el("e-gate").hidden = false;
      return;
    }
    load();
  }

  w.SH_elnet = { start: start, state: function () { return E; } };
})(window, document);
