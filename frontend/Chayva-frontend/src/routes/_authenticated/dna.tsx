import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Heart, Zap, Leaf, Sparkles, Clock, Shield, TrendingUp } from "lucide-react";
import { useCoaching } from "@/lib/coaching-context";
import { CircularScore } from "./dashboard";
import { CountUp, PageTransition } from "@/lib/ui-helpers";

export const Route = createFileRoute("/_authenticated/dna")({
  component: SpendDnaPage,
});

function SpendDnaPage() {
  const { snapshot, loading, error, refetch } = useCoaching();
  const dna = snapshot?.spend_dna ?? {};
  const personality = snapshot?.personality ?? {};
  const mindfulness = dna.mindfulness_score ?? personality.mindfulness_score ?? null;

  const traits = useMemo(() => {
    return [
      {
        icon: Heart,
        title: "Personality",
        value: dna.personality_type ?? personality.type ?? "—",
        desc: personality.behavior_narrative ?? personality.description ?? "—",
      },
      {
        icon: Zap,
        title: "Top trigger",
        value: dna.dominant_trigger ?? personality.dominant_trigger ?? "—",
        desc: dna.behavior_pattern ? `Strongest signal: ${dna.behavior_pattern}.` : "—",
      },
      {
        icon: Leaf,
        title: "Favorite category",
        value: dna.favorite_category ?? personality.favorite_category ?? "—",
        desc: dna.favorite_category ? `${dna.favorite_category} is leading your current pattern.` : "—",
      },
      {
        icon: Clock,
        title: "Most active time",
        value: dna.most_active_time ?? personality.most_active_time ?? "—",
        desc: "When your spending behavior most often shows up.",
      },
      {
        icon: Shield,
        title: "Risk level",
        value: dna.risk_level ?? personality.risk_level ?? "—",
        desc: "How reactive your current spending pattern looks.",
      },
      {
        icon: TrendingUp,
        title: "Behavior evolution",
        value: "Trend",
        desc: dna.behavior_evolution ?? personality.behavior_evolution ?? "—",
      },
    ];
  }, [dna, personality]);

  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-primary">Behavioral Profile</p>
          <h1 className="mt-2 text-4xl font-bold">Your Spend DNA</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Your spending personality, triggers, and behavioral patterns in one readout.
          </p>
        </div>

        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass relative overflow-hidden rounded-3xl p-8">
          <div className="relative flex flex-col items-center gap-8 md:flex-row">
            {loading || mindfulness == null ? (
              <div className="h-[180px] w-[180px] animate-pulse rounded-full bg-foreground/10" />
            ) : (
              <CircularScore value={mindfulness} size={180} />
            )}
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-accent">
                <Sparkles className="h-4 w-4" />
                Mindfulness Score
              </div>
              <div className="mt-3 text-6xl font-bold">
                {mindfulness != null ? <CountUp value={mindfulness} /> : "—"}
                <span className="text-2xl text-muted-foreground">/100</span>
              </div>
              <p className="mt-4 max-w-md text-muted-foreground">
                {dna.coach_advice ?? personality.coach_advice ?? "Coach advice will appear once your pattern map is clearer."}
              </p>
              {dna.confidence != null ? (
                <p className="mt-2 text-sm text-muted-foreground">Confidence: {Math.round(dna.confidence * 100)}%</p>
              ) : null}
            </div>
          </div>
        </motion.section>

        {error ? (
          <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-5 text-sm text-muted-foreground">
            <span>{error}</span>
            <button onClick={() => void refetch()} className="rounded-lg border border-foreground/10 px-3 py-1">Retry</button>
          </div>
        ) : null}

        <section className="grid gap-5 md:grid-cols-3">
          {traits.map((trait, index) => (
            <motion.div
              key={trait.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              whileHover={{ y: -5 }}
              className="glass rounded-2xl p-6"
            >
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-muted-foreground">
                <trait.icon className="h-4 w-4 text-primary" />
                {trait.title}
              </div>
              <h2 className="mt-4 text-2xl font-semibold">{trait.value}</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{trait.desc}</p>
            </motion.div>
          ))}
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          <DnaList title="Traits" items={dna.traits ?? personality.traits ?? []} />
          <DnaList title="Strengths" items={dna.strengths ?? personality.strengths ?? []} />
          <DnaList title="Growth areas" items={dna.growth_areas ?? personality.growth_areas ?? []} />
        </section>
      </div>
    </PageTransition>
  );
}

function DnaList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {(items.length ? items : ["—"]).map((item) => (
          <li key={item} className="rounded-xl border border-foreground/10 bg-foreground/5 px-3 py-2">{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default SpendDnaPage;
