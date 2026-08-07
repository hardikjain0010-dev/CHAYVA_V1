import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { MapPin, Flag, Sparkles, Flame, Compass, Trophy, Award } from "lucide-react";
import { useExpenses } from "@/lib/expense-context";
import { useCoaching } from "@/lib/coaching-context";
import { PageTransition } from "@/lib/ui-helpers";

export const Route = createFileRoute("/_authenticated/journey")({
  component: JourneyPage,
});

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
  const { expenses, loading: expensesLoading } = useExpenses();
  const { snapshot, loading, error, refetch } = useCoaching();

  const milestones = useMemo<Milestone[]>(() => {
    const iconFor = (title: string) => {
      if (title.includes("Started")) return Flag;
      if (title.includes("Streak")) return Flame;
      if (title.includes("Reflection")) return Compass;
      if (title.includes("Insight")) return Sparkles;
      if (title.includes("Personality") || title.includes("DNA")) return Trophy;
      if (title.includes("Summary") || title.includes("Expenses")) return Award;
      return MapPin;
    };
    return (snapshot?.journey.milestones ?? []).map((milestone, index) => ({
      icon: iconFor(milestone.title),
      when: milestone.date ? bucketLabel(daysAgo(milestone.date)) : "Now",
      title: milestone.title,
      desc: milestone.description ?? "A new step in your behavior journey.",
      tone: index % 3 === 0 ? "primary" : index % 3 === 1 ? "accent" : "success",
    }));
  }, [snapshot]);

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
            Every expense tells a story. These are the moments and habits that have shaped your financial behavior — how far you’ve come, and where you’re headed.
          </p>
        </header>
        {error ? (
          <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-5 text-sm text-muted-foreground">
            <span>{error}</span>
            <button onClick={() => void refetch()} className="rounded-lg border border-foreground/10 px-3 py-1">Retry</button>
          </div>
        ) : null}
        {expensesLoading || loading ? (
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
                    <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground">{m.when}</div>
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
