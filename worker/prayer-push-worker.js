// Waktu Solat push Worker (Cloudflare, free plan).
// Sends a phone notification at each prayer time, and an optional reminder a few minutes before,
// using standard Web Push. Prayer times are JAKIM's, from api.waktusolat.app, per zone.
//
// Bindings (Worker > Settings > Bindings):
//   DB     D1 database "qiblat-solat"
// Trigger (Worker > Settings > Triggers > Cron Triggers):
//   * * * * *      (every minute)
//
// Routes
//   GET  /key            -> { key }   public key the phone needs to subscribe
//   POST /subscribe      { sub, zone, prefs }   save or update this phone
//   POST /unsubscribe    { endpoint }
//   POST /test           { endpoint }  send a test notification to this phone only
//   POST /prayed         { endpoint, date, keys }  prayers ticked today (Fajr ticked = no "Fajr ends" reminder)
//
// prefs = { at: ["fajr","dhuhr",...], pre: ["fajr","syuruk",...], min: 10,
//           ram: { sahur: 45, imsak: true, iftar: true }, hadj: 0 }
//   at    prayers to notify at the exact time
//   pre   prayers to remind before (syuruk = "Fajr time is ending")
//   min   minutes before (5, 10, 15 or 20)
//   ram   Ramadan only: Sahur wake-up minutes before Imsak (0 = off), Imsak alert, Iftar alert
//   hadj  Hijri date adjustment in days (-1, 0 or +1), used to tell when Ramadan starts and ends
//
// Database migration for older installs: ALTER TABLE subs ADD COLUMN prayed TEXT

const ALLOWED_ORIGINS = ["https://nuhihsan.github.io"];
const APP_URL = "https://nuhihsan.github.io/qiblat-solat/";
const API = "https://api.waktusolat.app";
const TZ = "Asia/Kuala_Lumpur";
const KEYS = ["fajr", "syuruk", "dhuhr", "asr", "maghrib", "isha"];
const ALL_TIMES = ["imsak", ...KEYS];
const NAMES = { fajr: "Fajr", syuruk: "Sunrise", dhuhr: "Dhuhr", asr: "Asr", maghrib: "Maghrib", isha: "Isha" };
const PUSH_HOSTS = /^https:\/\/([a-z0-9-]+\.)*(fcm\.googleapis\.com|android\.googleapis\.com|push\.services\.mozilla\.com|push\.apple\.com|notify\.windows\.com)\//i;

const enc = new TextEncoder();

export default {
  async fetch(req, env, ctx) {
    const origin = req.headers.get("Origin") || "";
    const cors = {
      "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin",
    };
    const reply = (status, obj) => new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json" } });
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    const path = new URL(req.url).pathname;
    try {
      if (path === "/key") return reply(200, { ok: true, key: (await vapidKeys(env)).pub });
      if (req.method !== "POST") return reply(200, { ok: true, app: "Waktu Solat push" });
      if (!ALLOWED_ORIGINS.includes(origin)) return reply(403, { ok: false, error: "origin" });
      let b = {}; try { b = await req.json(); } catch (e) {}
      if (path === "/subscribe") return subscribe(b, env, reply);
      if (path === "/unsubscribe") {
        if (typeof b.endpoint === "string") await env.DB.prepare("DELETE FROM subs WHERE endpoint = ?").bind(b.endpoint).run();
        return reply(200, { ok: true });
      }
      if (path === "/test") {
        const sub = await env.DB.prepare("SELECT * FROM subs WHERE endpoint = ?").bind(String(b.endpoint || "")).first();
        if (!sub) return reply(404, { ok: false, error: "not subscribed" });
        const r = await sendPush(await vapidKeys(env), sub, { title: "Notifications are on", body: `You'll get prayer alerts for zone ${sub.zone}.`, tag: "test" }, 600);
        return reply(r.ok ? 200 : 502, { ok: r.ok, status: r.status });
      }
      if (path === "/prayed") {
        const date = String(b.date || "");
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return reply(400, { ok: false, error: "date" });
        const keys = Array.isArray(b.keys) ? b.keys.filter(k => KEYS.includes(k)) : [];
        await env.DB.prepare("UPDATE subs SET prayed = ? WHERE endpoint = ?").bind(JSON.stringify({ date, keys }), String(b.endpoint || "")).run();
        return reply(200, { ok: true });
      }
      return reply(404, { ok: false, error: "not found" });
    } catch (e) {
      return reply(500, { ok: false, error: String(e && e.message || e) });
    }
  },

  async scheduled(ev, env, ctx) {
    ctx.waitUntil(tick(env, Math.floor(ev.scheduledTime / 1000)));
  },
};

