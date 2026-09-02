import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { motion, animate, useInView, AnimatePresence, MotionConfig } from "framer-motion";
import confetti from "canvas-confetti";

/* ============================================================
   가구전문가 아빠와 아들 — Clean Editorial v6
   · 장식 최소화: 얇은 구분선 + 작은 라벨, 단일 배경 톤
   · 다크 섹션은 히어로·스토리·전화·견적 밴드만
   · 오렌지는 핵심 CTA 전용, 정렬은 왼쪽 통일
   ============================================================ */

const KAKAO_URL = "https://open.kakao.com/o/spSfhAbi";
const TEL_LINK = "tel:01022459369";
const TEL_DISPLAY = "010-2245-9369";

// 디자인 토큰
const INK = "#161412";       // 웜 블랙
const PAPER = "#F7F5F1";     // 본문 단일 배경
const ACCENT = "#C4560F";    // 핵심 CTA 전용

// ─── 공통: 전환 추적 (GA4 + 당근 픽셀, 미설치 시 조용히 무시) ───
const track = (name, params = {}) => {
    try { if (window.gtag) window.gtag("event", name, params); } catch (e) {}
    try { if (window.karrotPixel && params.karrot) window.karrotPixel.track(params.karrot); } catch (e) {}
};

// ─── 공통: 견적 폼 자동저장 (이탈해도 이어서 작성) ───
const DRAFT_KEY = "dadson_quote_draft_v2";
const loadDraft = () => { try { return JSON.parse(localStorage.getItem(DRAFT_KEY)) || null; } catch (e) { return null; } };
const saveDraft = (data, step) => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ data, step, ts: Date.now() })); } catch (e) {} };
const clearDraft = () => { try { localStorage.removeItem(DRAFT_KEY); } catch (e) {} };

// ─── 공통: 견적 위저드 열기 ───
const openQuote = (service) => {
    track("cta_quote_click", { service: service || "unset" });
    window.dispatchEvent(new CustomEvent("open-quote", { detail: { service: service || "" } }));
};

// ─── 영업시간(08~21시) 기반 상담 상태 ───
const getBizStatus = () => {
    const h = new Date().getHours();
    const open = h >= 8 && h < 21;
    return open
        ? { open: true, text: "지금 상담 가능 · 평균 10분 내 회신" }
        : { open: false, text: "지금 남겨주시면 아침에 가장 먼저 연락드립니다" };
};

/* ─── 미니멀 라인 아이콘 ─── */
const IcPhone = ({ className = "w-4 h-4" }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.6 2.81.72A2 2 0 0 1 22 16.92z" />
    </svg>
);
const IcChat = ({ className = "w-4 h-4" }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
);
const IcCamera = ({ className = "w-4 h-4" }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
    </svg>
);
const IcCheck = ({ className = "w-4 h-4" }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);
const IcArrow = ({ className = "w-4 h-4" }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
);

/* ─── 스크롤 리빌 ─── */
const EASE = [0.22, 1, 0.36, 1];
const Reveal = ({ children, delay = 0, className }) => (
    <motion.div initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.75, delay, ease: EASE }} className={className}>
        {children}
    </motion.div>
);

// ─── 숫자 카운터 ───
const Counter = ({ target, duration = 1.5, suffix = "", decimals = 0 }) => {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });
    useEffect(() => {
        if (isInView) {
            const controls = animate(0, target, { duration, ease: "easeOut", onUpdate: (v) => setCount(v) });
            return () => controls.stop();
        }
    }, [isInView, target]);
    return <span ref={ref}>{count.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>;
};

// ─── 섹션 헤더: 작은 라벨 + 제목 (통일된 단 하나의 스타일) ───
const SectionHead = ({ label, title, sub, dark = false }) => (
    <div className="mb-9 md:mb-12">
        <div className={`text-[11px] font-bold tracking-[0.22em] mb-3.5 ${dark ? "text-stone-500" : "text-stone-400"}`}>{label}</div>
        <h2 className={`text-[26px] md:text-[36px] font-black leading-[1.28] tracking-[-0.02em] whitespace-pre-line ${dark ? "text-white" : "text-stone-900"}`}>{title}</h2>
        {sub && <p className={`mt-4 text-[14px] md:text-[15px] leading-[1.8] ${dark ? "text-stone-400" : "text-stone-500"} max-w-lg`}>{sub}</p>}
    </div>
);

/* ════════════════════════════════════════════
   1. 헤더 — 로고 · 전화 · 견적만
   ════════════════════════════════════════════ */
const Header = () => (
    // 모바일: blur 대신 불투명 배경(저사양 폰 스크롤 버벅임 방지), 데스크톱만 blur
    <header className="sticky top-0 z-[500] border-b border-white/[0.07] bg-[#161412]/[0.97] md:bg-[#161412]/[0.92] md:backdrop-blur-xl">
        <div className="max-w-[1140px] mx-auto flex items-center justify-between px-5 md:px-8 h-14 md:h-[68px]">
            <a href="#top" className="flex items-center gap-2.5" aria-label="아빠와 아들 홈">
                <div className="w-8 h-8 border border-white/30 flex items-center justify-center text-white font-black text-[11px] flex-shrink-0">父子</div>
                <span className="font-black text-[15px] text-white tracking-tight whitespace-nowrap">아빠와 아들</span>
            </a>
            <nav className="hidden md:flex items-center gap-8 text-[13.5px] font-semibold text-stone-400" aria-label="주요 메뉴">
                <a href="#services" className="hover:text-white transition-colors">서비스</a>
                <a href="#portfolio" className="hover:text-white transition-colors">시공사례</a>
                <a href="#reviews" className="hover:text-white transition-colors">후기</a>
                <a href="#story" className="hover:text-white transition-colors">소개</a>
            </nav>
            <div className="flex items-center gap-2 md:gap-3.5 flex-shrink-0">
                <a href={TEL_LINK} onClick={() => track("call_click", { where: "header" })}
                    className="hidden lg:flex items-center gap-2 text-stone-300 hover:text-white font-bold text-[14px] transition-colors" aria-label={`전화 즉시 연결 ${TEL_DISPLAY}`}>
                    <IcPhone className="w-[14px] h-[14px]" />{TEL_DISPLAY}
                </a>
                <a href={TEL_LINK} onClick={() => track("call_click", { where: "header" })}
                    className="lg:hidden flex items-center justify-center w-9 h-9 border border-white/20 text-white active:scale-95 transition-transform" aria-label="전화 즉시 연결">
                    <IcPhone className="w-[15px] h-[15px]" />
                </a>
                <button onClick={() => openQuote()}
                    className="h-9 md:h-10 px-4 md:px-5 text-[12.5px] md:text-[13px] font-black text-white whitespace-nowrap active:scale-95 transition-all hover:brightness-110"
                    style={{ backgroundColor: ACCENT }}>
                    무료 견적
                </button>
            </div>
        </div>
    </header>
);

/* ════════════════════════════════════════════
   2. 히어로 — 요소 최소화
   ════════════════════════════════════════════ */
