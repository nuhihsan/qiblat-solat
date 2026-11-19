# Waktu Solat & Kiblat: rules for every change

## Version and patch notes (required on every update)

Every change that ships to users must, in the same commit:

1. Bump `APP_VERSION` in `notes.js`.
   - Minor bump (2.2 -> 2.3) for new features or several changes.
   - Patch bump (2.2 -> 2.2.1) for a bug fix or small tweak only.
   - Major bump (2.x -> 3.0) only for a redesign or a change to how saved data is stored.
2. Add a new entry at the TOP of `PATCH_NOTES` in `notes.js`: `{ v, date:'YYYY-MM-DD', items:[...] }`.
   - Plain, user-facing English, one line per change, no em dashes.
   - Say what the user will notice, not how it was coded.
3. Bump the cache name in `sw.js` (`prayer-app-vN` -> `prayer-app-vN+1`). Add any new file to `SHELL`.

## App basics

- Plain HTML, CSS and JavaScript, no build step. Hosted on GitHub Pages from `main`.
- `index.html` (main app), `guide.js` (Guide tab), `extras.js` (appearance, timeline, Friday mode and more), `notify.js` (prayer notifications, What's new), `notes.js` (version and patch notes).
- Interface in English. Islamic content should come from JAKIM or Malaysian state Mufti sources where possible; flag anything without an official source for checking by an ustaz.
- Saved data lives in `localStorage`. Do not change saved data shapes without handling the old shape.
- Phone first: check layouts at about 390 px wide.
- Prayer notifications come from the Cloudflare Worker in `worker/` (see `worker/README.md`). Deploy Worker changes before the app change that needs them.
