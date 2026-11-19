# Prayer notifications Worker

`prayer-push-worker.js` runs on Cloudflare Workers (free plan). Every minute it checks JAKIM prayer times for each zone that has a subscribed phone, and sends a Web Push notification:

- at each prayer time the user switched on, and
- a few minutes before (5, 10, 15 or 20), including "Fajr ends" before sunrise.

The D1 database `qiblat-solat` and its tables already exist. The Web Push signing key is made automatically the first time and kept in D1, so there are no secrets to set.

## Set up (one time)

1. **Create the Worker.** Cloudflare dashboard > Workers & Pages > Create > Create Worker. Name it `qiblat-solat-push`, then Deploy.
2. **Paste the code.** Open the Worker > Edit code. Replace everything with `prayer-push-worker.js`, then Deploy.
3. **Connect the database.** Worker > Settings > Bindings > Add > D1 database. Variable name `DB`, database `qiblat-solat`. Deploy.
4. **Run it every minute.** Worker > Settings > Triggers > Cron Triggers > Add. Enter `* * * * *` and save.

The app expects the Worker at `https://qiblat-solat-push.nuh-ihsan.workers.dev` (`PUSH_URL` in `notify.js`).

## Tables

```sql
CREATE TABLE IF NOT EXISTS subs (endpoint TEXT PRIMARY KEY, p256dh TEXT NOT NULL, auth TEXT NOT NULL, zone TEXT NOT NULL, prefs TEXT NOT NULL, created INTEGER NOT NULL, updated INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS subs_zone ON subs(zone);
CREATE TABLE IF NOT EXISTS times (zone TEXT NOT NULL, ym TEXT NOT NULL, data TEXT NOT NULL, fetched INTEGER NOT NULL, PRIMARY KEY (zone, ym));
CREATE TABLE IF NOT EXISTS app_kv (k TEXT PRIMARY KEY, v TEXT NOT NULL);
```

## Notes

- Only requests from `https://nuhihsan.github.io` can subscribe.
- The zone follows the app: each time the app opens and finds a new zone, it updates the subscription.
- Free plan limits (100,000 requests a day) are far above what one cron a minute uses.
- When the code changes, repeat step 2. Deploy the Worker before the app change that needs it.
