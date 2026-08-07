import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Coffee, Moon, Sprout, Target, TrendingDown, TrendingUp } from "lucide-react";
import { useExpenses } from "@/lib/expense-context";
import { useCoaching } from "@/lib/coaching-context";
import { PageTransition } from "@/lib/ui-helpers";

export const Route = createFileRoute("/_authenticated/week")({
  component: WeekPage,
});

function WeekPage() {
  const { loading } = useExpenses();
  const { snapshot, loading: dataLoading, error, refetch } = useCoaching();
  const weekly = snapshot?.weekly;

  const metrics = useMemo(() => {
    return {
      totalSpend: snapshot?.stats.weekly_spend ?? 0,
      avgDailySpend: (snapshot?.stats.weekly_spend ?? 0) / 7,
      topCategory: snapshot?.personality.favorite_category ?? "—",
      topTrigger: weekly?.top_trigger ?? snapshot?.trigger.top_trigger ?? "—",
      mindfulness: snapshot?.personality.mindfulness_score ?? snapshot?.spend_dna?.mindfulness_score ?? null,
    };
  }, [snapshot, weekly]);

  const sections = [
    { title: "Behavior summary", value: weekly?.behavior_summary ?? weekly?.weekly_narrative },
    { title: "Improvements", value: weekly?.improvements ?? weekly?.biggest_improvement },
    { title: "Regressions", value: weekly?.regressions },
    { title: "Trigger changes", value: weekly?.trigger_changes },
    { title: "Mood changes", value: weekly?.mood_changes },
    { title: "Category trends", value: weekly?.category_trends },
    { title: "Personality changes", value: weekly?.personality_changes },
    { title: "Coach recommendation", value: weekly?.coach_recommendation ?? weekly?.coach_advice },
  ];

  const isLoading = loading || dataLoading;

  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <header><h1 className="text-3xl font-semibold tracking-tight">This Week</h1></header>
          <section className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass h-32 animate-pulse rounded-2xl" />
            ))}
          </section>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight">This Week</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            AI-first weekly coaching — what shifted, what improved, and what your coach recommends next.
          </p>
        </header>

        {error ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>{error}</span>
              <button onClick={() => void refetch()} className="rounded-lg border border-destructive/30 px-3 py-1">Retry</button>
            </div>
          </div>
        ) : null}

        <section className="glass rounded-2xl p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-accent">Weekly narrative</p>
          <h2 className="mt-2 text-2xl font-semibold">{weekly?.weekly_narrative ?? "Your weekly read will appear after a few logged days."}</h2>
          <p className="mt-3 text-base leading-relaxed text-foreground/85">{weekly?.spending_pattern ?? weekly?.behavior_changes}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span className="rounded-full border border-foreground/10 bg-background/40 px-3 py-1">Top category: {metrics.topCategory}</span>
            <span className="rounded-full border border-foreground/10 bg-background/40 px-3 py-1">Top trigger: {metrics.topTrigger}</span>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {sections.map((section) => (
            <div key={section.title} className="glass rounded-2xl p-6">
              <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-accent">{section.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-foreground/85">{section.value ?? "—"}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <MetricCard
            icon={Sprout}
            emoji="🌱"
            title="Mindfulness"
            value={metrics.mindfulness != null ? `${metrics.mindfulness}/100 mindfulness score this week.` : weekly?.mood_changes ?? "—"}
            sub="From your live coaching snapshot"
            positive
          />
          <MetricCard
            icon={Target}
            emoji="💸"
            title="Spend snapshot"
            value={`You spent ₹${metrics.totalSpend.toFixed(2)} this week.`}
            sub={`Average ₹${metrics.avgDailySpend.toFixed(2)} per day`}
            positive={metrics.totalSpend <= metrics.avgDailySpend * 7 + 1000}
          />
          <MetricCard
            icon={Moon}
            emoji="🌙"
            title="One win"
            value={weekly?.one_win ?? "—"}
            sub="Generated by summarize.py"
            positive
          />
          <MetricCard
            icon={Coffee}
            emoji="✨"
            title="Coach recommendation"
            value={weekly?.coach_recommendation ?? weekly?.coach_advice ?? "—"}
            sub="Your next gentle behavioral nudge"
            positive
          />
        </section>
      </div>
    </PageTransition>
  );
}

function MetricCard({
  icon: Icon,
  emoji,
  title,
  value,
  sub,
  positive,
}: {
  icon: React.ComponentType<{ className?: string }>;
  emoji: string;
  title: string;
  value: string;
  sub: string;
  positive: boolean;
}) {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{emoji}</span>
          <h3 className="font-semibold">{title}</h3>
        </div>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-foreground/5">
          {positive ? <TrendingDown className="h-4 w-4 text-accent" /> : <TrendingUp className="h-4 w-4 text-destructive" />}
          <Icon className="hidden" />
        </span>
      </div>
      <p className="mt-3 text-base leading-relaxed">{value}</p>
      <p className="mt-2 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
