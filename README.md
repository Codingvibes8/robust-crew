# Plainread — Reading Aid for Dyslexia (MVP)

Plainread helps people discover the reading display settings that suit them in two minutes, apply them immediately to any text, and get controllable AI simplification on demand.

> **Notice:** Plainread is a reading aid, not a medical or diagnostic tool. It does not diagnose or treat any condition. It is designed to provide comfortable visual formatting and reading tools.

---

## Features

1. **Guided Calibration (`/calibrate`)**:
   - 6 rounds of side-by-side reading comparisons.
   - Eliminates walls of sliders by building a personal reading profile step by step.
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

6. **Accessibility (WCAG 2.2 AA Minimum)**:
   - Full keyboard navigation with 3px solid focus outlines.
   - Skip to main content link on every page.
   - Minimum 44x44px touch targets.
   - `prefers-reduced-motion` compliance.
   - No forced all-caps, clean sentence case typography.

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

| Variable | Description |
| :--- | :--- |
| `ANTHROPIC_API_KEY` | Anthropic API key for AI text simplification (optional: app runs fully without it except for simplification). |
| `DATABASE_URL` | Optional PostgreSQL connection string (defaults to in-memory store for local development). |

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
