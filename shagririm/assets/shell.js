/**
 * שגרירי חדשנות טכנולוגית — גרסה 2: המעטפת ועמוד המפגש.
 * האפיון: רויטל\אפיון-מערכת-למידה-שגרירים-v2.md, סעיף 8 (הכרעות 1, 12, 13).
 * המראה:  רויטל\מוקאפ-מערכת-שגרירים-v3.html, תצוגת "מה שרכז רואה".
 *
 * מחליף את home.js כבקר של index.html. מה שעבר משם כמו שהוא:
 *   · renderAttend — בלוק הנוכחות #sh-attend, שורה בשורה. SH_attend לא השתנה.
 *   · כלל הברזל: מצב המפגש (past/now/locked), קישור הזום והשדות החדשים
 *     מגיעים מוכנים מהשרת. כאן לא מחשבים נעילה ולא ממציאים התקדמות.
 *
 * מאיפה מגיעים הנתונים:
 *   SH_auth.ensure()                   → { sid, track, name, school }
 *   ?mode=content&what=list|next       → עשרת המפגשים, כולל slides, slidesEmbed,
 *                                        bridge, hasPage (ממפגש שנפתח ואילך)
 *   ?mode=page&what=step               → השלב החי של המסלול (פולינג 20 שניות,
 *                                        רק כשהמפגש שעל המסך מתקיים היום)
 *   POST pageGet                       → מצב הדף המלווה, לצ'יפ שבפריט הראשון
 *
 * ניווט: #s=4 מפגש · #s=4&p=1 הדף המלווה של המפגש · #v=studio|port|tools|att|enrich.
 * הכתובת נשמרת, ולכן רענון או קישור חוזרים לאותו מקום.
 *
 * פרטיות: אין כאן שם, בית ספר, מייל או מפתח. שמות של אחרים לא מגיעים לדף הזה.
 */
