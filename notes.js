// App version and patch notes.
// Every update: bump APP_VERSION and add an entry at the TOP of PATCH_NOTES (see CLAUDE.md).
window.APP_VERSION = '2.3';
window.PATCH_NOTES = [
  { v:'2.3', date:'2026-11-19', items:[
    'Prayer tracker on the Today tab: tick each prayer once its time starts, and see the last 7 days and your streak.',
    'If you tick Fajr, you will not get the "Fajr ends" reminder that day.',
    'Ramadan alerts: a Sahur wake-up before Imsak, an Imsak alert, and an Iftar alert at Maghrib. Turn each on or off in Settings.',
    'Hijri date adjustment in Settings: move the date by one day if your state announced a different date from JAKIM. Ramadan mode and Ramadan alerts follow it.',
  ]},
  { v:'2.2', date:'2026-11-19', items:[
    'Prayer notifications: get an alert at each prayer time, even with the app closed.',
    'Reminder before each prayer: choose 5, 10, 15 or 20 minutes before.',
    'A "Fajr ends" reminder before sunrise so you do not miss Subuh.',
    'On Fridays, the Dhuhr alert says Jumaat.',
    'Turn alerts on or off for each prayer in Settings, and send yourself a test.',
    'App version and these patch notes, with a "What\'s new" card after each update.',
  ]},
  { v:'2.1', date:'2026-11-19', items:[
    'Short doa added to the prayer guides: Jenazah, Witir, Dhuha, Hari Raya, Tahiyyatul Masjid, Istikharah, Hajat and Taubat.',
    'Solat Jenazah doa also listed in the Doa tab, including the doa for a child.',
  ]},
  { v:'2.0', date:'2026-11-09', items:[
    'New look: bottom tab bar, sky colours that follow the time of day, and a geometric pattern.',
    'Light mode and larger text options in Settings.',
    'Prayer timeline on the Today tab.',
    'Everyday doa and a tasbih counter.',
    'Friday mode with a Jumaat checklist and Al-Kahf shortcut.',
    'Nearby mosques, distance to Makkah, and zakat fitrah rates for every state.',
    'Better compass.',
  ]},
  { v:'1.4', date:'2026-11-09', items:[
    'Doa Akhir Tahun and Doa Awal Tahun, plus the Hijri year-end event.',
    'Trip purposes in the jamak and qasar checker are now grouped by category.',
  ]},
  { v:'1.3', date:'2026-11-08', items:[
    'New Guide tab: types of solat, how to pray step by step, wudhu, and surahs with recitation.',
    'Sunat prayer guides with sources, Rukun Islam and Rukun Iman, and Surah Yasin.',
    'Jamak and qasar checker for travel.',
    'Fixed the month view showing days in the wrong columns.',
  ]},
  { v:'1.2', date:'2026-11-08', items:[
    'Ramadan mode with Sahur and Iftar countdowns.',
    'Share today\'s times to WhatsApp.',
    'Malaysian Islamic events list, with a calendar you can subscribe to.',
    'A small vibration when you face the Qibla.',
  ]},
  { v:'1.1', date:'2026-11-08', items:[
    'English interface and a smoother compass.',
    'Works offline, monthly timetable, manual zone picker, Imsak and Dhuha times.',
    'Compass accuracy warning.',
    'Countdown to the next prayer and nearest town name.',
  ]},
  { v:'1.0', date:'2026-11-08', items:[
    'First version: JAKIM prayer times for your GPS zone and a Qibla compass.',
  ]},
];
