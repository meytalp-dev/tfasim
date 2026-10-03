/**
 * שגרירי חדשנות טכנולוגית — המעטפת של מיטל ושל אלנט (27.9.26).
 * המשך לעבודה: רויטל\המשך-מכאן-שגרירים-מעטפת.md · המראה: מוקאפ-מערכת-שגרירים-v3.html.
 *
 * אותו index.html, אותו תפריט צד, והתפקיד קובע רק מה מופיע בו:
 *   מיטל  (key=adm-)   הבית · מפגשי ההדרכה · שולחן המנחה · תשובות ומיפוי ·
 *                       נוכחות ואישור · הגשות · משתתפים וזכאות · מצב הקרנה · הגדרות
 *   אלנט  (key=view-)  אותו דבר בלי "הגדרות" ובלי אף כפתור פעולה.
 *
 * מה עבר ולא נכתב מחדש: attend.js (SH_team), zoom-import.js, desk.js ו-elnet.js
 * עובדים על אותם מזהי t-… / dk-… / e-… שב-index.html. הקובץ הזה רק מחליט איזה
 * מסך גלוי, מחזיק את ההקשר (מסלול + מפגש, דרך SH_team.select), ומצייר את
 * המסכים החדשים: הבית, ערכת המנחה, תשובות ומיפוי, הגשות, משתתפים, הגדרות.
 *
 * רשת: GET בלבד, דרך SH_auth.fetchJson (שלושה ניסיונות). אין כאן אף POST —
 * הפעולות נשארו בקבצים הקיימים. במפתח צפייה השרת ממילא דוחה כל כתיבה.
 * פרטיות: אין כאן מפתח, שם או נתון. המפתח נקרא מהדפדפן (shag.teamkey).
 */
