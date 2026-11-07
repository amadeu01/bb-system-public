// Language detection and text swapping for the bb-system public site.
// English copy lives in the HTML; this module overrides it from /i18n/<lang>.json.

export const LANGUAGES = ["en", "es", "pt-BR"];
const STORAGE_KEY = "bb-lang";
const BY_PRIMARY = { en: "en", es: "es", pt: "pt-BR" };

export function pickLanguage(stored, navigatorLanguages) {
  if (LANGUAGES.includes(stored)) return stored;
  for (const tag of navigatorLanguages || []) {
    const primary = String(tag).toLowerCase().split("-")[0];
    if (BY_PRIMARY[primary]) return BY_PRIMARY[primary];
  }
  return "en";
}

export function translate(dict, fallback, key) {
  const v = dict && dict[key];
  if (typeof v === "string" && v !== "") return v;
  const f = fallback && fallback[key];
  if (typeof f === "string" && f !== "") return f;
  return key;
}

export function applyTranslations(root, dict, fallback) {
  for (const el of root.querySelectorAll("[data-i18n]")) {
    el.textContent = translate(dict, fallback, el.getAttribute("data-i18n"));
  }
  for (const el of root.querySelectorAll("[data-i18n-attr]")) {
    const spec = el.getAttribute("data-i18n-attr");
    const i = spec.indexOf(":");
    if (i < 1) continue;
    el.setAttribute(spec.slice(0, i), translate(dict, fallback, spec.slice(i + 1)));
  }
}

function readStored(win) {
  try { return win.localStorage.getItem(STORAGE_KEY); } catch { return null; }
}
function writeStored(win, lang) {
  try { win.localStorage.setItem(STORAGE_KEY, lang); } catch { /* storage unavailable: choice lasts this page only */ }
}

async function loadDict(win, lang) {
  if (lang === "en") return {};
  try {
    const res = await win.fetch(`/i18n/${lang}.json`, { cache: "default" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`i18n: could not load ${lang}, keeping English`, err);
    return {};
  }
}

async function render(win, doc, lang, english) {
  const dict = await loadDict(win, lang);
  applyTranslations(doc, dict, english);
  doc.documentElement.lang = lang;
  for (const btn of doc.querySelectorAll("[data-lang]")) {
    const active = btn.getAttribute("data-lang") === lang;
    btn.classList.toggle("is-active", active);
    if (active) btn.setAttribute("aria-current", "true"); else btn.removeAttribute("aria-current");
  }
}

export async function boot(win, doc) {
  // Snapshot the English copy from the markup so a missing key always falls back to it.
  const english = {};
  for (const el of doc.querySelectorAll("[data-i18n]")) english[el.getAttribute("data-i18n")] = el.textContent;
  for (const el of doc.querySelectorAll("[data-i18n-attr]")) {
    const spec = el.getAttribute("data-i18n-attr");
    const i = spec.indexOf(":");
    if (i > 0) english[spec.slice(i + 1)] = el.getAttribute(spec.slice(0, i)) || "";
  }
  const lang = pickLanguage(readStored(win), win.navigator && win.navigator.languages);
  await render(win, doc, lang, english);
  for (const btn of doc.querySelectorAll("[data-lang]")) {
    btn.addEventListener("click", () => {
      const chosen = btn.getAttribute("data-lang");
      writeStored(win, chosen);
      render(win, doc, chosen, english);
    });
  }
}

if (typeof document !== "undefined") boot(window, document);
