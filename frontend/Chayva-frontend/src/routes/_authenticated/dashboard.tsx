import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Sparkles, TrendingUp, Wallet, Calendar, RefreshCw, AlertTriangle } from "lucide-react";
import { useExpenses } from "@/lib/expense-context";
import { useCoaching } from "@/lib/coaching-context";
import { CountUp, PageTransition, CategoryIcon } from "@/lib/ui-helpers";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

const COLORS = [
  "oklch(0.72 0.19 300)",
  "oklch(0.78 0.15 195)",
  "oklch(0.75 0.18 85)",
  "oklch(0.7 0.2 15)",
  "oklch(0.68 0.17 145)",
  "oklch(0.7 0.2 260)",
];

function localSpendTotals(expenses: { amount: number; date: string }[]) {
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = Date.now() - 7 * 86400000;
  let todaySpend = 0;
  let weekSpend = 0;
  for (const expense of expenses) {
    const date = expense.date.slice(0, 10);
    if (date === today) todaySpend += expense.amount;
    const ts = new Date(expense.date).getTime();
    if (!Number.isNaN(ts) && ts >= weekAgo) weekSpend += expense.amount;
  }
  return { todaySpend, weekSpend };
}

function DashboardPage() {
  const { expenses } = useExpenses();
  const { snapshot, loading, error, refetch } = useCoaching();
  const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null);
  const localTotals = useMemo(() => localSpendTotals(expenses), [expenses]);

  const totals = useMemo(() => {
    return {
      all: snapshot?.stats.total_spent ?? expenses.reduce((s, e) => s + e.amount, 0),
      today: snapshot?.stats.today_spend ?? localTotals.todaySpend,
      week: snapshot?.stats.weekly_spend ?? localTotals.weekSpend,
      count: snapshot?.stats.expense_count ?? expenses.length,
      mindfulness: snapshot?.personality.mindfulness_score ?? snapshot?.spend_dna?.mindfulness_score ?? null,
    };
  }, [expenses, localTotals, snapshot]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    Object.entries(snapshot?.analytics.categories ?? {}).forEach(([category, amount]) => map.set(category, amount));
    if (map.size === 0) {
      expenses.forEach((e) => map.set(e.category, (map.get(e.category) ?? 0) + e.amount));
    }
    return Array.from(map, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [expenses, snapshot]);

  const coachHeadline =
    snapshot?.coach.headline ??
    snapshot?.coach.behavior_insight ??
    snapshot?.weekly.weekly_narrative ??
    null;

  const personality = snapshot?.personality;
  const trigger = snapshot?.trigger;
  const nudge = snapshot?.nudge;
  const timeline = snapshot?.behavior_timeline ?? [];

  return (
    <PageTransition>
      <div className="space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-accent">Your coach</p>
            <h1 className="mt-1 text-4xl font-semibold tracking-tight md:text-5xl">Good to see you.</h1>
            <p className="mt-2 text-base text-muted-foreground">Chayva is reading why you spend, not just what you spend.</p>
          </div>
          <Link
            to="/add"
            className="rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-glow)] transition hover:scale-[1.03] active:scale-[0.98]"
          >
            + Add expense
          </Link>
        </header>

        {/* 1. Today's Coach */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/15 via-accent/10 to-transparent p-8 md:p-10"
        >
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/30 blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-[var(--shadow-glow)]">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-accent">Today&apos;s Coach</p>
                  <h2 className="text-xl font-semibold md:text-2xl">Your behavioral read right now</h2>
                </div>
              </div>
              <button
                onClick={() => void refetch()}
                disabled={loading}
                aria-label="Refresh dashboard"
                className="rounded-full border border-foreground/10 bg-foreground/5 p-2 text-muted-foreground transition hover:text-foreground disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="mt-6 min-h-[5rem] text-lg leading-relaxed text-foreground/90 md:text-2xl">
              {loading && !coachHeadline ? (
                <div className="space-y-2">
                  <div className="h-5 w-4/5 animate-pulse rounded bg-foreground/10" />
                  <div className="h-5 w-3/5 animate-pulse rounded bg-foreground/10" />
                </div>
              ) : coachHeadline ? (
                <p>{coachHeadline}</p>
              ) : expenses.length === 0 ? (
                <p className="text-muted-foreground">Add a few expenses and your coach will start explaining the why behind them.</p>
              ) : null}
            </div>

            {snapshot?.coach.behavior_insight && snapshot.coach.behavior_insight !== coachHeadline ? (
              <p className="mt-4 text-base text-muted-foreground">{snapshot.coach.behavior_insight}</p>
            ) : null}

            <p className="mt-4 text-sm text-muted-foreground">
              Suggestion: {snapshot?.coach.coach_suggestion ?? nudge?.suggested_action ?? "Keep logging mood and notes with each expense."}
            </p>
          </div>
        </motion.section>

        {error ? (
          <section className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>{error}</span>
              <button onClick={() => void refetch()} className="rounded-lg border border-destructive/30 px-3 py-1">Retry</button>
            </div>
          </section>
        ) : null}

        {/* 2. Prediction */}
        <section className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-accent" />
            <p className="text-xs uppercase tracking-[0.2em] text-accent">Prediction</p>
          </div>
          <h2 className="mt-2 text-lg font-semibold">What your coach sees coming</h2>
          <p className="mt-3 text-base leading-relaxed">
            {nudge?.prediction ?? snapshot?.coach.today_prediction ?? "No current prediction yet — add a few expenses with mood and notes so the backend coach can identify patterns."
            }
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <OverviewField label="Suggested action" value={nudge?.suggested_action ?? snapshot?.coach.coach_suggestion ?? "Keep logging mood and notes — the backend coach will turn that context into a more specific action."} />
            <OverviewField label="Risk level" value={nudge?.risk_level ?? trigger?.current_trigger_risk} />
            <OverviewField label="Confidence" value={nudge?.confidence != null ? `${Math.round(nudge.confidence * 100)}%` : null} />
            <OverviewField label="Upcoming risk" value={nudge?.upcoming_risk ?? trigger?.top_trigger} />
          </div>
        </section>

        {/* 3. Behavior overview */}
        <section className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold">Behavior overview</h2>
          <p className="text-xs text-muted-foreground">Live read from your latest AI coaching snapshot</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <OverviewField label="Behavior trend" value={snapshot?.weekly.behavior_changes} />
            <OverviewField label="Mindfulness" value={totals.mindfulness != null ? `${totals.mindfulness}/100` : null} />
            <OverviewField label="Behavior pattern" value={snapshot?.spend_dna?.behavior_pattern ?? trigger?.recurring_pattern} />
            <OverviewField label="Coach advice" value={personality?.coach_advice ?? snapshot?.weekly.coach_recommendation} />
          </div>
        </section>

        {/* 4. Current personality */}
        <section className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold">Current personality</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <OverviewField label="Type" value={personality?.type ?? personality?.personality_type} />
            <OverviewField label="Confidence" value={personality?.confidence != null ? `${Math.round(personality.confidence * 100)}%` : null} />
            <OverviewField label="Reason" value={personality?.confidence_reason} />
            <OverviewField label="Last updated" value={personality?.last_updated ? new Date(personality.last_updated).toLocaleDateString() : null} />
          </div>
          {personality?.description ? (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{personality.description}</p>
          ) : null}
        </section>

        {/* 5. Current trigger */}
        <section className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold">Current trigger</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <OverviewField label="Today&apos;s trigger" value={trigger?.today_trigger ?? trigger?.top_trigger} />
            <OverviewField label="Most frequent" value={trigger?.most_frequent_trigger ?? trigger?.top_trigger} />
            <OverviewField label="Trigger risk" value={trigger?.current_trigger_risk} />
            <OverviewField label="Mood cue" value={trigger?.mood_trigger} />
          </div>
        </section>

        {/* 6. Quick stats */}
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Wallet} label="Total spent" value={totals.all} prefix="₹" decimals={2} />
          <StatCard icon={Calendar} label="Today" value={totals.today} prefix="₹" decimals={2} />
          <StatCard icon={TrendingUp} label="Weekly spend" value={totals.week} prefix="₹" decimals={2} />
          <StatCard icon={Wallet} label="Expense count" value={totals.count} />
        </section>

        {/* 7. ONE analytics section */}
        <section className="glass rounded-2xl p-6">
          <div>
            <h2 className="text-lg font-semibold">Spending by category</h2>
            <p className="text-xs text-muted-foreground">One chart to support the coach — not replace it</p>
          </div>
          {byCategory.length > 0 ? (
            <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byCategory} dataKey="value" innerRadius={50} outerRadius={82} paddingAngle={3}>
                      {byCategory.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "var(--popover, #1a1a2e)", border: "1px solid oklch(0.6 0 0 / 0.2)", borderRadius: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-2 text-sm">
                {byCategory.slice(0, 6).map((c, i) => (
                  <li key={c.name} className="flex items-center justify-between gap-2 rounded-xl border border-foreground/10 bg-background/40 px-3 py-2">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <CategoryIcon name={c.name} className="h-3.5 w-3.5 text-muted-foreground" />
                      {c.name}
                    </span>
                    <span className="text-muted-foreground">₹{c.value.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Category patterns appear once you log a few expenses.</p>
          )}
        </section>

        {/* Behavior timeline */}
        <section className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold">Behavior timeline</h2>
          <p className="text-xs text-muted-foreground">How your spending mood has moved across the week</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
            {(timeline.length ? timeline : []).map((entry) => (
              <div key={entry.date ?? entry.day} className="rounded-2xl border border-foreground/10 bg-background/40 p-4 text-center">
                <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">{entry.day}</p>
                <p className="mt-2 text-2xl">{entry.emoji}</p>
                <p className="mt-2 text-sm font-medium">{entry.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 8. Recent expenses */}
        <section className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Recent expenses</h2>
              <p className="text-xs text-muted-foreground">Latest moments your coach is reading</p>
            </div>
            <Link to="/expenses" className="text-sm text-primary hover:underline">View all →</Link>
          </div>
          <div className="mt-4 space-y-3">
            {expenses.slice(0, 5).map((expense) => {
              const insight = expense.insight && typeof expense.insight === "object" ? expense.insight as Record<string, unknown> : null;
              const expanded = expandedExpenseId === expense.id;
              return (
                <div key={expense.id} className="rounded-2xl border border-foreground/10 bg-background/40 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">₹{expense.amount.toFixed(2)} • {expense.category}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{expense.notes ?? "No note"}</p>
                    </div>
                    <button
                      onClick={() => setExpandedExpenseId(expanded ? null : expense.id)}
                      className="rounded-full border border-foreground/10 px-2.5 py-1 text-xs text-muted-foreground"
                    >
                      {expanded ? "Hide" : "Details"}
                    </button>
                  </div>
                  <p className="mt-3 text-sm text-foreground/85">
                    {insight?.insight ? String(insight.insight) : "AI analysis pending for this expense."}
                  </p>
                  {expanded ? (
                    <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
                      <OverviewField label="Behavior" value={String(insight?.behavior ?? insight?.spending_type ?? "—")} />
                      <OverviewField label="Emotion" value={String(insight?.emotion ?? expense.mood ?? "—")} />
                      <OverviewField label="Trigger" value={String(insight?.detected_trigger ?? "—")} />
                      <OverviewField label="Suggestion" value={String(insight?.suggestion ?? "—")} />
                      <OverviewField label="Confidence" value={insight?.confidence != null ? `${Math.round(Number(insight.confidence) * 100)}%` : "—"} />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </PageTransition>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  prefix = "",
  decimals = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  prefix?: string;
  decimals?: number;
}) {
  return (
    <motion.div whileHover={{ y: -3 }} className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">{label}</span>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-foreground/5">
          <Icon className="h-4 w-4 text-accent" />
        </span>
      </div>
      <div className="mt-3 text-2xl font-semibold tabular-nums">
        <CountUp value={value} prefix={prefix} decimals={decimals} />
      </div>
    </motion.div>
  );
}

function OverviewField({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="rounded-2xl border border-foreground/10 bg-background/40 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-base font-medium leading-snug">{value ?? "—"}</p>
    </div>
  );
}

export function CircularScore({ value, size = 120 }: { value: number; size?: number }) {
  const r = size / 2 - 8;
  const c = 2 * Math.PI * r;
  const clamp = Math.max(0, Math.min(100, value));
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={8} className="fill-none stroke-foreground/10" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={8}
          strokeLinecap="round"
          className="fill-none"
          stroke="url(#scoreGradient)"
          initial={{ strokeDasharray: `0 ${c}` }}
          animate={{ strokeDasharray: `${(clamp / 100) * c} ${c}` }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
        <defs>
          <linearGradient id="scoreGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.72 0.19 300)" />
            <stop offset="100%" stopColor="oklch(0.78 0.15 195)" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
