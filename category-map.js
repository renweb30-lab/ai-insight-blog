(() => {
  const CATEGORY_LABELS = {
    "ai-stocks": "AI株情報",
    "ai-intro": "AI入門",
    "ai-tools": "AIツール",
    "ai-news": "AI関連ニュース",
  };

  const normalizeCategoryId = (value) => {
    if (Array.isArray(value)) return normalizeCategoryId(value[0]);
    if (value && typeof value === "object") return value.id || value.slug || "";
    return value || "";
  };

  const getCategoryLabel = (value) => {
    const id = normalizeCategoryId(value);
    return CATEGORY_LABELS[id] || id || "";
  };

  window.CATEGORY_LABELS = CATEGORY_LABELS;
  window.normalizeCategoryId = normalizeCategoryId;
  window.getCategoryLabel = getCategoryLabel;
})();
