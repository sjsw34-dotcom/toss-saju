/**
 * 프리미엄 11개 상품 자동 검증 스크립트
 * 테스트 대상: 1988년 1월 2일 남성 (시간 미입력)
 *
 * 실행: node test-premium.mjs
 */
import { readFileSync } from 'fs';

// .env 파일 직접 파싱 (dotenv 없이)
const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim();
}
const API_KEY = envVars.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
if (!API_KEY) { console.error('ANTHROPIC_API_KEY not found in .env'); process.exit(1); }

// ── 만세력 계산 (App.jsx와 동일 로직) ──
const GAN = ["갑","을","병","정","무","기","경","신","임","계"];
const GAN_HAN = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
const JI = ["자","축","인","묘","진","사","오","미","신","유","술","해"];
const JI_HAN = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
const JEOLGI = [6, 4, 6, 5, 6, 6, 7, 7, 8, 8, 7, 7];
const MB_MAP = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0];
const GAN_ELEM = ["목","목","화","화","토","토","금","금","수","수"];
const JI_ELEM = ["수","토","목","목","토","화","화","토","금","금","토","수"];
const STEMS_KO = GAN;
const BRANCHES_KO = JI;

const getJDN = (year, month, day) => {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y +
    Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
};
const pillarStr = (s, b) => `${GAN[s]}${GAN_HAN[s]}/${JI[b]}${JI_HAN[b]}`;
const calcYearPillar = (ly) => { const s = ((ly-4)%10+10)%10, b = ((ly-4)%12+12)%12; return { s, b, str: pillarStr(s,b) }; };
const calcMonthPillar = (ly, sm, sd) => {
  const ys = ((ly-4)%10+10)%10;
  const b = sd < JEOLGI[sm-1] ? MB_MAP[(sm-2+12)%12] : MB_MAP[sm-1];
  const s = ([2,4,6,8,0][ys%5] + (b-2+12)%12) % 10;
  return { s, b, str: pillarStr(s,b) };
};
const calcDayPillar = (y, m, d) => {
  const d60 = ((getJDN(y,m,d) - 2445733) % 60 + 60) % 60;
  return { s: d60%10, b: d60%12, str: pillarStr(d60%10, d60%12) };
};
const calcHourPillar = (ds, hb) => {
  const b = Math.max(0, JI.indexOf(hb));
  const s = ([0,2,4,6,8][ds%5] + b) % 10;
  return { s, b, str: hb ? pillarStr(s,b) : "시 미입력" };
};

// 음력 설날 테이블
const lunarNewYear = {
  1987: [1, 29], 1988: [2, 17], 1989: [2, 6]
};
const getLunarYear = (y, m, d) => {
  const entry = lunarNewYear[y];
  if (!entry) return y;
  const [nm, nd] = entry;
  return (m < nm || (m === nm && d < nd)) ? y - 1 : y;
};

// ── 테스트 설정 ──
const birthYear = 1988, birthMonth = 1, birthDay = 2;
const gender = "남성";
const lunarY = getLunarYear(birthYear, birthMonth, birthDay);

const yp = calcYearPillar(lunarY);
const mp = calcMonthPillar(lunarY, birthMonth, birthDay);
const dp = calcDayPillar(birthYear, birthMonth, birthDay);
const hp = calcHourPillar(dp.s, "");

const elemCount = { 목:0, 화:0, 토:0, 금:0, 수:0 };
[yp.s, mp.s, dp.s, hp.s].forEach(s => { if (s >= 0) elemCount[GAN_ELEM[s%10]]++; });
[yp.b, mp.b, dp.b, hp.b].forEach(b => { if (b >= 0) elemCount[JI_ELEM[b%12]]++; });
const elemStr = Object.entries(elemCount).map(([k,v]) => `${k}(${v})`).join(" ");
const ilgan = GAN[dp.s];
const ilganElem = GAN_ELEM[dp.s];

const thisYear = 2026;
const thisMonth = 3;
const yearStem = STEMS_KO[((thisYear-4)%10+10)%10];
const yearBranch = BRANCHES_KO[((thisYear-4)%12+12)%12];
const yearGanJi = [0,1,2].map(offset => {
  const y = thisYear + offset;
  return `${y}년 ${STEMS_KO[((y-4)%10+10)%10]}${BRANCHES_KO[((y-4)%12+12)%12]}년`;
}).join(", ");
const currentAge = thisYear - birthYear;

