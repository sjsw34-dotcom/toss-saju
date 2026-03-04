import { useState, useEffect } from "react";
import { Button, ProgressBar, TextField } from "@toss/tds-mobile";
import { IAP, share, getTossShareLink } from "@apps-in-toss/web-framework";
import KoreanLunarCalendar from "korean-lunar-calendar";

const C = {
  blue: "#3182F6", dark: "#191F28", gray: "#8B95A1", lightGray: "#F2F4F6",
  white: "#FFFFFF", red: "#F04452", yellow: "#FFC558", green: "#00C98D",
  purple: "#7B61FF", pink: "#FF6B9D", gold: "#D4A853",
  bg: "#F4F4F4",
};

const getElement = (y) => ["metal","metal","water","water","wood","wood","fire","fire","earth","earth"][y % 10];
const getAnimal = (y) => ["원숭이","닭","개","돼지","쥐","소","호랑이","토끼","용","뱀","말","양"][y % 12];

// 음력 설날(춘절) 양력 날짜 — 띠/천간은 설날 기준 (이전이면 전년도)
const lunarNewYear = {
  1930:[1,30],1931:[2,17],1932:[2,6],1933:[1,26],1934:[2,14],1935:[2,4],1936:[1,24],1937:[2,11],1938:[1,31],1939:[2,19],
  1940:[2,8],1941:[1,27],1942:[2,15],1943:[2,5],1944:[1,25],1945:[2,13],1946:[2,2],1947:[1,22],1948:[2,10],1949:[1,29],
  1950:[2,17],1951:[2,6],1952:[1,27],1953:[2,14],1954:[2,3],1955:[1,24],1956:[2,12],1957:[1,31],1958:[2,18],1959:[2,8],
  1960:[1,28],1961:[2,15],1962:[2,5],1963:[1,25],1964:[2,13],1965:[2,2],1966:[1,21],1967:[2,9],1968:[1,30],1969:[2,17],
  1970:[2,6],1971:[1,27],1972:[2,15],1973:[2,3],1974:[1,23],1975:[2,11],1976:[1,31],1977:[2,18],1978:[2,7],1979:[1,28],
  1980:[2,16],1981:[2,5],1982:[1,25],1983:[2,13],1984:[2,2],1985:[2,20],1986:[2,9],1987:[1,29],1988:[2,17],1989:[2,6],
  1990:[1,27],1991:[2,15],1992:[2,4],1993:[1,23],1994:[2,10],1995:[1,31],1996:[2,19],1997:[2,7],1998:[1,28],1999:[2,16],
  2000:[2,5],2001:[1,24],2002:[2,12],2003:[2,1],2004:[1,22],2005:[2,9],2006:[1,29],2007:[2,18],2008:[2,7],2009:[1,26],
  2010:[2,14],2011:[2,3],2012:[1,23],2013:[2,10],2014:[1,31],2015:[2,19],2016:[2,8],2017:[1,28],2018:[2,16],2019:[2,5],
  2020:[1,25],2021:[2,12],2022:[2,1],2023:[1,22],2024:[2,10],2025:[1,29],2026:[2,17],
};
const getLunarYear = (y, m, d) => {
  const entry = lunarNewYear[y];
  if (!entry) return y;
  const [nm, nd] = entry;
  return (m < nm || (m === nm && d < nd)) ? y - 1 : y;
};

// ====== 만세력(四柱) 계산 ======
const GAN     = ["갑","을","병","정","무","기","경","신","임","계"];
const GAN_HAN = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
const JI      = ["자","축","인","묘","진","사","오","미","신","유","술","해"];
const JI_HAN  = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];

const getJDN = (year, month, day) => {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y +
    Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
};
const pillarStr = (s, b) => `${GAN[s]}${GAN_HAN[s]}/${JI[b]}${JI_HAN[b]}`;
// 절기 기준일(근사): 소한·입춘·경칩·청명·입하·망종·소서·입추·백로·한로·입동·대설
const JEOLGI = [6, 4, 6, 5, 6, 6, 7, 7, 8, 8, 7, 7];
const MB_MAP = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0]; // 월별 월지 인덱스

const calcYearPillar = (lunarY) => {
  const s = ((lunarY - 4) % 10 + 10) % 10;
  const b = ((lunarY - 4) % 12 + 12) % 12;
  return { s, b, str: pillarStr(s, b) };
};
const calcMonthPillar = (lunarY, sm, sd) => {
  const ys = ((lunarY - 4) % 10 + 10) % 10;
  const b = sd < JEOLGI[sm - 1] ? MB_MAP[(sm - 2 + 12) % 12] : MB_MAP[sm - 1];
  const s = ([2, 4, 6, 8, 0][ys % 5] + (b - 2 + 12) % 12) % 10;
  return { s, b, str: pillarStr(s, b) };
};
// 기준: 양력 1984년 2월 2일 = 甲子日(index 0), JDN=2445733
const calcDayPillar = (year, month, day) => {
  const d60 = ((getJDN(year, month, day) - 2445733) % 60 + 60) % 60;
  return { s: d60 % 10, b: d60 % 12, str: pillarStr(d60 % 10, d60 % 12) };
};
const calcHourPillar = (ds, hourBranch) => {
  const b = Math.max(0, JI.indexOf(hourBranch));
  const s = ([0, 2, 4, 6, 8][ds % 5] + b) % 10;
  return { s, b, str: hourBranch ? pillarStr(s, b) : "시 미입력" };
};
const calcManseok = (year, month, day, hourStr, lunarY) => {
  const yp = calcYearPillar(lunarY);
  const mp = calcMonthPillar(lunarY, month, day);
  const dp = calcDayPillar(year, month, day);
  const hBranch = hourStr ? hourStr.replace("시", "") : "";
  const hp = calcHourPillar(dp.s, hBranch);
  return { yp, mp, dp, hp };
};

// ====== Claude API 스트리밍 호출 ======
const callClaude = async (birthInfo, itemTitle, onChunk) => {
  const { year, month, day, gender, ms } = birthInfo;
  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth() + 1;
  const STEMS_KO = ["갑","을","병","정","무","기","경","신","임","계"];
  const BRANCHES_KO = ["자","축","인","묘","진","사","오","미","신","유","술","해"];
  const yearStem = STEMS_KO[((thisYear - 4) % 10 + 10) % 10];
  const yearBranch = BRANCHES_KO[((thisYear - 4) % 12 + 12) % 12];
  const prompt = `당신은 15년 경력의 사주명리학 전문가입니다. 의뢰인의 사주를 아래와 같이 심층 분석해 주세요.

[현재 날짜]
${thisYear}년 ${thisMonth}월 (${yearStem}${yearBranch}년)

[의뢰인 사주]
• 입력 생년월일: ${birthInfo.inputDate.year}년 ${birthInfo.inputDate.month}월 ${birthInfo.inputDate.day}일 (${birthInfo.calType}${birthInfo.calType === "윤달" ? " - 윤달 적용" : ""})
• 양력 환산일: ${year}년 ${month}월 ${day}일
• 성별: ${gender}
• 연주(年柱): ${ms.yp.str}년
• 월주(月柱): ${ms.mp.str}월
• 일주(日柱): ${ms.dp.str}일
• 시주(時柱): ${ms.hp.str}

[분석 항목]
${itemTitle}

[작성 형식 - 반드시 준수]
아래 4개의 구분자를 정확히 그대로 사용하여 각 섹션을 구분하세요. 구분자 외 다른 제목이나 기호는 사용하지 마세요.

##사주구조분석##
이 사람의 오행 구성과 일주·월주·연주의 관계를 설명하고, 해당 분석 항목과 어떻게 연결되는지 300자 이상 서술하세요.

##핵심운세풀이##
분석 항목에 대해 오행 상생상극 이론을 바탕으로 강점과 약점을 300자 이상 설명하세요.

##시기분석##
올해(${thisYear}년 ${yearStem}${yearBranch}년)와 향후 3년간(${thisYear+1}~${thisYear+2}년)의 대운·세운을 분석하여 유리한 월과 주의할 시기를 300자 이상 서술하세요.

##실천조언##
분석 항목과 관련하여 구체적인 행동 방향, 피해야 할 것, 활용해야 할 것을 300자 이상 제시하세요.

[주의사항]
- 한국어 존댓말 사용
- 각 섹션 내용은 자연스러운 문단으로 작성
- 구분자(##...##) 외 별표·대시 등 특수기호 사용 금지
- 추상적인 말 대신 구체적인 내용 위주로 작성`;
  const resp = await fetch("https://toss-saju.vercel.app/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!resp.ok) {
    const e = await resp.json().catch(() => ({}));
    throw new Error(e.error?.message || `오류 (${resp.status})`);
  }
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let fullText = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const lines = decoder.decode(value, { stream: true }).split("\n");
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6).trim();
      if (!raw || raw === "[DONE]") continue;
      try {
        const parsed = JSON.parse(raw);
        if (parsed.type === "content_block_delta" && parsed.delta?.type === "text_delta") {
          fullText += parsed.delta.text;
          onChunk(fullText);
        }
      } catch { /* JSON 파싱 오류 무시 */ }
    }
  }
  return fullText;
};

