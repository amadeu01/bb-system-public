# bb-system public site — design

Status: draft for approval. Date: 2026-11-07.

## Intent

A public website for bb-system so the iOS apps (BB Student, BB Coach) can be submitted to App Store Connect, which requires a privacy policy URL and a support URL for every submission and a marketing URL for the store page. The same site is the product's first public face while it is in beta.

bb-system is a coaching platform: a coach writes training, diet and instructions; the person being coached follows them, logs workouts and meals, sends daily check-ins with photos, reports wins and failures. Everything flows through one tracked conversation so progress is tracked and nothing is lost in loose messages.

The product is under development and in alpha/beta testing by invitation. The site must say so plainly.

## Goals

1. Satisfy Apple's URL requirements: a privacy policy page, a support page that includes how to request account deletion, and a landing page usable as the marketing URL.
2. Explain bb-system in ten seconds to a reviewer or a prospective tester.
3. Serve the page in the visitor's browser language (en, es, pt-BR) with buttons to switch.
4. Deploy on Railway from the GitHub repository `amadeu01/bb-system-public`, reachable at `https://bbgym.app` (with `www.bbgym.app` redirecting to it).

## Non-goals

- No sign-in, no account management, no forms that write anywhere. Account deletion is explained as an e-mail request, not performed on the site.
- No blog, no changelog, no screenshots gallery in v1 (can come later).
- No analytics or cookies. The only client-side storage is the language choice.
- No shared code with the backend or iOS repos. Tokens are copied by value.

## Anti-goals (a failure even if it technically works)

- A privacy page that contradicts what the apps actually do or what the App Store privacy labels will say.
- A site that looks like a different product from the apps and the web console.
- A visitor who cannot tell the product is in beta and how to get in.

## Decided by Amadeu

- Site languages: detect the browser language; buttons for **en**, **es**, **pt-BR**.
- Responsible party: **ACF Labs**. Contact: **amadeu01@gmail.com**.
- Hosting: Railway, new project, linked to `amadeu01/bb-system-public`, alongside the existing bb-system Railway applications.
- Domain: **bbgym.app**, registered and served through Cloudflare on 2026-11-07. The site lives on the apex; `www.bbgym.app` redirects to it.
- Terms governed by the laws of Brazil.
- Health data comes from Apple Health on iOS and Health Connect on Android; the privacy page covers both.

## Content

Four pages, one header, one footer. Source language for copy is English; es and pt-BR translations ship with the same release. Product vocabulary follows the backend `CONTEXT.md` and the iOS glossary: Student (Aluno / Alumno), Coach, Protocol, Workout (Treino / Entrenamiento), Check-in, Evolution (Evolução / Evolución). Avoid: client, member, trainer, plan, program.

### Header and footer (every page)

- Brand "bb-system", nav links: Home, Privacy, Support, Terms.
- Language switch: three buttons (EN, ES, PT-BR). Current language highlighted.
- Beta banner under the header: "bb-system is in beta. Testing is by invitation." with a link to the beta section of the landing page.
- Footer: "ACF Labs", contact e-mail, links to Privacy, Support, Terms, and a plain-text status label "Beta" (no link to the API host). Year.

### Landing page `/`

1. Hero: product name, one line: *"A coach and the person they coach, sharing training, diet, check-ins and progress in one tracked conversation."* Below it, a "Beta" tag and a button "Join the beta" that scrolls to the beta section.
2. Three blocks, side by side on wide screens, stacked on phones:
   - **For the student** (BB Student): today's training, diet and supplements; log workouts and meals; send daily check-ins with photos; chat with the coach.
   - **For the coach** (BB Coach): assigned students, check-in review and reply, chat; protocols for diet, training and phytotherapy.
   - **Progress stays tracked**: evolution over time, adherence, check-in states (new, seen, replied); nothing typed is lost offline.
3. Beta section (`#beta`): status "alpha/beta, under development", iOS via TestFlight by invitation, Android app exists in testing too. Call to action: e-mail amadeu01@gmail.com with subject "bb-system beta".
4. Short "Who is behind it": ACF Labs.

### Privacy policy `/privacy`

Plain language, sections in this order. Last-updated date at the top.

The facts below were checked on 2026-11-07 against the backend repo `amadeu01/bb-gym-system` (`CONTEXT.md`, `docs-for-humans/getting-started/environment.md`: Cloudinary, Resend, Datadog, Sentry, Redis, Postgres, audit log, superuser second step, student phone sign-in, invite codes by e-mail) and the iOS repo `project.yml` (HealthKit usage description: steps, active calories, exercise minutes, resting heart rate, sleep, "share it with your coach"). The builder writes copy from this document and does not need the backend repo. Account deletion and data export within 30 days are a manual commitment by ACF Labs, done by e-mail request, not an app feature. App Store privacy labels do not exist yet; they will be filled in from this page.

1. **Who we are.** ACF Labs; contact e-mail.
2. **What this policy covers.** The BB Student and BB Coach apps (iOS and Android), the web console, and this website. The website itself collects nothing and sets no cookies; it stores the chosen language in the browser only.
3. **Data we collect**, by category, with the purpose of each:
   - Account: name, e-mail or username, phone (students may sign in with it), password (hashed), role.
   - Coaching content: protocols, diets, foods, training plans, supplement instructions.
   - What the student records: saved workouts (exercises, sets, loads, duration), exercise ticks, meals, adherence.
   - Check-ins: text, answers, and photos.
   - Messages: chat between coach and student.
   - Health data (optional, only with permission, both platforms): steps, active calories, exercise minutes, resting heart rate, sleep, read from Apple Health (HealthKit) on iOS and from Health Connect on Android, to show evolution and share it with the coach. Read only, never written back. Never used for advertising, never sold, never shared with third parties beyond the processors below for storage. The user can revoke access in Apple Health or Health Connect at any time and the app keeps working without it. This section is written to satisfy both Apple's HealthKit rules and Google Play's Health Connect policy, which requires the privacy policy to name each health data type and its purpose.
   - Technical: crash reports and performance traces (device model, OS version, app version, error details); server logs with IP address and request metadata; an audit log of who did what in the system.
