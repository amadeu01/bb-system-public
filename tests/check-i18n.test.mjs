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
