# Workshop web app: front end

The participant pages of the workshop web app for **Capacity Building in Using AI Agents and Workflows in the University** at Visayas State University (VSU). Built by the TWG for Agentic Workspaces.

Think of this site as the **front desk**: participants register and, later, submit the evaluation here. The **logbook** behind it is a Google Sheet, and an Apps Script **clerk** checks and files every submission and emails certificates. The back end lives in the private workshop repository (`web-app/`, issue #35).

```
Participant ─▶ these pages (GitHub Pages) ─▶ Apps Script web app ─▶ Google Sheet
```

> [!IMPORTANT]
> This repository is **public**. It holds only HTML, CSS and JavaScript. Never commit participant data, spreadsheets, signatures or keys. The Apps Script web app URL in `assets/js/config.js` is meant to be public: the back end re-checks every submission.

## Pages

| Page | Address | Status |
|---|---|---|
| Workshop home | `index.html?event=<event_id>` | Ready |
| Registration | `register.html?event=<event_id>` | Ready |
| Evaluation (Day 2) | `evaluate.html?event=<event_id>` | Ready |
| Check my certificate | `certificate.html?event=<event_id>` | Ready |

Each workshop has its own `event_id` (set by facilitators in the Sheet), so one site serves every workshop.

## Setup

1. Deploy the two Apps Script back ends, **test** and **live** (see the workshop repo's `web-app/README.md`, *Test and live environments*).
2. Put their web app URLs (ending in `/exec`) in `assets/js/config.js`:
   - `API_URL`: the **live** back end, used by participants
   - `TEST_API_URL`: the **test** back end
3. Turn on GitHub Pages: **Settings → Pages → Deploy from a branch → `main` / root**.
4. Share `https://vsu-twg-for-agentic-workspaces.github.io/workshop-web-app/?event=<event_id>`.

## Test and live

| How the page is opened | Back end used | What you see |
|---|---|---|
| The published link (participants) | **Live** (`API_URL`) | Normal page |
| The published link + `&env=test` | **Test** (`TEST_API_URL`) | Blue "Test environment" note |
| From your own computer (`file://` or `localhost`) | **Test** | Blue "Test environment" note |
| Either, with its URL still empty | None (preview) | Yellow "Preview mode" note; nothing is saved |

The test page never falls back to the live back end, and links within the site keep `&env=test`.

## Design

Follows the VSU Brand Book (summarized in the workshop repo's `resources/vsu-brandbook.md`):
- VSU Brand Logo + Text Logo in the upper left, used unaltered; no VSU Seal
- Browser tab and home-screen icons use the TWG logo (`favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`)
- VSU colors, Montserrat titles and Roboto body text
- official campus names (e.g., "VSU Alangalang")

The TWG logo appears only in the footer, as the organizing unit.

## Tests

No installs needed (Node 18 or later):

```
npm test
```

GitHub runs the same tests on every push and pull request.
