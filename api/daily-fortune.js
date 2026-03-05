// 오늘의 운세 AI 엔드포인트 — 일간(日干) 기반 CDN 캐싱
// GET /api/daily-fortune?date=2026-03-05&ilgan=3

// 천간(十天干) 배열
const GAN = ["갑","을","병","정","무","기","경","신","임","계"];
const GAN_HANJA = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];

// 오행(五行) 매핑
const OHAENG = ["목","목","화","화","토","토","금","금","수","수"];

// JDN(율리우스 일수) 계산으로 일진 산출
function getJDN(year, month, day) {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y +
    Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

// 오늘의 일진 천간 인덱스 (0~9)
function getTodayStemIndex(year, month, day) {
  const jdn = getJDN(year, month, day);
  return ((jdn + 9) % 10 + 10) % 10;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  // 파라미터 파싱
  const { date, ilgan } = req.query;
  if (!date || ilgan === undefined) {
    return res.status(400).json({ error: "date and ilgan are required" });
  }

  const ilganIdx = parseInt(ilgan, 10);
  if (isNaN(ilganIdx) || ilganIdx < 0 || ilganIdx > 9) {
    return res.status(400).json({ error: "ilgan must be 0-9" });
  }

  // 오늘 날짜 파싱
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return res.status(400).json({ error: "Invalid date format" });

  // 오늘 일진 계산
  const todayStemIdx = getTodayStemIndex(y, m, d);
  const todayStem = GAN[todayStemIdx];
  const myStem = GAN[ilganIdx];
  const myOhaeng = OHAENG[ilganIdx];
  const todayOhaeng = OHAENG[todayStemIdx];

  // Claude Haiku 프롬프트
  const prompt = `당신은 전통 사주명리학 전문가입니다. 오늘의 운세를 분석해주세요.

오늘 날짜: ${y}년 ${m}월 ${d}일
사용자 일간: ${myStem}(${GAN_HANJA[ilganIdx]}) — ${myOhaeng} 오행
오늘 일진 천간: ${todayStem}(${GAN_HANJA[todayStemIdx]}) — ${todayOhaeng} 오행

사주명리학의 오행 상생상극 관계를 바탕으로 오늘의 운세를 분석하세요.
아래 JSON 형식으로만 응답하세요. JSON 외 다른 텍스트는 절대 포함하지 마세요.

{
  "scores": {
    "total": (60~95 사이 정수, 일간과 일진의 오행 관계 기반),
    "wealth": (55~95 사이 정수),
    "love": (50~95 사이 정수),
    "health": (60~95 사이 정수),
    "work": (58~95 사이 정수),
    "luck": (30~95 사이 정수)
  },
  "summary": "(오늘의 총운 3~4문장. 일간과 일진의 오행 상생상극을 언급하며 구체적 조언 포함)",
  "timeAnalysis": {
    "morning": { "desc": "(오전 06~11시 운세 2~3문장)", "tips": ["추천1", "추천2", "추천3"] },
    "noon": { "desc": "(한낮 11~15시 운세 2~3문장)", "tips": ["추천1", "추천2", "추천3"] },
    "afternoon": { "desc": "(오후 15~19시 운세 2~3문장)", "tips": ["추천1", "추천2", "추천3"] },
    "evening": { "desc": "(저녁 19~23시 운세 2~3문장)", "tips": ["추천1", "추천2", "추천3"] }
  },
  "categoryTexts": {
    "money": "(금전운 상세 2~3문장)",
    "love": "(연애운 상세 2~3문장)",
    "health": "(건강운 상세 2~3문장)",
    "work": "(직장운 상세 2~3문장)",
    "luck": "(로또/행운 상세 2~3문장)",
    "match": "(인간관계/궁합운 상세 2~3문장)"
  },
  "luckyItems": {
    "luckyTime": "(예: 오후 2시~4시)",
    "luckyColor": "(예: 파란색 계열)",
    "luckyDir": "(예: 남동쪽)",
    "luckyNums": [7개의 1~45 사이 서로 다른 정수]
  }
}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: err.error?.message || `Anthropic API error (${response.status})`,
      });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";

    // JSON 파싱 — ```json 코드블럭 안에 있을 수도 있음
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: "Failed to parse AI response" });
    }

    const fortune = JSON.parse(jsonMatch[0]);

    // CDN 캐싱: 24시간 (s-maxage), 브라우저 5분 (max-age)
    res.setHeader("Cache-Control", "public, s-maxage=86400, max-age=300, stale-while-revalidate=3600");
    res.setHeader("Content-Type", "application/json");
    return res.status(200).json(fortune);
  } catch (error) {
    console.error("daily-fortune error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
