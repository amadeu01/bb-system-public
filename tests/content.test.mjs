// Guards on copy the privacy and support pages must (or must not) make.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (f) => readFileSync(new URL(`../site/${f}`, import.meta.url), "utf8");
const dict = (l) => JSON.parse(read(`i18n/${l}.json`));

test("privacy page discloses the Google Fonts request on every language", () => {
  assert.match(read("privacy.html"), /Google Fonts/);
  for (const l of ["en", "es", "pt-BR"]) assert.match(dict(l)["privacy.scope.p2"], /Google Fonts/, l);
});
test("support page does not promise to recover lost input", () => {
  assert.doesNotMatch(read("support.html"), /recover/i);
  assert.doesNotMatch(dict("es")["support.bug.p2"], /recuperar/i);
  assert.doesNotMatch(dict("pt-BR")["support.bug.p2"], /recuperar/i);
});
