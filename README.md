# Plainread — Reading Aid for Dyslexia (MVP)

Plainread helps people discover the reading display settings that suit them in two minutes, apply them immediately to any text, and get controllable AI simplification on demand.

> **Notice:** Plainread is a reading aid, not a medical or diagnostic tool. It does not diagnose or treat any condition. It is designed to provide comfortable visual formatting and reading tools.

---

## Features

1. **Guided Calibration (`/calibrate`)**:
   - 6 rounds of side-by-side reading comparisons.
   - Eliminates walls of sliders by building a  personal reading profile step by step.
   - Neutral labels ("Option 1 is easier", "About the same", "Skip the rest").
   - Randomizes option presentation on the server for hydration safety.
   - Ends with a fine-tune editor and "Save and start reading".

2. **Works on Your Own Content (`/import`)**:
   - **Paste text**: Direct text entry.
   - **Web page URL**: SSRF-protected server-side fetch parsed via `@mozilla/readability` and `linkedom`.
   - **File upload**: Support for `.txt` and `.docx` (parsed via `mammoth`, up to 2 MB).
   - Word limit guard rejects documents exceeding 6,000 words with clear guidance.

3. **Reader (`/read/[id]`)**:
   - Formatted with your reading profile CSS variables (font, size, spacing, line height, column width).
   - Left-aligned text (never justified).
   - **Listen Tool (Text-to-Speech)**: Web Speech API with word-level highlighting and fallback paragraph highlighting. Controls for Listen, Pause, Resume, and Stop.
   - **Reading Ruler**: Translucent horizontal band following cursor on desktop and pinned at 40% viewport height on touch screens, dimming the rest of the screen.
   - **Display Panel**: Quick slide-over drawer to fine-tune typography directly while reading.

4. **Controllable AI Simplification (`/api/simplify`)**:
   - Three levels: `Lighter` (shorter sentences), `Simpler` (everyday vocabulary), `Summary` (4–8 key takeaways).
   - Original text always preserved and accessible with a per-paragraph toggle ("Show original / Show simplified").
   - Clear AI notice banner on all simplified content.
   - Streaming NDJSON per paragraph with client-side progressive updates.
   - Caching per document ID and simplification level.
   - Daily quota limit: 5 unique articles per day per anonymous ID.

5. **Flash-Free Styling**:
   - Server reads the profile cookie on root layout and injects CSS custom properties (`--r-font`, `--r-size`, `--r-bg`, etc.) directly into `<html>`.
   - Client-side updates apply live to DOM custom properties with debounced cookie persistence.

6. **Accessibility (WCAG 2.2 AA target)**:
   - Full keyboard navigation with 3px solid focus outlines.
   - Skip to main content link on every page.
   - Minimum 44x44px touch targets.
   - `prefers-reduced-motion` compliance.
   - No forced all-caps, clean sentence case typography.
   - See the [accessibility statement](app/accessibility/page.tsx) for conformance status and known limitations.

---

## AI Spend Controls

The free tier (5 unique articles/day per anonymous ID) is tied to a cookie and can be reset by clearing cookies, so it is not a cost boundary on its own. Three hard controls sit underneath it:

| Control | Constant | Default |
| :--- | :--- | :--- |
| Global daily spend cap | `GLOBAL_DAILY_SPEND_CAP_USD` | $10.00/day across all users (503 once reached) |
| Soft per-IP daily limit | `SOFT_PER_IP_DAILY_LIMIT_USD` | $2.00/day per hashed IP (429 once reached) |
| Spend alert threshold | `SPEND_ALERT_THRESHOLD_USD` | $8.00/day (logs a warning) |

Spend is recorded from actual Anthropic token usage (`spend_records` table) and enforced in `app/api/simplify/route.ts` **before** the API call. Set a hard billing limit at the Anthropic account level as a second line of defence.

---

## Security Notes

- **URL import uses DNS pinning**: the hostname is resolved once, the resolved IP is validated against private/loopback/link-local/CGNAT/multicast ranges (IPv4 + IPv6, including IPv4-mapped), and the connection is made directly to that pinned IP with the original hostname preserved for the `Host` header and TLS certificate identity check. This closes the TOCTOU DNS-rebinding gap (the marker comment from `agent.md` has been replaced with the implementation).
- Redirects are followed manually and re-validated on every hop (max 4 hops), with a 10-second timeout and 2 MB content cap.

---

## Tests & CI

```bash
npm test              # profile validation, safe-fetch, simplify prompts/index checks, store + quota/spend logic
npm run typecheck     # tsc --noEmit
npm run lint
```

Tests live next to their modules (`lib/*.test.ts`) and run with Node's built-in test runner via `tsx`. CI (`.github/workflows/ci.yml`) runs typecheck, lint, tests, and a production build on every push and pull request.

---

## Legal & Trust Pages

- `/privacy` — what is collected (session cookie, display preferences, imported text) and what is not (no health data, no reading-habit analytics, no third-party trackers).
- `/terms` — usage terms, AI disclaimer, not-a-medical-device notice.
- `/accessibility` — accessibility statement with features, known limitations, and feedback channel.

All three are linked from the footer of every page.

---

## Launch Checklist

The following items are code-complete but require human/ops verification before sending real traffic:

1. **Postgres**: provision a database, run `db/schema.sql`, and set `DATABASE_URL` in production — the app now refuses to serve without it.
2. **Custom domain**: purchase/configure the domain and point it at the deployment; update the `Host` in the URL-import User-Agent if the domain differs from `plainread.app`.
3. **Anthropic spend alert**: configure a billing limit / spend alert in the Anthropic console in addition to the in-app caps.
4. **Error monitoring sink**: `lib/monitoring.ts` emits structured `[ERROR]` / `[ANALYTICS]` log lines; wire these to a log drain (e.g. Vercel log streams) rather than adding a third-party tracker, so analytics stay aggregate-only.
5. **Accessibility audit**: run axe, a keyboard-only pass, and at least one screen reader (NVDA/VoiceOver) against the running app before making any WCAG 2.2 AA conformance claim.

---

## Technical Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Plain CSS with CSS Custom Properties (No Tailwind CSS, no external UI kits)
- **Fonts**: Self-hosted Fontsource packages (`@fontsource/lexend`, `@fontsource/atkinson-hyperlegible`, `@fontsource/literata`)
- **Validation**: Zod
- **AI**: Anthropic Claude Haiku (`@anthropic-ai/sdk`), streaming NDJSON response protocol
- **Storage**: Clean `Store` interface with in-memory fallback for local development and PostgreSQL support (`db/schema.sql`)

---

## Environment Variables

| Variable | Required | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | **Yes in production** | PostgreSQL connection string. Production deployments refuse to start without it: the in-memory fallback does not persist on serverless runtimes, so imported documents and quota counters would disappear between requests. Optional only for local development. |
| `ANTHROPIC_API_KEY` | Optional | Anthropic API key for AI text simplification (the app runs fully without it except for simplification). |
| `NODE_ENV` | Set automatically | `production` triggers the `DATABASE_URL` requirement above. |

---

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

3. **Open the app**:
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

4. **Run Typecheck & Build**:
   ```bash
   npm run lint
   npm run build
   ```