console.log("=== 만세력 검증 ===");
console.log(`생년월일: ${birthYear}.${birthMonth}.${birthDay} (${gender})`);
console.log(`음력년: ${lunarY} | 연주: ${yp.str} | 월주: ${mp.str} | 일주: ${dp.str} | 시주: ${hp.str}`);
console.log(`일간: ${ilgan}(${ilganElem}) | 오행: ${elemStr}`);
console.log(`향후 3년: ${yearGanJi}`);
console.log(`만 나이: ${currentAge}세`);
console.log("");

// ── 11개 상품 ──
const premiumItems = [
  { title: "2026 신년 사주", desc: "올해의 대운과 세운을 총망라한 신년 특별 분석" },
  { title: "내 말년 운세, 돈 걱정 없이 편안할까?", desc: "노후 재물운과 재테크 방향 분석" },
  { title: "갱년기와 중년 건강, 어디를 조심할까?", desc: "건강 취약 시기와 관리 포인트" },
  { title: "나에게도 횡재수가 있을까? 로또/투자", desc: "금전 행운의 시기와 투자 적기" },
  { title: "올해 피해야 할 삼재와 액운은?", desc: "주의할 시기와 액막이 방법" },
  { title: "내 인생의 황금기, 아직 남았을까?", desc: "대운 흐름으로 보는 인생 전환점" },
  { title: "은퇴 후 삶, 어떻게 보내면 좋을까?", desc: "은퇴 시기와 노후 생활 방향" },
  { title: "제2의 직업, 나에게 맞을까?", desc: "전직/부업 적성과 시기 분석" },
  { title: "가족 간 갈등, 언제쯤 풀릴까?", desc: "가족 관계 개선 시기와 방향" },
  { title: "소소하게 가게라도 해볼까? 창업운", desc: "창업 적성, 시기, 업종 분석" },
  { title: "이사/매매, 지금 움직여도 될까요?", desc: "이사 방위와 부동산 매매 시기" },
];

// 일간 기준 십신 조견표 계산
const sipsinNames = ["비견","겁재","식신","상관","편재","정재","편관","정관","편인","정인"];
const getSipsin = (stemIdx) => {
  const ilganElemIdx = Math.floor(dp.s / 2);
  const targetElemIdx = Math.floor(stemIdx / 2);
  const elemDiff = ((targetElemIdx - ilganElemIdx) % 5 + 5) % 5;
  const samePol = (stemIdx % 2) === (dp.s % 2);
  return sipsinNames[elemDiff * 2 + (samePol ? 0 : 1)];
};
const sipsinTable = {};
for (let i = 0; i < 10; i++) sipsinTable[GAN[i]] = getSipsin(i);
const sipsinStr = GAN.map(g => `${g}=${sipsinTable[g]}`).join(", ");

// ── 각 기둥·연도의 십신을 코드로 사전 계산 ──
const labelStem = (idx) => `${GAN[idx]}(${GAN_ELEM[idx]}) → ${getSipsin(idx)}`;
const pillarSipsin = [
  `연주 천간: ${labelStem(yp.s)}`,
  `월주 천간: ${labelStem(mp.s)}`,
  `일주 천간: ${labelStem(dp.s)} (본인=일간)`,
].join("\n");

const futureYearSipsin = [0, 1, 2].map(offset => {
  const y = thisYear + offset;
  const yStemIdx = ((y - 4) % 10 + 10) % 10;
  const yBranchIdx = ((y - 4) % 12 + 12) % 12;
  return `${y}년 ${GAN[yStemIdx]}${JI[yBranchIdx]}년 — 천간 ${GAN[yStemIdx]}(${GAN_ELEM[yStemIdx]})은 ${getSipsin(yStemIdx)}, 지지 ${JI[yBranchIdx]}(${JI_ELEM[yBranchIdx]})`;
}).join("\n");

console.log("\n=== 사전 계산된 십신 ===");
console.log(pillarSipsin);
console.log(futureYearSipsin);
console.log("");

