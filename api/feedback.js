export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    // 受け取るデータ
    const {
      postId,
      postTitle,
      categoryId,
      publishedAt,
      feedback,
      comment,
      url,
      referrer,
      ua,
      ts
    } = req.body || {};

    if (!postId || !feedback) {
      return res.status(400).json({ error: "postId and feedback are required" });
    }

    // ===== 保存先（Google Sheets / Apps Script Web App）=====
    // ここに Google Apps Script の Web App URL を入れる（後述）
    const sheetWebhook = process.env.FEEDBACK_SHEETS_WEBHOOK_URL;
    if (!sheetWebhook) {
      return res.status(500).json({ error: "Missing FEEDBACK_SHEETS_WEBHOOK_URL" });
    }

    const payload = {
      postId,
      postTitle: postTitle || "",
      categoryId: categoryId || "",
      publishedAt: publishedAt || "",
      feedback,            // helpful / neutral / improve
      comment: comment || "",
      url: url || "",
      referrer: referrer || "",
      ua: ua || "",
      ts: ts || new Date().toISOString(),
    };

    const r = await fetch(sheetWebhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(500).json({ error: "Failed to write to sheet", detail: text });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
