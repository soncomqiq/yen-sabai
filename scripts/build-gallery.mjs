import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { resolve, relative, dirname } from "node:path";
import postcss from "postcss";

const source = resolve(
  process.env.GALLERY_SOURCE ?? "screenshots/redesign/final",
);
const output = resolve("gallery/index.html");
const manifest = JSON.parse(
  await readFile(resolve(source, "manifest.json"), "utf8"),
);
const css = postcss.parse(await readFile("src/styles.css", "utf8"));
const tokens = new Map();
css.walkDecls((declaration) => {
  if (declaration.prop.startsWith("--"))
    tokens.set(declaration.prop, declaration.value);
});
const escape = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const groups = [
  "desktop",
  "mobile",
  "full-page/desktop",
  "full-page/mobile",
  "documents",
];
const names = {
  desktop: "Desktop 1440px",
  mobile: "Mobile 390px",
  "full-page/desktop": "Desktop Full Page",
  "full-page/mobile": "Mobile Full Page",
  documents: "ใบเสนอราคา A4",
};
const sections = [];
for (const group of groups) {
  const images = manifest.files.filter((item) => dirname(item.file) === group);
  const figures = [];
  for (const item of images) {
    const path = resolve(source, item.file);
    await access(path);
    const url = relative(dirname(output), path)
      .split("/")
      .map(encodeURIComponent)
      .join("/");
    figures.push(
      `<figure><a href="${url}" target="_blank" rel="noopener"><img src="${url}" alt="${escape(item.title)}" loading="lazy"></a><figcaption><strong>${escape(item.title)}</strong><small>${escape(item.file)}</small></figcaption></figure>`,
    );
  }
  sections.push(
    `<section id="${group.replaceAll("/", "-")}"><h2>${names[group]}</h2><div class="gallery-grid ${group.includes("mobile") ? "mobile-grid" : ""}">${figures.join("")}</div></section>`,
  );
}
const html = `<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>เย็นสบาย | Design Gallery</title><style>
@font-face{font-family:PlexThai;src:url('../public/fonts/IBMPlexSansThai-Regular.ttf')}@font-face{font-family:PlexThai;src:url('../public/fonts/IBMPlexSansThai-SemiBold.ttf');font-weight:600}
:root{${[...tokens].map(([key, value]) => `${key}:${value}`).join(";")}}*{box-sizing:border-box}body{margin:0;background:var(--canvas);color:var(--ink);font:14px/1.7 PlexThai,sans-serif}main{max-width:1360px;margin:auto;padding:var(--space-8)}header{padding-bottom:var(--space-6);border-bottom:1px solid var(--border)}h1{font-size:var(--text-page);margin:0;font-weight:600}h2{font-size:var(--text-section);margin:var(--space-8) 0 var(--space-4)}p{margin:var(--space-2) 0;color:var(--muted)}nav{display:flex;gap:var(--space-6);flex-wrap:wrap;margin-top:var(--space-4)}a{color:var(--accent);text-decoration:none}a:focus-visible{outline:2px solid var(--accent);outline-offset:2px}.gallery-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--space-8)}.mobile-grid{grid-template-columns:repeat(3,minmax(0,1fr))}figure{margin:0;min-width:0;padding-bottom:var(--space-4);border-bottom:1px solid var(--border)}img{width:100%;height:auto;display:block;border:1px solid var(--border)}figcaption{padding-top:var(--space-3)}strong,small{display:block}small{font-size:var(--text-meta);color:var(--muted);overflow-wrap:anywhere}@media(max-width:700px){main{padding:var(--space-4)}.gallery-grid,.mobile-grid{grid-template-columns:minmax(0,1fr)}}
</style></head><body><main><header><h1>ร้านเย็นสบาย Design Gallery</h1><p>ภาพระบบตัวอย่าง ข้อมูลทั้งหมดเป็นข้อมูลสมมติ</p><p>${manifest.files.length} ภาพจาก Playwright วันที่ ${escape(manifest.capturedAt.slice(0, 10))}</p><nav>${groups.map((group) => `<a href="#${group.replaceAll("/", "-")}">${names[group]}</a>`).join("")}</nav></header>${sections.join("")}</main></body></html>`;
await mkdir(dirname(output), { recursive: true });
await writeFile(output, html);
console.log(
  `Gallery generated with ${manifest.files.length} verified images: ${output}`,
);
