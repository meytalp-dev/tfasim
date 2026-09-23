/* תור אופליין לשמירות מהשטח: כל פריט עם מפתח k; פריט חדש לאותו k מחליף את הישן.
   נשמר ב-localStorage ונשלח כשיש רשת. sender(items) מחזיר Promise<boolean>.
   אירוע document "mefq:state" {key, pending} אחרי כל שינוי — הדף מצייר "נשמר" / "ממתין לשליחה". */
(function (w, d) {
  "use strict";
  var PREFIX = "mefakeach.q.";
  function make(key, sender) {
    var sk = PREFIX + key, items = [], sending = false;
    try { items = JSON.parse(w.localStorage.getItem(sk) || "[]"); if (!Array.isArray(items)) items = []; } catch (e) { items = []; }
    function persist() { try { if (items.length) w.localStorage.setItem(sk, JSON.stringify(items)); else w.localStorage.removeItem(sk); } catch (e) {} emit(); }
    function emit() { try { d.dispatchEvent(new CustomEvent("mefq:state", { detail: { key: key, pending: items.length > 0 } })); } catch (e) {} }
    function flush() {
      if (sending || !items.length) return Promise.resolve(items.length === 0);
      sending = true; var batch = items.slice();
      return Promise.resolve().then(function () { return sender(batch); }).then(function (ok) {
        if (ok) items = items.filter(function (it) { return batch.indexOf(it) < 0; });
        sending = false; persist(); return !!ok && items.length === 0;
      }).catch(function () { sending = false; persist(); return false; });
    }
    function push(item) {
      items = items.filter(function (it) { return it.k !== item.k; }); items.push(item); persist();
      return flush();
    }
    return { push: push, flush: flush, size: function () { return items.length; }, pending: function () { return items.length > 0; } };
  }
  w.MEFQ = { make: make };
})(window, document);
