// 사주 분석 결과 2차 검증 엔드포인트
// POST /api/validate-saju
// 생성된 텍스트에서 오행 상생상극/십신 오류를 검출하고 수정

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  try {
    const { text, ilgan, sipsinTable, yearGanJi } = req.body;
    if (!text || !ilgan || !sipsinTable) {
      return res.status(400).json({ error: "text, ilgan, sipsinTable required" });
    }

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
1. 텍스트에서 잘못된 오행 관계를 모두 찾으세요 (예: "목생토" → "목극토", "목극금" → "금극목")
2. 텍스트에서 잘못된 십신 배정을 모두 찾으세요 (예: "무토는 비겁" → 위 조견표 기준으로 수정)
3. 잘못된 간지가 있으면 찾으세요
4. "다시 말해", "정정:" 같은 자기수정 표현이 있으면 찾으세요

오류가 없으면 정확히 다음만 출력:
{"hasErrors": false}

오류가 있으면 다음 JSON 형식으로 출력:
{"hasErrors": true, "corrections": [{"wrong": "잘못된 원문 구절", "fixed": "수정된 구절", "reason": "이유"}]}

JSON만 출력하세요. 다른 텍스트는 절대 포함하지 마세요.`;

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
        error: err.error?.message || `API error (${response.status})`,
      });
    }

    const data = await response.json();
    const rawText = data.content?.[0]?.text || "";

    // JSON 파싱
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(200).json({ hasErrors: false });
    }

    const result = JSON.parse(jsonMatch[0]);
    return res.status(200).json(result);
  } catch (error) {
    console.error("validate-saju error:", error);
    // 검증 실패해도 원본 텍스트는 유지 — 에러 시 통과 처리
    return res.status(200).json({ hasErrors: false });
  }
}