const systemPrompt = `당신은 40년 경력의 사주명리학 대가입니다. 적천수, 자평진전, 궁통보감에 정통하며, 의뢰인의 실제 사주 글자와 오행 수치를 반드시 인용하여 구체적으로 분석합니다.
추상적이거나 누구에게나 해당되는 말은 절대 하지 않습니다. 한국어 존댓말을 사용하고, 따뜻하지만 권위 있는 전문가 어조로 작성합니다.
반드시 4개 섹션 구분자(##...##)를 모두 사용하고, 각 섹션을 400자 이상 충실히 작성하세요. 절대 중간에 끊거나 요약하지 마세요.

[오행 상생 — 반드시 이 방향만 사용]
목생화(木生火), 화생토(火生土), 토생금(土生金), 금생수(金生水), 수생목(水生木)

[오행 상극 — 반드시 이 방향만 사용]
목극토(木剋土), 토극수(土剋水), 수극화(水剋火), 화극금(火剋金), 금극목(金剋木)
※ "목극금", "토극목", "수극토" 등 존재하지 않는 관계를 절대 사용하지 마세요.

[십신 조견표 — 일간 ${ilgan} 기준, 반드시 이 표만 사용]
${sipsinStr}
※ 위 표에 없는 십신 배정은 절대 하지 마세요.

[이 사주의 각 기둥 십신 — 아래 내용을 그대로 인용하세요]
${pillarSipsin}

[향후 3년 간지와 십신 — 아래 내용을 그대로 인용하세요]
${futureYearSipsin}

[절대 금지]
- 자기 수정 표현 금지: "정정:", "수정:", "다시 말해" 등 AI가 스스로 틀렸다고 고치는 문구를 절대 포함하지 마세요.
- 괄호 안 메타 설명 금지: "(목생화 아니라...)" 같은 내부 사고 과정을 노출하지 마세요.
- 처음부터 정확하게 한 번에 서술하세요. 완성된 전문가 보고서처럼 매끄럽게 작성하세요.
- 마크다운 서식 금지: *, **, #, -, \` 등 마크다운 기호를 절대 사용하지 마세요. 순수 텍스트로만 작성하세요.`;

function buildPrompt(itemTitle, itemDesc) {
  return `[만세력 정보]
현재: ${thisYear}년 ${thisMonth}월 (${yearStem}${yearBranch}년)
향후 3년 간지: ${yearGanJi}
생년월일: ${birthYear}년 ${birthMonth}월 ${birthDay}일 (양력) / 양력 ${birthYear}.${birthMonth}.${birthDay} / ${gender} / 현재 만 ${currentAge}세
연주: ${yp.str} | 월주: ${mp.str} | 일주: ${dp.str} | 시주: ${hp.str}
일간: ${ilgan}(${ilganElem}) | 오행: ${elemStr}

[분석 의뢰]
"${itemTitle}" — ${itemDesc}

[작성 규칙]
아래 4개 구분자를 정확히 사용하세요. 각 섹션 400자 이상. 구분자 외 특수기호 금지.
연도별 간지는 반드시 위 [만세력 정보]에 명시된 것만 사용하세요. 임의로 추측하지 마세요.
십신(비겁·식상·재성·관성·인성) 판단 시 일간 ${ilgan}(${ilganElem})을 기준으로 정확히 산출하세요.
대운(大運)은 [만세력 정보]에 제공되지 않았으므로 언급하지 마세요.

##사주풀이##
이 사주의 일간 ${ilgan}(${ilganElem})의 강약, 오행 균형(${elemStr}), 용신을 밝히되, "${itemTitle}" 주제와 직접 연결하여 해석하세요. 이 사주가 왜 이 주제에서 어떤 특성을 보이는지 사주 글자를 근거로 서술하세요.

##핵심분석##
"${itemTitle}"에 대해 이 사주가 가진 강점과 약점을 구체적으로 풀어주세요. 오행 상생상극과 실제 수치(${elemStr})를 근거로, 이 사람만의 고유한 특징을 짚어주세요. 뻔한 일반론이 아니라 이 사주에서만 나올 수 있는 이야기를 해주세요.

##시기와흐름##
위 [만세력 정보]의 "향후 3년 간지"를 정확히 사용하세요. 각 연도의 천간 십신은 이미 계산되어 있으니 그대로 인용하세요:
${futureYearSipsin}
각 연도가 이 사주에 미치는 영향과 "${itemTitle}" 관점에서 좋은 시기·주의할 시기를 구체적으로 알려주세요.

##실천조언##
"${itemTitle}"과 관련하여 이 사주의 용신을 살리는 구체적 행동 지침(방위, 색상, 습관, 주의사항 등)을 제시하고, 따뜻한 격려로 마무리하세요.

[필수] 4섹션 모두 완성. 사주 글자·오행 수치 인용 필수. 끝까지 작성할 것.`;
}

