// Solat guide: types of prayer, how to pray (with pose illustrations), wudhu, and short surahs with audio.
// Follows common Malaysian (Shafi'i) practice. Quran text, transliteration, translations and audio
// are loaded from api.alquran.cloud / cdn.islamic.network (Mishary Alafasy recitation).
(() => {
  const $ = id => document.getElementById(id);
  const store = {
    get(k){ try{ return JSON.parse(localStorage.getItem(k)); }catch(e){ return null; } },
    set(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
  };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  // ---------------- pose illustrations (simple faceless figures, facing the Qibla to the right) ----------------
  const G = '<line x1="8" y1="112" x2="112" y2="112" stroke="#1f4a40" stroke-width="3" stroke-linecap="round"/>';
  const fig = (paths, head, extra='') => `<svg viewBox="0 0 120 120" class="pose" aria-hidden="true">${G}
    <g fill="none" stroke="#e8c66a" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round">${paths}</g>
    <circle cx="${head[0]}" cy="${head[1]}" r="9" fill="#e8c66a"/>${extra}</svg>`;
  const legsStand = '<path d="M60 66 L58 108 L66 108"/><path d="M60 66 L63 108 L71 108"/>';
  const POSE = {
    niat:    fig(`<path d="M60 34 L60 66"/>${legsStand}<path d="M60 40 L61 66"/>`, [60,22]),
    takbir:  fig(`<path d="M60 34 L60 66"/>${legsStand}<path d="M60 40 L70 42 L68 22"/>`, [60,22]),
    qiyam:   fig(`<path d="M60 34 L60 66"/>${legsStand}<path d="M60 40 L55 52 L68 48"/>`, [60,22]),
    ruku:    fig(`<path d="M48 68 L84 68"/><path d="M48 68 L47 108 L55 108"/><path d="M48 68 L51 108 L59 108"/><path d="M80 68 L52 88"/>`, [93,66]),
    itidal:  fig(`<path d="M60 34 L60 66"/>${legsStand}<path d="M60 40 L63 66"/>`, [60,22]),
    sujud:   fig(`<path d="M26 108 L52 108"/><path d="M52 108 L44 80"/><path d="M44 80 L78 98"/><path d="M76 97 L86 110"/>`, [90,103]),
    duduk:   fig(`<path d="M30 108 L66 108"/><path d="M42 100 L66 104"/><path d="M42 100 L46 60"/><path d="M46 66 L64 98"/>`, [48,49]),
    tahiyat: fig(`<path d="M30 108 L66 108"/><path d="M42 100 L66 104"/><path d="M42 100 L46 60"/><path d="M46 66 L64 98 L70 90"/>`, [48,49]),
    salam:   fig(`<path d="M30 108 L66 108"/><path d="M42 100 L66 104"/><path d="M42 100 L46 60"/><path d="M46 66 L64 98"/>`, [48,49],
             '<path d="M64 40 l10 0 m-4 -4 l4 4 l-4 4" stroke="#9fbdb4" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M32 40 l-10 0 m4 -4 l-4 4 l4 4" stroke="#9fbdb4" stroke-width="2.5" fill="none" stroke-linecap="round"/>'),
  };

  // ---------------- content ----------------
  const TYPES = [
    { h:'Fardhu (obligatory)', items:[
      ['Subuh','2 rakaat','Recited aloud. From dawn (Fajr) until sunrise.'],
      ['Zohor','4 rakaat','Recited silently. From midday until Asr.'],
      ['Asar','4 rakaat','Recited silently. From Asr until sunset.'],
      ['Maghrib','3 rakaat','First 2 rakaat aloud. From sunset until Isyak.'],
      ['Isyak','4 rakaat','First 2 rakaat aloud. From Isyak until dawn.'],
      ['Jumaat','2 rakaat','Replaces Zohor on Friday, in congregation after two khutbah. Obligatory for adult Muslim men who are not travelling.'],
    ]},
    { h:'Sunat (recommended)', items:[
      ['Rawatib','2 rakaat each','Before Subuh (2), before and after Zohor (2 + 2), after Maghrib (2), after Isyak (2). These are the stressed (muakkad) ones.'],
      ['Witir','1 to 11 rakaat (odd)','After Isyak until dawn. Commonly 3 rakaat (2 + 1). Closes the night prayers.'],
      ['Dhuha','2 to 8 rakaat','Mid-morning, from about 20 to 25 minutes after sunrise until shortly before Zohor.'],
      ['Tahajjud','2 rakaat or more','At night after sleeping, best in the last third of the night.'],
      ['Tarawih','8 or 20 rakaat','Ramadan nights after Isyak, prayed in sets of 2, followed by Witir.'],
      ['Hari Raya','2 rakaat','Morning of Aidilfitri and Aidiladha. 7 extra takbir in the 1st rakaat and 5 in the 2nd, followed by a khutbah.'],
      ['Tahiyyatul Masjid','2 rakaat','On entering a mosque, before sitting down.'],
      ['Istikharah','2 rakaat','When asking Allah for guidance on a decision, followed by the doa istikharah.'],
      ['Hajat','2 rakaat or more','When asking Allah for a specific need.'],
      ['Taubat','2 rakaat','When seeking forgiveness for a sin.'],
      ['Gerhana','2 rakaat','During a solar or lunar eclipse. Each rakaat has 2 standings and 2 ruku.'],
    ]},
    { h:'Special cases', items:[
      ['Jenazah','4 takbir, standing only','Fardhu kifayah. No ruku or sujud. After the 1st takbir recite Al-Fatihah, after the 2nd selawat, after the 3rd and 4th doa for the deceased, then salam.'],
      ['Jamak & Qasar','For travellers','When travelling about 2 marhalah (around 81 km) or more: Jamak combines Zohor with Asar, or Maghrib with Isyak. Qasar shortens 4-rakaat prayers to 2. Maghrib and Subuh are never shortened.'],
    ]},
  ];

  const NIAT = [
    ['Subuh','Usolli fardhas-Subhi rak‘ataini adā’an lillāhi ta‘ālā','I intend to pray the obligatory Subuh, 2 rakaat, on time, for Allah.'],
    ['Zohor','Usolli fardhaz-Zuhri arba‘a raka‘ātin adā’an lillāhi ta‘ālā','I intend to pray the obligatory Zohor, 4 rakaat, on time, for Allah.'],
    ['Asar','Usolli fardhal-‘Asri arba‘a raka‘ātin adā’an lillāhi ta‘ālā','I intend to pray the obligatory Asar, 4 rakaat, on time, for Allah.'],
    ['Maghrib','Usolli fardhal-Maghribi thalātha raka‘ātin adā’an lillāhi ta‘ālā','I intend to pray the obligatory Maghrib, 3 rakaat, on time, for Allah.'],
    ['Isyak','Usolli fardhal-‘Isyā’i arba‘a raka‘ātin adā’an lillāhi ta‘ālā','I intend to pray the obligatory Isyak, 4 rakaat, on time, for Allah.'],
  ];

  const STEPS = [
    { p:'niat', t:'1. Stand and make your niat', d:'Stand facing the Qibla. Make the intention in your heart for which prayer you are about to perform. Saying it softly (lafaz) is sunat. See the niat list below.' },
    { p:'takbir', t:'2. Takbiratul Ihram', d:'Raise both hands to your ears and say the takbir. The prayer begins here.', ar:'اللَّهُ أَكْبَرُ', tr:'Allāhu akbar', m:'Allah is the Greatest.' },
    { p:'qiyam', t:'3. Stand (Qiyam) and recite', d:'Place your right hand over your left on your chest. Recite the opening doa (Iftitah, sunat), then Al-Fatihah (required in every rakaat). In the first 2 rakaat, follow it with a short surah.', tr:'Iftitah begins: Allāhu akbaru kabīrā, walhamdu lillāhi kathīrā, wa subhānallāhi bukratan wa asīlā…', m:'Allah is the Greatest, much praise be to Allah, glory be to Allah morning and evening…', link:'Open Al-Fatihah and short surahs' },
    { p:'ruku', t:'4. Ruku (bow)', d:'Say "Allahu akbar" and bow with your back flat and hands on your knees. Pause calmly (tuma’ninah). Recite 3 times:', ar:'سُبْحَانَ رَبِّيَ الْعَظِيمِ', tr:'Subhāna rabbiyal-‘azīm', m:'Glory be to my Lord, the Most Great.' },
    { p:'itidal', t:'5. I’tidal (rise)', d:'Rise to standing while saying the first phrase, then once upright say the second. In the 2nd rakaat of Subuh, the Qunut doa is recited here (Shafi’i practice).', ar:'سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ · رَبَّنَا لَكَ الْحَمْدُ', tr:'Sami‘allāhu liman hamidah · Rabbanā lakal-hamd', m:'Allah hears whoever praises Him · Our Lord, to You is all praise.' },
    { p:'sujud', t:'6. Sujud (prostration)', d:'Say "Allahu akbar" and prostrate. Seven parts touch the ground: forehead (with nose), both palms, both knees and the toes of both feet. Recite 3 times:', ar:'سُبْحَانَ رَبِّيَ الْأَعْلَى', tr:'Subhāna rabbiyal-a‘lā', m:'Glory be to my Lord, the Most High.' },
    { p:'duduk', t:'7. Sit between the two sujud', d:'Say "Allahu akbar" and sit up on your left foot with the right foot upright (iftirasy). Recite:', tr:'Rabbighfirlī warhamnī wajburnī warfa‘nī warzuqnī wahdinī wa ‘āfinī wa‘fu ‘annī', m:'My Lord, forgive me, have mercy on me, mend me, raise me, provide for me, guide me, keep me well and pardon me.' },
    { p:'sujud', t:'8. Second sujud', d:'Say "Allahu akbar" and prostrate again, reciting the same tasbih 3 times. This completes one rakaat. Stand up with "Allahu akbar" for the next rakaat and repeat steps 3 to 8.' },
    { p:'tahiyat', t:'9. Tahiyyat (sitting for tasyahhud)', d:'After the 2nd rakaat, sit and recite the tasyahhud. In a 3 or 4 rakaat prayer, this first sitting (tahiyyat awal) ends after the tasyahhud and you stand for the remaining rakaat. In the final sitting (tahiyyat akhir), sit with the left foot under the right leg (tawarruk) and add the selawat. Raise the right index finger at "illallāh".', tr:'At-tahiyyātul-mubārakātus-salawātut-tayyibātu lillāh. Assalāmu ‘alaika ayyuhan-nabiyyu wa rahmatullāhi wa barakātuh. Assalāmu ‘alainā wa ‘alā ‘ibādillāhis-sālihīn. Asyhadu allā ilāha illallāh, wa asyhadu anna Muhammadar-rasūlullāh.', m:'All blessed greetings, prayers and good things belong to Allah. Peace be upon you, O Prophet, and Allah’s mercy and blessings. Peace be upon us and upon the righteous servants of Allah. I bear witness that there is no god but Allah, and that Muhammad is the Messenger of Allah.' },
    { p:'tahiyat', t:'10. Selawat (final sitting only)', d:'Continue in the final sitting with the selawat Ibrahimiyyah:', tr:'Allāhumma salli ‘alā Sayyidinā Muhammad wa ‘alā āli Sayyidinā Muhammad, kamā sallaita ‘alā Sayyidinā Ibrāhīm wa ‘alā āli Sayyidinā Ibrāhīm, wa bārik ‘alā Sayyidinā Muhammad wa ‘alā āli Sayyidinā Muhammad, kamā bārakta ‘alā Sayyidinā Ibrāhīm wa ‘alā āli Sayyidinā Ibrāhīm, fil-‘ālamīna innaka hamīdum-majīd.', m:'O Allah, send prayers and blessings upon Muhammad and his family, as You did upon Ibrahim and his family. Truly You are Praiseworthy and Glorious.' },
    { p:'salam', t:'11. Salam', d:'Turn your head to the right and say the salam, then turn to the left and say it again. The prayer is complete.', ar:'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ', tr:'Assalāmu ‘alaikum wa rahmatullāh', m:'Peace be upon you and the mercy of Allah.' },
  ];

  const WUDHU = [
    ['Niat','Intend in your heart to perform wudhu, at the moment you start washing your face.', true],
    ['Wash hands','Say Bismillah and wash both hands up to the wrists, 3 times.', false],
    ['Rinse mouth','Rinse your mouth 3 times.', false],
    ['Rinse nose','Sniff water into the nose and blow it out, 3 times.', false],
    ['Wash face','From the hairline to the chin and from ear to ear, 3 times.', true],
    ['Wash arms','Right arm then left, from fingertips up to and including the elbows, 3 times.', true],
    ['Wipe head','Wipe part of your head with wet hands.', true],
    ['Wipe ears','Wipe inside and behind both ears.', false],
    ['Wash feet','Right foot then left, up to and including the ankles, between the toes, 3 times.', true],
    ['In order (tertib)','Perform the required steps in this sequence.', true],
  ];

  const SURAHS = [
    { n:1, ref:'1', name:'Al-Fatihah', en:'The Opening', note:'Required in every rakaat' },
    { n:255, ref:'2:255', name:'Ayat al-Kursi', en:'The Throne Verse (Al-Baqarah 255)', note:'Often read after prayer', ayah:true },
    { n:97, ref:'97', name:'Al-Qadr', en:'The Night of Decree' },
    { n:102, ref:'102', name:'At-Takathur', en:'Rivalry in Worldly Increase' },
    { n:103, ref:'103', name:'Al-‘Asr', en:'Time' },
    { n:105, ref:'105', name:'Al-Fil', en:'The Elephant' },
    { n:106, ref:'106', name:'Quraisy', en:'Quraysh' },
    { n:107, ref:'107', name:'Al-Ma‘un', en:'Small Kindnesses' },
    { n:108, ref:'108', name:'Al-Kauthar', en:'Abundance', note:'Shortest surah' },
    { n:109, ref:'109', name:'Al-Kafirun', en:'The Disbelievers' },
    { n:110, ref:'110', name:'An-Nasr', en:'Divine Help' },
    { n:111, ref:'111', name:'Al-Masad', en:'Palm Fibre' },
    { n:112, ref:'112', name:'Al-Ikhlas', en:'Sincerity' },
    { n:113, ref:'113', name:'Al-Falaq', en:'Daybreak' },
    { n:114, ref:'114', name:'An-Nas', en:'Mankind' },
  ];

  // ---------------- styles ----------------
  const css = document.createElement('style');
  css.textContent = `
    .seg{display:flex;gap:6px;margin-bottom:12px;overflow-x:auto}
    .seg button{flex:1;padding:8px 6px;font-size:14px;white-space:nowrap}
    .seg button.on{background:#e8c66a;color:#1b1404}
    .gh{font-size:13px;color:#9fbdb4;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:4px 0 8px}
    .ty{padding:10px 0;border-bottom:1px solid #1f4a40}
    .ty:last-child{border-bottom:0}
    .ty b{font-size:16px} .ty .rk{float:right;font-size:13px;color:#e8c66a;font-weight:700}
    .ty div{font-size:13px;color:#9fbdb4;margin-top:3px;line-height:1.45}
    .step{display:flex;gap:12px;padding:12px 0;border-bottom:1px solid #1f4a40}
    .step:last-child{border-bottom:0}
    .pose{width:84px;height:84px;flex-shrink:0;background:#0b1f1a;border-radius:14px}
    .step b{font-size:16px;display:block;margin-bottom:4px}
    .step p{font-size:13px;color:#cfe0da;line-height:1.5}
    .ar{font-family:"Amiri","Geeza Pro","Traditional Arabic",serif;direction:rtl;text-align:right;font-size:24px;line-height:1.9;color:#eef5f2;margin-top:6px}
    .tr{font-size:13px;font-style:italic;color:#e8c66a;margin-top:4px;line-height:1.5}
    .mn{font-size:13px;color:#9fbdb4;margin-top:3px;line-height:1.5}
    .lnk{background:none;padding:6px 0 0;color:#5fd39a;font-size:13px}
    .niat{padding:8px 0;border-bottom:1px solid #1f4a40} .niat:last-child{border-bottom:0}
    .niat b{font-size:14px}
    .wd{display:flex;gap:10px;padding:9px 0;border-bottom:1px solid #1f4a40;font-size:14px;line-height:1.45}
    .wd:last-child{border-bottom:0}
    .wd .no{width:24px;height:24px;border-radius:12px;background:#1f4a40;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0}
    .wd span{color:#9fbdb4}
    .fard{font-size:10px;font-weight:700;padding:2px 6px;border-radius:6px;background:#2a4a33;color:#5fd39a;margin-left:6px}
    .sl{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #1f4a40;cursor:pointer}
    .sl:last-child{border-bottom:0}
    .sl .num{width:36px;height:36px;border-radius:10px;background:#1f4a40;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0}
    .sl .nm{flex:1} .sl .nm b{font-size:16px} .sl .nm div{font-size:12px;color:#9fbdb4}
    .sl .go{color:#9fbdb4;font-size:20px}
    .ayah{padding:12px 0;border-bottom:1px solid #1f4a40;border-radius:10px;transition:background .2s}
    .ayah.playing{background:#2a4a33}
    .ayah .no{font-size:11px;color:#9fbdb4;font-weight:700}
    .bism{text-align:center;direction:rtl;font-family:"Amiri","Geeza Pro",serif;font-size:24px;margin:6px 0 4px}
    .ctl{display:flex;gap:8px;margin:10px 0}
    .ctl button{flex:1}
    .lang{display:flex;gap:6px;margin-top:6px} .lang button{flex:1;padding:6px;font-size:13px} .lang button.on{background:#e8c66a;color:#1b1404}
  `;
  document.head.appendChild(css);
  const font = document.createElement('link'); font.rel='stylesheet';
  font.href='https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap'; document.head.appendChild(font);

  // ---------------- render ----------------
  const root = $('guideRoot');
  let view = 'types';

  function seg(){
    return `<div class="seg">${[['types','Types'],['howto','How to pray'],['wudhu','Wudhu'],['surahs','Surahs']]
      .map(([k,l])=>`<button data-v="${k}" class="${view===k||(view==='surah'&&k==='surahs')?'on':''}">${l}</button>`).join('')}</div>`;
  }
  function vTypes(){
    return TYPES.map(g=>`<div class="card"><div class="gh">${g.h}</div>${g.items.map(([n,r,d])=>
      `<div class="ty"><span class="rk">${r}</span><b>${n}</b><div>${d}</div></div>`).join('')}</div>`).join('');
  }
  function vHowto(){
    const steps = STEPS.map(s=>`<div class="step">${POSE[s.p]}<div style="flex:1;min-width:0"><b>${s.t}</b><p>${s.d}</p>
      ${s.ar?`<div class="ar">${s.ar}</div>`:''}${s.tr?`<div class="tr">${s.tr}</div>`:''}${s.m?`<div class="mn">${s.m}</div>`:''}
      ${s.link?`<button class="lnk" data-v="surahs">${s.link} ›</button>`:''}</div></div>`).join('');
    const niat = NIAT.map(([n,t,m])=>`<div class="niat"><b>${n}</b><div class="tr">${t}</div><div class="mn">${m}</div></div>`).join('');
    return `<div class="card"><div class="gh">Step by step (2 rakaat, e.g. Subuh)</div>
      <p class="mn" style="margin-bottom:6px">For Maghrib (3) and Zohor, Asar, Isyak (4): sit for the first tahiyyat after rakaat 2, then stand and complete the remaining rakaat with Al-Fatihah only.</p>${steps}</div>
      <div class="card"><div class="gh">Niat for the 5 daily prayers</div>${niat}
      <p class="mn" style="margin-top:8px">The niat itself is in the heart. Saying it softly beforehand is sunat in the Shafi’i school.</p></div>
      <p class="mn" style="text-align:center;margin-bottom:14px">Based on common Malaysian (Shafi’i) practice. For detailed rulings, refer to JAKIM or your local ustaz.</p>`;
  }
  function vWudhu(){
    return `<div class="card"><div class="gh">How to take wudhu</div>${WUDHU.map(([t,d,f],i)=>
      `<div class="wd"><div class="no">${i+1}</div><div><b>${t}</b>${f?'<span class="fard">Required</span>':''}<br><span>${d}</span></div></div>`).join('')}
      <p class="mn" style="margin-top:10px">Steps marked Required are the 6 fardhu of wudhu. The rest are sunat. Wudhu is broken by using the toilet, passing wind, deep sleep, losing consciousness, and (in the Shafi’i school) skin contact between a man and a woman who are not mahram.</p></div>`;
  }
  function vSurahs(){
    return `<div class="card"><div class="gh">Short surahs</div>${SURAHS.map(s=>
      `<div class="sl" data-s="${s.ref}"><div class="num">${s.ayah?'2:255':s.n}</div><div class="nm"><b>${s.name}</b><div>${s.en}${s.note?` · ${s.note}`:''}</div></div><div class="go">›</div></div>`).join('')}
      <p class="mn" style="margin-top:8px">Recitation by Mishary Rashid Alafasy. Needs internet the first time; text is saved for offline reading.</p></div>`;
  }

  // ---------------- surah detail + audio ----------------
  let audio = null, queue = [], qi = 0, cur = null;
  function stopAudio(){ if(audio){ audio.pause(); audio=null; } queue=[]; document.querySelectorAll('.ayah.playing').forEach(e=>e.classList.remove('playing')); const b=$('playAll'); if(b) b.textContent='▶ Play all'; }
  function playIndex(i){
    if(i>=queue.length){ stopAudio(); return; }
    qi=i; const a=queue[i];
    document.querySelectorAll('.ayah.playing').forEach(e=>e.classList.remove('playing'));
    const el=document.querySelector(`.ayah[data-g="${a}"]`); if(el){ el.classList.add('playing'); el.scrollIntoView({block:'center',behavior:'smooth'}); }
    audio = new Audio(`https://cdn.islamic.network/quran/audio/128/ar.alafasy/${a}.mp3`);
    audio.onended = () => playIndex(qi+1);
    audio.onerror = () => { stopAudio(); const b=$('playAll'); if(b) b.textContent='Audio needs internet'; };
    audio.play().catch(()=>{ stopAudio(); });
  }
  async function loadSurah(ref){
    const key = `quran:${ref}`; let d = store.get(key);
    if(!d){
      const url = ref.includes(':')
        ? `https://api.alquran.cloud/v1/ayah/${ref}/editions/quran-uthmani,en.transliteration,en.sahih,ms.basmeih`
        : `https://api.alquran.cloud/v1/surah/${ref}/editions/quran-uthmani,en.transliteration,en.sahih,ms.basmeih`;
      const r = await fetch(url); if(!r.ok) throw new Error(r.status);
      const j = await r.json();
      const eds = j.data.map(e => e.ayahs ? e.ayahs : [e]);
      d = eds[0].map((a,i)=>({ g:a.number, n:a.numberInSurah, ar:a.text, tr:eds[1][i].text, en:eds[2][i].text, ms:eds[3][i].text }));
      store.set(key,d);
    }
    return d;
  }
  async function vSurah(ref){
    const s = SURAHS.find(x=>x.ref===ref);
    root.innerHTML = seg() + `<div class="card"><button class="lnk" data-v="surahs">‹ All surahs</button>
      <div style="margin-top:6px"><b style="font-size:20px">${s.name}</b><div class="mn">${s.en}</div></div>
      <div class="ctl"><button class="pri" id="playAll">▶ Play all</button></div>
      <div class="lang"><button data-l="en">English</button><button data-l="ms">Bahasa Melayu</button></div>
      <div id="ayahs"><p class="mn" style="margin-top:12px">Loading…</p></div></div>`;
    let d;
    try{ d = await loadSurah(ref); }catch(e){ $('ayahs').innerHTML='<p class="mn" style="margin-top:12px">Could not load this surah. Connect to the internet once to download it.</p>'; return; }
    const lang = store.get('trLang') || 'en';
    document.querySelectorAll('.lang button').forEach(b=>b.classList.toggle('on', b.dataset.l===lang));
    const BISM = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';
    let html = '';
    if(!s.ayah && s.n!==1){ html += `<div class="bism">${BISM}</div>`; }
    html += d.map(a=>{
      let ar = a.ar;
      ar = ar.replace(/^\uFEFF/,'');
      if(!s.ayah && s.n!==1 && s.n!==9 && a.n===1){ const w = ar.split(/\s+/); if(w.length>4 && w[0].startsWith('بِسْمِ')) ar = w.slice(4).join(' '); }
      return `<div class="ayah" data-g="${a.g}"><div class="no">${s.ayah?'2:255':`Ayah ${a.n}`} · tap to play</div>
        <div class="ar">${esc(ar)}</div><div class="tr">${esc(a.tr)}</div><div class="mn">${esc(lang==='ms'?a.ms:a.en)}</div></div>`;
    }).join('');
    $('ayahs').innerHTML = html;
    const all = d.map(a=>a.g);
    $('playAll').onclick = () => { if(audio){ stopAudio(); return; } queue = all; $('playAll').textContent='■ Stop'; playIndex(0); };
    document.querySelectorAll('.ayah').forEach(el=>el.onclick=()=>{ stopAudio(); queue=[+el.dataset.g]; playIndex(0); });
    document.querySelectorAll('.lang button').forEach(b=>b.onclick=()=>{ store.set('trLang',b.dataset.l); stopAudio(); vSurah(ref); });
  }

  function render(){
    stopAudio();
    const body = view==='types'?vTypes():view==='howto'?vHowto():view==='wudhu'?vWudhu():vSurahs();
    root.innerHTML = seg() + body;
  }
  root.addEventListener('click', e => {
    const v = e.target.closest('[data-v]'); if(v){ view = v.dataset.v; render(); window.scrollTo(0,0); return; }
    const s = e.target.closest('[data-s]'); if(s){ view='surah'; stopAudio(); vSurah(s.dataset.s); window.scrollTo(0,0); }
  });
  document.addEventListener('visibilitychange', ()=>{ if(document.hidden) stopAudio(); });
  render();
})();
