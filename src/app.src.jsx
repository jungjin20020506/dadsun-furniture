import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { motion, animate, useInView, useScroll, useTransform, AnimatePresence, MotionConfig } from "framer-motion";
import confetti from "canvas-confetti";

/* ============================================================
   가구전문가 아빠와 아들 — Premium Editorial v5
   · 카피라이팅 전면 강화, 모바일 풀블리드 히어로
   · 산세리프 헤비 헤드라인 + 세리프 악센트(숫자·인용·마키)
   · 전화 즉시 연결 전면 배치, 4단계 견적 위저드(자동저장·이탈방지)
   ============================================================ */

const KAKAO_URL = "https://open.kakao.com/o/spSfhAbi";
const TEL_LINK = "tel:01022459369";
const TEL_DISPLAY = "010-2245-9369";

// 디자인 토큰
const INK = "#141210";       // 웜 블랙
const PAPER = "#F5F3EF";     // 웜 페이퍼
const ACCENT = "#C75B12";    // 번트 시에나 (CTA 전용)
const GOLD = "#C89B6D";      // 다크 섹션 포인트

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
        ? { open: true, text: "지금 상담 가능", sub: "평균 10분 내 회신" }
        : { open: false, text: "상담 마감", sub: "남겨주시면 아침에 가장 먼저 연락드립니다" };
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

/* ─── 스크롤 리빌 헬퍼 ─── */
const EASE = [0.22, 1, 0.36, 1];
const Reveal = ({ children, delay = 0, y = 44, className }) => (
    <motion.div initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-70px" }}
        transition={{ duration: 0.85, delay, ease: EASE }} className={className}>
        {children}
    </motion.div>
);
const RevealImg = ({ src, alt, className = "", imgClass = "", eager = false }) => (
    <div className={`overflow-hidden ${className}`}>
        <motion.img src={src} alt={alt} loading={eager ? "eager" : "lazy"}
            initial={{ scale: 1.18, opacity: 0.4 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 1.25, ease: EASE }} className={`w-full h-full object-cover ${imgClass}`} />
    </div>
);

