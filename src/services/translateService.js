function getApiBaseUrl() {
  return (import.meta.env.VITE_TRANSLATION_PROXY_URL || '/api').replace(/\/$/, '');
}

async function requestJson(path, options) {
  try {
    return await fetch(`${getApiBaseUrl()}${path}`, options);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Cannot reach the translation server. Start the app with npm run dev.');
    }

    throw error;
  }
}

export async function getTranslationServiceStatus() {
  const response = await requestJson('/health');
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || 'The translation server is unavailable.');
  }

  return {
    available: true,
    configured: Boolean(payload.translationConfigured),
  };
}

export async function translateText(text, targetLang = 'en') {
  const cleaned = (text || '').trim();
  if (!cleaned) return '';

  const response = await requestJson('/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: cleaned, targetLang }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error || `Translation request failed (${response.status}).`);
  }

  if (!payload?.translation) {
    throw new Error('Translation service returned no translation.');
  }

  return payload.translation;
}
