// Extras: appearance settings, time-of-day sky, prayer timeline, Friday mode, nearby mosques,
// distance to Makkah, and zakat fitrah rates. Reads data the main app publishes on window.APP.
(() => {
  const $ = id => document.getElementById(id);
  const TZ = 'Asia/Kuala_Lumpur';
  const store = {
    get(k){ try{ return JSON.parse(localStorage.getItem(k)); }catch(e){ return null; } },
    set(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
  };
  const fmt = d => d.toLocaleTimeString('en-MY',{hour:'numeric',minute:'2-digit',hour12:true,timeZone:TZ});
  const addMin = (d,m) => new Date(d.getTime()+m*60000);
  const html = document.documentElement;

  const css = document.createElement('style');
  css.textContent = `
    .tl .tlh{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px}
    .tl .tlh b{font-size:15px} .tl .tlh span{font-size:12px;color:var(--mut)}
    .tlbar{position:relative;height:14px;border-radius:7px;background:var(--line);overflow:visible}
    .tlseg{position:absolute;top:0;bottom:0;border-radius:7px}
    .tlnow{position:absolute;top:-5px;width:4px;height:24px;border-radius:2px;background:var(--txt);box-shadow:0 0 0 3px var(--card);transform:translateX(-2px);transition:left 1s linear}
    .tllab{position:relative;height:30px;margin-top:6px;font-size:10.5px;color:var(--mut)}
    .tllab span{position:absolute;transform:translateX(-50%);text-align:center;white-space:nowrap;line-height:1.25}
    .tllab span b{display:block;color:var(--txt);font-size:11px}
    .fri{background:linear-gradient(135deg,var(--hl),var(--card2));border-color:var(--acc)}
    .fri .fh{font-size:13px;color:var(--acc);font-weight:800;letter-spacing:1px;text-transform:uppercase}
    .fri .fbig{font-size:24px;font-weight:800;margin-top:4px}
    .fri ul{list-style:none;margin-top:10px}
    .fri li{display:flex;gap:10px;align-items:center;padding:7px 0;font-size:14px;border-top:1px solid var(--line)}
    .fri li input{width:20px;height:20px;accent-color:var(--ok);flex-shrink:0}
    .fri li.done span{text-decoration:line-through;opacity:.6}
    .mq b{font-size:15px} .mq .row3{display:flex;gap:8px;margin-top:10px}
    .mq .row3 a{flex:1;text-decoration:none;text-align:center;border-radius:12px;padding:10px 4px;background:var(--line);color:var(--txt);font-weight:600;font-size:14px}
    .mk{margin-top:14px;padding-top:12px;border-top:1px solid var(--line);display:flex;gap:12px;align-items:center}
    .mk svg{width:120px;height:64px;flex-shrink:0}
    .mk b{font-size:20px;display:block} .mk span{font-size:12px;color:var(--mut);line-height:1.4}
    .zk table{font-size:13px;table-layout:auto} .zk td,.zk th{text-align:left;padding:7px 4px;white-space:nowrap} .zk td:first-child{white-space:normal;width:auto} .zk td:not(:first-child),.zk th:not(:first-child){text-align:right}
    .zk tr.mine td{background:var(--hl);font-weight:700;color:var(--acc)}
    .zk .big{font-size:22px;font-weight:800;color:var(--acc)}
  `;
  document.head.appendChild(css);

  // ---------------- Appearance: theme + text size ----------------
  const mq = window.matchMedia ? matchMedia('(prefers-color-scheme: light)') : null;
  function applyTheme(){
    const pref = store.get('theme') || 'auto';
    const t = pref==='auto' ? (mq && mq.matches ? 'light' : 'dark') : pref;
    html.dataset.theme = t;
    const meta = document.querySelector('meta[name=theme-color]'); if(meta) meta.content = t==='light' ? '#f4f1e8' : '#0b1f1a';
    document.querySelectorAll('#themeSeg button').forEach(b=>b.classList.toggle('on', b.dataset.v===pref));
  }
  function applySize(){
    const z = store.get('zoom') || '1';
    document.body.style.zoom = z;
    document.querySelectorAll('#sizeSeg button').forEach(b=>b.classList.toggle('on', b.dataset.v===String(z)));
  }
  if(mq && mq.addEventListener) mq.addEventListener('change', applyTheme);
  $('setBtn').onclick = () => { $('setPanel').classList.toggle('hide'); $('zonePanel').classList.add('hide'); };
  $('setDone').onclick = () => $('setPanel').classList.add('hide');
  document.querySelectorAll('#themeSeg button').forEach(b=>b.onclick=()=>{ store.set('theme', b.dataset.v); applyTheme(); });
  document.querySelectorAll('#sizeSeg button').forEach(b=>b.onclick=()=>{ store.set('zoom', b.dataset.v); applySize(); });
  applyTheme(); applySize();

  // ---------------- Time-of-day sky ----------------
  function applySky(){
    const t = window.APP && APP.today; if(!t) return;
    const now = new Date(); let sky='night';
    if(now >= t.fajr && now < addMin(t.syuruk,45)) sky='dawn';
    else if(now >= addMin(t.syuruk,45) && now < t.asr) sky='day';
    else if(now >= t.asr && now < addMin(t.maghrib,-25)) sky='afternoon';
    else if(now >= addMin(t.maghrib,-25) && now < t.isha) sky='sunset';
    if(html.dataset.sky!==sky) html.dataset.sky = sky;
  }

  // ---------------- Prayer timeline ----------------
  const SEG = [['fajr','syuruk','Fajr','#5b7bd5'],['syuruk','dhuhr','Morning','#3a7f7a'],['dhuhr','asr','Dhuhr','#e8c66a'],['asr','maghrib','Asr','#d9963f'],['maghrib','isha','Maghrib','#c2603a']];
  // Spread labels so neighbours never overlap (min 15% apart, kept inside the bar).
  function labelPos(t,pct){
    const L=[['fajr','Fajr'],['dhuhr','Dhuhr'],['asr','Asr'],['maghrib','Mgrb'],['isha','Isha']].map(([k,l])=>[k,l,pct(t[k])]);
    const GAP=15; L[L.length-1][2]=Math.min(93,L[L.length-1][2]);
    for(let i=L.length-2;i>=0;i--) L[i][2]=Math.min(L[i][2], L[i+1][2]-GAP);
    L[0][2]=Math.max(7,L[0][2]); for(let i=1;i<L.length;i++) L[i][2]=Math.max(L[i][2], L[i-1][2]+GAP);
    return L;
  }
  function renderTimeline(){
    const t = window.APP && APP.today, box=$('timeline'); if(!t||!box) return;
    box.classList.remove('hide');
    const start=t.fajr.getTime(), end=t.isha.getTime(), span=end-start, now=Date.now();
    const pct = d => Math.max(0,Math.min(100,(d.getTime()-start)/span*100));
    let cur='Night'; for(const [a,b,n] of SEG){ if(now>=t[a]&&now<t[b]) cur=n==='Morning'?'Morning (no fardhu)':n+' time'; }
    if(now>=end && now< end+6*3600e3) cur='Isha time';
    if(!box.dataset.built){
      box.innerHTML = `<div class="tlh"><b>Today</b><span id="tlCur"></span></div>
        <div class="tlbar">${SEG.map(([a,b,n,c])=>`<div class="tlseg" style="left:${pct(t[a])}%;width:${pct(t[b])-pct(t[a])}%;background:${c};opacity:.85"></div>`).join('')}<div class="tlnow" id="tlNow"></div></div>
        <div class="tllab">${labelPos(t,pct).map(([k,l,x])=>`<span style="left:${x}%"><b>${l}</b>${fmt(t[k]).replace(/\s?[ap]\.?m\.?/i,'')}</span>`).join('')}</div>`;
      box.dataset.built='1';
    }
    $('tlNow').style.left = (now<start||now>end ? (now<start?0:100) : pct(new Date(now)))+'%';
    $('tlCur').textContent = cur;
  }

  // ---------------- Friday mode (from Thursday Maghrib to Friday Maghrib) ----------------
  const FRI_TASKS = ['Read Surah Al-Kahf','Mandi sunat Jumaat (bath)','Clean clothes and perfume (men)','Go to the mosque early','Send plenty of selawat','Make doa in the last hour before Maghrib'];
  function renderFriday(){
    const t = window.APP && APP.today, box=$('friCard'); if(!t||!box) return;
    const now = new Date();
    const dow = Number(new Intl.DateTimeFormat('en-US',{weekday:'short',timeZone:TZ}).format(now)==='Fri' ? 5 :
                new Intl.DateTimeFormat('en-US',{weekday:'short',timeZone:TZ}).format(now)==='Thu' ? 4 : 0);
    const isFriWindow = (dow===4 && now>=t.maghrib) || (dow===5 && now<t.maghrib);
    if(!isFriWindow){ box.classList.add('hide'); return; }
    box.classList.remove('hide');
    const key = 'fri:'+new Intl.DateTimeFormat('en-CA',{timeZone:TZ}).format(dow===4?addMin(now,24*60):now);
    const done = store.get(key) || [];
    let head='', big='';
    if(dow===4){ head='Malam Jumaat'; big='Friday starts tonight'; }
    else if(now < t.dhuhr){ const s=Math.floor((t.dhuhr-now)/1000); head='Jumaat Mubarak'; big=`Jumaat in ${Math.floor(s/3600)}h ${String(Math.floor(s%3600/60)).padStart(2,'0')}m`; }
    else { head='Jumaat Mubarak'; big='Blessed Friday'; }
    const list = FRI_TASKS.map((x,i)=>`<li class="${done.includes(i)?'done':''}"><input type="checkbox" data-i="${i}" ${done.includes(i)?'checked':''}><span>${x}</span></li>`).join('');
    const sig = head+big+done.join(',');
    if(box.dataset.sig===sig) return; box.dataset.sig=sig;
    box.innerHTML = `<div class="fh">${head}</div><div class="fbig">${big}</div>
      ${dow===5&&now<t.dhuhr?`<div class="sub">Zohor time ${fmt(t.dhuhr)}. Khutbah starts earlier; check your mosque.</div>`:''}
      <ul>${list}</ul><button class="pri" id="kahfBtn" style="width:100%;margin-top:10px">Read Al-Kahf now</button>`;
    box.querySelectorAll('input').forEach(c=>c.onchange=()=>{ const i=+c.dataset.i; const d=new Set(store.get(key)||[]); c.checked?d.add(i):d.delete(i); store.set(key,[...d]); box.dataset.sig=''; renderFriday(); });
    $('kahfBtn').onclick = () => { APP.showTab('guide'); window.GUIDE && GUIDE.openSurah('18'); };
  }

  // ---------------- Nearby mosques ----------------
  function renderMosques(){
    const box=$('mosqueCard'); if(!box) return;
    const lat=APP.lat, lng=APP.lng;
    if(lat==null){ box.classList.add('hide'); return; }
    box.classList.remove('hide'); box.classList.add('mq');
    const ll=`${lat.toFixed(5)},${lng.toFixed(5)}`;
    box.innerHTML = `<b>🕌 Nearby mosques</b><div class="sub">Opens your maps app searching around your location.</div>
      <div class="row3"><a href="https://maps.apple.com/?q=masjid&sll=${ll}&z=14" target="_blank" rel="noopener">Apple Maps</a>
      <a href="https://www.google.com/maps/search/masjid/@${ll},14z" target="_blank" rel="noopener">Google Maps</a>
      <a href="https://waze.com/ul?q=masjid&ll=${ll}" target="_blank" rel="noopener">Waze</a></div>`;
  }

  // ---------------- Distance to Makkah ----------------
  function renderMakkah(){
    const box=$('makkahCard'); if(!box || APP.lat==null) return;
    const R=6371, r=x=>x*Math.PI/180, a={lat:APP.lat,lng:APP.lng}, b={lat:21.4225,lng:39.8262};
    const h=Math.sin(r(b.lat-a.lat)/2)**2+Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(r(b.lng-a.lng)/2)**2;
    const km=2*R*Math.asin(Math.sqrt(h));
    box.innerHTML = `<div class="mk"><svg viewBox="0 0 120 64" aria-hidden="true">
        <path d="M110 46 Q60 -6 12 40" fill="none" stroke="var(--acc)" stroke-width="2" stroke-dasharray="4 4"/>
        <circle cx="110" cy="46" r="5" fill="var(--ok)"/><rect x="5" y="34" width="13" height="13" rx="2" fill="#111" stroke="var(--acc)" stroke-width="1.5"/><rect x="5" y="37" width="13" height="2.5" fill="var(--acc)"/>
        <text x="110" y="61" font-size="9" text-anchor="middle" fill="var(--mut)">You</text><text x="1" y="60" font-size="9" fill="var(--mut)">Makkah</text></svg>
      <div><b>${Math.round(km).toLocaleString('en-MY')} km</b><span>to the Kaaba as the crow flies, heading ${APP.qibla?APP.qibla.toFixed(0)+'°':''} from North (west-northwest).</span></div></div>`;
  }

  // ---------------- Zakat fitrah (Ramadan 1447H / 2026) ----------------
  // Minimum rate first, then optional higher rates by rice type, as announced by each state body.
  const ZAKAT = [
    ['JHR','Johor',[8,10,20]], ['KDH','Kedah',[9,15,23]], ['KTN','Kelantan',[10,22]], ['MLK','Melaka',[8,15,22]],
    ['NGS','Negeri Sembilan',[7.5,12,22]], ['PHG','Pahang',[8,14,21]], ['PNG','Pulau Pinang',[10,15,25]], ['PRK','Perak',[10,16,25]],
    ['PLS','Perlis',[9]], ['SBH','Sabah',[7.5,15]], ['SWK','Sarawak',[7.5]], ['SGR','Selangor',[8,16,25]],
    ['TRG','Terengganu',[10,20]], ['WLY','WP Kuala Lumpur, Putrajaya, Labuan',[8,15,25]],
  ];
  const rm = v => 'RM' + (Number.isInteger(v) ? v : v.toFixed(2));
  function renderZakat(){
    const box=$('zakatCard'); if(!box) return;
    const pre = (APP.zone||'').slice(0,3);
    const mine = ZAKAT.find(z=>z[0]===pre);
    box.classList.add('zk');
    box.innerHTML = `<div class="mhead"><b>Zakat fitrah</b><span class="sub">Ramadan 1447H / 2026</span></div>
      ${mine?`<p class="mn" style="font-size:14px">${mine[1]}: minimum <span class="big">${rm(mine[2][0])}</span> per person${mine[2].length>1?`, or ${mine[2].slice(1).map(rm).join(' / ')} if your household eats higher-grade rice (e.g. imported, fragrant or basmati)`:''}.</p>`:''}
      <table><thead><tr><th>State</th><th>Minimum</th><th>Higher</th></tr></thead><tbody>
      ${ZAKAT.map(z=>`<tr class="${z===mine?'mine':''}"><td>${z[1]}</td><td>${rm(z[2][0])}</td><td>${z[2].slice(1).map(rm).join(' · ')||'–'}</td></tr>`).join('')}
      </tbody></table>
      <p class="note">Each state sets its rate from the price of one gantang of the rice most people eat. Paying the minimum is valid; the higher rates match better rice. Pay before the Hari Raya prayer. Rates for Ramadan 1448H (2027) are announced around February 2027, so check your state zakat body then. Rates gathered from each state’s announcement as reported by Bernama, Berita Harian, Utusan, Kosmo, The Sun and Sarawak’s gazette; Negeri Sembilan’s top rate is reported as RM22 by The Sun and RM20 elsewhere.</p>`;
  }

  // ---------------- wiring ----------------
  function onData(){ applySky(); const tl=$('timeline'); if(tl) tl.dataset.built=''; renderTimeline(); renderFriday(); renderMosques(); renderMakkah(); renderZakat(); }
  document.addEventListener('appdata', onData);
  document.addEventListener('apptick', ()=>{ applySky(); renderTimeline(); renderFriday(); });
  renderZakat();
  if(window.APP && APP.today) onData();
})();
