import { test } from "node:test";
import assert from "node:assert/strict";
import { pickLanguage, translate, applyTranslations, LANGUAGES } from "../site/i18n.js";

test("languages are exactly en, es, pt-BR", () => assert.deepEqual(LANGUAGES, ["en", "es", "pt-BR"]));
test("stored valid language wins over navigator", () => assert.equal(pickLanguage("es", ["pt-BR"]), "es"));
test("stored invalid language is ignored", () => assert.equal(pickLanguage("xx", ["pt-BR"]), "pt-BR"));
test("pt and pt-PT map to pt-BR", () => {
  assert.equal(pickLanguage(null, ["pt"]), "pt-BR");
  assert.equal(pickLanguage(null, ["pt-PT"]), "pt-BR");
});
test("es-419 and es-MX map to es", () => {
  assert.equal(pickLanguage(null, ["es-419"]), "es");
  assert.equal(pickLanguage(null, ["es-MX"]), "es");
});
test("first supported navigator tag wins", () => assert.equal(pickLanguage(null, ["fr", "pt-BR", "en"]), "pt-BR"));
test("unknown languages fall back to en", () => {
  assert.equal(pickLanguage(null, ["fr", "de"]), "en");
  assert.equal(pickLanguage(null, []), "en");
  assert.equal(pickLanguage(null, undefined), "en");
});
test("translate falls back to English then to the key", () => {
  assert.equal(translate({ a: "hola" }, { a: "hello" }, "a"), "hola");
  assert.equal(translate({}, { a: "hello" }, "a"), "hello");
  assert.equal(translate({ a: "" }, { a: "hello" }, "a"), "hello");
  assert.equal(translate({}, {}, "a"), "a");
});

function fakeElement(attrs) {
  const a = { ...attrs };
  return {
    textContent: "",
    getAttribute: (k) => (k in a ? a[k] : null),
    setAttribute: (k, v) => { a[k] = v; },
    attrs: a,
  };
}
function fakeRoot(elements) {
  return {
    querySelectorAll: (selector) => {
      const attr = selector.replace(/[\[\]]/g, "");
      return elements.filter((e) => e.getAttribute(attr) !== null);
    },
  };
}

test("applyTranslations sets text for data-i18n elements", () => {
  const p = fakeElement({ "data-i18n": "nav.home" });
  applyTranslations(fakeRoot([p]), { "nav.home": "Inicio" }, { "nav.home": "Home" });
  assert.equal(p.textContent, "Inicio");
});
test("applyTranslations sets attributes for data-i18n-attr elements", () => {
  const m = fakeElement({ "data-i18n-attr": "content:meta.description", content: "" });
  applyTranslations(fakeRoot([m]), {}, { "meta.description": "About bb-system" });
  assert.equal(m.attrs.content, "About bb-system");
});
test("applyTranslations leaves English text when the key is missing in the dict", () => {
  const p = fakeElement({ "data-i18n": "nav.home" });
  p.textContent = "Home";
  applyTranslations(fakeRoot([p]), {}, { "nav.home": "Home" });
  assert.equal(p.textContent, "Home");
});

// boot(): storage that throws, a navigator in Portuguese, and a hash target that must be re-scrolled after text swaps.
function fakeDoc(elements, byId) {
  return {
    documentElement: { lang: "en" },
    querySelectorAll: (selector) => {
      const attr = selector.replace(/[\[\]]/g, "");
      return elements.filter((e) => e.getAttribute(attr) !== null);
    },
    getElementById: (id) => byId[id] || null,
  };
}
function fakeButton(lang) {
  const el = fakeElement({ "data-lang": lang });
  el.classList = { toggle(name, on) { el.active = on; } };
  el.removeAttribute = () => {};
  el.addEventListener = () => {};
  return el;
}
test("boot survives a throwing localStorage, picks pt-BR from the navigator, and re-scrolls to the hash", async () => {
  const { boot } = await import("../site/i18n.js");
  const p = fakeElement({ "data-i18n": "support.delete.title" });
  p.textContent = "Delete your account";
  const target = { scrolled: 0, scrollIntoView() { this.scrolled++; } };
  const doc = fakeDoc([p, fakeButton("en"), fakeButton("pt-BR")], { delete: target });
  const win = {
    localStorage: { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } },
    navigator: { languages: ["pt-BR", "en"] },
    location: { hash: "#delete" },
    fetch: async () => ({ ok: true, json: async () => ({ "support.delete.title": "Excluir sua conta" }) }),
  };
  await boot(win, doc);
  assert.equal(doc.documentElement.lang, "pt-BR");
  assert.equal(p.textContent, "Excluir sua conta");
  assert.equal(target.scrolled, 1);
});
