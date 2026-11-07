// Fails when the three language files disagree on keys, or when HTML references a key en.json lacks.
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const LANGUAGES = ["en", "es", "pt-BR"];
const I18N_RE = /data-i18n="([^"]+)"/g;
const I18N_ATTR_RE = /data-i18n-attr="[^:"]+:([^"]+)"/g;

export function findProblems({ dicts, htmlFiles }) {
  const problems = [];
  const en = dicts.en || {};
  const enKeys = new Set(Object.keys(en));
  for (const lang of LANGUAGES.filter((l) => l !== "en")) {
    const keys = new Set(Object.keys(dicts[lang] || {}));
    for (const k of [...enKeys].sort()) if (!keys.has(k)) problems.push(`${lang}: missing key ${k}`);
    for (const k of [...keys].sort()) if (!enKeys.has(k)) problems.push(`${lang}: extra key ${k}`);
  }
  for (const [file, html] of Object.entries(htmlFiles).sort()) {
    const seen = new Set();
    for (const re of [I18N_RE, I18N_ATTR_RE]) {
      for (const m of html.matchAll(re)) {
        const k = m[1];
        if (!enKeys.has(k) && !seen.has(k)) { seen.add(k); problems.push(`${file}: unknown key ${k}`); }
      }
    }
  }
  return problems;
}

function loadFromDisk(root) {
  const site = join(root, "site");
  const dicts = {};
  for (const lang of LANGUAGES) dicts[lang] = JSON.parse(readFileSync(join(site, "i18n", `${lang}.json`), "utf8"));
  const htmlFiles = {};
  for (const name of readdirSync(site).filter((n) => n.endsWith(".html")).sort()) {
    htmlFiles[`site/${name}`] = readFileSync(join(site, name), "utf8");
  }
  return { dicts, htmlFiles };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const problems = findProblems(loadFromDisk(root));
  for (const p of problems) console.error(p);
  if (problems.length) { console.error(`${problems.length} i18n problem(s)`); process.exit(1); }
  console.log("i18n: ok");
}
