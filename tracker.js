// Prayer tracker: tick off each fardhu prayer once its time has started, see the last 7 days and your streak.
// Saved on this phone only (localStorage "prayed" = { 'YYYY-MM-DD': ['fajr', ...] }).
(() => {
  const $ = id => document.getElementById(id);
  const TZ = 'Asia/Kuala_Lumpur';
  const P = [['fajr','Fajr'],['dhuhr','Dhuhr'],['asr','Asr'],['maghrib','Maghrib'],['isha','Isha']];
  const store = {
    get(k){ try{ return JSON.parse(localStorage.getItem(k)); }catch(e){ return null; } },
    set(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
  };
  const ymd = d => new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
  const fmt = d => d.toLocaleTimeString('en-MY',{hour:'numeric',minute:'2-digit',hour12:true,timeZone:TZ});
  const daysAgo = n => new Date(Date.now() - n*86400000);
  const log = () => store.get('prayed') || {};
  const doneOn = date => log()[date] || [];

  const css = document.createElement('style');
  css.textContent = `
    .trk .th{display:flex;justify-content:space-between;align-items:baseline}
    .trk .th b{font-size:15px} .trk .th span{font-size:12px;color:var(--mut)}
    .trk .pr{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-top:10px}
    .trk .pr button{display:flex;flex-direction:column;align-items:center;gap:3px;padding:9px 2px;border-radius:14px;font-size:12.5px;font-weight:700;line-height:1.2}
    .trk .pr button i{font-style:normal;width:26px;height:26px;border-radius:50%;border:2px solid var(--mut);display:flex;align-items:center;justify-content:center;font-size:15px}
    .trk .pr button small{font-weight:400;font-size:10.5px;color:var(--mut)}
    .trk .pr button.done{background:var(--hl)} .trk .pr button.done i{background:var(--ok);border-color:var(--ok);color:#fff}
    .trk .pr button.lock{opacity:.45}
    .trk .wk{display:grid;grid-template-columns:repeat(7,1fr);gap:5px;margin-top:12px;padding-top:10px;border-top:1px solid var(--line)}
    .trk .wk div{text-align:center;font-size:10.5px;color:var(--mut)}
    .trk .wk div b{display:block;margin:3px auto 0;width:28px;height:28px;border-radius:8px;line-height:28px;font-size:11.5px;color:var(--txt);background:var(--line)}
    .trk .wk div.full b{background:var(--ok);color:#fff}
    .trk .wk div.today{color:var(--acc);font-weight:700}
    .trk .ft{font-size:12.5px;color:var(--mut);margin-top:10px;display:flex;justify-content:space-between}
    .trk .ft b{color:var(--txt)}
  `;
  document.head.appendChild(css);

  function streak(){
    const l = log(); let n = 0;
    if((l[ymd(new Date())]||[]).length >= 5) n++;
    for(let i=1;i<400;i++){ if((l[ymd(daysAgo(i))]||[]).length >= 5) n++; else break; }
    return n;
  }
  function toggle(k){
    const l = log(), d = ymd(new Date());
    const cur = l[d] || [];
    l[d] = cur.includes(k) ? cur.filter(x=>x!==k) : [...cur, k];
    // keep about 3 months
    const cut = ymd(daysAgo(95)); Object.keys(l).forEach(x => { if(x < cut) delete l[x]; });
    store.set('prayed', l);
    if(navigator.vibrate) navigator.vibrate(15);
    sig = ''; render();
    if(window.APP && APP.sendPrayed) APP.sendPrayed();
  }
  window.APP = window.APP || {};
  window.APP.prayedToday = () => { const date = ymd(new Date()); return { date, keys: doneOn(date) }; };

  let sig = '';
  function render(){
    const t = window.APP && APP.today, box = $('trackCard'); if(!t || !box) return;
    const now = new Date(), date = ymd(now), done = doneOn(date);
    const open = P.map(([k]) => t[k] && t[k] <= now);
    const s = date + done.join() + open.join();
    if(s === sig) return; sig = s;
    const wk = [];
    for(let i=6;i>=0;i--){
      const d = daysAgo(i), key = ymd(d), n = doneOn(key).length;
      const lab = i===0 ? 'Today' : d.toLocaleDateString('en-GB',{weekday:'short',timeZone:TZ});
      wk.push(`<div class="${n>=5?'full':''} ${i===0?'today':''}">${lab}<b>${n}/5</b></div>`);
    }
    const week = [...Array(7)].reduce((a,_,i)=>a+doneOn(ymd(daysAgo(i))).length,0);
    const st = streak();
    box.innerHTML = `<div class="th"><b>Prayers today</b><span>${done.length} of 5 done</span></div>
      <div class="pr">${P.map(([k,l],i)=>`<button data-k="${k}" class="${done.includes(k)?'done':''} ${open[i]?'':'lock'}"><i>${done.includes(k)?'✓':''}</i>${l}<small>${t[k]?fmt(t[k]):''}</small></button>`).join('')}</div>
      <div class="wk">${wk.join('')}</div>
      <div class="ft"><span>Last 7 days: <b>${week}/35</b></span><span>Streak: <b>${st} ${st===1?'day':'days'}</b> of all 5</span></div>`;
    box.classList.remove('hide');
    box.querySelectorAll('.pr button').forEach((b,i) => b.onclick = () => {
      if(!open[i] && !done.includes(b.dataset.k)){ b.querySelector('small').textContent = 'Not time yet'; return; }
      toggle(b.dataset.k);
    });
  }
  document.addEventListener('appdata', () => { sig=''; render(); });
  document.addEventListener('apptick', render);
})();