const animalEmoji = {"쥐":"🐭","소":"🐮","호랑이":"🐯","토끼":"🐰","용":"🐲","뱀":"🐍","말":"🐴","양":"🐑","원숭이":"🐵","닭":"🐔","개":"🐶","돼지":"🐷"};
const ojHaeng = {
  wood: { name: "목(木)", color: "#00C98D", emoji: "🌿", desc: "성장과 창의력" },
  fire: { name: "화(火)", color: "#F04452", emoji: "🔥", desc: "열정과 리더십" },
  earth: { name: "토(土)", color: "#FFC558", emoji: "🌍", desc: "안정과 신뢰" },
  metal: { name: "금(金)", color: "#E0E0E0", emoji: "⚡", desc: "결단력과 정의" },
  water: { name: "수(水)", color: "#3182F6", emoji: "💧", desc: "지혜와 유연성" },
};
const hStems = ["경(庚)","신(辛)","임(壬)","계(癸)","갑(甲)","을(乙)","병(丙)","정(丁)","무(戊)","기(己)"];
const eBranches = ["신(申)","유(酉)","술(戌)","해(亥)","자(子)","축(丑)","인(寅)","묘(卯)","진(辰)","사(巳)","오(午)","미(未)"];

const genFortune = (y, m, d, lunarY) => {
  const ly = lunarY ?? y;
  const s = (y * 31 + m * 17 + d * 13) % 100;
  return {
    total: 60 + (s % 35), wealth: 55 + ((s * 3) % 40), love: 50 + ((s * 7) % 45),
    health: 60 + ((s * 11) % 35), work: 58 + ((s * 13) % 37), luck: 30 + ((s * 17) % 60),
    todayStem: hStems[d % 10], todayBranch: eBranches[d % 12],
    myStem: hStems[ly % 10], myBranch: eBranches[ly % 12],
    summary: s > 50
      ? "오늘은 기운이 상승하는 날입니다. 적극적으로 움직이면 좋은 결과가 따릅니다. 특히 오후 시간대에 재물과 관련된 좋은 소식이 있을 수 있어요."
      : "차분하게 내면을 돌아보기 좋은 날입니다. 무리한 투자나 결정은 내일로 미루는 것이 현명합니다. 가까운 사람과의 대화에서 힌트를 얻을 수 있어요.",
    luckyNums: Array.from({ length: 7 }, (_, i) => ((s * (i + 3) * 7 + i * 13) % 45) + 1)
      .filter((v, i, a) => a.indexOf(v) === i).slice(0, 7),
    luckyTime: s > 50 ? "오후 3시~5시" : "오전 10시~12시",
    luckyColor: s > 50 ? "파란색 계열" : "초록색 계열",
    luckyDir: s > 50 ? "남동쪽" : "북서쪽",
  };
};

const premiumItems = [
  { icon: "🔥", title: "2026 신년 사주", origPrice: "21,900원", price: "4,400원", discount: "80%", desc: "올해의 대운과 세운을 총망라한 신년 특별 분석", featured: true, sku: "ait.0000020917.a3f15fe4.3e253fd54b.2627470992" },
  { icon: "💰", title: "내 말년 운세, 돈 걱정 없이 편안할까?", price: "2,750원", desc: "노후 재물운과 재테크 방향 분석", sku: "ait.0000020917.0f6f4430.e94987cfaf.2627621920" },
  { icon: "💪", title: "갱년기와 중년 건강, 어디를 조심할까?", price: "2,750원", desc: "건강 취약 시기와 관리 포인트", sku: "ait.0000020917.b23508e7.82e340944c.2633191458" },
  { icon: "🍀", title: "나에게도 횡재수가 있을까? 로또/투자", price: "2,750원", desc: "금전 행운의 시기와 투자 적기", sku: "ait.0000020917.3bb5f86a.5c0e258496.2633244480" },
  { icon: "🛡️", title: "올해 피해야 할 삼재와 액운은?", price: "2,750원", desc: "주의할 시기와 액막이 방법", sku: "ait.0000020917.2516e5b1.1d83f38554.2633297942" },
  { icon: "⭐", title: "내 인생의 황금기, 아직 남았을까?", price: "2,750원", desc: "대운 흐름으로 보는 인생 전환점", sku: "ait.0000020917.c9d6bc84.40d06d84fd.2633353860" },
  { icon: "🏖️", title: "은퇴 후 삶, 어떻게 보내면 좋을까?", price: "2,750원", desc: "은퇴 시기와 노후 생활 방향", sku: "ait.0000020917.d1de695b.f7c1b7a525.2633401488" },
  { icon: "💼", title: "제2의 직업, 나에게 맞을까?", price: "2,750원", desc: "전직/부업 적성과 시기 분석", sku: "ait.0000020917.9e1790a2.b572eac3b9.2633458527" },
  { icon: "👨‍👩‍👧‍👦", title: "가족 간 갈등, 언제쯤 풀릴까?", price: "2,750원", desc: "가족 관계 개선 시기와 방향", sku: "ait.0000020917.b59843ec.817346ede9.2633492869" },
  { icon: "🏪", title: "소소하게 가게라도 해볼까? 창업운", price: "2,750원", desc: "창업 적성, 시기, 업종 분석", sku: "ait.0000020917.7063555b.b914aa3299.2633542009" },
  { icon: "🏠", title: "이사/매매, 지금 움직여도 될까요?", price: "2,750원", desc: "이사 방위와 부동산 매매 시기", sku: "ait.0000020917.b6ba61b6.4992d9936f.2633579053" },
];

// 그라데이션 특수 버튼 (TDS Button이 지원하지 않는 금색·보라색 그라데이션용)
function GradientBtn({ children, onClick, gradient, style }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", padding: "16px 0", borderRadius: 16, border: "none",
        fontSize: 17, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
        background: gradient, color: "#fff", transition: "all 0.15s", ...style,
      }}
    >
      {children}
    </button>
  );
}

function Card({ children, style, onClick, className }) {
  return <div onClick={onClick} className={className} style={{ background: C.white, borderRadius: 20, padding: "24px 20px", ...style }}>{children}</div>;
}

// TDS ProgressBar 래핑 — 레이블·점수 표시 포함
function ScoreBar({ label, score, color, delay = 0 }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80 + delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 14, color: C.gray }}>{label}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color }}>{score}점</span>
      </div>
      <ProgressBar progress={visible ? score / 100 : 0} size="normal" />
    </div>
  );
}

function EnergyOrb({ size = 140, animate = true }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!animate) return;
    const i = setInterval(() => setT((v) => v + 1), 40);
    return () => clearInterval(i);
  }, [animate]);
  const rings = [
    { r: size * 0.48, w: 2, color: `hsla(${(t * 2) % 360}, 70%, 65%, 0.3)`, speed: t * 0.8 },
    { r: size * 0.38, w: 1.5, color: `hsla(${(t * 2 + 120) % 360}, 70%, 65%, 0.25)`, speed: -t * 1.2 },
    { r: size * 0.28, w: 1, color: `hsla(${(t * 2 + 240) % 360}, 70%, 65%, 0.2)`, speed: t * 1.8 },
  ];
  return (
    <div style={{ position: "relative", width: size, height: size, margin: "0 auto" }}>
      <svg width={size} height={size} style={{ position: "absolute", top: 0, left: 0 }}>
        {rings.map((ring, i) => (
          <circle key={i} cx={size / 2} cy={size / 2} r={ring.r} fill="none" stroke={ring.color} strokeWidth={ring.w}
            strokeDasharray={`${8 + i * 4} ${12 + i * 6}`} transform={`rotate(${ring.speed} ${size / 2} ${size / 2})`} />
        ))}
      </svg>
      <div style={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        width: size * 0.4, height: size * 0.4, borderRadius: "50%",
        background: `radial-gradient(circle, rgba(123,97,255,0.4) 0%, rgba(49,130,246,0.2) 50%, transparent 70%)`,
        boxShadow: `0 0 ${size / 4}px rgba(123,97,255,0.3)`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: size * 0.22, filter: "drop-shadow(0 0 12px rgba(123,97,255,0.6))" }}>🔮</span>
      </div>
      {animate && Array.from({ length: 8 }).map((_, i) => {
        const angle = (t * 0.5 + i * 45) * Math.PI / 180;
        const dist = size * 0.35 + Math.sin(t * 0.03 + i) * size * 0.08;
        return (
          <div key={i} style={{
            position: "absolute",
            left: size / 2 + Math.cos(angle) * dist - 2,
            top: size / 2 + Math.sin(angle) * dist - 2,
            width: 4, height: 4, borderRadius: 2,
            background: i % 3 === 0 ? C.purple : i % 3 === 1 ? C.gold : C.blue,
            opacity: 0.3 + Math.sin(t * 0.05 + i) * 0.4,
          }} />
        );
      })}
    </div>
  );
}

