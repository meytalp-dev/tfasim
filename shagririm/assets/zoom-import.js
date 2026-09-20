/**
 * שגרירי חדשנות טכנולוגית — מודול הלמידה. ייבוא דוח הזום (צד לקוח).
 * משימה 6 באפיון: רויטל\אפיון-מודול-שגרירי-חדשנות.md (סעיף 5.1, צעד 3).
 *
 * הזרימה במסך "היום" (team.html):
 *   1. מיטל לוחצת "CSV מזום", בוחרת קובץ או מדביקה שמות.
 *   2. הקובץ נקרא ומפוענח כאן, בדפדפן: BOM, פסיקים בתוך מירכאות, כמה
 *      כניסות של אותו אדם (הדקות מתחברות), שורת המארח, וחדר ההמתנה.
 *   3. השמות מותאמים לרשימת המשתתפים של המסלול (what=live). ציון 0.6
 *      ומעלה = התאמה אוטומטית. מתחת לזה, ושמות באותיות לטיניות — בחירה ידנית.
 *   4. טבלת בדיקה *לפני* שמירה: הותאמו / דורשים בחירה / לא משתתפים /
 *      נרשמו בקוד ולא מופיעים בזום. שום דבר לא נשלח עד "שמירה".
 *   5. "שמירה" שולחת רק זוגות (מזהה משתתף, דקות). קובץ הזום עצמו ושמות של
 *      מי שאינו משתתף לא יוצאים מהדפדפן.
 *
 * הלוגיקה של הפענוח וההתאמה מועתקת ממערכת המדריכים
 * (pedagogia-mh\hadrachot\guide\meetings.js, 14.9.26), שכבר עבדה על דוחות אמיתיים.
 * מה נוסף כאן: דילוג על חדר ההמתנה, זיהוי המארח לפי תגית ולפי המייל
 * בטבלת הסיכום, ואיחוד חפיפות כששני מכשירים של אותו אדם מחוברים יחד.
 *
 * רשת: SH_auth.fetchJson / SH_auth.post בלבד (שלושה ניסיונות).
 * פרטיות: אין בקובץ הזה שם, בית ספר, מייל או מפתח של משתתף.
 * השם היחיד כאן הוא של המארחת (מיטל), כדי לא להתאים אותה למשתתף.
 */
