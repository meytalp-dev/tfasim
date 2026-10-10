/**
 * אדווה — חדשות וחידושים בעולם הבינה המלאכותית (10.10.26).
 *
 * מה רואים:
 *   רכז/ת   — טאב "חדשות וחידושים" (#v=news): פריטים שמיטל אישרה, החדש למעלה, "חדש" על מה שלא נקרא.
 *   מיטל    — אותו טאב (#v=news), ובניהול: "חדשות לאישור" (#v=newsq) ו"הוספה מהירה" (#v=newsadd).
 *   פריט ששויך למפגש מופיע גם ב"משאבי המפגש" (sessionLinks).
 *
 * הנתונים: GET mode=news (רכז/ת — מאושרים בלבד), POST newsSave / newsAdd (מפתח ניהול).
 * השרת: רויטל\shagririm-gas\News.source.txt.
 *
 * shell.js ו-admin.js קוראים לכאן. הקובץ לא מחזיק מפתח ולא מאמת — רק מצייר.
 */
(function (w, d) {
  "use strict";

  var SEEN_KEY = "adva.news.seen";
  var TAGS = ["כלי חדש", "עדכון לכלי קיים", "טיפ שימושי", "הנחיות ובטיחות"];
  var ST_OK = "מאושר", ST_PENDING = "ממתין", ST_DEL = "נמחק";

  var N = { items: [], last: "", pending: 0, loaded: false, busy: false, err: "", add: { busy: false, text: "", done: null } };

  /* ------------------------------------------------------------------ */
  /* עזרים                                                              */
  /* ------------------------------------------------------------------ */

  function str(v) { return String(v === undefined || v === null ? "" : v).trim(); }
  function esc(s) {
    return String(s === undefined || s === null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function ico(name, cls) {
    return '<svg class="sh-ico' + (cls ? " " + cls : "") + '" aria-hidden="true"><use href="#i-' + name + '"/></svg>';
  }
  function lsGet(k) { try { return w.localStorage.getItem(k) || ""; } catch (e) { return ""; } }
  function lsSet(k, v) { try { w.localStorage.setItem(k, v); } catch (e) { /* חלון פרטי */ } }

  /* "05/10/2026 16:00:00" → מספר למיון; "5.10" לתצוגה */
  function stamp(s) {
    var m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/.exec(str(s));
    return m ? Date.UTC(+m[3], +m[2] - 1, +m[1], +(m[4] || 0), +(m[5] || 0)) : 0;
  }
  function shortDate(s) {
    var m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(str(s));
    return m ? +m[1] + "." + +m[2] + "." + m[3].substring(2) : "";
  }
  function host(u) {
    var m = /^https?:\/\/(?:www\.)?([^\/?#]+)/i.exec(str(u));
    return m ? m[1] : "";
  }
  function approved() { return N.items.filter(function (x) { return x.status === ST_OK; }); }

  /* ------------------------------------------------------------------ */
  /* טעינה                                                              */
  /* ------------------------------------------------------------------ */

  /* getter: פונקציה שמחזירה Promise של תשובת mode=news (רכז/ת: SH_auth.get, מיטל: get של admin.js) */
  function load(getter) {
    N.busy = true;
    return getter().then(function (r) {
      N.busy = false;
      if (r && r.ok) {
        N.items = r.items || [];
        N.last = str(r.last);
        N.pending = Number(r.pending) || 0;
        N.loaded = true;
        N.err = "";
      } else {
        N.err = (r && r.error) || "server";
      }
      return N;
    }).catch(function () { N.busy = false; N.err = "network"; return N; });
  }

  /* ------------------------------------------------------------------ */
  /* הטאב "חדשות וחידושים" — זהה לרכזים ולמיטל                           */
  /* ------------------------------------------------------------------ */

  /* opts.track: המסלול של הרכז/ת (שיוך למפגש מוצג רק במסלול שלו/ה). למיטל — ריק, ומוצג תמיד. */
  function renderPublic(el, opts) {
    opts = opts || {};
    var list = approved();
    var seen = Number(lsGet(SEEN_KEY)) || 0, newest = seen;

    var h = '<div class="nw-head"><p class="v2-eyebrow">' + ico("spark", "xs") + " חדשות וחידושים</p>" +
      "<h2>מה חדש בעולם הבינה המלאכותית</h2>" +
      "<p>כל שבוע: כלים חדשים, עדכונים, טיפים והנחיות שרלוונטיים לרכזים ולצוותים. כל פריט נבחר ואושר לפני שעלה." +
      (N.last ? ' <span class="nw-last">העדכון האחרון: <b translate="no">' + esc(shortDate(N.last)) + "</b></span>" : "") + "</p></div>";

    if (!N.loaded && N.busy) h += '<div class="v2-card"><p class="v2-note" style="margin:0">טוענים את החדשות…</p></div>';
    else if (!N.loaded && N.err) h += '<div class="v2-card"><p class="v2-note" style="margin:0">החדשות לא נטענו. אפשר לרענן את הדף.</p></div>';
    else if (!list.length) h += '<div class="v2-card"><p class="v2-note" style="margin:0">עוד אין חדשות. העדכון הראשון יעלה אחרי האיסוף של יום ראשון.</p></div>';
    else {
      h += '<ul class="nw-list">';
      for (var i = 0; i < list.length; i++) {
        var it = list[i], t = stamp(it.published || it.created);
        if (t > newest) newest = t;
        var fresh = t > seen;
        var ses = sessionOf(it.session);
        var showSes = ses && (!opts.track || ses.track === opts.track);
        /* 10.10.26 (מיטל: "ברור גם לאנשים שהם לא מתחום הטכנולוגיה"): מה זה · איך מנסים · להעתקה · למה זה שימושי · מחיר */
        var steps = str(it.how).split(/\r?\n/).map(function (x) { return x.replace(/^\s*(\d+[.)]|[-•·])\s*/, "").trim(); }).filter(Boolean);
        h += '<li class="v2-card nw-item' + (fresh ? " fresh" : "") + '">' +
          '<div class="nw-chips"><span class="v2-chip ' + tagCls(it.tag) + '">' + esc(it.tag) + "</span>" + priceChip(it.price) +
          (fresh ? '<span class="v2-chip now">חדש</span>' : "") + "</div>" +
          "<h3>" + esc(it.title) + "</h3>" +
          (it.what ? '<p class="nw-what">' + esc(it.what) + "</p>" : "") +
          (steps.length ? '<div class="nw-how"><p class="nw-lbl">איך מנסים</p><ol>' + steps.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ol></div>" : "") +
          (str(it.copy) ? '<div class="nw-copy"><div class="nw-copy-h"><p class="nw-lbl">להעתקה</p>' +
            '<button type="button" class="v2-btn nw-copybtn" data-nwcopy="' + i + '">' + ico("copy", "xs") + "העתקה</button></div>" +
            '<p class="nw-copytx" dir="auto">' + esc(it.copy) + "</p></div>" : "") +
          (it.why ? '<div class="nw-why"><p class="nw-lbl">למה זה שימושי</p><p>' + esc(it.why) + "</p></div>" : "") +
          '<div class="nw-foot"><span class="nw-src">' + (it.source ? esc(it.source) + " · " : "") +
          '<span translate="no">' + esc(shortDate(it.published || it.created)) + "</span></span>" +
          (showSes ? (opts.track
            ? '<a class="nw-ses" href="#s=' + ses.num + '">' + ico("cal", "xs") + "קשור למפגש " + ses.num + "</a>"
            : '<span class="nw-ses">' + ico("cal", "xs") + "קשור ל" + esc(it.session) + "</span>") : "") +
          (it.link ? '<a class="v2-btn nw-go" href="' + esc(it.link) + '" target="_blank" rel="noopener">למקור' + ico("ext", "xs") + "</a>" : "") +
          "</div></li>";
      }
      h += "</ul>";
    }
    el.innerHTML = h;
    el._nwList = list;
    if (!el.getAttribute("data-nwcopy-wired")) {
      el.setAttribute("data-nwcopy-wired", "1");
      el.addEventListener("click", function (ev) {
        var b = ev.target.closest && ev.target.closest("[data-nwcopy]");
        if (!b || !el._nwList) return;
        var it2 = el._nwList[Number(b.getAttribute("data-nwcopy"))];
        if (it2) copy(it2.copy, b);
      });
    }
    /* מה שהוצג נחשב נקרא — בכניסה הבאה הסימון "חדש" יורד */
    if (newest > seen) lsSet(SEEN_KEY, String(newest));
  }

  var PRICES = ["חינם", "חינם עם הגבלות", "בתשלום", "לא צוין"];
  function priceChip(p) {
    p = str(p);
    if (!p) return "";
    var cls = p === "חינם" ? "done" : p === "בתשלום" ? "due" : p === "חינם עם הגבלות" ? "draft" : "soon";
    return '<span class="v2-chip ' + cls + '">' + esc(p === "לא צוין" ? "מחיר לא צוין" : p) + "</span>";
  }

  function copy(text, btn) {
    function done(ok) {
      var was = btn.innerHTML;
      btn.innerHTML = ok ? ico("check", "xs") + "הועתק" : "לסמן ולהעתיק ביד";
      w.setTimeout(function () { btn.innerHTML = was; }, 1800);
    }
    function fallback() {
      var ta = d.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      d.body.appendChild(ta); ta.select();
      var ok = false;
      try { ok = d.execCommand("copy"); } catch (e) { ok = false; }
      d.body.removeChild(ta);
      done(ok);
    }
    if (w.navigator.clipboard && w.navigator.clipboard.writeText) w.navigator.clipboard.writeText(text).then(function () { done(true); }, fallback);
    else fallback();
  }

  function tagCls(t) { return t === "כלי חדש" ? "done" : t === "הנחיות ובטיחות" ? "due" : t === "טיפ שימושי" ? "tip" : "draft"; }

  function sessionOf(s) {
    var m = /^(כלים|הובלה)\s+(\d{1,2})$/.exec(str(s));
    return m ? { track: m[1], num: Number(m[2]) } : null;
  }

  /* למשאבי המפגש: [כותרת, שורת הסבר, קישור] — אותו מבנה כמו sessionRes */
  function sessionLinks(track, num) {
    return approved().filter(function (it) {
      var s = sessionOf(it.session);
      return s && s.track === track && s.num === Number(num);
    }).map(function (it) {
      return [it.title, "מהחדשות והחידושים" + (it.source ? " · " + it.source : ""), it.link || "#v=news"];
    });
  }

  /* ------------------------------------------------------------------ */
  /* מיטל: חדשות לאישור                                                  */
  /* ------------------------------------------------------------------ */

  /* ctx: { sessions: { "כלים": [...], "הובלה": [...] }, save(body) → Promise, viewer: bool, toast(text, bad) } */
  function renderQueue(el, ctx) {
    var pend = N.items.filter(function (x) { return x.status === ST_PENDING; });
    var pub = approved();
    var h = '<div class="a-head"><p class="v2-eyebrow">ניהול · חדשות וחידושים</p><h2>חדשות לאישור</h2></div>';

    if (!N.loaded) {
      h += '<div class="v2-card"><p class="v2-note" style="margin:0">' + (N.err ? "החדשות לא נטענו (" + esc(N.err) + ")." : "טוענים…") + "</p></div>";
      el.innerHTML = h;
      return;
    }

    h += '<p class="nw-intro">טיוטות מהאיסוף של יום ראשון ומ"הוספה מהירה". אפשר לתקן כל שדה לפני האישור. ' +
      "רכזים רואים רק מה שאושר." + (N.last ? ' האיסוף האחרון: <b translate="no">' + esc(shortDate(N.last)) + "</b>." : "") + "</p>";

    if (!pend.length) h += '<div class="v2-card"><p class="v2-note" style="margin:0">אין כרגע טיוטות שממתינות. אפשר להוסיף פריט ב<a href="#v=newsadd">הוספה מהירה</a>.</p></div>';
    else h += '<div class="nw-forms">' + pend.map(function (it) { return form(it, ctx, false); }).join("") + "</div>";

    if (pub.length) {
      h += '<details class="nw-pub"><summary>' + ico("check", "xs") + " פורסמו · " + pub.length + "</summary>" +
        '<div class="nw-forms">' + pub.map(function (it) { return form(it, ctx, true); }).join("") + "</div></details>";
    }
    el.innerHTML = h;
  }

  function form(it, ctx, isPub) {
    var ro = ctx.viewer ? " disabled" : "";
    var id = esc(it.id);
    var opts = '<option value="">בלי שיוך למפגש</option>';
    ["כלים", "הובלה"].forEach(function (tr) {
      ((ctx.sessions && ctx.sessions[tr]) || []).forEach(function (s) {
        var v = tr + " " + s.num;
        opts += '<option value="' + esc(v) + '"' + (it.session === v ? " selected" : "") + ">" + esc(tr + " · מפגש " + s.num + " · " + (s.topic || "")) + "</option>";
      });
    });
    if (it.session && opts.indexOf('value="' + esc(it.session) + '"') < 0) {
      opts += '<option value="' + esc(it.session) + '" selected>' + esc(it.session) + "</option>";
    }
    return '<form class="v2-card nw-form" data-nw="' + id + '">' +
      '<div class="nw-meta"><span class="v2-chip ' + (isPub ? "done" : "soon") + '">' + (isPub ? "פורסם " + esc(shortDate(it.published)) : esc(it.via || "טיוטה")) + "</span>" +
      '<span translate="no">' + esc(shortDate(it.created)) + "</span>" +
      (it.link ? '<a href="' + esc(it.link) + '" target="_blank" rel="noopener">' + ico("ext", "xs") + "לבדוק במקור</a>" : '<span class="nw-warn">' + ico("alert", "xs") + "אין קישור למקור</span>") + "</div>" +
      '<label>כותרת<input class="a-in" name="title" maxlength="140" value="' + esc(it.title) + '"' + ro + "></label>" +
      '<label>מה זה<textarea class="a-in" name="what" rows="3" maxlength="700"' + ro + ">" + esc(it.what) + "</textarea></label>" +
      '<label>איך מנסים <small>(צעד בכל שורה)</small><textarea class="a-in" name="how" rows="3" maxlength="600"' + ro + ">" + esc(it.how) + "</textarea></label>" +
      '<label>להעתקה <small>(בקשה ל-AI או משפט להעתיק, אם יש)</small><textarea class="a-in" name="copy" rows="2" maxlength="1500" dir="auto"' + ro + ">" + esc(it.copy) + "</textarea></label>" +
      '<label>למה זה שימושי<textarea class="a-in" name="why" rows="2" maxlength="700"' + ro + ">" + esc(it.why) + "</textarea></label>" +
      '<div class="nw-two"><label>תגית<select class="a-in" name="tag"' + ro + ">" + TAGS.map(function (t) {
        return '<option' + (it.tag === t ? " selected" : "") + ">" + esc(t) + "</option>";
      }).join("") + "</select></label>" +
      '<label>מחיר<select class="a-in" name="price"' + ro + ">" + PRICES.map(function (t) {
        return '<option' + ((it.price || "לא צוין") === t ? " selected" : "") + ">" + esc(t) + "</option>";
      }).join("") + "</select></label></div>" +
      '<div class="nw-two">' +
      '<label>שיוך למפגש<select class="a-in" name="session"' + ro + ">" + opts + "</select></label>" +
      '<label>קישור למקור<input class="a-in" name="link" dir="ltr" inputmode="url" value="' + esc(it.link) + '"' + ro + "></label></div>" +
      (ctx.viewer ? "" : '<div class="v2-row nw-acts">' +
        (isPub
          ? '<button type="button" class="v2-btn primary" data-nwact="save">' + ico("check") + "שמירת התיקון</button>" +
            '<button type="button" class="v2-btn ghost" data-nwact="del">הסרה מהחדשות</button>'
          : '<button type="button" class="v2-btn primary" data-nwact="ok">' + ico("check") + "אישור ופרסום</button>" +
            '<button type="button" class="v2-btn" data-nwact="keep">שמירה בלי לפרסם</button>' +
            '<button type="button" class="v2-btn ghost" data-nwact="del">מחיקה</button>') + "</div>") +
      "</form>";
  }

  /* לחיצות במסך האישור. ctx.save מחזיר Promise של תשובת השרת. */
  function wireQueue(el, ctx) {
    if (el.getAttribute("data-nw-wired")) return;
    el.setAttribute("data-nw-wired", "1");
    el.addEventListener("click", function (ev) {
      var b = ev.target.closest && ev.target.closest("[data-nwact]");
      if (!b) return;
      var f = b.closest("form[data-nw]");
      var act = b.getAttribute("data-nwact");
      if (act === "del" && !w.confirm(f.querySelector('[name="title"]').value ? "למחוק את \"" + f.querySelector('[name="title"]').value + "\"?" : "למחוק?")) return;
      var body = {
        id: f.getAttribute("data-nw"),
        status: act === "ok" || act === "save" ? ST_OK : act === "del" ? ST_DEL : ST_PENDING
      };
      ["title", "what", "how", "copy", "why", "price", "tag", "link", "session"].forEach(function (k) { body[k] = f.querySelector('[name="' + k + '"]').value; });
      if (body.status === ST_OK && str(body.title).length < 3) { ctx.toast("חסרה כותרת", true); return; }
      var btns = f.querySelectorAll("button");
      for (var i = 0; i < btns.length; i++) btns[i].disabled = true;
      ctx.save(body).then(function (r) {
        if (!r || !r.ok) {
          for (var j = 0; j < btns.length; j++) btns[j].disabled = false;
          ctx.toast("לא נשמר (" + ((r && r.error) || "רשת") + ")", true);
          return;
        }
        for (var k = 0; k < N.items.length; k++) if (N.items[k].id === body.id) N.items[k] = r.item;
        N.pending = N.items.filter(function (x) { return x.status === ST_PENDING; }).length;
        ctx.toast(act === "ok" ? "פורסם לרכזים" : act === "del" ? "נמחק" : "נשמר");
        ctx.done();
        /* לא מציירים מחדש את כל המסך — תיקונים שעוד לא נשמרו בטפסים אחרים היו נמחקים */
        if (act === "ok" || act === "del") {
          f.parentNode.removeChild(f);
          if (!el.querySelector("form[data-nw]")) renderQueue(el, ctx);
        } else {
          for (var m = 0; m < btns.length; m++) btns[m].disabled = false;
        }
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* מיטל: הוספה מהירה                                                   */
  /* ------------------------------------------------------------------ */

  function renderAdd(el, ctx) {
    var A = N.add;
    var h = '<div class="a-head"><p class="v2-eyebrow">ניהול · חדשות וחידושים</p><h2>הוספה מהירה</h2></div>' +
      '<div class="v2-card nw-add">' +
      "<p>מדביקים כאן פוסט מפייסבוק, הודעה מוואטסאפ או קישור. המערכת מנסחת ממנו פריט, והוא נכנס ל<a href=\"#v=newsq\">חדשות לאישור</a>. " +
      "שום דבר לא מתפרסם בלי אישור.</p>" +
      '<label class="sh-sr" for="nw-text">הטקסט או הקישור</label>' +
      '<textarea id="nw-text" class="a-in" rows="8" maxlength="6000" placeholder="הדביקו כאן טקסט או קישור"' + (A.busy || ctx.viewer ? " disabled" : "") + ">" + esc(A.text) + "</textarea>" +
      '<div class="v2-row"><button type="button" class="v2-btn primary" id="nw-go"' + (A.busy || ctx.viewer ? " disabled" : "") + ">" +
      (A.busy ? "מנסחים… עד דקה" : ico("spark") + "ניסוח פריט") + "</button></div>" +
      (A.busy ? '<p class="v2-note">אם יש קישור, המערכת קוראת גם את העמוד. פוסטים מקבוצות סגורות לא נפתחים, ואז הניסוח נשען רק על הטקסט שהודבק.</p>' : "") +
      (A.done ? '<p class="nw-ok">' + ico("check", "xs") + "נוסף לרשימת האישור: <b>" + esc(A.done.title) + '</b> · <a href="#v=newsq">לאישור</a></p>' : "") +
      (A.err ? '<p class="nw-err">' + esc(A.err) + "</p>" : "") +
      "</div>";
    el.innerHTML = h;
    var ta = d.getElementById("nw-text");
    if (ta) ta.addEventListener("input", function () { A.text = ta.value; });
    var go = d.getElementById("nw-go");
    if (go) go.addEventListener("click", function () {
      if (str(A.text).length < 15) { ctx.toast("צריך עוד קצת טקסט", true); return; }
      A.busy = true; A.done = null; A.err = "";
      renderAdd(el, ctx);
      /* בקשה אחת בלבד, עם זמן המתנה ארוך: הניסוח לוקח 20–60 שניות,
         וניסיון חוזר אוטומטי היה יוצר טיוטה כפולה */
      longPost({ action: "newsAdd", key: ctx.key(), text: A.text }).then(function (r) {
        A.busy = false;
        if (r && r.ok) {
          A.done = r.item; A.text = "";
          N.items.unshift(r.item);
          N.pending++;
          ctx.done();
        } else {
          var m = { "no-api-key": "חסר מפתח Claude בהגדרות השרת.", short: "הטקסט קצר מדי.", badkey: "המפתח של הדפדפן הזה לא מאפשר הוספה." };
          A.err = m[r && r.error] || "הניסוח לא הצליח (" + ((r && r.error) || "רשת") + "). אפשר לנסות שוב.";
        }
        if (d.getElementById("nw-text")) renderAdd(el, ctx);
      });
    });
  }

  function longPost(body) {
    var ctl = w.AbortController ? new w.AbortController() : null;
    var timer = w.setTimeout(function () { if (ctl) ctl.abort(); }, 170000);
    return w.fetch(w.SH_auth.API, {
      method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body), signal: ctl ? ctl.signal : undefined
    }).then(function (r) { w.clearTimeout(timer); return r.json(); })
      .catch(function () { w.clearTimeout(timer); return { ok: false, error: "network" }; });
  }

  w.SH_news = {
    load: load,
    renderPublic: renderPublic,
    renderQueue: renderQueue,
    wireQueue: wireQueue,
    renderAdd: renderAdd,
    sessionLinks: sessionLinks,
    state: function () { return { loaded: N.loaded, items: N.items.length, approved: approved().length, pending: N.pending, err: N.err }; }
  };
})(window, document);
