import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("renderiza el acceso institucional del VRA", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html lang="es">/i);
  assert.match(html, /<title>Automatizaciones del VRA<\/title>/i);
  assert.match(html, /ACCESO CON GOOGLE/);
  assert.match(html, /Ingresar con Google/);
  assert.match(html, /script\.google\.com\/macros\/s\//);
  assert.doesNotMatch(html, /name="username"|type="password"/);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site/);
});
