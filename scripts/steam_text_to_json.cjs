// scripts/steam_text_to_json.cjs
// Usage:
//   node .\scripts\steam_text_to_json.cjs .\steam_dump.txt
// Output:
//   src/achievements.json (ONLY if it finds achievements)

const fs = require("fs");
const path = require("path");

function slugify(str) {
  return (str || "")
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

const inputPath = process.argv[2];
if (!inputPath) {
  console.error(
    "❌ Please provide a text file path.\nExample: node .\\scripts\\steam_text_to_json.cjs .\\steam_dump.txt"
  );
  process.exit(1);
}

const raw = fs.readFileSync(inputPath, "utf8");

// Clean lines
const lines = raw
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter(Boolean);

// Steam copy usually has lines like "86.2%" on their own line
const pctRe = /^\d+(?:\.\d+)?%$/;

const achievements = [];
for (let i = 0; i < lines.length; i++) {
  if (pctRe.test(lines[i])) {
    const name = lines[i + 1] || "";
    const next = lines[i + 2] || "";
    const description = pctRe.test(next) ? "" : next;

    if (name) achievements.push({ name, description });
  }
}

console.log(`ℹ️ Achievements parsed: ${achievements.length}`);

if (achievements.length === 0) {
  console.error(
    "❌ Parsed 0 achievements. Not overwriting src/achievements.json.\n" +
      "Try re-copying from Steam (scroll to bottom first), then try again."
  );
  process.exit(1);
}

// Unique keys + initial fields
const used = new Set();
const out = achievements.map((a) => {
  let key = slugify(a.name) || "achievement";
  const base = key;
  let n = 2;
  while (used.has(key)) key = `${base}_${n++}`;
  used.add(key);

  return {
    key,
    name: a.name,
    description: a.description,
    chapter: 0,
    tags: []
  };
});

// Write to src/achievements.json
const projectRoot = path.resolve(__dirname, "..");
const outPath = path.join(projectRoot, "src", "achievements.json");
fs.writeFileSync(outPath, JSON.stringify(out, null, 2), "utf8");

console.log(`✅ Wrote ${out.length} achievements to ${outPath}`);