function Particles() {
  const ps = Array.from({ length: 16 }, (_, i) => ({
    left: `${(i * 6.25) % 100}%`,
    delay: `${i * 0.3}s`,
    dur: `${3 + i % 4}s`,
    size: 2 + i % 3,
    color: i % 4 === 0 ? C.purple : i % 4 === 1 ? C.gold : i % 4 === 2 ? C.blue : "rgba(255,255,255,0.4)",
  }));
  return (
    <>
      <style>{`@keyframes floatUp{0%{transform:translateY(0) scale(1);opacity:0}15%{opacity:0.8}85%{opacity:0.3}100%{transform:translateY(-100px) scale(0.2);opacity:0}}`}</style>
      {ps.map((p, i) => (
        <div key={i} style={{ position: "absolute", bottom: 0, left: p.left, width: p.size, height: p.size, borderRadius: "50%", background: p.color, animation: `floatUp ${p.dur} ${p.delay} infinite` }} />
      ))}
    </>
  );
}

// ====== 프리미엄 분석 섹션 파서 / 렌더러 ======
const AI_SECTIONS = [
  { key: "##사주구조분석##", title: "사주 구조 분석", icon: "🔮", color: "#7B61FF" },
  { key: "##핵심운세풀이##", title: "핵심 운세 풀이", icon: "✨", color: "#D4A853" },
  { key: "##시기분석##",     title: "구체적 시기 분석", icon: "📅", color: "#3182F6" },
  { key: "##실천조언##",     title: "실천 조언",       icon: "💡", color: "#00C98D" },
];

function parseAiSections(text) {
  const positions = AI_SECTIONS.map(s => ({ ...s, idx: text.indexOf(s.key) }))
    .filter(s => s.idx !== -1)
    .sort((a, b) => a.idx - b.idx);
  return positions.map((s, i) => {
    const start = s.idx + s.key.length;
    const end = positions[i + 1]?.idx ?? text.length;
    return { ...s, content: text.slice(start, end).trim() };
  });
}

function AnalysisSections({ text, loading }) {
  const sections = parseAiSections(text);
  if (sections.length === 0) {
    return (
      <div style={{ fontSize: 15, color: "#4E5968", lineHeight: 1.9 }}>
        {text}
        {loading && <span style={{ display: "inline-block", width: 10, height: 16, background: "#7B61FF", borderRadius: 2, marginLeft: 3, verticalAlign: "middle", animation: "blink 0.9s step-end infinite" }} />}
      </div>
    );
  }
  return (
    <>
      {sections.map((s, i) => (
        <div key={i} style={{ marginBottom: 16, borderRadius: 18, border: `1.5px solid ${s.color}30`, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", background: `${s.color}12` }}>
            <span style={{ fontSize: 20 }}>{s.icon}</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: s.color }}>{s.title}</span>
          </div>
          <div style={{ padding: "16px 18px", background: "#fff" }}>
            <p style={{ fontSize: 14, color: "#4E5968", lineHeight: 2, margin: 0 }}>
              {s.content}
              {loading && i === sections.length - 1 && (
                <span style={{ display: "inline-block", width: 9, height: 15, background: s.color, borderRadius: 2, marginLeft: 3, verticalAlign: "middle", animation: "blink 0.9s step-end infinite" }} />
              )}
            </p>
          </div>
        </div>
      ))}
    </>
  );
}

// ====== 법적 문서 ======
const LEGAL_DOCS = {
  terms: {
    title: "이용약관",
    sections: [
      {
        heading: "제1조 (목적)",
        body: "이 약관은 운명테라피 사주(이하 '서비스')를 이용함에 있어 서비스 제공자와 이용자 간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.",
      },
      {
        heading: "제2조 (서비스 내용)",
        body: "서비스는 이용자가 입력한 생년월일 및 성별 정보를 바탕으로 만세력 기반 사주 분석 결과를 제공합니다. 분석 결과는 참고용이며, 실제 인생 결정에 대한 법적·의료적·재정적 조언을 대체하지 않습니다.",
      },
      {
        heading: "제3조 (이용 조건)",
        body: "서비스는 토스 앱을 통해 제공되며, 만 14세 이상 이용 가능합니다. 이용자는 정확한 정보를 입력해야 하며, 허위 정보 입력으로 인한 분석 오류에 대해 서비스 제공자는 책임지지 않습니다.",
      },
      {
        heading: "제4조 (금지 행위)",
        body: "이용자는 서비스를 통해 제공되는 분석 결과를 무단으로 복제·배포·상업적 이용하는 행위, 서비스의 정상적인 운영을 방해하는 행위, 타인의 정보를 도용하여 서비스를 이용하는 행위를 해서는 안 됩니다.",
      },
      {
        heading: "제5조 (서비스 변경 및 중단)",
        body: "서비스 제공자는 운영상·기술상 필요에 따라 서비스의 내용을 변경하거나 중단할 수 있습니다. 서비스 변경 또는 중단으로 인한 손해에 대해서는 법령이 정하는 경우를 제외하고 책임을 지지 않습니다.",
      },
      {
        heading: "제6조 (면책 조항)",
        body: "서비스를 통해 제공되는 사주 분석 결과는 전통 사주명리학 이론과 AI 기술을 결합한 참고 정보입니다. 서비스 제공자는 분석 결과의 정확성·완전성을 보장하지 않으며, 이용자가 분석 결과를 신뢰하여 발생한 결과에 대해 책임을 지지 않습니다.",
      },
      {
        heading: "제7조 (분쟁 해결)",
        body: "서비스 이용과 관련하여 발생한 분쟁은 대한민국 법률에 따라 해결하며, 관할 법원은 서비스 제공자의 본점 소재지 관할 법원으로 합니다.",
      },
      {
        heading: "부칙",
        body: "이 약관은 2026년 1월 1일부터 시행합니다.",
      },
    ],
  },
  privacy: {
    title: "개인정보처리방침",
    sections: [
      {
        heading: "1. 수집하는 개인정보 항목",
        body: "서비스는 사주 분석을 위해 다음 정보를 수집합니다.\n• 생년월일 (양력)\n• 성별\n• 태어난 시간 (선택 입력)\n\n위 정보는 앱 세션 내에서만 사용되며, 서버나 데이터베이스에 저장되지 않습니다.",
      },
      {
        heading: "2. 개인정보의 수집 및 이용 목적",
        body: "수집한 정보는 오직 사주 분석 결과 생성을 위해서만 사용됩니다. 마케팅, 광고, 제3자 판매 등의 목적으로는 사용되지 않습니다.",
      },
      {
        heading: "3. 개인정보의 보유 및 이용 기간",
        body: "입력하신 생년월일 및 성별 정보는 앱을 종료하거나 새로고침하면 즉시 삭제됩니다. 별도의 서버 저장 또는 로그 기록을 하지 않습니다.",
      },
      {
        heading: "4. 개인정보의 제3자 제공",
        body: "서비스는 프리미엄 분석 기능 제공을 위해 Anthropic社의 Claude API를 사용합니다. 분석 요청 시 생년월일, 성별, 사주 정보가 Anthropic API 서버로 전송됩니다. Anthropic의 개인정보 처리방침은 anthropic.com에서 확인하실 수 있습니다. 이 외 다른 제3자에게 개인정보를 제공하지 않습니다.",
      },
      {
        heading: "5. 이용자의 권리",
        body: "이용자는 언제든지 앱 사용을 중단함으로써 정보 제공을 철회할 수 있습니다. 서비스는 별도 저장을 하지 않으므로 앱 종료 즉시 모든 정보가 삭제됩니다.",
      },
      {
        heading: "6. 개인정보 보호책임자",
        body: "개인정보 처리에 관한 문의사항이 있으시면 아래로 연락해 주세요.\n• 이메일: unmyungtherapy@gmail.com\n• 처리 기간: 영업일 기준 3일 이내 답변",
      },
      {
        heading: "부칙",
        body: "이 방침은 2026년 1월 1일부터 시행합니다.",
      },
    ],
  },
};

