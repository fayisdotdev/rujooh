import Anthropic from '@anthropic-ai/sdk';
import 'dotenv/config';
import express from 'express';

const app = express();
const port = Number(process.env.PORT) || 3001;
const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
);
const model = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5';
const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

app.use(express.json({ limit: '16kb' }));

app.use((request, response, next) => {
  const origin = request.get('origin');

  if (origin && !allowedOrigins.has(origin)) {
    response.status(403).json({ error: 'This origin is not allowed to use the translation service.' });
    return;
  }

  if (origin) {
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Vary', 'Origin');
    response.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }

  if (request.method === 'OPTIONS') {
    response.sendStatus(204);
    return;
  }

  next();
});

app.get('/api/health', (_request, response) => {
  response.json({ ok: true, translationConfigured: Boolean(client) });
});

app.post('/api/translate', async (request, response) => {
  const { text, targetLang } = request.body ?? {};

  if (typeof text !== 'string' || !text.trim() || text.length > 5000) {
    response.status(400).json({ error: 'Text must contain between 1 and 5000 characters.' });
    return;
  }

  if (!['en', 'ml'].includes(targetLang)) {
    response.status(400).json({ error: 'Target language must be "en" or "ml".' });
    return;
  }

  if (!client) {
    response.status(503).json({
      error: 'Translation is not configured. Add ANTHROPIC_API_KEY to the backend .env file.',
    });
    return;
  }

  const languageName = targetLang === 'ml' ? 'Malayalam' : 'English';

  try {
    const result = await client.messages.create({
      model,
      max_tokens: 1200,
      system: `Translate formal and religious Arabic faithfully into ${languageName}. Preserve the meaning and religious register. Output only the translation.`,
      messages: [{ role: 'user', content: text.trim() }],
    });
    const translation = result.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('')
      .trim();

    if (!translation) {
      response.status(502).json({ error: 'The translation service returned an empty result.' });
      return;
    }

    response.json({ translation });
  } catch (error) {
    console.error('Translation provider request failed:', error);
    response.status(502).json({ error: 'The translation provider could not complete the request.' });
  }
});

app.listen(port, () => {
  console.log(`Translation API listening on http://localhost:${port}`);
});