(function (w, d) {
  "use strict";

  var TEAM_KEY = "shag.teamkey";
  var TEST_KEY = "shag.testkey";       /* מפתח משתתף/ת לבדיקה, רק בדפדפן של מיטל */
  var TRACKS = ["כלים", "הובלה"];
  var DAYS = { "כלים": "ימי שני", "הובלה": "ימי רביעי" };
  var VIEWS = { home: 1, kit: 1, desk: 1, ans: 1, att: 1, subs: 1, people: 1, set: 1 };

  /* ------------------------------------------------------------------ */
  /* עזרים                                                              */
  /* ------------------------------------------------------------------ */

  function el(id) { return d.getElementById(id); }
  function str(v) { return String(v === undefined || v === null ? "" : v).trim(); }
  function esc(s) {
    return String(s === undefined || s === null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function ico(name, cls) {
    return '<svg class="sh-ico' + (cls ? " " + cls : "") + '" aria-hidden="true"><use href="#i-' + name + '"/></svg>';
  }
  function dmy(s) {
    var m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(str(s));
    return m ? { d: +m[1], m: +m[2], y: +m[3] } : null;
  }
  function shortDate(s) { var a = dmy(s); return a ? a.d + "." + a.m : str(s); }
  function dayName(s) {
    var a = dmy(s);
    if (!a) return "";
    return ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"][new Date(Date.UTC(a.y, a.m - 1, a.d)).getUTCDay()];
  }
  /* כמה ימים מהיום (מ-today של השרת) עד תאריך. null = לא ידוע. */
  function daysUntil(s) {
    var a = dmy(s), t = dmy(A.today);
    if (!a || !t) return null;
    return Math.round((Date.UTC(a.y, a.m - 1, a.d) - Date.UTC(t.y, t.m - 1, t.d)) / 86400000);
  }

  function keyFrom(text) {
    var t = str(text);
    var m = t.match(/[?&#](?:key|k)=((?:adm|view)-[0-9a-z-]{8,64})/i) || t.match(/^((?:adm|view)-[0-9a-z-]{8,64})$/i);
    return m ? m[1] : "";
  }
  function lsGet(k) { try { return w.localStorage.getItem(k) || ""; } catch (e) { return ""; } }
  function lsSet(k, v) { try { if (v) w.localStorage.setItem(k, v); else w.localStorage.removeItem(k); } catch (e) { /* חלון פרטי */ } }
  function key() { return keyFrom(lsGet(TEAM_KEY)); }
  function viewer() { return /^view-/i.test(key()); }

  function toast(text, bad) {
    var box = el("t-toast");
    if (!box) return;
    box.className = "t-toast on" + (bad ? " bad" : "");
    box.textContent = text;
    w.clearTimeout(toast.t);
    toast.t = w.setTimeout(function () { box.className = "t-toast"; }, 3600);
  }

  /* GET במפתח ניהול/צפייה. params: אובייקט. */
  function get(mode, params) {
    var q = "?mode=" + encodeURIComponent(mode) + "&key=" + encodeURIComponent(key());
    for (var k in (params || {})) {
      if (Object.prototype.hasOwnProperty.call(params, k) && params[k] !== undefined && params[k] !== "") {
        q += "&" + encodeURIComponent(k) + "=" + encodeURIComponent(params[k]);
      }
    }
    return w.SH_auth.fetchJson(w.SH_auth.API + q + "&_=" + Date.now());
  }

  function csvDownload(name, head, rows) {
    var lines = [head].concat(rows).map(function (r) {
      return r.map(function (v) { return '"' + String(v === undefined || v === null ? "" : v).replace(/"/g, '""') + '"'; }).join(",");
    });
    var blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    var a = d.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    d.body.appendChild(a);
    a.click();
    d.body.removeChild(a);
    w.setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  function copyText(text, okMsg) {
    function fallback() {
      var ta = d.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      d.body.appendChild(ta); ta.select();
      var ok = false;
      try { ok = d.execCommand("copy"); } catch (e) { ok = false; }
      d.body.removeChild(ta);
      toast(ok ? okMsg : "ההעתקה נחסמה. לסמן ולהעתיק ביד.", !ok);
    }
    if (w.navigator.clipboard && w.navigator.clipboard.writeText) w.navigator.clipboard.writeText(text).then(function () { toast(okMsg); }, fallback);
    else fallback();
  }

  /* ------------------------------------------------------------------ */
  /* מצב                                                                */
  /* ------------------------------------------------------------------ */

  var A = {
    started: false, loaded: false, lastKey: null,
    view: "", today: "",
    content: {},          /* track → [sessions] (full) */
    contentErr: {},       /* track → קוד שגיאה */
    ctx: { track: "", session: 0 },
    home: null, homeBusy: false, homeAt: 0,
    ans: { at: "", wall: null, agg: null, q: "", st: "", field: "", opt: "", busy: false },
    people: null, peopleBusy: false, peopleOnlyNew: false,
    elnetStarted: false
  };

  function sessionsOf(track) { return A.content[track] || []; }
  function sessionOf(track, n) {
    var l = sessionsOf(track);
    for (var i = 0; i < l.length; i++) if (Number(l[i].num) === Number(n)) return l[i];
    return null;
  }
  function track() { return A.ctx.track || TRACKS[0]; }
  function curNum() { return Number(A.ctx.session) || 0; }

  /* המפגש שבמרכז כל מסלול: של היום, ואם אין — הבא בתור, ואם נגמר — האחרון. */
  function focusOf(tr) {
    var l = sessionsOf(tr), i;
    for (i = 0; i < l.length; i++) if (l[i].now && !l[i].isUnit) return l[i];
    for (i = 0; i < l.length; i++) if (l[i].now) return l[i];
    for (i = 0; i < l.length; i++) if (l[i].locked) return l[i];
    return l.length ? l[l.length - 1] : null;
  }

  /* ------------------------------------------------------------------ */
  /* "מה חסר": אילו תאים בגיליון עוד ריקים, לכל מפגש                    */
  /* ------------------------------------------------------------------ */

  function gaps(s) {
    if (!s) return [];
    var list = [];
    function need(ok, label, col) { list.push({ ok: !!ok, label: label, col: col }); }
    need(str(s.why), "למה זה חשוב", "למה זה חשוב");
    if (s.isUnit) {
      need(str(s.steps), "צעדי היחידה", "צעדי היחידה");
    } else {
      need(str(s.before), "לפני המפגש (לרכזים)", "לפני המפגש");
      need(str(s.zoom), "קישור זום", "קישור זום");
      need(str(s.slides), "קישור המצגת", "קישור מצגת");
    }
    if (s.pageFieldsError) list.push({ ok: false, label: "שדות הדף המלווה — JSON שבור (" + s.pageFieldsError + ")", col: "שדות הדף המלווה" });
    else need(s.hasPage, "שדות הדף המלווה", "שדות הדף המלווה");
    need(str(s.example), "דוגמה פתורה", "דוגמה פתורה");
    need(str(s.bridge), "החיבור להמשך", "החיבור להמשך");
    need(str(s.materials), "חומרים", "חומרים");
    need(str(s.script), "תסריט המנחה", "תסריט המנחה");
    return list;
  }
  function missingCount(s) { return gaps(s).filter(function (g) { return !g.ok; }).length; }

  /* ------------------------------------------------------------------ */
  /* markdown קטן לתסריט המנחה: כותרות, רשימות, טבלאות, הדגשה            */
  /* ------------------------------------------------------------------ */

  function inline(t) {
    return esc(t)
      .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  }

  function mdHtml(src) {
    var lines = String(src || "").replace(/\r/g, "").split("\n");
    var out = [], para = [], list = null, table = null;
    function flushPara() { if (para.length) { out.push("<p>" + inline(para.join(" ")) + "</p>"); para = []; } }
    function flushList() { if (list) { out.push("<" + list.tag + ">" + list.items.join("") + "</" + list.tag + ">"); list = null; } }
    function flushTable() {
      if (!table) return;
      var h = '<div class="a-md-tw"><table><thead><tr>' + table[0].map(function (c) { return "<th>" + inline(c) + "</th>"; }).join("") + "</tr></thead><tbody>";
      for (var r = 1; r < table.length; r++) h += "<tr>" + table[r].map(function (c) { return "<td>" + inline(c) + "</td>"; }).join("") + "</tr>";
      out.push(h + "</tbody></table></div>");
      table = null;
    }
    function flushAll() { flushPara(); flushList(); flushTable(); }

    for (var i = 0; i < lines.length; i++) {
      var ln = lines[i], m;
      if (/^\s*\|/.test(ln)) {
        flushPara(); flushList();
        if (/^\s*\|[\s:|-]+\|\s*$/.test(ln)) continue;          /* שורת ההפרדה */
        var cells = ln.trim().replace(/^\||\|$/g, "").split("|").map(function (c) { return c.trim(); });
        (table = table || []).push(cells);
        continue;
      }
      flushTable();
      if (!ln.trim()) { flushPara(); flushList(); continue; }
      if ((m = /^(#{2,4})\s+(.*)$/.exec(ln))) {
        flushAll();
        var lv = m[1].length + 1;
        out.push("<h" + lv + ">" + inline(m[2]) + "</h" + lv + ">");
        continue;
      }
      if ((m = /^(\s*)[-*]\s+(\[[ xX]\]\s+)?(.*)$/.exec(ln))) {
        flushPara();
        if (!list || list.tag !== "ul") { flushList(); list = { tag: "ul", items: [] }; }
        var box = m[2] ? '<span class="a-md-box' + (/x/i.test(m[2]) ? " on" : "") + '" aria-hidden="true"></span>' : "";
        list.items.push('<li class="' + (m[1].length >= 2 ? "ind" : "") + '">' + box + inline(m[3]) + "</li>");
        continue;
      }
      if ((m = /^\s*\d+[.)]\s+(.*)$/.exec(ln))) {
        flushPara();
        if (!list || list.tag !== "ol") { flushList(); list = { tag: "ol", items: [] }; }
        list.items.push("<li>" + inline(m[1]) + "</li>");
        continue;
      }
      if (list) {                                              /* המשך של פריט */
        list.items[list.items.length - 1] = list.items[list.items.length - 1].replace(/<\/li>$/, " " + inline(ln.trim()) + "</li>");
        continue;
      }
      para.push(ln.trim());
    }
    flushAll();
    return out.join("");
  }

  /* ------------------------------------------------------------------ */
  /* טעינה                                                              */
  /* ------------------------------------------------------------------ */

  function loadContent() {
    return Promise.all(TRACKS.map(function (tr) {
      return get("content", { what: "list", track: tr }).then(function (r) {
        if (r && r.ok) {
          A.content[tr] = r.sessions || [];
          A.today = str(r.today) || A.today;
          delete A.contentErr[tr];
        } else {
          A.contentErr[tr] = (r && r.error) || "server";
          if (r && r.error === "noaccess" && w.SH_team) w.SH_team.reload();
        }
      }).catch(function () { A.contentErr[tr] = "network"; });
    })).then(function () {
      A.loaded = true;
      renderSide();
      route();
    });
  }

  /* ------------------------------------------------------------------ */
  /* תפריט הצד                                                          */
  /* ------------------------------------------------------------------ */

  var SVGNS = "http://www.w3.org/2000/svg";

  function drawRing() {
    var host = el("v2-ring");
    if (!host) return;
    host.innerHTML = "";
    var l = sessionsOf(track());
    var r = 38, C = 2 * Math.PI * r, gap = 4, seg = C / 10 - gap;
    for (var i = 0; i < 10; i++) {
      var s = l[i];
      var c = d.createElementNS(SVGNS, "circle");
      c.setAttribute("cx", "50"); c.setAttribute("cy", "50"); c.setAttribute("r", String(r));
      c.setAttribute("stroke-dasharray", seg + " " + (C - seg));
      c.setAttribute("stroke-dashoffset", String(-(i * (seg + gap))));
      c.setAttribute("transform", "rotate(-90 50 50)");
      c.setAttribute("stroke", !s ? "rgba(255,255,255,.16)" : s.past ? "#2F9F6A" : s.now ? "#F08A2E" : "rgba(255,255,255,.16)");
      host.appendChild(c);
    }
  }

  function renderSide() {
    var tr = track();
    el("v2-me-name").textContent = viewer() ? "תצוגת אלנט" : "שולחן העבודה של המנחה";
    el("v2-me-sub").textContent = "מסלול " + tr + " · " + DAYS[tr];
    var l = sessionsOf(tr), past = 0;
    for (var i = 0; i < l.length; i++) if (l[i].past) past++;
    el("v2-me-n").textContent = l.length ? past + " מתוך " + l.length + " מאחורינו" : "";
    el("sh-track").textContent = (viewer() ? "תצוגה בלבד · " : "") + "שגרירי חדשנות · מסלול " + tr;
    drawRing();

    var h = "";
    for (var j = 0; j < l.length; j++) {
      var s = l[j], miss = missingCount(s);
      var cls = "v2-st" + (s.past ? " done" : s.now ? " now" : s.isUnit ? " unit" : "");
      var mark = s.past ? ico("check", "xs") : esc(s.num);
      var sub = (s.isUnit ? "יחידה · " + esc(shortDate(s.opens || s.date)) + "–" + esc(shortDate(s.dueBy)) : esc(shortDate(s.date)) + (s.now ? " · היום" : "")) +
        (!s.past && miss ? ' · <span class="a-miss">חסרים ' + miss + "</span>" : "");
      h += '<li><button type="button" data-kit="' + esc(s.num) + '"' +
        (A.view === "kit" && Number(s.num) === curNum() ? ' aria-current="true"' : "") + ">" +
        '<span class="' + cls + '" translate="no">' + mark + "</span>" +
        "<span>" + esc(s.topic) + '<small translate="no">' + sub + "</small></span></button></li>";
    }
    el("a-mlist").innerHTML = h || '<li class="a-mempty">' + (A.contentErr[tr] ? "המפגשים לא נטענו" : "טוען…") + "</li>";

    var bs = el("a-nav").querySelectorAll("button[data-av]");
    for (var b = 0; b < bs.length; b++) {
      var k = bs[b].getAttribute("data-av");
      if (k !== "kit" && k === A.view) bs[b].setAttribute("aria-current", "true");
      else bs[b].removeAttribute("aria-current");
    }
    el("a-projlink").href = "proj.html#track=" + encodeURIComponent(tr) + "&n=" + (curNum() || 1);
  }

  function wireSide() {
    el("a-nav").addEventListener("click", function (ev) {
      if (!ev.target.closest) return;
      var kb = ev.target.closest("button[data-kit]");
      if (kb) { drawerOff(); go("kit", Number(kb.getAttribute("data-kit"))); return; }
      var nb = ev.target.closest("button[data-av]");
      if (nb) {
        var v = nb.getAttribute("data-av");
        if (v === "kit") {
          if (A.view !== "kit") { drawerOff(); go("kit", curNum() || (focusOf(track()) || {}).num); return; }
          var li = el("a-nav-kit");
          var open = !li.classList.contains("open");
          li.classList.toggle("open", open);
          nb.setAttribute("aria-expanded", open ? "true" : "false");
          return;
        }
        drawerOff();
        go(v);
        return;
      }
      if (ev.target.closest("#a-projlink")) drawerOff();
    });
  }

  function drawerOff() { if (w.SH_shell && w.SH_shell.drawer) w.SH_shell.drawer(false); }

  /* ------------------------------------------------------------------ */
  /* ניווט                                                              */
  /* ------------------------------------------------------------------ */

  function hashParams() {
    var out = {}, raw = String(w.location.hash || "").replace(/^#/, "");
    raw.split("&").forEach(function (kv) {
      var i = kv.indexOf("=");
      if (i > 0) out[kv.substring(0, i)] = decodeURIComponent(kv.substring(i + 1));
    });
    return out;
  }

  /* go("desk") · go("kit", 4) · go("att", 3, "הובלה") */
  function go(view, n, tr) {
    if (tr || n) select(tr || track(), n || curNum());
    var h = "#v=" + view + (view === "kit" && (n || curNum()) ? "&s=" + (n || curNum()) : "");
    if (w.location.hash === h) route();
    else w.location.hash = h;
  }

  function select(tr, n) {
    if (!w.SH_team || !w.SH_team.select) return;
    w.SH_team.select(tr, n);
    A.ctx.track = tr;
    A.ctx.session = Number(n) || 0;
  }

  var SCREENS = ["a-home", "a-kit", "a-ans", "a-subs", "a-set", "a-people", "a-desk", "a-att"];

  function route() {
    var p = hashParams();
    var v = VIEWS[p.v] ? p.v : "home";
    if (v === "set" && viewer()) v = "home";
    if (v === "kit" && p.s && Number(p.s) !== curNum()) select(track(), Number(p.s));
    /* עשרת המפגשים פתוחים בתפריט רק במסך "מפגשי ההדרכה" — אחרת הם דוחפים
       את שאר הפריטים מתחת לקצה המסך */
    if (v !== A.view) {
      el("a-nav-kit").classList.toggle("open", v === "kit");
      el("a-nav-kit").querySelector("button").setAttribute("aria-expanded", v === "kit" ? "true" : "false");
    }
    A.view = v;

    var gateUp = !el("t-gate").hidden;
    for (var i = 0; i < SCREENS.length; i++) el(SCREENS[i]).hidden = gateUp || SCREENS[i] !== "a-" + v;
    var live = v === "desk" || v === "att";
    el("a-wait").hidden = gateUp || !live || !el("t-body").hidden;
    el("a-ctx").hidden = gateUp || !(live || v === "ans");
    el("a-ctx-t").textContent = "מסלול " + track() + " · מפגש";
    if (!live) el("t-warn").hidden = true;

    renderSide();
    if (gateUp || !A.loaded) return;
    if (v === "home") renderHome();
    else if (v === "kit") renderKit();
    else if (v === "ans") renderAns();
    else if (v === "subs") renderSubs();
    else if (v === "people") renderPeople();
    else if (v === "set") renderSet();
    try { w.scrollTo(0, 0); } catch (e) { /* לא קריטי */ }
  }

  /* SH_team מחזיק את המסלול והמפגש (מתג המסלול, תיבת המפגש, הרשימה החיה).
     כאן רק מקשיבים: כשמשהו השתנה — מציירים מחדש את מה שתלוי בו. */
  function watch() {
    var st = w.SH_team ? w.SH_team.state() : {};
    var k = key();
    if (k !== A.lastKey) {
      A.lastKey = k;
      d.body.classList.toggle("t-viewer", viewer());
      if (k) { A.content = {}; A.home = null; A.people = null; loadContent(); }
    }
    var tr = str(st.track) || A.ctx.track, n = Number(st.session) || 0;
    if (tr !== A.ctx.track || n !== A.ctx.session) {
      var trackChanged = tr !== A.ctx.track;
      A.ctx.track = tr;
      A.ctx.session = n;
      if (A.view === "kit" && n && Number(hashParams().s) !== n) {
        try { w.history.replaceState(null, "", "#v=kit&s=" + n); } catch (e) { /* לא קריטי */ }
      }
      if (A.loaded && (trackChanged || A.view === "kit" || A.view === "ans")) route();
      else renderSide();
    }
    var gateUp = !el("t-gate").hidden;
    if (gateUp !== A.gateUp) { A.gateUp = gateUp; route(); }
    var live = A.view === "desk" || A.view === "att";
    el("a-wait").hidden = gateUp || !live || !el("t-body").hidden;
  }

  /* ------------------------------------------------------------------ */
  /* הבית: שני המסלולים + עבודות שמחכות לי                               */
  /* ------------------------------------------------------------------ */

  function renderHome() {
    var host = el("a-home");
    if (!A.home || Date.now() - A.homeAt > 60000) loadHome();
    var H = A.home || {};
    var h = '<div class="a-head"><p class="v2-eyebrow">שולחן העבודה' + (A.today ? ' · היום <span translate="no">' + esc(shortDate(A.today)) + "</span>" : "") + "</p>" +
      "<h2>שני המסלולים</h2></div>";

    h += '<div class="a-tracks2">' + TRACKS.map(function (tr) { return trackCard(tr, H[tr]); }).join("") + "</div>";

    h += '<div class="v2-card a-queue"><div class="a-qh"><h3>עבודות שמחכות לי</h3>' +
      (A.homeBusy ? '<span class="v2-chip soon">בודקים…</span>' : '<button type="button" class="v2-btn ghost" data-act="home-refresh">רענון</button>') + "</div>";
    var q = queue(H);
    if (!A.home) h += '<p class="v2-note" style="margin:0">אוספים מהקיר, מהנוכחות ומהגיליון…</p>';
    else if (!q.length) h += '<p class="v2-note" style="margin:0">אין כרגע עבודות פתוחות. דפים שיוגשו, "נתקעתי", נוכחות לבדיקה ומפגש שלא אושר יופיעו כאן.</p>';
    else {
      h += '<ul class="a-qlist">' + q.map(function (it) {
        return '<li class="' + (it.hot ? "hot" : "") + '"><span class="ic">' + ico(it.icon) + '</span><span class="tx"><b>' + esc(it.title) + "</b><span>" +
          esc(it.sub) + '</span></span><span class="v2-chip draft">' + esc(it.track) + '</span>' +
          '<button type="button" class="v2-btn" data-go="' + esc(it.go) + '" data-n="' + esc(it.n || "") + '" data-tr="' + esc(it.track) + '">' + esc(it.btn) + "</button></li>";
      }).join("") + "</ul>";
    }
    h += '<p class="a-foot">הגשות היחידות (3, 5, 7) ייכנסו לתור הזה כשהיחידה הראשונה תיפתח, 2.11 בכלים ו-4.11 בהובלה.</p></div>';
    host.innerHTML = h;
  }

  function trackCard(tr, info) {
    var s = focusOf(tr);
    var h = '<div class="v2-card a-tcard' + (tr === track() ? " cur" : "") + '"><div class="a-tch"><b>מסלול ' + esc(tr) + "</b><span>" + esc(DAYS[tr]) + "</span></div>";
    if (A.contentErr[tr]) return h + '<p class="v2-note">המפגשים לא נטענו (' + esc(A.contentErr[tr]) + ").</p></div>";
    if (!s) return h + '<p class="v2-note">טוען…</p></div>';
    var dd = daysUntil(s.isUnit ? (s.opens || s.date) : s.date);
    var when = s.now ? (s.isUnit ? "החלון פתוח עכשיו" : "היום") : s.past ? "התקיים" : dd === null ? "" : dd === 1 ? "מחר" : "בעוד " + dd + " ימים";
    h += '<div class="a-tcs"><span class="v2-chip ' + (s.now ? "now" : "soon") + '">' + esc(when) + "</span>" +
      "<h3>" + (s.isUnit ? "יחידה " : "מפגש ") + '<span translate="no">' + esc(s.num) + "</span> · " + esc(s.topic) + "</h3>" +
      '<p class="a-meta">' + (s.isUnit
        ? "יחידה עצמית · " + esc(shortDate(s.opens)) + "–" + esc(shortDate(s.dueBy))
        : "יום " + esc(dayName(s.date)) + ' · <span translate="no">' + esc(s.date) + "</span>" + (str(s.hours) ? ' · <span dir="ltr" translate="no">' + esc(s.hours) + "</span>" : "")) + "</p></div>";

    var stats = [];
    if (info && info.code && info.code.open) stats.push('<span class="hot">הרישום פתוח · מפגש ' + esc(info.code.session) + "</span>");
    if (info && info.live) stats.push("נרשמו <b>" + (info.live.counts ? info.live.counts.registered : 0) + "</b> מתוך <b>" + esc(info.live.total) + "</b>");
    if (info && info.wall && info.wall.counts) {
      var c = info.wall.counts;
      stats.push("התחילו את הדף <b>" + c.started + "</b>", "הגישו <b>" + c.submitted + "</b>");
      if (c.stuck) stats.push('<span class="hot">נתקעו <b>' + c.stuck + "</b></span>");
    }
    var miss = missingCount(s);
    stats.push(miss ? '<span class="warn">חסרים ' + miss + " תאים בערכה</span>" : '<span class="ok">הערכה מלאה</span>');
    h += '<div class="a-stats">' + stats.join("") + "</div>";

    h += '<div class="v2-row">' +
      '<button type="button" class="v2-btn primary" data-go="desk" data-n="' + esc(s.num) + '" data-tr="' + esc(tr) + '">' + ico("desk") + "שולחן המנחה</button>" +
      '<button type="button" class="v2-btn" data-go="kit" data-n="' + esc(s.num) + '" data-tr="' + esc(tr) + '">' + ico("book") + "ערכת המנחה</button>" +
      '<a class="v2-btn ghost" href="proj.html#track=' + encodeURIComponent(tr) + "&n=" + esc(s.num) + '" target="_blank" rel="noopener">' + ico("slides") + "מצב הקרנה</a></div>";
    return h + "</div>";
  }

  /* התור נבנה ממה שכבר נטען, בלי קריאה נוספת */
  function queue(H) {
    var out = [];
    TRACKS.forEach(function (tr) {
      var T = H[tr] || {};
      (T.walls || []).forEach(function (wl) {
        var sent = 0, stuck = 0;
        (wl.rows || []).forEach(function (r) { if (r.state === "הוגש") sent++; if (r.stuck) stuck++; });
        if (stuck) out.push({ hot: true, icon: "alert", track: tr, n: wl.session, go: "desk", btn: "לקיר",
          title: stuck + (stuck === 1 ? " נתקע/ה" : " נתקעו") + " ולא טופלו · מפגש " + wl.session, sub: "לחיצה על \"טופל\" בקיר מנקה את הסימון" });
        if (sent) out.push({ icon: "studio", track: tr, n: wl.session, go: "desk", btn: "להערכה",
          title: sent + " דפים מלווים ממתינים להערכה · מפגש " + wl.session, sub: "שלוש רמות ומשפט אחד, בקיר של שולחן המנחה" });
      });
      (T.lives || []).forEach(function (lv) {
        var c = lv.counts || {}, pending = 0;
        (lv.registered || []).forEach(function (p) { if (!p.approved) pending++; });
        if (c.review) out.push({ hot: true, icon: "check", track: tr, n: lv.session, go: "att", btn: "לנוכחות",
          title: c.review + " לבדיקה אחרי הצלבת הזום · מפגש " + lv.session, sub: "הכרעה בשם, בסימון ידני" });
        if (pending && lv.past) out.push({ icon: "clock", track: tr, n: lv.session, go: "att", btn: "לאישור",
          title: "מפגש " + lv.session + " נגמר ולא אושר · " + pending + " ממתינים", sub: "בלי האישור הנוכחות לא נכתבת לקובץ של אלנט" });
      });
      /* ערכה חסרה למפגש בשבוע הקרוב */
      sessionsOf(tr).forEach(function (s) {
        if (s.past) return;
        var dd = daysUntil(s.isUnit ? (s.opens || s.date) : s.date);
        if (dd === null || dd > 8) return;
        var miss = gaps(s).filter(function (g) { return !g.ok; });
        if (miss.length) out.push({ icon: "file", track: tr, n: s.num, go: "kit", btn: "לערכה",
          title: "ערכת מפגש " + s.num + " לא מלאה · " + (dd === 0 ? "היום" : dd === 1 ? "מחר" : "בעוד " + dd + " ימים"),
          sub: "חסר בגיליון: " + miss.map(function (g) { return g.label; }).join(" · ") });
      });
    });
    out.sort(function (a, b) { return (b.hot ? 1 : 0) - (a.hot ? 1 : 0); });
    return out;
  }

  function loadHome() {
    if (A.homeBusy || !A.loaded) return;
    A.homeBusy = true;
    var H = {}, jobs = [];
    TRACKS.forEach(function (tr) {
      var T = H[tr] = { walls: [], lives: [] };
      var f = focusOf(tr);
      jobs.push(get("meet", { what: "code", track: tr }).then(function (r) { if (r && r.ok) T.code = r; }).catch(function () {}));
      sessionsOf(tr).forEach(function (s) {
        if (s.locked) return;
        if (s.hasPage) jobs.push(get("page", { what: "wall", track: tr, n: s.num }).then(function (r) {
          if (r && r.ok) { T.walls.push(r); if (f && Number(f.num) === Number(s.num)) T.wall = r; }
        }).catch(function () {}));
        if (!s.isUnit) jobs.push(get("meet", { what: "live", track: tr, n: s.num }).then(function (r) {
          if (r && r.ok) { r.past = !!s.past; T.lives.push(r); if (f && Number(f.num) === Number(s.num)) T.live = r; }
        }).catch(function () {}));
      });
      /* המפגש הבא עוד נעול, אבל "נרשמו מתוך" שלו הוא הרשימה המלאה */
      if (f && f.locked && !f.isUnit) jobs.push(get("meet", { what: "live", track: tr, n: f.num }).then(function (r) { if (r && r.ok) T.live = r; }).catch(function () {}));
    });
    Promise.all(jobs).then(function () {
      A.home = H; A.homeAt = Date.now(); A.homeBusy = false;
      var n = queue(H).filter(function (x) { return x.go === "att"; }).length;
      el("a-n-att").hidden = !n; el("a-n-att").textContent = n;
      if (A.view === "home") renderHome();
    });
  }

  /* ------------------------------------------------------------------ */
  /* מפגשי ההדרכה: ערכת המנחה                                           */
  /* ------------------------------------------------------------------ */

  var TYPE_HE = { short: "טקסט קצר", long: "טקסט ארוך", number: "מספר", choice: "בחירה", multi: "בחירה מרובה", link: "קישור" };

  function exampleMap(raw) {
    var t = str(raw);
    if (!t) return { map: {}, text: "" };
    try {
      var o = JSON.parse(t);
      if (o && typeof o === "object" && typeof o.length !== "number") return { map: o, text: "" };
    } catch (e) { /* טקסט חופשי */ }
    return { map: {}, text: t };
  }

  function renderKit() {
    var host = el("a-kit"), tr = track();
    var n = curNum() || Number(hashParams().s) || (focusOf(tr) || {}).num;
    var s = sessionOf(tr, n);
    if (!s) { host.innerHTML = '<div class="v2-card"><h2>המפגש לא נמצא</h2><p class="v2-note">לבחור מפגש מהתפריט.</p></div>'; return; }

    var who = s.locked ? (s.isUnit ? "נעולה לרכזים עד " : "נעול לרכזים עד ") + shortDate(s.isUnit ? (s.opens || s.date) : s.date)
      : s.now ? (s.isUnit ? "החלון פתוח לרכזים" : "מתקיים היום") : "התקיים";
    var h = '<div class="v2-card v2-mhead"><span class="v2-tag' + (s.now ? "" : " quiet") + '">' + (s.locked ? ico("lock", "xs") + " " : "") + esc(who) + "</span>" +
      "<h2>" + (s.isUnit ? "יחידה " : "מפגש ") + '<span translate="no">' + esc(s.num) + "</span> · " + esc(s.topic) + "</h2>" +
      '<div class="v2-mmeta">' + (s.isUnit
        ? "<span>נפתחת <b translate=\"no\">" + esc(s.opens) + "</b></span><span>הגשה עד <b translate=\"no\">" + esc(s.dueBy) + "</b></span>"
        : "<span>יום <b>" + esc(dayName(s.date)) + '</b></span><span><b translate="no">' + esc(s.date) + "</b></span>" + (str(s.hours) ? '<span><b dir="ltr" translate="no">' + esc(s.hours) + "</b></span>" : "")) +
      (str(s.deliverable) ? "<span>התוצר: <b>" + esc(s.deliverable) + "</b></span>" : "") +
      (str(s.buildsPart) ? "<span>חלק בארגז: <b>" + esc(s.buildsPart) + "</b></span>" : "") +
      (str(s.contentStatus) ? "<span>סטטוס תוכן: <b>" + esc(s.contentStatus) + "</b></span>" : "") + "</div>" +
      '<div class="v2-row" style="margin-top:14px">' +
        '<button type="button" class="v2-btn primary" data-go="desk" data-n="' + esc(s.num) + '">' + ico("desk") + "שולחן המנחה של המפגש</button>" +
        '<a class="v2-btn" href="proj.html#track=' + encodeURIComponent(tr) + "&n=" + esc(s.num) + '" target="_blank" rel="noopener">' + ico("slides") + "מצב הקרנה</a>" +
        (str(s.slides) ? '<a class="v2-btn" href="' + esc(s.slides) + '" target="_blank" rel="noopener">' + ico("slides") + "המצגת</a>" : "") +
        (str(s.zoom) ? '<a class="v2-btn" href="' + esc(s.zoom) + '" target="_blank" rel="noopener">' + ico("video") + "קישור הזום</a>" : "") +
        (s.hasPage ? '<button type="button" class="v2-btn" data-go="ans" data-n="' + esc(s.num) + '">' + ico("chart") + "התשובות</button>" : "") +
        (!viewer() && lsGet(TEST_KEY) ? '<a class="v2-btn ghost" href="index.html?t=' + encodeURIComponent(lsGet(TEST_KEY)) + "#s=" + esc(s.num) + '" target="_blank" rel="noopener">' + ico("ext") + "לפתוח כרכז/ת</a>" : "") +
      "</div></div>";

    /* מה חסר */
    var g = gaps(s), miss = g.filter(function (x) { return !x.ok; }).length;
    h += '<div class="v2-card"><p class="v2-eyebrow">מה חסר בגיליון · לשונית "מפגשים", שורת ' + esc(tr) + " " + esc(s.num) + "</p>" +
      '<ul class="a-gaps">' + g.map(function (x) {
        return '<li class="' + (x.ok ? "ok" : "no") + '">' + (x.ok ? ico("check", "xs") : ico("alert", "xs")) + "<span>" + esc(x.label) + "</span>" +
          (x.ok ? "" : '<em>עמודה "' + esc(x.col) + '"</em>') + "</li>";
      }).join("") + "</ul>" +
      '<p class="a-foot">' + (miss ? miss + " תאים ריקים. הרכזים רואים את מה שממולא מיום " + (s.isUnit ? "פתיחת היחידה" : "המפגש") + "." : "הערכה מלאה.") +
      (str(s.challenge) ? "" : ' "אתגר" ו"סיכום" אינם חובה.') + "</p></div>";

    /* תסריט המנחה */
    h += '<div class="v2-card a-script"><p class="v2-eyebrow">תסריט המנחה</p>' +
      (str(s.script) ? '<div class="a-md">' + mdHtml(s.script) + "</div>"
        : '<p class="v2-note" style="margin:0">עוד אין תסריט בעמודה "תסריט המנחה". הוא נכתב בקובץ הערכה (מפגשי-שגרירים) ונכנס לגיליון ב-applyKits.</p>') + "</div>";

    /* הדף המלווה */
    var ex = exampleMap(s.example);
    h += '<div class="v2-card"><p class="v2-eyebrow">הדף המלווה · מה הרכזים ממלאים' + (s.hasPage ? " · " + s.pageFields.length + " שדות" : "") + "</p>";
    if (s.pageFieldsError) h += '<p class="v2-note bad">JSON השדות שבור (' + esc(s.pageFieldsError) + "). הרכזים יראו \"אין דף מלווה\" עד שיתוקן.</p>";
    else if (!s.hasPage) h += '<p class="v2-note" style="margin:0">למפגש הזה עוד אין שדות.</p>';
    else {
      h += '<ol class="a-fields">' + s.pageFields.map(function (f) {
        return (f.section ? '<li class="sec">' + esc(f.section) + "</li>" : "") +
          '<li class="' + (f.plus ? "plus" : "") + '"><b>' + esc(f.label) + "</b>" +
          '<span class="a-ft">' + esc(TYPE_HE[f.type] || f.type) + (f.required ? " · חובה" : "") + (f.plus ? " · עוד צעד" : "") + "</span>" +
          (f.help ? '<span class="a-fh">' + esc(f.help) + "</span>" : "") +
          (f.options && f.options.length ? '<span class="a-fo">' + f.options.map(function (o) { return "<i>" + esc(o) + "</i>"; }).join("") + "</span>" : "") +
          (f.tip ? '<span class="v2-tip">' + esc(f.tip) + "</span>" : "") +
          (ex.map[f.id] !== undefined ? '<span class="v2-ex"><b>דוגמה פתורה:</b> ' + esc([].concat(ex.map[f.id]).join(" · ")) + "</span>" : "") +
          "</li>";
      }).join("") + "</ol>";
      if (ex.text) h += '<div class="v2-ex"><b>דוגמה פתורה:</b> ' + esc(ex.text) + "</div>";
      if (str(s.challenge)) h += '<div class="v2-plus"><p class="v2-eyebrow">אתגר</p>' + esc(s.challenge) + "</div>";
    }
    h += "</div>";

    /* מה הרכזים רואים בעמוד המפגש */
    var blocks = [
      ["למה זה חשוב", s.why], [s.isUnit ? "צעדי היחידה" : "לפני המפגש · משימת ההכנה", s.isUnit ? s.steps : s.before],
      ["החיבור להמשך", s.bridge], ["סיכום המפגש", s.summary]
    ];
    h += '<div class="v2-card"><p class="v2-eyebrow">מה הרכזים רואים בעמוד המפגש</p><dl class="a-dl">';
    blocks.forEach(function (b) {
      h += "<dt>" + esc(b[0]) + "</dt><dd>" + (str(b[1]) ? esc(b[1]).replace(/\r?\n/g, "<br>") : '<span class="a-empty">ריק</span>') + "</dd>";
    });
    h += "<dt>חומרים</dt><dd>" + (str(s.materials) && w.SH_shell && w.SH_shell.matsHtml ? w.SH_shell.matsHtml(s.materials) : '<span class="a-empty">ריק</span>') + "</dd></dl></div>";

    host.innerHTML = h;
  }

  /* ------------------------------------------------------------------ */
  /* תשובות ומיפוי: הצבירה + הטבלה השמית                                 */
  /* ------------------------------------------------------------------ */

  function renderAns() {
    var host = el("a-ans"), tr = track(), n = curNum();
    var withPage = sessionsOf(tr).filter(function (s) { return s.hasPage; });
    var s = sessionOf(tr, n);
    var pick = withPage.length ? '<div class="v2-row a-sesspick">' + withPage.map(function (x) {
      return '<button type="button" class="v2-btn' + (Number(x.num) === n ? " dark" : "") + '" data-ans="' + esc(x.num) + '">מפגש ' + esc(x.num) + "</button>";
    }).join("") + "</div>" : "";

    if (!s || !s.hasPage) {
      host.innerHTML = '<div class="v2-card"><h2>תשובות ומיפוי</h2><p class="v2-note">' +
        (s ? "למפגש " + esc(s.num) + " אין דף מלווה. " : "") + (withPage.length ? "לבחור מפגש עם דף מלווה:" : "עוד אין מפגש עם דף מלווה במסלול הזה.") + "</p>" + pick + "</div>";
      return;
    }
    var sig = tr + "|" + n;
    if (A.ans.at !== sig) {
      A.ans = { at: sig, wall: null, agg: null, q: "", st: "", field: "", opt: "", busy: true };
      Promise.all([get("page", { what: "wall", track: tr, n: n }), get("page", { what: "aggregate", track: tr, n: n })]).then(function (r) {
        if (A.ans.at !== sig) return;
        A.ans.busy = false;
        A.ans.wall = r[0] && r[0].ok ? r[0] : { error: (r[0] && r[0].error) || "server" };
        A.ans.agg = r[1] && r[1].ok ? r[1] : null;
        if (A.view === "ans") renderAns();
      }).catch(function () { if (A.ans.at === sig) { A.ans.busy = false; A.ans.wall = { error: "network" }; if (A.view === "ans") renderAns(); } });
    }
    var W = A.ans.wall, G = A.ans.agg;
    var h = '<div class="a-head"><p class="v2-eyebrow">מסלול ' + esc(tr) + " · " + (s.isUnit ? "יחידה " : "מפגש ") + esc(n) + "</p><h2>" + esc(s.deliverable || s.topic) + "</h2>" + pick + "</div>";
    if (!W) { host.innerHTML = h + '<div class="v2-card"><p class="v2-note" style="margin:0">טוענים את התשובות…</p></div>'; return; }
    if (W.error) { host.innerHTML = h + '<div class="v2-card"><p class="v2-note bad" style="margin:0">התשובות לא נטענו (' + esc(W.error) + ").</p></div>"; return; }

    var c = W.counts || {};
    h += '<div class="a-kpis"><div><b>' + (G ? G.respondents : c.started) + '</b><span>מילאו משהו</span></div><div><b>' + c.submitted + "</b><span>הגישו</span></div>" +
      "<div><b>" + c.done + "</b><span>השלימו את החובה</span></div><div><b>" + (c.total - c.started) + "</b><span>לא התחילו</span></div><div><b>" + c.total + "</b><span>במסלול</span></div></div>";

    /* הצבירה — אותם גרפים של מצב ההקרנה. לחיצה על שורה מסננת את הטבלה. */
    if (G && G.charts && G.charts.length) {
      h += '<div class="v2-card"><p class="v2-eyebrow">הצבירה · לחיצה על תשובה מסננת את הטבלה</p><div class="a-charts">' + G.charts.map(function (ch) {
        var max = 1;
        ch.options.forEach(function (o) { if (o.count > max) max = o.count; });
        return '<div class="a-chart"><h4>' + esc(ch.label) + " <small>" + ch.answered + " ענו</small></h4>" + ch.options.map(function (o) {
          var on = A.ans.field === ch.id && A.ans.opt === o.label;
          return '<button type="button" class="a-bar' + (on ? " on" : "") + '" data-f="' + esc(ch.id) + '" data-o="' + esc(o.label) + '"><span class="lbl">' + esc(o.label) +
            '</span><span class="trk"><span class="fil" style="width:' + Math.round(100 * o.count / max) + '%"></span></span><span class="n">' + o.count + "</span></button>";
        }).join("") + "</div>";
      }).join("") + "</div></div>";
    }

    /* הטבלה השמית */
    var fields = (W.fields || []).filter(function (f) { return !f.plus; }).concat((W.fields || []).filter(function (f) { return f.plus; }));
    var rows = filteredRows(W);
    var fl = A.ans.field ? fieldBy(W, A.ans.field) : null;
    h += '<div class="v2-card"><div class="a-tbar"><p class="v2-eyebrow" style="margin:0">בית ספר אחרי בית ספר · ' + rows.length + " מתוך " + W.rows.length + "</p>" +
      '<label class="a-search">' + ico("search", "xs") + '<span class="sh-sr">חיפוש</span><input type="search" id="a-q" placeholder="שם או בית ספר" value="' + esc(A.ans.q) + '"></label>' +
      '<select id="a-st" aria-label="סינון לפי מצב">' + [["", "כולם"], ["sent", "הגישו"], ["draft", "בטיוטה"], ["none", "לא התחילו"], ["stuck", "נתקעו"]].map(function (o) {
        return '<option value="' + o[0] + '"' + (A.ans.st === o[0] ? " selected" : "") + ">" + o[1] + "</option>";
      }).join("") + "</select>" +
      (fl ? '<button type="button" class="v2-chip draft a-clear" data-act="ans-clear">' + esc(fl.label) + ": " + esc(A.ans.opt) + " ✕</button>" : "") +
      '<button type="button" class="v2-btn" data-act="ans-csv">' + ico("down") + "ייצוא CSV</button></div>";
    h += '<div class="a-tw"><table class="a-tbl"><thead><tr><th>שם</th><th>בית ספר</th><th>מצב</th><th>מולאו</th>' +
      fields.map(function (f) { return "<th" + (f.plus ? ' class="plus"' : "") + ">" + esc(f.label) + "</th>"; }).join("") + "<th>הערכה</th></tr></thead><tbody>" +
      (rows.map(function (r) {
        return "<tr><td class=\"nm\">" + esc(r.name) + "</td><td class=\"sch\">" + esc(r.school) + "</td><td>" + esc(rowState(r, W)) + '</td><td translate="no">' + r.filled + "/" + r.total + "</td>" +
          fields.map(function (f) { var v = r.values ? r.values[f.id] : ""; return "<td>" + esc(v === undefined ? "" : [].concat(v).join(" · ")) + "</td>"; }).join("") +
          "<td>" + esc(r.level ? r.level + (r.note ? " · " + r.note : "") : "") + "</td></tr>";
      }).join("") || '<tr><td colspan="' + (fields.length + 5) + '" class="a-empty">אין שורות שמתאימות לסינון.</td></tr>') + "</tbody></table></div></div>";
    host.innerHTML = h;
  }

  function fieldBy(W, id) { for (var i = 0; i < W.fields.length; i++) if (W.fields[i].id === id) return W.fields[i]; return null; }

  function rowState(r, W) {
    if (r.stuck) return "נתקע/ה · " + ((W.stuckCats || {})[r.stuck] || r.stuck);
    if (r.state === "הוגש" || r.state === "הוערך" || r.state === "הוחזר") return r.state;
    return r.filled ? "טיוטה" : "לא התחיל/ה";
  }

  function filteredRows(W) {
    var F = A.ans, q = F.q.toLowerCase();
    return (W.rows || []).filter(function (r) {
      if (q && (String(r.name) + " " + String(r.school)).toLowerCase().indexOf(q) < 0) return false;
      if (F.st === "sent" && ["הוגש", "הוערך", "הוחזר"].indexOf(r.state) < 0) return false;
      if (F.st === "draft" && (!r.filled || ["הוגש", "הוערך", "הוחזר"].indexOf(r.state) >= 0)) return false;
      if (F.st === "none" && r.filled) return false;
      if (F.st === "stuck" && !r.stuck) return false;
      if (F.field) {
        var v = r.values ? r.values[F.field] : undefined;
        if (v === undefined || [].concat(v).indexOf(F.opt) < 0) return false;
      }
      return true;
    });
  }

  function ansCsv() {
    var W = A.ans.wall;
    if (!W || !W.rows) return;
    var fields = W.fields || [];
    var rows = filteredRows(W).map(function (r) {
      return [r.name, r.school, rowState(r, W), r.filled + "/" + r.total].concat(fields.map(function (f) {
        var v = r.values ? r.values[f.id] : ""; return v === undefined ? "" : [].concat(v).join(" · ");
      })).concat([r.level, r.note]);
    });
    csvDownload("תשובות-" + track() + "-מפגש-" + curNum() + ".csv",
      ["שם", "בית ספר", "מצב", "מולאו"].concat(fields.map(function (f) { return f.label; })).concat(["הערכה", "משפט"]), rows);
  }

  /* ------------------------------------------------------------------ */
  /* הגשות: המבנה מוכן, המסך המלא נבנה עם היחידה הראשונה                 */
  /* ------------------------------------------------------------------ */

  function renderSubs() {
    var tr = track();
    var units = sessionsOf(tr).filter(function (s) { return s.isUnit; });
    var h = '<div class="a-head"><p class="v2-eyebrow">מסלול ' + esc(tr) + "</p><h2>הגשות היחידות</h2></div>" +
      '<div class="v2-card"><div class="v2-seg" role="group" aria-label="תור הבדיקה"><button type="button" aria-pressed="true">ממתינים</button><button type="button" aria-pressed="false" disabled>הוחזרו</button><button type="button" aria-pressed="false" disabled>אושרו</button></div>' +
      '<p class="v2-note" style="margin-top:14px">כאן יופיע תור הבדיקה של שלוש היחידות העצמיות: תוצר כקובץ או קישור, "מה השתנה בעקבות המשוב", גרסאות, ' +
      'ואישור שלך שנספר כנוכחות "השלים". עד שהיחידה הראשונה נפתחת אין מה להציג.</p>' +
      '<div class="a-tw"><table class="a-tbl"><thead><tr><th>יחידה</th><th>נושא</th><th>החלון</th><th>מצב</th><th>ממתינים</th></tr></thead><tbody>' +
      (units.map(function (s) {
        var st = s.now ? "פתוחה" : s.past ? "נסגרה" : "טרם נפתחה";
        return '<tr><td translate="no">' + esc(s.num) + "</td><td>" + esc(s.topic) + '</td><td translate="no">' + esc(shortDate(s.opens || s.date)) + "–" + esc(shortDate(s.dueBy)) + "</td><td>" + st + "</td><td>—</td></tr>";
      }).join("") || '<tr><td colspan="5" class="a-empty">היחידות לא נטענו.</td></tr>') + "</tbody></table></div></div>";
    el("a-subs").innerHTML = h;
  }

  /* ------------------------------------------------------------------ */
  /* משתתפים וזכאות                                                      */
  /* ------------------------------------------------------------------ */

  function renderPeople() {
    if (!A.elnetStarted && w.SH_elnet) { A.elnetStarted = true; try { w.SH_elnet.start(); } catch (e) { /* המסך הרשמי לא חוסם את הרשימה */ } }
    if (!A.people && !A.peopleBusy) {
      A.peopleBusy = true;
      get("elig", {}).then(function (r) {
        A.peopleBusy = false;
        A.people = r && r.ok ? r : { error: (r && (r.message || r.error)) || "server" };
        if (A.view === "people") renderPeople();
      }).catch(function () { A.peopleBusy = false; A.people = { error: "אין חיבור לשרת" }; if (A.view === "people") renderPeople(); });
    }
    var P = A.people, tr = track(), host = el("a-plist");
    var h = '<div class="a-head"><p class="v2-eyebrow">מסלול ' + esc(tr) + "</p><h2>משתתפים וזכאות</h2></div>";
    if (!P) { host.innerHTML = h + '<div class="v2-card"><p class="v2-note" style="margin:0">טוען…</p></div>'; return; }
    if (P.error) { host.innerHTML = h + '<div class="v2-card"><p class="v2-note bad" style="margin:0">' + esc(P.error) + "</p></div>"; return; }
    var t = null;
    for (var i = 0; i < P.tracks.length; i++) if (P.tracks[i].track === tr) t = P.tracks[i];
    if (!t) { host.innerHTML = h; return; }
    var all = P.tracks.reduce(function (a, x) { return a + x.rows.length; }, 0);
    var inAll = P.tracks.reduce(function (a, x) { return a + x.rows.filter(function (r) { return str(r.lastLogin); }).length; }, 0);
    var never = t.rows.filter(function (r) { return !str(r.lastLogin); });
    var rows = A.peopleOnlyNew ? never : t.rows;
    h += '<div class="a-kpis"><div><b>' + t.rows.length + "</b><span>במסלול " + esc(tr) + "</span></div><div><b>" + (t.rows.length - never.length) + "</b><span>נכנסו למערכת</span></div>" +
      "<div><b>" + never.length + "</b><span>טרם נכנסו</span></div><div><b>" + inAll + "/" + all + "</b><span>בשני המסלולים</span></div>" +
      "<div><b>" + t.counts.risk + "</b><span>בסיכון</span></div></div>";
    h += '<div class="v2-card"><div class="a-tbar"><p class="v2-eyebrow" style="margin:0">כניסה אחרונה ונוכחות</p>' +
      '<label class="a-chk"><input type="checkbox" id="a-onlynew"' + (A.peopleOnlyNew ? " checked" : "") + "> רק מי שטרם נכנס/ה</label>" +
      (never.length && !viewer() ? '<button type="button" class="v2-btn" data-act="copy-never">' + ico("copy") + "העתקת רשימת מי שטרם נכנס</button>" : "") + "</div>" +
      '<div class="a-tw"><table class="a-tbl"><thead><tr><th>שם</th><th>בית ספר</th><th>כניסה אחרונה</th><th>נוכחות</th><th>היעדרויות</th><th>סטטוס</th></tr></thead><tbody>' +
      rows.map(function (r) {
        return '<tr><td class="nm">' + esc(r.name) + '</td><td class="sch">' + esc(r.school) + '</td><td translate="no">' + (str(r.lastLogin) ? esc(r.lastLogin) : '<span class="a-empty">טרם נכנס/ה</span>') +
          '</td><td translate="no">' + r.present + " מתוך " + t.sessionsHeld + '</td><td translate="no">' + (r.absences || "") + "</td><td>" + esc(r.status) + "</td></tr>";
      }).join("") + "</tbody></table></div></div>" +
      '<p class="v2-eyebrow a-elh">מסך אלנט · כמו שאלנט רואה אותו</p>';
    host.innerHTML = h;
  }

  function copyNever() {
    var P = A.people, tr = track(), t = null;
    if (!P || !P.tracks) return;
    for (var i = 0; i < P.tracks.length; i++) if (P.tracks[i].track === tr) t = P.tracks[i];
    if (!t) return;
    var never = t.rows.filter(function (r) { return !str(r.lastLogin); });
    copyText("טרם נכנסו למערכת · מסלול " + tr + " (" + never.length + "):\n" +
      never.map(function (r) { return "· " + r.name + " — " + r.school; }).join("\n"), "הרשימה הועתקה · " + never.length + " שמות");
  }

  /* ------------------------------------------------------------------ */
  /* הגדרות (מיטל בלבד)                                                 */
  /* ------------------------------------------------------------------ */

  function renderSet() {
    var P = A.people, r = P && P.rules;
    if (!P && !A.peopleBusy) renderPeopleDataOnly();
    var h = '<div class="a-head"><p class="v2-eyebrow">מיטל בלבד</p><h2>הגדרות</h2></div>' +
      '<div class="v2-card"><p class="v2-eyebrow">הכללים כרגע</p>' +
      (r ? '<dl class="a-dl"><dt>סף נוכחות</dt><dd>' + esc(r.minSessions) + " מפגשים</dd><dt>יחידות</dt><dd>" + esc(r.minUnits) + "</dd><dt>מיקרו-הדרכה</dt><dd>" + (r.needMicro ? "נדרשת" : "לא נדרשת") +
        "</dd><dt>ציון עובר</dt><dd>" + esc(r.passScore) + "</dd><dt>בסיכון מ-</dt><dd>" + esc(r.riskAbsences) + " היעדרויות</dd><dt>אלנט רואה הגשות</dt><dd>" + (r.seesSubmissions ? "כן" : "לא") + "</dd></dl>"
        : '<p class="v2-note" style="margin:0">טוען…</p>') +
      '<p class="a-foot">הכללים (וגם אורך הקוד, codeMinutes) משתנים בלשונית "הגדרות" בגיליון, בלי פריסה מחדש.</p></div>' +
      '<div class="v2-card"><p class="v2-eyebrow">לפתוח כרכז/ת</p>' +
      '<p class="v2-note">מפתח אישי של משתתף/ת בדיקה. נשמר רק בדפדפן הזה, ומוסיף כפתור "לפתוח כרכז/ת" בכל מפגש.</p>' +
      '<div class="v2-row"><input type="text" id="a-testkey" class="a-in" dir="ltr" autocomplete="off" spellcheck="false" placeholder="test-key-…" value="' + esc(lsGet(TEST_KEY)) + '">' +
      '<button type="button" class="v2-btn" data-act="testkey-save">שמירה</button>' +
      (lsGet(TEST_KEY) ? '<a class="v2-btn primary" href="index.html?t=' + encodeURIComponent(lsGet(TEST_KEY)) + '" target="_blank" rel="noopener">' + ico("ext") + "פתיחה</a>" : "") + "</div></div>" +
      '<div class="v2-card"><p class="v2-eyebrow">הדפדפן הזה</p>' +
      '<p class="v2-note">המפתח שלך שמור בדפדפן, ולכן index.html נפתח כאן ישר לשולחן העבודה. הקישורים הישנים (team.html, elnet.html) מובילים לכאן.</p>' +
      '<button type="button" class="v2-btn" data-act="logout">יציאה מהדפדפן הזה</button></div>';
    el("a-set").innerHTML = h;
  }

  function renderPeopleDataOnly() {
    A.peopleBusy = true;
    get("elig", {}).then(function (r) {
      A.peopleBusy = false;
      A.people = r && r.ok ? r : { error: (r && (r.message || r.error)) || "server" };
      if (A.view === "set") renderSet();
    }).catch(function () { A.peopleBusy = false; });
  }

  /* ------------------------------------------------------------------ */
  /* לחיצות                                                             */
  /* ------------------------------------------------------------------ */

  function wireMain() {
    var adm = el("adm");
    adm.addEventListener("click", function (ev) {
      if (!ev.target.closest) return;
      var g = ev.target.closest("[data-go]");
      if (g) {
        var v = g.getAttribute("data-go"), n = Number(g.getAttribute("data-n")) || 0, tr = g.getAttribute("data-tr") || track();
        go(v, n, tr);
        return;
      }
      var an = ev.target.closest("[data-ans]");
      if (an) { select(track(), Number(an.getAttribute("data-ans"))); route(); return; }
      var bar = ev.target.closest(".a-bar");
      if (bar) {
        var f = bar.getAttribute("data-f"), o = bar.getAttribute("data-o");
        var same = A.ans.field === f && A.ans.opt === o;
        A.ans.field = same ? "" : f; A.ans.opt = same ? "" : o;
        renderAns();
        return;
      }
      var act = ev.target.closest("[data-act]");
      if (!act) return;
      var a = act.getAttribute("data-act");
      if (a === "home-refresh") { A.homeAt = 0; loadContent(); }
      else if (a === "ans-csv") ansCsv();
      else if (a === "ans-clear") { A.ans.field = ""; A.ans.opt = ""; renderAns(); }
      else if (a === "copy-never") copyNever();
      else if (a === "testkey-save") { lsSet(TEST_KEY, str(el("a-testkey").value)); toast("נשמר בדפדפן הזה"); renderSet(); }
      else if (a === "logout") {
        if (!w.confirm("להוציא את המפתח מהדפדפן הזה? בכניסה הבאה צריך את הקישור שוב.")) return;
        lsSet(TEAM_KEY, ""); w.location.replace(w.location.pathname);
      }
    });
    adm.addEventListener("input", function (ev) {
      if (ev.target.id === "a-q") {
        A.ans.q = ev.target.value;
        var pos = ev.target.selectionStart;
        renderAns();
        var q = el("a-q"); if (q) { q.focus(); try { q.setSelectionRange(pos, pos); } catch (e) { /* לא קריטי */ } }
      }
    });
    adm.addEventListener("change", function (ev) {
      if (ev.target.id === "a-st") { A.ans.st = ev.target.value; renderAns(); }
      else if (ev.target.id === "a-onlynew") { A.peopleOnlyNew = ev.target.checked; renderPeople(); }
    });
  }

  /* ------------------------------------------------------------------ */
  /* הפעלה                                                              */
  /* ------------------------------------------------------------------ */

  function addCss(href, before) {
    if (d.querySelector('link[href="' + href + '"]')) return;
    var l = d.createElement("link");
    l.rel = "stylesheet"; l.href = href;
    d.head.insertBefore(l, before);
  }

  function start() {
    if (A.started) return;
    A.started = true;

    /* team.css ו-desk.css לפני admin.css, כדי ש-admin.css יתקן את מה שמתנגש */
    var mine = el("admin-css");
    addCss("assets/team.css", mine);
    addCss("assets/desk.css", mine);

    d.body.classList.add("is-admin");
    el("v2-nav").hidden = true;
    el("a-side").hidden = false;
    ["v2-session", "v2-page", "v2-other"].forEach(function (id) { el(id).hidden = true; });
    el("adm").hidden = false;
    el("sh-boot").hidden = true;
    el("v2-wrap").hidden = false;

    wireSide();
    wireMain();

    w.SH_team.start({ tracks: TRACKS });
    if (w.SH_zoom) w.SH_zoom.start();
    if (w.SH_desk) w.SH_desk.start({ host: el("dk-host"), wallHost: el("dk-wallhost") });

    var st = w.SH_team.state();
    A.ctx.track = str(st.track) || TRACKS[0];
    A.ctx.session = Number(st.session) || 0;
    A.gateUp = !el("t-gate").hidden;

    w.addEventListener("hashchange", route);
    w.setInterval(watch, 700);
    watch();
    route();
  }

  w.SH_admin = {
    start: start,
    go: go,
    md: mdHtml,
    gaps: gaps,
    state: function () { return { view: A.view, track: track(), session: curNum(), loaded: A.loaded, viewer: viewer() }; }
  };
})(window, document);
