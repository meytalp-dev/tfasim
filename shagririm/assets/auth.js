/**
 * שגרירי חדשנות טכנולוגית — מודול הלמידה. כניסת משתתפים (צד לקוח).
 * משימה 2 באפיון: רויטל\אפיון-מודול-שגרירי-חדשנות.md (סעיפים 2 ו-6).
 *
 * מה הקובץ הזה עושה:
 *   1. קורא את המפתח האישי מכתובת הדף (?t=...). המפתח לא כתוב כאן ולא בשום קובץ.
 *   2. שואל את השרת מי מחזיק המפתח — השרת מחזיר שורה אחת בלבד.
 *   3. בכניסה ראשונה מכל מכשיר: מציג מסך קוד, שולח קוד בן 6 ספרות למייל,
 *      ומקבל טוקן חתום שנשמר בדפדפן ל-30 יום.
 *
 * איך משתמשים בזה בעמוד אחר:
 *   <script src="assets/auth.js"></script>
 *   SH_auth.ensure().then(function (me) { ... me.name, me.school, me.track ... });
 *
 * SH_auth.fetchJson(url, opts) — פסק זמן 15 שניות ושלושה ניסיונות.
 *   Apps Script מחזיר לפעמים 302 ואז 404 באופן רגעי; בלי ניסיון חוזר הדף
 *   מציג "משהו השתבש" למרות שהשרת בריא. כל עמוד במודול חייב לעבור דרך כאן.
 *
 * SH_auth.api(action, data) — POST מאומת (מוסיף t ו-session לבד).
 *
 * פרטיות: בקובץ הזה אין שם, בית ספר, מייל או מפתח של אף משתתף/ת.
 * השם מוחזק בזיכרון הדף בזמן הריצה בלבד ולא נשמר ב-localStorage.
 */
