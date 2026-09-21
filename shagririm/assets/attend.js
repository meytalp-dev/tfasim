/**
 * שגרירי חדשנות טכנולוגית — מודול הלמידה. נוכחות (צד לקוח).
 * משימה 5 באפיון: רויטל\אפיון-מודול-שגרירי-חדשנות.md (סעיפים 3.2 ו-5.1).
 *
 * שני חצאים בקובץ אחד:
 *
 *   SH_attend  — הצד של המשתתף/ת. SH_attend.open(n) פותח/ת שדה קוד מעל
 *                מסך הבית: ארבע תיבות גדולות, מקלדת ספרות, רעידה בקוד שגוי,
 *                ומסך הצלחה. מסך הבית של משימה 4 קורא לזה אם הוא קיים.
 *
 *   SH_team    — הצד של מיטל, מסך "היום" ב-team.html: הקוד בתוך טבעת
 *                הספירה, פתיחה וסגירת רישום, ארבעה מספרים, הרשימה החיה,
 *                "מי עוד לא נרשם" עם כפתור העתקה, וסימון ידני.
 *
 * ההחלטה המרכזית (מיטל, 16.9.26): הקוד מתחלף כל חמש דקות, לא כל דקה,
 * והתצוגה *אינה* מתחלפת בינתיים. במערכת המדריכים התצוגה התחלפה כל דקה,
 * המשתתפים לא הספיקו להקליד והתלוננו. הקוד הקודם ממשיך להתקבל חמש דקות
 * נוספות (codeGrace). שני הערכים מגיעים מהשרת, מלשונית "הגדרות", ואינם
 * כתובים כאן: codeMinutes ו-codeGrace.
 *
 * רשת: הכול עובר דרך SH_auth.api / SH_auth.post / SH_auth.fetchJson
 * (פסק זמן ושלושה ניסיונות). אין כאן fetch משלנו — Apps Script מחזיר
 * 302 ואז 404 באופן רגעי, ובלי ניסיון חוזר הדף מציג שגיאה על שרת בריא.
 *
 * פרטיות: בקובץ הזה אין שם, בית ספר, מייל, מפתח אישי ולא מפתח אדמין.
 * שמות מגיעים מהשרת בזמן ריצה בלבד ואינם נשמרים ב-localStorage.
 * אייקוני קו SVG בלבד, בלי אימוג'י (סעיף 8 באפיון).
 */
