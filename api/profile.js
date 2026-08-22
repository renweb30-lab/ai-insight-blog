const PROFILE_FIELDS = [
  "name",
  "role",
  "bio",
  "heroTitle",
  "heroText",
  "missionTitle",
  "missionText",
  "styleTitle",
  "styleText",
  "audienceTitle",
  "audienceText",
  "instagramUrl",
  "coconalaUrl",
  "threadsUrl",
  "xUrl",
];

function normalizeProfile(data = {}) {
  // Support both an object endpoint response and the first item returned by a
  // list endpoint. This also makes the image handling resilient if the API
  // schema is changed without requiring a frontend update.
  const source = Array.isArray(data.contents) ? (data.contents[0] || {}) : data;
  const profile = Object.fromEntries(
    PROFILE_FIELDS.map((field) => [field, typeof source[field] === "string" ? source[field].trim() : ""])
  );
  const icon = Array.isArray(source.icon) ? source.icon[0] : source.icon;
  const rawIconUrl = typeof icon === "string" ? icon : icon?.url;
  if (typeof rawIconUrl === "string" && rawIconUrl) {
    try {
      const iconUrl = new URL(rawIconUrl);
      // microCMS can retain an image URL while its contents change. Versioning
      // the URL with updatedAt prevents the browser/CDN from showing the old icon.
      if (source.updatedAt) iconUrl.searchParams.set("v", source.updatedAt);
      profile.iconUrl = iconUrl.href;
    } catch {
      profile.iconUrl = rawIconUrl;
    }
  } else {
    profile.iconUrl = "";
  }
  return profile;
}

export default async function handler(req, res) {
  try {
    const domain = process.env.MICROCMS_SERVICE_DOMAIN;
    const apiKey = process.env.MICROCMS_API_KEY;
    if (!domain || !apiKey) {
      return res.status(500).json({ error: "microCMS is not configured" });
    }

    const response = await fetch(`https://${domain}.microcms.io/api/v1/profile`, {
      headers: { "X-MICROCMS-API-KEY": apiKey },
    });
    if (!response.ok) return res.status(response.status).send(await response.text());

    // Profile edits (especially a replaced icon) should be visible immediately.
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ profile: normalizeProfile(await response.json()) });
  } catch (error) {
    return res.status(500).json({ error: String(error) });
  }
}

export { normalizeProfile };
