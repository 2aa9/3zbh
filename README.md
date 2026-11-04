# 3zbh — عزبتك، قدامك

A rebuilt, Arabic/Urdu, offline-first farm workspace. No build dependencies, CDN scripts, accounts or database setup are required to use this version.

## Run

```sh
python3 -m http.server 8765
```

Open the served site in a browser. Do not open index.html as a file: browser storage and offline support need an HTTP origin.

## What works

- Owner dashboard with derived counts and daily task progress.
- Searchable individual animal records: name, unique tag, species, breed, sex, birth date, weight, health and notes. Create, edit and remove with confirmation.
- Worker screen in Arabic and Urdu; task completion, photo reports and manual readings.
- Health events, births, vaccination notes and follow-up dates. No automated diagnosis.
- Feed inventory, low-stock alerts, expenses and totals from entered records.
- Interactive schematic based on the supplied farm photo: three sheep pens, chickens, main and clean-water tanks, tree belt, kitchen/garage, main building, family area and men's majlis.
- JSON backup export/import with validation. Existing pre-rebuild browser data is not deleted; this version uses a separate storage key.
- Installable web manifest and network-first offline shell. Records/photos remain in browser storage, not in the service worker cache.

## Honest operating limits

The initial 37 animal records and initial levels are clearly labelled sample data, not actual inventory. Settings can export a backup and start an empty real record. Each browser is independent. The worker screen is a workflow view, not an authenticated security boundary. Phones are not yet synchronized. No sensor hardware, GPS coordinates, push notifications, medical diagnosis or continuous monitoring is connected. The farm schematic is not a surveyed map. Photo reports are compressed and stored locally; export regularly.

This replaces the previous incomplete Supabase frontend. Saved GitHub secrets are not read or exposed by the new workflow. The old SQL is historical and is **not** a production-ready authorization model. See SUPABASE_SETUP.md before any future shared deployment.

## Build and deploy

```sh
node --check app.js
node scripts/build.mjs
```

GitHub Actions deploys only dist/ to Pages. SQL, tests, documentation and configuration secrets never enter the artifact. Publishing success must be checked separately from a successful Git push.

## Browser validation

With Playwright and Chromium available, start the server and run:

```sh
node tests/browser.cjs
```

Tests exercise animal creation/editing, duplicate tags, cancellation, reload persistence, water readings, stock, daily tasks, health, expenses, facilities, location, Urdu persistence, image compression, escaped report text, backup import/export, malformed imports, nine routes and mobile overflow.

The installation plan and sources actually inspected are in [FARM_PLAN.md](FARM_PLAN.md).
