import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// 로컬 API 프록시 플러그인: Vercel 경유 없이 직접 Anthropic 호출 (타임아웃 없음)
function localApiPlugin() {
  let apiKey = '';
  return {
    name: 'local-api-proxy',
    configResolved(config) {
      apiKey = process.env.ANTHROPIC_API_KEY || '';
    },
    configureServer(server) {
      server.middlewares.use('/api/claude', async (req, res) => {
        if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }
        if (req.method !== 'POST') { res.writeHead(405); res.end(JSON.stringify({ error: 'Method not allowed' })); return; }
        let body = '';
        req.on('data', c => body += c);
        req.on('end', async () => {
          try {
            const { prompt, system } = JSON.parse(body);
            const reqBody = { model: 'claude-sonnet-4-6', max_tokens: 8192, stream: true, messages: [{ role: 'user', content: prompt }] };
            if (system) reqBody.system = system;
            const upstream = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
              body: JSON.stringify(reqBody),
            });
            if (!upstream.ok) {
              const err = await upstream.json().catch(() => ({}));
              res.writeHead(upstream.status, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.error?.message || `API error (${upstream.status})` }));
              return;
            }
            res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
            const reader = upstream.body.getReader();
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                res.write(value);
              }
            } finally { reader.releaseLock(); }
            res.end();
          } catch (e) {
            console.error('Local API error:', e);
            if (!res.headersSent) { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: e.message })); }
          }
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // loadEnv로 로드한 키를 process.env에 설정
  if (env.ANTHROPIC_API_KEY) process.env.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;

  return {
    plugins: [
      react({ babel: { plugins: ['@emotion/babel-plugin'] } }),
      localApiPlugin(),
    ],
  };
})
