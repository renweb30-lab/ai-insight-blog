function isPublishedPost(post, now) {
  if (!post?.publishedAt) return false;

  const publishedAt = Date.parse(post.publishedAt);
  return Number.isFinite(publishedAt) && publishedAt <= now.getTime();
}

function normalizeSummary(post) {
  const summary = String(post?.summary || "").trim();
  if (summary !== "要約テスト") return summary;

  if (/Codex\s*Security/i.test(post?.title || "")) {
    return "Codex Securityの特徴と、開発現場で安全に活用するためのポイントをわかりやすく解説します。";
  }
  return "この記事の要点と、実務ですぐ試せるポイントをわかりやすく紹介します。";
}

export default async function handler(req, res) {
  try {
    const domain = process.env.MICROCMS_SERVICE_DOMAIN;
    const apiKey = process.env.MICROCMS_API_KEY;
    const endpoint = process.env.MICROCMS_ENDPOINT || "blog";

    if (!domain || !apiKey) {
      return res.status(500).json({ error: "microCMS is not configured" });
    }

    const now = new Date();
    const apiUrl = new URL(`https://${domain}.microcms.io/api/v1/${endpoint}`);
    apiUrl.searchParams.set("limit", "100");
    apiUrl.searchParams.set("orders", "-publishedAt");
    // Do not rely solely on the CMS response defaults: explicitly request only
    // content whose publication time has arrived.
    apiUrl.searchParams.set("filters", `publishedAt[less_than]${now.toISOString()}`);

    const r = await fetch(apiUrl, {
      headers: { "X-MICROCMS-API-KEY": apiKey },
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(r.status).send(text);
    }

    const data = await r.json();

    // Defence in depth: drafts have no publishedAt. Filtering again here keeps
    // them (and scheduled content) private even if the upstream query changes.
    const posts = (data.contents || [])
      .filter((post) => isPublishedPost(post, now))
      .map((p) => {
        const normalizedCategoryId = Array.isArray(p.categoryId)
          ? p.categoryId[0]
          : p.categoryId;

        return {
          id: p.id,
          slug: p.slug || p.id,
          title: p.title,
          publishedAt: p.publishedAt,
          categoryId: normalizedCategoryId || "ai-news",
          summary: normalizeSummary(p),
          recommended: Boolean(p.recommended),
          content: p.content || "",
          eyecatchUrl: p.eyecatch?.url || "",
        };
      });

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    return res.status(200).json({ posts });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}

export { isPublishedPost, normalizeSummary };