(function (w, d) {
  "use strict";

  var CODE_LEN = 4;

  /* ------------------------------------------------------------------ */
  /* עזר                                                                */
  /* ------------------------------------------------------------------ */

  function el(id) { return d.getElementById(id); }

  function esc(s) {
    return String(s === null || s === undefined ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  /* ספרות ערביות-הודיות ופרסיות, כי מתג התרגום לערבית מחליף את מה
     שהמשתתף/ת רואה ומקליד/ה. השרת מנרמל שוב ב-digits_(). */
  function digits(s) {
    var out = "", src = String(s || "");
    for (var i = 0; i < src.length; i++) {
      var c = src.charCodeAt(i);
      if (c >= 0x0660 && c <= 0x0669) out += String(c - 0x0660);
      else if (c >= 0x06F0 && c <= 0x06F9) out += String(c - 0x06F0);
      else if (src[i] >= "0" && src[i] <= "9") out += src[i];
    }
    return out;
  }

  function mmss(sec) {
    var s = Math.max(0, Math.round(Number(sec) || 0));
    return Math.floor(s / 60) + ":" + String(s % 60 < 10 ? "0" + (s % 60) : s % 60);
  }

  function icon(inner, size) {
    return '<svg viewBox="0 0 24 24" width="' + (size || 20) + '" height="' + (size || 20) +
      '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" ' +
      'stroke-linejoin="round" aria-hidden="true">' + inner + "</svg>";
  }

  var IC = {
    check: '<path d="M5 12l5 5 9-10"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
    play: '<circle cx="12" cy="12" r="8.5"/><path d="M10.5 9l5 3-5 3z"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    alert: '<circle cx="12" cy="12" r="8.5"/><path d="M12 8v4.5"/><path d="M12 15.6v.4"/>',
    video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3"/>',
    people: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19.5a5.5 5.5 0 0 1 11 0"/><path d="M16 5.5a3.2 3.2 0 0 1 0 6"/><path d="M17.5 14.2a5.5 5.5 0 0 1 3 5.3"/>'
  };

  /* הודעות שגיאה בעברית, לשני הצדדים */
  var ERR = {
    badcode: "הקוד לא נכון. אם הוא התחלף בדיוק עכשיו, הקוד שמוצג בזום תקף.",
    closed: "הרישום למפגש עוד לא נפתח, או שנסגר. מיטל פותחת אותו בזום.",
    wrongsession: "הרישום פתוח למפגש אחר.",
    locked: "יותר מדי ניסיונות. אפשר לנסות שוב בעוד עשר דקות, או לכתוב למיטל.",
    nosession: "הכניסה פגה. לרענן את הדף ולהיכנס שוב בקישור האישי.",
    badkey: "הקישור לא זוהה.",
    nonum: "לא ברור לאיזה מפגש מדובר.",
    nosecret: "השרת עוד לא הוקם. להריץ setup.",
    /* שתי השגיאות האלה נוספו לשרת ב-21.9 (תיקוני הסקירה) ונשכחו כאן,
       ולכן הן נפלו להודעה הגנרית "משהו השתבש" ולא אמרו מה לעשות. */
    busy: "המערכת עסוקה ברגע זה. לנסות שוב בעוד רגע — לא נכתב כלום.",
    nozoom: "טרם יובא דוח הזום למפגש הזה, ולכן אי אפשר לאשר נוכחות סופית.",
    badtrack: "מסלול לא מזוהה.",
    notopen: "אין רישום פתוח במסלול הזה.",
    alreadyopen: "כבר יש מפגש פתוח במסלול הזה. לסגור אותו קודם.",
    badstate: "מצב נוכחות לא מוכר.",
    noperson: "המשתתף/ת אינו/ה במסלול הזה.",
    nowhat: "בקשה לא מוכרת.",
    server: "השרת החזיר שגיאה. לנסות שוב בעוד רגע.",
    network: "אין חיבור לשרת. לבדוק אינטרנט ולנסות שוב."
  };

  function errText(code) {
    return ERR[String(code || "")] || ERR.server;
  }

  function styleOnce(id, css) {
    if (el(id)) return;
    var st = d.createElement("style");
    st.id = id;
    st.appendChild(d.createTextNode(css));
    d.head.appendChild(st);
  }

  /* ================================================================== */
  /* ============== SH_attend — שדה הקוד של המשתתף/ת ================== */
  /* ================================================================== */

  var A_CSS = [
    ".shatt[hidden],.shatt-ok[hidden]{display:none!important}",
    ".shatt,.shatt-ok{position:fixed;inset:0;z-index:9990;direction:rtl;display:flex;",
    "flex-direction:column;padding:26px 20px 20px;font-family:Assistant,Arial,sans-serif;",
    "color:#fff;overflow-y:auto}",
    ".shatt{background:radial-gradient(120% 80% at 50% 0%,#F08A2E,#C2620C 60%,#9C4C08)}",
    ".shatt-ok{background:#0B2436;align-items:center;justify-content:center;text-align:center;z-index:9991}",
    ".shatt-in{width:100%;max-width:430px;margin:0 auto;display:flex;flex-direction:column;flex:1}",
    ".shatt-top{display:flex;align-items:center;gap:8px;font-weight:800;font-size:13px;letter-spacing:.4px}",
    ".shatt-rec{width:10px;height:10px;border-radius:50%;background:#fff;",
    "box-shadow:0 0 0 0 rgba(255,255,255,.7);animation:shatt-rec 1.4s infinite}",
    "@keyframes shatt-rec{70%{box-shadow:0 0 0 12px rgba(255,255,255,0)}100%{box-shadow:0 0 0 0 rgba(255,255,255,0)}}",
    ".shatt-x{margin-inline-start:auto;background:rgba(255,255,255,.18);border:0;color:#fff;",
    "width:38px;height:38px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center}",
    ".shatt h2{font-family:Rubik,Assistant,Arial,sans-serif;font-size:29px;font-weight:900;",
    "margin:20px 0 4px;line-height:1.08}",
    ".shatt p{margin:0;color:#FFE9D6;font-size:15px;line-height:1.5}",
    ".shatt p small{display:block;font-size:13px;margin-top:2px;opacity:.92}",
    ".shatt-digits{display:flex;gap:10px;justify-content:center;margin:24px 0 12px;direction:ltr}",
    ".shatt-digits span{width:62px;height:76px;border-radius:18px;background:rgba(255,255,255,.16);",
    "border:2px solid rgba(255,255,255,.32);display:flex;align-items:center;justify-content:center;",
    "font-family:Rubik,Arial,sans-serif;font-weight:900;font-size:38px;",
    "transition:.25s cubic-bezier(.2,.8,.2,1)}",
    ".shatt-digits span.f{background:#fff;color:#C2620C;border-color:#fff;transform:translateY(-3px)}",
    ".shatt-digits.bad{animation:shatt-shake .4s}",
    "@keyframes shatt-shake{25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}",
    ".shatt-msg{min-height:40px;text-align:center;font-size:13.5px;line-height:1.45;",
    "color:#FFF3E7;display:flex;align-items:center;justify-content:center;gap:6px;padding:0 4px}",
    ".shatt-msg.bad{color:#fff;font-weight:700}",
    ".shatt-pad{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:auto;direction:ltr}",
    ".shatt-pad button{border:0;background:rgba(255,255,255,.14);color:#fff;border-radius:18px;",
    "min-height:56px;font-family:Rubik,Arial,sans-serif;font-weight:700;font-size:24px;cursor:pointer}",
    ".shatt-pad button:active{background:rgba(255,255,255,.32)}",
    ".shatt-pad button:focus-visible{outline:3px solid #fff;outline-offset:2px}",
    ".shatt-pad button[disabled]{opacity:.45;cursor:default}",
    ".shatt-burst{width:126px;height:126px;border-radius:50%;background:#2F9F6A;display:flex;",
    "align-items:center;justify-content:center;animation:shatt-pop .6s cubic-bezier(.2,.8,.2,1)}",
    ".shatt-burst svg{width:62px;height:62px;stroke-width:2.6}",
    "@keyframes shatt-pop{0%{transform:scale(.3)}70%{transform:scale(1.08)}100%{transform:scale(1)}}",
    ".shatt-ok h2{font-family:Rubik,Assistant,Arial,sans-serif;font-size:27px;font-weight:900;margin:20px 0 6px}",
    ".shatt-ok p{color:#9FB6C8;margin:0 0 22px;font-size:15px;line-height:1.55}",
    ".shatt-ok button{background:none;border:1px solid rgba(255,255,255,.35);color:#fff;",
    "border-radius:14px;padding:13px 26px;font:600 1rem Assistant,Arial,sans-serif;cursor:pointer;",
    "display:inline-flex;align-items:center;gap:8px;min-height:48px}",
    "@media (max-width:360px){.shatt-digits span{width:54px;height:66px;font-size:32px}}",
    "@media (prefers-reduced-motion:reduce){.shatt-rec,.shatt-burst,.shatt-digits.bad{animation:none}}"
  ].join("");

  var aBox = null, aOk = null, aState = null;

  function aBuild() {
    styleOnce("shatt-css", A_CSS);
    if (aBox) return;

    aBox = d.createElement("div");
    aBox.className = "shatt";
    aBox.setAttribute("role", "dialog");
    aBox.setAttribute("aria-modal", "true");
    aBox.setAttribute("aria-label", "רישום נוכחות");
    aBox.hidden = true;
    aBox.innerHTML =
      '<div class="shatt-in">' +
        '<div class="shatt-top"><span class="shatt-rec"></span><span>המפגש מתקיים עכשיו</span>' +
          '<button type="button" class="shatt-x" id="shatt-close" aria-label="סגירה">' +
          icon(IC.x, 17) + "</button></div>" +
        '<h2 id="shatt-h">רישום נוכחות</h2>' +
        "<p>הקוד מוצג בזום.<small>יש חמש דקות לכל קוד, ואם הוא מתחלף בדיוק עכשיו — הקוד הקודם עוד מתקבל.</small></p>" +
        '<div class="shatt-digits" id="shatt-digits" translate="no" role="group" ' +
          'aria-label="קוד הנוכחות, ארבע ספרות"><span></span><span></span><span></span><span></span></div>' +
        '<div class="shatt-msg" id="shatt-msg" role="status" aria-live="polite"></div>' +
        '<div class="shatt-pad" id="shatt-pad" translate="no">' +
          "<button type=\"button\">1</button><button type=\"button\">2</button><button type=\"button\">3</button>" +
          "<button type=\"button\">4</button><button type=\"button\">5</button><button type=\"button\">6</button>" +
          "<button type=\"button\">7</button><button type=\"button\">8</button><button type=\"button\">9</button>" +
          '<button type="button" data-k="clr" aria-label="ניקוי">C</button>' +
          "<button type=\"button\">0</button>" +
          '<button type="button" data-k="del" aria-label="מחיקת ספרה">&#9003;</button>' +
        "</div>" +
      "</div>";

    aOk = d.createElement("div");
    aOk.className = "shatt-ok";
    aOk.setAttribute("role", "dialog");
    aOk.setAttribute("aria-modal", "true");
    aOk.hidden = true;
    aOk.innerHTML =
      '<div class="shatt-burst">' + icon(IC.check, 62) + "</div>" +
      '<h2 id="shatt-okh">נרשמת</h2>' +
      '<p id="shatt-okp"></p>' +
      '<button type="button" id="shatt-okb">' + icon(IC.video, 19) + "חזרה לזום</button>";

    d.body.appendChild(aBox);
    d.body.appendChild(aOk);

    el("shatt-close").addEventListener("click", aClose);
    el("shatt-okb").addEventListener("click", aClose);
    el("shatt-pad").addEventListener("click", function (ev) {
      var b = ev.target.closest ? ev.target.closest("button") : null;
      if (!b || b.disabled) return;
      var k = b.getAttribute("data-k");
      if (k === "clr") aSet("");
      else if (k === "del") aSet(aState.typed.slice(0, -1));
      else aPush(b.textContent);
    });
    d.addEventListener("keydown", aKey);
  }

  function aKey(ev) {
    if (!aState || aBox.hidden) return;
    if (ev.key === "Escape") { aClose(); return; }
    if (ev.key === "Backspace") { ev.preventDefault(); aSet(aState.typed.slice(0, -1)); return; }
    var dg = digits(ev.key);
    if (dg.length === 1) { ev.preventDefault(); aPush(dg); }
  }

  function aMsg(text, bad) {
    var m = el("shatt-msg");
    m.className = "shatt-msg" + (bad ? " bad" : "");
    m.innerHTML = (bad ? icon(IC.alert, 17) : "") + "<span>" + esc(text) + "</span>";
  }

  function aRender() {
    var boxes = el("shatt-digits").children;
    for (var i = 0; i < CODE_LEN; i++) {
      var ch = aState.typed.charAt(i);
      boxes[i].textContent = ch;
      boxes[i].className = ch ? "f" : "";
    }
  }

  function aSet(v) {
    aState.typed = digits(v).substring(0, CODE_LEN);
    aRender();
    if (aState.typed.length < CODE_LEN) aMsg("");
  }

  function aPush(ch) {
    if (aState.busy) return;
    if (aState.typed.length >= CODE_LEN) return;
    aSet(aState.typed + ch);
    if (aState.typed.length === CODE_LEN) aSend();
  }

  function aShake() {
    var box = el("shatt-digits");
    box.classList.remove("bad");
    /* קריאה מאולצת כדי שהאנימציה תרוץ שוב על אותו אלמנט */
    void box.offsetWidth;
    box.classList.add("bad");
    w.setTimeout(function () { box.classList.remove("bad"); }, 450);
  }

  function aBusy(on) {
    aState.busy = !!on;
    var bs = el("shatt-pad").getElementsByTagName("button");
    for (var i = 0; i < bs.length; i++) bs[i].disabled = !!on;
  }

  function aSend() {
    if (!w.SH_auth || !w.SH_auth.api) {
      aMsg("הדף לא נטען במלואו. לרענן ולנסות שוב.", true);
      return;
    }
    aBusy(true);
    aMsg("נרשם/ת…");
    /* מספר המפגש נוסע ב-n ולא ב-session: ב-auth.js השדה session נושא את
       טוקן הסשן, ו-api() מוסיף אותו לבד לכל POST. */
    w.SH_auth.api("checkin", { n: aState.num, code: aState.typed })
      .then(function (r) {
        aBusy(false);
        if (r && r.ok === true) {
          aDone(r);
          return;
        }
        var code = r && r.error;
        aShake();
        aSet("");
        aMsg(errText(code), true);
        if (code === "locked" || code === "closed" || code === "nosession") aBusy(true);
      })
      .catch(function () {
        aBusy(false);
        aShake();
        aMsg(errText("network"), true);
      });
  }

  function aDone(r) {
    var n = Number(r.session || aState.num);
    el("shatt-okh").textContent = "נרשמת למפגש " + n;
    el("shatt-okp").innerHTML =
      "הנוכחות תאושר אחרי המפגש" + (r.again ? "<br>הרישום שלך כבר היה קיים, ולא נוצר כפול" : "") +
      "<br>ותופיע בטבעת שלך מחר";
    aBox.hidden = true;
    aOk.hidden = false;
    el("shatt-okb").focus();
    if (typeof aState.onDone === "function") { try { aState.onDone(r); } catch (e) { /* לא מפיל את המסך */ } }
  }

  function aClose() {
    if (!aBox) return;
    aBox.hidden = true;
    if (aOk) aOk.hidden = true;
    if (aState && aState.prev && aState.prev.focus) { try { aState.prev.focus(); } catch (e) { /* הוסר מה-DOM */ } }
  }

  /* SH_attend.open(n, {code}) — הקריאה שמסך הבית של משימה 4 עושה ביום מפגש.

     opts.code הוא מה שכבר הוקלד במסך הבית. בלעדיו קרה הדבר הבא: המשתתף
     הקליד את הקוד בשדה שבמסך הבית, לחץ "שליחה", וכאן נפתח חלון שני עם
     לוח ספרות ריק — כי typed אופס. מבחינתו הוא הקליד והמערכת ביקשה שוב,
     ושום בקשה לא נשלחה לשרת. נמצא בחזרה היבשה של מיטל, 21.9.26. */
  function aOpen(num, opts) {
    var n = Number(digits(num));
    var pre = digits((opts && opts.code) || "").substring(0, CODE_LEN);
    aBuild();
    aState = {
      num: n,
      typed: "",
      busy: false,
      prev: d.activeElement,
      onDone: opts && opts.onDone
    };
    el("shatt-h").innerHTML = n ? "מפגש " + n + "<br>רישום נוכחות" : "רישום נוכחות";
    aOk.hidden = true;
    aBox.hidden = false;
    aBusy(false);
    aRender();
    aMsg("");
    if (!n) { aMsg(errText("nonum"), true); return; }

    /* קוד שכבר הוקלד במסך הבית: ממשיכים ממנו. שלם — נשלח מיד ולא
       מבקשים מהמשתתף להקליד פעם שנייה. חלקי — מוצג בלוח כדי שישלים. */
    if (pre) {
      aSet(pre);
      if (pre.length === CODE_LEN) { aSend(); return; }
    }

    var first = el("shatt-pad").getElementsByTagName("button")[0];
    if (first) first.focus();
  }

  w.SH_attend = {
    open: aOpen,
    close: aClose,
    isOpen: function () { return !!(aBox && (!aBox.hidden || (aOk && !aOk.hidden))); },
    errText: errText
  };

  /* ================================================================== */
  /* =============== SH_team — מסך "היום" של מיטל ==================== */
  /* ================================================================== */

  var T = {
    key: "",
    track: "",
    sel: 0,          /* המפגש שנבחר בתיבה (לא בהכרח הפתוח) */
    code: null,      /* התשובה האחרונה של what=code */
    live: null,      /* התשובה האחרונה של what=live */
    endsAt: 0,       /* מתי הקוד מתחלף, בשעון המקומי */
    tick: null,
    poll: null,
    fetching: false,
    marking: null,   /* sid שנבחר לסימון ידני */
    /* מונה דורות. כל החלפת מסלול או מפגש מקדמת אותו, וכל תשובה שחוזרת
       מדור ישן נזרקת. בלי זה תשובה איטית של כלים/מפגש 1 דרסה את הבחירה
       החדשה, וקריאת האישור נבנתה ממסלול חדש ומספר מפגש ישן — כלומר אישור
       נוכחות למפגש הלא נכון (סקירת קודקס 20.9.26). */
    gen: 0
  };

  function bump() { T.gen++; return T.gen; }

  var CIRC = 2 * Math.PI * 52;   /* היקף טבעת הספירה, r=52 */

  function api(body) {
    var o = { key: T.key, track: T.track };
    for (var k in (body || {})) if (Object.prototype.hasOwnProperty.call(body, k)) o[k] = body[k];
    return w.SH_auth.post(o);
  }

  function apiGet(what, extra) {
    var u = w.SH_auth.API + "?mode=meet&what=" + encodeURIComponent(what) +
            "&key=" + encodeURIComponent(T.key) +
            "&track=" + encodeURIComponent(T.track);
    if (extra) u += extra;
    return w.SH_auth.fetchJson(u + "&_=" + Date.now());
  }

  function toast(text, bad) {
    var box = el("t-toast");
    if (!box) return;
    box.className = "t-toast" + (bad ? " bad" : "") + (text ? " on" : "");
    box.innerHTML = text ? (bad ? icon(IC.alert, 17) : icon(IC.check, 17)) + "<span>" + esc(text) + "</span>" : "";
    if (text) w.setTimeout(function () { if (box.innerHTML.indexOf(esc(text)) > -1) toast(""); }, 4200);
  }

  /* ---------------------------- הקוד והשעון ---------------------------- */

  function drawRing(left, full) {
    var arc = el("t-arc");
    if (!arc) return;
    var frac = full > 0 ? Math.max(0, Math.min(1, left / full)) : 0;
    arc.setAttribute("stroke-dasharray", CIRC.toFixed(1));
    arc.setAttribute("stroke-dashoffset", (CIRC * (1 - frac)).toFixed(1));
  }

  function renderCode() {
    var c = T.code || {};
    var bigEl = el("t-code"), noteEl = el("t-note"), ttl = el("t-codeh");
    if (!bigEl) return;

    if (!c.open) {
      bigEl.textContent = "— — — —";
      noteEl.textContent = "הרישום סגור";
      ttl.textContent = "רישום נוכחות";
      drawRing(0, 1);
      el("t-openBtn").hidden = false;
      el("t-closeBtn").hidden = true;
      el("t-copyCode").hidden = true;
      return;
    }

    el("t-openBtn").hidden = true;
    el("t-closeBtn").hidden = false;
    el("t-copyCode").hidden = false;
    ttl.textContent = "רישום נוכחות · מפגש " + c.session;
    bigEl.textContent = c.code || "";

    var full = (Number(c.codeMinutes) || 5) * 60;
    var left = Math.max(0, Math.round((T.endsAt - Date.now()) / 1000));
    drawRing(left, full);

    var txt = left > 0
      ? "מתחלף בעוד " + mmss(left)
      : "מתחלף עכשיו";
    if (c.grace) txt += " · הקוד הקודם עוד מתקבל";
    noteEl.textContent = txt;
  }

  /* השעון מתרוקן בדפדפן, והשרת נשאל רק כשהחלון נגמר. התצוגה נשארת על
     אותו קוד עד שהקוד החדש חוזר — וזה תקין, כי הוא עוד מתקבל ב-grace. */
  function startTick() {
    if (T.tick) w.clearInterval(T.tick);
    T.tick = w.setInterval(function () {
      renderCode();
      if (T.code && T.code.open && T.endsAt && Date.now() >= T.endsAt && !T.fetching) {
        T.endsAt = Date.now() + 8000;   /* לא לשאול שוב לפני שהתשובה חוזרת */
        loadCode();
      }
    }, 1000);
  }

  function loadCode() {
    if (!T.key || !T.track) return Promise.resolve();
    T.fetching = true;
    var mine = T.gen, track = T.track;
    return apiGet("code").then(function (r) {
      if (mine !== T.gen || track !== T.track) return;   /* תשובה מדור ישן */
      T.fetching = false;
      if (!r || r.ok !== true) {
        if (r && r.error === "badkey") return gate("המפתח לא זוהה. להדביק מחדש את הקישור שקיבלת.");
        toast(errText(r && r.error), true);
        return;
      }
      T.code = r;
      T.endsAt = Date.now() + (Number(r.secondsLeft) || 0) * 1000;
      if (r.open && !T.sel) T.sel = Number(r.session);
      renderCode();
      renderPicker();
    }).catch(function () {
      T.fetching = false;
      toast(errText("network"), true);
    });
  }

  /* ---------------------------- הרשימה החיה ---------------------------- */

  function loadLive() {
    if (!T.key || !T.track) return Promise.resolve();
    var n = T.sel ? "&n=" + encodeURIComponent(T.sel) : "";
    var mine = T.gen, track = T.track, sel = T.sel;
    return apiGet("live", n).then(function (r) {
      /* נזרקת תשובה של דור ישן, של מסלול אחר, או של מפגש שכבר אינו הנבחר.
         בלי הבדיקה הזאת T.live היה מתמלא בנתוני מסלול אחד ו-T.track בשני. */
      if (mine !== T.gen || track !== T.track || sel !== T.sel) return;
      if (!r || r.ok !== true) {
        if (r && r.error === "badkey") return gate("המפתח לא זוהה. להדביק מחדש את הקישור שקיבלת.");
        toast(errText(r && r.error), true);
        return;
      }
      if (r.track && String(r.track) !== String(T.track)) return;
      T.live = r;
      if (!T.sel && r.session) T.sel = Number(r.session);
      renderLive();
      renderPicker();
    }).catch(function () {
      toast(errText("network"), true);
    });
  }

  function num(id, v) {
    var e = el(id);
    if (e) e.textContent = String(v === undefined || v === null ? 0 : v);
  }

  function chip(p, on) {
    var cls = "t-pp" + (on ? " in" : "") + (p.risk ? " risk" : "");
    var st = on
      ? (p.approved ? "אושר" : "נרשם/ה")
      : (p.state ? p.state : (p.risk ? "בסיכון" : "ממתין"));
    return '<button type="button" class="' + cls + '" data-sid="' + esc(p.sid) + '" ' +
      'title="' + esc(p.name + " · " + p.school) + '">' +
      '<span class="av">' + esc(String(p.name || "?").charAt(0)) + "</span>" +
      "<span class=\"nm\">" + esc(p.name) + "</span>" +
      '<span class="st">' + esc(st) + "</span></button>";
  }

  function renderLive() {
    var L = T.live;
    if (!L) return;

    num("t-nReg", L.counts.registered);
    num("t-nRev", L.counts.review);
    num("t-nRisk", L.counts.risk);
    num("t-nSync", L.counts.synced);
    el("t-riskNote").textContent = "שתי היעדרויות ומעלה (הסף בהגדרות: " + L.riskAbsences + ")";

    el("t-attH").textContent = L.counts.registered;
    el("t-attS").textContent = "מתוך " + L.total + " במסלול " + L.track +
      (L.session ? " · מפגש " + L.session : "");

    /* מי שנרשם עולה למעלה, כדי שהצ'יפים "נדלקים" במקום שהעין מסתכלת בו */
    var html = [];
    for (var i = 0; i < L.registered.length; i++) html.push(chip(L.registered[i], true));
    for (var j = 0; j < L.missing.length; j++) html.push(chip(L.missing[j], false));
    el("t-people").innerHTML = html.join("") ||
      '<div class="t-empty">אין משתתפים במסלול הזה בגיליון.</div>';

    var miss = [];
    for (var k = 0; k < L.missing.length; k++) {
      var m = L.missing[k];
      miss.push('<li' + (m.risk ? ' class="risk"' : "") + '><b>' + esc(m.name) + "</b>" +
        '<span>' + esc(m.school) + "</span>" +
        '<em>' + esc(m.state || (m.absences ? m.absences + " היעדרויות" : "")) + "</em></li>");
    }
    el("t-missH").textContent = "מי עוד לא נרשם · " + L.missing.length;
    el("t-miss").innerHTML = miss.join("") || '<li class="ok">כולם נרשמו.</li>';
    el("t-copy").disabled = !L.missing.length;

    renderApprove();
    renderMark();
    el("t-body").hidden = false;
  }

  function renderPicker() {
    var L = T.live, sel = el("t-session");
    if (!L || !sel) return;
    var open = T.code && T.code.open ? Number(T.code.session) : 0;
    /* הרשימה נבנית מחדש רק כשמשהו בה באמת השתנה. בלי זה כל ריענון של
       20 שניות היה סוגר את התיבה בדיוק כשמיטל בוחרת בה מפגש. */
    var sig = L.track + "|" + open + "|" + T.sel + "|" + L.sessions.length;
    if (sel.getAttribute("data-sig") === sig) { renderWarn(open); return; }
    sel.setAttribute("data-sig", sig);
    var html = [];
    for (var i = 0; i < L.sessions.length; i++) {
      var s = L.sessions[i];
      var tag = s.num === open ? " · רישום פתוח" :
        (s.state === "now" ? " · היום" : (s.state === "past" ? "" : " · טרם"));
      html.push('<option value="' + s.num + '"' + (Number(T.sel) === s.num ? " selected" : "") + ">" +
        "מפגש " + s.num + " · " + esc(s.date) + " · " + esc(s.topic).substring(0, 42) + esc(tag) + "</option>");
    }
    sel.innerHTML = html.join("");
    renderWarn(open);
  }

  /* אזהרה כשהרישום פתוח למפגש שאינו של היום — דחייה קורית, ומיטל
     צריכה לראות את זה ולא לגלות אחר כך שנרשמו למפגש הלא נכון. */
  function renderWarn(open) {
    var L = T.live, warn = el("t-warn");
    if (!L || !warn) return;
    var openDef = null;
    for (var j = 0; j < L.sessions.length; j++) if (L.sessions[j].num === open) openDef = L.sessions[j];
    if (open && openDef && openDef.state !== "now") {
      warn.hidden = false;
      warn.innerHTML = icon(IC.alert, 17) +
        "<span>הרישום פתוח למפגש " + open + ", שתאריכו " + esc(openDef.date) + " ואינו היום.</span>";
    } else {
      warn.hidden = true;
    }
  }

  /* ---------------------------- סימון ידני ---------------------------- */

  function renderMark() {
    var panel = el("t-mark");
    if (!panel) return;
    if (!T.marking || !T.live) { panel.hidden = true; return; }

    var L = T.live, p = null, list = L.registered.concat(L.missing);
    for (var i = 0; i < list.length; i++) if (list[i].sid === T.marking) p = list[i];
    if (!p) { T.marking = null; panel.hidden = true; return; }

    var states = L.states || [];
    var btns = [];
    for (var j = 0; j < states.length; j++) {
      btns.push('<button type="button" data-state="' + esc(states[j]) + '"' +
        (p.state === states[j] ? ' class="on"' : "") + ">" + esc(states[j]) + "</button>");
    }
    panel.innerHTML =
      '<div class="t-markh"><b>' + esc(p.name) + "</b><span>" + esc(p.school) + "</span>" +
      '<em>' + (p.state ? esc(p.state) : "לא מסומן") + " · " + p.absences + " היעדרויות</em>" +
      '<button type="button" class="t-markx" data-close="1" aria-label="סגירה">' + icon(IC.x, 16) + "</button></div>" +
      '<div class="t-states" role="group" aria-label="מצב נוכחות">' + btns.join("") + "</div>" +
      '<label class="t-notel">הערה ליומן (לא חובה)' +
      '<input type="text" id="t-note" maxlength="300" value="' + esc(p.note || "") + '"></label>' +
      '<div class="t-markf">כל שינוי נרשם ביומן עם מי ומתי. היעדרות נשארת היעדרות — אין מסלול השלמה.</div>';
    panel.hidden = false;
  }

  function doMark(state) {
    var note = el("t-note") ? el("t-note").value : "";
    var sid = T.marking, n = T.sel;
    if (!sid || !n) return;
    api({ action: "meetMark", session: n, sid: sid, state: state, note: note }).then(function (r) {
      if (!r || r.ok !== true) { toast(errText(r && r.error), true); return; }
      toast("סומן: " + r.state);
      T.marking = null;
      loadLive();
    }).catch(function () { toast(errText("network"), true); });
  }

  /* ---------------------------- תזכורת להעתקה ---------------------------- */

  function reminderText() {
    var L = T.live;
    if (!L) return "";
    var lines = [];
    lines.push("תזכורת נוכחות · " + L.track + " · מפגש " + (L.session || T.sel) +
      (L.date ? " · " + L.date : ""));
    if (L.topic) lines.push(L.topic);
    lines.push("");
    lines.push("טרם נרשמו (" + L.missing.length + "):");
    for (var i = 0; i < L.missing.length; i++) {
      var m = L.missing[i];
      lines.push("· " + m.name + " — " + m.school +
        (m.risk ? "  (בסיכון: " + m.absences + " היעדרויות)" : ""));
    }
    lines.push("");
    lines.push("הרישום נעשה במודול, בקוד שמוצג בזום. הקוד מתחלף כל חמש דקות,");
    lines.push("והקוד הקודם ממשיך להתקבל, כך שאין לחץ אם הוא התחלף בדיוק עכשיו.");
    return lines.join("\n");
  }

  /* הודעה מוכנה לצ'אט הזום. מיטל ביקשה (21.9): הרכזים לא יודעים לבד
     לאן להקליד את הקוד, והיא הסבירה את זה בעל פה לכל אחד בנפרד.
     הקוד מתחלף כל חמש דקות, ולכן ההודעה נבנית מהקוד שמוצג ברגע ההעתקה. */
  function zoomChatText() {
    var c = T.code || {};
    if (!c.open || !c.code) return "";
    return "רישום נוכחות למפגש " + c.session + ":\n" +
      "פתחו את הקישור האישי שקיבלתם בוואטסאפ או במייל,\n" +
      "ובראש המסך הקלידו את הקוד: " + c.code + "\n" +
      "הקוד מתחלף כל " + (Number(c.codeMinutes) || 5) + " דקות.";
  }

  function copyText_(text, okMsg) {
    if (!text) return;
    function fallback() {
      var ta = d.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "readonly");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      d.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = d.execCommand("copy"); } catch (e) { ok = false; }
      d.body.removeChild(ta);
      toast(ok ? okMsg : "ההעתקה נחסמה. לסמן את הטקסט ולהעתיק ביד.", !ok);
    }
    if (w.navigator && w.navigator.clipboard && w.navigator.clipboard.writeText) {
      w.navigator.clipboard.writeText(text).then(function () { toast(okMsg); }).catch(fallback);
    } else {
      fallback();
    }
  }

  function copyZoomChat() {
    var t = zoomChatText();
    if (!t) { toast("אין קוד פעיל. לפתוח רישום קודם.", true); return; }
    copyText_(t, "ההודעה הועתקה · אפשר להדביק בצ׳אט הזום");
  }

  function copyReminder() {
    var text = reminderText();
    if (!text) return;
    function fallback() {
      var ta = d.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "readonly");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      d.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = d.execCommand("copy"); } catch (e) { ok = false; }
      d.body.removeChild(ta);
      toast(ok ? "התזכורת הועתקה" : "ההעתקה נחסמה. לסמן את הרשימה ולהעתיק ביד.", !ok);
    }
    if (w.navigator && w.navigator.clipboard && w.navigator.clipboard.writeText) {
      w.navigator.clipboard.writeText(text)
        .then(function () { toast("התזכורת הועתקה · " + T.live.missing.length + " שמות"); })
        .catch(fallback);
    } else {
      fallback();
    }
  }


  /* ---------------------------- אישור המפגש ---------------------------- */

  /* הנוכחות שנרשמה בקוד מחכה לאישור של מיטל. עד שהוא ניתן, הסנכרון
     לקובץ של שני מדלג עליה, ולכן זו הלחיצה שסוגרת את המפגש בפועל.
     "לבדיקה" לא נכלל: את ההכרעה עליו עושים בשם, לא בכמות. */
  function pendingApproval() {
    var L = T.live, out = [];
    if (!L || !L.registered) return out;
    for (var i = 0; i < L.registered.length; i++) {
      if (!L.registered[i].approved) out.push(L.registered[i]);
    }
    return out;
  }

  function renderApprove() {
    var btn = el("t-okBtn"), lbl = el("t-okLbl"), note = el("t-okNote");
    if (!btn || !T.live) return;
    var L = T.live;
    var n = pendingApproval().length;
    var openHere = T.code && T.code.open && Number(T.code.session) === Number(L.session);

    btn.disabled = !n;
    btn.className = openHere && n ? "warn" : "";
    lbl.textContent = openHere ? "סיום המפגש ואישור הנוכחות" : "אישור נוכחות המפגש";

    note.className = "";
    if (!L.session) { note.textContent = "לבחור מפגש."; return; }
    if (n) {
      note.textContent = n + " ממתינים לאישור" +
        (L.counts.review ? " · " + L.counts.review + " מסומנים לבדיקה ולא יאושרו" : "") +
        (openHere ? " · הרישום עדיין פתוח וייסגר בלחיצה" : "");
      return;
    }
    if (L.counts.registered) {
      note.className = "done";
      note.textContent = "כל " + L.counts.registered + " הנרשמים מאושרים" +
        (L.counts.review ? " · " + L.counts.review + " עדיין לבדיקה" : "") + ".";
      return;
    }
    note.textContent = "אף אחד לא נרשם עדיין למפגש הזה.";
  }

  function approveMeeting() {
    var L = T.live;
    if (!L || !L.session) { toast("לבחור מפגש", true); return; }

    /* המסלול והמפגש נלקחים מאותה תשובה אחת ונבדקים מול הבחירה שעל המסך.
       קודם המסלול נלקח מ-T.track והמפגש מ-L.session, ולכן תשובה ישנה
       יכלה לייצר אישור למסלול אחד ולמפגש של אחר (סקירת קודקס 20.9.26). */
    var track = String(L.track || T.track);
    var session = Number(L.session);
    if (track !== String(T.track) || (T.sel && Number(T.sel) !== session)) {
      toast("המסך התחלף באמצע. לרענן ולנסות שוב.", true);
      loadLive();
      return;
    }

    var list = pendingApproval();
    if (!list.length) { toast("אין מה לאשר", true); return; }
    var openHere = T.code && T.code.open && Number(T.code.session) === session;

    var q = "לאשר את הנוכחות של " + list.length + " משתתפים במפגש " + session + "?";
    if (L.counts.review) q += "\n" + L.counts.review + " מסומנים לבדיקה ולא יאושרו.";
    if (openHere) q += "\nהרישום ייסגר, ומי שלא נרשם עד עכשיו לא יוכל להירשם.";
    q += "\n\nאחרי האישור הנוכחות נכתבת לקובץ של שני בסנכרון הבא.";
    if (!w.confirm(q)) return;

    sendApprove(track, session, openHere, "");
  }

  /* מופרד כדי שאפשר יהיה לחזור עליו עם עקיפה, בלי לשאול הכל שוב */
  function sendApprove(track, session, openHere, force) {
    var btn = el("t-okBtn");
    if (btn) btn.disabled = true;
    api({
      action: "meetApprove", track: track, session: session,
      close: openHere ? "כן" : "", force: force || ""
    }).then(function (r) {
      /* השרת חוסם אישור סופי לפני שיובא דוח הזום, כדי שההצלבה לא תתבטל.
         העקיפה קיימת למקרה שזום נפל ביום המפגש, והיא נרשמת ביומן. */
      if (r && r.error === "nozoom") {
        if (btn) btn.disabled = false;
        var ask = "טרם יובא דוח הזום למפגש " + session + ".\n\n" +
          "בלי הדוח אי אפשר לדעת מי באמת היה בזום, ומי קיבל את הקוד מחבר.\n" +
          "מומלץ לייבא קודם את הדוח (הכפתור \"ייבוא דוח זום\") ורק אז לאשר.\n\n" +
          "לאשר בכל זאת, בלי הצלבה? זה יירשם ביומן.";
        if (w.confirm(ask)) sendApprove(track, session, openHere, "כן");
        else renderApprove();
        return;
      }
      if (!r || r.ok !== true) { toast(errText(r && r.error), true); renderApprove(); return; }
      if (r.closed) {
        T.code = { ok: true, open: false, track: T.track, codeMinutes: (T.code && T.code.codeMinutes) || 5 };
        renderCode();
      }
      toast("אושרו " + r.approved + " משתתפים" +
        (r.skipped && r.skipped.review ? " · " + r.skipped.review + " נשארו לבדיקה" : "") +
        (r.closed ? " · הרישום נסגר" : "") +
        (r.forced ? " · בלי הצלבת זום" : ""));
      loadLive();
    }).catch(function () { toast(errText("network"), true); renderApprove(); });
  }

  /* ---------------------------- פתיחה וסגירה ---------------------------- */

  function openReg() {
    var n = Number(el("t-session").value);
    if (!n) { toast("לבחור מפגש", true); return; }
    api({ action: "meetOpen", session: n }).then(function (r) {
      if (!r || r.ok !== true) {
        toast(errText(r && r.error) + (r && r.session ? " (מפגש " + r.session + ")" : ""), true);
        return;
      }
      T.code = r;
      T.sel = Number(r.session);
      T.endsAt = Date.now() + (Number(r.secondsLeft) || 0) * 1000;
      toast(r.again ? "הרישום כבר היה פתוח" : "הרישום נפתח למפגש " + r.session);
      renderCode();
      loadLive();
    }).catch(function () { toast(errText("network"), true); });
  }

  function closeReg() {
    var open = T.code && T.code.open ? Number(T.code.session) : 0;
    if (!open) { toast(errText("notopen"), true); return; }
    if (!w.confirm("לסגור את הרישום למפגש " + open + "? מי שלא נרשם עד עכשיו לא יוכל להירשם.")) return;
    api({ action: "meetClose", session: open }).then(function (r) {
      if (!r || r.ok !== true) { toast(errText(r && r.error), true); return; }
      T.code = { ok: true, open: false, track: T.track, codeMinutes: (T.code && T.code.codeMinutes) || 5 };
      toast("הרישום נסגר");
      renderCode();
      loadLive();
    }).catch(function () { toast(errText("network"), true); });
  }

  /* ---------------------------- המפתח והשער ---------------------------- */

  var KEY_STORE = "shag.teamkey";

  /* המפתח עשוי להגיע כקישור מלא, עם #, או לבדו. אותה לוגיקה כמו
     dashboard-elnet.html, כדי שקישור שנחתך בדרך לא יתקע את מיטל. */
  function keyFrom(text) {
    var t = String(text || "").trim();
    var m = t.match(/[?&#](?:key|k)=(adm-[0-9a-z-]{8,64})/i) || t.match(/^(adm-[0-9a-z-]{8,64})$/i);
    return m ? m[1] : "";
  }

  function keyGet() {
    try { return w.localStorage.getItem(KEY_STORE) || ""; } catch (e) { return ""; }
  }

  function keySet(k) {
    try { w.localStorage.setItem(KEY_STORE, k); } catch (e) { /* חלון פרטי */ }
  }

  function gate(msg) {
    T.key = "";
    try { w.localStorage.removeItem(KEY_STORE); } catch (e) { /* אין מה למחוק */ }
    if (T.tick) w.clearInterval(T.tick);
    if (T.poll) w.clearInterval(T.poll);
    el("t-body").hidden = true;
    el("t-gate").hidden = false;
    var e = el("t-gerr");
    e.hidden = !msg;
    e.textContent = msg || "";
    el("t-keyin").focus();
  }

  function begin(k) {
    T.key = k;
    keySet(k);
    el("t-gate").hidden = true;
    el("t-gerr").hidden = true;
    loadCode().then(loadLive);
    startTick();
    if (T.poll) w.clearInterval(T.poll);
    /* ריענון הרשימה החיה. 20 שניות זה מספיק "בזמן אמת" לעין, ולא
       מבזבז מכסת קריאות של Apps Script לאורך מפגש של שעתיים. */
    T.poll = w.setInterval(loadLive, 20000);
  }

  function setTrack(track) {
    bump();
    T.track = track;
    T.sel = 0;
    T.code = null;
    T.live = null;
    T.marking = null;
    var bs = el("t-tracks").getElementsByTagName("button");
    for (var i = 0; i < bs.length; i++) {
      bs[i].setAttribute("aria-pressed", bs[i].getAttribute("data-track") === track ? "true" : "false");
    }
    try { w.localStorage.setItem("shag.teamtrack", track); } catch (e) { /* לא קריטי */ }
    if (T.key) { loadCode().then(loadLive); }
  }

  function tStart(opts) {
    var o = opts || {};
    var tracks = o.tracks || ["כלים", "הובלה"];

    el("t-tracks").addEventListener("click", function (ev) {
      var b = ev.target.closest ? ev.target.closest("button[data-track]") : null;
      if (b) setTrack(b.getAttribute("data-track"));
    });
    el("t-openBtn").addEventListener("click", openReg);
    el("t-closeBtn").addEventListener("click", closeReg);
    el("t-okBtn").addEventListener("click", approveMeeting);
    el("t-copy").addEventListener("click", copyReminder);
    el("t-copyCode").addEventListener("click", copyZoomChat);
    el("t-session").addEventListener("change", function () {
      bump();
      T.sel = Number(el("t-session").value);
      T.live = null;      /* לא להציג רשימה של המפגש הקודם בזמן הטעינה */
      T.marking = null;
      loadLive();
    });
    el("t-people").addEventListener("click", function (ev) {
      var b = ev.target.closest ? ev.target.closest("button[data-sid]") : null;
      if (!b) return;
      var sid = b.getAttribute("data-sid");
      T.marking = T.marking === sid ? null : sid;
      renderMark();
      if (T.marking) el("t-mark").scrollIntoView({ block: "nearest" });
    });
    el("t-mark").addEventListener("click", function (ev) {
      if (!ev.target.closest) return;
      if (ev.target.closest("[data-close]")) { T.marking = null; renderMark(); return; }
      var b = ev.target.closest("button[data-state]");
      if (b) doMark(b.getAttribute("data-state"));
    });
    el("t-keyGo").addEventListener("click", function () {
      var k = keyFrom(el("t-keyin").value);
      if (!k) {
        el("t-gerr").hidden = false;
        el("t-gerr").textContent = "זה לא נראה כמו המפתח. הוא מתחיל ב-adm-";
        return;
      }
      begin(k);
    });
    el("t-keyin").addEventListener("keydown", function (ev) {
      if (ev.key === "Enter") el("t-keyGo").click();
    });

    var saved = "";
    try { saved = w.localStorage.getItem("shag.teamtrack") || ""; } catch (e) { saved = ""; }
    setTrack(tracks.indexOf(saved) > -1 ? saved : tracks[0]);

    /* המפתח מהכתובת, ומיד אחר כך ניקוי סרגל הכתובת — שלא יישאר
       בהיסטוריה, בצילום מסך או בשיתוף מסך בזום. כמו ב-dashboard-elnet. */
    var fromUrl = keyFrom(w.location.search) || keyFrom(w.location.hash);
    if (fromUrl) {
      try { w.history.replaceState(null, "", w.location.pathname); } catch (e) { /* דפדפן ישן */ }
      begin(fromUrl);
      return;
    }
    var stored = keyFrom(keyGet());
    if (stored) { begin(stored); return; }
    gate("");
  }

  w.SH_team = {
    start: tStart,
    reload: function () { loadCode().then(loadLive); },
    state: function () { return { track: T.track, session: T.sel, open: !!(T.code && T.code.open) }; },
    reminderText: reminderText,
    errText: errText
  };
})(window, document);
