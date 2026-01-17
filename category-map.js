(() => {
  const CATEGORY_LABELS = {
    "ai-stocks": "AI株情報",
    "ai-intro": "AI使い方入門",
    "ai-tools": "AIツール紹介",
    "ai-news": "AI関連ニュース",
  };

  const normalizeCategoryId = (value) => {
    if (Array.isArray(value)) return value[0] || "";
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
