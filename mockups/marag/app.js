/* מארג · מוקאפ — ניתוב, מסכים ואינטראקציות (הכול בזיכרון, בלי שמירה) */
(function(){
'use strict';

/* ---------- עזרים ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const HE_MONTHS = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
const HE_DAYS = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
const pd = s => { const [y,m,d] = s.split('-').map(Number); return new Date(Date.UTC(y, m-1, d||1)); };
const fmtD = s => { const d = pd(s); return d.getUTCDate() + '.' + (d.getUTCMonth()+1); };
const monthOf = s => HE_MONTHS[pd(s).getUTCMonth()];
const daysTo = s => Math.round((pd(s) - pd(TODAY)) / 864e5);
const shek = n => '₪' + Number(n).toLocaleString('he-IL');
const staff = id => STAFF.find(s => s.id === id);
const initials = n => n.split(' ').map(w => w[0]).join('').slice(0,2);
const num = s => s == null ? NaN : parseFloat(String(s).split('/')[0]);

const ST_LABEL = { done:'הושג', ok:'בדרך', risk:'בסיכון', behind:'מאחור', late:'לא עודכן במועד', wait:'טרם נמדד' };
const ST_COLOR = { done:'#1F7A42', ok:'#3BA163', risk:'#E0A21B', behind:'#C8412F', late:'#C8412F', wait:'#C3CFDA' };
const PLAN_ST = { approved:['st-done','אושרה'], submitted:['st-risk','ממתינה לאישורך'], draft:['st-wait','בטיוטה'] };

const I = {
  home:'<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
  plan:'<rect x="4" y="3.5" width="16" height="17" rx="2.5"/><path d="M8 8.5h8M8 12.5h8M8 16.5h5"/>',
  cal:'<rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M3 9.5h18M8 3v3M16 3v3"/>',
  target:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
  wallet:'<rect x="3" y="6" width="18" height="14" rx="2.5"/><path d="M3 10h18M16 15h2"/>',
  users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.5 3.3-5.5 6.5-5.5s5.9 2 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.7c2 .7 3.2 2.5 3.5 5.3"/>',
  mail:'<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>',
  check:'<path d="m4.5 12.5 5 5 10-11"/>',
  alert:'<path d="M12 3.5 2.5 20h19z"/><path d="M12 10v4.5M12 17.5v.01"/>',
  clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  bell:'<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  chev:'<path d="m6 9 6 6 6-6"/>',
  back:'<path d="M5 12h14M13 6l6 6-6 6"/>',
  fwd:'<path d="M19 12H5M11 6l-6 6 6 6"/>',
  school:'<path d="M3 9.5 12 5l9 4.5-9 4.5z"/><path d="M7 11.5V16c1.5 1.5 3 2 5 2s3.5-.5 5-2v-4.5"/>',
  eye:'<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  weave:'<path d="M3 8c3-2 6 2 9 0s6-2 9 0M3 16c3-2 6 2 9 0s6-2 9 0"/><path d="M8 3v18M16 3v18"/>',
  lock:'<rect x="5" y="11" width="14" height="9.5" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  send:'<path d="M21 3 10 14"/><path d="m21 3-7 18-4-7-7-4z"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  flag:'<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>',
  phone:'<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
  key:'<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3"/>',
  spark:'<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>'
};
const ic = (n, cls) => `<svg class="i ${cls||''}" viewBox="0 0 24 24" aria-hidden="true">${I[n]}</svg>`;

function logo(size){
  const s = size || 30, H = ['#F2A07B','#9FE0C0','#FFD27A'], V = [11,20,29], Y = [12,20,28];
  let h = '', v = '', over = '';
  Y.forEach((y,i)=> h += `<path d="M5 ${y} C 12 ${y-3}, 16 ${y+3}, 20 ${y} S 28 ${y-3}, 35 ${y}" stroke="${H[i]}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`);
  V.forEach(x=> v += `<path d="M${x} 5 V35" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/>`);
  V.forEach((x,j)=> Y.forEach((y,i)=>{ if((i+j)%2===0) over += `<path d="M${x-3} ${y+ (j===1?0:(j===0?-0.6:0.6))} H${x+3}" stroke="${H[i]}" stroke-width="3.2" stroke-linecap="round"/>`; }));
  return `<svg width="${s}" height="${s}" viewBox="0 0 40 40" aria-hidden="true">${v}${h}${over}</svg>`;
}

let toastT;
function toast(msg){ const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(()=>t.classList.remove('show'), 2600); }

/* ---------- נתונים נגזרים ---------- */
function allEvents(){
  const out = [];
  Object.keys(PLANS).forEach(rid => (PLANS[rid].events||[]).forEach(e => out.push(Object.assign({ rid }, e))));
  return out.sort((a,b) => a.d < b.d ? -1 : 1);
}
function allObjectives(){
  const out = [];
  Object.keys(PLANS).forEach(rid => (PLANS[rid].objectives||[]).forEach(o => out.push(Object.assign({ rid }, o))));
  return out;
}
function findEvent(id){ for(const rid in PLANS){ const e = (PLANS[rid].events||[]).find(x=>x.id===id); if(e) return e; } return null; }
function findObj(id){ for(const rid in PLANS){ const o = (PLANS[rid].objectives||[]).find(x=>x.id===id); if(o) return o; } return null; }
const isPast = e => (e.d2 || e.d) < TODAY;
function pct(o){
  const b = num(o.base), t = num(o.target), a = num(o.actual);
  if(isNaN(a) || isNaN(b) || isNaN(t) || t === b) return null;
  return Math.max(0, Math.min(1, (a-b)/(t-b)));
}
function lateTasks(){
  const out = [];
  allEvents().forEach(e => (e.tasks||[]).forEach(t => { if(!t.done && t.due < TODAY) out.push({ e, t }); }));
  return out;
}
function overloadWeeks(){
  const ev = allEvents().filter(e => !isPast(e)), out = [];
  ev.forEach((e,i) => {
    const win = ev.filter(x => { const g = (pd(x.d) - pd(e.d))/864e5; return g >= 0 && g <= 6; });
    if(win.length >= 3 && !out.some(w => w.items.some(x => x.id === e.id))) out.push({ from:e.d, items:win });
  });
  return out;
}

/* ---------- ניתוב ---------- */
function route(){
  const h = (location.hash || '#/').slice(1).split('/').filter(Boolean);
  const [a, b, c] = h;
  window.scrollTo(0,0);
  if(!a)            return view(null, intro());
  if(a === 'login') return view(null, login());
  if(a === 'r')     return view(headRole(b||'home'), ({ home:rHome, plan:()=>rPlan(+c||1), events:rEvents })[b||'home']());
  if(a === 'p')     return view(headPrincipal(b||'home', false), pView(b||'home', false));
  if(a === 'o')     return view(null, owner());
  if(a === 's'){
    if(!b || b === 'schools') return view(headSup(), sSchools());
    return view(headPrincipal(c||'home', true), pView(c||'home', true));
  }
  view(null, intro());
}
function pView(v, ro){
  return ({ home:()=>pHome(ro), goals:()=>pGoals(ro), objectives:()=>pObjectives(ro), calendar:()=>pCalendar(ro),
            budget:()=>pBudget(ro), team:()=>pTeam(ro), mail:pMail })[v]();
}
function view(head, body){
  mockBar();
  $('#head').innerHTML = head || '';
  $('#main').innerHTML = `<div class="fade">${body}</div>`;
  bind();
}
function mockBar(){
  const h = location.hash || '#/';
  const L = [['#/','מבוא לרויטל',/^#\/?$/],['#/login','מסך הכניסה',/^#\/login/],['#/r/home','בעלת תפקיד',/^#\/r/],
             ['#/p/home','מנהל',/^#\/p/],['#/o','אחראי על משימה',/^#\/o/],['#/s/schools','מפקחת',/^#\/s/]];
  $('#mock').innerHTML = `<div class="in"><b>מוקאפ · צפייה בתור:</b>${L.map(l=>`<a href="${l[0]}" class="${l[2].test(h)?'on':''}">${l[1]}</a>`).join('')}
    <span class="today">היום במוקאפ: 12.1.2027</span></div>`;
}

/* ---------- כותרות ---------- */
function head(nav, who, extra, sub){
  return `<header class="head"><div class="in">
    <div class="row">
      <a class="brand" href="#/"><span class="logo">${logo(30)}</span>
        <span><span class="nm">מארג</span><div class="sub">${esc(sub || SCHOOL.name + ' · תוכנית העבודה של בית הספר')}</div></span></a>
      <div class="who"><div class="t"><b>${esc(who.name)}</b><span>${esc(who.role)}</span></div>
        <span class="av" style="background:${who.color}">${esc(initials(who.name))}</span></div>
    </div>
    ${extra||''}
    <nav class="nav">${nav}</nav>
  </div></header>`;
}
const navA = (href, on, icon, label, cnt) => `<a href="${href}" class="${on?'on':''}">${ic(icon)}${label}${cnt?`<span class="cnt">${cnt}</span>`:''}</a>`;

function headRole(cur){
  const me = staff('hevrati');
  return head(
    navA('#/r/home', cur==='home', 'home', 'הבית שלי', 3) +
    navA('#/r/plan/1', cur==='plan', 'plan', 'התוכנית שלי') +
    navA('#/r/events', cur==='events', 'cal', 'האירועים שלי'),
    { name:me.name, role:me.role, color:me.color });
}
function headPrincipal(cur, ro){
  const me = staff('menahel'), base = ro ? '#/s/dekel/' : '#/p/';
  const pend = STAFF.filter(s=>s.status==='submitted').length + allEvents().filter(e=>e.approval==='pending').length;
  const nav = navA(base+'home', cur==='home', 'home', 'הבית', ro?0:pend) + navA(base+'goals', cur==='goals', 'weave', 'מפת המטרות') +
    navA(base+'objectives', cur==='objectives', 'target', 'יעדים') + navA(base+'calendar', cur==='calendar', 'cal', 'לוח שנה') +
    navA(base+'budget', cur==='budget', 'wallet', 'תקציב') + navA(base+'team', cur==='team', 'users', 'הצוות') +
    (ro ? '' : navA('#/p/mail', cur==='mail', 'mail', 'המייל השבועי'));
  const who = ro ? { name:SUPERVISOR.name, role:SUPERVISOR.role, color:'#5B4B8A' } : { name:me.name, role:'מנהל בית הספר', color:me.color };
  const extra = ro ? `<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
      <a href="#/s/schools" class="ro" style="color:#fff;text-decoration:none">${ic('back')} בתי הספר שלי</a>
      <span class="ro">${ic('lock')} ${esc(SCHOOL.name)} · צפייה בלבד, כמו שהמנהל רואה</span></div>` : '';
  return head(nav, who, extra);
}
function headSup(){
  return head(navA('#/s/schools', true, 'school', 'בתי הספר שלי'), { name:SUPERVISOR.name, role:SUPERVISOR.role, color:'#5B4B8A' }, '', 'תוכניות העבודה בבתי הספר שלי');
}

/* =========================================================
   מבוא לרויטל
   ========================================================= */
function intro(){
  return `
  <section class="intro-hero">
    <div style="position:relative">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px"><span class="logo" style="width:54px;height:54px;border-radius:15px;background:rgba(255,255,255,.14);display:grid;place-items:center">${logo(40)}</span>
        <span style="font-weight:700;opacity:.9">מוקאפ לרויטל · ${esc(SCHOOL.name)} (בית ספר לדוגמה)</span></div>
      <h1>מארג</h1>
      <p>כל בעל/ת תפקיד כותב/ת תוכנית עבודה אחת, והמערכת אורגת את כל התוכניות לתוכנית בית ספרית אחת:
      עם מטרות משותפות, יעדים שנמדדים בזמן, אירועים שמזכירים לעצמם, ומבט ברור למנהל/ת ולמפקח/ת.</p>
    </div>
  </section>

  <div class="sec"><div class="sec-t">איך זה עובד לאורך השנה</div>
    <div class="loop">
      <div><b>כל אחד כותב פעם אחת</b><span>מטרות, יעדים מדידים ואירועים, ובכל אירוע "מה צריך ומי אחראי"</span></div>
      <div><b>המערכת אורגת</b><span>התוכניות מתחברות ל-3 המטרות של בית הספר, ללוח שנה אחד ולתקציב אחד</span></div>
      <div><b>תזכורות ומדידה</b><span>האחראים מקבלים תזכורת לפני כל משימה; בכל מועד בדיקה מתבקשים לעדכן את המצב בפועל</span></div>
      <div><b>מנהל ומפקח רואים</b><span>מה בדרך ומה מאחר, בלי לרדוף אחרי אף אחד ובלי לבקש דוחות</span></div>
    </div></div>

  <div class="sec"><div class="sec-t">להסתכל בעיני...</div>
    <div class="grid g4">
      ${persp('#/r/home','plan','בעלת התפקיד','נועה, הרכזת החברתית: מה מחכה לה היום, התוכנית שלה והאירועים עם המשימות.')}
      ${persp('#/p/home','home','המנהל','אבי: מה מחכה לאישור, מה מאחר, מפת המטרות, יעדים, לוח שנה ותקציב.')}
      ${persp('#/o','phone','האחראי על משימה','יוסי, אב הבית: מקבל מייל ומסמן "בוצע" בטלפון, בלי סיסמה ובלי מערכת.')}
      ${persp('#/s/schools','school','המפקחת','שרון: כל בתי הספר שלה ברשימה אחת, ונכנסת לכל אחד במבט המנהל לקריאה בלבד.')}
    </div></div>

  <div class="sec grid g2">
    <div class="card pad"><h2>${ic('flag')} מה צריך כדי להפעיל פיילוט</h2>
      <ul class="pilot" style="margin-top:10px">
        <li><b>בית ספר אחד</b> לבחירתך, עם מנהל/ת ו-5–6 בעלי תפקידים.</li>
        <li><b>מפגש פתיחה של כשעה</b> עם המנהל/ת: מגדירים 3 מטרות בית ספריות.</li>
        <li><b>כל בעל/ת תפקיד ממלא/ת את התוכנית</b> בחמישה צעדים קצרים, עם דוגמאות לתפקיד שלו/ה.</li>
        <li><b>המפקח/ת של בית הספר</b> מקבל/ת גישה לצפייה מהיום הראשון.</li>
        <li>כניסה כמו במנור: בוחרים שם ומקבלים קוד למייל.</li>
      </ul></div>
    <div class="card pad"><h2>${ic('spark')} מה המנהל/ת מקבל/ת</h2>
      <ul class="pilot" style="margin-top:10px">
        <li>תמונה אחת של כל התוכניות, מחוברות למטרות של בית הספר.</li>
        <li>התראה כשמשהו מאחר, לפני שזה הופך לבעיה.</li>
        <li>לוח שנה שמזהה עומס, ותקציב שמתחבר לאירועים.</li>
        <li>מייל אחד ביום ראשון: מה השבוע ומה דורש החלטה.</li>
        <li class="muted">בשלב הבא: שיחות משוב שנבנות לבד מהנתונים.</li>
      </ul></div>
  </div>
  <p class="small muted" style="margin-top:14px">השמות, בית הספר והנתונים בדויים. במוקאפ אפשר ללחוץ ולסמן, אבל שום דבר לא נשמר.</p>`;
}
const persp = (href, icon, t, d) => `<a class="card persp" href="${href}"><div class="ic">${ic(icon)}</div><h3>${t}</h3><p>${d}</p><span class="go">כניסה ${ic('fwd')}</span></a>`;

/* =========================================================
   מסך כניסה
   ========================================================= */
let loginState = { step:1, role:'hevrati' };
function login(){
  const roles = STAFF.map(s=>({ id:s.id, t:s.role })).concat([{ id:'sup', t:'מפקח/ת' }]);
  const s = loginState;
  const person = s.role === 'sup' ? SUPERVISOR.name : staff(s.role).name;
  return `<div class="gate">
    <div class="logo-big">${logo(40)}</div>
    <h1>מארג</h1>
    <p class="muted">תוכנית העבודה של ${esc(SCHOOL.name)}</p>
    <div style="margin-top:20px">
    ${s.step === 1 ? `
      <div class="field"><label>התפקיד שלי</label>
        <div class="roles-pick">${roles.map(r=>`<button data-role="${r.id}" class="${r.id===s.role?'on':''}">${esc(r.t)}</button>`).join('')}</div></div>
      <div class="field"><label>השם שלי</label><select><option>${esc(person)}</option></select></div>
      <button class="btn pri" style="width:100%" data-act="login-send">${ic('mail')} שליחת קוד למייל</button>
      <p class="small muted" style="margin-top:10px">הקוד נשלח למייל ששמור במערכת. אין סיסמה לזכור.</p>`
    : `
      <p style="font-weight:700">שלחנו קוד לכתובת <span class="ltr">no***@dekel.org.il</span></p>
      <div class="code"><span>4</span><span>8</span><span>1</span><span>2</span><span>0</span><span>6</span></div>
      <button class="btn pri" style="width:100%" data-act="login-go">כניסה</button>
      <p class="small muted" style="margin-top:10px">נשארים מחוברים 30 יום במכשיר הזה.</p>`}
    </div></div>`;
}

/* =========================================================
   בעלת תפקיד — נועה, הרכזת החברתית
   ========================================================= */
function rHome(){
  const P = PLANS.hevrati, me = staff('hevrati');
  const h2 = findObj('h2'), e4 = findEvent('e4'), e3 = findEvent('e3');
  const t4 = e4.tasks, done4 = t4.filter(t=>t.done).length, late4 = t4.filter(t=>!t.done && t.due < TODAY);
  const items = [];
  if(!h2.actual) items.push(`<div class="todo" id="todo-h2"><div class="ic a">${ic('target')}</div><div class="bd">
      <div class="tt">הגיע מועד הבדיקה של יעד: ${esc(h2.t)}</div>
      <div class="ds">נקודת פתיחה ${h2.base} · היעד ${h2.target}. שאלון האקלים של ינואר כבר אצלך. מה יצא?</div>
      <div class="ac inline-in"><input id="in-h2" inputmode="decimal" placeholder="למשל 68%"><button class="btn pri sm" data-act="upd-h2">עדכון</button>
      <span class="small muted">המנהל יראה את זה מיד במסך היעדים</span></div></div></div>`);
  items.push(`<div class="todo"><div class="ic ${late4.length?'r':'b'}">${ic('cal')}</div><div class="bd">
      <div class="tt">${esc(e4.t)} מתחיל בעוד ${daysTo(e4.d)} ימים</div>
      <div class="ds">${done4} מתוך ${t4.length} משימות סגורות${late4.length?` · <b style="color:var(--red)">באיחור: ${esc(late4[0].t)} (${esc(late4[0].ow)}, ${esc(late4[0].owr)})</b>`:''}</div>
      <div class="ac"><a class="btn sm" href="#/r/events" data-open="e4">לאירוע ${ic('fwd')}</a>
      ${late4.length?`<button class="btn sm" data-act="nudge" data-who="${esc(late4[0].ow)}">${ic('bell')} תזכורת ל${esc(late4[0].ow)}</button>`:''}</div></div></div>`);
  if(!e3.report) items.push(`<div class="todo" id="todo-e3"><div class="ic b">${ic('check')}</div><div class="bd">
      <div class="tt">${esc(e3.t)} (${fmtD(e3.d)}): איך היה?</div>
      <div class="ds">שתי שאלות קצרות. התשובה נכנסת לבד ליעד "השתתפות".</div>
      <div class="ac inline-in" id="rep-e3"><button class="btn sm" data-act="rep-yes">התקיים</button><button class="btn sm ghost" data-act="rep-no">לא התקיים</button></div></div></div>`);
  items.push(`<div class="todo"><div class="ic g">${ic('wallet')}</div><div class="bd">
      <div class="tt">התקציב ל${esc(e4.t)} (${shek(e4.cost)}) מחכה לאישור של אבי</div>
      <div class="ds">ברגע שיאשר תקבלי הודעה. אין צורך לעשות כלום.</div></div></div>`);

  const next = P.events.filter(e=>!isPast(e)).slice(0,3);
  return `
  <div class="page-h"><div><h1>בוקר טוב, נועה</h1><p>יום שלישי, 12 בינואר · ${items.length-1} דברים מחכים לך</p></div></div>
  <div class="grid" style="grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);align-items:start" id="r-home-grid">
    <div class="card"><div style="padding:16px 18px 4px"><h2>${ic('bell')} מה מחכה לי עכשיו</h2></div>${items.join('')}</div>
    <div class="grid">
      <div class="card pad"><h2>${ic('target')} היעדים שלי</h2>
        ${P.objectives.map(o=>objMini(o)).join('')}
        <a class="btn sm ghost" href="#/r/plan/3" style="margin-top:8px">לכל היעדים ${ic('fwd')}</a></div>
      <div class="card pad"><h2>${ic('cal')} בקרוב</h2>
        ${next.map(e=>`<div style="display:flex;gap:10px;align-items:center;margin-top:10px"><span class="date">${fmtD(e.d)}</span><span style="flex:1">${esc(e.t)}</span><span class="small muted">${daysTo(e.d)} ימים</span></div>`).join('')}</div>
    </div>
  </div>`;
}
function objMini(o){
  const p = pct(o);
  return `<div style="margin-top:12px"><div style="display:flex;gap:8px;align-items:center;justify-content:space-between">
      <span style="font-weight:600;font-size:14px">${esc(o.t)}</span><span class="chip st-${o.st}">${ST_LABEL[o.st]}</span></div>
    <div class="prog" style="margin-top:5px"><span>${o.base}</span><div class="bar"><i style="width:${p==null?0:Math.round(p*100)}%;background:${ST_COLOR[o.st]}"></i></div><span>${o.target}</span></div>
    <div class="small muted">${o.actual?`עכשיו: <b style="color:var(--text)">${o.actual}</b> · `:''}בדיקה ב${HE_MONTHS[+o.check.split('-')[1]-1]}</div></div>`;
}

function rPlan(step){
  const P = PLANS.hevrati, me = staff('hevrati');
  const S = ['מה אקדם השנה','מטרות','יעדים מדידים','פעולות','אירועים ומה צריך'];
  const steps = `<div class="steps">${S.map((t,i)=>`<a href="#/r/plan/${i+1}" class="${i+1===step?'on':'dn'}"><span class="n">${i+1===step?i+1:ic('check').replace('class="i "','class="i" style="width:14px;height:14px;stroke-width:3"')}</span>${t}</a>`).join('')}</div>`;
  let body = '';
  if(step === 1) body = `
    <div class="tip">${ic('spark')}<div>2–4 שורות. האמירה המרכזית שממנה נגזר כל השאר. <b>דוגמה לרכזת חברתית:</b> "השנה אקדם מעורבות חברתית פעילה..."</div></div>
    <div class="field"><label>מה אקדם בתחום שלי השנה</label><textarea rows="4">${esc(P.vision)}</textarea></div>`;
  if(step === 2) body = `
    <div class="tip">${ic('weave')}<div>כל מטרה שלך מתחברת לאחת מ-3 המטרות של בית הספר שהמנהל הגדיר. <b>כך נוצר המארג:</b> המנהל רואה מי עובד על מה.</div></div>
    ${P.goals.map((g,i)=>`<div class="goal-row"><div class="tt">${i+1}. ${esc(g.t)}</div>
      <div class="small muted" style="margin-top:6px">מתחברת למטרה הבית ספרית:</div>
      <div class="link-sel">${SCHOOL_GOALS.map(s=>`<span class="${s.id===g.sg?'on':''}" data-pick>${esc(s.title)}</span>`).join('')}</div></div>`).join('')}
    <button class="btn sm">${ic('plus')} הוספת מטרה</button>`;
  if(step === 3) body = `
    <div class="tip">${ic('target')}<div>לכל יעד צריך מספר: מה מודדים, מאיפה מתחילים, לאן מגיעים ומתי בודקים. <b>במועד הבדיקה תקבלי תזכורת לעדכן את המצב בפועל.</b></div></div>
    <div class="card tbl-wrap"><table class="tbl resp"><thead><tr><th>היעד</th><th>איך נמדוד</th><th>פתיחה</th><th>יעד</th><th>בדיקה</th><th>עכשיו</th></tr></thead><tbody>
    ${P.objectives.map(o=>`<tr><td data-l="היעד"><b>${esc(o.t)}</b></td><td data-l="איך נמדוד">${esc(o.m)}</td><td class="num" data-l="פתיחה">${o.base}</td>
      <td class="num" data-l="יעד" style="color:var(--accent)">${o.target}</td><td data-l="בדיקה"><span class="date">${HE_MONTHS[+o.check.split('-')[1]-1]}</span></td>
      <td data-l="עכשיו"><span class="chip st-${o.st}">${o.actual?o.actual+' · ':''}${ST_LABEL[o.st]}</span></td></tr>`).join('')}
    </tbody></table></div>
    <button class="btn sm" style="margin-top:12px">${ic('plus')} הוספת יעד מדיד</button>`;
  if(step === 4) body = `
    <div class="tip">${ic('check')}<div>הצעדים שתעשי כדי להצליח. כל פעולה הופכת לשורה בצ׳ק־ליסט שלך.</div></div>
    <div class="card" style="padding:4px 18px">${P.actions.map(a=>`<div class="task ${a.done?'done':''}" data-toggle><span class="ck"><svg viewBox="0 0 24 24">${I.check}</svg></span>
      <div class="bd"><div class="tt">${esc(a.t)}</div></div><span class="date">${esc(a.when)}</span></div>`).join('')}</div>
    <button class="btn sm" style="margin-top:12px">${ic('plus')} הוספת פעולה</button>`;
  if(step === 5) body = `
    <div class="tip">${ic('bell')}<div>לכל אירוע כותבים <b>מה צריך ומי אחראי</b>. כל שורה הופכת למשימה, והאחראי/ת מקבל/ת תזכורת במייל לבד, שבוע ויום לפני המועד.</div></div>
    ${eventCard(findEvent('e4'), true)}
    <div class="sec-t" style="margin-top:16px">שאר האירועים בתוכנית</div>
    <div class="card tbl-wrap"><table class="tbl resp"><thead><tr><th>מתי</th><th>אירוע</th><th>משתתפים</th><th>עלות</th><th>משימות</th></tr></thead><tbody>
    ${P.events.filter(e=>e.id!=='e4').map(e=>`<tr><td data-l="מתי"><span class="date">${fmtD(e.d)}</span></td><td data-l="אירוע"><b>${esc(e.t)}</b></td><td data-l="משתתפים">${esc(e.who)}</td>
      <td class="num" data-l="עלות">${e.cost?shek(e.cost):'—'}</td><td data-l="משימות">${(e.tasks||[]).length||'—'}</td></tr>`).join('')}
    </tbody></table></div>
    <button class="btn sm" style="margin-top:12px">${ic('plus')} הוספת אירוע</button>`;
  const prev = step>1 ? `<a class="btn" href="#/r/plan/${step-1}">${ic('back')} הקודם</a>` : '<span></span>';
  const next = step<5 ? `<a class="btn pri" href="#/r/plan/${step+1}">הבא ${ic('fwd')}</a>`
                      : `<span class="chip st-done" style="font-size:14px;padding:6px 14px">${ic('check')} התוכנית אושרה על ידי אבי פרץ ב-14.10</span>`;
  return `
  <div class="page-h"><div><h1>התוכנית שלי</h1><p>${esc(me.role)} · ${esc(SCHOOL.name)} · תשפ״ז · נשמר אוטומטית</p></div></div>
  ${steps}
  <div class="card pad">${body}</div>
  <div class="step-foot" style="margin-top:14px">${prev}${next}</div>`;
}

function eventCard(e, open){
  const past = isPast(e), d = pd(e.d), tasks = e.tasks || [];
  const done = tasks.filter(t=>t.done).length;
  const range = e.d2 ? `${fmtD(e.d)}–${fmtD(e.d2)}` : `יום ${HE_DAYS[d.getUTCDay()]}, ${fmtD(e.d)}`;
  const sub = past
    ? (e.report ? (e.report.happened ? `התקיים · ${e.report.count} השתתפו` : 'לא התקיים') : '<b style="color:var(--amber)">מחכה לדיווח קצר</b>')
    : `${range} · ${esc(e.who)}${tasks.length?` · ${done}/${tasks.length} משימות`:''}`;
  return `<div class="ev ${open?'open':''}" id="ev-${e.id}">
    <button class="ev-h" data-ev>
      <span class="ev-day ${past?'past':''}"><b>${d.getUTCDate()}</b><span>${monthOf(e.d)}</span></span>
      <span class="bd"><span class="tt">${esc(e.t)}</span><div class="ds">${sub}</div></span>
      ${e.approval==='pending'?`<span class="chip st-risk">תקציב ממתין</span>`:''}
      ${ic('chev','chev')}
    </button>
    <div class="ev-b">
      ${tasks.length ? `<div class="prog" style="margin:10px 0 4px"><span>${done}/${tasks.length} סגורות</span><div class="bar"><i style="width:${tasks.length?Math.round(done/tasks.length*100):0}%;background:var(--green)"></i></div></div>` : ''}
      ${tasks.map((t,i)=>{
        const late = !t.done && t.due < TODAY;
        return `<div class="task ${t.done?'done':''}" data-toggle data-ev="${e.id}" data-ti="${i}"><span class="ck"><svg viewBox="0 0 24 24">${I.check}</svg></span>
          <div class="bd"><div class="tt">${esc(t.t)}</div><div class="ow"><b>${esc(t.ow)}</b> · ${esc(t.owr)} · עד ${fmtD(t.due)}
          ${late?`<span class="chip st-late">באיחור</span>`:''}</div></div>
          ${!t.done && t.owr!=='אני' ? `<button class="btn sm ghost" data-act="nudge" data-who="${esc(t.ow)}" title="תזכורת">${ic('bell')}</button>`:''}</div>`;}).join('')}
      ${!past ? `<div class="remind">${ic('mail')} תזכורת אוטומטית במייל לכל אחראי/ת: 7 ימים לפני המועד שלו/ה ויום לפני. ${e.obj?`האירוע מזין את היעד "${esc(findObj(e.obj).t)}".`:''}</div>
                 <button class="btn sm" style="margin-top:10px">${ic('plus')} הוספת משימה ואחראי/ת</button>` : ''}
      ${past && e.report ? `<div class="remind">${ic('check')} הדיווח נכנס ליעדים. ${e.report.count} משתתפים.</div>` : ''}
    </div></div>`;
}

let evFilter = 'next';
function rEvents(){
  const P = PLANS.hevrati;
  const list = P.events.filter(e => evFilter === 'next' ? !isPast(e) : isPast(e));
  if(evFilter === 'past') list.reverse();
  return `
  <div class="page-h"><div><h1>האירועים שלי</h1><p>כל אירוע עם מה שצריך ומי אחראי. התזכורות יוצאות לבד.</p></div></div>
  <div class="filters"><button data-evf="next" class="${evFilter==='next'?'on':''}">קרובים</button><button data-evf="past" class="${evFilter==='past'?'on':''}">עברו</button></div>
  ${list.map((e,i)=>eventCard(e, (openEv ? e.id===openEv : i===0))).join('')}`;
}
let openEv = null;

/* =========================================================
   המנהל (וגם המפקחת, לקריאה בלבד)
   ========================================================= */
function pHome(ro){
  const approved = STAFF.filter(s=>s.status==='approved').length;
  const objs = allObjectives(), okc = objs.filter(o=>o.st==='ok'||o.st==='done').length;
  const ev = allEvents(), monthEv = ev.filter(e=>e.d.startsWith('2027-01'));
  const planned = ev.reduce((a,e)=>a+(e.cost||0),0);
  const pendPlans = STAFF.filter(s=>s.status==='submitted');
  const pendBud = ev.filter(e=>e.approval==='pending');
  const lt = lateTasks(), lateObj = objs.filter(o=>o.st==='late'), drafts = STAFF.filter(s=>s.status==='draft');
  const ow = overloadWeeks();
  const soon = ev.filter(e=>!isPast(e) && daysTo(e.d) <= 16);
  const greet = ro ? `<h1>${esc(SCHOOL.name)}</h1><p>המבט של המנהל, אבי פרץ · נכון ל-12 בינואר</p>` : `<h1>שלום אבי</h1><p>יום שלישי, 12 בינואר · ${pendPlans.length+pendBud.length} מחכים לאישורך, ${lt.length+lateObj.length} מאחרים</p>`;
  const base = ro ? '#/s/dekel/' : '#/p/';
  return `
  <div class="page-h"><div>${greet}</div></div>
  <div class="grid g4">
    <div class="card kpi"><div class="n">${approved}<small>/${STAFF.length}</small></div><div class="l">תוכניות מאושרות</div></div>
    <div class="card kpi"><div class="n">${okc}<small>/${objs.length}</small></div><div class="l">יעדים בדרך או הושגו</div></div>
    <div class="card kpi ${lt.length+lateObj.length?'warn':''}"><div class="n">${lt.length+lateObj.length}</div><div class="l">דברים שמאחרים</div></div>
    <div class="card kpi"><div class="n">${Math.round(planned/SCHOOL.budget*100)}%</div><div class="l">מהתקציב מתוכנן (${shek(planned)})</div></div>
  </div>
  ${ow.map(w=>`<div class="alert a sec" style="margin-bottom:0">${ic('alert')}<div><b>עומס: ${w.items.length} אירועים בשבוע של ${fmtD(w.from)}.</b>
     ${w.items.map(e=>esc(e.t)+' ('+esc(staff(e.rid).role)+')').join(' · ')}. <a href="${base}calendar">ללוח השנה</a></div></div>`).join('')}
  <div class="grid g2 sec">
    <div class="card"><div style="padding:16px 18px 4px"><h2>${ic('check')} מחכה ${ro?'לאישור המנהל':'לאישור שלך'}</h2></div>
      ${pendPlans.map(s=>`<div class="todo"><div class="ic b">${ic('plan')}</div><div class="bd"><div class="tt">התוכנית של ${esc(s.name)}</div>
        <div class="ds">${esc(s.role)} · הוגשה ב-${fmtD(s.sent)} · ${PLANS[s.id].objectives.length} יעדים מדידים</div>
        ${ro?'':`<div class="ac"><button class="btn ok sm" data-act="approve">${ic('check')} אישור</button><button class="btn sm">צפייה והערה</button></div>`}</div></div>`).join('')}
      ${pendBud.map(e=>`<div class="todo"><div class="ic g">${ic('wallet')}</div><div class="bd"><div class="tt">תקציב: ${esc(e.t)} · ${shek(e.cost)}</div>
        <div class="ds">${esc(staff(e.rid).name)}, ${esc(staff(e.rid).role)} · האירוע ב-${fmtD(e.d)}</div>
        ${ro?'':`<div class="ac"><button class="btn ok sm" data-act="approve">${ic('check')} אישור</button><button class="btn sm">שאלה ל${esc(staff(e.rid).name.split(' ')[0])}</button></div>`}</div></div>`).join('')}
    </div>
    <div class="card"><div style="padding:16px 18px 4px"><h2>${ic('alert')} מה מאחר</h2></div>
      ${lt.map(({e,t})=>`<div class="todo"><div class="ic r">${ic('clock')}</div><div class="bd"><div class="tt">${esc(t.t)}</div>
        <div class="ds">${esc(t.ow)} (${esc(t.owr)}) · היה אמור עד ${fmtD(t.due)} · ל${esc(e.t)} של ${esc(staff(e.rid).name)}</div>
        ${ro||t.owr==='מנהל'?'':`<div class="ac"><button class="btn sm" data-act="nudge" data-who="${esc(t.ow)}">${ic('bell')} תזכורת</button></div>`}</div></div>`).join('')}
      ${lateObj.map(o=>`<div class="todo"><div class="ic a">${ic('target')}</div><div class="bd"><div class="tt">יעד לא עודכן: ${esc(o.t)}</div>
        <div class="ds">${esc(staff(o.rid).name)} · מועד הבדיקה היה ב${HE_MONTHS[+o.check.split('-')[1]-1]}</div></div></div>`).join('')}
      ${drafts.map(s=>`<div class="todo"><div class="ic a">${ic('plan')}</div><div class="bd"><div class="tt">התוכנית של ${esc(s.name)} עדיין בטיוטה</div>
        <div class="ds">${esc(s.role)} · נעצרה בצעד ${s.draftStep} מתוך 5</div></div></div>`).join('')}
    </div>
  </div>
  <div class="card pad sec"><h2>${ic('cal')} השבועיים הקרובים</h2>
    ${soon.map(e=>{ const s = staff(e.rid), tk = e.tasks||[], dn = tk.filter(t=>t.done).length;
      return `<div style="display:flex;gap:12px;align-items:center;margin-top:12px;flex-wrap:wrap"><span class="date">${fmtD(e.d)}</span>
        <span class="dot" style="background:${s.color}"></span><b style="flex:1;min-width:160px">${esc(e.t)}</b>
        <span class="small muted">${esc(s.name)}</span>${tk.length?`<span class="chip ${dn===tk.length?'st-done':'st-wait'}">${dn}/${tk.length} משימות</span>`:''}</div>`; }).join('')}
  </div>`;
}

function pGoals(ro){
  const objs = allObjectives();
  const threads = SCHOOL_GOALS.map(g => {
    const by = STAFF.map(s => ({ s, n:(PLANS[s.id].goals||[]).filter(x=>x.sg===g.id).length })).filter(x=>x.n);
    const ob = objs.filter(o=>o.sg===g.id);
    return { g, by, ob };
  });
  return `
  <div class="page-h"><div><h1>מפת המטרות</h1><p>3 המטרות של בית הספר, וכל בעלי התפקידים שמחוברים אליהן. כל חוט = מטרה בתוכנית של מישהו.</p></div></div>
  <div class="weave" id="weave">
    <svg class="threads" id="threads"></svg>
    <div class="people">${STAFF.map(s=>`<div class="person" data-p="${s.id}"><span class="av" style="background:${s.color};box-shadow:none;width:32px;height:32px;font-size:13px">${esc(initials(s.name))}</span>
      <div class="t"><b>${esc(s.name)}</b><span>${esc(s.role)}${s.status==='draft'?' · בטיוטה':''}</span></div></div>`).join('')}</div>
    <div class="goals-col">${threads.map(({g,by,ob})=>{
      const okc = ob.filter(o=>o.st==='ok'||o.st==='done').length, weak = by.length < 3;
      return `<div class="sgoal ${weak?'weak':''}" data-g="${g.id}">
        <div class="tt">${esc(g.title)}</div><div class="ds">${esc(g.desc)}</div>
        <div class="threads-l">${by.map(x=>`<span class="tl"><i style="background:${x.s.color}"></i>${esc(x.s.role)}${x.n>1?` · ${x.n} מטרות`:''}</span>`).join('')}</div>
        <div class="meta"><span>${ob.length} יעדים מדידים</span><span>${okc} בדרך או הושגו</span><span>${ob.length-okc} דורשים תשומת לב</span></div>
        <div class="lights" style="margin-top:8px">${ob.map(o=>`<i title="${esc(o.t)}" style="background:${ST_COLOR[o.st]}"></i>`).join('')}</div>
        ${weak?`<div class="warn">${ic('alert')}<span>רק ${by.length} בעלי תפקידים מחוברים למטרה הזו. ${ro?'':'אולי כדאי לבקש מהרכזת הפדגוגית או מרכז/ת החניכות לחבר אליה מטרה.'}</span></div>`:''}
      </div>`; }).join('')}</div>
  </div>
  <p class="small muted" style="margin-top:12px">מעבר עם העכבר על שם או על מטרה מדגיש את החוטים שלהם.</p>`;
}
function drawThreads(){
  const w = $('#weave'), svg = $('#threads');
  if(!w || !svg || getComputedStyle(svg).display === 'none') return;
  const wr = w.getBoundingClientRect(); let paths = '';
  STAFF.forEach(s => {
    const pe = w.querySelector(`[data-p="${s.id}"]`).getBoundingClientRect();
    (PLANS[s.id].goals||[]).forEach((g, k) => {
      const ge = w.querySelector(`[data-g="${g.sg}"]`).getBoundingClientRect();
      const x1 = pe.left - wr.left, y1 = pe.top - wr.top + pe.height/2 + (k-1)*5;
      const x2 = ge.right - wr.left, y2 = ge.top - wr.top + 26 + (STAFF.indexOf(s))*7;
      const mx = (x1 + x2)/2;
      paths += `<path data-p="${s.id}" data-g="${g.sg}" d="M${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}" stroke="${s.color}" ${s.status==='draft'?'stroke-dasharray="6 6"':''}/>`;
    });
  });
  svg.innerHTML = paths;
}

let objFilter = 'all';
function pObjectives(ro){
  const all = allObjectives();
  const F = [['all','הכול'],['attn','דורשים תשומת לב'],['ok','בדרך או הושגו'],['wait','טרם נמדדו']];
  const list = all.filter(o => objFilter==='all' || (objFilter==='attn' && ['risk','behind','late'].includes(o.st)) ||
     (objFilter==='ok' && ['ok','done'].includes(o.st)) || (objFilter==='wait' && o.st==='wait'));
  const cnt = k => all.filter(o => k==='all' || (k==='attn' && ['risk','behind','late'].includes(o.st)) || (k==='ok' && ['ok','done'].includes(o.st)) || (k==='wait' && o.st==='wait')).length;
  return `
  <div class="page-h"><div><h1>יעדים מדידים</h1><p>כל היעדים של כל בעלי התפקידים. המצב בפועל מתעדכן כשהם מזינים אותו במועד הבדיקה.</p></div></div>
  <div class="filters">${F.map(f=>`<button data-objf="${f[0]}" class="${objFilter===f[0]?'on':''}">${f[1]} · ${cnt(f[0])}</button>`).join('')}</div>
  <div class="card tbl-wrap"><table class="tbl resp"><thead><tr><th>מי</th><th>היעד</th><th>פתיחה</th><th>עכשיו</th><th>יעד</th><th>התקדמות</th><th>בדיקה</th><th>מצב</th></tr></thead><tbody>
  ${list.map(o=>{ const s = staff(o.rid), p = pct(o);
    return `<tr><td data-l="מי"><span class="role-tag"><span class="dot" style="background:${s.color}"></span>${esc(s.role)}</span></td>
      <td data-l="היעד"><b>${esc(o.t)}</b><div class="small muted">${esc(o.m)} · ${esc(SCHOOL_GOALS.find(g=>g.id===o.sg).title)}</div></td>
      <td class="num" data-l="פתיחה">${o.base}</td><td class="num" data-l="עכשיו">${o.actual||'—'}</td><td class="num" data-l="יעד" style="color:var(--accent)">${o.target}</td>
      <td data-l="התקדמות" style="min-width:110px"><div class="bar"><i style="width:${p==null?0:Math.round(p*100)}%;background:${ST_COLOR[o.st]}"></i></div></td>
      <td data-l="בדיקה"><span class="date">${HE_MONTHS[+o.check.split('-')[1]-1]}</span></td>
      <td data-l="מצב"><span class="chip st-${o.st}">${ST_LABEL[o.st]}</span></td></tr>`; }).join('')}
  </tbody></table></div>`;
}

function pCalendar(ro){
  const ev = allEvents(), ow = overloadWeeks();
  const months = [['2026-09','ספט׳'],['2026-10','אוק׳'],['2026-11','נוב׳'],['2026-12','דצמ׳'],['2027-01','ינו׳'],['2027-02','פבר׳'],['2027-03','מרץ'],['2027-04','אפר׳'],['2027-05','מאי'],['2027-06','יוני']];
  const heat = months.map(([k,l]) => { const n = ev.filter(e=>e.d.startsWith(k)).length;
    return `<div class="m ${n>=5?'h2':''} ${k==='2027-01'?'cur':''}"><b>${n}</b>${l}</div>`; }).join('');
  const loadDays = new Set();
  ow.forEach(w => { for(let i=0;i<7;i++){ const d = new Date(pd(w.from).getTime()+i*864e5); loadDays.add(d.toISOString().slice(0,10)); } });
  // ינואר 2027 — מתחיל ביום שישי
  const first = pd('2027-01-01'), lead = first.getUTCDay(); let cells = '';
  ['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ש׳'].forEach(d => cells += `<div class="dh">${d}</div>`);
  for(let i=0;i<lead;i++) cells += `<div class="d off"></div>`;
  for(let day=1; day<=31; day++){
    const key = '2027-01-' + String(day).padStart(2,'0');
    const es = ev.filter(e => e.d === key || (e.d2 && e.d <= key && e.d2 >= key));
    cells += `<div class="d ${key===TODAY?'today':''} ${loadDays.has(key)&&es.length?'load':''}"><span class="n">${day}</span>
      ${es.map(e=>`<span class="e" style="background:${staff(e.rid).color}" title="${esc(e.t)}">${esc(e.t)}</span>`).join('')}</div>`;
  }
  const rem = (lead + 31) % 7; if(rem) for(let i=rem;i<7;i++) cells += `<div class="d off"></div>`;
  return `
  <div class="page-h"><div><h1>לוח שנה</h1><p>כל האירועים מכל התוכניות במקום אחד. כל צבע = בעל/ת תפקיד.</p></div></div>
  <div class="card pad"><div class="sec-t" style="margin-top:0">אירועים לפי חודש</div><div class="heat">${heat}</div></div>
  ${ow.map(w=>`<div class="alert a sec">${ic('alert')}<div><b>שבוע עמוס: ${fmtD(w.from)}–${fmtD(new Date(pd(w.from).getTime()+6*864e5).toISOString().slice(0,10))}</b><br>
    ${w.items.map(e=>`${esc(e.t)} (${esc(staff(e.rid).name)})`).join(' · ')}<br>
    <span class="small">שלושה אירועים שמוציאים מורים ותלמידים מהשיעורים באותו שבוע. ${ro?'':'אפשר לבקש להזיז אחד מהם.'}</span></div></div>`).join('')}
  <div class="sec-t sec">ינואר 2027</div>
  <div class="cal">${cells}</div>
  <div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:12px">${STAFF.map(s=>`<span class="role-tag"><span class="dot" style="background:${s.color}"></span>${esc(s.role)}</span>`).join('')}</div>`;
}

function pBudget(ro){
  const ev = allEvents(), B = SCHOOL.budget;
  const spent = ev.filter(isPast).reduce((a,e)=>a+(e.cost||0),0);
  const pend = ev.filter(e=>e.approval==='pending').reduce((a,e)=>a+e.cost,0);
  const planned = ev.reduce((a,e)=>a+(e.cost||0),0);
  const rows = STAFF.map(s => { const es = ev.filter(e=>e.rid===s.id);
    return { s, sp:es.filter(isPast).reduce((a,e)=>a+(e.cost||0),0), pl:es.reduce((a,e)=>a+(e.cost||0),0) }; });
  const max = Math.max(...rows.map(r=>r.pl));
  return `
  <div class="page-h"><div><h1>תקציב</h1><p>התקציב נבנה מהאירועים שבתוכניות. אין טבלה נפרדת למלא.</p></div></div>
  <div class="grid g4">
    <div class="card kpi"><div class="n">${shek(B)}</div><div class="l">תקציב הפעילות השנתי</div></div>
    <div class="card kpi"><div class="n">${shek(planned)}</div><div class="l">מתוכנן בכל התוכניות</div></div>
    <div class="card kpi"><div class="n">${shek(spent)}</div><div class="l">נוצל באירועים שהתקיימו</div></div>
    <div class="card kpi"><div class="n">${shek(B-planned)}</div><div class="l">פנוי</div></div>
  </div>
  <div class="card pad sec"><h2>${ic('wallet')} לפי בעל/ת תפקיד</h2>
    <div style="display:flex;gap:16px;margin:8px 0 4px" class="small muted"><span class="role-tag"><span class="dot" style="background:var(--navy)"></span>נוצל</span><span class="role-tag"><span class="dot" style="background:#9DC3E0"></span>מתוכנן להמשך השנה</span></div>
    ${rows.map(r=>`<div class="bud-row"><span class="role-tag"><span class="dot" style="background:${r.s.color}"></span>${esc(r.s.role)}</span>
      <div class="stack" style="width:${Math.max(8,Math.round(r.pl/max*100))}%"><i style="width:${r.pl?Math.round(r.sp/r.pl*100):0}%;background:var(--navy)"></i><i style="flex:1;background:#9DC3E0"></i></div>
      <b style="text-align:left">${shek(r.pl)}</b></div>`).join('')}
  </div>
  ${pend ? `<div class="alert b sec">${ic('clock')}<div><b>${shek(pend)} מחכים לאישור${ro?' המנהל':' שלך'}</b> · ${ev.filter(e=>e.approval==='pending').map(e=>esc(e.t)).join(' · ')}</div></div>` : ''}`;
}

function pTeam(ro){
  return `
  <div class="page-h"><div><h1>הצוות</h1><p>מי הגיש תוכנית, מי עוד בטיוטה, וכמה יעדים ואירועים יש לכל אחד.</p></div></div>
  <div class="card tbl-wrap"><table class="tbl resp"><thead><tr><th>בעל/ת התפקיד</th><th>התוכנית</th><th>מטרות</th><th>יעדים</th><th>אירועים</th><th></th></tr></thead><tbody>
  ${STAFF.map(s=>{ const P = PLANS[s.id], st = PLAN_ST[s.status];
    const lab = ro && s.status==='submitted' ? 'ממתינה לאישור המנהל' : st[1];
    return `<tr><td data-l=""><div style="display:flex;gap:10px;align-items:center"><span class="av" style="background:${s.color};box-shadow:none;width:32px;height:32px;font-size:13px">${esc(initials(s.name))}</span>
      <div><b>${esc(s.name)}</b><div class="small muted">${esc(s.role)}</div></div></div></td>
      <td data-l="התוכנית"><span class="chip ${st[0]}">${lab}</span>${s.sent?`<div class="small muted">הוגשה ${fmtD(s.sent)}</div>`:`<div class="small muted">צעד ${s.draftStep} מתוך 5</div>`}</td>
      <td class="num" data-l="מטרות">${P.goals.length}</td><td class="num" data-l="יעדים">${P.objectives.length}</td><td class="num" data-l="אירועים">${P.events.length}</td>
      <td data-l="">${s.status==='draft'&&!ro?`<button class="btn sm" data-act="nudge" data-who="${esc(s.name)}">${ic('bell')} תזכורת</button>`:`<button class="btn sm ghost">${ic('eye')} צפייה</button>`}</td></tr>`; }).join('')}
  </tbody></table></div>`;
}

function pMail(){
  const ev = allEvents(), lt = lateTasks(), week = ev.filter(e=>!isPast(e) && daysTo(e.d) <= 12);
  return `
  <div class="page-h"><div><h1>המייל השבועי</h1><p>כך נראה המייל שאבי מקבל בכל יום ראשון בבוקר. אין צורך להיכנס למערכת כדי לדעת מה קורה.</p></div></div>
  <div class="mail">
    <div class="mh"><div><b>מאת:</b> מארג · ${esc(SCHOOL.name)}</div><div><b>נושא:</b> השבוע בבית הספר · 2 מחכים לאישורך, 3 מאחרים</div></div>
    <div class="mb">
      <h3>בוקר טוב אבי,</h3>
      <p>זה מה שמחכה השבוע. אפשר לאשר ולשלוח תזכורות ישירות מהקישורים.</p>
      <div class="box"><h4>מחכה לאישורך</h4><ul>
        ${STAFF.filter(s=>s.status==='submitted').map(s=>`<li>התוכנית של ${esc(s.name)} (${esc(s.role)})</li>`).join('')}
        ${ev.filter(e=>e.approval==='pending').map(e=>`<li>תקציב ${shek(e.cost)} ל${esc(e.t)}</li>`).join('')}</ul></div>
      <div class="box"><h4>אירועים השבוע והשבוע הבא</h4><ul>
        ${week.map(e=>`<li><b>${fmtD(e.d)}</b> ${esc(e.t)} · ${esc(staff(e.rid).name)}</li>`).join('')}</ul>
        <p class="small" style="color:var(--amber);margin:6px 0 0"><b>שבוע 17.1 עמוס:</b> שלושה אירועים באותו שבוע.</p></div>
      <div class="box"><h4>מאחר</h4><ul>
        ${lt.map(({t})=>`<li>${esc(t.t)} · ${esc(t.ow)} (${esc(t.owr)}), היה אמור עד ${fmtD(t.due)}</li>`).join('')}
        <li>היעד "ירידה בהיעדרויות" של מיכל לא עודכן מדצמבר</li></ul></div>
      <p style="margin-top:14px"><span class="btn pri">כניסה למארג</span></p>
    </div>
    <div class="foot">המייל נשלח אוטומטית בכל יום ראשון ב-7:30. אפשר לשנות את היום או לבטל בהגדרות.</div>
  </div>`;
}

/* =========================================================
   האחראי על משימה — יוסי, אב הבית
   ========================================================= */
let ownerDone = null;
function owner(){
  const e = findEvent('e4'), t = e.tasks[4];
  return `
  <div class="page-h"><div><h1>האחראי על משימה</h1><p>יוסי, אב הבית, לא נכנס למערכת. הוא מקבל מייל שבוע לפני המועד ויום לפני, ומסמן "בוצע" מהטלפון.</p></div></div>
  <div class="grid g2" style="align-items:start">
    <div>
      <div class="sec-t" style="margin-top:0">${ic('mail')} המייל שיוסי מקבל</div>
      <div class="mail">
        <div class="mh"><div><b>מאת:</b> נועה לוי דרך מארג</div><div><b>נושא:</b> משימה לשבוע המעורבות · עד ${fmtD(t.due)}</div></div>
        <div class="mb">
          <h3>היי יוסי,</h3>
          <p>ביום ראשון ${fmtD(e.d)} מתחיל <b>${esc(e.t)}</b>, ו-160 תלמידים יוצאים להתנדב בקהילה. תודה שאתה איתנו!</p>
          <div class="box"><h4>המשימה שלך</h4><p style="margin:0"><b>${esc(t.t)}</b><br>עד ${HE_DAYS[pd(t.due).getUTCDay()]}, ${fmtD(t.due)}</p></div>
          <p style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn ok" data-act="owner-done">${ic('check')} בוצע</button>
            <button class="btn" data-act="owner-help">צריך עזרה</button></p>
          <p class="small muted">שאלות? אפשר פשוט להשיב למייל הזה, והתשובה תגיע לנועה.</p>
        </div>
      </div>
    </div>
    <div>
      <div class="sec-t" style="margin-top:0">${ic('phone')} מה שנפתח בטלפון אחרי הלחיצה</div>
      <div class="phone"><div class="ph-h"><div style="display:flex;gap:8px;align-items:center">${logo(24)}<b>מארג</b></div>
        <div style="font-size:13px;opacity:.85;margin-top:4px">${esc(SCHOOL.name)}</div></div>
        <div class="ph-b" id="ph-b">${phoneBody(e,t)}</div></div>
    </div>
  </div>`;
}
function phoneBody(e,t){
  if(ownerDone === 'done') return `<div style="text-align:center;padding:26px 6px"><div style="width:58px;height:58px;border-radius:50%;background:var(--green);display:grid;place-items:center;margin:0 auto 12px;color:#fff">${ic('check')}</div>
    <h3>תודה יוסי!</h3><p class="muted" style="margin-top:6px">נועה קיבלה עדכון שהמשימה בוצעה. במסך שלה המשימה כבר מסומנת.</p></div>`;
  if(ownerDone === 'help') return `<div style="padding:8px 2px"><h3 style="font-size:17px">מה צריך?</h3>
    <div class="field" style="margin-top:10px"><textarea rows="3" placeholder="למשל: ההגברה בתיקון, אפשר עד יום שני?"></textarea></div>
    <button class="btn pri" style="width:100%" data-act="owner-send">${ic('send')} שליחה לנועה</button></div>`;
  return `<div class="card pad" style="box-shadow:none"><div class="small muted">המשימה שלך</div><b style="font-size:16px">${esc(t.t)}</b>
    <div class="small muted" style="margin-top:4px">${esc(e.t)} · עד ${fmtD(t.due)}</div></div>
    <button class="btn ok" style="width:100%;margin-top:12px;padding:14px" data-act="owner-done">${ic('check')} בוצע</button>
    <button class="btn" style="width:100%;margin-top:8px" data-act="owner-help">צריך עזרה / לא אספיק</button>
    <p class="small muted" style="margin-top:10px;text-align:center">בלי סיסמה. הקישור אישי למשימה הזו.</p>`;
}

/* =========================================================
   המפקחת
   ========================================================= */
function sSchools(){
  const objs = allObjectives(), lt = lateTasks().length + objs.filter(o=>o.st==='late').length;
  const appr = STAFF.filter(s=>s.status==='approved').length;
  return `
  <div class="page-h"><div><h1>בתי הספר שלי</h1><p>${SUP_SCHOOLS.length} בתי ספר · בפיילוט רק ${esc(SCHOOL.name)} עובד עם מארג</p></div></div>
  <div class="grid g3">
    <div class="card kpi"><div class="n">1<small>/${SUP_SCHOOLS.length}</small></div><div class="l">בתי ספר במארג</div></div>
    <div class="card kpi"><div class="n">${appr}<small>/${STAFF.length}</small></div><div class="l">תוכניות מאושרות בבתי הספר שלי</div></div>
    <div class="card kpi ${lt?'warn':''}"><div class="n">${lt}</div><div class="l">דברים שמאחרים</div></div>
  </div>
  <div class="card sec">
    ${SUP_SCHOOLS.map(sc => sc.pilot ? `
      <a class="school" href="#/s/dekel/home">
        <div><div class="tt">${esc(sc.name)}</div><span class="chip st-ok">פיילוט · פעיל</span></div>
        <div class="c2"><div class="small muted">תוכניות</div><b>${appr} מאושרות מתוך ${STAFF.length}</b></div>
        <div class="c3"><div class="small muted">יעדים (${objs.length})</div><div class="lights">${objs.map(o=>`<i title="${esc(o.t)}" style="background:${ST_COLOR[o.st]}"></i>`).join('')}</div></div>
        <div class="c4"><div class="small muted">מאחר</div><b style="color:var(--red)">${lt} פריטים</b></div>
        <div class="c5" style="color:var(--text3)">${ic('fwd')}</div>
      </a>` : `
      <div class="school off"><div><div class="tt">${esc(sc.name)}</div><span class="chip st-wait">טרם הצטרף</span></div>
        <div class="c2 small">—</div><div class="c3 small">—</div><div class="c4 small">—</div><div class="c5"></div></div>`).join('')}
  </div>
  <div class="alert b sec">${ic('eye')}<div>לחיצה על בית ספר פותחת את כל המסכים של המנהל: מפת המטרות, יעדים, לוח שנה, תקציב וצוות. <b>לקריאה בלבד.</b>
    לביקור בבית הספר מגיעים עם תמונת מצב מוכנה. בהמשך זה יכול להיכנס כלשונית ב"הבית של המפקח".</div></div>`;
}

/* ---------- אירועים ---------- */
function bind(){
  const m = $('#main');
  m.querySelectorAll('[data-role]').forEach(b => b.onclick = () => { loginState.role = b.dataset.role; route(); });
  m.querySelectorAll('[data-ev]').forEach(b => { if(b.tagName === 'BUTTON') b.onclick = () => b.closest('.ev').classList.toggle('open'); });
  m.querySelectorAll('.task[data-toggle]').forEach(r => r.onclick = ev => {
    if(ev.target.closest('button')) return;
    r.classList.toggle('done');
    if(r.dataset.ev){ const t = findEvent(r.dataset.ev).tasks[+r.dataset.ti]; t.done = !t.done; toast(t.done ? `סומן כבוצע. ${t.owr==='אני'?'':t.ow+' לא יקבל/תקבל עוד תזכורות.'}` : 'סומן כפתוח'); }
  });
  m.querySelectorAll('[data-pick]').forEach(sp => sp.onclick = () => { sp.parentNode.querySelectorAll('span').forEach(x=>x.classList.remove('on')); sp.classList.add('on'); });
  m.querySelectorAll('[data-evf]').forEach(b => b.onclick = () => { evFilter = b.dataset.evf; openEv = null; route(); });
  m.querySelectorAll('[data-objf]').forEach(b => b.onclick = () => { objFilter = b.dataset.objf; route(); });
  m.querySelectorAll('[data-open]').forEach(a => a.onclick = () => { openEv = a.dataset.open; evFilter = 'next'; });
  m.querySelectorAll('[data-act]').forEach(b => b.onclick = () => act(b.dataset.act, b));
  m.querySelectorAll('.person,.sgoal').forEach(el => {
    el.onmouseenter = () => { const w = $('#weave'); w.classList.add('hl');
      const k = el.dataset.p ? `[data-p="${el.dataset.p}"]` : `[data-g="${el.dataset.g}"]`;
      w.querySelectorAll('svg path' + k).forEach(p => p.classList.add('on')); };
    el.onmouseleave = () => { const w = $('#weave'); w.classList.remove('hl'); w.querySelectorAll('svg path.on').forEach(p=>p.classList.remove('on')); };
  });
  if($('#weave')) requestAnimationFrame(drawThreads);
  const g = $('#r-home-grid'); if(g && innerWidth < 900) g.style.gridTemplateColumns = '1fr';
}
function act(a, b){
  if(a === 'login-send'){ loginState.step = 2; return route(); }
  if(a === 'login-go'){ const r = loginState.role; loginState.step = 1;
    location.hash = r === 'menahel' ? '#/p/home' : r === 'sup' ? '#/s/schools' : '#/r/home';
    if(r !== 'menahel' && r !== 'sup' && r !== 'hevrati') setTimeout(()=>toast('במוקאפ כל בעלי התפקידים רואים את המסך של נועה'), 300);
    return; }
  if(a === 'nudge') return toast(`נשלחה תזכורת במייל ל${b.dataset.who}`);
  if(a === 'approve'){ const row = b.closest('.todo'); row.style.opacity = .45; b.parentNode.innerHTML = `<span class="chip st-done">${ic('check')} אושר · נשלחה הודעה</span>`; return; }
  if(a === 'upd-h2'){
    const v = $('#in-h2').value.trim(); if(!v) return toast('כתבי את המספר שיצא בשאלון');
    const o = findObj('h2'); o.actual = /%$/.test(v) ? v : v + '%';
    const p = pct(o); o.st = p >= 1 ? 'done' : p >= .4 ? 'ok' : 'risk'; o.due = false;
    $('#todo-h2').innerHTML = `<div class="ic g">${ic('check')}</div><div class="bd"><div class="tt">עודכן: ${esc(o.t)} = ${esc(o.actual)}</div>
      <div class="ds">מצב: <span class="chip st-${o.st}">${ST_LABEL[o.st]}</span> · אבי רואה את זה במסך היעדים</div></div>`;
    return;
  }
  if(a === 'rep-yes'){ $('#rep-e3').innerHTML = `<span>כמה השתתפו?</span><input id="in-e3" inputmode="numeric" placeholder="למשל 240"><button class="btn pri sm" data-act="rep-save">שמירה</button>`;
    $('#rep-e3').querySelector('[data-act]').onclick = () => act('rep-save'); return; }
  if(a === 'rep-no' || a === 'rep-save'){
    const n = a === 'rep-save' ? (+($('#in-e3').value) || 0) : 0;
    findEvent('e3').report = { happened: a === 'rep-save', count:n };
    $('#todo-e3').innerHTML = `<div class="ic g">${ic('check')}</div><div class="bd"><div class="tt">תודה! הדיווח על מסיבת חנוכה נשמר</div><div class="ds">${a==='rep-save'?n+' משתתפים. ':''}הנתון נכנס ליעדים שלך.</div></div>`;
    return;
  }
  if(a === 'owner-done' || a === 'owner-help'){ ownerDone = a === 'owner-done' ? 'done' : 'help';
    const e = findEvent('e4'), t = e.tasks[4]; if(ownerDone === 'done') t.done = true;
    $('#ph-b').innerHTML = phoneBody(e, t); bindPhone(); return; }
  if(a === 'owner-send'){ toast('נשלח לנועה. היא תחזור אליך.'); ownerDone = null; const e = findEvent('e4'); $('#ph-b').innerHTML = phoneBody(e, e.tasks[4]); bindPhone(); }
}
function bindPhone(){ $('#ph-b').querySelectorAll('[data-act]').forEach(b => b.onclick = () => act(b.dataset.act, b)); }

addEventListener('hashchange', route);
addEventListener('resize', () => { if($('#weave')) drawThreads(); });
route();
})();
