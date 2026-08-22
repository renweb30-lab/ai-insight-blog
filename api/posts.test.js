import assert from "node:assert/strict";
import test from "node:test";

import handler, { isPublishedPost, normalizeSummary } from "./posts.js";

function createResponse() {
  return {
    body: null,
    headers: {},
    statusCode: 200,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(value) {
      this.body = value;
      return this;
    },
    send(value) {
      this.body = value;
      return this;
    },
  };
}

test("isPublishedPost rejects drafts, invalid dates, and scheduled posts", () => {
  const now = new Date("2026-08-22T12:00:00.000Z");

  assert.equal(isPublishedPost({}, now), false);
  assert.equal(isPublishedPost({ publishedAt: "invalid" }, now), false);
  assert.equal(isPublishedPost({ publishedAt: "2026-08-22T12:00:01.000Z" }, now), false);
  assert.equal(isPublishedPost({ publishedAt: "2026-08-22T11:59:59.000Z" }, now), true);
});

test("normalizeSummary replaces unfinished test copy", () => {
  assert.equal(
    normalizeSummary({ title: "Codex Security 入門", summary: "要約テスト" }),
    "Codex Securityの特徴と、開発現場で安全に活用するためのポイントをわかりやすく解説します。"
  );
  assert.equal(normalizeSummary({ title: "記事", summary: "完成した要約" }), "完成した要約");
});

test("handler only returns content with an effective publishedAt", async (t) => {
  const originalFetch = global.fetch;
  const originalDomain = process.env.MICROCMS_SERVICE_DOMAIN;
  const originalKey = process.env.MICROCMS_API_KEY;

  process.env.MICROCMS_SERVICE_DOMAIN = "example";
  process.env.MICROCMS_API_KEY = "secret";

  let requestedUrl;
  global.fetch = async (url) => {
    requestedUrl = new URL(url);
    return {
      ok: true,
      async json() {
        return {
          contents: [
            { id: "published", title: "Published", publishedAt: "2020-01-01T00:00:00.000Z" },
            { id: "draft", title: "Draft", createdAt: "2020-01-01T00:00:00.000Z" },
            { id: "scheduled", title: "Scheduled", publishedAt: "2999-01-01T00:00:00.000Z" },
          ],
        };
      },
    };
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

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.posts.map((post) => post.id), ["published"]);
  assert.equal(res.body.posts[0].publishedAt, "2020-01-01T00:00:00.000Z");
  assert.match(requestedUrl.searchParams.get("filters"), /^publishedAt\[less_than\]/);
  assert.equal(requestedUrl.searchParams.get("orders"), "-publishedAt");
});

test("handler fails closed when microCMS is not configured", async (t) => {
  const originalDomain = process.env.MICROCMS_SERVICE_DOMAIN;
  const originalKey = process.env.MICROCMS_API_KEY;
  delete process.env.MICROCMS_SERVICE_DOMAIN;
  delete process.env.MICROCMS_API_KEY;

  t.after(() => {
    if (originalDomain !== undefined) process.env.MICROCMS_SERVICE_DOMAIN = originalDomain;
    if (originalKey !== undefined) process.env.MICROCMS_API_KEY = originalKey;
  });

  const res = createResponse();
  await handler({}, res);

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { error: "microCMS is not configured" });
});