// ── 검증 함수 ──
function validate(idx, title, text) {
  const errors = [];
  const warnings = [];

  // 1. 4섹션 완성 확인
  const sections = ["##사주풀이##", "##핵심분석##", "##시기와흐름##", "##실천조언##"];
  for (const sec of sections) {
    if (!text.includes(sec)) errors.push(`섹션 누락: ${sec}`);
  }

  // 2. 잘림 확인 (마지막 문장이 완성됐는지)
  const trimmed = text.trim();
  if (trimmed.length < 1500) errors.push(`분량 부족: ${trimmed.length}자 (최소 1500자 이상 예상)`);
  const lastChar = trimmed.slice(-1);
  if (!['.', '다', '요', '세', '!', '니다'].some(e => trimmed.endsWith(e) || trimmed.slice(-2).includes(e))) {
    warnings.push(`잘림 의심: 마지막 글자 "${trimmed.slice(-10)}"`);
  }

  // 3. 간지 정확성 — 잘못된 간지 사용 체크
  const wrongGanji = [
    { wrong: "정해년", correct: "정미년" },
    { wrong: "무자년", correct: "무신년" },
    { wrong: "丁亥年", correct: "丁未年" },
    { wrong: "戊子年", correct: "戊申年" },
    { wrong: "기축년", correct: "없음" },
    { wrong: "경인년", correct: "없음" },
  ];
  for (const { wrong, correct } of wrongGanji) {
    if (text.includes(wrong)) errors.push(`간지 오류: "${wrong}" 사용 (올바른 값: ${correct})`);
  }
  // 올바른 간지 사용 확인
  if (!text.includes("병오") && !text.includes("丙午")) warnings.push("2026년 병오년 미언급");
  if (!text.includes("정미") && !text.includes("丁未")) warnings.push("2027년 정미년 미언급");
  if (!text.includes("무신") && !text.includes("戊申")) warnings.push("2028년 무신년 미언급");

  // 4. 나이 오류 — 60대 이상 나이 언급 확인
  const ageMatch = text.match(/(\d{2,3})세/g);
  if (ageMatch) {
    for (const m of ageMatch) {
      const age = parseInt(m);
      if (age > 50) errors.push(`나이 오류: "${m}" — 만 ${currentAge}세인데 ${age}세로 표기`);
    }
  }

  // 5. 자기 수정 표현
  const selfCorrect = ["정정:", "정정 :", "수정:", "다시 말해", "다시 말하면"];
  for (const pat of selfCorrect) {
    if (text.includes(pat)) errors.push(`자기 수정 표현: "${pat}" 발견`);
  }

  // 6. 대운 언급
  if (text.includes("대운") && !title.includes("대운") && !title.includes("신년")) {
    warnings.push(`대운(大運) 언급 발견 — 프롬프트에서 금지했으나 사용`);
  }

  // 7. 오행 관계 오류 (존재하지 않는 상생/상극)
  const wrongRelations = [
    { pattern: "목극금", fix: "금극목" },
    { pattern: "목생토", fix: "목극토" },
    { pattern: "토극목", fix: "목극토" },
    { pattern: "수극토", fix: "토극수" },
    { pattern: "화극목", fix: "금극목 or 없음" },
    { pattern: "금생목", fix: "수생목" },
    { pattern: "토생화", fix: "화생토" },
    { pattern: "木剋金", fix: "金剋木" },
    { pattern: "木生土", fix: "木剋土" },
  ];
  for (const { pattern, fix } of wrongRelations) {
    if (text.includes(pattern)) errors.push(`오행 관계 오류: "${pattern}" → 올바른 관계: ${fix}`);
  }

  // 8. 십신 오류 — 갑목 기준 잘못된 십신 배정 (정밀 패턴)
  // 갑목 기준 올바른 십신: 경=편관, 신=정관, 무=편재, 기=정재, 병=식신, 정=상관
  const wrongSipsin = [
    // 금(경/신)을 식신/상관으로 잘못 표기
    { pattern: /(?:경|신|금)[은의이가]?\s*식신|식신[인에]?\s*(?:경|신금)/, desc: "금(경/신)을 식신으로 표기 — 올바른 값: 편관/정관" },
    { pattern: /(?:경|신|금)[은의이가]?\s*상관|상관[인에]?\s*(?:경|신금)/, desc: "금(경/신)을 상관으로 표기 — 올바른 값: 편관/정관" },
    // 토(무/기)를 비견/겁재로 잘못 표기
    { pattern: /(?:무|기|토)[은의이가]?\s*비견|비견[인에]?\s*(?:무|기)토/, desc: "토(무/기)를 비견으로 표기 — 올바른 값: 편재/정재" },
    { pattern: /(?:무|기|토)[은의이가]?\s*비겁|비겁[인에]?\s*(?:무|기)토/, desc: "토(무/기)를 비겁으로 표기 — 올바른 값: 편재/정재" },
    // 금을 편재/정재로 잘못 표기
    { pattern: /(?:경|신|금)[은의이가]?\s*편재|편재[인에]?\s*(?:경|신금)/, desc: "금(경/신)을 편재로 표기 — 올바른 값: 편관/정관" },
    // 화(병/정)를 편관/정관으로 잘못 표기
    { pattern: /(?:병|정)[은의이가]?\s*편관|편관[인에]?\s*(?:병|정)화/, desc: "화(병/정)를 편관으로 표기 — 올바른 값: 식신/상관" },
    { pattern: /(?:병|정)[은의이가]?\s*정관|정관[인에]?\s*(?:병|정)화/, desc: "화(병/정)를 정관으로 표기 — 올바른 값: 식신/상관" },
    // 금(경/신)에 대한 괄호 형태 잘못된 표기
    { pattern: /금\(식신\)|경\(식신\)|신\(식신\)/, desc: "금을 (식신)으로 표기 — 올바른 값: (편관)/(정관)" },
    { pattern: /금\(상관\)|경\(상관\)|신\(상관\)/, desc: "금을 (상관)으로 표기 — 올바른 값: (편관)/(정관)" },
    // 토에 대한 괄호 형태 잘못된 표기
    { pattern: /토\(비견\)|무\(비견\)|기\(비견\)/, desc: "토를 (비견)으로 표기 — 올바른 값: (편재)/(정재)" },
  ];
  for (const { pattern, desc } of wrongSipsin) {
    if (pattern.test(text)) errors.push(`십신 오류: ${desc}`);
  }

  return { errors, warnings, charCount: trimmed.length };
}

