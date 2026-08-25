import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Flag,
  Sparkles,
  Flame,
  Compass,
  Trophy,
  Award,
} from "lucide-react";
import { useExpenses } from "@/lib/expense-context";
import { useCoaching } from "@/lib/coaching-context";
import { PageTransition, EmptyLearningState, LoadingSkeleton } from "@/lib/ui-helpers";

export const Route = createFileRoute("/_authenticated/journey")({
  component: JourneyPage,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function iconForTitle(title: string) {
  if (title.includes("Started") || title.includes("First")) return Flag;
  if (title.includes("Streak")) return Flame;
  if (title.includes("Reflection") || title.includes("Reflect")) return Compass;
  if (title.includes("Insight") || title.includes("Noticed")) return Sparkles;
  if (title.includes("Personality") || title.includes("DNA")) return Trophy;
  if (title.includes("Summary") || title.includes("Expenses") || title.includes("Week")) return Award;
  return MapPin;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

function JourneyPage() {
  const { loading: expensesLoading } = useExpenses();
  const { snapshot, loading, error, refetch } = useCoaching();

  const milestones = useMemo(() => {
    return (snapshot?.journey.milestones ?? []).map((milestone, index) => ({
      icon: iconForTitle(milestone.title),
      when: milestone.date ? bucketLabel(daysAgo(milestone.date)) : "Now",
      date: milestone.date ?? null,
      title: milestone.title,
      desc: milestone.description ?? "A step in your behavioral journey.",
      index,
    }));
  }, [snapshot]);

  const isLoading = expensesLoading || loading;

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl space-y-7">

        {/* ================================================================= */}
        {/* HEADER                                                             */}
        {/* ================================================================= */}
        <header>
          <p className="caayva-eyebrow">Evolution</p>
          <h1 className="caayva-headline mt-1 text-3xl text-foreground">Your Journey</h1>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-lg">
            Track how your behavioral awareness evolves over time. Every entry is a step.
          </p>
        </header>

        {/* Error */}
        {error && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
            <span>{error}</span>
            <button onClick={() => void refetch()} className="rounded-lg border border-destructive/30 px-3 py-1">Retry</button>
          </div>
        )}

        {/* ================================================================= */}
        {/* LOADING                                                            */}
        {/* ================================================================= */}
        {isLoading ? (
          <div className="space-y-4 pl-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass rounded-2xl p-5">
                <LoadingSkeleton lines={2} />
              </div>
            ))}
          </div>
        ) : milestones.length === 0 ? (
          // ----------------------------------------------------------------
          // INTENTIONAL LEARNING STATE — no real milestones yet
          // ----------------------------------------------------------------
          <EmptyLearningState
            icon={MapPin}
            title="Your journey is just beginning."
            description="Caayva marks real behavioral milestones as you go — your first expense, a detected pattern, a completed reflection, or a noticeable shift in your spending behavior. Keep building your journal."
          />
        ) : (
          // ----------------------------------------------------------------
          // VERTICAL TIMELINE — real milestones only
          // ----------------------------------------------------------------
          <section className="relative">
            {/* Timeline spine */}
            <div
              aria-hidden
              className="absolute left-5 top-6 bottom-6 w-px bg-gradient-to-b from-primary/50 via-border to-transparent"
            />

            <ol className="space-y-5 pl-14">
              {milestones.map((m, i) => (
                <motion.li
                  key={`${m.title}-${i}`}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                  className="relative"
                >
                  {/* Timeline dot */}
                  <span
                    aria-hidden
                    className="absolute -left-[3.35rem] flex h-10 w-10 items-center justify-center rounded-full border border-primary/25 bg-gradient-primary text-primary-foreground shadow-[var(--shadow-glow-sm)]"
                  >
                    <m.icon className="h-4 w-4" />
                  </span>

                  {/* Milestone card */}
                  <div className="glass overflow-hidden rounded-2xl p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="caayva-eyebrow mb-1">{m.when}</p>
                        <h3 className="text-base font-semibold tracking-tight">{m.title}</h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-foreground/75">{m.desc}</p>
                      </div>
                      {m.date && (
                        <span className="shrink-0 text-[0.65rem] text-muted-foreground tabular-nums">
                          {new Date(m.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.li>
              ))}
            </ol>

            {/* Journey footer */}
            <div className="mt-8 flex items-center gap-3 pl-14">
              <span className="flex h-10 w-10 -ml-[3.35rem] items-center justify-center rounded-full border border-dashed border-foreground/20">
                <span className="h-2.5 w-2.5 rounded-full bg-foreground/20" />
              </span>
              <p className="text-sm italic text-muted-foreground">
                The next milestone is forming.
              </p>
            </div>
          </section>
        )}

        <p className="text-center text-xs text-muted-foreground pb-2">
          Progress is measured by understanding yourself better.
        </p>
      </div>
    </PageTransition>
  );
}
