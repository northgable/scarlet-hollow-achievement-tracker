// scripts/steam_text_to_json.js
// Usage:
//   node scripts/steam_text_to_json.js steam_dump.txt
// Produces:
//   src/achievements.json

const fs = require("fs");
const path = require("path");

function slugify(str) {
  return (str || "")
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")      // remove punctuation (keeps letters/numbers/_)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");      // spaces/dashes -> _
}

const pctRe = /^\d+(\.\d+)?%$/;

const inputPath = process.argv[2];
if (!inputPath) {
  console.error("Please provide a text file path.\nExample: node scripts/steam_text_to_json.js steam_dump.txt");
  process.exit(1);
}

const raw = fs.readFileSync(inputPath, "utf8");

// Clean lines
const lines = raw
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter(Boolean);

const achievements = [];
for (let i = 0; i < lines.length; i++) {
  if (pctRe.test(lines[i])) {
    const name = lines[i + 1] || "";
    const maybeDesc = lines[i + 2] || "";

    // Description is only present if the next line isn't another percent
    const description = pctRe.test(maybeDesc) ? "" : maybeDesc;

    if (name) achievements.push({ name, description });
  }
}

// Create unique keys
const used = new Set();
const out = achievements.map((a) => {
  let key = slugify(a.name) || "achievement";
  const base = key;
  let n = 2;
  while (used.has(key)) {
    key = `${base}_${n++}`;
  }
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
console.log("Tip: keep your dev server running (npm run dev) and the page will refresh automatically.");