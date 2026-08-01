import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Moon, Check } from "lucide-react";
import { get, post, put } from "@/lib/api";
import { PageTransition } from "@/lib/ui-helpers";

export const Route = createFileRoute("/_authenticated/reflect")({
  component: ReflectPage,
});

const MOODS = [
  { v: "great", e: "😄" },
  { v: "good", e: "😊" },
  { v: "okay", e: "😐" },
  { v: "low", e: "😔" },
  { v: "stressed", e: "😣" },
];

type Reflection = {
  day: string;
  mood: string | null;
  day_rating: number | null;
  triggers: string | null;
  tomorrow: string | null;
};

function ReflectPage() {
  
  const today = new Date().toISOString().slice(0, 10);
  const [mood, setMood] = useState("okay");
  const [rating, setRating] = useState(3);
  const [triggers, setTriggers] = useState("");
  const [tomorrow, setTomorrow] = useState("");
 const [saving, setSaving] = useState(false);
const [saved, setSaved] = useState(false);

const [past, setPast] = useState<Reflection[]>([]); 

  useEffect(() => {
    (async () => {
  
const todayRow = await get<Reflection>("/mood/today");

if (todayRow) {
  setMood(todayRow.mood ?? "okay");
  setRating(todayRow.day_rating ?? 3);
  setTriggers(todayRow.triggers ?? "");
  setTomorrow(todayRow.tomorrow ?? "");
}
// ✅ Fixed: was "/reflection" (404) — correct path is "/reflections".
const list = await get<Reflection[]>("/reflections");
    setPast(list ?? []);
})();
}, []);

  async function save() {
    setSaving(true);
    try{
    
    await put("/reflections",{
        day: today,
        mood,
        day_rating: rating,
        triggers: triggers || null,
        tomorrow: tomorrow || null,
  
    });
   
  
    setSaved(true);
    toast.success("Reflection saved");
    setTimeout(() => setSaved(false), 2200);
  } catch {
        toast.error("Failed to save reflection");
    } finally {
        setSaving(false);
    }
}

  return (
    <PageTransition>
      <div className="space-y-8">
        <header>
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-[var(--shadow-glow)]">
              <Moon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-accent">Evening ritual</p>
              <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Reflect</h1>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground">
            A quiet minute to notice how emotions shaped today's spending — and to set one gentle
            intention for tomorrow.
          </p>
        </header>

        <section className="glass relative space-y-6 rounded-3xl p-6 md:p-8">
          <div>
            <label className="text-sm font-medium">How was your day?</label>
            <div className="mt-3 flex flex-wrap gap-2">
              {MOODS.map((m) => {
                const active = mood === m.v;
                return (
                  <motion.button
                    key={m.v}
                    type="button"
                    onClick={() => setMood(m.v)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.94 }}
                    animate={active ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`rounded-xl border px-3 py-2 text-sm transition ${
                      active
                        ? "border-primary bg-primary/20 text-foreground shadow-[var(--shadow-glow)]"
                        : "border-foreground/10 bg-foreground/5 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="mr-1 text-lg">{m.e}</span>
                    {m.v}
                  </motion.button>
                );
              })}
            </div>
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>Day rating</span>
                <span className="text-lg font-semibold text-foreground tabular-nums">
                  {rating}
                  <span className="text-sm text-muted-foreground">/5</span>
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-full accent-primary"
                style={{
                  background: `linear-gradient(to right, oklch(0.72 0.19 300) 0%, oklch(0.78 0.15 195) ${(rating - 1) * 25}%, oklch(0.6 0 0 / 0.15) ${(rating - 1) * 25}%, oklch(0.6 0 0 / 0.15) 100%)`,
                  height: 6,
                  borderRadius: 999,
                  appearance: "none",
                  WebkitAppearance: "none",
                }}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">What triggered your spending today?</label>
            <textarea
              value={triggers}
              onChange={(e) => setTriggers(e.target.value)}
              rows={3}
              placeholder="Stress, celebration, boredom, a sale…"
              className="mt-2 w-full rounded-xl border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm outline-none transition focus:border-primary focus:bg-foreground/[0.08] focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="text-sm font-medium">What could you do differently tomorrow?</label>
            <textarea
              value={tomorrow}
              onChange={(e) => setTomorrow(e.target.value)}
              rows={3}
              placeholder="One small intention…"
              className="mt-2 w-full rounded-xl border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm outline-none transition focus:border-primary focus:bg-foreground/[0.08] focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <motion.button
            onClick={save}
            disabled={saving}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="relative w-full overflow-hidden rounded-xl bg-gradient-primary px-4 py-3 font-medium text-primary-foreground shadow-[var(--shadow-glow)] disabled:opacity-60"
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
                  <Check className="h-4 w-4" /> Reflection saved
                </motion.span>
              ) : (
                <motion.span
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {saving ? "Saving…" : "Save reflection"}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <p className="text-center text-sm italic text-muted-foreground">
            Every reflection brings you one step closer to mindful spending.
          </p>
        </section>

        {past.length > 0 && (
          <section className="glass rounded-2xl p-6">
            <h2 className="mb-4 text-lg font-semibold">Recent reflections</h2>
            <ul className="space-y-3">
              {past.map((r, i) => (
                <motion.li
                  key={r.day}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-xl border border-foreground/10 bg-foreground/5 p-4"
                >
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{r.day}</span>
                    <span>{r.mood}</span>
                  </div>
                  {r.triggers && <p className="mt-2 text-sm">💭 {r.triggers}</p>}
                  {r.tomorrow && <p className="mt-1 text-sm">🌱 {r.tomorrow}</p>}
                </motion.li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </PageTransition>
  );
}
