export default async function handler(req, res) {
  try {
    const domain = process.env.MICROCMS_SERVICE_DOMAIN;
    const apiKey = process.env.MICROCMS_API_KEY;
    const endpoint = process.env.MICROCMS_ENDPOINT || "blog";

    const url = `https://${domain}.microcms.io/api/v1/${endpoint}?limit=100&orders=-publishedAt`;

    const r = await fetch(url, {
      headers: { "X-MICROCMS-API-KEY": apiKey },
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(r.status).send(text);
    }

    const data = await r.json();

    const posts = (data.contents || []).map((p) => {
      const normalizedCategoryId = Array.isArray(p.categoryId)
        ? p.categoryId[0]
        : p.categoryId;

      return {
        id: p.id,
        slug: p.slug || p.id,
        title: p.title,
        publishedAt: p.publishedAt || p.createdAt,
        categoryId: normalizedCategoryId || "ai-news",
        summary: p.summary || "",
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
