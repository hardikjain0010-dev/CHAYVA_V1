import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Check, MoonStar } from "lucide-react";
import { get, post } from "@/lib/api";
import { PageTransition, LoadingSkeleton } from "@/lib/ui-helpers";
import { BRAND_NAME } from "@/lib/brand";
import { useUser } from "@/lib/user-context";
import { useCoaching } from "@/lib/coaching-context";

export const Route = createFileRoute("/_authenticated/reflect")({
  component: ReflectPage,
});

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------

const MOODS = [
  { v: "great", e: "😄", label: "Great" },
  { v: "good", e: "😊", label: "Good" },
  { v: "okay", e: "😐", label: "Okay" },
  { v: "low", e: "😔", label: "Low" },
  { v: "stressed", e: "😣", label: "Stressed" },
];

type Reflection = {
  id?: string;
  day?: string;
  mood?: string | null;
  day_rating?: number | null;
  triggers?: string | null;
  tomorrow?: string | null;
  timestamp?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function ReflectPage() {
  const { user } = useUser();
  const { snapshot, refetch: refetchCoaching } = useCoaching();
  const today = new Date().toISOString().slice(0, 10);

  const [mood, setMood] = useState("okay");
  const [rating, setRating] = useState(3);
  const [triggers, setTriggers] = useState("");
  const [tomorrow, setTomorrow] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [past, setPast] = useState<Reflection[]>([]);

  // AI reflection from coaching snapshot
  const aiSummary = snapshot?.reflection.summary ?? snapshot?.reflection.insight ?? null;
  const aiMood = snapshot?.reflection.latest_mood ?? null;
  const aiTrigger = snapshot?.reflection.latest_trigger ?? null;

  useEffect(() => {
    if (!user?.uid) return;
    const loadReflections = async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await get<Reflection[]>("/moods");
        const sorted = [...(list ?? [])].sort((a, b) =>
          (b.timestamp ?? "").localeCompare(a.timestamp ?? ""),
        );
        setPast(sorted);
        const todayRow = sorted.find(
          (entry) => (entry.day ?? entry.timestamp?.slice(0, 10)) === today,
        );
        if (todayRow) {
          setMood(todayRow.mood ?? "okay");
          setRating(todayRow.day_rating ?? 3);
          setTriggers(todayRow.triggers ?? "");
          setTomorrow(todayRow.tomorrow ?? "");
        }
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Unable to load reflections.");
      } finally {
        setLoading(false);
      }
    };
    void loadReflections();
  }, [today, user?.uid]);

  async function save() {
    if (!user?.uid) {
      toast.error("Please sign in first.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await post("/mood", {
        mood,
        day: today,
        day_rating: rating,
        triggers: triggers || null,
        tomorrow: tomorrow || null,
        timestamp: new Date().toISOString(),
      });
      const list = await get<Reflection[]>("/moods");
      const sorted = [...(list ?? [])].sort((a, b) =>
        (b.timestamp ?? "").localeCompare(a.timestamp ?? ""),
      );
      setPast(sorted);
      setSaved(true);
      await refetchCoaching();
      toast.success("Reflection saved.");
      setTimeout(() => setSaved(false), 3000);
      setTriggers("");
      setTomorrow("");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to save reflection.");
      toast.error("Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl space-y-7">
        {/* ================================================================= */}
        {/* HEADER                                                             */}
        {/* ================================================================= */}
        <header>
          <div className="flex items-center gap-3 mb-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-[var(--shadow-glow-sm)]">
              <MoonStar className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="caayva-eyebrow">Evening ritual</p>
              <h1 className="caayva-headline text-2xl text-foreground">Reflect</h1>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground max-w-lg">
            A quiet moment to notice how emotions shaped today. Not to judge — just to understand.
          </p>
        </header>

        {/* ================================================================= */}
        {/* AI OPENING OBSERVATION — context from coaching snapshot            */}
        {/* Only shown when real AI data is available                          */}
        {/* ================================================================= */}
        {aiSummary && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4"
          >
            <p className="caayva-eyebrow mb-2">Something {BRAND_NAME} noticed</p>
            <p className="text-sm leading-relaxed text-foreground/85">{aiSummary}</p>
            {(aiMood || aiTrigger) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {aiMood && <span className="behavior-tag">Latest mood: {aiMood}</span>}
                {aiTrigger && <span className="behavior-tag">Trigger noted: {aiTrigger}</span>}
              </div>
            )}
          </motion.div>
        )}

        {/* ================================================================= */}
        {/* REFLECTION FORM                                                    */}
        {/* ================================================================= */}
        <section className="glass rounded-3xl p-6 md:p-8 space-y-6">
          {/* Mood — prominent */}
          <div>
            <p className="caayva-eyebrow mb-3">How was your day?</p>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((m) => {
                const active = mood === m.v;
                return (
                  <motion.button
                    key={m.v}
                    type="button"
                    onClick={() => setMood(m.v)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.94 }}
                    animate={active ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                    transition={{ duration: 0.25 }}
                    className={`mood-pill ${active ? "active" : ""}`}
                  >
                    <span className="text-base">{m.e}</span>
                    {m.label}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Day rating */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="caayva-eyebrow">Day rating</p>
              <span className="text-lg font-bold tabular-nums">
                {rating}
                <span className="text-sm font-normal text-muted-foreground">/5</span>
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="w-full"
              style={{
                accentColor: "oklch(0.55 0.24 300)",
                height: 6,
                borderRadius: 999,
                appearance: "none",
                WebkitAppearance: "none",
                background: `linear-gradient(to right, oklch(0.55 0.24 300) 0%, oklch(0.65 0.19 320) ${
                  (rating - 1) * 25
                }%, oklch(0.6 0 0 / 0.15) ${(rating - 1) * 25}%, oklch(0.6 0 0 / 0.15) 100%)`,
              }}
              aria-label="Day rating 1 to 5"
            />
            <div className="flex justify-between mt-1">
              {["1", "2", "3", "4", "5"].map((n) => (
                <span key={n} className="text-[0.6rem] text-muted-foreground opacity-50">
                  {n}
                </span>
              ))}
            </div>
          </div>

          {/* Triggers */}
          <div>
            <label className="caayva-eyebrow block mb-2" htmlFor="reflect-triggers">
              What drove today's choices?
            </label>
            <textarea
              id="reflect-triggers"
              value={triggers}
              onChange={(e) => setTriggers(e.target.value)}
              rows={3}
              placeholder="Stress, celebration, boredom, a sale, tiredness… or nothing in particular"
              className="profile-input resize-none"
            />
          </div>

          {/* Tomorrow */}
          <div>
            <label className="caayva-eyebrow block mb-2" htmlFor="reflect-tomorrow">
              One gentle intention for tomorrow
            </label>
            <textarea
              id="reflect-tomorrow"
              value={tomorrow}
              onChange={(e) => setTomorrow(e.target.value)}
              rows={2}
              placeholder="A small, specific thing you might notice or try differently…"
              className="profile-input resize-none"
            />
          </div>

          {/* Error */}
          {error && <p className="text-sm text-destructive">{error}</p>}

          {/* Save button */}
          <motion.button
            onClick={save}
            disabled={saving}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="relative w-full overflow-hidden rounded-2xl bg-gradient-primary py-3.5 text-base font-semibold text-primary-foreground shadow-[var(--shadow-glow)] disabled:opacity-60"
          >
            <AnimatePresence mode="wait">
              {saved ? (
                <motion.span
                  key="saved"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex items-center justify-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  Reflection saved
                </motion.span>
              ) : (
                <motion.span
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                      Saving…
                    </span>
                  ) : (
                    "Save reflection"
                  )}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <p className="text-center text-xs italic text-muted-foreground">
            {BRAND_NAME} is here to help you understand, not to judge.
          </p>
        </section>

        {/* ================================================================= */}
        {/* RECENT REFLECTIONS                                                 */}
        {/* ================================================================= */}
        {loading ? (
          <div className="glass rounded-2xl p-5">
            <LoadingSkeleton lines={3} />
          </div>
        ) : past.length > 0 ? (
          <section className="glass rounded-2xl p-6">
            <p className="caayva-eyebrow mb-4">Recent reflections</p>
            <ul className="space-y-2.5">
              {past.slice(0, 7).map((r, i) => (
                <motion.li
                  key={r.id ?? `${r.day ?? "entry"}-${i}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-xl border border-foreground/8 bg-foreground/[0.03] p-4"
                >
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span className="font-medium">{r.day ?? r.timestamp?.slice(0, 10)}</span>
                    <span className="flex items-center gap-1.5">
                      {r.mood && <span>{MOODS.find((m) => m.v === r.mood)?.e ?? "•"}</span>}
                      <span className="capitalize">{r.mood}</span>
                      {r.day_rating != null && (
                        <span className="ml-1 text-muted-foreground opacity-60">
                          · {r.day_rating}/5
                        </span>
                      )}
                    </span>
                  </div>
                  {r.triggers && (
                    <p className="text-sm text-foreground/80">
                      <span className="mr-1 text-muted-foreground">Triggered by:</span>
                      {r.triggers}
                    </p>
                  )}
                  {r.tomorrow && (
                    <p className="mt-1 text-sm text-foreground/70">
                      <span className="mr-1 text-muted-foreground">Tomorrow:</span>
                      {r.tomorrow}
                    </p>
                  )}
                </motion.li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </PageTransition>
  );
}
