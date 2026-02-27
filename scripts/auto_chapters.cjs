// scripts/auto_chapters.cjs
// Usage:
//   node .\scripts\auto_chapters.cjs
// Reads src/achievements.json and auto-fills chapter if it sees Episode numbers.

const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const jsonPath = path.join(projectRoot, "src", "achievements.json");

const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

function inferChapter(text) {
  if (!text) return 0;

  // Matches:
  // "Episode 4"
  // "Episode 1."
  // "Episodes 4 and 5"
  // "Episodes 4 & 5"
  const m = text.match(/\bEpisode(?:s)?\s+([1-5])\b/i);
  if (m) return Number(m[1]);

  return 0;
}

let changed = 0;
const counts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

for (const a of data) {
  const before = a.chapter ?? 0;

  const fromDesc = inferChapter(a.description);
  const fromName = inferChapter(a.name);

  const chapter = fromDesc || fromName || 0;

  a.chapter = chapter;
  counts[chapter]++;

  if (before !== chapter) changed++;
}

fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), "utf8");

console.log(`✅ Updated chapters. Changed: ${changed}`);
console.log("Counts by chapter:", counts);

// Show a few examples so you can see it worked
const examples = data.filter(x => x.chapter !== 0).slice(0, 5);
console.log(
  "Examples:",
  examples.map(x => `Ch ${x.chapter}: ${x.name}`).join(" | ")
);