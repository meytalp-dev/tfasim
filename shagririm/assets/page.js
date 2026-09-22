/**
 * שגרירי חדשנות טכנולוגית — גרסה 2: הדף המלווה.
 * האפיון: רויטל\אפיון-מערכת-למידה-שגרירים-v2.md, סעיף 8 (הכרעות 9, 10, 16).
 * המראה:  רויטל\מוקאפ-מערכת-שגרירים-v3.html, המסך "הדף המלווה".
 *
 * עמוד עבודה מובנה לכל מפגש. השדות מגיעים מהשרת (מיטל מגדירה אותם בגיליון),
 * ולכן אין כאן שום שדה קבוע: אותו קוד מרנדר את מפת הפתיחה של מפגש 1 ואת
 * קנבס הפיילוט של הובלה 6.
 *
 * שלושה מנגנונים ששומרים על העבודה של המשתתף:
 *   1. localStorage בכל הקלדה. synced:false = יש כאן משהו שהשרת עוד לא קיבל,
 *      ובטעינה הבאה הוא גובר על מה שבשרת ונשלח מחדש.
 *   2. שמירה לשרת כל 60 שניות, רק אם משהו השתנה, וגם כשהלשונית מוסתרת.
 *   3. מונה דורות: כל שמירה נושאת מספר, ותשובה של דור ישן נזרקת. בלי זה
 *      תשובה איטית הייתה מסמנת "נשמר" על טקסט שכבר השתנה.
 *
 * "הגשה" רק נועלת לתצוגה ואומרת למיטל "תסתכלי". אפשר לבטל עד שהיא העריכה.
 * מצב העבודה (עם דוגמה פתורה / לבד / עוד צעד) נשמר, אבל אינו נחשף לאף אחד.
 * "נתקעתי": לחיצה וקטגוריה, בלי טקסט.
 *
 * שימוש (shell.js):  SH_page.open(host, session, { track, beats, onBack, onStep, onInfo })
 */
