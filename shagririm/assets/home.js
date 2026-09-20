/**
 * שגרירי חדשנות טכנולוגית — מודול הלמידה. מסך בית, מסך המסע ודף מפגש.
 * משימה 4 באפיון: רויטל\אפיון-מודול-שגרירי-חדשנות.md (סעיפים 3.1, 4.1, 4.2, 8).
 * העיצוב לפי המוק-אפ שאושר: רויטל\מוקאפ-מודול-שגרירי-חדשנות-v2.html.
 *
 * ---------------------------------------------------------------------------
 * מאיפה מגיעים הנתונים
 * ---------------------------------------------------------------------------
 *   SH_auth.ensure()                    → { sid, track, name, school }
 *   ?mode=content&what=list&track=...   → meta המסלול + 10 המפגשים
 *   ?mode=content&what=next&track=...   → כרטיס "הבא בתור"
 *   POST { action:"myProgress" }        → נוכחות, חלקי המטלה, מצב הזכאות
 *
 * כל הרשת עוברת דרך SH_auth.fetchJson / SH_auth.api (פסק זמן 15 שניות
 * ושלושה ניסיונות). אין כאן fetch משל עצמנו: Apps Script מחזיר 302 ואז 404
 * באופן רגעי, וזו המלכודת מסעיף 9 באפיון.
 *
 * ---------------------------------------------------------------------------
 * כלל ברזל: מספרי ההתקדמות מגיעים מהשרת ולא מומצאים כאן
 * ---------------------------------------------------------------------------
 * נקודת הקצה myProgress שייכת למשימות 5 ו-12 ועוד לא קיימת בשרת. עד שהיא
 * תיכתב, הקריאה חוזרת עם error:"noaction" ואנחנו מציגים 0 — ולא מחשבים
 * נוכחות מתאריכי המפגשים. מפגש שהתקיים אינו מפגש שנכחת בו.
 *
 * הצורה שהשרת אמור להחזיר (מתועדת כאן כדי שמשימה 5 תדע למה להתחבר):
 *   { ok:true,
 *     attended: 3, sessionsTotal: 10,          // נוכחות שאושרה
 *     parts: 2, partsTotal: 7,                 // חלקי הארגז/התיק שאושרו
 *     eligibility: "notStarted|onTrack|risk|eligible|missing",
 *     eligibilityText: "בדרך",                 // אם השרת רוצה לנסח לבד
 *     sessions: [ { num:1, state:"present|absent|excused|unitDone|pending" } ] }
 *
 * ---------------------------------------------------------------------------
 * מצב המפגש נקבע בשרת בלבד
 * ---------------------------------------------------------------------------
 * past / now / locked, וגם קישור הזום, מגיעים מוכנים מהשרת (sessionPublic_).
 * אסור לחשב אותם כאן: לקוח שיחשב לבד יוכל לפתוח יחידה לפני מועדה.
 * מה שכן מחושב כאן הוא ניסוח בלבד — "בעוד 19 ימים" מתוך today ותאריך
 * שהשרת שלח, וזה פורמט ולא החלטת נעילה.
 *
 * ---------------------------------------------------------------------------
 * פרטיות ותרגום
 * ---------------------------------------------------------------------------
 * אין בקובץ הזה שם, בית ספר, מייל או מפתח. השם מוצג מהזיכרון בזמן ריצה.
 * לכל מכולה דינמית יש id יציב, ושדה קוד הנוכחות והספרות מסומנים
 * translate="no" — כדי שמתג הערבית (משימה 16) לא ישבור אותם.
 */
