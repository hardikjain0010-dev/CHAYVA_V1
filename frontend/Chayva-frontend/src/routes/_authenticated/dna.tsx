import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Dna, Sparkles, ChevronRight } from "lucide-react";
import { useCoaching } from "@/lib/coaching-context";
import {
  PageTransition,
  EmptyLearningState,
  LoadingSkeleton,
  BehaviorTag,
  CircularScore,
} from "@/lib/ui-helpers";
import { BRAND_NAME } from "@/lib/brand";

export const Route = createFileRoute("/_authenticated/dna")({
  component: SpendDnaPage,
});

// ---------------------------------------------------------------------------
// Dimension bar — one behavioral dimension
// ---------------------------------------------------------------------------

function DimensionBar({
  label,
  value,
  delay = 0,
}: {
  label: string;
  value: string | null | undefined;
  delay?: number;
}) {
  if (!value || value === "—") return null;

  // Map descriptive labels to a visual intensity (not a fake score)
  const intensity: Record<string, number> = {
    high: 0.85,
    strong: 0.85,
    very: 0.9,
    moderate: 0.55,
    medium: 0.55,
    low: 0.3,
    weak: 0.3,
    emerging: 0.2,
  };
  const rawVal = value.toLowerCase();
  const fill = Object.entries(intensity).find(([k]) => rawVal.includes(k))?.[1] ?? 0.5;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.26 }}
      className="flex items-center gap-3"
    >
      <span className="w-36 shrink-0 text-xs font-medium text-foreground/80 truncate">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-foreground/8 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${fill * 100}%` }}
          transition={{ delay: delay + 0.1, duration: 0.5, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-primary"
        />
      </div>
      <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">{value}</span>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

function SpendDnaPage() {
  const { snapshot, loading, error, refetch } = useCoaching();
  const dna = snapshot?.spend_dna ?? {};
  const personality = snapshot?.personality ?? {};
  const mindfulness = dna.mindfulness_score ?? personality.mindfulness_score ?? null;

  const archetypeName =
    dna.personality_type ?? personality.type ?? personality.personality_type ?? null;
  const archetypeDesc =
    personality.description ?? personality.behavior_narrative ?? dna.coach_advice ?? null;
  const confidenceLevel = dna.confidence ?? personality.confidence ?? null;

  // Is the evidence strong enough to present confidently?
  const isLowConfidence = confidenceLevel != null && confidenceLevel < 0.5;
  const isVeryLowConfidence = confidenceLevel != null && confidenceLevel < 0.25;

  const traits = dna.traits ?? personality.traits ?? [];
  const strengths = dna.strengths ?? personality.strengths ?? [];
  const growthAreas = dna.growth_areas ?? personality.growth_areas ?? [];

  const dimensions = useMemo(
    () => [
      { label: "Personality type", value: archetypeName },
      {
        label: "Dominant trigger",
        value: dna.dominant_trigger ?? personality.dominant_trigger ?? null,
      },
      {
        label: "Favorite category",
        value: dna.favorite_category ?? personality.favorite_category ?? null,
      },
      {
        label: "Most active time",
        value: dna.most_active_time ?? personality.most_active_time ?? null,
      },
      { label: "Risk level", value: dna.risk_level ?? personality.risk_level ?? null },
      { label: "Behavior trend", value: dna.behavior_pattern ?? null },
    ],
    [dna, personality, archetypeName],
  );

  const hasData = !loading && (archetypeName || traits.length > 0 || strengths.length > 0);

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl space-y-7">
        {/* ================================================================= */}
        {/* HEADER                                                             */}
        {/* ================================================================= */}
        <header>
          <p className="caayva-eyebrow">Identity</p>
          <h1 className="caayva-headline mt-1 text-3xl text-foreground">Your Spend DNA</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Based on your behavior, not your bank balance.
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
        {loading ? (
          <div className="glass rounded-3xl p-8 space-y-5">
            <LoadingSkeleton lines={2} />
            <div className="h-32 w-32 animate-pulse rounded-full bg-foreground/8 mx-auto" />
            <LoadingSkeleton lines={4} />
          </div>
        ) : !hasData ? (
          // ----------------------------------------------------------------
          // LEARNING STATE
          // ----------------------------------------------------------------
          <EmptyLearningState
            icon={Dna}
            title="Your DNA is forming."
            description={`${BRAND_NAME} needs a broader view of your spending — across different categories, times, and moods — before it can map your behavioral profile with confidence. Keep logging.`}
          />
        ) : (
          <>
            {/* ============================================================= */}
            {/* ARCHETYPE HERO — personality as dominant visual                */}
            {/* ============================================================= */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.38 }}
              className="relative overflow-hidden rounded-3xl border border-primary/15 p-7 md:p-9"
              style={{ background: "var(--gradient-hero)" }}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/12 blur-3xl"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -left-12 -bottom-12 h-36 w-36 rounded-full bg-accent/10 blur-2xl"
              />

              <div className="relative flex flex-col gap-6 md:flex-row md:items-start">
                {/* Mindfulness arc — supporting metric */}
                {mindfulness != null && (
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <CircularScore value={mindfulness} size={120} />
                    <div className="text-center">
                      <p className="text-2xl font-bold tabular-nums">{Math.round(mindfulness)}</p>
                      <p className="text-[0.6rem] uppercase tracking-[0.14em] text-muted-foreground">
                        Mindfulness
                      </p>
                    </div>
                  </div>
                )}

                {/* Archetype — the hero */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="grid h-6 w-6 place-items-center rounded-lg bg-gradient-primary text-primary-foreground">
                      <Sparkles className="h-3 w-3" />
                    </span>
                    <p className="caayva-eyebrow">Your pattern in simple words</p>
                  </div>

                  {archetypeName && (
                    <h2 className="caayva-headline text-2xl text-foreground md:text-3xl">
                      {archetypeName}
                    </h2>
                  )}

                  {archetypeDesc && (
                    <p className="mt-3 text-base leading-relaxed text-foreground/75 max-w-lg">
                      {archetypeDesc}
                    </p>
                  )}

                  {/* Confidence signal — honest about evidence quality */}
                  {confidenceLevel != null && (
                    <div className="mt-4">
                      {isVeryLowConfidence ? (
                        <p className="text-xs text-muted-foreground italic">
                          Early signal — {BRAND_NAME} is still learning your pattern. These observations
                          will strengthen with more data.
                        </p>
                      ) : isLowConfidence ? (
                        <p className="text-xs text-muted-foreground">
                          Moderate signal — this profile will sharpen as your journal grows.
                        </p>
                      ) : (
                        <BehaviorTag
                          label={`${Math.round(confidenceLevel * 100)}% confidence`}
                          variant="primary"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.section>

            {/* ============================================================= */}
            {/* BEHAVIORAL DIMENSIONS — what shapes your DNA                   */}
            {/* ============================================================= */}
            {dimensions.some((d) => d.value) && (
              <section className="glass rounded-2xl p-6">
                <p className="caayva-eyebrow mb-5">What shapes your DNA</p>
                <div className="space-y-4">
                  {dimensions.map((d, i) => (
                    <DimensionBar key={d.label} label={d.label} value={d.value} delay={i * 0.07} />
                  ))}
                </div>
              </section>
            )}

            {/* ============================================================= */}
            {/* TRAITS / STRENGTHS / GROWTH AREAS                             */}
            {/* ============================================================= */}
            {(traits.length > 0 || strengths.length > 0 || growthAreas.length > 0) && (
              <div className="grid gap-4 md:grid-cols-3">
                {traits.length > 0 && <DnaList title="Traits" items={traits} delay={0} />}
                {strengths.length > 0 && (
                  <DnaList title="Strengths" items={strengths} delay={0.08} />
                )}
                {growthAreas.length > 0 && (
                  <DnaList title="Growth areas" items={growthAreas} delay={0.16} />
                )}
              </div>
            )}

            {/* ============================================================= */}
            {/* COACH ADVICE — from real AI output                             */}
            {/* ============================================================= */}
            {(dna.coach_advice || personality.coach_advice) &&
              archetypeDesc !== (dna.coach_advice ?? personality.coach_advice) && (
                <div className="rounded-2xl border border-primary/15 bg-primary/5 px-6 py-5">
                  <p className="caayva-eyebrow mb-2">Coach perspective</p>
                  <p className="text-sm leading-relaxed text-foreground/85">
                    {dna.coach_advice ?? personality.coach_advice}
                  </p>
                </div>
              )}

            {/* ============================================================= */}
            {/* BEHAVIOR EVOLUTION                                             */}
            {/* ============================================================= */}
            {(dna.behavior_evolution || personality.behavior_evolution) && (
              <div className="rounded-2xl border border-foreground/8 bg-foreground/[0.02] px-6 py-5">
                <p className="caayva-eyebrow mb-2">How you're evolving</p>
                <p className="text-sm leading-relaxed text-foreground/80">
                  {dna.behavior_evolution ?? personality.behavior_evolution}
                </p>
              </div>
            )}

            <p className="text-center text-xs text-muted-foreground pb-2">
              DNA evolves as you grow. Keep going.
            </p>
          </>
        )}
      </div>
    </PageTransition>
  );
}

// ---------------------------------------------------------------------------
// DnaList — traits / strengths / growth areas
// ---------------------------------------------------------------------------

function DnaList({ title, items, delay = 0 }: { title: string; items: string[]; delay?: number }) {
  if (!items.length) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.26 }}
      className="glass rounded-2xl p-5"
    >
      <p className="caayva-eyebrow mb-3">{title}</p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-foreground/80">
            <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/60" />
            {item}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

export default SpendDnaPage;