(function (w, d) {
  "use strict";

  var SAVE_MS = 60000;
  var LS_PRE = "shag.page.";

  var MODE_LABEL = { "דוגמה": "עם דוגמה פתורה", "לבד": "לבד", "צעד": "עוד צעד" };

  /* כל שגיאה שהשרת יכול להחזיר כאן, בעברית ועם מה לעשות */
  var ERR = {
    badkey: "הקישור האישי לא זוהה. כדאי לפתוח שוב את הקישור שנשלח אליך.",
    nosession: "הכניסה פגה. מה שכתבת שמור בדפדפן הזה. לרענן את הדף, להיכנס שוב, והכול יחזור.",
    nonum: "לא ברור לאיזה מפגש הדף שייך. כדאי לחזור לעמוד המפגש ולפתוח משם.",
    nomeeting: "המפגש הזה לא נמצא במסלול שלך.",
    locked: "הדף המלווה של המפגש הזה נפתח ביום המפגש.",
    nopage: "למפגש הזה עוד לא הוגדר דף מלווה.",
    submitted: "הדף כבר הוגש, ולכן הוא נעול לעריכה. אפשר לבטל את ההגשה ולהמשיך לעבוד.",
    assessed: "מיטל כבר העריכה את הדף, ולכן אי אפשר לבטל את ההגשה.",
    required: "חסרים שדות חובה. הם מסומנים באדום.",
    toolong: "הטקסט ארוך מדי לשמירה. כדאי לקצר שדה אחד.",
    badcat: "הקטגוריה לא זוהתה. לנסות שוב.",
    norow: "עוד לא נשמר כלום בדף הזה.",
    busy: "המערכת עסוקה ברגע זה. מה שכתבת שמור בדפדפן, והשמירה תנסה שוב לבד בעוד דקה.",
    server: "השרת החזיר שגיאה. מה שכתבת שמור בדפדפן, והשמירה תנסה שוב לבד.",
    network: "אין חיבור לשרת. מה שכתבת שמור בדפדפן הזה, והשמירה תנסה שוב לבד."
  };

  function errText(code) { return ERR[String(code || "")] || ERR.server; }

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

  /* ------------------------------------------------------------------ */
  /* מצב הדף הפתוח. אחד בכל רגע.                                        */
  /* ------------------------------------------------------------------ */

  var P = null;

  function blank() {
    return {
      host: null, s: null, opts: {}, data: null,
      values: {}, mode: "לבד", dirty: false, gen: 0, applied: 0, sending: false,
      timer: null, clock: null, savedAtMs: 0, stuck: "", stuckOpen: false, closed: false
    };
  }

  function lsKey() { return LS_PRE + str(P.opts.track) + "." + P.s.num; }

  function backupWrite(synced) {
    lsSet(lsKey(), JSON.stringify({ values: P.values, mode: P.mode, synced: !!synced, at: Date.now() }));
  }

  function backupRead() {
    var raw = lsGet(lsKey());
    if (!raw) return null;
    try {
      var o = JSON.parse(raw);
      return (o && typeof o.values === "object") ? o : null;
    } catch (e) { return null; }
  }

  /* ------------------------------------------------------------------ */
  /* ספירה                                                              */
  /* ------------------------------------------------------------------ */

  function has(f) {
    var v = P.values[f.id];
    if (v === undefined || v === null) return false;
    if (typeof v === "object") return v.length > 0;
    return str(v) !== "";
  }

  function counted() { return P.data.fields.filter(function (f) { return !f.plus; }); }

  function filled() { return counted().filter(has).length; }

  function canEdit() { return !!(P.data && P.data.canEdit); }

  /* ------------------------------------------------------------------ */
  /* רנדור                                                              */
  /* ------------------------------------------------------------------ */

  function fieldHtml(f) {
    var id = "cp-" + f.id, v = P.values[f.id], ro = canEdit() ? "" : " disabled";
    var label = '<b class="q">' + esc(f.label) + (f.required ? ' <span class="req" title="שדה חובה">*</span>' : "") + "</b>" +
      (str(f.help) || !f.required ? '<span class="hlp">' + esc(f.help) + (!f.required && !f.plus ? (str(f.help) ? " · " : "") + "רשות" : "") + "</span>" : "");
    var ex = (P.data.example && P.data.example[f.id])
      ? '<div class="v2-ex" data-ex hidden><b>דוגמה פתורה:</b> ' + esc(P.data.example[f.id]) + "</div>" : "";
    var input;

    if (f.type === "choice") {
      input = '<select id="' + id + '" data-f="' + esc(f.id) + '"' + ro + '><option value="">בחר/י</option>' +
        f.options.map(function (o) { return '<option value="' + esc(o) + '"' + (o === v ? " selected" : "") + ">" + esc(o) + "</option>"; }).join("") +
        "</select>";
      return '<div class="field" data-field="' + esc(f.id) + '"><label for="' + id + '">' + label + "</label>" + input + ex + "</div>";
    }
    if (f.type === "multi") {
      var list = (v && typeof v === "object") ? v : [];
      input = '<div class="v2-chips" role="group" aria-label="' + esc(f.label) + '" data-multi="' + esc(f.id) + '">' +
        f.options.map(function (o, i) {
          var on = list.indexOf(o) >= 0;
          return '<label class="' + (on ? "on" : "") + '"><input type="checkbox" value="' + esc(o) + '"' + (on ? " checked" : "") + ro +
            ' id="' + id + "-" + i + '">' + esc(o) + "</label>";
        }).join("") + "</div>";
      return '<div class="field" data-field="' + esc(f.id) + '"><div class="lbl">' + label + "</div>" + input + ex + "</div>";
    }
    if (f.type === "long") {
      input = '<textarea id="' + id + '" data-f="' + esc(f.id) + '" maxlength="4000" placeholder="' + esc(f.placeholder) + '"' + ro + ">" + esc(v) + "</textarea>";
    } else {
      var t = f.type === "link" ? "url" : "text";
      var extra = f.type === "number" ? ' inputmode="decimal" dir="ltr" translate="no"' : f.type === "link" ? ' dir="ltr" placeholder="https://"' : ' placeholder="' + esc(f.placeholder) + '"';
      input = '<input id="' + id + '" type="' + t + '" data-f="' + esc(f.id) + '" maxlength="' + (f.type === "link" ? 500 : 300) + '" value="' + esc(v) + '"' + extra + ro + ">";
    }
    return '<div class="field" data-field="' + esc(f.id) + '"><label for="' + id + '">' + label + "</label>" + input + ex + "</div>";
  }

  function stateChip() {
    var st = str(P.data.state);
    if (st === "הוערך") return '<span class="v2-chip done">הוערך</span>';
    if (st === "הוחזר") return '<span class="v2-chip due">חזר אליך עם הערה · אפשר לתקן</span>';
    if (st === "הוגש") return '<span class="v2-chip done">הוגש · מיטל רואה</span>';
    return '<span class="v2-chip draft">טיוטה · נשמרת לבד</span>';
  }

  function render() {
    var D = P.data, s = P.s;
    var main = D.fields.filter(function (f) { return !f.plus; });
    var plus = D.fields.filter(function (f) { return f.plus; });

    var body = "", lastSection = "";
    main.forEach(function (f) {
      if (str(f.section) && f.section !== lastSection) {
        body += '<p class="v2-eyebrow" style="margin-top:' + (lastSection || body ? "22" : "0") + 'px">' + esc(f.section) + "</p>";
        lastSection = f.section;
      }
      if (str(f.tip)) body += '<div class="v2-tip">' + esc(f.tip) + "</div>";
      body += fieldHtml(f);
    });

    var plusHtml = "";
    if (plus.length || str(D.challenge)) {
      plusHtml = '<div class="v2-plus" id="cp-plus" hidden><p class="v2-eyebrow">עוד צעד · רשות · לא משנה את ההערכה</p>' +
        (str(D.challenge) ? '<p style="margin:0 0 12px;line-height:1.6">' + esc(D.challenge) + "</p>" : "") +
        plus.map(fieldHtml).join("") + "</div>";
    }

    var assess = "";
    if (D.assess && (str(D.assess.level) || str(D.assess.note))) {
      assess = '<div class="v2-card v2-assess' + (str(D.state) === "הוחזר" ? " back" : "") + '"><p class="v2-eyebrow">ההערכה של מיטל</p>' +
        (str(D.assess.level) ? '<span class="v2-chip ' + (D.assess.level === "מוכן לכיתה" ? "done" : "due") + '">' + esc(D.assess.level) + "</span>" : "") +
        (str(D.assess.note) ? '<p style="margin:8px 0 0;line-height:1.65">' + esc(D.assess.note) + "</p>" : "") + "</div>";
    }

    var beats = P.opts.beats ? P.opts.beats() : "";

    P.host.innerHTML =
      (beats ? '<div class="v2-beats" id="cp-beats">' + beats + "</div>" : '<div class="v2-beats" id="cp-beats" hidden></div>') +
      '<div class="v2-card v2-mhead">' +
        '<button type="button" class="v2-btn ghost" id="cp-back" style="padding:4px 8px;min-height:44px;margin:0 0 6px">' + ico("back", "s") + "חזרה למפגש</button><br>" +
        '<span class="v2-tag">הדף המלווה · מפגש <span translate="no">' + esc(s.num) + "</span></span>" +
        "<h2>" + esc(D.deliverable || D.topic || s.topic) + "</h2>" +
        "<p>הדף נשמר לבד כל דקה, וגם בדפדפן שלך. אין תשובה נכונה, יש תשובה כנה. " +
          "“הגשה” בסוף רק אומרת למיטל: תסתכלי.</p>" +
        '<div class="v2-mmeta"><span id="cp-progress"></span><span id="cp-saved" aria-live="polite"></span></div>' +
      "</div>" +
      assess +
      '<div class="v2-card" style="padding:12px 18px"><div class="v2-row" style="justify-content:space-between">' +
        '<span style="font-size:13.5px;color:var(--muted)">איך לעבוד היום? אף אחד לא רואה מה בחרת, ואפשר להחליף בכל רגע.</span>' +
        '<span class="v2-seg" role="group" aria-label="מצב עבודה" id="cp-mode">' +
          (D.modes || ["דוגמה", "לבד", "צעד"]).map(function (m) {
            return '<button type="button" data-mode="' + esc(m) + '" aria-pressed="' + (m === P.mode ? "true" : "false") + '">' + esc(MODE_LABEL[m] || m) + "</button>";
          }).join("") +
        "</span></div></div>" +
      '<div class="v2-card v2-cp" id="cp-form">' +
        (str(D.exampleText) ? '<div class="v2-ex" data-ex hidden style="margin:0 0 14px"><b>דוגמה פתורה.</b> ' + esc(D.exampleText).replace(/\r?\n/g, "<br>") + "</div>" : "") +
        body + plusHtml +
        '<div class="v2-cpfoot"><div class="v2-row">' +
          '<button type="button" class="v2-btn primary" id="cp-submit"></button>' +
          '<span id="cp-state">' + stateChip() + "</span>" +
          '<button type="button" class="v2-btn" id="cp-stuck" style="margin-inline-start:auto" aria-expanded="false">' + ico("help") + '<span id="cp-stuck-lbl">נתקעתי</span></button>' +
        "</div>" +
        '<div class="v2-stuck" id="cp-stuckbox" hidden></div>' +
        '<p class="v2-msg" id="cp-msg" role="status"></p></div>' +
      "</div>";

    wire();
    applyMode();
    paintProgress();
    paintSaved();
    paintSubmit();
    paintStuck();
  }

  function applyMode() {
    var exs = P.host.querySelectorAll("[data-ex]");
    for (var i = 0; i < exs.length; i++) exs[i].hidden = P.mode !== "דוגמה";
    var plus = d.getElementById("cp-plus");
    if (plus) plus.hidden = P.mode !== "צעד";
    var bs = P.host.querySelectorAll("#cp-mode button");
    for (var b = 0; b < bs.length; b++) bs[b].setAttribute("aria-pressed", bs[b].getAttribute("data-mode") === P.mode ? "true" : "false");
  }

  function paintProgress() {
    var n = filled(), m = counted().length;
    d.getElementById("cp-progress").innerHTML = 'מולאו <b translate="no">' + n + "</b> מתוך <b translate=\"no\">" + m + "</b>";
    if (P.opts.onInfo) P.opts.onInfo({ state: str(P.data.state), filled: n, total: m });
  }

  function ago(ms) {
    var sec = Math.max(0, Math.round((Date.now() - ms) / 1000));
    if (sec < 10) return "עכשיו";
    if (sec < 60) return "לפני " + sec + " שניות";
    var min = Math.round(sec / 60);
    return min === 1 ? "לפני דקה" : "לפני " + min + " דקות";
  }

  function paintSaved() {
    var host = d.getElementById("cp-saved");
    if (!host) return;
    if (!canEdit()) { host.textContent = ""; return; }
    if (P.sending) host.innerHTML = "שומר…";
    else if (P.dirty) host.innerHTML = "יש שינויים שעוד לא נשמרו · <b>שמורים בדפדפן</b>";
    else if (P.savedAtMs) host.innerHTML = "נשמר <b>" + esc(ago(P.savedAtMs)) + "</b>";
    else if (str(P.data.savedAt)) host.innerHTML = 'נשמר <b translate="no">' + esc(P.data.savedAt) + "</b>";
    else host.textContent = "";
  }

  function paintSubmit() {
    var b = d.getElementById("cp-submit"), st = str(P.data.state);
    if (st === "הוגש") { b.textContent = "ביטול ההגשה · להמשיך לעבוד"; b.className = "v2-btn"; b.hidden = false; }
    else if (st === "הוערך") { b.hidden = true; }
    else { b.innerHTML = "הגשה · מיטל, תסתכלי"; b.className = "v2-btn primary"; b.hidden = false; }
    d.getElementById("cp-state").innerHTML = stateChip();
  }

  function msg(text, cls) {
    var m = d.getElementById("cp-msg");
    if (!m) return;
    m.textContent = text || "";
    m.className = "v2-msg" + (cls ? " " + cls : "");
  }

  function markMissing(ids) {
    var all = P.host.querySelectorAll(".field");
    for (var i = 0; i < all.length; i++) {
      all[i].classList.toggle("miss", (ids || []).indexOf(all[i].getAttribute("data-field")) >= 0);
    }
    if (ids && ids.length) {
      var first = P.host.querySelector('.field[data-field="' + ids[0] + '"]');
      if (first && first.scrollIntoView) first.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }

  /* ------------------------------------------------------------------ */
  /* נתקעתי                                                             */
  /* ------------------------------------------------------------------ */

  function paintStuck() {
    var box = d.getElementById("cp-stuckbox"), btn = d.getElementById("cp-stuck");
    if (!box) return;
    var cats = P.data.stuckCats || {};
    d.getElementById("cp-stuck-lbl").textContent = P.stuck ? "מיטל רואה שנתקעת" : "נתקעתי";
    btn.setAttribute("aria-expanded", P.stuckOpen ? "true" : "false");
    box.hidden = !P.stuckOpen;
    if (!P.stuckOpen) return;
    if (P.stuck) {
      box.innerHTML = "<p><b>" + esc(cats[P.stuck] || "") + "</b> · מיטל רואה את זה בשולחן המנחה, ותגיע אליך בזום.</p>" +
        '<div class="v2-row"><button type="button" class="v2-btn" data-cat="">הסתדרתי, תודה</button></div>';
    } else {
      box.innerHTML = "<p>מה קרה? לחיצה אחת, בלי לכתוב. מיטל רואה את זה מיד.</p><div class=\"v2-row\">" +
        Object.keys(cats).map(function (k) {
          return '<button type="button" class="v2-btn" data-cat="' + esc(k) + '">' + esc(cats[k]) + "</button>";
        }).join("") + "</div>";
    }
  }

  function sendStuck(cat) {
    w.SH_auth.api("pageStuck", { n: P.s.num, cat: cat }).then(function (r) {
      if (!P || P.closed) return;
      if (!r || !r.ok) { msg(errText(r && r.error), "bad"); return; }
      P.stuck = str(r.stuck);
      P.stuckOpen = !!P.stuck;
      paintStuck();
      msg(P.stuck ? "נשלח. מיטל רואה את זה עכשיו." : "", "ok");
    }).catch(function () { msg(ERR.network, "bad"); });
  }

  /* ------------------------------------------------------------------ */
  /* קלט ושמירה                                                         */
  /* ------------------------------------------------------------------ */

  function touched() {
    P.dirty = true;
    backupWrite(false);
    paintProgress();
    paintSaved();
  }

  function save(force) {
    if (!P || P.closed || !canEdit()) return Promise.resolve(null);
    if (!P.dirty && !force) return Promise.resolve(null);
    if (P.sending) return Promise.resolve(null);

    var gen = ++P.gen;
    var snapshot = JSON.stringify(P.values);
    backupWrite(false);               /* לפני כל שליחה, כדי שכשל רשת לא יאבד כלום */
    P.sending = true;
    P.dirty = false;
    paintSaved();

    var page = P;
    return w.SH_auth.api("pageSave", { n: page.s.num, values: page.values, mode: page.mode, gen: gen })
      .then(function (r) {
        page.sending = false;
        if (page.closed || P !== page) return r;
        /* תשובה של דור ישן: הגיעה אחרי ששמירה חדשה יותר כבר טופלה */
        if (r && r.gen !== null && r.gen !== undefined && Number(r.gen) < page.applied) return r;
        if (!r || !r.ok) {
          page.dirty = true;
          if (r && r.error === "submitted") {
            page.data.state = "הוגש"; page.data.canEdit = false; page.dirty = false;
            render();
          }
          msg(errText(r && r.error), "bad");
          paintSaved();
          return r;
        }
        page.applied = gen;
        page.savedAtMs = Date.now();
        page.data.state = str(r.state) || page.data.state;
        /* אם הוקלד משהו בזמן שהבקשה הייתה באוויר, הדף עדיין מלוכלך */
        if (JSON.stringify(page.values) !== snapshot) {
          page.dirty = true;
          w.setTimeout(function () { if (P === page) save(false); }, 2000);
        } else {
          backupWrite(true);
        }
        if (r.step !== undefined && page.opts.onStep) page.opts.onStep(Number(r.step) || 0);
        msg("");
        paintSaved();
        paintSubmit();
        return r;
      })
      .catch(function () {
        page.sending = false;
        if (page.closed || P !== page) return null;
        page.dirty = true;
        msg(ERR.network, "bad");
        paintSaved();
        return null;
      });
  }

  function submit() {
    var st = str(P.data.state);
    var undo = st === "הוגש";
    var btn = d.getElementById("cp-submit");
    btn.disabled = true;
    msg(undo ? "מבטל את ההגשה…" : "מגיש…");
    backupWrite(false);

    var body = undo ? { n: P.s.num, undo: "כן" } : { n: P.s.num, values: P.values, mode: P.mode };
    var page = P;
    w.SH_auth.api("pageSubmit", body).then(function (r) {
      if (page.closed || P !== page) return;
      btn.disabled = false;
      if (!r || !r.ok) {
        if (r && r.error === "required") markMissing(r.missing || []);
        msg(errText(r && r.error), "bad");
        return;
      }
      page.dirty = false;
      backupWrite(true);
      page.data.state = str(r.state);
      page.data.canEdit = page.data.state !== "הוגש" && page.data.state !== "הוערך";
      render();
      msg(undo ? "ההגשה בוטלה. אפשר להמשיך לעבוד." : "הוגש. מיטל רואה את הדף שלך בשולחן המנחה.", "ok");
    }).catch(function () {
      if (page.closed || P !== page) return;
      btn.disabled = false;
      msg(ERR.network, "bad");
    });
  }

  function wire() {
    d.getElementById("cp-back").addEventListener("click", function () {
      save(false);
      if (P.opts.onBack) P.opts.onBack();
    });

    var form = d.getElementById("cp-form");
    form.addEventListener("input", function (ev) {
      var t = ev.target, id = t.getAttribute && t.getAttribute("data-f");
      if (!id || !canEdit()) return;
      P.values[id] = t.value;
      var fld = t.closest(".field");
      if (fld) fld.classList.remove("miss");
      touched();
    });
    form.addEventListener("change", function (ev) {
      var t = ev.target;
      if (!canEdit() || !t.closest) return;
      var group = t.closest("[data-multi]");
      if (group) {
        var id = group.getAttribute("data-multi"), picked = [];
        var boxes = group.querySelectorAll("input[type=checkbox]");
        for (var i = 0; i < boxes.length; i++) {
          boxes[i].parentNode.classList.toggle("on", boxes[i].checked);
          if (boxes[i].checked) picked.push(boxes[i].value);
        }
        P.values[id] = picked;
        var fld = group.closest(".field");
        if (fld) fld.classList.remove("miss");
        touched();
        return;
      }
      var fid = t.getAttribute("data-f");
      if (fid && t.tagName === "SELECT") {
        P.values[fid] = t.value;
        touched();
        /* שדה בחירה מזין את המפה החיה, ולכן הוא נשמר מיד ולא בעוד דקה */
        save(false);
      }
    });

    d.getElementById("cp-mode").addEventListener("click", function (ev) {
      var b = ev.target.closest ? ev.target.closest("button[data-mode]") : null;
      if (!b) return;
      P.mode = b.getAttribute("data-mode");
      applyMode();
      if (canEdit()) { P.dirty = true; backupWrite(false); }
    });

    d.getElementById("cp-submit").addEventListener("click", submit);

    d.getElementById("cp-stuck").addEventListener("click", function () {
      P.stuckOpen = !P.stuckOpen;
      paintStuck();
    });
    d.getElementById("cp-stuckbox").addEventListener("click", function (ev) {
      var b = ev.target.closest ? ev.target.closest("button[data-cat]") : null;
      if (b) sendStuck(b.getAttribute("data-cat"));
    });
  }

  /* ------------------------------------------------------------------ */
  /* פתיחה וסגירה                                                       */
  /* ------------------------------------------------------------------ */

  function close() {
    if (!P) return;
    if (P.dirty && canEdit()) save(false);
    if (P.timer) w.clearInterval(P.timer);
    if (P.clock) w.clearInterval(P.clock);
    P.closed = true;
    P = null;
  }

  function open(host, session, opts) {
    close();
    P = blank();
    P.host = host; P.s = session; P.opts = opts || {};
    var page = P;

    host.innerHTML = '<div class="v2-card"><p class="v2-note" style="margin:0">טוען את הדף המלווה…</p></div>';

    w.SH_auth.api("pageGet", { n: session.num }).then(function (r) {
      if (page.closed || P !== page) return;
      if (!r || !r.ok) {
        host.innerHTML = '<div class="v2-card v2-mhead"><button type="button" class="v2-btn ghost" id="cp-back0" style="min-height:44px;padding:4px 8px">' +
          ico("back", "s") + "חזרה למפגש</button><h2>הדף המלווה לא נפתח</h2><p>" + esc(errText(r && r.error)) + "</p></div>";
        d.getElementById("cp-back0").addEventListener("click", function () { if (page.opts.onBack) page.opts.onBack(); });
        return;
      }
      page.data = r;
      page.values = r.values || {};
      page.mode = (r.modes || []).indexOf(str(r.mode)) >= 0 ? str(r.mode) : "לבד";

      /* עבודה שנשארה בדפדפן ולא הגיעה לשרת גוברת, ונשלחת מיד */
      var local = backupRead();
      if (local && local.synced === false && r.canEdit) {
        page.values = local.values || {};
        if (local.mode) page.mode = local.mode;
        page.dirty = true;
      }

      render();
      if (r.step && page.opts.onStep) page.opts.onStep(Number(r.step));
      if (page.dirty) { msg("שחזרנו מהדפדפן עבודה שעוד לא נשמרה בשרת. שומר אותה עכשיו.", "ok"); save(false); }

      page.timer = w.setInterval(function () { save(false); }, SAVE_MS);
      page.clock = w.setInterval(paintSaved, 10000);
    }).catch(function () {
      if (page.closed || P !== page) return;
      host.innerHTML = '<div class="v2-card v2-mhead"><h2>אין חיבור לשרת</h2><p>' + esc(ERR.network) + "</p></div>";
    });
  }

  /* הלשונית מוסתרת או נסגרת: זה הרגע האחרון לשמור */
  d.addEventListener("visibilitychange", function () { if (d.hidden && P && P.dirty) save(false); });
  w.addEventListener("pagehide", function () { if (P && P.dirty) { backupWrite(false); save(false); } });

  w.SH_page = {
    open: open,
    close: close,
    saveNow: function () { return save(true); },
    errText: errText,
    /* shell.js מעדכן כאן את פס הפעימות כשהשלב החי מתחלף */
    onStep: function () {
      if (!P || !P.opts.beats) return;
      var host = d.getElementById("cp-beats");
      if (!host) return;
      var h = P.opts.beats();
      host.hidden = !h;
      host.innerHTML = h;
    },
    state: function () { return P ? { session: P.s.num, dirty: P.dirty, gen: P.gen, applied: P.applied, mode: P.mode, filled: P.data ? filled() : 0 } : null; }
  };
})(window, document);
