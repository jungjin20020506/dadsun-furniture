import React, { useState, useEffect, useRef, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { motion, animate, useInView, AnimatePresence, MotionConfig } from "framer-motion";
import confetti from "canvas-confetti";

/* ============================================================
   가구전문가 아빠와 아들 — 신뢰 우선(Trust-first) 랜딩페이지
   구조: 신뢰 형성 → 초간단 견적(이탈 방지) → 접수 후 신뢰 강화
   ============================================================ */

const KAKAO_URL = "https://open.kakao.com/o/spSfhAbi";
const TEL = "01022459369";
const TEL_DISPLAY = "010-2245-9369";

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

// ─── 공통: 견적 위저드 열기 (페이지 어디서든 호출) ───
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
        : { open: false, text: "상담 마감 시간", sub: "남겨주시면 아침에 가장 먼저 연락드려요" };
};

// ─── 숫자 카운터 ───
const Counter = ({ target, duration = 1.4, suffix = "", prefix = "", decimals = 0 }) => {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });
    useEffect(() => {
        if (isInView) {
            const controls = animate(0, target, { duration, onUpdate: (v) => setCount(v) });
            return () => controls.stop();
        }
    }, [isInView, target]);
    return <span ref={ref}>{prefix}{count.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>;
};

/* ════════════════════════════════════════════
   1. 헤더 — 항상 위에 떠 있는 얇은 바
   ════════════════════════════════════════════ */
const Header = () => (
    <header className="sticky top-0 z-[500] bg-[#FBF8F3]/90 backdrop-blur-lg border-b border-stone-900/5">
        <div className="max-w-[480px] mx-auto flex items-center justify-between px-5 h-14">
            <a href="#top" className="flex items-center gap-2" aria-label="아빠와 아들 홈">
                <div className="w-8 h-8 rounded-xl bg-stone-900 flex items-center justify-center text-amber-400 font-black text-[13px]">父子</div>
                <div className="leading-none">
                    <div className="font-black text-[14px] text-stone-900 tracking-tight">가구전문가 아빠와 아들</div>
                    <div className="text-[9px] font-bold text-stone-400 mt-0.5 tracking-wide">경기남부 가구이동 · 이전설치 · 폐기</div>
                </div>
            </a>
            <a href={`tel:${TEL}`} onClick={() => track("call_click", { where: "header" })}
                className="flex items-center gap-1.5 bg-stone-900 text-white rounded-full pl-3 pr-4 py-2 text-[12px] font-black active:scale-95 transition-transform" aria-label="전화 상담">
                <span aria-hidden="true">📞</span> 전화
            </a>
        </div>
    </header>
);

/* ════════════════════════════════════════════
   2. 히어로 — 첫 3초 안에 신뢰의 근거를 보여준다
   ════════════════════════════════════════════ */