// ─── 숫자 카운터 ───
const Counter = ({ target, duration = 1.6, suffix = "", decimals = 0 }) => {
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

// ─── 에디토리얼 섹션 라벨 ───
const Eyebrow = ({ no, en, dark = false }) => (
    <div className="flex items-center gap-4 mb-6 md:mb-7">
        <span className={`font-display text-[11px] font-bold tracking-[0.28em] uppercase ${dark ? "text-stone-500" : "text-stone-400"}`}>( {no} )</span>
        <span className={`text-[10.5px] font-bold tracking-[0.32em] uppercase ${dark ? "text-[#C89B6D]" : "text-[#96876F]"}`}>{en}</span>
        <span className={`h-px flex-1 max-w-[70px] ${dark ? "bg-white/15" : "bg-stone-900/15"}`}></span>
    </div>
);

/* ════════════════════════════════════════════
   1. 헤더
   ════════════════════════════════════════════ */
const Header = () => (
    <header className="sticky top-0 z-[500] backdrop-blur-xl border-b border-white/[0.08]" style={{ backgroundColor: "rgba(20,18,16,0.9)" }}>
        <div className="max-w-[1200px] mx-auto flex items-center justify-between px-4 md:px-10 h-14 md:h-[72px]">
            <a href="#top" className="flex items-center gap-2.5 min-w-0" aria-label="아빠와 아들 홈">
                <div className="w-8 h-8 border border-white/30 flex items-center justify-center text-white font-black text-[11px] tracking-tight flex-shrink-0">父子</div>
                <div className="leading-none min-w-0">
                    <div className="font-black text-[14px] md:text-[16px] text-white tracking-tight whitespace-nowrap">아빠와 아들</div>
                    <div className="text-[7.5px] md:text-[9px] font-bold text-stone-500 mt-1 tracking-[0.24em] uppercase whitespace-nowrap">Furniture Care Studio</div>
                </div>
            </a>
            <nav className="hidden md:flex items-center gap-9 text-[13px] font-semibold text-stone-400" aria-label="주요 메뉴">
                <a href="#services" className="hover:text-white transition-colors">Services</a>
                <a href="#portfolio" className="hover:text-white transition-colors">Works</a>
                <a href="#reviews" className="hover:text-white transition-colors">Reviews</a>
                <a href="#story" className="hover:text-white transition-colors">Story</a>
            </nav>
            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                <a href={TEL_LINK} onClick={() => track("call_click", { where: "header" })}
                    className="hidden lg:flex items-center gap-2.5 text-stone-300 hover:text-white font-bold text-[14px] tracking-[0.06em] transition-colors" aria-label={`전화 즉시 연결 ${TEL_DISPLAY}`}>
                    <IcPhone className="w-[15px] h-[15px]" />{TEL_DISPLAY}
                </a>
                <a href={TEL_LINK} onClick={() => track("call_click", { where: "header" })}
                    className="lg:hidden flex items-center justify-center w-9 h-9 border border-white/20 text-white active:scale-95 transition-transform" aria-label="전화 즉시 연결">
                    <IcPhone className="w-[15px] h-[15px]" />
                </a>
                <button onClick={() => openQuote()}
                    className="h-9 md:h-11 px-3.5 md:px-6 text-[12px] md:text-[13px] font-black text-white tracking-wide whitespace-nowrap active:scale-95 transition-all hover:brightness-110"
                    style={{ backgroundColor: ACCENT }}>
                    <span className="md:hidden">견적</span><span className="hidden md:inline">견적 문의</span>
                </button>
            </div>
        </div>
    </header>
);

/* ════════════════════════════════════════════
   2. 히어로 — 모바일 풀블리드 / 데스크톱 스플릿
   ════════════════════════════════════════════ */
const Hero = () => {
    const status = getBizStatus();
    const { scrollY } = useScroll();
    const imgY = useTransform(scrollY, [0, 700], [0, 70]);
    return (
        <section id="top" className="relative overflow-hidden" style={{ backgroundColor: INK }}>
            {/* 모바일: 대표 사진 상단 배경 → 아래로 잉크 페이드 */}
            <div className="absolute inset-x-0 top-0 h-[58%] md:hidden" aria-hidden="true">
                <img src="father.jpg" loading="eager" fetchpriority="high" className="w-full h-full object-cover object-[center_18%]" alt="" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(20,18,16,0.62) 0%, rgba(20,18,16,0.12) 26%, rgba(20,18,16,0.45) 58%, rgba(20,18,16,0.92) 82%, #141210 100%)" }}></div>
            </div>
            {/* 데스크톱: 워터마크 */}
            <div className="absolute inset-0 pointer-events-none select-none hidden md:block" aria-hidden="true">
                <div className="absolute -bottom-6 -left-4 font-display font-black text-[220px] leading-none tracking-tighter text-transparent"
                    style={{ WebkitTextStroke: "1px rgba(255,255,255,0.05)" }}>
                    FATHER&nbsp;&amp;&nbsp;SON
                </div>
            </div>

            <div className="max-w-[1200px] mx-auto px-6 md:px-10 relative z-10 md:grid md:grid-cols-[1.05fr_0.95fr] md:gap-16 md:items-center md:pt-24 md:pb-28">
                {/* 카피 */}
                <div className="min-h-[86svh] md:min-h-0 flex flex-col justify-end md:justify-start pt-12 pb-12 md:py-0">
                    <motion.div initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE }}>
                        <div className="flex items-center gap-3.5 mb-6 md:mb-8">
                            <span className="text-[10px] md:text-[10.5px] font-bold tracking-[0.34em] uppercase" style={{ color: GOLD }}>아버지와 아들이 함께하는 가구 케어</span>
                            <span className="h-px w-10 md:w-14 bg-white/25"></span>
                        </div>
                        <h1 className="text-[38px] md:text-[58px] font-black text-white leading-[1.18] tracking-[-0.03em]">
                            무거운 가구도,<br />
                            무거운 걱정도,<br />
                            <span className="font-display italic font-bold" style={{ color: GOLD }}>저희가 옮깁니다.</span>
                        </h1>
                    </motion.div>

                    <motion.p initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.14, ease: EASE }}
                        className="mt-6 md:mt-8 text-stone-300 md:text-stone-400 text-[14.5px] md:text-[16px] leading-[1.85] max-w-[420px]">
                        용역 알바 없이, <strong className="text-white font-semibold">15년 경력의 아버지와 아들</strong>이 직접 갑니다.
                        사진 한 장 보내주세요 — <strong className="text-white font-semibold">10분 안에, 추가금 없는 확정 견적</strong>으로 답합니다.
                    </motion.p>

                    {/* 신뢰 지표 미니 라인 */}
                    <motion.div initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.24, ease: EASE }}
                        className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-6 md:mt-8 text-[11.5px] font-bold text-stone-300">
                        <span>별점 <strong className="font-display text-[13px]" style={{ color: GOLD }}>4.9</strong></span>
                        <span className="w-px h-3 bg-white/25"></span>
                        <span>누적 <strong className="font-display text-[13px]" style={{ color: GOLD }}>8,500건</strong></span>
                        <span className="w-px h-3 bg-white/25"></span>
                        <span>파손 시 <strong style={{ color: GOLD }}>전액 보상</strong></span>
                        <span className="w-px h-3 bg-white/25"></span>
                        <span>현장 추가금 <strong style={{ color: GOLD }}>0원</strong></span>
                    </motion.div>

                    {/* CTA */}
                    <motion.div initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.34, ease: EASE }}
                        className="mt-8 md:mt-10 space-y-3 max-w-[420px]">
                        <button onClick={() => openQuote()}
                            className="group w-full h-[58px] text-white font-black text-[15.5px] tracking-wide flex items-center justify-center gap-3 transition-all hover:brightness-110 shadow-[0_18px_45px_-12px_rgba(199,91,18,0.7)]"
                            style={{ backgroundColor: ACCENT }}>
                            <IcCamera className="w-[18px] h-[18px]" /> 사진 1장으로 견적 받기 — 1분
                            <IcArrow className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <div className="grid grid-cols-2 gap-3">
                            <a href={TEL_LINK} onClick={() => track("call_click", { where: "hero" })}
                                className="h-[52px] border border-white/30 bg-black/20 backdrop-blur-sm text-white flex flex-col items-center justify-center hover:bg-white/[0.08] transition-colors" aria-label={`전화 즉시 연결 ${TEL_DISPLAY}`}>
                                <span className="flex items-center gap-1.5 text-[9.5px] font-bold text-stone-400 tracking-[0.15em] uppercase mb-1"><IcPhone className="w-3 h-3" /> 지금 바로 통화</span>
                                <span className="text-[13.5px] font-black tracking-[0.08em]">{TEL_DISPLAY}</span>
                            </a>
                            <a href={KAKAO_URL} target="_blank" rel="noopener" onClick={() => track("kakao_click", { where: "hero" })}
                                className="h-[52px] bg-[#FEE500] text-stone-900 flex items-center justify-center gap-2 font-black text-[13.5px] hover:brightness-105 transition-all">
                                <IcChat className="w-4 h-4" /> 카톡 상담
                            </a>
                        </div>
                        {/* 상담 상태 — 모바일은 하단 고정 바에 이미 표시되므로 데스크톱에서만 */}
                        <div className="hidden md:flex items-center gap-2.5 pt-1.5">
                            <span className="relative flex h-1.5 w-1.5">
                                {status.open && <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${status.open ? "bg-emerald-400" : "bg-stone-500"}`}></span>
                            </span>
                            <span className="text-[11.5px] font-semibold text-stone-400 tracking-wide">{status.text} · {status.sub}</span>
                        </div>
                    </motion.div>
                </div>

                {/* 데스크톱: 대표 포트레이트 (패럴랙스) */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: 0.2 }} className="hidden md:block relative">
                    <motion.div style={{ y: imgY }} className="relative">
                        <div className="overflow-hidden">
                            <motion.img src="father.jpg" alt="가구전문가 아빠와 아들 정용원 대표" loading="eager"
                                initial={{ scale: 1.15 }} animate={{ scale: 1 }} transition={{ duration: 1.6, ease: EASE }}
                                className="w-full aspect-[4/5] object-cover object-[center_18%]" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#141210] via-transparent to-transparent opacity-80"></div>
                        <div className="absolute bottom-0 left-0 right-0 p-8 flex items-end justify-between">
                            <div>
                                <div className="text-[9.5px] font-bold tracking-[0.35em] uppercase mb-2.5" style={{ color: GOLD }}>Master Craftsman</div>
                                <div className="font-display text-white text-[30px] font-black tracking-tight leading-none">정용원 <span className="text-[13px] font-medium text-stone-400 ml-1">대표 · 수석 기술자</span></div>
                                <div className="text-stone-400 text-[12px] font-medium mt-2.5 tracking-wide">15년 무사고 시공 — 누적 8,500건</div>
                            </div>
                        </div>
                        <div className="absolute top-5 right-5 border border-white/25 px-3.5 py-2 text-right backdrop-blur-sm bg-black/20">
                            <div className="font-display text-white text-[20px] font-black leading-none">4.9<span className="text-[11px] text-stone-400 font-medium">/5.0</span></div>
                            <div className="text-[8.5px] text-stone-400 font-bold tracking-[0.2em] uppercase mt-1">Rating</div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>

            {/* 하단 지표 스트립 */}
            <div className="border-t border-white/[0.08] relative z-10" style={{ backgroundColor: INK }}>
                <div className="max-w-[1200px] mx-auto px-6 md:px-10 grid grid-cols-2 md:grid-cols-4">
                    {[
                        { value: 15, suffix: "년+", label: "아버지의 현장 경력" },
                        { value: 8500, suffix: "+", label: "책임지고 옮긴 살림" },
                        { value: 4.9, suffix: "", decimals: 1, label: "고객이 남긴 별점" },
                        { value: 92, suffix: "%", label: "다시 찾는 고객" }
                    ].map((s, i) => (
                        <div key={i} className={`py-7 md:py-10 px-1 md:px-6 border-white/[0.08] ${i % 2 === 0 ? "border-r" : ""} md:border-r ${i === 3 ? "md:border-r-0" : ""} ${i < 2 ? "border-b md:border-b-0" : ""} text-center md:text-left`}>
                            <div className="font-display text-[28px] md:text-[40px] font-black leading-none tracking-tight" style={{ color: GOLD }}>
                                <Counter target={s.value} suffix={s.suffix} decimals={s.decimals || 0} />
                            </div>
                            <div className="text-[10.5px] md:text-[12px] font-bold text-stone-400 mt-2.5 tracking-wide">{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

/* ════════════════════════════════════════════
   3. 대형 텍스트 마키 + 실시간 접수
   ════════════════════════════════════════════ */
const MarqueeBand = () => {
    const words = ["가구이동", "이전설치", "가구폐기", "시스템행거"];
    const row = [...words, ...words, ...words];
    return (
        <div className="py-8 md:py-14 overflow-hidden border-b border-stone-900/10" style={{ backgroundColor: PAPER }}>
            <motion.div className="flex whitespace-nowrap items-baseline" animate={{ x: ["0%", "-33.333%"] }} transition={{ repeat: Infinity, duration: 30, ease: "linear" }}>
                {row.map((w, i) => (
                    <React.Fragment key={i}>
                        <span className={`font-display font-black text-[40px] md:text-[76px] leading-none tracking-tight px-5 ${i % 2 === 0 ? "text-[#141210]" : "text-transparent"}`}
                            style={i % 2 === 0 ? {} : { WebkitTextStroke: "1.5px rgba(20,18,16,0.35)" }}>
                            {w}
                        </span>
                        <span className="text-[16px] md:text-[26px] text-stone-300 px-1">●</span>
                    </React.Fragment>
                ))}
            </motion.div>
        </div>
    );
};

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
        const t = setInterval(() => setIdx((i) => (i + 1) % feed.length), 3200);
        return () => clearInterval(t);
    }, []);
    return (
        <div className="border-b border-stone-900/10" style={{ backgroundColor: PAPER }}>
            <div className="max-w-[1200px] mx-auto px-6 md:px-10 py-3.5 flex items-center gap-4">
                <span className="flex-shrink-0 inline-flex items-center gap-2 text-[9.5px] font-black text-stone-500 tracking-[0.28em] uppercase">
                    <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                    실시간 접수
                </span>
                <div className="relative h-5 flex-1 overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.div key={idx} initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -16, opacity: 0 }} transition={{ duration: 0.4, ease: EASE }}
                            className="absolute inset-0 flex items-center text-[12.5px] text-stone-600 font-medium truncate">
                            {feed[idx].area} — {feed[idx].job}<span className="text-stone-400 ml-2 text-[11px]">{feed[idx].when}</span>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

/* ════════════════════════════════════════════
   4. 서비스 — 에디토리얼 넘버드 리스트
   ════════════════════════════════════════════ */
const ServiceSection = () => {
    const services = [
        {
            img: "A7.jpg", no: "01",
            title: "방 ↔ 방 가구이동", en: "Room to Room", price: "3만원부터", formValue: "가구이동 (방 ↔ 방)",
            desc: "“장롱 좀 안방에서 작은방으로…” 가장 많이 받는 부탁입니다. 분해부터 재조립, 수평까지 — 벽지 스침 하나 없이 끝냅니다.",
            points: ["분해 — 이동 — 재조립 — 수평 조절", "바닥·벽 전용 보양재 시공"]
        },
        {
            img: "A8.jpg", no: "02",
            title: "집 ↔ 집 이전설치", en: "Home to Home", price: "5만원부터", formValue: "가구이동 (집 ↔ 집)",
            desc: "이사업체를 부르기엔 크고, 용달에 맡기기엔 불안한 가구 몇 점. 랩핑 포장해서 새집 원하는 자리까지 놓아드립니다.",
            points: ["전면 랩핑 포장 + 전용 차량", "새집 배치·설치까지 완료"]
        },
        {
            img: "A6.jpg", no: "03",
            title: "가구 폐기 · 수거", en: "Disposal", price: "2만원부터", formValue: "가구폐기",
            desc: "장정 둘이서도 못 드는 돌침대 — 저희에겐 한 시간 일입니다. 분해, 반출, 폐기 신고까지 흔적 없이 정리합니다.",
            points: ["돌침대·장롱 전문 분해 반출", "폐기 신고 · 뒷정리 포함"]
        },
        {
            img: "sh.jpg", no: "04",
            title: "시스템행거 설치", en: "System Hanger", price: "5만원부터", formValue: "시스템행거",
            desc: "옷 무게에 무너지지 않는 드레스룸. 레이저 수평으로 잡고, 1mm의 기울어짐도 남기지 않습니다.",
            points: ["레이저 수평 정밀 시공", "이전 재설치 · 부분 수리 가능"]
        }
    ];
    return (
        <section className="py-16 md:py-28" id="services" style={{ backgroundColor: PAPER }}>
            <div className="max-w-[1200px] mx-auto px-6 md:px-10">
                <Reveal>
                    <Eyebrow no="01" en="Services" />
                    <h2 className="text-[30px] md:text-[50px] font-black text-[#141210] leading-[1.18] tracking-[-0.03em]">
                        무엇이든 옮기고,<br />무엇이든 책임집니다
                    </h2>
                    <p className="mt-4 md:mt-5 text-stone-500 text-[14px] md:text-[15px]">이 네 가지를 가장 잘합니다. 출장비도, 상담도 무료입니다.</p>
                </Reveal>

                <div className="mt-10 md:mt-16">
                    {services.map((s, i) => (
                        <Reveal key={i} delay={0.05}>
                            <div className={`group grid md:grid-cols-[110px_1fr_1fr] gap-5 md:gap-10 py-9 md:py-14 border-t border-stone-900/15 ${i === services.length - 1 ? "border-b" : ""} items-start`}>
                                <div className="flex items-center justify-between md:block">
                                    <span className="font-display text-[15px] md:text-[17px] font-black text-stone-400 tracking-wide">( {s.no} )</span>
                                    <span className="md:hidden text-[9.5px] font-bold tracking-[0.3em] uppercase text-[#96876F]">{s.en}</span>
                                </div>
                                <div className="order-3 md:order-2">
                                    <div className="hidden md:block text-[9.5px] font-bold tracking-[0.3em] uppercase text-[#96876F] mb-3">{s.en}</div>
                                    <div className="flex items-baseline gap-3 flex-wrap">
                                        <h3 className="text-[24px] md:text-[32px] font-black text-[#141210] tracking-[-0.02em] leading-tight">{s.title}</h3>
                                        <span className="text-[13.5px] font-black" style={{ color: ACCENT }}>{s.price}</span>
                                    </div>
                                    <p className="mt-3.5 text-[13.5px] md:text-[14.5px] text-stone-500 leading-[1.85] max-w-sm">{s.desc}</p>
                                    <ul className="mt-4 space-y-1.5">
                                        {s.points.map((p, j) => (
                                            <li key={j} className="text-[12px] md:text-[12.5px] font-semibold text-stone-600 flex items-center gap-2.5">
                                                <IcCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />{p}
                                            </li>
                                        ))}
                                    </ul>
                                    <button onClick={() => openQuote(s.formValue)}
                                        className="mt-6 inline-flex items-center gap-2.5 text-[13px] font-black text-[#141210] border-b-2 border-[#141210] pb-1 hover:gap-4 transition-all"
                                        aria-label={`${s.title} 견적 받아보기`}>
                                        이 작업 견적 받아보기 <IcArrow className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <div className="order-2 md:order-3">
                                    <RevealImg src={s.img} alt={s.title + " 시공 사진"} className="aspect-[16/10] md:aspect-[4/3]" imgClass="group-hover:scale-105 transition-transform duration-700" />
                                </div>
                            </div>
                        </Reveal>
                    ))}
                </div>
                <p className="mt-7 text-[11.5px] text-stone-400">※ 표시 가격은 최소 기준입니다. 사진 확인 후 <strong className="text-stone-600 font-semibold">그대로 청구되는 확정가</strong>를 안내드립니다.</p>
            </div>
        </section>
    );
};

/* ════════════════════════════════════════════
   5. 철학 + 비교
   ════════════════════════════════════════════ */
const WhySection = () => {
    const compareData = [
        { label: "작업하는 사람", us: "아버지와 아들이 직접", others: "그날 모집한 용역 알바" },
        { label: "보양 작업", us: "바닥·벽 전용 보양재", others: "보양 없이 바로 작업" },
        { label: "가구 수평", us: "레이저 장비로 무료 조절", others: "옮겨만 두고 종료" },
        { label: "현장 추가금", us: "0원 · 사전 확정 견적", others: "현장에서 흥정" },
        { label: "파손 사고 시", us: "전액 책임보상", others: "연락 두절" }
    ];
    return (
        <section className="bg-white py-16 md:py-28">
            <div className="max-w-[1200px] mx-auto px-6 md:px-10 md:grid md:grid-cols-[1fr_1.2fr] md:gap-20 md:items-start">
                <Reveal>
                    <Eyebrow no="02" en="Philosophy" />
                    <h2 className="text-[30px] md:text-[44px] font-black text-[#141210] leading-[1.22] tracking-[-0.03em]">
                        싼 곳은 많습니다.<br />
                        <span className="font-display italic font-bold text-stone-400">믿을 곳이</span><br />없을 뿐이죠.
                    </h2>
                    <p className="mt-6 text-stone-500 text-[14px] md:text-[15px] leading-[1.9] max-w-sm">
                        그래서 저희는 가격으로 경쟁하지 않습니다.
                        <strong className="text-stone-800 font-semibold"> 기록으로 증명합니다.</strong> 5년째 재의뢰율 92% — 한 번 맡긴 분이 다시 찾는 데에는 이유가 있습니다.
                    </p>
                </Reveal>
                <Reveal delay={0.12} className="mt-10 md:mt-0">
                    <div className="border border-stone-900/15">
                        <div className="grid grid-cols-12 text-[10.5px] md:text-[11.5px] font-black border-b border-stone-900/15">
                            <div className="col-span-3 py-4 pl-4 md:pl-6 text-stone-400 tracking-wide">항목</div>
                            <div className="col-span-5 py-4 text-center text-white tracking-[0.1em]" style={{ backgroundColor: INK }}>아빠와 아들</div>
                            <div className="col-span-4 py-4 text-center text-stone-400 tracking-wide">일반 용역</div>
                        </div>
                        {compareData.map((item, idx) => (
                            <div key={idx} className="grid grid-cols-12 items-stretch border-b border-stone-900/10 last:border-0">
                                <div className="col-span-3 pl-4 md:pl-6 text-[10.5px] md:text-[12px] font-semibold text-stone-500 flex items-center py-4 md:py-5">{item.label}</div>
                                <div className="col-span-5 py-4 md:py-5 px-2 text-[11.5px] md:text-[13px] font-black text-[#141210] text-center flex items-center justify-center border-x border-stone-900/10" style={{ backgroundColor: PAPER }}>{item.us}</div>
                                <div className="col-span-4 py-4 md:py-5 px-2 text-[10.5px] md:text-[12px] text-stone-400 text-center flex items-center justify-center">{item.others}</div>
                            </div>
                        ))}
                    </div>
                </Reveal>
            </div>
        </section>
    );
};

/* ════════════════════════════════════════════
   6. 브랜드 스토리
   ════════════════════════════════════════════ */
const StorySection = () => (
    <section className="py-16 md:py-28 relative overflow-hidden" id="story" style={{ backgroundColor: INK }}>
        <div className="absolute top-10 right-0 font-display font-black text-[100px] md:text-[180px] leading-none tracking-tighter text-transparent select-none pointer-events-none" aria-hidden="true"
            style={{ WebkitTextStroke: "1px rgba(255,255,255,0.045)" }}>
            STORY
        </div>
        <div className="max-w-[1200px] mx-auto px-6 md:px-10 relative z-10 md:grid md:grid-cols-2 md:gap-20 md:items-center">
            <div>
                <Reveal>
                    <Eyebrow no="03" en="Our Story" dark />
                    <h2 className="text-[30px] md:text-[42px] font-black text-white leading-[1.24] tracking-[-0.03em]">
                        간판보다 무거운 것을<br />걸고 일합니다.<br />
                        <span className="font-display italic font-bold" style={{ color: GOLD }}>가족의 이름입니다.</span>
                    </h2>
                </Reveal>
                <Reveal delay={0.1}>
                    <div className="mt-8 text-stone-400 text-[14px] md:text-[15.5px] leading-[2] space-y-5 max-w-md">
                        <p>
                            아버지는 15년째 남의 집 가구를 제 것처럼 만져온 기술자입니다.
                            아들인 저는 그 옆에서 하나를 배웠습니다. <strong className="text-white font-semibold">가구가 아니라, 그 집의 살림을 옮기는 일</strong>이라는 것.
                        </p>
                        <p>
                            그래서 하청도, 일용직도 쓰지 않습니다.
                            견적서에 적은 금액 그대로 받고, 바닥에 보양재부터 깔고, 다 옮긴 뒤에는 수평계를 올려봅니다.
                            저희에겐 <strong className="text-white font-semibold">오늘의 현장 하나가 15년의 평판 전부</strong>이기 때문입니다.
                        </p>
                    </div>
                    <div className="mt-9 border-l pl-6" style={{ borderColor: "rgba(200,155,109,0.6)" }}>
                        <p className="font-display text-[15.5px] md:text-[17px] font-bold leading-[1.8] italic" style={{ color: GOLD }}>"제 아버지가 하는 일이라,<br />제가 제일 잘 압니다. 믿고 맡기셔도 됩니다."</p>
                        <p className="text-stone-500 text-[11px] font-semibold mt-4 tracking-[0.15em]">— 아들 정형진</p>
                    </div>
                </Reveal>
            </div>
            <div className="mt-12 md:mt-0">
                <div className="grid grid-cols-3 gap-3 md:gap-5">
                    {[
                        { img: "father.jpg", role: "아빠", name: "정용원", desc: "대표 · 수석 기술자" },
                        { img: "son.jpg", role: "아들", name: "정형진", desc: "운영 총괄 실장" },
                        { img: "uncle.jpg", role: "삼촌", name: "김승욱", desc: "현장 관리 실장" }
                    ].map((m, i) => (
                        <Reveal key={i} delay={i * 0.12} className={i === 1 ? "md:translate-y-8" : ""}>
                            <div className="overflow-hidden mb-3">
                                <motion.img src={m.img} loading="lazy" alt={`${m.role} ${m.name} ${m.desc}`}
                                    initial={{ scale: 1.15 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ duration: 1.2, ease: EASE }}
                                    className="w-full aspect-[3/4] object-cover object-top" />
                            </div>
                            <div className="text-white text-[13px] md:text-[15px] font-black"><span className="text-[10px] font-bold mr-1.5" style={{ color: GOLD }}>{m.role}</span>{m.name}</div>
                            <div className="text-stone-500 text-[10px] md:text-[11px] font-medium mt-1 tracking-wide">{m.desc}</div>
                        </Reveal>
                    ))}
                </div>
                <Reveal delay={0.2}>
                    <div className="mt-8 md:mt-14 grid grid-cols-3 border border-white/10 divide-x divide-white/10">
                        {[
                            { t: "하청 · 용역", s: "0명" },
                            { t: "가족 기술자", s: "3명" },
                            { t: "책임 소재", s: "100%" }
                        ].map((x, i) => (
                            <div key={i} className="py-5 md:py-6 text-center">
                                <div className="font-display text-white text-[20px] md:text-[26px] font-black">{x.s}</div>
                                <div className="text-[9.5px] md:text-[10.5px] font-bold text-stone-500 mt-1.5 tracking-[0.15em]">{x.t}</div>
                            </div>
                        ))}
                    </div>
                </Reveal>
            </div>
        </div>
    </section>
);

/* ════════════════════════════════════════════
   7. 시공 사례
   ════════════════════════════════════════════ */
const PortfolioSection = () => {
    const [tab, setTab] = useState("all");
    const works = [
        { img: "A8.jpg", cat: "move", label: "쇼파 전면 랩핑 보양", area: "수원 광교" },
        { img: "A7.jpg", cat: "move", label: "원목 침대 분해·이동", area: "화성 동탄" },
        { img: "A2.jpg", cat: "install", label: "슬라이딩 장롱 이전설치", area: "용인 수지" },
        { img: "stone2.jpg", cat: "disposal", label: "돌침대 분해·폐기", area: "오산 세교" },
        { img: "A1.jpg", cat: "install", label: "아이방 침대 재조립", area: "평택 고덕" },
        { img: "sh4.jpg", cat: "hanger", label: "ㄱ자 시스템행거 시공", area: "수원 영통" },
        { img: "A9.jpg", cat: "move", label: "장식장 랩핑 이동", area: "화성 병점" },
        { img: "A4.jpg", cat: "install", label: "붙박이장 조립·설치", area: "안산 단원" },
        { img: "sh k.jpg", cat: "hanger", label: "드레스룸 행거+서랍 구성", area: "동탄2" },
        { img: "bedframe.jpg", cat: "move", label: "침대 프레임 재조립", area: "용인 기흥" },
        { img: "clo.jpg", cat: "install", label: "붙박이장 마감 실측", area: "수원 장안" },
        { img: "A5.jpg", cat: "move", label: "원목 침대 수평 조립", area: "성남 분당" }
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
        <section className="py-16 md:py-28" id="portfolio" style={{ backgroundColor: PAPER }}>
            <div className="max-w-[1200px] mx-auto px-6 md:px-10">
                <div className="md:flex md:items-end md:justify-between md:gap-10">
                    <Reveal>
                        <Eyebrow no="04" en="Selected Works" />
                        <h2 className="text-[30px] md:text-[50px] font-black text-[#141210] leading-[1.18] tracking-[-0.03em]">
                            연출 없는 현장,<br />보정 없는 기록
                        </h2>
                        <p className="mt-4 text-stone-500 text-[14px] md:text-[15px]">잘 나온 사진이 아니라, 어제 일한 사진입니다.</p>
                    </Reveal>
                    <Reveal delay={0.1}>
                        <div className="flex gap-0 overflow-x-auto no-scrollbar mt-7 md:mt-0 border-b border-stone-900/15">
                            {tabs.map((t) => (
                                <button key={t.id} onClick={() => setTab(t.id)}
                                    className={`flex-shrink-0 px-4 md:px-5 pb-3 text-[12.5px] font-bold transition-colors relative ${tab === t.id ? "text-[#141210]" : "text-stone-400 hover:text-stone-600"}`}>
                                    {t.label}
                                    {tab === t.id && <motion.span layoutId="ptab" className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#141210]" />}
                                </button>
                            ))}
                        </div>
                    </Reveal>
                </div>

                <div className="mt-8 md:mt-14 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
                    <AnimatePresence mode="popLayout">
                        {filtered.map((w, i) => (
                            <motion.figure key={w.img} layout initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
                                transition={{ duration: 0.55, delay: (i % 4) * 0.05, ease: EASE }}
                                className="group relative overflow-hidden bg-stone-200 cursor-default">
                                <div className="aspect-[4/5] overflow-hidden">
                                    <img src={w.img} loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-[900ms]" alt={`${w.label} — ${w.area} 시공 사례`} />
                                </div>
                                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pt-12 pb-3.5 px-3.5 md:px-4 md:pb-4">
                                    <div className="text-white text-[11.5px] md:text-[13px] font-bold leading-tight">{w.label}</div>
                                    <div className="text-stone-300 text-[9.5px] md:text-[10.5px] font-medium mt-1 tracking-[0.08em]">{w.area}</div>
                                </figcaption>
                            </motion.figure>
                        ))}
                    </AnimatePresence>
                </div>
                <Reveal><p className="mt-7 text-center text-[11.5px] text-stone-400 tracking-wide">모든 현장은 <strong className="text-stone-600 font-semibold">정용원 대표가 직접</strong> 시공하고, 직접 기록합니다.</p></Reveal>
            </div>
        </section>
    );
};

/* ════════════════════════════════════════════
   8. 후기
   ════════════════════════════════════════════ */
const ReviewSection = () => {
    const captures = [
        { url: "1.jpg", tag: "당근 후기" }, { url: "2.jpg", tag: "당근 후기" },
        { url: "3.jpg", tag: "당근 후기" }, { url: "4.jpg", tag: "당근 후기" },
        { url: "5.jpg", tag: "당근 후기" }, { url: "6.jpg", tag: "숨고 후기" },
        { url: "7.jpg", tag: "숨고 후기" }, { url: "8.jpg", tag: "숨고 후기" }
    ];
    const doubled = [...captures, ...captures];
    const quotes = [
        { text: "장롱 이전 작업을 부탁드렸는데 시간 약속을 정확히 지켜주시고, 포장부터 설치까지 깔끔하게 마무리해 주셨어요.", who: "목동 — 장롱 이전" },
        { text: "아버님이 정말 베테랑이세요. 돌침대 폐기 다른 데선 다 어렵다고 했는데 두 분이 오셔서 한 시간 만에 끝내셨어요.", who: "동탄 — 돌침대 폐기" },
        { text: "부자가 함께 오셔서 손발이 척척. 바닥 보양까지 해주시고 추가비용 얘기가 한 번도 안 나온 게 제일 좋았습니다.", who: "수원 영통 — 침대 이동" }
    ];
    return (
        <section className="bg-white py-16 md:py-28 overflow-hidden" id="reviews">
            <div className="max-w-[1200px] mx-auto px-6 md:px-10">
                <Reveal>
                    <Eyebrow no="05" en="Reviews" />
                    <h2 className="text-[30px] md:text-[50px] font-black text-[#141210] leading-[1.18] tracking-[-0.03em]">
                        자랑은 여기까지.<br />나머지는 고객님이 쓰셨습니다
                    </h2>
                </Reveal>

                <Reveal delay={0.1}>
                    <div className="mt-9 md:mt-12 grid grid-cols-2 md:max-w-xl border border-stone-900/15 divide-x divide-stone-900/15">
                        {[
                            { pf: "당근마켓", stat: "5.0", sub: "동네 단골 380+ · 후기 전원 5점" },
                            { pf: "숨고", stat: "5.0", sub: "리뷰 185+ · 본인인증 고수" }
                        ].map((p, i) => (
                            <div key={i} className="py-5 md:py-7 px-4 md:px-7">
                                <div className="text-[10px] font-bold tracking-[0.25em] uppercase text-stone-400 mb-2.5">{p.pf}</div>
                                <div className="font-display text-[28px] md:text-[36px] font-black text-[#141210] leading-none">{p.stat}<span className="text-amber-500 text-[13px] md:text-[17px] ml-2 tracking-tight">★★★★★</span></div>
                                <div className="text-[10.5px] md:text-[11.5px] font-medium text-stone-500 mt-2.5">{p.sub}</div>
                            </div>
                        ))}
                    </div>
                </Reveal>
            </div>

            {/* 캡처 마키 (풀블리드) */}
            <div className="mt-10 md:mt-14 relative">
                <motion.div className="flex gap-3 md:gap-4" animate={{ x: [0, -(252 + 12) * captures.length] }} transition={{ repeat: Infinity, duration: 48, ease: "linear" }}>
                    {doubled.map((r, i) => (
                        <div key={i} className="flex-shrink-0 w-[252px] relative bg-white border border-stone-900/10">
                            <div className="h-[315px] overflow-hidden">
                                <img src={r.url} loading="lazy" className="w-full h-full object-cover object-top" alt={r.tag + " 캡처 원본"} />
                            </div>
                            <div className="absolute top-3 left-3 px-2.5 py-1 text-[9.5px] font-black text-white tracking-[0.1em]" style={{ backgroundColor: "rgba(20,18,16,0.8)" }}>{r.tag}</div>
                        </div>
                    ))}
                </motion.div>
            </div>

            <div className="max-w-[1200px] mx-auto px-6 md:px-10 mt-10 md:mt-14 grid md:grid-cols-3 gap-0 md:divide-x divide-stone-900/10 border-t border-b border-stone-900/10 md:border divide-y md:divide-y-0">
                {quotes.map((q, i) => (
                    <Reveal key={i} delay={i * 0.08}>
                        <blockquote className="py-6 md:p-8">
                            <div className="text-amber-500 text-[12px] mb-3.5 tracking-[0.2em]" aria-label="별점 5점">★★★★★</div>
                            <p className="font-display text-[14.5px] md:text-[15.5px] text-stone-700 leading-[1.95]">"{q.text}"</p>
                            <footer className="text-[10.5px] font-bold text-stone-400 mt-4 tracking-[0.12em]">{q.who}</footer>
                        </blockquote>
                    </Reveal>
                ))}
            </div>
        </section>
    );
};

/* ════════════════════════════════════════════
   9. 공식 인증
   ════════════════════════════════════════════ */
const CertSection = () => (
    <section className="py-16 md:py-28" style={{ backgroundColor: PAPER }}>
        <div className="max-w-[1200px] mx-auto px-6 md:px-10">
            <Reveal>
                <Eyebrow no="06" en="Credentials" />
                <h2 className="text-[30px] md:text-[44px] font-black text-[#141210] leading-[1.22] tracking-[-0.03em]">
                    의심되시나요? 당연합니다.<br />그래서 서류를 준비했습니다
                </h2>
                <p className="mt-4 text-stone-500 text-[14px]">정식 사업자 등록부터 플랫폼 인증까지, 전부 공개합니다.</p>
            </Reveal>
            <div className="mt-10 md:mt-14 grid md:grid-cols-3 gap-4 md:gap-6 md:items-start">
                {[
                    { img: "숨고프로필.png", title: "숨고 본인인증 고수", sub: "가구이동·재배치 분야 — 리뷰 5.0 (185+)" },
                    { img: "당근.png", title: "당근마켓 공식 동네업체", sub: "화성 병점 기반 — 단골 380+ · 별점 5.0" }
                ].map((c, i) => (
                    <Reveal key={i} delay={i * 0.08}>
                        <div className="bg-white border border-stone-900/10">
                            <div className="overflow-hidden">
                                <img src={c.img} loading="lazy" className="w-full h-auto block" alt={c.title + " 화면 캡처"} />
                            </div>
                            <div className="px-5 py-4 flex items-center justify-between border-t border-stone-900/10">
                                <div>
                                    <div className="text-[13.5px] font-black text-[#141210]">{c.title}</div>
                                    <div className="text-[10.5px] font-medium text-stone-400 mt-1.5 tracking-wide">{c.sub}</div>
                                </div>
                                <span className="flex-shrink-0 w-8 h-8 border border-emerald-600 text-emerald-600 flex items-center justify-center"><IcCheck className="w-4 h-4" /></span>
                            </div>
                        </div>
                    </Reveal>
                ))}
                <Reveal delay={0.16}>
                    <div className="bg-white border border-stone-900/10 p-5 md:p-6">
                        <div className="border border-stone-900/10 overflow-hidden">
                            <img src="사업자.png" loading="lazy" className="w-full h-auto block" alt="가구전문가 아빠와 아들 사업자등록증" />
                        </div>
                        <div className="mt-4">
                            <div className="text-[13.5px] font-black text-[#141210]">정식 사업자 등록 업체</div>
                            <div className="text-[10.5px] font-medium text-stone-400 mt-1.5 tracking-wide">사업자등록번호 715-03-03416 — 대표 정용원</div>
                            <p className="text-[10.5px] text-stone-400 mt-2.5 leading-relaxed">모든 시공은 법적 보호와 정식 A/S가 보장됩니다.</p>
                        </div>
                    </div>
                </Reveal>
            </div>
        </div>
    </section>
);

/* ════════════════════════════════════════════
   10. 진행 과정
   ════════════════════════════════════════════ */
const ProcessSection = () => {
    const steps = [
        { no: "01", title: "사진 1장 보내기", desc: "견적 신청, 카톡, 전화 — 편한 방법으로 가구 사진만 보내주세요.", time: "1분" },
        { no: "02", title: "확정 견적 도착", desc: "대표가 직접 확인하고, 추가금 없는 확정 금액으로 답합니다.", time: "10분 내" },
        { no: "03", title: "보양 먼저, 시공은 그다음", desc: "약속한 날짜에 방문해 바닥 보양부터 깔고 시작합니다.", time: "약속일" },
        { no: "04", title: "같이 확인하고 끝", desc: "수평과 마감을 고객님과 함께 확인합니다. A/S까지 책임집니다.", time: "시공 후" }
    ];
    return (
        <section className="bg-white py-16 md:py-28">
            <div className="max-w-[1200px] mx-auto px-6 md:px-10">
                <Reveal>
                    <Eyebrow no="07" en="Process" />
                    <h2 className="text-[30px] md:text-[44px] font-black text-[#141210] leading-[1.22] tracking-[-0.03em]">
                        좋은 시공은<br />예측 가능해야 합니다
                    </h2>
                </Reveal>
                <div className="mt-10 md:mt-14 border-t border-stone-900/15 md:border md:grid md:grid-cols-4 md:divide-x md:divide-stone-900/10">
                    {steps.map((s, i) => (
                        <Reveal key={i} delay={i * 0.09}>
                            <div className="py-6 md:p-8 border-b border-stone-900/10 md:border-b-0 h-full flex md:block gap-5">
                                <div className="font-display text-[22px] md:text-[15px] font-black text-stone-300 leading-none w-12 md:w-auto flex-shrink-0 pt-1 md:pt-0">
                                    {s.no}
                                </div>
                                <div className="md:mt-6">
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        <h3 className="text-[16px] md:text-[18px] font-black text-[#141210] tracking-[-0.01em]">{s.title}</h3>
                                        <span className="text-[9px] font-black tracking-[0.18em] uppercase px-2 py-0.5 border border-stone-900/15 text-stone-500">{s.time}</span>
                                    </div>
                                    <p className="mt-2 md:mt-3 text-stone-500 text-[12.5px] md:text-[13px] leading-[1.85]">{s.desc}</p>
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
   11. 전화 즉시 연결 밴드
   ════════════════════════════════════════════ */
const CallBand = () => {
    const status = getBizStatus();
    return (
        <section className="py-16 md:py-28 relative overflow-hidden" style={{ backgroundColor: INK }}>
            <div className="absolute -bottom-10 left-0 font-display font-black text-[90px] md:text-[170px] leading-none tracking-tighter text-transparent select-none pointer-events-none" aria-hidden="true"
                style={{ WebkitTextStroke: "1px rgba(255,255,255,0.05)" }}>
                CALL US
            </div>
            <div className="max-w-[1200px] mx-auto px-6 md:px-10 relative z-10 text-center">
                <Reveal>
                    <div className="flex items-center justify-center gap-4 mb-6">
                        <span className="h-px w-10 bg-white/20"></span>
                        <span className="text-[10.5px] font-bold tracking-[0.4em] uppercase" style={{ color: GOLD }}>Direct Call</span>
                        <span className="h-px w-10 bg-white/20"></span>
                    </div>
                    <h2 className="text-[26px] md:text-[38px] font-black text-white leading-[1.28] tracking-[-0.03em]">
                        글보다 말이 편하시다면,<br />지금 누르세요. 바로 연결됩니다.
                    </h2>
                </Reveal>
                <Reveal delay={0.12}>
                    <a href={TEL_LINK} onClick={() => track("call_click", { where: "callband" })}
                        className="group inline-flex flex-col md:flex-row items-center gap-4 md:gap-6 mt-9 md:border-b-2 border-white/30 md:pb-3 hover:border-[#C89B6D] transition-colors" aria-label={`전화 즉시 연결 ${TEL_DISPLAY}`}>
                        <span className="w-12 h-12 md:w-14 md:h-14 border border-white/25 flex items-center justify-center text-white group-hover:bg-white group-hover:text-[#141210] transition-colors">
                            <IcPhone className="w-5 h-5 md:w-6 md:h-6" />
                        </span>
                        <span className="font-display text-[34px] md:text-[64px] font-black text-white tracking-[0.02em] leading-none border-b-2 border-white/30 pb-2 md:border-0 md:pb-0">{TEL_DISPLAY}</span>
                    </a>
                    <p className="mt-6 text-stone-500 text-[12px] md:text-[13px] font-medium tracking-wide">
                        연중무휴 08:00 – 21:00 · 상담원 아닌 <strong className="text-stone-300">대표가 직접</strong> 받습니다
                        <span className="inline-flex items-center gap-1.5 ml-3">
                            <span className={`inline-flex rounded-full h-1.5 w-1.5 ${status.open ? "bg-emerald-400" : "bg-stone-500"}`}></span>
                            <span className="text-[11px]">{status.text}</span>
                        </span>
                    </p>
                    <a href={KAKAO_URL} target="_blank" rel="noopener" onClick={() => track("kakao_click", { where: "callband" })}
                        className="inline-flex items-center gap-2.5 mt-6 h-12 px-7 bg-[#FEE500] text-stone-900 font-black text-[13.5px] hover:brightness-105 transition-all">
                        <IcChat className="w-4 h-4" /> 통화가 어려우면 카카오톡으로
                    </a>
                </Reveal>
            </div>
        </section>
    );
};

/* ════════════════════════════════════════════
   12. FAQ
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
        <section className="py-16 md:py-28" style={{ backgroundColor: PAPER }}>
            <div className="max-w-[820px] mx-auto px-6 md:px-10">
                <Reveal>
                    <Eyebrow no="08" en="FAQ" />
                    <h2 className="text-[28px] md:text-[40px] font-black text-[#141210] tracking-[-0.03em]">망설이게 하는 질문들,<br />먼저 답해드립니다</h2>
                </Reveal>
                <Reveal delay={0.08}>
                    <div className="mt-9 border-t border-stone-900/15">
                        {faqs.map((f, i) => (
                            <div key={i} className="border-b border-stone-900/15">
                                <button onClick={() => setOpenIdx(openIdx === i ? null : i)} aria-expanded={openIdx === i}
                                    className="w-full py-5 md:py-6 flex justify-between items-center text-left gap-4">
                                    <span className="text-[14.5px] md:text-[16px] font-bold text-stone-800 flex items-baseline gap-4">
                                        <span className="font-display text-[12px] text-stone-400 font-black flex-shrink-0">Q{i + 1}</span>{f.q}
                                    </span>
                                    <motion.span animate={{ rotate: openIdx === i ? 45 : 0 }} className="text-stone-400 text-[20px] font-light flex-shrink-0 leading-none">+</motion.span>
                                </button>
                                <AnimatePresence>
                                    {openIdx === i && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: EASE }} className="overflow-hidden">
                                            <p className="pb-6 pl-9 text-[13px] md:text-[14px] text-stone-500 leading-[1.95] max-w-xl">{f.a}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </Reveal>
            </div>
        </section>
    );
};

/* ════════════════════════════════════════════
   13. 견적 위저드 — 4단계 (로직 유지)
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
    { v: "가구이동 (방 ↔ 방)", en: "Room to Room", d: "같은 집 안에서 가구 위치를 옮겨요" },
    { v: "가구이동 (집 ↔ 집)", en: "Home to Home", d: "다른 집으로 가구를 옮기고 설치해요" },
    { v: "가구폐기", en: "Disposal", d: "돌침대·장롱 등을 분해해서 버려요" },
    { v: "시스템행거", en: "System Hanger", d: "행거 설치·이전·수리가 필요해요" },
    { v: "기타", en: "Others", d: "그 외 가구 관련 도움이 필요해요" }
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
            confetti({ particleCount: 140, spread: 70, origin: { y: 0.5 }, colors: [ACCENT, "#ffffff", GOLD] });
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

    /* ── 접수 완료 화면: 신뢰를 한 번 더 ── */
    if (isSubmitted) {
        return (
            <section className="fixed inset-0 z-[9999] overflow-y-auto no-scrollbar" aria-label="접수 완료" style={{ backgroundColor: PAPER }}>
                <div className="max-w-[560px] mx-auto px-6 py-12 pb-16">
                    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }} className="text-center">
                        <div className="w-16 h-16 border-2 border-emerald-600 text-emerald-600 flex items-center justify-center mx-auto mb-7"><IcCheck className="w-7 h-7" /></div>
                        <div className="text-[10px] font-bold tracking-[0.35em] uppercase text-stone-400 mb-4">Request Received</div>
                        <h2 className="text-[27px] md:text-[30px] font-black text-[#141210] leading-tight tracking-[-0.02em]">접수 완료.<br />지금부터는 저희가 움직입니다.</h2>
                        <p className="mt-5 text-stone-500 text-[14px] leading-[1.9]">방금 <strong className="text-stone-800 font-semibold">정용원 대표 휴대폰으로</strong> 알림이 전송되었습니다.<br />영업시간 기준 <strong className="font-semibold" style={{ color: ACCENT }}>평균 10분 내</strong>에 연락드립니다.</p>
                    </motion.div>

                    {/* 다음 단계 안내 */}
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
                                    <div className="text-[14px] font-black text-[#141210]">{s.t} {s.state === "now" && <span className="text-[10px] font-bold ml-1.5" style={{ color: ACCENT }}>— 진행 중</span>}</div>
                                    <div className="text-[12px] text-stone-500 mt-1">{s.d}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* 대표 한마디 */}
                    <div className="mt-4 p-6 flex items-center gap-5" style={{ backgroundColor: INK }}>
                        <div className="w-16 h-16 overflow-hidden border flex-shrink-0" style={{ borderColor: "rgba(200,155,109,0.5)" }}>
                            <img src="father.jpg" className="w-full h-full object-cover object-top" alt="정용원 대표" />
                        </div>
                        <p className="font-display text-[13.5px] text-stone-300 leading-[1.9]">"꼼꼼히 확인하고 <strong style={{ color: GOLD }}>바로 전화드리겠습니다.</strong><br />모르는 번호로 와도 한 번만 받아주세요."</p>
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

                    {/* 기다리는 동안 신뢰 콘텐츠 */}
                    <div className="mt-11">
                        <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-stone-400 mb-4">While You Wait</div>
                        <h3 className="text-[19px] font-black text-[#141210] mb-5 tracking-[-0.01em]">기다리시는 동안, 저희가 일하는 모습을 구경하세요</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { img: "A8.jpg", cap: "쇼파 전면 랩핑 보양" },
                                { img: "A2.jpg", cap: "슬라이딩 장롱 이전설치" },
                                { img: "sh4.jpg", cap: "시스템행거 정밀 시공" },
                                { img: "A5.jpg", cap: "원목 침대 재조립" }
                            ].map((w, i) => (
                                <figure key={i} className="relative overflow-hidden">
                                    <div className="aspect-square"><img src={w.img} loading="lazy" className="w-full h-full object-cover" alt={w.cap} /></div>
                                    <figcaption className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pt-7 pb-2.5 px-3 text-white text-[10.5px] font-bold">{w.cap}</figcaption>
                                </figure>
                            ))}
                        </div>

                        <blockquote className="bg-white border border-stone-900/10 p-5 mt-4">
                            <div className="text-amber-500 text-[11px] mb-2.5 tracking-[0.2em]">★★★★★</div>
                            <p className="font-display text-[13.5px] text-stone-600 leading-[1.9]">"부자가 함께 오셔서 손발이 척척. 보양까지 해주시고 추가비용 얘기가 한 번도 안 나온 게 제일 좋았어요."</p>
                            <footer className="text-[10.5px] font-bold text-stone-400 mt-3 tracking-[0.1em]">수원 영통 — 침대 이동</footer>
                        </blockquote>

                        <p className="font-display text-center text-[13.5px] text-stone-500 leading-[1.9] mt-8 italic">"가구가 아니라 그 집의 살림을 옮기는 일.<br />저희 가족의 이름을 걸고 하겠습니다."</p>
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
            <section id="quote-form" className="py-16 md:py-28 relative overflow-hidden border-t border-white/[0.06]" style={{ backgroundColor: INK }}>
                <div className="max-w-[820px] mx-auto px-6 md:px-10 relative z-10 text-center">
                    <Reveal>
                        <div className="flex items-center justify-center gap-4 mb-6">
                            <span className="h-px w-10 bg-white/20"></span>
                            <span className="text-[10.5px] font-bold tracking-[0.4em] uppercase" style={{ color: GOLD }}>Free Estimate</span>
                            <span className="h-px w-10 bg-white/20"></span>
                        </div>
                        <h2 className="text-[28px] md:text-[44px] font-black text-white leading-[1.25] tracking-[-0.03em]">
                            고민에 쓰는 1분을,<br />견적 받는 1분으로.
                        </h2>
                        <p className="mt-5 text-stone-400 text-[13.5px] md:text-[15px] leading-relaxed">사진 한 장이면 끝납니다. 복잡한 건 전부 저희 몫입니다.</p>
                    </Reveal>
                    <Reveal delay={0.12}>
                        {hasDraft ? (
                            <button onClick={() => setIsExpanded(true)}
                                className="group mt-8 w-full md:w-auto md:px-14 h-[58px] text-[#141210] font-black text-[15.5px] inline-flex items-center justify-center gap-3 hover:brightness-110 transition-all"
                                style={{ backgroundColor: GOLD }}>
                                작성하시던 견적 이어서 하기 <IcArrow className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        ) : (
                            <button onClick={() => openQuote()}
                                className="group mt-8 w-full md:w-auto md:px-14 h-[58px] text-white font-black text-[15.5px] inline-flex items-center justify-center gap-3 hover:brightness-110 transition-all shadow-[0_18px_45px_-12px_rgba(199,91,18,0.7)]"
                                style={{ backgroundColor: ACCENT }}>
                                <IcCamera className="w-[18px] h-[18px]" /> 1분 무료 견적 시작하기 <IcArrow className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        )}
                        <div className="flex items-center justify-center gap-5 mt-5 text-[11px] font-semibold text-stone-500 flex-wrap tracking-wide">
                            <span className="flex items-center gap-1.5"><IcCheck className="w-3 h-3" />입력 자동저장</span>
                            <span className="flex items-center gap-1.5"><IcCheck className="w-3 h-3" />스팸·광고 없음</span>
                            <span className="flex items-center gap-1.5"><IcCheck className="w-3 h-3" />상담 후 정보 파기</span>
                        </div>
                    </Reveal>
                </div>
            </section>
        );
    }

    /* ── 위저드 (펼친 상태 — 모바일 풀스크린 / 데스크톱 센터 카드) ── */
    return (
        <section id="quote-form" role="dialog" aria-modal="true" aria-label="무료 견적 신청"
            className="fixed inset-0 z-[9999] overflow-hidden md:flex md:items-center md:justify-center md:p-6"
            style={{ minHeight: "100dvh", backgroundColor: "rgba(20,18,16,0.75)" }}>
            <div className="w-full h-full md:h-auto md:max-h-[92vh] md:max-w-[560px] md:shadow-2xl md:overflow-hidden flex flex-col" style={{ backgroundColor: PAPER, height: "100dvh" }}>
                <div className="flex flex-col h-full md:max-h-[92vh] px-5 md:px-8 pt-4 md:pt-6 pb-6">
                    {/* 상단 바 */}
                    <div className="flex items-center justify-between mb-5">
                        <button onClick={step === 1 ? requestExit : prev} aria-label={step === 1 ? "견적 신청 닫기" : "이전 단계"}
                            className="w-11 h-11 flex items-center justify-center bg-white border border-stone-900/10 text-stone-700">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                        </button>
                        <div className="text-[10px] font-black text-stone-400 tracking-[0.3em] uppercase">Step {step} / {TOTAL_STEPS}</div>
                        <button onClick={requestExit} aria-label="닫기" className="w-11 h-11 flex items-center justify-center text-stone-400 text-xl font-light">✕</button>
                    </div>

                    {/* 진행 바 */}
                    <div className="h-[3px] bg-stone-200 mb-6 overflow-hidden">
                        <motion.div className="h-full" style={{ backgroundColor: ACCENT }} animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
                    </div>

                    <div className="mb-6">
                        <div className="text-[10.5px] font-black tracking-[0.15em] mb-2" style={{ color: ACCENT }}>{STEP_CHEERS[step]}</div>
                        <h2 className="text-[24px] font-black text-[#141210] leading-tight whitespace-pre-line tracking-[-0.02em]">
                            {step === 1 && "어떤 도움이\n필요하세요?"}
                            {step === 2 && "어떤 가구인가요?"}
                            {step === 3 && "어디로, 언제\n가면 될까요?"}
                            {step === 4 && "견적 보내드릴\n연락처만 남겨주세요"}
                        </h2>
                    </div>

                    <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar pb-4">
                        <AnimatePresence mode="wait">
                            {/* STEP 1 — 서비스 */}
                            {step === 1 && (
                                <motion.div key="s1" initial={{ x: 24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -24, opacity: 0 }} transition={{ ease: EASE, duration: 0.4 }} className="space-y-2.5">
                                    {SERVICE_OPTIONS.map((o) => (
                                        <button key={o.v} onClick={() => { setFormData({ ...formData, service: o.v }); next(); }}
                                            className={`w-full p-4 border-2 text-left flex items-center justify-between gap-4 transition-all active:scale-[0.99] group ${formData.service === o.v ? "bg-white" : "bg-white border-stone-900/10 hover:border-stone-900/30"}`}
                                            style={formData.service === o.v ? { borderColor: ACCENT } : {}}>
                                            <span>
                                                <span className="block text-[9px] font-bold tracking-[0.25em] uppercase text-stone-400 mb-1">{o.en}</span>
                                                <span className="block text-[15.5px] font-black text-[#141210]">{o.v}</span>
                                                <span className="block text-[11.5px] text-stone-400 mt-1">{o.d}</span>
                                            </span>
                                            <IcArrow className="w-4 h-4 text-stone-300 group-hover:text-stone-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                                        </button>
                                    ))}
                                </motion.div>
                            )}

                            {/* STEP 2 — 가구 + 사진 */}
                            {step === 2 && (
                                <motion.div key="s2" initial={{ x: 24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -24, opacity: 0 }} transition={{ ease: EASE, duration: 0.4 }} className="space-y-6">
                                    <div>
                                        <p className="text-[11px] font-black text-stone-500 mb-2.5 tracking-[0.1em]">해당하는 가구를 모두 선택해 주세요</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {ITEM_CHIPS.map((item) => {
                                                const on = formData.items.includes(item);
                                                return (
                                                    <button key={item} onClick={() => toggleItem(item)}
                                                        className={`h-12 font-bold text-[13.5px] border-2 transition-all flex items-center justify-center gap-2 ${on ? "bg-white text-[#141210]" : "bg-white border-stone-900/10 text-stone-500 hover:border-stone-900/30"}`}
                                                        style={on ? { borderColor: ACCENT } : {}}>
                                                        {item} {on && <IcCheck className="w-3.5 h-3.5" style={{ color: ACCENT }} />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-black text-stone-500 mb-2.5 tracking-[0.1em]">사진을 올려주시면 견적이 더 정확해요 <span className="text-stone-400 font-medium">(선택, 최대 3장)</span></p>
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
                                        <p className="text-[11px] font-black text-stone-500 mb-2.5 tracking-[0.1em]">더 알려주실 내용이 있다면 <span className="text-stone-400 font-medium">(선택)</span></p>
                                        <textarea value={formData.detail} onChange={(e) => setFormData({ ...formData, detail: e.target.value })}
                                            className="w-full h-20 bg-white border-2 border-stone-900/10 p-3.5 text-stone-800 text-[13px] outline-none focus:border-stone-900/40 transition-colors"
                                            placeholder="예) 장롱 3짝, 안방에서 작은방으로 / 5층인데 엘리베이터 있어요"></textarea>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 3 — 지역 + 일정 */}
                            {step === 3 && (
                                <motion.div key="s3" initial={{ x: 24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -24, opacity: 0 }} transition={{ ease: EASE, duration: 0.4 }} className="space-y-7">
                                    <div>
                                        <p className="text-[11px] font-black text-stone-500 mb-2.5 tracking-[0.1em]">작업할 지역이 어디인가요?</p>
                                        <div className="grid grid-cols-3 gap-2">
                                            {REGION_CHIPS.map((r) => (
                                                <button key={r.city} onClick={() => setFormData({ ...formData, region: r.city, regionEtc: "" })}
                                                    className={`py-3 text-[12.5px] font-bold border-2 transition-all ${formData.region === r.city && !formData.regionEtc ? "bg-white text-[#141210]" : "bg-white border-stone-900/10 text-stone-500 hover:border-stone-900/30"}`}
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
                                        <p className="text-[11px] font-black text-stone-500 mb-2.5 tracking-[0.1em]">언제쯤이 좋으세요?</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {SCHEDULE_CHIPS.map((sc) => (
                                                <button key={sc} onClick={() => setFormData({ ...formData, schedule: sc })}
                                                    className={`h-12 text-[13px] font-bold border-2 transition-all ${formData.schedule === sc ? "bg-white text-[#141210]" : "bg-white border-stone-900/10 text-stone-500 hover:border-stone-900/30"}`}
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

                            {/* STEP 4 — 연락처 */}
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
                                            className="flex-1 min-w-0 h-16 bg-white border-2 text-[#141210] text-center text-2xl font-black outline-none tracking-[0.08em]"
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

                    {/* 하단 버튼 */}
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
                                <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-stone-400 mb-3">Wait a Second</div>
                                <h3 className="text-[20px] font-black text-[#141210] tracking-[-0.01em]">잠깐만요, 거의 다 하셨어요.</h3>
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
   14. 푸터
   ════════════════════════════════════════════ */
const Footer = () => {
    const naverMap = "https://map.naver.com/p/search/" + encodeURIComponent("경기도 화성시 효행로 1068");
    return (
        <footer className="text-stone-500 pt-14 pb-40 md:pb-16 px-6 md:px-10 border-t border-white/[0.06]" style={{ backgroundColor: "#100E0C" }}>
            <div className="max-w-[1200px] mx-auto md:grid md:grid-cols-[1.2fr_1fr] md:gap-20">
                <div>
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-9 h-9 border border-white/25 flex items-center justify-center text-white font-black text-[12px]">父子</div>
                        <div>
                            <div className="text-white text-[16px] font-black">아빠와 아들</div>
                            <div className="text-[8.5px] font-bold text-stone-600 tracking-[0.28em] uppercase mt-1">Furniture Care Studio</div>
                        </div>
                    </div>
                    <p className="text-[11.5px] leading-[1.9] mb-7 max-w-sm">
                        경기남부 가구이동 · 이전설치 · 폐기 · 시스템행거 전문.
                        15년 경력의 가족 기술자가 직접 시공합니다. 파손 전액 책임보상 · 현장 추가금 0원 정찰제 원칙.
                    </p>
                    <div className="flex flex-wrap gap-2.5 mb-10">
                        <a href={TEL_LINK} onClick={() => track("call_click", { where: "footer" })} className="inline-flex items-center gap-2 px-4 py-2.5 border border-white/10 text-[11px] font-bold text-stone-300 hover:bg-white/5 transition-colors"><IcPhone className="w-3 h-3" />{TEL_DISPLAY}</a>
                        <a href={KAKAO_URL} target="_blank" rel="noopener" className="inline-flex items-center gap-2 px-4 py-2.5 border border-white/10 text-[11px] font-bold text-stone-300 hover:bg-white/5 transition-colors"><IcChat className="w-3 h-3" />카톡 상담</a>
                        <a href={naverMap} target="_blank" rel="noopener" className="inline-flex items-center gap-2 px-4 py-2.5 border border-white/10 text-[11px] font-bold text-stone-300 hover:bg-white/5 transition-colors">지도 보기</a>
                    </div>
                </div>
                <div>
                    <div className="space-y-2 text-[10.5px] mb-8 tracking-wide">
                        <p className="text-stone-400 font-medium">상호명: 가구전문가 아빠와 아들 — 대표자: 정용원</p>
                        <p>사업자등록번호: 715-03-03416</p>
                        <p>소재지: 경기도 화성시 효행로 1068, 604동 2층 G211호</p>
                        <p>대표번호: {TEL_DISPLAY} — 이메일: jung22459369@gmail.com</p>
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
            <div className="max-w-[1200px] mx-auto pt-8 mt-10 border-t border-white/[0.05] flex items-center justify-between text-[9px] tracking-[0.1em]">
                <p>© 2026 가구전문가 아빠와 아들. All rights reserved.</p>
                <p className="uppercase">Father &amp; Son — Furniture Care</p>
            </div>
        </footer>
    );
};

/* ════════════════════════════════════════════
   15. 플로팅 바 (모바일) + 데스크톱 퀵버튼
   ════════════════════════════════════════════ */
const FloatingBar = () => {
    const status = getBizStatus();
    return (
        <>
            {/* 모바일 하단 바 */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-[800]">
                <div className="backdrop-blur-xl border-t border-white/10 shadow-[0_-12px_40px_rgba(0,0,0,0.45)]" style={{ backgroundColor: "rgba(16,14,12,0.96)" }}>
                    <div className="flex items-center justify-center gap-2 pt-2 pb-1.5">
                        <span className="relative flex h-1.5 w-1.5">
                            {status.open && <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${status.open ? "bg-emerald-400" : "bg-stone-500"}`}></span>
                        </span>
                        <span className="text-[10px] font-bold text-stone-400 tracking-wide">{status.text} · {status.sub}</span>
                    </div>
                    <div className="px-3 pb-3 flex gap-2">
                        <a href={TEL_LINK} onClick={() => track("call_click", { where: "floating" })} aria-label={`전화 즉시 연결 ${TEL_DISPLAY}`}
                            className="flex-1 h-[52px] border border-white/15 text-white flex flex-col items-center justify-center gap-1">
                            <span className="flex items-center gap-1.5 text-[8.5px] font-bold text-stone-400 tracking-[0.15em] uppercase"><IcPhone className="w-3 h-3" /> 즉시 통화</span>
                            <span className="text-[12.5px] font-black tracking-[0.06em] leading-none">2245-9369</span>
                        </a>
                        <a href={KAKAO_URL} target="_blank" rel="noopener" onClick={() => track("kakao_click", { where: "floating" })} aria-label="카카오톡 상담"
                            className="w-[62px] h-[52px] bg-[#FEE500] text-stone-900 flex flex-col items-center justify-center gap-0.5 font-black">
                            <IcChat className="w-4 h-4" />
                            <span className="text-[9.5px] leading-none">카톡</span>
                        </a>
                        <button onClick={() => openQuote()}
                            className="flex-[1.25] h-[52px] text-white flex items-center justify-center gap-2 font-black text-[13px]" style={{ backgroundColor: ACCENT }}>
                            <IcCamera className="w-4 h-4" /> 1분 무료 견적
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
                        <span className="block text-[9px] font-bold text-stone-400 mb-1.5 tracking-[0.2em] uppercase">Direct Call</span>
                        <span className="block text-[15px] font-black text-stone-900 tracking-[0.05em]">{TEL_DISPLAY}</span>
                    </span>
                </a>
                <button onClick={() => openQuote()}
                    className="flex items-center gap-2.5 text-white px-7 py-4 font-black text-[14px] shadow-[0_18px_45px_rgba(199,91,18,0.45)] hover:-translate-y-0.5 hover:brightness-110 transition-all"
                    style={{ backgroundColor: ACCENT }}>
                    <IcCamera className="w-4 h-4" /> 1분 무료 견적
                </button>
            </div>
        </>
    );
};

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
            <MarqueeBand />
            <LiveTicker />
            <ServiceSection />
            <WhySection />
            <StorySection />
            <PortfolioSection />
            <ReviewSection />
            <CertSection />
            <ProcessSection />
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
