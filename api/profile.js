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
  const profile = Object.fromEntries(
    PROFILE_FIELDS.map((field) => [field, typeof data[field] === "string" ? data[field].trim() : ""])
  );
  profile.iconUrl = typeof data.icon?.url === "string" ? data.icon.url : "";
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

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    return res.status(200).json({ profile: normalizeProfile(await response.json()) });
  } catch (error) {
    return res.status(500).json({ error: String(error) });
  }
}

export { normalizeProfile };
