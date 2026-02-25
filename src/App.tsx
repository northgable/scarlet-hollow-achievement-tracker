import { useEffect, useMemo, useState } from "react";
import achievementsData from "./achievements.json";

type Chapter = 0 | 1 | 2 | 3 | 4 | 5;

type Achievement = {
  key: string;
  name: string;
  description: string;
  chapter: Chapter;
  tags?: string[];
};

const STORAGE_KEY = "scarlet_hollow_achievement_tracker_v1";

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

export default function App() {
  const achievements = achievementsData as Achievement[];

  const [doneMap, setDoneMap] = useState<Record<string, boolean>>({});
  const [hideCompleted, setHideCompleted] = useState(true);
  const [viewMode, setViewMode] = useState<"all" | "chapter">("all");
  const [chapter, setChapter] = useState<Chapter>(1);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setDoneMap(loadDoneMap());
  }, []);

  useEffect(() => {
    saveDoneMap(doneMap);
  }, [doneMap]);

  const doneCount = useMemo(
    () => Object.values(doneMap).filter(Boolean).length,
    [doneMap]
  );

  const totalCount = achievements.length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return achievements
      .filter((a) => (viewMode === "chapter" ? a.chapter === chapter : true))
      .filter((a) => (hideCompleted ? !doneMap[a.key] : true))
      .filter((a) => {
        if (!q) return true;
        return (
          a.name.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          (a.tags ?? []).some((t) => t.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
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
  }

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 16, fontFamily: "system-ui" }}>
      <h1 style={{ marginBottom: 6 }}>Scarlet Hollow Achievement Tracker</h1>
      <div style={{ opacity: 0.8, marginBottom: 16 }}>
        Progress: <b>{doneCount}</b> / <b>{totalCount}</b>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
        <label>
          View:&nbsp;
          <select value={viewMode} onChange={(e) => setViewMode(e.target.value as any)}>
            <option value="all">All</option>
            <option value="chapter">By Chapter</option>
          </select>
        </label>

        {viewMode === "chapter" && (
          <label>
            Chapter:&nbsp;
            <select value={chapter} onChange={(e) => setChapter(Number(e.target.value) as Chapter)}>
              <option value={1}>Chapter 1</option>
              <option value={2}>Chapter 2</option>
              <option value={3}>Chapter 3</option>
              <option value={4}>Chapter 4</option>
              <option value={5}>Chapter 5</option>
              <option value={0}>Global / Not chapter-specific</option>
            </select>
          </label>
        )}

        <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={hideCompleted}
            onChange={(e) => setHideCompleted(e.target.checked)}
          />
          Hide completed
        </label>

        <input
          placeholder="Search achievements…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: "1 1 260px", padding: 8 }}
        />

        <button onClick={markAllVisibleDone}>Mark visible as done</button>
        <button onClick={resetAll} style={{ opacity: 0.9 }}>Reset all</button>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {filtered.map((a) => {
          const done = !!doneMap[a.key];
          return (
            <div
              key={a.key}
              style={{
                border: "1px solid #ddd",
                borderRadius: 10,
                padding: 12,
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontWeight: 700 }}>
                  {a.name}{" "}
                  <span style={{ fontWeight: 400, opacity: 0.7 }}>
                    {a.chapter === 0 ? "(Global)" : `(Ch. ${a.chapter})`}
                  </span>
                </div>
                <div style={{ opacity: 0.85, marginTop: 6 }}>{a.description}</div>
                {(a.tags?.length ?? 0) > 0 && (
                  <div style={{ marginTop: 8, opacity: 0.7, fontSize: 12 }}>
                    Tags: {a.tags!.join(", ")}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center" }}>
                <button onClick={() => toggleDone(a.key)}>
                  {done ? "Undo" : "Done"}
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ opacity: 0.75, padding: 12 }}>
            Nothing to show. (Try turning off “Hide completed,” changing chapters, or clearing search.)
          </div>
        )}
      </div>
    </div>
  );
}