// 원본 사진(JPG/PNG)을 모바일에 맞는 크기의 WebP로 변환합니다.
// 실행: node scripts/optimize-images.mjs  (빌드에 자동 포함)
// 원본 파일은 그대로 두고, img/ 폴더에 최적화본을 생성합니다.
import sharp from "sharp";
import { mkdirSync, existsSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "img");
mkdirSync(OUT, { recursive: true });

// [원본, 출력이름, 최대 가로폭(px), 품질]
// 폭은 "모바일 2x 해상도에서 실제 렌더 크기" 기준으로 정했습니다.
const JOBS = [
    // 히어로/대표 사진 (LCP) — 화면 전체 폭
    ["father.jpg", "father.webp", 1080, 78],
    // 팀 소개 (3열 카드)
    ["son.jpg", "son.webp", 520, 74],
    ["uncle.jpg", "uncle.webp", 520, 74],
    // 서비스 카드 (모바일 전체 폭, 16:10)
    ["A6.jpg", "A6.webp", 800, 62],
    ["A7.jpg", "A7.webp", 960, 74],
    ["A8.jpg", "A8.webp", 960, 74],
    ["sh.jpg", "sh.webp", 960, 74],
    // 시공사례 그리드 (모바일 2열)
    ["A1.jpg", "A1.webp", 640, 72],
    ["A2.jpg", "A2.webp", 640, 72],
    ["A4.jpg", "A4.webp", 640, 72],
    ["A5.jpg", "A5.webp", 640, 72],
    ["A9.jpg", "A9.webp", 640, 72],
    ["sh4.jpg", "sh4.webp", 640, 72],
    ["sh k.jpg", "sh-k.webp", 640, 72],
    ["sh2.jpg", "sh2.webp", 640, 72],
    ["sh3.jpg", "sh3.webp", 640, 72],
    ["stone2.jpg", "stone2.webp", 640, 72],
    ["stonebad.jpg", "stonebad.webp", 640, 72],
    ["bedframe.jpg", "bedframe.webp", 640, 72],
    ["clo.jpg", "clo.webp", 640, 72],
    // 후기 캡처 (240px 카드 × 2x)
    ["1.jpg", "1.webp", 480, 72],
    ["2.jpg", "2.webp", 480, 72],
    ["3.jpg", "3.webp", 480, 72],
    ["4.jpg", "4.webp", 480, 72],
    ["5.jpg", "5.webp", 480, 72],
    ["6.jpg", "6.webp", 480, 72],
    ["7.jpg", "7.webp", 480, 72],
    ["8.jpg", "8.webp", 480, 72],
    // 인증 스크린샷 (텍스트 가독성 유지 위해 폭·품질 ↑)
    ["숨고프로필.png", "cert-soomgo.webp", 760, 80],
    ["당근.png", "cert-danggeun.webp", 760, 80],
    ["사업자.png", "cert-biz.webp", 760, 80],
];

let total = 0;
for (const [src, out, width, quality] of JOBS) {
    const srcPath = path.join(ROOT, src);
    const outPath = path.join(OUT, out);
    if (!existsSync(srcPath)) {
        console.warn(`⚠ 원본 없음, 건너뜀: ${src}`);
        continue;
    }
    await sharp(srcPath)
        .rotate() // EXIF 회전 반영
        .resize({ width, withoutEnlargement: true })
        .webp({ quality, effort: 5 })
        .toFile(outPath);
    const before = statSync(srcPath).size;
    const after = statSync(outPath).size;
    total += after;
    console.log(`${src} → img/${out}  ${(before / 1024).toFixed(0)}KB → ${(after / 1024).toFixed(0)}KB`);
}
console.log(`✅ 최적화 완료 — 총 ${(total / 1024).toFixed(0)}KB`);
