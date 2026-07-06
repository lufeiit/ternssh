#!/usr/bin/env node
/**
 * Transform in-repo wiki/ markdown for GitHub Wiki (flat page names, updated links).
 * Usage: node scripts/migrate-wiki.mjs <output-dir>
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { join, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repo = process.env.GITHUB_REPOSITORY ?? "HaradaKashiwa/ternssh";
const REPO = `https://github.com/${repo}`;
const WIKI_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../wiki");
const outDir = process.argv[2];

if (!outDir) {
  console.error("Usage: node scripts/migrate-wiki.mjs <output-dir>");
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

function wikiPage(lang, name) {
  return `${lang}-${basename(name, ".md")}`;
}

function transformLinks(content) {
  return content
    .replace(/\]\(\.\.\/\.\.\/README\.md\)/g, `](${REPO}/blob/main/README.md)`)
    .replace(/\]\(\.\.\/\.\.\/README\.en\.md\)/g, `](${REPO}/blob/main/README.en.md)`)
    .replace(/\]\(\.\.\/README\.md\)/g, "](Home)")
    .replace(/\]\(\.\.\/README\.en\.md\)/g, "](Home)")
    .replace(/\]\(\.\.\/\.\.\/([^)]+)\)/g, (_, path) => `](${REPO}/blob/main/${path})`)
    .replace(/\]\(\.\.\/(zh|en)\/([^)]+\.md)\)/g, (_, lang, file) => `](${wikiPage(lang, file)})`)
    .replace(/\]\((zh|en)\/([^)]+\.md)\)/g, (_, lang, file) => `](${wikiPage(lang, file)})`);
}

function writePage(filename, content) {
  writeFileSync(join(outDir, filename), transformLinks(content));
}

const readme = readFileSync(join(WIKI_ROOT, "README.md"), "utf8");
writePage(
  "Home.md",
  readme.replace(
    "> [← 项目 README](../README.md) · [English README](../README.en.md)",
    `> [← 项目 README](${REPO}/blob/main/README.md) · [English README](${REPO}/blob/main/README.en.md)`,
  ),
);

for (const lang of ["zh", "en"]) {
  const dir = join(WIKI_ROOT, lang);
  for (const file of readdirSync(dir)) {
    if (file.startsWith("_")) continue;
    writePage(`${wikiPage(lang, file)}.md`, readFileSync(join(dir, file), "utf8"));
  }
}

const zhSidebar = readFileSync(join(WIKI_ROOT, "zh/_Sidebar.md"), "utf8")
  .split("\n")
  .slice(1)
  .map((line) => line.replace(/\]\(([^)]+)\)/g, (_, page) => `](zh-${page})`))
  .join("\n");

const enSidebar = readFileSync(join(WIKI_ROOT, "en/_Sidebar.md"), "utf8")
  .split("\n")
  .slice(1)
  .map((line) => line.replace(/\]\(([^)]+)\)/g, (_, page) => `](en-${page})`))
  .join("\n");

writePage(
  "_Sidebar.md",
  `**[Wiki Home](Home)**

### 中文
${zhSidebar}

### English
${enSidebar}
`,
);

console.log(`Wrote GitHub Wiki pages to ${outDir}`);
