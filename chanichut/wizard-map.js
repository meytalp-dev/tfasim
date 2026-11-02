/* חיפוש עסקים במפה לאשף מציאת המעסיקים. הועתק מ-app/wizard.js (בלי המסכים).
   מקור: OpenStreetMap בלבד. נשלחים למפה רק מיקום בית הספר וסוגי עסקים, אף פרט על תלמידים. */
(function (root) {
  'use strict';
  /* מגמה → סוגי עסקים במפה. regex על שם המגמה; הסדר חשוב (הראשון שמתאים) */
  var MG_MAP = [
    [/אוטו|מכונא|צמ"ה|רכב/, 'מוסכים ומרכזי שירות לרכב', ['shop=car_repair', 'shop=car', 'shop=tyres', 'shop=motorcycle_repair', 'craft=mechanic']],
    [/קירור|מיזוג/, 'מיזוג אוויר וקירור', ['craft=hvac', 'shop=appliance', 'craft=refrigeration']],
    [/חשמל/, 'חשמלאים וחנויות חשמל', ['craft=electrician', 'shop=electrical', 'shop=electronics', 'office=energy_supplier']],
    [/שיער|איפור|קוסמטיק/, 'מספרות, איפור וקוסמטיקה', ['shop=hairdresser', 'shop=beauty', 'shop=cosmetics']],
    [/קונדיט|אפי/, 'מאפיות וקונדיטוריות', ['shop=bakery', 'shop=pastry', 'shop=confectionery']],
    [/קולינר|טבח|סייע קולינרי/, 'מסעדות, בתי קפה ובתי מלון', ['amenity=restaurant', 'amenity=cafe', 'tourism=hotel', 'amenity=fast_food', 'shop=deli']],
    [/תיירות/, 'בתי מלון ותיירות', ['tourism=hotel', 'tourism=guest_house', 'office=travel_agent', 'tourism=attraction']],
    [/סייבר|הייטק|תכנות|תקשוב|סלולר|אתרים/, 'מחשבים, תקשורת והייטק', ['office=it', 'shop=computer', 'shop=mobile_phone', 'office=telecommunication', 'office=company']],
    [/שיווק|יוצרי תוכן|מדיה|קריאט|צילום|סאונד|צליל|הפקת/, 'פרסום, מדיה, צילום והפקה', ['office=advertising_agency', 'shop=photo', 'craft=photographer', 'amenity=studio', 'office=marketing']],
    [/לוגיס|מלאי|רכש|לוגיטק/, 'מחסנים, לוגיסטיקה וסיטונאות', ['shop=wholesale', 'office=logistics', 'building=warehouse', 'industrial=warehouse', 'office=courier']],
    [/ריתוך|אלומיניום|CNC|ייצור|מכטרוניק|מערכות תיכון|מערכות הנדסיות|אנרגיה/, 'מפעלים, מסגריות ותעשייה', ['craft=metal_construction', 'craft=welder', 'man_made=works', 'craft=carpenter', 'industrial=factory', 'office=engineer']],
    [/טיס|מטוס/, 'תעופה ותחזוקת כלי טיס', ['aeroway=hangar', 'aeroway=aerodrome', 'man_made=works']],
    [/ינקות/, 'מעונות וגנים', ['amenity=kindergarten', 'amenity=childcare']],
    [/אופטיק/, 'אופטיקאים', ['shop=optician']],
    [/שיניים/, 'מרפאות ומעבדות שיניים', ['amenity=dentist', 'healthcare=dentist']],
    [/תפיר|אופנה/, 'חייטות ואופנה', ['craft=tailor', 'shop=clothes', 'shop=fabric', 'craft=dressmaker']],
    [/חקלא|אקו/, 'חקלאות, משתלות וטבע', ['shop=garden_centre', 'shop=agrarian', 'place=farm', 'landuse=farmyard']],
    [/ספורט|כדורגל/, 'מרכזי ספורט וכושר', ['leisure=sports_centre', 'leisure=fitness_centre', 'leisure=stadium']],
    [/חילוץ|הצלה/, 'כיבוי, הצלה וביטחון', ['amenity=fire_station', 'emergency=ambulance_station', 'office=security']],
    [/בני|תחזוקת מבנים|סביבת אדם|עיצוב תעשייתי/, 'אדריכלות, נגרות ובנייה', ['office=architect', 'craft=carpenter', 'shop=furniture', 'craft=builder', 'shop=hardware']]
  ];
  var TAG_HE = { car_repair: 'מוסך', car: 'סוכנות רכב', tyres: 'צמיגים', motorcycle_repair: 'מוסך אופנועים', mechanic: 'מכונאות', hvac: 'מיזוג אוויר',
    appliance: 'מוצרי חשמל', refrigeration: 'קירור', electrician: 'חשמלאי', electrical: 'חנות חשמל', electronics: 'אלקטרוניקה', energy_supplier: 'אנרגיה',
    hairdresser: 'מספרה', beauty: 'קוסמטיקה', cosmetics: 'קוסמטיקה', bakery: 'מאפייה', pastry: 'קונדיטוריה', confectionery: 'ממתקים',
    restaurant: 'מסעדה', cafe: 'בית קפה', hotel: 'מלון', fast_food: 'מזון מהיר', deli: 'מעדנייה', guest_house: 'צימר / אכסניה', travel_agent: 'סוכנות נסיעות', attraction: 'אטרקציה',
    it: 'חברת מחשוב', computer: 'חנות מחשבים', mobile_phone: 'סלולר', telecommunication: 'תקשורת', company: 'חברה', advertising_agency: 'משרד פרסום',
    photo: 'צילום', photographer: 'צלם', studio: 'סטודיו', marketing: 'שיווק', wholesale: 'סיטונאות', logistics: 'לוגיסטיקה', warehouse: 'מחסן', courier: 'שליחויות',
    metal_construction: 'מסגרייה', welder: 'ריתוך', works: 'מפעל', carpenter: 'נגרייה', factory: 'מפעל', engineer: 'הנדסה', hangar: 'האנגר', aerodrome: 'שדה תעופה',
    kindergarten: 'גן ילדים', childcare: 'מעון', optician: 'אופטיקה', dentist: 'מרפאת שיניים', tailor: 'חייט', clothes: 'בגדים', fabric: 'בדים', dressmaker: 'תופרת',
    garden_centre: 'משתלה', agrarian: 'ציוד חקלאי', farm: 'משק', farmyard: 'משק', sports_centre: 'מרכז ספורט', fitness_centre: 'חדר כושר', stadium: 'אצטדיון',
    fire_station: 'תחנת כיבוי', ambulance_station: 'מד"א', security: 'אבטחה', architect: 'אדריכל', furniture: 'רהיטים', builder: 'קבלן', hardware: 'כלי עבודה' };
  var OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];

  function groupsFor(mgName) { var g = MG_MAP.filter(function (m) { return m[0].test(mgName); })[0]; return g ? { label: g[1], tags: g[2] } : { label: 'עסקים ומפעלים באזור', tags: ['man_made=works', 'office=company', 'industrial=factory'] }; }
  function km(a, b, c, d) { var R = 6371, x = (c - a) * Math.PI / 180, y = (d - b) * Math.PI / 180, h = Math.sin(x / 2) * Math.sin(x / 2) + Math.cos(a * Math.PI / 180) * Math.cos(c * Math.PI / 180) * Math.sin(y / 2) * Math.sin(y / 2); return 2 * R * Math.asin(Math.sqrt(h)); }
  /* "+972 39564235; 059…" → "03-9564235" (הראשון בלבד, בפורמט מקומי) */
  function phoneIL(p) {
    var d = String(p || '').split(/[;,/]/)[0].replace(/[^\d+]/g, '').replace(/^\+?972/, '0');
    if (!/^0\d{8,9}$/.test(d)) return String(p || '').split(/[;,/]/)[0].trim();
    return /^0[57]/.test(d) && d.length === 10 ? d.slice(0, 3) + '-' + d.slice(3) : d.slice(0, 2) + '-' + d.slice(2);
  }
  function norm(n) { return String(n || '').replace(/["'״׳\-–.,()]/g, '').replace(/\s+/g, ' ').trim(); }

  async function geocode(q) {
    var u = 'https://nominatim.openstreetmap.org/search?format=json&countrycodes=il&accept-language=he&limit=5&q=' + encodeURIComponent(q);
    var r = await fetch(u, { headers: { 'Accept': 'application/json' } });
    if (!r.ok) throw new Error('המפה לא זמינה כרגע');
    return (await r.json()).map(function (x) { return { lat: +x.lat, lon: +x.lon, label: x.display_name.split(',').slice(0, 3).join(',') }; });
  }
  async function fetchT(url, opts, ms) {
    var c = new AbortController(), t = setTimeout(function () { c.abort(); }, ms);
    try { return await fetch(url, Object.assign({ signal: c.signal }, opts)); } finally { clearTimeout(t); }
  }
  /* שני מקורות חינמיים של OpenStreetMap:
     1. Overpass — שאילתה אחת לכל הסוגים ברדיוס. מהיר, אבל השרת החינמי לפעמים עמוס ("at capacity").
     2. Nominatim — גיבוי: חיפוש לפי סוג עסק בתוך ריבוע סביב בית הספר, בקשה בשנייה (מדיניות השימוש שלהם). */
  async function search(loc, radiusKm, mgs, onStatus) {
    var tags = {}, label = {};
    mgs.forEach(function (mg) { var g = groupsFor(mg); g.tags.forEach(function (t) { tags[t] = 1; (label[t] = label[t] || []).push(mg); }); });
    var R = Math.round(radiusKm * 1000);
    var q = '[out:json][timeout:20];(' + Object.keys(tags).map(function (t) { var p = t.split('='); return 'nwr["' + p[0] + '"="' + p[1] + '"]["name"](around:' + R + ',' + loc.lat + ',' + loc.lon + ');'; }).join('') + ');out center tags 250;';
    var data = null;
    for (var i = 0; i < OVERPASS.length && !data; i++) {
      try { var r = await fetchT(OVERPASS[i] + '?data=' + encodeURIComponent(q), {}, 12000); if (r.ok) data = await r.json(); } catch (e) {}
    }
    if (!data) {
      onStatus && onStatus('המפה הראשית עמוסה. מחפש בדרך חלופית…');
      var alt = await nominatimSearch(loc, radiusKm, Object.keys(tags), onStatus);
      if (!alt.length && alt.failed) throw new Error('שירות המפה החינמי לא ענה. נסו שוב בעוד כמה דקות.');
      data = { elements: alt };
    }
    var seen = {};
    return (data.elements || []).map(function (e) {
      var t = e.tags || {}, lat = e.lat || (e.center && e.center.lat), lon = e.lon || (e.center && e.center.lon);
      var kv = Object.keys(tags).map(function (x) { return x.split('='); }).filter(function (p) { return t[p[0]] === p[1]; })[0] || ['', ''];
      var addr = [t['addr:street'] && (t['addr:street'] + (t['addr:housenumber'] ? ' ' + t['addr:housenumber'] : '')), t['addr:city']].filter(Boolean).join(', ');
      return { osm: e.type[0] + e.id, name: t['name:he'] || t.name, type: TAG_HE[kv[1]] || kv[1], mgs: label[kv.join('=')] || [],
        phone: phoneIL(t.phone || t['contact:phone'] || t['contact:mobile'] || ''), mail: t.email || t['contact:email'] || '', web: t.website || t['contact:website'] || '',
        addr: addr, lat: lat, lon: lon, dist: lat ? km(loc.lat, loc.lon, lat, lon) : 99 };
    }).filter(function (x) { if (!x.name || seen[norm(x.name)]) return false; seen[norm(x.name)] = 1; return x.dist <= radiusKm; })
      .sort(function (a, b) { return a.dist - b.dist; });
  }
  /* גיבוי: Nominatim מבין סוגי עסקים באנגלית ("car repair" = shop=car_repair). מחזיר באותו מבנה של Overpass */
  async function nominatimSearch(loc, radiusKm, tagList, onStatus) {
    var dLat = radiusKm / 111, dLon = radiusKm / (111 * Math.cos(loc.lat * Math.PI / 180));
    var vb = [loc.lon - dLon, loc.lat + dLat, loc.lon + dLon, loc.lat - dLat].map(function (v) { return v.toFixed(4); }).join(',');
    var out = [], fails = 0;
    for (var i = 0; i < tagList.length; i++) {
      var p = tagList[i].split('=');
      onStatus && onStatus('מחפש במפה… ' + (i + 1) + ' מתוך ' + tagList.length);
      try {
        var r = await fetchT('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=40&bounded=1&extratags=1&addressdetails=1&accept-language=he&countrycodes=il&viewbox=' + vb +
          '&q=' + encodeURIComponent(p[1].replace(/_/g, ' ')), {}, 15000);
        if (!r.ok) { fails++; continue; }
        (await r.json()).forEach(function (x) {
          if (x.category !== p[0] || x.type !== p[1] || !x.name) return;
          var a = x.address || {}, t = x.extratags || {};
          var tg = { name: x.name, phone: t.phone || t['contact:phone'] || '', website: t.website || t['contact:website'] || '', email: t.email || '' };
          tg[p[0]] = p[1];
          if (a.road) tg['addr:street'] = a.road; if (a.house_number) tg['addr:housenumber'] = a.house_number;
          tg['addr:city'] = a.city || a.town || a.village || '';
          out.push({ type: x.osm_type || 'node', id: x.osm_id, lat: +x.lat, lon: +x.lon, tags: tg });
        });
      } catch (e) { fails++; }
      await new Promise(function (res) { setTimeout(res, 1100); });   /* לכל היותר בקשה בשנייה */
    }
    out.failed = fails === tagList.length;
    return out;
  }
  /* נוסח פנייה — לפי סדנת "פניות יזומות" (הצעת ערך) */
  function pitch(o) {
    var hi = o.contact ? 'שלום ' + o.contact.split(' ')[0] + ',' : 'שלום רב,';
    return hi + '\n' +
      'שמי ' + o.me + ', רכז.ת החניכות ב' + o.school + '. אנחנו בית ספר להכשרה מקצועית של משרד העבודה, ותלמידי מגמת ' + o.mg + ' שלנו עובדים במקומות עבודה אמיתיים יום או יומיים בשבוע, כחלק מהלימודים.\n\n' +
      'אנחנו מחפשים מקום עבודה כמו ' + o.name + ' שיקלוט תלמיד.ה אחד.ת או שניים:\n' +
      '• עבורכם: ידיים עובדות ומוטיבציה, תלמיד.ה שכבר לומד.ת את המקצוע, ואפשרות להכשיר עובד.ת עתידי.ת לפי הדרך שלכם.\n' +
      '• מבית הספר: ליווי צמוד שלי לאורך כל השנה, נוכחות שמדווחת כל חודש, ותיאום ציפיות מסודר כבר מהיום הראשון.\n' +
      '• מה נבקש: תשלום לפי חוק, איש.ת צוות קבוע.ה שילווה את התלמיד.ה, ומשוב קצר פעמיים בשנה.\n\n' +
      'אשמח לשיחה של עשר דקות, או להגיע לביקור קצר. מתי נוח לך?\n\n' +
      'בתודה,\n' + o.me + '\nרכז.ת החניכות · ' + o.school;
  }
  root.WIZMAP = { groupsFor: groupsFor, geocode: geocode, search: search, km: km, norm: norm, pitch: pitch };
})(window);
