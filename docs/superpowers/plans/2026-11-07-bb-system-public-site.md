# bb-system Public Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A static four-page site (landing, privacy, support, terms) in en/es/pt-BR, served by Caddy on Railway at `https://bbgym.app`, satisfying Apple's privacy and support URL requirements.

**Architecture:** Plain HTML pages under `site/` carry English copy in the markup; a small ES module (`site/i18n.js`) picks the language and swaps text from `site/i18n/<lang>.json` using `data-i18n` attributes. Caddy serves the directory from a Dockerfile; Railway builds and deploys it on push to `main`. A dependency-free Node script keeps the three language files and the HTML keys in sync and runs in GitHub Actions.

**Tech Stack:** HTML, CSS, vanilla JavaScript (ES modules), Node 24 `node:test` for unit tests, Caddy 2 (Docker), Railway, Cloudflare DNS (zone `bbgym.app`), GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-11-07-bb-system-public-site-design.md`

## Global Constraints

- Languages: `en` (source), `es`, `pt-BR`. Language codes used everywhere (JSON file names, `<html lang>`, button `data-lang`): exactly `en`, `es`, `pt-BR`.
- Vocabulary: Student = Aluno (pt-BR) / Alumno (es); Coach = Coach; Protocol = Protocolo; Workout = Treino / Entrenamiento; Check-in = Check-in; Evolution = Evolução / Evolución. Never: client, member, trainer, plan, program (nor their translations) for these concepts.
- Party and contact on every legal page and in the footer: `ACF Labs`, `amadeu01@gmail.com`.
- Hero line (en): `A coach and the person they coach, sharing training, diet, check-ins and progress in one tracked conversation.`
- Beta banner (en): `bb-system is in beta. Testing is by invitation.`
- Governing law in terms: Brazil.
- No cookies, no analytics, no external scripts. Only `localStorage` key `bb-lang`. External resources allowed: Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`).
- Responsive down to 360px wide, 16px side gutter, no horizontal scroll.
- Nothing secret in the repository.
- Node 24 (`.nvmrc` = `24`), no npm dependencies; `package.json` has `"type": "module"` and scripts only.

## Review Focus

1. A visitor whose browser reports `pt` or `pt-PT` must get `pt-BR`; `es-419` or `es-MX` must get `es`; anything else (`fr`, `de`) must get `en`. Test in Task 1.
2. `localStorage` throwing (private window, blocked storage) must not break rendering; the page still picks from the browser language. Test in Task 1.
3. A key present in `en.json` but missing from `es.json` must show the English text, never `undefined` or an empty element. Test in Task 1; the CI check in Task 2 fails the build for the same condition.
4. With JavaScript disabled the page must still read as the English site: all copy lives in the HTML, the JSON only overrides it. Verified by eye in Task 3 (`curl` output contains the hero line).
5. `/privacy`, `/privacy/`, `/privacy.html` and `/support#delete` must all serve the right page; an unknown path returns 404, not the landing page. Test in Task 6.

---

### Task 1: Repository scaffold and the i18n module

**Files:**
- Create: `.gitignore`, `.nvmrc`, `package.json`, `README.md`
- Create: `site/i18n.js`
- Test: `tests/i18n.test.mjs`

**Interfaces:**
- Produces: `export const LANGUAGES = ["en", "es", "pt-BR"]`
- Produces: `export function pickLanguage(stored, navigatorLanguages) -> "en" | "es" | "pt-BR"`. `stored` is the raw `localStorage` value or `null`; `navigatorLanguages` is `navigator.languages` (array of BCP-47 tags). Rules: a stored value that is in `LANGUAGES` wins; else the first navigator tag whose lowercase primary subtag is `pt` → `pt-BR`, `es` → `es`, `en` → `en`; else `en`.
- Produces: `export function translate(dict, fallback, key) -> string`. Returns `dict[key]` if it is a non-empty string, else `fallback[key]`, else `key`.
- Produces: `export function applyTranslations(root, dict, fallback)`. For every element with `data-i18n`, sets `textContent` to `translate(dict, fallback, key)`. For every element with `data-i18n-attr="attr:key"` (e.g. `content:meta.description`, `aria-label:nav.menu`) sets that attribute. Pure DOM, no fetch.
- Produces: `export async function boot(win, doc)` (called from each page): reads `win.localStorage.getItem("bb-lang")` inside try/catch, computes the language, fetches `/i18n/<lang>.json` (and `/i18n/en.json` as fallback when `lang !== "en"`), calls `applyTranslations`, sets `doc.documentElement.lang`, adds class `is-active` to the button whose `data-lang` matches, and wires each `[data-lang]` button to store the choice (try/catch) and re-run. Skips the fetch for `en` and uses an empty dict. The module ends with `if (typeof document !== "undefined") boot(window, document);` so pages load it with a plain `<script type="module" src="/i18n.js">` and no inline script (the CSP in Task 6 forbids inline scripts); in Node `document` is undefined so tests import it safely.

