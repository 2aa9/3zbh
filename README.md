# 3zbh — عزبتك، قدامك

A rebuilt, Arabic/Urdu, offline-first farm workspace. No build dependencies, CDN scripts, accounts or database setup are required to use this version.

## Owner ↔ worker workspace

Open `#worker` for a working mobile app embedded in the owner screen. It is an actual same-origin frame with its own Urdu/Arabic selection and navigation, not a device mockup image. `#field` opens the worker app on its own.

The workflow is: dispatch a bilingual, location-linked task → worker starts it → checks individual steps → submits a required photo and written result → owner approves or returns it for correction → worker resubmits. State transitions are checked, and a timestamped history is retained. Messages and read receipts use the same local record. The embedded phone is retained during owner refreshes so incoming updates do not erase an unfinished worker form.

Animal passports add a photo, health history, actual weight measurements and chart, parents, purpose, location and linked tasks. Water/feed monitoring now has timestamped manual readings, tank capacity and estimated amount, real reading history, and an inventory movement ledger that rejects overdraws.

These are functional **local workflows**. Separate tabs/frames under the same browser origin share updates. Independent phones are not networked or authenticated by this version.

[Screenshots, review notes and tested flows](docs/REVIEW.md)

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

For repeatable checks, install the pinned development tools with `npm ci`, install Chromium with `npx playwright install chromium` (or use `CHROMIUM_PATH` for a system browser), start the server, and run:

```sh
npm test
```

Tests exercise animal creation/editing, duplicate tags, cancellation, reload persistence, water readings, stock, daily tasks, health, expenses, facilities, location, Urdu persistence, image compression, escaped report text, backup import/export, malformed imports, nine routes and mobile overflow.

The operations suite also exercises the actual iframe, return-for-correction/resubmission, approval, messaging/read receipts, independent locales, passport photos/measurements, and a new tab. The inventory suite checks precise movement arithmetic, insufficient stock, reading history, automatic backup before clearing data and offline embedded operation.

The accessibility suite uses the pinned `@axe-core/playwright` and runs sampled automated WCAG A/AA checks. `AXE_MODULE_PATH` can point to another installed package, and `APP_URL` can target the built artifact. This is not a full accessibility certification. GitHub Pages now runs all four suites before uploading a deployment, so a failing workflow test blocks publication.

The installation plan and sources actually inspected are in [FARM_PLAN.md](FARM_PLAN.md).