// ---------- subscriptions ----------
function cleanPrefs(p) {
  p = p || {};
  const pick = a => Array.isArray(a) ? [...new Set(a.filter(k => KEYS.includes(k)))] : [];
  const min = [5, 10, 15, 20].includes(+p.min) ? +p.min : 10;
  const r = p.ram || {};
  const ram = { sahur: [0, 30, 45, 60, 90].includes(+r.sahur) ? +r.sahur : 45, imsak: r.imsak !== false, iftar: r.iftar !== false };
  const hadj = [-1, 0, 1].includes(+p.hadj) ? +p.hadj : 0;
  return { at: pick(p.at), pre: pick(p.pre), min, ram, hadj };
}
async function subscribe(b, env, reply) {
  const s = b.sub || {}, keys = s.keys || {};
  if (typeof s.endpoint !== "string" || !PUSH_HOSTS.test(s.endpoint) || s.endpoint.length > 1000) return reply(400, { ok: false, error: "endpoint" });
  if (typeof keys.p256dh !== "string" || typeof keys.auth !== "string" || keys.p256dh.length > 200 || keys.auth.length > 100) return reply(400, { ok: false, error: "keys" });
  const zone = String(b.zone || "").toUpperCase();
  if (!/^[A-Z]{3}\d{2}$/.test(zone)) return reply(400, { ok: false, error: "zone" });
  const prefs = JSON.stringify(cleanPrefs(b.prefs));
  const now = Date.now();
  await env.DB.prepare(`INSERT INTO subs (endpoint, p256dh, auth, zone, prefs, created, updated) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(endpoint) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth, zone = excluded.zone, prefs = excluded.prefs, updated = excluded.updated`)
    .bind(s.endpoint, keys.p256dh, keys.auth, zone, prefs, now, now).run();
  return reply(200, { ok: true, zone });
}

// ---------- the every-minute job ----------
function myParts(sec) {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" }).formatToParts(new Date(sec * 1000));
  const g = t => p.find(x => x.type === t).value;
  return { y: +g("year"), m: +g("month"), d: +g("day"), wd: g("weekday") };
}
const fmt = sec => new Date(sec * 1000).toLocaleTimeString("en-MY", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: TZ });

async function monthData(env, zone, y, m) {
  const ym = `${y}-${String(m).padStart(2, "0")}`;
  const row = await env.DB.prepare("SELECT data, fetched FROM times WHERE zone = ? AND ym = ?").bind(zone, ym).first();
  if (row && Date.now() - row.fetched < 7 * 86400000) return JSON.parse(row.data);
  try {
    const r = await fetch(`${API}/v2/solat/${zone}?year=${y}&month=${m}`, { headers: { "User-Agent": "qiblat-solat-push" } });
    const j = await r.json();
    if (Array.isArray(j.prayers) && +j.month_number === m) {
      await env.DB.prepare("INSERT OR REPLACE INTO times (zone, ym, data, fetched) VALUES (?, ?, ?, ?)").bind(zone, ym, JSON.stringify(j.prayers), Date.now()).run();
      return j.prayers;
    }
  } catch (e) {}
  return row ? JSON.parse(row.data) : null; // keep using the older copy if the fetch failed
}

