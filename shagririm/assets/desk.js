/**
 * שגרירי חדשנות טכנולוגית — גרסה 2: שולחן המנחה (תוספת ל-team.html).
 * האפיון: רויטל\אפיון-מערכת-למידה-שגרירים-v2.md, סעיף 4.3 והכרעות 3, 10, 16.
 * המראה:  רויטל\מוקאפ-מערכת-שגרירים-v3.html, המסך "שולחן המנחה".
 *
 * מה נוסף מעל מסך "היום" הקיים, בלי לשנות אותו:
 *   · פס דביק למעלה: הקוד הגדול (מועתק מ-#t-code), חמש הפעימות עם "השלב הבא"
 *     (stepSet, מזיז את כל המסכים), מוני "נרשמו" ו"נתקעתי" לפי קטגוריה, וכפתור
 *     למצב ההקרנה.
 *   · קיר הדפים המלווים (?mode=page&what=wall, פולינג 20 שניות): התקדמות לפי
 *     שדות, "סיים/ה מוקדם", "נתקעתי", זרקור, "לשדך לעזרה" (סימון בקיר בלבד —
 *     מיטל מטפלת בזום). אחרי המפגש אותו קיר הוא תור ההערכה: שלוש רמות ומשפט.
 *
 * ההצלבה מול זום והאישור נשארים ב-attend.js ו-zoom-import.js כמו שהם.
 * המפתח: אותו מפתח שמסך "היום" שמר (shag.teamkey). אין כאן מפתח בקוד.
 */
