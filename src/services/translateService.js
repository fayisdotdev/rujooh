export async function translateText(text, targetLang = 'en') {
  const cleaned = (text || '').trim();
  if (!cleaned) return '';

  const backendUrl = import.meta.env.VITE_TRANSLATION_PROXY_URL;
  if (!backendUrl) {
    throw new Error('Translation is not configured. Add a backend proxy URL to enable translation.');
  }

  const response = await fetch(`${backendUrl.replace(/\/$/, '')}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: cleaned,
      targetLang,
      mode: 'formal-religious-arabic',
    }),
  });

  if (!response.ok) {
    throw new Error(`Translation request failed (${response.status}).`);
  }

  const payload = await response.json();
  if (!payload?.translation) {
    throw new Error('Translation service returned no translation.');
  }

  return payload.translation;
}