function LegalModal({ docKey, onClose }) {
  const doc = LEGAL_DOCS[docKey];
  if (!doc) return null;
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "#fff", zIndex: 300, overflowY: "auto", maxWidth: 440, margin: "0 auto" }}>
      <div style={{ position: "sticky", top: 0, background: "#fff", borderBottom: "1px solid #E8EBED", padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, zIndex: 10 }}>
        <span onClick={onClose} style={{ fontSize: 20, cursor: "pointer", lineHeight: 1 }}>←</span>
        <span style={{ fontSize: 17, fontWeight: 700 }}>{doc.title}</span>
      </div>
      <div style={{ padding: "24px 20px 60px" }}>
        {doc.sections.map((s, i) => (
          <div key={i} style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#191F28", marginBottom: 8 }}>{s.heading}</div>
            <div style={{ fontSize: 14, color: "#4E5968", lineHeight: 1.9, whiteSpace: "pre-line" }}>{s.body}</div>
          </div>
        ))}
        <div style={{ marginTop: 16, padding: "16px", background: "#F2F4F6", borderRadius: 12 }}>
          <p style={{ fontSize: 12, color: "#8B95A1", margin: 0, lineHeight: 1.7 }}>
            본 {doc.title}은 관련 법령 및 서비스 정책 변경에 따라 사전 고지 후 수정될 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}

function TabBar({ active, onTab }) {
  const tabs = [
    { id: "saju", icon: "🔮", label: "사주" },
    { id: "premium", icon: "💎", label: "프리미엄" },
    { id: "my", icon: "👤", label: "내정보" },
  ];
  return (
    <div style={{ position: "sticky", bottom: 0, background: C.white, borderTop: "1px solid #E8EBED", display: "flex", padding: "8px 0 12px", zIndex: 50 }}>
      {tabs.map((t) => (
        <div key={t.id} onClick={() => onTab(t.id)} style={{ flex: 1, textAlign: "center", cursor: "pointer" }}>
          <div style={{ fontSize: 22, opacity: active === t.id ? 1 : 0.35 }}>{t.icon}</div>
          <div style={{ fontSize: 11, fontWeight: active === t.id ? 700 : 500, marginTop: 2, color: active === t.id ? C.dark : C.gray }}>{t.label}</div>
        </div>
      ))}
    </div>
  );
}

// TDS 검수 기준 준수: 좌(뒤로가기) / 중앙(브랜드 로고+이름) / 우(기능 버튼 최대 1개)
function Header({ title, onBack }) {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "14px 20px", background: C.white, borderBottom: "1px solid #E8EBED", position: "sticky", top: 0, zIndex: 10 }}>
      {onBack && <span onClick={onBack} style={{ cursor: "pointer", fontSize: 20, marginRight: 12 }}>←</span>}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${C.purple}, ${C.gold})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 14 }}>🔮</span>
        </div>
        <span style={{ fontSize: 17, fontWeight: 700 }}>{title}</span>
      </div>
      {/* TDS 스펙: 우측 버튼 최대 1개 */}
      <div style={{ marginLeft: "auto" }}>
        <span style={{ fontSize: 16, cursor: "pointer", opacity: 0.5 }}>✕</span>
      </div>
    </div>
  );
}

