// 빌드 후 Vercel 배포용 public/ 폴더를 생성합니다.
// (GitHub Pages는 루트 파일을 그대로 쓰고, Vercel은 public/을 배포합니다)
import { mkdirSync, readdirSync, copyFileSync, rmSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "public");

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

// 배포에 포함할 파일: 페이지/번들/설정 + 모든 이미지 (한글·공백 파일명 포함)
const EXACT = ["index.html", "app.js", "styles.css", "manifest.json", "robots.txt", "sitemap.xml", "icon.svg"];
const IMG_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

let copied = 0;
for (const name of readdirSync(ROOT)) {
    const full = path.join(ROOT, name);
    if (!statSync(full).isFile()) continue;
    const ext = path.extname(name).toLowerCase();
    if (EXACT.includes(name) || IMG_EXT.has(ext)) {
        copyFileSync(full, path.join(OUT, name));
        copied++;
    }
}

// 최적화된 WebP 이미지 폴더 (img/) 복사
const IMG_DIR = path.join(ROOT, "img");
mkdirSync(path.join(OUT, "img"), { recursive: true });
for (const name of readdirSync(IMG_DIR)) {
    copyFileSync(path.join(IMG_DIR, name), path.join(OUT, "img", name));
    copied++;
}
console.log(`public/ 생성 완료 — ${copied}개 파일 복사`);
