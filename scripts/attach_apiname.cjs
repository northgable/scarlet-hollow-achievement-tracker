require("dotenv").config();

const fs = require("fs");
const path = require("path");

const APPID = 1609230; // Scarlet Hollow
const KEY = process.env.STEAM_API_KEY;

if (!KEY) {
  console.error("❌ Missing STEAM_API_KEY. Ensure .env exists in project root.");
  process.exit(1);
}

function normalizeName(s = "") {
  return String(s)
    .toLowerCase()
    .replace(/&amp;/g, "&")
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function main() {
  const achievementsPath = path.join(__dirname, "..", "src", "achievements.json");
  const achievements = JSON.parse(fs.readFileSync(achievementsPath, "utf8"));

  const url =
    `https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/` +
    `?key=${encodeURIComponent(KEY)}&appid=${APPID}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Schema request failed: ${res.status}`);
  const data = await res.json();

  const schema = data?.game?.availableGameStats?.achievements ?? [];

  // normalized displayName -> apiname
  const nameToApi = new Map();
  for (const a of schema) {
    if (a?.displayName && a?.name) {
      nameToApi.set(normalizeName(a.displayName), a.name);
    }
  }

  let matched = 0;
  let missing = 0;

  const out = achievements.map((a) => {
    const api = nameToApi.get(normalizeName(a.name));
    if (api) matched++;
    else missing++;
    return { ...a, apiname: api || a.apiname };
  });

  fs.writeFileSync(achievementsPath, JSON.stringify(out, null, 2), "utf8");
  console.log(`✅ Added apiname for ${matched} achievements. Missing: ${missing}.`);
  console.log(`📄 Updated: ${achievementsPath}`);
}

main().catch((e) => {
  console.error("❌", e);
  process.exit(1);
});