const Hero = () => {
    const status = getBizStatus();
    return (
        <section id="top" className="bg-[#FBF8F3] px-6 pt-8 pb-10 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-orange-200/40 rounded-full blur-[90px] pointer-events-none"></div>

            <div className="relative z-10">
                {/* 실측 지표 뱃지 */}
                <div className="flex flex-wrap items-center gap-1.5 mb-5">
                    <span className="inline-flex items-center gap-1 bg-white border border-stone-900/10 rounded-full px-3 py-1.5 text-[11px] font-black text-stone-700 shadow-sm">⭐ 평점 4.9</span>
                    <span className="inline-flex items-center gap-1 bg-white border border-stone-900/10 rounded-full px-3 py-1.5 text-[11px] font-black text-stone-700 shadow-sm">🥕 당근 단골 380+</span>
                    <span className="inline-flex items-center gap-1 bg-white border border-stone-900/10 rounded-full px-3 py-1.5 text-[11px] font-black text-stone-700 shadow-sm">🏅 숨고 인증 고수</span>
                </div>

                <h1 className="font-display text-[31px] leading-[1.3] font-black text-stone-900 tracking-tight mb-4">
                    가구 하나를 옮겨도,<br />
                    <span className="text-[#E2610F]">가족의 일처럼</span> 합니다.
                </h1>
                <p className="text-stone-500 text-[15px] leading-relaxed mb-6">
                    용역 알바가 아닌 <strong className="text-stone-800">15년 경력 아버지와 아들</strong>이 직접 방문합니다.
                    가구이동 · 집간 이전설치 · 가구폐기, 사진 한 장이면 <strong className="text-stone-800">추가금 없는 확정 견적</strong>을 받아보세요.
                </p>

                {/* 대표 사진 — 얼굴을 건 신뢰 */}
                <div className="relative rounded-[28px] overflow-hidden shadow-[0_25px_50px_-15px_rgba(41,30,17,0.35)] mb-3 bg-stone-200">
                    <div className="aspect-[4/5]">
                        <img src="father.jpg" loading="eager" fetchpriority="high" className="w-full h-full object-cover object-[center_18%]" alt="가구전문가 아빠와 아들 정용원 대표" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end justify-between">
                        <div>
                            <div className="text-amber-300 text-[10px] font-black tracking-[0.25em] uppercase mb-1.5">대표 · 수석 기술자</div>
                            <div className="text-white text-2xl font-black tracking-tight">정용원</div>
                            <div className="text-stone-300 text-[12px] font-bold mt-1">15년 무사고 시공 · 누적 8,500건+</div>
                        </div>
                        <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl px-3 py-2 text-center">
                            <div className="text-white text-[17px] font-black leading-none">4.9<span className="text-[10px] font-bold text-stone-300">/5</span></div>
                            <div className="text-[9px] text-stone-300 font-bold mt-1">당근·숨고 평점</div>
                        </div>
                    </div>
                </div>

                {/* 3대 약속 */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                    {[
                        { ic: "🛡️", t: "파손 시", s: "전액 책임보상" },
                        { ic: "🧾", t: "현장 추가금", s: "0원 정찰제" },
                        { ic: "👨‍👦", t: "하청 없이", s: "가족 직접 시공" }
                    ].map((b, i) => (
                        <div key={i} className="bg-white border border-stone-900/10 rounded-2xl py-3.5 text-center shadow-sm">
                            <div className="text-[17px] mb-1" aria-hidden="true">{b.ic}</div>
                            <div className="text-[11px] font-bold text-stone-400 leading-tight">{b.t}</div>
                            <div className="text-[12px] font-black text-stone-900 mt-0.5">{b.s}</div>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => openQuote()}
                    className="w-full h-16 bg-[#E2610F] text-white rounded-2xl flex items-center justify-center gap-2 font-black text-[17px] shadow-[0_18px_35px_-8px_rgba(226,97,15,0.55)] mb-2.5">
                    📸 사진 한 장으로 1분 견적받기
                </motion.button>
                <a href={KAKAO_URL} target="_blank" rel="noopener" onClick={() => track("kakao_click", { where: "hero" })}
                    className="w-full h-13 py-4 bg-[#FEE500] text-stone-900 rounded-2xl flex items-center justify-center gap-2 font-black text-[14px]">
                    💬 카톡이 편하시면 바로 상담하기
                </a>

                {/* 상담 상태 */}
                <div className="flex items-center justify-center gap-2 mt-4">
                    <span className="relative flex h-2 w-2">
                        {status.open && <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${status.open ? "bg-emerald-500" : "bg-stone-400"}`}></span>
                    </span>
                    <span className="text-[12px] font-bold text-stone-500">{status.text} · {status.sub}</span>
                </div>
                <p className="text-center text-[11px] text-stone-400 font-medium mt-1.5">견적 상담은 100% 무료입니다. 부담 갖지 마세요.</p>
            </div>
        </section>
    );
};

/* ════════════════════════════════════════════
   3. 실시간 접수 티커 — 사회적 증거
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
        const t = setInterval(() => setIdx((i) => (i + 1) % feed.length), 3200);
        return () => clearInterval(t);
    }, []);
    return (
        <div className="bg-stone-900 px-6 py-3 overflow-hidden">
            <div className="flex items-center gap-3 max-w-[480px] mx-auto">
                <span className="flex-shrink-0 inline-flex items-center gap-1.5 text-[10px] font-black text-emerald-400 tracking-wider uppercase">
                    <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                    </span>
                    실시간 접수
                </span>
                <div className="relative h-5 flex-1 overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.div key={idx} initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }} transition={{ duration: 0.35 }}
                            className="absolute inset-0 flex items-center text-[12px] text-stone-300 font-bold truncate">
                            {feed[idx].area} · {feed[idx].job} <span className="text-stone-500 font-medium ml-1.5">{feed[idx].when}</span>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

/* ════════════════════════════════════════════
   4. 핵심 지표
   ════════════════════════════════════════════ */
const StatStrip = () => {
    const stats = [
        { value: 15, suffix: "년+", label: "현장 경력" },
        { value: 8500, suffix: "+", label: "누적 시공" },
        { value: 4.9, suffix: "", decimals: 1, label: "후기 평점" },
        { value: 92, suffix: "%", label: "재의뢰·소개율" }
    ];
    return (
        <section className="bg-white border-b border-stone-900/5 px-6 py-8">
            <div className="grid grid-cols-4 gap-2 text-center">
                {stats.map((s, i) => (
                    <div key={i}>
                        <div className="text-[22px] font-black text-stone-900 tracking-tight">
                            <Counter target={s.value} suffix={s.suffix} decimals={s.decimals || 0} />
                        </div>
                        <div className="text-[10px] font-bold text-stone-400 mt-1">{s.label}</div>
                    </div>
                ))}
            </div>
        </section>
    );
};

/* ════════════════════════════════════════════
   5. 서비스 — 무엇을 해드리는지 명확하게
   ════════════════════════════════════════════ */
const ServiceSection = () => {
    const services = [
        {
            img: "A7.jpg", tag: "가장 많이 찾는 서비스", tagColor: "bg-orange-100 text-orange-700",
            title: "방 ↔ 방 가구이동", price: "3만원~", formValue: "가구이동 (방 ↔ 방)",
            desc: "장롱·침대·쇼파를 분해하고, 바닥 보양 후 안전하게 옮겨 수평까지 잡아드립니다.",
            points: ["분해 → 이동 → 재조립 → 수평", "바닥·벽 전용 보양재 사용"]
        },
        {
            img: "A8.jpg", tag: "이사 후 새집 정착", tagColor: "bg-blue-100 text-blue-700",
            title: "집 ↔ 집 이전설치", price: "5만원~", formValue: "가구이동 (집 ↔ 집)",
            desc: "쓰던 가구 몇 점만 새집으로. 포장이사보다 합리적으로, 용달보다 안전하게 옮깁니다.",
            points: ["랩핑 포장 + 전용 차량 이동", "새집 원하는 위치에 설치 완료"]
        },
        {
            img: "A6.jpg", tag: "무거운 가구도 한 번에", tagColor: "bg-emerald-100 text-emerald-700",
            title: "가구 폐기 · 수거", price: "2만원~", formValue: "가구폐기",
            desc: "돌침대·장롱 같은 대형 가구를 분해해 반출하고, 폐기 신고까지 깔끔하게 마무리합니다.",
            points: ["돌침대 전문 분해·반출", "행정 신고 · 뒷정리 포함"]
        },
        {
            img: "sh.jpg", tag: "드레스룸 완성", tagColor: "bg-violet-100 text-violet-700",
            title: "시스템행거 설치", price: "5만원~", formValue: "시스템행거",
            desc: "수평 장비로 흔들림 없이 시공합니다. 이전 설치·부분 수리도 가능합니다.",
            points: ["레이저 수평 정밀 시공", "이전 재설치 · A/S 가능"]
        }
    ];
    return (
        <section className="bg-[#FBF8F3] px-6 py-14" id="services">
            <div className="mb-8">
                <div className="text-[#E2610F] text-[11px] font-black tracking-[0.3em] uppercase mb-2">Our Services</div>
                <h2 className="font-display text-[26px] font-black text-stone-900 leading-tight">이런 일을 해드립니다</h2>
                <p className="text-stone-500 text-[13px] mt-2">모든 서비스는 출장비·견적 상담이 무료입니다.</p>
            </div>
            <div className="space-y-4">
                {services.map((s, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                        className="bg-white rounded-[24px] border border-stone-900/10 overflow-hidden shadow-sm">
                        <div className="flex">
                            <div className="w-32 flex-shrink-0 relative">
                                <img src={s.img} loading="lazy" className="absolute inset-0 w-full h-full object-cover" alt={s.title + " 시공 사진"} />
                            </div>
                            <div className="flex-1 p-4">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black mb-1.5 ${s.tagColor}`}>{s.tag}</span>
                                <div className="flex items-baseline justify-between gap-2">
                                    <h3 className="text-[16px] font-black text-stone-900">{s.title}</h3>
                                    <span className="text-[13px] font-black text-[#E2610F] flex-shrink-0">{s.price}</span>
                                </div>
                                <p className="text-[11.5px] text-stone-500 leading-relaxed mt-1.5">{s.desc}</p>
                                <ul className="mt-2 space-y-0.5">
                                    {s.points.map((p, j) => (
                                        <li key={j} className="text-[10.5px] font-bold text-stone-600 flex items-center gap-1"><span className="text-emerald-500">✓</span>{p}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <button onClick={() => openQuote(s.formValue)}
                            className="w-full py-3 bg-stone-50 border-t border-stone-900/5 text-[12px] font-black text-stone-700 active:bg-stone-100">
                            이 작업 견적 받아보기 →
                        </button>
                    </motion.div>
                ))}
            </div>
            <p className="text-center text-[11px] text-stone-400 mt-4">※ 표시 가격은 최소 기준이며, 사진 확인 후 <strong className="text-stone-600">추가금 없는 확정가</strong>를 안내드립니다.</p>
        </section>
    );
};

/* ════════════════════════════════════════════
   6. 왜 아빠와 아들인가 — 차이를 증명
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
        <section className="bg-white px-6 py-14">
            <div className="text-center mb-8">
                <div className="text-[#E2610F] text-[11px] font-black tracking-[0.3em] uppercase mb-2">Why Us</div>
                <h2 className="font-display text-[26px] font-black text-stone-900 leading-tight">싼 곳은 많습니다.<br />믿을 곳이 없을 뿐이죠.</h2>
                <p className="text-stone-500 text-[13px] mt-3">저희가 5년째 재의뢰율 92%를 지키는 이유입니다.</p>
            </div>
            <div className="rounded-[24px] border border-stone-900/10 overflow-hidden shadow-sm">
                <div className="grid grid-cols-12 text-[11px] font-black bg-stone-50 border-b border-stone-900/5">
                    <div className="col-span-3 py-3.5 pl-4 text-stone-400">항목</div>
                    <div className="col-span-5 py-3.5 text-center bg-stone-900 text-amber-300">아빠와 아들</div>
                    <div className="col-span-4 py-3.5 text-center text-stone-400">일반 용역</div>
                </div>
                {compareData.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 items-stretch border-b border-stone-900/5 last:border-0">
                        <div className="col-span-3 py-4 pl-4 text-[10.5px] font-bold text-stone-500 flex items-center">{item.label}</div>
                        <div className="col-span-5 py-4 px-2 bg-orange-50/70 text-[11.5px] font-black text-stone-900 text-center flex items-center justify-center">{item.us}</div>
                        <div className="col-span-4 py-4 px-2 text-[11px] font-medium text-stone-400 text-center flex items-center justify-center">{item.others}</div>
                    </div>
                ))}
            </div>
        </section>
    );
};

/* ════════════════════════════════════════════
   7. 브랜드 스토리 — 왜 '아빠와 아들'인가
   ════════════════════════════════════════════ */
const StorySection = () => (
    <section className="bg-stone-900 px-6 py-16 relative overflow-hidden" id="story">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="relative z-10">
            <div className="text-amber-400 text-[11px] font-black tracking-[0.3em] uppercase mb-3 text-center">Our Story</div>
            <h2 className="font-display text-[26px] font-black text-white leading-snug text-center mb-8">
                아버지의 15년 기술에,<br />아들이 약속을 더했습니다.
            </h2>

            <div className="grid grid-cols-3 gap-2.5 mb-8">
                {[
                    { img: "father.jpg", role: "아빠", name: "정용원", desc: "대표 · 수석 기술자" },
                    { img: "son.jpg", role: "아들", name: "정형진", desc: "운영 총괄 실장" },
                    { img: "uncle.jpg", role: "삼촌", name: "김승욱", desc: "현장 관리 실장" }
                ].map((m, i) => (
                    <div key={i} className="text-center">
                        <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-stone-800 border border-white/10 mb-2">
                            <img src={m.img} loading="lazy" className="w-full h-full object-cover object-top" alt={`${m.role} ${m.name} ${m.desc}`} />
                        </div>
                        <div className="text-white text-[13px] font-black"><span className="text-[10px] text-amber-400/80 font-bold mr-1">{m.role}</span>{m.name}</div>
                        <div className="text-stone-500 text-[10px] font-bold mt-0.5">{m.desc}</div>
                    </div>
                ))}
            </div>

            <div className="font-display text-stone-300 text-[14.5px] leading-[1.9] space-y-4">
                <p>
                    아버지는 15년째 남의 집 가구를 제 것처럼 만져온 기술자입니다.
                    아들인 저는 그 옆에서 하나를 배웠습니다. <strong className="text-white">"가구가 아니라, 그 집의 살림을 옮기는 일"</strong>이라는 것을요.
                </p>
                <p>
                    그래서 저희는 하청도, 일용직도 쓰지 않습니다.
                    견적서에 적은 금액 그대로 받고, 바닥에 보양재부터 깔고, 다 옮긴 뒤에는 수평계를 올려봅니다.
                    이름과 얼굴을 걸고 일하기에 <strong className="text-white">한 번의 시공이 곧 저희 가족의 간판</strong>이 됩니다.
                </p>
            </div>

            <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
                <p className="text-amber-300 font-display text-[15px] font-bold leading-relaxed">"제 아버지가 하는 일이라, 제가 제일 잘 압니다.<br />믿고 맡기셔도 됩니다."</p>
                <p className="text-stone-500 text-[11px] font-bold mt-2">— 아들 정형진 드림</p>
            </div>
        </div>
    </section>
);

/* ════════════════════════════════════════════
   8. 시공 사례 — 눈으로 확인하는 실력
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
        <section className="bg-[#FBF8F3] px-6 py-14" id="portfolio">
            <div className="mb-6">
                <div className="text-[#E2610F] text-[11px] font-black tracking-[0.3em] uppercase mb-2">Portfolio</div>
                <h2 className="font-display text-[26px] font-black text-stone-900 leading-tight">말보다 사진으로<br />보여드리겠습니다</h2>
                <p className="text-stone-500 text-[13px] mt-2">최근 시공 현장에서 직접 촬영한 기록입니다.</p>
            </div>

            <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-5 -mx-1 px-1">
                {tabs.map((t) => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        className={`flex-shrink-0 px-4 py-2 rounded-full text-[12px] font-black transition-colors ${tab === t.id ? "bg-stone-900 text-white" : "bg-white text-stone-500 border border-stone-900/10"}`}>
                        {t.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
                <AnimatePresence mode="popLayout">
                    {filtered.map((w) => (
                        <motion.figure key={w.img} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
                            className="relative rounded-2xl overflow-hidden bg-stone-200 shadow-sm">
                            <div className="aspect-[4/5]">
                                <img src={w.img} loading="lazy" className="w-full h-full object-cover" alt={`${w.label} — ${w.area} 시공 사례`} />
                            </div>
                            <figcaption className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-stone-950/85 to-transparent pt-8 pb-2.5 px-3">
                                <div className="text-white text-[11.5px] font-black leading-tight">{w.label}</div>
                                <div className="text-stone-300 text-[9.5px] font-bold mt-0.5">📍 {w.area}</div>
                            </figcaption>
                        </motion.figure>
                    ))}
                </AnimatePresence>
            </div>
            <p className="text-center text-[11px] text-stone-400 mt-5">모든 현장은 <strong className="text-stone-600">정용원 대표가 직접</strong> 시공·관리합니다.</p>
        </section>
    );
};

/* ════════════════════════════════════════════
   9. 후기 — 캡처 원본 그대로
   ════════════════════════════════════════════ */
const ReviewSection = () => {
    const captures = [
        { url: "1.jpg", tag: "🥕 당근 후기" }, { url: "2.jpg", tag: "🥕 당근 후기" },
        { url: "3.jpg", tag: "🥕 당근 후기" }, { url: "4.jpg", tag: "🥕 당근 후기" },
        { url: "5.jpg", tag: "🥕 당근 후기" }, { url: "6.jpg", tag: "🏅 숨고 후기" },
        { url: "7.jpg", tag: "🏅 숨고 후기" }, { url: "8.jpg", tag: "🏅 숨고 후기" }
    ];
    const doubled = [...captures, ...captures];
    const quotes = [
        { text: "장롱 이전 작업을 부탁드렸는데 시간 약속을 정확히 지켜주시고, 포장부터 설치까지 깔끔하게 마무리해 주셨어요. 감사합니다!", who: "목동 · 장롱 이전", stars: 5 },
        { text: "아버님이 정말 베테랑이세요. 돌침대 폐기 다른 데선 다 어렵다고 했는데 두 분이 오셔서 한 시간 만에 끝내셨어요.", who: "동탄 · 돌침대 폐기", stars: 5 },
        { text: "부자가 함께 오셔서 그런지 서로 손발이 척척. 바닥 보양까지 해주시고 추가비용 얘기가 한 번도 안 나온 게 제일 좋았습니다.", who: "수원 영통 · 침대 이동", stars: 5 }
    ];
    return (
        <section className="bg-white py-14 overflow-hidden" id="reviews">
            <div className="px-6 mb-6">
                <div className="text-[#E2610F] text-[11px] font-black tracking-[0.3em] uppercase mb-2">Real Reviews</div>
                <h2 className="font-display text-[26px] font-black text-stone-900 leading-tight">저희가 쓴 자랑이 아니라,<br />고객님이 남긴 기록입니다</h2>
            </div>

            {/* 플랫폼 지표 */}
            <div className="px-6 grid grid-cols-2 gap-3 mb-7">
                <div className="bg-[#FFF3EA] border border-orange-200 rounded-2xl p-4">
                    <div className="text-[11px] font-black text-orange-600 mb-1">🥕 당근마켓</div>
                    <div className="text-[22px] font-black text-stone-900 leading-none">5.0 <span className="text-amber-500 text-[14px]">★★★★★</span></div>
                    <div className="text-[10.5px] font-bold text-stone-500 mt-1.5">동네 단골 380+ · 후기 전원 5점</div>
                </div>
                <div className="bg-[#F0F4FF] border border-blue-200 rounded-2xl p-4">
                    <div className="text-[11px] font-black text-blue-600 mb-1">🏅 숨고</div>
                    <div className="text-[22px] font-black text-stone-900 leading-none">5.0 <span className="text-amber-500 text-[14px]">★★★★★</span></div>
                    <div className="text-[10.5px] font-bold text-stone-500 mt-1.5">리뷰 185+ · 본인인증 고수</div>
                </div>
            </div>

            {/* 캡처 슬라이더 */}
            <motion.div className="flex space-x-3 mb-8" animate={{ x: [0, -(252 + 12) * captures.length] }} transition={{ repeat: Infinity, duration: 42, ease: "linear" }}>
                {doubled.map((r, i) => (
                    <div key={i} className="flex-shrink-0 w-[252px] rounded-2xl overflow-hidden border border-stone-900/10 shadow-md relative bg-white">
                        <div className="h-[315px]">
                            <img src={r.url} loading="lazy" className="w-full h-full object-cover object-top" alt={r.tag + " 캡처 원본"} />
                        </div>
                        <div className="absolute top-3 left-3 px-2.5 py-1 bg-stone-950/70 backdrop-blur text-white text-[10px] font-black rounded-full">{r.tag}</div>
                    </div>
                ))}
            </motion.div>

            {/* 텍스트 후기 */}
            <div className="px-6 space-y-3">
                {quotes.map((q, i) => (
                    <motion.blockquote key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                        className="bg-[#FBF8F3] border border-stone-900/5 rounded-2xl p-4">
                        <div className="text-amber-500 text-[12px] mb-1.5" aria-label={`별점 ${q.stars}점`}>{"★".repeat(q.stars)}</div>
                        <p className="text-[13px] text-stone-700 leading-relaxed font-medium">"{q.text}"</p>
                        <footer className="text-[11px] font-bold text-stone-400 mt-2">— {q.who} 고객님</footer>
                    </motion.blockquote>
                ))}
            </div>
        </section>
    );
};

/* ════════════════════════════════════════════
   10. 공식 인증 — 객관적 증거
   ════════════════════════════════════════════ */
const CertSection = () => (
    <section className="bg-[#FBF8F3] px-6 py-14">
        <div className="text-center mb-8">
            <div className="text-[#E2610F] text-[11px] font-black tracking-[0.3em] uppercase mb-2">Verified</div>
            <h2 className="font-display text-[26px] font-black text-stone-900 leading-tight">그래도 못 믿으시겠다면,<br />서류로 보여드립니다</h2>
            <p className="text-stone-500 text-[13px] mt-3">정식 사업자 등록과 플랫폼 인증을 모두 마친 업체입니다.</p>
        </div>
        <div className="space-y-4">
            {[
                { img: "숨고프로필.png", title: "숨고 본인인증 고수", sub: "가구이동·재배치 분야 · 리뷰 5.0 (185+)" },
                { img: "당근.png", title: "당근마켓 공식 동네업체", sub: "화성 병점 기반 · 단골 380+ · 별점 5.0" }
            ].map((c, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    className="bg-white rounded-[22px] border border-stone-900/10 overflow-hidden shadow-sm">
                    <img src={c.img} loading="lazy" className="w-full h-auto block" alt={c.title + " 화면 캡처"} />
                    <div className="px-5 py-4 flex items-center justify-between">
                        <div>
                            <div className="text-[14px] font-black text-stone-900">{c.title}</div>
                            <div className="text-[11px] font-bold text-stone-400 mt-0.5">{c.sub}</div>
                        </div>
                        <span className="flex-shrink-0 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[13px]">✓</span>
                    </div>
                </motion.div>
            ))}
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="bg-white rounded-[22px] border border-stone-900/10 overflow-hidden shadow-sm p-5">
                <div className="rounded-xl overflow-hidden border border-stone-900/10 bg-stone-50">
                    <img src="사업자.png" loading="lazy" className="w-full h-auto block" alt="가구전문가 아빠와 아들 사업자등록증" />
                </div>
                <div className="mt-4 text-center">
                    <div className="text-[14px] font-black text-stone-900">정식 사업자 등록 업체</div>
                    <div className="inline-block mt-1.5 px-3.5 py-1.5 bg-stone-900 rounded-full text-[10.5px] font-bold text-stone-200">사업자등록번호 715-03-03416 · 대표 정용원</div>
                    <p className="text-[10.5px] text-stone-400 font-medium mt-2.5">모든 시공은 법적 보호와 정식 A/S가 보장됩니다.</p>
                </div>
            </motion.div>
        </div>
    </section>
);

/* ════════════════════════════════════════════
   11. 진행 과정 — 예측 가능해야 신뢰가 생긴다
   ════════════════════════════════════════════ */
const ProcessSection = () => {
    const steps = [
        { icon: "📸", title: "사진 1장 보내기", desc: "1분 견적 신청 또는 카톡으로 가구 사진을 보내주세요.", time: "1분" },
        { icon: "🧾", title: "확정 견적 안내", desc: "사진 확인 후 추가금 없는 확정 금액을 알려드립니다.", time: "10분 내" },
        { icon: "🛡️", title: "보양 후 시공", desc: "약속한 날짜에 방문, 바닥 보양부터 시작합니다.", time: "약속일" },
        { icon: "✅", title: "확인 · 사후관리", desc: "수평·마감을 함께 확인하고, 이후 A/S까지 책임집니다.", time: "시공 후" }
    ];
    return (
        <section className="bg-white px-6 py-14">
            <div className="mb-8">
                <div className="text-[#E2610F] text-[11px] font-black tracking-[0.3em] uppercase mb-2">Process</div>
                <h2 className="font-display text-[26px] font-black text-stone-900 leading-tight">신청부터 시공까지,<br />이렇게 진행됩니다</h2>
            </div>
            <div className="relative">
                <div className="absolute left-[27px] top-6 bottom-6 w-0.5 bg-stone-200"></div>
                <div className="space-y-6">
                    {steps.map((s, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -14 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                            className="relative flex items-start gap-4">
                            <div className="relative z-10 w-14 h-14 bg-[#FBF8F3] border border-stone-900/10 rounded-2xl flex items-center justify-center text-[22px] shadow-sm flex-shrink-0">{s.icon}</div>
                            <div className="flex-1 pt-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-[15px] font-black text-stone-900">{i + 1}. {s.title}</h3>
                                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-[9px] font-black">{s.time}</span>
                                </div>
                                <p className="text-stone-500 text-[12.5px] leading-relaxed mt-1">{s.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
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
        <section className="bg-[#FBF8F3] px-6 py-14">
            <h2 className="font-display text-[24px] font-black text-stone-900 mb-6">자주 묻는 질문</h2>
            <div className="bg-white rounded-[22px] border border-stone-900/10 shadow-sm divide-y divide-stone-900/5">
                {faqs.map((f, i) => (
                    <div key={i}>
                        <button onClick={() => setOpenIdx(openIdx === i ? null : i)} aria-expanded={openIdx === i}
                            className="w-full px-5 py-4 flex justify-between items-center text-left gap-3">
                            <span className="text-[14px] font-black text-stone-800">{f.q}</span>
                            <span className="text-[#E2610F] text-lg flex-shrink-0 font-black">{openIdx === i ? "−" : "+"}</span>
                        </button>
                        <AnimatePresence>
                            {openIdx === i && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                    <p className="px-5 pb-4 text-[13px] text-stone-500 leading-relaxed">{f.a}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>
        </section>
    );
};

/* ════════════════════════════════════════════
   13. 견적 위저드 — 4단계, 이탈 없이
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
    { v: "가구이동 (방 ↔ 방)", ic: "🛋️", d: "같은 집 안에서 가구 위치를 옮겨요" },
    { v: "가구이동 (집 ↔ 집)", ic: "🚚", d: "다른 집으로 가구를 옮기고 설치해요" },
    { v: "가구폐기", ic: "♻️", d: "돌침대·장롱 등을 분해해서 버려요" },
    { v: "시스템행거", ic: "📐", d: "행거 설치·이전·수리가 필요해요" },
    { v: "기타", ic: "💬", d: "그 외 가구 관련 도움이 필요해요" }
];
const ITEM_CHIPS = ["장롱/옷장", "침대", "돌침대", "서랍장", "쇼파", "책상·책장", "시스템행거", "기타"];
const TOTAL_STEPS = 4;
const STEP_CHEERS = ["", "생각하신 작업을 골라주세요", "좋아요, 벌써 절반 왔어요!", "거의 다 왔어요!", "마지막이에요 — 딱 10초!"];

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
            confetti({ particleCount: 160, spread: 75, origin: { y: 0.5 }, colors: ["#E2610F", "#ffffff", "#fbbf24"] });
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
            <section className="fixed inset-0 bg-[#FBF8F3] z-[9999] overflow-y-auto no-scrollbar" aria-label="접수 완료">
                <div className="max-w-[480px] mx-auto px-6 py-10 pb-16">
                    <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
                        <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-[0_15px_35px_rgba(16,185,129,0.35)] text-white">✓</div>
                        <h2 className="font-display text-[27px] font-black text-stone-900 mb-3">접수 완료!<br />이제 저희 차례입니다.</h2>
                        <p className="text-stone-500 text-[14px] leading-relaxed">방금 <strong className="text-stone-800">정용원 대표님 휴대폰으로</strong> 알림이 갔어요.<br />영업시간 기준 <strong className="text-[#E2610F]">평균 10분 내</strong>에 연락드립니다.</p>
                    </motion.div>

                    {/* 다음 단계 안내 */}
                    <div className="bg-white border border-stone-900/10 rounded-[22px] p-5 mt-8 shadow-sm">
                        {[
                            { t: "사진·내용 확인", d: "보내주신 정보를 대표가 직접 확인합니다.", state: "now" },
                            { t: "확정 견적 연락", d: "추가금 없는 확정 금액을 안내드립니다.", state: "next" },
                            { t: "날짜 확정 · 시공", d: "편하신 날짜로 예약하고 방문합니다.", state: "next" }
                        ].map((s, i) => (
                            <div key={i} className={`flex items-start gap-3 ${i < 2 ? "pb-4 mb-4 border-b border-stone-900/5" : ""}`}>
                                <span className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-black ${s.state === "now" ? "bg-[#E2610F] text-white" : "bg-stone-100 text-stone-400"}`}>{i + 1}</span>
                                <div>
                                    <div className="text-[13.5px] font-black text-stone-900">{s.t} {s.state === "now" && <span className="text-[10px] text-[#E2610F] ml-1">← 진행 중</span>}</div>
                                    <div className="text-[11.5px] text-stone-500 mt-0.5">{s.d}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* 대표 한마디 */}
                    <div className="bg-stone-900 rounded-[22px] p-5 mt-4 flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-amber-400 flex-shrink-0">
                            <img src="father.jpg" className="w-full h-full object-cover object-top" alt="정용원 대표" />
                        </div>
                        <p className="text-[13px] text-stone-300 leading-relaxed font-medium">"꼼꼼히 확인하고 <strong className="text-amber-300">바로 전화드리겠습니다.</strong><br />모르는 번호로 와도 한 번만 받아주세요!"</p>
                    </div>

                    <a href={KAKAO_URL} target="_blank" rel="noopener" onClick={() => track("kakao_click", { where: "success" })}
                        className="mt-4 w-full h-14 bg-[#FEE500] text-stone-900 rounded-2xl flex items-center justify-center font-black text-[15px]">
                        💬 더 급하시면 카톡으로 먼저 말 걸기
                    </a>

                    {/* 기다리는 동안 신뢰 콘텐츠 */}
                    <div className="mt-10">
                        <h3 className="font-display text-[18px] font-black text-stone-900 mb-4">기다리시는 동안, 저희가 일하는 모습을 구경하세요</h3>
                        <div className="grid grid-cols-2 gap-2.5">
                            {[
                                { img: "A8.jpg", cap: "쇼파 전면 랩핑 보양" },
                                { img: "A2.jpg", cap: "슬라이딩 장롱 이전설치" },
                                { img: "sh4.jpg", cap: "시스템행거 정밀 시공" },
                                { img: "A5.jpg", cap: "원목 침대 재조립" }
                            ].map((w, i) => (
                                <figure key={i} className="relative rounded-xl overflow-hidden">
                                    <div className="aspect-square"><img src={w.img} loading="lazy" className="w-full h-full object-cover" alt={w.cap} /></div>
                                    <figcaption className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-stone-950/80 to-transparent pt-6 pb-2 px-2.5 text-white text-[10px] font-bold">{w.cap}</figcaption>
                                </figure>
                            ))}
                        </div>

                        <div className="bg-white border border-stone-900/10 rounded-2xl p-4 mt-4">
                            <div className="text-amber-500 text-[12px] mb-1">★★★★★</div>
                            <p className="text-[12.5px] text-stone-600 leading-relaxed font-medium">"부자가 함께 오셔서 손발이 척척. 보양까지 해주시고 추가비용 얘기가 한 번도 안 나온 게 제일 좋았어요."</p>
                            <div className="text-[10.5px] font-bold text-stone-400 mt-1.5">— 수원 영통 고객님</div>
                        </div>

                        <p className="font-display text-center text-[13px] text-stone-500 leading-relaxed mt-6">"가구가 아니라 그 집의 살림을 옮기는 일.<br />저희 가족의 이름을 걸고 하겠습니다."</p>
                    </div>

                    <button onClick={() => { setIsExpanded(false); setIsSubmitted(false); setStep(1); setFormData(emptyForm); setAgree(false); }}
                        className="mt-8 w-full py-3 text-stone-400 text-[12px] font-bold underline underline-offset-4">처음 화면으로 돌아가기</button>
                </div>
            </section>
        );
    }

    /* ── 섹션 (접힌 상태) ── */
    if (!isExpanded) {
        return (
            <section id="quote-form" className="bg-stone-900 px-6 py-16 relative overflow-hidden">
                <div className="absolute -bottom-24 -right-16 w-64 h-64 bg-orange-500/15 rounded-full blur-[80px] pointer-events-none"></div>
                <div className="relative z-10 text-center">
                    <div className="inline-block px-3 py-1 bg-amber-400/15 border border-amber-400/25 rounded-full text-amber-300 text-[11px] font-black tracking-wide mb-4">무료 · 1분 · 부담 없음</div>
                    <h2 className="font-display text-[27px] font-black text-white leading-snug">복잡한 건 저희가 할게요.<br />사진 한 장이면 충분합니다.</h2>
                    <p className="text-stone-400 text-[13.5px] mt-3 leading-relaxed">전화 통화가 부담스러우시죠?<br />몇 번의 터치만으로 확정 견적을 받아보세요.</p>

                    {hasDraft ? (
                        <motion.button whileTap={{ scale: 0.97 }} onClick={() => setIsExpanded(true)}
                            className="mt-6 w-full h-16 bg-amber-400 text-stone-900 rounded-2xl flex items-center justify-center gap-2 font-black text-[16px] shadow-[0_18px_35px_-10px_rgba(251,191,36,0.5)]">
                            ↩️ 작성하시던 견적 이어서 하기
                        </motion.button>
                    ) : (
                        <motion.button whileTap={{ scale: 0.97 }} onClick={() => openQuote()}
                            className="mt-6 w-full h-16 bg-[#E2610F] text-white rounded-2xl flex items-center justify-center gap-2 font-black text-[16px] shadow-[0_18px_35px_-10px_rgba(226,97,15,0.6)]">
                            📸 1분 무료 견적 시작하기
                        </motion.button>
                    )}
                    <div className="flex items-center justify-center gap-4 mt-4 text-[11px] font-bold text-stone-500">
                        <span>✓ 입력 자동저장</span><span>✓ 스팸·광고 없음</span><span>✓ 상담 후 정보 파기</span>
                    </div>
                </div>
            </section>
        );
    }

    /* ── 위저드 (펼친 상태) ── */
    return (
        <section id="quote-form" role="dialog" aria-modal="true" aria-label="무료 견적 신청"
            className="fixed inset-0 bg-[#FBF8F3] z-[9999] flex flex-col overflow-hidden" style={{ height: "100dvh" }}>
            <div className="max-w-[480px] mx-auto w-full flex flex-col h-full px-5 pt-4 pb-6">
                {/* 상단 바 */}
                <div className="flex items-center justify-between mb-4">
                    <button onClick={step === 1 ? requestExit : prev} aria-label={step === 1 ? "견적 신청 닫기" : "이전 단계"}
                        className="w-11 h-11 flex items-center justify-center bg-white border border-stone-900/10 rounded-full text-xl text-stone-700 shadow-sm">←</button>
                    <div className="text-[12px] font-black text-stone-500">{step} / {TOTAL_STEPS} 단계</div>
                    <button onClick={requestExit} aria-label="닫기" className="w-11 h-11 flex items-center justify-center text-stone-400 text-lg">✕</button>
                </div>

                {/* 진행 바 */}
                <div className="h-1.5 bg-stone-200 rounded-full mb-5 overflow-hidden">
                    <motion.div className="h-full bg-[#E2610F] rounded-full" animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
                </div>

                <div className="mb-5">
                    <div className="text-[11px] font-black text-[#E2610F] mb-1">{STEP_CHEERS[step]}</div>
                    <h2 className="font-display text-[24px] font-black text-stone-900 leading-tight whitespace-pre-line">
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
                            <motion.div key="s1" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-2.5">
                                {SERVICE_OPTIONS.map((o) => (
                                    <button key={o.v} onClick={() => { setFormData({ ...formData, service: o.v }); next(); }}
                                        className={`w-full p-4 rounded-2xl border-2 text-left flex items-center gap-3.5 transition-all active:scale-[0.98] ${formData.service === o.v ? "bg-orange-50 border-[#E2610F]" : "bg-white border-stone-900/10"}`}>
                                        <span className="text-[26px]" aria-hidden="true">{o.ic}</span>
                                        <span>
                                            <span className="block text-[15px] font-black text-stone-900">{o.v}</span>
                                            <span className="block text-[11.5px] text-stone-400 font-medium mt-0.5">{o.d}</span>
                                        </span>
                                    </button>
                                ))}
                            </motion.div>
                        )}

                        {/* STEP 2 — 가구 + 사진 */}
                        {step === 2 && (
                            <motion.div key="s2" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-5">
                                <div>
                                    <p className="text-[12px] font-black text-stone-500 mb-2">해당하는 가구를 모두 선택해 주세요</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {ITEM_CHIPS.map((item) => {
                                            const on = formData.items.includes(item);
                                            return (
                                                <button key={item} onClick={() => toggleItem(item)}
                                                    className={`h-12 rounded-xl font-bold text-[13.5px] border-2 transition-all ${on ? "bg-orange-50 border-[#E2610F] text-stone-900" : "bg-white border-stone-900/10 text-stone-500"}`}>
                                                    {item} {on && "✓"}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[12px] font-black text-stone-500 mb-2">사진을 올려주시면 견적이 더 정확해요 <span className="text-stone-400 font-bold">(선택, 최대 3장)</span></p>
                                    <div className="grid grid-cols-2 gap-2.5">
                                        <div className={`relative h-24 bg-white border-2 border-dashed border-stone-300 rounded-2xl flex flex-col items-center justify-center ${formData.photos.length >= 3 ? "opacity-40 pointer-events-none" : ""}`}>
                                            <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="absolute inset-0 opacity-0 z-10" aria-label="사진 촬영" />
                                            <div className="text-2xl mb-0.5" aria-hidden="true">📸</div>
                                            <p className="text-[12px] font-bold text-stone-600">지금 촬영</p>
                                        </div>
                                        <div className={`relative h-24 bg-white border-2 border-dashed border-stone-300 rounded-2xl flex flex-col items-center justify-center ${formData.photos.length >= 3 ? "opacity-40 pointer-events-none" : ""}`}>
                                            <input type="file" accept="image/*" multiple onChange={handleFileChange} className="absolute inset-0 opacity-0 z-10" aria-label="앨범에서 선택" />
                                            <div className="text-2xl mb-0.5" aria-hidden="true">🖼️</div>
                                            <p className="text-[12px] font-bold text-stone-600">앨범에서 선택</p>
                                        </div>
                                    </div>
                                    {formData.photos.length > 0 && (
                                        <div className="grid grid-cols-3 gap-2 mt-2.5">
                                            {formData.photos.map((p, i) => (
                                                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-stone-900/10">
                                                    <img src={p.data} alt={`첨부 사진 ${i + 1}`} className="w-full h-full object-cover" />
                                                    <button onClick={() => removePhoto(i)} aria-label="사진 삭제" className="absolute top-1 right-1 w-6 h-6 bg-stone-950/70 text-white rounded-full text-xs font-black flex items-center justify-center">✕</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-[12px] font-black text-stone-500 mb-2">더 알려주실 내용이 있다면 <span className="text-stone-400 font-bold">(선택)</span></p>
                                    <textarea value={formData.detail} onChange={(e) => setFormData({ ...formData, detail: e.target.value })}
                                        className="w-full h-20 bg-white border-2 border-stone-900/10 rounded-2xl p-3.5 text-stone-800 text-[13px] outline-none focus:border-[#E2610F]"
                                        placeholder="예) 장롱 3짝, 안방에서 작은방으로 / 5층인데 엘리베이터 있어요"></textarea>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 3 — 지역 + 일정 */}
                        {step === 3 && (
                            <motion.div key="s3" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-6">
                                <div>
                                    <p className="text-[12px] font-black text-stone-500 mb-2">작업할 지역이 어디인가요?</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {REGION_CHIPS.map((r) => (
                                            <button key={r.city} onClick={() => setFormData({ ...formData, region: r.city, regionEtc: "" })}
                                                className={`py-3 rounded-xl text-[12.5px] font-bold border-2 transition-all ${formData.region === r.city && !formData.regionEtc ? "bg-orange-50 border-[#E2610F] text-stone-900" : "bg-white border-stone-900/10 text-stone-500"}`}>
                                                {r.label}
                                            </button>
                                        ))}
                                    </div>
                                    <input type="text" value={formData.regionEtc} onChange={(e) => setFormData({ ...formData, regionEtc: e.target.value })}
                                        className="mt-2 w-full h-12 bg-white border-2 border-stone-900/10 rounded-xl px-4 text-stone-800 text-[13px] outline-none focus:border-[#E2610F]"
                                        placeholder="다른 지역이면 직접 입력해 주세요 (예: 천안 불당동)" />
                                </div>
                                <div>
                                    <p className="text-[12px] font-black text-stone-500 mb-2">언제쯤이 좋으세요?</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {SCHEDULE_CHIPS.map((sc) => (
                                            <button key={sc} onClick={() => setFormData({ ...formData, schedule: sc })}
                                                className={`h-12 rounded-xl text-[13px] font-bold border-2 transition-all ${formData.schedule === sc ? "bg-orange-50 border-[#E2610F] text-stone-900" : "bg-white border-stone-900/10 text-stone-500"}`}>
                                                {sc === "가능한 한 빨리" ? "🚀 " : ""}{sc}
                                            </button>
                                        ))}
                                    </div>
                                    {formData.schedule === "날짜 직접 선택" && (
                                        <input type="date" min={todayStr} value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            className="mt-2 w-full h-14 bg-white border-2 border-stone-900/10 rounded-xl px-4 text-stone-800 outline-none focus:border-[#E2610F]" />
                                    )}
                                    <p className="text-[11px] text-stone-400 font-medium mt-2">확정이 아니어도 괜찮아요. 통화하면서 편하게 조율해요.</p>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 4 — 연락처 */}
                        {step === 4 && (
                            <motion.div key="s4" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-20 h-16 bg-stone-100 border-2 border-stone-900/10 rounded-2xl flex items-center justify-center text-xl font-black text-stone-400">010</div>
                                    <input type="tel" value={formData.phone.replace("010-", "")}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/[^\d]/g, "").slice(0, 8);
                                            let formatted = val;
                                            if (val.length > 4) formatted = val.slice(0, 4) + "-" + val.slice(4);
                                            setFormData({ ...formData, phone: "010-" + formatted });
                                        }}
                                        placeholder="0000-0000" aria-label="휴대폰 번호"
                                        className="flex-1 h-16 bg-white border-2 border-[#E2610F] rounded-2xl text-stone-900 text-center text-2xl font-black outline-none tracking-wider" />
                                </div>

                                <div className="bg-white border border-stone-900/10 rounded-2xl p-4">
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 w-5 h-5 accent-[#E2610F] flex-shrink-0" />
                                        <span className="text-[12px] text-stone-600 leading-relaxed">
                                            <strong className="text-stone-900">[필수]</strong> 견적 상담을 위한 개인정보 수집·이용에 동의합니다.{" "}
                                            <button type="button" onClick={() => setShowPrivacy((s) => !s)} className="underline text-blue-600">{showPrivacy ? "닫기" : "자세히"}</button>
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

                                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 space-y-1">
                                    {["번호는 견적 안내에만 사용하고 바로 파기해요", "광고·스팸 문자는 절대 보내지 않아요", "영업시간(08~21시) 기준 평균 10분 내 연락드려요"].map((t, i) => (
                                        <p key={i} className="text-[11.5px] font-bold text-emerald-800 flex items-center gap-1.5"><span>✓</span>{t}</p>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* 하단 버튼 */}
                <div className="pt-3">
                    {step === 2 && (
                        <motion.button whileTap={{ scale: 0.97 }} disabled={!canStep2} onClick={next}
                            className="w-full h-14 bg-[#E2610F] text-white rounded-2xl font-black text-[16px] shadow-lg disabled:opacity-40 disabled:shadow-none">
                            {canStep2 ? "다음으로 →" : "가구를 선택하거나 내용을 적어주세요"}
                        </motion.button>
                    )}
                    {step === 3 && (
                        <motion.button whileTap={{ scale: 0.97 }} disabled={!canStep3} onClick={next}
                            className="w-full h-14 bg-[#E2610F] text-white rounded-2xl font-black text-[16px] shadow-lg disabled:opacity-40 disabled:shadow-none">
                            {canStep3 ? "다음으로 →" : "지역을 선택해 주세요"}
                        </motion.button>
                    )}
                    {step === 4 && (
                        <motion.button whileTap={{ scale: 0.97 }} disabled={!canSubmit} onClick={handleSubmit}
                            className="w-full h-16 bg-[#E2610F] text-white rounded-2xl font-black text-[17px] shadow-[0_15px_30px_-8px_rgba(226,97,15,0.55)] disabled:opacity-40 disabled:shadow-none">
                            {loading ? "전송 중..." : "📩 무료 견적 신청 완료하기"}
                        </motion.button>
                    )}
                </div>
            </div>

            {/* 이탈 방지 안내 */}
            <AnimatePresence>
                {showExitGuard && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-stone-950/60 backdrop-blur-sm z-20 flex items-end justify-center" onClick={() => setShowExitGuard(false)}>
                        <motion.div initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }} transition={{ type: "spring", stiffness: 260, damping: 26 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-[480px] bg-white rounded-t-[28px] p-6 pb-8">
                            <div className="text-center mb-5">
                                <div className="text-3xl mb-2">🥺</div>
                                <h3 className="text-[19px] font-black text-stone-900">잠깐만요, 거의 다 하셨어요!</h3>
                                <p className="text-[13px] text-stone-500 mt-2 leading-relaxed">
                                    지금까지 입력하신 내용은 <strong className="text-stone-800">자동 저장</strong>돼요.<br />
                                    {step >= 3 ? "딱 10초면 확정 견적을 받아보실 수 있어요." : "1분만 투자하시면 무료 확정 견적이 도착해요."}
                                </p>
                            </div>
                            <button onClick={() => setShowExitGuard(false)}
                                className="w-full h-14 bg-[#E2610F] text-white rounded-2xl font-black text-[15px] mb-2">이어서 작성하기</button>
                            <button onClick={confirmExit}
                                className="w-full h-12 text-stone-400 text-[13px] font-bold">저장하고 다음에 하기</button>
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
        <footer className="bg-stone-900 text-stone-500 py-12 px-6 pb-44">
            <div className="max-w-[440px] mx-auto">
                <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-amber-400 flex items-center justify-center text-stone-900 font-black text-[13px]">父子</div>
                    <div>
                        <div className="text-white text-[15px] font-black">가구전문가 아빠와 아들</div>
                        <div className="text-[10px] font-bold text-stone-500">경기남부 가구이동 · 이전설치 · 폐기 · 시스템행거</div>
                    </div>
                </div>
                <p className="text-[11px] leading-relaxed opacity-80 mb-6">
                    15년 경력의 가족 기술자가 직접 시공합니다. 파손 전액 책임보상 · 현장 추가금 0원 정찰제 원칙.
                </p>
                <div className="flex flex-wrap gap-2 mb-8">
                    <a href={`tel:${TEL}`} className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[11px] font-bold text-stone-300">📞 {TEL_DISPLAY}</a>
                    <a href={KAKAO_URL} target="_blank" rel="noopener" className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[11px] font-bold text-stone-300">💬 카톡 상담</a>
                    <a href={naverMap} target="_blank" rel="noopener" className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[11px] font-bold text-stone-300">📍 지도 보기</a>
                </div>
                <div className="space-y-1.5 text-[10px] mb-8 font-medium">
                    <p className="text-stone-400">상호명: 가구전문가 아빠와 아들 | 대표자: 정용원</p>
                    <p>사업자등록번호: 715-03-03416</p>
                    <p>소재지: 경기도 화성시 효행로 1068, 604동 2층 G211호</p>
                    <p>대표번호: {TEL_DISPLAY} | 이메일: jung22459369@gmail.com</p>
                    <p>개인정보보호책임자: 정형진</p>
                </div>
                <div className="pt-6 border-t border-white/10 text-[9px] mb-6">
                    <p>© 2026 가구전문가 아빠와 아들. All rights reserved.</p>
                </div>
                <div className="bg-stone-800/60 p-4 rounded-xl text-[9px] leading-relaxed text-stone-500 border border-white/5">
                    <p className="font-bold mb-1">[서비스 이용 안내 및 고지]</p>
                    <p>
                        본 업체는 화물자동차 운수사업법을 준수하며, 가구의 '운송' 자체에 대한 비용을 수취하지 않습니다.
                        고객님께서 지불하시는 비용은 가구의 안전한 처리를 위한 <strong>전용 보양재 포장, 전문 기술이 필요한 분해 및 재조립, 실내 수평 조절 등 기술 서비스</strong>에 대한 공임입니다.
                        단순 이동 시 발생하는 운임은 무료로 제공되며, 당사는 가구 전문 케어 시공업체임을 명시합니다.
                    </p>
                </div>
            </div>
        </footer>
    );
};

/* ════════════════════════════════════════════
   15. 플로팅 하단 바
   ════════════════════════════════════════════ */
const FloatingBar = () => {
    const status = getBizStatus();
    return (
        <div className="fixed bottom-0 left-0 right-0 z-[800] pointer-events-none">
            <div className="max-w-[480px] mx-auto px-4 pb-4 pointer-events-auto">
                <div className="flex justify-center mb-2">
                    <div className="bg-white/95 backdrop-blur-md px-4 py-1.5 rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.12)] border border-stone-900/5 flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            {status.open && <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${status.open ? "bg-emerald-500" : "bg-stone-400"}`}></span>
                        </span>
                        <span className="text-[11px] font-black text-stone-600">{status.text} · {status.sub}</span>
                    </div>
                </div>
                <div className="bg-stone-950/90 backdrop-blur-xl shadow-[0_18px_45px_rgba(0,0,0,0.4)] rounded-[26px] p-2.5 flex gap-2 border border-white/10">
                    <a href={`tel:${TEL}`} onClick={() => track("call_click", { where: "floating" })} aria-label="전화 상담"
                        className="w-14 h-14 bg-white/10 border border-white/10 text-white rounded-[18px] flex items-center justify-center text-xl flex-shrink-0">📞</a>
                    <a href={KAKAO_URL} target="_blank" rel="noopener" onClick={() => track("kakao_click", { where: "floating" })}
                        className="flex-1 h-14 bg-[#FEE500] text-stone-900 rounded-[18px] flex items-center justify-center font-black text-[13.5px]">💬 카톡 문의</a>
                    <motion.button onClick={() => openQuote()} animate={{ scale: [1, 1.03, 1] }} transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
                        className="flex-[1.4] h-14 bg-[#E2610F] text-white rounded-[18px] flex items-center justify-center font-black text-[13.5px] shadow-[0_8px_22px_rgba(226,97,15,0.45)]">
                        📸 1분 무료 견적
                    </motion.button>
                </div>
            </div>
        </div>
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
        <div className="bg-stone-200 min-h-screen">
            <div className="max-w-[480px] mx-auto bg-[#FBF8F3] min-h-screen shadow-2xl relative overflow-x-hidden">
                <Header />
                <Hero />
                <LiveTicker />
                <StatStrip />
                <ServiceSection />
                <WhySection />
                <StorySection />
                <PortfolioSection />
                <ReviewSection />
                <CertSection />
                <ProcessSection />
                <FAQSection />
                <QuoteWizard />
                <Footer />
                <FloatingBar />
            </div>
        </div>
    );
};

const root = createRoot(document.getElementById("root"));
root.render(
    <MotionConfig reducedMotion="user">
        <App />
    </MotionConfig>
);
