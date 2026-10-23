# Security Policy

## Architecture Overview

**تحدّي النخبة** is a fully client-side application hosted on GitHub Pages with no backend, no accounts, and no server-side processing.

| Property | Detail |
|----------|--------|
| **Server** | None — static files on GitHub Pages |
| **Accounts** | None — no login, no registration |
| **Data sent externally** | None — zero analytics, zero telemetry |
| **Network requests** | Google Fonts CDN on first load only |
| **User data** | `localStorage` only — never leaves the device |

## What localStorage Stores

| Key | Content |
|-----|---------|
| `ec.settings.v2` | Player/team names, timer config, selected categories |
| `ec.usage.v1` | Per-question usage count and timestamps (anti-repeat engine) |
| `ec.results.v1` | Round history and personal best |
| `ec.localBank.v1` | Admin panel additions and edits (merged with base JSON) |
| `ec.usageLog.v1` | ID + text fingerprint log for deleted/archived questions |

All data can be cleared via **"إعادة ضبط البيانات"** in the game or via browser settings.

## Potential Attack Surface

### 1. Question Bank Import (Admin Panel)
The admin panel accepts user-uploaded JSON files. Mitigations:
- All imported content is parsed as JSON and validated against a strict schema
- Question text and options are inserted via `textContent` (not `innerHTML`) — XSS via JSON is not possible through the rendering layer
- Validation rejects malformed entries before they reach storage

### 2. localStorage Tampering
A user can manually modify their `localStorage` entries via DevTools. Impact is limited to:
- Their own score history
- Their own usage log (affects question anti-repeat only)
- Their own local question bank additions

There is no shared state between users. No other user's data is affected.

### 3. Admin Panel Access
The admin panel (`/admin.html`) is publicly accessible (GitHub Pages has no authentication). It operates entirely on the viewer's own `localStorage`. A visitor using the admin panel can only modify their local copy — not the published `questions.json` or any other user's data.

To restrict admin access in a fork: add HTTP Basic Auth at the hosting level or move `admin.html` to an unlinked path.

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest (`main`) | ✅ Yes |
| Older commits | ❌ No |

## Reporting a Vulnerability

If you discover any unintended behavior such as:
- XSS via question content rendering
- Logic bypass in scoring, lifelines, or anti-repeat
- Unintended external data transmission
- Admin panel behavior that affects other users

**Please do NOT open a public GitHub Issue.**  
Open a private security advisory or contact directly — the issue will be addressed before public disclosure.

---

*Ayham Megdadi*
