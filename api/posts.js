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

    // あなたの静的サイトが使いやすい形に整形
    const posts = (data.contents || []).map((p) => ({
      id: p.id,
      slug: p.slug || p.id,
      title: p.title,
      publishedAt: p.publishedAt || p.createdAt,
      categoryId: p.categoryId || "ai-news",
      summary: p.summary || "",
      content: p.body || "",
      eyecatchUrl: p.eyecatch?.url || "",
    }));

    // キャッシュ（速く＆API節約）
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    return res.status(200).json({ posts });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
