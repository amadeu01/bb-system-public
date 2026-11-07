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
