import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Sprout, Moon, Coffee, Target, TrendingDown, TrendingUp } from "lucide-react";
import { useExpenses } from "@/lib/expense-context";
import { PageTransition } from "@/lib/ui-helpers";
export const Route = createFileRoute("/_authenticated/week")({
  component: WeekPage,
});
function startOfWeek(offset = 0) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 sun
  const diff = (day === 0 ? -6 : 1) - day; // week starts Monday
  d.setDate(d.getDate() + diff - offset * 7);
  return d;
}
function pctChange(now: number, prev: number) {
  if (prev === 0) return now === 0 ? 0 : 100;
  return Math.round(((now - prev) / prev) * 100);
}
function WeekPage() {
  // ✅ Single source of truth — reads from shared ExpenseProvider context.
  // Field mapping: backend returns `date` (not `spent_at` or `created_at`).
  // Late-night detection uses `date` field since `created_at` is not returned by the API.
  const { expenses, loading } = useExpenses();

  const metrics = useMemo(() => {
    const thisStart = startOfWeek(0);
    const lastStart = startOfWeek(1);
    const inRange = (iso: string, from: Date, to: Date) => {
      const d = new Date(iso);
      return d >= from && d < to;
    };
    const now = new Date();
    // `date` is the expense date (YYYY-MM-DD or full ISO). Use it for week filtering.
    const thisWeek = expenses.filter((e) => inRange(e.date, thisStart, now));
    const lastWeek = expenses.filter((e) => inRange(e.date, lastStart, thisStart));
    const mindful = (arr: typeof expenses) => {
      if (arr.length === 0) return 0;
      // Moods logged in the app: happy, stressed, bored, lonely, tired, social
      // "impulsive" and "regret" are not in the current mood list — treat stressed as non-mindful
      const good = arr.filter(
        (e) => e.mood !== "stressed" && e.mood !== "bored"
      ).length;
      return (good / arr.length) * 100;
    };
    const mindfulThis = mindful(thisWeek);
    const mindfulLast = mindful(lastWeek);
    const mindfulDelta = Math.round(mindfulThis - mindfulLast);
     // Late-night: detect from `date` field time component (when available in ISO format).
    // Falls back gracefully if date is YYYY-MM-DD only.
    const lateNight = (arr: typeof expenses) =>
      arr.filter((e) => {
        try {
          const h = new Date(e.date).getHours();
          return h >= 22 || h < 5;
        } catch {
          return false;
        }
      }).length;
    const lateThis = lateNight(thisWeek);
    const lateLast = lateNight(lastWeek);
    const lateDelta = pctChange(lateThis, lateLast);
    const coffee = (arr: typeof expenses) =>
      arr.filter(
        (e) =>
          e.category.toLowerCase().includes("food") &&
          (e.notes ?? "").toLowerCase().includes("coffee"),
      ).length ||
      arr.filter((e) => (e.notes ?? "").toLowerCase().includes("coffee")).length;
    const coffeeThis = coffee(thisWeek);
    const coffeeLast = coffee(lastWeek);
    // Budget check: days where daily total <= last-week avg per day
    const dailyTotals = (arr: typeof expenses) => {
      const m = new Map<string, number>();
      // Use the first 10 chars (YYYY-MM-DD) as the day key
      arr.forEach((e) => {
        const day = e.date.slice(0, 10);
        m.set(day, (m.get(day) ?? 0) + e.amount);
      });
      return m;
    };
     const lastMap = dailyTotals(lastWeek);
    const lastAvg =
      lastMap.size > 0
        ? Array.from(lastMap.values()).reduce((s, v) => s + v, 0) / 7
        : 0;
    const thisMap = dailyTotals(thisWeek);
    const daysWithin = Array.from(thisMap.values()).filter((v) => v <= lastAvg || lastAvg === 0)
      .length;
    const totalDays = Math.max(thisMap.size, 1);
    return {
      mindfulDelta,
      mindfulThis: Math.round(mindfulThis),
      lateDelta,
      lateThis,
      lateLast,
      coffeeThis,
      coffeeLast,
      daysWithin,
      totalDays,
    };
    }, [expenses]);
  if (loading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <header>
            <h1 className="text-3xl font-semibold tracking-tight">This Week</h1>
          </header>
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
            Here's how your spending habits evolved this week. Celebrate your progress, notice
            recurring patterns, and discover small changes that can lead to healthier financial
            decisions.
          </p>
        </header>
        <section className="grid gap-4 sm:grid-cols-2">
          <MetricCard
            icon={Sprout}
            emoji="🌱"
            title="Mindfulness"
            value={
              metrics.mindfulDelta === 0
                ? `You stayed as mindful as last week`
                : metrics.mindfulDelta > 0
                  ? `You became ${metrics.mindfulDelta}% more mindful than last week.`
                  : `You were ${Math.abs(metrics.mindfulDelta)}% less mindful than last week.`
            }
            sub={`${metrics.mindfulThis}% of purchases logged as calm this week`}
            positive={metrics.mindfulDelta >= 0}
          />
          <MetricCard
            icon={Moon}
            emoji="🌙"
            title="Late-night spending"
            value={
              metrics.lateLast === 0 && metrics.lateThis === 0
                ? `No late-night spending — nice.`
                : metrics.lateDelta <= 0
                  ? `Late-night spending decreased by ${Math.abs(metrics.lateDelta)}%.`
                  : `Late-night spending increased by ${metrics.lateDelta}%.`
            }
            sub={`${metrics.lateThis} late-night purchases this week`}
            positive={metrics.lateDelta <= 0}
          />
          <MetricCard
            icon={Coffee}
            emoji="☕"
            title="Coffee purchases"
            value={
              metrics.coffeeThis === metrics.coffeeLast
                ? `Coffee runs stayed at ${metrics.coffeeThis}.`
                : metrics.coffeeThis < metrics.coffeeLast
                  ? `Coffee purchases dropped from ${metrics.coffeeLast} to ${metrics.coffeeThis}.`
                  : `Coffee purchases rose from ${metrics.coffeeLast} to ${metrics.coffeeThis}.`
            }
            sub="Add a note like 'coffee' when saving to track this"
            positive={metrics.coffeeThis <= metrics.coffeeLast}
          />
           <MetricCard
            icon={Target}
            emoji="🎯"
            title="Budget days"
            value={`You stayed within your budget on ${metrics.daysWithin} of ${metrics.totalDays} days.`}
            sub="Compared to last week's daily average"
            positive={metrics.daysWithin >= Math.ceil(metrics.totalDays / 2)}
          />
        </section>
        <p className="text-center text-sm text-muted-foreground">
          Small shifts, big change. Keep noticing. 💜
        </p>
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
          {positive ? (
            <TrendingDown className="h-4 w-4 text-accent" />
          ) : (
            <TrendingUp className="h-4 w-4 text-destructive" />
          )}
          <Icon className="hidden" />
        </span>
      </div>
      <p className="mt-3 text-base leading-relaxed">{value}</p>
      <p className="mt-2 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}