function messagesFor(prefs, day, isFriday, last, now, opts = {}) {
  const out = [];
  const inWin = t => t > last && t <= now;
  const ramadan = !!opts.ramadan, fajrDone = !!opts.fajrDone;
  if (ramadan) {
    const im = +day.imsak || (+day.fajr - 600);
    if (prefs.ram.sahur && inWin(im - prefs.ram.sahur * 60))
      out.push({ title: "Time for Sahur", body: `Imsak is at ${fmt(im)}, ${prefs.ram.sahur} minutes from now.`, tag: "ram-sahur", urgent: true });
    if (prefs.ram.imsak && inWin(im))
      out.push({ title: "Imsak", body: `Stop eating and drinking. Fajr is at ${fmt(+day.fajr)}.`, tag: "ram-imsak", urgent: true });
    if (prefs.ram.iftar && inWin(+day.maghrib))
      out.push({ title: "Time to break your fast", body: `Maghrib began at ${fmt(+day.maghrib)}.`, tag: "at-maghrib", urgent: true });
  }
  for (const k of prefs.at) {
    const t = +day[k];
    if (!t || !inWin(t)) continue;
    if (ramadan && k === "maghrib" && prefs.ram.iftar) continue; // the Iftar alert covers it
    const name = (k === "dhuhr" && isFriday) ? "Dhuhr (Jumaat)" : NAMES[k];
    out.push(k === "syuruk"
      ? { title: "Sunrise", body: `Fajr time has ended (${fmt(t)}).`, tag: `at-${k}` }
      : { title: `It's time for ${name}`, body: `${name} began at ${fmt(t)}.`, tag: `at-${k}`, urgent: true });
  }
  for (const k of prefs.pre) {
    const t = +day[k];
    if (!t || !inWin(t - prefs.min * 60)) continue;
    if (k === "syuruk" && fajrDone) continue;
    if (k === "fajr" && ramadan && prefs.ram.imsak && Math.abs((t - prefs.min * 60) - (+day.imsak || 0)) < 120) continue; // same moment as the Imsak alert
    const name = (k === "dhuhr" && isFriday) ? "Dhuhr (Jumaat)" : NAMES[k];
    out.push(k === "syuruk"
      ? { title: `Fajr ends in ${prefs.min} minutes`, body: `Sunrise is at ${fmt(t)}. Pray Fajr now if you haven't.`, tag: `pre-${k}`, urgent: true }
      : { title: `${name} in ${prefs.min} minutes`, body: `${name} starts at ${fmt(t)}. Time to get ready.`, tag: `pre-${k}` });
  }
  return out;
}

async function tick(env, now) {
  const lastRow = await env.DB.prepare("SELECT v FROM app_kv WHERE k = 'last'").first();
  let last = lastRow ? +lastRow.v : now - 60;
  if (now - last > 15 * 60) last = now - 60;       // after a long gap, don't send a flood of old alerts
  if (last >= now) return;
  await env.DB.prepare("INSERT OR REPLACE INTO app_kv (k, v) VALUES ('last', ?)").bind(String(now)).run();

  const zones = (await env.DB.prepare("SELECT DISTINCT zone FROM subs").all()).results || [];
  if (!zones.length) return;
  const { y, m, d, wd } = myParts(now);
  const ymd = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  let vapid = null;
  for (const { zone } of zones) {
    const prayers = await monthData(env, zone, y, m);
    if (!prayers) continue;
    const day = prayers.find(p => +p.day === d);
    if (!day) continue;
    // quick skip: nothing within the next 95 minutes of this window (covers a 90-minute Sahur alert)
    const soon = ALL_TIMES.some(k => { const t = +day[k]; return t > last && t - 95 * 60 <= now; });
    if (!soon) continue;
    const ramCache = {};
    const subs = (await env.DB.prepare("SELECT * FROM subs WHERE zone = ?").bind(zone).all()).results || [];
    for (const sub of subs) {
      let prefs; try { prefs = cleanPrefs(JSON.parse(sub.prefs)); } catch (e) { continue; }
      if (!(prefs.hadj in ramCache)) ramCache[prefs.hadj] = await isRamadan(env, zone, now, prefs.hadj, day);
      let fajrDone = false;
      try { const pr = JSON.parse(sub.prayed || "null"); fajrDone = !!(pr && pr.date === ymd && pr.keys.includes("fajr")); } catch (e) {}
      const msgs = messagesFor(prefs, day, wd === "Fri", last, now, { ramadan: ramCache[prefs.hadj], fajrDone });
      for (const msg of msgs) {
        vapid = vapid || await vapidKeys(env);
        try {
          const r = await sendPush(vapid, sub, msg, msg.urgent ? 1800 : 900);
          if (r.status === 404 || r.status === 410) { await env.DB.prepare("DELETE FROM subs WHERE endpoint = ?").bind(sub.endpoint).run(); break; }
        } catch (e) {}
      }
    }
  }
}