- [ ] **Step 1: Scaffold files**

`.gitignore`: `node_modules/`, `.DS_Store`. `.nvmrc`: `24`. `package.json`: `{ "name": "bb-system-public", "private": true, "type": "module", "scripts": { "test": "node --test tests/", "check:i18n": "node scripts/check-i18n.mjs" } }`. `README.md`: one paragraph on what the site is, the three commands (`npm test`, `npm run check:i18n`, `docker build -t bb-site . && docker run -p 8080:8080 -e PORT=8080 bb-site`), and "How to add a language key" (add to all three JSON files, mark the element with `data-i18n`).

- [ ] **Step 2: Write the failing tests**

```js
// tests/i18n.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { pickLanguage, translate, LANGUAGES } from "../site/i18n.js";

test("languages are exactly en, es, pt-BR", () => assert.deepEqual(LANGUAGES, ["en", "es", "pt-BR"]));
test("stored valid language wins over navigator", () => assert.equal(pickLanguage("es", ["pt-BR"]), "es"));
test("stored invalid language is ignored", () => assert.equal(pickLanguage("xx", ["pt-BR"]), "pt-BR"));
test("pt and pt-PT map to pt-BR", () => { assert.equal(pickLanguage(null, ["pt"]), "pt-BR"); assert.equal(pickLanguage(null, ["pt-PT"]), "pt-BR"); });
test("es-419 and es-MX map to es", () => { assert.equal(pickLanguage(null, ["es-419"]), "es"); assert.equal(pickLanguage(null, ["es-MX"]), "es"); });
test("first supported navigator tag wins", () => assert.equal(pickLanguage(null, ["fr", "pt-BR", "en"]), "pt-BR"));
test("unknown languages fall back to en", () => { assert.equal(pickLanguage(null, ["fr", "de"]), "en"); assert.equal(pickLanguage(null, []), "en"); assert.equal(pickLanguage(null, undefined), "en"); });
test("translate falls back to English then to the key", () => {
  assert.equal(translate({ a: "hola" }, { a: "hello" }, "a"), "hola");
  assert.equal(translate({}, { a: "hello" }, "a"), "hello");
  assert.equal(translate({ a: "" }, { a: "hello" }, "a"), "hello");
  assert.equal(translate({}, {}, "a"), "a");
});
```

Add a DOM test for `applyTranslations` using a minimal fake: an object with `querySelectorAll(selector)` returning stub elements `{ getAttribute, setAttribute, textContent }`. Assert `textContent` is set for `data-i18n` and the attribute is set for `data-i18n-attr="content:meta.description"`.

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL, module `../site/i18n.js` not found.

- [ ] **Step 4: Implement `site/i18n.js`**

