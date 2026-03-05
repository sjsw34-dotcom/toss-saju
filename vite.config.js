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
      // /api/validate-saju POST — 로컬 개발용 (2차 검증)
      server.middlewares.use('/api/validate-saju', async (req, res) => {
        if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }
        if (req.method !== 'POST') { res.writeHead(405); res.end(JSON.stringify({ error: 'Method not allowed' })); return; }
        let body = '';
        req.on('data', c => body += c);
        req.on('end', async () => {
          try {
            const { text, ilgan, sipsinTable, yearGanJi } = JSON.parse(body);
            const prompt = `당신은 사주명리학 교정 전문가입니다. 아래 사주 분석 텍스트에서 오행/십신 관련 오류만 찾아 수정하세요.

[정확한 오행 상생 관계 — 이것만 존재함]
목생화(木生火), 화생토(火生土), 토생금(土生金), 금생수(金生水), 수생목(水生木)

[정확한 오행 상극 관계 — 이것만 존재함]
목극토(木剋土), 토극수(土剋水), 수극화(水剋火), 화극금(火剋金), 금극목(金剋木)

[일간 ${ilgan} 기준 십신 조견표]
${sipsinTable}

[향후 3년 간지]
${yearGanJi || "제공 안 됨"}

[검증할 텍스트]
${text}

[작업 지시]
1. 텍스트에서 잘못된 오행 관계를 모두 찾으세요
2. 텍스트에서 잘못된 십신 배정을 모두 찾으세요
3. 잘못된 간지가 있으면 찾으세요
4. "다시 말해", "정정:" 같은 자기수정 표현이 있으면 찾으세요

오류가 없으면: {"hasErrors": false}
오류가 있으면: {"hasErrors": true, "corrections": [{"wrong": "원문", "fixed": "수정", "reason": "이유"}]}
JSON만 출력하세요.`;
            const upstream = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
              body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 2048, messages: [{ role: 'user', content: prompt }] }),
            });
            if (!upstream.ok) { const err = await upstream.json().catch(() => ({})); res.writeHead(upstream.status); res.end(JSON.stringify({ error: err.error?.message })); return; }
            const data = await upstream.json();
            const rawText = data.content?.[0]?.text || '';
            const jsonMatch = rawText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ hasErrors: false })); return; }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(jsonMatch[0]);
          } catch (e) {
            console.error('Local validate-saju error:', e);
            if (!res.headersSent) { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ hasErrors: false })); }
          }
        });
      });

      // /api/daily-fortune GET — 로컬 개발용 (캐싱 없이 직접 호출)
      server.middlewares.use('/api/daily-fortune', async (req, res) => {
        if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }
        if (req.method !== 'GET') { res.writeHead(405); res.end(JSON.stringify({ error: 'Method not allowed' })); return; }
        try {
          const url = new URL(req.url, 'http://localhost');
          const date = url.searchParams.get('date');
          const ilgan = url.searchParams.get('ilgan');
          if (!date || ilgan === null) { res.writeHead(400); res.end(JSON.stringify({ error: 'date and ilgan required' })); return; }

          const ilganIdx = parseInt(ilgan, 10);
          const GAN = ["갑","을","병","정","무","기","경","신","임","계"];
          const GAN_HANJA = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
          const OHAENG = ["목","목","화","화","토","토","금","금","수","수"];
          const [y, m, d] = date.split('-').map(Number);

          // JDN → 일진 천간
          const a = Math.floor((14 - m) / 12);
          const yy = y + 4800 - a;
          const mm = m + 12 * a - 3;
          const jdn = d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
          const todayStemIdx = ((jdn + 9) % 10 + 10) % 10;

          const prompt = `당신은 전통 사주명리학 전문가입니다. 오늘의 운세를 분석해주세요.

오늘 날짜: ${y}년 ${m}월 ${d}일
사용자 일간: ${GAN[ilganIdx]}(${GAN_HANJA[ilganIdx]}) — ${OHAENG[ilganIdx]} 오행
오늘 일진 천간: ${GAN[todayStemIdx]}(${GAN_HANJA[todayStemIdx]}) — ${OHAENG[todayStemIdx]} 오행

사주명리학의 오행 상생상극 관계를 바탕으로 오늘의 운세를 분석하세요.
아래 JSON 형식으로만 응답하세요. JSON 외 다른 텍스트는 절대 포함하지 마세요.

{
  "scores": { "total": (60~95), "wealth": (55~95), "love": (50~95), "health": (60~95), "work": (58~95), "luck": (30~95) },
  "summary": "(오늘의 총운 3~4문장)",
  "timeAnalysis": {
    "morning": { "desc": "(오전 06~11시 운세 2~3문장)", "tips": ["추천1", "추천2", "추천3"] },
    "noon": { "desc": "(한낮 11~15시 운세 2~3문장)", "tips": ["추천1", "추천2", "추천3"] },
    "afternoon": { "desc": "(오후 15~19시 운세 2~3문장)", "tips": ["추천1", "추천2", "추천3"] },
    "evening": { "desc": "(저녁 19~23시 운세 2~3문장)", "tips": ["추천1", "추천2", "추천3"] }
  },
  "categoryTexts": { "money": "...", "love": "...", "health": "...", "work": "...", "luck": "...", "match": "..." },
  "luckyItems": { "luckyTime": "...", "luckyColor": "...", "luckyDir": "...", "luckyNums": [7개 1~45] }
}`;

          const upstream = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
            body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 2048, messages: [{ role: 'user', content: prompt }] }),
          });
          if (!upstream.ok) {
            const err = await upstream.json().catch(() => ({}));
            res.writeHead(upstream.status, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.error?.message || `API error (${upstream.status})` }));
            return;
          }
          const data = await upstream.json();
          const text = data.content?.[0]?.text || '';
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (!jsonMatch) { res.writeHead(500); res.end(JSON.stringify({ error: 'Parse failed' })); return; }
          const fortune = JSON.parse(jsonMatch[0]);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(fortune));
        } catch (e) {
          console.error('Local daily-fortune error:', e);
          if (!res.headersSent) { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: e.message })); }
        }
      });

      server.middlewares.use('/api/claude', async (req, res) => {
        if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }
        if (req.method !== 'POST') { res.writeHead(405); res.end(JSON.stringify({ error: 'Method not allowed' })); return; }
        let body = '';
        req.on('data', c => body += c);
        req.on('end', async () => {
          try {
            const { prompt, system } = JSON.parse(body);
            const reqBody = { model: 'claude-haiku-4-5-20251001', max_tokens: 8192, stream: true, messages: [{ role: 'user', content: prompt }] };
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
