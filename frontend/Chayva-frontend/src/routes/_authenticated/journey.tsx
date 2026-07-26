import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Flag, Sparkles, Flame, Compass, Trophy, Award } from "lucide-react";
import { get } from "@/lib/api";
import { PageTransition } from "@/lib/ui-helpers";

export const Route = createFileRoute("/_authenticated/journey")({
  component: JourneyPage,
});

type Expense = {
  amount: number;
  category: string;
  note: string | null;
  mood: string | null;
  spent_at: string;
  created_at: string;
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
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [insightCount, setInsightCount] = useState(0);

  useEffect(() => {
  loadExpenses();
}, []);

async function loadExpenses() {
  try {
    const rows = await get<Expense[]>("/expenses");
    setExpenses(rows);

    const count = await get<number>("/insights/count");
    setInsightCount(count);
  } catch (error) {
    console.error(error);
  }
}


  const milestones = useMemo<Milestone[]>(() => {
    if (expenses.length === 0) return [];
    const events: Milestone[] = [];

    const first = expenses[0];
    events.push({
      icon: Flag,
      when: bucketLabel(daysAgo(first.spent_at)),
      title: "First Expense",
      desc: `You started your journey with ₹${first.amount.toFixed(2)} on ${first.category}.`,
      tone: "primary",
    });

    if (insightCount > 0) {
      events.push({
        icon: Sparkles,
        when: "Along the way",
        title: "First AI Insight",
        desc: `Chayva has reflected on your habits ${insightCount} time${insightCount === 1 ? "" : "s"}.`,
        tone: "accent",
      });
    }

    // Streak: max consecutive days with expenses
    const days = Array.from(new Set(expenses.map((e) => e.spent_at))).sort();
    let maxStreak = 1;
    let cur = 1;
    for (let i = 1; i < days.length; i++) {
      const prev = new Date(days[i - 1]).getTime();
      const now = new Date(days[i]).getTime();
      if (now - prev === 86400000) {
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

    const firstMood = expenses.find((e) => e.mood);
    if (firstMood) {
      events.push({
        icon: Compass,
        when: bucketLabel(daysAgo(firstMood.spent_at)),
        title: "Tuned into your mood",
        desc: `You began noticing how you felt (${firstMood.mood}) while spending.`,
        tone: "accent",
      });
    }

    const recentGood = expenses.filter(
      (e) => daysAgo(e.spent_at) <= 14 && (e.mood === "happy" || e.mood === "neutral"),
    );
    if (recentGood.length >= 3) {
      events.push({
        icon: Trophy,
        when: "1 week ago",
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
  }, [expenses, insightCount]);

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

        {milestones.length === 0 ? (
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
