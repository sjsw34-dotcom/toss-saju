// 오늘의 운세 AI 엔드포인트 — 4주(四柱) 전체 기반 정밀 분석
// GET /api/daily-fortune?date=2026-04-05&ilgan=3&stems=8,6,3,0&branches=4,2,6,0&gender=남성

const GAN = ["갑","을","병","정","무","기","경","신","임","계"];
const GAN_HANJA = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
const JI = ["자","축","인","묘","진","사","오","미","신","유","술","해"];
const JI_HANJA = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
const OHAENG = ["목","목","화","화","토","토","금","금","수","수"];
const JI_OHAENG = ["수","토","목","목","토","화","화","토","금","금","토","수"];

function getJDN(year, month, day) {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y +
    Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

function getTodayPillar(year, month, day) {
  const jdn = getJDN(year, month, day);
  const d60 = ((jdn - 2445733) % 60 + 60) % 60;
  return { s: d60 % 10, b: d60 % 12 };
}

// 십신 계산
function getSipsin(ilganIdx, targetStemIdx) {
  const sipsinNames = ["비견","겁재","식신","상관","편재","정재","편관","정관","편인","정인"];
  const myElem = Math.floor(ilganIdx / 2);
  const targetElem = Math.floor(targetStemIdx / 2);
  const diff = ((targetElem - myElem) % 5 + 5) % 5;
  const samePol = (targetStemIdx % 2) === (ilganIdx % 2);
  return sipsinNames[diff * 2 + (samePol ? 0 : 1)];
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  const { date, ilgan, stems, branches, gender } = req.query;
  if (!date || ilgan === undefined) {
    return res.status(400).json({ error: "date and ilgan are required" });
  }

  const ilganIdx = parseInt(ilgan, 10);
  if (isNaN(ilganIdx) || ilganIdx < 0 || ilganIdx > 9) {
    return res.status(400).json({ error: "ilgan must be 0-9" });
  }

  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return res.status(400).json({ error: "Invalid date format" });

  // 오늘 일진 계산
  const todayPillar = getTodayPillar(y, m, d);
  const todayStem = GAN[todayPillar.s];
  const todayBranch = JI[todayPillar.b];
  const todaySipsin = getSipsin(ilganIdx, todayPillar.s);
  const myStem = GAN[ilganIdx];
  const myOhaeng = OHAENG[ilganIdx];
  const todayOhaeng = OHAENG[todayPillar.s];

  // 4주 정보 파싱 (있으면 정밀 분석, 없으면 일간만)
  let sajuInfo = "";
  if (stems && branches) {
    const sArr = stems.split(",").map(Number);
    const bArr = branches.split(",").map(Number);
    const labels = ["연주","월주","일주","시주"];
    const pillarLines = sArr.map((s, i) => {
      if (s < 0 || isNaN(s)) return `${labels[i]}: 미입력`;
      const b = bArr[i];
      const ganSipsin = i === 2 ? "(일간=본인)" : ` → ${getSipsin(ilganIdx, s)}`;
      return `${labels[i]}: ${GAN[s]}${GAN_HANJA[s]}/${JI[b]}${JI_HANJA[b]} (천간 ${OHAENG[s]}${ganSipsin}, 지지 ${JI_OHAENG[b]})`;
    }).join("\n");

    // 오행 집계
    const ec = { 목:0, 화:0, 토:0, 금:0, 수:0 };
    sArr.forEach(s => { if (s >= 0) ec[OHAENG[s]]++; });
    bArr.forEach(b => { if (b >= 0) ec[JI_OHAENG[b]]++; });
    const elemStr = Object.entries(ec).map(([k,v]) => `${k}(${v})`).join(" ");

    sajuInfo = `
[의뢰인 사주 원국 — 4주(四柱)]
${pillarLines}
일간: ${myStem}(${GAN_HANJA[ilganIdx]}) — ${myOhaeng}
오행 분포: ${elemStr}
${gender ? `성별: ${gender}` : ""}

[오늘 일진이 이 사주에 미치는 영향]
오늘 천간 ${todayStem}(${todayOhaeng})은 일간 ${myStem}(${myOhaeng}) 기준 "${todaySipsin}"에 해당합니다.
`;
  } else {
    sajuInfo = `
사용자 일간: ${myStem}(${GAN_HANJA[ilganIdx]}) — ${myOhaeng} 오행
오늘 일진 천간: ${todayStem}(${GAN_HANJA[todayPillar.s]}) — ${todayOhaeng} 오행
오늘 일진이 일간 기준 "${todaySipsin}"에 해당합니다.
`;
  }

  const prompt = `당신은 사주명리학 전문가입니다. 오늘의 운세를 분석해주세요.

오늘 날짜: ${y}년 ${m}월 ${d}일
오늘 일진: ${todayStem}${todayBranch}일 (${todayOhaeng})
${sajuInfo}
[오행 상생] 목생화, 화생토, 토생금, 금생수, 수생목
[오행 상극] 목극토, 토극수, 수극화, 화극금, 금극목

위 사주 원국과 오늘 일진의 오행 상생상극, 십신 관계를 바탕으로 분석하세요.
반드시 아래 JSON 형식으로만 응답하세요. JSON 외 텍스트는 절대 포함하지 마세요.

{
  "scores": {
    "total": (55~95 사이 정수, 일간과 일진의 십신 관계 기반 — 인성/식상이면 높게, 관성이면 낮게),
    "wealth": (50~95 사이 정수, 재성 관련),
    "love": (50~95 사이 정수, 일지·도화 관련),
    "health": (55~95 사이 정수, 관성이면 주의),
    "work": (55~95 사이 정수, 관성/인성 관련),
    "luck": (30~95 사이 정수, 편재·식상 관련)
  },
  "summary": "(오늘의 총운 3~4문장. 오늘 일진이 일간에 ${todaySipsin}이므로 그에 맞는 구체적 해석. 추상적 일반론 금지.)",
  "timeAnalysis": {
    "morning": { "desc": "(오전 06~11시 운세 2문장, 오행 흐름 근거)", "tips": ["구체적 행동1", "구체적 행동2", "구체적 행동3"] },
    "noon": { "desc": "(한낮 11~15시 운세 2문장)", "tips": ["행동1", "행동2", "행동3"] },
    "afternoon": { "desc": "(오후 15~19시 운세 2문장)", "tips": ["행동1", "행동2", "행동3"] },
    "evening": { "desc": "(저녁 19~23시 운세 2문장)", "tips": ["행동1", "행동2", "행동3"] }
  },
  "categoryTexts": {
    "money": "(금전운 3문장 — 재성(편재/정재) 관점에서 구체적으로)",
    "love": "(연애운 3문장 — 일지와 오늘 지지 관계 기반)",
    "health": "(건강운 3문장 — 오행 과다/부족 장부 기반으로)",
    "work": "(직장운 3문장 — 관성/인성 관점에서)",
    "luck": "(행운 3문장 — 편재·식상 관점에서)",
    "match": "(인간관계 3문장 — 비겁·인성 관점에서)"
  },
  "luckyItems": {
    "luckyTime": "(용신 오행이 강한 시간대, 예: 오후 2시~4시)",
    "luckyColor": "(용신 오행 색상, 예: 파란색 계열)",
    "luckyDir": "(용신 오행 방위, 예: 북쪽)",
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

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: "Failed to parse AI response" });
    }

    const fortune = JSON.parse(jsonMatch[0]);

    // CDN 캐싱: 일간+날짜별로 캐시 (4주 포함 시 캐시 키가 달라지므로 시간 단축)
    res.setHeader("Cache-Control", "public, s-maxage=43200, max-age=300, stale-while-revalidate=3600");
    res.setHeader("Content-Type", "application/json");
    return res.status(200).json(fortune);
  } catch (error) {
    console.error("daily-fortune error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
