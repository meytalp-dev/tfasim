/* תובי — הבוט של תובה (7.10.26).
   1. תדריך לפני ביקור: ממלא את [data-tovi-slot] בעמוד בית ספר (app.js). התוצאה נשמרת כאן,
      ולכן גם כש-app.js מרנדר מחדש את העמוד, התדריך חוזר למקומו.
   2. צ'אט: בועה צפה בכל עמוד (מיטל בחרה "חלונית צפה").
   3. הדפסה / העתקה / מייל לתדריך ולתשובות (8.10.26). המייל בלי נמען — המפקח.ת ממלא.ת (מיטל).
      נייד = <a href="mailto:"> אמיתי שנבנה בזמן הציור; מחשב = טיוטת Gmail + HTML מימין לשמאל ללוח,
      או "בתוכנת המייל (Outlook)": ה-HTML מועתק ונפתח mailto עם נושא בלבד (ראו /mail-button).
   הנתונים לא נשמרים בדף ולא בדפדפן — השרת של תובי מאמת את הטוקן מול השער ומסנן לפי בתי הספר של המחובר.ת.
   השיחה נשמרת רק בזיכרון של הלשונית; "שיחה חדשה" מנקה אותה. */
(function () {
  var TOVI_EXEC = 'https://script.google.com/macros/s/AKfycbxGnq5H1y9ubpgUCXRSE5T8aSNVPtEf-15RitWu2UofCvLszICoEUEzAFXpXEaOJzQg/exec';
  /* TOVI_OPEN = תובי מוצג לכל מי שנכנס.ה לתובה (מיטל, 7.10.26: "הקישור לא יישלח למפקחים עד שאבדוק").
     false = רק מי שנכנס.ה פעם אחת עם ?tovi=1 — מתג חירום אם צריך להסתיר מהר */
  var TOVI_OPEN = true;
  try {
    var qm = /[?&]tovi=([01])/.exec(location.search);
    if (qm) localStorage.setItem('tovi.on', qm[1]);
    if (!TOVI_OPEN && localStorage.getItem('tovi.on') !== '1') return;
  } catch (e) { if (!TOVI_OPEN && !/[?&]tovi=1/.test(location.search)) return; }

  var I = {
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 4.6L18.5 9l-4.7 1.5L12 15l-1.8-4.5L5.5 9l4.7-1.4z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></svg>',
    x:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    send:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12L4 4l3 8-3 8z"/><path d="M7 12h13"/></svg>',
    print: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V3h12v6"/><rect x="4" y="9" width="16" height="8" rx="2"/><path d="M7 14h10v7H7z"/></svg>',
    copy:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></svg>',
    mail:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
    reset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>'
  };
  var AVATAR = '<img class="tovi-av" src="brand/tubi-avatar.png" alt="" width="32" height="32">';
  var ERR = {
    badsession: 'הכניסה פגה. צריך להיכנס מחדש לתובה.',
    notlisted: 'החשבון הזה לא מורשה לתובי.', inactive: 'ההרשאה הושהתה.', nospace: 'החשבון הזה לא מורשה לתובי.',
    nodata: 'נתוני הפיקוח לא נטענו כרגע. אפשר לנסות שוב בעוד רגע.',
    'no-api-key': 'תובי עוד לא מחובר. מיטל משלימה את ההגדרה.',
    noschool: 'אין לתובי נתונים על בית הספר הזה.'
  };
  var IS_MOBILE = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
    (window.matchMedia && matchMedia('(pointer:coarse)').matches && innerWidth < 900);

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  /* מקור = תגית. "ביקור X; ספר ההפעלה › פרק › … › סעיף" → תגית לכל מקור, ובספרים רק הספר + הסעיף
     (הנתיב המלא ארוך מדי ושבר את רוחב החלונית, 7.10.26). הנתיב המלא — בריחוף */
  function srcShort(p) {
    var parts = p.split(/\s*›\s*/);
    return parts.length > 2 ? parts[0] + ' › ' + parts[parts.length - 1] : p;
  }
  function srcList(s) { return String(s || '').split(/\s*;\s*/).filter(Boolean); }
  function srcHtml(s) {
    return srcList(s).map(function (p) {
      return '<span class="tovi-src" title="' + esc(p) + '">' + esc(srcShort(p)) + '</span>';
    }).join(' ');
  }
  function errText(d) { return (d && ERR[d.error]) || 'משהו השתבש. אפשר לנסות שוב.'; }
  function toast(msg) {
    var t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg; t.classList.add('on');
    clearTimeout(toast.h); toast.h = setTimeout(function () { t.classList.remove('on'); }, 3200);
  }

  /* קריאה לשרת. ניסיון חוזר אחד — Apps Script מחזיר לפעמים דף ריק רגעי */
  function post(body, tries) {
    var R = window.REVITAL;
    if (!R || !R.token) return Promise.reject(new Error('noapp'));
    var snap = R.snap();
    body.token = R.token(); body.snap = snap; body.only = Object.keys(snap);
    return fetch(TOVI_EXEC, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); })
      .catch(function (e) { if ((tries || 0) < 1) return post(body, 1); throw e; });
  }

  /* ===== העתקה, מייל, הדפסה ===== */
  var OUT = {};   /* מפתח → { subject, text, html } — התוכן להעתקה ולמייל */
  function copyHtml(html, text) {
    var ok = false, div = document.createElement('div');
    div.contentEditable = 'true';
    div.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
    div.innerHTML = html;
    document.body.appendChild(div);
    try {
      /* selectNode על העטיפה עצמה — אחרת ה-<div dir="rtl"> החיצוני לא נכנס ללוח */
      var r = document.createRange();
      if (div.children.length === 1) r.selectNode(div.firstElementChild); else r.selectNodeContents(div);
      var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
      ok = document.execCommand('copy');
      sel.removeAllRanges();
    } catch (e) { ok = false; }
    document.body.removeChild(div);
    if (!ok) {
      try {
        var ta = document.createElement('textarea');
        ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta); ta.select(); ok = document.execCommand('copy'); document.body.removeChild(ta);
      } catch (e2) {}
    }
    return ok;
  }
  function mailto(o, withBody) {
    return 'mailto:?subject=' + encodeURIComponent(o.subject) + (withBody ? '&body=' + encodeURIComponent(o.text) : '');
  }
  /* שורת הכפתורים. נייד: mailto עם הגוף המלא. מחשב: Gmail + תוכנת המייל, שניהם מעתיקים HTML ללוח */
  function actions(key, o, withPrint) {
    OUT[key] = o;
    var h = '<div class="tovi-acts">' +
      (withPrint && !IS_MOBILE ? '<button type="button" class="btn sm" data-tovi-print="' + esc(key) + '">' + I.print + 'הדפסה</button>' : '') +
      '<button type="button" class="btn sm" data-tovi-copy="' + esc(key) + '">' + I.copy + 'העתקה</button>';
    if (IS_MOBILE) h += '<a class="btn sm" href="' + esc(mailto(o, true)) + '">' + I.mail + 'מייל</a>';
    else h += '<button type="button" class="btn sm" data-tovi-gmail="' + esc(key) + '">' + I.mail + 'מייל · Gmail</button>' +
      '<a class="btn sm" data-tovi-outlook="' + esc(key) + '" href="' + esc(mailto(o, false)) + '">' + I.mail + 'בתוכנת המייל (Outlook)</a>';
    return h + '</div>';
  }
  var MAIL_STYLE = 'direction:rtl;text-align:right;font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#16203c';
  /* Chrome משמיט את העטיפה החיצונית בהעתקה — לכן dir="rtl" ויישור לימין על כל אלמנט בלוק */
  function rtlize(html) {
    return html.replace(/<(h2|h3|p|ul|li)( style="|>)/g, function (m, tag, rest) {
      return '<' + tag + ' dir="rtl" style="direction:rtl;text-align:right;' + (rest === '>' ? '">' : '');
    });
  }
  function mailWrap(title, inner) {
    return rtlize('<div dir="rtl" style="' + MAIL_STYLE + '"><h2 style="font-size:17px;margin:0 0 8px;color:#3d2645">' + esc(title) + '</h2>' + inner +
      '<p style="color:#66728f;font-size:12px;margin:16px 0 0">נוצר על ידי תובי · תובה. תובי מסכם רק את מה שיש בתובה — כדאי לבדוק כל נתון לפני שמסתמכים עליו.</p></div>');
  }
  function srcPlain(s) { return srcList(s).map(srcShort).join('; '); }

  /* הדפסה: עותק של התוכן ב-#tovi-print, וה-CSS של ההדפסה מסתיר את כל השאר */
  function printOut(key) {
    var o = OUT[key];
    if (!o) return;
    var box = document.createElement('div');
    box.id = 'tovi-print'; box.setAttribute('dir', 'rtl');
    box.innerHTML = o.printHtml || o.html;
    document.body.appendChild(box);
    document.body.classList.add('tovi-printing');
    var done = function () {
      document.body.classList.remove('tovi-printing');
      if (box.parentNode) box.parentNode.removeChild(box);
      window.removeEventListener('afterprint', done);
    };
    window.addEventListener('afterprint', done);
    window.print();
    setTimeout(done, 1500);
  }

  /* ===== תדריך לפני ביקור ===== */
  var B = {};   /* semel → { st: load|ok|err, d } */
  var PARTS = [['status', 'תמונת מצב'], ['changed', 'מה השתנה מאז הביקור האחרון'], ['checks', 'נקודות לבדיקה בביקור'], ['recs', 'המלצות לפיקוח']];
  var NO_CHANGE = 'לא נמצא בנתונים שינוי מתוארך מאז הביקור האחרון.';

  function briefOut(d) {
    var br = d.brief || {}, title = 'תדריך לפני ביקור — ' + (d.school || ''), text = [title, 'נוצר ' + (d.at || ''), ''], html = '';
    PARTS.forEach(function (p) {
      var list = br[p[0]] || [];
      if (!list.length && p[0] !== 'changed') return;
      text.push(p[1]);
      html += '<h3 style="font-size:15px;margin:14px 0 4px;color:#3d2645">' + esc(p[1]) + '</h3>';
      if (!list.length) { text.push(NO_CHANGE, ''); html += '<p style="margin:0;color:#66728f">' + NO_CHANGE + '</p>'; return; }
      html += '<ul style="margin:0;padding-right:20px">';
      list.forEach(function (i) {
        var s = srcPlain(i.src);
        text.push('- ' + i.t + (s ? ' (' + s + ')' : ''));
        html += '<li style="margin:3px 0">' + esc(i.t) + (s ? ' <span style="color:#66728f;font-size:12px">(' + esc(s) + ')</span>' : '') + '</li>';
      });
      html += '</ul>';
      text.push('');
    });
    if (br.missing) { text.push('חסר לתמונה מלאה: ' + br.missing); html += '<p style="margin:12px 0 0;color:#66728f">חסר לתמונה מלאה: ' + esc(br.missing) + '</p>'; }
    text.push('', 'נוצר על ידי תובי · תובה. כדאי לבדוק כל נתון לפני שמסתמכים עליו.');
    return { subject: title, text: text.join('\n'), html: mailWrap(title, html) };
  }
  function briefHtml(semel) {
    var b = B[semel];
    if (!b) return '<div class="tovi-call"><button type="button" class="btn primary" data-tovi-brief="' + esc(semel) + '">' + I.spark + 'תדריך לפני ביקור</button>' +
      '<span>תובי מסכם את כל מה שיש בתובה על בית הספר: מצב, מה השתנה, מה לבדוק והמלצות.</span></div>';
    if (b.st === 'load') return '<div class="tovi-call"><span class="tovi-wait">' + I.spark + 'תובי מכין תדריך… זה לוקח עד דקה.</span></div>';
    if (b.st === 'err') return '<div class="tovi-call"><span class="tovi-err">' + esc(b.msg) + '</span><button type="button" class="btn sm" data-tovi-brief="' + esc(semel) + '">לנסות שוב</button></div>';
    var d = b.d, br = d.brief || {};
    var body = PARTS.map(function (p) {
      var list = br[p[0]] || [];
      if (!list.length) return p[0] === 'changed' ? '<h3>' + p[1] + '</h3><p class="tovi-none">' + NO_CHANGE + '</p>' : '';
      return '<h3>' + p[1] + '</h3><ul>' + list.map(function (i) {
        return '<li>' + esc(i.t) + (i.src ? ' ' + srcHtml(i.src) : '') + '</li>';
      }).join('') + '</ul>';
    }).join('');
    if (br.missing) body += '<p class="tovi-miss">חסר לתמונה מלאה: ' + esc(br.missing) + '</p>';
    var o = briefOut(d);
    o.printHtml = '<h1>' + esc(o.subject) + '</h1><p class="tovi-none">נוצר ' + esc(d.at || '') + '</p>' + body +
      '<p class="tovi-foot">נוצר על ידי תובי · תובה. כדאי לבדוק כל נתון לפני שמסתמכים עליו.</p>';
    return '<details class="card tovi-brief" open><summary>' + I.spark + '<b>תדריך לפני ביקור</b><span>נוצר ' + esc(d.at || '') + '</span></summary>' +
      '<div class="tovi-b">' + body + actions('b:' + semel, o, true) +
      '<p class="tovi-foot">תובי מסכם רק את מה שיש בתובה. כדאי לבדוק כל נתון לפני שמסתמכים עליו.</p></div></details>';
  }
  function fillSlots() {
    function fill(attr, render) {
      var slots = document.querySelectorAll('[' + attr + ']');
      for (var i = 0; i < slots.length; i++) {
        var h = render(slots[i].getAttribute(attr));
        if (slots[i].getAttribute('data-h') !== h) { slots[i].innerHTML = h; slots[i].setAttribute('data-h', h); }
      }
    }
    fill('data-tovi-slot', briefHtml);
    fill('data-tovi-insight', insightHtml);
  }

  /* ===== כפתורי תובנות (8.10.26) — [data-tovi-insight="<סוג>:<סמל>"] בדף; הסוגים בשרת (INSIGHTS) ===== */
  var INS = {
    goals: { btn: 'תובנות להשגת היעדים', title: 'תובנות להשגת היעדים',
             desc: 'לכל יעד: איפה הוא עומד לפי הנתונים, פעולות אפשריות, ואיך נדע שזה עובד.' }
  };
  var IN = {};   /* "סוג:סמל" → { st, d } */
  var INS_ERR = { nogoals: 'אין לבית הספר הזה יעדים מהוועדה המלווה.' };
  function insightOut(cfg, d) {
    var j = d.insight || {}, title = cfg.title + ' — ' + (d.school || ''), text = [title, 'נוצר ' + (d.at || ''), ''], html = '';
    (j.items || []).forEach(function (it) {
      text.push(it.title, it.status);
      html += '<h3 style="font-size:15px;margin:14px 0 4px;color:#3d2645">' + esc(it.title) + '</h3><p style="margin:0 0 4px">' + esc(it.status) + '</p>';
      [['evidence', 'מה רואים בנתונים'], ['actions', 'פעולות אפשריות']].forEach(function (g) {
        var list = it[g[0]] || [];
        if (!list.length) return;
        text.push(g[1] + ':');
        html += '<p style="margin:6px 0 2px;font-weight:bold">' + g[1] + '</p><ul style="margin:0;padding-right:20px">';
        list.forEach(function (i) {
          var s = srcPlain(i.src);
          text.push('- ' + i.t + (s ? ' (' + s + ')' : ''));
          html += '<li style="margin:3px 0">' + esc(i.t) + (s ? ' <span style="color:#66728f;font-size:12px">(' + esc(s) + ')</span>' : '') + '</li>';
        });
        html += '</ul>';
      });
      if (it.measure) { text.push('איך נדע שזה עובד: ' + it.measure); html += '<p style="margin:6px 0 0"><b>איך נדע שזה עובד:</b> ' + esc(it.measure) + '</p>'; }
      text.push('');
    });
    if (j.missing) { text.push('חסר בנתונים: ' + j.missing); html += '<p style="margin:12px 0 0;color:#66728f">חסר בנתונים: ' + esc(j.missing) + '</p>'; }
    text.push('', 'נוצר על ידי תובי · תובה. כדאי לבדוק כל נתון לפני שמסתמכים עליו.');
    return { subject: title, text: text.join('\n'), html: mailWrap(title, html) };
  }
  function insightHtml(key) {
    var kind = key.split(':')[0], cfg = INS[kind], b = IN[key];
    if (!cfg) return '';
    if (!b) return '<div class="tovi-call"><button type="button" class="btn primary" data-tovi-ins="' + esc(key) + '">' + I.spark + esc(cfg.btn) + '</button><span>' + esc(cfg.desc) + '</span></div>';
    if (b.st === 'load') return '<div class="tovi-call"><span class="tovi-wait">' + I.spark + 'תובי חושב… זה לוקח עד דקה.</span></div>';
    if (b.st === 'err') return '<div class="tovi-call"><span class="tovi-err">' + esc(b.msg) + '</span><button type="button" class="btn sm" data-tovi-ins="' + esc(key) + '">לנסות שוב</button></div>';
    var d = b.d, j = d.insight || {};
    var body = (j.items || []).map(function (it) {
      var h = '<div class="tovi-item"><h3>' + esc(it.title) + '</h3><p class="tovi-status">' + esc(it.status) + '</p>';
      [['evidence', 'מה רואים בנתונים'], ['actions', 'פעולות אפשריות']].forEach(function (g) {
        var list = it[g[0]] || [];
        if (list.length) h += '<p class="tovi-sub">' + g[1] + '</p><ul>' + list.map(function (i) {
          return '<li>' + esc(i.t) + (i.src ? ' ' + srcHtml(i.src) : '') + '</li>';
        }).join('') + '</ul>';
      });
      if (it.measure) h += '<p class="tovi-measure"><b>איך נדע שזה עובד:</b> ' + esc(it.measure) + '</p>';
      return h + '</div>';
    }).join('');
    if (j.missing) body += '<p class="tovi-miss">חסר בנתונים: ' + esc(j.missing) + '</p>';
    var o = insightOut(cfg, d);
    o.printHtml = '<h1>' + esc(o.subject) + '</h1><p class="tovi-none">נוצר ' + esc(d.at || '') + '</p>' + body +
      '<p class="tovi-foot">נוצר על ידי תובי · תובה. כדאי לבדוק כל נתון לפני שמסתמכים עליו.</p>';
    return '<details class="card tovi-brief" open><summary>' + I.spark + '<b>' + esc(cfg.title) + '</b><span>נוצר ' + esc(d.at || '') + '</span></summary>' +
      '<div class="tovi-b">' + body + actions('i:' + key, o, true) +
      '<p class="tovi-foot">"איפה זה עומד" היא הסקה של תובי מהנתונים, לא נתון רשמי. כדאי לבדוק לפני שמסתמכים.</p></div></details>';
  }
  function insight(key) {
    var p = key.split(':');
    IN[key] = { st: 'load' }; fillSlots();
    post({ action: 'insight', kind: p[0], semel: p[1] }).then(function (d) {
      if (d && d.ok && d.limited) IN[key] = { st: 'err', msg: d.message };
      else if (d && d.ok && d.insight) IN[key] = { st: 'ok', d: d };
      else IN[key] = { st: 'err', msg: (d && INS_ERR[d.error]) || errText(d) };
      fillSlots();
    }).catch(function () { IN[key] = { st: 'err', msg: 'אין חיבור לתובי כרגע. אפשר לנסות שוב.' }; fillSlots(); });
  }
  function brief(semel) {
    B[semel] = { st: 'load' }; fillSlots();
    post({ action: 'brief', semel: semel }).then(function (d) {
      if (d && d.ok && d.limited) B[semel] = { st: 'err', msg: d.message };
      else if (d && d.ok && d.brief) B[semel] = { st: 'ok', d: d };
      else B[semel] = { st: 'err', msg: errText(d) };
      fillSlots();
    }).catch(function () { B[semel] = { st: 'err', msg: 'אין חיבור לתובי כרגע. אפשר לנסות שוב.' }; fillSlots(); });
  }

  /* ===== צ'אט צף ===== */
  /* שאלות לדוגמה לפי תחום (מיטל, 8.10.26). {S} = בית הספר שפתוח עכשיו — השאלה מוצגת רק בעמוד בית ספר.
     כל שאלה כאן נענית מהנתונים שתובי מקבל (תקציר + פירוט + ידע) */
  var TOPICS = [
    ['מצב כללי', ['איזה בית ספר שלי צריך הכי הרבה תשומת לב עכשיו, ולמה?', 'תן.י לי תמונת מצב קצרה על כל בתי הספר שלי',
      'באילו בתי ספר הדירוג הכולל במיפוי הוא "סיכון"?', 'מה המצב של {S} בכמה משפטים?']],
    ['ביקורים', ['איפה לא היה ביקור יותר משלושה חודשים?', 'מה סוכם בביקור האחרון ב{S}?',
      'אילו פעולות למעקב נשארו פתוחות מהביקורים ב{S}?', 'באילו בתי ספר לא תועד אף ביקור?']],
    ['מיפוי ויעדים', ['באילו בתי ספר החניכות במצב סיכון?', 'לאילו בתי ספר אין יעדים מהוועדה המלווה?',
      'מה היעדים של {S}, ומה מתקדם לפי הביקורים?', 'איזה מדד חלש חוזר ביותר בתי ספר שלי?']],
    ['בעלי תפקידים', ['באילו בתי ספר חסרים בעלי תפקידים בנספח?', 'מי עוד לא הגיש את נספח בעלי התפקידים?',
      'אילו תפקידים חסרים ב{S}?']],
    ['אקלים', ['באילו בתי ספר יש פער או ירידה באקלים?', 'מה עולה משאלון האקלים ב{S}?',
      'איך האקלים ב{S} מתיישב עם מה שעלה בביקורים?']],
    ['מה חסר', ['אילו בתי ספר לא הגישו סל תוכניות?', 'מה חסר לכל בית ספר שלי?',
      'באילו בתי ספר רישום המורים למנור לא הושלם?', 'מה חסר ל{S}?']],
    ['ידע מקצועי', ['מה ספר ההפעלה אומר על פירמידת החניכות?', 'מה לבדוק בביקור כדי לראות למידה דואלית?',
      'מה זו מסננת שבעת היחסים?', 'איך מחזקים חוסן לפי ספר ההפעלה?']]
  ];
  var TOPIC = 0;
  var H = [], busy = false, fab, panel, log, inp, resetBtn, pickBox;

  /* על איזה בית ספר שואלים (מיטל, 8.10.26: "מה היעדים של בית הספר הזה?" מחוץ לעמוד בית ספר — תובי לא ידע).
     PICK = null → לפי העמוד הפתוח; '' → כל בתי הספר; סמל → הבית ספר שנבחר ברשימה.
     מעבר לעמוד אחר מחזיר ל"לפי העמוד". הרשימה = רק בתי הספר של המחובר.ת (snap מסונן ממילא) */
  var PICK = null, PICK_AT = '';
  function pageAt() { var R = window.REVITAL; return R && R.at ? R.at() : ''; }
  function syncPick() { var at = pageAt(); if (at !== PICK_AT) { PICK_AT = at; PICK = null; } }
  function schoolNow() {
    syncPick();
    var R = window.REVITAL, snap = R && R.snap ? R.snap() : {}, at = PICK_AT;
    var semel = PICK !== null ? PICK : (at.indexOf('s:') === 0 ? at.slice(2) : '');
    var sn = semel && snap[semel];
    return sn ? { semel: semel, name: sn.n } : null;
  }
  function pickHtml() {
    var R = window.REVITAL, snap = R && R.snap ? R.snap() : {}, sc = schoolNow();
    var list = Object.keys(snap).map(function (s) { return { s: s, n: snap[s].n }; })
      .sort(function (a, b) { return String(a.n).localeCompare(String(b.n), 'he'); });
    return '<label for="toviPick">על איזה בית ספר?</label><select id="toviPick">' +
      '<option value="">כל בתי הספר שלי (' + list.length + ')</option>' +
      list.map(function (x) { return '<option value="' + esc(x.s) + '"' + (sc && sc.semel === x.s ? ' selected' : '') + '>' + esc(x.n) + '</option>'; }).join('') +
      '</select>';
  }
  function buildChat() {
    fab = document.createElement('button');
    fab.type = 'button'; fab.className = 'tovi-fab'; fab.setAttribute('aria-label', 'שאלו את תובי');
    /* האווטאר מתיקיית המיתוג (שיחת המיתוג, 7.10.26): תובי מופיע רק כאווטאר קטן */
    fab.innerHTML = AVATAR + '<span>תובי</span>';
    panel = document.createElement('section');
    panel.className = 'tovi-panel'; panel.hidden = true; panel.setAttribute('aria-label', 'תובי');
    panel.innerHTML = '<header><div>' + AVATAR + '<b>תובי</b><small>שאלות על בתי הספר שלך</small></div>' +
      '<button type="button" class="tovi-new" hidden>' + I.reset + 'שיחה חדשה</button>' +
      '<button type="button" class="tovi-x" aria-label="סגירה">' + I.x + '</button></header>' +
      '<div class="tovi-pick"></div>' +
      '<div class="tovi-log" aria-live="polite"></div>' +
      '<form class="tovi-form"><textarea rows="2" placeholder="למשל: מה השתנה בבית הספר מאז הביקור?" aria-label="השאלה"></textarea>' +
      '<button type="submit" class="tovi-send" aria-label="שליחה">' + I.send + '</button></form>';
    document.body.appendChild(fab); document.body.appendChild(panel);
    log = panel.querySelector('.tovi-log'); inp = panel.querySelector('textarea'); resetBtn = panel.querySelector('.tovi-new');
    pickBox = panel.querySelector('.tovi-pick');
    pickBox.addEventListener('change', function (e) {
      if (e.target.id !== 'toviPick') return;
      syncPick(); PICK = e.target.value;
      paint();
    });
    fab.onclick = function () { open(true); };
    panel.querySelector('.tovi-x').onclick = function () { open(false); };
    resetBtn.onclick = function () { if (busy) return; H = []; OUT = filterOut(OUT); paint(); inp.focus(); };
    panel.querySelector('form').onsubmit = function (e) { e.preventDefault(); ask(inp.value); };
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(inp.value); } });
    paint();
  }
  /* "שיחה חדשה" מוחקת את התוכן של תשובות הצ'אט, לא של התדריכים */
  function filterOut(o) { var n = {}; Object.keys(o).forEach(function (k) { if (k.indexOf('m:') !== 0) n[k] = o[k]; }); return n; }
  function open(on) {
    panel.hidden = !on; fab.hidden = on;
    document.body.classList.toggle('tovi-on', on);
    if (on) { paint(); setTimeout(function () { inp.focus(); }, 30); }
  }
  function fmt(t) {
    var out = '', inList = false;
    String(t || '').split('\n').forEach(function (line) {
      var m = line.match(/^\s*[-•]\s+(.*)$/);
      if (m) { if (!inList) { out += '<ul>'; inList = true; } out += '<li>' + esc(m[1]) + '</li>'; return; }
      if (inList) { out += '</ul>'; inList = false; }
      if (line.trim()) out += '<p>' + esc(line) + '</p>';
    });
    return out + (inList ? '</ul>' : '');
  }
  function answerOut(q, m) {
    var src = (m.sources || []).map(srcShort), title = 'תובי: ' + (q.length > 70 ? q.slice(0, 70) + '…' : q);
    var inner = '<p style="margin:0 0 8px;color:#66728f">השאלה: ' + esc(q) + '</p>' +
      fmt(m.content).replace(/<ul>/g, '<ul style="margin:0;padding-right:20px">').replace(/<p>/g, '<p style="margin:0 0 6px">') +
      (src.length ? '<p style="color:#66728f;font-size:12px;margin:8px 0 0">מקורות: ' + esc(src.join(' · ')) + '</p>' : '');
    return { subject: title, html: mailWrap(title, inner),
             text: 'השאלה: ' + q + '\n\n' + m.content + (src.length ? '\n\nמקורות: ' + src.join(' · ') : '') + '\n\nנוצר על ידי תובי · תובה' };
  }
  function examples() {
    var sc = schoolNow();
    /* כשנבחר בית ספר — השאלות עליו קודם */
    var all = TOPICS[TOPIC][1], mine = all.filter(function (q) { return q.indexOf('{S}') > -1; });
    var qs = (sc ? mine.concat(all.filter(function (q) { return mine.indexOf(q) < 0; })) : all.filter(function (q) { return mine.indexOf(q) < 0; }))
      .map(function (q) { return sc ? q.replace(/\{S\}/g, sc.name) : q; });
    return '<div class="tovi-hi"><p>אני עונה מתוך מה שיש בתובה על בתי הספר שלך: מיפוי, ביקורים, יעדים, אקלים, סל תוכניות, בעלי תפקידים ומה חסר — ומספר ההפעלה. כשאין לי נתון, אגיד את זה.</p>' +
      '<p class="tovi-lbl">על מה תרצו לשאול?</p><div class="tovi-topics" role="tablist">' + TOPICS.map(function (t, i) {
        return '<button type="button" role="tab" aria-selected="' + (i === TOPIC) + '" data-tovi-topic="' + i + '">' + esc(t[0]) + '</button>';
      }).join('') + '</div>' +
      '<div class="tovi-ex">' + qs.map(function (q) { return '<button type="button" data-tovi-q="' + esc(q) + '">' + esc(q) + '</button>'; }).join('') + '</div>' +
      (sc ? '' : '<p class="tovi-tip">בחרו בית ספר ברשימה למעלה, ויופיעו גם שאלות עליו.</p>') + '</div>';
  }
  function paint() {
    var h = '', lastQ = '';
    if (!H.length) h += examples();
    H.forEach(function (m, i) {
      if (m.role === 'user') { lastQ = m.content; h += '<div class="tovi-m me">' + esc(m.content) + '</div>'; return; }
      h += '<div class="tovi-m bot' + (m.err ? ' err' : '') + '">' + fmt(m.content) +
        (m.sources && m.sources.length ? '<div class="tovi-srcs">' + m.sources.map(srcHtml).join('') + '</div>' : '') +
        (m.err ? '' : actions('m:' + i, answerOut(lastQ, m), false)) + '</div>';
    });
    if (busy) h += '<div class="tovi-m bot tovi-wait">תובי בודק בנתונים…</div>';
    pickBox.innerHTML = pickHtml();
    log.innerHTML = h;
    log.scrollTop = H.length ? log.scrollHeight : 0;
    resetBtn.hidden = !H.length;
  }
  function ask(q) {
    q = String(q || '').trim();
    if (!q || busy) return;
    var sc = schoolNow();
    var history = H.filter(function (m) { return !m.err; }).slice(-6).map(function (m) { return { role: m.role, content: m.content }; });
    H.push({ role: 'user', content: q }); inp.value = ''; busy = true; paint();
    post({ action: 'ask', question: q, history: history, semel: sc ? sc.semel : '' }).then(function (d) {
      if (d && d.ok) H.push({ role: 'assistant', content: d.answer, sources: d.sources || [], err: !!d.limited });
      else H.push({ role: 'assistant', content: errText(d), err: true });
    }).catch(function () {
      H.push({ role: 'assistant', content: 'אין חיבור לתובי כרגע. אפשר לנסות שוב.', err: true });
    }).then(function () { busy = false; paint(); });
  }

  /* ===== חיבור לדף ===== */
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target : null, el;
    if (!t) return;
    if ((el = t.closest('[data-tovi-brief]'))) { brief(el.getAttribute('data-tovi-brief')); return; }
    if ((el = t.closest('[data-tovi-ins]'))) { insight(el.getAttribute('data-tovi-ins')); return; }
    if ((el = t.closest('[data-tovi-topic]'))) { TOPIC = +el.getAttribute('data-tovi-topic'); paint(); return; }
    if ((el = t.closest('[data-tovi-q]'))) { ask(el.getAttribute('data-tovi-q')); return; }
    if ((el = t.closest('[data-tovi-print]'))) { printOut(el.getAttribute('data-tovi-print')); return; }
    var o;
    if ((el = t.closest('[data-tovi-copy]')) && (o = OUT[el.getAttribute('data-tovi-copy')])) {
      toast(copyHtml(o.html, o.text) ? 'הועתק. אפשר להדביק במסמך, במייל או בוואטסאפ' : 'ההעתקה לא הצליחה');
      return;
    }
    if ((el = t.closest('[data-tovi-gmail]')) && (o = OUT[el.getAttribute('data-tovi-gmail')])) {
      /* ההעתקה לפני פתיחת החלון — החלון החדש לוקח את הפוקוס */
      var copied = copyHtml(o.html, o.text);
      var url = 'https://mail.google.com/mail/?view=cm&fs=1&su=' + encodeURIComponent(o.subject) + (copied ? '' : '&body=' + encodeURIComponent(o.text));
      window.open(url, '_blank', 'noopener');
      toast(copied ? 'התוכן הועתק. לחצו בגוף המייל ו-Ctrl+V' : 'נפתחה טיוטה');
      return;
    }
    if ((el = t.closest('[data-tovi-outlook]')) && (o = OUT[el.getAttribute('data-tovi-outlook')])) {
      /* הקישור עצמו פותח את תוכנת המייל (ברירת המחדל של הדפדפן); כאן רק מעתיקים לפני */
      toast(copyHtml(o.html, o.text) ? 'התוכן הועתק. בטיוטה שנפתחה — Ctrl+V' : 'נפתחה טיוטה');
    }
  });
  function start() {
    if (fab) return;
    buildChat();
    var main = document.getElementById('main');
    if (main && window.MutationObserver) new MutationObserver(fillSlots).observe(main, { childList: true });
    fillSlots();
  }
  document.addEventListener('pmh:in', start);
  if (document.documentElement.classList.contains('pmh-in')) start();
  else document.addEventListener('DOMContentLoaded', function () { if (document.documentElement.classList.contains('pmh-in')) start(); });
})();
