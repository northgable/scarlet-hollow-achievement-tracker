import React, { useEffect, useMemo, useRef, useState } from "react";
import achievementsData from "./achievements.json";
import "./theme.css";

type Chapter = 0 | 1 | 2 | 3 | 4 | 5;

type Achievement = {
  key: string;
  name: string;
  description?: string;
  chapter: Chapter;
  tags?: string[];
  guide?: string;
  icon?: string;
  apiname?: string; // used for Steam sync mapping
};

const STORAGE_KEY = "scarlet_hollow_achievement_tracker_v1";
const STEAM_BADGE_KEY = "scarlet_hollow_steam_synced_at_v1";

type SaveFileV1 = {
  version: 1;
  createdAt: string;
  game: "scarlet-hollow";
  doneMap: Record<string, boolean>;
};

function loadDoneMap(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed;
    return {};
  } catch {
    return {};
  }
  
}
function saveDoneMap(map: Record<string, boolean>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

function loadSteamBadge(): string | null {
  try {
    return localStorage.getItem(STEAM_BADGE_KEY);
  } catch {
    return null;
  }
}
function saveSteamBadge(value: string | null) {
  try {
    if (!value) localStorage.removeItem(STEAM_BADGE_KEY);
    else localStorage.setItem(STEAM_BADGE_KEY, value);
  } catch {
    // ignore
  }
}

export default function App() {
  const achievements = ((((achievementsData as any).default ?? achievementsData)) as Achievement[]);

  const [doneMap, setDoneMap] = useState<Record<string, boolean>>({});
  const [hideCompleted, setHideCompleted] = useState(true);

  const [viewMode, setViewMode] = useState<"all" | "chapter">("all");
  const [chapter, setChapter] = useState<Chapter>(0);

  const [search, setSearch] = useState("");

  // Spoiler controls
  const [showDescriptions, setShowDescriptions] = useState(false);
  const [showGuides, setShowGuides] = useState(false);
  const [revealedDescriptions, setRevealedDescriptions] = useState<Record<string, boolean>>({});
  const [revealedGuides, setRevealedGuides] = useState<Record<string, boolean>>({});

  // Toast
  const [toast, setToast] = useState<string>("");
  const toastTimerRef = useRef<number | null>(null);
  function showToast(msg: string) {
    setToast(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(""), 2600);
  }

  // Export / Import
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function exportProgress() {
    const payload: SaveFileV1 = {
      version: 1,
      createdAt: new Date().toISOString(),
      game: "scarlet-hollow",
      doneMap,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scarlet-hollow-progress-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    showToast("Progress exported.");
  }

  function triggerImport() {
    fileInputRef.current?.click();
  }

  function importProgress(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as SaveFileV1;

        if (!parsed || parsed.version !== 1 || parsed.game !== "scarlet-hollow") {
          showToast("That file doesn't look like a Scarlet Hollow save export.");
          return;
        }

        if (!parsed.doneMap || typeof parsed.doneMap !== "object") {
          showToast("Save file is missing progress data.");
          return;
        }

        setDoneMap(parsed.doneMap);
        showToast("Progress imported.");
      } catch (e: any) {
        showToast(`Import failed: ${e?.message || String(e)}`);
      }

      console.log("steam-sync response", res.status, data);

    };
    reader.readAsText(file);
  }

  // Steam sync
  const [steamProfile, setSteamProfile] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [steamSyncedAt, setSteamSyncedAt] = useState<string | null>(null);

  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string;
const turnstileRef = useRef<HTMLDivElement | null>(null);
const turnstileWidgetId = useRef<string | null>(null);

const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

function resetTurnstileToken() {
  setTurnstileToken(null);
  const ts = (window as any).turnstile;
  if (ts && turnstileWidgetId.current) {
    try { ts.reset(turnstileWidgetId.current); } catch {}
  }
}

async function getTurnstileToken(): Promise<string> {
  const ts = (window as any).turnstile;
  if (!ts || !turnstileWidgetId.current) {
    throw new Error("Turnstile not ready yet. Refresh and try again.");
  }

  resetTurnstileToken();

  // Execute invisible challenge
  ts.execute(turnstileWidgetId.current);

  // Wait for callback to set token
  const started = Date.now();
  while (Date.now() - started < 8000) {
    if (turnstileToken) return turnstileToken;
    await new Promise((r) => setTimeout(r, 50));
  }

  throw new Error("Turnstile timed out. Please try again.");
}

useEffect(() => {
  const ts = (window as any).turnstile;
  if (!ts || !turnstileRef.current || !siteKey) return;

  if (!turnstileWidgetId.current) {
    turnstileWidgetId.current = ts.render(turnstileRef.current, {
  sitekey: siteKey,
  size: "invisible",
  callback: (token: string) => setTurnstileToken(token),
  "error-callback": () => setTurnstileToken(null),
  "expired-callback": () => setTurnstileToken(null),
});
  }
}, [siteKey]);

  async function syncFromSteam() {
    const profile = steamProfile.trim();
    if (!profile) {
      showToast("Paste your Steam profile link first.");
      return;
    }

    try {
      setIsSyncing(true);

      const client = achievements
        .filter((a) => a.apiname)
        .map((a) => ({ key: a.key, apiname: a.apiname! }));

        let token = "";
try {
  token = await getTurnstileToken();
} catch (e: any) {
  // In local dev you can allow skipping if you want:
  // token = "dev";
  showToast(e?.message || "Turnstile failed.");
  return;
}
console.log("client length", client.length);
console.log("client sample", client.slice(0, 5));
      const res = await fetch("/api/steam-sync", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ profile, client, turnstileToken: "dev" }),
});

      let data: any = null;
      try {
        data = await res.json();
        console.log("steam-sync response", res.status, data);
      } catch {
        data = null;
      }

      if (!res.ok) {
        const msg =
  data?.error ||
  (typeof data === "string" ? data : null) ||
  `Steam sync failed (HTTP ${res.status}).`;
        showToast(msg);
        return;
      }

      const unlockedKeys: string[] = Array.isArray(data?.unlocked) ? data.unlocked : [];
      const count: number = Number(data?.count || unlockedKeys.length || 0);

      if (unlockedKeys.length > 0) {
        setDoneMap((prev) => {
          const next = { ...prev };
          for (const k of unlockedKeys) next[k] = true;
          return next;
        });
      }

      const badge = new Date().toISOString();
      setSteamSyncedAt(badge);
      saveSteamBadge(badge);

      showToast(`Steam sync complete. Marked ${count} achievements as done.`);
    } catch (err: any) {
      showToast(`Steam sync failed: ${err?.message || String(err)}`);
    } finally {
      setIsSyncing(false);
    }
  }

  function clearSteamBadge() {
    setSteamSyncedAt(null);
    saveSteamBadge(null);
    showToast("Steam badge cleared.");
  }

  // Sticky/pinned controls (no bounce)
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    setDoneMap(loadDoneMap());
    setSteamSyncedAt(loadSteamBadge());
  }, []);

  useEffect(() => {
    saveDoneMap(doneMap);
  }, [doneMap]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    let last = false;

    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const nowPinned = !entry.isIntersecting;
        if (nowPinned !== last) {
          last = nowPinned;
          setIsPinned(nowPinned);
        }
      },
      // rootMargin makes it switch a little earlier and prevents jitter at the exact boundary
      { root: null, threshold: 0, rootMargin: "-12px 0px 0px 0px" }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const doneCount = useMemo(() => Object.values(doneMap).filter(Boolean).length, [doneMap]);
  const totalCount = achievements.length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return achievements
      .filter((a) => (viewMode === "chapter" ? a.chapter === chapter : true))
      .filter((a) => (hideCompleted ? !doneMap[a.key] : true))
      .filter((a) => {
        if (!q) return true;
        return (
          (a.name || "").toLowerCase().includes(q) ||
          (a.description || "").toLowerCase().includes(q) ||
          (a.guide || "").toLowerCase().includes(q) ||
          (a.tags ?? []).some((t) => t.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [achievements, viewMode, chapter, hideCompleted, doneMap, search]);

  function toggleDone(key: string) {
    setDoneMap((prev) => ({ ...prev, [key]: !prev[key] }));
  }
  function markAllVisibleDone() {
    setDoneMap((prev) => {
      const next = { ...prev };
      for (const a of filtered) next[a.key] = true;
      return next;
    });
  }
  function resetAll() {
    setDoneMap({});
    showToast("Progress reset.");
  }

  function toggleRevealDesc(key: string) {
    setRevealedDescriptions((prev) => ({ ...prev, [key]: !prev[key] }));
  }
  function toggleRevealGuide(key: string) {
    setRevealedGuides((prev) => ({ ...prev, [key]: !prev[key] }));
  }
  function resetSpoilers() {
    setShowDescriptions(false);
    setShowGuides(false);
    setRevealedDescriptions({});
    setRevealedGuides({});
    showToast("Spoilers hidden again.");
  }

  const steamBadgeLabel = useMemo(() => {
    if (!steamSyncedAt) return "";
    try {
      const d = new Date(steamSyncedAt);
      return `Steam Synced • ${d.toLocaleString()}`;
    } catch {
      return "Steam Synced";
    }
  }, [steamSyncedAt]);

  return (
    <div className="sh-wrap">
      {toast && <div className="sh-toast">{toast}</div>}

      {/* Banner / hero */}
      <div className="sh-hero">
        <img src={`${import.meta.env.BASE_URL}banner.png`} alt="Scarlet Hollow" />
        <div className="sh-heroBar">
          <h1 className="sh-title">Scarlet Hollow Achievement Tracker</h1>
          <div className="sh-sub">Track progress • Hide spoilers • Optional guides</div>
        </div>
      </div>

      {/* Sticky sentinel: when it scrolls out, controls become pinned */}
      <div ref={sentinelRef} className="sh-stickySentinel" aria-hidden="true" />

      {/* Controls */}
      <div className={`sh-controls ${isPinned ? "is-pinned" : ""}`}>
        <div className="sh-topline">
          <div className="sh-progress">
            <span>Progress:</span> <b>{doneCount}</b> / <b>{totalCount}</b>
            {steamSyncedAt && <span className="sh-pill sh-pillGood">{steamBadgeLabel}</span>}
          </div>

          <div className="sh-topActions">
            <button className="sh-btn" onClick={markAllVisibleDone}>
              Mark visible as done
            </button>
            <button className="sh-btnGhost" onClick={resetAll}>
              Reset all
            </button>
          </div>
        </div>

        <div className="sh-grid">
          <div className="sh-field">
            <div className="sh-label">View</div>
            <select
              className="sh-input"
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as any)}
            >
              <option value="all">All</option>
              <option value="chapter">By Chapter</option>
            </select>
          </div>

          {viewMode === "chapter" && (
            <div className="sh-field">
              <div className="sh-label">Chapter</div>
              <select
                className="sh-input"
                value={chapter}
                onChange={(e) => setChapter(Number(e.target.value) as Chapter)}
              >
                <option value={0}>Global / Not chapter-specific</option>
                <option value={1}>Chapter 1</option>
                <option value={2}>Chapter 2</option>
                <option value={3}>Chapter 3</option>
                <option value={4}>Chapter 4</option>
                <option value={5}>Chapter 5</option>
              </select>
            </div>
          )}

          <div className="sh-field sh-checkField">
            <label className="sh-check">
              <input
                type="checkbox"
                checked={hideCompleted}
                onChange={(e) => setHideCompleted(e.target.checked)}
              />
              <span>Hide completed</span>
            </label>
          </div>

          <div className="sh-field sh-fieldWide">
            <div className="sh-label">Search</div>
            <input
              className="sh-input"
              placeholder="Search achievements (name, description, guide, tags)…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="sh-divider" />

        <div className="sh-bottomline">
          <div className="sh-leftControls">
            <label className="sh-check">
              <input
                type="checkbox"
                checked={showDescriptions}
                onChange={(e) => setShowDescriptions(e.target.checked)}
              />
              <span>Show achievement spoilers (descriptions)</span>
            </label>

            <label className="sh-check">
              <input
                type="checkbox"
                checked={showGuides}
                onChange={(e) => setShowGuides(e.target.checked)}
              />
              <span>Show guides (spoiler)</span>
            </label>

            <button className="sh-btnGhost" onClick={resetSpoilers}>
              Hide spoilers again
            </button>
          </div>

          <div className="sh-rightControls">
            <button className="sh-btnGhost" onClick={exportProgress}>
              Export
            </button>
            <button className="sh-btnGhost" onClick={triggerImport}>
              Import
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importProgress(f);
                e.currentTarget.value = "";
              }}
            />
          </div>
        </div>

        {/* Steam section (auto-hides while pinned via CSS) */}
        <div className="sh-steam">
          <div className="sh-label">Steam profile URL</div>
          <div className="sh-steamRow">
            <input
              className="sh-input sh-steamInput"
              placeholder="Paste your Steam profile link (profile/... or id/...)"
              value={steamProfile}
              onChange={(e) => setSteamProfile(e.target.value)}
            />
            <button className="sh-btn" onClick={syncFromSteam} disabled={isSyncing}>
              {isSyncing ? "Syncing…" : "Sync from Steam"}
            </button>
            <button className="sh-btnGhost" onClick={clearSteamBadge}>
              Clear Steam badge
            </button>
          </div>
          <div className="sh-tip">
            Tip: your profile + Game Details privacy must allow achievement visibility.
          </div>

          <div ref={turnstileRef} style={{ display: "none" }} />

        </div>
      </div>

      {/* List */}
      <div className="sh-list">
        {filtered.map((a) => {
          const done = !!doneMap[a.key];
          const descVisible = showDescriptions || !!revealedDescriptions[a.key];
          const guideVisible = showGuides || !!revealedGuides[a.key];

          return (
            <div key={a.key} className={`sh-card ${done ? "is-done" : ""}`}>
              <div className="sh-left">
                {a.icon ? (
                  <img className="sh-icon" src={a.icon} alt="" loading="lazy" />
                ) : (
                  <div className="sh-icon sh-iconEmpty" />
                )}

                <div className="sh-main">
                  <div className="sh-nameRow">
                    <div className="sh-name">{a.name}</div>
                    <div className="sh-meta">
                      {a.chapter === 0 ? "(Global)" : `(Ch. ${a.chapter})`}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="sh-desc">
                    {a.description ? (
                      descVisible ? (
                        <div>{a.description}</div>
                      ) : (
                        <div className="sh-muted">
                          Description hidden.{" "}
                          <button className="sh-link" onClick={() => toggleRevealDesc(a.key)}>
                            Reveal
                          </button>
                        </div>
                      )
                    ) : (
                      <div className="sh-muted">(No description.)</div>
                    )}
                  </div>

                  {/* Guide */}
                  {a.guide && (
                    <div className="sh-guide">
                      {guideVisible ? (
                        <div>
                          <div className="sh-guideTitle">Guide</div>
                          <div className="sh-pre">{a.guide}</div>
                          {!showGuides && (
                            <button className="sh-link" onClick={() => toggleRevealGuide(a.key)}>
                              Hide guide again
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="sh-muted">
                          Guide hidden.{" "}
                          <button className="sh-link" onClick={() => toggleRevealGuide(a.key)}>
                            Reveal guide
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {(a.tags?.length ?? 0) > 0 && (
                    <div className="sh-tags">Tags: {a.tags!.join(", ")}</div>
                  )}
                </div>
              </div>

              <div className="sh-right">
                <button className="sh-btn" onClick={() => toggleDone(a.key)}>
                  {done ? "Undo" : "Done"}
                </button>

                {!showDescriptions && a.description && (
                  <button className="sh-btnGhost" onClick={() => toggleRevealDesc(a.key)}>
                    {revealedDescriptions[a.key] ? "Hide desc" : "Reveal desc"}
                  </button>
                )}

                {!showGuides && a.guide && (
                  <button className="sh-btnGhost" onClick={() => toggleRevealGuide(a.key)}>
                    {revealedGuides[a.key] ? "Hide guide" : "Reveal guide"}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="sh-empty">
            Nothing to show. (Try turning off “Hide completed,” switching chapters, or clearing search.)
          </div>
        )}
      </div>
    </div>
  );
}