// Ramadan by JAKIM's Hijri date, moved by the user's adjustment (the Hijri date of the day `hadj` days away)
async function isRamadan(env, zone, now, hadj, day) {
  let row = day;
  if (hadj) {
    const q = myParts(now + hadj * 86400);
    const prayers = await monthData(env, zone, q.y, q.m);
    row = prayers && prayers.find(p => +p.day === q.d);
    if (!row) return false;
  }
  const h = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(row.hijri || "");
  return !!h && +h[2] === 9;
}

// ---------- Web Push (RFC 8291 + VAPID). The signing key is made once and kept in D1. ----------
const b64uEnc = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64u = s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)), c => c.charCodeAt(0));
const cat = (...arrs) => { const out = new Uint8Array(arrs.reduce((n, a) => n + a.length, 0)); let o = 0; for (const a of arrs) { out.set(a, o); o += a.length; } return out; };
let vapidCache = null;
async function vapidKeys(env) {
  if (vapidCache) return vapidCache;
  let row = await env.DB.prepare("SELECT v FROM app_kv WHERE k = 'vapid'").first();
  if (!row) {
    const kp = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
    const v = JSON.stringify({ pub: b64uEnc(await crypto.subtle.exportKey("raw", kp.publicKey)), jwk: await crypto.subtle.exportKey("jwk", kp.privateKey) });
    await env.DB.prepare("INSERT OR IGNORE INTO app_kv (k, v) VALUES ('vapid', ?)").bind(v).run();
    row = await env.DB.prepare("SELECT v FROM app_kv WHERE k = 'vapid'").first();
  }
  const v = JSON.parse(row.v);
  vapidCache = { pub: v.pub, key: await crypto.subtle.importKey("jwk", v.jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]) };
  return vapidCache;
}
async function vapidJwt(vapid, aud) {
  const head = b64uEnc(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const body = b64uEnc(enc.encode(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: APP_URL })));
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, vapid.key, enc.encode(head + "." + body));
  return head + "." + body + "." + b64uEnc(sig);
}
async function hkdf(salt, ikm, info, len) {
  const k = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, k, len * 8));
}
async function sendPush(vapid, sub, msg, ttl) {
  const payload = { title: msg.title, body: msg.body, tag: msg.tag, url: APP_URL };
  const ua = b64u(sub.p256dh), auth = b64u(sub.auth);
  const eph = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const asPub = new Uint8Array(await crypto.subtle.exportKey("raw", eph.publicKey));
  const uaKey = await crypto.subtle.importKey("raw", ua, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, eph.privateKey, 256));
  const ikm = await hkdf(auth, shared, cat(enc.encode("WebPush: info\0"), ua, asPub), 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, enc.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, enc.encode("Content-Encoding: nonce\0"), 12);
  const aes = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aes, cat(enc.encode(JSON.stringify(payload)), new Uint8Array([2]))));
  const head = new Uint8Array(21 + asPub.length);
  head.set(salt, 0); new DataView(head.buffer).setUint32(16, 4096); head[20] = asPub.length; head.set(asPub, 21);
  return fetch(sub.endpoint, { method: "POST", body: cat(head, ct), headers: {
    "Content-Encoding": "aes128gcm", "Content-Type": "application/octet-stream", "TTL": String(ttl || 900), "Urgency": "high",
    "Authorization": `vapid t=${await vapidJwt(vapid, new URL(sub.endpoint).origin)}, k=${vapid.pub}` } });
}

