import assert from "node:assert/strict";
import test from "node:test";

import handler, { normalizeProfile } from "./profile.js";

function createResponse() {
  return {
    body: null, headers: {}, statusCode: 200,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; },
    send(value) { this.body = value; return this; },
  };
}

test("normalizeProfile exposes only supported fields and normalizes the image", () => {
  const profile = normalizeProfile({ name: " Ren ", icon: { url: "https://img.example/icon.png" }, secret: "no" });
  assert.equal(profile.name, "Ren");
  assert.equal(profile.iconUrl, "https://img.example/icon.png");
  assert.equal(profile.secret, undefined);
  assert.equal(profile.bio, "");
});

test("handler requests the profile endpoint", async (t) => {
  const originalFetch = global.fetch;
  const originalDomain = process.env.MICROCMS_SERVICE_DOMAIN;
  const originalKey = process.env.MICROCMS_API_KEY;
  process.env.MICROCMS_SERVICE_DOMAIN = "example";
  process.env.MICROCMS_API_KEY = "secret";
  let requestedUrl;
  global.fetch = async (url) => {
    requestedUrl = url;
    return { ok: true, async json() { return { name: "レン", icon: { url: "icon.jpg" } }; } };
  };
  t.after(() => {
    global.fetch = originalFetch;
    if (originalDomain === undefined) delete process.env.MICROCMS_SERVICE_DOMAIN;
    else process.env.MICROCMS_SERVICE_DOMAIN = originalDomain;
    if (originalKey === undefined) delete process.env.MICROCMS_API_KEY;
    else process.env.MICROCMS_API_KEY = originalKey;
  });

  const res = createResponse();
  await handler({}, res);
  assert.equal(requestedUrl, "https://example.microcms.io/api/v1/profile");
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.profile.name, "レン");
  assert.equal(res.headers["Cache-Control"], "s-maxage=60, stale-while-revalidate=300");
});