Export the four functions and the constant per the Interfaces block. `boot` must wrap every `localStorage` call in try/catch and must not throw if the JSON fetch fails (log to `console.warn`, keep English).

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add .gitignore .nvmrc package.json README.md site/i18n.js tests/i18n.test.mjs
git commit -m "feat: i18n module with language detection and fallback"
```

### Task 2: i18n consistency check and CI

**Files:**
- Create: `scripts/check-i18n.mjs`
- Create: `.github/workflows/ci.yml`
- Test: `tests/check-i18n.test.mjs`

**Interfaces:**
- Produces: `export function findProblems({ dicts, htmlFiles }) -> string[]` in `scripts/check-i18n.mjs`. `dicts` is `{ en: {...}, es: {...}, "pt-BR": {...} }`; `htmlFiles` is `{ "site/index.html": "<html…>" }`. Returns one message per problem: a key in `en` missing from another language (`es: missing key nav.home`), a key in another language not in `en` (`es: extra key foo`), a `data-i18n="k"` or `data-i18n-attr="attr:k"` in HTML whose `k` is not in `en` (`site/index.html: unknown key k`). Empty array means clean.
- The script, when run directly (`import.meta.url` matches `process.argv[1]`), loads `site/i18n/*.json` and `site/*.html`, prints problems, exits 1 if any.

- [ ] **Step 1: Write the failing tests**

```js
// tests/check-i18n.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { findProblems } from "../scripts/check-i18n.mjs";

const en = { "nav.home": "Home", "meta.description": "d" };
test("clean set reports nothing", () => {
  const html = { "site/index.html": '<a data-i18n="nav.home"></a><meta data-i18n-attr="content:meta.description">' };
  assert.deepEqual(findProblems({ dicts: { en, es: en, "pt-BR": en }, htmlFiles: html }), []);
});
test("missing key in es is reported", () => {
  const out = findProblems({ dicts: { en, es: { "nav.home": "Inicio" }, "pt-BR": en }, htmlFiles: {} });
  assert.deepEqual(out, ["es: missing key meta.description"]);
});
test("extra key in pt-BR is reported", () => {
  const out = findProblems({ dicts: { en, es: en, "pt-BR": { ...en, foo: "x" } }, htmlFiles: {} });
  assert.deepEqual(out, ["pt-BR: extra key foo"]);
});
test("unknown key in HTML is reported", () => {
  const out = findProblems({ dicts: { en, es: en, "pt-BR": en }, htmlFiles: { "site/x.html": '<p data-i18n="nope"></p>' } });
  assert.deepEqual(out, ["site/x.html: unknown key nope"]);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL, `../scripts/check-i18n.mjs` not found.

- [ ] **Step 3: Implement `scripts/check-i18n.mjs`**

Regexes: `/data-i18n="([^"]+)"/g` and `/data-i18n-attr="[^:"]+:([^"]+)"/g`. Messages exactly as the tests spell them, sorted by language then key.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Write the workflow**

`.github/workflows/ci.yml`: on `push` and `pull_request`; one job on `ubuntu-latest`; steps: checkout, `actions/setup-node@v4` with `node-version-file: .nvmrc`, `npm test`, `npm run check:i18n`, `docker build -t bb-site .` (the Dockerfile arrives in Task 6; until then this step fails, which is expected and noted in the commit message).

- [ ] **Step 6: Commit**

```bash
git add scripts/check-i18n.mjs tests/check-i18n.test.mjs .github/workflows/ci.yml
git commit -m "feat: i18n consistency check and CI workflow"
```

### Task 3: Shell, styles and landing page

**Files:**
- Create: `site/styles.css`, `site/index.html`, `site/i18n/en.json`, `site/i18n/es.json`, `site/i18n/pt-BR.json`, `site/assets/favicon.svg`

**Interfaces:**
- Produces: the page shell every later page copies verbatim: `<header class="site-header">` (brand link, `<nav>` with four links keyed `nav.home`, `nav.privacy`, `nav.support`, `nav.terms`, and `<div class="lang-switch">` with three `<button data-lang="en|es|pt-BR">` labelled `EN`, `ES`, `PT-BR`), `<div class="beta-banner" data-i18n="banner.beta">` linking to `/#beta`, `<main>`, `<footer class="site-footer">` (ACF Labs, `mailto:amadeu01@gmail.com`, the three legal links, `<span data-i18n="footer.status">Beta</span>`, year).
- Produces: key naming convention `<page>.<section>.<n>` for paragraphs (e.g. `privacy.data.p3`), `<page>.<section>.title` for headings, `nav.*`, `banner.*`, `footer.*`, `meta.<page>.title`, `meta.<page>.description`.
- Produces: CSS custom properties in `:root` (light) and `@media (prefers-color-scheme: dark)` (dark), values copied from the design tokens:

| token | light | dark |
|---|---|---|
| `--bg` | `hsl(40 30% 98%)` | `hsl(217 16% 15%)` |
| `--fg` | `hsl(220 18% 14%)` | `hsl(219 28% 94%)` |
| `--card` | `hsl(0 0% 100%)` | `hsl(220 16% 21%)` |
| `--muted-fg` | `hsl(220 9% 42%)` | `hsl(218 14% 68%)` |
| `--primary` | `#d3a136` | `hsl(41 71% 66%)` |
| `--primary-ink` | `#885c11` | `hsl(41 71% 66%)` |
| `--on-primary` | `#1d222a` | `hsl(220 18% 13%)` |
| `--border` | `hsl(40 14% 87%)` | `hsl(220 13% 32%)` |
| `--warning` | `hsl(38 78% 46%)` | `hsl(40 68% 73%)` |
| `--radius` | `0.6rem` | same |

Fonts: `--font-display: "Bebas Neue", sans-serif`, `--font-heading: Montserrat, sans-serif`, `--font-body: Inter, sans-serif`, loaded with one Google Fonts `<link>` (Bebas Neue 400, Montserrat 600, Inter 400 and 600, `display=swap`). Spacing scale 4px-based; page gutter 16px; content max-width 72rem; legal pages max-width 44rem.

- [ ] **Step 1: Write `site/styles.css`**

Tokens as above; `body { background: var(--bg); color: var(--fg); font-family: var(--font-body); }`; header sticky with bottom border; `.lang-switch button.is-active` filled with `--primary` and `--on-primary`; beta banner uses `--warning` on a translucent background; `.feature-grid` three columns at ≥ 48rem, one column below; `.card` with `--card`, `--border`, `--radius`; `.legal` for narrow prose with `h2` margins; focus-visible outline using `--primary`.

- [ ] **Step 2: Write `site/index.html`**

Shell as in Interfaces, `<script type="module" src="/i18n.js"></script>` at the end of body (no inline script). Content per spec: hero (`h1` brand in display font, `p data-i18n="home.hero.line"` with the exact hero line, `span data-i18n="home.hero.beta"` Beta tag, button `a href="#beta" data-i18n="home.hero.cta"` "Join the beta"), three cards (`home.student.*`, `home.coach.*`, `home.progress.*`, each a `title` and three to four `p`), beta section `id="beta"` (`home.beta.title`, `home.beta.p1..p3`, mailto link with `?subject=bb-system%20beta` keyed `home.beta.cta`), "Who is behind it" (`home.about.title`, `home.about.p1`). `<title data-i18n="meta.home.title">` and `<meta name="description" data-i18n-attr="content:meta.home.description">`. `<link rel="icon" href="/assets/favicon.svg">`.

- [ ] **Step 3: Write `site/assets/favicon.svg`**

A rounded square in `#d3a136` with the letters `bb` in dark text (`#1d222a`), bold sans-serif, 64×64 viewBox.

- [ ] **Step 4: Write the three JSON files for the keys used so far**

`en.json` holds the English copy exactly as in the HTML. `es.json` and `pt-BR.json` translate every key, following the vocabulary table. Banner: es `bb-system está en beta. Las pruebas son por invitación.`, pt-BR `O bb-system está em beta. Os testes são por convite.`

- [ ] **Step 5: Verify**

Run: `npm run check:i18n` → prints nothing, exit 0. Run: `npx --yes serve site` is not allowed (no dependencies); instead `python3 -m http.server 8000 --directory site` and open `http://localhost:8000/`, then in the browser console `localStorage.setItem("bb-lang","pt-BR"); location.reload()` → page shows Portuguese; `localStorage.removeItem("bb-lang")` with browser language es → Spanish. Check narrowest width 360px: no horizontal scroll. `curl -s localhost:8000/ | grep -c "one tracked conversation"` → `1`.

- [ ] **Step 6: Commit**

```bash
git add site/
git commit -m "feat: site shell, design tokens and landing page in en, es, pt-BR"
```

### Task 4: Privacy policy page

**Files:**
- Create: `site/privacy.html`
- Modify: `site/i18n/en.json`, `site/i18n/es.json`, `site/i18n/pt-BR.json`

**Interfaces:**
- Consumes: shell and key convention from Task 3.
- Produces: section anchors `#who`, `#scope`, `#data`, `#use`, `#processors`, `#access`, `#retention`, `#rights`, `#children`, `#security`, `#changes`.

- [ ] **Step 1: Write `site/privacy.html`**

`<main class="legal">`, `h1` keyed `privacy.title`, `p` keyed `privacy.updated` ("Last updated: 2026-11-07"), then the eleven sections of the spec in order, each `<section id=…>` with `h2 data-i18n="privacy.<id>.title"` and paragraphs `privacy.<id>.p<n>`. Section `data` lists the categories as `<ul>` items keyed `privacy.data.account`, `.coaching`, `.records`, `.checkins`, `.messages`, `.health`, `.technical`. The health item must name all five readings, both Apple Health (HealthKit) and Health Connect, read-only, revocable. Section `processors` lists Railway, Cloudinary, Resend, Datadog, Sentry as `<ul>` items keyed `privacy.processors.<name>` each with one line on what it receives. Section `rights` names LGPD and GDPR and the 30-day target and links to `/support#delete` and `/support#export`.

- [ ] **Step 2: Add keys to the three JSON files**

Translate every new key; keep the vocabulary table; keep processor names untranslated.

- [ ] **Step 3: Verify**

Run: `npm run check:i18n` → clean. Open `/privacy.html` locally in each language and read it once in full; confirm no paragraph claims anything outside the spec's list.

- [ ] **Step 4: Commit**

```bash
git add site/privacy.html site/i18n/
git commit -m "feat: privacy policy page"
```

### Task 5: Support and terms pages

**Files:**
- Create: `site/support.html`, `site/terms.html`
- Modify: `site/i18n/en.json`, `site/i18n/es.json`, `site/i18n/pt-BR.json`

**Interfaces:**
- Consumes: shell and key convention from Task 3; anchors `/support#delete` and `/support#export` promised by Task 4.

- [ ] **Step 1: Write `site/support.html`**

Sections with ids `help`, `bug`, `delete`, `export`, `status` per the spec. `delete` and `export` each end with a `mailto:amadeu01@gmail.com?subject=Delete%20my%20account` / `?subject=Export%20my%20data` link keyed `support.delete.cta` / `support.export.cta`. The deletion section states: what is deleted (account, check-ins, photos, messages, workouts, health readings), what the coach keeps (nothing personal), the 30-day target, and links to `/privacy#retention`.

- [ ] **Step 2: Write `site/terms.html`**

Sections `asis`, `data`, `invites`, `medical`, `use`, `law`, `contact`; `law` says the terms are governed by the laws of Brazil. `terms.updated` with the same date as privacy.

- [ ] **Step 3: Add keys to the three JSON files, run the check**

Run: `npm run check:i18n` → clean. Run: `npm test` → PASS.

- [ ] **Step 4: Commit**

```bash
git add site/support.html site/terms.html site/i18n/
git commit -m "feat: support and beta terms pages"
```

### Task 6: Caddy, Dockerfile, Railway config

**Files:**
- Create: `Caddyfile`, `Dockerfile`, `railway.toml`, `.dockerignore`
- Test: `tests/serve.test.mjs` (integration, runs only when `SITE_URL` is set)

**Interfaces:**
- Produces: a container that listens on `$PORT` (default 8080) and serves `site/`.

- [ ] **Step 1: Write the integration test**

```js
// tests/serve.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
const base = process.env.SITE_URL;
const get = (p) => fetch(base + p, { redirect: "manual" });
test("clean URLs serve the pages", { skip: !base }, async () => {
  for (const p of ["/", "/privacy", "/support", "/terms"]) {
    const r = await get(p); assert.equal(r.status, 200, p);
    assert.match(r.headers.get("content-type"), /text\/html/);
  }
});
test("privacy.html and privacy/ resolve to the same page", { skip: !base }, async () => {
  for (const p of ["/privacy.html", "/privacy/"]) { const r = await get(p); assert.ok([200, 301, 308].includes(r.status), p); }
});
test("unknown path is 404", { skip: !base }, async () => assert.equal((await get("/nope")).status, 404));
test("www redirects to the apex", { skip: !base }, async () => {
  const r = await fetch(base + "/support", { redirect: "manual", headers: { Host: "www.bbgym.app" } });
  assert.equal(r.status, 308); assert.equal(r.headers.get("location"), "https://bbgym.app/support");
});
test("security headers are present", { skip: !base }, async () => {
  const h = (await get("/")).headers;
  assert.equal(h.get("x-content-type-options"), "nosniff");
  assert.equal(h.get("referrer-policy"), "strict-origin-when-cross-origin");
  assert.match(h.get("content-security-policy"), /default-src 'self'/);
});
test("i18n JSON is served as json", { skip: !base }, async () => {
  const r = await get("/i18n/pt-BR.json"); assert.equal(r.status, 200); assert.match(r.headers.get("content-type"), /json/);
});
```

- [ ] **Step 2: Write `Caddyfile`**

```
:{$PORT:8080}
@www header Host www.bbgym.app
redir @www https://bbgym.app{uri} 308
root * /srv
encode gzip
try_files {path} {path}.html
file_server
handle_errors { respond "{err.status_code} {err.status_text}" }
header {
  X-Content-Type-Options nosniff
  Referrer-Policy strict-origin-when-cross-origin
  X-Frame-Options DENY
  Content-Security-Policy "default-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; script-src 'self'; connect-src 'self'"
  -Server
}
@html path *.html /
header @html Cache-Control "public, max-age=300"
@assets path /styles.css /i18n.js /assets/* /i18n/*
header @assets Cache-Control "public, max-age=3600"
```

`Dockerfile`: `FROM caddy:2.10-alpine`, `COPY Caddyfile /etc/caddy/Caddyfile`, `COPY site/ /srv/`, `EXPOSE 8080`. `.dockerignore`: everything except `site/` and `Caddyfile`. `railway.toml`: `[build] builder = "DOCKERFILE"`, `[deploy] healthcheckPath = "/"`, `healthcheckTimeout = 30`, `restartPolicyType = "ON_FAILURE"`.

- [ ] **Step 3: Build, run, test**

Run: `docker build -t bb-site . && docker run -d --rm -p 8080:8080 -e PORT=8080 --name bb-site bb-site && SITE_URL=http://localhost:8080 npm test; docker stop bb-site`
Expected: all tests PASS including the five serve tests (not skipped). If `/privacy/` returns 404, add `uri strip_suffix /` before `try_files`.

- [ ] **Step 4: Commit**

```bash
git add Caddyfile Dockerfile .dockerignore railway.toml tests/serve.test.mjs
git commit -m "feat: Caddy container and Railway config"
```

### Task 7: Deploy to Railway and point the domain

**Files:**
- Modify: `README.md` (deployment section)

**Prerequisite:** Railway and Cloudflare MCP servers authenticated in this session (`/mcp`). If a server is unavailable, fall back to the `railway` CLI (`railway login`, `railway init`, `railway link`, `railway up`) and the Cloudflare dashboard, and say so in the report.

- [ ] **Step 1: Push the repository**

Run: `git push -u origin main`. Expected: the GitHub Actions workflow runs green (`gh run watch`).

- [ ] **Step 2: Create the Railway project and service**

Via the Railway MCP: new project `bb-system-public` in the same workspace as the existing bb-system project; one service from GitHub repo `amadeu01/bb-system-public`, branch `main`, Dockerfile builder (from `railway.toml`). Wait for the first deployment to succeed. Generate the Railway public domain for the service and run `SITE_URL=https://<service>.up.railway.app npm test` → PASS.

- [ ] **Step 3: Add the custom domains**

Via Railway MCP: add custom domains `bbgym.app` and `www.bbgym.app` to the service; note the CNAME target each returns. Via Cloudflare MCP: in zone `bbgym.app`, create `CNAME @ → <railway target>` and `CNAME www → <railway target>`, both proxied; set the zone SSL/TLS encryption mode to Full (not Flexible, which loops; not Full strict until Railway's certificate is issued). Add to the `Caddyfile` a block `www.bbgym.app { redir https://bbgym.app{uri} permanent }` is not possible because Caddy sees only `$PORT`; instead add inside the main site block: `@www header Host www.bbgym.app` and `redir @www https://bbgym.app{uri} permanent`.

- [ ] **Step 4: Verify**

Run: `until curl -sfI https://bbgym.app/ >/dev/null; do sleep 20; done; SITE_URL=https://bbgym.app npm test`
Expected: PASS. Then `curl -sI https://bbgym.app/privacy | head -1` → `HTTP/2 200`, and `curl -sI https://www.bbgym.app/support | grep -i location` → `location: https://bbgym.app/support`.

- [ ] **Step 5: Document and commit**

Add a "Deployment" section to `README.md`: Railway project name, that deploys happen on push to `main`, the custom domain and where the DNS record lives, and the three URLs to paste into App Store Connect (marketing `https://bbgym.app/`, privacy `https://bbgym.app/privacy`, support `https://bbgym.app/support`).

```bash
git add README.md
git commit -m "docs: deployment and App Store Connect URLs"
git push
```