(function (w, d) {
  "use strict";

  var POLL_MS = 20000;
  var BEATS = [
    { t: "מה קרה מאז", m: 10 }, { t: "ידע", m: 30 }, { t: "סטודיו", m: 60 }, { t: "זרקור", m: 15 }, { t: "לקחת הביתה", m: 10 }
  ];
  var LS_PAIR = "shag.desk.pairs.";   /* "לשדך לעזרה" — סימון מקומי בלבד */

  var ERR = {
    badkey: "המפתח לא זוהה.", badtrack: "מסלול לא מזוהה.", nonum: "לא נבחר מפגש.",
    nomeeting: "המפגש לא קיים במסלול.", badstep: "שלב לא חוקי.", badlevel: "רמה לא מוכרת.",
    norow: "לרכז/ת הזה/זו עוד אין שורה בדף המלווה.", busy: "המערכת עסוקה. לנסות שוב בעוד רגע.",
    server: "השרת החזיר שגיאה.", network: "אין חיבור לשרת."
  };
  function errText(c) { return ERR[String(c || "")] || ERR.server; }

  function el(id) { return d.getElementById(id); }
  function esc(s) {
    return String(s === undefined || s === null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function str(v) { return String(v === undefined || v === null ? "" : v).trim(); }

  var D = { key: "", track: "", session: 0, wall: null, poll: null, gen: 0, spot: "", assessing: "", pairs: {} };

  function keyGet() { try { return w.localStorage.getItem("shag.teamkey") || ""; } catch (e) { return ""; } }

  function api(body) {
    var o = { key: D.key, track: D.track, n: D.session };
    for (var k in (body || {})) if (Object.prototype.hasOwnProperty.call(body, k)) o[k] = body[k];
    return w.SH_auth.post(o);
  }

  function apiGet(what) {
    return w.SH_auth.fetchJson(w.SH_auth.API + "?mode=page&what=" + what + "&key=" + encodeURIComponent(D.key) +
      "&track=" + encodeURIComponent(D.track) + "&n=" + D.session + "&_=" + Date.now());
  }

  function toast(text, bad) {
    var box = el("t-toast");
    if (!box) return;
    box.textContent = text;
    box.className = "t-toast on" + (bad ? " bad" : "");
    w.clearTimeout(toast.t);
    toast.t = w.setTimeout(function () { box.className = "t-toast"; }, 3200);
  }

  /* ---------------------------- הפס הדביק ---------------------------- */

  function beatsHtml(step) {
    var h = "";
    for (var i = 0; i < BEATS.length; i++) {
      var name = (i === 0 && D.session === 1) ? "פתיחה" : BEATS[i].t;
      var cls = step && i + 1 < step ? " done" : step && i + 1 === step ? " now" : "";
      h += '<button type="button" class="dk-beat' + cls + '" data-step="' + (i + 1) + '" title="לעבור לפעימה הזאת">' +
        '<span class="t" translate="no">' + (i + 1) + " · " + BEATS[i].m + " דק׳</span><b>" + esc(name) + "</b></button>";
    }
    return h;
  }

  function renderDesk() {
    var W = D.wall, c = W ? W.counts : null;
    var step = W ? Number(W.step) || 0 : 0;
    el("dk-beats").innerHTML = beatsHtml(step);
    el("dk-next").disabled = step >= BEATS.length;
    el("dk-next").textContent = step === 0 ? "התחלת המפגש · פעימה 1" : step >= BEATS.length ? "המפגש הסתיים" : "השלב הבא ←";
    el("dk-stepnote").textContent = step ? "כל המסכים של המסלול על פעימה " + step : "השלב החי כבוי. הרכזים לא רואים פס פעימות.";

    var codeTxt = str(el("t-code") && el("t-code").textContent) || "— — — —";
    el("dk-code").textContent = codeTxt;
    el("dk-codenote").textContent = str(el("t-note") && el("t-note").textContent);

    if (!c) { el("dk-counters").innerHTML = ""; return; }
    var reg = str(el("t-nReg") && el("t-nReg").textContent) || "0";
    var h = "<span>נרשמו <b>" + esc(reg) + "</b> מתוך <b>" + c.total + "</b></span>" +
      "<span>התחילו את הדף <b>" + c.started + "</b></span><span>סיימו <b>" + c.done + "</b></span><span>הגישו <b>" + c.submitted + "</b></span>" +
      '<span class="' + (c.stuck ? "warn" : "") + '">נתקעתי <b>' + c.stuck + "</b></span>";
    var cats = W.stuckCats || {};
    for (var k in c.byCat) if (Object.prototype.hasOwnProperty.call(c.byCat, k) && c.byCat[k]) h += "<span>· " + esc(cats[k] || k) + " <b>" + c.byCat[k] + "</b></span>";
    el("dk-counters").innerHTML = h;
  }

  function setStep(step) {
    var gen = ++D.gen;
    api({ action: "stepSet", step: step }).then(function (r) {
      if (gen !== D.gen) return;
      if (!r || !r.ok) { toast(errText(r && r.error), true); return; }
      if (D.wall) D.wall.step = r.step;
      renderDesk();
      toast(r.step ? "פעימה " + r.step + " דולקת אצל כולם" : "השלב החי כבוי");
    }).catch(function () { toast(ERR.network, true); });
  }

  /* ---------------------------- הקיר ---------------------------- */

  function ago(stamp) {
    var m = /(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})/.exec(str(stamp));
    if (!m) return "";
    var t = new Date(+m[3], m[2] - 1, +m[1], +m[4], +m[5], +m[6]).getTime();
    var sec = Math.round((Date.now() - t) / 1000);
    if (sec < 60) return "עכשיו";
    var min = Math.round(sec / 60);
    return min < 60 ? "לפני " + min + " דק׳" : "לפני " + Math.round(min / 60) + " שע׳";
  }

  function firstText(row, fields) {
    for (var i = 0; i < fields.length; i++) {
      var f = fields[i], v = row.values[f.id];
      if ((f.type === "short" || f.type === "long") && str(v)) return { label: f.label, value: str(v) };
    }
    return null;
  }

  function renderWall() {
    var W = D.wall, host = el("dk-wall");
    if (!W) return;
    if (W.fieldsError) {
      host.innerHTML = '<p class="dk-empty">שדות הדף המלווה של המפגש הזה לא תקינים (' + esc(W.fieldsError) + "). לתקן בגיליון, לשונית מפגשים.</p>";
      return;
    }
    if (!W.fields.length) {
      host.innerHTML = '<p class="dk-empty">למפגש הזה אין דף מלווה. הקיר נשאר ריק.</p>';
      return;
    }
    var cats = W.stuckCats || {};
    var rows = W.rows.slice(0).sort(function (a, b) {
      /* נתקעתי קודם, אחר כך מי שהגיש, אחר כך לפי התקדמות */
      if (!!a.stuck !== !!b.stuck) return a.stuck ? -1 : 1;
      return b.filled - a.filled;
    });
    var h = "";
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i], lit = r.sid === D.spot, pair = D.pairs[r.sid];
      var tx = firstText(r, W.fields);
      var flags = "";
      if (r.stuck) flags += '<span class="v2-chip due">נתקעתי · ' + esc(cats[r.stuck] || r.stuck) + "</span>";
      if (r.done && r.state !== "הוגש" && r.state !== "הוערך") flags += '<span class="v2-chip done">סיים/ה</span>';
      if (r.state === "הוגש") flags += '<span class="v2-chip done">הוגש' + (r.submittedAt ? " · " + esc(ago(r.submittedAt)) : "") + "</span>";
      if (r.state === "הוערך" || r.state === "הוחזר") flags += '<span class="v2-chip ' + (r.state === "הוחזר" ? "due" : "done") + '">' + esc(r.state) + (r.level ? " · " + esc(r.level) : "") + "</span>";
      if (pair) flags += '<span class="v2-chip draft">משודך/ת לעזרה עם ' + esc(pair) + "</span>";
      h += '<div class="dk-w' + (lit ? " lit" : "") + (r.stuck ? " stuck" : "") + '" data-sid="' + esc(r.sid) + '">' +
        "<b>" + esc(r.name) + "</b><span class=\"sch\">" + esc(r.school) + "</span>" +
        '<span class="prog" translate="no">' + r.filled + " מתוך " + r.total + (r.savedAt ? " · " + esc(ago(r.savedAt)) : r.filled ? "" : " · לא התחיל/ה") + "</span>" +
        (tx ? '<span class="tx"><i>' + esc(tx.label) + ":</i> " + esc(tx.value) + "</span>" : "") +
        (flags ? '<span class="flags">' + flags + "</span>" : "") +
        '<span class="acts">' +
          '<button type="button" data-act="spot"' + (r.filled ? "" : " disabled") + ">" + (lit ? "הורדה מהזרקור" : "זרקור") + "</button>" +
          (r.stuck ? '<button type="button" data-act="pair">לשדך לעזרה</button><button type="button" data-act="clear">טופל</button>' : "") +
          (r.filled ? '<button type="button" data-act="assess">' + (r.level ? "הערכה מחדש" : "הערכה") + "</button>" : "") +
        "</span>" +
        (D.assessing === r.sid ? assessForm(r, W.levels) : "") +
        "</div>";
    }
    host.innerHTML = h || '<p class="dk-empty">אין משתתפים במסלול.</p>';
  }

  function assessForm(r, levels) {
    var vals = "";
    for (var i = 0; i < D.wall.fields.length; i++) {
      var f = D.wall.fields[i], v = r.values[f.id];
      if (v === undefined) continue;
      vals += "<li><i>" + esc(f.label) + ":</i> " + esc(typeof v === "object" ? v.join(" · ") : v) + "</li>";
    }
    return '<div class="dk-assess"><ul>' + vals + "</ul><div class=\"lv\">" +
      levels.map(function (l) { return '<button type="button" data-level="' + esc(l) + '" aria-pressed="' + (r.level === l ? "true" : "false") + '">' + esc(l) + "</button>"; }).join("") +
      '</div><input type="text" id="dk-note" maxlength="400" placeholder="משפט אחד לרכז/ת" value="' + esc(r.note) + '">' +
      '<label class="bk"><input type="checkbox" id="dk-back"> להחזיר לתיקון (הדף נפתח שוב לעריכה)</label>' +
      '<div class="acts"><button type="button" data-act="save-assess" class="primary">שמירת ההערכה</button><button type="button" data-act="close-assess">סגירה</button></div></div>';
  }

  function loadWall() {
    if (!D.key || !D.track || !D.session || d.hidden) return Promise.resolve();
    var gen = ++D.gen;
    return apiGet("wall").then(function (r) {
      if (gen !== D.gen) return;
      if (!r || !r.ok) { el("dk-wall").innerHTML = '<p class="dk-empty">' + esc(errText(r && r.error)) + "</p>"; return; }
      D.wall = r;
      D.spot = str(r.spot);
      renderDesk();
      renderWall();
    }).catch(function () { /* הפולינג הבא בעוד 20 שניות */ });
  }

  function wallClick(ev) {
    var b = ev.target.closest ? ev.target.closest("button") : null;
    var card = ev.target.closest ? ev.target.closest(".dk-w") : null;
    if (!b || !card) return;
    var sid = card.getAttribute("data-sid"), act = b.getAttribute("data-act");
    var row = null;
    for (var i = 0; i < D.wall.rows.length; i++) if (D.wall.rows[i].sid === sid) row = D.wall.rows[i];

    if (act === "spot") {
      var want = D.spot === sid ? "" : sid;
      api({ action: "spotSet", sid: want }).then(function (r) {
        if (!r || !r.ok) { toast(errText(r && r.error), true); return; }
        D.spot = want; renderWall();
        toast(want ? "בזרקור. מצב ההקרנה מציג את הדף בלי שם." : "הזרקור כבה");
      }).catch(function () { toast(ERR.network, true); });
    } else if (act === "clear") {
      api({ action: "stuckClear", sid: sid }).then(function (r) {
        if (!r || !r.ok) { toast(errText(r && r.error), true); return; }
        loadWall();
      }).catch(function () { toast(ERR.network, true); });
    } else if (act === "pair") {
      /* סימון בקיר בלבד. מיטל פותחת חדר או צ'אט בזום. עמית = רכז אחר מאותו מסלול שסיים. */
      var peer = null;
      for (var j = 0; j < D.wall.rows.length; j++) {
        var c = D.wall.rows[j];
        if (c.sid !== sid && c.done && !c.stuck && !D.pairs[c.sid]) { peer = c; break; }
      }
      if (!peer) { toast("אין כרגע מי שסיים ופנוי לעזור.", true); return; }
      D.pairs[sid] = peer.name; D.pairs[peer.sid] = row ? row.name : "";
      try { w.localStorage.setItem(LS_PAIR + D.track + "." + D.session, JSON.stringify(D.pairs)); } catch (e) { /* לא קריטי */ }
      renderWall();
      toast(peer.name + " מסומן/ת לעזור. לפתוח להם חדר בזום.");
    } else if (act === "assess") {
      D.assessing = D.assessing === sid ? "" : sid; renderWall();
    } else if (act === "close-assess") {
      D.assessing = ""; renderWall();
    } else if (b.getAttribute("data-level")) {
      var lv = card.querySelectorAll("[data-level]");
      for (var k = 0; k < lv.length; k++) lv[k].setAttribute("aria-pressed", lv[k] === b ? "true" : "false");
    } else if (act === "save-assess") {
      var chosen = card.querySelector('[data-level][aria-pressed="true"]');
      if (!chosen) { toast("לבחור רמה.", true); return; }
      var back = el("dk-back") && el("dk-back").checked;
      api({ action: "pageAssess", sid: sid, level: chosen.getAttribute("data-level"), note: el("dk-note").value, back: back ? "כן" : "לא" })
        .then(function (r) {
          if (!r || !r.ok) { toast(errText(r && r.error), true); return; }
          D.assessing = ""; toast("ההערכה נשמרה" + (back ? " והדף חזר לרכז/ת" : ""));
          loadWall();
        }).catch(function () { toast(ERR.network, true); });
    }
  }

  /* ---------------------------- חיבור למסך "היום" ---------------------------- */

  function sync() {
    var st = w.SH_team ? w.SH_team.state() : {};
    var key = keyGet();
    var changed = key !== D.key || st.track !== D.track || Number(st.session) !== D.session;
    D.key = key; D.track = str(st.track); D.session = Number(st.session) || 0;
    var body = el("t-body");
    el("dk-desk").hidden = !(body && !body.hidden && D.key && D.session);
    el("dk-walltile").hidden = el("dk-desk").hidden;
    if (changed) {
      D.wall = null; D.assessing = "";
      try { D.pairs = JSON.parse(w.localStorage.getItem(LS_PAIR + D.track + "." + D.session) || "{}") || {}; } catch (e) { D.pairs = {}; }
      el("dk-proj").href = "proj.html#track=" + encodeURIComponent(D.track) + "&n=" + D.session;
      loadWall();
    }
    renderDesk();
  }

  function build() {
    var stage = d.querySelector(".stage");
    if (!stage) return;
    var desk = d.createElement("div");
    desk.className = "dk-desk"; desk.id = "dk-desk"; desk.hidden = true;
    desk.innerHTML =
      '<div class="dk-row">' +
        '<div class="dk-code" translate="no"><b id="dk-code">— — — —</b><small id="dk-codenote"></small></div>' +
        '<div class="dk-step"><div class="dk-beats" id="dk-beats"></div>' +
          '<div class="dk-ctl"><button type="button" id="dk-next">השלב הבא ←</button><span id="dk-stepnote"></span></div></div>' +
        '<div class="dk-acts"><a class="dk-btn primary" id="dk-proj" href="proj.html" target="_blank" rel="noopener">מצב הקרנה</a>' +
          '<button type="button" class="dk-btn" id="dk-off">כיבוי השלב החי</button></div>' +
      '</div><div class="dk-counters" id="dk-counters"></div>';
    stage.insertBefore(desk, stage.firstChild);

    var tile = d.createElement("section");
    tile.className = "tile dk-walltile"; tile.id = "dk-walltile"; tile.hidden = true;
    tile.innerHTML = '<h3>קיר הסטודיו · הדפים המלווים בזמן אמת</h3>' +
      '<p class="legend">"זרקור" מעלה תוצר למצב ההקרנה בלי שם · "לשדך לעזרה" מסמן בקיר בלבד · אחרי המפגש: "הערכה" עם שלוש רמות ומשפט</p>' +
      '<div class="dk-wall" id="dk-wall"><p class="dk-empty">טוען…</p></div>';
    var bento = d.querySelector(".bento");
    if (bento) bento.parentNode.insertBefore(tile, bento);

    el("dk-beats").addEventListener("click", function (ev) {
      var b = ev.target.closest ? ev.target.closest("button[data-step]") : null;
      if (b) setStep(Number(b.getAttribute("data-step")));
    });
    el("dk-next").addEventListener("click", function () { setStep(Math.min(BEATS.length, (D.wall ? Number(D.wall.step) || 0 : 0) + 1)); });
    el("dk-off").addEventListener("click", function () { setStep(0); });
    el("dk-wall").addEventListener("click", wallClick);

    w.setInterval(sync, 1000);
    D.poll = w.setInterval(loadWall, POLL_MS);
    d.addEventListener("visibilitychange", function () { if (!d.hidden) loadWall(); });
    sync();
  }

  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", build);
  else build();

  w.SH_desk = { reload: loadWall, state: function () { return { track: D.track, session: D.session, step: D.wall ? D.wall.step : 0, spot: D.spot }; } };
})(window, document);
