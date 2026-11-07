// Integration tests against a running server. Set SITE_URL (e.g. http://localhost:8080) to enable them.
import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import https from "node:https";

const base = process.env.SITE_URL;
const get = (p, headers = {}) => fetch(base + p, { redirect: "manual", headers });

test("clean URLs serve the pages", { skip: !base }, async () => {
  for (const p of ["/", "/privacy", "/support", "/terms"]) {
    const r = await get(p);
    assert.equal(r.status, 200, p);
    assert.match(r.headers.get("content-type"), /text\/html/, p);
  }
});
test("privacy.html and privacy/ resolve to the same page", { skip: !base }, async () => {
  for (const p of ["/privacy.html", "/privacy/"]) {
    const r = await get(p);
    assert.ok([200, 301, 308].includes(r.status), `${p} -> ${r.status}`);
  }
});
test("unknown path is 404", { skip: !base }, async () => {
  assert.equal((await get("/nope")).status, 404);
});
// fetch drops a custom Host header, so this one goes through node:http.
function rawGet(path, headers) {
  const u = new URL(base + path);
  const mod = u.protocol === "https:" ? https : http;
  return new Promise((resolve, reject) => {
    mod.get({ host: u.hostname, port: u.port, path, headers }, (res) => { res.resume(); resolve(res); }).on("error", reject);
  });
}
test("www redirects to the apex", { skip: !base }, async () => {
  const r = await rawGet("/support", { Host: "www.bbgym.app" });
  assert.equal(r.statusCode, 308);
  assert.equal(r.headers.location, "https://bbgym.app/support");
});
test("security headers are present", { skip: !base }, async () => {
  const h = (await get("/")).headers;
  assert.equal(h.get("x-content-type-options"), "nosniff");
  assert.equal(h.get("referrer-policy"), "strict-origin-when-cross-origin");
  assert.match(h.get("content-security-policy"), /default-src 'self'/);
});
test("i18n JSON is served as json", { skip: !base }, async () => {
  const r = await get("/i18n/pt-BR.json");
  assert.equal(r.status, 200);
  assert.match(r.headers.get("content-type"), /json/);
});
