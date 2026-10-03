/**
 * אדווה · אימות פרטים (3.10.26)
 *
 * בכניסה, אחרי קוד המייל: כרטיס אחד בראש עמוד המפגש — "אלה הפרטים שלך. נכון?"
 * שם מלא · בית ספר (בחירה מ-64) · מייל. אישור בלי שינוי נרשם מיד; תיקון מחכה לאישור של מיטל
 * ולא דורס את הרשימה. בלי טלפון (אדווה לא מחזיקה מידע אישי מעבר לזה).
 * לא חוסם כלום: הנוכחות, המצגת והדף המלווה עובדים גם בלי אימות.
 * השרת: Profile.source.txt (profileGet / profileConfirm).
 */
(function (w, d) {
  "use strict";

  function el(id) { return d.getElementById(id); }
  function esc(s) {
    return String(s === undefined || s === null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  var ERR = {
    badname: "צריך שם מלא, לפחות שתי אותיות.",
    badschool: "צריך לבחור בית ספר.",
    badmail: "כתובת המייל לא נראית תקינה.",
    nosession: "הכניסה פגה. כדאי לרענן את הדף.",
    busy: "המערכת עמוסה לרגע. כדאי לנסות שוב."
  };

  var V = { data: null, sent: "" };

  function host() {
    var h = el("v2-verify");
    if (!h) {
      var sess = el("v2-session");
      if (!sess) return null;
      h = d.createElement("div");
      h.id = "v2-verify";
      sess.insertBefore(h, sess.firstChild);
    }
    return h;
  }

  function schoolOptions(cur) {
    var list = (w.SH_SCHOOLS || []).slice();
    if (cur && list.indexOf(cur) < 0) list.unshift(cur);
    return '<option value="">בחירת בית ספר…</option>' + list.map(function (n) {
      return "<option" + (n === cur ? " selected" : "") + ">" + esc(n) + "</option>";
    }).join("");
  }

  function render() {
    var h = host();
    if (!h) return;
    var D = V.data;
    if (V.sent) {
      h.innerHTML = '<div class="v2-card vf-done" role="status"><b>תודה!</b> ' +
        (V.sent === "ממתין" ? "התיקון נשלח למיטל, והוא ייכנס לרשימה אחרי האישור שלה." : "הפרטים שלך אושרו.") + "</div>";
      return;
    }
    if (!D || D.status === "אושר" || D.status === "נדחה") { h.innerHTML = ""; return; }
    if (D.status === "ממתין") {
      h.innerHTML = '<div class="v2-card vf-done">התיקון בפרטים שלך ממתין לאישור של מיטל.</div>';
      return;
    }
    h.innerHTML =
      '<form class="v2-card vf" id="vf-form" novalidate>' +
        '<p class="v2-eyebrow">פעם אחת, לפני שמתחילים</p>' +
        "<h2>אלה הפרטים שלך. נכון?</h2>" +
        '<p class="vf-lead">כך נדע שהשם, בית הספר והמייל ברשימת ההשתלמות נכונים. אם משהו לא מדויק, אפשר לתקן כאן, ומיטל תאשר.</p>' +
        '<div class="vf-grid">' +
          '<label>שם מלא<input id="vf-name" autocomplete="name" value="' + esc(D.name) + '"></label>' +
          '<label>בית ספר<select id="vf-school">' + schoolOptions(D.school) + "</select></label>" +
          '<label>מייל<input id="vf-mail" type="email" dir="ltr" autocomplete="email" value="' + esc(D.mail) + '"></label>' +
        "</div>" +
        '<p class="vf-err" id="vf-err" role="alert" hidden></p>' +
        '<div class="v2-row"><button type="submit" class="v2-btn primary" id="vf-ok">אישור הפרטים</button></div>' +
      "</form>";
    el("vf-form").addEventListener("submit", submit);
  }

  function submit(ev) {
    ev.preventDefault();
    var btn = el("vf-ok"), err = el("vf-err");
    var body = { name: el("vf-name").value, school: el("vf-school").value, mail: el("vf-mail").value };
    err.hidden = true;
    if (body.name.trim().length < 2) { err.textContent = ERR.badname; err.hidden = false; return; }
    if (!body.school) { err.textContent = ERR.badschool; err.hidden = false; return; }
    btn.disabled = true; btn.textContent = "שולחים…";
    w.SH_auth.api("profileConfirm", body).then(function (r) {
      if (!r || r.ok !== true) throw r || {};
      V.sent = r.status;
      render();
    }).catch(function (r) {
      btn.disabled = false; btn.textContent = "אישור הפרטים";
      err.textContent = ERR[r && r.error] || "השליחה לא הצליחה. כדאי לנסות שוב בעוד רגע.";
      err.hidden = false;
    });
  }

  /* מחכים שהכניסה תסתיים ושהמסך של הרכז/ת יעלה. אצל מיטל ואלנט (מעטפת הניהול) לא מופיע. */
  function waitAndLoad() {
    var tries = 0;
    var t = w.setInterval(function () {
      tries++;
      var wrap = el("v2-wrap"), adm = el("adm");
      var ready = wrap && !wrap.hidden && (!adm || adm.hidden) && w.SH_auth && w.SH_auth.token && w.SH_auth.token();
      if (!ready) { if (tries > 240) w.clearInterval(t); return; }
      w.clearInterval(t);
      w.SH_auth.api("profileGet", {}).then(function (r) {
        if (r && r.ok) { V.data = r; render(); }
      }).catch(function () { /* האימות הוא תוספת; בלי רשת לא מציגים כלום */ });
    }, 500);
  }

  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", waitAndLoad);
  else waitAndLoad();
})(window, document);
