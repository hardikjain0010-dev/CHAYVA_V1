import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles, TrendingUp, ArrowRight } from "lucide-react";
import { useExpenses } from "@/lib/expense-context";
import { useCoaching } from "@/lib/coaching-context";
import { PageTransition, EmptyLearningState, LoadingSkeleton, BehaviorTag } from "@/lib/ui-helpers";

export const Route = createFileRoute("/_authenticated/week")({
  component: WeekPage,
});

function WeekPage() {
  const { loading: expensesLoading } = useExpenses();
  const { snapshot, loading: dataLoading, error, refetch } = useCoaching();
  const weekly = snapshot?.weekly;
  const isLoading = expensesLoading || dataLoading;

  const metrics = useMemo(
    () => ({
      totalSpend: snapshot?.stats.weekly_spend ?? 0,
      topCategory:
        snapshot?.personality.favorite_category ?? snapshot?.spend_dna?.favorite_category ?? null,
      topTrigger: weekly?.top_trigger ?? snapshot?.trigger.top_trigger ?? null,
      mindfulness:
        snapshot?.personality.mindfulness_score ?? snapshot?.spend_dna?.mindfulness_score ?? null,
    }),
    [snapshot, weekly],
  );

  const behaviorTimeline = snapshot?.behavior_timeline ?? [];

  const hasWeeklyData = !isLoading && (weekly?.weekly_narrative || weekly?.behavior_summary);

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl space-y-7">
        {/* ================================================================= */}
        {/* HEADER                                                             */}
        {/* ================================================================= */}
        <header>
          <p className="caayva-eyebrow">Weekly Story</p>
          <h1 className="caayva-headline mt-1 text-3xl text-foreground">Your Week in Focus</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Behavioral patterns from the past 7 days.
          </p>
        </header>

        {/* Error */}
        {error && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
            <span>{error}</span>
            <button
              onClick={() => void refetch()}
              className="rounded-lg border border-destructive/30 px-3 py-1"
            >
              Retry
            </button>
          </div>
        )}

        {/* ================================================================= */}
        {/* LOADING                                                            */}
        {/* ================================================================= */}
        {isLoading ? (
          <div className="space-y-4">
            <div className="glass rounded-3xl p-8">
              <LoadingSkeleton lines={3} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="glass h-28 animate-pulse rounded-2xl" />
              ))}
            </div>
          </div>
        ) : !hasWeeklyData ? (
          // ----------------------------------------------------------------
          // LEARNING STATE — not enough history yet
          // ----------------------------------------------------------------
          <EmptyLearningState
            icon={Sparkles}
            title="Your weekly story is taking shape."
            description="Keep logging expenses across a few days — including mood and context. Caayva will compose your first weekly behavioral narrative once there's enough signal to work with."
          />
        ) : (
          <>
            {/* ============================================================= */}
            {/* HERO — dominant weekly narrative                               */}
            {/* ============================================================= */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.36 }}
              className="relative overflow-hidden rounded-3xl border border-primary/15 p-7 md:p-9"
              style={{ background: "var(--gradient-hero)" }}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/15 blur-3xl"
              />
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <span className="grid h-6 w-6 place-items-center rounded-lg bg-gradient-primary text-primary-foreground">
                    <Sparkles className="h-3 w-3" />
                  </span>
                  <p className="caayva-eyebrow">Key insight this week</p>
                </div>

                <h2 className="caayva-headline text-2xl text-foreground md:text-3xl max-w-2xl">
                  {weekly?.weekly_narrative ?? weekly?.behavior_summary}
                </h2>

                {weekly?.spending_pattern && (
                  <p className="mt-4 text-base leading-relaxed text-foreground/75 max-w-xl">
                    {weekly.spending_pattern}
                  </p>
                )}

                {/* Supporting tags */}
                <div className="mt-5 flex flex-wrap gap-2">
                  {metrics.topCategory && (
                    <BehaviorTag label={`Top category: ${metrics.topCategory}`} variant="primary" />
                  )}
                  {metrics.topTrigger && (
                    <BehaviorTag label={`Top trigger: ${metrics.topTrigger}`} variant="primary" />
                  )}
                  {metrics.mindfulness != null && (
                    <BehaviorTag label={`Mindfulness: ${metrics.mindfulness}/100`} />
                  )}
                </div>
              </div>
            </motion.section>

            {/* ============================================================= */}
            {/* BEHAVIOR RHYTHM — timeline strip                               */}
            {/* ============================================================= */}
            {behaviorTimeline.length > 0 && (
              <section className="glass rounded-2xl p-5">
                <p className="caayva-eyebrow mb-4">Day by day</p>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {behaviorTimeline.map((entry) => (
                    <div
                      key={entry.date ?? entry.day}
                      className="flex min-w-[56px] flex-col items-center gap-1.5 rounded-xl border border-foreground/8 bg-foreground/[0.03] px-3 py-3"
                    >
                      <span className="text-xl">{entry.emoji}</span>
                      <span className="text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                        {entry.day?.slice(0, 2)}
                      </span>
                      <span className="text-center text-[0.6rem] text-muted-foreground leading-tight">
                        {entry.label}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ============================================================= */}
            {/* BEHAVIORAL SECTIONS — story content                            */}
            {/* ============================================================= */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Most important change */}
              {weekly?.behavior_changes && (
                <NarrativeBlock
                  eyebrow="What changed"
                  content={weekly.behavior_changes}
                  delay={0}
                />
              )}

              {/* Trigger context */}
              {weekly?.trigger_changes && (
                <NarrativeBlock
                  eyebrow="Trigger patterns"
                  content={weekly.trigger_changes}
                  delay={0.06}
                />
              )}

              {/* Mood context */}
              {weekly?.mood_changes && (
                <NarrativeBlock
                  eyebrow="Emotional context"
                  content={weekly.mood_changes}
                  delay={0.1}
                />
              )}

              {/* Improvements */}
              {(weekly?.improvements || weekly?.biggest_improvement) && (
                <NarrativeBlock
                  eyebrow="What improved"
                  content={weekly.improvements ?? weekly.biggest_improvement ?? ""}
                  delay={0.14}
                  accent
                />
              )}

              {/* Personality shifts */}
              {weekly?.personality_changes && (
                <NarrativeBlock
                  eyebrow="Behavioral shift"
                  content={weekly.personality_changes}
                  delay={0.18}
                />
              )}

              {/* Category trends */}
              {weekly?.category_trends && (
                <NarrativeBlock
                  eyebrow="Category patterns"
                  content={weekly.category_trends}
                  delay={0.22}
                />
              )}
            </div>

            {/* ============================================================= */}
            {/* SPEND SNAPSHOT — secondary metric                              */}
            {/* ============================================================= */}
            {metrics.totalSpend > 0 && (
              <section className="rounded-2xl border border-foreground/8 bg-foreground/[0.02] px-6 py-5 flex items-center justify-between gap-4">
                <div>
                  <p className="caayva-eyebrow">This week's total</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight">
                    ₹{metrics.totalSpend.toFixed(0)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {(metrics.totalSpend / 7).toFixed(0)} avg per day
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground/30" />
              </section>
            )}

            {/* ============================================================= */}
            {/* ONE WIN + COACH RECOMMENDATION                                 */}
            {/* ============================================================= */}
            <div className="grid gap-4 md:grid-cols-2">
              {weekly?.one_win && (
                <div className="glass rounded-2xl p-5 border-l-4 border-l-primary/60">
                  <p className="caayva-eyebrow mb-2">One win</p>
                  <p className="text-sm leading-relaxed">{weekly.one_win}</p>
                </div>
              )}
              {(weekly?.coach_recommendation || weekly?.coach_advice) && (
                <div className="glass rounded-2xl p-5 border-l-4 border-l-accent/60">
                  <p className="caayva-eyebrow mb-2">What to notice next</p>
                  <p className="text-sm leading-relaxed">
                    {weekly.coach_recommendation ?? weekly.coach_advice}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </PageTransition>
  );
}

// ---------------------------------------------------------------------------
// NarrativeBlock — a section of the weekly story
// ---------------------------------------------------------------------------

function NarrativeBlock({
  eyebrow,
  content,
  delay = 0,
  accent = false,
}: {
  eyebrow: string;
  content: string;
  delay?: number;
  accent?: boolean;
}) {
  if (!content || content === "—") return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.26 }}
      className="glass rounded-2xl p-5"
    >
      <p className="caayva-eyebrow">{eyebrow}</p>
      <p
        className={`mt-3 text-sm leading-relaxed ${accent ? "text-foreground/90" : "text-foreground/80"}`}
      >
        {content}
      </p>
    </motion.div>
  );
}
