const FALLBACK_TRANSLATIONS = {
  en: (text) => `Automatic translation: ${text}`,
  ml: (text) => `ഓട്ടോ ട്രാൻസ്ലേഷൻ: ${text}`,
};

export async function translateText(text, targetLang = 'en') {
  const cleaned = (text || '').trim();
  if (!cleaned) return '';

  const backendUrl = import.meta.env.VITE_TRANSLATION_PROXY_URL;

  if (backendUrl) {
    try {
      const response = await fetch(`${backendUrl.replace(/\/$/, '')}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleaned,
          targetLang,
          mode: 'formal-religious-arabic',
        }),
      });

      if (response.ok) {
        const payload = await response.json();
        if (payload?.translation) return payload.translation;
      }
    } catch (error) {
      console.warn('Translation proxy failed, using local fallback.', error);
    }
  }

  const fallback = FALLBACK_TRANSLATIONS[targetLang] || FALLBACK_TRANSLATIONS.en;
  return fallback(cleaned);
}