(function (w, d) {
  "use strict";

  var API = "https://script.google.com/macros/s/AKfycbz1QHFO-kku43XIVJCuYLAvL3pARvdKeUYbIsBq-A8gKrVlsnAhGf0WUGIlAzeCgtBy/exec";

  var LS_SESS = "shag.sess";   /* { k: מפתח, s: טוקן } */
  var LS_DEV  = "shag.dev";    /* מזהה מכשיר מקומי */
  var RESEND_SEC = 60;
  var SUPPORT = "mlypeleg@gmail.com";

  /* ------------------------------------------------------------------ */
  /* אחסון מקומי — בחלון פרטי הגישה זורקת חריגה, ולכן הכול עטוף          */
  /* ------------------------------------------------------------------ */

  var mem = {};   /* גיבוי בזיכרון כשאין localStorage */

  function lsGet(k) {
    try {
      var v = w.localStorage.getItem(k);
      if (v !== null) return v;
    } catch (e) { /* חלון פרטי או אחסון חסום */ }
    return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null;
  }

  function lsSet(k, v) {
    mem[k] = v;
    try { w.localStorage.setItem(k, v); } catch (e) { /* נשאר בזיכרון בלבד */ }
  }

  function lsDel(k) {
    delete mem[k];
    try { w.localStorage.removeItem(k); } catch (e) { /* אין מה למחוק */ }
  }

  function storageWorks() {
    try {
      w.localStorage.setItem("shag.probe", "1");
      w.localStorage.removeItem("shag.probe");
      return true;
    } catch (e) { return false; }
  }

  /* ------------------------------------------------------------------ */
  /* מפתח, מכשיר, טוקן                                                  */
  /* ------------------------------------------------------------------ */

  function param(name) {
    var m = new RegExp("[?&]" + name + "=([^&#]*)").exec(w.location.search || "");
    return m ? decodeURIComponent(m[1].replace(/\+/g, " ")) : "";
  }

  var TOKEN = String(param("t") || "").trim();

  function deviceId() {
    var v = lsGet(LS_DEV);
    if (v) return v;
    var s = "d";
    for (var i = 0; i < 4; i++) s += Math.random().toString(36).slice(2, 8);
    v = s.replace(/[^A-Za-z0-9_-]/g, "").substring(0, 40);
    lsSet(LS_DEV, v);
    return v;
  }

  function sessionGet() {
    var raw = lsGet(LS_SESS);
    if (!raw) return "";
    try {
      var o = JSON.parse(raw);
      /* טוקן של מפתח אחר (מישהו פתח קישור של אדם אחר באותו דפדפן) לא נחשב */
      if (o && o.k === TOKEN.toLowerCase() && o.s) return String(o.s);
    } catch (e) { /* זבל באחסון */ }
    return "";
  }

  function sessionSet(s) {
    lsSet(LS_SESS, JSON.stringify({ k: TOKEN.toLowerCase(), s: String(s) }));
  }

  /* ------------------------------------------------------------------ */
  /* רשת                                                                */
  /* ------------------------------------------------------------------ */

  /* פסק זמן 15 שניות, שלושה ניסיונות, השהיה גדלה בין ניסיונות */
  function fetchJson(url, opts, tries) {
    tries = tries || 3;
    function attempt(n) {
      var ctl = w.AbortController ? new w.AbortController() : null;
      var timer = w.setTimeout(function () { if (ctl) ctl.abort(); }, 15000);
      var o = {};
      for (var k in (opts || {})) if (Object.prototype.hasOwnProperty.call(opts, k)) o[k] = opts[k];
      if (ctl) o.signal = ctl.signal;
      return w.fetch(url, o).then(function (r) {
        w.clearTimeout(timer);
        if (!r.ok) throw new Error("http " + r.status);
        return r.json();
      }).catch(function (e) {
        w.clearTimeout(timer);
        if (n >= tries) throw e;
        return new Promise(function (res) { w.setTimeout(res, 900 * n); })
          .then(function () { return attempt(n + 1); });
      });
    }
    return attempt(1);
  }

  /* text/plain כדי שלא ייווצר preflight — Apps Script לא עונה ל-OPTIONS */
  function post(payload) {
    return fetchJson(API, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload || {})
    });
  }

  /* GET מאומת: מוסיף את המפתח האישי, את הסשן ואת המכשיר.
     נדרש מאז ש-mode=content נסגר — עד אז הוא החזיר את קישור הזום
     ואת החומרים לכל מי ששלח בקשה (סקירת קודקס 20.9.26). */
  function get(mode, extra) {
    return fetchJson(API + "?mode=" + encodeURIComponent(mode) +
      (extra || "") +
      "&t=" + encodeURIComponent(TOKEN || "") +
      "&s=" + encodeURIComponent(sessionGet() || "") +
      "&device=" + encodeURIComponent(deviceId() || "") +
      "&_=" + Date.now());
  }

  /* POST מאומת לשאר העמודים: מוסיף מפתח, טוקן ומכשיר */
  function api(action, data) {
    var body = { action: action, t: TOKEN, session: sessionGet(), device: deviceId() };
    for (var k in (data || {})) if (Object.prototype.hasOwnProperty.call(data, k)) body[k] = data[k];
    return post(body);
  }

  function who() {
    var u = API + "?t=" + encodeURIComponent(TOKEN) +
            "&device=" + encodeURIComponent(deviceId());
    var s = sessionGet();
    if (s) u += "&s=" + encodeURIComponent(s);
    return fetchJson(u + "&_=" + Date.now());
  }

  /* ------------------------------------------------------------------ */
  /* אייקוני קו — SVG בלבד, בלי אימוג'י (סעיף 8 באפיון)                  */
  /* ------------------------------------------------------------------ */

  function svg(inner, size) {
    return '<svg viewBox="0 0 24 24" width="' + (size || 22) + '" height="' + (size || 22) +
      '" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" ' +
      'stroke-linejoin="round" aria-hidden="true">' + inner + "</svg>";
  }

  var IC = {
    mail: svg('<rect x="2.5" y="4.5" width="19" height="15" rx="2.5"/><path d="m3.5 6.5 8.5 6 8.5-6"/>'),
    lock: svg('<rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/><path d="M12 14.5v2.5"/>'),
    check: svg('<circle cx="12" cy="12" r="8.5"/><path d="m8.5 12.2 2.4 2.4 4.6-4.9"/>'),
    alert: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 8v4.5"/><path d="M12 15.6v.4"/>'),
    send: svg('<path d="M3.5 12 20.5 4l-4 16-5.5-5.5z"/><path d="m11 14.5 9.5-10.5"/>'),
    back: svg('<path d="M14.5 5.5 8 12l6.5 6.5"/>')
  };

  /* טבעת 10 המקטעים מלוגו הקהילה — המוטיב שחוזר בכל מקום שיש בו התקדמות */
  function ring(size, active) {
    var parts = "";
    var cx = 50, cy = 50, r = 38;
    for (var i = 0; i < 10; i++) {
      var a0 = (i * 36 - 90 + 2.2) * Math.PI / 180;
      var a1 = ((i + 1) * 36 - 90 - 2.2) * Math.PI / 180;
      parts += '<path d="M ' + (cx + r * Math.cos(a0)).toFixed(2) + " " + (cy + r * Math.sin(a0)).toFixed(2) +
        " A " + r + " " + r + " 0 0 1 " + (cx + r * Math.cos(a1)).toFixed(2) + " " +
        (cy + r * Math.sin(a1)).toFixed(2) + '" class="shauth-seg" style="animation-delay:' +
        (i * 0.09).toFixed(2) + 's"/>';
    }
    return '<svg class="shauth-ring' + (active ? " on" : "") + '" viewBox="0 0 100 100" width="' +
      size + '" height="' + size + '" fill="none" stroke="currentColor" stroke-width="7" ' +
      'stroke-linecap="round" aria-hidden="true">' + parts + "</svg>";
  }

  /* ------------------------------------------------------------------ */
  /* עיצוב                                                              */
  /* ------------------------------------------------------------------ */

  var CSS = [
    ":root{--sh-blue:#1D6FA5;--sh-orange:#C2620C;--sh-paper:#F4F1EA;--sh-navy:#10344F;--sh-night:#0B2436}",
    ".shauth[hidden]{display:none!important}",
    ".shauth{position:fixed;inset:0;z-index:9999;direction:rtl;display:flex;align-items:center;",
    "justify-content:center;padding:18px;background:var(--sh-paper);",
    "font-family:Assistant,'Segoe UI',Arial,sans-serif;color:var(--sh-navy);overflow-y:auto}",
    ".shauth-card{width:100%;max-width:430px;background:#fff;border:1px solid #e2dbcb;",
    "border-radius:20px;padding:26px 20px 18px;box-shadow:0 14px 40px rgba(16,52,79,.13);text-align:center}",
    ".shauth-mark{color:var(--sh-blue);margin:0 auto 12px;display:block}",
    ".shauth-ring .shauth-seg{stroke:#dfe6ec}",
    ".shauth-ring.on .shauth-seg{stroke:var(--sh-blue);animation:shauth-pull 1.5s ease-in-out infinite}",
    "@keyframes shauth-pull{0%,100%{opacity:.25}45%{opacity:1}}",
    "@media (prefers-reduced-motion:reduce){.shauth-ring.on .shauth-seg{animation:none;opacity:.8}}",
    ".shauth h2{font-family:Rubik,Assistant,Arial,sans-serif;font-size:1.22rem;margin:0 0 6px;line-height:1.35}",
    ".shauth p{margin:0 0 14px;font-size:.98rem;line-height:1.6;color:#3d5768}",
    ".shauth .shauth-mask{font-weight:700;color:var(--sh-navy);white-space:nowrap}",
    ".shauth-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;width:100%;",
    "min-height:52px;padding:12px 18px;border:0;border-radius:14px;background:var(--sh-blue);color:#fff;",
    "font:600 1.04rem/1 Assistant,Arial,sans-serif;cursor:pointer;-webkit-appearance:none}",
    ".shauth-btn:active{transform:translateY(1px)}",
    ".shauth-btn:disabled{background:#93aec1;cursor:default}",
    ".shauth-btn:focus-visible{outline:3px solid var(--sh-orange);outline-offset:2px}",
    ".shauth-link{background:none;border:0;color:var(--sh-blue);font:600 .95rem Assistant,Arial,sans-serif;",
    "cursor:pointer;padding:10px;text-decoration:underline;min-height:44px}",
    ".shauth-link:disabled{color:#8ea3b2;text-decoration:none;cursor:default}",
    ".shauth-code{width:100%;max-width:260px;margin:2px auto 12px;display:block;padding:14px 10px;",
    "border:2px solid #cfd8e0;border-radius:14px;background:#fbfaf6;color:var(--sh-navy);",
    "font:700 1.7rem/1.1 Rubik,Arial,sans-serif;letter-spacing:.32em;text-align:center;",
    "direction:ltr;unicode-bidi:plaintext}",
    ".shauth-code:focus{border-color:var(--sh-blue);outline:none;box-shadow:0 0 0 4px rgba(29,111,165,.14)}",
    ".shauth-code.bad{border-color:#b3261e;animation:shauth-shake .4s}",
    "@keyframes shauth-shake{25%{transform:translateX(-7px)}50%{transform:translateX(7px)}75%{transform:translateX(-4px)}}",
    ".shauth-msg{min-height:22px;font-size:.93rem;margin:0 0 8px;display:flex;align-items:center;",
    "justify-content:center;gap:6px;line-height:1.4}",
    ".shauth-msg.bad{color:#b3261e}.shauth-msg.good{color:#1c6b3f}",
    ".shauth-foot{margin-top:16px;padding-top:12px;border-top:1px solid #eee7d8;font-size:.78rem;color:#7b8a96;line-height:1.6}",
    ".shauth-foot a{color:var(--sh-orange)}",
    ".shauth-note{font-size:.85rem;color:#6d7f8c;margin:10px 0 0}",
    "@media (max-width:380px){.shauth-card{padding:20px 14px 14px}.shauth h2{font-size:1.1rem}}"
  ].join("");

  function styleOnce() {
    if (d.getElementById("shauth-css")) return;
    var st = d.createElement("style");
    st.id = "shauth-css";
    st.appendChild(d.createTextNode(CSS));
    d.head.appendChild(st);
  }

  /* ------------------------------------------------------------------ */
  /* מסך הכניסה                                                        */
  /* ------------------------------------------------------------------ */

  var box = null;

  function shell() {
    styleOnce();
    if (box) return box;
    box = d.createElement("div");
    box.className = "shauth";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", "כניסה לסביבת הלמידה");
    box.innerHTML = '<div class="shauth-card" id="shauth-card"></div>';
    d.body.appendChild(box);
    return box;
  }

  function card(html) {
    shell();
    box.hidden = false;
    d.getElementById("shauth-card").innerHTML =
      html +
      '<div class="shauth-foot">שגרירי חדשנות טכנולוגית · משרד העבודה, מינהל הכשרה מקצועית' +
      '<br>נבנה על ידי <a href="https://impact-os.app" target="_blank" rel="noopener">impactos · impact-os.app</a></div>';
  }

  function close() {
    if (box) box.hidden = true;
  }

  function loading(text) {
    card(
      '<div class="shauth-mark">' + ring(86, true) + "</div>" +
      "<h2>" + (text || "רגע, פותחים את הסביבה") + "</h2>" +
      "<p>אם זה לוקח יותר מכמה שניות — כדאי לרענן את הדף.</p>"
    );
  }

  function fatal(title, text, retry) {
    card(
      '<div class="shauth-mark" style="color:var(--sh-orange)">' + IC.alert + "</div>" +
      "<h2>" + title + "</h2>" +
      "<p>" + text + "</p>" +
      (retry ? '<button class="shauth-btn" id="shauth-retry">' + IC.back + " נסו שוב</button>" : "") +
      '<p class="shauth-note">אם זה חוזר — אפשר לכתוב ל<a href="mailto:' + SUPPORT +
      '?subject=' + encodeURIComponent("כניסה לסביבת שגרירי חדשנות") + '">מיטל</a>.</p>'
    );
    if (retry) {
      var b = d.getElementById("shauth-retry");
      if (b) b.addEventListener("click", retry);
    }
  }

  /* ------------------------------------------------------------------ */
  /* שלב הקוד                                                          */
  /* ------------------------------------------------------------------ */

  var ERRORS = {
    badkey:    "הקישור לא זוהה. כדאי לפתוח שוב את הקישור האישי מההודעה שקיבלת בוואטסאפ או במייל.",
    nomail:    "לא רשום אצלנו מייל לכניסה. מיטל תשלים את זה — אפשר לכתוב לה.",
    nocode:    "לא נמצא קוד פעיל. נשלח קוד חדש.",
    expired:   "הקוד פג (הוא תקף 15 דקות). נשלח קוד חדש.",
    locked:    "היו חמישה ניסיונות. נשלח קוד חדש ומתחילים מהתחלה.",
    badcode:   "הקוד לא נכון.",
    nosecret:  "הסביבה עוד לא הופעלה במלואה. מיטל צריכה להריץ את ההגדרה פעם אחת.",
    throttled: "כבר נשלח קוד. אפשר לבקש חדש בעוד רגע.",
    server:    "השרת לא ענה כרגע.",
    network:   "אין חיבור לשרת כרגע."
  };

  function errText(code) {
    return ERRORS[String(code || "")] || "משהו השתבש. אפשר לנסות שוב.";
  }

  /* השלב שמבקש את הקוד. resolve כשהאימות עבר. */
  function codeStep(info, done, failed) {
    var sending = false;

    function askScreen() {
      card(
        '<div class="shauth-mark">' + ring(78, false) + "</div>" +
        "<h2>כניסה לסביבת הלמידה</h2>" +
        "<p>זו הכניסה הראשונה מהמכשיר הזה. נשלח קוד בן 6 ספרות למייל " +
        (info.mailMask ? '<span class="shauth-mask" translate="no">' + info.mailMask + "</span>" : "שלך") +
        ", ואחר כך המכשיר ייזכר 30 יום.</p>" +
        '<button class="shauth-btn" id="shauth-send">' + IC.mail + " שלחו לי קוד</button>" +
        '<p class="shauth-msg" id="shauth-msg"></p>' +
        (storageWorks() ? "" :
          '<p class="shauth-note">הדפדפן חוסם שמירה מקומית (חלון פרטי?), ולכן ייתכן שהקוד יידרש שוב בכניסה הבאה.</p>')
      );
      d.getElementById("shauth-send").addEventListener("click", function () { send(true); });
    }

    function msg(el, text, cls) {
      var m = d.getElementById(el);
      if (!m) return;
      m.className = "shauth-msg" + (cls ? " " + cls : "");
      m.innerHTML = text ? ((cls === "bad" ? IC.alert : cls === "good" ? IC.check : "") +
        "<span>" + text + "</span>") : "";
    }

    function send(first) {
      if (sending) return;
      sending = true;
      var btn = d.getElementById("shauth-send") || d.getElementById("shauth-resend");
      if (btn) { btn.disabled = true; }
      msg(first ? "shauth-msg" : "shauth-msg", "שולחים…", "");
      post({ action: "sendCode", t: TOKEN }).then(function (r) {
        sending = false;
        if (r && r.ok) { codeScreen(r.mailMask || info.mailMask, "הקוד נשלח. הוא תקף 15 דקות."); return; }
        if (r && r.error === "throttled") { codeScreen(info.mailMask, errText("throttled")); return; }
        if (r && (r.error === "badkey" || r.error === "nomail" || r.error === "nosecret")) {
          fatal("לא הצלחנו לשלוח קוד", errText(r.error), null);
          failed(new Error(r.error));
          return;
        }
        if (btn) btn.disabled = false;
        msg("shauth-msg", errText(r && r.error), "bad");
      }).catch(function () {
        sending = false;
        if (btn) btn.disabled = false;
        msg("shauth-msg", errText("network"), "bad");
      });
    }

    function codeScreen(mask, note) {
      card(
        '<div class="shauth-mark">' + IC.lock + "</div>" +
        "<h2>הקלידו את הקוד</h2>" +
        "<p>שלחנו קוד בן 6 ספרות ל" +
        (mask ? '<span class="shauth-mask" translate="no">' + mask + "</span>" : "מייל שלך") +
        ". הקוד תקף 15 דקות.</p>" +
        '<label class="shauth-note" for="shauth-input" style="display:block;margin:0 0 4px">קוד הכניסה</label>' +
        '<input id="shauth-input" class="shauth-code" type="text" inputmode="numeric" ' +
        'autocomplete="one-time-code" maxlength="7" translate="no" dir="ltr" ' +
        'aria-describedby="shauth-msg" placeholder="000000">' +
        '<p class="shauth-msg" id="shauth-msg"></p>' +
        '<button class="shauth-btn" id="shauth-go">' + IC.send + " כניסה</button>" +
        '<button class="shauth-link" id="shauth-resend">שליחת קוד חדש</button>'
      );
      if (note) msg("shauth-msg", note, "good");

      var inp = d.getElementById("shauth-input");
      var go = d.getElementById("shauth-go");
      var again = d.getElementById("shauth-resend");

      /* מקבלים גם ספרות ערביות-הודיות, כי מתג התרגום מחליף את מה שמוקלד.
         הנרמול עצמו נעשה בשרת עם digits_(). */
      function clean(v) {
        return String(v || "").replace(/[^0-9٠-٩۰-۹]/g, "").substring(0, 6);
      }

      inp.addEventListener("input", function () {
        var v = clean(inp.value);
        if (v !== inp.value) inp.value = v;
        inp.classList.remove("bad");
        if (v.length === 6) submit();
      });
      inp.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter") { ev.preventDefault(); submit(); }
      });
      go.addEventListener("click", submit);

      var left = RESEND_SEC;
      again.disabled = true;
      var tick = w.setInterval(function () {
        left--;
        if (left <= 0) {
          w.clearInterval(tick);
          again.disabled = false;
          again.textContent = "שליחת קוד חדש";
        } else {
          again.textContent = "שליחת קוד חדש (" + left + ")";
        }
      }, 1000);
      again.textContent = "שליחת קוד חדש (" + left + ")";
      again.addEventListener("click", function () {
        w.clearInterval(tick);
        send(false);
      });

      try { inp.focus(); } catch (e) { /* נייד לא תמיד מרשה */ }

      var busy = false;
      function submit() {
        var code = clean(inp.value);
        if (busy) return;
        if (code.length !== 6) {
          inp.classList.add("bad");
          msg("shauth-msg", "צריך 6 ספרות.", "bad");
          return;
        }
        busy = true;
        go.disabled = true;
        msg("shauth-msg", "בודקים…", "");
        post({ action: "verifyCode", t: TOKEN, code: code, device: deviceId() })
          .then(function (r) {
            busy = false;
            go.disabled = false;
            if (r && r.ok && r.session) {
              w.clearInterval(tick);
              sessionSet(r.session);
              msg("shauth-msg", "נכנסנו. המכשיר ייזכר 30 יום.", "good");
              w.setTimeout(function () { close(); done(r.person || info.person); }, 420);
              return;
            }
            inp.value = "";
            inp.classList.add("bad");
            var e = r && r.error;
            if (e === "expired" || e === "nocode" || e === "locked") {
              msg("shauth-msg", errText(e), "bad");
              w.setTimeout(function () { send(false); }, 1200);
              return;
            }
            if (e === "badcode") {
              msg("shauth-msg", errText(e) + (r.left ? " נשארו " + r.left + " ניסיונות." : " זה היה הניסיון האחרון."), "bad");
              return;
            }
            msg("shauth-msg", errText(e), "bad");
          })
          .catch(function () {
            busy = false;
            go.disabled = false;
            msg("shauth-msg", errText("network"), "bad");
          });
      }
    }

    askScreen();
  }

  /* ------------------------------------------------------------------ */
  /* ensure — הפונקציה שכל עמוד קורא לה                                 */
  /* ------------------------------------------------------------------ */

  var me = null;
  var pending = null;

  function ensure() {
    if (me) return Promise.resolve(me);
    if (pending) return pending;

    pending = new Promise(function (resolve, reject) {
      if (!TOKEN) {
        fatal("צריך את הקישור האישי",
          "הכניסה לסביבת הלמידה היא דרך הקישור האישי שנשלח אליך בוואטסאפ או במייל. " +
          "הוא נראה כך: <span dir=\"ltr\" translate=\"no\">/shagririm/?t=…</span>", null);
        reject(new Error("notoken"));
        return;
      }

      loading();

      who().then(function (r) {
        if (!r || r.ok !== true) {
          var e = r && r.error;
          if (e === "badkey") {
            fatal("הקישור לא זוהה", errText("badkey"), null);
          } else {
            fatal("השרת לא ענה", errText(e || "server"), function () {
              pending = null;
              ensure().then(resolve, reject);
            });
          }
          reject(new Error(e || "server"));
          return;
        }
        if (r.verified) {
          me = r.person;
          close();
          resolve(me);
          return;
        }
        if (r.hasMail === false) {
          fatal("אין מייל לכניסה", errText("nomail"), null);
          reject(new Error("nomail"));
          return;
        }
        codeStep(r, function (person) {
          me = person || r.person;
          resolve(me);
        }, reject);
      }).catch(function (err) {
        fatal("אין חיבור לשרת", errText("network"), function () {
          pending = null;
          ensure().then(resolve, reject);
        });
        reject(err);
      });
    });

    /* מסך השגיאה כבר מוצג למשתתף/ת, ולכן אנחנו מסמנים את הדחייה כמטופלת
       כדי שלא תיזרק שגיאה לקונסול בעמוד שקרא רק ל-then. */
    pending.catch(function () { /* טופל בתצוגה */ });
    return pending;
  }

  function logout() {
    lsDel(LS_SESS);
    me = null;
    pending = null;
  }

  w.SH_auth = {
    API: API,
    token: function () { return TOKEN; },
    device: deviceId,
    session: sessionGet,
    person: function () { return me; },
    fetchJson: fetchJson,
    post: post,
    api: api,
    get: get,
    ensure: ensure,
    logout: logout,
    /* חשוף לבדיקות ולעמודים שרוצים להציג הודעת שגיאה בעברית */
    errText: errText,
    icons: IC,
    ring: ring
  };
})(window, document);
