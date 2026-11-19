// Prayer notifications (Web Push through the Cloudflare Worker in /worker), plus
// the "What's new" card and patch notes. Reads the zone the main app publishes on window.APP.
(() => {
  const PUSH_URL = 'https://qiblat-solat-push.nuh-ihsan.workers.dev';
  const $ = id => document.getElementById(id);
  const store = {
    get(k){ try{ return JSON.parse(localStorage.getItem(k)); }catch(e){ return null; } },
    set(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
  };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const ROWS = [
    ['fajr','Fajr',true,true], ['syuruk','Fajr ends (sunrise)',false,true], ['dhuhr','Dhuhr',true,true],
    ['asr','Asr',true,true], ['maghrib','Maghrib',true,true], ['isha','Isha',true,true],
  ];
  const DEFAULT = { at:['fajr','dhuhr','asr','maghrib','isha'], pre:['fajr','syuruk','dhuhr','asr','maghrib','isha'], min:10 };
  const prefs = () => Object.assign({}, DEFAULT, store.get('nfPrefs') || {});

  const css = document.createElement('style');
  css.textContent = `
    .nf .nfrow{display:flex;align-items:center;gap:6px;padding:7px 0;border-top:1px solid var(--line);font-size:14px}
    .nf .nfrow span{flex:1}
    .nf .chip{padding:6px 10px;font-size:12.5px;border-radius:999px;min-width:68px}
    .nf .chip.on{background:var(--acc);color:var(--onacc)}
    .nf .chip.na{visibility:hidden}
    .nf .stat{font-size:13px;margin:4px 0 8px;color:var(--mut);line-height:1.5}
    .nf .stat b{color:var(--ok)}
    .nf .row{display:flex;gap:8px;margin-top:10px} .nf .row button{flex:1}
    .about{margin-top:14px;padding-top:12px;border-top:1px solid var(--line);font-size:13px;color:var(--mut);display:flex;justify-content:space-between;align-items:center}
    .pn h4{font-size:15px;margin:12px 0 4px} .pn h4 span{font-weight:400;color:var(--mut);font-size:12px;margin-left:6px}
    .pn ul{margin:0 0 0 18px;font-size:13.5px;line-height:1.5} .pn li{margin:3px 0}
    .wn{border:2px solid var(--acc)} .wn .wnh{display:flex;justify-content:space-between;align-items:baseline}
    .wn .wnh b{font-size:16px} .wn .wnh span{font-size:12px;color:var(--mut)}
    .wn ul{margin:8px 0 0 18px;font-size:14px;line-height:1.5}
    .wn .row{display:flex;gap:8px;margin-top:12px} .wn .row button{flex:1}
  `;
  document.head.appendChild(css);

  // ---------- settings panel sections ----------
  const panel = $('setPanel');
  const doneRow = $('setDone').parentNode;
  const box = document.createElement('div');
  box.innerHTML = `<label style="margin-top:14px">Prayer notifications</label><div class="nf" id="nfBody"></div>
    <div class="about"><span>Version <b id="verNo"></b></span><button id="pnBtn" style="padding:7px 12px;font-size:13px">Patch notes</button></div>
    <div class="pn hide" id="pnList"></div>`;
  panel.insertBefore(box, doneRow);
  $('verNo').textContent = window.APP_VERSION || '';
  $('pnBtn').onclick = () => { const l = $('pnList'); if(!l.innerHTML) l.innerHTML = notesHtml(window.PATCH_NOTES || []); l.classList.toggle('hide'); };

  function notesHtml(list){
    return list.map(n => `<h4>v${esc(n.v)}<span>${esc(fmtDate(n.date))}</span></h4><ul>${n.items.map(i=>`<li>${esc(i)}</li>`).join('')}</ul>`).join('');
  }
  function fmtDate(s){ const d = new Date(s+'T00:00:00'); return isNaN(d) ? s : d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}); }

  // ---------- What's new (once per version, for people who used an older version) ----------
  (function whatsNew(){
    const v = window.APP_VERSION, seen = store.get('seenVersion');
    if(!v || seen === v) return;
    const usedBefore = seen || store.get('lastZone') || store.get('zoneSetting');
    if(!usedBefore){ store.set('seenVersion', v); return; }
    const n = (window.PATCH_NOTES || [])[0]; if(!n) return;
    const card = document.createElement('div');
    card.className = 'card wn';
    card.innerHTML = `<div class="wnh"><b>What's new in v${esc(n.v)}</b><span>${esc(fmtDate(n.date))}</span></div>
      <ul>${n.items.map(i=>`<li>${esc(i)}</li>`).join('')}</ul>
      <div class="row"><button id="wnSet">Set up notifications</button><button class="pri" id="wnOk">Got it</button></div>`;
    const today = $('tab-today'); today.insertBefore(card, today.firstChild);
    const close = () => { store.set('seenVersion', v); card.remove(); };
    $('wnOk').onclick = close;
    $('wnSet').onclick = () => { close(); panel.classList.remove('hide'); $('zonePanel').classList.add('hide'); setTimeout(()=>$('nfBody').scrollIntoView({block:'start',behavior:'smooth'}),50); };
    if(n.v !== '2.2') $('wnSet').remove(); // only point at notifications for the release that added them
  })();

  // ---------- push helpers ----------
  const supported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const standalone = () => navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
  const b64uBytes = s => { s = s.replace(/-/g,'+').replace(/_/g,'/'); return Uint8Array.from(atob(s + '==='.slice((s.length+3)%4)), c => c.charCodeAt(0)); };
  const currentZone = () => (window.APP && window.APP.zone) || store.get('lastZone') || null;
  async function api(path, body){
    const r = await fetch(PUSH_URL + path, body ? { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) } : {});
    const j = await r.json().catch(()=>({}));
    if(!r.ok || j.ok === false) throw new Error(j.error || ('HTTP '+r.status));
    return j;
  }
  async function getSub(create){
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if(!sub && create){
      const { key } = await api('/key');
      sub = await reg.pushManager.subscribe({ userVisibleOnly:true, applicationServerKey:b64uBytes(key) });
    }
    return sub;
  }
  async function sync(){
    const zone = currentZone(); if(!zone) throw new Error('Open the Today tab once so the app can find your zone.');
    const sub = await getSub(true);
    await api('/subscribe', { sub: sub.toJSON(), zone, prefs: prefs() });
    store.set('nfZone', zone); store.set('nfSynced', Date.now());
  }

  let msg = '', busy = false;
  function draw(){
    const el = $('nfBody'); const on = !!store.get('nfOn');
    if(!supported() || (isIOS && !standalone())){
      el.innerHTML = `<div class="stat">${isIOS && !standalone()
        ? 'To get prayer alerts on iPhone, open this app from its Home Screen icon (Share > Add to Home Screen in Safari). Needs iOS 16.4 or later.'
        : 'This browser does not support notifications.'}</div>`;
      return;
    }
    if(Notification.permission === 'denied'){
      el.innerHTML = `<div class="stat">Notifications are blocked. Turn them on in iPhone Settings > Notifications > Waktu Solat, then come back here.</div>`;
      return;
    }
    if(!on){
      el.innerHTML = `<div class="stat">Get an alert at each prayer time, and a reminder before it, even when the app is closed.</div>
        <div class="row"><button class="pri" id="nfOn" ${busy?'disabled':''}>${busy?'Turning on…':'Turn on notifications'}</button></div>
        ${msg?`<div class="stat">${esc(msg)}</div>`:''}`;
      $('nfOn').onclick = turnOn;
      return;
    }
    const p = prefs();
    el.innerHTML = `<div class="stat"><b>On</b> for zone ${esc(store.get('nfZone') || currentZone() || '')}. The zone updates whenever you open the app.</div>
      <label style="margin-top:4px">Remind me before</label>
      <div class="segrow" id="nfMin">${[5,10,15,20].map(m=>`<button data-m="${m}" class="${p.min===m?'on':''}">${m} min</button>`).join('')}</div>
      <div style="margin-top:8px">${ROWS.map(([k,l,at,pre])=>`<div class="nfrow"><span>${l}</span>
        <button class="chip ${at?'':'na'} ${p.at.includes(k)?'on':''}" data-k="${k}" data-t="at">On time</button>
        <button class="chip ${pre?'':'na'} ${p.pre.includes(k)?'on':''}" data-k="${k}" data-t="pre">Before</button></div>`).join('')}</div>
      <div class="row"><button id="nfTest">Send test</button><button id="nfOff">Turn off</button></div>
      ${msg?`<div class="stat">${esc(msg)}</div>`:''}`;
    el.querySelectorAll('#nfMin button').forEach(b => b.onclick = () => { store.set('nfPrefs', Object.assign(p, {min:+b.dataset.m})); save(); });
    el.querySelectorAll('.chip:not(.na)').forEach(b => b.onclick = () => {
      const list = p[b.dataset.t], k = b.dataset.k;
      p[b.dataset.t] = list.includes(k) ? list.filter(x=>x!==k) : [...list, k];
      store.set('nfPrefs', p); save();
    });
    $('nfTest').onclick = test;
    $('nfOff').onclick = turnOff;
  }
  let saveTimer = null;
  function save(){
    msg = 'Saving…'; draw();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      try { await sync(); msg = 'Saved.'; } catch(e){ msg = 'Could not save: ' + e.message; }
      draw();
    }, 600);
  }
  async function turnOn(){
    busy = true; msg = ''; draw();
    try {
      const perm = await Notification.requestPermission();
      if(perm !== 'granted') throw new Error('Permission was not given.');
      await sync();
      store.set('nfOn', true); msg = 'Done. Tap Send test to check.';
    } catch(e){ msg = 'Could not turn on: ' + e.message; }
    busy = false; draw();
  }
  async function turnOff(){
    try {
      const sub = await getSub(false);
      if(sub){ try { await api('/unsubscribe', { endpoint: sub.endpoint }); } catch(e){} await sub.unsubscribe(); }
    } catch(e){}
    store.set('nfOn', false); msg = 'Notifications are off.'; draw();
  }
  async function test(){
    msg = 'Sending…'; draw();
    try {
      const sub = await getSub(false); if(!sub) throw new Error('not subscribed');
      await api('/test', { endpoint: sub.endpoint });
      msg = 'Sent. It should arrive in a few seconds.';
    } catch(e){
      if(/not subscribed/.test(e.message)){ try { await sync(); await api('/test', { endpoint:(await getSub(false)).endpoint }); msg = 'Sent.'; } catch(e2){ msg = 'Could not send: ' + e2.message; } }
      else msg = 'Could not send: ' + e.message;
    }
    draw();
  }

  // keep the Worker in step with the zone, and refresh the subscription once a day
  document.addEventListener('appdata', async () => {
    if(!store.get('nfOn') || !supported() || Notification.permission !== 'granted') return;
    const zone = currentZone();
    const stale = Date.now() - (store.get('nfSynced') || 0) > 86400000;
    if(zone && (zone !== store.get('nfZone') || stale)){ try { await sync(); draw(); } catch(e){} }
  });

  $('setBtn').addEventListener('click', () => { msg = ''; draw(); });
  draw();
})();
