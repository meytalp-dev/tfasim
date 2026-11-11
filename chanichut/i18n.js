/* עברית / ערבית (10.11.26)
   כפתור החלפת שפה. התרגום נעשה בדפדפן בלבד, ממילון קבוע (i18n-ar.js) —
   שום טקסט ושום שם לא נשלחים לשירות תרגום. הקוד של המסכים לא משתנה:
   הקובץ הזה מחליף את הטקסט המוצג (וגם placeholder/title/aria-label),
   ושומר את המקור כדי לחזור לעברית בלחיצה. שמות תלמידים, בתי ספר ומעסיקים
   נשארים כמו שהם (אין להם תרגום במילון). שדות קלט לא נוגעים בהם. */
(function () {
  'use strict';
  var KEY = 'chanichut-lang';
  var lang = 'he';
  try { if (localStorage.getItem(KEY) === 'ar') lang = 'ar'; } catch (e) {}

  var D = window.I18N_AR || {};
  var HEB = /[֐-׿]/;
  var NUM = /\d+(?:[.,:\/]\d+)*/g;
  var norm = function (s) { return String(s).replace(/\s+/g, ' ').trim(); };
  var numKey = function (s) { return s.replace(NUM, '#'); };
  var reEsc = function (s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); };

  /* ---------- בניית המילון ---------- */
  var EX = new Map();   // טקסט מנורמל (מספרים → #) → ערבית
  var PAT = [];         // תבניות עם {} → ביטוי רגולרי
  var FR = [];          // קטעים לחיפוש בתוך טקסט ארוך
  Object.keys(D).forEach(function (he) {
    var ar = D[he]; if (typeof ar !== 'string' || !ar) return;
    var h = norm(he); if (!HEB.test(h)) return;
    if (h.indexOf('{}') >= 0) {
      var parts = h.split('{}');
      var lits = parts.filter(function (p) { return HEB.test(p); });
      if (!lits.length) return;
      var anchor = lits.slice().sort(function (a, b) { return b.length - a.length; })[0].trim();
      /* תבנית שכל העוגן שלה אות או שתיים ("מ{}", "ל{}") תופסת כל טקסט — מדלגים */
      if ((anchor.match(/[א-ת]/g) || []).length < 3) return;
      PAT.push({ re: new RegExp('^' + parts.map(function (p) { return reEsc(p).replace(/ /g, '\\s*'); }).join('([\\s\\S]+?)') + '$'), ar: norm(ar), anchor: anchor, n: parts.length - 1 });
      return;
    }
    var k = numKey(h);
    if (!EX.has(k)) EX.set(k, norm(ar));
    /* "א · ב" במילון ובתרגום עם אותו מספר חלקים → גם כל חלק לבד (המסך לפעמים מחבר אותם אחרת) */
    var hp = h.split(' · '), ap = norm(ar).split(' · ');
    if (hp.length > 1 && hp.length === ap.length) hp.forEach(function (p, i) {
      p = p.trim(); if (!HEB.test(p) || p.indexOf('{}') >= 0) return;
      var pk = numKey(p); if (!EX.has(pk)) EX.set(pk, ap[i].trim());
      if (p.length >= 3 && (/\s/.test(p) || p.length >= 6) && !/\d/.test(p)) FR.push([p, ap[i].trim()]);
    });
    /* קטע לחיפוש בתוך משפט: כמה מילים, או מילה ארוכה (כדי לא לגעת בשמות) */
    if (h.length >= 3 && (/\s/.test(h) || h.length >= 6) && !/\d/.test(h)) FR.push([h, norm(ar)]);
  });
  PAT.sort(function (a, b) { return b.anchor.length - a.anchor.length; });
  FR.sort(function (a, b) { return b[0].length - a[0].length; });

  /* מחזיר את המספרים מהמקור לתוך התרגום, לפי הסדר */
  function putNums(src, ar) {
    var nums = src.match(NUM) || []; if (!nums.length) return ar;
    var i = 0; return ar.replace(NUM, function (m) { return i < nums.length ? nums[i++] : m; });
  }
  function exact(t) {
    var k = numKey(t), ar = EX.get(k);
    return ar == null ? null : putNums(t, ar);
  }
  function pattern(t) {
    for (var i = 0; i < PAT.length; i++) {
      var p = PAT[i]; if (t.indexOf(p.anchor) < 0) continue;
      var m = p.re.exec(t); if (!m) continue;
      var j = 1;
      return p.ar.replace(/\{\}/g, function () { var v = m[j++]; return v == null ? '' : core(norm(v), true); });
    }
    return null;
  }
  var isHe = function (c) { return !!c && /[א-ת]/.test(c); };
  var PREFIX = /(^|\s)[בלמהוש]$/; // "החניכות ב" + שם
  function fragments(t) {
    var out = t, hit = false;
    for (var i = 0; i < FR.length; i++) {
      var he = FR[i][0]; if (out.indexOf(he) < 0) continue;
      var from = 0, idx;
      while ((idx = out.indexOf(he, from)) >= 0) {
        var before = out[idx - 1], after = out[idx + he.length];
        var ok = !isHe(before) && (!isHe(after) || PREFIX.test(he));
        if (ok) { out = out.slice(0, idx) + FR[i][1] + out.slice(idx + he.length); hit = true; from = idx + FR[i][1].length; }
        else from = idx + he.length;
      }
      if (!HEB.test(out)) break;
    }
    return hit ? out : null;
  }
  /* לב התרגום: מדויק → תבנית → קטעים. inner = ערך שהוצב בתבנית (רק מדויק) */
  function core(t, inner) {
    if (!HEB.test(t)) return t;
    var r = exact(t); if (r != null) return r;
    var pr = inner ? null : pattern(t);
    /* "כותרת: ערך" או "א · ב" — מתרגמים כל חלק לבד */
    var sr = null, seps = [' · ', ': ', ' | ', ' — ', ' – ', ', '];
    for (var s = 0; s < seps.length && sr == null; s++) {
      if (t.indexOf(seps[s]) < 0) continue;
      var bits = t.split(seps[s]), changed = false;
      var tb = bits.map(function (b) { var x = core(norm(b), inner); if (x !== norm(b)) changed = true; return x; });
      if (changed) sr = tb.join(seps[s]);
    }
    /* תבנית מול פירוק: מה שמשאיר פחות עברית (שווה → התבנית, הדקדוק שלה טוב יותר) */
    if (pr != null || sr != null) {
      var heN = function (x) { return x == null ? 1e9 : (x.match(/[א-ת]/g) || []).length; };
      return heN(sr) < heN(pr) ? sr : pr;
    }
    r = fragments(t); if (r != null) return r;
    return t;
  }
  var CACHE = new Map();
  function tr(s) {
    if (s == null) return s; s = String(s);
    if (!HEB.test(s)) return s;
    if (CACHE.has(s)) return CACHE.get(s);
    var lead = s.match(/^\s*/)[0], tail = s.match(/\s*$/)[0];
    var out = s.indexOf('\n') >= 0
      ? s.split('\n').map(function (l) { return l.trim() ? l.match(/^\s*/)[0] + core(norm(l)) : l; }).join('\n')
      : lead + core(norm(s)) + tail;
    if (CACHE.size > 20000) CACHE.clear();
    CACHE.set(s, out);
    return out;
  }

  /* ---------- החלפה בדף ---------- */
  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, NOSCRIPT: 1, CODE: 1, PRE: 1 };
  var ATTRS = ['placeholder', 'title', 'aria-label', 'alt', 'data-tip'];
  var ORIG = new WeakMap();  // צומת טקסט → המקור
  var MINE = new WeakMap();  // צומת טקסט → מה שכתבנו
  var AORIG = new WeakMap(); // אלמנט → {מאפיין: מקור}
  var TOUCHED = new Set();
  /* ערבית → המקור. כשקוד המסך קורא טקסט מכפתור ("שולח…" ואז מחזיר) הוא מקבל את הערבית
     ויוצר צומת חדש; בחזרה לעברית מזהים אותו לפי הטקסט */
  var REV = new Map();
  function skipEl(el) {
    for (var e = el; e && e.nodeType === 1; e = e.parentElement) {
      if (SKIP[e.tagName] || e.isContentEditable || e.hasAttribute('data-noi18n')) return true;
    }
    return false;
  }
  function doText(n) {
    var v = n.nodeValue; if (!v || !HEB.test(v)) return;
    if (MINE.get(n) === v) return;
    if (!n.parentElement || skipEl(n.parentElement)) return;
    var t = tr(v); ORIG.set(n, v);
    if (t !== v) { MINE.set(n, t); REV.set(t, v); REV.set(norm(t), norm(v)); n.nodeValue = t; TOUCHED.add(n); }
  }
  function doAttrs(el) {
    if (skipEl(el) && el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') return;
    for (var i = 0; i < ATTRS.length; i++) {
      var a = ATTRS[i], v = el.getAttribute(a); if (!v || !HEB.test(v)) continue;
      var o = AORIG.get(el) || {}; if (o['$' + a] === v) continue;
      var t = tr(v); if (t === v) continue;
      o[a] = v; o['$' + a] = t; AORIG.set(el, o); REV.set(t, v); el.setAttribute(a, t); TOUCHED.add(el);
    }
    if (el.tagName === 'INPUT' && /^(button|submit|reset)$/i.test(el.type) && HEB.test(el.value)) {
      var o2 = AORIG.get(el) || {}; if (o2.$value !== el.value) { var tv = tr(el.value); o2.value = el.value; o2.$value = tv; AORIG.set(el, o2); el.value = tv; TOUCHED.add(el); }
    }
  }
  function walk(root) {
    if (root.nodeType === 3) { doText(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
    if (root.nodeType === 1) { if (SKIP[root.tagName] && root.tagName !== 'INPUT' && root.tagName !== 'TEXTAREA') return; doAttrs(root); }
    var it = document.createTreeWalker(root, 5 /* ELEMENT|TEXT */, null), n;
    while ((n = it.nextNode())) { if (n.nodeType === 3) doText(n); else doAttrs(n); }
  }
  function restore() {
    TOUCHED.forEach(function (n) {
      if (n.nodeType === 3) { var o = ORIG.get(n); if (o != null && MINE.get(n) === n.nodeValue) n.nodeValue = o; MINE.delete(n); }
      else { var a = AORIG.get(n); if (a) { Object.keys(a).forEach(function (k) { if (k[0] === '$') return; if (k === 'value') { if (n.value === a.$value) n.value = a.value; } else if (n.getAttribute(k) === a['$' + k]) n.setAttribute(k, a[k]); }); AORIG.delete(n); } }
    });
    TOUCHED.clear();
    if (!REV.size || !document.body) return;
    var AR = /[؀-ۿ]/;
    var it = document.createTreeWalker(document.body, 5, null), x;
    while ((x = it.nextNode())) {
      if (x.nodeType === 3) { if (AR.test(x.nodeValue)) { var lead = x.nodeValue.match(/^\s*/)[0], tail = x.nodeValue.match(/\s*$/)[0], h = REV.get(x.nodeValue) || REV.get(norm(x.nodeValue)); if (h != null) x.nodeValue = REV.has(x.nodeValue) ? h : lead + norm(h) + tail; } }
      else if (!x.closest('.lang-btn')) for (var i = 0; i < ATTRS.length; i++) { var v = x.getAttribute(ATTRS[i]); if (v && AR.test(v) && REV.has(v)) x.setAttribute(ATTRS[i], REV.get(v)); }
    }
  }

  var obs = new MutationObserver(function (list) {
    if (lang !== 'ar') return;
    for (var i = 0; i < list.length; i++) {
      var m = list[i];
      if (m.type === 'characterData') doText(m.target);
      else if (m.type === 'attributes') doAttrs(m.target);
      else for (var j = 0; j < m.addedNodes.length; j++) walk(m.addedNodes[j]);
    }
    if (TOUCHED.size > 30000) TOUCHED.forEach(function (n) { if (!n.isConnected) TOUCHED.delete(n); });
    placeButtons();
  });

  /* חלונות קופצים */
  var _alert = window.alert, _confirm = window.confirm, _prompt = window.prompt;
  window.alert = function (m) { return _alert.call(window, lang === 'ar' ? tr(m) : m); };
  window.confirm = function (m) { return _confirm.call(window, lang === 'ar' ? tr(m) : m); };
  window.prompt = function (m, d) { return _prompt.call(window, lang === 'ar' ? tr(m) : m, d); };

  var TITLE0 = null;
  function apply() {
    var html = document.documentElement;
    html.lang = lang; html.dir = 'rtl';
    document.body && document.body.classList.toggle('lang-ar', lang === 'ar');
    if (lang === 'ar') {
      if (TITLE0 == null) TITLE0 = document.title;
      document.title = tr(TITLE0);
      walk(document.body);
      obs.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    } else {
      obs.disconnect(); restore();
      if (TITLE0 != null) document.title = TITLE0;
    }
    placeButtons(); paintButtons();
  }
  function set(l) {
    lang = l === 'ar' ? 'ar' : 'he';
    try { localStorage.setItem(KEY, lang); } catch (e) {}
    apply();
  }

  /* ---------- הכפתור ---------- */
  function mkBtn(cls) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'lang-btn ' + (cls || ''); b.setAttribute('data-noi18n', '');
    b.addEventListener('click', function () { set(lang === 'ar' ? 'he' : 'ar'); });
    return b;
  }
  function paintButtons() {
    var bs = document.querySelectorAll('.lang-btn');
    for (var i = 0; i < bs.length; i++) {
      var b = bs[i], t = lang === 'ar' ? 'עברית' : 'العربية';
      if (b.textContent === t) continue;   /* בלי שינוי מיותר — אחרת המשקיף מפעיל את עצמו בלולאה */
      b.textContent = t;
      b.lang = lang === 'ar' ? 'he' : 'ar';
      b.setAttribute('aria-label', lang === 'ar' ? 'מעבר לעברית' : 'التبديل إلى العربية');
    }
  }
  var placing = false;
  function placeButtons() {
    if (placing) return; placing = true;
    try {
      var hosts = document.querySelectorAll('.top .actions, .gate-head, .top[data-lang-host]');
      for (var i = 0; i < hosts.length; i++) {
        var h = hosts[i]; if (h.querySelector(':scope > .lang-btn')) continue;
        var b = mkBtn(h.classList.contains('gate-head') ? 'on-gate' : '');
        h.insertBefore(b, h.firstChild);
      }
      paintButtons();
    } finally { placing = false; }
  }

  var css = document.createElement('style');
  css.textContent =
    '.lang-btn{font:inherit;font-weight:700;font-size:.9em;min-height:40px;padding:.35em .9em;border-radius:999px;border:1px solid var(--line,#d6d0c4);background:var(--card,#fff);color:var(--ink,#1D4F5E);cursor:pointer;white-space:nowrap;flex:none}' +
    '.lang-btn:hover{border-color:currentColor}.lang-btn:focus-visible{outline:2px solid currentColor;outline-offset:2px}' +
    '.lang-btn[lang=ar]{font-family:"Noto Sans Arabic","Segoe UI",Tahoma,sans-serif}' +
    '.gate-head .lang-btn.on-gate{order:9}' +
    '@media (min-width:761px){html[lang=ar] .top .nav{font-size:.86em}html[lang=ar] .top .nav a{padding-inline:.5em}.top .actions .lang-btn{min-height:36px;padding:.25em .75em;font-size:.85em}}' +
    '@media (max-width:760px){.top .actions{flex-wrap:nowrap;align-items:center}.top .actions .lang-btn{min-height:36px;padding:.2em .6em;font-size:.8em}html[lang=ar] .top .brand b{font-size:.85em;white-space:nowrap}}' +
    'html[lang=ar] body{font-family:"Assistant","Noto Sans Arabic","Segoe UI",Tahoma,sans-serif}';
  document.head.appendChild(css);
  var fl = document.createElement('link');
  fl.rel = 'stylesheet'; fl.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;600;700&display=swap';
  document.head.appendChild(fl);

  window.I18N = { get lang() { return lang; }, set: set, tr: function (s) { return lang === 'ar' ? tr(s) : s; }, _tr: tr };

  function boot() {
    /* כפתור גם כשאין עדיין סרגל (המסך נבנה מאוחר) */
    var hostObs = new MutationObserver(function () { placeButtons(); });
    hostObs.observe(document.body, { childList: true, subtree: true });
    apply();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