// ── API 호출 ──
async function callAPI(prompt) {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${resp.status}`);
  }
  const data = await resp.json();
  return data.content?.[0]?.text || "";
}

// ── 2차 검증 API 호출 ──
async function callValidation(text) {
  const prompt = `당신은 사주명리학 교정 전문가입니다. 아래 사주 분석 텍스트에서 오행/십신 관련 오류만 찾아 수정하세요.

[정확한 오행 상생 관계 — 이것만 존재함]
목생화(木生火), 화생토(火生土), 토생금(土生金), 금생수(金生水), 수생목(水生木)

[정확한 오행 상극 관계 — 이것만 존재함]
목극토(木剋土), 토극수(土剋水), 수극화(水剋火), 화극금(火剋金), 금극목(金剋木)

[일간 ${ilgan} 기준 십신 조견표]
${sipsinStr}

[향후 3년 간지]
${yearGanJi}

[검증할 텍스트]
${text}

[작업 지시]
1. 텍스트에서 잘못된 오행 관계를 모두 찾으세요 (예: "목생토" → "목극토", "목극금" → "금극목")
2. 텍스트에서 잘못된 십신 배정을 모두 찾으세요
3. 잘못된 간지가 있으면 찾으세요
4. "다시 말해", "정정:" 같은 자기수정 표현이 있으면 찾으세요

오류가 없으면: {"hasErrors": false}
오류가 있으면: {"hasErrors": true, "corrections": [{"wrong": "원문 구절", "fixed": "수정된 구절", "reason": "이유"}]}
JSON만 출력하세요.`;

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!resp.ok) return { hasErrors: false };
  const data = await resp.json();
  const rawText = data.content?.[0]?.text || "";
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { hasErrors: false };
  return JSON.parse(jsonMatch[0]);
}

// ── 자동 교정 적용 ──
function applyCorrections(text, corrections) {
  let corrected = text;
  for (const c of corrections) {
    if (c.wrong && c.fixed && corrected.includes(c.wrong)) {
      corrected = corrected.replace(c.wrong, c.fixed);
    }
  }
  return corrected;
}

// ── 메인 실행 ──
async function main() {
  console.log(`=== 프리미엄 11개 상품 자동 검증 시작 ===`);
  console.log(`모델: claude-haiku-4-5-20251001`);
  console.log(`총 상품: ${premiumItems.length}개\n`);

  const results = [];

  for (let i = 0; i < premiumItems.length; i++) {
    const item = premiumItems[i];
    const num = `[${i+1}/${premiumItems.length}]`;
    process.stdout.write(`${num} "${item.title}" 생성 중...`);
    const startTime = Date.now();

    try {
      const prompt = buildPrompt(item.title, item.desc);
      let text = await callAPI(prompt);
      const genElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      process.stdout.write(` 생성${genElapsed}s`);

      // 1차 검증 (regex)
      const pre = validate(i, item.title, text);
      const preErrors = pre.errors.filter(e => e.includes("오행 관계") || e.includes("십신"));

      // 2차 검증 (AI 교차검증)
      process.stdout.write(` → 검증중...`);
      let corrections = [];
      try {
        const valResult = await callValidation(text);
        if (valResult.hasErrors && valResult.corrections?.length > 0) {
          corrections = valResult.corrections;
          text = applyCorrections(text, corrections);
        }
      } catch (ve) {
        console.warn(`검증 에러: ${ve.message}`);
      }
      const valElapsed = ((Date.now() - startTime) / 1000).toFixed(1);

      // 교정 후 최종 검증
      const { errors, warnings, charCount } = validate(i, item.title, text);
      const status = errors.length > 0 ? "FAIL" : warnings.length > 0 ? "WARN" : "PASS";
      console.log(` ${status} (${valElapsed}s, ${charCount}자, 교정${corrections.length}건)`);

      if (corrections.length > 0) {
        for (const c of corrections) console.log(`   🔧 "${c.wrong}" → "${c.fixed}" (${c.reason})`);
      }
      if (errors.length > 0) {
        for (const e of errors) console.log(`   ❌ ${e}`);
      }
      if (warnings.length > 0) {
        for (const w of warnings) console.log(`   ⚠️  ${w}`);
      }

      results.push({ title: item.title, status, errors, warnings, charCount, elapsed: valElapsed, text, corrections });
    } catch (e) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(` ERROR (${elapsed}s) — ${e.message}`);
      results.push({ title: item.title, status: "ERROR", errors: [e.message], warnings: [], charCount: 0, elapsed });
    }
  }

  // ── 최종 리포트 ──
  console.log("\n=== 최종 리포트 ===");
  const pass = results.filter(r => r.status === "PASS").length;
  const warn = results.filter(r => r.status === "WARN").length;
  const fail = results.filter(r => r.status === "FAIL").length;
  const err = results.filter(r => r.status === "ERROR").length;
  console.log(`PASS: ${pass} | WARN: ${warn} | FAIL: ${fail} | ERROR: ${err}`);
  console.log("");

  const totalCorrections = results.reduce((sum, r) => sum + (r.corrections?.length || 0), 0);
  console.log(`총 AI 교정: ${totalCorrections}건\n`);

  for (const r of results) {
    const icon = r.status === "PASS" ? "✅" : r.status === "WARN" ? "⚠️" : r.status === "FAIL" ? "❌" : "💥";
    const corr = r.corrections?.length ? `, 교정${r.corrections.length}건` : "";
    console.log(`${icon} ${r.title} — ${r.charCount}자, ${r.elapsed}s${corr}`);
    if (r.corrections?.length) {
      for (const c of r.corrections) console.log(`   🔧 "${c.wrong}" → "${c.fixed}"`);
    }
    for (const e of r.errors) console.log(`   ❌ ${e}`);
    for (const w of r.warnings) console.log(`   ⚠️  ${w}`);
  }

  // 전체 결과를 파일로 저장
  const reportLines = results.map((r, i) =>
    `\n${'='.repeat(60)}\n[${i+1}] ${r.title} (${r.status}, ${r.charCount}자, ${r.elapsed}s)\n${'='.repeat(60)}\n${r.text || '(생성 실패)'}`
  ).join('\n');
  const fs = await import('fs');
  fs.writeFileSync('test-premium-results.txt', reportLines, 'utf-8');
  console.log("\n📄 전체 결과: test-premium-results.txt 에 저장됨");
}

main().catch(e => { console.error(e); process.exit(1); });
