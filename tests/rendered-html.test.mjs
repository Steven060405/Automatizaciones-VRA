import assert from "node:assert/strict";
import test from "node:test";

async function render(url = "https://automatizaciones-vra-esan.yanoseremasbica4.chatgpt.site/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(url, { headers: { accept: "text/html", "x-forwarded-host": new URL(url).host } }),
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
  assert.match(html, /Acceso restringido a las cuentas autorizadas por el VRA/);
  assert.match(html, /script\.google\.com\/macros\/s\//);
  assert.doesNotMatch(html, /name="username"|type="password"/);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site/);
});

test("muestra la interfaz completa cuando se trabaja en localhost", async () => {
  const response = await render("http://localhost/");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Vista local/);
  assert.match(html, /Vista local de Automatizaciones del VRA/);
  assert.match(html, /Firma de capacitaciones/);
});
