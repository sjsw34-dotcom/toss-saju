import { useState, useEffect } from "react";
import { Button, ProgressBar, TextField } from "@toss/tds-mobile";

const C = {
  blue: "#3182F6", dark: "#191F28", gray: "#8B95A1", lightGray: "#F2F4F6",
  white: "#FFFFFF", red: "#F04452", yellow: "#FFC558", green: "#00C98D",
  purple: "#7B61FF", pink: "#FF6B9D", gold: "#D4A853",
  bg: "#F4F4F4",
};

const getElement = (y) => ["metal","metal","water","water","wood","wood","fire","fire","earth","earth"][y % 10];
const getAnimal = (y) => ["원숭이","닭","개","돼지","쥐","소","호랑이","토끼","용","뱀","말","양"][y % 12];
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

const genFortune = (y, m, d) => {
  const s = (y * 31 + m * 17 + d * 13) % 100;
  return {
    total: 60 + (s % 35), wealth: 55 + ((s * 3) % 40), love: 50 + ((s * 7) % 45),
    health: 60 + ((s * 11) % 35), work: 58 + ((s * 13) % 37), luck: 30 + ((s * 17) % 60),
    todayStem: hStems[d % 10], todayBranch: eBranches[d % 12],
    myStem: hStems[y % 10], myBranch: eBranches[y % 12],
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
  { icon: "🔥", title: "2026 신년 사주", origPrice: "21,900원", price: "4,400원", discount: "80%", desc: "올해의 대운과 세운을 총망라한 신년 특별 분석", featured: true },
  { icon: "💰", title: "내 말년 운세, 돈 걱정 없이 편안할까?", price: "2,200원", desc: "노후 재물운과 재테크 방향 분석" },
  { icon: "💪", title: "갱년기와 중년 건강, 어디를 조심할까?", price: "2,200원", desc: "건강 취약 시기와 관리 포인트" },
  { icon: "🍀", title: "나에게도 횡재수가 있을까? 로또/투자", price: "2,200원", desc: "금전 행운의 시기와 투자 적기" },
  { icon: "🛡️", title: "올해 피해야 할 삼재와 액운은?", price: "2,200원", desc: "주의할 시기와 액막이 방법" },
  { icon: "⭐", title: "내 인생의 황금기, 아직 남았을까?", price: "2,200원", desc: "대운 흐름으로 보는 인생 전환점" },
  { icon: "🏖️", title: "은퇴 후 삶, 어떻게 보내면 좋을까?", price: "2,200원", desc: "은퇴 시기와 노후 생활 방향" },
  { icon: "💼", title: "제2의 직업, 나에게 맞을까?", price: "2,200원", desc: "전직/부업 적성과 시기 분석" },
  { icon: "👨‍👩‍👧‍👦", title: "가족 간 갈등, 언제쯤 풀릴까?", price: "2,200원", desc: "가족 관계 개선 시기와 방향" },
  { icon: "🏪", title: "소소하게 가게라도 해볼까? 창업운", price: "2,200원", desc: "창업 적성, 시기, 업종 분석" },
  { icon: "🏠", title: "이사/매매, 지금 움직여도 될까요?", price: "2,200원", desc: "이사 방위와 부동산 매매 시기" },
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

function Card({ children, style, onClick }) {
  return <div onClick={onClick} style={{ background: C.white, borderRadius: 20, padding: "24px 20px", ...style }}>{children}</div>;
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

function TabBar({ active, onTab }) {
  const tabs = [
    { id: "saju", icon: "🔮", label: "사주" },
    { id: "premium", icon: "💎", label: "프리미엄" },
    { id: "point", icon: "🧧", label: "복주머니" },
    { id: "my", icon: "👤", label: "내정보" },
  ];
  return (
    <div style={{ position: "sticky", bottom: 0, background: C.white, borderTop: "1px solid #E8EBED", display: "flex", padding: "8px 0 12px", zIndex: 50 }}>
      {tabs.map((t) => (
        <div key={t.id} onClick={() => onTab(t.id)} style={{ flex: 1, textAlign: "center", cursor: "pointer", position: "relative" }}>
          <div style={{ fontSize: 22, opacity: active === t.id ? 1 : 0.35 }}>{t.icon}</div>
          <div style={{ fontSize: 11, fontWeight: active === t.id ? 700 : 500, marginTop: 2, color: active === t.id ? C.dark : C.gray }}>{t.label}</div>
          {t.id === "point" && <div style={{ position: "absolute", top: -2, right: "28%", width: 8, height: 8, borderRadius: 4, background: C.red }} />}
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
  const [pointCount, setPointCount] = useState(0);
  const [showPaySheet, setShowPaySheet] = useState(null);
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
          const y = parseInt(year), m = parseInt(month), d = parseInt(day);
          setResult({ year: y, month: m, day: d, element: getElement(y), animal: getAnimal(y), fortune: genFortune(y, m, d) });
          setTimeout(() => setScreen(S.AD), 400);
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
                { icon: "🧧", color: C.red, title: "매일 받는 복주머니", desc: "운세 확인하고 토스 포인트도 받으세요" },
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
          </div>
        </div>
      </div>
    );
  }

  // ====== INPUT ======
  if (screen === S.INPUT) {
    return (
      <div style={wrap}>
        <Header title="사주 정보 입력" onBack={() => setScreen(S.ONBOARD)} />
        <div style={{ padding: "28px 20px" }}>
          <Card>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <EnergyOrb size={80} animate={false} />
              <p style={{ fontSize: 15, color: C.gray, margin: "16px 0 0", lineHeight: 1.6 }}>정확한 만세력 분석을 위해<br />태어난 날짜와 시간을 입력해 주세요</p>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Inp label="태어난 해 (양력)" value={year} onChange={setYear} placeholder="1990" maxLen={4} />
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

  // ====== AD ======
  if (screen === S.AD) {
    return <AdOverlay onComplete={() => { setPointCount((p) => p + 1); setScreen(S.RESULT); }} />;
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
              <div key={i} onClick={() => setShowPaySheet(item)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 0", borderBottom: i < premiumItems.length - 1 ? `1px solid ${C.lightGray}` : "none", cursor: "pointer" }}>
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

          {/* TDS 스펙 준수 결제 바텀시트 */}
          {showPaySheet && (
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setShowPaySheet(null)}>
              <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: C.white, borderRadius: "20px 20px 0 0", padding: "28px 20px 32px" }}>
                <div style={{ width: 40, height: 4, background: "#D1D6DB", borderRadius: 2, margin: "0 auto 24px" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                  <span style={{ fontSize: 36 }}>{showPaySheet.icon}</span>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 800 }}>{showPaySheet.title}</div>
                    <div style={{ fontSize: 13, color: C.gray, marginTop: 2 }}>{showPaySheet.desc}</div>
                  </div>
                </div>
                <div style={{ background: C.lightGray, borderRadius: 12, padding: 16, marginBottom: 20 }}>
                  {showPaySheet.origPrice && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 14, color: C.gray }}>정가</span>
                      <span style={{ fontSize: 14, color: C.gray, textDecoration: "line-through" }}>{showPaySheet.origPrice}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>결제 금액</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: C.dark }}>{showPaySheet.price}</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: C.lightGray, borderRadius: 12, marginBottom: 20 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: C.blue, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ color: "#fff", fontSize: 14, fontWeight: 800 }}>T</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>토스페이</div>
                    <div style={{ fontSize: 12, color: C.gray }}>간편 결제</div>
                  </div>
                </div>
                <GradientBtn gradient={`linear-gradient(135deg, ${C.purple}, ${C.pink})`}>
                  {showPaySheet.price} 결제하기
                </GradientBtn>
                <div style={{ textAlign: "center", marginTop: 12 }}>
                  <span onClick={() => setShowPaySheet(null)} style={{ fontSize: 14, color: C.gray, cursor: "pointer" }}>취소</span>
                </div>
              </div>
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
                <div style={{ fontSize: 16, fontWeight: 700 }}>{result.year}.{String(result.month).padStart(2, '0')}.{String(result.day).padStart(2, '0')} (양력)</div>
                <div style={{ fontSize: 13, color: C.gray, marginTop: 2 }}>{result.animal}띠 · {el.name}</div>
              </div>
              <span style={{ fontSize: 18, opacity: 0.3, cursor: "pointer" }}>🗑️</span>
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
          </div>
          <div style={{ height: 80 }} />
          <TabBar active={tab} onTab={handleTabChange} />
        </div>
      );
    }

    // --- POINT TAB ---
    if (tab === "point") {
      return (
        <div style={wrap}>
          <Header title="복주머니" />
          <div style={{ background: `linear-gradient(135deg, ${C.red}15, ${C.gold}10)`, padding: "32px 20px", textAlign: "center" }}>
            <span style={{ fontSize: 48 }}>🧧</span>
            <div style={{ fontSize: 28, fontWeight: 800, marginTop: 12 }}>내 복주머니 {pointCount}개</div>
            <div style={{ fontSize: 14, color: C.gray, marginTop: 8 }}>복주머니로 토스 포인트를 받을 수 있어요</div>
          </div>
          <div style={{ padding: 20 }}>
            <Card style={{ textAlign: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>복주머니 모으는 방법</div>
              <div style={{ fontSize: 13, color: C.gray, lineHeight: 1.8 }}>
                매일 오늘의 운세 확인하기 → 복주머니 1개<br />
                분야별 운세 확인하기 → 복주머니 1개<br />
                친구에게 공유하기 → 복주머니 2개
              </div>
            </Card>
          </div>
          <div style={{ height: 80 }} />
          <TabBar active={tab} onTab={handleTabChange} />
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
              <span style={{ fontSize: 14 }}>🧧</span>
              <span style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>내 복주머니 {pointCount}개</span>
            </div>
          </div>
          <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
            <EnergyOrb size={130} />
            <h2 style={{ color: "#fff", fontSize: 24, fontWeight: 800, margin: "20px 0 8px" }}>오늘의 운세가<br />도착했어요</h2>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, margin: "0 0 24px" }}>운세 확인하고 행운의 복주머니도 받아가세요.</p>
            <div style={{ maxWidth: 300, margin: "0 auto" }}>
              <Button color="light" display="full" size="xlarge" style={{ borderRadius: 14 }}>
                오늘의 운세 열어보기 ›
              </Button>
            </div>
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
              <Card key={c.id} onClick={() => setDetailId(c.id)} style={{ cursor: "pointer", padding: "20px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>{c.title}</div>
                <div style={{ fontSize: 36 }}>{c.emoji}</div>
              </Card>
            ))}
          </div>

          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>금전 운세</div>
          <div style={{ fontSize: 13, color: C.gray, marginBottom: 16 }}>오늘 돈의 흐름을 가볍게 확인해보세요.</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            {[{ id: "luck", emoji: "🎰", title: "로또운" }, { id: "money", emoji: "📊", title: "주식운" }].map((c) => (
              <Card key={c.id} onClick={() => setDetailId(c.id)} style={{ cursor: "pointer", padding: "20px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>{c.title}</div>
                <div style={{ fontSize: 36 }}>{c.emoji}</div>
              </Card>
            ))}
          </div>

          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>궁합 운세</div>
          <div style={{ fontSize: 13, color: C.gray, marginBottom: 16 }}>궁금한 사람과의 기운을 살펴보세요.</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            {[{ emoji: "❤️‍🔥", title: "연애 궁합" }, { emoji: "💍", title: "결혼 궁합" }, { emoji: "🤝", title: "친구 궁합" }, { emoji: "👶", title: "자식 궁합" }].map((c, i) => (
              <Card key={i} onClick={() => setDetailId("match")} style={{ cursor: "pointer", padding: "20px 16px", textAlign: "center" }}>
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
            <Button color="light" variant="weak" display="full" size="xlarge">
              🔗 친구에게 공유하기
            </Button>
          </div>
        </div>

        <div style={{ padding: 20, background: C.white, borderTop: `1px solid ${C.lightGray}` }}>
          <div style={{ fontSize: 11, color: C.gray, lineHeight: 1.8 }}>
            운명테라피 | 사주명리 전문 상담 (경력 15년+)<br />
            문의: unmyungtherapy@gmail.com<br />
            이용약관 | 개인정보처리방침<br />
            © 2026 운명테라피. All rights reserved.
          </div>
        </div>

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