(function (w, d) {
  "use strict";

  var KEY_STORE = "shag.teamkey";          /* אותו מקום שבו attend.js שומר את המפתח */
  var AUTO_SCORE = 0.6;
  var CAND_SCORE = 0.5;
  var DEFAULT_MIN = 60;                     /* עד שהשרת עונה עם zoomMinMinutes */
  var NOT_PART = "-";                       /* "לא משתתף/ת" בתיבת הבחירה */
  var HOW_CODE = "קוד";
  /* השם כפי שהוא מופיע בזום, לא השם במערכת. בדוח מ-9.9.26 הוא יצא
     "מילי פלג", והזיהוי לפי "מיטל פלג" נכשל. אם מיטל משנה את שם התצוגה
     בזום — להוסיף אותו כאן. גם בלי זיהוי אפשר לסמן את השורה ידנית
     כ"לא משתתף/ת" במסך הביקורת, ולכן זו נוחות ולא חסם. */
  var HOST_NAMES = ["מילי פלג", "מיטל פלג", "Meytal Peleg", "Mili Peleg"];

  /* ------------------------------------------------------------------ */
  /* עזר                                                                */
  /* ------------------------------------------------------------------ */

  function el(id) { return d.getElementById(id); }

  function esc(s) {
    return String(s === null || s === undefined ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function icon(inner, size) {
    return '<svg viewBox="0 0 24 24" width="' + (size || 18) + '" height="' + (size || 18) +
      '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" ' +
      'stroke-linejoin="round" aria-hidden="true">' + inner + "</svg>";
  }

  var IC = {
    check: '<path d="M5 12l5 5 9-10"/>',
    alert: '<circle cx="12" cy="12" r="8.5"/><path d="M12 8v4.5"/><path d="M12 15.6v.4"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
    save: '<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4"/><rect x="8" y="13" width="8" height="5" rx="1"/>'
  };

  function styleOnce(id, css) {
    if (el(id)) return;
    var st = d.createElement("style");
    st.id = id;
    st.appendChild(d.createTextNode(css));
    d.head.appendChild(st);
  }

  function toast(text, bad) {
    var box = el("t-toast");
    if (!box) return;
    box.className = "t-toast" + (bad ? " bad" : "") + (text ? " on" : "");
    box.innerHTML = text ? icon(bad ? IC.alert : IC.check, 17) + "<span>" + esc(text) + "</span>" : "";
    if (text) w.setTimeout(function () { if (box.innerHTML.indexOf(esc(text)) > -1) toast(""); }, 4200);
  }

  function hasPart(how, part) {
    var p = String(how || "").split("+");
    for (var i = 0; i < p.length; i++) if (p[i].trim() === part) return true;
    return false;
  }

  /* ------------------------------------------------------------------ */
  /* פענוח ה-CSV                                                        */
  /* ------------------------------------------------------------------ */

  function parseCsv(text) {
    var rows = [], row = [], cell = "", q = false;
    var t = String(text || "").replace(/^﻿/, "");
    var first = t.split("\n")[0];
    var delim = (first.match(/\t/g) || []).length > (first.match(/,/g) || []).length ? "\t" : ",";
    for (var i = 0; i < t.length; i++) {
      var ch = t.charAt(i);
      if (q) {
        if (ch === '"') {
          if (t.charAt(i + 1) === '"') { cell += '"'; i++; } else q = false;
        } else cell += ch;
      } else if (ch === '"' && !cell.trim()) q = true;   /* מירכאה באמצע תא (דוא"ל) היא תו רגיל */
      else if (ch === delim) { row.push(cell); cell = ""; }
      else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && t.charAt(i + 1) === "\n") i++;
        row.push(cell); rows.push(row); row = []; cell = "";
      } else cell += ch;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows.map(function (r) { return r.map(function (c) { return c.trim(); }); });
  }

  function findIdx(low, re) {
    for (var i = 0; i < low.length; i++) if (re.test(low[i])) return i;
    return -1;
  }

  var HOST_TAG = /\s*\((host|co-?host|מארח|מארחת|מארח שותף|מארחת שותפה)\)\s*/ig;

  /* זמן הצטרפות/עזיבה במילישניות, או NaN. משמש רק כשהוא מתיישב עם המשך
     שהזום עצמו כתב — כך תאריך בפורמט יום/חודש שפוענח הפוך לא מזיק. */
  function timeMs(s) {
    var v = Date.parse(String(s || "").replace(/\s+/g, " "));
    return isNaN(v) ? NaN : v;
  }

  function unionMinutes(spans) {
    var list = spans.slice().sort(function (a, b) { return a[0] - b[0]; });
    var total = 0, cs = -1, ce = -1;
    for (var i = 0; i < list.length; i++) {
      var s = list[i][0], e = list[i][1];
      if (cs < 0) { cs = s; ce = e; continue; }
      if (s <= ce) { if (e > ce) ce = e; continue; }
      total += ce - cs; cs = s; ce = e;
    }
    if (cs >= 0) total += ce - cs;
    return total / 60000;
  }

  /* מחזיר רשימת אנשים: {raw, display, minutes ("" = לא ידוע), email, host} */
  function zoomParse(text) {
    var rows = parseCsv(text).filter(function (r) { return r.some(Boolean); });
    var hIdx = -1, cols = null, hostMail = "";

    rows.forEach(function (r, i) {
      var low = r.map(function (c) { return c.toLowerCase(); });
      /* טבלת הסיכום בראש הקובץ: המייל שם הוא של המארח/ת */
      if (findIdx(low, /meeting id|מזהה פגישה|topic|נושא/) > -1 && rows[i + 1]) {
        var em = findIdx(low, /e-?mail|מייל|דוא"?ל/);
        if (em > -1 && rows[i + 1][em] && rows[i + 1][em].indexOf("@") > 0) {
          hostMail = rows[i + 1][em].toLowerCase();
        }
      }
      var name = findIdx(low, /^(name|שם|participant|משתתף|الاسم)|name \(|שם \(/);
      var email = findIdx(low, /e-?mail|מייל|דוא"?ל|דואר/);
      var extra = low.some(function (c) { return /join|leave|guest|הצטרפות|עזיבה|אורח/.test(c); }) || email >= 0;
      if (name >= 0 && !/host|מארח/.test(low[name]) && extra) {
        hIdx = i;
        cols = {
          name: name,
          email: email,
          dur: findIdx(low, /duration|משך|minutes|דקות|المدة/),
          join: findIdx(low, /join|הצטרפות/),
          leave: findIdx(low, /leave|עזיבה/),
          wait: findIdx(low, /waiting|המתנה/)
        };
      }
    });

    if (hIdx < 0) {
      /* בלי כותרות: הדבקה של רשימת שמות מחלון המשתתפים. אין דקות. */
      var seen = {}, out = [];
      rows.forEach(function (r) {
        var n = r[0];
        if (!n || n.length >= 80) return;
        var k = nameKey(n.replace(HOST_TAG, " "));
        if (!k || seen[k]) return;
        seen[k] = true;
        var tagged = HOST_TAG.test(n);
        HOST_TAG.lastIndex = 0;
        out.push(finish({ raw: n.replace(HOST_TAG, " ").trim(), minutes: "", email: "", spans: [], durs: [], tagged: tagged }, ""));
      });
      return out;
    }

    var byName = {}, order = [];
    rows.slice(hIdx + 1).forEach(function (r) {
      var raw = r[cols.name] || "";
      if (!raw) return;
      if (cols.wait >= 0 && /^(yes|כן|true|نعم)$/i.test(r[cols.wait] || "")) return;
      var tagged = HOST_TAG.test(raw);
      HOST_TAG.lastIndex = 0;
      var clean = raw.replace(HOST_TAG, " ").trim();
      var key = nameKey(clean.replace(/\s*\(.*\)\s*$/, "")) || nameKey(clean);
      if (!key) return;
      var it = byName[key];
      if (!it) {
        it = byName[key] = { raw: clean, minutes: 0, email: "", spans: [], durs: [], tagged: false };
        order.push(key);
      }
      it.tagged = it.tagged || tagged;
      var dur = cols.dur >= 0 ? (Number(String(r[cols.dur]).replace(/[^\d.]/g, "")) || 0) : NaN;
      if (!isNaN(dur)) { it.minutes += dur; it.durs.push(dur); }
      if (cols.join >= 0 && cols.leave >= 0) {
        var a = timeMs(r[cols.join]), b = timeMs(r[cols.leave]);
        it.spans.push(!isNaN(a) && !isNaN(b) && b >= a ? [a, b] : null);
      }
      if (cols.email >= 0 && r[cols.email]) it.email = r[cols.email].toLowerCase();
    });

    return order.map(function (k) {
      var it = byName[k];
      if (cols.dur < 0) it.minutes = "";
      return finish(it, hostMail);
    });
  }

  function finish(it, hostMail) {
    /* חפיפה (טלפון ומחשב יחד): הדקות הן איחוד הזמנים ולא הסכום, בתנאי
       שכל השורות פוענחו ושכל אחת מתיישבת עם המשך שהזום כתב. */
    var spans = it.spans || [];
    var okSpans = spans.length > 1 && spans.length === (it.durs || []).length;
    for (var i = 0; okSpans && i < spans.length; i++) {
      if (!spans[i] || Math.abs((spans[i][1] - spans[i][0]) / 60000 - it.durs[i]) > 2) okSpans = false;
    }
    var minutes = it.minutes;
    if (okSpans) {
      var u = unionMinutes(spans);
      if (u < minutes - 1) minutes = u;
    }
    var m = it.raw.match(/^(.*?)\s*\((.*)\)\s*$/);
    var names = m ? [m[1], m[2]] : [it.raw];
    var host = !!it.tagged || (!!hostMail && it.email === hostMail);
    if (!host) {
      for (var h = 0; h < HOST_NAMES.length; h++) {
        for (var n = 0; n < names.length; n++) if (nameScore(names[n], HOST_NAMES[h]) >= AUTO_SCORE) host = true;
      }
    }
    return {
      raw: it.raw,
      display: names[0] || it.raw,
      names: names,
      minutes: minutes === "" ? "" : Math.round(minutes),
      email: it.email || "",
      host: host
    };
  }

  /* ------------------------------------------------------------------ */
  /* התאמת שמות                                                         */
  /* ------------------------------------------------------------------ */

  /* בלי ניקוד, בלי פיסוק, אותיות סופיות כרגילות */
  function nameKey(s) {
    var fin = { "ך": "כ", "ם": "מ", "ן": "נ", "ף": "פ", "ץ": "צ" };
    return String(s || "").toLowerCase()
      .replace(/[֑-ׇً-ٟ]/g, "")
      .replace(/[ךםןףץ]/g, function (ch) { return fin[ch]; })
      .replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
  }

  function nameScore(a, b) {
    var x = nameKey(a), y = nameKey(b);
    if (!x || !y) return 0;
    if (x === y) return 1;
    var tx = x.split(" "), ty = y.split(" ");
    var common = tx.filter(function (t) { return t.length > 1 && ty.indexOf(t) >= 0; }).length;
    var s = common / Math.max(tx.length, ty.length);
    if (common && (x.indexOf(y) > -1 || y.indexOf(x) > -1)) s = Math.max(s, 0.85);
    return s;
  }

  /* התאמה חמדנית: הציון הגבוה קודם, כל שורה וכל משתתף פעם אחת.
     it.sid: מזהה = הותאם · "" = דורש בחירה · "-" = לא משתתף/ת */
  function zoomMatch(items, people) {
    var cands = [];
    items.forEach(function (it, i) {
      it.sid = "";
      it.auto = false;
      it.score = 0;
      it.suggest = "";
      if (it.host) return;
      people.forEach(function (p) {
        var sc = 0;
        for (var n = 0; n < it.names.length; n++) sc = Math.max(sc, nameScore(it.names[n], p.name));
        if (sc >= CAND_SCORE) cands.push({ i: i, sid: p.sid, sc: sc });
      });
    });
    cands.sort(function (a, b) { return b.sc - a.sc; });
    var usedItem = {}, usedSid = {};
    cands.forEach(function (c) {
      if (usedItem[c.i] || usedSid[c.sid]) return;
      var it = items[c.i];
      if (c.sc >= AUTO_SCORE) {
        usedItem[c.i] = true;
        usedSid[c.sid] = true;
        it.sid = c.sid;
        it.auto = true;
        it.score = c.sc;
      } else if (!it.suggest) {
        it.suggest = c.sid;   /* הצעה בלבד — לא נבחרת לבד */
      }
    });
    items.sort(function (a, b) {
      return (a.host - b.host) || String(a.display).localeCompare(String(b.display), "he");
    });
    return items;
  }

  /* ------------------------------------------------------------------ */
  /* מצב                                                                */
  /* ------------------------------------------------------------------ */

  var Z = {
    stage: "",          /* "" | input | review | done */
    track: "",
    session: 0,
    minMin: DEFAULT_MIN,
    items: [],
    people: [],
    fileName: "",
    error: "",
    busy: false,
    result: null
  };

  function teamKey() {
    try { return w.localStorage.getItem(KEY_STORE) || ""; } catch (e) { return ""; }
  }

  function teamState() {
    return (w.SH_team && w.SH_team.state) ? w.SH_team.state() : { track: "", session: 0 };
  }

  function box() { return el("t-zoomBox"); }

  function personBy(sid) {
    for (var i = 0; i < Z.people.length; i++) if (Z.people[i].sid === sid) return Z.people[i];
    return null;
  }

  /* דקות לכל משתתף, אחרי איחוד של כמה שורות שהותאמו לאותו אדם */
  function minutesBySid() {
    var out = {};
    Z.items.forEach(function (it) {
      if (it.host || !it.sid || it.sid === NOT_PART) return;
      var cur = out[it.sid];
      if (cur === undefined) { out[it.sid] = it.minutes; return; }
      if (it.minutes === "") return;
      out[it.sid] = cur === "" ? it.minutes : cur + it.minutes;
    });
    return out;
  }

  /* מה יקרה לשורה הזאת — אותם כללים כמו zoomApply_ בשרת */
  function preview(p, minutes) {
    if (!p) return { cls: "", text: "" };
    if (p.approved) return { cls: "man", text: "סומן ביד · רק הדקות יתעדכנו" };
    var known = minutes !== "" && minutes !== undefined;
    if (hasPart(p.how, HOW_CODE)) {
      if (known && minutes < Z.minMin) return { cls: "chk", text: "לבדיקה · מתחת לסף " + Z.minMin + " דק׳" };
      return { cls: "ok", text: "נכח · קוד+זום" };
    }
    return { cls: "chk", text: "לבדיקה · בזום בלי קוד" };
  }

  /* ------------------------------------------------------------------ */
  /* רשת                                                                */
  /* ------------------------------------------------------------------ */

  function loadPeople() {
    var u = w.SH_auth.API + "?mode=meet&what=live" +
      "&key=" + encodeURIComponent(teamKey()) +
      "&track=" + encodeURIComponent(Z.track) +
      "&n=" + encodeURIComponent(Z.session) + "&_=" + Date.now();
    return w.SH_auth.fetchJson(u).then(function (r) {
      if (!r || r.ok !== true) throw new Error((r && r.error) || "server");
      Z.people = (r.registered || []).concat(r.missing || []);
      return Z.people;
    });
  }

  function loadInfo() {
    return w.SH_auth.post({ action: "zoomInfo", key: teamKey(), track: Z.track })
      .then(function (r) {
        if (r && r.ok === true && Number(r.zoomMinMinutes) >= 0) Z.minMin = Number(r.zoomMinMinutes);
      })
      .catch(function () { /* נשארים עם ברירת המחדל לתצוגה בלבד; השרת קובע בשמירה */ });
  }

  var ERR = {
    badkey: "המפתח לא זוהה. להיכנס שוב בקישור האישי.",
    badtrack: "מסלול לא מזוהה.",
    nonum: "לבחור מפגש בתיבה למעלה.",
    nosession: "המפגש לא נמצא.",
    unitsession: "זו יחידה א-סינכרונית, אין לה דוח זום. לבחור מפגש סינכרוני.",
    notyet: "המפגש הזה עוד לא התקיים. לבדוק את בחירת המפגש.",
    noitems: "אין מה לשמור.",
    toomany: "יותר מדי שורות בדוח.",
    badminutes: "יש בדוח משך זמן לא תקין.",
    noaction: "השרת עוד לא מכיר את ייבוא הזום (צריך לפרוס גרסה חדשה).",
    server: "השרת החזיר שגיאה. לנסות שוב בעוד רגע.",
    network: "אין חיבור לשרת. לבדוק אינטרנט ולנסות שוב."
  };

  function errText(code) { return ERR[String(code || "")] || ERR.server; }

  /* ------------------------------------------------------------------ */
  /* תצוגה                                                              */
  /* ------------------------------------------------------------------ */

  var CSS = [
    ".t-zoom{grid-column:span 12}",
    ".zm-h{display:flex;align-items:center;gap:10px;flex-wrap:wrap}",
    ".zm-h h3{margin:0;font-size:16px;color:var(--ink);font-family:Rubik,Assistant,Arial,sans-serif}",
    ".zm-h p{margin:0;color:var(--muted);font-size:13px;flex-basis:100%;line-height:1.5}",
    ".zm-btn{border:1px solid var(--blue);background:#fff;color:var(--blue);border-radius:12px;",
    "padding:10px 14px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:7px;min-height:44px}",
    ".zm-btn:hover{background:#EAF3F9}",
    ".zm-btn.pri{background:var(--blue);color:#fff}",
    ".zm-btn.pri:hover{background:#185f8e}",
    ".zm-btn[disabled]{opacity:.5;cursor:default}",
    ".zm-btn:focus-visible,.zm select:focus-visible{outline:3px solid var(--orange);outline-offset:2px}",
    ".zm-h .zm-btn{margin-inline-start:auto}",
    ".zm{margin-top:14px}",
    ".zm-hint{background:var(--paper);border-radius:14px;padding:10px 14px;font-size:13.5px;line-height:1.6;color:var(--ink)}",
    ".zm-in{display:grid;gap:10px;margin:12px 0}",
    ".zm-in textarea{width:100%;min-height:90px;border:1px solid var(--line);border-radius:12px;padding:10px;",
    "font:400 14px Assistant,Arial,sans-serif;background:var(--paper);color:var(--ink)}",
    ".zm-bar{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;align-items:center}",
    ".zm-err{display:flex;gap:8px;align-items:center;background:#FBE9E7;color:var(--bad);border-radius:12px;",
    "padding:9px 12px;font-weight:600;font-size:13.5px;margin-top:10px}",
    ".zm-sum{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}",
    ".zm-sum span{background:var(--paper);border-radius:999px;padding:6px 12px;font-size:13px;font-weight:700}",
    ".zm-sum span b{font-family:Rubik,Arial,sans-serif;margin-inline-end:4px}",
    ".zm h4{margin:16px 0 6px;font-size:14px;font-family:Rubik,Assistant,Arial,sans-serif}",
    ".zm h4 small{font-weight:500;color:var(--muted);font-family:Assistant,Arial,sans-serif;margin-inline-start:6px}",
    ".zm-tw{overflow-x:auto}",
    ".zm table{width:100%;border-collapse:collapse;font-size:13.5px}",
    ".zm th{text-align:right;color:var(--muted);font-weight:700;font-size:12px;padding:6px 8px;border-bottom:1px solid var(--line)}",
    ".zm td{padding:7px 8px;border-bottom:1px solid #EFEBE1;vertical-align:middle}",
    ".zm td.num{font-variant-numeric:tabular-nums;font-weight:700;white-space:nowrap}",
    ".zm td.num.low{color:var(--orange)}",
    ".zm select{min-height:40px;border:1px solid var(--line);border-radius:10px;padding:6px 8px;",
    "background:#fff;font:400 13.5px Assistant,Arial,sans-serif;color:var(--ink);max-width:260px}",
    ".zm tr.need select{border-color:var(--orange-2);background:#FFF6EE}",
    ".zm-tag{display:inline-block;border-radius:999px;padding:3px 9px;font-size:12px;font-weight:700;white-space:nowrap}",
    ".zm-tag.ok{background:#E6F4EC;color:#1F7A4F}",
    ".zm-tag.chk{background:#FCEBDD;color:#8A4707}",
    ".zm-tag.man{background:#EAF3F9;color:var(--blue)}",
    ".zm-tag.mute{background:var(--paper);color:var(--muted)}",
    ".zm-sug{display:block;color:var(--muted);font-size:12px}",
    ".zm-empty{color:var(--muted);font-size:13px;padding:4px 0}",
    ".zm-res{background:#E6F4EC;border-radius:14px;padding:12px 14px;line-height:1.7;font-size:14px}",
    "@media (max-width:980px){.t-zoom{grid-column:1/-1}}"
  ].join("");

  function tag(cls, text) {
    return '<span class="zm-tag ' + cls + '">' + esc(text) + "</span>";
  }

  function options(it) {
    var used = {};
    Z.items.forEach(function (o) { if (o !== it && o.sid && o.sid !== NOT_PART) used[o.sid] = true; });
    var list = Z.people.slice().sort(function (a, b) { return String(a.name).localeCompare(String(b.name), "he"); });
    var html = ['<option value=""' + (it.sid === "" ? " selected" : "") + ">— לבחור —</option>",
      '<option value="' + NOT_PART + '"' + (it.sid === NOT_PART ? " selected" : "") + ">לא משתתף/ת</option>"];
    /* משתתף/ת שכבר הותאם/ה מופיע/ה גם כאן: אותו אדם משני מכשירים או
       בשני שמות. בחירה כזאת מחברת את הדקות לשורה אחת. */
    list.forEach(function (p) {
      html.push('<option value="' + esc(p.sid) + '"' + (it.sid === p.sid ? " selected" : "") + ">" +
        esc(p.name) + " · " + esc(p.school) +
        (used[p.sid] && p.sid !== it.sid ? " (כבר הותאם/ה · הדקות יתחברו)" : "") + "</option>");
    });
    return html.join("");
  }

  function minCell(m) {
    if (m === "") return '<td class="num">—</td>';
    return '<td class="num' + (m < Z.minMin ? " low" : "") + '">' + m + "</td>";
  }

  function itemRow(it, idx, withPreview) {
    var p = it.sid && it.sid !== NOT_PART ? personBy(it.sid) : null;
    var sug = it.suggest && !it.sid ? personBy(it.suggest) : null;
    var pv = withPreview ? preview(p, minutesBySid()[it.sid]) : null;
    return '<tr class="' + (it.sid === "" ? "need" : "") + '">' +
      "<td>" + esc(it.raw) + "</td>" + minCell(it.minutes) +
      '<td><select data-zi="' + idx + '" aria-label="משתתף/ת עבור ' + esc(it.display) + '">' + options(it) + "</select>" +
      (sug ? '<span class="zm-sug">הצעה: ' + esc(sug.name) + "</span>" : "") + "</td>" +
      (withPreview ? "<td>" + (it.auto ? "" : tag("mute", "נבחר ביד") + " ") + tag(pv.cls, pv.text) + "</td>" : "") +
      "</tr>";
  }

  function table(head, rows, empty) {
    if (!rows.length) return '<div class="zm-empty">' + esc(empty) + "</div>";
    return '<div class="zm-tw"><table><thead><tr>' +
      head.map(function (h) { return "<th>" + esc(h) + "</th>"; }).join("") +
      "</tr></thead><tbody>" + rows.join("") + "</tbody></table></div>";
  }

  /* מי שנרשם בקוד למפגש הזה ולא הותאם לאף שורה בדוח */
  function codeNotInZoom() {
    var mins = minutesBySid();
    return Z.people.filter(function (p) {
      return hasPart(p.how, HOW_CODE) && mins[p.sid] === undefined;
    });
  }

  function renderInput() {
    return '<div class="zm-hint">מורידים את הדוח מאתר הזום (zoom.us, לא מהאפליקציה): ' +
      "<b>Reports</b> ← <b>Usage</b> ← לוחצים על מספר המשתתפים ליד המפגש ← <b>Export</b>. " +
      "הקובץ נקרא כאן במחשב ולא נשלח לשרת. לפני ששומרים רואים כל שורה.</div>" +
      '<div class="zm-in">' +
      '<label>קובץ CSV מהזום <input type="file" id="zm-file" accept=".csv,.txt,text/csv"></label>' +
      '<label>או הדבקה של רשימת שמות (שם בכל שורה, בלי דקות):' +
      '<textarea id="zm-paste" placeholder="מדביקים כאן…"></textarea></label></div>' +
      (Z.error ? '<div class="zm-err">' + icon(IC.alert, 17) + "<span>" + esc(Z.error) + "</span></div>" : "") +
      '<div class="zm-bar">' +
      '<button type="button" class="zm-btn pri" data-act="read">' + icon(IC.file) + "קריאת הרשימה</button>" +
      '<button type="button" class="zm-btn" data-act="cancel">ביטול</button></div>';
  }

  function renderReview() {
    var auto = [], need = [], outside = [];
    Z.items.forEach(function (it, i) {
      if (it.host) {
        outside.push("<tr><td>" + esc(it.raw) + "</td>" + minCell(it.minutes) + "<td>" + tag("mute", "המארחת") + "</td></tr>");
      } else if (it.sid === NOT_PART) {
        outside.push(itemRow(it, i, false));
      } else if (it.sid === "") {
        need.push(itemRow(it, i, false));
      } else {
        auto.push(itemRow(it, i, true));
      }
    });

    var miss = codeNotInZoom().map(function (p) {
      return "<tr><td>" + esc(p.name) + "</td><td>" + esc(p.school) + "</td><td>" +
        (p.approved ? tag("man", "סומן ביד · לא ישתנה") : tag("chk", "לבדיקה · לא מופיע בזום")) + "</td></tr>";
    });

    var mins = minutesBySid();
    var matched = Object.keys(mins).length;
    var hasMinutes = Z.items.some(function (it) { return it.minutes !== ""; });

    return '<div class="zm-sum">' +
      "<span><b>" + Z.items.length + "</b>שורות בדוח</span>" +
      "<span><b>" + matched + "</b>הותאמו למשתתפים</span>" +
      "<span><b>" + need.length + "</b>דורשים בחירה</span>" +
      "<span><b>" + miss.length + "</b>נרשמו בקוד ולא בזום</span>" +
      "</div>" +
      '<div class="zm-hint">' + (Z.fileName ? "<b>" + esc(Z.fileName) + "</b> · " : "") +
      "מפגש " + Z.session + " · מסלול " + esc(Z.track) + ". " +
      (hasMinutes ? "הסף: " + Z.minMin + " דקות (מלשונית ההגדרות). " : "אין דקות ברשימה שהודבקה, ולכן הסף לא נבדק. ") +
      "פער מסומן לבדיקה ולא נמחק. סימון ידני שלך לא משתנה.</div>" +

      "<h4>הותאמו<small>אפשר לתקן בתיבה</small></h4>" +
      table(["השם בזום", "דקות", "משתתף/ת", "מה יישמר"], auto, "אף שורה לא הותאמה אוטומטית.") +

      "<h4>דורשים בחירה<small>שמות באותיות לטיניות, כינויים והתאמות חלשות</small></h4>" +
      table(["השם בזום", "דקות", "משתתף/ת"], need, "אין — הכול הותאם.") +
      (need.length ? '<div class="zm-bar"><button type="button" class="zm-btn" data-act="rest">' +
        "כל השאר: לא משתתפים</button></div>" : "") +

      "<h4>בזום ואינם משתתפים<small>לא נשלחים לשרת</small></h4>" +
      table(["השם בזום", "דקות", ""], outside, "אין.") +

      "<h4>נרשמו בקוד ולא מופיעים בזום</h4>" +
      table(["משתתף/ת", "בית ספר", "מה יישמר"], miss, "אין — כל מי שנרשם בקוד מופיע בדוח.") +

      (Z.error ? '<div class="zm-err">' + icon(IC.alert, 17) + "<span>" + esc(Z.error) + "</span></div>" : "") +
      '<div class="zm-bar">' +
      '<button type="button" class="zm-btn pri" data-act="save"' + (need.length || Z.busy ? " disabled" : "") + ">" +
      icon(IC.save) + (Z.busy ? "שומר…" : "שמירה") + "</button>" +
      '<button type="button" class="zm-btn" data-act="back">קובץ אחר</button>' +
      '<button type="button" class="zm-btn" data-act="cancel">ביטול</button>' +
      (need.length ? '<span class="zm-empty">לבחור לכל השורות ב"דורשים בחירה" לפני השמירה.</span>' : "") +
      "</div>";
  }

  function renderDone() {
    var r = Z.result || {}, c = r.counts || {};
    return '<div class="zm-res">' + icon(IC.check, 17) + " <b>נשמר · מפגש " + esc(r.session) + "</b><br>" +
      "נשארו נכחים (קוד + זום): <b>" + (c.present || 0) + "</b> · " +
      "לבדיקה, מתחת לסף: <b>" + (c.short || 0) + "</b> · " +
      "לבדיקה, קוד בלי זום: <b>" + (c.codeNoZoom || 0) + "</b> · " +
      "לבדיקה, זום בלי קוד: <b>" + (c.zoomNoCode || 0) + "</b><br>" +
      "סימונים ידניים שלא השתנו (רק דקות): <b>" + ((c.manual || 0) + (c.other || 0)) + "</b> · " +
      "שורות חדשות: <b>" + (c.created || 0) + "</b> · עודכנו: <b>" + (c.updated || 0) + "</b> · " +
      "ללא שינוי: <b>" + (c.unchanged || 0) + "</b>" +
      (c.rejected ? " · נדחו: <b>" + c.rejected + "</b>" : "") +
      "<br>הסף שהשרת הפעיל: " + esc(r.zoomMinMinutes) + " דקות. השינויים ביומן.</div>" +
      '<div class="zm-bar"><button type="button" class="zm-btn" data-act="cancel">סגירה</button></div>';
  }

  function render() {
    var b = box();
    if (!b) return;
    if (!Z.stage) { b.hidden = true; b.innerHTML = ""; return; }
    b.hidden = false;
    b.innerHTML = Z.stage === "input" ? renderInput()
      : Z.stage === "review" ? renderReview()
      : renderDone();
  }

  /* ------------------------------------------------------------------ */
  /* פעולות                                                             */
  /* ------------------------------------------------------------------ */

  function open() {
    var st = teamState();
    if (!teamKey()) { toast("המפתח לא נשמר בדפדפן. להיכנס שוב בקישור האישי.", true); return; }
    if (!st.track || !st.session) { toast(errText("nonum"), true); return; }
    Z.stage = "input";
    Z.track = st.track;
    Z.session = Number(st.session);
    Z.items = [];
    Z.people = [];
    Z.error = "";
    Z.fileName = "";
    Z.result = null;
    Z.busy = false;
    render();
    loadInfo().then(function () { if (Z.stage === "review") render(); });
  }

  function cancel() {
    Z.stage = "";
    Z.items = [];
    Z.people = [];
    Z.result = null;
    render();
  }

  function run(text, fileName) {
    var items = zoomParse(text);
    if (!items.length) {
      Z.error = "לא נמצאו משתתפים. לבדוק שזה דוח המשתתפים (Participants) מאתר הזום.";
      render();
      return Promise.resolve();
    }
    Z.error = "";
    return loadPeople().then(function () {
      Z.items = zoomMatch(items, Z.people);
      Z.fileName = fileName || "";
      Z.stage = "review";
      render();
    }).catch(function (e) {
      Z.error = errText(e && e.message === "Failed to fetch" ? "network" : e && e.message);
      render();
    });
  }

  function read() {
    var f = el("zm-file") && el("zm-file").files ? el("zm-file").files[0] : null;
    var pasted = el("zm-paste") ? el("zm-paste").value : "";
    if (f) {
      if (/\.xlsx?$/i.test(f.name)) {
        Z.error = "זה קובץ אקסל. בזום בוחרים ייצוא CSV, או שומרים באקסל בשם כ-CSV.";
        render();
        return;
      }
      var fr = new w.FileReader();
      fr.onload = function () { run(String(fr.result || ""), f.name); };
      fr.onerror = function () { Z.error = "הקובץ לא נקרא."; render(); };
      fr.readAsText(f, "utf-8");
    } else if (pasted.trim()) {
      run(pasted, "");
    } else {
      Z.error = "לבחור קובץ או להדביק רשימה.";
      render();
    }
  }

  function save() {
    if (Z.busy || Z.stage !== "review") return;
    var st = teamState();
    if (st.track !== Z.track || Number(st.session) !== Z.session) {
      Z.error = "המפגש או המסלול השתנו מאז שהקובץ נקרא. לפתוח את הייבוא מחדש.";
      render();
      return;
    }
    if (Z.items.some(function (it) { return !it.host && it.sid === ""; })) return;
    var mins = minutesBySid();
    /* רק מזהה ודקות. לא שם מהזום, לא מייל, ולא שורות של מי שאינו משתתף. */
    var items = Object.keys(mins).map(function (sid) { return { sid: sid, minutes: mins[sid] }; });
    Z.busy = true;
    Z.error = "";
    render();
    return w.SH_auth.post({
      action: "zoomApply", key: teamKey(), track: Z.track, n: Z.session, items: items
    }).then(function (r) {
      Z.busy = false;
      if (!r || r.ok !== true) {
        Z.error = errText(r && r.error);
        render();
        return;
      }
      Z.result = r;
      Z.stage = "done";
      render();
      var c = r.counts || {};
      toast("הדוח נשמר · " + ((c.short || 0) + (c.codeNoZoom || 0) + (c.zoomNoCode || 0)) + " לבדיקה");
      if (w.SH_team && w.SH_team.reload) w.SH_team.reload();
    }).catch(function () {
      Z.busy = false;
      Z.error = errText("network");
      render();
    });
  }

  function start() {
    styleOnce("zm-css", CSS);
    var btn = el("t-zoomBtn"), b = box();
    if (!btn || !b) return;
    btn.addEventListener("click", function () {
      if (Z.stage) { cancel(); return; }
      open();
    });
    b.addEventListener("click", function (ev) {
      var t = ev.target.closest ? ev.target.closest("[data-act]") : null;
      if (!t || t.disabled) return;
      var act = t.getAttribute("data-act");
      if (act === "read") read();
      else if (act === "cancel") cancel();
      else if (act === "back") { Z.stage = "input"; Z.items = []; Z.error = ""; render(); }
      else if (act === "save") save();
      else if (act === "rest") {
        Z.items.forEach(function (it) { if (!it.host && it.sid === "") it.sid = NOT_PART; });
        render();
      }
    });
    b.addEventListener("change", function (ev) {
      var s = ev.target;
      if (!s || !s.hasAttribute || !s.hasAttribute("data-zi")) return;
      var it = Z.items[Number(s.getAttribute("data-zi"))];
      if (!it) return;
      it.sid = s.value;
      it.auto = false;
      render();
    });
    /* החלפת מסלול או מפגש סוגרת ייבוא פתוח, כדי שלא יישמר למפגש הלא נכון */
    var tracks = el("t-tracks"), pick = el("t-session");
    if (tracks) tracks.addEventListener("click", function () { if (Z.stage) cancel(); });
    if (pick) pick.addEventListener("change", function () { if (Z.stage) cancel(); });
  }

  w.SH_zoom = {
    start: start,
    open: open,
    parse: zoomParse,
    match: zoomMatch,
    nameScore: nameScore,
    parseCsv: parseCsv,
    state: function () { return Z; }
  };
})(window, document);
