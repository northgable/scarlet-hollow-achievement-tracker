// scripts/fetch_icons.cjs
// Fetch Scarlet Hollow achievement icons from Steam Community stats page
// and merge them into src/achievements.json (preserves your guides).

const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

// Node 18+ has fetch built-in; you're on Node 24 so you're good.
const STEAM_ACH_PAGE = "https://steamcommunity.com/stats/1609230/achievements";

function normName(s) {
  return (s || "")
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

async function main() {
  console.log("Fetching:", STEAM_ACH_PAGE);
  const res = await fetch(STEAM_ACH_PAGE, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const html = await res.text();

  const $ = cheerio.load(html);

  // Grab all images that look like achievement icons for this app.
  const iconImgs = $('img[src*="steamcommunity/public/images/apps/1609230/"]');

  const steamMap = new Map(); // normName -> iconUrl

  iconImgs.each((_, img) => {
    const iconUrl = $(img).attr("src");
    if (!iconUrl) return;

    // Try to find the achievement name near the image.
    // Steam pages usually have the name in a nearby <h3>.
    const container = $(img).parent().parent(); // tolerant-ish
    let name =
      container.find("h3").first().text().trim() ||
      $(img).closest("div, tr, li").find("h3").first().text().trim();

    // Extra fallback: look at following siblings
    if (!name) {
      name = $(img).parent().nextAll().find("h3").first().text().trim();
    }

    if (!name) return;

    const key = normName(name);
    if (!steamMap.has(key)) steamMap.set(key, iconUrl);
  });

  console.log("Found Steam icons:", steamMap.size);

  const projectRoot = path.resolve(__dirname, "..");
  const jsonPath = path.join(projectRoot, "src", "achievements.json");
  const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

  let matched = 0;

  for (const a of data) {
    const k = normName(a.name);
    const icon = steamMap.get(k);
    if (icon) {
      a.icon = icon; // NEW FIELD
      matched++;
    }
  }

  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), "utf8");
  console.log(`✅ Wrote icons into achievements.json. Matched: ${matched}/${data.length}`);
  console.log("Tip: if matched is low, tell Nova and we’ll tweak the selector.");
}

main().catch((e) => {
  console.error("❌", e);
  process.exit(1);
});