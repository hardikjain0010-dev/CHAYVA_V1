import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { MapPin, Flag, Sparkles, Flame, Compass, Trophy, Award } from "lucide-react";
import { useExpenses } from "@/lib/expense-context";
import { PageTransition } from "@/lib/ui-helpers";
export const Route = createFileRoute("/_authenticated/journey")({
  component: JourneyPage,
});
// Backend Expense type — uses `date` (not `spent_at` or `created_at`).
type Expense = {
  id: string;
  amount: number;
  category: string;
  notes: string | null;
  mood: string | null;
  date: string; // ISO string from backend
  source: string;
};
function daysAgo(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}
function bucketLabel(days: number) {
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "1 week ago";
  if (days < 28) return `${Math.round(days / 7)} weeks ago`;
  if (days < 60) return "1 month ago";
  return `${Math.round(days / 30)} months ago`;
}
type Milestone = {
  icon: React.ComponentType<{ className?: string }>;
  when: string;
  title: string;
  desc: string;
  tone: "primary" | "accent" | "success";
};
function JourneyPage() {
  // ✅ Single source of truth — reads from shared ExpenseProvider context.
  // No independent fetch, no local state, no non-existent /insights/count endpoint.
  // Field mapping: backend returns `date` (not `spent_at` or `created_at`).
  const { expenses, loading } = useExpenses();

  const milestones = useMemo<Milestone[]>(() => {
    if (expenses.length === 0) return [];
    const events: Milestone[] = [];

    // Expenses from context are sorted newest-first; reverse to get chronological order.
    const chronological = [...expenses].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const first = chronological[0];
    events.push({
      icon: Flag,
      when: bucketLabel(daysAgo(first.date)),
      title: "First Expense",
      desc: `You started your journey with ₹${first.amount.toFixed(2)} on ${first.category}.`,
      tone: "primary",
    });

      // Streak: max consecutive days with expenses — using `date` field
    const days = Array.from(
      new Set(chronological.map((e) => e.date.slice(0, 10)))
    ).sort();
    let maxStreak = 1;
    let cur = 1;
    for (let i = 1; i < days.length; i++) {
      const prev = new Date(days[i - 1]).getTime();
      const next = new Date(days[i]).getTime();
      if (next - prev === 86400000) {
        cur++;
        maxStreak = Math.max(maxStreak, cur);
      } else cur = 1;
    }
    if (maxStreak >= 3) {
      events.push({
        icon: Flame,
        when: "This month",
        title: `${maxStreak}-Day Logging Streak`,
        desc: "Consistent awareness is the compound interest of self-knowledge.",
        tone: "primary",
      });
    }
    const firstMood = chronological.find((e) => e.mood);
    if (firstMood) {
      events.push({
        icon: Compass,
        when: bucketLabel(daysAgo(firstMood.date)),
        title: "Tuned into your mood",
        desc: `You began noticing how you felt (${firstMood.mood}) while spending.`,
        tone: "accent",
      });
    }
// Insight milestone: count of expenses is a proxy for engagement.
    if (expenses.length >= 5) {
      events.push({
        icon: Sparkles,
        when: "Along the way",
        title: "Building Awareness",
        desc: `Chayva has been analyzing your patterns across ${expenses.length} logged purchase${expenses.length === 1 ? "" : "s"}.`,
        tone: "accent",
      });
    }

    const recentGood = expenses.filter(
      (e) => daysAgo(e.date) <= 14 && (e.mood === "happy" || e.mood === "social"),
    );
    if (recentGood.length >= 3) {
      events.push({
        icon: Trophy,
        when: "Recently",
        title: "Mindful Streak",
        desc: `${recentGood.length} calm, considered purchases in the last two weeks.`,
        tone: "success",
      });
    }
     if (expenses.length >= 25) {
      events.push({
        icon: Award,
        when: "Milestone",
        title: `${expenses.length} Purchases Tracked`,
        desc: "You're building the clearest picture of your money story.",
        tone: "primary",
      });
    }
     events.push({
      icon: MapPin,
      when: "Today",
      title: "Where you are now",
      desc: "Better awareness of your spending patterns and emotional triggers.",
      tone: "accent",
    });
    return events;
  }, [expenses]);
  const toneClass: Record<Milestone["tone"], string> = {
    primary: "bg-gradient-primary text-primary-foreground",
    accent: "bg-accent/20 text-accent border border-accent/30",
    success: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  };
  return (
    <PageTransition>
      <div className="space-y-8">
        <header>
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-[var(--shadow-glow)]">
              <MapPin className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-accent">Milestones</p>
              <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Your Journey</h1>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground">
            Every expense tells a story. These are the moments and habits that have shaped your
            financial behavior — how far you've come, and where you're headed.
          </p>
        </header>
         {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass h-32 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : milestones.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center text-muted-foreground">
            Log a few expenses and your journey will start writing itself here.
          </div>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2">
            {milestones.map((m, i) => (
              <motion.article
                key={i}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4 }}
                className="glass relative overflow-hidden rounded-2xl p-6"
              >
                <div className="flex items-start gap-4">
                  <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl shadow-[var(--shadow-glow)] ${toneClass[m.tone]}`}>
                    <m.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                      {m.when}
                    </div>
                    <h3 className="mt-1 text-lg font-semibold">{m.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{m.desc}</p>
                  </div>
                </div>
              </motion.article>
            ))}
          </section>
        )}
        <p className="text-center text-sm italic text-muted-foreground">
          Progress isn't measured by spending less — it's measured by understanding yourself better.
        </p>
      </div>
    </PageTransition>
  );
}