const Hero = () => (
    <section id="top" className="relative overflow-hidden" style={{ backgroundColor: INK }}>
        {/* 모바일: 사진은 상단에만, 아래로 자연스럽게 어두워짐 */}
        <div className="absolute inset-x-0 top-0 h-[46%] md:hidden" aria-hidden="true">
            <img src="img/father.webp" loading="eager" fetchpriority="high" decoding="async" width="1080" height="1350" className="w-full h-full object-cover object-[center_22%]" alt="" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(22,20,18,0.5) 0%, rgba(22,20,18,0.1) 30%, rgba(22,20,18,0.7) 72%, #161412 100%)" }}></div>
        </div>

        <div className="max-w-[1140px] mx-auto px-6 md:px-8 relative z-10 md:grid md:grid-cols-[1.05fr_0.9fr] md:gap-16 md:items-center md:py-24">
            {/* 카피 */}
            <div className="min-h-[82svh] md:min-h-0 flex flex-col justify-end md:justify-start pt-10 pb-12 md:py-0">
                <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE }}>
                    <div className="text-[11px] font-bold tracking-[0.24em] text-stone-400 mb-5">15년 경력 · 아버지와 아들이 직접 시공</div>
                    <h1 className="text-[34px] md:text-[52px] font-black text-white leading-[1.22] tracking-[-0.03em]">
                        무거운 가구도,<br />
                        무거운 걱정도,<br />
                        저희가 옮깁니다.
                    </h1>
                </motion.div>

                <motion.p initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.12, ease: EASE }}
                    className="mt-6 text-stone-400 text-[14.5px] md:text-[16px] leading-[1.85] max-w-[400px]">
                    사진 한 장 보내주세요.<br className="md:hidden" /> 10분 안에 <strong className="text-white font-semibold">추가금 없는 확정 견적</strong>으로 답합니다.
                </motion.p>

                <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.22, ease: EASE }}
                    className="mt-8 space-y-2.5 max-w-[400px]">
                    <button onClick={() => openQuote()}
                        className="group w-full h-[56px] text-white font-black text-[15.5px] flex items-center justify-center gap-2.5 transition-all hover:brightness-110"
                        style={{ backgroundColor: ACCENT }}>
                        1분 만에 무료 견적 받기
                        <IcArrow className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <a href={TEL_LINK} onClick={() => track("call_click", { where: "hero" })}
                        className="w-full h-[52px] border border-white/25 text-white flex items-center justify-center gap-2.5 font-bold text-[14px] hover:bg-white/[0.06] transition-colors" aria-label={`전화 즉시 연결 ${TEL_DISPLAY}`}>
                        <IcPhone className="w-4 h-4 text-stone-400" /> 전화가 편하시면 {TEL_DISPLAY}
                    </a>
                </motion.div>
            </div>

            {/* 데스크톱: 대표 포트레이트 */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.1, delay: 0.15 }} className="hidden md:block relative">
                <div className="overflow-hidden">
                    <motion.img src="img/father.webp" alt="가구전문가 아빠와 아들 정용원 대표" loading="eager"
                        initial={{ scale: 1.12 }} animate={{ scale: 1 }} transition={{ duration: 1.5, ease: EASE }}
                        className="w-full aspect-[4/5] object-cover object-[center_18%]" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#161412]/85 via-transparent to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-7">
                    <div className="text-white text-[22px] font-black tracking-tight">정용원 <span className="text-[13px] font-medium text-stone-400 ml-1.5">대표 · 수석 기술자</span></div>
                    <div className="text-stone-400 text-[12.5px] font-medium mt-1.5">15년 무사고 시공 · 누적 8,500건</div>
                </div>
            </motion.div>
        </div>

        {/* 지표 스트립 */}
        <div className="border-t border-white/[0.08] relative z-10">
            <div className="max-w-[1140px] mx-auto px-6 md:px-8 grid grid-cols-4">
                {[
                    { value: 15, suffix: "년", label: "현장 경력" },
                    { value: 8500, suffix: "+", label: "누적 시공" },
                    { value: 4.9, suffix: "", decimals: 1, label: "후기 평점" },
                    { value: 92, suffix: "%", label: "재의뢰율" }
                ].map((s, i) => (
                    <div key={i} className="py-6 md:py-8 text-center md:text-left md:pr-10">
                        <div className="text-[21px] md:text-[30px] font-black text-white leading-none tracking-[-0.02em]">
                            <Counter target={s.value} suffix={s.suffix} decimals={s.decimals || 0} />
                        </div>
                        <div className="text-[10.5px] md:text-[12px] font-semibold text-stone-500 mt-2">{s.label}</div>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

/* ════════════════════════════════════════════
   3. 실시간 접수 — 얇은 한 줄
   ════════════════════════════════════════════ */
const LiveTicker = () => {
    const feed = [
        { area: "화성시 병점동", job: "장롱 방간 이동", when: "12분 전" },
        { area: "수원시 영통구", job: "침대 2대 집간 이전설치", when: "41분 전" },
        { area: "동탄2신도시", job: "돌침대 분해·폐기", when: "1시간 전" },
        { area: "용인시 수지구", job: "시스템행거 설치", when: "2시간 전" },
        { area: "오산시 세교동", job: "쇼파 이동 + 수평 조절", when: "3시간 전" },
        { area: "평택시 고덕동", job: "원룸 가구 전체 이전", when: "어제" },
        { area: "안산시 단원구", job: "붙박이장 분해·재설치", when: "어제" }
    ];
    const [idx, setIdx] = useState(0);
    useEffect(() => {
        const t = setInterval(() => setIdx((i) => (i + 1) % feed.length), 3400);
        return () => clearInterval(t);
    }, []);
    return (
        <div className="border-b border-stone-900/10" style={{ backgroundColor: PAPER }}>
            <div className="max-w-[1140px] mx-auto px-6 md:px-8 py-3 flex items-center gap-3">
                <span className="flex-shrink-0 inline-flex items-center gap-2 text-[10px] font-black text-stone-400 tracking-[0.18em]">
                    <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                    실시간 접수
                </span>
                <div className="relative h-5 flex-1 overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.div key={idx} initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }} transition={{ duration: 0.35, ease: EASE }}
                            className="absolute inset-0 flex items-center text-[12px] text-stone-500 font-medium truncate">
                            {feed[idx].area} · {feed[idx].job} <span className="text-stone-400 ml-1.5 text-[11px]">{feed[idx].when}</span>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

/* ════════════════════════════════════════════
   4. 서비스 — 이미지 + 한 문장
   ════════════════════════════════════════════ */
const ServiceSection = () => {
    const services = [
        {
            img: "img/A7.webp", title: "방 ↔ 방 가구이동", price: "3만원~", formValue: "가구이동 (방 ↔ 방)",
            desc: "장롱·침대를 분해해 옮기고, 재조립 후 수평까지. 벽지 스침 하나 없이 끝냅니다."
        },
        {
            img: "img/A8.webp", title: "집 ↔ 집 이전설치", price: "5만원~", formValue: "가구이동 (집 ↔ 집)",
            desc: "이사업체 부르기엔 크고 용달은 불안한 가구 몇 점, 랩핑 포장해 새집 원하는 자리에 놓아드립니다."
        },
        {
            img: "img/A6.webp", title: "가구 폐기 · 수거", price: "2만원~", formValue: "가구폐기",
            desc: "돌침대·장롱 같은 대형 가구를 분해해 반출하고, 폐기 신고와 뒷정리까지 마칩니다."
        },
        {
            img: "img/sh.webp", title: "시스템행거 설치", price: "5만원~", formValue: "시스템행거",
            desc: "레이저 수평으로 흔들림 없이 시공합니다. 이전 재설치와 부분 수리도 가능합니다."
        }
    ];
    return (
        <section className="py-16 md:py-24" id="services" style={{ backgroundColor: PAPER }}>
            <div className="max-w-[1140px] mx-auto px-6 md:px-8">
                <SectionHead label="서비스" title={"이런 일을 해드립니다"} sub="출장비와 상담은 무료입니다. 표시 가격은 최소 기준이며, 사진 확인 후 그대로 청구되는 확정가를 안내드립니다." />
                <div className="grid md:grid-cols-2 gap-x-8 gap-y-10 md:gap-y-14">
                    {services.map((s, i) => (
                        <Reveal key={i} delay={(i % 2) * 0.06}>
                            <button onClick={() => openQuote(s.formValue)} className="group text-left w-full" aria-label={`${s.title} 견적 받아보기`}>
                                <div className="overflow-hidden">
                                    <img src={s.img} loading="lazy" alt={s.title + " 시공 사진"}
                                        className="w-full aspect-[16/10] object-cover group-hover:scale-[1.04] transition-transform duration-700" />
                                </div>
                                <div className="flex items-baseline justify-between gap-3 mt-5">
                                    <h3 className="text-[19px] md:text-[21px] font-black text-stone-900 tracking-[-0.02em]">{s.title}</h3>
                                    <span className="text-[14px] font-black flex-shrink-0" style={{ color: ACCENT }}>{s.price}</span>
                                </div>
                                <p className="mt-2.5 text-[13.5px] md:text-[14px] text-stone-500 leading-[1.8]">{s.desc}</p>
                                <span className="inline-flex items-center gap-2 mt-4 text-[13px] font-black text-stone-900 border-b border-stone-900 pb-0.5 group-hover:gap-3.5 transition-all">
                                    견적 받아보기 <IcArrow className="w-3.5 h-3.5" />
                                </span>
                            </button>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
};

/* ════════════════════════════════════════════
   5. 세 가지 약속 — 비교표 대신 심플하게
   ════════════════════════════════════════════ */
const PromiseSection = () => {
    const promises = [
        { no: "1", t: "가족이 직접 갑니다", d: "그날 모집한 용역 알바가 아니라, 아버지와 아들이 직접 방문합니다. 얼굴을 걸고 일하니 결과가 다릅니다." },
        { no: "2", t: "현장 추가금 0원", d: "견적서에 적은 금액 그대로 받습니다. 현장에서 흥정하거나 금액을 올리는 일은 없습니다." },
        { no: "3", t: "파손 시 전액 보상", d: "바닥 보양부터 깔고 시작해 사고를 막고, 만에 하나 파손되면 전액 책임보상합니다." }
    ];
    return (
        <section className="border-t border-stone-900/10 py-16 md:py-24" style={{ backgroundColor: PAPER }}>
            <div className="max-w-[1140px] mx-auto px-6 md:px-8">
                <SectionHead label="약속" title={"싼 곳은 많습니다.\n믿을 곳이 없을 뿐이죠."} sub="그래서 저희는 가격 대신, 지키는 것으로 말합니다." />
                <div className="grid md:grid-cols-3 gap-0 md:gap-8 border-t md:border-t-0 border-stone-900/10">
                    {promises.map((p, i) => (
                        <Reveal key={i} delay={i * 0.08}>
                            <div className="py-7 md:py-0 border-b md:border-b-0 border-stone-900/10 md:border-t-2 md:border-stone-900 md:pt-7">
                                <div className="flex items-start gap-5">
                                    <span className="text-[15px] font-black flex-shrink-0 mt-0.5" style={{ color: ACCENT }}>{p.no}</span>
                                    <div>
                                        <h3 className="text-[17px] md:text-[18px] font-black text-stone-900 tracking-[-0.01em]">{p.t}</h3>
                                        <p className="mt-2.5 text-[13.5px] text-stone-500 leading-[1.8]">{p.d}</p>
                                    </div>
                                </div>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
};

/* ════════════════════════════════════════════
   6. 스토리 — 다크, 한 호흡
   ════════════════════════════════════════════ */
const StorySection = () => (
    <section className="py-16 md:py-24" id="story" style={{ backgroundColor: INK }}>
        <div className="max-w-[1140px] mx-auto px-6 md:px-8 md:grid md:grid-cols-[1fr_0.85fr] md:gap-16 md:items-center">
            <div>
                <SectionHead dark label="아빠와 아들 이야기" title={"간판보다 무거운 것을\n걸고 일합니다."} />
                <Reveal>
                    <div className="text-stone-400 text-[14px] md:text-[15px] leading-[1.95] space-y-4 max-w-md -mt-2">
                        <p>
                            아버지는 15년째 남의 집 가구를 제 것처럼 만져온 기술자입니다.
                            아들인 저는 그 옆에서 하나를 배웠습니다. <strong className="text-white font-semibold">가구가 아니라, 그 집의 살림을 옮기는 일</strong>이라는 것.
                        </p>
                        <p>
                            그래서 하청도, 일용직도 쓰지 않습니다. 저희에겐 오늘의 현장 하나가 15년 평판의 전부이기 때문입니다.
                        </p>
                    </div>
                    <p className="font-display italic text-[15px] md:text-[16.5px] font-bold leading-[1.8] mt-8 text-[#C89B6D]">
                        "제 아버지가 하는 일이라 제가 제일 잘 압니다.<br />믿고 맡기셔도 됩니다." <span className="text-stone-500 text-[11.5px] font-sans font-semibold not-italic ml-2">— 아들 정형진</span>
                    </p>
                </Reveal>
            </div>
            <Reveal delay={0.1} className="mt-11 md:mt-0">
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { img: "img/father.webp", role: "아빠", name: "정용원", desc: "대표 · 수석 기술자" },
                        { img: "img/son.webp", role: "아들", name: "정형진", desc: "운영 총괄" },
                        { img: "img/uncle.webp", role: "삼촌", name: "김승욱", desc: "현장 관리" }
                    ].map((m, i) => (
                        <div key={i}>
                            <div className="overflow-hidden mb-3">
                                <img src={m.img} loading="lazy" className="w-full aspect-[3/4] object-cover object-top" alt={`${m.role} ${m.name} ${m.desc}`} />
                            </div>
                            <div className="text-white text-[13px] md:text-[14px] font-black">{m.name}</div>
                            <div className="text-stone-500 text-[10.5px] font-medium mt-1">{m.role} · {m.desc}</div>
                        </div>
                    ))}
                </div>
            </Reveal>
        </div>
    </section>
);

/* ════════════════════════════════════════════
   7. 시공 사례
   ════════════════════════════════════════════ */
const PortfolioSection = () => {
    const [tab, setTab] = useState("all");
    const works = [
        { img: "img/A8.webp", cat: "move", label: "쇼파 전면 랩핑 보양", area: "수원 광교" },
        { img: "img/A7.webp", cat: "move", label: "원목 침대 분해·이동", area: "화성 동탄" },
        { img: "img/A2.webp", cat: "install", label: "슬라이딩 장롱 이전설치", area: "용인 수지" },
        { img: "img/stone2.webp", cat: "disposal", label: "돌침대 분해·폐기", area: "오산 세교" },
        { img: "img/A1.webp", cat: "install", label: "아이방 침대 재조립", area: "평택 고덕" },
        { img: "img/sh4.webp", cat: "hanger", label: "ㄱ자 시스템행거 시공", area: "수원 영통" },
        { img: "img/A9.webp", cat: "move", label: "장식장 랩핑 이동", area: "화성 병점" },
        { img: "img/A4.webp", cat: "install", label: "붙박이장 조립·설치", area: "안산 단원" },
        { img: "img/sh-k.webp", cat: "hanger", label: "드레스룸 행거 구성", area: "동탄2" },
        { img: "img/bedframe.webp", cat: "move", label: "침대 프레임 재조립", area: "용인 기흥" },
        { img: "img/clo.webp", cat: "install", label: "붙박이장 마감 실측", area: "수원 장안" },
        { img: "img/A5.webp", cat: "move", label: "원목 침대 수평 조립", area: "성남 분당" }
    ];
    const tabs = [
        { id: "all", label: "전체" },
        { id: "move", label: "가구이동" },
        { id: "install", label: "이전설치" },
        { id: "disposal", label: "폐기" },
        { id: "hanger", label: "시스템행거" }
    ];
    const filtered = tab === "all" ? works : works.filter((w) => w.cat === tab);
    return (
        <section className="border-t border-stone-900/10 py-16 md:py-24" id="portfolio" style={{ backgroundColor: PAPER }}>
            <div className="max-w-[1140px] mx-auto px-6 md:px-8">
                <SectionHead label="시공 사례" title="어제도 어딘가의 집에서" sub="잘 나온 사진이 아니라, 실제로 일한 현장의 기록입니다." />
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-7 -mx-1 px-1">
                    {tabs.map((t) => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            className={`flex-shrink-0 px-4 py-2 text-[12.5px] font-bold transition-colors border ${tab === t.id ? "bg-stone-900 text-white border-stone-900" : "bg-transparent text-stone-500 border-stone-900/15 hover:border-stone-900/40"}`}>
                            {t.label}
                        </button>
                    ))}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    <AnimatePresence mode="popLayout">
                        {filtered.map((w, i) => (
                            <motion.figure key={w.img} layout initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                transition={{ duration: 0.5, delay: (i % 4) * 0.04, ease: EASE }}
                                className="group relative overflow-hidden bg-stone-200">
                                <div className="aspect-[4/5] overflow-hidden">
                                    <img src={w.img} loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-700" alt={`${w.label} — ${w.area} 시공 사례`} />
                                </div>
                                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent pt-10 pb-3 px-3.5">
                                    <div className="text-white text-[11.5px] md:text-[12.5px] font-bold leading-tight">{w.label}</div>
                                    <div className="text-stone-300 text-[10px] font-medium mt-0.5">{w.area}</div>
                                </figcaption>
                            </motion.figure>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </section>
    );
};

/* ════════════════════════════════════════════
   8. 후기
   ════════════════════════════════════════════ */
const ReviewSection = () => {
    const captures = [
        { url: "img/1.webp", tag: "당근 후기" }, { url: "img/2.webp", tag: "당근 후기" },
        { url: "img/3.webp", tag: "당근 후기" }, { url: "img/4.webp", tag: "당근 후기" },
        { url: "img/5.webp", tag: "당근 후기" }, { url: "img/6.webp", tag: "숨고 후기" },
        { url: "img/7.webp", tag: "숨고 후기" }, { url: "img/8.webp", tag: "숨고 후기" }
    ];
    const doubled = [...captures, ...captures];
    const quotes = [
        { text: "시간 약속을 정확히 지켜주시고, 포장부터 설치까지 깔끔하게 마무리해 주셨어요.", who: "목동 · 장롱 이전" },
        { text: "돌침대 폐기, 다른 데선 다 어렵다고 했는데 두 분이 오셔서 한 시간 만에 끝내셨어요.", who: "동탄 · 돌침대 폐기" },
        { text: "바닥 보양까지 해주시고, 추가비용 얘기가 한 번도 안 나온 게 제일 좋았습니다.", who: "수원 영통 · 침대 이동" }
    ];
    return (
        <section className="border-t border-stone-900/10 py-16 md:py-24 overflow-hidden" id="reviews" style={{ backgroundColor: PAPER }}>
            <div className="max-w-[1140px] mx-auto px-6 md:px-8">
                <SectionHead label="후기" title={"자랑은 여기까지.\n나머지는 고객님이 쓰셨습니다"}
                    sub={<>당근마켓 별점 <strong className="text-stone-800">5.0 · 단골 380+</strong>, 숨고 리뷰 <strong className="text-stone-800">5.0 · 185개+</strong> — 캡처 원본 그대로 보여드립니다.</>} />
            </div>

            {/* 캡처 마키 — CSS 애니메이션(index.html의 .marquee-track), 저사양 폰에서도 부드럽게 */}
            <div className="marquee-track">
                {doubled.map((r, i) => (
                    <div key={i} className="flex-shrink-0 w-[240px] relative bg-white border border-stone-900/10">
                        <div className="h-[300px] overflow-hidden">
                            <img src={r.url} loading="lazy" className="w-full h-full object-cover object-top" alt={r.tag + " 캡처 원본"} />
                        </div>
                        <div className="absolute top-3 left-3 px-2 py-1 text-[9.5px] font-black text-white" style={{ backgroundColor: "rgba(22,20,18,0.8)" }}>{r.tag}</div>
                    </div>
                ))}
            </div>

            <div className="max-w-[1140px] mx-auto px-6 md:px-8 mt-9 grid md:grid-cols-3 gap-4 md:gap-8">
                {quotes.map((q, i) => (
                    <Reveal key={i} delay={i * 0.06}>
                        <blockquote className="border-l-2 border-stone-900/20 pl-4">
                            <p className="text-[13.5px] md:text-[14px] text-stone-600 leading-[1.85]">"{q.text}"</p>
                            <footer className="text-[11px] font-bold text-stone-400 mt-2.5">{q.who}</footer>
                        </blockquote>
                    </Reveal>
                ))}
            </div>
        </section>
    );
};

/* ════════════════════════════════════════════
   9. 인증 + 진행 과정 — 한 섹션으로 압축
   ════════════════════════════════════════════ */
const TrustSection = () => {
    const steps = [
        { no: "1", title: "사진 1장 보내기", desc: "견적 신청·카톡·전화, 편한 방법으로 보내주세요." },
        { no: "2", title: "확정 견적 도착", desc: "10분 안에 추가금 없는 확정 금액으로 답합니다." },
        { no: "3", title: "보양 먼저, 시공", desc: "약속한 날짜에 방문해 바닥 보양부터 시작합니다." },
        { no: "4", title: "같이 확인하고 끝", desc: "수평·마감을 함께 확인하고 A/S까지 책임집니다." }
    ];
    return (
        <section className="border-t border-stone-900/10 py-16 md:py-24" style={{ backgroundColor: PAPER }}>
            <div className="max-w-[1140px] mx-auto px-6 md:px-8">
                <SectionHead label="진행 과정" title="신청부터 시공까지, 이렇게 진행됩니다" />
                <div className="grid md:grid-cols-4 gap-0 md:gap-8 border-t md:border-t-0 border-stone-900/10 mb-14 md:mb-20">
                    {steps.map((s, i) => (
                        <Reveal key={i} delay={i * 0.06}>
                            <div className="py-6 md:py-0 border-b md:border-b-0 border-stone-900/10 md:border-t-2 md:border-stone-900 md:pt-6 flex md:block items-start gap-5">
                                <span className="text-[15px] font-black flex-shrink-0" style={{ color: ACCENT }}>{s.no}</span>
                                <div className="md:mt-3">
                                    <h3 className="text-[15.5px] font-black text-stone-900">{s.title}</h3>
                                    <p className="mt-2 text-[13px] text-stone-500 leading-[1.75]">{s.desc}</p>
                                </div>
                            </div>
                        </Reveal>
                    ))}
                </div>

                <SectionHead label="인증" title="의심되시나요? 당연합니다." sub="정식 사업자 등록부터 플랫폼 인증까지, 서류로 보여드립니다." />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 md:items-start">
                    {[
                        { img: "img/cert-soomgo.webp", title: "숨고 본인인증 고수", sub: "리뷰 5.0 (185+)" },
                        { img: "img/cert-danggeun.webp", title: "당근마켓 공식 동네업체", sub: "단골 380+ · 별점 5.0" },
                        { img: "img/cert-biz.webp", title: "정식 사업자 등록", sub: "등록번호 715-03-03416 · 대표 정용원" }
                    ].map((c, i) => (
                        <Reveal key={i} delay={i * 0.06}>
                            <div className="bg-white border border-stone-900/10">
                                <div className="overflow-hidden max-h-[320px] md:max-h-none">
                                    <img src={c.img} loading="lazy" className="w-full h-auto block" alt={c.title} />
                                </div>
                                <div className="px-4 py-3.5 flex items-center justify-between border-t border-stone-900/10">
                                    <div>
                                        <div className="text-[13px] font-black text-stone-900">{c.title}</div>
                                        <div className="text-[10.5px] font-medium text-stone-400 mt-1">{c.sub}</div>
                                    </div>
                                    <span className="flex-shrink-0 w-7 h-7 border border-emerald-600 text-emerald-600 flex items-center justify-center"><IcCheck className="w-3.5 h-3.5" /></span>
                                </div>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
};

/* ════════════════════════════════════════════
   10. 전화 즉시 연결 밴드
   ════════════════════════════════════════════ */
const CallBand = () => {
    const status = getBizStatus();
    return (
        <section className="py-16 md:py-24" style={{ backgroundColor: INK }}>
            <div className="max-w-[1140px] mx-auto px-6 md:px-8 text-center">
                <Reveal>
                    <div className="text-[11px] font-bold tracking-[0.22em] text-stone-500 mb-4">전화 상담</div>
                    <h2 className="text-[24px] md:text-[34px] font-black text-white leading-[1.3] tracking-[-0.02em]">
                        글보다 말이 편하시다면,<br />지금 누르세요.
                    </h2>
                    <a href={TEL_LINK} onClick={() => track("call_click", { where: "callband" })}
                        className="inline-flex items-center gap-4 mt-8 group" aria-label={`전화 즉시 연결 ${TEL_DISPLAY}`}>
                        <span className="w-12 h-12 md:w-14 md:h-14 border border-white/25 flex items-center justify-center text-white group-hover:bg-white group-hover:text-stone-900 transition-colors flex-shrink-0">
                            <IcPhone className="w-5 h-5" />
                        </span>
                        <span className="text-[32px] md:text-[52px] font-black text-white tracking-[0.01em] leading-none border-b-2 border-white/25 pb-2 group-hover:border-white transition-colors">{TEL_DISPLAY}</span>
                    </a>
                    <p className="mt-5 text-stone-500 text-[12.5px]">연중무휴 08:00–21:00 · 대표가 직접 받습니다 · {status.text}</p>
                </Reveal>
            </div>
        </section>
    );
};

/* ════════════════════════════════════════════
   11. FAQ
   ════════════════════════════════════════════ */
const FAQSection = () => {
    const [openIdx, setOpenIdx] = useState(0);
    const faqs = [
        { q: "비용이 어느 정도 나올까요?", a: "가구 종류·수량, 층수와 엘리베이터 유무에 따라 달라집니다. 견적 신청에 사진 한 장만 올려주시면 추가금 없는 확정 견적을 10분 내로 안내드려요. 상담 비용은 일절 없습니다." },
        { q: "현장에서 추가금이 생기지는 않나요?", a: "보내주신 사진·정보가 정확하다면 현장 추가금은 0원입니다(정찰제 원칙). 사전에 안내되지 않은 가구나 상황이 현장에서 확인되면, 작업 전에 반드시 협의 후 진행합니다." },
        { q: "가구가 파손되면 어떻게 되나요?", a: "작업 중 발생한 가구·집안 파손은 전액 책임보상해 드립니다. 다만 15년간 보상까지 간 사고가 거의 없도록, 보양 작업으로 예방하는 것을 원칙으로 합니다." },
        { q: "어느 지역까지 와주시나요?", a: "경기남부(수원·화성·동탄·용인·오산·평택·안산 등)가 중심이며, 서울·인천을 포함한 수도권 전역 출장이 가능합니다. 애매하시면 일단 편하게 문의해 주세요." },
        { q: "당일이나 주말에도 가능한가요?", a: "일정이 비어 있으면 당일 시공도 가능합니다. 주말·공휴일에도 정상 운영하니(08~21시) 급하신 경우 전화 주시면 가장 빠르게 잡아드립니다." }
    ];
    return (
        <section className="py-16 md:py-24" style={{ backgroundColor: PAPER }}>
            <div className="max-w-[760px] mx-auto px-6 md:px-8">
                <SectionHead label="자주 묻는 질문" title="망설이게 하는 질문들, 먼저 답해드립니다" />
                <div className="border-t border-stone-900/10">
                    {faqs.map((f, i) => (
                        <div key={i} className="border-b border-stone-900/10">
                            <button onClick={() => setOpenIdx(openIdx === i ? null : i)} aria-expanded={openIdx === i}
                                className="w-full py-5 flex justify-between items-center text-left gap-4">
                                <span className="text-[14.5px] md:text-[15.5px] font-bold text-stone-800">{f.q}</span>
                                <motion.span animate={{ rotate: openIdx === i ? 45 : 0 }} className="text-stone-400 text-[20px] font-light flex-shrink-0 leading-none">+</motion.span>
                            </button>
                            <AnimatePresence>
                                {openIdx === i && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.32, ease: EASE }} className="overflow-hidden">
                                        <p className="pb-5 text-[13.5px] text-stone-500 leading-[1.9] max-w-xl">{f.a}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

/* ════════════════════════════════════════════
   12. 견적 위저드 — 4단계 (로직 동일)
   ════════════════════════════════════════════ */
const REGION_CHIPS = [
    { label: "수원", city: "수원시" }, { label: "화성 · 동탄", city: "화성시(동탄)" },
    { label: "용인", city: "용인시" }, { label: "오산", city: "오산시" },
    { label: "평택", city: "평택시" }, { label: "안산", city: "안산시" },
    { label: "성남", city: "성남시" }, { label: "안양 · 군포", city: "안양시·군포시" },
    { label: "서울", city: "서울" }, { label: "인천", city: "인천" }
];
const SCHEDULE_CHIPS = ["가능한 한 빨리", "이번 주 안에", "2주 안에", "날짜 직접 선택"];
const SERVICE_OPTIONS = [
    { v: "가구이동 (방 ↔ 방)", d: "같은 집 안에서 가구 위치를 옮겨요" },
    { v: "가구이동 (집 ↔ 집)", d: "다른 집으로 가구를 옮기고 설치해요" },
    { v: "가구폐기", d: "돌침대·장롱 등을 분해해서 버려요" },
    { v: "시스템행거", d: "행거 설치·이전·수리가 필요해요" },
    { v: "기타", d: "그 외 가구 관련 도움이 필요해요" }
];
const ITEM_CHIPS = ["장롱/옷장", "침대", "돌침대", "서랍장", "쇼파", "책상·책장", "시스템행거", "기타"];
const TOTAL_STEPS = 4;
const STEP_CHEERS = ["", "생각하신 작업을 골라주세요", "좋아요, 벌써 절반 왔어요", "거의 다 왔어요", "마지막입니다 — 딱 10초"];

const QuoteWizard = () => {
    const emptyForm = { service: "", items: [], detail: "", photos: [], region: "", regionEtc: "", schedule: "가능한 한 빨리", date: "", phone: "" };
    const [formData, setFormData] = useState(() => {
        const d = loadDraft();
        return d && d.data ? { ...emptyForm, ...d.data } : emptyForm;
    });
    const [step, setStep] = useState(1);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [agree, setAgree] = useState(false);
    const [showPrivacy, setShowPrivacy] = useState(false);
    const [showExitGuard, setShowExitGuard] = useState(false);
    const [hasDraft, setHasDraft] = useState(() => { const d = loadDraft(); return !!(d && d.data && d.data.service); });
    const scrollRef = useRef(null);
    const todayStr = new Date().toISOString().split("T")[0];

    // 전역 '견적 열기' 이벤트 수신 (서비스 사전 선택 지원)
    useEffect(() => {
        const handler = (e) => {
            const svc = e.detail && e.detail.service;
            setIsExpanded(true);
            if (svc) {
                setFormData((prev) => ({ ...prev, service: svc }));
                setStep((s) => (s === 1 ? 2 : s));
            }
            track("quote_open", { preset: svc || "none" });
        };
        window.addEventListener("open-quote", handler);
        return () => window.removeEventListener("open-quote", handler);
    }, []);

    // 열려 있는 동안 배경 스크롤 잠금
    useEffect(() => {
        document.body.style.overflow = isExpanded ? "hidden" : "unset";
        return () => { document.body.style.overflow = "unset"; };
    }, [isExpanded]);

    // 자동 저장 + 단계 추적
    useEffect(() => { if (isExpanded && !isSubmitted) saveDraft(formData, step); }, [formData, step, isExpanded, isSubmitted]);
    useEffect(() => {
        if (isExpanded) {
            track("quote_step", { step });
            if (scrollRef.current) scrollRef.current.scrollTo({ top: 0 });
        }
    }, [step, isExpanded]);

    const next = () => setStep((s) => Math.min(TOTAL_STEPS, s + 1));
    const prev = () => setStep((s) => Math.max(1, s - 1));

    const requestExit = () => setShowExitGuard(true);
    const confirmExit = () => {
        setShowExitGuard(false);
        setIsExpanded(false);
        setHasDraft(!!formData.service);
        track("quote_exit", { step });
    };

    // 사진 업로드(최대 3장) + 자동 압축
    const MAX_PHOTOS = 3;
    const handleFileChange = (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        files.slice(0, MAX_PHOTOS).forEach((file) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    const MAX_WIDTH = 1000;
                    let width = img.width, height = img.height;
                    if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                    canvas.width = width; canvas.height = height;
                    canvas.getContext("2d").drawImage(img, 0, 0, width, height);
                    const compressed = canvas.toDataURL("image/jpeg", 0.6);
                    setFormData((prevF) => {
                        if (prevF.photos.length >= MAX_PHOTOS) return prevF;
                        return { ...prevF, photos: [...prevF.photos, { data: compressed, name: file.name }] };
                    });
                };
            };
        });
        e.target.value = "";
    };
    const removePhoto = (idx) => setFormData((prevF) => ({ ...prevF, photos: prevF.photos.filter((_, i) => i !== idx) }));

    const toggleItem = (it) => setFormData((prevF) => ({
        ...prevF,
        items: prevF.items.includes(it) ? prevF.items.filter((x) => x !== it) : [...prevF.items, it]
    }));

    const regionValue = formData.regionEtc.trim() ? formData.regionEtc.trim() : formData.region;
    const canStep2 = formData.items.length > 0 || formData.detail.trim().length > 0;
    const canStep3 = regionValue.length > 0 && (formData.schedule !== "날짜 직접 선택" || formData.date);
    const canSubmit = formData.phone.length >= 12 && agree && !loading;

    // ── 접수 (기존 구글시트 GAS 엔드포인트 호환 유지) ──
    const handleSubmit = async () => {
        if (!canSubmit) return;
        setLoading(true);
        const GAS_URL = "https://script.google.com/macros/s/AKfycbzTIfAvR-R5AY91bR2LZX15BumZ0v7L2uDyI7__M2WatINXekf9a75a60xzNf3ZsxNztA/exec";
        const scheduleNote = formData.schedule === "날짜 직접 선택" ? `희망일 ${formData.date}` : formData.schedule;
        const contentParts = [];
        if (formData.items.length) contentParts.push(formData.items.join(", "));
        if (formData.detail.trim()) contentParts.push(formData.detail.trim());
        contentParts.push(`[일정] ${scheduleNote}`);
        const payload = {
            service: formData.service,
            province: formData.regionEtc.trim() ? "직접입력" : "경기/수도권",
            city: regionValue,
            content: contentParts.join("\n"),
            date: formData.schedule === "날짜 직접 선택" ? formData.date : "",
            dateNone: formData.schedule !== "날짜 직접 선택",
            phone: formData.phone,
            photos: formData.photos,
            photoData: formData.photos[0] ? formData.photos[0].data : null,
            photoName: formData.photos[0] ? formData.photos[0].name : "",
            photoCount: formData.photos.length,
            agreedPrivacy: agree
        };
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 15000);
        try {
            await fetch(GAS_URL, {
                method: "POST", mode: "no-cors",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(payload), signal: controller.signal
            });
            clearTimeout(timer);
            setIsSubmitted(true);
            clearDraft();
            setHasDraft(false);
            track("generate_lead", { karrot: "SubmitApplication", service: formData.service, region: regionValue });
            confetti({ particleCount: 130, spread: 70, origin: { y: 0.5 }, colors: [ACCENT, "#ffffff", "#C89B6D"] });
        } catch (error) {
            clearTimeout(timer);
            console.error("Submit Error:", error);
            if (window.confirm("전송이 원활하지 않습니다. 카카오톡으로 바로 상담하시겠어요? (입력 내용은 저장돼 있어요)")) {
                window.open(KAKAO_URL, "_blank");
            }
        } finally {
            setLoading(false);
        }
    };

    /* ── 접수 완료 화면 ── */
    if (isSubmitted) {
        return (
            <section className="fixed inset-0 z-[9999] overflow-y-auto no-scrollbar" aria-label="접수 완료" style={{ backgroundColor: PAPER }}>
                <div className="max-w-[560px] mx-auto px-6 py-12 pb-16">
                    <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: EASE }} className="text-center">
                        <div className="w-16 h-16 border-2 border-emerald-600 text-emerald-600 flex items-center justify-center mx-auto mb-7"><IcCheck className="w-7 h-7" /></div>
                        <h2 className="text-[26px] md:text-[29px] font-black text-stone-900 leading-tight tracking-[-0.02em]">접수 완료.<br />지금부터는 저희가 움직입니다.</h2>
                        <p className="mt-5 text-stone-500 text-[14px] leading-[1.9]">방금 <strong className="text-stone-800 font-semibold">정용원 대표 휴대폰으로</strong> 알림이 전송되었습니다.<br />영업시간 기준 <strong className="font-semibold" style={{ color: ACCENT }}>평균 10분 내</strong>에 연락드립니다.</p>
                    </motion.div>

                    <div className="bg-white border border-stone-900/10 mt-9">
                        {[
                            { t: "사진·내용 확인", d: "보내주신 정보를 대표가 직접 확인합니다.", state: "now" },
                            { t: "확정 견적 연락", d: "추가금 없는 확정 금액을 안내드립니다.", state: "next" },
                            { t: "날짜 확정 · 시공", d: "편하신 날짜로 예약하고 방문합니다.", state: "next" }
                        ].map((s, i) => (
                            <div key={i} className={`flex items-start gap-4 p-5 ${i < 2 ? "border-b border-stone-900/10" : ""}`}>
                                <span className={`w-7 h-7 flex-shrink-0 flex items-center justify-center text-[11px] font-black ${s.state === "now" ? "text-white" : "bg-stone-100 text-stone-400"}`}
                                    style={s.state === "now" ? { backgroundColor: ACCENT } : {}}>{i + 1}</span>
                                <div>
                                    <div className="text-[14px] font-black text-stone-900">{s.t} {s.state === "now" && <span className="text-[10px] font-bold ml-1.5" style={{ color: ACCENT }}>— 진행 중</span>}</div>
                                    <div className="text-[12px] text-stone-500 mt-1">{s.d}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 p-6 flex items-center gap-5" style={{ backgroundColor: INK }}>
                        <div className="w-16 h-16 overflow-hidden flex-shrink-0 border border-white/20">
                            <img src="img/father.webp" className="w-full h-full object-cover object-top" alt="정용원 대표" />
                        </div>
                        <p className="text-[13.5px] text-stone-300 leading-[1.9]">"꼼꼼히 확인하고 <strong className="text-white">바로 전화드리겠습니다.</strong><br />모르는 번호로 와도 한 번만 받아주세요."</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <a href={TEL_LINK} onClick={() => track("call_click", { where: "success" })}
                            className="h-14 text-white flex items-center justify-center gap-2 font-black text-[13px]" style={{ backgroundColor: INK }} aria-label={`전화 즉시 연결 ${TEL_DISPLAY}`}>
                            <IcPhone className="w-4 h-4" /> 바로 통화하기
                        </a>
                        <a href={KAKAO_URL} target="_blank" rel="noopener" onClick={() => track("kakao_click", { where: "success" })}
                            className="h-14 bg-[#FEE500] text-stone-900 flex items-center justify-center gap-2 font-black text-[13px]">
                            <IcChat className="w-4 h-4" /> 카톡으로 말 걸기
                        </a>
                    </div>

                    <div className="mt-11">
                        <h3 className="text-[18px] font-black text-stone-900 mb-5 tracking-[-0.01em]">기다리시는 동안, 저희가 일하는 모습을 구경하세요</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { img: "img/A8.webp", cap: "쇼파 전면 랩핑 보양" },
                                { img: "img/A2.webp", cap: "슬라이딩 장롱 이전설치" },
                                { img: "img/sh4.webp", cap: "시스템행거 정밀 시공" },
                                { img: "img/A5.webp", cap: "원목 침대 재조립" }
                            ].map((w, i) => (
                                <figure key={i} className="relative overflow-hidden">
                                    <div className="aspect-square"><img src={w.img} loading="lazy" className="w-full h-full object-cover" alt={w.cap} /></div>
                                    <figcaption className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pt-7 pb-2.5 px-3 text-white text-[10.5px] font-bold">{w.cap}</figcaption>
                                </figure>
                            ))}
                        </div>
                        <blockquote className="border-l-2 border-stone-900/20 pl-4 mt-6">
                            <p className="text-[13px] text-stone-600 leading-[1.85]">"보양까지 해주시고 추가비용 얘기가 한 번도 안 나온 게 제일 좋았어요."</p>
                            <footer className="text-[10.5px] font-bold text-stone-400 mt-2">수원 영통 · 침대 이동</footer>
                        </blockquote>
                    </div>

                    <button onClick={() => { setIsExpanded(false); setIsSubmitted(false); setStep(1); setFormData(emptyForm); setAgree(false); }}
                        className="mt-9 w-full py-3 text-stone-400 text-[12px] font-bold underline underline-offset-4">처음 화면으로 돌아가기</button>
                </div>
            </section>
        );
    }

    /* ── 섹션 (접힌 상태) — CTA 밴드 ── */
    if (!isExpanded) {
        return (
            <section id="quote-form" className="py-16 md:py-24 border-t border-white/[0.06]" style={{ backgroundColor: INK }}>
                <div className="max-w-[760px] mx-auto px-6 md:px-8 text-center">
                    <Reveal>
                        <div className="text-[11px] font-bold tracking-[0.22em] text-stone-500 mb-4">무료 견적</div>
                        <h2 className="text-[26px] md:text-[38px] font-black text-white leading-[1.28] tracking-[-0.02em]">
                            고민에 쓰는 1분을,<br />견적 받는 1분으로.
                        </h2>
                        <p className="mt-4 text-stone-400 text-[13.5px] md:text-[15px]">사진 한 장이면 끝납니다. 복잡한 건 전부 저희 몫입니다.</p>
                        {hasDraft ? (
                            <button onClick={() => setIsExpanded(true)}
                                className="group mt-8 w-full md:w-auto md:px-14 h-[56px] text-stone-900 bg-white font-black text-[15px] inline-flex items-center justify-center gap-3 hover:bg-stone-100 transition-colors">
                                작성하시던 견적 이어서 하기 <IcArrow className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        ) : (
                            <button onClick={() => openQuote()}
                                className="group mt-8 w-full md:w-auto md:px-14 h-[56px] text-white font-black text-[15px] inline-flex items-center justify-center gap-3 hover:brightness-110 transition-all"
                                style={{ backgroundColor: ACCENT }}>
                                1분 무료 견적 시작하기 <IcArrow className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        )}
                        <p className="mt-5 text-[11.5px] text-stone-500">입력 자동저장 · 스팸 없음 · 상담 후 정보 파기</p>
                    </Reveal>
                </div>
            </section>
        );
    }

    /* ── 위저드 (펼친 상태) ── */
    return (
        <section id="quote-form" role="dialog" aria-modal="true" aria-label="무료 견적 신청"
            className="fixed inset-0 z-[9999] overflow-hidden md:flex md:items-center md:justify-center md:p-6"
            style={{ minHeight: "100dvh", backgroundColor: "rgba(22,20,18,0.75)" }}>
            <div className="w-full h-full md:h-auto md:max-h-[92vh] md:max-w-[560px] md:shadow-2xl md:overflow-hidden flex flex-col" style={{ backgroundColor: PAPER, height: "100dvh" }}>
                <div className="flex flex-col h-full md:max-h-[92vh] px-5 md:px-8 pt-4 md:pt-6 pb-6">
                    <div className="flex items-center justify-between mb-5">
                        <button onClick={step === 1 ? requestExit : prev} aria-label={step === 1 ? "견적 신청 닫기" : "이전 단계"}
                            className="w-11 h-11 flex items-center justify-center bg-white border border-stone-900/10 text-stone-700">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                        </button>
                        <div className="text-[11px] font-black text-stone-400 tracking-[0.2em]">{step} / {TOTAL_STEPS}</div>
                        <button onClick={requestExit} aria-label="닫기" className="w-11 h-11 flex items-center justify-center text-stone-400 text-xl font-light">✕</button>
                    </div>

                    <div className="h-[3px] bg-stone-200 mb-6 overflow-hidden">
                        <motion.div className="h-full" style={{ backgroundColor: ACCENT }} animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
                    </div>

                    <div className="mb-6">
                        <div className="text-[10.5px] font-black tracking-[0.12em] mb-2" style={{ color: ACCENT }}>{STEP_CHEERS[step]}</div>
                        <h2 className="text-[23px] font-black text-stone-900 leading-tight whitespace-pre-line tracking-[-0.02em]">
                            {step === 1 && "어떤 도움이\n필요하세요?"}
                            {step === 2 && "어떤 가구인가요?"}
                            {step === 3 && "어디로, 언제\n가면 될까요?"}
                            {step === 4 && "견적 보내드릴\n연락처만 남겨주세요"}
                        </h2>
                    </div>

                    <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar pb-4">
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div key="s1" initial={{ x: 24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -24, opacity: 0 }} transition={{ ease: EASE, duration: 0.4 }} className="space-y-2.5">
                                    {SERVICE_OPTIONS.map((o) => (
                                        <button key={o.v} onClick={() => { setFormData({ ...formData, service: o.v }); next(); }}
                                            className={`w-full p-4 border-2 text-left flex items-center justify-between gap-4 transition-all active:scale-[0.99] group ${formData.service === o.v ? "bg-white" : "bg-white border-stone-900/10 hover:border-stone-900/30"}`}
                                            style={formData.service === o.v ? { borderColor: ACCENT } : {}}>
                                            <span>
                                                <span className="block text-[15px] font-black text-stone-900">{o.v}</span>
                                                <span className="block text-[11.5px] text-stone-400 mt-1">{o.d}</span>
                                            </span>
                                            <IcArrow className="w-4 h-4 text-stone-300 group-hover:text-stone-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                                        </button>
                                    ))}
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div key="s2" initial={{ x: 24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -24, opacity: 0 }} transition={{ ease: EASE, duration: 0.4 }} className="space-y-6">
                                    <div>
                                        <p className="text-[11px] font-black text-stone-500 mb-2.5">해당하는 가구를 모두 선택해 주세요</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {ITEM_CHIPS.map((item) => {
                                                const on = formData.items.includes(item);
                                                return (
                                                    <button key={item} onClick={() => toggleItem(item)}
                                                        className={`h-12 font-bold text-[13.5px] border-2 transition-all flex items-center justify-center gap-2 ${on ? "bg-white text-stone-900" : "bg-white border-stone-900/10 text-stone-500 hover:border-stone-900/30"}`}
                                                        style={on ? { borderColor: ACCENT } : {}}>
                                                        {item} {on && <IcCheck className="w-3.5 h-3.5" style={{ color: ACCENT }} />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-black text-stone-500 mb-2.5">사진을 올려주시면 견적이 더 정확해요 <span className="text-stone-400 font-medium">(선택, 최대 3장)</span></p>
                                        <div className="grid grid-cols-2 gap-2.5">
                                            <div className={`relative h-24 bg-white border-2 border-dashed border-stone-300 flex flex-col items-center justify-center gap-1.5 ${formData.photos.length >= 3 ? "opacity-40 pointer-events-none" : ""}`}>
                                                <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="absolute inset-0 opacity-0 z-10" aria-label="사진 촬영" />
                                                <IcCamera className="w-5 h-5 text-stone-500" />
                                                <p className="text-[12px] font-bold text-stone-600">지금 촬영</p>
                                            </div>
                                            <div className={`relative h-24 bg-white border-2 border-dashed border-stone-300 flex flex-col items-center justify-center gap-1.5 ${formData.photos.length >= 3 ? "opacity-40 pointer-events-none" : ""}`}>
                                                <input type="file" accept="image/*" multiple onChange={handleFileChange} className="absolute inset-0 opacity-0 z-10" aria-label="앨범에서 선택" />
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="w-5 h-5 text-stone-500" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                                                <p className="text-[12px] font-bold text-stone-600">앨범에서 선택</p>
                                            </div>
                                        </div>
                                        {formData.photos.length > 0 && (
                                            <div className="grid grid-cols-3 gap-2 mt-2.5">
                                                {formData.photos.map((p, i) => (
                                                    <div key={i} className="relative aspect-square overflow-hidden border border-stone-900/10">
                                                        <img src={p.data} alt={`첨부 사진 ${i + 1}`} className="w-full h-full object-cover" />
                                                        <button onClick={() => removePhoto(i)} aria-label="사진 삭제" className="absolute top-1 right-1 w-6 h-6 bg-black/70 text-white text-xs font-black flex items-center justify-center">✕</button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-black text-stone-500 mb-2.5">더 알려주실 내용이 있다면 <span className="text-stone-400 font-medium">(선택)</span></p>
                                        <textarea value={formData.detail} onChange={(e) => setFormData({ ...formData, detail: e.target.value })}
                                            className="w-full h-20 bg-white border-2 border-stone-900/10 p-3.5 text-stone-800 text-[13px] outline-none focus:border-stone-900/40 transition-colors"
                                            placeholder="예) 장롱 3짝, 안방에서 작은방으로 / 5층인데 엘리베이터 있어요"></textarea>
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div key="s3" initial={{ x: 24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -24, opacity: 0 }} transition={{ ease: EASE, duration: 0.4 }} className="space-y-7">
                                    <div>
                                        <p className="text-[11px] font-black text-stone-500 mb-2.5">작업할 지역이 어디인가요?</p>
                                        <div className="grid grid-cols-3 gap-2">
                                            {REGION_CHIPS.map((r) => (
                                                <button key={r.city} onClick={() => setFormData({ ...formData, region: r.city, regionEtc: "" })}
                                                    className={`py-3 text-[12.5px] font-bold border-2 transition-all ${formData.region === r.city && !formData.regionEtc ? "bg-white text-stone-900" : "bg-white border-stone-900/10 text-stone-500 hover:border-stone-900/30"}`}
                                                    style={formData.region === r.city && !formData.regionEtc ? { borderColor: ACCENT } : {}}>
                                                    {r.label}
                                                </button>
                                            ))}
                                        </div>
                                        <input type="text" value={formData.regionEtc} onChange={(e) => setFormData({ ...formData, regionEtc: e.target.value })}
                                            className="mt-2 w-full h-12 bg-white border-2 border-stone-900/10 px-4 text-stone-800 text-[13px] outline-none focus:border-stone-900/40 transition-colors"
                                            placeholder="다른 지역이면 직접 입력해 주세요 (예: 천안 불당동)" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-black text-stone-500 mb-2.5">언제쯤이 좋으세요?</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {SCHEDULE_CHIPS.map((sc) => (
                                                <button key={sc} onClick={() => setFormData({ ...formData, schedule: sc })}
                                                    className={`h-12 text-[13px] font-bold border-2 transition-all ${formData.schedule === sc ? "bg-white text-stone-900" : "bg-white border-stone-900/10 text-stone-500 hover:border-stone-900/30"}`}
                                                    style={formData.schedule === sc ? { borderColor: ACCENT } : {}}>
                                                    {sc}
                                                </button>
                                            ))}
                                        </div>
                                        {formData.schedule === "날짜 직접 선택" && (
                                            <input type="date" min={todayStr} value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                className="mt-2 w-full h-14 bg-white border-2 border-stone-900/10 px-4 text-stone-800 outline-none focus:border-stone-900/40" />
                                        )}
                                        <p className="text-[11px] text-stone-400 mt-2.5">확정이 아니어도 괜찮아요. 통화하면서 편하게 조율해요.</p>
                                    </div>
                                </motion.div>
                            )}

                            {step === 4 && (
                                <motion.div key="s4" initial={{ x: 24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -24, opacity: 0 }} transition={{ ease: EASE, duration: 0.4 }} className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-20 h-16 bg-stone-100 border-2 border-stone-900/10 flex items-center justify-center text-xl font-black text-stone-400 flex-shrink-0">010</div>
                                        <input type="tel" value={formData.phone.replace("010-", "")}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/[^\d]/g, "").slice(0, 8);
                                                let formatted = val;
                                                if (val.length > 4) formatted = val.slice(0, 4) + "-" + val.slice(4);
                                                setFormData({ ...formData, phone: "010-" + formatted });
                                            }}
                                            placeholder="0000-0000" aria-label="휴대폰 번호"
                                            className="flex-1 min-w-0 h-16 bg-white border-2 text-stone-900 text-center text-2xl font-black outline-none tracking-[0.08em]"
                                            style={{ borderColor: ACCENT }} />
                                    </div>

                                    <div className="bg-white border border-stone-900/10 p-4">
                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 w-5 h-5 flex-shrink-0" style={{ accentColor: ACCENT }} />
                                            <span className="text-[12px] text-stone-600 leading-relaxed">
                                                <strong className="text-stone-900">[필수]</strong> 견적 상담을 위한 개인정보 수집·이용에 동의합니다.{" "}
                                                <button type="button" onClick={() => setShowPrivacy((s) => !s)} className="underline text-stone-500">{showPrivacy ? "닫기" : "자세히"}</button>
                                            </span>
                                        </label>
                                        {showPrivacy && (
                                            <div className="mt-3 pt-3 border-t border-stone-900/5 text-[11px] text-stone-400 leading-relaxed">
                                                · 수집 항목: 연락처, 작업 정보(지역·가구·일정), 가구 사진<br />
                                                · 이용 목적: 견적 산정 및 상담 연락<br />
                                                · 보유 기간: 상담 완료 후 즉시 파기<br />
                                                · 동의를 거부할 수 있으나, 이 경우 견적 상담이 제한됩니다.
                                            </div>
                                        )}
                                    </div>

                                    <div className="border border-emerald-600/25 bg-emerald-50/60 p-4 space-y-1.5">
                                        {["번호는 견적 안내에만 사용하고 바로 파기해요", "광고·스팸 문자는 절대 보내지 않아요", "영업시간(08~21시) 기준 평균 10분 내 연락드려요"].map((t, i) => (
                                            <p key={i} className="text-[11.5px] font-semibold text-emerald-800 flex items-center gap-2"><IcCheck className="w-3 h-3 flex-shrink-0" />{t}</p>
                                        ))}
                                    </div>

                                    <a href={TEL_LINK} onClick={() => track("call_click", { where: "wizard" })}
                                        className="flex items-center justify-center gap-2.5 h-12 border-2 border-stone-900/10 bg-white text-[12.5px] font-black text-stone-600 hover:border-stone-900/30 transition-colors">
                                        <IcPhone className="w-3.5 h-3.5" /> 입력이 번거로우시면 지금 바로 통화 — {TEL_DISPLAY}
                                    </a>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="pt-3">
                        {step === 2 && (
                            <button disabled={!canStep2} onClick={next}
                                className="w-full h-14 text-white font-black text-[15.5px] disabled:opacity-40 transition-all active:scale-[0.99]"
                                style={{ backgroundColor: canStep2 ? ACCENT : "#a8a29e" }}>
                                {canStep2 ? "다음으로 →" : "가구를 선택하거나 내용을 적어주세요"}
                            </button>
                        )}
                        {step === 3 && (
                            <button disabled={!canStep3} onClick={next}
                                className="w-full h-14 text-white font-black text-[15.5px] disabled:opacity-40 transition-all active:scale-[0.99]"
                                style={{ backgroundColor: canStep3 ? ACCENT : "#a8a29e" }}>
                                {canStep3 ? "다음으로 →" : "지역을 선택해 주세요"}
                            </button>
                        )}
                        {step === 4 && (
                            <button disabled={!canSubmit} onClick={handleSubmit}
                                className="w-full h-16 text-white font-black text-[16.5px] disabled:opacity-40 transition-all active:scale-[0.99]"
                                style={{ backgroundColor: canSubmit ? ACCENT : "#a8a29e" }}>
                                {loading ? "전송 중..." : "무료 견적 신청 완료하기"}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* 이탈 방지 안내 */}
            <AnimatePresence>
                {showExitGuard && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm z-20 flex items-end md:items-center justify-center" onClick={() => setShowExitGuard(false)}>
                        <motion.div initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }} transition={{ type: "spring", stiffness: 260, damping: 26 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-[480px] bg-white p-7 pb-9 md:pb-7 md:mx-6">
                            <div className="text-center mb-6">
                                <h3 className="text-[19px] font-black text-stone-900 tracking-[-0.01em]">잠깐만요, 거의 다 하셨어요.</h3>
                                <p className="text-[13px] text-stone-500 mt-3 leading-[1.8]">
                                    지금까지 입력하신 내용은 <strong className="text-stone-800 font-semibold">자동 저장</strong>됩니다.<br />
                                    {step >= 3 ? "딱 10초면 확정 견적을 받아보실 수 있어요." : "1분만 투자하시면 무료 확정 견적이 도착해요."}
                                </p>
                            </div>
                            <button onClick={() => setShowExitGuard(false)}
                                className="w-full h-14 text-white font-black text-[15px] mb-2" style={{ backgroundColor: ACCENT }}>이어서 작성하기</button>
                            <a href={TEL_LINK} onClick={() => track("call_click", { where: "exit_guard" })}
                                className="w-full h-12 flex items-center justify-center gap-2 border-2 border-stone-900/10 text-[13px] font-black text-stone-600 mb-1">
                                <IcPhone className="w-3.5 h-3.5" /> 전화가 더 편해요 — 바로 통화
                            </a>
                            <button onClick={confirmExit}
                                className="w-full h-11 text-stone-400 text-[13px] font-semibold">저장하고 다음에 하기</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
};

/* ════════════════════════════════════════════
   13. 푸터
   ════════════════════════════════════════════ */
const Footer = () => {
    const naverMap = "https://map.naver.com/p/search/" + encodeURIComponent("경기도 화성시 효행로 1068");
    return (
        <footer className="text-stone-500 pt-14 pb-40 md:pb-14 px-6 md:px-8 border-t border-white/[0.06]" style={{ backgroundColor: "#121110" }}>
            <div className="max-w-[1140px] mx-auto md:grid md:grid-cols-[1.2fr_1fr] md:gap-16">
                <div>
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-9 h-9 border border-white/25 flex items-center justify-center text-white font-black text-[12px]">父子</div>
                        <span className="text-white text-[15px] font-black">가구전문가 아빠와 아들</span>
                    </div>
                    <p className="text-[11.5px] leading-[1.9] mb-6 max-w-sm">
                        경기남부 가구이동 · 이전설치 · 폐기 · 시스템행거 전문.
                        15년 경력의 가족 기술자가 직접 시공합니다.
                    </p>
                    <div className="flex flex-wrap gap-2.5 mb-10">
                        <a href={TEL_LINK} onClick={() => track("call_click", { where: "footer" })} className="inline-flex items-center gap-2 px-4 py-2.5 border border-white/10 text-[11px] font-bold text-stone-300 hover:bg-white/5 transition-colors"><IcPhone className="w-3 h-3" />{TEL_DISPLAY}</a>
                        <a href={KAKAO_URL} target="_blank" rel="noopener" className="inline-flex items-center gap-2 px-4 py-2.5 border border-white/10 text-[11px] font-bold text-stone-300 hover:bg-white/5 transition-colors"><IcChat className="w-3 h-3" />카톡 상담</a>
                        <a href={naverMap} target="_blank" rel="noopener" className="inline-flex items-center gap-2 px-4 py-2.5 border border-white/10 text-[11px] font-bold text-stone-300 hover:bg-white/5 transition-colors">지도 보기</a>
                    </div>
                </div>
                <div>
                    <div className="space-y-2 text-[10.5px] mb-8">
                        <p className="text-stone-400 font-medium">상호명: 가구전문가 아빠와 아들 · 대표자: 정용원</p>
                        <p>사업자등록번호: 715-03-03416</p>
                        <p>소재지: 경기도 화성시 효행로 1068, 604동 2층 G211호</p>
                        <p>대표번호: {TEL_DISPLAY} · 이메일: jung22459369@gmail.com</p>
                        <p>개인정보보호책임자: 정형진</p>
                    </div>
                    <div className="border border-white/[0.06] p-4 text-[9px] leading-[1.8] text-stone-600">
                        <p className="font-bold mb-1.5 text-stone-500">[서비스 이용 안내 및 고지]</p>
                        <p>
                            본 업체는 화물자동차 운수사업법을 준수하며, 가구의 '운송' 자체에 대한 비용을 수취하지 않습니다.
                            고객님께서 지불하시는 비용은 가구의 안전한 처리를 위한 전용 보양재 포장, 전문 기술이 필요한 분해 및 재조립,
                            실내 수평 조절 등 기술 서비스에 대한 공임입니다. 단순 이동 시 발생하는 운임은 무료로 제공되며,
                            당사는 가구 전문 케어 시공업체임을 명시합니다.
                        </p>
                    </div>
                </div>
            </div>
            <div className="max-w-[1140px] mx-auto pt-7 mt-9 border-t border-white/[0.05] text-[9px]">
                <p>© 2026 가구전문가 아빠와 아들. All rights reserved.</p>
            </div>
        </footer>
    );
};

/* ════════════════════════════════════════════
   14. 플로팅 바 (모바일) + 데스크톱 퀵버튼
   ════════════════════════════════════════════ */
const FloatingBar = () => (
    <>
        {/* 모바일 하단 바 */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[800]">
            <div className="border-t border-white/10 shadow-[0_-10px_35px_rgba(0,0,0,0.4)]" style={{ backgroundColor: "rgba(18,17,16,0.97)" }}>
                <div className="px-3 py-3 flex gap-2">
                    <a href={TEL_LINK} onClick={() => track("call_click", { where: "floating" })} aria-label={`전화 즉시 연결 ${TEL_DISPLAY}`}
                        className="w-[54px] h-[52px] border border-white/15 text-white flex items-center justify-center flex-shrink-0">
                        <IcPhone className="w-5 h-5" />
                    </a>
                    <a href={KAKAO_URL} target="_blank" rel="noopener" onClick={() => track("kakao_click", { where: "floating" })} aria-label="카카오톡 상담"
                        className="w-[54px] h-[52px] bg-[#FEE500] text-stone-900 flex items-center justify-center flex-shrink-0">
                        <IcChat className="w-5 h-5" />
                    </a>
                    <button onClick={() => openQuote()}
                        className="flex-1 h-[52px] text-white flex items-center justify-center font-black text-[14.5px]" style={{ backgroundColor: ACCENT }}>
                        1분 무료 견적 받기
                    </button>
                </div>
            </div>
        </div>

        {/* 데스크톱 우하단 퀵버튼 */}
        <div className="hidden md:flex fixed bottom-8 right-8 z-[800] flex-col items-end gap-3">
            <a href={TEL_LINK} onClick={() => track("call_click", { where: "floating_desktop" })} aria-label={`전화 즉시 연결 ${TEL_DISPLAY}`}
                className="group flex items-center gap-3.5 bg-white border border-stone-900/10 pl-4 pr-6 py-3.5 shadow-[0_15px_40px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 transition-transform">
                <span className="w-10 h-10 flex items-center justify-center text-white" style={{ backgroundColor: INK }}><IcPhone className="w-4 h-4" /></span>
                <span className="text-left leading-none">
                    <span className="block text-[9.5px] font-bold text-stone-400 mb-1.5">전화 즉시 연결</span>
                    <span className="block text-[15px] font-black text-stone-900 tracking-[0.04em]">{TEL_DISPLAY}</span>
                </span>
            </a>
            <button onClick={() => openQuote()}
                className="flex items-center gap-2.5 text-white px-7 py-4 font-black text-[14px] shadow-[0_15px_40px_rgba(196,86,15,0.4)] hover:-translate-y-0.5 hover:brightness-110 transition-all"
                style={{ backgroundColor: ACCENT }}>
                1분 무료 견적
            </button>
        </div>
    </>
);

/* ════════════════════════════════════════════
   App
   ════════════════════════════════════════════ */
const App = () => {
    // ?type= 딥링크: 이전 링크 호환 (moving/disposal/hanger)
    useEffect(() => {
        const type = new URLSearchParams(window.location.search).get("type");
        const map = { moving: "가구이동 (방 ↔ 방)", disposal: "가구폐기", hanger: "시스템행거" };
        if (type && map[type]) {
            const t = setTimeout(() => openQuote(map[type]), 400);
            return () => clearTimeout(t);
        }
    }, []);

    return (
        <div style={{ backgroundColor: INK }} className="min-h-screen antialiased">
            <Header />
            <Hero />
            <LiveTicker />
            <ServiceSection />
            <PromiseSection />
            <StorySection />
            <PortfolioSection />
            <ReviewSection />
            <TrustSection />
            <CallBand />
            <FAQSection />
            <QuoteWizard />
            <Footer />
            <FloatingBar />
        </div>
    );
};

const root = createRoot(document.getElementById("root"));
root.render(
    <MotionConfig reducedMotion="user">
        <App />
    </MotionConfig>
);