4. **How we use it.** To run the coaching relationship; to show progress; to keep the service working and secure; to send invite codes by e-mail. No advertising, no profiling, no sale of data.
5. **Who processes it for us.** Railway (hosting, PostgreSQL database, Redis), Cloudinary (photo storage), Resend (transactional e-mail), Datadog and Sentry (errors and performance). Each receives only what it needs.
6. **Who can see it.** A student's data is visible to their assigned coach(es) and to ACF Labs staff with operational access, whose actions are audited.
7. **Retention.** Kept while the account exists; deleted or anonymised after an account deletion request, except what law requires or what is needed to resolve disputes. Crash and log data expires on the processors' retention schedules.
8. **Your rights.** Access, correction, export, deletion. How to ask: e-mail. Response target: 30 days. Mention of LGPD (Brazil) and GDPR (EU) rights in plain words.
9. **Children.** Not for under-18s without a guardian's consent through their coach.
10. **Security.** Transport encryption, hashed passwords, token sessions, second-step for superusers.
11. **Changes.** We update the date at the top and note material changes here.

### Support `/support`

1. **Get help.** E-mail amadeu01@gmail.com; include the app (BB Student / BB Coach / web), device, and what happened.
2. **Report a bug in the beta.** What to include; TestFlight screenshots welcome.
3. **Delete your account.** Send an e-mail from the account's e-mail (or with your username) with subject "Delete my account". What is deleted, what the coach keeps (nothing personal), expected time (within 30 days). Link to the privacy policy.
4. **Request your data.** Same path, subject "Export my data".
5. **Status.** The beta backend may be reset or have downtime; testers are warned by e-mail.

### Terms for beta testers `/terms`

Short. The service is provided as-is during beta; data may be reset; invitations may be revoked; not medical advice, protocols come from the coach; acceptable use (no abuse, no uploading others' data); governed by the laws of Brazil (decided by Amadeu); contact e-mail for questions. Last-updated date.

## Build (my calls, marked as mine)

- **Static site.** Plain HTML, CSS and vanilla JavaScript. No framework, no build step. One HTML file per page.
- **Translations.** One `i18n/<lang>.json` per language with the same keys; elements carry `data-i18n="key"`; a small script picks the language (`localStorage` choice, else `navigator.languages` matched to en/es/pt, else en), fills the text, sets `<html lang>`, and highlights the active button. Long legal pages keep their paragraphs as keys too (one key per paragraph) so all three languages live in the same file. Fallback: a missing key shows the English string.
- **Look.** Tokens copied from the shared design system: dark and light via `prefers-color-scheme`, Bebas Neue for display, Inter for body (Google Fonts), the default tenant accent. Responsive down to 360px, 16px gutters, no horizontal scroll.
- **Serving.** Caddy in a Dockerfile serving the `site/` directory. `Caddyfile`: listen on `$PORT`, serve files, clean URLs (`/privacy` → `privacy.html`), gzip, `Cache-Control` short for HTML, long for assets, security headers (`X-Content-Type-Options`, `Referrer-Policy`, `Content-Security-Policy` allowing only self and Google Fonts). Health check at `/`.
- **Railway.** New project `bb-system-public`, one service from the GitHub repo, Dockerfile builder, deploy on push to `main`. `railway.toml` committed with builder and healthcheck. Custom domains `bbgym.app` and `www.bbgym.app` added to the service; Caddy redirects `www` to the apex.
- **Cloudflare.** Zone `bbgym.app`: CNAME `@` (apex, Cloudflare flattens it) and CNAME `www`, both pointing at the Railway-provided target. Proxied (orange cloud) with SSL/TLS mode **Full**, which is what Railway documents for Cloudflare. `.app` is an HSTS-preloaded TLD, so the site is HTTPS-only by construction.
- **Repository layout.**
  ```
  site/            index.html, privacy.html, support.html, terms.html, styles.css, app.js, i18n/{en,es,pt-BR}.json, assets/
  Dockerfile       caddy:2-alpine, copies site/ and Caddyfile
  Caddyfile
  railway.toml
  README.md        what it is, how to run locally (docker build / docker run), how to add a language key
  docs/superpowers/specs/, docs/superpowers/plans/
  ```
- **Checks.** A tiny Node script (`scripts/check-i18n.mjs`, no dependencies) that fails when the three JSON files do not share the same key set or any `data-i18n` key in HTML is missing from `en.json`. Run in a GitHub Actions workflow on push, together with `docker build`.

## Left to the builder

- Exact copy of the es and pt-BR translations, following the glossary table above.
- The accent color value and spacing scale, read from the design system tokens in `amadeu01/bb-gym-system` (`packages/design-system/styles.css`) or the iOS `BBDesignSystem` package.
- Whether to use a favicon/logo from the iOS repo if one exists, else a text mark.
- Caddy version pin and the exact header set.

## Constraints

- The GitHub repository is public; nothing secret goes in it. Railway and Cloudflare credentials stay in their dashboards.
- Nothing in the privacy page may claim a protection the backend does not implement. When in doubt, describe, do not promise.
