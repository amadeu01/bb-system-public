# bb-system public site

The public website for bb-system, the coaching platform behind the BB Student and BB Coach apps. It serves the landing page, the privacy policy, the support page and the beta terms in English, Spanish and Brazilian Portuguese, and exists so the apps can be submitted to the App Store and Google Play with a privacy policy URL and a support URL.

Static HTML, CSS and vanilla JavaScript under `site/`, served by Caddy from a Dockerfile, deployed on Railway.

## Commands

```sh
npm test                 # unit tests (node:test, no dependencies)
npm run check:i18n       # the three language files and the HTML keys agree
docker build -t bb-site . && docker run -p 8080:8080 -e PORT=8080 bb-site
```

## How to add a language key

1. Add the key with its English text to `site/i18n/en.json`, then the translation to `site/i18n/es.json` and `site/i18n/pt-BR.json`.
2. Mark the element: `<p data-i18n="page.section.p1">English text</p>`, or for an attribute `<meta name="description" data-i18n-attr="content:meta.page.description" content="...">`.
3. Run `npm run check:i18n`; it fails when a key is missing from any file or unknown in the HTML.

Keys are named `<page>.<section>.<n>` for paragraphs and `<page>.<section>.title` for headings.

## Deployment

- **Railway** project `bb-system-public`, one service built from this repository's `Dockerfile` (see `railway.toml`). Every push to `main` redeploys.
- **Domain** `https://bbgym.app`; `www.bbgym.app` redirects to it (Caddyfile). DNS lives in Cloudflare, zone `bbgym.app`: proxied CNAME records for `@` and `www` pointing at the Railway service, SSL/TLS mode Full.
- **Integration tests** against any deployment: `SITE_URL=https://bbgym.app npm test`.

### URLs for App Store Connect and Google Play

| Field | URL |
|---|---|
| Marketing URL | `https://bbgym.app/` |
| Privacy Policy URL | `https://bbgym.app/privacy` |
| Support URL | `https://bbgym.app/support` |

The privacy page also names each health data type the apps read (Apple Health on iOS, Health Connect on Android), as Google Play's Health Connect policy requires.