function AdOverlay({ onComplete }) {
  const [sec, setSec] = useState(5);
  useEffect(() => {
    if (sec <= 0) { onComplete(); return; }
    const t = setTimeout(() => setSec(sec - 1), 1000);
    return () => clearTimeout(t);
  }, [sec]);
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.92)", zIndex: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "90%", maxWidth: 400, background: "#1a1a2e", borderRadius: 20, padding: "32px 24px", textAlign: "center", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ fontSize: 12, color: C.gray, marginBottom: 16 }}>광고</div>
        <div style={{ width: "100%", height: 200, borderRadius: 12, background: "linear-gradient(135deg, #667eea, #764ba2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
          <div style={{ color: "#fff", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📺</div>
            <div style={{ fontSize: 14, opacity: 0.8 }}>AdMob 보상형 광고</div>
          </div>
        </div>
        <div style={{ width: 48, height: 48, borderRadius: 24, border: `3px solid ${sec > 0 ? C.gray : C.purple}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", background: sec <= 0 ? C.purple : "transparent", transition: "all 0.3s" }}>
          {sec > 0 ? <span style={{ fontSize: 18, fontWeight: 800, color: C.gray }}>{sec}</span> : <span style={{ fontSize: 18, color: "#fff" }}>✓</span>}
        </div>
        <div style={{ fontSize: 13, color: C.gray, marginBottom: 20 }}>{sec > 0 ? `${sec}초 후 결과를 확인할 수 있어요` : "광고가 끝났어요!"}</div>
        {sec <= 0 && (
          <GradientBtn onClick={onComplete} gradient={`linear-gradient(135deg, ${C.purple}, ${C.pink})`}>
            ✨ 결과 확인하기
          </GradientBtn>
        )}
      </div>
    </div>
  );
}

// TDS TextField 기반 숫자 입력 (상단 레이블 포함)
function Inp({ label, value, onChange, placeholder, maxLen }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 13, color: C.gray, marginBottom: 8 }}>{label}</div>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLen))}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "14px 16px", borderRadius: 12,
          border: "1px solid #E5E8EB", fontSize: 16, fontWeight: 600,
          outline: "none", background: C.lightGray, color: C.dark,
          boxSizing: "border-box", fontFamily: "inherit",
        }}
      />
    </div>
  );
}

// ====== SCREENS ======
const S = { ONBOARD: "onboard", INPUT: "input", LOADING: "loading", AD: "ad", RESULT: "result" };

export default function App() {
  const [screen, setScreen] = useState(S.ONBOARD);
  const [tab, setTab] = useState("saju");
  const [calType, setCalType] = useState("양력");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [hour, setHour] = useState("");
  const [gender, setGender] = useState("");
  const [result, setResult] = useState(null);
  const [loadPct, setLoadPct] = useState(0);
  const [detailId, setDetailId] = useState(null);
  const [timeDetailId, setTimeDetailId] = useState(null);
  const [registered, setRegistered] = useState(false);
  const [aiResult, setAiResult] = useState(null); // { item, text, loading, error }
  const [purchasedResults, setPurchasedResults] = useState({}); // { [sku]: text }
  const [legalDoc, setLegalDoc] = useState(null); // 'terms' | 'privacy' | null
  const [todayDate] = useState(() => {
    const d = new Date();
    return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} (${['일','월','화','수','목','금','토'][d.getDay()]})`;
  });

  useEffect(() => {
    if (screen !== S.LOADING) return;
    setLoadPct(0);
    const t = setInterval(() => {
      setLoadPct((p) => {
        if (p >= 100) {
          clearInterval(t);
          let y = parseInt(year), m = parseInt(month), d = parseInt(day);
          const inputDate = { year: y, month: m, day: d };
          if (calType !== "양력") {
            try {
              const cal = new KoreanLunarCalendar();
              cal.setLunarDate(y, m, d, calType === "윤달");
              const solar = cal.getSolarCalendar();
              y = solar.year; m = solar.month; d = solar.day;
            } catch {}
          }
          const lunarY = getLunarYear(y, m, d);
          setResult({ year: y, month: m, day: d, inputDate, calType, element: getElement(lunarY), animal: getAnimal(lunarY), fortune: genFortune(y, m, d, lunarY) });
          setTimeout(() => setScreen(S.RESULT), 400);
          return 100;
        }
        return p + Math.random() * 8 + 4;
      });
    }, 200);
    return () => clearInterval(t);
  }, [screen]);

  const handleTabChange = (id) => {
    setTab(id);
    if (id === "saju") setDetailId(null);
    setTimeDetailId(null);
  };

  const handlePremiumClick = (item) => {
    if (!result) return;

    const storageKey = `saju_${item.sku}_${result.year}_${result.month}_${result.day}_${gender}`;

    // 세션 캐시 확인
    if (purchasedResults[storageKey]) {
      setAiResult({ item, text: purchasedResults[storageKey], loading: false, error: null });
      return;
    }
    // localStorage 확인 (앱 재시작 후에도 유지)
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setPurchasedResults(prev => ({ ...prev, [storageKey]: saved }));
      setAiResult({ item, text: saved, loading: false, error: null });
      return;
    }

    const runAnalysis = async () => {
      const y = result.year, m = result.month, d = result.day;
      const lunarY = getLunarYear(y, m, d);
      const ms = calcManseok(y, m, d, hour, lunarY);
      setAiResult({ item, text: "", loading: true, error: null });
      let finalText = "";
      try {
        await callClaude(
          { year: y, month: m, day: d, gender, ms, calType: result.calType || "양력", inputDate: result.inputDate || { year: y, month: m, day: d } },
          item.title,
          (partial) => { finalText = partial; setAiResult(prev => ({ ...prev, text: partial })); }
        );
        setAiResult(prev => ({ ...prev, loading: false }));
      } catch (e) {
        setAiResult(prev => ({ ...prev, loading: false, error: e.message }));
      } finally {
        // 부분 결과라도 저장 (중간에 끊겨도 보존)
        if (finalText) {
          localStorage.setItem(storageKey, finalText);
          setPurchasedResults(prev => ({ ...prev, [storageKey]: finalText }));
        }
      }
    };

    try {
      // 앱인토스 인앱결제 (Toss 앱 환경)
      let analysisStarted = false;
      const startAnalysis = () => {
        if (analysisStarted) return;
        analysisStarted = true;
        runAnalysis();
      };
      const cleanup = IAP.createOneTimePurchaseOrder({
        options: {
          sku: item.sku,
          // 새 IAP 버전(5.231+): purchased 이벤트 후 이 함수가 호출됨
          processProductGrant: async () => {
            startAnalysis();
            return true;
          },
        },
        onEvent: (event) => {
          cleanup();
          // 구 IAP 버전: success 이벤트로 옴
          if (event.type === "success") {
            startAnalysis();
          }
        },
        onError: (error) => {
          cleanup();
          const code = error?.code;
          if (code !== "USER_CANCELED") {
            setAiResult({ item, text: "", loading: false, error: `결제 오류가 발생했어요. (${code || "오류"})` });
          }
        },
      });
    } catch {
      // 개발/웹 환경 폴백: 결제 없이 바로 분석
      runAnalysis();
    }
  };

  const canSubmit = year.length === 4 && month && day && gender;
  const wrap = { maxWidth: 440, margin: "0 auto", minHeight: "100vh", background: C.bg, fontFamily: "'Pretendard', -apple-system, sans-serif", color: C.dark, position: "relative", left: "50%", transform: "translateX(-50%)" };

  const timeSlots = ["자시 (23:30~01:30)","축시 (01:30~03:30)","인시 (03:30~05:30)","묘시 (05:30~07:30)","진시 (07:30~09:30)","사시 (09:30~11:30)","오시 (11:30~13:30)","미시 (13:30~15:30)","신시 (15:30~17:30)","유시 (17:30~19:30)","술시 (19:30~21:30)","해시 (21:30~23:30)"];

  // ====== ONBOARDING ======
  if (screen === S.ONBOARD) {
    return (
      <div style={{ ...wrap, background: "linear-gradient(180deg, #0F0B2E 0%, #1A1145 40%, #2D1B69 100%)" }}>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", padding: "0 24px", position: "relative", overflow: "hidden" }}>
          <Particles />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(212,168,83,0.15)", border: "1px solid rgba(212,168,83,0.3)", borderRadius: 20, padding: "6px 16px", marginBottom: 32 }}>
              <span style={{ fontSize: 12 }}>✦</span>
              <span style={{ color: C.gold, fontSize: 13, fontWeight: 600 }}>사주명리 15년 전문 분석</span>
            </div>
            <h1 style={{ color: "#fff", fontSize: 28, fontWeight: 800, textAlign: "center", lineHeight: 1.5, margin: "0 0 12px" }}>
              당신의 운명을 읽고<br />행운의 길을 열어드립니다
            </h1>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, textAlign: "center", margin: "0 0 40px", lineHeight: 1.6 }}>
              만세력 기반 정밀 사주 분석 · 매일 업데이트
            </p>
            <EnergyOrb size={180} />
            <div style={{ width: "100%", maxWidth: 340, marginTop: 40 }}>
              {[
                { icon: "🔮", color: C.purple, title: "만세력 기반 정밀 사주", desc: "정확한 천간·지지 분석으로 운세를 읽습니다" },
                { icon: "💳", color: C.blue, title: "토스페이 간편 결제", desc: "토스 앱으로 1초 만에 간편하게 결제해요" },
                { icon: "📊", color: C.gold, title: "프리미엄 심층 리포트", desc: "인생 총운부터 재물·건강·연애운까지" },
              ].map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: i < 2 ? 20 : 0 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${f.color}15`, border: `1px solid ${f.color}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 22 }}>{f.icon}</span>
                  </div>
                  <div>
                    <div style={{ color: "#fff", fontSize: 16, fontWeight: 700 }}>{f.title}</div>
                    <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, marginTop: 2 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding: "32px 0 40px", zIndex: 1 }}>
            <GradientBtn
              onClick={() => setScreen(registered ? S.RESULT : S.INPUT)}
              gradient={`linear-gradient(135deg, ${C.gold}, #B8860B)`}
              style={{ borderRadius: 16, fontSize: 18, padding: "18px 0" }}
            >
              시작하기
            </GradientBtn>
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>시작하면 </span>
              <span onClick={() => setLegalDoc("terms")} style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", textDecoration: "underline", cursor: "pointer" }}>이용약관</span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}> 및 </span>
              <span onClick={() => setLegalDoc("privacy")} style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", textDecoration: "underline", cursor: "pointer" }}>개인정보처리방침</span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>에 동의하는 것으로 간주됩니다.</span>
            </div>
          </div>
        </div>
        {legalDoc && <LegalModal docKey={legalDoc} onClose={() => setLegalDoc(null)} />}
      </div>
    );
  }

  // ====== INPUT ======
  if (screen === S.INPUT) {
    return (
      <div style={wrap}>
        <Header title="사주 정보 입력" onBack={() => setScreen(registered ? S.RESULT : S.ONBOARD)} />
        <div style={{ padding: "28px 20px" }}>
          <Card>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <EnergyOrb size={80} animate={false} />
              <p style={{ fontSize: 15, color: C.gray, margin: "16px 0 0", lineHeight: 1.6 }}>정확한 만세력 분석을 위해<br />태어난 날짜와 시간을 입력해 주세요</p>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: C.gray, marginBottom: 8 }}>양력 / 음력 구분</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {["양력", "음력", "윤달"].map((t) => (
                  <button key={t} onClick={() => setCalType(t)}
                    style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: calType === t ? `2px solid ${C.purple}` : "1px solid #E5E8EB", background: calType === t ? `${C.purple}10` : C.lightGray, color: calType === t ? C.purple : C.gray, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                    {t}
                  </button>
                ))}
              </div>
              <Inp label="태어난 해" value={year} onChange={setYear} placeholder="1990" maxLen={4} />
            </div>
            <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
              <Inp label="월" value={month} onChange={setMonth} placeholder="10" maxLen={2} />
              <Inp label="일" value={day} onChange={setDay} placeholder="10" maxLen={2} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: C.gray, marginBottom: 8 }}>태어난 시간 (선택)</div>
              <select value={hour} onChange={(e) => setHour(e.target.value)}
                style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: "1px solid #E5E8EB", fontSize: 16, background: C.lightGray, color: hour ? C.dark : C.gray, fontFamily: "inherit", fontWeight: 600 }}>
                <option value="">모름</option>
                {timeSlots.map((s) => <option key={s} value={s.split(" ")[0]}>{s}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 13, color: C.gray, marginBottom: 8 }}>성별</div>
              <div style={{ display: "flex", gap: 12 }}>
                {["남성", "여성"].map((g) => (
                  <button key={g} onClick={() => setGender(g)}
                    style={{ flex: 1, padding: "14px 0", borderRadius: 12, border: gender === g ? `2px solid ${C.purple}` : "1px solid #E5E8EB", background: gender === g ? `${C.purple}10` : C.lightGray, color: gender === g ? C.purple : C.gray, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </Card>
          <div style={{ marginTop: 24 }}>
            <Button
              color="primary"
              display="full"
              size="xlarge"
              disabled={!canSubmit}
              onClick={canSubmit ? () => { setRegistered(true); setScreen(S.LOADING); } : undefined}
            >
              사주 분석 시작하기
            </Button>
          </div>
          <p style={{ fontSize: 12, color: C.gray, textAlign: "center", marginTop: 12 }}>입력 정보는 사주 분석에만 사용되며 별도 저장되지 않습니다</p>
        </div>
      </div>
    );
  }

  // ====== LOADING ======
  if (screen === S.LOADING) {
    const pct = Math.min(loadPct, 100).toFixed(0);
    const msgs = [
      { t: 0, m: "만세력 데이터를 조회하고 있어요..." },
      { t: 20, m: "천간·지지를 배합하고 있어요..." },
      { t: 45, m: "오행의 상생상극을 분석 중..." },
      { t: 65, m: "십성과 십이운성을 계산 중..." },
      { t: 85, m: "오늘의 운세를 정리하고 있어요..." },
    ];
    const msg = [...msgs].reverse().find((m) => loadPct >= m.t)?.m;
    return (
      <div style={{ ...wrap, background: "linear-gradient(180deg, #0F0B2E 0%, #1A1145 50%, #2D1B69 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", position: "relative", overflow: "hidden" }}>
        <Particles />
        <div style={{ zIndex: 1 }}><EnergyOrb size={160} /></div>
        <div style={{ fontSize: 17, fontWeight: 700, color: "#fff", marginTop: 32, marginBottom: 6, zIndex: 1 }}>{msg}</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 24, zIndex: 1 }}>만세력 기반 정밀 분석</div>
        <div style={{ fontSize: 40, fontWeight: 800, color: C.gold, marginBottom: 32, zIndex: 1 }}>{pct}%</div>
        <div style={{ width: 260, height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, zIndex: 1 }}>
          <div style={{ height: 4, width: `${pct}%`, background: `linear-gradient(90deg, ${C.gold}, ${C.purple})`, borderRadius: 2, transition: "width 0.3s" }} />
        </div>
      </div>
    );
  }

  // ====== RESULT ======
  if (screen === S.RESULT && result) {
    const el = ojHaeng[result.element];
    const f = result.fortune;
    const ae = animalEmoji[result.animal] || "🐾";

    // --- PREMIUM TAB ---
    if (tab === "premium") {
      return (
        <div style={wrap}>
          <Header title="프리미엄 분석" />
          <div style={{ padding: "20px" }}>
            <Card style={{ background: `linear-gradient(135deg, #1A1145, #2D1B69)`, marginBottom: 16, border: `1px solid ${C.gold}30` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: `${C.gold}20`, border: `1px solid ${C.gold}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 28 }}>🏆</span>
                </div>
                <div>
                  <div style={{ color: C.gold, fontSize: 13, fontWeight: 600, marginBottom: 2 }}>전문가 분석</div>
                  <div style={{ color: "#fff", fontSize: 16, fontWeight: 700 }}>사주명리 15년 전문가의 심층 리포트</div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 4 }}>만세력 기반 · 전문가 직접 분석</div>
                </div>
              </div>
            </Card>
            {premiumItems.map((item, i) => (
              <div key={i} onClick={() => handlePremiumClick(item)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 0", borderBottom: i < premiumItems.length - 1 ? `1px solid ${C.lightGray}` : "none", cursor: "pointer" }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: item.featured ? `linear-gradient(135deg, ${C.gold}20, ${C.gold}08)` : C.lightGray, border: item.featured ? `1px solid ${C.gold}30` : "none", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 26 }}>{item.icon}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{item.title} {item.featured && "🔥"}</div>
                  <div style={{ fontSize: 12, color: C.gray, marginTop: 3 }}>{item.desc}</div>
                </div>
                <div style={{ flexShrink: 0, textAlign: "right" }}>
                  {item.origPrice && <div style={{ fontSize: 11, color: C.gray, textDecoration: "line-through", marginBottom: 2 }}>{item.origPrice}</div>}
                  <div style={{ background: item.featured ? `${C.gold}15` : C.lightGray, color: item.featured ? C.gold : C.gray, padding: "6px 14px", borderRadius: 20, fontSize: 14, fontWeight: 700, border: item.featured ? `1px solid ${C.gold}30` : "none" }}>
                    {item.price}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ height: 80 }} />
          <TabBar active={tab} onTab={handleTabChange} />

          {/* AI 분석 결과 전체화면 */}
          {aiResult && (
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: C.white, zIndex: 100, display: "flex", flexDirection: "column", maxWidth: 440, margin: "0 auto" }}>
              <style>{`
                @keyframes orbPulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.15);opacity:0.7} }
                @keyframes msgFade { 0%{opacity:0;transform:translateY(8px)} 100%{opacity:1;transform:translateY(0)} }
              `}</style>

              {/* 헤더 */}
              <div style={{ display: "flex", alignItems: "center", padding: "52px 20px 16px", borderBottom: `1px solid ${C.lightGray}`, flexShrink: 0 }}>
                <span style={{ fontSize: 28, marginRight: 12 }}>{aiResult.item.icon}</span>
                <div style={{ fontSize: 17, fontWeight: 800, flex: 1 }}>{aiResult.item.title}</div>
                {!aiResult.loading && (
                  <button onClick={() => setAiResult(null)}
                    style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: C.gray, padding: "4px 8px" }}>✕</button>
                )}
              </div>

              {/* 본문 */}
              <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px 40px" }}>
                {aiResult.loading && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
                    <div style={{ fontSize: 72, animation: "orbPulse 1.6s ease-in-out infinite", marginBottom: 32 }}>🔮</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: C.purple, marginBottom: 12 }}>사주를 분석하고 있어요</div>
                    <div style={{ fontSize: 14, color: C.gray, lineHeight: 1.8, textAlign: "center", animation: "msgFade 0.6s ease" }}>
                      15년 경력 사주 전문가의 시각으로<br />만세력을 풀어내고 있습니다.<br /><br />
                      <span style={{ color: C.purple, fontWeight: 700 }}>잠시만 기다려 주세요 ✨</span>
                    </div>
                  </div>
                )}
                {aiResult.error && (
                  <div style={{ textAlign: "center", padding: "60px 0" }}>
                    <div style={{ fontSize: 14, color: C.red, marginBottom: 20 }}>{aiResult.error}</div>
                    <button onClick={() => handlePremiumClick(aiResult.item)}
                      style={{ padding: "14px 32px", borderRadius: 12, border: "none", background: C.purple, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
                      다시 시도
                    </button>
                  </div>
                )}
                {aiResult.text && !aiResult.loading && (
                  <AnalysisSections text={aiResult.text} loading={false} />
                )}
              </div>

              {/* 하단 버튼 */}
              {!aiResult.loading && !aiResult.error && aiResult.text && (
                <div style={{ padding: "12px 20px 32px", display: "flex", gap: 10, flexShrink: 0, borderTop: `1px solid ${C.lightGray}` }}>
                  <button onClick={() => navigator.clipboard.writeText(aiResult.text).catch(() => {})}
                    style={{ flex: 1, padding: "16px 0", borderRadius: 14, border: "none", background: C.lightGray, color: C.dark, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
                    📋 복사
                  </button>
                  <button onClick={() => setAiResult(null)}
                    style={{ flex: 1, padding: "16px 0", borderRadius: 14, border: "none", background: C.purple, color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
                    닫기
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      );
    }

    // --- MY INFO TAB ---
    if (tab === "my") {
      return (
        <div style={wrap}>
          <Header title="내정보" />
          <div style={{ padding: "24px 20px" }}>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>나의 사주</div>
            <Card style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: `${el.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>{ae}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{result.year}.{String(result.month).padStart(2, '0')}.{String(result.day).padStart(2, '0')} ({result.calType || "양력"})</div>
                <div style={{ fontSize: 13, color: C.gray, marginTop: 2 }}>{result.animal}띠 · {el.name}</div>
              </div>
              <span onClick={() => setScreen(S.INPUT)} style={{ fontSize: 13, color: C.purple, fontWeight: 700, cursor: "pointer", padding: "6px 12px", background: `${C.purple}10`, borderRadius: 8 }}>수정</span>
            </Card>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>가족 사주</div>
            <div style={{ border: `2px dashed ${C.blue}30`, borderRadius: 16, padding: 20, textAlign: "center", marginBottom: 24, cursor: "pointer" }}>
              <span style={{ color: C.blue, fontSize: 15, fontWeight: 600 }}>+ 추가하기</span>
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>설정</div>
            {["🔔 푸시 알림", "🔮 오늘의 운세 알림", "🕐 시간대별 운세 알림"].map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: `${i > 0 ? "10px 0 10px 24px" : "14px 0"}`, borderBottom: i < 2 ? `1px solid ${C.lightGray}` : "none" }}>
                <span style={{ fontSize: 15, color: i > 0 ? C.gray : C.dark }}>{s}</span>
                <div style={{ width: 44, height: 26, borderRadius: 13, background: "#E0E0E0", position: "relative", cursor: "pointer" }}>
                  <div style={{ width: 22, height: 22, borderRadius: 11, background: C.white, position: "absolute", top: 2, left: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
                </div>
              </div>
            ))}
            <div style={{ marginTop: 32 }}>
              <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>약관 및 정책</div>
              {[
                { label: "이용약관", key: "terms" },
                { label: "개인정보처리방침", key: "privacy" },
              ].map((item, i) => (
                <div key={i} onClick={() => setLegalDoc(item.key)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: i === 0 ? `1px solid ${C.lightGray}` : "none", cursor: "pointer" }}>
                  <span style={{ fontSize: 15 }}>{item.label}</span>
                  <span style={{ fontSize: 16, color: C.gray }}>›</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 24, textAlign: "center" }}>
              <span style={{ fontSize: 12, color: C.gray }}>버전 1.0.0</span>
            </div>
          </div>
          <div style={{ height: 80 }} />
          <TabBar active={tab} onTab={handleTabChange} />
          {legalDoc && <LegalModal docKey={legalDoc} onClose={() => setLegalDoc(null)} />}
        </div>
      );
    }

    // --- DETAIL VIEW ---
    if (detailId) {
      const themeMap = {
        money: { title: "금전운", emoji: "🪙", color: C.green },
        love: { title: "연애운", emoji: "❤️‍🔥", color: C.pink },
        health: { title: "건강운", emoji: "🏃", color: C.blue },
        work: { title: "직장운", emoji: "📈", color: C.purple },
        luck: { title: "로또운", emoji: "🎰", color: C.gold },
        match: { title: "궁합운", emoji: "💍", color: C.red },
      };
      const card = themeMap[detailId] || themeMap.money;
      const scoreMap = { money: f.wealth, love: f.love, health: f.health, work: f.work, luck: f.luck, match: f.love };
      const sc = scoreMap[detailId] || f.total;
      const texts = {
        money: "오늘은 금전적으로 안정적인 흐름이 예상됩니다. 큰 지출보다는 소소한 절약이 장기적으로 유리합니다. 오후 시간대에 재물과 관련된 좋은 소식이 있을 수 있습니다.",
        love: "감정의 교류가 활발한 날입니다. 짝이 있다면 진솔한 대화가 관계를 깊게 만듭니다. 솔로라면 새로운 만남의 기운이 감지됩니다.",
        health: "전반적으로 양호한 컨디션입니다. 다만 과로는 피하고 충분한 수면을 취하세요. 가벼운 산책이 기운 순환에 도움됩니다.",
        work: "업무에서 성과를 낼 수 있는 기운이 있습니다. 동료와의 협업이 특히 빛을 발하는 날이니 소통에 힘쓰세요.",
        luck: "행운의 기운이 보통 수준입니다. 무리한 도전보다는 꾸준함이 행운을 부릅니다. 소액으로 시도해보는 것이 좋겠습니다.",
        match: "상대방과의 기운 교류가 활발합니다. 서로의 다름을 인정하면 더욱 깊은 유대가 형성됩니다.",
      };
      return (
        <div style={wrap}>
          <Header title={card.title} onBack={() => setDetailId(null)} />
          <div style={{ padding: "24px 20px" }}>
            <Card style={{ textAlign: "center", marginBottom: 16 }}>
              <span style={{ fontSize: 52 }}>{card.emoji}</span>
              <div style={{ fontSize: 22, fontWeight: 800, marginTop: 12, marginBottom: 20 }}>{card.title}</div>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 20 }}>
                <div style={{ flex: 1, padding: 14, background: C.lightGray, borderRadius: 14, textAlign: "center" }}>
                  <div style={{ fontSize: 12, color: C.gray, marginBottom: 4 }}>내 일간</div>
                  <div style={{ fontSize: 24, fontWeight: 800 }}>{f.myStem.split("(")[0]}</div>
                  <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>{f.myStem.match(/\((.+)\)/)?.[1]}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center" }}><span style={{ color: C.gray }}>⇔</span></div>
                <div style={{ flex: 1, padding: 14, background: `${C.purple}08`, borderRadius: 14, border: `1px solid ${C.purple}15`, textAlign: "center" }}>
                  <div style={{ fontSize: 12, color: C.gray, marginBottom: 4 }}>오늘 일진</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: C.purple }}>{f.todayStem.split("(")[0]}{f.todayBranch.split("(")[0]}</div>
                  <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>{f.todayStem.match(/\((.+)\)/)?.[1]}{f.todayBranch.match(/\((.+)\)/)?.[1]}</div>
                </div>
              </div>
              <ScoreBar label="오늘 기운" score={sc} color={card.color} />
            </Card>
            <Card style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>✨ 오늘의 {card.title}</div>
              <p style={{ fontSize: 14, color: "#4E5968", lineHeight: 1.8, margin: 0 }}>{texts[detailId]}</p>
            </Card>
            {detailId === "luck" && (
              <Card style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🎲 행운의 숫자</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
                  {f.luckyNums.map((n, i) => {
                    const colors = [C.blue, C.red, "#FF9800", C.green, C.gray, C.purple, C.pink];
                    return (
                      <div key={i} style={{ width: 46, height: 46, borderRadius: 23, background: colors[i % colors.length], display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 17, fontWeight: 800 }}>{n}</div>
                    );
                  })}
                </div>
              </Card>
            )}
            <Card>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>💡 오늘의 팁</div>
              {[{ l: "행운의 시간", v: f.luckyTime }, { l: "행운의 색상", v: f.luckyColor }, { l: "행운의 방향", v: f.luckyDir }].map((t, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i < 2 ? `1px solid ${C.lightGray}` : "none" }}>
                  <span style={{ fontSize: 14, color: C.gray }}>{t.l}</span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{t.v}</span>
                </div>
              ))}
            </Card>
          </div>
          <div style={{ height: 80 }} />
          <TabBar active={tab} onTab={handleTabChange} />
        </div>
      );
    }

    // --- SAJU MAIN TAB ---
    return (
      <div style={wrap}>
        <Header title="운명테라피 사주" />
        <div style={{ background: "linear-gradient(180deg, #1A0F3C 0%, #3B1F7E 35%, #8B5CF6 70%, #C084FC 100%)", padding: "20px 20px 36px", position: "relative", overflow: "hidden" }}>
          <Particles />
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20, position: "relative", zIndex: 1 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(8px)", borderRadius: 24, padding: "8px 20px" }}>
              <span style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>{todayDate}</span>
              <span style={{ width: 1, height: 16, background: "rgba(255,255,255,0.2)" }} />
              <span style={{ fontSize: 14 }}>🔮</span>
              <span style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>오늘의 운세</span>
            </div>
          </div>
          <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
            <EnergyOrb size={130} />
            <h2 style={{ color: "#fff", fontSize: 24, fontWeight: 800, margin: "20px 0 8px" }}>오늘의 운세가<br />도착했어요</h2>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, margin: 0 }}>만세력 기반으로 오늘의 운세를 살펴보세요.</p>
          </div>
        </div>

        <div style={{ padding: "16px 20px 0" }}>
          <Card style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", marginBottom: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: `linear-gradient(135deg, ${el.color}20, ${el.color}08)`, border: `1px solid ${el.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>{ae}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{result.year}년 {result.animal}띠</div>
              <div style={{ fontSize: 13, color: C.gray, marginTop: 2 }}>{el.name} · {el.desc}</div>
            </div>
            <div style={{ fontSize: 13, color: C.purple, fontWeight: 600 }}>상세 ›</div>
          </Card>

          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📋 오늘 일간 사주</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <div style={{ flex: 1, textAlign: "center", padding: 14, background: C.lightGray, borderRadius: 14 }}>
                <div style={{ fontSize: 12, color: C.gray, marginBottom: 4 }}>내 일간</div>
                <div style={{ fontSize: 28, fontWeight: 800 }}>{f.myStem.split("(")[0]}</div>
                <div style={{ fontSize: 12, color: C.gray, marginTop: 4 }}>{f.myStem.match(/\((.+)\)/)?.[1]}</div>
              </div>
              <span style={{ fontSize: 16, color: C.gray }}>⇔</span>
              <div style={{ flex: 1, textAlign: "center", padding: 14, background: `${C.purple}08`, borderRadius: 14, border: `1px solid ${C.purple}15` }}>
                <div style={{ fontSize: 12, color: C.gray, marginBottom: 4 }}>오늘 일진</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: C.purple }}>{f.todayStem.split("(")[0]}{f.todayBranch.split("(")[0]}</div>
                <div style={{ fontSize: 12, color: C.gray, marginTop: 4 }}>{f.todayStem.match(/\((.+)\)/)?.[1]}{f.todayBranch.match(/\((.+)\)/)?.[1]}</div>
              </div>
            </div>
            <div style={{ marginTop: 16 }}><ScoreBar label="오늘 기운" score={f.total} color={C.purple} /></div>
          </Card>

          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 18 }}>오늘의 운세 점수</div>
            <ScoreBar label="✨ 총운" score={f.total} color={C.purple} delay={0} />
            <ScoreBar label="💰 재물운" score={f.wealth} color={C.green} delay={80} />
            <ScoreBar label="💕 연애운" score={f.love} color={C.pink} delay={160} />
            <ScoreBar label="💼 직장운" score={f.work} color={C.blue} delay={240} />
          </Card>

          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>✨ 오늘의 총운</div>
            <p style={{ fontSize: 14, color: "#4E5968", lineHeight: 1.8, margin: 0 }}>{f.summary}</p>
          </Card>

          <div style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>시간대별 오늘 운세</div>
            <div style={{ fontSize: 13, color: C.gray, marginBottom: 16 }}>시간에 따라 달라지는 기운의 흐름</div>
          </div>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 16, marginBottom: 8 }}>
            {[
              { id: "morning", time: "06~11시", icon: "☀️", label: "오전", bg: "#FFF8E1" },
              { id: "noon",    time: "11~15시", icon: "🌤️", label: "한낮", bg: "#FFF3E0" },
              { id: "afternoon", time: "15~19시", icon: "🌅", label: "오후", bg: "#FCE4EC" },
              { id: "evening", time: "19~23시", icon: "🌙", label: "저녁", bg: "#E8EAF6" },
            ].map((t) => {
              const selected = timeDetailId === t.id;
              return (
                <Card key={t.id} onClick={() => setTimeDetailId(selected ? null : t.id)}
                  style={{ minWidth: 100, padding: "16px 14px", textAlign: "center", background: t.bg, flexShrink: 0, cursor: "pointer", border: selected ? `2px solid ${C.purple}` : "2px solid transparent", transition: "border 0.2s" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{t.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: C.gray, marginTop: 4 }}>{t.time}</div>
                </Card>
              );
            })}
          </div>

          {/* 시간대별 분석 내용 */}
          {timeDetailId && (() => {
            const timeTexts = {
              morning: {
                title: "오전 기운", icon: "☀️",
                desc: `오전 시간대는 ${f.total > 75 ? "활기찬 기운으로 가득합니다. 중요한 미팅이나 결정을 이 시간대에 잡으면 좋습니다. 집중력이 최고조에 달해 업무 효율이 높아집니다." : "차분하게 하루를 시작하기 좋은 시간입니다. 무리하지 않고 계획을 세우며 준비하는 것이 현명합니다."}`,
                tips: ["집중이 필요한 업무 처리", "중요한 연락·미팅", "가벼운 스트레칭"],
              },
              noon: {
                title: "한낮 기운", icon: "🌤️",
                desc: `한낮 시간대는 ${f.work > 75 ? "사회적 관계에서 긍정적인 에너지가 넘칩니다. 협업이나 네트워킹 활동에 최적입니다." : "에너지가 다소 분산되는 시간입니다. 과식을 피하고 가벼운 점심으로 오후를 준비하세요."}`,
                tips: ["동료·지인과의 소통", "가벼운 점심 식사", "짧은 휴식으로 재충전"],
              },
              afternoon: {
                title: "오후 기운", icon: "🌅",
                desc: `오후 시간대는 ${f.wealth > 70 ? "재물 기운이 특히 강한 시간입니다. 금전 관련 결정이나 쇼핑, 투자 검토를 이 시간대에 하면 유리합니다." : "창의적인 활동에 좋은 기운이 흐릅니다. 새로운 아이디어를 내거나 취미 활동을 즐겨보세요."}`,
                tips: ["재물 관련 처리 적기", "창의적 작업", "운동·산책"],
              },
              evening: {
                title: "저녁 기운", icon: "🌙",
                desc: `저녁 시간대는 ${f.love > 70 ? "감정의 기운이 풍부해 소중한 사람과의 교류에 최적입니다. 가족·연인과 따뜻한 시간을 보내세요." : "하루를 마무리하며 내면을 돌아보기 좋은 시간입니다. 과도한 야식이나 늦은 연락은 피하는 것이 좋습니다."}`,
                tips: ["가족·연인과 대화", "가벼운 독서·명상", "내일 계획 정리"],
              },
            };
            const tw = timeTexts[timeDetailId];
            return (
              <Card style={{ marginBottom: 16, border: `1px solid ${C.purple}20` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 24 }}>{tw.icon}</span>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{tw.title}</div>
                </div>
                <p style={{ fontSize: 14, color: "#4E5968", lineHeight: 1.8, margin: "0 0 16px" }}>{tw.desc}</p>
                <div style={{ background: C.lightGray, borderRadius: 12, padding: "12px 16px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: C.purple }}>💡 이 시간대 추천</div>
                  {tw.tips.map((tip, i) => (
                    <div key={i} style={{ fontSize: 13, color: "#4E5968", marginBottom: i < tw.tips.length - 1 ? 4 : 0 }}>· {tip}</div>
                  ))}
                </div>
              </Card>
            );
          })()}

          <div style={{ marginTop: 8, marginBottom: 4 }}>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>분야별 오늘 운세</div>
            <div style={{ fontSize: 13, color: C.gray, marginBottom: 16 }}>궁금한 분야를 탭해서 확인하세요.</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            {[
              { id: "money", emoji: "💰", title: "금전운" },
              { id: "love", emoji: "❤️‍🔥", title: "연애운" },
              { id: "health", emoji: "💪", title: "건강운" },
              { id: "work", emoji: "📈", title: "직장운" },
            ].map((c) => (
              <Card key={c.id} className="fortune-card" onClick={() => setDetailId(c.id)} style={{ cursor: "pointer", padding: "20px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>{c.title}</div>
                <div style={{ fontSize: 36 }}>{c.emoji}</div>
              </Card>
            ))}
          </div>

          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>금전 운세</div>
          <div style={{ fontSize: 13, color: C.gray, marginBottom: 16 }}>오늘 돈의 흐름을 가볍게 확인해보세요.</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            {[{ id: "luck", emoji: "🎰", title: "로또운" }, { id: "money", emoji: "📊", title: "주식운" }].map((c) => (
              <Card key={c.id} className="fortune-card" onClick={() => setDetailId(c.id)} style={{ cursor: "pointer", padding: "20px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>{c.title}</div>
                <div style={{ fontSize: 36 }}>{c.emoji}</div>
              </Card>
            ))}
          </div>

          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>궁합 운세</div>
          <div style={{ fontSize: 13, color: C.gray, marginBottom: 16 }}>궁금한 사람과의 기운을 살펴보세요.</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            {[{ emoji: "❤️‍🔥", title: "연애 궁합" }, { emoji: "💍", title: "결혼 궁합" }, { emoji: "🤝", title: "친구 궁합" }, { emoji: "👶", title: "자식 궁합" }].map((c, i) => (
              <Card key={i} className="fortune-card" onClick={() => setDetailId("match")} style={{ cursor: "pointer", padding: "20px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>{c.title}</div>
                <div style={{ fontSize: 36 }}>{c.emoji}</div>
              </Card>
            ))}
          </div>

          <Card style={{ background: "linear-gradient(135deg, #1A0F3C, #2D1B69)", marginBottom: 20, border: `1px solid ${C.gold}25`, textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>💎</div>
            <div style={{ color: C.gold, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>PREMIUM REPORT</div>
            <div style={{ color: "#fff", fontSize: 18, fontWeight: 800, marginBottom: 6 }}>프리미엄 심층 분석 리포트</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
              사주명리 15년 전문가의 만세력 기반 분석
            </div>
            <GradientBtn
              onClick={() => handleTabChange("premium")}
              gradient={`linear-gradient(135deg, ${C.gold}, #B8860B)`}
              style={{ fontSize: 15 }}
            >
              프리미엄 리포트 보러가기 →
            </GradientBtn>
          </Card>

          <div style={{ marginBottom: 20 }}>
            <Button color="light" variant="weak" display="full" size="xlarge"
              onClick={async () => {
                try {
                  const link = await getTossShareLink('intoss://my-sajuapp');
                  await share({ message: `운명테라피 사주 - 나의 사주를 확인해보세요!\n${link}` });
                } catch {}
              }}>
              🔗 친구에게 공유하기
            </Button>
          </div>
        </div>

        <div style={{ padding: 20, background: C.white, borderTop: `1px solid ${C.lightGray}` }}>
          <div style={{ fontSize: 11, color: C.gray, lineHeight: 1.8 }}>
            운명테라피 | 사주명리 전문 상담 (경력 15년+)<br />
            문의: unmyungtherapy@gmail.com<br />
            <span onClick={() => setLegalDoc("terms")} style={{ textDecoration: "underline", cursor: "pointer" }}>이용약관</span>
            {" | "}
            <span onClick={() => setLegalDoc("privacy")} style={{ textDecoration: "underline", cursor: "pointer" }}>개인정보처리방침</span>
            <br />
            © 2026 운명테라피. All rights reserved.
          </div>
        </div>
        {legalDoc && <LegalModal docKey={legalDoc} onClose={() => setLegalDoc(null)} />}

        <div style={{ height: 70 }} />
        <TabBar active={tab} onTab={handleTabChange} />
      </div>
    );
  }

  return (
    <div style={wrap}>
      <div style={{ padding: 40, textAlign: "center", color: C.gray }}>로딩 중...</div>
    </div>
  );
}
