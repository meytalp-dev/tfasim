/* משותף למצגת, לדף המלווה ולמצגת חדר המורים */
let SHOTS = {};
async function loadShots(){
  try{ const r = await fetch('img/shots.json'); SHOTS = await r.json(); }catch(e){ SHOTS = {}; }
}
function esc(s){ return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
/* esc + סימון רצפים באנגלית כ-ltr, כדי שלא יתהפכו בתוך משפט בעברית */
function bidi(s){ return String(s).split(/([A-Za-z][A-Za-z0-9.\-\/:_]*(?: [A-Za-z0-9][A-Za-z0-9.\-\/:_]*)*)/).map((p,i) => i % 2 ? `<span dir="ltr">${esc(p)}</span>` : esc(p)).join(''); }

/* צילום עם מסגרת כתומה. maxW/maxH בפיקסלים (או null). */
function shotHTML(name, maxW, maxH, cls){
  cls = cls || '';
  if(!name) return '';
  if(name.startsWith('pending:')){
    const w = maxW || 600, h = maxH ? Math.min(maxH, w*0.5) : w*0.5;
    return `<div class="shot pending ${cls}" style="width:${w}px;height:${h}px"><span>צילום ממתין לבדיקה<br><small>${esc(name.slice(8))}</small></span></div>`;
  }
  const s = SHOTS[name];
  if(!s) return `<div class="shot pending ${cls}" style="width:${maxW||600}px;height:${(maxW||600)*.5}px"><span>חסר צילום: ${esc(name)}</span></div>`;
  let w = maxW || s.w, h = w * s.h / s.w;
  if(maxH && h > maxH){ h = maxH; w = h * s.w / s.h; }
  /* hl: מסגרת אחת [x,y,w,h] או כמה [[x,y,w,h],...]; בכמה מסגרות אין עמעום סביב */
  const multi = s.hl && Array.isArray(s.hl[0]);
  const hl = (s.hl ? (multi ? s.hl : [s.hl]) : []).map(b => `<span class="hl" style="left:${b[0]}%;top:${b[1]}%;width:${b[2]}%;height:${b[3]}%${multi?';box-shadow:none':''}"></span>`).join('');
  return `<div class="shot ${cls}" style="width:${Math.round(w)}px"><img src="img/${name}.png" alt="${esc(s.see||'')}" loading="lazy" onerror="shotMissing(this,'${name}',${Math.round(h)})">${hl}</div>`;
}

/* הצילום רשום ב-shots.json אבל הקובץ עוד לא נשמר ב-img/: מציגים מסגרת ממתינה במקום תמונה שבורה */
function shotMissing(img, name, h){
  const box = img.parentNode; box.classList.add('pending'); box.style.height = h + 'px';
  box.innerHTML = `<span>צילום ממתין<br><small>img/${name}.png</small></span>`;
}

function copyText(text, btn){
  const done = () => { if(btn){ const o = btn.dataset.label || btn.textContent; btn.dataset.label = o; btn.textContent = 'הועתק'; setTimeout(()=>btn.textContent=o, 1500); } };
  if(navigator.clipboard && window.isSecureContext){ navigator.clipboard.writeText(text).then(done).catch(()=>fallback()); }
  else fallback();
  function fallback(){ const ta = document.createElement('textarea'); ta.value = text; ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.select(); try{ document.execCommand('copy'); done(); }catch(e){} ta.remove(); }
}

const ICON = {
  eye:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  spark:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/></svg>',
  wrench:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/></svg>',
  book:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5M8 7h7"/></svg>',
  chev:'<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 6l-6 6 6 6"/></svg>',
  copy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></svg>',
  ext:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
  warn:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5" stroke-linecap="round"/></svg>'
};
const TOOL_NAME = { login:'כניסה לחשבון משרד העבודה', gemini:'Gemini', vids:'Vids', aistudio:'AI Studio', firebase:'Firebase', staff:'המצגת לחדר המורים' };
