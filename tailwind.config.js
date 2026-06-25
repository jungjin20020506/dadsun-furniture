/** Tailwind 정적 빌드 설정 — 실제 사용된 클래스만 추려 작은 styles.css를 만듭니다. */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: { extend: {} },
  plugins: [],
};
