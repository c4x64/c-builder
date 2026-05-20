import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json());

const CLIENT_ID = process.env.VITE_GITHUB_CLIENT_ID ?? process.env.GITHUB_CLIENT_ID ?? '';
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET ?? '';

// In production, serve the built frontend from the same origin as the API
// This way OAuth redirect (which lands on /) works without a separate dev server
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
}

app.post('/api/github/token', async (req, res) => {
  const { code } = req.body as { code: string };
  if (!code) return res.status(400).json({ error: 'Missing code' });

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return res.status(500).json({ error: 'GitHub OAuth credentials not configured. Copy .env.example to .env and fill in your GitHub OAuth App credentials.' });
  }

  const r = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code }),
  });
  const data = await r.json() as { access_token?: string; error?: string; error_description?: string };
  if (data.error) return res.status(400).json({ error: data.error_description ?? data.error });
  res.json({ access_token: data.access_token });
});

// CORS proxy for importing C header files from any URL
app.post('/api/fetch-proxy', async (req, res) => {
  const { url } = req.body as { url: string };
  if (!url || typeof url !== 'string') return res.status(400).json({ error: 'Missing url' });
  try {
    const r = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(15000) });
    if (!r.ok) return res.status(r.status).json({ error: `Origin returned HTTP ${r.status}` });
    const text = await r.text();
    if (!text) return res.status(400).json({ error: 'Empty response from URL' });
    res.json({ text });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(502).json({ error: `Failed to fetch: ${msg}` });
  }
});

// SPA fallback for production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