(function (w, d) {
  "use strict";

  var API = w.SH_auth ? w.SH_auth.API : "";

  var LS_STEP = "shag.step.";          /* סימון "עשיתי" לצעד הבא, לכל מסלול ומפגש */
  var TABS = ["home", "path", "box", "gal"];

  /* ------------------------------------------------------------------ */
  /* עזרים                                                              */
  /* ------------------------------------------------------------------ */

  function el(id) { return d.getElementById(id); }

  /* כל טקסט מהשרת עובר כאן לפני שהוא נכנס ל-innerHTML */
  function esc(s) {
    return String(s === undefined || s === null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function str(v) { return String(v === undefined || v === null ? "" : v).trim(); }

  function ico(name, cls) {
    return '<svg class="sh-ico' + (cls ? " " + cls : "") + '" aria-hidden="true"><use href="#i-' + name + '"/></svg>';
  }

  function lsGet(k) { try { return w.localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { w.localStorage.setItem(k, v); } catch (e) { /* חלון פרטי */ } }

  /* dd/MM/yyyy → מספר להשוואה. אותה לוגיקה כמו dmyNum_ בשרת, בכוונה:
     new Date("5/10/2026") מתפרש כ-5 במאי ושובר את כל התאריכים. */
  function dmy(s) {
    var m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(str(s));
    if (!m) return null;
    return { d: +m[1], m: +m[2], y: +m[3] };
  }

  /* מספר הימים בין שני תאריכים dd/MM/yyyy. null אם אחד מהם לא תקין. */
  function daysBetween(fromStr, toStr) {
    var a = dmy(fromStr), b = dmy(toStr);
    if (!a || !b) return null;
    var ta = Date.UTC(a.y, a.m - 1, a.d), tb = Date.UTC(b.y, b.m - 1, b.d);
    return Math.round((tb - ta) / 86400000);
  }

  function inDays(n) {
    if (n === null) return "";
    if (n < 0) return "עבר";
    if (n === 0) return "היום";
    if (n === 1) return "מחר";
    if (n === 2) return "בעוד יומיים";
    return "בעוד " + n + " ימים";
  }

  /* dd/MM/yyyy ללא השנה, לתצוגה קצרה בתחנות המסע */
  function shortDate(s) {
    var a = dmy(s);
    return a ? a.d + "." + a.m : str(s);
  }

  /* ------------------------------------------------------------------ */
  /* המוטיב: טבעת 10 המקטעים מלוגו הקהילה (סעיף 8)                      */
  /* ------------------------------------------------------------------ */

  var SVGNS = "http://www.w3.org/2000/svg";

  /* טבעת גדולה במסך הבית. states: מערך של "done" / "done async" / "cur" /
     "" / "async". המקטעים נמשכים אחד-אחד בטעינה. */
  function drawRing(host, states) {
    host.innerHTML = "";
    var r = 82, C = 2 * Math.PI * r, gap = 5, seg = C / 10 - gap, nodes = [];
    for (var i = 0; i < 10; i++) {
      var c = d.createElementNS(SVGNS, "circle");
      c.setAttribute("cx", 100);
      c.setAttribute("cy", 100);
      c.setAttribute("r", r);
      c.setAttribute("class", "sh-seg " + (states[i] || ""));
      c.setAttribute("stroke-dasharray", "0 " + C);
      c.setAttribute("stroke-dashoffset", -(i * C / 10));
      host.appendChild(c);
      nodes.push(c);
    }
    nodes.forEach(function (c, i) {
      w.setTimeout(function () { c.setAttribute("stroke-dasharray", seg + " " + (C - seg)); }, 110 + i * 70);
    });
  }

  /* אותה טבעת בזעיר, ליד כל כותרת מקטע */
  function motif(done, total) {
    var s = d.createElementNS(SVGNS, "svg");
    s.setAttribute("viewBox", "0 0 40 40");
    s.setAttribute("class", "sh-mot");
    s.setAttribute("aria-hidden", "true");
    var R = 15, CC = 2 * Math.PI * R, sg = CC / total - 1.6;
    for (var i = 0; i < total; i++) {
      var c = d.createElementNS(SVGNS, "circle");
      c.setAttribute("cx", 20); c.setAttribute("cy", 20); c.setAttribute("r", R);
      c.setAttribute("stroke", i < done ? "#1D6FA5" : "#BFB7A5");
      c.setAttribute("stroke-dasharray", sg + " " + (CC - sg));
      c.setAttribute("stroke-dashoffset", -(i * CC / total));
      s.appendChild(c);
    }
    return s;
  }

  /* טבעת הטעינה (אותו מוטיב, כמו ב-auth.js) */
  function loadRing(size) {
    var parts = "", cx = 50, cy = 50, r = 38;
    for (var i = 0; i < 10; i++) {
      var a0 = (i * 36 - 90 + 2.2) * Math.PI / 180;
      var a1 = ((i + 1) * 36 - 90 - 2.2) * Math.PI / 180;
      parts += '<path d="M ' + (cx + r * Math.cos(a0)).toFixed(2) + " " + (cy + r * Math.sin(a0)).toFixed(2) +
        " A " + r + " " + r + " 0 0 1 " + (cx + r * Math.cos(a1)).toFixed(2) + " " +
        (cy + r * Math.sin(a1)).toFixed(2) + '" class="sh-seg-l" style="animation-delay:' +
        (i * 0.09).toFixed(2) + 's"/>';
    }
    return '<svg class="sh-ring-load on" viewBox="0 0 100 100" width="' + size + '" height="' + size +
      '" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" aria-hidden="true">' +
      parts + "</svg>";
  }

  /* ספירת מספרים (מיקרו-אנימציה מסעיף 8) */
  function countUp(host, to, suffixHtml) {
    if (to <= 0) { host.innerHTML = "0" + suffixHtml; return; }
    var start = 0;
    var t0 = (w.performance && w.performance.now) ? w.performance.now() : Date.now();
    (function step(t) {
      var now = t || ((w.performance && w.performance.now) ? w.performance.now() : Date.now());
      var k = Math.min(1, (now - t0) / 700);
      var n = Math.round(start + (to - start) * (1 - Math.pow(1 - k, 3)));
      host.innerHTML = n + suffixHtml;
      if (k < 1) w.requestAnimationFrame(step);
    })(t0);
  }

  /* ------------------------------------------------------------------ */
  /* מצבי הדף: טעינה, שגיאה, אין נתונים                                 */
  /* ------------------------------------------------------------------ */

  function boot(title, text, opts) {
    opts = opts || {};
    var b = el("sh-boot");
    b.hidden = false;
    b.className = "sh-pane sh-state" + (opts.bad ? " bad" : "");
    el("sh-boot-mark").innerHTML = opts.bad
      ? '<svg class="sh-ico" style="width:44px;height:44px"><use href="#i-alert"/></svg>'
      : loadRing(84);
    el("sh-boot-title").textContent = title;
    el("sh-boot-text").innerHTML = text;
    var r = el("sh-boot-retry");
    r.hidden = !opts.retry;
    r.innerHTML = ico("back") + " נסו שוב";
    r.onclick = opts.retry || null;
  }

  function hideBoot() { el("sh-boot").hidden = true; }

  /* auth.js מציג כבר מסך שגיאה מלא (fixed, z-index 9999) על מפתח שגוי או
     חסר. לא מציירים מסך שני מעליו — זה היה נותן שתי הודעות חופפות. */
  function authScreenUp() {
    var box = d.querySelector(".shauth");
    return !!(box && !box.hidden);
  }

  /* ------------------------------------------------------------------ */
  /* ניווט בין הלשוניות                                                 */
  /* ------------------------------------------------------------------ */

  var current = "home";

  function go(name) {
    var isTab = TABS.indexOf(name) > -1;
    ["home", "path", "box", "gal", "session"].forEach(function (p) {
      var node = el("pane-" + p);
      if (node) node.hidden = p !== name;
    });
    /* דף מפגש נפתח מתוך המסע, ולכן הלשונית "המסע" נשארת מסומנת */
    var lit = isTab ? name : "path";
    var btns = d.querySelectorAll("#sh-tabs button");
    for (var i = 0; i < btns.length; i++) {
      if (btns[i].getAttribute("data-goto") === lit) btns[i].setAttribute("aria-current", "page");
      else btns[i].removeAttribute("aria-current");
    }
    var pill = el("sh-pill");
    if (pill) pill.style.transform = "translateX(-" + (TABS.indexOf(lit) * 100) + "%)";
    current = name;
    try { w.scrollTo(0, 0); } catch (e) { /* לא קריטי */ }
  }

  function wireTabs() {
    var btns = d.querySelectorAll("#sh-tabs button");
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener("click", function () { go(this.getAttribute("data-goto")); });
    }
    var back = el("sh-session-back");
    if (back) back.addEventListener("click", function () { go("path"); });
  }

  /* ------------------------------------------------------------------ */
  /* קריאות לשרת                                                        */
  /* ------------------------------------------------------------------ */

  function content(what, extra) {
    var u = API + "?mode=content&what=" + encodeURIComponent(what) + (extra || "") + "&_=" + Date.now();
    return w.SH_auth.fetchJson(u);
  }

  /* נקודת הקצה של משימות 5 ו-12. עד שהיא תיכתב מוחזר noaction, ואז
     אין נתוני התקדמות — ומציגים 0 במקום להמציא. */
  function progress() {
    return w.SH_auth.api("myProgress").then(function (r) {
      return (r && r.ok) ? r : null;
    }).catch(function () { return null; });
  }

  /* ------------------------------------------------------------------ */
  /* בניית מסך הבית                                                     */
  /* ------------------------------------------------------------------ */

  var S = {            /* מצב הדף בזמן ריצה. לא נשמר בשום מקום. */
    me: null,
    meta: null,
    today: "",
    sessions: [],
    next: null,
    prog: null
  };

  function firstName(full) {
    var parts = str(full).split(/\s+/);
    return parts[0] || str(full);
  }

  function greetWord() {
    var h = new Date().getHours();
    if (h < 11) return "בוקר טוב";
    if (h < 17) return "צהריים טובים";
    if (h < 21) return "אחר הצהריים טובים";
    return "לילה טוב";
  }

  /* מצב הנוכחות של מפגש מסוים, לפי נתוני השרת בלבד */
  function attState(num) {
    if (!S.prog || !S.prog.sessions) return "";
    for (var i = 0; i < S.prog.sessions.length; i++) {
      if (Number(S.prog.sessions[i].num) === Number(num)) return str(S.prog.sessions[i].state);
    }
    return "";
  }

  /* התחנה הפתוחה: המפגש שהשרת סימן now. אם אין כזה (למשל לפני תחילת
     ההשתלמות) — המפגש הבא בתור, שהשרת חישב ב-what=next. */
  function currentNum() {
    for (var i = 0; i < S.sessions.length; i++) if (S.sessions[i].now) return S.sessions[i].num;
    return S.next ? S.next.num : 0;
  }

  /* יום מפגש סינכרוני: השרת סימן now על מפגש שאינו יחידה. */
  function liveSession() {
    for (var i = 0; i < S.sessions.length; i++) {
      if (S.sessions[i].now && !S.sessions[i].isUnit) return S.sessions[i];
    }
    return null;
  }

  /* יחידה א-סינכרונית שחלון ההגשה שלה פתוח כרגע, לפי השרת */
  function openUnit() {
    for (var i = 0; i < S.sessions.length; i++) {
      if (S.sessions[i].isUnit && S.sessions[i].windowOpen === true) return S.sessions[i];
    }
    return null;
  }

  function renderHome() {
    /* --- שלום ושם פרטי --- */
    el("sh-greet").innerHTML = greetWord() + "<b>" + esc(firstName(S.me.name)) + "</b>";
    el("sh-track").textContent = "מסלול " + str(S.me.track) +
      (str(S.me.school) ? " · " + str(S.me.school) : "");

    /* --- הטבעת --- */
    var cur = currentNum();
    var states = [];
    var doneCount = 0;
    for (var i = 0; i < 10; i++) {
      var s = null;
      for (var j = 0; j < S.sessions.length; j++) if (S.sessions[j].num === i + 1) s = S.sessions[j];
      var st = attState(i + 1);
      var cls = [];
      if (s && s.isUnit) cls.push("async");
      if (st === "present" || st === "excused" || st === "unitDone") { cls.push("done"); doneCount++; }
      else if (s && s.num === cur) cls.push("cur");
      states.push(cls.join(" "));
    }
    drawRing(el("sh-ring"), states);

    /* המספר במרכז מגיע מהשרת. בלי נתוני נוכחות הוא 0, ולא נגזר מהתאריכים. */
    var attended = S.prog ? Number(S.prog.attended || 0) : 0;
    var total = (S.prog && Number(S.prog.sessionsTotal)) || 10;
    countUp(el("sh-ringnum"), attended, '<small>/' + total + "</small>");
    el("sh-ringlbl").textContent = attended ? "מפגשים מאחורייך" : "טרם התחלנו לספור";

    /* --- הבא בתור --- */
    renderNextCard();

    /* --- הצעד הבא --- */
    renderStep();

    /* --- שלושת המדדים --- */
    renderStats(attended, total, doneCount);

    /* --- קוד הנוכחות, רק ביום מפגש --- */
    renderAttend();

    /* המוטיב ליד כותרות המקטעים */
    var heads = d.querySelectorAll("#pane-home .sh-sec h2");
    for (var k = 0; k < heads.length; k++) {
      if (heads[k].querySelector(".sh-mot")) continue;
      heads[k].insertBefore(motif(k === 0 ? Math.max(1, attended) : attended, 10), heads[k].firstChild);
    }
  }

  function renderNextCard() {
    var host = el("sh-next");
    var s = S.next;
    if (!s) {
      host.innerHTML = '<div class="sh-next"><div class="sh-when">כל המפגשים מאחורייך' +
        '<small>נשארה המטלה המסכמת' +
        (S.meta && S.meta.assignmentDue ? ' · להגשה עד <span translate="no">' + esc(S.meta.assignmentDue) + "</span>" : "") +
        "</small></div></div>";
      return;
    }
    var away = daysBetween(S.today, s.date);
    var dayName = (S.meta && S.meta.day) ? "יום " + esc(S.meta.day) : "";
    var kind = s.isUnit ? "יחידה עצמית" : "מפגש";
    var line2 = [dayName, '<span translate="no">' + esc(s.date) + "</span>"];
    if (!s.isUnit && str(s.hours)) line2.push('<span dir="ltr" translate="no">' + esc(s.hours) + "</span>");
    var away_t = inDays(away);
    if (away_t) line2.push(esc(away_t));

    host.innerHTML =
      '<div class="sh-next" id="sh-next-card">' +
        '<div class="sh-when">' + esc(kind) + " " + esc(s.num) + " · " + esc(s.topic) +
          "<small>" + line2.filter(Boolean).join(" · ") + "</small>" +
        "</div>" +
        '<button type="button" class="sh-go" id="sh-next-go" aria-label="לדף המפגש">' + ico("arrow") + "</button>" +
      "</div>";
    el("sh-next-go").addEventListener("click", function () { openSession(s.num); });
  }

  /* צעד אחד לביצוע: תוצר היחידה הפתוחה, או משימת ההכנה של המפגש הבא.
     הסימון נשמר בדפדפן — זו תזכורת אישית ולא הגשה. ההגשה עצמה היא
     משימה 10, ואז הסטטוס יגיע מהשרת ויחליף את הסימון המקומי. */
  function renderStep() {
    var host = el("sh-step");
    var unit = openUnit();
    var note = el("sh-step-note");

    var title = "", sub = "", key = "";

    if (unit) {
      title = str(unit.deliverable);
      sub = "תוצר יחידה " + unit.num + (str(unit.dueBy) ? ' · להגשה עד <span translate="no">' + esc(unit.dueBy) + "</span>" : "");
      key = "u" + unit.num;
    } else if (S.next) {
      title = str(S.next.before);
      sub = "משימת הכנה למפגש " + S.next.num;
      key = "p" + S.next.num;
    }

    /* מיטל עוד לא מילאה את "לפני המפגש" — לא מציגים כותרת ריקה ולא סימון */
    if (!title) {
      note.textContent = "";
      host.innerHTML = '<div class="sh-empty"><b>' +
        (S.next ? "משימת ההכנה למפגש " + esc(S.next.num) : "אין כרגע צעד פתוח") + "</b>" +
        (S.next
          ? "משימת ההכנה תתפרסם כאן לקראת המפגש. היא קצרה, עד 15 דקות."
          : "כשייפתח מפגש או יחידה חדשה, הצעד יופיע כאן.") +
        "</div>";
      return;
    }

    note.textContent = "לחצו לסימון";
    var lsKey = LS_STEP + str(S.me.track) + "." + key;
    var on = lsGet(lsKey) === "1";

    host.innerHTML =
      '<div class="sh-task' + (on ? " on" : "") + '" id="sh-task">' +
        '<button type="button" class="sh-tick" id="sh-task-tick" aria-pressed="' + (on ? "true" : "false") +
          '" aria-label="סימון הצעד כבוצע">' + ico("check") + "</button>" +
        '<div class="sh-tt"><b>' + esc(title) + "</b><span>" + sub + "</span></div>" +
      "</div>";

    el("sh-task-tick").addEventListener("click", function () {
      var box = el("sh-task");
      var nowOn = !box.classList.contains("on");
      box.classList.toggle("on", nowOn);
      this.setAttribute("aria-pressed", nowOn ? "true" : "false");
      lsSet(lsKey, nowOn ? "1" : "0");
    });
  }

  /* שלושה מדדים: נוכחות, חלקי המטלה, מצב הזכאות בשפה פשוטה.
     כל המספרים מהשרת. בלי נתונים — 0, ו"טרם התחילה" כשהתאריך לפני הפתיחה. */
  function renderStats(attended, total, ringDone) {
    var partsTotal = (S.prog && Number(S.prog.partsTotal)) ||
      ((S.meta && S.meta.parts) ? S.meta.parts.length : 7);
    var parts = S.prog ? Number(S.prog.parts || 0) : 0;

    var started = S.meta && S.meta.first ? (daysBetween(S.meta.first, S.today) >= 0) : true;

    var elig = "בתהליך", cls = "";
    if (S.prog && str(S.prog.eligibilityText)) {
      elig = str(S.prog.eligibilityText);
      cls = S.prog.eligibility === "risk" || S.prog.eligibility === "missing" ? "warn"
          : S.prog.eligibility === "eligible" ? "good" : "";
    } else if (S.prog) {
      var map = { notStarted: "טרם התחילה", onTrack: "בדרך", risk: "בסיכון", eligible: "עומד/ת בתנאים", missing: "חסרים דברים" };
      elig = map[str(S.prog.eligibility)] || "בתהליך";
      cls = S.prog.eligibility === "risk" || S.prog.eligibility === "missing" ? "warn"
          : S.prog.eligibility === "eligible" ? "good" : "";
    } else {
      elig = started ? "בתהליך" : "טרם התחילה";
    }

    el("sh-stats").innerHTML =
      '<div class="sh-stat"><b translate="no">' + attended + "/" + total + "</b><span>נוכחות</span>" +
        '<div class="sh-mini"><i style="width:' + Math.round(100 * attended / Math.max(1, total)) + '%"></i></div></div>' +
      '<div class="sh-stat"><b translate="no">' + parts + "/" + partsTotal + "</b><span>חלקי " +
        ((S.meta && str(S.meta.assignment).indexOf("תיק") === 0) ? "התיק" : "הארגז") + "</span>" +
        '<div class="sh-mini"><i style="width:' + Math.round(100 * parts / Math.max(1, partsTotal)) + '%"></i></div></div>' +
      '<div class="sh-stat ' + cls + '"><b>' + esc(elig) + "</b><span>זכאות</span></div>";

    var note = el("sh-stats-note");
    if (!S.prog) {
      note.innerHTML = started
        ? "נתוני הנוכחות מתעדכנים למחרת כל מפגש, אחרי שמיטל מאשרת אותם."
        : "ההשתלמות נפתחת ב<span translate=\"no\">" + esc(S.meta ? S.meta.first : "") +
          "</span>. עד אז הכול על אפס, וזה בסדר.";
    } else {
      note.textContent = "הזכאות דורשת נוכחות, הגשת תוצרי היחידות, מיקרו-הדרכה אחת בבית הספר, והמטלה המסכמת.";
    }
    /* ringDone נשמר לצורך בדיקה ידנית מול הטבעת; אין לו תצוגה */
    void ringDone;
  }

  /* ------------------------------------------------------------------ */
  /* קוד הנוכחות ביום מפגש (סעיף 3.1: בראש הבית, בלי ניווט)             */
  /* ------------------------------------------------------------------ */

  /* הרישום עצמו הוא משימה 5. כאן מציירים את השדה ומעבירים אליה:
       window.SH_attend.open(sessionNum)
     היא מקבלת את מספר המפגש ואחראית על השליחה, על הקוד הקודם שעוד
     מתקבל, ועל הודעת ההצלחה. אם היא עוד לא נטענה — אומרים את זה בפירוש
     ולא מעמידים פנים שהשדה עובד. */
  function renderAttend() {
    var host = el("sh-attend");
    var s = liveSession();
    if (!s) { host.hidden = true; host.innerHTML = ""; return; }

    var ready = !!(w.SH_attend && typeof w.SH_attend.open === "function");

    host.hidden = false;
    host.innerHTML =
      '<div class="sh-live-h"><span class="sh-rec" aria-hidden="true"></span>המפגש מתקיים היום</div>' +
      '<h2 id="sh-attend-h">מפגש ' + esc(s.num) + " · רישום נוכחות</h2>" +
      "<p>הקלידו את הקוד שמיטל מציגה בזום. הקוד מתחלף כל 5 דקות, והקודם עוד מתקבל.</p>" +
      '<label class="sh-sr" for="sh-attend-code">קוד הנוכחות</label>' +
      '<div class="sh-live-row">' +
        '<input id="sh-attend-code" class="sh-code" type="text" inputmode="numeric" ' +
          'autocomplete="off" maxlength="6" translate="no" dir="ltr" placeholder="0000" ' +
          'aria-describedby="sh-attend-msg">' +
        (ready ? '<button type="button" class="sh-live-btn" id="sh-attend-go">' + ico("check") + " שליחה</button>" : "") +
      "</div>" +
      '<p class="sh-live-msg" id="sh-attend-msg">' +
        (ready ? "" : "רישום הנוכחות ייפתח כאן") +
      "</p>";

    if (!ready) {
      el("sh-attend-code").disabled = true;
      return;
    }

    function hand() {
      try {
        w.SH_attend.open(s.num);
      } catch (e) {
        el("sh-attend-msg").textContent = "רישום הנוכחות ייפתח כאן";
      }
    }
    el("sh-attend-go").addEventListener("click", hand);
    el("sh-attend-code").addEventListener("keydown", function (ev) {
      if (ev.key === "Enter") { ev.preventDefault(); hand(); }
    });
  }

  /* ------------------------------------------------------------------ */
  /* מסך המסע                                                           */
  /* ------------------------------------------------------------------ */

  function renderPath() {
    var host = el("sh-path");
    if (!S.sessions.length) {
      host.innerHTML = '<div class="sh-empty"><b>המפגשים עוד לא נטענו</b>' +
        "מיטל מזינה את תוכן המפגשים במודול. ברגע שהם יפורסמו, כל עשר התחנות יופיעו כאן.</div>";
      return;
    }

    el("sh-path-note").textContent = "10 תחנות · " +
      ((S.meta && S.meta.asyncCount) ? S.meta.asyncCount + " מהן יחידות עצמיות" : "");

    var cur = currentNum();
    var html = '<div class="sh-path" id="sh-path-line">';

    /* הקו הכחול עד התחנה הנוכחית */
    var idxCur = 0;
    for (var q = 0; q < S.sessions.length; q++) if (S.sessions[q].num === cur) idxCur = q;
    if (idxCur > 0) {
      html += '<div class="sh-line-done" style="height:' + (idxCur * 100 / S.sessions.length) + '%"></div>';
    }

    S.sessions.forEach(function (s, i) {
      var st = attState(s.num);
      var done = (st === "present" || st === "excused" || st === "unitDone");
      var isCur = s.num === cur;
      var cls = ["sh-stop"];
      if (s.isUnit) cls.push("async");
      if (done) cls.push("done");
      else if (isCur) cls.push("cur");
      else cls.push("lock");

      html += '<div class="' + cls.join(" ") + '" style="animation-delay:' + (i * 55) + 'ms">' +
        '<div class="sh-dot" aria-hidden="true">' + (done ? ico("check", "xs") : "") + "</div>" +
        '<button type="button" class="sh-stop-card" data-open="' + s.num + '">' +
          '<span class="sh-stop-h">' + esc(s.num) + " · " + esc(s.topic) + "</span>" +
          '<span class="sh-stop-m">' +
            (s.isUnit ? '<span class="sh-chip dash">יחידה עצמית</span>' : "") +
            (isCur ? '<span class="sh-chip o">' + (s.now ? "עכשיו" : "הבא") + "</span>" : "") +
            (done ? '<span class="sh-chip g">נכחת</span>' : "") +
            '<span class="sh-date" translate="no">' + esc(shortDate(s.date)) + "</span>" +
          "</span>";

      /* התחנה הפתוחה מציגה לפני / במפגש / אחרי ואת החלק שהיא בונה */
      if (isCur) {
        var before = str(s.before) || (s.isUnit ? "" : "משימת ההכנה תתפרסם לקראת המפגש");
        var during = s.isUnit
          ? (str(s.steps) || "צעדי היחידה, בקצב אישי")
          : "זום · קוד נוכחות";
        var after = s.isUnit
          ? ("תוצר להגשה" + (str(s.dueBy) ? " עד " + s.dueBy : ""))
          : "מצגת, תבניות וסיכום";

        html += '<span class="sh-phases">' +
          '<span class="sh-phase cur"><b>' + ico("pen", "xs") + "לפני</b>" + esc(before) + "</span>" +
          '<span class="sh-phase"><b>' + ico(s.isUnit ? "book" : "video", "xs") +
            (s.isUnit ? "ביחידה" : "במפגש") + "</b>" + esc(during) + "</span>" +
          '<span class="sh-phase"><b>' + ico("book", "xs") + "אחרי</b>" + esc(after) + "</span>" +
          "</span>";

        var parts = (s.buildsParts && s.buildsParts.length) ? s.buildsParts : (s.buildsPart ? [s.buildsPart] : []);
        if (parts.length) {
          html += '<span class="sh-builds">' + ico("box", "s") + "בונה את " +
            parts.map(function (p) { return '"' + esc(p) + '"'; }).join(" ו") + " ב" +
            ((S.meta && str(S.meta.assignment).indexOf("תיק") === 0) ? "תיק" : "ארגז") + "</span>";
        }
      }

      html += "</button>";

      /* כפתור הזום רק כשהשרת שלח קישור — והוא שולח אותו רק ביום המפגש */
      if (str(s.zoom)) {
        html += '<a class="sh-zoom" href="' + esc(s.zoom) + '" target="_blank" rel="noopener">' +
          ico("video") + "כניסה לזום של מפגש " + esc(s.num) + "</a>";
      }

      html += "</div>";
    });

    html += "</div>";
    host.innerHTML = html;

    var cards = host.querySelectorAll("[data-open]");
    for (var i = 0; i < cards.length; i++) {
      cards[i].addEventListener("click", function () { openSession(+this.getAttribute("data-open")); });
    }
  }

  /* ------------------------------------------------------------------ */
  /* דף מפגש (סעיף 4.1 ו-4.2)                                           */
  /* ------------------------------------------------------------------ */

  /* חומרים מגיעים כתא אחד בגיליון. שורה שהיא כתובת הופכת לקישור. */
  function assetLines(raw) {
    var lines = str(raw).split(/[\r\n]+|\s*·\s*/).map(function (x) { return x.trim(); }).filter(Boolean);
    if (!lines.length) return "";
    return '<div class="sh-links">' + lines.map(function (line) {
      var m = /(https?:\/\/[^\s]+)/.exec(line);
      if (m) {
        var label = line.replace(m[1], "").replace(/[\s|–—-]+$/, "").trim() || "פתיחת החומר";
        return '<a href="' + esc(m[1]) + '" target="_blank" rel="noopener">' + ico("link", "s") + esc(label) + "</a>";
      }
      return "<span>" + ico("file", "s") + esc(line) + "</span>";
    }).join("") + "</div>";
  }

  function openSession(num) {
    var s = null;
    for (var i = 0; i < S.sessions.length; i++) if (S.sessions[i].num === Number(num)) s = S.sessions[i];
    var host = el("sh-session");

    if (!s) {
      host.innerHTML = '<div class="sh-empty"><b>המפגש לא נמצא</b>' +
        "אפשר לחזור למסע ולבחור תחנה אחרת.</div>";
      go("session");
      return;
    }

    var st = attState(s.num);
    var away = daysBetween(S.today, s.date);
    var kind = s.isUnit ? "יחידה עצמית" : "מפגש סינכרוני";

    var html = '<div class="sh-shead">' +
      '<div class="sh-kicker">' +
        '<span class="sh-chip' + (s.isUnit ? " dash" : "") + '">' + esc(kind) + "</span>" +
        (s.now ? '<span class="sh-chip o">' + (s.isUnit ? "החלון פתוח" : "מתקיים היום") + "</span>" : "") +
        (s.locked ? '<span class="sh-chip dash">' + ico("lock", "xs") + " נפתח בהמשך</span>" : "") +
        (st === "present" || st === "unitDone" ? '<span class="sh-chip g">נכחת</span>' : "") +
      "</div>" +
      "<h2>" + esc(s.num) + " · " + esc(s.topic) + "</h2>" +
      '<div class="sh-meta">' +
        "<span>" + ico("cal", "s") + '<span translate="no">' + esc(s.date) + "</span></span>" +
        (!s.isUnit && str(s.hours) ? "<span>" + ico("clock", "s") + '<span dir="ltr" translate="no">' + esc(s.hours) + "</span></span>" : "") +
        (s.isUnit && str(s.dueBy) ? "<span>" + ico("flag", "s") + 'להגשה עד <span translate="no">' + esc(s.dueBy) + "</span></span>" : "") +
        (away !== null && away > 0 ? "<span>" + ico("info", "s") + esc(inDays(away)) + "</span>" : "") +
      "</div></div>";

    /* "למה זה חשוב לך" — שדה שמיטל ממלאת. ריק? לא מדפיסים כותרת ריקה. */
    if (str(s.why)) {
      html += '<div class="sh-block why"><h3>' + ico("spark", "s") + "למה זה חשוב לך</h3><p>" + esc(s.why) + "</p></div>";
    }

    /* תמצית הסילבוס — מגיעה מהשרת לכל מפגש, ולכן הדף לא נשאר ריק */
    if (str(s.syllabusText)) {
      html += '<div class="sh-block"><h3>' + ico("book", "s") +
        (s.isUnit ? "מה ביחידה" : "מה במפגש") + "</h3><p>" + esc(s.syllabusText) + "</p></div>";
    }

    /* לפני המפגש / צעדי היחידה */
    if (s.isUnit) {
      if (str(s.steps)) {
        var steps = str(s.steps).split(/[\r\n]+|\s*·\s*/).map(function (x) { return x.replace(/^\d+\s*[.)·-]?\s*/, "").trim(); }).filter(Boolean);
        html += '<div class="sh-block"><h3>' + ico("route", "s") + "צעדי היחידה</h3><ul>" +
          steps.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></div>";
      } else {
        html += '<div class="sh-empty"><b>צעדי היחידה</b>שלושה עד ארבעה צעדים עם מדריכים מוקלטים. ' +
          "מיטל תפרסם אותם עד פתיחת החלון ב<span translate=\"no\">" + esc(s.opens || s.date) + "</span>.</div>";
      }
    } else if (str(s.before)) {
      html += '<div class="sh-block"><h3>' + ico("pen", "s") + "לפני המפגש</h3><p>" + esc(s.before) + "</p></div>";
    } else {
      html += '<div class="sh-empty"><b>לפני המפגש</b>משימת הכנה אחת, עד 15 דקות. ' +
        "היא תתפרסם כאן לקראת המפגש.</div>";
    }

    /* התוצר */
    if (str(s.deliverable)) {
      html += '<div class="sh-block"><h3>' + ico("flag", "s") +
        (s.isUnit ? "התוצר להשלמת היחידה" : "התוצר של המפגש") + "</h3><p>" + esc(s.deliverable) + "</p>" +
        (s.isUnit ? '<p style="margin-top:6px;font-size:13px;color:var(--muted)">סימון "קראתי" אינו מספיק. היחידה נחשבת נוכחות רק אחרי שהתוצר הוגש בחלון הזמן ומיטל אישרה אותו.</p>' : "") +
        "</div>";
    }

    /* זום ורישום נוכחות — השרת חושף את הקישור רק ביום המפגש */
    if (!s.isUnit) {
      if (str(s.zoom)) {
        html += '<a class="sh-zoom" href="' + esc(s.zoom) + '" target="_blank" rel="noopener">' +
          ico("video") + "כניסה לזום</a>";
      }
      if (s.now) {
        html += '<div class="sh-block" style="margin-top:10px"><h3>' + ico("keypad", "s") +
          "רישום נוכחות</h3>" +
          '<p style="font-size:13.5px;color:var(--muted)">שדה הקוד נמצא בראש מסך הבית, בלי ניווט.</p></div>';
      } else if (s.locked) {
        html += '<div class="sh-empty"><b>זום ורישום נוכחות</b>קישור הזום ושדה הקוד נפתחים ביום המפגש עצמו.</div>';
      }
    }

    /* חומרים וסיכום — השרת מחזיר אותם רק ממפגש שנפתח ואילך */
    if (str(s.materials)) {
      html += '<div class="sh-block"><h3>' + ico("file", "s") + "חומרים</h3>" + assetLines(s.materials) + "</div>";
    }
    if (str(s.summary)) {
      html += '<div class="sh-block sum"><h3>' + ico("book", "s") + "סיכום המפגש</h3><p>" +
        esc(s.summary).replace(/\r?\n/g, "<br>") + "</p></div>";
    }
    if (s.past && !str(s.materials) && !str(s.summary)) {
      html += '<div class="sh-empty"><b>חומרים וסיכום</b>מיטל מעלה אותם אחרי המפגש. ' +
        "עוד לא הועלה כלום לתחנה הזאת.</div>";
    }

    /* מה זה בונה במטלה המסכמת */
    var parts = (s.buildsParts && s.buildsParts.length) ? s.buildsParts : (s.buildsPart ? [s.buildsPart] : []);
    if (parts.length) {
      html += '<div class="sh-block"><h3>' + ico("box", "s") + "בונה ב" +
        ((S.meta && str(S.meta.assignment)) ? esc(S.meta.assignment) : "מטלה המסכמת") + "</h3><ul>" +
        parts.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") + "</ul></div>";
    }

    host.innerHTML = html;
    go("session");
  }

  /* ------------------------------------------------------------------ */
  /* הפעלה                                                              */
  /* ------------------------------------------------------------------ */

  function loadAll() {
    boot("רגע, טוענים את הסביבה", "מביאים את המפגשים ואת ההתקדמות שלך.");

    return Promise.all([
      content("list", "&track=" + encodeURIComponent(S.me.track)),
      content("next", "&track=" + encodeURIComponent(S.me.track)),
      progress()
    ]).then(function (res) {
      var list = res[0], nx = res[1];

      if (!list || list.ok !== true) {
        var e = list && list.error;
        boot("לא הצלחנו לטעון את המפגשים",
          e === "badtrack"
            ? "המסלול הרשום אצלנו לא זוהה. כדאי לכתוב למיטל כדי שתשלים את זה."
            : "השרת ענה, אבל בלי תוכן המפגשים. אפשר לנסות שוב.",
          { bad: true, retry: e === "badtrack" ? null : function () { loadAll(); } });
        return;
      }

      S.meta = list.meta || null;
      S.today = str(list.today);
      S.sessions = list.sessions || [];
      S.next = (nx && nx.ok) ? nx.next : null;
      S.prog = res[2];

      if (S.meta && str(S.meta.assignment)) {
        el("sh-box-h").textContent = str(S.meta.assignment);
        el("sh-box-p").textContent = "שבעת חלקי " + str(S.meta.assignment) +
          ", המחוון והמשוב של מיטל ייפתחו כאן לקראת ההגשות הראשונות.";
      }

      renderHome();
      renderPath();
      hideBoot();
      go("home");
    }).catch(function () {
      boot("אין חיבור לשרת",
        "ניסינו שלוש פעמים ולא קיבלנו תשובה. אפשר לנסות שוב, ואם זה חוזר — " +
        'לכתוב ל<a href="mailto:mlypeleg@gmail.com">מיטל</a>.',
        { bad: true, retry: function () { loadAll(); } });
    });
  }

  function start() {
    wireTabs();
    boot("רגע, טוענים את הסביבה", "אם זה לוקח יותר מכמה שניות — כדאי לרענן את הדף.");

    if (!w.SH_auth) {
      boot("חסר קובץ הכניסה", "assets/auth.js לא נטען, ולכן אין כניסה לסביבה.", { bad: true });
      return;
    }

    w.SH_auth.ensure().then(function (me) {
      S.me = me || {};
      loadAll();
    }, function () {
      /* auth.js כבר מציג מסך שגיאה בעברית על מפתח חסר או שגוי.
         לא מציירים מסך שני מעליו. */
      if (authScreenUp()) { hideBoot(); return; }
      boot("צריך את הקישור האישי",
        "הכניסה לסביבת הלמידה היא דרך הקישור האישי שנשלח אליך בהודעה " +
        "(בקבוצת הוואטסאפ של הקהילה, ושוב במייל). הוא נראה כך: " +
        '<span dir="ltr" translate="no">/shagririm/?t=…</span>',
        { bad: true });
    });
  }

  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", start);
  else start();

  /* נחשף לבדיקות ולמשימות הבאות (attend.js, unit.js, lang.js):
     אחרי החלפת שפה או אחרי רישום נוכחות קוראים ל-SH_home.refresh(). */
  w.SH_home = {
    go: go,
    openSession: openSession,
    refresh: loadAll,
    state: function () { return { track: S.me && S.me.track, today: S.today, sessions: S.sessions.length, hasProgress: !!S.prog }; }
  };
})(window, document);