(function (w, d) {
  "use strict";

  var STEP_POLL_MS = 20000;

  /* חמש הפעימות של תבנית המפגש (סעיף 3 באפיון). במפגש 1 הראשונה היא "פתיחה". */
  var BEATS = [
    { t: "מה קרה מאז", m: 10 },
    { t: "ידע", m: 30 },
    { t: "סטודיו", m: 60 },
    { t: "זרקור", m: 15 },
    { t: "לקחת הביתה", m: 10 }
  ];

  /* חמשת המסכים שנפתחים לפי לוח הזמנים שבסעיף 7. הטקסט אומר מתי, ולא מעמיד פנים. */
  var OTHER = {
    studio: { icon: "studio", title: "הסטודיו שלי",
      text: "כל מה שעבדת עליו, מפגש אחרי מפגש: הדפים המלווים, ההגשות וההערכות של מיטל. בינתיים הדפים המלווים שלך מחכים כאן למטה.",
      when: "המסך המלא נפתח לקראת מפגש 2" },
    port: { icon: "folio", title: "תיק העבודות שלי",
      text: "שבעת חלקי המטלה המסכמת, ורק מה שאושר. הוא נבנה לבד מתוך מה שעושים במפגשים, ולא נכתב בסוף.",
      when: "נפתח עם היחידה הראשונה" },
    tools: { icon: "tools", title: "מאגר הכלים",
      text: "תחנות הכלים של ההשתלמות, כל כלי עם מדריך מוקלט וגרסה שעובדת גם בלי Wi-Fi. המאגר יציג קודם את מה שמתאים לתשתית שמילאת במפת הפתיחה.",
      when: "נפתח עם היחידה הראשונה" },
    att: { icon: "clock", title: "הנוכחות שלי",
      text: "בכל מפגש בזום מקלידים את הקוד שמיטל מציגה, בעמוד המפגש. אחרי המפגש מיטל מצליבה מול דוח הזום ומאשרת, ורק אז הנוכחות נספרת. כאן יופיע הפירוט שלך, מפגש אחרי מפגש.",
      when: "נפתח אחרי מפגש 4" },
    enrich: { icon: "star", title: "הצעות להעשרה",
      text: "השתלמויות, קורסים וקהילות שמתאימים למה שמעניין אותך, עם הסבר למה כל אחד הוצע.",
      when: "נפתח בהמשך השנה" }
  };

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

  /* dd/MM/yyyy. אותה לוגיקה כמו dmyNum_ בשרת: new Date("5/10/2026") הוא 5 במאי. */
  function dmy(s) {
    var m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(str(s));
    return m ? { d: +m[1], m: +m[2], y: +m[3] } : null;
  }

  function shortDate(s) {
    var a = dmy(s);
    return a ? a.d + "." + a.m : str(s);
  }

  function dayName(s) {
    var a = dmy(s);
    if (!a) return "";
    var names = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
    return names[new Date(Date.UTC(a.y, a.m - 1, a.d)).getUTCDay()];
  }

  /* ------------------------------------------------------------------ */
  /* מצב הדף בזמן ריצה. לא נשמר בשום מקום.                              */
  /* ------------------------------------------------------------------ */

  var S = {
    me: null, meta: null, today: "", sessions: [], next: null, prog: null,
    sel: 0,                /* המפגש שעל המסך */
    view: "session",       /* session | page | studio | port | tools | att | enrich */
    live: { session: 0, step: 0 },
    stepTimer: null,
    slidesOpen: false,
    pageInfo: {}           /* num → { state, filled, total } לצ'יפ של הפריט הראשון */
  };

  function sessionByNum(num) {
    for (var i = 0; i < S.sessions.length; i++) if (S.sessions[i].num === Number(num)) return S.sessions[i];
    return null;
  }

  /* התחנה הפתוחה: המפגש שהשרת סימן now, ואם אין — הבא בתור שהשרת חישב */
  function currentNum() {
    for (var i = 0; i < S.sessions.length; i++) if (S.sessions[i].now && !S.sessions[i].isUnit) return S.sessions[i].num;
    for (var j = 0; j < S.sessions.length; j++) if (S.sessions[j].now) return S.sessions[j].num;
    if (S.next) return S.next.num;
    return S.sessions.length ? S.sessions[S.sessions.length - 1].num : 0;
  }

  /* יום מפגש סינכרוני: השרת סימן now על מפגש שאינו יחידה. */
  function liveSession() {
    for (var i = 0; i < S.sessions.length; i++) {
      if (S.sessions[i].now && !S.sessions[i].isUnit) return S.sessions[i];
    }
    return null;
  }

  function attState(num) {
    if (!S.prog || !S.prog.sessions) return "";
    for (var i = 0; i < S.prog.sessions.length; i++) {
      if (Number(S.prog.sessions[i].num) === Number(num)) return str(S.prog.sessions[i].state);
    }
    return "";
  }

  /* ------------------------------------------------------------------ */
  /* מסך מצב: טעינה ושגיאה                                              */
  /* ------------------------------------------------------------------ */

  function boot(title, text, opts) {
    opts = opts || {};
    var b = el("sh-boot");
    b.hidden = false;
    el("v2-wrap").hidden = true;
    b.className = "sh-pane sh-state" + (opts.bad ? " bad" : "");
    el("sh-boot-mark").innerHTML = '<svg class="sh-ico" style="width:44px;height:44px"><use href="#i-' + (opts.bad ? "alert" : "clock") + '"/></svg>';
    el("sh-boot-title").textContent = title;
    el("sh-boot-text").innerHTML = text;
    var r = el("sh-boot-retry");
    r.hidden = !opts.retry;
    r.innerHTML = ico("back") + " נסו שוב";
    r.onclick = opts.retry || null;
  }

  function hideBoot() { el("sh-boot").hidden = true; el("v2-wrap").hidden = false; }

  /* auth.js מציג כבר מסך שגיאה מלא על מפתח שגוי או חסר. לא מציירים שני מעליו. */
  function authScreenUp() {
    var box = d.querySelector(".shauth");
    return !!(box && !box.hidden);
  }

  /* ------------------------------------------------------------------ */
  /* תפריט הצד                                                          */
  /* ------------------------------------------------------------------ */

  var SVGNS = "http://www.w3.org/2000/svg";

  /* טבעת עשרת המקטעים מלוגו הקהילה: מקטע לכל מפגש */
  function drawRing() {
    var host = el("v2-ring");
    host.innerHTML = "";
    var r = 38, C = 2 * Math.PI * r, gap = 4, seg = C / 10 - gap;
    for (var i = 0; i < 10; i++) {
      var s = S.sessions[i];
      var c = d.createElementNS(SVGNS, "circle");
      c.setAttribute("cx", "50"); c.setAttribute("cy", "50"); c.setAttribute("r", String(r));
      c.setAttribute("stroke-dasharray", seg + " " + (C - seg));
      c.setAttribute("stroke-dashoffset", String(-(i * (seg + gap))));
      c.setAttribute("transform", "rotate(-90 50 50)");
      var st = s ? attState(s.num) : "";
      var col = "rgba(255,255,255,.16)";
      if (st === "present" || st === "unitDone") col = "#2F9F6A";
      else if (s && s.num === S.sel) col = "#F08A2E";
      c.setAttribute("stroke", col);
      host.appendChild(c);
    }
  }

  function renderSide() {
    el("v2-me-name").textContent = str(S.me.name);
    el("v2-me-sub").textContent = str(S.me.school) + (str(S.me.track) ? " · מסלול " + str(S.me.track) : "");
    el("sh-track").textContent = "מסלול " + str(S.me.track) + " · תשפ״ז";

    /* מספר הנוכחות מגיע מהשרת בלבד. עד שיש — מציגים איפה הקבוצה, לא ממציאים. */
    var n = el("v2-me-n");
    if (S.prog && S.prog.attended !== undefined) {
      n.textContent = Number(S.prog.attended) + " מתוך " + (Number(S.prog.sessionsTotal) || 10) + " · הדרך לגמול";
    } else {
      var cur = currentNum();
      n.textContent = cur ? "מפגש " + cur + " מתוך " + (S.sessions.length || 10) : "";
    }

    var h = "";
    for (var i = 0; i < S.sessions.length; i++) {
      var s = S.sessions[i], st = attState(s.num);
      var cls = "v2-st" + (st === "present" || st === "unitDone" ? " done" : s.now ? " now" : s.isUnit ? " unit" : "");
      var mark = (st === "present" || st === "unitDone") ? ico("check", "xs") : esc(s.num);
      var sub = s.isUnit
        ? "יחידה עצמית · עד " + esc(shortDate(s.dueBy || s.date))
        : esc(shortDate(s.date)) + (s.now ? " · היום" : "");
      h += '<li><button type="button" data-s="' + esc(s.num) + '"' +
        (S.view !== "studio" && S.view !== "port" && S.view !== "tools" && S.view !== "att" && S.view !== "enrich" && s.num === S.sel ? ' aria-current="true"' : "") + ">" +
        '<span class="' + cls + '" translate="no">' + mark + "</span>" +
        "<span>" + esc(s.topic) + '<small translate="no">' + sub + "</small></span></button></li>";
    }
    el("v2-mlist").innerHTML = h;

    var btns = el("v2-nav").querySelectorAll("button[data-nav]");
    for (var b = 0; b < btns.length; b++) {
      var k = btns[b].getAttribute("data-nav");
      if (k !== "meet" && k === S.view) btns[b].setAttribute("aria-current", "true");
      else btns[b].removeAttribute("aria-current");
    }
    drawRing();
  }

  function drawer(open) {
    d.body.classList.toggle("v2-nav-open", !!open);
    el("v2-burger").setAttribute("aria-expanded", open ? "true" : "false");
  }

  function wireSide() {
    el("v2-burger").addEventListener("click", function (ev) {
      ev.stopPropagation();
      drawer(!d.body.classList.contains("v2-nav-open"));
    });
    /* לחיצה מחוץ למגירה סוגרת אותה. הרקע הכהה הוא body::after, ולכן היעד הוא body. */
    d.addEventListener("click", function (ev) {
      if (!d.body.classList.contains("v2-nav-open")) return;
      if (ev.target.closest && (ev.target.closest("#v2-side") || ev.target.closest("#v2-burger"))) return;
      drawer(false);
    });
    d.addEventListener("keydown", function (ev) { if (ev.key === "Escape") drawer(false); });

    el("v2-nav").addEventListener("click", function (ev) {
      if (!ev.target.closest) return;
      var sb = ev.target.closest("button[data-s]");
      if (sb) { drawer(false); nav("#s=" + sb.getAttribute("data-s")); return; }
      var nb = ev.target.closest("button[data-nav]");
      if (!nb) return;
      var k = nb.getAttribute("data-nav");
      if (k === "meet") {
        var li = el("v2-nav-meet");
        var open = !li.classList.contains("open");
        li.classList.toggle("open", open);
        nb.setAttribute("aria-expanded", open ? "true" : "false");
        return;
      }
      drawer(false);
      nav("#v=" + k);
    });
  }

  /* ------------------------------------------------------------------ */
  /* ניווט לפי הכתובת                                                   */
  /* ------------------------------------------------------------------ */

  function nav(hash) {
    if (w.location.hash === hash) route();
    else w.location.hash = hash;
  }

  function hashParams() {
    var out = {}, raw = String(w.location.hash || "").replace(/^#/, "");
    raw.split("&").forEach(function (kv) {
      var i = kv.indexOf("=");
      if (i > 0) out[kv.substring(0, i)] = decodeURIComponent(kv.substring(i + 1));
    });
    return out;
  }

  function show(view) {
    S.view = view;
    el("v2-session").hidden = view !== "session";
    el("v2-page").hidden = view !== "page";
    el("v2-other").hidden = view === "session" || view === "page";
    if (view !== "page" && w.SH_page && w.SH_page.close) w.SH_page.close();
  }

  function route() {
    var p = hashParams();
    if (p.v && OTHER[p.v]) {
      show(p.v);
      renderOther(p.v);
      stopStepPoll();
    } else {
      var num = Number(p.s) || currentNum();
      if (!sessionByNum(num)) num = currentNum();
      S.sel = num;
      if (p.p && sessionByNum(num) && sessionByNum(num).hasPage) {
        show("page");
        openPage(num);
      } else {
        show("session");
        renderSession(num);
      }
      stepPollFor(num);
    }
    renderSide();
    try { w.scrollTo(0, 0); } catch (e) { /* לא קריטי */ }
  }

  /* ------------------------------------------------------------------ */
  /* פס הפעימות והשלב החי                                               */
  /* ------------------------------------------------------------------ */

  function beatsHtml(num, step) {
    var h = "";
    for (var i = 0; i < BEATS.length; i++) {
      var name = (i === 0 && Number(num) === 1) ? "פתיחה" : BEATS[i].t;
      var cls = step && i + 1 < step ? " done" : step && i + 1 === step ? " now" : "";
      h += '<div class="v2-beat' + cls + '"' + (cls === " now" ? ' aria-current="step"' : "") + ">" +
        '<span class="t" translate="no">' + (i + 1) + " · " + BEATS[i].m + " דק׳</span><b>" + esc(name) + "</b></div>";
    }
    return h;
  }

  /* הפס מופיע רק כשהשרת אומר שהמפגש מתקיים היום */
  function renderBeats() {
    var host = el("v2-beats");
    var s = sessionByNum(S.sel);
    if (!s || !s.now || s.isUnit || S.view !== "session") { host.hidden = true; return; }
    var step = (S.live.session === s.num) ? S.live.step : 0;
    host.hidden = false;
    host.innerHTML = beatsHtml(s.num, step);
  }

  function setLive(session, step) {
    var changed = S.live.session !== Number(session) || S.live.step !== Number(step);
    S.live = { session: Number(session) || 0, step: Number(step) || 0 };
    if (!changed) return;
    renderBeats();
    /* "החיבור להמשך" נפתח בפעימה החמישית, ולכן מציירים מחדש את מה שמתחת */
    if (S.view === "session") renderBelow(sessionByNum(S.sel));
    if (w.SH_page && w.SH_page.onStep) w.SH_page.onStep(S.live.step);
  }

  function stopStepPoll() {
    if (S.stepTimer) { w.clearInterval(S.stepTimer); S.stepTimer = null; }
  }

  function pollStep() {
    if (d.hidden) return;
    w.SH_auth.get("page", "&what=step").then(function (r) {
      if (r && r.ok) setLive(r.session, r.step);
    }).catch(function () { /* פולינג שקט. הניסיון הבא בעוד 20 שניות */ });
  }

  function stepPollFor(num) {
    stopStepPoll();
    var s = sessionByNum(num);
    if (!s || !s.now || s.isUnit) return;
    pollStep();
    S.stepTimer = w.setInterval(pollStep, STEP_POLL_MS);
  }

  /* ------------------------------------------------------------------ */
  /* עמוד המפגש                                                         */
  /* ------------------------------------------------------------------ */

  function renderHead(s) {
    var tag;
    if (s.now) tag = '<span class="v2-tag">' + (s.isUnit ? "החלון פתוח עכשיו" : "מתקיים היום") + "</span>";
    else if (s.locked) tag = '<span class="v2-tag quiet">' + ico("lock", "xs") + (s.isUnit ? " היחידה נפתחת ב-" : " המפגש ב-") + '<span translate="no">' + esc(shortDate(s.isUnit ? (s.opens || s.date) : s.date)) + "</span></span>";
    else tag = '<span class="v2-tag quiet">' + (s.isUnit ? "היחידה נסגרה" : "המפגש התקיים") + "</span>";

    var lead = str(s.why) || str(s.syllabusText);
    var meta = "";
    if (!s.isUnit) {
      meta += "<span>יום <b>" + esc(dayName(s.date)) + "</b></span>" +
        '<span><b translate="no">' + esc(s.date) + "</b></span>" +
        (str(s.hours) ? '<span><b dir="ltr" translate="no">' + esc(s.hours) + "</b></span>" : "") +
        "<span>זום</span>";
    } else {
      meta += "<span>יחידה עצמית</span>" +
        (str(s.opens) ? '<span>נפתחת <b translate="no">' + esc(s.opens) + "</b></span>" : "") +
        (str(s.dueBy) ? '<span>להגשה עד <b translate="no">' + esc(s.dueBy) + "</b></span>" : "");
    }
    if (str(s.deliverable)) meta += "<span>התוצר: <b>" + esc(s.deliverable) + "</b></span>";

    el("v2-mhead").innerHTML = tag +
      "<h2>" + (s.isUnit ? "יחידה " : "מפגש ") + '<span translate="no">' + esc(s.num) + "</span> · " + esc(s.topic) + "</h2>" +
      (lead ? "<p>" + esc(lead) + "</p>" : "") +
      '<div class="v2-mmeta">' + meta + "</div>" +
      (str(s.zoom) ? '<div class="v2-row" style="margin-top:14px"><a class="v2-btn dark" href="' + esc(s.zoom) + '" target="_blank" rel="noopener">' + ico("video") + "כניסה לזום</a></div>" : "");
  }

  function pageChip(s) {
    var info = S.pageInfo[s.num];
    if (!info) return "";
    if (info.state === "הוערך") return '<span class="v2-chip done">הוערך</span>';
    if (info.state === "הוחזר") return '<span class="v2-chip due">חזר אליך עם הערה</span>';
    if (info.state === "הוגש") return '<span class="v2-chip done">הוגש</span>';
    if (info.filled > 0) return '<span class="v2-chip draft" translate="no">טיוטה · ' + info.filled + " מתוך " + info.total + "</span>";
    return '<span class="v2-chip soon">עוד לא התחלת</span>';
  }

  function quietItem(icon, title, text) {
    return '<div class="v2-bigitem quiet"><span class="ic">' + ico(icon) + '</span><span class="tx"><b>' +
      esc(title) + "</b><span>" + text + "</span></span></div>";
  }

  function renderItems(s) {
    /* 1 · הדף המלווה */
    var pg = el("v2-item-page");
    if (s.hasPage) {
      pg.innerHTML = '<button type="button" class="v2-bigitem primary" id="v2-open-page">' +
        '<span class="ic">' + ico("studio") + '</span><span class="tx"><b>הדף המלווה</b><span>' +
        (str(s.deliverable) ? esc(s.deliverable) + " · " : "") + "כאן עובדים במהלך המפגש, ומיטל רואה</span></span>" +
        '<span class="end"><span id="v2-page-chip">' + pageChip(s) + '</span><span class="v2-btn primary">פתיחה</span></span></button>';
      el("v2-open-page").addEventListener("click", function () { nav("#s=" + s.num + "&p=1"); });
    } else {
      pg.innerHTML = quietItem("studio", "הדף המלווה",
        s.locked ? "עמוד העבודה של המפגש. נפתח כאן ביום המפגש." : "למפגש הזה אין דף מלווה.");
    }

    /* 2 · מצגת המפגש. רק Google Slides נפתח בתוך העמוד; השרת מחליט (slidesEmbed). */
    var sl = el("v2-item-slides"), fr = el("v2-slides");
    fr.hidden = true; fr.innerHTML = ""; S.slidesOpen = false;
    if (str(s.slidesEmbed)) {
      sl.innerHTML = '<button type="button" class="v2-bigitem" id="v2-open-slides" aria-expanded="false" aria-controls="v2-slides">' +
        '<span class="ic">' + ico("slides") + '</span><span class="tx"><b>מצגת המפגש</b><span>נפתחת כאן, בתוך העמוד</span></span>' +
        '<span class="end"><span class="v2-btn" id="v2-slides-lbl">פתיחה</span></span></button>';
      el("v2-open-slides").addEventListener("click", function () {
        S.slidesOpen = !S.slidesOpen;
        this.setAttribute("aria-expanded", S.slidesOpen ? "true" : "false");
        el("v2-slides-lbl").textContent = S.slidesOpen ? "סגירה" : "פתיחה";
        fr.hidden = !S.slidesOpen;
        /* ה-iframe נבנה רק בלחיצה: 33 טלפונים בזום לא צריכים לטעון מצגת שלא ביקשו */
        fr.innerHTML = S.slidesOpen
          ? '<div class="fr"><iframe src="' + esc(s.slidesEmbed) + '" title="מצגת המפגש" allowfullscreen loading="lazy"></iframe></div>' +
            '<div class="bar"><span>מצגת המפגש</span><a href="' + esc(s.slides) + '" target="_blank" rel="noopener">פתיחה בלשונית נפרדת</a></div>'
          : "";
      });
    } else if (str(s.slides)) {
      sl.innerHTML = '<a class="v2-bigitem" href="' + esc(s.slides) + '" target="_blank" rel="noopener">' +
        '<span class="ic">' + ico("slides") + '</span><span class="tx"><b>מצגת המפגש</b><span>נפתחת בלשונית נפרדת</span></span>' +
        '<span class="end"><span class="v2-btn">פתיחה</span></span></a>';
    } else {
      sl.innerHTML = quietItem("slides", "מצגת המפגש",
        s.locked ? "תעלה לכאן ביום המפגש." : s.isUnit ? "ביחידה עצמית אין מצגת. הצעדים מופיעים למטה." : "המצגת עוד לא הועלתה.");
    }

    /* 3 · רישום נוכחות. ביום המפגש: הבלוק עצמו. אחרת: שורה שקטה שמסבירה. */
    var live = liveSession();
    var att = el("v2-item-att");
    if (live && live.num === s.num) {
      att.innerHTML = "";
      renderAttend();
    } else {
      var host = el("sh-attend");
      host.hidden = true; host.innerHTML = "";
      var st = attState(s.num), text;
      if (s.isUnit) text = "ביחידה עצמית הנוכחות היא התוצר: היא נספרת אחרי שהגשת בחלון הזמן ומיטל אישרה.";
      else if (st === "present") text = "נכחת במפגש הזה.";
      else if (s.locked) text = "שדה הקוד נפתח כאן ביום המפגש. מקלידים את ארבע הספרות שמיטל מציגה בזום.";
      else text = "הרישום למפגש הזה נסגר. מיטל מאשרת נוכחות אחרי הצלבה מול דוח הזום.";
      att.innerHTML = quietItem("check", "רישום נוכחות", text);
    }
  }

  /* -------------------------------------------------------------------
     בלוק הנוכחות. הועתק מ-home.js כמו שהוא (22.9.26) — רק מקור המפגש
     הוא liveSession() של הקובץ הזה. #sh-attend, #sh-attend-code,
     #sh-attend-go ו-SH_attend.open לא השתנו, ובדיקת הדפדפן
     tests/browser/checkin-code-passthrough.js רצה מול המבנה הזה.
     ------------------------------------------------------------------- */
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

    /* מעבירים הלאה את מה שכבר הוקלד כאן. בלי זה נפתח חלון קוד שני ריק
       והמשתתף התבקש להקליד שוב — נמצא בחזרה היבשה 21.9.26. */
    function hand() {
      var typed = "";
      try { typed = el("sh-attend-code").value || ""; } catch (e0) { typed = ""; }
      try {
        w.SH_attend.open(s.num, { code: typed });
        try { el("sh-attend-code").value = ""; } catch (e1) { /* לא קריטי */ }
      } catch (e) {
        el("sh-attend-msg").textContent = "רישום הנוכחות ייפתח כאן";
      }
    }
    el("sh-attend-go").addEventListener("click", hand);
    el("sh-attend-code").addEventListener("keydown", function (ev) {
      if (ev.key === "Enter") { ev.preventDefault(); hand(); }
    });
  }

  /* חומרים מגיעים כתא אחד בגיליון. שורה שהיא כתובת הופכת לקישור. */
  function matsHtml(raw) {
    var lines = str(raw).split(/[\r\n]+|\s*·\s*/).map(function (x) { return x.trim(); }).filter(Boolean);
    if (!lines.length) return "";
    return '<ul class="v2-mats">' + lines.map(function (line) {
      var m = /(https?:\/\/[^\s]+)/.exec(line);
      if (m) {
        var label = line.replace(m[1], "").replace(/[\s|–—-]+$/, "").trim() || "פתיחת החומר";
        return '<li><a href="' + esc(m[1]) + '" target="_blank" rel="noopener">' + ico("link", "s") + esc(label) + "</a></li>";
      }
      return "<li><span>" + ico("file", "s") + esc(line) + "</span></li>";
    }).join("") + "</ul>";
  }

  function renderBelow(s) {
    if (!s) return;
    var h = "";

    /* "החיבור להמשך": הפעימה החמישית, ואחרי המפגש הוא נשאר כתזכורת */
    var step = (S.live.session === s.num) ? S.live.step : 0;
    if (str(s.bridge) && (s.past || step === 5)) {
      h += '<div class="v2-card v2-bridge"><p class="v2-eyebrow">החיבור להמשך</p><p style="margin:0;font-size:15px;line-height:1.65">' + esc(s.bridge) + "</p></div>";
    }

    if (!s.isUnit && str(s.before) && !s.past) {
      h += '<div class="v2-card"><p class="v2-eyebrow">לפני המפגש · עד 15 דקות</p><p style="margin:0;line-height:1.65">' + esc(s.before) + "</p></div>";
    }

    if (s.isUnit && str(s.steps)) {
      var steps = str(s.steps).split(/[\r\n]+|\s*·\s*/).map(function (x) { return x.replace(/^\d+\s*[.)·-]?\s*/, "").trim(); }).filter(Boolean);
      h += '<div class="v2-card"><p class="v2-eyebrow">צעדי היחידה</p><ol style="margin:0;padding-inline-start:20px;line-height:1.8">' +
        steps.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ol></div>";
    }

    h += '<div class="v2-card"><p class="v2-eyebrow">חומרי ההדרכה של המפגש</p>';
    if (str(s.materials)) h += matsHtml(s.materials);
    else h += '<p class="v2-note" style="margin:0">' + (s.locked ? "החומרים נפתחים ביום המפגש." : "מיטל עוד לא העלתה חומרים למפגש הזה.") + "</p>";
    h += "</div>";

    if (str(s.summary)) {
      h += '<div class="v2-card"><p class="v2-eyebrow">סיכום המפגש</p><p style="margin:0;line-height:1.7">' +
        esc(s.summary).replace(/\r?\n/g, "<br>") + "</p></div>";
    }

    var parts = (s.buildsParts && s.buildsParts.length) ? s.buildsParts : (s.buildsPart ? [s.buildsPart] : []);
    if (parts.length) {
      h += '<p class="v2-note" style="margin-top:16px">מה שעושים במפגש הזה נכנס לתיק העבודות שלך: <b style="color:var(--ink)">' +
        parts.map(esc).join(" · ") + "</b></p>";
    }
    el("v2-below").innerHTML = h;
  }

  function renderSession(num) {
    var s = sessionByNum(num);
    if (!s) {
      el("v2-mhead").innerHTML = "<h2>המפגשים עוד לא נטענו</h2><p>מיטל מזינה את תוכן המפגשים. ברגע שהם יפורסמו, עשרת המפגשים יופיעו בתפריט.</p>";
      el("v2-big").hidden = true;
      el("v2-below").innerHTML = "";
      return;
    }
    el("v2-big").hidden = false;
    renderBeats();
    renderHead(s);
    renderItems(s);
    renderBelow(s);
    loadPageInfo(s);
  }

  /* מצב הדף המלווה לצ'יפ שבפריט הראשון. קריאה אחת למפגש, ורק כשיש דף. */
  function loadPageInfo(s) {
    if (!s.hasPage || !w.SH_auth) return;
    w.SH_auth.api("pageGet", { n: s.num }).then(function (r) {
      if (!r || !r.ok) return;
      S.pageInfo[s.num] = { state: str(r.state), filled: Number(r.filled) || 0, total: Number(r.total) || 0 };
      if (r.step) setLive(s.num, r.step);
      var chip = el("v2-page-chip");
      if (chip && S.sel === s.num) chip.innerHTML = pageChip(s);
    }).catch(function () { /* הצ'יפ הוא תוספת. בלי רשת הפריט עדיין נפתח */ });
  }

  /* ------------------------------------------------------------------ */
  /* הדף המלווה ושאר המסכים                                             */
  /* ------------------------------------------------------------------ */

  function openPage(num) {
    var s = sessionByNum(num), host = el("v2-page");
    if (!w.SH_page || !s) {
      host.innerHTML = '<div class="v2-card"><h2>הדף המלווה לא נטען</h2><p class="v2-note">כדאי לרענן את הדף.</p></div>';
      return;
    }
    w.SH_page.open(host, s, {
      track: str(S.me.track),
      beats: function () { return (s.now && !s.isUnit) ? beatsHtml(s.num, S.live.session === s.num ? S.live.step : 0) : ""; },
      onBack: function () { nav("#s=" + s.num); },
      onStep: function (step) { setLive(s.num, step); },
      onInfo: function (info) { S.pageInfo[s.num] = info; }
    });
  }

  function renderOther(key) {
    var o = OTHER[key];
    var h = '<div class="v2-card v2-soon"><div class="ic">' + ico(o.icon) + "</div><h2>" + esc(o.title) + "</h2><p>" + esc(o.text) +
      '</p><span class="v2-chip soon when">' + esc(o.when) + "</span></div>";

    /* הסטודיו כבר שימושי היום: הדפים המלווים של המפגשים שנפתחו */
    if (key === "studio") {
      var pages = S.sessions.filter(function (s) { return s.hasPage; });
      if (pages.length) {
        h += '<div class="v2-card"><p class="v2-eyebrow">הדפים המלווים שלי</p><ul class="v2-mats">' +
          pages.map(function (s) {
            return '<li><a href="#s=' + esc(s.num) + '&p=1">' + ico("studio", "s") + "מפגש " + esc(s.num) + " · " + esc(s.deliverable || s.topic) + "</a></li>";
          }).join("") + "</ul></div>";
      }
    }
    el("v2-other").innerHTML = h;
  }

  /* ------------------------------------------------------------------ */
  /* הפעלה                                                              */
  /* ------------------------------------------------------------------ */

  function content(what, extra) {
    return w.SH_auth.get("content", "&what=" + encodeURIComponent(what) + (extra || ""));
  }

  /* נקודת הקצה של משימה 12 ("הנוכחות שלי", 16.11). עד שתיכתב חוזר noaction,
     ואז אין נתוני התקדמות — ולא ממציאים. */
  function progress() {
    return w.SH_auth.api("myProgress").then(function (r) {
      return (r && r.ok) ? r : null;
    }).catch(function () { return null; });
  }

  function loadAll() {
    boot("רגע, טוענים את הסביבה", "מביאים את המפגשים שלך.");

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
      hideBoot();
      route();
    }).catch(function () {
      boot("אין חיבור לשרת",
        "ניסינו שלוש פעמים ולא קיבלנו תשובה. אפשר לנסות שוב, ואם זה חוזר — " +
        'לכתוב ל<a href="mailto:mlypeleg@gmail.com">מיטל</a>.',
        { bad: true, retry: function () { loadAll(); } });
    });
  }

  function start() {
    wireSide();
    w.addEventListener("hashchange", route);
    d.addEventListener("visibilitychange", function () { if (!d.hidden && S.stepTimer) pollStep(); });
    boot("רגע, טוענים את הסביבה", "אם זה לוקח יותר מכמה שניות — כדאי לרענן את הדף.");

    if (!w.SH_auth) {
      boot("חסר קובץ הכניסה", "assets/auth.js לא נטען, ולכן אין כניסה לסביבה.", { bad: true });
      return;
    }

    w.SH_auth.ensure().then(function (me) {
      S.me = me || {};
      loadAll();
    }, function () {
      if (authScreenUp()) { el("sh-boot").hidden = true; return; }
      boot("צריך את הקישור האישי",
        "הכניסה לסביבת הלמידה היא דרך הקישור האישי שנשלח אליך בהודעה " +
        "(בקבוצת הוואטסאפ של הקהילה, ושוב במייל). הוא נראה כך: " +
        '<span dir="ltr" translate="no">/shagririm/?t=…</span>',
        { bad: true });
    });
  }

  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", start);
  else start();

  /* נחשף לבדיקות ולקבצים הבאים. SH_home נשאר כשם נרדף: attend.js קורא
     ל-SH_home.refresh() אחרי רישום מוצלח. */
  w.SH_shell = {
    go: nav,
    refresh: loadAll,
    setStep: setLive,
    beatsHtml: beatsHtml,
    state: function () { return { track: S.me && S.me.track, view: S.view, session: S.sel, step: S.live.step, sessions: S.sessions.length }; }
  };
  w.SH_home = { refresh: loadAll, go: nav, openSession: function (n) { nav("#s=" + n); }, state: w.SH_shell.state };
})(window, document);
