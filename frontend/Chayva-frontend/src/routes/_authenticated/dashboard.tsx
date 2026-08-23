import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  RefreshCw,
  ChevronDown,
  Sparkles,
  Plus,
  ArrowRight,
} from "lucide-react";
import { useExpenses } from "@/lib/expense-context";
import { useCoaching } from "@/lib/coaching-context";
import {
  PageTransition,
  CategoryIcon,
  CountUp,
  InsightFlow,
  EmptyLearningState,
  BehaviorTag,
  MoodBadge,
  TimeWindowBadge,
  LoadingSkeleton,
} from "@/lib/ui-helpers";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

// ---------------------------------------------------------------------------
// Chart palette — violet family
// ---------------------------------------------------------------------------
const CHART_COLORS = [
  "oklch(0.72 0.19 300)",
  "oklch(0.72 0.16 192)",
  "oklch(0.72 0.18 85)",
  "oklch(0.68 0.20 15)",
  "oklch(0.65 0.17 145)",
  "oklch(0.70 0.20 260)",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function getGreeting() {
  const h = new Date().getHours();
  if (h < 5) return "Late night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good evening";
}

function getGreetingEmoji() {
  const h = new Date().getHours();
  if (h < 5) return "🌙";
  if (h < 12) return "☀️";
  if (h < 17) return "🌤️";
  return "🌆";
}

function formatDate() {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

function DashboardPage() {
  const { expenses } = useExpenses();
  const { snapshot, loading, error, refetch } = useCoaching();
  const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null);

  const localTotals = useMemo(() => localSpendTotals(expenses), [expenses]);

  const totals = useMemo(() => ({
    all: snapshot?.stats.total_spent ?? expenses.reduce((s, e) => s + e.amount, 0),
    today: snapshot?.stats.today_spend ?? localTotals.todaySpend,
    week: snapshot?.stats.weekly_spend ?? localTotals.weekSpend,
    count: snapshot?.stats.expense_count ?? expenses.length,
  }), [expenses, localTotals, snapshot]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    Object.entries(snapshot?.analytics.categories ?? {}).forEach(([category, amount]) =>
      map.set(category, amount)
    );
    if (map.size === 0) {
      expenses.forEach((e) => map.set(e.category, (map.get(e.category) ?? 0) + e.amount));
    }
    return Array.from(map, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [expenses, snapshot]);

  const coachObservation = snapshot?.coach.headline ?? snapshot?.coach.behavior_insight ?? null;
  const coachEvidence = snapshot?.coach.detected_pattern ?? null;
  const coachPrediction = snapshot?.coach.today_prediction ?? null;
  const coachSuggestion = snapshot?.coach.coach_suggestion ?? snapshot?.nudge?.suggested_action ?? null;

  const recentExpenses = expenses.slice(0, 4);
  const behaviorTimeline = snapshot?.behavior_timeline ?? [];

  // Is data genuinely not yet available?
  const hasNoInsight = !loading && !coachObservation && expenses.length > 0;
  const isFirstUser = !loading && expenses.length === 0;

  return (
    <PageTransition>
      <div className="space-y-7 max-w-5xl">

        {/* ================================================================= */}
        {/* HEADER — Greeting                                                  */}
        {/* ================================================================= */}
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{formatDate()}</p>
            <h1 className="chayva-headline mt-1 text-3xl text-foreground md:text-4xl">
              {getGreeting()} {getGreetingEmoji()}
            </h1>
            <p className="mt-1.5 text-base text-muted-foreground">
              {isFirstUser
                ? "Welcome to Chayva."
                : "Here's what Chayva noticed."}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => void refetch()}
              disabled={loading}
              aria-label="Refresh"
              className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-background/60 text-muted-foreground transition hover:text-foreground disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <Link
              to="/add"
              className="flex items-center gap-2 rounded-xl bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-glow),var(--shadow-glow-sm)] active:translate-y-0"
            >
              <Plus className="h-4 w-4" />
              Add expense
            </Link>
          </div>
        </header>

        {/* ================================================================= */}
        {/* ERROR STATE                                                        */}
        {/* ================================================================= */}
        {error && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-destructive/25 bg-destructive/8 px-5 py-4 text-sm text-destructive">
            <span>{error}</span>
            <button
              onClick={() => void refetch()}
              className="rounded-lg border border-destructive/30 px-3 py-1 transition hover:bg-destructive/10"
            >
              Retry
            </button>
          </div>
        )}

        {/* ================================================================= */}
        {/* BEHAVIORAL HERO — primary observation                             */}
        {/* The most important element on the page. Dominant visual.          */}
        {/* ================================================================= */}
        {isFirstUser ? (
          <EmptyLearningState
            icon={Sparkles}
            title="Chayva is ready to learn your rhythm."
            description="Add your first expense — with a note on your mood and what triggered it. Your first few entries help Chayva understand what's routine, what's reactive, and what patterns are forming."
            action={
              <Link
                to="/add"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
              >
                <Plus className="h-4 w-4" />
                Log your first expense
              </Link>
            }
          />
        ) : (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-3xl border border-primary/15 p-7 md:p-9"
            style={{ background: "var(--gradient-hero)" }}
          >
            {/* Ambient background glow */}
            <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
            <div aria-hidden className="pointer-events-none absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-accent/10 blur-2xl" />

            <div className="relative">
              {/* Eyebrow */}
              <div className="flex items-center gap-2 mb-4">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-gradient-primary text-primary-foreground shadow-[var(--shadow-glow-sm)]">
                  <Sparkles className="h-3 w-3" />
                </span>
                <p className="chayva-eyebrow">Something Chayva noticed</p>
              </div>

              {/* Primary observation — dominant typography */}
              {loading && !coachObservation ? (
                <LoadingSkeleton lines={2} className="max-w-xl" />
              ) : coachObservation ? (
                <h2 className="chayva-headline text-2xl text-foreground md:text-3xl max-w-2xl">
                  {coachObservation}
                </h2>
              ) : hasNoInsight ? (
                <h2 className="text-xl font-semibold text-foreground/80 max-w-2xl">
                  Chayva is still learning your spending rhythm.
                </h2>
              ) : null}

              {/* Supporting insight */}
              {coachEvidence && (
                <p className="mt-3 text-base leading-relaxed text-foreground/70 max-w-xl">
                  {coachEvidence}
                </p>
              )}

              {/* Prediction — cautious framing */}
              {coachPrediction && (
                <div className="mt-5 rounded-2xl border border-foreground/10 bg-foreground/[0.03] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground mb-1">What this may mean</p>
                  <p className="text-sm leading-relaxed text-foreground/80">{coachPrediction}</p>
                </div>
              )}

              {/* Suggestion */}
              {coachSuggestion && (
                <p className="mt-4 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground/70">Worth noticing: </span>
                  {coachSuggestion}
                </p>
              )}

              {/* Learning state — not enough data yet */}
              {hasNoInsight && (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground max-w-lg">
                  Keep logging expenses with mood and notes. Chayva learns with every entry and will start noticing patterns in your behavior.
                </p>
              )}
            </div>
          </motion.section>
        )}

        {/* ================================================================= */}
        {/* SPENDING RHYTHM — behavior timeline strip                         */}
        {/* Supports the story. Does not dominate it.                         */}
        {/* ================================================================= */}
        {behaviorTimeline.length > 0 && (
          <section className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="chayva-eyebrow">Spending rhythm</p>
                <p className="text-xs text-muted-foreground mt-0.5">How your week is moving</p>
              </div>
              <span className="text-xs text-muted-foreground">7 days</span>
            </div>
            <div className="flex items-end gap-1.5">
              {behaviorTimeline.map((entry) => {
                const maxH = 56;
                const h = Math.max(12, maxH * 0.6); // base height; all same since we don't have magnitude
                return (
                  <div key={entry.date ?? entry.day} className="flex flex-1 flex-col items-center gap-1.5">
                    <span className="text-lg leading-none" title={entry.label}>{entry.emoji}</span>
                    <div
                      className="w-full rounded-t-md bg-gradient-primary opacity-60"
                      style={{ height: h }}
                    />
                    <p className="text-[0.6rem] uppercase tracking-[0.1em] text-muted-foreground text-center">
                      {entry.day?.slice(0, 2)}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ================================================================= */}
        {/* QUICK CONTEXT — spending numbers as supporting facts, not heroes   */}
        {/* ================================================================= */}
        {!isFirstUser && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Today", value: totals.today, prefix: "₹", decimals: 0 },
              { label: "This week", value: totals.week, prefix: "₹", decimals: 0 },
              { label: "Total logged", value: totals.all, prefix: "₹", decimals: 0 },
              { label: "Expenses", value: totals.count, prefix: "", decimals: 0 },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                whileHover={{ y: -2 }}
                className="glass rounded-2xl px-4 py-4"
              >
                <p className="chayva-eyebrow text-muted-foreground" style={{ fontSize: "0.6rem" }}>
                  {stat.label}
                </p>
                <p className="mt-2 text-xl font-bold tabular-nums tracking-tight">
                  <CountUp value={stat.value} prefix={stat.prefix} decimals={stat.decimals} />
                </p>
              </motion.div>
            ))}
          </div>
        )}

        {/* ================================================================= */}
        {/* CATEGORY DISTRIBUTION — supports the behavioral story             */}
        {/* ================================================================= */}
        {byCategory.length > 0 && (
          <section className="glass rounded-2xl p-6">
            <div className="mb-5">
              <p className="chayva-eyebrow">Where your money went</p>
              <p className="text-xs text-muted-foreground mt-0.5">Supporting context for the behavioral read</p>
            </div>
            <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
              {/* Category list — compact */}
              <ul className="space-y-2">
                {byCategory.slice(0, 6).map((c, i) => (
                  <li
                    key={c.name}
                    className="flex items-center justify-between gap-3 rounded-xl border border-foreground/8 bg-background/30 px-3 py-2.5"
                  >
                    <span className="flex items-center gap-2.5">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                      />
                      <CategoryIcon
                        name={c.name}
                        className="h-3.5 w-3.5 text-muted-foreground"
                      />
                      <span className="text-sm font-medium">{c.name}</span>
                    </span>
                    <span className="text-sm tabular-nums text-muted-foreground">
                      ₹{c.value.toFixed(0)}
                    </span>
                  </li>
                ))}
              </ul>
              {/* Pie chart */}
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={byCategory}
                      dataKey="value"
                      innerRadius={48}
                      outerRadius={78}
                      paddingAngle={2}
                    >
                      {byCategory.map((_, i) => (
                        <Cell
                          key={i}
                          fill={CHART_COLORS[i % CHART_COLORS.length]}
                          opacity={0.85}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                        fontSize: 13,
                      }}
                      formatter={(v: number) => [`₹${v.toFixed(0)}`, ""]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        )}

        {/* ================================================================= */}
        {/* RECENT BEHAVIORAL JOURNAL — last 4 expenses                       */}
        {/* ================================================================= */}
        {recentExpenses.length > 0 && (
          <section className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="chayva-eyebrow">Recent journal</p>
                <p className="text-xs text-muted-foreground mt-0.5">Latest moments Chayva is reading</p>
              </div>
              <Link
                to="/expenses"
                className="flex items-center gap-1 text-sm font-medium text-primary transition hover:text-primary/80"
              >
                View all
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {recentExpenses.map((expense) => {
                const insight =
                  expense.insight && typeof expense.insight === "object"
                    ? (expense.insight as Record<string, unknown>)
                    : null;
                const expanded = expandedExpenseId === expense.id;
                const insightText = insight?.insight ? String(insight.insight) : null;
                const behavior = insight?.behavior ?? insight?.spending_type;
                const classificationObj = insight?.expense_classification as Record<string, unknown> | null;
                const classification = classificationObj?.classification ? String(classificationObj.classification) : null;

                return (
                  <div
                    key={expense.id}
                    className="rounded-2xl border border-foreground/8 bg-background/30 overflow-hidden"
                  >
                    {/* Collapsed row */}
                    <button
                      onClick={() =>
                        setExpandedExpenseId(expanded ? null : expense.id)
                      }
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-foreground/[0.03]"
                    >
                      {/* Category icon */}
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/8">
                        <CategoryIcon
                          name={expense.category}
                          className="h-4 w-4 text-primary"
                        />
                      </span>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold">{expense.category}</span>
                          {expense.notes && (
                            <span className="text-xs text-muted-foreground truncate max-w-[12rem]">
                              · {expense.notes}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2.5 mt-0.5 flex-wrap">
                          <TimeWindowBadge dateStr={expense.date} />
                          <MoodBadge mood={expense.mood} />
                          {classification && (
                            <BehaviorTag label={classification} />
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-bold tabular-nums">
                          ₹{expense.amount.toFixed(0)}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 text-muted-foreground transition-transform ${
                            expanded ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </button>

                    {/* Expanded — behavioral insight */}
                    <AnimatePresence initial={false}>
                      {expanded && (
                        <motion.div
                          key="expanded"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-foreground/8 px-4 pb-4 pt-3">
                            {insightText ? (
                              <InsightFlow
                                compact
                                data={{
                                  observation: insightText,
                                  evidence: insight?.detected_trigger
                                    ? `Trigger: ${String(insight.detected_trigger)}`
                                    : null,
                                  interpretation: insight?.suggestion
                                    ? String(insight.suggestion)
                                    : null,
                                }}
                              />
                            ) : (
                              <p className="text-xs text-muted-foreground italic">
                                Chayva is still processing this expense.
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground pb-2">
          Chayva learns more with every entry you make.
        </p>
      </div>
    </PageTransition>
  );
}
