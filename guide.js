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

  // ---------------- sources (official Malaysian bodies first) ----------------
  const SRC = {
    jakimTimes: ['JAKIM e-Solat prayer times (via api.waktusolat.app)', 'https://www.e-solat.gov.my/'],
    jakimTarawih: ['JAKIM, Panduan Solat Sunat Tarawih (hosted by Pejabat Mufti WP)', 'https://www.muftiwp.gov.my/images/photo/pengumuman/Panduan_Sembahyang_Sunat_Tarawih.pdf'],
    kafi1181: ['Pejabat Mufti WP, Al-Kafi #1181: Maksud dua marhalah', 'https://muftiwp.gov.my/artikel/al-kafi-li-al-fatawi/3248-al-kafi-1181-maksud-dua-marhalah-di-dalam-jamak-dan-qasar'],
    kafi255: ['Pejabat Mufti WP, Al-Kafi #255: Musafir, muqim dan mastautin', 'https://muftiwp.gov.my/en/artikel/al-kafi-li-al-fatawi/1364-al-kafi-255-the-meaning-of-musafir-muqim-and-mastautin-for-jamak-and-qasar'],
    kafi1177: ['Pejabat Mufti WP, Al-Kafi #1177: Jamak qasar tanpa bermalam', 'https://muftiwp.gov.my/artikel/al-kafi-li-al-fatawi/3241-al-kafi-1177-hukum-solat-jamak-qasar-semasa-musafir-tanpa-bermalam'],
    kafi1197: ['Pejabat Mufti WP, Al-Kafi #1197: Bercuti dan rukhsah jamak qasar', 'https://www.muftiwp.gov.my/en/artikel/al-kafi-li-al-fatawi/3275-al-kafi-1197-is-going-on-a-holiday-for-fun-and-recreation-considered-rukhsah-for-jamak-and-qasar'],
    kafi1690: ['Pejabat Mufti WP, Al-Kafi #1690: Jamak sehingga 18 hari', 'https://www.muftiwp.gov.my/artikel/al-kafi-li-al-fatawi/4404-al-kafi-1690-jamak-solat-sehingga-18-hari'],
    perak81: ['Jabatan Mufti Negeri Perak, Penentuan kadar dua marhalah (81 km)', 'https://mufti.perak.gov.my/images/Fatwa%20tidak%20warta/8.NEW%20PENENTUAN%20KADAR%20DUA%20MARHALAH%20QARYAH%20DAN%20BALAD%20DARI%20PERSPEKTIF%20FIQH%20SEMASA.pdf'],
    johor81: ['Johor State Fatwa gazette on 81 km (Utusan Malaysia report)', 'https://www.utusan.com.my/berita/2023/11/johor-tetapkan-81-km-syarat-sah-solat-jamak-qasar/'],
    kafi1641: ['Pejabat Mufti WP, Al-Kafi #1641: Solat Dhuha 8 rakaat', 'https://muftiwp.gov.my/artikel/al-kafi-li-al-fatawi/4278-al-kafi-1641-isu-solat-dhuha-8-rakaat-secara-terpisah'],
    kafi1393: ['Pejabat Mufti WP, Al-Kafi #1393: Tatacara solat witir yang afdhal', 'https://muftiwp.gov.my/artikel/al-kafi-li-al-fatawi/3734-al-kafi-1393-tatacara-solat-witir-yang-afdhal'],
    kafi1729: ['Pejabat Mufti WP, Al-Kafi #1729: Witir satu rakaat dahulu?', 'https://muftiwp.gov.my/en/artikel/al-kafi-li-al-fatawi/4519-al-kafi-1729-is-it-permissible-to-perform-the-witir-prayer-starting-with-one-rakaat-followed-by-two-rakaat'],
    irsyad143: ['Pejabat Mufti WP, Irsyad Ramadhan #143: Ba’diyah Isyak dan Tarawih', 'https://www.muftiwp.gov.my/en/artikel/irsyad-fatwa/irsyad-fatwa-khas-ramadhan-cat/3437-irsyad-al-fatwa-khas-ramadhan-siri-ke-143-solat-sunat-ba-diyah-isyak-dahulu-atau-terus-solat-sunat-tarawih'],
    kafi1212: ['Pejabat Mufti WP, Al-Kafi #1212: Ba’diyah Isyak', 'https://muftiwp.gov.my/en/artikel/al-kafi-li-al-fatawi/3299-al-kafi-1212-bolehkah-dilakukan-solat-sunat-ba-diyah-isyak-selepas-tempoh-yang-lama'],
    irsyad356: ['Pejabat Mufti WP, Irsyad #356 and related articles on istikharah', 'https://muftiwp.gov.my/en/artikel/irsyad-fatwa/irsyad-fatwa-umum-cat/3943-irsyad-al-fatwa-series-356-is-it-permissible-to-perform-istikharah-before-committing-haram'],
    perakRaya: ['Jabatan Mufti Negeri Perak, Panduan Hari Raya', 'https://mufti.Perak.gov.my/images/garis_panduan/GPRaya.pdf'],
    pahangRaya: ['Jabatan Mufti Negeri Pahang, Sunat-sunat Hari Raya', 'https://mufti.pahang.gov.my/wp-content/uploads/2022/04/HARI-RAYA-3.0artikel.pdf'],
    jenazahKKM: ['KKM / HTAR Klang, Panduan Ringkas Solat Jenazah', 'https://jknselangor.moh.gov.my/htar/images/pdf/UHEI/kematian.pdf'],
    nsDoa: ['Jabatan Mufti Negeri Sembilan, Risalah Do‘a Awal dan Akhir Tahun Hijriyyah 1442H', 'https://muftins.gov.my/wp-content/uploads/2020/08/Risalah-hijriyyah.pdf'],
    nuDoa: ['NU Online, Lafal doa awal dan akhir tahun (from the kitab Maslakul Akhyar)', 'https://nu.or.id/doa/ini-lafal-doa-awal-dan-akhir-tahun-kj6bh'],
    basmeih: ['Tafsir Pimpinan Ar-Rahman (Abdullah Basmeih), published by JAKIM', 'https://hrmars.com/journals/papers/IJARPED/v14-i2/25006'],
  };
  const srcHtml = keys => `<div class="srcs"><b>Sources</b>${keys.map(k=>{const [t,u]=SRC[k]; return `<a href="${u}" target="_blank" rel="noopener">${t} ↗</a>`;}).join('')}</div>`;
  const UNVERIFIED = '<div class="srcs"><b>Source</b><span>Standard Shafi’i practice taught in Malaysia. No single JAKIM page found for this prayer, so check with your local mosque or Jabatan Mufti.</span></div>';

  // ---------------- types of prayer ----------------
  const TYPES = [
    { h:'Fardhu (obligatory)', items:[
      ['Subuh','2 rakaat','Recited aloud. From dawn (Fajr) until sunrise.'],
      ['Zohor','4 rakaat','Recited silently. From midday until Asr.'],
      ['Asar','4 rakaat','Recited silently. From Asr until sunset.'],
      ['Maghrib','3 rakaat','First 2 rakaat aloud. From sunset until Isyak.'],
      ['Isyak','4 rakaat','First 2 rakaat aloud. From Isyak until dawn.'],
      ['Jumaat','2 rakaat','Replaces Zohor on Friday, in congregation after two khutbah. Obligatory for adult Muslim men who are not travelling.'],
    ]},
    { h:'Sunat (recommended) · tap for how to pray', items:[
      ['Rawatib','2 rakaat each','Before and after the fardhu prayers.','rawatib'],
      ['Witir','1 to 11 rakaat (odd)','After Isyak until dawn. Closes the night prayers.','witir'],
      ['Dhuha','2 to 12 rakaat','Mid-morning, after sunrise until before Zohor.','dhuha'],
      ['Tahajjud','2 rakaat or more','At night after sleeping.','tahajjud'],
      ['Tarawih','8 or 20 rakaat','Ramadan nights after Isyak.','tarawih'],
      ['Hari Raya','2 rakaat','Morning of Aidilfitri and Aidiladha, with extra takbir.','raya'],
      ['Tahiyyatul Masjid','2 rakaat','On entering a mosque, before sitting.','tahiyyat'],
      ['Istikharah','2 rakaat','Asking Allah for guidance on a decision.','istikharah'],
      ['Hajat','2 rakaat or more','Asking Allah for a specific need.','hajat'],
      ['Taubat','2 rakaat','Seeking forgiveness for a sin.','taubat'],
      ['Gerhana','2 rakaat','During a solar or lunar eclipse.','gerhana'],
    ]},
    { h:'Special cases · tap for details', items:[
      ['Jenazah','4 takbir, standing only','Funeral prayer. Fardhu kifayah.','jenazah'],
      ['Jamak & Qasar','For travellers','Combining and shortening prayers. Includes an eligibility checker.','travel'],
    ]},
  ];

  // Detailed guides. "How" lists only what differs from a normal 2-rakaat prayer (see How to pray).
  const SUNAT = {
    rawatib: { t:'Solat Sunat Rawatib', hukum:'Sunat. Some are muakkad (strongly encouraged).', when:'Qabliyah: after the fardhu time begins, before the fardhu. Ba’diyah: after the fardhu, until that prayer’s time ends. Best not to delay ba’diyah too long.', rakaat:'2 rakaat each, with one salam.',
      how:['Muakkad: 2 before Subuh, 2 (or 4) before Zohor, 2 after Zohor, 2 after Maghrib, 2 after Isyak.','Others (ghairu muakkad): before Asar, before Maghrib, before Isyak, and the extra 2 after Zohor.','Pray exactly like a normal 2-rakaat prayer, recited silently.','On Ramadan nights, pray ba’diyah Isyak first, then Tarawih.'],
      niat:['Usolli sunnatas-Subhi rak‘ataini qabliyyatan lillāhi ta‘ālā','Sahaja aku solat sunat qabliyah Subuh dua rakaat kerana Allah Taala. (Change Subuh/qabliyah to suit, e.g. ba’diyah Maghrib.)'],
      src:['irsyad143','kafi1212'] },
    witir: { t:'Solat Sunat Witir', hukum:'Sunat muakkad.', when:'After Isyak (and its ba’diyah) until dawn. Usually the last prayer of the night.', rakaat:'Odd number: 1, 3, 5 … up to 11. In Malaysia it is commonly 3 after Tarawih.',
      how:['Common way (3 rakaat): pray 2 rakaat with salam, then 1 rakaat with salam. The 2 come first, then the 1.','Or pray all 3 with one salam. Then there is only one tasyahhud, at the end (unlike Maghrib, which has two).','The single final rakaat is prayed like a normal rakaat, ending with tahiyyat akhir and salam.'],
      niat:['Sahaja aku solat sunat Witir dua rakaat kerana Allah Taala.','Then for the last: Sahaja aku solat sunat Witir satu rakaat kerana Allah Taala.'],
      src:['jakimTarawih','kafi1393','kafi1729'] },
    dhuha: { t:'Solat Sunat Dhuha', hukum:'Sunat.', when:'From about 25 minutes after sunrise (JAKIM almanac) until shortly before Zohor. The app’s Today tab shows the start time.', rakaat:'Minimum 2. The Shafi’i school prioritises 8; the maximum is 12. Give salam every 2 rakaat.',
      how:['Pray in sets of 2 rakaat, each set like a normal 2-rakaat prayer.','Repeat the niat for each set of 2.'],
      niat:['Usolli sunnatad-Dhuhā rak‘ataini lillāhi ta‘ālā','Sahaja aku solat sunat Dhuha dua rakaat kerana Allah Taala.'],
      src:['kafi1641'] },
    tahajjud: { t:'Solat Sunat Tahajjud', hukum:'Sunat.', when:'At night after Isyak, after having slept, until dawn. Best in the last third of the night.', rakaat:'Minimum 2, in sets of 2. Often followed by Witir.',
      how:['Sleep first, then wake and take wudhu.','Pray sets of 2 rakaat like a normal 2-rakaat prayer.','Close the night with Witir if you have not prayed it yet.'],
      niat:['Usolli sunnatat-Tahajjudi rak‘ataini lillāhi ta‘ālā','Sahaja aku solat sunat Tahajjud dua rakaat kerana Allah Taala.'],
      src:null },
    tarawih: { t:'Solat Sunat Tarawih', hukum:'Sunat, only in Ramadan.', when:'After Isyak and its 2-rakaat ba’diyah, on every night of Ramadan.', rakaat:'Most Malaysians pray 20 rakaat; some pray 8. Pray 2 rakaat per takbiratul ihram (salam every 2).',
      how:['Each set of 2 is like a normal 2-rakaat prayer.','In congregation, the bilal leads selawat and zikir between sets.','Finish with Witir, commonly 3 rakaat (2 + 1).','It may also be prayed alone at home.'],
      niat:['Sahaja aku solat sunat Tarawih dua rakaat (sebagai makmum) kerana Allah Taala.'],
      src:['jakimTarawih','irsyad143'] },
    raya: { t:'Solat Sunat Hari Raya', hukum:'Sunat muakkad.', when:'Morning of 1 Syawal (Aidilfitri) or 10 Zulhijjah (Aidiladha), after the sun has risen, before Zohor. Your mosque announces the time.', rakaat:'2 rakaat, then 2 khutbah if in congregation.',
      how:['After takbiratul ihram and doa iftitah, say 7 extra takbir before Al-Fatihah in the 1st rakaat.','In the 2nd rakaat, say 5 extra takbir before Al-Fatihah.','Between each takbir, recite: Subhānallāh, walhamdulillāh, wa lā ilāha illallāh, wallāhu akbar.','The rest is like a normal 2-rakaat prayer. Listen to the khutbah afterwards.','Aidilfitri: eat something before leaving. Takbir raya is said from sunset on the eve until the prayer starts.'],
      niat:['Sahaja aku solat sunat Hari Raya Aidilfitri (atau Aidiladha) dua rakaat kerana Allah Taala.'],
      src:['perakRaya','pahangRaya'] },
    tahiyyat: { t:'Solat Sunat Tahiyyatul Masjid', hukum:'Sunat.', when:'Whenever you enter a mosque, before sitting down.', rakaat:'2 rakaat.',
      how:['Pray 2 rakaat like a normal 2-rakaat prayer.','If you arrive during the Friday khutbah, you may still pray it but keep it short.','Praying a fardhu or rawatib on arrival also counts for it.'],
      niat:['Sahaja aku solat sunat Tahiyyatul Masjid dua rakaat kerana Allah Taala.'],
      src:null },
    istikharah: { t:'Solat Sunat Istikharah', hukum:'Sunat.', when:'Any time except the forbidden times (e.g. after Subuh until sunrise, after Asar until sunset). Night is preferred.', rakaat:'2 rakaat.',
      how:['Pray 2 rakaat like a normal 2-rakaat prayer.','After salam, recite the doa istikharah taught by the Prophet SAW (Sahih al-Bukhari), naming your matter.','You do not need a dream as an answer. Go ahead with what Allah makes easy, and also seek advice from experienced people.','It can be repeated.'],
      niat:['Sahaja aku solat sunat Istikharah dua rakaat kerana Allah Taala.'],
      src:['irsyad356'] },
    hajat: { t:'Solat Sunat Hajat', hukum:'Sunat.', when:'Any time outside the forbidden times. Night is preferred.', rakaat:'2 rakaat, or more in sets of 2.',
      how:['Pray 2 rakaat like a normal 2-rakaat prayer.','After salam, praise Allah, send selawat, then ask Allah for your need in your own words.'],
      niat:['Sahaja aku solat sunat Hajat dua rakaat kerana Allah Taala.'],
      src:null },
    taubat: { t:'Solat Sunat Taubat', hukum:'Sunat.', when:'As soon as possible after a sin, outside the forbidden times.', rakaat:'2 rakaat.',
      how:['Pray 2 rakaat like a normal 2-rakaat prayer.','After salam, ask forgiveness sincerely (istighfar). Regret the sin, stop it, and resolve not to repeat it. If it wronged someone, make it right with them.'],
      niat:['Sahaja aku solat sunat Taubat dua rakaat kerana Allah Taala.'],
      src:null },
    gerhana: { t:'Solat Sunat Gerhana', hukum:'Sunat muakkad.', when:'While a solar (kusuf) or lunar (khusuf) eclipse is visible in your area. Mosques announce it.', rakaat:'2 rakaat. Each rakaat has 2 standings, 2 Al-Fatihah and 2 ruku.',
      how:['Rakaat 1: Al-Fatihah and a surah, ruku, rise, then Al-Fatihah and a surah again, ruku again, i’tidal, then 2 sujud as normal.','Rakaat 2: the same pattern, then tahiyyat and salam.','The first standing and ruku of each rakaat are longer than the second.','In congregation, 2 khutbah follow the prayer.'],
      niat:['Sahaja aku solat sunat Gerhana Matahari (atau Bulan) dua rakaat kerana Allah Taala.'],
      src:null },
    jenazah: { t:'Solat Jenazah', hukum:'Fardhu kifayah (obligatory on the community, fulfilled if some perform it).', when:'After the body has been washed and shrouded.', rakaat:'4 takbir, all standing. No ruku, sujud or sitting.',
      how:['Takbir 1 (with niat): recite Al-Fatihah.','Takbir 2: recite selawat for the Prophet SAW.','Takbir 3: doa for the deceased, e.g. Allāhummaghfir lahu warhamhu (lahā for a woman).','Takbir 4: doa for the deceased and the living.','Give salam to the right and left.'],
      niat:['Sahaja aku solat atas jenazah lelaki (atau perempuan) ini empat takbir fardhu kifayah kerana Allah Taala.'],
      src:['jenazahKKM'] },
  };

  // ---------------- Rukun Islam & Rukun Iman ----------------
  const RUKUN_ISLAM = [
    ['Syahadah','Declaring the two testimonies of faith: there is no god but Allah, and Muhammad is the Messenger of Allah.'],
    ['Solat','Performing the five daily obligatory prayers.'],
    ['Zakat','Paying the obligatory alms (zakat fitrah and zakat harta) when conditions are met.'],
    ['Puasa','Fasting in the month of Ramadan.'],
    ['Haji','Performing the pilgrimage to Makkah once in a lifetime, for those who are able.'],
  ];
  const RUKUN_IMAN = [
    ['Allah','Believing in Allah, the One God.'],
    ['Malaikat','Believing in His angels.'],
    ['Kitab','Believing in His revealed books (Taurat, Zabur, Injil and Al-Quran).'],
    ['Rasul','Believing in His messengers.'],
    ['Hari Akhirat','Believing in the Last Day.'],
    ['Qada’ dan Qadar','Believing in divine decree, both the good and the bad.'],
  ];


  // ---------------- Doa for the end and start of the Hijri year ----------------
  const DOA = [
    { id:'akhir', t:'Doa Akhir Tahun (end of year)', when:'On the last day of Zulhijjah, after Asar and before Maghrib. Commonly recited 3 times.',
      ar:"اَللّٰهُمَّ مَا عَمِلْتُ مِنْ عَمَلٍ فِي هٰذِهِ السَّنَةِ مَا نَهَيْتَنِي عَنْهُ وَلَمْ أَتُبْ مِنْهُ وَحَلُمْتَ فِيْها عَلَيَّ بِفَضْلِكَ بَعْدَ قُدْرَتِكَ عَلَى عُقُوْبَتِيْ وَدَعَوْتَنِيْ إِلَى التَّوْبَةِ مِنْ بَعْدِ جَرَاءَتِيْ عَلَى مَعْصِيَتِكَ فَإِنِّي اسْتَغْفَرْتُكَ فَاغْفِرْلِيْ وَمَا عَمِلْتُ فِيْهَا مِمَّا تَرْضَى وَوَعَدْتَّنِي عَلَيْهِ الثَّوَابَ فَأَسْئَلُكَ أَنْ تَتَقَبَّلَ مِنِّيْ وَلَا تَقْطَعْ رَجَائِيْ مِنْكَ يَا كَرِيْمُ",
      tr:'Allāhumma mā ‘amiltu min ‘amalin fī hādhihis-sanati mā nahaitanī ‘anhu wa lam atub minhu, wa ḥalumta fīhā ‘alayya bi faḍlika ba‘da qudratika ‘alā ‘uqūbatī, wa da‘autanī ilat-taubati min ba‘di jarā’atī ‘alā ma‘ṣiyatik, fa innī istaghfartuka faghfir lī. Wa mā ‘amiltu fīhā mimmā tarḍā wa wa‘adtanī ‘alaihith-thawāb, fa as’aluka an tataqabbala minnī, wa lā taqṭa‘ rajā’ī minka yā Karīm.',
      m:'O Allah, whatever I did this year that You had forbidden me, and have not yet repented from, while You were patient with me out of Your grace though You had the power to punish me, and You still called me to repent after I dared to disobey You: I seek Your forgiveness, so forgive me. And whatever I did this year that pleases You, for which You promised me reward, I ask You to accept it from me. Do not cut off my hope in You, O Most Generous.' },
    { id:'awal', t:'Doa Awal Tahun (start of year)', when:'After Maghrib on the night of 1 Muharram, when the new year begins. Commonly recited 3 times.',
      ar:"اَللّٰهُمَّ أَنْتَ الأَبَدِيُّ القَدِيمُ الأَوَّلُ وَعَلَى فَضْلِكَ العَظِيْمِ وَكَرِيْمِ جُوْدِكَ المُعَوَّلُ، وَهٰذَا عَامٌ جَدِيْدٌ قَدْ أَقْبَلَ، أَسْأَلُكَ العِصْمَةَ فِيْهِ مِنَ الشَّيْطَانِ وَأَوْلِيَائِهِ، وَالعَوْنَ عَلَى هٰذِهِ النَّفْسِ الأَمَّارَةِ بِالسُّوْءِ، وَالاِشْتِغَالَ بِمَا يُقَرِّبُنِيْ إِلَيْكَ زُلْفَى يَا ذَا الجَلَالِ وَالإِكْرَامِ",
      tr:'Allāhumma antal-abadiyyul-qadīmul-awwal, wa ‘alā faḍlikal-‘aẓīmi wa karīmi jūdikal-mu‘awwal. Wa hādhā ‘āmun jadīdun qad aqbal. As’alukal-‘iṣmata fīhi minash-shaiṭāni wa auliyā’ih, wal-‘auna ‘alā hādhihin-nafsil-ammārati bis-sū’, wal-ishtighāla bimā yuqarribunī ilaika zulfā, yā Dhal-Jalāli wal-Ikrām.',
      m:'O Allah, You are the Everlasting, the Eternal, the First. On Your immense grace and generous bounty we rely. This new year has arrived. I ask You to protect me in it from Satan and his allies, to help me against this soul that urges me to evil, and to keep me busy with what brings me closer to You, O Possessor of Majesty and Honour.',
      extra:{ ar:'اللَّهُمَّ يَا مُحَوِّلَ الْأَحْوَالِ حَوِّلْ حَالَنَا إِلَى أَحْسَنِ الْأَحْوَالِ', tr:'Allāhumma yā muḥawwilal-aḥwāl, ḥawwil ḥālanā ilā aḥsanil-aḥwāl.', m:'O Allah, Changer of all conditions, change our condition to the best of conditions.' } },
  ];


  // ---------------- Everyday doa ----------------
  // Quranic doa: Arabic copied from the Uthmani text (api.alquran.cloud). Hadith doa: short, widely taught wording, typed for this app.
  const DOA_GROUPS = [
    { h:'After prayer (wirid)', items:[
      { t:'Istighfar', when:'Straight after salam, 3 times.', ar:'أَسْتَغْفِرُ اللَّهَ', tr:'Astaghfirullāh', m:'I seek forgiveness from Allah.', ref:'Sahih Muslim 591' },
      { t:'Allāhumma antas-salām', when:'After the istighfar.', ar:'اللَّهُمَّ أَنْتَ السَّلَامُ، وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ', tr:'Allāhumma antas-salām, wa minkas-salām, tabārakta yā Dhal-Jalāli wal-Ikrām.', m:'O Allah, You are Peace and from You comes peace. Blessed are You, O Possessor of Majesty and Honour.', ref:'Sahih Muslim 591' },
      { t:'Tasbih, tahmid, takbir', when:'33 times each, then the closing line once. Use the Tasbih counter below.', ar:'سُبْحَانَ اللَّهِ · الْحَمْدُ لِلَّهِ · اللَّهُ أَكْبَرُ', tr:'Subḥānallāh (33) · Alḥamdulillāh (33) · Allāhu akbar (33), then: Lā ilāha illallāhu waḥdahū lā sharīka lah, lahul-mulku wa lahul-ḥamdu wa huwa ‘alā kulli shai’in qadīr.', m:'Glory be to Allah · All praise is for Allah · Allah is the Greatest. Then: There is no god but Allah alone, without partner. His is the dominion and His is the praise, and He has power over all things.', ref:'Sahih Muslim 597' },
      { t:'Ayat al-Kursi', when:'After each fardhu prayer.', surah:'2:255', ref:'Sunan an-Nasa’i al-Kubra 9848' },
      { t:'Rabbanā ātinā', when:'A comprehensive doa, often read to close.', ar:"رَبَّنَآ ءَاتِنَا فِى ٱلدُّنْيَا حَسَنَةًۭ وَفِى ٱلْءَاخِرَةِ حَسَنَةًۭ وَقِنَا عَذَابَ ٱلنَّارِ", tr:'Rabbanā ātinā fid-dunyā ḥasanah, wa fil-ākhirati ḥasanah, wa qinā ‘adhāban-nār.', m:'Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.', ref:'Quran, Al-Baqarah 2:201' },
    ]},
    { h:'Daily doa', items:[
      { t:'Before eating', when:'Before the first bite.', ar:'بِسْمِ اللَّهِ', tr:'Bismillāh. If you forgot, say when you remember: Bismillāhi awwalahū wa ākhirah.', m:'In the name of Allah. (If forgotten: In the name of Allah, at its beginning and its end.)', ref:'Sunan Abi Dawud 3767, Jami‘ at-Tirmidhi 1858' },
      { t:'After eating', when:'When you finish.', ar:'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ', tr:'Alḥamdulillāhil-ladhī aṭ‘amanā wa saqānā wa ja‘alanā muslimīn.', m:'All praise is for Allah, who fed us, gave us drink and made us Muslims.', ref:'Sunan Abi Dawud 3850, Jami‘ at-Tirmidhi 3457' },
      { t:'Leaving the house', when:'As you step out.', ar:'بِسْمِ اللَّهِ، تَوَكَّلْتُ عَلَى اللَّهِ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', tr:'Bismillāh, tawakkaltu ‘alallāh, wa lā ḥawla wa lā quwwata illā billāh.', m:'In the name of Allah, I rely on Allah, and there is no power or strength except with Allah.', ref:'Sunan Abi Dawud 5095, Jami‘ at-Tirmidhi 3426' },
      { t:'Riding a vehicle / travelling', when:'When you set off.', ar:"سُبْحَٰنَ ٱلَّذِى سَخَّرَ لَنَا هَٰذَا وَمَا كُنَّا لَهُۥ مُقْرِنِينَ وَإِنَّآ إِلَىٰ رَبِّنَا لَمُنقَلِبُونَ", tr:'Subḥānal-ladhī sakhkhara lanā hādhā wa mā kunnā lahū muqrinīn, wa innā ilā rabbinā lamunqalibūn.', m:'Glory be to the One who made this subservient to us, for we could not have done it ourselves. And to our Lord we will surely return.', ref:'Quran, Az-Zukhruf 43:13-14; Sahih Muslim 1342' },
      { t:'Entering the toilet', when:'Before entering (say it outside).', ar:'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْخُبُثِ وَالْخَبَائِثِ', tr:'Allāhumma innī a‘ūdhu bika minal-khubuthi wal-khabā’ith.', m:'O Allah, I seek refuge in You from evil and evil beings.', ref:'Sahih al-Bukhari 142, Sahih Muslim 375' },
      { t:'Leaving the toilet', when:'After stepping out.', ar:'غُفْرَانَكَ', tr:'Ghufrānak.', m:'(I ask) Your forgiveness.', ref:'Sunan Abi Dawud 30, Jami‘ at-Tirmidhi 7' },
      { t:'Before sleeping', when:'Lying down to sleep.', ar:'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا', tr:'Bismika Allāhumma amūtu wa aḥyā.', m:'In Your name, O Allah, I die and I live.', ref:'Sahih al-Bukhari 6324' },
      { t:'Waking up', when:'On waking.', ar:'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ', tr:'Alḥamdulillāhil-ladhī aḥyānā ba‘da mā amātanā wa ilaihin-nushūr.', m:'All praise is for Allah, who gave us life after causing us to die, and to Him is the return.', ref:'Sahih al-Bukhari 6324' },
    ]},
    { h:'For parents', items:[
      { t:'Mercy for parents', when:'Any time, especially after prayer.', ar:"رَّبِّ ٱرْحَمْهُمَا كَمَا رَبَّيَانِى صَغِيرًۭا", tr:'Rabbir-ḥamhumā kamā rabbayānī ṣaghīrā.', m:'My Lord, have mercy on them as they raised me when I was small.', ref:'Quran, Al-Isra’ 17:24' },
      { t:'Forgiveness for parents and believers', when:'Any time.', ar:"رَبَّنَا ٱغْفِرْ لِى وَلِوَٰلِدَىَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ ٱلْحِسَابُ", tr:'Rabbanagh-fir lī wa liwālidayya wa lil-mu’minīna yauma yaqūmul-ḥisāb.', m:'Our Lord, forgive me, my parents and the believers on the Day the reckoning is established.', ref:'Quran, Ibrahim 14:41' },
    ]},
  ];

  // ---------------- surahs (ayah counts per the standard Uthmani mushaf) ----------------
  const SURAHS = [
    { n:1, ref:'1', name:'Al-Fatihah', en:'The Opening', ayat:7, note:'Required in every rakaat' },
    { n:255, ref:'2:255', name:'Ayat al-Kursi', en:'Al-Baqarah, verse 255', ayat:1, note:'Often read after prayer', ayah:true },
    { n:36, ref:'36', name:'Yasin', en:'Ya Sin', ayat:83, note:'Commonly read on Thursday nights' },
    { n:18, ref:'18', name:'Al-Kahf', en:'The Cave', ayat:110, note:'Sunnah to read on Friday' },
    { n:97, ref:'97', name:'Al-Qadr', en:'The Night of Decree', ayat:5 },
    { n:102, ref:'102', name:'At-Takathur', en:'Rivalry in Worldly Increase', ayat:8 },
    { n:103, ref:'103', name:'Al-‘Asr', en:'Time', ayat:3 },
    { n:105, ref:'105', name:'Al-Fil', en:'The Elephant', ayat:5 },
    { n:106, ref:'106', name:'Quraisy', en:'Quraysh', ayat:4 },
    { n:107, ref:'107', name:'Al-Ma‘un', en:'Small Kindnesses', ayat:7 },
    { n:108, ref:'108', name:'Al-Kauthar', en:'Abundance', ayat:3, note:'Shortest surah' },
    { n:109, ref:'109', name:'Al-Kafirun', en:'The Disbelievers', ayat:6 },
    { n:110, ref:'110', name:'An-Nasr', en:'Divine Help', ayat:3 },
    { n:111, ref:'111', name:'Al-Masad', en:'Palm Fibre', ayat:5 },
    { n:112, ref:'112', name:'Al-Ikhlas', en:'Sincerity', ayat:4 },
    { n:113, ref:'113', name:'Al-Falaq', en:'Daybreak', ayat:5 },
    { n:114, ref:'114', name:'An-Nas', en:'Mankind', ayat:6 },
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


  // ---------------- styles ----------------
  const css = document.createElement('style');
  css.textContent = `
    .seg{display:flex;gap:6px;margin-bottom:12px;overflow-x:auto}
    .seg button{flex:1;padding:8px 6px;font-size:14px;white-space:nowrap}
    .seg button.on{background:var(--acc);color:var(--onacc)}
    .gh{font-size:13px;color:var(--mut);font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:4px 0 8px}
    .ty{padding:10px 0;border-bottom:1px solid var(--line)}
    .ty:last-child{border-bottom:0}
    .ty b{font-size:16px} .ty .rk{float:right;font-size:13px;color:var(--acc);font-weight:700}
    .ty div{font-size:13px;color:var(--mut);margin-top:3px;line-height:1.45}
    .step{display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--line)}
    .step:last-child{border-bottom:0}
    .pose{width:84px;height:84px;flex-shrink:0;background:var(--bg);border-radius:14px}
    .step b{font-size:16px;display:block;margin-bottom:4px}
    .step p{font-size:13px;color:var(--txt2);line-height:1.5}
    .ar{font-family:"Amiri","Geeza Pro","Traditional Arabic",serif;direction:rtl;text-align:right;font-size:24px;line-height:1.9;color:var(--txt);margin-top:6px}
    .tr{font-size:13px;font-style:italic;color:var(--acc);margin-top:4px;line-height:1.5}
    .mn{font-size:13px;color:var(--mut);margin-top:3px;line-height:1.5}
    .lnk{background:none;padding:6px 0 0;color:var(--ok);font-size:13px}
    .niat{padding:8px 0;border-bottom:1px solid var(--line)} .niat:last-child{border-bottom:0}
    .niat b{font-size:14px}
    .wd{display:flex;gap:10px;padding:9px 0;border-bottom:1px solid var(--line);font-size:14px;line-height:1.45}
    .wd:last-child{border-bottom:0}
    .wd .no{width:24px;height:24px;border-radius:12px;background:var(--line);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0}
    .wd span{color:var(--mut)}
    .fard{font-size:10px;font-weight:700;padding:2px 6px;border-radius:6px;background:var(--hl);color:var(--ok);margin-left:6px}
    .sl{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--line);cursor:pointer}
    .sl:last-child{border-bottom:0}
    .sl .num{width:36px;height:36px;border-radius:10px;background:var(--line);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0}
    .sl .nm{flex:1} .sl .nm b{font-size:16px} .sl .nm div{font-size:12px;color:var(--mut)}
    .sl .go{color:var(--mut);font-size:20px}
    .ayah{padding:12px 0;border-bottom:1px solid var(--line);border-radius:10px;transition:background .2s}
    .ayah.playing{background:var(--hl)}
    .ayah .no{font-size:11px;color:var(--mut);font-weight:700}
    .bism{text-align:center;direction:rtl;font-family:"Amiri","Geeza Pro",serif;font-size:24px;margin:6px 0 4px}
    .ctl{display:flex;gap:8px;margin:10px 0}
    .ctl button{flex:1}
    .seg{flex-wrap:wrap;overflow:visible} .seg button{flex:1 1 auto;padding:8px 10px}
    .ty.tap{cursor:pointer} .ty.tap:active{background:var(--line)}
    .kv{display:flex;gap:10px;padding:6px 0;font-size:14px;line-height:1.45} .kv span{width:64px;flex-shrink:0;color:var(--mut);font-size:12px;font-weight:700;text-transform:uppercase;padding-top:2px}
    .ol{padding-left:20px;font-size:14px;line-height:1.55;color:var(--txt2)} .ol li{margin:4px 0}
    .srcs{margin-top:14px;padding-top:10px;border-top:1px solid var(--line);font-size:12px;color:var(--mut);line-height:1.5}
    .srcs b{display:block;margin-bottom:4px;color:var(--txt)} .srcs a{display:block;color:var(--ok);text-decoration:none;margin:3px 0}
    .fl{display:block;font-size:13px;color:var(--mut);margin:12px 0 6px;font-weight:600}
    .row2{display:flex;gap:8px} .row2 input{flex:1}
    input{font:inherit;font-size:16px;width:100%;border:1px solid var(--line);border-radius:12px;padding:10px 12px;background:var(--bg);color:var(--txt)}
    .res{margin-top:12px;border-radius:14px;padding:12px;font-size:14px;line-height:1.5}
    .res b{font-size:18px;display:block;margin-bottom:4px} .res p{margin-top:6px}
    .res.ok{background:rgba(95,211,154,.14);border:1px solid rgba(95,211,154,.45)} .res.ok b{color:var(--ok)}
    .res.dep{background:rgba(232,198,106,.14);border:1px solid rgba(232,198,106,.45)} .res.dep b{color:var(--acc)}
    .res.no{background:rgba(255,120,120,.12);border:1px solid rgba(255,120,120,.4)} .res.no b{color:#e06666}
    .doa{padding:12px 0;border-bottom:1px solid var(--line)} .doa:last-child{border-bottom:0} .doa b{font-size:16px}
    .ref{font-size:11px;color:var(--mut);margin-top:6px;font-style:normal}
    .tbtn{width:100%;aspect-ratio:2.2;border-radius:20px;background:var(--hl);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}
    .tbtn:active{transform:scale(.98)} .tbtn .tn{font-size:44px;font-weight:800;color:var(--acc);font-variant-numeric:tabular-nums} .tbtn .tp{font-size:16px} .tbtn .tc{font-size:12px;color:var(--mut)}
    .lang{display:flex;gap:6px;margin-top:6px} .lang button{flex:1;padding:6px;font-size:13px} .lang button.on{background:var(--acc);color:var(--onacc)}
  `;
  document.head.appendChild(css);
  const font = document.createElement('link'); font.rel='stylesheet';
  font.href='https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap'; document.head.appendChild(font);

  // ---------------- render ----------------
  const root = $('guideRoot');
  let view = 'types';

  function seg(){
    const on = k => view===k || (view==='surah'&&k==='surahs') || (view==='sunat'&&k==='types');
    return `<div class="seg">${[['types','Types'],['howto','How to pray'],['wudhu','Wudhu'],['rukun','Rukun'],['doa','Doa'],['surahs','Surahs'],['travel','Travel']]
      .map(([k,l])=>`<button data-v="${k}" class="${on(k)?'on':''}">${l}</button>`).join('')}</div>`;
  }
  function vTypes(){
    return TYPES.map(g=>`<div class="card"><div class="gh">${g.h}</div>${g.items.map(([n,r,d,key])=>
      `<div class="ty${key?' tap':''}" ${key?(key==='travel'?'data-v="travel"':`data-k="${key}"`):''}><span class="rk">${r}${key?' ›':''}</span><b>${n}</b><div>${d}</div></div>`).join('')}</div>`).join('');
  }
  function vSunat(key){
    const s = SUNAT[key];
    return `<div class="card"><button class="lnk" data-v="types">‹ All types</button>
      <div style="margin:6px 0 10px"><b style="font-size:20px">${s.t}</b></div>
      <div class="kv"><span>Ruling</span><div>${s.hukum}</div></div>
      <div class="kv"><span>When</span><div>${s.when}</div></div>
      <div class="kv"><span>Rakaat</span><div>${s.rakaat}</div></div>
      <div class="gh" style="margin-top:14px">How it is done</div>
      <ol class="ol">${s.how.map(h=>`<li>${h}</li>`).join('')}</ol>
      <div class="gh" style="margin-top:14px">Niat (said softly; the intention is in the heart)</div>
      ${s.niat.map(n=>`<div class="tr">${n}</div>`).join('')}
      ${key!=='jenazah'?'<button class="lnk" data-v="howto">See the basic 2-rakaat steps ›</button>':''}
      ${s.src?srcHtml(s.src):UNVERIFIED}</div>`;
  }
  function vHowto(){
    const steps = STEPS.map(s=>`<div class="step">${POSE[s.p]}<div style="flex:1;min-width:0"><b>${s.t}</b><p>${s.d}</p>
      ${s.ar?`<div class="ar">${s.ar}</div>`:''}${s.tr?`<div class="tr">${s.tr}</div>`:''}${s.m?`<div class="mn">${s.m}</div>`:''}
      ${s.link?`<button class="lnk" data-v="surahs">${s.link} ›</button>`:''}</div></div>`).join('');
    const niat = NIAT.map(([n,t,m])=>`<div class="niat"><b>${n}</b><div class="tr">${t}</div><div class="mn">${m}</div></div>`).join('');
    return `<div class="card"><div class="gh">Step by step (2 rakaat, e.g. Subuh)</div>
      <p class="mn" style="margin-bottom:6px">For Maghrib (3) and Zohor, Asar, Isyak (4): sit for the first tahiyyat after rakaat 2, then stand and complete the remaining rakaat with Al-Fatihah only.</p>${steps}</div>
      <div class="card"><div class="gh">Niat for the 5 daily prayers</div>${niat}
      <p class="mn" style="margin-top:8px">The niat itself is in the heart. Saying it softly beforehand is sunat in the Shafi’i school.</p>${UNVERIFIED}</div>`;
  }
  function vWudhu(){
    return `<div class="card"><div class="gh">How to take wudhu</div>${WUDHU.map(([t,d,f],i)=>
      `<div class="wd"><div class="no">${i+1}</div><div><b>${t}</b>${f?'<span class="fard">Required</span>':''}<br><span>${d}</span></div></div>`).join('')}
      <p class="mn" style="margin-top:10px">Steps marked Required are the 6 fardhu of wudhu. The rest are sunat. Wudhu is broken by using the toilet, passing wind, deep sleep, losing consciousness, and (in the Shafi’i school) skin contact between a man and a woman who are not mahram.</p>${UNVERIFIED}</div>`;
  }
  function vRukun(){
    const list = (arr, cls) => arr.map(([t,d],i)=>`<div class="wd"><div class="no ${cls}">${i+1}</div><div><b>${t}</b><br><span>${d}</span></div></div>`).join('');
    return `<div class="card"><div class="gh">Rukun Islam · 5 pillars of practice</div>${list(RUKUN_ISLAM,'')}
      <p class="mn" style="margin-top:8px">From the hadith “Islam is built on five” (Sahih al-Bukhari 8, Sahih Muslim 16).</p></div>
      <div class="card"><div class="gh">Rukun Iman · 6 pillars of faith</div>${list(RUKUN_IMAN,'')}
      <p class="mn" style="margin-top:8px">From the hadith of Jibril (Sahih Muslim 8).</p></div>`;
  }
  function vSurahs(){
    return `<div class="card"><div class="gh">Surahs</div>${SURAHS.map(s=>
      `<div class="sl" data-s="${s.ref}"><div class="num">${s.ayah?'2:255':s.n}</div><div class="nm"><b>${s.name}</b><div>${s.en} · ${s.ayat} ${s.ayat===1?'ayat':'ayat'}${s.note?` · ${s.note}`:''}</div></div><div class="go">›</div></div>`).join('')}
      <p class="mn" style="margin-top:8px">Arabic text: standard Uthmani script. Malay meaning: Tafsir Pimpinan Ar-Rahman by Abdullah Basmeih, the translation published by JAKIM. English (optional): Sahih International, which is not a JAKIM publication. Recitation by Mishary Rashid Alafasy. Needs internet the first time; text is then saved for offline reading.</p>
      ${srcHtml(['basmeih'])}</div>`;
  }

  function doaItem(d){
    if(d.surah) return `<div class="doa"><b>${d.t}</b><div class="mn">${d.when}</div><button class="lnk" data-s="${d.surah}">Open Ayat al-Kursi with audio ›</button><div class="ref">${d.ref}</div></div>`;
    return `<div class="doa"><b>${d.t}</b><div class="mn">${d.when}</div><div class="ar">${d.ar}</div><div class="tr">${d.tr}</div><div class="mn">${d.m}</div>${d.ref?`<div class="ref">${d.ref}</div>`:''}</div>`;
  }
  function vDoa(){
    const groups = DOA_GROUPS.map(g=>`<div class="card"><div class="gh">${g.h}</div>${g.items.map(doaItem).join('')}
      ${g.h.startsWith('After prayer')?tasbihHtml():''}</div>`).join('');
    const year = `<div class="card"><div class="gh">Hijri new year</div>` + DOA.map(d=>`<div class="doa"><b>${d.t}</b>
      <div class="mn">${d.when}</div>
      <div class="ar">${d.ar}</div><div class="tr">${d.tr}</div><div class="mn">${d.m}</div>
      ${d.extra?`<div class="mn" style="margin-top:10px;font-weight:700">Closing line used in Malaysia</div>
        <div class="ar">${d.extra.ar}</div><div class="tr">${d.extra.tr}</div><div class="mn">${d.extra.m}</div>`:''}
      </div>`).join('') + `<p class="mn" style="margin-top:8px">From the collection Maslakul Akhyar, recited in Malaysian mosques at the turn of the Hijri year. They are general supplications rather than a fixed sunnah.</p>${srcHtml(['nsDoa','nuDoa'])}</div>`;
    return groups + year + `<div class="card"><p class="mn">Hadith and Quran references are given under each doa. The Quranic Arabic is copied from the standard Uthmani text. The short hadith doa are the wording widely taught in Malaysia, typed for this app, so have an ustaz check them before sharing. English meanings are written for this app.</p></div>`;
  }
  // ---------------- Tasbih counter ----------------
  let tas = store.get('tasbih') || {n:0,total:0};
  function tasbihHtml(){
    const phase = tas.n<33?'Subḥānallāh':tas.n<66?'Alḥamdulillāh':tas.n<99?'Allāhu akbar':'Lā ilāha illallāh… (once)';
    return `<div class="tasbih"><div class="gh" style="margin-top:6px">Tasbih counter</div>
      <button class="tbtn" id="tasBtn"><span class="tn">${tas.n}</span><span class="tp">${phase}</span><span class="tc">${Math.min(tas.n%33||((tas.n>0&&tas.n<100)?33:0),33)} / 33</span></button>
      <div class="row2" style="margin-top:8px"><button id="tasReset">Reset</button><div class="mn" style="align-self:center">Total today: <b id="tasTot">${tas.total}</b></div></div></div>`;
  }
  function wireTasbih(){
    const b=$('tasBtn'); if(!b) return;
    b.onclick=()=>{ tas.n = tas.n>=100?1:tas.n+1; tas.total++; store.set('tasbih',tas);
      try{ document.getElementById('hapLbl').click(); }catch(e){} try{ navigator.vibrate&&navigator.vibrate(tas.n%33===0?[60,40,60]:15); }catch(e){}
      const v=b.closest('.tasbih'); v.outerHTML=tasbihHtml(); wireTasbih(); };
    $('tasReset').onclick=()=>{ tas.n=0; store.set('tasbih',tas); const v=$('tasBtn').closest('.tasbih'); v.outerHTML=tasbihHtml(); wireTasbih(); };
  }

  // ---------------- Jamak & Qasar checker ----------------
  const MARHALAH_KM = 81;
  // Trip purposes. 'ok' = permissible, 'dep' = depends on what the event involves, 'sin' = sinful purpose.
  const PURPOSES = [
    ['Work & business', [['Business trip / outstation work','ok'],['Client or partner meeting','ok'],['Conference or convention','ok'],['Exhibition or trade fair (exhibiting or visiting)','ok'],['Training, course or seminar','ok'],['Site visit, inspection or audit','ok'],['Job interview','ok'],['Driving for work (lorry, bus, e-hailing, delivery)','ok'],['Posting or transfer to a new workplace','ok']]],
    ['Study', [['Going back to campus / hostel','ok'],['Exam or test','ok'],['School or university trip','ok'],['Convocation','ok'],['Student competition or camp','ok']]],
    ['Family & social', [['Balik kampung','ok'],['Visiting parents, family or friends','ok'],['Wedding or kenduri','ok'],['Hari Raya visits (ziarah raya)','ok'],['Funeral or tahlil','ok'],['Visiting someone who is sick','ok'],['Birth of a child / berpantang','ok']]],
    ['Religious', [['Umrah or Haji','ok'],['Religious talk, ceramah or kuliah','ok'],['Visiting mosques or Islamic heritage sites','ok'],['Tahfiz or pondok studies','ok'],['Dakwah or religious programme','ok']]],
    ['Health', [['Medical treatment or hospital appointment','ok'],['Accompanying a family member for treatment','ok'],['Rehab or therapy','ok']]],
    ['Holiday & leisure', [['Holiday / vacation','ok'],['Sightseeing','ok'],['Beach, island or nature trip','ok'],['Hiking, camping or outdoor activity','ok'],['Theme park or family attraction','ok'],['Food trip','ok'],['Shopping trip','ok'],['Honeymoon','ok']]],
    ['Sports', [['Competing in a sports event','ok'],['Watching a sports match','ok'],['Marathon, fun run or cycling event','ok'],['Fishing trip','ok'],['Sports training camp','ok']]],
    ['Events & entertainment', [['Book fair or education fair','ok'],['Car show, tech or hobby expo','ok'],['Cultural or heritage festival','ok'],['Concert or music festival','dep'],['Other entertainment event','dep']]],
    ['Personal matters', [['Government or legal matters (JPN, court, embassy)','ok'],['Moving house','ok'],['Buying or selling a car or property','ok'],['Collecting or delivering goods','ok'],['Volunteering, charity or disaster relief','ok']]],
    ['Other', [['Other permissible purpose','ok'],['A trip whose purpose is sinful','sin']]],
  ];
  let trip = { km:null, label:'' };
  function vTravel(){
    return `<div class="card"><div class="gh">Can I jamak and qasar?</div>
      <p class="mn">Distance is measured one way, from your home area to your destination.</p>
      <label class="fl">Where are you going?</label>
      <div class="row2"><input id="tDest" placeholder="e.g. Ipoh, Kuala Lumpur, Johor Bahru" autocomplete="off"><button class="pri" id="tFind">Find</button></div>
      <label class="fl">Starting from</label>
      <select id="tFrom"><option value="gps">My current location</option><option value="town">My home town (type below)</option></select>
      <input id="tHome" class="hide" placeholder="Your home town, e.g. Sungai Petani" autocomplete="off" style="margin-top:6px">
      <div id="tDist" class="mn" style="margin-top:8px"></div>
      <label class="fl">Or type the distance yourself (km)</label>
      <input id="tKm" type="number" inputmode="decimal" placeholder="e.g. 120">
      <label class="fl">Purpose of the trip</label>
      <select id="tPurpose">${PURPOSES.map(([g,items])=>`<optgroup label="${g}">${items.map(([l,v])=>`<option value="${v}|${l}">${l}</option>`).join('')}</optgroup>`).join('')}</select>
      <label class="fl">How long will you stay at the destination?</label>
      <p class="mn" style="margin-bottom:6px">Count full days only. The day you arrive and the day you leave are not counted. Choose "Not sure yet" if you will leave as soon as your business is done.</p>
      <select id="tStay">
        <option value="short">Up to 3 days</option>
        <option value="long">4 days or more</option>
        <option value="unsure">Not sure yet</option>
      </select>
      <button class="pri" id="tCheck" style="width:100%;margin-top:12px">Check</button>
      <div id="tResult"></div></div>`;
  }
  async function geocode(q){
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=en&q=${encodeURIComponent(q)}`);
    const j = await r.json(); if(!j.length) throw new Error('notfound');
    return { lat:+j[0].lat, lng:+j[0].lon, name:j[0].display_name.split(',').slice(0,2).join(',') };
  }
  function haversine(a,b){ const R=6371, r=x=>x*Math.PI/180; const dLat=r(b.lat-a.lat), dLng=r(b.lng-a.lng);
    const h=Math.sin(dLat/2)**2+Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(dLng/2)**2; return 2*R*Math.asin(Math.sqrt(h)); }
  async function findTrip(){
    const out=$('tDist'); const q=$('tDest').value.trim(); if(!q){ out.textContent='Type a destination first.'; return; }
    out.textContent='Looking up the route…';
    try{
      let from;
      if($('tFrom').value==='town'){ const h=$('tHome').value.trim(); if(!h){ out.textContent='Type your home town, or choose current location.'; return; } from = await geocode(h); }
      else { const p = store.get('pos'); if(!p){ out.textContent='Location not available yet. Open the Today tab first, or type your home town.'; return; } from = {lat:p.lat,lng:p.lng}; }
      const to = await geocode(q);
      let km=null, how='by road';
      try{
        const ctl=new AbortController(); const to8=setTimeout(()=>ctl.abort(),8000);
        const r = await fetch(`https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`,{signal:ctl.signal});
        clearTimeout(to8);
        const j = await r.json(); if(j.code==='Ok') km = j.routes[0].distance/1000;
      }catch(e){}
      if(km==null){ km = haversine(from,to); how='in a straight line. The road distance could not be fetched and is usually longer'; }
      trip = { km, label: to.name };
      $('tKm').value = Math.round(km);
      out.innerHTML = `<b>${to.name}</b>: about <b>${Math.round(km)} km</b> ${how}. Check this looks right, and edit the km if needed.`;
    }catch(e){ out.textContent = e.message==='notfound' ? 'Place not found. Try a bigger town name.' : 'Could not look up the route. Check your internet, or type the km yourself.'; }
  }
  function checkTrip(){
    const km = parseFloat($('tKm').value); const out=$('tResult');
    if(!(km>0)){ out.innerHTML='<p class="mn" style="margin-top:10px">Enter a destination or a distance first.</p>'; return; }
    const [purpose, plabel] = $('tPurpose').value.split('|'), stay=$('tStay').value;
    let ok = km >= MARHALAH_KM && purpose!=='sin';
    let cls = 'ok';
    let head, body=[];
    if(purpose==='sin'){ cls='no'; head='Not eligible'; body.push('Jamak and qasar are a concession (rukhsah) for permissible travel. They do not apply to a journey made for a sinful purpose.'); }
    else if(km < MARHALAH_KM){ cls='no'; head='Not eligible'; body.push(`At about ${Math.round(km)} km, the trip is under 2 marhalah (${MARHALAH_KM} km). Pray each prayer in full and on time.`); }
    else {
      head='Eligible';
      if(purpose==='dep'){ head='Depends on the event'; cls='dep';
        body.push(`The distance qualifies. For “${plabel}”, eligibility depends on what the event involves: the concession (rukhsah) applies only if the main purpose of the trip is permissible. If unsure, ask your state’s Jabatan Mufti before relying on it.`); }
      body.push(`At about ${Math.round(km)} km, the trip is over 2 marhalah (${MARHALAH_KM} km), so you may jamak and qasar once you have left your town or village area.`);
      if(km < 90) body.push('Note: this is close to the limit. 81 km is gazetted in Johor and Perak and used by Pejabat Mufti WP, but one Mufti WP article calculates 2 marhalah as about 89 to 90 km. If unsure, follow your state’s fatwa.');
      if(stay==='short') body.push('At the destination you may continue for up to 3 full days, not counting the day you arrive and the day you leave.');
      if(stay==='long') body.push('Because you intend to stay 4 full days or more, you may only jamak and qasar on the way there. From the moment you arrive, pray in full until you set off home.');
      if(stay==='unsure') body.push('If you do not know how long your business will take, you may continue for up to 18 days (not counting arrival and departure days), as long as you intend to leave once it is done.');
      body.push('On the way back you may jamak and qasar again until you re-enter your home area.');
    }
    const rules = ok ? `<div class="gh" style="margin-top:12px">How to do it</div><ol class="ol">
      <li>Qasar: shorten the 4-rakaat prayers (Zohor, Asar, Isyak) to 2 rakaat. Subuh and Maghrib stay as they are.</li>
      <li>Jamak: combine Zohor with Asar, and Maghrib with Isyak.</li>
      <li>Jamak taqdim (in the earlier prayer’s time): pray the earlier one first, intend jamak in that first prayer, and pray the second straight after.</li>
      <li>Jamak takhir (in the later prayer’s time): intend to delay while the first prayer’s time is still in, and still be travelling when you pray them.</li>
      <li>Once you are home, pray normally.</li></ol>` : '';
    out.innerHTML = `<div class="res ${cls}"><b>${head}</b>${body.map(b=>`<p>${b}</p>`).join('')}</div>${rules}
      <p class="mn" style="margin-top:8px">This is a guide based on Shafi’i rulings used in Malaysia, not a fatwa. Each state’s Jabatan Mufti has the final say.</p>
      ${srcHtml(['kafi255','kafi1177','kafi1181','kafi1197','kafi1690','perak81','johor81'])}`;
  }
  function wireTravel(){
    $('tFrom').onchange = () => $('tHome').classList.toggle('hide', $('tFrom').value!=='town');
    $('tFind').onclick = findTrip;
    $('tDest').onkeydown = e => { if(e.key==='Enter'){ e.preventDefault(); findTrip(); } };
    $('tCheck').onclick = checkTrip;
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
      <div style="margin-top:6px"><b style="font-size:20px">${s.name}</b><div class="mn">${s.en} · ${s.ayat} ayat</div></div>
      <div class="ctl"><button class="pri" id="playAll">▶ Play all</button></div>
      <div class="lang"><button data-l="ms">Bahasa Melayu (JAKIM)</button><button data-l="en">English</button></div>
      <div id="ayahs"><p class="mn" style="margin-top:12px">Loading…</p></div></div>`;
    let d;
    try{ d = await loadSurah(ref); }catch(e){ $('ayahs').innerHTML='<p class="mn" style="margin-top:12px">Could not load this surah. Connect to the internet once to download it.</p>'; return; }
    const lang = store.get('trLang') || 'ms';
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
    const V = {types:vTypes, howto:vHowto, wudhu:vWudhu, rukun:vRukun, doa:vDoa, surahs:vSurahs, travel:vTravel};
    root.innerHTML = seg() + (V[view]||vTypes)();
    if(view==='travel') wireTravel();
    if(view==='doa') wireTasbih();
  }
  root.addEventListener('click', e => {
    const v = e.target.closest('[data-v]'); if(v){ view = v.dataset.v; render(); window.scrollTo(0,0); return; }
    const s = e.target.closest('[data-s]'); if(s){ view='surah'; stopAudio(); vSurah(s.dataset.s); window.scrollTo(0,0); return; }
    const k = e.target.closest('[data-k]'); if(k){ view='sunat'; stopAudio(); root.innerHTML = seg() + vSunat(k.dataset.k); window.scrollTo(0,0); }
  });
  document.addEventListener('visibilitychange', ()=>{ if(document.hidden) stopAudio(); });
  window.GUIDE = { openSurah(ref){ view='surah'; stopAudio(); vSurah(ref); }, openView(v){ view=v; render(); } };
  render();
})();
